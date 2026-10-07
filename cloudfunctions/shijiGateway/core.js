const M=require('./model');
const crypto=require('crypto');
const ownerKey=openid=>crypto.createHash('sha256').update(openid).digest('hex');
function validateSnapshot(state,owner){
 if(!state||state.version!==1||!state.profile||!Array.isArray(state.trips)||state.trips.length>100)throw Error('INVALID_SNAPSHOT');
 if(Buffer.byteLength(JSON.stringify(state))>800000)throw Error('SNAPSHOT_TOO_LARGE');
 const ids=new Set();for(const t of state.trips){M.validateTrip(t);if(typeof t.id!=='string'||ids.has(t.id))throw Error('INVALID_ID');ids.add(t.id);if(!['active','planned','past'].includes(t.status)||!Array.isArray(t.entries)||!Array.isArray(t.expenses)||!Array.isArray(t.checks))throw Error('INVALID_TRIP');for(const e of t.entries)M.validateEntry(e,t);for(const e of t.expenses)M.validateExpense(e,t);}
 function visit(v){if(v==null||v==='')return;if(Array.isArray(v)){v.forEach(visit);return;}if(typeof v!=='string'||(!/^\/assets\/[\w.-]+$/.test(v)&&!new RegExp('^cloud://[^/]+/shiji/'+owner+'/[\\w.-]+$').test(v)))throw Error('UNSYNCED_MEDIA');}
 // Validate file references, not ordinary diary/body strings containing links.
 visit(state.profile.avatar);for(const t of state.trips){visit(t.cover);for(const e of t.entries)visit(e.photos||[]);}
 return JSON.parse(JSON.stringify(state));
}
function parseExtraction(content){
 const text=String(content||'').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');let value;try{value=JSON.parse(text);}catch{throw Error('INVALID_AI_RESPONSE');}
 if(!value||!Array.isArray(value.items)||value.items.length>20)throw Error('INVALID_AI_RESPONSE');
 return value.items.map(item=>{if(!item||!['moment','transfer','stay','activity'].includes(item.kind))throw Error('INVALID_AI_RESPONSE');const out={kind:item.kind};for(const key of ['title','date','time','body','place','from','to','method','checkout']){const v=item[key];out[key]=v==null?'':String(v).slice(0,key==='body'?3000:160);}if(out.date&&!M.validDate(out.date))out.date='';if(out.checkout&&!M.validDate(out.checkout))out.checkout='';if(out.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(out.time))out.time='';return out;});
}
module.exports={ownerKey,validateSnapshot,parseExtraction};
