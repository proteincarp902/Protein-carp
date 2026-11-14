const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ExcelJS=require('exceljs');
const {hrEnvironment,source}=require('./hr-helpers.cjs');
function browserExcel(c){Object.assign(c,{clearTimeout,setImmediate,clearImmediate});vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../assets/vendor/exceljs-4.4.0.min.js'),'utf8'),c);return c.window.ExcelJS;}
function setup(){
 const e=hrEnvironment(),c=e.c;
 for(const f of ['payroll.js','payroll-excel.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../'+f),'utf8'),c,{filename:f});
 const employee={...e.employee,odooEmployeeId:'1001',hireDate:'2026-01-01',section:'حلويات',payrollDepartment:'المطبخ',payrollBranchName:'البترجي',jobTitle:'شيف حلويات',monthlySalary:3100,payrollBasicSalary:2500,payrollHousingAllowance:400,payrollTransportAllowance:200,payrollInsuranceAmount:100,payrollGroup:'النظامين',payrollPaymentMethod:'تحويل'};
 c.pcRaw.hrEmployees=[employee];c.pcRaw.hrAttendance=[];c.pcRaw.hrLeaves=[];
 const absent=['2026-10-05','2026-10-06'],unpaidFrom='2026-10-09',unpaidTo='2026-10-12';
 for(let d='2026-10-01';d<='2026-10-31';d=c.pcHrAddDays(d,1))if(c.pcHrWorkday(employee,d)&&!absent.includes(d)&&!(d>=unpaidFrom&&d<=unpaidTo)&&d!=='2026-10-20')c.pcRaw.hrAttendance.push({employeeId:employee.id,day:d,inMs:e.at(d,9),outMs:e.at(d,17)});
 c.pcRaw.hrLeaves=[{employeeId:employee.id,kind:'leave',type:'بدون راتب',from:unpaidFrom,to:unpaidTo,status:'معتمدة'},{employeeId:employee.id,kind:'leave',type:'سنوية',from:'2026-10-20',to:'2026-10-20',status:'معتمدة'},
 {employeeId:employee.id,kind:'pen',day:'2026-10-07',penType:'days',value:1.5,status:'معتمدة'},
 {employeeId:employee.id,kind:'pen',day:'2026-10-08',penType:'amount',value:75.25,status:'معتمدة'},
 {employeeId:employee.id,kind:'pen',day:'2026-10-09',penType:'amount',value:999,status:'بانتظار الموارد البشرية'},
 {employeeId:employee.id,kind:'pen',day:'2026-10-10',penType:'warn',value:0,status:'معتمدة'}];
 c.pcPayrollF={month:'2026-10',branch:'',section:''};return {...e,c,employee};
}
test('net payroll uses actual calendar month, approved deductions and registered insurance',()=>{
 const {c}=setup(),r=c.pcPayrollGroups()[0].rows[0];assert.equal(r.monthDays,31);assert.equal(r.dayRate,100);assert.equal(r.serviceDays,31);assert.equal(r.absentDays,2);assert.equal(r.unpaidDays,4);assert.equal(r.penaltyDays,1.5);assert.equal(r.insuranceAmount,100);assert.equal(r.gross,3100);assert.equal(r.totalDeductions,925.25);assert.equal(r.net,2174.75);
});
test('month length includes leap February and does not use the source fixed 30-day assumption',()=>{
 const {c}=setup();for(const [month,n] of [['2024-02',29],['2025-02',28],['2026-10',31],['2026-04',30]]){c.pcPayrollF.month=month;assert.equal(c.pcPayrollPeriod().days,n);}
 c.pcPayrollF.month='2026-13';assert.ok(c.pcPayrollValidate());c.pcPayrollF.month='2026-12';assert.ok(c.pcPayrollValidate());
});
test('employment boundaries prorate salary while keeping insurance as the entered monthly amount',()=>{
 const {c,employee}=setup();employee.hireDate='2026-10-15';employee.endDate='2026-10-20';employee.status='منتهي الخدمة';const r=c.pcPayrollGroups()[0].rows[0];assert.equal(r.serviceDays,6);assert.equal(r.gross,600);assert.equal(r.absentDays,0);assert.equal(r.penaltyAmount,0);assert.equal(r.net,500);
});
test('same department combines branches and branch/department filters retain unassigned staff',()=>{
 const {c,employee}=setup();c.pcRaw.hrEmployees.push({...employee,id:'emp2',name:'موظف آخر',payrollBranchName:'الرحيلي'},{...employee,id:'emp3',name:'بدون قسم',payrollDepartment:'',section:'',payrollGroup:'غير نظامين'});
 const groups=c.pcPayrollGroups();assert.equal(groups.length,2);assert.equal(groups.find(g=>g.section==='المطبخ').rows.length,2);assert.ok(groups.some(g=>g.section===''));
 c.pcPayrollF.branch='الرحيلي';assert.equal(c.pcPayrollGroups()[0].rows.length,1);assert.equal(c.pcPayrollGroups()[0].rows[0].e.id,'emp2');c.pcPayrollF.branch='';c.pcPayrollF.section=JSON.stringify('');assert.equal(c.pcPayrollGroups().length,1);assert.equal(c.pcPayrollGroups()[0].rows[0].e.id,'emp3');
});
test('missing and zero salary remain distinct; negative net is visible for review',()=>{
 const {c,employee}=setup();employee.monthlySalary=null;delete employee.payrollBasicSalary;const r=c.pcPayrollGroups()[0].rows[0];assert.equal(r.net,null);assert.equal(c.pcPayrollTotals([r]).missing,1);
 employee.monthlySalary=0;const zero=c.pcPayrollGroups()[0].rows[0];assert.equal(zero.salary,0);assert.ok(zero.net<0);assert.ok(zero.notes.some(n=>n.includes('تتجاوز')));assert.equal(c.pcPayrollTotals([zero]).missing,0);
});
test('current month is provisional and cannot charge today before shift ends',()=>{
 const {c,employee}=setup();c.pcPayrollF.month='2026-11';const p=c.pcPayrollPeriod();assert.equal(p.partial,true);assert.equal(p.to,'2026-11-14');const before=c.pcPayrollRow(employee,p);employee.shiftEnd='11:00';const after=c.pcPayrollRow(employee,p);assert.equal(after.absentDays,before.absentDays+1);
});
test('styled workbook matches source sheets, 21 headers, department subtotals and formulas',async()=>{
 const {c}=setup(),groups=c.pcPayrollGroups(),wb=c.pcPayrollWorkbook(browserExcel(c),groups);assert.deepEqual(Array.from(wb.worksheets,s=>s.name),['الملخص','النظامين','غير نظامين','الافتراضات']);assert.equal(wb.getWorksheet('الافتراضات').getCell('B5').value,31);
 const bank=wb.getWorksheet('النظامين');assert.equal(bank.views[0].rightToLeft,true);assert.equal(bank.getCell('A4').fill.fgColor.argb,'FF1F4E78');assert.equal(bank.getCell('U4').value,'Odoo ID');assert.equal(bank.getCell('E5').value,'مرتبات المطبخ');assert.equal(bank.getCell('G6').value,2500);assert.equal(bank.getCell('H6').value,400);assert.equal(bank.getCell('I6').value,200);assert.equal(bank.getCell('M6').value,100);assert.equal(bank.getCell('L6').value.result,3100);assert.equal(bank.getCell('N6').value.result,225.25);assert.equal(bank.getCell('O6').value.result,600);assert.equal(bank.getCell('R6').value.result,2174.75);assert.equal(bank.getCell('N6').fill.fgColor.argb,'FFFFF2CC');assert.equal(bank.getCell('R7').value.result,2174.75);assert.equal(wb.getWorksheet('الملخص').getCell('F5').value.result,2174.75);
 const loaded=new ExcelJS.Workbook();await loaded.xlsx.load(Buffer.from(await wb.xlsx.writeBuffer()));assert.equal(loaded.getWorksheet('النظامين').getCell('R6').value.result,2174.75);assert.equal(loaded.getWorksheet('الملخص').getCell('C5').value.formula,"'النظامين'!R7");
});
test('unclassified and unknown salaries remain explicit in Excel instead of being dropped',()=>{
 const {c,employee}=setup();employee.payrollGroup='';employee.monthlySalary=null;delete employee.payrollBasicSalary;const wb=c.pcPayrollWorkbook(browserExcel(c),c.pcPayrollGroups());assert.ok(wb.getWorksheet('غير مصنف'));assert.equal(wb.getWorksheet('غير مصنف').getCell('R6').value,null);assert.equal(wb.getWorksheet('الملخص').getCell('G5').value,1);assert.equal(wb.getWorksheet('الملخص').getCell('H5').value.result||0,0);
});
test('payroll access requires both employee-file and attendance permissions',()=>{
 const {c}=setup();c.pcEmpSessionRaw=()=>true;c.pcEmpIsAdmin=()=>false;let perms=new Set(['set.hrEmp']);c.pcCan=k=>perms.has(k);vm.runInContext(source('pcSetCan'),c);assert.equal(c.pcSetCan('hrPayroll'),false);assert.equal(c.pcPayrollGroups().length,0);perms.add('set.hrAtt');assert.equal(c.pcSetCan('hrPayroll'),true);assert.equal(c.pcPayrollGroups().length,1);perms.delete('set.hrEmp');assert.equal(c.pcPayrollGroups().length,0);
});
test('Odoo matching imports requested financial and job fields without changing operational links',()=>{
 const {c,employee}=setup();const originalRole=employee.role,originalSection=employee.section,originalBranch=employee.branchId;c.pcHrPayrollMetadata={importedAtMs:10,rows:[{odooId:'1001',department:'الإدارة',branch:'الجيم',jobTitle:'مدير',paymentMethod:'نقدي',payrollGroup:'غير نظامين',basicSalary:4000,housingAllowance:1000,transportAllowance:500,insuranceAmount:125}]};
 const current=c.pcHrEmps()[0];assert.equal(current.monthlySalary,5500);assert.equal(current.payrollInsuranceAmount,125);assert.equal(current.payrollDepartment,'الإدارة');assert.equal(current.jobTitle,'مدير');assert.equal(current.payrollBranchName,'الجيم');assert.equal(current.role,originalRole);assert.equal(current.section,originalSection);assert.equal(current.branchId,originalBranch);assert.equal(employee.monthlySalary,3100);
 employee.payrollMetadataUpdatedAtMs=11;assert.equal(c.pcHrEmps()[0].monthlySalary,3100);
});
test('duplicate or missing Odoo IDs never match by employee name',()=>{
 const {c,employee}=setup();c.pcHrPayrollMetadata={importedAtMs:10,rows:[{odooId:'1001',jobTitle:'مختلف'}]};c.pcRaw.hrEmployees.push({...employee,id:'duplicate'});assert.equal(c.pcHrEmps()[0].jobTitle,'شيف حلويات');employee.odooEmployeeId='';assert.equal(c.pcHrEmps()[0].jobTitle,'شيف حلويات');assert.equal(c.pcHrOdooId('٠٠١٠٠١'),'1001');
});
test('source parser reads only specified columns and rejects financial cells without cached values',()=>{
 const {c}=setup();const rows=[[],[],[],[],['','','','','مرتبات الإدارة'],[1,'موظف','لا تُستورد','تحويل','محاسب','البترجي',3000,500,250,999,888,0,150,777,0,666,555,0,'لا تُستورد',30,1001]];
 c.XLSX={utils:{sheet_to_json:s=>s}};const workbook={SheetNames:['النظامين'],Sheets:{'النظامين':rows}},parsed=c.pcHrMetadataParse(workbook);assert.equal(parsed.length,1);assert.equal(parsed[0].department,'الإدارة');assert.equal(parsed[0].basicSalary,3000);assert.equal(parsed[0].insuranceAmount,150);assert.equal(parsed[0].paymentMethod,'تحويل');assert.equal(parsed[0].nationality,undefined);assert.equal(parsed[0].otherAllowance,undefined);assert.equal(parsed[0].advance,undefined);
 rows[5][12]='';assert.throws(()=>c.pcHrMetadataParse(workbook),/قيمة محفوظة/);
});
test('salary component fields calculate gross and keep insurance separate',()=>{
 const {c,employee}=setup();c.document.body.innerHTML='<div id="pcSheetHost"><input id="hrSalary" value="0">'+c.pcHrPayrollSalaryFields(employee)+'</div>';c.pcHrPayrollSalarySync();const total=c.document.getElementById('hrSalary');assert.equal(total.value,'3100');assert.equal(total.readOnly,true);c.document.getElementById('hrInsuranceAmount').value='200';let result=c.pcHrPayrollSalaryRead(c.document.body);assert.equal(result.data.monthlySalary,3100);assert.equal(result.data.payrollInsuranceAmount,200);c.document.getElementById('hrBasicSalary').value='';assert.ok(c.pcHrPayrollSalaryRead(c.document.body).error);
});
test('saving the employee component form persists gross, insurance and payment metadata together',async()=>{
 const {c,employee}=setup();Object.assign(c,{requestAnimationFrame:fn=>fn(),pcSheetResolve:null,pcHrRoleChanged:()=>{},PC_HR_ROLES:['كاشير'],PC_HR_STATUS:['نشط'],PC_HR_DAYS:['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'],pcChefExtraFields:()=>'',pcChefExtraRead:()=>({data:{odooEmployeeId:'1001'}}),pcPermSummary:()=>'',pcHrEmpSummary:()=>'',pcPermEditor:()=>false,pcDepts:()=>[],pcPermsOf:()=>[],pcHrSyncChef:async()=>{}});
 for(const name of ['pcSheetClose','pcSheet','pcHrEditEmployee'])vm.runInContext(source(name),c);
 let saved;c.window.firebaseDB.updateDoc=async(ref,data)=>{assert.equal(ref.path,'hr_employees/emp1');saved=data;};
 const pending=c.pcHrEditEmployee(employee.id);const set=(id,value)=>c.document.getElementById(id).value=value;
 set('hrBasicSalary','4500');set('hrHousingAllowance','1000');set('hrTransportAllowance','250');set('hrInsuranceAmount','175');c.pcHrPayrollSalarySync();assert.equal(c.document.getElementById('hrSalary').value,'5750');c.document.querySelector('[data-act="0"]').click();await pending;
 assert.equal(saved.monthlySalary,5750);assert.equal(saved.payrollBasicSalary,4500);assert.equal(saved.payrollHousingAllowance,1000);assert.equal(saved.payrollTransportAllowance,250);assert.equal(saved.payrollInsuranceAmount,175);assert.equal(saved.payrollPaymentMethod,'تحويل');assert.equal(saved.payrollDepartment,'المطبخ');assert.equal(saved.role,employee.role);assert.ok(saved.payrollMetadataUpdatedAtMs);
});
