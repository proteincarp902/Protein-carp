const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {environment}=require('./helpers.cjs');
function formEnvironment(){
 const e=environment(),dom=new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>',{url:'https://example.test/'});
 Object.assign(e.c,{document:dom.window.document,requestAnimationFrame:fn=>fn(),pcSheetResolve:null,showToast:()=>{},pcByField:id=>`<input id="${id}" value="مسؤول">`,pcHrAddDays:()=> '2026-12-14'});
 const app=fs.readFileSync(require('node:path').resolve(__dirname,'../app.js'),'utf8');
 vm.runInContext(app.slice(app.indexOf('function pcSheetClose('),app.indexOf('\nfunction pcConfirm(')),e.c);
 return {...e,dom};
}
const ready=()=>new Promise(resolve=>setTimeout(resolve,5));
test('purchase form preserves invalid input, calculates item total and selects destination',async()=>{
 const e=formEnvironment(); const pending=e.c.accPurchaseEdit(e.supplier.id);await ready();
 const d=e.c.document,target=d.getElementById('piTarget');assert.equal(target.options.length,3);
 // Options with JSON IDs must survive HTML escaping and return the exact target.
 target.value=e.c.accPurchaseTargets()[1].id;e.c.accPurchaseChangeTarget();assert.equal(e.c.accPurchaseTarget().kind,'section');
 d.getElementById('piItem').value='food';e.c.accPurchaseItemChanged();assert.equal(d.getElementById('piUnit').textContent,'كجم');
 d.getElementById('piQty').value='2.5';d.getElementById('piPrice').value='40';e.c.accPurchaseAddLine();assert.equal(e.c.pcPurchaseDraft.length,1);assert.match(d.getElementById('piTotal').textContent,/115.00/);
 d.querySelector('[data-act="0"]').click();assert.match(d.getElementById('piError').textContent,/رقم فاتورة/);assert.ok(d.getElementById('piLines').textContent.includes('100.00'));
 target.value='central';e.c.accPurchaseChangeTarget();assert.equal(target.value,e.c.accPurchaseTargets()[1].id);assert.equal(e.c.pcPurchaseDraft.length,1);
 d.querySelector('[data-act="1"]').click();await pending;
});
test('expense form shows real posting accounts and keeps invalid values for correction',async()=>{
 const e=formEnvironment();const pending=e.c.accVoucherEdit('expense');await ready();const d=e.c.document;
 assert.equal(d.getElementById('pvExpense').value,'7145');assert.equal(d.getElementById('pvAccount').value,'1211');
 assert.ok([...d.getElementById('pvExpense').options].every(o=>e.c.accAccount(o.value).posting));
 d.getElementById('pvAmount').value='-20';d.querySelector('[data-act="0"]').click();assert.match(d.getElementById('pvError').textContent,/أكبر من صفر/);assert.equal(d.getElementById('pvAmount').value,'-20');
 d.querySelector('[data-act="1"]').click();await pending;
});
test('chart and voucher history escape names and render grouped accounts',()=>{
 const e=formEnvironment();e.c.pcRaw.accAccountsV2=[{code:'7127',name:'<img src=x onerror=alert(1)>',parent:'712',type:'expense',posting:true,active:true}];
 e.c.document.body.innerHTML=e.c.accChartHtml();assert.equal(e.c.document.querySelectorAll('img').length,0);assert.ok(e.c.document.querySelectorAll('tbody tr').length>=100);
 e.c.pcRaw.accExpenses=[{id:'x',date:'2026-11-14',payee:'<script>bad</script>',amount:10,branchId:'b1',category:'إيجار',method:'نقدي'}];e.c.document.body.innerHTML=e.c.accVoucherHtml();assert.equal(e.c.document.querySelectorAll('script').length,0);assert.match(e.c.document.body.textContent,/<script>bad<\/script>/);
});
