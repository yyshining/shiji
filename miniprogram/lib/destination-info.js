/* Read-only destination data. No model calls or trip/private data are sent. */
module.exports = (() => {
  const cache = new Map(), pending = new Map();
  const titles = {chengdu:{zh:'成都',en:'Chengdu'},kangding:{zh:'康定市',en:'Kangding'},xinduqiao:{zh:'新都桥镇',en:'Xinduqiao'},tagong:{zh:'塔公镇',en:'Tagong'}};
  const keyOf = (place,lang,range={}) => `${place}:${lang}:${range.start||''}:${range.end||''}`;
  function peek(place,lang,range) {
    const key=keyOf(place,lang,range);
    if(!cache.has(key)) {
      let value={};
      try { value=JSON.parse(wx.getStorageSync('shiji-destination-v2:'+key))||{}; } catch {}
      cache.set(key,value);
    }
    return cache.get(key);
  }
  function query(obj){return Object.keys(obj).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(obj[k])).join('&');}
  function json(url){return new Promise((resolve,reject)=>wx.request({url,timeout:10000,success:r=>{if(r.statusCode>=200&&r.statusCode<300)resolve(r.data);else reject(Error('Unavailable'));},fail:reject}));}
  async function load(place,lang,force=false,range={}) {
    const point=require('./geo').places[place];if(!point)return;
    if(require('./cloud').ready()){const data=peek(place,lang,range);try{Object.assign(data,await require('./cloud').call('destination',{place,start:range.start,end:range.end}));}catch{data.weather={text:'天气暂时未能连接。'};data.culture={text:'当地资料暂时未能连接。'};}return;}
    if(!require('./config').destinationNetworkEnabled){const data=peek(place,lang,range);data.culture=data.culture||{text:'当地资料暂时未能连接。'};data.weather=data.weather||{text:'天气暂时未能连接。'};return;}
    const key=keyOf(place,lang,range),data=peek(place,lang,range);if(pending.has(key))return pending.get(key);
    const now=Date.now(),tasks=[];data.loading=true;
    if(force||((!data.weatherAt||now-data.weatherAt>30*60*1000)&&(!data.weatherAttempt||now-data.weatherAttempt>60000)))tasks.push((async()=>{
      try {
        data.weatherAttempt=Date.now();
        const common={latitude:point.lat,longitude:point.lon,daily:'weather_code,temperature_2m_max,temperature_2m_min',timezone:'auto'};
        const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),cutoff=new Date();cutoff.setDate(cutoff.getDate()-92);
        const latest=new Date();latest.setDate(latest.getDate()+15);
        const start=range.start||iso(new Date()),end=range.end||iso(latest),results=[];
        if(start<iso(cutoff)){
          const previous=new Date(cutoff);previous.setDate(previous.getDate()-1);
          const params=query({...common,start_date:start,end_date:end<iso(cutoff)?end:iso(previous)});
          results.push(await json('https://archive-api.open-meteo.com/v1/archive?'+params));
        }
        if(end>=iso(cutoff)&&start<=iso(latest)){
          const params=query({...common,start_date:start<iso(cutoff)?iso(cutoff):start,end_date:end>iso(latest)?iso(latest):end});
          results.push(await json('https://api.open-meteo.com/v1/forecast?'+params));
        }
        const daily={time:[],weather_code:[],temperature_2m_min:[],temperature_2m_max:[]};
        for(const result of results){if(!result.daily?.time)throw Error('No daily weather');for(const field of Object.keys(daily))daily[field].push(...result.daily[field]);}
        const w={daily};
        data.weather=w;data.weatherAt=Date.now();data.weatherError=false;
      } catch {if(!data.weather?.daily)data.weather={text:lang==='zh'?'天气暂时未能连接，请稍后刷新。':'Weather is unavailable. Try refreshing shortly.'};data.weatherError=true;}
    })());
    if(force||((!data.cultureAt||now-data.cultureAt>7*86400000)&&(!data.cultureAttempt||now-data.cultureAttempt>60000)))tasks.push((async()=>{
      try {
        data.cultureAttempt=Date.now();
        const title=titles[place][lang],params=query({action:'query',format:'json',formatversion:2,prop:'extracts',exintro:1,explaintext:1,exchars:700,redirects:1,titles:title,origin:'*'});
        const result=await json(`https://${lang}.wikipedia.org/w/api.php?`+params),page=result.query?.pages?.find(p=>p.extract);
        if(!page)throw Error('No destination information');
        data.culture={text:page.extract,url:`https://${lang}.wikipedia.org/wiki/`+encodeURIComponent(page.title)};data.cultureAt=Date.now();data.cultureError=false;
      } catch {if(!data.culture?.url)data.culture={text:lang==='zh'?'当地资料暂时未能连接，请稍后刷新。':'Local information is unavailable. Try refreshing shortly.'};data.cultureError=true;}
    })());
    const work=Promise.allSettled(tasks).then(()=>{data.loading=false;try{wx.setStorageSync('shiji-destination-v2:'+key,JSON.stringify(data));}catch{}pending.delete(key);});
    pending.set(key,work);return work;
  }
  function weatherName(code,lang) {
    const pair=code===0?['晴','Clear']:code<=3?['多云','Cloudy']:code<=48?['雾','Fog']:code<=67?['雨','Rain']:code<=77?['雪','Snow']:code<=82?['阵雨','Rain showers']:code<=86?['阵雪','Snow showers']:['雷雨','Thunderstorms'];
    return pair[lang==='en'?1:0];
  }
  return {peek,load,weatherName};
})();
