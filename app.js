/* Protein & Carb Operations - Cloud Full Core
   Added:
   - Production input button + Enter support
   - Warehouse order archive after received
   - Warehouse archive view in admin
*/

const app = document.getElementById("app");

let chefSections = [];
let chefs = [];
let warehouseItems = [];
let menuItems = [];
let warehouseOrders = [];
let dismissedAlerts = [];
let cleaningTasks = [];
let cleaningLogs = [];
let operationTasks = [];
let operationLogs = [];
let productionLogs = [];
let wasteLogs = [];
let warehouseStaff = [];
let internalDestinations = [];
let internalIssues = [];

let systemSettings = {
  adminPassword: "0000",
  warehousePassword: "1111",
  orderCounter: 1001
};

let currentChef = null;
let currentCart = [];
let productionDraft = [];
let internalIssueCart = [];
let operationRunDraft = {};

let currentBackFn = "renderHome()";
let isPhoneBack = false;

let lastWarehouseNewCount = null;
let lastSystemCounts = null;
let uxAudioContext = null;

function ensureUxStyle(){
  if(document.getElementById("proteinUxStyle")) return;
  const style=document.createElement("style");
  style.id="proteinUxStyle";
  style.textContent=`
    .order-badge{position:absolute;top:17px;right:50%;transform:translateX(43px);min-width:28px;height:28px;padding:0 8px;border-radius:999px;background:#E53935;color:#fff;border:3px solid #fff;box-shadow:0 10px 20px rgba(229,57,53,.28);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;z-index:5}
    .warehouse-home-card{overflow:visible!important}
    #toastHost{position:fixed;top:18px;left:18px;z-index:99999;display:grid;gap:10px;max-width:min(360px,calc(100vw - 36px))}
    .toast-item{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.96);border:1px solid rgba(255,255,255,.8);box-shadow:0 18px 45px rgba(18,51,37,.18);border-radius:20px;padding:12px 14px;transform:translateY(-12px);opacity:0;transition:.25s ease;backdrop-filter:blur(14px)}
    .toast-item.show{transform:translateY(0);opacity:1}
    .toast-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#43A94D;color:white;font-weight:900;flex:none}
    .toast-warn .toast-icon{background:#F4C542;color:#1B4D32}
    .toast-error .toast-icon{background:#E53935}
    .toast-text{font-weight:900;color:#1B4D32;line-height:1.6}
    .task-list{display:grid;gap:12px}
    .task-check-card{display:grid!important;grid-template-columns:auto 1fr;gap:12px;align-items:center;background:rgba(255,255,255,.94);border:1px solid rgba(255,255,255,.78);border-radius:24px;padding:16px;box-shadow:0 10px 28px rgba(18,51,37,.10);margin:0!important;color:#1B4D32}
    .task-check-card input{display:none}
    .task-check-ui{width:28px;height:28px;border-radius:9px;border:2px solid #43A94D;display:inline-flex;align-items:center;justify-content:center;background:white}
    .task-check-card input:checked + .task-check-ui{background:#43A94D;border-color:#43A94D}
    .task-check-card input:checked + .task-check-ui::after{content:"✓";color:white;font-weight:900}
    .task-text{display:grid;gap:3px}
    .task-text small{color:#72806D;font-weight:800;font-size:14px}
    .issue-box{background:rgba(255,246,214,.55)!important;border:1px solid rgba(244,197,66,.32)!important}
    .issue-row{display:grid;grid-template-columns:1fr 120px;gap:10px;align-items:center;border-bottom:1px solid #e5eadb;padding:10px 0}
    .issue-row input{margin:0!important;text-align:center}
    .issued-display{text-align:left;display:grid;gap:4px}
    .issued-display b:last-child{color:#2E7D32}

    .admin-actions{position:relative;margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .admin-menu-wrap{position:relative;display:inline-block}
    .admin-menu-btn{min-width:44px!important;padding:8px 12px!important;font-size:20px!important;line-height:1!important}
    .admin-menu{display:none;position:absolute;right:0;left:auto;top:48px;bottom:auto;min-width:190px;width:max-content;max-width:260px;background:rgba(255,255,255,.98);border:1px solid rgba(18,51,37,.12);box-shadow:0 18px 45px rgba(18,51,37,.18);border-radius:18px;padding:8px;z-index:999999}
    .admin-menu.show{display:grid;gap:6px}
    .admin-menu .btn{width:100%;min-height:40px;font-size:14px;padding:8px 12px;text-align:right}
    .printed-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;background:#EFF9F0;color:#1B4D32;font-weight:900;padding:6px 10px;font-size:12px}
    .danger-btn{color:#B91C1C!important}
    @media(max-width:700px){.issue-row{grid-template-columns:1fr}.issue-row input{text-align:right}}
  `;
  document.head.appendChild(style);
}

function showToast(message, type="success"){
  ensureUxStyle();
  let host=document.getElementById("toastHost");
  if(!host){host=document.createElement("div");host.id="toastHost";document.body.appendChild(host);}
  const item=document.createElement("div");
  item.className=`toast-item toast-${type}`;
  item.innerHTML=`<div class="toast-icon">${type==="error"?"!":type==="warn"?"⚠":"✓"}</div><div class="toast-text">${message}</div>`;
  host.appendChild(item);
  setTimeout(()=>item.classList.add("show"),20);
  setTimeout(()=>{item.classList.remove("show");setTimeout(()=>item.remove(),280);},2600);
}

function notifyWarehouseNewOrder(order){
  showToast(`📦 طلب جديد للمستودع${order?.section ? " - "+order.section : ""}${order?.chefName ? " / "+order.chefName : ""}`,"warn");
  try{if(navigator.vibrate) navigator.vibrate([140,60,140]);}catch(e){}
  try{
    uxAudioContext = uxAudioContext || new (window.AudioContext||window.webkitAudioContext)();
    const ctx=uxAudioContext, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type="sine"; osc.frequency.value=880;
    gain.gain.setValueAtTime(0.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16,ctx.currentTime+0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.28);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.3);
  }catch(e){}
}

function checkWarehouseNewOrdersNotify(){
  const count = warehouseOrders.filter(o=>o.status==="جديد").length;
  if(lastWarehouseNewCount === null){lastWarehouseNewCount = count; return;}
  if(count > lastWarehouseNewCount){
    const newest = [...warehouseOrders].filter(o=>o.status==="جديد").sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))[0];
    notifyWarehouseNewOrder(newest);
  }
  lastWarehouseNewCount = count;
}

function getCleaningBnText(text){return cleaningBn[text] || "";}

function getProductionPlaceholder(){
  const section = currentChef?.section || "";
  if(section.includes("حلا") || section.includes("حلويات")) return "مثال: تشيز كيك";
  if(section.includes("مخبوز")) return "مثال: كرواسون زبدة";
  if(section.includes("لحم") || section.includes("مشوي")) return "مثال: ستيك لحم";
  if(section.includes("منيو")) return "مثال: وجبة دجاج";
  if(section.includes("بوفيه")) return "مثال: أرز أبيض";
  return "مثال: صنف الإنتاج";
}



function notifySystem(message,type="warn"){
  showToast(message,type);
  try{if(navigator.vibrate) navigator.vibrate([100,50,100]);}catch(e){}
  try{
    uxAudioContext = uxAudioContext || new (window.AudioContext||window.webkitAudioContext)();
    const ctx=uxAudioContext, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type="sine"; osc.frequency.value=740;
    gain.gain.setValueAtTime(0.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12,ctx.currentTime+0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.22);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.24);
  }catch(e){}
}

function checkSystemNotifications(){
  const counts={
    warehouse: warehouseOrders.filter(o=>o.status==="جديد").length,
    production: productionLogs.length,
    waste: wasteLogs.length,
    internal: internalIssues.length,
    cleaning: cleaningLogs.length,
    operations: operationLogs.length
  };
  if(lastSystemCounts===null){lastSystemCounts={...counts};return;}
  if(counts.warehouse>lastSystemCounts.warehouse){
    const newest=[...warehouseOrders].filter(o=>o.status==="جديد").sort((a,b)=>getTimeValue(b)-getTimeValue(a))[0];
    notifyWarehouseNewOrder(newest);
  }
  if(counts.production>lastSystemCounts.production) notifySystem("🍽️ إنتاج جديد مرفوع للإدارة","warn");
  if(counts.waste>lastSystemCounts.waste) notifySystem("⚠️ تالف / هدر جديد","warn");
  if(counts.internal>lastSystemCounts.internal) notifySystem("📤 صرف داخلي جديد","warn");
  if(counts.cleaning>lastSystemCounts.cleaning) notifySystem("🧹 تقرير نظافة جديد","warn");
  if(counts.operations>lastSystemCounts.operations) notifySystem("⚙️ تقرير تشغيل جديد","warn");
  lastSystemCounts={...counts};
}

function getTimeValue(x){
  return Number(x?.timeMs || x?.issuedAtMs || x?.archivedAtMs || x?.deletedAtMs || x?.createdAtMs || (x?.createdAt?.seconds ? x.createdAt.seconds*1000 : 0) || 0);
}

function sortNewest(list){
  return [...(list||[])].sort((a,b)=>getTimeValue(b)-getTimeValue(a));
}


function closeAdminMenus(){
  document.querySelectorAll('.admin-menu').forEach(m=>m.classList.remove('show'));
}

document.addEventListener("click",function(e){
  if(!e.target.closest(".admin-menu-wrap")){
    closeAdminMenus();
  }
});

function toggleAdminMenu(id){
  document.querySelectorAll('.admin-menu').forEach(m=>{if(m.id!==id)m.classList.remove('show')});
  const el=document.getElementById(id);
  if(el) el.classList.toggle('show');
}

function adminActionMenu(collectionName,id,printFn,printed=false,afterFn="renderAdmin"){
  const menuId=`menu_${collectionName}_${id}`.replace(/[^a-zA-Z0-9_]/g,"_");
  return `
    <div class="admin-actions">
      ${printed ? `<span class="printed-chip">✓ مطبوع</span>` : ``}
      <div class="admin-menu-wrap" onclick="event.stopPropagation()">
        <button class="btn btn-light admin-menu-btn" onclick="toggleAdminMenu('${menuId}')">⋮</button>
        <div class="admin-menu" id="${menuId}">
          <button class="btn btn-light" onclick="${printFn}">🖨 طباعة</button>
          <button class="btn btn-light danger-btn" onclick="deletePrintedItem('${collectionName}','${id}','${afterFn}')">🗑 حذف بعد الطباعة</button>
        </div>
      </div>
    </div>
  `;
}

async function markPrinted(collectionName,id){
  const {db,doc,updateDoc}=window.firebaseDB;
  await updateDoc(doc(db,collectionName,id),{printed:true,printedAtText:nowText(),printedAtMs:Date.now()});
}

async function deletePrintedItem(collectionName,id,afterFn="renderAdmin"){
  const sourceMap={
    production_logs:productionLogs,
    waste_logs:wasteLogs,
    warehouse_orders:warehouseOrders,
    internal_issues:internalIssues,
    cleaning_logs:cleaningLogs,
    operation_logs:operationLogs
  };
  const item=(sourceMap[collectionName]||[]).find(x=>x.id===id);
  if(!item?.printed){
    showToast("اطبع العملية أولاً قبل الحذف","error");
    return;
  }
  if(!confirm("سيتم حذف العملية المطبوعة فقط. هل أنت متأكد؟")) return;
  const {db,doc,deleteDoc}=window.firebaseDB;
  await deleteDoc(doc(db,collectionName,id));
  showToast("تم حذف العملية المطبوعة");
  try{ new Function(afterFn+"()")(); }catch(e){ renderAdmin(); }
}

async function deleteAllPrinted(collectionName,afterFn="renderAdmin"){
  const sourceMap={
    production_logs:productionLogs,
    waste_logs:wasteLogs,
    warehouse_orders:warehouseOrders,
    internal_issues:internalIssues,
    cleaning_logs:cleaningLogs,
    operation_logs:operationLogs
  };
  const list=(sourceMap[collectionName]||[]).filter(x=>x.printed);
  if(!list.length){showToast("لا توجد عمليات مطبوعة للحذف","warn");return;}
  if(!confirm(`سيتم حذف ${list.length} عملية مطبوعة فقط. هل أنت متأكد؟`)) return;
  const {db,doc,deleteDoc}=window.firebaseDB;
  for(const item of list){ await deleteDoc(doc(db,collectionName,item.id)); }
  showToast("تم حذف جميع العمليات المطبوعة");
  try{ new Function(afterFn+"()")(); }catch(e){ renderAdmin(); }
}

