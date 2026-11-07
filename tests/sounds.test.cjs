const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function setup(options={}){
 const players=[];let volume=.8,resolve;
 class Audio{
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;players.push(this)}
  play(){this.paused=false;if(options.blocked)return Promise.reject(new Error('blocked'));if(options.pending)return new Promise(r=>resolve=r);return Promise.resolve()}
  pause(){this.paused=true}
 }
 const window={Audio:options.unsupported?undefined:Audio};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../sounds.js'),'utf8'),{window,setTimeout,clearTimeout});
 const sound=window.GameSounds.create(()=>volume);
 return {sound,players,volume:v=>volume=v,resolve:()=>resolve()};
}
test('effects use the working media player without requiring Web Audio',async()=>{
 const t=setup();assert.equal(t.players.length,0);
 await t.sound.play('correct');assert.equal(t.players.length,1);
 assert.equal(t.players[0].src,'sounds/correct.wav');
 assert.ok(t.players[0].volume>=.4);assert.ok(t.sound.active());
 t.players[0].onended();assert.equal(t.sound.active(),false);
});
test('mute suppresses new effects and silences current playback',async()=>{
 const t=setup();t.volume(0);await t.sound.play('wrong');assert.equal(t.players.length,0);
 t.volume(.8);await t.sound.play('wrong');t.volume(.2);t.sound.sync();assert.equal(t.players[0].volume,.13);
 t.volume(0);t.sound.sync();assert.equal(t.players[0].paused,true);assert.equal(t.sound.active(),false);
});
test('replacing and cancelling effects stops previous audio, including pending playback',async()=>{
 const t=setup();await t.sound.play('correct');await t.sound.play('complete');assert.equal(t.players[0].paused,true);
 t.players[0].onended();assert.equal(t.sound.active(),true);
 t.sound.stop();assert.equal(t.players[1].paused,true);assert.equal(t.sound.active(),false);
 const p=setup({pending:true});const task=p.sound.play('correct');p.sound.stop();p.resolve();await task;assert.equal(p.players[0].paused,true);
});
test('unsupported, failed or blocked playback leaves gameplay usable',async()=>{
 await setup({unsupported:true}).sound.play('correct');
 const t=setup({blocked:true});await t.sound.play('correct');assert.equal(t.sound.active(),false);
 const f=setup();await f.sound.play('wrong');f.players[0].onerror();assert.equal(f.sound.active(),false);
});
test('all cues contain audible, non-clipping PCM samples and last under a second',()=>{
 for(const cue of ['correct','wrong','complete','missed']){
  const b=fs.readFileSync(path.join(__dirname,'../sounds',cue+'.wav'));
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
  const length=b.readUInt32LE(40)/2;assert.ok(length/b.readUInt32LE(24)<1);
  let sum=0,peak=0;for(let i=44;i<b.length;i+=2){const v=b.readInt16LE(i)/32768;sum+=v*v;peak=Math.max(peak,Math.abs(v))}
  assert.ok(Math.sqrt(sum/length)>.12);assert.ok(peak<.9);
 }
});
