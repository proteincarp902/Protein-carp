/* Restaurant chart of accounts. Defaults are stable codes; customizations are stored by code. */
var accAccounts=[];
var PC_ACCOUNT_TYPES={asset:"أصول",liability:"التزامات",equity:"حقوق ملكية",income:"إيرادات",expense:"مصروفات"};
var PC_ACCOUNT_SEED=[
 ["1","الأصول","","asset",false],["11","الأصول المتداولة","1","asset",false],
 ["111","النقدية والبنوك","11","asset",false],["1111","الصندوق الرئيسي","111","asset",true],["1112","الحساب البنكي","111","asset",true],["1113","عهد الموظفين","111","asset",true],["1114","متحصلات نقاط البيع بالطريق","111","asset",true],
 ["112","الذمم المدينة","11","asset",false],["1121","العملاء","112","asset",true],["1122","مستحقات تطبيقات التوصيل","112","asset",true],["1123","سلف الموظفين","112","asset",true],["1124","دفعات مقدمة للموردين","112","asset",true],
 ["113","المخزون","11","asset",false],["1131","مخزون المستودع الرئيسي","113","asset",true],["1132","مخزون خامات الأقسام","113","asset",true],["1133","مخزون الإنتاج الجاهز","113","asset",true],["1134","مخزون التعبئة والتغليف","113","asset",true],
 ["114","الضرائب والمصروفات المقدمة","11","asset",false],["1141","ضريبة مدخلات قابلة للاسترداد","114","asset",true],["1142","إيجارات مدفوعة مقدمًا","114","asset",true],["1143","تأمينات لدى الغير","114","asset",true],["1144","مصروفات مدفوعة مقدمًا","114","asset",true],
 ["12","الأصول غير المتداولة","1","asset",false],["121","الأصول الثابتة","12","asset",false],["1211","معدات وأجهزة المطبخ","121","asset",true],["1212","أثاث وتجهيزات المطعم","121","asset",true],["1213","سيارات ووسائل نقل","121","asset",true],["1214","أجهزة حاسب وأنظمة","121","asset",true],["1215","تحسينات على مبانٍ مستأجرة","121","asset",true],["122","مجمع الإهلاك","12","asset",false],["1221","مجمع إهلاك المعدات","122","asset",true],["1222","مجمع إهلاك الأثاث","122","asset",true],["1223","مجمع إهلاك السيارات","122","asset",true],["1224","مجمع إهلاك الحاسب والتحسينات","122","asset",true],
 ["2","الالتزامات","","liability",false],["21","الالتزامات المتداولة","2","liability",false],["211","الدائنون","21","liability",false],["2111","حساب مراقبة الموردين","211","liability",true],["2112","مصاريف مستحقة","211","liability",true],["2113","رواتب مستحقة","211","liability",true],["2114","تأمينات اجتماعية مستحقة","211","liability",true],
 ["212","الضرائب والرسوم","21","liability",false],["2121","ضريبة المخرجات","212","liability",true],["2122","ضريبة قيمة مضافة مستحقة السداد","212","liability",true],["2123","زكاة وضريبة دخل مستحقة","212","liability",true],["213","التزامات أخرى متداولة","21","liability",false],["2131","اشتراكات ودفعات عملاء مقدمة","213","liability",true],["2132","قروض قصيرة الأجل","213","liability",true],
 ["22","الالتزامات غير المتداولة","2","liability",false],["221","قروض ومخصصات","22","liability",false],["2211","قروض طويلة الأجل","221","liability",true],["2212","مخصص مكافأة نهاية الخدمة","221","liability",true],
 ["3","حقوق الملكية","","equity",false],["31","رأس المال والأرباح","3","equity",false],["311","حسابات الملاك","31","equity",false],["3111","رأس المال","311","equity",true],["3112","جاري الشركاء","311","equity",true],["3113","مسحوبات الملاك","311","equity",true],["312","الأرباح والاحتياطيات","31","equity",false],["3121","أرباح محتجزة","312","equity",true],["3122","احتياطي نظامي","312","equity",true],["3123","نتيجة العام","312","equity",true],
 ["4","الإيرادات","","income",false],["41","إيرادات النشاط","4","income",false],["411","مبيعات المطعم","41","income",false],["4111","مبيعات نقاط البيع","411","income",true],["4112","مبيعات تطبيقات التوصيل","411","income",true],["4113","إيرادات الاشتراكات","411","income",true],["4114","الطلبات أونلاين","411","income",true],["4115","مردودات وخصومات المبيعات","411","income",true],["42","إيرادات أخرى","4","income",false],["421","الإيرادات المتنوعة","42","income",false],["4211","إيرادات متنوعة","421","income",true],
 ["5","التكاليف والمصروفات","","expense",false],["51","تكاليف التشغيل المباشرة","5","expense",false],["511","تكلفة المبيعات","51","expense",false],["5111","تكلفة المواد الغذائية","511","expense",true],["5112","تكلفة مواد التعبئة والتغليف","511","expense",true],["5113","هدر وتالف مخزون","511","expense",true],["5114","فروق الجرد","511","expense",true],
 ["52","المصروفات العامة والإدارية","5","expense",false],["521","الرواتب ومنافع العاملين","52","expense",false],["5211","رواتب وأجور","521","expense",true],["5212","بدلات وسكن ونقل","521","expense",true],["5213","تأمينات اجتماعية","521","expense",true],["5214","تأمين طبي ومنافع موظفين","521","expense",true],["5215","مكافأة نهاية الخدمة","521","expense",true],
 ["522","مصروفات المقر والتشغيل","52","expense",false],["5221","إيجارات","522","expense",true],["5222","كهرباء ومياه وغاز","522","expense",true],["5223","صيانة وإصلاح","522","expense",true],["5224","نظافة ومستهلكات","522","expense",true],["5225","اتصالات وإنترنت","522","expense",true],["5226","رخص ورسوم حكومية","522","expense",true],
 ["523","مصروفات البيع والتوزيع","52","expense",false],["5231","تسويق وإعلان","523","expense",true],["5232","عمولات تطبيقات التوصيل","523","expense",true],["5233","رسوم البنوك ونقاط البيع","523","expense",true],["5234","توصيل ومحروقات","523","expense",true],
 ["524","مصروفات إدارية أخرى","52","expense",false],["5241","قرطاسية ومطبوعات","524","expense",true],["5242","خدمات مهنية ومحاسبية","524","expense",true],["5243","برامج واشتراكات","524","expense",true],["5244","إهلاك واستهلاك","524","expense",true],["5245","مصروفات متنوعة","524","expense",true],["5246","زكاة وضريبة دخل","524","expense",true]
];
function accChart(){
  const map=new Map(PC_ACCOUNT_SEED.map(([code,name,parent,type,posting])=>[code,{code,name,parent,type,posting,active:true}]));
  accList("accAccounts",accAccounts).forEach(a=>map.set(a.code,{...a}));
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
  const {db,doc}=window.firebaseDB;
  for(const code of new Set(lines.map(l=>l.account))){
    const snap=await tx.get(doc(db,"acc_accounts",code));
    const a=snap.exists()?snap.data():accAccount(code);
    if(!a||!a.posting||!a.active) throw new Error(`الحساب ${code} غير متاح للقيد`);
  }
}
function accJournalEntries(){
  return [...accList("accSupplierTx",accSupplierTx),...accList("accExpenses",accExpenses)].filter(x=>!x.voided&&Array.isArray(x.journalLines));
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
  <p class="pc85-hint">شجرة حسابات المطاعم: الأصول، الالتزامات، حقوق الملكية، الإيرادات والمصروفات. الحساب الرئيسي للتجميع والحساب الفرعي للترحيل. الأرصدة أدناه تخص فواتير المشتريات وسندات الصرف المرتبطة الجديدة فقط؛ السجلات القديمة والمبيعات والهدر لم تُرحّل تلقائيًا.</p>
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
      const ref=doc(db,"acc_accounts",v.code), snap=await tx.get(ref);
      if(!a&&snap.exists()) throw new Error("كود الحساب مستخدم");
      const error=accAccountValidate(v,a);if(error) throw new Error(error);
      if(v.parent){const ps=await tx.get(doc(db,"acc_accounts",v.parent)); const p=ps.exists()?ps.data():accAccount(v.parent);if(!p||!p.active||p.posting) throw new Error("الحساب الأب غير متاح");}
      tx.set(ref,{...v,updatedAtMs:Date.now(),updatedBy:pcStoreByName()||""});
    });
    showToast("تم حفظ الحساب");pcAccDraw(true);
  }catch(e){showToast(e.message||"تعذر حفظ الحساب","error");}
}
function accChartExport(){
  if(!accCan("export")) return;
  accXlsx([["شجرة الحسابات",accChart().map(a=>{const b=accChartBalance(a.code).balance;return {"الكود":a.code,"الحساب":a.name,"الأب":a.parent,"النوع":PC_ACCOUNT_TYPES[a.type],"المستوى":a.posting?"فرعي":"رئيسي","نشط":a.active?"نعم":"لا","مدين":Math.max(0,b),"دائن":Math.max(0,-b)};})]],`chart-${pcHrToday()}.xlsx`);
}
