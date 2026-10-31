'use strict';

/* ========== الإعدادات والحالة ========== */
const STORAGE_KEY = 'protein-carb-github-v1';
const DEPARTMENTS = ['الحلا', 'المخبوزات', 'البيتزا', 'الساندوتشات'];

const DEFAULT_DATA = {
  branches: [
    { id: 'riyadh', name: 'فرع الرياض الرئيسي', city: 'الرياض', manager: 'خالد المنيع' },
    { id: 'jeddah', name: 'فرع جدة الشاطئ', city: 'جدة', manager: 'ريم الحربي' }
  ],
  activeBranch: 'riyadh',
  inventory: [],
  production: [],
  waste: []
};

const ui = { editingBranch: null, addingBranch: false };

const $ = id => document.getElementById(id);
const clone = obj => JSON.parse(JSON.stringify(obj));
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);

// تنظيف أي نص يكتبه المستخدم قبل عرضه (يمنع حقن الأكواد)
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let data = loadData();

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.branches) && saved.branches.length) {
      return { ...clone(DEFAULT_DATA), ...saved };
    }
  } catch (err) { /* بيانات تالفة: نبدأ من الافتراضي */ }
  return clone(DEFAULT_DATA);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    notify('تعذر الحفظ في المتصفح. المساحة ممتلئة أو التخزين معطل.');
  }
  renderAll();
}

