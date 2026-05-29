function renderSettings(){
  app.innerHTML = `
    <main class="app">
      <div class="page-head">
        <h2>الإعدادات</h2>
        <button class="btn btn-light" onclick="renderHome()">رجوع</button>
      </div>

      <section class="panel">
        <h3>أقسام الإنتاج</h3>

        <input id="sectionName" placeholder="اسم القسم">
        <input id="sectionIcon" placeholder="الأيقونة">

        <button class="btn btn-main" onclick="addChefSection()">إضافة</button>
      </section>

      <section class="grid" id="sectionsList" style="margin-top:16px"></section>
    </main>
  `;

  loadChefSections();
}

async function addChefSection(){
  const name = document.getElementById("sectionName").value.trim();
  const icon = document.getElementById("sectionIcon").value.trim();

  if(!name) return;

  await db.collection("chef_sections").add({
    name:name,
    icon:icon || "🍽️",
    createdAt:Date.now()
  });

  document.getElementById("sectionName").value = "";
  document.getElementById("sectionIcon").value = "";

  loadChefSections();
}

function loadChefSections(){
  const box = document.getElementById("sectionsList");
  if(!box) return;

  db.collection("chef_sections").orderBy("createdAt","desc").onSnapshot(snapshot=>{
    if(snapshot.empty){
      box.innerHTML = `
        <div class="panel placeholder">لا توجد أقسام</div>
      `;
      return;
    }

    box.innerHTML = "";

    snapshot.forEach(doc=>{
      const item = doc.data();

      box.innerHTML += `
        <div class="card">
          <div class="icon">${item.icon || "🍽️"}</div>
          <div class="card-title">${item.name}</div>
        </div>
      `;
    });
  });
}
