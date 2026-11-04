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
  // E3: the master chain — glue compressor → brick limiter → soft-ceiling clipper.
  // Stacked ceremonies swell and press into the ceiling; nothing ever crosses it.
  let tail=master;
  try{ _comp=AC.createDynamicsCompressor();
    _comp.threshold.value=-16; _comp.ratio.value=3; _comp.knee.value=10; _comp.attack.value=0.006; _comp.release.value=0.2;
    tail.connect(_comp); tail=_comp; }catch(e){ _comp=null; }
  try{ const lim=AC.createDynamicsCompressor();
    lim.threshold.value=-4; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=0.001; lim.release.value=0.09;
    tail.connect(lim); tail=lim; _e3.lim=lim; }catch(e){}
  try{ const pre=AC.createGain(); pre.gain.value=0.5; const sh=AC.createWaveShaper(); sh.curve=_e3Ceiling(); sh.oversample='2x';
    tail.connect(pre); pre.connect(sh); tail=sh; _e3.clip=sh; }catch(e){}
  tail.connect(AC.destination);
  try{ sfxBus=AC.createGain(); sfxBus.gain.value=(typeof b3SfxTarget==='function')?b3SfxTarget():1; sfxBus.connect(master);
    musicBus=AC.createGain(); musicBus.gain.value=1; musicBus.connect(master); }catch(e){ sfxBus=null; musicBus=null; }
  try{ e3Wire(); }catch(e){}
}
/* ==== E3 — THE MIXING DESK ====
   Every synth voice is filed under a category and rides that category's
   bus (bus → sfxBus [SFX dial] → master [MASTER dial] → limiter). Each
   bus has a fixed trim, a voice cap and a density knee: past the knee every
   new voice is quieter by √(knee/n), so a 300-enemy storm thickens into a
   crunchy chatter instead of a wall of noise. Big moments duck the beds and
   the melee. Uncategorised direct tone() calls are filed by game state. */
const _e3={ lim:null, clip:null, ctx:null, bus:{}, duck:{}, n:{}, drops:{}, played:{}, peakV:0, ambLvl:null, ambMul:1 };
const E3_MIX ={ ui:0.62, combat:0.55, kill:0.72, pickup:0.62, slot:0.78, jackpot:0.86, boss:0.9, voice:0.72, amb:0.8 };
const E3_CAP ={ ui:10, combat:18, kill:9, pickup:10, slot:40, jackpot:110, boss:24, voice:16, amb:30 };
const E3_KNEE={ ui:3, combat:6, kill:4, pickup:4, slot:18, jackpot:48, boss:10, voice:6, amb:99 };
let _cat=null;
// soft ceiling: linear to 0.85, then a tanh shoulder that never reaches 1.0 (input range ±2 after the 0.5 pre-gain)
function _e3Ceiling(){ const N=4097, c=new Float32Array(N);
  for(let i=0;i<N;i++){ const x=(i/(N-1)*2-1)*2, a=Math.abs(x); c[i]=Math.sign(x)*(a<0.85?a:0.85+0.13*Math.tanh((a-0.85)/0.13)); }
  return c; }