let toastTimer;
function notify(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ========== أدوات مساعدة ========== */
const currentBranch = () => data.branches.find(b => b.id === data.activeBranch) || data.branches[0];
const nowLabel = () => new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
const forBranch = (list, id) => list.filter(x => x.branchId === id);
const sum = (list, key = 'qty') => list.reduce((total, x) => total + x[key], 0);

function table(headers, rows) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
const empty = text => `<div class="empty">${text}</div>`;

/* ========== العرض ========== */
function renderAll() {
  const branch = currentBranch();
  const inventory = forBranch(data.inventory, branch.id);
  const production = forBranch(data.production, branch.id);
  const waste = forBranch(data.waste, branch.id);

  $('currentBranchLabel').textContent = branch.name;
  renderOverview(inventory, production, waste);
  renderInventory(inventory);
  renderOperations(production, waste);
  renderBranches();
}

function renderOverview(inventory, production, waste) {
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const todayCount = [...inventory, ...production, ...waste].filter(x => x.created >= startOfDay).length;

  $('statItems').textContent = inventory.length;
  $('statProduction').textContent = production.length;
  $('statWaste').textContent = waste.length;
  $('statEntries').textContent = todayCount;

  $('departmentSummary').innerHTML = DEPARTMENTS.map(dep => {
    const p = production.filter(x => x.department === dep).length;
    const w = waste.filter(x => x.department === dep).length;
    return `<div class="row"><span>${dep}</span><small>إنتاج: ${p} · هدر: ${w}</small></div>`;
  }).join('');

  const recent = [
    ...inventory.map(x => ({ created: x.created, label: 'جرد', text: `${x.item} · ${x.qty} ${x.unit}` })),
    ...production.map(x => ({ created: x.created, label: 'إنتاج', text: `${x.item} · ${x.qty} ${x.unit}` })),
    ...waste.map(x => ({ created: x.created, label: 'هدر', text: `${x.item} · ${x.qty} ${x.unit} · ${x.reason}` }))
  ].sort((a, b) => b.created - a.created).slice(0, 5);

  $('activitySummary').innerHTML = recent.length
    ? recent.map(x => `<div class="row"><span>${esc(x.text)}</span><small>${x.label}</small></div>`).join('')
    : empty('لا توجد حركات مسجلة.');
}

function renderInventory(items) {
  const rows = [...items].reverse().map(x =>
    `<tr><td>${esc(x.department)}</td><td><b>${esc(x.item)}</b></td><td>${esc(x.chef)}</td><td>${x.qty} ${esc(x.unit)}</td><td>${esc(x.time)}</td></tr>`);
  $('inventoryTable').innerHTML = rows.length
    ? table(['القسم', 'الصنف', 'الشيف', 'الكمية', 'وقت الإدخال'], rows)
    : empty('لا توجد أصناف. أضف جرد بداية الشفت.');
}

function renderOperations(production, waste) {
  const all = [
    ...production.map(x => ({ ...x, type: 'إنتاج', reason: '-' })),
    ...waste.map(x => ({ ...x, type: 'هدر' }))
  ].sort((a, b) => b.created - a.created);

  const rows = all.map(x =>
    `<tr><td class="${x.type === 'هدر' ? 'tag-danger' : ''}">${x.type}</td><td>${esc(x.department)}</td><td>${esc(x.item)}</td><td>${x.qty} ${esc(x.unit)}</td><td>${esc(x.reason)}</td></tr>`);
  $('operationsTable').innerHTML = rows.length
    ? table(['النوع', 'القسم', 'الصنف', 'الكمية', 'السبب'], rows)
    : empty('لا توجد حركات إنتاج أو هدر بعد.');
}

function branchFormHtml(branch) {
  const b = branch || { name: '', city: '', manager: '' };
  const action = branch ? 'save' : 'add-save';
  return `<div class="branch-form" data-form="${branch ? esc(branch.id) : 'new'}">
    <label>اسم الفرع<input data-field="name" value="${esc(b.name)}"></label>
    <label>المدينة<input data-field="city" value="${esc(b.city)}"></label>
    <label>المدير<input data-field="manager" value="${esc(b.manager)}"></label>
    <div class="row-actions">
      <button class="btn primary" data-action="${action}" data-id="${branch ? esc(branch.id) : ''}">حفظ</button>
      <button class="btn" data-action="cancel">إلغاء</button>
    </div>
  </div>`;
}

function renderBranches() {
  const rows = data.branches.map(b => {
    if (ui.editingBranch === b.id) return branchFormHtml(b);
    const isCurrent = data.activeBranch === b.id;
    return `<div class="row">
      <span><b>${esc(b.name)}</b><small>${esc(b.city)} · المدير: ${esc(b.manager)}</small></span>
      <span class="row-actions">
        <button class="btn" data-action="edit" data-id="${esc(b.id)}">تعديل</button>
        ${isCurrent ? '<span class="current">الفرع الحالي</span>' : `<button class="btn" data-action="select" data-id="${esc(b.id)}">اختيار</button>`}
      </span>
    </div>`;
  });
  if (ui.addingBranch) rows.push(branchFormHtml(null));
  $('branchesTable').innerHTML = rows.join('');
}

/* ========== إضافة الإدخالات ========== */
function addEntry(type, fields) {
  data[type].push({ ...fields, id: uid(), branchId: data.activeBranch, created: Date.now(), time: nowLabel() });
  save();
  notify('تم الحفظ');
}

function clearFields(...ids) { ids.forEach(id => { $(id).value = ''; }); }
const validQty = n => Number.isFinite(n) && n > 0;

$('saveInventory').onclick = () => {
  const entry = {
    department: $('inventoryDepartment').value,
    chef: $('inventoryChef').value.trim(),
    item: $('inventoryItem').value.trim(),
    qty: Number($('inventoryQty').value),
    unit: $('inventoryUnit').value
  };
  if (!entry.chef || !entry.item || !validQty(entry.qty)) return notify('أكمل بيانات الجرد، والكمية أكبر من صفر');
  addEntry('inventory', entry);
  clearFields('inventoryChef', 'inventoryItem', 'inventoryQty');
};

$('saveProduction').onclick = () => {
  const entry = {
    department: $('productionDepartment').value,
    item: $('productionItem').value.trim(),
    qty: Number($('productionQty').value),
    unit: $('productionUnit').value
  };
  if (!entry.item || !validQty(entry.qty)) return notify('أدخل الصنف والكمية');
  addEntry('production', entry);
  clearFields('productionItem', 'productionQty');
};

$('saveWaste').onclick = () => {
  const entry = {
    department: $('wasteDepartment').value,
    item: $('wasteItem').value.trim(),
    qty: Number($('wasteQty').value),
    unit: 'وحدة',
    reason: $('wasteReason').value
  };
  if (!entry.item || !validQty(entry.qty)) return notify('أدخل الصنف والكمية');
  addEntry('waste', entry);
  clearFields('wasteItem', 'wasteQty');
};

/* ========== إدارة الفروع (بدون prompt) ========== */
function readBranchForm(formEl) {
  const get = name => formEl.querySelector(`[data-field="${name}"]`).value.trim();
  return { name: get('name'), city: get('city'), manager: get('manager') };
}

$('branches').addEventListener('click', event => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'select') {
    data.activeBranch = id;
    save();
    notify('تم تبديل الفرع');
  } else if (action === 'edit') {
    ui.editingBranch = id;
    ui.addingBranch = false;
    renderBranches();
  } else if (action === 'add-start') {
    ui.addingBranch = true;
    ui.editingBranch = null;
    renderBranches();
  } else if (action === 'cancel') {
    ui.editingBranch = null;
    ui.addingBranch = false;
    renderBranches();
  } else if (action === 'save' || action === 'add-save') {
    const values = readBranchForm(btn.closest('[data-form]'));
    if (!values.name) return notify('اكتب اسم الفرع');
    if (action === 'save') {
      Object.assign(data.branches.find(b => b.id === id), values);
    } else {
      data.branches.push({ id: 'branch-' + uid(), ...values });
    }
    ui.editingBranch = null;
    ui.addingBranch = false;
    save();
    notify('تم حفظ بيانات الفرع');
  }
});

