/* Itemized supplier invoices. Accounting and stock changes commit in one transaction. */
var pcPurchaseTargets = [], pcPurchaseDraft = [], pcPurchaseSaving = false;

function accPurchaseTargets(){
  const targets = [{id:"central", kind:"central", label:"المستودع الرئيسي", store:"raw", branchId:"", section:""}];
  pcActiveBranches().forEach(b=>{
    if(!Number(b.stockStartMs)) return;
    const sections = [...new Set((pcRaw.chefSections||chefSections||[]).filter(s=>pcBranchOf(s)===b.id).map(s=>s.name).filter(Boolean))];
    sections.forEach(section=>["raw","prod"].forEach(store=>targets.push({
      id:JSON.stringify([b.id,section,store]), kind:"section", branchId:b.id, section, store,
      label:`${b.name} / ${section} / ${store==="raw"?"مخزن خام":"مخزن إنتاج"}`
    })));
  });
  return targets;
}
function accPurchaseTarget(){ return pcPurchaseTargets.find(t=>t.id===document.getElementById("piTarget")?.value); }
function accPurchaseCatalog(target){
  if(!target) return [];
  const all = target.store === "prod" ? (menuItems||[]) : (warehouseItems||[]);
  return target.kind === "central" ? all : (pcSecFilter(target.section,target.store,all) || all);
}
function accPurchaseChangeTarget(){
  // Never silently discard already-entered lines when switching stores.
  if(pcPurchaseDraft.length && document.getElementById("piTarget").dataset.previous!==document.getElementById("piTarget").value){
    document.getElementById("piTarget").value=document.getElementById("piTarget").dataset.previous;
    showToast("احذف بنود الفاتورة أولًا قبل تغيير المخزن","warn"); return;
  }
  const target=accPurchaseTarget();
  document.getElementById("piTarget").dataset.previous=target?.id||"";
  const list=accPurchaseCatalog(target);
  document.getElementById("piItem").innerHTML='<option value="">اختر الصنف</option>'+list.map(i=>`<option value="${escapeHtml(i.id)}">${escapeHtml([i.code,pc17ItemName(i),i.unit].filter(Boolean).join(" — "))}</option>`).join("");
  document.getElementById("piUnit").textContent="—";
}
function accPurchaseItemChanged(){
  const item=accPurchaseCatalog(accPurchaseTarget()).find(i=>i.id===document.getElementById("piItem").value);
  document.getElementById("piUnit").textContent=item?.unit||"—";
}
function accPurchaseAddLine(){
  const target=accPurchaseTarget();
  const item=accPurchaseCatalog(target).find(i=>i.id===document.getElementById("piItem").value);
  const qty=accNum(document.getElementById("piQty").value), price=accNum(document.getElementById("piPrice").value);
  if(!item){ showToast("اختر الصنف","error"); return; }
  if(!Number.isFinite(qty)||qty<=0||pc70R(qty)<=0){ showToast("اكتب كمية أكبر من صفر","error"); return; }
  if(!Number.isFinite(price)||price<0){ showToast("اكتب سعر الوحدة قبل الضريبة","error"); return; }
  if(pcPurchaseDraft.length>=100){ showToast("الحد الأقصى 100 بند للفاتورة","error"); return; }
  pcPurchaseDraft.push({itemId:item.id, code:item.code||"", name:pc17ItemName(item), unit:pc70Unit(item.unit)||"حبة", qty:pc70R(qty), price, total:accR(pc70R(qty)*price)});
  document.getElementById("piQty").value=""; document.getElementById("piPrice").value="";
  accPurchaseDrawLines();
}
function accPurchaseRemoveLine(index){ pcPurchaseDraft.splice(index,1); accPurchaseDrawLines(); }
function accPurchaseDrawLines(){
  document.getElementById("piLines").innerHTML=pcPurchaseDraft.length?`<div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>الصنف</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>الإجمالي</th><th></th></tr></thead><tbody>${pcPurchaseDraft.map((l,i)=>`<tr><td>${escapeHtml(l.name)}</td><td>${pc60Num(l.qty)}</td><td>${escapeHtml(l.unit)}</td><td>${accTxt(l.price)}</td><td>${accTxt(l.total)}</td><td><button type="button" class="mini-danger" onclick="accPurchaseRemoveLine(${i})">إزالة</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="pc85-hint">أضف أصناف الفاتورة وكمياتها وأسعارها.</p>';
  accPurchaseCalc();
}
function accPurchaseCalc(){
  const base=accR(pcPurchaseDraft.reduce((n,l)=>n+l.total,0));
  const vat=document.getElementById("piVatOn")?.checked?accR(base*PC_VAT):0;
  const total=document.getElementById("piTotal");
  if(total) total.textContent=`قبل الضريبة: ${accTxt(base)} | الضريبة: ${accTxt(vat)} | الإجمالي: ${accTxt(base+vat)}`;
}
function accPurchaseRead(host){
  const get=id=>host.querySelector('#'+id)?.value?.trim()||"";
  const target=pcPurchaseTargets.find(t=>t.id===get("piTarget"));
  const lines=pcPurchaseDraft.map(l=>({...l}));
  const base=accR(lines.reduce((n,l)=>n+l.total,0));
  const vat=host.querySelector("#piVatOn").checked?accR(base*PC_VAT):0;
  return {date:get("piDate"),due:get("piDue"),ref:get("piRef"),by:get("piBy"),note:get("piNote"),target,lines,base,vat,amount:accR(base+vat)};
}
function accPurchaseValidate(v,s){
  if(!accCan("bill")) return "ليس لديك صلاحية تسجيل فواتير المشتريات";
  if(!v.date||v.date>pcHrToday()) return "تاريخ الفاتورة غير صحيح";
  if(v.due&&v.due<v.date) return "تاريخ الاستحقاق قبل الفاتورة";
  if(!v.ref) return "اكتب رقم فاتورة المورد";
  if(!v.by) return "اكتب اسم المسجِّل";
  if(!v.target||!accPurchaseTargets().some(t=>t.id===v.target.id)) return "اختر مخزنًا نشطًا";
  if(!v.lines.length||v.lines.length>100) return "أضف أصناف الفاتورة (حتى 100 بند)";
  const catalog=accPurchaseCatalog(v.target);
  if(v.lines.some(l=>!catalog.some(i=>i.id===l.itemId)||!Number.isFinite(l.qty)||l.qty<=0||!Number.isFinite(l.price)||l.price<0)) return "راجع الأصناف والكميات والأسعار";
  if(v.lines.some(l=>l.total!==accR(l.qty*l.price))||v.base!==accR(v.lines.reduce((n,l)=>n+l.total,0))||![0,accR(v.base*PC_VAT)].includes(v.vat)||v.amount!==accR(v.base+v.vat)) return "راجع إجماليات الفاتورة";
  if(!Number.isFinite(v.amount)||v.amount<=0) return "إجمالي الفاتورة يجب أن يكون أكبر من صفر";
  if(!Number.isSafeInteger(Math.round(v.amount*100))) return "مبلغ الفاتورة أكبر من الحد المسموح";
  if(accSupTx(s.id).some(t=>t.type==="bill"&&String(t.ref).trim()===v.ref)) return "رقم الفاتورة مسجل من قبل لهذا المورد";
  return "";
}
async function accPurchaseEdit(supplierId){
  if(pcPurchaseSaving) return;
  if(!accCan("bill")) return showToast("ليس لديك صلاحية تسجيل فواتير المشتريات","error");
  const s=accList("accSuppliers",accSuppliers).find(x=>x.id===supplierId); if(!s) return;
  pcPurchaseTargets=accPurchaseTargets(); pcPurchaseDraft=[];
  const today=pcHrToday();
  setTimeout(()=>{ if(document.getElementById("piTarget")){ accPurchaseChangeTarget(); accPurchaseDrawLines(); } },0);
  const result=await pcSheet({title:`فاتورة مشتريات — ${s.name}`,icon:"fa-file-invoice",body:`
    <div class="pc102-shift"><div><label class="pc94-lb" for="piDate">تاريخ الفاتورة</label><input id="piDate" class="pc93-name" type="date" max="${today}" value="${today}"></div><div><label class="pc94-lb" for="piDue">تاريخ الاستحقاق</label><input id="piDue" class="pc93-name" type="date" value="${pcHrAddDays(today,Number(s.terms||0))}"></div></div>
    <label class="pc94-lb" for="piRef">رقم فاتورة المورد</label><input id="piRef" class="pc93-name" maxlength="40">
    <label class="pc94-lb" for="piTarget">إضافة المشتريات إلى مخزن</label><select id="piTarget" class="pc93-name" onchange="accPurchaseChangeTarget()">${pcPurchaseTargets.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`).join("")}</select>
    <p class="pc85-hint">تظهر مخازن الأقسام بعد تفعيل مستودعات الفرع. تُضاف الكميات بوحدة الصنف المسجلة. الصنف بدون رصيد مسجل في المستودع الرئيسي يبدأ من صفر.</p>
    <label class="pc94-lb" for="piItem">الصنف</label><select id="piItem" class="pc93-name" onchange="accPurchaseItemChanged()"></select>
    <p class="pc85-hint">الوحدة: <b id="piUnit">—</b></p>
    <div class="pc102-shift"><div><label class="pc94-lb" for="piQty">الكمية</label><input id="piQty" class="pc93-name" inputmode="decimal" dir="ltr"></div><div><label class="pc94-lb" for="piPrice">سعر الوحدة قبل الضريبة</label><input id="piPrice" class="pc93-name" inputmode="decimal" dir="ltr"></div></div>
    <button type="button" class="btn btn-light" onclick="accPurchaseAddLine()">إضافة بند</button><div id="piLines"></div>
    <label class="pc110-adm pc112-vat"><input id="piVatOn" type="checkbox" ${s.vat?"checked":""} onchange="accPurchaseCalc()"><span>ضريبة القيمة المضافة 15%</span></label>
    <p class="pc112-total" id="piTotal"></p>
    <label class="pc94-lb" for="piNote">ملاحظة</label><input id="piNote" class="pc93-name" maxlength="200">${pcByField("piBy","اسم المسجِّل")}
    <p id="piError" role="alert" style="color:var(--danger,#b42318)"></p>`, actions:[
      {label:"حفظ الفاتورة وإضافة المخزون",kind:"btn-main",check:h=>{ const error=accPurchaseValidate(accPurchaseRead(h),s); h.querySelector("#piError").textContent=error; return error; },value:h=>({invoice:accPurchaseRead(h)})},
      {label:"إلغاء",kind:"btn-light",value:null}]});
  if(!result) return;
  if(pcPurchaseSaving) return;
  pcPurchaseSaving=true;
  try{ await accPurchaseSave(s,result.invoice); pcStoreSaveBy(result.invoice.by); showToast("تم حفظ الفاتورة وإضافة الكميات للمخزن"); pcAccDraw(true); }
  catch(e){ console.error(e); showToast(e.message||"تعذر حفظ الفاتورة والمخزون","error");
    // Retry with the same complete invoice and deterministic document ID.
    await accPurchaseRetry(s,result.invoice);
  }finally{ pcPurchaseSaving=false; }
}
async function accPurchaseRetry(s,v){
  while(await pcConfirm(`لم تُحفظ الفاتورة: ${v.ref}. ${v.target.label}. الإجمالي ${accTxt(v.amount)}. إعادة محاولة حفظ نفس الفاتورة؟`,{title:"تعذر الحفظ",okText:"إعادة المحاولة"})){
    try{ await accPurchaseSave(s,v); showToast("تم حفظ الفاتورة وإضافة المخزون"); pcAccDraw(true); return; }
    catch(e){ showToast(e.message||"تعذر الحفظ","error"); }
  }
}
async function accPurchaseDocId(supplierId,ref){
  const bytes=new TextEncoder().encode(JSON.stringify([supplierId,ref.trim()]));
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return "purchase_"+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}
function accPurchaseStockSums(lines){
  const sums=new Map(); lines.forEach(l=>sums.set(l.itemId,pc70R((sums.get(l.itemId)||0)+l.qty))); return sums;
}
async function accPurchaseSave(s,v){
  const error=accPurchaseValidate(v,s); if(error) throw new Error(error);
  const {db,doc,runTransaction}=window.firebaseDB;
  const id=await accPurchaseDocId(s.id,v.ref), billRef=doc(db,"acc_supplier_tx",id), target=v.target;
  const sums=accPurchaseStockSums(v.lines), stockRefs=[...sums].map(([itemId])=>doc(db,target.store==="prod"?"menu_items":"warehouse_items",itemId));
  await runTransaction(db,async tx=>{
    const old=await tx.get(billRef); if(old.exists()) throw new Error("رقم الفاتورة مسجل من قبل لهذا المورد");
    const supplier=await tx.get(doc(db,"acc_suppliers",s.id));
    if(!supplier.exists()||supplier.data().inactive) throw new Error("المورد غير متاح");
    const snapshots=await Promise.all(stockRefs.map(r=>tx.get(r)));
    if(snapshots.some(x=>!x.exists())) throw new Error("أحد الأصناف لم يعد موجودًا؛ راجع الفاتورة");
    const byId=new Map(snapshots.map(x=>[x.id,x.data()]));
    if(v.lines.some(l=>pc70Unit(byId.get(l.itemId).unit||"حبة")!==l.unit)) throw new Error("تغيرت وحدة أحد الأصناف؛ أعد فتح الفاتورة");
    if(target.kind!=="central"){
      const branch=await tx.get(doc(db,"branches",target.branchId));
      if(!branch.exists()||branch.data().active===false||!Number(branch.data().stockStartMs)||Number(branch.data().stockStartMs)>Date.now()) throw new Error("مستودعات هذا الفرع غير مفعلة");
    }
    const inventoryAccount=target.kind==="central"?"1231":target.store==="raw"?"1232":"1233";
    const journalLines=[{account:inventoryAccount,debit:v.base,credit:0},...(v.vat?[{account:"1241",debit:v.vat,credit:0}]:[]),{account:"2211",debit:0,credit:v.amount}];
    await accJournalCheck(tx,journalLines);
    const now=Date.now();
    tx.set(billRef,{supplierId:s.id,supplierName:s.name,type:"bill",date:v.date,due:v.due||v.date,ref:v.ref,base:v.base,vat:v.vat,amount:v.amount,method:"",branchId:target.branchId,note:v.note,by:v.by,createdAtMs:now,
      inventoryVersion:1,inventoryTarget:{...target},items:v.lines,stockMoveId:target.kind==="central"?"":id,journalLines,chartVersion:PC_CHART_VERSION});
    if(target.kind==="central"){
      snapshots.forEach((snap,i)=>{
        const current=pc86Stock(snap.data());
        tx.update(stockRefs[i],{stockQty:pc70R((current===null?0:current)+sums.get(snap.id))});
      });
    }else{
      const lines=v.lines.map(l=>({key:`${target.store}:${l.itemId}`,itemId:l.itemId,code:l.code,name:l.name,unit:l.unit,qty:l.qty}));
      tx.set(doc(db,"branch_stock_moves",id),{branchId:target.branchId,section:target.section,store:target.store,type:"purchase",invoiceId:id,invoiceRef:v.ref,supplierId:s.id,by:v.by,note:v.note,lines,createdAtMs:now,timeMs:now});
    }
  });
}
async function accPurchaseVoid(col,id,v){
  const {db,doc,runTransaction}=window.firebaseDB;
  if(!accCan("void")) throw new Error("ليس لديك صلاحية إلغاء القيود");
  await runTransaction(db,async tx=>{
    const ref=doc(db,col,id), snap=await tx.get(ref);
    if(!snap.exists()) throw new Error("القيد غير موجود");
    const bill=snap.data(); if(bill.voided) throw new Error("القيد ملغي بالفعل");
    const inventory=col==="acc_supplier_tx"&&bill.type==="bill"&&bill.inventoryVersion===1;
    let stock=[], moveRef;
    if(inventory&&bill.inventoryTarget.kind==="central"){
      for(const [itemId,qty] of accPurchaseStockSums(bill.items)){
        const itemRef=doc(db,"warehouse_items",itemId), item=await tx.get(itemRef);
        if(!item.exists()||pc86Stock(item.data())===null||pc86Stock(item.data())+0.000001<qty) throw new Error("رصيد المخزن لا يكفي لعكس الفاتورة؛ راجع الأصناف المصروفة أولًا");
        stock.push({ref:itemRef,qty:pc70R(pc86Stock(item.data())-qty)});
      }
    }else if(inventory){
      moveRef=doc(db,"branch_stock_moves",bill.stockMoveId);
      const move=await tx.get(moveRef); if(!move.exists()) throw new Error("حركة توريد الفاتورة غير موجودة؛ راجع المسؤول");
    }
    const audit={voided:true,voidReason:v.why,voidBy:v.by,voidAtMs:Date.now()};
    tx.update(ref,audit);
    stock.forEach(s=>tx.update(s.ref,{stockQty:s.qty}));
    if(moveRef) tx.update(moveRef,{cancelled:true,...audit});
  });
}

function accPurchaseView(id){
  if(!accCan("sup")) return;
  const bill=accList("accSupplierTx",accSupplierTx).find(x=>x.id===id&&x.type==="bill"); if(!bill) return;
  return pcSheet({title:`فاتورة مشتريات #${bill.ref}`,icon:"fa-file-invoice",body:`
    <p><b>${escapeHtml(bill.supplierName||"")}</b> · ${escapeHtml(bill.date||"")}</p>
    <p>المخزن: ${escapeHtml(bill.inventoryTarget?.label||"غير مرتبط بمخزون")}</p>
    ${bill.voided?`<p>ملغاة — ${escapeHtml(bill.voidReason||"")}</p>`:""}
    <div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>الصنف</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${(bill.items||[]).map(l=>`<tr><td>${escapeHtml(l.name)}</td><td>${pc60Num(l.qty)}</td><td>${escapeHtml(l.unit)}</td><td>${accTxt(l.price)}</td><td>${accTxt(l.total)}</td></tr>`).join("")}</tbody></table></div>
    <p>قبل الضريبة: ${accTxt(bill.base)} · الضريبة: ${accTxt(bill.vat)} · الإجمالي: ${accTxt(bill.amount)}</p>
    <p>${pcNoteHtml(bill.note||"")}</p>
    <h4>القيد المحاسبي</h4><div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr></thead><tbody>${(bill.journalLines||[]).map(l=>`<tr><td>${escapeHtml(accAccountCode(l.account,bill.chartVersion)+" — "+(accAccount(accAccountCode(l.account,bill.chartVersion))?.name||""))}</td><td>${accTxt(l.debit)}</td><td>${accTxt(l.credit)}</td></tr>`).join("")}</tbody></table></div>`,actions:[{label:"إغلاق",kind:"btn-light",value:null}]});
}
