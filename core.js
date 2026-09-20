(function(root){
  'use strict';
  const KEYWORDS=['단컷','냔생복','방셀','배너','노래','움짤','공겜'];
  const isTask=item=>KEYWORDS.some(word=>String(item).normalize('NFC').includes(word));
  function normalize(rows){
    if(!Array.isArray(rows)||rows.length>20000)throw Error('통계 형식을 확인해 주세요.');
    const map=new Map();
    for(const r of rows){
      if(!r||typeof r.user!=='string'||typeof r.item!=='string'||typeof r.id!=='string'||!r.user.trim()||!r.item.trim()||r.user.length>200||r.id.length>200||r.item.length>500||!Number.isSafeInteger(r.count)||r.count<0||r.count>10000000)throw Error('올바르지 않은 통계 행입니다.');
      const value={user:r.user.trim(),id:r.id.trim(),item:r.item.trim(),count:r.count};
      const key=keyOf(value);const old=map.get(key);if(old)old.count+=value.count;else map.set(key,value);
    }
    return [...map.values()];
  }
  function keyOf(r){return JSON.stringify([r.id||r.user,r.item]);}
  function mergeSnapshot(previous,incoming){
    const rows=normalize(incoming).filter(r=>isTask(r.item));
    const next=new Map(rows.map(r=>[keyOf(r),r]));
    for(const old of previous.rows){if(!isTask(old.item))continue;if((next.get(keyOf(old))?.count||0)<old.count)throw Error('이전보다 당첨 횟수가 줄었습니다. 같은 조회 기간인지 확인하거나 새 목록으로 연결해 주세요.');}
    const done={};for(const r of rows){const key=keyOf(r);done[key]=Math.min(r.count,Math.max(0,previous.done[key]||0));}
    return {...previous,rows,done};
  }
  function summary(rows,done={}){const users=new Set(),items=new Map();let total=0,completed=0;for(const r of rows){users.add(r.id||r.user);total+=r.count;completed+=Math.min(r.count,Math.max(0,Number(done[keyOf(r)])||0));items.set(r.item,(items.get(r.item)||0)+r.count);}return {total,completed,users:users.size,items:[...items].sort((a,b)=>b[1]-a[1])};}
  function csv(rows,done={}){const cell=x=>'"'+String(/^[=+@\-\t\r]/.test(String(x))?"'"+x:x).replaceAll('"','""')+'"';return '\ufeff'+[['시청자','아이디','당첨 항목','횟수','완료','남음'],...rows.map(r=>{let n=Math.min(r.count,Math.max(0,Number(done[keyOf(r)])||0));return [r.user,r.id,r.item,r.count,n,r.count-n];})].map(r=>r.map(cell).join(',')).join('\r\n');}
  const api={normalize,keyOf,summary,csv,KEYWORDS,isTask,mergeSnapshot,taskRows:rows=>normalize(rows).filter(r=>isTask(r.item))};if(typeof module!=='undefined')module.exports=api;else root.RouletteCore=api;
})(typeof window==='undefined'?globalThis:window);
