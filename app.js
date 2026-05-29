const app = document.getElementById("app");

let chefSections = [];
let chefs = [];
let warehouseItems = JSON.parse(localStorage.getItem("warehouseItems")) || [];
let warehouseOrders = JSON.parse(localStorage.getItem("warehouseOrders")) || [];
let dismissedAlerts = JSON.parse(localStorage.getItem("dismissedAlerts")) || [];
let orderCounter = Number(localStorage.getItem("orderCounter")) || 1001;

let currentChef = null;
let currentCart = [];

function saveData(){
  localStorage.setItem("warehouseItems", JSON.stringify(warehouseItems));
  localStorage.setItem("warehouseOrders", JSON.stringify(warehouseOrders));
  localStorage.setItem("dismissedAlerts", JSON.stringify(dismissedAlerts));
  localStorage.setItem("orderCounter", String(orderCounter));
}

function todayDate(){
  return new Date().toLocaleDateString("ar-SA", {
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric"
  });
}

function pageLayout(title, content, backFn = "renderHome()"){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>${title}</h2>
        <button class="btn btn-light" onclick="${backFn}">رجوع</button>
      </div>
      ${content}
    </main>
  `;
}

function renderHome(){
  app.innerHTML = `
    <main class="app">
      <div class="topbar">
        <button class="btn btn-light" onclick="renderSettings()">الإعدادات</button>
        <button class="btn btn-main" onclick="renderAdmin()">الإدارة</button>
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
        <div class="card" onclick="renderWarehouse()"><div class="icon">📦</div><div class="card-title">المستودع</div></div>
      </section>
    </main>
  `;
}

function renderEmpty(title){
  pageLayout(title, `<div class="panel placeholder">${title}</div>`);
}

/* Firebase */

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

async function listenChefSections(){
  const { db, collection, onSnapshot } = await waitForFirebase();

  onSnapshot(collection(db, "chef_sections"), snapshot => {
    chefSections = [];

    snapshot.forEach(doc => {
      chefSections.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if(document.getElementById("sectionsContainer")) drawSections();
    if(document.getElementById("chefSection")) drawChefSectionOptions();
    if(document.getElementById("chefSectionsView")) drawChefSectionsView();
  });
}

async function listenChefs(){
  const { db, collection, onSnapshot } = await waitForFirebase();

  onSnapshot(collection(db, "chefs"), snapshot => {
    chefs = [];

    snapshot.forEach(doc => {
      chefs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if(document.getElementById("chefsContainer")) drawChefs();
  });
}

/* الإعدادات */

function renderSettings(){
  pageLayout("الإعدادات", `
    <div class="panel">
      <h3 style="margin-bottom:15px">أقسام الشيفات</h3>
      <input id="sectionName" placeholder="اسم القسم">
      <input id="sectionIcon" placeholder="الأيقونة">
      <button class="btn btn-main" onclick="addSection()">إضافة قسم</button>
    </div>

    <div id="sectionsContainer" class="grid" style="margin-top:16px"></div>

    <div class="panel" style="margin-top:16px">
      <h3 style="margin-bottom:15px">الشيفات</h3>
      <input id="chefName" placeholder="اسم الشيف">
      <input id="chefCode" type="number" placeholder="كود الشيف">
      <select id="chefSection"></select>
      <button class="btn btn-main" onclick="addChef()">إضافة شيف</button>
    </div>

    <div id="chefsContainer" class="grid" style="margin-top:16px"></div>

    <div class="panel" style="margin-top:16px">
      <h3 style="margin-bottom:15px">أصناف المستودع</h3>
      <input id="warehouseItemName" placeholder="اسم الصنف">
      <input id="warehouseItemCode" placeholder="كود الصنف">

      <select id="warehouseItemUnit">
        <option>كجم</option>
        <option>جرام</option>
        <option>لتر</option>
        <option>مل</option>
        <option>حبة</option>
        <option>كرتون</option>
        <option>صندوق</option>
        <option>ربطة</option>
      </select>

      <button class="btn btn-main" onclick="addWarehouseItem()">إضافة صنف</button>
    </div>

    <div class="panel" style="margin-top:16px">
      <input id="warehouseSearch" placeholder="بحث باسم الصنف أو الكود" oninput="drawWarehouseItems()">
      <div id="warehouseItemsContainer"></div>
    </div>
  `);

  drawSections();
  drawChefSectionOptions();
  drawChefs();
  drawWarehouseItems();
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
    ? chefSections.map((section, index) => `
      <div class="card">
        <div class="icon">${section.icon || "🍽️"}</div>
        <div class="card-title">${section.name}</div>
        <button class="btn btn-light" style="margin-top:12px" onclick="deleteSection(${index})">حذف</button>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

async function deleteSection(index){
  const section = chefSections[index];
  if(!section || !section.id) return;

  const { db, doc, deleteDoc } = window.firebaseDB;

  await deleteDoc(doc(db, "chef_sections", section.id));
}

function drawChefSectionOptions(){
  const select = document.getElementById("chefSection");
  if(!select) return;

  select.innerHTML = chefSections.length
    ? chefSections.map(section => `<option value="${section.name}">${section.name}</option>`).join("")
    : `<option value="">لا توجد أقسام</option>`;
}

async function addChef(){
  const name = document.getElementById("chefName").value.trim();
  const code = document.getElementById("chefCode").value.trim();
  const section = document.getElementById("chefSection").value;

  if(!name || !code || !section) return;

  if(chefs.some(chef => chef.code === code)){
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
    ? chefs.map((chef, index) => `
      <div class="card">
        <div class="icon">👨‍🍳</div>
        <div class="card-title">${chef.name}</div>
        <div style="margin-top:8px;color:#7b8674;font-weight:700">${chef.section} - ${chef.code}</div>
        <button class="btn btn-light" style="margin-top:12px" onclick="deleteChef(${index})">حذف</button>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا يوجد شيفات</div>`;
}

async function deleteChef(index){
  const chef = chefs[index];
  if(!chef || !chef.id) return;

  const { db, doc, deleteDoc } = window.firebaseDB;

  await deleteDoc(doc(db, "chefs", chef.id));
}

function addWarehouseItem(){
  const name = document.getElementById("warehouseItemName").value.trim();
  const code = document.getElementById("warehouseItemCode").value.trim();
  const unit = document.getElementById("warehouseItemUnit").value;

  if(!name || !code) return;
  if(warehouseItems.some(item => item.code === code)){
    alert("كود الصنف مستخدم");
    return;
  }

  warehouseItems.push({ name, code, unit });
  saveData();
  renderSettings();
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
          <button class="btn btn-light" onclick="deleteWarehouseItem('${item.code}')">حذف</button>
        </div>
      `).join("")}
    </div>
  `;
}

function deleteWarehouseItem(code){
  warehouseItems = warehouseItems.filter(item => item.code !== code);
  saveData();
  drawWarehouseItems();
}

/* الشيفات */

function renderChefs(){
  pageLayout("الشيفات", `<div id="chefSectionsView" class="grid"></div>`);
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
      <div class="card" onclick="renderEmpty('الإنتاج')">
        <div class="icon">📈</div>
        <div class="card-title">الإنتاج</div>
      </div>

      <div class="card" onclick="renderWarehouseRequest()">
        <div class="icon">📦</div>
        <div class="card-title">طلب مستودع</div>
      </div>

      <div class="card" onclick="renderMyOrders()">
        <div class="icon">📋</div>
        <div class="card-title">طلباتي</div>
      </div>
    </section>
  `, "renderChefs()");
}

/* طلب مستودع */

function renderWarehouseRequest(){
  if(!currentChef) return renderChefs();
  currentCart = [];

  pageLayout("طلب مستودع", `
    <div class="panel">
      <input id="requestSearch" placeholder="بحث باسم الصنف أو الكود" oninput="drawRequestSearch()">
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
          <input id="qty_${item.code}" type="number" min="1" placeholder="كمية" style="margin:0">
          <button class="btn btn-main" onclick="addToCart('${item.code}')">إضافة</button>
        </div>
      `).join("")}
    </div>
  `;
}

function addToCart(code){
  const item = warehouseItems.find(i => i.code === code);
  const qty = Number(document.getElementById(`qty_${code}`).value);

  if(!item || qty <= 0) return;

  const existing = currentCart.find(i => i.code === code);

  if(existing){
    existing.qty += qty;
  }else{
    currentCart.push({ name:item.name, code:item.code, unit:item.unit, qty });
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

function sendWarehouseOrder(){
  if(currentCart.length === 0) return;

  const order = {
    id:`ORD-${orderCounter++}`,
    chefName:currentChef.name,
    chefCode:currentChef.code,
    section:currentChef.section,
    items:[...currentCart],
    note:document.getElementById("requestNote").value.trim(),
    status:"جديد",
    createdAt:new Date().toLocaleString("ar-SA")
  };

  warehouseOrders.push(order);
  saveData();
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

/* المستودع */

function renderWarehouse(){
  pageLayout("المستودع", `
    <div class="grid">
      ${
        warehouseOrders.length === 0
        ? `<div class="panel placeholder">لا توجد طلبات</div>`
        : warehouseOrders.map(o => renderOrderCard(o, false)).join("")
      }
    </div>
  `);
}

function renderOrderCard(order, isChefView){
  return `
    <div class="panel">
      <h3>${order.id}</h3>
      <p style="font-weight:800;margin-top:8px">${order.chefName} - ${order.section}</p>
      <p style="color:#7b8674;margin-top:4px">${order.createdAt}</p>

      <div style="margin-top:12px">
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0;">
            <span>${item.name}</span>
            <b>${item.qty} ${item.unit || ""}</b>
          </div>
        `).join("")}
      </div>

      ${order.note ? `<p style="margin-top:12px;color:#7b8674">${order.note}</p>` : ""}

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

function updateOrderStatus(orderId, status){
  const order = warehouseOrders.find(o => o.id === orderId);
  if(!order) return;

  order.status = status;
  saveData();
  renderWarehouse();
}

function receiveOrder(orderId){
  const order = warehouseOrders.find(o => o.id === orderId);
  if(!order) return;

  order.status = "تم الاستلام";
  saveData();
  renderMyOrders();
}

/* الإدارة والتنبيهات */

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
    sub:`${order.chefName} - ${order.id}`
  };
}

function dismissAlert(key){
  if(!dismissedAlerts.includes(key)){
    dismissedAlerts.push(key);
    saveData();
  }
  renderAdmin();
}

function renderAdmin(){
  const alerts = warehouseOrders
    .map(getAlert)
    .filter(alert => alert.text && !dismissedAlerts.includes(alert.key));

  pageLayout("الإدارة", `
    <div class="panel">
      <h3 style="margin-bottom:15px">🔔 التنبيهات</h3>

      ${
        alerts.length === 0
        ? `<div class="placeholder">لا توجد تنبيهات</div>`
        : alerts.map(alert => `
          <div style="
            display:grid;
            grid-template-columns:1fr auto;
            gap:10px;
            align-items:center;
            background:#f9fbf5;
            border:1px solid #e5eadb;
            border-radius:18px;
            padding:14px;
            margin-bottom:10px;
          ">
            <div onclick="renderOrderDetails('${alert.orderId}')" style="cursor:pointer">
              <b>${alert.text}</b>
              <div style="color:#7b8674;font-weight:700;margin-top:4px">${alert.sub}</div>
            </div>
            <button class="btn btn-light" onclick="dismissAlert('${alert.key}')">×</button>
          </div>
        `).join("")
      }
    </div>

    <section class="grid" style="margin-top:16px">
      <div class="card" onclick="renderAdminSection('الشيفات')"><div class="icon">👨‍🍳</div><div class="card-title">الشيفات</div></div>
      <div class="card" onclick="renderAdminSection('المستودع')"><div class="icon">📦</div><div class="card-title">المستودع</div></div>
      <div class="card" onclick="renderAdminSection('النظافة')"><div class="icon">🧹</div><div class="card-title">النظافة</div></div>
      <div class="card" onclick="renderAdminSection('التشغيل')"><div class="icon">🏭</div><div class="card-title">التشغيل</div></div>
      <div class="card" onclick="renderAdminSection('الجرد')"><div class="icon">📋</div><div class="card-title">الجرد</div></div>
      <div class="card" onclick="renderAdminSection('PDF')"><div class="icon">📄</div><div class="card-title">PDF</div></div>
    </section>
  `);
}

function renderOrderDetails(orderId){
  const order = warehouseOrders.find(o => o.id === orderId);
  if(!order) return renderAdmin();

  pageLayout(order.id, `${renderOrderCard(order, false)}`, "renderAdmin()");
}

function renderAdminSection(title){
  pageLayout(title, `<div class="panel placeholder">${title}</div>`, "renderAdmin()");
}

/* التشغيل والنظافة */

function renderOperations(){ renderEmpty("متابعة التشغيل"); }
function renderCleaning(){ renderEmpty("النظافة"); }

listenChefSections();
listenChefs();
renderHome();
