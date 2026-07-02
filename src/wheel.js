"use strict";
/* ═══ RESTORED ENGINE BLOCK — rage v2, Wheel of Souls, The Ascent, map offerings ═══ */
let wheelTok=null, wheelTokT=40;
let wheel={rot:0, vel:0, spinning:false, mult:1, lastSeg:-1, done:false};
const WSEGS=[
 {n:'60 COINS', c:'#c8860a', tier:1, f:(m)=>{ const g2=60*m; P.coins+=g2; LT.coins+=g2; coinRain(14*m); SFX.cashout(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'CURSE', c:'#640a16', tier:0, f:()=>{ const dl=applyDebuff(DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0]); SFX.bust(); flash(0.45,'#8b1620'); announce('☠ '+dl+' ☠',false); }},
 {n:'HEAL 33%', c:'#0e8a4a', tier:1, f:(m)=>{ const hl=Math.round(P.maxHp*0.33*m); P.hp=Math.min(P.maxHp,P.hp+hl); flash(0.4,'#8bff9a'); SFX.dingBells(); announce('✚ +'+hl+' BLOOD ✚',true); }},
 {n:'DOUBLE', c:'#7a3cff', tier:2, f:null},
 {n:'90 COINS', c:'#e8a112', tier:2, f:(m)=>{ const g2=90*m; P.coins+=g2; LT.coins+=g2; coinRain(24); SFX.cashout(); SFX.dingBells(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'GILT +35', c:'#96700e', tier:2, f:(m)=>{ const g3=35*m; gilt+=g3; saveGilt(); SFX.chipStack(); SFX.casinoDing(); announce('◈ +'+g3+' GILT BANKED ◈',true); }},
 {n:'⚔ ARSENAL', c:'#c22ca0', tier:3, f:()=>{ slotForceWeapon=true; pending.push({}); SFX.levelUp(); announce('⚔ THE ARSENAL WHEEL AWAITS ⚔',true); }},
 {n:'+1 LEVEL', c:'#e0203a', tier:3, f:(m)=>{ for(let i=0;i<m;i++) pending.push({}); SFX.levelUp(); announce('⚜ +'+m+' LEVEL'+(m>1?'S':'')+' ⚜',true); }},
 {n:'FEVER', c:'#f2701a', tier:2, f:()=>{ if(!feverOn){ fever=1; startFever(); } else { feverT=Math.min(12+(P.feverDur||0),feverT+5); announce('⚡ FEVER +5s ⚡',true); SFX.dingBells(); } }},
 {n:'DOUBLE', c:'#7a3cff', tier:2, f:null},
 {n:'✦ SKILL', c:'#3c58e8', tier:3, f:(m)=>{ rollAscentPrize(m*1.6); }},
 {n:'▲ ASCENT', c:'#0ac878', tier:3, f:()=>{ wheel.toAscent=true; announce('▲ THE WHEEL OPENS THE ASCENT ▲',true); SFX.riser(); }}
];
function buildWheelDom(){
  const w=$('soulWheel'); if(w._built) return; w._built=true;
  const n=WSEGS.length, segA=360/n;
  let cg='conic-gradient(from -'+(segA/2)+'deg';
  WSEGS.forEach((sg,i)=>{ cg+=', '+sg.c+' '+(i*segA)+'deg '+((i+1)*segA)+'deg'; });
  w.style.background=cg+')';
  const sh=document.createElement('div'); sh.className='wshade'; w.appendChild(sh);
  WSEGS.forEach((sg,i)=>{
    const k=document.createElement('div'); k.className='wspk';
    k.style.transform='rotate('+(i*segA-segA/2)+'deg)'; w.appendChild(k);
    const p=document.createElement('div'); p.className='wpin';
    p.style.transform='rotate('+(i*segA-segA/2)+'deg) translateY(-176px)'; w.appendChild(p);
    const d=document.createElement('div'); d.className='wseg wt'+sg.tier; d.textContent=sg.n;
    d.style.transform='rotate('+(i*segA-90)+'deg) translate(68px,-7px)';
    w.appendChild(d); });
  const box=w.parentNode;
  const rim=document.createElement('div'); rim.className='wheelRim'; box.insertBefore(rim,w);
  const sp=document.createElement('div'); sp.className='wheelSpot'; box.insertBefore(sp,rim);
  const wd=document.createElement('div'); wd.id='wheelWedge'; box.appendChild(wd);
  const bm=document.createElement('div'); bm.className='wheelBeam'; box.appendChild(bm);
  const bl=document.createElement('div'); bl.id='wheelBulbs';
  for(let i=0;i<36;i++){ const b=document.createElement('span'); b.className='wb';
    b.style.setProperty('--i',i);
    b.style.transform='rotate('+(i*10)+'deg) translateY(-211px)'; bl.appendChild(b); }
  box.appendChild(bl);
  const hub=box.querySelector('.wheelHub'); if(hub) hub.textContent='♠';
  const mq=document.createElement('div'); mq.className='wheelMarq'; mq.textContent='THE HOUSE SPINS FOR YOUR SOUL';
  box.parentNode.insertBefore(mq, box.parentNode.firstChild);
  const felt=document.createElement('div'); felt.className='wheelFelt';
  $('wheelLayer').insertBefore(felt, $('wheelLayer').firstChild);
}
function openWheel(){
  buildWheelDom(); state='wheel';
  wheel={rot:Math.random()*360, vel:0, phase:'idle', mult:1, lastSeg:-1, done:false, windT:0, setT:0, toAscent:false,
    golden:Math.random()<0.05, windK:0, slowTicks:0, hbT:0};
  $('wheelMult').classList.add('hidden');
  const wd=$('wheelWedge'); if(wd) wd.className='';
  const bl=$('wheelBulbs'); if(bl){ bl.classList.remove('chase','all'); }
  const bm=document.querySelector('.wheelBeam'); if(bm) bm.classList.remove('on');
  { const ww=$('wheelWin'); if(ww) ww.classList.remove('go'); }
  $('soulWheel').style.boxShadow='';
  stopDrumroll();
  $('wheelLayer').classList.toggle('golden', wheel.golden);
  const mq=document.querySelector('.wheelMarq'); if(mq) mq.textContent=wheel.golden?'✦ GOLDEN SPIN — ALL PRIZES DOUBLED ✦':'THE HOUSE SPINS FOR YOUR SOUL';
  $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
  $('wheelMsg').innerHTML='<span class="keyhint">SPACE</span> — spin the wheel';
  $('wheelLayer').classList.remove('hidden');
  SFX.vaultOpen(); startDrone();
  if(wheel.golden) setTimeout(()=>{ if(state==='wheel'){ SFX.achieve(); SFX.tingle(); flash(0.4,'#ffd36b');
    $('wheelMsg').innerHTML='✦ ALL PRIZES DOUBLED ✦ · <span class="keyhint">SPACE</span> — spin'; } },350);
}
function launchWheel(){
  if(wheel.phase!=='idle'||wheel.done) return;
  wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.rot; wheel.windK=0;
  $('wheelMsg').textContent='FATE TURNS…';
  tone(140,0.24,'sawtooth',0.12,70); SFX.leverWind();
}
function tickWheel(dt){
  const segA=360/WSEGS.length;
  if(wheel.phase==='wind'){
    wheel.windT+=dt; const f=Math.min(1,wheel.windT/0.22);
    wheel.rot=wheel.windFrom - 26*Math.sin(f*Math.PI*0.5);
    $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
    if(Math.floor(f*4)>wheel.windK){ wheel.windK=Math.floor(f*4); tone(240+wheel.windK*70,0.03,'square',0.12); noise(0.02,0.06,3000); }
    if(f>=1){ wheel.phase='spin'; wheel.vel=820+Math.random()*320; wheel.slowTicks=0; wheel.hbT=0;
      SFX.riser(); noise(0.3,0.22,2600); tone(150,0.5,'sawtooth',0.1,900);
      setTimeout(()=>SFX.chipStack(),60); setTimeout(()=>SFX.coinPling(),130); setTimeout(()=>SFX.chipStack(),210); setTimeout(()=>SFX.tingle(),220);
      const bl=$('wheelBulbs'); if(bl) bl.classList.add('chase');
      if(wheel.golden) startDrumroll();
    }
    return;
  }
  if(wheel.phase==='spin'){
    wheel.rot=(wheel.rot+wheel.vel*dt)%360;
    wheel.vel*=Math.pow(0.42,dt); wheel.vel-=26*dt;
    $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
    const seg=Math.floor((((-wheel.rot%360)+360+segA/2)%360)/segA)%WSEGS.length;
    if(seg!==wheel.lastSeg){ wheel.lastSeg=seg;
      $('soulWheel').style.boxShadow='0 0 0 3px #3a0a10,0 0 56px '+WSEGS[seg].c+',inset 0 0 40px rgba(0,0,0,.8)';
      const heat=1-Math.min(1,wheel.vel/900), tf=950+heat*1450;
      tone(tf,0.045,'square',0.08+heat*0.07); tone(tf*2,0.03,'sine',0.04+heat*0.03);
      if(wheel.vel<420) tone(2400+heat*800,0.05,'sine',0.05);
      const p9=document.querySelector('.wheelPtr');
      if(wheel.vel<170){ wheel.slowTicks++; SFX.dingHit(Math.min(5,wheel.slowTicks));
        if(p9){ p9.style.transform=''; p9.classList.remove('kick'); void p9.offsetWidth; p9.classList.add('kick'); } }
      else if(p9){ p9.style.transform='translateX(-50%) rotate(-16deg)'; setTimeout(()=>{ p9.style.transform='translateX(-50%)'; },50); }
    }
    if(wheel.vel<95){ wheel.hbT-=dt; if(wheel.hbT<=0){ wheel.hbT=0.16+0.3*(wheel.vel/95); tone(50,0.16,'sine',0.3,38); setTimeout(()=>tone(62,0.1,'sine',0.2,44),120); } }
    if(wheel.vel<=16){
      wheel.phase='settle'; wheel.setT=0;
      tone(170,0.2,'sine',0.2,330); setTimeout(()=>tone(330,0.15,'sine',0.12,180),100);
      const cur=((wheel.rot%360)+360)%360;
      const seg2=Math.floor((((-cur)+360+segA/2)%360)/segA)%WSEGS.length;
      wheel.landSeg=seg2;
      let tgt=(-seg2*segA); while(tgt>cur) tgt-=360; while(cur-tgt>360) tgt+=360;
      wheel.setFrom=cur; wheel.setTo=tgt;
    }
    return;
  }
  if(wheel.phase==='settle'){
    wheel.setT+=dt; const f=Math.min(1,wheel.setT/0.55);
    const ease=1-Math.pow(1-f,3);
    const over=Math.sin(f*Math.PI)* -7*(1-f);
    wheel.rot=wheel.setFrom+(wheel.setTo-wheel.setFrom)*ease+over;
    $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
    if(f>=0.5 && f-dt/0.55<0.5) tone(120,0.14,'sine',0.14,70);
    if(f>=1){ wheel.phase='done'; landWheel(wheel.landSeg); }
  }
}
function domConfetti(n,lid){
  const L=$(lid||'wheelLayer');
  for(let i=0;i<n;i++){ const p=document.createElement('span'); p.className='wcf';
    p.style.left=(35+Math.random()*30)+'%'; p.style.background=['#ffd36b','#c98bff','#8bff9a','#fff2c0'][i%4];
    p.style.animationDelay=(Math.random()*0.15)+'s'; p.style.setProperty('--dx',(Math.random()*160-80)+'px');
    L.appendChild(p); setTimeout(()=>p.remove(),1300); }
}
function landChime(t){
  if(t<=0){ tone(92,0.35,'sine',0.3,44); noise(0.14,0.14,480); return; }
  SFX.reelLock();
  if(t===1){ setTimeout(()=>SFX.casinoDing(),110); setTimeout(()=>SFX.coinPling(),230); }
  else if(t===2){ setTimeout(()=>SFX.tingle(),90); setTimeout(()=>SFX.chipStack(),220); setTimeout(()=>SFX.casinoDing(),330); }
  else { setTimeout(()=>SFX.dingBells(),60); setTimeout(()=>SFX.seraph(),320); }
}
function landWheel(seg){
  const sg=WSEGS[seg], segA=360/WSEGS.length;
  stopDrumroll();
  const gm=wheel.golden?2:1;
  shake=Math.min(18,shake+8+sg.tier*3); landChime(sg.tier);
  const wd=$('wheelWedge');
  if(wd){ wd.style.background='conic-gradient(from '+(-segA/2)+'deg, transparent 0deg '+(seg*segA)+'deg, rgba(255,240,190,.85) '+(seg*segA)+'deg '+((seg+1)*segA)+'deg, transparent '+((seg+1)*segA)+'deg)';
    wd.style.transform='rotate('+wheel.rot+'deg)'; wd.className='flash'; }
  const sw9=$('soulWheel'); if(sw9){ sw9.style.boxShadow='0 0 0 2px #3a0a10,0 0 90px rgba(255,220,130,.95),inset 0 0 34px rgba(0,0,0,.75)'; setTimeout(()=>{ sw9.style.boxShadow=''; },800); }
  const p9=document.querySelector('.wheelPtr'); if(p9){ p9.style.transform=''; p9.classList.remove('slam'); void p9.offsetWidth; p9.classList.add('slam'); setTimeout(()=>p9.classList.remove('slam'),600); }
  const bm=document.querySelector('.wheelBeam'); if(bm){ bm.classList.remove('on'); void bm.offsetWidth; bm.classList.add('on'); }
  const bl=$('wheelBulbs'); if(bl){ bl.classList.remove('chase'); bl.classList.add('all'); setTimeout(()=>bl.classList.remove('all'),1300); }
  if(sg.n==='DOUBLE'){
    if(wheel.mult>=4){ const g4=60*wheel.mult*gm; P.coins+=g4; LT.coins+=g4; coinRain(26); SFX.cashout(); SFX.dingBells(); SFX.dingHit(6); domConfetti(20); announce('◈ MAX FORTUNE +'+g4+' COINS ◈',true); }
    if(wheel.mult<4){
      const inst=15*wheel.mult*gm; P.coins+=inst; LT.coins+=inst;
      wheel.mult*=2;
      const wm=$('wheelMult'); wm.textContent='×'+(wheel.mult*gm)+' !'; wm.classList.remove('hidden','slam'); void wm.offsetWidth; wm.classList.add('slam');
      const esc=wheel.mult/2;
      [523,659,784,1046].concat(esc>1?[1318]:[]).forEach((f9,i9)=>setTimeout(()=>{ tone(f9*esc,0.18,'square',0.13); tone(f9*esc*2,0.12,'sine',0.06); },i9*62));
      setTimeout(()=>SFX.achieve(),350);
      SFX.dingBells(); flash(0.5,'#c98bff'); domConfetti(12); coinRain(8);
      $('wheelMsg').textContent='+'+inst+' COINS · ALL PRIZES ×'+(wheel.mult*gm)+' — AGAIN!';
      startDrumroll();
      setTimeout(()=>{ if(state==='wheel'){ wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.rot; wheel.windK=0; if(wd) wd.className=''; if(bl) bl.classList.remove('all'); } },800);
      return;
    }
  }
  wheel.done=true;
  const big=sg.tier>=3||(wheel.mult*gm>=2&&sg.f);
  if(big){ bigWin(sg.n,3); domConfetti(18+sg.tier*6); }
  { let ww=$('wheelWin'); if(!ww){ ww=document.createElement('div'); ww.id='wheelWin'; $('wheelLayer').appendChild(ww); }
    ww.innerHTML='<div class="awT" style="color:'+(sg.tier===0?'#ff7b7b':sg.c)+';filter:brightness(1.6) saturate(1.3)">'+sg.n+((wheel.mult*gm)>1&&sg.f?' ×'+(wheel.mult*gm):'')+'</div>';
    ww.classList.remove('go'); void ww.offsetWidth; ww.classList.add('go'); }
  if(sg.f) sg.f(wheel.mult*gm);
  if(wheel.golden&&sg.tier>=1) setTimeout(()=>SFX.record(),150);
  LT.wheel=(LT.wheel||0)+1; bump('wheel',LT.wheel);
  $('wheelMsg').textContent=sg.n+((wheel.mult*gm)>1&&sg.f?'  ×'+(wheel.mult*gm):'');
  setTimeout(()=>{ $('wheelLayer').classList.add('hidden'); stopDrone();
    if(state==='wheel'){ state='playing'; if(wheel.toAscent) setTimeout(()=>{ if(state==='playing') openCrash(); },300);
      else if(pending.length) setTimeout(()=>{ if(state==='playing' && pending.length) openNextSlot(); },450); } }, 1600);
}
function tickWheelTok(dt){
  if(!wheelTok){ wheelTokT-=dt;
    if(wheelTokT<=0){ wheelTokT=(44+Math.random()*26)*(1-(P.wheelHaste||0));
      const a=Math.random()*6.283, d=280+Math.random()*320;
      wheelTok={x:clamp(P.x+Math.cos(a)*d,60,CFG.arena-60), y:clamp(P.y+Math.sin(a)*d,60,CFG.arena-60), t:20, ph:Math.random()*6.28};
      announce('☸ THE WHEEL OF SOULS MANIFESTS ☸', true); SFX.dingBells(); }
  } else {
    wheelTok.t-=dt; wheelTok._p=(wheelTok._p||0)-dt; if(wheelTok._p<=0){ wheelTok._p=6; tone(1046,0.09,'sine',0.05); ring(wheelTok.x,wheelTok.y,52,'#c98bff'); }
    if(wheelTok.t<=0){ wheelTok=null; return; }
    if(Math.hypot(P.x-wheelTok.x,P.y-wheelTok.y)<P.radius+16){ wheelTok=null; openWheel(); }
  }
}
function drawWheelTok(){
  if(!wheelTok) return; const w=wheelTok, fl=w.t<4?(Math.floor(gt*8)%2?0.4:1):1;
  ctx.save(); ctx.translate(w.x,w.y+Math.sin(gt*2.6+w.ph)*3); ctx.globalAlpha=fl;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g2=ctx.createRadialGradient(0,0,0,0,0,36); g2.addColorStop(0,'rgba(201,139,255,0.4)'); g2.addColorStop(1,'rgba(201,139,255,0)');
  ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(0,0,36,0,6.28); ctx.fill(); ctx.restore();
  ctx.rotate(gt*2);
  for(let i=0;i<8;i++){ ctx.fillStyle=i%2?'#8a1520':'#14090c'; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,13,i*0.785,(i+1)*0.785); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='#ffd36b'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,13,0,6.28); ctx.stroke();
  ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.arc(0,0,3.4,0,6.28); ctx.fill();
  ctx.restore(); ctx.globalAlpha=1;
}
