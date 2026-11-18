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
    {trackName:'We Will Rock You',collectionName:'Live Killers'},
    {trackName:'Folded - A COLORS SHOW'},
    {trackName:'Symphony (Apple Music Sessions)'},
    {trackName:'Golden Slumbers (Apple Music Home Session)'},
    {trackName:'Christmas Lights (Infinity Station Sessions)'},
    {trackName:'Heathens / Trees (Livestream Version)'},
    {trackName:'Want U 2 (Mixed)'},
    {trackName:'Break My Heart [Mixed]'},
    {trackName:'Happier',collectionName:'DJ Set (DJ Mix)'},
    {trackName:'SKIT: EGOMANIAC'},
    {trackName:'Em Calls Paul (Skit)'},
    {trackName:'Just The Way You Are Session Banter'},
    {trackName:'Check Please - Beat'},
    {trackName:'Gone Are the Days - Piano Jam 4'},
    {trackName:'Old Flames (Deconstructed Mix)'},
    {trackName:"Nobody Knows the Trouble I've Seen (Re-record)"},
    {trackName:'Travelling Riverside Blues (BBC Session)'},
    {trackName:'Common People (Recorded For BBC Radio 1)'},
    {trackName:'Latch (BBC Proms At The Royal Albert Hall)'},
    {trackName:'Orgasmatron & On The Road (Studio Rehearsal - 1985)'},
    {trackName:'The Date I Tried to Leave (Rehearsal Version)'},
    {trackName:"Nothin' On You (Acappella) [feat. Bruno Mars]"},
    {trackName:'All My Life - A Cappella'},
    {trackName:'Fade Into Darkness (Vocal Club Mix)'},
    {trackName:'Chris Cox Megamix'},
    {trackName:'Sexy Bitch (feat. Akon) [Continuous Mix]'},
    {trackName:'Emily (Rough Mix)'},
    {trackName:'Rockabye x Krishna (feat. Sean Paul) [VIP Mash-up]'},
    {trackName:'Moment 4 Life (feat. Drake) [Edited]'},
    {trackName:"Kill Rock 'n Roll (Clean)"},
    {trackName:'Hazey (Stripped)', artistName:'Glass Animals'},
    {trackName:'Trouble (Stripped)', artistName:'Halsey'},
    {trackName:'Glide (cover)', artistName:'Mitski'},
    {trackName:'Heart-Shaped Box', collectionName:'Heart-Shaped Box (Quarantine Covers Ep. 1)', artistName:'Glass Animals'},
    {trackName:'Drive', collectionName:'Covers', artistName:'Deftones'},
    {trackName:'Mississippi Queen', collectionName:'Under Cover', artistName:'Ozzy Osbourne'},
    {trackName:'Billie Jean', collectionName:'Forever Young: The Windmill Lane Sessions', artistName:'Kodaline'},
    {trackName:'Fake Plastic Trees (triple j Like A Version)', artistName:'Vance Joy'},
    {trackName:'Love the Way You Lie (Piano Version)', artistName:'Rihanna'},
    {trackName:'La Pared (Versión Acústica)', artistName:'Shakira'},
    {trackName:'Machucando (En Directo)', artistName:'Daddy Yankee'},
    {trackName:'Woman', collectionName:'Double Fantasy (Stripped Down)', artistName:'John Lennon'},
    {trackName:'Blue Monday', collectionName:'iTunes Originals: New Order', artistName:'New Order'},
    {trackName:'Chasing Pavements', artistName:'Piano Covers'},
    {trackName:'Titanium', artistName:'Glee Cast'},
    {trackName:'Blank Space', artistName:'KIDZ BOP Kids'},
    {trackName:'Yellow', artistName:'Vitamin String Quartet'},
    {trackName:"L'accordéoniste", collectionName:'Edith Piaf at Berns in Stockholm, 1958 (feat. Choir and the Berns Grand Orchestra)', artistName:'Edith Piaf'}
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
    {trackName:"Live While We're Young",collectionName:"Live While We're Young - Single"},
    {trackName:'Mixed Signals', artistName:'Ruth B.'},
    {trackName:'Stripped', artistName:'Depeche Mode'},
    {trackName:'Beautiful', artistName:'Christina Aguilera', collectionName:'Stripped'},
    {trackName:'Under Cover of Darkness', artistName:'The Strokes', collectionName:'Angles'},
    {trackName:'Live For Me', artistName:'Omar Apollo', collectionName:'Live For Me - EP'},
    {trackName:'Cover Me Up', artistName:'Morgan Wallen'},
    {trackName:'Bad Remake', artistName:'Wallows'},
    {trackName:'Alright', artistName:'Darius Rucker', collectionName:'Learn To Live'},
    {trackName:'The Dress Rehearsal', artistName:'Good Charlotte'},
    {trackName:'Bbc', artistName:'JAY-Z'},
    {trackName:'Acapella', artistName:'Karmin'},
    {trackName:'So Fresh, So Clean', artistName:'OutKast'},
    {trackName:'What Is Love (7" Mix)', artistName:'Haddaway'},
    {trackName:'Blue (Da Ba Dee) [Gabry Ponte Ice Pop Mix]', artistName:'Eiffel 65'},
    {trackName:'Back for Good (Radio Mix)', artistName:'Take That'}
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

test('unpinned search rejects unrelated cover artists even when title matches cleanly', async () => {
  const randomCover = {
    trackId: 99,
    trackName: 'Hello',
    artistName: 'Acoustic Guitarist',
    collectionName: 'Hits Collection',
    previewUrl: 'https://example.com/cover.m4a'
  };
  await assert.rejects(resolver([randomCover]).resolve(song), /tidak ketemu/);
});

test('allows official Steve Lacy studio EP titled Steve Lacy\'s Demo and blocks new cover outfits', () => {
  assert.equal(isStudio({
    trackName: 'Ryd',
    artistName: 'Steve Lacy',
    collectionName: "Steve Lacy's Demo - EP"
  }), true);
  assert.equal(isStudio({
    trackName: 'Dark Red',
    artistName: 'Steve Lacy',
    collectionName: "Steve Lacy's Demo - EP"
  }), true);
  assert.equal(isStudio({
    trackName: 'Ryd (Demo)',
    artistName: 'Steve Lacy',
    collectionName: "Steve Lacy's Demo - EP"
  }), false);
  for (const artistName of ['Rockabye Baby!', 'Smooth Jazz All Stars', 'Brooklyn Duo', '2CELLOS']) {
    assert.equal(isStudio({
      trackName: 'All Night',
      artistName,
      collectionName: 'Renditions'
    }), false);
  }
});
