const app = document.getElementById("app");

function renderHome(){

  const today = new Date().toLocaleDateString("ar-SA",{
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric"
  });

  app.innerHTML = `
  
  <main class="app">

    <div class="topbar">
      <button class="btn btn-light">الإعدادات</button>
      <button class="btn btn-main">الإدارة</button>
    </div>

    <section class="hero">
      <img src="assets/logo.png" class="logo" alt="logo">
      <h1 class="hero-title">Protein & Carb Operations</h1>
      <p class="hero-date">${today}</p>
    </section>

    <section class="grid">

      <div class="card">
        <div class="icon">🏭</div>
        <div class="card-title">متابعة التشغيل</div>
      </div>

      <div class="card">
        <div class="icon">🧹</div>
        <div class="card-title">النظافة</div>
      </div>

      <div class="card">
        <div class="icon">👨‍🍳</div>
        <div class="card-title">الشيفات</div>
      </div>

      <div class="card">
        <div class="icon">📦</div>
        <div class="card-title">المستودع</div>
      </div>

    </section>

  </main>

  `;
}

renderHome();
