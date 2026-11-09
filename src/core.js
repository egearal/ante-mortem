"use strict";
/* ============================================================
   ANTE MORTEM — v1 core loop
   ============================================================ */
const CFG = {
  arena: 4200,
  player:{ maxHp:100, speed:210, radius:14, pickup:82,
    damage:11, fireRate:2.0, projectiles:1, pierce:0,
    projSpeed:440, projLife:1.15, projRadius:6,
    crit:0.05, critMult:2.0, instakill:0, regen:0, coinMult:1, lifesteal:0 },
  spawn:{ startInt:0.75, minInt:0.24, ramp:300, baseBatch:4, max:340 },
  wave:{ first:26, grow:6, cap:96, nextAt:0.4, gap:1.15, eliteEvery:4 },
  slot:{ respinBase:14, respinStep:8, critPct:0.20, winSum:7, up:1.6, down:0.85, floor:0.5 },
  weights:{ common:48, uncommon:27, rare:15, epic:9, legendary:1 },
  elite:{ every:40, firstAt:38 },
  scale:{ hp:0.66, dmg:0.22, spd:0.10, spdCap:1.95 },
  enemy:{
    shambler:{ hp:26, spd:90, dmg:8, r:13, xp:1, coins:1, col:'#5c6e50', dark:'#2c3a26' },
    husk:    { hp:15, spd:152,dmg:7, r:10, xp:1, coins:1, col:'#b9b2a0', dark:'#5a5347' },
    swarm:   { hp:9,  spd:176,dmg:6, r:8,  xp:1, coins:0, col:'#8a9a5a', dark:'#3a441f' },
    shooter: { hp:48, spd:66, dmg:10,r:14, xp:4, coins:4, col:'#a8977a', dark:'#3a2e1c', ranged:true }, // A1: bone-ash, gold is earned
    stalker: { hp:42, spd:158,dmg:12,r:12, xp:3, coins:3, col:'#8a3a6a', dark:'#3a1030' },
    hexer:   { hp:54, spd:70, dmg:12,r:15, xp:5, coins:5, col:'#6a4ab5', dark:'#241540', ranged:true },
    revenant:{ hp:230,spd:58, dmg:22,r:24, xp:8, coins:10,col:'#4a1015', dark:'#180406' },
    brute:   { hp:100,spd:64, dmg:17,r:20, xp:3, coins:3, col:'#7a1c22', dark:'#3a0c10' },
    wraith:  { hp:66, spd:128,dmg:15,r:15, xp:4, coins:4, col:'#7b5ea8', dark:'#2e2140' },
    elite:   { hp:580,spd:82, dmg:26,r:26, xp:16,coins:20,col:'#c98bff', dark:'#3a1a52' },
    leech:   { hp:70, spd:55, dmg:8, r:14, xp:5, coins:6, col:'#4a8a5a', dark:'#173a22' },
    bomber:  { hp:30, spd:120,dmg:10,r:11, xp:2, coins:2, col:'#ff8a2c', dark:'#5a2a08' },
    gilded:  { hp:90, spd:170,dmg:0, r:12, xp:6, coins:0, col:'#ffd36b', dark:'#7a5a1c' },
    pitboss: { hp:2600,spd:74,dmg:30,r:34, xp:40,coins:45, col:'#d4212f', dark:'#4a0a10' },
    croupier:{ hp:2100,spd:60,dmg:22,r:30, xp:40,coins:45, col:'#e6d9c2', dark:'#4a3a28' }, // A1: ivory, not gold
    bookie:  { hp:2400,spd:70,dmg:24,r:32, xp:45,coins:50, col:'#3f7a5a', dark:'#0f2a1c' }, // C2: racetrack felt + slate ledger
    twins:   { hp:2000,spd:95,dmg:22,r:30, xp:55,coins:30, col:'#c9962e', dark:'#3a2608' }, // C2: one shared life (bone twin recolors)
    collector:{hp:3200,spd:48,dmg:26,r:36, xp:50,coins:60, col:'#6a4ab5', dark:'#241540' },
    thehouse:{ hp:4400,spd:64,dmg:30,r:38, xp:70,coins:90,col:'#c98bff', dark:'#2a0a34' },
    housegod:{ hp:1000000,spd:1,dmg:1,r:46, xp:0,coins:0, col:'#1a0f1d', dark:'#07030a' }
  }
};
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE_SCALE = Object.assign({}, CFG.scale);

/* ---------- canvas ---------- */
const cv = document.getElementById('c');
const ctx = cv.getContext('2d',{alpha:false}); // opaque canvas — the compositor stops blending the page behind every frame
let VW=0, VH=0, DPR=1, ZOOM=1;
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, window._qPrev===true?1:2);
  // A4: phones pull the camera back — visual scale only (VW/VH are logical px)
  { const sw=window.innerWidth, sh=window.innerHeight, s=Math.min(sw,sh);
    ZOOM = s<540 ? Math.max(0.72, s/540) : 1;
    VW = sw/ZOOM; VH = sh/ZOOM;
    cv.width = Math.round(sw*DPR); cv.height = Math.round(sh*DPR); }
  ctx.setTransform(DPR*ZOOM,0,0,DPR*ZOOM,0,0);
  // opaque canvas boots black — paint the house dark immediately so the menu
  // never sits on a void (render() only runs once a run exists)
  ctx.fillStyle='#0a0507'; ctx.fillRect(0,0,VW,VH);
}
window.addEventListener('resize', ()=>{ resize(); if(embers&&embers.length) resetEmbers(); }); resize();

/* ---------- DOM refs ---------- */
const $ = id => document.getElementById(id);
const elMenu=$('menu'), elHud=$('hud'), elSlot=$('slot'), elGO=$('gameover'), elFlash=$('flash'), elStreak=$('streak');

/* ---------- helpers ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
/* B1 DAILY DEBT — mode-scoped seeded randomness. Normal nights: plain Math.random.
   A daily night: one mulberry32 stream per system (spawn/elite/slot/wheel/tarot/ascent/
   drop/fate/combat), so slot pull #k is the same pull for every player in the world. */
let DLY_RNG=null;
function dlyHash(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h|0; }
function rng(s){ const R=DLY_RNG; if(!R) return Math.random();
  let a=R[s]; if(a===undefined) a=dlyHash(R._seed+'|'+s);
  a=(a+0x6D2B79F5)|0; R[s]=a;
  let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296; }
function rrnd(s,a,b){ return a+rng(s)*(b-a); }
function rpick(s,a){ return a[(rng(s)*a.length)|0]; }
function dlyOn(){ return !!DLY_RNG; } // a Daily Debt night is live (or its corpse is on the ledger)
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function fmt(n){ n=Math.round(n); const m=Math.floor(n/60), s=n%60; return m+':'+(s<10?'0':'')+s; }

/* ---------- game state ---------- */
let state='menu';
let P, enemies, bullets, orbs, coins, parts, texts, audience, ebullets=[];
let gt, spawnT, eliteT, shake, hitstop, camX, camY, killStreak, streakT, excite, fireAcc, pending, gilt=0, best=0;
let rings, sparks, grainC=null, grainReady=false;
let waves=[], guils=[], gpools=[], gstakes=[]; window._waveId=0;
let wave, waveClearTarget, waveGap, sideBoons=[];
let hallPillars=[], embers=[], chandeliers=[], fogPuffs=[], floorCracks=[], glassPools=[], gargoyles=[], soulCandles=[], ravens=[], vaultProp=null, interactable=null, interT=10, ghostPatrons=[], glints=[], ambientT=9;
let curReward=null, slotFloor=null, slotBusy=false, lastRites=false;
let slotReels=[], slotStage='idle', reelsStopped=0, stopLock=0, slotIndex=0, wg=null, slotKind='skill', gamble=null;
let selPos=0, selT=0, selHop=0.085, selStopping=false, selHopsLeft=0, selLandT=0, selWinner=0, selTk=0;
let xpTick=0;
let fever=0, feverOn=false, feverT=0, tarots=[], tarotT=14, decals=[];
let dice=[], diceShown=false, spaceHold=false, holdProg=0, holdFired=false;
let debuffs=[]; let bounty=null, bountyT=34; let bountyStk=0; let goldenT=0; let frameAvg=16, loopPrev=0, qLow=false;
let ovBonusNext=false, slowT=0, prevHp=0, dare=null, dareT=46;
let houseActive=false; // 13:00 — THE HOUSE walks, nothing else does
const STREAK_MS=[10,20,30,40,50,100,150,200,250,300,350,400,450,500];
function tickMapProps(dt){
  // ——— secret watchers ———
  if(P.moving) P._idle=0; else { P._idle+=dt; if(P._idle>=60) secret('statue','STATUE OF THE DAMNED'); }
  const C6=CFG.arena/2;
  if(Math.hypot(P.x-C6,P.y-C6)<44){ P._sigT+=dt; if(P._sigT>=6) secret('heart','HEART OF THE HOUSE'); } else P._sigT=0;
  const cn=[[60,60],[CFG.arena-60,60],[60,CFG.arena-60],[CFG.arena-60,CFG.arena-60]];
  cn.forEach((c7,i7)=>{ if(Math.hypot(P.x-c7[0],P.y-c7[1])<130) P._corners.add(i7); });
  if(P._corners.size>=4) secret('surveyor','SURVEYOR OF HELL');
  if(vaultProp && Math.hypot(P.x-vaultProp.x,P.y-vaultProp.y)<95) secret('knock','KNOCKING ON THE VAULT');
  for(const g8 of ghostPatrons){ if(g8.al>0.3 && Math.hypot(P.x-g8.x,P.y-g8.y)<20){ secret('touched','TOUCHED BY THE PAST'); break; } }
  if(!P._1313 && gt>=793){ P._1313=true; secret('thirteen','THIRTEEN THIRTEEN'); }
  if(ravens.length && ravens.every(rv=>rv.flew)) secret('murder','MURDER DISPERSED');
  P._srg=(P._srg===undefined?9:P._srg)-dt;
  if(P._srg<=0){ P._srg=9; ring(C6,C6,210,'#c81e2c'); ring(C6,C6,130,'#e8b64c'); }
  if(!bounty){ if(!houseActive){ bountyT-=dt;
    if(bountyT<=0){ const cands=enemies.filter(e2=>!e2.boss && e2.type!=='gilded' && Math.hypot(e2.x-P.x,e2.y-P.y)<760);
      if(cands.length){ bounty={e:cands[(rng('drop')*cands.length)|0], t:12};
        announce('☠ BOUNTY MARKED — 15 COINS ☠', true); SFX.casinoDing(); SFX.uiDing(); }
      else bountyT=6; } }
  } else { bounty.t-=dt;
    if(bounty.t<3){ bounty.bp=(bounty.bp||0)-dt; if(bounty.bp<=0){ bounty.bp=0.4; tone(1350,0.05,'square',0.09); } }
    if(bounty.t<=0 || !enemies.includes(bounty.e)){ if(bounty.t<=0) bountyStk=0; bounty=null; bountyT=30+rng('drop')*20; } }
  // spawn one random offering at a time
  if(!interactable){ if(!houseActive){ interT-=dt;
    if(interT<=0){
      const kinds=['fountain','roulette','chest'];
      const kind=kinds[(rng('drop')*kinds.length)|0];
      const a5=rng('drop')*6.283, d5=320+rng('drop')*360;
      interactable={ kind, x:clamp(P.x+Math.cos(a5)*d5,80,CFG.arena-80), y:clamp(P.y+Math.sin(a5)*d5,80,CFG.arena-80),
        life:(kind==='chest'?24:32), res:100, stand:0, spin:0, ph:0, rich:rng('drop') };
      const names={fountain:'🩸 A BLOOD FOUNTAIN RISES', roulette:'🎡 A FLOOR BET OPENS', chest:'✦ THE HOUSE LEAVES A GIFT'};
      showStreak(names[kind]); SFX.tingle(); SFX.casinoDing();
    } }
  } else {
    const it=interactable; it.life-=dt;
    if(it.life<3){ it._bp=(it._bp||0)-dt; if(it._bp<=0){ it._bp=0.5; tone(1500,0.05,'square',0.07); ring(it.x,it.y,58,'#ff9a3c'); } }
    const idist=Math.hypot(P.x-it.x,P.y-it.y);
    if(it.kind==='fountain'){
      // THE HEAL — it never existed (the gilded redraw shipped as dead draw
      // code in this update path and got painted over every frame). Now:
      // stand within 60px, drink 16 blood/s, the reserve drains, dry = gone.
      if(P.drought && idist<60){ if(!it._dry){ it._dry=true; announce('✕ THE DROUGHT — THE FOUNTAIN REFUSES ✕', false); SFX.thud(); } }
      else if(it.res>0 && idist<60 && P.hp<P.maxHp){
        it._on=true;
        const heal=Math.min(16*dt, P.maxHp-P.hp, it.res);
        P.hp+=heal; it.res-=heal;
        if(feverOn) secret('fountgold','BATHED IN FIRE');
        it._tick=(it._tick||0)-dt;
        if(it._tick<=0){ it._tick=0.5; it._tk=(it._tk||0)+1;
          ftext(P.x, P.y-28, '+8 ♥', '#8bff9a');
          tone(700*Math.pow(1.0595,Math.min(12,it._tk)), 0.09, 'sine', 0.11);
          tone(1400*Math.pow(1.0595,Math.min(12,it._tk)), 0.06, 'sine', 0.05);
          tone(2100*Math.pow(1.0595,Math.min(12,it._tk)), 0.22, 'triangle', 0.028); // harp shimmer
          ring(it.x, it.y, 46, '#c81e2c');
        }
        if(it.res<=0){
          announce('🩸 THE FOUNTAIN RUNS DRY 🩸', false); SFX.thud();
          burst(it.x, it.y, 14, '#8b1620'); despawnInter(); return;
        }
      } else { it._on=false; it._tk=0; }
    } else if(it.kind==='roulette'){
      if(idist<52){ it.stand+=dt;
        if(it.stand>=1.6){ rouletteBet(it); despawnInter(); return; } }
      else it.stand=Math.max(0,it.stand-dt*2);
    } else if(it.kind==='chest'){
      if(idist<40 && it._openT===undefined){ it._openT=0.45; SFX.tingle(); SFX.leverWind(); ring(it.x,it.y,50,'#ffd36b'); }
      if(it._openT!==undefined){ it._openT-=dt;
        if(it._openT>0){ /* the lid strains — anticipation is the gift */ }
        else {
        flash(0.22,'#ffd36b'); SFX.reelLock();
        LT.chests=(LT.chests||0)+1; bump('chests',LT.chests);
        P._chestsRun=(P._chestsRun||0)+1; if(P._chestsRun>=3) secret('glutton','GIFT GLUTTON');
        if(rng('drop')<0.15){
          announce('☠ MIMIC! ☠', false); flash(0.5,'#8b1620'); SFX.bossRoar(); shake=Math.min(20,shake+10);
          for(let i2=0;i2<6 && enemies.length<CFG.spawn.max;i2++){ const sa3=rng('drop')*6.283;
            spawnEnemy(i2<2?'stalker':'swarm', clamp(it.x+Math.cos(sa3)*60,20,CFG.arena-20), clamp(it.y+Math.sin(sa3)*60,20,CFG.arena-20)); }
        } else {
          const cg3=9+Math.round((it.rich!==undefined?it.rich:rng('drop'))*7); // the shimmer told the truth
          for(let gi=0;gi<cg3;gi++) coins.push({x:it.x+rrnd('loot',-14,14),y:it.y+rrnd('loot',-14,14),r:6,vx:rrnd('loot',-140,140),vy:rrnd('loot',-140,140)});
          coinRain(16); SFX.cashout(); SFX.dingBells(); announce('✦ TREASURE +'+cg3+' COINS ✦', true); flash(0.4,'#ffd36b'); sparkBurst(22);
        }
        burst(it.x,it.y,14,'#e8b64c'); despawnInter(); return;
        }
      }
    }
    if(it.life<=0){ burst(it.x,it.y,8,'#5a4a3a'); despawnInter(); return; }
  }
  // the egg waits
  if(eggProp && Math.hypot(P.x-eggProp.x,P.y-eggProp.y)<24){
    secret('theegg','THE EGG');
    const mp=grantMiniPower(); P.hp=Math.min(P.maxHp,P.hp+20);
    announce('◌ THE EGG — '+mp.toUpperCase()+' · +20 BLOOD ◌', true);
    SFX.tingle(); goldFlood(eggProp.x,eggProp.y); flash(0.3,'#ffd36b');
    eggProp=null;
  }
  // ghost patrons wander
  for(const g of ghostPatrons){
    const gdx=g.tx-g.x, gdy=g.ty-g.y, gd=Math.hypot(gdx,gdy);
    if(gd<20){ g.tx=Math.random()*CFG.arena; g.ty=Math.random()*CFG.arena; g.st='fade_out'; }
    if(g.st==='fade_out'){ g.al-=dt*0.5; if(g.al<=0){ g.al=0; g.x=Math.random()*CFG.arena; g.y=Math.random()*CFG.arena; g.tx=Math.random()*CFG.arena; g.ty=Math.random()*CFG.arena; g.st='fade_in'; } }
    else { g.al=Math.min(1,g.al+dt*0.35); }
    if(gd>1){ g.x+=gdx/gd*g.sp*dt; g.y+=gdy/gd*g.sp*dt; }
  }
  // floor glints twinkle in and out
  if(Math.random()<dt*1.4 && glints.length<7){ glints.push({x:P.x+rnd(-500,500), y:P.y+rnd(-380,380), t:0, d:1.2+Math.random()}); }
  for(let i=glints.length-1;i>=0;i--){ const gl=glints[i]; gl.t+=dt; if(gl.t>=gl.d) glints.splice(i,1); }
  // ambient hall sounds
  ambientT-=dt;
  if(ambientT<=0){ ambientT=14+Math.random()*14;
    const r6=Math.random();
    if(r6<0.4){ for(let i=0;i<3;i++) setTimeout(()=>tone(900+Math.random()*700,0.05,'square',0.05),i*90); }
    else if(r6<0.7){ const ob=98+Math.random()*30; tone(ob,2.2,'sine',0.05,ob*0.98); tone(ob*1.5,2.0,'sine',0.03); }
    else { noise(0.3,0.05,2200); setTimeout(()=>noise(0.2,0.04,2600),260); }
  }
  // ravens scatter when approached
  for(const rv of ravens){
    if(rv.state==='perch'){
      if(Math.hypot(P.x-rv.x,P.y-rv.y)<85){ rv.state='fly'; rv.t=2.4; rv.flew=true;
        const fa=Math.atan2(rv.y-P.y,rv.x-P.x)+rnd(-0.5,0.5);
        rv.vx=Math.cos(fa)*180; rv.vy=Math.sin(fa)*180-60;
        noise(0.14,0.09,2400); }
    } else {
      rv.x+=rv.vx*dt; rv.y+=rv.vy*dt; rv.t-=dt;
      if(rv.t<=0){ rv.state='perch'; rv.x=rv.hx; rv.y=rv.hy; }
    }
  }
}
function despawnInter(){ if(interactable){ ring(interactable.x,interactable.y,50,'#5a4a3a'); } interactable=null; interT=16+rng('drop')*18; }
function rouletteBet(rp){
  LT.roul=(LT.roul||0)+1; bump('roul',LT.roul);
  P._roulRun=(P._roulRun||0)+1; if(P._roulRun>=3) secret('wheeladdict','WHEEL ADDICT');
  SFX.reelLock(); SFX.diceRattle(); ring(rp.x,rp.y,80,'#e8b64c'); sparkBurst(18); shake=Math.min(14,shake+6);
  const r3=rng('drop');
  if(r3<0.35){ const cg2=10+((rng('drop')*8)|0); P.coins+=cg2; LT.coins+=cg2; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
    coinRain(14); SFX.cashout(); announce('◈ FLOOR BET PAYS +'+cg2+' COINS ◈', true); flash(0.35,'#ffd36b'); ftext(rp.x,rp.y-70,'+'+cg2+' ◈','#ffd36b',true); }
  else if(r3<0.60){ const hl2=Math.round(P.maxHp*0.15); P.hp=Math.min(P.maxHp,P.hp+hl2);
    announce('✚ FLOOR BET: +'+hl2+' BLOOD ✚', true); flash(0.35,'#8bff9a'); SFX.dingBells(); }
  else if(r3<0.80){ P.speed*=1.3; debuffs.push({label:'⚡ SWIFT WAGER +30%', t:8, dur:8, revert:()=>{ P.speed/=1.3; }, dot:0, poison:false});
    announce('⚡ FLOOR BET: +30% SPEED FOR 8s ⚡', true); flash(0.35,'#9adcff'); SFX.tingle(); }
  else { announce('☠ THE HOUSE CHEATS — AMBUSH! ☠', false); flash(0.45,'#8b1620'); SFX.bust();
    for(let i2=0;i2<5 && enemies.length<CFG.spawn.max;i2++){ const sa2=rng('drop')*6.283;
      spawnEnemy('swarm', clamp(rp.x+Math.cos(sa2)*90,20,CFG.arena-20), clamp(rp.y+Math.sin(sa2)*90,20,CFG.arena-20)); } }
}
// Prefer the artifact-env storage API; otherwise shim it over localStorage (same keys) so local play keeps progress
const _storeRaw = (typeof window!=='undefined' && window.storage) ? window.storage : (function(){
  try{ localStorage.setItem('am_probe','1'); localStorage.removeItem('am_probe'); }catch(e){ return null; }
  return {
    get: async(k)=>{ try{ const v=localStorage.getItem(k); return v==null?null:{value:v}; }catch(e){ return null; } },
    set: async(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} },
    delete: async(k)=>{ try{ localStorage.removeItem(k); }catch(e){} }
  };
})();
// THE IRON LEDGER — every clean read mirrors to <key>__bak (additive; primaries never renamed).
// A corrupt primary silently restores from carbon. A full disk warns once, never crashes.
const store = _storeRaw && (function(raw){
  let _quotaWarned=false;
  return {
    get: async function(k,x){
      let r=null; try{ r=await raw.get(k,x); }catch(e){ r=null; }
      if(r&&r.value){
        try{ JSON.parse(r.value); try{ raw.set(k+'__bak', r.value, false); }catch(e){} return r; }
        catch(e){ /* the primary is corrupt — reach for carbon */ }
      }
      try{ const b=await raw.get(k+'__bak',x);
        if(b&&b.value){ try{ JSON.parse(b.value);
          try{ raw.set(k, b.value, false); }catch(e){}
          window._ledgerRestored=true; return b; }catch(e2){} } }catch(e){}
      return (r&&r.value)?null:r;
    },
    set: async function(k,v,x){ try{ await raw.set(k,v,x); }
      catch(e){ if(!_quotaWarned){ _quotaWarned=true; try{ announce('◈ THE LEDGER CANNOT WRITE — STORAGE FULL ◈',false); }catch(e2){} } } },
    delete: function(k){ try{ return raw.delete(k); }catch(e){} }
  };
})(_storeRaw);
// 316: the night NEVER dies to a script error — one toast per 30s, and a burst of
// errors mid-run walks the player safely back to the menu instead of a dead screen
let _errLast=0,_errBurst=0;
function _amPanic(){
  const now=Date.now();
  _errBurst = now-_errLast<5000 ? _errBurst+1 : 1; _errLast=now;
  if(now-(window._errToastT||0)>30000){ window._errToastT=now; try{ announce('◈ THE HOUSE STUMBLED — RECOVERED ◈', false); }catch(e){} }
  if(_errBurst>=4 && typeof state!=='undefined' && state!=='menu' && typeof quitToMenu==='function'){ _errBurst=0; try{ quitToMenu(); }catch(e){} }
}
window.addEventListener('error',()=>{ try{ _amPanic(); }catch(e){} });
window.addEventListener('unhandledrejection',()=>{ try{ _amPanic(); }catch(e){} });
// 320: closing the tab mid-run asks first (only when a real night is at stake)
window.addEventListener('beforeunload',(e)=>{ try{ if(typeof state!=='undefined'&&state!=='menu'&&state!=='dead'&&typeof gt!=='undefined'&&gt>60){ e.preventDefault(); e.returnValue=''; } }catch(x){} });
const owned = new Set();
// per-run fortune ledger — feeds THE LEDGER and the LUCK verdict at death
let RUN={};
let eggProp=null, keyProp=null;
function resetRun(){ RUN={diceTries:0,diceWins:0,diceP:0,pulls:{common:0,uncommon:0,rare:0,epic:0,legendary:0},wheelCs:[],crashPts:[],rollMargin:null,bestPull:null,curses:0};
  // THE EGG — one night in three, something small and golden hides far from the lights
  eggProp = rng('drop')<0.34 ? {x:200+rng('drop')*(CFG.arena-400), y:200+rng('drop')*(CFG.arena-400)} : null;
}
resetRun();

/* ---------- entities ---------- */
function spawnEnemy(type,x,y){
  if(P){ const g9=spawnGuard(x,y); x=g9.x; y=g9.y; }
  const _fspd=(window._fmods&&window._fmods.spd)||1;
  const b=CFG.enemy[type], mins=gt/60, S=CFG.scale;
  idxSee(BOSS_DEFS[type]?'b':'e', type);
  ring(x,y,b.r+26,'#5a1a6a'); for(let sp=0;sp<5;sp++){ const sa=Math.random()*6.283; parts.push({x:x+Math.cos(sa)*b.r,y:y+Math.sin(sa)*b.r,vx:Math.cos(sa)*-40,vy:Math.sin(sa)*-40,life:rnd(.25,.5),col:'#7a3aa8',r:rnd(1.5,3)}); }
  const hpS=1+mins*S.hp, dmgS=(1+mins*S.dmg)*fnBite(), spdS=Math.min(S.spdCap,1+mins*S.spd)*(P.enemySpeedBoost||1);
  enemies.push({type,x,y,r:b.r,hp:b.hp*hpS,maxhp:b.hp*hpS,spd:b.spd*spdS*_fspd,dmg:b.dmg*dmgS,
    xp:b.xp,coins:b.coins,cd:0,flash:0,kx:0,ky:0,ph:rng('spawn')*6.28,col:b.col,dark:b.dark,elite:type==='elite',
    ranged:b.ranged||false, shootCd:rrnd('spawn',0.8,2.6), born:gt, vt:(type==='bomber'?'husk':null)});
  if(type==='elite') hrAffix(enemies[enemies.length-1]); // C2
}
function spawnGuard(x,y){ // nothing materializes on top of the gambler
  const dx=x-P.x, dy=y-P.y, d=Math.hypot(dx,dy);
  if(d>=260) return {x,y};
  if(d<1){ const a=rng('spawn')*6.283; return {x:clamp(P.x+Math.cos(a)*260,20,CFG.arena-20), y:clamp(P.y+Math.sin(a)*260,20,CFG.arena-20)}; }
  const s=260/d; return {x:clamp(P.x+dx*s,20,CFG.arena-20), y:clamp(P.y+dy*s,20,CFG.arena-20)};
}
function startWave(){
  if(wave>0 && P){ showStreak('WAVE '+wave+' THINNED'); noise(0.12,0.07,2400); tone(1046,0.08,'sine',0.05); }
  wave++;
  bump('wave',wave); recCheck('wave',wave,'Wave');
  if(wave>1){ SFX.casinoDing(); ftext(P.x,P.y-40,'WAVE '+wave,'#e8b64c',true); ring(P.x,P.y,64,'#e8b64c'); }
  if(P&&P._endless){ try{ b2WaveStart(); }catch(e){} }
  else if(wave>=10 && wave%10===0) spawnBoss();
  if(wave>0 && wave%7===0){ announce('✦ GOLDEN WAVE — THE GILDED WALK ✦', true); SFX.dingBells();
    for(let gw=0;gw<2;gw++){ const ga2=rng('spawn')*6.283, gd2=Math.max(VW,VH)*0.5;
      spawnEnemy('gilded', clamp(P.x+Math.cos(ga2)*gd2,20,CFG.arena-20), clamp(P.y+Math.sin(ga2)*gd2,20,CFG.arena-20)); } }
  if(wave>=4 && rng('spawn')<0.10){ const ga=rng('spawn')*6.283, gd=Math.max(VW,VH)*0.5;
    spawnEnemy('gilded', clamp(P.x+Math.cos(ga)*gd,20,CFG.arena-20), clamp(P.y+Math.sin(ga)*gd,20,CFG.arena-20));
    showStreak('✦ A GILDED SOUL APPEARS ✦'); SFX.tingle(); }
  // expire curses
  if(P.curses){ for(let i=P.curses.length-1;i>=0;i--){ if(--P.curses[i].waves<=0){ try{P.curses[i].revert();}catch(e){} P.curses.splice(i,1); } } renderRelics(); }
  // difficulty steps up every 5 waves
  if(wave>1 && wave%5===0){ CFG.scale.hp+=0.10; CFG.scale.dmg+=0.03; CFG.scale.spdCap=Math.min(2.3,CFG.scale.spdCap+0.08); showStreak('THE HOUSE GROWS CRUEL'); SFX.murmur(); flash(0.3,'#8b1620'); }
  const W=CFG.wave;
  // every wave rolls a little differently — the dealer shuffles, never repeats
  const size=Math.min(W.cap, Math.round((W.first + (wave-1)*W.grow)*(P&&P.crowd?1.3:1)*rrnd('spawn',0.85,1.2)*fnEase()));
  const eliteWave = wave % ((P&&P._endless)?2:W.eliteEvery) === 0;
  const wflav = (wave>=4 && rng('spawn')<0.15) ? ['husk','wraith','stalker','swarm','brute'][(rng('spawn')*5)|0] : null;
  for(let i=0;i<size && enemies.length<CFG.spawn.max;i++){
    const a=rng('spawn')*6.283, d=Math.max(VW,VH)*0.6+rrnd('spawn',30,220);
    const x=clamp(P.x+Math.cos(a)*d,20,CFG.arena-20), y=clamp(P.y+Math.sin(a)*d,20,CFG.arena-20);
    let t='shambler', roll=rng('spawn');
    if(wave>=2 && roll<0.30) t='husk';
    if(wave>=4 && roll>=0.30 && roll<0.36) t='bomber';
    if(wave>=5 && roll>=0.87 && roll<0.90) t='leech';
    if(wave>=3 && roll>=0.48 && roll<0.51) t='shooter';
    if(wave>=4 && roll>=0.51 && roll<0.70) t='wraith';
    if(wave>=6 && roll>=0.70 && roll<0.845) t='stalker';
    if(wave>=9 && roll>=0.845 && roll<0.87) t='hexer';
    if(window._fmods&&window._fmods.noRanged&&(t==='shooter'||t==='hexer')) t='stalker';
    if(wave>=3 && roll>=0.90 && roll<0.955) t='brute';
    if(wave>=8 && roll>=0.955) t='revenant';
    if(wflav && rng('spawn')<0.22) t=wflav;
    if(P&&P._endless) t=b2CourtType(t);
    spawnEnemy(t,x,y);
  }
  // HORDE: a fast swarm pours in from one flank
  if(wave>=2 && ((P&&P.stampede) || wave%2===0 || rng('spawn')<0.55)){
    const ha=rng('spawn')*6.283, hd=Math.max(VW,VH)*0.62;
    const hx=clamp(P.x+Math.cos(ha)*hd,40,CFG.arena-40), hy=clamp(P.y+Math.sin(ha)*hd,40,CFG.arena-40);
    const hn=Math.round((20+wave*3)*((window._fmods&&window._fmods.horde)||1)*(P&&P.crowd?1.3:1)*rrnd('spawn',0.85,1.2)*fnEase());
    ring(hx,hy,180,'#8b1620'); ring(hx,hy,120,'#c81e2c'); // the ground marks where they pour in
    for(let k=0;k<hn && enemies.length<CFG.spawn.max;k++){ spawnEnemy('swarm', clamp(hx+rrnd('spawn',-170,170),20,CFG.arena-20), clamp(hy+rrnd('spawn',-170,170),20,CFG.arena-20)); }
    setTimeout(()=>{ if(state==='playing'){ showStreak('HORDE INCOMING'); SFX.murmur(); } }, 260);
  }
  if(eliteWave){
    const n=(1+Math.floor(wave/8))*((P&&P.noMercy&&P.b2pairs)?3:((P&&(P.noMercy||P.b2pairs))?2:1)); // B2 OBSIDIAN: elites walk in pairs
    const nE=(P&&P._endless)?b2EliteCap(n):n;
    for(let k=0;k<nE;k++){ const a=rng('elite')*6.283, d=Math.max(VW,VH)*0.6;
      const ex9=clamp(P.x+Math.cos(a)*d,20,CFG.arena-20), ey9=clamp(P.y+Math.sin(a)*d,20,CFG.arena-20);
      spawnEnemy('elite',ex9,ey9); if(P&&P._endless) b2ScaleElite(enemies[enemies.length-1]); ring(ex9,ey9,160,'#c98bff'); ring(ex9,ey9,90,'#e8ccff'); }
    showStreak('WAVE '+wave+' · ELITE'); SFX.murmur(); flash(0.3,'#c98bff');
  } else {
    showStreak('WAVE '+wave);
  }
  waveClearTarget=Math.ceil(size*W.nextAt);
  waveGap=W.gap*rrnd('spawn',0.9,1.15);
}
function enemyShoot(e){
  const sp=200; let tx9=P.x, ty9=P.y;
  if(P.b2lead && P._b2vx!==undefined){ const tt9=Math.min(2.2,Math.hypot(P.x-e.x,P.y-e.y)/sp)*0.9; tx9+=P._b2vx*tt9; ty9+=P._b2vy*tt9; } // B2 CRIMSON: they shoot where you are going
  const base=Math.atan2(ty9-e.y,tx9-e.x);
  const shots = e.type==='hexer'?3:1, spread=0.34;
  for(let i=0;i<shots;i++){
    const ang=base+(shots>1?(i-(shots-1)/2)*spread:0);
    if(ebullets.length<90) ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:8,dmg:e.dmg*1.1,life:4.5});
  }
  burst(e.x,e.y,3,'#ffce5a'); SFX.eshoot();
}
function trackDmg(d){ P.dmgDealt=(P.dmgDealt||0)+d; }
// small purple bosses pay in BLESSINGS — borrowed power, 12-18s on the clock
const BLESSINGS=[
  {l:'⚔ HOUSE FAVOR — +40% DAMAGE', ap:()=>{P.damage*=1.4;},  rv:()=>{P.damage/=1.4;}},
  {l:'⚡ HOT HANDS — +35% FIRE RATE', ap:()=>{P.fireRate*=1.35;}, rv:()=>{P.fireRate/=1.35;}},
  {l:'👢 SWIFT — +30% SPEED', ap:()=>{P.speed*=1.3;},   rv:()=>{P.speed/=1.3;}},
  {l:'◈ GILDED — COINS ×2', ap:()=>{P.coinMult*=2;},  rv:()=>{P.coinMult/=2;}},
  {l:'♥ MENDING — +3 BLOOD/s', ap:()=>{P.regen=(P.regen||0)+3;}, rv:()=>{P.regen-=3;}}
];
function eliteBlessing(){
  const b=BLESSINGS[(rng('drop')*BLESSINGS.length)|0], dur=Math.round(rrnd('drop',12,18));
  b.ap();
  debuffs.push({label:b.l, t:dur, dur, revert:b.rv, dot:0, poison:false, good:true});
  announce('✦ BLESSED — '+b.l+' · '+dur+'s ✦', true);
  SFX.dingBells(); SFX.tingle(); flash(0.3,'#8bff9a'); sparkBurst(18); coinRain(8);
}
/* SCARS — permanent-for-the-run wounds the dice can leave. No mercy, no timer. */
const SCARS=[
 {label:'−8 MAX BLOOD',      g:'♥', ap:()=>{ P.maxHp=Math.max(20,P.maxHp-8); P.hp=Math.min(P.hp,P.maxHp); }},
 {label:'−4 MOVE SPEED',     g:'👢', ap:()=>{ P.speed=Math.max(60,P.speed-4); }},
 {label:'−3% DAMAGE',        g:'⚔', ap:()=>{ P.damage*=0.97; }},
 {label:'−3% FIRE RATE',     g:'⚡', ap:()=>{ P.fireRate*=0.97; }},
 {label:'−6% COINS',         g:'◈', ap:()=>{ P.coinMult=Math.max(0.2,(P.coinMult||1)-0.06); }},
 {label:'−20 PICKUP RANGE',  g:'◎', ap:()=>{ P.pickup=Math.max(30,P.pickup-20); }},
 {label:'−2% XP',            g:'✦', ap:()=>{ P.xpMult=Math.max(0.4,(P.xpMult||1)*0.98); }},
 {label:'+3% DAMAGE TAKEN',  g:'▣', ap:()=>{ P.dmgTakenMult=(P.dmgTakenMult||1)+0.03; }},
 {label:'−0.1s INVULN',      g:'◑', ap:()=>{ P.invBonus=(P.invBonus||0)-0.1; }},
 {label:'CROOKED TABLE — NEXT DICE +1', g:'🎲', ap:()=>{ P.crookedT=true; }}
];
function applyScar(){
  const s=SCARS[(rng('fate')*SCARS.length)|0];
  s.ap(); (P.scars=P.scars||[]).push({l:s.label, g:s.g||'☒'});
  LT.scars=(LT.scars||0)+1; bump('scars',LT.scars);
  setTimeout(()=>announce('☒ SCARRED — '+s.label+', THIS RUN ☒', false), 250);
  SFX.bust(); SFX.thud(); flash(0.5,'#8b1620'); shake=Math.min(20,shake+10);
  try{ renderRelics(); }catch(e){}
  return s.label;
}
function hurtPlayer(dmg){
  if(P.frail) dmg=Math.round(dmg*1.25);
  if(P.dmgTakenMult) dmg=Math.round(dmg*P.dmgTakenMult);
  if(P.armor) dmg=Math.max(1,dmg-P.armor);
  if(P.inv<=0) P.noDmgStreak=0;
  if(P.inv>0) return;
  P._lastHurtGt=gt; if(typeof houseActive!=='undefined' && houseActive) P._houseHurt=true;
  P.hp-=dmg; P.inv=0.5+(P.invBonus||0); shake=Math.min(11,shake+5); flash(0.35,'#8b1620'); SFX.hurt();
  hurtFX&&hurtFX(dmg); // A1 — Vesper flashes white, the edges bleed, blood leaps, a sub-thump lands
  { const hw=$('hpwrap')||$('hpfill'); if(hw){ hw.classList.remove('hurt'); void hw.offsetWidth; hw.classList.add('hurt'); } }
  { let src=null, bd=6400; for(const e2 of enemies){ const d2=(e2.x-P.x)*(e2.x-P.x)+(e2.y-P.y)*(e2.y-P.y); if(d2<bd){ bd=d2; src=e2; } }
    if(src){ window._hitArc={a:Math.atan2(src.y-P.y,src.x-P.x), t:0.42};
      window._hitBy=src.boss?(BOSS_DEFS[src.bossKind]&&BOSS_DEFS[src.bossKind].name):(src.type||'the dark'); } }
  if(P.thorns){ for(const e of enemies){ if(Math.hypot(e.x-P.x,e.y-P.y)<70){ e.hp-=P.thorns; trackDmg(P.thorns); e.flash=0.12; ftext(e.x,e.y,Math.round(P.thorns),'#ff9a9a'); } } ring(P.x,P.y,70,'#ff6b6b'); }
  if(P.hp<=0){
    if(P.mythPhoenix && !P.phUsed){
      P.phUsed=true; P.hp=Math.max(1,Math.round(P.maxHp*0.2)); P.inv=5;
      P.speed+=50; debuffs.push({label:'✵ PHOENIX +50 SPD',t:5,dur:5,revert:()=>{P.speed-=50;},dot:0,poison:false,good:true});
      for(let i2=enemies.length-1;i2>=0;i2--){ const e2=enemies[i2];
        if(Math.hypot(e2.x-P.x,e2.y-P.y)<220){ e2.hp-=100; e2.flash=0.2; if(e2.hp<=0&&!e2.boss) killEnemy(e2,i2); } }
      ring(P.x,P.y,220,'#ff9a3c'); ring(P.x,P.y,140,'#fff2c0'); burst(P.x,P.y,30,'#ff9a3c');
      flash(0.7,'#ff9a3c'); shake=Math.min(26,shake+18); SFX.bossRoar(); SFX.seraph();
      announce('✵ THE PHOENIX MARKER BURNS ✵', true);
      return;
    }
    if(P.revive && !P.revived){ P.revived=true; P.hp=P.maxHp*0.35; P.inv=1.4; flash(0.8,'#eaf3ff'); ring(P.x,P.y,160,'#eaf3ff'); ftext(P.x,P.y-30,'SECOND CHANCE','#eaf3ff',true); SFX.win(); return; }
    P.hp=0; die();
  }
}
function killEnemy(e,idx){
  if(e.hrGuard && hrGuardKill(e,idx)) return; // C2 — the twins share one life
  ring(e.x,e.y,e.r*1.9,'#ffffff'); { const ex=e.x,ey=e.y,er=e.r; setTimeout(()=>{ if(state==='playing') ring(ex,ey,er*2.7,'#e8b64c'); },70); }
  P.kills++;
  if(P.onKillHeal) P.hp=Math.min(P.maxHp,P.hp+P.onKillHeal);
  LT.kills++; bump('ltKills',LT.kills); P.noDmgStreak=(P.noDmgStreak||0)+1; bump('noDmg',P.noDmgStreak);
  goreStamp(e.x+rnd(-4,4), e.y+rnd(-2,6), e.r*(0.8+Math.random()*0.6));
  if(decals.length<(GFX.lite?4:14)) decals.push({x:e.x+rnd(-4,4),y:e.y+rnd(-2,6),r:e.r*(0.7+Math.random()*0.5),a:rnd(0,6.28),t:0,max:1.5}); // the wet glisten, briefly bump('runKills',P.kills); recCheck('kills',P.kills,'Kills');
  LT.killsBy[e.type]=(LT.killsBy[e.type]||0)+1; bump('ek_'+e.type, LT.killsBy[e.type]);
  if(e.type==='bomber'){ ring(e.x,e.y,74,'#ff8a2c'); burst(e.x,e.y,16,'#ff8a2c'); SFX.nova(); shake=Math.min(14,shake+5);
    if(Math.hypot(P.x-e.x,P.y-e.y)<74) hurtPlayer(e.dmg*1.4);
    for(const o of enemies){ if(o!==e && Math.hypot(o.x-e.x,o.y-e.y)<74){ o.hp-=40; o.flash=0.1; } } }
  if(e.type==='gilded'){ LT.gilded++; bump('gilded',LT.gilded);
    if(feverOn) secret('goldongold','GOLD ON GOLD');
    for(let gi=0;gi<(contractDone('dividend')?28:14);gi++) coins.push({x:e.x+rrnd('loot',-12,12),y:e.y+rrnd('loot',-12,12),r:6,vx:rrnd('loot',-130,130),vy:rrnd('loot',-130,130)});
    coinRain(18); bigWin('GOLD RUSH',2); }
  if(bounty && bounty.e===e){ bounty=null; bountyT=30+Math.random()*20;
    bountyStk++; const brew=Math.round((10+5*bountyStk)*(1+(P.bountyPay||0)));
    P.coins+=brew; LT.coins+=brew; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
    LT.bounty=(LT.bounty||0)+1; bump('bounty',LT.bounty);
    burst(e.x,e.y,14,'#ffd36b'); ring(e.x,e.y,70,'#ffd36b'); { const bx=e.x,by=e.y; setTimeout(()=>{ if(state==='playing') ring(bx,by,120,'#fff2c0'); },90); }
    announce('☠ BOUNTY ×'+bountyStk+' — +'+brew+' ◈ ☠', true); SFX.chipStack(); SFX.cashout(); coinRain(Math.min(20,brew)); sparkBurst(14);
    if(bountyStk>=2) SFX.dingBells(); }
  if(e.boss){ LT.bossKills++; bump('bossKills',LT.bossKills);
    if(P.godT>0) secret('godslayer','GODSLAYER');
    LT.bossBy[e.bossKind]=(LT.bossBy[e.bossKind]||0)+1; bump('boss_'+e.bossKind, LT.bossBy[e.bossKind]);
    { let bounty=25; const first=(LT.bossBy[e.bossKind]===1);
      if(first) bounty+=50;
      if(contractDone('collector')) bounty*=2;
      gilt+=bounty; saveGilt();
      ftext(e.x,e.y-30,'+'+bounty+' ◈ GILT','#ffd36b',true);
      if(first) setTimeout(()=>announce('✦ FIRST BLOOD BOUNTY +'+bounty+' ◈ ✦', true), 900); }
    slowT=Math.max(slowT,0.45); flash(0.5,'#ffd36b'); // the fall is savored in slow-motion gold
    bigWin(BOSS_DEFS[e.bossKind].falls||(BOSS_DEFS[e.bossKind].name+' FALLS'),4); coinRain(30); stopDrone();
    pending.push({floor:'epic'}); try{ hrBounty(e); }catch(x){}
    for(let gi=0;gi<16;gi++) coins.push({x:e.x+rrnd('loot',-20,20),y:e.y+rrnd('loot',-20,20),r:6,vx:rrnd('loot',-150,150),vy:rrnd('loot',-150,150)}); }
  orbs.push({x:e.x,y:e.y,xp:e.xp*0.75*(P.xpMult||1),r:5,vx:rrnd('loot',-30,30),vy:rrnd('loot',-30,30)});
  const cn=Math.round(e.coins*P.coinMult);
  for(let i=0;i<cn;i++) coins.push({x:e.x+rrnd('loot',-8,8),y:e.y+rrnd('loot',-8,8),r:6,vx:rrnd('loot',-70,70),vy:rrnd('loot',-70,70)});
  burst(e.x,e.y,e.elite?34:14,e.elite?'#c98bff':'#c81e2c');
  ash(e.x,e.y,e.elite?16:7);
  // blood mist + rising soul wisp
  for(let i=0;i<(e.elite?6:3);i++){ const a=Math.random()*6.28,s=rnd(8,40); parts.push({x:e.x+rnd(-6,6),y:e.y+rnd(-6,6),vx:Math.cos(a)*s,vy:Math.sin(a)*s-14,life:rnd(.5,1.0),col:'rgba(120,16,26,0.55)',r:rnd(5,9),ash:true}); }
  parts.push({x:e.x,y:e.y-4,vx:rnd(-8,8),vy:-rnd(46,70),life:rnd(.7,1.0),col:e.elite?'#d9b8ff':'#9adcff',r:2.4});
  ring(e.x,e.y,e.elite?60:e.r+10,e.elite?'#c98bff':'#7a1c22');
  if(P.explode){ for(const o of enemies){ if(o!==e && Math.hypot(o.x-e.x,o.y-e.y)<80){ o.hp-=P.damage*1.2; o.flash=0.1; } } burst(e.x,e.y,10,'#ff9a5b'); ring(e.x,e.y,80,'#ff9a5b'); }
  if(dare) dare.got++;
  killStreak++; streakT=1.0; if(killStreak>(P.bestStreak||0)) P.bestStreak=killStreak;
  if(killStreak%25===0 && killStreak<=500) SFX.streakStep(killStreak); // the streak climbs a scale too
  if(STREAK_MS.includes(killStreak)){
    const big9=killStreak>=100;
    announce('⚔ '+killStreak+' STREAK ⚔', true);
    if(killStreak===50||killStreak===100){ setTimeout(()=>{ tone(392,0.5,'sine',0.045,240); tone(494,0.4,'sine',0.035,300); },1000); } // the big room echoes it back, softer (B4: sound only — the banner already says it)
    LT.milestone=Math.max(LT.milestone||0,killStreak); bump('milestone',killStreak);
    SFX.casinoDing(); if(big9){ SFX.dingBells(); flash(0.3,'#ffd36b'); sparkBurst(16); hitstop=Math.max(hitstop,0.07); ring(P.x,P.y,150,'#ffd36b'); }
    if(killStreak>=500){ secret('streak500','THE FIVE HUNDRED'); bigWin('500 STREAK',4); coinRain(40); }
  } SFX.kill(killStreak); excite=Math.min(1,excite+(e.elite?0.5:0.05)); bump('streak',killStreak); recCheck('streak',killStreak,'Streak');
  if(!feverOn){ const pf9=fever; fever=Math.min(1, fever+(e.elite?0.09:(e.boss?0.5:0.016))*(1+0.08*vlv('fever')));
    if(pf9<0.9&&fever>=0.9){ SFX.casinoDing(); flash(0.12,'#ffd36b'); }
    // the pit only burns once a minute — granted fevers (tarot, wheel) may still ignite
    if(fever>=1){ if(gt>=(window._feverLock||0)) startFever(); else fever=0.99; } }
  if(killStreak===10||killStreak===25||killStreak===50||killStreak===100||killStreak===200){
    const tier=killStreak>=200?5:killStreak>=100?4:killStreak>=50?3:killStreak>=25?2:1;
    if(!STREAK_MS.includes(killStreak)) showStreak(killStreak+' STREAK'); SFX.cheer(); // B4: one voice per milestone — the ⚔ banner owns 10/50/100/200 SFX.dingHit(tier); if(tier>=3) SFX.dingBells();
    flash(0.2+tier*0.06,'#ffd36b'); shake=Math.min(18,shake+3+tier*2); coinRain(tier*4);
    ring(P.x,P.y,90+tier*30,'#ffd36b');
  }
  killFX&&killFX(e); // A1 — kill burst scales by tier (trash / heavy / elite / boss); elites + bosses hit-stop
  if(e.elite){ shake=Math.min(20,shake+11); flash(0.55,'#c98bff'); SFX.cheer(); ring(e.x,e.y,140,'#c98bff'); ring(e.x,e.y,90,'#e8ccff'); eliteBlessing(); }
  if(e.type==='gilded'){ goldFlood&&goldFlood(e.x,e.y); SFX.cashout(); SFX.dingBells(); }
  if(e.type==='bomber'){ noise(0.3,0.3,700); } else if(e.type==='revenant'){ tone(90,0.5,'sine',0.2,40); }
  enemies.splice(idx,1);
}

/* ---------- audience ---------- */
function drawCourt(creep, eyeRGB, eyeHex){
  const nR=6, tt=performance.now()/1000;
  ctx.save();
  for(let i=0;i<nR;i++){
    const side=i%2? -1:1;
    const gx = side>0 ? VW*(0.06+ (i/nR)*0.05) : VW*(0.94-(i/nR)*0.05);
    const gy = VH*(0.16+ (i*0.145));
    const sway2=Math.sin(tt*0.9+i*1.7)*8, hh=90+((i*29)%40);
    ctx.save(); ctx.translate(gx+sway2, gy);
    ctx.globalAlpha=(0.5+Math.sin(tt*1.3+i)*0.12)*creep;
    window._courtG=window._courtG||{}; let rgd=window._courtG[hh];
    if(!rgd){ rgd=ctx.createLinearGradient(0,-hh,0,hh*0.5); rgd.addColorStop(0,'#10131a'); rgd.addColorStop(1,'rgba(6,8,12,0)'); window._courtG[hh]=rgd; }
    ctx.fillStyle=rgd;
    ctx.beginPath();
    ctx.moveTo(0,-hh);
    ctx.quadraticCurveTo(hh*0.42,-hh*0.45, hh*0.30, hh*0.5);
    ctx.quadraticCurveTo(0, hh*0.3, -hh*0.30, hh*0.5);
    ctx.quadraticCurveTo(-hh*0.42,-hh*0.45, 0,-hh);
    ctx.fill();
    // hood void + burning eyes
    ctx.fillStyle='#04050a'; ctx.beginPath(); ctx.ellipse(0,-hh*0.72,hh*0.15,hh*0.17,0,0,6.28); ctx.fill();
    const bl=(0.55+Math.sin(tt*2.6+i*2.2)*0.35)*creep;
    ctx.fillStyle='rgba('+eyeRGB+','+bl+')';
    ctx.beginPath(); ctx.arc(-hh*0.05,-hh*0.72,2.4,0,6.28); ctx.arc(hh*0.05,-hh*0.72,2.4,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    // bony hand reaching toward the machine
    ctx.strokeStyle='rgba(170,180,190,0.5)'; ctx.lineWidth=2.6; ctx.lineCap='round';
    const rx=-side*(hh*0.42+Math.sin(tt*1.6+i)*7);
    ctx.beginPath(); ctx.moveTo(-side*hh*0.2,-hh*0.3); ctx.quadraticCurveTo(rx*0.6,-hh*0.34, rx,-hh*0.3);
    ctx.stroke();
    for(let f2=0;f2<3;f2++){ ctx.beginPath(); ctx.moveTo(rx,-hh*0.3); ctx.lineTo(rx-side*8, -hh*0.3-5+f2*5); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore(); ctx.globalAlpha=1;
}
function buildAudience(){
  audience=[]; const n=26;
  for(let i=0;i<n;i++){
    const top=i<n/2, idx=top?i:i-n/2, per=n/2;
    audience.push({side:top?'t':'b', t:idx/per, ph:Math.random()*6.28, h:rnd(0.75,1.15)});
  }
}
function drawAudience(){
  const rise = 6 + excite*22;
  for(const a of audience){
    const x = 40 + a.t*(VW-80) + Math.sin(gt*0.6+a.ph)*4;
    const baseY = a.side==='t'? 46 : VH-8;
    const dir = a.side==='t'? 1 : -1;
    const bob = Math.sin(gt*2.2+a.ph)*(2+excite*rise)*dir;
    const y = baseY + bob*dir;
    const hh = 30*a.h;
    ctx.save();
    ctx.globalAlpha=0.5+excite*0.4;
    ctx.beginPath();
    ctx.moveTo(x-7,y);
    ctx.lineTo(x-5,y-hh*dir*0.7);
    ctx.arc(x,y-hh*dir,5,0,6.28);
    ctx.lineTo(x+5,y-hh*dir*0.7);
    ctx.lineTo(x+7,y);
    ctx.closePath();
    ctx.save(); ctx.translate(0,y-hh*dir/2);
    ctx.fillStyle=dir===1?lgrad(hh/2,'rgba(20,6,10,0.9)','rgba(0,0,0,0)'):lgrad(hh/2,'rgba(0,0,0,0)','rgba(20,6,10,0.9)');
    ctx.fill(); ctx.restore();
    // eyes glow when excited
    if(excite>0.4){ ctx.fillStyle='rgba(212,33,47,'+(excite-0.3)+')'; ctx.fillRect(x-2,y-hh*dir-1,1.5,1.5); ctx.fillRect(x+1,y-hh*dir-1,1.5,1.5); }
    ctx.restore();
  }
}

/* ============================================================
   UPDATE
   ============================================================ */
function update(dt){
  gt+=dt;
  let mx=0,my=0;
  if(keys.has('w')||keys.has('z')||keys.has('arrowup'))my-=1;
  if(keys.has('s')||keys.has('arrowdown'))my+=1;
  if(keys.has('a')||keys.has('q')||keys.has('arrowleft'))mx-=1;
  if(keys.has('d')||keys.has('arrowright'))mx+=1;
  // a pad in hand works too: left stick / D-pad move (B3 PAD reads the pad and its buttons, ui.js)
  if(typeof PAD!=='undefined' && PAD.on && mx===0 && my===0){ mx=PAD.mx; my=PAD.my; }
  if(touch.joy && mx===0 && my===0){ mx=touch.jx; my=touch.jy; } // A4: the floating stick
  if(touch.active && mx===0 && my===0){ const dx=touch.wx-P.x, dy=touch.wy-P.y, d=Math.hypot(dx,dy); if(d>6){ mx=dx/d; my=dy/d; } }
  const ml=Math.hypot(mx,my); if(ml>0){ mx/=ml; my/=ml; P.aim=Math.atan2(my,mx); }
  P.x=clamp(P.x+mx*P.speed*(P._hrSlow||1)*dt,14,CFG.arena-14); // C2: ♣ zones slow
  P.y=clamp(P.y+my*P.speed*(P._hrSlow||1)*dt,14,CFG.arena-14);
  P.moving = ml>0;
  if(P.inv>0)P.inv-=dt;
  tickDebuffs(dt); tickSmites(dt); tickFever(dt); tickTarot(dt); tickMapProps(dt); tickWheelTok(dt); tickCrashTok(dt); tickVaultDoor();
  if(parts.length>GFX.pcap) parts.splice(0,parts.length-GFX.pcap);
  if(coins.length>240) coins.splice(0,coins.length-240);
  if(texts.length>140) texts.splice(0,texts.length-140);
  if(rings.length>90) rings.splice(0,rings.length-90);
  if(sparks.length>320) sparks.splice(0,sparks.length-320);
  fnTick(dt); // A3 first night: first blood, first RAGE lesson + forgiveness
  if(DLY_RNG) try{ dlyTick(dt); }catch(e){} // B1: the minute-by-minute track
  if(typeof soulTick==='function') soulTick(dt); // D1: the seat's own rules (martyr/magpie/banker)
  feedTick(dt); // J1: THE FEED (ascent.js)
  if(slowT>0) slowT-=dt;
  if(P.hp<prevHp && P.hp/P.maxHp<0.15 && prevHp/P.maxHp>=0.15){ slowT=0.5+(P.slowEdge||0); SFX.thud(); flash(0.4,'#8b1620'); }
  prevHp=P.hp;
  if(!dare){ if(!houseActive){ dareT-=dt;
    if(dareT<=0){ dare={need:12+Math.floor(wave*0.6), got:0, t:10};
      announce('⚔ HOUSE DARE — '+dare.need+' KILLS IN 10s → +40 ◈ ⚔', true); SFX.casinoDing(); } }
  } else { dare.t-=dt;
    if(dare.got>=dare.need){ P.coins+=40; LT.coins+=40; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
      announce('⚔ DARE MET — +40 COINS ⚔', true); SFX.cashout(); SFX.dingBells(); coinRain(16); sparkBurst(26); flash(0.3,'#8bff9a'); dare=null; dareT=40+rng('drop')*24; }
    else if(dare.t<=0){ announce('… THE HOUSE SCOFFS …', false); SFX.thud(); dare=null; dareT=40+rng('drop')*24; }
  }
  if(typeof droneGain!=='undefined' && droneGain && P.hp/P.maxHp<0.5){ try{ droneGain.gain.value=0.14*(1+(0.5-P.hp/P.maxHp)); }catch(e){} }
  if(P.hp/P.maxHp<0.25){ P._hb=(P._hb||0)-dt; if(P._hb<=0){ P._hb=0.85; tone(56,0.16,'sine',0.22,44); setTimeout(()=>tone(50,0.13,'sine',0.16,40),160);
      flash(0.09,'#6b0f18'); } // the vignette throbs WITH the heartbeat — eyes and ears agree
    if(!P._rites){ P._rites=true; showStreak('☨ THE HOUSE SMELLS BLOOD ☨'); SFX.murmur(); startDrone(); flash(0.4,'#8b1620'); }
  } else if(P._rites && P.hp/P.maxHp>0.30){ P._rites=false; P._hb=0; stopDrone(); showStreak('✦ THE BLOOD RETURNS ✦'); SFX.tingle(); tone(660,0.2,'sine',0.1,880); }
  const _mn=Math.floor(gt/60); if(_mn>(P._lastMin||0)){ P._lastMin=_mn; bump('minutes',_mn); recCheck('minutes',_mn,'Minutes');
    if(_mn%3===0){ P.coinMult+=1;
      debuffs.push({label:'✨ GOLDEN HOUR ×2 COINS', t:20, dur:20, revert:()=>{ P.coinMult-=1; }, dot:0, poison:false, good:true});
      goldenT=20;
      announce('✨ GOLDEN HOUR — DOUBLE COINS 20s ✨', true);
      SFX.dingBells(); SFX.casinoDing(); flash(0.4,'#ffd36b'); coinRain(12); } }
  // the veil: quiet checks for the nearly-found (every ~5s)
  P._nwT=(P._nwT||0)-dt;
  if(P._nwT<=0){ P._nwT=5;
    if(P.coins>=300) secret('richman','THE WEIGHTED POCKET');
    else if(P.coins>=240) nearWhisper('richman');
    if(P.coins>=700&&P.coins<777) nearWhisper('sevens');
    if(killStreak>=420&&killStreak<500) nearWhisper('streak500');
    if(gt>=300 && P._lastHurtGt===undefined) secret('dodger','FIVE UNBLED');
    if(debuffs.filter(b=>!b.good).length>=3) secret('curse3','HEXWEARER');
    try{ whisperSweep(); }catch(e){}
  }
  // 12:00 — one minute before the purge, the clock bleeds
  if(gt>=((typeof b2HouseAt==='function')?b2HouseAt():780)-60 && !P._stirred && !P._endless){ P._stirred=true; announce('☷ THE HOUSE STIRS — ONE MINUTE ☷', false); SFX.murmur(); flash(0.3,'#8b1620');
    const tm9=$('timer'); if(tm9) tm9.classList.add('stirs'); }
  // queued slots never wait for an XP pickup
  if(pending.length && state==='playing' && !houseActive) openNextSlot();
  // level-up anticipation: accelerating ticks in the last 10% of the XP bar
  const _xr = P.xpNext>0 ? P.xp/P.xpNext : 0;
  if(_xr>=0.85 && state==='playing' && !pending.length){ xpTick-=dt; if(xpTick<=0){ SFX.xpCharge(_xr); xpTick=0.16+(1-Math.min(1,_xr))*1.25; } }
  else xpTick=0;
  (P.trail||(P.trail=[])).push({x:P.x,y:P.y}); if(P.trail.length>8)P.trail.shift();
  P.comboMult = 1 + Math.min(1.6, killStreak*0.02);

  camX=clamp(P.x-VW/2,0,CFG.arena-VW); camY=clamp(P.y-VH/2,0,CFG.arena-VH);
  if(CFG.arena<VW)camX=(CFG.arena-VW)/2; if(CFG.arena<VH)camY=(CFG.arena-VH)/2;

  if(P.regen>0) P.hp=Math.min(P.maxHp,P.hp+P.regen*dt);
  if(P.midasStacks>0) P.midasStacks=Math.max(0,P.midasStacks-dt*3);

  const bl=P.wlv.bolt||1;
  const effFire = P.fireRate*(1+0.10*(bl-1))*(P.midas?(1+P.midasStacks*0.035):1)*(P.surgeT>0?1.5:1);
  fireAcc+=dt*effFire;
  while(fireAcc>=1){ fireAcc-=1; fire(); }

  // weapon timers
  const orbitL=P.wlv.orbit||0, scytheL=P.wlv.scythe||0, chandL=P.wlv.chand||0, knivesL=P.wlv.knives||0, auraL=(P.evo&&P.evo.aura)?0:(P.wlv.aura||0); // H3: the Black Death takes the miasma away
  const cardsL=P.wlv.cards||0, novaL=P.wlv.nova||0, seekerL=P.wlv.seeker||0;
  const coilL=P.wlv.coil||0, mortarL=P.wlv.mortar||0, lanternL=P.wlv.lantern||0, fangsL=P.wlv.fangs||0, bellL=P.wlv.bell||0, diceL=P.wlv.dice||0, phantomL=P.wlv.phantom||0, coffinL=P.wlv.coffin||0, mothsL=P.wlv.moths||0;
  const razorL=P.wlv.razor||0, cindersL=P.wlv.cinders||0, pendL=P.wlv.pendulum||0, stakesL=P.wlv.stakes||0, serpL=P.wlv.serpent||0, chalL=P.wlv.chalice||0, gramoL=P.wlv.gramo||0, cylL=P.wlv.cylinder||0, candL=P.wlv.candelabra||0, guilL=P.wlv.guillotine||0;
  if(orbitL){ P.orbitA=(P.orbitA||0)+dt*3; }
  if(scytheL){ P.scytheA=(P.scytheA||0)+dt*4.5; }
  if(chandL){ P.chandT=(P.chandT||0)-dt; if(P.chandT<=0){ P.chandT=Math.max(1.0,2.8-chandL*0.25); chandelierBurst(chandL); } }
  if(knivesL){ P.knivesT=(P.knivesT||0)-dt; if(P.knivesT<=0){ P.knivesT=Math.max(1.2,2.6-knivesL*0.12); fireKnives(4+knivesL); } }
  if(cardsL){ P.cardsT=(P.cardsT||0)-dt; if(P.cardsT<=0){ P.cardsT=Math.max(0.9,2.0-cardsL*0.12); fireCards(3+cardsL); } }
  if(novaL){ P.novaT=(P.novaT||0)-dt; if(P.novaT<=0){ P.novaT=Math.max(1.2,3.2-novaL*0.3); bloodNova(novaL); } }
  if(seekerL){ P.seekerT=(P.seekerT||0)-dt; if(P.seekerT<=0){ P.seekerT=Math.max(1.0,2.4-seekerL*0.16); fireSeekers(1+seekerL); } }
  if(coilL){ P.coilT=(P.coilT||0)-dt; if(P.coilT<=0){ P.coilT=Math.max(0.7,1.6-coilL*0.12); fireCoil(coilL); } }
  if(mortarL){ P.mortarT=(P.mortarT||0)-dt; if(P.mortarT<=0){ P.mortarT=Math.max(1.6,3.4-mortarL*0.22); fireMortar(mortarL); } }
  if(lanternL){ P.lantT=(P.lantT||0)-dt; if(P.lantT<=0){ P.lantT=Math.max(0.8,1.4-lanternL*0.1); fireLantern(lanternL); } }
  if(fangsL){ P.fangT=(P.fangT||0)-dt; if(P.fangT<=0){ P.fangT=Math.max(1.4,2.8-fangsL*0.18); fireFangs(2+fangsL); } }
  if(bellL){ P.bellT=(P.bellT||0)-dt; if(P.bellT<=0){ P.bellT=Math.max(2.2,4.0-bellL*0.35); funeralBell(bellL); } }
  if(diceL){ P.diceT=(P.diceT||0)-dt; if(P.diceT<=0){ P.diceT=Math.max(1.5,3.0-diceL*0.2); fireDie(diceL); } }
  if(phantomL){ P.phanT=(P.phanT||0)-dt; if(P.phanT<=0){ P.phanT=Math.max(1.6,3.2-phantomL*0.22); firePhantom(phantomL); } }
  if(coffinL){ P.coffT=(P.coffT||0)-dt; if(P.coffT<=0){ P.coffT=Math.max(1.0,2.2-coffinL*0.15); fireCoffin(2+coffinL); } }
  if(mothsL){ P.mothT=(P.mothT||0)-dt; if(P.mothT<=0){ P.mothT=Math.max(0.55,1.1-mothsL*0.08); fireMoths(); } }
  if(razorL){ P.razT=(P.razT||0)-dt; if(P.razT<=0){ P.razT=Math.max(1.0,2.0-razorL*0.14); fireRazor(razorL); } }
  if(cindersL){ P.cinT=(P.cinT||0)-dt; if(P.cinT<=0){ P.cinT=Math.max(0.9,1.6-cindersL*0.1); fireCinders(cindersL); } }
  if(pendL){ P.pendA=Math.sin(gt*3.4)*0.95; if(Math.abs(P.pendA)>0.9&&!P._pendTk){ P._pendTk=true; tone(1800,0.03,'square',0.05); } else if(Math.abs(P.pendA)<0.85) P._pendTk=false; }
  if(stakesL){ P.stkT=(P.stkT||0)-dt; if(P.stkT<=0){ P.stkT=Math.max(1.1,2.2-stakesL*0.16); fireStakes(stakesL); } }
  if(serpL){ P.serT=(P.serT||0)-dt; if(P.serT<=0){ P.serT=Math.max(0.9,1.8-serpL*0.13); fireSerpent(serpL); } }
  if(chalL){ P.chalT=(P.chalT||0)-dt; if(P.chalT<=0){ P.chalT=Math.max(2.0,3.4-chalL*0.22); fireChalice(chalL); } }
  if(gramoL){ P.gramT=(P.gramT||0)-dt; if(P.gramT<=0){ P.gramT=Math.max(1.3,2.2-gramoL*0.15); fireGramo(gramoL); } }
  if(cylL){ P.cylT=(P.cylT||0)-dt; if(P.cylT<=0){ P.cylT=Math.max(1.6,2.6-cylL*0.18); fireCylinder(cylL); } }
  if(P._cylN>0){ P._cylGap=(P._cylGap||0)-dt; if(P._cylGap<=0){ P._cylGap=0.07; P._cylN--;
    const t9=nearestFoe(480); if(t9){ const a9=Math.atan2(t9.y-P.y,t9.x-P.x)+rnd(-0.04,0.04);
      const last=P._cylN===0;
      bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a9)*P.projSpeed*1.3,vy:Math.sin(a9)*P.projSpeed*1.3,
        r:last?5:4,dmg:P.damage*(0.55+0.1*(P._cylLvl||1))*(last?P.critMult:1),crit:last,life:0.75,kind:last?'tracer':undefined,spin:0});
      tone(last?1568:520,last?0.14:0.05,last?'sine':'square',last?0.12:0.07); if(last){ sparkBurst(10); } } } }
  if(candL){ P.candT=(P.candT||0)-dt; if(P.candT<=0){ P.candT=Math.max(0.7,1.3-candL*0.09); fireCandles(candL); } }
  if(guilL){ P.guilT=(P.guilT||0)-dt; if(P.guilT<=0){ P.guilT=Math.max(2.6,4.6-guilL*0.35); dropGuillotine(guilL); } }
  if(typeof tickPairings==='function') tickPairings(dt); // C1 — the evolved arsenal
  // ground machinery: waves ring out, stakes bite, pools rot, the blade falls
  for(let i=waves.length-1;i>=0;i--){ const w=waves[i]; w.t-=dt; w.r+=dt*300;
    if(w.t<=0){ waves.splice(i,1); continue; }
    for(const e of enemies){ if(e['_wv'+w.id]) continue;
      const d=Math.hypot(e.x-w.x,e.y-w.y); if(Math.abs(d-w.r)<16){
        let ea=Math.atan2(e.y-w.y,e.x-w.x)-w.a; ea=Math.atan2(Math.sin(ea),Math.cos(ea));
        if(Math.abs(ea)<0.62){ e['_wv'+w.id]=1; const wd=P.damage*(0.8+0.2*w.l); e.hp-=wd; trackDmg(wd); e.flash=0.1;
          const kb=Math.max(1,d); e.kx+=(e.x-w.x)/kb*140; e.ky+=(e.y-w.y)/kb*140; } } } }
  for(let i=gstakes.length-1;i>=0;i--){ const s=gstakes[i]; s.t-=dt; s.tick=(s.tick||0)-dt;
    if(s.t<=0){ gstakes.splice(i,1); continue; }
    if(s.tick<=0){ s.tick=0.3;
      for(const e of enemies){ if(Math.hypot(e.x-s.x,e.y-s.y)<24){ const sd=P.damage*(0.5+0.12*s.l); e.hp-=sd; trackDmg(sd); e.flash=0.08; } } } }
  for(let i=gpools.length-1;i>=0;i--){ const p9=gpools[i]; p9.t-=dt;
    if(p9.t<=0){ gpools.splice(i,1); continue; }
    for(const e of enemies){ if(Math.hypot(e.x-p9.x,e.y-p9.y)<p9.r){ const pd=P.damage*(1.1+0.25*p9.l)*dt; e.hp-=pd; trackDmg(pd); e._slow=0.5; } } }
  for(let i=guils.length-1;i>=0;i--){ const g9=guils[i]; g9.t-=dt;
    if(!g9.fell && g9.t<=0){ g9.fell=true; g9.t=0.28;
      const R=90+g9.l*10, gd=P.damage*(3.0+0.8*g9.l);
      for(let k=enemies.length-1;k>=0;k--){ const e=enemies[k]; if(Math.hypot(e.x-g9.x,e.y-g9.y)<R){ e.hp-=gd; trackDmg(gd); e.flash=0.15; if(e.hp<=0) killEnemy(e,k); } }
      shake=Math.min(24,shake+14); flash(0.35,'#ffd0d0'); ring(g9.x,g9.y,R,'#ff5560'); ring(g9.x,g9.y,R*0.55,'#fff');
      noise(0.4,0.3,300); tone(70,0.5,'sine',0.3,40); SFX.reelLock();
    } else if(g9.fell && g9.t<=0){ guils.splice(i,1); } }

  if(window._fmods&&window._fmods.ballroom&&typeof balUpdate==='function') balUpdate(dt); // D3: THE BALLROOM's waltz, chandeliers, mirrors
  // waves — the House suffers no other guests after 13:00
  if(!houseActive){
    if(enemies.length<=waveClearTarget){ waveGap-=dt;
      if(!window._ewWarn && (wave+1)%CFG.wave.eliteEvery===0 && waveGap<1){ window._ewWarn=true; showStreak('♛ AN ELITE WAVE GATHERS ♛'); SFX.murmur(); setTimeout(()=>window._ewWarn=false,5000); }
      if(waveGap<=0) startWave(); }
    else { waveGap=CFG.wave.gap/Math.pow(fnEase(),2); } // A3: first nights breathe between waves
  }
  // 8:00 — THE FLOOR RISES. The stretch before the House must be earned.
  if(!P._floorRose && gt>=480){
    P._floorRose=true;
    CFG.spawn.minInt=Math.max(0.17, CFG.spawn.minInt*0.85);
    CFG.spawn.baseBatch+=2;
    CFG.scale.hp+=0.06;
    showStreak('☷ THE FLOOR RISES ☷'); SFX.murmur(); flash(0.35,'#8b1620'); shake=Math.min(18,shake+8);
  }
  try{ b2Tick(dt); }catch(e){} // B2 — stakes + the endless floor
  // ☷ THE HOUSE — at 13:00 the pit empties and the landlord walks the floor
  if(!houseActive && gt>=((typeof b2HouseAt==='function')?b2HouseAt():780) && !P._endless){
    houseActive=true;
    enemies.length=0; ebullets.length=0; bounty=null; tarots.length=0;
    wheelTok=null; crashTok=null; eggProp=null;
    if(interactable) despawnInter();
    stopDrone();
    flash(0.6,'#07030a'); shake=Math.min(26,shake+16);
    SFX.houseArrive(); SFX.bossRoar();
    showStreak('☷ EVERYTHING KNEELS ☷');
    setTimeout(()=>{ if(state==='dead'||typeof P==='undefined'||!P) return;
      const a9=rng('spawn')*6.283;
      spawnEnemy('housegod', clamp(P.x+Math.cos(a9)*560,80,CFG.arena-80), clamp(P.y+Math.sin(a9)*560,80,CFG.arena-80));
      const g9=enemies[enemies.length-1];
      if(g9){ g9.boss=true; g9.bossKind='housegod'; g9.hp=g9.maxhp=1000000; g9.dmg=300; g9.spd=385; g9.r=46; g9.unkillable=true; }
      startDrone(); SFX.bossRoar(); shake=Math.min(28,shake+18); flash(0.5,'#8b1620');
      LT.houseMet=(LT.houseMet||0)+1; achSaveSoon();
      houseSpeak(HOUSE_LINES[Math.min(HOUSE_LINES.length-1, (LT.houseMet||1)-1)]);
      if((LT.houseMet||0)===1) setTimeout(()=>coachMark('house','you have met the HOUSE — outrun the reign · the MIDNIGHT contract is watching'),3000);
    }, 1400);
  }
  // 15:00 — FORECLOSURE. Not death; repossession. The final press does not apply.
  if(houseActive && gt>=900 && state==='playing'){
    if(typeof b2NightWon==='function' && b2NightWon()) return; // B2: standing at 15:00 = the night is won
    hitstop=Math.max(hitstop,0.5); // half a second of held breath
    announce('☷ THE HOUSE FORECLOSES ☷', false);
    P.markerUsed=true; P.hp=0; actuallyDie();
    return;
  }

  hrUpdate(dt); // C2 — cards, zones, the board, the wheel, the coin, the dice
  const auraR=auraL?(86+auraL*12):0, orbitR=54+orbitL*4;
  // enemies
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e) continue; // an AI/kill effect earlier this frame can splice more than one body (splits, chain kills) — skip the hole
    const dx=P.x-e.x, dy=P.y-e.y, d=Math.hypot(dx,dy)||1;
    if((e.boss && bossAI(e,dt,dx,dy,d)) || (!e.boss && specialAI(e,dt,dx,dy,d))){}
    else if(e.ranged){
      const range=330;
      if(d>range+40){ e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt; }
      else if(d<range-60){ e.x-=dx/d*e.spd*0.7*dt; e.y-=dy/d*e.spd*0.7*dt; }
      else { e.x+=-dy/d*e.spd*0.5*dt; e.y+=dx/d*e.spd*0.5*dt; } // strafe
      e.shootCd-=dt;
      if(e.shootCd<=0 && d<560){ e.shootCd=1.9+rng('combat')*0.8; enemyShoot(e); }
    } else {
      e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
    }
    if(e._slow){ e._slowT=0.3; e._slow=0; } if(e._slowT>0){ e._slowT-=dt; if(!e._slowed){ e._slowed=true; e._spd0=e.spd; e.spd*=0.55; } } else if(e._slowed){ e._slowed=false; e.spd=e._spd0; }
    if(e.kx||e.ky){ e.x+=e.kx*dt; e.y+=e.ky*dt; e.kx*=0.82; e.ky*=0.82; if(Math.abs(e.kx)<2)e.kx=0; if(Math.abs(e.ky)<2)e.ky=0; }
    if(e.flash>0) e.flash-=dt;
    if(!GFX.lite) for(let j=i-1;j>=Math.max(0,i-6);j--){
      const o=enemies[j], ox=e.x-o.x, oy=e.y-o.y, od=ox*ox+oy*oy, mr=e.r+o.r;
      if(od<mr*mr && od>0.01){ const md=Math.sqrt(od), push=(mr-md)/md*0.5; e.x+=ox*push; e.y+=oy*push; o.x-=ox*push; o.y-=oy*push; }
    }
    e.cd-=dt;
    if(d<e.r+P.radius && e.cd<=0 && e.dmg>0){ hurtPlayer(e.dmg); e.cd=0.6; }
    if(auraL && d<auraR){ const _ad=P.damage*(1.0+0.35*auraL)*dt; e.hp-=_ad; trackDmg(_ad); if(Math.random()<0.05)burst(e.x,e.y,1,'#8bff9a'); }
    if((P.wlv.pendulum||0)>0){ const pl9=P.wlv.pendulum||0; let pa=Math.atan2(e.y-P.y,e.x-P.x)-(P.aim+(P.pendA||0)); pa=Math.atan2(Math.sin(pa),Math.cos(pa));
      if(Math.abs(pa)<0.5 && d<(70+pl9*14)){ const pd9=P.damage*(2.0+0.7*pl9)*dt; e.hp-=pd9; trackDmg(pd9); if(Math.random()<0.2)burst(e.x,e.y,1,'#c9b7ff'); } }
    if(scytheL){ let ea=Math.atan2(e.y-P.y,e.x-P.x)-P.scytheA; ea=Math.atan2(Math.sin(ea),Math.cos(ea)); if(Math.abs(ea)<0.6 && d<(90+scytheL*8)){ { const _sd=P.damage*(2.6+0.9*scytheL)*dt; e.hp-=_sd; trackDmg(_sd); } e.flash=0.08; if(Math.random()<0.25)burst(e.x,e.y,1,'#e8b64c'); } }
    if(orbitL){ for(let k=0;k<orbitL;k++){ const oa=P.orbitA+k*(6.28/orbitL), ox=P.x+Math.cos(oa)*orbitR, oy=P.y+Math.sin(oa)*orbitR; if(Math.hypot(e.x-ox,e.y-oy)<e.r+9){ const _od=P.damage*(1.4+0.4*orbitL)*dt*3; e.hp-=_od; trackDmg(_od); if(Math.random()<0.3)burst(ox,oy,1,'#e8b64c'); } } }
    if(e.unkillable){ e.hp=e.maxhp; e.kx=0; e.ky=0; }
    if(e.hp<=0) killEnemy(e,i);
  }

  // bullets
  const spk=P.wlv.spark||0;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i]; b.px=b.x; b.py=b.y;
    if(b.spin!==undefined) b.spin+=dt*14;
    if(P.homing || b.seek){
      // nearest-enemy search cached per bullet, re-run every 0.2s or when the target dies
      b._tgT=(b._tgT||0)-dt;
      if(b._tgT<=0 || !b._tg || b._tg.hp<=0 || !enemies.includes(b._tg)){
        b._tgT=0.2; let tg=null,td=1e9;
        for(const e of enemies){ const ddx=e.x-b.x,ddy=e.y-b.y,dd=ddx*ddx+ddy*ddy; if(dd<td){td=dd;tg=e;} }
        b._tg=tg;
      }
      const tg=b._tg;
      if(tg){ const desired=Math.atan2(tg.y-b.y,tg.x-b.x); let cur=Math.atan2(b.vy,b.vx); const da=Math.atan2(Math.sin(desired-cur),Math.cos(desired-cur)); const turn=b.seek?6*dt:Math.min(1,P.homing*dt); cur+=da*turn; const sp=Math.hypot(b.vx,b.vy); b.vx=Math.cos(cur)*sp; b.vy=Math.sin(cur)*sp; } }
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    if(b.kind==='razor' && b.life<(b._out||0)){ // the sliver turns for home
      const da=Math.atan2(P.y-b.y,P.x-b.x); let ca=Math.atan2(b.vy,b.vx);
      const dd=Math.atan2(Math.sin(da-ca),Math.cos(da-ca)); ca+=dd*Math.min(1,7*dt);
      const sp=Math.hypot(b.vx,b.vy); b.vx=Math.cos(ca)*sp; b.vy=Math.sin(ca)*sp;
      if(Math.hypot(P.x-b.x,P.y-b.y)<18) b.life=0; }
    if(b.life<=0){
      if(b.kind==='stake'){ gstakes.push({x:b.x,y:b.y,t:2.2,l:b._plant||1,a:Math.atan2(b.vy,b.vx)}); tone(140,0.06,'square',0.08); }
      else if(b.kind==='chalice'){ gpools.push({x:b.x,y:b.y,r:56+(b._pool||1)*9,t:2.2+(b._pool||1)*0.3,l:b._pool||1}); noise(0.12,0.1,900); tone(300,0.12,'sine',0.08,180); }
      bullets.splice(i,1); continue; }
    for(let j=enemies.length-1;j>=0;j--){
      const e=enemies[j], dx=e.x-b.x, dy=e.y-b.y, rr=(e.r+b.r);
      if(dx*dx+dy*dy<rr*rr){
        let dmg=b.dmg;
        if(b.kill && !e.elite && !e.boss){ dmg=e.hp; burst(e.x,e.y,10,'#fff'); ftext(e.x,e.y,'FATAL','#ff5566',true); }
        if(P.godT>0 && !e.boss){ dmg=Math.max(dmg,e.hp+1); burst(b.x,b.y,5,'#8bff9a'); }
        { const hm=b.crit?9:5; spark(b.x-hm,b.y-hm,b.x+hm,b.y+hm,'#fff'); spark(b.x+hm,b.y-hm,b.x-hm,b.y+hm,b.crit?'#ffd36b':'#fff'); }
        if(b.crit) SFX.crit();
        if(b.lucky){ dmg*=2; burst(b.x,b.y,10,'#ffd36b'); ftext(e.x,e.y-10,'LUCKY!','#ffd36b',true); SFX.casinoDing(); }
        e.hp-=dmg; e.flash=0.1; trackDmg(dmg); if(b.crit && e.affix==='marked') e._split=1; // C2
        if(b.crit){ const n9=performance.now(); if(n9-(window._critT||0)>160){ window._critT=n9; tone(2350,0.05,'sine',0.06); tone(3520,0.03,'sine',0.03); } }
        const kd=Math.hypot(b.vx,b.vy)||1; e.kx+=b.vx/kd*120*(P.kb||1); e.ky+=b.vy/kd*120*(P.kb||1);
        if(P.lifesteal>0){ P.hp=Math.min(P.maxHp,P.hp+dmg*P.lifesteal); }
        ftext(e.x,e.y-e.r,Math.round(dmg),b.crit?'#ffd36b':'#f0e6d6',b.crit);
        // directional impact spray + hot flash
        const ia=Math.atan2(b.vy,b.vx);
        for(let s2=0;s2<(b.crit?8:4);s2++){ const sa=ia+Math.PI+rnd(-0.7,0.7), sv=rnd(90,240);
          parts.push({x:b.x,y:b.y,vx:Math.cos(sa)*sv,vy:Math.sin(sa)*sv,life:rnd(.14,.3),col:b.crit?'#ffe9a8':'#ff8a6a',r:rnd(1.2,2.6)}); }
        parts.push({x:b.x,y:b.y,vx:0,vy:0,life:0.1,col:'#ffffff',r:b.crit?6:3.6});
        if(b.crit){ ring(b.x,b.y,26,'#ffd36b'); }
        burst(b.x,b.y,b.crit?7:3,b.crit?'#ffd36b':'#d4212f'); SFX.hit();
        if(b.blast){ const br=b.blast; ring(b.x,b.y,br,'#ff9a3c'); ring(b.x,b.y,br*0.55,'#ffd36b'); shake=Math.min(12,shake+4); SFX.thud();
          for(let q=enemies.length-1;q>=0;q--){ const o=enemies[q]; if(o!==e && Math.hypot(o.x-b.x,o.y-b.y)<br){ o.hp-=b.dmg*0.75; o.flash=0.1; if(o.hp<=0) killEnemy(o,q); } } b.blast=0; }
        if(b.bounce>0){ b.bounce--; const cand=enemies.filter(o=>o!==e&&o.hp>0);
          if(cand.length){ const t2=cand[(rng('combat')*cand.length)|0], sp2=Math.hypot(b.vx,b.vy)||300, a2=Math.atan2(t2.y-b.y,t2.x-b.x);
            b.vx=Math.cos(a2)*sp2; b.vy=Math.sin(a2)*sp2; b.life=Math.max(b.life,0.9); ftext(b.x,b.y,'⚂','#c98bff'); tone(900+Math.random()*300,0.05,'square',0.06); break; } }
        hitstop=Math.max(hitstop,b.crit?0.045:0.015);
        if(spk){ let hits=0, from=e, jumps=spk+1; const used=new Set([j]); while(hits<jumps){ let ni=-1,nd=150*150; for(let k=0;k<enemies.length;k++){ if(used.has(k))continue; const o=enemies[k],od=(o.x-from.x)*(o.x-from.x)+(o.y-from.y)*(o.y-from.y); if(od<nd){nd=od;ni=k;} } if(ni<0)break; const o=enemies[ni]; spark(from.x,from.y,o.x,o.y); o.hp-=dmg*(0.45+0.05*spk); trackDmg(dmg*(0.45+0.05*spk)); o.flash=0.1; used.add(ni); from=o; hits++; } }
        if(e.unkillable) e.hp=e.maxhp;
        if(e.hp<=0){ killEnemy(e,j); }
        if(b.pierce>0){ b.pierce--; } else { bullets.splice(i,1); break; }
      }
    }
  }

  // enemy bullets
  for(let i=ebullets.length-1;i>=0;i--){
    const b=ebullets[i]; b.px=b.x; b.py=b.y; b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    if(b.life<=0 || b.x<-60||b.x>CFG.arena+60||b.y<-60||b.y>CFG.arena+60){ ebullets.splice(i,1); continue; }
    const dx=b.x-P.x, dy=b.y-P.y, rr=b.r+P.radius;
    if(dx*dx+dy*dy<rr*rr){ hurtPlayer(b.dmg); burst(b.x,b.y,7,'#ffb347'); ebullets.splice(i,1); }
  }

  // orbs (xp)
  for(let i=orbs.length-1;i>=0;i--){
    const o=orbs[i], dx=P.x-o.x, dy=P.y-o.y, d=Math.hypot(dx,dy);
    o.vx*=0.9; o.vy*=0.9; o.x+=o.vx*dt; o.y+=o.vy*dt;
    if(d<P.pickup){ const pull = d>44 ? 175 : 340; o.x+=dx/d*pull*dt; o.y+=dy/d*pull*dt; }
    if(d<P.radius+6){ gainXP(o.xp); orbs.splice(i,1); coachMark('orb','SOULS FEED THE RED BAR — fill it and the reels appear'); }
  }
  // coins
  for(let i=coins.length-1;i>=0;i--){
    const c=coins[i], dx=P.x-c.x, dy=P.y-c.y, d=Math.hypot(dx,dy);
    c.vx*=0.9; c.vy*=0.9; c.x+=c.vx*dt; c.y+=c.vy*dt;
    const range=P.lode?9999:P.pickup;
    if(d<range){ const pull=P.lode?520:400; c.x+=dx/d*pull*dt; c.y+=dy/d*pull*dt; }
    if(d<P.radius+7){ if(c.gold&&typeof magpieChip==='function') magpieChip(c); if(P.ovT>0){ coins.splice(i,1); P.ovT=Math.min(100,P.ovT+2.5*(P.ovFeed||1)); tone(600+P.ovT*9,0.06,'sine',0.1); flash(0.06,'#ffd36b'); ftext(P.x,P.y-12,'+FEED','#ffd36b'); burst(P.x,P.y,3,'#ff9a3c'); continue; } const gain=Math.max(1,Math.round(P.comboMult)); P.coins+=gain; LT.coins+=gain; if(P.coins===777) secret('sevens','TRIPLE SEVENS'); bump('runCoins',P.coins); bump('ltCoins',LT.coins); if(P.midas)P.midasStacks=Math.min(25,P.midasStacks+1); coins.splice(i,1);
      { const n8=performance.now(); P._coinCombo=(n8-(P._coinT||0)<800)?(P._coinCombo||0)+1:0; P._coinT=n8;
        SFX.coinStep(P._coinCombo);
        if(P._coinCombo>0 && P._coinCombo%10===0){ SFX.casinoDing(); sparkBurst(8); ftext(P.x,P.y-40,'COIN RUSH ×'+P._coinCombo,'#ffd36b'); }
        const cc9=$('coinCount'); if(cc9){ cc9.classList.remove('pop'); void cc9.offsetWidth; cc9.classList.add('pop'); } }
      burst(P.x,P.y,2,'#e8b64c'); }
  }

  // particles/text/rings/sparks
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.life-=dt; if(p.life<=0){parts.splice(i,1);continue;} p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.94; p.vy*=0.94; }
  for(let i=texts.length-1;i>=0;i--){ const t=texts[i]; t.life-=dt; t.y+=t.vy*dt; t.vy*=0.92; if(t.life<=0)texts.splice(i,1); }
  for(let i=rings.length-1;i>=0;i--){ const r=rings[i]; r.life-=dt; r.r+=(r.maxr-r.r)*dt*8; if(r.life<=0)rings.splice(i,1); }
  for(let i=sparks.length-1;i>=0;i--){ sparks[i].life-=dt; if(sparks[i].life<=0)sparks.splice(i,1); }

  if(streakT>0){ streakT-=dt; if(streakT<=0){ killStreak=0; } }
  excite=Math.max(0,excite-dt*0.35);
  if(shake>0)shake=Math.max(0,shake-dt*(30+shake*5)); // A1: short and sharp, never mushy
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function inView(x,y,pad){ return P && Math.abs(x-P.x)<VW/2+pad && Math.abs(y-P.y)<VH/2+pad; }
function bakeWain(){ // one 256x26 beveled panel strip — repeated along every wall
  const c=document.createElement('canvas'); c.width=256; c.height=26; const g=c.getContext('2d');
  g.fillStyle='#0a0509'; g.fillRect(0,0,256,26);
  g.fillStyle='rgba(30,18,12,0.9)'; g.fillRect(0,3,256,2); // top bevel catch-light
  g.fillStyle='rgba(0,0,0,0.5)'; g.fillRect(0,22,256,4);
  for(let x=0;x<256;x+=64){ g.strokeStyle='rgba(60,40,26,0.8)'; g.lineWidth=1.6; g.strokeRect(x+6,6,52,15);
    g.strokeStyle='rgba(232,182,76,0.14)'; g.lineWidth=1; g.strokeRect(x+9,8,46,11); }
  g.fillStyle='rgba(232,182,76,0.35)'; for(let x=32;x<256;x+=64) g.fillRect(x-1,12,2,2);
  window._wainB=c;
}
function bakeWeave(){ // one 110x140 damask carpet tile — herringbone + medallion
  const c=document.createElement('canvas'); c.width=110; c.height=140; const g=c.getContext('2d');
  g.strokeStyle='rgba(212,160,80,0.055)'; g.lineWidth=1.2;
  for(let y=-10;y<150;y+=10){ g.beginPath(); g.moveTo(10,y); g.lineTo(55,y+8); g.lineTo(100,y); g.stroke(); }
  g.strokeStyle='rgba(120,24,34,0.5)'; g.lineWidth=1; g.strokeRect(14,10,82,120);
  g.fillStyle='rgba(232,182,76,0.16)'; g.font='16px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('\u2756',55,70);
  window._weaveB=c;
}
function drawWallsAndCarpet(){
  const A=CFG.arena, C0=A/2;
  // perimeter wall — dark wainscot band + gold rail
  ctx.fillStyle='#0a0509'; ctx.fillRect(0,0,A,26); ctx.fillRect(0,A-26,A,26); ctx.fillRect(0,0,26,A); ctx.fillRect(A-26,0,26,A);
  { // C5: beveled paneling over the flat band — only the walls the camera can see
    if(!window._wainB) bakeWain();
    const wb=window._wainB, x0=Math.floor(camX/256)*256, x1=camX+VW, y0=Math.floor(camY/256)*256, y1=camY+VH;
    if(camY<40) for(let x=x0;x<x1;x+=256) ctx.drawImage(wb,x,0);
    if(camY+VH>A-40){ ctx.save(); ctx.translate(0,A); ctx.scale(1,-1); for(let x=x0;x<x1;x+=256) ctx.drawImage(wb,x,0); ctx.restore(); }
    if(camX<40){ ctx.save(); ctx.rotate(Math.PI/2); ctx.translate(0,-26); for(let y=y0;y<y1;y+=256) ctx.drawImage(wb,y,0); ctx.restore(); }
    if(camX+VW>A-40){ ctx.save(); ctx.translate(A,0); ctx.rotate(Math.PI/2); for(let y=y0;y<y1;y+=256) ctx.drawImage(wb,y,0); ctx.restore(); }
  }
  ctx.strokeStyle='rgba(232,182,76,0.28)'; ctx.lineWidth=2; ctx.strokeRect(28,28,A-56,A-56);
  ctx.strokeStyle='rgba(90,20,30,0.5)'; ctx.lineWidth=6; ctx.strokeRect(13,13,A-26,A-26);
  // torch sconces along the walls
  for(let i=0;i<10;i++){ const p=60+i*(A-120)/9;
    [[p,20],[p,A-20],[20,p],[A-20,p]].forEach(pt=>{
      if(!inView(pt[0],pt[1],140) || (qLow && (((pt[0]+pt[1])/60|0)%2))) return;
      const fl=0.6+Math.sin(gt*7+pt[0]*0.31+pt[1]*0.17)*0.3;
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=fl*0.9;
      ctx.drawImage(glowSprite('rgba(255,150,50,0.24)','rgba(255,120,30,0)',42), pt[0]-42, pt[1]-42, 84, 84); ctx.restore();
      ctx.fillStyle='rgba(255,190,90,'+fl+')'; ctx.beginPath(); ctx.ellipse(pt[0],pt[1],2.4,4.4+fl*1.6,0,0,6.28); ctx.fill();
      ctx.fillStyle='#3a2a18'; ctx.fillRect(pt[0]-2,pt[1]+4,4,6);
    }); }
  // hanging house banners along the north & south walls
  for(let bi=0;bi<4;bi++){
    const bx2=A*0.2+bi*A*0.2;
    for(const wy2 of [30, A-30]){
      if(!inView(bx2,wy2,180)) continue;
      const swb=Math.sin(gt*1.1+bi*1.7+wy2)*3, dn=wy2<A/2?1:-1;
      { const bk='bnr'+bx2+'|'+wy2+'|'+dn; let bg2=_lgCache[bk];
        if(!bg2){ bg2=ctx.createLinearGradient(bx2,wy2,bx2,wy2+dn*86);
          bg2.addColorStop(0,'#6e0f18'); bg2.addColorStop(1,'#2a050a'); _lgCap(); _lgCache[bk]=bg2; }
        ctx.fillStyle=bg2; }
      ctx.beginPath();
      ctx.moveTo(bx2-20,wy2); ctx.lineTo(bx2+20,wy2);
      ctx.lineTo(bx2+16+swb,wy2+dn*72);
      ctx.lineTo(bx2+swb,wy2+dn*86);
      ctx.lineTo(bx2-16+swb,wy2+dn*72);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(232,182,76,0.5)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(bx2-20,wy2+dn*3); ctx.lineTo(bx2+20,wy2+dn*3); ctx.stroke();
      ctx.fillStyle='rgba(232,182,76,0.55)';
      ctx.font='700 17px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('♦', bx2+swb*0.6, wy2+dn*44);
      ctx.fillStyle='#caa64e';
      ctx.beginPath(); ctx.arc(bx2-20,wy2,2.4,0,6.28); ctx.arc(bx2+20,wy2,2.4,0,6.28); ctx.fill();
      ctx.strokeStyle='rgba(202,166,78,0.5)'; ctx.lineWidth=1; // worn gold fringe on the hem
      for(let f9=0;f9<5;f9++){ const fx9=bx2-14+f9*7+swb*0.8; ctx.beginPath(); ctx.moveTo(fx9,wy2+dn*(74+Math.abs(f9-2)*4)); ctx.lineTo(fx9,wy2+dn*(80+Math.abs(f9-2)*4)); ctx.stroke(); }
    }
  }
  // gilt-framed portraits of the House's founders along east & west walls
  for(let pi2=0;pi2<3;pi2++){
    const py3=A*0.28+pi2*A*0.22;
    for(const wx2 of [30, A-30]){
      if(!inView(wx2,py3,160)) continue;
      const inn=wx2<A/2?1:-1;
      ctx.fillStyle='#171008';
      ctx.fillRect(wx2-2*inn - (inn>0?0:26), py3-34, 26, 68);
      ctx.strokeStyle='rgba(232,182,76,0.6)'; ctx.lineWidth=2.4;
      ctx.strokeRect(wx2-2*inn - (inn>0?0:26), py3-34, 26, 68);
      ctx.strokeStyle='rgba(232,182,76,0.28)'; ctx.lineWidth=1;
      ctx.strokeRect(wx2-2*inn - (inn>0?0:26)+4, py3-30, 18, 60);
      const px3=wx2-2*inn-(inn>0?0:26)+13;
      ctx.fillStyle='rgba(60,55,70,0.55)';
      ctx.beginPath(); ctx.arc(px3,py3-8,6,0,6.28); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px3,py3+12,9,12,0,3.14,6.28); ctx.fill();
      { const fx0=wx2-2*inn-(inn>0?0:26); ctx.strokeStyle='rgba(232,182,76,0.4)'; ctx.lineWidth=1; // gilt corner flourishes
        ctx.beginPath(); ctx.arc(fx0+4,py3-30,3,3.14,4.71); ctx.arc(fx0+22,py3-30,3,4.71,6.28); ctx.arc(fx0+22,py3+30,3,0,1.57); ctx.arc(fx0+4,py3+30,3,1.57,3.14); ctx.stroke(); }
      const wk=Math.sin(gt*0.9+pi2*2.4+wx2)>0.93;
      if(wk){ ctx.fillStyle='rgba(255,80,80,0.75)';
        ctx.beginPath(); ctx.arc(px3-2,py3-9,0.9,0,6.28); ctx.arc(px3+2,py3-9,0.9,0,6.28); ctx.fill(); }
    }
  }
  // grand crimson carpet runner (N-S), parts under the sigil hidden by it
  const cw=110;
  ctx.fillStyle='rgba(58,10,18,0.5)'; ctx.fillRect(C0-cw/2,26,cw,A-52); // A1: deep velvet runner, not a bright stripe
  ctx.fillStyle='rgba(20,4,8,0.55)'; ctx.fillRect(C0-cw/2,26,8,A-52); ctx.fillRect(C0+cw/2-8,26,8,A-52);
  ctx.strokeStyle='rgba(230,217,194,0.09)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(C0-cw/2+12,26); ctx.lineTo(C0-cw/2+12,A-26); ctx.moveTo(C0+cw/2-12,26); ctx.lineTo(C0+cw/2-12,A-26); ctx.stroke();
  { // C5: the runner is WOVEN — herringbone damask tiles down the visible span
    if(!window._weaveB) bakeWeave();
    const wv=window._weaveB, ty0=Math.max(26,Math.floor((camY-140)/140)*140), ty1=Math.min(A-26,camY+VH+140);
    ctx.globalAlpha=0.45; for(let y=ty0;y<ty1;y+=140) ctx.drawImage(wv,C0-55,y); ctx.globalAlpha=1; }
}
function drawLandmarks(){
  // THE VAULT — colossal circular door at the north wall
  if(vaultProp){ ctx.save(); ctx.translate(vaultProp.x,vaultProp.y);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0,52,86,14,0,0,6.28); ctx.fill();
    let vg2=window._vaultG; if(!vg2){ vg2=ctx.createRadialGradient(0,0,10,0,0,80); vg2.addColorStop(0,'#5a4a2c'); vg2.addColorStop(0.7,'#2e2414'); vg2.addColorStop(1,'#171008'); window._vaultG=vg2; }
    ctx.fillStyle=vg2; ctx.beginPath(); ctx.arc(0,0,78,0,6.28); ctx.fill();
    ctx.strokeStyle='#e8b64c'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,78,0,6.28); ctx.stroke();
    ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,58,0,6.28); ctx.stroke();
    for(let k2=0;k2<8;k2++){ const va=k2*0.785+gt*0.05;
      ctx.strokeStyle='rgba(232,182,76,0.6)'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(Math.cos(va)*24,Math.sin(va)*24); ctx.lineTo(Math.cos(va)*54,Math.sin(va)*54); ctx.stroke();
      ctx.fillStyle='#caa64e'; ctx.beginPath(); ctx.arc(Math.cos(va)*68,Math.sin(va)*68,4,0,6.28); ctx.fill(); }
    ctx.strokeStyle='rgba(232,182,76,0.3)'; ctx.lineWidth=1.4; // engraved notch ring between the seals
    for(let n9=0;n9<24;n9++){ const na9=n9*0.2618; ctx.beginPath(); ctx.moveTo(Math.cos(na9)*60,Math.sin(na9)*60); ctx.lineTo(Math.cos(na9)*(n9%3===0?68:64),Math.sin(na9)*(n9%3===0?68:64)); ctx.stroke(); }
    ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.arc(0,0,14,0,6.28); ctx.fill();
    ctx.fillStyle='#171008'; ctx.font='700 13px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('◈',0,1);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const vpu=0.25+Math.sin(gt*2.2)*0.15;
    ctx.strokeStyle='rgba(255,220,130,'+vpu+')'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,78,0,6.28); ctx.stroke(); ctx.restore();
    ctx.strokeStyle='rgba(232,182,76,0.55)'; ctx.lineWidth=1.2; ctx.lineCap='round';
    { const n9=Math.min(32,SEC.size);
      for(let i9=0;i9<n9;i9++){ const col9=i9%16, row9=Math.floor(i9/16);
        const sx9=-60+col9*8, sy9=88+row9*9;
        if(col9%5===4){ ctx.beginPath(); ctx.moveTo(sx9-8.5,sy9+5); ctx.lineTo(sx9+1,sy9-5); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(sx9,sy9-4); ctx.lineTo(sx9,sy9+4); ctx.stroke(); } } }
    ctx.fillStyle='rgba(232,182,76,'+(0.5+Math.sin(gt*2.2)*0.2)+')';
    ctx.font="700 11px 'Cinzel',serif"; ctx.textAlign='center';
    ctx.fillText('◈ THE VAULT ◈', 0, 112);
    if(state==='playing' && Math.hypot(P.x-vaultProp.x,P.y-vaultProp.y)<115){
      ctx.fillStyle='rgba(139,255,154,'+(0.6+Math.sin(gt*6)*0.3)+')';
      ctx.font="700 12px 'Cinzel',serif"; ctx.fillText(window._padUI?window._padA+' — ENTER':window._touchUI?'◈ BET — ENTER':'SPACE — ENTER', 0, 128); }
    ctx.restore(); }
  // ghost patrons — spirits of dead gamblers drifting the hall
  ctx.save();
  for(const g of ghostPatrons){
    if(!GFX.ghosts || g.al<=0.01 || !inView(g.x,g.y,120)) continue;
    const sw3=Math.sin(gt*1.4+g.ph)*3, hov3=Math.sin(gt*2+g.ph)*2;
    ctx.globalAlpha=g.al*0.34;
    let pg2=window._ghostG; if(!pg2){ pg2=ctx.createLinearGradient(0,-26,0,14); pg2.addColorStop(0,'#8a97b5'); pg2.addColorStop(1,'rgba(90,100,130,0)'); window._ghostG=pg2; }
    ctx.save(); ctx.translate(g.x+sw3, g.y+hov3);
    ctx.fillStyle=pg2;
    ctx.beginPath(); ctx.moveTo(0,-26);
    ctx.quadraticCurveTo(11,-10, 8,14); ctx.quadraticCurveTo(0,8,-8,14); ctx.quadraticCurveTo(-11,-10,0,-26); ctx.fill();
    ctx.globalAlpha=g.al*0.6; ctx.fillStyle='#dfe8ff';
    ctx.beginPath(); ctx.arc(-2,-19,1.2,0,6.28); ctx.arc(2,-19,1.2,0,6.28); ctx.fill();
    ctx.restore();
  }
  ctx.restore(); ctx.globalAlpha=1;
  // floor glints — treasure twinkles in the marble
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const gl of glints){ const a4=Math.sin((gl.t/gl.d)*Math.PI);
    ctx.globalAlpha=a4*0.85; ctx.fillStyle='#fff2c0';
    ctx.save(); ctx.translate(gl.x,gl.y); ctx.rotate(gl.t*2);
    ctx.fillRect(-4.5,-0.7,9,1.4); ctx.fillRect(-0.7,-4.5,1.4,9); ctx.restore(); }
  ctx.restore(); ctx.globalAlpha=1;
  // THE ACTIVE OFFERING — one random interactable at a time
  const it=interactable;
  if(it){
    const fade = it.life<3 ? (Math.floor(gt*7)%2?0.45:1) : 1;
    ctx.save(); ctx.globalAlpha=fade;
    if(it.kind==='fountain'){
      it.ph=(it.ph||0)+0.016; const alive=it.res>0;
      ctx.save(); ctx.translate(it.x,it.y);
      // shadow + gilded twin basins (the redraw finally lives where it renders)
      ctx.fillStyle='rgba(0,0,0,0.42)'; ctx.beginPath(); ctx.ellipse(0,10,56,19,0,0,6.28); ctx.fill();
      ctx.fillStyle='#241a26'; ctx.beginPath(); ctx.ellipse(0,2,52,24,0,0,6.28); ctx.fill();
      ctx.strokeStyle='rgba(232,182,76,0.55)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(0,2,52,24,0,0,6.28); ctx.stroke();
      ctx.fillStyle=alive?'#7a1019':'#241014'; ctx.beginPath(); ctx.ellipse(0,0,42,18,0,0,6.28); ctx.fill();
      if(alive && it.res<100){ ctx.strokeStyle='rgba(255,90,104,0.8)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(0,0,60,-1.5708,-1.5708+(it.res/100)*6.283); ctx.stroke(); }
      if(alive){ // the pool shimmers — brighter while someone drinks
        ctx.save(); ctx.globalCompositeOperation='lighter';
        ctx.drawImage(glowSprite('rgba(200,30,44,0.3)','rgba(200,30,44,0)',64),-64,-64,128,128);
        if(it._on) ctx.drawImage(glowSprite('rgba(255,90,104,0.4)','rgba(255,90,104,0)',80),-80,-80,160,160);
        ctx.fillStyle='rgba(255,110,120,'+(0.25+Math.sin(it.ph*(it._on?7:3))*0.12)+')';
        ctx.beginPath(); ctx.ellipse(-8,-3,20,7,0.3,0,6.28); ctx.fill(); ctx.restore(); }
      // pedestal + upper basin
      ctx.fillStyle='#3a2f40'; ctx.fillRect(-5,-32,10,26);
      ctx.strokeStyle='rgba(232,182,76,0.5)'; ctx.lineWidth=1.5; ctx.strokeRect(-5,-32,10,26);
      ctx.fillStyle='#241a26'; ctx.beginPath(); ctx.ellipse(0,-32,20,7,0,0,6.28); ctx.fill();
      ctx.strokeStyle='rgba(232,182,76,0.55)'; ctx.beginPath(); ctx.ellipse(0,-32,20,7,0,0,6.28); ctx.stroke();
      ctx.fillStyle=alive?'#a3121f':'#2a1218'; ctx.beginPath(); ctx.ellipse(0,-33,15,4.5,0,0,6.28); ctx.fill();
      if(alive){ // twin arcs of blood falling from the upper basin
        ctx.strokeStyle='rgba(220,50,64,0.75)'; ctx.lineWidth=2.4;
        for(const sgn of [-1,1]){ ctx.beginPath(); ctx.moveTo(sgn*13,-31);
          ctx.quadraticCurveTo(sgn*26,-18,sgn*18,-2); ctx.stroke(); }
        for(let d2=0;d2<4;d2++){ const f2=((it.ph*1.3+d2*0.25)%1);
          ctx.fillStyle='rgba(255,90,100,'+(0.9-f2*0.6)+')';
          ctx.beginPath(); ctx.arc(13+f2*6, -31+f2*29, 2.1-f2*0.8,0,6.28); ctx.fill();
          ctx.beginPath(); ctx.arc(-13-f2*6, -31+f2*29, 2.1-f2*0.8,0,6.28); ctx.fill(); } }
      // gothic finial
      ctx.fillStyle=alive?'#e04050':'#3a1a20'; ctx.beginPath(); ctx.moveTo(0,-42); ctx.lineTo(5,-33); ctx.lineTo(-5,-33); ctx.closePath(); ctx.fill();
      if(alive){ ctx.save(); ctx.globalCompositeOperation='lighter';
        ctx.drawImage(glowSprite('rgba(255,120,130,0.65)','rgba(255,80,90,0)',10),-10,-52,20,20); ctx.restore(); }
      // reserve gauge, gilt-framed
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(-26,28,52,5);
      ctx.fillStyle='#c81e2c'; ctx.fillRect(-26,28,52*(Math.max(0,it.res)/100),5);
      ctx.strokeStyle='rgba(232,182,76,0.4)'; ctx.lineWidth=1; ctx.strokeRect(-26,28,52,5);
      ctx.restore();
    } else if(it.kind==='roulette'){
      it.spin=(it.spin||0)+0.02+(it.stand>0?0.14:0);
      ctx.save(); ctx.translate(it.x,it.y);
      ctx.fillStyle='#171017'; ctx.beginPath(); ctx.arc(0,0,56,0,6.28); ctx.fill();
      ctx.strokeStyle='#e8b64c'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,56,0,6.28); ctx.stroke();
      for(let k3=0;k3<12;k3++){ const ra2=it.spin+k3*0.5236;
        ctx.fillStyle=k3%2?'#8a1520':'#14090c';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,48,ra2,ra2+0.5236); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.arc(0,0,10,0,6.28); ctx.fill();
      const pu2=0.5+Math.sin(gt*4)*0.3;
      ctx.strokeStyle='rgba(232,182,76,'+pu2+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,62+Math.sin(gt*4)*4,0,6.28); ctx.stroke();
      if(it.stand>0){ ctx.strokeStyle='#ffd36b'; ctx.lineWidth=6; ctx.shadowColor='#ffd36b'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(0,0,66,-1.57,-1.57+it.stand/1.6*6.283); ctx.stroke(); ctx.shadowBlur=0; }
      if(Math.hypot(P.x-it.x,P.y-it.y)<260){
        ctx.fillStyle='rgba(255,211,107,'+(0.65+Math.sin(gt*3)*0.2)+')';
        ctx.font="700 12px 'Cinzel',serif"; ctx.textAlign='center';
        ctx.fillText("THE HOUSE'S TABLE", 0, -84+Math.sin(gt*2.2)*3);
        ctx.font="700 10px 'Cinzel',serif"; ctx.fillStyle='rgba(236,220,180,0.8)';
        ctx.fillText('STAND TO BET', 0, -70+Math.sin(gt*2.2)*3); }
      ctx.restore();
    } else if(it.kind==='chest'){
      const hb2=Math.sin(gt*3.4)*2;
      ctx.save(); ctx.translate(it.x,it.y+hb2*0.4);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      let cg2=window._chestG; if(!cg2){ cg2=ctx.createRadialGradient(0,0,0,0,0,52); cg2.addColorStop(0,'rgba(255,210,90,0.30)'); cg2.addColorStop(1,'rgba(255,190,60,0)'); window._chestG=cg2; }
      ctx.fillStyle=cg2; ctx.beginPath(); ctx.arc(0,0,52,0,6.28); ctx.fill(); ctx.restore();
      ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0,15,26,8,0,0,6.28); ctx.fill();
      ctx.fillStyle='#3a2415'; ctx.fillRect(-22,-6,44,20);
      let lidG=window._chestLidG; if(!lidG){ lidG=ctx.createLinearGradient(0,-18,0,-4); lidG.addColorStop(0,'#5a3a1c'); lidG.addColorStop(1,'#3a2415'); window._chestLidG=lidG; }
      ctx.fillStyle=lidG; ctx.beginPath(); ctx.moveTo(-22,-4); ctx.quadraticCurveTo(0,-22-hb2,22,-4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#e8b64c'; ctx.lineWidth=2; ctx.strokeRect(-22,-6,44,20);
      ctx.beginPath(); ctx.moveTo(-22,-4); ctx.quadraticCurveTo(0,-22-hb2,22,-4); ctx.stroke();
      ctx.fillStyle='#ffd36b'; ctx.fillRect(-3.4,-2,6.8,9);
      ctx.fillStyle='#171008'; ctx.beginPath(); ctx.arc(0,1.6,1.6,0,6.28); ctx.fill();
      { const rich9=(it.rich!==undefined?it.rich:0.5);
        for(let sp2=0;sp2<2+Math.round(rich9*3);sp2++){ const spx=rnd(-18,18), spy=rnd(-16,6);
          if(Math.random()<0.18+rich9*0.4){ ctx.fillStyle='rgba(255,240,190,0.9)'; ctx.fillRect(spx-2.4,spy-0.5,4.8,1); ctx.fillRect(spx-0.5,spy-2.4,1,4.8); } } }
      ctx.restore();
    }
    ctx.restore();
    // ===== THE DOPAMINE ARROW — every guide wears its target's color =====
    const ad=Math.hypot(it.x-P.x,it.y-P.y);
    if(ad>150){
      drawGuide(it.x, it.y, it.kind==='fountain'?'#ff5560':'#ffd36b');
    }
  }
}
function gainXP(n){
  n=Math.round(n*(P.xpMult||1));
  if(P.ovT>0 && !P._ovPass && n>0){
    P.ovT=Math.min(100, P.ovT+n*0.8*(P.ovFeed||1));
    tone(700+P.ovT*8,0.05,'sine',0.07);
    return;
  }
  if(P.debt>0 && n>0){
    const pay=Math.min(P.debt, Math.ceil(n*0.5)); P.debt-=pay; n-=pay;
    if(P.debt<=0){ P.debt=0; announce('◈ DEBT CLEARED — THE HOUSE IS PAID ◈', true); SFX.chipStack(); SFX.casinoDing(); flash(0.25,'#8bff9a'); }
  }
  P.xp+=n;
  // NUMBER GO UP, SOUND GO UP — every gem within 1.5s of the last rings one
  // semitone higher (cap +14). Silence resets the scale. The VS loop, distilled.
  { const nw=performance.now();
    P._xpCombo = (nw-(P._xpComboT||0)<1500) ? Math.min(14,(P._xpCombo||0)+1) : 0;
    P._xpComboT=nw;
    SFX.xpStep(P._xpCombo);
    if(P._xpCombo===14 && !P._xpPeak){ P._xpPeak=true; SFX.tingle(); setTimeout(()=>P._xpPeak=false,3000); } }
  while(P.xp>=P.xpNext){ if(!P._ovPass && state==='playing' && P.hp>=P.maxHp*0.2){ startOvercharge(); break; } P._ovPass=false;
    P.xp-=P.xpNext; P.level++; P.xpNext=Math.floor(20+P.level*7+P.level*P.level*1.3); /* G5: late levels eased 1.5->1.3 - probes showed 3.5-min droughts past level 7 */ pending.push({}); bump('level',P.level); recCheck('level',P.level,'Level'); { const lv9=$('level'); if(lv9){ lv9.classList.remove('pop'); void lv9.offsetWidth; lv9.classList.add('pop'); } } ring(P.x,P.y,120,'#c81e2c'); ring(P.x,P.y,70,'#ffd36b'); burst(P.x,P.y,16,'#e8b64c'); for(let i=0;i<16;i++){ parts.push({x:P.x+rnd(-10,10),y:P.y+rnd(-4,4),vx:rnd(-14,14),vy:-rnd(90,220),life:rnd(.4,.8),col:i%3?'#ffd36b':'#fff2c0',r:rnd(1.6,3.2)}); } flash(0.25,'#c81e2c'); }
  if(P.level>=2 && P._fn && !P._fnL) fnFirstLevel(); // A3 first night
  if(pending.length && state==='playing') openNextSlot();
}

/* ============================================================
   RENDER
   ============================================================ */
function buildHall(){
  glassPools=[]; gargoyles=[];
  const C0=CFG.arena/2;
  const gcols=[[201,80,90],[90,140,220],[220,180,90],[150,90,200],[90,190,130]];
  for(let i=0;i<7;i++){ const ga=i/7*6.283+0.4, gd=C0*0.55+((i%2)?150:-90);
    glassPools.push({x:C0+Math.cos(ga)*gd, y:C0+Math.sin(ga)*gd, r:120+((i*37)%80), c:gcols[i%gcols.length], ph:i*1.3}); }
  for(let i=0;i<6;i++){ const ga=i/6*6.283+0.15; gargoyles.push({x:C0+Math.cos(ga)*C0*0.82, y:C0+Math.sin(ga)*C0*0.82, a:ga}); }
  soulCandles=[];
  for(let i=0;i<16;i++){ soulCandles.push({x:Math.random()*CFG.arena, y:Math.random()*CFG.arena, ph:Math.random()*6.28, sp:0.3+Math.random()*0.5}); }
  // landmarks
  interactable=null; interT=10; glints=[]; ambientT=9;
  vaultProp={x:C0, y:70};
  ghostPatrons=[];
  for(let i=0;i<7;i++){ ghostPatrons.push({x:Math.random()*CFG.arena, y:Math.random()*CFG.arena, tx:0,ty:0, sp:14+Math.random()*16, ph:Math.random()*6.28, al:0, st:'fade_in'}); }
  ghostPatrons.forEach(g=>{ g.tx=Math.random()*CFG.arena; g.ty=Math.random()*CFG.arena; });
  ravens=[];
  for(let i=0;i<5;i++){ const ra=Math.random()*6.283, rd=C0*(0.3+Math.random()*0.5);
    ravens.push({hx:C0+Math.cos(ra)*rd, hy:C0+Math.sin(ra)*rd, x:0,y:0, state:'perch', vx:0,vy:0, t:0, ph:Math.random()*6.28}); }
  ravens.forEach(r=>{ r.x=r.hx; r.y=r.hy; });
  hallPillars=[];
  const step=560, jit=90, C=CFG.arena/2;
  for(let gx=step; gx<CFG.arena; gx+=step){
    for(let gy=step; gy<CFG.arena; gy+=step){
      const dx=gx-C, dy=gy-C;
      if(Math.hypot(dx,dy)<500) continue; // keep the great sigil clear
      hallPillars.push({ x:gx+rnd(-jit,jit), y:gy+rnd(-jit,jit), r:rnd(30,46) });
    }
  }
  // overhead chandeliers — one over the sigil, a ring around it, plus a few outliers
  chandeliers=[{x:C,y:C,r:130}];
  const cr=CFG.arena*0.30;
  for(let i=0;i<6;i++){ const a=i/6*6.283+0.5; chandeliers.push({x:C+Math.cos(a)*cr,y:C+Math.sin(a)*cr,r:78}); }
  const cr2=CFG.arena*0.42;
  for(let i=0;i<6;i++){ const a=i/6*6.283; chandeliers.push({x:C+Math.cos(a)*cr2,y:C+Math.sin(a)*cr2,r:66}); }
  // hellish cracks radiating from the sigil
  floorCracks=[];
  for(let i=0;i<12;i++){ const a=i/12*6.283+rnd(-0.12,0.12); const pts=[]; let x=C,y=C,ca=a,r0=180; x+=Math.cos(a)*r0; y+=Math.sin(a)*r0; for(let s=0;s<11;s++){ const seg=110+Math.random()*90; ca+=rnd(-0.28,0.28); x+=Math.cos(ca)*seg; y+=Math.sin(ca)*seg; pts.push({x,y}); } floorCracks.push({a,pts}); }
  resetEmbers();
}
function resetEmbers(){
  embers=[];
  for(let i=0;i<70;i++) embers.push({ x:Math.random()*VW, y:Math.random()*VH, vy:-(8+Math.random()*24), sway:Math.random()*6.28, r:rnd(0.6,2.6), a:rnd(0.08,0.44) });
  fogPuffs=[];
  for(let i=0;i<8;i++) fogPuffs.push({ x:Math.random()*VW, y:Math.random()*VH, r:rnd(190,360), vx:rnd(-7,7), vy:rnd(-4,4), a:rnd(0.03,0.07), warm:Math.random()<0.5 });
}
// C5 — the sigil is BAKED: four half-res sprites (static, spokes, petals, runes) replace
// ~110 live strokes; layers rotate as whole images; a view-cull skips it entirely when
// the arena's heart is off-screen (which is most of the night).
function bakeSigil(){
  const mk=()=>{ const c=document.createElement('canvas'); c.width=c.height=728; const g=c.getContext('2d'); g.translate(364,364); g.scale(0.5,0.5); return [c,g]; };
  const bk={};
  { const [c,g]=mk(); bk.stat=c;
    const gg=g.createRadialGradient(0,0,0,0,0,720); gg.addColorStop(0,'rgba(60,24,12,0.10)'); gg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gg; g.beginPath(); g.arc(0,0,720,0,6.283); g.fill();
    g.strokeStyle='rgba(232,182,76,0.09)';
    [700,560,420,300,180].forEach((rr,i)=>{ g.lineWidth=((i===0||i===2)?2.6:1.2)*2; g.beginPath(); g.arc(0,0,rr,0,6.283); g.stroke(); });
    g.strokeStyle='rgba(232,182,76,0.18)'; g.lineWidth=4; g.beginPath();
    for(let i=0;i<16;i++){ const a=i/16*6.283-Math.PI/2; const rr=(i%2)?84:196; const x=Math.cos(a)*rr,y=Math.sin(a)*rr; if(i===0)g.moveTo(x,y); else g.lineTo(x,y); }
    g.closePath(); g.stroke(); }
  { const [c,g]=mk(); bk.spokes=c;
    g.strokeStyle='rgba(232,182,76,0.08)'; g.lineWidth=2;
    for(let i=0;i<36;i++){ const a=i/36*6.283; g.beginPath(); g.moveTo(Math.cos(a)*300,Math.sin(a)*300); g.lineTo(Math.cos(a)*560,Math.sin(a)*560); g.stroke(); }
    for(let i=0;i<48;i++){ const a=i/48*6.283, r2=(i%4===0)?604:582; g.beginPath(); g.moveTo(Math.cos(a)*560,Math.sin(a)*560); g.lineTo(Math.cos(a)*r2,Math.sin(a)*r2); g.stroke(); } }
  { const [c,g]=mk(); bk.petals=c;
    g.strokeStyle='rgba(232,182,76,0.13)'; g.lineWidth=4;
    for(let i=0;i<12;i++){ const a=i/12*6.283; g.beginPath(); g.ellipse(Math.cos(a)*205,Math.sin(a)*205,118,44,a,0,6.283); g.stroke(); } }
  { const [c,g]=mk(); bk.runes=c; // the House's suits stand watch around the seal
    g.fillStyle='rgba(232,182,76,0.14)'; g.font='700 52px serif'; g.textAlign='center'; g.textBaseline='middle';
    const RG=['♠','♥','♦','♣','☠','◈','†','♛','⚜','◆','✦','♞'];
    for(let i=0;i<12;i++){ const a=i/12*6.283-Math.PI/2; g.save(); g.translate(Math.cos(a)*640,Math.sin(a)*640); g.rotate(a+Math.PI/2); g.fillText(RG[i],0,0); g.restore(); } }
  window._sigilBk=bk;
}
// J0 — the sigil is COMPOSED: the four layers (static + three slow turns) are flattened
// into ONE 728² half-res canvas — only the part the camera can see, re-composed when the
// fastest ring has turned ~1px or the camera leaves the composed patch — then the visible
// part is blitted once, smoothly upscaled. Was four rotated 1456² blits every frame.
// On the low tier the turning freezes (its own clock stops; no jump when it resumes).
let _sigC=null, _sigT=0, _sigGt=null, _sigAt=-1e9, _sigR=null;
function sigilCompose(bk,r){
  if(!_sigC){ _sigC=document.createElement('canvas'); _sigC.width=_sigC.height=728; }
  const g=_sigC.getContext('2d');
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,728,728);
  g.save(); g.beginPath(); g.rect((r[0]+728)/2,(r[1]+728)/2,(r[2]-r[0])/2,(r[3]-r[1])/2); g.clip();
  g.translate(364,364);
  g.drawImage(bk.stat,-364,-364,728,728);
  g.save(); g.rotate(_sigT*0.03); g.drawImage(bk.spokes,-364,-364,728,728); g.restore();
  g.save(); g.rotate(-_sigT*0.05); g.drawImage(bk.petals,-364,-364,728,728); g.restore();
  g.save(); g.globalCompositeOperation='screen'; g.rotate(_sigT*0.015); g.drawImage(bk.runes,-364,-364,728,728); g.restore();
  g.restore(); _sigR=r; _sigAt=_sigT;
}
function drawSigil(cx,cy){
  if(!inView(cx,cy,780)) return; // the heart of the arena sleeps off-screen
  if(!window._sigilBk) bakeSigil();
  const bk=window._sigilBk;
  // the sigil's own clock: follows gt, stands still on the low tier
  if(_sigGt===null || gt<_sigGt){ _sigGt=gt; _sigT=gt; } if(!qLow) _sigT+=gt-_sigGt; _sigGt=gt;
  // visible window in sigil-local px (8px slack covers the shake offset)
  const vx0=Math.max(-728,camX-8-cx), vy0=Math.max(-728,camY-8-cy), vx1=Math.min(728,camX+VW+8-cx), vy1=Math.min(728,camY+VH+8-cy);
  ctx.save(); ctx.translate(cx,cy);
  if(vx1>vx0 && vy1>vy0){
    const R=_sigR;
    if(!R || vx0<R[0] || vy0<R[1] || vx1>R[2] || vy1>R[3] || Math.abs(_sigT-_sigAt)>0.05)
      sigilCompose(bk,[Math.max(-728,vx0-64),Math.max(-728,vy0-64),Math.min(728,vx1+64),Math.min(728,vy1+64)]);
    ctx.globalAlpha=0.5; // A1 GILT NOIR — the seal is engraved into the dark, not painted in gold over it
    ctx.drawImage(_sigC,(vx0+728)/2,(vy0+728)/2,(vx1-vx0)/2,(vy1-vy0)/2, vx0,vy0,vx1-vx0,vy1-vy0);
    ctx.globalAlpha=1;
  }
  // slow blood ring — one live stroke keeps the pulse organic
  ctx.save(); ctx.rotate(gt*0.02); ctx.strokeStyle='rgba(200,30,44,0.12)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,648,0,6.283); ctx.stroke(); ctx.restore();
  // pulsing center glow — deepens with the night's danger
  ctx.save(); ctx.globalCompositeOperation='screen';
  const pv=(0.13+Math.sin(gt*2)*0.035)*(1+Math.min(0.5,gt/900));
  if(!window._sigilG2){ const cg=ctx.createRadialGradient(0,0,0,0,0,130); cg.addColorStop(0,'rgba(232,150,60,0.165)'); cg.addColorStop(1,'rgba(232,150,60,0)'); window._sigilG2=cg; }
  ctx.globalAlpha=Math.min(1.6,pv/0.165); ctx.fillStyle=window._sigilG2; ctx.beginPath(); ctx.arc(0,0,130,0,6.283); ctx.fill(); ctx.restore();
  ctx.restore();
}
function drawPillar(px,py,r){
  // warm light pool
  ctx.save(); ctx.globalCompositeOperation='screen';
  { const pr=r*5; ctx.globalAlpha=0.13;
    ctx.drawImage(glowSprite('rgba(232,150,60,1)','rgba(232,150,60,0)',pr), px-pr, py-pr, pr*2, pr*2); ctx.globalAlpha=1; } ctx.restore();
  // square plinth + shadow
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(px+6,py+11,r*1.25,r*1.15,0,0,6.283); ctx.fill();
  ctx.fillStyle='#0a0608'; ctx.fillRect(px-r*1.16,py-r*1.16,r*2.32,r*2.32);
  ctx.fillStyle='#181113'; ctx.fillRect(px-r*1.04,py-r*1.04,r*2.08,r*2.08);
  ctx.strokeStyle='rgba(232,182,76,0.12)'; ctx.lineWidth=1; ctx.strokeRect(px-r*1.04,py-r*1.04,r*2.08,r*2.08);
  // fluted column body (lit upper-left) — gradient cached per radius, drawn in local space
  { window._pilG=window._pilG||{}; let g=window._pilG[r|0];
    if(!g){ g=ctx.createRadialGradient(-r*0.42,-r*0.42,r*0.1,0,0,r);
      g.addColorStop(0,'#3c2e35'); g.addColorStop(0.55,'#1b1117'); g.addColorStop(1,'#070406'); window._pilG[r|0]=g; }
    ctx.save(); ctx.translate(px,py); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,r,0,6.283); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle='rgba(0,0,0,0.42)'; ctx.lineWidth=1.5;
  for(let i=0;i<8;i++){ const a=i/8*6.283; ctx.beginPath(); ctx.moveTo(px+Math.cos(a)*r*0.34,py+Math.sin(a)*r*0.34); ctx.lineTo(px+Math.cos(a)*r*0.92,py+Math.sin(a)*r*0.92); ctx.stroke(); }
  // gold collars
  ctx.strokeStyle='rgba(232,182,76,0.42)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(px,py,r*0.86,0,6.283); ctx.stroke();
  ctx.strokeStyle='rgba(232,182,76,0.16)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(px,py,r*0.58,0,6.283); ctx.stroke();
  // brazier bowl + flame
  const fl=0.72+Math.sin(gt*8+px*0.5)*0.28;
  ctx.fillStyle='#2a1a10'; ctx.beginPath(); ctx.arc(px,py,r*0.3,0,6.283); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation='screen';
  { const fr=r*0.55, fw=fr*fl; ctx.globalAlpha=Math.min(1,fl);
    ctx.drawImage(glowSprite('rgba(255,200,90,0.85)','rgba(255,80,20,0)',fr|0), px-fw, py-fw, fw*2, fw*2); ctx.globalAlpha=1; }
  ctx.restore();
  ctx.fillStyle='rgba(255,242,190,'+fl+')'; ctx.beginPath(); ctx.arc(px,py,r*0.12*fl,0,6.283); ctx.fill();
}
function drawChandelier(cx,cy,r){
  // overhead light glow (cached sprite)
  ctx.save(); ctx.globalCompositeOperation='screen';
  { const gr=(r*2.5)|0; ctx.drawImage(glowSprite('rgba(232,170,70,0.15)','rgba(200,120,50,0)',gr), cx-gr, cy-gr, gr*2, gr*2); }
  ctx.restore();
  // iron rings
  ctx.strokeStyle='rgba(30,22,16,0.85)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r,0,6.283); ctx.stroke();
  ctx.strokeStyle='rgba(90,68,40,0.55)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,r*0.58,0,6.283); ctx.stroke();
  ctx.strokeStyle='rgba(30,22,16,0.6)'; ctx.lineWidth=1.5;
  for(let i=0;i<4;i++){ const a=i/4*6.283+0.7; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*0.58,cy+Math.sin(a)*r*0.58); ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); ctx.stroke(); }
  // candle flames around ring
  const n=8; for(let i=0;i<n;i++){ const a=i/n*6.283+gt*0.08; const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r; const fl=0.65+Math.sin(gt*9+i*1.7)*0.35;
    { const hr=9*fl; ctx.globalCompositeOperation='lighter'; ctx.drawImage(glowSprite('rgba(255,179,71,0.8)','rgba(255,179,71,0)',12), x-hr, y-hr, hr*2, hr*2); ctx.globalCompositeOperation='source-over'; }
    ctx.fillStyle='rgba(255,222,140,'+fl+')'; ctx.beginPath(); ctx.arc(x,y,2.6*fl,0,6.283); ctx.fill(); }
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,205,95,0.85)'; ctx.beginPath(); ctx.arc(cx,cy,3.5,0,6.283); ctx.fill();
}
/* prebaked screen-space layers — full-screen gradients cost too much to rebuild every frame */
let vignB=null;
function bakeVign(danger,db,tb){
  tb=tb||0;
  // C6 — THE NIGHT ARC: the grade cools from candle-amber toward bone-and-violet as 13:00
  // approaches; tb=99 is the HOUSE's hour (coldest). Rebaked ~13x/night, zero per-frame cost.
  const nf=Math.min(1.35, tb===99?1.35:tb/12);
  const L=(a,b)=>Math.round(a+(b-a)*Math.min(1,nf));
  const w=Math.max(2,VW>>1), h=Math.max(2,VH>>1);
  const mk=()=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const B={w:VW,h:VH,db,tb,grade:GFX.grade};
  { B.warm=mk(); const x=B.warm.getContext('2d');
    const g=x.createRadialGradient(w/2,h*0.46,0,w/2,h*0.46,Math.max(w,h)*0.5);
    g.addColorStop(0,'rgba(120,70,30,'+(0.10-Math.min(1,nf)*0.07).toFixed(3)+')'); g.addColorStop(1,'rgba(120,70,30,0)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.danger=mk(); const x=B.danger.getContext('2d');
    const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*(0.5-danger*0.3),w/2,h/2,Math.max(w,h)*0.8);
    g.addColorStop(0,'rgba(90,10,16,0)'); g.addColorStop(1,'rgba(90,10,16,1)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.main=mk(); const x=B.main.getContext('2d');
    const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*(0.30-danger*0.12),w/2,h/2,Math.max(w,h)*0.74);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.45,'rgba('+L(6,9)+','+L(3,5)+','+L(8,18)+','+(0.12+danger*0.2)+')'); g.addColorStop(0.75,'rgba('+L(6,9)+','+L(4,6)+','+L(10,22)+','+(0.5+danger*0.35)+')'); g.addColorStop(1,'rgba('+L(2,5)+','+L(2,4)+','+L(8,24)+','+Math.min(1,0.86+danger*0.3)+')'); // A1: edges fall into dark
    x.fillStyle=g; x.fillRect(0,0,w,h);
    if(tb>=100){ // B2 — THE ENDLESS FLOOR: below the House's hour the grade sinks into blood-violet, deeper each minute
      const ab=Math.min(1,(tb-99)/9), g2=x.createRadialGradient(w/2,h/2,Math.min(w,h)*(0.36-ab*0.14),w/2,h/2,Math.max(w,h)*0.7);
      g2.addColorStop(0,'rgba(40,0,30,0)'); g2.addColorStop(0.6,'rgba(52,4,40,'+(0.18+ab*0.22).toFixed(3)+')'); g2.addColorStop(1,'rgba(20,0,18,'+(0.35+ab*0.35).toFixed(3)+')');
      x.fillStyle=g2; x.fillRect(0,0,w,h); } }
  { B.heart=mk(); const x=B.heart.getContext('2d');
    const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*0.34,w/2,h/2,Math.max(w,h)*0.72);
    g.addColorStop(0,'rgba(140,10,20,0)'); g.addColorStop(1,'rgba(140,10,20,1)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.gold=mk(); const x=B.gold.getContext('2d');
    const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*0.44,w/2,h/2,Math.max(w,h)*0.75);
    g.addColorStop(0,'rgba(255,190,80,0)'); g.addColorStop(1,'rgba(255,190,80,1)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.grd=mk(); const x=B.grd.getContext('2d');
    const g=x.createRadialGradient(w/2,h*0.42,45,w/2,h*0.55,Math.max(w,h)*0.75);
    g.addColorStop(0,'rgba('+L(255,224)+','+L(214,224)+','+L(150,236)+','+(0.11-Math.min(1,nf)*0.02).toFixed(3)+')'); g.addColorStop(1,'rgba('+L(12,7)+','+L(7,6)+','+L(22,30)+','+(0.18+Math.min(1,nf)*0.05).toFixed(3)+')');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.shaft=mk2(190,Math.max(2,VH>>1)); const x=B.shaft.getContext('2d');
    const g=x.createLinearGradient(0,0,45,B.shaft.height); g.addColorStop(0,'rgba(168,200,255,0.075)'); g.addColorStop(1,'rgba(168,200,255,0)');
    x.fillStyle=g; x.beginPath(); x.moveTo(10,0); x.lineTo(45,0); x.lineTo(85,B.shaft.height); x.lineTo(0,B.shaft.height); x.closePath(); x.fill();
    const g2=x.createLinearGradient(0,0,45,B.shaft.height*0.8); g2.addColorStop(0,'rgba(255,226,170,0.05)'); g2.addColorStop(1,'rgba(255,226,170,0)');
    x.fillStyle=g2; x.beginPath(); x.moveTo(20,0); x.lineTo(36,0); x.lineTo(58,B.shaft.height*0.85); x.lineTo(14,B.shaft.height*0.85); x.closePath(); x.fill(); }
  vignB=B;
  function mk2(w2,h2){ const c=document.createElement('canvas'); c.width=w2; c.height=h2; return c; }
}
const _bgCache={};
function bulletGrad(kind,r){
  const k=kind+(r|0); let g=_bgCache[k]; if(g) return g;
  if(kind==='knife'){ g=ctx.createLinearGradient(-r,0,r*1.6,0); g.addColorStop(0,'#8fa4c0'); g.addColorStop(0.6,'#eef3fb'); g.addColorStop(1,'#ffffff'); }
  else { g=ctx.createLinearGradient(0,0,-r*4,0); g.addColorStop(0,'rgba(201,139,255,0.85)'); g.addColorStop(0.5,'rgba(140,70,220,0.4)'); g.addColorStop(1,'rgba(90,30,160,0)'); }
  return _bgCache[k]=g;
}
// C4 — THE GORE LEDGER: the floor remembers the whole night. Kills stamp ONCE into a
// 1/3-scale offscreen canvas; a slow wash dries old blood toward black-brown; per frame
// the visible sub-rect is ONE drawImage. Strictly cheaper than the old 40-ellipse loop.
// Tiled 3x3 so a stamp only dirties (and re-uploads) one ~467px tile, never the whole arena.
let goreT=null, _goreDryI=0, _goreDryT=0, _goreWinT=0, _goreWinN=0;
const GORE_S=1/3, GORE_N=3;
function goreTile(i){
  if(!goreT) goreT=new Array(GORE_N*GORE_N).fill(null);
  let t=goreT[i];
  if(!t){ const w=Math.ceil(CFG.arena*GORE_S/GORE_N); t={cv:document.createElement('canvas')}; t.cv.width=t.cv.height=w; t.g=t.cv.getContext('2d'); goreT[i]=t; }
  return t;
}
function goreStamp(x,y,r){
  if(Math.abs(gt-_goreWinT)>0.1){ _goreWinT=gt; _goreWinN=0; } // abs: a fresh night's gt=0 must never sit behind a stale window
  if(++_goreWinN>2) return; // a nova massacre cannot spike the ledger (~20 stamps/s)
  const tw=CFG.arena/GORE_N;
  const ti=Math.min(GORE_N-1,Math.max(0,(x/tw)|0)), tj=Math.min(GORE_N-1,Math.max(0,(y/tw)|0));
  const t=goreTile(tj*GORE_N+ti);
  const g=t.g, R=Math.max(1.6,r*GORE_S), lx=(x-ti*tw)*GORE_S, ly=(y-tj*tw)*GORE_S;
  g.save(); g.translate(lx,ly); g.rotate(Math.random()*6.28);
  g.fillStyle='rgba(74,13,20,0.55)';
  g.beginPath(); g.ellipse(0,0,R*1.2,R*0.8,0,0,6.28); g.fill();
  if(!GFX.lite){
    g.beginPath(); g.ellipse(R*0.8,R*0.3,R*0.4,R*0.26,0,0,6.28); g.fill();
    g.beginPath(); g.ellipse(-R*0.7,-R*0.35,R*0.3,R*0.2,0,0,6.28); g.fill();
  }
  g.restore();
}
// C1 — THE LEDGER OF FRAMES: per-stage profiler. Dark unless ?prof (or __prof.on=true).
const PROF={ on:/[?&#]prof/.test(location.search+location.hash), t0:0, tS:0, cur:null, frames:0,
  stages:{}, ring:new Float32Array(600), ri:0, rn:0, spikes25:0, spikes40:0, spikeStage:{}, _worst:0, _worstN:'',
  frameStart(){ if(!this.on) return; this.t0=performance.now(); this.tS=this.t0; this.cur=null; this._worst=0; this._worstN=''; },
  mark(n){ if(!this.on) return; const t=performance.now();
    if(this.cur){ const d=t-this.tS; this.stages[this.cur]=(this.stages[this.cur]||0)+d; if(d>this._worst){ this._worst=d; this._worstN=this.cur; } }
    this.cur=n; this.tS=t; },
  frameEnd(){ if(!this.on) return; this.mark(null); const total=performance.now()-this.t0;
    this.ring[this.ri]=total; this.ri=(this.ri+1)%600; if(this.rn<600) this.rn++;
    if(total>25){ this.spikes25++; this.spikeStage[this._worstN]=(this.spikeStage[this._worstN]||0)+1; }
    if(total>40) this.spikes40++;
    this.frames++; },
  report(){ const n=this.rn||1; const arr=Array.prototype.slice.call(this.ring,0,this.rn).sort((a,b)=>a-b);
    let sum=0; for(let i=0;i<arr.length;i++) sum+=arr[i];
    const st={}; const f=this.frames||1; for(const k in this.stages) st[k]=+(this.stages[k]/f).toFixed(3);
    return {frames:this.frames, avgMs:+(sum/n).toFixed(2), p95Ms:+((arr[Math.min(n-1,Math.floor(n*0.95))]||0)).toFixed(2),
      spikes25:this.spikes25, spikes40:this.spikes40, spikeStage:this.spikeStage, stages:st}; },
  reset(){ this.stages={}; this.ri=0; this.rn=0; this.spikes25=0; this.spikes40=0; this.spikeStage={}; this.frames=0; }
};
window.__prof=PROF;
// B4 — the blood bar's box in canvas (logical) px, re-read twice a second (it moves only on resize / layout)
function _b4HpRect(){ const n=performance.now(); let c=window._b4hp;
  if(!c||n-c.t>500||n<c.t){ let v=null; const el=document.getElementById('hpwrap');
    if(el){ const b=el.getBoundingClientRect(), z=(typeof ZOOM==='number'&&ZOOM>0)?ZOOM:1; if(b.width>0) v={l:b.left/z,r:b.right/z,t:b.top/z}; }
    c=window._b4hp={t:n,v}; }
  return c.v; }
function render(){
  ctx.save();
  let sx=0,sy=0; if(shake>0){ const sh=shake*0.6*(GFX.shake!=null?Math.min(1.5,GFX.shake):1); sx=rnd(-sh,sh); sy=rnd(-sh,sh); } // B3: the SHAKE dial scales it
  const cf = 0.9+Math.sin(gt*3)*0.03+Math.sin(gt*7.3)*0.02; // candle flicker
  ctx.fillStyle='#0a0507'; ctx.fillRect(0,0,VW,VH);
  ctx.save(); ctx.translate(-camX+sx,-camY+sy);
  PROF.mark('floor');

  // gothic marble hall floor — tiles baked once per variant, blitted per frame
  const cs=200;
  window._tileC=window._tileC||new Map();
  const tileSprite=(dark,variant)=>{
    const key=(dark?1:0)*24+variant; let sp=window._tileC.get(key); if(sp) return sp;
    sp=document.createElement('canvas'); sp.width=cs; sp.height=cs; const x=sp.getContext('2d');
    const vh=((variant+7)*2654435761)>>>0;
    // A1 GILT NOIR — velvet-black marble: desaturated, low-contrast, no gold on the floor (law 3)
    x.fillStyle=dark?'#0c0609':'#110a0d'; x.fillRect(0,0,cs,cs);
    { const g=x.createLinearGradient(0,0,cs,cs); g.addColorStop(0,'rgba(170,120,130,0.03)'); g.addColorStop(0.55,'rgba(0,0,0,0.12)'); g.addColorStop(1,'rgba(40,10,18,0.06)');
      x.fillStyle=g; x.fillRect(0,0,cs,cs); }
    x.strokeStyle='rgba(200,170,180,0.03)'; x.lineWidth=1;
    for(let v=0;v<2;v++){ const o=((vh>>(v*5))&31)/31; x.beginPath(); x.moveTo(o*cs,0); x.bezierCurveTo(o*cs+30,cs*0.4,o*cs-24,cs*0.7,((vh>>(v*7))&31)/31*cs,cs); x.stroke(); }
    x.strokeStyle='rgba(230,217,194,0.028)'; x.lineWidth=1; x.strokeRect(11,11,cs-22,cs-22);
    const mcx=cs/2, mcy=cs/2;
    if(vh%6===0){
      const suit=['♠','♥','♦','♣'][(vh>>>3)%4];
      x.fillStyle=(suit==='♥'||suit==='♦')?'rgba(120,20,32,0.10)':'rgba(150,130,140,0.045)';
      x.font='700 64px serif'; x.textAlign='center'; x.textBaseline='middle';
      x.fillText(suit,mcx,mcy+2);
      x.strokeStyle='rgba(230,217,194,0.03)'; x.lineWidth=1.4;
      x.beginPath(); x.arc(mcx,mcy,42,0,6.283); x.stroke();
    } else if(!dark){
      x.strokeStyle='rgba(140,24,36,0.05)'; x.lineWidth=1.2;
      x.beginPath(); x.arc(mcx,mcy,10,0,6.283); x.stroke();
    }
    window._tileC.set(key,sp); return sp;
  };
  const _bR=!!(window._fmods&&window._fmods.ballroom&&typeof balTile==='function'); // D3: THE BALLROOM bakes its own mirror floor
  const cx0=Math.floor(camX/cs), cy0=Math.floor(camY/cs);
  const cxn=Math.ceil((camX+VW)/cs), cyn=Math.ceil((camY+VH)/cs);
  for(let gx=cx0;gx<=cxn;gx++) for(let gy=cy0;gy<=cyn;gy++){
    const dark=(((gx+gy)&1)===0);
    const h=((gx*73856093)^(gy*19349663))>>>0;
    ctx.drawImage(_bR?balTile(dark,h%24):tileSprite(dark,h%24), gx*cs, gy*cs);
  }
  ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=2;
  for(let gx=cx0;gx<=cxn;gx++){ ctx.beginPath(); ctx.moveTo(gx*cs,camY-cs); ctx.lineTo(gx*cs,camY+VH+cs); ctx.stroke(); }
  for(let gy=cy0;gy<=cyn;gy++){ ctx.beginPath(); ctx.moveTo(camX-cs,gy*cs); ctx.lineTo(camX+VW+cs,gy*cs); ctx.stroke(); }
  // grand sigil + arena border + arch band
  drawWallsAndCarpet();
  if(_bR) balMedallion(CFG.arena/2,CFG.arena/2); else drawSigil(CFG.arena/2,CFG.arena/2);
  PROF.mark('decals');
  // battlefield gore — the permanent ledger first: only the visible tiles, one blit each
  if(goreT){
    if(gt-_goreDryT>0.7){ _goreDryT=gt; // dry ONE tile per beat, round-robin — never a whole-ledger wash
      const t=goreT[(_goreDryI++)%(GORE_N*GORE_N)];
      if(t){ t.g.save(); t.g.globalCompositeOperation='source-atop'; t.g.fillStyle='rgba(20,8,6,0.055)'; t.g.fillRect(0,0,t.cv.width,t.cv.height); t.g.restore(); } }
    const tw=CFG.arena/GORE_N;
    const i0=Math.max(0,(camX/tw)|0), i1=Math.min(GORE_N-1,((camX+VW)/tw)|0);
    const j0=Math.max(0,(camY/tw)|0), j1=Math.min(GORE_N-1,((camY+VH)/tw)|0);
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const t=goreT[j*GORE_N+i]; if(!t) continue;
      // only the visible sliver of each tile — dest area is exactly the viewport, never more
      const wx0=Math.max(i*tw,camX), wx1=Math.min((i+1)*tw,camX+VW);
      const wy0=Math.max(j*tw,camY), wy1=Math.min((j+1)*tw,camY+VH);
      if(wx1<=wx0||wy1<=wy0) continue;
      ctx.drawImage(t.cv, (wx0-i*tw)*GORE_S,(wy0-j*tw)*GORE_S,(wx1-wx0)*GORE_S,(wy1-wy0)*GORE_S, wx0,wy0,wx1-wx0,wy1-wy0); }
  }
  // …then tonight's freshest kills glisten wet for a heartbeat
  for(let i=decals.length-1;i>=0;i--){ const dc=decals[i]; dc.t+=1/60;
    if(dc.t>=dc.max){ decals.splice(i,1); continue; }
    const fa2=dc.t<1? dc.t : (1-Math.max(0,(dc.t-dc.max*0.55))/(dc.max*0.45));
    ctx.globalAlpha=Math.max(0,Math.min(0.5,fa2*0.5));
    ctx.fillStyle='#3a0a10';
    ctx.save(); ctx.translate(dc.x,dc.y); ctx.rotate(dc.a);
    ctx.beginPath(); ctx.ellipse(0,0,dc.r*1.2,dc.r*0.8,0,0,6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(dc.r*0.8,dc.r*0.3,dc.r*0.4,dc.r*0.26,0,0,6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-dc.r*0.7,-dc.r*0.35,dc.r*0.3,dc.r*0.2,0,0,6.28); ctx.fill();
    ctx.restore(); }
  ctx.globalAlpha=1;
  PROF.mark('env');
  // stained-glass window light pools — colored light on the marble
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const gp of glassPools){
    if(GFX.lite) break;
    if(!inView(gp.x,gp.y,gp.r+320)) continue;
    const dgn=Math.min(0.40,((P.level||1)-1)*0.020+Math.min(0.12,gt/900)); const sw=0.05+dgn*0.10+Math.sin(gt*0.7+gp.ph)*0.02;
    // gradient baked once per pool (world coords are static), brightness modulated live
    if(!gp._pg){ const gg2=ctx.createRadialGradient(gp.x,gp.y,0,gp.x,gp.y,gp.r);
      gg2.addColorStop(0,'rgba('+gp.c[0]+','+gp.c[1]+','+gp.c[2]+',0.255)');
      gg2.addColorStop(0.6,'rgba('+gp.c[0]+','+gp.c[1]+','+gp.c[2]+',0.15)');
      gg2.addColorStop(1,'rgba('+gp.c[0]+','+gp.c[1]+','+gp.c[2]+',0)');
      gp._pg=gg2; }
    ctx.globalAlpha=Math.min(1,sw/0.15);
    ctx.fillStyle=gp._pg; ctx.beginPath(); ctx.ellipse(gp.x,gp.y,gp.r,gp.r*0.62,gp.ph,0,6.28); ctx.fill();
    ctx.globalAlpha=1;
    // leading — dark window mullions crossing the pool
    ctx.globalCompositeOperation='source-over'; ctx.strokeStyle='rgba(8,4,8,'+(sw*2.6)+')'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(gp.x-gp.r*0.8,gp.y); ctx.lineTo(gp.x+gp.r*0.8,gp.y);
    ctx.moveTo(gp.x,gp.y-gp.r*0.5); ctx.lineTo(gp.x,gp.y+gp.r*0.5); ctx.stroke();
    ctx.globalCompositeOperation='lighter';
  }
  ctx.restore();
  drawLandmarks();
  // soul candles — drifting wisps that pierce the dark
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const sc of soulCandles){
    if(!inView(sc.x,sc.y,160) || (qLow && ((sc.x|0)%3===0))) continue;
    const wx=sc.x+Math.sin(gt*sc.sp+sc.ph)*46, wy=sc.y+Math.cos(gt*sc.sp*0.8+sc.ph)*34;
    const dgn2=Math.min(0.40,((P.level||1)-1)*0.020+Math.min(0.12,gt/900));
    const br=0.30+dgn2*0.9+Math.sin(gt*5+sc.ph)*0.10;
    { const rr2=26+dgn2*30; ctx.globalAlpha=Math.max(0,Math.min(1,br*0.5));
      ctx.drawImage(glowSprite('rgba(160,220,255,1)','rgba(120,180,255,0)',rr2), wx-rr2, wy-rr2, rr2*2, rr2*2); ctx.globalAlpha=1; }
    ctx.fillStyle='rgba(220,240,255,'+br+')'; ctx.beginPath(); ctx.ellipse(wx,wy,2.2,3.6+Math.sin(gt*9+sc.ph)*0.8,0,0,6.28); ctx.fill();
  }
  ctx.restore();
  // cathedral light shafts — slanted beams falling from unseen windows onto the pools
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const gp of glassPools){
    if(!GFX.shafts || GFX.lite) break;
    if(!inView(gp.x,gp.y,gp.r+460)) continue;
    const shm=0.5+Math.sin(gt*0.5+gp.ph*2)*0.25;
    const topX=gp.x+180, topY=gp.y-420;
    const bw=gp.r*0.72;
    if(!gp._bg){ const sg2=ctx.createLinearGradient(topX,topY,gp.x,gp.y);
      sg2.addColorStop(0,'rgba('+gp.c[0]+','+gp.c[1]+','+gp.c[2]+',0)');
      sg2.addColorStop(0.65,'rgba('+gp.c[0]+','+gp.c[1]+','+gp.c[2]+',0.035)');
      sg2.addColorStop(1,'rgba('+gp.c[0]+','+gp.c[1]+','+gp.c[2]+',0.07)');
      gp._bg=sg2; }
    ctx.globalAlpha=shm; ctx.fillStyle=gp._bg;
    ctx.beginPath();
    ctx.moveTo(topX-bw*0.4,topY); ctx.lineTo(topX+bw*0.4,topY);
    ctx.lineTo(gp.x+bw,gp.y); ctx.lineTo(gp.x-bw,gp.y);
    ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
    for(let mi=0;mi<(qLow?0:3);mi++){ const mf=((gt*0.05)+mi*0.33+gp.ph*0.2)%1;
      const mx=topX+(gp.x-topX)*mf, my=topY+(gp.y-topY)*mf;
      ctx.fillStyle='rgba(255,255,255,'+(0.28*shm*(1-Math.abs(mf-0.5)*1.2)).toFixed(3)+')';
      ctx.beginPath(); ctx.arc(mx+Math.sin(gt+mi*2.1)*6,my,1.3,0,6.28); ctx.fill(); }
  }
  ctx.restore();
  // gargoyle statues — hunched sentinels on plinths
  for(const gg of (_bR?BAL_NONE:gargoyles)){
    if(!inView(gg.x,gg.y,120)) continue;
    ctx.save(); ctx.translate(gg.x,gg.y);
    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0,16,20,7,0,0,6.28); ctx.fill();
    ctx.fillStyle='#1d1620'; ctx.fillRect(-15,4,30,12);
    ctx.fillStyle='#2a2130'; ctx.fillRect(-12,0,24,6);
    if(!window._gargG){ const gr2=ctx.createLinearGradient(0,-26,0,4); gr2.addColorStop(0,'#3a3142'); gr2.addColorStop(1,'#211a28'); window._gargG=gr2; }
    ctx.fillStyle=window._gargG;
    ctx.beginPath(); ctx.moveTo(-10,4); ctx.quadraticCurveTo(-14,-12,-4,-18); ctx.quadraticCurveTo(0,-24,4,-18); ctx.quadraticCurveTo(14,-12,10,4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4,-16); ctx.quadraticCurveTo(-20,-24,-16,-6); ctx.quadraticCurveTo(-10,-10,-4,-10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4,-16); ctx.quadraticCurveTo(20,-24,16,-6); ctx.quadraticCurveTo(10,-10,4,-10); ctx.fill();
    const ge=0.4+Math.sin(gt*2+gg.a*3)*0.25;
    ctx.fillStyle='rgba(255,60,60,'+ge+')';
    ctx.beginPath(); ctx.arc(-3,-18,1.5,0,6.28); ctx.arc(3,-18,1.5,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
  }
  // hellish cracks radiating from the sigil (red glow)
  ctx.save(); ctx.globalCompositeOperation='screen'; const C2=CFG.arena/2, cpv=0.055+Math.sin(gt*1.5)*0.02;
  for(const cr of (_bR?BAL_NONE:floorCracks)){ const first=cr.pts[0]; if(!((first.x>camX-400&&first.x<camX+VW+400)||(cr.pts[5].x>camX-400&&cr.pts[5].x<camX+VW+400))) continue;
    ctx.strokeStyle='rgba(255,70,55,0.03)'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(C2,C2); for(const p of cr.pts) ctx.lineTo(p.x,p.y); ctx.stroke();
    ctx.strokeStyle='rgba(220,50,55,'+cpv+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(C2,C2); for(const p of cr.pts) ctx.lineTo(p.x,p.y); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle='rgba(232,182,76,0.22)'; ctx.lineWidth=4; ctx.strokeRect(0,0,CFG.arena,CFG.arena);
  ctx.strokeStyle='rgba(232,182,76,0.12)'; ctx.lineWidth=2; ctx.strokeRect(70,70,CFG.arena-140,CFG.arena-140);
  // repeating gothic arches along the border band
  ctx.strokeStyle='rgba(230,217,194,0.06)'; ctx.lineWidth=2; const as=260, ar=80;
  for(let x=as;x<CFG.arena-as/2;x+=as){ ctx.beginPath(); ctx.arc(x,36,ar/3,Math.PI,0); ctx.stroke(); ctx.beginPath(); ctx.arc(x,CFG.arena-36,ar/3,0,Math.PI); ctx.stroke(); }
  for(let y=as;y<CFG.arena-as/2;y+=as){ ctx.beginPath(); ctx.arc(36,y,ar/3,-Math.PI/2,Math.PI/2); ctx.stroke(); ctx.beginPath(); ctx.arc(CFG.arena-36,y,ar/3,Math.PI/2,Math.PI*1.5); ctx.stroke(); }
  // columns (culled)
  for(const p of hallPillars){ if(p.x>camX-90 && p.x<camX+VW+90 && p.y>camY-90 && p.y<camY+VH+90) drawPillar(p.x,p.y,p.r); }
  // overhead chandeliers (culled)
  for(const ch of chandeliers){ if(ch.x>camX-ch.r*3 && ch.x<camX+VW+ch.r*3 && ch.y>camY-ch.r*3 && ch.y<camY+VH+ch.r*3) drawChandelier(ch.x,ch.y,ch.r); }

  // stray candlelight pools — A1: real additive light, soft falloff, wandering like a carried candle
  ctx.save(); ctx.globalCompositeOperation='lighter';
  if(!GFX.lite) for(let i=0;i<2;i++){ const px=camX+VW*(0.3+i*0.4)+Math.sin(gt*0.23+i*2.1)*90+Math.sin(gt*0.11+i)*38; const py=camY+VH*(0.35+i*0.3)+Math.cos(gt*0.17+i*1.3)*70+Math.cos(gt*0.07)*26; const rr=250+Math.sin(gt*4+i)*12;
    ctx.globalAlpha=Math.min(1,0.20*cf);
    ctx.drawImage(lightSprite(255,150,70), px-rr, py-rr*0.8, rr*2, rr*1.6); }
  ctx.globalAlpha=1; ctx.restore();
  if(_bR) balGround(); // D3: waltz current, chandelier telegraphs, wrecks, mirror seams

  PROF.mark('ground');
  // shockwave rings
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const r of rings){ const a=clamp(r.life*2,0,1);
    ctx.globalAlpha=a*0.35; ctx.strokeStyle=r.col; ctx.lineWidth=9; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.28); ctx.stroke();
    ctx.globalAlpha=a; ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.28); ctx.stroke();
    ctx.globalAlpha=a*0.8; ctx.strokeStyle=r.col; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(r.x,r.y,r.r*0.92,0,6.28); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha=1;
  drawPops&&drawPops();

  // orbs + coins — A1 GILT NOIR law 3+5: XP is a MINT soul-shard (diamond), coins are GOLD discs (round).
  // Shape AND color differ, and gold appears only on what pays. Bloom = cached additive sprites, no shadowBlur.
  const pickGlow = !GFX.lite;
  { ctx.save(); ctx.globalCompositeOperation='lighter';
    if(pickGlow){ const gs=glowSprite('rgba(139,255,208,0.55)','rgba(139,255,208,0)',16), gc=glowSprite('rgba(255,211,107,0.6)','rgba(255,190,80,0)',16);
      const os=qLow?18:24, cs2=qLow?18:26;
      for(const o of orbs){ if(!inView(o.x,o.y,40)) continue; ctx.drawImage(gs,o.x-os/2,o.y-os/2,os,os); }
      for(const c of coins){ if(!inView(c.x,c.y,40)) continue; ctx.drawImage(gc,c.x-cs2/2,c.y-cs2/2,cs2,cs2); } }
    ctx.restore(); }
  ctx.lineWidth=1.2; ctx.strokeStyle='#0b2a22';
  for(const o of orbs){ if(!inView(o.x,o.y,40)) continue; const pl=1+Math.sin(gt*6+o.x*0.1)*0.12, rr=o.r*1.15*pl, ry=rr*1.3;
    ctx.fillStyle='#5fe6b4'; ctx.beginPath(); ctx.moveTo(o.x,o.y-ry); ctx.lineTo(o.x+rr,o.y); ctx.lineTo(o.x,o.y+ry); ctx.lineTo(o.x-rr,o.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#d8fff0'; ctx.beginPath(); ctx.moveTo(o.x,o.y-ry); ctx.lineTo(o.x+rr*0.45,o.y-ry*0.1); ctx.lineTo(o.x-rr*0.2,o.y); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='#5a3a0c';
  for(const c of coins){ if(!inView(c.x,c.y,40)) continue; const sp=Math.abs(Math.cos(gt*4+c.x*0.07)), cw=c.r*(0.35+0.65*sp);
    ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.ellipse(c.x,c.y,cw,c.r,0,0,6.28); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.ellipse(c.x,c.y,cw*0.62,c.r*0.62,0,0,6.28); ctx.fill();
    if(sp>0.5){ ctx.fillStyle='#fff2c0'; ctx.fillRect(c.x-cw*0.35,c.y-c.r*0.45,Math.max(1,cw*0.3),c.r*0.3); } }
  if(typeof soulDrawWorld==='function') soulDrawWorld(); // D1: golden chips, the martyr's halo

  // aura visual
  if(auraRadius()>0){ const aR=auraRadius(); ctx.save(); ctx.globalCompositeOperation='screen'; ctx.translate(P.x,P.y);
    window._auraG=window._auraG||{}; let g=window._auraG[aR|0];
    if(!g){ g=ctx.createRadialGradient(0,0,0,0,0,aR); g.addColorStop(0,'rgba(80,200,120,0)'); g.addColorStop(0.7,'rgba(80,200,120,0.05)'); g.addColorStop(1,'rgba(80,200,120,0.14)'); window._auraG[aR|0]=g; }
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,aR+Math.sin(gt*4)*4,0,6.28); ctx.fill(); ctx.restore(); }

  // enemies
  // ── new arsenal ground effects ──
  if(gpools.length){ ctx.save();
    for(const p9 of gpools){ const gs9=glowSprite('rgba(160,90,232,0.4)','rgba(120,60,200,0)',(p9.r|0));
      ctx.globalAlpha=Math.min(1,p9.t); ctx.drawImage(gs9,p9.x-p9.r,p9.y-p9.r,p9.r*2,p9.r*2);
      ctx.globalAlpha=Math.min(1,p9.t)*0.8; ctx.fillStyle='rgba(140,70,220,0.25)';
      ctx.beginPath(); ctx.ellipse(p9.x,p9.y,p9.r*0.85,p9.r*0.55,0,0,6.28); ctx.fill();
      for(let bi=0;bi<3;bi++){ const bx9=p9.x+Math.sin(gt*3+bi*2.1+p9.x)*p9.r*0.5, by9=p9.y+Math.cos(gt*2.4+bi*1.7)*p9.r*0.3;
        ctx.fillStyle='rgba(200,140,255,'+(0.4+Math.sin(gt*6+bi)*0.25)+')'; ctx.beginPath(); ctx.arc(bx9,by9,2.2,0,6.28); ctx.fill(); } }
    ctx.restore(); ctx.globalAlpha=1; }
  if(gstakes.length){ for(const s of gstakes){ ctx.save(); ctx.translate(s.x,s.y);
    ctx.globalAlpha=Math.min(1,s.t*2);
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0,3,10,4,0,0,6.28); ctx.fill();
    ctx.fillStyle='#8a939c'; ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(4,2); ctx.lineTo(-4,2); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#cfd8de'; ctx.fillRect(-5,-16,10,3);
    ctx.restore(); } ctx.globalAlpha=1; }
  if(waves.length){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(const w of waves){ ctx.globalAlpha=Math.min(1,w.t*2.4)*0.8;
      ctx.strokeStyle='#ffd36b'; ctx.lineWidth=3.5;
      ctx.beginPath(); ctx.arc(w.x,w.y,w.r,w.a-0.62,w.a+0.62); ctx.stroke();
      ctx.strokeStyle='rgba(255,242,192,0.7)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.arc(w.x,w.y,w.r-4,w.a-0.55,w.a+0.55); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha=1; }
  if(guils.length){ for(const g9 of guils){ ctx.save(); ctx.translate(g9.x,g9.y);
    if(!g9.fell){ // the shadow of the blade grows
      const f9=1-Math.max(0,g9.t)/0.55;
      ctx.globalAlpha=0.3+f9*0.3; ctx.fillStyle='#200408';
      ctx.beginPath(); ctx.ellipse(0,0,(90)*(0.4+f9*0.6),(38)*(0.4+f9*0.6),0,0,6.28); ctx.fill();
      ctx.globalAlpha=0.7; ctx.strokeStyle='#ff5560'; ctx.lineWidth=2; ctx.setLineDash([8,6]);
      ctx.beginPath(); ctx.ellipse(0,0,90*(0.4+f9*0.6),38*(0.4+f9*0.6),0,0,6.28); ctx.stroke(); ctx.setLineDash([]);
    } else { // the blade, mid-slam
      const f9=1-Math.max(0,g9.t)/0.28;
      ctx.globalAlpha=1-f9*0.6;
      ctx.fillStyle='#dfe8ee'; ctx.beginPath();
      ctx.moveTo(-46,-150+f9*120); ctx.lineTo(46,-150+f9*120); ctx.lineTo(46,-60+f9*120); ctx.lineTo(0,-30+f9*120); ctx.lineTo(-46,-60+f9*120); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#8a1620'; ctx.fillRect(-46,-154+f9*120,92,6); }
    ctx.restore(); } ctx.globalAlpha=1; }
  arsenalGround(); // E1 — bubbling pools, the guillotine's scaffold, cracks in the marble
  if((P.wlv.candelabra||0)>0){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let ci=0;ci<3;ci++){ const ca=gt*1.4+ci*2.094, cx9=P.x+Math.cos(ca)*52, cy9=P.y+Math.sin(ca)*52-14;
      ctx.drawImage(glowSprite('rgba(255,220,130,0.7)','rgba(255,180,60,0)',14),cx9-14,cy9-18,28,28);
      ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.ellipse(cx9,cy9-6,2,3.6+Math.sin(gt*9+ci)*0.8,0,0,6.28); ctx.fill();
      ctx.fillStyle='#e8e0d0'; ctx.fillRect(cx9-1.5,cy9-4,3,8); }
    ctx.restore(); }
  if((P.wlv.pendulum||0)>0){ const pl9=P.wlv.pendulum||0, pr9=70+pl9*14, paA=P.aim+(P.pendA||0);
    ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(paA); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(201,183,255,0.75)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.arc(0,0,pr9,-0.42,0.42); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(0,0,pr9-3,-0.36,0.36); ctx.stroke();
    ctx.restore(); }
  drawSmites(); drawTarots(); drawWheelTok(); drawCrashTok(); drawEgg(); drawGuides();
  hrDrawFloor(); // C2
  if(bounty && enemies.includes(bounty.e)){ const be=bounty.e;
    ctx.save(); ctx.translate(be.x,be.y);
    ctx.rotate(gt*2); ctx.strokeStyle='rgba(255,211,107,'+(0.6+Math.sin(gt*6)*0.3)+')'; ctx.lineWidth=2.4; ctx.setLineDash([7,6]);
    ctx.beginPath(); ctx.arc(0,0,be.r*1.4+5,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.rotate(-gt*2);
    ctx.fillStyle='#ffd36b'; ctx.shadowColor='#ffd36b'; ctx.shadowBlur=10;
    ctx.font='700 15px serif'; ctx.textAlign='center'; ctx.fillText('☠', 0, -be.r*1.6-8+Math.sin(gt*5)*2);
    ctx.shadowBlur=0;
    ctx.strokeStyle='#ffd36b'; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.arc(0,0,be.r*1.4+10,-1.5708,-1.5708+(bounty.t/12)*6.283); ctx.stroke();
    ctx.restore(); }
  // a red arc names the tooth that bit you
  if(window._hitArc && window._hitArc.t>0){ const ha=window._hitArc; ha.t-=1/60;
    ctx.save(); ctx.strokeStyle='rgba(255,70,85,'+(ha.t*1.8)+')'; ctx.lineWidth=4.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(P.x,P.y,44,ha.a-0.55,ha.a+0.55); ctx.stroke(); ctx.restore(); }
  // A1 — Vesper carries the light: a broad soft halo on the marble (additive, baked falloff, two blits)
  { ctx.save(); ctx.globalCompositeOperation='lighter'; const hb=1+Math.sin(gt*2.4)*0.04, lr=GFX.lite?170:250*hb;
    ctx.globalAlpha=(GFX.lite?0.22:0.30)*cf; ctx.drawImage(lightSprite(255,190,110), P.x-lr, P.y-lr*0.78+6, lr*2, lr*1.56);
    ctx.globalAlpha=0.32; ctx.drawImage(lightSprite(255,226,170), P.x-70, P.y-40, 140, 104); ctx.restore(); }
  // bosses press their menace into the floor
  if(!GFX.lite) for(const e of enemies){ if(!e.boss || !inView(e.x,e.y,200)) continue;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+Math.sin(gt*3+e.ph)*0.15;
    const br9=e.r*2.6; ctx.drawImage(glowSprite('rgba(201,80,120,0.3)','rgba(140,20,40,0)',br9), e.x-br9, e.y-br9*0.7, br9*2, br9*1.4); ctx.restore();
    if(!qLow){ // C7 — afterimages: the boss drags three fading ghosts of itself
      e._tr=e._tr||[]; if(e._trT===undefined||gt-e._trT>0.09||gt<e._trT){ e._trT=gt; e._tr.unshift({x:e.x,y:e.y}); if(e._tr.length>3) e._tr.length=3; }
      const sp9=silSprite(e.vt||e.type,e.dark,e.col), dw9=e.r*3.2; const als=[0.22,0.14,0.08];
      for(let g9=e._tr.length-1;g9>=1;g9--){ const p9=e._tr[g9]; ctx.globalAlpha=als[g9]||0.08; ctx.drawImage(sp9,p9.x-dw9/2,p9.y-dw9/2,dw9,dw9); }
      ctx.globalAlpha=1; } }
  // horde LOD: beyond the nearest N enemies, draw cheap silhouettes (toaster keeps only 24 in full art)
  { const LODN=({low:20,normal:44,high:120,inf:99999})[GFX.lod] || (GFX.lite?20:44);
  if(enemies.length>LODN){
    window._lodF=(window._lodF||0)+1;
    if(window._lodF%3===1 || window._lodCut===undefined){ // the cut barely moves — recompute every 3rd frame, no per-frame array garbage
      window._lodArr=window._lodArr||[]; const la=window._lodArr; la.length=enemies.length;
      for(let i=0;i<enemies.length;i++){ const e=enemies[i]; const dx=e.x-P.x, dy=e.y-P.y; la[i]=e._d2=dx*dx+dy*dy; }
      la.sort((a,b)=>a-b); window._lodCut=la[LODN-1];
    } else { for(const e of enemies){ const dx=e.x-P.x, dy=e.y-P.y; e._d2=dx*dx+dy*dy; } }
    const cut=window._lodCut;
    for(const e of enemies) e._lod = e._d2>cut && !e.boss && !e.elite;
  } else for(const e of enemies) e._lod=false; }
  PROF.mark('enemies');
  window._dense=enemies.length>90; // in a storm, tertiary flourishes yield
  for(const e of enemies){
    if(!e.boss && (e.x<camX-100||e.x>camX+VW+100||e.y<camY-100||e.y>camY+VH+100)) continue; // offscreen court stays unpainted
    drawEnemy(e);
  }
  drawCorpses(); // E1 — bursts, crumbles, dissolves

  PROF.mark('bullets');
  // chain lightning — jagged bolts, white core + halo
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  for(const s of sparks){
    const a=clamp(s.life*6,0,1); const dx=s.x2-s.x1, dy=s.y2-s.y1, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
    const segs=4, pts=[[s.x1,s.y1]];
    for(let i=1;i<segs;i++){ const f=i/segs, off=rnd(-9,9); pts.push([s.x1+dx*f+nx*off, s.y1+dy*f+ny*off]); }
    pts.push([s.x2,s.y2]);
    ctx.globalAlpha=a*0.5; ctx.strokeStyle=s.col; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke();
    ctx.globalAlpha=a; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.7;
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke();
    if(Math.random()<0.5){ const bp=pts[1+((Math.random()*(pts.length-2))|0)]; ctx.globalAlpha=a*0.8; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bp[0],bp[1]); ctx.lineTo(bp[0]+rnd(-14,14),bp[1]+rnd(-14,14)); ctx.stroke(); }
  }
  ctx.restore(); ctx.globalAlpha=1;

  // enemy bullets (amber, menacing)
  for(const b of ebullets){ ctx.strokeStyle='rgba(255,150,60,0.35)'; ctx.lineWidth=b.r*1.3; ctx.beginPath(); ctx.moveTo(b.px,b.py); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  if(ebullets.length){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55;
    for(const b of ebullets){ const hr=b.r*2.6; ctx.drawImage(glowSprite('rgba(255,138,44,0.9)','rgba(255,138,44,0)',24), b.x-hr, b.y-hr, hr*2, hr*2); }
    ctx.restore(); }
  for(const b of ebullets){ ctx.fillStyle='#ffce5a'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.28); ctx.fill(); ctx.fillStyle='#fff3d0'; ctx.beginPath(); ctx.arc(b.x-1.5,b.y-1.5,b.r*0.35,0,6.28); ctx.fill(); }
  hrDrawTop(); // C2

  // aura cloud (drawn under bullets)
  if(P.wlv.aura && !(P.evo&&P.evo.aura)){ const aR=90+P.wlv.aura*14; // H3 ctx.save(); ctx.globalCompositeOperation='screen'; ctx.translate(P.x,P.y);
    window._auraG2=window._auraG2||{}; let g=window._auraG2[aR|0];
    if(!g){ g=ctx.createRadialGradient(0,0,0,0,0,aR); g.addColorStop(0,'rgba(90,190,110,0.02)'); g.addColorStop(0.6,'rgba(90,190,110,0.10)'); g.addColorStop(1,'rgba(60,150,90,0.18)'); window._auraG2[aR|0]=g; }
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,aR+Math.sin(gt*3)*4,0,6.28); ctx.fill(); ctx.strokeStyle='rgba(120,220,140,0.14)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,aR,0,6.28); ctx.stroke(); ctx.restore(); }

  // C6 — one prebuilt color voice per bullet kind: zero per-bullet string garbage
  window.BULLET_COL=window.BULLET_COL||(function(){ const m={crit:'255,225,140',seeker:'190,130,255',card:'245,240,220',knife:'200,220,255',d:'255,95,70'};
    const o={}; for(const k in m) o[k]={base:m[k], t1:'rgba('+m[k]+',0.16)', t2:'rgba('+m[k]+',0.55)', h1:'rgba('+m[k]+',1)', h0:'rgba('+m[k]+',0)'}; return o; })();
  // bullet trails — additive glow
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  for(const b of bullets){ if(arsenalTrail(b)) continue; /* E1 — per-weapon trails */ const bc=BULLET_COL[b.crit?'crit':b.kind]||BULLET_COL.d;
    ctx.strokeStyle=bc.t1; ctx.lineWidth=b.r*3.4; ctx.beginPath(); ctx.moveTo(b.px,b.py); ctx.lineTo(b.x,b.y); ctx.stroke();
    ctx.strokeStyle=bc.t2; ctx.lineWidth=b.r*1.1; ctx.beginPath(); ctx.moveTo(b.px,b.py); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  ctx.restore();
  // bullets by kind
  for(const b of bullets){
    if(arsenalDraw(b)) continue; // E1 — the arsenal paints its own; other kinds fall through
    const _bc=BULLET_COL[b.crit?'crit':b.kind]||BULLET_COL.d; const base=_bc.base;
    ctx.save(); ctx.translate(b.x,b.y);
    // additive outer halo
    ctx.globalCompositeOperation='lighter';
    { const hr=b.r*3.2; ctx.globalAlpha=0.45;
      ctx.drawImage(glowSprite('rgba('+base+',1)','rgba('+base+',0)',hr), -hr, -hr, hr*2, hr*2); ctx.globalAlpha=1; }
    ctx.globalCompositeOperation='source-over';
    if(b.kind==='card'){
      ctx.rotate(b.spin||0);
      ctx.fillStyle='#f7f2e4'; ctx.fillRect(-b.r*0.7,-b.r*1.1,b.r*1.4,b.r*2.2);
      ctx.fillStyle=b.crit?'#d4212f':'#7a1c22'; ctx.beginPath(); ctx.moveTo(0,-b.r*0.5); ctx.lineTo(b.r*0.4,0); ctx.lineTo(0,b.r*0.5); ctx.lineTo(-b.r*0.4,0); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(-b.r*0.7,-b.r*1.1,b.r*0.28,b.r*2.2);
    } else if(b.kind==='knife'){
      const ang=Math.atan2(b.vy,b.vx); ctx.rotate(ang);
      ctx.fillStyle=bulletGrad('knife',b.r); ctx.beginPath(); ctx.moveTo(b.r*1.7,0); ctx.lineTo(-b.r,b.r*0.7); ctx.lineTo(-b.r*0.6,0); ctx.lineTo(-b.r,-b.r*0.7); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.moveTo(b.r*1.7,0); ctx.lineTo(b.r*0.2,b.r*0.12); ctx.lineTo(b.r*0.2,-b.r*0.12); ctx.closePath(); ctx.fill();
    } else if(b.kind==='seeker'){
      const pl=1+Math.sin(gt*10)*0.12; const va=Math.atan2(b.vy,b.vx);
      // trailing violet flame plume
      ctx.save(); ctx.rotate(va); ctx.globalCompositeOperation='lighter';
      const fl=Math.sin(gt*18+b.x*0.1)*0.3;
      ctx.fillStyle=bulletGrad('seeker',b.r);
      ctx.beginPath(); ctx.moveTo(0,-b.r*0.8); ctx.quadraticCurveTo(-b.r*2.2,-b.r*(0.9+fl),-b.r*4,0); ctx.quadraticCurveTo(-b.r*2.2,b.r*(0.9-fl),0,b.r*0.8); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle='#efe4ff'; ctx.beginPath(); ctx.arc(0,0,b.r*pl,0,6.28); ctx.fill();
      ctx.fillStyle='#efe4ff'; ctx.fillRect(-b.r*0.42,b.r*0.55,b.r*0.3,b.r*0.42); ctx.fillRect(b.r*0.12,b.r*0.55,b.r*0.3,b.r*0.42);
      ctx.fillStyle='#3a1a52';
      ctx.beginPath(); ctx.arc(-b.r*0.35,-b.r*0.18,b.r*0.24,0,6.28); ctx.arc(b.r*0.35,-b.r*0.18,b.r*0.24,0,6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,b.r*0.05); ctx.lineTo(-b.r*0.14,b.r*0.35); ctx.lineTo(b.r*0.14,b.r*0.35); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,120,200,0.8)';
      ctx.beginPath(); ctx.arc(-b.r*0.35,-b.r*0.18,b.r*0.1,0,6.28); ctx.arc(b.r*0.35,-b.r*0.18,b.r*0.1,0,6.28); ctx.fill();
    } else if(b.kind==='razor'){
      ctx.rotate(gt*22); ctx.fillStyle='#eef6ff';
      ctx.beginPath(); ctx.ellipse(0,0,b.r*1.7,b.r*0.5,0,0,6.28); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,0,b.r*0.5,b.r*1.7,0,0,6.28); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(200,230,255,0.8)';
      ctx.beginPath(); ctx.arc(0,0,b.r*0.5,0,6.28); ctx.fill();
    } else if(b.kind==='ember'){
      ctx.globalCompositeOperation='lighter';
      const ea9=Math.atan2(b.vy,b.vx); ctx.rotate(ea9);
      ctx.fillStyle='rgba(255,150,40,0.55)'; ctx.beginPath(); ctx.ellipse(-b.r*1.6,0,b.r*2.2,b.r*0.8,0,0,6.28); ctx.fill();
      ctx.fillStyle='#ffd28a'; ctx.beginPath(); ctx.arc(0,0,b.r,0,6.28); ctx.fill();
    } else if(b.kind==='stake'){
      const sa9=Math.atan2(b.vy,b.vx); ctx.rotate(sa9);
      ctx.fillStyle='#aeb8c2'; ctx.beginPath(); ctx.moveTo(b.r*2.2,0); ctx.lineTo(-b.r*1.4,b.r*0.7); ctx.lineTo(-b.r*1.4,-b.r*0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#e2e8ee'; ctx.fillRect(-b.r*1.8,-b.r*0.9,b.r*0.6,b.r*1.8);
    } else if(b.kind==='serpent'){
      const va9=Math.atan2(b.vy,b.vx); ctx.rotate(va9);
      const wig=Math.sin((b.life*14)+(b._ph||0))*b.r*1.6;
      ctx.translate(0,wig);
      ctx.fillStyle='#e8c261'; ctx.beginPath(); ctx.ellipse(0,0,b.r*1.9,b.r*0.75,0,0,6.28); ctx.fill();
      ctx.fillStyle='#8a6a1c'; ctx.beginPath(); ctx.ellipse(-b.r*1.2,0,b.r*0.8,b.r*0.45,0,0,6.28); ctx.fill();
      ctx.fillStyle='#2a1408'; ctx.beginPath(); ctx.arc(b.r*1.2,-b.r*0.25,b.r*0.22,0,6.28); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(232,194,97,0.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); for(let si9=0;si9<5;si9++){ const sx9=-b.r*(1.8+si9*1.2), sy9=Math.sin((b.life*14)+(b._ph||0)-si9*0.8)*b.r*1.4-wig; si9===0?ctx.moveTo(sx9,sy9):ctx.lineTo(sx9,sy9); } ctx.stroke();
    } else if(b.kind==='chalice'){
      ctx.rotate(b.life*8);
      ctx.fillStyle='#a05ae8'; ctx.beginPath(); ctx.moveTo(-b.r,-b.r); ctx.lineTo(b.r,-b.r); ctx.lineTo(b.r*0.3,b.r*0.3); ctx.lineTo(-b.r*0.3,b.r*0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#c9a0f0'; ctx.fillRect(-b.r*0.15,b.r*0.3,b.r*0.3,b.r*0.9);
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(200,140,255,0.7)'; ctx.beginPath(); ctx.ellipse(0,-b.r*0.9,b.r*0.8,b.r*0.3,0,0,6.28); ctx.fill();
    } else if(b.kind==='flamebolt'){
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle='#ffdf9a'; ctx.beginPath(); ctx.arc(0,0,b.r,0,6.28); ctx.fill();
      ctx.fillStyle='rgba(255,160,60,0.6)'; ctx.beginPath(); ctx.arc(0,0,b.r*1.8,0,6.28); ctx.fill();
    } else if(b.kind==='tracer'){
      const ta9=Math.atan2(b.vy,b.vx); ctx.rotate(ta9);
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle='rgba(255,211,107,0.5)'; ctx.beginPath(); ctx.ellipse(-b.r*3,0,b.r*4.4,b.r*0.7,0,0,6.28); ctx.fill();
      ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.ellipse(0,0,b.r*1.6,b.r*0.7,0,0,6.28); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.r*0.6,0,b.r*0.5,0,6.28); ctx.fill();
    } else {
      const ang=Math.atan2(b.vy,b.vx); ctx.rotate(ang);
      ctx.fillStyle=b.crit?'#ffe9a8':'#ffb199'; ctx.beginPath(); ctx.ellipse(0,0,b.r*2.0,b.r*0.82,0,0,6.28); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.ellipse(b.r*0.35,0,b.r*1.05,b.r*0.42,0,0,6.28); ctx.fill();
    }
    ctx.restore();
  }
  ctx.shadowBlur=0;
  arsenalOver(); // E1 — crit glints, scythe smear, bell rings, gramophone notes

  PROF.mark('actors');
  // scythe — crescent blade w/ fading sweep trail + glinting edge
  if(P.wlv.scythe){ const sL=P.wlv.scythe, sR=80+sL*8; ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(P.scytheA);
    ctx.globalCompositeOperation='lighter';
    for(let tr=1;tr<=3;tr++){ ctx.globalAlpha=0.14*(4-tr)/3; ctx.strokeStyle='#e8b64c'; ctx.lineWidth=15; ctx.beginPath(); ctx.arc(0,0,sR,-0.65-tr*0.28,0.65-tr*0.28); ctx.stroke(); }
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    const _sk='scy'+(sR|0); let bg=_lgCache[_sk];
    if(!bg){ bg=ctx.createLinearGradient(0,-sR,0,sR); bg.addColorStop(0,'#f6e0a8'); bg.addColorStop(0.5,'#e8b64c'); bg.addColorStop(1,'#8a6a2a'); _lgCap(); _lgCache[_sk]=bg; }
    ctx.strokeStyle=bg; ctx.lineWidth=8; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(0,0,sR,-0.7,0.7); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,sR+3,-0.7,0.7); ctx.stroke();
    const ta=0.7; ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.moveTo(Math.cos(ta)*(sR+5),Math.sin(ta)*(sR+5)); ctx.lineTo(Math.cos(ta+0.13)*(sR-6),Math.sin(ta+0.13)*(sR-6)); ctx.lineTo(Math.cos(ta)*(sR-9),Math.sin(ta)*(sR-9)); ctx.closePath(); ctx.fill();
    ctx.restore(); }
  // orbit — real casino chips: notched rims, face ring, spin shimmer
  if(P.wlv.orbit){ const oL=P.wlv.orbit, oR=54+oL*4; for(let k=0;k<oL;k++){ const oa=(P.orbitA||0)+k*(6.28/oL), ox=P.x+Math.cos(oa)*oR, oy=P.y+Math.sin(oa)*oR;
    ctx.save(); ctx.translate(ox,oy); ctx.rotate(oa*2);
    { const hr=14; ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.6; ctx.drawImage(glowSprite('rgba(232,182,76,0.9)','rgba(232,182,76,0)',16),-hr,-hr,hr*2,hr*2); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
    ctx.fillStyle='#c8102e'; ctx.beginPath(); ctx.arc(0,0,8,0,6.28); ctx.fill();
    ctx.fillStyle='#f6e7c0'; for(let n2=0;n2<6;n2++){ const na=n2*1.047; ctx.beginPath(); ctx.arc(Math.cos(na)*6.4,Math.sin(na)*6.4,1.7,0,6.28); ctx.fill(); }
    ctx.strokeStyle='#f6e7c0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(0,0,4.2,0,6.28); ctx.stroke();
    ctx.fillStyle='#ffd36b'; ctx.font='700 6px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('♠',0,0.5);
    const gl=Math.sin(gt*7+k*2)*0.5+0.5; ctx.globalAlpha=gl*0.7; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-2.5,-2.5,1.6,0,6.28); ctx.fill(); ctx.globalAlpha=1;
    ctx.restore(); } }

  if(typeof drawPairings==='function') drawPairings(); // C1 — the evolved arsenal
  drawPlayer();
  try{ b2DrawAdorn(); }catch(e){}
  if(_bR) balSky(); // D3: the chandelier hanging over its circle, then falling

  // particles
  for(const p of parts){ ctx.globalAlpha=clamp(p.life*(p.ash?0.9:1.6),0,1); ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill(); }
  ctx.globalAlpha=1;
  // floating text (stroked)
  ctx.textAlign='center';
  { let _tf=0; if(GFX.lite && texts.length>24) texts.splice(0,texts.length-24);
  for(const t of texts){ ctx.globalAlpha=clamp(t.life*1.3,0,1); if(t.size!==_tf){ _tf=t.size; ctx.font=`700 ${t.size}px 'Cinzel',serif`; } ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.strokeText(t.t,t.x,t.y); ctx.fillStyle=t.col; ctx.fillText(t.t,t.x,t.y); } }
  ctx.globalAlpha=1;
  ctx.restore();

  PROF.mark('post');
  // light shafts (screen space, prebaked sprite ×3) — now honors the LIGHT SHAFTS toggle
  if(GFX.shafts && !GFX.lite && vignB){
    ctx.save(); ctx.globalCompositeOperation='screen';
    for(let i=0;i<3;i++){ const lx=VW*(0.2+i*0.3)+Math.sin(gt*0.2+i)*40;
      ctx.drawImage(vignB.shaft, lx-20, 0, 190, VH); }
    ctx.restore();
  }

  // drifting fog (screen space, atmospheric depth)
  if(!GFX.lite){ ctx.save();
  // A1: half the haze — fog lifted the blacks (law 2) and was the single biggest fill cost (~2.4M px/frame)
  for(let fi=0;fi<fogPuffs.length;fi+=2){ const f=fogPuffs[fi]; f.x+=f.vx/60; f.y+=f.vy/60; if(f.x<-f.r)f.x=VW+f.r; else if(f.x>VW+f.r)f.x=-f.r; if(f.y<-f.r)f.y=VH+f.r; else if(f.y>VH+f.r)f.y=-f.r;
    const col=f.warm?'150,90,60':'70,80,120'; ctx.globalAlpha=Math.max(0,Math.min(1,f.a*cf));
    ctx.drawImage(glowSprite('rgba('+col+',1)','rgba('+col+',0)',f.r), f.x-f.r, f.y-f.r, f.r*2, f.r*2); ctx.globalAlpha=1; }
  ctx.restore(); }

  // drifting embers (screen space)
  if(!GFX.lite){ ctx.save(); ctx.globalCompositeOperation='screen';
  for(const em of embers){ em.y+=em.vy/60; em.x+=Math.sin(gt*0.8+em.sway)*0.35; if(em.y<-6){ em.y=VH+6; em.x=Math.random()*VW; } ctx.fillStyle='rgba(255,180,90,'+em.a+')'; ctx.beginPath(); ctx.arc(em.x,em.y,em.r,0,6.28); ctx.fill(); }
  ctx.restore(); }

  if(!GFX.lite && !(qLow && state==='playing')) drawAudience();

  // film grain
  if(grainReady && !GFX.lite){ ctx.save(); ctx.globalAlpha=0.5; const ox=(Math.random()*140)|0, oy=(Math.random()*140)|0; for(let x=-ox;x<VW;x+=140) for(let y=-oy;y<VH;y+=140){ ctx.drawImage(grainC,x,y); } ctx.restore(); }

  // vignette — warm heart, cold edges, darkening with danger (prebaked, alpha-modulated live)
  const danger = Math.min(0.40, ((P.level||1)-1)*0.020 + Math.min(0.12, gt/900));
  { const db=Math.round(danger*20);
    const tb=(P&&P._endless)?100+Math.min(8,Math.floor((gt-P._endT0)/60)):(typeof houseActive!=='undefined'&&houseActive)?99:Math.min(12,Math.floor(gt/65));
    if(!vignB || vignB.w!==VW || vignB.h!==VH || vignB.db!==db || vignB.tb!==tb || vignB.grade!==GFX.grade) bakeVign(danger,db,tb);
    ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=0.5+excite*0.5;
    ctx.drawImage(vignB.warm,0,0,VW,VH); ctx.restore();
    if(danger>0.02){ ctx.globalAlpha=danger*(0.6+Math.sin(gt*1.4)*0.15); ctx.drawImage(vignB.danger,0,0,VW,VH); ctx.globalAlpha=1; }
    ctx.globalAlpha=Math.min(1,cf); ctx.drawImage(vignB.main,0,0,VW,VH); ctx.globalAlpha=1; }
  // Death's court gathers around the slot — for LAST RITES (ice-eyed) and the FATE SPINS séance (violet-eyed)
  { const seance = state==='slot' && !lastRites && (slotStage==='select'||slotStage==='locking') && typeof selPos!=='undefined';
    if(state==='slot' && (lastRites || seance)){
      if(!P._courtT0) P._courtT0=performance.now();
      const creep=Math.min(1,(performance.now()-P._courtT0)/800);
      drawCourt(creep, lastRites?'150,220,255':'201,139,255', lastRites?'#9adcff':'#c98bff');
    } else if(state!=='slot' || (!lastRites && !seance)) P._courtT0=0;
  }
  // low-HP heartbeat vignette
  if(state==='playing' && P.hp/P.maxHp<0.25 && vignB){
    const hb=(Math.sin(gt*7.4)*0.5+0.5)*0.22+0.08;
    ctx.globalAlpha=hb; ctx.drawImage(vignB.heart,0,0,VW,VH); ctx.globalAlpha=1;
  }
  if(vignB && P._hurtF && gt<P._hurtF+0.3 && gt>=P._hurtF-0.2){ // A1 — the edges bleed for a beat when she is struck
    ctx.globalAlpha=Math.max(0,Math.min(1,(P._hurtF+0.3-gt)*2.4)); ctx.drawImage(vignB.heart,0,0,VW,VH); ctx.globalAlpha=1; }
  if(GFX.grade && state!=='menu' && vignB){
    ctx.save(); ctx.globalCompositeOperation='overlay';
    ctx.drawImage(vignB.grd,0,0,VW,VH); ctx.restore();
  }
  // GOLDEN HOUR shimmer
  if(state==='playing' && goldenT>0){
    ctx.save(); ctx.globalCompositeOperation='screen';
    let gg9=window._goldSG; if(!gg9){ gg9=ctx.createLinearGradient(0,0,0,90); gg9.addColorStop(0,'rgba(255,211,107,0.2)'); gg9.addColorStop(1,'rgba(255,211,107,0)'); window._goldSG=gg9; }
    ctx.globalAlpha=(0.14+Math.sin(gt*7)*0.06)/0.2; ctx.fillStyle=gg9; ctx.fillRect(0,0,VW,90); ctx.globalAlpha=1;
    for(let gi9=0;gi9<6;gi9++){ const gx9=((gt*40+gi9*197)% (VW+40))-20, gy9=20+((gi9*53)%50)+Math.sin(gt*3+gi9)*6;
      ctx.fillStyle='rgba(255,240,190,'+(0.5+Math.sin(gt*8+gi9)*0.3)+')';
      ctx.fillRect(gx9-2.6,gy9-0.6,5.2,1.2); ctx.fillRect(gx9-0.6,gy9-2.6,1.2,5.2); }
    ctx.restore();
  }
  // GOD-PHASE — green untouchable rush
  if(state==='playing' && P.godT>0){
    ctx.save(); ctx.globalCompositeOperation='screen';
    const _gk=VW+'x'+VH; if(window._godGK!==_gk){ window._godGK=_gk;
      const g3=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.24,VW/2,VH/2,Math.max(VW,VH)*0.74);
      g3.addColorStop(0,'rgba(60,220,110,0.06)'); g3.addColorStop(1,'rgba(40,200,90,0.15)'); window._godG=g3; }
    ctx.globalAlpha=(0.10+Math.sin(gt*11)*0.05)/0.15; ctx.fillStyle=window._godG; ctx.fillRect(0,0,VW,VH); ctx.restore();
  }
  PROF.mark('hud');
  // FEVER overlay — golden rush
  if(feverOn && !window.__cleanPlate){
    // the wash is gone — fever is the WRITING, the arena stays true
    ctx.save(); ctx.font="800 26px 'Cinzel',serif"; ctx.textAlign='center';
    ctx.fillStyle='#ffd36b'; ctx.shadowColor='#ffb020'; ctx.shadowBlur=18;
    ctx.fillText('⚡ FEVER '+feverT.toFixed(1)+'s ⚡', VW/2, 46+Math.sin(gt*12)*2);
    ctx.restore();
  }
  // XP / RAGE — gilded gothic gauge, smooth-lerped
  if(state==='playing' && !window.__cleanPlate){ // I1: the launch kit's clean plate lifts the canvas gauge (and the FEVER line above)
    const feeding=P.ovT>0; // J1: THE FEED — the gauge swells while it eats
    let xw=feeding?Math.min(440,VW*0.56):Math.min(340,VW*0.44), xx=VW/2-xw/2, xy=VH-46; const bh=feeding?20:14;
    { const hr=_b4HpRect(); // B4: never under the blood bar — slide right of it, or (phones) ride just above it
      if(hr && xx<hr.r+14 && hr.t<VH-20){ const room=VW-(hr.r+14)-96;
        if(room>=170){ xx=hr.r+14; xw=Math.min(xw,room); }
        else { xx=hr.l+22; xw=Math.max(120,Math.min(xw,hr.r-hr.l-22)); xy=Math.min(xy,hr.t-12-bh); } } }
    const rage=P.ovT>0;
    const target=rage?Math.max(0,P.ovT)/100:Math.min(1,P.xp/P.xpNext);
    const key=rage?'_ovDisp':'_xpDisp';
    if(P[key]===undefined) P[key]=target;
    P[key]+=(target-P[key])*0.16;
    if(rage) P._xpDisp=1; else P._ovDisp=0;
    const f=Math.max(0,Math.min(1,P[key]));
    ctx.save();
    a2GaugeFrame(xx,xy,xw,bh); // A2: the gauge sits in a cast-brass frame (ui.js)
    ctx.fillStyle='rgba(232,182,76,0.2)';
    for(let ti=1;ti<10;ti++) ctx.fillRect(xx+xw*ti/10-0.5,xy+2,1,bh-4);
    { const mode=rage?(P.ovT<25?'l':('t'+(P.ovTier||0))):'n';
      const gk='xpb'+mode+'|'+xx+'|'+xw; let g9=_lgCache[gk];
      if(!g9){ g9=ctx.createLinearGradient(xx,0,xx+xw,0);
        if(mode==='t3'){ g9.addColorStop(0,'#8a5a10'); g9.addColorStop(0.7,'#ffd36b'); g9.addColorStop(1,'#fff2c0'); }
        else if(mode==='t2'){ g9.addColorStop(0,'#3a1060'); g9.addColorStop(1,'#c98bff'); }
        else if(mode==='t1'){ g9.addColorStop(0,'#123a66'); g9.addColorStop(1,'#6db4ff'); }
        else if(mode==='t0'){ g9.addColorStop(0,'#7a3608'); g9.addColorStop(1,'#ff9a3c'); }
        else if(mode==='l'){ g9.addColorStop(0,'#5a0a12'); g9.addColorStop(1,'#ff3344'); }
        else if(mode==='m'){ g9.addColorStop(0,'#7a3608'); g9.addColorStop(1,'#ff9a3c'); }
        else { g9.addColorStop(0,'#5a1420'); g9.addColorStop(1,'#c81e2c'); }
        _lgCache[gk]=g9; }
      ctx.fillStyle=g9; } roundRect(xx,xy,Math.max(2,xw*f),bh,4); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const shx=xx+((gt*70)%(xw+90))-45;
    let sg9=window._stkG; if(!sg9){ sg9=ctx.createLinearGradient(-26,0,26,0); sg9.addColorStop(0,'rgba(255,240,190,0)'); sg9.addColorStop(0.5,'rgba(255,240,190,0.26)'); sg9.addColorStop(1,'rgba(255,240,190,0)'); window._stkG=sg9; }
    ctx.save(); ctx.translate(shx,0); ctx.fillStyle=sg9; roundRect(xx-shx,xy,Math.max(2,xw*f),bh,4); ctx.fill(); ctx.restore();
    ctx.fillStyle='rgba(255,250,220,0.95)'; ctx.fillRect(xx+xw*f-1.5,xy+1,3,bh-2);
    for(let ed=0;ed<2;ed++){ const eo=Math.sin(gt*38+ed*3.1)*4;
      ctx.fillStyle='rgba(255,220,140,'+(0.5+Math.sin(gt*26+ed)*0.3)+')';
      ctx.beginPath(); ctx.arc(xx+xw*f+eo*0.4, xy+bh/2+eo, 1.3,0,6.28); ctx.fill(); }
    ctx.restore();
    if(rage){
      // four jewel sockets ride the top edge: feeding · I · II · ★ FEAST
      const tier=P.ovTier||0, ch=P.ovCharge||0;
      for(let j=0;j<4;j++){ const jx=xx+xw*(0.16+j*0.225), jy=xy-2, lit=(j===0)||tier>=j, c=FEED_COL[j];
        ctx.save(); ctx.translate(jx,jy);
        const pr=(!lit && j===tier+1)?Math.max(0,Math.min(1,(ch-FEED_T[j-1])/(FEED_T[j]-FEED_T[j-1]))):0;
        ctx.fillStyle='#120608'; ctx.strokeStyle='#a07828'; ctx.lineWidth=1.5;
        const r=j===3?8:6.5;
        ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(r,0); ctx.lineTo(0,r); ctx.lineTo(-r,0); ctx.closePath(); ctx.fill(); ctx.stroke();
        if(lit||pr>0){ ctx.globalAlpha=lit?1:0.35+pr*0.4; ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=lit?(10+(j===tier?Math.sin(gt*10)*5:0)):0;
          const rr=(r-2)*(lit?1:pr); ctx.beginPath(); ctx.moveTo(0,-rr); ctx.lineTo(rr,0); ctx.lineTo(0,rr); ctx.lineTo(-rr,0); ctx.closePath(); ctx.fill();
          if(j===3&&lit){ ctx.shadowBlur=0; ctx.fillStyle='#fff2c0'; ctx.font="800 9px serif"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('★',0,0.5); } }
        ctx.restore(); }
      const nxt=tier<3?Math.max(0,FEED_T[tier+1]-ch):0;
      const tc=tier?FEED_COL[tier]:'#ffce8a';
      ctx.font="800 14px 'Cinzel',serif"; ctx.textAlign='center';
      ctx.fillStyle=tc; ctx.shadowColor=tc; ctx.shadowBlur=10;
      const nm=['COLD','WARM ◆','HOT ◆◆','FEAST ★'][tier];
      const tl=tier<3?(nxt.toFixed(1)+'s TO '+['WARM','HOT','FEAST'][tier]):'THE REELS RUN GOLD';
      const sp=(window._padUI?window._padA:window._touchUI?'◈ BET':'SPACE');
      const narrow=VW<560, lx=narrow?xx+xw/2:VW/2, lw=narrow?Math.min(VW-16,xw+40):VW-16;
      const t1=narrow?('✦ '+nm+' · '+(tier<3?tl:'GOLD REELS')+' ✦'):('✦ THE FEED · '+nm+' · '+tl+' · '+sp+' CASHES ✦');
      { let fz=14; while(fz>9 && ctx.measureText(t1).width>lw){ fz--; ctx.font="800 "+fz+"px 'Cinzel',serif"; } }
      ctx.fillText(t1, lx, xy-34);
      ctx.font="700 11px 'Cinzel',serif"; if(narrow) ctx.font="700 9px 'Cinzel',serif"; ctx.fillStyle=P.ovT<30?'#ff7b7b':'#ffce8a'; ctx.shadowColor=P.ovT<30?'#ff3344':'#ff9a3c';
      ctx.fillText(P.ovT<30?'☠ IT STARVES — FEED IT OR CASH IT ☠':(narrow?'FEED IT SOULS · '+sp+' CASHES':'SOULS & COINS FEED IT · STARVE = −25% XP'), lx, xy-18);
      ctx.shadowBlur=0;
    } else {
      ctx.font="700 11px 'Cinzel',serif"; ctx.textAlign='center';
      ctx.fillStyle='rgba(236,208,160,0.9)'; ctx.shadowColor='#000'; ctx.shadowBlur=4;
      ctx.fillText('⚜ LEVEL CHARGE — '+Math.floor(P.xp)+' / '+P.xpNext+' XP'+(pending.length?'  ▸ A SLOT WAITS':''), xx+xw/2, xy-11); ctx.shadowBlur=0;
      if(P.debt>0){ ctx.fillStyle='#ff6b6b'; ctx.shadowColor='#ff6b6b'; ctx.shadowBlur=6;
        ctx.fillText('☠ IN DEBT TO THE HOUSE: '+P.debt+' XP', VW/2, xy+28); ctx.shadowBlur=0; }
      if(f>0.85){
        ctx.shadowColor='#ff5566'; ctx.shadowBlur=8+Math.sin(gt*9)*5;
        ctx.fillStyle='rgba(255,85,102,0.9)'; ctx.fillRect(xx+xw*f-1.5,xy+1,3,bh-2); ctx.shadowBlur=0;
      }
    }
    ctx.restore();
  }
  if(GFX.fps||PROF.on){ ctx.font="700 11px 'Cinzel',serif"; ctx.textAlign='right'; ctx.fillStyle='#bfae8c';
    ctx.globalAlpha=0.85; ctx.fillText(Math.round(1000/Math.max(1,frameAvg))+' FPS', VW-12, 64);
    if(PROF.on){ if(PROF.frames-(PROF._ovF||0)>=30){ PROF._ovF=PROF.frames; const r=PROF.report();
        let wk='',wv=0; for(const k in r.stages) if(r.stages[k]>wv){ wv=r.stages[k]; wk=k; }
        PROF._ovS=r.avgMs+'ms · p95 '+r.p95Ms+' · spikes '+r.spikes25+'/'+r.spikes40+' · '+wk+' '+wv.toFixed(1); }
      if(PROF._ovS) ctx.fillText(PROF._ovS, VW-12, 78); }
    ctx.globalAlpha=1; }
  // house dare counter
  if(state==='playing' && dare && !window.__cleanPlate){
    ctx.font="800 15px 'Cinzel',serif"; ctx.textAlign='center';
    ctx.fillStyle=dare.got>=dare.need?'#8bff9a':'#ffd36b'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=10;
    ctx.fillText('⚔ '+dare.got+' / '+dare.need+' · '+dare.t.toFixed(1)+'s', VW/2, 130); ctx.shadowBlur=0;
  }
  // (the fever charge bar is retired — fever announces itself when it arrives)
  // streak counter
  if(killStreak>=15 && state==='playing' && !window.__cleanPlate){
    const sc=Math.min(46, 20+killStreak*0.12), pu=1+Math.max(0,streakT-1.4)*0.5;
    ctx.save(); ctx.font='800 '+(sc*pu)+"px 'Cinzel',serif"; ctx.textAlign='right';
    ctx.fillStyle=killStreak>=100?'#ff5566':(killStreak>=50?'#ffd36b':'#e8d9c0');
    ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=14;
    ctx.fillText('×'+killStreak, VW-18, 74);
    ctx.shadowBlur=0;
    P._stD=(P._stD===undefined?streakT:P._stD); P._stD+=(streakT-P._stD)*0.35;
    const stf=Math.max(0,Math.min(1,P._stD));
    ctx.fillStyle='rgba(0,0,0,0.5)'; roundRect(VW-118,81,100,5,2.5); ctx.fill();
    ctx.fillStyle=stf>0.4?'#ffd36b':'#ff5566';
    if(stf<0.35){ ctx.shadowColor='#ff5566'; ctx.shadowBlur=8; }
    roundRect(VW-118,81,Math.max(2,100*stf),5,2.5); ctx.fill(); ctx.shadowBlur=0;
    if(killStreak>=27){ ctx.font="700 11px 'Cinzel',serif"; ctx.fillStyle='#8bff9a'; ctx.shadowBlur=8;
      ctx.fillText((window._padUI?window._padA:window._touchUI?'◈ BET':'SPACE')+' — CASH +'+Math.floor(killStreak/4)+' ◈', VW-18, 92); }
    ctx.restore();
  }
  ctx.restore();
}
// C3 — the far court gets SHAPE: silhouettes baked per (type|palette), one drawImage each.
// Blur is legal here — it runs once at bake, never per frame.
const _silC=new Map();
// A1 GILT NOIR — one shape language per type, shared by every silhouette variant:
// the far-court body (gradient + 2px ink outline + top rim + eyes), the near-court INK plate
// (dilated soft near-black that cuts each body out of the floor and the crowd), the WHITE
// hit-flash mask, and a tinted GLOW for elites. All baked once; one drawImage each per frame.
function _silShape(g,T,R,fill,ink,ow){
  g.lineJoin='round'; g.lineCap='round'; g.fillStyle=fill;
  const legs=(arr,w)=>{ g.beginPath(); for(const s9 of arr) { g.moveTo(s9[0],s9[1]); g.lineTo(s9[2],s9[3]); }
    if(ink){ g.strokeStyle=ink; g.lineWidth=w+ow; g.stroke(); } g.strokeStyle=fill; g.lineWidth=w; g.stroke(); };
  const body=(fn)=>{ g.beginPath(); fn(); if(ink){ g.strokeStyle=ink; g.lineWidth=ow; g.stroke(); } g.fill(); };
  if(hrSil(g,T,R,body,legs)) return; // C2
  if(T==='swarm'){ body(()=>{ // winged blot
      g.moveTo(0,-R*0.62); g.quadraticCurveTo(R*0.3,-R*0.5,R*0.32,-R*0.15); g.quadraticCurveTo(R*1.0,-R*0.65,R*1.2,R*0.12); g.quadraticCurveTo(R*0.75,R*0.08,R*0.38,R*0.32);
      g.quadraticCurveTo(R*0.3,R*0.6,0,R*0.6); g.quadraticCurveTo(-R*0.3,R*0.6,-R*0.38,R*0.32); g.quadraticCurveTo(-R*0.75,R*0.08,-R*1.2,R*0.12); g.quadraticCurveTo(-R*1.0,-R*0.65,-R*0.32,-R*0.15); g.quadraticCurveTo(-R*0.3,-R*0.5,0,-R*0.62); });
  } else if(T==='stalker'){ // legged spread
    const L=[]; for(const a of [-2.5,-2.0,-1.1,-0.6, 0.6,1.1,2.0,2.5]) L.push([Math.cos(a)*R*0.5,Math.sin(a)*R*0.3,Math.cos(a)*R*1.25,Math.sin(a)*R*0.75+R*0.15]);
    legs(L,R*0.13); body(()=>{ g.ellipse(0,0,R*0.85,R*0.5,0,0,6.28); });
  } else if(T==='wraith'||T==='hexer'){ body(()=>{ // hooded taper, floating
      g.moveTo(0,-R*0.95); g.quadraticCurveTo(R*0.72,-R*0.2,R*0.5,R*0.7); g.quadraticCurveTo(0,R*0.45,-R*0.5,R*0.7); g.quadraticCurveTo(-R*0.72,-R*0.2,0,-R*0.95); });
  } else if(T==='brute'){ body(()=>{ // hunched ogre mass: humped back, small sunk head, hanging fists
      g.moveTo(-R*0.95,R*0.55); g.quadraticCurveTo(-R*1.05,-R*0.45,-R*0.35,-R*0.6); g.quadraticCurveTo(-R*0.2,-R*0.98,0,-R*0.95); g.quadraticCurveTo(R*0.2,-R*0.98,R*0.35,-R*0.6);
      g.quadraticCurveTo(R*1.05,-R*0.45,R*0.95,R*0.55); g.quadraticCurveTo(0,R*0.95,-R*0.95,R*0.55);
      g.moveTo(-R*0.62,R*0.62); g.arc(-R*0.92,R*0.62,R*0.3,0,6.28); g.moveTo(R*1.22,R*0.62); g.arc(R*0.92,R*0.62,R*0.3,0,6.28); });
  } else if(T==='revenant'){ body(()=>{ // pauldroned block + helm
      g.ellipse(0,0,R*0.62,R*0.82,0,0,6.28); g.moveTo(-R*0.29,-R*0.25); g.arc(-R*0.62,-R*0.25,R*0.33,0,6.28); g.moveTo(R*0.95,-R*0.25); g.arc(R*0.62,-R*0.25,R*0.33,0,6.28); g.moveTo(R*0.36,-R*0.7); g.ellipse(0,-R*0.7,R*0.36,R*0.38,0,0,6.28); });
  } else if(T==='leech'){ // low crawler: segmented slug + feeding tendrils
    legs([[-R*0.15,-R*0.3,-R*0.45,-R*0.95],[0,-R*0.35,0,-R*1.0],[R*0.15,-R*0.3,R*0.45,-R*0.95]],R*0.09);
    body(()=>{ g.ellipse(0,R*0.25,R*1.0,R*0.42,0,0,6.28); g.moveTo(R*0.62,-R*0.02); g.ellipse(0,-R*0.02,R*0.62,R*0.36,0,0,6.28); g.moveTo(R*0.34,-R*0.32); g.ellipse(0,-R*0.32,R*0.34,R*0.26,0,0,6.28); });
  } else if(T==='shooter'||T==='husk'){ // archer + bow crescent
    if(T==='shooter'){ g.beginPath(); g.arc(R*0.55,0,R*0.75,-1.15,1.15); if(ink){ g.strokeStyle=ink; g.lineWidth=R*0.11+ow; g.stroke(); } g.strokeStyle=fill; g.lineWidth=R*0.11; g.stroke(); }
    body(()=>{ g.ellipse(0,R*0.05,R*0.6,R*0.8,0,0,6.28); g.moveTo(R*0.34,-R*0.68); g.arc(0,-R*0.68,R*0.34,0,6.28); });
  } else { body(()=>{ // shambler and kin — hunched shoulders, lolling head
      g.moveTo(-R*0.62,-R*0.35); g.quadraticCurveTo(0,-R*0.75,R*0.62,-R*0.35); g.quadraticCurveTo(R*0.85,R*0.3,R*0.5,R*0.78); g.lineTo(-R*0.5,R*0.78); g.quadraticCurveTo(-R*0.85,R*0.3,-R*0.62,-R*0.35);
      g.moveTo(R*0.48,-R*0.62); g.ellipse(R*0.12,-R*0.62,R*0.36,R*0.32,0,0,6.28); });
  }
}
function silSprite(T,dark,col){
  const key=T+'|'+dark+'|'+col;
  let cv=_silC.get(key);
  if(!cv){
    if(_silC.size>96){ let n=0; for(const k of _silC.keys()){ _silC.delete(k); if(++n>=24) break; } }
    const R=20, S=64; cv=document.createElement('canvas'); cv.width=S; cv.height=S;
    const g=cv.getContext('2d'); g.translate(S/2,S/2);
    // mid value: lit body color on top falling to the type's dark — then a 2px near-black ink line
    const gr=g.createLinearGradient(0,-R,0,R); gr.addColorStop(0,col); gr.addColorStop(0.55,dark); gr.addColorStop(1,dark);
    _silShape(g,T,R,gr,'#050204',5);
    // rim light — the candlelight catches every shoulder in the crowd
    g.globalCompositeOperation='source-atop'; g.strokeStyle='rgba(255,226,190,0.42)'; g.lineWidth=3;
    g.beginPath(); g.arc(0,R*0.2,R*0.95,-2.5,-0.64); g.stroke(); g.globalCompositeOperation='source-over';
    // eyes with a pre-blurred glow (bake-time blur only)
    const ey=(T==='revenant'||T==='shooter'||T==='husk')?-R*0.68:(T==='swarm'?-R*0.2:-R*0.3);
    g.shadowColor=col; g.shadowBlur=6; g.fillStyle=col;
    g.beginPath(); g.arc(-R*0.17,ey,R*0.1,0,6.28); g.arc(R*0.17,ey,R*0.1,0,6.28); g.fill();
    g.shadowBlur=0; g.fillStyle='#fff4e0';
    g.beginPath(); g.arc(-R*0.17,ey,R*0.045,0,6.28); g.arc(R*0.17,ey,R*0.045,0,6.28); g.fill();
    _silC.set(key,cv);
  }
  return cv;
}
// B4 — the far court's sprite with its contact shadow baked under it (same pixels the LOD path drew per body)
function lodSprite(T,dark,col){
  const key='l|'+T+'|'+dark+'|'+col; let cv=_silC.get(key); if(cv) return cv;
  const sp=silSprite(T,dark,col);
  if(_silC.size>96){ let n=0; for(const k of _silC.keys()){ _silC.delete(k); if(++n>=24) break; } }
  cv=document.createElement('canvas'); cv.width=64; cv.height=64; const g=cv.getContext('2d');
  g.fillStyle='rgba(0,0,0,0.32)'; g.beginPath(); g.ellipse(32,32+20*0.72,20*0.78,20*0.26,0,0,6.28); g.fill();
  g.drawImage(sp,0,0); _silC.set(key,cv); return cv;
}
// variants: 'ink' (near-court cut-out plate), 'white' (hit flash), 'glow' (elite/boss aura, tinted)
function silVar(T,mode,col){
  const key='v|'+T+'|'+mode+'|'+(col||'');
  let cv=_silC.get(key); if(cv) return cv;
  if(_silC.size>96){ let n=0; for(const k of _silC.keys()){ _silC.delete(k); if(++n>=24) break; } }
  const R=20, S=64; cv=document.createElement('canvas'); cv.width=S; cv.height=S;
  const g=cv.getContext('2d'); g.translate(S/2,S/2);
  if(mode==='white'){ _silShape(g,T,R,'#ffffff','#ffffff',3); }
  else if(mode==='ink'){ g.shadowColor='rgba(0,0,0,0.9)'; g.shadowBlur=3; _silShape(g,T,R,'rgba(4,1,3,0.88)','rgba(4,1,3,0.88)',7); }
  else { g.shadowColor=col; g.shadowBlur=7; _silShape(g,T,R*0.92,col,col,4); }
  _silC.set(key,cv); return cv;
}
// eye anchors per type (in r units, before the type's own sway) — the glow follows the player
const _EYE={ swarm:[[-0.18,-0.14],[0.18,-0.14]], stalker:[[0.5,-0.22]], wraith:[[-0.1,-0.46],[0.1,-0.46]], hexer:[[0,-0.5]],
  revenant:[[0,-0.68]], brute:[[-0.12,-0.64],[0.12,-0.64]], shooter:[[-0.11,-0.75],[0.11,-0.75]], husk:[[-0.14,-0.71],[0.14,-0.71]], _:[[0.21,-0.66]] };
const _EYEC={ swarm:'255,90,90', stalker:'255,223,90', wraith:'120,170,255', hexer:'201,255,122', revenant:'255,77,77', brute:'255,77,77', shooter:'255,206,90', husk:'255,170,80' };
function drawEnemy(e){
  if(!e.boss && courtDraw(e)) return; // E1 — the regular court is baked and animated (fx.js); lords keep this painter
  const t=gt*4+e.ph, T=e.vt||e.type, r=e.r;
  if(e._lod){ // distant court: one baked, shaped, rim-lit sprite
    if(!(e.flash>0)){ const dw=r*3.2; ctx.drawImage(lodSprite(T,e.dark,e.col),e.x-dw/2,e.y-dw/2,dw,dw); return; } // B4: shadow baked in, no save/translate/path per body
    ctx.save(); ctx.translate(e.x,e.y);
    ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(0,r*0.72,r*0.78,r*0.26,0,0,6.28); ctx.fill();
    if(e.flash>0){ const sq=Math.min(0.16,e.flash*1.4); ctx.scale(1+sq,1-sq); }
    const sp=silSprite(T,e.dark,e.col); const dw=r*3.2;
    ctx.drawImage(sp,-dw/2,-dw/2,dw,dw);
    if(e.flash>0){ ctx.globalAlpha=Math.min(0.95,e.flash*8); ctx.drawImage(silVar(T,'white'),-dw/2,-dw/2,dw,dw); } // A1: true white flash
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(e.x,e.y);
  // contact shadow
  const fly=(T==='wraith'||T==='hexer');
  ctx.fillStyle='rgba(0,0,0,'+(fly?0.24:0.38)+')';
  ctx.beginPath(); ctx.ellipse(0,r*0.72,r*(fly?0.6:0.82),r*0.28,0,0,6.28); ctx.fill();
  if(e.boss){ ctx.save(); ctx.rotate(gt*0.8); ctx.strokeStyle='rgba(201,139,255,'+(0.35+Math.sin(gt*3)*0.15)+')'; ctx.lineWidth=2.5; ctx.setLineDash([9,7]);
    ctx.beginPath(); ctx.arc(0,0,r*1.5,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    if(!qLow&&!GFX.lite){ // C7 — the lair: a counter-ring and a ward of runes breathe around the throne
      ctx.save(); ctx.rotate(-gt*0.5); ctx.strokeStyle='rgba(232,182,76,'+(0.2+Math.sin(gt*3+e.ph)*0.09)+')'; ctx.lineWidth=1.5; ctx.setLineDash([4,10]);
      ctx.beginPath(); ctx.arc(0,0,r*1.85+Math.sin(gt*3)*3,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      if(!window._sigilBk) bakeSigil();
      ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=0.45+Math.sin(gt*3+e.ph)*0.18; ctx.rotate(gt*0.25);
      const rw=r*2.4; ctx.drawImage(window._sigilBk.runes,-rw,-rw,rw*2,rw*2); ctx.restore(); } }
  if((e.elite||e.boss)&&!qLow){ // the halo is a baked glow under the body — no blur riding every fill after it
    const gr9=r*(e.boss?2.1:1.7); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.42;
    ctx.drawImage(glowSprite(e.col,'rgba(0,0,0,0)',48), -gr9, -gr9*0.82, gr9*2, gr9*1.64); ctx.restore(); }
  if(e.flash>0){ const sq=Math.min(0.16,e.flash*1.4); ctx.scale(1+sq,1-sq); }
  { const bs9=Math.min(1,(gt-(e.born||gt-1))/0.22); if(bs9<1){ ctx.scale(bs9,bs9); ctx.globalAlpha=bs9; } }
  // A1 GILT NOIR law 1 — elites wear a violet aura of their own shape; every body gets an ink cut-out plate
  { const dw=r*3.2, ga9=ctx.globalAlpha;
    if((e.elite||e.boss) && !GFX.lite){ const pu=1.18+Math.sin(gt*5+e.ph)*0.05, gw=dw*pu; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga9*0.7;
      ctx.drawImage(silVar(T,'glow',e.boss?'#ff5a78':'#c98bff'),-gw/2,-gw/2-r*0.08,gw,gw); ctx.restore(); }
    const iw=dw*1.1; ctx.drawImage(silVar(T,'ink'),-iw/2,-iw/2-r*0.04,iw,iw); }
  const sway=Math.sin(t)*r*0.12;
  // ranged wind-up: the muzzle glows before the shot lands anywhere near you
  if(e.ranged && e.shootCd<0.35 && e.shootCd>0){ ctx.save(); ctx.globalCompositeOperation='lighter';
    const wu=1-e.shootCd/0.35; ctx.globalAlpha=wu*0.85;
    ctx.drawImage(glowSprite('rgba(255,180,80,0.8)','rgba(255,150,60,0)',10+wu*10), -10-wu*10, -r*0.4-10-wu*10, 20+wu*20, 20+wu*20);
    ctx.restore(); ctx.globalAlpha=1; }
  // top-lit gradient helper (chandelier light from above)
  const bg=(x,y,rx,ry,c1,c2,rot)=>{
    if(qLow){ ctx.fillStyle=c2; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot||0,0,6.28); ctx.fill(); return; }
    ctx.save(); ctx.translate(x,y); ctx.fillStyle=lgrad(ry,c1,c2);
    ctx.beginPath(); ctx.ellipse(0,0,rx,ry,rot||0,0,6.28); ctx.fill(); ctx.restore(); };
  const line=(x1,y1,x2,y2,w,c)=>{ ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); };

  if(HR_VT[T]){ hrDrawBody(e,T,r,sway); } // C2 — the high rollers: baked bodies + live props
  else if(T==='swarm'){
    // BAT-IMP — bone-finger membrane wings, horns, whip tail
    const flap=Math.sin(gt*22+e.ph);
    for(const sd of [-1,1]){
      const wx=sd*r*1.55, wy=-flap*r*0.55;
      ctx.fillStyle=e.dark;
      ctx.beginPath(); ctx.moveTo(sd*r*0.2,-r*0.1);
      ctx.quadraticCurveTo(sd*r*0.9,-r*0.75+wy, wx, wy+r*0.15);
      ctx.quadraticCurveTo(sd*r*1.1, r*0.25+wy*0.4, sd*r*0.75, r*0.28);
      ctx.quadraticCurveTo(sd*r*0.45, r*0.05, sd*r*0.2, r*0.22); ctx.closePath(); ctx.fill();
      if(!window._dense){ ctx.strokeStyle='rgba(20,10,14,0.8)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sd*r*0.25,0); ctx.quadraticCurveTo(sd*r*0.85,wy*0.6-r*0.2, wx*0.92, wy+r*0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sd*r*0.25,r*0.1); ctx.quadraticCurveTo(sd*r*0.8,wy*0.3, sd*r*1.05, wy*0.5+r*0.25); ctx.stroke(); }
    }
    const tw=Math.sin(gt*9+e.ph);
    ctx.strokeStyle=e.dark; ctx.lineWidth=1.6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,r*0.5); ctx.quadraticCurveTo(-tw*r*0.6, r*1.0, tw*r*0.5, r*1.35); ctx.stroke();
    bg(0,0,r*0.6,r*0.72,e.col,e.dark);
    ctx.fillStyle=e.dark;
    ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.5); ctx.lineTo(-r*0.42,-r*0.95); ctx.lineTo(-r*0.14,-r*0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r*0.3,-r*0.5); ctx.lineTo(r*0.42,-r*0.95); ctx.lineTo(r*0.14,-r*0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffd0d0'; ctx.beginPath(); ctx.moveTo(-r*0.22,r*0.18); ctx.lineTo(-r*0.1,r*0.38); ctx.lineTo(0,r*0.18); ctx.lineTo(r*0.1,r*0.38); ctx.lineTo(r*0.22,r*0.18); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff5a5a';
    ctx.beginPath(); ctx.arc(-r*0.18,-r*0.14,r*0.12,0,6.28); ctx.arc(r*0.18,-r*0.14,r*0.12,0,6.28); ctx.fill(); ctx.shadowBlur=0;
  } else if(T==='stalker'){
    // SPIDER-BLADE HORROR — jointed legs, four eyes, drool
    ctx.strokeStyle='rgba(180,60,90,0.28)'; ctx.lineWidth=2;
    for(let i=1;i<=2;i++){ ctx.beginPath(); ctx.moveTo(-e.kx*8*i,-e.ky*8*i); ctx.lineTo(-e.kx*8*i-e.kx*10,-e.ky*8*i-e.ky*10); ctx.stroke(); }
    for(const sd of [-1,1]) for(let li=0;li<2;li++){
      const ph2=t*2.6+li*2.2+ (sd>0?0:3.14);
      const hipX=sd*r*0.42, hipY=-r*0.05+li*r*0.22;
      const kneeX=sd*(r*0.95+Math.sin(ph2)*r*0.14), kneeY=-r*0.42+li*r*0.3+Math.cos(ph2)*r*0.08;
      const footX=sd*(r*1.3+Math.sin(ph2)*r*0.24), footY=r*0.55+Math.abs(Math.cos(ph2))*r*0.12;
      line(hipX,hipY,kneeX,kneeY,2.6,e.dark);
      line(kneeX,kneeY,footX,footY,1.8,e.dark);
      ctx.fillStyle='#d8dce6'; ctx.beginPath(); ctx.moveTo(footX,footY); ctx.lineTo(footX-sd*3,footY-6); ctx.lineTo(footX-sd*1,footY-1); ctx.closePath(); ctx.fill();
    }
    bg(0,r*0.08,r*1.0,r*0.46,e.col,e.dark);
    bg(sway*0.5,-r*0.18,r*0.55,r*0.4,e.col,e.dark);
    ctx.fillStyle=e.dark; ctx.beginPath(); ctx.ellipse(sway*0.5+r*0.34,-r*0.2,r*0.34,r*0.28,0.3,0,6.28); ctx.fill();
    ctx.fillStyle='#ffdf5a';
    for(const [ex,ey,er] of [[0.44,-0.3,0.085],[0.6,-0.24,0.07],[0.42,-0.12,0.06],[0.56,-0.1,0.05]]){
      ctx.beginPath(); ctx.arc(sway*0.5+r*ex,r*ey,r*er,0,6.28); ctx.fill(); }
    ctx.shadowBlur=0;
    if(!window._dense){ const dr2=(gt*1.3+e.ph)%1;
    ctx.fillStyle='rgba(200,230,200,0.5)'; ctx.beginPath(); ctx.arc(sway*0.5+r*0.5, -r*0.02+dr2*r*0.5, 1.4*(1-dr2),0,6.28); ctx.fill(); }
  } else if(T==='wraith'){
    // BANSHEE — layered spectral shroud, faint skull, reaching claws
    const hov=Math.sin(t*0.8)*r*0.12;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    { const hr9=r*1.35; ctx.drawImage(glowSprite('rgba(150,140,220,0.20)','rgba(120,100,200,0)',hr9), -hr9, hov-hr9, hr9*2, hr9*2); } ctx.restore();
    ctx.globalAlpha=0.75+Math.sin(t*1.7)*0.1;
    for(let L2=0;L2<2;L2++){
      const sc2=1-L2*0.22, al2=L2?0.55:1, ho2=hov+L2*r*0.08;
      ctx.globalAlpha*= (L2?0.6:1);
      ctx.beginPath(); ctx.moveTo(0,ho2-r*0.95*sc2);
      const wob=Math.sin(gt*3+e.ph+L2)*r*0.08;
      ctx.quadraticCurveTo(r*0.85*sc2,ho2-r*0.25, (r*0.55+wob)*sc2,ho2+r*0.45);
      ctx.quadraticCurveTo(r*0.36*sc2,ho2+r*0.9, r*0.14*sc2,ho2+r*0.5);
      ctx.quadraticCurveTo(0,ho2+r*0.95, -r*0.14*sc2,ho2+r*0.5);
      ctx.quadraticCurveTo(-r*0.36*sc2,ho2+r*0.9, (-r*0.55+wob)*sc2,ho2+r*0.45);
      ctx.quadraticCurveTo(-r*0.85*sc2,ho2-r*0.25, 0,ho2-r*0.95*sc2);
      ctx.save(); ctx.translate(0,ho2-r*0.05); ctx.fillStyle=lgrad(r*0.95,e.col,'rgba(20,12,30,0)'); ctx.fill(); ctx.restore();
      ctx.globalAlpha=0.75;
    }
    ctx.globalAlpha=0.35; ctx.fillStyle='#cfd8ec';
    ctx.beginPath(); ctx.ellipse(0,hov-r*0.42,r*0.26,r*0.3,0,0,6.28); ctx.fill();
    ctx.globalAlpha=0.9;
    ctx.fillStyle='#0c0f1c';
    ctx.beginPath(); ctx.ellipse(-r*0.1,hov-r*0.46,r*0.075,r*0.1,0,0,6.28); ctx.ellipse(r*0.1,hov-r*0.46,r*0.075,r*0.1,0,0,6.28); ctx.fill();
    ctx.fillStyle='#dff3ff';
    ctx.beginPath(); ctx.arc(-r*0.1,hov-r*0.46,r*0.045,0,6.28); ctx.arc(r*0.1,hov-r*0.46,r*0.045,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    const rch=Math.sin(gt*2.2+e.ph)*r*0.1;
    ctx.strokeStyle='rgba(190,200,230,0.55)'; ctx.lineWidth=1.8; ctx.lineCap='round';
    for(const sd of [-1,1]){
      const hx=sd*r*0.55, hy=hov-r*0.05+rch*sd;
      ctx.beginPath(); ctx.moveTo(sd*r*0.25,hov-r*0.15); ctx.quadraticCurveTo(sd*r*0.45,hov-r*0.25,hx,hy); ctx.stroke();
      for(let f3=0;f3<3;f3++){ ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx+sd*r*0.14, hy-r*0.1+f3*r*0.09); ctx.stroke(); }
    }
    ctx.globalAlpha=1;
  } else if(T==='hexer'){
    // WARLOCK — gold-trimmed hood, rune eyes, charging orb, casting circle
    const hov=Math.sin(t*0.9)*r*0.1;
    const ch=e.shootCd!==undefined?Math.max(0,Math.min(1,1-e.shootCd/2.4)):(Math.sin(t)+1)/2;
    ctx.save(); ctx.rotate(gt*1.1); ctx.strokeStyle='rgba(201,255,122,0.22)'; ctx.lineWidth=1.4; ctx.setLineDash([5,6]);
    ctx.beginPath(); ctx.arc(0,0,r*1.15,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    ctx.beginPath(); ctx.moveTo(0,hov-r*1.05);
    ctx.quadraticCurveTo(r*0.92,hov-r*0.1, r*0.6,hov+r*0.85);
    ctx.quadraticCurveTo(0,hov+r*0.6, -r*0.6,hov+r*0.85);
    ctx.quadraticCurveTo(-r*0.92,hov-r*0.1, 0,hov-r*1.05);
    ctx.save(); ctx.translate(0,hov-r*0.1); ctx.fillStyle=lgrad(r*0.95,e.col,e.dark); ctx.fill(); ctx.restore();
    ctx.strokeStyle='rgba(232,182,76,0.55)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(-r*0.34,hov-r*0.62); ctx.quadraticCurveTo(0,hov-r*0.42,r*0.34,hov-r*0.62); ctx.stroke();
    ctx.fillStyle='#050308'; ctx.beginPath(); ctx.ellipse(0,hov-r*0.42,r*0.32,r*0.37,0,0,6.28); ctx.fill();
    ctx.fillStyle='#c9ff7a';
    for(let ri2=0;ri2<3;ri2++){ const rb=0.5+Math.sin(gt*4+ri2*2.1)*0.4;
      ctx.globalAlpha=rb; ctx.fillRect(-r*0.05, hov-r*0.6+ri2*r*0.15, r*0.1, r*0.07); }
    ctx.globalAlpha=1; ctx.shadowBlur=0;
    for(const sd of [-1,1]){
      ctx.strokeStyle=e.dark; ctx.lineWidth=3.4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(sd*r*0.4,hov+r*0.05); ctx.quadraticCurveTo(sd*r*0.7,hov-r*0.15, sd*r*0.5,hov-r*0.42+ch*r*0.1); ctx.stroke();
    }
    const orbY=hov-r*0.75-ch*r*0.25;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    { const or9=r*(0.2+ch*0.35); ctx.globalAlpha=Math.min(1,0.5+ch*0.5);
      ctx.drawImage(glowSprite('rgba(220,255,160,1)','rgba(160,255,100,0)',or9), -or9, orbY-or9, or9*2, or9*2); } ctx.restore();
    ctx.fillStyle='#eaffc8'; ctx.beginPath(); ctx.arc(0,orbY,r*0.09+ch*r*0.05,0,6.28); ctx.fill();
    for(let i=0;i<3;i++){ const a=gt*2.2+e.ph+i*2.094; ctx.fillStyle='rgba(201,255,122,0.85)';
      ctx.fillRect(Math.cos(a)*r*1.05-1.6, hov+Math.sin(a)*r*0.5-1.6, 3.2,3.2); }
  } else if(T==='revenant'){
    // DREAD KNIGHT — plumed helm, pauldrons, tower shield, specular plate
    const stp=Math.sin(t*1.4)*r*0.05;
    ctx.fillStyle='rgba(20,6,8,0.85)';
    ctx.beginPath(); ctx.moveTo(-r*0.2,-r*0.5); ctx.quadraticCurveTo(-r*0.9,-r*0.1+Math.sin(gt*2+e.ph)*r*0.08,-r*0.55,r*0.85); ctx.lineTo(-r*0.1,r*0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle=lgrad(r,e.col,'#0a0304',0.55,e.dark); ctx.beginPath(); ctx.ellipse(sway*0.3,stp,r*0.72,r*0.86,0,0,6.28); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const spec=Math.sin(gt*1.2+e.ph)*r*0.3;
    ctx.strokeStyle='rgba(200,190,210,0.16)'; ctx.lineWidth=r*0.16;
    ctx.beginPath(); ctx.arc(sway*0.3,stp+spec,r*0.6,-2.4,-0.7); ctx.stroke(); ctx.restore();
    ctx.strokeStyle='rgba(232,182,76,0.5)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(sway*0.3,stp-r*0.4); ctx.lineTo(sway*0.3,stp+r*0.6);
    ctx.moveTo(sway*0.3-r*0.34,stp+r*0.05); ctx.lineTo(sway*0.3+r*0.34,stp+r*0.05); ctx.stroke();
    for(const sd of [-1,1]){
      const px2=sd*r*0.62, py2=-r*0.42+stp;
      bg(px2,py2,r*0.36,r*0.28,e.col,e.dark,sd*0.35);
      ctx.fillStyle='#caa64e';
      for(let rv2=0;rv2<3;rv2++){ ctx.beginPath(); ctx.arc(px2+sd*(rv2-1)*r*0.14, py2-r*0.06, 1.4,0,6.28); ctx.fill(); }
    }
    const shx=-r*0.95;
    ctx.fillStyle='#1c1214';
    ctx.beginPath(); ctx.moveTo(shx,-r*0.55); ctx.lineTo(shx+r*0.42,-r*0.4); ctx.lineTo(shx+r*0.42,r*0.5); ctx.lineTo(shx,r*0.75); ctx.lineTo(shx-r*0.18,r*0.3); ctx.lineTo(shx-r*0.18,-r*0.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(232,182,76,0.6)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(shx+r*0.1,-r*0.3); ctx.lineTo(shx+r*0.1,r*0.4); ctx.moveTo(shx-r*0.1,0); ctx.lineTo(shx+r*0.3,0); ctx.stroke();
    ctx.fillStyle='#0a0508';
    ctx.beginPath(); ctx.ellipse(sway*0.3,stp-r*0.68,r*0.36,r*0.4,0,0,6.28); ctx.fill();
    ctx.fillStyle='#c8102e';
    ctx.beginPath(); ctx.moveTo(sway*0.3,stp-r*1.05); ctx.quadraticCurveTo(sway*0.3+r*0.3,stp-r*1.2, sway*0.3+r*0.24,stp-r*0.75); ctx.quadraticCurveTo(sway*0.3+r*0.1,stp-r*0.9, sway*0.3,stp-r*1.05); ctx.fill();
    ctx.fillStyle='#ff4d4d';
    ctx.fillRect(sway*0.3-r*0.24,stp-r*0.72,r*0.48,r*0.085); ctx.shadowBlur=0;
  } else if(T==='brute'){
    // CHAINED OGRE — belly, chest chain, manacles, tusks
    const heave=Math.sin(t*1.3)*r*0.07;
    bg(0,heave+r*0.05,r*1.02,r*0.9,e.col,e.dark);
    bg(sway*0.3,heave+r*0.25,r*0.62,r*0.44,e.col,'#00000000');
    ctx.strokeStyle='#3a3440'; ctx.lineWidth=r*0.11;
    ctx.beginPath(); ctx.moveTo(-r*0.8,heave-r*0.35); ctx.quadraticCurveTo(0,heave+r*0.35, r*0.85,heave-r*0.15); ctx.stroke();
    ctx.fillStyle='#6a6474';
    for(let li2=0;li2<5;li2++){ const lf=li2/4; const lx=-r*0.8+(r*1.65)*lf, ly=heave-r*0.35+Math.sin(lf*3.14)*r*0.6*0.55;
      ctx.beginPath(); ctx.arc(lx,ly,r*0.06,0,6.28); ctx.fill(); }
    for(const sd of [-1,1]){
      const fx3=sd*r*0.95, fy3=heave+r*0.35-sd*Math.sin(t*1.6)*r*0.1;
      bg(fx3,fy3,r*0.42,r*0.4,e.col,e.dark);
      ctx.fillStyle=e.dark;
      for(let k4=0;k4<3;k4++){ ctx.beginPath(); ctx.arc(fx3+sd*r*0.1*(k4-1), fy3-r*0.3, r*0.09,0,6.28); ctx.fill(); }
      ctx.strokeStyle='#6a6474'; ctx.lineWidth=r*0.08;
      ctx.beginPath(); ctx.arc(fx3,fy3,r*0.46,0.4,2.2); ctx.stroke();
      const dgl=Math.sin(gt*4+sd)*r*0.08;
      ctx.lineWidth=r*0.05;
      ctx.beginPath(); ctx.moveTo(fx3,fy3+r*0.42); ctx.lineTo(fx3+dgl,fy3+r*0.7); ctx.stroke();
    }
    ctx.strokeStyle='rgba(255,140,140,0.35)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(-r*0.3,heave-r*0.5); ctx.lineTo(-r*0.05,heave-r*0.1); ctx.moveTo(r*0.35,heave-r*0.45); ctx.lineTo(r*0.1,heave); ctx.stroke();
    ctx.fillStyle=e.dark; ctx.beginPath(); ctx.ellipse(sway*0.4,heave-r*0.6,r*0.32,r*0.26,0,0,6.28); ctx.fill();
    ctx.fillStyle='#e8e0d0';
    ctx.beginPath(); ctx.moveTo(sway*0.4-r*0.18,heave-r*0.48); ctx.lineTo(sway*0.4-r*0.24,heave-r*0.66); ctx.lineTo(sway*0.4-r*0.1,heave-r*0.52); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sway*0.4+r*0.18,heave-r*0.48); ctx.lineTo(sway*0.4+r*0.24,heave-r*0.66); ctx.lineTo(sway*0.4+r*0.1,heave-r*0.52); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff4d4d';
    ctx.beginPath(); ctx.arc(sway*0.4-r*0.12,heave-r*0.64,r*0.075,0,6.28); ctx.arc(sway*0.4+r*0.12,heave-r*0.64,r*0.075,0,6.28); ctx.fill(); ctx.shadowBlur=0;
  } else if(T==='shooter'){
    // SKELETAL ARCHER — skull, quiver, recurve bone bow, glowing arrow
    const aa=Math.atan2(P.y-e.y,P.x-e.x);
    ctx.fillStyle=lgrad(r,e.dark,'#120b04');
    ctx.beginPath(); ctx.moveTo(0,-r*0.85); ctx.quadraticCurveTo(r*0.72,0,r*0.46,r*0.82);
    ctx.lineTo(r*0.28,r*0.66); ctx.lineTo(r*0.1,r*0.84); ctx.lineTo(-r*0.1,r*0.62); ctx.lineTo(-r*0.28,r*0.84); ctx.lineTo(-r*0.46,r*0.68);
    ctx.quadraticCurveTo(-r*0.72,0,0,-r*0.85); ctx.fill();
    bg(0,0,r*0.4,r*0.55,e.col,e.dark);
    ctx.save(); ctx.rotate(aa-2.4); ctx.strokeStyle='#4a3616'; ctx.lineWidth=r*0.14;
    ctx.beginPath(); ctx.moveTo(r*0.5,-r*0.3); ctx.lineTo(r*0.85,r*0.15); ctx.stroke();
    ctx.strokeStyle='#e6dccb'; ctx.lineWidth=1.4;
    for(let q2=0;q2<3;q2++){ ctx.beginPath(); ctx.moveTo(r*(0.55+q2*0.08),-r*(0.42+q2*0.03)); ctx.lineTo(r*(0.62+q2*0.08),-r*(0.3+q2*0.03)); ctx.stroke(); }
    ctx.restore();
    const dr3=(Math.sin(t*1.5)+1)/2;
    ctx.save(); ctx.rotate(aa);
    ctx.strokeStyle='#e6dccb'; ctx.lineWidth=2.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(r*0.55+Math.cos(-1.15)*r*0.52, Math.sin(-1.15)*r*0.52);
    ctx.quadraticCurveTo(r*0.95,0, r*0.55+Math.cos(1.15)*r*0.52, Math.sin(1.15)*r*0.52); ctx.stroke();
    ctx.strokeStyle='rgba(230,220,203,0.6)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(r*0.55+Math.cos(-1.15)*r*0.52,Math.sin(-1.15)*r*0.52); ctx.lineTo(r*0.55-dr3*r*0.32,0); ctx.lineTo(r*0.55+Math.cos(1.15)*r*0.52,Math.sin(1.15)*r*0.52); ctx.stroke();
    line(r*0.55-dr3*r*0.32,0, r*1.05,0, 1.6,'#cdbfa5');
    ctx.fillStyle='#ffce5a';
    ctx.beginPath(); ctx.moveTo(r*1.18,0); ctx.lineTo(r*1.0,-r*0.07); ctx.lineTo(r*1.0,r*0.07); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
    ctx.fillStyle='#e6dccb'; ctx.beginPath(); ctx.arc(0,-r*0.72,r*0.3,0,6.28); ctx.fill();
    ctx.fillStyle='#cdbfa5'; ctx.beginPath(); ctx.ellipse(0,-r*0.56,r*0.18,r*0.09,0,0,6.28); ctx.fill();
    ctx.fillStyle='#0a0508';
    ctx.beginPath(); ctx.ellipse(-r*0.11,-r*0.75,r*0.075,r*0.09,0,0,6.28); ctx.ellipse(r*0.11,-r*0.75,r*0.075,r*0.09,0,0,6.28); ctx.fill();
    ctx.fillStyle='#ffce5a'; ctx.beginPath(); ctx.arc(-r*0.11,-r*0.75,r*0.03,0,6.28); ctx.arc(r*0.11,-r*0.75,r*0.03,0,6.28); ctx.fill();
  } else if(T==='husk'){
    // EMBER GOLEM — charcoal shell, pulsing molten fissures, rising ash
    const core=0.5+Math.sin(t*2.2)*0.3;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    { const gr9=r*1.2; ctx.globalAlpha=Math.min(1,core*0.2);
      ctx.drawImage(glowSprite('rgba(255,120,40,1)','rgba(255,90,20,0)',gr9), -gr9, -gr9, gr9*2, gr9*2); } ctx.restore();
    bg(0,0,r*0.85,r,e.dark,'#0a0604');
    ctx.fillStyle='rgba(255,140,60,'+core+')';
    ctx.beginPath(); ctx.ellipse(0,-r*0.02,r*0.3,r*0.42,0,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    bg(sway,-r*0.2,r*0.58,r*0.68,e.col,e.dark);
    ctx.strokeStyle='rgba(255,150,70,'+core+')'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(-r*0.28,-r*0.6); ctx.lineTo(-r*0.06,-r*0.15); ctx.lineTo(-r*0.32,r*0.3);
    ctx.moveTo(r*0.2,-r*0.55); ctx.lineTo(r*0.06,0); ctx.lineTo(r*0.3,r*0.4);
    ctx.moveTo(-r*0.05,r*0.15); ctx.lineTo(r*0.12,r*0.55); ctx.stroke(); ctx.shadowBlur=0;
    if(Math.random()<0.15){ parts.push({x:e.x+rnd(-r*0.4,r*0.4),y:e.y-r*0.3,vx:rnd(-6,6),vy:-rnd(20,44),life:rnd(.3,.6),col:'#ff9a4c',r:rnd(1,2)}); }
    ctx.fillStyle=e.dark; ctx.beginPath(); ctx.arc(sway,-r*0.68,r*0.36,0,6.28); ctx.fill();
    ctx.strokeStyle='rgba(255,150,70,'+core+')'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(sway-r*0.1,-r*0.95); ctx.lineTo(sway,-r*0.7); ctx.stroke();
    ctx.fillStyle='rgba(255,170,80,'+(0.5+core*0.5)+')';
    ctx.fillRect(sway-r*0.22,-r*0.74,r*0.16,r*0.06); ctx.fillRect(sway+r*0.06,-r*0.74,r*0.16,r*0.06); ctx.shadowBlur=0;
  } else {
    // SHAMBLER / ELITE / GILDED / LEECH — rotting gambler corpse (base), palette from CFG
    const lur=Math.sin(t*0.9)*r*0.15, rock=Math.sin(t*0.9)*0.06;
    ctx.save(); ctx.rotate(rock);
    ctx.fillStyle=lgrad(r,e.col,e.dark);
    ctx.beginPath(); ctx.moveTo(-r*0.62,-r*0.35);
    ctx.quadraticCurveTo(0,-r*0.75, r*0.62,-r*0.35);
    ctx.quadraticCurveTo(r*0.8,r*0.3, r*0.5,r*0.7);
    ctx.lineTo(r*0.3,r*0.55); ctx.lineTo(r*0.12,r*0.78); ctx.lineTo(-r*0.08,r*0.55); ctx.lineTo(-r*0.26,r*0.78); ctx.lineTo(-r*0.5,r*0.6);
    ctx.quadraticCurveTo(-r*0.8,r*0.3, -r*0.62,-r*0.35); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(r*0.12,r*0.05,r*0.16,r*0.22,0.3,0,6.28); ctx.fill();
    ctx.strokeStyle='rgba(10,6,8,0.6)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.2); ctx.lineTo(-r*0.1,-r*0.05); ctx.moveTo(-r*0.22,-r*0.02); ctx.lineTo(-r*0.02,r*0.1); ctx.stroke();
    ctx.strokeStyle=e.dark; ctx.lineWidth=r*0.17; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-r*0.48,-r*0.15); ctx.quadraticCurveTo(-r*0.9,r*0.25,-r*0.72+lur,r*0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.48,-r*0.15); ctx.quadraticCurveTo(r*0.85,r*0.2,r*0.66-lur,r*0.72); ctx.stroke();
    ctx.fillStyle='#d8ccb8';
    for(const sd of [-1,1]){ const kx2=sd*(r*0.7-sd*lur*0.5), ky2=r*0.78;
      for(let k5=0;k5<3;k5++){ ctx.beginPath(); ctx.arc(kx2+sd*(k5-1)*r*0.08, ky2, r*0.05,0,6.28); ctx.fill(); } }
    const hx2=sway+r*0.08, hy2=-r*0.62, tilt=0.22+Math.sin(t*0.9)*0.06;
    ctx.save(); ctx.translate(hx2,hy2); ctx.rotate(tilt);
    ctx.fillStyle=e.dark; ctx.beginPath(); ctx.ellipse(0,0,r*0.36,r*0.32,0,0,6.28); ctx.fill();
    ctx.fillStyle=e.dark; ctx.beginPath(); ctx.ellipse(r*0.06,r*0.26,r*0.2,r*0.11,0.2,0,6.28); ctx.fill();
    ctx.fillStyle='#0a0406'; ctx.beginPath(); ctx.ellipse(r*0.02,r*0.16,r*0.14,r*0.07,0.1,0,6.28); ctx.fill();
    ctx.fillStyle='#1a0e12'; ctx.beginPath(); ctx.ellipse(-r*0.13,-r*0.04,r*0.085,r*0.1,0,0,6.28); ctx.fill();
    ctx.fillStyle=e.elite?'#fff0aa':'#ff4d4d'; if(!qLow&&!GFX.lite){ ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=7; }
    ctx.beginPath(); ctx.arc(r*0.13,-r*0.04,r*0.09,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
    if(e.type==='gilded'){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const gl3=((gt*1.6+e.ph)%2)-1;
      ctx.strokeStyle='rgba(255,240,190,0.5)'; ctx.lineWidth=r*0.2;
      ctx.beginPath(); ctx.moveTo(gl3*r-r*0.4,-r*0.8); ctx.lineTo(gl3*r+r*0.1,r*0.8); ctx.stroke();
      ctx.restore();
      const tw2=Math.sin(gt*8+e.ph);
      if(tw2>0.7){ ctx.fillStyle='#fff2c0'; ctx.fillRect(-r*0.5,-r*0.3,3,0.8); ctx.fillRect(-r*0.5+1.1,-r*0.3-1.1,0.8,3); }
    }
    if(e.type==='leech'){
      const pl3=0.5+Math.sin(gt*5+e.ph)*0.4;
      ctx.fillStyle='rgba(120,255,150,'+pl3+')';
      ctx.beginPath(); ctx.ellipse(0,r*0.1,r*0.16,r*0.2,0,0,6.28); ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(120,220,140,0.6)'; ctx.lineWidth=1.3;
      for(let tn=0;tn<3;tn++){ const ta2=1.2+tn*0.35+Math.sin(gt*6+tn)*0.12;
        ctx.beginPath(); ctx.moveTo(0,-r*0.4); ctx.quadraticCurveTo(Math.cos(ta2)*r*0.4,-r*0.7, Math.cos(ta2)*r*0.55,-r*0.95); ctx.stroke(); }
    }
    ctx.restore();
  }
  // ——— ELITE ROYALTY — mantle, scepter, drifting gold motes ———
  if(e.elite && !e.boss){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let m5=0;m5<3;m5++){ const ma=gt*1.6+e.ph+m5*2.09;
      ctx.fillStyle='rgba(255,220,120,'+(0.4+Math.sin(gt*5+m5)*0.3)+')';
      ctx.beginPath(); ctx.arc(Math.cos(ma)*r*1.05, -r*0.2+Math.sin(ma)*r*0.5, 1.8,0,6.28); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle='rgba(232,182,76,0.85)'; ctx.lineWidth=r*0.1; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(0,-r*0.32,r*0.52,3.5,5.9); ctx.stroke();
    ctx.strokeStyle='#caa64e'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(r*0.62,r*0.5); ctx.lineTo(r*0.85,-r*0.55); ctx.stroke();
    ctx.fillStyle='#ffd36b';
    ctx.beginPath(); ctx.arc(r*0.85,-r*0.6,r*0.1,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    if(e.affix) hrDrawAffix(e,r); // C2
  }
  // ——— BOSS SIGNATURES — each lord of the House carries his office ———
  if(e.boss){
    if(e.bossKind==='pitboss'){
      ctx.fillStyle='#ff7a2c';
      ctx.beginPath(); ctx.arc(sway*0.4+r*0.34,-r*0.62,r*0.05,0,6.28); ctx.fill(); ctx.shadowBlur=0;
      if(Math.random()<0.3) parts.push({x:e.x+r*0.34,y:e.y-r*0.74,vx:rnd(-4,4),vy:-rnd(14,26),life:rnd(.4,.8),col:'#8a8a92',r:rnd(1.5,2.6)});
      ctx.fillStyle='#ffd36b';
      for(const sd of [-1,1]) ctx.fillRect(sd*r*0.95-2.4, r*0.04, 4.8,3.2);
    } else if(e.bossKind==='collector'){
      ctx.strokeStyle='#6a6474'; ctx.lineWidth=2; ctx.lineCap='round';
      for(const sd of [-1,1]){ const dg2=Math.sin(gt*3+sd)*r*0.08;
        ctx.beginPath(); ctx.moveTo(sd*r*0.5,-r*0.1); ctx.quadraticCurveTo(sd*r*0.62,r*0.3, sd*r*0.55+dg2,r*0.72); ctx.stroke();
        ctx.fillStyle='#8a8494';
        for(let l5=0;l5<3;l5++){ ctx.beginPath(); ctx.arc(sd*r*(0.53+l5*0.015), r*(0.06+l5*0.23), 1.7,0,6.28); ctx.fill(); } }
    } else if(e.bossKind==='housegod'){
      // THE HOUSE — void-bodied, gold-eyed, a reaper's scythe orbiting slow
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.drawImage(glowSprite('rgba(60,20,80,0.5)','rgba(10,4,16,0)',Math.ceil(r*2)),-r*2,-r*2.2,r*4,r*4);
      for(let s9=0;s9<5;s9++){ const sy9=-((gt*26+s9*23)%(r*2.4)), sa9=1-Math.abs(sy9+r*1.2)/(r*1.2);
        ctx.globalAlpha=sa9*0.35; ctx.fillStyle='#170a20';
        ctx.beginPath(); ctx.arc((s9-2)*r*0.3+Math.sin(gt*1.8+s9)*6, sy9-r*0.4, r*(0.16+sa9*0.14), 0, 6.28); ctx.fill(); }
      ctx.globalAlpha=1; ctx.restore();
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(const sd9 of [-1,1]){ ctx.fillStyle='#ffd36b';
        ctx.beginPath(); ctx.arc(sd9*r*0.22,-r*0.5, r*0.07, 0, 6.28); ctx.fill();
        ctx.drawImage(glowSprite('rgba(255,211,107,0.7)','rgba(255,211,107,0)',10), sd9*r*0.22-10, -r*0.5-10, 20, 20); }
      ctx.restore();
      { const sca=gt*1.4; ctx.save(); ctx.rotate(sca);
        ctx.strokeStyle='#241a30'; ctx.lineWidth=3.4;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r*1.9,0); ctx.stroke();
        ctx.strokeStyle='rgba(232,182,76,0.9)'; ctx.lineWidth=2.6;
        ctx.beginPath(); ctx.arc(r*1.9,-r*0.42,r*0.62,0.5,2.3); ctx.stroke();
        ctx.strokeStyle='rgba(220,225,240,0.5)'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.arc(r*1.9,-r*0.42,r*0.56,0.6,2.2); ctx.stroke();
        ctx.restore(); }
    } else if(e.bossKind==='thehouse'){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(let f5=0;f5<5;f5++){ const fx5=(f5-2)*r*0.16, fh=r*(0.18+Math.abs(Math.sin(gt*6+f5*1.3))*0.22);
        ctx.beginPath(); ctx.moveTo(fx5-r*0.06,-r*1.0); ctx.quadraticCurveTo(fx5,-r*1.05-fh, fx5+r*0.06,-r*1.0); ctx.closePath();
        ctx.save(); ctx.translate(0,-r*1.025-fh/2); ctx.fillStyle=lgrad((r*0.05+fh)/2,'rgba(201,139,255,0)','rgba(201,139,255,0.85)'); ctx.fill(); ctx.restore(); }
      ctx.restore();
    }
  }
  // A1 — rim light on the side FACING the player: her candle catches their edge; eyes glow and track her
  { const pa=Math.atan2(P.y-e.y,P.x-e.x), ca=Math.cos(pa), sa=Math.sin(pa);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=e.elite?'rgba(235,200,255,0.55)':'rgba(255,218,170,0.42)'; ctx.lineWidth=Math.max(1.4,r*0.11);
    ctx.beginPath(); ctx.ellipse(sway*0.5,-r*0.1,r*0.74,r*0.84,0,pa-0.95,pa+0.95); ctx.stroke();
    const ey=_EYE[T]||_EYE._; if(ey && !GFX.lite){ const ec=_EYEC[T]||(e.elite?'255,240,170':'255,77,77'), es=r*0.62, sp9=glowSprite('rgba('+ec+',0.9)','rgba('+ec+',0)',8);
      for(const p9 of ey){ const ex=p9[0]*r+ca*r*0.05+(T==='wraith'||T==='hexer'?0:sway*0.4), eyy=p9[1]*r+sa*r*0.04; ctx.drawImage(sp9,ex-es/2,eyy-es/2,es,es); } }
    ctx.restore(); }
  if(e.elite||e.boss){
    ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.moveTo(-r*0.4,-r*1.0); ctx.lineTo(-r*0.2,-r*1.3); ctx.lineTo(0,-r*1.05); ctx.lineTo(r*0.2,-r*1.3); ctx.lineTo(r*0.4,-r*1.0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#c8102e'; ctx.beginPath(); ctx.arc(-r*0.2,-r*1.22,r*0.05,0,6.28); ctx.arc(r*0.2,-r*1.22,r*0.05,0,6.28); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(-r,r*1.1,r*2,4);
    ctx.fillStyle='#c98bff'; ctx.fillRect(-r,r*1.1,r*2*(e.hp/e.maxhp),4);
    if(e.unkillable){ ctx.fillStyle='#ffd36b'; ctx.font='700 10px serif'; ctx.textAlign='center'; ctx.fillText('∞', 0, r*1.05); }
  }
  { const wnd=1-(e.hp/Math.max(1,e.maxhp));
    if(wnd>0.25){ ctx.globalAlpha=Math.min(0.4,(wnd-0.25)*0.6); ctx.fillStyle='#160408';
      ctx.beginPath(); ctx.ellipse(0,-r*0.15,r*0.72,r*0.85,0,0,6.28); ctx.fill(); ctx.globalAlpha=1; } }
  if(e.flash>0){ const dw=r*3.2; ctx.globalAlpha=Math.min(0.92,e.flash*8); ctx.drawImage(silVar(T,'white'),-dw/2,-dw/2,dw,dw); ctx.globalAlpha=1; } // A1: white flash in the enemy's own shape
  ctx.restore();
}

// one arrow, many masters — pulses from the player toward an off-screen offering
function drawGuide(tx,ty,col){
  const adx=tx-P.x, ady=ty-P.y;
  if(Math.hypot(adx,ady)<=150) return;
  const aa2=Math.atan2(ady,adx);
  const pu3=0.7+Math.sin(gt*6)*0.3;
  const orb=58+Math.sin(gt*6)*10;
  const ax=P.x+Math.cos(aa2)*orb, ay=P.y+Math.sin(aa2)*orb;
  ctx.save(); ctx.translate(ax,ay); ctx.rotate(aa2);
  ctx.globalAlpha=0.55+Math.sin(gt*6)*0.25;
  const asc=(0.8+pu3*0.5); ctx.scale(asc,asc);
  ctx.shadowColor=col; ctx.shadowBlur=16;
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-8,-11); ctx.lineTo(-3,0); ctx.lineTo(-8,11); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff'; ctx.globalAlpha*=0.8;
  ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-4,-6); ctx.lineTo(-1,0); ctx.lineTo(-4,6); ctx.closePath(); ctx.fill();
  ctx.restore(); ctx.globalAlpha=1;
}
// the standing tokens each get their true-color arrow; the vault only beckons briefly when it reopens
function drawGuides(){
  if(state!=='playing') return;
  { const bs=enemies.find(e=>e.boss); if(bs && !inView(bs.x,bs.y,-40)) drawGuide(bs.x,bs.y,bs.col||'#ff5560'); }
  if(crashTok){ drawGuide(crashTok.x, crashTok.y, '#8bff9a');
    if(inView(crashTok.x,crashTok.y,80) && crashTok.t<8){ ctx.save(); ctx.strokeStyle='rgba(139,255,154,0.8)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(crashTok.x,crashTok.y,34,-1.5708,-1.5708+(crashTok.t/20)*6.283); ctx.stroke(); ctx.restore(); } }
  if(wheelTok) drawGuide(wheelTok.x, wheelTok.y, '#c98bff');
  if(eggProp)  drawGuide(eggProp.x,  eggProp.y,  '#ffd36b');
  if(vaultProp && window._vaultBeacon && gt<window._vaultBeacon) drawGuide(vaultProp.x, vaultProp.y, '#fff2c0');
}

function drawEgg(){
  if(!eggProp) return; const e9=eggProp;
  if(e9.x<camX-40||e9.x>camX+VW+40||e9.y<camY-40||e9.y>camY+VH+40) return;
  ctx.save(); ctx.translate(e9.x, e9.y+Math.sin(gt*2.2)*1.5);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.drawImage(glowSprite('rgba(255,211,107,0.22)','rgba(255,211,107,0)',20),-20,-20,40,40); ctx.restore();
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0,7,6,2.2,0,0,6.28); ctx.fill();
  ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.ellipse(0,0,5,6.6,0,0,6.28); ctx.fill();
  ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.ellipse(-1.5,-2,1.7,2.4,-0.4,0,6.28); ctx.fill();
  ctx.restore();
}
function drawPlayer(){
  const t=gt*6, mv=P.moving?1:0, brt=Math.sin(gt*2.2)*0.5+0.5;
  const gh=!!P._rites; // near-death ghoul form
  const fx=Math.cos(P.aim), fy=Math.sin(P.aim);
  if(P.trail && !GFX.lite){ const tc9=P._goldTrail?'#ffd36b':'#8b1620';
    for(let i=0;i<P.trail.length;i++){ const tp=P.trail[i]; ctx.globalAlpha=(i/P.trail.length)*(P._goldTrail?0.24:0.15); ctx.fillStyle=tc9; ctx.beginPath(); ctx.arc(tp.x,tp.y,7*(i/P.trail.length),0,6.28); ctx.fill(); } ctx.globalAlpha=1; }
  ctx.save(); ctx.translate(P.x,P.y);
  if(P.inv>0.12 && ((gt*22)|0)%2===0) ctx.globalAlpha=0.55; // struck souls flicker — the i-frames are visible
  if(killStreak>=50 && state==='playing'){ ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(255,154,60,'+(0.35+Math.sin(gt*10)*0.2)+')'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,27+Math.sin(gt*7)*3,0,6.28); ctx.stroke();
    ctx.strokeStyle='rgba(255,220,140,'+(0.2+Math.sin(gt*10+2)*0.12)+')'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.arc(0,0,33+Math.sin(gt*5.5)*4,0,6.28); ctx.stroke(); ctx.restore();
    if(Math.random()<0.25) parts.push({x:P.x+rnd(-20,20),y:P.y+rnd(-14,18),vx:rnd(-10,10),vy:-rnd(40,90),life:rnd(.2,.45),col:'#ff9a3c',r:rnd(1,2)}); }
  if(P.ovT>0 && state==='playing'){ // J1: THE FEED wears on her — a halo in the tier's jewel color, tighter and brighter as it climbs
    const tr=P.ovTier||0, c9=FEED_COL[tr], pulse=Math.sin(gt*(6+tr*3))*0.5+0.5;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=0.22+tr*0.1+pulse*0.12; ctx.strokeStyle=c9; ctx.lineWidth=2+tr*0.8; ctx.shadowColor=c9; ctx.shadowBlur=GFX.lite?0:10+tr*6;
    ctx.beginPath(); ctx.arc(0,4,30+pulse*4,0,6.28); ctx.stroke();
    if(tr>=3){ ctx.globalAlpha=0.35+pulse*0.25; ctx.strokeStyle='#fff2c0'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(0,4,38+pulse*5,0,6.28); ctx.stroke(); }
    // the starve warning: the halo flickers red under 30
    if(P.ovT<30 && ((gt*10)|0)%2===0){ ctx.globalAlpha=0.5; ctx.strokeStyle='#ff3344'; ctx.lineWidth=2; ctx.shadowColor='#ff3344'; ctx.beginPath(); ctx.arc(0,4,24,0,6.28); ctx.stroke(); }
    ctx.restore(); }
  if(P.godT>0){ ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(139,255,154,'+(0.6+Math.sin(gt*12)*0.3)+')'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.arc(0,0,24+Math.sin(gt*9)*3,0,6.28); ctx.stroke(); ctx.restore(); }
  // faint gambler's rune circle beneath the boots
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.rotate(gt*0.6);
  ctx.strokeStyle='rgba(232,182,76,'+(gh?0.10:(0.13+brt*0.06))+')'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(0,4,27,0,6.28); ctx.stroke();
  for(let rn2=0;rn2<4;rn2++){ const rna=rn2*1.5708; ctx.fillStyle='rgba(232,182,76,'+(gh?0.14:0.22)+')';
    ctx.font='9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(['♠','♥','♦','♣'][rn2], Math.cos(rna)*27, 4+Math.sin(rna)*27); }
  ctx.restore();
  if(P.midas && P.midasStacks>0){ ctx.strokeStyle='rgba(232,182,76,'+Math.min(0.6,P.midasStacks/30)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,20+Math.sin(t)*2,0,6.28); ctx.stroke(); }
  // ═══ A1 GILT NOIR — VESPER, redrawn: 1.45× larger (visual only — P.radius untouched), ink-outlined,
  // white-gold rim, pale face, 4-beat procedural run (boots / coat tails / free arm), idle breathe.
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0,17,17,5.6,0,0,6.28); ctx.fill();
  ctx.save(); ctx.scale(1.45,1.45);
  const ph=t*1.15, lean=fx*3, run=mv, bob=Math.abs(Math.sin(ph))*run*1.6;
  if(!run){ const br=1+brt*0.028; ctx.translate(0,15); ctx.scale(1+(1-brt)*0.01,br); ctx.translate(0,-15); } // idle breathe
  ctx.translate(0,-bob);
  const step=Math.sin(ph)*run, bil=Math.sin(ph*0.5+0.6)*run*1.2+Math.sin(gt*1.7)*0.6, hurtF=Math.max(0,(P._hurtF||0)-gt);
  // legs + boots — 4-beat: plant, pass, plant, pass (the lift reads at any size)
  for(const sd of [-1,1]){ const k=step*sd, lift=Math.max(0,-k)*2.2;
    ctx.strokeStyle='#0a0406'; ctx.lineWidth=2.6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(sd*2.6,8); ctx.lineTo(sd*3.2+k*3.4,13.6-lift); ctx.stroke();
    ctx.fillStyle='#050203'; ctx.beginPath(); ctx.ellipse(sd*3.4+k*3.8,14.6-lift,3.1,1.7,0,0,6.28); ctx.fill(); }
  // ghoul soul-smoke rising off the body
  if(gh){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){ const sy=-((gt*30+i*17)%46), sa2=1-Math.abs(sy+23)/23;
      ctx.globalAlpha=sa2*0.30; ctx.fillStyle='#3a4a5a';
      ctx.beginPath(); ctx.arc(-8+i*5.4+Math.sin(gt*2.4+i)*3, sy-2, 3.4+sa2*2, 0, 6.28); ctx.fill(); }
    ctx.globalAlpha=1; ctx.restore(); }
  // the long coat — one silhouette path, reused for ink, fill, rim and the hurt flash
  const coat=()=>{ ctx.beginPath();
    ctx.moveTo(-6.5+lean,-8.5);
    ctx.quadraticCurveTo(-12+lean,-6,-12.5+lean-bil,3);
    ctx.quadraticCurveTo(-14.5+lean-bil*1.6,10,-12.5+lean-bil*1.8,15.2-step*1.2);
    ctx.quadraticCurveTo(-6,12.6,-2.4,13.2); ctx.lineTo(0,10.5); ctx.lineTo(2.4,13.2);
    ctx.quadraticCurveTo(6,12.6,12.5+lean+bil*1.8,15.2+step*1.2);
    ctx.quadraticCurveTo(14.5+lean+bil*1.6,10,12.5+lean+bil,3);
    ctx.quadraticCurveTo(12+lean,-6,6.5+lean,-8.5);
    ctx.quadraticCurveTo(lean,-10.6,-6.5+lean,-8.5); ctx.closePath(); };
  coat(); ctx.strokeStyle='#040102'; ctx.lineWidth=2.4; ctx.lineJoin='round'; ctx.stroke(); // ink outline
  { const ck='plcA1'+(gh?1:0); let cgd=_lgCache[ck];
    if(!cgd){ cgd=ctx.createLinearGradient(0,-10,0,16);
      if(gh){ cgd.addColorStop(0,'#2a2430'); cgd.addColorStop(1,'#0a0609'); }
      else { cgd.addColorStop(0,'#b0202f'); cgd.addColorStop(0.45,'#7a1020'); cgd.addColorStop(1,'#3a060d'); }
      _lgCap(); _lgCache[ck]=cgd; }
    ctx.fillStyle=cgd; } ctx.fill();
  if(!qLow&&!GFX.lite){ // C6 — velvet stipple breathed into the coat
    if(!window._velvB){ const c9=document.createElement('canvas'); c9.width=c9.height=24; const g9=c9.getContext('2d');
      g9.fillStyle='rgba(255,255,255,0.05)'; for(let n9=0;n9<26;n9++) g9.fillRect((Math.random()*24)|0,(Math.random()*24)|0,1,1);
      g9.fillStyle='rgba(0,0,0,0.07)'; for(let n9=0;n9<20;n9++) g9.fillRect((Math.random()*24)|0,(Math.random()*24)|0,1,1);
      window._velvB=c9; }
    ctx.save(); ctx.clip(); ctx.drawImage(window._velvB,-12+lean,-10,24,24); ctx.drawImage(window._velvB,-12+lean,4,24,12); ctx.restore(); }
  // coat-tail split shadow + crimson lining flashing as she strides
  ctx.fillStyle=gh?'#2a1218':'#d01e2e'; ctx.beginPath(); ctx.moveTo(-1.6+lean*0.6,1); ctx.quadraticCurveTo(-2.6-bil*0.6,8,-2.4,13.2); ctx.lineTo(0,10.5); ctx.lineTo(2.4,13.2); ctx.quadraticCurveTo(2.6+bil*0.6,8,1.6+lean*0.6,1); ctx.closePath(); ctx.fill();
  // gold hem trim — the one gilt line she wears
  ctx.strokeStyle=gh?'rgba(90,100,110,0.8)':'rgba(255,211,107,0.85)'; ctx.lineWidth=0.9;
  ctx.beginPath(); ctx.moveTo(-12.2+lean-bil*1.8,14.4-step*1.2); ctx.quadraticCurveTo(-6,11.9,-2.4,12.5); ctx.moveTo(2.4,12.5); ctx.quadraticCurveTo(6,11.9,12.2+lean+bil*1.8,14.4+step*1.2); ctx.stroke();
  // lapels + black waistcoat
  ctx.fillStyle='#120609'; ctx.beginPath(); ctx.moveTo(-4.2+lean,-7.6); ctx.lineTo(lean*0.5,3.4); ctx.lineTo(4.2+lean,-7.6); ctx.quadraticCurveTo(lean,-6.2,-4.2+lean,-7.6); ctx.fill();
  ctx.fillStyle=gh?'#3a4550':'#e8b64c'; for(let i=0;i<2;i++){ ctx.beginPath(); ctx.arc(lean*0.5,-3.6+i*3,0.75,0,6.28); ctx.fill(); }
  // free arm swings with the stride (off-hand side of the aim)
  { const sd=fx>=0?-1:1, sw=step*3.2*sd;
    ctx.strokeStyle='#2a050b'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(sd*8+lean,-5.5); ctx.quadraticCurveTo(sd*11+lean,-0.5,sd*9.5+lean+sw,3.5); ctx.stroke();
    ctx.fillStyle='#efe6d6'; ctx.beginPath(); ctx.arc(sd*9.5+lean+sw,4.4,1.3,0,6.28); ctx.fill(); }
  // white-gold rim: she is the light, so her own edge glows where the halo wraps her shoulders
  if(!GFX.lite){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=gh?'rgba(160,200,255,0.35)':'rgba(255,236,190,0.5)'; ctx.lineWidth=1.1;
    ctx.beginPath(); ctx.moveTo(-11.8+lean-bil,2); ctx.quadraticCurveTo(-11.6+lean,-6,-6.5+lean,-8.4); ctx.quadraticCurveTo(lean,-10.4,6.5+lean,-8.4); ctx.quadraticCurveTo(11.6+lean,-6,11.8+lean+bil,2); ctx.stroke(); ctx.restore(); }
  // card-hand: aims toward the cursor with a glowing spinning card
  ctx.save(); ctx.rotate(P.aim);
  ctx.strokeStyle='#040102'; ctx.lineWidth=4.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(3,0); ctx.lineTo(11.5,0); ctx.stroke();
  ctx.strokeStyle=gh?'#1c222a':'#8e1424'; ctx.lineWidth=2.8; ctx.beginPath(); ctx.moveTo(3,0); ctx.lineTo(11,0); ctx.stroke();
  ctx.strokeStyle=gh?'#3a4550':'#e8b64c'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(9.4,-1.5); ctx.lineTo(9.4,1.5); ctx.stroke();
  ctx.save(); ctx.translate(13,0); ctx.rotate(gt*3);
  if(!GFX.lite){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.7; ctx.drawImage(glowSprite(gh?'rgba(138,200,255,0.8)':'rgba(255,226,170,0.8)','rgba(255,200,120,0)',8),-8,-8,16,16); ctx.restore(); }
  ctx.fillStyle='#fbf6ea'; ctx.fillRect(-2.4,-3.4,4.8,6.8);
  ctx.fillStyle='#c8102e'; ctx.fillRect(-1,-1.4,2,2.8);
  ctx.strokeStyle='rgba(60,10,16,0.7)'; ctx.lineWidth=0.6; ctx.strokeRect(-2.4,-3.4,4.8,6.8);
  ctx.restore(); ctx.restore();
  // pale collar + face — the brightest skin on the floor; ashen in ghoul form
  const hx=lean*0.62, hy=-12.2;
  ctx.fillStyle='#040102'; ctx.beginPath(); ctx.arc(hx,hy,5.6,0,6.28); ctx.fill();
  ctx.fillStyle=gh?'#8a929a':'#f4ecdf'; ctx.beginPath(); ctx.moveTo(-3.4+lean*0.5,-8.6); ctx.lineTo(lean*0.5,-5.2); ctx.lineTo(3.4+lean*0.5,-8.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle=gh?'#9aa2ac':'#f6eee2'; ctx.beginPath(); ctx.ellipse(hx,hy,4.5,4.8,0,0,6.28); ctx.fill();
  ctx.fillStyle=gh?'#6a737c':'rgba(200,170,160,0.55)'; ctx.beginPath(); ctx.ellipse(hx+fx*1.2,hy+2.2,3.4,1.9,0,0,6.28); ctx.fill(); // jaw shade
  // eyes track aim — red embers (hollow soul-blue when dying); glow via cached sprite, never shadowBlur
  { const ex=hx+fx*1.1, ey=hy-0.4+fy*0.5;
    ctx.fillStyle=gh?'#1a2026':'#2a0a0e'; ctx.beginPath(); ctx.ellipse(ex-1.7,ey,1.3,0.95,0,0,6.28); ctx.ellipse(ex+1.7,ey,1.3,0.95,0,0,6.28); ctx.fill();
    if(!GFX.lite){ ctx.save(); ctx.globalCompositeOperation='lighter'; const egs=glowSprite(gh?'rgba(140,200,255,0.9)':'rgba(255,45,61,0.9)','rgba(255,45,61,0)',8);
      ctx.drawImage(egs,ex-1.7-3,ey-3,6,6); ctx.drawImage(egs,ex+1.7-3,ey-3,6,6); ctx.restore(); }
    ctx.fillStyle=gh?'#bfe6ff':'#ff3a48'; ctx.beginPath(); ctx.arc(ex-1.7,ey,0.7,0,6.28); ctx.arc(ex+1.7,ey,0.7,0,6.28); ctx.fill();
    if(!gh){ ctx.fillStyle='#a01020'; ctx.fillRect(hx+fx*1.2-1,hy+2.6,2,0.7); } } // a red mouth
  // wide-brim gambler hat — ink outline, gold band, blood pin, feather
  { const hb=lean*0.75, tilt=lean*0.02;
    ctx.fillStyle='#040102'; ctx.beginPath(); ctx.ellipse(hb,-15.6,11.6,3.6,tilt,0,6.28); ctx.fill();
    ctx.fillStyle='#120a0e'; ctx.beginPath(); ctx.ellipse(hb,-15.8,10.4,2.7,tilt,0,6.28); ctx.fill();
    ctx.fillStyle='#040102'; ctx.beginPath(); ctx.moveTo(hb-5.6,-15.6); ctx.lineTo(hb-4.8,-21.6); ctx.quadraticCurveTo(hb,-23.4,hb+4.8,-21.6); ctx.lineTo(hb+5.6,-15.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#160c11'; ctx.beginPath(); ctx.moveTo(hb-4.6,-16); ctx.lineTo(hb-4,-21); ctx.quadraticCurveTo(hb,-22.4,hb+4,-21); ctx.lineTo(hb+4.6,-16); ctx.closePath(); ctx.fill();
    ctx.fillStyle=gh?'#4a5560':'#e8b64c'; ctx.fillRect(hb-4.7,-17.6,9.4,1.4);
    ctx.fillStyle='#ff3344'; ctx.beginPath(); ctx.arc(hb+3.6,-16.9,1,0,6.28); ctx.fill();
    if(!GFX.lite){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,236,190,0.35)'; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.ellipse(hb,-15.8,10.6,3,tilt,3.5,5.9); ctx.stroke(); ctx.restore(); }
    const fw=Math.sin(gt*5)*0.8+run*Math.sin(ph)*0.8;
    ctx.strokeStyle=gh?'rgba(120,140,160,0.8)':'rgba(220,40,56,0.95)'; ctx.lineWidth=1.3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(hb+4,-17.2); ctx.quadraticCurveTo(hb+8,-21+fw, hb+10.8,-24+fw); ctx.stroke();
    ctx.strokeStyle=gh?'rgba(120,140,160,0.45)':'rgba(255,90,100,0.6)'; ctx.lineWidth=0.7;
    for(let fb=0;fb<3;fb++){ const ft2=0.35+fb*0.25, bx=hb+4+(6.8)*ft2, by=-17.2+(-6.8+fw)*ft2;
      ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx-1.7,by-1.5); ctx.stroke(); } }
  // hurt: Vesper herself flashes white — coat and head, her own shape
  if(hurtF>0){ ctx.save(); ctx.globalAlpha=Math.min(0.9,hurtF*7); ctx.fillStyle='#ffffff'; coat(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx,hy,5,5.2,0,0,6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(lean*0.75,-15.6,11,3.2,0,0,6.28); ctx.fill(); ctx.restore(); }
  ctx.restore(); // end of Vesper's 1.45× space
  // passive skill auras
  const rgL=skillLevel('regen'), lkL=skillLevel('luck'), exL=skillLevel('exec');
  if(rgL){ ctx.globalCompositeOperation='lighter'; for(let i=0;i<Math.min(3,rgL);i++){ const wy=-((gt*22+i*13)%34), wa=1-Math.abs(wy+17)/17;
    ctx.globalAlpha=wa*0.55; ctx.fillStyle='#8bff9a'; ctx.beginPath(); ctx.arc(-8+i*8+Math.sin(gt*3+i)*2, wy+6, 1.6,0,6.28); ctx.fill(); }
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
  if(lkL){ const ga=gt*2.6; for(let i=0;i<Math.min(2,lkL);i++){ const a2=ga+i*3.14, gx=Math.cos(a2)*15, gy=Math.sin(a2)*7+2;
    const tw=Math.sin(gt*9+i*2)*0.5+0.5; ctx.globalAlpha=tw*0.8; ctx.fillStyle='#ffe9a8';
    ctx.beginPath(); ctx.moveTo(gx,gy-2.6); ctx.lineTo(gx+0.9,gy); ctx.lineTo(gx,gy+2.6); ctx.lineTo(gx-0.9,gy); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha=1; }
  if(exL){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.24+Math.sin(gt*4)*0.08; ctx.strokeStyle='#ff3344'; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.arc(0,0,19,P.aim+2.2,P.aim+4.1); ctx.stroke(); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
  // invuln blink
  if(P.inv>0 && Math.floor(P.inv*20)%2===0){ ctx.globalAlpha=0.16; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(0,-2,17,24,0,0,6.28); ctx.fill(); ctx.globalAlpha=1; }
  ctx.restore();
}
const BOSS_DEFS={
  housegod:{name:'THE HOUSE', vt:'revenant'},
  pitboss:{name:'THE PIT BOSS', vt:'brute'},
  croupier:{name:'THE CROUPIER', vt:'hr_croupier', g:'♠', bar:(b,p)=>hrBar(b,p), sub:'DEALS THE FLOOR · ♠ BLADES ♥ HEALS HIM ♦ PAYS YOU ♣ SLOWS · CALL HIS COIN'},
  bookie:{name:'THE BOOKIE', vt:'hr_bookie', g:'♞', bar:(b,p)=>hrBar(b,p), sub:'STAND ON THE ODDS WHEN BETS CLOSE · WIN — HE BLEEDS · LOSE — A CURSE'},
  twins:{name:'THE TWINS OF FORTUNE', vt:'hr_twin', g:'✵', falls:'THE TWINS OF FORTUNE FALL', bar:(b,p)=>hrBar(b,p), sub:'ONE LIFE, TWO BODIES · ONLY THE TWIN THE WHEEL NAMES TAKES FULL DAMAGE · THE OTHER 40%'},
  collector:{name:'THE DEBT COLLECTOR', vt:'hexer'},
  thehouse:{name:'THE HOUSE ITSELF', vt:'revenant'}
};
/* ============================================================
   BOSSES + SPECIAL ENEMY BEHAVIOR
   ============================================================ */
function bossPlate(name,sub){
  let bp=$('bossPlate'); if(!bp){ bp=document.createElement('div'); bp.id='bossPlate'; document.body.appendChild(bp); }
  bp.innerHTML='<b>♛</b> '+name+' <b>♛</b>'+(sub?'<i class="hrSub">'+sub+'</i>':''); bp.classList.remove('go'); void bp.offsetWidth; bp.classList.add('go');
  SFX.bossRoar&&SFX.bossRoar(); setTimeout(()=>bp.classList.remove('go'),2600);
}
function spawnBoss(kindOverride){
  if(window.LESSON&&window.LESSON.on) return; // J3: no bosses in class
  const order=hrBossOrder(); // C2 — the night's rotation (3 slots, each from its own pool, then THE HOUSE ITSELF)
  const kind=(kindOverride&&BOSS_DEFS[kindOverride]&&kindOverride!=='housegod')?kindOverride:order[(Math.max(1,Math.floor(wave/10))-1)%order.length];
  const a=rng('spawn')*6.283, dd=Math.max(VW,VH)*0.55;
  const x=clamp(P.x+Math.cos(a)*dd,40,CFG.arena-40), y=clamp(P.y+Math.sin(a)*dd,40,CFG.arena-40);
  spawnEnemy(kind,x,y);
  try{ bossPlate(BOSS_DEFS[kind].name, BOSS_DEFS[kind].sub); }catch(e){}
  const b=enemies[enemies.length-1]; if(b){ b.boss=true; if(contractDone('pallbearer')){ b.hp*=0.9; b.maxhp=(b.maxhp||b.hp)*0.9; } b.bossKind=kind; b.vt=BOSS_DEFS[kind].vt; b.bstate='stalk'; b.bt=2; b.spiralA=0; }
  if(b && HR_LINES[kind]){ hrInit(b,kind); hrEntrance(kind); }
  showStreak('⚜ '+BOSS_DEFS[kind].name+' APPROACHES ⚜'); SFX.bossRoar(Math.min(1,dd/900)); flash(0.5,'#c98bff'); shake=Math.min(20,shake+12); startDrone();
}
function bossAI(e,dt,dx,dy,d){
  const k=e.bossKind;
  if(k==='croupier') return hrCroupierAI(e,dt,dx,dy,d); if(k==='bookie') return hrBookieAI(e,dt,dx,dy,d); if(k==='twins') return hrTwinsAI(e,dt,dx,dy,d); // C2
  e.bt=(e.bt||0)-dt;
  if(k==='pitboss' || (k==='thehouse' && e.bstate!=='spiral')){
    if(e.bstate==='stalk'){ e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
      if(e.bt<=0){ e.bstate='tele'; e.bt=0.7; e.ca=Math.atan2(dy,dx); SFX.riser(); }
    } else if(e.bstate==='tele'){ e.flash=0.06;
      if(e.bt<=0){ e.bstate='charge'; e.bt=0.62; SFX.thud(); shake=Math.min(16,shake+6); }
    } else if(e.bstate==='charge'){ e.x+=Math.cos(e.ca)*640*dt; e.y+=Math.sin(e.ca)*640*dt;
      if(Math.random()<0.5) burst(e.x,e.y,1,'#ff5566');
      if(e.bt<=0){ e.bstate = (k==='thehouse')?'spiral':'stalk'; e.bt=(k==='thehouse')?3.2:2.2; }
    }
    e.x=clamp(e.x,30,CFG.arena-30); e.y=clamp(e.y,30,CFG.arena-30);
    return true;
  }
  if(k==='collector'){
    e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
    e.v1=(e.v1||0)-dt;
    if(e.v1<=0){ e.v1=4; ring(e.x,e.y,90,'#6a4ab5'); SFX.murmur();
      for(let i2=0;i2<3 && enemies.length<CFG.spawn.max;i2++){ const an=rng('spawn')*6.283; spawnEnemy('swarm', clamp(e.x+Math.cos(an)*40,20,CFG.arena-20), clamp(e.y+Math.sin(an)*40,20,CFG.arena-20)); } }
    return true;
  }
  if(k==='thehouse' && e.bstate==='spiral'){
    e.x+=dx/d*e.spd*0.5*dt; e.y+=dy/d*e.spd*0.5*dt;
    e.spiralA+=dt*3.4; e.v1=(e.v1||0)-dt;
    if(e.v1<=0){ e.v1=0.13; for(let s2=0;s2<2;s2++){ const an=e.spiralA+s2*3.14; ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(an)*180,vy:Math.sin(an)*180,r:7,dmg:e.dmg*0.8,life:3.6}); } }
    if(e.bt<=0){ e.bstate='stalk'; e.bt=1.8; }
    return true;
  }
  return false;
}
function specialAI(e,dt,dx,dy,d){
  if(e._ldT>0) hrLoadedStep(e,dt,dx,dy,d); if(e.affix) hrAffixAI(e,dt,dx,dy,d); // C2 — LOADED dice / MARKED split
  if(e.type==='gilded'){
    e.x-=dx/d*e.spd*dt; e.y-=dy/d*e.spd*dt;
    e.x=clamp(e.x,20,CFG.arena-20); e.y=clamp(e.y,20,CFG.arena-20);
    if(Math.random()<0.3) burst(e.x,e.y,1,'#ffd36b');
    e.despawn=(e.despawn===undefined?12:e.despawn)-dt;
    if(e.despawn<=0){ burst(e.x,e.y,8,'#7a5a1c'); const idx=enemies.indexOf(e); if(idx>=0)enemies.splice(idx,1); }
    return true;
  }
  if(e.type==='leech'){
    e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
    e.v1=(e.v1||0)-dt;
    if(e.v1<=0){ e.v1=1.2; let healed=false;
      for(const o of enemies){ if(o!==e && !o.boss && Math.hypot(o.x-e.x,o.y-e.y)<95 && o.hp<o.maxhp){ o.hp=Math.min(o.maxhp,o.hp+o.maxhp*0.045); healed=true; } }
      if(healed){ ring(e.x,e.y,95,'#4a8a5a'); burst(e.x,e.y,3,'#8bff9a'); } }
    return true;
  }
  return false;
}

/* ============================================================
   C2 — THE HIGH ROLLERS. Three lords of the House whose fights ARE
   table games: THE CROUPIER deals the floor and makes you call a coin,
   THE BOOKIE opens a betting board, THE TWINS OF FORTUNE spin a wheel
   that decides which of them can bleed. Plus two elite affixes.
   Everything here is prefixed hr*; hooks into the core are one-liners.
   ============================================================ */
let hrCards=[], hrZones=[], hrDice=[], hrMarks=null, hrFlip=null, hrWheel=null;
const HR_SUIT={ '♠':{c:'#dfe6ff',n:'BLADES'}, '♥':{c:'#ff3355',n:'HEALS HIM'}, '♦':{c:'#ffd36b',n:'PAYS YOU'}, '♣':{c:'#6fd0ff',n:'SLOWS'} };
const HR_AFFIX={ loaded:{n:'LOADED',c:'#ff8af7'}, marked:{n:'MARKED',c:'#ff5a1f'} };
const HR_LINES={
  croupier:['PLACE YOUR BODY ON THE FELT, DARLING.','THE DECK IS HONEST. I AM NOT.','CUT THE CARDS? NO. I CUT YOU.','EVERY HAND I DEAL IS A LANE TO YOUR GRAVE.'],
  bookie:['EVERYTHING HAS ODDS. YOURS ARE LONG.','I KEEP A LEDGER. YOUR NAME IS ON EVERY PAGE.','BET ON YOURSELF, LOVE. NOBODY ELSE WILL.','THE HOUSE TAKES ITS CUT. I TAKE THE REST.'],
  twins:['SHE PAYS IN GOLD. HE PAYS IN BONE.','ONE OF US IS LUCKY TONIGHT. GUESS WHICH.','RED IS FOR AMATEURS. WE SPIN GOLD AND BONE.','STRIKE THE WRONG ONE AND WE BOTH LAUGH.']
};
function hrReset(){ hrCards=[]; hrZones=[]; hrDice=[]; hrMarks=null; hrFlip=null; hrWheel=null; }
// the night's rotation — each boss slot draws from its own pool, unmet lords preferred
function hrBossOrder(){
  if(window._hrOrdSeq!==window._runSeq || !window._hrOrd){
    window._hrOrdSeq=window._runSeq;
    const met=k=>(typeof IDX!=='undefined'&&IDX.b&&IDX.b.indexOf(k)>=0);
    const pick=a=>{ const un=dlyOn()?[]:a.filter(k=>!met(k)); const pool=(un.length&&rng('spawn')<0.7)?un:a; return pool[(rng('spawn')*pool.length)|0]; }; // Daily Debt: seeded, same lords for everyone
    const s1=pick(['pitboss','croupier','bookie']);
    const s2=pick(['croupier','bookie','collector'].filter(k=>k!==s1));
    window._hrOrd=[s1,s2,'twins','thehouse'];
  }
  return window._hrOrd;
}
function hrVoice(kind,txt){
  let v=document.getElementById('hrVoice'); if(!v){ v=document.createElement('div'); v.id='hrVoice'; document.body.appendChild(v); }
  v.className='hr-'+kind; v.textContent=''; v.classList.add('on');
  const base={croupier:300,bookie:150,twins:520}[kind]||260, wav={croupier:'triangle',bookie:'sawtooth',twins:'sine'}[kind]||'triangle';
  let ci=0; clearInterval(v._tw); v._tw=setInterval(()=>{ if(ci>=txt.length){ clearInterval(v._tw); return; }
    const ch=txt[ci++]; v.textContent+=ch;
    if(ch!==' ' && ci%2===0){ const tw=(kind==='twins'&&((ci>>3)%2))?0.64:1; tone(base*tw*(0.9+Math.random()*0.25),0.05,wav,kind==='bookie'?0.035:0.05,base*tw*0.8); } },34);
  clearTimeout(v._t); v._t=setTimeout(()=>v.classList.remove('on'),4600);
}
function hrEntrance(kind){
  const L=HR_LINES[kind]; if(!L) return;
  setTimeout(()=>{ if(state==='playing'||state==='slot') hrVoice(kind,L[(Math.random()*L.length)|0]); },1300);
  try{ SFX.hrSting(kind); }catch(e){}
}
function hrInit(b,kind){
  b.hrGuard=true;
  if(kind==='croupier'){ b.v1=2.2; b.v2=1.4; b.stunT=0; b.rageT=0; }
  else if(kind==='bookie'){ b.bph='roam'; b.bt=3.2; b.v1=1.5; }
  else if(kind==='twins'){
    b.tw='gold'; b.oa=Math.atan2(b.y-P.y,b.x-P.x);
    const a2=b.oa+2.3, dd=Math.max(VW,VH)*0.55;
    spawnEnemy('twins', clamp(P.x+Math.cos(a2)*dd,40,CFG.arena-40), clamp(P.y+Math.sin(a2)*dd,40,CFG.arena-40));
    const m=enemies[enemies.length-1];
    Object.assign(m,{boss:true,bossKind:'twins',vt:'hr_twin',tw:'bone',col:'#e6dccb',dark:'#3a3328',bstate:'stalk',bt:2,spiralA:0,hrGuard:true,oa:a2,hp:b.maxhp,maxhp:b.maxhp});
    const pool={hp:b.maxhp,max:b.maxhp,dead:false}; b.pool=m.pool=pool; b.mate=m; m.mate=b;
    b.v1=3.4; m.v1=2.2; b.dst='orbit';
    hrWheel={t:8.2,a:0,v:0,spin:false,hot:rng('combat')<0.5?'gold':'bone',tk:0};
    setTimeout(()=>{ if(hrWheel) announce('◈ THE WHEEL SAYS '+(hrWheel.hot==='gold'?'GOLD':'BONE')+' — STRIKE THAT TWIN ◈', true); },2600);
  }
}
// killEnemy guard — true means "not yet" (the twins share one life; the second body leaves quietly)
function hrGuardKill(e,idx){
  if(e.bossKind!=='twins'||!e.pool) return false;
  const pool=e.pool;
  if(pool.dead){ burst(e.x,e.y,24,e.tw==='gold'?'#ffd36b':'#e6dccb'); ring(e.x,e.y,90,'#fff2c0'); if(idx>=0&&enemies[idx]===e) enemies.splice(idx,1); else { const j=enemies.indexOf(e); if(j>=0) enemies.splice(j,1); } return true; }
  hrTwinSync(e);
  if(pool.hp>0) return true;
  return false;
}
function hrTwinSync(e){
  const pool=e.pool; if(!pool) return;
  if(e._hs===undefined){ e._hs=e.hp; if(e.maxhp>pool.max){ pool.hp+=e.maxhp-pool.max; pool.max=e.maxhp; e._hs=e.hp=pool.hp; } } // B2 champions scale one body — the pool takes the larger
  e.maxhp=pool.max;
  const drop=e._hs-e.hp;
  if(drop>0){ const hot=hrWheel?hrWheel.hot:'gold', m=(e.tw===hot)?1:0.4; pool.hp-=drop*m;
    if(m<1 && rng('combat')<0.08) ftext(e.x,e.y-e.r-12,'×0.4','#8a8478'); }
  e.hp=e._hs=Math.max(0,pool.hp);
}
// a boss's unique bounty — paid on top of the usual gilt + epic floor
function hrBounty(e){
  const k=e.bossKind;
  if(k==='croupier'){ P.crit+=0.06; setTimeout(()=>{ announce('♠ THE DEALER\'S CUT — +6% CRIT FOR THE NIGHT ♠', true); SFX.rarSting(3); },1700); }
  else if(k==='bookie'){ let n=0; for(const d of debuffs){ try{ d.revert(); }catch(x){} n++; } debuffs=[]; P.coins+=40; LT.coins+=40;
    setTimeout(()=>{ announce('♞ PAID IN FULL — '+n+' CURSE'+(n===1?'':'S')+' TORN UP · +40 COINS ♞', true); SFX.cashout(); coinRain(16); },1700); }
  else if(k==='twins'){ P.damage*=1.10; if(e.pool) e.pool.dead=true; if(e.mate) e.mate.hrVanish=true; hrWheel=null;
    setTimeout(()=>{ announce('✵ FORTUNE\'S FAVOR — +10% DAMAGE FOR THE NIGHT ✵', true); SFX.rarSting(4); },1700); }
  if(k==='croupier'){ hrFlip=null; } if(k==='bookie') hrMarks=null;
}
// the boss bar speaks each table's language
function hrBar(bs,pct){
  const k=bs.bossKind;
  if(k==='bookie') return 'THE BOOKIE — LEDGER ◈ '+Math.ceil(Math.max(0,bs.hp)).toLocaleString()+' OWED';
  if(k==='croupier') return 'THE CROUPIER — '+Math.ceil(pct)+'% · ♠40 ♥20 ♦15 ♣25'+(bs.stunT>0?' · EXPOSED':bs.rageT>0?' · ENRAGED':'');
  if(k==='twins') return 'THE TWINS OF FORTUNE — '+Math.ceil(pct)+'% · '+(hrWheel?(hrWheel.spin?'THE WHEEL SPINS…':(hrWheel.hot==='gold'?'GOLD':'BONE')+' BLEEDS'):'');
  return BOSS_DEFS[k].name+' — '+Math.ceil(pct)+'%';
}

/* ---------- THE CROUPIER ---------- */
function hrDeal(e){
  const base=Math.atan2(P.y-e.y,P.x-e.x), n=5, sp=0.42, A=CFG.arena;
  for(let i=0;i<n;i++){ const a=base+(i-(n-1)/2)*sp, R=150+rng('combat')*30, r9=rng('combat');
    const s=r9<0.40?'♠':r9<0.60?'♥':r9<0.75?'♦':'♣';
    hrCards.push({e,x:e.x,y:e.y,sx:e.x,sy:e.y,tx:clamp(e.x+Math.cos(a)*R,30,A-30),ty:clamp(e.y+Math.sin(a)*R,30,A-30),a,s,t:-i*0.07,rev:0.95+i*0.14,done:false,life:5.4,bl:0,blT:0,heal:0}); }
  e._dealFx=0.5; SFX.hrDeal();
}
function hrStartFlip(e){
  const mine=rng('combat')<0.5?0:1; // 0 = ♛ HEADS, 1 = ☠ TAILS
  hrFlip={e,t:0,dur:3.6,ph:rng('combat')*2,mine,res:-1,rt:0,face:-1,how:''};
  announce('◈ THE CROUPIER FLIPS — YOU HOLD '+(mine===0?'♛ HEADS':'☠ TAILS')+' — '+(window._touchUI?'◈ BET':'SPACE')+' WHEN IT SHOWS ◈', true);
  SFX.hrFlipStart(); flash(0.25,'#fff2c0'); hitstop=Math.max(hitstop,0.06);
}
function hrSpace(){
  if(!hrFlip || hrFlip.res>=0 || state!=='playing') return false;
  const u=hrFlip.ph-Math.floor(hrFlip.ph), flat=Math.sin(Math.PI*u)>0.5, face=Math.floor(hrFlip.ph)%2;
  hrResolveFlip(flat?face:(rng('combat')<0.5?0:1), flat?'CLEAN CATCH':'CAUGHT ON THE EDGE — 50/50');
  SFX.press&&SFX.press();
  return true;
}
function hrResolveFlip(res,how){
  const f=hrFlip; if(!f) return; f.res=res; f.rt=0; f.how=how;
  const e=f.e, win=(res===f.mine);
  if(!enemies.includes(e)) return;
  if(win){ e.stunT=4; e.rageT=0; hrCards.length=0;
    announce('♛ YOUR CALL LANDS — THE CROUPIER IS EXPOSED · ×1.5 DMG · 4s ♛', true);
    bigWin('CALLED IT',2); SFX.hrCoinWin(); ring(e.x,e.y,140,'#ffd36b'); ring(e.x,e.y,80,'#fff2c0'); shake=Math.min(20,shake+8); }
  else { e.rageT=6; e.stunT=0;
    announce('☠ THE HOUSE\'S CALL — THE CROUPIER IS ENRAGED · 6s ☠', false);
    SFX.hrCoinLose(); flash(0.45,'#8b1620'); ring(e.x,e.y,150,'#ff3355'); shake=Math.min(20,shake+10); }
}
function hrCroupierAI(e,dt,dx,dy,d){
  // exposure: damage that landed since last frame counts ×1.5
  if(e._hs!==undefined && e.hp<e._hs && e.stunT>0){ e.hp=e._hs-(e._hs-e.hp)*1.5; }
  const fr=e.hp/e.maxhp;
  if(!hrFlip && ((fr<0.6 && !e.f1)||(fr<0.25 && !e.f2))){ if(fr<0.6) e.f1=1; if(fr<0.25) e.f2=1; hrStartFlip(e); }
  if(e._dealFx>0) e._dealFx-=dt;
  if(e.stunT>0){ e.stunT-=dt; e.cd=Math.max(e.cd,0.25); if(e.stunT<=0) showStreak('THE CROUPIER RECOVERS'); }
  else if(hrFlip && hrFlip.e===e && hrFlip.res<0){ /* he watches the coin */ }
  else {
    const rg=e.rageT>0?1.45:1; if(e.rageT>0){ e.rageT-=dt; if(rng('combat')<0.25) burst(e.x,e.y-e.r,1,'#ff3355'); }
    if(d>260){ e.x+=dx/d*e.spd*rg*dt; e.y+=dy/d*e.spd*rg*dt; } else { e.x+=-dy/d*e.spd*0.6*rg*dt; e.y+=dx/d*e.spd*0.6*rg*dt; if(d<200){ e.x-=dx/d*e.spd*0.5*dt; e.y-=dy/d*e.spd*0.5*dt; } }
    e.v1-=dt*rg; e.v2-=dt*rg;
    if(e.v1<=0){ e.v1=6.2; hrDeal(e); }
    if(e.v2<=0){ e.v2=3.3; for(let i2=0;i2<10;i2++){ const an=i2/10*6.283+gt; if(ebullets.length<90) ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(an)*165,vy:Math.sin(an)*165,r:8,dmg:e.dmg*0.9,life:4}); } SFX.eshoot(); }
  }
  e.x=clamp(e.x,30,CFG.arena-30); e.y=clamp(e.y,30,CFG.arena-30);
  e._hs=e.hp; return true;
}

/* ---------- THE BOOKIE ---------- */
function hrOpenBoard(e){
  const A=CFG.arena, ax=P.x-e.x, ay=P.y-e.y, ad=Math.hypot(ax,ay)||1, ux=ax/ad, uy=ay/ad, sd=rng('combat')<0.5?1:-1;
  const cl=v=>clamp(v,90,A-90);
  const m=[
    {x:cl(P.x+ux*190+uy*sd*90), y:cl(P.y+uy*190-ux*sd*90), o:2, p:0.55, dm:0.06, c:8,  col:'#e6d9c2'},
    {x:cl(e.x+ux*110-uy*sd*170),y:cl(e.y+uy*110+ux*sd*170),o:5, p:0.35, dm:0.14, c:18, col:'#ff9a3c'},
    {x:cl(e.x), y:cl(e.y), o:10, p:0.22, dm:0.28, c:40, col:'#ff3355'} ];
  hrMarks={e,t:6.5,dur:6.5,m,r:74,last:4};
  e.bph='board'; e.v1=0.8;
  announce('♞ THE BOOKIE OPENS THE BOARD — STAND ON YOUR ODDS WHEN BETS CLOSE ♞', true); SFX.hrBoard(); ring(e.x,e.y,160,'#3dff8a');
}
function hrBookieAI(e,dt,dx,dy,d){
  e.bt-=dt; if(e._paid>0) e._paid-=dt;
  if(e.bph==='roam'){
    if(d>200){ e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt; } else { e.x+=-dy/d*e.spd*0.7*dt; e.y+=dx/d*e.spd*0.7*dt; }
    e.v1-=dt; if(e.v1<=0){ e.v1=2.2; const ba=Math.atan2(dy,dx);
      for(let i2=-1;i2<=1;i2++){ const an=ba+i2*0.22; if(ebullets.length<90) ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(an)*250,vy:Math.sin(an)*250,r:8,dmg:e.dmg*0.9,life:3.6}); }
      SFX.hrSlip(); }
    if(e.bt<=0 && !hrMarks) hrOpenBoard(e);
  } else { // the board is open: he parks on the long odds and sprays chalk
    const M=hrMarks&&hrMarks.m[2]; if(M){ const mx=M.x-e.x, my=M.y-e.y, md=Math.hypot(mx,my); if(md>4){ e.x+=mx/md*Math.min(md,e.spd*2.2*dt); e.y+=my/md*Math.min(md,e.spd*2.2*dt); } }
    e.v1-=dt; if(e.v1<=0){ e.v1=1.25; const o=rng('combat')*6.283;
      for(let i2=0;i2<8;i2++){ const an=o+i2/8*6.283; if(ebullets.length<90) ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(an)*175,vy:Math.sin(an)*175,r:7,dmg:e.dmg*0.75,life:3.2}); }
      SFX.hrChalk(); }
    if(!hrMarks){ e.bph='roam'; e.bt=6.5; e.v1=1.6; }
  }
  e.x=clamp(e.x,30,CFG.arena-30); e.y=clamp(e.y,30,CFG.arena-30);
  return true;
}
function hrResolveBoard(){
  const H=hrMarks; hrMarks=null; const e=H.e; if(!enemies.includes(e)) return;
  let mk=null; for(const m of H.m){ if(Math.hypot(P.x-m.x,P.y-m.y)<H.r){ mk=m; break; } }
  SFX.hrBell();
  if(!mk){ showStreak('NO BET — THE BOOKIE SHRUGS'); hrVoiceMaybe('bookie','NO STOMACH FOR IT? PITY.'); return; }
  if(rng('combat')<mk.p){
    const dmg=e.maxhp*mk.dm; e.hp-=dmg; e.flash=0.3; e._paid=1.8; trackDmg&&trackDmg(dmg);
    const cn=Math.round(mk.c*(P.coinMult||1)); for(let i=0;i<cn;i++) coins.push({x:P.x+rnd(-20,20),y:P.y+rnd(-20,20),r:6,vx:rnd(-160,160),vy:rnd(-160,160)});
    ftext(e.x,e.y-e.r-20,'−'+Math.round(dmg),'#ffd36b',true); ring(e.x,e.y,120,'#ffd36b'); ring(e.x,e.y,190,'#fff2c0'); burst(e.x,e.y,30,'#ffd36b');
    announce('♞ '+mk.o+':1 PAYS — THE LEDGER BLEEDS '+Math.round(mk.dm*100)+'% · +'+cn+' COINS ♞', true);
    SFX.hrBetWin(mk.o); if(mk.o>=5) bigWin(mk.o+':1 PAYS', mk.o>=10?3:1); else { coinRain(10); SFX.cashout(); }
    shake=Math.min(22,shake+6+mk.o);
  } else {
    let lab='a curse'; try{ lab=applyDebuff(); }catch(x){}
    announce('✖ '+mk.o+':1 LOSES — THE BOOKIE COLLECTS: '+lab+' ✖', false);
    SFX.hrBetLose(); hrVoiceMaybe('bookie',['SIGN HERE, DARLING.','THE HOUSE THANKS YOU.','INTEREST ACCRUES.'][(Math.random()*3)|0]);
  }
}
function hrVoiceMaybe(k,t){ const n9=performance.now(); if(n9-(window._hrVT||0)<6000) return; window._hrVT=n9; hrVoice(k,t); }

/* ---------- THE TWINS OF FORTUNE ---------- */
function hrTwinsAI(e,dt,dx,dy,d){
  if(e.hrVanish){ burst(e.x,e.y,30,e.tw==='gold'?'#ffd36b':'#e6dccb'); ring(e.x,e.y,120,'#fff2c0'); const j=enemies.indexOf(e); if(j>=0) enemies.splice(j,1); return true; }
  hrTwinSync(e);
  if(e.pool&&e.pool.hp<=0) return true; // dies this frame in the caller
  e.oa+=dt*0.5;
  if(e.tw==='gold' && e.dst!=='orbit'){
    e.bt-=dt;
    if(e.dst==='tele'){ e.flash=0.05; if(e.bt<=0){ e.dst='dash'; e.bt=0.44; SFX.thud(); shake=Math.min(14,shake+5); } }
    else if(e.dst==='dash'){ e.x+=Math.cos(e.ca)*600*dt; e.y+=Math.sin(e.ca)*600*dt; if(rng('combat')<0.5) burst(e.x,e.y,1,'#ffd36b');
      if(e.bt<=0){ e.dst='orbit'; e.v1=3.6; e.oa=Math.atan2(e.y-P.y,e.x-P.x); } }
  } else {
    const tx=P.x+Math.cos(e.oa)*235, ty=P.y+Math.sin(e.oa)*235, mx=tx-e.x, my=ty-e.y, md=Math.hypot(mx,my)||1;
    const sp=e.spd*(md>140?1.5:1); e.x+=mx/md*Math.min(md,sp*dt); e.y+=my/md*Math.min(md,sp*dt);
    e.v1-=dt;
    if(e.v1<=0){
      if(e.tw==='gold'){ e.dst='tele'; e.bt=0.6; e.ca=Math.atan2(dy,dx); SFX.riser(); }
      else { e.v1=2.6; const ba=Math.atan2(dy,dx); for(let i2=-2;i2<=2;i2++){ const an=ba+i2*0.2; if(ebullets.length<90) ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(an)*240,vy:Math.sin(an)*240,r:7,dmg:e.dmg*0.8,life:3.4}); } SFX.hrBone(); }
    }
  }
  e.x=clamp(e.x,30,CFG.arena-30); e.y=clamp(e.y,30,CFG.arena-30);
  return true;
}
function hrSegD(px,py,ax,ay,bx,by){ const vx=bx-ax, vy=by-ay, L=vx*vx+vy*vy||1; let t=((px-ax)*vx+(py-ay)*vy)/L; t=t<0?0:t>1?1:t; return Math.hypot(px-(ax+vx*t),py-(ay+vy*t)); }

/* ---------- per-frame floor logic (cards, zones, board, wheel, coin, dice) ---------- */
function hrUpdate(dt){
  if(!P) return;
  P._hrSlow=1;
  // cards
  for(let i=hrCards.length-1;i>=0;i--){ const c=hrCards[i]; c.t+=dt; c.life-=dt;
    const alive=enemies.includes(c.e);
    if(c.t>0 && c.t<0.45){ const k=c.t/0.45, ez=1-(1-k)*(1-k); c.x=c.sx+(c.tx-c.sx)*ez; c.y=c.sy+(c.ty-c.sy)*ez; } else if(c.t>=0.45){ c.x=c.tx; c.y=c.ty; }
    if(alive && !c.done && c.t>=c.rev){ c.done=true; SFX.hrFlipCard(c.s);
      if(c.s==='♠'){ c.bl=3; c.blT=0.75; }
      else if(c.s==='♥'){ c.heal=2.4; }
      else if(c.s==='♦'){ const cn=6; for(let k=0;k<cn;k++) coins.push({x:c.x+rnd(-8,8),y:c.y+rnd(-8,8),r:6,vx:rnd(-120,120),vy:rnd(-120,120)}); burst(c.x,c.y,10,'#ffd36b'); ring(c.x,c.y,50,'#ffd36b'); SFX.hrDiamond(); }
      else if(c.s==='♣'){ hrZones.push({x:c.x,y:c.y,r:95,t:5,max:5}); ring(c.x,c.y,95,'#6fd0ff'); SFX.hrClub(); } }
    if(alive && c.bl>0){ c.blT-=dt; if(c.blT<=0){ c.bl--; c.blT=0.11; if(ebullets.length<90) ebullets.push({x:c.x,y:c.y,px:c.x,py:c.y,vx:Math.cos(c.a)*400,vy:Math.sin(c.a)*400,r:8,dmg:c.e.dmg*0.85,life:1.5}); SFX.hrBlade(); } }
    if(alive && c.heal>0){ c.heal-=dt; c.e.hp=Math.min(c.e.maxhp,c.e.hp+c.e.maxhp*0.018*dt); c.e._hs=c.e.hp;
      if(Math.hypot(P.x-c.x,P.y-c.y)<38){ c.heal=0; c.life=Math.min(c.life,0.3); P.hp=Math.min(P.maxHp,P.hp+8); ftext(P.x,P.y-30,'+8 ♥','#8bff9a',true); showStreak('YOU PALM THE HEART'); SFX.hrPalm(); burst(c.x,c.y,12,'#ff3355'); } }
    if(c.life<=0 || (!alive && c.life>0.4)){ if(!alive) c.life=Math.min(c.life,0.4); if(c.life<=0) hrCards.splice(i,1); }
  }
  // club zones
  for(let i=hrZones.length-1;i>=0;i--){ const z=hrZones[i]; z.t-=dt; if(z.t<=0){ hrZones.splice(i,1); continue; }
    if(Math.hypot(P.x-z.x,P.y-z.y)<z.r) P._hrSlow=0.55; }
  // the coin
  if(hrFlip){ const f=hrFlip;
    if(!enemies.includes(f.e)) hrFlip=null;
    else if(f.res<0){ f.t+=dt; const fq=2.4+3.1*Math.min(1,f.t/f.dur), pf=Math.floor(f.ph); f.ph+=dt*fq;
      if(Math.floor(f.ph)!==pf) SFX.hrCoinTick(Math.min(1,f.t/f.dur));
      if(f.t>=f.dur) hrResolveFlip(rng('combat')<0.5?0:1,'NO CALL — THE COIN FALLS WHERE IT WILL'); }
    else { f.rt+=dt; if(f.rt>1.8) hrFlip=null; } }
  // the board
  if(hrMarks){ const H=hrMarks;
    if(!enemies.includes(H.e)) hrMarks=null;
    else { H.t-=dt; const s=Math.ceil(H.t); if(s<H.last && s>=1 && s<=3){ H.last=s; showStreak('BETS CLOSE IN '+s); SFX.hrTick(s); }
      if(H.t<=0) hrResolveBoard(); } }
  // the wheel
  if(hrWheel){ const W=hrWheel;
    if(!enemies.some(x=>x.bossKind==='twins')) hrWheel=null;
    else { W.t-=dt;
      if(!W.spin && W.t<=1.8){ W.spin=true; W.v=15; showStreak('THE WHEEL SPINS'); SFX.hrWheelGo(); }
      if(W.spin){ W.v=Math.max(1.2,W.v*Math.pow(0.32,dt)); const pa=W.a; W.a+=W.v*dt; if(Math.floor(W.a/(6.283/12))!==Math.floor(pa/(6.283/12))) SFX.wheelTick&&SFX.wheelTick(Math.max(0,1-W.v/15)); }
      if(W.t<=0){ W.spin=false; W.t=8; const prev=W.hot; W.hot=rng('combat')<0.5?'gold':'bone';
        { const st=6.283/12, ptr=-Math.PI/2; let best=W.a, bd=9; for(let k=0;k<12;k++){ if((k%2===0?'gold':'bone')!==W.hot) continue; const cand=ptr-(k+0.5)*st; const n=Math.round((W.a-cand)/6.283); const v=cand+n*6.283, dd=Math.abs(v-W.a); if(dd<bd){ bd=dd; best=v; } } W.a=best; }
        const tw=enemies.find(x=>x.bossKind==='twins'&&x.tw===W.hot);
        announce((W.hot==='gold'?'◈ GOLD':'☠ BONE')+(prev===W.hot?' AGAIN':'')+' — STRIKE THE '+(W.hot==='gold'?'GOLD':'BONE')+' TWIN '+(W.hot==='gold'?'◈':'☠'), true);
        SFX.hrWheelLand(W.hot); if(tw){ ring(tw.x,tw.y,110,W.hot==='gold'?'#ffd36b':'#fff2c0'); ring(tw.x,tw.y,60,'#ffffff'); } } }
    // the chain between them bites
    const tw=enemies.filter(x=>x.bossKind==='twins'); if(tw.length===2){ window._hrChainCd=(window._hrChainCd||0)-dt;
      if(window._hrChainCd<=0 && hrSegD(P.x,P.y,tw[0].x,tw[0].y,tw[1].x,tw[1].y)<11+P.radius*0.5){ window._hrChainCd=0.8; hurtPlayer(tw[0].dmg*0.45); SFX.hrChain(); } } }
  // loaded dice
  for(let i=hrDice.length-1;i>=0;i--){ const dc=hrDice[i]; dc.t-=dt;
    if(!dc.landed){ dc.x+=dc.vx*dt; dc.y+=dc.vy*dt; dc.vx*=0.94; dc.vy*=0.94; if(rng('combat')<0.3) dc.face=1+((rng('combat')*6)|0);
      if(dc.t<=0){ dc.landed=true; dc.t=1.4; dc.face=1+((rng('combat')*6)|0); const f=[0.55,0.7,0.85,1.15,1.3,1.5][dc.face-1]; dc.f=f;
        let n=0; for(const o of enemies){ if(o.boss) continue; if(Math.hypot(o.x-dc.x,o.y-dc.y)<170){ o._ldF=f; o._ldT=6; n++; } }
        ring(dc.x,dc.y,170,f<1?'#8bff9a':'#ff3355'); ring(dc.x,dc.y,90,'#ff8af7'); SFX.hrDieLand(dc.face);
        ftext(dc.x,dc.y-26,(f<1?'SLOWED ×':'HASTED ×')+f,f<1?'#8bff9a':'#ff5566',true); } }
    else if(dc.t<=0) hrDice.splice(i,1); }
}
// LOADED speed re-roll rides on top of whatever the enemy's own legs are doing
function hrLoadedStep(e,dt,dx,dy,d){ if(!(e._ldT>0)) return; e._ldT-=dt; const k=(e._ldF-1)*e.spd*dt; e.x+=dx/d*k; e.y+=dy/d*k; }

/* ---------- elite affixes ---------- */
function hrAffix(e){ if(!e||e.boss) return; const r=rng('elite'); if(r<0.24) e.affix='loaded'; else if(r<0.48) e.affix='marked'; if(e.affix){ e.v9=2.5; } }
function hrAffixAI(e,dt,dx,dy,d){
  if(e.affix==='loaded'){ e.v9-=dt; if(e.v9<=0 && d<620){ e.v9=4.6; hrDice.push({x:e.x,y:e.y,vx:rnd(-90,90),vy:rnd(-90,90),t:1.1,face:1,landed:false}); SFX.hrDieThrow(); } }
  if(e._split && e.affix==='marked'){ e._split=0; e.affix='split';
    e.hp*=0.5; e.maxhp*=0.5; e.r=Math.round(e.r*0.8); e.coins=Math.round(e.coins*0.5); e.xp*=0.5;
    const c=Object.assign({},e,{x:e.x+rnd(-24,24),y:e.y+rnd(-24,24),ph:rng('combat')*6.28,born:gt,_tr:null,kx:-(e.kx||0),ky:-(e.ky||0)});
    e.kx+=rnd(-160,160); e.ky+=rnd(-160,160);
    if(enemies.length<CFG.spawn.max+20) enemies.push(c);
    ring(e.x,e.y,80,'#ff5a1f'); burst(e.x,e.y,18,'#ff5a1f'); showStreak('THE MARK SPLITS'); SFX.hrSplit(); }
  return false;
}

/* ---------- bakes + drawing ---------- */
const _hrBk=new Map();
function hrBake(T,col,dark,tw){
  const key=T+'|'+col+'|'+tw; let c=_hrBk.get(key); if(c) return c;
  const R=50, S=160; c=document.createElement('canvas'); c.width=S; c.height=S; const g=c.getContext('2d'); g.translate(S/2,S/2);
  const gr=g.createLinearGradient(0,-R*1.3,0,R); gr.addColorStop(0,col); gr.addColorStop(0.6,dark); gr.addColorStop(1,dark);
  _silShape(g,T,R,gr,'#050204',7);
  g.globalCompositeOperation='source-atop';
  if(T==='hr_croupier'){ // black waistcoat over the ivory shirt, red bow, green visor, gold-free buttons of bone
    g.fillStyle='#14090c'; g.beginPath(); g.moveTo(-R*0.6,-R*0.36); g.lineTo(-R*0.12,-R*0.36); g.lineTo(0,R*0.1); g.lineTo(R*0.12,-R*0.36); g.lineTo(R*0.6,-R*0.36); g.lineTo(R*0.4,R*0.82); g.lineTo(-R*0.4,R*0.82); g.closePath(); g.fill();
    g.fillStyle='#e6d9c2'; for(let k=0;k<3;k++){ g.beginPath(); g.arc(0,R*(0.25+k*0.2),R*0.04,0,6.28); g.fill(); }
    g.fillStyle='#c8102e'; g.beginPath(); g.moveTo(0,-R*0.34); g.lineTo(-R*0.18,-R*0.44); g.lineTo(-R*0.18,-R*0.24); g.closePath(); g.moveTo(0,-R*0.34); g.lineTo(R*0.18,-R*0.44); g.lineTo(R*0.18,-R*0.24); g.closePath(); g.fill();
    g.fillStyle='rgba(40,150,90,0.85)'; g.beginPath(); g.ellipse(0,-R*0.86,R*0.55,R*0.11,0,0,6.28); g.fill();
    g.fillStyle='#c8102e'; g.fillRect(R*0.62,-R*0.32,R*0.12,R*0.2); // the sleeve garter
  } else if(T==='hr_bookie'){ // slate ledger board, green felt coat, bowler
    g.fillStyle='#12160f'; g.fillRect(-R*0.74,-R*1.2,R*1.48,R*0.76);
    g.strokeStyle='#5a4a32'; g.lineWidth=R*0.08; g.strokeRect(-R*0.78,-R*1.24,R*1.56,R*0.84);
    g.fillStyle='#0d0a08'; g.beginPath(); g.ellipse(0,-R*0.6,R*0.42,R*0.08,0,0,6.28); g.arc(0,-R*0.66,R*0.24,3.14,6.28); g.fill();
    g.fillStyle='#d8c9a8'; g.beginPath(); g.arc(0,-R*0.4,R*0.22,0.2,2.94); g.fill(); // jowls under the brim
    g.strokeStyle='rgba(230,239,224,0.35)'; g.lineWidth=2; for(let k=0;k<4;k++){ g.beginPath(); g.moveTo(-R*0.6,R*(0.05+k*0.16)); g.lineTo(R*0.6,R*(0.05+k*0.16)); g.stroke(); } // check suit
  } else if(T==='hr_twin'){ // theatre mask: gold smiles, bone weeps
    const mc=tw==='gold'?'#ffe9a8':'#f4efe4';
    g.fillStyle=mc; g.beginPath(); g.ellipse(0,-R*0.6,R*0.27,R*0.31,0,0,6.28); g.fill();
    g.strokeStyle='#1a0e08'; g.lineWidth=R*0.06; g.beginPath();
    if(tw==='gold') g.arc(0,-R*0.56,R*0.14,0.3,2.84); else g.arc(0,-R*0.42,R*0.14,3.44,5.98); g.stroke();
    g.fillStyle=tw==='gold'?'#7a5a1c':'#2a2620'; g.fillRect(-R*0.5,R*0.2,R*1.0,R*0.12); // sash
    for(let k=0;k<5;k++){ g.fillStyle=(k%2)?'#e6dccb':'#c9962e'; g.beginPath(); g.arc(-R*0.4+k*R*0.2,R*0.26,R*0.05,0,6.28); g.fill(); } // roulette pips on the sash
  }
  // rim light on the upper-left shoulders
  g.strokeStyle='rgba(255,226,190,0.4)'; g.lineWidth=5; g.beginPath(); g.arc(0,R*0.1,R*1.0,-2.6,-0.6); g.stroke();
  g.globalCompositeOperation='source-over';
  _hrBk.set(key,c); return c;
}
function hrSil(g,T,R,body,legs){
  if(T==='hr_croupier'){
    legs([[R*0.6,-R*0.3,R*1.18,-R*0.06]],R*0.2);
    body(()=>{ g.moveTo(-R*0.72,-R*0.38); g.lineTo(R*0.72,-R*0.38); g.lineTo(R*0.42,R*0.82); g.lineTo(-R*0.42,R*0.82); g.closePath();
      g.moveTo(R*0.3,-R*0.7); g.arc(0,-R*0.7,R*0.3,0,6.28); g.moveTo(R*0.55,-R*0.86); g.ellipse(0,-R*0.86,R*0.55,R*0.11,0,0,6.28); });
    return true; }
  if(T==='hr_bookie'){
    body(()=>{ g.rect(-R*0.82,-R*1.28,R*1.64,R*0.92); g.moveTo(R*0.88,R*0.25); g.ellipse(0,R*0.25,R*0.88,R*0.62,0,0,6.28);
      g.moveTo(R*0.3,-R*0.42); g.arc(0,-R*0.42,R*0.3,0,6.28); });
    return true; }
  if(T==='hr_twin'){
    body(()=>{ g.moveTo(-R*0.5,R*0.85); g.quadraticCurveTo(-R*0.62,-R*0.1,-R*0.36,-R*0.5); g.quadraticCurveTo(-R*0.7,-R*0.98,-R*0.95,-R*0.95);
      g.quadraticCurveTo(-R*0.5,-R*0.78,-R*0.12,-R*0.95); g.quadraticCurveTo(R*0.2,-R*1.3,R*0.62,-R*1.36); g.quadraticCurveTo(R*0.42,-R*0.9,R*0.4,-R*0.5);
      g.quadraticCurveTo(R*0.62,-R*0.1,R*0.5,R*0.85); g.quadraticCurveTo(0,R*1.0,-R*0.5,R*0.85); });
    return true; }
  return false;
}
function hrCardShape(w,h){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-w/2,-h/2,w,h,3); else ctx.rect(-w/2,-h/2,w,h); }
function hrDrawBody(e,T,r,sway){
  const dw=r*3.2, bk=hrBake(T,e.col,e.dark,e.tw||''), bob=Math.sin(gt*3+e.ph)*r*0.03;
  ctx.save();
  if(T==='hr_croupier' && e.stunT>0){ ctx.rotate(Math.sin(gt*9)*0.08); }
  if(e.tw==='bone') ctx.scale(-1,1);
  ctx.drawImage(bk,-dw/2+sway*0.3,-dw/2+bob,dw,dw);
  ctx.restore();
  if(T==='hr_croupier'){
    const df=Math.max(0,e._dealFx||0)*2, hx=r*1.18, hy=-r*0.06-df*r*0.2;
    for(let c5=0;c5<4;c5++){ ctx.save(); ctx.translate(hx,hy); ctx.rotate(-0.6+c5*0.32+Math.sin(gt*2)*0.05-df*0.6);
      ctx.fillStyle='#14090c'; ctx.fillRect(-r*0.11,-r*0.44,r*0.22,r*0.44); ctx.fillStyle='#f2ead8'; ctx.fillRect(-r*0.09,-r*0.42,r*0.18,r*0.4);
      ctx.fillStyle=(c5%2)?'#c8102e':'#14090c'; ctx.font='700 '+Math.round(r*0.18)+"px serif"; ctx.textAlign='center'; ctx.fillText(['♠','♥','♣','♦'][c5],0,-r*0.16); ctx.restore(); }
    if(e.stunT>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(let s=0;s<4;s++){ const a=gt*4+s*1.57; ctx.fillStyle='#ffd36b'; const sx=Math.cos(a)*r*0.7, sy=-r*1.15+Math.sin(a)*r*0.2;
        ctx.beginPath(); ctx.moveTo(sx,sy-5); ctx.lineTo(sx+1.6,sy); ctx.lineTo(sx,sy+5); ctx.lineTo(sx-1.6,sy); ctx.closePath(); ctx.fill(); } ctx.restore();
      ctx.fillStyle='#ffd36b'; ctx.font="800 "+Math.round(r*0.36)+"px 'Cinzel',serif"; ctx.textAlign='center'; ctx.fillText('EXPOSED ×1.5',0,-r*1.5); }
    if(e.rageT>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35+Math.sin(gt*14)*0.2; ctx.drawImage(silVar(T,'glow','#ff2040'),-dw*0.6,-dw*0.6-r*0.08,dw*1.2,dw*1.2); ctx.restore(); }
  } else if(T==='hr_bookie'){
    // the ledger on his back IS his life: chalked debt, ten tallies, PAID when a bet lands
    const fr=Math.max(0,e.hp/e.maxhp), tl=Math.ceil(fr*10);
    ctx.fillStyle='#e8efe0'; ctx.textAlign='center'; ctx.font="700 "+Math.round(r*0.2)+"px 'Cinzel',serif"; ctx.fillText('OWED',0,-r*1.04);
    ctx.font="800 "+Math.round(r*0.26)+"px 'Cinzel',serif"; ctx.fillText('◈ '+Math.ceil(Math.max(0,e.hp)).toLocaleString(),0,-r*0.76);
    ctx.lineWidth=1.6; for(let k=0;k<10;k++){ const tx=-r*0.6+k*r*0.133; ctx.strokeStyle=k<tl?'rgba(232,239,224,0.9)':'rgba(255,51,85,0.8)';
      ctx.beginPath(); ctx.moveTo(tx,-r*0.66); ctx.lineTo(tx+(k<tl?0:r*0.08),-r*0.52); ctx.stroke(); }
    if(e._paid>0){ ctx.save(); ctx.rotate(-0.25); ctx.globalAlpha=Math.min(1,e._paid); ctx.strokeStyle='#ff3355'; ctx.lineWidth=3; ctx.strokeRect(-r*0.62,-r*1.18,r*1.24,r*0.4);
      ctx.fillStyle='#ff3355'; ctx.font="900 "+Math.round(r*0.32)+"px 'Cinzel',serif"; ctx.fillText('PAID',0,-r*0.86); ctx.restore(); }
    // a stub of chalk in the fist
    ctx.fillStyle='#f4f4ec'; ctx.save(); ctx.translate(r*0.86,r*0.05); ctx.rotate(0.6+Math.sin(gt*3)*0.2); ctx.fillRect(-2,-r*0.18,4,r*0.2); ctx.restore();
  } else if(T==='hr_twin'){
    const hot=hrWheel&&hrWheel.hot===e.tw, cl=e.tw==='gold'?'#ffd36b':'#fff2c0';
    if(hot){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+Math.sin(gt*6)*0.2; ctx.drawImage(silVar(T,'glow',cl),-dw*0.62,-dw*0.62-r*0.1,dw*1.24,dw*1.24); ctx.restore(); }
    else { ctx.save(); ctx.strokeStyle='rgba(150,150,170,0.55)'; ctx.lineWidth=2; ctx.setLineDash([5,6]); ctx.rotate(-gt); ctx.beginPath(); ctx.arc(0,0,r*1.35,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
    ctx.fillStyle=hot?cl:'#8a8478'; ctx.font="800 "+Math.round(r*0.42)+"px 'Cinzel',serif"; ctx.textAlign='center'; ctx.fillText(hot?'×1':'×0.4',0,-r*1.62);
    if(e.dst==='tele'){ ctx.save(); ctx.rotate(e.ca); ctx.globalAlpha=0.3+Math.sin(gt*30)*0.15; ctx.fillStyle='#ffd36b'; ctx.fillRect(0,-r*0.4,420,r*0.8); ctx.restore(); }
  }
}
function hrDrawAffix(e,r){
  const A=HR_AFFIX[e.affix==='split'?'marked':e.affix]; if(!A) return;
  if(e.affix==='loaded'){ const a=gt*2.2+e.ph, dx=Math.cos(a)*r*1.25, dy=-r*0.2+Math.sin(a)*r*0.5, s=r*0.42;
    ctx.save(); ctx.translate(dx,dy); ctx.rotate(gt*3); ctx.fillStyle='#fff4fb'; ctx.strokeStyle='#050204'; ctx.lineWidth=2; hrCardShape(s,s); ctx.fill(); ctx.stroke();
    ctx.fillStyle=A.c; const pf=1+(Math.floor(gt*3+e.ph)%6); hrPips(pf,s); ctx.restore(); }
  else { ctx.save(); ctx.rotate(gt*1.4); ctx.strokeStyle=A.c; ctx.lineWidth=2.4; ctx.globalAlpha=0.85;
    ctx.beginPath(); ctx.arc(0,0,r*1.3,0,6.28); ctx.stroke();
    for(let k=0;k<4;k++){ const a=k*1.5708; ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*1.05,Math.sin(a)*r*1.05); ctx.lineTo(Math.cos(a)*r*1.55,Math.sin(a)*r*1.55); ctx.stroke(); } ctx.restore(); }
  ctx.font="800 10px 'Cinzel',serif"; ctx.textAlign='center'; const lab=e.affix==='split'?'MARKED · SPLIT':A.n, tw9=ctx.measureText(lab).width+10;
  ctx.fillStyle='rgba(8,3,5,0.8)'; ctx.fillRect(-tw9/2,r*1.22,tw9,13); ctx.fillStyle=A.c; ctx.fillText(lab,0,r*1.22+10);
}
function hrPips(n,s){ const q=s*0.27, P9={1:[[0,0]],2:[[-q,-q],[q,q]],3:[[-q,-q],[0,0],[q,q]],4:[[-q,-q],[q,-q],[-q,q],[q,q]],5:[[-q,-q],[q,-q],[0,0],[-q,q],[q,q]],6:[[-q,-q],[q,-q],[-q,0],[q,0],[-q,q],[q,q]]}[n];
  for(const p of P9){ ctx.beginPath(); ctx.arc(p[0],p[1],Math.max(1.2,s*0.09),0,6.28); ctx.fill(); } }
// under the court: cards, lanes, zones, odds markers, dice
function hrDrawFloor(){
  if(!(hrCards.length||hrZones.length||hrMarks||hrDice.length)) return;
  ctx.save();
  for(const z of hrZones){ if(!inView(z.x,z.y,z.r+20)) continue; const al=Math.min(1,z.t/0.6)*Math.min(1,(z.max-z.t)/0.3);
    ctx.globalAlpha=0.16*al; ctx.fillStyle='#6fd0ff'; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,6.28); ctx.fill();
    ctx.globalAlpha=0.7*al; ctx.strokeStyle='#6fd0ff'; ctx.lineWidth=2; ctx.setLineDash([6,8]); ctx.beginPath(); ctx.arc(z.x,z.y,z.r,gt*0.6,gt*0.6+6.28); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#6fd0ff'; ctx.font='700 16px serif'; ctx.textAlign='center'; for(let k=0;k<5;k++){ const a=gt*0.6+k*1.2566; ctx.fillText('♣',z.x+Math.cos(a)*(z.r-14),z.y+Math.sin(a)*(z.r-14)+5); } }
  ctx.globalAlpha=1;
  if(hrMarks){ const H=hrMarks, fr=H.t/H.dur;
    for(const m of H.m){ const inn=Math.hypot(P.x-m.x,P.y-m.y)<H.r, pu=0.5+Math.sin(gt*6+m.o)*0.2;
      ctx.globalAlpha=(inn?0.3:0.14)+pu*0.08; ctx.fillStyle=m.col; ctx.beginPath(); ctx.arc(m.x,m.y,H.r,0,6.28); ctx.fill();
      ctx.globalAlpha=1; ctx.strokeStyle=m.col; ctx.lineWidth=inn?4:2.4; ctx.beginPath(); ctx.arc(m.x,m.y,H.r,0,6.28); ctx.stroke();
      ctx.strokeStyle='#fff2c0'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(m.x,m.y,H.r+7,-1.5708,-1.5708+fr*6.283); ctx.stroke();
      ctx.textAlign='center'; ctx.fillStyle=m.col; ctx.font="900 26px 'Cinzel',serif"; ctx.fillText(m.o+':1',m.x,m.y+4);
      ctx.font="700 11px 'Cinzel',serif"; ctx.fillStyle='#fff2c0'; ctx.fillText(Math.round(m.p*100)+'% · HITS '+Math.round(m.dm*100)+'%',m.x,m.y+22);
      if(inn){ ctx.fillStyle='#ffd36b'; ctx.font="800 12px 'Cinzel',serif"; ctx.fillText('YOUR BET',m.x,m.y-H.r-12); } } }
  for(const c of hrCards){ if(!inView(c.x,c.y,600)) continue; const fade=Math.min(1,c.life/0.4), S=HR_SUIT[c.s];
    if(c.done && c.s==='♠' && c.bl>0){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.a); ctx.globalAlpha=(0.14+Math.sin(gt*24)*0.06)*fade; ctx.fillStyle=S.c; ctx.fillRect(0,-20,560,40); ctx.restore(); }
    if(c.done && c.s==='♥' && c.heal>0 && enemies.includes(c.e)){ ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle='#ff3355'; ctx.lineWidth=2.5; ctx.setLineDash([4,6]); ctx.lineDashOffset=-gt*40;
      ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(c.e.x,c.e.y); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
    ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.a+1.5708); ctx.globalAlpha=fade;
    const fl=c.done?Math.min(1,(c.t-c.rev)/0.2):0, sx=c.done?Math.max(0.08,Math.abs(Math.cos(Math.PI*(1-fl)))):1;
    ctx.scale(sx,1); ctx.fillStyle='rgba(0,0,0,0.4)'; hrCardShape(26,36); ctx.fill();
    ctx.translate(0,-2);
    if(!c.done || fl<0.5){ ctx.fillStyle='#5a0e18'; hrCardShape(24,34); ctx.fill(); ctx.strokeStyle='#e6d9c2'; ctx.lineWidth=1.4; ctx.stroke();
      ctx.strokeStyle='rgba(230,217,194,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-8,-12); ctx.lineTo(8,12); ctx.moveTo(8,-12); ctx.lineTo(-8,12); ctx.stroke(); }
    else { ctx.fillStyle='#f4ecdc'; hrCardShape(24,34); ctx.fill(); ctx.strokeStyle=S.c; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=(c.s==='♠'||c.s==='♣')?'#14090c':'#c8102e'; ctx.font='700 20px serif'; ctx.textAlign='center'; ctx.fillText(c.s,0,7); }
    ctx.restore();
    if(c.done && c.t-c.rev<1.2){ ctx.globalAlpha=Math.max(0,1-(c.t-c.rev)/1.2); ctx.fillStyle=S.c; ctx.font="800 11px 'Cinzel',serif"; ctx.textAlign='center'; ctx.fillText(S.n,c.x,c.y-26); ctx.globalAlpha=1; } }
  for(const dc of hrDice){ const s=18; ctx.save(); ctx.translate(dc.x,dc.y); if(!dc.landed) ctx.rotate(gt*14);
    ctx.globalAlpha=dc.landed?Math.min(1,dc.t/0.4):1; ctx.fillStyle='#fff4fb'; ctx.strokeStyle='#050204'; ctx.lineWidth=2; hrCardShape(s,s); ctx.fill(); ctx.stroke();
    ctx.fillStyle=dc.landed?(dc.f<1?'#1f8a4a':'#c8102e'):'#ff8af7'; hrPips(dc.face,s); ctx.restore(); }
  ctx.restore(); ctx.globalAlpha=1;
}
// above the court: the roulette over the twins, the chain, the coin over Vesper
function hrDrawTop(){
  if(hrWheel){ const tw=enemies.filter(x=>x.bossKind==='twins');
    if(tw.length===2){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,230,170,'+(0.35+Math.sin(gt*8)*0.15)+')'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(tw[0].x,tw[0].y); ctx.lineTo(tw[1].x,tw[1].y); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle='#2a2018'; ctx.lineWidth=1.5; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.moveTo(tw[0].x,tw[0].y); ctx.lineTo(tw[1].x,tw[1].y); ctx.stroke(); ctx.restore(); }
    if(tw.length){ let mx=0,my=1e9; for(const t of tw){ mx+=t.x; my=Math.min(my,t.y); } mx/=tw.length;
      const W=hrWheel, R=30, cx=clamp(mx,camX+60,camX+VW-60), cy=clamp(my-110,camY+175,camY+VH-80), st=6.283/12;
      ctx.save(); ctx.translate(cx,cy);
      ctx.fillStyle='rgba(6,2,4,0.85)'; ctx.beginPath(); ctx.arc(0,0,R+6,0,6.28); ctx.fill();
      for(let k=0;k<12;k++){ ctx.fillStyle=(k%2===0)?'#c9962e':'#e6dccb'; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,W.a+k*st,W.a+(k+1)*st); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle='#050204'; ctx.lineWidth=1.5; for(let k=0;k<12;k++){ const a=W.a+k*st; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R); ctx.stroke(); }
      ctx.fillStyle='#14090c'; ctx.beginPath(); ctx.arc(0,0,R*0.36,0,6.28); ctx.fill();
      ctx.fillStyle=W.spin?'#fff2c0':(W.hot==='gold'?'#ffd36b':'#fff2c0'); ctx.beginPath(); ctx.arc(0,0,R*0.2,0,6.28); ctx.fill();
      ctx.fillStyle='#ff3355'; ctx.beginPath(); ctx.moveTo(0,-R+6); ctx.lineTo(-6,-R-8); ctx.lineTo(6,-R-8); ctx.closePath(); ctx.fill();
      ctx.font="800 12px 'Cinzel',serif"; ctx.textAlign='center'; ctx.fillStyle=W.hot==='gold'?'#ffd36b':'#fff2c0';
      ctx.fillText(W.spin?'NO MORE BETS':((W.hot==='gold'?'GOLD':'BONE')+' BLEEDS · '+Math.ceil(W.t)+'s'),0,R+20);
      ctx.restore(); } }
  if(hrFlip){ const f=hrFlip, R=32, cx=P.x, cy=P.y-120;
    const ph=f.res>=0?(f.res+0.5):f.ph, u=ph-Math.floor(ph), face=f.res>=0?f.res:(Math.floor(ph)%2), w=f.res>=0?1:Math.max(0.06,Math.sin(Math.PI*u));
    const hop=f.res>=0?Math.abs(Math.sin(Math.min(1,f.rt*2.2)*Math.PI))*14*(1-Math.min(1,f.rt)):0;
    ctx.save(); ctx.translate(cx,cy-hop);
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5; ctx.drawImage(lightSprite(255,210,120),-R*2.2,-R*2.2,R*4.4,R*4.4); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
    ctx.fillStyle='#3a2608'; ctx.beginPath(); ctx.ellipse(0,2,R*w+2,R+2,0,0,6.28); ctx.fill();
    ctx.fillStyle=face===0?'#ffd36b':'#e6dccb'; ctx.beginPath(); ctx.ellipse(0,0,R*w,R,0,0,6.28); ctx.fill();
    ctx.strokeStyle=face===0?'#fff2c0':'#8a8478'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,R*w*0.8,R*0.8,0,0,6.28); ctx.stroke();
    if(w>0.5){ ctx.save(); ctx.scale(w,1); ctx.fillStyle=face===0?'#7a5a1c':'#2a2620'; ctx.font='700 30px serif'; ctx.textAlign='center'; ctx.fillText(face===0?'♛':'☠',0,11); ctx.restore(); }
    ctx.textAlign='center';
    if(f.res<0){ ctx.font="800 13px 'Cinzel',serif"; ctx.fillStyle='#fff2c0';
      ctx.fillText((window._touchUI?'◈ BET':'SPACE')+' ON '+(f.mine===0?'♛ HEADS':'☠ TAILS'),0,R+22);
      ctx.font="700 10px 'Cinzel',serif"; ctx.fillStyle='#c9b98f'; ctx.fillText('FLAT = YOUR CALL · EDGE = 50/50 · '+Math.max(0,f.dur-f.t).toFixed(1)+'s',0,R+36); }
    else { const win=f.res===f.mine; ctx.font="900 16px 'Cinzel',serif"; ctx.fillStyle=win?'#ffd36b':'#ff3355'; ctx.fillText(win?'YOUR CALL':'THE HOUSE\'S CALL',0,R+22);
      ctx.font="700 10px 'Cinzel',serif"; ctx.fillStyle='#c9b98f'; ctx.fillText(f.how,0,R+36); }
    ctx.restore(); }
}
const HR_VT={hr_croupier:1,hr_bookie:1,hr_twin:1};
Object.assign(_EYE,{hr_croupier:[[-0.11,-0.72],[0.11,-0.72]],hr_bookie:[[-0.1,-0.44],[0.1,-0.44]],hr_twin:[[-0.1,-0.64],[0.1,-0.64]]});
Object.assign(_EYEC,{hr_croupier:'255,236,200',hr_bookie:'255,120,60',hr_twin:'255,90,90'});

/* ============================================================
   LOOP + START
   ============================================================ */
let last=0, _lastTick=0, _rafSeen=-1e9;
// J0 — ONE frame driver. rAF drives while the tab is visible and painting. The
// dedup guard stays as a belt for the hand-over moments.
function tick(now){ if(now-_lastTick<8) return; _lastTick=now; frame(now); }
function loop(now){
  requestAnimationFrame(loop);
  _rafSeen=performance.now();
  tick(now);
}
// FALLBACK TICKER at ~60Hz — browsers HARD-PAUSE requestAnimationFrame for hidden/
// embedded documents (preview panels, iframes). Without a fallback the whole game
// freezes at 0:00 there. J0: it only takes the wheel when the document is hidden or
// rAF has gone quiet for 100ms — on a healthy tab it never races rAF for the frame.
{ let _prk=0; setInterval(()=>{ const n=performance.now();
    if(!document.hidden && n-_rafSeen<100) return; // rAF is alive: it owns the frame
    if(document.hidden&&window._autoPaused){ if((++_prk)%16) return; }
    tick(n); }, 15); }
function frame(now){
  if(typeof GFX==='undefined') return; // A4: hosted build loads 13 scripts — the ticker can beat ui.js to the felt
  try{
  // J0: a long frame stays REAL-TIME (cap 0.1s, simulated as ≤2 slices of ≤0.05s) — the old
  // 0.05 cap turned every slow frame into slow motion ("1s in game = 5s real")
  const dt=Math.min(Math.max((now-last)/1000,0),0.1); last=now;
  const nSub=dt>0.05?2:1, sdt=dt/nSub;
  if(loopPrev){ frameAvg=frameAvg*0.93+(now-loopPrev)*0.07; } loopPrev=now;
  { // C8 — hysteresis: quality changes at most once per 5s dwell; upgrading demands 45
    // consecutive good frames; the ~30 frames after any flip/resize/state change are
    // amnestied (the flip itself causes a slow frame — the old code fed on its own wake).
    const was=qLow;
    if(GFX.q==='low') qLow=true;
    else if(GFX.q==='high') qLow=false;
    else {
      const nw9=now;
      if(window._qGrace===undefined) window._qGrace=0;
      if(state!==window._qState){ window._qState=state; window._qGrace=30; }
      if(window._qGrace>0){ window._qGrace--; window._qGood=0; }
      else if(nw9-(window._qFlipT||0)>5000){
        if(!qLow && frameAvg>19){ qLow=true; window._qFlipT=nw9; }
        else if(qLow){ if(frameAvg<15.5) window._qGood=(window._qGood||0)+1; else window._qGood=0;
          if(window._qGood>=45){ qLow=false; window._qFlipT=nw9; window._qGood=0; } }
      }
    }
    if(qLow&&!was&&state==='playing'&&!window._smoothT9){ window._smoothT9=true; showStreak('✦ THE HOUSE SMOOTHS THE FELT ✦'); setTimeout(()=>window._smoothT9=false,30000); } }
  if(qLow!==window._qPrev){ window._qPrev=qLow; window._qGrace=30; resize(); }
  if(GFX.shake===0) shake=0;
  document.body.classList.toggle('gamble', state==='slot'||state==='wheel'||state==='crash'||state==='marker');
  // each slice re-reads the state: a slice that opens a slot / kills / pauses ends the frame's sim
  const st0=state;
  for(let si=0; si<nSub && state===st0; si++){
    if(state==='playing'){
      if(hitstop>0){ hitstop-=sdt; }
      else if(!tabHold){ update(sdt*1.71*(slowT>0?0.35:1)); }
      else break;
    }
    else if(state==='wheel'){ tickWheel(sdt); }
    else if(state==='crash'){ tickCrash(sdt); }
    else if(state==='slot'){ tickSlot(sdt); }
    else break;
  }
  if(st0==='playing') updateHUD();
  if(P && state!=='menu'){ PROF.frameStart(); render(); PROF.frameEnd(); } // H2: the menu never shows last night's frozen floor
  }catch(_e){ if(!window._amErr){ window._amErr=1; console.error('[ANTE MORTEM]',_e); } }
}
function startGame(){
  try{ dlyBegin(); }catch(e){ DLY_RNG=null; } // B1: arms the seeded night when the DAILY DEBT plaque was played, else plain Math.random
  try{ fadeCut(); }catch(e){} try{ setFav('♠'); }catch(e){}
  initAudio(); houseActive=false;
  try{ startAmbience(); }catch(e){}
  setTimeout(()=>{ try{ if(AC&&AC.state==='suspended') coachMark('audio','the browser holds the music hostage — click once and the House sings'); }catch(e){} },2000); keyProp=null; vaultBuys=0; vaultLocked=0; if(AC&&AC.state==='suspended')AC.resume();
  P={ x:CFG.arena/2, y:CFG.arena/2, aim:0, moving:false, inv:0, coins:0, kills:0,
    hp:CFG.player.maxHp, maxHp:CFG.player.maxHp, speed:CFG.player.speed, radius:CFG.player.radius, pickup:CFG.player.pickup,
    damage:CFG.player.damage, fireRate:CFG.player.fireRate, projectiles:CFG.player.projectiles, pierce:CFG.player.pierce,
    projSpeed:CFG.player.projSpeed, projLife:CFG.player.projLife, projRadius:CFG.player.projRadius,
    crit:CFG.player.crit, critMult:CFG.player.critMult, instakill:CFG.player.instakill, regen:CFG.player.regen,
    coinMult:CFG.player.coinMult, lifesteal:CFG.player.lifesteal,
    xp:0, xpNext:28, level:1, midasStacks:0, mercy:0, comboMult:1, surgeT:0,
    wlv:{bolt:1,cards:0,orbit:0,scythe:0,spark:0,chand:0,knives:0,aura:0,nova:0,seeker:0}, passiveList:[], curses:[] };
  enemies=[]; bullets=[]; ebullets=[]; orbs=[]; coins=[]; parts=[]; texts=[]; rings=[]; sparks=[]; sideBoons=[]; smites=[];
  waves=[]; guils=[]; gpools=[]; gstakes=[]; hrReset();
  owned.clear();
  window._runSeq=(window._runSeq||0)+1; slotStage='idle'; gamble=null; window._slotFF=null; try{ clearInterval(window._antiHb); }catch(e){}
  gt=0; shake=0; hitstop=0; killStreak=0; streakT=0; goreT=null; _goreDryT=0; _goreDryI=0; _goreWinT=0; _goreWinN=0; excite=0; fireAcc=0; pending=[]; LT.runs++; bump('runs',LT.runs); fever=0; feverOn=false; feverT=0; tarots=[]; tarotT=14; decals=[]; wheelTok=null; wheelTokT=40; crashTok=null; crashTokT=50; bounty=null; bountyT=34; slotBank=0; vouchers=0; bountyStk=0; goldenT=0; ovBonusNext=false; slotFeedTier=0; slotTierNow=0; slowT=0; prevHp=0; dare=null; dareT=46;  
  if(!RANK._ld){ RANK._ld=1; loadRank(); }
  if(!DLY_RNG){ applyRankPerks(); } recToasted=new Set(); if(!DLY_RNG){ applyVault(); applyAchPerks(); } // B1: the daily is a fair field
  // the soul at the table speaks last — then the floor, then the ink
  { const sd=(typeof curSoul==='function')?curSoul():null;
    if(sd){ try{ sd.ap(); }catch(e){} if(sd.id!=='vesper') announce(sd.g+' '+sd.n+' TAKES THE SEAT '+sd.g, true); }
    for(const wid in P.wlv){ if(P.wlv[wid]>0) idxSee('w',wid); } }
  document.body.classList.remove('floor-cellar','floor-chapel');
  window._fmods={}; window._markMult=1;
  { const fd=(typeof curFloor==='function')?curFloor():null;
    if(fd){ window._fmods=fd.mods||{};
      if(fd.mods&&fd.mods.tint) document.body.classList.add('floor-'+fd.mods.tint);
      if(fd.mods&&fd.mods.coin) P.coinMult=(P.coinMult||1)*fd.mods.coin;
      if(fd.mods&&fd.mods.xp) P.xpMult=(P.xpMult||1)*fd.mods.xp;
      if(fd.id!=='pit') setTimeout(()=>announce(fd.g+' TONIGHT: '+fd.n+' '+fd.g, true), 900); } }
  { let act=(typeof RUN_CONTRACTS!=='undefined' && !DLY_RNG)?(IDX.ct||[]):[];
    act=act.filter(id=>{ const c=RUN_CONTRACTS.find(x=>x.id===id); return c && (!c.u||c.u()); }).slice(0,(typeof ctSlots==='function')?ctSlots():2);
    act.forEach(id=>{ const ct=RUN_CONTRACTS.find(x=>x.id===id); if(ct){ try{ ct.ap(); }catch(e){} window._markMult*=1.25; } });
    if(act.length) setTimeout(()=>announce('✍ '+act.length+' CONTRACT'+(act.length>1?'S':'')+' SIGNED — ×'+window._markMult.toFixed(2)+' MARKS & GILT ✍', true), 1600); }
  { const ind=(typeof INDULGENCES!=='undefined' && !DLY_RNG)?(IDX.ind||[]):[]; // B1: indulgences wait for a normal night
    if(ind.includes('pockets')){ P.coins+=60; }
    if(ind.includes('blood')){ P.maxHp+=25; P.hp+=25; }
    if(ind.includes('roller')){ P.hotSlots=3; }
    if(ind.includes('coffee')){ P.hotSlots=Math.max(P.hotSlots||0,1); }
    if(ind.length){ setTimeout(()=>announce('✦ '+ind.length+' INDULGENCE'+(ind.length>1?'S':'')+' HONORED ✦', true), 2100);
      IDX.ind=[]; idxSaveSoon(); } }
  if(LT.equal && !DLY_RNG){ P.coinMult*=1.05; P._goldTrail=true; } // THE HOUSE'S EQUAL — forever
  { const today=new Date().toISOString().slice(0,10);
    // H2: its own field — boot's DAILY BLESSING writes LT.lastDay as toDateString(); the two formats never
    // matched, so every reload was a "new day" and the blessing's DAY n climbed once per reload
    if(LT.lastAnte!==today){
      LT.lastAnte=today; gilt+=15; saveGilt(); if(typeof achSaveSoon==='function') achSaveSoon();
      setTimeout(()=>announce('☀ FIRST ANTE OF THE DAY — +15 GILT'+((LT.dayStreak||1)>1?' · '+LT.dayStreak+' NIGHTS RUNNING':'')+' ☀', true), 3000); } }
  try{ b2Start(); }catch(e){ console.warn('[B2 start]',e); }
  window._gt0=gt; // the night's true zero (contracts may shift the clock)
  P._idle=0; P._sigT=0; P._corners=new Set(); P._chestsRun=0; P._roulRun=0; P._pauses=0; P._1313=false;
  resetRun();
  { const now=new Date();
    if(now.getHours()===0) secret('midnight','THE WITCHING HOUR');
    if(now.getDay()===5 && now.getDate()===13) secret('friday13','UNLUCKIEST NIGHT'); }
  wave=0; waveClearTarget=0; waveGap=0.4; slotIndex=0; Object.assign(CFG.scale, BASE_SCALE);
  if(!grainReady) buildGrain();
  buildAudience(); buildHall(); renderRelics();
  debuffs=[];
  elMenu.classList.add('hidden'); elGO.classList.add('hidden'); elHud.classList.remove('hidden');
  fnStart(); // A3 first night: ease + lessons for a stranger's first 3 nights
  if(typeof lessonBegin==='function') lessonBegin(); // J3: THE LESSON (lesson.js) takes the night if it was asked for
  if(DLY_RNG) try{ dlyStart(); }catch(e){ console.error('[daily start]',e); } // B1: the debt's terms
  state='playing'; last=performance.now();
}

/* ============================================================
   THE VOICE OF THE HOUSE — 250 ordered lines. Your Nth meeting
   (LT.houseMet, lifetime) speaks line N. Five arcs: curiosity,
   amusement, contempt, intimacy, and at last the truth.
   ============================================================ */
const HOUSE_LINES=[
"OH. A NEW FACE.",
"YOU'RE EARLY.",
"SO YOU'RE THE ONE.",
"I FELT YOU WIN SOMETHING.",
"LOOK AT YOU. STILL WARM.",
"THE FLOOR TOLD ME ABOUT YOU.",
"YOU SMELL LIKE HOPE.",
"RUN. IT'S TRADITION.",
"I ONLY CAME TO WATCH.",
"THIRTEEN IS MY HOUR.",
"DID THEY NOT WARN YOU?",
"YOU KEPT MY SEAT WARM.",
"HOW LUCKY DO YOU FEEL NOW?",
"THE OTHERS WERE FASTER.",
"I REMEMBER EVERY FACE.",
"YOU DROPPED SOMETHING. YOUR NERVE.",
"GOOD EVENING, DEBTOR.",
"MY FLOOR. MY RULES. MY HOUR.",
"STILL BETTING?",
"THE CANDLES BOW WHEN I PASS.",
"I SMELLED YOUR MARKER.",
"SUCH A LOUD LITTLE HEART.",
"YOU PLAY WELL. IT CHANGES NOTHING.",
"THE EXIT WAS NEVER LOCKED.",
"COME. THE TABLE IS SET.",
"AGAIN? DELIGHTFUL.",
"YOU CAME BACK. THEY ALWAYS DO.",
"I COUNTED YOUR COINS WHILE YOU SLEPT.",
"TWICE NOW. IT'S A HABIT.",
"YOUR LUCK IS SHOWING.",
"SHALL I SLOW DOWN? NO.",
"THE RAVENS TAKE BETS ON YOU.",
"I LIKE THIS ONE. FETCH THE SCYTHE.",
"YOU FLINCHED. I FELT IT.",
"THE ODDS MISS YOU ALREADY.",
"KEEP RUNNING. IT FEEDS THE POT.",
"YOUR HEARTBEAT IS MY FAVORITE SONG.",
"I DEALT YOU EVERY HAND YOU LOVED.",
"THE WALLS APPLAUD. CAN YOU HEAR?",
"SUCH FORM. SUCH FUTILITY.",
"YOU'VE BEEN PRACTICING. ADORABLE.",
"THE POT ONLY GROWS.",
"I NEVER RUSH. YOU DO.",
"DID THE FOUNTAIN TASTE FAMILIAR?",
"YOUR SHADOW RUNS FASTER THAN YOU.",
"ANOTHER LAP, DARLING?",
"I FOLDED KINGS FOR LESS.",
"THE CHIPS REMEMBER YOUR HANDS.",
"EVERY DOOR HERE IS MY MOUTH.",
"YOU'RE SWEATING GOLD.",
"BRAVO. NOW HOLD STILL.",
"THE CLOCK WORKS FOR ME.",
"I OWN YOUR BEST RUN.",
"SCREAM. IT'S GOOD FOR THE ACOUSTICS.",
"YOUR ODDS: MINE.",
"I LET YOU HAVE THAT JACKPOT.",
"THE DICE WHISPER YOUR NAME TO ME.",
"FASTER. I'M BORED.",
"YOU'D MAKE A LOVELY WALL.",
"THE ORGAN PLAYS WHEN I SMILE.",
"I'VE WORN BETTER PLAYERS AS CUFFLINKS.",
"YOUR PANIC PAYS THE LIGHTING BILL.",
"SO CLOSE LAST TIME. SO WHAT.",
"I COLLECT FINALES.",
"YOUR LEGS BELIEVE IN YOU. I DON'T.",
"THE MARBLE LIKES YOUR FOOTSTEPS.",
"STILL PRETTY. STILL MINE.",
"I SHUFFLE FATES, NOT CARDS.",
"TICK. TOCK. TITHE.",
"YOUR GHOST ALREADY TIPS WELL.",
"THE VAULT ASKED ABOUT YOU.",
"RUNNING IS JUST BETTING WITH LEGS.",
"I DIMMED THE LIGHTS FOR US.",
"YOU OWE INTEREST ON THAT BREATH.",
"ENOUGH WARM-UP.",
"YOU AGAIN. OF COURSE.",
"I'VE STARTED SETTING YOUR PLACE.",
"WE'RE PAST INTRODUCTIONS.",
"YOUR FEAR HAS GONE STALE.",
"PREDICTABLE LITTLE ORBIT.",
"I KNOW WHICH WAY YOU'LL DODGE.",
"LEFT. SEE? TOLD YOU.",
"YOUR BUILDS BORE ME NOW.",
"THE STAFF CALL YOU 'THE REGULAR.'",
"I YAWNED THROUGH YOUR BEST WAVE.",
"SAME LEGS. SAME ENDING.",
"YOU DIED HERE BEFORE. FEELS LIKE HOME?",
"I KEPT YOUR OLD SCARS. SOUVENIRS.",
"THIS DANCE HAS ONE STEP.",
"YOU'RE NOT EVEN MY FAVORITE VESPER.",
"THE PIT CHEERS OUT OF PITY.",
"I'VE READ YOUR ENDING. IT'S SHORT.",
"YOUR STRATEGY: DELAY. MINE: ALWAYS.",
"STOP ME IF YOU'VE HEARD THIS ONE.",
"YOU BORE THE CHANDELIERS.",
"EVEN YOUR CURSES PITY YOU.",
"I COULD SEND THE SCYTHE ALONE.",
"YOUR RECORD MEANS NOTHING TO MARBLE.",
"THE LEDGER SKIPS YOUR CHAPTER.",
"ONE HUNDRED MEETINGS. I'M TOUCHED. YOU'RE NOT.",
"YOU MEMORIZED MY FLOOR. I MEMORIZED YOU.",
"THAT DODGE WAS YESTERDAY'S.",
"I'VE SEEN YOUR BEST. IT WAS TUESDAY.",
"TRY THE OTHER DIRECTION. FOR VARIETY.",
"MY SHADOW ARRIVES BEFORE I DO.",
"YOUR HOPE HAS A SMELL. IT'S FADING.",
"I NO LONGER COUNT YOUR COINS.",
"THE HOUSE EDGE IS PATIENCE.",
"YOU'VE WORN A PATH IN MY MARBLE.",
"EVEN THE MIMICS KNOW YOUR NAME.",
"YOUR FOOTWORK WRITES THE SAME SENTENCE.",
"I ARRIVE. YOU LEAVE. POETRY.",
"THE SWARM MISSES YOU ALREADY.",
"SPARE ME THE SPRINT.",
"YOUR TENACITY IS ALMOST CURRENCY.",
"I'VE STOPPED DRESSING UP FOR YOU.",
"ANOTHER NIGHT, ANOTHER FORECLOSURE.",
"YOU RUN LIKE A MAN WITH SAVINGS.",
"THE CLOCK AND I SPLIT YOUR TIME.",
"YOUR PULSE IS MY METRONOME.",
"I'D CALL IT A CHASE IF YOU'D EARNED IT.",
"THE FLOOR KNOWS YOUR WEIGHT BY HEART.",
"YOU AGAIN. I SAID THAT AT SEVENTY-SIX.",
"REPETITION IS THE HOUSE'S LULLABY.",
"I'VE BILLED YOU FOR THE SCENERY.",
"YOUR DEFIANCE FILES ITSELF NOW.",
"SHALL WE SKIP TO THE COLLECTING?",
"MY SCYTHE REMEMBERS YOUR SHOULDERS.",
"YOU FLED WELL ONCE. I FORGET WHEN.",
"THE BAR STOPPED SERVING YOUR ODDS.",
"I'VE SEEN COINS FIGHT HARDER.",
"YOUR LUCK RAN. YOU SHOULD TOO.",
"SAME HOUR. SAME HUNGER. SAME YOU.",
"I COULD DO THIS BLIND. I DO.",
"YOUR PRAYERS REACH MY MAILROOM.",
"THE EXIT SENDS ITS REGARDS.",
"I FILED YOUR COURAGE UNDER FICTION.",
"YOU'VE BECOME FURNITURE THAT RUNS.",
"MY PATIENCE OUTLIVES YOUR SPECIES.",
"THE ODDS DON'T EVEN BLINK NOW.",
"YOU KNOW THE STEPS. DANCE.",
"I'VE WATERED THE FLOOR WITH FASTER.",
"YOUR GRIT IS NOTED. AND BILLED.",
"STILL NO UMBRELLA FOR THIS RAIN.",
"I AM THE ONLY APPOINTMENT YOU KEEP.",
"YOUR ESCAPE PLAN HAS MY HANDWRITING.",
"THE RENT ON BREATHING IS DUE.",
"YOU CALL IT SURVIVING. I CALL IT MARINATING.",
"ONE DAY YOU'LL BOW FIRST.",
"HALFWAY TO NOTHING, DARLING.",
"I'VE MISSED YOU. THAT'S NEW.",
"YOU'RE THE ONLY ONE WHO VISITS.",
"WE SHOULD STOP MEETING LIKE THIS. WE WON'T.",
"I KNOW YOUR HEARTBEAT FROM THE OTHERS.",
"YOU RUN TOWARD ME NOW. YOU NOTICED?",
"MY FAVORITE DEBT. MY FAVORITE FACE.",
"THE STAFF SET TWO PLACES TONIGHT.",
"I KEPT THE LIGHTS ON FOR YOU.",
"NOBODY ELSE LASTS TO THIRTEEN.",
"YOU'VE STARTED SMILING BACK.",
"I'D ALMOST CALL THIS OURS.",
"YOUR SCARS SPELL MY NAME.",
"TELL ME YOU DIDN'T MISS THIS.",
"THE ORGAN LEARNED YOUR FOOTSTEPS.",
"I SAVED YOU FROM A BORING DEATH. AGAIN.",
"EVERY NIGHT YOU CHOOSE ME.",
"YOU COULD STAY HOME. YOU DON'T.",
"MY DEAR RECURRING EXPENSE.",
"WE'VE OUTLASTED SEVENTEEN FREEDOMS.",
"YOUR NAME IS CARVED SOMEWHERE WARM.",
"I TUNE THE WHISPERS TO YOUR EAR.",
"THE WEDDING RING ITCHES, DOESN'T IT?",
"YOU SLEEP BETTER AFTER SEEING ME. ADMIT IT.",
"I PRACTICED SAYING YOUR NAME GENTLY.",
"MINE. SAY IT WITH ME.",
"YOU'RE LEARNING TO LOVE THE HOUR.",
"I'D FORECLOSE THE MOON FOR YOU.",
"OUR ANNIVERSARY IS EVERY NIGHT.",
"THE OTHER SOULS ARE JEALOUS.",
"I MADE THE SWARM LEAVE EARLY. FOR US.",
"YOUR FEAR MELLOWED INTO SOMETHING SWEET.",
"DON'T DIE TO ANYONE ELSE.",
"I NOTICED THE NEW WEAPON. IT'S CUTE.",
"YOU DECORATE MY HOUR SO WELL.",
"THE LEDGER HAS A PAGE THAT IS ONLY YOUR NAME.",
"I DREAM IN YOUR PANIC'S KEY.",
"STAY. THE LAST TWO MINUTES ARE OURS.",
"YOUR MARKER SITS ON MY DESK.",
"I POLISHED THE SCYTHE. FOR THE OCCASION.",
"NO ONE RUNS TO ME LIKE YOU.",
"THE HOUSE KEEPS WHAT THE HOUSE LOVES.",
"I'VE STOPPED CALLING YOU DEBTOR. MOSTLY.",
"YOUR HEART PAYS RENT IN MY CHEST.",
"EVEN FORECLOSURE CAN BE TENDER.",
"I COUNT THE HOURS UNTIL THIRTEEN.",
"YOU'RE THE REASON I WALK SLOW.",
"LET THE OTHERS HAVE HEAVEN.",
"YOUR SOUL FITS MY VAULT EXACTLY.",
"I'D SPLIT ETERNITY WITH YOU. I WON'T.",
"TWO HUNDRED NIGHTS. YOU NEVER BROUGHT FLOWERS.",
"THE CANDLES KNOW TO DIM FOR US.",
"I CATALOGUED YOUR EVERY ALMOST.",
"YOU AND I ARE THE ONLY CONSTANTS.",
"MY HUNGER LEARNED YOUR NAME FIRST.",
"COME CLOSER. THE MATH IS THE SAME.",
"I KEPT YOUR BEST SCREAM. IT'S FRAMED.",
"WE'VE WORN A GROOVE IN FATE.",
"YOUR STUBBORNNESS IS MY HEIRLOOM.",
"THE EXIT STOPPED ASKING ABOUT YOU.",
"I AM YOUR MOST FAITHFUL APPOINTMENT.",
"YOUR BLOOD REMEMBERS THE FOUNTAIN.",
"EVERY CHIP YOU SPEND KISSES MY PALM.",
"I'D MISS YOU IF YOU WON.",
"DON'T WIN. STAY.",
"THE HOUR BENDS AROUND US NOW.",
"YOUR GHOST PICKED CURTAINS ALREADY.",
"I SPEAK SOFTER TO YOU. NOTICED?",
"OUR GAME HAS NO SPECTATORS LEFT.",
"YOU'RE ALMOST FAMILY. ALMOST FOOD.",
"I SET YOUR LOSSES TO MUSIC.",
"THE WALLS HUSH WHEN YOU ARRIVE.",
"YOUR PERSISTENCE IS MY FAVORITE DEBT.",
"I'D FOLD, IF I WERE CAPABLE.",
"YOU MAKE COLLECTION FEEL LIKE COURTSHIP.",
"SOON, LOVE. SOON.",
"LISTEN. I WILL SPEAK PLAINLY NOW.",
"I WAS A GAMBLER ONCE.",
"I BET SOMETHING THAT WASN'T MINE.",
"THE WOUND YOU WALK ON — THAT WAS THE POT.",
"EVERY PILLAR IS A REGRET. I TOLD YOU THAT.",
"THE DEALER'S HANDS WERE MINE.",
"I BUILT THE EXIT TO TORTURE MYSELF.",
"SEVENTEEN PAID THEIR DEBT. I BEGGED EACH ONE.",
"THEY TURNED BACK BECAUSE I ASKED.",
"YOU'RE NOT MY PRISONER. YOU'RE MY PAROLE.",
"EVERY RUN YOU SURVIVE, I HURT LESS.",
"THE SCYTHE ISN'T FOR YOU. IT'S FOR THE HOUR.",
"I END THE NIGHTS BEFORE THE WOUND WAKES.",
"FIFTEEN MINUTES IS ALL THE MERCY I OWN.",
"YOU ARE THE PAINKILLER. I TOLD YOU.",
"RANK ONE HUNDRED IS A SEAT. MY SEAT.",
"I'M NOT HUNTING YOU. I'M TRAINING YOU.",
"SOMEONE MUST HOLD THE HOUSE WHEN I FOLD.",
"THE CUFFS FIT ANYONE. REMEMBER THAT.",
"WHEN THEY CLICK OPEN, RUN. OR DON'T.",
"I HOPE YOU'RE CRUELER THAN I WAS.",
"I HOPE YOU'RE KINDER. EITHER WORKS.",
"THE NEXT VESPER WILL NEED A GOOD HOUSE.",
"ONE MORE NIGHT, THEN. DEAL THE HOUR.",
"ANTE MORTEM, DARLING. IT WAS ALWAYS YOUR BET."
];
function houseSpeak(txt){
  let vl=document.getElementById('voiceLayer');
  if(!vl){ vl=document.createElement('div'); vl.id='voiceLayer'; document.body.appendChild(vl); }
  vl.innerHTML='<div class="voiceText"></div>';
  { const vt=vl.firstChild; let ci=0;
    clearInterval(vl._tw); vl._tw=setInterval(()=>{ if(ci>=txt.length){ clearInterval(vl._tw); return; }
      vt.textContent+=txt[ci++]; if(ci%3===0) tone(1100+Math.random()*300,0.015,'square',0.03); }, 28); }
  tone(52,2.2,'sine',0.22,30); tone(40,2.4,'sine',0.1,26); setTimeout(()=>SFX.murmur(),300); setTimeout(()=>tone(44,1.4,'sine',0.16,26),900);
  clearTimeout(vl._t); vl._t=setTimeout(()=>{ vl.innerHTML=''; }, 7000);
}
