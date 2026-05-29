const app = document.getElementById("app");

let chefSections = JSON.parse(localStorage.getItem("chefSections")) || [];
let chefs = JSON.parse(localStorage.getItem("chefs")) || [];
let warehouseItems = JSON.parse(localStorage.getItem("warehouseItems")) || [];
let warehouseOrders = JSON.parse(localStorage.getItem("warehouseOrders")) || [];
let orderCounter = Number(localStorage.getItem("orderCounter")) || 1001;

let currentChef = null;
let currentCart = [];

function saveData(){
  localStorage.setItem("chefSections", JSON.stringify(chefSections));
  localStorage.setItem("chefs", JSON.stringify(chefs));
  localStorage.setItem("warehouseItems", JSON.stringify(warehouseItems));
  localStorage.setItem("warehouseOrders", JSON.stringify(warehouseOrders));
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
        <div class="card" onclick="renderPage('متابعة التشغيل')">
          <div class="icon">🏭</div>
          <div class="card-title">متابعة التشغيل</div>
        </div>

        <div class="card" onclick="renderPage('النظافة')">
          <div class="icon">🧹</div>
          <div class="card-title">النظافة</div>
        </div>

        <div class="card" onclick="renderChefs()">
          <div class="icon">👨‍🍳</div>
          <div class="card-title">الشيفات</div>
        </div>

        <div class="card" onclick="renderWarehouse()">
          <div class="icon">📦</div>
          <div class="card-title">المستودع</div>
        </div>
      </section>
    </main>
  `;
}

function renderPage(title){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>${title}</h2>
        <button class="btn btn-light" onclick="renderHome()">رجوع</button>
      </div>
      <div class="panel placeholder">${title}</div>
    </main>
  `;
}

