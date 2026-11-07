const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','feedback.js'),'utf8');
function setup() {
 const handlers={},nodes=new Map();
 function node(id){return {value:'',textContent:'',hidden:true,disabled:false,setCustomValidity(value){this.validation=value},focus(){},addEventListener(type,fn){handlers[id+':'+type]=fn}}}
 for(const id of ['feedbackForm','feedbackFields','feedbackMessage','feedbackStatus','sendFeedback','feedbackDetails','feedbackModal','feedbackCategory'])nodes.set('#'+id,node(id));
 const form=nodes.get('#feedbackForm'),message=nodes.get('#feedbackMessage');
 form.hasAttribute=()=>false;
 form.reportValidity=()=>!message.validation;
 form.getAttribute=()=>'/feedback-received.html';
 form.reset=()=>{message.value='';nodes.get('#feedbackDetails').value=''};
 const calls=[];
 const c=vm.createContext({window:{},document:{querySelector:id=>nodes.get(id)},URLSearchParams,AbortSignal,
 FormData:class{constructor(){return [['form-name','player-feedback'],['category','bug'],['message',message.value],['email',''],['game-details',nodes.get('#feedbackDetails').value],['bot-field','']]}},
 fetch:async(url,options)=>{calls.push({url,options});return {ok:true}}});
 vm.runInContext(source,c);
 return {c,nodes,calls,message,send:()=>handlers['feedbackForm:submit']({preventDefault(){}})};
}
test('successful submission includes registered fields and resets the form',async()=>{
 const {c,nodes,calls,message,send}=setup();c.window.PlayerFeedback.open('Mode: Daily');message.value='  Audio did not load  ';
 await send();assert.equal(calls.length,1);const body=new URLSearchParams(calls[0].options.body);
 assert.equal(body.get('form-name'),'player-feedback');assert.equal(body.get('message'),'Audio did not load');assert.equal(body.get('game-details'),'Mode: Daily');
 assert.equal(body.get('email'),'');assert.equal(body.get('bot-field'),'');assert.equal(message.value,'');
 assert.match(nodes.get('#feedbackStatus').textContent,/has been sent/);assert.equal(nodes.get('#feedbackFields').disabled,false);
});
test('failed request keeps the draft and offers retry',async()=>{
 const {c,nodes,message,send}=setup();message.value='Please add a song';c.fetch=async()=>({ok:false});
 await send();assert.equal(message.value,'Please add a song');assert.match(nodes.get('#feedbackStatus').textContent,/Could not send/);assert.equal(nodes.get('#feedbackFields').disabled,false);
 c.fetch=async()=>{throw Error('offline')};await send();assert.equal(message.value,'Please add a song');
});
test('whitespace-only input is not sent',async()=>{
 const {message,calls,send}=setup();message.value='     ';await send();assert.equal(calls.length,0);assert.ok(message.validation);
});
test('double clicking cannot send duplicate requests',async()=>{
 const {c,nodes,message,send}=setup();message.value='Useful feedback';let release,count=0;c.fetch=()=>{count++;return new Promise(r=>release=r)};
 const first=send();await send();assert.equal(count,1);assert.equal(nodes.get('#feedbackFields').disabled,true);
 release({ok:true});await first;assert.equal(nodes.get('#feedbackFields').disabled,false);
});
test('reopening preserves an unsent draft and its editable game details',()=>{
 const {c,nodes,message}=setup();message.value='Existing draft';nodes.get('#feedbackDetails').value='My device details';c.window.PlayerFeedback.open('New game');
 assert.equal(message.value,'Existing draft');assert.equal(nodes.get('#feedbackDetails').value,'My device details');
});

test('unregistered form cannot falsely report a successful delivery',async()=>{
 const {nodes,message,calls,send}=setup();nodes.get('#feedbackForm').hasAttribute=()=>true;message.value='Feedback draft';
 await send();assert.equal(calls.length,0);assert.equal(message.value,'Feedback draft');assert.match(nodes.get('#feedbackStatus').textContent,/not been sent/);
});

test('Cloudflare feedback requires a JSON receipt before clearing the draft',async()=>{
 const {c,nodes,message,send}=setup();
 nodes.get('#feedbackForm').hasAttribute=name=>name==='data-feedback-api';
 message.value='Feedback draft';
 c.fetch=async()=>({ok:true,json:async()=>({ok:false})});
 await send();assert.equal(message.value,'Feedback draft');
 c.fetch=async()=>({ok:true,json:async()=>{throw new Error('HTML fallback')}});
 await send();assert.equal(message.value,'Feedback draft');
 c.fetch=async()=>({ok:true,json:async()=>({ok:true})});
 await send();assert.equal(message.value,'');
});
