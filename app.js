const app = document.getElementById("app");

function backHome(){
  renderHome();
}

function page(title){
  app.innerHTML = `
    <main class="app">
      <div class="topbar">
        <button class="btn btn-light" onclick="backHome()">رجوع</button>
      </div>
      <section class="hero">
        <h1 class="hero-title">${title}</h1>
      </section>
    </main>
  `;
}

function renderSettings(){ page("الإعدادات"); }
function renderAdmin(){ page("الإدارة"); }
function renderOperations(){ page("متابعة التشغيل"); }
function renderCleaning(){ page("النظافة"); }
function renderChefs(){ page("الشيفات"); }
function renderWarehouse(){ page("المستودع"); }

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
        <button class="btn btn-light" onclick="renderSettings()">الإعدادات</button>
        <button class="btn btn-main" onclick="renderAdmin()">الإدارة</button>
      </div>

      <section class="hero">
        <img src="assets/logo.png" class="logo" alt="Protein & Carb">
        <h1 class="hero-title">Protein & Carb Operations</h1>
        <p class="hero-date">${today}</p>
      </section>

      <section class="grid">
        <div class="card" onclick="renderOperations()">
          <div class="icon">🏭</div>
          <div class="card-title">متابعة التشغيل</div>
        </div>

        <div class="card" onclick="renderCleaning()">
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

renderHome();
