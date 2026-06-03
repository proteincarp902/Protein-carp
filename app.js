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
      </section>
      <section class="home-launcher">
        <div class="home-circle-card" onclick="renderChefs()"><div class="home-circle"><i class="fa-solid fa-utensils"></i></div><h3>الشيفات</h3><p>الإنتاج والطلبات</p></div>
        <div class="home-circle-card" onclick="renderWarehouseGate()"><div class="home-circle"><i class="fa-solid fa-boxes-stacked"></i></div><h3>المستودع ${newOrders ? `(${newOrders})` : ""}</h3><p>طلبات وصرف داخلي</p></div>
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
  if(document.getElementById("sectionsContainer")) drawSections();
  if(document.getElementById("chefSection")) drawChefSectionOptions();
  if(document.getElementById("chefsContainer")) drawChefs();
  if(document.getElementById("warehouseItemsContainer")) drawWarehouseItems();
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
    alert("كلمة المرور غير صحيحة");
    return;
  }
  renderSettings();
}

function renderSettings(){
  pageLayout("الإعدادات", `
    <section class="grid">
      <div class="card" onclick="renderSettingsSections()"><div class="icon"><i class="fa-solid fa-utensils"></i></div><div class="card-title">أقسام الشيفات</div></div>
      <div class="card" onclick="renderSettingsChefs()"><div class="icon"><i class="fa-solid fa-utensils"></i></div><div class="card-title">إدارة الشيفات</div></div>
      <div class="card" onclick="renderSettingsWarehouseItems()"><div class="icon"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-title">أصناف المستودع</div></div>
      <div class="card" onclick="renderSettingsCleaning()"><div class="icon"><i class="fa-solid fa-broom"></i></div><div class="card-title">عناصر النظافة</div></div>
      <div class="card" onclick="renderSettingsOperations()"><div class="icon"><i class="fa-solid fa-industry"></i></div><div class="card-title">مهام التشغيل</div></div>
      <div class="card" onclick="renderSettingsInternalIssue()"><div class="icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div><div class="card-title">إعدادات الصرف الداخلي</div></div>
      <div class="card" onclick="renderSettingsPasswords()"><div class="icon"><i class="fa-solid fa-lock"></i></div><div class="card-title">كلمات المرور</div></div>
    </section>
  `,"renderHome()");
}

/* Settings Sections */

function renderSettingsSections(){
  pageLayout("أقسام الشيفات", `
    <div class="panel">
      <h3>إضافة قسم</h3>
      <label>اسم القسم</label>
      <input id="sectionName" placeholder="مثال: الحلويات">
      <label>الأيقونة</label>
      <input id="sectionIcon" placeholder="مثال: 🍰">
      <button class="btn btn-main" onclick="addSection()">➕ إضافة قسم</button>
    </div>
    <div id="sectionsContainer" class="grid" style="margin-top:16px"></div>
  `,"renderSettings()");
  drawSections();
}

async function addSection(){
  const name=document.getElementById("sectionName").value.trim();
  const icon=document.getElementById("sectionIcon").value.trim();
  if(!name) return;

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"chef_sections"),{name,icon:icon||"🍽️",createdAt:serverTimestamp()});
  document.getElementById("sectionName").value="";
  document.getElementById("sectionIcon").value="";
}

function drawSections(){
  const box=document.getElementById("sectionsContainer");
  if(!box) return;
  box.innerHTML = chefSections.length ? chefSections.map(s=>`
    <div class="card">
      <div class="icon">${s.icon||"🍽️"}</div>
      <div class="card-title">${s.name}</div>
      <button class="btn btn-light" style="margin-top:12px" onclick="deleteDocByPath('chef_sections','${s.id}')">🗑 حذف</button>
    </div>
  `).join("") : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

/* Settings Chefs */

function renderSettingsChefs(){
  pageLayout("إدارة الشيفات", `
    <div class="panel">
      <h3>إضافة شيف</h3>
      <label>اسم الشيف</label>
      <input id="chefName" placeholder="مثال: أحمد">
      <label>كود الشيف</label>
      <input id="chefCode" type="number" placeholder="مثال: 1001">
      <label>القسم</label>
      <select id="chefSection"></select>
      <button class="btn btn-main" onclick="addChef()">➕ إضافة شيف</button>
    </div>
    <div id="chefsContainer" class="grid" style="margin-top:16px"></div>
  `,"renderSettings()");
  drawChefSectionOptions();
  drawChefs();
}

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
    alert("الكود مستخدم");
    return;
  }

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"chefs"),{name,code,section,createdAt:serverTimestamp()});
  document.getElementById("chefName").value="";
  document.getElementById("chefCode").value="";
}

