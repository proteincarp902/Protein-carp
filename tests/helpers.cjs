const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=require('node:path').resolve(__dirname,'..');
function environment(){
  const records=new Map(), permissions=new Set(), supplier={id:'supplier1',name:'مورد تجريبي',vat:'300000000000003'};
  let writes=0;
  const snap=(path)=>{const data=records.get(path);return {id:path.split('/').at(-1),exists:()=>data!==undefined,data:()=>structuredClone(data)};};
  const firebase={db:{},doc:(...args)=>{const p=args[0]?.path;return {path:p?p+'/'+(args[1]||'auto1'):args.slice(1).join('/'),id:p?(args[1]||'auto1'):args.at(-1)};},collection:(_,name)=>({path:name})};
  firebase.runTransaction=async(_,callback)=>{
    const pending=[];let writing=false;
    const tx={get:async ref=>{assert.equal(writing,false,'transaction must read before writing');return snap(ref.path);},set:(ref,data)=>{writing=true;pending.push(['set',ref,data]);},update:(ref,data)=>{writing=true;pending.push(['update',ref,data]);}};
    const result=await callback(tx);
    for(const [type,ref,data] of pending){if(type==='update')assert.ok(records.has(ref.path));records.set(ref.path,structuredClone(type==='set'?data:{...records.get(ref.path),...data}));writes++;}
    return result;
  };
  const c={console,crypto:webcrypto,TextEncoder,Date,Map,Set,Number,JSON,window:{firebaseDB:firebase},
    pcRaw:{chefSections:[{id:'s1',branchId:'b1',name:'المطبخ'}]},chefSections:[],warehouseItems:[{id:'food',name:'دجاج',unit:'كجم'}],menuItems:[{id:'meal',name:'وجبة',unit:'حبة'}],
    accSupplierTx:[],accSuppliers:[supplier],accExpenses:[],pcAcc:{month:'2026-11',branch:''},
    accCan:k=>permissions.size===0||permissions.has(k),pcCan:k=>permissions.size===0||permissions.has(k.replace(/^acc\./,"")),
    accR:n=>Math.round((Number(n)||0)*100)/100,accNum:v=>String(v??'').trim()===''?NaN:Number(v),pc70R:n=>Math.round(Number(n)*1000)/1000,pc70Unit:u=>u,
    pc86Stock:i=>i.stockQty==null||i.stockQty===''||!Number.isFinite(Number(i.stockQty))?null:Number(i.stockQty),
    pcBranchOf:x=>x.branchId||'main',pcActiveBranches:()=>[{id:'b1',name:'فرع 1',active:true,stockStartMs:1}],pcSecFilter:(_,__,items)=>items,
    accList:(key,fallback)=>c.pcRaw[key]||fallback||[],accSupTx:id=>(c.pcRaw.accSupplierTx||c.accSupplierTx).filter(t=>t.supplierId===id),pcHrToday:()=> '2026-11-14',
    PC_ACC_METHODS:['نقدي','تحويل بنكي','شيك','أخرى'],escapeHtml:s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x])),
    pc17ItemName:i=>i.nameAr||i.name||"",pcNoteHtml:s=>c.escapeHtml(s),pc60Num:String,accTxt:n=>Number(n).toFixed(2),accBranchLabel:x=>x||'عام',accBranchOptions:()=>'',pcStoreByName:()=> 'مسؤول',accXlsx:()=>{},
    document:{getElementById:()=>null},setTimeout,PC_VAT:.15};
  vm.createContext(c);
  for(const file of ['accounts.js','purchases.js','vouchers.js'])vm.runInContext(fs.readFileSync(root+'/'+file,'utf8'),c,{filename:file});
  records.set('warehouse_items/food',{name:'دجاج',unit:'كجم',stockQty:10});
  records.set('menu_items/meal',{name:'وجبة',unit:'حبة'});
  records.set('branches/b1',{name:'فرع 1',stockStartMs:1,active:true});
  records.set('acc_suppliers/supplier1',supplier);
  const invoice=(kind='central',store='raw')=>({date:'2026-11-14',due:'2026-12-14',ref:'INV-001',by:'مسؤول',note:'',target:c.accPurchaseTargets().find(t=>t.kind===kind&&t.store===store),lines:[{itemId:store==='prod'?'meal':'food',code:'',name:'صنف',unit:store==='prod'?'حبة':'كجم',qty:2,price:50,total:100}],base:100,vat:15,amount:115});
  const voucher=(kind='supplier')=>({kind,supplierId:supplier.id,date:'2026-11-14',amount:50,by:'مسؤول',paymentAccount:'1211',expenseAccount:'7121',method:'نقدي',branchId:'b1',payee:'مؤجر',category:'إيجارات',ref:'',note:''});
  return {c,records,firebase,supplier,invoice,voucher,permissions,get writes(){return writes;}};
}

module.exports={environment};
