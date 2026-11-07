const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { isStudio } = require('../recordings.js');

test('studio policy rejects performance variants but keeps genuine titles and remasters', () => {
  for (const track of [
    {trackName:'Hello (Live)'},
    {trackName:'Hello - Live at Wembley'},
    {trackName:'Hello', collectionName:'Live in London'},
    {trackName:'Hello', collectionName:'MTV Unplugged'},
    {trackName:'Hello (Acoustic)'},
    {trackName:'Hello (Remix)'},
    {trackName:'Hello',collectionName:'Hello (Remixes) - EP'},
    {trackName:'Song',collectionName:"Double Live @ Long Wong's"},
    {trackName:'Song',collectionName:'THE PANDEMIC EXPERIENCE | LIVE GLOBAL BROADCAST'},
    {trackName:'Where Are Ü Now LIVE (with Justin Bieber)',collectionName:'Where Are Ü Now LIVE (with Justin Bieber) - Single'},
    {trackName:'Hello', collectionName:'Karaoke Hits'},
    {trackName:'Hello (Sped Up)'},
    {trackName:'Die With A Smile (Apple Music Live)',collectionName:'Apple Music Live: MAYHEM Requiem'},
    {trackName:'Crazy in Love',collectionName:'The Beyonce Experience Live Audio'},
    {trackName:'Hello (Recorded Live in 2020)'},
    {trackName:'Song',collectionName:'Whole Lotta Live. Best of Today FM Sessions.'},
    {trackName:'Song',collectionName:'Live Session (iTunes Exclusive) - Single'},
    {trackName:'Song',collectionName:'Anniversary LIVE - EP'},
    {trackName:'We Will Rock You',collectionName:'Live Killers'}
  ]) assert.equal(isStudio(track), false, JSON.stringify(track));
  for (const track of [
    {trackName:'Live Forever', artistName:'Oasis'},
    {trackName:'Live and Let Die'},
    {trackName:'I Alone', artistName:'Live', collectionName:'Throwing Copper'},
    {trackName:'Doll Parts', collectionName:'Live Through This'},
    {trackName:'Dreams (2004 Remaster)'},
    {trackName:"Love Story (Taylor's Version)"},
    {trackName:'Hello', collectionName:'25'},
    {trackName:'Concert Pitch', collectionName:'Ice on the Dune'},
    {trackName:'Long Live',collectionName:'Long Live - Single'},
    {trackName:"Live While We're Young",collectionName:"Live While We're Young - Single"}
  ]) assert.equal(isStudio(track), true, JSON.stringify(track));
});

function resolver(results, cached) {
  let requests = 0;
  const context = vm.createContext({
    window:{SONGS:[]}, console, AbortSignal,
    document:{querySelector(){}},
    localStorage:{getItem(){return cached ? JSON.stringify(cached) : null},setItem(){},removeItem(){}},
    fetch:async () => {
      requests++;
      return {ok:true,text:async()=>JSON.stringify({results})};
    }
  });
  const root = path.join(__dirname, '..');
  vm.runInContext(fs.readFileSync(path.join(root,'recordings.js'),'utf8'),context);
  const app = fs.readFileSync(path.join(root,'app.js'),'utf8')
    .split('  /* ================= audio ================= */')[0];
  vm.runInContext(app + '\nglobalThis.resolveTrack=resolve;})();', context);
  return {resolve:context.resolveTrack, requests:()=>requests};
}
const song = {title:'Hello',artist:'Adele',slug:'hello-adele'};
const studio = {trackId:1,trackName:'Hello',artistName:'Adele',collectionName:'25',previewUrl:'https://example.com/studio.m4a'};
const live = {...studio,trackId:2,trackName:'Hello (Live)',collectionName:'Live at Wembley'};

test('resolver rejects a live-only search and chooses studio when both are returned', async () => {
  await assert.rejects(resolver([live]).resolve(song));
  const result = await resolver([live, studio]).resolve(song);
  assert.equal(result.trackId, 1);
});

test('cached and preloaded live recordings cannot bypass the policy', async () => {
  const cache = {title:live.trackName,artist:'Adele',album:live.collectionName,preview:live.previewUrl,exp:Date.now()+86400000};
  const lookup = resolver([studio],cache);
  assert.equal((await lookup.resolve(song)).trackId,1);
  assert.equal(lookup.requests(),1);
  await assert.rejects(resolver([]).resolve({...song,pre:cache}),/Studio recording unavailable/);
});

test('imported track ID resolves the exact studio recording and rejects substitutes', async () => {
  const imported = {...song,trackId:1};
  assert.equal((await resolver([live,studio]).resolve(imported)).trackId,1);
  await assert.rejects(resolver([{...studio,trackId:7}]).resolve(imported));
  await assert.rejects(resolver([{...live,trackId:1}]).resolve(imported));
});
