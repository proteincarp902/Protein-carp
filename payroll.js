/* Read-only monthly payroll grouped by branch/department. Calendar-day divisor is user-selected policy. */
var pcPayrollF={month:"",branch:"",section:""};
function pcPayrollDepartment(e){return String(e.payrollDepartment||e.section||"").trim();}
function pcPayrollBranch(e){return String(e.payrollBranchName||"").trim()||pcBranchName(pcBranchOf(e));}
function pcPayrollPeriod(){
  const month=pcPayrollF.month;
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const first=month+"-01";
  if(pcHrDayKey(pcHrDayStart(first))!==first) return null;
  const date=new Date(pcHrDayStart(first));
  const last=pcHrDayKey(new Date(date.getFullYear(),date.getMonth()+1,0).getTime());
  const today=pcHrToday();
  return {first,last,to:last>today?today:last,days:pcHrDaysBetween(first,last),partial:last>today};
}
function pcPayrollValidate(){
  const p=pcPayrollPeriod();
  if(!p) return "اختر شهرًا صحيحًا";
  if(p.first>pcHrToday()) return "لا يمكن استخراج مستحقات شهر لم يبدأ بعد";
  return "";
}
function pcPayrollEmps(){
  const p=pcPayrollPeriod();if(!p||pcPayrollValidate()) return [];
  return pcHrEmps().filter(e=>(!pcPayrollF.branch||pcPayrollBranch(e)===pcPayrollF.branch)&&pcHrInPeriod(e,p.first,p.to));
}
function pcPayrollSections(){return [...new Set(pcPayrollEmps().map(pcPayrollDepartment))].sort((a,b)=>a.localeCompare(b,"ar"));}
function pcPayrollRow(e,p){
  const from=e.hireDate&&e.hireDate>p.first?e.hireDate:p.first, to=e.endDate&&e.endDate<p.to?e.endDate:p.to;
  const serviceDays=pcHrDaysBetween(from,to), summary=pcHrSumRange(e,from,to), notes=[];
  const unpaid=pcHrList("hrLeaves",hrLeaves).filter(l=>!l.voided&&l.employeeId===e.id&&pcRqKind(l)==="leave"&&l.status===PC_RQ.ok&&l.type==="بدون راتب");
  let absentDays=0,unpaidDays=0;
  summary.days.forEach(({d,r})=>{
    const openToday=d===pcHrToday()&&(!r.sh||Date.now()<r.sh.end);
    if(r.status==="غائب"&&!openToday) absentDays++;
    if(!r.recs.length&&unpaid.some(l=>l.from<=d&&l.to>=d)) unpaidDays++;
  });
  const penalties=pcHrList("hrLeaves",hrLeaves).filter(l=>!l.voided&&l.employeeId===e.id&&pcRqKind(l)==="pen"&&pcRqStatus(l)===PC_RQ.ok&&l.day>=from&&l.day<=to);
  let penaltyDays=0,penaltyAmount=0;
  penalties.forEach(l=>{if(l.penType==="warn") return;const value=Number(l.value);if(!Number.isFinite(value)||value<0){notes.push("جزاء بقيمة غير صحيحة — يحتاج مراجعة");return;}if(l.penType==="amount")penaltyAmount+=value;else penaltyDays+=value;});
  penaltyDays=pc70R(penaltyDays);penaltyAmount=accR(penaltyAmount);
  const salaryResult=pcHrSalaryParse(e.monthlySalary), salary=salaryResult.error?null:salaryResult.value;
  const insuranceResult=pcHrSalaryParse(e.payrollInsuranceAmount),insuranceAmount=insuranceResult.error?0:(insuranceResult.value||0);
  if(insuranceResult.error||insuranceResult.value===null)notes.push("التأمينات غير محددة — محسوبة صفرًا للمراجعة");
  if(salary===null) notes.push("المرتب غير محدد أو غير صحيح");
  if((e.status||"نشط")!=="نشط"&&e.status!=="منتهي الخدمة")notes.push("حالة الموظف تحتاج مراجعة الاستحقاق");
  if(summary.missingOut) notes.push(`${summary.missingOut} يوم بدون تسجيل انصراف`);
  if(summary.late) notes.push(`تأخير ${Math.round(summary.lateMin)} دقيقة — لا خصم تلقائي`);
  const dayRate=salary===null?null:salary/p.days;
  const gross=salary===null?null:accR(salary*serviceDays/p.days);
  const absenceDeduction=salary===null?null:accR(salary*absentDays/p.days);
  const unpaidDeduction=salary===null?null:accR(salary*unpaidDays/p.days);
  const penaltyDeduction=salary===null?null:accR(salary*penaltyDays/p.days);
  const totalDeductions=salary===null?null:accR(absenceDeduction+unpaidDeduction+penaltyDeduction+penaltyAmount+insuranceAmount);
  const net=salary===null?null:accR(gross-totalDeductions);
  if(net!==null&&net<0)notes.push("الخصومات تتجاوز المستحق — يلزم مراجعة");
  return {e,from,to,serviceDays,monthDays:p.days,salary,dayRate,gross,absentDays,unpaidDays,penaltyDays,penaltyAmount,insuranceAmount,absenceDeduction,unpaidDeduction,penaltyDeduction,totalDeductions,net,notes};
}
function pcPayrollGroups(){
  if(!pcSetCan("hrPayroll")||pcPayrollValidate())return [];
  const p=pcPayrollPeriod(),groups=new Map();
  pcPayrollEmps().filter(e=>!pcPayrollF.section||JSON.stringify(pcPayrollDepartment(e))===pcPayrollF.section).forEach(e=>{
    const section=pcPayrollDepartment(e),branchId=pcBranchOf(e),key=JSON.stringify(section);
    if(!groups.has(key))groups.set(key,{branchId,section,rows:[]});
    groups.get(key).rows.push(pcPayrollRow(e,p));
  });
  return [...groups.values()].sort((a,b)=>a.section.localeCompare(b.section,"ar")).map(g=>({...g,rows:g.rows.sort((a,b)=>String(a.e.name).localeCompare(String(b.e.name),"ar"))}));
}
function pcPayrollTotals(rows){
  const out={count:rows.length,missing:rows.filter(r=>r.salary===null).length,review:rows.filter(r=>r.net!==null&&r.net<0).length};
  for(const key of ["salary","gross","absenceDeduction","unpaidDeduction","penaltyDeduction","penaltyAmount","insuranceAmount","totalDeductions","net"])out[key]=accR(rows.filter(r=>r.salary!==null).reduce((n,r)=>n+(r[key]||0),0));
  return out;
}
function pcPayrollSet(key,value){
  if(!pcSetCan("hrPayroll")||!["month","branch","section"].includes(key))return;
  pcPayrollF[key]=String(value);if(key!=="section")pcPayrollF.section="";
  renderSettingsHrPayroll();
}
function renderSettingsHrPayroll(){
  if(!pcSetCan("hrPayroll"))return showToast("كشف المرتبات يتطلب صلاحية ملفات الموظفين والحضور","error");
  if(!pcPayrollF.month)pcPayrollF.month=pcHrToday().slice(0,7);
  pcSettingsEnter();const f=pcPayrollF,sections=pcPayrollSections();
  const p=pcPayrollPeriod(),branches=[...new Set(pcHrEmps().filter(e=>p&&pcHrInPeriod(e,p.first,p.to)).map(pcPayrollBranch))].sort((a,b)=>a.localeCompare(b,"ar"));
  if(f.section&&!sections.some(s=>JSON.stringify(s)===f.section))f.section="";
  pcHrShell("hrPayroll",`<h3>كشف المرتبات حسب الأقسام</h3><div class="premium-toolbar">
    <label>الشهر <input id="payrollMonth" type="month" value="${escapeHtml(f.month)}" max="${pcHrToday().slice(0,7)}" onchange="pcPayrollSet('month',this.value)"></label>
    <label>الفرع <select id="payrollBranch" onchange="pcPayrollSet('branch',this.value)"><option value="">كل الفروع</option>${branches.map(b=>`<option value="${escapeHtml(b)}" ${f.branch===b?"selected":""}>${escapeHtml(b)}</option>`).join("")}</select></label>
    <label>القسم <select id="payrollSection" onchange="pcPayrollSet('section',this.value)"><option value="">كل الأقسام</option>${sections.map(s=>`<option value="${escapeHtml(JSON.stringify(s))}" ${f.section===JSON.stringify(s)?"selected":""}>${escapeHtml(s||"بدون قسم")}</option>`).join("")}</select></label>
    <button type="button" class="btn btn-light" onclick="pcPayrollExport()"><i class="fa-solid fa-file-excel"></i> Excel</button>
    <button type="button" class="btn btn-light" onclick="pcPayrollPrint()"><i class="fa-solid fa-print"></i> طباعة</button>
    ${pcSetCan("hrEmp")?`<label class="btn btn-light">استيراد بيانات العمل من كشف أودو<input type="file" accept=".xlsx,.xls" hidden onchange="pcHrMetadataImport(this)"></label>`:""}
    </div>
    <div id="pcPayrollBox"></div>`);pcPayrollDraw();
}
function pcPayrollTable(group){
  const t=pcPayrollTotals(group.rows);
  return `<section><h3>${escapeHtml(group.section||"بدون قسم")}</h3><div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>الموظف / الرقم الوظيفي</th><th>الفرع / المهنة</th><th>المرتب الشهري</th><th>أيام الاستحقاق</th><th>قيمة اليوم</th><th>المستحق الأساسي</th><th>خصم الغياب</th><th>خصم بدون راتب</th><th>خصم جزاء أيام</th><th>جزاء مبلغ</th><th>التأمينات</th><th>إجمالي الخصومات</th><th>صافي المستحق</th><th>ملاحظات</th></tr></thead><tbody>${group.rows.map(r=>`<tr><td><b>${escapeHtml(r.e.name)}</b><br><small>${escapeHtml(r.e.odooEmployeeId||"—")}</small></td><td>${escapeHtml(pcPayrollBranch(r.e))}<br><small>${escapeHtml(r.e.jobTitle||r.e.role||"—")}</small></td><td>${pcHrReportMoney(r.salary)}</td><td>${r.serviceDays} / ${r.monthDays}</td><td>${pcHrReportMoney(r.dayRate)}</td><td>${pcHrReportMoney(r.gross)}</td><td>${pcHrReportMoney(r.absenceDeduction)}<br><small>${r.absentDays} يوم</small></td><td>${pcHrReportMoney(r.unpaidDeduction)}<br><small>${r.unpaidDays} يوم</small></td><td>${pcHrReportMoney(r.penaltyDeduction)}<br><small>${pc60Num(r.penaltyDays)} يوم</small></td><td>${pcHrReportMoney(r.penaltyAmount)}</td><td>${pcHrReportMoney(r.insuranceAmount)}</td><td>${pcHrReportMoney(r.totalDeductions)}</td><td><b>${pcHrReportMoney(r.net)}</b></td><td>${r.notes.map(escapeHtml).join("<br>")||"—"}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="2"><b>إجمالي القسم (${t.count} موظف)</b></td><td>${pcHrReportMoney(t.salary)}</td><td colspan="2"></td><td>${pcHrReportMoney(t.gross)}</td><td>${pcHrReportMoney(t.absenceDeduction)}</td><td>${pcHrReportMoney(t.unpaidDeduction)}</td><td>${pcHrReportMoney(t.penaltyDeduction)}</td><td>${pcHrReportMoney(t.penaltyAmount)}</td><td>${pcHrReportMoney(t.insuranceAmount)}</td><td>${pcHrReportMoney(t.totalDeductions)}</td><td><b>${pcHrReportMoney(t.net)}</b></td><td>${t.missing?`${t.missing} مرتب غير محدد — الإجمالي غير مكتمل`:""}</td></tr></tfoot></table></div></section>`;
}
function pcPayrollBody(groups){
  const p=pcPayrollPeriod(),t=pcPayrollTotals(groups.flatMap(g=>g.rows));
  const imported=pcHrPayrollMetadata.rows||[],match=pcHrMetadataStats(imported);
  return `${imported.length?`<p class="pc85-hint">المصدر: ${escapeHtml(pcHrPayrollMetadata.sourceFile||"كشف الموظفين")} — ${imported.length} سجل، مطابق ${match.matched}، غير موجود ${match.unmatched}، معرفات ملتبسة ${match.ambiguous}. المطابقة بالرقم الوظيفي فقط.</p>`:""}<p><b>${p.partial?"كشف مبدئي حتى "+escapeHtml(p.to):"شهر "+escapeHtml(pcPayrollF.month)}</b> — ${p.days} يومًا بالشهر — المبالغ بالريال السعودي.</p>
    <p class="pc85-hint">قيمة اليوم = المرتب الشهري ÷ عدد أيام الشهر. المستحق الأساسي = قيمة اليوم × أيام الخدمة خلال الفترة. الصافي = المستحق الأساسي − الغياب − الإجازات المعتمدة بدون راتب − الجزاءات المعتمدة بالأيام والمبالغ − التأمينات المسجلة. مبلغ التأمينات يُخصم بالقيمة الشهرية المسجلة كاملة دون اشتقاق نسبة من الجنسية. الإنذارات والتأخير لا يُخصمان تلقائيًا. الغياب لليوم الجاري لا يُخصم قبل انتهاء الدوام؛ وتظل بيانات الشهر الجاري مبدئية.</p>
    <p class="pc85-hint">الحساب بالمرتب الحالي وقسم العمل والفرع المسجلين الآن؛ لا توجد رواتب تاريخية محفوظة للشهور السابقة. تُحسب الإجازة بدون راتب بأيامها التقويمية داخل فترة الخدمة، ولا يتكرر خصمها كغياب. تُقرب المبالغ إلى منزلتين بعد الحساب، دون تقريب قيمة اليوم أولًا.</p>
    <div class="settings-stats"><div><span>الموظفون</span><b>${t.count}</b></div><div><span>الأقسام</span><b>${groups.length}</b></div><div><span>إجمالي الخصومات</span><b>${pcHrReportMoney(t.totalDeductions)}</b></div><div><span>صافي المسجل</span><b>${pcHrReportMoney(t.net)}</b></div></div>
    ${t.missing?`<p role="alert">${t.missing} موظف بدون مرتب صحيح؛ الإجماليات لا تشملهم.</p>`:""}${t.review?`<p role="alert">${t.review} موظف بخصومات تتجاوز المستحق؛ راجع التفاصيل قبل اعتماد الصرف.</p>`:""}
    <p class="pc85-hint">Excel يخرج بنفس ترتيب كشف أودو: ملخص، النظامين، غير نظامين، والافتراضات، مع إجمالي لكل قسم. الأساسي والسكن والانتقالات والتأمينات من خانات ملف الموظف؛ المتغيرات والسلف والتعويضات غير المسجلة تظل صفرًا للمراجعة والتعديل في الملف، ولا تُحتسب من الجنسية تلقائيًا.</p>
    ${groups.map(pcPayrollTable).join("")}`;
}
function pcPayrollDraw(){
  const box=document.getElementById("pcPayrollBox");if(!box)return;
  if(!pcSetCan("hrPayroll")){box.innerHTML="";return;}
  const error=pcPayrollValidate();if(error){box.innerHTML=`<div class="placeholder">${escapeHtml(error)}</div>`;return;}
  const groups=pcPayrollGroups();box.innerHTML=groups.length?pcPayrollBody(groups):'<div class="placeholder">لا يوجد موظفون ضمن الاختيار والشهر المحدد</div>';
}
function pcPayrollPrint(){
  if(!pcSetCan("hrPayroll"))return;
  const error=pcPayrollValidate();if(error)return showToast(error,"error");
  const groups=pcPayrollGroups();if(!groups.length)return showToast("لا يوجد موظفون ضمن الاختيار","warn");
  openPrintReport("كشف المرتبات حسب الأقسام",'<style>@page{size:A4 landscape}table{font-size:9px}thead{display:table-header-group}tr{break-inside:avoid}h3{break-after:avoid}</style>'+pcPayrollBody(groups));
}
async function pcPayrollExport(){
  if(!pcSetCan("hrPayroll"))return;
  const error=pcPayrollValidate();if(error)return showToast(error,"error");
  const groups=pcPayrollGroups();if(!groups.length)return showToast("لا يوجد موظفون ضمن الاختيار","warn");
  try{
    const Excel=await pcPayrollExcelLibrary(),workbook=pcPayrollWorkbook(Excel,groups),buffer=await workbook.xlsx.writeBuffer();
    const url=URL.createObjectURL(new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
    const a=document.createElement("a");a.href=url;a.download=`كشف_المرتبات_${pcPayrollF.month}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(err){console.error(err);showToast("تعذر تصدير كشف المرتبات، تحقق من تحميل مكتبة Excel","error");}
}