function _e3DefCat(){
  try{ const s=state;
    if(s==='slot'||s==='wheel'||s==='crash'||s==='vault'||s==='marker') return 'slot';
    if(s==='menu'||s==='paused'||s==='dead') return 'ui'; }catch(e){}
  return 'combat';
}
function _e3Bus(c){
  if(!AC) return null;
  if(_e3.ctx!==AC){ _e3.ctx=AC; _e3.bus={}; _e3.n={}; _e3.ambLvl=null; }
  let b=_e3.bus[c]; if(b) return b;
  try{ b=AC.createGain(); b.gain.value=E3_MIX[c]||0.7;
    if(c==='amb'){ const l=AC.createGain(); l.gain.value=_e3.ambMul; b.connect(l); l.connect(_sfxOut()); _e3.ambLvl=l; }
    else b.connect(_sfxOut());
    _e3.bus[c]=b; return b; }catch(e){ return _sfxOut(); }
}
function _e3Admit(c,vol){
  const n=_e3.n[c]||0;
  if(n>=(E3_CAP[c]||16) || (_voices>=140 && vol<0.15) || _voices>=190){ _e3.drops[c]=(_e3.drops[c]||0)+1; return 0; }
  _e3.n[c]=n+1; _voices++;
  const k=E3_KNEE[c]||99; return n+1<=k ? 1 : Math.sqrt(k/(n+1));
}
function _e3Free(c){ _voices=Math.max(0,_voices-1); _e3.n[c]=Math.max(0,(_e3.n[c]||0)-1); }
// duck: pull these buses down to `depth` × their trim, hold `ms`, breathe back up
function e3Duck(ms,depth,cats){
  if(!AC) return; const now=AC.currentTime;
  for(const c of (cats||['amb'])){ const b=_e3Bus(c); if(!b||!b.gain) continue;
    const d=_e3.duck[c]||{until:0,depth:1}; const active=d.until>now;
    const dp=active?Math.min(d.depth,depth):depth, until=Math.max(active?d.until:0, now+(ms||1000)/1000);
    _e3.duck[c]={until,depth:dp};
    const base=E3_MIX[c]||0.7;
    try{ b.gain.cancelScheduledValues(now); b.gain.setValueAtTime(Math.max(0.0001,b.gain.value),now);
      b.gain.setTargetAtTime(base*dp, now, 0.025); b.gain.setTargetAtTime(base, until, 0.3); }catch(e){}
  }
}
// run fn with category c; setTimeout calls made inside inherit it (delayed notes stay on their bus)
function _e3In(c,fn){
  if(!c) return fn();
  const pc=_cat, st=window.setTimeout; _cat=c;
  window.setTimeout=function(cb,ms){ const rest=Array.prototype.slice.call(arguments,2);
    if(typeof cb!=='function') return st.apply(window,arguments);
    return st.call(window,function(){ const p2=_cat; _cat=c; try{ return cb.apply(this,arguments); } finally{ _cat=p2; } },ms,...rest); };
  try{ return fn(); } finally{ _cat=pc; window.setTimeout=st; }
}
// ambience room tone helpers (noise buffers that loop without a seam)
const _e3NB={};
function _e3LoopNoise(sec){
  const key=AC.sampleRate+':'+sec; if(_e3NB[key]&&_e3NB[key].ctx===AC) return _e3NB[key].buf;
  const sr=AC.sampleRate, N=Math.floor(sr*sec), X=Math.floor(sr*0.06), tmp=new Float32Array(N+X);
  for(let i=0;i<N+X;i++) tmp[i]=Math.random()*2-1;
  const buf=AC.createBuffer(1,N,sr), d=buf.getChannelData(0);
  for(let i=0;i<N;i++) d[i]=tmp[i];
  for(let i=0;i<X;i++){ const a=i/X; d[i]=tmp[i]*Math.sqrt(a)+tmp[N+i]*Math.sqrt(1-a); } // the tail flows into the head: no seam
  _e3NB[key]={ctx:AC,buf}; return buf;
}
function startAmbience(){
  if(!AC||muted) return;
  if(typeof GFX!=='undefined'&&GFX.amb===false) return;
  let fl='pit'; try{ const f=(typeof curFloor==='function')?curFloor():null; if(f&&f.id) fl=f.id; }catch(e){}
  if(_amb){ if(_amb.floor===fl) return; stopAmbience(); }
  try{ _amb=e3Bed(fl); }catch(e){ _amb=null; }
}
function stopAmbience(){ try{ if(_amb){ const a=_amb; _amb=null; a.stop(); } }catch(e){ _amb=null; } }
function tone(freq,dur,type,vol,slideTo,delay){
  if(!AC||muted) return;
  vol=vol||0.2; const c=_cat||_e3DefCat();
  const dv=_e3Admit(c,vol); if(!dv) return;
  const t=AC.currentTime+(delay||0), o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'square'; o.frequency.setValueAtTime(freq,t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), t+dur);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol*dv), t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.onended=()=>_e3Free(c);
  o.connect(g); g.connect(_e3Bus(c)||_sfxOut()); o.start(t); o.stop(t+dur+0.02);
}
// one shared noise bed; each burst starts at a random offset (no per-call buffer allocation)
function noise(dur,vol,lp,delay){
  if(!AC||muted) return;
  vol=vol||0.2; const c=_cat||_e3DefCat();
  const dv=_e3Admit(c,vol); if(!dv) return;
  const t=AC.currentTime+(delay||0), buf=_e3LoopNoise(2);
  const s=AC.createBufferSource(); s.buffer=buf; s.loop=true;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp||1400;
  const g=AC.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol*dv,t+0.003); g.gain.linearRampToValueAtTime(0,t+dur);
  s.onended=()=>_e3Free(c);
  s.connect(f); f.connect(g); g.connect(_e3Bus(c)||_sfxOut());
  s.start(t, Math.random()*1.9); s.stop(t+dur+0.01);
}
const SFX={
  shoot(){ tone(220+Math.random()*40,0.06,'square',0.05,140); },
  hit(){ const v=Math.random()*60; tone(300+v,0.05,'square',0.07,190); tone(120+v*0.4,0.06,'sine',0.09,60); noise(0.03,0.05,2600); },
  coin(){ const dk=(window._hbDuck&&performance.now()<window._hbDuck)?0.6:1; tone(880,0.05,'square',0.10*dk); setTimeout(()=>tone(1320,0.07,'square',0.09*dk),40); }, // bright square ping
  xp(){ tone(520,0.05,'sine',0.05); }, // soft sine blip — never confused with gold
  tick(){ tone(1200+Math.random()*300,0.03,'square',0.05); }, // UI trimmed -6dB under the game
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
  // level / levelUp / jackpot / bigWin / nearMiss: see the E3 House-motif block below
  thud(){ tone(180,0.28,'sine',0.22,80); noise(0.14,0.1,600); },
  diceRattle(){ for(let i=0;i<6;i++) setTimeout(()=>{ tone(200+Math.random()*320,0.03,'square',0.06); noise(0.02,0.05,3200); }, i*55); },
  dingHit(step){ step=Math.max(1,step||1); const bases=[1319,1568,1976,2349,2794,3322]; const base=bases[Math.min(bases.length-1,step-1)]; const vol=0.30+step*0.045; tone(base,0.46,'sine',vol); tone(base*1.5,0.34,'sine',vol*0.42); tone(base*2,0.24,'sine',vol*0.26); if(step>=2) setTimeout(()=>tone(base*1.25,0.3,'sine',vol*0.5),42); if(step>=3) setTimeout(()=>tone(base*2,0.3,'sine',vol*0.44),84); if(step>=4) setTimeout(()=>tone(base*2.5,0.26,'sine',vol*0.4),126); noise(0.12,0.05+step*0.012,7200); },
  dingBells(){ const seq=[1568,2093,1568,2637,2093,3136,2093,2637,1568,2093,3136,2637,3136,2093,3729]; seq.forEach((f,i)=>setTimeout(()=>{ tone(f,0.46,'sine',0.36); tone(f*1.5,0.34,'sine',0.14); tone(f*0.5,0.2,'sine',0.06); },i*52)); noise(0.34,0.1,7500); for(let i=0;i<6;i++) setTimeout(()=>tone(2600+Math.random()*1200,0.05,'triangle',0.07),300+i*40); },
  multDing(m){ const f=700+Math.min(1700,m*55); tone(f,0.14,'sine',0.2); setTimeout(()=>tone(f*1.5,0.16,'sine',0.17),70); noise(0.15,0.06,3000); },
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
/* ==== E3 — THE HOUSE MOTIF + signature stings ====
   The whole House plays in D. Four notes are its signature: up a fifth,
   a step down, home an octave higher — ta-ta-ta-DAAH. Jackpots ring it on
   bells, the level-up slot sparkles it on a music box, a rank-up sings it
   slow on the organ, and the HOUSE itself arrives with it bent dark and low. */
const E3_MOTIF=[0,7,5,12], E3_MOTIF_DARK=[0,7,6,-1];
const E3_D=587.33; // D5 — the House's key
function houseMotif(root,o){
  o=o||{}; const st=o.steps||E3_MOTIF, gap=o.gap||0.085, w=o.wave||'sine', v=o.vol||0.15, d=o.dur||0.26, at=o.at||0;
  st.forEach((s,i)=>{
    const f=root*Math.pow(2,s/12), last=i===st.length-1, when=at+i*gap+(last?gap*0.45:0), dd=last?d*(o.tail||2.6):d, vv=v*(last?1.12:1);
    tone(f,dd,w,vv,0,when);
    if(o.oct) tone(f*2,dd*0.6,'sine',vv*o.oct,0,when);
    if(o.bell) tone(f*2.756,dd*0.45,'sine',vv*o.bell,0,when);           // inharmonic bell partial
    if(o.sub && (i===0||last)) tone(f/2,dd*1.3,o.subWave||'sine',vv*o.sub,0,when);
    if(last && o.chord){ tone(f*1.26,dd,'sine',vv*0.42,0,when+0.012); tone(f*1.498,dd,'sine',vv*0.38,0,when+0.024); }
  });
  return at+st.length*gap+gap*0.45;
}
// D-major pentatonic, the steps every rising pickup scale climbs
const E3_PENT=[0,2,4,7,9];
function e3Pent(i){ return Math.pow(2,(E3_PENT[i%5]+12*Math.floor(i/5))/12); }
// a held, trembling chord (near-miss tension) — tremolo rides an LFO, no clicks
function e3Hold(freqs,dur,vol,trem,at){
  if(!AC||muted) return; const c=_cat||'slot'; const t=AC.currentTime+(at||0);
  const out=AC.createGain(); out.gain.setValueAtTime(0.0001,t); out.gain.exponentialRampToValueAtTime(vol,t+dur*0.7); out.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  const tg=AC.createGain(); tg.gain.value=0.65; const lfo=AC.createOscillator(); lfo.frequency.value=trem||11; const ld=AC.createGain(); ld.gain.value=0.35;
  lfo.connect(ld); ld.connect(tg.gain); tg.connect(out); out.connect(_e3Bus(c)||_sfxOut());
  const os=freqs.map(f=>{ const o=AC.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(f,t); o.frequency.linearRampToValueAtTime(f*1.012,t+dur); o.connect(tg); o.start(t); o.stop(t+dur+0.05); return o; });
  lfo.start(t); lfo.stop(t+dur+0.05);
  os[0].onended=()=>{ try{ out.disconnect(); }catch(e){} };
}
Object.assign(SFX,{
  // kills: one bright pentatonic tick per kill, merged when they come faster than 32ms —
  // the merged ones come back as a short crunch, so a storm reads as dense, not as noise
  kill(ks){ const n=performance.now(); if(n-(SFX._kT||0)<32){ SFX._kM=(SFX._kM||0)+1; return; } SFX._kT=n;
    const m=SFX._kM||0; SFX._kM=0; const kf=440*e3Pent(Math.min(10,(ks||0)>>1));
    tone(kf,0.07,'triangle',0.085,kf*2); tone(kf*2,0.05,'sine',0.04);
    if(m>0) noise(0.05,Math.min(0.07,0.022+m*0.009),2000+Math.min(8,m)*260); },
  streakStep(ks){ tone(700*Math.pow(1.0595,Math.min(24,ks/25)),0.09,'sine',0.12); },
  // the vacuum scale: coins climb D major in A (bright), XP climbs D pentatonic an octave down (soft) — never clash
  coinStep(cb){ const deg=[0,2,4,5,7,9,11]; const f=880*Math.pow(2,(deg[cb%7]+12*Math.min(1,Math.floor(cb/7)))/12)*(cb>=14?1.5:1);
    tone(f,0.06,'sine',0.07); if(cb>=7) tone(f*2,0.04,'sine',0.018); },
  xpStep(cb){ tone(587.33*e3Pent(cb),0.05,'triangle',0.07+cb*0.003); },
  crit(){ tone(2350,0.05,'triangle',0.085,1600); },
  level(){ houseMotif(E3_D,{gap:0.07,vol:0.13,dur:0.3}); },
  // the level-up slot: the motif on a quick music box over a warm bass, then the shimmer
  levelUp(){
    tone(146.8,0.8,'sine',0.26,110);
    const end=houseMotif(E3_D,{gap:0.085,wave:'triangle',vol:0.2,dur:0.32,oct:0.35,tail:2.2,chord:true});
    [1760,2349,2960].forEach((f,i)=>tone(f,0.4,'sine',0.13,0,end+0.05+i*0.1));
    noise(0.5,0.05,6500,0.25);
    for(let i=0;i<7;i++) tone(2600+Math.random()*900,0.06,'triangle',0.06,0,end+0.3+i*0.048);
  },
  // jackpot: the motif rung on bells, an octave up, over a boom — then the coins pour
  jackpot(){
    tone(73.4,0.9,'sine',0.3,55);
    const end=houseMotif(E3_D*2,{gap:0.075,vol:0.17,dur:0.3,bell:0.35,sub:0.4,chord:true,tail:2.8});
    [2349,2794,3520,2794,3136,3729].forEach((f,i)=>tone(f,0.18,'sine',0.08,0,end+i*0.05));
    noise(0.6,0.1,3200);
  },
  bigWin(tier){ tier=tier||1;
    if(tier>=3){ const r=tier>=4?E3_D*2:E3_D; houseMotif(r,{gap:0.08,vol:0.15,dur:0.3,bell:0.25,sub:0.35,chord:tier>=4,tail:2.4}); noise(0.7,0.09,3200); return; }
    const notes=[587,740,880,1175,1480,1760,2349,2960]; const n=Math.min(notes.length,4+tier);
    for(let i=0;i<n;i++) tone(notes[i],0.42,'sine',0.17,0,i*0.085); noise(0.7,0.08,3200); },
  // near miss: the machine holds its breath on a trembling minor second — then sighs down
  nearMiss(){ e3Hold([1175,1245,587],0.62,0.11,12);
    tone(1175,0.24,'sine',0.14,880,0.62); tone(740,0.36,'sine',0.12,550,0.76); noise(0.12,0.04,1800,0.62); },
  // triple: a held swell (the machine inhales) → the full cascade: motif high, then a waterfall of bells to the floor
  triple(){
    tone(220,0.4,'sawtooth',0.05,880); noise(0.38,0.05,5200); tone(146.8,0.4,'sine',0.12,293);
    const t0=0.38;
    tone(73.4,1.1,'sine',0.3,49,t0); noise(0.25,0.12,2600,t0);
    const end=houseMotif(E3_D*2,{at:t0,gap:0.06,vol:0.15,dur:0.22,bell:0.3,tail:2,chord:true});
    for(let i=0;i<14;i++){ const f=E3_D*4*Math.pow(2,-(E3_PENT[i%5]+12*Math.floor(i/5))/12); tone(f,0.3,'sine',0.08,0,end+i*0.038); tone(f*2.756,0.12,'sine',0.02,0,end+i*0.038); }
  },
  // rank-up: slow, on the organ, over a choir — the House writes your name a rank higher
  rankUp(){
    SFX.seraph();
    houseMotif(E3_D/2,{at:0.18,gap:0.2,wave:'triangle',vol:0.15,dur:0.5,oct:0.5,sub:0.5,chord:true,tail:2.4});
    setTimeout(()=>SFX.dingBells(),1050);
  },
  // THE HOUSE walks the floor: the sub-drop, then the motif bent dark — the last note slips below home
  houseArrive(){
    tone(38,1.6,'sine',0.32,24);
    houseMotif(146.8,{at:0.35,steps:E3_MOTIF_DARK,gap:0.3,wave:'sawtooth',vol:0.07,dur:0.55,sub:0.9,tail:3});
    houseMotif(146.8,{at:0.35,steps:E3_MOTIF_DARK,gap:0.3,wave:'sine',vol:0.13,dur:0.55,tail:3});
    [0,1,2].forEach(i=>{ tone(1174.7,1.4,'sine',0.05,0,0.35+i*0.6); tone(1174.7*2.756,0.6,'sine',0.012,0,0.35+i*0.6); }); // a far bell tolls three
    noise(1.4,0.06,300,0.35);
  }
});
// THE BEDS — one per floor, synthesized, low, looping without seams, ducked under big moments
function e3Bed(fl){
  const t0=AC.currentTime, nodes=[], timers=[];
  const out=AC.createGain(); out.gain.setValueAtTime(0.0001,t0); out.gain.exponentialRampToValueAtTime(1,t0+2.4);
  out.connect(_e3Bus('amb')||_sfxOut());
  const src=(sec)=>{ const s=AC.createBufferSource(); s.buffer=_e3LoopNoise(sec); s.loop=true; s.start(t0,Math.random()*sec*0.9); nodes.push(s); return s; };
  const filt=(type,f,q)=>{ const b=AC.createBiquadFilter(); b.type=type; b.frequency.value=f; if(q!=null) b.Q.value=q; return b; };
  const gn=(v,dst)=>{ const g=AC.createGain(); g.gain.value=v; g.connect(dst||out); return g; };
  const lfo=(hz,depth,param)=>{ const o=AC.createOscillator(); o.frequency.value=hz; const g=AC.createGain(); g.gain.value=depth; o.connect(g); g.connect(param); o.start(t0); nodes.push(o); return o; };
  const pan=(p,dst)=>{ try{ const sp=AC.createStereoPanner(); sp.pan.value=p; sp.connect(dst||out); return sp; }catch(e){ return dst||out; } };
  const chain=(...ns)=>{ for(let i=0;i<ns.length-1;i++) ns[i].connect(ns[i+1]); return ns[0]; };
  const blip=(f,dur,type,vol,slide,at,dst)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,at);
    if(slide) o.frequency.exponentialRampToValueAtTime(slide,at+dur); g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(vol,at+0.004);
    g.gain.exponentialRampToValueAtTime(0.0001,at+dur); o.connect(g); g.connect(dst||out); o.start(at); o.stop(at+dur+0.02); };
  const puff=(dur,vol,type,f,q,at,dst)=>{ const s=AC.createBufferSource(); s.buffer=_e3LoopNoise(2); s.loop=true; const b=filt(type,f,q), g=AC.createGain();
    g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(vol,at+Math.min(0.02,dur*0.3)); g.gain.linearRampToValueAtTime(0,at+dur);
    s.connect(b); b.connect(g); g.connect(dst||out); s.start(at,Math.random()*1.8); s.stop(at+dur+0.02); };
  // every floor: a whisper of casino air
  chain(src(3.3), filt('lowpass',220), gn(0.022));
  const ev=[]; // scheduled ambience events: {next, fire(at)}
  const every=(lo,hi,fire)=>ev.push({next:t0+lo+Math.random()*(hi-lo),lo,hi,fire});
  if(fl==='pit'||fl==='ballroom'){
    const k=fl==='pit'?1:0.45;
    // the crowd: two formant bands of babble, each breathing on its own slow swell
    const g1=gn(0.026*k); chain(src(4.1), filt('bandpass',430,0.8), g1); lfo(0.11,0.011*k,g1.gain);
    const g2=gn(0.010*k); chain(src(3.7), filt('bandpass',1150,1.6), g2); lfo(0.19,0.005*k,g2.gain);
    // a distant chip clack now and then
    every(2.5,6,at=>{ const p=pan(Math.random()*1.4-0.7); for(let i=0;i<2+(Math.random()*3|0);i++) blip(2600+Math.random()*1200,0.018,'square',0.006*k,0,at+i*0.05,p); });
    if(fl==='pit'){
      // a roulette a few tables over: the ball skitters, slows, drops — the far table gasps
      every(14,26,at=>{ const p=pan(Math.random()<0.5?-0.55:0.55); let t=at, iv=0.055;
        while(iv<0.36){ blip(1900+Math.random()*700,0.014,'square',0.008,0,t,p); t+=iv; iv*=1.09; }
        blip(1500,0.03,'square',0.012,0,t,p); blip(1250,0.03,'square',0.01,0,t+0.07,p);
        if(Math.random()<0.6) puff(1.1,0.018,'bandpass',600,0.9,t+0.15,p); });
    } else {
      // crystal overhead: two glasses touch somewhere in the mirrors
      every(6,12,at=>{ const p=pan(Math.random()*1.6-0.8), f=2800+Math.random()*900; blip(f,0.5,'sine',0.007,0,at,p); blip(f*1.5,0.4,'sine',0.004,0,at+0.03,p); });
    }
  } else if(fl==='cellar'){
    // the cellar: a low stone rumble, water dripping into its own echo, the swarm skittering in the walls
    chain(src(3.9), filt('lowpass',90), gn(0.05));
    const dl=AC.createDelay(1); dl.delayTime.value=0.29; const fb=AC.createGain(); fb.gain.value=0.38; const lp=filt('lowpass',1800);
    dl.connect(lp); lp.connect(fb); fb.connect(dl); const wet=gn(0.6); lp.connect(wet); nodes.push({stop(){ try{ fb.disconnect(); }catch(e){} }});
    every(0.7,2.6,at=>{ const f=1300+Math.random()*1300, p=pan(Math.random()*1.6-0.8,dl); blip(f*1.5,0.07,'sine',0.02,f,at,p); });
    every(2.2,5.5,at=>{ const p=pan(Math.random()*1.8-0.9); const n=6+(Math.random()*12|0); let t=at;
      for(let i=0;i<n;i++){ puff(0.008+Math.random()*0.008,0.009+Math.random()*0.008,'highpass',3200+Math.random()*1800,0.7,t,p); t+=0.012+Math.random()*0.022; } });
  } else if(fl==='chapel'){
    // the chapel: an organ that never stops praying — Dm → B♭ → Gm → A, gliding, a choir breath above
    const org=filt('lowpass',900,0.5); const og=gn(1); org.connect(og); lfo(0.07,260,org.frequency);
    const CH=[[73.42,110,146.83,174.61],[58.27,87.31,146.83,174.61],[49,73.42,98,116.54],[55,82.41,110,138.59]];
    const vs=[]; CH[0].forEach((f,i)=>{ [-3,3].forEach(c=>{ const o=AC.createOscillator(); o.type=i===0?'sine':'triangle'; o.frequency.value=f; o.detune.value=c; const g=AC.createGain(); g.gain.value=i===0?0.0045:0.002; o.connect(g); g.connect(org); o.start(t0); nodes.push(o); vs.push({o,i}); }); });
    let ci=0; every(11,15,at=>{ ci=(ci+1)%CH.length; vs.forEach(v=>{ try{ v.o.frequency.setTargetAtTime(CH[ci][v.i],at,0.9); }catch(e){} }); });
    const cg=gn(0.005); chain(src(3.1), filt('bandpass',880,2.2), cg); lfo(0.05,0.003,cg.gain);
  }
  // the scheduler looks 0.4s ahead on the audio clock — works the same at any frame rate
  const tick=()=>{ if(!AC) return; const now=AC.currentTime;
    for(const e of ev){ if(e.next<now) e.next=now+0.05; while(e.next<now+0.4){ try{ e.fire(e.next); }catch(x){} e.next+=e.lo+Math.random()*(e.hi-e.lo); } } };
  if(ev.length){ tick(); timers.push(setInterval(tick,200)); }
  return { floor:fl, stop(){
    timers.forEach(clearInterval);
    try{ const t=AC.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(Math.max(0.0001,out.gain.value),t); out.gain.exponentialRampToValueAtTime(0.0001,t+0.6); }catch(e){}
    setTimeout(()=>{ nodes.forEach(n=>{ try{ n.stop(); }catch(e){} }); try{ out.disconnect(); }catch(e){} },700);
  } };
}
function startDrone(){
  if(!AC||muted||drone) return;
  drone=AC.createOscillator(); droneGain=AC.createGain();
  drone.type='sine'; drone.frequency.value=55;
  droneGain.gain.setValueAtTime(0.0001,AC.currentTime);
  droneGain.gain.exponentialRampToValueAtTime(0.14,AC.currentTime+0.6);
  drone.connect(droneGain); droneGain.connect(_e3Bus('boss')||_sfxOut()); drone.start();
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
  _whirSrc.connect(_whirFilt); _whirFilt.connect(_whirGain); _whirGain.connect(_e3Bus('slot')||_sfxOut()); _whirSrc.start();
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
  _drumSrc.connect(f); f.connect(_drumGain); _drumGain.connect(_e3Bus('slot')||_sfxOut()); _drumSrc.start();
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
    ['cashout',1200,0.4],['vaultOpen',1500,0.3],['bossRoar',1300,0.4],['death',2400,0.12],['reelLock',900,0.4],['secretFound',1300,0.4],['record',1000,0.45],
    ['triple',1900,0.25],['rankUp',2400,0.25],['houseArrive',3200,0.15]];
  for(const [k,ms,dp] of DUCKS){ const f=SFX[k]; if(typeof f!=='function') continue;
    SFX[k]=function(){ try{ musicDuck(ms,dp); }catch(e){} return f.apply(SFX,arguments); }; }
  const _dd=duckDrone; duckDrone=function(ms){ try{ musicDuck((ms||1200)+200,0.3); }catch(e){} return _dd(ms); }; }