function buildCleaningLogReport(log){
  return `
    <div class="card">
      <h3>${escapeHtml(shiftLabels[log.shift]?.ar || "النظافة")}</h3>
      <div class="meta">${escapeHtml(log.createdAtText||"")}</div>
      <table>
        <thead><tr><th>المهمة</th><th>الحالة</th></tr></thead>
        <tbody>${(log.entries||[]).map(e=>`<tr><td>${escapeHtml(e.nameAr||"")}</td><td>${e.done?"تم":"لم يتم"}</td></tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function printProductionLog(id){
  const log=productionLogs.find(x=>x.id===id); if(!log)return;
  markPrinted('production_logs',id);
  openPrintReport("تقرير إنتاج", buildProductionReport([log]));
}
function printWasteLog(id){
  const log=wasteLogs.find(x=>x.id===id); if(!log)return;
  markPrinted('waste_logs',id);
  openPrintReport("تقرير تالف وهدر", buildWasteReport([log]));
}
function printOperationLog(id){
  const log=operationLogs.find(x=>x.id===id); if(!log)return;
  markPrinted('operation_logs',id);
  openPrintReport("تقرير تشغيل", buildOperationsReport([log]));
}
function printCleaningLog(id){
  const log=cleaningLogs.find(x=>x.id===id); if(!log)return;
  markPrinted('cleaning_logs',id);
  openPrintReport("تقرير نظافة", buildCleaningLogReport(log));
}


function reportLogo(){
  return `<img src="assets/logo.png" class="report-logo" onerror="this.style.display='none'">`;
}

function reportHeader(title){
  return `
    <div class="report-header">
      ${reportLogo()}
      <h1>${escapeHtml(title)}</h1>
      <div class="report-meta">
        <span>التاريخ: ${escapeHtml(todayDate())}</span>
        <span>وقت الإنشاء: ${escapeHtml(nowText())}</span>
      </div>
    </div>
  `;
}

function getReportCss(){
  return `
    <style>
      @page{size:A4;margin:14mm}
      *{box-sizing:border-box}
      body{direction:rtl;font-family:'Cairo',Arial,sans-serif;color:#1B2A1F;background:#fff;margin:0;padding:0}
      .report-page{position:relative;background:#fff}
      .report-header{text-align:center;border-bottom:3px solid #1B4D32;padding-bottom:14px;margin-bottom:18px}
      .report-logo{width:86px;height:86px;object-fit:contain;display:block;margin:0 auto 8px}
      h1{font-size:24px;margin:4px 0 8px;color:#1B4D32;font-weight:900}
      h2{font-size:18px;color:#1B4D32;margin:18px 0 8px;padding:8px 10px;border-right:5px solid #F4C542;background:#F7FAF3;font-weight:900}
      h3{font-size:15px;color:#1B4D32;margin:12px 0 8px;font-weight:900}
      .report-meta{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;font-size:12px;color:#6F7C68;font-weight:800}
      .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 18px}
      .summary-card{border:1px solid #DDE8D7;border-radius:14px;padding:12px;background:#FAFCF7;text-align:center}
      .summary-card b{display:block;color:#1B4D32;font-size:18px;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin:8px 0 14px;page-break-inside:auto}
      th{background:#1B4D32;color:#fff;font-weight:900;padding:9px 8px;border:1px solid #1B4D32;font-size:12px}
      td{padding:8px;border:1px solid #DDE8D7;font-size:12px;vertical-align:top}
      tr:nth-child(even) td{background:#FAFCF7}
      .subtle{color:#6F7C68;font-size:12px;font-weight:800}
      .footer{border-top:1px solid #DDE8D7;margin-top:20px;padding-top:8px;color:#6F7C68;font-size:11px;text-align:center}
      @media print{.no-print{display:none!important}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
    </style>
  `;
}

function formatItemsText(items){
  return (items||[]).map(i=>{
    const req = i.qty !== undefined ? `${i.qty} ${i.unit||""}` : "";
    const issued = i.issuedQty !== undefined ? ` / مصروف: ${i.issuedQty} ${i.unit||""}` : "";
    return `${escapeHtml(i.name||i.productName||"")} (${escapeHtml(req)}${escapeHtml(issued)})`;
  }).join("<br>");
}

function buildWarehouseReport(){
  const orders = sortNewest(warehouseOrders.filter(o=>o.status!=="محذوف"));
  const issues = sortNewest(internalIssues);
  return `
    <h2>المستودع</h2>
    <div class="summary-grid">
      <div class="summary-card">طلبات الشيفات<b>${orders.length}</b></div>
      <div class="summary-card">الصرف الداخلي<b>${issues.length}</b></div>
      <div class="summary-card">إجمالي العمليات<b>${orders.length + issues.length}</b></div>
    </div>

    <h3>طلبات الشيفات</h3>
    ${orders.length ? `
      <table>
        <thead><tr><th>رقم الطلب</th><th>الشيف</th><th>القسم</th><th>الحالة</th><th>الصرف</th><th>الأصناف</th><th>الوقت</th></tr></thead>
        <tbody>${orders.map(o=>`
          <tr>
            <td>${escapeHtml(o.orderId||o.id||"")}</td>
            <td>${escapeHtml(o.chefName||"")}</td>
            <td>${escapeHtml(o.section||"")}</td>
            <td>${escapeHtml(o.status||"")}</td>
            <td>${escapeHtml(o.issueStatus || getOrderIssueSummary(o))}</td>
            <td>${formatItemsText(o.items)}</td>
            <td>${escapeHtml(o.createdAtText||o.issuedAtText||o.archivedAtText||"")}</td>
          </tr>`).join("")}</tbody>
      </table>` : `<div class="subtle">لا توجد طلبات شيفات</div>`}

    <h3>الصرف الداخلي</h3>
    ${issues.length ? `
      <table>
        <thead><tr><th>الموظف</th><th>الجهة</th><th>الأصناف</th><th>الملاحظة</th><th>الوقت</th></tr></thead>
        <tbody>${issues.map(i=>`
          <tr>
            <td>${escapeHtml(i.staff||"")}</td>
            <td>${escapeHtml(i.destination||"")}</td>
            <td>${formatItemsText(i.items)}</td>
            <td>${escapeHtml(i.note||"")}</td>
            <td>${escapeHtml(i.createdAtText||"")}</td>
          </tr>`).join("")}</tbody>
      </table>` : `<div class="subtle">لا يوجد صرف داخلي</div>`}
  `;
}

function buildProductionReport(list){
  list = sortNewest(list||[]);
  return `<h2>الإنتاج</h2>${list.length ? `
    <table>
      <thead><tr><th>الشيف</th><th>القسم</th><th>الأصناف</th><th>ملاحظة</th><th>الوقت</th></tr></thead>
      <tbody>${list.map(log=>`<tr><td>${escapeHtml(log.chefName||"")}</td><td>${escapeHtml(log.section||"")}</td><td>${formatItemsText(log.items)}</td><td>${escapeHtml(log.note||"")}</td><td>${escapeHtml(log.createdAtText||"")}</td></tr>`).join("")}</tbody>
    </table>` : `<div class="subtle">لا يوجد إنتاج</div>`}`;
}

function buildWasteReport(list){
  list = sortNewest(list||[]);
  return `<h2>التالف والهدر</h2>${list.length ? `
    <table>
      <thead><tr><th>الشيف</th><th>القسم</th><th>الصنف</th><th>الكمية</th><th>السبب</th><th>الوقت</th></tr></thead>
      <tbody>${list.map(log=>`<tr><td>${escapeHtml(log.chefName||"")}</td><td>${escapeHtml(log.section||"")}</td><td>${escapeHtml(log.productName||"")}</td><td>${escapeHtml(log.qty||"")}</td><td>${escapeHtml(log.reason||"")}</td><td>${escapeHtml(log.createdAtText||"")}</td></tr>`).join("")}</tbody>
    </table>` : `<div class="subtle">لا يوجد تالف أو هدر</div>`}`;
}

function buildCleaningReport(list){
  list = sortNewest(list||[]);
  return `<h2>النظافة</h2>${list.length ? `
    <table>
      <thead><tr><th>الوردية</th><th>المهام</th><th>الوقت</th></tr></thead>
      <tbody>${list.map(log=>`<tr><td>${escapeHtml(shiftLabels[log.shift]?.ar || log.shift || "")}</td><td>${(log.entries||[]).map(e=>`${escapeHtml(e.nameAr||"")} : ${e.done?"تم":"لم يتم"}`).join("<br>")}</td><td>${escapeHtml(log.createdAtText||"")}</td></tr>`).join("")}</tbody>
    </table>` : `<div class="subtle">لا توجد تقارير نظافة</div>`}`;
}

function buildOperationsReport(list){
  list = sortNewest(list||[]);
  return `<h2>التشغيل</h2>${list.length ? `
    <table>
      <thead><tr><th>المسؤول</th><th>المهمة</th><th>الفترة</th><th>الملاحظة</th><th>الوقت</th></tr></thead>
      <tbody>${list.map(log=>`<tr><td>${escapeHtml(log.operatorName||"")}</td><td>${escapeHtml(log.taskName||"")}</td><td>${escapeHtml(log.period||"")}</td><td>${escapeHtml(log.note||"")}</td><td>${escapeHtml(log.createdAtText||"")}</td></tr>`).join("")}</tbody>
    </table>` : `<div class="subtle">لا توجد تقارير تشغيل</div>`}`;
}

function printWarehouseReport(){
  warehouseOrders.filter(o=>o.id && o.status!=="محذوف").forEach(o=>markPrinted("warehouse_orders",o.id));
  internalIssues.filter(i=>i.id).forEach(i=>markPrinted("internal_issues",i.id));
  openPrintReport("تقرير المستودع", buildWarehouseReport());
}

function isStandaloneApp(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function shouldShowInstallTip(){
  if(isStandaloneApp()) return false;
  const hiddenUntil = Number(localStorage.getItem("installTipHiddenUntil") || 0);
  return Date.now() > hiddenUntil;
}

function hideInstallTip(days=7){
  localStorage.setItem("installTipHiddenUntil", String(Date.now() + days*24*60*60*1000));
  renderHome();
}

function showInstallSteps(){
  const box=document.getElementById("installStepsBox");
  if(!box) return;
  const ua=navigator.userAgent||"";
  const isIOS=/iPhone|iPad|iPod/i.test(ua);
  box.innerHTML = isIOS
    ? "في الآيفون: اضغط مشاركة ثم اختر إضافة إلى الشاشة الرئيسية."
    : "في أندرويد: اضغط ⋮ من المتصفح ثم اختر إضافة إلى الشاشة الرئيسية.";
  box.style.display="block";
}


const shiftLabels = {
  morning:{ ar:"صباح", bn:"সকাল" },
  afternoon:{ ar:"ظهر", bn:"দুপুর" },
  night:{ ar:"ليل", bn:"রাত" }
};

const cleaningBn = {
  "دورات المياه":"টয়লেট পরিষ্কার",
  "تنظيف الأرضية":"মেঝে পরিষ্কার",
  "تنظيف الأرضيات":"মেঝে পরিষ্কার",
  "تنظيف الطاولات":"টেবিল পরিষ্কার",
  "تنظيف الثلاجات":"ফ্রিজ পরিষ্কার",
  "تنظيف المغاسل":"বেসিন পরিষ্কার",
  "منطقة التحضير":"প্রস্তুতি এলাকা পরিষ্কার",
  "سلات النفايات":"ডাস্টবিন পরিষ্কার"
};

function smartBack(){
  try{ new Function(currentBackFn || "renderHome()")(); }
  catch(e){ renderHome(); }
}

window.addEventListener("popstate", function(){
  isPhoneBack = true;
  smartBack();
  setTimeout(()=>{ isPhoneBack = false; }, 50);
});

function todayDate(){
  return new Date().toLocaleDateString("ar-SA",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
}

function nowText(){
  return new Date().toLocaleString("ar-SA");
}

function timeOnly(){
  return new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});
}

function waitForFirebase(){
  return new Promise(resolve=>{
    const timer=setInterval(()=>{
      if(window.firebaseDB){
        clearInterval(timer);
        resolve(window.firebaseDB);
      }
    },100);
  });
}

function pageLayout(title, content, backFn="renderHome()"){
  currentBackFn = backFn;
  if(!isPhoneBack) history.pushState({page:title},"");
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>${title}</h2>
        <button class="btn btn-light" onclick="smartBack()">رجوع</button>
      </div>
      ${content}
    </main>
  `;
}

function renderHome(){
  ensureUxStyle();
  currentBackFn = "renderHome()";
  const newOrders = warehouseOrders.filter(o=>o.status==="جديد").length;

  app.innerHTML = `
    <main class="app home-app">
      <div class="topbar home-topbar">
        <button class="btn btn-light" onclick="renderSettingsGate()"><i class="fa-solid fa-gear"></i> الإعدادات</button>
        <button class="btn btn-main" onclick="renderAdminGate()"><i class="fa-solid fa-chart-line"></i> الإدارة</button>
      </div>
      <section class="hero home-hero">
        <div class="logo-wrap"><img src="assets/logo.png" class="logo" alt="Protein & Carb" onerror="this.onerror=null;this.src='logo.png';setTimeout(()=>{if(!this.complete||this.naturalWidth===0){this.style.display='none';}},300);"></div>
        <p class="welcome-text">مرحباً بك في نظام</p>
        <h1 class="hero-title">Protein & Carb Operations</h1>
        <p class="hero-date">${todayDate()}</p>

        ${shouldShowInstallTip() ? `
          <div class="install-mini-card">
            <b>📲 ثبّت الموقع على الشاشة الرئيسية</b>
            <span>افتحه مثل التطبيق بسرعة</span>
            <div id="installStepsBox" class="install-steps" style="display:none"></div>
            <div class="install-mini-actions">
              <button class="btn btn-main" onclick="showInstallSteps()">طريقة التثبيت</button>
              <button class="btn btn-light" onclick="hideInstallTip()">لاحقاً</button>
            </div>
          </div>
        ` : ""}
      </section>
      <section class="home-launcher">
        <div class="home-circle-card" onclick="renderChefs()"><div class="home-circle"><i class="fa-solid fa-utensils"></i></div><h3>الشيفات</h3><p>الإنتاج والطلبات</p></div>
        <div class="home-circle-card warehouse-home-card" onclick="renderWarehouseGate()">${newOrders ? `<span class="order-badge">${newOrders}</span>` : ""}<div class="home-circle"><i class="fa-solid fa-boxes-stacked"></i></div><h3>المستودع</h3><p>طلبات وصرف داخلي</p></div>
        <div class="home-circle-card" onclick="renderOperations()"><div class="home-circle"><i class="fa-solid fa-industry"></i></div><h3>التشغيل</h3><p>مهام التشغيل اليومية</p></div>
        <div class="home-circle-card" onclick="renderCleaning()"><div class="home-circle"><i class="fa-solid fa-broom"></i></div><h3>النظافة</h3><p>متابعة الورديات</p></div>
      </section>
    </main>`;
}

function renderEmpty(title){
  pageLayout(title, `<div class="panel placeholder">${title}</div>`);
}

/* Firebase */

async function initCloud(){
  const { db, doc, getDoc, setDoc, collection, onSnapshot } = await waitForFirebase();

  const settingsRef = doc(db,"settings","system");
  const snap = await getDoc(settingsRef);
  if(!snap.exists()) await setDoc(settingsRef,systemSettings);

  onSnapshot(settingsRef,s=>{
    if(s.exists()) systemSettings = {...systemSettings,...s.data()};
  });

  const listen = (name, setter) => {
    onSnapshot(collection(db,name), snap=>{
      const arr=[];
      snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      setter(arr);
      refreshViews();
    });
  };

  listen("chef_sections", v=>chefSections=v);
  listen("chefs", v=>chefs=v);
  listen("warehouse_items", v=>warehouseItems=v);
  listen("menu_items", v=>menuItems=v);
  listen("warehouse_orders", v=>warehouseOrders=v);
  listen("dismissed_alerts", v=>dismissedAlerts=v);
  listen("cleaning_tasks", v=>cleaningTasks=v);
  listen("cleaning_logs", v=>cleaningLogs=v);
  listen("operation_tasks", v=>operationTasks=v);
  listen("operation_logs", v=>operationLogs=v);
  listen("production_logs", v=>productionLogs=v);
  listen("waste_logs", v=>wasteLogs=v);
  listen("warehouse_staff", v=>warehouseStaff=v);
  listen("internal_destinations", v=>internalDestinations=v);
  listen("internal_issues", v=>internalIssues=v);
}

function refreshViews(){
  checkSystemNotifications();
  if(document.getElementById("sectionsContainer")) drawSections();
  if(document.getElementById("chefSection")) drawChefSectionOptions();
  if(document.getElementById("chefsContainer")) drawChefs();
  if(document.getElementById("warehouseItemsContainer")) drawWarehouseItems();
  if(document.getElementById("menuItemsContainer")) drawMenuItems();
  if(document.getElementById("chefSectionsView")) drawChefSectionsView();
  if(document.getElementById("warehouseOrdersBox")) drawWarehouseOrders();
  if(document.getElementById("adminAlertsBox")) drawAdminAlerts();
  if(document.getElementById("cleaningTasksContainer")) drawCleaningTasks();
  if(document.getElementById("cleaningAdminBox")) drawCleaningAdmin();
  if(document.getElementById("operationTasksContainer")) drawOperationTasks();
  if(document.getElementById("operationAdminBox")) drawOperationAdmin();
  if(document.getElementById("operationRunBox")) drawOperationRunBox();
  if(document.getElementById("productionAdminBox")) drawProductionAdmin();
  if(document.getElementById("wasteAdminBox")) drawWasteAdmin();
  if(document.getElementById("internalIssueAdminBox")) drawInternalIssueAdmin();
  if(document.getElementById("warehouseStaffBox")) drawWarehouseStaff();
  if(document.getElementById("internalDestinationsBox")) drawInternalDestinations();
}

/* Settings */

function renderSettingsGate(){
  pageLayout("دخول الإعدادات", `
    <div class="panel">
      <input id="settingsPasswordInput" type="password" placeholder="كلمة مرور الإدارة">
      <button class="btn btn-main" onclick="checkSettingsPassword()">دخول</button>
    </div>
  `);
}

function checkSettingsPassword(){
  const pass=document.getElementById("settingsPasswordInput").value.trim();
  if(pass !== String(systemSettings.adminPassword)){
    showToast("كلمة المرور غير صحيحة","error");
    return;
  }
  renderSettings();
}

function renderSettings(){openSettingsTab(getActiveSettingsTabFromHash());}

/* Settings Sections */

function renderSettingsSections(){settingsShell("sections","إدارة الأقسام",`<div class="premium-toolbar"><input id="sectionSearch" placeholder="بحث عن قسم" oninput="drawSections()"><button class="btn btn-main" onclick="document.getElementById('sectionForm').classList.toggle('hide')">إضافة قسم</button></div><div id="sectionForm" class="premium-form hide"><label>اسم القسم</label><input id="sectionName" placeholder="مثال: الحلا"><label>الأيقونة</label><input id="sectionIcon" placeholder="مثال: 🍰"><button class="btn btn-main" onclick="addSection()">حفظ القسم</button></div><div id="sectionsContainer" class="premium-table-wrap"></div>`);drawSections();}

async function addSection(){
  const name=document.getElementById("sectionName").value.trim();
  const icon=document.getElementById("sectionIcon").value.trim();
  if(!name) return;

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"chef_sections"),{name,icon:icon||"🍽️",createdAt:serverTimestamp()});
  document.getElementById("sectionName").value="";
  document.getElementById("sectionIcon").value="";
}

function drawSections(){const box=document.getElementById("sectionsContainer"); if(!box)return; const q=(document.getElementById("sectionSearch")?.value||"").trim().toLowerCase(); const list=chefSections.filter(s=>(s.name||"").toLowerCase().includes(q)); box.innerHTML=list.length?`<table class="premium-table"><thead><tr><th>الأيقونة</th><th>اسم القسم</th><th>إجراء</th></tr></thead><tbody>${list.map(s=>`<tr><td>${s.icon||"🍽️"}</td><td><b>${escapeHtml(s.name||"")}</b></td><td><button class="mini-danger" onclick="deleteDocByPath('chef_sections','${s.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`:`<div class="placeholder">لا توجد أقسام</div>`;}

/* Settings Chefs */

function renderSettingsChefs(){settingsShell("chefs","إدارة الشيفات",`<div class="premium-toolbar"><input id="chefSettingsSearch" placeholder="بحث باسم الشيف أو الكود" oninput="drawChefs()"><button class="btn btn-main" onclick="document.getElementById('chefForm').classList.toggle('hide')">إضافة شيف</button></div><div id="chefForm" class="premium-form hide"><label>اسم الشيف</label><input id="chefName" placeholder="مثال: أحمد"><label>كود الشيف</label><input id="chefCode" type="number" placeholder="مثال: 1001"><label>القسم</label><select id="chefSection"></select><button class="btn btn-main" onclick="addChef()">حفظ الشيف</button></div><div id="chefsContainer" class="premium-table-wrap"></div>`);drawChefSectionOptions();drawChefs();}

function drawChefSectionOptions(){
  const select=document.getElementById("chefSection");
  if(!select) return;
  select.innerHTML = chefSections.length ? chefSections.map(s=>`<option value="${s.name}">${s.name}</option>`).join("") : `<option value="">لا توجد أقسام</option>`;
}

async function addChef(){
  const name=document.getElementById("chefName").value.trim();
  const code=document.getElementById("chefCode").value.trim();
  const section=document.getElementById("chefSection").value;
  if(!name||!code||!section) return;

  if(chefs.some(c=>c.code===code)){
    showToast("الكود مستخدم","error");
    return;
  }

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"chefs"),{name,code,section,createdAt:serverTimestamp()});
  document.getElementById("chefName").value="";
  document.getElementById("chefCode").value="";
}

function drawChefs(){const box=document.getElementById("chefsContainer"); if(!box)return; const q=(document.getElementById("chefSettingsSearch")?.value||"").trim().toLowerCase(); const list=chefs.filter(c=>String(c.name||"").toLowerCase().includes(q)||String(c.code||"").toLowerCase().includes(q)||String(c.section||"").toLowerCase().includes(q)); box.innerHTML=list.length?`<table class="premium-table"><thead><tr><th>الشيف</th><th>الكود</th><th>القسم</th><th>إجراء</th></tr></thead><tbody>${list.map(c=>`<tr><td><b>${escapeHtml(c.name||"")}</b></td><td>${escapeHtml(c.code||"")}</td><td>${escapeHtml(c.section||"")}</td><td><button class="mini-danger" onclick="deleteDocByPath('chefs','${c.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`:`<div class="placeholder">لا يوجد شيفات</div>`;}

/* Warehouse Items */

function renderSettingsWarehouseItems(){settingsShell("warehouse","أصناف المستودع",`<div class="premium-toolbar"><input id="warehouseSearch" placeholder="بحث بالكود أو العربي أو English" oninput="drawWarehouseItems()"><button class="btn btn-main" onclick="document.getElementById('warehouseItemForm').classList.toggle('hide')">إضافة صنف</button><button class="btn btn-light" onclick="openSettingsTab('excel')">استيراد Excel</button><button class="btn btn-light" onclick="exportWarehouseCSV()">تصدير Excel</button></div><div id="warehouseItemForm" class="premium-form hide"><label>الكود اختياري</label><input id="warehouseItemCode" placeholder="مثال: 4016"><label>اسم الصنف عربي / English</label><input id="warehouseItemName" placeholder="مثال: بصل برياني / Onion Biryani"><label>الوحدة</label><select id="warehouseItemUnit"><option>كجم</option><option>جرام</option><option>لتر</option><option>مل</option><option>حبة</option><option>كرتون</option><option>صندوق</option><option>ربطة</option></select><button class="btn btn-main" onclick="addWarehouseItem()">حفظ الصنف</button></div><div id="warehouseItemsContainer" class="premium-table-wrap"></div>`);drawWarehouseItems();}

async function addWarehouseItem(){const rawName=document.getElementById("warehouseItemName").value.trim(); const code=document.getElementById("warehouseItemCode").value.trim(); const unit=document.getElementById("warehouseItemUnit").value; const names=splitArEn(rawName); const nameAr=names.ar,nameEn=names.en; if(!nameAr&&!nameEn)return; if(code&&warehouseItems.some(i=>String(i.code||"")===code)){showToast("كود الصنف مستخدم","error");return;} const {db,addDoc,collection,serverTimestamp}=window.firebaseDB; await addDoc(collection(db,"warehouse_items"),{name:nameAr||nameEn,nameAr:nameAr||nameEn,nameEn,code,unit,createdAt:serverTimestamp()}); document.getElementById("warehouseItemName").value=""; document.getElementById("warehouseItemCode").value=""; showToast("تم إضافة الصنف");}

function drawWarehouseItems(){const box=document.getElementById("warehouseItemsContainer"); if(!box)return; const search=(document.getElementById("warehouseSearch")?.value||"").trim().toLowerCase(); const list=sortNewest(warehouseItems).filter(i=>String(itemDisplayName(i)).toLowerCase().includes(search)||String(itemDisplayEn(i)).toLowerCase().includes(search)||String(itemCode(i)).toLowerCase().includes(search)||String(i.unit||"").toLowerCase().includes(search)); if(!list.length){box.innerHTML=`<div class="placeholder">لا توجد أصناف</div>`;return;} box.innerHTML=`<table class="premium-table"><thead><tr><th>الكود</th><th>العربي</th><th>English</th><th>الوحدة</th><th>إجراء</th></tr></thead><tbody>${list.map(i=>`<tr><td>${escapeHtml(itemCode(i)||"-")}</td><td><b>${escapeHtml(itemDisplayName(i))}</b></td><td>${escapeHtml(itemDisplayEn(i)||"-")}</td><td>${escapeHtml(i.unit||"")}</td><td><button class="mini-danger" onclick="deleteDocByPath('warehouse_items','${i.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`;}

/* Cleaning Settings */

function renderSettingsCleaning(){settingsShell("cleaning","عناصر النظافة",`<div class="premium-toolbar"><input id="cleaningTaskSearch" placeholder="بحث عن مهمة" oninput="drawCleaningTasks()"><button class="btn btn-main" onclick="document.getElementById('cleaningTaskForm').classList.toggle('hide')">إضافة مهمة</button></div><div id="cleaningTaskForm" class="premium-form hide"><label>اسم المهمة بالعربي</label><input id="cleaningTaskName" placeholder="مثال: دورات المياه"><label>ترجمة المهمة بالبنغالي</label><input id="cleaningTaskBn" placeholder="مثال: টয়লেট পরিষ্কার"><label>الورديات</label><label><input id="cleanMorning" type="checkbox" checked> صباح</label><label><input id="cleanAfternoon" type="checkbox" checked> ظهر</label><label><input id="cleanNight" type="checkbox" checked> ليل</label><button class="btn btn-main" onclick="addCleaningTask()">حفظ المهمة</button></div><div id="cleaningTasksContainer" class="premium-table-wrap"></div>`);drawCleaningTasks();}

async function addCleaningTask(){
  const nameAr=document.getElementById("cleaningTaskName").value.trim();
  const nameBn=document.getElementById("cleaningTaskBn")?.value.trim() || "";
  if(!nameAr) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"cleaning_tasks"),{
    nameAr,
    nameBn,
    morning:document.getElementById("cleanMorning").checked,
    afternoon:document.getElementById("cleanAfternoon").checked,
    night:document.getElementById("cleanNight").checked,
    createdAt:serverTimestamp()
  });
  document.getElementById("cleaningTaskName").value="";
  if(document.getElementById("cleaningTaskBn")) document.getElementById("cleaningTaskBn").value="";
}

function drawCleaningTasks(){const box=document.getElementById("cleaningTasksContainer"); if(!box)return; const q=(document.getElementById("cleaningTaskSearch")?.value||"").trim().toLowerCase(); const list=cleaningTasks.filter(t=>String(t.nameAr||"").toLowerCase().includes(q)||String(t.nameBn||"").toLowerCase().includes(q)); if(!list.length){box.innerHTML=`<div class="placeholder">لا توجد مهام نظافة</div>`;return;} box.innerHTML=`<table class="premium-table"><thead><tr><th>المهمة</th><th>البنغالي</th><th>الورديات</th><th>إجراء</th></tr></thead><tbody>${list.map(t=>`<tr><td><b>${escapeHtml(t.nameAr||"")}</b></td><td>${escapeHtml(t.nameBn||getCleaningBnText(t.nameAr)||"-")}</td><td>${t.morning?"صباح ":""} ${t.afternoon?"ظهر ":""} ${t.night?"ليل":""}</td><td><button class="mini-danger" onclick="deleteDocByPath('cleaning_tasks','${t.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`;}

/* Operations Settings */

function renderSettingsOperations(){settingsShell("operations","مهام التشغيل",`<div class="premium-toolbar"><input id="operationTaskSearch" placeholder="بحث عن مهمة" oninput="drawOperationTasks()"><button class="btn btn-main" onclick="document.getElementById('operationTaskForm').classList.toggle('hide')">إضافة مهمة</button></div><div id="operationTaskForm" class="premium-form hide"><label>اسم المهمة</label><input id="operationTaskName" placeholder="مثال: تشغيل الشوايات"><label>الفترة / الوقت</label><input id="operationTaskPeriod" placeholder="مثال: قبل الافتتاح أو 12 ظهر أو قبل الإغلاق"><button class="btn btn-main" onclick="addOperationTask()">حفظ المهمة</button></div><div id="operationTasksContainer" class="premium-table-wrap"></div>`);drawOperationTasks();}

async function addOperationTask(){
  const name=document.getElementById("operationTaskName").value.trim();
  const period=document.getElementById("operationTaskPeriod").value.trim();
  if(!name||!period) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"operation_tasks"),{name,period,createdAt:serverTimestamp()});
  document.getElementById("operationTaskName").value="";
  document.getElementById("operationTaskPeriod").value="";
}