/* ========== التنقل بين الأقسام ========== */
function showView(name) {
  document.querySelectorAll('.nav').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === name));
  window.scrollTo(0, 0);
}

$('sidebar').addEventListener('click', event => {
  const nav = event.target.closest('[data-view]');
  if (nav) showView(nav.dataset.view);
});
document.querySelectorAll('[data-go]').forEach(btn => { btn.onclick = () => showView(btn.dataset.go); });

/* ========== المساعد ========== */
function answer(question) {
  const branch = currentBranch();
  const inventory = forBranch(data.inventory, branch.id);
  const production = forBranch(data.production, branch.id);
  const waste = forBranch(data.waste, branch.id);

  if (/هدر|تالف|توالف/.test(question)) {
    if (!waste.length) return 'لا يوجد هدر مسجل لهذا الفرع.';
    const byDept = {};
    waste.forEach(x => { byDept[x.department] = (byDept[x.department] || 0) + x.qty; });
    const [name, total] = Object.entries(byDept).sort((a, b) => b[1] - a[1])[0];
    return `أكثر قسم سجل هدرًا هو ${name} بإجمالي ${total} وحدة.`;
  }
  if (/جرد|استلم|رصيد|مخزون/.test(question)) {
    if (!inventory.length) return 'لا يوجد جرد مسجل لهذا الفرع.';
    const x = inventory[inventory.length - 1];
    return `آخر جرد: ${x.item} بكمية ${x.qty} ${x.unit} في قسم ${x.department} بواسطة ${x.chef}.`;
  }
  if (/إنتاج|انتاج/.test(question)) {
    return production.length ? `تم تسجيل ${production.length} حركة إنتاج.` : 'لا يوجد إنتاج مسجل لهذا الفرع.';
  }
  return `لهذا الفرع ${inventory.length} جرد، ${production.length} إنتاج، و${waste.length} هدر.`;
}

function addMessage(className, text) {
  const box = $('chatMessages');
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text; // textContent يمنع حقن الأكواد
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

$('assistantToggle').onclick = () => $('assistantPanel').classList.toggle('hidden');
$('assistantClose').onclick = () => $('assistantPanel').classList.add('hidden');
$('assistantForm').onsubmit = event => {
  event.preventDefault();
  const input = $('assistantQuestion');
  const question = input.value.trim();
  if (!question) return;
  addMessage('user', question);
  addMessage('bot', answer(question));
  input.value = '';
};

renderAll();
