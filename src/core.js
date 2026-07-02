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
  spawn:{ startInt:1.0, minInt:0.28, ramp:300, baseBatch:3, max:340 },
  wave:{ first:18, grow:5, cap:88, nextAt:0.4, gap:1.15, eliteEvery:4 },
  slot:{ respinBase:14, respinStep:8, critPct:0.40, winSum:7, up:1.6, down:0.85, floor:0.5 },
  weights:{ common:54, rare:28, epic:13, legendary:5 },
  elite:{ every:40, firstAt:38 },
  scale:{ hp:0.52, dmg:0.17, spd:0.10, spdCap:1.85 },
  enemy:{
    shambler:{ hp:26, spd:90, dmg:8, r:13, xp:1, coins:1, col:'#5c6e50', dark:'#2c3a26' },
    husk:    { hp:15, spd:152,dmg:7, r:10, xp:1, coins:1, col:'#b9b2a0', dark:'#5a5347' },
    swarm:   { hp:9,  spd:176,dmg:6, r:8,  xp:1, coins:0, col:'#8a9a5a', dark:'#3a441f' },
    shooter: { hp:48, spd:66, dmg:10,r:14, xp:4, coins:4, col:'#c0913f', dark:'#4a3616', ranged:true },
    stalker: { hp:42, spd:158,dmg:12,r:12, xp:3, coins:3, col:'#8a3a6a', dark:'#3a1030' },
    hexer:   { hp:54, spd:70, dmg:12,r:15, xp:5, coins:5, col:'#6a4ab5', dark:'#241540', ranged:true },
    revenant:{ hp:230,spd:58, dmg:22,r:24, xp:8, coins:10,col:'#4a1015', dark:'#180406' },
    brute:   { hp:100,spd:64, dmg:17,r:20, xp:3, coins:3, col:'#7a1c22', dark:'#3a0c10' },
    wraith:  { hp:66, spd:128,dmg:15,r:15, xp:4, coins:4, col:'#7b5ea8', dark:'#2e2140' },
    elite:   { hp:580,spd:82, dmg:26,r:26, xp:16,coins:26,col:'#c98bff', dark:'#3a1a52' },
    leech:   { hp:70, spd:55, dmg:8, r:14, xp:5, coins:6, col:'#4a8a5a', dark:'#173a22' },
    bomber:  { hp:30, spd:120,dmg:10,r:11, xp:2, coins:2, col:'#ff8a2c', dark:'#5a2a08' },
    gilded:  { hp:90, spd:170,dmg:0, r:12, xp:6, coins:0, col:'#ffd36b', dark:'#7a5a1c' },
    pitboss: { hp:2600,spd:74,dmg:30,r:34, xp:40,coins:60, col:'#d4212f', dark:'#4a0a10' },
    croupier:{ hp:2100,spd:60,dmg:22,r:30, xp:40,coins:60, col:'#e8b64c', dark:'#4a3616' },
    collector:{hp:3200,spd:48,dmg:26,r:36, xp:50,coins:80, col:'#6a4ab5', dark:'#241540' },
    thehouse:{ hp:4400,spd:64,dmg:30,r:38, xp:70,coins:120,col:'#c98bff', dark:'#2a0a34' }
  }
};
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE_SCALE = Object.assign({}, CFG.scale);

/* ---------- canvas ---------- */
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let VW=0, VH=0, DPR=1;
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, window._qPrev===true?1:2);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = VW*DPR; cv.height = VH*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', ()=>{ resize(); if(embers&&embers.length) resetEmbers(); }); resize();

/* ---------- DOM refs ---------- */
const $ = id => document.getElementById(id);
const elMenu=$('menu'), elHud=$('hud'), elSlot=$('slot'), elGO=$('gameover'), elFlash=$('flash'), elStreak=$('streak');

/* ---------- helpers ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function fmt(n){ n=Math.round(n); const m=Math.floor(n/60), s=n%60; return m+':'+(s<10?'0':'')+s; }

/* ---------- game state ---------- */
let state='menu';
let P, enemies, bullets, orbs, coins, parts, texts, audience, ebullets=[];
let gt, spawnT, eliteT, shake, hitstop, camX, camY, killStreak, streakT, excite, fireAcc, pending, gilt=0, best=0;
let rings, sparks, grainC=null, grainReady=false;
let wave, waveClearTarget, waveGap, sideBoons=[];
let hallPillars=[], embers=[], chandeliers=[], fogPuffs=[], floorCracks=[], glassPools=[], gargoyles=[], soulCandles=[], ravens=[], vaultProp=null, interactable=null, interT=10, ghostPatrons=[], glints=[], ambientT=9;
let curReward=null, slotFloor=null, slotBusy=false, lastRites=false;
let slotReels=[], slotStage='idle', reelsStopped=0, stopLock=0, slotIndex=0, wg=null, slotKind='skill', gamble=null;
let selPos=0, selT=0, selHop=0.085, selStopping=false, selHopsLeft=0, selLandT=0, selWinner=0;
let xpTick=0;
let fever=0, feverOn=false, feverT=0, tarots=[], tarotT=14, decals=[];
let dice=[], diceShown=false, spaceHold=false, holdProg=0, holdFired=false;
let debuffs=[]; let bounty=null, bountyT=34; let bountyStk=0; let goldenT=0; let frameAvg=16, loopPrev=0, qLow=false;
let ovBonusNext=false, slowT=0, prevHp=0, dare=null, dareT=46;
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
  if(!bounty){ bountyT-=dt;
    if(bountyT<=0){ const cands=enemies.filter(e2=>!e2.boss && e2.type!=='gilded' && Math.hypot(e2.x-P.x,e2.y-P.y)<760);
      if(cands.length){ bounty={e:cands[(Math.random()*cands.length)|0], t:12};
        announce('☠ BOUNTY MARKED — 15 COINS ☠', true); SFX.casinoDing(); SFX.uiDing(); }
      else bountyT=6; }
  } else { bounty.t-=dt;
    if(bounty.t<3){ bounty.bp=(bounty.bp||0)-dt; if(bounty.bp<=0){ bounty.bp=0.4; tone(1350,0.05,'square',0.09); } }
    if(bounty.t<=0 || !enemies.includes(bounty.e)){ if(bounty.t<=0) bountyStk=0; bounty=null; bountyT=30+Math.random()*20; } }
  // spawn one random offering at a time
  if(!interactable){ interT-=dt;
    if(interT<=0){
      const kinds=['fountain','roulette','chest'];
      const kind=kinds[(Math.random()*kinds.length)|0];
      const a5=Math.random()*6.283, d5=320+Math.random()*360;
      interactable={ kind, x:clamp(P.x+Math.cos(a5)*d5,80,CFG.arena-80), y:clamp(P.y+Math.sin(a5)*d5,80,CFG.arena-80),
        life:(kind==='chest'?24:32), res:100, stand:0, spin:0, ph:0 };
      const names={fountain:'🩸 A BLOOD FOUNTAIN RISES', roulette:'🎡 A FLOOR BET OPENS', chest:'✦ THE HOUSE LEAVES A GIFT'};
      showStreak(names[kind]); SFX.tingle(); SFX.casinoDing();
    }
  } else {
    const it=interactable; it.life-=dt;
    if(it.life<3){ it._bp=(it._bp||0)-dt; if(it._bp<=0){ it._bp=0.5; tone(1500,0.05,'square',0.07); ring(it.x,it.y,58,'#ff9a3c'); } }
    const idist=Math.hypot(P.x-it.x,P.y-it.y);
    if(it.kind==='fountain'){
      if(idist<62 && it.res>0 && P.hp<P.maxHp){
        const drink=Math.min(it.res, 16*dt*(contractDone('bloodpact')?1.25:1));
        it.res-=drink; P.hp=Math.min(P.maxHp, P.hp+drink*0.95);
        if(Math.random()<0.25) parts.push({x:P.x+rnd(-8,8),y:P.y+rnd(-6,6),vx:0,vy:-40,life:0.5,col:'#ff5566',r:2});
      }
      if(it.res<=0){ if(idist<62) secret('drankdry','DRANK IT DRY'); burst(it.x,it.y,10,'#6e0f18'); despawnInter(); return; }
    } else if(it.kind==='roulette'){
      if(idist<52){ it.stand+=dt;
        if(it.stand>=1.6){ rouletteBet(it); despawnInter(); return; } }
      else it.stand=Math.max(0,it.stand-dt*2);
    } else if(it.kind==='chest'){
      if(idist<40){
        flash(0.22,'#ffd36b'); SFX.reelLock();
        LT.chests=(LT.chests||0)+1; bump('chests',LT.chests);
        P._chestsRun=(P._chestsRun||0)+1; if(P._chestsRun>=3) secret('glutton','GIFT GLUTTON');
        if(Math.random()<0.15){
          announce('☠ MIMIC! ☠', false); flash(0.5,'#8b1620'); SFX.bossRoar(); shake=Math.min(20,shake+10);
          for(let i2=0;i2<6 && enemies.length<CFG.spawn.max;i2++){ const sa3=Math.random()*6.283;
            spawnEnemy(i2<2?'stalker':'swarm', clamp(it.x+Math.cos(sa3)*60,20,CFG.arena-20), clamp(it.y+Math.sin(sa3)*60,20,CFG.arena-20)); }
        } else {
          const cg3=12+((Math.random()*10)|0);
          for(let gi=0;gi<cg3;gi++) coins.push({x:it.x+rnd(-14,14),y:it.y+rnd(-14,14),r:6,vx:rnd(-140,140),vy:rnd(-140,140)});
          coinRain(16); SFX.cashout(); SFX.dingBells(); announce('✦ TREASURE +'+cg3+' COINS ✦', true); flash(0.4,'#ffd36b'); sparkBurst(22);
        }
        burst(it.x,it.y,14,'#e8b64c'); despawnInter(); return;
      }
    }
    if(it.life<=0){ burst(it.x,it.y,8,'#5a4a3a'); despawnInter(); return; }
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
function despawnInter(){ if(interactable){ ring(interactable.x,interactable.y,50,'#5a4a3a'); } interactable=null; interT=16+Math.random()*18; }
function rouletteBet(rp){
  LT.roul=(LT.roul||0)+1; bump('roul',LT.roul);
  P._roulRun=(P._roulRun||0)+1; if(P._roulRun>=3) secret('wheeladdict','WHEEL ADDICT');
  SFX.reelLock(); SFX.diceRattle(); ring(rp.x,rp.y,80,'#e8b64c'); sparkBurst(18); shake=Math.min(14,shake+6);
  const r3=Math.random();
  if(r3<0.35){ const cg2=10+((Math.random()*8)|0); P.coins+=cg2; LT.coins+=cg2; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
    coinRain(14); SFX.cashout(); announce('◈ FLOOR BET PAYS +'+cg2+' COINS ◈', true); flash(0.35,'#ffd36b'); }
  else if(r3<0.60){ const hl2=Math.round(P.maxHp*0.15); P.hp=Math.min(P.maxHp,P.hp+hl2);
    announce('✚ FLOOR BET: +'+hl2+' BLOOD ✚', true); flash(0.35,'#8bff9a'); SFX.dingBells(); }
  else if(r3<0.80){ P.speed*=1.3; debuffs.push({label:'⚡ SWIFT WAGER +30%', t:8, dur:8, revert:()=>{ P.speed/=1.3; }, dot:0, poison:false});
    announce('⚡ FLOOR BET: +30% SPEED FOR 8s ⚡', true); flash(0.35,'#9adcff'); SFX.tingle(); }
  else { announce('☠ THE HOUSE CHEATS — AMBUSH! ☠', false); flash(0.45,'#8b1620'); SFX.bust();
    for(let i2=0;i2<5 && enemies.length<CFG.spawn.max;i2++){ const sa2=Math.random()*6.283;
      spawnEnemy('swarm', clamp(rp.x+Math.cos(sa2)*90,20,CFG.arena-20), clamp(rp.y+Math.sin(sa2)*90,20,CFG.arena-20)); } }
}
// Prefer the artifact-env storage API; otherwise shim it over localStorage (same keys) so local play keeps progress
const store = (typeof window!=='undefined' && window.storage) ? window.storage : (function(){
  try{ localStorage.setItem('am_probe','1'); localStorage.removeItem('am_probe'); }catch(e){ return null; }
  return {
    get: async(k)=>{ try{ const v=localStorage.getItem(k); return v==null?null:{value:v}; }catch(e){ return null; } },
    set: async(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} },
    delete: async(k)=>{ try{ localStorage.removeItem(k); }catch(e){} }
  };
})();
const owned = new Set();

