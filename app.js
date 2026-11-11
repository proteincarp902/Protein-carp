

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

var chatMessages = [], branches = [], currentBranch = "main", settingsBranch = "main", pcScope = "all", pcRaw = {};
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
  if(document.querySelector(".pc60-tabs,.pc60-login")) return;
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

function getCleaningBnText(text){return cleaningBn[text] || "";}

function notifySystem(message,type="warn"){
  if(document.querySelector(".pc60-tabs,.pc60-login")) return;
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

let pcNotifyArmed = false, pcArmTimer = null;
function pcNotifyTouch(){
  if(pcNotifyArmed) return;
  clearTimeout(pcArmTimer);
  pcArmTimer = setTimeout(()=>{ pcNotifyArmed = true; lastSystemCounts = null; try{ checkSystemNotifications(); }catch(e){} }, 1500);
}

function checkSystemNotifications(){
  if(!pcNotifyArmed) return;
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

document.addEventListener("click",function(e){
  if(!e.target.closest(".admin-menu-wrap")){
    closeAdminMenus();
  }
});

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
  if(!(await pcConfirm("سيتم حذف العملية المطبوعة فقط. هل أنت متأكد؟",{danger:true}))) return;
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
  if(!(await pcConfirm(`سيتم حذف ${list.length} عملية مطبوعة فقط. هل أنت متأكد؟`,{danger:true}))) return;
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
  const hasOwnHead = /pc17-simple-head|pc17-topbar|pc18-dash-head|pc19-warehouse-head|pc21-admin-head|pc27-head|pc60-bar/.test(content);
  app.innerHTML = `
    <main class="app${hasOwnHead ? " has-own-head" : ""}">
      ${hasOwnHead ? "" : `<header class="page-head">
        <button class="pc50-back" onclick="smartBack()" aria-label="رجوع"><i class="fa-solid fa-arrow-right"></i></button>
        <h2>${title}</h2>
        <span class="pc50-head-space"></span>
      </header>`}
      ${content}
    </main>
  `;
  try{ window.scrollTo(0,0); }catch(e){}
}

var pcRefreshTimer = null;
function pcQueueRefresh(){
  if(pcRefreshTimer) return;
  pcRefreshTimer = setTimeout(()=>{ pcRefreshTimer = null; refreshViews(); }, 120);
}

async function initCloud(){
  const { db, doc, getDoc, setDoc, collection, onSnapshot } = await waitForFirebase();

  const settingsRef = doc(db,"settings","system");
  getDoc(settingsRef).then(snap=>{ if(!snap.exists()) return setDoc(settingsRef,systemSettings); }).catch(()=>{});
  onSnapshot(settingsRef,s=>{
    if(s.exists()) systemSettings = {...systemSettings,...s.data()};
  });

  const listen = (name, setter) => {
    onSnapshot(collection(db,name), snap=>{
      const arr=[];
      snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      setter(arr);
      pcLoaded.add(name);
      pcCacheSoon();
      pcNotifyTouch();
      pcQueueRefresh();
    });
  };

  const plain = (key,set)=>v=>{ pcRaw[key] = v; set(v); };
  const scoped = (key,set)=>v=>{ pcRaw[key] = v; set(pcInScope(v)); if(key==="chefs") pcPurgeChefCodes(v); };

  listen("chef_sections", scoped("chefSections", v=>chefSections=v));
  listen("chefs", scoped("chefs", v=>chefs=v));
  listen("warehouse_items", plain("warehouseItems", v=>warehouseItems=v));
  listen("menu_items", plain("menuItems", v=>menuItems=v));
  listen("warehouse_orders", scoped("warehouseOrders", v=>warehouseOrders=v));
  listen("dismissed_alerts", v=>dismissedAlerts=v);
  listen("cleaning_tasks", scoped("cleaningTasks", v=>cleaningTasks=v));
  listen("cleaning_logs", scoped("cleaningLogs", v=>cleaningLogs=v));
  listen("operation_tasks", scoped("operationTasks", v=>operationTasks=v));
  listen("operation_logs", scoped("operationLogs", v=>operationLogs=v));
  listen("production_logs", scoped("productionLogs", v=>productionLogs=v));
  listen("waste_logs", scoped("wasteLogs", v=>wasteLogs=v));
  listen("warehouse_staff", v=>warehouseStaff=v);
  listen("internal_destinations", v=>internalDestinations=v);
  listen("internal_issues", scoped("internalIssues", v=>internalIssues=v));
  listen("chat_messages", v=>chatMessages=v);
  listen("branches", plain("branches", v=>branches=v));
  listen("branch_stock_moves", plain("branchStockMoves", v=>branchStockMoves=v));
}

function pcBaseRefreshViews(){
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
  if(document.getElementById("pcStoreSecBox")) pcDrawStoreSections();
  if(document.getElementById("pcStoreBox")){
    if(document.activeElement && document.activeElement.id === "pcStoreSearch") pcStoreDrawBalRows(); else pcDrawStore();
  }
  if(document.getElementById("internalIssueAdminBox")) drawInternalIssueAdmin();
  if(document.getElementById("warehouseStaffBox")) drawWarehouseStaff();
  if(document.getElementById("internalDestinationsBox")) drawInternalDestinations();
}

function renderSettingsSections(){pcSettingsEnter();settingsShell("sections","إدارة الأقسام",`${pcSettingsBar("renderSettingsSections")}<div class="premium-toolbar pc95-bar"><input id="sectionSearch" placeholder="بحث عن قسم" oninput="drawSections()"><button class="btn btn-main" onclick="pc95SectionEdit()">إضافة قسم</button></div><div id="sectionsContainer"></div>`);drawSections();}


function drawSections(){
  const box=document.getElementById("sectionsContainer"); if(!box) return;
  const q=(document.getElementById("sectionSearch")?.value||"").trim().toLowerCase();
  const list=chefSections.filter(s=>(s.name||"").toLowerCase().includes(q));
  box.innerHTML = list.length ? `<section class="pc94-list">${list.map(s=>`
    <button type="button" class="pc94-row" data-id="${escapeHtml(s.id)}" onclick="pc95SectionEdit(this.dataset.id)">
      <span class="pc94-emo">${escapeHtml(s.icon||"🍽️")}</span>
      <span class="pc94-txt"><b>${escapeHtml(s.name||"")}</b><small>${pc95SectionBranches(s)}</small></span>
      <i class="fa-solid fa-chevron-left pc94-chev"></i></button>`).join("")}</section>` : `<div class="placeholder">لا توجد أقسام</div>`;
}

function renderSettingsChefs(){pcSettingsEnter();settingsShell("chefs","إدارة الشيفات",`${pcSettingsBar("renderSettingsChefs")}<div class="premium-toolbar"><input id="chefSettingsSearch" placeholder="بحث باسم الشيف أو القسم" oninput="drawChefs()"><button class="btn btn-main" onclick="document.getElementById('chefForm').classList.toggle('hide')">إضافة شيف</button></div><div id="chefForm" class="premium-form hide"><label>اسم الشيف</label><input id="chefName" placeholder="مثال: أحمد"><label>الفرع</label><select id="chefBranch" onchange="drawChefSectionOptions()"></select><label>القسم</label><select id="chefSection"></select><button class="btn btn-main" onclick="addChef()">حفظ الشيف</button></div><div id="chefsContainer" class="premium-table-wrap"></div>`);drawChefSectionOptions();drawChefs();}

function drawChefSectionOptions(){
  const bsel=document.getElementById("chefBranch");
  if(bsel && !bsel.options.length){
    bsel.innerHTML = pcActiveBranches().map(b=>`<option value="${escapeHtml(b.id)}">${escapeHtml(b.name||"")}</option>`).join("");
    bsel.value = pcActiveBranches().some(b=>b.id===settingsBranch) ? settingsBranch : (pcActiveBranches()[0]?.id || "main");
  }
  const select=document.getElementById("chefSection");
  if(!select) return;
  const branchId = bsel?.value || settingsBranch;
  const names = [...new Set((pcRaw.chefSections||chefSections||[]).filter(s=>pcBranchOf(s)===branchId).map(s=>String(s.name||"").trim()).filter(Boolean))];
  select.innerHTML = names.length ? names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("") : `<option value="">لا توجد أقسام في هذا الفرع</option>`;
}

async function addChef(){
  const name=document.getElementById("chefName").value.trim();
  const section=document.getElementById("chefSection").value;
  const branchId=document.getElementById("chefBranch")?.value || settingsBranch;
  if(!name){ showToast("اكتب اسم الشيف","error"); return; }
  if(!branchId){ showToast("اختر الفرع","error"); return; }
  if(!section){ showToast("اختر القسم — لا توجد أقسام في هذا الفرع","error"); return; }
  if((pcRaw.chefs||chefs).some(c=>c.name===name && c.section===section && pcBranchOf(c)===branchId)){
    showToast("الاسم موجود في هذا القسم","error");
    return;
  }
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"chefs"),{name,section,branchId,createdAt:serverTimestamp()});
  document.getElementById("chefName").value="";
  showToast(`تمت إضافة ${name} إلى ${section} · ${pcBranchName(branchId)}`);
}

function drawChefs(){const box=document.getElementById("chefsContainer"); if(!box)return; const q=(document.getElementById("chefSettingsSearch")?.value||"").trim().toLowerCase(); const list=chefs.filter(c=>String(c.name||"").toLowerCase().includes(q)||String(c.section||"").toLowerCase().includes(q)); box.innerHTML=list.length?`<table class="premium-table"><thead><tr><th>الشيف</th><th>الفرع</th><th>القسم</th><th>إجراء</th></tr></thead><tbody>${list.map(c=>`<tr><td><b>${escapeHtml(c.name||"")}</b></td><td>${escapeHtml(pcBranchName(pcBranchOf(c)))}</td><td>${escapeHtml(c.section||"")}</td><td><button class="mini-danger" onclick="deleteDocByPath('chefs','${c.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`:`<div class="placeholder">لا يوجد شيفات</div>`;}

function renderSettingsWarehouseItems(){settingsShell("warehouse","أصناف المستودع",`<div class="premium-toolbar"><input id="warehouseSearch" placeholder="بحث بالكود أو العربي أو English" oninput="drawWarehouseItems()"><button class="btn btn-main" onclick="document.getElementById('warehouseItemForm').classList.toggle('hide')">إضافة صنف</button><button class="btn btn-light" onclick="openSettingsTab('excel')">استيراد Excel</button><button class="btn btn-light" onclick="exportWarehouseCSV()">تصدير Excel</button></div><div id="warehouseItemForm" class="premium-form hide"><label>الكود اختياري</label><input id="warehouseItemCode" placeholder="مثال: 4016"><label>اسم الصنف عربي / English</label><input id="warehouseItemName" placeholder="مثال: بصل برياني / Onion Biryani"><label>الوحدة</label><select id="warehouseItemUnit"><option>كجم</option><option>جرام</option><option>لتر</option><option>مل</option><option>حبة</option><option>علبة</option><option>كيس</option><option>كرتون</option><option>صندوق</option><option>ربطة</option></select><label>التصنيف (اختياري، يُخمَّن تلقائياً إن تُرك فارغاً)</label><input id="warehouseItemCategory" list="warehouseCatList" placeholder="مثال: لحوم ودواجن"><label>الكمية المتاحة (اختياري، يظهر للمستودع ويُخصم عند الصرف)</label><input id="warehouseItemStock" type="number" min="0" step="any" inputmode="decimal" placeholder="اتركها فارغة إن لم تريد التتبع"><datalist id="warehouseCatList">${PC70_CATS.map(c=>`<option value="${c[0]}">`).join("")}</datalist><button class="btn btn-main" onclick="addWarehouseItem()">حفظ الصنف</button></div><div id="warehouseItemsContainer" class="premium-table-wrap"></div>`);drawWarehouseItems();}

async function addWarehouseItem(){const rawName=document.getElementById("warehouseItemName").value.trim(); const code=document.getElementById("warehouseItemCode").value.trim(); const unit=document.getElementById("warehouseItemUnit").value; const category=(document.getElementById("warehouseItemCategory")?.value||"").trim(); const stockRaw=(document.getElementById("warehouseItemStock")?.value||"").trim(); const stockQty=stockRaw!==""&&isFinite(Number(stockRaw))?Number(stockRaw):null; const names=splitArEn(rawName); const nameAr=names.ar,nameEn=names.en; if(!nameAr&&!nameEn)return; if(code&&warehouseItems.some(i=>String(i.code||"")===code)){showToast("كود الصنف مستخدم","error");return;} const {db,addDoc,collection,serverTimestamp}=window.firebaseDB; await addDoc(collection(db,"warehouse_items"),{name:nameAr||nameEn,nameAr:nameAr||nameEn,nameEn,code,unit,category,...(stockQty!==null?{stockQty}:{}),createdAt:serverTimestamp()}); document.getElementById("warehouseItemName").value=""; document.getElementById("warehouseItemCode").value=""; showToast("تم إضافة الصنف");}

function renderSettingsCleaning(){pcSettingsEnter();settingsShell("cleaning","عناصر النظافة",`${pcSettingsBar("renderSettingsCleaning")}<div class="premium-toolbar"><input id="cleaningTaskSearch" placeholder="بحث عن مهمة" oninput="drawCleaningTasks()"><button class="btn btn-main" onclick="document.getElementById('cleaningTaskForm').classList.toggle('hide')">إضافة مهمة</button></div><div id="cleaningTaskForm" class="premium-form hide"><label>اسم المهمة بالعربي</label><input id="cleaningTaskName" placeholder="مثال: دورات المياه"><label>ترجمة المهمة بالبنغالي</label><input id="cleaningTaskBn" placeholder="مثال: টয়লেট পরিষ্কার"><label>الورديات</label><label><input id="cleanMorning" type="checkbox" checked> صباح</label><label><input id="cleanAfternoon" type="checkbox" checked> ظهر</label><label><input id="cleanNight" type="checkbox" checked> ليل</label><button class="btn btn-main" onclick="addCleaningTask()">حفظ المهمة</button></div><div id="cleaningTasksContainer" class="premium-table-wrap"></div>`);drawCleaningTasks();}

async function addCleaningTask(){
  const nameAr=document.getElementById("cleaningTaskName").value.trim();
  const nameBn=document.getElementById("cleaningTaskBn")?.value.trim() || "";
  if(!nameAr) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"cleaning_tasks"),{
    branchId:settingsBranch,
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

function renderSettingsOperations(){pcSettingsEnter();settingsShell("operations","مهام التشغيل",`${pcSettingsBar("renderSettingsOperations")}<div class="premium-toolbar"><input id="operationTaskSearch" placeholder="بحث عن مهمة" oninput="drawOperationTasks()"><button class="btn btn-main" onclick="document.getElementById('operationTaskForm').classList.toggle('hide')">إضافة مهمة</button></div><div id="operationTaskForm" class="premium-form hide"><label>اسم المهمة</label><input id="operationTaskName" placeholder="مثال: تشغيل الشوايات"><label>الفترة / الوقت</label><input id="operationTaskPeriod" placeholder="مثال: قبل الافتتاح أو 12 ظهر أو قبل الإغلاق"><button class="btn btn-main" onclick="addOperationTask()">حفظ المهمة</button></div><div id="operationTasksContainer" class="premium-table-wrap"></div>`);drawOperationTasks();}

async function addOperationTask(){
  const name=document.getElementById("operationTaskName").value.trim();
  const period=document.getElementById("operationTaskPeriod").value.trim();
  if(!name||!period) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"operation_tasks"),{name,period,branchId:settingsBranch,createdAt:serverTimestamp()});
  document.getElementById("operationTaskName").value="";
  document.getElementById("operationTaskPeriod").value="";
}

function drawOperationTasks(){const box=document.getElementById("operationTasksContainer"); if(!box)return; const q=(document.getElementById("operationTaskSearch")?.value||"").trim().toLowerCase(); const list=operationTasks.filter(t=>String(t.name||"").toLowerCase().includes(q)||String(t.period||"").toLowerCase().includes(q)); if(!list.length){box.innerHTML=`<div class="placeholder">لا توجد مهام تشغيل</div>`;return;} box.innerHTML=`<table class="premium-table"><thead><tr><th>المهمة</th><th>الفترة</th><th>إجراء</th></tr></thead><tbody>${list.map(t=>`<tr><td><b>${escapeHtml(t.name||"")}</b></td><td>${escapeHtml(t.period||"")}</td><td><button class="mini-danger" onclick="deleteDocByPath('operation_tasks','${t.id}')">حذف</button></td></tr>`).join("")}</tbody></table>`;}

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

async function submitProductionCore(){
  if(!productionDraft.length || !currentChef) return;

  const note=document.getElementById("productionNote")?.value.trim() || "";
  const timeMs=Date.now();

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"production_logs"),{
    chefName:currentChef.name,
    chefId:currentChef.id,
    section:currentChef.section,
    branchId:currentBranch,
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
    .filter(l=>pcMine(l) && (l.expiresAtMs||0)>now)
    .sort((a,b)=>(b.timeMs||0)-(a.timeMs||0))[0];
}

function formatRemaining(ms){
  if(ms<=0) return "انتهى";
  const h=Math.floor(ms/3600000);
  const m=Math.floor((ms%3600000)/60000);
  const s=Math.floor((ms%60000)/1000);
  return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
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

function renderWarehouseMenu(){
  pageLayout("المستودع", `
    <section class="grid">
      <div class="card" onclick="renderWarehouseOrders()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">طلبات الشيفات</div></div>
      <div class="card" onclick="renderInternalIssue()"><div class="icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div><div class="card-title">صرف داخلي</div></div>
    </section>
  `,"renderGateway()");
}

function renderWarehouseOrders(){
  pageLayout("طلبات الشيفات", `<div id="warehouseOrdersBox" class="grid"></div>`,"renderWarehouseMenu()");
  drawWarehouseOrders();
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
      ${pc85ReviewHtml(order)}

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

async function submitCleaning(shift){
  const checks=Array.from(document.querySelectorAll(".cleanTaskCheck"));
  const doneIds=checks.filter(c=>c.checked).map(c=>c.value);
  const tasks=cleaningTasks.filter(t=>t[shift]);

  const entries=tasks.map(t=>({taskId:t.id,nameAr:t.nameAr,done:doneIds.includes(t.id)}));

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"cleaning_logs"),{
    branchId:currentBranch,
    shift,entries,createdAtText:nowText(),timeMs:Date.now(),createdAt:serverTimestamp()
  });

  showToast("تم حفظ النظافة");
  renderCleaning();
}

function getOperationPeriods(){
  return [...new Set(operationTasks.map(t=>t.period).filter(Boolean))];
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
    branchId:currentBranch,
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

function renderAdminWaste(){
  pageLayout("تقرير التالف والهدر", `<div id="wasteAdminBox"></div>`,"renderAdmin()");
  drawWasteAdmin();
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

async function deleteDocByPath(collectionName,id){
  const {db,doc,deleteDoc}=window.firebaseDB;
  await deleteDoc(doc(db,collectionName,id));
}

function normalizeText(v){return String(v??"").trim();}
function splitArEn(value){const raw=normalizeText(value); if(!raw)return{ar:"",en:""}; const p=raw.split("/").map(x=>x.trim()).filter(Boolean); return p.length>=2?{ar:p[0],en:p.slice(1).join(" / ")}:{ar:raw,en:""};}
function itemDisplayName(i){return i.nameAr||i.name||i.ar||"";}
function itemDisplayEn(i){return i.nameEn||i.en||"";}
function itemCode(i){return i.code||"";}
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

function setSettingsTab(tab){localStorage.setItem("pcSettingsTab",tab);}
function settingsStatsCards(){return `<div class="settings-stats"><div><span>الشيفات</span><b>${chefs.length}</b></div><div><span>أصناف المستودع</span><b>${warehouseItems.length}</b></div><div><span>أصناف الإنتاج</span><b>${menuItems.length}</b></div><div><span>الأقسام</span><b>${chefSections.length}</b></div></div>`;}

function csvEscape(v){const s=String(v??""); return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function downloadTextFile(filename,text){const blob=new Blob([text],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);}
function exportWarehouseCSV(){const rows=[["code","arabic","english","unit","category","quantity"],...warehouseItems.map(i=>[itemCode(i),itemDisplayName(i),itemDisplayEn(i),i.unit||"",i.category||"",pc86Stock(i)===null?"":pc86Stock(i)])]; downloadTextFile("warehouse-items.csv",rows.map(r=>r.map(csvEscape).join(",")).join("\n"));}
function exportMenuCSV(){const rows=[["code","arabic","english","section"],...menuItems.map(i=>[itemCode(i),i.nameAr||"",i.nameEn||"",i.section||""])]; downloadTextFile("menu-items.csv",rows.map(r=>r.map(csvEscape).join(",")).join("\n"));}
function parseExcelRows(file){return new Promise((resolve,reject)=>{if(!window.XLSX){reject(new Error("مكتبة Excel غير محملة"));return;} const reader=new FileReader(); reader.onload=e=>{try{const data=new Uint8Array(e.target.result); const wb=XLSX.read(data,{type:"array"}); const sheet=wb.Sheets[wb.SheetNames[0]]; resolve(XLSX.utils.sheet_to_json(sheet,{header:1,defval:""}));}catch(err){reject(err)}}; reader.onerror=reject; reader.readAsArrayBuffer(file);});}
function detectExcelColumns(header){const n=header.map(x=>String(x||"").trim().toLowerCase()); const find=keys=>n.findIndex(h=>keys.some(k=>h.includes(k))); return{code:find(["code","كود","الكود","رمز"]),ar:find(["arabic","عربي","العربي","اسم عربي","الاسم العربي"]),en:find(["english","انجليزي","الإنجليزي","الانجليزي","اسم انجليزي","الاسم الإنجليزي"]),unit:find(["unit","وحدة","الوحدة"]),section:find(["section","قسم","القسم"]),category:find(["category","تصنيف","التصنيف","الفئة","فئة"]),stock:find(["quantity","stock","الكمية","كمية","المتوفر","المتاح","الرصيد"])};}
function getExcelCell(row,idx){return idx>=0?normalizeText(row[idx]):"";}

function renderSettingsMenuItems(){settingsShell("menu","أصناف المنيو والإنتاج",`<div class="premium-toolbar"><input id="menuSearch" placeholder="بحث بالكود أو العربي أو English أو القسم" oninput="drawMenuItems()"><button class="btn btn-main" onclick="document.getElementById('menuItemForm').classList.toggle('hide')">إضافة صنف</button><button class="btn btn-light" onclick="openSettingsTab('excel')">استيراد Excel</button><button class="btn btn-light" onclick="exportMenuCSV()">تصدير Excel</button></div><div id="menuItemForm" class="premium-form hide"><label>الكود اختياري</label><input id="menuItemCode" placeholder="مثال: CK001"><label>اسم الصنف عربي / English</label><input id="menuItemName" placeholder="مثال: تشيز كيك فراولة / Strawberry Cheesecake"><label>القسم</label><select id="menuItemSection">${chefSections.length?chefSections.map(s=>`<option value="${s.name}">${s.name}</option>`).join(""):`<option value="">بدون قسم</option>`}</select><button class="btn btn-main" onclick="addMenuItem()">حفظ الصنف</button></div><div id="menuItemsContainer" class="premium-table-wrap"></div>`);drawMenuItems();}
async function addMenuItem(){const rawName=document.getElementById("menuItemName").value.trim(); const code=document.getElementById("menuItemCode").value.trim(); const section=document.getElementById("menuItemSection").value; const names=splitArEn(rawName); const nameAr=names.ar,nameEn=names.en; if(!nameAr&&!nameEn)return; if(code&&menuItems.some(i=>String(i.code||"")===code)){showToast("كود الصنف مستخدم","error");return;} const {db,addDoc,collection,serverTimestamp}=window.firebaseDB; await addDoc(collection(db,"menu_items"),{code,nameAr:nameAr||nameEn,nameEn,section,createdAt:serverTimestamp()}); document.getElementById("menuItemName").value=""; document.getElementById("menuItemCode").value=""; showToast("تم إضافة صنف الإنتاج");}

function renderSettingsAbout(){settingsShell("about","حول البرنامج",`<div class="about-card"><img src="assets/logo.png" onerror="this.style.display='none'"><h2>Protein & Carb Operations</h2><p>نظام إدارة التشغيل والإنتاج</p><div class="about-info"><div><span>اسم المنشأة</span><b>Protein & Carb</b></div><div><span>الإصدار</span><b>Premium V1.0</b></div><div><span>حالة النظام</span><b>متصل</b></div><div><span>المطور</span><b>Mimoon Mohammad</b></div><div><span>Email</span><b>mimoon7113@gmail.com</b></div></div></div>${settingsStatsCards()}`);}

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
    const sameChef = pcMine(log);
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
  const sectionChefs = (chefs||[]).filter(c=>c.section===sectionName && pcBranchOf(c)===currentBranch);
  const key = pc17TodayKey();
  const logs = (productionLogs||[]).filter(log=>String(log.section||"")===String(sectionName||"") && pcBranchOf(log)===currentBranch && pc17DateKey(log)===key);
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

async function submitNoProductionToday(){
  if(!currentChef) return;
  if(!(await pcConfirm("تأكيد تسجيل: لا يوجد إنتاج لهذا اليوم؟",{title:"لا يوجد إنتاج اليوم",okText:"تسجيل"}))) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"production_logs"),{
    chefName:currentChef.name,
    chefId:currentChef.id,
    section:currentChef.section,
    branchId:currentBranch,
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

async function submitWarehouseOrderCore(){
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
      unit:i.unit||"",
      baseUnit:i.baseUnit||"",
      qtyBase:(i.qtyBase==null?null:i.qtyBase),
      ...(i.supplyRequested ? {supplyRequested:true} : {})
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
    chefId:currentChef.id,
    section:currentChef.section,
    branchId:currentBranch,
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
  if(pcStoreBackFromOrder()) return;
  renderChefDashboard(currentChef);
}

const pc18OldRenderAdmin = typeof renderAdmin === "function" ? renderAdmin : null;

let pc19WarehouseTab = "new";
let pc19OpenWarehouseOrderId = null;
let pc19IssueDraft = {};

function pc19OrderTime(o){
  return o.createdAtText || o.issuedAtText || o.archivedAtText || "";
}

function pc19OrderNo(o){
  return o.orderId || o.id || "-";
}

function pc19OrderStatus(o){
  return o.issueStatus || o.status || "جديد";
}

function pc19WarehouseCounts(){
  const list = warehouseOrders || [];
  return {
    newOrders: list.filter(o=>o.status==="جديد" || !o.status).length,
    inProgress: list.filter(o=>String(o.issueStatus||"").includes("قيد") || o.status==="قيد الصرف").length,
    doneToday: list.filter(o=>o.status==="تم الاستلام" || o.status==="تم الصرف" || String(o.issueStatus||"").includes("تم")).length,
    internal: (internalIssues||[]).length
  };
}

function pc19FilteredOrders(){
  const list = sortNewest((warehouseOrders||[]).filter(o=>o.status!=="محذوف"));
  if(pc19WarehouseTab==="new") return list.filter(o=>o.status==="جديد" || !o.status);
  if(pc19WarehouseTab==="progress") return list.filter(o=>String(o.issueStatus||"").includes("قيد") || o.status==="قيد الصرف");
  if(pc19WarehouseTab==="done") return list.filter(o=>o.status==="تم الاستلام" || o.status==="تم الصرف" || String(o.issueStatus||"").includes("تم"));
  return list;
}

function renderWarehouse(){
  pc19OpenWarehouseOrderId = null;
  const c = pc19WarehouseCounts();

  pageLayout("المستودع", `
    <section class="pc19-warehouse-page">
      <div class="pc19-warehouse-head">
        <button onclick="renderGateway()"><i class="fa-solid fa-arrow-right"></i></button>
        <div>
          <span>Protein & Carb Operations</span>
          <h1>المستودع</h1>
          <small>${todayDate()}</small>
        </div>
        <button onclick="renderInternalIssue()"><i class="fa-solid fa-arrow-up-from-bracket"></i></button>
      </div>

      <section class="pc19-warehouse-hero">
        <div>
          <span>ملخص المستودع</span>
          <h2>طلبات وصرف اليوم</h2>
        </div>
      </section>

      <section class="pc19-warehouse-kpis">
        <div><i class="fa-solid fa-file-circle-plus"></i><span>طلبات جديدة</span><b>${c.newOrders}</b></div>
        <div><i class="fa-solid fa-hourglass-half"></i><span>قيد الصرف</span><b>${c.inProgress}</b></div>
        <div><i class="fa-solid fa-circle-check"></i><span>تم الصرف</span><b>${c.doneToday}</b></div>
        <div><i class="fa-solid fa-arrow-right-arrow-left"></i><span>صرف داخلي</span><b>${c.internal}</b></div>
      </section>

      <section class="pc19-tabs">
        <button class="${pc19WarehouseTab==="new"?"active":""}" onclick="pc19WarehouseTab='new';drawWarehouseOrders()">جديد</button>
        <button class="${pc19WarehouseTab==="progress"?"active":""}" onclick="pc19WarehouseTab='progress';drawWarehouseOrders()">قيد الصرف</button>
        <button class="${pc19WarehouseTab==="done"?"active":""}" onclick="pc19WarehouseTab='done';drawWarehouseOrders()">تم الصرف</button>
        <button onclick="renderInternalIssue()">صرف داخلي</button>
      </section>

      <div id="warehouseOrdersBox"></div>
    </section>
    ${typeof pc18BottomNav==="function" ? pc18BottomNav("warehouse") : ""}
  `,"renderGateway()");

  drawWarehouseOrders();
}

function drawWarehouseOrders(){
  const box = document.getElementById("warehouseOrdersBox");
  if(!box) return;

  const orders = pc19FilteredOrders().filter(o=>pc19Branch==="all" || pcBranchOf(o)===pc19Branch);
  const chips = pcBranchChips(pc19Branch,"pc19SetBranch");
  if(!orders.length){
    box.innerHTML = `${chips}<div class="pc19-empty">لا توجد طلبات في هذا التصنيف</div>`;
    return;
  }

  box.innerHTML = `
    ${chips}
    ${pc90OutSummary(orders)}
    <div class="pc19-orders-list">
      ${orders.slice(0,pc19Lim).map(o=>pc19OrderCard(o)).join("")}
    </div>
    ${orders.length>pc19Lim ? `<button type="button" class="pc60-more-btn" onclick="pc19Lim+=30;drawWarehouseOrders()">عرض المزيد (${orders.length-pc19Lim})</button>` : ""}
  `;
}

function pc19SetBranch(v){ pc19Branch = v; drawWarehouseOrders(); }

function pc19OrderCard(o){
  const opened = pc19OpenWarehouseOrderId === o.id;
  const items = o.items || [];
  return `
    <article class="pc19-order-card ${opened ? "open" : ""}">
      <div class="pc19-order-head">
        <div>
          <span>طلب #${escapeHtml(pc19OrderNo(o))}</span>
          <h3>${escapeHtml(o.section || "قسم غير محدد")}</h3>
          ${pcBranchTag(o)}
        </div>
        <em>${escapeHtml(pc19OrderStatus(o))}</em>
      </div>

      <div class="pc19-order-meta">
        <span><i class="fa-solid fa-user"></i> ${escapeHtml(o.chefName || "")}</span>
        <span><i class="fa-solid fa-clock"></i> ${escapeHtml(pc19OrderTime(o))}</span>
      </div>

      ${pc90OrderWarn(items)}
      <div class="pc19-order-items">
        ${items.slice(0, opened ? items.length : 3).map((i,idx)=>`
          <div class="${pc90ItemOut(i)?"pc90-out":""}">
            <b>${escapeHtml(i.name || i.productName || "")}${pc90ItemOut(i)?`<span class="pc90-tag">غير متوفر</span>`:""}${i.supplyRequested?`<span class="pc90-tag pc91-req">طلب توفير</span>`:""}</b>
            <span>${escapeHtml(i.qty || "")} ${escapeHtml(i.unit || "")}</span>
          </div>
        `).join("")}
        ${!opened && items.length > 3 ? `<small>+ ${items.length-3} أصناف أخرى</small>` : ""}
      </div>

      ${opened ? pc19OrderIssueForm(o) : `
        <button class="pc19-open-btn" onclick="pc19OpenWarehouseOrderId='${o.id}';drawWarehouseOrders()">فتح الطلب</button>
      `}
    </article>
  `;
}

function pc19OrderIssueForm(o){
  const items = o.items || [];
  return `
    <div class="pc19-issue-form">
      <h4>صرف الطلب</h4>
      <div class="pc19-issue-head-row">
        <span>الصنف</span>
        <span>المطلوب</span>
        <span>المصروف</span>
      </div>
      ${items.map((i,idx)=>{
        const key = `${o.id}_${idx}`;
        const val = pc19IssueDraft[key] ?? i.issuedQty ?? i.qty ?? "";
        return `
          <div class="pc19-issue-row ${pc90ItemOut(i)?"pc90-out":""}">
            <div>
              <b>${escapeHtml(i.name || i.productName || "")}${pc90ItemOut(i)?`<span class="pc90-tag">غير متوفر</span>`:""}${i.supplyRequested?`<span class="pc90-tag pc91-req">طلب توفير</span>`:""}</b>
              <small>${escapeHtml(i.unit || "")}</small>${pc86StockLine(i)}
            </div>
            <span>${escapeHtml(i.qty || "")}</span>
            <input type="number" min="0" inputmode="numeric" value="${escapeHtml(val)}" onchange="pc19IssueDraft['${key}']=Number(this.value||0)">
          </div>
        `;
      }).join("")}

      <textarea id="pc19OrderNote_${o.id}" placeholder="ملاحظة للمستودع / الإدارة">${escapeHtml(o.issueNote || "")}</textarea>

      <div class="pc19-order-actions">
        <button class="pc19-secondary" onclick="pc19OpenWarehouseOrderId=null;drawWarehouseOrders()">إغلاق</button>
        <button class="pc19-main" onclick="pc19ConfirmIssueOrder('${o.id}')">صرف الطلب</button>
      </div>
    </div>
  `;
}

async function pc19ConfirmIssueOrder(orderId){
  const order = (warehouseOrders||[]).find(o=>o.id===orderId);
  if(!order) return;

  const items = (order.items||[]).map((i,idx)=>{
    const key = `${orderId}_${idx}`;
    const issuedQty = Number(pc19IssueDraft[key] ?? i.issuedQty ?? i.qty ?? 0);
    return {...i, issuedQty};
  });

  const note = document.getElementById("pc19OrderNote_"+orderId)?.value?.trim() || "";
  const {db,doc,updateDoc}=window.firebaseDB;

  await updateDoc(doc(db,"warehouse_orders",orderId),{
    items,
    issueNote:note,
    issueStatus:"تم الصرف",
    status:"تم الصرف",
    issuedAtMs:Date.now(),
    issuedAtText:nowText()
  });
  await pc86Deduct(items);

  pc19OpenWarehouseOrderId = null;
  showToast("تم صرف الطلب");
  drawWarehouseOrders();
}

let pc19SelectedInternalItemId = null;

function renderInternalIssue(){
  internalIssueCart = internalIssueCart || [];

  pageLayout("صرف داخلي", `
    <section class="pc19-internal-page">
      <div class="pc19-warehouse-head">
        <button onclick="renderWarehouse()"><i class="fa-solid fa-arrow-right"></i></button>
        <div>
          <span>المستودع</span>
          <h1>صرف داخلي</h1>
          <small>${todayDate()}</small>
        </div>
        <button onclick="renderGateway()"><i class="fa-solid fa-house"></i></button>
      </div>

      <section class="pc19-panel">
        <label>موظف المستودع</label>
        <select id="pc19InternalStaff">
          <option value="">اختر الموظف</option>
          ${(warehouseStaff||[]).map(s=>`<option>${escapeHtml(s.name||"")}</option>`).join("")}
        </select>

        <label>جهة الصرف</label>
        <select id="pc19InternalDestination">
          <option value="">اختر الجهة</option>
          ${(internalDestinations||[]).map(d=>`<option>${escapeHtml(d.name||"")}</option>`).join("")}
        </select>
      </section>

      <section class="pc19-panel">
        <div class="pc19-panel-head"><h3>الأصناف</h3></div>
        <input id="pc19InternalSearch" placeholder="بحث عن صنف" oninput="pc19DrawInternalItems()">
        <div id="pc19InternalItemsBox"></div>
      </section>

      <section class="pc19-panel">
        <div class="pc19-panel-head"><h3>سلة الصرف الداخلي</h3></div>
        <div id="pc19InternalCartBox"></div>
        <textarea id="pc19InternalNote" placeholder="ملاحظة"></textarea>
        <button class="pc19-main full" onclick="pc19SubmitInternalIssue()">اعتماد الصرف الداخلي</button>
      </section>
    </section>
    ${typeof pc18BottomNav==="function" ? pc18BottomNav("warehouse") : ""}
  `,"renderWarehouse()");

  pc19DrawInternalItems();
  pc19DrawInternalCart();
}

function pc19DrawInternalItems(){
  const box = document.getElementById("pc19InternalItemsBox");
  if(!box) return;

  const q = (document.getElementById("pc19InternalSearch")?.value||"").trim().toLowerCase();
  const list = (warehouseItems||[]).filter(i=>
    String(i.name||i.nameAr||"").toLowerCase().includes(q) ||
    String(i.nameEn||"").toLowerCase().includes(q) ||
    String(i.code||"").toLowerCase().includes(q)
  ).slice(0,120);

  if(!list.length){
    box.innerHTML = `<div class="pc19-empty">لا توجد أصناف</div>`;
    return;
  }

  box.innerHTML = `
    <div class="pc19-select-list">
      ${list.map(i=>`
        <div class="pc19-select-row ${pc19SelectedInternalItemId===i.id ? "open" : ""}">
          <button onclick="pc19SelectedInternalItemId='${i.id}';pc19DrawInternalItems()">
            <div>
              <b>${escapeHtml(i.nameAr||i.name||"")}</b>
              <small>${escapeHtml([i.code,i.nameEn,i.unit].filter(Boolean).join(" • "))}</small>
            </div>
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          ${pc19SelectedInternalItemId===i.id ? `
            <div class="pc19-inline-add">
              <input id="pc19InternalQty_${i.id}" type="number" min="1" inputmode="numeric" placeholder="الكمية">
              <button onclick="pc19AddInternalItem('${i.id}')">إضافة</button>
            </div>
          ` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function pc19AddInternalItem(id){
  const item = (warehouseItems||[]).find(i=>i.id===id);
  if(!item) return;
  const qty = Number(document.getElementById("pc19InternalQty_"+id)?.value || 0);
  if(!qty || qty <= 0){
    showToast("اكتب الكمية أولاً","error");
    return;
  }

  const existing = internalIssueCart.find(x=>x.itemId===id);
  if(existing){
    existing.qty = Number(existing.qty||0) + qty;
  }else{
    internalIssueCart.push({
      itemId:id,
      code:item.code||"",
      name:item.nameAr||item.name||"",
      nameEn:item.nameEn||"",
      unit:item.unit||"",
      qty
    });
  }

  pc19SelectedInternalItemId = null;
  pc19DrawInternalItems();
  pc19DrawInternalCart();
  showToast("تمت إضافة الصنف");
}

function pc19DrawInternalCart(){
  const box = document.getElementById("pc19InternalCartBox");
  if(!box) return;

  if(!internalIssueCart.length){
    box.innerHTML = `<div class="pc19-empty">السلة فارغة</div>`;
    return;
  }

  box.innerHTML = `
    <div class="pc19-cart-list">
      ${internalIssueCart.map((i,idx)=>`
        <div class="pc19-cart-row">
          <div><b>${escapeHtml(i.name||"")}</b><small>${escapeHtml([i.code,i.unit].filter(Boolean).join(" • "))}</small></div>
          <input type="number" min="1" inputmode="numeric" value="${escapeHtml(i.qty||1)}" onchange="internalIssueCart[${idx}].qty=Number(this.value||1)">
          <button onclick="internalIssueCart.splice(${idx},1);pc19DrawInternalCart()"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join("")}
    </div>
  `;
}

async function pc19SubmitInternalIssue(){
  const staff = document.getElementById("pc19InternalStaff")?.value || "";
  const destination = document.getElementById("pc19InternalDestination")?.value || "";
  const note = document.getElementById("pc19InternalNote")?.value?.trim() || "";

  if(!staff || !destination){
    showToast("اختر الموظف والجهة","error");
    return;
  }

  if(!internalIssueCart.length){
    showToast("السلة فارغة","error");
    return;
  }

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"internal_issues"),{
    branchId:currentBranch,
    staff,
    destination,
    items:internalIssueCart,
    note,
    createdAt:serverTimestamp(),
    createdAtMs:Date.now(),
    createdAtText:nowText()
  });

  internalIssueCart = [];
  showToast("تم اعتماد الصرف الداخلي");
  renderWarehouse();
}

let pc21AdminUnlocked = false;

function pc21GoSection(type){
  if(type === "warehouse"){
    if(typeof renderAdminWarehouse === "function") return renderAdminWarehouse();
    if(typeof renderWarehouse === "function") return renderWarehouse();
  }
  if(type === "production"){
    if(typeof renderAdminProduction === "function") return renderAdminProduction();
  }
  if(type === "waste"){
    if(typeof renderAdminWaste === "function") return renderAdminWaste();
  }
  if(type === "cleaning"){
    if(typeof renderAdminCleaning === "function") return renderAdminCleaning();
    if(typeof renderCleaning === "function") return renderCleaning();
  }
  if(type === "operations"){
    if(typeof renderAdminOperations === "function") return renderAdminOperations();
    if(typeof renderOperations === "function") return renderOperations();
  }
  if(type === "reports"){
    if(typeof renderAdminPDF === "function") return renderAdminPDF();
  }
  if(type === "archive"){
    if(typeof renderAdminArchive === "function") return renderAdminArchive();
    if(typeof showToast === "function") return showToast("الأرشيف غير مفعل بعد");
  }
}

var PC18_NAV = [
  ["home","fa-house","الرئيسية","renderHome()"],
  ["cleaning","fa-broom","النظافة","renderCleaning()"],
  ["operations","fa-gears","التشغيل","renderOperations()"]];
function pc18BottomNav(active="home"){
  if(!PC18_NAV.some(n=>n[0]===active)) return "";
  return `
    <nav class="pc18-bottom-nav">
      ${PC18_NAV.map(n=>`<button class="${active===n[0]?"active":""}" type="button" onclick="${n[3]}"><i class="fa-solid ${n[1]}"></i><span>${n[2]}</span></button>`).join("")}
    </nav>
  `;
}

function pc21SafeList(name){
  try{
    if(typeof window !== "undefined" && Array.isArray(window[name])) return window[name];
  }catch(e){}
  try{
    if(name === "productionLogs" && typeof productionLogs !== "undefined" && Array.isArray(productionLogs)) return productionLogs;
    if(name === "wasteLogs" && typeof wasteLogs !== "undefined" && Array.isArray(wasteLogs)) return wasteLogs;
    if(name === "warehouseOrders" && typeof warehouseOrders !== "undefined" && Array.isArray(warehouseOrders)) return warehouseOrders;
    if(name === "cleaningLogs" && typeof cleaningLogs !== "undefined" && Array.isArray(cleaningLogs)) return cleaningLogs;
    if(name === "operationLogs" && typeof operationLogs !== "undefined" && Array.isArray(operationLogs)) return operationLogs;
    if(name === "internalIssues" && typeof internalIssues !== "undefined" && Array.isArray(internalIssues)) return internalIssues;
    if(name === "chefs" && typeof chefs !== "undefined" && Array.isArray(chefs)) return chefs;
    if(name === "operationTasks" && typeof operationTasks !== "undefined" && Array.isArray(operationTasks)) return operationTasks;
    if(name === "cleaningTasks" && typeof cleaningTasks !== "undefined" && Array.isArray(cleaningTasks)) return cleaningTasks;
    if(name === "dailyArchives" && typeof dailyArchives !== "undefined" && Array.isArray(dailyArchives)) return dailyArchives;
    if(name === "archives" && typeof archives !== "undefined" && Array.isArray(archives)) return archives;
  }catch(e){}
  return [];
}

function pc21SafeSettings(){
  try{
    if(typeof systemSettings !== "undefined" && systemSettings) return systemSettings;
  }catch(e){}
  try{
    if(typeof window !== "undefined" && window.systemSettings) return window.systemSettings;
  }catch(e){}
  return {};
}

function pc21TodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc21DateKey(obj){
  try{
    if(typeof pc17DateKey === "function") return pc17DateKey(obj);
  }catch(e){}
  try{
    if(typeof getTimeValue === "function"){
      const ms = getTimeValue(obj);
      if(ms){
        const d = new Date(ms);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      }
    }
  }catch(e){}
  return "";
}

function pc21CheckAdminPassword(){
  const input = document.getElementById("pc21AdminPassword");
  const pass = input ? input.value.trim() : "";
  const correct = String(pc21SafeSettings().adminPassword || "");
  if(pass !== correct){
    if(typeof showToast === "function") showToast("كلمة المرور غير صحيحة","error");
    else alert("كلمة المرور غير صحيحة");
    return;
  }
  try{
    pc21OpenAdmin();
  }catch(err){
    console.error("Admin open error:", err);
    if(typeof showToast === "function") showToast("حدث خطأ في فتح الإدارة","error");
    else alert("حدث خطأ في فتح الإدارة");
  }
}

function renderAdminGate(){
  const bottom = typeof pc18BottomNav === "function" ? pc18BottomNav("admin") : "";

  app.innerHTML = `
    <main class="app">
      <section class="pc21-admin-gate">
        <div class="pc21-admin-gate-card">
          <div class="pc21-admin-gate-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <h2>الإدارة</h2>
          <p>أدخل كلمة مرور الإدارة للمتابعة</p>
          <input id="pc21AdminPassword" type="password" placeholder="كلمة مرور الإدارة" autocomplete="current-password">
          <button id="pc21AdminLogin" class="btn btn-main" type="button">دخول الإدارة</button>
        </div>
      </section>
    </main>
    ${bottom}
  `;

  setTimeout(()=>{
    const input = document.getElementById("pc21AdminPassword");
    const btn = document.getElementById("pc21AdminLogin");
    input?.focus();
    btn?.addEventListener("click", pc21CheckAdminPassword);
    input?.addEventListener("keydown", e=>{
      if(e.key === "Enter") pc21CheckAdminPassword();
    });
  }, 0);
}

function renderAdmin(){
  try{
    return pc21OpenAdmin();
  }catch(err){
    console.error("Admin render error:", err);
    if(typeof showToast === "function") showToast("تعذر فتح الإدارة","error");
  }
}

function pc22EnsureAdminStyle(){
  return;
  if(document.getElementById("pc22AdminStyle")) return;
  const st = document.createElement("style");
  st.id = "pc22AdminStyle";
  st.textContent = `
    .pc21-admin-page{padding-bottom:112px!important}
    .pc21-admin-grid{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:12px!important;
      align-items:stretch!important;
      margin-top:10px!important;
      clear:both!important;
    }
    .pc21-admin-card{
      position:relative!important;
      min-height:136px!important;
      border:0!important;
      background:rgba(255,255,255,.94)!important;
      border:1px solid rgba(255,255,255,.78)!important;
      border-radius:28px!important;
      box-shadow:var(--shadow-soft,0 14px 35px rgba(18,51,37,.10))!important;
      padding:16px 10px!important;
      display:grid!important;
      place-items:center!important;
      text-align:center!important;
      gap:6px!important;
      color:var(--green-dark,#2f5f1f)!important;
      font-weight:900!important;
      cursor:pointer!important;
      overflow:hidden!important;
      z-index:1!important;
    }
    .pc21-admin-card::before{
      content:""!important;
      position:absolute!important;
      width:94px!important;
      height:94px!important;
      border-radius:50%!important;
      background:rgba(244,197,66,.15)!important;
      top:-44px!important;
      right:-36px!important;
      z-index:0!important;
    }
    .pc21-admin-card-icon{
      position:relative!important;
      z-index:1!important;
      width:62px!important;
      height:62px!important;
      border-radius:50%!important;
      background:linear-gradient(135deg,var(--green-dark,#2f5f1f),#113820)!important;
      color:var(--gold,var(--yellow,#f4c542))!important;
      border:3px solid rgba(244,197,66,.72)!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      font-size:25px!important;
      box-shadow:0 12px 24px rgba(18,51,37,.14)!important;
    }
    .pc21-admin-card b,
    .pc21-admin-card span,
    .pc21-admin-card em{position:relative!important;z-index:2!important}
    .pc21-admin-card b{color:var(--green-dark,#2f5f1f)!important;font-size:17px!important;font-weight:900!important}
    .pc21-admin-card span{color:var(--muted,#7b8674)!important;font-size:12px!important;font-weight:900!important}
    .pc21-admin-card em{
      position:absolute!important;
      top:12px!important;
      left:12px!important;
      min-width:28px!important;
      height:28px!important;
      border-radius:999px!important;
      background:var(--green-soft,#e8f4df)!important;
      color:var(--green-dark,#2f5f1f)!important;
      border:3px solid white!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      font-style:normal!important;
      font-size:11px!important;
      font-weight:900!important;
      padding:0 7px!important;
    }
    .pc21-admin-card.warn em{background:#FFF6D6!important;color:#8A6500!important}
    .pc21-admin-card.danger em{background:#FFF1F1!important;color:#B91C1C!important}
    .pc21-admin-head{position:relative!important;z-index:5!important}
    .pc21-admin-head button{position:relative!important;z-index:10!important}
    .pc21-admin-hero,.pc21-alert-grid,.pc21-admin-section-title,.pc21-admin-grid{position:relative!important;z-index:1!important}
    @media(max-width:380px){
      .pc21-admin-grid{grid-template-columns:1fr!important}
    }
  `;
  document.head.appendChild(st);
}

function pc22OpenReports(){
  if(typeof renderAdminPDF === "function"){
    return renderAdminPDF();
  }
  if(typeof showToast === "function") showToast("التقارير غير مفعلة بعد");
}

function pc22OpenWarehousePremium(){
  if(typeof renderWarehouse === "function"){
    return renderWarehouse();
  }
  if(typeof showToast === "function") showToast("واجهة المستودع غير موجودة","error");
}

function pc22CheckWarehousePassword(){
  const input = document.getElementById("pc22WarehousePassword");
  const pass = input ? input.value.trim() : "";
  const correct = String(pc21SafeSettings().warehousePassword || "");
  if(pass !== correct){
    if(typeof showToast === "function") showToast("كلمة المرور غير صحيحة","error");
    else alert("كلمة المرور غير صحيحة");
    return;
  }
  pc22OpenWarehousePremium();
}

function renderWarehouseGate(){
  const bottom = typeof pc18BottomNav === "function" ? pc18BottomNav("warehouse") : "";

  app.innerHTML = `
    <main class="app">
      <section class="pc21-admin-gate">
        <div class="pc21-admin-gate-card">
          <div class="pc21-admin-gate-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
          <h2>المستودع</h2>
          <p>أدخل كلمة مرور المستودع للمتابعة</p>
          <input id="pc22WarehousePassword" type="password" placeholder="كلمة مرور المستودع" autocomplete="current-password">
          <button id="pc22WarehouseLogin" class="btn btn-main" type="button">دخول المستودع</button>
        </div>
      </section>
    </main>
    ${bottom}
  `;

  setTimeout(()=>{
    const input = document.getElementById("pc22WarehousePassword");
    const btn = document.getElementById("pc22WarehouseLogin");
    input?.focus();
    btn?.addEventListener("click", pc22CheckWarehousePassword);
    input?.addEventListener("keydown", e=>{
      if(e.key === "Enter") pc22CheckWarehousePassword();
    });
  }, 0);
}

let pc24ActiveAdminPanel = "";

function pc24SafeList(name){
  if(typeof pc21SafeList === "function") return pc21SafeList(name);
  try{
    if(name === "productionLogs" && Array.isArray(productionLogs)) return productionLogs;
    if(name === "wasteLogs" && Array.isArray(wasteLogs)) return wasteLogs;
    if(name === "warehouseOrders" && Array.isArray(warehouseOrders)) return warehouseOrders;
    if(name === "cleaningLogs" && Array.isArray(cleaningLogs)) return cleaningLogs;
    if(name === "operationLogs" && Array.isArray(operationLogs)) return operationLogs;
    if(name === "internalIssues" && Array.isArray(internalIssues)) return internalIssues;
    if(name === "chefs" && Array.isArray(chefs)) return chefs;
    if(name === "operationTasks" && Array.isArray(operationTasks)) return operationTasks;
    if(name === "cleaningTasks" && Array.isArray(cleaningTasks)) return cleaningTasks;
    if(name === "dailyArchives" && Array.isArray(dailyArchives)) return dailyArchives;
    if(name === "archives" && Array.isArray(archives)) return archives;
  }catch(e){}
  return [];
}

function pc24TodayKey(){
  if(typeof pc21TodayKey === "function") return pc21TodayKey();
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc24DateKey(x){
  if(typeof pc21DateKey === "function") return pc21DateKey(x);
  if(typeof pc17DateKey === "function") return pc17DateKey(x);
  try{
    const ms = typeof getTimeValue === "function" ? getTimeValue(x) : (x.createdAtMs || x.timeMs || 0);
    if(ms){
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
  }catch(e){}
  return "";
}

function pc24Today(list){
  const key = pc24TodayKey();
  return (list || []).filter(x => pc24DateKey(x) === key);
}

function pc24ProductionQty(list){
  let total = 0;
  (list || []).forEach(log => (log.items || []).forEach(i => total += Number(i.qty || 0)));
  return total;
}

function pc24AdminStats(){
  const prodToday = pc24Today(pc24SafeList("productionLogs"));
  const wasteToday = pc24Today(pc24SafeList("wasteLogs"));
  const whToday = pc24Today(pc24SafeList("warehouseOrders"));
  const cleanToday = pc24Today(pc24SafeList("cleaningLogs"));
  const opsToday = pc24Today(pc24SafeList("operationLogs"));
  const internalToday = pc24Today(pc24SafeList("internalIssues"));
  const chefsList = pc24SafeList("chefs");
  const operationTasksList = pc24SafeList("operationTasks");
  const cleaningTasksList = pc24SafeList("cleaningTasks");

  const pendingChefs = pc24PendingChefs(prodToday, chefsList);
  const missingTasks = [...pc24MissingCleaning(cleanToday, cleaningTasksList), ...pc24MissingOperations(opsToday, operationTasksList)];

  return {
    newWarehouse:pc24SafeList("warehouseOrders").filter(o => o.status === "جديد" || !o.status).length,
    warehouseToday:whToday.length,
    productionQty:pc24ProductionQty(prodToday),
    productionLogs:prodToday.length,
    pendingChefs:pendingChefs.length,
    waste:wasteToday.length,
    cleaning:cleanToday.length,
    operations:opsToday.length,
    internal:internalToday.length,
    incomplete:missingTasks.length,
    archives:pc24SafeList("dailyArchives").length || pc24SafeList("archives").length || 0,
    pendingRows:pendingChefs,
    missingRows:missingTasks,
    topItems:pc24TopItems(prodToday)
  };
}

function pc24PendingChefs(prodToday, chefsList){
  return (chefsList || []).filter(c=>{
    return !(prodToday || []).some(log =>
      pcMine(log,c)
    );
  }).map(c=>({
    title:c.name || "شيف بدون اسم",
    meta:c.section || "قسم غير محدد",
    icon:"fa-user-clock"
  }));
}

function pc24ShiftName(shift){
  try{
    if(typeof shiftLabels !== "undefined" && shiftLabels[shift]?.ar) return shiftLabels[shift].ar;
  }catch(e){}
  const map = {morning:"قبل الافتتاح", afternoon:"منتصف اليوم", night:"الإغلاق"};
  return map[shift] || shift || "النظافة";
}

function pc24TimeValue(x){
  try{
    if(typeof getTimeValue === "function") return getTimeValue(x);
  }catch(e){}
  return x.createdAtMs || x.timeMs || 0;
}

function pc24MissingCleaning(cleanToday, cleaningTasksList){
  const rows = [];
  const shifts = ["morning","afternoon","night"];
  const logs = cleanToday || [];
  const tasks = cleaningTasksList || [];

  shifts.forEach(shift=>{
    const shiftTasks = tasks.filter(t=>t[shift]);
    if(!shiftTasks.length) return;

    const shiftLogs = logs.filter(l=>l.shift === shift).sort((a,b)=>pc24TimeValue(a)-pc24TimeValue(b));
    const latest = shiftLogs[shiftLogs.length-1];

    if(!latest){
      rows.push({
        title:`النظافة - ${pc24ShiftName(shift)}`,
        meta:`لم يرفع التقرير • ${shiftTasks.length} مهام`,
        icon:"fa-broom"
      });
      return;
    }

    (latest.entries || []).filter(e=>!e.done).forEach(e=>{
      rows.push({
        title:e.nameAr || e.name || "مهمة نظافة",
        meta:`النظافة • ${pc24ShiftName(shift)}`,
        icon:"fa-broom"
      });
    });
  });

  return rows;
}

function pc24MissingOperations(opsToday, operationTasksList){
  const rows = [];
  const logs = opsToday || [];
  (operationTasksList || []).forEach(t=>{
    const done = logs.some(l=>{
      const sameId = String(l.taskId || "") === String(t.id || "");
      const sameName = String(l.taskName || "") === String(t.name || "");
      return (sameId || sameName) && l.done !== false;
    });

    if(!done){
      rows.push({
        title:t.name || "مهمة تشغيل",
        meta:`التشغيل • ${t.period || t.time || "بدون وقت"}`,
        icon:"fa-industry"
      });
    }
  });
  return rows;
}

function pc24TopItems(prodToday){
  const map = {};
  (prodToday || []).forEach(log=>{
    (log.items || []).forEach(i=>{
      const name = i.name || i.productName || "صنف غير محدد";
      if(!map[name]) map[name] = {title:name, qty:0, icon:"fa-ranking-star"};
      map[name].qty += Number(i.qty || 0);
    });
  });
  return Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,8).map(x=>({
    title:x.title,
    meta:`${x.qty} كمية`,
    icon:x.icon
  }));
}

function pc24ToggleAdminPanel(panel){
  pc24ActiveAdminPanel = pc24ActiveAdminPanel === panel ? "" : panel;
  pc21OpenAdmin();
}

function pc24SummaryCard(type, title, value, meta, state){
  const active = pc24ActiveAdminPanel === type;
  const canOpen = ["pending","missing","topItems"].includes(type);
  return `
    <button type="button" class="pc24-summary-card ${state || ""} ${active ? "active" : ""}" ${canOpen ? `onclick="pc24ToggleAdminPanel('${type}')"` : ""}>
      <span>${title}</span>
      <b>${value}</b>
      <small>${meta}</small>
      ${canOpen ? `<i class="fa-solid ${active ? "fa-chevron-up" : "fa-chevron-down"}"></i>` : ""}
    </button>
  `;
}

function pc24Panel(title, rows, emptyText){
  if(!pc24ActiveAdminPanel) return "";
  return `
    <section class="pc24-drop-panel">
      <div class="pc24-drop-head">
        <h3>${title}</h3>
        <button type="button" onclick="pc24ActiveAdminPanel='';pc21OpenAdmin()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      ${
        rows && rows.length
        ? `<div class="pc24-drop-list">${rows.map(r=>`
            <div class="pc24-drop-row">
              <i class="fa-solid ${r.icon || "fa-circle-info"}"></i>
              <div>
                <b>${escapeHtml(r.title || "")}</b>
                <small>${escapeHtml(r.meta || "")}</small>
              </div>
            </div>
          `).join("")}</div>`
        : `<div class="pc24-empty">${emptyText}</div>`
      }
    </section>
  `;
}

function pc24ActivePanelHtml(s){
  if(pc24ActiveAdminPanel === "pending") return pc24Panel("إنتاج معلق", s.pendingRows, "لا يوجد إنتاج معلق");
  if(pc24ActiveAdminPanel === "missing") return pc24Panel("مهام ناقصة", s.missingRows, "لا توجد مهام ناقصة");
  if(pc24ActiveAdminPanel === "topItems") return pc24Panel("أكثر الأصناف إنتاجاً", s.topItems, "لا توجد بيانات إنتاج اليوم");
  return "";
}

function pc24SectionStatus(type, s){
  if(type === "warehouse") return `${s.newWarehouse} جديد • ${s.internal} داخلي`;
  if(type === "production") return s.pendingChefs ? `${s.pendingChefs} معلق` : `${s.productionQty} اليوم`;
  if(type === "waste") return `${s.waste} اليوم`;
  if(type === "cleaning") return s.cleaning ? `${s.cleaning} تقارير` : "بانتظار";
  if(type === "operations") return s.operations ? `${s.operations} تقارير` : "بانتظار";
  if(type === "reports") return "PDF يومي";
  if(type === "archive") return s.archives ? `${s.archives} أيام` : "أيام سابقة";
  return "";
}

function pc24SectionBadge(type, s){
  if(type === "warehouse") return (s.newWarehouse || s.internal) ? (s.newWarehouse || s.internal) : "";
  if(type === "production") return s.pendingChefs ? s.pendingChefs : "✓";
  if(type === "waste") return s.waste || "";
  if(type === "cleaning") return s.cleaning || "";
  if(type === "operations") return s.operations || "";
  if(type === "reports") return "PDF";
  if(type === "archive") return s.archives || "";
  return "";
}

function pc24SectionState(type, s){
  if(type === "production" && s.pendingChefs) return "warn";
  if(type === "warehouse" && (s.newWarehouse || s.internal)) return "warn";
  if(type === "waste" && s.waste) return "danger";
  return "";
}

function pc21AdminSectionCard(type, icon, title, s){
  const status = pc24SectionStatus(type, s);
  const badge = pc24SectionBadge(type, s);
  const state = pc24SectionState(type, s);
  return `
    <button class="pc21-admin-card ${state}" type="button" onclick="pc21GoSection('${type}')">
      <div class="pc21-admin-card-icon"><i class="fa-solid ${icon}"></i></div>
      <b>${title}</b>
      <span>${status}</span>
      ${badge !== "" && badge !== null && badge !== undefined ? `<em>${badge}</em>` : ""}
    </button>
  `;
}

function pc24EnsureStyle(){
  return;
  if(document.getElementById("pc24AdminStyle")) return;
  const st = document.createElement("style");
  st.id = "pc24AdminStyle";
  st.textContent = `
    .pc21-admin-page{padding-bottom:150px!important}
    .pc21-admin-grid{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:12px!important;
      align-items:stretch!important;
      margin-top:10px!important;
      padding-bottom:40px!important;
    }
    .pc21-admin-card{
      width:100%!important;
      min-width:0!important;
      min-height:136px!important;
      position:relative!important;
      z-index:1!important;
      overflow:hidden!important;
    }
    .pc24-summary-grid{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:12px!important;
      margin-bottom:14px!important;
    }
    .pc24-summary-card{
      border:0!important;
      background:rgba(255,255,255,.94)!important;
      border:1px solid rgba(255,255,255,.78)!important;
      border-radius:26px!important;
      box-shadow:var(--shadow-soft,0 14px 35px rgba(18,51,37,.10))!important;
      padding:15px!important;
      text-align:right!important;
      position:relative!important;
      color:var(--green-dark,#2f5f1f)!important;
      cursor:pointer!important;
      min-height:104px!important;
      overflow:hidden!important;
      z-index:1!important;
    }
    .pc24-summary-card.warn{background:#FFF6D6!important}
    .pc24-summary-card.danger{background:#FFF1F1!important}
    .pc24-summary-card.active{outline:3px solid rgba(244,197,66,.35)!important}
    .pc24-summary-card span{display:block;color:var(--muted,#7b8674);font-weight:900;font-size:12px}
    .pc24-summary-card b{display:block;color:var(--green-dark,#2f5f1f);font-size:31px;font-weight:900;line-height:1.1}
    .pc24-summary-card small{color:var(--muted,#7b8674);font-weight:800}
    .pc24-summary-card > i{position:absolute;top:14px;left:14px;color:var(--green-dark,#2f5f1f);font-size:14px}
    .pc24-drop-panel{
      background:rgba(255,255,255,.94)!important;
      border:1px solid rgba(255,255,255,.78)!important;
      border-radius:28px!important;
      box-shadow:var(--shadow-soft,0 14px 35px rgba(18,51,37,.10))!important;
      padding:16px!important;
      margin:0 0 16px!important;
      position:relative!important;
      z-index:2!important;
      clear:both!important;
    }
    .pc24-drop-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
    .pc24-drop-head h3{color:var(--green-dark,#2f5f1f);font-size:22px;font-weight:900}
    .pc24-drop-head button{
      width:38px;height:38px;border:0;border-radius:14px;
      background:var(--green-soft,#e8f4df);color:var(--green-dark,#2f5f1f);
      display:flex;align-items:center;justify-content:center
    }
    .pc24-drop-list{display:grid;gap:9px}
    .pc24-drop-row{
      display:flex;align-items:center;gap:10px;padding:10px;border-radius:18px;
      background:rgba(239,249,240,.65);border:1px solid rgba(67,169,77,.12)
    }
    .pc24-drop-row > i{
      width:38px;height:38px;border-radius:14px;background:white;color:var(--green-dark,#2f5f1f);
      display:flex;align-items:center;justify-content:center;flex:none
    }
    .pc24-drop-row b{display:block;color:var(--green-dark,#2f5f1f);font-weight:900;font-size:14px}
    .pc24-drop-row small{display:block;color:var(--muted,#7b8674);font-weight:800;font-size:12px;margin-top:2px}
    .pc24-empty{
      padding:16px;border-radius:20px;background:var(--green-soft,#e8f4df);
      color:var(--green-dark,#2f5f1f);font-weight:900;text-align:center
    }

    /* Fix print/delete buttons hidden behind next cards */
    .report-card,.report-section,.admin-report-card,.pc18-dash-card,.pc20-report-card,.panel,.card{
      overflow:visible!important;
      height:auto!important;
      max-height:none!important;
    }
    .report-actions,.card-actions,.print-actions,.admin-actions,.archive-actions,
    .report-card .actions,.panel .actions,.card .actions{
      position:relative!important;
      z-index:20!important;
      display:flex!important;
      flex-wrap:wrap!important;
      gap:10px!important;
      margin-top:12px!important;
      margin-bottom:14px!important;
      clear:both!important;
    }
    .report-actions button,.card-actions button,.print-actions button,.admin-actions button,.archive-actions button,
    .report-card .actions button,.panel .actions button,.card .actions button{
      position:relative!important;
      z-index:21!important;
      pointer-events:auto!important;
    }
    @media(max-width:360px){
      .pc21-admin-grid,.pc24-summary-grid{grid-template-columns:1fr!important}
    }
  `;
  document.head.appendChild(st);
}

function pc21OpenAdmin(){
  if(typeof pc22EnsureAdminStyle === "function") pc22EnsureAdminStyle();
  pc24EnsureStyle();

  pc21AdminUnlocked = true;
  const s = pc24AdminStats();
  const bottom = typeof pc18BottomNav === "function" ? pc18BottomNav("admin") : "";

  app.innerHTML = `
    <main class="app">
      <section class="pc21-admin-page">
        <div class="pc21-admin-head">
          <button id="pc21AdminBack" type="button"><i class="fa-solid fa-arrow-right"></i></button>
          <div>
            <span>Protein & Carb Operations</span>
            <h1>الإدارة</h1>
            <small>${typeof todayDate === "function" ? todayDate() : ""}</small>
          </div>
          <button id="pc21AdminReport" type="button"><i class="fa-solid fa-file-pdf"></i></button>
        </div>

        <section class="pc21-admin-hero">
          <span>ملخص التشغيل</span>
          <h2>مركز المتابعة</h2>
          <p>الحالات المهمة والمهام الناقصة في مكان واحد.</p>
        </section>

        <section class="pc24-summary-grid">
          ${pc24SummaryCard("warehouse","طلبات جديدة",s.newWarehouse,"المستودع",s.newWarehouse ? "warn" : "")}
          ${pc24SummaryCard("pending","إنتاج معلق",s.pendingChefs,"الشيفات",s.pendingChefs ? "warn" : "")}
          ${pc24SummaryCard("waste","هدر اليوم",s.waste,"عملية",s.waste ? "danger" : "")}
          ${pc24SummaryCard("missing","مهام ناقصة",s.incomplete,"متابعة",s.incomplete ? "warn" : "")}
        </section>

        ${pc24ActivePanelHtml(s)}

        <section class="pc24-summary-grid">
          ${pc24SummaryCard("topItems","أكثر الأصناف إنتاجاً",s.topItems.length,"عرض القائمة","")}
        </section>

        ${pc51AdminGroupsHtml(s)}
      </section>
    </main>
    ${bottom}
  `;

  setTimeout(()=>{
    document.getElementById("pc21AdminBack")?.addEventListener("click", ()=>renderGateway());
    document.getElementById("pc21AdminReport")?.addEventListener("click", ()=>typeof pc22OpenReports === "function" ? pc22OpenReports() : pc21GoSection("reports"));
  }, 0);
}

function pc25EnsureInlineAdminMenuStyle(){
  if(document.getElementById("pc25InlineAdminMenuStyle")) return;

  const st = document.createElement("style");
  st.id = "pc25InlineAdminMenuStyle";
  st.textContent = `
    .admin-actions{
      position:relative!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      gap:10px!important;
      margin-top:14px!important;
      margin-bottom:0!important;
      overflow:visible!important;
      clear:both!important;
      z-index:3!important;
    }

    .admin-menu-wrap{
      position:relative!important;
      display:grid!important;
      gap:10px!important;
      width:auto!important;
      max-width:min(280px,100%)!important;
      overflow:visible!important;
      z-index:4!important;
    }

    .admin-menu-btn{
      min-width:48px!important;
      width:48px!important;
      height:48px!important;
      border-radius:50%!important;
      padding:0!important;
      font-size:22px!important;
      line-height:1!important;
      justify-self:end!important;
      box-shadow:0 10px 22px rgba(18,51,37,.10)!important;
      position:relative!important;
      z-index:5!important;
    }

    .admin-inline-menu{
      display:none;
      position:relative!important;
      right:auto!important;
      left:auto!important;
      top:auto!important;
      bottom:auto!important;
      width:min(260px, calc(100vw - 60px))!important;
      background:rgba(255,255,255,.98)!important;
      border:1px solid rgba(18,51,37,.12)!important;
      box-shadow:0 14px 32px rgba(18,51,37,.14)!important;
      border-radius:20px!important;
      padding:10px!important;
      z-index:6!important;
      margin-top:0!important;
      justify-self:end!important;
      overflow:visible!important;
    }

    .admin-inline-menu.show{
      display:grid!important;
      gap:8px!important;
    }

    .admin-inline-menu .btn{
      width:100%!important;
      min-height:44px!important;
      font-size:14px!important;
      padding:10px 14px!important;
      text-align:center!important;
      border-radius:16px!important;
      position:relative!important;
      z-index:7!important;
      pointer-events:auto!important;
    }

    .report-card,
    .report-section,
    .admin-report-card,
    .pc18-dash-card,
    .pc20-report-card,
    .panel,
    .card,
    .pc19-order-card{
      overflow:visible!important;
      height:auto!important;
      max-height:none!important;
      position:relative!important;
    }

    .printed-chip{
      position:relative!important;
      z-index:5!important;
    }
  `;
  document.head.appendChild(st);
}

function closeAdminMenus(){
  document.querySelectorAll(".admin-menu,.admin-inline-menu").forEach(m=>m.classList.remove("show"));
}

function toggleAdminMenu(id){
  document.querySelectorAll(".admin-menu,.admin-inline-menu").forEach(m=>{
    if(m.id !== id) m.classList.remove("show");
  });
  const el = document.getElementById(id);
  if(el) el.classList.toggle("show");
}

function adminActionMenu(collectionName,id,printFn,printed=false,afterFn="renderAdmin"){
  pc25EnsureInlineAdminMenuStyle();
  const menuId = `inline_menu_${collectionName}_${id}`.replace(/[^a-zA-Z0-9_]/g,"_");

  return `
    <div class="admin-actions">
      ${printed ? `<span class="printed-chip">✓ مطبوع</span>` : ``}
      <div class="admin-menu-wrap" onclick="event.stopPropagation()">
        <button type="button" class="btn btn-light admin-menu-btn" onclick="toggleAdminMenu('${menuId}')">⋮</button>
        <div class="admin-inline-menu" id="${menuId}">
          <button type="button" class="btn btn-light" onclick="${printFn}">🖨 طباعة</button>
          <button type="button" class="btn btn-light danger-btn" onclick="deletePrintedItem('${collectionName}','${id}','${afterFn}')">🗑 حذف بعد الطباعة</button>
        </div>
      </div>
    </div>
  `;
}

function pc26SafeList(name){
  if(typeof pc21SafeList === "function") return pc21SafeList(name);
  try{
    if(name === "productionLogs" && Array.isArray(productionLogs)) return productionLogs;
    if(name === "wasteLogs" && Array.isArray(wasteLogs)) return wasteLogs;
    if(name === "warehouseOrders" && Array.isArray(warehouseOrders)) return warehouseOrders;
    if(name === "internalIssues" && Array.isArray(internalIssues)) return internalIssues;
    if(name === "cleaningLogs" && Array.isArray(cleaningLogs)) return cleaningLogs;
    if(name === "operationLogs" && Array.isArray(operationLogs)) return operationLogs;
    if(name === "chefs" && Array.isArray(chefs)) return chefs;
  }catch(e){}
  return [];
}

function pc26DateKey(obj){
  if(typeof pc24DateKey === "function") return pc24DateKey(obj);
  if(typeof pc21DateKey === "function") return pc21DateKey(obj);
  if(typeof pc17DateKey === "function") return pc17DateKey(obj);
  try{
    const ms = typeof getTimeValue === "function" ? getTimeValue(obj) : (obj.createdAtMs || obj.issuedAtMs || obj.timeMs || 0);
    if(ms){
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
  }catch(e){}
  return "";
}

function pc26TodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc26Today(list){
  const key = pc26TodayKey();
  return (list || []).filter(x => pc26DateKey(x) === key);
}

function pc26Text(v){
  return escapeHtml(v ?? "");
}

function pc26Qty(items){
  let n = 0;
  (items || []).forEach(i => n += Number(i.qty || 0));
  return n;
}

function pc26IssuedQty(items){
  let n = 0;
  (items || []).forEach(i => n += Number(i.issuedQty ?? i.qty ?? 0));
  return n;
}

function pc26ReportStats(){
  const warehouse = pc26Today(pc26SafeList("warehouseOrders"));
  const internal = pc26Today(pc26SafeList("internalIssues"));
  const production = pc26Today(pc26SafeList("productionLogs"));
  const waste = pc26Today(pc26SafeList("wasteLogs"));
  const cleaning = pc26Today(pc26SafeList("cleaningLogs"));
  const operations = pc26Today(pc26SafeList("operationLogs"));

  let productionQty = 0;
  production.forEach(log => productionQty += pc26Qty(log.items || []));

  return {
    warehouseCount: warehouse.length,
    internalCount: internal.length,
    productionCount: production.length,
    productionQty,
    wasteCount: waste.length,
    cleaningCount: cleaning.length,
    operationsCount: operations.length
  };
}

function pc26SummaryCards(stats){
  return `
    <section class="pdf-summary">
      <div><span>طلبات المستودع</span><b>${stats.warehouseCount}</b></div>
      <div><span>الصرف الداخلي</span><b>${stats.internalCount}</b></div>
      <div><span>إنتاج اليوم</span><b>${stats.productionQty}</b></div>
      <div><span>الهدر</span><b>${stats.wasteCount}</b></div>
      <div><span>النظافة</span><b>${stats.cleaningCount}</b></div>
      <div><span>التشغيل</span><b>${stats.operationsCount}</b></div>
    </section>
  `;
}

function pc26ItemsTable(items, withUnit=true){
  const list = items || [];
  if(!list.length) return `<div class="pdf-empty">لا توجد أصناف</div>`;
  const hasIssued = list.some(i => i.issuedQty !== undefined && i.issuedQty !== null);
  return `
    <table class="pdf-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الصنف</th>
          ${hasIssued ? `<th>المطلوب</th><th>المصروف</th>` : `<th>الكمية</th>`}
          ${withUnit ? `<th>الوحدة</th>` : ``}
        </tr>
      </thead>
      <tbody>
        ${list.map((item,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${pc26Text(item.name || item.productName || item.nameAr || "")}</td>
            ${
              hasIssued
              ? `<td>${pc26Text(item.qty || "")}</td><td>${pc26Text(item.issuedQty ?? item.qty ?? "")}</td>`
              : `<td>${pc26Text(item.qty || "")}</td>`
            }
            ${withUnit ? `<td>${pc26Text(item.unit || "")}</td>` : ``}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function pc26Section(title, icon, html){
  return `
    <section class="pdf-section">
      <div class="pdf-section-head">
        <span>${icon}</span>
        <h3>${pc26Text(title)}</h3>
      </div>
      ${html}
    </section>
  `;
}

function pc26WarehouseReport(source=pc26Today(pc26SafeList("warehouseOrders"))){
  if(!source.length) return `<div class="pdf-empty">لا توجد طلبات مستودع اليوم</div>`;
  return sortNewest(source).map(order=>`
    <div class="pdf-card">
      <div class="pdf-card-title">
        <b>طلب #${pc26Text(order.orderId || order.id || "")}</b>
        <span>${pc26Text(order.status || order.issueStatus || "جديد")}</span>
      </div>
      <div class="pdf-meta-grid">
        <div><span>القسم</span><b>${pc26Text(order.section || "")}</b></div>
        <div><span>الشيف</span><b>${pc26Text(order.chefName || "")}</b></div>
        <div><span>الوقت</span><b>${pc26Text(order.createdAtText || order.issuedAtText || "")}</b></div>
        <div><span>الإجمالي</span><b>${pc26IssuedQty(order.items || [])}</b></div>
      </div>
      ${pc26ItemsTable(order.items, true)}
      ${order.note ? `<div class="pdf-note"><b>ملاحظة:</b> ${pc26Text(order.note)}</div>` : ""}
    </div>
  `).join("");
}

function pc26InternalReport(source=pc26Today(pc26SafeList("internalIssues"))){
  if(!source.length) return `<div class="pdf-empty">لا يوجد صرف داخلي اليوم</div>`;
  return sortNewest(source).map(log=>`
    <div class="pdf-card">
      <div class="pdf-card-title">
        <b>${pc26Text(log.destination || "صرف داخلي")}</b>
        <span>${pc26Text(log.createdAtText || "")}</span>
      </div>
      <div class="pdf-meta-grid">
        <div><span>الموظف</span><b>${pc26Text(log.staff || "")}</b></div>
        <div><span>الجهة</span><b>${pc26Text(log.destination || "")}</b></div>
        <div><span>الأصناف</span><b>${(log.items || []).length}</b></div>
        <div><span>الإجمالي</span><b>${pc26Qty(log.items || [])}</b></div>
      </div>
      ${pc26ItemsTable(log.items, true)}
      ${log.note ? `<div class="pdf-note"><b>ملاحظة:</b> ${pc26Text(log.note)}</div>` : ""}
    </div>
  `).join("");
}

function pc26ProductionReport(source=pc26Today(pc26SafeList("productionLogs"))){
  if(!source.length) return `<div class="pdf-empty">لا يوجد إنتاج اليوم</div>`;
  return sortNewest(source).map(log=>`
    <div class="pdf-card">
      <div class="pdf-card-title">
        <b>${pc26Text(log.section || "إنتاج")}</b>
        <span>${pc26Text(log.createdAtText || "")}</span>
      </div>
      <div class="pdf-meta-grid">
        <div><span>الشيف</span><b>${pc26Text(log.chefName || "")}</b></div>
        <div><span>القسم</span><b>${pc26Text(log.section || "")}</b></div>
        <div><span>الأصناف</span><b>${(log.items || []).length}</b></div>
        <div><span>الإجمالي</span><b>${pc26Qty(log.items || [])}</b></div>
      </div>
      ${log.noProduction ? `<div class="pdf-empty">لا يوجد إنتاج لهذا اليوم</div>` : pc26ItemsTable(log.items, false)}
      ${log.note ? `<div class="pdf-note"><b>ملاحظة:</b> ${pc26Text(log.note)}</div>` : ""}
    </div>
  `).join("");
}

function pc26WasteReport(source=pc26Today(pc26SafeList("wasteLogs"))){
  if(!source.length) return `<div class="pdf-empty">لا يوجد هدر اليوم</div>`;
  return `
    <table class="pdf-table">
      <thead>
        <tr><th>#</th><th>القسم</th><th>الشيف</th><th>الصنف</th><th>الكمية</th><th>السبب</th><th>الوقت</th></tr>
      </thead>
      <tbody>
        ${sortNewest(source).map((log,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${pc26Text(log.section || "")}</td>
            <td>${pc26Text(log.chefName || "")}</td>
            <td>${pc26Text(log.productName || log.name || "")}</td>
            <td>${pc26Text(log.qty || "")}</td>
            <td>${pc26Text(log.reason || "")}</td>
            <td>${pc26Text(log.createdAtText || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function pc26CleaningReport(source=pc26Today(pc26SafeList("cleaningLogs"))){
  if(!source.length) return `<div class="pdf-empty">لا توجد تقارير نظافة اليوم</div>`;
  return sortNewest(source).map(log=>`
    <div class="pdf-card">
      <div class="pdf-card-title">
        <b>${pc26Text((typeof pc24ShiftName === "function" ? pc24ShiftName(log.shift) : log.shift) || "النظافة")}</b>
        <span>${pc26Text(log.createdAtText || "")}</span>
      </div>
      <div class="pdf-meta-grid">
        <div><span>المسؤول</span><b>${pc26Text(log.workerName || log.responsible || "")}</b></div>
        <div><span>المكتمل</span><b>${(log.entries || []).filter(e=>e.done).length}</b></div>
        <div><span>الإجمالي</span><b>${(log.entries || []).length}</b></div>
        <div><span>الحالة</span><b>${(log.entries || []).every(e=>e.done) ? "مكتمل" : "ناقص"}</b></div>
      </div>
      <table class="pdf-table">
        <thead><tr><th>#</th><th>المهمة</th><th>الحالة</th></tr></thead>
        <tbody>
          ${(log.entries || []).map((e,i)=>`
            <tr>
              <td>${i+1}</td>
              <td>${pc26Text(e.nameAr || e.name || "")}</td>
              <td>${e.done ? "تم" : "ناقص"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${log.note ? `<div class="pdf-note"><b>ملاحظة:</b> ${pc26Text(log.note)}</div>` : ""}
    </div>
  `).join("");
}

function pc26OperationsReport(source=pc26Today(pc26SafeList("operationLogs"))){
  if(!source.length) return `<div class="pdf-empty">لا توجد تقارير تشغيل اليوم</div>`;
  return `
    <table class="pdf-table">
      <thead>
        <tr><th>#</th><th>الفترة</th><th>المهمة</th><th>المسؤول</th><th>الحالة</th><th>الوقت</th><th>ملاحظة</th></tr>
      </thead>
      <tbody>
        ${sortNewest(source).map((log,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${pc26Text(log.period || "")}</td>
            <td>${pc26Text(log.taskName || "")}</td>
            <td>${pc26Text(log.operatorName || "")}</td>
            <td>${log.done !== false ? "تم" : "ناقص"}</td>
            <td>${pc26Text(log.createdAtText || log.completedAtText || "")}</td>
            <td>${pc26Text(log.note || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function pc26FullBody(){
  const stats = pc26ReportStats();
  return `
    ${pc26SummaryCards(stats)}
    ${pc26Section("المستودع", "📦", pc26WarehouseReport())}
    ${pc26Section("الصرف الداخلي", "🔁", pc26InternalReport())}
    ${pc26Section("الإنتاج", "📈", pc26ProductionReport())}
    ${pc26Section("الهدر والتالف", "⚠️", pc26WasteReport())}
    ${pc26Section("النظافة", "🧹", pc26CleaningReport())}
    ${pc26Section("التشغيل", "🏭", pc26OperationsReport())}
  `;
}

function pc26PrintCss(){
  return `
    <style>
      @page{size:A4;margin:12mm}
      *{box-sizing:border-box}
      body{
        font-family:Arial,Tahoma,sans-serif;
        direction:rtl;
        background:#f7f8ef;
        color:#263322;
        padding:0;
        margin:0;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }
      .pdf-wrap{
        width:100%;
        padding:0;
      }
      .pdf-cover{
        background:linear-gradient(135deg,#2f5f1f,#113820);
        color:white;
        border-radius:22px;
        padding:22px;
        margin-bottom:14px;
        position:relative;
        overflow:hidden;
      }
      .pdf-cover:before{
        content:"";
        position:absolute;
        width:180px;
        height:180px;
        border-radius:50%;
        background:rgba(244,197,66,.16);
        top:-90px;
        left:-60px;
      }
      .pdf-cover h1{
        margin:0;
        color:white;
        font-size:28px;
        font-weight:900;
      }
      .pdf-cover h2{
        margin:6px 0 0;
        color:#f4c542;
        font-size:18px;
      }
      .pdf-cover .meta{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:14px;
      }
      .pdf-cover .meta span{
        background:rgba(255,255,255,.12);
        border:1px solid rgba(255,255,255,.18);
        padding:7px 12px;
        border-radius:999px;
        font-weight:700;
        color:white;
      }
      .pdf-summary{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:8px;
        margin-bottom:14px;
      }
      .pdf-summary div{
        background:white;
        border:1px solid #e5eadb;
        border-radius:16px;
        padding:12px;
        box-shadow:0 5px 14px rgba(18,51,37,.06);
      }
      .pdf-summary span{
        display:block;
        color:#7b8674;
        font-weight:700;
        font-size:11px;
      }
      .pdf-summary b{
        display:block;
        color:#2f5f1f;
        font-size:22px;
        margin-top:4px;
      }
      .pdf-section{
        background:white;
        border:1px solid #e5eadb;
        border-radius:18px;
        padding:14px;
        margin:12px 0;
        page-break-inside:avoid;
      }
      .pdf-section-head{
        display:flex;
        align-items:center;
        gap:8px;
        border-bottom:2px solid #eef3e8;
        padding-bottom:9px;
        margin-bottom:10px;
      }
      .pdf-section-head span{
        width:34px;
        height:34px;
        border-radius:12px;
        background:#eff9f0;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .pdf-section-head h3{
        margin:0;
        color:#2f5f1f;
        font-size:18px;
      }
      .pdf-card{
        border:1px solid #e5eadb;
        border-radius:14px;
        padding:12px;
        margin:10px 0;
        page-break-inside:avoid;
      }
      .pdf-card-title{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        margin-bottom:10px;
      }
      .pdf-card-title b{
        color:#2f5f1f;
        font-size:16px;
      }
      .pdf-card-title span{
        background:#eff9f0;
        color:#2f5f1f;
        padding:5px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:700;
      }
      .pdf-meta-grid{
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:8px;
        margin-bottom:10px;
      }
      .pdf-meta-grid div{
        background:#f7f8ef;
        border-radius:12px;
        padding:8px;
      }
      .pdf-meta-grid span{
        display:block;
        color:#7b8674;
        font-size:10px;
        font-weight:700;
      }
      .pdf-meta-grid b{
        display:block;
        color:#263322;
        font-size:12px;
        margin-top:3px;
      }
      .pdf-table{
        width:100%;
        border-collapse:collapse;
        margin-top:8px;
        font-size:11px;
      }
      .pdf-table th{
        background:#2f5f1f;
        color:white;
        border:1px solid #2f5f1f;
        padding:7px;
        text-align:center;
      }
      .pdf-table td{
        border:1px solid #dfe7d7;
        padding:7px;
        text-align:center;
      }
      .pdf-table tbody tr:nth-child(even) td{
        background:#fafbf5;
      }
      .pdf-note{
        background:#fff6d6;
        color:#5f4800;
        border-radius:12px;
        padding:9px;
        margin-top:8px;
        font-size:11px;
      }
      .pdf-empty{
        background:#f7f8ef;
        border:1px dashed #dfe7d7;
        border-radius:14px;
        padding:14px;
        text-align:center;
        color:#7b8674;
        font-weight:700;
      }
      @media print{
        .pdf-section{break-inside:avoid}
        .pdf-card{break-inside:avoid}
      }
    </style>
  `;
}

function openPrintReport(title, bodyHtml){
  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${pc26Text(title)}</title>
        ${pc26PrintCss()}
      </head>
      <body>
        <main class="pdf-wrap">
          <section class="pdf-cover">
            <h1>Protein & Carb Operations</h1>
            <h2>${pc26Text(title)}</h2>
            <div class="meta">
              <span>${pc26Text(typeof todayDate === "function" ? todayDate() : "")}</span>
              <span>${pc26Text(typeof nowText === "function" ? nowText() : "")}</span>
              <span>تقرير إداري</span>
            </div>
          </section>
          ${bodyHtml}
        </main>
        <script>
          setTimeout(()=>window.print(), 350);
        <\/script>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if(!win){
    if(typeof showToast === "function") showToast("المتصفح منع فتح نافذة الطباعة");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function renderAdminPDF(){
  pageLayout("التقارير PDF", `
    <section class="pc26-pdf-page">
      <div class="pc26-pdf-hero">
        <span>PDF Premium</span>
        <h2>تقارير الإدارة</h2>
        <p>اختر التقرير واحفظه PDF من نافذة الطباعة.</p>
      </div>

      <section class="pc26-pdf-grid">
        <button type="button" onclick="printFullDailyReport()">
          <i class="fa-solid fa-file-lines"></i>
          <b>التقرير اليومي الشامل</b>
          <span>كل الأقسام</span>
        </button>
        <button type="button" onclick="printWarehouseReport()">
          <i class="fa-solid fa-boxes-stacked"></i>
          <b>تقرير المستودع</b>
          <span>طلبات + صرف داخلي</span>
        </button>
        <button type="button" onclick="printAllProduction()">
          <i class="fa-solid fa-chart-line"></i>
          <b>تقرير الإنتاج</b>
          <span>إنتاج الشيفات</span>
        </button>
        <button type="button" onclick="printAllWaste()">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <b>تقرير الهدر</b>
          <span>الهدر والتالف</span>
        </button>
        <button type="button" onclick="printAllCleaning()">
          <i class="fa-solid fa-broom"></i>
          <b>تقرير النظافة</b>
          <span>مهام النظافة</span>
        </button>
        <button type="button" onclick="printAllOperations()">
          <i class="fa-solid fa-industry"></i>
          <b>تقرير التشغيل</b>
          <span>مهام التشغيل</span>
        </button>
      </section>
    </section>
    ${typeof pc18BottomNav === "function" ? pc18BottomNav("admin") : ""}
  `,"renderAdmin()");
}

function printFullDailyReport(){
  openPrintReport("التقرير اليومي الشامل", pc26FullBody());
}

function printWarehouseReport(){
  openPrintReport("تقرير المستودع", `
    ${pc26SummaryCards(pc26ReportStats())}
    ${pc26Section("طلبات المستودع", "📦", pc26WarehouseReport())}
    ${pc26Section("الصرف الداخلي", "🔁", pc26InternalReport())}
  `);
}

function printAllProduction(){
  openPrintReport("تقرير الإنتاج", pc26Section("الإنتاج", "📈", pc26ProductionReport()));
}

function printAllWaste(){
  openPrintReport("تقرير الهدر والتالف", pc26Section("الهدر والتالف", "⚠️", pc26WasteReport()));
}

function printAllCleaning(){
  openPrintReport("تقرير النظافة", pc26Section("النظافة", "🧹", pc26CleaningReport()));
}

function printAllOperations(){
  openPrintReport("تقرير التشغيل", pc26Section("التشغيل", "🏭", pc26OperationsReport()));
}

function printReport(type){
  if(type === "production") return printAllProduction();
  if(type === "waste") return printAllWaste();
  if(type === "operations") return printAllOperations();
  if(type === "cleaning") return printAllCleaning();
  if(type === "internal") return printWarehouseReport();
  return printFullDailyReport();
}

function printWarehouseOrder(id){
  const order = pc26SafeList("warehouseOrders").find(o=>o.id === id);
  if(!order) return;
  if(typeof markPrinted === "function") markPrinted("warehouse_orders", id);
  openPrintReport("طلب مستودع", pc26Section("طلب مستودع", "📦", pc26WarehouseReport([order])));
}

function printInternalIssue(id){
  const log = pc26SafeList("internalIssues").find(i=>i.id === id);
  if(!log) return;
  if(typeof markPrinted === "function") markPrinted("internal_issues", id);
  openPrintReport("صرف داخلي", pc26Section("صرف داخلي", "🔁", pc26InternalReport([log])));
}

let pc27CleaningShift = "morning";
let pc27CleaningDraft = {};
let pc27OperationsPeriod = "opening";
let pc27OperationsDraft = {};

function pc27List(name){
  try{
    if(typeof pc26SafeList === "function") return pc26SafeList(name);
    if(typeof pc24SafeList === "function") return pc24SafeList(name);
    if(typeof pc21SafeList === "function") return pc21SafeList(name);
  }catch(e){}
  try{
    if(name === "cleaningTasks" && Array.isArray(cleaningTasks)) return cleaningTasks;
    if(name === "cleaningLogs" && Array.isArray(cleaningLogs)) return cleaningLogs;
    if(name === "operationTasks" && Array.isArray(operationTasks)) return operationTasks;
    if(name === "operationLogs" && Array.isArray(operationLogs)) return operationLogs;
    if(name === "productionLogs" && Array.isArray(productionLogs)) return productionLogs;
    if(name === "warehouseOrders" && Array.isArray(warehouseOrders)) return warehouseOrders;
    if(name === "wasteLogs" && Array.isArray(wasteLogs)) return wasteLogs;
    if(name === "internalIssues" && Array.isArray(internalIssues)) return internalIssues;
  }catch(e){}
  return [];
}

function pc27DateKey(obj){
  try{
    if(typeof pc26DateKey === "function") return pc26DateKey(obj);
    if(typeof pc24DateKey === "function") return pc24DateKey(obj);
    if(typeof pc21DateKey === "function") return pc21DateKey(obj);
  }catch(e){}
  try{
    const ms = typeof getTimeValue === "function" ? getTimeValue(obj) : (obj.createdAtMs || obj.timeMs || obj.issuedAtMs || 0);
    if(ms){
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
  }catch(e){}
  return "";
}

function pc27TodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc27Today(list){
  const k = pc27TodayKey();
  return (list || []).filter(x => pc27DateKey(x) === k);
}

function pc27Setting(key, fallback){
  try{
    if(typeof systemSettings !== "undefined" && systemSettings && systemSettings[key]) return systemSettings[key];
  }catch(e){}
  return fallback;
}

function pc27Bottom(active){
  return typeof pc18BottomNav === "function" ? pc18BottomNav(active || "home") : "";
}

function pc27PeriodLabel(period){
  const map = {
    opening: pc27Setting("openingTimeLabel","قبل الافتتاح"),
    noon: pc27Setting("noonTimeLabel","منتصف اليوم"),
    closing: pc27Setting("closingTimeLabel","الإغلاق"),
    morning: pc27Setting("cleaningMorningLabel","قبل الافتتاح"),
    afternoon: pc27Setting("cleaningAfternoonLabel","منتصف اليوم"),
    night: pc27Setting("cleaningNightLabel","الإغلاق")
  };
  try{
    if(typeof shiftLabels !== "undefined" && shiftLabels[period]?.ar) return shiftLabels[period].ar;
  }catch(e){}
  return map[period] || period || "اليوم";
}

function pc27TimeValue(x){
  try{
    if(typeof getTimeValue === "function") return getTimeValue(x);
  }catch(e){}
  return x.createdAtMs || x.timeMs || 0;
}

function pc27LatestCleaningLog(shift){
  const logs = pc27Today(pc27List("cleaningLogs")).filter(l=>l.shift === shift).sort((a,b)=>pc27TimeValue(b)-pc27TimeValue(a));
  return logs[0] || null;
}

function pc27OperationDoneMap(){
  const map = {};
  pc27Today(pc27List("operationLogs")).forEach(l=>{
    if(l.taskId) map[String(l.taskId)] = l;
    if(l.taskName) map[String(l.taskName)] = l;
  });
  return map;
}

function pc27TaskName(t){
  return t.nameAr || t.name || t.title || "مهمة";
}

function pc27TaskMeta(t){
  return [t.nameBn, t.note, t.description].filter(Boolean).join(" • ");
}

function pc27CleaningStats(){
  const shifts = ["morning","afternoon","night"];
  let total = 0, done = 0;
  shifts.forEach(shift=>{
    const tasks = pc27CleaningTasks(shift);
    const latest = pc27LatestCleaningLog(shift);
    total += tasks.length;
    if(latest && latest.entries){
      done += latest.entries.filter(e=>e.done).length;
    }
  });
  return {total, done, missing:Math.max(0,total-done), reports:pc27Today(pc27List("cleaningLogs")).length};
}

function pc27OperationStats(){
  const doneMap = pc27OperationDoneMap();
  const tasks = pc27List("operationTasks");
  const done = tasks.filter(t=>doneMap[String(t.id)] || doneMap[String(pc27TaskName(t))]).length;
  return {total:tasks.length, done, missing:Math.max(0,tasks.length-done), reports:pc27Today(pc27List("operationLogs")).length};
}

function pc27PremiumHead(title, subtitle, backFn){
  return `
    <div class="pc27-head">
      <button type="button" onclick="${backFn || "renderHome()"}"><i class="fa-solid fa-arrow-right"></i></button>
      <div>
        <span>Protein & Carb Operations</span>
        <h1>${escapeHtml(title)}</h1>
        <small>${escapeHtml(subtitle || (typeof todayDate === "function" ? todayDate() : ""))}</small>
      </div>
      <button type="button" onclick="renderAdminGate()"><i class="fa-solid fa-gauge-high"></i></button>
    </div>
  `;
}

function pc27DrawCleaningTasksCore(){
  const box = document.getElementById("pc27CleaningTasksBox");
  if(!box) return;
  const tasks = pc27CleaningTasks(pc27CleaningShift);
  const latest = pc27LatestCleaningLog(pc27CleaningShift);
  const latestMap = {};
  if(latest && latest.entries){
    latest.entries.forEach(e=>latestMap[String(e.taskId || e.nameAr || e.name || "")] = !!e.done);
  }

  if(!tasks.length){
    box.innerHTML = `<div class="pc27-empty">لا توجد مهام نظافة مضافة لهذه الفترة</div>`;
    return;
  }

  box.innerHTML = tasks.map(t=>{
    const key = String(t.id || pc27TaskName(t));
    const checked = pc27CleaningDraft[key] !== undefined ? pc27CleaningDraft[key] : !!latestMap[key];
    return `
      <button type="button" class="pc27-task-row ${checked ? "done" : ""}" onclick="pc27CleaningDraft['${key.replace(/'/g,"\\'")}']=!${checked};pc27DrawCleaningTasks()">
        <i class="fa-solid ${checked ? "fa-circle-check" : "fa-circle"}"></i>
        <div>
          <b>${escapeHtml(pc27TaskName(t))}</b>
          ${pc27TaskMeta(t) ? `<small>${escapeHtml(pc27TaskMeta(t))}</small>` : `<small>${escapeHtml(pc27PeriodLabel(pc27CleaningShift))}</small>`}
        </div>
      </button>
    `;
  }).join("");
}

async function pc27SubmitCleaningCore(){
  const tasks = pc27CleaningTasks(pc27CleaningShift);
  if(!tasks.length){
    showToast("لا توجد مهام للحفظ","error");
    return;
  }
  const responsible = document.getElementById("pc27CleaningResponsible")?.value?.trim() || "";
  const note = document.getElementById("pc27CleaningNote")?.value?.trim() || "";
  const entries = tasks.map(t=>{
    const key = String(t.id || pc27TaskName(t));
    return {
      taskId:t.id || "",
      nameAr:pc27TaskName(t),
      nameBn:t.nameBn || "",
      done:!!pc27CleaningDraft[key]
    };
  });

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"cleaning_logs"),{
    branchId:currentBranch,
    shift:pc27CleaningShift,
    workerName:responsible,
    responsible,
    entries,
    note,
    createdAt:serverTimestamp(),
    createdAtMs:Date.now(),
    createdAtText:nowText()
  });

  pc27CleaningDraft = {};
  showToast("تم حفظ تقرير النظافة");
  renderCleaning();
}

function renderCleaning(){
  const st = pc27CleaningStats();
  pageLayout("النظافة", `
    <section class="pc27-page">
      ${pc27PremiumHead("النظافة","مهام الفترات اليومية","renderHome()")}

      <section class="pc27-hero">
        <span>Cleaning Control</span>
        <h2>متابعة النظافة</h2>
        <p>اختر الفترة، علّم المهام، ثم احفظ التقرير.</p>
      </section>

      <section class="pc27-kpis">
        <div><span>المهام</span><b>${st.total}</b><small>إجمالي</small></div>
        <div class="${st.missing ? "warn" : "ok"}"><span>المكتمل</span><b>${st.done}</b><small>${st.missing ? `${st.missing} ناقص` : "مكتمل"}</small></div>
      </section>

      ${pc27ShiftTabs(pc27CleaningShift,"cleaning")}

      <section class="pc27-panel">
        <div class="pc27-panel-head">
          <h3>${escapeHtml(pc27PeriodLabel(pc27CleaningShift))}</h3>
          <span>${pc27CleaningTasks(pc27CleaningShift).length} مهام</span>
        </div>
        <input id="pc27CleaningResponsible" placeholder="اسم المسؤول">
        <div id="pc27CleaningTasksBox"></div>
        <textarea id="pc27CleaningNote" placeholder="ملاحظة"></textarea>
        <button class="btn btn-main pc27-wide" type="button" onclick="pc27SubmitCleaning()">حفظ تقرير النظافة</button>
      </section>
    </section>
    ${pc27Bottom("home")}
  `,"renderHome()");
  pc27DrawCleaningTasks();
}

function pc27DrawOperationTasksCore(){
  const box = document.getElementById("pc27OperationTasksBox");
  if(!box) return;
  const tasks = pc27OperationTasks(pc27OperationsPeriod);
  const doneMap = pc27OperationDoneMap();

  if(!tasks.length){
    box.innerHTML = `<div class="pc27-empty">لا توجد مهام تشغيل مضافة لهذه الفترة</div>`;
    return;
  }

  box.innerHTML = tasks.map(t=>{
    const key = String(t.id || pc27TaskName(t));
    const already = !!(doneMap[String(t.id)] || doneMap[String(pc27TaskName(t))]);
    const checked = pc27OperationsDraft[key] !== undefined ? pc27OperationsDraft[key] : already;
    return `
      <button type="button" class="pc27-task-row ${checked ? "done" : ""}" onclick="pc27OperationsDraft['${key.replace(/'/g,"\\'")}']=!${checked};pc27DrawOperationTasks()">
        <i class="fa-solid ${checked ? "fa-circle-check" : "fa-circle"}"></i>
        <div>
          <b>${escapeHtml(pc27TaskName(t))}</b>
          ${pc27TaskMeta(t) ? `<small>${escapeHtml(pc27TaskMeta(t))}</small>` : `<small>${escapeHtml(pc27PeriodLabel(pc27OperationsPeriod))}</small>`}
        </div>
      </button>
    `;
  }).join("");
}

async function pc27SubmitOperationsCore(){
  const tasks = pc27OperationTasks(pc27OperationsPeriod);
  if(!tasks.length){
    showToast("لا توجد مهام للحفظ","error");
    return;
  }
  const operatorName = document.getElementById("pc27OperationResponsible")?.value?.trim() || "";
  const note = document.getElementById("pc27OperationNote")?.value?.trim() || "";
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;

  for(const t of tasks){
    const key = String(t.id || pc27TaskName(t));
    await addDoc(collection(db,"operation_logs"),{
    branchId:currentBranch,
      period:pc27OperationsPeriod,
      taskId:t.id || "",
      taskName:pc27TaskName(t),
      operatorName,
      done:!!pc27OperationsDraft[key],
      note,
      createdAt:serverTimestamp(),
      createdAtMs:Date.now(),
      createdAtText:nowText()
    });
  }

  pc27OperationsDraft = {};
  showToast("تم حفظ تقرير التشغيل");
  renderOperations();
}

function renderOperations(){
  const st = pc27OperationStats();
  pageLayout("التشغيل", `
    <section class="pc27-page">
      ${pc27PremiumHead("التشغيل","مهام الفتح والإغلاق","renderHome()")}

      <section class="pc27-hero">
        <span>Operations Control</span>
        <h2>متابعة التشغيل</h2>
        <p>تابع فتح الفرع، منتصف اليوم، والإغلاق بشكل واضح.</p>
      </section>

      <section class="pc27-kpis">
        <div><span>المهام</span><b>${st.total}</b><small>إجمالي</small></div>
        <div class="${st.missing ? "warn" : "ok"}"><span>المكتمل</span><b>${st.done}</b><small>${st.missing ? `${st.missing} ناقص` : "مكتمل"}</small></div>
      </section>

      ${pc27ShiftTabs(pc27OperationsPeriod,"operations")}

      <section class="pc27-panel">
        <div class="pc27-panel-head">
          <h3>${escapeHtml(pc27PeriodLabel(pc27OperationsPeriod))}</h3>
          <span>${pc27OperationTasks(pc27OperationsPeriod).length} مهام</span>
        </div>
        <input id="pc27OperationResponsible" placeholder="اسم المسؤول">
        <div id="pc27OperationTasksBox"></div>
        <textarea id="pc27OperationNote" placeholder="ملاحظة"></textarea>
        <button class="btn btn-main pc27-wide" type="button" onclick="pc27SubmitOperations()">حفظ تقرير التشغيل</button>
      </section>
    </section>
    ${pc27Bottom("home")}
  `,"renderHome()");
  pc27DrawOperationTasks();
}

function pc27ArchiveMap(){
  const rows = [];
  [
    ["productionLogs","الإنتاج"],
    ["warehouseOrders","المستودع"],
    ["wasteLogs","الهدر"],
    ["cleaningLogs","النظافة"],
    ["operationLogs","التشغيل"],
    ["internalIssues","الصرف الداخلي"]
  ].forEach(([name,label])=>{
    pc27List(name).forEach(x=>{
      const d = pc27DateKey(x);
      if(d) rows.push({date:d,label,item:x});
    });
  });

  const map = {};
  rows.forEach(r=>{
    if(!map[r.date]) map[r.date] = {};
    if(!map[r.date][r.label]) map[r.date][r.label] = 0;
    map[r.date][r.label]++;
  });
  return map;
}

function pc27CleaningTasks(shift){
  const tasks = pc27List("cleaningTasks");
  if(!tasks.length) return [];

  const valTrue = v => v === true || v === "true" || v === 1 || v === "1" || v === "on";

  const filtered = tasks.filter(t=>{
    const s = String(t.shift || t.period || t.timeKey || "").trim();
    if(s && s === shift) return true;
    if(shift === "morning" && (valTrue(t.morning) || s.includes("افتتاح") || s.includes("صباح"))) return true;
    if(shift === "afternoon" && (valTrue(t.afternoon) || s.includes("ظهر") || s.includes("منتصف"))) return true;
    if(shift === "night" && (valTrue(t.night) || s.includes("إغلاق") || s.includes("اغلاق") || s.includes("ليل"))) return true;
    return false;
  });

  return filtered.length ? filtered : tasks;
}

function pc28OperationPeriods(){
  const tasks = pc27List("operationTasks");
  const periods = [];

  tasks.forEach(t=>{
    const p = String(t.period || t.timeKey || t.shift || "").trim();
    if(p && !periods.includes(p)) periods.push(p);
  });

  if(periods.length) return periods;
  return ["قبل الافتتاح","منتصف اليوم","الإغلاق"];
}

function pc27OperationTasks(period){
  const tasks = pc27List("operationTasks");
  if(!tasks.length) return [];

  const active = String(period || "").trim();

  const filtered = tasks.filter(t=>{
    const p = String(t.period || t.timeKey || t.shift || "").trim();
    if(!p && !active) return true;
    if(p === active) return true;
    if(active === "opening" && (p.includes("افتتاح") || p.includes("فتح"))) return true;
    if(active === "noon" && (p.includes("ظهر") || p.includes("منتصف") || p.includes("12"))) return true;
    if(active === "closing" && (p.includes("إغلاق") || p.includes("اغلاق") || p.includes("قفل"))) return true;
    return false;
  });

  return filtered.length ? filtered : tasks;
}

function pc27ShiftTabs(active, type){
  if(type === "operations"){
    const periods = pc28OperationPeriods();
    if(!periods.includes(pc27OperationsPeriod)){
      pc27OperationsPeriod = periods[0] || "قبل الافتتاح";
      active = pc27OperationsPeriod;
    }

    return `
      <section class="pc27-tabs">
        ${periods.map(period=>`
          <button type="button" class="${active===period?"active":""}" onclick="pc27OperationsPeriod='${escapeHtml(period)}';renderOperations()">
            ${escapeHtml(period)}
          </button>
        `).join("")}
      </section>
    `;
  }

  const tabs = [["morning","قبل الافتتاح"],["afternoon","منتصف اليوم"],["night","الإغلاق"]];
  return `
    <section class="pc27-tabs">
      ${tabs.map(t=>`
        <button type="button" class="${active===t[0]?"active":""}" onclick="pc27CleaningShift='${t[0]}';renderCleaning()">
          ${pc27PeriodLabel(t[0]) || t[1]}
        </button>
      `).join("")}
    </section>
  `;
}

function pc28ByDate(name,date){
  return pc27List(name).filter(x=>pc27DateKey(x)===date);
}

function pc28ReportStatsForDate(date){
  const warehouse = pc28ByDate("warehouseOrders",date);
  const internal = pc28ByDate("internalIssues",date);
  const production = pc28ByDate("productionLogs",date);
  const waste = pc28ByDate("wasteLogs",date);
  const cleaning = pc28ByDate("cleaningLogs",date);
  const operations = pc28ByDate("operationLogs",date);

  let productionQty = 0;
  production.forEach(log => productionQty += pc26Qty(log.items || []));

  return {
    warehouseCount: warehouse.length,
    internalCount: internal.length,
    productionCount: production.length,
    productionQty,
    wasteCount: waste.length,
    cleaningCount: cleaning.length,
    operationsCount: operations.length
  };
}

function pc28ReportBodyForDate(date){
  const stats = pc28ReportStatsForDate(date);
  return `
    ${pc26SummaryCards(stats)}
    ${pc26Section("المستودع", "📦", pc26WarehouseReport(pc28ByDate("warehouseOrders",date)))}
    ${pc26Section("الصرف الداخلي", "🔁", pc26InternalReport(pc28ByDate("internalIssues",date)))}
    ${pc26Section("الإنتاج", "📈", pc26ProductionReport(pc28ByDate("productionLogs",date)))}
    ${pc26Section("الهدر والتالف", "⚠️", pc26WasteReport(pc28ByDate("wasteLogs",date)))}
    ${pc26Section("النظافة", "🧹", pc26CleaningReport(pc28ByDate("cleaningLogs",date)))}
    ${pc26Section("التشغيل", "🏭", pc26OperationsReport(pc28ByDate("operationLogs",date)))}
  `;
}

function pc28PrintArchiveDay(date){
  if(typeof openPrintReport === "function"){
    return openPrintReport(`تقرير يوم ${date}`, pc28ReportBodyForDate(date));
  }
  window.print();
}

function renderAdminArchive(){
  const map = pc27ArchiveMap();
  const dates = Object.keys(map).sort().reverse();

  pageLayout("الأرشيف", `
    <section class="pc27-page">
      ${pc27PremiumHead("الأرشيف","تقارير الأيام","renderAdmin()")}

      <section class="pc27-hero">
        <span>Archive Reports</span>
        <h2>أرشيف التقارير</h2>
        <p>افتح أي يوم لعرض التقرير الكامل وطباعته.</p>
      </section>

      <section class="pc27-panel">
        ${dates.length ? dates.map(date=>`
          <div class="pc27-archive-card">
            <div>
              <b>${escapeHtml(date)}</b>
              <small>${Object.entries(map[date]).map(([k,v])=>`${k}: ${v}`).join(" • ")}</small>
            </div>
            <button type="button" onclick="pc27OpenArchiveDay('${date}')">عرض التقرير</button>
          </div>
        `).join("") : `<div class="pc27-empty">لا توجد بيانات أرشيف حتى الآن</div>`}
      </section>
    </section>
    ${pc27Bottom("admin")}
  `,"renderAdmin()");
}

function pc27OpenArchiveDay(date){
  const stats = pc28ReportStatsForDate(date);

  pageLayout("تقرير الأرشيف", `
    <section class="pc28-archive-report">
      ${pc27PremiumHead(`تقرير ${date}`,"تقرير كامل قابل للطباعة","renderAdminArchive()")}

      <section class="pc27-hero">
        <span>Daily Report</span>
        <h2>تقرير يوم ${escapeHtml(date)}</h2>
        <p>ملخص كامل للمستودع، الإنتاج، الهدر، النظافة والتشغيل.</p>
      </section>

      <section class="pc28-print-actions">
        <button type="button" class="btn btn-main" onclick="pc28PrintArchiveDay('${date}')">
          <i class="fa-solid fa-print"></i> طباعة التقرير
        </button>
      </section>

      <section class="pc28-report-preview">
        ${pc26SummaryCards(stats)}
        ${pc26Section("المستودع", "📦", pc26WarehouseReport(pc28ByDate("warehouseOrders",date)))}
        ${pc26Section("الصرف الداخلي", "🔁", pc26InternalReport(pc28ByDate("internalIssues",date)))}
        ${pc26Section("الإنتاج", "📈", pc26ProductionReport(pc28ByDate("productionLogs",date)))}
        ${pc26Section("الهدر والتالف", "⚠️", pc26WasteReport(pc28ByDate("wasteLogs",date)))}
        ${pc26Section("النظافة", "🧹", pc26CleaningReport(pc28ByDate("cleaningLogs",date)))}
        ${pc26Section("التشغيل", "🏭", pc26OperationsReport(pc28ByDate("operationLogs",date)))}
      </section>
    </section>
    ${pc27Bottom("admin")}
  `,"renderAdminArchive()");
}

function pc32TodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pc32DateKey(x){
  try{
    if(typeof pc27DateKey === "function") return pc27DateKey(x);
    if(typeof pc24DateKey === "function") return pc24DateKey(x);
    if(typeof pc21DateKey === "function") return pc21DateKey(x);
  }catch(e){}
  return "";
}

function pc32Today(list){
  const key = pc32TodayKey();
  return (list || []).filter(x=>pc32DateKey(x)===key);
}

function pc32Counts(){
  let prodQty = 0;
  pc32Today(productionLogs || []).forEach(log=>(log.items||[]).forEach(i=>prodQty += Number(i.qty||0)));
  const newWh = (warehouseOrders||[]).filter(o=>o.status==="جديد" || !o.status).length;
  const pending = (chefs||[]).filter(c=>!pc32Today(productionLogs||[]).some(log=>pcMine(log,c))).length;
  return {prodQty,newWh,pending};
}

function renderSettingsOverview(){
  pcSetScope("all");
  settingsShell("overview","الإعدادات","");
}

function pc33NotificationRows(){
  const rows = [];
  if(!pcSynced()) return rows;
  const c = typeof pc32Counts === "function" ? pc32Counts() : {newWh:0,pending:0};
  const sup = pc91Requests();
  if(sup.length){
    rows.push({icon:"fa-triangle-exclamation", title:"صنف غير متوفر يرجى توفيره بسرعة", meta:sup.slice(0,4).join("، ")+(sup.length>4?` +${sup.length-4}`:""), fn:"renderWarehouseGate()"});
  }

  if(c.newWh){
    rows.push({
      icon:"fa-boxes-stacked",
      title:"طلبات مستودع جديدة",
      meta:`${c.newWh} طلب يحتاج متابعة`,
      fn:"renderWarehouseGate()"
    });
  }

  if(c.pending){
    rows.push({
      icon:"fa-user-clock",
      title:"إنتاج معلق",
      meta:`${c.pending} شيف لم يسجل الإنتاج`,
      fn:"renderAdminGate()"
    });
  }

  try{
    const cs = typeof pc27CleaningStats === "function" ? pc27CleaningStats() : {missing:0};
    if(cs.missing){
      rows.push({
        icon:"fa-broom",
        title:"مهام نظافة ناقصة",
        meta:`${cs.missing} مهمة تحتاج متابعة`,
        fn:"renderCleaning()"
      });
    }
  }catch(e){}

  try{
    const os = typeof pc27OperationStats === "function" ? pc27OperationStats() : {missing:0};
    if(os.missing){
      rows.push({
        icon:"fa-industry",
        title:"مهام تشغيل ناقصة",
        meta:`${os.missing} مهمة تحتاج متابعة`,
        fn:"renderOperations()"
      });
    }
  }catch(e){}

  return rows;
}

function renderNotifications(){
  const rows = pc33NotificationRows();

  app.innerHTML = `
    <main class="app pc33-notifications-page">
      <section class="pc32-settings-head">
        <button type="button" onclick="renderHome()"><i class="fa-solid fa-arrow-right"></i></button>
        <div>
          <span>الإشعارات</span>
          <h1>التنبيهات</h1>
          <small>الأشياء التي تحتاج متابعة</small>
        </div>
        <button type="button" onclick="renderHome()"><i class="fa-solid fa-house"></i></button>
      </section>

      <section class="pc33-notification-list">
        ${
          rows.length
          ? rows.map(r=>`
            <button type="button" class="pc33-notification-card" onclick="${r.fn}">
              <div class="pc32-section-icon"><i class="fa-solid ${r.icon}"></i></div>
              <div>
                <b>${escapeHtml(r.title)}</b>
                <span>${escapeHtml(r.meta)}</span>
              </div>
              <i class="fa-solid fa-chevron-left"></i>
            </button>
          `).join("")
          : `<div class="pc33-empty-notify">
              <i class="fa-solid fa-circle-check"></i>
              <b>لا توجد إشعارات</b>
              <span>كل شيء مستقر حالياً</span>
            </div>`
        }
      </section>
    </main>
    ${typeof pc18BottomNav === "function" ? pc18BottomNav("home") : ""}
  `;
}

function pcViewMode(key){
  try{ return localStorage.getItem("pcView_"+key) === "list" ? "list" : "grid"; }catch(e){ return "grid"; }
}

function pcSetViewMode(key,mode){
  try{ localStorage.setItem("pcView_"+key,mode); }catch(e){}
  document.querySelectorAll('[data-view-scope="'+key+'"]').forEach(el=>el.classList.toggle("is-list",mode==="list"));
  document.querySelectorAll('[data-view-toggle="'+key+'"] button').forEach(btn=>btn.classList.toggle("active",btn.dataset.mode===mode));
}

function pcViewToggle(key){
  const m = pcViewMode(key);
  return `<div class="pc50-seg" data-view-toggle="${key}" role="group" aria-label="طريقة العرض">
    <button type="button" data-mode="grid" class="${m==="grid"?"active":""}" onclick="pcSetViewMode('${key}','grid')" aria-label="شبكة"><i class="fa-solid fa-table-cells-large"></i></button>
    <button type="button" data-mode="list" class="${m==="list"?"active":""}" onclick="pcSetViewMode('${key}','list')" aria-label="قائمة"><i class="fa-solid fa-list"></i></button>
  </div>`;
}

function pc43Counts(){
  try{ return typeof pc32Counts === "function" ? pc32Counts() : {newWh:0,pending:0}; }
  catch(e){ return {newWh:0,pending:0}; }
}

function pc43NotificationsCount(){
  try{ return typeof pc33NotificationRows === "function" ? pc33NotificationRows().length : 0; }
  catch(e){ return 0; }
}

function pc50Logo(){
  return `<img class="pc50-logo-img" src="assets/logo.png" alt="Protein & Carb" onerror="this.onerror=null;this.src='logo.png';">`;
}

function renderSettingsGate(){
  currentBackFn = "renderGateway()";
  if(!isPhoneBack) history.pushState({page:"settings-gate"},"");
  app.innerHTML = `
    <main class="app">
      <section class="pc21-admin-gate">
        <div class="pc21-admin-gate-card">
          <div class="pc21-admin-gate-icon"><i class="fa-solid fa-gear"></i></div>
          <h2>الإعدادات</h2>
          <p>أدخل كلمة مرور الإدارة للمتابعة</p>
          <input id="settingsPasswordInput" type="password" placeholder="كلمة مرور الإدارة" autocomplete="current-password">
          <button id="pc50SettingsLogin" class="btn btn-main" type="button">دخول الإعدادات</button>
          <button class="btn btn-light pc50-gate-back" type="button" onclick="renderGateway()">رجوع</button>
        </div>
      </section>
    </main>
    ${typeof pc18BottomNav === "function" ? pc18BottomNav("settings") : ""}
  `;
  setTimeout(()=>{
    const input = document.getElementById("settingsPasswordInput");
    input?.focus();
    document.getElementById("pc50SettingsLogin")?.addEventListener("click", checkSettingsPassword);
    input?.addEventListener("keydown", e=>{ if(e.key === "Enter") checkSettingsPassword(); });
  }, 0);
}

function checkSettingsPassword(){
  const pass = (document.getElementById("settingsPasswordInput")?.value || "").trim();
  if(pass !== String(systemSettings.adminPassword)){
    showToast("كلمة المرور غير صحيحة","error");
    return;
  }
  try{
    renderSettingsOverview();
  }catch(err){
    console.error("Settings open error:", err);
    showToast("تعذر فتح الإعدادات","error");
  }
}

function refreshViews(){
  try{ pcMarkReady(); }catch(e){}
  try{ pcBaseRefreshViews(); }catch(e){ console.error("refreshViews:", e); }
  setTimeout(()=>{
    try{
      if(document.getElementById("pc27CleaningTasksBox")) pc27DrawCleaningTasks();
      if(document.getElementById("pc27OperationTasksBox")) pc27DrawOperationTasks();
      if(typeof pc60LiveRefresh === "function") pc60LiveRefresh();
    }catch(e){}
  },120);
}

function pc43CurrentSlotKey(){
  const d = new Date();
  const h = d.getHours();
  const slot = h < 11 ? "morning" : (h < 18 ? "afternoon" : "night");
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${slot}`;
}

function pc43ResetDraftsIfNeeded(){
  try{
    const key = pc43CurrentSlotKey();
    const old = localStorage.getItem("pc43_slot_key");
    if(old !== key){
      localStorage.setItem("pc43_slot_key", key);
      if(typeof pc27CleaningDraft !== "undefined") pc27CleaningDraft = {};
      if(typeof pc27OperationsDraft !== "undefined") pc27OperationsDraft = {};
    }
  }catch(e){}
}

function pc27DrawCleaningTasks(){
  pc43ResetDraftsIfNeeded();
  pc27DrawCleaningTasksCore();
}

function pc27DrawOperationTasks(){
  pc43ResetDraftsIfNeeded();
  pc27DrawOperationTasksCore();
}

async function pc27SubmitCleaning(){
  await pc27SubmitCleaningCore();
  try{
    pc27CleaningDraft = {};
    setTimeout(()=>{ if(document.getElementById("pc27CleaningTasksBox")) pc27DrawCleaningTasks(); },150);
  }catch(e){}
}

async function pc27SubmitOperations(){
  await pc27SubmitOperationsCore();
  try{
    pc27OperationsDraft = {};
    setTimeout(()=>{ if(document.getElementById("pc27OperationTasksBox")) pc27DrawOperationTasks(); },150);
  }catch(e){}
}

let pcSheetResolve = null;

function pcSheetClose(result){
  const host = document.getElementById("pcSheetHost");
  if(host){
    host.classList.remove("show");
    document.body.classList.remove("pc51-lock");
    setTimeout(()=>host.remove(), 220);
  }
  const r = pcSheetResolve; pcSheetResolve = null;
  if(r) r(result);
}

function pcSheet({title="", body="", actions=[], icon="", tone=""}){
  return new Promise(resolve=>{
    document.getElementById("pcSheetHost")?.remove();
    if(pcSheetResolve){ pcSheetResolve(null); }
    pcSheetResolve = resolve;
    const host = document.createElement("div");
    host.id = "pcSheetHost";
    host.className = "pc51-sheet-host";
    host.innerHTML = `
      <div class="pc51-sheet-backdrop" data-close="1"></div>
      <div class="pc51-sheet ${tone}" role="dialog" aria-modal="true">
        <div class="pc51-sheet-grip"></div>
        ${icon ? `<div class="pc51-sheet-icon"><i class="fa-solid ${icon}"></i></div>` : ""}
        ${title ? `<h3>${title}</h3>` : ""}
        <div class="pc51-sheet-body">${body}</div>
        <div class="pc51-sheet-actions">
          ${actions.map((a,i)=>`<button type="button" class="btn ${a.kind||"btn-light"}" data-act="${i}">${a.label}</button>`).join("")}
        </div>
      </div>`;
    document.body.appendChild(host);
    document.body.classList.add("pc51-lock");
    host.addEventListener("click", e=>{
      if(e.target.dataset.close){ pcSheetClose(null); return; }
      const b = e.target.closest("[data-act]");
      if(!b) return;
      const a = actions[Number(b.dataset.act)];
      pcSheetClose(typeof a.value === "function" ? a.value(host) : a.value);
    });
    requestAnimationFrame(()=>host.classList.add("show"));
  });
}

function pcConfirm(message, opt={}){
  return pcSheet({
    title: opt.title || (opt.danger ? "تأكيد الإجراء" : "تأكيد"),
    body: `<p>${escapeHtml(message)}</p>`,
    icon: opt.danger ? "fa-trash-can" : "fa-circle-question",
    tone: opt.danger ? "danger" : "",
    actions: [
      {label: opt.okText || (opt.danger ? "نعم، تابع" : "تأكيد"), kind: opt.danger ? "btn-danger" : "btn-main", value:true},
      {label: "إلغاء", kind:"btn-light", value:false}
    ]
  }).then(v=>v === true);
}

function pcAlert(message, type="error"){
  try{ showToast(String(message), type); }catch(e){}
}
window.alert = pcAlert;

document.addEventListener("keydown", e=>{ if(e.key === "Escape" && pcSheetResolve) pcSheetClose(null); });

function pc51AdminGroupsHtml(s){
  const mode = pcViewMode("admin");
  const cls = mode==="list" ? "is-list" : "";
  const group = (title, cards, withToggle)=>`
    <section class="pc21-admin-section-title">
      <h3>${title}</h3>
      ${withToggle ? pcViewToggle("admin") : ""}
    </section>
    <section class="pc21-admin-grid ${cls}" data-view-scope="admin">${cards}</section>`;
  return [
    group("المتابعة اليومية",
      pc21AdminSectionCard("production","fa-chart-line","الإنتاج",s)+
      pc21AdminSectionCard("waste","fa-triangle-exclamation","الهدر",s)+
      pc21AdminSectionCard("cleaning","fa-broom","النظافة",s)+
      pc21AdminSectionCard("operations","fa-industry","التشغيل",s), true),
    group("المستودع",
      pc21AdminSectionCard("warehouse","fa-boxes-stacked","المستودع",s)+
      pc21AdminSectionCard("archive","fa-box-archive","الأرشيف",s)),
    group("التقارير",
      pc21AdminSectionCard("reports","fa-file-pdf","التقارير",s))
  ].join("");
}

const PC_TBL_MODES = [
  ["cards","fa-table-cells-large","بطاقات"],
  ["compact","fa-bars","مدمج"],
  ["table","fa-table","جدول"]
];

function pcTblMode(){
  try{ const m = localStorage.getItem("pcView_tbl"); return PC_TBL_MODES.some(x=>x[0]===m) ? m : "cards"; }
  catch(e){ return "cards"; }
}

function pcSetTblMode(m){
  try{ localStorage.setItem("pcView_tbl", m); }catch(e){}
  document.querySelectorAll(".pc51-tablewrap").forEach(w=>{
    w.classList.remove("pc51-v-cards","pc51-v-compact","pc51-v-table");
    w.classList.add("pc51-v-"+m);
  });
  document.querySelectorAll(".pc51-tblseg button").forEach(b=>b.classList.toggle("active", b.dataset.mode===m));
}

function pcEnhanceTables(root){
  root.querySelectorAll("table.premium-table:not([data-pc])").forEach(t=>{
    t.setAttribute("data-pc","1");
    const labels = [...t.querySelectorAll("thead th")].map(th=>th.textContent.trim());
    t.querySelectorAll("tbody tr").forEach(tr=>{
      [...tr.children].forEach((td,i)=>{
        td.setAttribute("data-label", labels[i] || "");
        if(td.querySelector("button")) td.classList.add("pc51-actions");
        else if(i === (labels.length > 1 && /إجراء|حذف/.test(labels[labels.length-1]||"") ? 0 : 0)) td.classList.add("pc51-main");
      });
    });
    const m = pcTblMode();
    const wrap = document.createElement("div");
    wrap.className = "pc51-tablewrap pc51-v-"+m;
    const count = t.querySelectorAll("tbody tr").length;
    const bar = document.createElement("div");
    bar.className = "pc51-tblbar";
    bar.innerHTML = `<span class="pc51-count">${count} عنصر</span>
      <div class="pc50-seg pc51-tblseg">${PC_TBL_MODES.map(x=>`<button type="button" data-mode="${x[0]}" class="${x[0]===m?"active":""}" aria-label="${x[2]}" onclick="pcSetTblMode('${x[0]}')"><i class="fa-solid ${x[1]}"></i></button>`).join("")}</div>`;
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(bar);
    const scroller = document.createElement("div");
    scroller.className = "pc51-scroll";
    scroller.appendChild(t);
    wrap.appendChild(scroller);
  });
}

const PC_REPORT_BOXES = ["productionAdminBox","wasteAdminBox","warehouseArchiveBox","internalIssueAdminBox","cleaningAdminBox","operationAdminBox"];
let pcFilterState = {};

function pcDayKeys(back){
  const out = [];
  for(let i=0;i<=back;i++){
    const d = new Date(); d.setDate(d.getDate()-i);
    out.push(d.toLocaleDateString("ar-SA"));
  }
  return out;
}

function pcApplyReportFilter(id){
  const box = document.getElementById(id);
  if(!box) return;
  const st = pcFilterState[id] || {q:"",chip:"all"};
  const q = st.q.trim().toLowerCase();
  const today = pcDayKeys(0), yest = pcDayKeys(1).slice(1), week = pcDayKeys(6);
  let shown = 0, total = 0;
  box.querySelectorAll(":scope > .panel:not(.pc51-filterbar)").forEach((card,idx)=>{
    if(card.querySelector(".pc51-filterbar")) return;
    if(idx === 0 && /طباعة التقرير|حذف جميع/.test(card.textContent) && card.querySelector("h3")?.textContent.includes("تقرير")) return;
    total++;
    const text = card.textContent;
    const lower = text.toLowerCase();
    let ok = !q || lower.includes(q);
    if(ok && st.chip === "today") ok = today.some(k=>text.includes(k));
    if(ok && st.chip === "yesterday") ok = yest.some(k=>text.includes(k));
    if(ok && st.chip === "week") ok = week.some(k=>text.includes(k));
    if(ok && st.chip === "unprinted") ok = !card.querySelector(".printed-chip");
    card.hidden = !ok;
    if(ok) shown++;
  });
  const cnt = box.querySelector(".pc51-filter-count");
  if(cnt) cnt.textContent = `${shown} من ${total}`;
}

function pcSetReportFilter(id, patch){
  pcFilterState[id] = Object.assign({q:"",chip:"all"}, pcFilterState[id]||{}, patch);
  const box = document.getElementById(id);
  if(box){
    box.querySelectorAll(".pc51-chip").forEach(c=>c.classList.toggle("active", c.dataset.chip === pcFilterState[id].chip));
  }
  pcApplyReportFilter(id);
}

function pcEnhanceReports(root){
  PC_REPORT_BOXES.forEach(id=>{
    const box = root.querySelector("#"+id) || (root.id === id ? root : null);
    if(!box || box.querySelector(":scope > .pc51-filterbar") || box.querySelector(".placeholder")) return;
    if(!box.querySelector(":scope > .panel")) return;
    const st = pcFilterState[id] || {q:"",chip:"all"};
    const bar = document.createElement("div");
    bar.className = "pc51-filterbar";
    bar.innerHTML = `
      <div class="pc51-searchbar slim">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="بحث بالاسم أو القسم أو الصنف" value="${escapeHtml(st.q)}" autocomplete="off">
        <span class="pc51-filter-count"></span>
      </div>
      <div class="pc51-chips">
        ${[["all","الكل"],["today","اليوم"],["yesterday","أمس"],["week","٧ أيام"],["unprinted","غير مطبوع"]].map(c=>`<button type="button" class="pc51-chip ${st.chip===c[0]?"active":""}" data-chip="${c[0]}">${c[1]}</button>`).join("")}
        <button type="button" class="pc51-chip reset" data-reset="1"><i class="fa-solid fa-rotate-left"></i> مسح</button>
      </div>`;
    bar.querySelector("input").addEventListener("input", e=>pcSetReportFilter(id,{q:e.target.value}));
    bar.addEventListener("click", e=>{
      const c = e.target.closest("[data-chip]");
      if(c) return pcSetReportFilter(id,{chip:c.dataset.chip});
      if(e.target.closest("[data-reset]")){
        bar.querySelector("input").value = "";
        pcSetReportFilter(id,{q:"",chip:"all"});
      }
    });
    box.insertBefore(bar, box.firstChild);
    pcApplyReportFilter(id);
  });
}

function pcEnhanceGates(root){
  root.querySelectorAll(".pc21-admin-gate-card:not([data-pc-back])").forEach(card=>{
    card.setAttribute("data-pc-back","1");
    if(card.querySelector(".pc50-gate-back")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-light pc50-gate-back";
    b.textContent = "رجوع";
    b.addEventListener("click", ()=>renderGateway());
    card.appendChild(b);
  });
}

function pcEnhanceEmpty(root){
  root.querySelectorAll(".placeholder:not([data-pc-empty])").forEach(el=>{
    el.setAttribute("data-pc-empty","1");
    if(el.children.length || el.id === "chefMessage") return;
    const txt = el.textContent.trim();
    if(!txt || el.style.display === "none") return;
    el.innerHTML = `<i class="fa-regular fa-folder-open"></i><span>${escapeHtml(txt)}</span>`;
    el.classList.add("pc51-empty-state");
  });
}

let pcDataReady = false;
function pcMarkReady(){
  if(pcDataReady) return;
  pcDataReady = true;
  document.getElementById("app")?.classList.remove("pc51-loading");
}
document.getElementById("app")?.classList.add("pc51-loading");
setTimeout(pcMarkReady, 3500);

let pcObsQueued = false;
function pcAfterRender(){
  pcObsQueued = false;
  const host = document.getElementById("app");
  if(!host) return;
  try{
    pcObserver.disconnect();
    pcEnhanceTables(host);
    pcEnhanceReports(host);
    pcEnhanceGates(host);
    pcEnhanceEmpty(host);
  }catch(e){ console.error("pcAfterRender", e); }
  finally{ pcObserver.observe(host,{childList:true,subtree:true}); }
}
const pcObserver = new MutationObserver(()=>{
  if(pcObsQueued) return;
  pcObsQueued = true;
  requestAnimationFrame(pcAfterRender);
});
pcObserver.observe(document.getElementById("app"),{childList:true,subtree:true});
pcAfterRender();

(function(){
  let startX = 0, startY = 0, tracking = null, pull = 0;
  const THRESH = 78;

  function indicator(){
    let el = document.getElementById("pc51Ptr");
    if(!el){
      el = document.createElement("div");
      el.id = "pc51Ptr";
      el.innerHTML = `<i class="fa-solid fa-arrow-down"></i>`;
      document.body.appendChild(el);
    }
    return el;
  }

  function onHome(){ return !!document.querySelector(".pc50-home"); }

  document.addEventListener("touchstart", e=>{
    if(pcSheetResolve || e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY; pull = 0;
    const edge = startX > window.innerWidth - 22;
    if(edge && !onHome()) tracking = "back";
    else if(window.scrollY <= 0 && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) tracking = "pull";
    else tracking = null;
  }, {passive:true});

  document.addEventListener("touchmove", e=>{
    if(!tracking) return;
    const t = e.touches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if(tracking === "pull"){
      if(dy <= 0 || Math.abs(dx) > dy){ return; }
      pull = Math.min(dy * .5, 110);
      const el = indicator();
      el.style.transform = `translate(-50%, ${pull - 44}px)`;
      el.style.opacity = Math.min(pull / THRESH, 1);
      el.classList.toggle("ready", pull >= THRESH);
    }
  }, {passive:true});

  document.addEventListener("touchend", e=>{
    if(!tracking) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if(tracking === "back" && dx < -70 && Math.abs(dy) < 60){
      try{ smartBack(); }catch(err){ renderHome(); }
    }
    if(tracking === "pull"){
      const el = document.getElementById("pc51Ptr");
      if(el){
        if(pull >= THRESH){
          el.classList.add("spin");
          el.innerHTML = `<i class="fa-solid fa-rotate"></i>`;
          el.style.transform = "translate(-50%, 18px)";
          try{ refreshViews(); }catch(err){}
          setTimeout(()=>{
            el.remove();
            try{ showToast("تم تحديث البيانات"); }catch(err){}
          }, 700);
        }else{
          el.style.opacity = 0;
          setTimeout(()=>el.remove(), 200);
        }
      }
    }
    tracking = null; pull = 0;
  }, {passive:true});

  document.addEventListener("click", e=>{
    if(e.target.closest(".pc50-card,.pc21-admin-card,.pc32-settings-card,.pc18-bottom-nav button,.pc50-seg button,.pc51-chip")){
      try{ navigator.vibrate && navigator.vibrate(6); }catch(err){}
    }
  }, true);
})();

var PC60_TONES = [
  {bg:"#E9F3DF", fg:"#2C5F10"},
  {bg:"#FFF1CC", fg:"#8A5A00"},
  {bg:"#E3EEF8", fg:"#1F5A8C"},
  {bg:"#FBE6DE", fg:"#A24A2A"},
  {bg:"#EFE6F5", fg:"#6B3F8C"},
  {bg:"#DDF1EE", fg:"#1D6B62"}
];

function pc60Tone(name){
  let h = 0;
  String(name||"").split("").forEach(ch=>{ h = (h*31 + ch.charCodeAt(0)) >>> 0; });
  const t = PC60_TONES[h % PC60_TONES.length];
  return `--tone-bg:${t.bg};--tone-fg:${t.fg}`;
}

function pc60Num(v){
  const n = Number(v||0);
  return Number.isInteger(n) ? String(n) : String(Math.round(n*100)/100);
}

function pc60Time(obj){
  const ms = typeof getTimeValue === "function" ? getTimeValue(obj) : 0;
  if(!ms) return obj?.createdAtText || "";
  try{ return new Date(ms).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"}); }
  catch(e){ return ""; }
}

function pc60StatusChip(){
  const st = pc17ChefStatus();
  return `<span class="pc60-chip ${st.cls}">${st.label}</span>`;
}

function pc60ChefOrders(){
  if(!currentChef) return [];

  return sortNewest((warehouseOrders||[]).filter(o=>
    pcMine(o) && !["مؤرشف","محذوف"].includes(o.status))
    .map(o=>o.status === "تم الصرف" ? {...o, status:"جاهز"} : o));
}

function pc60Tabs(active){
  const draft = (productionDraft||[]).length;
  const cart = (currentCart||[]).length;
  const ready = pc60ChefOrders().filter(o=>o.status==="جاهز").length;
  const tabs = [
    ["home","fa-house","اليوم","renderChefDashboard(currentChef)",0],
    ["production","fa-chart-line","إنتاج","renderProduction()",draft],
    ["waste","fa-trash-can","هدر","renderWaste()",0],
    ["request","fa-cart-shopping","طلب","renderWarehouseRequest()",cart],
    ["orders","fa-clipboard-list","طلباتي","renderMyOrders()",ready]
  ];
  return `
    <nav class="pc60-tabs" aria-label="تنقل الشيف">
      ${tabs.map(t=>`
        <button type="button" class="${active===t[0]?"active":""}" onclick="${t[3]}" data-tab="${t[0]}">
          <i class="fa-solid ${t[1]}"></i><span>${t[2]}</span>
          ${t[4] ? `<em class="pc60-badge${t[0]==="orders"?" hot":""}">${t[4]}</em>` : ""}
        </button>`).join("")}
    </nav>`;
}

function pc60RefreshTabBadges(){
  const nav = document.querySelector(".pc60-tabs");
  if(!nav) return;
  const counts = {
    production:(productionDraft||[]).length,
    request:(currentCart||[]).length,
    orders:pc60ChefOrders().filter(o=>o.status==="جاهز").length
  };
  Object.keys(counts).forEach(k=>{
    const btn = nav.querySelector(`[data-tab="${k}"]`);
    if(!btn) return;
    let em = btn.querySelector(".pc60-badge");
    if(counts[k]){
      if(!em){ em = document.createElement("em"); em.className = "pc60-badge"+(k==="orders"?" hot":""); btn.appendChild(em); }
      em.textContent = counts[k];
    }else if(em){ em.remove(); }
  });
}

function pc60Empty(icon, text){
  return `<div class="pc60-empty"><i class="fa-regular ${icon}"></i><span>${escapeHtml(text)}</span></div>`;
}

function renderChefs(){
  currentChef = null;
  renderStoreSections();
}

function drawChefSectionsView(){
  const box = document.getElementById("chefSectionsView");
  if(!box) return;
  if(!chefSections.length){
    box.innerHTML = pc60Empty("fa-folder-open","لا توجد أقسام بعد. أضفها من الإعدادات.");
    return;
  }
  const mode = pcViewMode("chefsec");
  const visible = chefSections.filter(s=>pcSectionInBranch(s,currentBranch));
  if(!visible.length){ box.innerHTML = pc60Empty("fa-folder-open","لا توجد أقسام في هذا الفرع. أضفها من الإعدادات."); return; }
  box.innerHTML = `
    <div class="pc60-secgrid ${mode==="list"?"is-list":""}" data-view-scope="chefsec">
      ${visible.map(s=>{
        const st = pc17SectionStats(s.name);
        const meta = st.total ? `${st.done} من ${st.total} رفعوا إنتاج اليوم` : "لا يوجد شيفات";
        return `
          <button type="button" class="pc60-sec" style="${pc60Tone(s.name)}" data-name="${escapeHtml(s.name||"")}" onclick="renderChefPick(this.dataset.name)">
            <span class="pc60-sec-icon"><i class="fa-solid ${pc17SectionIcon(s.name)}"></i></span>
            <b>${escapeHtml(s.name||"")}</b>
            <small>${meta}</small>
            <em class="pc60-dot ${st.cls}">${st.label}</em>
          </button>`;
      }).join("")}
    </div>`;
}

function renderChefPick(sectionName){
  const list = chefs.filter(c=>c.section === sectionName && pcBranchOf(c) === currentBranch);
  pageLayout(sectionName, `
    ${pc60Bar({title:sectionName, sub:pcBranchName(currentBranch), back:"renderChefs()"})}
    <section class="pc60-page pc94-list">
      ${list.length ? list.map(c=>`
        <button type="button" class="pc94-row" data-id="${escapeHtml(c.id)}" onclick="pcEnterChef(this.dataset.id)">
          <span class="pc94-av">${escapeHtml((c.name||"?").trim().charAt(0))}</span>
          <span class="pc94-txt"><b>${escapeHtml(c.name||"")}</b></span>
          <i class="fa-solid fa-chevron-left pc94-chev"></i></button>`).join("") : pc60Empty("fa-user","لا يوجد شيفات في هذا القسم. أضفهم من الإعدادات.")}
    </section>
  `,"renderChefs()");
}

function pcEnterChef(id){
  const chef = chefs.find(c=>c.id === id);
  if(!chef) return;
  pc60SeenStatus = null;
  currentChef = chef;
  productionDraft = [];
  currentCart = [];
  renderChefDashboard(chef);
}

function pc60Logout(){
  pc60SeenStatus = null;
  productionDraft = [];
  currentCart = [];
  currentChef = null;
  renderChefs();
}

function pc60Greeting(){
  const h = new Date().getHours();
  return h < 12 ? "صباح الخير" : (h < 18 ? "مساء الخير" : "مساء النور");
}

function pc60Timeline(){
  const key = pc17TodayKey();
  const rows = [];
  pc17ChefProductionToday().forEach(l=>{
    rows.push({ms:getTimeValue(l), icon:"fa-chart-line", tone:"ok",
      title: l.noProduction ? "سجّلت: لا يوجد إنتاج اليوم" : "رفعت إنتاج",
      text: l.noProduction ? "" : (l.items||[]).map(i=>`${escapeHtml(i.name||i.productName||"")} × ${pc60Num(i.qty)} ${escapeHtml(i.unit||"")}`).join("، "),
      time: pc60Time(l)});
  });
  pc17ChefWasteToday().forEach(l=>{
    rows.push({ms:getTimeValue(l), icon:"fa-trash-can", tone:"warn",
      title:"سجّلت هدر", text:`${escapeHtml(l.productName||"")} × ${pc60Num(l.qty)} ${escapeHtml(l.unit||"")} — ${escapeHtml(l.reason||"")}`, time:pc60Time(l)});
  });
  pc60ChefOrders().filter(o=>pc17DateKey(o)===key).forEach(o=>{
    rows.push({ms:getTimeValue(o), icon:"fa-cart-shopping", tone:o.status==="جاهز"?"ok":"info",
      title:`طلب #${escapeHtml(o.orderId||"")}`, text:pc60OrderStatusLabel(o), time:pc60Time(o)});
  });
  return rows.sort((a,b)=>(b.ms||0)-(a.ms||0)).slice(0,8);
}

function pc60DashBody(chef){
  const st = pc17ChefStatus();
  const waste = pc17ChefWasteToday();
  const orders = pc60ChefOrders();
  const ready = orders.filter(o=>o.status==="جاهز");
  const active = orders.filter(o=>o.status!=="تم الاستلام").length;
  const first = String(chef.name||"").trim().split(/\s+/)[0] || "";
  const initial = first.charAt(0) || "؟";
  const timeline = pc60Timeline();

  let cta = "";
  if(ready.length){
    cta = `<button type="button" class="pc60-cta ok" onclick="renderMyOrders()">
             <i class="fa-solid fa-box-open"></i>
             <div><b>${ready.length === 1 ? "طلبك جاهز للاستلام" : `${ready.length} طلبات جاهزة للاستلام`}</b><small>اضغط للمراجعة والاستلام</small></div>
             <i class="fa-solid fa-chevron-left"></i></button>`;
  }else if(st.cls === "pending"){
    cta = `<button type="button" class="pc60-cta" onclick="renderProduction()">
             <i class="fa-solid fa-chart-line"></i>
             <div><b>سجّل إنتاج اليوم</b><small>لم يتم رفع أي إنتاج بعد</small></div>
             <i class="fa-solid fa-chevron-left"></i></button>`;
  }

  return `
    <section class="pc60-hello">
      <div class="pc60-avatar">${escapeHtml(initial)}</div>
      <div class="pc60-hello-text">
        <span>${pc60Greeting()}</span>
        <h2>${escapeHtml(first)}</h2>
      </div>
      <span class="pc60-chip ${st.cls}">${st.label}</span>
    </section>
    <div id="pc80ChefSlot">${pc80Slider(true)}</div>
    ${cta}
    <section class="pc60-kpis">
      <div><span>إنتاج اليوم</span><b>${pc60Num(st.qty)}</b></div>
      <div><span>الهدر</span><b>${waste.length}</b></div>
      <div><span>طلبات جارية</span><b>${active}</b></div>
    </section>
    <div class="pc50-section-title"><h2>نشاط اليوم</h2></div>
    <section class="pc60-timeline">
      ${timeline.length ? timeline.map(r=>`
        <div class="pc60-tl ${r.tone}">
          <span class="pc60-tl-icon"><i class="fa-solid ${r.icon}"></i></span>
          <div><b>${r.title}</b>${r.text ? `<small>${r.text}</small>` : ""}</div>
          <time>${r.time}</time>
        </div>`).join("") : pc60Empty("fa-calendar","لا يوجد نشاط اليوم بعد")}
    </section>
    ${st.cls==="pending" ? `<button type="button" class="pc60-link" onclick="submitNoProductionToday()">لا يوجد إنتاج اليوم؟ سجّلها</button>` : ""}`;
}

function renderChefDashboard(chef){
  currentChef = chef;
  currentCart = currentCart || [];
  productionDraft = productionDraft || [];

  pageLayout(chef.name, `
    ${pc60Bar({
      title:chef.section||"", sub:"لوحة اليوم", back:"renderChefs()",
      trailing:`${pc93Button("renderChat(true)","pc60-back")}<button type="button" class="pc60-back" onclick="pc60Logout()" aria-label="تبديل الشيف"><i class="fa-solid fa-right-from-bracket"></i></button>`
    })}
    <section class="pc60-page has-tabs" style="${pc60Tone(chef.section)}" id="pc60DashBody">${pc60DashBody(chef)}</section>
    ${pc60Tabs("home")}
  `,"renderChefs()");
  pc60CheckReady();
}

var PC70_UNITS = {
  "كجم":{fam:"mass",f:1000,step:0.5,init:1},
  "جرام":{fam:"mass",f:1,step:100,init:100},
  "لتر":{fam:"vol",f:1000,step:0.5,init:1},
  "مل":{fam:"vol",f:1,step:100,init:100},
  "حبة":{fam:"cnt"},"قطعة":{fam:"cnt"},"علبة":{fam:"cnt"},"كيس":{fam:"cnt"},
  "كرتون":{fam:"cnt"},"صندوق":{fam:"cnt"},"ربطة":{fam:"cnt"},"صينية":{fam:"cnt"}
};
var PC70_UNIT_GROUPS = [
  ["الوزن",["كجم","جرام"]],
  ["الحجم",["لتر","مل"]],
  ["العدد والتعبئة",["حبة","قطعة","علبة","كيس","كرتون","صندوق","ربطة","صينية"]]
];
var PC70_UNIT_FLAT = PC70_UNIT_GROUPS.reduce((a,g)=>a.concat(g[1]),[]);
var PC70_ALIASES = {
  "كيلو":"كجم","كيلوجرام":"كجم","كغ":"كجم","كغم":"كجم","kg":"كجم",
  "غرام":"جرام","جم":"جرام","غم":"جرام","g":"جرام","gm":"جرام",
  "ليتر":"لتر","l":"لتر","ملل":"مل","ml":"مل","مليلتر":"مل",
  "حبه":"حبة","قطعه":"قطعة","علبه":"علبة","pcs":"حبة","pc":"حبة"
};

function pc70Unit(u){
  const s = String(u||"").trim();
  if(PC70_UNITS[s]) return s;
  return PC70_ALIASES[s.toLowerCase()] || s;
}
function pc70R(n){ return Math.round(Number(n||0)*1000)/1000; }
function pc70Step(u){ return (PC70_UNITS[u]||{}).step || 1; }
function pc70Init(u){ return (PC70_UNITS[u]||{}).init || 1; }
function pc70Conv(q,from,to){
  const a = PC70_UNITS[from], b = PC70_UNITS[to];
  if(!a || !b || from === to || a.fam !== b.fam || a.fam === "cnt") return q;
  return pc70R(q*a.f/b.f);
}
function pc70Base(qty,unit,base){
  if(!base) return null;
  if(unit === base) return pc70R(qty);
  const a = PC70_UNITS[unit], b = PC70_UNITS[base];
  if(a && b && a.fam === b.fam && a.fam !== "cnt") return pc70R(qty*a.f/b.f);
  return null;
}
function pc70PrefKey(kind,id){ return "pcUnit_"+kind+"_"+id; }
function pc70DefUnit(kind,item){
  try{ const s = localStorage.getItem(pc70PrefKey(kind,item.id)); if(s) return s; }catch(e){}
  return pc70Unit(item.unit) || "حبة";
}

var PC70_CATS = [
  ["لحوم ودواجن","fa-drumstick-bite",["لحم","لحمة","دجاج","فراخ","ضأن","غنم","خروف","بقر","عجل","كبدة","سمك","هامور","روبيان","جمبري","ستيك","برجر","نقانق","سجق","شاورما","كفتة","ريش","فيليه","chicken","beef","lamb","meat","fish","shrimp"]],
  ["ألبان وأجبان","fa-cheese",["حليب","جبن","جبنة","كريمة","قشطة","زبادي","لبن","لبنة","زبدة","موزاريلا","شيدر","كريم تشيز","milk","cheese","cream","yogurt","butter"]],
  ["خضار وفواكه","fa-carrot",["بصل","طماطم","بندورة","خيار","جزر","بطاط","ليمون","خس","فلفل","ثوم","باذنجان","كوسا","زهرة","ملفوف","بقدونس","كزبرة","نعناع","تفاح","موز","فراولة","برتقال","عنب","فاصوليا","بازلاء","سبانخ","جرجير","onion","tomato","potato","lemon","carrot","garlic"]],
  ["مواد جافة","fa-wheat-awn",["أرز","رز","سكر","دقيق","طحين","ملح","بهار","عدس","حمص","فول","معكرونة","شعرية","نشا","خميرة","بيكنج","كاكاو","زيت","خل","صلصة","معجون","رب","تونة","ذرة","عسل","مربى","كاتشب","مايونيز","rice","sugar","flour","salt","oil","spice"]],
  ["مشروبات","fa-mug-hot",["ماء","مياه","عصير","قهوة","شاي","مشروب","بيبسي","كولا","صودا","نسكافيه","juice","coffee","tea","water","cola"]],
  ["تغليف ومستهلكات","fa-box-open",["علبة","علب","كيس","أكياس","غطاء","كوب","اكواب","أكواب","شوكة","ملعقة","سكين","منديل","قفاز","رول","فويل","ورق","حاوية","صحن","ملصق","تغليف","سترو","مصاصة","box","bag","cup","lid","foil","glove"]],
  ["نظافة","fa-spray-can-sparkles",["صابون","منظف","معقم","كلور","ديتول","اسفنج","إسفنج","مكنسة","جلي","مطهر","نظافة","soap","clean","detergent"]]
];

function pc70Category(kind,item){
  const own = String(item.category||"").trim();
  if(own) return own;
  if(kind === "prod") return "";
  const n = [item.nameAr,item.name,item.nameEn].filter(Boolean).join(" ").toLowerCase();
  for(const c of PC70_CATS){ if(c[2].some(k=>n.includes(k))) return c[0]; }
  return "أخرى";
}

function pc70CatIcon(kind,cat,item){
  const hit = PC70_CATS.find(c=>c[0]===cat);
  if(hit) return hit[1];
  if(kind === "prod") return pc17SectionIcon(item.section||currentChef?.section||"");
  return "fa-bowl-food";
}

var pc60Filter = {prod:"all", req:"all"};
var pc70Show = 40;
var pc75Lim = {wh:80, menu:80};

function pc60Source(kind){
  return kind === "prod" ? pc17MenuForChef() : pc17WarehouseForChef();
}
function pc60Arr(kind){
  return kind === "prod" ? productionDraft : currentCart;
}
function pc60ItemName(kind,i){
  return kind === "prod" ? pc17ItemName(i) : (i.nameAr||i.name||"");
}
function pc60Entry(kind,id){
  return pc60Arr(kind).find(x=>String(x.itemId||x.id||"")===String(id));
}

function pc60Freq(kind){
  const freq = {};
  const bump = it=>{ const k = String(it.itemId||it.name||it.productName||""); if(k) freq[k] = (freq[k]||0)+1; };
  if(kind === "prod"){
    (productionLogs||[]).filter(l=>l.section===currentChef?.section).forEach(l=>(l.items||[]).forEach(bump));
  }else{
    (warehouseOrders||[]).filter(o=>pcMine(o)).forEach(o=>(o.items||[]).forEach(bump));
  }
  return freq;
}

function pc70MakeEntry(kind,src,qty,unit){
  const base = pc70Unit(src.unit) || "";
  const u = unit || pc70DefUnit(kind,src);
  const e = kind === "prod"
    ? {itemId:src.id, code:src.code||"", name:pc17ItemName(src), nameEn:pc17ItemEn(src), qty, unit:u, section:src.section||currentChef?.section||""}
    : {itemId:src.id, id:src.id, code:src.code||"", name:src.nameAr||src.name||"", nameEn:src.nameEn||"", unit:u, qty};
  e.baseUnit = base;
  e.qtyBase = pc70Base(qty,u,base);
  return e;
}

function pc60SetQty(kind,id,val){
  const arr = pc60Arr(kind);
  let qty = pc70R(val);
  if(!isFinite(qty) || qty < 0) qty = 0;
  const idx = arr.findIndex(x=>String(x.itemId||x.id||"")===String(id));
  if(qty === 0){
    if(idx >= 0) arr.splice(idx,1);
  }else if(idx >= 0){
    arr[idx].qty = qty;
    arr[idx].qtyBase = pc70Base(qty,arr[idx].unit,arr[idx].baseUnit);
  }else{
    const src = pc60Source(kind).find(x=>String(x.id)===String(id));
    if(!src) return;
    arr.push(pc70MakeEntry(kind,src,qty));
  }
  pc60AfterChange(kind,id);
}

function pc60Step(kind,id,dir){
  const e = pc60Entry(kind,id);
  if(e){
    pc60SetQty(kind,id,Math.max(0, pc70R(Number(e.qty||0) + dir*pc70Step(e.unit))));
  }else if(dir > 0){
    const src = pc60Source(kind).find(x=>String(x.id)===String(id));
    if(src && kind === "req" && pc90Unavailable(src)) return pc91Ask(kind,src);
    if(src) pc60SetQty(kind,id,pc70Init(pc70DefUnit(kind,src)));
  }
  try{ navigator.vibrate && navigator.vibrate(5); }catch(err){}
}

function pc70SetUnit(kind,id,unit){
  try{ localStorage.setItem(pc70PrefKey(kind,id), unit); }catch(e){}
  const e = pc60Entry(kind,id);
  if(e){
    e.qty = pc70Conv(Number(e.qty||0), e.unit, unit);
    e.unit = unit;
    e.qtyBase = pc70Base(e.qty,unit,e.baseUnit);
  }
  pc60AfterChange(kind,id);
}

function pc60AfterChange(kind,id){
  pc60RefreshRow(kind,id);
  pc60UpdateBar(kind);
  pc60RefreshTabBadges();
  pc70RefreshCart(kind);
}

function pc70UnitPicker(onchange, current){
  const cur = current || "حبة";
  const known = Object.keys(PC70_UNITS);
  const groups = PC70_UNIT_GROUPS.map(g=>`<optgroup label="${g[0]}">${g[1].map(u=>`<option value="${u}" ${u===cur?"selected":""}>${u}</option>`).join("")}</optgroup>`).join("");
  const extra = known.includes(cur) ? "" : `<option value="${escapeHtml(cur)}" selected>${escapeHtml(cur)}</option>`;
  return `<label class="pc70-unit"><span>${escapeHtml(cur)}</span><i class="fa-solid fa-chevron-down"></i>
    <select onchange="${onchange}" aria-label="الوحدة">${extra}${groups}</select></label>`;
}

function pc70TileHtml(kind,i){
  const id = escapeHtml(i.id);
  const e = pc60Entry(kind,i.id);
  const qty = Number(e?.qty || 0);
  const unit = e?.unit || pc70DefUnit(kind,i);
  const cat = pc70Category(kind,i);
  const meta = kind === "prod"
    ? [i.code, pc17ItemEn(i)].filter(Boolean).join(" • ")
    : [i.code, i.nameEn].filter(Boolean).join(" • ");
  return `
    <div class="pc70-tile ${qty?"on":""}" data-row="${id}" style="${pc60Tone(cat||pc17SectionIcon(i.section))}">
      <span class="pc70-ico"><i class="fa-solid ${pc70CatIcon(kind,cat,i)}"></i></span>
      <div class="pc70-info">
        <b class="pc70-name">${escapeHtml(pc60ItemName(kind,i))}${kind==="req"&&pc90Unavailable(i)?`<span class="pc90-tag">${e?.supplyRequested?"طلب توفير":"غير متوفر"}</span>`:""}</b>
        ${meta ? `<small class="pc70-meta">${escapeHtml(meta)}</small>` : ""}
      </div>
      <div class="pc70-ctrl">
        ${qty ? `
          <div class="pc60-step">
            <button type="button" class="minus" onclick="pc60Step('${kind}','${id}',-1)" aria-label="إنقاص">−</button>
            <input type="text" inputmode="decimal" value="${pc60Num(qty)}" onfocus="this.select()" onchange="pc60SetQty('${kind}','${id}',this.value)" aria-label="الكمية">
            <button type="button" class="plus" onclick="pc60Step('${kind}','${id}',1)" aria-label="زيادة">+</button>
          </div>` : `
          <button type="button" class="pc70-add" onclick="pc60Step('${kind}','${id}',1)"><i class="fa-solid fa-plus"></i> إضافة</button>`}
        <button type="button" class="pc70-unit" onclick="pc70PickUnit('${kind}','${id}')"><span>${escapeHtml(unit)}</span><i class="fa-solid fa-chevron-down"></i></button>
      </div>
    </div>`;
}

async function pc70PickUnit(kind,id){
  const cur = pc60Entry(kind,id)?.unit || pc70DefUnit(kind,pc60Source(kind).find(x=>String(x.id)===String(id))||{});
  const body = PC70_UNIT_GROUPS.map(g=>`<div class="pc70-ug"><small>${g[0]}</small><div>${g[1].map(u=>`<button type="button" class="pc70-uopt ${u===cur?"on":""}" data-act="${PC70_UNIT_FLAT.indexOf(u)}">${u}</button>`).join("")}</div></div>`).join("");
  const actions = PC70_UNIT_FLAT.map(u=>({label:u, kind:"pc70-hidden", value:u}));
  const v = await pcSheet({title:"اختر الوحدة", body, actions});
  if(v && typeof v === "string") pc70SetUnit(kind,id,v);
}

function pc60RefreshRow(kind,id){
  const row = document.querySelector(`#pc60List [data-row="${CSS.escape(String(id))}"]`);
  const item = pc60Source(kind).find(x=>String(x.id)===String(id));
  if(!row || !item) return;
  const qty = Number(pc60Entry(kind,id)?.qty || 0);
  if(pc60Filter[kind] === "picked" && !qty){ row.remove(); pc60DrawChips(kind); return; }
  const tmp = document.createElement("div");
  tmp.innerHTML = pc70TileHtml(kind,item).trim();
  row.replaceWith(tmp.firstElementChild);
  pc60DrawChips(kind);
}

function pc60DrawChips(kind){
  const box = document.getElementById("pc60Chips");
  if(!box) return;
  const n = pc60Arr(kind).length;
  const cats = {};
  pc60Source(kind).forEach(i=>{ const c = pc70Category(kind,i); if(c) cats[c] = (cats[c]||0)+1; });
  const names = Object.keys(cats).sort((a,b)=>cats[b]-cats[a]);
  const chips = [["all","الكل"],["picked",`المختارة (${n})`]];
  if(names.length >= 2) names.forEach(c=>chips.push(["cat:"+c, `${c} (${cats[c]})`]));
  if(kind === "req"){ const u = pc60Source(kind).filter(pc90Unavailable).length; if(u) chips.push(["unavail", `غير متوفر (${u})`]); }
  box.innerHTML = chips.map(c=>
    `<button type="button" class="pc60-fchip ${pc60Filter[kind]===c[0]?"active":""}" data-f="${escapeHtml(c[0])}" onclick="pc60SetFilter('${kind}',this.dataset.f)">${escapeHtml(c[1])}</button>`).join("");
}

function pc70More(kind){ pc70Show += 60; pc60DrawList(kind); }
function pc70Search(kind){ pc70Show = 40; pc60DrawList(kind); }
function pc60SetFilter(kind,f){
  pc60Filter[kind] = f; pc70Show = 40;
  pc60DrawList(kind);
}

function pc60DrawList(kind){
  const box = document.getElementById("pc60List");
  if(!box) return;
  const q = (document.getElementById("pc60Search")?.value||"").trim().toLowerCase();
  const f = pc60Filter[kind];
  const picked = new Set(pc60Arr(kind).map(x=>String(x.itemId||x.id||"")));
  const freq = pc60Freq(kind);
  const list = pc60Source(kind).filter(i=>{
    if(f === "picked" && !picked.has(String(i.id))) return false;
    if(f.startsWith("cat:") && pc70Category(kind,i) !== f.slice(4)) return false;
    if(f === "unavail" && !pc90Unavailable(i)) return false;
    if(!q) return true;
    return [pc60ItemName(kind,i), i.nameEn, i.code, i.unit, pc70Category(kind,i)].some(v=>String(v||"").toLowerCase().includes(q));
  });
  const fk = i=>freq[String(i.id)] || freq[String(pc60ItemName(kind,i))] || 0;
  list.sort((a,b)=>(fk(b)-fk(a)) || pc60ItemName(kind,a).localeCompare(pc60ItemName(kind,b),"ar"));
  pc60DrawChips(kind);
  pc70DrawQuick(kind);

  const mode = pcViewMode("catalog");
  if(!list.length){
    box.innerHTML = pc60Empty("fa-face-meh", f==="picked" ? "لم تختر أي صنف بعد" :
      (q ? "لا توجد نتائج مطابقة" : (kind==="prod" ? "لا توجد أصناف إنتاج لقسمك. اطلب من الإدارة إضافتها." : "لا توجد أصناف مستودع لقسمك.")));
    pc60UpdateBar(kind);
    return;
  }
  const shown = list.slice(0,pc70Show);
  let html = "";
  if(!q && f === "all"){
    const common = shown.filter(i=>fk(i)>0).slice(0,6);
    const rest = shown.filter(i=>!common.includes(i));
    if(common.length){
      html += `<div class="pc60-group">الأكثر استخداماً</div>${common.map(i=>pc70TileHtml(kind,i)).join("")}`;
      if(rest.length) html += `<div class="pc60-group">كل الأصناف</div>`;
    }
    html += rest.map(i=>pc70TileHtml(kind,i)).join("");
  }else{
    html += shown.map(i=>pc70TileHtml(kind,i)).join("");
  }
  if(list.length > shown.length) html += `<button type="button" class="pc60-more-btn" onclick="pc70More('${kind}')">عرض المزيد (${list.length-shown.length})</button>`;
  box.innerHTML = `<div class="pc70-grid ${mode==="list"?"is-list":""}" data-view-scope="catalog">${html}</div>`;
  pc60UpdateBar(kind);
}

function pc70LastDoc(kind){
  if(!currentChef) return null;
  if(kind === "req"){
    return sortNewest((warehouseOrders||[]).filter(o=>pcMine(o) && (o.items||[]).length))[0] || null;
  }
  const today = pc17TodayKey();
  return sortNewest((productionLogs||[]).filter(l=>l.section===currentChef.section && !l.noProduction && (l.items||[]).length && pc17DateKey(l)!==today))[0] || null;
}

function pc70DrawQuick(kind){
  const box = document.getElementById("pc70Quick");
  if(!box) return;
  const last = pc60Arr(kind).length ? null : pc70LastDoc(kind);
  if(!last){ box.innerHTML = ""; return; }
  const n = (last.items||[]).length;
  box.innerHTML = `
    <button type="button" class="pc70-quick" onclick="pc70Repeat('${kind}')">
      <i class="fa-solid fa-rotate-right"></i>
      <div><b>${kind==="req" ? "إعادة آخر طلب" : "نسخ آخر إنتاج"}</b><small>${n} ${n===1?"صنف":"أصناف"} · ${escapeHtml(last.createdAtText||"")}</small></div>
      <i class="fa-solid fa-chevron-left"></i>
    </button>`;
}

function pc70Repeat(kind){
  const last = pc70LastDoc(kind);
  if(!last) return;
  const src = pc60Source(kind);
  const arr = pc60Arr(kind);
  let added = 0, skipped = 0;
  (last.items||[]).forEach(it=>{
    const s = src.find(x=>String(x.id)===String(it.itemId||"")) ||
              src.find(x=>x.code && String(x.code)===String(it.code||"")) ||
              src.find(x=>pc60ItemName(kind,x)===String(it.name||""));
    const qty = pc70R(it.qty);
    if(!s || !qty){ skipped++; return; }
    if(arr.some(x=>String(x.itemId||x.id||"")===String(s.id))) return;
    arr.push(pc70MakeEntry(kind,s,qty,pc70Unit(it.unit)||undefined));
    added++;
  });
  pc60DrawList(kind);
  pc60RefreshTabBadges();
  showToast(added ? `تمت إضافة ${added} ${added===1?"صنف":"أصناف"}${skipped?` (تعذر ${skipped})`:""}` : "لا توجد أصناف متاحة للإعادة", added ? "success" : "warn");
}

var pc60Busy = false;

function pc60UpdateBar(kind){
  const bar = document.getElementById("pc60Bar");
  if(!bar) return;
  const arr = pc60Arr(kind);
  const n = arr.length;
  const sum = bar.querySelector(".pc60-sum");
  const btn = bar.querySelector("button");
  if(sum){
    const units = {};
    arr.forEach(x=>{ units[x.unit||""] = (units[x.unit||""]||0) + Number(x.qty||0); });
    const unitKeys = Object.keys(units);
    const detail = unitKeys.length === 1 && kind === "prod" ? `الإجمالي ${pc60Num(units[unitKeys[0]])} ${unitKeys[0]}` : "اضغط للمراجعة";
    sum.innerHTML = n ? `<b>${n} ${n===1?"صنف":"أصناف"}</b><small>${detail}</small>` : `<b>لم تختر شيئاً</b><small>اضغط «إضافة» على أي صنف</small>`;
  }
  if(btn){
    btn.disabled = !n || pc60Busy;
    btn.innerHTML = kind === "prod" ? "مراجعة ورفع" : "السلة وإرسال";
  }
}

function pc70CartHtml(kind){
  const arr = pc60Arr(kind);
  if(!arr.length) return pc60Empty("fa-cart-shopping","السلة فارغة");
  const noteId = kind === "prod" ? "productionNote" : "warehouseOrderNote";
  const noteVal = document.getElementById(noteId)?.value || "";
  return `
    <div class="pc70-cartlist">
      ${arr.map(e=>{
        const id = escapeHtml(e.itemId||e.id);
        return `
          <div class="pc70-cartrow">
            <div class="pc70-cart-name"><b>${escapeHtml(e.name||"")}</b><small>${escapeHtml(e.code||"")}</small></div>
            <div class="pc60-step">
              <button type="button" class="minus" onclick="pc60Step('${kind}','${id}',-1)">−</button>
              <input type="text" inputmode="decimal" value="${pc60Num(e.qty)}" onfocus="this.select()" onchange="pc60SetQty('${kind}','${id}',this.value)">
              <button type="button" class="plus" onclick="pc60Step('${kind}','${id}',1)">+</button>
            </div>
            ${pc70UnitPicker(`pc70SetUnit('${kind}','${id}',this.value)`, e.unit)}
            <button type="button" class="pc70-cart-x" onclick="pc60SetQty('${kind}','${id}',0)" aria-label="حذف"><i class="fa-solid fa-xmark"></i></button>
          </div>`;
      }).join("")}
    </div>
    <textarea class="pc70-cartnote" placeholder="${kind==="prod"?"ملاحظة للإدارة (اختياري)":"ملاحظة للمستودع (اختياري)"}" oninput="document.getElementById('${noteId}').value=this.value">${escapeHtml(noteVal)}</textarea>`;
}

function pc70RefreshCart(kind){
  const box = document.getElementById("pc70CartBody");
  if(box) box.innerHTML = pc70CartHtml(kind);
}

async function pc70OpenCart(kind){
  if(pc60Busy) return;
  if(!pc60Arr(kind).length){ showToast("اختر صنفاً واحداً على الأقل","warn"); return; }
  const isProd = kind === "prod";
  const res = await pcSheet({
    title: isProd ? "مراجعة الإنتاج قبل الرفع" : "سلة الطلب",
    icon: isProd ? "fa-clipboard-check" : "fa-cart-shopping",
    body: `<div id="pc70CartBody">${pc70CartHtml(kind)}</div>`,
    actions:[
      {label: isProd ? "رفع الإنتاج" : "إرسال الطلب", kind:"btn-main", value:"send"},
      {label:"متابعة الاختيار", kind:"btn-light", value:"keep"}
    ]
  });
  if(res !== "send") return;
  if(!pc60Arr(kind).length){ showToast("السلة فارغة","warn"); return; }
  pc60Busy = true; pc60UpdateBar(kind);
  try{
    if(isProd) await submitProductionCore(); else await submitWarehouseOrderCore();
  }catch(err){
    console.error(err);
    showToast(isProd ? "تعذر رفع الإنتاج، حاول مرة أخرى" : "تعذر إرسال الطلب، حاول مرة أخرى","error");
  }finally{
    pc60Busy = false; pc60UpdateBar(kind);
  }
}

function submitProduction(){ return pc70OpenCart("prod"); }
function submitWarehouseOrder(){ return pc70OpenCart("req"); }

function pc60ListPage({kind, title, placeholder, handler, tab, extra=""}){
  pc60Filter[kind] = "all"; pc70Show = 40;
  const section = currentChef?.section || "";
  pageLayout(title, `
    ${pc60Bar({title, sub:`${section} • ${currentChef?.name||""}`, back:"renderChefDashboard(currentChef)", trailing:kind==="prod" ? pc60StatusChip() : ""})}
    <section class="pc60-page has-bar has-tabs">
      <div class="pc60-tools">
        <div class="pc70-searchrow">
          <label class="pc60-search"><i class="fa-solid fa-magnifying-glass"></i>
            <input id="pc60Search" type="search" placeholder="${placeholder}" oninput="pc70Search('${kind}')" autocomplete="off"></label>
          ${pcViewToggle("catalog")}
        </div>
        <div class="pc60-chips" id="pc60Chips"></div>
      </div>
      <div id="pc70Quick"></div>
      <div id="pc60List"></div>
      <details class="pc60-note">
        <summary><i class="fa-regular fa-pen-to-square"></i> إضافة ملاحظة</summary>
        <textarea id="${kind==="prod"?"productionNote":"warehouseOrderNote"}" placeholder="${kind==="prod"?"ملاحظة للإدارة":"ملاحظة للمستودع"}"></textarea>
      </details>
      ${extra}
    </section>
    <div class="pc60-actionbar" id="pc60Bar">
      <div class="pc60-sum"></div>
      <button type="button" class="btn btn-main" onclick="${handler}()" disabled>متابعة</button>
    </div>
    ${pc60Tabs(tab)}
  `,"renderChefDashboard(currentChef)");
  pc60DrawList(kind);
}

function renderProduction(){
  if(!currentChef) return renderChefs();
  const st = pc17ChefStatus();
  pc60ListPage({
    kind:"prod", title:"الإنتاج", placeholder:"ابحث عن صنف أو كود",
    handler:"submitProduction", tab:"production",
    extra:`<div id="lastProductionBox"></div>${st.cls==="pending" ? `<button type="button" class="pc60-link" onclick="submitNoProductionToday()">لا يوجد إنتاج اليوم؟ سجّلها</button>` : ""}`
  });
  drawLastProductionForChef();
}

function renderWarehouseRequest(){
  if(!currentChef) return renderChefs();
  pc60ListPage({
    kind:"req", title:"طلب من المستودع", placeholder:"ابحث عن صنف أو كود",
    handler:"submitWarehouseOrder", tab:"request"
  });
}

function drawLastProductionForChef(){
  const box = document.getElementById("lastProductionBox");
  if(!box) return;
  const log = getChefRecentProduction();
  if(!log){ box.innerHTML = ""; return; }
  const remaining = (log.expiresAtMs||0) - Date.now();
  box.innerHTML = `
    <section class="pc60-last">
      <div class="pc60-last-head"><b><i class="fa-solid fa-circle-check"></i> آخر إنتاج مرفوع</b><small>${escapeHtml(log.createdAtText||"")}</small></div>
      <div class="pc60-last-items">${(log.items||[]).map(i=>`<span>${escapeHtml(i.name||"")} <b>${pc60Num(i.qty)} ${escapeHtml(i.unit||"")}</b></span>`).join("")}</div>
      ${log.note ? `<p>${escapeHtml(log.note)}</p>` : ""}
      <small>يبقى ظاهراً لـ ${formatRemaining(remaining)}</small>
    </section>`;
}

var PC60_WASTE_REASONS = ["تالف","منتهي الصلاحية","احتراق","سقط / انسكب","خطأ تحضير","زيادة إنتاج","أخرى"];
var pc60W = {src:"menu", name:"", code:"", qty:1, unit:"حبة", reason:"", custom:""};

function renderWaste(){
  if(!currentChef) return renderChefs();
  pc60W = {src:"menu", name:"", code:"", qty:1, unit:"حبة", reason:"", custom:""};
  const today = pc17ChefWasteToday();
  pageLayout("الهدر", `
    ${pc60Bar({title:"الهدر والتالف", sub:`${currentChef.section||""} • ${currentChef.name||""}`, back:"renderChefDashboard(currentChef)",
      trailing:`<span class="pc60-chip ${today.length?"pending":"none"}" id="pc60WasteCount">اليوم ${today.length}</span>`})}
    <section class="pc60-page has-bar has-tabs">
      <section class="pc60-card">
        <div class="pc60-step-label"><i>1</i> ما الذي تلف؟</div>
        <div id="pc60WSel"></div>
      </section>
      <section class="pc60-card">
        <div class="pc60-step-label"><i>2</i> الكمية</div>
        <div class="pc60-bigstep" id="pc60WQty"></div>
      </section>
      <section class="pc60-card">
        <div class="pc60-step-label"><i>3</i> السبب</div>
        <div class="pc60-reasons" id="pc60WReasons"></div>
        <input id="pc60WCustom" class="pc60-custom" type="text" placeholder="اكتب السبب" hidden oninput="pc60W.custom=this.value;pc60WUpdateBar()">
      </section>
      <div class="pc50-section-title"><h2>سُجّل اليوم</h2></div>
      <div id="pc60WToday"></div>
    </section>
    <div class="pc60-actionbar" id="pc60Bar">
      <div class="pc60-sum" id="pc60WSum"></div>
      <button type="button" class="btn btn-danger" onclick="submitWaste()" disabled>تسجيل الهدر</button>
    </div>
    ${pc60Tabs("waste")}
  `,"renderChefDashboard(currentChef)");
  pc60WDrawSel(); pc60WDrawQty(); pc60WDrawReasons(); pc60WDrawToday(); pc60WUpdateBar();
}

function pc60WSource(){
  if(pc60W.src === "menu") return pc17MenuForChef().map(i=>({name:pc17ItemName(i), code:i.code||"", en:pc17ItemEn(i), unit:pc70Unit(i.unit)||"حبة"}));
  return (warehouseItems||[]).map(i=>({name:i.nameAr||i.name||"", code:i.code||"", en:i.nameEn||"", unit:pc70Unit(i.unit)||"كجم"}));
}

function pc60WDrawSel(){
  const box = document.getElementById("pc60WSel");
  if(!box) return;
  if(pc60W.name){
    box.innerHTML = `
      <div class="pc60-picked">
        <div><b>${escapeHtml(pc60W.name)}</b>${pc60W.code ? `<small>${escapeHtml(pc60W.code)}</small>` : ""}</div>
        <button type="button" onclick="pc60WPick('','')">تغيير</button>
      </div>`;
    return;
  }
  box.innerHTML = `
    <div class="pc60-seg2">
      <button type="button" class="${pc60W.src==="menu"?"active":""}" onclick="pc60W.src='menu';pc60WDrawSel()">منتج جاهز</button>
      <button type="button" class="${pc60W.src==="raw"?"active":""}" onclick="pc60W.src='raw';pc60WDrawSel()">مادة خام</button>
    </div>
    <label class="pc60-search"><i class="fa-solid fa-magnifying-glass"></i>
      <input id="pc60WSearch" type="search" placeholder="ابحث أو اكتب اسم الصنف" oninput="pc60WDrawList()" autocomplete="off"></label>
    <div id="pc60WList" class="pc60-wlist"></div>`;
  pc60WDrawList();
}

function pc60WDrawList(){
  const box = document.getElementById("pc60WList");
  if(!box) return;
  const q = (document.getElementById("pc60WSearch")?.value||"").trim();
  const ql = q.toLowerCase();
  const list = pc60WSource().filter(i=>!ql || [i.name,i.en,i.code].some(v=>String(v||"").toLowerCase().includes(ql)))
    .sort((a,b)=>a.name.localeCompare(b.name,"ar")).slice(0,40);
  let html = list.map(i=>`
    <button type="button" class="pc60-pick" data-name="${escapeHtml(i.name)}" data-code="${escapeHtml(i.code)}" data-unit="${escapeHtml(i.unit||"")}" onclick="pc60WPick(this.dataset.name,this.dataset.code,this.dataset.unit)">
      <b>${escapeHtml(i.name)}</b><small>${escapeHtml([i.code,i.en].filter(Boolean).join(" • "))}</small></button>`).join("");
  if(q && !list.some(i=>i.name===q)){
    html += `<button type="button" class="pc60-pick manual" data-name="${escapeHtml(q)}" data-code="" onclick="pc60WPick(this.dataset.name,'')"><b>استخدام «${escapeHtml(q)}» كاسم يدوي</b></button>`;
  }
  box.innerHTML = html || pc60Empty("fa-face-meh","اكتب اسم الصنف للبحث");
}

function pc60WPick(name,code,unit){
  pc60W.name = name; pc60W.code = code || "";
  if(unit) pc60W.unit = unit;
  pc60WDrawSel(); pc60WUpdateBar();
}

function pc60WDrawQty(){
  const box = document.getElementById("pc60WQty");
  if(!box) return;
  box.innerHTML = `
    <button type="button" onclick="pc60WStep(-1)" aria-label="إنقاص">−</button>
    <input type="text" inputmode="decimal" value="${pc60Num(pc60W.qty)}" onfocus="this.select()" onchange="pc60WSet(this.value)" aria-label="الكمية">
    <button type="button" onclick="pc60WStep(1)" aria-label="زيادة">+</button>
    ${pc70UnitPicker("pc60WUnit(this.value)", pc60W.unit)}`;
}

function pc60WUnit(u){
  pc60W.qty = pc70Conv(Number(pc60W.qty||0), pc60W.unit, u) || pc60W.qty;
  pc60W.unit = u;
  pc60WDrawQty(); pc60WUpdateBar();
}

function pc60WSet(v){
  let q = Math.round(Number(v||0)*100)/100;
  if(!isFinite(q) || q < 0) q = 0;
  pc60W.qty = q; pc60WDrawQty(); pc60WUpdateBar();
}

function pc60WStep(d){ pc60WSet(Math.max(0, Number(pc60W.qty||0)+d*pc70Step(pc60W.unit)*(pc70Step(pc60W.unit)>=100?1:1))); }

function pc60WDrawReasons(){
  const box = document.getElementById("pc60WReasons");
  if(!box) return;
  box.innerHTML = PC60_WASTE_REASONS.map(r=>
    `<button type="button" class="${pc60W.reason===r?"active":""}" onclick="pc60WReason('${r}')">${r}</button>`).join("");
  const custom = document.getElementById("pc60WCustom");
  if(custom) custom.hidden = pc60W.reason !== "أخرى";
}

function pc60WReason(r){
  pc60W.reason = r; pc60WDrawReasons();
  if(r === "أخرى") setTimeout(()=>document.getElementById("pc60WCustom")?.focus(),30);
  pc60WUpdateBar();
}

function pc60WReasonText(){
  return pc60W.reason === "أخرى" ? String(pc60W.custom||"").trim() : pc60W.reason;
}

function pc60WUpdateBar(){
  const sum = document.getElementById("pc60WSum");
  const btn = document.querySelector("#pc60Bar button");
  const ok = !!pc60W.name && Number(pc60W.qty) > 0 && !!pc60WReasonText();
  if(sum) sum.innerHTML = pc60W.name
    ? `<b>${escapeHtml(pc60W.name)} × ${pc60Num(pc60W.qty)} ${escapeHtml(pc60W.unit||"")}</b><small>${escapeHtml(pc60WReasonText() || "اختر السبب")}</small>`
    : `<b>اختر الصنف أولاً</b><small>ثم الكمية والسبب</small>`;
  if(btn) btn.disabled = !ok || pc60Busy;
}

function pc60WDrawToday(){
  const box = document.getElementById("pc60WToday");
  if(!box) return;
  const list = pc17ChefWasteToday().sort((a,b)=>(getTimeValue(b)||0)-(getTimeValue(a)||0));
  const cnt = document.getElementById("pc60WasteCount");
  if(cnt){ cnt.textContent = `اليوم ${list.length}`; cnt.className = `pc60-chip ${list.length?"pending":"none"}`; }
  box.innerHTML = list.length ? `<div class="pc60-timeline">${list.map(l=>`
      <div class="pc60-tl warn">
        <span class="pc60-tl-icon"><i class="fa-solid fa-trash-can"></i></span>
        <div><b>${escapeHtml(l.productName||"")} × ${pc60Num(l.qty)} ${escapeHtml(l.unit||"")}</b><small>${escapeHtml(l.reason||"")}</small></div>
        <time>${pc60Time(l)}</time>
      </div>`).join("")}</div>` : pc60Empty("fa-circle-check","لا يوجد هدر مسجّل اليوم");
}

async function submitWaste(){
  if(!currentChef) return renderChefs();
  if(pc60Busy) return;
  const productName = String(pc60W.name||"").trim();
  const qty = Number(pc60W.qty);
  const reason = pc60WReasonText();
  if(!productName || !qty || qty <= 0 || !reason){
    showToast("أكمل الصنف والكمية والسبب","error");
    return;
  }
  pc60Busy = true; pc60WUpdateBar();
  try{
    const {db,addDoc,collection,serverTimestamp} = window.firebaseDB;
    await addDoc(collection(db,"waste_logs"),{
      chefName:currentChef.name,
      chefId:currentChef.id,
      section:currentChef.section,
    branchId:currentBranch,
      productName,
      store:pc60W.src === "raw" ? "raw" : "prod",
      itemCode:pc60W.code || "",
      qty,
      unit:pc60W.unit || "",
      reason,
      createdAtText:nowText(),
      timeMs:Date.now(),
      createdAt:serverTimestamp()
    });
    showToast("تم تسجيل الهدر");
    pc60W = {src:pc60W.src, name:"", code:"", qty:1, unit:pc60W.src==="menu"?"حبة":"كجم", reason:"", custom:""};
    const custom = document.getElementById("pc60WCustom"); if(custom) custom.value = "";
    pc60WDrawSel(); pc60WDrawQty(); pc60WDrawReasons(); pc60WDrawToday();
  }catch(err){
    console.error(err);
    showToast("تعذر تسجيل الهدر، حاول مرة أخرى","error");
  }finally{
    pc60Busy = false; pc60WUpdateBar();
  }
}

var pc60OrderFilter = "all";

function pc60OrderStatusLabel(o){
  if(o.status === "جديد" || !o.status) return "بانتظار المستودع";
  if(o.status === "جاهز") return "جاهز للاستلام";
  return o.status;
}

function pc60OrderTone(o){
  if(o.status === "جاهز") return "done";
  if(o.status === "تم الاستلام") return "none";
  return "pending";
}

function pc60SetOrderFilter(f){ pc60OrderFilter = f; pc60DrawOrders(); }

function renderMyOrders(){
  if(!currentChef) return renderChefs();
  pc60OrderFilter = pc60ChefOrders().some(o=>o.status==="جاهز") ? "ready" : "all";
  pageLayout("طلباتي", `
    ${pc60Bar({title:"طلباتي", sub:`${currentChef.section||""} • ${currentChef.name||""}`, back:"renderChefDashboard(currentChef)",
      trailing:`<button type="button" class="pc60-back" onclick="renderWarehouseRequest()" aria-label="طلب جديد"><i class="fa-solid fa-plus"></i></button>`})}
    <section class="pc60-page has-tabs">
      <div class="pc60-tools"><div class="pc60-chips" id="pc60OrderChips"></div></div>
      <div id="pc60Orders"></div>
    </section>
    ${pc60Tabs("orders")}
  `,"renderChefDashboard(currentChef)");
  pc60DrawOrders();
}

var pc60SeenStatus = null;
function pc60CheckReady(){
  if(!currentChef || !document.querySelector(".pc60-tabs")){ pc60SeenStatus = null; return; }
  const now = {};
  pc60ChefOrders().forEach(o=>{ now[o.id] = o.status; });
  if(pc60SeenStatus){
    Object.keys(now).forEach(id=>{
      if(now[id] === "جاهز" && pc60SeenStatus[id] && pc60SeenStatus[id] !== "جاهز"){
        const o = warehouseOrders.find(x=>x.id===id);
        showToast(`📦 طلبك #${o?.orderId||""} جاهز للاستلام`,"warn");
        try{ navigator.vibrate && navigator.vibrate([140,60,140]); }catch(e){}
      }
    });
  }
  pc60SeenStatus = now;
}

function pc60LiveRefresh(){
  try{
    if(typeof pc61LiveHome === "function") pc61LiveHome();
    pc60CheckReady();
    if(document.getElementById("pc60Orders")) pc60DrawOrders();
    const dash = document.getElementById("pc60DashBody");
    if(dash && currentChef) dash.innerHTML = pc60DashBody(currentChef);
    if(document.getElementById("pc60WToday")) pc60WDrawToday();
    pc93Live();
    pc60RefreshTabBadges();
  }catch(e){}
}

function pc61Stats(){
  const c = pc43Counts();
  let cs = {total:0, done:0, missing:0}, os = {total:0, done:0, missing:0};
  try{ cs = pc27CleaningStats(); }catch(e){}
  try{ os = pc27OperationStats(); }catch(e){}
  const chefTotal = (chefs||[]).length;
  const chefDone = Math.max(0, chefTotal - (c.pending||0));
  const total = chefTotal + cs.total + os.total;
  const done = chefDone + cs.done + os.done;
  let waste = 0;
  try{ waste = pc32Today(wasteLogs||[]).length; }catch(e){}
  return {
    prodQty:c.prodQty||0, newWh:c.newWh||0, pending:c.pending||0,
    cs, os, chefTotal, chefDone, total, done,
    pct: total ? Math.round(done*100/total) : null,
    waste, notify: pc43NotificationsCount()
  };
}

function pc61Ring(pct){
  const r = 30, C = 2*Math.PI*r;
  const off = pct === null ? C : C*(1 - pct/100);
  return `
    <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7"/>
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="#B7E07E" stroke-width="7" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 36 36)"/>
    </svg>
    <b>${pct === null ? "—" : pct + "%"}</b>`;
}

function pc61Card(icon,title,sub,fn,badge="",tone=""){
  return `
    <button type="button" class="pc50-card ${tone}" onclick="${fn}">
      <div class="pc50-icon"><i class="fa-solid ${icon}"></i></div>
      <b>${escapeHtml(title)}</b>
      <span>${sub}</span>
      ${badge ? `<em>${badge}</em>` : ""}
    </button>`;
}

var pc61Sig = "";

function renderHome(){
  if(typeof ensureUxStyle === "function") ensureUxStyle();
  currentBackFn = "renderHome()";
  currentChef = null;
  app.innerHTML = `
    <main class="app pc43-home pc50-home pc61-home">${pc61HomeHtml()}</main>
    ${typeof pc18BottomNav === "function" ? pc18BottomNav("home") : ""}`;
  pc61Sig = JSON.stringify(pc61Stats()) + pcViewMode("home");
}

window.addEventListener("online", ()=>{ const el = document.getElementById("pc61Net"); if(el) el.className="pc61-dot on"; });
window.addEventListener("offline", ()=>{ const el = document.getElementById("pc61Net"); if(el) el.className="pc61-dot off"; });

var pc72Deferred = null;
var pc72Installed = false;

function pc72IsStandalone(){
  try{ return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }catch(e){ return false; }
}
function pc72IsIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function pc72Dismissed(){
  try{ return Date.now() - Number(localStorage.getItem("pc72Dismiss")||0) < 7*24*60*60*1000; }catch(e){ return false; }
}
function pc72CanOffer(){
  if(pc72IsStandalone() || pc72Installed || pc72Dismissed()) return false;
  return !!pc72Deferred || pc72IsIOS();
}
function pc72InstallCard(){
  if(!pc72CanOffer()) return '<div id="pc72Install"></div>';
  return `<div id="pc72Install"><section class="pc72-install">
    <img src="assets/icon-192.png" alt="" width="48" height="48">
    <div><b>ثبّت التطبيق على جوالك</b><small>فتح أسرع وبدون شريط المتصفح</small></div>
    <button type="button" class="btn btn-main" onclick="pc72Install()">تثبيت</button>
    <button type="button" class="pc72-x" onclick="pc72Dismiss()" aria-label="إخفاء"><i class="fa-solid fa-xmark"></i></button>
  </section></div>`;
}
function pc72Redraw(){
  const el = document.getElementById("pc72Install");
  if(el) el.outerHTML = pc72InstallCard();
}
function pc72Dismiss(){
  try{ localStorage.setItem("pc72Dismiss", String(Date.now())); }catch(e){}
  pc72Redraw();
}
async function pc72Install(){
  if(pc72Deferred){
    try{
      pc72Deferred.prompt();
      const r = await pc72Deferred.userChoice;
      if(r && r.outcome === "accepted") pc72Installed = true;
    }catch(e){}
    pc72Deferred = null;
    pc72Redraw();
    return;
  }
  if(pc72IsIOS()){
    pcSheet({
      title:"التثبيت على الآيفون", icon:"fa-mobile-screen",
      body:`<ol class="pc72-steps">
        <li>افتح الموقع في متصفح <b>Safari</b></li>
        <li>اضغط زر المشاركة <i class="fa-solid fa-arrow-up-from-bracket"></i> أسفل الشاشة</li>
        <li>اختر <b>إضافة إلى الشاشة الرئيسية</b></li>
        <li>اضغط <b>إضافة</b></li></ol>`,
      actions:[{label:"فهمت", kind:"btn-main", value:"ok"}]
    });
    return;
  }
  showToast("افتح قائمة المتصفح واختر «تثبيت التطبيق»","warn");
}

window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); pc72Deferred = e; pc72Redraw(); });
window.addEventListener("appinstalled", ()=>{ pc72Installed = true; pc72Deferred = null; pc72Redraw(); showToast("تم تثبيت التطبيق"); });

function pc72UpdateBanner(reg){
  if(document.getElementById("pc72Update")) return;
  const d = document.createElement("div");
  d.id = "pc72Update"; d.className = "pc72-update";
  d.innerHTML = '<span><i class="fa-solid fa-arrow-rotate-right"></i> يتوفر تحديث جديد</span><button type="button">تحديث</button>';
  d.querySelector("button").onclick = ()=>{ try{ reg.waiting && reg.waiting.postMessage("skipWaiting"); }catch(e){} setTimeout(()=>location.reload(),250); };
  document.body.appendChild(d);
}
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").then(reg=>{
      if(reg.waiting && navigator.serviceWorker.controller) pc72UpdateBanner(reg);
      reg.addEventListener("updatefound", ()=>{
        const w = reg.installing;
        if(w) w.addEventListener("statechange", ()=>{ if(w.state === "installed" && navigator.serviceWorker.controller) pc72UpdateBanner(reg); });
      });
    }).catch(()=>{});
  });
}

function pc73Step(o){
  if(o.status === "تم الاستلام") return 3;
  if(o.status === "جاهز") return 2;
  return 1;
}
function pc73Tracker(o){
  const labels = ["أُرسل","قيد التجهيز","جاهز","تم الاستلام"];
  const cur = pc73Step(o);
  return `<div class="pc73-track">${labels.map((l,i)=>`<span class="${i<cur?"done":(i===cur?"cur":"")}"><i></i><em>${l}</em></span>`).join("")}</div>`;
}
function pc73DayLabel(o){
  const t = Number(o.createdAtMs || (typeof getTimeValue==="function" ? getTimeValue(o) : 0) || 0);
  if(!t) return "أقدم";
  const d = new Date(t), n = new Date();
  const k = x=>x.getFullYear()*10000+x.getMonth()*100+x.getDate();
  const y = new Date(n); y.setDate(n.getDate()-1);
  if(k(d)===k(n)) return "اليوم";
  if(k(d)===k(y)) return "أمس";
  return d.toLocaleDateString("ar",{weekday:"long",day:"numeric",month:"long"});
}
function pc60OrderCard(o){
  const items = o.items || [];
  const partial = (o.issueStatus === "صرف جزئي" || o.issueStatus === "لم يصرف") && o.status !== "جديد";
  const names = items.slice(0,2).map(i=>i.name).filter(Boolean).join("، ");
  const more = items.length > 2 ? ` +${items.length-2}` : "";
  return `
    <article class="pc60-order pc73-card ${o.status==="جاهز"?"ready":""}" onclick="pc73Details('${escapeHtml(o.id)}')">
      <header>
        <div><b>طلب #${escapeHtml(o.orderId||"")}</b><small>${escapeHtml(o.createdAtText||"")}</small></div>
        <span class="pc60-chip ${pc60OrderTone(o)}">${pc60OrderStatusLabel(o)}</span>
      </header>
      ${pc73Tracker(o)}
      <p class="pc73-sum">${items.length} ${items.length===1?"صنف":"أصناف"}: ${escapeHtml(names)}${more}</p>
      ${partial ? `<p class="pc60-order-warn">${escapeHtml(o.issueStatus)}</p>` : ""}
      ${o.status==="جاهز" ? `<button type="button" class="btn btn-main pc60-wide" onclick="event.stopPropagation();pc60Receive('${escapeHtml(o.id)}')">تأكيد الاستلام</button>` : ""}
    </article>`;
}
function pc73Details(id){
  const o = warehouseOrders.find(x=>x.id===id); if(!o) return;
  const rows = (o.items||[]).map(i=>{
    const issued = (i.issuedQty===undefined||i.issuedQty===null) ? null : Number(i.issuedQty);
    const diff = issued!==null && issued!==Number(i.qty);
    return `<div class="pc73-row ${diff?"diff":""}"><span>${escapeHtml(i.name||"")}</span><b>${issued===null?`${pc60Num(i.qty)} ${escapeHtml(i.unit||"")}`:`${pc60Num(issued)} من ${pc60Num(i.qty)} ${escapeHtml(i.unit||"")}`}</b></div>`;
  }).join("");
  pcSheet({
    title:`طلب #${o.orderId||""}`, icon:"fa-clipboard-list",
    body:`${pc73Tracker(o)}<div class="pc73-list">${rows}</div>${o.note?`<p class="pc60-order-note">${escapeHtml(o.note)}</p>`:""}<small class="pc73-time">${escapeHtml(o.createdAtText||"")}</small>`,
    actions:[{label:"إغلاق", kind:"btn-light", value:"x"}]
  });
}
function pc60DrawOrders(){
  const box = document.getElementById("pc60Orders");
  const chips = document.getElementById("pc60OrderChips");
  if(!box) return;
  const all = pc60ChefOrders();
  const groups = {all, ready:all.filter(o=>o.status==="جاهز"), wait:all.filter(o=>o.status==="جديد"||!o.status), done:all.filter(o=>o.status==="تم الاستلام")};
  if(chips) chips.innerHTML = [["all","الكل"],["ready","جاهز"],["wait","قيد المعالجة"],["done","مستلمة"]].map(c=>
    `<button type="button" class="pc60-fchip ${pc60OrderFilter===c[0]?"active":""}" onclick="pc60SetOrderFilter('${c[0]}')">${c[1]} ${groups[c[0]].length?`(${groups[c[0]].length})`:""}</button>`).join("");
  const list = groups[pc60OrderFilter] || all;
  if(!list.length){ box.innerHTML = pc60Empty("fa-clipboard","لا توجد طلبات في هذا التصنيف"); return; }
  const by = {}, order = [];
  list.forEach(o=>{ const k = pc73DayLabel(o); if(!by[k]){ by[k]=[]; order.push(k); } by[k].push(o); });
  box.innerHTML = order.map(k=>`<div class="pc60-group">${escapeHtml(k)}</div>${by[k].map(pc60OrderCard).join("")}`).join("");
}

var pc74Range = {prod:7, waste:7};
var pc74Lim = {prod:40, waste:40};
var pc19Lim = 30;
var pc74Section = {prod:"all", waste:"all"}, pc74Branch = {prod:"all", waste:"all"}, pc19Branch = "all";

function pc74Filter(kind){
  const src = kind === "prod" ? (productionLogs||[]) : (wasteLogs||[]);
  const days = pc74Range[kind], sec = pc74Section[kind];
  const from = days ? Date.now() - days*86400000 : 0;
  return sortNewest(src.filter(l=>(!days || (getTimeValue(l)||0) >= from) && (sec==="all" || l.section===sec) && (pc74Branch[kind]==="all" || pcBranchOf(l)===pc74Branch[kind]) && !l.noProduction));
}
function pc74Lines(kind,logs){
  const out = [];
  logs.forEach(l=>{
    const br = pcBranchName(pcBranchOf(l));
    if(kind === "prod") (l.items||[]).forEach(i=>out.push({branch:br, name:i.name||"", qty:Number(i.qty||0), unit:i.unit||"", section:l.section||"", chef:l.chefName||"", when:l.createdAtText||"", note:l.note||"", reason:""}));
    else out.push({branch:br, name:l.productName||"", qty:Number(l.qty||0), unit:l.unit||"", section:l.section||"", chef:l.chefName||"", when:l.createdAtText||"", note:"", reason:l.reason||""});
  });
  return out;
}
function pc74Totals(lines){
  const t = {};
  lines.forEach(x=>{ t[x.unit||"—"] = (t[x.unit||"—"]||0) + x.qty; });
  return Object.keys(t).map(u=>`${pc60Num(pc70R(t[u]))} ${u==="—"?"":u}`).join(" + ") || "0";
}
function pc74Top(lines,keyFn,n=5){
  const m = {};
  lines.forEach(x=>{ const k = keyFn(x)||"—"; m[k] = (m[k]||0)+1; });
  const rows = Object.keys(m).map(k=>({k,n:m[k]})).sort((a,b)=>b.n-a.n).slice(0,n);
  const max = rows.length ? rows[0].n : 1;
  return rows.map(r=>`<div class="pc74-bar"><span>${escapeHtml(r.k)}</span><div><i style="width:${Math.round(r.n/max*100)}%"></i></div><b>${r.n}</b></div>`).join("");
}
function pc74SetRange(kind,v){ pc74Range[kind] = v; pc74Lim[kind] = 40; kind==="prod" ? drawProductionAdmin() : drawWasteAdmin(); }
function pc74SetBranch(kind,v){ pc74Branch[kind] = v; kind==="prod" ? drawProductionAdmin() : drawWasteAdmin(); }
function pc74SetSection(kind,v){ pc74Section[kind] = v; kind==="prod" ? drawProductionAdmin() : drawWasteAdmin(); }

function pc74Export(kind){
  const lines = pc74Lines(kind,pc74Filter(kind));
  if(!lines.length){ showToast("لا توجد بيانات للتصدير","warn"); return; }
  const head = kind==="prod" ? ["الفرع","القسم","الشيف","الصنف","الكمية","الوحدة","الوقت","ملاحظة"] : ["الفرع","القسم","الشيف","الصنف","الكمية","الوحدة","السبب","الوقت"];
  const rows = [head, ...lines.map(x=>kind==="prod" ? [x.branch,x.section,x.chef,x.name,x.qty,x.unit,x.when,x.note] : [x.branch,x.section,x.chef,x.name,x.qty,x.unit,x.reason,x.when])];
  downloadTextFile(`${kind==="prod"?"production":"waste"}-${new Date().toISOString().slice(0,10)}.csv`, "﻿"+rows.map(r=>r.map(csvEscape).join(",")).join("\n"));
}

function pc74Page(kind){
  const isProd = kind === "prod";
  const logs = pc74Filter(kind);
  const lines = pc74Lines(kind,logs);
  const src = isProd ? (productionLogs||[]) : (wasteLogs||[]);
  const sections = [...new Set(src.map(l=>l.section).filter(Boolean))];
  const ranges = [[1,"اليوم"],[7,"7 أيام"],[30,"30 يوم"],[0,"الكل"]];
  const chefs = new Set(logs.map(l=>l.chefName)).size;
  const mode = isProd ? "production" : "waste";
  const logTable = "production_logs";
  return `
    <section class="pc74-head">
      ${pcBranchChips(pc74Branch[kind],`pc74SetBranch.bind(null,'${kind}')`)}
      <div class="pc60-chips">${ranges.map(r=>`<button type="button" class="pc60-fchip ${pc74Range[kind]===r[0]?"active":""}" onclick="pc74SetRange('${kind}',${r[0]})">${r[1]}</button>`).join("")}</div>
      ${sections.length>1 ? `<div class="pc60-chips"><button type="button" class="pc60-fchip ${pc74Section[kind]==="all"?"active":""}" onclick="pc74SetSection('${kind}','all')">كل الأقسام</button>${sections.map(s=>`<button type="button" class="pc60-fchip ${pc74Section[kind]===s?"active":""}" data-s="${escapeHtml(s)}" onclick="pc74SetSection('${kind}',this.dataset.s)">${escapeHtml(s)}</button>`).join("")}</div>` : ""}
    </section>
    <section class="pc74-kpis">
      <div><b>${logs.length}</b><span>${isProd?"عملية رفع":"عملية هدر"}</span></div>
      <div><b>${lines.length}</b><span>${isProd?"سطر إنتاج":"صنف"}</span></div>
      <div><b>${chefs}</b><span>شيف</span></div>
    </section>
    <section class="pc74-total"><span>${isProd?"إجمالي الإنتاج":"إجمالي الهدر"}</span><b>${pc74Totals(lines)}</b></section>
    ${lines.length ? `
    <section class="pc74-card"><h4>${isProd?"الأكثر إنتاجاً":"الأكثر هدراً"}</h4>${pc74Top(lines,x=>x.name)}</section>
    <section class="pc74-card"><h4>${isProd?"حسب القسم":"أسباب الهدر"}</h4>${pc74Top(lines,x=>isProd?x.section:x.reason)}</section>` : ""}
    <div class="pc74-actions">
      <button class="btn btn-main" onclick="pc74Export('${kind}')"><i class="fa-solid fa-file-excel"></i> تصدير Excel</button>
      <button class="btn btn-light" onclick="printReport('${isProd?"production":"waste"}')"><i class="fa-solid fa-print"></i> طباعة</button>
      <button class="btn btn-light danger-btn" onclick="deleteAllPrinted('${isProd?"production_logs":"waste_logs"}','${isProd?"renderAdminProduction":"renderAdminWaste"}')"><i class="fa-solid fa-trash"></i> حذف المطبوع</button>
    </div>
    ${logs.length ? logs.slice(0,pc74Lim[kind]).map(log=>`
      <details class="pc74-log">
        <summary>
          <div><b>${escapeHtml(log.section||"")} · ${escapeHtml(log.chefName||"")}</b><small>${escapeHtml(log.createdAtText||"")}</small>${pcBranchTag(log)}</div>
          <em>${isProd ? `${(log.items||[]).length} أصناف` : `${pc60Num(log.qty)} ${escapeHtml(log.unit||"")}`}</em>
          ${log.printed ? `<span class="pc60-chip none">مطبوع</span>` : ""}
        </summary>
        <div class="pc74-body">
          ${isProd ? (log.items||[]).map(i=>`<div class="pc73-row"><span>${escapeHtml(i.name||"")}</span><b>${pc60Num(i.qty)} ${escapeHtml(i.unit||"")}</b></div>`).join("")
                   : `<div class="pc73-row"><span>${escapeHtml(log.productName||"")}</span><b>${pc60Num(log.qty)} ${escapeHtml(log.unit||"")}</b></div><p class="pc60-order-note">السبب: ${escapeHtml(log.reason||"")}</p>`}
          ${log.note ? `<p class="pc60-order-note">${escapeHtml(log.note)}</p>` : ""}
          ${adminActionMenu(isProd?'production_logs':'waste_logs',log.id,isProd?`printProductionLog('${log.id}')`:`printWasteLog('${log.id}')`,!!log.printed,isProd?'renderAdminProduction':'renderAdminWaste')}
        </div>
      </details>`).join("") + (logs.length>pc74Lim[kind] ? `<button type="button" class="pc60-more-btn" onclick="pc74Lim['${kind}']+=60;${kind==="prod"?"drawProductionAdmin":"drawWasteAdmin"}()">عرض المزيد (${logs.length-pc74Lim[kind]})</button>` : "") : pc60Empty("fa-chart-simple","لا توجد بيانات في هذه الفترة")}`;
}
function drawProductionAdmin(){ const b=document.getElementById("productionAdminBox"); if(b) b.innerHTML = pc74Page("prod"); }
function drawWasteAdmin(){ const b=document.getElementById("wasteAdminBox"); if(b) b.innerHTML = pc74Page("waste"); }

function pc75Kind(kind){
  return kind === "wh"
    ? {col:"warehouse_items", list:()=>warehouseItems, redraw:drawWarehouseItems, label:"أصناف المستودع"}
    : {col:"menu_items", list:()=>menuItems, redraw:drawMenuItems, label:"أصناف المنيو والإنتاج"};
}

function drawWarehouseItems(){
  const box = document.getElementById("warehouseItemsContainer"); if(!box) return;
  const q = (document.getElementById("warehouseSearch")?.value||"").trim().toLowerCase();
  const list = sortNewest(warehouseItems).filter(i=>!q || [itemDisplayName(i),itemDisplayEn(i),itemCode(i),i.unit,i.category].some(v=>String(v||"").toLowerCase().includes(q)));
  if(!list.length){ box.innerHTML = `<div class="placeholder">${q?"لا توجد نتائج":"لا توجد أصناف"}</div>`; return; }
  box.innerHTML = `<div class="pc75-count">${list.length} صنف</div><table class="premium-table"><thead><tr><th>الكود</th><th>العربي</th><th>English</th><th>الوحدة</th><th>التصنيف</th><th>المتوفر</th><th>إجراء</th></tr></thead><tbody>${list.slice(0,pc75Lim.wh).map(i=>`<tr><td>${escapeHtml(itemCode(i)||"-")}</td><td><b>${escapeHtml(itemDisplayName(i))}</b>${pc90Unavailable(i)?`<span class="pc90-tag">غير متوفر</span>`:""}</td><td>${escapeHtml(itemDisplayEn(i)||"-")}</td><td>${escapeHtml(i.unit||"")}</td><td>${escapeHtml(i.category||"-")}</td><td>${pc86Stock(i)===null?"-":`<b>${pc60Num(pc86Stock(i))}</b>`}</td><td class="pc75-acts"><button class="mini-light" onclick="pc75Edit('wh','${i.id}')">تعديل</button><button class="mini-danger" onclick="pc75Delete('wh','${i.id}')">حذف</button></td></tr>`).join("")}</tbody></table>${list.length>pc75Lim.wh?`<button type="button" class="pc60-more-btn" onclick="pc75Lim.wh+=100;drawWarehouseItems()">عرض المزيد (${list.length-pc75Lim.wh})</button>`:""}`;
}

function drawMenuItems(){
  const box = document.getElementById("menuItemsContainer"); if(!box) return;
  const q = (document.getElementById("menuSearch")?.value||"").trim().toLowerCase();
  const list = sortNewest(menuItems).filter(i=>!q || [i.nameAr,i.nameEn,i.code,i.section].some(v=>String(v||"").toLowerCase().includes(q)));
  if(!list.length){ box.innerHTML = `<div class="placeholder">${q?"لا توجد نتائج":"لا توجد أصناف إنتاج"}</div>`; return; }
  box.innerHTML = `<div class="pc75-count">${list.length} صنف</div><table class="premium-table"><thead><tr><th>الكود</th><th>العربي</th><th>English</th><th>القسم</th><th>إجراء</th></tr></thead><tbody>${list.slice(0,pc75Lim.menu).map(i=>`<tr><td>${escapeHtml(i.code||"-")}</td><td><b>${escapeHtml(i.nameAr||"")}</b></td><td>${escapeHtml(i.nameEn||"-")}</td><td>${escapeHtml(i.section||"-")}</td><td class="pc75-acts"><button class="mini-light" onclick="pc75Edit('menu','${i.id}')">تعديل</button><button class="mini-danger" onclick="pc75Delete('menu','${i.id}')">حذف</button></td></tr>`).join("")}</tbody></table>${list.length>pc75Lim.menu?`<button type="button" class="pc60-more-btn" onclick="pc75Lim.menu+=100;drawMenuItems()">عرض المزيد (${list.length-pc75Lim.menu})</button>`:""}`;
}

async function pc75Delete(kind,id,fromEdit){
  const k = pc75Kind(kind);
  const it = k.list().find(x=>x.id===id);
  const name = it ? (it.nameAr||it.name||"") : "";
  if(!await pcConfirm(`سيتم حذف «${name}» نهائياً.`, {danger:true, title:"حذف صنف", okText:"نعم، احذف"})) return;
  try{ await deleteDocByPath(k.col,id); showToast("تم الحذف"); if(fromEdit) openSettingsTab(kind==="wh"?"warehouse":"menu"); }
  catch(e){ console.error(e); showToast("تعذر الحذف","error"); }
}

function pc90Unavailable(w){
  if(!w) return false;
  const st = pc86Stock(w);
  return w.unavailable === true || (st !== null && st <= 0);
}
function pc75Edit(kind,id){
  const k = pc75Kind(kind);
  const it = k.list().find(x=>x.id===id); if(!it) return;
  const isWh = kind === "wh";
  const curUnit = pc70Unit(it.unit) || "";
  const unitOpts = Object.keys(PC70_UNITS);
  const stock = pc86Stock(it);
  const back = `openSettingsTab('${isWh?"warehouse":"menu"}')`;
  pageLayout("تعديل الصنف", `
    ${pc60Bar({title:"تعديل الصنف", sub:escapeHtml(it.nameAr||it.name||""), back})}
    <section class="pc60-page has-bar pc90-edit">
      <div class="pc60-card">
        <label>الكود</label><input id="pc75Code" value="${escapeHtml(it.code||"")}">
        <label>الاسم بالعربي</label><input id="pc75Ar" value="${escapeHtml(it.nameAr||it.name||"")}">
        <label>الاسم بالإنجليزي</label><input id="pc75En" dir="ltr" value="${escapeHtml(it.nameEn||"")}">
      </div>
      ${isWh ? `
      <div class="pc60-card">
        <label>الوحدة</label>
        <select id="pc75Unit">${unitOpts.includes(curUnit)||!curUnit ? "" : `<option selected>${escapeHtml(curUnit)}</option>`}${unitOpts.map(u=>`<option ${u===curUnit?"selected":""}>${u}</option>`).join("")}</select>
        <label>التصنيف</label>
        <input id="pc75Cat" list="warehouseCatList" value="${escapeHtml(it.category||"")}">
        <datalist id="warehouseCatList">${PC70_CATS.map(c=>`<option value="${c[0]}">`).join("")}</datalist>
      </div>
      <div class="pc60-card">
        <label>الكمية المتاحة <small>(فارغ = بدون تتبع)</small></label>
        <input id="pc75Stock" type="number" min="0" step="any" inputmode="decimal" value="${stock===null?"":stock}">
        <label class="pc90-switch"><input id="pc75Unavail" type="checkbox" ${it.unavailable===true?"checked":""}>
          <span><b>غير متوفر حالياً</b><small>يظهر لمسؤول المستودع في قائمة الطلبات</small></span></label>
      </div>` : `
      <div class="pc60-card">
        <label>القسم</label>
        <select id="pc75Sec"><option value="">بدون قسم</option>${chefSections.map(s=>`<option ${s.name===it.section?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}</select>
      </div>`}
      <button type="button" class="pc90-del" onclick="pc75Delete('${kind}','${id}',true)"><i class="fa-solid fa-trash"></i> حذف الصنف</button>
    </section>
    <div class="pc60-actionbar">
      <button type="button" class="btn btn-light" onclick="${back}">إلغاء</button>
      <button type="button" class="btn btn-main" onclick="pc75Save('${kind}','${id}')">حفظ التعديل</button>
    </div>`, back);
}

async function pc75Save(kind,id){
  const k = pc75Kind(kind);
  const g = i=>document.getElementById(i);
  const isWh = kind === "wh";
  const v = {code:g("pc75Code").value.trim(), ar:g("pc75Ar").value.trim(), en:g("pc75En").value.trim()};
  if(!v.ar && !v.en){ showToast("اكتب اسم الصنف","error"); return; }
  if(v.code && k.list().some(x=>x.id!==id && String(x.code||"")===v.code)){ showToast("كود الصنف مستخدم","error"); return; }
  const it = k.list().find(x=>x.id===id) || {};
  let data;
  if(isWh){
    const st = g("pc75Stock").value.trim();
    data = {name:v.ar||v.en, nameAr:v.ar||v.en, nameEn:v.en, code:v.code, unit:g("pc75Unit").value||it.unit||"",
            category:g("pc75Cat").value.trim(), stockQty:(st!=="" && isFinite(Number(st))) ? Number(st) : null,
            unavailable:g("pc75Unavail").checked};
  }else{
    data = {nameAr:v.ar||v.en, nameEn:v.en, code:v.code, section:g("pc75Sec").value||""};
  }
  try{
    const {db,doc,updateDoc} = window.firebaseDB;
    await updateDoc(doc(db,k.col,id),data);
    showToast("تم حفظ التعديل");
    openSettingsTab(isWh?"warehouse":"menu");
  }catch(e){ console.error(e); showToast("تعذر الحفظ","error"); }
}

async function pc75DeleteAll(kind){
  const k = pc75Kind(kind);
  const list = [...k.list()];
  if(!list.length){ showToast("لا توجد أصناف للحذف","warn"); return; }
  if(!await pcConfirm(`سيتم حذف جميع ${k.label} (${list.length} صنف) نهائياً ولا يمكن التراجع. يُنصح بتصدير نسخة Excel أولاً.`, {danger:true, title:"حذف الكل", okText:"نعم، احذف الكل"})) return;
  const word = await pcSheet({
    title:"تأكيد أخير", icon:"fa-triangle-exclamation", tone:"danger",
    body:`<p>اكتب كلمة <b>حذف</b> للتأكيد</p><input id="pc75Word" class="pc60-custom" placeholder="حذف">`,
    actions:[{label:"حذف نهائي", kind:"btn-danger", value:h=>h.querySelector("#pc75Word").value.trim()},{label:"إلغاء", kind:"btn-light", value:null}]
  });
  if(word !== "حذف"){ if(word !== null) showToast("لم يتم الحذف: الكلمة غير مطابقة","warn"); return; }
  let n = 0;
  try{
    for(let i=0;i<list.length;i+=25){
      await Promise.all(list.slice(i,i+25).map(it=>deleteDocByPath(k.col,it.id)));
      n = Math.min(list.length,i+25);
      const b = document.getElementById("pc92Prog"); if(b) b.textContent = `${n}/${list.length}`;
    }
    showToast(`تم حذف ${n} صنف`);
  }catch(e){ console.error(e); showToast(`توقف الحذف بعد ${n} صنف`,"error"); }
}

function renderSettingsExcel(){
  settingsShell("excel","استيراد وتصدير Excel",`
    <div class="excel-grid">
      <div class="premium-card"><h3>أصناف المستودع</h3>
        <p class="muted">الأعمدة: الكود | العربي | English | الوحدة | التصنيف | الكمية (اختياري)</p>
        <input id="warehouseExcelInput" type="file" accept=".xlsx,.xls,.csv">
        <button class="btn btn-main" onclick="importWarehouseExcel()">استيراد</button>
        <button class="btn btn-light" onclick="exportWarehouseCSV()">تصدير نسخة</button>
        <button class="btn btn-light" onclick="openSettingsTab('warehouse')">عرض وتعديل (${warehouseItems.length})</button>
        <button class="btn btn-danger" onclick="pc75DeleteAll('wh')"><i class="fa-solid fa-trash"></i> حذف كل أصناف المستودع</button>
      </div>
      <div class="premium-card"><h3>أصناف المنيو والإنتاج</h3>
        <p class="muted">الأعمدة: الكود | العربي | English | القسم</p>
        <input id="menuExcelInput" type="file" accept=".xlsx,.xls,.csv">
        <button class="btn btn-main" onclick="importMenuExcel()">استيراد</button>
        <button class="btn btn-light" onclick="exportMenuCSV()">تصدير نسخة</button>
        <button class="btn btn-light" onclick="openSettingsTab('menu')">عرض وتعديل (${menuItems.length})</button>
        <button class="btn btn-danger" onclick="pc75DeleteAll('menu')"><i class="fa-solid fa-trash"></i> حذف كل أصناف المنيو</button>
      </div>
    </div>
    <div class="premium-card"><h3>ملاحظة</h3><p class="muted">الكود اختياري. الصف الأول عناوين الأعمدة. الحذف الجماعي لا يمكن التراجع عنه، فصدّر نسخة قبله.</p></div>`);
}

var pcLang = (function(){ try{ return localStorage.getItem("pcLang")==="en" ? "en" : "ar"; }catch(e){ return "ar"; } })();
var pcTrNodes = new Set();
var pcTrAttrs = new Map();
var pcTrRegex = null;
var pcTrBusy = false;
var pcTrQueued = false;

var PC_EN = {
"النظافة":"Cleaning","المستودع":"Warehouse","جديد":"New","جاهز":"Ready","التشغيل":"Operations","ملاحظة":"Note","الإنتاج":"Production","الشيفات":"Chefs",
"القسم":"Section","تم الاستلام":"Received","الصرف الداخلي":"Internal issue","الكمية":"Quantity","الوقت":"Time","الإدارة":"Admin","حذف":"Delete","حبة":"pc","صرف داخلي":"Internal issue",
"اليوم":"Today","الشيف":"Chef","الوحدة":"Unit","السلة فارغة":"Cart is empty","الإعدادات":"Settings","كلمة المرور غير صحيحة":"Wrong password","طلب مستودع":"Warehouse order","كجم":"kg",
"طلب":"Order","الأقسام":"Sections","الهدر":"Waste","تم":"Done","محذوف":"Deleted","لا يوجد إنتاج":"No production","إجراء":"Action","العربي":"Arabic","إنتاج اليوم":"Today's production",
"صنف":"item","الحالة":"Status","الصنف":"Item","جرام":"g","مؤرشف":"Archived","قبل الافتتاح":"Before opening","المهمة":"Task","طلبات الشيفات":"Chef orders","السبب":"Reason","رجوع":"Back",
"كلمة مرور الإدارة":"Admin password","مثال":"Example","الكود":"Code","استيراد":"Import","طلباتي":"My orders","إضافة":"Add","ناقص":"Missing","الهدر والتالف":"Waste & spoilage",
"لا يوجد إنتاج اليوم":"No production today","الأرشيف":"Archive","منتصف اليوم":"Midday","الإغلاق":"Closing","من":"of","الأصناف":"Items","مل":"ml","تقرير الإنتاج":"Production report",
"طباعة التقرير":"Print report","حذف جميع العمليات المطبوعة":"Delete all printed","تقرير التشغيل":"Operations report","متابعة":"Continue","إنتاج معلق":"Pending production","تم الصرف":"Issued",
"لم يتم":"Not done","التالف والهدر":"Spoilage & waste","ظهر":"Noon","دخول":"Sign in","أصناف المستودع":"Warehouse items","تصدير":"Export","لتر":"L","علبة":"box","كلمة مرور المستودع":"Warehouse password",
"كمية":"Qty","تقرير النظافة":"Cleaning report","إنتاج":"Production","طلبات جديدة":"New orders","التقارير":"Reports","الإجمالي":"Total","الإشعارات":"Notifications","الكل":"All","الفروع":"Branches","كل الفروع":"All branches","الفرع":"Branch","الفرع الرئيسي":"Main branch","البوابة":"Gateway","منظومة تشغيل المطاعم":"Restaurant operations","الأقسام والإنتاج والطلبات":"Sections, production, orders","المتابعة والتقارير والأرشيف":"Monitoring, reports, archive","كل إعدادات النظام":"All system settings","جميع البيانات والتقارير":"All data and reports","استقبال الطلبات والإشراف عليها":"Receive and supervise orders","جميع الفروع، ادخل أي فرع":"All branches, enter any","اختر الفرع":"Choose branch","إضافة فرع":"Add branch","فرع جديد":"New branch","تعديل الفرع":"Edit branch","اسم الفرع":"Branch name","المدينة (اختياري)":"City (optional)","حفظ الفرع":"Save branch","نشط":"Active","معطّل":"Disabled","الدردشة":"Chat","دردشة الفريق":"Team chat","اكتب رسالة":"Write a message","لا توجد رسائل بعد":"No messages yet","اسمك في الدردشة":"Your chat name","اليوم":"Today","أمس":"Yesterday","طلب توفير":"Supply request","غير متوفر":"Unavailable","أخرى":"Other",
"أصناف":"items","مصروف":"Issued","المسؤول":"Supervisor","تقرير المستودع":"Warehouse report","صباح":"Morning","ليل":"Night","لا توجد أقسام":"No sections","لا يوجد شيفات":"No chefs","كيس":"bag",
"لا توجد أصناف":"No items","ملاحظة للإدارة":"Note for admin","السلة":"Cart","إرسال الطلب":"Send order","لا توجد نتائج":"No results","لم يصرف":"Not issued","صرف جزئي":"Partially issued",
"المطلوب":"Requested","تقرير التالف والهدر":"Spoilage & waste report","مكتمل":"Complete","أصناف المنيو والإنتاج":"Menu & production items","الرئيسية":"Home","التصنيف":"Category","معلق":"Pending",
"طلبات المستودع":"Warehouse orders","ملخص التشغيل":"Operations summary","عملية":"entry","تقرير":"Report","قيد الصرف":"Being issued","إغلاق":"Close","تقارير":"Reports","بانتظار":"Waiting for",
"هدر اليوم":"Today's waste","مهام ناقصة":"missing tasks","مهام":"tasks","مطبوع":"Printed","طباعة":"Print","رقم الطلب":"Order no.","لا يوجد صرف داخلي":"No internal issues","لا يوجد تالف أو هدر":"No waste",
"المهام":"Tasks","الفترة":"Period","كود الشيف":"Chef code","كرتون":"carton","صندوق":"crate","ربطة":"bunch","كود الصنف مستخدم":"Item code already used","مهام التشغيل":"Operations tasks",
"الإنتاج الحالي":"Current production","موظف المستودع":"Warehouse staff","جهة الصرف":"Issued to","دخول الإدارة":"Admin sign-in","قيد التجهيز":"Preparing","جاهز للاستلام":"Ready for pickup",
"المصروف":"Issued","نظرة عامة":"Overview","حول البرنامج":"About","متصل":"Online","رفع الإنتاج":"Submit production","طلب من المستودع":"Order from warehouse","ملاحظة للمستودع":"Note for warehouse",
"هدر":"Waste","شيف":"Chef","وضع اليوم":"Today","أكثر الأصناف إنتاجاً":"Top produced items","لا توجد طلبات في هذا التصنيف":"No orders in this filter","يومي":"Daily","أيام":"days","أيام سابقة":"Previous days",
"أدخل كلمة مرور الإدارة للمتابعة":"Enter the admin password to continue","مركز المتابعة":"Control center","المكتمل":"Completed","إلغاء":"Cancel","قطعة":"piece","تأكيد الاستلام":"Confirm receipt",
"حلا":"Dessert","حلويات":"Desserts","مخبوز":"Bakery","لحم":"Meat","مشوي":"Grill","منيو":"Menu","بوفيه":"Buffet","حذف بعد الطباعة":"Delete after printing","سيتم حذف":"Will delete",
"تقرير تشغيل":"Operations report","تقرير نظافة":"Cleaning report","لا توجد طلبات شيفات":"No chef orders","الموظف":"Employee","الجهة":"Destination","الملاحظة":"Note","لا توجد تقارير تشغيل":"No operations reports",
"مرحباً بك في نظام":"Welcome to","الإنتاج والطلبات":"Production & orders","متابعة الورديات":"Shift follow-up","دخول الإعدادات":"Settings sign-in","إدارة الأقسام":"Manage sections","اسم القسم":"Section name",
"الأيقونة":"Icon","إدارة الشيفات":"Manage chefs","إضافة صنف":"Add item","الكود اختياري":"Code (optional)","حفظ الصنف":"Save item","بحث عن مهمة":"Search tasks","إضافة مهمة":"Add task","الورديات":"Shifts",
"حفظ المهمة":"Save task","لا توجد مهام تشغيل":"No operations tasks","الكود غير صحيح":"Wrong code","آخر إنتاج مرفوع":"Last production submitted","لا توجد طلبات":"No orders","دخول المستودع":"Warehouse sign-in",
"صرف كامل":"Fully issued","مطلوب":"Requested","متابعة التشغيل":"Operations follow-up","التنبيهات":"Alerts","متأخر":"Late","صرف بواسطة":"Issued by","تشغيل":"Operations","أصناف الإنتاج":"Production items",
"الصلاحيات":"Permissions","قسم":"Section","اختر ملف":"Choose a file","أولاً":"first","الملف فارغ":"File is empty","تم استيراد":"Imported","تعذر استيراد الملف":"Could not import the file","بدون قسم":"No section",
"لا توجد أصناف إنتاج":"No production items","تم رفع الإنتاج":"Production submitted","إنتاج مرفوع":"Production submitted","لم يتم رفع إنتاج اليوم بعد":"Today's production not submitted yet",
"لا توجد أصناف إنتاج مرتبطة بهذا القسم":"No production items linked to this section","العدد":"Count","تسجيل":"Record","بانتظار الصرف":"Waiting to be issued","تم إرسال الطلب للمستودع":"Order sent to the warehouse",
"يحتاج متابعة":"Needs follow-up","مهام اليوم":"Today's tasks","غير محدد":"Unspecified","لا توجد بيانات":"No data","قيد":"In progress","قسم غير محدد":"Unspecified section","صرف الطلب":"Issue order","داخلي":"Internal",
"كل الأقسام":"All sections","مهام النظافة":"Cleaning tasks","إجمالي":"Total","اسم المسؤول":"Supervisor name","فتح":"Open","افتتاح":"Opening","منتصف":"Midday","اغلاق":"Closing","المهام اليومية":"Daily tasks",
"تأكيد":"Confirm","لا توجد نتائج مطابقة":"No matching results","أمس":"Yesterday","صينية":"tray","نظافة":"Cleaning","إنقاص":"Decrease","زيادة":"Increase","ابحث عن صنف أو كود":"Search item or code",
"قيد المعالجة":"In progress","مستلمة":"Received","طلب جديد":"New order","مهمة ناقصة":"missing task","كل المهام مكتملة":"All tasks complete","لا توجد مهام":"No tasks","غير متصل":"Offline","تعديل":"Edit",
"تصدير نسخة":"Export copy","عرض وتعديل":"View & edit","التاريخ":"Date","الصرف":"Issue","الوردية":"Shift","إدارة النظام":"System management","استيراد وتصدير":"Import & export","نظام إدارة التشغيل والإنتاج":"Operations & production management system",
"اسم المنشأة":"Business name","الإصدار":"Version","حالة النظام":"System status","المطور":"Developer","واجهة الشيف":"Chef app","تسجيل هدر جديد":"Log new waste","ابحث عن صنف الإنتاج":"Search production item",
"اختر قسمك للدخول":"Choose your section","لا توجد أقسام بعد. أضفها من الإعدادات.":"No sections yet. Add them in Settings.","رفعوا إنتاج اليوم":"submitted today's production","دخول الشيف":"Chef sign-in",
"اكتب كود الشيف الخاص بك":"Enter your chef code","محاولات كثيرة. انتظر":"Too many attempts. Wait","ثانية":"seconds","اكتب الكود أولاً":"Enter the code first","محاولات كثيرة. حاول بعد 30 ثانية":"Too many attempts. Try again in 30 seconds",
"لوحة اليوم":"Today","صباح الخير":"Good morning","مساء الخير":"Good evening","مساء النور":"Good evening","سجّلت: لا يوجد إنتاج اليوم":"Logged: no production today","رفعت إنتاج":"Submitted production","سجّلت هدر":"Logged waste",
"طلبك جاهز للاستلام":"Your order is ready for pickup","طلبات جاهزة للاستلام":"orders ready for pickup","اضغط للمراجعة والاستلام":"Tap to review and receive","سجّل إنتاج اليوم":"Log today's production",
"لم يتم رفع أي إنتاج بعد":"No production submitted yet","طلبات جارية":"Orders in progress","نشاط اليوم":"Today's activity","لا يوجد نشاط اليوم بعد":"No activity yet today","تبديل الشيف":"Switch chef",
"الوزن":"Weight","الحجم":"Volume","العدد والتعبئة":"Count & packaging","لحوم ودواجن":"Meat & poultry","ألبان وأجبان":"Dairy & cheese","خضار وفواكه":"Fruit & vegetables","مواد جافة":"Dry goods","مشروبات":"Beverages",
"تغليف ومستهلكات":"Packaging & supplies","المختارة":"Selected","لم تختر أي صنف بعد":"No items selected yet","لا توجد أصناف إنتاج لقسمك. اطلب من الإدارة إضافتها.":"No production items for your section. Ask admin to add them.",
"لا توجد أصناف مستودع لقسمك.":"No warehouse items for your section.","الأكثر استخداماً":"Most used","كل الأصناف":"All items","يظهر":"Showing","استخدم البحث أو التصنيفات لتضييق النتائج.":"Use search or categories to narrow results.",
"إعادة آخر طلب":"Repeat last order","نسخ آخر إنتاج":"Copy last production","تمت إضافة":"Added","تعذر":"Could not","لا توجد أصناف متاحة للإعادة":"No items available to repeat","اضغط للمراجعة":"Tap to review",
"لم تختر شيئاً":"Nothing selected","اضغط «إضافة» على أي صنف":"Tap “Add” on any item","مراجعة ورفع":"Review & submit","السلة وإرسال":"Cart & send","ملاحظة للإدارة (اختياري)":"Note for admin (optional)",
"ملاحظة للمستودع (اختياري)":"Note for warehouse (optional)","اختر صنفاً واحداً على الأقل":"Choose at least one item","مراجعة الإنتاج قبل الرفع":"Review production before submitting","سلة الطلب":"Order cart",
"متابعة الاختيار":"Keep selecting","تعذر رفع الإنتاج، حاول مرة أخرى":"Could not submit production, try again","تعذر إرسال الطلب، حاول مرة أخرى":"Could not send the order, try again","إضافة ملاحظة":"Add a note",
"يبقى ظاهراً لـ":"Stays visible for","تالف":"Spoiled","منتهي الصلاحية":"Expired","احتراق":"Burnt","سقط / انسكب":"Dropped / spilled","خطأ تحضير":"Prep error","زيادة إنتاج":"Overproduction",
"ما الذي تلف؟":"What was spoiled?","اكتب السبب":"Write the reason","سُجّل اليوم":"Logged today","تسجيل الهدر":"Log waste","تغيير":"Change","منتج جاهز":"Finished product","مادة خام":"Raw material",
"ابحث أو اكتب اسم الصنف":"Search or type the item name","استخدام":"Use","كاسم يدوي":"as a manual name","اكتب اسم الصنف للبحث":"Type an item name to search","اختر السبب":"Choose a reason",
"اختر الصنف أولاً":"Choose an item first","ثم الكمية والسبب":"then quantity and reason","لا يوجد هدر مسجّل اليوم":"No waste logged today","أكمل الصنف والكمية والسبب":"Complete the item, quantity and reason",
"تم تسجيل الهدر":"Waste logged","تعذر تسجيل الهدر، حاول مرة أخرى":"Could not log waste, try again","بانتظار المستودع":"Waiting for warehouse","هل استلمت الطلب فعلاً؟":"Did you actually receive the order?",
"نعم، استلمت":"Yes, received","تم تأكيد الاستلام":"Receipt confirmed","تعذر تأكيد الاستلام":"Could not confirm receipt","طلبك":"Your order","لا توجد مهام بعد":"No tasks yet","سير العمل ممتاز":"Workflow is excellent",
"سير العمل جيد":"Workflow is good","لا طلبات جديدة":"No new orders","رفعوا الإنتاج":"submitted production","جاهزية اليوم":"Today's readiness","مهمة مكتملة":"tasks complete","ابدأ بإضافة الشيفات والمهام":"Start by adding chefs and tasks",
"يحتاج انتباهك":"Needs your attention","كل شيء على ما يرام":"Everything is fine","لا توجد تنبيهات تحتاج تدخلاً الآن":"No alerts need action now","متابعة وتقارير وأرشيف":"Follow-up, reports & archive",
"ثبّت التطبيق على جوالك":"Install the app on your phone","فتح أسرع وبدون شريط المتصفح":"Opens faster, without the browser bar","تثبيت":"Install","إخفاء":"Hide","التثبيت على الآيفون":"Install on iPhone",
"افتح الموقع في متصفح":"Open the site in","اضغط زر المشاركة":"Tap the Share button","أسفل الشاشة":"at the bottom of the screen","اختر":"Choose","إضافة إلى الشاشة الرئيسية":"Add to Home Screen","اضغط":"Tap",
"فهمت":"Got it","افتح قائمة المتصفح واختر «تثبيت التطبيق»":"Open the browser menu and choose “Install app”","تم تثبيت التطبيق":"App installed","يتوفر تحديث جديد":"A new update is available","تحديث":"Update",
"أُرسل":"Sent","أقدم":"Older","لا توجد بيانات للتصدير":"No data to export","يوم":"day","عملية رفع":"submissions","عملية هدر":"waste entries","سطر إنتاج":"production lines","إجمالي الإنتاج":"Total production",
"إجمالي الهدر":"Total waste","الأكثر إنتاجاً":"Top produced","الأكثر هدراً":"Top wasted","حسب القسم":"By section","أسباب الهدر":"Waste reasons","حذف المطبوع":"Delete printed",
"لا توجد بيانات في هذه الفترة":"No data in this period","حذف صنف":"Delete item","نعم، احذف":"Yes, delete","تم الحذف":"Deleted","تعذر الحذف":"Could not delete","الاسم بالعربي":"Arabic name","الاسم بالإنجليزي":"English name",
"تعديل الصنف":"Edit item","حفظ التعديل":"Save changes","اكتب اسم الصنف":"Enter the item name","تم حفظ التعديل":"Changes saved","تعذر الحفظ":"Could not save","لا توجد أصناف للحذف":"No items to delete",
"حذف الكل":"Delete all","نعم، احذف الكل":"Yes, delete all","تأكيد أخير":"Final confirmation","اكتب كلمة":"Type the word","للتأكيد":"to confirm","حذف نهائي":"Delete permanently",
"لم يتم الحذف: الكلمة غير مطابقة":"Not deleted: the word doesn't match","تم حذف":"Deleted","توقف الحذف بعد":"Deletion stopped after","حذف كل أصناف المستودع":"Delete all warehouse items","حذف كل أصناف المنيو":"Delete all menu items",
"أصناف المستودع":"Warehouse items","طريقة العرض":"View","شبكة":"Grid","قائمة":"List","بطاقات":"Cards","مدمج":"Compact","جدول":"Table","تم تحديث البيانات":"Data refreshed","تأكيد الإجراء":"Confirm action","نعم، تابع":"Yes, continue",
"البيانات الأساسية":"Core data","المخزون والإنتاج":"Stock & production","النظام":"System","ابحث في الإعدادات":"Search settings","المتابعة اليومية":"Daily follow-up","غير مطبوع":"Not printed","مسح":"Clear",
"أقسام الشيفات":"Chef sections","الأسماء والأقسام":"Names & sections","الأصناف والوحدات":"Items & units","المنيو والإنتاج":"Menu & production","الجهات الداخلية":"Internal destinations","كلمات المرور":"Passwords","معلومات النظام":"System info",
"طلبات مستودع جديدة":"New warehouse orders","شيف لم يسجل الإنتاج":"Chef hasn't logged production","مهام نظافة ناقصة":"Missing cleaning tasks","مهام تشغيل ناقصة":"Missing operations tasks","لا توجد إشعارات":"No notifications",
"كل شيء مستقر حالياً":"Everything is stable","ملخص النظام":"System summary","تقارير الإدارة":"Admin reports","تقرير إداري":"Admin report","طلبات + صرف داخلي":"Orders + internal issues","إنتاج الشيفات":"Chef production",
"تقرير الهدر":"Waste report","لا توجد طلبات مستودع اليوم":"No warehouse orders today","لا يوجد صرف داخلي اليوم":"No internal issues today","لا يوجد إنتاج لهذا اليوم":"No production for today","لا يوجد هدر اليوم":"No waste today",
"لا توجد تقارير نظافة اليوم":"No cleaning reports today","لا توجد تقارير تشغيل اليوم":"No operations reports today","مهمة":"Task","متابعة النظافة":"Cleaning follow-up","حفظ تقرير النظافة":"Save cleaning report",
"تم حفظ تقرير النظافة":"Cleaning report saved","حفظ تقرير التشغيل":"Save operations report","تم حفظ تقرير التشغيل":"Operations report saved","أرشيف التشغيل":"Operations archive","أرشيف اليوم":"Today's archive","تفاصيل الأرشيف":"Archive details",
"أرشيف التقارير":"Reports archive","عرض التقرير":"View report","تقارير الأيام":"Daily reports","سجل":"Log","قفل":"Lock","أرشيف":"Archive","تقرير يوم":"Day report","التقرير الشامل":"Full report","تقرير شامل":"Full report",
"مهام الفتح والإغلاق":"Opening & closing tasks","مهام الفترات اليومية":"Daily period tasks","فتح وإغلاق":"Open & close","إنتاج وطلبات":"Production & orders","صرف ومتابعة":"Issue & follow-up","دخول مباشر":"Direct sign-in",
"الإنتاج والهدر":"Production & waste","طلبات وصرف":"Orders & issue","رفع إنتاج":"Submit production","تسجيل هدر":"Log waste","أفضل الشيفات":"Top chefs","آخر الأنشطة":"Recent activity","لا توجد أنشطة":"No activity",
"ملخص المستودع":"Warehouse summary","طلبات وصرف اليوم":"Today's orders & issues","أصناف أخرى":"Other items","فتح الطلب":"Open order","تم صرف الطلب":"Order issued","اختر الموظف":"Choose employee","اختر الجهة":"Choose destination",
"بحث عن صنف":"Search item","سلة الصرف الداخلي":"Internal issue cart","اعتماد الصرف الداخلي":"Approve internal issue","تمت إضافة الصنف":"Item added","اختر الموظف والجهة":"Choose employee and destination","تم اعتماد الصرف الداخلي":"Internal issue approved",
"اعتماد الصرف":"Approve issue","المصروف الفعلي":"Actual issued","اعتماد الصرف الفعلي":"Approve actual issue","طباعة الطلب":"Print order","تم اعتماد الصرف الفعلي":"Actual issue approved","لا يمكن حذف الطلب قبل أن يستلمه الشيف":"Can't delete an order before the chef receives it",
"تمت أرشفة الطلب":"Order archived","سلة الصرف":"Issue cart","حفظ الصرف":"Save issue","تم حفظ الصرف الداخلي":"Internal issue saved","لا توجد مهام لهذه الوردية":"No tasks for this shift","تم التنفيذ":"Done","تم حفظ النظافة":"Cleaning saved",
"اسم مسؤول التشغيل":"Operations supervisor name","اكتب اسم المسؤول":"Enter supervisor name","ملاحظات التشغيل":"Operations notes","رفع للإدارة":"Submit to admin","تم رفع التشغيل للإدارة":"Operations submitted to admin",
"إنتاج جديد":"New production","تالف / هدر":"Spoilage / waste","لا توجد تنبيهات":"No alerts","طباعة تقرير المستودع":"Print warehouse report","طلب شيفات":"Chef order","وقت الاستلام":"Received at","بواسطة":"By","الملاحظات":"Notes",
"تقرير الصرف الداخلي":"Internal issue report","حالة الصرف":"Issue status","انجليزي":"English","الإنجليزي":"English","وحدة":"Unit","الفئة":"Category","صنف للمستودع":"warehouse item","صنف إنتاج":"production item",
"إدارة أصناف المستودع":"Manage warehouse items","إدارة أصناف الإنتاج":"Manage production items","استيراد أصناف المستودع":"Import warehouse items","استيراد أصناف المنيو والإنتاج":"Import menu & production items",
"استيراد وتصدير Excel":"Excel import & export","واجهة الشيف":"Chef app","أقسام الإنتاج":"Production sections","اختر القسم للدخول وتسجيل الإنتاج اليومي بسرعة":"Choose a section to sign in and log daily production","دخول القسم":"Enter section",
"إضافة للسلة":"Add to cart","تمت إضافة الصنف للسلة":"Item added to cart","أهم مؤشرات المطعم في شاشة واحدة.":"Key restaurant metrics on one screen.","الداشبورد":"Dashboard","نظرة واضحة وسريعة لكل الأقسام.":"A clear, quick view of all sections.",
"التقرير اليومي الشامل":"Full daily report","لم يرفع التقرير":"Report not submitted","شيف بدون اسم":"Unnamed chef","بدون وقت":"No time","صنف غير محدد":"Unspecified item","لا يوجد إنتاج معلق":"No pending production","لا توجد مهام ناقصة":"No missing tasks",
"لا توجد بيانات إنتاج اليوم":"No production data today","الحالات المهمة":"Key cases","عرض القائمة":"List view","حفظ كلمات المرور":"Save passwords","تم حفظ كلمات المرور":"Passwords saved","الصلاحيات وكلمات المرور":"Permissions & passwords",
"موظفي المستودع":"Warehouse staff","جهات الصرف":"Issue destinations","إضافة موظف":"Add employee","إضافة جهة":"Add destination","اسم موظف المستودع":"Warehouse employee name","لا يوجد موظفين":"No employees","لا توجد جهات صرف":"No destinations",
"اختر / اكتب المنتج":"Choose / type the product","ابحث عن الصنف":"Search for the item","أضف الكمية":"Add quantity","رفع الإنتاج للإدارة":"Submit production to admin","لا يوجد إنتاج حالي":"No current production","تم رفع الإنتاج للإدارة":"Production submitted to admin",
"سبب الهدر":"Waste reason","رفع التالف للإدارة":"Submit waste to admin","تم رفع التالف والهدر للإدارة":"Waste submitted to admin","إضافة شيف":"Add chef","اسم الشيف":"Chef name","حفظ الشيف":"Save chef","إضافة قسم":"Add section","حفظ القسم":"Save section",
"بحث عن قسم":"Search sections","الكود مستخدم":"Code already used","تم إضافة الصنف":"Item added","عناصر النظافة":"Cleaning items","لا توجد مهام نظافة":"No cleaning tasks","اسم المهمة":"Task name","الفترة / الوقت":"Period / time",
"إعدادات الصرف الداخلي":"Internal issue settings","تحميل":"Loading","لا توجد عمليات مطبوعة للحذف":"No printed entries to delete","اطبع العملية أولاً قبل الحذف":"Print the entry before deleting","تم حذف العملية المطبوعة":"Printed entry deleted",
"تم حذف جميع العمليات المطبوعة":"All printed entries deleted","وقت الإنشاء":"Created at","إجمالي العمليات":"Total entries","طلب جديد للمستودع":"New warehouse order","إنتاج جديد مرفوع للإدارة":"New production submitted to admin",
"تالف / هدر جديد":"New spoilage / waste","صرف داخلي جديد":"New internal issue","تقرير نظافة جديد":"New cleaning report","تقرير تشغيل جديد":"New operations report","تم إرسال":"Sent","تم رفع":"Submitted",
"التقارير غير مفعلة بعد":"Reports not enabled yet","الأرشيف غير مفعل بعد":"Archive not enabled yet","لا توجد بيانات أرشيف حتى الآن":"No archive data yet","تعذر فتح الإدارة":"Could not open admin","تعذر فتح الإعدادات":"Could not open settings",
"المتصفح منع فتح نافذة الطباعة":"The browser blocked the print window","طلب جديد من":"New order from","تم استلام طلب من":"Order received from","طلبية من قسم":"Order from section","الأيام":"Days","٧ أيام":"7 days","30 يوم":"30 days","7 أيام":"7 days",
"الكل (":"All (","عنصر":"item","المخزون والصرف":"Stock & issue","مهام الورديات":"Shift tasks","المتابعة والتقارير":"Follow-up & reports","تنبيه":"Alert","طلبات":"Orders","نشاط":"Activity","للجوال":"For mobile",
"بحث بالاسم أو القسم أو الصنف":"Search by name, section or item","ابحث في":"Search in","مؤرشف":"Archived","مرحباً":"Welcome","الإصدار":"Version","الاسم":"Name","النوع":"Type","المجموع":"Sum","الملخص":"Summary","لا":"No","نعم":"Yes",
"،":",","؟":"?","لا يوجد إنتاج اليوم؟ سجّلها":"No production today? Log it","سجّلها":"Log it","اليوم؟":"today?","طلبات جارية":"Orders in progress","معلومات":"Info","المهام الناقصة":"Missing tasks","ظهراً":"Noon","فرن":"Oven","وجبات":"Meals","شوي":"Grill","سلطة":"Salad","قيد العمل":"In progress"
};

var pcTrAll = PC_EN;
var pcTrSig = "";
function pcTrDynSig(){
  const w = warehouseItems||[], m = menuItems||[];
  return w.length+"|"+m.length+"|"+(w[w.length-1]?.nameEn||"")+"|"+(m[m.length-1]?.nameEn||"")+"|"+(w[0]?.nameEn||"")+(m[0]?.nameEn||"");
}
function pcTrBuild(){
  const dyn = {};
  [...(warehouseItems||[]),...(menuItems||[])].forEach(i=>{
    const ar = String(i.nameAr||i.name||"").trim(), en = String(i.nameEn||"").trim();
    if(ar && en && ar !== en) dyn[ar] = en;
  });
  pcTrAll = Object.assign({}, PC_EN, dyn);
  pcTrSig = pcTrDynSig();
  const keys = Object.keys(pcTrAll).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  pcTrRegex = new RegExp("(?<![\\u0600-\\u06FF])(?:"+keys.join("|")+")(?![\\u0600-\\u06FF])","g");
}
function pcTr(s){
  if(!s || !/[؀-ۿ]/.test(s)) return s;
  const t = s.trim();
  if(!pcTrRegex || pcTrSig !== pcTrDynSig()) pcTrBuild();
  if(pcTrAll[t] !== undefined) return s.replace(t, pcTrAll[t]);
  return s.replace(pcTrRegex, m=>pcTrAll[m]).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

var PC_TR_ATTRS = ["placeholder","title","aria-label","alt"];
function pcApplyLang(root){
  root = root || document.body;
  if(!root) return;
  pcTrBusy = true;
  try{
    const en = pcLang === "en";

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:n=>{
      const p = n.parentNode; if(!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName; if(tag==="SCRIPT"||tag==="STYLE"||tag==="TEXTAREA") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    let n;
    while((n = walker.nextNode())){
      const rec = n.__pcTr;
      if(en){
        if(rec && n.nodeValue === rec.t) continue;
        const o = n.nodeValue;
        if(!/[؀-ۿ]/.test(o)) continue;
        const t = pcTr(o);
        if(t !== o){ n.__pcTr = {o,t}; n.nodeValue = t; pcTrNodes.add(n); }
      }
    }

    root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(el=>{
      PC_TR_ATTRS.forEach(a=>{
        const v = el.getAttribute(a); if(v == null) return;
        const rec = (pcTrAttrs.get(el)||{})[a];
        if(en){
          if(rec && v === rec.t) return;
          if(!/[؀-ۿ]/.test(v)) return;
          const t = pcTr(v);
          if(t !== v){ const m = pcTrAttrs.get(el)||{}; m[a] = {o:v,t}; pcTrAttrs.set(el,m); el.setAttribute(a,t); }
        }
      });
    });
  }finally{ pcTrBusy = false; }
}
function pcRestoreLang(){
  pcTrBusy = true;
  try{
    pcTrNodes.forEach(n=>{ if(n.__pcTr && n.nodeValue === n.__pcTr.t) n.nodeValue = n.__pcTr.o; delete n.__pcTr; });
    pcTrNodes.clear();
    pcTrAttrs.forEach((m,el)=>{ Object.keys(m).forEach(a=>{ if(el.getAttribute(a) === m[a].t) el.setAttribute(a,m[a].o); }); });
    pcTrAttrs.clear();
  }finally{ pcTrBusy = false; }
}
function pcSetDir(){
  const en = pcLang === "en";
  document.documentElement.lang = en ? "en" : "ar";
  document.documentElement.dir = en ? "ltr" : "rtl";
  document.body && document.body.classList.toggle("pc-en", en);
}
function pcToggleLang(){
  pcLang = pcLang === "en" ? "ar" : "en";
  try{ localStorage.setItem("pcLang", pcLang); }catch(e){}
  pcSetDir();
  if(pcLang === "en") pcApplyLang(); else pcRestoreLang();
  document.querySelectorAll(".pc76-lang").forEach(b=>{ b.textContent = pcLang==="en" ? "AR" : "EN"; });
}
function pcLangButton(){
  return `<button type="button" class="pc76-lang" onclick="pcToggleLang()" aria-label="Language">${pcLang==="en"?"AR":"EN"}</button>`;
}

function pc60Bar({title="", sub="", back="smartBack()", trailing=""}){
  return `
    <header class="pc60-bar">
      <button class="pc60-back" type="button" onclick="${back}" aria-label="رجوع"><i class="fa-solid fa-arrow-right"></i></button>
      <div class="pc60-bar-title">
        <b>${escapeHtml(title)}</b>
        ${sub ? `<span>${escapeHtml(sub)}</span>` : ""}
      </div>
      <div class="pc60-bar-end">${trailing}${pcLangButton()}</div>
    </header>`;
}

(function(){
  const start = ()=>{
    pcSetDir();
    if(pcLang === "en") pcApplyLang();
    new MutationObserver(()=>{
      if(pcTrBusy || pcLang !== "en" || pcTrQueued) return;
      pcTrQueued = true;
      requestAnimationFrame(()=>{ pcTrQueued = false; pcApplyLang(); });
    }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:false});
  };
  if(document.body) start(); else document.addEventListener("DOMContentLoaded",start);
})();

(function pc80Splash(){
  try{ if(sessionStorage.getItem("pcSplash")) return; sessionStorage.setItem("pcSplash","1"); }catch(e){}
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const word = (txt,cls,from)=>[...txt].map((ch,i)=>`<span class="${cls}" style="animation-delay:${(from+i)*55}ms">${ch}</span>`).join("");
  const el = document.createElement("div");
  el.id = "pc80Splash";
  el.innerHTML = `<div class="pc80-sp-in"><img src="assets/logo-mark.png" alt="" width="120" height="120"><div class="pc80-sp-word" dir="ltr">${word("Protein","p",0)}<span class="amp">&amp;</span>${word("Carb","c",8)}</div><small>Healthy food</small></div>`;
  document.body.appendChild(el);
  const done = ()=>{ if(!el.isConnected) return; el.classList.add("out"); setTimeout(()=>el.remove(),260); };
  el.addEventListener("pointerdown", done);
  setTimeout(done, 1300);
})();

var pc80Home = {broadcast:null, slides:[], slideSeconds:5};
var pc80Idx = 0;
var pc80Pause = 0;
var pc80BannerSig = "";

(function pc80Listen(){
  const t = setInterval(()=>{
    const F = window.firebaseDB;
    if(!F || !F.onSnapshot || !F.doc) return;
    clearInterval(t);
    F.onSnapshot(F.doc(F.db,"settings","home"), s=>{
      const d = s.exists() ? s.data() : {};
      pc80Home = {broadcast:d.broadcast||null, slides:Array.isArray(d.slides)?d.slides:[], slideSeconds:Number(d.slideSeconds)||5};
      pc80BannerSig = "";
      pc80Refresh();
    }, ()=>{});
  }, 300);
})();

function pc80Save(patch){
  const F = window.firebaseDB;
  return F.setDoc(F.doc(F.db,"settings","home"), patch, {merge:true});
}

function pc80Refresh(){
  pc80DrawBanner();
  const main = document.querySelector("main.pc61-home");
  if(main){ pc61Sig = ""; pc61LiveHome(); }
  const dash = document.getElementById("pc80ChefSlot");
  if(dash) dash.innerHTML = pc80Slider(true);
}

function pc80ActiveMsg(){
  const b = pc80Home.broadcast;
  if(!b || !b.text) return null;
  if(b.expiresAtMs && b.expiresAtMs < Date.now()) return null;
  if(b.audience === "chefs" && !currentChef) return null;
  try{ if(localStorage.getItem("pcBcDismiss") === String(b.id)) return null; }catch(e){}
  return b;
}
function pc80Left(ms){
  const m = Math.max(1, Math.round(ms/60000));
  if(m < 60) return `تنتهي بعد ${m} دقيقة`;
  const h = Math.round(m/60);
  if(h < 48) return `تنتهي بعد ${h} ساعة`;
  return `تنتهي بعد ${Math.round(h/24)} يوم`;
}
function pc80DrawBanner(){
  const m = pc80ActiveMsg();
  let el = document.getElementById("pc80Banner");
  if(!m){ if(el) el.remove(); pc80BannerSig = ""; return; }
  const left = m.expiresAtMs ? pc80Left(m.expiresAtMs - Date.now()) : "";
  const sig = m.id + "|" + m.text + "|" + left;
  if(el && sig === pc80BannerSig) return;
  pc80BannerSig = sig;
  if(!el){ el = document.createElement("div"); el.id = "pc80Banner"; document.body.appendChild(el); }
  el.innerHTML = `<span class="pc80-bc-ico"><i class="fa-solid fa-bullhorn"></i></span>
    <div><b>${escapeHtml(m.text)}</b>${left ? `<small>${left}</small>` : ""}</div>
    <button type="button" aria-label="إغلاق" onclick="pc80Dismiss()"><i class="fa-solid fa-xmark"></i></button>`;
}
function pc80Dismiss(){
  const b = pc80Home.broadcast;
  try{ if(b) localStorage.setItem("pcBcDismiss", String(b.id)); }catch(e){}
  pc80DrawBanner();
}
setInterval(()=>{ if(!document.hidden) pc80DrawBanner(); }, 30000);

function pc80Today(list){ try{ return pc32Today(list||[]); }catch(e){ return []; } }

function pc80DataSlides(){
  const s = pc61Stats();
  const out = [];
  if(s.total){
    out.push({tone:"green", ring:s.pct, label:"جاهزية اليوم", big: s.pct>=90?"سير العمل ممتاز":(s.pct>=60?"سير العمل جيد":"يحتاج متابعة"), sub:`${s.done} من ${s.total} مهمة مكتملة`});
  }
  const orders = pc80Today(warehouseOrders);
  if(orders.length){
    const wait = orders.filter(o=>o.status==="جديد"||!o.status).length;
    const done = orders.filter(o=>o.status==="تم الاستلام").length;
    out.push({tone:"blue", icon:"fa-box", label:"طلبات المستودع", big: s.newWh ? `${s.newWh} جديد` : `${orders.length} اليوم`, sub:`${wait} بانتظار الصرف · ${done} مستلمة`});
  }
  const prod = pc80Today(productionLogs).filter(l=>!l.noProduction);
  if(prod.length){
    const lines = {}; let n = 0;
    prod.forEach(l=>(l.items||[]).forEach(i=>{ n++; const k=i.name||""; if(k) lines[k]=(lines[k]||0)+Number(i.qty||0); }));
    const top = Object.keys(lines).sort((a,b)=>lines[b]-lines[a])[0];
    out.push({tone:"teal", icon:"fa-kitchen-set", label:"إنتاج اليوم", big:`${n} ${n===1?"صنف":"أصناف"}`, sub:`رفع ${s.chefDone} من ${s.chefTotal} شيف${top?` · الأكثر: ${top}`:""}`});
  }
  const waste = pc80Today(wasteLogs);
  if(waste.length){
    const r = {}; waste.forEach(w=>{ const k=w.reason||""; if(k) r[k]=(r[k]||0)+1; });
    const top = Object.keys(r).sort((a,b)=>r[b]-r[a])[0];
    out.push({tone:"red", icon:"fa-trash-can", label:"هدر اليوم", big:`${waste.length} ${waste.length===1?"عملية":"عمليات"}`, sub: top ? `السبب الأكثر: ${top}` : ""});
  }
  const miss = (s.cs.missing||0) + (s.os.missing||0);
  if(miss){
    out.push({tone:"amber", icon:"fa-list-check", label:"المهام", big:`${miss} ناقصة`, sub:`نظافة ${s.cs.missing||0} · تشغيل ${s.os.missing||0}`});
  }
  return out;
}

function pc80ImageSlides(){
  const now = Date.now();
  return (pc80Home.slides||[]).filter(x=>x && x.img && (!x.startMs || x.startMs<=now) && (!x.endMs || x.endMs>=now));
}

function pc80Slider(chefMode){
  const imgs = pc80ImageSlides().map(x=>`<div class="pc80-slide img"><img src="${x.img}" alt="" decoding="async">${x.title?`<b>${escapeHtml(x.title)}</b>`:""}</div>`);
  const data = chefMode ? [] : pc80DataSlides().map(d=>`
    <div class="pc80-slide ${d.tone}">
      ${d.ring!=null ? `<div class="pc80-ring">${pc61Ring(d.ring)}</div>` : `<span class="pc80-sico"><i class="fa-solid ${d.icon}"></i></span>`}
      <div class="pc80-stxt"><small>${d.label}</small><strong>${escapeHtml(d.big)}</strong><em>${escapeHtml(d.sub||"")}</em></div>
    </div>`);
  const all = [...data, ...imgs];
  if(!all.length) return "";
  return `<section class="pc80-slider" data-n="${all.length}">
    <div class="pc80-track">${all.join("")}</div>
    ${all.length>1 ? `<div class="pc80-dots">${all.map((_,i)=>`<i class="${i===0?"on":""}"></i>`).join("")}</div>` : ""}
  </section>`;
}

function pc80Mount(){
  document.querySelectorAll(".pc80-slider:not([data-m])").forEach(sl=>{
    sl.dataset.m = "1";
    const tr = sl.querySelector(".pc80-track");
    const dots = sl.querySelectorAll(".pc80-dots i");
    const dir = getComputedStyle(tr).direction === "rtl" ? -1 : 1;
    const n = Number(sl.dataset.n)||1;
    if(pc80Idx >= n) pc80Idx = 0;
    if(pc80Idx) tr.scrollLeft = dir*pc80Idx*tr.clientWidth;
    let raf = 0;
    tr.addEventListener("scroll", ()=>{
      if(raf) return;
      raf = requestAnimationFrame(()=>{
        raf = 0;
        const i = Math.round(Math.abs(tr.scrollLeft)/Math.max(1,tr.clientWidth));
        pc80Idx = i;
        dots.forEach((d,k)=>d.classList.toggle("on",k===i));
      });
    }, {passive:true});
    ["pointerdown","touchstart"].forEach(ev=>tr.addEventListener(ev, ()=>{ pc80Pause = Date.now()+8000; }, {passive:true}));
  });
}

(function pc80Auto(){
  let last = 0;
  setInterval(()=>{
    if(document.hidden) return;
    const sl = document.querySelector(".pc80-slider[data-m]");
    if(!sl) return;
    const n = Number(sl.dataset.n)||1;
    if(n < 2 || Date.now() < pc80Pause) return;
    const gap = Math.max(3, pc80Home.slideSeconds||5)*1000;
    if(Date.now()-last < gap-200) return;
    last = Date.now();
    const tr = sl.querySelector(".pc80-track");
    const dir = getComputedStyle(tr).direction === "rtl" ? -1 : 1;
    const next = (pc80Idx+1) % n;
    tr.scrollTo({left: dir*next*tr.clientWidth, behavior: next===0 ? "auto" : "smooth"});
  }, 1000);
})();

(function pc80Observe(){
  const start = ()=>{
    let q = false;
    new MutationObserver(()=>{
      if(q) return; q = true;
      requestAnimationFrame(()=>{ q = false; pc80Mount(); pc80DrawBanner(); });
    }).observe(document.body,{childList:true,subtree:true});
  };
  if(document.body) start(); else document.addEventListener("DOMContentLoaded",start);
})();

function pc61HomeHtml(){
  const s = pc61Stats();
  const mode = pcViewMode("home");
  const rows = (typeof pc33NotificationRows === "function" ? pc33NotificationRows() : []).slice(0,4);
  const online = navigator.onLine !== false;
  const clSub = s.cs.total ? (s.cs.missing ? `${s.cs.missing} مهمة ناقصة` : "كل المهام مكتملة") : "لا توجد مهام";
  const opSub = s.os.total ? (s.os.missing ? `${s.os.missing} مهمة ناقصة` : "كل المهام مكتملة") : "لا توجد مهام";
  const chSub = s.chefTotal ? `${s.chefDone} من ${s.chefTotal} رفعوا الإنتاج` : "لا يوجد شيفات";
  return `
    <header class="pc61-hero">
      <div class="pc61-top">
        <div class="pc61-brand">
          <button type="button" class="pc61-back" onclick="renderGateway()" aria-label="البوابة"><i class="fa-solid fa-arrow-right"></i></button>
          <div class="pc61-brandtxt" ${pcActiveBranches().length>1?`onclick="renderBranches()" style="cursor:pointer"`:""}>
          <div><b>${pcActiveBranches().length>1?escapeHtml(pcBranchName(currentBranch)):"Protein &amp; Carb"}</b><span><i class="pc61-dot ${online?"on":"off"}" id="pc61Net"></i>${todayDate()}</span></div></div>
        </div>
        <div class="pc61-actions">
          ${pcLangButton()}
          ${pc93Button()}
          <button type="button" onclick="renderNotifications()" aria-label="الإشعارات">
            <i class="fa-regular fa-bell"></i>${s.notify ? `<em>${s.notify}</em>` : ""}
          </button>
        </div>
      </div>
      <div class="pc61-metrics">
        <div class="${s.newWh?"alert":""}"><b>${pcStat(s.newWh)}</b><span>طلبات جديدة</span></div>
        <div><b>${pcStat(pc60Num(s.prodQty))}</b><span>إنتاج اليوم</span></div>
        <div class="${s.waste?"alert":""}"><b>${pcStat(s.waste)}</b><span>هدر اليوم</span></div>
      </div>
    </header>

    ${pc80Slider(false)}
    ${pc72InstallCard()}

    <div class="pc50-section-title"><h2>يحتاج انتباهك</h2>${rows.length ? `<span class="pc61-count">${rows.length}</span>` : ""}</div>
    ${rows.length ? `
      <section class="pc61-att">
        ${rows.map(r=>`
          <button type="button" onclick="${r.fn}">
            <span class="pc61-att-icon"><i class="fa-solid ${r.icon}"></i></span>
            <div><b>${escapeHtml(r.title)}</b><small>${escapeHtml(r.meta)}</small></div>
            <i class="fa-solid fa-chevron-left"></i>
          </button>`).join("")}
      </section>` : `
      <section class="pc61-clear"><i class="fa-solid fa-circle-check"></i><div><b>كل شيء على ما يرام</b><small>لا توجد تنبيهات تحتاج تدخلاً الآن</small></div></section>`}

    <div class="pc50-section-title"><h2>الأقسام</h2>${pcViewToggle("home")}</div>
    <section class="pc50-grid ${mode==="list"?"is-list":""}" data-view-scope="home">
      ${pc61Card("fa-broom","النظافة",clSub,"renderCleaning()", s.cs.missing ? s.cs.missing : "", s.cs.missing ? "warn" : "")}
      ${pc61Card("fa-gears","التشغيل",opSub,"renderOperations()", s.os.missing ? s.os.missing : "", s.os.missing ? "warn" : "")}
      ${pcStoreHomeCard()}
    </section>`;
}

function pc61LiveHome(){
  const main = document.querySelector("main.pc61-home");
  if(!main) return;
  const sig = JSON.stringify(pc61Stats()) + pcStoreSub() + pcViewMode("home") + pc80Home.slides.length + pc93Unread() + pcSynced();
  if(sig === pc61Sig) return;
  pc61Sig = sig;
  const y = window.scrollY;
  main.innerHTML = pc61HomeHtml();
  window.scrollTo(0,y);
}

function openSettingsTab(tab){
  setSettingsTab(tab);
  const map = {branches:renderSettingsBranches, overview:renderSettingsOverview, chefs:renderSettingsChefs, sections:renderSettingsSections, warehouse:renderSettingsWarehouseItems, menu:renderSettingsMenuItems, excel:renderSettingsExcel, cleaning:renderSettingsCleaning, operations:renderSettingsOperations, internal:renderSettingsInternalIssue, home:renderSettingsHome, passwords:renderSettingsPasswords, about:renderSettingsAbout};
  (map[tab] || renderSettingsOverview)();
}

var PC80_DURATIONS = [["ساعة",3600000],["6 ساعات",21600000],["يوم",86400000],["3 أيام",259200000],["حتى أحذفها",0]];
var pc80Draft = {dur:86400000, aud:"all"};

function renderSettingsHome(){
  const b = pc80Home.broadcast;
  const live = pc80ActiveMsg();
  const imgs = pc80Home.slides || [];
  settingsShell("home","الرسائل والسلايدر",`
    <section class="premium-card pc80-set">
      <h3>رسالة جماعية</h3>
      <p class="muted">تظهر أعلى الشاشة لكل من يفتح التطبيق، وتختفي تلقائياً بعد المدة.</p>
      ${b && b.text ? `<div class="pc80-live"><div><b>${escapeHtml(b.text)}</b><small>${b.expiresAtMs ? (b.expiresAtMs>Date.now()?pc80Left(b.expiresAtMs-Date.now()):"انتهت") : "بدون انتهاء"}</small></div><button class="btn btn-light" onclick="pc80Clear()">إيقاف</button></div>` : ""}
      <textarea id="pc80Text" maxlength="160" placeholder="اكتب الرسالة (حتى 160 حرفاً)"></textarea>
      <label>مدة العرض</label>
      <div class="pc80-chips" id="pc80Dur">${PC80_DURATIONS.map(d=>`<button type="button" class="${pc80Draft.dur===d[1]?"on":""}" onclick="pc80Draft.dur=${d[1]};pc80ChipsRedraw()">${d[0]}</button>`).join("")}</div>
      <label>تظهر لـ</label>
      <div class="pc80-chips" id="pc80Aud">${[["all","الجميع"],["chefs","الشيفات فقط"]].map(a=>`<button type="button" class="${pc80Draft.aud===a[0]?"on":""}" onclick="pc80Draft.aud='${a[0]}';pc80ChipsRedraw()">${a[1]}</button>`).join("")}</div>
      <button class="btn btn-main" onclick="pc80Publish()">نشر الرسالة</button>
    </section>
    <section class="premium-card pc80-set">
      <h3>صور السلايدر (${imgs.length} من 4)</h3>
      <p class="muted">تظهر بعد شرائح البيانات. بلا روابط. تُضغط الصورة تلقائياً.</p>
      <div class="pc80-imgs">
        ${imgs.map((x,i)=>`
          <div class="pc80-img">
            <img src="${x.img}" alt="">
            <input placeholder="عنوان (اختياري)" value="${escapeHtml(x.title||"")}" onchange="pc80EditSlide(${i},'title',this.value)">
            <label>من<input type="date" value="${pc80D(x.startMs)}" onchange="pc80EditSlide(${i},'startMs',this.value)"></label>
            <label>إلى<input type="date" value="${pc80D(x.endMs)}" onchange="pc80EditSlide(${i},'endMs',this.value)"></label>
            <button class="mini-danger" onclick="pc80DelSlide(${i})">حذف</button>
          </div>`).join("")}
        ${imgs.length<4 ? `<label class="pc80-add"><i class="fa-solid fa-plus"></i><span>إضافة صورة</span><input type="file" accept="image/*" hidden onchange="pc80AddSlide(this)"></label>` : ""}
      </div>
      <label>مدة الشريحة</label>
      <div class="pc80-chips">${[3,5,8].map(s=>`<button type="button" class="${(pc80Home.slideSeconds||5)===s?"on":""}" onclick="pc80SetSeconds(${s})">${s} ثوانٍ</button>`).join("")}</div>
    </section>`);
}
function pc80D(ms){ return ms ? new Date(ms).toISOString().slice(0,10) : ""; }
function pc80ChipsRedraw(){
  const d = document.getElementById("pc80Dur"), a = document.getElementById("pc80Aud");
  if(d) d.querySelectorAll("button").forEach((b,i)=>b.classList.toggle("on",PC80_DURATIONS[i][1]===pc80Draft.dur));
  if(a) a.querySelectorAll("button").forEach((b,i)=>b.classList.toggle("on",(i===0?"all":"chefs")===pc80Draft.aud));
}
async function pc80Publish(){
  const text = (document.getElementById("pc80Text")?.value||"").trim();
  if(!text){ showToast("اكتب نص الرسالة","error"); return; }
  const now = Date.now();
  try{
    await pc80Save({broadcast:{id:now, text, audience:pc80Draft.aud, createdAtMs:now, expiresAtMs: pc80Draft.dur ? now+pc80Draft.dur : 0}});
    showToast("تم نشر الرسالة"); renderSettingsHome();
  }catch(e){ console.error(e); showToast("تعذر النشر","error"); }
}
async function pc80Clear(){
  try{ await pc80Save({broadcast:null}); showToast("تم إيقاف الرسالة"); renderSettingsHome(); }
  catch(e){ console.error(e); showToast("تعذر الإيقاف","error"); }
}
async function pc80SaveSlides(list){
  try{ await pc80Save({slides:list}); }catch(e){ console.error(e); showToast("تعذر الحفظ","error"); }
}
function pc80EditSlide(i,key,val){
  const list = pc80Home.slides.map(x=>({...x}));
  if(!list[i]) return;
  list[i][key] = (key==="startMs"||key==="endMs") ? (val ? new Date(val+(key==="endMs"?"T23:59:59":"T00:00:00")).getTime() : 0) : val;
  pc80SaveSlides(list);
}
async function pc80DelSlide(i){
  if(!await pcConfirm("حذف هذه الصورة من السلايدر؟",{danger:true,title:"حذف صورة",okText:"نعم، احذف"})) return;
  await pc80SaveSlides(pc80Home.slides.filter((_,k)=>k!==i));
  renderSettingsHome();
}
function pc80SetSeconds(s){ pc80Save({slideSeconds:s}).then(()=>renderSettingsHome()); }

function pc80Compress(file){
  return new Promise((res,rej)=>{
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = ()=>{
      const W = 960, H = 480, c = document.createElement("canvas"); c.width = W; c.height = H;
      const k = Math.max(W/img.width, H/img.height), w = img.width*k, h = img.height*k;
      c.getContext("2d").drawImage(img,(W-w)/2,(H-h)/2,w,h);
      URL.revokeObjectURL(url);
      let q = .75, out = c.toDataURL("image/jpeg",q);
      while(out.length > 90000 && q > .3){ q -= .1; out = c.toDataURL("image/jpeg",q); }
      res(out);
    };
    img.onerror = rej; img.src = url;
  });
}
async function pc80AddSlide(input){
  const f = input.files && input.files[0]; if(!f) return;
  if((pc80Home.slides||[]).length >= 4){ showToast("الحد الأقصى 4 صور","warn"); return; }
  try{
    const img = await pc80Compress(f);
    await pc80SaveSlides([...(pc80Home.slides||[]), {id:Date.now(), img, title:"", startMs:0, endMs:0}]);
    showToast("تمت إضافة الصورة"); renderSettingsHome();
  }catch(e){ console.error(e); showToast("تعذر قراءة الصورة","error"); }
}

var PC84_GROUPS = [
  {title:"الفريق والتشغيل", rows:[
    {key:"branches", ico:"fa-building",   color:"#0A84FF", name:"الفروع",          sub:"إضافة الفروع وتعطيلها",          tabs:["branches"]},
    {key:"team",  ico:"fa-users",       color:"#4C920E", name:"الفريق والأقسام", sub:"الأقسام، الشيفات، الصرف الداخلي", tabs:["sections","chefs","internal"]},
    {key:"tasks", ico:"fa-clipboard-check", color:"#AF52DE", name:"المهام",       sub:"النظافة والتشغيل",              tabs:["cleaning","operations"]}]},
  {title:"المحتوى", rows:[
    {key:"items", ico:"fa-box",         color:"#FF9500", name:"الأصناف",         sub:"المستودع، المنيو، Excel",        tabs:["warehouse","menu","excel"]},
    {key:"msg",   ico:"fa-bullhorn",    color:"#F2B01E", name:"الرسائل والسلايدر", sub:"رسالة جماعية وصور الرئيسية",     tabs:["home"]}]},
  {title:"النظام", rows:[
    {key:"sys",   ico:"fa-shield-halved", color:"#8E8E93", name:"النظام",        sub:"كلمات المرور، حول البرنامج",     tabs:["passwords","about"]}]}
];
var PC84_TAB_NAMES = {branches:"الفروع", sections:"الأقسام", chefs:"الشيفات", internal:"الصرف الداخلي", cleaning:"النظافة", operations:"التشغيل",
  warehouse:"المستودع", menu:"المنيو والإنتاج", excel:"Excel", home:"الرسالة والسلايدر", passwords:"كلمات المرور", about:"حول البرنامج"};

function pc84GroupOf(tab){
  for(const g of PC84_GROUPS) for(const r of g.rows) if(r.tabs.includes(tab)) return r;
  return null;
}

function pc51SettingsGroupsHtml(){
  return PC84_GROUPS.map(g=>`
    <section class="pc84-group">
      <h2>${g.title}</h2>
      <div class="pc84-list">
        ${g.rows.map(r=>`
          <button type="button" class="pc84-row" onclick="openSettingsTab('${r.tabs[0]}')">
            <span class="pc84-tile" style="background:${r.color}"><i class="fa-solid ${r.ico}"></i></span>
            <span class="pc84-txt"><b>${r.name}</b><small>${r.sub}</small></span>
            <i class="fa-solid fa-chevron-left pc84-chev"></i>
          </button>`).join("")}
      </div>
    </section>`).join("");
}

function pc84Tabs(active){
  const g = pc84GroupOf(active);
  if(!g || g.tabs.length < 2) return "";
  return `<nav class="pc84-tabs" aria-label="${g.name}">${g.tabs.map(t=>
    `<button type="button" class="${t===active?"on":""}" onclick="openSettingsTab('${t}')">${PC84_TAB_NAMES[t]}</button>`).join("")}</nav>`;
}

function settingsShell(active,title,bodyHtml){
  const isOverview = active === "overview";
  currentBackFn = isOverview ? "renderGateway()" : "renderSettingsOverview()";
  if(!isPhoneBack) history.pushState({page:"settings-"+active},"");
  const g = pc84GroupOf(active);
  app.innerHTML = `
    <main class="app pc32-settings-page">
      <section class="pc32-settings-head">
        <button type="button" onclick="${isOverview ? "renderGateway()" : "renderSettingsOverview()"}" aria-label="رجوع"><i class="fa-solid fa-arrow-right"></i></button>
        <div>
          <span>${isOverview ? "" : "الإعدادات"}</span>
          <h1>${escapeHtml(isOverview ? "الإعدادات" : (g ? g.name : title))}</h1>
        </div>
        <button type="button" onclick="renderGateway()" aria-label="البوابة"><i class="fa-solid fa-house"></i></button>
      </section>
      ${isOverview ? pc51SettingsGroupsHtml() : `${pc84Tabs(active)}<section class="pc32-settings-body">${bodyHtml}</section>`}
    </main>
    ${typeof pc18BottomNav === "function" ? pc18BottomNav("settings") : ""}`;
}

function pc85ReviewHtml(o){
  const r = o && o.receiveReview;
  if(!r) return "";
  const bad = (r.items||[]).filter(x=>x.ok === false);
  return `<div class="pc85-review ${bad.length?"bad":"ok"}">
    <b>${bad.length ? `الشيف أبلغ عن نقص في ${bad.length} ${bad.length===1?"صنف":"أصناف"}` : "الشيف أكّد استلام كل الأصناف"}</b>
    ${bad.length ? `<ul>${bad.map(x=>`<li>${escapeHtml(x.name||"")}</li>`).join("")}</ul>` : ""}
    ${r.note ? `<p>${escapeHtml(r.note)}</p>` : ""}
  </div>`;
}

var pc85Marks = {};
function pc85Mark(i,ok){
  pc85Marks[i] = ok;
  document.querySelectorAll(`[data-rv="${i}"] button`).forEach(b=>b.classList.toggle("on", (b.dataset.v==="1") === ok));
  document.querySelector(`[data-rv="${i}"]`)?.classList.toggle("bad", !ok);
}

async function pc60Receive(id){
  const o = warehouseOrders.find(x=>x.id===id);
  if(!o) return;
  const items = o.items || [];
  pc85Marks = {};
  items.forEach((_,i)=>{ pc85Marks[i] = true; });
  const rows = items.map((i,k)=>{
    const issued = (i.issuedQty===undefined||i.issuedQty===null) ? Number(i.qty) : Number(i.issuedQty);
    const short = issued !== Number(i.qty);
    return `<div class="pc85-row" data-rv="${k}">
      <div><b>${escapeHtml(i.name||"")}</b><small>${short?`مصروف ${pc60Num(issued)} من ${pc60Num(i.qty)}`:`${pc60Num(issued)}`} ${escapeHtml(i.unit||"")}</small></div>
      <span class="pc85-seg"><button type="button" data-v="1" class="on" onclick="pc85Mark(${k},true)">مكتمل</button><button type="button" data-v="0" onclick="pc85Mark(${k},false)">ناقص</button></span>
    </div>`;
  }).join("");
  const res = await pcSheet({
    title:"مراجعة الاستلام", icon:"fa-clipboard-check",
    body:`<p class="pc85-hint">تأكد أن كل صنف وصلك كاملاً</p><div class="pc85-list">${rows}</div>
      <textarea id="pc85Note" class="pc70-cartnote" placeholder="ملاحظة (اختياري)"></textarea>`,
    actions:[
      {label:"تأكيد الاستلام", kind:"btn-main", value:h=>({note:h.querySelector("#pc85Note").value.trim()})},
      {label:"إلغاء", kind:"btn-light", value:null}
    ]
  });
  if(!res || typeof res !== "object") return;
  try{
    const review = {items:items.map((i,k)=>({name:i.name||"", ok:pc85Marks[k]!==false})), note:res.note, atMs:Date.now()};
    const {db,doc,updateDoc} = window.firebaseDB;
    await updateDoc(doc(db,"warehouse_orders",id),{status:"تم الاستلام", receiveReview:review});
    showToast(review.items.some(x=>!x.ok) ? "تم الاستلام وأُبلغ المستودع بالنقص" : "تم تأكيد الاستلام");
    renderMyOrders();
  }catch(err){ console.error(err); showToast("تعذر تأكيد الاستلام","error"); }
}

function pc86Stock(item){
  const v = item && item.stockQty;
  return (v === null || v === undefined || v === "" || !isFinite(Number(v))) ? null : Number(v);
}
function pc86Find(orderItem){
  const list = warehouseItems||[];
  const nm = String(orderItem.name||orderItem.productName||"").trim();
  return list.find(w=>String(w.id)===String(orderItem.itemId||orderItem.id||"")) ||
         (orderItem.code ? list.find(w=>String(w.code||"")===String(orderItem.code)) : null) ||
         (nm ? list.find(w=>String(w.nameAr||w.name||"").trim()===nm) : null) || null;
}
function pc86Issued(orderItem, wItem){
  const q = Number(orderItem.issuedQty ?? orderItem.qty ?? 0);
  return pc70Conv(q, pc70Unit(orderItem.unit), pc70Unit(wItem.unit)) ;
}
function pc86StockLine(orderItem){
  const w = pc86Find(orderItem); const st = w ? pc86Stock(w) : null;
  if(st === null) return "";
  const need = pc86Issued(orderItem,w);
  return `<small class="pc86-stock ${need>st?"low":""}">المتوفر: ${pc60Num(st)} ${escapeHtml(w.unit||"")}${need>st?" (أقل من المطلوب)":""}</small>`;
}
async function pc86Deduct(items){
  try{
    const {db,doc,updateDoc} = window.firebaseDB;
    const sums = {};
    (items||[]).forEach(oi=>{
      const w = pc86Find(oi); if(!w || pc86Stock(w) === null) return;
      sums[w.id] = (sums[w.id]||0) + pc86Issued(oi,w);
    });
    for(const id of Object.keys(sums)){
      const w = warehouseItems.find(x=>x.id===id);
      await updateDoc(doc(db,"warehouse_items",id),{stockQty:Math.max(0, pc70R(pc86Stock(w)-sums[id]))});
    }
  }catch(e){ console.error(e); showToast("تم الصرف لكن تعذر تحديث الكمية المتاحة","warn"); }
}

function pc90ItemOut(orderItem){
  const w = pc86Find(orderItem);
  return !!w && pc90Unavailable(w);
}
function pc90OrderWarn(items){
  const n = (items||[]).filter(pc90ItemOut).length;
  return n ? `<div class="pc90-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${n} ${n===1?"صنف":"أصناف"} غير متوفرة في هذا الطلب</div>` : "";
}
function pc90OutSummary(orders){
  const open = (orders||[]).filter(o=>o.status==="جديد" || !o.status);
  const names = new Set();
  open.forEach(o=>(o.items||[]).forEach(i=>{ if(pc90ItemOut(i)) names.add(i.name||i.productName||""); }));
  if(!names.size) return "";
  return `<div class="pc90-sum"><b><i class="fa-solid fa-triangle-exclamation"></i> أصناف غير متوفرة مطلوبة الآن (${names.size})</b>
    <div>${[...names].slice(0,12).map(n=>`<span class="pc90-tag">${escapeHtml(n)}</span>`).join("")}</div></div>`;
}

/* ===== Start (must stay last: all state above is initialised first) ===== */
/* ===== V9.4 Gateway and branches ===== */
function pcBranches(){
  const list = (branches||[]).slice();
  if(!list.some(b=>b.id==="main")) list.push({id:"main", name:"الفرع الرئيسي", active:true, virtual:true});
  return list.sort((a,b)=>(b.id==="main")-(a.id==="main") || (a.createdAtMs||0)-(b.createdAtMs||0));
}
function pcActiveBranches(){ return pcBranches().filter(b=>b.active !== false); }
function pcBranchOf(x){ return (x && x.branchId) || "main"; }
function pcBranchName(id){ return pcBranches().find(b=>b.id===id)?.name || "الفرع الرئيسي"; }
/* ===== V9.8 Branch scope: each branch sees only its own data ===== */
var PC_SCOPED = {chefSections:v=>chefSections=v, chefs:v=>chefs=v, warehouseOrders:v=>warehouseOrders=v, cleaningTasks:v=>cleaningTasks=v,
  cleaningLogs:v=>cleaningLogs=v, operationTasks:v=>operationTasks=v, operationLogs:v=>operationLogs=v, productionLogs:v=>productionLogs=v,
  wasteLogs:v=>wasteLogs=v, internalIssues:v=>internalIssues=v};
function pcInScope(list){ return pcScope === "all" ? list : list.filter(x=>pcBranchOf(x) === pcScope); }
function pcSetScope(id){
  pcScope = id;
  Object.keys(PC_SCOPED).forEach(k=>PC_SCOPED[k](pcInScope(pcRaw[k]||[])));
}
function pcSettingsEnter(){
  if(!pcActiveBranches().some(b=>b.id === settingsBranch)) settingsBranch = pcActiveBranches()[0]?.id || "main";
  pcSetScope(settingsBranch);
}
function pcSettingsBar(redraw){
  if(!pcMulti()) return "";
  return `<div class="pc60-chips pc96-sbar">${pcActiveBranches().map(b=>`<button type="button" class="pc60-fchip ${b.id===settingsBranch?"active":""}" data-b="${escapeHtml(b.id)}" onclick="pc96SettingsBranch(this.dataset.b,'${redraw}')">${escapeHtml(b.name||"")}</button>`).join("")}</div>`;
}
function pc96SettingsBranch(id,fn){ settingsBranch = id; pcSetScope(id); window[fn](); }
function pcPurgeChefCodes(list){
  const {db,doc,updateDoc,deleteField} = window.firebaseDB;
  list.filter(c=>c.code !== undefined && c.code !== null).forEach(c=>
    updateDoc(doc(db,"chefs",c.id), {code: deleteField ? deleteField() : null}).catch(()=>{}));
}
function pcMine(rec,chef=currentChef){
  if(!rec || !chef) return false;
  return rec.chefId ? rec.chefId === chef.id : (rec.chefName === chef.name && rec.section === chef.section);
}

/* ===== V9.9 Instant open: local cache of the last synced data ===== */
var PC_CACHE_KEY = "pcCache2", PC_CORE = ["chefs","chef_sections","warehouse_orders","production_logs"], pcLoaded = new Set(), pcHydrated = false, pcCacheTimer = null;
var PC_SETTERS = {...PC_SCOPED, branches:v=>branches=v, warehouseItems:v=>warehouseItems=v, menuItems:v=>menuItems=v};
var PC_CACHE_RECENT = {warehouseOrders:1, productionLogs:1, wasteLogs:1, cleaningLogs:1, operationLogs:1, internalIssues:1};
function pcSynced(){ return pcHydrated || PC_CORE.every(k=>pcLoaded.has(k)); }
function pcCacheSoon(){
  if(pcCacheTimer) return;
  pcCacheTimer = setTimeout(()=>{
    pcCacheTimer = null;
    const out = {};
    Object.keys(PC_SETTERS).forEach(k=>{
      const list = pcRaw[k]; if(!list) return;
      out[k] = PC_CACHE_RECENT[k] ? sortNewest(list.slice()).slice(0,80) : list;
    });
    try{ localStorage.setItem(PC_CACHE_KEY, JSON.stringify(out)); }catch(e){}
  }, 1500);
}
function pcHydrate(){
  try{
    const data = JSON.parse(localStorage.getItem(PC_CACHE_KEY) || "null");
    if(!data) return;
    Object.keys(data).forEach(k=>{ if(PC_SETTERS[k]){ pcRaw[k] = data[k]; PC_SETTERS[k](data[k]); } });
    pcHydrated = true;
  }catch(e){}
}
function pcStat(v){ return pcSynced() ? v : `<i class="pc97-sk"></i>`; }

function pcMulti(){ return pcActiveBranches().length > 1; }
function pcBranchTag(x){ return pcMulti() ? `<span class="pc96-branch"><i class="fa-solid fa-building"></i> ${escapeHtml(pcBranchName(pcBranchOf(x)))}</span>` : ""; }
function pcBranchChips(current,fn){
  if(!pcMulti()) return "";
  const all = [["all","كل الفروع"], ...pcBranches().map(b=>[b.id,b.name])];
  return `<div class="pc60-chips">${all.map(b=>`<button type="button" class="pc60-fchip ${current===b[0]?"active":""}" data-b="${escapeHtml(b[0])}" onclick="${fn}(this.dataset.b)">${escapeHtml(b[1]||"")}</button>`).join("")}</div>`;
}

function renderGateway(){
  pcSetScope("all");
  if(typeof ensureUxStyle === "function") ensureUxStyle();
  currentBackFn = "renderGateway()";
  currentChef = null;
  const doors = [
    ["fa-building","pc94-g","الفروع","جميع الفروع، ادخل أي فرع","renderBranches()"],
    ["fa-gear","pc94-s","الإعدادات","كل إعدادات النظام","renderSettingsGate()"],
    ["fa-shield-halved","pc94-o","الإدارة","جميع البيانات والتقارير","renderAdminGate()"],
    ["fa-boxes-stacked","pc94-w","المستودع","استقبال الطلبات والإشراف عليها","renderWarehouseGate()"]];
  app.innerHTML = `
    <main class="app pc94-gate">
      <div class="pc94-brand">${pc50Logo()}<b>PROTEIN &amp; CARB</b><span>منظومة تشغيل المطاعم</span></div>
      <section class="pc94-doors">
        ${doors.map(d=>`
          <button type="button" class="pc94-door" onclick="${d[4]}">
            <span class="pc94-ic ${d[1]}"><i class="fa-solid ${d[0]}"></i></span>
            <span class="pc94-txt"><b>${d[2]}</b><small>${d[3]}</small></span>
            <i class="fa-solid fa-chevron-left pc94-chev"></i>
          </button>`).join("")}
      </section>
      <div class="pc94-foot">${pcLangButton()}${pc93Button("renderChat(false)","pc94-chat")}</div>
    </main>`;
}

function renderBranches(){
  const list = pcActiveBranches();
  pageLayout("الفروع", `
    ${pc60Bar({title:"الفروع", sub:"اختر الفرع", back:"renderGateway()"})}
    <section class="pc60-page pc94-list">
      ${list.map(b=>{
        const n = (pcRaw.chefs||[]).filter(c=>pcBranchOf(c)===b.id).length;
        return `<button type="button" class="pc94-row" data-id="${escapeHtml(b.id)}" onclick="pc94PickBranch(this.dataset.id)">
          <span class="pc94-av">${escapeHtml((b.name||"?").trim().charAt(0))}</span>
          <span class="pc94-txt"><b>${escapeHtml(b.name||"")}</b><small>${b.city?escapeHtml(b.city)+" • ":""}${n} موظف</small></span>
          <i class="fa-solid fa-chevron-left pc94-chev"></i></button>`;
      }).join("")}
    </section>`, "renderGateway()");
}
function pc94PickBranch(id){
  currentBranch = id;
  pcSetScope(id);
  renderHome();
}

function renderSettingsBranches(){
  settingsShell("branches","الفروع", `
    <div class="premium-toolbar"><button class="btn btn-main" onclick="pc94Edit()">إضافة فرع</button></div>
    <section class="pc94-list">
      ${pcBranches().map(b=>{
        const n = (pcRaw.chefs||[]).filter(c=>pcBranchOf(c)===b.id).length;
        return `<button type="button" class="pc94-row ${b.active===false?"off":""}" data-id="${escapeHtml(b.id)}" onclick="pc94Edit(this.dataset.id)">
          <span class="pc94-av">${escapeHtml((b.name||"?").trim().charAt(0))}</span>
          <span class="pc94-txt"><b>${escapeHtml(b.name||"")}</b><small>${b.id==="main"?"الأساسي • ":""}${b.city?escapeHtml(b.city)+" • ":""}${n} موظف</small></span>
          <em class="pc94-tag ${b.active===false?"off":""}">${b.active===false?"معطّل":"نشط"}</em></button>`;
      }).join("")}
    </section>`);
}

async function pc94Edit(id){
  const b = id ? pcBranches().find(x=>x.id===id) : null;
  const body = `
    <label class="pc94-lb">اسم الفرع</label><input id="pc94Name" class="pc93-name" maxlength="40" value="${escapeHtml(b?.name||"")}" placeholder="مثال: فرع الشمال">
    <label class="pc94-lb">المدينة (اختياري)</label><input id="pc94City" class="pc93-name" maxlength="40" value="${escapeHtml(b?.city||"")}">
    ${b && b.id==="main" ? "" : `<label class="pc94-sw"><input id="pc94Active" type="checkbox" ${!b||b.active!==false?"checked":""}><span>نشط ويظهر في البوابة</span></label>`}`;
  const v = await pcSheet({title:b?"تعديل الفرع":"فرع جديد", body, actions:[
    {label:"حفظ الفرع", kind:"btn-main", value:h=>({name:h.querySelector("#pc94Name").value.trim(), city:h.querySelector("#pc94City").value.trim(), active:h.querySelector("#pc94Active")?h.querySelector("#pc94Active").checked:true})},
    {label:"إلغاء", kind:"btn-light", value:null}]});
  if(!v) return;
  if(!v.name){ showToast("اكتب اسم الفرع","error"); return; }
  const {db,doc,setDoc,addDoc,collection} = window.firebaseDB;
  try{
    if(b){ await setDoc(doc(db,"branches",b.id), {name:v.name, city:v.city, active:v.active, createdAtMs:b.createdAtMs||0}, {merge:true}); }
    else await addDoc(collection(db,"branches"), {name:v.name, city:v.city, active:true, createdAtMs:Date.now()});
    showToast("تم حفظ الفرع");
  }catch(err){ console.error(err); showToast("تعذر حفظ الفرع","error"); }
}

function pcSectionInBranch(s,branchId){ return pcBranchOf(s) === branchId; }
function pc95SectionBranches(s){
  const n = (chefs||[]).filter(c=>c.section===s.name && pcBranchOf(c)===pcBranchOf(s)).length;
  return `${n} شيف`;
}
async function pc95SectionEdit(id){
  const sec = id ? chefSections.find(x=>x.id===id) : null;
  const body = `
    <label class="pc94-lb">اسم القسم</label><input id="pc95Name" class="pc93-name" maxlength="30" value="${escapeHtml(sec?.name||"")}" placeholder="مثال: الحلا">
    <label class="pc94-lb">الأيقونة (إيموجي)</label><input id="pc95Icon" class="pc93-name" maxlength="4" value="${escapeHtml(sec?.icon||"")}" placeholder="🍰">`;
  const read = h=>({name:h.querySelector("#pc95Name").value.trim(), icon:h.querySelector("#pc95Icon").value.trim()});
  const actions = [{label:"حفظ القسم", kind:"btn-main", value:h=>({save:read(h)})}];
  if(sec) actions.push({label:"حذف القسم", kind:"btn-danger", value:{del:true}});
  actions.push({label:"إلغاء", kind:"btn-light", value:null});
  const v = await pcSheet({title:sec?"تعديل القسم":`قسم جديد — ${pcBranchName(settingsBranch)}`, body, actions});
  if(!v) return;
  const {db,doc,setDoc,addDoc,collection,serverTimestamp,deleteDoc} = window.firebaseDB;
  try{
    if(v.del){
      if(!(await pcConfirm(`حذف قسم ${sec.name}؟`,{title:"حذف القسم",danger:true,okText:"حذف"}))) return;
      await deleteDoc(doc(db,"chef_sections",sec.id)); showToast("تم حذف القسم"); return;
    }
    const d = v.save;
    if(!d.name){ showToast("اكتب اسم القسم","error"); return; }
    const data = {name:d.name, icon:d.icon||"🍽️"};
    if(sec) await setDoc(doc(db,"chef_sections",sec.id), data, {merge:true});
    else await addDoc(collection(db,"chef_sections"), {...data, branchId:settingsBranch, createdAt:serverTimestamp()});
    showToast("تم حفظ القسم");
  }catch(err){ console.error(err); showToast("تعذر حفظ القسم","error"); }
}

/* ===== V9.3 Team chat: one room for everyone ===== */
var PC93_KEEP_DAYS = 7, PC93_SHOW = 100, pc93Purged = false, pc93Who = null;
function pc93Store(k,v){
  try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; }
}
function pc93Device(){
  let id = pc93Store("pc93Id");
  if(!id){ id = "d"+Date.now().toString(36)+Math.random().toString(36).slice(2,8); pc93Store("pc93Id",id); }
  return id;
}
function pc93Sorted(){
  return (chatMessages||[]).filter(m=>m.text).sort((a,b)=>(a.createdAtMs||0)-(b.createdAtMs||0));
}
function pc93Unread(){
  const seen = Number(pc93Store("pc93Seen")||0), me = pc93Device();
  return (chatMessages||[]).filter(m=>(m.createdAtMs||0) > seen && m.senderId !== me).length;
}
function pc93Button(fn="renderChat(false)",cls=""){
  const n = pc93Unread();
  return `<button type="button" class="${cls}" onclick="${fn}" aria-label="الدردشة"><i class="fa-solid fa-comments"></i><em class="pc93-badge ${n?"":"hide"}">${n>99?"99+":n}</em></button>`;
}
function pc93Live(){
  if(document.getElementById("pc93Msgs")){ pc93Draw(); return; }
  const n = pc93Unread();
  document.querySelectorAll(".pc93-badge").forEach(b=>{ b.textContent = n>99?"99+":n; b.classList.toggle("hide",!n); });
}
function pc93Day(ms){
  const d = new Date(ms);
  if(d.toDateString() === new Date().toDateString()) return "اليوم";
  if(d.toDateString() === new Date(Date.now()-864e5).toDateString()) return "أمس";
  return d.toLocaleDateString("ar",{weekday:"long",day:"numeric",month:"long"});
}
function pc93Time(ms){ return new Date(ms).toLocaleTimeString("ar",{hour:"numeric",minute:"2-digit"}); }

function pc93Draw(){
  const box = document.getElementById("pc93Msgs");
  if(!box) return;
  const list = pc93Sorted().slice(-PC93_SHOW), me = pc93Device();
  const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 120 || !box.dataset.ready;
  let day = "", prev = null, html = "";
  list.forEach(m=>{
    const ms = m.createdAtMs || 0, d = pc93Day(ms), mine = m.senderId === me;
    if(d !== day){ html += `<div class="pc93-day"><span>${d}</span></div>`; day = d; prev = null; }
    const head = !mine && prev !== m.senderId;
    html += `<div class="pc93-msg ${mine?"me":""}">
      ${head ? `<small>${escapeHtml(m.name||"")}${m.section?` <i>${escapeHtml(m.section)}</i>`:""}</small>` : ""}
      <p>${escapeHtml(m.text).replace(/\n/g,"<br>")}<time>${pc93Time(ms)}</time></p></div>`;
    prev = m.senderId;
  });
  box.innerHTML = html || `<div class="pc93-empty"><i class="fa-solid fa-comments"></i><span>لا توجد رسائل بعد</span></div>`;
  box.dataset.ready = "1";
  if(stick) box.scrollTop = box.scrollHeight;
  const last = list.length ? list[list.length-1].createdAtMs||0 : 0;
  if(last > Number(pc93Store("pc93Seen")||0)) pc93Store("pc93Seen", String(last));
}

async function pc93Identity(chef){
  if(chef) return {name:chef.name||"", section:chef.section||""};
  let name = pc93Store("pc93Name");
  if(name) return {name, section:"الإدارة"};
  name = await pcSheet({title:"اسمك في الدردشة", body:`<input id="pc93Name" class="pc93-name" maxlength="30" placeholder="الاسم">`,
    actions:[{label:"حفظ", kind:"btn-main", value:h=>h.querySelector("#pc93Name").value.trim()},{label:"إلغاء", kind:"btn-light", value:""}]});
  if(!name) return null;
  pc93Store("pc93Name", name);
  return {name, section:"الإدارة"};
}

async function renderChat(fromChef){
  const who = await pc93Identity(fromChef ? currentChef : null);
  if(!who) return;
  pc93Who = who;
  const back = fromChef ? "renderChefDashboard(currentChef)" : "renderHome()";
  pageLayout("الدردشة", `
    ${pc60Bar({title:"دردشة الفريق", sub:who.name, back})}
    <section class="pc93">
      <div class="pc93-msgs" id="pc93Msgs"></div>
      <form class="pc93-send" onsubmit="pc93Send(event)">
        <textarea id="pc93Text" rows="1" maxlength="1000" placeholder="اكتب رسالة" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.requestSubmit();}"></textarea>
        <button type="submit" aria-label="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    </section>`, back);
  pc93Draw();
  pc93Purge();
}

async function pc93Send(ev){
  ev.preventDefault();
  const input = document.getElementById("pc93Text");
  const text = input.value.trim();
  if(!text || !pc93Who) return;
  input.value = "";
  const {db,addDoc,collection} = window.firebaseDB;
  const msg = {text, name:pc93Who.name, section:pc93Who.section, senderId:pc93Device(), createdAtMs:Date.now()};
  chatMessages = chatMessages.concat([{...msg, id:"tmp"+msg.createdAtMs}]);
  pc93Draw();
  try{ await addDoc(collection(db,"chat_messages"), msg); }
  catch(err){ console.error(err); showToast("تعذر إرسال الرسالة","error"); }
}

function pc93Purge(){
  if(pc93Purged) return;
  pc93Purged = true;
  const {db,doc,deleteDoc} = window.firebaseDB, cut = Date.now() - PC93_KEEP_DAYS*864e5;
  (chatMessages||[]).filter(m=>m.id && (m.createdAtMs||0) < cut).slice(0,30)
    .forEach(m=>deleteDoc(doc(db,"chat_messages",m.id)).catch(()=>{}));
}

/* ===== V9.3 Unavailable items: supply requests from chefs ===== */
async function pc91Ask(kind,src){
  const name = pc60ItemName(kind,src);
  const ok = await pcSheet({title:"غير متوفر حالياً", icon:"fa-triangle-exclamation", tone:"warn",
    body:`<p>${escapeHtml(name)} غير متوفر في المستودع. هل تريد إضافته وإرسال طلب توفير للإدارة؟</p>`,
    actions:[{label:"طلب وإرسال للإدارة", kind:"btn-main", value:true},{label:"إلغاء", kind:"btn-light", value:false}]});
  if(!ok) return;
  pc60SetQty(kind,src.id,pc70Init(pc70DefUnit(kind,src)));
  const e = pc60Entry(kind,src.id);
  if(e){ e.supplyRequested = true; pc60RefreshRow(kind,src.id); }
}
function pc91Requests(){
  const names = new Set();
  (warehouseOrders||[]).filter(o=>o.status==="جديد" || !o.status).forEach(o=>(o.items||[]).forEach(i=>{
    if(i.supplyRequested && pc90ItemOut(i)) names.add(i.name||"");
  }));
  return [...names];
}

/* ===== V9.2 Excel import: preview, text cleaning, parallel save ===== */
var pc92Imp = null;

function pc92Clean(v){
  return String(v ?? "").normalize("NFKC").replace(/[​-‏‪-‮⁦-⁩﻿ـ]/g,"").replace(/\s+/g," ").trim();
}
function pc92Key(v){ return pc92Clean(v).toLowerCase(); }
function pc92HasAr(v){ return /[؀-ۿ]/.test(v); }

async function pc92ReadFile(file){
  if(!window.XLSX) throw new Error("مكتبة Excel غير محملة");
  const wb = /\.csv$/i.test(file.name)
    ? XLSX.read(await file.text(), {type:"string"})
    : XLSX.read(new Uint8Array(await file.arrayBuffer()), {type:"array", cellText:true});
  for(const name of wb.SheetNames){
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {header:1, defval:"", raw:false, blankrows:false});
    if(rows.some(r=>r.some(c=>pc92Clean(c)))) return rows.map(r=>r.map(pc92Clean));
  }
  return [];
}

var PC92_FIELDS = {
  wh:[["code","الكود"],["ar","الاسم العربي"],["en","الاسم الإنجليزي"],["unit","الوحدة"],["category","التصنيف"],["qty","الكمية المتاحة"]],
  menu:[["code","الكود"],["ar","الاسم العربي"],["en","الاسم الإنجليزي"],["section","القسم"]]
};
var PC92_KEYS = {
  code:["code","كود","رمز","رقم الصنف","sku","باركود","barcode"],
  en:["english","انجليز","إنجليز","name en","name_en","en name"],
  ar:["arabic","عرب","اسم الصنف","اسم المنتج","الصنف","المنتج","الاسم","name","وصف"],
  unit:["unit","وحدة"],
  section:["section","قسم"],
  category:["category","تصنيف","فئة","نوع"],
  qty:["quantity","qty","كمية","رصيد","مخزون","stock"]
};

function pc92Detect(kind,rows){
  const fields = PC92_FIELDS[kind].map(f=>f[0]);
  const lower = rows.slice(0,10).map(r=>r.map(c=>String(c).toLowerCase()));
  let hIdx = -1, best = 0, map = {};
  lower.forEach((r,ri)=>{
    const m = {}, used = new Set();
    ["code","en","ar","unit","section","category","qty"].forEach(f=>{
      if(!fields.includes(f)) return;
      const ci = r.findIndex((h,i)=>!used.has(i) && h && PC92_KEYS[f].some(k=>h.includes(k)));
      if(ci >= 0){ m[f] = ci; used.add(ci); }
    });
    const n = Object.keys(m).length;
    if(n > best && (m.ar !== undefined || m.en !== undefined)){ best = n; hIdx = ri; map = m; }
  });
  if(hIdx < 0){
    const order = kind === "wh" ? ["code","ar","en","unit","category","qty"] : ["code","ar","en","section"];
    map = {}; order.forEach((f,i)=>{ if(i < (rows[0]||[]).length) map[f] = i; });
    return {header:-1, map};
  }
  return {header:hIdx, map};
}

function pc92Build(){
  const I = pc92Imp, cell = (r,f)=> I.map[f] === undefined || I.map[f] === "" ? "" : pc92Clean(r[I.map[f]]);
  const existing = I.kind === "wh" ? (warehouseItems||[]) : (menuItems||[]);
  const codes = new Set(existing.map(x=>pc92Key(x.code)).filter(Boolean));
  const names = new Set(existing.map(x=>pc92Key(x.nameAr||x.name)).filter(Boolean));
  const seenC = new Set(), seenN = new Set();
  const secNames = new Set((chefSections||[]).map(s=>pc92Key(s.name)));
  I.items = []; I.stats = {new:0, dup:0, empty:0, badSection:0};
  I.rows.slice(I.header+1).forEach((r,i)=>{
    let ar = cell(r,"ar"), en = cell(r,"en");
    if(ar && !en){
      const m = ar.match(/^(.*[؀-ۿ].*?)\s*[\/|]\s*([A-Za-z][A-Za-z0-9 &'().,-]*)$/);
      if(m){ ar = m[1].trim(); en = m[2].trim(); }
      else if(!pc92HasAr(ar)){ en = ar; ar = ""; }
    }
    const code = cell(r,"code");
    const it = {row:I.header+2+i, code, ar, en};
    if(!ar && !en){ it.status = "empty"; I.stats.empty++; I.items.push(it); return; }
    const nk = pc92Key(ar || en);
    if((code && (codes.has(pc92Key(code)) || seenC.has(pc92Key(code)))) || names.has(nk) || seenN.has(nk)){
      it.status = "dup"; I.stats.dup++; I.items.push(it); return;
    }
    if(code) seenC.add(pc92Key(code)); seenN.add(nk);
    if(I.kind === "wh"){
      it.unit = pc70Unit(cell(r,"unit")) || "حبة";
      it.category = cell(r,"category");
      const q = cell(r,"qty").replace(/,/g,""); it.qty = (q !== "" && isFinite(Number(q))) ? Number(q) : null;
    }else{
      it.section = cell(r,"section");
      if(it.section && !secNames.has(pc92Key(it.section))){ it.warn = "قسم غير معرّف"; I.stats.badSection++; }
    }
    it.status = "new"; I.stats.new++; I.items.push(it);
  });
}

async function pc92Open(kind,file){
  if(!file){ showToast("اختر ملف Excel أولاً","error"); return; }
  try{
    const rows = await pc92ReadFile(file);
    if(rows.length < 1){ showToast("الملف فارغ","error"); return; }
    const det = pc92Detect(kind,rows);
    pc92Imp = {kind, rows, header:det.header, map:det.map, name:file.name};
    pc92Build(); pc92Draw();
  }catch(err){ console.error(err); showToast("تعذر قراءة الملف","error"); }
}
function importWarehouseExcel(){ return pc92Open("wh", document.getElementById("warehouseExcelInput")?.files?.[0]); }
function importMenuExcel(){ return pc92Open("menu", document.getElementById("menuExcelInput")?.files?.[0]); }

function pc92Draw(){
  const I = pc92Imp; if(!I) return;
  const cols = I.rows.reduce((m,r)=>Math.max(m,r.length),0);
  const head = I.header >= 0 ? I.rows[I.header] : [];
  const colOpt = i=>`عمود ${i+1}${head[i] ? ": "+head[i].slice(0,18) : ""}`;
  const st = I.stats, back = `openSettingsTab('excel')`;
  const preview = I.items.slice(0,8);
  pageLayout("معاينة الاستيراد", `
    ${pc60Bar({title:"معاينة الاستيراد", sub:escapeHtml(I.name), back})}
    <section class="pc60-page has-bar pc92">
      <div class="pc92-stats">
        <div class="new"><b>${st.new}</b><span>جديد</span></div>
        <div><b>${st.dup}</b><span>مكرر (يُتجاوز)</span></div>
        <div><b>${st.empty}</b><span>فارغ</span></div>
      </div>
      ${st.badSection ? `<div class="pc90-warn">${st.badSection} صف قسمه غير معرّف في النظام</div>` : ""}
      <div class="pc60-card pc92-map">
        <b>ربط الأعمدة</b><small>راجع أن كل حقل يقرأ العمود الصحيح</small>
        ${PC92_FIELDS[I.kind].map(([f,l])=>`
          <label><span>${l}</span>
            <select onchange="pc92SetMap('${f}',this.value)"><option value="">بدون</option>${Array.from({length:cols},(_,i)=>`<option value="${i}" ${I.map[f]===i?"selected":""}>${escapeHtml(colOpt(i))}</option>`).join("")}</select></label>`).join("")}
      </div>
      <div class="pc50-section-title"><h2>أول ${preview.length} صفوف</h2></div>
      <div class="pc92-table">${preview.map(it=>`
        <div class="pc92-row ${it.status}">
          <span class="pc92-st">${it.status==="new"?"جديد":it.status==="dup"?"مكرر":"فارغ"}</span>
          <div><b>${escapeHtml(it.ar||it.en||"—")}</b><small>${escapeHtml([it.code,it.en&&it.ar?it.en:"",it.unit,it.category,it.section,it.qty!=null?it.qty:""].filter(v=>v!==""&&v!=null).join(" • "))}</small></div>
        </div>`).join("")}</div>
    </section>
    <div class="pc60-actionbar">
      <button type="button" class="btn btn-light" onclick="${back}">إلغاء</button>
      <button type="button" class="btn btn-main" id="pc92Save" ${st.new?"":"disabled"} onclick="pc92Save()">حفظ ${st.new} صنف</button>
    </div>`, back);
}
function pc92SetMap(f,v){
  pc92Imp.map[f] = v === "" ? undefined : Number(v);
  pc92Build();
  const y = window.scrollY; pc92Draw(); window.scrollTo(0,y);
}

async function pc92Save(){
  const I = pc92Imp; if(!I || pc60Busy) return;
  const list = I.items.filter(x=>x.status === "new");
  if(!list.length) return;
  pc60Busy = true;
  const btn = document.getElementById("pc92Save");
  let done = 0, failed = 0;
  try{
    const {db,addDoc,collection,serverTimestamp} = window.firebaseDB;
    const col = I.kind === "wh" ? "warehouse_items" : "menu_items";
    for(let i=0;i<list.length;i+=25){
      await Promise.all(list.slice(i,i+25).map(async it=>{
        const base = I.kind === "wh"
          ? {code:it.code, name:it.ar||it.en, nameAr:it.ar||it.en, nameEn:it.en, unit:it.unit, category:it.category||""}
          : {code:it.code, nameAr:it.ar||it.en, nameEn:it.en, section:it.section||""};
        if(I.kind === "wh" && it.qty != null) base.stockQty = it.qty;
        try{ await addDoc(collection(db,col),{...base, createdAt:serverTimestamp()}); done++; }catch(e){ failed++; console.error(e); }
      }));
      if(btn) btn.textContent = `جاري الحفظ ${Math.min(list.length,i+25)}/${list.length}`;
    }
    showToast(failed ? `تم حفظ ${done} وتعذر ${failed}` : `تم استيراد ${done} صنف`, failed ? "warn" : "success");
    pc92Imp = null;
    openSettingsTab(I.kind === "wh" ? "warehouse" : "menu");
  }catch(err){ console.error(err); showToast("توقف الحفظ","error"); }
  finally{ pc60Busy = false; }
}


/* ===== V10 Section stores: every section of a branch has a raw store and a production store =====
   Balances are never stored; they are recomputed from source documents so every figure is traceable:
   raw  (+) warehouse orders confirmed received (issued qty)      (−) raw waste, manual issues      (±) stock counts
   prod (+) production logs                                       (−) product waste, manual issues  (±) stock counts
   Each document belongs to the section written on it (orders, production and waste already carry `section`).
   Only documents dated on/after the branch's stockStartMs are counted (go-live date, set once per branch). */
var branchStockMoves = [];
var pcStoreView = "bal", pcStoreQ = "", pcStoreCur = "raw", pcStoreSec = "";
var PC_NO_SEC = "بدون قسم";
var PC_STORES = {
  raw:  {name:"مستودع الخام",   short:"خام",   icon:"fa-boxes-stacked", issueReasons:["صرف للإنتاج","استهلاك تشغيلي","تحويل لقسم آخر","تحويل لفرع آخر","أخرى"]},
  prod: {name:"مستودع الإنتاج", short:"إنتاج", icon:"fa-box-open",      issueReasons:["بيع / توزيع","وجبات موظفين","ضيافة","تحويل لقسم آخر","تحويل لفرع آخر","أخرى"]}
};

function pcStoreRawList(key, fallback){
  const raw = pcRaw && pcRaw[key];
  return Array.isArray(raw) ? raw : (Array.isArray(fallback) ? fallback : []);
}
function pcStoreMine(list){ return list.filter(x=>pcBranchOf(x) === currentBranch); }
function pcStoreBranch(){ return pcBranches().find(b=>b.id===currentBranch) || {id:currentBranch, virtual:true}; }
function pcStoreStart(){ return Number(pcStoreBranch().stockStartMs||0) || 0; }
function pcStoreMs(x){
  return Number(x && (x.timeMs || x.createdAtMs) || 0) || (typeof getTimeValue === "function" ? (getTimeValue(x)||0) : 0);
}
function pcStoreSecOf(x){ return String(x && x.section || "").trim() || PC_NO_SEC; }

/* Sections of the current branch, in setup order, de-duplicated by name. Any section that appears on
   counted documents but is no longer set up is still listed, so no balance is hidden. */
function pcStoreSections(){
  const names = [];
  const add = n=>{ n = String(n||"").trim(); if(n && !names.includes(n)) names.push(n); };
  pcStoreMine(pcStoreRawList("chefSections", chefSections)).forEach(s=>add(s.name));
  if(pcStoreStart()) ["raw","prod"].forEach(st=>pcStoreMoves(st).forEach(m=>add(m.section)));
  return names;
}

function pcStoreConv(q, from, to){
  if(!from || !to || from === to) return {ok:true, q:Number(q||0)};
  const a = PC70_UNITS[from], b = PC70_UNITS[to];
  if(a && b && a.fam === b.fam && a.fam !== "cnt") return {ok:true, q:pc70R(Number(q||0)*a.f/b.f)};
  return {ok:false, q:Number(q||0)};
}
function pcStoreMenuFind(src){
  const list = menuItems || [];
  const nm = String(src.name || src.productName || "").trim();
  return list.find(m=>String(m.id)===String(src.itemId||src.id||"")) ||
         ((src.code||src.itemCode) ? list.find(m=>String(m.code||"")===String(src.code||src.itemCode)) : null) ||
         (nm ? list.find(m=>String(pc17ItemName(m)).trim()===nm) : null) || null;
}
function pcStoreCatalog(store){
  return store === "raw" ? (warehouseItems||[]) : (menuItems||[]);
}
function pcStoreCatUnit(store, cat){
  return pc70Unit(cat && cat.unit) || (store === "prod" ? "حبة" : "");
}
/* Maps any source line to one item key in the store's catalog unit. Lines whose unit cannot be
   converted (e.g. كرتون vs حبة) are kept on their own key instead of being silently mixed. */
function pcStoreItem(store, src){
  const qty0 = Number(src.qty || 0);
  const unit0 = pc70Unit(src.unit || "");
  const cat = store === "raw" ? pc86Find(src) : pcStoreMenuFind(src);
  if(cat){
    const cu = pcStoreCatUnit(store, cat);
    const c = pcStoreConv(qty0, unit0 || cu, cu);
    const base = {itemId:cat.id, name:pc17ItemName(cat) || src.name || "", code:cat.code || ""};
    return c.ok ? {...base, key:`${store}:${cat.id}`, unit:cu || unit0, qty:c.q}
                : {...base, key:`${store}:${cat.id}|${unit0}`, unit:unit0, qty:qty0};
  }
  const nm = String(src.name || src.productName || "").trim();
  return {itemId:"", key:`${store}:n:${nm}|${unit0}`, name:nm, code:src.code || src.itemCode || "", unit:unit0, qty:qty0};
}
function pcStoreWasteStore(w){
  if(w.store === "raw" || w.store === "prod") return w.store;
  return pc86Find({name:w.productName, code:w.itemCode}) ? "raw" : "prod";
}

/* All movements of one store type for the current branch (optionally one section), oldest first. */
function pcStoreMoves(store, sec){
  const start = pcStoreStart();
  const out = [];
  const keep = (ms, x)=>start && ms >= start && (!sec || pcStoreSecOf(x) === sec);
  if(store === "raw"){
    pcStoreMine(pcStoreRawList("warehouseOrders", warehouseOrders)).forEach(o=>{
      if(o.status !== "تم الاستلام") return;
      const ms = Number(o.receiveReview?.atMs || o.issuedAtMs || 0) || pcStoreMs(o);
      if(!keep(ms, o)) return;
      const lines = (o.items||[]).map(i=>pcStoreItem("raw", {...i, qty:(i.issuedQty ?? i.qty)})).filter(l=>l.qty);
      const short = (o.receiveReview?.items||[]).some(x=>x.ok === false);
      if(lines.length) out.push({ms, sign:1, type:"receipt", icon:"fa-truck", tone:"ok", section:pcStoreSecOf(o),
        title:`استلام طلب #${o.orderId||""}`, by:o.chefName||"", note:short ? "أُبلغ عن نقص عند الاستلام — راجع بجرد" : "", lines});
    });
  } else {
    pcStoreMine(pcStoreRawList("productionLogs", productionLogs)).forEach(l=>{
      if(l.noProduction) return;
      const ms = pcStoreMs(l);
      if(!keep(ms, l)) return;
      const lines = (l.items||[]).map(i=>pcStoreItem("prod", i)).filter(x=>x.qty);
      if(lines.length) out.push({ms, sign:1, type:"production", icon:"fa-kitchen-set", tone:"ok", section:pcStoreSecOf(l),
        title:"إنتاج", by:l.chefName||"", note:l.note||"", lines});
    });
  }
  pcStoreMine(pcStoreRawList("wasteLogs", wasteLogs)).forEach(w=>{
    if(pcStoreWasteStore(w) !== store) return;
    const ms = pcStoreMs(w);
    if(!keep(ms, w)) return;
    const line = pcStoreItem(store, {name:w.productName, code:w.itemCode, qty:w.qty, unit:w.unit});
    if(line.qty) out.push({ms, sign:-1, type:"waste", icon:"fa-trash-can", tone:"warn", section:pcStoreSecOf(w),
      title:"هدر", by:w.chefName||"", note:w.reason||"", lines:[line]});
  });
  pcStoreMine(pcStoreRawList("branchStockMoves", branchStockMoves)).forEach(m=>{
    if(m.store !== store || m.cancelled) return;
    const ms = pcStoreMs(m);
    if(!keep(ms, m)) return;
    const lines = (m.lines||[]).map(x=>({...x, qty:Number(x.qty||0)}));
    if(m.type === "count") out.push({ms, sign:1, type:"count", icon:"fa-clipboard-list", tone:"info", section:pcStoreSecOf(m),
      title:"جرد فعلي", by:m.by||"", note:m.note||"", lines});
    else out.push({ms, sign:-1, type:"issue", icon:"fa-right-from-bracket", tone:"info", section:pcStoreSecOf(m),
      title:m.reason || "صرف", by:m.by||"", note:m.note||"", lines});
  });
  return out.sort((a,b)=>a.ms-b.ms);
}

function pcStoreBalances(store, sec){
  const map = {};
  pcStoreMoves(store, sec).forEach(m=>m.lines.forEach(l=>{
    const r = map[l.key] || (map[l.key] = {key:l.key, itemId:l.itemId||"", name:l.name, code:l.code||"", unit:l.unit, qty:0, inQ:0, outQ:0, lastMs:0});
    const q = m.sign * Number(l.qty||0);
    r.qty = pc70R(r.qty + q);
    if(q >= 0) r.inQ = pc70R(r.inQ + q); else r.outQ = pc70R(r.outQ - q);
    r.lastMs = Math.max(r.lastMs, m.ms);
  }));
  return Object.values(map).sort((a,b)=>String(a.name).localeCompare(String(b.name),"ar"));
}
function pcStoreStat(store, sec){
  const bal = pcStoreBalances(store, sec);
  return {items:bal.filter(r=>r.qty !== 0).length, neg:bal.filter(r=>r.qty < 0).length};
}

/* ----- Branch home card ----- */
function pcStoreSub(){
  const n = pcStoreSections().length;
  if(!pcStoreStart()) return `${n} قسم · الشيفات والطلبات`;
  const neg = pcStoreNeg();
  return `${n} قسم · خام وإنتاج${neg ? ` · ${neg} رصيد سالب` : ""}`;
}
function pcStoreNeg(){
  return pcStoreStart() ? pcStoreStat("raw").neg + pcStoreStat("prod").neg : 0;
}
function pcStoreHomeCard(){
  const neg = pcStoreNeg();
  return pc61Card("fa-layer-group","الأقسام",pcStoreSub(),"renderStoreSections()", neg||"", neg ? "warn" : "");
}

/* ----- Sections list ----- */
function renderStoreSections(){
  pageLayout("الأقسام", `
    ${pc60Bar({title:"الأقسام", sub:pcBranchName(currentBranch), back:"renderHome()"})}
    <section class="pc60-page has-bar pc100-page"><div id="pcStoreSecBox"></div></section>`, "renderHome()");
  pcDrawStoreSections();
}
function pcDrawStoreSections(){
  const box = document.getElementById("pcStoreSecBox");
  if(!box) return;
  const on = !!pcStoreStart();
  const secs = pcStoreSections();
  box.innerHTML = `
    ${on ? `<small class="pc100-since">الاحتساب من ${escapeHtml(new Date(pcStoreStart()).toLocaleDateString("ar-SA"))} · لكل قسم مستودع خام ومستودع إنتاج</small>` : pcStoreIntroHtml(true)}
    ${secs.length ? `<div class="pc100-secs">${secs.map(sec=>{
      const r = on ? pcStoreStat("raw", sec) : {items:0,neg:0}, p = on ? pcStoreStat("prod", sec) : {items:0,neg:0};
      const js = escapeHtml(JSON.stringify(sec));
      const nCh = pcStoreSecChefs(sec).length;
      return `<div class="pc100-sec ${r.neg||p.neg?"neg":""}">
        <button type="button" class="pc100-sec-head" onclick='renderBranchStore(${js},"raw")'>
          <b>${escapeHtml(sec)}</b><small>${nCh ? `${nCh} شيف` : "لا يوجد شيف"}</small><i class="fa-solid fa-chevron-left"></i></button>
        ${on ? `<div class="pc100-sec-btns">
          <button type="button" onclick='renderBranchStore(${js},"raw")'>
            <i class="fa-solid ${PC_STORES.raw.icon}"></i><span>خام</span><em>${r.items} صنف${r.neg?` · ${r.neg} سالب`:""}</em></button>
          <button type="button" onclick='renderBranchStore(${js},"prod")'>
            <i class="fa-solid ${PC_STORES.prod.icon}"></i><span>إنتاج</span><em>${p.items} صنف${p.neg?` · ${p.neg} سالب`:""}</em></button>
        </div>` : ""}</div>`;
    }).join("")}</div>` : pc60Empty("fa-layer-group","لا توجد أقسام في هذا الفرع — أضفها من الإعدادات")}`;
}
function pcStoreIntroHtml(compact){
  if(compact) return `
    <div class="pc100-intro is-compact">
      <div><b>مستودعات الأقسام غير مفعّلة</b><p>الشيفات والطلبات تعمل الآن. فعّل المستودعات ليصبح لكل قسم مستودع خام ومستودع إنتاج.</p></div>
      <button type="button" class="btn btn-main" onclick="pcStoreActivate()">تفعيل</button>
    </div>`;
  return `
    <div class="pc100-intro">
      <span class="pc100-intro-ic"><i class="fa-solid fa-warehouse"></i></span>
      <b>مستودعات الأقسام غير مفعّلة لهذا الفرع</b>
      <p>عند التفعيل يصبح لكل قسم مستودع خام ومستودع إنتاج، ويبدأ احتساب الحركات من تاريخ التفعيل فقط، ولا تدخل البيانات القديمة في الأرصدة.
      بعد التفعيل سجّل جردًا افتتاحيًا لكل صنف موجود فعليًا في كل قسم.</p>
      <button type="button" class="btn btn-main" onclick="pcStoreActivate()">تفعيل مستودعات الفرع من الآن</button>
    </div>`;
}

/* ----- One section's store ----- */
function renderBranchStore(sec, store){
  pcStoreSec = String(sec||"").trim() || PC_NO_SEC;
  pcStoreCur = store === "prod" ? "prod" : "raw";
  pcStoreView = "bal"; pcStoreQ = "";
  pageLayout(pcStoreSec, `
    ${pc60Bar({title:pcStoreSec, sub:`${pcBranchName(currentBranch)} · مستودعات القسم`, back:"renderStoreSections()"})}
    <section class="pc60-page has-bar pc100-page"><div id="pcStoreBox"></div></section>`, "renderStoreSections()");
  pcDrawStore();
}

function pcDrawStore(){
  const box = document.getElementById("pcStoreBox");
  if(!box) return;
  const top = pcStoreChefsHtml() + `
    <button type="button" class="btn btn-main pc100-new" onclick="pcStoreNewOrder()"><i class="fa-solid fa-cart-plus"></i> طلب جديد من المستودع</button>`;
  if(!pcStoreStart()){ box.innerHTML = top + pcStoreIntroHtml(true); return; }
  const store = pcStoreCur;
  const y = window.scrollY;
  const head = top + `
    <div class="pc100-seg" role="tablist">
      ${["raw","prod"].map(st=>`<button type="button" role="tab" class="${store===st?"active":""}" onclick="pcStoreCur='${st}';pcStoreQ='';pcDrawStore()">
        <i class="fa-solid ${PC_STORES[st].icon}"></i> ${PC_STORES[st].name}</button>`).join("")}
    </div>
    <div class="pc100-head">
      <div class="pc60-chips">
        <button type="button" class="pc60-fchip ${pcStoreView==="bal"?"active":""}" onclick="pcStoreView='bal';pcDrawStore()">الأرصدة</button>
        <button type="button" class="pc60-fchip ${pcStoreView==="mov"?"active":""}" onclick="pcStoreView='mov';pcDrawStore()">الحركات</button>
      </div>
      <div class="pc100-acts">
        <button type="button" class="btn btn-light" onclick="pcStoreIssue()"><i class="fa-solid fa-right-from-bracket"></i> صرف</button>
        <button type="button" class="btn btn-main" onclick="pcStoreCount()"><i class="fa-solid fa-clipboard-list"></i> جرد</button>
      </div>
    </div>
    <small class="pc100-since">الاحتساب من ${escapeHtml(new Date(pcStoreStart()).toLocaleDateString("ar-SA"))}</small>`;
  box.innerHTML = head + (pcStoreView === "bal" ? pcStoreBalHtml() : pcStoreMovHtml());
  window.scrollTo(0,y);
}

function pcStoreFilterRows(all){
  const q = pcStoreQ.trim().toLowerCase();
  return all.filter(r=>(r.qty !== 0 || r.inQ || r.outQ) &&
    (!q || String(r.name).toLowerCase().includes(q) || String(r.code).toLowerCase().includes(q)));
}
function pcStoreBalHtml(){
  const all = pcStoreBalances(pcStoreCur, pcStoreSec);
  const neg = all.filter(r=>r.qty < 0).length;
  return `
    <label class="pc60-search pc100-search"><i class="fa-solid fa-magnifying-glass"></i>
      <input id="pcStoreSearch" type="search" placeholder="ابحث عن صنف أو كود" value="${escapeHtml(pcStoreQ)}"
        oninput="pcStoreQ=this.value;pcStoreDrawBalRows()" autocomplete="off"></label>
    ${neg ? `<div class="pc100-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${neg} صنف برصيد سالب: صرف أكثر من الوارد المسجّل. راجع المستندات أو سجّل جردًا.</div>` : ""}
    <div id="pcStoreBalRows">${pcStoreBalRows(pcStoreFilterRows(all))}</div>`;
}
function pcStoreBalRows(rows){
  if(!rows.length) return pc60Empty("fa-folder-open","لا توجد أرصدة بعد — ابدأ بجرد افتتاحي");
  return `<div class="pc100-list">${rows.map(r=>`
    <div class="pc100-row ${r.qty<0?"neg":""}">
      <div><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.code||"")} · وارد ${pc60Num(r.inQ)} · منصرف ${pc60Num(r.outQ)}</small></div>
      <strong>${pc60Num(r.qty)} <em>${escapeHtml(r.unit||"")}</em></strong>
    </div>`).join("")}</div>`;
}
function pcStoreDrawBalRows(){
  const el = document.getElementById("pcStoreBalRows");
  if(el) el.innerHTML = pcStoreBalRows(pcStoreFilterRows(pcStoreBalances(pcStoreCur, pcStoreSec)));
}

function pcStoreMovHtml(){
  const moves = pcStoreMoves(pcStoreCur, pcStoreSec).slice().reverse().slice(0,150);
  if(!moves.length) return pc60Empty("fa-clock-rotate-left","لا توجد حركات منذ التفعيل");
  return `<div class="pc60-timeline pc100-mov">${moves.map(m=>`
    <div class="pc60-tl ${m.tone}">
      <span class="pc60-tl-icon"><i class="fa-solid ${m.icon}"></i></span>
      <div><b>${escapeHtml(m.title)}${m.by?` · ${escapeHtml(m.by)}`:""}</b>
        <small>${m.lines.map(l=>{
          const v = m.type === "count" ? `${l.qty>=0?"+":""}${pc60Num(l.qty)}` : `${m.sign<0?"−":"+"}${pc60Num(l.qty)}`;
          return `${escapeHtml(l.name)} ${v} ${escapeHtml(l.unit||"")}${m.type==="count"?` (دفتري ${pc60Num(l.book)} ← فعلي ${pc60Num(l.actual)})`:""}`;
        }).join("، ")}</small>
        ${m.note?`<small class="pc100-note">${escapeHtml(m.note)}</small>`:""}</div>
      <time>${escapeHtml(new Date(m.ms).toLocaleString("ar-SA",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))}</time>
    </div>`).join("")}</div>`;
}

async function pcStoreActivate(){
  const b = pcStoreBranch();
  if(!(await pcConfirm(`تفعيل مستودعات الأقسام لفرع ${pcBranchName(currentBranch)} من الآن؟ لا يمكن تغيير تاريخ البداية من هذه الشاشة بعد التفعيل.`,{title:"تفعيل المستودعات", okText:"تفعيل"}))) return;
  try{
    const {db,doc,setDoc} = window.firebaseDB;
    const data = {stockStartMs:Date.now()};
    if(b.virtual) Object.assign(data, {name:pcBranchName(currentBranch), active:true, createdAtMs:0});
    await setDoc(doc(db,"branches",currentBranch), data, {merge:true});
    if(b.virtual) branches = [...(branches||[]), {id:currentBranch, ...data}];
    else branches = (branches||[]).map(x=>x.id===currentBranch ? {...x, ...data} : x);
    showToast("تم تفعيل المستودعات — سجّل الجرد الافتتاحي لكل قسم");
    pcDrawStoreSections(); pcDrawStore();
  }catch(err){ console.error(err); showToast("تعذر التفعيل، تحقق من الاتصال","error"); }
}

function pcStoreItemPicker(store){
  const opts = pcStoreCatalog(store).map(c=>{
    const nm = pc17ItemName(c);
    return `<option value="${escapeHtml(nm + (c.code ? " — " + c.code : ""))}"></option>`;
  }).join("");
  return `<input id="pc100Item" class="pc93-name" list="pc100Cat" placeholder="اكتب اسم الصنف أو الكود واختر من القائمة" autocomplete="off">
    <datalist id="pc100Cat">${opts}</datalist>`;
}
function pcStorePicked(store, text){
  const t = String(text||"").trim();
  if(!t) return null;
  return pcStoreCatalog(store).find(c=>{
    const nm = pc17ItemName(c);
    return t === nm + (c.code ? " — " + c.code : "") || t === nm || (c.code && t === String(c.code));
  }) || null;
}
function pcStoreLineFor(store, cat, qty){
  return pcStoreItem(store, {itemId:cat.id, code:cat.code, name:pc17ItemName(cat), qty, unit:pcStoreCatUnit(store, cat)});
}
function pcStoreBookOf(store, key){
  return (pcStoreBalances(store, pcStoreSec).find(r=>r.key===key) || {qty:0}).qty;
}
function pcStoreByName(){
  try{ return localStorage.getItem("pcStoreBy") || ""; }catch(e){ return ""; }
}
function pcStoreSaveBy(v){
  try{ localStorage.setItem("pcStoreBy", v); }catch(e){}
}

async function pcStoreIssue(){
  const store = pcStoreCur, S = PC_STORES[store];
  const v = await pcSheet({title:`صرف من ${S.name}`, icon:"fa-right-from-bracket", body:`
    <p class="pc85-hint">القسم: <b>${escapeHtml(pcStoreSec)}</b></p>
    <label class="pc94-lb">الصنف</label>${pcStoreItemPicker(store)}
    <label class="pc94-lb">الكمية (بوحدة الصنف)</label><input id="pc100Qty" class="pc93-name" type="text" inputmode="decimal" placeholder="0">
    <label class="pc94-lb">السبب</label>
    <select id="pc100Reason" class="pc93-name">${S.issueReasons.map(r=>`<option>${r}</option>`).join("")}</select>
    <label class="pc94-lb">اسم المسؤول عن الصرف</label><input id="pc100By" class="pc93-name" maxlength="40" value="${escapeHtml(pcStoreByName())}">
    <label class="pc94-lb">ملاحظة (اختياري)</label><input id="pc100Note" class="pc93-name" maxlength="120">`,
    actions:[
      {label:"تسجيل الصرف", kind:"btn-main", value:h=>({item:h.querySelector("#pc100Item").value, qty:h.querySelector("#pc100Qty").value,
        reason:h.querySelector("#pc100Reason").value, by:h.querySelector("#pc100By").value.trim(), note:h.querySelector("#pc100Note").value.trim()})},
      {label:"إلغاء", kind:"btn-light", value:null}]});
  if(!v) return;
  const cat = pcStorePicked(store, v.item);
  const qty = Number(String(v.qty).replace(",", "."));
  if(!cat){ showToast("اختر الصنف من القائمة","error"); return; }
  if(!isFinite(qty) || qty <= 0){ showToast("اكتب كمية صحيحة أكبر من صفر","error"); return; }
  if(!v.by){ showToast("اكتب اسم المسؤول عن الصرف","error"); return; }
  const line = pcStoreLineFor(store, cat, qty);
  const book = pcStoreBookOf(store, line.key);
  if(qty > book && !(await pcConfirm(`الرصيد الدفتري ${pc60Num(book)} ${line.unit} أقل من الكمية المصروفة. سيصبح الرصيد سالبًا. هل تتابع؟`,{title:"رصيد غير كافٍ", okText:"تسجيل رغم ذلك"}))) return;
  await pcStoreSave({store, type:"issue", reason:v.reason, by:v.by, note:v.note, lines:[line]}, "تم تسجيل الصرف");
}

async function pcStoreCount(){
  const store = pcStoreCur, S = PC_STORES[store];
  const v = await pcSheet({title:`جرد ${S.name}`, icon:"fa-clipboard-list", body:`
    <p class="pc85-hint">القسم: <b>${escapeHtml(pcStoreSec)}</b>. اكتب الكمية الموجودة فعليًا على الرف، ويسجّل النظام الفرق بين الدفتري والفعلي كتسوية جرد.</p>
    <label class="pc94-lb">الصنف</label>${pcStoreItemPicker(store)}
    <label class="pc94-lb">الكمية الفعلية (بوحدة الصنف)</label><input id="pc100Qty" class="pc93-name" type="text" inputmode="decimal" placeholder="0">
    <label class="pc94-lb">اسم القائم بالجرد</label><input id="pc100By" class="pc93-name" maxlength="40" value="${escapeHtml(pcStoreByName())}">
    <label class="pc94-lb">ملاحظة (اختياري)</label><input id="pc100Note" class="pc93-name" maxlength="120" placeholder="مثال: جرد افتتاحي">`,
    actions:[
      {label:"متابعة", kind:"btn-main", value:h=>({item:h.querySelector("#pc100Item").value, qty:h.querySelector("#pc100Qty").value,
        by:h.querySelector("#pc100By").value.trim(), note:h.querySelector("#pc100Note").value.trim()})},
      {label:"إلغاء", kind:"btn-light", value:null}]});
  if(!v) return;
  const cat = pcStorePicked(store, v.item);
  const actual = Number(String(v.qty).replace(",", "."));
  if(!cat){ showToast("اختر الصنف من القائمة","error"); return; }
  if(String(v.qty).trim() === "" || !isFinite(actual) || actual < 0){ showToast("اكتب الكمية الفعلية (صفر أو أكثر)","error"); return; }
  if(!v.by){ showToast("اكتب اسم القائم بالجرد","error"); return; }
  const base = pcStoreLineFor(store, cat, actual);
  const book = pcStoreBookOf(store, base.key);
  const diff = pc70R(actual - book);
  if(!(await pcConfirm(`${pcStoreSec} · ${base.name}: الدفتري ${pc60Num(book)} · الفعلي ${pc60Num(actual)} · الفرق ${diff>=0?"+":""}${pc60Num(diff)} ${base.unit}`,{title:"تأكيد الجرد", okText:"اعتماد الجرد"}))) return;
  await pcStoreSave({store, type:"count", by:v.by, note:v.note, lines:[{...base, qty:diff, book, actual}]},
    diff ? "تم اعتماد الجرد وتسجيل الفرق" : "تم اعتماد الجرد — لا يوجد فرق");
}

async function pcStoreSave(rec, okMsg){
  if(pc60Busy) return;
  pc60Busy = true;
  try{
    pcStoreSaveBy(rec.by);
    const {db,addDoc,collection,serverTimestamp} = window.firebaseDB;
    const lines = rec.lines.map(l=>({key:l.key, itemId:l.itemId||"", code:l.code||"", name:l.name||"", unit:l.unit||"", qty:pc70R(l.qty),
      ...(rec.type==="count" ? {book:pc70R(l.book), actual:pc70R(l.actual)} : {})}));
    const now = Date.now();
    await addDoc(collection(db,"branch_stock_moves"), {branchId:currentBranch, section:pcStoreSec === PC_NO_SEC ? "" : pcStoreSec,
      store:rec.store, type:rec.type, reason:rec.reason||"", by:rec.by, note:rec.note||"", lines,
      createdAtMs:now, timeMs:now, createdAtText:nowText(), createdAt:serverTimestamp()});
    showToast(okMsg);
  }catch(err){ console.error(err); showToast("تعذر الحفظ، تحقق من الاتصال","error"); }
  finally{ pc60Busy = false; pcDrawStore(); }
}

/* ----- New warehouse order from inside a section ----- */
var pcStoreOrderRet = null;
function pcStoreSecChefs(sec){
  const name = sec || pcStoreSec;
  return pcStoreMine(pcStoreRawList("chefs", chefs)).filter(c=>String(c.section||"").trim() === name);
}
function pcStoreChefsHtml(){
  const list = pcStoreSecChefs();
  return `<div class="pc100-chefs"><small>شيفات القسم — اضغط على اسمك للدخول</small>
    ${list.length ? `<div class="pc100-chef-row">${list.map(c=>`<button type="button" data-id="${escapeHtml(c.id)}" onclick="pcEnterChef(this.dataset.id)">
      <span class="pc94-av">${escapeHtml((c.name||"?").trim().charAt(0))}</span>${escapeHtml(c.name||"")}</button>`).join("")}</div>`
      : `<p class="pc100-none">لا يوجد شيف في هذا القسم — أضفه من الإعدادات</p>`}</div>`;
}
async function pcStoreNewOrder(){
  const list = pcStoreSecChefs();
  if(!list.length){ showToast("لا يوجد شيف في هذا القسم — أضفه من الإعدادات","error"); return; }
  let chef = list[0];
  if(list.length > 1){
    chef = await pcSheet({title:"من صاحب الطلب؟", icon:"fa-user", body:`<p class="pc85-hint">القسم: <b>${escapeHtml(pcStoreSec)}</b></p>`,
      actions:[...list.map(c=>({label:c.name||"شيف", kind:"btn-light", value:c})), {label:"إلغاء", kind:"btn-light", value:null}]});
    if(!chef) return;
  }
  currentChef = chef;
  pcStoreOrderRet = {chefId:chef.id, sec:pcStoreSec, store:pcStoreCur, branch:currentBranch, at:Date.now()};
  renderWarehouseRequest();
}
function pcStoreBackFromOrder(){
  const r = pcStoreOrderRet;
  pcStoreOrderRet = null;
  if(!r || !currentChef || r.chefId !== currentChef.id || r.branch !== currentBranch || Date.now() - r.at > 30*60e3) return false;
  renderBranchStore(r.sec, r.store);
  return true;
}

pcHydrate();
initCloud();
renderGateway();
