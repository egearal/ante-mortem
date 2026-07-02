"use strict";
/* ═══ RESTORED ENGINE BLOCK — rage v2, Wheel of Souls, The Ascent, map offerings ═══ */
let wheelTok=null, wheelTokT=40;
let wheel={rot:0, vel:0, spinning:false, mult:1, lastSeg:-1, done:false};
const WSEGS=[
 {n:'60 COINS', g:'◈', c:'#c8860a', tier:1, f:(m)=>{ const g2=60*m; P.coins+=g2; LT.coins+=g2; coinRain(14*m); SFX.cashout(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'CURSE', g:'☠', c:'#640a16', tier:0, f:()=>{ const dl=applyDebuff(DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0]); SFX.bust(); flash(0.45,'#8b1620'); announce('☠ '+dl+' ☠',false); }},
 {n:'HEAL 33%', g:'✚', c:'#0e8a4a', tier:1, f:(m)=>{ const hl=Math.round(P.maxHp*0.33*m); P.hp=Math.min(P.maxHp,P.hp+hl); flash(0.4,'#8bff9a'); SFX.dingBells(); announce('✚ +'+hl+' BLOOD ✚',true); }},
 {n:'DOUBLE', g:'×2', c:'#7a3cff', tier:2, f:null},
 {n:'90 COINS', g:'◈', c:'#e8a112', tier:2, f:(m)=>{ const g2=90*m; P.coins+=g2; LT.coins+=g2; coinRain(24); SFX.cashout(); SFX.dingBells(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'GILT +35', g:'◆', c:'#96700e', tier:2, f:(m)=>{ const g3=35*m; gilt+=g3; saveGilt(); SFX.chipStack(); SFX.casinoDing(); announce('◈ +'+g3+' GILT BANKED ◈',true); }},
 {n:'⚔ ARSENAL', g:'⚔', c:'#c22ca0', tier:3, f:()=>{ slotForceWeapon=true; pending.push({}); SFX.levelUp(); announce('⚔ THE ARSENAL WHEEL AWAITS ⚔',true); }},
 {n:'+1 LEVEL', g:'⚜', c:'#e0203a', tier:3, f:(m)=>{ for(let i=0;i<m;i++) pending.push({}); SFX.levelUp(); announce('⚜ +'+m+' LEVEL'+(m>1?'S':'')+' ⚜',true); }},
 {n:'FEVER', g:'⚡', c:'#f2701a', tier:2, f:()=>{ if(!feverOn){ fever=1; startFever(); } else { feverT=Math.min(12+(P.feverDur||0),feverT+5); announce('⚡ FEVER +5s ⚡',true); SFX.dingBells(); } }},
 {n:'DOUBLE', g:'×2', c:'#7a3cff', tier:2, f:null},
 {n:'✦ SKILL', g:'✦', c:'#3c58e8', tier:3, f:(m)=>{ rollAscentPrize(m*1.6); }},
 {n:'▲ ASCENT', g:'▲', c:'#0ac878', tier:3, f:()=>{ wheel.toAscent=true; announce('▲ THE WHEEL OPENS THE ASCENT ▲',true); SFX.riser(); }},
 {n:'⚔ SIDE ARM', g:'⚔', c:'#2a9db8', tier:3, w:3, f:()=>{
   const fresh=availableWeapons().filter(w=>!(P.wlv[w.id]>0) && w.rar==='common');
   let def=fresh.length?pick(fresh):null;
   if(!def){ const grown=WEAPONS.filter(w=>(P.wlv[w.id]||0)>0 && (P.wlv[w.id]||0)<w.max); def=grown.length?pick(grown):null; }
   if(def){ grantWeaponLevels(def,1); flash(0.35,'#2a9db8'); }
   else { P.coins+=45; LT.coins+=45; coinRain(14); SFX.cashout(); announce('⚔ ARSENAL FULL — +45 COINS ⚔',true); }
 }},
 {n:'↻ FREE SPIN', g:'↻', c:'#ff5fa2', tier:1, w:3, f:null}
];
const TK_STEP=118, TK_CARD=110; // card 110px + 8px gap
function buildWheelDom(){
  const box=$('tickerBox'); if(box._built) return; box._built=true;
  const mq=document.createElement('div'); mq.className='wheelMarq'; mq.textContent='THE HOUSE SPINS FOR YOUR SOUL';
  box.parentNode.insertBefore(mq, box);
  const felt=document.createElement('div'); felt.className='wheelFelt';
  $('wheelLayer').insertBefore(felt, $('wheelLayer').firstChild);
}
function buildTickerStrip(){
  // weighted bag (w||5 copies of each prize), shuffled with no adjacent twins, tiled long enough to roll across
  const bag=[]; WSEGS.forEach((sg,i)=>{ const w=sg.w||5; for(let k=0;k<w;k++) bag.push(i); });
  for(let i=bag.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [bag[i],bag[j]]=[bag[j],bag[i]]; }
  for(let i=1;i<bag.length;i++){ if(bag[i]===bag[i-1]) { const j=(i+7)%bag.length; [bag[i],bag[j]]=[bag[j],bag[i]]; } }
  const strip=[]; while(strip.length<96) strip.push(...bag);
  wheel.strip=strip;
  const el=$('tickerStrip'); el.innerHTML='';
  strip.forEach(si=>{ const sg=WSEGS[si];
    const c=document.createElement('div'); c.className='tkCard tk'+sg.tier; c.style.setProperty('--tc',sg.c);
    const dn=(sg.g && sg.n.indexOf(sg.g)===0)? sg.n.slice(sg.g.length).trim() : sg.n;
    c.innerHTML='<span class="tkG">'+(sg.g||'◈')+'</span><span class="tkN">'+dn+'</span>';
    el.appendChild(c); });
}
function tkX(x){ $('tickerStrip').style.transform='translate3d('+x+'px,0,-0px)'; }
function tkCenter(i){ return i*TK_STEP+TK_CARD/2; }
function openWheel(){
  buildWheelDom(); state='wheel';
  wheel={x:0, phase:'idle', mult:1, lastSeg:-1, done:false, windT:0, setT:0, toAscent:false,
    golden:Math.random()<0.05, windK:0, slowTicks:0, hbT:0, strip:[], tIdx:0, jit:0, rigSeg:(wheel&&wheel.rigSeg)||null};
  buildTickerStrip();
  $('wheelMult').classList.add('hidden');
  { const ww=$('wheelWin'); if(ww) ww.classList.remove('go'); }
  const box=$('tickerBox'); box.classList.remove('landed','rehot'); box.style.boxShadow='';
  stopDrumroll();
  $('wheelLayer').classList.toggle('golden', wheel.golden);
  const mq=document.querySelector('.wheelMarq'); if(mq) mq.textContent=wheel.golden?'✦ GOLDEN SPIN — ALL PRIZES DOUBLED ✦':'THE HOUSE SPINS FOR YOUR SOUL';
  $('wheelMsg').innerHTML='<span class="keyhint">SPACE</span> — spin the ticker';
  $('wheelLayer').classList.remove('hidden');
  wheel.boxW=box.clientWidth||Math.min(720,window.innerWidth*0.92);
  wheel.x=-(tkCenter(8)-wheel.boxW/2); tkX(wheel.x);
  SFX.vaultOpen(); startDrone();
  if(wheel.golden) setTimeout(()=>{ if(state==='wheel'){ SFX.achieve(); SFX.tingle(); flash(0.4,'#ffd36b');
    $('wheelMsg').innerHTML='✦ ALL PRIZES DOUBLED ✦ · <span class="keyhint">SPACE</span> — spin'; } },350);
}
function launchWheel(){
  if(wheel.phase!=='idle'||wheel.done) return;
  wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.x; wheel.windK=0;
  $('wheelMsg').textContent='FATE SLIDES…';
  tone(140,0.24,'sawtooth',0.12,70); SFX.leverWind();
}
function startRoll(){
  const box=$('tickerBox'); wheel.boxW=box.clientWidth||wheel.boxW||660;
  let tIdx=60+((Math.random()*20)|0);
  if(wheel.rigSeg){ let k=56; while(k<wheel.strip.length && WSEGS[wheel.strip[k]].n!==wheel.rigSeg) k++;
    if(k<wheel.strip.length) tIdx=k; wheel.rigSeg=null; }
  // THE FIX IS IN — the CURSE card never holds, the ticker slides one past it
  if(WSEGS[wheel.strip[tIdx]].n==='CURSE' && typeof contractDone==='function' && contractDone('thefix')){
    tIdx++; setTimeout(()=>announce('♠ THE FIX IS IN — THE CURSE NEVER HOLDS ♠',true), 900); }
  wheel.tIdx=tIdx;
  let jit=(Math.random()*0.68-0.34)*TK_STEP;
  if(Math.abs(jit)<0.22*TK_STEP && Math.random()<0.6) jit=(jit<0?-1:1)*(0.26+Math.random()*0.08)*TK_STEP; // bias toward visible hangs
  wheel.jit=jit;
  wheel.xClean=-(tkCenter(tIdx)-wheel.boxW/2);
  wheel.rx0=wheel.x; wheel.rx1=wheel.xClean-jit;
  wheel.rollT=0; wheel.rollDur=3.9+Math.random()*0.6; wheel.slowTicks=0; wheel.hbT=0; wheel.lastSeg=-1;
  wheel.phase='roll';
  SFX.riser(); noise(0.3,0.22,2600); tone(150,0.5,'sawtooth',0.1,900);
  setTimeout(()=>SFX.chipStack(),60); setTimeout(()=>SFX.coinPling(),130); setTimeout(()=>SFX.tingle(),220);
  if(wheel.golden) startDrumroll();
}
function tickWheel(dt){
  const el=$('tickerStrip'); if(!el) return;
  if(wheel.phase==='wind'){
    wheel.windT+=dt; const f=Math.min(1,wheel.windT/0.22);
    wheel.x=wheel.windFrom + 0.8*TK_STEP*Math.sin(f*Math.PI*0.5); tkX(wheel.x);
    if(Math.floor(f*4)>wheel.windK){ wheel.windK=Math.floor(f*4); tone(240+wheel.windK*70,0.03,'square',0.12); noise(0.02,0.06,3000); }
    if(f>=1) startRoll();
    return;
  }
  if(wheel.phase==='roll'){
    wheel.rollT+=dt; const t=Math.min(1,wheel.rollT/wheel.rollDur);
    const e=1-Math.pow(1-t,3);
    wheel.x=wheel.rx0+(wheel.rx1-wheel.rx0)*e; tkX(wheel.x);
    const card=Math.round((wheel.boxW/2-wheel.x-TK_CARD/2)/TK_STEP);
    if(card!==wheel.lastSeg){ wheel.lastSeg=card;
      SFX.wheelTick(t);
      const sg=WSEGS[wheel.strip[card]];
      if(sg) $('tickerBox').style.boxShadow='0 0 0 2px #3a0a10,0 0 56px '+sg.c+',inset 0 0 60px rgba(0,0,0,.85)';
      const cEl=el.children[card]; if(cEl){ cEl.classList.remove('pass'); void cEl.offsetWidth; cEl.classList.add('pass'); }
      const mk=$('tickerMarker'); if(mk){ mk.classList.remove('kick'); void mk.offsetWidth; mk.classList.add('kick'); }
      if(t>0.82){ wheel.slowTicks++; SFX.dingHit(Math.min(5,wheel.slowTicks)); }
    }
    if(t>0.86){ wheel.hbT-=dt; if(wheel.hbT<=0){ wheel.hbT=0.22+0.3*(1-t); tone(50,0.16,'sine',0.3,38); setTimeout(()=>tone(62,0.1,'sine',0.2,44),120); } }
    if(t>=1){ wheel.phase='settle'; wheel.setT=0;
      tone(170,0.2,'sine',0.2,330); setTimeout(()=>tone(330,0.15,'sine',0.12,180),100); }
    return;
  }
  if(wheel.phase==='settle'){
    // the near-miss: the strip landed off-center on the winner's edge, now it slides back with a bounce
    wheel.setT+=dt; const f=Math.min(1,wheel.setT/0.55);
    const ease=1-Math.pow(1-f,3);
    wheel.x=wheel.rx1+(wheel.xClean-wheel.rx1)*ease + Math.sin(f*Math.PI)*(-wheel.jit*0.3)*(1-f);
    tkX(wheel.x);
    if(f>=0.5 && f-dt/0.55<0.5) tone(120,0.14,'sine',0.14,70);
    if(f>=1){ wheel.phase='done';
      const cEl=$('tickerStrip').children[wheel.tIdx]; if(cEl) cEl.classList.add('hit');
      $('tickerBox').classList.add('landed');
      landWheel(wheel.strip[wheel.tIdx]); }
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
function respinTicker(){
  if(state!=='wheel') return;
  const box=$('tickerBox'); box.classList.remove('landed');
  [...$('tickerStrip').children].forEach(c=>c.classList.remove('hit','pass'));
  wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.x; wheel.windK=0;
}
function landWheel(seg){
  const sg=WSEGS[seg];
  stopDrumroll();
  const gm=wheel.golden?2:1;
  shake=Math.min(18,shake+8+sg.tier*3); landChime(sg.tier);
  const box=$('tickerBox');
  if(box){ box.style.boxShadow='0 0 0 2px #3a0a10,0 0 90px '+sg.c+',inset 0 0 60px rgba(0,0,0,.85)'; }
  const mk=$('tickerMarker'); if(mk){ mk.classList.remove('slam'); void mk.offsetWidth; mk.classList.add('slam'); setTimeout(()=>mk.classList.remove('slam'),600); }
  if(sg.n==='↻ FREE SPIN'){
    announce('↻ THE HOUSE SPINS AGAIN — FREE ↻',true); SFX.achieve(); SFX.dingBells(); flash(0.35,'#ff5fa2');
    $('wheelMsg').textContent='↻ FREE SPIN — AGAIN!';
    setTimeout(respinTicker, 900);
    return;
  }
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
      if(box){ box.classList.remove('rehot'); void box.offsetWidth; box.classList.add('rehot'); }
      setTimeout(respinTicker, 800);
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
      announce('☸ THE WHEEL OF SOULS MANIFESTS ☸', true); SFX.dingBells();
      [1046,1318,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.14,'sine',0.08),i*110)); // come-play beckon
      ring(wheelTok.x,wheelTok.y,90,'#c98bff'); ring(wheelTok.x,wheelTok.y,54,'#ffd36b'); }
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
