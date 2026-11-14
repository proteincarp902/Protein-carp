/* Employee salary data and a read-only attendance/penalty report. No payroll deductions are applied. */
var pcHrReportF={from:"",to:"",allBr:false,emp:""};
function pcHrSalaryParse(value){
  const text=String(value??"").trim();
  if(!text) return {value:null,error:""};
  const n=Number(text), cents=Math.round(n*100);
  if(!Number.isFinite(n)||n<0||n>1000000000||Math.abs(n*100-cents)>0.0001) return {value:null,error:"اكتب مرتبًا صحيحًا غير سالب، بحد أقصى منزلتين عشريتين"};
  return {value:cents/100,error:""};
}
function pcHrReportMoney(value){return value===null||value===undefined?"غير محدد":Number(value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
function pcHrReportCanSalary(){return pcSetCan("hrEmp");}
function pcHrReportValidate(){
  const f=pcHrReportF, valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&pcHrDayKey(pcHrDayStart(d))===d;
  if(!valid(f.from)||!valid(f.to)) return "اختر تاريخ البداية والنهاية";
  if(f.from>f.to) return "تاريخ البداية بعد تاريخ النهاية";
  if(f.from>pcHrToday()) return "تاريخ البداية لا يتجاوز اليوم";
  if(pcHrDaysBetween(f.from,f.to)>93) return "أقصى مدة للتقرير 93 يومًا";
  return "";
}
function pcHrReportEmps(){
  const f=pcHrReportF, to=f.to>pcHrToday()?pcHrToday():f.to;
  return pcHrEmps().filter(e=>(f.allBr||pcBranchOf(e)===settingsBranch)&&pcHrInPeriod(e,f.from,to)).sort((a,b)=>String(a.name).localeCompare(String(b.name),"ar"));
}
function pcHrReportRows(){
  if(!pcSetCan("hrReport")||pcHrReportValidate()) return [];
  const f=pcHrReportF, end=f.to>pcHrToday()?pcHrToday():f.to;
  return pcHrReportEmps().filter(e=>!f.emp||e.id===f.emp).map(e=>{
    const from=e.hireDate&&e.hireDate>f.from?e.hireDate:f.from, to=e.endDate&&e.endDate<end?e.endDate:end;
    const s=pcHrSumRange(e,from,to);
    const penalties=pcHrList("hrLeaves",hrLeaves).filter(l=>!l.voided&&pcRqKind(l)==="pen"&&l.employeeId===e.id&&l.day>=from&&l.day<=to).sort((a,b)=>String(a.day).localeCompare(String(b.day)));
    const approved=penalties.filter(l=>pcRqStatus(l)===PC_RQ.ok);
    // Monetary penalties and day penalties remain separate; a monthly wage is not a deduction policy.
    s.penDays=pc70R(approved.filter(l=>l.penType!=="amount"&&l.penType!=="warn").reduce((n,l)=>n+Number(l.value||0),0));
    s.penAmount=pc70R(approved.filter(l=>l.penType==="amount").reduce((n,l)=>n+Number(l.value||0),0));
    s.penWarns=approved.filter(l=>l.penType==="warn").length;
    return {...s,penalties,penCount:approved.length,penPending:penalties.filter(l=>![PC_RQ.ok,PC_RQ.no].includes(pcRqStatus(l))).length};
  });
}
function pcHrReportSet(key,value){
  if(!["from","to","allBr","emp"].includes(key)||!pcSetCan("hrReport")) return;
  pcHrReportF[key]=key==="allBr"?!!value:String(value);
  if(key==="allBr") pcHrReportF.emp="";
  renderSettingsHrReport();
}
function renderSettingsHrReport(){
  if(!pcSetCan("hrReport")) return showToast("ليس لديك صلاحية تقرير الحضور","error");
  const f=pcHrReportF;
  if(!f.from){f.from=pcHrToday().slice(0,7)+"-01";f.to=pcHrToday();}
  pcSettingsEnter();
  const emps=pcHrReportEmps();
  if(f.emp&&!emps.some(e=>e.id===f.emp)) f.emp="";
  pcHrShell("hrReport",`<h3>تقرير الحضور والغياب والجزاءات</h3>
    <div class="premium-toolbar">
      <label>من <input id="hrReportFrom" type="date" value="${escapeHtml(f.from)}" max="${pcHrToday()}" onchange="pcHrReportSet('from',this.value)"></label>
      <label>إلى <input id="hrReportTo" type="date" value="${escapeHtml(f.to)}" max="${pcHrToday()}" onchange="pcHrReportSet('to',this.value)"></label>
      <label>الموظف <select id="hrReportEmp" onchange="pcHrReportSet('emp',this.value)"><option value="">كل الموظفين</option>${emps.map(e=>`<option value="${escapeHtml(e.id)}" ${f.emp===e.id?"selected":""}>${escapeHtml(e.name)}${e.odooEmployeeId?` #${escapeHtml(e.odooEmployeeId)}`:""}${f.allBr?` — ${escapeHtml(pcBranchName(pcBranchOf(e)))}`:""}</option>`).join("")}</select></label>
      <button type="button" class="btn btn-light" onclick="pcHrReportExport()"><i class="fa-solid fa-file-excel"></i> Excel</button>
      <button type="button" class="btn btn-light" onclick="pcHrReportPrint()"><i class="fa-solid fa-print"></i> طباعة</button>
    </div>
    <label class="pc123-allbr"><input type="checkbox" ${f.allBr?"checked":""} onchange="pcHrReportSet('allBr',this.checked)"> كل الفروع (بدل الفرع المختار فوق)</label>
    <div id="pcHrReportBox"></div>`);
  pcHrDrawReport();
}
function pcHrReportSummary(rows){
  const salary=pcHrReportCanSalary();
  return `<div class="premium-table-wrap"><table class="premium-table pc103-table"><thead><tr><th>الموظف</th><th>الفرع</th>${salary?"<th>المرتب الشهري الحالي (ر.س)</th>":""}<th>حضور</th><th>غياب</th><th>إجازة</th><th>مرات التأخير</th><th>دقائق التأخير</th><th>ساعات العمل</th><th>بدون انصراف</th><th>جزاء أيام معتمد</th><th>جزاء مبلغ معتمد (ر.س)</th><th>إنذارات معتمدة</th><th>جزاءات معلقة</th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${escapeHtml(s.e.name)}</b><br><small>${escapeHtml([s.e.odooEmployeeId,s.e.role,s.e.section].filter(Boolean).join(" · "))}</small></td><td>${escapeHtml(pcBranchName(pcBranchOf(s.e)))}</td>${salary?`<td>${pcHrReportMoney(s.e.monthlySalary)}</td>`:""}<td>${s.present}</td><td>${s.absent}</td><td>${s.leave}</td><td>${s.late}</td><td>${Math.round(s.lateMin)}</td><td>${(s.workedMin/60).toFixed(2)}</td><td>${s.missingOut}</td><td>${pc60Num(s.penDays)}</td><td>${pcHrReportMoney(s.penAmount)}</td><td>${s.penWarns}</td><td>${s.penPending}</td></tr>`).join("")}</tbody></table></div>`;
}
function pcHrReportDaily(rows){
  return rows.map(s=>`<details class="pc123-emp" ${rows.length===1?"open":""}><summary><b>${escapeHtml(s.e.name)}</b> — تفاصيل الحضور والغياب</summary><div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>الحالة</th><th>دقائق التأخير</th><th>ساعات العمل</th></tr></thead><tbody>${s.days.map(({d,r})=>`<tr><td>${escapeHtml(d)}</td><td>${pcHrClock(r.inMs)}</td><td>${pcHrClock(r.outMs)}</td><td>${escapeHtml(r.status)}</td><td>${Math.round(r.late||0)}</td><td>${(r.worked/60).toFixed(2)}</td></tr>`).join("")}</tbody></table></div></details>`).join("");
}
function pcHrReportPenalties(rows){
  const lines=rows.flatMap(s=>s.penalties.map(l=>({e:s.e,l})));
  return `<h3>تفاصيل الجزاءات</h3>${lines.length?`<div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>الموظف</th><th>التاريخ</th><th>الجزاء</th><th>المخالفة</th><th>الحالة</th><th>المسؤول</th><th>البيان</th></tr></thead><tbody>${lines.map(({e,l})=>`<tr><td>${escapeHtml(e.name)}</td><td>${escapeHtml(l.day)}</td><td>${escapeHtml(pcPenText(l))}</td><td>${escapeHtml(l.violation||"—")}</td><td>${escapeHtml(pcRqStatus(l))}</td><td>${escapeHtml(l.managerName||l.createdBy||"—")}</td><td>${pcNoteHtml(l.note||"")}${l.hrNote?`<br>${pcNoteHtml(l.hrNote)}`:""}</td></tr>`).join("")}</tbody></table></div>`:'<p class="pc85-hint">لا توجد جزاءات ضمن الاختيار.</p>'}`;
}
function pcHrReportBody(rows){
  const sum=key=>rows.reduce((n,s)=>n+Number(s[key]||0),0);
  return `<div class="settings-stats"><div><span>الموظفون</span><b>${rows.length}</b></div><div><span>أيام الحضور</span><b>${sum("present")}</b></div><div><span>أيام الغياب</span><b>${sum("absent")}</b></div><div><span>جزاءات معتمدة</span><b>${sum("penCount")}</b></div></div>
    <p class="pc85-hint">الفترة: ${escapeHtml(pcHrReportF.from)} إلى ${escapeHtml(pcHrReportF.to>pcHrToday()?pcHrToday():pcHrReportF.to)}. الغياب حسب أيام العمل والإجازات المعتمدة وتواريخ الخدمة المسجلة؛ بيانات اليوم الجاري مؤقتة. إجماليات الجزاءات للمعتمد فقط، وتظهر الحالات الأخرى في التفاصيل. المرتب هو الشهري الحالي وليس كشف رواتب، ولا يُحسب خصم مالي تلقائي للغياب أو الجزاءات بالأيام.</p>
    ${pcHrReportSummary(rows)}<h3>التفاصيل اليومية</h3>${pcHrReportDaily(rows)}${pcHrReportPenalties(rows)}`;
}
function pcHrDrawReport(){
  const box=document.getElementById("pcHrReportBox");if(!box) return;
  if(!pcSetCan("hrReport")){box.innerHTML="";return;}
  const error=pcHrReportValidate();if(error){box.innerHTML=`<div class="placeholder">${escapeHtml(error)}</div>`;return;}
  const rows=pcHrReportRows();box.innerHTML=rows.length?pcHrReportBody(rows):'<div class="placeholder">لا يوجد موظفون ضمن الاختيار والفترة المحددة</div>';
}
function pcHrReportPrint(){
  if(!pcSetCan("hrReport")) return;
  const error=pcHrReportValidate();if(error) return showToast(error,"error");
  const rows=pcHrReportRows();if(!rows.length) return showToast("لا يوجد موظفون ضمن الاختيار","warn");
  // Expand every employee in the printed copy, regardless of on-screen accordion state.
  openPrintReport("تقرير الحضور والغياب والجزاءات",pcHrReportBody(rows).replace(/<details\b[^>]*>/g,"<section>").replace(/<\/details>/g,"</section>").replace(/<summary>/g,"<h3>").replace(/<\/summary>/g,"</h3>"));
}
function pcHrReportExport(){
  if(!pcSetCan("hrReport")) return;
  const error=pcHrReportValidate();if(error) return showToast(error,"error");
  if(typeof XLSX==="undefined") return showToast("مكتبة Excel غير متاحة الآن","error");
  const rows=pcHrReportRows();if(!rows.length) return showToast("لا يوجد موظفون ضمن الاختيار","warn");
  const salary=pcHrReportCanSalary();
  const summary=rows.map(s=>({"الموظف":s.e.name,"الرقم الوظيفي":s.e.odooEmployeeId||"","الفرع":pcBranchName(pcBranchOf(s.e)),...(salary?{"المرتب الشهري الحالي (ر.س)":s.e.monthlySalary??""}:{}),"أيام الحضور":s.present,"أيام الغياب":s.absent,"أيام الإجازة":s.leave,"مرات التأخير":s.late,"دقائق التأخير":Math.round(s.lateMin),"ساعات العمل":Number((s.workedMin/60).toFixed(2)),"بدون انصراف":s.missingOut,"جزاء أيام معتمد":s.penDays,"جزاء مبلغ معتمد (ر.س)":s.penAmount,"إنذارات معتمدة":s.penWarns,"جزاءات معلقة":s.penPending}));
  const daily=rows.flatMap(s=>s.days.map(({d,r})=>({"الموظف":s.e.name,"الرقم الوظيفي":s.e.odooEmployeeId||"","الفرع":pcBranchName(pcBranchOf(s.e)),"التاريخ":d,"الحضور":pcHrClockX(r.inMs),"الانصراف":pcHrClockX(r.outMs),"الحالة":r.status,"دقائق التأخير":Math.round(r.late||0),"ساعات العمل":Number((r.worked/60).toFixed(2))})));
  const penalties=rows.flatMap(s=>s.penalties.map(l=>({"الموظف":s.e.name,"الرقم الوظيفي":s.e.odooEmployeeId||"","الفرع":pcBranchName(pcBranchOf(s.e)),"التاريخ":l.day,"الجزاء":pcPenText(l),"النوع":l.penType==="amount"?"مبلغ":l.penType==="warn"?"إنذار":"أيام","القيمة":l.penType==="warn"?0:Number(l.value||0),"المخالفة":l.violation||"","الحالة":pcRqStatus(l),"المسؤول":l.managerName||l.createdBy||"","البيان":l.note||""})));
  const wb=XLSX.utils.book_new();
  for(const [name,data] of [["الملخص",summary],["الحضور والغياب",daily],["الجزاءات",penalties]]) XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),name);
  XLSX.writeFile(wb,`hr-report-${pcHrReportF.from}-${pcHrReportF.to}.xlsx`);
}
