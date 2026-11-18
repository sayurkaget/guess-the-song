const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const track = {trackId:269573303,artistId:99,wrapperType:'track',kind:'song',trackName:'Thriller',artistName:'Michael Jackson',previewUrl:'https://example.com/exact.m4a'};
const runTracks = [
  track,
  {trackId:111111111,artistId:99,wrapperType:'track',kind:'song',trackName:'Billie Jean',artistName:'Michael Jackson',previewUrl:'https://example.com/2.m4a'},
  {trackId:222222222,artistId:77,wrapperType:'track',kind:'song',trackName:'Beat It',artistName:'Michael Jackson',previewUrl:'https://example.com/3.m4a'},
  {trackId:333333333,artistId:88,wrapperType:'track',kind:'song',trackName:'Bad',artistName:'Michael Jackson',previewUrl:'https://example.com/4.m4a'},
  {trackId:444444444,artistId:66,wrapperType:'track',kind:'song',trackName:'Smooth Criminal',artistName:'Michael Jackson',previewUrl:'https://example.com/5.m4a'}
];
function setup(hash='#challenge=1.269573303.3', songs=[['Unrelated Song','Another Artist',1,'gl','pop',2020,'']]) {
  const nodes=new Map(), saved=new Map();
  const node=()=>({hidden:true,disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){}});
  const context=vm.createContext({window:{SONGS:songs},
    location:{hash,origin:'https://game.example',pathname:'/',search:''},history:{replaceState(){context.location.hash=''}},
    AbortSignal,Map,URL,console,setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},matchMedia:()=>({matches:true}),
    Audio:class extends EventTarget {readyState=0;pause(){} load(){this.readyState=1;this.dispatchEvent(new Event('loadedmetadata'));}},
    localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
    document:{querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},addEventListener(){},body:{dataset:{},removeAttribute(){}},createElement:node},
    fetch:async(url)=>({ok:true,text:async()=>JSON.stringify({results:url.includes('limit=200')?[track,{...track,trackId:4,trackName:'Another song'}]:runTracks})})
  });
  vm.runInContext(read('recordings.js'),context);
  vm.runInContext(read('challenge.js'),context);
  const source=read('app.js').split('  /* ================= event ================= */')[0]+
    '\nglobalThis.test={S,UI,acceptChallenge,showIncomingChallenge,shareStage,shareText,saveRun,newRun,searchIndex,recordStats,submitGuess,skip,nextStage,load};})();';
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
 assert.ok(t.shareStage().startsWith('TuneUp · '));
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

test('run links round trip for classic and artist challenges without titles; invalid hashes rejected', () => {
 const { C } = setup();
 const plain = (v) => JSON.parse(JSON.stringify(v));
 const ids = [269573303, 111111111, 222222222, 333333333, 444444444];
 const results = [1, 0, 3, 2, 5];
 const classicLink = C.createRun('https://game.example/', ids, results);
 assert.ok(!classicLink.includes('Thriller'));
 const parsedClassic = plain(C.parseRun(new URL(classicLink).hash));
 assert.deepEqual(parsedClassic, { ids: ids.map(String), results, artistId: null });

 const artistLink = C.createRun('https://game.example/', ids.slice(0, 3), [1, 2, 0], 99);
 const parsedArtist = plain(C.parseRun(new URL(artistLink).hash));
 assert.deepEqual(parsedArtist, { ids: ids.slice(0, 3).map(String), results: [1, 2, 0], artistId: '99' });

 for (const bad of [
   '',
   '#run=2.c.111-222.12',
   '#run=1.x.111-222.12',
   '#run=1.c.111-222.1',
   '#run=1.c.0-222.12',
   '#run=1.c.111-222.16',
   '#run=1.c.1-2-3-4-5-6.111111',
   '#run=1.c.111.1<script>'
 ]) assert.equal(C.parseRun(bad), null);

 assert.throws(() => C.createRun('https://game.example/', [111, 222], [1]));
 assert.throws(() => C.createRun('https://game.example/', [111], [1], 'https://evil.example'));
});

test('compareRun and describeRun evaluate score totals cleanly', () => {
 const { C } = setup();
 assert.equal(C.describeRun([1, 0, 3, 2, 0]), '3/5 songs');
 assert.match(C.compareRun([1, 0, 0, 0, 0], [1, 2, 0, 0, 0]), /You beat/);
 assert.match(C.compareRun([1, 2, 3, 0, 0], [1, 0, 0, 0, 0]), /friend wins/);
 assert.match(C.compareRun([1, 0, 2, 0, 0], [0, 3, 0, 5, 0]), /tie/);
});