function drawChefs(){
  const box=document.getElementById("chefsContainer");
  if(!box) return;
  box.innerHTML = chefs.length ? chefs.map(c=>`
    <div class="card">
      <div class="icon"><i class="fa-solid fa-utensils"></i></div>
      <div class="card-title">${c.name}</div>
      <div style="margin-top:8px;color:#7b8674;font-weight:700">${c.section} - ${c.code}</div>
      <button class="btn btn-light" style="margin-top:12px" onclick="deleteDocByPath('chefs','${c.id}')">🗑 حذف</button>
    </div>
  `).join("") : `<div class="panel placeholder">لا يوجد شيفات</div>`;
}

/* Warehouse Items */

function renderSettingsWarehouseItems(){
  pageLayout("أصناف المستودع", `
    <div class="panel">
      <h3>إضافة صنف</h3>
      <label>اسم الصنف</label>
      <input id="warehouseItemName" placeholder="مثال: صدر دجاج">
      <label>كود الصنف</label>
      <input id="warehouseItemCode" placeholder="مثال: CH001">
      <label>الوحدة</label>
      <select id="warehouseItemUnit">
        <option>كجم</option><option>جرام</option><option>لتر</option><option>مل</option>
        <option>حبة</option><option>كرتون</option><option>صندوق</option><option>ربطة</option>
      </select>
      <button class="btn btn-main" onclick="addWarehouseItem()">➕ إضافة صنف</button>
    </div>
    <div class="panel" style="margin-top:16px">
      <input id="warehouseSearch" placeholder="🔍 بحث باسم الصنف أو الكود" oninput="drawWarehouseItems()">
      <div id="warehouseItemsContainer"></div>
    </div>
  `,"renderSettings()");
  drawWarehouseItems();
}

async function addWarehouseItem(){
  const name=document.getElementById("warehouseItemName").value.trim();
  const code=document.getElementById("warehouseItemCode").value.trim();
  const unit=document.getElementById("warehouseItemUnit").value;
  if(!name||!code) return;

  if(warehouseItems.some(i=>i.code===code)){
    alert("كود الصنف مستخدم");
    return;
  }

  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"warehouse_items"),{name,code,unit,createdAt:serverTimestamp()});
  document.getElementById("warehouseItemName").value="";
  document.getElementById("warehouseItemCode").value="";
}

function drawWarehouseItems(){
  const box=document.getElementById("warehouseItemsContainer");
  if(!box) return;

  const search=(document.getElementById("warehouseSearch")?.value||"").trim().toLowerCase();
  const list=warehouseItems.filter(i=>i.name.toLowerCase().includes(search)||i.code.toLowerCase().includes(search));

  if(!list.length){
    box.innerHTML=`<div class="placeholder">لا توجد أصناف</div>`;
    return;
  }

  box.innerHTML=`
    <div style="display:grid;gap:8px">
      ${list.map(i=>`
        <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:16px;padding:12px;">
          <b>${i.name}</b>
          <span>${i.code}</span>
          <span>${i.unit||""}</span>
          <button class="btn btn-light" onclick="deleteDocByPath('warehouse_items','${i.id}')">🗑</button>
        </div>
      `).join("")}
    </div>
  `;
}

/* Cleaning Settings */

function renderSettingsCleaning(){
  pageLayout("عناصر النظافة", `
    <div class="panel">
      <h3>إضافة مهمة نظافة</h3>
      <label>اسم المهمة بالعربي</label>
      <input id="cleaningTaskName" placeholder="مثال: دورات المياه">
      <label>الورديات</label>
      <label><input id="cleanMorning" type="checkbox" checked> صباح</label>
      <label><input id="cleanAfternoon" type="checkbox" checked> ظهر</label>
      <label><input id="cleanNight" type="checkbox" checked> ليل</label>
      <button class="btn btn-main" onclick="addCleaningTask()">➕ إضافة مهمة</button>
    </div>
    <div id="cleaningTasksContainer" style="margin-top:16px"></div>
  `,"renderSettings()");
  drawCleaningTasks();
}

