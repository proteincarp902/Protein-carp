/* Protein & Carb Operations - Cloud UI + Cleaning V1 */

const app = document.getElementById("app");

let chefSections = [];
let chefs = [];
let warehouseItems = [];
let warehouseOrders = [];
let dismissedAlerts = [];
let cleaningTasks = [];
let cleaningLogs = [];

let systemSettings = {
  adminPassword: "0000",
  warehousePassword: "1111",
  orderCounter: 1001
};

let currentChef = null;
let currentCart = [];
let currentBackFn = "renderHome()";
let isPhoneBack = false;

const shiftLabels = {
  morning:{ ar:"صباح", bn:"সকাল", icon:"🌅" },
  afternoon:{ ar:"ظهر", bn:"দুপুর", icon:"☀️" },
  night:{ ar:"ليل", bn:"রাত", icon:"🌙" }
};

const cleaningBn = {
  "دورات المياه":"টয়লেট পরিষ্কার",
  "تنظيف الأرضية":"মেঝে পরিষ্কার",
  "تنظيف الأرضيات":"মেঝে পরিষ্কার",
  "تنظيف الطاولات":"টেবিল পরিষ্কার",
  "تنظيف الثلاجات":"ফ্রিজ পরিষ্কার",
  "تنظيف المغاسل":"বেসিন পরিষ্কার",
  "منطقة التحضير":"প্রস্তুতি এলাকা পরিষ্কার",
  "سلات النفايات":"ডাস্টবিন পরিষ্কার",
  "تنظيف الجدران":"দেয়াল পরিষ্কার",
  "تنظيف الأبواب":"দরজা পরিষ্কার",
  "تنظيف الرفوف":"তাক পরিষ্কার"
};

function smartBack(){
  const fn = currentBackFn || "renderHome()";
  try{ new Function(fn)(); }catch(e){ renderHome(); }
}

window.addEventListener("popstate", function(){
  isPhoneBack = true;
  smartBack();
  setTimeout(()=>{ isPhoneBack = false; }, 50);
});

function todayDate(){
  return new Date().toLocaleDateString("ar-SA", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });
}

function waitForFirebase(){
  return new Promise(resolve => {
    const timer = setInterval(() => {
      if(window.firebaseDB){
        clearInterval(timer);
        resolve(window.firebaseDB);
      }
    }, 100);
  });
}

function pageLayout(title, content, backFn = "renderHome()"){
  currentBackFn = backFn;

  if(!isPhoneBack){
    history.pushState({ page:title }, "");
  }

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

  app.innerHTML = `
    <main class="app">
      <div class="topbar">
        <button class="btn btn-light" onclick="renderSettingsGate()">الإعدادات</button>
        <button class="btn btn-main" onclick="renderAdminGate()">الإدارة</button>
      </div>

      <section class="hero">
        <img src="assets/logo.png" class="logo" alt="Protein & Carb">
        <h1 class="hero-title">Protein & Carb Operations</h1>
        <p class="hero-date">${todayDate()}</p>
      </section>

      <section class="grid">
        <div class="card" onclick="renderOperations()"><div class="icon">🏭</div><div class="card-title">متابعة التشغيل</div></div>
        <div class="card" onclick="renderCleaning()"><div class="icon">🧹</div><div class="card-title">النظافة</div></div>
        <div class="card" onclick="renderChefs()"><div class="icon">👨‍🍳</div><div class="card-title">الشيفات</div></div>
        <div class="card" onclick="renderWarehouseGate()"><div class="icon">📦</div><div class="card-title">المستودع</div></div>
      </section>
    </main>
  `;
}

function renderEmpty(title){
  pageLayout(title, `<div class="panel placeholder">${title}</div>`);
}

/* Firebase */