function drawOperationTasks(){const box=document.getElementById("operationTasksContainer"); if(!box)return; const q=(document.getElementById("operationTaskSearch")?.value||"").trim().toLowerCase(); const list=operationTasks.filter(t=>String(t.name||"").toLowerCase().includes(q)||String(t.period||"").toLowerCase().includes(q)); if(!list.length){box.innerHTML=`<div class="placeholder">لا توجد مهام تشغيل</div>`;return;} box.innerHTML=`<table class="premium-table"><thead><tr><th>المهمة</th><th>الفترة</th><th>إجراء</th></tr></thead><tbody>${list.map(t=>`<tr><td><b>${escapeHtml(t.name||"")}</b></td><td>${escapeHtml(t.period||"")}</td><td><button class="mini-danger" onclick="deleteDocByPath('operation_tasks','${t.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`;}

/* Internal Issue Settings */

function renderSettingsInternalIssue(){settingsShell("internal","إعدادات الصرف الداخلي",`<div class="excel-grid"><div class="premium-card"><h3>موظفي المستودع</h3><input id="warehouseStaffName" placeholder="اسم موظف المستودع"><button class="btn btn-main" onclick="addWarehouseStaff()">إضافة موظف</button><div id="warehouseStaffBox" style="margin-top:14px"></div></div><div class="premium-card"><h3>جهات الصرف</h3><input id="internalDestinationName" placeholder="مثال: مطبخ العمال"><button class="btn btn-main" onclick="addInternalDestination()">إضافة جهة</button><div id="internalDestinationsBox" style="margin-top:14px"></div></div></div>`);drawWarehouseStaff();drawInternalDestinations();}

async function addWarehouseStaff(){
  const name=document.getElementById("warehouseStaffName").value.trim();
  if(!name) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"warehouse_staff"),{name,createdAt:serverTimestamp()});
  document.getElementById("warehouseStaffName").value="";
}

function drawWarehouseStaff(){
  const box=document.getElementById("warehouseStaffBox");
  if(!box) return;
  box.innerHTML = warehouseStaff.length ? warehouseStaff.map(s=>`
    <div class="panel" style="margin-bottom:8px">
      <b>${s.name}</b>
      <button class="btn btn-light" style="float:left" onclick="deleteDocByPath('warehouse_staff','${s.id}')">🗑</button>
    </div>
  `).join("") : `<div class="panel placeholder">لا يوجد موظفين</div>`;
}

async function addInternalDestination(){
  const name=document.getElementById("internalDestinationName").value.trim();
  if(!name) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"internal_destinations"),{name,createdAt:serverTimestamp()});
  document.getElementById("internalDestinationName").value="";
}

function drawInternalDestinations(){
  const box=document.getElementById("internalDestinationsBox");
  if(!box) return;
  box.innerHTML = internalDestinations.length ? internalDestinations.map(d=>`
    <div class="panel" style="margin-bottom:8px">
      <b>${d.name}</b>
      <button class="btn btn-light" style="float:left" onclick="deleteDocByPath('internal_destinations','${d.id}')">🗑</button>
    </div>
  `).join("") : `<div class="panel placeholder">لا توجد جهات صرف</div>`;
}

/* Passwords */

function renderSettingsPasswords(){settingsShell("passwords","الصلاحيات وكلمات المرور",`<div class="premium-form"><label>كلمة مرور الإدارة</label><input id="adminPasswordInput" type="password" placeholder="كلمة مرور الإدارة"><label>كلمة مرور المستودع</label><input id="warehousePasswordInput" type="password" placeholder="كلمة مرور المستودع"><button class="btn btn-main" onclick="savePasswords()">حفظ كلمات المرور</button></div>`);}

async function savePasswords(){
  const adminPassword=document.getElementById("adminPasswordInput").value.trim();
  const warehousePassword=document.getElementById("warehousePasswordInput").value.trim();
  const {db,doc,setDoc}=window.firebaseDB;
  await setDoc(doc(db,"settings","system"),{
    adminPassword:adminPassword||systemSettings.adminPassword,
    warehousePassword:warehousePassword||systemSettings.warehousePassword,
    orderCounter:systemSettings.orderCounter||1001
  },{merge:true});
  showToast("تم حفظ كلمات المرور");
}

/* Chefs */

function renderChefs(){
  pageLayout("الشيفات", `<div id="chefSectionsView" class="grid"></div>`,"renderHome()");
  drawChefSectionsView();
}

function drawChefSectionsView(){
  const box=document.getElementById("chefSectionsView");
  if(!box) return;
  box.innerHTML = chefSections.length ? chefSections.map(s=>`
    <div class="card" onclick="renderChefCode('${s.name}')">
      <div class="icon">${s.icon||"🍽️"}</div>
      <div class="card-title">${s.name}</div>
    </div>
  `).join("") : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

function renderChefCode(sectionName){
  pageLayout(sectionName, `
    <div class="panel">
      <input id="chefCode" type="number" placeholder="كود الشيف">
      <button class="btn btn-main" onclick="checkChefCode('${sectionName}')">دخول</button>
    </div>
    <div id="chefMessage" class="panel placeholder" style="margin-top:16px;display:none"></div>
  `,"renderChefs()");
}

function checkChefCode(sectionName){
  const code=document.getElementById("chefCode").value.trim();
  const chef=chefs.find(c=>c.code===code && c.section===sectionName);
  const msg=document.getElementById("chefMessage");
  if(!chef){
    msg.style.display="block";
    msg.textContent="الكود غير صحيح";
    return;
  }
  currentChef=chef;
  productionDraft=[];
  renderChefDashboard(chef);
}

function renderChefDashboard(chef){
  pageLayout(chef.name, `
    <div class="panel" style="margin-bottom:16px;text-align:center">
      <div class="icon" style="margin:0 auto 10px"><i class="fa-solid fa-user"></i></div>
      <h2>${chef.name}</h2>
      <div style="color:#7b8674;font-weight:700">${chef.section}</div>
    </div>

    <section class="grid">
      <div class="card" onclick="renderProduction()"><div class="icon"><i class="fa-solid fa-chart-line"></i></div><div class="card-title">الإنتاج</div></div>
      <div class="card" onclick="renderWaste()"><div class="icon"><i class="fa-solid fa-trash-can"></i></div><div class="card-title">التالف والهدر</div></div>
      <div class="card" onclick="renderWarehouseRequest()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">طلب مستودع</div></div>
      <div class="card" onclick="renderMyOrders()"><div class="icon"><i class="fa-solid fa-clipboard-list"></i></div><div class="card-title">طلباتي</div></div>
    </section>
  `,"renderChefs()");
}

/* Production */

function renderProduction(){if(!currentChef)return renderChefs(); const sectionItems=menuItems.filter(i=>!i.section||i.section===currentChef.section); const options=sectionItems.map(i=>`<option value="${escapeHtml(i.nameAr||"")}">${escapeHtml(i.code?i.code+" - ":"")}${escapeHtml(i.nameEn||"")}</option>`).join(""); pageLayout("الإنتاج",`<div class="panel"><label>اختر / اكتب المنتج</label><input id="productionNameInput" list="productionMenuList" placeholder="${sectionItems.length?"ابحث عن الصنف":getProductionPlaceholder()}" onkeydown="focusProductionQty(event)"><datalist id="productionMenuList">${options}</datalist><label>الكمية</label><input id="productionQtyInput" type="number" min="1" placeholder="مثال: 20" onkeydown="handleProductionQtyInput(event)"><button class="btn btn-main" onclick="addProductionFromInputs()">أضف الكمية</button><textarea id="productionNote" placeholder="ملاحظة للإدارة"></textarea></div><div class="panel" style="margin-top:16px"><h3>الإنتاج الحالي</h3><div id="productionDraftBox"></div><button class="btn btn-main" style="margin-top:12px" onclick="submitProduction()">رفع الإنتاج للإدارة</button></div><div id="lastProductionBox" style="margin-top:16px"></div>`,"renderChefDashboard(currentChef)"); drawProductionDraft(); drawLastProductionForChef(); setTimeout(()=>{const input=document.getElementById("productionNameInput"); if(input)input.focus();},100);}

function focusProductionQty(e){
  if(e.key !== "Enter") return;
  e.preventDefault();
  document.getElementById("productionQtyInput")?.focus();
}

function handleProductionQtyInput(e){
  if(e.key !== "Enter") return;
  e.preventDefault();
  addProductionFromInputs();
}

function addProductionFromInputs(){
  const nameInput=document.getElementById("productionNameInput");
  const qtyInput=document.getElementById("productionQtyInput");
  if(!nameInput || !qtyInput) return;

  const name=nameInput.value.trim();
  const qty=Number(qtyInput.value);

  if(!name){
    nameInput.focus();
    return;
  }

  if(!qty || qty<=0){
    qtyInput.focus();
    return;
  }

  const existing=productionDraft.find(i=>i.name===name);
  if(existing) existing.qty += qty;
  else productionDraft.push({name,qty});

  nameInput.value="";
  qtyInput.value="";
  drawProductionDraft();
  nameInput.focus();
}

function drawProductionDraft(){
  const box=document.getElementById("productionDraftBox");
  if(!box) return;

  if(!productionDraft.length){
    box.innerHTML=`<div class="placeholder">لا يوجد إنتاج حالي</div>`;
    return;
  }

  box.innerHTML=productionDraft.map((item,index)=>`
    <div style="display:grid;grid-template-columns:1fr auto auto auto auto;gap:8px;align-items:center;border-bottom:1px solid #e5eadb;padding:10px 0">
      <b>${item.name}</b>
      <button class="btn btn-light" onclick="changeProductionQty(${index},-1)">-</button>
      <b>${item.qty}</b>
      <button class="btn btn-main" onclick="changeProductionQty(${index},1)">+</button>
      <button class="btn btn-light" onclick="deleteProductionItem(${index})">🗑</button>
    </div>
  `).join("");
}

function changeProductionQty(index,delta){
  productionDraft[index].qty += delta;
  if(productionDraft[index].qty <= 0) productionDraft.splice(index,1);
  drawProductionDraft();
}

function deleteProductionItem(index){
  productionDraft.splice(index,1);
  drawProductionDraft();
}

async function submitProduction(){
  if(!productionDraft.length || !currentChef) return;

  const note=document.getElementById("productionNote")?.value.trim() || "";
  const timeMs=Date.now();

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"production_logs"),{
    chefName:currentChef.name,
    chefCode:currentChef.code,
    section:currentChef.section,
    items:[...productionDraft],
    note,
    createdAtText:nowText(),
    timeMs,
    expiresAtMs:timeMs + (24*60*60*1000),
    createdAt:serverTimestamp()
  });

  showToast("تم رفع الإنتاج للإدارة");
  productionDraft=[];
  renderProduction();
}

function getChefRecentProduction(){
  const now=Date.now();
  return productionLogs
    .filter(l=>l.chefCode===currentChef?.code && (l.expiresAtMs||0)>now)
    .sort((a,b)=>(b.timeMs||0)-(a.timeMs||0))[0];
}

