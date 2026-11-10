// Shared period arithmetic. Values belong to dated observations, never to forecast days.
export const addDays=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10);
export const daysBetween=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);
export function validDate(d){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;}
export function periodDays(from,to){if(!validDate(from)||!validDate(to)||from>to||daysBetween(from,to)>1095)throw Error('Период должен быть от 1 до 1096 дней.');return Array.from({length:daysBetween(from,to)+1},(_,i)=>addDays(from,i));}
export function adaptivePlan({from,to,target,weekdays=[0,1,2,3,4,5,6]},observations,closedThrough){
 const dates=periodDays(from,to),working=d=>weekdays.includes(new Date(d+'T00:00:00Z').getUTCDay()),work=dates.filter(working);if(!work.length)throw Error('В периоде нет рабочих дней.');
 const sums=new Map();for(const o of observations){if(o.date>=from&&o.date<=to&&typeof o.value==='number'&&Number.isFinite(o.value))sums.set(o.date,(sums.get(o.date)||0)+o.value);}
 const known=dates.filter(d=>d<=closedThrough&&sums.has(d)),missing=work.filter(d=>d<=closedThrough&&!sums.has(d));const actual=known.length?known.reduce((s,d)=>s+sums.get(d),0):closedThrough<from?0:null;
 const elapsed=work.filter(d=>d<=closedThrough).length,remainingDays=work.filter(d=>d>closedThrough).length,expected=target*elapsed/work.length,delta=actual===null?null:actual-expected,remaining=actual===null?null:Math.max(0,target-actual);
 const pace=remainingDays&&remaining!==null&&!missing.length?remaining/remainingDays:null;
 const series=dates.map(d=>{const pastWork=work.filter(x=>x<d),missingBefore=pastWork.some(x=>!sums.has(x));const previous=dates.filter(x=>x<d&&x<=closedThrough&&sums.has(x)).reduce((s,x)=>s+sums.get(x),0),left=work.filter(x=>x>=d).length;return{date:d,actual:d<=closedThrough?(sums.get(d)??null):null,baseline:working(d)?target/work.length:0,target:working(d)?(d>closedThrough?pace:missingBefore?null:Math.max(0,target-previous)/Math.max(1,left)):0};});
 return{actual,expected,delta,remaining,pace,remainingDays,missing,completion:actual===null?null:100*actual/target,elapsed,workDays:work.length,series,closedThrough};
}
