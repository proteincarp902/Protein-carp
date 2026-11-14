const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {environment}=require('./helpers.cjs');
const {source}=require('./hr-helpers.cjs');
const app=fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8');
function setup(){
 const e=environment(),c=e.c;
 Object.assign(c,{pcEmpSessionRaw:()=>false,pcEmpIsAdmin:()=>false,pcCan:()=>true,pc19Branch:'all',pc126Scope:'open',pc126BuyOnly:false,pc19WarehouseTab:'sum',pcBranchName:id=>id==='b1'?'فرع 1':'فرع 2',pc70Category:()=> 'غذائية',pc90Unavailable:w=>!!w.unavailable,pc19OrderNo:o=>String(o.orderId||o.id),pcOrdFind:id=>c.pcRaw.warehouseOrders.find(o=>o.id===id),showToast:()=>{}});
 const a=app.indexOf('var PC70_UNITS ='),b=app.indexOf('function pc70Step(',a);vm.runInContext(app.slice(a,b),c);
 for(const name of ['pcStoreConv','pc86Stock','pc126Can','pc126Open','pc126Item','pc126Rows','pc126Shown','pc126BySec','pc126Html','pc126Table','pc126OpenOriginal','pc126Print','pc126Excel'])vm.runInContext(source(name),c);
 c.warehouseItems=[{id:'rice',code:'101',name:'أرز',unit:'كجم',stockQty:20},{id:'milk',code:'102',name:'حليب',unit:'لتر',stockQty:3},{id:'box',code:'103',name:'علب',unit:'حبة',stockQty:100}];
 c.pcRaw.warehouseOrders=[
 {id:'o1',orderId:101,branchId:'b1',section:'الحلا',chefName:'شيف 1',status:'جديد',items:[{itemId:'rice',name:'أرز',qty:2,unit:'كجم'},{itemId:'milk',name:'حليب',qty:500,unit:'مل'},{itemId:'box',name:'علب',qty:2,unit:'حبة'}]},
 {id:'o2',orderId:102,branchId:'b2',section:'الحلا',chefName:'شيف 2',status:'جديد',items:[{itemId:'rice',name:'أرز',qty:3000,unit:'جرام'},{itemId:'box',name:'علب',qty:1,unit:'كرتون'}]},
 {id:'o3',orderId:103,branchId:'b1',section:'الحار',chefName:'شيف 3',status:'قيد الصرف',issueStatus:'قيد التجهيز',items:[{itemId:'rice',name:'أرز',qty:1,unit:'كجم'}]},
 {id:'delivered',orderId:104,branchId:'b2',section:'الحار',status:'تم الصرف',issueStatus:'قيد التجهيز',items:[{itemId:'rice',name:'أرز',qty:500,unit:'جرام'}]}];
 c.warehouseOrders=[c.pcRaw.warehouseOrders[0]];return {...e,c};
}
test('same stock item consolidates cross-section quantities in the catalog unit with original references',()=>{
 const {c}=setup(),data=c.pc126Rows(),rice=data.rows.find(r=>r.w.id==='rice');assert.equal(data.orders.length,3);assert.equal(rice.total,6);assert.equal(rice.unit,'كجم');assert.equal(rice.stock,20);assert.equal(rice.short,0);assert.equal(rice.by.length,3);assert.equal(c.pc126BySec(rice).length,3);assert.ok(rice.by.some(x=>x.id==='o2'&&x.q===3&&x.sourceQty===3000&&x.sourceUnit==='جرام'));
 assert.equal(data.rows.find(r=>r.w.id==='milk').total,.5);
});
test('incompatible carton/piece quantities stay separate and uncomparable stock stays unknown',()=>{
 const {c}=setup(),boxes=c.pc126Rows().rows.filter(r=>r.w.id==='box');assert.equal(boxes.length,2);const carton=boxes.find(r=>r.unit==='كرتون'),pieces=boxes.find(r=>r.unit==='حبة');assert.equal(carton.total,1);assert.equal(carton.stock,null);assert.equal(carton.short,null);assert.equal(pieces.total,2);assert.equal(pieces.stock,100);
});
test('delivered, received, cancelled and legacy delivered orders never reappear because of stale preparation status',()=>{
 const {c}=setup(),base=c.pcRaw.warehouseOrders[0];for(const status of ['تم الصرف','تم الاستلام','جاهز','ملغي','ملغى','محذوف','تم الإلغاء'])assert.equal(c.pc126Open({...base,status,issueStatus:'قيد التجهيز'}),false,status);
 assert.equal(c.pc126Open({...base,issuedAtMs:123}),false);assert.equal(c.pc126Open({...base,issueStatus:'صرف جزئي'}),false);c.pc126Scope='new';assert.equal(c.pc126Rows().orders.length,2);c.pc19Branch='b1';assert.equal(c.pc126Rows().orders.length,1);assert.equal(c.pc126Rows().rows.find(r=>r.w.id==='rice').total,2);
});
test('different explicit IDs or codes are not collapsed just because display names match',()=>{
 const {c}=setup();c.pcRaw.warehouseOrders[0].items=[{itemId:'rice',name:'أرز',qty:2,unit:'كجم'},{itemId:'unknown-rice',name:'أرز',qty:5,unit:'كجم'},{code:'different-code',name:'أرز',qty:7,unit:'كجم'}];c.pc19Branch='b1';c.pc126Scope='new';const rows=c.pc126Rows().rows;assert.equal(rows.length,3);assert.equal(rows.filter(r=>r.w).length,1);assert.equal(rows.find(r=>r.w).total,2);
});
test('ambiguous legacy names are kept per source line instead of guessed',()=>{
 const {c}=setup();c.warehouseItems.push({id:'other-rice',name:'أرز',unit:'كجم',stockQty:1});c.pcRaw.warehouseOrders[0].items=[{name:'أرز',qty:2,unit:'كجم'},{name:'أرز',qty:3,unit:'كجم'}];c.pc19Branch='b1';c.pc126Scope='new';const rows=c.pc126Rows().rows;assert.equal(rows.length,2);assert.ok(rows.every(r=>r.unresolved&&r.stock===null));
});
test('repeated lines add quantities but count one original order and duplicate snapshots are ignored',()=>{
 const {c}=setup(),order=c.pcRaw.warehouseOrders[0];order.items=[{itemId:'rice',name:'أرز',qty:2,unit:'كجم'},{itemId:'rice',name:'أرز',qty:1,unit:'كجم'}];c.pcRaw.warehouseOrders.push(order);c.pc19Branch='b1';c.pc126Scope='new';const data=c.pc126Rows(),groups=c.pc126BySec(data.rows[0]);assert.equal(data.orders.length,1);assert.equal(data.rows[0].total,3);assert.equal(groups[0].orders.length,1);assert.equal(groups[0].q,3);assert.equal(groups[0].nos.length,1);
});
test('nonfinite, negative, empty and unrepresentable quantities are skipped with an explicit warning',()=>{
 const {c}=setup();c.pcRaw.warehouseOrders[0].items=[Infinity,NaN,-1,0,.00001].map(qty=>({itemId:'rice',name:'أرز',qty,unit:'كجم'}));c.pc19Branch='b1';c.pc126Scope='new';const data=c.pc126Rows();assert.equal(data.rows.length,0);assert.equal(data.orders.length,0);assert.equal(data.skipped,5);assert.match(c.pc126Html(),/غير صحيحة/);
});
test('live source changes update the consolidated view without mutating section orders or stock',()=>{
 const {c}=setup(),before=JSON.stringify(c.pcRaw.warehouseOrders),stock=JSON.stringify(c.warehouseItems);c.pc126Html();c.pc126Rows();assert.equal(JSON.stringify(c.pcRaw.warehouseOrders),before);assert.equal(JSON.stringify(c.warehouseItems),stock);c.pcRaw.warehouseOrders[0].status='تم الصرف';assert.equal(c.pc126Rows().rows.find(r=>r.w?.id==='rice').total,4);
});
test('shortage filter includes unknown stock and is identical in UI, print and Excel',()=>{
 const {c}=setup();c.warehouseItems[0].stockQty=4;c.pc126BuyOnly=true;assert.equal(c.pc126Shown(c.pc126Rows().rows).length,2);let printed='';c.openPrintReport=(_,html)=>printed=html;c.pc126Print();assert.ok(printed.includes('أرز'));assert.ok(!printed.includes('حليب'));assert.ok(!printed.includes('<button'));assert.ok(printed.includes('101'));assert.ok(printed.includes('102'));assert.ok(printed.includes('103'));assert.ok(!printed.includes('104'));
 const sheets=[];c.XLSX={utils:{book_new:()=>({}),json_to_sheet:data=>data,book_append_sheet:(_,rows,name)=>sheets.push({rows,name})},writeFile:()=>{}};c.pc126Excel();assert.equal(sheets[0].rows.length,2);assert.equal(sheets[1].rows.length,4);assert.equal(sheets[2].rows.length,2);assert.ok(sheets[1].rows.some(r=>r['الكمية الأصلية']===3000&&r['الكمية بوحدة المستودع']===3));
});
test('original request links keep section delivery separate and escape user-controlled text',()=>{
 const {c}=setup();let opened;c.renderOrder=(id,as)=>opened={id,as};c.pc126OpenOriginal('o2');assert.equal(opened.id,'o2');assert.equal(opened.as,'warehouse');c.pcRaw.warehouseOrders[0].section='<img src=x onerror=alert(1)>';c.pcRaw.warehouseOrders[0].orderId='"><script>bad</script>';const html=c.pc126Html();assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('pc126OpenOriginal(this.dataset.id)'));
});
test('authenticated users without warehouse permission cannot read, export or open the consolidated request',()=>{
 const {c}=setup();c.pcEmpSessionRaw=()=>true;c.pcCan=()=>false;assert.equal(c.pc126Rows().rows.length,0);assert.match(c.pc126Html(),/ليس لديك صلاحية/);c.renderOrder=()=>assert.fail('must not open');c.openPrintReport=()=>assert.fail('must not print');c.XLSX={utils:{book_new:()=>assert.fail('must not export')}};c.pc126OpenOriginal('o1');c.pc126Print();c.pc126Excel();
});
