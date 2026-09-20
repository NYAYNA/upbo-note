/* Runs only when the user executes their saved bookmark on weflab.com. */
function rouletteConnector(destination,label){
  if(location.origin!=='https://weflab.com'||location.pathname!=='/alertlist'){alert('위플랩 후원관리에서 실행해 주세요.');return;}
  const popup=document.querySelector('#popup_roulette_static');
  if(!popup||!popup.matches('.active')||!popup.querySelector('.btn_static_user.active')){alert('룰렛 통계를 열고 시청자별 탭을 선택해 주세요.');return;}
  if(window.__rouletteNoteStop)window.__rouletteNoteStop();
  const token=crypto.randomUUID();const target=new URL(destination);target.hash=new URLSearchParams({bridge:token,list:label}).toString();
  const output=window.open(target.href,'roulette-note-'+token);
  if(!output){alert('팝업이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 다시 실행해 주세요.');return;}
  let ready=false,last='',tick;
  function read(){
    const p=document.querySelector('#popup_roulette_static');
    if(!p||!p.matches('.active')||!p.querySelector('.btn_static_user.active'))return {error:'위플랩에서 룰렛 통계 → 시청자별을 열어 주세요.'};
    const search=p.querySelector('.input_static_search');
    if(search&&search.value.trim())return {error:'통계 팝업의 이름 검색을 비워 주세요. 전체 시청자 통계만 연결합니다.'};
    const more=[...document.querySelectorAll('a')].find(a=>a.textContent.trim().replace(/^[^가-힣]+/,'')==='더 보기'&&a.getClientRects().length);
    if(more)return {error:'위플랩 후원목록의 더 보기를 끝까지 불러온 뒤 통계를 다시 열어 주세요. 일부 목록은 가져오지 않습니다.'};
    const rows=[];
    for(const row of p.querySelectorAll('.static_table .tbody > .tr')){
      const name=row.querySelector('.td.name p');if(!name)return {error:'시청자 이름 구조가 달라졌습니다.'};
      const id=(name.querySelector('.sub')?.textContent||'').trim().replace(/^\(|\)$/g,'');
      const user=Array.from(name.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
      const items=[...row.querySelectorAll('.td.roulette .td_box p')];
      const counts=[...row.querySelectorAll('.td.count .td_box p')];
      if(items.length!==counts.length||!user)return {error:'통계 형식을 읽지 못했습니다. 위플랩 통계를 다시 열어 주세요.'};
      items.forEach((item,i)=>{const title=item.textContent.trim();if(['단컷','냔생복','방셀','배너','노래','움짤','공겜'].some(k=>title.normalize('NFC').includes(k)))rows.push({user,id,item:title,count:Number(counts[i].textContent.replace(/,/g,'').trim())});});
    }
    if(!rows.length)return {error:'해당하는 업보 당첨이 없습니다. 기존 정리 목록을 유지합니다.'};
    return {rows};
  }
  function send(){if(output.closed){stop();return;}if(!ready)return;const result=read();const signature=JSON.stringify(result);output.postMessage({type:'roulette-note',token,label,at:new Date().toISOString(),...result,changed:signature!==last},target.origin);last=signature;}
  function receive(e){if(e.origin===target.origin&&e.source===output&&e.data?.type==='roulette-ready'&&e.data.token===token){ready=true;send();}}
  function stop(){clearInterval(tick);window.removeEventListener('message',receive);}
  window.__rouletteNoteStop=stop;window.addEventListener('message',receive);tick=setInterval(send,2000);
}
