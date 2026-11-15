const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {environment}=require('./helpers.cjs');
const app=fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8');
function source(name){
 const start=app.search(new RegExp('^(?:async )?function '+name+'\\(','m'));assert.ok(start>=0,name);
 const tail=app.slice(start+1),end=tail.search(/^(?:async )?function |^var |^const /m);
 return app.slice(start,end<0?app.length:start+1+end);
}
function hrEnvironment(){
 const e=environment(),c=e.c,dom=new JSDOM('<!doctype html><body></body>');
 const now=new Date(2026,10,14,12).getTime();
 class FixedDate extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
 Object.assign(c,{Date:FixedDate,document:dom.window.document,settingsBranch:'b1',hrEmployees:[],hrAttendance:[],hrLeaves:[],pcHrEmps:null,
  PC_RQ:{emp:'بانتظار رد الموظف',hr:'بانتظار الموارد البشرية',ok:'معتمدة',no:'مرفوضة'},PC_RQ_KINDS:{leave:[],perm:[],late:[],pen:[]},
  pcSetCan:()=>true,pcBranchName:b=>b==='b1'?'فرع 1':'فرع 2',pcSettingsEnter:()=>{},pcHrClock:ms=>ms?new Date(ms).toISOString().slice(11,16):'—',pcHrClockX:ms=>ms?new Date(ms).toISOString().slice(11,16):'',showToast:()=>{}});
 for(const name of ['pcHrList','pcHrEmps','pcHrEmp','pcHrBranchEmps','pcHrActive','pcHrInPeriod','pcHrDayKey','pcHrToday','pcHrDayStart','pcHrAddDays','pcHrMin','pcHrDaysBetween','pcHrShift','pcHrWorkday','pcHrLeaveOn','pcHrRecords','pcHrDayResult','pcHrSumRange','pcRqKind','pcRqStatus','pcPenExpired','pcRqApprovedOn','pcPenSum','pcPenText'])vm.runInContext(source(name),c);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../employee-metadata.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../hr-reports.js'),'utf8'),c);
 const employee={id:'emp1',name:'موظف تجريبي',role:'كاشير',branchId:'b1',status:'نشط',hireDate:'2026-11-01',workDays:[0,1,2,3,4,6],shiftStart:'09:00',shiftEnd:'17:00',monthlySalary:3500.75};
 c.pcRaw.hrEmployees=[employee,{...employee,id:'emp2',name:'موظف فرع آخر',branchId:'b2'}];
 const at=(day,h,m=0)=>c.pcHrDayStart(day)+(h*60+m)*60000;
 c.pcRaw.hrAttendance=[{id:'a',employeeId:'emp1',day:'2026-11-08',inMs:at('2026-11-08',9),outMs:at('2026-11-08',17)},
 {id:'b',employeeId:'emp1',day:'2026-11-09',inMs:at('2026-11-09',9,15),outMs:at('2026-11-09',17)},
 {id:'c',employeeId:'emp1',day:'2026-11-12',inMs:at('2026-11-12',9),outMs:0},
 {id:'void',employeeId:'emp1',day:'2026-11-11',inMs:at('2026-11-11',9),outMs:at('2026-11-11',17),voided:true}];
 const pen=(id,day,penType,value,status,other={})=>({id,employeeId:'emp1',kind:'pen',day,penType,value,status,...other});
 c.pcRaw.hrLeaves=[{id:'leave',employeeId:'emp1',kind:'leave',from:'2026-11-10',to:'2026-11-10',status:'معتمدة',type:'سنوية'},
 pen('p1','2026-11-09','amount',125,'معتمدة'),pen('p2','2026-11-10','days',2,'بانتظار الموارد البشرية'),pen('p3','2026-11-11','amount',50,'مرفوضة'),
 pen('p4','2026-11-12','warn',0,'بانتظار رد الموظف',{replyDueMs:now-1}),pen('p5','2026-11-13','days',1,'معتمدة'),
 pen('outside','2026-11-07','amount',999,'معتمدة'),pen('void','2026-11-09','amount',99,'معتمدة',{voided:true})];
 c.pcHrReportF={from:'2026-11-08',to:'2026-11-13',allBr:false,emp:''};
 return {...e,c,dom,employee,at};
}

module.exports={hrEnvironment,source};
