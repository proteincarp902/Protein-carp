/* Restaurant chart of accounts. Defaults are stable codes; customizations are stored by code. */
var accAccounts=[], accAccountsV2=[];
var PC_CHART_VERSION=2;
var PC_ACCOUNT_TYPES={asset:"أصول",liability:"التزامات",equity:"حقوق ملكية",income:"إيرادات",cost:"تكاليف",expense:"مصروفات"};
var PC_ACCOUNT_SEED=[
 ["1","الأصول","","asset",false],
 ["12","الأصول المتداولة","1","asset",false],
 ["121","النقدية والبنوك","12","asset",false],
 ["1211","الصندوق الرئيسي","121","asset",true],
 ["1212","الحساب البنكي","121","asset",true],
 ["1213","عهد الموظفين","121","asset",true],
 ["1214","متحصلات نقاط البيع بالطريق","121","asset",true],
 ["122","الذمم المدينة","12","asset",false],
 ["1221","العملاء","122","asset",true],
 ["1222","مستحقات تطبيقات التوصيل","122","asset",true],
 ["1223","سلف الموظفين","122","asset",true],
 ["1224","دفعات مقدمة للموردين","122","asset",true],
 ["123","المخزون","12","asset",false],
 ["1231","مخزون المستودع الرئيسي","123","asset",true],
 ["1232","مخزون خامات الأقسام","123","asset",true],
 ["1233","مخزون الإنتاج الجاهز","123","asset",true],
 ["1234","مخزون التعبئة والتغليف","123","asset",true],
 ["124","الضرائب والمصروفات المقدمة","12","asset",false],
 ["1241","ضريبة مدخلات قابلة للاسترداد","124","asset",true],
 ["1242","إيجارات مدفوعة مقدمًا","124","asset",true],
 ["1243","تأمينات لدى الغير","124","asset",true],
 ["1244","مصروفات مدفوعة مقدمًا","124","asset",true],
 ["11","الأصول الثابتة","1","asset",false],
 ["111","الأصول الثابتة بالتكلفة","11","asset",false],
 ["1111","معدات وأجهزة المطبخ","111","asset",true],
 ["1112","أثاث وتجهيزات المطعم","111","asset",true],
 ["1113","سيارات ووسائل نقل","111","asset",true],
 ["1114","أجهزة حاسب وأنظمة","111","asset",true],
 ["1115","تحسينات على مبانٍ مستأجرة","111","asset",true],
 ["112","مجمع الإهلاك","11","asset",false],
 ["1121","مجمع إهلاك المعدات","112","asset",true],
 ["1122","مجمع إهلاك الأثاث","112","asset",true],
 ["1123","مجمع إهلاك السيارات","112","asset",true],
 ["1124","مجمع إهلاك الحاسب والتحسينات","112","asset",true],
 ["2","الالتزامات","","liability",false],
 ["22","الالتزامات المتداولة","2","liability",false],
 ["221","الدائنون","22","liability",false],
 ["2211","حساب مراقبة الموردين","221","liability",true],
 ["2212","مصاريف مستحقة","221","liability",true],
 ["2213","رواتب مستحقة","221","liability",true],
 ["2214","تأمينات اجتماعية مستحقة","221","liability",true],
 ["222","الضرائب والرسوم","22","liability",false],
 ["2221","ضريبة المخرجات","222","liability",true],
 ["2222","ضريبة قيمة مضافة مستحقة السداد","222","liability",true],
 ["2223","زكاة وضريبة دخل مستحقة","222","liability",true],
 ["223","التزامات أخرى متداولة","22","liability",false],
 ["2231","اشتراكات ودفعات عملاء مقدمة","223","liability",true],
 ["2232","قروض قصيرة الأجل","223","liability",true],
 ["21","الالتزامات غير المتداولة","2","liability",false],
 ["211","قروض ومخصصات","21","liability",false],
 ["2111","قروض طويلة الأجل","211","liability",true],
 ["2112","مخصص مكافأة نهاية الخدمة","211","liability",true],
 ["3","حقوق الملكية","","equity",false],
 ["31","رأس المال والأرباح","3","equity",false],
 ["311","حسابات الملاك","31","equity",false],
 ["3111","رأس المال","311","equity",true],
 ["3112","جاري الشركاء","311","equity",true],
 ["3113","مسحوبات الملاك","311","equity",true],
 ["312","الأرباح والاحتياطيات","31","equity",false],
 ["3121","أرباح محتجزة","312","equity",true],
 ["3122","احتياطي نظامي","312","equity",true],
 ["3123","نتيجة العام","312","equity",true],
 ["5","الإيرادات","","income",false],
 ["51","إيرادات النشاط","5","income",false],
 ["511","مبيعات المطعم","51","income",false],
 ["5111","مبيعات نقاط البيع","511","income",true],
 ["5112","مبيعات تطبيقات التوصيل","511","income",true],
 ["5113","إيرادات الاشتراكات","511","income",true],
 ["5114","الطلبات أونلاين","511","income",true],
 ["5115","مردودات وخصومات المبيعات","511","income",true],
 ["52","إيرادات أخرى","5","income",false],
 ["521","الإيرادات المتنوعة","52","income",false],
 ["5211","إيرادات متنوعة","521","income",true],
 ["61","تكاليف التشغيل المباشرة","6","cost",false],
 ["611","تكلفة المبيعات","61","cost",false],
 ["6111","تكلفة المواد الغذائية","611","cost",true],
 ["6112","تكلفة مواد التعبئة والتغليف","611","cost",true],
 ["6113","هدر وتالف مخزون","611","cost",true],
 ["6114","فروق الجرد","611","cost",true],
 ["71","المصروفات العامة والإدارية","7","expense",false],
 ["711","الرواتب ومنافع العاملين","71","expense",false],
 ["7111","رواتب وأجور","711","expense",true],
 ["7112","بدلات وسكن ونقل","711","expense",true],
 ["7113","تأمينات اجتماعية","711","expense",true],
 ["7114","تأمين طبي ومنافع موظفين","711","expense",true],
 ["7115","مكافأة نهاية الخدمة","711","expense",true],
 ["712","مصروفات المقر والتشغيل","71","expense",false],
 ["7121","إيجارات","712","expense",true],
 ["7122","كهرباء ومياه وغاز","712","expense",true],
 ["7123","صيانة وإصلاح","712","expense",true],
 ["7124","نظافة ومستهلكات","712","expense",true],
 ["7125","اتصالات وإنترنت","712","expense",true],
 ["7126","رخص ورسوم حكومية","712","expense",true],
 ["713","مصروفات البيع والتوزيع","71","expense",false],
 ["7131","تسويق وإعلان","713","expense",true],
 ["7132","عمولات تطبيقات التوصيل","713","expense",true],
 ["7133","رسوم البنوك ونقاط البيع","713","expense",true],
 ["7134","توصيل ومحروقات","713","expense",true],
 ["714","مصروفات إدارية أخرى","71","expense",false],
 ["7141","قرطاسية ومطبوعات","714","expense",true],
 ["7142","خدمات مهنية ومحاسبية","714","expense",true],
 ["7143","برامج واشتراكات","714","expense",true],
 ["7144","إهلاك واستهلاك","714","expense",true],
 ["7145","مصروفات متنوعة","714","expense",true],
 ["7146","زكاة وضريبة دخل","714","expense",true],
 ["6","التكاليف","","cost",false],
 ["7","المصروفات","","expense",false]
];

