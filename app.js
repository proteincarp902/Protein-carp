const app = document.getElementById("app");

let chefSections = [];

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
    </main>
  `;

  drawSections();
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
        <input id="chefCode" placeholder="كود الشيف">
        <button class="btn btn-main" onclick="renderChefDashboard('${sectionName}')">دخول</button>
      </div>
    </main>
  `;
}

function renderChefDashboard(sectionName){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>${sectionName}</h2>
        <button class="btn btn-light" onclick="renderChefs()">رجوع</button>
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
