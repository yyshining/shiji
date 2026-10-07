const M=require('./model'),seed=require('./seed');
const KEY='shiji-native-v1';
function read(){const value=wx.getStorageSync(KEY);if(value){if(value.version!==1||!Array.isArray(value.trips))throw new Error('记录格式无法读取，请保留本地数据');return M.clone(value);}const initial={...M.clone(seed),version:1};wx.setStorageSync(KEY,initial);return initial;}
function update(change){const next=read();change(next);wx.setStorageSync(KEY,next);return next;}
function trip(id){const t=read().trips.find(t=>t.id===id);if(!t)throw new Error('找不到这段旅程');return t;}
function edit(id,change){return update(state=>{const t=state.trips.find(t=>t.id===id);if(!t)throw new Error('找不到这段旅程');change(t);});}
module.exports={read,update,trip,edit};
