const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const track = {trackId:269573303,artistId:99,wrapperType:'track',kind:'song',trackName:'Thriller',artistName:'Michael Jackson',previewUrl:'https://example.com/exact.m4a'};
function setup(hash='', initialSaved=new Map()) {
  const nodes=new Map(), saved=initialSaved;
  const node=()=>({hidden:true,disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}});
  const context=vm.createContext({window:{SONGS:[['Unrelated Song','Another Artist',1,'gl','pop',2020,'']]},
    location:{hash,origin:'https://game.example',pathname:'/',search:''},history:{replaceState(){context.location.hash=''}},
    AbortSignal,Map,URL,console,setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},
    Audio:class {readyState=1;pause(){} load(){}},
    localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
    document:{querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},addEventListener(){},body:{dataset:{},removeAttribute(){}},createElement:node},
    fetch:async(url)=>({ok:true,text:async()=>JSON.stringify({results:url.includes('limit=120')?[track,{...track,trackId:4,trackName:'Another song'}]:[track]})})
  });
  for (const file of ['challenge.js','daily.js','daily-pool-v1.js']) vm.runInContext(read(file),context);
  const source=read('app.js').split('  /* ================= event ================= */')[0]+
    '\nglobalThis.test={S,UI,acceptChallenge,showIncomingChallenge,shareStage,searchIndex,recordStats,submitGuess,skip,nextStage,load,startDaily,shareText,saveRun,completeDaily,dismissModal};})();';
  vm.runInContext(source,context);
  for(const key of ['head','playState','readout','render','clearInput','buildControls','refreshLobby','autoplay','runResult'])context.test.UI[key]=()=>{};
  context.fetch=async()=>{const s=context.test.S.daily.songs[context.test.S.stage];return {ok:true,text:async()=>JSON.stringify({results:[{...track,trackId:100+context.test.S.stage,trackName:s.title,artistName:s.artist}]})}};
  return {context,t:context.test,C:context.window.TrackChallenge,nodes,saved};
}

test('same daily date yields identical five songs regardless of pool order',()=>{
 const {context}=setup();const D=context.window.DailyGame,pool=context.window.DAILY_POOL_V1;
 const a=D.plan(pool,'2026-11-03'),b=D.plan(pool.slice().reverse(),'2026-11-03');
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(new Set(a.map(r=>r[1])).size,5);
 assert.equal(JSON.stringify(a.map(r=>r[2])), '[1,2,3,4,5]');
 assert.equal(D.day(new Date(2026,10,3,6,59,59)),'2026-11-02');
 assert.equal(D.day(new Date(2026,10,3,7,0,0)),'2026-11-03');
 assert.notEqual(JSON.stringify(a),JSON.stringify(D.plan(pool,'2026-11-04')));
});
test('streak handles duplicate completions, missed days, month and year boundaries',()=>{
 const {context}=setup(),D=context.window.DailyGame;
 const check=(dates,today,current,best)=>{const s=D.streak(dates,today);assert.equal(s.current,current);assert.equal(s.best,best)};
 check([], '2026-11-03',0,0);
 check(['2026-11-01','2026-11-02','2026-11-02'],'2026-11-03',2,2);
 check(['2026-11-01','2026-11-02'],'2026-11-04',0,2);
 check(['2026-12-31','2027-01-01'],'2027-01-01',2,2);
 check(['2026-11-01','2026-11-02','2026-11-04'],'2026-11-04',1,2);
});
test('daily ignores free-play filters, resumes guesses after refresh, and restores regular mode',async()=>{
 const first=setup();first.t.S.genre='rock';first.t.S.era='old';await first.t.startDaily();
 const slug=first.t.S.song.slug;first.t.skip();first.t.skip();
 const second=setup('',first.saved);await second.t.startDaily();
 assert.equal(second.t.S.song.slug,slug);assert.equal(second.t.S.guesses.length,2);
 second.t.UI.lobby();assert.equal(second.t.S.daily,null);assert.equal(second.t.S.guesses.length,0);
 assert.ok(![...second.saved.keys()].some(k=>k.startsWith('tl:stats:')));
});
test('completing all five stages earns one streak day, locks result, and shares no titles',async()=>{
 const {t,saved,context}=setup();await t.startDaily();
 const titles=t.S.daily.songs.map(s=>s.title),day=t.S.daily.day;
 for(let stage=0;stage<5;stage++){
  for(let guess=0;guess<5;guess++)t.skip();
  if(stage<4){t.nextStage();await new Promise(setImmediate);}
 }
 assert.equal(t.S.runDone,true);
 assert.equal(JSON.parse(saved.get('tl:daily:completed')).length,1);
 const text=t.shareText();assert.ok(text.includes(day));assert.ok(text.endsWith('#daily'));
 for(const title of titles)assert.ok(!text.includes(title));
 t.completeDaily();assert.equal(JSON.parse(saved.get('tl:daily:completed')).length,1);
 const before=saved.get('tl:daily:v1:'+day);t.S.guesses=[];t.S.done=false;t.saveRun();
 assert.equal(saved.get('tl:daily:v1:'+day),before);
 await t.startDaily();assert.equal(t.S.runDone,true);
 assert.equal(context.window.DailyGame.streak(JSON.parse(saved.get('tl:daily:completed'))).current,1);
});
test('unavailable daily song never falls back to random music and exposes retry',async()=>{
 const {t,context,nodes}=setup();let count=0;context.fetch=async()=>{count++;throw Error('offline')};
 await t.startDaily();assert.equal(count,1);assert.equal(t.S.song,null);assert.equal(nodes.get('#retrySong').hidden,false);
});
test('old-day progress is kept separate from the next daily',async()=>{
 const {t,context}=setup();await t.startDaily();const old=t.S.daily.day;t.skip();t.UI.lobby();
 context.window.DailyGame.day=()=> '2030-01-01';await t.startDaily();assert.notEqual(t.S.daily.day,old);assert.equal(t.S.guesses.length,0);
});
test('corrupt saved state is rejected',()=>{
 const {context}=setup(),D=context.window.DailyGame;
 assert.equal(D.restore({stage:9,stages:[]},[]),null);
 assert.equal(D.restore({stage:0,stages:[{slug:'wrong',guesses:[]}]},['expected']),null);
});

test('closing a completed daily result returns to the regular lobby',async()=>{
 const {t,nodes}=setup();await t.startDaily();t.S.runDone=true;
 nodes.set('#runModal',{hidden:false});t.dismissModal();assert.equal(t.S.daily,null);
});