/* الإعدادات */
function renderSettings(){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>الإعدادات</h2>
        <button class="btn btn-light" onclick="renderHome()">رجوع</button>
      </div>

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
    </main>
  `;

  drawSections();
  drawChefSectionOptions();
  drawChefs();
  drawWarehouseItems();
}

function addSection(){
  const name = document.getElementById("sectionName").value.trim();
  const icon = document.getElementById("sectionIcon").value.trim();
  if(!name) return;

  chefSections.push({ name, icon: icon || "🍽️" });
  saveData();

  document.getElementById("sectionName").value = "";
  document.getElementById("sectionIcon").value = "";
  drawSections();
  drawChefSectionOptions();
}

function drawSections(){
  const box = document.getElementById("sectionsContainer");
  if(!box) return;

  box.innerHTML = chefSections.length
    ? chefSections.map(s => `
      <div class="card">
        <div class="icon">${s.icon}</div>
        <div class="card-title">${s.name}</div>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

function drawChefSectionOptions(){
  const select = document.getElementById("chefSection");
  if(!select) return;

  select.innerHTML = chefSections.length
    ? chefSections.map(s => `<option value="${s.name}">${s.name}</option>`).join("")
    : `<option value="">لا توجد أقسام</option>`;
}

function addChef(){
  const name = document.getElementById("chefName").value.trim();
  const code = document.getElementById("chefCode").value.trim();
  const section = document.getElementById("chefSection").value;
  if(!name || !code || !section) return;

  chefs.push({ name, code, section });
  saveData();

  document.getElementById("chefName").value = "";
  document.getElementById("chefCode").value = "";
  drawChefs();
}

function drawChefs(){
  const box = document.getElementById("chefsContainer");
  if(!box) return;

  box.innerHTML = chefs.length
    ? chefs.map(c => `
      <div class="card">
        <div class="icon">👨‍🍳</div>
        <div class="card-title">${c.name}</div>
        <div style="margin-top:8px;color:#7b8674;font-weight:700">${c.section} - ${c.code}</div>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا يوجد شيفات</div>`;
}

function addWarehouseItem(){
  const name = document.getElementById("warehouseItemName").value.trim();
  const code = document.getElementById("warehouseItemCode").value.trim();
  const unit = document.getElementById("warehouseItemUnit").value;
  if(!name || !code) return;

  warehouseItems.push({ name, code, unit });
  saveData();

  document.getElementById("warehouseItemName").value = "";
  document.getElementById("warehouseItemCode").value = "";
  drawWarehouseItems();
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
      ${list.map((item, i) => `
        <div style="
          display:grid;
          grid-template-columns:1fr auto auto auto;
          gap:8px;
          align-items:center;
          background:#f9fbf5;
          border:1px solid #e5eadb;
          border-radius:16px;
          padding:12px;
        ">
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
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>الشيفات</h2>
        <button class="btn btn-light" onclick="renderHome()">رجوع</button>
      </div>
      <div id="chefSectionsView" class="grid"></div>
    </main>
  `;

  const box = document.getElementById("chefSectionsView");

  box.innerHTML = chefSections.length
    ? chefSections.map(s => `
      <div class="card" onclick="renderChefCode('${s.name}')">
        <div class="icon">${s.icon}</div>
        <div class="card-title">${s.name}</div>
      </div>
    `).join("")
    : `<div class="panel placeholder">لا توجد أقسام</div>`;
}

function renderChefCode(sectionName){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>${sectionName}</h2>
        <button class="btn btn-light" onclick="renderChefs()">رجوع</button>
      </div>

      <div class="panel">
        <input id="chefCode" type="number" placeholder="كود الشيف">
        <button class="btn btn-main" onclick="checkChefCode('${sectionName}')">دخول</button>
      </div>

      <div id="chefMessage" class="panel placeholder" style="margin-top:16px;display:none"></div>
    </main>
  `;
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
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>${chef.name}</h2>
        <button class="btn btn-light" onclick="renderChefs()">رجوع</button>
      </div>

      <div class="panel" style="margin-bottom:16px;text-align:center">
        <div style="font-size:48px">👨‍🍳</div>
        <h2>${chef.name}</h2>
        <div style="color:#7b8674;font-weight:700">${chef.section}</div>
      </div>

      <section class="grid">
        <div class="card" onclick="renderPage('الإنتاج')">
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
    </main>
  `;
}

/* طلب المستودع */
function renderWarehouseRequest(){
  currentCart = [];

  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>طلب مستودع</h2>
        <button class="btn btn-light" onclick="renderChefDashboard(currentChef)">رجوع</button>
      </div>

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
    </main>
  `;

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
        <div style="
          display:grid;
          grid-template-columns:1fr auto auto;
          gap:8px;
          align-items:center;
          background:#f9fbf5;
          border:1px solid #e5eadb;
          border-radius:16px;
          padding:12px;
        ">
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
    currentCart.push({
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

  box.innerHTML = currentCart.map(item => `
    <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
      <span>${item.name}</span>
      <b>${item.qty} ${item.unit || ""}</b>
    </div>
  `).join("");
}

function sendWarehouseOrder(){
  if(currentCart.length === 0) return;

  const order = {
    id: `ORD-${orderCounter++}`,
    chefName: currentChef.name,
    chefCode: currentChef.code,
    section: currentChef.section,
    items:[...currentCart],
    note: document.getElementById("requestNote").value.trim(),
    status:"جديد",
    createdAt: new Date().toLocaleString("ar-SA")
  };

  warehouseOrders.push(order);
  saveData();
  currentCart = [];
  renderMyOrders();
}

function renderMyOrders(){
  const myOrders = warehouseOrders.filter(o => o.chefCode === currentChef.code);

  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>طلباتي</h2>
        <button class="btn btn-light" onclick="renderChefDashboard(currentChef)">رجوع</button>
      </div>

      <div class="grid">
        ${
          myOrders.length === 0
          ? `<div class="panel placeholder">لا توجد طلبات</div>`
          : myOrders.map(o => renderOrderCard(o, true)).join("")
        }
      </div>
    </main>
  `;
}

/* المستودع */
function renderWarehouse(){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>المستودع</h2>
        <button class="btn btn-light" onclick="renderHome()">رجوع</button>
      </div>

      <div class="grid">
        ${
          warehouseOrders.length === 0
          ? `<div class="panel placeholder">لا توجد طلبات</div>`
          : warehouseOrders.map(o => renderOrderCard(o, false)).join("")
        }
      </div>
    </main>
  `;
}

function renderOrderCard(order, isChefView){
  return `
    <div class="panel">
      <h3>${order.id}</h3>
      <p style="font-weight:800;margin-top:8px">${order.chefName} - ${order.section}</p>
      <p style="color:#7b8674;margin-top:4px">${order.createdAt}</p>

      <div style="margin-top:12px">
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5eadb;padding:8px 0">
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

/* الإدارة */
function renderAdmin(){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>الإدارة</h2>
        <button class="btn btn-light" onclick="renderHome()">رجوع</button>
      </div>

      <section class="grid">
        <div class="card"><div class="icon">👨‍🍳</div><div class="card-title">${chefs.length}</div></div>
        <div class="card"><div class="icon">📦</div><div class="card-title">${warehouseOrders.length}</div></div>
        <div class="card"><div class="icon">✅</div><div class="card-title">${warehouseOrders.filter(o => o.status === "تم الاستلام").length}</div></div>
        <div class="card"><div class="icon">⚠️</div><div class="card-title">${warehouseOrders.filter(o => o.status === "متأخر").length}</div></div>
      </section>
    </main>
  `;
}

renderHome();
