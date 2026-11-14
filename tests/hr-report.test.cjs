const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {hrEnvironment,source}=require('./hr-helpers.cjs');
test('salary preserves optional/zero values and rejects negative, malformed and overprecise values',()=>{
 const {c}=hrEnvironment();for(const [raw,value] of [['',null],['0',0],['3500.75',3500.75],[' 2500 ',2500]]){assert.equal(c.pcHrSalaryParse(raw).value,value);assert.equal(c.pcHrSalaryParse(raw).error,'');}
 for(const raw of ['-1','abc','Infinity','1000000001','1.234'])assert.ok(c.pcHrSalaryParse(raw).error,raw);
});
test('report distinguishes absence, approved leave, rest days and missing punch-outs',()=>{
 const {c}=hrEnvironment();const rows=c.pcHrReportRows();assert.equal(rows.length,1);const s=rows[0];assert.equal(s.present,3);assert.equal(s.absent,1);assert.equal(s.leave,1);assert.equal(s.late,1);assert.equal(s.lateMin,15);assert.equal(s.missingOut,1);assert.equal(s.workedMin,945);
 assert.equal(s.days.find(x=>x.d==='2026-11-13').r.status,'راحة');assert.equal(s.days.find(x=>x.d==='2026-11-10').r.status,'إجازة سنوية');
});
test('approved and expired penalties count separately from pending, rejected and voided penalties',()=>{
 const {c}=hrEnvironment(),s=c.pcHrReportRows()[0];assert.equal(s.penAmount,125);assert.equal(s.penDays,1);assert.equal(s.penWarns,1);assert.equal(s.penCount,3);assert.equal(s.penPending,1);assert.equal(s.penalties.length,5);
 assert.ok(s.penalties.some(l=>c.pcRqStatus(l)==='مرفوضة'));assert.equal(c.pcHrReportRows()[0].e.monthlySalary,3500.75);
});
test('branch and employee filters scope all report sections',()=>{
 const {c}=hrEnvironment();assert.equal(c.pcHrReportRows().length,1);c.pcHrReportF.allBr=true;assert.equal(c.pcHrReportRows().length,2);c.pcHrReportF.emp='emp2';const rows=c.pcHrReportRows();assert.equal(rows.length,1);assert.equal(rows[0].e.id,'emp2');assert.equal(rows[0].penalties.length,0);
});
test('report bounds employment dates and excludes future days',()=>{
 const {c,employee}=hrEnvironment();employee.hireDate='2026-11-10';employee.endDate='2026-11-12';c.pcHrReportF.to='2026-11-15';const rows=c.pcHrReportRows();assert.equal(rows.length,1);assert.deepEqual(Array.from(rows[0].days,x=>x.d),['2026-11-10','2026-11-11','2026-11-12']);assert.equal(rows[0].present,1);assert.equal(rows[0].penAmount,0);assert.equal(rows[0].penDays,0);
 employee.endDate='2026-11-07';assert.equal(c.pcHrReportRows().length,0);
});
test('date validation rejects empty, invalid, reversed and overly long periods',()=>{
 const {c}=hrEnvironment();for(const [from,to] of [['','2026-11-13'],['2026-02-30','2026-03-01'],['2026-11-14','2026-11-01'],['2026-01-01','2026-11-01'],['2026-11-15','2026-11-16']]){c.pcHrReportF.from=from;c.pcHrReportF.to=to;assert.ok(c.pcHrReportValidate());assert.equal(c.pcHrReportRows().length,0);}
});
test('salary visibility respects employee-file permission in HTML and Excel',()=>{
 const {c}=hrEnvironment();c.pcSetCan=tab=>tab!=='hrEmp';let html=c.pcHrReportSummary(c.pcHrReportRows());assert.ok(!html.includes('3,500.75'));assert.ok(!html.includes('المرتب الشهري'));
 const output=[];c.XLSX={utils:{book_new:()=>({}),json_to_sheet:data=>data,book_append_sheet:(_,data,name)=>output.push({data,name})},writeFile:()=>{}};c.pcHrReportExport();assert.equal(output.length,3);assert.ok(!Object.keys(output[0].data[0]).some(k=>k.includes('المرتب')));
 c.pcSetCan=()=>true;html=c.pcHrReportSummary(c.pcHrReportRows());assert.ok(html.includes('3,500.75'));output.length=0;c.pcHrReportExport();assert.equal(output[0].data[0]['المرتب الشهري الحالي (ر.س)'],3500.75);assert.equal(output[1].data.length,6);assert.equal(output[2].data.length,5);
});
test('printing expands daily detail and escapes employee/penalty content',()=>{
 const {c,employee}=hrEnvironment();employee.name='<img src=x onerror=alert(1)>';c.pcRaw.hrLeaves[1].violation='<script>alert(1)</script>';let printed='';c.openPrintReport=(_,html)=>printed=html;c.pcHrReportPrint();assert.ok(!printed.includes('<details'));assert.ok(printed.includes('2026-11-08'));c.document.body.innerHTML=printed;assert.equal(c.document.querySelectorAll('img,script').length,0);assert.ok(c.document.body.textContent.includes('<script>alert(1)</script>'));
});
test('unauthorized report export/print and employee editing do not expose or mutate records',async()=>{
 const {c}=hrEnvironment();c.pcSetCan=()=>false;assert.equal(c.pcHrReportRows().length,0);c.openPrintReport=()=>assert.fail('must not print');c.XLSX={utils:{book_new:()=>assert.fail('must not export')}};c.pcHrReportPrint();c.pcHrReportExport();vm.runInContext(source('pcHrEditEmployee'),c);await c.pcHrEditEmployee('emp1');
});
test('employee editor loads, validates and saves monthly salary to the employee only',async()=>{
 const {c,employee}=hrEnvironment();Object.assign(c,{requestAnimationFrame:fn=>fn(),pcSheetResolve:null,pcHrRoleChanged:()=>{},PC_HR_ROLES:['كاشير'],PC_HR_STATUS:['نشط'],PC_HR_DAYS:['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'],pcChefExtraFields:()=>'',pcChefExtraRead:()=>({data:{odooEmployeeId:'1001'}}),pcPermSummary:()=>'',pcHrEmpSummary:()=>'',pcPermEditor:()=>false,pcDepts:()=>[],pcPermsOf:()=>[],pcHrSyncChef:async()=>{}});
 for(const name of ['pcSheetClose','pcSheet','pcHrEditEmployee'])vm.runInContext(source(name),c);
 let saved;c.window.firebaseDB.updateDoc=async(ref,data)=>{assert.equal(ref.path,'hr_employees/emp1');saved=data;};
 const pending=c.pcHrEditEmployee('emp1');const salary=c.document.getElementById('hrSalary');assert.equal(salary.value,'3500.75');salary.value='-20';c.document.querySelector('[data-act="0"]').click();assert.ok(c.document.getElementById('hrSalary'));assert.equal(saved,undefined);
 salary.value='4250.50';c.document.querySelector('[data-act="0"]').click();await pending;assert.equal(saved.monthlySalary,4250.5);assert.equal(saved.name,employee.name);assert.equal(saved.odooEmployeeId,'1001');
});