async function initCloud(){
  const { db, doc, getDoc, setDoc, collection, onSnapshot } = await waitForFirebase();

  const settingsRef = doc(db, "settings", "system");
  const snap = await getDoc(settingsRef);

  if(!snap.exists()){
    await setDoc(settingsRef, systemSettings);
  }

  onSnapshot(settingsRef, s => {
    if(s.exists()) systemSettings = { ...systemSettings, ...s.data() };
  });

  onSnapshot(collection(db, "chef_sections"), snap => {
    chefSections = [];
    snap.forEach(d => chefSections.push({ id:d.id, ...d.data() }));
    refreshViews();
  });

  onSnapshot(collection(db, "chefs"), snap => {
    chefs = [];
    snap.forEach(d => chefs.push({ id:d.id, ...d.data() }));
    refreshViews();
  });

  onSnapshot(collection(db, "warehouse_items"), snap => {
    warehouseItems = [];
    snap.forEach(d => warehouseItems.push({ id:d.id, ...d.data() }));
    refreshViews();
  });

  onSnapshot(collection(db, "warehouse_orders"), snap => {
    warehouseOrders = [];
    snap.forEach(d => warehouseOrders.push({ id:d.id, ...d.data() }));
    refreshViews();
  });

  onSnapshot(collection(db, "dismissed_alerts"), snap => {
    dismissedAlerts = [];
    snap.forEach(d => dismissedAlerts.push({ id:d.id, ...d.data() }));
    refreshViews();
  });

  onSnapshot(collection(db, "cleaning_tasks"), snap => {
    cleaningTasks = [];
    snap.forEach(d => cleaningTasks.push({ id:d.id, ...d.data() }));
    refreshViews();
  });

  onSnapshot(collection(db, "cleaning_logs"), snap => {
    cleaningLogs = [];
    snap.forEach(d => cleaningLogs.push({ id:d.id, ...d.data() }));
    refreshViews();
  });
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
  const pass = document.getElementById("settingsPasswordInput").value.trim();
  if(pass !== String(systemSettings.adminPassword)){
    alert("كلمة المرور غير صحيحة");
    return;
  }
  renderSettings();
}

function renderSettings(){
  pageLayout("الإعدادات", `
    <section class="grid">
      <div class="card" onclick="renderSettingsSections()"><div class="icon">👨‍🍳</div><div class="card-title">أقسام الشيفات</div></div>
      <div class="card" onclick="renderSettingsChefs()"><div class="icon">🧑‍🍳</div><div class="card-title">إدارة الشيفات</div></div>
      <div class="card" onclick="renderSettingsWarehouseItems()"><div class="icon">📦</div><div class="card-title">أصناف المستودع</div></div>
      <div class="card" onclick="renderSettingsCleaning()"><div class="icon">🧹</div><div class="card-title">عناصر النظافة</div></div>
      <div class="card" onclick="renderSettingsOperations()"><div class="icon">🏭</div><div class="card-title">مهام التشغيل</div></div>
      <div class="card" onclick="renderSettingsPasswords()"><div class="icon">🔐</div><div class="card-title">كلمات المرور</div></div>
    </section>
  `, "renderHome()");
}

/* Settings Sections */

function renderSettingsSections(){
  pageLayout("أقسام الشيفات", `
    <div class="panel">
      <h3 style="margin-bottom:15px">إضافة قسم</h3>
      <label style="font-weight:800">اسم القسم</label>
      <input id="sectionName" placeholder="مثال: الحلويات">
      <label style="font-weight:800">الأيقونة</label>
      <input id="sectionIcon" placeholder="مثال: 🍰">
      <button class="btn btn-main" onclick="addSection()">➕ إضافة قسم</button>
    </div>
    <div id="sectionsContainer" class="grid" style="margin-top:16px"></div>
  `, "renderSettings()");
  drawSections();
}

async function addSection(){
  const name = document.getElementById("sectionName").value.trim();
  const icon = document.getElementById("sectionIcon").value.trim();
  if(!name) return;

  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;
  await addDoc(collection(db, "chef_sections"), {
    name,
    icon: icon || "🍽️",
    createdAt: serverTimestamp()
  });

  document.getElementById("sectionName").value = "";
  document.getElementById("sectionIcon").value = "";
}