function formatRemaining(ms){
  if(ms<=0) return "انتهى";
  const h=Math.floor(ms/3600000);
  const m=Math.floor((ms%3600000)/60000);
  const s=Math.floor((ms%60000)/1000);
  return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function drawLastProductionForChef(){
  const box=document.getElementById("lastProductionBox");
  if(!box) return;

  const log=getChefRecentProduction();
  if(!log){
    box.innerHTML="";
    return;
  }

  const remaining=(log.expiresAtMs||0)-Date.now();

  box.innerHTML=`
    <div class="panel">
      <h3>آخر إنتاج مرفوع</h3>
      <p style="color:#7b8674;font-weight:800;margin-top:8px">تم الرفع: ${log.createdAtText||""}</p>
      <p style="font-weight:900;margin-top:8px">المتبقي: ${formatRemaining(remaining)}</p>

      <div style="margin-top:12px">
        ${(log.items||[]).map(i=>`
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
            <span>${i.name}</span>
            <b>${i.qty}</b>
          </div>
        `).join("")}
      </div>

      ${log.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${log.note}</p>` : ""}
    </div>
  `;
}


/* Waste */

function renderWaste(){
  if(!currentChef) return renderChefs();

  pageLayout("التالف والهدر", `
    <div class="panel">
      <label>اسم المنتج</label>
      <input id="wasteProductName" placeholder="مثال: كرواسون">

      <label>الكمية</label>
      <input id="wasteQty" type="number" min="1" placeholder="مثال: 5">

      <label>سبب الهدر</label>
      <textarea id="wasteReason" placeholder="اكتب سبب الهدر"></textarea>

      <button class="btn btn-main" onclick="submitWaste()">رفع التالف للإدارة</button>
    </div>
  `,"renderChefDashboard(currentChef)");

  setTimeout(()=>document.getElementById("wasteProductName")?.focus(),100);
}

async function submitWaste(){
  if(!currentChef) return renderChefs();

  const productName=document.getElementById("wasteProductName").value.trim();
  const qty=Number(document.getElementById("wasteQty").value);
  const reason=document.getElementById("wasteReason").value.trim();

  if(!productName || !qty || qty<=0 || !reason){
    showToast("أكمل اسم المنتج والكمية وسبب الهدر","error");
    return;
  }

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"waste_logs"),{
    chefName:currentChef.name,
    chefCode:currentChef.code,
    section:currentChef.section,
    productName,
    qty,
    reason,
    createdAtText:nowText(),
    timeMs:Date.now(),
    createdAt:serverTimestamp()
  });

  showToast("تم رفع التالف والهدر للإدارة");
  renderChefDashboard(currentChef);
}

/* Warehouse Request */

function renderWarehouseRequest(){
  if(!currentChef) return renderChefs();
  currentCart=[];

  pageLayout("طلب مستودع", `
    <div class="panel">
      <input id="requestSearch" placeholder="🔍 بحث باسم الصنف أو الكود" oninput="drawRequestSearch()">
      <div id="requestResults"></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>السلة</h3>
      <div id="cartBox" class="placeholder">السلة فارغة</div>
      <textarea id="requestNote" placeholder="ملاحظة"></textarea>
      <button class="btn btn-main" onclick="sendWarehouseOrder()">إرسال الطلب</button>
    </div>
  `,"renderChefDashboard(currentChef)");

  drawRequestSearch();
}

function drawRequestSearch(){
  const box=document.getElementById("requestResults");
  const search=(document.getElementById("requestSearch")?.value||"").trim().toLowerCase();

  const list=warehouseItems.filter(i=>search&&(i.name.toLowerCase().includes(search)||i.code.toLowerCase().includes(search))).slice(0,20);

  if(!search){
    box.innerHTML=`<div class="placeholder">اكتب اسم الصنف أو الكود</div>`;
    return;
  }
  if(!list.length){
    box.innerHTML=`<div class="placeholder">لا توجد نتائج</div>`;
    return;
  }

  box.innerHTML=`
    <div style="display:grid;gap:8px">
      ${list.map(i=>`
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:16px;padding:12px;">
          <div><b>${i.name}</b><div style="color:#7b8674;font-weight:700">${i.code} - ${i.unit||""}</div></div>
          <input id="qty_${i.id}" type="number" min="1" placeholder="كمية" style="margin:0">
          <button class="btn btn-main" onclick="addToCart('${i.id}')">إضافة</button>
        </div>
      `).join("")}
    </div>
  `;
}

function addToCart(itemId){
  const item=warehouseItems.find(i=>i.id===itemId);
  const qty=Number(document.getElementById(`qty_${itemId}`).value);
  if(!item||qty<=0) return;

  const ex=currentCart.find(i=>i.itemId===itemId);
  if(ex) ex.qty += qty;
  else currentCart.push({itemId:item.id,name:item.name,code:item.code,unit:item.unit,qty});
  drawCart();
}

function drawCart(){
  const box=document.getElementById("cartBox");
  if(!currentCart.length){
    box.innerHTML="السلة فارغة";
    return;
  }

  box.innerHTML=currentCart.map((i,index)=>`
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5eadb;padding:8px 0;gap:10px">
      <span>${i.name}</span>
      <b>${i.qty} ${i.unit||""}</b>
      <button class="btn btn-light" onclick="removeFromCart(${index})">حذف</button>
    </div>
  `).join("");
}

function removeFromCart(index){
  currentCart.splice(index,1);
  drawCart();
}

async function getNextOrderId(){
  const {db,doc,getDoc,setDoc}=window.firebaseDB;
  const ref=doc(db,"settings","system");
  const snap=await getDoc(ref);
  const current=snap.exists() && snap.data().orderCounter ? snap.data().orderCounter : 1001;
  await setDoc(ref,{orderCounter:current+1},{merge:true});
  return `ORD-${current}`;
}

async function sendWarehouseOrder(){
  if(!currentCart.length||!currentChef) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  const orderId=await getNextOrderId();

  await addDoc(collection(db,"warehouse_orders"),{
    orderId,
    chefName:currentChef.name,
    chefCode:currentChef.code,
    section:currentChef.section,
    items:[...currentCart],
    note:document.getElementById("requestNote").value.trim(),
    status:"جديد",
    createdAtText:nowText(),
    createdAt:serverTimestamp()
  });

  currentCart=[];
  renderMyOrders();
}

function renderMyOrders(){
  if(!currentChef) return renderChefs();
  const myOrders=sortNewest(warehouseOrders.filter(o=>o.chefCode===currentChef.code && !["مؤرشف","محذوف"].includes(o.status)));
  pageLayout("طلباتي", `
    <div class="grid">
      ${myOrders.length ? myOrders.map(o=>renderOrderCard(o,true)).join("") : `<div class="panel placeholder">لا توجد طلبات</div>`}
    </div>
  `,"renderChefDashboard(currentChef)");
}

/* Warehouse */

function renderWarehouseGate(){
  pageLayout("دخول المستودع", `
    <div class="panel">
      <input id="warehousePasswordInputGate" type="password" placeholder="كلمة مرور المستودع">
      <button class="btn btn-main" onclick="checkWarehousePassword()">دخول</button>
    </div>
  `,"renderHome()");
}

function checkWarehousePassword(){
  const pass=document.getElementById("warehousePasswordInputGate").value.trim();
  if(pass !== String(systemSettings.warehousePassword)){
    showToast("كلمة المرور غير صحيحة","error");
    return;
  }
  renderWarehouseMenu();
}

function renderWarehouseMenu(){
  pageLayout("المستودع", `
    <section class="grid">
      <div class="card" onclick="renderWarehouseOrders()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">طلبات الشيفات</div></div>
      <div class="card" onclick="renderInternalIssue()"><div class="icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div><div class="card-title">صرف داخلي</div></div>
    </section>
  `,"renderHome()");
}

function renderWarehouseOrders(){
  pageLayout("طلبات الشيفات", `<div id="warehouseOrdersBox" class="grid"></div>`,"renderWarehouseMenu()");
  drawWarehouseOrders();
}

function drawWarehouseOrders(){
  const box=document.getElementById("warehouseOrdersBox");
  if(!box) return;
  const visibleOrders = sortNewest(warehouseOrders.filter(o=>!["تم الاستلام","مؤرشف","محذوف"].includes(o.status)));
  box.innerHTML=visibleOrders.length ? visibleOrders.map(o=>renderOrderCard(o,false)).join("") : `<div class="panel placeholder">لا توجد طلبات</div>`;
}

function getOrderIssueSummary(order){
  const items = order.items || [];
  const totalRequested = items.reduce((sum,item)=>sum + Number(item.qty || 0),0);
  const totalIssued = items.reduce((sum,item)=>sum + Number(item.issuedQty ?? item.qty ?? 0),0);
  if(items.length && totalIssued === 0) return "لم يصرف";
  if(totalIssued < totalRequested) return "صرف جزئي";
  return "صرف كامل";
}

function getOrderItemDisplay(item){
  if(item.issuedQty === undefined || item.issuedQty === null){
    return `<b>${item.qty} ${item.unit||""}</b>`;
  }
  return `<div class="issued-display"><b>مطلوب: ${item.qty} ${item.unit||""}</b><b>مصروف: ${item.issuedQty} ${item.unit||""}</b></div>`;
}

function renderOrderCard(order,isChefView){
  const issueSummary = order.issueStatus || getOrderIssueSummary(order);
  const isDone = order.status==="تم الاستلام" || order.status==="مؤرشف";

  return `
    <div class="panel">
      <h2><i class="fa-solid fa-boxes-stacked"></i> طلبية من قسم ${order.section}</h2>
      <p style="font-weight:800;margin-top:8px"><i class="fa-solid fa-utensils"></i> الشيف: ${order.chefName}</p>
      <p style="color:#7b8674;margin-top:4px">🆔 ${order.orderId||order.id}</p>
      <p style="color:#7b8674;margin-top:4px">🕒 ${order.createdAtText||""}</p>

      <div style="margin-top:12px">
        ${(order.items||[]).map((item,i)=>`
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5eadb;padding:8px 0;gap:12px">
            <span>${i+1}- ${item.name}</span>
            ${getOrderItemDisplay(item)}
          </div>
        `).join("")}
      </div>

      ${order.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${order.note}</p>` : ""}
      ${order.issuedAtText ? `<p style="margin-top:8px;color:#7b8674;font-weight:800">اعتماد الصرف: ${order.issuedAtText}</p>` : ""}

      <h3 style="margin-top:12px">الحالة: ${order.status}</h3>
      ${(order.status==="جاهز" || order.status==="تم الاستلام" || order.status==="مؤرشف") ? `<h3 style="margin-top:8px">${issueSummary}</h3>` : ""}

      ${isChefView && order.status==="جاهز" ? `<button class="btn btn-main" style="margin-top:12px" onclick="receiveOrder('${order.id}')">تم الاستلام</button>` : ""}

      ${!isChefView && !isDone ? `
        ${order.status !== "جاهز" ? `
          <div class="panel issue-box" style="margin-top:14px">
            <h3><i class="fa-solid fa-clipboard-check"></i> المصروف الفعلي</h3>
            <p style="color:#7b8674;font-weight:800;margin:8px 0 12px">اكتب الكمية التي خرجت فعلياً من المستودع، وليس الكمية المطلوبة.</p>
            ${(order.items||[]).map((item,i)=>`
              <div class="issue-row">
                <div>
                  <b>${item.name}</b>
                  <div style="color:#7b8674;font-weight:800;margin-top:4px">المطلوب: ${item.qty} ${item.unit||""}</div>
                </div>
                <input id="issued_${order.id}_${i}" type="number" min="0" step="any" value="${item.issuedQty ?? item.qty ?? 0}" placeholder="مصروف">
              </div>
            `).join("")}
            <button class="btn btn-main" style="margin-top:12px" onclick="approveWarehouseIssue('${order.id}')">اعتماد الصرف الفعلي</button>
          </div>
        ` : `
          <div style="margin-top:12px;display:grid;gap:8px">
            <button class="btn btn-light" onclick="printWarehouseOrder('${order.id}')">🖨 طباعة الطلب</button>
          </div>
        `}
      ` : ""}
    </div>
  `;
}

async function updateOrderStatus(id,status){
  const {db,doc,updateDoc}=window.firebaseDB;
  await updateDoc(doc(db,"warehouse_orders",id),{status});
}

async function approveWarehouseIssue(id){
  const order = warehouseOrders.find(o=>o.id===id);
  if(!order) return;
  const issuedItems = (order.items||[]).map((item,index)=>{
    const input = document.getElementById(`issued_${id}_${index}`);
    const issuedQty = Number(input?.value || 0);
    return {...item, issuedQty: issuedQty < 0 ? 0 : issuedQty};
  });
  const requestedTotal = issuedItems.reduce((sum,item)=>sum + Number(item.qty || 0),0);
  const issuedTotal = issuedItems.reduce((sum,item)=>sum + Number(item.issuedQty || 0),0);
  let issueStatus = "صرف كامل";
  if(issuedTotal === 0) issueStatus = "لم يصرف";
  else if(issuedTotal < requestedTotal) issueStatus = "صرف جزئي";
  const {db,doc,updateDoc}=window.firebaseDB;
  await updateDoc(doc(db,"warehouse_orders",id),{items:issuedItems,issueStatus,status:"جاهز",issuedAtText:nowText(),issuedAtMs:Date.now()});
  showToast("تم اعتماد الصرف الفعلي");
}

async function receiveOrder(id){
  const {db,doc,updateDoc}=window.firebaseDB;
  await updateDoc(doc(db,"warehouse_orders",id),{status:"تم الاستلام"});
  renderMyOrders();
}

async function archiveWarehouseOrder(id){
  const order = warehouseOrders.find(o=>o.id===id);
  if(!order) return;

  if(order.status !== "تم الاستلام"){
    showToast("لا يمكن حذف الطلب قبل أن يستلمه الشيف","error");
    return;
  }

  const {db,doc,updateDoc}=window.firebaseDB;
  await updateDoc(doc(db,"warehouse_orders",id),{
    status:"مؤرشف",
    archivedAtText:nowText(),
    archivedAtMs:Date.now()
  });

  warehouseOrders = warehouseOrders.map(o=>o.id===id ? {...o,status:"مؤرشف",archivedAtText:nowText(),archivedAtMs:Date.now()} : o);
  drawWarehouseOrders();
  showToast("تمت أرشفة الطلب");
}

async function deleteWarehouseOrder(id){
  const {db,doc,updateDoc}=window.firebaseDB;
  await updateDoc(doc(db,"warehouse_orders",id),{status:"محذوف",deletedAtText:nowText(),deletedAtMs:Date.now()});
  warehouseOrders = warehouseOrders.map(o=>o.id===id ? {...o,status:"محذوف"} : o);
  drawWarehouseOrders();
  showToast("تم حذف الطلب من شاشة المستودع");
}

/* Internal Issue */

function renderInternalIssue(){
  internalIssueCart=[];

  pageLayout("صرف داخلي", `
    <div class="panel">
      <label>موظف المستودع</label>
      <select id="internalStaff">
        ${warehouseStaff.length ? warehouseStaff.map(s=>`<option>${s.name}</option>`).join("") : `<option>موظف المستودع</option>`}
      </select>

      <label>جهة الصرف</label>
      <select id="internalDestination">
        ${internalDestinations.length ? internalDestinations.map(d=>`<option>${d.name}</option>`).join("") : `<option>مطبخ العمال</option>`}
      </select>

      <input id="internalSearch" placeholder="🔍 بحث باسم الصنف أو الكود" oninput="drawInternalSearch()">
      <div id="internalResults"></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>سلة الصرف</h3>
      <div id="internalCartBox" class="placeholder">السلة فارغة</div>
      <textarea id="internalNote" placeholder="ملاحظة"></textarea>
      <button class="btn btn-main" onclick="saveInternalIssue()">حفظ الصرف</button>
    </div>
  `,"renderWarehouseMenu()");

  drawInternalSearch();
}

function drawInternalSearch(){
  const box=document.getElementById("internalResults");
  if(!box) return;

  const search=(document.getElementById("internalSearch")?.value||"").trim().toLowerCase();
  const list=warehouseItems.filter(i=>search&&(i.name.toLowerCase().includes(search)||i.code.toLowerCase().includes(search))).slice(0,20);

  if(!search){
    box.innerHTML=`<div class="placeholder">اكتب اسم الصنف أو الكود</div>`;
    return;
  }

  if(!list.length){
    box.innerHTML=`<div class="placeholder">لا توجد نتائج</div>`;
    return;
  }

  box.innerHTML=`
    <div style="display:grid;gap:8px">
      ${list.map(i=>`
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:16px;padding:12px">
          <div><b>${i.name}</b><div style="color:#7b8674;font-weight:700">${i.code} - ${i.unit||""}</div></div>
          <input id="internal_qty_${i.id}" type="number" min="1" placeholder="كمية" style="margin:0">
          <button class="btn btn-main" onclick="addInternalItem('${i.id}')">إضافة</button>
        </div>
      `).join("")}
    </div>
  `;
}

function addInternalItem(itemId){
  const item=warehouseItems.find(i=>i.id===itemId);
  const qty=Number(document.getElementById(`internal_qty_${itemId}`).value);
  if(!item||qty<=0) return;

  const ex=internalIssueCart.find(i=>i.itemId===itemId);
  if(ex) ex.qty += qty;
  else internalIssueCart.push({itemId:item.id,name:item.name,code:item.code,unit:item.unit,qty});

  drawInternalCart();
}

function drawInternalCart(){
  const box=document.getElementById("internalCartBox");
  if(!box) return;

  if(!internalIssueCart.length){
    box.innerHTML="السلة فارغة";
    return;
  }

  box.innerHTML=internalIssueCart.map((i,index)=>`
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5eadb;padding:8px 0;gap:10px">
      <span>${i.name}</span>
      <b>${i.qty} ${i.unit||""}</b>
      <button class="btn btn-light" onclick="removeInternalItem(${index})">حذف</button>
    </div>
  `).join("");
}

function removeInternalItem(index){
  internalIssueCart.splice(index,1);
  drawInternalCart();
}

async function saveInternalIssue(){
  if(!internalIssueCart.length) return;

  const staff=document.getElementById("internalStaff").value;
  const destination=document.getElementById("internalDestination").value;
  const note=document.getElementById("internalNote").value.trim();

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;

  await addDoc(collection(db,"internal_issues"),{
    staff,
    destination,
    items:[...internalIssueCart],
    note,
    createdAtText:nowText(),
    timeMs:Date.now(),
    createdAt:serverTimestamp()
  });

  showToast("تم حفظ الصرف الداخلي");
  internalIssueCart=[];
  renderWarehouseMenu();
}

/* Cleaning */

function renderCleaning(){
  pageLayout("النظافة", `
    <section class="grid">
      <div class="card" onclick="renderCleaningLang('ar')"><div class="icon"><i class="fa-solid fa-language"></i></div><div class="card-title">العربية</div></div>
      <div class="card" onclick="renderCleaningLang('bn')"><div class="icon"><i class="fa-solid fa-globe"></i></div><div class="card-title">বাংলা</div></div>
    </section>
  `,"renderHome()");
}

function renderCleaningLang(lang){
  pageLayout(lang==="bn"?"পরিষ্কার":"النظافة", `
    <section class="grid">
      <div class="card" onclick="renderCleaningShift('${lang}','morning')"><div class="card-title">${lang==="bn"?shiftLabels.morning.bn:shiftLabels.morning.ar}</div></div>
      <div class="card" onclick="renderCleaningShift('${lang}','afternoon')"><div class="card-title">${lang==="bn"?shiftLabels.afternoon.bn:shiftLabels.afternoon.ar}</div></div>
      <div class="card" onclick="renderCleaningShift('${lang}','night')"><div class="card-title">${lang==="bn"?shiftLabels.night.bn:shiftLabels.night.ar}</div></div>
    </section>
  `,"renderCleaning()");
}

function renderCleaningShift(lang,shift){
  ensureUxStyle();
  const tasks=cleaningTasks.filter(t=>t[shift]);
  pageLayout(lang==="bn"?`${shiftLabels[shift].bn} - পরিষ্কার`:`${shiftLabels[shift].ar} - النظافة`, `
    <div class="task-list">
      ${tasks.length ? tasks.map(t=>`
        <label class="task-check-card">
          <input type="checkbox" class="cleanTaskCheck" value="${t.id}">
          <span class="task-check-ui"></span>
          <span class="task-text">
            <b>${t.nameAr}</b>
            ${(t.nameBn || getCleaningBnText(t.nameAr)) ? `<small>${t.nameBn || getCleaningBnText(t.nameAr)}</small>` : ""}
          </span>
        </label>
      `).join("") : `<div class="panel placeholder">${lang==="bn"?"কোনো কাজ নেই":"لا توجد مهام لهذه الوردية"}</div>`}
      <button class="btn btn-main" onclick="submitCleaning('${shift}')">${lang==="bn"?"সম্পন্ন":"✅ تم التنفيذ"}</button>
    </div>
  `,`renderCleaningLang('${lang}')`);
}

function translateCleaning(text){
  return cleaningBn[text]||text;
}

async function submitCleaning(shift){
  const checks=Array.from(document.querySelectorAll(".cleanTaskCheck"));
  const doneIds=checks.filter(c=>c.checked).map(c=>c.value);
  const tasks=cleaningTasks.filter(t=>t[shift]);

  const entries=tasks.map(t=>({taskId:t.id,nameAr:t.nameAr,done:doneIds.includes(t.id)}));

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"cleaning_logs"),{
    shift,entries,createdAtText:nowText(),timeMs:Date.now(),createdAt:serverTimestamp()
  });

  showToast("تم حفظ النظافة");
  renderCleaning();
}

/* Operations */

function renderOperations(){
  pageLayout("متابعة التشغيل", `
    <div class="panel">
      <label>اسم مسؤول التشغيل</label>
      <input id="operatorName" placeholder="اكتب اسم المسؤول">
    </div>
    <div id="operationRunBox" style="margin-top:16px"></div>
  `,"renderHome()");
  drawOperationRunBox();
}

function getOperationPeriods(){
  return [...new Set(operationTasks.map(t=>t.period).filter(Boolean))];
}

function getLatestOperationLog(taskId){
  const logs=operationLogs.filter(l=>l.taskId===taskId).sort((a,b)=>(a.timeMs||0)-(b.timeMs||0));
  return logs.length ? logs[logs.length-1] : null;
}

function drawOperationRunBox(){
  ensureUxStyle();
  const box=document.getElementById("operationRunBox");
  if(!box) return;

  if(!operationTasks.length){
    box.innerHTML=`<div class="panel placeholder">لا توجد مهام تشغيل</div>`;
    return;
  }

  const periods=getOperationPeriods();

  box.innerHTML=`
    ${periods.map(period=>{
      const tasks=operationTasks.filter(t=>t.period===period);
      return `
        <div class="panel" style="margin-bottom:14px">
          <h3>${period}</h3>
          <div style="margin-top:12px">
            ${tasks.map(t=>`
              <label class="task-check-card">
                <input type="checkbox" ${operationRunDraft[t.id] ? "checked" : ""} onchange="markOperationDraft('${t.id}',this.checked)">
                <span class="task-check-ui"></span>
                <span class="task-text"><b>${t.name}</b><small>${period}</small></span>
              </label>
            `).join("")}
          </div>
        </div>
      `;
    }).join("")}

    <div class="panel" style="margin-bottom:14px">
      <label>ملاحظات التشغيل</label>
      <textarea id="operationNote" placeholder="اكتب ملاحظات التشغيل هنا (اختياري)"></textarea>
    </div>

    <button class="btn btn-main" onclick="submitOperationRun()">رفع للإدارة</button>
  `;
}

function markOperationDraft(taskId,checked){
  if(checked) operationRunDraft[taskId]=true;
  else delete operationRunDraft[taskId];
}

async function submitOperationRun(){
  const operatorName=document.getElementById("operatorName")?.value.trim();
  const note=document.getElementById("operationNote")?.value.trim() || "";

  if(!operatorName){
    showToast("اكتب اسم مسؤول التشغيل أولاً","error");
    return;
  }

  const selectedIds=Object.keys(operationRunDraft).filter(id=>operationRunDraft[id]);
  if(!selectedIds.length){
    showToast("حدد مهام التشغيل أولاً","error");
    return;
  }

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  const batchId=`OP-${Date.now()}`;
  const timeMs=Date.now();
  const createdAtText=nowText();
  const completedAtText=timeOnly();

  for(const taskId of selectedIds){
    const task=operationTasks.find(t=>t.id===taskId);
    if(!task) continue;

    await addDoc(collection(db,"operation_logs"),{
      batchId,
      taskId:task.id,
      taskName:task.name,
      period:task.period,
      done:true,
      operatorName,
      note,
      completedAtText,
      createdAtText,
      timeMs,
      createdAt:serverTimestamp()
    });
  }

  showToast("تم رفع التشغيل للإدارة");
  operationRunDraft={};
  renderOperations();
}

/* Admin */

function renderAdminGate(){
  pageLayout("دخول الإدارة", `
    <div class="panel">
      <input id="adminPasswordInputGate" type="password" placeholder="كلمة مرور الإدارة">
      <button class="btn btn-main" onclick="checkAdminPassword()">دخول</button>
    </div>
  `,"renderHome()");
}

function checkAdminPassword(){
  const pass=document.getElementById("adminPasswordInputGate").value.trim();
  if(pass!==String(systemSettings.adminPassword)){
    showToast("كلمة المرور غير صحيحة","error");
    return;
  }
  renderAdmin();
}

function renderAdmin(){
  pageLayout("الإدارة", `
    <div class="panel">
      <h3>🔔 التنبيهات</h3>
      <div id="adminAlertsBox"></div>
    </div>

    <section class="grid" style="margin-top:16px">
      <div class="card" onclick="renderAdminProduction()"><div class="icon"><i class="fa-solid fa-chart-line"></i></div><div class="card-title">الإنتاج</div></div>
      <div class="card" onclick="renderAdminWaste()"><div class="icon"><i class="fa-solid fa-trash-can"></i></div><div class="card-title">التالف والهدر</div></div>
      <div class="card" onclick="renderAdminWarehouse()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">المستودع</div></div>
      <div class="card" onclick="renderAdminCleaning()"><div class="icon"><i class="fa-solid fa-broom"></i></div><div class="card-title">النظافة</div></div>
      <div class="card" onclick="renderAdminOperations()"><div class="icon"><i class="fa-solid fa-industry"></i></div><div class="card-title">التشغيل</div></div>
      <div class="card" onclick="renderAdminPDF()"><div class="icon"><i class="fa-solid fa-file-pdf"></i></div><div class="card-title">تصدير PDF</div></div>
    </section>
  `,"renderHome()");
  drawAdminAlerts();
}