/* ---------- entities ---------- */
function spawnEnemy(type,x,y){
  const b=CFG.enemy[type], mins=gt/60, S=CFG.scale;
  idxSee(BOSS_DEFS[type]?'b':'e', type);
  ring(x,y,b.r+26,'#5a1a6a'); for(let sp=0;sp<5;sp++){ const sa=Math.random()*6.283; parts.push({x:x+Math.cos(sa)*b.r,y:y+Math.sin(sa)*b.r,vx:Math.cos(sa)*-40,vy:Math.sin(sa)*-40,life:rnd(.25,.5),col:'#7a3aa8',r:rnd(1.5,3)}); }
  const hpS=1+mins*S.hp, dmgS=1+mins*S.dmg, spdS=Math.min(S.spdCap,1+mins*S.spd)*(P.enemySpeedBoost||1);
  enemies.push({type,x,y,r:b.r,hp:b.hp*hpS,maxhp:b.hp*hpS,spd:b.spd*spdS,dmg:b.dmg*dmgS,
    xp:b.xp,coins:b.coins,cd:0,flash:0,kx:0,ky:0,ph:Math.random()*6.28,col:b.col,dark:b.dark,elite:type==='elite',
    ranged:b.ranged||false, shootCd:rnd(0.8,2.6), born:gt, vt:(type==='bomber'?'husk':null)});
}
function startWave(){
  wave++;
  bump('wave',wave); recCheck('wave',wave,'Wave');
  if(wave>1){ SFX.casinoDing(); ftext(P.x,P.y-40,'WAVE '+wave,'#e8b64c',true); ring(P.x,P.y,64,'#e8b64c'); }
  if(wave>=10 && wave%10===0) spawnBoss();
  if(wave>0 && wave%7===0){ announce('✦ GOLDEN WAVE — THE GILDED WALK ✦', true); SFX.dingBells();
    for(let gw=0;gw<2;gw++){ const ga2=Math.random()*6.283, gd2=Math.max(VW,VH)*0.5;
      spawnEnemy('gilded', clamp(P.x+Math.cos(ga2)*gd2,20,CFG.arena-20), clamp(P.y+Math.sin(ga2)*gd2,20,CFG.arena-20)); } }
  if(wave>=4 && Math.random()<0.10){ const ga=Math.random()*6.283, gd=Math.max(VW,VH)*0.5;
    spawnEnemy('gilded', clamp(P.x+Math.cos(ga)*gd,20,CFG.arena-20), clamp(P.y+Math.sin(ga)*gd,20,CFG.arena-20));
    showStreak('✦ A GILDED SOUL APPEARS ✦'); SFX.tingle(); }
  // expire curses
  if(P.curses){ for(let i=P.curses.length-1;i>=0;i--){ if(--P.curses[i].waves<=0){ try{P.curses[i].revert();}catch(e){} P.curses.splice(i,1); } } renderRelics(); }
  // difficulty steps up every 5 waves
  if(wave>1 && wave%5===0){ CFG.scale.hp+=0.08; CFG.scale.dmg+=0.02; CFG.scale.spdCap=Math.min(2.3,CFG.scale.spdCap+0.08); showStreak('THE HOUSE GROWS CRUEL'); SFX.murmur(); flash(0.3,'#8b1620'); }
  const W=CFG.wave;
  const size=Math.min(W.cap, W.first + (wave-1)*W.grow);
  const eliteWave = wave % W.eliteEvery === 0;
  for(let i=0;i<size && enemies.length<CFG.spawn.max;i++){
    const a=Math.random()*6.283, d=Math.max(VW,VH)*0.6+rnd(30,220);
    const x=clamp(P.x+Math.cos(a)*d,20,CFG.arena-20), y=clamp(P.y+Math.sin(a)*d,20,CFG.arena-20);
    let t='shambler', roll=Math.random();
    if(wave>=2 && roll<0.30) t='husk';
    if(wave>=4 && roll>=0.30 && roll<0.36) t='bomber';
    if(wave>=5 && roll>=0.87 && roll<0.90) t='leech';
    if(wave>=3 && roll>=0.48 && roll<0.58) t='shooter';
    if(wave>=4 && roll>=0.58 && roll<0.70) t='wraith';
    if(wave>=6 && roll>=0.70 && roll<0.80) t='stalker';
    if(wave>=9 && roll>=0.80 && roll<0.87) t='hexer';
    if(wave>=3 && roll>=0.90 && roll<0.955) t='brute';
    if(wave>=8 && roll>=0.955) t='revenant';
    spawnEnemy(t,x,y);
  }
  // HORDE: a fast swarm pours in from one flank
  if(wave>=2 && (wave%2===0 || Math.random()<0.4)){
    const ha=Math.random()*6.283, hd=Math.max(VW,VH)*0.62;
    const hx=clamp(P.x+Math.cos(ha)*hd,40,CFG.arena-40), hy=clamp(P.y+Math.sin(ha)*hd,40,CFG.arena-40);
    const hn=14+wave*2;
    for(let k=0;k<hn && enemies.length<CFG.spawn.max;k++){ spawnEnemy('swarm', clamp(hx+rnd(-170,170),20,CFG.arena-20), clamp(hy+rnd(-170,170),20,CFG.arena-20)); }
    setTimeout(()=>{ if(state==='playing'){ showStreak('HORDE INCOMING'); SFX.murmur(); } }, 260);
  }
  if(eliteWave){
    const n=1+Math.floor(wave/8);
    for(let k=0;k<n;k++){ const a=Math.random()*6.283, d=Math.max(VW,VH)*0.6; spawnEnemy('elite',clamp(P.x+Math.cos(a)*d,20,CFG.arena-20),clamp(P.y+Math.sin(a)*d,20,CFG.arena-20)); }
    showStreak('WAVE '+wave+' · ELITE'); SFX.murmur(); flash(0.3,'#c98bff');
  } else {
    showStreak('WAVE '+wave);
  }
  waveClearTarget=Math.ceil(size*W.nextAt);
  waveGap=W.gap;
}
function enemyShoot(e){
  const base=Math.atan2(P.y-e.y,P.x-e.x), sp=200;
  const shots = e.type==='hexer'?3:1, spread=0.34;
  for(let i=0;i<shots;i++){
    const ang=base+(shots>1?(i-(shots-1)/2)*spread:0);
    ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:8,dmg:e.dmg*1.1,life:4.5});
  }
  burst(e.x,e.y,3,'#ffce5a'); SFX.eshoot();
}
function hurtPlayer(dmg){
  if(P.ovT>=90) dmg=Math.round(dmg*1.5);
  if(P.frail) dmg=Math.round(dmg*1.25);
  if(P.armor) dmg=Math.max(1,dmg-P.armor);
  if(P.inv<=0) P.noDmgStreak=0;
  if(P.inv>0) return;
  P.hp-=dmg; P.inv=0.5+(P.invBonus||0); shake=Math.min(11,shake+5); flash(0.35,'#8b1620'); SFX.hurt();
  if(P.thorns){ for(const e of enemies){ if(Math.hypot(e.x-P.x,e.y-P.y)<70){ e.hp-=P.thorns; e.flash=0.12; ftext(e.x,e.y,Math.round(P.thorns),'#ff9a9a'); } } ring(P.x,P.y,70,'#ff6b6b'); }
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
  ring(e.x,e.y,e.r*1.9,'#ffffff'); { const ex=e.x,ey=e.y,er=e.r; setTimeout(()=>{ if(state==='playing') ring(ex,ey,er*2.7,'#e8b64c'); },70); }
  P.kills++;
  if(P.onKillHeal) P.hp=Math.min(P.maxHp,P.hp+P.onKillHeal);
  LT.kills++; bump('ltKills',LT.kills); P.noDmgStreak=(P.noDmgStreak||0)+1; bump('noDmg',P.noDmgStreak);
  if(decals.length<(GFX.lite?8:40)) decals.push({x:e.x+rnd(-4,4),y:e.y+rnd(-2,6),r:e.r*(0.8+Math.random()*0.6),a:rnd(0,6.28),t:0,max:14+Math.random()*8}); bump('runKills',P.kills); recCheck('kills',P.kills,'Kills');
  LT.killsBy[e.type]=(LT.killsBy[e.type]||0)+1; bump('ek_'+e.type, LT.killsBy[e.type]);
  if(e.type==='bomber'){ ring(e.x,e.y,74,'#ff8a2c'); burst(e.x,e.y,16,'#ff8a2c'); SFX.nova(); shake=Math.min(14,shake+5);
    if(Math.hypot(P.x-e.x,P.y-e.y)<74) hurtPlayer(e.dmg*1.4);
    for(const o of enemies){ if(o!==e && Math.hypot(o.x-e.x,o.y-e.y)<74){ o.hp-=40; o.flash=0.1; } } }
  if(e.type==='gilded'){ LT.gilded++; bump('gilded',LT.gilded);
    if(feverOn) secret('goldongold','GOLD ON GOLD');
    for(let gi=0;gi<(contractDone('dividend')?28:14);gi++) coins.push({x:e.x+rnd(-12,12),y:e.y+rnd(-12,12),r:6,vx:rnd(-130,130),vy:rnd(-130,130)});
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
    bigWin(BOSS_DEFS[e.bossKind].name+' FALLS',4); coinRain(30); stopDrone();
    pending.push({floor:'epic'});
    for(let gi=0;gi<16;gi++) coins.push({x:e.x+rnd(-20,20),y:e.y+rnd(-20,20),r:6,vx:rnd(-150,150),vy:rnd(-150,150)}); }
  orbs.push({x:e.x,y:e.y,xp:e.xp*(P.xpMult||1),r:5,vx:rnd(-30,30),vy:rnd(-30,30)});
  const cn=Math.round(e.coins*P.coinMult);
  for(let i=0;i<cn;i++) coins.push({x:e.x+rnd(-8,8),y:e.y+rnd(-8,8),r:6,vx:rnd(-70,70),vy:rnd(-70,70)});
  burst(e.x,e.y,e.elite?34:14,e.elite?'#c98bff':'#c81e2c');
  ash(e.x,e.y,e.elite?16:7);
  // blood mist + rising soul wisp
  for(let i=0;i<(e.elite?6:3);i++){ const a=Math.random()*6.28,s=rnd(8,40); parts.push({x:e.x+rnd(-6,6),y:e.y+rnd(-6,6),vx:Math.cos(a)*s,vy:Math.sin(a)*s-14,life:rnd(.5,1.0),col:'rgba(120,16,26,0.55)',r:rnd(5,9),ash:true}); }
  parts.push({x:e.x,y:e.y-4,vx:rnd(-8,8),vy:-rnd(46,70),life:rnd(.7,1.0),col:e.elite?'#d9b8ff':'#9adcff',r:2.4});
  ring(e.x,e.y,e.elite?60:e.r+10,e.elite?'#c98bff':'#7a1c22');
  if(P.explode){ for(const o of enemies){ if(o!==e && Math.hypot(o.x-e.x,o.y-e.y)<80){ o.hp-=P.damage*1.2; o.flash=0.1; } } burst(e.x,e.y,10,'#ff9a5b'); ring(e.x,e.y,80,'#ff9a5b'); }
  if(dare) dare.got++;
  killStreak++; streakT=1.0;
  if(STREAK_MS.includes(killStreak)){
    const big9=killStreak>=100;
    announce('⚔ '+killStreak+' STREAK ⚔', true);
    LT.milestone=Math.max(LT.milestone||0,killStreak); bump('milestone',killStreak);
    SFX.casinoDing(); if(big9){ SFX.dingBells(); flash(0.3,'#ffd36b'); sparkBurst(16); hitstop=Math.max(hitstop,0.07); ring(P.x,P.y,150,'#ffd36b'); }
    if(killStreak>=500){ secret('streak500','THE FIVE HUNDRED'); bigWin('500 STREAK',4); coinRain(40); }
  } { const kf=440*Math.pow(1.0595,Math.min(24,killStreak)); tone(kf,0.07,'triangle',0.09,kf*2); tone(kf*2,0.05,'sine',0.045); } excite=Math.min(1,excite+(e.elite?0.5:0.05)); bump('streak',killStreak); recCheck('streak',killStreak,'Streak');
  if(!feverOn){ const pf9=fever; fever=Math.min(1, fever+(e.elite?0.09:(e.boss?0.5:0.016))*(1+0.08*vlv('fever')));
    if(pf9<0.5&&fever>=0.5) SFX.uiDing();
    if(pf9<0.9&&fever>=0.9){ SFX.casinoDing(); flash(0.12,'#ffd36b'); }
    if(fever>=1) startFever(); }
  if(killStreak===10||killStreak===25||killStreak===50||killStreak===100||killStreak===200){
    const tier=killStreak>=200?5:killStreak>=100?4:killStreak>=50?3:killStreak>=25?2:1;
    showStreak(killStreak+' STREAK'); SFX.cheer(); SFX.dingHit(tier); if(tier>=3) SFX.dingBells();
    flash(0.2+tier*0.06,'#ffd36b'); shake=Math.min(18,shake+3+tier*2); coinRain(tier*4);
    ring(P.x,P.y,90+tier*30,'#ffd36b');
  }
  if(e.elite){ shake=Math.min(20,shake+11); flash(0.55,'#c98bff'); SFX.cheer(); ring(e.x,e.y,140,'#c98bff'); pending.push({floor:'epic'}); }
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
    ctx.fillStyle='rgba('+eyeRGB+','+bl+')'; ctx.shadowColor=eyeHex; ctx.shadowBlur=12;
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
  if(keys.has('w')||keys.has('arrowup'))my-=1;
  if(keys.has('s')||keys.has('arrowdown'))my+=1;
  if(keys.has('a')||keys.has('arrowleft'))mx-=1;
  if(keys.has('d')||keys.has('arrowright'))mx+=1;
  if(touch.active && mx===0 && my===0){ const dx=touch.wx-P.x, dy=touch.wy-P.y, d=Math.hypot(dx,dy); if(d>6){ mx=dx/d; my=dy/d; } }
  const ml=Math.hypot(mx,my); if(ml>0){ mx/=ml; my/=ml; P.aim=Math.atan2(my,mx); }
  P.x=clamp(P.x+mx*P.speed*dt,14,CFG.arena-14);
  P.y=clamp(P.y+my*P.speed*dt,14,CFG.arena-14);
  P.moving = ml>0;
  if(P.inv>0)P.inv-=dt;
  tickDebuffs(dt); tickSmites(dt); tickFever(dt); tickTarot(dt); tickMapProps(dt); tickWheelTok(dt); tickCrashTok(dt); tickVaultDoor();
  if(parts.length>GFX.pcap) parts.splice(0,parts.length-GFX.pcap);
  if(coins.length>240) coins.splice(0,coins.length-240);
  if(P.ovT>0){ P.ovAge+=dt;
    P.ovT-=dt*(3.3+P.ovAge*0.35);
    P._ovHb=(P._ovHb||0)-dt; if(P._ovHb<=0){ P._ovHb=Math.max(0.16,(11-P.ovHold)/40); tone(56,0.1,'sine',0.13,44); }
    if(Math.random()<0.5) parts.push({x:P.x+rnd(-14,14),y:P.y+rnd(-8,12),vx:rnd(-16,16),vy:-rnd(60,140),life:rnd(.25,.5),col:'#ffd36b',r:rnd(1.4,2.6)});
    if(P.ovT>=90){ const ph9=P.ovHold; P.ovHold+=dt;
      if(Math.floor(P.ovHold)>Math.floor(ph9)){ tone(880+P.ovHold*90,0.1,'sine',0.12); flash(0.07,'#8bff9a'); }
      if(P.ovHold>=ascTime) rageAscend();
    } else if(P.ovT>0) rageDrop();
  }
  if(ascPend>0){ const pp=ascPend; ascPend-=dt;
    if(Math.ceil(ascPend)<Math.ceil(pp) && ascPend>0 && ascPend<=3){ tone(880+(3-Math.ceil(ascPend))*220,0.12,'sine',0.12); flash(0.08,'#8bff9a'); }
    if(ascPend<=0){ ascPend=0; spawnAscentGate(); }
  }
  if(slowT>0) slowT-=dt;
  if(P.hp<prevHp && P.hp/P.maxHp<0.15 && prevHp/P.maxHp>=0.15){ slowT=0.5+(P.slowEdge||0); SFX.thud(); flash(0.4,'#8b1620'); }
  prevHp=P.hp;
  if(!dare){ dareT-=dt;
    if(dareT<=0){ dare={need:12+Math.floor(wave*0.6), got:0, t:10};
      announce('⚔ HOUSE DARE — '+dare.need+' KILLS IN 10s → +40 ◈ ⚔', true); SFX.casinoDing(); }
  } else { dare.t-=dt;
    if(dare.got>=dare.need){ P.coins+=40; LT.coins+=40; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
      announce('⚔ DARE MET — +40 COINS ⚔', true); SFX.cashout(); SFX.dingBells(); coinRain(16); sparkBurst(26); flash(0.3,'#8bff9a'); dare=null; dareT=40+Math.random()*24; }
    else if(dare.t<=0){ announce('… THE HOUSE SCOFFS …', false); SFX.thud(); dare=null; dareT=40+Math.random()*24; }
  }
  if(P.hp/P.maxHp<0.25){ P._hb=(P._hb||0)-dt; if(P._hb<=0){ P._hb=0.85; tone(56,0.16,'sine',0.22,44); setTimeout(()=>tone(50,0.13,'sine',0.16,40),160); }
    if(!P._rites){ P._rites=true; showStreak('☨ LAST RITES ☨'); SFX.murmur(); startDrone(); flash(0.4,'#8b1620'); }
  } else if(P._rites && P.hp/P.maxHp>0.38){ P._rites=false; stopDrone(); showStreak('✦ THE BLOOD RETURNS ✦'); SFX.tingle(); }
  const _mn=Math.floor(gt/60); if(_mn>(P._lastMin||0)){ P._lastMin=_mn; bump('minutes',_mn); recCheck('minutes',_mn,'Minutes');
    if(_mn%3===0){ P.coinMult+=1;
      debuffs.push({label:'✨ GOLDEN HOUR ×2 COINS', t:20, dur:20, revert:()=>{ P.coinMult-=1; }, dot:0, poison:false, good:true});
      goldenT=20;
      announce('✨ GOLDEN HOUR — DOUBLE COINS 20s ✨', true);
      SFX.dingBells(); SFX.casinoDing(); flash(0.4,'#ffd36b'); coinRain(12); } }
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
  const orbitL=P.wlv.orbit||0, scytheL=P.wlv.scythe||0, chandL=P.wlv.chand||0, knivesL=P.wlv.knives||0, auraL=P.wlv.aura||0;
  const cardsL=P.wlv.cards||0, novaL=P.wlv.nova||0, seekerL=P.wlv.seeker||0;
  const coilL=P.wlv.coil||0, mortarL=P.wlv.mortar||0, lanternL=P.wlv.lantern||0, fangsL=P.wlv.fangs||0, bellL=P.wlv.bell||0, diceL=P.wlv.dice||0, phantomL=P.wlv.phantom||0, coffinL=P.wlv.coffin||0, mothsL=P.wlv.moths||0;
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

  // waves
  if(enemies.length<=waveClearTarget){ waveGap-=dt; if(waveGap<=0) startWave(); }
  else { waveGap=CFG.wave.gap; }

  const auraR=auraL?(86+auraL*12):0, orbitR=54+orbitL*4;
  // enemies
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    const dx=P.x-e.x, dy=P.y-e.y, d=Math.hypot(dx,dy)||1;
    if((e.boss && bossAI(e,dt,dx,dy,d)) || (!e.boss && specialAI(e,dt,dx,dy,d))){}
    else if(e.ranged){
      const range=330;
      if(d>range+40){ e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt; }
      else if(d<range-60){ e.x-=dx/d*e.spd*0.7*dt; e.y-=dy/d*e.spd*0.7*dt; }
      else { e.x+=-dy/d*e.spd*0.5*dt; e.y+=dx/d*e.spd*0.5*dt; } // strafe
      e.shootCd-=dt;
      if(e.shootCd<=0 && d<560){ e.shootCd=1.9+Math.random()*0.8; enemyShoot(e); }
    } else {
      e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
    }
    if(e.kx||e.ky){ e.x+=e.kx*dt; e.y+=e.ky*dt; e.kx*=0.82; e.ky*=0.82; if(Math.abs(e.kx)<2)e.kx=0; if(Math.abs(e.ky)<2)e.ky=0; }
    if(e.flash>0) e.flash-=dt;
    if(!GFX.lite) for(let j=i-1;j>=Math.max(0,i-6);j--){
      const o=enemies[j], ox=e.x-o.x, oy=e.y-o.y, od=ox*ox+oy*oy, mr=e.r+o.r;
      if(od<mr*mr && od>0.01){ const md=Math.sqrt(od), push=(mr-md)/md*0.5; e.x+=ox*push; e.y+=oy*push; o.x-=ox*push; o.y-=oy*push; }
    }
    e.cd-=dt;
    if(d<e.r+P.radius && e.cd<=0 && e.dmg>0){ hurtPlayer(e.dmg); e.cd=0.6; }
    if(auraL && d<auraR){ e.hp-=P.damage*(1.0+0.35*auraL)*dt; if(Math.random()<0.05)burst(e.x,e.y,1,'#8bff9a'); }
    if(scytheL){ let ea=Math.atan2(e.y-P.y,e.x-P.x)-P.scytheA; ea=Math.atan2(Math.sin(ea),Math.cos(ea)); if(Math.abs(ea)<0.6 && d<(90+scytheL*8)){ e.hp-=P.damage*(2.6+0.9*scytheL)*dt; e.flash=0.08; if(Math.random()<0.25)burst(e.x,e.y,1,'#e8b64c'); } }
    if(orbitL){ for(let k=0;k<orbitL;k++){ const oa=P.orbitA+k*(6.28/orbitL), ox=P.x+Math.cos(oa)*orbitR, oy=P.y+Math.sin(oa)*orbitR; if(Math.hypot(e.x-ox,e.y-oy)<e.r+9){ e.hp-=P.damage*(1.4+0.4*orbitL)*dt*3; if(Math.random()<0.3)burst(ox,oy,1,'#e8b64c'); } } }
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
    if(b.life<=0){ bullets.splice(i,1); continue; }
    for(let j=enemies.length-1;j>=0;j--){
      const e=enemies[j], dx=e.x-b.x, dy=e.y-b.y, rr=(e.r+b.r);
      if(dx*dx+dy*dy<rr*rr){
        let dmg=b.dmg;
        if(b.kill && !e.elite){ dmg=e.hp; burst(e.x,e.y,10,'#fff'); ftext(e.x,e.y,'FATAL','#ff5566',true); }
        if(P.godT>0 && !e.boss){ dmg=Math.max(dmg,e.hp+1); burst(b.x,b.y,5,'#8bff9a'); }
        { const hm=b.crit?9:5; spark(b.x-hm,b.y-hm,b.x+hm,b.y+hm,'#fff'); spark(b.x+hm,b.y-hm,b.x-hm,b.y+hm,b.crit?'#ffd36b':'#fff'); }
        if(b.crit) tone(2350,0.05,'triangle',0.085,1600);
        if(b.lucky){ dmg*=2; burst(b.x,b.y,10,'#ffd36b'); ftext(e.x,e.y-10,'LUCKY!','#ffd36b',true); SFX.casinoDing(); }
        e.hp-=dmg; e.flash=0.1;
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
          if(cand.length){ const t2=cand[(Math.random()*cand.length)|0], sp2=Math.hypot(b.vx,b.vy)||300, a2=Math.atan2(t2.y-b.y,t2.x-b.x);
            b.vx=Math.cos(a2)*sp2; b.vy=Math.sin(a2)*sp2; b.life=Math.max(b.life,0.9); ftext(b.x,b.y,'⚂','#c98bff'); tone(900+Math.random()*300,0.05,'square',0.06); break; } }
        hitstop=Math.max(hitstop,b.crit?0.045:0.015);
        if(spk){ let hits=0, from=e, jumps=spk+1; const used=new Set([j]); while(hits<jumps){ let ni=-1,nd=150*150; for(let k=0;k<enemies.length;k++){ if(used.has(k))continue; const o=enemies[k],od=(o.x-from.x)*(o.x-from.x)+(o.y-from.y)*(o.y-from.y); if(od<nd){nd=od;ni=k;} } if(ni<0)break; const o=enemies[ni]; spark(from.x,from.y,o.x,o.y); o.hp-=dmg*(0.45+0.05*spk); o.flash=0.1; used.add(ni); from=o; hits++; } }
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
    if(d<P.radius+6){ gainXP(o.xp); orbs.splice(i,1); }
  }
  // coins
  for(let i=coins.length-1;i>=0;i--){
    const c=coins[i], dx=P.x-c.x, dy=P.y-c.y, d=Math.hypot(dx,dy);
    c.vx*=0.9; c.vy*=0.9; c.x+=c.vx*dt; c.y+=c.vy*dt;
    const range=P.lode?9999:P.pickup;
    if(d<range){ const pull=P.lode?520:400; c.x+=dx/d*pull*dt; c.y+=dy/d*pull*dt; }
    if(d<P.radius+7){ if(P.ovT>0){ coins.splice(i,1); P.ovT=Math.min(100,P.ovT+2.5*(P.ovFeed||1)); tone(600+P.ovT*9,0.06,'sine',0.1); flash(0.06,'#ffd36b'); ftext(P.x,P.y-12,'+FUEL','#ffd36b'); burst(P.x,P.y,3,'#ff9a3c'); continue; } const gain=Math.max(1,Math.round(P.comboMult)); P.coins+=gain; LT.coins+=gain; if(P.coins===777) secret('sevens','TRIPLE SEVENS'); bump('runCoins',P.coins); bump('ltCoins',LT.coins); if(P.midas)P.midasStacks=Math.min(25,P.midasStacks+1); coins.splice(i,1);
      { const n8=performance.now(); P._coinCombo=(n8-(P._coinT||0)<800)?(P._coinCombo||0)+1:0; P._coinT=n8;
        tone(700*Math.pow(1.0595,Math.min(16,P._coinCombo)),0.06,'sine',0.07);
        if(P._coinCombo>0 && P._coinCombo%10===0){ SFX.casinoDing(); sparkBurst(8); }
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
  if(shake>0)shake=Math.max(0,shake-dt*30);
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function inView(x,y,pad){ return P && Math.abs(x-P.x)<VW/2+pad && Math.abs(y-P.y)<VH/2+pad; }
function drawWallsAndCarpet(){
  const A=CFG.arena, C0=A/2;
  // perimeter wall — dark wainscot band + gold rail
  ctx.fillStyle='#0a0509'; ctx.fillRect(0,0,A,26); ctx.fillRect(0,A-26,A,26); ctx.fillRect(0,0,26,A); ctx.fillRect(A-26,0,26,A);
  ctx.strokeStyle='rgba(232,182,76,0.28)'; ctx.lineWidth=2; ctx.strokeRect(28,28,A-56,A-56);
  ctx.strokeStyle='rgba(90,20,30,0.5)'; ctx.lineWidth=6; ctx.strokeRect(13,13,A-26,A-26);
  // torch sconces along the walls
  for(let i=0;i<10;i++){ const p=60+i*(A-120)/9;
    [[p,20],[p,A-20],[20,p],[A-20,p]].forEach(pt=>{
      if(!inView(pt[0],pt[1],140) || (qLow && (((pt[0]+pt[1])/60|0)%2))) return;
      const fl=0.6+Math.sin(gt*7+pt[0]*0.31+pt[1]*0.17)*0.3;
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const tg=ctx.createRadialGradient(pt[0],pt[1],0,pt[0],pt[1],42);
      tg.addColorStop(0,'rgba(255,150,50,'+(fl*0.22)+')'); tg.addColorStop(1,'rgba(255,120,30,0)');
      ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(pt[0],pt[1],42,0,6.28); ctx.fill(); ctx.restore();
      ctx.fillStyle='rgba(255,190,90,'+fl+')'; ctx.beginPath(); ctx.ellipse(pt[0],pt[1],2.4,4.4+fl*1.6,0,0,6.28); ctx.fill();
      ctx.fillStyle='#3a2a18'; ctx.fillRect(pt[0]-2,pt[1]+4,4,6);
    }); }
  // hanging house banners along the north & south walls
  for(let bi=0;bi<4;bi++){
    const bx2=A*0.2+bi*A*0.2;
    for(const wy2 of [30, A-30]){
      if(!inView(bx2,wy2,180)) continue;
      const swb=Math.sin(gt*1.1+bi*1.7+wy2)*3, dn=wy2<A/2?1:-1;
      const bg2=ctx.createLinearGradient(bx2,wy2,bx2,wy2+dn*86);
      bg2.addColorStop(0,'#6e0f18'); bg2.addColorStop(1,'#2a050a');
      ctx.fillStyle=bg2;
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
      const wk=Math.sin(gt*0.9+pi2*2.4+wx2)>0.93;
      if(wk){ ctx.fillStyle='rgba(255,80,80,0.75)';
        ctx.beginPath(); ctx.arc(px3-2,py3-9,0.9,0,6.28); ctx.arc(px3+2,py3-9,0.9,0,6.28); ctx.fill(); }
    }
  }
  // grand crimson carpet runner (N-S), parts under the sigil hidden by it
  const cw=110;
  ctx.fillStyle='rgba(90,14,22,0.55)'; ctx.fillRect(C0-cw/2,26,cw,A-52);
  ctx.fillStyle='rgba(60,8,14,0.5)'; ctx.fillRect(C0-cw/2,26,8,A-52); ctx.fillRect(C0+cw/2-8,26,8,A-52);
  ctx.strokeStyle='rgba(232,182,76,0.35)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(C0-cw/2+12,26); ctx.lineTo(C0-cw/2+12,A-26); ctx.moveTo(C0+cw/2-12,26); ctx.lineTo(C0+cw/2-12,A-26); ctx.stroke();
  for(let y=70;y<A-40;y+=140){ ctx.fillStyle='rgba(232,182,76,0.16)'; ctx.font='16px serif'; ctx.textAlign='center'; ctx.fillText('❖',C0,y); }
}
function drawLandmarks(){
  // THE VAULT — colossal circular door at the north wall
  if(vaultProp){ ctx.save(); ctx.translate(vaultProp.x,vaultProp.y);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0,52,86,14,0,0,6.28); ctx.fill();
    const vg2=ctx.createRadialGradient(0,0,10,0,0,80); vg2.addColorStop(0,'#5a4a2c'); vg2.addColorStop(0.7,'#2e2414'); vg2.addColorStop(1,'#171008');
    ctx.fillStyle=vg2; ctx.beginPath(); ctx.arc(0,0,78,0,6.28); ctx.fill();
    ctx.strokeStyle='#e8b64c'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,78,0,6.28); ctx.stroke();
    ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,58,0,6.28); ctx.stroke();
    for(let k2=0;k2<8;k2++){ const va=k2*0.785+gt*0.05;
      ctx.strokeStyle='rgba(232,182,76,0.6)'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(Math.cos(va)*24,Math.sin(va)*24); ctx.lineTo(Math.cos(va)*54,Math.sin(va)*54); ctx.stroke();
      ctx.fillStyle='#caa64e'; ctx.beginPath(); ctx.arc(Math.cos(va)*68,Math.sin(va)*68,4,0,6.28); ctx.fill(); }
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
      ctx.font="700 12px 'Cinzel',serif"; ctx.fillText('SPACE — ENTER', 0, 128); }
    ctx.restore(); }
  // ghost patrons — spirits of dead gamblers drifting the hall
  ctx.save();
  for(const g of ghostPatrons){
    if(!GFX.ghosts || g.al<=0.01 || !inView(g.x,g.y,120)) continue;
    const sw3=Math.sin(gt*1.4+g.ph)*3, hov3=Math.sin(gt*2+g.ph)*2;
    ctx.globalAlpha=g.al*0.34;
    const pg2=ctx.createLinearGradient(0,-26,0,14);
    ctx.save(); ctx.translate(g.x+sw3, g.y+hov3);
    pg2.addColorStop(0,'#8a97b5'); pg2.addColorStop(1,'rgba(90,100,130,0)');
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
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0,8,52,18,0,0,6.28); ctx.fill();
      ctx.fillStyle='#2e2430'; ctx.beginPath(); ctx.ellipse(0,0,50,26,0,0,6.28); ctx.fill();
      ctx.fillStyle=alive?'#6e0f18':'#241014'; ctx.beginPath(); ctx.ellipse(0,0,40,19,0,0,6.28); ctx.fill();
      if(alive){ ctx.save(); ctx.globalCompositeOperation='lighter';
        const fg3=ctx.createRadialGradient(0,0,0,0,0,64); fg3.addColorStop(0,'rgba(200,30,44,0.28)'); fg3.addColorStop(1,'rgba(200,30,44,0)');
        ctx.fillStyle=fg3; ctx.beginPath(); ctx.arc(0,0,64,0,6.28); ctx.fill(); ctx.restore();
        for(let d2=0;d2<3;d2++){ const dy2=((it.ph*40+d2*14)%26); ctx.fillStyle='rgba(255,80,90,0.8)'; ctx.beginPath(); ctx.arc(rnd(-2,2), -22+dy2, 2,0,6.28); ctx.fill(); } }
      ctx.fillStyle='#3a2f40'; ctx.fillRect(-4,-30,8,22);
      ctx.fillStyle=alive?'#c81e2c':'#3a1a20'; ctx.beginPath(); ctx.moveTo(0,-36); ctx.lineTo(6,-28); ctx.lineTo(-6,-28); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(-26,26,52,5);
      ctx.fillStyle='#c81e2c'; ctx.fillRect(-26,26,52*(Math.max(0,it.res)/100),5);
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
      if(it.stand>0){ ctx.strokeStyle='#8bff9a'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,66,-1.57,-1.57+it.stand/1.6*6.283); ctx.stroke(); }
      ctx.restore();
    } else if(it.kind==='chest'){
      const hb2=Math.sin(gt*3.4)*2;
      ctx.save(); ctx.translate(it.x,it.y+hb2*0.4);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const cg2=ctx.createRadialGradient(0,0,0,0,0,52); cg2.addColorStop(0,'rgba(255,210,90,0.30)'); cg2.addColorStop(1,'rgba(255,190,60,0)');
      ctx.fillStyle=cg2; ctx.beginPath(); ctx.arc(0,0,52,0,6.28); ctx.fill(); ctx.restore();
      ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0,15,26,8,0,0,6.28); ctx.fill();
      ctx.fillStyle='#3a2415'; ctx.fillRect(-22,-6,44,20);
      const lidG=ctx.createLinearGradient(0,-18,0,-4); lidG.addColorStop(0,'#5a3a1c'); lidG.addColorStop(1,'#3a2415');
      ctx.fillStyle=lidG; ctx.beginPath(); ctx.moveTo(-22,-4); ctx.quadraticCurveTo(0,-22-hb2,22,-4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#e8b64c'; ctx.lineWidth=2; ctx.strokeRect(-22,-6,44,20);
      ctx.beginPath(); ctx.moveTo(-22,-4); ctx.quadraticCurveTo(0,-22-hb2,22,-4); ctx.stroke();
      ctx.fillStyle='#ffd36b'; ctx.fillRect(-3.4,-2,6.8,9);
      ctx.fillStyle='#171008'; ctx.beginPath(); ctx.arc(0,1.6,1.6,0,6.28); ctx.fill();
      for(let sp2=0;sp2<2;sp2++){ const spx=rnd(-18,18), spy=rnd(-16,6);
        if(Math.random()<0.3){ ctx.fillStyle='rgba(255,240,190,0.9)'; ctx.fillRect(spx-2.4,spy-0.5,4.8,1); ctx.fillRect(spx-0.5,spy-2.4,1,4.8); } }
      ctx.restore();
    }
    ctx.restore();
    // ===== THE DOPAMINE ARROW — pulses big/small, points from player to the offering =====
    const adx=it.x-P.x, ady=it.y-P.y, ad=Math.hypot(adx,ady);
    if(ad>150){
      const aa2=Math.atan2(ady,adx);
      const pu3=0.7+Math.sin(gt*6)*0.3;
      const orb=58+Math.sin(gt*6)*10;
      const ax=P.x+Math.cos(aa2)*orb, ay=P.y+Math.sin(aa2)*orb;
      ctx.save(); ctx.translate(ax,ay); ctx.rotate(aa2);
      ctx.globalAlpha=0.55+Math.sin(gt*6)*0.25;
      const asc=(0.8+pu3*0.5);
      ctx.scale(asc,asc);
      ctx.shadowColor='#ffd36b'; ctx.shadowBlur=16;
      ctx.fillStyle=it.kind==='fountain'?'#ff5566':'#ffd36b';
      ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-8,-11); ctx.lineTo(-3,0); ctx.lineTo(-8,11); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#fff'; ctx.globalAlpha*=0.8;
      ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-4,-6); ctx.lineTo(-1,0); ctx.lineTo(-4,6); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    }
  }
}
function gainXP(n){
  n=Math.round(n*(P.xpMult||1));
  if(P.ovT>0 && !P._ovPass && n>0){
    P.ovT=Math.min(100, P.ovT+n*0.5*(P.ovFeed||1));
    tone(700+P.ovT*8,0.05,'sine',0.07);
    return;
  }
  if(P.debt>0 && n>0){
    const pay=Math.min(P.debt, Math.ceil(n*0.5)); P.debt-=pay; n-=pay;
    if(P.debt<=0){ P.debt=0; announce('◈ DEBT CLEARED — THE HOUSE IS PAID ◈', true); SFX.chipStack(); SFX.casinoDing(); flash(0.25,'#8bff9a'); }
  }
  P.xp+=n; SFX.xp();
  while(P.xp>=P.xpNext){ if(!P._ovPass && state==='playing'){ startOvercharge(); break; } P._ovPass=false;
    P.xp-=P.xpNext; P.level++; P.xpNext=Math.floor(6+P.level*3.4+P.level*P.level*0.7); pending.push({}); bump('level',P.level); recCheck('level',P.level,'Level'); { const lv9=$('level'); if(lv9){ lv9.classList.remove('pop'); void lv9.offsetWidth; lv9.classList.add('pop'); } } ring(P.x,P.y,120,'#c81e2c'); ring(P.x,P.y,70,'#ffd36b'); burst(P.x,P.y,16,'#e8b64c'); for(let i=0;i<16;i++){ parts.push({x:P.x+rnd(-10,10),y:P.y+rnd(-4,4),vx:rnd(-14,14),vy:-rnd(90,220),life:rnd(.4,.8),col:i%3?'#ffd36b':'#fff2c0',r:rnd(1.6,3.2)}); } flash(0.25,'#c81e2c'); }
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
function drawSigil(cx,cy){
  ctx.save(); ctx.translate(cx,cy);
  // faint ground disc
  ctx.save(); ctx.globalCompositeOperation='screen';
  if(!window._sigilG){ const gg=ctx.createRadialGradient(0,0,0,0,0,720); gg.addColorStop(0,'rgba(60,24,12,0.10)'); gg.addColorStop(1,'rgba(0,0,0,0)'); window._sigilG=gg; }
  ctx.fillStyle=window._sigilG; ctx.beginPath(); ctx.arc(0,0,720,0,6.283); ctx.fill(); ctx.restore();
  // concentric rings
  ctx.strokeStyle='rgba(232,182,76,0.09)';
  [700,560,420,300,180].forEach((rr,i)=>{ ctx.lineWidth=(i===0||i===2)?2.6:1.2; ctx.beginPath(); ctx.arc(0,0,rr,0,6.283); ctx.stroke(); });
  // rotating spoke + rune ring
  ctx.save(); ctx.rotate(gt*0.03); ctx.strokeStyle='rgba(232,182,76,0.08)'; ctx.lineWidth=1;
  for(let i=0;i<36;i++){ const a=i/36*6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a)*300,Math.sin(a)*300); ctx.lineTo(Math.cos(a)*560,Math.sin(a)*560); ctx.stroke(); }
  for(let i=0;i<48;i++){ const a=i/48*6.283, r2=(i%4===0)?604:582; ctx.beginPath(); ctx.moveTo(Math.cos(a)*560,Math.sin(a)*560); ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2); ctx.stroke(); }
  ctx.restore();
  // rose-window petals (counter-rotating)
  ctx.save(); ctx.rotate(-gt*0.05); ctx.strokeStyle='rgba(232,182,76,0.13)'; ctx.lineWidth=2;
  for(let i=0;i<12;i++){ const a=i/12*6.283; ctx.beginPath(); ctx.ellipse(Math.cos(a)*205,Math.sin(a)*205,118,44,a,0,6.283); ctx.stroke(); }
  ctx.restore();
  // inner 8-point star
  ctx.strokeStyle='rgba(232,182,76,0.18)'; ctx.lineWidth=2; ctx.beginPath();
  for(let i=0;i<16;i++){ const a=i/16*6.283-Math.PI/2; const rr=(i%2)?84:196; const x=Math.cos(a)*rr,y=Math.sin(a)*rr; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }
  ctx.closePath(); ctx.stroke();
  // slow blood ring
  ctx.save(); ctx.rotate(gt*0.02); ctx.strokeStyle='rgba(200,30,44,0.12)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,648,0,6.283); ctx.stroke(); ctx.restore();
  // pulsing center glow
  ctx.save(); ctx.globalCompositeOperation='screen';
  const pv=0.13+Math.sin(gt*2)*0.035;
  if(!window._sigilG2){ const cg=ctx.createRadialGradient(0,0,0,0,0,130); cg.addColorStop(0,'rgba(232,150,60,0.165)'); cg.addColorStop(1,'rgba(232,150,60,0)'); window._sigilG2=cg; }
  ctx.globalAlpha=pv/0.165; ctx.fillStyle=window._sigilG2; ctx.beginPath(); ctx.arc(0,0,130,0,6.283); ctx.fill(); ctx.restore();
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
    ctx.fillStyle='rgba(255,222,140,'+fl+')'; ctx.shadowColor='#ffb347'; ctx.shadowBlur=9; ctx.beginPath(); ctx.arc(x,y,2.6*fl,0,6.283); ctx.fill(); }
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,205,95,0.85)'; ctx.beginPath(); ctx.arc(cx,cy,3.5,0,6.283); ctx.fill();
}
/* prebaked screen-space layers — full-screen gradients cost too much to rebuild every frame */
let vignB=null;
function bakeVign(danger,db){
  const w=Math.max(2,VW>>1), h=Math.max(2,VH>>1);
  const mk=()=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const B={w:VW,h:VH,db,grade:GFX.grade};
  { B.warm=mk(); const x=B.warm.getContext('2d');
    const g=x.createRadialGradient(w/2,h*0.46,0,w/2,h*0.46,Math.max(w,h)*0.5);
    g.addColorStop(0,'rgba(120,70,30,0.10)'); g.addColorStop(1,'rgba(120,70,30,0)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.danger=mk(); const x=B.danger.getContext('2d');
    const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*(0.5-danger*0.3),w/2,h/2,Math.max(w,h)*0.8);
    g.addColorStop(0,'rgba(90,10,16,0)'); g.addColorStop(1,'rgba(90,10,16,1)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.main=mk(); const x=B.main.getContext('2d');
    const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*(0.30-danger*0.12),w/2,h/2,Math.max(w,h)*0.74);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.7,'rgba(6,4,10,'+(0.34+danger*0.4)+')'); g.addColorStop(1,'rgba(2,2,8,'+(0.7+danger*0.3)+')');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
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
    g.addColorStop(0,'rgba(255,214,150,0.11)'); g.addColorStop(1,'rgba(12,7,22,0.18)');
    x.fillStyle=g; x.fillRect(0,0,w,h); }
  { B.shaft=mk2(190,Math.max(2,VH>>1)); const x=B.shaft.getContext('2d');
    const g=x.createLinearGradient(0,0,45,B.shaft.height); g.addColorStop(0,'rgba(168,200,255,0.06)'); g.addColorStop(1,'rgba(168,200,255,0)');
    x.fillStyle=g; x.beginPath(); x.moveTo(10,0); x.lineTo(45,0); x.lineTo(85,B.shaft.height); x.lineTo(0,B.shaft.height); x.closePath(); x.fill(); }
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
function render(){
  ctx.save();
  let sx=0,sy=0; if(shake>0){ const sh=shake*0.6; sx=rnd(-sh,sh); sy=rnd(-sh,sh); }
  const cf = 0.9+Math.sin(gt*3)*0.03+Math.sin(gt*7.3)*0.02; // candle flicker
  ctx.fillStyle='#0a0507'; ctx.fillRect(0,0,VW,VH);
  ctx.save(); ctx.translate(-camX+sx,-camY+sy);

  // gothic marble hall floor
  const cs=200;
  const cx0=Math.floor(camX/cs), cy0=Math.floor(camY/cs);
  const cxn=Math.ceil((camX+VW)/cs), cyn=Math.ceil((camY+VH)/cs);
  for(let gx=cx0;gx<=cxn;gx++) for(let gy=cy0;gy<=cyn;gy++){
    const dark=(((gx+gy)&1)===0);
    ctx.fillStyle=dark?'#0d0609':'#130c10';
    ctx.fillRect(gx*cs,gy*cs,cs,cs);
    { ctx.save(); ctx.translate(gx*cs,gy*cs+cs/2);
      ctx.fillStyle=lgrad(cs/2,'rgba(200,170,150,0.028)','rgba(0,0,0,0.16)',0.5,'rgba(0,0,0,0)');
      ctx.fillRect(0,-cs/2,cs,cs); ctx.restore(); }
    // faint marble veining (deterministic per tile)
    const h=((gx*73856093)^(gy*19349663))>>>0;
    ctx.strokeStyle='rgba(200,180,190,0.035)'; ctx.lineWidth=1;
    for(let v=0;v<2;v++){ const o=((h>>(v*5))&31)/31; ctx.beginPath(); ctx.moveTo(gx*cs+o*cs,gy*cs); ctx.bezierCurveTo(gx*cs+o*cs+30,gy*cs+cs*0.4, gx*cs+o*cs-24,gy*cs+cs*0.7, gx*cs+((h>>(v*7))&31)/31*cs,gy*cs+cs); ctx.stroke(); }
    ctx.strokeStyle='rgba(232,182,76,0.05)'; ctx.lineWidth=1; ctx.strokeRect(gx*cs+11,gy*cs+11,cs-22,cs-22);
    // gold filigree corner flourishes
    ctx.strokeStyle='rgba(232,182,76,0.08)'; ctx.lineWidth=1.2;
    [[11,11,1,1],[cs-11,11,-1,1],[11,cs-11,1,-1],[cs-11,cs-11,-1,-1]].forEach(c=>{ ctx.beginPath(); ctx.arc(gx*cs+c[0]+c[2]*14,gy*cs+c[1]+c[3]*14,14,0,6.283); ctx.stroke(); });
    // tile centre — inlaid suit on ceremonial tiles, medallion elsewhere
    const mcx=gx*cs+cs/2, mcy=gy*cs+cs/2;
    if(h%6===0){
      const suit=['♠','♥','♦','♣'][(h>>3)%4];
      ctx.fillStyle=(suit==='♥'||suit==='♦')?'rgba(150,26,38,0.13)':'rgba(232,182,76,0.10)';
      ctx.font='700 64px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(suit,mcx,mcy+2);
      ctx.strokeStyle='rgba(232,182,76,0.08)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.arc(mcx,mcy,42,0,6.283); ctx.stroke();
    } else {
      ctx.strokeStyle=dark?'rgba(232,182,76,0.07)':'rgba(200,30,44,0.06)';
      ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(mcx,mcy,16,0,6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(mcx,mcy,8,0,6.283); ctx.stroke();
      ctx.beginPath(); for(let a=0;a<8;a++){ const an=a/8*6.283; ctx.moveTo(mcx+Math.cos(an)*8,mcy+Math.sin(an)*8); ctx.lineTo(mcx+Math.cos(an)*16,mcy+Math.sin(an)*16); } ctx.stroke();
    }
  }
  ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=2;
  for(let gx=cx0;gx<=cxn;gx++){ ctx.beginPath(); ctx.moveTo(gx*cs,camY-cs); ctx.lineTo(gx*cs,camY+VH+cs); ctx.stroke(); }
  for(let gy=cy0;gy<=cyn;gy++){ ctx.beginPath(); ctx.moveTo(camX-cs,gy*cs); ctx.lineTo(camX+VW+cs,gy*cs); ctx.stroke(); }
  // grand sigil + arena border + arch band
  drawWallsAndCarpet();
  drawSigil(CFG.arena/2,CFG.arena/2);
  // battlefield gore — blood pools accumulate where the damned fall, then dry
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
  for(const gg of gargoyles){
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
    ctx.fillStyle='rgba(255,60,60,'+ge+')'; ctx.shadowColor='#ff3344'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(-3,-18,1.5,0,6.28); ctx.arc(3,-18,1.5,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
  }
  // hellish cracks radiating from the sigil (red glow)
  ctx.save(); ctx.globalCompositeOperation='screen'; const C2=CFG.arena/2, cpv=0.09+Math.sin(gt*1.5)*0.03;
  for(const cr of floorCracks){ const first=cr.pts[0]; if(!((first.x>camX-400&&first.x<camX+VW+400)||(cr.pts[5].x>camX-400&&cr.pts[5].x<camX+VW+400))) continue;
    ctx.strokeStyle='rgba(255,70,55,0.05)'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(C2,C2); for(const p of cr.pts) ctx.lineTo(p.x,p.y); ctx.stroke();
    ctx.strokeStyle='rgba(220,50,55,'+cpv+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(C2,C2); for(const p of cr.pts) ctx.lineTo(p.x,p.y); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle='rgba(232,182,76,0.22)'; ctx.lineWidth=4; ctx.strokeRect(0,0,CFG.arena,CFG.arena);
  ctx.strokeStyle='rgba(232,182,76,0.12)'; ctx.lineWidth=2; ctx.strokeRect(70,70,CFG.arena-140,CFG.arena-140);
  // repeating gothic arches along the border band
  ctx.strokeStyle='rgba(232,182,76,0.10)'; ctx.lineWidth=2; const as=260, ar=80;
  for(let x=as;x<CFG.arena-as/2;x+=as){ ctx.beginPath(); ctx.arc(x,36,ar/3,Math.PI,0); ctx.stroke(); ctx.beginPath(); ctx.arc(x,CFG.arena-36,ar/3,0,Math.PI); ctx.stroke(); }
  for(let y=as;y<CFG.arena-as/2;y+=as){ ctx.beginPath(); ctx.arc(36,y,ar/3,-Math.PI/2,Math.PI/2); ctx.stroke(); ctx.beginPath(); ctx.arc(CFG.arena-36,y,ar/3,Math.PI/2,Math.PI*1.5); ctx.stroke(); }
  // columns (culled)
  for(const p of hallPillars){ if(p.x>camX-90 && p.x<camX+VW+90 && p.y>camY-90 && p.y<camY+VH+90) drawPillar(p.x,p.y,p.r); }
  // overhead chandeliers (culled)
  for(const ch of chandeliers){ if(ch.x>camX-ch.r*3 && ch.x<camX+VW+ch.r*3 && ch.y>camY-ch.r*3 && ch.y<camY+VH+ch.r*3) drawChandelier(ch.x,ch.y,ch.r); }

  // stray candlelight pools
  ctx.save(); ctx.globalCompositeOperation='screen';
  if(!GFX.lite) for(let i=0;i<2;i++){ const px=camX+VW*(0.3+i*0.4)+Math.sin(gt*0.5+i*2)*30; const py=camY+VH*(0.35+i*0.3)+Math.cos(gt*0.4+i)*24; const rr=190+Math.sin(gt*4+i)*14;
    ctx.globalAlpha=Math.min(1,0.9*cf);
    ctx.drawImage(glowSprite('rgba(232,150,60,0.09)','rgba(232,150,60,0)',190), px-rr, py-rr, rr*2, rr*2); ctx.globalAlpha=1; }
  ctx.restore();

  // shockwave rings
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const r of rings){ const a=clamp(r.life*2,0,1);
    ctx.globalAlpha=a*0.35; ctx.strokeStyle=r.col; ctx.lineWidth=9; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.28); ctx.stroke();
    ctx.globalAlpha=a; ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.28); ctx.stroke();
    ctx.globalAlpha=a*0.8; ctx.strokeStyle=r.col; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(r.x,r.y,r.r*0.92,0,6.28); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha=1;

  // orbs + coins (pulsing)
  // glow via cached sprites, not shadowBlur — hundreds of these per frame
  const pickGlow = !qLow && !GFX.lite;
  if(pickGlow){ const gs=glowSprite('rgba(255,224,102,0.5)','rgba(255,224,102,0)',16);
    for(const o of orbs) ctx.drawImage(gs,o.x-16,o.y-16,32,32); }
  for(const o of orbs){ const pl=1+Math.sin(gt*6+o.x*0.1)*0.15; ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.arc(o.x,o.y,o.r*pl,0,6.28); ctx.fill(); ctx.fillStyle='rgba(255,255,220,0.9)'; ctx.beginPath(); ctx.arc(o.x-o.r*0.3,o.y-o.r*0.3,o.r*0.35,0,6.28); ctx.fill(); }
  if(pickGlow){ const gs=glowSprite('rgba(248,226,160,0.45)','rgba(248,226,160,0)',13);
    for(const c of coins) ctx.drawImage(gs,c.x-13,c.y-13,26,26); }
  for(const c of coins){ const pl=1+Math.sin(gt*7+c.x*0.1)*0.12; ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.arc(c.x,c.y,c.r*pl,0,6.28); ctx.fill(); ctx.fillStyle='#fff6d8'; ctx.beginPath(); ctx.arc(c.x-1.5,c.y-1.5,c.r*0.35,0,6.28); ctx.fill(); }

  // aura visual
  if(auraRadius()>0){ const aR=auraRadius(); ctx.save(); ctx.globalCompositeOperation='screen'; ctx.translate(P.x,P.y);
    window._auraG=window._auraG||{}; let g=window._auraG[aR|0];
    if(!g){ g=ctx.createRadialGradient(0,0,0,0,0,aR); g.addColorStop(0,'rgba(80,200,120,0)'); g.addColorStop(0.7,'rgba(80,200,120,0.05)'); g.addColorStop(1,'rgba(80,200,120,0.14)'); window._auraG[aR|0]=g; }
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,aR+Math.sin(gt*4)*4,0,6.28); ctx.fill(); ctx.restore(); }

  // enemies
  drawSmites(); drawTarots(); drawWheelTok(); drawCrashTok();
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
  // horde LOD: beyond the nearest N enemies, draw cheap silhouettes (toaster keeps only 24 in full art)
  { const LODN=GFX.lite?24:60;
  if(enemies.length>LODN){
    const ds=enemies.map(e=>{ const dx=e.x-P.x, dy=e.y-P.y; return e._d2=dx*dx+dy*dy; }).sort((a,b)=>a-b);
    const cut=ds[LODN-1];
    for(const e of enemies) e._lod = e._d2>cut && !e.boss && !e.elite;
  } else for(const e of enemies) e._lod=false; }
  for(const e of enemies) drawEnemy(e);

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
  for(const b of ebullets){ ctx.fillStyle='#ffce5a'; ctx.shadowColor='#ff8a2c'; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.28); ctx.fill(); ctx.fillStyle='#fff3d0'; ctx.beginPath(); ctx.arc(b.x-1.5,b.y-1.5,b.r*0.35,0,6.28); ctx.fill(); }
  ctx.shadowBlur=0;

  // aura cloud (drawn under bullets)
  if(P.wlv.aura){ const aR=90+P.wlv.aura*14; ctx.save(); ctx.globalCompositeOperation='screen'; ctx.translate(P.x,P.y);
    window._auraG2=window._auraG2||{}; let g=window._auraG2[aR|0];
    if(!g){ g=ctx.createRadialGradient(0,0,0,0,0,aR); g.addColorStop(0,'rgba(90,190,110,0.02)'); g.addColorStop(0.6,'rgba(90,190,110,0.10)'); g.addColorStop(1,'rgba(60,150,90,0.18)'); window._auraG2[aR|0]=g; }
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,aR+Math.sin(gt*3)*4,0,6.28); ctx.fill(); ctx.strokeStyle='rgba(120,220,140,0.14)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,aR,0,6.28); ctx.stroke(); ctx.restore(); }

  // bullet trails — additive glow
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  for(const b of bullets){ const base=b.crit?'255,225,140':(b.kind==='seeker'?'190,130,255':(b.kind==='card'?'245,240,220':(b.kind==='knife'?'200,220,255':'255,95,70')));
    ctx.strokeStyle='rgba('+base+',0.16)'; ctx.lineWidth=b.r*3.4; ctx.beginPath(); ctx.moveTo(b.px,b.py); ctx.lineTo(b.x,b.y); ctx.stroke();
    ctx.strokeStyle='rgba('+base+',0.55)'; ctx.lineWidth=b.r*1.1; ctx.beginPath(); ctx.moveTo(b.px,b.py); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  ctx.restore();
  // bullets by kind
  for(const b of bullets){
    const base=b.crit?'255,225,140':(b.kind==='seeker'?'190,130,255':(b.kind==='card'?'245,240,220':(b.kind==='knife'?'200,220,255':'255,95,70')));
    ctx.save(); ctx.translate(b.x,b.y);
    // additive outer halo
    ctx.globalCompositeOperation='lighter';
    { const hr=b.r*3.2; ctx.globalAlpha=0.45;
      ctx.drawImage(glowSprite('rgba('+base+',1)','rgba('+base+',0)',hr), -hr, -hr, hr*2, hr*2); ctx.globalAlpha=1; }
    ctx.globalCompositeOperation='source-over';
    if(b.kind==='card'){
      ctx.rotate(b.spin||0); if(!qLow&&!GFX.lite){ ctx.shadowColor='#fff'; ctx.shadowBlur=10; }
      ctx.fillStyle='#f7f2e4'; ctx.fillRect(-b.r*0.7,-b.r*1.1,b.r*1.4,b.r*2.2);
      ctx.fillStyle=b.crit?'#d4212f':'#7a1c22'; ctx.beginPath(); ctx.moveTo(0,-b.r*0.5); ctx.lineTo(b.r*0.4,0); ctx.lineTo(0,b.r*0.5); ctx.lineTo(-b.r*0.4,0); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(-b.r*0.7,-b.r*1.1,b.r*0.28,b.r*2.2);
    } else if(b.kind==='knife'){
      const ang=Math.atan2(b.vy,b.vx); ctx.rotate(ang); if(!qLow&&!GFX.lite){ ctx.shadowColor='#cfe0ff'; ctx.shadowBlur=10; }
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
      if(!qLow&&!GFX.lite){ ctx.shadowColor='#c98bff'; ctx.shadowBlur=18; }
      ctx.fillStyle='#efe4ff'; ctx.beginPath(); ctx.arc(0,0,b.r*pl,0,6.28); ctx.fill();
      ctx.fillStyle='#efe4ff'; ctx.fillRect(-b.r*0.42,b.r*0.55,b.r*0.3,b.r*0.42); ctx.fillRect(b.r*0.12,b.r*0.55,b.r*0.3,b.r*0.42);
      ctx.fillStyle='#3a1a52';
      ctx.beginPath(); ctx.arc(-b.r*0.35,-b.r*0.18,b.r*0.24,0,6.28); ctx.arc(b.r*0.35,-b.r*0.18,b.r*0.24,0,6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,b.r*0.05); ctx.lineTo(-b.r*0.14,b.r*0.35); ctx.lineTo(b.r*0.14,b.r*0.35); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,120,200,0.8)';
      ctx.beginPath(); ctx.arc(-b.r*0.35,-b.r*0.18,b.r*0.1,0,6.28); ctx.arc(b.r*0.35,-b.r*0.18,b.r*0.1,0,6.28); ctx.fill();
    } else {
      const ang=Math.atan2(b.vy,b.vx); ctx.rotate(ang); if(!qLow&&!GFX.lite){ ctx.shadowColor=b.crit?'#ffd36b':'#ff5544'; ctx.shadowBlur=15; }
      ctx.fillStyle=b.crit?'#ffe9a8':'#ffb199'; ctx.beginPath(); ctx.ellipse(0,0,b.r*2.0,b.r*0.82,0,0,6.28); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.ellipse(b.r*0.35,0,b.r*1.05,b.r*0.42,0,0,6.28); ctx.fill();
    }
    ctx.restore();
  }
  ctx.shadowBlur=0;

  // scythe — crescent blade w/ fading sweep trail + glinting edge
  if(P.wlv.scythe){ const sL=P.wlv.scythe, sR=80+sL*8; ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(P.scytheA);
    ctx.globalCompositeOperation='lighter';
    for(let tr=1;tr<=3;tr++){ ctx.globalAlpha=0.14*(4-tr)/3; ctx.strokeStyle='#e8b64c'; ctx.lineWidth=15; ctx.beginPath(); ctx.arc(0,0,sR,-0.65-tr*0.28,0.65-tr*0.28); ctx.stroke(); }
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    const bg=ctx.createLinearGradient(0,-sR,0,sR); bg.addColorStop(0,'#f6e0a8'); bg.addColorStop(0.5,'#e8b64c'); bg.addColorStop(1,'#8a6a2a');
    ctx.strokeStyle=bg; ctx.lineWidth=8; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(0,0,sR,-0.7,0.7); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,sR+3,-0.7,0.7); ctx.stroke();
    const ta=0.7; ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.moveTo(Math.cos(ta)*(sR+5),Math.sin(ta)*(sR+5)); ctx.lineTo(Math.cos(ta+0.13)*(sR-6),Math.sin(ta+0.13)*(sR-6)); ctx.lineTo(Math.cos(ta)*(sR-9),Math.sin(ta)*(sR-9)); ctx.closePath(); ctx.fill();
    ctx.restore(); }
  // orbit — real casino chips: notched rims, face ring, spin shimmer
  if(P.wlv.orbit){ const oL=P.wlv.orbit, oR=54+oL*4; for(let k=0;k<oL;k++){ const oa=(P.orbitA||0)+k*(6.28/oL), ox=P.x+Math.cos(oa)*oR, oy=P.y+Math.sin(oa)*oR;
    ctx.save(); ctx.translate(ox,oy); ctx.rotate(oa*2);
    ctx.shadowColor='#e8b64c'; ctx.shadowBlur=13;
    ctx.fillStyle='#c8102e'; ctx.beginPath(); ctx.arc(0,0,8,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#f6e7c0'; for(let n2=0;n2<6;n2++){ const na=n2*1.047; ctx.beginPath(); ctx.arc(Math.cos(na)*6.4,Math.sin(na)*6.4,1.7,0,6.28); ctx.fill(); }
    ctx.strokeStyle='#f6e7c0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(0,0,4.2,0,6.28); ctx.stroke();
    ctx.fillStyle='#ffd36b'; ctx.font='700 6px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('♠',0,0.5);
    const gl=Math.sin(gt*7+k*2)*0.5+0.5; ctx.globalAlpha=gl*0.7; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-2.5,-2.5,1.6,0,6.28); ctx.fill(); ctx.globalAlpha=1;
    ctx.restore(); } }

  drawPlayer();

  // particles
  for(const p of parts){ ctx.globalAlpha=clamp(p.life*(p.ash?0.9:1.6),0,1); ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill(); }
  ctx.globalAlpha=1;
  // floating text (stroked)
  ctx.textAlign='center';
  { let _tf=0; if(GFX.lite && texts.length>24) texts.splice(0,texts.length-24);
  for(const t of texts){ ctx.globalAlpha=clamp(t.life*1.3,0,1); if(t.size!==_tf){ _tf=t.size; ctx.font=`700 ${t.size}px 'Cinzel',serif`; } ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.strokeText(t.t,t.x,t.y); ctx.fillStyle=t.col; ctx.fillText(t.t,t.x,t.y); } }
  ctx.globalAlpha=1;
  ctx.restore();

  // light shafts (screen space, prebaked sprite ×3) — now honors the LIGHT SHAFTS toggle
  if(GFX.shafts && !GFX.lite && vignB){
    ctx.save(); ctx.globalCompositeOperation='screen';
    for(let i=0;i<3;i++){ const lx=VW*(0.2+i*0.3)+Math.sin(gt*0.2+i)*40;
      ctx.drawImage(vignB.shaft, lx-20, 0, 190, VH); }
    ctx.restore();
  }

  // drifting fog (screen space, atmospheric depth)
  if(!GFX.lite){ ctx.save();
  for(const f of fogPuffs){ f.x+=f.vx/60; f.y+=f.vy/60; if(f.x<-f.r)f.x=VW+f.r; else if(f.x>VW+f.r)f.x=-f.r; if(f.y<-f.r)f.y=VH+f.r; else if(f.y>VH+f.r)f.y=-f.r;
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
    if(!vignB || vignB.w!==VW || vignB.h!==VH || vignB.db!==db || vignB.grade!==GFX.grade) bakeVign(danger,db);
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
  if(GFX.grade && state!=='menu' && vignB){
    ctx.save(); ctx.globalCompositeOperation='overlay';
    ctx.drawImage(vignB.grd,0,0,VW,VH); ctx.restore();
  }
  // GOLDEN HOUR shimmer
  if(state==='playing' && goldenT>0){
    ctx.save(); ctx.globalCompositeOperation='screen';
    const gg9=ctx.createLinearGradient(0,0,0,90);
    gg9.addColorStop(0,'rgba(255,211,107,'+(0.14+Math.sin(gt*7)*0.06)+')'); gg9.addColorStop(1,'rgba(255,211,107,0)');
    ctx.fillStyle=gg9; ctx.fillRect(0,0,VW,90);
    for(let gi9=0;gi9<6;gi9++){ const gx9=((gt*40+gi9*197)% (VW+40))-20, gy9=20+((gi9*53)%50)+Math.sin(gt*3+gi9)*6;
      ctx.fillStyle='rgba(255,240,190,'+(0.5+Math.sin(gt*8+gi9)*0.3)+')';
      ctx.fillRect(gx9-2.6,gy9-0.6,5.2,1.2); ctx.fillRect(gx9-0.6,gy9-2.6,1.2,5.2); }
    ctx.restore();
  }
  // GOD-PHASE — green untouchable rush
  if(state==='playing' && P.godT>0){
    ctx.save(); ctx.globalCompositeOperation='screen';
    const gg3=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.24,VW/2,VH/2,Math.max(VW,VH)*0.74);
    const gp3=0.10+Math.sin(gt*11)*0.05;
    gg3.addColorStop(0,'rgba(60,220,110,'+gp3*0.4+')'); gg3.addColorStop(1,'rgba(40,200,90,'+gp3+')');
    ctx.fillStyle=gg3; ctx.fillRect(0,0,VW,VH); ctx.restore();
  }
  // FEVER overlay — golden rush
  if(feverOn){
    ctx.save(); ctx.globalCompositeOperation='screen';
    const fg2=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.2,VW/2,VH/2,Math.max(VW,VH)*0.75);
    const fp=0.12+Math.sin(gt*9)*0.05;
    fg2.addColorStop(0,'rgba(255,190,70,'+fp*0.5+')'); fg2.addColorStop(1,'rgba(255,150,30,'+fp+')');
    ctx.fillStyle=fg2; ctx.fillRect(0,0,VW,VH); ctx.restore();
    ctx.save(); ctx.font="800 26px 'Cinzel',serif"; ctx.textAlign='center';
    ctx.fillStyle='#ffd36b'; ctx.shadowColor='#ffb020'; ctx.shadowBlur=18;
    ctx.fillText('⚡ FEVER '+feverT.toFixed(1)+'s ⚡', VW/2, 46+Math.sin(gt*12)*2);
    ctx.restore();
    for(let bi2=0;bi2<16;bi2++){ const bx3=VW*(bi2+0.5)/16, on2=((Math.floor(gt*9)+bi2)%4)===0;
      ctx.fillStyle=on2?'#ffe9a8':'rgba(120,80,20,0.5)';
      if(on2){ ctx.shadowColor='#ffd36b'; ctx.shadowBlur=10; }
      ctx.beginPath(); ctx.arc(bx3,8,4,0,6.28); ctx.fill(); ctx.shadowBlur=0; }
  }
  // XP / RAGE — gilded gothic gauge, smooth-lerped
  if(state==='playing'){
    const xw=Math.min(340,VW*0.44), xx=VW/2-xw/2, xy=VH-46, bh=14;
    const rage=P.ovT>0;
    const target=rage?Math.max(0,P.ovT)/100:Math.min(1,P.xp/P.xpNext);
    const key=rage?'_ovDisp':'_xpDisp';
    if(P[key]===undefined) P[key]=target;
    P[key]+=(target-P[key])*0.16;
    if(rage) P._xpDisp=1; else P._ovDisp=0;
    const f=Math.max(0,Math.min(1,P[key]));
    ctx.save();
    ctx.fillStyle='rgba(6,3,5,0.82)'; roundRect(xx-4,xy-4,xw+8,bh+8,7); ctx.fill();
    ctx.strokeStyle='rgba(232,182,76,0.85)'; ctx.lineWidth=1.6; roundRect(xx-4,xy-4,xw+8,bh+8,7); ctx.stroke();
    ctx.strokeStyle='rgba(90,20,30,0.9)'; ctx.lineWidth=1; roundRect(xx-2,xy-2,xw+4,bh+4,5); ctx.stroke();
    ctx.fillStyle='rgba(232,182,76,0.2)';
    for(let ti=1;ti<10;ti++) ctx.fillRect(xx+xw*ti/10-0.5,xy+2,1,bh-4);
    let g9=ctx.createLinearGradient(xx,0,xx+xw,0);
    if(rage){ const above=P.ovT>=90;
      if(above){ g9.addColorStop(0,'#8a5a10'); g9.addColorStop(0.88,'#ffd36b'); g9.addColorStop(1,'#8bff9a'); }
      else if(P.ovT<25){ g9.addColorStop(0,'#5a0a12'); g9.addColorStop(1,'#ff3344'); }
      else { g9.addColorStop(0,'#7a3608'); g9.addColorStop(1,'#ff9a3c'); }
    } else { g9.addColorStop(0,'#5a1420'); g9.addColorStop(1,'#c81e2c'); }
    ctx.fillStyle=g9; roundRect(xx,xy,Math.max(2,xw*f),bh,4); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const shx=xx+((gt*70)%(xw+90))-45;
    const sg9=ctx.createLinearGradient(shx-26,0,shx+26,0);
    sg9.addColorStop(0,'rgba(255,240,190,0)'); sg9.addColorStop(0.5,'rgba(255,240,190,0.26)'); sg9.addColorStop(1,'rgba(255,240,190,0)');
    ctx.fillStyle=sg9; roundRect(xx,xy,Math.max(2,xw*f),bh,4); ctx.fill();
    ctx.fillStyle='rgba(255,250,220,0.95)'; ctx.fillRect(xx+xw*f-1.5,xy+1,3,bh-2);
    for(let ed=0;ed<2;ed++){ const eo=Math.sin(gt*38+ed*3.1)*4;
      ctx.fillStyle='rgba(255,220,140,'+(0.5+Math.sin(gt*26+ed)*0.3)+')';
      ctx.beginPath(); ctx.arc(xx+xw*f+eo*0.4, xy+bh/2+eo, 1.3,0,6.28); ctx.fill(); }
    ctx.restore();
    if(rage){
      const nx=xx+xw*0.9;
      ctx.fillStyle='#ffd36b'; ctx.shadowColor='#ffd36b'; ctx.shadowBlur=9;
      ctx.beginPath(); ctx.moveTo(nx,xy-9); ctx.lineTo(nx+4.6,xy-3.6); ctx.lineTo(nx,xy+1.6); ctx.lineTo(nx-4.6,xy-3.6); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
      ctx.font="800 14px 'Cinzel',serif"; ctx.textAlign='center';
      ctx.fillStyle='#8bff9a'; ctx.shadowColor='#8bff9a'; ctx.shadowBlur=10;
      ctx.fillText('⚡ RAGE '+Math.round(P.ovT)+'%  ·  HOLD 90%+  '+Math.max(0,ascTime-P.ovHold).toFixed(1)+'s → THE ASCENT ⚡', VW/2, xy-34);
      ctx.font="700 11px 'Cinzel',serif"; ctx.fillStyle='#ffce8a'; ctx.shadowColor='#ff9a3c';
      ctx.fillText('COINS & XP FEED THE BAR · ABOVE 90: +50% DMG DEALT & TAKEN · SLIP = −50% XP + SWEPT', VW/2, xy-18);
      ctx.shadowBlur=0;
    } else {
      ctx.font="700 11px 'Cinzel',serif"; ctx.textAlign='center';
      ctx.fillStyle='rgba(236,208,160,0.9)'; ctx.shadowColor='#000'; ctx.shadowBlur=4;
      ctx.fillText('⚜ LEVEL CHARGE — '+Math.floor(P.xp)+' / '+P.xpNext+' XP', VW/2, xy-11); ctx.shadowBlur=0;
      if(P.debt>0){ ctx.fillStyle='#ff6b6b'; ctx.shadowColor='#ff6b6b'; ctx.shadowBlur=6;
        ctx.fillText('☠ IN DEBT TO THE HOUSE: '+P.debt+' XP', VW/2, xy+28); ctx.shadowBlur=0; }
      if(f>0.85){
        ctx.shadowColor='#ff5566'; ctx.shadowBlur=8+Math.sin(gt*9)*5;
        ctx.fillStyle='rgba(255,85,102,0.9)'; ctx.fillRect(xx+xw*f-1.5,xy+1,3,bh-2); ctx.shadowBlur=0;
      }
    }
    ctx.restore();
  }
  if(GFX.fps){ ctx.font="700 11px 'Cinzel',serif"; ctx.textAlign='right'; ctx.fillStyle='#bfae8c';
    ctx.globalAlpha=0.85; ctx.fillText(Math.round(1000/Math.max(1,frameAvg))+' FPS', VW-12, 64); ctx.globalAlpha=1; }
  // house dare counter
  if(state==='playing' && dare){
    ctx.font="800 15px 'Cinzel',serif"; ctx.textAlign='center';
    ctx.fillStyle=dare.got>=dare.need?'#8bff9a':'#ffd36b'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=10;
    ctx.fillText('⚔ '+dare.got+' / '+dare.need+' · '+dare.t.toFixed(1)+'s', VW/2, 130); ctx.shadowBlur=0;
  }
  // fever meter (bottom center) while charging
  if(!feverOn && fever>0.03 && state==='playing'){
    const mw=Math.min(300,VW*0.4), mx=VW/2-mw/2, my=VH-26;
    P._fvD=(P._fvD===undefined?fever:P._fvD); P._fvD+=(fever-P._fvD)*0.14; const fvf=P._fvD;
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(mx-1,my-1,mw+2,8);
    const fgrad=ctx.createLinearGradient(mx,0,mx+mw,0); fgrad.addColorStop(0,'#8a5a10'); fgrad.addColorStop(1,'#ffd36b');
    ctx.fillStyle=fgrad; ctx.fillRect(mx,my,mw*fvf,6);
    if(fever>0.85){ ctx.shadowColor='#ffd36b'; ctx.shadowBlur=10+Math.sin(gt*10)*6; ctx.fillRect(mx,my,mw*fvf,6); ctx.shadowBlur=0; }
    // on the brink of ignition: gold edges pulse + soft tingle
    if(fever>0.97 && vignB){
      const eb2=(Math.sin(gt*6)*0.5+0.5)*0.22+0.06;
      ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=eb2;
      ctx.drawImage(vignB.gold,0,0,VW,VH); ctx.restore();
      P._fvTk=(P._fvTk||0)-1/60; if(P._fvTk<=0){ P._fvTk=1.2; SFX.tingle(); }
    } else P._fvTk=0;
  }
  // streak counter
  if(killStreak>=15 && state==='playing'){
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
      ctx.fillText('SPACE — CASH +'+Math.floor(killStreak/3)+' ◈', VW-18, 92); }
    ctx.restore();
  }
  ctx.restore();
}
function drawEnemy(e){
  const t=gt*4+e.ph, T=e.vt||e.type, r=e.r;
  if(e._lod){ // cheap distant silhouette: shadow, flat body, glowing eyes
    ctx.save(); ctx.translate(e.x,e.y);
    ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(0,r*0.72,r*0.78,r*0.26,0,0,6.28); ctx.fill();
    if(e.flash>0){ const sq=Math.min(0.16,e.flash*1.4); ctx.scale(1+sq,1-sq); }
    ctx.fillStyle=e.flash>0?'#fff':e.dark; ctx.beginPath(); ctx.ellipse(0,0,r*0.8,r*0.9,0,0,6.28); ctx.fill();
    ctx.fillStyle=e.col; ctx.beginPath(); ctx.arc(-r*0.22,-r*0.18,r*0.11,0,6.28); ctx.arc(r*0.22,-r*0.18,r*0.11,0,6.28); ctx.fill();
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(e.x,e.y);
  // contact shadow
  const fly=(T==='wraith'||T==='hexer');
  ctx.fillStyle='rgba(0,0,0,'+(fly?0.24:0.38)+')';
  ctx.beginPath(); ctx.ellipse(0,r*0.72,r*(fly?0.6:0.82),r*0.28,0,0,6.28); ctx.fill();
  if(e.boss){ ctx.save(); ctx.rotate(gt*0.8); ctx.strokeStyle='rgba(201,139,255,'+(0.35+Math.sin(gt*3)*0.15)+')'; ctx.lineWidth=2.5; ctx.setLineDash([9,7]);
    ctx.beginPath(); ctx.arc(0,0,r*1.5,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  if((e.elite||e.boss)&&!qLow){ ctx.shadowColor=e.col; ctx.shadowBlur=e.boss?26:18; }
  if(e.flash>0){ const sq=Math.min(0.16,e.flash*1.4); ctx.scale(1+sq,1-sq); }
  { const bs9=Math.min(1,(gt-(e.born||gt-1))/0.22); if(bs9<1){ ctx.scale(bs9,bs9); ctx.globalAlpha=bs9; } }
  { const ga9=ctx.globalAlpha; ctx.globalAlpha=ga9*0.3; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(0,r*0.92,r*0.72,r*0.26,0,0,6.28); ctx.fill(); ctx.globalAlpha=ga9; }
  const sway=Math.sin(t)*r*0.12;
  // top-lit gradient helper (chandelier light from above)
  const bg=(x,y,rx,ry,c1,c2,rot)=>{
    if(qLow){ ctx.fillStyle=c2; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot||0,0,6.28); ctx.fill(); return; }
    ctx.save(); ctx.translate(x,y); ctx.fillStyle=lgrad(ry,c1,c2);
    ctx.beginPath(); ctx.ellipse(0,0,rx,ry,rot||0,0,6.28); ctx.fill(); ctx.restore(); };
  const line=(x1,y1,x2,y2,w,c)=>{ ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); };

  if(T==='swarm'){
    // BAT-IMP — bone-finger membrane wings, horns, whip tail
    const flap=Math.sin(gt*22+e.ph);
    for(const sd of [-1,1]){
      const wx=sd*r*1.55, wy=-flap*r*0.55;
      ctx.fillStyle=e.dark;
      ctx.beginPath(); ctx.moveTo(sd*r*0.2,-r*0.1);
      ctx.quadraticCurveTo(sd*r*0.9,-r*0.75+wy, wx, wy+r*0.15);
      ctx.quadraticCurveTo(sd*r*1.1, r*0.25+wy*0.4, sd*r*0.75, r*0.28);
      ctx.quadraticCurveTo(sd*r*0.45, r*0.05, sd*r*0.2, r*0.22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(20,10,14,0.8)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sd*r*0.25,0); ctx.quadraticCurveTo(sd*r*0.85,wy*0.6-r*0.2, wx*0.92, wy+r*0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sd*r*0.25,r*0.1); ctx.quadraticCurveTo(sd*r*0.8,wy*0.3, sd*r*1.05, wy*0.5+r*0.25); ctx.stroke();
    }
    const tw=Math.sin(gt*9+e.ph);
    ctx.strokeStyle=e.dark; ctx.lineWidth=1.6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,r*0.5); ctx.quadraticCurveTo(-tw*r*0.6, r*1.0, tw*r*0.5, r*1.35); ctx.stroke();
    bg(0,0,r*0.6,r*0.72,e.col,e.dark);
    ctx.fillStyle=e.dark;
    ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.5); ctx.lineTo(-r*0.42,-r*0.95); ctx.lineTo(-r*0.14,-r*0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r*0.3,-r*0.5); ctx.lineTo(r*0.42,-r*0.95); ctx.lineTo(r*0.14,-r*0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffd0d0'; ctx.beginPath(); ctx.moveTo(-r*0.22,r*0.18); ctx.lineTo(-r*0.1,r*0.38); ctx.lineTo(0,r*0.18); ctx.lineTo(r*0.1,r*0.38); ctx.lineTo(r*0.22,r*0.18); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff5a5a'; ctx.shadowColor='#ff5a5a'; ctx.shadowBlur=6;
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
    ctx.fillStyle='#ffdf5a'; ctx.shadowColor='#ffdf5a'; ctx.shadowBlur=7;
    for(const [ex,ey,er] of [[0.44,-0.3,0.085],[0.6,-0.24,0.07],[0.42,-0.12,0.06],[0.56,-0.1,0.05]]){
      ctx.beginPath(); ctx.arc(sway*0.5+r*ex,r*ey,r*er,0,6.28); ctx.fill(); }
    ctx.shadowBlur=0;
    const dr2=(gt*1.3+e.ph)%1;
    ctx.fillStyle='rgba(200,230,200,0.5)'; ctx.beginPath(); ctx.arc(sway*0.5+r*0.5, -r*0.02+dr2*r*0.5, 1.4*(1-dr2),0,6.28); ctx.fill();
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
    ctx.fillStyle='#dff3ff'; ctx.shadowColor='#9adcff'; ctx.shadowBlur=10;
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
    ctx.fillStyle='#c9ff7a'; ctx.shadowColor='#c9ff7a'; ctx.shadowBlur=8;
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
    ctx.fillStyle='#ff4d4d'; ctx.shadowColor='#ff4d4d'; ctx.shadowBlur=8;
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
    ctx.fillStyle='#ff4d4d'; ctx.shadowColor='#ff4d4d'; ctx.shadowBlur=6;
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
    ctx.fillStyle='#ffce5a'; ctx.shadowColor='#ff8a2c'; ctx.shadowBlur=6+dr3*6;
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
    ctx.fillStyle='rgba(255,140,60,'+core+')'; ctx.shadowColor='#ff8c3c'; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.ellipse(0,-r*0.02,r*0.3,r*0.42,0,0,6.28); ctx.fill(); ctx.shadowBlur=0;
    bg(sway,-r*0.2,r*0.58,r*0.68,e.col,e.dark);
    ctx.strokeStyle='rgba(255,150,70,'+core+')'; ctx.lineWidth=1.6; ctx.shadowColor='#ff8c3c'; ctx.shadowBlur=5;
    ctx.beginPath(); ctx.moveTo(-r*0.28,-r*0.6); ctx.lineTo(-r*0.06,-r*0.15); ctx.lineTo(-r*0.32,r*0.3);
    ctx.moveTo(r*0.2,-r*0.55); ctx.lineTo(r*0.06,0); ctx.lineTo(r*0.3,r*0.4);
    ctx.moveTo(-r*0.05,r*0.15); ctx.lineTo(r*0.12,r*0.55); ctx.stroke(); ctx.shadowBlur=0;
    if(Math.random()<0.15){ parts.push({x:e.x+rnd(-r*0.4,r*0.4),y:e.y-r*0.3,vx:rnd(-6,6),vy:-rnd(20,44),life:rnd(.3,.6),col:'#ff9a4c',r:rnd(1,2)}); }
    ctx.fillStyle=e.dark; ctx.beginPath(); ctx.arc(sway,-r*0.68,r*0.36,0,6.28); ctx.fill();
    ctx.strokeStyle='rgba(255,150,70,'+core+')'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(sway-r*0.1,-r*0.95); ctx.lineTo(sway,-r*0.7); ctx.stroke();
    ctx.fillStyle='rgba(255,170,80,'+(0.5+core*0.5)+')'; ctx.shadowColor='#ff8c3c'; ctx.shadowBlur=7;
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
    ctx.fillStyle=e.elite?'#fff0aa':'#ff4d4d'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=7;
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
      ctx.fillStyle='rgba(120,255,150,'+pl3+')'; ctx.shadowColor='#8bff9a'; ctx.shadowBlur=8;
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
    ctx.fillStyle='#ffd36b'; ctx.shadowColor='#ffd36b'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(r*0.85,-r*0.6,r*0.1,0,6.28); ctx.fill(); ctx.shadowBlur=0;
  }
  // ——— BOSS SIGNATURES — each lord of the House carries his office ———
  if(e.boss){
    if(e.bossKind==='pitboss'){
      ctx.fillStyle='#ff7a2c'; ctx.shadowColor='#ff7a2c'; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(sway*0.4+r*0.34,-r*0.62,r*0.05,0,6.28); ctx.fill(); ctx.shadowBlur=0;
      if(Math.random()<0.3) parts.push({x:e.x+r*0.34,y:e.y-r*0.74,vx:rnd(-4,4),vy:-rnd(14,26),life:rnd(.4,.8),col:'#8a8a92',r:rnd(1.5,2.6)});
      ctx.fillStyle='#ffd36b';
      for(const sd of [-1,1]) ctx.fillRect(sd*r*0.95-2.4, r*0.04, 4.8,3.2);
    } else if(e.bossKind==='croupier'){
      ctx.fillStyle='#c8102e';
      ctx.beginPath(); ctx.moveTo(0,-r*0.52); ctx.lineTo(-r*0.16,-r*0.44); ctx.lineTo(0,-r*0.36); ctx.lineTo(r*0.16,-r*0.44); ctx.closePath(); ctx.fill();
      for(let c5=0;c5<4;c5++){ ctx.save(); ctx.translate(-r*0.72,r*0.15); ctx.rotate(-0.55+c5*0.28+Math.sin(gt*2)*0.05);
        ctx.fillStyle='#efe8d8'; ctx.fillRect(-r*0.07,-r*0.36,r*0.14,r*0.36);
        ctx.strokeStyle='rgba(140,20,30,0.7)'; ctx.lineWidth=0.8; ctx.strokeRect(-r*0.07,-r*0.36,r*0.14,r*0.36);
        ctx.restore(); }
    } else if(e.bossKind==='collector'){
      ctx.strokeStyle='#6a6474'; ctx.lineWidth=2; ctx.lineCap='round';
      for(const sd of [-1,1]){ const dg2=Math.sin(gt*3+sd)*r*0.08;
        ctx.beginPath(); ctx.moveTo(sd*r*0.5,-r*0.1); ctx.quadraticCurveTo(sd*r*0.62,r*0.3, sd*r*0.55+dg2,r*0.72); ctx.stroke();
        ctx.fillStyle='#8a8494';
        for(let l5=0;l5<3;l5++){ ctx.beginPath(); ctx.arc(sd*r*(0.53+l5*0.015), r*(0.06+l5*0.23), 1.7,0,6.28); ctx.fill(); } }
    } else if(e.bossKind==='thehouse'){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(let f5=0;f5<5;f5++){ const fx5=(f5-2)*r*0.16, fh=r*(0.18+Math.abs(Math.sin(gt*6+f5*1.3))*0.22);
        ctx.beginPath(); ctx.moveTo(fx5-r*0.06,-r*1.0); ctx.quadraticCurveTo(fx5,-r*1.05-fh, fx5+r*0.06,-r*1.0); ctx.closePath();
        ctx.save(); ctx.translate(0,-r*1.025-fh/2); ctx.fillStyle=lgrad((r*0.05+fh)/2,'rgba(201,139,255,0)','rgba(201,139,255,0.85)'); ctx.fill(); ctx.restore(); }
      ctx.restore();
    }
  }
  // rim light — moonlit edge for readability
  ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle='rgba(200,215,240,0.15)'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.ellipse(sway*0.5,-r*0.28,r*0.62,r*0.7,0,-2.7,-0.4); ctx.stroke();
  ctx.restore();
  if(e.elite||e.boss){
    ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.moveTo(-r*0.4,-r*1.0); ctx.lineTo(-r*0.2,-r*1.3); ctx.lineTo(0,-r*1.05); ctx.lineTo(r*0.2,-r*1.3); ctx.lineTo(r*0.4,-r*1.0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#c8102e'; ctx.beginPath(); ctx.arc(-r*0.2,-r*1.22,r*0.05,0,6.28); ctx.arc(r*0.2,-r*1.22,r*0.05,0,6.28); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(-r,r*1.1,r*2,4);
    ctx.fillStyle='#c98bff'; ctx.fillRect(-r,r*1.1,r*2*(e.hp/e.maxhp),4);
  }
  { const wnd=1-(e.hp/Math.max(1,e.maxhp));
    if(wnd>0.25){ ctx.globalAlpha=Math.min(0.4,(wnd-0.25)*0.6); ctx.fillStyle='#160408';
      ctx.beginPath(); ctx.ellipse(0,-r*0.15,r*0.72,r*0.85,0,0,6.28); ctx.fill(); ctx.globalAlpha=1; } }
  if(e.flash>0){ ctx.globalAlpha=Math.min(0.8,e.flash*6); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(0,-r*0.2,r*0.78,r*0.95,0,0,6.28); ctx.fill(); ctx.globalAlpha=1; }
  ctx.restore();
}

function drawPlayer(){
  const t=gt*6, mv=P.moving?1:0, brt=Math.sin(gt*2.2)*0.5+0.5;
  const gh=!!P._rites; // near-death ghoul form
  const fx=Math.cos(P.aim), fy=Math.sin(P.aim);
  if(P.trail && !GFX.lite){ for(let i=0;i<P.trail.length;i++){ const tp=P.trail[i]; ctx.globalAlpha=(i/P.trail.length)*0.15; ctx.fillStyle='#8b1620'; ctx.beginPath(); ctx.arc(tp.x,tp.y,7*(i/P.trail.length),0,6.28); ctx.fill(); } ctx.globalAlpha=1; }
  ctx.save(); ctx.translate(P.x,P.y);
  // warm candle-glow pool around the gambler
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const pg=ctx.createRadialGradient(0,4,0,0,4,46); pg.addColorStop(0,'rgba(255,170,80,'+(0.10+brt*0.05)+')'); pg.addColorStop(1,'rgba(255,150,60,0)');
  ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(0,4,46,0,6.28); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,16,13,4.4,0,0,6.28); ctx.fill(); ctx.restore();
  if(killStreak>=50 && state==='playing'){ ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(255,154,60,'+(0.35+Math.sin(gt*10)*0.2)+')'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,27+Math.sin(gt*7)*3,0,6.28); ctx.stroke();
    ctx.strokeStyle='rgba(255,220,140,'+(0.2+Math.sin(gt*10+2)*0.12)+')'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.arc(0,0,33+Math.sin(gt*5.5)*4,0,6.28); ctx.stroke(); ctx.restore();
    if(Math.random()<0.25) parts.push({x:P.x+rnd(-20,20),y:P.y+rnd(-14,18),vx:rnd(-10,10),vy:-rnd(40,90),life:rnd(.2,.45),col:'#ff9a3c',r:rnd(1,2)}); }
  if(P.godT>0){ ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(139,255,154,'+(0.6+Math.sin(gt*12)*0.3)+')'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.arc(0,0,24+Math.sin(gt*9)*3,0,6.28); ctx.stroke(); ctx.restore(); }
  // faint gambler's rune circle beneath the boots
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.rotate(gt*0.6);
  ctx.strokeStyle='rgba(232,182,76,'+(gh?0.10:(0.13+brt*0.06))+')'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(0,0,21,0,6.28); ctx.stroke();
  for(let rn2=0;rn2<4;rn2++){ const rna=rn2*1.5708; ctx.fillStyle='rgba(232,182,76,'+(gh?0.14:0.22)+')';
    ctx.font='8px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(['♠','♥','♦','♣'][rn2], Math.cos(rna)*21, Math.sin(rna)*21); }
  ctx.restore();
  if(P.midas && P.midasStacks>0){ ctx.strokeStyle='rgba(232,182,76,'+Math.min(0.6,P.midasStacks/30)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,20+Math.sin(t)*2,0,6.28); ctx.stroke(); }
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0,15,13,4.5,0,0,6.28); ctx.fill();
  const lean=fx*3, bob=Math.abs(Math.sin(t))*mv*1.4;
  ctx.translate(0,-bob);
  // striding boots
  const step=Math.sin(t)*mv*4.5;
  ctx.fillStyle='#0c0608';
  ctx.beginPath(); ctx.ellipse(-3.5+step*0.7,14.5,3,1.8,0,0,6.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.5-step*0.7,14.5,3,1.8,0,0,6.28); ctx.fill();
  // ghoul soul-smoke rising off the body
  if(gh){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){ const sy=-((gt*30+i*17)%46), sa2=1-Math.abs(sy+23)/23;
      ctx.globalAlpha=sa2*0.30; ctx.fillStyle='#3a4a5a';
      ctx.beginPath(); ctx.arc(-8+i*5.4+Math.sin(gt*2.4+i)*3, sy-2, 3.4+sa2*2, 0, 6.28); ctx.fill(); }
    ctx.globalAlpha=1; ctx.restore(); }
  const bil=Math.sin(t*0.9)*mv*3.5;
  // flowing outer coat — layered, top-lit gradient
  { const cgd=ctx.createLinearGradient(0,-9,0,16);
    if(gh){ cgd.addColorStop(0,'#151016'); cgd.addColorStop(1,'#060305'); }
    else { cgd.addColorStop(0,'#6a1220'); cgd.addColorStop(0.5,'#4d0a12'); cgd.addColorStop(1,'#2a050a'); }
    ctx.fillStyle=cgd; }
  ctx.beginPath();
  ctx.moveTo(-9+lean,-7);
  ctx.quadraticCurveTo(-18+lean-bil,4,-13+lean-bil*0.8,15.5);
  ctx.quadraticCurveTo(-6,13.5,0,15.5);
  ctx.quadraticCurveTo(6,13.5,13+lean+bil*0.8,15.5);
  ctx.quadraticCurveTo(18+lean+bil,4,9+lean,-7);
  ctx.closePath(); ctx.fill();
  // coat mid layer — lit from the chandeliers
  { const mgd=ctx.createLinearGradient(0,-7,0,14);
    if(gh){ mgd.addColorStop(0,'#221721'); mgd.addColorStop(1,'#0c0509'); }
    else { mgd.addColorStop(0,'#8e1826'); mgd.addColorStop(1,'#4a0a10'); }
    ctx.fillStyle=mgd; }
  ctx.beginPath();
  ctx.moveTo(-7.5+lean,-6);
  ctx.quadraticCurveTo(-13+lean-bil*0.6,5,-8+lean,14);
  ctx.lineTo(8+lean,14);
  ctx.quadraticCurveTo(13+lean+bil*0.6,5,7.5+lean,-6);
  ctx.closePath(); ctx.fill();
  // shoulder sheen
  ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle='rgba(255,200,150,0.16)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(-7+lean,-6.4); ctx.quadraticCurveTo(lean,-9.6,7+lean,-6.4); ctx.stroke();
  ctx.restore();
  // gold hem trim
  ctx.strokeStyle='rgba(232,182,76,0.75)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-12+lean-bil*0.8,14.6); ctx.quadraticCurveTo(0,12.4,12+lean+bil*0.8,14.6); ctx.stroke();
  // crimson inner lining flash
  ctx.fillStyle=gh?'#2a1218':'#a5121c'; ctx.beginPath(); ctx.moveTo(-4.5+lean,-3); ctx.quadraticCurveTo(-2,7,0,13.5); ctx.quadraticCurveTo(2,7,4.5+lean,-3); ctx.closePath(); ctx.fill();
  // black waistcoat body
  ctx.fillStyle='#14090c'; ctx.beginPath(); ctx.ellipse(lean*0.5,-0.5,6,8.6,0,0,6.28); ctx.fill();
  // gold waistcoat buttons
  ctx.fillStyle='#e8b64c';
  for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(lean*0.5,-4.5+i*3.4,0.85,0,6.28); ctx.fill(); }
  // gold watch chain swinging from the waistcoat
  { const csw=Math.sin(gt*5)*0.8+mv*Math.sin(t)*1;
    ctx.strokeStyle=gh?'rgba(90,100,110,0.8)':'rgba(232,182,76,0.9)'; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.moveTo(lean*0.5,-1.2); ctx.quadraticCurveTo(lean*0.5+3.4,2.2+csw, lean*0.5+5.2,0.6); ctx.stroke();
    ctx.fillStyle=gh?'#5a626c':'#ffd36b';
    ctx.beginPath(); ctx.arc(lean*0.5+5.2,0.6,1.1,0,6.28); ctx.fill(); }
  // card-hand: aims toward the cursor with a glowing spinning card
  ctx.save(); ctx.rotate(P.aim);
  ctx.strokeStyle=gh?'#0c1016':'#2e070d'; ctx.lineWidth=3.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(3,0); ctx.lineTo(11,0); ctx.stroke();
  ctx.strokeStyle=gh?'#3a4550':'#e8b64c'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(9.4,-1.7); ctx.lineTo(9.4,1.7); ctx.stroke();
  ctx.save(); ctx.translate(12.5,0); ctx.rotate(gt*3);
  ctx.shadowColor=gh?'#8ac8ff':'#ffd36b'; ctx.shadowBlur=7;
  ctx.fillStyle='#f4efe0'; ctx.fillRect(-2.4,-3.4,4.8,6.8);
  ctx.shadowBlur=0;
  ctx.fillStyle='#a5121c'; ctx.fillRect(-1,-1.4,2,2.8);
  ctx.strokeStyle='rgba(140,20,30,0.5)'; ctx.lineWidth=0.6; ctx.strokeRect(-2.4,-3.4,4.8,6.8);
  ctx.restore();
  ctx.restore();
  // pale collar + head — ashen corpse-grey in ghoul form
  ctx.fillStyle=gh?'#8a929a':'#ece4d5'; ctx.beginPath(); ctx.arc(lean*0.5,-6.5,3,0,6.28); ctx.fill();
  ctx.fillStyle=gh?'#9aa2ac':'#e6dccb'; ctx.beginPath(); ctx.arc(lean*0.6,-11.5,4.4,0,6.28); ctx.fill();
  if(gh){ ctx.fillStyle='#2a3138'; ctx.beginPath(); ctx.arc(lean*0.6-1.5,-10.4,1.5,0,6.28); ctx.arc(lean*0.6+1.5,-10.4,1.5,0,6.28); ctx.fill(); }
  // glowing eyes track aim — hollow soul-blue when dying
  ctx.fillStyle=gh?'#bfe6ff':'#ff2d3d'; ctx.shadowColor=gh?'#8ac8ff':'#ff2d3d'; ctx.shadowBlur=gh?10:7;
  ctx.beginPath(); ctx.arc(lean*0.6-1.5+fx*0.7,-11.4+fy*0.5,0.9,0,6.28); ctx.arc(lean*0.6+1.5+fx*0.7,-11.4+fy*0.5,0.9,0,6.28); ctx.fill(); ctx.shadowBlur=0;
  // wide-brim gambler hat with gold band
  ctx.fillStyle='#0a0406';
  ctx.beginPath(); ctx.ellipse(lean*0.7,-14.2,8.6,2.7,lean*0.012,0,6.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(lean*0.7,-16.4,4.6,3.4,0,Math.PI,Math.PI*2); ctx.fill();
  ctx.fillRect(lean*0.7-4.6,-16.4,9.2,2.4);
  ctx.fillStyle=gh?'#4a5560':'#e8b64c'; ctx.fillRect(lean*0.7-4.6,-14.6,9.2,1.15);
  ctx.fillStyle='#ff4550'; ctx.beginPath(); ctx.arc(lean*0.7+3.4,-14,0.9,0,6.28); ctx.fill();
  { const fw=Math.sin(gt*5)*0.8;
    ctx.strokeStyle=gh?'rgba(120,140,160,0.8)':'rgba(232,182,76,0.9)'; ctx.lineWidth=1.1; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(lean*0.7+3.8,-14.4); ctx.quadraticCurveTo(lean*0.7+7,-18+fw, lean*0.7+9.4,-20.5+fw); ctx.stroke();
    ctx.strokeStyle=gh?'rgba(120,140,160,0.45)':'rgba(200,30,44,0.65)'; ctx.lineWidth=0.7;
    for(let fb=0;fb<3;fb++){ const ft2=0.35+fb*0.25;
      const bx=lean*0.7+3.8+(9.4-3.8)*ft2, by=-14.4+(-20.5+fw+14.4)*ft2;
      ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx-1.6,by-1.4); ctx.stroke(); } }
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
  if(P.inv>0 && Math.floor(P.inv*20)%2===0){ ctx.globalAlpha=0.3; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,16,0,6.28); ctx.fill(); ctx.globalAlpha=1; }
  ctx.restore();
}
const BOSS_DEFS={
  pitboss:{name:'THE PIT BOSS', vt:'brute'},
  croupier:{name:'THE CROUPIER', vt:'shooter'},
  collector:{name:'THE DEBT COLLECTOR', vt:'hexer'},
  thehouse:{name:'THE HOUSE ITSELF', vt:'revenant'}
};
/* ============================================================
   BOSSES + SPECIAL ENEMY BEHAVIOR
   ============================================================ */
