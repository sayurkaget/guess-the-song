const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','feedback.js'),'utf8');
function setup() {
 const handlers={},nodes=new Map();
 function node(id){return {value:'',textContent:'',hidden:true,disabled:false,setCustomValidity(value){this.validation=value},focus(){},addEventListener(type,fn){handlers[id+':'+type]=fn}}}
 for(const id of ['feedbackForm','feedbackFields','feedbackMessage','feedbackStatus','sendFeedback','feedbackDetails','feedbackModal','feedbackCategory','feedbackEmail','feedbackReason','feedbackReasonField','feedbackCategoryField','feedbackTitle','feedbackIntro','feedbackMessageLabel'])nodes.set('#'+id,node(id));
 const form=nodes.get('#feedbackForm'),message=nodes.get('#feedbackMessage');
 form.hasAttribute=()=>false;
 form.reportValidity=()=>!message.validation;
 form.getAttribute=()=>'/feedback-received.html';
 form.reset=()=>{for(const id of ['feedbackMessage','feedbackDetails','feedbackEmail','feedbackReason'])nodes.get('#'+id).value='';nodes.get('#feedbackCategory').value='bug'};
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

test('song report requires a reason and sends it with recording details, without requiring notes',async()=>{
 const {c,nodes,calls,send}=setup();
 c.window.PlayerFeedback.openSong('Track ID: 123\nSong: Original');
 assert.equal(calls.length,0);
 await send();assert.equal(calls.length,0);
 nodes.get('#feedbackReason').value='live';await send();
 const body=new URLSearchParams(calls[0].options.body);
 assert.equal(body.get('category'),'bug');assert.match(body.get('message'),/Live version/);
 assert.equal(body.get('game-details'),'Track ID: 123\nSong: Original');
});

test('general feedback and each song retain their own draft and identity',()=>{
 const {c,nodes,message}=setup();
 c.window.PlayerFeedback.open('General details');message.value='General draft';
 c.window.PlayerFeedback.openSong('Song A');message.value='First song note';nodes.get('#feedbackReason').value='audio';
 c.window.PlayerFeedback.openSong('Song B');assert.equal(message.value,'');assert.equal(nodes.get('#feedbackDetails').value,'Song B');
 c.window.PlayerFeedback.openSong('Song A');assert.equal(message.value,'First song note');assert.equal(nodes.get('#feedbackReason').value,'audio');assert.equal(nodes.get('#feedbackDetails').value,'Song A');
 c.window.PlayerFeedback.open('Fresh general details');assert.equal(message.value,'General draft');assert.equal(nodes.get('#feedbackDetails').value,'General details');
});

test('failed song report preserves reason and note; sending cannot switch its song',async()=>{
 const {c,nodes,message,send}=setup();c.window.PlayerFeedback.openSong('Song A');nodes.get('#feedbackReason').value='title';message.value='Wrong credit';
 let release;c.fetch=()=>new Promise(r=>release=r);const pending=send();
 c.window.PlayerFeedback.openSong('Song B');assert.equal(nodes.get('#feedbackDetails').value,'Song A');
 release({ok:false});await pending;assert.equal(message.value,'Wrong credit');assert.equal(nodes.get('#feedbackReason').value,'title');
});

test('reporting the same song again after success retains its recording identity',async()=>{
 const {c,nodes,calls,send}=setup();c.window.PlayerFeedback.openSong('Track ID: 456');
 nodes.get('#feedbackReason').value='audio';await send();
 c.window.PlayerFeedback.openSong('Track ID: 456');nodes.get('#feedbackReason').value='title';await send();
 assert.equal(new URLSearchParams(calls[1].options.body).get('game-details'),'Track ID: 456');
});

test('result report attaches both catalogue and played recording, bounded to the inbox limit',()=>{
 const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
 const handler=app.slice(app.indexOf("  $('#reportSong').onclick"),app.indexOf('  let artistT ='));
 const button={},reports=[];
 const S={done:false,song:{title:'Catalogue song',artist:'Catalogue artist',trackId:1},meta:{title:'Played song',artist:'Played artist',trackId:2}};
 let stopped=0,closed=0;
 vm.runInNewContext(handler,{$:()=>button,S,gameMode:()=>'daily',stopAudio(){stopped++},closeAll(){closed++},window:{PlayerFeedback:{openSong:details=>reports.push(details)}}});
 button.onclick();assert.equal(reports.length,0);
 S.done=true;button.onclick();assert.match(reports[0],/Track ID: 2/);assert.match(reports[0],/Played song — Played artist/);assert.match(reports[0],/Catalogue song — Catalogue artist/);assert.equal(stopped,1);assert.equal(closed,1);
 S.meta.title='Long title '.repeat(100);S.song.artist='Artist '.repeat(100);button.onclick();assert.ok(reports[1].length<=600);assert.match(reports[1],/Track ID: 2/);
});
