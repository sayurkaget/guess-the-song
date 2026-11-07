const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const track = {trackId:269573303,artistId:99,wrapperType:'track',kind:'song',trackName:'Thriller',artistName:'Michael Jackson',previewUrl:'https://example.com/exact.m4a'};
function setup(hash='#challenge=1.269573303.3') {
  const nodes=new Map(), saved=new Map();
  const node=()=>({hidden:true,disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}});
  const context=vm.createContext({window:{SONGS:[['Unrelated Song','Another Artist',1,'gl','pop',2020,'']]},
    location:{hash,origin:'https://game.example',pathname:'/',search:''},history:{replaceState(){context.location.hash=''}},
    AbortSignal,Map,URL,console,setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},
    Audio:class {readyState=1;pause(){} load(){}},
    localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
    document:{querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},addEventListener(){},body:{dataset:{},removeAttribute(){}},createElement:node},
    fetch:async(url)=>({ok:true,text:async()=>JSON.stringify({results:url.includes('limit=200')?[track,{...track,trackId:4,trackName:'Another song'}]:[track]})})
  });
  vm.runInContext(read('recordings.js'),context);
  vm.runInContext(read('challenge.js'),context);
  const source=read('app.js').split('  /* ================= event ================= */')[0]+
    '\nglobalThis.test={S,UI,acceptChallenge,showIncomingChallenge,shareStage,searchIndex,recordStats,submitGuess,skip,nextStage,load};})();';
  vm.runInContext(source,context);
  for(const key of ['head','playState','readout','render','clearInput','buildControls','refreshLobby','autoplay'])context.test.UI[key]=()=>{};
  return {context,t:context.test,C:context.window.TrackChallenge,nodes,saved};
}
test('links round trip without titles; malformed and unsupported versions rejected',()=>{
  const {C}=setup();
  for(let result=0;result<=5;result++) {
    const link=C.create('https://game.example/',269573303,result);
    const parsed=C.parse(new URL(link).hash);
    assert.equal(parsed.id,'269573303');assert.equal(parsed.result,result);
    assert.ok(!link.includes('Thriller'));
  }
  for(const hash of ['','#challenge=2.269573303.3','#challenge=1.0.1','#challenge=1.123.6','#challenge=1.123.-1','#challenge=1.123.1<script>'])assert.equal(C.parse(hash),null);
  assert.throws(()=>C.create('https://game.example/', 'https://evil.example',1));
});
test('comparison covers every win, loss, and tie combination',()=>{
 const {C}=setup();
 for(let friend=0;friend<=5;friend++)for(let yours=0;yours<=5;yours++){
  const text=C.compare(friend,yours);
  if(friend===yours)assert.match(text,/tie/);
  else if(yours && (!friend || yours<friend))assert.match(text,/You beat/);
  else assert.match(text,/friend wins/);
 }
});
test('accept pins exact preview despite filters; answer is searchable; reshare preserves recording',async()=>{
 const {t,nodes,saved}=setup();t.S.genre='rock';t.S.era='old';
 assert.equal(t.showIncomingChallenge(),true);
 assert.ok(!nodes.get('#challengeMessage').textContent.includes('Thriller'));
 await t.acceptChallenge();
 assert.equal(t.S.meta.trackId,269573303);assert.equal(t.S.meta.preview,track.previewUrl);
 assert.equal(t.S.startAt,0);assert.equal(t.S.guesses.length,0);
 const answer=t.searchIndex('Thriller')[0];assert.equal(answer.slug,t.S.song.slug);
 t.submitGuess(answer);assert.equal(t.S.won,true);
 assert.ok(t.shareStage().includes('#challenge=1.269573303.1'));
 t.recordStats();assert.equal(saved.size,0);
 t.nextStage();assert.equal(t.S.challenge,null);assert.equal(t.S.custom,null);
 assert.equal(t.S.genre,'rock');assert.equal(t.S.stages.length,0);
});
test('five skips lose only the challenge and never add regular statistics',async()=>{
 const {t,saved}=setup();await t.acceptChallenge();
 for(let i=0;i<5;i++)t.skip();
 assert.equal(t.S.done,true);assert.equal(t.S.won,false);assert.equal(t.S.guesses.length,5);
 assert.ok(t.shareStage().includes('#challenge=1.269573303.0'));assert.equal(saved.size,0);
});
test('missing exact recording fails without replacing it and allows retry',async()=>{
 const {context,t,nodes}=setup();context.fetch=async()=>({ok:true,text:async()=>JSON.stringify({results:[{...track,trackId:88}]})});
 await t.acceptChallenge();assert.equal(t.S.song,null);assert.equal(t.S.challenge,null);
 assert.equal(nodes.get('#acceptChallenge').disabled,false);assert.match(nodes.get('#challengeMessage').textContent,/exact song/);
 context.fetch=async()=>({ok:true,text:async()=>JSON.stringify({results:[track]})});
 await t.acceptChallenge();assert.equal(t.S.meta.trackId,269573303);
});
test('artist lookup failure keeps the requested custom song searchable',async()=>{
 const {context,t}=setup();context.fetch=async(url)=>{if(url.includes('limit=200'))throw Error('offline');return {ok:true,text:async()=>JSON.stringify({results:[{...track,trackName:'Outside Catalogue',artistName:'Custom Artist'}]})}};
 await t.acceptChallenge();assert.equal(t.searchIndex('Outside Catalogue')[0].slug,t.S.song.slug);
});
test('leaving during lookup prevents a late response reopening the challenge',async()=>{
 const {context,t}=setup();let release;context.fetch=()=>new Promise(r=>{release=r});
 const pending=t.acceptChallenge();t.UI.lobby();
 release({ok:true,text:async()=>JSON.stringify({results:[{...track,artistId:null}]})});
 await pending;assert.equal(t.S.challenge,null);assert.equal(t.S.song,null);
});
test('invalid link shows a recoverable entry message',()=>{
 const {t,nodes}=setup('#challenge=1.bad.3');assert.equal(t.showIncomingChallenge(),true);
 assert.equal(nodes.get('#acceptChallenge').hidden,true);assert.match(nodes.get('#challengeMessage').textContent,/invalid/);
});

test('friend challenges reject live recordings instead of silently substituting studio audio', async () => {
 const {context,t,nodes}=setup();
 context.fetch=async()=>({ok:true,text:async()=>JSON.stringify({results:[{...track,trackName:'Thriller (Live)'}]})});
 await t.acceptChallenge();
 assert.equal(t.S.song,null);
 assert.equal(t.S.challenge,null);
 assert.equal(nodes.get('#acceptChallenge').disabled,false);
});