function spawnBoss(){
  const order=['pitboss','croupier','collector','thehouse'];
  const kind=order[(Math.floor(wave/10)-1)%order.length];
  const a=Math.random()*6.283, dd=Math.max(VW,VH)*0.55;
  const x=clamp(P.x+Math.cos(a)*dd,40,CFG.arena-40), y=clamp(P.y+Math.sin(a)*dd,40,CFG.arena-40);
  spawnEnemy(kind,x,y);
  const b=enemies[enemies.length-1]; if(b){ b.boss=true; if(contractDone('pallbearer')){ b.hp*=0.9; b.maxhp=(b.maxhp||b.hp)*0.9; } b.bossKind=kind; b.vt=BOSS_DEFS[kind].vt; b.bstate='stalk'; b.bt=2; b.spiralA=0; }
  showStreak('⚜ '+BOSS_DEFS[kind].name+' APPROACHES ⚜'); SFX.bossRoar(); flash(0.5,'#c98bff'); shake=Math.min(20,shake+12); startDrone();
}
function bossAI(e,dt,dx,dy,d){
  const k=e.bossKind;
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
  if(k==='croupier'){
    if(d>240){ e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt; } else { e.x+=-dy/d*e.spd*0.6*dt; e.y+=dx/d*e.spd*0.6*dt; }
    e.v1=(e.v1||0)-dt; e.v2=(e.v2||0)-dt;
    if(e.v1<=0){ e.v1=2.3; for(let i2=0;i2<10;i2++){ const an=i2/10*6.283+gt; ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(an)*170,vy:Math.sin(an)*170,r:8,dmg:e.dmg,life:4}); } SFX.eshoot(); }
    if(e.v2<=0){ e.v2=4.6; const ba=Math.atan2(dy,dx); for(let i2=0;i2<3;i2++) setTimeout(()=>{ if(state==='playing' && enemies.includes(e)) ebullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(ba)*300,vy:Math.sin(ba)*300,r:9,dmg:e.dmg*1.2,life:3.4}); },i2*140); }
    return true;
  }
  if(k==='collector'){
    e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
    e.v1=(e.v1||0)-dt;
    if(e.v1<=0){ e.v1=4; ring(e.x,e.y,90,'#6a4ab5'); SFX.murmur();
      for(let i2=0;i2<3 && enemies.length<CFG.spawn.max;i2++){ const an=Math.random()*6.283; spawnEnemy('swarm', clamp(e.x+Math.cos(an)*40,20,CFG.arena-20), clamp(e.y+Math.sin(an)*40,20,CFG.arena-20)); } }
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
   LOOP + START
   ============================================================ */
let last=0;
function loop(now){
  requestAnimationFrame(loop);
  try{
  const dt=Math.min(Math.max((now-last)/1000,0),0.05); last=now;
  if(loopPrev){ frameAvg=frameAvg*0.93+(now-loopPrev)*0.07; } loopPrev=now; qLow = GFX.q==='low' ? true : GFX.q==='high' ? false : (qLow ? (frameAvg>18) : (frameAvg>22));
  if(qLow!==window._qPrev){ window._qPrev=qLow; resize(); }
  if(GFX.shake===0) shake=0; else if(GFX.shake<1) shake*=0.8;
  document.body.classList.toggle('gamble', state==='slot'||state==='wheel'||state==='crash'||state==='marker');
  if(state==='playing'){
    if(hitstop>0){ hitstop-=dt; }
    else if(!tabHold){ update(dt*1.63*(slowT>0?0.35:1)); }
    updateHUD();
  }
  else if(state==='wheel'){ tickWheel(dt); }
  else if(state==='crash'){ tickCrash(dt); }
  else if(state==='slot'){ tickSlot(dt); }
  if(P) render();
  }catch(_e){ if(!window._amErr){ window._amErr=1; console.error('[ANTE MORTEM]',_e); } }
}
function startGame(){
  initAudio(); if(AC&&AC.state==='suspended')AC.resume();
  P={ x:CFG.arena/2, y:CFG.arena/2, aim:0, moving:false, inv:0, coins:0, kills:0,
    hp:CFG.player.maxHp, maxHp:CFG.player.maxHp, speed:CFG.player.speed, radius:CFG.player.radius, pickup:CFG.player.pickup,
    damage:CFG.player.damage, fireRate:CFG.player.fireRate, projectiles:CFG.player.projectiles, pierce:CFG.player.pierce,
    projSpeed:CFG.player.projSpeed, projLife:CFG.player.projLife, projRadius:CFG.player.projRadius,
    crit:CFG.player.crit, critMult:CFG.player.critMult, instakill:CFG.player.instakill, regen:CFG.player.regen,
    coinMult:CFG.player.coinMult, lifesteal:CFG.player.lifesteal,
    xp:0, xpNext:8, level:1, midasStacks:0, mercy:0, comboMult:1, surgeT:0,
    wlv:{bolt:1,cards:0,orbit:0,scythe:0,spark:0,chand:0,knives:0,aura:0,nova:0,seeker:0}, passiveList:[], curses:[] };
  enemies=[]; bullets=[]; ebullets=[]; orbs=[]; coins=[]; parts=[]; texts=[]; rings=[]; sparks=[]; sideBoons=[]; smites=[];
  owned.clear();
  gt=0; shake=0; hitstop=0; killStreak=0; streakT=0; excite=0; fireAcc=0; pending=[]; LT.runs++; bump('runs',LT.runs); fever=0; feverOn=false; feverT=0; tarots=[]; tarotT=14; decals=[]; wheelTok=null; wheelTokT=40; crashTok=null; crashTokT=38; bounty=null; bountyT=34; slotBank=0; vouchers=0; bountyStk=0; goldenT=0; ovBonusNext=false; slowT=0; prevHp=0; dare=null; dareT=46; ascTime=5; ascPend=0;
  if(!RANK._ld){ RANK._ld=1; loadRank(); }
  applyRankPerks(); recToasted=new Set(); applyVault(); applyAchPerks(); idxSee('w','bolt');
  P._idle=0; P._sigT=0; P._corners=new Set(); P._chestsRun=0; P._roulRun=0; P._pauses=0; P._1313=false;
  { const now=new Date();
    if(now.getHours()===0) secret('midnight','THE WITCHING HOUR');
    if(now.getDay()===5 && now.getDate()===13) secret('friday13','UNLUCKIEST NIGHT'); }
  wave=0; waveClearTarget=0; waveGap=0.4; slotIndex=0; Object.assign(CFG.scale, BASE_SCALE);
  if(!grainReady) buildGrain();
  buildAudience(); buildHall(); renderRelics();
  debuffs=[];
  elMenu.classList.add('hidden'); elGO.classList.add('hidden'); elHud.classList.remove('hidden');
  state='playing'; last=performance.now();
}
