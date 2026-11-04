"use strict";
const DEBUFF_POOL=[
  {label:'−12% DMG', dur:16, ap:()=>{ P.damage*=0.88; return ()=>{P.damage/=0.88;}; }},
  {label:'−30% RANGE', dur:16, ap:()=>{ const o=P.projLife; P.projLife*=0.7; return ()=>{P.projLife=o;}; }},
  {label:'−20% FIRE', dur:14, ap:()=>{ P.fireRate*=0.8; return ()=>{P.fireRate/=0.8;}; }},
  {label:'−15% SPEED', dur:12, ap:()=>{ P.speed*=0.85; return ()=>{P.speed/=0.85;}; }},
  {label:'POISON', dur:20, dot:1, ap:()=>{ return ()=>{}; }},
  {label:'GLASS BONES +25% DMG TAKEN', dur:14, ap:()=>{ P.frail=true; return ()=>{P.frail=false;}; }},
  {label:'LEAD SHOES −25% SPD', dur:14, ap:()=>{ P.speed*=0.75; return ()=>{P.speed/=0.75;}; }},
  {label:'BLURRED EYES −30% SHOT SPD', dur:14, ap:()=>{ P.projSpeed*=0.7; return ()=>{P.projSpeed/=0.7;}; }},
  {label:'NUMB HANDS −10% CRIT', dur:16, ap:()=>{ const o=P.crit; P.crit=Math.max(0,P.crit-0.10); return ()=>{P.crit=o;}; }},
  {label:'TAXED −50% COINS', dur:18, ap:()=>{ const o=P.coinMult||1; P.coinMult=o*0.5; return ()=>{P.coinMult=o;}; }},
  {label:'DIM WICK −25% PICKUP', dur:14, ap:()=>{ P.pickup*=0.75; return ()=>{P.pickup/=0.75;}; }},
  {label:'HEXBURN', dur:12, dot:2, ap:()=>{ return ()=>{}; }},
  {label:'SHORT FUSE −25% RANGE', dur:12, ap:()=>{ P.projLife*=0.75; return ()=>{P.projLife/=0.75;}; }},
  {label:'CROOKED DICE +1 TO ROLL', dur:22, ap:()=>{ P.hexDice=true; return ()=>{P.hexDice=false;}; }},
  {label:'COLD TABLE −30% XP', dur:18, ap:()=>{ const o=P.xpMult||1; P.xpMult=o*0.7; return ()=>{P.xpMult=o;}; }}
];
function applyDebuff(d){
  d = d || DEBUFF_POOL[(rng('tarot')*DEBUFF_POOL.length)|0];
  const revert=d.ap();
  { const dd=Math.max(2,Math.round(d.dur*Math.max(0.5,P.curseCut||1))); debuffs.push({label:d.label, t:dd, dur:dd, revert, dot:d.dot||0, poison:!!d.dot}); }
  idxSee('c',d.label); if(typeof RUN!=='undefined') RUN.curses=(RUN.curses||0)+1;
  flash(0.3,'#8b1620'); SFX.thud();
  return d.label+' · '+d.dur+'s';
}
function curseLabel(d){ return d.label+' · '+d.dur+'s'; }
function startFever(){
  if(P.hp<=Math.max(1,P.maxHp*0.02)) secret('edge','DANCING ON THE EDGE');
  feverOn=true; feverT=8+(P.feverDur||0); fever=1;
  if(contractDone('cinder')){ let hitN=0; for(const e of enemies){ if(Math.hypot(e.x-P.x,e.y-P.y)<140){ e.hp-=60; e.flash=0.12; hitN++; } } if(hitN){ ring(P.x,P.y,140,'#ffd36b'); flash(0.3,'#ffd36b'); SFX.nova(); } }
  P.godT=3; P.inv=Math.max(P.inv||0,3);
  P._fvRate=P.fireRate; P.fireRate*=1.7; P._fvCoin=P.coinMult; P.coinMult+=1;
  bigWin('FEVER',2); announce('☘ UNTOUCHABLE — YOUR TOUCH IS DEATH · 3s ☘', true);
  SFX.dingBells(); SFX.cashout(); SFX.seraph(); tone(1568,0.3,'sine',0.1); setTimeout(()=>tone(2093,0.26,'sine',0.08),90); coinRain(20); excite=1; flash(0.45,'#8bff9a');
  LT.fevers=(LT.fevers||0)+1; bump('fevers',LT.fevers);
}
function endFever(){
  feverOn=false; fever=0; feverT=0;
  [880,660,440].forEach((f,i)=>setTimeout(()=>tone(f,0.14,'sine',0.04),i*110)); // the fire sighs out, gently
  window._feverLock=gt+60; // the pit cools for a minute — grants bypass this
  if(P._fvRate!==undefined){ P.fireRate=P._fvRate; P._fvRate=undefined; }
  if(P._fvCoin!==undefined){ P.coinMult=P._fvCoin; P._fvCoin=undefined; }
  SFX.thud();
}
function tickFever(dt){
  if(goldenT>0) goldenT-=dt;
  if(P.godT>0){ P.godT-=dt; P.inv=Math.max(P.inv,0.12);
    if(Math.random()<0.5) parts.push({x:P.x+rnd(-14,14),y:P.y+rnd(-10,12),vx:rnd(-20,20),vy:-rnd(50,130),life:rnd(.25,.5),col:'#8bff9a',r:rnd(1.4,2.8)});
  }
  if(feverOn){ feverT-=dt; excite=1;
    if(Math.random()<0.3) parts.push({x:P.x+rnd(-16,16),y:P.y+rnd(-10,14),vx:rnd(-12,12),vy:-rnd(40,110),life:rnd(.3,.6),col:'#ffd36b',r:rnd(1.4,2.8)});
    if(feverT<=0) endFever();
  } else { fever=Math.max(0, fever-dt*0.012); }
}
// B4: every dd now says what its fx actually does (most had drifted onto a neighbour's text)
const TAROT_FATES=[
 {n:'THE SUN', dd:'Full heal · +50% damage 10s · +20 coins',t:2,c:'#fff2c0',fx:()=>{ P.hp=P.maxHp; P.damage*=1.5; debuffs.push({label:'☀ STRENGTH +50%',t:10,dur:10,revert:()=>{P.damage/=1.5;},dot:0,poison:false,good:true}); P.coins+=20; LT.coins+=20; coinRain(14); }},
 {n:'THE WORLD', dd:'+2 levels · heal 30%',t:2,c:'#fff2c0',fx:()=>{ pending.push({}); pending.push({}); P.hp=Math.min(P.maxHp,P.hp+P.maxHp*0.3); SFX.levelUp(); }},
 {n:'WHEEL OF FORTUNE', dd:'+25 coins',t:1,c:'#e8b64c',fx:()=>{ P.coins+=25; LT.coins+=25; coinRain(20); SFX.cashout(); }},
 {n:'THE STAR', dd:'Every soul orb and coin on the floor flies to you',t:1,c:'#9adcff',fx:()=>{ for(const o of orbs){ o.x=P.x+rrnd('tarot',-30,30); o.y=P.y+rrnd('tarot',-30,30); } for(const c2 of coins){ c2.x=P.x+rrnd('tarot',-30,30); c2.y=P.y+rrnd('tarot',-30,30); } ring(P.x,P.y,200,'#9adcff'); }},
 {n:'STRENGTH', dd:'+50% damage 12s',t:1,c:'#ff9a5b',fx:()=>{ P.damage*=1.5; debuffs.push({label:'☀ STRENGTH +50%',t:12,dur:12,revert:()=>{P.damage/=1.5;},dot:0,poison:false,good:true}); }},
 {n:'TEMPERANCE', dd:'Heal 35% of your blood',t:1,c:'#8bff9a',fx:()=>{ P.hp=Math.min(P.maxHp,P.hp+P.maxHp*0.35); }},
 {n:'THE EMPRESS', dd:'+15 coins · heal 15%',t:1,c:'#ffb0c8',fx:()=>{ P.coins+=15; LT.coins+=15; P.hp=Math.min(P.maxHp,P.hp+P.maxHp*0.15); coinRain(10); }},
 {n:'THE CHARIOT', dd:'+40% speed 10s',t:1,c:'#9adcff',fx:()=>{ P.speed*=1.4; debuffs.push({label:'⚡ CHARIOT +40%',t:10,dur:10,revert:()=>{P.speed/=1.4;},dot:0,poison:false,good:true}); }},
 {n:'THE MAGICIAN', dd:'+35% fever charge (may ignite FEVER)',t:1,c:'#c9ff7a',fx:()=>{ fever=Math.min(1,fever+0.35); if(fever>=1&&!feverOn) startFever(); }},
 {n:'THE EMPEROR', dd:'+10 gilt, kept forever',t:1,c:'#ffd36b',fx:()=>{ gilt+=10; saveGilt(); SFX.chipStack(); }},
 {n:'JUSTICE', dd:'Slays every common foe within 320px',t:1,c:'#ff5566',fx:()=>{ for(let i2=enemies.length-1;i2>=0;i2--){ const e=enemies[i2]; if(!e.boss&&!e.elite&&Math.hypot(e.x-P.x,e.y-P.y)<320) killEnemy(e,i2); } shake=Math.min(20,shake+10); }},
 {n:'THE HIEROPHANT', dd:'Untouchable for 4s',t:1,c:'#eaf3ff',fx:()=>{ P.inv=Math.max(P.inv,4); ring(P.x,P.y,60,'#eaf3ff'); }},
 {n:'THE TOWER', dd:'Lose 15% of your max blood',t:-1,c:'#ff5560',fx:()=>{ hurtPlayer(Math.round(P.maxHp*0.15)); }},
 {n:'THE MOON', dd:'A random curse',t:-1,c:'#a794c4',fx:()=>{ applyDebuff(DEBUFF_POOL[(rng('tarot')*DEBUFF_POOL.length)|0]); }},
 {n:'THE HANGED MAN', dd:'−30% speed 8s',t:-1,c:'#7a8aa0',fx:()=>{ P.speed*=0.7; debuffs.push({label:'⛓ SLOWED −30%',t:8,dur:8,revert:()=>{P.speed/=0.7;},dot:0,poison:false}); }},
 {n:'DEATH', dd:'Four swarmers rise around you',t:-1,c:'#c98bff',fx:()=>{ for(let i2=0;i2<4&&enemies.length<CFG.spawn.max;i2++){ const a2=rng('tarot')*6.283; spawnEnemy('swarm',clamp(P.x+Math.cos(a2)*140,20,CFG.arena-20),clamp(P.y+Math.sin(a2)*140,20,CFG.arena-20)); } }},
 {n:'THE DEVIL', dd:'Sweeps ALL ground coins',t:-1,c:'#ff5560',fx:()=>{ const n5=coins.length; for(const c5 of coins) burst(c5.x,c5.y,1,'#5a4a3a'); coins.length=0; if(n5>0) ftext(P.x,P.y-24,'−'+n5+' COINS SWEPT','#ff6b6b',true); SFX.thud(); }},
 {n:'FIVE OF CUPS', dd:'Lose 20% of this level\'s XP',t:-1,c:'#8a97b5',fx:()=>{ P.xp=Math.floor(P.xp*0.8); }},
 {n:'THE FOOL', dd:'Flung 300–500px in a random direction',t:-1,c:'#e8d9c0',fx:()=>{ const a2=rng('tarot')*6.283,d2=300+rng('tarot')*200; P.x=clamp(P.x+Math.cos(a2)*d2,40,CFG.arena-40); P.y=clamp(P.y+Math.sin(a2)*d2,40,CFG.arena-40); P.inv=Math.max(P.inv,1.2); flash(0.4,'#e8d9c0'); }},
 {n:'SEVEN OF SWORDS', dd:'−20% damage 8s',t:-1,c:'#b0b8c8',fx:()=>{ P.damage*=0.8; debuffs.push({label:'🗡 −20% DMG',t:8,dur:8,revert:()=>{P.damage/=0.8;},dot:0,poison:false}); }},
 {n:'THE HERMIT', dd:'−20% speed 6s',t:-1,c:'#6a7488',fx:()=>{ P.speed*=0.8; debuffs.push({label:'🏮 −20% SPD',t:6,dur:6,revert:()=>{P.speed/=0.8;},dot:0,poison:false}); }},
 {n:'WHEEL REVERSED', dd:'Kill streak lost · −50% fever charge',t:-1,c:'#a06a12',fx:()=>{ killStreak=0; streakT=0; fever=Math.max(0,fever-0.5); }},
 {n:'TOWER REVERSED', dd:'Lose 30% of your max blood + a curse',t:-2,c:'#e3b7ff',fx:()=>{ hurtPlayer(Math.round(P.maxHp*0.3)); applyDebuff(DEBUFF_POOL[(rng('tarot')*DEBUFF_POOL.length)|0]); }},
 {n:'DEATH REVERSED', dd:'An elite and four swarmers hunt you',t:-2,c:'#e3b7ff',fx:()=>{ if(enemies.length<CFG.spawn.max) spawnEnemy('elite',clamp(P.x+180,20,CFG.arena-20),clamp(P.y,20,CFG.arena-20)); for(let i2=0;i2<4&&enemies.length<CFG.spawn.max;i2++){ const a2=Math.random()*6.283; spawnEnemy('swarm',clamp(P.x+Math.cos(a2)*160,20,CFG.arena-20),clamp(P.y+Math.sin(a2)*160,20,CFG.arena-20)); } }}
];
const TR_ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV'];
function revealTarot(card){
  idxSee('t',card.n);
  const r=$('tarotReveal'); if(!r) return;
  const tier=card.t>=2?'vg':card.t===1?'g':card.t===-1?'b':'vb';
  r.className=tier;
  const ix=TAROT_FATES.indexOf(card); r.querySelector('.trNum').textContent=TR_ROMAN[ix<0?0:ix];
  r.querySelector('.trGlyph').textContent=card.t>0?'★':'☠';
  r.querySelector('.trName').textContent=card.n;
  r.querySelector('.trTier').textContent=card.t>=2?'GREAT BLESSING':card.t===1?'BLESSING':card.t===-1?'CURSE':'GREAT CURSE';
  const cd=r.querySelector('.trCard'); cd.style.animation='none'; void cd.offsetWidth; cd.style.animation='';
  r.classList.remove('hidden'); clearTimeout(r._t); r._t=setTimeout(()=>r.classList.add('hidden'),2600);
  if(card.t>=2){ SFX.seraph(); SFX.dingBells(); }
  else if(card.t===1) SFX.dingBells();
  else if(card.t===-1) SFX.bust();
  else { SFX.bossRoar(); SFX.bust(); }
}
function tickTarot(dt){
  tickMajors(dt); // D4 — the Major Arcana keep bending the night even while the House walks
  if(houseActive){ tarots.length=0; return; }
  tarotT-=dt;
  if(tarotT<=0 && tarots.length<2){
    tarotT=(14+rng('tarot')*10)/((window._fmods&&window._fmods.tarot)||1);
    const a=rng('tarot')*6.283, dd=260+rng('tarot')*300;
    const maj=arcanaRollSpawn(); // D4 — sometimes the deck deals from the Major Arcana
    tarots.push({x:clamp(P.x+Math.cos(a)*dd,40,CFG.arena-40), y:clamp(P.y+Math.sin(a)*dd,40,CFG.arena-40), ph:rng('tarot')*6.28, t:maj?30:24, maj:maj||null});
    if(maj) arcanaManifest(maj); else { showStreak('☨ A TAROT CARD MANIFESTS ☨'); SFX.tingle(); }
  }
  for(let i=tarots.length-1;i>=0;i--){ const c=tarots[i]; c.t-=dt;
    if(c.t<=0){ tarots.splice(i,1); continue; }
    if(Math.hypot(P.x-c.x,P.y-c.y)<P.radius+(c.maj?20:16)){
      tarots.splice(i,1);
      if(c.maj){ arcanaDraw(c.maj); continue; }
      let f=TAROT_FATES[(rng('tarot')*TAROT_FATES.length)|0];
      if(f.t<0 && rng('tarot')<(P.tarotLuck||0)){ f=TAROT_FATES[(rng('tarot')*TAROT_FATES.length)|0]; announce('♠ MARKED CARDS — REDRAWN ♠',true); SFX.uiDing(); }
      revealTarot(f); f.fx(); ring(P.x,P.y,95,f.c);
      announce('☨ '+f.n+' ☨', f.t>0); flash(0.4,f.c); sparkBurst(f.t>0?24:12);
      if(f.t<0){ shake=Math.min(14,shake+6); }
      LT.tarot=(LT.tarot||0)+1; bump('tarot',LT.tarot);
    }
  }
}
function drawTarots(){
  drawMajorsFX();
  for(const c of tarots){
    if(!inView(c.x,c.y,120)) continue;
    if(c.maj){ drawMajorCard(c); continue; }
    const bob=Math.sin(gt*2.2+c.ph)*3.4, fl=c.t<4 ? (Math.floor(gt*8)%2?0.35:1) : 1;
    const fs=Math.sin(gt*2.4+c.ph), flip=fs*fs*fs;
    ctx.save(); ctx.translate(c.x,c.y);
    ctx.globalAlpha=0.3*fl; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(0,17,10*Math.max(0.3,Math.abs(flip)),3.4,0,0,6.28); ctx.fill();
    ctx.translate(0,bob); ctx.globalAlpha=fl;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(0,0,0,0,0,38); g.addColorStop(0,'rgba(201,139,255,0.42)'); g.addColorStop(1,'rgba(201,139,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,38,0,6.28); ctx.fill(); ctx.restore();
    ctx.rotate(Math.sin(gt*1.5+c.ph)*0.1);
    ctx.scale(Math.max(0.16,Math.abs(flip)),1);
    const back=flip<0;
    ctx.fillStyle=back?'#241540':'#f4efe0'; ctx.fillRect(-9.5,-14,19,28);
    ctx.strokeStyle='#c98bff'; ctx.lineWidth=1.6; ctx.strokeRect(-9.5,-14,19,28);
    ctx.fillStyle=back?'#c98bff':'#7a3aa8'; ctx.font='700 13px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(back?'✦':'★',0,0.5);
    if(!back){ const gl9=((gt*0.9+c.ph)%1);
      ctx.globalAlpha=fl*0.55*(1-Math.abs(gl9-0.5)*2);
      ctx.strokeStyle='#fff'; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(-12+gl9*24,-14); ctx.lineTo(-4+gl9*24,14); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha=1;
    if(Math.random()<0.12){ parts.push({x:c.x+rnd(-14,14),y:c.y+bob+rnd(-16,16),vx:0,vy:-rnd(14,30),life:0.5,col:'#c98bff',r:1.4}); }
  }
  // violet fate-arrow — points to the nearest tarot when no offering claims the arrow
  if(state==='playing' && !interactable && tarots.length){
    let nr=null,nd=1e9;
    for(const c of tarots){ const d2=Math.hypot(c.x-P.x,c.y-P.y); if(d2<nd){ nd=d2; nr=c; } }
    if(nr && nd>150){
      const aa2=Math.atan2(nr.y-P.y,nr.x-P.x), pu3=0.7+Math.sin(gt*6)*0.3, orb=58+Math.sin(gt*6)*10;
      const nearFade=Math.min(1,(nd-150)/120);
      for(let ai=2;ai>=0;ai--){
        const off=orb-ai*11, sc9=(0.8+pu3*0.5)*(1-ai*0.14);
        ctx.save(); ctx.translate(P.x+Math.cos(aa2)*off,P.y+Math.sin(aa2)*off); ctx.rotate(aa2);
        ctx.globalAlpha=(0.5+Math.sin(gt*6)*0.25)*nearFade*(1-ai*0.32); ctx.scale(sc9,sc9);
        const ac9=nr.maj?'#ffd36b':'#c98bff'; ctx.shadowColor=ac9; ctx.shadowBlur=ai?0:16; ctx.fillStyle=ac9;
        ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-8,-11); ctx.lineTo(-3,0); ctx.lineTo(-8,11); ctx.closePath(); ctx.fill();
        if(!ai){ ctx.fillStyle='#fff'; ctx.globalAlpha*=0.8;
          ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-4,-6); ctx.lineTo(-1,0); ctx.lineTo(-4,6); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
      ctx.globalAlpha=1;
      if(Math.random()<0.08) parts.push({x:nr.x+rnd(-8,8),y:nr.y+rnd(-10,6),vx:0,vy:-rnd(16,34),life:0.5,col:nr.maj?'#ffd36b':'#c98bff',r:1.5});
    }
  }
}

function tickDebuffs(dt){
  let poison=0;
  for(let i=debuffs.length-1;i>=0;i--){ const b=debuffs[i];
    b.t-=dt;
    if(b.dot){ poison+=b.dot*dt; if(Math.random()<dt*4) burst(P.x+rnd(-10,10),P.y+rnd(-10,10),1,'#8bff9a'); }
    if(b.t<=0){ try{b.revert();}catch(e){} debuffs.splice(i,1); }
  }
  if(poison>0 && P.inv<=0){ P.hp-=poison; if(P.hp<=0 && state==='playing'){ P.hp=0; die(); } }
}
const CURSES=[
  {short:'−12% speed', ap:()=>{P.speed*=0.88; return ()=>{P.speed/=0.88;};}},
  {short:'−15% fire rate', ap:()=>{P.fireRate*=0.85; return ()=>{P.fireRate/=0.85;};}},
  {short:'−15% max HP', ap:()=>{const d=Math.floor(P.maxHp*0.15); P.maxHp-=d; P.hp=Math.min(P.hp,P.maxHp); return ()=>{P.maxHp+=d;};}},
  {short:'−20% pickup', ap:()=>{P.pickup*=0.8; return ()=>{P.pickup/=0.8;};}}
];
const FATE=[
  {id:'arsenal', g:'⚔', col:'#c98bff', name:'ARSENAL'},
  {id:'might',   g:'✦', col:'#ff6b6b', name:'MIGHT'},
  {id:'vigor',   g:'✚', col:'#6bd88a', name:'VIGOR'},
  {id:'swift',   g:'➤', col:'#6db4ff', name:'SWIFT'},
  {id:'luck',    g:'◈', col:'#e8b64c', name:'LUCK'}
];
const FATE_POOL={
  might:['dmg','fire'],
  vigor:['hp'],
  swift:['spd'],
  luck:['luck']
};

/* ============================================================
   ✦ THE MAJOR ARCANA (D4) — twelve rarer cards that bend the whole night.
   A manifesting tarot is MAJOR with 5% + 1% per HUD minute (max 12%); one on the
   floor at a time; each arcanum can be drawn once per night. Timed arcana ride the
   debuffs list (good:true) so the HUD shows the countdown; pacts last the night.
   Probe hook: arcanaDraw(id) draws one now; window._arcForce=id deals it next.
   ============================================================ */
const ARC_ODDS={base:0.05, perMin:0.01, cap:0.12};
function arcOdds(){ return Math.min(ARC_ODDS.cap, ARC_ODDS.base+ARC_ODDS.perMin*Math.max(0,gt||0)/60); }
let ARC={p:null};
function arcState(){
  if(ARC.p!==P) ARC={p:P, on:{}, drawn:[], deathSkip:false, candles:[], towerT:0, bolts:[], starCd:0, beams:[], moonT:0.8,
    wheelA:0, twinA:0, twinT:0, judgeT:0, st:{zap:0,beam:0,wheel:0,twin:0,justice:0,tower:0,skip:0}, lastHurt:P?P._lastHurtGt:undefined, hpSeen:P?P.hp:0};
  return ARC;
}
function arcActive(id){ return !!(P && ARC.p===P && ARC.on && ARC.on[id]); }
function arcById(id){ return MAJOR_ARCANA.find(m=>m.id===id); }
const _arcThr={};
function arcThr(k,ms){ const n=performance.now(); if(n-(_arcThr[k]||-1e9)<ms) return false; _arcThr[k]=n; return true; }
// one hit from an arcanum — iterate enemies BACKWARD when you call this (killEnemy splices)
function arcHit(e,i,dmg,col,txt){
  if(!e || e.hp<=0) return;
  e.hp-=dmg; trackDmg(dmg); if(txt!==null) e.flash=0.12; // null = a quiet burn tick, no white flash
  if(txt) ftext(e.x,e.y-e.r,Math.round(dmg),col||'#fff2c0',dmg>=150);
  if(e.unkillable){ e.hp=e.maxhp; return; }
  if(e.hp<=0){ const j=(enemies[i]===e)?i:enemies.indexOf(e); if(j>=0) killEnemy(e,j); }
}
const ARC_SFX={
  manifest(){ [98,147,196].forEach((f,i)=>setTimeout(()=>tone(f,1.1,'sawtooth',0.05,f*1.01),i*90));
    [392,494,587,784].forEach((f,i)=>setTimeout(()=>tone(f,0.7,'triangle',0.09),260+i*80)); setTimeout(()=>SFX.tingle(),520); },
  toll(){ const b=110; tone(b,2.2,'sine',0.34); tone(b*2,1.6,'sine',0.15); tone(b*2.76,1.3,'sine',0.12); tone(b*5.4,0.9,'sine',0.06); tone(55,1.4,'sine',0.25,41); noise(0.28,0.16,500); },
  flip(){ [262,330,392,523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>{ tone(f,0.9,'sine',0.15); tone(f*1.5,0.5,'sine',0.05); },i*55)); noise(0.6,0.08,7500); setTimeout(()=>SFX.dingBells(),300); },
  pact(){ tone(55,1.6,'sawtooth',0.12,41); tone(82,1.4,'sine',0.18,61); for(let i=0;i<3;i++) setTimeout(()=>noise(0.12,0.12,3000),300+i*140); },
  fade(){ [784,587,440].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'sine',0.07),i*120)); },
  zap(){ if(!arcThr('zap',70)) return; noise(0.08,0.12,7000); tone(1800+Math.random()*600,0.07,'square',0.05,400); },
  beamWarn(){ tone(1400,0.45,'sine',0.08,520); },
  beamHit(){ tone(90,0.45,'sine',0.3,38); noise(0.3,0.18,1400); tone(2093,0.3,'sine',0.07); },
  wheel(){ if(!arcThr('whl',90)) return; tone(280+Math.random()*80,0.05,'square',0.07,140); noise(0.03,0.06,2400); },
  gavel(){ tone(160,0.12,'square',0.2,90); noise(0.06,0.2,900); setTimeout(()=>tone(1245,0.18,'sine',0.12),60); },
  crash(){ noise(1.2,0.3,520); tone(70,1.0,'sawtooth',0.24,30); setTimeout(()=>noise(0.5,0.2,2400),120); SFX.bossRoar(); },
  twin(){ if(!arcThr('twin',140)) return; tone(880,0.06,'triangle',0.04,1320); },
  sun(){ tone(220,1.2,'sawtooth',0.08,440); SFX.seraph(); },
  rise(){ SFX.seraph(); [131,196,262,392,523].forEach((f,i)=>setTimeout(()=>tone(f,0.8,'sine',0.2),i*90)); noise(0.5,0.14,1800); }
};
const ARC_KIND={t:'TIMED', p:'PACT · FOR THE NIGHT', i:'AT ONCE'};
function arcKindTxt(m){ return m.k==='t'?(m.dur+'s'):ARC_KIND[m.k]; }
const MAJOR_ARCANA=[
 {id:'wheel', num:'X', n:'WHEEL OF FORTUNE', g:'☸', c:'#ffb300', k:'t', dur:75, good:true,
  dd:'For 75s every slot reel deals one rarity higher (common → uncommon → rare → ultra rare → legendary)'},
 {id:'death', num:'XIII', n:'DEATH', g:'☠', c:'#d24dff', k:'p', good:true,
  dd:'Your next death is skipped: rise at 60% blood, untouchable 3s, a 300-damage nova. COST: the Death Roll is gone for the night',
  ap:()=>{ P.markerUsed=true; arcState().deathSkip=true; }},
 {id:'tower', num:'XVI', n:'THE TOWER', g:'⚡', c:'#ff3b2f', k:'i', good:false,
  dd:'The candles fall: every enemy on screen takes 60% of its max blood + 300 (bosses 20%). COST: you lose ALL your coins',
  ap:()=>{ const A=arcState(); A.towerT=0.55;
    for(let k=0;k<20;k++){ const tx=P.x+rnd(-VW/2+30,VW/2-30), ty=P.y+rnd(-VH/2+40,VH/2-30); A.candles.push({x:tx,y:ty,t:0.3+Math.random()*0.25,dur:0.55}); }
    const n=P.coins|0; P.coins=0; if(n>0) ftext(P.x,P.y-30,'−'+n+' COINS','#ff6b6b',true); SFX.thud(); }},
 {id:'star', num:'XVII', n:'THE STAR', g:'✷', c:'#5ee6ff', k:'t', dur:75, good:true,
  dd:'For 75s soul orbs become stars: each one you collect fires chain lightning, 5 jumps × 3× your damage'},
 {id:'sun', num:'XIX', n:'THE SUN', g:'☀', c:'#ffe14d', k:'t', dur:60, good:true,
  dd:'For 60s every enemy on screen burns for 7% of its max blood per second (bosses 1.5%). COST: you take +25% damage',
  on:()=>{ P.dmgTakenMult=(P.dmgTakenMult||1)*1.25; ARC_SFX.sun(); }, off:()=>{ P.dmgTakenMult=(P.dmgTakenMult||1)/1.25; }},
 {id:'devil', num:'XV', n:'THE DEVIL', g:'⛓', c:'#ff1f6b', k:'p', good:true,
  dd:'For the night: +50% damage and +25% fire rate. COST: your max blood is halved',
  ap:()=>{ P.damage*=1.5; P.fireRate*=1.25; P.maxHp=Math.max(1,Math.round(P.maxHp*0.5)); P.hp=Math.min(P.hp,P.maxHp); }},
 {id:'hanged', num:'XII', n:'THE HANGED MAN', g:'⚓', c:'#2de0c0', k:'p', good:true,
  dd:'For the night: you take 40% less damage. COST: −20% move speed',
  ap:()=>{ P.dmgTakenMult=(P.dmgTakenMult||1)*0.6; P.speed*=0.8; }},
 {id:'justice', num:'XI', n:'JUSTICE', g:'⚖', c:'#4d6bff', k:'t', dur:75, good:true,
  dd:'For 75s every hit you take is repaid ×5 (at least 60) to every enemy within 260px'},
 {id:'chariot', num:'VII', n:'THE CHARIOT', g:'⚙', c:'#ff8a1f', k:'t', dur:75, good:true,
  dd:'For 75s: +30% move speed and 3 burning wheels orbit you, each strike 2.5× your damage',
  on:()=>{ P.speed*=1.3; }, off:()=>{ P.speed/=1.3; }},
 {id:'moon', num:'XVIII', n:'THE MOON', g:'☾', c:'#a98cff', k:'t', dur:75, good:true,
  dd:'For 75s a moonbeam falls every 2.5s on the thickest crowd on screen: 8× your damage in 100px'},
 {id:'judgement', num:'XX', n:'JUDGEMENT', g:'✵', c:'#4dff7a', k:'t', dur:60, good:true,
  dd:'Every soul orb on the floor flies to you now; for 60s every orb that drops is worth ×2 XP',
  on:()=>{ const A=arcState(); A.judgeT=2.5; for(const o of orbs) o._jx=1; }},
 {id:'lovers', num:'VI', n:'THE LOVERS', g:'♥', c:'#ff5fd0', k:'t', dur:90, good:true,
  dd:'For 90s a twin shade orbits you, firing a seeking bolt every 0.3s for 80% of your damage'}
];
setTimeout(()=>{ try{ if(typeof GLYPH_COL!=='undefined') for(const m of MAJOR_ARCANA) GLYPH_COL['ma_'+m.id]=m.c; }catch(e){} },0);
// the slot hook (weightedByRarity): THE WHEEL lifts every reel one rarity
function arcUp(chosen,buckets){
  if(!arcActive('wheel')) return chosen;
  const ord=['common','uncommon','rare','epic','legendary'], i=ord.indexOf(chosen); if(i<0) return chosen;
  for(let j=i+1;j<ord.length;j++) if(buckets[ord[j]]&&buckets[ord[j]].length) return ord[j];
  return chosen;
}
// the death hook (die): DEATH passes you over once
function arcanaCheatDeath(){
  if(!(P && ARC.p===P && ARC.deathSkip)) return false;
  ARC.deathSkip=false; ARC.st.skip++;
  P.hp=Math.max(1,Math.round(P.maxHp*0.6)); P.inv=Math.max(P.inv||0,3);
  if(P.martyr) P._mCap=P.hp; // THE MARTYR refuses healing, not resurrection (same law as the Death Roll)
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(Math.hypot(e.x-P.x,e.y-P.y)<260) arcHit(e,i,300,'#e3b7ff',true); }
  ring(P.x,P.y,260,'#d24dff'); ring(P.x,P.y,160,'#fff2c0'); burst(P.x,P.y,36,'#d24dff');
  flash(0.8,'#d24dff'); setTimeout(()=>flash(0.5,'#fff2c0'),120); shake=Math.min(26,shake+18); slowT=Math.max(slowT,0.6);
  announce('☠ DEATH PASSES YOU OVER ☠', true); ARC_SFX.toll(); setTimeout(()=>ARC_SFX.rise(),200);
  return true;
}
function arcanaRollSpawn(){
  const A=arcState();
  if(window._arcForce){ const m=arcById(window._arcForce); window._arcForce=null; if(m) return m.id; }
  if(tarots.some(t=>t.maj)) return null;
  const left=MAJOR_ARCANA.filter(m=>A.drawn.indexOf(m.id)<0);
  if(!left.length || rng('arcana')>=arcOdds()) return null; // own DAILY DEBT stream: the small tarot stream is untouched
  return left[(rng('arcana')*left.length)|0].id;
}
function arcanaManifest(id){
  announce('✦ A MAJOR ARCANUM MANIFESTS ✦', true); ARC_SFX.manifest(); flash(0.25,'#ffd36b');
}
function arcanaDraw(id){
  const m=arcById(id); if(!m || !P) return;
  const A=arcState(); if(A.drawn.indexOf(id)<0) A.drawn.push(id);
  idxSee('t','MAJOR:'+id);
  LT.tarot=(LT.tarot||0)+1; bump('tarot',LT.tarot);
  revealMajor(m);
  if(m.k==='t') arcStart(m); else if(m.ap) m.ap();
  if(m.k==='p') setTimeout(()=>ARC_SFX.pact(),900);
}
function arcStart(m){
  const A=arcState();
  if(A.on[m.id]){ const ex=debuffs.find(b=>b._arc===m.id); if(ex){ ex.t=m.dur; ex.dur=m.dur; } return; }
  A.on[m.id]=true; if(m.on) m.on();
  const pp=P;
  debuffs.push({label:m.g+' '+m.n, t:m.dur, dur:m.dur, _arc:m.id, dot:0, poison:false, good:true,
    revert:()=>{ if(ARC.p!==pp || !ARC.on[m.id]) return; ARC.on[m.id]=false; if(m.off) m.off();
      if(state==='playing'){ showStreak('… '+m.n+' FADES …'); ARC_SFX.fade(); } }});
}
function revealMajor(m){
  let r=$('arcanaReveal');
  if(!r){ r=document.createElement('div'); r.id='arcanaReveal'; r.className='hidden';
    r.innerHTML='<div class="arVeil"></div><div class="arRays"></div><div class="arStage"><div class="arCard">'
      +'<div class="arBack"><span>✦</span></div>'
      +'<div class="arFace"><div class="arNum"></div><div class="arGlyph"></div><div class="arName"></div><div class="arRib">MAJOR ARCANA</div><div class="arText"></div><div class="arKind"></div></div>'
      +'</div><div class="arFlecks"></div></div>';
    const host=($('tarotReveal')&&$('tarotReveal').parentNode)||document.body; host.appendChild(r); }
  r.style.setProperty('--ac',m.c);
  r.querySelector('.arNum').textContent=m.num;
  r.querySelector('.arGlyph').textContent=m.g;
  r.querySelector('.arName').textContent=m.n;
  r.querySelector('.arText').textContent=m.dd;
  r.querySelector('.arKind').textContent=m.k==='t'?('◷ '+m.dur+'s'):(m.k==='p'?'⛓ A PACT · FOR THE NIGHT':'⚡ AT ONCE');
  const fl=r.querySelector('.arFlecks'); fl.innerHTML='';
  for(let i=0;i<34;i++){ const s=document.createElement('i'); const a=Math.random()*6.283, d=120+Math.random()*190;
    s.style.setProperty('--fx',(Math.cos(a)*d).toFixed(0)+'px'); s.style.setProperty('--fy',(Math.sin(a)*d*0.8).toFixed(0)+'px');
    s.style.animationDelay=(0.68+Math.random()*0.25).toFixed(2)+'s'; s.style.background=i%3?m.c:'#ffd36b'; fl.appendChild(s); }
  r.classList.remove('hidden','go'); void r.offsetWidth; r.classList.add('go');
  clearTimeout(r._t); r._t=setTimeout(()=>r.classList.add('hidden'),4700);
  // beat 1 — the toll: the room goes dark and slow
  ARC_SFX.toll(); flash(0.45,'#c98bff'); shake=Math.min(18,shake+8); slowT=Math.max(slowT,0.75);
  if(typeof duckDrone==='function') duckDrone(2200);
  // beat 2 — the flip: the name lands
  setTimeout(()=>{ ARC_SFX.flip(); flash(0.55,m.c); if(P){ ring(P.x,P.y,140,m.c); ring(P.x,P.y,220,'#ffd36b'); }
    announce(m.g+' '+m.num+' · '+m.n+' '+m.g, m.good); excite=1; },700);
  // beat 3 — the seal
  setTimeout(()=>{ SFX.seraph(); flash(0.3,'#fff2c0'); if(P) burst(P.x,P.y,24,m.c); },1150);
}
function tickMajors(dt){
  if(!P) return; const A=arcState();
  // THE TOWER — candles fall, then the blow lands
  for(let i=A.candles.length-1;i>=0;i--){ const c=A.candles[i]; c.t-=dt;
    if(c.t<=0){ burst(c.x,c.y,8,'#ff9a3c'); if(Math.random()<0.5) ring(c.x,c.y,40,'#ff5a2c'); A.candles.splice(i,1); } }
  if(A.towerT>0){ A.towerT-=dt; if(A.towerT<=0){
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(!inView(e.x,e.y,40)) continue;
      arcHit(e,i,e.boss?e.maxhp*0.2:e.maxhp*0.6+300,'#ff8a5a',true); }
    A.st.tower++; ARC_SFX.crash(); shake=Math.min(30,shake+24); flash(0.7,'#ff3b2f'); setTimeout(()=>flash(0.4,'#ffd36b'),110); hitstop=Math.max(hitstop||0,0.06);
    ring(P.x,P.y,420,'#ff3b2f'); ring(P.x,P.y,260,'#ffd36b'); } }
  // JUSTICE — read the hurt the House already applied, repay it
  if(A.lastHurt!==P._lastHurtGt){ const took=Math.max(0,A.hpSeen-P.hp); A.lastHurt=P._lastHurtGt;
    if(arcActive('justice')){ const pay=Math.max(60,took*5);
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(Math.hypot(e.x-P.x,e.y-P.y)<260) arcHit(e,i,pay,'#8fa2ff',true); }
      A.st.justice++; ring(P.x,P.y,260,'#4d6bff'); ring(P.x,P.y,180,'#c8d2ff'); ftext(P.x,P.y-36,'⚖ ×5 REPAID','#8fa2ff',true); ARC_SFX.gavel(); shake=Math.min(16,shake+6); } }
  A.hpSeen=P.hp;
  // THE STAR — every orb you touch arcs lightning
  if(arcActive('star')){ A.starCd-=dt;
    for(const o of orbs){ if(o._st) continue; const d=Math.hypot(o.x-P.x,o.y-P.y);
      if(d<P.radius+26){ o._st=1; if(A.starCd<=0){ A.starCd=0.1; arcChain(o.x,o.y); } } } }
  for(let i=A.bolts.length-1;i>=0;i--){ A.bolts[i].t-=dt; if(A.bolts[i].t<=0) A.bolts.splice(i,1); }
  // THE SUN — high noon on every face in view
  if(arcActive('sun')){
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(!inView(e.x,e.y,20)) continue;
      const dmg=e.maxhp*(e.boss?0.015:0.07)*dt; e._sunA=(e._sunA||0)+dmg;
      const show=e._sunA>=Math.max(8,e.maxhp*0.05); if(show) e._sunA=0;
      if(Math.random()<dt*3) parts.push({x:e.x+rnd(-e.r,e.r),y:e.y+rnd(-e.r,e.r*0.5),vx:rnd(-10,10),vy:-rnd(40,90),life:rnd(.25,.5),col:Math.random()<0.5?'#ffe14d':'#ff8a1f',r:rnd(1.4,2.6)});
      arcHit(e,i,dmg,'#ffe14d',show?true:null); } }
  // THE CHARIOT — three wheels of fire
  if(arcActive('chariot')){ A.wheelA+=dt*4.2;
    for(let k=0;k<3;k++){ const a=A.wheelA+k*2.094, wx=P.x+Math.cos(a)*72, wy=P.y+Math.sin(a)*72;
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; const rr=e.r+15;
        if((e.x-wx)*(e.x-wx)+(e.y-wy)*(e.y-wy)<rr*rr && (e._chT||0)<=gt){ e._chT=gt+0.35;
          const kd=Math.hypot(e.x-P.x,e.y-P.y)||1; if(!e.unkillable){ e.kx+=(e.x-P.x)/kd*180; e.ky+=(e.y-P.y)/kd*180; }
          A.st.wheel++; spark(wx,wy,e.x,e.y,'#ffb36b'); ARC_SFX.wheel(); arcHit(e,i,P.damage*2.5,'#ffb36b',true); } } } }
  // THE MOON — beams on the thickest crowd
  if(arcActive('moon')){ A.moonT-=dt;
    if(A.moonT<=0){ A.moonT=2.5; const tg=arcCrowd(); if(tg){ A.beams.push({x:tg.x,y:tg.y,t:0.45,max:0.45,hit:false,fade:0.35}); ARC_SFX.beamWarn(); } } }
  for(let i=A.beams.length-1;i>=0;i--){ const b=A.beams[i];
    if(!b.hit){ b.t-=dt; if(b.t<=0){ b.hit=true; A.st.beam++; const dmg=P.damage*8;
      for(let j=enemies.length-1;j>=0;j--){ const e=enemies[j]; if(Math.hypot(e.x-b.x,e.y-b.y)<100+e.r*0.5) arcHit(e,j,dmg,'#d8ccff',true); }
      ring(b.x,b.y,100,'#a98cff'); ring(b.x,b.y,60,'#fff2c0'); burst(b.x,b.y,18,'#d8ccff'); ARC_SFX.beamHit(); shake=Math.min(14,shake+5); } }
    else { b.fade-=dt; if(b.fade<=0) A.beams.splice(i,1); } }
  // JUDGEMENT — the souls answer the trumpet
  if(A.judgeT>0){ A.judgeT-=dt;
    for(const o of orbs){ const dx=P.x-o.x, dy=P.y-o.y, d=Math.hypot(dx,dy)||1; const sp=Math.min(d,900*dt); o.x+=dx/d*sp; o.y+=dy/d*sp; } }
  if(arcActive('judgement')){ for(const o of orbs){ if(!o._jx){ o._jx=1; o.xp*=2; } } }
  // THE LOVERS — the twin shade fires beside you
  if(arcActive('lovers')){ A.twinA+=dt*1.6; A.twinT-=dt;
    if(A.twinT<=0){ A.twinT=0.3; const tx=P.x+Math.cos(A.twinA)*58, ty=P.y+Math.sin(A.twinA)*58;
      let t=null, td=520*520; for(const e of enemies){ const d2=(e.x-tx)*(e.x-tx)+(e.y-ty)*(e.y-ty); if(d2<td){ td=d2; t=e; } }
      if(t){ const a=Math.atan2(t.y-ty,t.x-tx), sp=(P.projSpeed||420)*0.9;
        bullets.push({x:tx,y:ty,px:tx,py:ty,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:4.5,dmg:P.damage*0.8,life:1.3,seek:true,kind:'seeker',spin:0});
        A.st.twin++; ARC_SFX.twin(); } } }
}
function arcChain(x,y){
  const used=new Set(); let fx=x, fy=y, hits=0, rng=220; const dmg=P.damage*3;
  while(hits<5){ let best=-1, bd=rng*rng;
    for(let k=0;k<enemies.length;k++){ const e=enemies[k]; if(used.has(e)) continue; const d2=(e.x-fx)*(e.x-fx)+(e.y-fy)*(e.y-fy); if(d2<bd){ bd=d2; best=k; } }
    if(best<0) break; const e=enemies[best]; used.add(e);
    ARC.bolts.push({x1:fx,y1:fy,x2:e.x,y2:e.y,t:0.22,seed:Math.random()*99});
    fx=e.x; fy=e.y; arcHit(e,best,dmg,'#9af0ff',true); hits++; rng=180; }
  if(hits){ ARC.st.zap++; ARC_SFX.zap(); burst(x,y,6,'#5ee6ff'); }
}
function arcCrowd(){
  const vis=[]; for(const e of enemies){ if(inView(e.x,e.y,-20)) vis.push(e); if(vis.length>=60) break; }
  if(!vis.length) return null; let best=vis[0], bn=-1;
  for(const a of vis){ let n=0; for(const b of vis){ if((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)<10000) n++; } if(n>bn){ bn=n; best=a; } }
  return best;
}
function drawMajorCard(c){
  const m=arcById(c.maj); if(!m) return;
  const bob=Math.sin(gt*2.2+c.ph)*4, fl=c.t<5 ? (Math.floor(gt*8)%2?0.35:1) : 1;
  const fs=Math.sin(gt*1.8+c.ph), flip=fs*fs*fs;
  ctx.save(); ctx.translate(c.x,c.y);
  ctx.globalAlpha=0.35*fl; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,24,14*Math.max(0.3,Math.abs(flip)),4.4,0,0,6.28); ctx.fill();
  // the shaft of light that marks a Major
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=fl*(0.55+Math.sin(gt*3)*0.15);
  const bg=ctx.createLinearGradient(0,-190,0,20); bg.addColorStop(0,'rgba(255,211,107,0)'); bg.addColorStop(0.7,'rgba(255,211,107,0.22)'); bg.addColorStop(1,'rgba(201,139,255,0.35)');
  ctx.fillStyle=bg; ctx.fillRect(-20,-190,40,210);
  const g=ctx.createRadialGradient(0,bob,0,0,bob,58); g.addColorStop(0,'rgba(255,211,107,0.5)'); g.addColorStop(0.5,'rgba(201,139,255,0.28)'); g.addColorStop(1,'rgba(201,139,255,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,bob,58,0,6.28); ctx.fill(); ctx.restore();
  ctx.translate(0,bob); ctx.globalAlpha=fl;
  ctx.rotate(Math.sin(gt*1.4+c.ph)*0.08);
  ctx.scale(Math.max(0.16,Math.abs(flip)),1);
  const back=flip<0;
  ctx.fillStyle=back?'#2a1250':'#170a26'; ctx.fillRect(-14,-20,28,40);
  ctx.strokeStyle='#ffd36b'; ctx.lineWidth=2.2; ctx.strokeRect(-14,-20,28,40);
  ctx.strokeStyle='#c98bff'; ctx.lineWidth=1; ctx.strokeRect(-10.5,-16.5,21,33);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if(back){ ctx.fillStyle='#ffd36b'; ctx.font='700 16px serif'; ctx.fillText('✦',0,1); }
  else { ctx.fillStyle=m.c; ctx.font='700 17px serif'; ctx.fillText(m.g,0,0); ctx.fillStyle='#ffd36b'; ctx.font='700 6px serif'; ctx.fillText(m.num,0,-12); }
  ctx.restore(); ctx.globalAlpha=1;
  // the name reads once you are close enough to choose
  const d=Math.hypot(P.x-c.x,P.y-c.y);
  if(d<260){ ctx.save(); ctx.globalAlpha=Math.min(1,(260-d)/80)*fl; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='700 11px serif'; ctx.lineWidth=3; ctx.strokeStyle='rgba(8,3,10,0.85)';
    const lab=m.num+' · '+m.n; ctx.strokeText(lab,c.x,c.y-38+bob); ctx.fillStyle='#ffd36b'; ctx.fillText(lab,c.x,c.y-38+bob); ctx.restore(); }
  if(Math.random()<0.2) parts.push({x:c.x+rnd(-16,16),y:c.y+bob+rnd(-20,20),vx:0,vy:-rnd(18,40),life:0.6,col:Math.random()<0.5?'#ffd36b':'#c98bff',r:1.6});
}
function drawMajorsFX(){
  if(!P || ARC.p!==P) return; const A=ARC;
  // falling candles (THE TOWER)
  for(const c of A.candles){ const k=1-Math.max(0,c.t)/c.dur, y=c.y-(1-k)*260;
    ctx.save(); ctx.translate(c.x,y); ctx.rotate(k*2.4);
    ctx.fillStyle='#e6d9c2'; ctx.fillRect(-3,-11,6,18);
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#ffb347'; ctx.beginPath(); ctx.ellipse(0,-15,3,6,0,0,6.28); ctx.fill();
    ctx.restore(); }
  if(A.towerT>0){ ctx.save(); ctx.globalAlpha=Math.min(0.4,(0.55-A.towerT)*0.8); ctx.fillStyle='#ff3b2f'; ctx.globalCompositeOperation='lighter';
    ctx.fillRect(P.x-VW/2,P.y-VH/2,VW,VH); ctx.restore(); }
  // high noon wash
  if(arcActive('sun')){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.07+Math.sin(gt*2)*0.02; ctx.fillStyle='#ffc850';
    ctx.fillRect(P.x-VW/2,P.y-VH/2,VW,VH); ctx.restore(); }
  // stars where the orbs were
  if(arcActive('star')){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#bff4ff'; let n=0;
    for(const o of orbs){ if(!inView(o.x,o.y,10)) continue; if(++n>160) break; const s=4+Math.sin(gt*8+o.x)*1.5;
      ctx.beginPath(); ctx.moveTo(o.x,o.y-s*1.8); ctx.lineTo(o.x+s*0.45,o.y); ctx.lineTo(o.x,o.y+s*1.8); ctx.lineTo(o.x-s*0.45,o.y); ctx.closePath();
      ctx.moveTo(o.x-s*1.8,o.y); ctx.lineTo(o.x,o.y+s*0.45); ctx.lineTo(o.x+s*1.8,o.y); ctx.lineTo(o.x,o.y-s*0.45); ctx.closePath(); }
    ctx.fill(); ctx.restore(); }
  if(A.bolts.length){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.lineJoin='round';
    for(const b of A.bolts){ const a=b.t/0.22; ctx.globalAlpha=a;
      ctx.beginPath(); ctx.moveTo(b.x1,b.y1); const dx=b.x2-b.x1, dy=b.y2-b.y1, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
      for(let s=1;s<6;s++){ const f=s/6, j=Math.sin(b.seed+s*2.7+gt*40)*12; ctx.lineTo(b.x1+dx*f+nx*j, b.y1+dy*f+ny*j); }
      ctx.lineTo(b.x2,b.y2);
      ctx.strokeStyle='#5ee6ff'; ctx.lineWidth=5; ctx.stroke(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.6; ctx.stroke(); }
    ctx.restore(); }
  // moonbeams
  for(const b of A.beams){ ctx.save(); ctx.globalCompositeOperation='lighter';
    if(!b.hit){ const k=1-b.t/b.max; ctx.globalAlpha=0.25+k*0.35; ctx.strokeStyle='#a98cff'; ctx.lineWidth=2; ctx.setLineDash([8,6]);
      ctx.beginPath(); ctx.arc(b.x,b.y,100*(1.25-k*0.25),0,6.28); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=0.15+k*0.25; ctx.fillStyle='#d8ccff'; ctx.fillRect(b.x-6-k*10,b.y-VH,12+k*20,VH); }
    else { const k=Math.max(0,b.fade/0.35); ctx.globalAlpha=k*0.8;
      const g=ctx.createLinearGradient(b.x-50,0,b.x+50,0); g.addColorStop(0,'rgba(216,204,255,0)'); g.addColorStop(0.5,'rgba(255,255,255,0.95)'); g.addColorStop(1,'rgba(216,204,255,0)');
      ctx.fillStyle=g; ctx.fillRect(b.x-50,b.y-VH,100,VH+10);
      ctx.fillStyle='rgba(169,140,255,0.5)'; ctx.beginPath(); ctx.ellipse(b.x,b.y,100,46,0,0,6.28); ctx.fill(); }
    ctx.restore(); }
  // the chariot's wheels
  if(arcActive('chariot')){ for(let k=0;k<3;k++){ const a=A.wheelA+k*2.094, wx=P.x+Math.cos(a)*72, wy=P.y+Math.sin(a)*72;
    ctx.save(); ctx.translate(wx,wy); ctx.rotate(A.wheelA*3);
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,138,31,0.35)'; ctx.beginPath(); ctx.arc(0,0,20,0,6.28); ctx.fill();
    ctx.globalCompositeOperation='source-over'; ctx.strokeStyle='#ff8a1f'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,12,0,6.28); ctx.stroke();
    ctx.strokeStyle='#ffd36b'; ctx.lineWidth=1.6; ctx.beginPath();
    for(let s=0;s<6;s++){ const sa=s*1.047; ctx.moveTo(0,0); ctx.lineTo(Math.cos(sa)*15,Math.sin(sa)*15); } ctx.stroke();
    ctx.restore(); } }
  // the twin shade
  if(arcActive('lovers')){ const tx=P.x+Math.cos(A.twinA)*58, ty=P.y+Math.sin(A.twinA)*58+Math.sin(gt*4)*3;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5;
    const g=ctx.createRadialGradient(tx,ty,0,tx,ty,26); g.addColorStop(0,'rgba(255,95,208,0.6)'); g.addColorStop(1,'rgba(255,95,208,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(tx,ty,26,0,6.28); ctx.fill();
    ctx.globalAlpha=0.8; ctx.fillStyle='#ffb3ea'; ctx.translate(tx,ty); ctx.scale(1.45,1.45); // a coat, a hat brim, a heart — Vesper's shade
    ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(9,13); ctx.lineTo(-9,13); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0,-12,4.5,0,6.28); ctx.fill(); ctx.fillRect(-8,-17,16,2.2);
    ctx.fillStyle='#ff5fd0'; ctx.font='700 9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('♥',0,3);
    ctx.restore(); }
  // the scales hang around you (JUSTICE)
  if(arcActive('justice')){ ctx.save(); ctx.globalAlpha=0.22+Math.sin(gt*3)*0.08; ctx.strokeStyle='#4d6bff'; ctx.lineWidth=1.5; ctx.setLineDash([3,9]);
    ctx.beginPath(); ctx.arc(P.x,P.y,260,gt*0.3,gt*0.3+6.283); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  // DEATH's promise rides above your head until it is spent
  if(A.deathSkip){ ctx.save(); ctx.globalAlpha=0.65+Math.sin(gt*3)*0.25; ctx.fillStyle='#d24dff'; ctx.font='700 12px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('☠',P.x,P.y-34+Math.sin(gt*2)*2); ctx.restore(); }
}