function getAlert(order){
  let text="";
  if(order.status==="جديد") text=`طلب جديد من ${order.section}`;
  if(order.status==="قيد التجهيز") text=`طلب ${order.section} قيد التجهيز`;
  if(order.status==="جاهز") text=`طلب ${order.section} جاهز للاستلام`;
  if(order.status==="متأخر") text=`طلب ${order.section} متأخر`;
  if(order.status==="تم الاستلام") text=`تم استلام طلب من ${order.section}`;
  return {key:`${order.id}-${order.status}`,orderId:order.id,text,sub:`${order.chefName} - ${order.orderId||order.id}`};
}

async function dismissAlert(key){
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  if(dismissedAlerts.some(a=>a.key===key)) return;
  await addDoc(collection(db,"dismissed_alerts"),{key,createdAt:serverTimestamp()});
}

function drawAdminAlerts(){
  const box=document.getElementById("adminAlertsBox");
  if(!box) return;
  const hidden=dismissedAlerts.map(a=>a.key);
  const alerts=[];
  warehouseOrders.forEach(order=>{const a=getAlert(order); if(a.text) alerts.push({...a,time:getTimeValue(order)});});
  productionLogs.forEach(l=>alerts.push({key:`production-${l.id}`,text:"إنتاج جديد",sub:`${l.section||""} - ${l.chefName||""}`,time:getTimeValue(l),action:`renderAdminProduction()`}));
  wasteLogs.forEach(l=>alerts.push({key:`waste-${l.id}`,text:"تالف / هدر",sub:`${l.section||""} - ${l.chefName||""}`,time:getTimeValue(l),action:`renderAdminWaste()`}));
  internalIssues.forEach(l=>alerts.push({key:`internal-${l.id}`,text:"صرف داخلي",sub:`${l.destination||""} - ${l.staff||""}`,time:getTimeValue(l),action:`renderAdminInternalIssue()`}));
  cleaningLogs.forEach(l=>alerts.push({key:`cleaning-${l.id}`,text:"تقرير نظافة",sub:`${shiftLabels[l.shift]?.ar||""}`,time:getTimeValue(l),action:`renderAdminCleaning()`}));
  operationLogs.forEach(l=>alerts.push({key:`operation-${l.id}`,text:"تقرير تشغيل",sub:`${l.period||""} - ${l.operatorName||""}`,time:getTimeValue(l),action:`renderAdminOperations()`}));
  const visible=sortNewest(alerts).filter(a=>!hidden.includes(a.key)).slice(0,20);
  box.innerHTML=visible.length ? visible.map(a=>`
    <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:18px;padding:14px;margin-bottom:10px">
      <div onclick="${a.orderId ? `renderOrderDetails('${a.orderId}')` : (a.action||'renderAdmin()')}" style="cursor:pointer">
        <b>${a.text}</b><div style="color:#7b8674;font-weight:700;margin-top:4px">${a.sub||""}</div>
      </div>
      <button class="btn btn-light" onclick="dismissAlert('${a.key}')">×</button>
    </div>`).join("") : `<div class="placeholder">لا توجد تنبيهات</div>`;
}

function renderOrderDetails(id){
  const order=warehouseOrders.find(o=>o.id===id);
  if(!order) return renderAdmin();
  pageLayout(order.orderId||order.id, `${renderOrderCard(order,false)}`,"renderAdmin()");
}

function renderAdminProduction(){
  pageLayout("تقرير الإنتاج", `<div id="productionAdminBox"></div>`,"renderAdmin()");
  drawProductionAdmin();
}

function drawProductionAdmin(){
  const box=document.getElementById("productionAdminBox");
  if(!box) return;

  if(!productionLogs.length){
    box.innerHTML=`<div class="panel placeholder">لا يوجد إنتاج</div>`;
    return;
  }

  const logs=sortNewest(productionLogs);

  box.innerHTML=`
    <div class="panel" style="margin-bottom:14px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h3>تقرير الإنتاج</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-main" onclick="printReport('production')">🖨 طباعة التقرير</button>
        <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('production_logs','renderAdminProduction')">🗑 حذف جميع العمليات المطبوعة</button>
      </div>
    </div>
    ${logs.map(log=>`
      <div class="panel" style="margin-bottom:14px">
        <h3>${log.section} - ${log.chefName}</h3>
        <p style="color:#7b8674;font-weight:800;margin-top:6px">${log.createdAtText||""}</p>
        <div style="margin-top:12px">
          ${(log.items||[]).map(i=>`
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
              <span>${i.name}</span><b>${i.qty}</b>
            </div>`).join("")}
        </div>
        ${log.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${log.note}</p>` : ""}
        ${adminActionMenu('production_logs',log.id,`printProductionLog('${log.id}')`,!!log.printed,'renderAdminProduction')}
      </div>`).join("")}
  `;
}


function renderAdminWaste(){
  pageLayout("تقرير التالف والهدر", `<div id="wasteAdminBox"></div>`,"renderAdmin()");
  drawWasteAdmin();
}

function drawWasteAdmin(){
  const box=document.getElementById("wasteAdminBox");
  if(!box) return;

  if(!wasteLogs.length){
    box.innerHTML=`<div class="panel placeholder">لا يوجد تالف أو هدر</div>`;
    return;
  }

  const logs=sortNewest(wasteLogs);

  box.innerHTML=`
    <div class="panel" style="margin-bottom:14px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h3>تقرير التالف والهدر</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-main" onclick="printReport('waste')">🖨 طباعة التقرير</button>
        <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('waste_logs','renderAdminWaste')">🗑 حذف جميع العمليات المطبوعة</button>
      </div>
    </div>
    ${logs.map(log=>`
      <div class="panel" style="margin-bottom:14px">
        <h3>${log.section} - ${log.chefName}</h3>
        <p style="color:#7b8674;font-weight:800;margin-top:6px">${log.createdAtText||""}</p>
        <div style="margin-top:12px;border-bottom:1px solid #e5eadb;padding-bottom:8px">
          <b>${log.productName}</b><div style="margin-top:6px">الكمية: <b>${log.qty}</b></div>
        </div>
        <p style="margin-top:12px;color:#7b8674"><b>السبب:</b> ${log.reason||""}</p>
        ${adminActionMenu('waste_logs',log.id,`printWasteLog('${log.id}')`,!!log.printed,'renderAdminWaste')}
      </div>`).join("")}
  `;
}

function renderAdminWarehouse(){
  pageLayout("المستودع", `
    <section class="grid">
      <div class="card" onclick="renderAdminWarehouseArchive()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">طلبات الشيفات</div></div>
      <div class="card" onclick="renderAdminInternalIssue()"><div class="icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div><div class="card-title">الصرف الداخلي</div></div>
      <div class="card" onclick="printWarehouseReport()"><div class="icon"><i class="fa-solid fa-file-pdf"></i></div><div class="card-title">طباعة تقرير المستودع</div></div>
    </section>
  `,"renderAdmin()");
}

function renderAdminWarehouseArchive(){
  pageLayout("طلبات الشيفات", `<div id="warehouseArchiveBox"></div>`,"renderAdminWarehouse()");
  drawWarehouseArchive();
}

function drawWarehouseArchive(){
  const box=document.getElementById("warehouseArchiveBox");
  if(!box) return;

  const archived = sortNewest(warehouseOrders.filter(o=>["جاهز","تم الاستلام","مؤرشف","محذوف"].includes(o.status) || o.issuedAtText));

  if(!archived.length){
    box.innerHTML=`<div class="panel placeholder">لا توجد طلبات شيفات</div>`;
    return;
  }

  box.innerHTML = `
    <div class="panel" style="margin-bottom:14px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h3>طلبات الشيفات</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('warehouse_orders','renderAdminWarehouseArchive')">🗑 حذف جميع العمليات المطبوعة</button>
      </div>
    </div>
    ${archived.map(order=>`
      <div class="panel" style="margin-bottom:14px">
        <h3>طلب شيفات - ${order.section}</h3>
        <p style="color:#7b8674;font-weight:800">الشيف: ${order.chefName}</p>
        <p style="color:#7b8674;font-weight:800">رقم الطلب: ${order.orderId||order.id}</p>
        <p style="color:#7b8674;font-weight:800">وقت الاستلام: ${order.archivedAtText||order.issuedAtText||order.createdAtText||""}</p>
        <div style="margin-top:12px">
          ${(order.items||[]).map((item,i)=>`
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
              <span>${i+1}- ${item.name}</span>
              <b>${item.issuedQty !== undefined ? `مطلوب: ${item.qty} / مصروف: ${item.issuedQty}` : `${item.qty} ${item.unit||""}`}</b>
            </div>`).join("")}
        </div>
        ${order.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${order.note}</p>` : ""}
        ${adminActionMenu('warehouse_orders',order.id,`printWarehouseOrder('${order.id}')`,!!order.printed,'renderAdminWarehouseArchive')}
      </div>`).join("")}
  `;
}

function renderAdminInternalIssue(){
  pageLayout("الصرف الداخلي", `<div id="internalIssueAdminBox"></div>`,"renderAdminWarehouse()");
  drawInternalIssueAdmin();
}

