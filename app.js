const app = document.getElementById("app");

let chefSections = [];
let chefs = [];

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
        <button class="btn btn-main" onclick="renderPage('الإدارة')">الإدارة</button>
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

        <div class="card" onclick="renderPage('المستودع')">
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
    </main>
  `;

  drawSections();
  drawChefSectionOptions();
  drawChefs();
}

function addSection(){
  const name = document.getElementById("sectionName").value.trim();
  const icon = document.getElementById("sectionIcon").value.trim();

  if(!name) return;

  chefSections.push({
    name,
    icon: icon || "🍽️"
  });

  document.getElementById("sectionName").value = "";
  document.getElementById("sectionIcon").value = "";

  drawSections();
  drawChefSectionOptions();
}

function drawSections(){
  const box = document.getElementById("sectionsContainer");
  if(!box) return;

  if(chefSections.length === 0){
    box.innerHTML = `
      <div class="panel placeholder">
        لا توجد أقسام
      </div>
    `;
    return;
  }

  box.innerHTML = chefSections.map(section => `
    <div class="card">
      <div class="icon">${section.icon}</div>
      <div class="card-title">${section.name}</div>
    </div>
  `).join("");
}

function drawChefSectionOptions(){
  const select = document.getElementById("chefSection");
  if(!select) return;

  if(chefSections.length === 0){
    select.innerHTML = `<option value="">لا توجد أقسام</option>`;
    return;
  }

  select.innerHTML = chefSections.map(section => `
    <option value="${section.name}">${section.name}</option>
  `).join("");
}

function addChef(){
  const name = document.getElementById("chefName").value.trim();
  const code = document.getElementById("chefCode").value.trim();
  const section = document.getElementById("chefSection").value;

  if(!name || !code || !section) return;

  chefs.push({
    name,
    code,
    section
  });

  document.getElementById("chefName").value = "";
  document.getElementById("chefCode").value = "";

  drawChefs();
}

function drawChefs(){
  const box = document.getElementById("chefsContainer");
  if(!box) return;

  if(chefs.length === 0){
    box.innerHTML = `
      <div class="panel placeholder">
        لا يوجد شيفات
      </div>
    `;
    return;
  }

  box.innerHTML = chefs.map(chef => `
    <div class="card">
      <div class="icon">👨‍🍳</div>
      <div class="card-title">${chef.name}</div>
      <div style="margin-top:8px;color:#7b8674;font-weight:700">
        ${chef.section} - ${chef.code}
      </div>
    </div>
  `).join("");
}

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

  drawChefSectionsView();
}

function drawChefSectionsView(){
  const box = document.getElementById("chefSectionsView");
  if(!box) return;

  if(chefSections.length === 0){
    box.innerHTML = `
      <div class="panel placeholder">
        لا توجد أقسام
      </div>
    `;
    return;
  }

  box.innerHTML = chefSections.map(section => `
    <div class="card" onclick="renderChefCode('${section.name}')">
      <div class="icon">${section.icon}</div>
      <div class="card-title">${section.name}</div>
    </div>
  `).join("");
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

  const chef = chefs.find(item =>
    item.code === code && item.section === sectionName
  );

  const message = document.getElementById("chefMessage");

  if(!chef){
    message.style.display = "block";
    message.textContent = "الكود غير صحيح";
    return;
  }

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
        <div class="card">
          <div class="icon">📈</div>
          <div class="card-title">الإنتاج</div>
        </div>

        <div class="card">
          <div class="icon">📦</div>
          <div class="card-title">طلب مستودع</div>
        </div>

        <div class="card">
          <div class="icon">📋</div>
          <div class="card-title">طلباتي</div>
        </div>
      </section>
    </main>
  `;
}

renderHome();
