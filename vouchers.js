/* Payment vouchers share supplier payments with the existing supplier statement. */
var pcVoucherSaving=false;
function accVoucherCanRead(kind){ return pcCan("acc.vouchers") || accCan(kind==="supplier"?"pay":"expense") || (kind==="supplier" && accCan("sup")); }
function accVoucherRows(){
  const supplier=accVoucherCanRead("supplier")?accList("accSupplierTx",accSupplierTx).filter(x=>x.type==="payment").map(x=>({...x,kind:"supplier",payee:x.supplierName||"",category:"دفعة مورد",collection:"acc_supplier_tx"})):[];
  const expense=accVoucherCanRead("expense")?accList("accExpenses",accExpenses).map(x=>({...x,kind:"expense",collection:"acc_expenses"})):[];
  return [...supplier,...expense].filter(x=>String(x.date).startsWith(pcAcc.month)&&(!pcAcc.branch||x.branchId===pcAcc.branch)).sort((a,b)=>String(b.date).localeCompare(String(a.date))||(b.createdAtMs||0)-(a.createdAtMs||0));
}
function accVoucherHtml(){
  const rows=accVoucherRows(), live=rows.filter(x=>!x.voided);
  const sum=kind=>accR(live.filter(x=>x.kind===kind).reduce((n,x)=>n+Number(x.amount||0),0));
  return `<div class="pc112-bar">
    <label class="pc112-month">الشهر <input type="month" value="${escapeHtml(pcAcc.month)}" onchange="pcAcc.month=this.value||pcAcc.month;pcAccDraw(true)"></label>
    <select class="pc93-name pc112-sel" onchange="pcAcc.branch=this.value;pcAccDraw(true)"><option value="">كل الفروع</option>${accBranchOptions(pcAcc.branch,false)}</select>
    ${accCan("pay")?'<button type="button" class="btn btn-main" onclick="accVoucherEdit(\'supplier\')">سند صرف لمورد</button>':""}
    ${accCan("expense")?'<button type="button" class="btn btn-main" onclick="accVoucherEdit(\'expense\')">سند مصروف عام</button>':""}
    ${accCan("export")?'<button type="button" class="btn btn-light" onclick="accVoucherExport()">تصدير Excel</button>':""}</div>
    <div class="pc112-kpis"><div><span>دفعات الموردين</span><b>${accTxt(sum("supplier"))}</b></div><div><span>المصروفات العامة</span><b>${accTxt(sum("expense"))}</b></div><div><span>إجمالي الصرف</span><b>${accTxt(sum("supplier")+sum("expense"))}</b></div></div>
    <p class="pc85-hint">هذه سندات لتسجيل الصرف محاسبيًا، ولا تنفذ تحويلًا بنكيًا. دفعات الموردين تظهر في كشف حساب المورد. المصروف العام يُرحّل إلى حساب المصروف المختار.</p>
    ${rows.length?`<div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>السند / التاريخ</th><th>النوع</th><th>المستفيد</th><th>الحساب / التصنيف</th><th>الفرع</th><th>المبلغ</th><th>الدفع</th><th>الحالة</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.voided?"void":""}"><td>${escapeHtml(x.voucherNo||x.ref||"سداد سابق")}<br><small>${escapeHtml(x.date)}</small></td><td>${x.kind==="supplier"?"دفعة مورد":"مصروف عام"}</td><td>${escapeHtml(x.payee)}${x.note?`<br><small>${pcNoteHtml(x.note)}</small>`:""}</td><td>${escapeHtml(x.category||"")}</td><td>${escapeHtml(accBranchLabel(x.branchId))}</td><td>${accTxt(x.amount)}</td><td>${escapeHtml(x.method||"")}</td><td>${x.voided?`ملغي: ${pcNoteHtml(x.voidReason||"")}`:"مسجل"}</td><td><button type="button" class="mini-btn" data-kind="${x.kind}" data-id="${escapeHtml(x.id)}" onclick="accVoucherPrint(this.dataset.kind,this.dataset.id)">طباعة</button> ${!x.voided&&accCan("void")?`<button type="button" class="mini-danger" data-col="${x.collection}" data-id="${escapeHtml(x.id)}" onclick="accVoid(this.dataset.col,this.dataset.id)">إلغاء</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:pc60Empty("fa-money-bill-transfer","لا توجد سندات صرف في الفترة المختارة")}`;
}
function accVoucherRead(h,kind,supplierId){
  const get=id=>h.querySelector('#'+id)?.value?.trim()||"";
  const expenseAccount=get("pvExpense");
  return {kind,supplierId:get("pvSupplier")||supplierId||"",date:get("pvDate"),amount:accR(accNum(get("pvAmount"))),method:get("pvMethod"),paymentAccount:get("pvAccount"),expenseAccount,payee:get("pvPayee"),category:accAccount(expenseAccount)?.name||"",branchId:get("pvBranch"),ref:get("pvRef"),note:get("pvNote"),by:get("pvBy")};
}
function accVoucherValidate(v){
  if(!["supplier","expense"].includes(v.kind)||!accCan(v.kind==="supplier"?"pay":"expense")) return "ليس لديك صلاحية تسجيل هذا السند";
  if(!v.date||v.date>pcHrToday()) return "تاريخ غير صحيح";
  if(!Number.isFinite(v.amount)||v.amount<=0) return "اكتب مبلغًا أكبر من صفر";
  if(!Number.isSafeInteger(Math.round(v.amount*100))) return "مبلغ السند أكبر من الحد المسموح";
  if(!v.by) return "اكتب اسم المسجِّل";
  if(!PC_ACC_METHODS.includes(v.method)) return "اختر طريقة السداد";
  const bank=accAccount(v.paymentAccount);
  if(!bank||!bank.posting||!bank.active||!bank.code.startsWith("121")) return "اختر حساب الصندوق أو البنك";
  if(v.branchId&&!pcActiveBranches().some(b=>b.id===v.branchId)) return "الفرع غير متاح";
  if(v.kind==="supplier"){
    const s=accList("accSuppliers",accSuppliers).find(s=>s.id===v.supplierId&&!s.inactive);
    if(!s) return "اختر المورد";
  }else{
    if(!v.payee) return "اكتب اسم الجهة المستفيدة";
    const a=accAccount(v.expenseAccount);
    if(!a||!a.posting||!a.active||a.type!=="expense") return "اختر حساب المصروف";
  }
  return "";
}
async function accVoucherEdit(kind,supplierId){
  if(pcVoucherSaving) return;
  if(!accCan(kind==="supplier"?"pay":"expense")) return showToast("ليس لديك صلاحية تسجيل هذا السند","error");
  const suppliers=accList("accSuppliers",accSuppliers).filter(s=>!s.inactive), today=pcHrToday();
  const v=await pcSheet({title:kind==="supplier"?"سند صرف — دفعة مورد":"سند صرف — مصروف عام",icon:"fa-money-bill-transfer",body:`
    <label class="pc94-lb" for="pvDate">التاريخ</label><input id="pvDate" class="pc93-name" type="date" max="${today}" value="${today}">
    ${kind==="supplier"?`<label class="pc94-lb" for="pvSupplier">المورد</label><select id="pvSupplier" class="pc93-name"><option value="">اختر المورد</option>${suppliers.map(s=>`<option value="${escapeHtml(s.id)}" ${s.id===supplierId?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}</select>`:`<label class="pc94-lb" for="pvPayee">الجهة المستفيدة</label><input id="pvPayee" class="pc93-name" maxlength="100"><label class="pc94-lb" for="pvExpense">حساب المصروف / التصنيف</label><select id="pvExpense" class="pc93-name">${accAccountOptions("7145",a=>a.type==="expense")}</select>`}
    <label class="pc94-lb" for="pvAmount">المبلغ</label><input id="pvAmount" class="pc93-name" inputmode="decimal" dir="ltr">
    <label class="pc94-lb" for="pvMethod">طريقة السداد</label><select id="pvMethod" class="pc93-name">${PC_ACC_METHODS.map(m=>`<option>${escapeHtml(m)}</option>`).join("")}</select>
    <label class="pc94-lb" for="pvAccount">حساب الصندوق / البنك الدائن</label><select id="pvAccount" class="pc93-name">${accAccountOptions("1211",a=>a.code.startsWith("121"))}</select>
    <label class="pc94-lb" for="pvBranch">الفرع / مركز التكلفة</label><select id="pvBranch" class="pc93-name">${accBranchOptions(pcAcc.branch||"",true)}</select>
    <label class="pc94-lb" for="pvRef">مرجع التحويل / الشيك / المستند</label><input id="pvRef" class="pc93-name" maxlength="80">
    <label class="pc94-lb" for="pvNote">البيان / سبب الصرف</label><input id="pvNote" class="pc93-name" maxlength="200">${pcByField("pvBy","اسم المسجِّل")}
    <p id="pvError" role="alert" style="color:var(--danger,#b42318)"></p>`,actions:[{label:"حفظ السند",kind:"btn-main",check:h=>{const error=accVoucherValidate(accVoucherRead(h,kind,supplierId));h.querySelector("#pvError").textContent=error;return error;},value:h=>accVoucherRead(h,kind,supplierId)},{label:"إلغاء",kind:"btn-light",value:null}]});
  if(!v) return;
  const s=kind==="supplier"?suppliers.find(s=>s.id===v.supplierId):null;
  if(s&&v.amount>accSupState(s).balance+0.009&&!await pcConfirm("الدفعة أكبر من رصيد المورد؛ سيسجل الفرق دفعة مقدمة. متابعة؟",{title:"دفعة مقدمة",okText:"تسجيل"})) return;
  pcVoucherSaving=true;
  // Keep a stable document ID across retries, including lost acknowledgements.
  const {db,doc,collection}=window.firebaseDB, col=kind==="supplier"?"acc_supplier_tx":"acc_expenses", ref=doc(collection(db,col));
  try{
    let saved=false;
    do{
      try{await accVoucherSave(v,ref);saved=true;}
      catch(e){console.error(e);if(!await pcConfirm(`تعذر حفظ السند: ${e.message||"تحقق من الاتصال"}. إعادة المحاولة؟`,{title:"تعذر الحفظ",okText:"إعادة المحاولة"})) return;}
    }while(!saved);
    pcStoreSaveBy(v.by);pcAcc.month=v.date.slice(0,7);pcAcc.tab="vouchers";
    showToast("تم حفظ سند الصرف وترحيله للحسابات");pcAccDraw(true);
  }finally{pcVoucherSaving=false;}
}
function accVoucherJournal(v){
  return [{account:v.kind==="supplier"?"2211":v.expenseAccount,debit:v.amount,credit:0},{account:v.paymentAccount,debit:0,credit:v.amount}];
}
async function accVoucherSave(v,ref){
  const error=accVoucherValidate(v);if(error) throw new Error(error);
  const {db,doc,runTransaction}=window.firebaseDB, journalLines=accVoucherJournal(v);
  await runTransaction(db,async tx=>{
    const old=await tx.get(ref);if(old.exists()) return;
    let supplier;
    if(v.kind==="supplier"){
      const s=await tx.get(doc(db,"acc_suppliers",v.supplierId));
      if(!s.exists()||s.data().inactive) throw new Error("المورد غير متاح"); supplier=s.data();
    }
    await accJournalCheck(tx,journalLines);
    const voucherNo=`PV-${v.date.replaceAll("-","")}-${ref.id}`;
    const base={date:v.date,amount:v.amount,method:v.method,paymentAccount:v.paymentAccount,ref:v.ref,note:v.note,by:v.by,branchId:v.branchId,createdAtMs:Date.now(),voucherNo,journalLines,chartVersion:PC_CHART_VERSION};
    tx.set(ref,v.kind==="supplier"?{...base,type:"payment",supplierId:v.supplierId,supplierName:supplier.name,due:"",base:0,vat:0}:{...base,type:"expense",payee:v.payee,category:v.category,expenseAccount:v.expenseAccount});
  });
}
function accVoucherFind(kind,id){
  if(!accVoucherCanRead(kind)) return null;
  return (kind==="supplier"?accList("accSupplierTx",accSupplierTx):accList("accExpenses",accExpenses)).find(x=>x.id===id&&(kind!=="supplier"||x.type==="payment"));
}
function accVoucherPrint(kind,id){
  const x=accVoucherFind(kind,id);if(!x) return;
  const pairs=[["رقم السند",x.voucherNo||x.id],["التاريخ",x.date],["نوع الصرف",kind==="supplier"?"دفعة مورد":"مصروف عام"],["المستفيد",x.supplierName||x.payee],["المبلغ",accTxt(x.amount)],["طريقة السداد",x.method],["الفرع",accBranchLabel(x.branchId)],["حساب الصرف",x.paymentAccount?accAccountCode(x.paymentAccount,x.chartVersion)+" — "+(accAccount(accAccountCode(x.paymentAccount,x.chartVersion))?.name||""):"غير مسجل"],["التصنيف",x.category||"دفعة مورد"],["المرجع",x.ref],["البيان",x.note],["المسجِّل",x.by],["الحالة",x.voided?"ملغي — "+(x.voidReason||""):"مسجل"]];
  openPrintReport("سند صرف",`<table>${pairs.map(([k,v])=>`<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v||"—")}</td></tr>`).join("")}</table><p>توقيع المستلم: ____________________</p><p>توقيع المحاسب: ____________________</p><p>اعتماد المسؤول: ____________________</p>`);
}
function accVoucherExport(){
  if(!accCan("vouchers")||!accCan("export")) return;
  accXlsx([["سندات الصرف",accVoucherRows().map(x=>({"رقم السند":x.voucherNo||x.id,"التاريخ":x.date,"النوع":x.kind==="supplier"?"دفعة مورد":"مصروف عام","المستفيد":x.payee,"التصنيف":x.category,"المبلغ":x.amount,"الدفع":x.method,"الفرع":accBranchLabel(x.branchId),"المرجع":x.ref,"البيان":x.note,"المسجِّل":x.by,"الحالة":x.voided?"ملغي":"مسجل"}))]],`vouchers-${pcAcc.month}.xlsx`);
}
