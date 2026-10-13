const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('./core.js');
test('instant room photos are excluded from restored and synced lists and their export',()=>{
 const rows=['즉석 방셀','즉석방셀','즉석  방셀','얼빡 방셀','네컷 방셀'].map(item=>({user:'테스트',id:'fixture',item,count:1}));
 const restored=C.taskRows(rows);
 assert.deepEqual(restored.map(r=>r.item),['얼빡 방셀','네컷 방셀']);
 const synced=C.mergeSnapshot({rows,done:{}},rows);
 assert.deepEqual(synced.rows,restored);
 assert.equal(C.summary(restored).total,2);
 assert.ok(!C.csv(restored).includes('즉석'));
});
