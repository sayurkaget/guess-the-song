const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup() {
  const nodes = new Map();
  const soundEvents = [];
  const node = () => ({hidden:true,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){}});
  const c = vm.createContext({window:{SONGS:[],GameSounds:{create:()=>({play(name){soundEvents.push(name)},stop(){},sync(){}})}},Map,console,setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},
    AbortSignal, Audio:class {pause(){}}, localStorage:{getItem(){return null},setItem(){},removeItem(){}},
    document:{addEventListener(){},querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},body:{dataset:{}}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../recordings.js'),'utf8'),c);
  const src = fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').split('  /* ================= event ================= */')[0];
  vm.runInContext(src + '\nglobalThis.test={S,UI,sameRecording,correctAnswer,submitGuess,fetchArtistSongs};})();',c);
  for(const key of ['render','clearInput','autoplay']) c.test.UI[key]=()=>{};
  c.test.context=c;
  c.test.soundEvents=soundEvents;
  return c.test;
}
const song = (title, artist, extra={}) => ({title,artist,slug:title+'-'+artist,...extra});

test('both catalogue entries for We Found Love win with either album credit', () => {
  for (const owner of ['Rihanna','Calvin Harris']) for (const answer of ['Rihanna','Calvin Harris']) {
    const t=setup();t.S.song=song('We Found Love',owner);
    t.S.meta=song('We Found Love (feat. '+(owner==='Rihanna'?'Calvin Harris':'Rihanna')+')',owner);
    assert.equal(t.correctAnswer(song('We Found Love',answer)),true);
  }
});
test('Silk Sonic and Bruno Mars entries are both accepted in every game mode', () => {
  for (const mode of ['regular','daily','custom','challenge']) for (const artist of ['Silk Sonic','Bruno Mars']) {
    const t=setup();t.S.song=song('Leave the Door Open','Silk Sonic');
    t.S.meta=song('Leave The Door Open','Silk Sonic, Bruno Mars & Anderson .Paak');
    if(mode==='custom')t.S.custom={id:'1'};
    if(mode==='challenge')t.S.challenge={id:'2'};
    if(mode==='daily')t.S.daily={day:'2026-11-03'};
    t.submitGuess(song('Leave the Door Open',artist));
    assert.equal(t.S.won,true);assert.equal(t.S.guesses.length,1);
    t.submitGuess(song('Leave the Door Open',artist));assert.equal(t.S.guesses.length,1);
    assert.deepEqual(t.soundEvents,['correct']);
  }
});

test('each wrong answer sounds once, including the last attempt', () => {
  const t=setup(); t.S.song=song('Hello','Adele');
  for(let i=0;i<5;i++) t.submitGuess(song('Hello','Lionel Richie'));
  assert.equal(t.S.done,true);
  assert.deepEqual(t.soundEvents,Array(5).fill('wrong'));
  t.submitGuess(song('Hello','Lionel Richie'));
  assert.equal(t.soundEvents.length,5);
});
test('same title by unrelated artists and cover performers is not accepted', () => {
  const {sameRecording}=setup();
  assert.equal(sameRecording(song('Hello','Adele'),song('Hello','Lionel Richie')),false);
  assert.equal(sameRecording(song('We Found Love','Rihanna'),song('We Found Love','Cover Band')),false);
  assert.equal(sameRecording(song('Stay','Sam'),song('Stay','Sam Smith')),false);
});
test('live, acoustic, remixes and meaningful parenthetical titles remain distinct', () => {
  const {sameRecording}=setup();
  for(const suffix of [' (Live)',' (Acoustic)',' [Extended Mix]',' - Remix'])
    assert.equal(sameRecording(song('Hello','Adele'),song('Hello'+suffix,'Adele')),false);
  assert.equal(sameRecording(song('Song (Part One)','Artist'),song('Song (Part Two)','Artist')),false);
});
test('featured credits, remasters, punctuation and accents do not create false wrong answers', () => {
  const {sameRecording}=setup();
  assert.equal(sameRecording(song('Halo (2015 Remastered)','Beyoncé'),song('HALO','Beyonce')),true);
  assert.equal(sameRecording(song('Halo - Remastered 2015','Beyoncé'),song('Halo','Beyonce')),true);
  assert.equal(sameRecording(song('Song feat. Guest','Main'),song('Song','Guest')),true);
  assert.equal(sameRecording(song('Don’t Stop','Artist'),song("Don't Stop",'Artist')),true);
});
test('exact iTunes recording IDs remain valid despite display metadata differences', () => {
  const t=setup();t.S.song=song('Song','Artist');t.S.meta=song('Song','Artist',{trackId:123});
  assert.equal(t.correctAnswer(song('Alternate label','Artist',{pre:{trackId:123}})),true);
  assert.equal(t.sameRecording(song('Other','Other',{trackId:456}),t.S.meta),false);
});

test('custom artist pool uses 200 results and filters live versions without dropping remasters', async () => {
  const t=setup();
  const base={wrapperType:'track',kind:'song',artistName:'Oasis',collectionName:'Definitely Maybe',previewUrl:'https://example.com/audio'};
  let requested='';
  t.context.fetch=async url=>{
    requested=url;
    return {ok:true,text:async()=>JSON.stringify({results:[
      {...base,trackName:'Live Forever',trackId:1},
      {...base,trackName:'Live Forever (Live)',trackId:2},
      {...base,trackName:'Supersonic (Remastered)',trackId:3},
      {...base,trackName:'Live Forever',trackId:4}
    ]})};
  };
  const songs=await t.fetchArtistSongs(99);
  assert.match(requested,/limit=200/);
  assert.deepEqual(Array.from(songs,s=>s.title),['Live Forever','Supersonic (Remastered)']);
});