test('playing a 5-stage classic run produces an exact #run challenge link that replays identically', async () => {
 const plain = (v) => JSON.parse(JSON.stringify(v));
 const catalog = runTracks.map((tr) => [tr.trackName, tr.artistName, 1, 'gl', 'pop', 1982, '', tr.trackId]);
 const first = setup('', catalog);
 first.context.fetch = async (url) => {
   const idMatch = /id=([^&]+)/.exec(url);
   if (idMatch) {
     const want = new Set(idMatch[1].split(','));
     return { ok: true, text: async () => JSON.stringify({ results: runTracks.filter((tr) => want.has(String(tr.trackId))) }) };
   }
   return { ok: true, text: async () => JSON.stringify({ results: runTracks }) };
 };

 for (let i = 0; i < 5; i++) {
   await first.t.load(first.t.searchIndex(runTracks[i].trackName)[0]);
   if (i === 1) {
     for (let k = 0; k < 5; k++) first.t.skip();
   } else {
     if (i === 2) first.t.skip();
     first.t.submitGuess(first.t.S.song);
   }
   if (i < 4) await first.t.nextStage();
 }

 const shared = first.t.shareText();
 const hashMatch = /#run=\S+/.exec(shared);
 assert.ok(hashMatch, 'expected shareText to end with exact #run challenge link');
 assert.ok(!hashMatch[0].includes('Thriller'));
 const parsed = plain(first.C.parseRun(hashMatch[0]));
 assert.equal(parsed.artistId, null);
 assert.deepEqual(parsed.results, [1, 0, 2, 1, 1]);
 assert.deepEqual(parsed.ids, runTracks.map((tr) => String(tr.trackId)));

 // Friend opens that exact link and plays the exact same 5 studio recordings.
 const friend = setup(hashMatch[0]);
 assert.equal(friend.t.showIncomingChallenge(), true);
 assert.match(friend.nodes.get('#challengeMessage').textContent, /4\/5 songs/);
 await friend.t.acceptChallenge();
 assert.equal(friend.t.S.runChallenge.songs.length, 5);

 for (let i = 0; i < 5; i++) {
   assert.equal(friend.t.S.meta.trackId, runTracks[i].trackId);
   const pick = friend.t.searchIndex(runTracks[i].trackName)[0];
   assert.ok(pick, 'expected exact song to be searchable in dropdown');
   friend.t.submitGuess(pick);
   friend.t.UI.result();
   assert.match(
     friend.nodes.get('#challengeComparison').textContent,
     i === 1 ? /You beat/ : i === 2 ? /You beat/ : /tie/
   );
   await friend.t.nextStage();
 }

 assert.equal(friend.saved.size, 0, 'friend run challenge must not pollute regular statistics');
 assert.match(friend.nodes.get('#runChallengeResult').textContent, /You beat your friend.*4\/5 songs.*5\/5 songs/);

 const friendShare = friend.t.shareText();
 const friendHash = /#run=\S+/.exec(friendShare);
 assert.ok(friendHash);
 assert.deepEqual(plain(friend.C.parseRun(friendHash[0])), {
   ids: runTracks.map((tr) => String(tr.trackId)),
   results: [1, 1, 1, 1, 1],
   artistId: null
 });
});

test('artist run challenges preserve artist mode, song labels, and artist id in reshared link', async () => {
 const plain = (v) => JSON.parse(JSON.stringify(v));
 const hash = '#run=1.a99.269573303-111111111.13';
 const { t, nodes, C } = setup(hash);
 assert.equal(t.showIncomingChallenge(), true);
 await t.acceptChallenge();
 assert.equal(t.S.runChallenge.artistId, '99');
 assert.equal(nodes.get('#gameMode').textContent, 'Friend challenge · Michael Jackson');

 t.submitGuess(t.searchIndex('Thriller')[0]);
 await t.nextStage();
 assert.equal(t.S.meta.trackId, 111111111);
 t.submitGuess(t.searchIndex('Billie Jean')[0]);
 await t.nextStage();

 assert.match(nodes.get('#runChallengeResult').textContent, /tie/);
 const reShared = t.shareText();
 assert.match(reShared, /Song 1 0\.1s/);
 const parsed = plain(C.parseRun(/#run=\S+/.exec(reShared)[0]));
 assert.deepEqual(parsed, { ids: ['269573303', '111111111'], results: [1, 1], artistId: '99' });
});

test('run challenges reject invalid hash or live tracks without silent substitution', async () => {
 const bad = setup('#run=1.c.bad-123.12');
 assert.equal(bad.t.showIncomingChallenge(), true);
 assert.equal(bad.nodes.get('#acceptChallenge').hidden, true);
 assert.match(bad.nodes.get('#challengeMessage').textContent, /invalid/);

 const live = setup('#run=1.c.269573303-111111111.12');
 live.context.fetch = async () => ({
   ok: true,
   text: async () => JSON.stringify({ results: [track, { ...runTracks[1], trackName: 'Billie Jean (Live)' }] })
 });
 await live.t.acceptChallenge();
 assert.equal(live.t.S.song, null);
 assert.equal(live.t.S.runChallenge, null);
 assert.equal(live.nodes.get('#acceptChallenge').disabled, false);
});
