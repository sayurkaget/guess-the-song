const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const audioCode=source.slice(source.indexOf('  let raf ='),source.indexOf('  /* ================= sesi'));
const loadCode=source.slice(source.indexOf('  async function load('),source.indexOf('  /* ================= alur'));
const eventCode=source.slice(source.indexOf("  audio.addEventListener('ended'"),source.indexOf('  /* ================= mulai'));
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function fixture(){
  const listeners=new Map(),timers=new Map(),nodes=new Map(),states=[],messages=[];
  let timerId=0;
  const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true});return nodes.get(id);};
  node('#game').hidden=false;
  const audio={currentTime:0,duration:30,volume:.8,playCalls:0,pauseCalls:0,
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn)},
    emit(type){for(const fn of [...(listeners.get(type)||[])])fn()},
    load(){},pause(){this.pauseCalls++},play(){this.playCalls++;return Promise.resolve()},
  };
  const song={slug:'original',title:'Original'},meta={preview:'https://audio.test/song.m4a'};
  const S={epoch:0,vol:.8,muted:false,meta,song,loading:false,audioFailed:false,done:false,guesses:[],stages:[],stage:0,pool:[song]};
  const context={audio,S,Promise,DOMException,Error,Math,isFinite,$:node,
    UI:{head(){},readout(){},render(){},result(){},playState:s=>states.push(s),status:(s,err)=>messages.push({s,err})},
    setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},limit:()=>.1,maxLen:()=>15,
    document:{addEventListener(){}},buildPool(){},findSong:()=>song,pickSong:()=>song,
    resolve:async()=>meta,trackActivity(){},saveRun(){},fmt:n=>n+'s',
  };
  vm.createContext(context);
  vm.runInContext(audioCode+loadCode+eventCode+'\nglobalThis.api={loadAudioMetadata,playClip,stopAudio,load};',context);
  return {api:context.api,audio,S,context,node,listeners,timers,states,messages,
    timeout(ms){for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}},
  };
}
test('metadata is pending until loaded; listeners and timeout are cleaned',async()=>{
  const t=fixture();let ready=false;
  const p=t.api.loadAudioMetadata('song').then(()=>ready=true);
  await flush();assert.equal(ready,false);
  t.audio.emit('loadedmetadata');await p;
  assert.equal(t.listeners.get('loadedmetadata').size,0);assert.equal(t.timers.size,0);
});
test('metadata network error and timeout reject instead of claiming ready',async()=>{
  for(const fail of ['error','timeout']){
    const t=fixture(),p=t.api.loadAudioMetadata('song');const rejected=assert.rejects(p);
    fail==='error'?t.audio.emit('error'):t.timeout(12000);
    await rejected;assert.equal(t.listeners.get('loadedmetadata').size,0);assert.equal(t.timers.size,0);
  }
});
test('leaving during metadata loading cancels pending listeners',async()=>{
  const t=fixture(),p=t.api.loadAudioMetadata('song');const rejected=assert.rejects(p,{name:'AbortError'});
  t.api.stopAudio();await rejected;assert.equal(t.timers.size,0);
});
test('duplicate Play while pending starts only one playback',async()=>{
  const t=fixture();let complete;
  t.audio.play=function(){this.playCalls++;return new Promise(r=>complete=r)};
  const p=t.api.playClip();await flush();await t.api.playClip();
  assert.equal(t.audio.playCalls,1);assert.equal(t.states.at(-1),'loading');
  complete();await p;assert.equal(t.states.at(-1),'playing');assert.equal(t.timers.size,0);
});
test('late playback completion after leaving does not restore playing UI',async()=>{
  const t=fixture();let complete;t.audio.play=()=>new Promise(r=>complete=r);
  const p=t.api.playClip();await flush();t.api.stopAudio();complete();await p;
  assert.equal(t.states.at(-1),'idle');assert.equal(t.timers.size,0);
});
test('play timeout offers retry without consuming an attempt',async()=>{
  const t=fixture();t.audio.play=()=>new Promise(()=>{});
  const p=t.api.playClip();await flush();t.timeout(12000);await p;
  assert.equal(t.node('#retrySong').hidden,false);assert.equal(t.node('#resultRetry').hidden,false);
  assert.equal(t.S.guesses.length,0);assert.equal(t.S.audioFailed,true);assert.equal(t.states.at(-1),'idle');
});
test('browser permission failure keeps Play usable, without network retry',async()=>{
  const t=fixture();t.audio.play=()=>Promise.reject(new DOMException('Blocked','NotAllowedError'));
  await t.api.playClip();assert.equal(t.S.audioFailed,false);assert.equal(t.node('#retrySong').hidden,true);
  assert.match(t.messages.at(-1).s,/Tap Play/);
});
test('buffering displays loading, resumes, and eventually exposes retry if stalled',async()=>{
  const t=fixture();await t.api.playClip();t.audio.emit('waiting');
  assert.equal(t.states.at(-1),'loading');assert.match(t.messages.at(-1).s,/Buffering/);
  t.audio.emit('playing');assert.equal(t.states.at(-1),'playing');assert.equal(t.timers.size,0);
  t.audio.emit('waiting');t.timeout(12000);assert.equal(t.S.audioFailed,true);
});
test('retry keeps exact song and existing guesses; readiness ends only after metadata',async()=>{
  const t=fixture(),song=t.S.song,guesses=[{t:'wrong'}];t.S.guesses=guesses;
  t.S.stages=[{slug:song.slug,guesses}];t.S.audioFailed=true;
  const selected=[];t.context.resolve=async s=>{selected.push(s);return {preview:'same-song'}};
  const p=t.api.load(song);await flush();
  assert.equal(t.S.loading,true);assert.equal(t.node('#retrySong').hidden,true);
  t.audio.emit('loadedmetadata');await p;
  assert.equal(selected[0],song);assert.equal(t.S.guesses,guesses);assert.equal(t.S.loading,false);
  assert.equal(t.S.audioFailed,false);assert.equal(t.S.song,song);
});
test('a failed retry never substitutes a different song',async()=>{
  const t=fixture(),song=t.S.song;let count=0;
  t.context.resolve=async()=>{count++;throw new Error('offline')};
  await t.api.load(song);assert.equal(count,1);assert.equal(t.S.audioFailed,true);
  assert.equal(t.node('#retrySong').hidden,false);assert.equal(t.S.guesses.length,0);
  assert.equal(t.S.retrySong,song);
  await t.api.load(t.S.song || t.S.retrySong);assert.equal(count,2);assert.equal(t.S.retrySong,song);
});
