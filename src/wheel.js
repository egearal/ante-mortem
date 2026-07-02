"use strict";
/* ═══ RESTORED ENGINE BLOCK — rage v2, Wheel of Souls, The Ascent, map offerings ═══ */
let wheelTok=null, wheelTokT=40;
let wheel={rot:0, vel:0, spinning:false, mult:1, lastSeg:-1, done:false};
const WSEGS=[
 {n:'45 COINS', c:'#8a5a10', tier:1, f:(m)=>{ const g2=45*m; P.coins+=g2; LT.coins+=g2; coinRain(14*m); SFX.cashout(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'CURSE', c:'#3a0a10', tier:0, f:()=>{ const dl=applyDebuff(DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0]); SFX.bust(); flash(0.45,'#8b1620'); announce('☠ '+dl+' ☠',false); }},
 {n:'HEAL 33%', c:'#14432a', tier:1, f:(m)=>{ const hl=Math.round(P.maxHp*0.33*m); P.hp=Math.min(P.maxHp,P.hp+hl); flash(0.4,'#8bff9a'); SFX.dingBells(); announce('✚ +'+hl+' BLOOD ✚',true); }},
 {n:'DOUBLE', c:'#6a4ab5', tier:2, f:null},
 {n:'90 COINS', c:'#a8781c', tier:2, f:(m)=>{ const g2=90*m; P.coins+=g2; LT.coins+=g2; coinRain(24); SFX.cashout(); SFX.dingBells(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'GILT +15', c:'#4a3616', tier:2, f:(m)=>{ const g3=15*m; gilt+=g3; saveGilt(); SFX.chipStack(); SFX.casinoDing(); announce('◈ +'+g3+' GILT BANKED ◈',true); }},
 {n:'NOTHING', c:'#14090c', tier:0, f:()=>{ SFX.thud(); tone(300,0.4,'sawtooth',0.12,140); announce('… THE HOUSE KEEPS IT …',false); }},
 {n:'+1 LEVEL', c:'#8a1520', tier:3, f:(m)=>{ for(let i=0;i<m;i++) pending.push({}); SFX.levelUp(); announce('⚜ +'+m+' LEVEL'+(m>1?'S':'')+' ⚜',true); }},
 {n:'FEVER', c:'#a8781c', tier:2, f:()=>{ if(!feverOn){ fever=1; startFever(); } else { feverT=Math.min(12,feverT+5); announce('⚡ FEVER +5s ⚡',true); SFX.dingBells(); } }},
 {n:'DOUBLE', c:'#6a4ab5', tier:2, f:null},
 {n:'✦ SKILL', c:'#241f4a', tier:3, f:(m)=>{ rollAscentPrize(m*1.6); }},
 {n:'▲ ASCENT', c:'#123a22', tier:3, f:()=>{ wheel.toAscent=true; announce('▲ THE WHEEL OPENS THE ASCENT ▲',true); SFX.riser(); }}
];
function buildWheelDom(){
  const w=$('soulWheel'); if(w._built) return; w._built=true;
  const n=WSEGS.length, segA=360/n;
  let cg='conic-gradient(from -'+(segA/2)+'deg';
  WSEGS.forEach((sg,i)=>{ cg+=', '+sg.c+' '+(i*segA)+'deg '+((i+1)*segA)+'deg'; });
  w.style.background=cg+')';
  WSEGS.forEach((sg,i)=>{ const d=document.createElement('div'); d.className='wseg'; d.textContent=sg.n;
    d.style.transform='rotate('+(i*segA-90)+'deg) translate(58px,-6px)';
    w.appendChild(d); });
  const box=w.parentNode;
  const sp=document.createElement('div'); sp.className='wheelSpot'; box.insertBefore(sp,w);
  const wd=document.createElement('div'); wd.id='wheelWedge'; box.appendChild(wd);
  const bl=document.createElement('div'); bl.id='wheelBulbs';
  for(let i=0;i<18;i++){ const b=document.createElement('span'); b.className='wb';
    b.style.transform='rotate('+(i*20)+'deg) translateY(-176px)'; bl.appendChild(b); }
  box.appendChild(bl);
}
function openWheel(){
  buildWheelDom(); state='wheel';
  wheel={rot:Math.random()*360, vel:0, phase:'idle', mult:1, lastSeg:-1, done:false, windT:0, setT:0, toAscent:false};
  $('wheelMult').classList.add('hidden');
  const wd=$('wheelWedge'); if(wd) wd.className='';
  $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
  $('wheelMsg').innerHTML='<span class="keyhint">SPACE</span> — spin the wheel';
  $('wheelLayer').classList.remove('hidden');
  SFX.vaultOpen(); startDrone();
}
function launchWheel(){
  if(wheel.phase!=='idle'||wheel.done) return;
  wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.rot;
  $('wheelMsg').textContent='FATE TURNS…';
  tone(160,0.3,'sawtooth',0.14,90); SFX.diceRattle();
}
function tickWheel(dt){
  const segA=360/WSEGS.length;
  if(wheel.phase==='wind'){
    wheel.windT+=dt; const f=Math.min(1,wheel.windT/0.22);
    wheel.rot=wheel.windFrom - 26*Math.sin(f*Math.PI*0.5);
    $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
    if(f>=1){ wheel.phase='spin'; wheel.vel=820+Math.random()*320; SFX.riser(); sparkBurst(14); }
    return;
  }
  if(wheel.phase==='spin'){
    wheel.rot=(wheel.rot+wheel.vel*dt)%360;
    wheel.vel*=Math.pow(0.42,dt); wheel.vel-=26*dt;
    $('soulWheel').style.transform='rotate('+wheel.rot+'deg)';
    const seg=Math.floor((((-wheel.rot%360)+360+segA/2)%360)/segA)%WSEGS.length;
    if(seg!==wheel.lastSeg){ wheel.lastSeg=seg;
      SFX.wheelTick(Math.min(1,wheel.vel/700));
      tone(170+Math.min(1,wheel.vel/700)*90,0.05,'sine',0.08);
      const p9=document.querySelector('.wheelPtr'); if(p9){ p9.style.transform='translateX(-50%) rotate(-16deg)'; setTimeout(()=>{ p9.style.transform='translateX(-50%)'; },50); }
      const on9=seg; document.querySelectorAll('#wheelBulbs .wb').forEach((b,i)=>b.classList.toggle('on',(i+on9)%3===0));
    }
    if(wheel.vel<=16){
      wheel.phase='settle'; wheel.setT=0;
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
function landWheel(seg){
  const sg=WSEGS[seg], segA=360/WSEGS.length;
  shake=Math.min(18,shake+8+sg.tier*3); SFX.reelLock();
  const wd=$('wheelWedge');
  if(wd){ wd.style.background='conic-gradient(from '+(-segA/2)+'deg, transparent 0deg '+(seg*segA)+'deg, rgba(255,240,190,.85) '+(seg*segA)+'deg '+((seg+1)*segA)+'deg, transparent '+((seg+1)*segA)+'deg)';
    wd.style.transform='rotate('+wheel.rot+'deg)'; wd.className='flash'; }
  const sw9=$('soulWheel'); if(sw9){ sw9.style.boxShadow='0 0 0 2px #3a0a10,0 0 90px rgba(255,220,130,.95),inset 0 0 34px rgba(0,0,0,.75)'; setTimeout(()=>{ sw9.style.boxShadow=''; },800); }
  document.querySelectorAll('#wheelBulbs .wb').forEach(b=>b.classList.add('on'));
  if(sg.n==='DOUBLE'){
    if(wheel.mult>=4){ const g4=60*wheel.mult; P.coins+=g4; LT.coins+=g4; coinRain(26); SFX.cashout(); SFX.dingBells(); domConfetti(20); announce('◈ MAX FORTUNE +'+g4+' COINS ◈',true); }
    if(wheel.mult<4){
      const inst=15*wheel.mult; P.coins+=inst; LT.coins+=inst;
      wheel.mult*=2;
      const wm=$('wheelMult'); wm.textContent='×'+wheel.mult+' !'; wm.classList.remove('hidden','slam'); void wm.offsetWidth; wm.classList.add('slam');
      [523,659,784,1046].forEach((f9,i9)=>setTimeout(()=>tone(f9,0.16,'square',0.12),i9*70));
      SFX.dingBells(); flash(0.5,'#c98bff'); domConfetti(12); coinRain(8);
      $('wheelMsg').textContent='+'+inst+' COINS · ALL PRIZES ×'+wheel.mult+' — AGAIN!';
      setTimeout(()=>{ if(state==='wheel'){ wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.rot; if(wd) wd.className=''; } },800);
      return;
    }
  }
  wheel.done=true;
  const big=sg.tier>=3||(wheel.mult>=2&&sg.f);
  if(big){ bigWin(sg.n,3); domConfetti(18+sg.tier*6); }
  if(sg.f) sg.f(wheel.mult);
  LT.wheel=(LT.wheel||0)+1; bump('wheel',LT.wheel);
  $('wheelMsg').textContent=sg.n+(wheel.mult>1&&sg.f?'  ×'+wheel.mult:'');
  setTimeout(()=>{ $('wheelLayer').classList.add('hidden'); stopDrone();
    if(state==='wheel'){ state='playing'; if(wheel.toAscent) setTimeout(()=>{ if(state==='playing') openCrash(); },300); } }, 1600);
}
function tickWheelTok(dt){
  if(!wheelTok){ wheelTokT-=dt;
    if(wheelTokT<=0){ wheelTokT=44+Math.random()*26;
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