async function addCleaningTask(){
  const nameAr=document.getElementById("cleaningTaskName").value.trim();
  if(!nameAr) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"cleaning_tasks"),{
    nameAr,
    morning:document.getElementById("cleanMorning").checked,
    afternoon:document.getElementById("cleanAfternoon").checked,
    night:document.getElementById("cleanNight").checked,
    createdAt:serverTimestamp()
  });
  document.getElementById("cleaningTaskName").value="";
}

function drawCleaningTasks(){
  const box=document.getElementById("cleaningTasksContainer");
  if(!box) return;
  if(!cleaningTasks.length){
    box.innerHTML=`<div class="panel placeholder">لا توجد مهام نظافة</div>`;
    return;
  }
  box.innerHTML=cleaningTasks.map(t=>`
    <div class="panel" style="margin-bottom:10px">
      <h3>${t.nameAr}</h3>
      <div style="color:#7b8674;font-weight:800;margin-top:8px">
        ${t.morning?"صباح ":""} ${t.afternoon?"ظهر ":""} ${t.night?"ليل":""}
      </div>
      <button class="btn btn-light" style="margin-top:12px" onclick="deleteDocByPath('cleaning_tasks','${t.id}')">🗑 حذف</button>
    </div>
  `).join("");
}

/* Operations Settings */

function renderSettingsOperations(){
  pageLayout("مهام التشغيل", `
    <div class="panel">
      <h3>إضافة مهمة تشغيل</h3>
      <label>اسم المهمة</label>
      <input id="operationTaskName" placeholder="مثال: تشغيل الشوايات">
      <label>الفترة / الوقت</label>
      <input id="operationTaskPeriod" placeholder="مثال: قبل الافتتاح أو 12 ظهر أو قبل الإغلاق">
      <button class="btn btn-main" onclick="addOperationTask()">➕ إضافة مهمة</button>
    </div>
    <div id="operationTasksContainer" style="margin-top:16px"></div>
  `,"renderSettings()");
  drawOperationTasks();
}

async function addOperationTask(){
  const name=document.getElementById("operationTaskName").value.trim();
  const period=document.getElementById("operationTaskPeriod").value.trim();
  if(!name||!period) return;
  const {db,addDoc,collection,serverTimestamp}=window.firebaseDB;
  await addDoc(collection(db,"operation_tasks"),{name,period,createdAt:serverTimestamp()});
  document.getElementById("operationTaskName").value="";
  document.getElementById("operationTaskPeriod").value="";
}

function drawOperationTasks(){
  const box=document.getElementById("operationTasksContainer");
  if(!box) return;
  if(!operationTasks.length){
    box.innerHTML=`<div class="panel placeholder">لا توجد مهام تشغيل</div>`;
    return;
  }
  box.innerHTML=operationTasks.map(t=>`
    <div class="panel" style="margin-bottom:10px">
      <h3>${t.name}</h3>
      <div style="color:#7b8674;font-weight:800;margin-top:8px">${t.period}</div>
      <button class="btn btn-light" style="margin-top:12px" onclick="deleteDocByPath('operation_tasks','${t.id}')">🗑 حذف</button>
    </div>
  `).join("");
}

/* Internal Issue Settings */

function renderSettingsInternalIssue(){
  pageLayout("إعدادات الصرف الداخلي", `
    <div class="panel">
      <h3>موظفي المستودع</h3>
      <input id="warehouseStaffName" placeholder="اسم موظف المستودع">
      <button class="btn btn-main" onclick="addWarehouseStaff()">➕ إضافة موظف</button>
    </div>
    <div id="warehouseStaffBox" style="margin-top:12px"></div>

    <div class="panel" style="margin-top:16px">
      <h3>جهات الصرف</h3>
      <input id="internalDestinationName" placeholder="مثال: مطبخ العمال">
      <button class="btn btn-main" onclick="addInternalDestination()">➕ إضافة جهة</button>
    </div>
    <div id="internalDestinationsBox" style="margin-top:12px"></div>
  `,"renderSettings()");
  drawWarehouseStaff();
  drawInternalDestinations();
}

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

