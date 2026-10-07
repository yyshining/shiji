const config=require('./config');let initialized=false;
const messages={CONFLICT:'云端已有更新。请先取回云端版本，本地记录没有被覆盖。',AI_NOT_CONFIGURED:'模型服务尚未配置。',DAILY_LIMIT:'今日整理次数已用完，请明天再试。',INVALID_AI_RESPONSE:'模型返回格式不正确，请重试。',INVALID_DATE_RANGE:'暂时只支持连续 31 天内的天气。',UNSYNCED_MEDIA:'照片尚未完成上传。',SNAPSHOT_TOO_LARGE:'记录超过当前单次备份容量。',SERVICE_UNAVAILABLE:'云服务未就绪，请检查部署和网络。'};
function ready(){return !!config.cloudEnv;}
async function call(action,data={}){if(!ready())throw Error('请先配置微信云开发环境。');if(!wx.cloud)throw Error('当前微信版本不支持云开发。');if(!initialized){wx.cloud.init({env:config.cloudEnv,traceUser:false});initialized=true;}let response;try{response=await wx.cloud.callFunction({name:'shijiGateway',data:{...data,action}});}catch{throw Error('未连接到云函数，请检查环境和部署。');}const r=response.result;if(!r||!r.ok)throw Error(messages[r?.code]||'未能完成云端操作，请稍后重试。');return r.data;}
module.exports={call,ready};
