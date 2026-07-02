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
  d = d || DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0];
  const revert=d.ap();
  { const dd=Math.max(2,Math.round(d.dur*Math.max(0.5,P.curseCut||1))); debuffs.push({label:d.label, t:dd, dur:dd, revert, dot:d.dot||0, poison:!!d.dot}); }
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
  SFX.dingBells(); SFX.cashout(); SFX.seraph(); coinRain(20); excite=1; flash(0.45,'#8bff9a');
  LT.fevers=(LT.fevers||0)+1; bump('fevers',LT.fevers);
}
function endFever(){
  feverOn=false; fever=0; feverT=0;
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
const TAROT_FATES=[
 {n:'THE SUN',t:2,c:'#fff2c0',fx:()=>{ P.hp=P.maxHp; P.damage*=1.5; debuffs.push({label:'☀ STRENGTH +50%',t:10,dur:10,revert:()=>{P.damage/=1.5;},dot:0,poison:false,good:true}); P.coins+=20; LT.coins+=20; coinRain(14); }},
 {n:'THE WORLD',t:2,c:'#fff2c0',fx:()=>{ pending.push({}); pending.push({}); P.hp=Math.min(P.maxHp,P.hp+P.maxHp*0.3); SFX.levelUp(); }},
 {n:'WHEEL OF FORTUNE',t:1,c:'#e8b64c',fx:()=>{ P.coins+=25; LT.coins+=25; coinRain(20); SFX.cashout(); }},
 {n:'THE STAR',t:1,c:'#9adcff',fx:()=>{ for(const o of orbs){ o.x=P.x+rnd(-30,30); o.y=P.y+rnd(-30,30); } for(const c2 of coins){ c2.x=P.x+rnd(-30,30); c2.y=P.y+rnd(-30,30); } ring(P.x,P.y,200,'#9adcff'); }},
 {n:'STRENGTH',t:1,c:'#ff9a5b',fx:()=>{ P.damage*=1.5; debuffs.push({label:'☀ STRENGTH +50%',t:12,dur:12,revert:()=>{P.damage/=1.5;},dot:0,poison:false,good:true}); }},
 {n:'TEMPERANCE',t:1,c:'#8bff9a',fx:()=>{ P.hp=Math.min(P.maxHp,P.hp+P.maxHp*0.35); }},
 {n:'THE EMPRESS',t:1,c:'#ffb0c8',fx:()=>{ P.coins+=15; LT.coins+=15; P.hp=Math.min(P.maxHp,P.hp+P.maxHp*0.15); coinRain(10); }},
 {n:'THE CHARIOT',t:1,c:'#9adcff',fx:()=>{ P.speed*=1.4; debuffs.push({label:'⚡ CHARIOT +40%',t:10,dur:10,revert:()=>{P.speed/=1.4;},dot:0,poison:false,good:true}); }},
 {n:'THE MAGICIAN',t:1,c:'#c9ff7a',fx:()=>{ fever=Math.min(1,fever+0.35); if(fever>=1&&!feverOn) startFever(); }},
 {n:'THE EMPEROR',t:1,c:'#ffd36b',fx:()=>{ gilt+=10; saveGilt(); SFX.chipStack(); }},
 {n:'JUSTICE',t:1,c:'#ff5566',fx:()=>{ for(let i2=enemies.length-1;i2>=0;i2--){ const e=enemies[i2]; if(!e.boss&&!e.elite&&Math.hypot(e.x-P.x,e.y-P.y)<320) killEnemy(e,i2); } shake=Math.min(20,shake+10); }},
 {n:'THE HIEROPHANT',t:1,c:'#eaf3ff',fx:()=>{ P.inv=Math.max(P.inv,4); ring(P.x,P.y,60,'#eaf3ff'); }},
 {n:'THE TOWER',t:-1,c:'#ff5560',fx:()=>{ hurtPlayer(Math.round(P.maxHp*0.15)); }},
 {n:'THE MOON',t:-1,c:'#a794c4',fx:()=>{ applyDebuff(DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0]); }},
 {n:'THE HANGED MAN',t:-1,c:'#7a8aa0',fx:()=>{ P.speed*=0.7; debuffs.push({label:'⛓ SLOWED −30%',t:8,dur:8,revert:()=>{P.speed/=0.7;},dot:0,poison:false}); }},
 {n:'DEATH',t:-1,c:'#c98bff',fx:()=>{ for(let i2=0;i2<4&&enemies.length<CFG.spawn.max;i2++){ const a2=Math.random()*6.283; spawnEnemy('swarm',clamp(P.x+Math.cos(a2)*140,20,CFG.arena-20),clamp(P.y+Math.sin(a2)*140,20,CFG.arena-20)); } }},
 {n:'THE DEVIL',t:-1,c:'#ff5560',fx:()=>{ const n5=coins.length; for(const c5 of coins) burst(c5.x,c5.y,1,'#5a4a3a'); coins.length=0; if(n5>0) ftext(P.x,P.y-24,'−'+n5+' COINS SWEPT','#ff6b6b',true); SFX.thud(); }},
 {n:'FIVE OF CUPS',t:-1,c:'#8a97b5',fx:()=>{ P.xp=Math.floor(P.xp*0.8); }},
 {n:'THE FOOL',t:-1,c:'#e8d9c0',fx:()=>{ const a2=Math.random()*6.283,d2=300+Math.random()*200; P.x=clamp(P.x+Math.cos(a2)*d2,40,CFG.arena-40); P.y=clamp(P.y+Math.sin(a2)*d2,40,CFG.arena-40); P.inv=Math.max(P.inv,1.2); flash(0.4,'#e8d9c0'); }},
 {n:'SEVEN OF SWORDS',t:-1,c:'#b0b8c8',fx:()=>{ P.damage*=0.8; debuffs.push({label:'🗡 −20% DMG',t:8,dur:8,revert:()=>{P.damage/=0.8;},dot:0,poison:false}); }},
 {n:'THE HERMIT',t:-1,c:'#6a7488',fx:()=>{ P.speed*=0.8; debuffs.push({label:'🏮 −20% SPD',t:6,dur:6,revert:()=>{P.speed/=0.8;},dot:0,poison:false}); }},
 {n:'WHEEL REVERSED',t:-1,c:'#a06a12',fx:()=>{ killStreak=0; streakT=0; fever=Math.max(0,fever-0.5); }},
 {n:'TOWER REVERSED',t:-2,c:'#e3b7ff',fx:()=>{ hurtPlayer(Math.round(P.maxHp*0.3)); applyDebuff(DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0]); }},
 {n:'DEATH REVERSED',t:-2,c:'#e3b7ff',fx:()=>{ if(enemies.length<CFG.spawn.max) spawnEnemy('elite',clamp(P.x+180,20,CFG.arena-20),clamp(P.y,20,CFG.arena-20)); for(let i2=0;i2<4&&enemies.length<CFG.spawn.max;i2++){ const a2=Math.random()*6.283; spawnEnemy('swarm',clamp(P.x+Math.cos(a2)*160,20,CFG.arena-20),clamp(P.y+Math.sin(a2)*160,20,CFG.arena-20)); } }}
];
const TR_ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV'];
function revealTarot(card){
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
  tarotT-=dt;
  if(tarotT<=0 && tarots.length<2){
    tarotT=14+Math.random()*10;
    const a=Math.random()*6.283, dd=260+Math.random()*300;
    tarots.push({x:clamp(P.x+Math.cos(a)*dd,40,CFG.arena-40), y:clamp(P.y+Math.sin(a)*dd,40,CFG.arena-40), ph:Math.random()*6.28, t:24});
    showStreak('☨ A TAROT CARD MANIFESTS ☨'); SFX.tingle();
  }
  for(let i=tarots.length-1;i>=0;i--){ const c=tarots[i]; c.t-=dt;
    if(c.t<=0){ tarots.splice(i,1); continue; }
    if(Math.hypot(P.x-c.x,P.y-c.y)<P.radius+16){
      tarots.splice(i,1);
      let f=TAROT_FATES[(Math.random()*TAROT_FATES.length)|0];
      if(f.t<0 && Math.random()<(P.tarotLuck||0)){ f=TAROT_FATES[(Math.random()*TAROT_FATES.length)|0]; announce('♠ MARKED CARDS — REDRAWN ♠',true); SFX.uiDing(); }
      revealTarot(f); f.fx(); ring(P.x,P.y,95,f.c);
      announce('☨ '+f.n+' ☨', f.t>0); flash(0.4,f.c); sparkBurst(f.t>0?24:12);
      if(f.t<0){ shake=Math.min(14,shake+6); }
      LT.tarot=(LT.tarot||0)+1; bump('tarot',LT.tarot);
    }
  }
}
function drawTarots(){
  for(const c of tarots){
    if(!inView(c.x,c.y,120)) continue;
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
        ctx.shadowColor='#c98bff'; ctx.shadowBlur=ai?0:16; ctx.fillStyle='#c98bff';
        ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-8,-11); ctx.lineTo(-3,0); ctx.lineTo(-8,11); ctx.closePath(); ctx.fill();
        if(!ai){ ctx.fillStyle='#fff'; ctx.globalAlpha*=0.8;
          ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-4,-6); ctx.lineTo(-1,0); ctx.lineTo(-4,6); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
      ctx.globalAlpha=1;
      if(Math.random()<0.08) parts.push({x:nr.x+rnd(-8,8),y:nr.y+rnd(-10,6),vx:0,vy:-rnd(16,34),life:0.5,col:'#c98bff',r:1.5});
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
