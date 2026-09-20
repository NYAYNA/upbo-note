const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'connector.js'),'utf8');
function setup(){
  const sent=[],listeners={},alerts=[];let poll;let tabActive=true;let search='';let remaining=false;
  const row={querySelector:()=>({childNodes:[{nodeType:3,textContent:'테스트후원자'}],querySelector:()=>({textContent:'(test_user)'})}),querySelectorAll:s=>s.includes('roulette')?[{textContent:'A 단컷'},{textContent:'냥'}]:[{textContent:'3'},{textContent:'10'}]};
  const popup={matches:()=>tabActive,querySelector:s=>s.includes('input_static_search')?{value:search}:true,querySelectorAll:()=>[row]};
  const output={closed:false,postMessage:(message,origin)=>sent.push({message,origin})};
  const context=vm.createContext({location:{origin:'https://weflab.com',pathname:'/alertlist'},document:{querySelector:()=>popup,querySelectorAll:()=>remaining?[{textContent:' 더 보기',getClientRects:()=>[{}]}]:[]},window:{open:()=>output,addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener:type=>delete listeners[type]},URL,URLSearchParams,crypto:{randomUUID:()=> 'test-token'},alert:t=>alerts.push(t),setInterval:fn=>{poll=fn;return 1},clearInterval:()=>{},Date});
  vm.runInContext(source+';rouletteConnector("https://nyayna.github.io/upbo-note/","테스트 목록")',context);
  return {sent,output,listeners,alerts,poll:()=>poll(),search:v=>search=v,active:v=>tabActive=v,more:v=>remaining=v};
}
test('connector uses exact destination and token handshake, filters source items',()=>{const s=setup();s.listeners.message({origin:'https://evil.test',source:s.output,data:{type:'roulette-ready',token:'test-token'}});s.poll();assert.equal(s.sent.length,0);s.listeners.message({origin:'https://nyayna.github.io',source:s.output,data:{type:'roulette-ready',token:'test-token'}});assert.equal(s.sent.length,1);assert.equal(s.sent[0].origin,'https://nyayna.github.io');assert.equal(s.sent[0].message.rows.length,1);assert.equal(s.sent[0].message.rows[0].count,3);assert.equal(s.sent[0].message.rows[0].item,'A 단컷');s.poll();assert.equal(s.sent[1].message.changed,false);});
test('connector pauses on partial lists, name searches and closed statistics',()=>{const s=setup();s.listeners.message({origin:'https://nyayna.github.io',source:s.output,data:{type:'roulette-ready',token:'test-token'}});s.more(true);s.poll();assert.match(s.sent.at(-1).message.error,/더 보기/);s.more(false);s.search('일부');s.poll();assert.match(s.sent.at(-1).message.error,/검색/);s.search('');s.active(false);s.poll();assert.match(s.sent.at(-1).message.error,/시청자별/);});
