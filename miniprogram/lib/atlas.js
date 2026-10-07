const G=require('./geo');
module.exports=function(day=2,zoom=true){
 const html=G.render(day,'zh',zoom),svg=html.match(/<svg[\s\S]*?<\/svg>/)[0].replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"').replace('class="atlas-region"','fill="#859775" font-size="16" opacity=".55"').replace(/class="atlas-neighbor"/g,'fill="#849573" font-size="9" opacity=".7"');
 const ids=zoom?['kangding','xinduqiao','tagong']:Object.keys(G.places);
 return {src:'data:image/svg+xml,'+encodeURIComponent(svg),points:ids.map(id=>{const p=G.project(id,zoom),index=G.route.indexOf(id);return{id,name:G.places[id].zh,x:p.x/3.6,y:p.y/3.6,index,selected:G.route[day]===id};})};
};