function drawSections(){
  const box = document.getElementById("sectionsContainer");
  if(!box) return;

  box.innerHTML = chefSections.length
    ? chefSections.map(section => `
      <div class="card">
        <div class="icon">${section.icon || "🍽️"}</div>
        <div class="card-title">${section.name}</div>
        <button class="btn btn-light" style="margin-top:12px" onclick="deleteSection('${section.id}')">🗑 حذف</button>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

async function deleteSection(id){
  const { db, doc, deleteDoc } = window.firebaseDB;
  await deleteDoc(doc(db, "chef_sections", id));
}

/* Settings Chefs */

function renderSettingsChefs(){
  pageLayout("إدارة الشيفات", `
    <div class="panel">
      <h3 style="margin-bottom:15px">إضافة شيف</h3>
      <label style="font-weight:800">اسم الشيف</label>
      <input id="chefName" placeholder="مثال: أحمد">
      <label style="font-weight:800">كود الشيف</label>
      <input id="chefCode" type="number" placeholder="مثال: 1001">
      <label style="font-weight:800">القسم</label>
      <select id="chefSection"></select>
      <button class="btn btn-main" onclick="addChef()">➕ إضافة شيف</button>
    </div>
    <div id="chefsContainer" class="grid" style="margin-top:16px"></div>
  `, "renderSettings()");

  drawChefSectionOptions();
  drawChefs();
}

function drawChefSectionOptions(){
  const select = document.getElementById("chefSection");
  if(!select) return;

  select.innerHTML = chefSections.length
    ? chefSections.map(s => `<option value="${s.name}">${s.name}</option>`).join("")
    : `<option value="">لا توجد أقسام</option>`;
}

async function addChef(){
  const name = document.getElementById("chefName").value.trim();
  const code = document.getElementById("chefCode").value.trim();
  const section = document.getElementById("chefSection").value;

  if(!name || !code || !section) return;

  if(chefs.some(c => c.code === code)){
    alert("الكود مستخدم");
    return;
  }

  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;

  await addDoc(collection(db, "chefs"), {
    name,
    code,
    section,
    createdAt: serverTimestamp()
  });

  document.getElementById("chefName").value = "";
  document.getElementById("chefCode").value = "";
}

function drawChefs(){
  const box = document.getElementById("chefsContainer");
  if(!box) return;

  box.innerHTML = chefs.length
    ? chefs.map(chef => `
      <div class="card">
        <div class="icon">👨‍🍳</div>
        <div class="card-title">${chef.name}</div>
        <div style="margin-top:8px;color:#7b8674;font-weight:700">${chef.section} - ${chef.code}</div>
        <button class="btn btn-light" style="margin-top:12px" onclick="deleteChef('${chef.id}')">🗑 حذف</button>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا يوجد شيفات</div>`;
}

async function deleteChef(id){
  const { db, doc, deleteDoc } = window.firebaseDB;
  await deleteDoc(doc(db, "chefs", id));
}

/* Settings Warehouse Items */

function renderSettingsWarehouseItems(){
  pageLayout("أصناف المستودع", `
    <div class="panel">
      <h3 style="margin-bottom:15px">إضافة صنف</h3>
      <label style="font-weight:800">اسم الصنف</label>
      <input id="warehouseItemName" placeholder="مثال: صدر دجاج">
      <label style="font-weight:800">كود الصنف</label>
      <input id="warehouseItemCode" placeholder="مثال: CH001">
      <label style="font-weight:800">الوحدة</label>
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
  `, "renderSettings()");
  drawWarehouseItems();
}

async function addWarehouseItem(){
  const name = document.getElementById("warehouseItemName").value.trim();
  const code = document.getElementById("warehouseItemCode").value.trim();
  const unit = document.getElementById("warehouseItemUnit").value;

  if(!name || !code) return;

  if(warehouseItems.some(i => i.code === code)){
    alert("كود الصنف مستخدم");
    return;
  }

  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;

  await addDoc(collection(db, "warehouse_items"), {
    name,
    code,
    unit,
    createdAt: serverTimestamp()
  });

  document.getElementById("warehouseItemName").value = "";
  document.getElementById("warehouseItemCode").value = "";
}

function drawWarehouseItems(){
  const box = document.getElementById("warehouseItemsContainer");
  if(!box) return;

  const search = (document.getElementById("warehouseSearch")?.value || "").trim().toLowerCase();

  const list = warehouseItems.filter(item =>
    item.name.toLowerCase().includes(search) ||
    item.code.toLowerCase().includes(search)
  );

  if(list.length === 0){
    box.innerHTML = `<div class="placeholder">لا توجد أصناف</div>`;
    return;
  }

  box.innerHTML = `
    <div style="display:grid;gap:8px">
      ${list.map(item => `
        <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:16px;padding:12px;">
          <b>${item.name}</b>
          <span>${item.code}</span>
          <span>${item.unit || ""}</span>
          <button class="btn btn-light" onclick="deleteWarehouseItem('${item.id}')">🗑</button>
        </div>
      `).join("")}
    </div>
  `;
}

async function deleteWarehouseItem(id){
  const { db, doc, deleteDoc } = window.firebaseDB;
  await deleteDoc(doc(db, "warehouse_items", id));
}

/* Settings Cleaning */

function renderSettingsCleaning(){
  pageLayout("عناصر النظافة", `
    <div class="panel">
      <h3 style="margin-bottom:15px">إضافة مهمة نظافة</h3>

      <label style="font-weight:800">اسم المهمة بالعربي</label>
      <input id="cleaningTaskName" placeholder="مثال: دورات المياه">

      <label style="font-weight:800">الورديات</label>

      <label><input id="cleanMorning" type="checkbox" checked> 🌅 صباح</label>
      <label><input id="cleanAfternoon" type="checkbox" checked> ☀️ ظهر</label>
      <label><input id="cleanNight" type="checkbox" checked> 🌙 ليل</label>

      <button class="btn btn-main" onclick="addCleaningTask()">➕ إضافة مهمة</button>
    </div>

    <div id="cleaningTasksContainer" style="margin-top:16px"></div>
  `, "renderSettings()");

  drawCleaningTasks();
}

async function addCleaningTask(){
  const nameAr = document.getElementById("cleaningTaskName").value.trim();

  const morning = document.getElementById("cleanMorning").checked;
  const afternoon = document.getElementById("cleanAfternoon").checked;
  const night = document.getElementById("cleanNight").checked;

  if(!nameAr) return;

  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;

  await addDoc(collection(db, "cleaning_tasks"), {
    nameAr,
    morning,
    afternoon,
    night,
    createdAt: serverTimestamp()
  });

  document.getElementById("cleaningTaskName").value = "";
}

function drawCleaningTasks(){
  const box = document.getElementById("cleaningTasksContainer");
  if(!box) return;

  if(cleaningTasks.length === 0){
    box.innerHTML = `<div class="panel placeholder">لا توجد مهام نظافة</div>`;
    return;
  }

  box.innerHTML = cleaningTasks.map(task => `
    <div class="panel" style="margin-bottom:10px">
      <h3>${task.nameAr}</h3>
      <div style="color:#7b8674;font-weight:800;margin-top:8px">
        ${task.morning ? "🌅 صباح " : ""}
        ${task.afternoon ? "☀️ ظهر " : ""}
        ${task.night ? "🌙 ليل" : ""}
      </div>
      <button class="btn btn-light" style="margin-top:12px" onclick="deleteCleaningTask('${task.id}')">🗑 حذف</button>
    </div>
  `).join("");
}

async function deleteCleaningTask(id){
  const { db, doc, deleteDoc } = window.firebaseDB;
  await deleteDoc(doc(db, "cleaning_tasks", id));
}

/* Settings Passwords */

function renderSettingsPasswords(){
  pageLayout("كلمات المرور", `
    <div class="panel">
      <label style="font-weight:800">كلمة مرور الإدارة</label>
      <input id="adminPasswordInput" type="password" placeholder="كلمة مرور الإدارة">
      <label style="font-weight:800">كلمة مرور المستودع</label>
      <input id="warehousePasswordInput" type="password" placeholder="كلمة مرور المستودع">
      <button class="btn btn-main" onclick="savePasswords()">💾 حفظ كلمات المرور</button>
    </div>
  `, "renderSettings()");
}

async function savePasswords(){
  const adminPassword = document.getElementById("adminPasswordInput").value.trim();
  const warehousePassword = document.getElementById("warehousePasswordInput").value.trim();

  const { db, doc, setDoc } = window.firebaseDB;

  await setDoc(doc(db, "settings", "system"), {
    adminPassword: adminPassword || systemSettings.adminPassword,
    warehousePassword: warehousePassword || systemSettings.warehousePassword,
    orderCounter: systemSettings.orderCounter || 1001
  }, { merge:true });

  alert("تم حفظ كلمات المرور");
}

function renderSettingsOperations(){
  pageLayout("مهام التشغيل", `<div class="panel placeholder">جاهز للمرحلة التالية</div>`, "renderSettings()");
}

/* Chefs */

function renderChefs(){
  pageLayout("الشيفات", `<div id="chefSectionsView" class="grid"></div>`, "renderHome()");
  drawChefSectionsView();
}

function drawChefSectionsView(){
  const box = document.getElementById("chefSectionsView");
  if(!box) return;

  box.innerHTML = chefSections.length
    ? chefSections.map(section => `
      <div class="card" onclick="renderChefCode('${section.name}')">
        <div class="icon">${section.icon || "🍽️"}</div>
        <div class="card-title">${section.name}</div>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

function renderChefCode(sectionName){
  pageLayout(sectionName, `
    <div class="panel">
      <input id="chefCode" type="number" placeholder="كود الشيف">
      <button class="btn btn-main" onclick="checkChefCode('${sectionName}')">دخول</button>
    </div>
    <div id="chefMessage" class="panel placeholder" style="margin-top:16px;display:none"></div>
  `, "renderChefs()");
}

function checkChefCode(sectionName){
  const code = document.getElementById("chefCode").value.trim();
  const chef = chefs.find(c => c.code === code && c.section === sectionName);
  const message = document.getElementById("chefMessage");

  if(!chef){
    message.style.display = "block";
    message.textContent = "الكود غير صحيح";
    return;
  }

  currentChef = chef;
  renderChefDashboard(chef);
}

function renderChefDashboard(chef){
  pageLayout(chef.name, `
    <div class="panel" style="margin-bottom:16px;text-align:center">
      <div style="font-size:48px">👨‍🍳</div>
      <h2>${chef.name}</h2>
      <div style="color:#7b8674;font-weight:700">${chef.section}</div>
    </div>

    <section class="grid">
      <div class="card" onclick="renderEmpty('الإنتاج')"><div class="icon">📈</div><div class="card-title">الإنتاج</div></div>
      <div class="card" onclick="renderWarehouseRequest()"><div class="icon">📦</div><div class="card-title">طلب مستودع</div></div>
      <div class="card" onclick="renderMyOrders()"><div class="icon">📋</div><div class="card-title">طلباتي</div></div>
    </section>
  `, "renderChefs()");
}

/* Warehouse Request */

function renderWarehouseRequest(){
  if(!currentChef) return renderChefs();
  currentCart = [];

  pageLayout("طلب مستودع", `
    <div class="panel">
      <input id="requestSearch" placeholder="🔍 بحث باسم الصنف أو الكود" oninput="drawRequestSearch()">
      <div id="requestResults"></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3 style="margin-bottom:12px">السلة</h3>
      <div id="cartBox" class="placeholder">السلة فارغة</div>
      <textarea id="requestNote" placeholder="ملاحظة" style="margin-top:12px"></textarea>
      <button class="btn btn-main" onclick="sendWarehouseOrder()">إرسال الطلب</button>
    </div>
  `, "renderChefDashboard(currentChef)");

  drawRequestSearch();
}

function drawRequestSearch(){
  const box = document.getElementById("requestResults");
  const search = (document.getElementById("requestSearch")?.value || "").trim().toLowerCase();

  const list = warehouseItems.filter(item =>
    search &&
    (item.name.toLowerCase().includes(search) || item.code.toLowerCase().includes(search))
  ).slice(0, 20);

  if(!search){
    box.innerHTML = `<div class="placeholder">اكتب اسم الصنف أو الكود</div>`;
    return;
  }

  if(list.length === 0){
    box.innerHTML = `<div class="placeholder">لا توجد نتائج</div>`;
    return;
  }

  box.innerHTML = `
    <div style="display:grid;gap:8px">
      ${list.map(item => `
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:16px;padding:12px;">
          <div>
            <b>${item.name}</b>
            <div style="color:#7b8674;font-weight:700">${item.code} - ${item.unit || ""}</div>
          </div>
          <input id="qty_${item.id}" type="number" min="1" placeholder="كمية" style="margin:0">
          <button class="btn btn-main" onclick="addToCart('${item.id}')">إضافة</button>
        </div>
      `).join("")}
    </div>
  `;
}

function addToCart(itemId){
  const item = warehouseItems.find(i => i.id === itemId);
  const qty = Number(document.getElementById(`qty_${itemId}`).value);

  if(!item || qty <= 0) return;

  const existing = currentCart.find(i => i.itemId === itemId);

  if(existing){
    existing.qty += qty;
  }else{
    currentCart.push({
      itemId:item.id,
      name:item.name,
      code:item.code,
      unit:item.unit,
      qty
    });
  }

  drawCart();
}

function drawCart(){
  const box = document.getElementById("cartBox");

  if(currentCart.length === 0){
    box.innerHTML = "السلة فارغة";
    return;
  }

  box.innerHTML = currentCart.map((item, index) => `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5eadb;padding:8px 0;gap:10px;">
      <span>${item.name}</span>
      <b>${item.qty} ${item.unit || ""}</b>
      <button class="btn btn-light" onclick="removeFromCart(${index})">حذف</button>
    </div>
  `).join("");
}

function removeFromCart(index){
  currentCart.splice(index, 1);
  drawCart();
}

async function getNextOrderId(){
  const { db, doc, getDoc, setDoc } = window.firebaseDB;
  const ref = doc(db, "settings", "system");
  const snap = await getDoc(ref);

  const current = snap.exists() && snap.data().orderCounter
    ? snap.data().orderCounter
    : 1001;

  await setDoc(ref, { orderCounter: current + 1 }, { merge:true });

  return `ORD-${current}`;
}

async function sendWarehouseOrder(){
  if(currentCart.length === 0 || !currentChef) return;

  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;
  const orderId = await getNextOrderId();

  await addDoc(collection(db, "warehouse_orders"), {
    orderId,
    chefName:currentChef.name,
    chefCode:currentChef.code,
    section:currentChef.section,
    items:[...currentCart],
    note:document.getElementById("requestNote").value.trim(),
    status:"جديد",
    createdAtText:new Date().toLocaleString("ar-SA"),
    createdAt:serverTimestamp()
  });

  currentCart = [];
  renderMyOrders();
}

function renderMyOrders(){
  if(!currentChef) return renderChefs();

  const myOrders = warehouseOrders.filter(o => o.chefCode === currentChef.code);

  pageLayout("طلباتي", `
    <div class="grid">
      ${
        myOrders.length === 0
        ? `<div class="panel placeholder">لا توجد طلبات</div>`
        : myOrders.map(o => renderOrderCard(o, true)).join("")
      }
    </div>
  `, "renderChefDashboard(currentChef)");
}

/* Warehouse */

function renderWarehouseGate(){
  pageLayout("دخول المستودع", `
    <div class="panel">
      <input id="warehousePasswordInputGate" type="password" placeholder="كلمة مرور المستودع">
      <button class="btn btn-main" onclick="checkWarehousePassword()">دخول</button>
    </div>
  `, "renderHome()");
}

function checkWarehousePassword(){
  const pass = document.getElementById("warehousePasswordInputGate").value.trim();

  if(pass !== String(systemSettings.warehousePassword)){
    alert("كلمة المرور غير صحيحة");
    return;
  }

  renderWarehouse();
}

function renderWarehouse(){
  pageLayout("المستودع", `<div id="warehouseOrdersBox" class="grid"></div>`, "renderHome()");
  drawWarehouseOrders();
}

function drawWarehouseOrders(){
  const box = document.getElementById("warehouseOrdersBox");
  if(!box) return;

  box.innerHTML = warehouseOrders.length
    ? warehouseOrders.map(o => renderOrderCard(o, false)).join("")
    : `<div class="panel placeholder">لا توجد طلبات</div>`;
}

function renderOrderCard(order, isChefView){
  return `
    <div class="panel">
      <h2>📦 طلبية من قسم ${order.section}</h2>

      <p style="font-weight:800;margin-top:8px">
        👨‍🍳 الشيف: ${order.chefName}
      </p>

      <p style="color:#7b8674;margin-top:4px">
        🆔 ${order.orderId || order.id}
      </p>

      <p style="color:#7b8674;margin-top:4px">
        🕒 ${order.createdAtText || ""}
      </p>

      <div style="margin-top:12px">
        ${(order.items || []).map((item, i) => `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0;">
            <span>${i + 1}- ${item.name}</span>
            <b>${item.qty} ${item.unit || ""}</b>
          </div>
        `).join("")}
      </div>

      ${order.note ? `<p style="margin-top:12px;color:#7b8674">ملاحظة: ${order.note}</p>` : ""}

      <h3 style="margin-top:12px">الحالة: ${order.status}</h3>

      ${
        isChefView && order.status === "جاهز"
        ? `<button class="btn btn-main" style="margin-top:12px" onclick="receiveOrder('${order.id}')">تم الاستلام</button>`
        : ""
      }

      ${
        !isChefView
        ? `
          <div style="margin-top:12px;display:grid;gap:8px">
            <button class="btn btn-light" onclick="updateOrderStatus('${order.id}', 'قيد التجهيز')">قيد التجهيز</button>
            <button class="btn btn-main" onclick="updateOrderStatus('${order.id}', 'جاهز')">جاهز</button>
            <button class="btn btn-light" onclick="updateOrderStatus('${order.id}', 'متأخر')">متأخر</button>
          </div>
        `
        : ""
      }
    </div>
  `;
}

async function updateOrderStatus(id, status){
  const { db, doc, updateDoc } = window.firebaseDB;
  await updateDoc(doc(db, "warehouse_orders", id), { status });
}

async function receiveOrder(id){
  const { db, doc, updateDoc } = window.firebaseDB;
  await updateDoc(doc(db, "warehouse_orders", id), { status:"تم الاستلام" });
  renderMyOrders();
}

/* Cleaning */

function renderCleaning(){
  pageLayout("النظافة", `
    <section class="grid">
      <div class="card" onclick="renderCleaningLang('ar')"><div class="icon">🇸🇦</div><div class="card-title">العربية</div></div>
      <div class="card" onclick="renderCleaningLang('bn')"><div class="icon">🇧🇩</div><div class="card-title">বাংলা</div></div>
    </section>
  `, "renderHome()");
}

function renderCleaningLang(lang){
  const arTitle = lang === "bn" ? "পরিষ্কার" : "النظافة";

  pageLayout(arTitle, `
    <section class="grid">
      <div class="card" onclick="renderCleaningShift('${lang}','morning')">
        <div class="icon">🌅</div>
        <div class="card-title">${lang === "bn" ? shiftLabels.morning.bn : shiftLabels.morning.ar}</div>
      </div>

      <div class="card" onclick="renderCleaningShift('${lang}','afternoon')">
        <div class="icon">☀️</div>
        <div class="card-title">${lang === "bn" ? shiftLabels.afternoon.bn : shiftLabels.afternoon.ar}</div>
      </div>

      <div class="card" onclick="renderCleaningShift('${lang}','night')">
        <div class="icon">🌙</div>
        <div class="card-title">${lang === "bn" ? shiftLabels.night.bn : shiftLabels.night.ar}</div>
      </div>
    </section>
  `, "renderCleaning()");
}

function renderCleaningShift(lang, shift){
  const title = lang === "bn"
    ? `${shiftLabels[shift].bn} - পরিষ্কার`
    : `${shiftLabels[shift].ar} - النظافة`;

  const tasks = cleaningTasks.filter(task => task[shift]);

  pageLayout(title, `
    <div class="panel">
      ${
        tasks.length === 0
        ? `<div class="placeholder">${lang === "bn" ? "কোনো কাজ নেই" : "لا توجد مهام لهذه الوردية"}</div>`
        : tasks.map(task => `
          <label style="display:flex;align-items:center;gap:10px;margin:14px 0;font-weight:900">
            <input type="checkbox" class="cleanTaskCheck" value="${task.id}">
            ${lang === "bn" ? translateCleaning(task.nameAr) : task.nameAr}
          </label>
        `).join("")
      }

      <button class="btn btn-main" onclick="submitCleaning('${shift}')">
        ${lang === "bn" ? "সম্পন্ন" : "✅ تم التنفيذ"}
      </button>
    </div>
  `, `renderCleaningLang('${lang}')`);
}

function translateCleaning(text){
  return cleaningBn[text] || text;
}

async function submitCleaning(shift){
  const checks = Array.from(document.querySelectorAll(".cleanTaskCheck"));
  const completedIds = checks.filter(c => c.checked).map(c => c.value);

  const tasksForShift = cleaningTasks.filter(task => task[shift]);

  const entries = tasksForShift.map(task => ({
    taskId:task.id,
    nameAr:task.nameAr,
    done:completedIds.includes(task.id)
  }));

  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;

  await addDoc(collection(db, "cleaning_logs"), {
    shift,
    entries,
    createdAtText:new Date().toLocaleString("ar-SA"),
    createdAt:serverTimestamp()
  });

  alert("تم حفظ النظافة");
  renderCleaning();
}

/* Admin */

function renderAdminGate(){
  pageLayout("دخول الإدارة", `
    <div class="panel">
      <input id="adminPasswordInputGate" type="password" placeholder="كلمة مرور الإدارة">
      <button class="btn btn-main" onclick="checkAdminPassword()">دخول</button>
    </div>
  `, "renderHome()");
}

function checkAdminPassword(){
  const pass = document.getElementById("adminPasswordInputGate").value.trim();

  if(pass !== String(systemSettings.adminPassword)){
    alert("كلمة المرور غير صحيحة");
    return;
  }

  renderAdmin();
}

function getAlert(order){
  let text = "";

  if(order.status === "جديد") text = `طلب جديد من ${order.section}`;
  if(order.status === "قيد التجهيز") text = `طلب ${order.section} قيد التجهيز`;
  if(order.status === "جاهز") text = `طلب ${order.section} جاهز للاستلام`;
  if(order.status === "متأخر") text = `طلب ${order.section} متأخر`;
  if(order.status === "تم الاستلام") text = `تم استلام طلب من ${order.section}`;

  return {
    key:`${order.id}-${order.status}`,
    orderId:order.id,
    text,
    sub:`${order.chefName} - ${order.orderId || order.id}`
  };
}

async function dismissAlert(key){
  const { db, addDoc, collection, serverTimestamp } = window.firebaseDB;

  if(dismissedAlerts.some(a => a.key === key)) return;

  await addDoc(collection(db, "dismissed_alerts"), {
    key,
    createdAt:serverTimestamp()
  });
}

function renderAdmin(){
  pageLayout("الإدارة", `
    <div class="panel">
      <h3 style="margin-bottom:15px">🔔 التنبيهات</h3>
      <div id="adminAlertsBox"></div>
    </div>

    <section class="grid" style="margin-top:16px">
      <div class="card" onclick="renderAdminSection('الشيفات')"><div class="icon">👨‍🍳</div><div class="card-title">الشيفات</div></div>
      <div class="card" onclick="renderAdminSection('المستودع')"><div class="icon">📦</div><div class="card-title">المستودع</div></div>
      <div class="card" onclick="renderAdminCleaning()"><div class="icon">🧹</div><div class="card-title">النظافة</div></div>
      <div class="card" onclick="renderAdminSection('التشغيل')"><div class="icon">🏭</div><div class="card-title">التشغيل</div></div>
      <div class="card" onclick="renderAdminSection('الجرد')"><div class="icon">📋</div><div class="card-title">الجرد</div></div>
      <div class="card" onclick="renderAdminSection('PDF')"><div class="icon">📄</div><div class="card-title">PDF</div></div>
    </section>
  `, "renderHome()");

  drawAdminAlerts();
}

function drawAdminAlerts(){
  const box = document.getElementById("adminAlertsBox");
  if(!box) return;

  const hiddenKeys = dismissedAlerts.map(a => a.key);

  const alerts = warehouseOrders
    .map(getAlert)
    .filter(a => a.text && !hiddenKeys.includes(a.key));

  box.innerHTML = alerts.length
    ? alerts.map(alert => `
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:#f9fbf5;border:1px solid #e5eadb;border-radius:18px;padding:14px;margin-bottom:10px;">
        <div onclick="renderOrderDetails('${alert.orderId}')" style="cursor:pointer">
          <b>${alert.text}</b>
          <div style="color:#7b8674;font-weight:700;margin-top:4px">${alert.sub}</div>
        </div>
        <button class="btn btn-light" onclick="dismissAlert('${alert.key}')">×</button>
      </div>
    `).join("")
    : `<div class="placeholder">لا توجد تنبيهات</div>`;
}

function renderOrderDetails(id){
  const order = warehouseOrders.find(o => o.id === id);
  if(!order) return renderAdmin();

  pageLayout(order.orderId || order.id, `${renderOrderCard(order, false)}`, "renderAdmin()");
}

function renderAdminCleaning(){
  pageLayout("تقرير النظافة", `<div id="cleaningAdminBox"></div>`, "renderAdmin()");
  drawCleaningAdmin();
}

function getLatestCleaningLog(shift){
  const logs = cleaningLogs.filter(log => log.shift === shift);
  if(logs.length === 0) return null;
  return logs[logs.length - 1];
}

function drawCleaningAdmin(){
  const box = document.getElementById("cleaningAdminBox");
  if(!box) return;

  const shifts = ["morning","afternoon","night"];

  box.innerHTML = shifts.map(shift => {
    const log = getLatestCleaningLog(shift);

    if(!log){
      return `
        <div class="panel" style="margin-bottom:12px">
          <h3>${shiftLabels[shift].icon} ${shiftLabels[shift].ar}</h3>
          <p style="font-weight:900;color:#b91c1c;margin-top:8px">🔴 لم يبدأ</p>
        </div>
      `;
    }

    const total = log.entries ? log.entries.length : 0;
    const done = log.entries ? log.entries.filter(e => e.done).length : 0;
    const status = total > 0 && done === total ? "🟢 مكتمل" : "🟡 ناقص";

    return `
      <div class="panel" style="margin-bottom:12px">
        <h3>${shiftLabels[shift].icon} ${shiftLabels[shift].ar}</h3>
        <p style="font-weight:900;margin-top:8px">${status}</p>
        <p style="color:#7b8674;font-weight:800">${log.createdAtText || ""}</p>

        <div style="margin-top:12px">
          ${(log.entries || []).map(entry => `
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
              <span>${entry.nameAr}</span>
              <b>${entry.done ? "✅" : "❌"}</b>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderAdminSection(title){
  pageLayout(title, `<div class="panel placeholder">${title}</div>`, "renderAdmin()");
}

/* Operations */

function renderOperations(){ renderEmpty("متابعة التشغيل"); }

/* Start */

initCloud();
renderHome();