/* ==== C2 — THE HIGH ROLLERS: table sounds for the gambling bosses + elite affixes ==== */
Object.assign(SFX,{
  hrSting(k){ // each lord walks in on his own music
    if(k==='croupier'){ for(let i=0;i<14;i++) setTimeout(()=>{ noise(0.025,0.12,3600-i*120); tone(1800-i*60,0.02,'square',0.04); },i*28); // the riffle
      const mel=[440,523,494,415,440]; let at=480; mel.forEach((f,i)=>{ setTimeout(()=>{ tone(f,i===4?0.8:0.22,'triangle',0.16); tone(f/2,0.2,'sawtooth',0.05); },at); at+=(i===2?300:170); }); // a minor tango
      [110,110,82,110].forEach((f,i)=>setTimeout(()=>tone(f,0.28,'sine',0.26,f*0.7),480+i*230)); }
    else if(k==='bookie'){ for(let i=0;i<10;i++) setTimeout(()=>{ tone(2400+Math.random()*600,0.015,'square',0.05); noise(0.012,0.06,5200); },i*45); // ticker tape
      setTimeout(()=>{ [196,247,294].forEach(f=>tone(f,0.5,'sawtooth',0.09,f*1.02)); tone(98,0.6,'sine',0.24); },500); // brass stab
      setTimeout(()=>{ [262,330,392,523].forEach(f=>tone(f,0.7,'sawtooth',0.08)); tone(131,0.8,'sine',0.26); },820);
      setTimeout(()=>{ tone(1568,0.9,'sine',0.18); tone(2093,0.6,'sine',0.08); },1300); } // ...and they're off
    else if(k==='twins'){ const g=[784,988,1175,1568], b=[740,622,523,370]; // a music box in two minds
      g.forEach((f,i)=>setTimeout(()=>tone(f,0.5,'sine',0.14),i*180)); b.forEach((f,i)=>setTimeout(()=>tone(f,0.5,'triangle',0.12),90+i*180));
      setTimeout(()=>{ tone(440,1.2,'sine',0.13); tone(622,1.2,'sine',0.11); tone(55,1.2,'sine',0.24,40); },820);
      for(let i=0;i<8;i++) setTimeout(()=>tone(2100-i*130,0.03,'square',0.05),900+i*(60+i*14)); }
  },
  hrDeal(){ for(let i=0;i<5;i++) setTimeout(()=>{ noise(0.05,0.1,3200); tone(900+i*80,0.04,'triangle',0.06,1400); },i*70); },
  hrFlipCard(s){ tone(1400,0.03,'square',0.08); noise(0.03,0.08,4200); const f={'♠':330,'♥':523,'♦':1046,'♣':262}[s]||440; setTimeout(()=>tone(f,0.18,'triangle',0.12),40); },
  hrBlade(){ tone(2600,0.09,'sawtooth',0.06,900); noise(0.06,0.08,6000); },
  hrDiamond(){ [1568,2093,2637].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'sine',0.13),i*50)); SFX.chipStack(); },
  hrClub(){ tone(110,0.6,'sine',0.2,70); noise(0.4,0.06,500); },
  hrPalm(){ tone(523,0.12,'sine',0.14); setTimeout(()=>tone(784,0.2,'sine',0.14),80); },
  hrFlipStart(){ tone(1200,0.08,'square',0.12,2400); setTimeout(()=>tone(2400,0.3,'sine',0.12,1800),60); },
  hrCoinTick(p){ tone(1500+p*1400,0.025,'square',0.07); },
  hrCoinWin(){ tone(2637,0.4,'sine',0.2); tone(3136,0.3,'sine',0.1); SFX.dingBells(); },
  hrCoinLose(){ tone(220,0.5,'sawtooth',0.18,70); setTimeout(()=>tone(110,0.6,'sawtooth',0.14,50),150); noise(0.3,0.1,500); },
  hrBoard(){ for(let i=0;i<6;i++) setTimeout(()=>tone(1900+Math.random()*500,0.015,'square',0.06),i*40); setTimeout(()=>{ tone(1568,0.5,'sine',0.18); tone(1976,0.4,'sine',0.1); },260); },
  hrTick(s){ tone(1200+(4-s)*300,0.06,'square',0.12); tone(60,0.12,'sine',0.2); },
  hrBell(){ tone(1568,0.9,'sine',0.2); tone(2349,0.6,'sine',0.1); tone(784,0.9,'triangle',0.08); },
  hrBetWin(o){ const n=o>=10?7:o>=5?5:3; [523,659,784,1047,1319,1568,2093].slice(0,n).forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.18),i*70)); SFX.chipStack(); },
  hrBetLose(){ tone(330,0.3,'sawtooth',0.14,180); setTimeout(()=>tone(196,0.5,'sawtooth',0.14,90),180); noise(0.2,0.08,700); },
  hrSlip(){ noise(0.08,0.08,2600); tone(700,0.05,'triangle',0.06,1100); },
  hrChalk(){ noise(0.12,0.1,1800); tone(260,0.08,'square',0.05,180); },
  hrWheelGo(){ tone(300,0.5,'sawtooth',0.08,1200); noise(0.3,0.06,2200); },
  hrWheelLand(h){ if(h==='gold') [1047,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.17),i*60)); else [392,311,262].forEach((f,i)=>setTimeout(()=>tone(f,0.36,'triangle',0.17),i*70)); tone(90,0.3,'sine',0.22,50); },
  hrBone(){ tone(820,0.05,'square',0.08,520); noise(0.04,0.08,3000); },
  hrChain(){ for(let i=0;i<3;i++) setTimeout(()=>tone(1100+i*240,0.04,'square',0.08),i*30); noise(0.1,0.08,2400); },
  hrDieThrow(){ for(let i=0;i<4;i++) setTimeout(()=>{ noise(0.03,0.1,2600); tone(300+Math.random()*300,0.025,'square',0.06); },i*60); },
  hrDieLand(n){ tone(n<=3?300:180,0.16,'sine',0.18,n<=3?520:90); noise(0.05,0.12,1200); },
  hrSplit(){ tone(1800,0.06,'sawtooth',0.1,500); noise(0.1,0.12,4200); tone(90,0.2,'sine',0.2,50); }
});

