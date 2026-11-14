const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=require('node:path').resolve(__dirname,'..');
const {environment}=require('./helpers.cjs');
test('seed chart has unique codes, valid parents and posting accounts',()=>{
 const {c}=environment(), accounts=c.accChart();assert.ok(accounts.length>=100);assert.equal(new Set(accounts.map(a=>a.code)).size,accounts.length);
 for(const a of accounts){if(!a.parent)continue;const p=accounts.find(x=>x.code===a.parent);assert.ok(p);assert.equal(p.posting,false);assert.equal(p.type,a.type);assert.ok(a.code.startsWith(p.code));}
});
test('main-warehouse purchase creates supplier bill, balanced journal and stock exactly once',async()=>{
 const e=environment(),v=e.invoice();v.lines.push({...v.lines[0],qty:3,total:150});v.base=250;v.vat=37.5;v.amount=287.5;
 await e.c.accPurchaseSave(e.supplier,v);assert.equal(e.records.get('warehouse_items/food').stockQty,15);
 const id=await e.c.accPurchaseDocId(e.supplier.id,v.ref),bill=e.records.get('acc_supplier_tx/'+id);assert.equal(bill.amount,287.5);assert.equal(bill.items.length,2);assert.equal(bill.journalLines[0].account,'1231');e.c.accJournalTotals(bill.journalLines);
 await assert.rejects(()=>e.c.accPurchaseSave(e.supplier,v),/مسجل/);assert.equal(e.records.get('warehouse_items/food').stockQty,15);
});
test('first purchase initializes an untracked central item',async()=>{const e=environment();e.records.get('warehouse_items/food').stockQty=null;await e.c.accPurchaseSave(e.supplier,e.invoice());assert.equal(e.records.get('warehouse_items/food').stockQty,2);});
for(const store of ['raw','prod'])test('section '+store+' purchase posts a positive receipt without changing main inventory',async()=>{
 const e=environment(),v=e.invoice('section',store);await e.c.accPurchaseSave(e.supplier,v);
 const id=await e.c.accPurchaseDocId(e.supplier.id,v.ref),move=e.records.get('branch_stock_moves/'+id);assert.equal(move.type,'purchase');assert.equal(move.store,store);assert.equal(move.branchId,'b1');assert.equal(move.section,'المطبخ');assert.equal(move.lines[0].qty,2);assert.equal(e.records.get('warehouse_items/food').stockQty,10);
 const app=fs.readFileSync(root+'/app.js','utf8');const fn=app.slice(app.indexOf('function pcStoreMoves('),app.indexOf('\nfunction pcStoreBalances('));
 Object.assign(e.c,{pcStoreStart:()=>1,pcStoreRawList:(k,fb)=>k==='branchStockMoves'?[move]:[],pcStoreMine:x=>x,pcStoreMs:x=>x.timeMs,pcStoreSecOf:x=>x.section,warehouseOrders:[],productionLogs:[],wasteLogs:[],branchStockMoves:[],stockTransfers:[],currentBranch:'b1'});
 vm.runInContext(fn,e.c);const movements=e.c.pcStoreMoves(store,'المطبخ');assert.equal(movements.length,1);assert.equal(movements[0].sign,1);
});
test('failed stock or journal validation leaves no invoice or stock changes',async()=>{
 const e=environment();e.records.delete('warehouse_items/food');await assert.rejects(()=>e.c.accPurchaseSave(e.supplier,e.invoice()),/لم يعد موجودًا/);assert.equal(e.writes,0);
 const f=environment();f.records.set('acc_accounts_v2/1231',{code:'1231',posting:true,active:false});await assert.rejects(()=>f.c.accPurchaseSave(f.supplier,f.invoice()),/غير متاح/);assert.equal(f.writes,0);assert.equal(f.records.get('warehouse_items/food').stockQty,10);
});
test('changed item units and inactive branch block posting atomically',async()=>{
 const e=environment();e.records.get('warehouse_items/food').unit='جرام';await assert.rejects(()=>e.c.accPurchaseSave(e.supplier,e.invoice()),/وحدة/);assert.equal(e.writes,0);
 const f=environment();f.records.get('branches/b1').active=false;await assert.rejects(()=>f.c.accPurchaseSave(f.supplier,f.invoice('section')),/غير مفعلة/);assert.equal(f.writes,0);
});
test('central purchase cancellation reverses stock once and preserves audit',async()=>{
 const e=environment(),v=e.invoice();await e.c.accPurchaseSave(e.supplier,v);const id=await e.c.accPurchaseDocId(e.supplier.id,v.ref);
 await e.c.accPurchaseVoid('acc_supplier_tx',id,{why:'خطأ إدخال',by:'مدير'});assert.equal(e.records.get('warehouse_items/food').stockQty,10);assert.equal(e.records.get('acc_supplier_tx/'+id).voidReason,'خطأ إدخال');
 await assert.rejects(()=>e.c.accPurchaseVoid('acc_supplier_tx',id,{why:'مرة ثانية',by:'مدير'}),/بالفعل/);assert.equal(e.records.get('warehouse_items/food').stockQty,10);
});
test('cannot reverse central invoice when goods have already been issued',async()=>{
 const e=environment(),v=e.invoice();await e.c.accPurchaseSave(e.supplier,v);const id=await e.c.accPurchaseDocId(e.supplier.id,v.ref);e.records.get('warehouse_items/food').stockQty=1;
 await assert.rejects(()=>e.c.accPurchaseVoid('acc_supplier_tx',id,{why:'إلغاء',by:'مدير'}),/لا يكفي/);assert.equal(e.records.get('acc_supplier_tx/'+id).voided,undefined);assert.equal(e.records.get('warehouse_items/food').stockQty,1);
});
test('section cancellation cancels linked inventory movement and invoice together',async()=>{
 const e=environment(),v=e.invoice('section');await e.c.accPurchaseSave(e.supplier,v);const id=await e.c.accPurchaseDocId(e.supplier.id,v.ref);await e.c.accPurchaseVoid('acc_supplier_tx',id,{why:'إلغاء',by:'مدير'});assert.equal(e.records.get('branch_stock_moves/'+id).cancelled,true);assert.equal(e.records.get('acc_supplier_tx/'+id).voided,true);
});
test('invalid quantities and empty invoice are rejected',()=>{
 const e=environment();for(const qty of [-1,0,NaN,Infinity]){const v=e.invoice();v.lines[0].qty=qty;assert.match(e.c.accPurchaseValidate(v,e.supplier),/كميات/);}
 const v=e.invoice();v.lines=[];assert.match(e.c.accPurchaseValidate(v,e.supplier),/أصناف/);
});
for(const kind of ['supplier','expense'])test(kind+' voucher posts once with correct debit and credit accounts',async()=>{
 const e=environment(),v=e.voucher(kind),col=kind==='supplier'?'acc_supplier_tx':'acc_expenses',ref=e.firebase.doc(e.firebase.db,col,'voucher1');await e.c.accVoucherSave(v,ref);await e.c.accVoucherSave(v,ref);const entry=e.records.get(ref.path);assert.equal(e.writes,1);assert.equal(entry.amount,50);assert.equal(entry.journalLines[0].account,kind==='supplier'?'2211':'7121');assert.equal(entry.journalLines[1].account,'1211');assert.ok(entry.voucherNo.startsWith('PV-20261114-'));assert.equal(entry.type,kind==='supplier'?'payment':'expense');e.c.accJournalTotals(entry.journalLines);
});
test('voucher cancellation removes journal impact without deleting history',async()=>{
 const e=environment(),ref=e.firebase.doc(e.firebase.db,'acc_expenses','voucher1');await e.c.accVoucherSave(e.voucher('expense'),ref);e.c.pcRaw.accExpenses=[{id:ref.id,...e.records.get(ref.path)}];assert.equal(e.c.accChartBalance('7').balance,50);
 await e.c.accPurchaseVoid('acc_expenses',ref.id,{why:'مكرر',by:'مدير'});e.c.pcRaw.accExpenses=[{id:ref.id,...e.records.get(ref.path)}];assert.equal(e.c.accChartBalance('7').balance,0);assert.equal(e.records.get(ref.path).voided,true);
});
test('journal rejects nonposting, disabled and unbalanced accounts',async()=>{
 const e=environment();assert.throws(()=>e.c.accJournalTotals([{account:'1211',debit:2,credit:0},{account:'2211',debit:0,credit:1}]),/متوازن/);
 const v=e.voucher('expense');v.expenseAccount='71';assert.match(e.c.accVoucherValidate(v),/المصروف/);v.expenseAccount='7121';e.records.set('acc_accounts_v2/7121',{code:'7121',active:false,posting:true});await assert.rejects(()=>e.c.accVoucherSave(v,e.firebase.doc(e.firebase.db,'acc_expenses','bad')),/غير متاح/);assert.equal(e.writes,0);
});
test('account validation prevents cycles, duplicate codes and structural changes',()=>{
 const {c}=environment(),parent=c.accAccount('71');assert.ok(c.accAccountValidate({code:'71',name:'dup',parent:'7',type:'expense',posting:false,active:true},null));
 assert.ok(c.accAccountValidate({...parent,parent:'712'},parent));assert.ok(c.accAccountValidate({code:'8888',name:'bad',parent:'71',type:'expense',posting:true,active:true},null));assert.equal(c.accAccountValidate({code:'715',name:'مصروف جديد',parent:'71',type:'expense',posting:false,active:true},null),'');
});
test('unauthorized postings fail without writes',async()=>{
 const e=environment();e.permissions.add('sales');await assert.rejects(()=>e.c.accPurchaseSave(e.supplier,e.invoice()),/صلاحية/);await assert.rejects(()=>e.c.accVoucherSave(e.voucher('expense'),e.firebase.doc(e.firebase.db,'acc_expenses','bad')),/صلاحية/);assert.equal(e.writes,0);
});