// Keep existing stored codes intact; normalize version-1 records only when reading.
function accAccountCode(code,version){
  code=String(code||"");
  if(version===PC_CHART_VERSION) return code;
  for(const [old,next] of [["11","12"],["12","11"],["21","22"],["22","21"],["4","5"],["51","61"],["52","71"],["5","7"]]){
    if(code.startsWith(old)) return next+code.slice(old.length);
  }
  return code;
}
function accLegacyAccountCode(code){
  for(const [next,old] of [["12","11"],["11","12"],["22","21"],["21","22"],["5","4"],["61","51"],["71","52"]]){
    if(code.startsWith(next)) return old+code.slice(next.length);
  }
  if(code.startsWith("7")&&code!=="7") return "5"+code.slice(1);
  return code==="6"||code==="7"?null:code;
}
function accNormalizeLegacyAccount(a){
  if(a.code==="5") return null; // The former combined root is now two separate roots.
  const code=accAccountCode(a.code), seed=PC_ACCOUNT_SEED.find(row=>row[0]===code);
  const parent=seed?seed[2]:accAccountCode(a.parent);
  const type=seed?seed[3]:code.startsWith("6")?"cost":a.type;
  const reserved=["1","11","12","2","21","22","3","5","6","7"].includes(code);
  return {...a,code,parent,type,...(reserved&&seed?{name:seed[1],posting:seed[4]}:{})};
}
function accChart(){
  const map=new Map(PC_ACCOUNT_SEED.map(([code,name,parent,type,posting])=>[code,{code,name,parent,type,posting,active:true}]));
  accList("accAccounts",accAccounts).forEach(a=>{const normalized=accNormalizeLegacyAccount(a);if(normalized) map.set(normalized.code,normalized);});
  accList("accAccountsV2",accAccountsV2).forEach(a=>map.set(a.code,{...a}));
  return [...map.values()].sort((a,b)=>a.code.localeCompare(b.code,"en"));
}
function accAccount(code){return accChart().find(a=>a.code===code);}
function accAccountOptions(selected,predicate){return accChart().filter(a=>a.posting&&a.active&&(!predicate||predicate(a))).map(a=>`<option value="${escapeHtml(a.code)}" ${a.code===selected?"selected":""}>${escapeHtml(a.code+" — "+a.name)}</option>`).join("");}
function accJournalTotals(lines){
  if(!Array.isArray(lines)||!lines.length) throw new Error("القيد المحاسبي فارغ");
  let debit=0,credit=0;
  lines.forEach(l=>{
    if(!Number.isFinite(l.debit)||!Number.isFinite(l.credit)||l.debit<0||l.credit<0||(l.debit&&l.credit)||(!l.debit&&!l.credit)) throw new Error("قيم القيد المحاسبي غير صحيحة");
    debit=accR(debit+l.debit); credit=accR(credit+l.credit);
  });
  if(debit!==credit) throw new Error("القيد المحاسبي غير متوازن");
  return {debit,credit};
}
async function accJournalCheck(tx,lines){
  accJournalTotals(lines);
  for(const code of new Set(lines.map(l=>l.account))){
    const a=await accAccountGet(tx,code);
    if(!a||!a.posting||!a.active) throw new Error(`الحساب ${code} غير متاح للقيد`);
  }
}
async function accAccountGet(tx,code){
  const {db,doc}=window.firebaseDB;
  const current=await tx.get(doc(db,"acc_accounts_v2",code));
  if(current.exists()) return current.data();
  const legacyCode=accLegacyAccountCode(code);
  if(legacyCode){
    const legacy=await tx.get(doc(db,"acc_accounts",legacyCode));
    if(legacy.exists()) return accNormalizeLegacyAccount(legacy.data());
  }
  const seed=PC_ACCOUNT_SEED.find(a=>a[0]===code);
  return seed?{code:seed[0],name:seed[1],parent:seed[2],type:seed[3],posting:seed[4],active:true}:null;
}
function accJournalEntries(){
  return [...accList("accSupplierTx",accSupplierTx),...accList("accExpenses",accExpenses)].filter(x=>!x.voided&&Array.isArray(x.journalLines)).map(x=>({...x,journalLines:x.journalLines.map(l=>({...l,account:accAccountCode(l.account,x.chartVersion)}))}));
}
function accChartBalance(code){
  const chart=accChart(), family=new Set([code]);
  let changed=true; while(changed){changed=false;chart.forEach(a=>{if(family.has(a.parent)&&!family.has(a.code)){family.add(a.code);changed=true;}});}
  let debit=0,credit=0;
  accJournalEntries().forEach(e=>e.journalLines.forEach(l=>{if(family.has(l.account)){debit+=l.debit;credit+=l.credit;}}));
  return {debit:accR(debit),credit:accR(credit),balance:accR(debit-credit)};
}
function accChartHtml(){
  const chart=accChart();
  return `<div class="pc112-bar">${accCan("accountsEdit")?`<button type="button" class="btn btn-main" onclick="accAccountEdit()">إضافة حساب</button>`:""}${accCan("export")?`<button type="button" class="btn btn-light" onclick="accChartExport()">تصدير الشجرة</button>`:""}</div>
  <p class="pc85-hint">شجرة حسابات المطاعم: الأصول، الالتزامات، حقوق الملكية، الإيرادات، التكاليف والمصروفات. الحساب الرئيسي للتجميع والحساب الفرعي للترحيل. الأرصدة أدناه تخص فواتير المشتريات وسندات الصرف المرتبطة الجديدة فقط؛ السجلات القديمة والمبيعات والهدر لم تُرحّل تلقائيًا.</p>
  <div class="premium-table-wrap"><table class="premium-table"><thead><tr><th>الكود</th><th>الحساب</th><th>النوع</th><th>المستوى</th><th>مدين</th><th>دائن</th><th>الحالة</th><th></th></tr></thead><tbody>${chart.map(a=>{
    const bal=accChartBalance(a.code), b=bal.balance;
    return `<tr><td dir="ltr">${escapeHtml(a.code)}</td><td style="padding-inline-start:${12+Math.min(a.code.length-1,8)*12}px">${a.posting?escapeHtml(a.name):`<b>${escapeHtml(a.name)}</b>`}</td><td>${PC_ACCOUNT_TYPES[a.type]||""}</td><td>${a.posting?"فرعي / ترحيل":"رئيسي / تجميعي"}</td><td>${b>0?accTxt(b):"—"}</td><td>${b<0?accTxt(-b):"—"}</td><td>${a.active?"نشط":"موقوف"}</td><td>${accCan("accountsEdit")?`<button type="button" class="mini-btn" data-code="${escapeHtml(a.code)}" onclick="accAccountEdit(this.dataset.code)">تعديل</button>`:""}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function accAccountRead(h,code){
  const parent=h.querySelector("#caParent").value, p=accAccount(parent);
  return {code:code||h.querySelector("#caCode").value.trim(),name:h.querySelector("#caName").value.trim(),parent,type:p?.type||accAccount(code)?.type,posting:h.querySelector("#caPosting").checked,active:h.querySelector("#caActive").checked};
}
function accAccountValidate(a,existing){
  if(!/^\d{1,12}$/.test(a.code)||!a.name) return "اكتب كودًا رقميًا واسم الحساب";
  if(!existing&&accAccount(a.code)) return "كود الحساب مستخدم";
  if(!PC_ACCOUNT_TYPES[a.type]) return "اختر حسابًا رئيسيًا";
  if(a.parent){const p=accAccount(a.parent);if(!p||p.posting||!p.active||p.type!==a.type||!a.code.startsWith(p.code)||a.code.length<=p.code.length) return "الحساب الأب يجب أن يكون رئيسيًا نشطًا وكود الحساب يبدأ بكوده";}
  else if(!existing) return "اختر الحساب الرئيسي";
  if(existing&&(a.parent!==existing.parent||a.type!==existing.type||a.posting!==existing.posting)) return "لا يمكن تغيير بنية حساب موجود؛ أضف حسابًا جديدًا";
  if(!a.active&&accChart().some(x=>x.parent===a.code&&x.active)) return "أوقف الحسابات التابعة أولًا";
  return "";
}
async function accAccountEdit(code){
  if(!accCan("accountsEdit")) return;
  const a=code?accAccount(code):null, parents=accChart().filter(x=>!x.posting&&x.active);
  const v=await pcSheet({title:a?"تعديل حساب":"إضافة حساب",icon:"fa-sitemap",body:`
    <label class="pc94-lb">الحساب الرئيسي</label><select id="caParent" class="pc93-name" ${a?"disabled":""}>${a&&!a.parent?'<option value="">جذر الشجرة</option>':""}${parents.map(p=>`<option value="${escapeHtml(p.code)}" ${p.code===a?.parent?"selected":""}>${escapeHtml(p.code+" — "+p.name)}</option>`).join("")}</select>
    <label class="pc94-lb">كود الحساب</label><input id="caCode" class="pc93-name" inputmode="numeric" dir="ltr" maxlength="12" value="${escapeHtml(a?.code||"")}" ${a?"disabled":""}>
    <label class="pc94-lb">اسم الحساب</label><input id="caName" class="pc93-name" maxlength="100" value="${escapeHtml(a?.name||"")}">
    <label class="pc110-adm"><input id="caPosting" type="checkbox" ${!a||a.posting?"checked":""} ${a?"disabled":""}> حساب فرعي يقبل الترحيل (أزل العلامة لإنشاء حساب رئيسي)</label>
    <label class="pc110-adm"><input id="caActive" type="checkbox" ${!a||a.active?"checked":""}> نشط</label>`,actions:[{label:"حفظ",kind:"btn-main",check:h=>accAccountValidate(accAccountRead(h,code),a),value:h=>accAccountRead(h,code)},{label:"إلغاء",kind:"btn-light",value:null}]});
  if(!v) return;
  try{
    const {db,doc,runTransaction}=window.firebaseDB;
    await runTransaction(db,async tx=>{
      const ref=doc(db,"acc_accounts_v2",v.code), snap=await tx.get(ref);
      if(!a&&snap.exists()) throw new Error("كود الحساب مستخدم");
      const error=accAccountValidate(v,a);if(error) throw new Error(error);
      if(v.parent){const p=await accAccountGet(tx,v.parent);if(!p||!p.active||p.posting) throw new Error("الحساب الأب غير متاح");}
      tx.set(ref,{...v,chartVersion:PC_CHART_VERSION,updatedAtMs:Date.now(),updatedBy:pcStoreByName()||""});
    });
    showToast("تم حفظ الحساب");pcAccDraw(true);
  }catch(e){showToast(e.message||"تعذر حفظ الحساب","error");}
}
function accChartExport(){
  if(!accCan("export")) return;
  accXlsx([["شجرة الحسابات",accChart().map(a=>{const b=accChartBalance(a.code).balance;return {"الكود":a.code,"الحساب":a.name,"الأب":a.parent,"النوع":PC_ACCOUNT_TYPES[a.type],"المستوى":a.posting?"فرعي":"رئيسي","نشط":a.active?"نعم":"لا","مدين":Math.max(0,b),"دائن":Math.max(0,-b)};})]],`chart-${pcHrToday()}.xlsx`);
}
