const assert=require('node:assert/strict'),M=require('../lib/model');
let storage,route;
global.wx={getStorageSync:()=>storage,setStorageSync:(k,v)=>storage=M.clone(v),showModal:()=>{},pageScrollTo:()=>{},navigateTo:({url})=>route=url};
const S=require('../lib/store');
function load(file){let page;global.Page=p=>page=p;require(file);page.data=M.clone(page.data);page.setData=function(patch){Object.assign(this.data,patch);};return page;}
const home=load('../pages/home/home');
S.update(s=>s.trips.push({id:'archived-oct',title:'October',start:'2026-10-01',end:'2026-10-03',status:'past',members:['甲'],checks:[],expenses:[],entries:[],diary:''}));
home.refresh();assert(home.data.memoryTrips.every(t=>t.status==='past'));
home.setData({memoryYear:'2026',memoryMonth:'10月'});home.filterMemories();assert.deepEqual(home.data.memoryTrips.map(t=>t.id),['archived-oct']);
home.setData({memoryMonth:'2月'});home.filterMemories();assert.equal(home.data.memoryTrips.length,0);home.resetFilter();assert(home.data.memoryTrips.length>=2);
const importer=load('../pages/import/import');importer.onLoad();importer.select({currentTarget:{dataset:{id:'archived-oct'}}});assert.equal(importer.data.date,'2026-10-01');importer.date({detail:{value:'2026-10-02'}});importer.next();assert(route.includes('trip=archived-oct'));assert(route.includes('date=2026-10-02'));assert(route.includes('import=1'));
console.log('PASS: archive-only year/month filtering, reset, photo import trip/date routing');
