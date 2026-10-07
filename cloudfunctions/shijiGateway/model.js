const clone = value => JSON.parse(JSON.stringify(value));
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
function validDate(s) { if(!/^\d{4}-\d{2}-\d{2}$/.test(s || ''))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s; }
function dates(start,end) {
  if(!validDate(start)||!validDate(end)||end<start) return [];
  const n=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  if(n>366) throw new Error('一段旅程最多支持 366 天');
  return Array.from({length:n},(_,i)=>new Date(Date.parse(start)+i*86400000).toISOString().slice(0,10));
}
function onDay(trip,date,filter='all') {
  return trip.entries.filter(e=>(filter==='all'||e.kind===filter)&&(e.kind==='stay'?e.date<=date&&e.checkout>date:e.date===date)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
}
function money(cents){return (cents/100).toFixed(2).replace(/\.00$/,'');}
function total(trip){return trip.expenses.filter(e=>e.type!=='collection').reduce((a,e)=>a+e.cents,0);}
function balances(trip) {
  const b=Object.fromEntries(trip.members.map(m=>[m,0]));
  trip.expenses.forEach(e=>{if(e.type==='collection'){b[e.payer]-=e.cents;b[e.people[0]]+=e.cents;return;} b[e.payer]+=e.cents;const q=Math.floor(e.cents/e.people.length),r=e.cents%e.people.length;e.people.forEach((m,i)=>b[m]-=q+(i<r?1:0));});
  return Object.entries(b).map(([name,cents])=>({name,cents,amount:money(Math.abs(cents)),label:cents>0?'应收':cents<0?'应付':'已平衡'}));
}
function validateTrip(t){if(!t.title.trim())throw new Error('请填写旅程名称');if(!dates(t.start,t.end).length)throw new Error('结束日期不能早于开始日期');if(!t.members.length)throw new Error('至少保留一位同行人');}
function validateEntry(e,t){
  if(!validDate(e.date))throw new Error('请选择日期');
  if(e.date<t.start||e.date>t.end)throw new Error('日期需在旅程范围内');
  if(e.kind==='moment'&&!e.title.trim()&&!e.body.trim()&&!e.photos.length)throw new Error('写一句话，或添加一张照片');
  if(e.kind==='transfer'&&(!e.from.trim()||!e.to.trim()))throw new Error('请填写出发地和目的地');
  if(['stay','activity'].includes(e.kind)&&!e.title.trim())throw new Error('请填写名称');
  if(e.kind==='stay'&&(!validDate(e.checkout)||e.checkout<=e.date))throw new Error('离店日期需晚于入住日期');
}
function validateExpense(e,t){if(!e.name.trim())throw new Error('请填写账目名称');if(!Number.isSafeInteger(e.cents)||e.cents<=0)throw new Error('金额需大于 0，最多两位小数');if(!e.people.length||e.people.some(m=>!t.members.includes(m))||!t.members.includes(e.payer))throw new Error('请选择有效的参与人');if(e.type==='collection'&&(e.people.length!==1||e.people[0]===e.payer))throw new Error('请选择一位不同的归还人');if(!validDate(e.date))throw new Error('请选择记账日期');}
module.exports={clone,id,validDate,dates,onDay,money,total,balances,validateTrip,validateEntry,validateExpense};
