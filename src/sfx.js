"use strict";
/* ---------- audio (synth casino SFX) ---------- */
let AC=null, master=null, muted=false, drone=null, droneGain=null;
let _voices=0, _comp=null, _amb=null, _ambG=null;
// B3: two buses ride under the master — every synth voice goes to sfxBus, the score to musicBus
let sfxBus=null, musicBus=null;
function _sfxOut(){ return sfxBus||master; }
// 295: the knob maps perceptually (x^2) — mid-slider FEELS mid-loud
function _masterTarget(){ return 0.8*Math.pow((typeof GFX!=='undefined'&&GFX.vol!==undefined)?GFX.vol:1, 2); }
// 286: volume never hard-cuts — it fades over 120ms
function setMasterVol(fade){
  if(!master||!AC){ return; }
  const tgt = muted?0.0001:Math.max(0.0001,_masterTarget());
  try{ master.gain.cancelScheduledValues(AC.currentTime);
    master.gain.setValueAtTime(Math.max(0.0001,master.gain.value), AC.currentTime);
    master.gain.linearRampToValueAtTime(tgt, AC.currentTime+(fade?0.12:0.02)); }
  catch(e){ master.gain.value=tgt; }
}
function initAudio(){
  if(AC) return;
  try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  master = AC.createGain();
  master.gain.value = _masterTarget();
  // 276: a compressor rides the bus — stacked ceremonies swell, never clip
  try{ _comp=AC.createDynamicsCompressor();
    _comp.threshold.value=-18; _comp.ratio.value=4; _comp.knee.value=12; _comp.attack.value=0.004; _comp.release.value=0.18;
    master.connect(_comp); _comp.connect(AC.destination); }
  catch(e){ master.connect(AC.destination); }
  try{ sfxBus=AC.createGain(); sfxBus.gain.value=(typeof b3SfxTarget==='function')?b3SfxTarget():1; sfxBus.connect(master);
    musicBus=AC.createGain(); musicBus.gain.value=1; musicBus.connect(master); }catch(e){ sfxBus=null; musicBus=null; }
}
// 281: room tone — a whisper of casino air, far below everything
function startAmbience(){
  if(!AC||_amb||muted) return;
  if(typeof GFX!=='undefined'&&GFX.amb===false) return;
  try{
    const n=AC.sampleRate*2, buf=AC.createBuffer(1,n,AC.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
    _amb=AC.createBufferSource(); _amb.buffer=buf; _amb.loop=true;
    const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=220;
    _ambG=AC.createGain(); _ambG.gain.value=0.0001;
    _amb.connect(f); f.connect(_ambG); _ambG.connect(_sfxOut());
    _amb.start(); _ambG.gain.linearRampToValueAtTime(0.025, AC.currentTime+1.2);
  }catch(e){ _amb=null; }
}
function stopAmbience(){ try{ if(_amb){ const a=_amb; _amb=null; if(_ambG) _ambG.gain.linearRampToValueAtTime(0.0001,AC.currentTime+0.4); setTimeout(()=>{try{a.stop();}catch(e){}},450); _ambG=null; } }catch(e){ _amb=null; _ambG=null; }
}
function tone(freq,dur,type,vol,slideTo){
  if(!AC||muted) return;
  if(_voices>=14 && (vol||0.2)<0.1) return; // the pool is full — soft voices yield to loud ones
  _voices++;
  const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'square'; o.frequency.setValueAtTime(freq,t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), t+dur);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol||0.2, t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.onended=()=>{ _voices=Math.max(0,_voices-1); };
  o.connect(g); g.connect(_sfxOut()); o.start(t); o.stop(t+dur+0.02);
}
function noise(dur,vol,lp){
  if(!AC||muted) return;
  if(_voices>=14 && (vol||0.2)<0.1) return;
  _voices++;
  const t=AC.currentTime, n=Math.floor(AC.sampleRate*dur), buf=AC.createBuffer(1,n,AC.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp||1400;
  const g=AC.createGain(); g.gain.value=vol||0.2;
  s.onended=()=>{ _voices=Math.max(0,_voices-1); };
  s.connect(f); f.connect(g); g.connect(_sfxOut()); s.start(); s.stop(t+dur);
}
const SFX={
  shoot(){ tone(220+Math.random()*40,0.06,'square',0.05,140); },
  hit(){ const v=Math.random()*60; tone(300+v,0.05,'square',0.07,190); tone(120+v*0.4,0.06,'sine',0.09,60); noise(0.03,0.05,2600); },
  coin(){ const dk=(window._hbDuck&&performance.now()<window._hbDuck)?0.6:1; tone(880,0.05,'square',0.10*dk); setTimeout(()=>tone(1320,0.07,'square',0.09*dk),40); }, // bright square ping
  xp(){ tone(520,0.05,'sine',0.05); }, // soft sine blip — never confused with gold
  level(){ [523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,0.5,'sine',0.16),i*70)); },
  tick(){ tone(1200+Math.random()*300,0.03,'square',0.05); }, // UI trimmed -6dB under the game
  jackpot(){ [523,659,784,1047,1318,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.4,'sine',0.2),i*70)); noise(0.5,0.12,3000); },
  dice(){ for(let i=0;i<6;i++) setTimeout(()=>noise(0.04,0.14,2200),i*70); },
  win(){ [659,988,1319].forEach((f,i)=>setTimeout(()=>tone(f,0.35,'triangle',0.2),i*80)); },
  lose(){ tone(300,0.5,'sawtooth',0.16,90); },
  hurt(){ noise(0.14,0.2,700); tone(150,0.18,'sawtooth',0.14,70); },
  death(){ [400,320,240,160].forEach((f,i)=>setTimeout(()=>tone(f,0.5,'sawtooth',0.13,f*0.6),i*130)); },
  cheer(){ noise(0.6,0.16,2600); tone(660,0.4,'triangle',0.08); },
  murmur(){ noise(0.4,0.06,900); },
  reelStop(){ tone(140,0.09,'sine',0.15,60); noise(0.05,0.1,1200); },
  reelHit(step){ const base=[349,440,523][Math.min(2,(step||1)-1)]||349; // F-A-C — three stops form a chord
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
  reelTick(){ tone(900+Math.random()*400,0.02,'square',0.03); },
  riser(){ tone(240,0.55,'sawtooth',0.1,900); },
  winDing(){ [1568,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.32,'sine',0.2),i*140)); noise(0.4,0.08,3200); },
  bust(){ tone(240,0.5,'sawtooth',0.16,70); setTimeout(()=>tone(150,0.42,'square',0.12,58),120); },
  diceLand(){ tone(180,0.12,'sine',0.16,110); noise(0.05,0.12,900); },
  lever(){ for(let i=0;i<5;i++) setTimeout(()=>tone(720-i*90,0.04,'square',0.08),i*45); setTimeout(()=>{ tone(120,0.1,'sine',0.16,60); noise(0.05,0.1,900); },250); },
  leverWind(){ for(let i=0;i<7;i++) setTimeout(()=>tone(300+i*40,0.03,'square',0.1),i*32); },
  leverSlam(){ tone(90,0.18,'sine',0.3,40); noise(0.1,0.22,1400); tone(420,0.06,'square',0.14,120); },
  anteUp(){ tone(400,0.12,'square',0.14,560); setTimeout(()=>tone(600,0.18,'sine',0.14),110); noise(0.05,0.1,1500); },
  coinPling(){ const dk=(window._hbDuck&&performance.now()<window._hbDuck)?0.6:1; tone(1200+Math.random()*500,0.05,'square',0.08*dk); }, // 282: ducks while the heart beats
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
  bossRoar(dist){ // dist 0..1 — far roars arrive muffled through the walls
    const dm=1-0.45*Math.min(1,dist||0);
    tone(72,0.9,'sawtooth',0.3*dm,40); tone(110,0.7,'sawtooth',0.2*dm*dm,55); noise(0.7,0.22*dm,600-320*Math.min(1,dist||0)); setTimeout(()=>{ tone(60,0.6,'sine',0.26,36); },260); },
  ascMotif(){ // 288: five notes owned by the ascension alone
    [587,880,1174,1568,2349].forEach((f,i)=>setTimeout(()=>{ tone(f,0.34,'triangle',0.16); tone(f*2,0.2,'sine',0.06); },i*110)); noise(0.6,0.05,6400); },
  nearMiss(){ tone(880,0.22,'sine',0.2,660); setTimeout(()=>tone(560,0.3,'sine',0.16,420),140); noise(0.12,0.05,1800); },
  vaultOpen(){ tone(46,0.85,'sine',0.34,28); noise(0.55,0.2,260); setTimeout(()=>{ noise(0.14,0.12,900); tone(96,0.3,'sine',0.2); },260); setTimeout(()=>{ [1046,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.28,'sine',0.12),i*80)); },520); }, // heavy stone, then the gold inside catches light
  wheelTick(sp){ tone(2100-sp*1100,0.045+sp*0.05,'square',0.09+sp*0.06); }, // pitch falls + stretches as the wheel dies
  rarSting(t){ // rarity reveal: 0 common · 1 uncommon … 4 legendary, 5 ascension/mythic
    if(t<=0){ tone(880,0.08,'sine',0.07); return; }
    if(t===1){ tone(932,0.09,'sine',0.09); setTimeout(()=>tone(1244,0.08,'sine',0.06),55); return; }
    if(t===2){ tone(988,0.1,'sine',0.1); setTimeout(()=>tone(1480,0.09,'sine',0.07),60); return; }
    if(t===3){ [1175,1568,1976].forEach((f,i)=>setTimeout(()=>tone(f,0.12,'sine',0.11),i*70)); setTimeout(()=>SFX.chipStack(),120); return; }
    [1319,1760,2217,2637].forEach((f,i)=>setTimeout(()=>{ tone(f,0.16,'sine',0.13); tone(f/2,0.14,'triangle',0.05); },i*80));
    SFX.dingBells(); if(t>=5) setTimeout(()=>SFX.seraph(),220);
  },
  uiDing(){ tone(2093,0.09,'sine',0.06); tone(2637,0.07,'sine',0.04); },
  // universal press-click: felt-tick under every interactive SPACE, throttled
  // so mashers never clip the mix
  press(){ const n9=performance.now(); if(n9-(SFX._pressT||0)<60) return; SFX._pressT=n9;
    tone(1800,0.03,'square',0.16); noise(0.03,0.06,5200); },
  secretFound(){ [659,880,1046,1318,880,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'sine',0.13),i*85)); noise(0.5,0.04,5200); },
  vaultBuy(){ tone(110,0.28,'sine',0.24,80); noise(0.2,0.12,700); [1046,1318,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine',0.15),120+i*60)); setTimeout(()=>SFX.chipStack&&SFX.chipStack(),80); }
};
function startDrone(){
  if(!AC||muted||drone) return;
  drone=AC.createOscillator(); droneGain=AC.createGain();
  drone.type='sine'; drone.frequency.value=55;
  droneGain.gain.setValueAtTime(0.0001,AC.currentTime);
  droneGain.gain.exponentialRampToValueAtTime(0.14,AC.currentTime+0.6);
  drone.connect(droneGain); droneGain.connect(_sfxOut()); drone.start();
}
// big paydays HUSH the room — the drone ducks so the sting can sing
function duckDrone(ms){
  if(!AC||!droneGain) return;
  try{ const t=AC.currentTime;
    droneGain.gain.cancelScheduledValues(t);
    droneGain.gain.setValueAtTime(Math.max(0.0001,droneGain.gain.value),t);
    droneGain.gain.exponentialRampToValueAtTime(0.015,t+0.09);
    droneGain.gain.exponentialRampToValueAtTime(0.14,t+(ms||1200)/1000);
  }catch(e){}
}
function stopDrone(){
  if(!drone) return;
  try{ droneGain.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.4); drone.stop(AC.currentTime+0.45);}catch(e){}
  drone=null; droneGain=null;
}
/* the ticker's mechanical whirr — a filtered noise loop that spins down with the strip */
let _whirSrc=null, _whirGain=null, _whirFilt=null;
function startWhirr(){
  if(!AC||muted||_whirSrc) return;
  const len=AC.sampleRate*1.2, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  _whirSrc=AC.createBufferSource(); _whirSrc.buffer=buf; _whirSrc.loop=true;
  _whirFilt=AC.createBiquadFilter(); _whirFilt.type='bandpass'; _whirFilt.frequency.value=1400; _whirFilt.Q.value=1.6;
  _whirGain=AC.createGain(); _whirGain.gain.setValueAtTime(0.0001,AC.currentTime);
  _whirGain.gain.exponentialRampToValueAtTime(0.09,AC.currentTime+0.15);
  _whirSrc.connect(_whirFilt); _whirFilt.connect(_whirGain); _whirGain.connect(_sfxOut()); _whirSrc.start();
}
function whirrSpeed(t){ // t: roll progress 0→1; the whirr sinks as the strip slows
  if(!_whirFilt||!AC) return;
  try{ _whirFilt.frequency.setTargetAtTime(1400-1100*t, AC.currentTime, 0.08);
    if(_whirGain) _whirGain.gain.setTargetAtTime(0.09*(1-t*0.75), AC.currentTime, 0.1); }catch(e){}
}
function stopWhirr(){
  if(!_whirSrc) return;
  try{ _whirGain.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.2); _whirSrc.stop(AC.currentTime+0.25);}catch(e){}
  _whirSrc=null; _whirGain=null; _whirFilt=null;
}
let _drumSrc=null, _drumGain=null;
function startDrumroll(){
  if(!AC||muted||_drumSrc) return;
  const len=Math.floor(AC.sampleRate*0.5), buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++){ const ph=(i/len*9)%1; d[i]=(Math.random()*2-1)*Math.pow(1-ph,3)*0.9; }
  _drumSrc=AC.createBufferSource(); _drumSrc.buffer=buf; _drumSrc.loop=true;
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2400; f.Q.value=0.8;
  _drumGain=AC.createGain(); _drumGain.gain.setValueAtTime(0.0001,AC.currentTime);
  _drumGain.gain.exponentialRampToValueAtTime(0.12,AC.currentTime+0.3);
  _drumSrc.connect(f); f.connect(_drumGain); _drumGain.connect(_sfxOut()); _drumSrc.start();
}
function stopDrumroll(){
  if(!_drumSrc) return;
  try{ _drumGain.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.25); _drumSrc.stop(AC.currentTime+0.3);}catch(e){}
  _drumSrc=null; _drumGain=null;
}