function renderSettingsPasswords(){
  pageLayout("كلمات المرور", `
    <div class="panel">
      <label>كلمة مرور الإدارة</label>
      <input id="adminPasswordInput" type="password" placeholder="كلمة مرور الإدارة">
      <label>كلمة مرور المستودع</label>
      <input id="warehousePasswordInput" type="password" placeholder="كلمة مرور المستودع">
      <button class="btn btn-main" onclick="savePasswords()">💾 حفظ كلمات المرور</button>
    </div>
  `,"renderSettings()");
}

async function savePasswords(){
  const adminPassword=document.getElementById("adminPasswordInput").value.trim();
  const warehousePassword=document.getElementById("warehousePasswordInput").value.trim();
  const {db,doc,setDoc}=window.firebaseDB;
  await setDoc(doc(db,"settings","system"),{
    adminPassword:adminPassword||systemSettings.adminPassword,
    warehousePassword:warehousePassword||systemSettings.warehousePassword,
    orderCounter:systemSettings.orderCounter||1001
  },{merge:true});
  alert("تم حفظ كلمات المرور");
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
      <div style="font-size:48px">👨🍳</div>
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

function renderProduction(){
  if(!currentChef) return renderChefs();

  pageLayout("الإنتاج", `
    <div class="panel">
      <label>اسم المنتج</label>
      <input id="productionNameInput" placeholder="مثال: كرواسون" onkeydown="focusProductionQty(event)">

      <label>الكمية</label>
      <input id="productionQtyInput" type="number" min="1" placeholder="مثال: 20" onkeydown="handleProductionQtyInput(event)">

      <button class="btn btn-main" onclick="addProductionFromInputs()">أضف الكمية</button>
      <textarea id="productionNote" placeholder="ملاحظة للإدارة"></textarea>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>الإنتاج الحالي</h3>
      <div id="productionDraftBox"></div>
      <button class="btn btn-main" style="margin-top:12px" onclick="submitProduction()">رفع الإنتاج للإدارة</button>
    </div>

    <div id="lastProductionBox" style="margin-top:16px"></div>
  `,"renderChefDashboard(currentChef)");

  drawProductionDraft();
  drawLastProductionForChef();

  setTimeout(()=>{
    const input=document.getElementById("productionNameInput");
    if(input) input.focus();
  },100);
}

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

  alert("تم رفع الإنتاج للإدارة");
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
    alert("أكمل اسم المنتج والكمية وسبب الهدر");
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

  alert("تم رفع التالف والهدر للإدارة");
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
  const myOrders=warehouseOrders.filter(o=>o.chefCode===currentChef.code && o.status!=="مؤرشف");
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
    alert("كلمة المرور غير صحيحة");
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
  const visibleOrders = warehouseOrders.filter(o=>o.status!=="مؤرشف");
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
  if(item.issuedQty === undefined || item.issuedQty === null) return `<b>${item.issuedQty !== undefined ? `مطلوب: ${item.qty} / مصروف: ${item.issuedQty}` : `${item.qty} ${item.unit||""}`}</b>`;
  return `<div style="text-align:left;display:grid;gap:4px"><b>مطلوب: ${item.qty} ${item.unit||""}</b><b style="color:#2E7D32">مصروف: ${item.issuedQty} ${item.unit||""}</b></div>`;
}

