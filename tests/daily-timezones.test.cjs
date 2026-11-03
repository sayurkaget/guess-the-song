const {test}=require('node:test');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const source=path.join(__dirname,'..','daily.js');
for(const timezone of ['Asia/Jakarta','America/New_York','America/Los_Angeles','Europe/London','Asia/Kolkata','Pacific/Kiritimati']) {
 test('07:00 local reset and calendar streak in '+timezone,()=>{
  execFileSync(process.execPath,['-e',`
   const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
   const c=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);const D=c.window.DailyGame;
   for(const [year,month,date] of [[2026,10,3],[2026,2,8],[2026,10,1],[2027,0,1],[2028,2,1]]) {
    const before=new Date(year,month,date,6,59,59), at=new Date(year,month,date,7,0,0);
    const label=year+'-'+String(month+1).padStart(2,'0')+'-'+String(date).padStart(2,'0');
    assert.equal(D.day(before),D.previous(label));assert.equal(D.day(at),label);
    assert.equal(D.nextReset(before).getTime(),at.getTime());
    const tomorrow=new Date(year,month,date+1,7,0,0);assert.equal(D.nextReset(at).getTime(),tomorrow.getTime());
    assert.equal(D.remaining(new Date(year,month,date,6,30)),'0h 30m');
    assert.equal(D.streak([D.previous(label),label],label).current,2);
   }
  `,source],{env:{...process.env,TZ:timezone},stdio:'pipe'});
 });
}
test('New York countdown respects 23-hour and 25-hour days',()=>{
 execFileSync(process.execPath,['-e',`
  const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
  const c=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);const D=c.window.DailyGame;
  assert.equal(D.remaining(new Date(2026,2,7,7)),'23h 0m');
  assert.equal(D.remaining(new Date(2026,9,31,7)),'25h 0m');
  assert.equal(D.day(new Date('2026-11-03T11:59:59Z')),'2026-11-02');
  assert.equal(D.day(new Date('2026-11-03T12:00:00Z')),'2026-11-03');
 `,source],{env:{...process.env,TZ:'America/New_York'},stdio:'pipe'});
});