function drawInternalIssueAdmin(){
  const box=document.getElementById("internalIssueAdminBox");
  if(!box) return;

  if(!internalIssues.length){
    box.innerHTML=`<div class="panel placeholder">لا يوجد صرف داخلي</div>`;
    return;
  }

  const logs=sortNewest(internalIssues);

  box.innerHTML=`
    <div class="panel" style="margin-bottom:14px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h3>الصرف الداخلي</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-main" onclick="printReport('internal')">🖨 طباعة التقرير</button>
        <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('internal_issues','renderAdminInternalIssue')">🗑 حذف جميع العمليات المطبوعة</button>
      </div>
    </div>
    ${logs.map(log=>`
      <div class="panel" style="margin-bottom:14px">
        <h3>${log.destination}</h3>
        <p style="color:#7b8674;font-weight:800;margin-top:6px">صرف بواسطة: ${log.staff || ""}</p>
        <p style="color:#7b8674;font-weight:800">${log.createdAtText || ""}</p>
        <div style="margin-top:12px">
          ${(log.items||[]).map(i=>`
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
              <span>${i.name}</span><b>${i.qty} ${i.unit||""}</b>
            </div>`).join("")}
        </div>
        ${log.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${log.note}</p>` : ""}
        ${adminActionMenu('internal_issues',log.id,`printInternalIssue('${log.id}')`,!!log.printed,'renderAdminInternalIssue')}
      </div>`).join("")}
  `;
}

function renderAdminCleaning(){
  pageLayout("تقرير النظافة", `<div id="cleaningAdminBox"></div>`,"renderAdmin()");
  drawCleaningAdmin();
}

function getLatestCleaningLog(shift){
  const logs=cleaningLogs.filter(l=>l.shift===shift).sort((a,b)=>(a.timeMs||0)-(b.timeMs||0));
  return logs.length ? logs[logs.length-1] : null;
}

function drawCleaningAdmin(){
  const box=document.getElementById("cleaningAdminBox");
  if(!box) return;

  if(!cleaningLogs.length){
    box.innerHTML=`<div class="panel placeholder">لا يوجد تقارير نظافة</div>`;
    return;
  }

  const logs=sortNewest(cleaningLogs);

  box.innerHTML=`
    <div class="panel" style="margin-bottom:14px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h3>تقرير النظافة</h3>
      <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('cleaning_logs','renderAdminCleaning')">🗑 حذف جميع العمليات المطبوعة</button>
    </div>
    ${logs.map(log=>{
      const total=log.entries?log.entries.length:0;
      const done=log.entries?log.entries.filter(e=>e.done).length:0;
      const status=total>0&&done===total?"مكتمل":"ناقص";
      return `
        <div class="panel" style="margin-bottom:12px">
          <h3>${shiftLabels[log.shift]?.ar || "النظافة"}</h3>
          <p style="font-weight:900;margin-top:8px">${status}</p>
          <p style="color:#7b8674;font-weight:800">${log.createdAtText||""}</p>
          <div style="margin-top:12px">
            ${(log.entries||[]).map(e=>`
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
                <span>${e.nameAr}</span><b>${e.done?"تم":"لم يتم"}</b>
              </div>`).join("")}
          </div>
          ${adminActionMenu('cleaning_logs',log.id,`printCleaningLog('${log.id}')`,!!log.printed,'renderAdminCleaning')}
        </div>`;
    }).join("")}
  `;
}

function renderAdminOperations(){
  pageLayout("تقرير التشغيل", `<div id="operationAdminBox"></div>`,"renderAdmin()");
  drawOperationAdmin();
}

function drawOperationAdmin(){
  const box=document.getElementById("operationAdminBox");
  if(!box) return;

  if(!operationLogs.length){
    box.innerHTML=`<div class="panel placeholder">لا توجد تقارير تشغيل</div>`;
    return;
  }

  const logs=sortNewest(operationLogs);

  box.innerHTML=`
    <div class="panel" style="margin-bottom:14px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <h3>تقرير التشغيل</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-main" onclick="printReport('operations')">🖨 طباعة التقرير</button>
        <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('operation_logs','renderAdminOperations')">🗑 حذف جميع العمليات المطبوعة</button>
      </div>
    </div>
    ${logs.map(log=>`
      <div class="panel" style="margin-bottom:14px">
        <h3>${log.period||"تشغيل"}</h3>
        <div style="border-bottom:1px solid #e5eadb;padding:10px 0">
          <div style="display:flex;justify-content:space-between;gap:10px"><span>${log.taskName||""}</span><b>${log.done?"تم":"لم يتم"}</b></div>
          <div style="color:#7b8674;font-weight:800;margin-top:4px">${log.completedAtText||log.createdAtText||""} - ${log.operatorName||""}</div>
          ${log.note ? `<div style="color:#7b8674;margin-top:6px">📝 ${log.note}</div>` : ""}
        </div>
        ${adminActionMenu('operation_logs',log.id,`printOperationLog('${log.id}')`,!!log.printed,'renderAdminOperations')}
      </div>`).join("")}
  `;
}


/* PDF / Print Reports */

function renderAdminPDF(){
  pageLayout("تصدير PDF", `
    <section class="grid">
      <div class="card" onclick="printWarehouseReport()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">تقرير المستودع</div></div>
      <div class="card" onclick="printAllProduction()"><div class="icon"><i class="fa-solid fa-chart-line"></i></div><div class="card-title">تقرير الإنتاج</div></div>
      <div class="card" onclick="printAllWaste()"><div class="icon"><i class="fa-solid fa-trash-can"></i></div><div class="card-title">تقرير التالف والهدر</div></div>
      <div class="card" onclick="printAllCleaning()"><div class="icon"><i class="fa-solid fa-broom"></i></div><div class="card-title">تقرير النظافة</div></div>
      <div class="card" onclick="printAllOperations()"><div class="icon"><i class="fa-solid fa-industry"></i></div><div class="card-title">تقرير التشغيل</div></div>
      <div class="card" onclick="printFullDailyReport()"><div class="icon"><i class="fa-solid fa-file-pdf"></i></div><div class="card-title">التقرير الشامل</div></div>
    </section>
  `,"renderAdmin()");
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function openPrintReport(title, bodyHtml){
  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body{font-family:Arial,Tahoma,sans-serif;direction:rtl;padding:24px;color:#111}
          h1,h2,h3{text-align:center;margin:6px 0}
          .meta{text-align:center;color:#666;margin:10px 0 20px;font-weight:bold}
          .card{border:1px solid #ddd;border-radius:12px;padding:14px;margin:12px 0;page-break-inside:avoid}
          table{width:100%;border-collapse:collapse;margin-top:10px}
          th,td{border:1px solid #333;padding:7px;text-align:center}
          .note{margin-top:10px;color:#444}
        </style>
      </head>
      <body>
        <h1>Protein & Carb</h1>
        <h2>${escapeHtml(title)}</h2>
        <div class="meta">${escapeHtml(nowText())}</div>
        ${bodyHtml}
        <script>window.print();<\/script>
      </body>
    </html>
  `;
  const win = window.open("", "_blank");
  if(!win){
    showToast("المتصفح منع فتح نافذة الطباعة");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function itemsTable(items, withUnit=true){
  const hasIssued = (items||[]).some(item=>item.issuedQty !== undefined && item.issuedQty !== null);
  return `
    <table>
      <thead><tr><th>#</th><th>الصنف</th>${hasIssued ? "<th>المطلوب</th><th>المصروف</th>" : "<th>الكمية</th>"}${withUnit ? "<th>الوحدة</th>" : ""}</tr></thead>
      <tbody>
        ${(items||[]).map((item,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(item.name || item.productName || "")}</td>${hasIssued ? `<td>${escapeHtml(item.qty || "")}</td><td>${escapeHtml(item.issuedQty ?? item.qty ?? "")}</td>` : `<td>${escapeHtml(item.qty || "")}</td>`}${withUnit ? `<td>${escapeHtml(item.unit || "")}</td>` : ""}</tr>`).join("")}
      </tbody>
    </table>`;
}

function buildProductionReport(source=productionLogs){
  if(!source.length) return `<div class="card">لا يوجد إنتاج</div>`;
  return sortNewest(source).map(log=>`
    <div class="card">
      <h3>${escapeHtml(log.section)} - ${escapeHtml(log.chefName)}</h3>
      <div class="meta">${escapeHtml(log.createdAtText||"")}</div>
      ${itemsTable(log.items, false)}
      ${log.note ? `<div class="note"><b>ملاحظة:</b> ${escapeHtml(log.note)}</div>` : ""}
    </div>
  `).join("");
}

function buildWasteReport(source=wasteLogs){
  if(!source.length) return `<div class="card">لا يوجد تالف أو هدر</div>`;
  return sortNewest(source).map(log=>`
    <div class="card">
      <h3>${escapeHtml(log.section)} - ${escapeHtml(log.chefName)}</h3>
      <div class="meta">${escapeHtml(log.createdAtText||"")}</div>
      <table>
        <thead><tr><th>الصنف</th><th>الكمية</th><th>السبب</th></tr></thead>
        <tbody>
          <tr>
            <td>${escapeHtml(log.productName||"")}</td>
            <td>${escapeHtml(log.qty||"")}</td>
            <td>${escapeHtml(log.reason||"")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `).join("");
}

function buildOperationsReport(source=operationLogs){
  if(!source.length) return `<div class="card">لا يوجد تشغيل</div>`;
  return sortNewest(source).map(log=>`
    <div class="card">
      <h3>${escapeHtml(log.period||"تشغيل")}</h3>
      <table>
        <tbody>
          <tr><th>المهمة</th><td>${escapeHtml(log.taskName||"")}</td></tr>
          <tr><th>المسؤول</th><td>${escapeHtml(log.operatorName||"")}</td></tr>
          <tr><th>الوقت</th><td>${escapeHtml(log.createdAtText||log.completedAtText||"")}</td></tr>
          <tr><th>الحالة</th><td>${log.done ? "تم" : "لم يتم"}</td></tr>
          ${log.note ? `<tr><th>الملاحظات</th><td>${escapeHtml(log.note)}</td></tr>` : ""}
        </tbody>
      </table>
    </div>
  `).join("");
}

function buildInternalReport(source=internalIssues){
  if(!source.length) return `<div class="card">لا يوجد صرف داخلي</div>`;
  return sortNewest(source).map(log=>`
    <div class="card">
      <h3>${escapeHtml(log.destination||"صرف داخلي")}</h3>
      <div class="meta">بواسطة: ${escapeHtml(log.staff||"")} - ${escapeHtml(log.createdAtText||"")}</div>
      ${itemsTable(log.items, true)}
      ${log.note ? `<div class="note"><b>ملاحظة:</b> ${escapeHtml(log.note)}</div>` : ""}
    </div>
  `).join("");
}

function printReport(type){
  if(type==="production") return openPrintReport("تقرير الإنتاج", buildProductionReport());
  if(type==="waste") return openPrintReport("تقرير التالف والهدر", buildWasteReport());
  if(type==="operations") return openPrintReport("تقرير التشغيل", buildOperationsReport());
  if(type==="internal") return openPrintReport("تقرير الصرف الداخلي", buildInternalReport());

  const summary = `
    <div class="card"><h3>الإنتاج</h3>${buildProductionReport()}</div>
    <div class="card"><h3>التالف والهدر</h3>${buildWasteReport()}</div>
    <div class="card"><h3>التشغيل</h3>${buildOperationsReport()}</div>
    <div class="card"><h3>الصرف الداخلي</h3>${buildInternalReport()}</div>
  `;
  return openPrintReport("تقرير شامل", summary);
}

function printWarehouseOrder(id){
  const order=warehouseOrders.find(o=>o.id===id);
  if(!order) return;
  markPrinted("warehouse_orders",id);

  const body = `
    <div class="card">
      <table>
        <tbody>
          <tr><th>رقم الطلب</th><td>${escapeHtml(order.orderId||order.id)}</td></tr>
          <tr><th>القسم</th><td>${escapeHtml(order.section||"")}</td></tr>
          <tr><th>الشيف</th><td>${escapeHtml(order.chefName||"")}</td></tr>
          <tr><th>الوقت</th><td>${escapeHtml(order.createdAtText||"")}</td></tr>
          <tr><th>الحالة</th><td>${escapeHtml(order.status||"")}</td></tr><tr><th>حالة الصرف</th><td>${escapeHtml(order.issueStatus || getOrderIssueSummary(order))}</td></tr>
        </tbody>
      </table>
      ${itemsTable(order.items, true)}
      ${order.note ? `<div class="note"><b>ملاحظة:</b> ${escapeHtml(order.note)}</div>` : ""}
    </div>
  `;
  openPrintReport("طلب مستودع", body);
}


function printInternalIssue(id){
  const log=internalIssues.find(i=>i.id===id);
  if(!log) return;
  markPrinted("internal_issues",id);
  const body = `
    <div class="card">
      <table>
        <tbody>
          <tr><th>جهة الصرف</th><td>${escapeHtml(log.destination||"")}</td></tr>
          <tr><th>صرف بواسطة</th><td>${escapeHtml(log.staff||"")}</td></tr>
          <tr><th>الوقت</th><td>${escapeHtml(log.createdAtText||"")}</td></tr>
        </tbody>
      </table>
      ${itemsTable(log.items, true)}
      ${log.note ? `<div class="note"><b>ملاحظة:</b> ${escapeHtml(log.note)}</div>` : ""}
    </div>
  `;
  openPrintReport("صرف داخلي", body);
}

function renderAdminSection(title){
  pageLayout(title, `<div class="panel placeholder">${title}</div>`,"renderAdmin()");
}

/* Helpers */

async function deleteDocByPath(collectionName,id){
  const {db,doc,deleteDoc}=window.firebaseDB;
  await deleteDoc(doc(db,collectionName,id));
}

/* Start */

initCloud();
renderHome();

function printAllInternalIssue(){ printWarehouseReport(); }



/* ===== Premium V1 Helpers ===== */
function normalizeText(v){return String(v??"").trim();}
function splitArEn(value){const raw=normalizeText(value); if(!raw)return{ar:"",en:""}; const p=raw.split("/").map(x=>x.trim()).filter(Boolean); return p.length>=2?{ar:p[0],en:p.slice(1).join(" / ")}:{ar:raw,en:""};}
function itemDisplayName(i){return i.nameAr||i.name||i.ar||"";}
function itemDisplayEn(i){return i.nameEn||i.en||"";}
function itemCode(i){return i.code||"";}
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function getActiveSettingsTabFromHash(){return localStorage.getItem("pcSettingsTab")||"overview";}
function setSettingsTab(tab){localStorage.setItem("pcSettingsTab",tab);}
function settingsStatsCards(){return `<div class="settings-stats"><div><span>الشيفات</span><b>${chefs.length}</b></div><div><span>أصناف المستودع</span><b>${warehouseItems.length}</b></div><div><span>أصناف الإنتاج</span><b>${menuItems.length}</b></div><div><span>الأقسام</span><b>${chefSections.length}</b></div></div>`;}
function settingsShell(active,title,bodyHtml){
 const nav=[["overview","fa-gauge-high","نظرة عامة"],["chefs","fa-utensils","إدارة الشيفات"],["sections","fa-folder-tree","إدارة الأقسام"],["warehouse","fa-boxes-stacked","أصناف المستودع"],["menu","fa-plate-wheat","أصناف المنيو والإنتاج"],["excel","fa-file-excel","استيراد Excel"],["cleaning","fa-broom","النظافة"],["operations","fa-industry","التشغيل"],["internal","fa-arrow-up-from-bracket","الصرف الداخلي"],["passwords","fa-lock","الصلاحيات"],["about","fa-circle-info","حول البرنامج"]];
 currentBackFn="renderHome()"; if(!isPhoneBack)history.pushState({page:"settings-"+active},"");
 app.innerHTML=`<main class="settings-premium"><aside class="settings-sidebar"><div class="settings-brand"><img src="assets/logo.png" onerror="this.style.display='none'"><div><b>الإعدادات</b><span>Premium V1.0</span></div></div><nav class="settings-nav">${nav.map(([key,icon,label])=>`<button class="${active===key?"active":""}" onclick="openSettingsTab('${key}')"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`).join("")}</nav><button class="settings-back" onclick="renderHome()"><i class="fa-solid fa-house"></i> الرئيسية</button></aside><section class="settings-content"><div class="settings-top"><div><p>Protein & Carb Operations</p><h2>${title}</h2></div><button class="btn btn-light" onclick="renderHome()">رجوع</button></div>${bodyHtml}</section></main>`;
}
function openSettingsTab(tab){setSettingsTab(tab); if(tab==="overview")return renderSettingsOverview(); if(tab==="chefs")return renderSettingsChefs(); if(tab==="sections")return renderSettingsSections(); if(tab==="warehouse")return renderSettingsWarehouseItems(); if(tab==="menu")return renderSettingsMenuItems(); if(tab==="excel")return renderSettingsExcel(); if(tab==="cleaning")return renderSettingsCleaning(); if(tab==="operations")return renderSettingsOperations(); if(tab==="internal")return renderSettingsInternalIssue(); if(tab==="passwords")return renderSettingsPasswords(); if(tab==="about")return renderSettingsAbout(); renderSettingsOverview();}
function csvEscape(v){const s=String(v??""); return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function downloadTextFile(filename,text){const blob=new Blob([text],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);}
function exportWarehouseCSV(){const rows=[["code","arabic","english","unit"],...warehouseItems.map(i=>[itemCode(i),itemDisplayName(i),itemDisplayEn(i),i.unit||""])]; downloadTextFile("warehouse-items.csv",rows.map(r=>r.map(csvEscape).join(",")).join("\n"));}
function exportMenuCSV(){const rows=[["code","arabic","english","section"],...menuItems.map(i=>[itemCode(i),i.nameAr||"",i.nameEn||"",i.section||""])]; downloadTextFile("menu-items.csv",rows.map(r=>r.map(csvEscape).join(",")).join("\n"));}
function parseExcelRows(file){return new Promise((resolve,reject)=>{if(!window.XLSX){reject(new Error("مكتبة Excel غير محملة"));return;} const reader=new FileReader(); reader.onload=e=>{try{const data=new Uint8Array(e.target.result); const wb=XLSX.read(data,{type:"array"}); const sheet=wb.Sheets[wb.SheetNames[0]]; resolve(XLSX.utils.sheet_to_json(sheet,{header:1,defval:""}));}catch(err){reject(err)}}; reader.onerror=reject; reader.readAsArrayBuffer(file);});}
function detectExcelColumns(header){const n=header.map(x=>String(x||"").trim().toLowerCase()); const find=keys=>n.findIndex(h=>keys.some(k=>h.includes(k))); return{code:find(["code","كود","الكود","رمز"]),ar:find(["arabic","عربي","العربي","اسم عربي","الاسم العربي"]),en:find(["english","انجليزي","الإنجليزي","الانجليزي","اسم انجليزي","الاسم الإنجليزي"]),unit:find(["unit","وحدة","الوحدة"]),section:find(["section","قسم","القسم"])};}
function getExcelCell(row,idx){return idx>=0?normalizeText(row[idx]):"";}
async function importWarehouseExcel(){const input=document.getElementById("warehouseExcelInput"); const file=input?.files?.[0]; if(!file){showToast("اختر ملف Excel أولاً","error");return;} try{const rows=await parseExcelRows(file); if(rows.length<2){showToast("الملف فارغ","error");return;} const cols=detectExcelColumns(rows[0]); let added=0; const {db,addDoc,collection,serverTimestamp}=window.firebaseDB; for(const row of rows.slice(1)){let code=getExcelCell(row,cols.code), nameAr=getExcelCell(row,cols.ar), nameEn=getExcelCell(row,cols.en), unit=getExcelCell(row,cols.unit); if(!nameAr&&!nameEn){code=normalizeText(row[0]);nameAr=normalizeText(row[1]);nameEn=normalizeText(row[2]);unit=normalizeText(row[3]);} if(!nameAr&&!nameEn)continue; if(code&&warehouseItems.some(i=>String(i.code||"")===code))continue; await addDoc(collection(db,"warehouse_items"),{code,name:nameAr||nameEn,nameAr:nameAr||nameEn,nameEn,unit:unit||"حبة",createdAt:serverTimestamp()}); added++;} showToast(`تم استيراد ${added} صنف للمستودع`); input.value="";}catch(err){console.error(err);showToast("تعذر استيراد الملف","error");}}
async function importMenuExcel(){const input=document.getElementById("menuExcelInput"); const file=input?.files?.[0]; if(!file){showToast("اختر ملف Excel أولاً","error");return;} try{const rows=await parseExcelRows(file); if(rows.length<2){showToast("الملف فارغ","error");return;} const cols=detectExcelColumns(rows[0]); let added=0; const {db,addDoc,collection,serverTimestamp}=window.firebaseDB; for(const row of rows.slice(1)){let code=getExcelCell(row,cols.code), nameAr=getExcelCell(row,cols.ar), nameEn=getExcelCell(row,cols.en), section=getExcelCell(row,cols.section); if(!nameAr&&!nameEn){code=normalizeText(row[0]);nameAr=normalizeText(row[1]);nameEn=normalizeText(row[2]);section=normalizeText(row[3]);} if(!nameAr&&!nameEn)continue; if(code&&menuItems.some(i=>String(i.code||"")===code))continue; await addDoc(collection(db,"menu_items"),{code,nameAr:nameAr||nameEn,nameEn,section:section||"",createdAt:serverTimestamp()}); added++;} showToast(`تم استيراد ${added} صنف إنتاج`); input.value="";}catch(err){console.error(err);showToast("تعذر استيراد الملف","error");}}



function renderSettingsOverview(){settingsShell("overview","نظرة عامة",`${settingsStatsCards()}<div class="premium-card"><h3>إدارة النظام</h3><p class="muted">من هنا يتم التحكم في الشيفات، الأقسام، الأصناف، الاستيراد، والصلاحيات.</p><div class="quick-actions"><button class="btn btn-main" onclick="openSettingsTab('warehouse')">إدارة أصناف المستودع</button><button class="btn btn-light" onclick="openSettingsTab('menu')">إدارة أصناف الإنتاج</button><button class="btn btn-light" onclick="openSettingsTab('excel')">استيراد Excel</button></div></div>`);}


function renderSettingsMenuItems(){settingsShell("menu","أصناف المنيو والإنتاج",`<div class="premium-toolbar"><input id="menuSearch" placeholder="بحث بالكود أو العربي أو English أو القسم" oninput="drawMenuItems()"><button class="btn btn-main" onclick="document.getElementById('menuItemForm').classList.toggle('hide')">إضافة صنف</button><button class="btn btn-light" onclick="openSettingsTab('excel')">استيراد Excel</button><button class="btn btn-light" onclick="exportMenuCSV()">تصدير Excel</button></div><div id="menuItemForm" class="premium-form hide"><label>الكود اختياري</label><input id="menuItemCode" placeholder="مثال: CK001"><label>اسم الصنف عربي / English</label><input id="menuItemName" placeholder="مثال: تشيز كيك فراولة / Strawberry Cheesecake"><label>القسم</label><select id="menuItemSection">${chefSections.length?chefSections.map(s=>`<option value="${s.name}">${s.name}</option>`).join(""):`<option value="">بدون قسم</option>`}</select><button class="btn btn-main" onclick="addMenuItem()">حفظ الصنف</button></div><div id="menuItemsContainer" class="premium-table-wrap"></div>`);drawMenuItems();}
async function addMenuItem(){const rawName=document.getElementById("menuItemName").value.trim(); const code=document.getElementById("menuItemCode").value.trim(); const section=document.getElementById("menuItemSection").value; const names=splitArEn(rawName); const nameAr=names.ar,nameEn=names.en; if(!nameAr&&!nameEn)return; if(code&&menuItems.some(i=>String(i.code||"")===code)){showToast("كود الصنف مستخدم","error");return;} const {db,addDoc,collection,serverTimestamp}=window.firebaseDB; await addDoc(collection(db,"menu_items"),{code,nameAr:nameAr||nameEn,nameEn,section,createdAt:serverTimestamp()}); document.getElementById("menuItemName").value=""; document.getElementById("menuItemCode").value=""; showToast("تم إضافة صنف الإنتاج");}
function drawMenuItems(){const box=document.getElementById("menuItemsContainer"); if(!box)return; const search=(document.getElementById("menuSearch")?.value||"").trim().toLowerCase(); const list=sortNewest(menuItems).filter(i=>String(i.nameAr||"").toLowerCase().includes(search)||String(i.nameEn||"").toLowerCase().includes(search)||String(i.code||"").toLowerCase().includes(search)||String(i.section||"").toLowerCase().includes(search)); if(!list.length){box.innerHTML=`<div class="placeholder">لا توجد أصناف إنتاج</div>`;return;} box.innerHTML=`<table class="premium-table"><thead><tr><th>الكود</th><th>العربي</th><th>English</th><th>القسم</th><th>إجراء</th></tr></thead><tbody>${list.map(i=>`<tr><td>${escapeHtml(i.code||"-")}</td><td><b>${escapeHtml(i.nameAr||"")}</b></td><td>${escapeHtml(i.nameEn||"-")}</td><td>${escapeHtml(i.section||"-")}</td><td><button class="mini-danger" onclick="deleteDocByPath('menu_items','${i.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`;}


function renderSettingsExcel(){settingsShell("excel","استيراد Excel",`<div class="excel-grid"><div class="premium-card"><h3>استيراد أصناف المستودع</h3><p class="muted">الأعمدة: الكود | العربي | English | الوحدة</p><input id="warehouseExcelInput" type="file" accept=".xlsx,.xls,.csv"><button class="btn btn-main" onclick="importWarehouseExcel()">استيراد المستودع</button></div><div class="premium-card"><h3>استيراد أصناف المنيو والإنتاج</h3><p class="muted">الأعمدة: الكود | العربي | English | القسم</p><input id="menuExcelInput" type="file" accept=".xlsx,.xls,.csv"><button class="btn btn-main" onclick="importMenuExcel()">استيراد الإنتاج</button></div></div><div class="premium-card"><h3>ملاحظة</h3><p class="muted">الكود اختياري. إذا لم يوجد كود سيتم حفظ الصنف بالاسم فقط. يفضل أن يكون الصف الأول عناوين الأعمدة.</p></div>`);}


function renderSettingsAbout(){settingsShell("about","حول البرنامج",`<div class="about-card"><img src="assets/logo.png" onerror="this.style.display='none'"><h2>Protein & Carb Operations</h2><p>نظام إدارة التشغيل والإنتاج</p><div class="about-info"><div><span>اسم المنشأة</span><b>Protein & Carb</b></div><div><span>الإصدار</span><b>Premium V1.0</b></div><div><span>حالة النظام</span><b>متصل</b></div><div><span>المطور</span><b>Mimoon Mohammad</b></div><div><span>Email</span><b>mimoon7113@gmail.com</b></div></div></div>${settingsStatsCards()}`);}


/* ===== Mobile Premium V1.5 Chef UI Fix ===== */

function pcDateKeyFromMs(ms){
  if(!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pcTodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pcDateKey(obj){
  return pcDateKeyFromMs(getTimeValue(obj));
}

function pcItemName(item){
  return item?.nameAr || item?.name || item?.ar || item?.productName || "";
}

function pcItemEn(item){
  return item?.nameEn || item?.en || "";
}

function pcChefProductionToday(){
  if(!currentChef) return [];
  const key = pcTodayKey();
  return (productionLogs||[]).filter(log=>{
    const sameChef =
      String(log.chefCode||"") === String(currentChef.code||"") ||
      String(log.chefName||"") === String(currentChef.name||"");
    return sameChef && pcDateKey(log) === key;
  });
}

function pcChefWasteToday(){
  if(!currentChef) return [];
  const key = pcTodayKey();
  return (wasteLogs||[]).filter(log=>{
    return String(log.chefName||"") === String(currentChef.name||"") && pcDateKey(log) === key;
  });
}

function pcChefStatus(){
  const logs = pcChefProductionToday();
  if(!logs.length) return {label:"معلق", cls:"pending", qty:0, logs};
  if(logs.some(x=>x.noProduction)) return {label:"لا يوجد إنتاج", cls:"none", qty:0, logs};
  let qty=0;
  logs.forEach(log=>(log.items||[]).forEach(i=>qty+=Number(i.qty||0)));
  return {label:"تم رفع الإنتاج", cls:"done", qty, logs};
}

function pcMenuForChef(){
  const section = currentChef?.section || "";
  return (menuItems||[]).filter(i=>!i.section || i.section===section);
}

function pcWarehouseForChef(){
  const section = currentChef?.section || "";
  return (warehouseItems||[]).filter(i=>!i.section || i.section===section);
}

function pcChefTopBar(title=""){
  const cartQty = (currentCart||[]).reduce((s,i)=>s+Number(i.qty||0),0);
  const status = pcChefStatus();
  return `
    <section class="pc-chef-topbar">
      <button class="pc-top-btn" onclick="smartBack()" aria-label="رجوع">
        <i class="fa-solid fa-arrow-right"></i>
      </button>
      <div class="pc-chef-title">
        <span>${escapeHtml(currentChef?.section || title || "")}</span>
        <b>${escapeHtml(currentChef?.name || "")}</b>
        <small class="${status.cls}">${status.label}</small>
      </div>
      <button class="pc-cart-btn" onclick="renderWarehouseRequest()" aria-label="طلب مستودع">
        <i class="fa-solid fa-cart-shopping"></i>
        ${cartQty ? `<em>${cartQty}</em>` : ""}
      </button>
    </section>
  `;
}

function renderChefDashboard(chef){
  currentChef = chef;
  currentCart = currentCart || [];
  productionDraft = productionDraft || [];
  const status = pcChefStatus();
  const wasteCount = pcChefWasteToday().length;

  pageLayout(chef.name, `
    ${pcChefTopBar()}
    <section class="pc-chef-hero">
      <span>واجهة الشيف</span>
      <h2>${escapeHtml(chef.section||"")}</h2>
      <p>الإنتاج والهدر من هنا، وطلب المستودع من السلة أعلى الصفحة.</p>
    </section>

    <section class="pc-chef-main-actions">
      <button class="pc-chef-big-card pc-production" onclick="renderProduction()">
        <span>إنتاج اليوم</span>
        <b>${status.qty||0}</b>
        <small>${status.label}</small>
      </button>
      <button class="pc-chef-big-card pc-waste" onclick="renderWaste()">
        <span>الهدر والتالف</span>
        <b>${wasteCount}</b>
        <small>تسجيل هدر جديد</small>
      </button>
    </section>

    <section class="pc-chef-panel">
      <div class="pc-panel-head">
        <h3>آخر إنتاج مرفوع اليوم</h3>
        ${status.cls==="pending" ? `<button class="pc-soft-btn" onclick="submitNoProductionToday()">لا يوجد إنتاج</button>` : ""}
      </div>
      ${status.logs.length ? `
        <div class="pc-last-list">
          ${status.logs.slice(0,4).map(log=>`
            <div class="pc-last-row">
              <b>${escapeHtml(log.createdAtText || "اليوم")}</b>
              <small>${log.noProduction ? "لا يوجد إنتاج اليوم" : ((log.items||[]).map(i=>`${escapeHtml(i.name||i.productName||"")} : ${escapeHtml(i.qty||"")}`).join(" • ") || "إنتاج مرفوع")}</small>
            </div>
          `).join("")}
        </div>
      ` : `<div class="pc-empty">لم يتم رفع إنتاج اليوم بعد</div>`}
    </section>

    <section class="pc-chef-bottom">
      <button onclick="renderMyOrders()"><i class="fa-solid fa-clipboard-list"></i><span>طلباتي</span></button>
    </section>
  `,"renderChefs()");
}

function renderProduction(){
  if(!currentChef) return renderChefs();
  const status = pcChefStatus();

  pageLayout("الإنتاج", `
    ${pcChefTopBar("الإنتاج")}
    <section class="pc-chef-panel">
      <div class="pc-panel-head">
        <h3>إنتاج اليوم</h3>
        <span class="pc-chip ${status.cls}">${status.label}</span>
      </div>
      <input id="productionMenuSearch" class="pc-search" placeholder="ابحث عن صنف الإنتاج" oninput="drawProductionMenuList()">
      <div class="pc-note">أصناف الإنتاج الخاصة بقسم: <b>${escapeHtml(currentChef.section||"")}</b></div>
      <div id="productionMenuItemsBox"></div>
    </section>

    <section class="pc-chef-panel">
      <h3>الإنتاج الحالي</h3>
      <div id="productionDraftBox"></div>
      <textarea id="productionNote" placeholder="ملاحظة للإدارة"></textarea>
      <div class="pc-action-row">
        <button class="btn btn-main" onclick="submitProduction()">رفع الإنتاج</button>
        <button class="btn btn-light" onclick="submitNoProductionToday()">لا يوجد إنتاج</button>
      </div>
    </section>

    <div id="lastProductionBox" style="margin-top:16px"></div>
  `,"renderChefDashboard(currentChef)");

  drawProductionMenuList();
  drawProductionDraft();
  drawLastProductionForChef();
}

function drawProductionMenuList(){
  const box=document.getElementById("productionMenuItemsBox");
  if(!box) return;
  const q=(document.getElementById("productionMenuSearch")?.value||"").trim().toLowerCase();
  const list=pcMenuForChef().filter(i=>
    String(pcItemName(i)).toLowerCase().includes(q) ||
    String(pcItemEn(i)).toLowerCase().includes(q) ||
    String(i.code||"").toLowerCase().includes(q)
  ).slice(0,120);

  if(!list.length){
    box.innerHTML=`<div class="pc-empty">لا توجد أصناف إنتاج مرتبطة بهذا القسم</div>`;
    return;
  }

  box.innerHTML=`
    <div class="pc-prod-list">
      ${list.map(i=>`
        <div class="pc-prod-row">
          <div class="pc-prod-info">
            <b>${escapeHtml(pcItemName(i))}</b>
            <small>${escapeHtml([i.code, pcItemEn(i)].filter(Boolean).join(" • "))}</small>
          </div>
          <input id="prodQty_${i.id}" type="number" min="1" inputmode="numeric" placeholder="العدد" onkeydown="if(event.key==='Enter') pcAddProductionItem('${i.id}')">
          <button onclick="pcAddProductionItem('${i.id}')">إضافة</button>
        </div>
      `).join("")}
    </div>
  `;
}

function pcAddProductionItem(id){
  const item=(menuItems||[]).find(x=>x.id===id);
  if(!item) return;
  const input=document.getElementById("prodQty_"+id);
  const qty=Number(input?.value||0);
  if(!qty || qty<=0){
    showToast("اكتب العدد أولاً","error");
    input?.focus();
    return;
  }
  const name=pcItemName(item);
  const existing=productionDraft.find(x=>String(x.itemId||"")===String(id) || String(x.name||"")===String(name));
  if(existing){
    existing.qty=Number(existing.qty||0)+qty;
  }else{
    productionDraft.push({
      itemId:id,
      code:item.code||"",
      name,
      nameEn:pcItemEn(item),
      qty,
      unit:item.unit||"",
      section:item.section||currentChef?.section||""
    });
  }
  if(input) input.value="";
  drawProductionDraft();
  showToast("تمت إضافة الصنف للإنتاج");
}

async function submitNoProductionToday(){
  if(!currentChef) return;
  if(!confirm("تأكيد تسجيل: لا يوجد إنتاج لهذا اليوم؟")) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"production_logs"),{
    chefName:currentChef.name,
    chefCode:currentChef.code||"",
    section:currentChef.section,
    items:[],
    note:"لا يوجد إنتاج اليوم",
    noProduction:true,
    createdAt:serverTimestamp(),
    createdAtMs:Date.now(),
    createdAtText:nowText()
  });
  productionDraft=[];
  showToast("تم تسجيل لا يوجد إنتاج اليوم");
  renderChefDashboard(currentChef);
}

function renderWarehouseRequest(){
  if(!currentChef) return renderChefs();
  currentCart=currentCart||[];

  pageLayout("طلب مستودع", `
    ${pcChefTopBar("طلب مستودع")}
    <section class="pc-warehouse-layout">
      <div class="pc-chef-panel">
        <div class="pc-panel-head">
          <h3>طلب من المستودع</h3>
          <span class="pc-chip">${escapeHtml(currentChef.section||"")}</span>
        </div>
        <input id="warehouseRequestSearch" class="pc-search" placeholder="ابحث عن صنف المستودع" oninput="drawWarehouseRequestItemsMobile()">
        <div id="warehouseRequestItemsBox"></div>
      </div>

      <div class="pc-chef-panel pc-cart-panel">
        <div class="pc-panel-head">
          <h3>السلة</h3>
          <span class="pc-chip">${currentCart.length}</span>
        </div>
        <div id="warehouseCartBox"></div>
        <textarea id="warehouseOrderNote" placeholder="ملاحظة للمستودع"></textarea>
        <button class="btn btn-main pc-wide" onclick="submitWarehouseOrder()">إرسال الطلب</button>
      </div>
    </section>
  `,"renderChefDashboard(currentChef)");

  drawWarehouseRequestItemsMobile();
  drawWarehouseCart();
}

function drawWarehouseRequestItemsMobile(){
  const box=document.getElementById("warehouseRequestItemsBox");
  if(!box) return;
  const q=(document.getElementById("warehouseRequestSearch")?.value||"").trim().toLowerCase();

  const list=pcWarehouseForChef().filter(i=>
    String(i.name||i.nameAr||"").toLowerCase().includes(q) ||
    String(i.nameEn||"").toLowerCase().includes(q) ||
    String(i.code||"").toLowerCase().includes(q)
  ).slice(0,100);

  if(!list.length){
    box.innerHTML=`<div class="pc-empty">لا توجد أصناف مستودع مرتبطة بهذا القسم</div>`;
    return;
  }

  box.innerHTML=`
    <div class="pc-warehouse-list">
      ${list.map(i=>`
        <div class="pc-warehouse-row">
          <div>
            <b>${escapeHtml(i.nameAr||i.name||"")}</b>
            <small>${escapeHtml([i.code, i.nameEn, i.unit].filter(Boolean).join(" • "))}</small>
          </div>
          <button onclick="addWarehouseItemToCart('${i.id}')"><i class="fa-solid fa-plus"></i></button>
        </div>
      `).join("")}
    </div>
  `;
}

function addWarehouseItemToCart(id){
  const item=(warehouseItems||[]).find(i=>i.id===id);
  if(!item) return;
  currentCart=currentCart||[];
  const existing=currentCart.find(x=>String(x.itemId||x.id||"")===String(id));
  if(existing){
    existing.qty=Number(existing.qty||0)+1;
  }else{
    currentCart.push({
      itemId:item.id,
      id:item.id,
      code:item.code||"",
      name:item.nameAr||item.name||"",
      nameEn:item.nameEn||"",
      unit:item.unit||"",
      qty:1
    });
  }
  drawWarehouseCart();
}

function drawWarehouseCart(){
  const box=document.getElementById("warehouseCartBox");
  if(!box) return;
  if(!currentCart.length){
    box.innerHTML=`<div class="pc-empty">السلة فارغة</div>`;
    return;
  }
  box.innerHTML=`
    <div class="pc-cart-list">
      ${currentCart.map((i,idx)=>`
        <div class="pc-cart-row">
          <div>
            <b>${escapeHtml(i.name||"")}</b>
            <small>${escapeHtml([i.code, i.unit].filter(Boolean).join(" • "))}</small>
          </div>
          <input type="number" min="1" inputmode="numeric" value="${escapeHtml(i.qty||1)}" onchange="currentCart[${idx}].qty=Number(this.value||1)">
          <button onclick="currentCart.splice(${idx},1);drawWarehouseCart();"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join("")}
    </div>
  `;
}

async function submitWarehouseOrder(){
  if(!currentChef) return;
  if(!currentCart || !currentCart.length){
    showToast("السلة فارغة","error");
    return;
  }

  const items=currentCart
    .filter(i=>Number(i.qty||0)>0)
    .map(i=>({
      itemId:i.itemId||i.id||"",
      code:i.code||"",
      name:i.name||"",
      nameEn:i.nameEn||"",
      qty:Number(i.qty||0),
      unit:i.unit||""
    }));

  if(!items.length){
    showToast("اكتب الكميات أولاً","error");
    return;
  }

  const note=document.getElementById("warehouseOrderNote")?.value?.trim() || "";
  const {db,addDoc,collection,serverTimestamp,doc,getDoc,setDoc}=window.firebaseDB;

  let orderId = systemSettings.orderCounter || 1001;
  try{
    await setDoc(doc(db,"settings","system"),{orderCounter:orderId+1},{merge:true});
  }catch(e){}

  await addDoc(collection(db,"warehouse_orders"),{
    orderId,
    chefName:currentChef.name,
    chefCode:currentChef.code||"",
    section:currentChef.section,
    items,
    note,
    status:"جديد",
    issueStatus:"بانتظار الصرف",
    createdAt:serverTimestamp(),
    createdAtMs:Date.now(),
    createdAtText:nowText()
  });

  currentCart=[];
  showToast("تم إرسال الطلب للمستودع");
  renderChefDashboard(currentChef);
}


/* ===== Mobile Premium V1.7 Final Workflow ===== */

let pcSelectedProductionItemId = null;
let pcSelectedWarehouseItemId = null;
let pcActiveChefSectionName = "";

function pc17DateKeyFromMs(ms){
  if(!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc17TodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc17DateKey(obj){
  return pc17DateKeyFromMs(getTimeValue(obj));
}

function pc17ItemName(item){
  return item?.nameAr || item?.name || item?.ar || item?.productName || "";
}

function pc17ItemEn(item){
  return item?.nameEn || item?.en || "";
}

function pc17SectionIcon(sectionName){
  const n = String(sectionName || "");
  if(n.includes("حلا") || n.includes("حلويات")) return "fa-cake-candles";
  if(n.includes("مخبوز") || n.includes("فرن")) return "fa-bread-slice";
  if(n.includes("منيو") || n.includes("وجبات")) return "fa-book-open";
  if(n.includes("بوفيه")) return "fa-bowl-food";
  if(n.includes("مشوي") || n.includes("شوي")) return "fa-fire-burner";
  if(n.includes("سلطة")) return "fa-leaf";
  return "fa-utensils";
}

function pc17ChefProductionToday(){
  if(!currentChef) return [];
  const key = pc17TodayKey();
  return (productionLogs||[]).filter(log=>{
    const sameChef =
      String(log.chefCode||"") === String(currentChef.code||"") ||
      String(log.chefName||"") === String(currentChef.name||"");
    return sameChef && pc17DateKey(log) === key;
  });
}

function pc17ChefWasteToday(){
  if(!currentChef) return [];
  const key = pc17TodayKey();
  return (wasteLogs||[]).filter(log=>{
    return String(log.chefName||"") === String(currentChef.name||"") && pc17DateKey(log) === key;
  });
}

function pc17ChefStatus(){
  const logs = pc17ChefProductionToday();
  if(!logs.length) return {label:"معلق", cls:"pending", qty:0, logs};
  if(logs.some(x=>x.noProduction)) return {label:"لا يوجد إنتاج", cls:"none", qty:0, logs};
  let qty=0;
  logs.forEach(log=>(log.items||[]).forEach(i=>qty+=Number(i.qty||0)));
  return {label:"تم رفع الإنتاج", cls:"done", qty, logs};
}

function pc17SectionStats(sectionName){
  const sectionChefs = (chefs||[]).filter(c=>c.section===sectionName);
  const key = pc17TodayKey();
  const logs = (productionLogs||[]).filter(log=>String(log.section||"")===String(sectionName||"") && pc17DateKey(log)===key);
  const doneNames = new Set(logs.map(x=>String(x.chefName||"")));
  const done = doneNames.size;
  const total = sectionChefs.length;
  let label = "يحتاج متابعة", cls = "attention";
  if(!total){ label="لا يوجد شيفات"; cls="muted"; }
  else if(done >= total){ label="جاهز"; cls="ready"; }
  else if(done > 0){ label="قيد العمل"; cls="working"; }
  return {total, done, label, cls};
}

function pc17MenuForChef(){
  const section = currentChef?.section || "";
  return (menuItems||[]).filter(i=>!i.section || i.section===section);
}

function pc17WarehouseForChef(){
  const section = currentChef?.section || "";
  return (warehouseItems||[]).filter(i=>!i.section || i.section===section);
}

function pc17BottomNav(active="chefs"){
  return `
    <nav class="pc17-bottom-nav">
      <button class="${active==="home"?"active":""}" onclick="renderHome()">
        <i class="fa-solid fa-house"></i><span>الرئيسية</span>
      </button>
      <button class="${active==="chefs"?"active":""}" onclick="renderChefs()">
        <i class="fa-solid fa-utensils"></i><span>الشيفات</span>
      </button>
      <button class="${active==="warehouse"?"active":""}" onclick="renderWarehouseGate()">
        <i class="fa-solid fa-boxes-stacked"></i><span>المستودع</span>
      </button>
      <button class="${active==="admin"?"active":""}" onclick="renderAdminGate()">
        <i class="fa-solid fa-chart-line"></i><span>الإدارة</span>
      </button>
    </nav>
  `;
}

function pc17ChefTopBar(title=""){
  const cartQty = (currentCart||[]).reduce((s,i)=>s+Number(i.qty||0),0);
  const status = pc17ChefStatus();
  return `
    <section class="pc17-topbar">
      <button class="pc17-icon-btn" onclick="smartBack()" aria-label="رجوع">
        <i class="fa-solid fa-arrow-right"></i>
      </button>
      <div class="pc17-top-title">
        <span>${escapeHtml(currentChef?.section || title || "")}</span>
        <b>${escapeHtml(currentChef?.name || "")}</b>
        <small class="${status.cls}">${status.label}</small>
      </div>
      <button class="pc17-cart-btn" onclick="renderWarehouseRequest()" aria-label="السلة">
        <i class="fa-solid fa-cart-shopping"></i>
        ${cartQty ? `<em>${cartQty}</em>` : ""}
      </button>
    </section>
  `;
}

function renderChefs(){
  pcActiveChefSectionName = pcActiveChefSectionName || (chefSections[0]?.name || "");
  pageLayout("الشيفات", `
    <section class="pc17-chefs-page">
      <div class="pc17-simple-head">
        <button onclick="renderHome()"><i class="fa-solid fa-arrow-right"></i></button>
        <div>
          <span>Protein & Carb Operations</span>
          <h1>الشيفات</h1>
        </div>
        <button onclick="renderAdminGate()"><i class="fa-solid fa-chart-line"></i></button>
      </div>
      <div id="chefSectionsView"></div>
      <section class="pc17-info-strip">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <b>أقسام الإنتاج</b>
          <span>اختر القسم للدخول وتسجيل الإنتاج اليومي بسرعة</span>
        </div>
      </section>
    </section>
    ${pc17BottomNav("chefs")}
  `,"renderHome()");
  drawChefSectionsView();
}

function drawChefSectionsView(){
  const box=document.getElementById("chefSectionsView");
  if(!box) return;

  if(!chefSections.length){
    box.innerHTML=`<div class="pc17-empty">لا توجد أقسام</div>`;
    return;
  }

  if(!pcActiveChefSectionName || !chefSections.some(s=>s.name===pcActiveChefSectionName)){
    pcActiveChefSectionName = chefSections[0].name;
  }

  const active = chefSections.find(s=>s.name===pcActiveChefSectionName) || chefSections[0];
  const st = pc17SectionStats(active.name);

  box.innerHTML = `
    <section class="pc17-feature-section">
      <div class="pc17-feature-icon">
        <i class="fa-solid ${pc17SectionIcon(active.name)}"></i>
      </div>
      <span class="pc17-feature-label">قسم الإنتاج</span>
      <h2>${escapeHtml(active.name||"")}</h2>
      <div class="pc17-feature-meta">
        <span><i class="fa-solid fa-user-group"></i> ${st.total} شيفات</span>
        <span><i class="fa-solid fa-chart-simple"></i> إنتاج اليوم ${st.done} / ${st.total}</span>
      </div>
      <div class="pc17-section-status ${st.cls}">${st.label}</div>
      <button class="pc17-enter-btn" onclick="renderChefCode('${active.name}')">دخول القسم</button>
    </section>
    <section class="pc17-section-tabs">
      ${chefSections.map(s=>{
        const ss = pc17SectionStats(s.name);
        return `
          <button class="${s.name===active.name?"active":""}" onclick="pcActiveChefSectionName='${s.name}';drawChefSectionsView();">
            <i class="fa-solid ${pc17SectionIcon(s.name)}"></i>
            <span>${escapeHtml(s.name||"")}</span>
            <em class="${ss.cls}"></em>
          </button>
        `;
      }).join("")}
    </section>
  `;
}

function renderChefDashboard(chef){
  currentChef = chef;
  currentCart = currentCart || [];
  productionDraft = productionDraft || [];
  const status = pc17ChefStatus();
  const wasteCount = pc17ChefWasteToday().length;

  pageLayout(chef.name, `
    ${pc17ChefTopBar()}
    <section class="pc17-chef-quick-page">
      <section class="pc17-chef-summary">
        <div>
          <span>واجهة تشغيل</span>
          <h2>${escapeHtml(chef.section || "")}</h2>
          <p>إنتاج، هدر، طلبات — كل شيء بسرعة من الجوال.</p>
        </div>
      </section>
      <section class="pc17-action-circles">
        <button onclick="renderProduction()">
          <div><i class="fa-solid fa-chart-line"></i></div>
          <b>إنتاج</b>
          <small>${status.qty || 0}</small>
        </button>
        <button onclick="renderWaste()">
          <div><i class="fa-solid fa-triangle-exclamation"></i></div>
          <b>هدر</b>
          <small>${wasteCount}</small>
        </button>
        <button onclick="renderMyOrders()">
          <div><i class="fa-solid fa-clipboard-list"></i></div>
          <b>طلباتي</b>
          <small>متابعة</small>
        </button>
      </section>
      <section class="pc17-panel">
        <div class="pc17-panel-head">
          <h3>آخر إنتاج اليوم</h3>
          ${status.cls==="pending" ? `<button onclick="submitNoProductionToday()">لا يوجد إنتاج</button>` : ""}
        </div>
        ${status.logs.length ? `
          <div class="pc17-last-list">
            ${status.logs.slice(0,4).map(log=>`
              <div class="pc17-last-row">
                <b>${escapeHtml(log.createdAtText || "اليوم")}</b>
                <small>${log.noProduction ? "لا يوجد إنتاج اليوم" : ((log.items||[]).map(i=>`${escapeHtml(i.name||i.productName||"")} : ${escapeHtml(i.qty||"")}`).join(" • ") || "إنتاج مرفوع")}</small>
              </div>
            `).join("")}
          </div>
        ` : `<div class="pc17-empty">لم يتم رفع إنتاج اليوم بعد</div>`}
      </section>
    </section>
    ${pc17BottomNav("chefs")}
  `,"renderChefs()");
}

function renderProduction(){
  if(!currentChef) return renderChefs();
  pcSelectedProductionItemId = null;
  const status = pc17ChefStatus();

  pageLayout("الإنتاج", `
    ${pc17ChefTopBar("الإنتاج")}
    <section class="pc17-work-page">
      <section class="pc17-panel">
        <div class="pc17-panel-head">
          <h3>إنتاج اليوم</h3>
          <span class="pc17-chip ${status.cls}">${status.label}</span>
        </div>
        <input id="productionMenuSearch" class="pc17-search" placeholder="بحث عن صنف الإنتاج" oninput="drawProductionMenuList()">
        <div class="pc17-note">تظهر أصناف المنيو الخاصة بقسم: <b>${escapeHtml(currentChef.section||"")}</b></div>
        <div id="productionMenuItemsBox"></div>
      </section>
      <section class="pc17-panel">
        <h3>الإنتاج الحالي</h3>
        <div id="productionDraftBox"></div>
        <textarea id="productionNote" placeholder="ملاحظة للإدارة"></textarea>
        <div class="pc17-action-row">
          <button class="btn btn-main" onclick="submitProduction()">رفع الإنتاج</button>
          <button class="btn btn-light" onclick="submitNoProductionToday()">لا يوجد إنتاج</button>
        </div>
      </section>
      <div id="lastProductionBox"></div>
    </section>
    ${pc17BottomNav("chefs")}
  `,"renderChefDashboard(currentChef)");

  drawProductionMenuList();
  drawProductionDraft();
  drawLastProductionForChef();
}

function drawProductionMenuList(){
  const box=document.getElementById("productionMenuItemsBox");
  if(!box) return;
  const q=(document.getElementById("productionMenuSearch")?.value||"").trim().toLowerCase();
  const list=pc17MenuForChef().filter(i=>
    String(pc17ItemName(i)).toLowerCase().includes(q) ||
    String(pc17ItemEn(i)).toLowerCase().includes(q) ||
    String(i.code||"").toLowerCase().includes(q)
  ).slice(0,120);

  if(!list.length){
    box.innerHTML=`<div class="pc17-empty">لا توجد أصناف إنتاج مرتبطة بهذا القسم</div>`;
    return;
  }

  box.innerHTML=`
    <div class="pc17-select-list">
      ${list.map(i=>`
        <div class="pc17-select-row ${pcSelectedProductionItemId===i.id?"open":""}">
          <button class="pc17-select-main" onclick="pcSelectedProductionItemId='${i.id}';drawProductionMenuList();">
            <div>
              <b>${escapeHtml(pc17ItemName(i))}</b>
              <small>${escapeHtml([i.code, pc17ItemEn(i)].filter(Boolean).join(" • "))}</small>
            </div>
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          ${pcSelectedProductionItemId===i.id ? `
            <div class="pc17-inline-add">
              <input id="prodQty_${i.id}" type="number" min="1" inputmode="numeric" placeholder="العدد" onkeydown="if(event.key==='Enter') pc17AddProduction('${i.id}')">
              <button onclick="pc17AddProduction('${i.id}')">إضافة</button>
            </div>
          ` : ""}
        </div>
      `).join("")}
    </div>
  `;
  if(pcSelectedProductionItemId){
    setTimeout(()=>document.getElementById("prodQty_"+pcSelectedProductionItemId)?.focus(),50);
  }
}

function pc17AddProduction(id){
  const item=(menuItems||[]).find(x=>x.id===id);
  if(!item) return;
  const input=document.getElementById("prodQty_"+id);
  const qty=Number(input?.value||0);
  if(!qty || qty<=0){
    showToast("اكتب العدد أولاً","error");
    input?.focus();
    return;
  }
  const name=pc17ItemName(item);
  const existing=productionDraft.find(x=>String(x.itemId||"")===String(id) || String(x.name||"")===String(name));
  if(existing){
    existing.qty=Number(existing.qty||0)+qty;
  }else{
    productionDraft.push({
      itemId:id,
      code:item.code||"",
      name,
      nameEn:pc17ItemEn(item),
      qty,
      unit:item.unit||"",
      section:item.section||currentChef?.section||""
    });
  }
  pcSelectedProductionItemId = null;
  drawProductionMenuList();
  drawProductionDraft();
  showToast("تمت إضافة الصنف للإنتاج");
}

async function submitNoProductionToday(){
  if(!currentChef) return;
  if(!confirm("تأكيد تسجيل: لا يوجد إنتاج لهذا اليوم؟")) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"production_logs"),{
    chefName:currentChef.name,
    chefCode:currentChef.code||"",
    section:currentChef.section,
    items:[],
    note:"لا يوجد إنتاج اليوم",
    noProduction:true,
    createdAt:serverTimestamp(),
    createdAtMs:Date.now(),
    createdAtText:nowText()
  });
  productionDraft=[];
  showToast("تم تسجيل لا يوجد إنتاج اليوم");
  renderChefDashboard(currentChef);
}

function renderWarehouseRequest(){
  if(!currentChef) return renderChefs();
  currentCart=currentCart||[];
  pcSelectedWarehouseItemId = null;

  pageLayout("طلب مستودع", `
    ${pc17ChefTopBar("طلب مستودع")}
    <section class="pc17-work-page pc17-warehouse-page">
      <section class="pc17-panel">
        <div class="pc17-panel-head">
          <h3>طلب من المستودع</h3>
          <span class="pc17-chip">${escapeHtml(currentChef.section||"")}</span>
        </div>
        <input id="warehouseRequestSearch" class="pc17-search" placeholder="بحث عن صنف المستودع" oninput="drawWarehouseRequestItemsMobile()">
        <div class="pc17-note">تظهر أصناف المستودع الخاصة بالقسم فقط.</div>
        <div id="warehouseRequestItemsBox"></div>
      </section>
      <section class="pc17-panel pc17-cart-panel">
        <div class="pc17-panel-head">
          <h3>السلة</h3>
          <span class="pc17-chip">${currentCart.length}</span>
        </div>
        <div id="warehouseCartBox"></div>
        <textarea id="warehouseOrderNote" placeholder="ملاحظة للمستودع"></textarea>
        <button class="btn btn-main pc17-wide" onclick="submitWarehouseOrder()">إرسال الطلب</button>
      </section>
    </section>
    ${pc17BottomNav("chefs")}
  `,"renderChefDashboard(currentChef)");

  drawWarehouseRequestItemsMobile();
  drawWarehouseCart();
}

function drawWarehouseRequestItemsMobile(){
  const box=document.getElementById("warehouseRequestItemsBox");
  if(!box) return;
  const q=(document.getElementById("warehouseRequestSearch")?.value||"").trim().toLowerCase();
  const list=pc17WarehouseForChef().filter(i=>
    String(i.name||i.nameAr||"").toLowerCase().includes(q) ||
    String(i.nameEn||"").toLowerCase().includes(q) ||
    String(i.code||"").toLowerCase().includes(q)
  ).slice(0,120);

  if(!list.length){
    box.innerHTML=`<div class="pc17-empty">لا توجد أصناف مستودع مرتبطة بهذا القسم</div>`;
    return;
  }

  box.innerHTML=`
    <div class="pc17-select-list">
      ${list.map(i=>`
        <div class="pc17-select-row ${pcSelectedWarehouseItemId===i.id?"open":""}">
          <button class="pc17-select-main" onclick="pcSelectedWarehouseItemId='${i.id}';drawWarehouseRequestItemsMobile();">
            <div>
              <b>${escapeHtml(i.nameAr||i.name||"")}</b>
              <small>${escapeHtml([i.code, i.nameEn, i.unit].filter(Boolean).join(" • "))}</small>
            </div>
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          ${pcSelectedWarehouseItemId===i.id ? `
            <div class="pc17-inline-add">
              <input id="whQty_${i.id}" type="number" min="1" inputmode="numeric" placeholder="الكمية" onkeydown="if(event.key==='Enter') pc17AddWarehouse('${i.id}')">
              <button onclick="pc17AddWarehouse('${i.id}')">إضافة للسلة</button>
            </div>
          ` : ""}
        </div>
      `).join("")}
    </div>
  `;
  if(pcSelectedWarehouseItemId){
    setTimeout(()=>document.getElementById("whQty_"+pcSelectedWarehouseItemId)?.focus(),50);
  }
}

function pc17AddWarehouse(id){
  const item=(warehouseItems||[]).find(i=>i.id===id);
  if(!item) return;
  const input=document.getElementById("whQty_"+id);
  const qty=Number(input?.value||0);
  if(!qty || qty<=0){
    showToast("اكتب الكمية أولاً","error");
    input?.focus();
    return;
  }
  currentCart=currentCart||[];
  const existing=currentCart.find(x=>String(x.itemId||x.id||"")===String(id));
  if(existing){
    existing.qty=Number(existing.qty||0)+qty;
  }else{
    currentCart.push({
      itemId:item.id,
      id:item.id,
      code:item.code||"",
      name:item.nameAr||item.name||"",
      nameEn:item.nameEn||"",
      unit:item.unit||"",
      qty
    });
  }
  pcSelectedWarehouseItemId = null;
  drawWarehouseRequestItemsMobile();
  drawWarehouseCart();
  showToast("تمت إضافة الصنف للسلة");
}

function drawWarehouseCart(){
  const box=document.getElementById("warehouseCartBox");
  if(!box) return;
  if(!currentCart.length){
    box.innerHTML=`<div class="pc17-empty">السلة فارغة</div>`;
    return;
  }
  box.innerHTML=`
    <div class="pc17-cart-list">
      ${currentCart.map((i,idx)=>`
        <div class="pc17-cart-row">
          <div>
            <b>${escapeHtml(i.name||"")}</b>
            <small>${escapeHtml([i.code, i.unit].filter(Boolean).join(" • "))}</small>
          </div>
          <input type="number" min="1" inputmode="numeric" value="${escapeHtml(i.qty||1)}" onchange="currentCart[${idx}].qty=Number(this.value||1)">
          <button onclick="currentCart.splice(${idx},1);drawWarehouseCart();"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join("")}
    </div>
  `;
}

async function submitWarehouseOrder(){
  if(!currentChef) return;
  if(!currentCart || !currentCart.length){
    showToast("السلة فارغة","error");
    return;
  }
  const items=currentCart
    .filter(i=>Number(i.qty||0)>0)
    .map(i=>({
      itemId:i.itemId||i.id||"",
      code:i.code||"",
      name:i.name||"",
      nameEn:i.nameEn||"",
      qty:Number(i.qty||0),
      unit:i.unit||""
    }));
  if(!items.length){
    showToast("اكتب الكميات أولاً","error");
    return;
  }
  const note=document.getElementById("warehouseOrderNote")?.value?.trim() || "";
  const {db,addDoc,collection,serverTimestamp,doc,setDoc}=window.firebaseDB;
  const orderId = systemSettings.orderCounter || 1001;
  try{ await setDoc(doc(db,"settings","system"),{orderCounter:orderId+1},{merge:true}); }catch(e){}
  await addDoc(collection(db,"warehouse_orders"),{
    orderId,
    chefName:currentChef.name,
    chefCode:currentChef.code||"",
    section:currentChef.section,
    items,
    note,
    status:"جديد",
    issueStatus:"بانتظار الصرف",
    createdAt:serverTimestamp(),
    createdAtMs:Date.now(),
    createdAtText:nowText()
  });
  currentCart=[];
  showToast("تم إرسال الطلب للمستودع");
  renderChefDashboard(currentChef);
}


/* ===== Mobile Premium V1.8 Home Nav + Dashboard Fix ===== */

function pc18BottomNav(active="home"){
  return `
    <nav class="pc18-bottom-nav">
      <button class="${active==="home"?"active":""}" onclick="renderHome()"><i class="fa-solid fa-house"></i><span>الرئيسية</span></button>
      <button class="${active==="chefs"?"active":""}" onclick="renderChefs()"><i class="fa-solid fa-utensils"></i><span>الشيفات</span></button>
      <button class="${active==="warehouse"?"active":""}" onclick="renderWarehouseGate()"><i class="fa-solid fa-boxes-stacked"></i><span>المستودع</span></button>
      <button class="${active==="dashboard"?"active":""}" onclick="renderAdminGate()"><i class="fa-solid fa-gauge-high"></i><span>الداشبورد</span></button>
      <button class="${active==="settings"?"active":""}" onclick="renderSettingsGate()"><i class="fa-solid fa-gear"></i><span>الإعدادات</span></button>
    </nav>
  `;
}

function pc17BottomNav(active="home"){
  return pc18BottomNav(active==="admin" ? "dashboard" : active);
}

function pc18TodayKey(){
  if(typeof pc17TodayKey === "function") return pc17TodayKey();
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc18DateKey(x){
  if(typeof pc17DateKey === "function") return pc17DateKey(x);
  const ms = getTimeValue(x);
  if(!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc18ProdQtyToday(){
  const key = pc18TodayKey();
  let qty = 0;
  (productionLogs||[]).filter(x=>pc18DateKey(x)===key).forEach(log=>(log.items||[]).forEach(i=>qty += Number(i.qty||0)));
  return qty;
}

function renderHome(){
  ensureUxStyle();
  currentBackFn = "renderHome()";
  const newOrders = (warehouseOrders||[]).filter(o=>o.status==="جديد").length;
  const prodQty = pc18ProdQtyToday();

  app.innerHTML = `
    <main class="app home-app pc18-home">
      <section class="pc18-home-hero">
        <img src="assets/logo.png" class="pc18-logo" alt="Protein & Carb" onerror="this.onerror=null;this.src='logo.png';">
        <span>مرحباً بك في نظام</span>
        <h1>Protein & Carb Operations</h1>
        <p>${todayDate()}</p>
      </section>

      <section class="pc18-home-summary">
        <div><span>طلبات المستودع</span><b>${newOrders}</b><small>جديد</small></div>
        <div><span>إنتاج اليوم</span><b>${prodQty}</b><small>كمية</small></div>
      </section>

      <section class="pc18-launcher">
        <button onclick="renderChefs()"><div><i class="fa-solid fa-utensils"></i></div><b>الشيفات</b><small>الإنتاج والهدر</small></button>
        <button onclick="renderWarehouseGate()" class="pc18-warehouse-shortcut">${newOrders ? `<em>${newOrders}</em>` : ""}<div><i class="fa-solid fa-boxes-stacked"></i></div><b>المستودع</b><small>طلبات وصرف</small></button>
        <button onclick="renderOperations()"><div><i class="fa-solid fa-industry"></i></div><b>التشغيل</b><small>مهام اليوم</small></button>
        <button onclick="renderCleaning()"><div><i class="fa-solid fa-broom"></i></div><b>النظافة</b><small>متابعة الورديات</small></button>
      </section>
    </main>
    ${pc18BottomNav("home")}
  `;
}

function pc18AdminSummary(){
  const key = pc18TodayKey();
  const todayProd = (productionLogs||[]).filter(x=>pc18DateKey(x)===key);
  const todayWaste = (wasteLogs||[]).filter(x=>pc18DateKey(x)===key);
  const todayCleaning = (cleaningLogs||[]).filter(x=>pc18DateKey(x)===key);
  const todayOps = (operationLogs||[]).filter(x=>pc18DateKey(x)===key);
  const newWh = (warehouseOrders||[]).filter(o=>o.status==="جديد").length;
  let prodQty = 0;
  todayProd.forEach(log=>(log.items||[]).forEach(i=>prodQty += Number(i.qty||0)));
  const pending = (chefs||[]).filter(c=>!todayProd.some(log=>String(log.chefCode||"")===String(c.code||"") || String(log.chefName||"")===String(c.name||""))).length;
  return {newWh, prodQty, waste:todayWaste.length, cleaning:todayCleaning.length, ops:todayOps.length, pending};
}

function pc18TopChefs(limit=4){
  const map = {};
  (productionLogs||[]).forEach(log=>{
    const n = log.chefName || "غير محدد";
    if(!map[n]) map[n]={name:n, qty:0};
    (log.items||[]).forEach(i=>map[n].qty += Number(i.qty||0));
  });
  return Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,limit);
}

function pc18TopItems(limit=4){
  const map = {};
  (productionLogs||[]).forEach(log=>(log.items||[]).forEach(i=>{
    const n = i.name || i.productName || "غير محدد";
    if(!map[n]) map[n]={name:n, qty:0};
    map[n].qty += Number(i.qty||0);
  }));
  return Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,limit);
}

function pc18Activities(limit=5){
  const rows=[];
  (productionLogs||[]).forEach(x=>rows.push({t:getTimeValue(x),icon:"fa-chart-line",title:`${x.chefName||"شيف"} رفع إنتاج`,meta:x.createdAtText||""}));
  (warehouseOrders||[]).forEach(x=>rows.push({t:getTimeValue(x),icon:"fa-boxes-stacked",title:`طلب مستودع ${x.status||""}`,meta:`${x.chefName||""} ${x.createdAtText||""}`}));
  (wasteLogs||[]).forEach(x=>rows.push({t:getTimeValue(x),icon:"fa-triangle-exclamation",title:"تسجيل هدر",meta:`${x.chefName||""} ${x.createdAtText||""}`}));
  return rows.sort((a,b)=>b.t-a.t).slice(0,limit);
}

function renderAdminMobileDashboard(){
  const s = pc18AdminSummary(), topChefs=pc18TopChefs(), topItems=pc18TopItems(), acts=pc18Activities();
  pageLayout("الداشبورد", `
    <section class="pc18-dashboard">
      <div class="pc18-dash-head">
        <button onclick="renderHome()"><i class="fa-solid fa-arrow-right"></i></button>
        <div><span>الإدارة</span><h1>Dashboard</h1><small>${todayDate()}</small></div>
        <button onclick="renderAdminPDF()"><i class="fa-solid fa-file-pdf"></i></button>
      </div>
      <section class="pc18-dash-hero"><span>ملخص التشغيل</span><h2>وضع اليوم</h2><p>أهم مؤشرات المطعم في شاشة واحدة.</p></section>
      <section class="pc18-kpi-grid">
        <div><span>طلبات المستودع</span><b>${s.newWh}</b><small>جديد</small></div>
        <div><span>إنتاج اليوم</span><b>${s.prodQty}</b><small>كمية</small></div>
        <div><span>الهدر</span><b>${s.waste}</b><small>عملية</small></div>
        <div><span>النظافة</span><b>${s.cleaning}</b><small>تقرير</small></div>
        <div><span>التشغيل</span><b>${s.ops}</b><small>تقرير</small></div>
        <div class="${s.pending ? "warn" : ""}"><span>إنتاج معلق</span><b>${s.pending}</b><small>شيف</small></div>
      </section>
      <section class="pc18-dash-card"><h3>أفضل الشيفات</h3>${topChefs.length ? topChefs.map((x,i)=>`<div class="pc18-rank"><em>${i+1}</em><b>${escapeHtml(x.name)}</b><strong>${x.qty}</strong></div>`).join("") : `<div class="pc17-empty">لا توجد بيانات</div>`}</section>
      <section class="pc18-dash-card"><h3>أكثر الأصناف إنتاجاً</h3>${topItems.length ? topItems.map((x,i)=>`<div class="pc18-rank"><em>${i+1}</em><b>${escapeHtml(x.name)}</b><strong>${x.qty}</strong></div>`).join("") : `<div class="pc17-empty">لا توجد بيانات</div>`}</section>
      <section class="pc18-dash-card"><h3>آخر الأنشطة</h3>${acts.length ? acts.map(a=>`<div class="pc18-activity"><i class="fa-solid ${a.icon}"></i><div><b>${escapeHtml(a.title)}</b><small>${escapeHtml(a.meta)}</small></div></div>`).join("") : `<div class="pc17-empty">لا توجد أنشطة</div>`}</section>
      <section class="pc18-dash-shortcuts">
        <button onclick="renderAdminWarehouse()"><i class="fa-solid fa-boxes-stacked"></i><span>المستودع</span></button>
        <button onclick="renderAdminProduction()"><i class="fa-solid fa-chart-line"></i><span>الإنتاج</span></button>
        <button onclick="renderAdminWaste()"><i class="fa-solid fa-triangle-exclamation"></i><span>الهدر</span></button>
        <button onclick="renderAdminPDF()"><i class="fa-solid fa-file-pdf"></i><span>PDF</span></button>
      </section>
    </section>
    ${pc18BottomNav("dashboard")}
  `,"renderHome()");
}

const pc18OldRenderAdmin = typeof renderAdmin === "function" ? renderAdmin : null;
function renderAdmin(){
  if(window.innerWidth <= 900) return renderAdminMobileDashboard();
  if(pc18OldRenderAdmin) return pc18OldRenderAdmin();
  return renderAdminMobileDashboard();
}