function renderOrderCard(order,isChefView){
  const issueSummary = order.issueStatus || getOrderIssueSummary(order);
  return `
    <div class="panel">
      <h2><i class="fa-solid fa-boxes-stacked"></i> طلبية من قسم ${order.section}</h2>
      <p style="font-weight:800;margin-top:8px"><i class="fa-solid fa-utensils"></i> الشيف: ${order.chefName}</p>
      <p style="color:#7b8674;margin-top:4px">🆔 ${order.orderId||order.id}</p>
      <p style="color:#7b8674;margin-top:4px">🕒 ${order.createdAtText||""}</p>
      <div style="margin-top:12px">
        ${(order.items||[]).map((item,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5eadb;padding:8px 0;gap:12px"><span>${i+1}- ${item.name}</span>${getOrderItemDisplay(item)}</div>`).join("")}
      </div>
      ${order.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${order.note}</p>` : ""}
      ${order.issuedAtText ? `<p style="margin-top:8px;color:#7b8674;font-weight:800">اعتماد الصرف: ${order.issuedAtText}</p>` : ""}
      <h3 style="margin-top:12px">الحالة: ${order.status}</h3>
      ${(order.status==="جاهز" || order.status==="تم الاستلام" || order.status==="مؤرشف") ? `<h3 style="margin-top:8px">${issueSummary}</h3>` : ""}
      ${isChefView && order.status==="جاهز" ? `<button class="btn btn-main" style="margin-top:12px" onclick="receiveOrder('${order.id}')">تم الاستلام</button>` : ""}
      ${!isChefView ? `
        ${order.status !== "جاهز" && order.status !== "تم الاستلام" && order.status !== "مؤرشف" ? `<div class="panel" style="margin-top:14px;background:rgba(234,246,238,.55)"><h3>اعتماد المصروف الفعلي</h3>${(order.items||[]).map((item,i)=>`<label>${item.name} — مطلوب: ${item.qty} ${item.unit||""}</label><input id="issued_${order.id}_${i}" type="number" min="0" step="any" value="${item.issuedQty ?? item.qty ?? 0}" placeholder="الكمية المصروفة فعلياً">`).join("")}<button class="btn btn-main" onclick="approveWarehouseIssue('${order.id}')">اعتماد الصرف</button></div>` : ""}
        <div style="margin-top:12px;display:grid;gap:8px">
          ${order.status !== "جاهز" && order.status !== "تم الاستلام" && order.status !== "مؤرشف" ? `<button class="btn btn-light" onclick="updateOrderStatus('${order.id}','قيد التجهيز')">قيد التجهيز</button><button class="btn btn-light" onclick="updateOrderStatus('${order.id}','متأخر')">متأخر</button>` : ""}
          <button class="btn btn-light" onclick="printWarehouseOrder('${order.id}')">🖨 طباعة الطلب</button>
          ${order.status !== "مؤرشف" ? `<button class="btn btn-light" onclick="archiveWarehouseOrder('${order.id}')">📁 أرشفة</button>` : ""}
        </div>` : ""}
    </div>`;
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
  alert("تم اعتماد الصرف الفعلي");
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
    alert("لا يمكن أرشفة الطلب قبل أن يستلمه الشيف");
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
  alert("تمت أرشفة الطلب");
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

  alert("تم حفظ الصرف الداخلي");
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
  const tasks=cleaningTasks.filter(t=>t[shift]);
  pageLayout(lang==="bn"?`${shiftLabels[shift].bn} - পরিষ্কার`:`${shiftLabels[shift].ar} - النظافة`, `
    <div class="panel">
      ${tasks.length ? tasks.map(t=>`
        <label style="display:flex;align-items:center;gap:10px;margin:14px 0;font-weight:900">
          <input type="checkbox" class="cleanTaskCheck" value="${t.id}">
          ${lang==="bn"?translateCleaning(t.nameAr):t.nameAr}
        </label>
      `).join("") : `<div class="placeholder">${lang==="bn"?"কোনো কাজ নেই":"لا توجد مهام لهذه الوردية"}</div>`}

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

  alert("تم حفظ النظافة");
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
              <label style="display:block;margin:14px 0;font-weight:900">
                <input type="checkbox" ${operationRunDraft[t.id] ? "checked" : ""} onchange="markOperationDraft('${t.id}',this.checked)">
                ${t.name}
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
    alert("اكتب اسم مسؤول التشغيل أولاً");
    return;
  }

  const selectedIds=Object.keys(operationRunDraft).filter(id=>operationRunDraft[id]);
  if(!selectedIds.length){
    alert("حدد مهام التشغيل أولاً");
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

  alert("تم رفع التشغيل للإدارة");
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
    alert("كلمة المرور غير صحيحة");
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
  const alerts=warehouseOrders.map(getAlert).filter(a=>a.text&&!hidden.includes(a.key));

  box.innerHTML=alerts.length ? alerts.map(a=>`
    <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:18px;padding:14px;margin-bottom:10px">
      <div onclick="renderOrderDetails('${a.orderId}')" style="cursor:pointer">
        <b>${a.text}</b>
        <div style="color:#7b8674;font-weight:700;margin-top:4px">${a.sub}</div>
      </div>
      <button class="btn btn-light" onclick="dismissAlert('${a.key}')">×</button>
    </div>
  `).join("") : `<div class="placeholder">لا توجد تنبيهات</div>`;
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

  const logs=[...productionLogs].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0));

  box.innerHTML=logs.map(log=>`
    <div class="panel" style="margin-bottom:14px">
      <h3>${log.section} - ${log.chefName}</h3>
      <p style="color:#7b8674;font-weight:800;margin-top:6px">${log.createdAtText||""}</p>

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
  `).join("");
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

  const logs=[...wasteLogs].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0));

  box.innerHTML=logs.map(log=>`
    <div class="panel" style="margin-bottom:14px">
      <h3>${log.section} - ${log.chefName}</h3>
      <p style="color:#7b8674;font-weight:800;margin-top:6px">${log.createdAtText||""}</p>
      <div style="margin-top:12px;border-bottom:1px solid #e5eadb;padding-bottom:8px">
        <b>${log.productName}</b>
        <div style="margin-top:6px">الكمية: <b>${log.qty}</b></div>
      </div>
      <p style="margin-top:12px;color:#7b8674"><b>السبب:</b> ${log.reason||""}</p>
    </div>
  `).join("");
}

function renderAdminWarehouse(){
  pageLayout("إدارة المستودع", `
    <section class="grid">
      <div class="card" onclick="renderAdminWarehouseArchive()"><div class="icon"><i class="fa-solid fa-folder-open"></i></div><div class="card-title">أرشيف المستودع</div></div>
      <div class="card" onclick="renderAdminInternalIssue()"><div class="icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div><div class="card-title">الصرف الداخلي</div></div>
    </section>
  `,"renderAdmin()");
}

function renderAdminWarehouseArchive(){
  pageLayout("أرشيف المستودع", `<div id="warehouseArchiveBox"></div>`,"renderAdminWarehouse()");
  drawWarehouseArchive();
}

function drawWarehouseArchive(){
  const box=document.getElementById("warehouseArchiveBox");
  if(!box) return;

  const archived = warehouseOrders.filter(o=>o.status==="مؤرشف");

  if(!archived.length){
    box.innerHTML=`<div class="panel placeholder">لا يوجد طلبات مؤرشفة</div>`;
    return;
  }

  box.innerHTML = archived
    .sort((a,b)=>(b.archivedAtMs||0)-(a.archivedAtMs||0))
    .map(order=>`
      <div class="panel" style="margin-bottom:14px">
        <h3>طلب مؤرشف - ${order.section}</h3>
        <p style="color:#7b8674;font-weight:800">الشيف: ${order.chefName}</p>
        <p style="color:#7b8674;font-weight:800">رقم الطلب: ${order.orderId||order.id}</p>
        <p style="color:#7b8674;font-weight:800">وقت الأرشفة: ${order.archivedAtText||""}</p>

        <div style="margin-top:12px">
          ${(order.items||[]).map((item,i)=>`
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
              <span>${i+1}- ${item.name}</span>
              <b>${item.issuedQty !== undefined ? `مطلوب: ${item.qty} / مصروف: ${item.issuedQty}` : `${item.qty} ${item.unit||""}`}</b>
            </div>
          `).join("")}
        </div>

        ${order.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${order.note}</p>` : ""}
      </div>
    `).join("");
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

  const logs=[...internalIssues].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0));

  box.innerHTML=logs.map(log=>`
    <div class="panel" style="margin-bottom:14px">
      <h3>${log.destination}</h3>
      <p style="color:#7b8674;font-weight:800;margin-top:6px">صرف بواسطة: ${log.staff || ""}</p>
      <p style="color:#7b8674;font-weight:800">${log.createdAtText || ""}</p>

      <div style="margin-top:12px">
        ${(log.items||[]).map(i=>`
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
            <span>${i.name}</span>
            <b>${i.qty} ${i.unit||""}</b>
          </div>
        `).join("")}
      </div>

      ${log.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${log.note}</p>` : ""}
    </div>
  `).join("");
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

  const shifts=["morning","afternoon","night"];

  box.innerHTML=shifts.map(shift=>{
    const log=getLatestCleaningLog(shift);

    if(!log){
      return `<div class="panel" style="margin-bottom:12px"><h3>${shiftLabels[shift].ar}</h3><p style="font-weight:900;color:#b91c1c;margin-top:8px">لم يبدأ</p></div>`;
    }

    const total=log.entries?log.entries.length:0;
    const done=log.entries?log.entries.filter(e=>e.done).length:0;
    const status=total>0&&done===total?"مكتمل":"ناقص";

    return `
      <div class="panel" style="margin-bottom:12px">
        <h3>${shiftLabels[shift].ar}</h3>
        <p style="font-weight:900;margin-top:8px">${status}</p>
        <p style="color:#7b8674;font-weight:800">${log.createdAtText||""}</p>
        <div style="margin-top:12px">
          ${(log.entries||[]).map(e=>`
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
              <span>${e.nameAr}</span>
              <b>${e.done?"تم":"لم يتم"}</b>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderAdminOperations(){
  pageLayout("تقرير التشغيل", `<div id="operationAdminBox"></div>`,"renderAdmin()");
  drawOperationAdmin();
}

function drawOperationAdmin(){
  const box=document.getElementById("operationAdminBox");
  if(!box) return;

  if(!operationTasks.length){
    box.innerHTML=`<div class="panel placeholder">لا توجد مهام تشغيل</div>`;
    return;
  }

  const periods=getOperationPeriods();

  box.innerHTML=periods.map(period=>{
    const tasks=operationTasks.filter(t=>t.period===period);
    const rows=tasks.map(task=>{
      const latest=getLatestOperationLog(task.id);
      return {task,latest,done:latest&&latest.done};
    });

    const total=rows.length;
    const doneCount=rows.filter(r=>r.done).length;
    const status=total>0&&total===doneCount?"مكتمل":"ناقص";

    return `
      <div class="panel" style="margin-bottom:14px">
        <h3>${period}</h3>
        <p style="font-weight:900;margin-top:8px">${status}</p>

        <div style="margin-top:12px">
          ${rows.map(r=>`
            <div style="border-bottom:1px solid #e5eadb;padding:10px 0">
              <div style="display:flex;justify-content:space-between;gap:10px">
                <span>${r.task.name}</span>
                <b>${r.done?"تم":"لم يتم"}</b>
              </div>
              ${r.latest&&r.latest.done ? `
                <div style="color:#7b8674;font-weight:800;margin-top:4px">${r.latest.completedAtText||""} - ${r.latest.operatorName||""}</div>
                ${r.latest.note ? `<div style="color:#7b8674;margin-top:6px">📝 ${r.latest.note}</div>` : ""}
              ` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}


/* PDF / Print Reports */

function renderAdminPDF(){
  pageLayout("تصدير PDF", `
    <section class="grid">
      <div class="card" onclick="printReport('production')"><div class="icon"><i class="fa-solid fa-chart-line"></i></div><div class="card-title">تقرير الإنتاج</div></div>
      <div class="card" onclick="printReport('waste')"><div class="icon"><i class="fa-solid fa-trash-can"></i></div><div class="card-title">تقرير التالف والهدر</div></div>
      <div class="card" onclick="printReport('operations')"><div class="icon"><i class="fa-solid fa-industry"></i></div><div class="card-title">تقرير التشغيل</div></div>
      <div class="card" onclick="printReport('internal')"><div class="icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div><div class="card-title">تقرير الصرف الداخلي</div></div>
      <div class="card" onclick="printReport('summary')"><div class="icon"><i class="fa-solid fa-file-pdf"></i></div><div class="card-title">تقرير شامل</div></div>
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
    alert("المتصفح منع فتح نافذة الطباعة");
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

function buildProductionReport(){
  if(!productionLogs.length) return `<div class="card">لا يوجد إنتاج</div>`;
  return [...productionLogs].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0)).map(log=>`
    <div class="card">
      <h3>${escapeHtml(log.section)} - ${escapeHtml(log.chefName)}</h3>
      <div class="meta">${escapeHtml(log.createdAtText||"")}</div>
      ${itemsTable(log.items, false)}
      ${log.note ? `<div class="note"><b>ملاحظة:</b> ${escapeHtml(log.note)}</div>` : ""}
    </div>
  `).join("");
}

function buildWasteReport(){
  if(!wasteLogs.length) return `<div class="card">لا يوجد تالف أو هدر</div>`;
  return [...wasteLogs].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0)).map(log=>`
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

function buildOperationsReport(){
  if(!operationLogs.length) return `<div class="card">لا يوجد تشغيل</div>`;
  return [...operationLogs].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0)).map(log=>`
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

function buildInternalReport(){
  if(!internalIssues.length) return `<div class="card">لا يوجد صرف داخلي</div>`;
  return [...internalIssues].sort((a,b)=>(b.timeMs||0)-(a.timeMs||0)).map(log=>`
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