/* ==== E3 — THE WIRING ====
   Files every SFX method under a bus, throttles machine-gun repeats per
   method, ducks the room under the big moments, and lets the director's
   music (B3) take priority over the floor beds when a track is playing.
   Runs once all scripts are loaded (and again at initAudio for late methods). */
const E3_CAT={
  ui:'tick uiDing press padNav padBack padJoin padLeave bindSet refuse chipClink chipTick register cardFlip riffle achieve anteUp',
  combat:'shoot hit eshoot knife card nova seeker hurt diceRattle crit',
  kill:'kill streakStep',
  pickup:'coin xp coinPling coinStep xpStep xpCharge chipStack',
  slot:'reelStop reelHit reelLock reelTick riser lever leverWind leverSlam dice diceLand diceThrow winDing bust win lose selectorGo selectorTick dingHit multDing wheelTick hotSix nearMiss tingle casinoDing rarSting a2Clunk a2Ratchet a2Pull a2Payline',
  jackpot:'jackpot bigWin dingBells seraph cashout levelUp levelDing level record secretFound ascMotif vaultOpen vaultBuy triple rankUp seatUnlock',
  boss:'bossRoar houseArrive death stigmata',
  voice:'murmur cheer thud'
};
const _e3CatOf={}; for(const c in E3_CAT) for(const k of E3_CAT[c].split(' ')) _e3CatOf[k]=c;
// minimum ms between two plays of the same method (a repeat inside the window is dropped)
const E3_GAP={ hit:28, shoot:34, eshoot:55, knife:38, card:38, nova:70, seeker:45, hurt:90, crit:60, coin:26, xp:22, coinPling:30, coinStep:20, xpStep:20,
  xpCharge:40, chipStack:55, casinoDing:55, dingBells:130, seraph:220, cashout:140, tingle:80, reelLock:70, cheer:140, murmur:260, thud:45,
  bossRoar:280, jackpot:280, bigWin:240, levelUp:380, levelDing:200, diceRattle:60, reelTick:18, wheelTick:16, uiDing:40, tick:30, multDing:50,
  record:300, secretFound:300, vaultBuy:120, streakStep:60, death:1500 };
