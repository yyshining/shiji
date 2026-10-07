/* Approximate locality coordinates, WGS84. Source/evidence: ../docs/地图与小程序落地说明.md.
   Points use one north-up equirectangular projection; labels may move, coordinates never do. */
window.ShijiGeo = (() => {
  const places = {
    chengdu:{zh:'成都',en:'Chengdu',lat:30.66,lon:104.0633,area:{zh:'四川 · 成都市',en:'Chengdu · Sichuan'}},
    kangding:{zh:'康定',en:'Kangding',lat:30.0014,lon:101.955,area:{zh:'四川 · 甘孜州 · 康定市',en:'Kangding · Garzê · Sichuan'}},
    xinduqiao:{zh:'新都桥',en:'Xinduqiao',lat:30.0467,lon:101.4918,area:{zh:'甘孜州 · 康定市 · 新都桥镇',en:'Xinduqiao · Kangding · Garzê'}},
    tagong:{zh:'塔公',en:'Tagong',lat:30.3208,lon:101.5217,area:{zh:'甘孜州 · 康定市 · 塔公镇',en:'Tagong · Kangding · Garzê'}}
  };
  const route=['chengdu','kangding','xinduqiao','tagong','kangding','chengdu'];
  // Local map defaults to the northern Kangding area; same projection for all overlays.
  function xy(lon,lat,zoom=true){const c=zoom?{lon:101.7,lat:30.16,scale:520,y:204}:{lon:102.76,lat:30.33,scale:104,y:195};return {x:180+(lon-c.lon)*Math.cos(30.3*Math.PI/180)*c.scale,y:c.y-(lat-c.lat)*c.scale};}
  function project(id,zoom=true){const p=places[id];return xy(p.lon,p.lat,zoom);}
  const backgroundCache={};
  function boundaryPaths(zoom){
    if(backgroundCache[zoom])return backgroundCache[zoom];
    const data=window.ShijiMapData;
    if(!data)return '';
    const features=zoom?data.counties:[...data.cities.filter(f=>f.id!==513300),...data.counties];
    const palette=['#e2e9d4','#e9eddc','#dbe5cc','#e5eada','#d6e1c6'];
    const paths=features.map((f,i)=>{
      const rings=f.polygons.flat();const all=rings.flat().map(p=>xy(p[0],p[1],zoom));
      if(all.every(p=>p.x<0)||all.every(p=>p.x>360)||all.every(p=>p.y<0)||all.every(p=>p.y>360))return '';
      const d=rings.map(r=>r.map((p,j)=>{const q=xy(p[0],p[1],zoom);return (j?'L':'M')+q.x.toFixed(1)+','+q.y.toFixed(1);}).join('')+'Z').join('');
      return `<path d="${d}" fill="${f.id===513301?'url(#land)':palette[i%palette.length]}" fill-rule="evenodd" stroke="#f7f8ed" stroke-width="${f.id===513301?2:1.2}" stroke-linejoin="round"/>`;
    }).join('');
    backgroundCache[zoom]=paths;return paths;
  }
  function scenery(zoom){
    // Unlabelled botanical motifs: illustration, not surveyed forest/peak locations.
    const trees=zoom?[[30,143,.8],[48,159,.6],[185,156,.9],[206,166,.7],[300,204,.9],[322,219,.6],[48,302,.7]]:[[52,135,.8],[74,145,.6],[216,232,.7],[240,240,.9],[315,273,.65]];
    return trees.map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})" opacity=".6"><path d="M0-24-8-11h5l-8 12h8l-9 12h24L3 1h8L3-11h5Z" fill="#829966"/><path d="M0 10v8" stroke="#6f8259" stroke-width="2"/></g>`).join('')+
    (zoom?'<g transform="translate(255 95)" opacity=".48"><path d="m-35 29 26-40 17 27 13-18 27 31Z" fill="#a5b990"/><path d="m-9-11-8 14 8-3 6 5Z" fill="#f5f7ed"/><path d="m21-2-6 10 6-2 6 5Z" fill="#f5f7ed"/></g>':'');
  }
  function render(day,lang,zoom=true){
    const t=(zh,en)=>lang==='en'?en:zh,ids=zoom?['kangding','xinduqiao','tagong']:Object.keys(places);
    const points=ids.map(id=>({...places[id],id,...project(id,zoom)}));
    const localCurves={ 'kangding-xinduqiao':[-28,-26], 'xinduqiao-tagong':[33,8], 'tagong-kangding':[66,-20] };
    const lines=route.slice(0,-1).map((id,i)=>{
      const next=route[i+1];if(!ids.includes(id)||!ids.includes(next))return '';
      // Return legs between the same cities share geography; show them as one connection.
      if(!zoom&&i===4)return '';
      const a=project(id,zoom),b=project(next,zoom),offset=localCurves[id+'-'+next]||[0,25];
      const cx=(a.x+b.x)/2+offset[0],cy=(a.y+b.y)/2+offset[1];
      const d=`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
      return `<path d="${d}" fill="none" stroke="#f9fbf4" stroke-width="5.5"/><path d="${d}" fill="none" stroke="${i<3?'#547b49':'#82986e'}" stroke-width="2.1" stroke-dasharray="3 5" stroke-linecap="round"/>`;
    }).join('');
    return `<div class="geo atlas" aria-label="${zoom?t('康定周边区域地图，北向上','Kangding regional map, north up'):t('川西区域地图，北向上','Western Sichuan regional map, north up')}"><svg class="map" viewBox="0 0 360 360" aria-hidden="true"><defs><linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e3ead3"/><stop offset=".6" stop-color="#d6e1bd"/><stop offset="1" stop-color="#e9edda"/></linearGradient><radialGradient id="atlas-light"><stop stop-color="#f9faef" stop-opacity=".1"/><stop offset="1" stop-color="#f7f8ee" stop-opacity=".52"/></radialGradient></defs><rect width="360" height="360" fill="#edf0e4"/>${boundaryPaths(zoom)}<rect width="360" height="360" fill="url(#atlas-light)"/>${scenery(zoom)}${zoom?`<text x="197" y="229" class="atlas-region">${t('康 定 市','KANGDING')}</text>`:`<text x="131" y="291" class="atlas-region">${t('四 川','SICHUAN')}</text>`}${lines}<path d="M22 320v4h${zoom?46.8:46.8}v-4" stroke="#889875"/><text x="22" y="313" fill="#889875" font-size="8">${zoom?'≈ 10 km':'≈ 50 km'}</text></svg><div class="atlas-heading"><span>${t('山野之间','INTO THE HILLS')}</span><h3>${zoom?t('康定周边','Around Kangding'):t('川西 · 这一程','Western Sichuan')}</h3></div><div class="atlas-controls"><button data-action="map-zoom" aria-label="${zoom?t('查看全程地图','View entire route'):t('查看康定周边','View Kangding area')}">${zoom?'↗':'⊕'}<small>${zoom?t('全程','All stops'):t('局部','Local')}</small></button><div class="atlas-north">↑<small>N</small></div></div>${points.map(p=>{
      const days=route.flatMap((id,i)=>id===p.id?[i]:[]),selected=route[day]===p.id;
      let side=zoom?(p.id==='kangding'?'label-west':p.id==='tagong'?'label-east':'label-above'):(p.id==='xinduqiao'?'label-below':p.id==='kangding'?'label-east':'label-above');
      return `<button class="geo-point atlas-stop ${side} ${selected?'on':''} ${days.every(d=>d>=3)?'future':''}" style="left:${p.x/360*100}%;top:${p.y/360*100}%" data-action="map-day" data-id="${p.id}" aria-label="${p[lang]} · ${t('第','Day ')}${days.map(d=>d+1).join('/')} ${t('天','')}" aria-pressed="${selected}"><span class="number"><b>${selected?day+1:days.map(d=>d+1).join('·')}</b></span><span class="atlas-place">${p[lang]}${selected?`<small>9.${12+day} · ${day<3?t('已到访','Visited'):t('计划','Planned')}</small>`:''}</span></button>`;
    }).join('')}<div class="atlas-foot"><span>${t('● 已到访　○ 计划','● Visited　○ Planned')}</span><button data-action="map-info">${t('区域路线 · ⓘ','Regional route · ⓘ')}</button></div></div>`;
  }
  return {places,route,project,render};
})();
