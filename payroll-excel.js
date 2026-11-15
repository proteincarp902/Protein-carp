/* Styled payroll export matching the supplied workbook layout, without bundling private source rows. */
var pcPayrollExcelPromise=null;
function pcPayrollExcelLibrary(){
  if(window.ExcelJS)return Promise.resolve(window.ExcelJS);
  if(pcPayrollExcelPromise)return pcPayrollExcelPromise;
  pcPayrollExcelPromise=new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="assets/vendor/exceljs-4.4.0.min.js";script.onload=()=>window.ExcelJS?resolve(window.ExcelJS):reject(new Error("Excel library unavailable"));script.onerror=()=>{pcPayrollExcelPromise=null;script.remove();reject(new Error("Excel library unavailable"));};document.head.appendChild(script);});
  return pcPayrollExcelPromise;
}
function pcPayrollWorkbook(Excel,groups){
  const workbook=new Excel.Workbook();workbook.creator="Protein & Carb";workbook.calcProperties.fullCalcOnLoad=true;
  const p=pcPayrollPeriod(),month=pcPayrollF.month.split("-").reverse().join("-"),company=pcHrPayrollMetadata.companyName||"Protein & Carb";
  const headers=["م","الموظف","الجنسية","طريقة الدفع","المهنة","الفرع","الراتب الاساسى","بدل سكن","بدل مواصلات","بدلات أخرى","إضافي","إجمالي الراتب","التأمينات","عقوبات","الغياب","تعويضات","سلف","صافي الراتب","ملاحظات","أيام العمل","Odoo ID"];
  const widths=[5,32,11,9,16,10,11,10,10,10,10,12,10,9,10,10,10,12,30,8,10];
  const fmt='#,##0.00;(#,##0.00);"-"',blue="FF1F4E78",lightBlue="FFDDEBF7",totalBlue="FFD9E1F2",yellow="FFFFF2CC";
  const fill=color=>({type:"pattern",pattern:"solid",fgColor:{argb:color}});
  const rowStyle=(row,color,bold=false)=>{row.eachCell({includeEmpty:true},c=>{c.font={name:"Arial",size:10,bold};c.alignment={vertical:"middle",wrapText:true};if(color)c.fill=fill(color);});};
  const headerStyle=row=>{rowStyle(row,blue,true);row.height=30;row.eachCell(c=>{c.font={name:"Arial",size:10,bold:true,color:{argb:"FFFFFFFF"}};c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});};
  const createSheet=(name,title,ncols=21)=>{const s=workbook.addWorksheet(name,{views:[{rightToLeft:true,state:"frozen",ySplit:4,xSplit:2}],pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});s.addRow([company]);s.addRow([title]);s.addRow([`${p.partial?"كشف مبدئي حتى "+p.to+". ":""}اليوم = الإجمالي الثابت ÷ أيام الشهر الفعلية. البيانات الحالية من ملفات الموظفين؛ الأصفر متغيرات للمراجعة. لا يوجد احتساب تلقائي للتأمينات من الجنسية.`]);s.getCell("A1").font={name:"Arial",size:14,bold:true};s.getCell("A2").font={name:"Arial",size:12,bold:true};s.getCell("A3").font={name:"Arial",size:9};s.getCell("A3").alignment={wrapText:true};s.getRow(3).height=32;for(let r=1;r<=3;r++)s.mergeCells(r,1,r,ncols);s.pageSetup.printTitlesRow="1:4";return s;};
  const summary=createSheet("الملخص",`ملخص رواتب شهر ${month}`,6), bank=createSheet("النظامين",`رواتب الموظفين شهر ${month} — كشف التحويل البنكي`), cash=createSheet("غير نظامين",`رواتب الموظفين شهر ${month} — كشف النقدي`);
  const all=groups.flatMap(g=>g.rows.map(r=>({...r,department:g.section||"بدون قسم"})));
  const category=r=>["النظامين","غير نظامين"].includes(r.e.payrollGroup)?r.e.payrollGroup:"غير مصنف";
  const hasUnknown=all.some(r=>category(r)==="غير مصنف"),unknown=hasUnknown?createSheet("غير مصنف",`رواتب شهر ${month} — فئة الكشف غير محددة`):null;
  const details=[bank,cash,...(unknown?[unknown]:[])],subtotals=new Map();
  for(const sheet of details){
    widths.forEach((w,i)=>sheet.getColumn(i+1).width=w);headerStyle(sheet.addRow(headers));let index=0;const categoryTotals=[];
    const depts=[...new Set(all.filter(r=>category(r)===sheet.name).map(r=>r.department))];
    for(const dept of depts){
      const heading=sheet.addRow(Array(21).fill(null));heading.getCell(5).value="مرتبات "+dept;rowStyle(heading,lightBlue,true);
      const employeeRows=[];const records=all.filter(r=>category(r)===sheet.name&&r.department===dept);
      for(const r of records){
        const hasParts=r.e.payrollBasicSalary!==null&&r.e.payrollBasicSalary!==undefined;
        const basic=hasParts?Number(r.e.payrollBasicSalary):r.salary,housing=hasParts?Number(r.e.payrollHousingAllowance||0):0,transport=hasParts?Number(r.e.payrollTransportAllowance||0):0;
        const proration=r.salary===null?null:accR(r.salary-r.gross),absence=r.salary===null?null:accR(proration+r.absenceDeduction+r.unpaidDeduction),penalty=accR(r.penaltyDeduction+r.penaltyAmount);
        const note=[...r.notes,...(!hasParts&&r.salary!==null?["المرتب الشهري القديم مدرج بالأساسي؛ تفصيل البدلات غير مسجل"]:[]),...(proration?[`فترة الاستحقاق ${r.from} إلى ${r.to}؛ خصم خارج الفترة ${pcHrReportMoney(proration)}`]:[])].join("؛ ");
        const row=sheet.addRow([++index,r.e.name,r.e.nationality||"",r.e.payrollPaymentMethod||"",r.e.jobTitle||r.e.role||"",pcPayrollBranch(r.e),basic,housing,transport,0,0,null,r.insuranceAmount,penalty,absence,0,0,null,note,r.serviceDays-r.absentDays-r.unpaidDays,r.e.odooEmployeeId||""]);
        const n=row.number;employeeRows.push(n);rowStyle(row,null);row.height=28;
        for(let c=7;c<=18;c++)row.getCell(c).numFmt=fmt;
        for(const c of [11,14,15,16,17,20])row.getCell(c).fill=fill(yellow);
        row.getCell(18).font={name:"Arial",size:10,bold:true};
        if(r.salary!==null){
          row.getCell(12).value={formula:`SUM(G${n}:K${n})`,result:r.salary};
          // Each deduction is rounded separately, matching the on-screen calculation; editing T adjusts the absence component.
          const fixed=`(G${n}+H${n}+I${n}+J${n})`,days='الافتراضات!$B$5';
          if(r.penaltyDays)row.getCell(14).value={formula:`ROUND(${fixed}*${r.penaltyDays}/${days},2)+${r.penaltyAmount}`,result:penalty};
          row.getCell(15).value={formula:`${fixed}-ROUND(${fixed}*${r.serviceDays}/${days},2)+ROUND(${fixed}*(${r.serviceDays}-T${n}-${r.unpaidDays})/${days},2)+ROUND(${fixed}*${r.unpaidDays}/${days},2)`,result:absence};
          row.getCell(18).value={formula:`L${n}-M${n}-N${n}-O${n}-P${n}-Q${n}`,result:r.net};
        }
      }
      const total=sheet.addRow(Array(21).fill(null)),n=total.number;total.getCell(5).value="إجمالي "+dept;rowStyle(total,totalBlue,true);
      for(let c=7;c<=18;c++){const letter=sheet.getColumn(c).letter;total.getCell(c).numFmt=fmt;total.getCell(c).value={formula:employeeRows.map(x=>`${letter}${x}`).join("+")||"0",result:records.reduce((v,r)=>v+(c===18?(r.net||0):c===13?r.insuranceAmount:c===12?(r.salary||0):c===14?accR((r.penaltyDeduction||0)+r.penaltyAmount):c===15?(r.salary===null?0:accR(r.salary-r.gross+r.absenceDeduction+r.unpaidDeduction)):c===7?(r.e.payrollBasicSalary??r.salary??0):c===8?Number(r.e.payrollHousingAllowance||0):c===9?Number(r.e.payrollTransportAllowance||0):0),0)};}
      total.getCell(20).value=records.length;categoryTotals.push(n);subtotals.set(JSON.stringify([sheet.name,dept]),{row:n,count:records.length,net:accR(records.reduce((s,r)=>s+(r.net||0),0))});sheet.addRow([]);
    }
    const grand=sheet.addRow(Array(21).fill(null));grand.getCell(5).value="الإجمالي العام";rowStyle(grand,totalBlue,true);
    for(let c=7;c<=18;c++){const letter=sheet.getColumn(c).letter;grand.getCell(c).numFmt=fmt;grand.getCell(c).value={formula:categoryTotals.map(n=>`${letter}${n}`).join("+")||"0",result:accR(categoryTotals.reduce((s,n)=>s+Number(sheet.getCell(n,c).value.result||0),0))};}
  }
  const summaryHeaders=["مركز التكلفة (القسم)","عدد النظاميين","صافي التحويل البنكي","عدد النقديين","صافي النقدي","الإجمالي",...(hasUnknown?["عدد غير المصنفين","صافي غير المصنفين"]:[])];
  headerStyle(summary.addRow(summaryHeaders));[25,15,22,15,20,22,18,22].forEach((w,i)=>summary.getColumn(i+1).width=w);
  const deptNames=[...new Set(all.map(r=>r.department))],summaryRows=[];
  for(const dept of deptNames){
    const b=subtotals.get(JSON.stringify([bank.name,dept])),c=subtotals.get(JSON.stringify([cash.name,dept])),u=subtotals.get(JSON.stringify(["غير مصنف",dept]));
    const row=summary.addRow([dept,b?.count||0,0,c?.count||0,0,0,...(hasUnknown?[u?.count||0,0]:[])]),n=row.number;summaryRows.push(n);rowStyle(row,null);
    for(const [col,sheet,total] of [[3,bank,b],[5,cash,c],...(hasUnknown?[[8,unknown,u]]:[])])row.getCell(col).value=total?{formula:`'${sheet.name}'!R${total.row}`,result:total.net}:0;
    row.getCell(6).value={formula:`C${n}+E${n}`+(hasUnknown?`+H${n}`:""),result:accR((b?.net||0)+(c?.net||0)+(u?.net||0))};for(const col of [3,5,6,...(hasUnknown?[8]:[])])row.getCell(col).numFmt=fmt;
  }
  const final=summary.addRow(["الإجمالي"]);rowStyle(final,totalBlue,true);for(let c=2;c<=summaryHeaders.length;c++){const letter=summary.getColumn(c).letter;final.getCell(c).value={formula:summaryRows.map(n=>`${letter}${n}`).join("+")||"0",result:accR(summaryRows.reduce((s,n)=>{const v=summary.getCell(n,c).value;return s+Number(typeof v==="object"?v?.result||0:v||0);},0))};if([3,5,6,8].includes(c))final.getCell(c).numFmt=fmt;}
  const missing=all.filter(r=>r.salary===null).length;summary.addRow([]);summary.addRow([`مرتب غير محدد: ${missing}. الإجماليات تشمل المسجل فقط. التأمينات من القيمة المسجلة، والسلف والتعويضات والإضافي غير المسجلة صفر للمراجعة.`]);
  const assumptions=workbook.addWorksheet("الافتراضات",{views:[{rightToLeft:true}]});assumptions.getColumn(1).width=80;assumptions.getColumn(2).width=32;
  assumptions.addRow(["افتراضات الكشف"]);assumptions.addRow([]);assumptions.addRow(["التأمينات","القيمة الشهرية المسجلة لكل موظف — دون اشتقاق نسبة من الجنسية"]);assumptions.addRow(["فترة الاستحقاق",p.first+" إلى "+p.to]);assumptions.addRow(["عدد أيام الشهر لاحتساب الأجر اليومي",p.days]);assumptions.addRow(["التأخير والإنذارات","لا خصم تلقائي؛ الجزاءات المعتمدة فقط"]);assumptions.addRow(["المكونات الثابتة","الأساسي + السكن + الانتقالات؛ لا تُستورد البدلات الأخرى أو متغيرات أكتوبر تلقائيًا"]);assumptions.addRow(["ملاحظات","القسم والفرع والمكونات الحالية؛ ليست أرشيفًا تاريخيًا للمرتبات. الشهر الجاري مبدئي. مبالغ سلبية أو غير محددة تحتاج مراجعة قبل الصرف."]);
  return workbook;
}
