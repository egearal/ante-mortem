const {execFileSync}=require('child_process'); const fs=require('fs');
let n=0;
for(const f of fs.readdirSync('src').filter(x=>x.endsWith('.js'))){ execFileSync(process.execPath,['--check','src/'+f],{stdio:'inherit'}); n++; }
console.log('✓ syntax gate: all '+n+' scripts parse');