// how hard each big moment ducks the room [ms, amb depth, melee depth]
const E3_DUCK={ jackpot:[1800,0.15,0.45], bigWin:[1800,0.2,0.5], levelUp:[1500,0.25,0.55], triple:[2200,0.15,0.4], rankUp:[2600,0.15,0.5],
  houseArrive:[4200,0.08,0.3], bossRoar:[1400,0.3,0.7], vaultOpen:[1500,0.25,0.6], death:[2600,0.1,0.3], seraph:[1500,0.3,0.6],
  dingBells:[900,0.45,0.75], cashout:[1000,0.4,0.75], nearMiss:[1200,0.3,0.6], secretFound:[1300,0.35,0.7] };
const E3_MELEE=['combat','kill','pickup'];
function e3Wire(){
  const now0=()=>performance.now();
  for(const k in SFX){ const f=SFX[k]; if(typeof f!=='function'||f._e3) continue;
    const c=_e3CatOf[k]||null, gap=E3_GAP[k]||0, dk=E3_DUCK[k];
    const w=function(){
      if(gap){ const n=now0(); if(n-(_e3.played[k]||-1e9)<gap){ _e3.drops['~'+k]=(_e3.drops['~'+k]||0)+1; return; } _e3.played[k]=n; }
      if(dk){ try{ e3Duck(dk[0],dk[1],['amb']); e3Duck(dk[0]*0.7,dk[2],E3_MELEE); }catch(e){} }
      const a=arguments; return _e3In(c||_cat, ()=>f.apply(SFX,a));
    };
    w._e3=1; w._e3f=f; SFX[k]=w; }
  // D3's ballroom: its hazards are stings, its music box is part of the room bed
  try{ if(typeof BAL_SFX!=='undefined') for(const k in BAL_SFX){ const f=BAL_SFX[k]; if(typeof f!=='function'||f._e3) continue;
      const w=function(){ const a=arguments; return _e3In('voice',()=>f.apply(BAL_SFX,a)); }; w._e3=1; BAL_SFX[k]=w; } }catch(e){}
  try{ if(typeof balMusic==='function' && !balMusic._e3){ const f=balMusic; balMusic=function(){ const a=arguments; return _e3In('amb',()=>f.apply(this,a)); }; balMusic._e3=1; } }catch(e){}
}
window.addEventListener('load',()=>{ try{ e3Wire(); }catch(e){} });
// the director's band outranks the floor: while a track sounds, the beds sink to a third
setInterval(()=>{ try{
  const on=(typeof MUSIC!=='undefined') && MUSIC.track && MUSIC.decks.some(d=>d.vol>0.05);
  const want=on?0.35:1; if(Math.abs(want-_e3.ambMul)<0.001) return; _e3.ambMul=want;
  if(_e3.ambLvl&&AC) _e3.ambLvl.gain.setTargetAtTime(want,AC.currentTime,0.6);
}catch(e){} },250);
