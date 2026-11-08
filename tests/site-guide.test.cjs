const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function setup({genre='rock',era='y10',hidden=false,reduced=false,disabled=false}={}){
  const listeners={},changes=[],clicks=[],focus=[],scroll=[];
  function select(id,values,value){return {value,options:values.map(v=>({value:v,textContent:v})),get selectedIndex(){return this.options.findIndex(o=>o.value===this.value)},dispatchEvent(e){assert.equal(e.type,'change');changes.push([id,this.value]);}};}
  const nodes={
    '.site-guide':{addEventListener:(name,fn)=>listeners[name]=fn,contains:()=>true},
    '#genre':select('genre',['all','pop','rock','hiphop','rnb','edm','indie','lain'],genre),
    '#era':select('era',['all','old','y00','y10','y20'],era),
    '#lobby':{hidden},'#back':{click(){clicks.push('back');nodes['#lobby'].hidden=false;}},
    '#start':{disabled,click(){clicks.push('start')},focus(){focus.push('start')}},
    '#openDaily':{focus(){focus.push('daily')}},'#guideAnnouncement':{textContent:''},
    '.wrap':{scrollIntoView:opts=>scroll.push(opts)},
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../site-guide.js'),'utf8'),{
    document:{querySelector:id=>nodes[id]},window:{matchMedia:()=>({matches:reduced})},Event:class{constructor(type){this.type=type}},
  });
  return {nodes,changes,clicks,focus,scroll,listeners,choose(attrs){const button={hasAttribute:key=>Object.hasOwn(attrs,key),getAttribute:key=>attrs[key]??null};listeners.click({target:{closest:()=>button}});}};
}
test('genre shortcut clears era, selects genre and focuses Start without starting',()=>{
  const t=setup();t.choose({'data-guide-genre':'pop'});
  assert.deepEqual(t.changes,[['era','all'],['genre','pop']]);assert.deepEqual(t.clicks,[]);assert.deepEqual(t.focus,['start']);
  assert.equal(t.nodes['#guideAnnouncement'].textContent,'pop selected in Classic.');
});
test('era shortcut leaves an active game before updating Classic filters',()=>{
  const t=setup({hidden:true});t.choose({'data-guide-era':'old'});
  assert.deepEqual(t.clicks,['back']);assert.deepEqual(t.changes,[['genre','all'],['era','old']]);
});
test('unknown filter does not navigate or alter selection',()=>{
  const t=setup();t.choose({'data-guide-genre':'not-a-genre'});
  assert.deepEqual(t.changes,[]);assert.deepEqual(t.focus,[]);assert.deepEqual(t.clicks,[]);
});
test('return to game preserves filters and respects reduced motion',()=>{
  const t=setup({reduced:true,disabled:true});t.choose({'data-guide-top':''});
  assert.deepEqual(t.changes,[]);assert.equal(t.scroll[0].behavior,'auto');assert.deepEqual(t.focus,['daily']);
});
test('FAQ Enter stays native and cannot bubble to the game start shortcut',()=>{
  const t=setup();let stopped=false;
  t.listeners.keydown({target:{closest:()=>({})},key:'Enter',stopPropagation(){stopped=true},preventDefault(){assert.fail('Keep native details behavior')}});
  assert.equal(stopped,true);assert.deepEqual(t.clicks,[]);
});
test('all guide shortcuts match actual game filter keys; footer anchors exist',()=>{
  const guide=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const t=setup();
  for(const [attr,id] of [['genre','#genre'],['era','#era']]){
    for(const [,key] of guide.matchAll(new RegExp('data-guide-'+attr+'="([^"]+)"','g'))){assert.ok(t.nodes[id].options.some(o=>o.value===key),key);}
  }
  for(const [,id] of guide.matchAll(/href="#([^"]+)"/g))assert.ok(guide.includes('id="'+id+'"'));
});