test('chart uses the requested top-level numbers and current/noncurrent ordering',()=>{
 const {c}=environment();
 const expected={'1':'الأصول','11':'الأصول الثابتة','12':'الأصول المتداولة','2':'الالتزامات','21':'الالتزامات غير المتداولة','22':'الالتزامات المتداولة','3':'حقوق الملكية','5':'الإيرادات','6':'التكاليف','7':'المصروفات'};
 for(const [code,name] of Object.entries(expected))assert.equal(c.accAccount(code).name,name);
 assert.equal(c.accAccount('4'),undefined);assert.equal(c.accAccount('6111').type,'cost');assert.equal(c.accAccount('7121').type,'expense');assert.equal(c.accAccount('1211').name,'الصندوق الرئيسي');assert.equal(c.accAccount('1111').name,'معدات وأجهزة المطبخ');
});
test('legacy journals retain balances under new codes without rewriting stored entries',()=>{
 const {c}=environment();const old={id:'old',journalLines:[{account:'1131',debit:100,credit:0},{account:'1141',debit:15,credit:0},{account:'2111',debit:0,credit:115}]};
 const current={id:'new',chartVersion:2,journalLines:[{account:'1231',debit:200,credit:0},{account:'1241',debit:30,credit:0},{account:'2211',debit:0,credit:230}]};
 c.pcRaw.accSupplierTx=[old,current];assert.equal(c.accChartBalance('1231').balance,300);assert.equal(c.accChartBalance('1241').balance,45);assert.equal(c.accChartBalance('2211').balance,-345);assert.equal(c.accChartBalance('1').balance,345);
 assert.equal(old.journalLines[0].account,'1131');assert.equal(current.journalLines[0].account,'1231');
 c.pcRaw.accExpenses=[{journalLines:[{account:'5111',debit:10,credit:0},{account:'1111',debit:0,credit:10}]}];assert.equal(c.accChartBalance('6').balance,10);assert.equal(c.accChartBalance('7').balance,0);assert.equal(c.accChartBalance('1211').balance,-10);
});
test('legacy custom accounts map to the proper branch and v2 overrides are isolated',()=>{
 const {c}=environment();c.pcRaw.accAccounts=[{code:'1111',name:'صندوق قديم',parent:'111',type:'asset',posting:true,active:false},{code:'5115',name:'تكلفة خاصة',parent:'511',type:'expense',posting:true,active:true}];
 assert.equal(c.accAccount('1211').name,'صندوق قديم');assert.equal(c.accAccount('1211').active,false);assert.equal(c.accAccount('1111').name,'معدات وأجهزة المطبخ');assert.equal(c.accAccount('6115').type,'cost');assert.equal(c.accAccount('6115').parent,'611');
 c.pcRaw.accAccountsV2=[{code:'1211',name:'صندوق جديد',parent:'121',type:'asset',posting:true,active:true,chartVersion:2}];assert.equal(c.accAccount('1211').name,'صندوق جديد');assert.equal(c.accAccount('1111').name,'معدات وأجهزة المطبخ');
});
test('transaction validation reads the corresponding legacy override, not a reused code',async()=>{
 const e=environment();e.records.set('acc_accounts/1111',{code:'1111',name:'صندوق',parent:'111',type:'asset',posting:true,active:false});
 await assert.rejects(()=>e.c.accVoucherSave(e.voucher('expense'),e.firebase.doc(e.firebase.db,'acc_expenses','blocked')),/غير متاح/);assert.equal(e.writes,0);
 e.records.set('acc_accounts_v2/1211',{code:'1211',name:'صندوق',parent:'121',type:'asset',posting:true,active:true,chartVersion:2});await e.c.accVoucherSave(e.voucher('expense'),e.firebase.doc(e.firebase.db,'acc_expenses','ok'));assert.equal(e.records.get('acc_expenses/ok').chartVersion,2);
 assert.equal(e.records.get('acc_accounts/1111').active,false);
});
