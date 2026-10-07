const S=require('../../lib/store'),M=require('../../lib/model'),U=require('../../lib/ui');
function face(index){
 const eyes=index===2||index===3?'<path d="M8 12q2 2 4 0m8 0q2 2 4 0"/>':'<circle cx="10" cy="12" r="1"/><circle cx="22" cy="12" r="1"/>';
 const mouth=index<2?'<path d="M11 20q5 5 10 0"/>':index===4||index===5?'<path d="M12 23q4-4 8 0"/>':index===6?'<ellipse cx="16" cy="21" rx="2" ry="3"/>':'<path d="M13 21h6"/>';
 return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#455141" stroke-width="1.5" stroke-linecap="round">'+eyes+mouth+'</svg>');
}
Page({
 data:{kind:'diary',trip:{},newItem:'',error:'',moods:[{name:'开心',face:'☺',color:'#f4c4bc'},{name:'期待',face:'◡',color:'#f6dfa0'},{name:'平静',face:'ᴗ',color:'#c0dbbd'},{name:'疲惫',face:'–',color:'#d5dbd0'},{name:'低落',face:'⌢',color:'#bbd1e7'},{name:'焦虑',face:'·',color:'#d4c5e4'},{name:'惊喜',face:'o',color:'#f4cdab'},{name:'想念',face:'˘',color:'#e8cee0'}],selectedMood:null,drag:-1,dragTarget:-1,rowHeight:60,rowY:0},
 onLoad(q){this.setData({moods:this.data.moods.map((m,i)=>({...m,image:face(i)}))});this.id=q.trip;this.setData({kind:q.kind});wx.setNavigationBarTitle({title:q.kind==='checks'?'出发准备':'心情日记'});this.refresh();},
 refresh(){U.run(()=>{const t=S.trip(this.id);this.setData({trip:t,selectedMood:this.data.moods.find(m=>m.name===t.mood)||null,done:t.checks.filter(c=>c.done).length,progress:t.checks.length?Math.round(t.checks.filter(c=>c.done).length/t.checks.length*100):0});});},
 saveDiary(field,value){try{S.edit(this.id,t=>{t[field]=value;});this.setData({['trip.'+field]:value,error:''});}catch(e){this.setData({error:'尚未保存，请检查存储空间后重试。'});this.pending={field,value};}},
 inputDiary(e){this.saveDiary('diary',e.detail.value);},mood(e){const name=e.currentTarget.dataset.name;this.saveDiary('mood',name);this.setData({selectedMood:this.data.moods.find(m=>m.name===name)});},font(e){this.saveDiary('font',e.currentTarget.dataset.id);},retry(){if(this.pending){const p=this.pending;this.saveDiary(p.field,p.value);}},
 check(e){U.run(()=>{S.edit(this.id,t=>{const c=t.checks.find(c=>c.id===e.currentTarget.dataset.id);c.done=!c.done;});this.refresh();});},
 inputNew(e){this.setData({newItem:e.detail.value});},
 add(){const name=this.data.newItem.trim();if(!name)return;U.run(()=>{S.edit(this.id,t=>t.checks.push({id:M.id(),name,done:false}));this.setData({newItem:''});this.refresh();});},
 rename(e){const c=this.data.trip.checks.find(c=>c.id===e.currentTarget.dataset.id);wx.showModal({title:'编辑事项',editable:true,content:c.name,success:r=>{if(r.confirm&&r.content.trim())U.run(()=>{S.edit(this.id,t=>{t.checks.find(z=>z.id===c.id).name=r.content.trim();});this.refresh();});}});},
 startDrag(e){const index=Number(e.currentTarget.dataset.index);this.startY=e.touches[0].clientY;this.startIndex=index;wx.createSelectorQuery().in(this).select('.check-row').boundingClientRect(rect=>{if(rect)this.setData({rowHeight:rect.height});}).exec();this.setData({drag:index,dragTarget:index,rowY:0});},
 moveDrag(e){if(this.data.drag<0)return;const delta=e.touches[0].clientY-this.startY;const target=Math.max(0,Math.min(this.data.trip.checks.length-1,this.data.drag+Math.round(delta/this.data.rowHeight)));this.setData({rowY:delta,dragTarget:target});},
 endDrag(){if(this.data.drag<0)return;const from=this.data.drag,to=Math.max(0,Math.min(this.data.trip.checks.length-1,from+Math.round(this.data.rowY/this.data.rowHeight)));U.run(()=>{S.edit(this.id,t=>{const [c]=t.checks.splice(from,1);t.checks.splice(to,0,c);});this.refresh();});this.setData({drag:-1,dragTarget:-1,rowY:0});},cancelDrag(){this.setData({drag:-1,dragTarget:-1,rowY:0});}
});
