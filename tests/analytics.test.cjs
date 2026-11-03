const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup(id='',hostname='namethetrack.netlify.app') {
  const scripts=[];
  const c=vm.createContext({window:{},location:{hostname,origin:'https://'+hostname,pathname:'/',hash:'#challenge=secret',search:'?email=secret'},
    document:{querySelector:()=>({content:id}),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../analytics.js'),'utf8'),c);
  return {c,scripts,events:()=>Array.from(c.window.dataLayer||[],x=>Array.from(x))};
}
test('unconfigured analytics sends nothing and loads no third-party script',()=>{
  for(const id of ['', 'G-', 'bad-id']) {
    const {c,scripts,events}=setup(id);c.window.PlayerAnalytics.event('game_start',{mode:'regular'});
    assert.equal(scripts.length,0);assert.equal(events().length,0);
  }
});
test('local previews never send events to the owner account',()=>{
  const {scripts}=setup('G-TEST123','localhost');assert.equal(scripts.length,0);
});
test('configured events allow only activity fields and exclude query/hash',()=>{
  const {c,scripts,events}=setup('G-TEST123');
  assert.equal(scripts.length,1);
  c.window.PlayerAnalytics.event('daily_complete',{mode:'daily',won:true,attempts:2,email:'secret',title:'secret'});
  c.window.PlayerAnalytics.event('arbitrary_name',{email:'secret'});
  const entries=events();assert.equal(entries.length,3);
  assert.equal(entries[1][2].page_location,'https://namethetrack.netlify.app/');
  assert.equal(JSON.stringify(entries[2]),JSON.stringify(['event','daily_complete',{game_mode:'daily',result:'won',attempts:2}]));
  assert.ok(!JSON.stringify(entries).includes('secret'));
});