// 318: iOS/Safari hold the AudioContext hostage — the first three gestures demand it back
{ let _acTries=0;
  const _acKick=()=>{ try{ if(AC&&AC.state==='suspended') AC.resume().catch(()=>{}); }catch(e){}
    if(++_acTries>=3){ ['pointerdown','keydown','touchstart'].forEach(ev=>window.removeEventListener(ev,_acKick)); } };
  ['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,_acKick)); }

/* ==== B3 — THE HOUSE BAND ====
   Volume dials for the synth bus, and a music channel that plays the
   director's tracks from assets/music/ when they exist beside the page.
   The build bakes the list of present files into window.__AM_MUSIC, so an
   absent file is never even requested (no 404 noise, no console errors).
   A raw index.html (no build) only looks for tracks when SEEK is switched
   on in THE DIALS. Contexts crossfade; big SFX moments duck the band. */
function b3Dial(k,dflt){ return (typeof DIALS!=='undefined' && DIALS && DIALS[k]!=null) ? DIALS[k] : dflt; }
function b3SfxTarget(){ return Math.max(0.0001, Math.pow(b3Dial('sfx',1),2)); }
function b3SetBusVols(){
  if(!AC||!sfxBus) return;
  try{ const t=AC.currentTime; sfxBus.gain.cancelScheduledValues(t); sfxBus.gain.setValueAtTime(Math.max(0.0001,sfxBus.gain.value),t);
    sfxBus.gain.linearRampToValueAtTime(b3SfxTarget(), t+0.1); }catch(e){ try{ sfxBus.gain.value=b3SfxTarget(); }catch(x){} }
}
const MUSIC_CTX=['menu','run','boss','ascent','house'];
const MUSIC_CHAIN={ menu:['menu'], run:['run'], boss:['boss','run'], ascent:['ascent','run'], house:['house','boss','run'] };
const MUSIC={ found:{}, decks:[], want:null, track:null, duck:1, duckTo:1, duckUntil:0, unlocked:false, seeking:false, lastT:0 };
function musicType(u){ return /\.ogg$/i.test(u)?'audio/ogg; codecs="vorbis"':/\.mp3$/i.test(u)?'audio/mpeg':/\.m4a$/i.test(u)?'audio/mp4':''; }
function musicCanPlay(u){ try{ const t=musicType(u); return !!(t && document.createElement('audio').canPlayType(t)); }catch(e){ return false; } }
function musicInit(){
  const m=window.__AM_MUSIC;
  if(m && typeof m==='object') for(const k of MUSIC_CTX){ const list=m[k]||[]; const u=list.find(musicCanPlay); if(u) MUSIC.found[k]=u; }
  if(b3Dial('seek',false)) musicSeek();
}
// SEEK: knock on each door beside the page. An absent file costs one quiet
// "not found" line in the browser log — only ever when the player asked.
function musicSeek(){
  if(MUSIC.seeking) return; MUSIC.seeking=true;
  const tryOne=(k,exts)=>{
    if(MUSIC.found[k] || !exts.length) return;
    const u='assets/music/'+k+'.'+exts[0];
    if(!musicCanPlay(u)){ tryOne(k,exts.slice(1)); return; }
    try{ const a=new Audio(); a.preload='metadata';
      a.addEventListener('loadedmetadata',()=>{ MUSIC.found[k]=u; try{ if(typeof b3DialsMusicLine==='function') b3DialsMusicLine(); }catch(e){} },{once:true});
      a.addEventListener('error',()=>tryOne(k,exts.slice(1)),{once:true});
      a.src=u; a.load(); }catch(e){}
  };
  MUSIC_CTX.forEach((k,i)=>setTimeout(()=>tryOne(k,['ogg','mp3','m4a']),i*120));
}
function musicWanted(){
  if(typeof state==='undefined') return 'menu';
  if(state==='menu') return 'menu';
  if(state==='marker') return null;                         // the death roll plays to silence and a heartbeat
  if(state==='dead') return window._recapDone ? 'menu' : null;
  if(state==='crash') return 'ascent';
  try{ if(typeof enemies!=='undefined' && enemies.length){
      let boss=false; for(const e of enemies){ if(e.boss){ if(e.bossKind==='housegod') return 'house'; boss=true; } }
      if(boss) return 'boss'; } }catch(e){}
  return 'run';
}
function musicTrackFor(ctx){ if(!ctx) return null; for(const k of (MUSIC_CHAIN[ctx]||[])) if(MUSIC.found[k]) return MUSIC.found[k]; return null; }
function musicDuck(ms,depth){ MUSIC.duckTo=Math.min(MUSIC.duckTo, depth==null?0.3:depth); MUSIC.duckUntil=Math.max(MUSIC.duckUntil, performance.now()+(ms||1200)); }
function musicDeck(src){
  const el=new Audio(); el.loop=true; el.preload='auto'; el.src=src;
  const d={el, src, vol:0, target:1, g:null};
  // over http(s) the band plays through the Web Audio master (iOS ignores element.volume);
  // from file:// the element is opaque to Web Audio, so it rides element.volume instead
  if(AC && musicBus && /^https?:$/.test(location.protocol)){
    try{ const n=AC.createMediaElementSource(el); d.g=AC.createGain(); d.g.gain.value=0; n.connect(d.g); d.g.connect(musicBus); }catch(e){ d.g=null; }
  }
  el.volume=0;
  try{ const pr=el.play(); if(pr&&pr.catch) pr.catch(()=>{ d.blocked=true; }); }catch(e){ d.blocked=true; }
  return d;
}
function musicTick(){
  const now=performance.now(); const dt=Math.min(0.25,Math.max(0,(now-(MUSIC.lastT||now))/1000)); MUSIC.lastT=now;
  if(!MUSIC.unlocked) return;
  const tr=musicTrackFor(musicWanted());
  if(tr!==MUSIC.track){ MUSIC.track=tr;
    for(const d of MUSIC.decks) d.target=0;
    if(tr){ const old=MUSIC.decks.find(d=>d.src===tr); if(old) old.target=1; else { try{ MUSIC.decks.push(musicDeck(tr)); }catch(e){} } } }
  if(!MUSIC.decks.length) return;
  if(now>MUSIC.duckUntil) MUSIC.duckTo=1;
  MUSIC.duck += (MUSIC.duckTo-MUSIC.duck)*Math.min(1, dt*(MUSIC.duckTo<MUSIC.duck?14:2.2)); // snap down, breathe back up
  let lvl=Math.pow(b3Dial('music',0.8),2);
  if(typeof state!=='undefined'){ if(state==='paused') lvl*=0.45; else if(typeof tabHold!=='undefined'&&tabHold) lvl*=0.6; }
  const mute=(typeof muted!=='undefined'&&muted);
  for(let i=MUSIC.decks.length-1;i>=0;i--){ const d=MUSIC.decks[i];
    d.vol += Math.sign(d.target-d.vol)*Math.min(Math.abs(d.target-d.vol), dt/1.6); // 1.6s crossfade
    if(d.blocked && d.target>0){ d.blocked=false; try{ const pr=d.el.play(); if(pr&&pr.catch) pr.catch(()=>{ d.blocked=true; }); }catch(e){} }
    const v=Math.max(0,Math.min(1, d.vol*lvl*MUSIC.duck));
    try{ if(d.g){ d.g.gain.setTargetAtTime(v, AC.currentTime, 0.05); d.el.volume=1; }
      else d.el.volume = mute?0:Math.max(0,Math.min(1, v*Math.pow((typeof GFX!=='undefined'&&GFX.vol!=null)?GFX.vol:1,2))); }catch(e){}
    if(d.vol<=0 && d.target===0){ try{ d.el.pause(); d.el.removeAttribute('src'); d.el.load(); if(d.g) d.g.disconnect(); }catch(e){} MUSIC.decks.splice(i,1); }
  }
}
setInterval(musicTick,50);
{ const unlock=()=>{ MUSIC.unlocked=true; };
  ['pointerdown','keydown','touchend'].forEach(ev=>window.addEventListener(ev,unlock,{capture:true,passive:true})); }
// big moments hush the band so the sting can sing
{ const DUCKS=[['jackpot',1700,0.22],['bigWin',1900,0.22],['dingBells',1100,0.4],['seraph',1500,0.32],['levelUp',1500,0.35],
    ['cashout',1200,0.4],['vaultOpen',1500,0.3],['bossRoar',1300,0.4],['death',2400,0.12],['reelLock',900,0.4],['secretFound',1300,0.4],['record',1000,0.45]];
  for(const [k,ms,dp] of DUCKS){ const f=SFX[k]; if(typeof f!=='function') continue;
    SFX[k]=function(){ try{ musicDuck(ms,dp); }catch(e){} return f.apply(SFX,arguments); }; }
  const _dd=duckDrone; duckDrone=function(ms){ try{ musicDuck((ms||1200)+200,0.3); }catch(e){} return _dd(ms); }; }
