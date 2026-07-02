"use strict";
/* ---------- audio (synth casino SFX) ---------- */
let AC=null, master=null, muted=false, drone=null, droneGain=null;
function initAudio(){
  if(AC) return;
  try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  master = AC.createGain(); master.gain.value = 0.8; master.connect(AC.destination);
}
function tone(freq,dur,type,vol,slideTo){
  if(!AC||muted) return;
  const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'square'; o.frequency.setValueAtTime(freq,t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), t+dur);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol||0.2, t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.02);
}
function noise(dur,vol,lp){
  if(!AC||muted) return;
  const t=AC.currentTime, n=Math.floor(AC.sampleRate*dur), buf=AC.createBuffer(1,n,AC.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp||1400;
  const g=AC.createGain(); g.gain.value=vol||0.2;
  s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(t+dur);
}
const SFX={
  shoot(){ tone(220+Math.random()*40,0.06,'square',0.05,140); },
  hit(){ const v=Math.random()*60; tone(300+v,0.05,'square',0.07,190); tone(120+v*0.4,0.06,'sine',0.09,60); noise(0.03,0.05,2600); },
  coin(){ tone(880,0.05,'square',0.14); setTimeout(()=>tone(1320,0.07,'square',0.13),40); },
  xp(){ tone(520,0.05,'triangle',0.07); },
  level(){ [523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,0.5,'sine',0.16),i*70)); },
  tick(){ tone(1200+Math.random()*300,0.03,'square',0.09); },
  jackpot(){ [523,659,784,1047,1318,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.4,'sine',0.2),i*70)); noise(0.5,0.12,3000); },
  dice(){ for(let i=0;i<6;i++) setTimeout(()=>noise(0.04,0.14,2200),i*70); },
  win(){ [659,988,1319].forEach((f,i)=>setTimeout(()=>tone(f,0.35,'triangle',0.2),i*80)); },
  lose(){ tone(300,0.5,'sawtooth',0.16,90); },
  hurt(){ noise(0.14,0.2,700); tone(150,0.18,'sawtooth',0.14,70); },
  death(){ [400,320,240,160].forEach((f,i)=>setTimeout(()=>tone(f,0.5,'sawtooth',0.18,f*0.6),i*130)); },
  cheer(){ noise(0.6,0.16,2600); tone(660,0.4,'triangle',0.08); },
  murmur(){ noise(0.4,0.06,900); },
  reelStop(){ tone(140,0.09,'sine',0.15,60); noise(0.05,0.1,1200); },
  reelHit(step){ const base=[300,440,620][Math.min(2,(step||1)-1)]||300;
    tone(base,0.06,'square',0.32,base*0.35);
    tone(base*3,0.15,'sine',0.28);
    tone(base*4.8,0.12,'sine',0.2);
    tone(base*6.5,0.09,'sine',0.12);
    tone(64,0.18,'sine',0.3,34);
    noise(0.08,0.24,3800); },
  reelLock(){ [784,1047,1319,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.34,'sine',0.24),i*45)); noise(0.5,0.16,4200); },
  tingle(){ [1568,2093,2637,3136,3729].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine',0.18),i*42)); noise(0.2,0.06,6000); },
  eshoot(){ tone(340,0.14,'sawtooth',0.1,120); noise(0.06,0.08,1400); },
  knife(){ tone(680,0.05,'square',0.12,320); noise(0.03,0.07,3400); },
  card(){ tone(520,0.06,'triangle',0.13,1000); noise(0.05,0.06,2800); },
  nova(){ tone(120,0.34,'sawtooth',0.22,52); [200,320,440].forEach((f,i)=>setTimeout(()=>tone(f,0.24,'sine',0.14),i*55)); noise(0.34,0.2,1600); },
  seeker(){ tone(420,0.24,'sine',0.12,1100); noise(0.06,0.05,3000); },
  reelTick(){ tone(900+Math.random()*400,0.02,'square',0.06); },
  riser(){ tone(240,0.55,'sawtooth',0.1,900); },
  winDing(){ [1568,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.32,'sine',0.2),i*140)); noise(0.4,0.08,3200); },
  bust(){ tone(240,0.5,'sawtooth',0.16,70); setTimeout(()=>tone(150,0.42,'square',0.12,58),120); },
  diceLand(){ tone(180,0.12,'sine',0.16,110); noise(0.05,0.12,900); },
  lever(){ for(let i=0;i<5;i++) setTimeout(()=>tone(720-i*90,0.04,'square',0.08),i*45); setTimeout(()=>{ tone(120,0.1,'sine',0.16,60); noise(0.05,0.1,900); },250); },
  leverWind(){ for(let i=0;i<7;i++) setTimeout(()=>tone(300+i*40,0.03,'square',0.1),i*32); },
  leverSlam(){ tone(90,0.18,'sine',0.3,40); noise(0.1,0.22,1400); tone(420,0.06,'square',0.14,120); },
  anteUp(){ tone(400,0.12,'square',0.14,560); setTimeout(()=>tone(600,0.18,'sine',0.14),110); noise(0.05,0.1,1500); },
  coinPling(){ tone(1200+Math.random()*500,0.05,'square',0.1); },
  levelDing(){ tone(1046,0.14,'sine',0.3); setTimeout(()=>tone(1568,0.16,'sine',0.32),120); setTimeout(()=>tone(2093,0.22,'sine',0.2),240); noise(0.18,0.05,7000); for(let i=0;i<4;i++) setTimeout(()=>tone(2400+i*260,0.05,'triangle',0.06),300+i*45); },
  levelUp(){
    tone(131,0.7,'sine',0.32,98);
    [523,659,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>{ tone(f,0.5,'triangle',0.24); tone(f*2,0.4,'sine',0.08); },i*95));
    setTimeout(()=>{ [1568,2093,2637].forEach((f,i)=>setTimeout(()=>tone(f,0.42,'sine',0.18),i*115)); },580);
    setTimeout(()=>noise(0.5,0.06,6500),300);
    setTimeout(()=>{ for(let i=0;i<7;i++) setTimeout(()=>tone(2500+Math.random()*900,0.06,'triangle',0.08),i*48); },920);
  },
  thud(){ tone(180,0.28,'sine',0.22,80); noise(0.14,0.1,600); },
  diceRattle(){ for(let i=0;i<6;i++) setTimeout(()=>{ tone(200+Math.random()*320,0.03,'square',0.06); noise(0.02,0.05,3200); }, i*55); },
  dingHit(step){ step=Math.max(1,step||1); const bases=[1319,1568,1976,2349,2794,3322]; const base=bases[Math.min(bases.length-1,step-1)]; const vol=0.30+step*0.045; tone(base,0.46,'sine',vol); tone(base*1.5,0.34,'sine',vol*0.42); tone(base*2,0.24,'sine',vol*0.26); if(step>=2) setTimeout(()=>tone(base*1.25,0.3,'sine',vol*0.5),42); if(step>=3) setTimeout(()=>tone(base*2,0.3,'sine',vol*0.44),84); if(step>=4) setTimeout(()=>tone(base*2.5,0.26,'sine',vol*0.4),126); noise(0.12,0.05+step*0.012,7200); },
  dingBells(){ const seq=[1568,2093,1568,2637,2093,3136,2093,2637,1568,2093,3136,2637,3136,2093,3729]; seq.forEach((f,i)=>setTimeout(()=>{ tone(f,0.46,'sine',0.36); tone(f*1.5,0.34,'sine',0.14); tone(f*0.5,0.2,'sine',0.06); },i*52)); noise(0.34,0.1,7500); for(let i=0;i<6;i++) setTimeout(()=>tone(2600+Math.random()*1200,0.05,'triangle',0.07),300+i*40); },
  multDing(m){ const f=700+Math.min(1700,m*55); tone(f,0.14,'sine',0.2); setTimeout(()=>tone(f*1.5,0.16,'sine',0.17),70); noise(0.15,0.06,3000); },
  bigWin(tier){ const notes=[523,659,784,1047,1319,1568,2093,2637]; const n=Math.min(notes.length,4+tier); for(let i=0;i<n;i++) setTimeout(()=>tone(notes[i],0.42,'sine',0.2),i*85); noise(0.7,0.1,3200); },
  seraph(){ [659,988,1319,1568,1976].forEach((f,i)=>setTimeout(()=>tone(f,0.7,'sine',0.15),i*55)); noise(0.8,0.07,4200); },
  cashout(){ for(let i=0;i<12;i++) setTimeout(()=>tone(1000+Math.random()*900,0.05,'square',0.12),i*42); [784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.4,'sine',0.18),i*85)); },
  diceThrow(){ noise(0.22,0.12,1800); tone(320,0.16,'sine',0.1,620); },
  selectorGo(){ [660,880,1100,1320].forEach((f,i)=>setTimeout(()=>tone(f,0.1,'square',0.16),i*45)); noise(0.12,0.08,2400); tone(200,0.14,'sine',0.14,90); },
  selectorTick(step){ const base=1500+(6-Math.min(6,step||2))*160; tone(base,0.05,'square',0.2); tone(base*2,0.035,'sine',0.12); noise(0.02,0.05,5000); },
  casinoDing(){ const b=[1568,1976,2093,2637][(Math.random()*4)|0]; tone(b,0.22,'sine',0.2); tone(b*1.5,0.16,'sine',0.09); },
  chipStack(){ for(let i=0;i<4;i++) setTimeout(()=>tone(900+Math.random()*500,0.04,'square',0.11),i*35); },
  xpCharge(r){ const rr=Math.min(1,Math.max(0.85,r)); const p=700+(rr-0.85)/0.15*950; tone(p,0.07,'sine',0.07); tone(p*2,0.04,'sine',0.03); },
  hotSix(){ tone(480,0.34,'sawtooth',0.16,1500); [760,1020,1320,1620].forEach((f,i)=>setTimeout(()=>tone(f,0.13,'square',0.14),i*70)); noise(0.12,0.07,3200); },
  achieve(){ tone(1318,0.16,'sine',0.16); setTimeout(()=>tone(1760,0.28,'sine',0.18),90); },
  record(){ [1046,1318,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.2),i*80)); noise(0.2,0.06,6000); },
  bossRoar(){ tone(72,0.9,'sawtooth',0.3,40); tone(110,0.7,'sawtooth',0.2,55); noise(0.7,0.22,600); setTimeout(()=>{ tone(60,0.6,'sine',0.26,36); },260); },
  nearMiss(){ tone(880,0.22,'sine',0.2,660); setTimeout(()=>tone(560,0.3,'sine',0.16,420),140); noise(0.12,0.05,1800); },
  vaultOpen(){ tone(64,0.5,'sine',0.28,50); noise(0.4,0.16,400); setTimeout(()=>{ noise(0.14,0.12,900); tone(96,0.3,'sine',0.2); },240); setTimeout(()=>{ [880,1174,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.24,'sine',0.14),i*70)); },480); },
  wheelTick(sp){ tone(1400+sp*900,0.045,'square',0.09+sp*0.06); },
  uiDing(){ tone(2093,0.09,'sine',0.08); tone(2637,0.07,'sine',0.05); },
  secretFound(){ [659,880,1046,1318,880,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'sine',0.13),i*85)); noise(0.5,0.04,5200); },
  vaultBuy(){ tone(110,0.28,'sine',0.24,80); noise(0.2,0.12,700); [1046,1318,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine',0.15),120+i*60)); setTimeout(()=>SFX.chipStack&&SFX.chipStack(),80); }
};
function startDrone(){
  if(!AC||muted||drone) return;
  drone=AC.createOscillator(); droneGain=AC.createGain();
  drone.type='sine'; drone.frequency.value=55;
  droneGain.gain.setValueAtTime(0.0001,AC.currentTime);
  droneGain.gain.exponentialRampToValueAtTime(0.14,AC.currentTime+0.6);
  drone.connect(droneGain); droneGain.connect(master); drone.start();
}
function stopDrone(){
  if(!drone) return;
  try{ droneGain.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.4); drone.stop(AC.currentTime+0.45);}catch(e){}
  drone=null; droneGain=null;
}
