/* Payroll source metadata is keyed by Odoo ID and never replaces operational roles or kitchen sections. */
var pcHrPayrollMetadata={rows:[],importedAtMs:0},pcHrMetadataDraft=null;
function pcHrOdooId(value){
  let text=String(value??"").trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
  if(/^\d+(?:\.0+)?$/.test(text))text=text.replace(/\.0+$/,"").replace(/^0+(?=\d)/,"");
  return text;
}
function pcHrMetadataApply(employees){
  const index=new Map(),counts=new Map();
  for(const row of pcHrPayrollMetadata.rows||[]){const id=pcHrOdooId(row.odooId);if(id){if(index.has(id))index.set(id,null);else index.set(id,row);}}
  for(const e of employees){const id=pcHrOdooId(e.odooEmployeeId);if(id)counts.set(id,(counts.get(id)||0)+1);}
  return employees.map(e=>{
    const id=pcHrOdooId(e.odooEmployeeId),row=index.get(id);
    if(!row||counts.get(id)!==1||Number(e.payrollMetadataUpdatedAtMs||0)>=Number(pcHrPayrollMetadata.importedAtMs||0))return e;
    return {...e,...(row.department?{payrollDepartment:row.department}:{}),...(row.branch?{payrollBranchName:row.branch}:{}),...(row.jobTitle?{jobTitle:row.jobTitle}:{}),...(row.paymentMethod?{payrollPaymentMethod:row.paymentMethod}:{}),...(row.payrollGroup?{payrollGroup:row.payrollGroup}:{}),...(row.basicSalary!==undefined?{payrollBasicSalary:row.basicSalary,payrollHousingAllowance:row.housingAllowance||0,payrollTransportAllowance:row.transportAllowance||0,payrollInsuranceAmount:row.insuranceAmount||0,monthlySalary:Math.round((row.basicSalary+(row.housingAllowance||0)+(row.transportAllowance||0))*100)/100}:{})};
  });
}
function pcHrMetadataAmount(value){
  if(value===undefined||value===null||value==="")throw new Error("توجد خلية مالية بلا قيمة محفوظة؛ افتح الملف واحفظه في Excel لحساب المعادلات ثم أعد الاستيراد");
  const n=Number(value);if(!Number.isFinite(n)||n<0||n>1000000000)throw new Error("توجد قيمة مالية غير صحيحة في الكشف");return Math.round(n*100)/100;
}
function pcHrMetadataParse(workbook){
  const rows=[];
  for(const sheetName of workbook.SheetNames){
    if(!["النظامين","غير نظامين"].includes(sheetName))continue;
    const data=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:"",raw:true});
    let department="";
    for(let i=4;i<data.length;i++){
      const r=data[i];
      if(!r[1]&&!r[0]&&String(r[4]||"").trim().startsWith("مرتبات"))department=String(r[4]).replace(/^مرتبات\s*/,"").trim();
      if(!r[1]||r[20]===""||r[20]===undefined)continue;
      rows.push({odooId:pcHrOdooId(r[20]),name:String(r[1]).trim(),department,branch:String(r[5]||"").trim(),jobTitle:String(r[4]||"").trim(),paymentMethod:String(r[3]||"").trim(),payrollGroup:sheetName,basicSalary:pcHrMetadataAmount(r[6]),housingAllowance:pcHrMetadataAmount(r[7]||0),transportAllowance:pcHrMetadataAmount(r[8]||0),insuranceAmount:pcHrMetadataAmount(r[12])});
    }
  }
  if(!rows.length)throw new Error("لم توجد صفوف موظفين بمعرف Odoo في أوراق النظامين/غير نظامين");
  if(rows.length>3000)throw new Error("الملف يتجاوز 3000 موظف");
  const seen=new Set();for(const r of rows){if(!r.odooId||seen.has(r.odooId))throw new Error("يوجد معرف Odoo فارغ أو مكرر في الكشف");seen.add(r.odooId);}
  return rows;
}
function pcHrMetadataStats(rows){
  const counts=new Map();for(const e of pcHrList("hrEmployees",hrEmployees)){const id=pcHrOdooId(e.odooEmployeeId);if(id)counts.set(id,(counts.get(id)||0)+1);}
  return {matched:rows.filter(r=>counts.get(r.odooId)===1).length,ambiguous:rows.filter(r=>(counts.get(r.odooId)||0)>1).length,unmatched:rows.filter(r=>!counts.has(r.odooId)).length};
}
async function pcHrMetadataImport(input){
  const file=input.files?.[0];if(!file||!pcSetCan("hrEmp"))return;
  try{
    if(file.size>5*1024*1024)throw new Error("الحد الأقصى لحجم الكشف 5 ميجابايت");
    if(typeof XLSX==="undefined")throw new Error("مكتبة Excel غير متاحة");
    const workbook=XLSX.read(await file.arrayBuffer(),{type:"array"}),rows=pcHrMetadataParse(workbook),stats=pcHrMetadataStats(rows);
    const workbookCompanyName=workbook.Sheets[workbook.SheetNames[0]]?.A1?.v||"Protein & Carb";
    const confirmed=await pcSheet({title:"بيانات الأقسام من كشف أودو",icon:"fa-file-excel",body:`<p>${rows.length} صفًا — مطابق ${stats.matched} — غير موجود ${stats.unmatched} — معرفات ملتبسة ${stats.ambiguous}.</p><p>تُستخدم أقسام العمل والفروع والمسميات وطريقة الدفع وفئة الكشف للمرتبات. يُستورد الأساسي والسكن والانتقالات ومبلغ التأمينات المحفوظ في الملف أيضًا. السلف ومتغيرات الشهر والبدلات الأخرى والجنسية لا تُستورد. التطبيق على معرف Odoo المطابق لموظف واحد فقط؛ الصفوف غير المطابقة تنتظر وجود الملف الصحيح.</p><div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>Odoo ID</th><th>الموظف</th><th>قسم العمل</th><th>الفرع</th><th>المهنة</th><th>الأساسي</th><th>السكن</th><th>الانتقالات</th><th>التأمينات</th><th>الدفع</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.odooId)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.department)}</td><td>${escapeHtml(r.branch||"يبقى المسجل")}</td><td>${escapeHtml(r.jobTitle)}</td><td>${pcHrReportMoney(r.basicSalary)}</td><td>${pcHrReportMoney(r.housingAllowance)}</td><td>${pcHrReportMoney(r.transportAllowance)}</td><td>${pcHrReportMoney(r.insuranceAmount)}</td><td>${escapeHtml(r.paymentMethod)}</td></tr>`).join("")}</tbody></table></div>`,actions:[{label:"تطبيق بيانات الكشف",kind:"btn-main",value:true},{label:"إلغاء",kind:"btn-light",value:false}]});
    if(!confirmed)return;
    const {db,doc,setDoc}=window.firebaseDB;
    await setDoc(doc(db,"settings","payrollEmployeeMetadata"),{schemaVersion:2,sourceFile:file.name,companyName:String(workbookCompanyName||"Protein & Carb"),importedAtMs:Date.now(),rows});
    showToast("تم حفظ بيانات الكشف؛ تُطابق الملفات بالرقم الوظيفي");
  }catch(e){console.error(e);showToast(e.message||"تعذر استيراد البيانات","error");}finally{input.value="";}
}
function pcHrPayrollProfileFields(e){
  return `<details class="pc123-emp"><summary>بيانات كشف المرتبات</summary>
    <label class="pc94-lb" for="hrJobTitle">المسمى الوظيفي / المهنة</label><input id="hrJobTitle" class="pc93-name" maxlength="100" value="${escapeHtml(e.jobTitle||"")}">
    <label class="pc94-lb" for="hrPayrollDept">قسم العمل / مركز التكلفة</label><input id="hrPayrollDept" class="pc93-name" maxlength="100" value="${escapeHtml(e.payrollDepartment||"")}" placeholder="مثل الإدارة، الإدارة المالية، المطبخ، النادي">
    <label class="pc94-lb" for="hrPayrollBranch">فرع كشف المرتبات</label><input id="hrPayrollBranch" class="pc93-name" maxlength="100" value="${escapeHtml(e.payrollBranchName||"")}" placeholder="الفرع المسجل إذا تُرك فارغًا">
    <label class="pc94-lb" for="hrPayrollPayment">طريقة الدفع</label><select id="hrPayrollPayment" class="pc93-name">${["","تحويل","نقدي"].map(x=>`<option value="${x}" ${x===(e.payrollPaymentMethod||"")?"selected":""}>${x||"غير محدد"}</option>`).join("")}</select>
    <label class="pc94-lb" for="hrPayrollGroup">فئة الكشف</label><select id="hrPayrollGroup" class="pc93-name">${["","النظامين","غير نظامين"].map(x=>`<option value="${x}" ${x===(e.payrollGroup||"")?"selected":""}>${x||"غير مصنف"}</option>`).join("")}</select>
    <p class="pc85-hint">قسم العمل والمهنة مخصصان لتقارير الرواتب. قسم المطبخ والدور في النظام يُداران من الحقول التشغيلية أعلاه.</p></details>`;
}
function pcHrPayrollProfileRead(host){
  const get=id=>host.querySelector('#'+id)?.value.trim()||"";
  return {jobTitle:get("hrJobTitle"),payrollDepartment:get("hrPayrollDept"),payrollBranchName:get("hrPayrollBranch"),payrollPaymentMethod:get("hrPayrollPayment"),payrollGroup:get("hrPayrollGroup"),payrollMetadataUpdatedAtMs:Date.now()};
}

function pcHrPayrollSalaryFields(e){
  const fields=[["hrBasicSalary","الراتب الأساسي",e.payrollBasicSalary],["hrHousingAllowance","بدل السكن",e.payrollHousingAllowance],["hrTransportAllowance","بدل الانتقالات",e.payrollTransportAllowance],["hrInsuranceAmount","التأمينات (خصم شهري)",e.payrollInsuranceAmount]];
  return `<div class="pc102-shift">${fields.map(([id,label,value])=>`<div><label class="pc94-lb" for="${id}">${label} (ر.س)</label><input id="${id}" class="pc93-name" type="number" min="0" step="0.01" inputmode="decimal" dir="ltr" value="${escapeHtml(String(value??""))}" oninput="pcHrPayrollSalarySync()"></div>`).join("")}</div><p class="pc85-hint">الإجمالي = الأساسي + بدل السكن + بدل الانتقالات. التأمينات خصم مستقل بالقيمة المسجلة، ولا تُحتسب تلقائيًا حسب الجنسية. عند ترك التفصيل فارغًا يُستخدم المرتب الشهري القديم.</p>`;
}
function pcHrPayrollSalaryRead(host){
  const read=id=>pcHrSalaryParse(host.querySelector('#'+id)?.value||"");
  const basic=read("hrBasicSalary"),housing=read("hrHousingAllowance"),transport=read("hrTransportAllowance"),insurance=read("hrInsuranceAmount");
  const error=[basic,housing,transport,insurance].find(x=>x.error)?.error;if(error)return {error,data:{}};
  if(basic.value===null&&(housing.value!==null||transport.value!==null))return {error:"أدخل الأساسي لحساب إجمالي الأساسي والبدلات",data:{}};
  const data={payrollBasicSalary:basic.value,payrollHousingAllowance:housing.value,payrollTransportAllowance:transport.value,payrollInsuranceAmount:insurance.value};
  if(basic.value!==null)data.monthlySalary=Math.round((basic.value+(housing.value||0)+(transport.value||0))*100)/100;
  if(data.monthlySalary>1000000000)return {error:"إجمالي الراتب يتجاوز الحد المسموح",data:{}};
  return {error:"",data};
}
function pcHrPayrollSalarySync(){
  const host=document.getElementById("pcSheetHost"),total=host?.querySelector("#hrSalary");if(!host||!total)return;
  const result=pcHrPayrollSalaryRead(host),computed=result.data.monthlySalary;
  total.readOnly=computed!==undefined;if(computed!==undefined)total.value=String(computed);
}
