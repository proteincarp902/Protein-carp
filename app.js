const app = document.getElementById("app");

function renderHome(){
  const today = new Date().toLocaleDateString("ar-SA", {
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric"
  });

  app.innerHTML = `
    <main class="app">
      <div class="topbar">
        <button class="btn btn-light" onclick="renderPage('الإعدادات')">الإعدادات</button>
        <button class="btn btn-main" onclick="renderPage('الإدارة')">الإدارة</button>
      </div>

      <section class="hero">
        <img src="assets/logo.png" class="logo" alt="Protein & Carb">
        <h1 class="hero-title">Protein & Carb Operations</h1>
        <p class="hero-date">${today}</p>
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

        <div class="card" onclick="renderPage('الشيفات')">
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

renderHome();
