"use strict";
/* ═══ RESTORED ENGINE BLOCK — rage v2, Wheel of Souls, The Ascent, map offerings ═══ */
let wheelTok=null, wheelTokT=40;
let wheel={rot:0, vel:0, spinning:false, mult:1, lastSeg:-1, done:false};
/* CS2 case rarities — blue floods the strip, gold changes your run. 200-card bag: 140/40/13/5/2. */
const CS_COL={blue:'#4b69ff',purple:'#8847ff',pink:'#d32ce6',red:'#eb4b4b',gold:'#e4ae39'};
function csCol(sg){ return CS_COL[sg.cs]||sg.c; }
const WSEGS=[
 // ── MIL-SPEC BLUE (140/200 = 70%)
 {n:'60 COINS', g:'◈', cs:'blue', c:'#c8860a', tier:1, w:46, f:(m)=>{ const g2=60*m; P.coins+=g2; LT.coins+=g2; coinRain(14*m); SFX.cashout(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'HEAL 33%', g:'✚', cs:'blue', c:'#0e8a4a', tier:1, w:36, f:(m)=>{ if(P.drought){ const g5=40*m; P.coins+=g5; LT.coins+=g5; SFX.cashout(); announce('✕ THE DROUGHT — +'+g5+' COINS INSTEAD ✕',true); return; } const hl=Math.round(P.maxHp*0.33*m); P.hp=Math.min(P.maxHp,P.hp+hl); flash(0.4,'#8bff9a'); SFX.dingBells(); announce('✚ +'+hl+' BLOOD ✚',true); }},
 {n:'↻ FREE SPIN', g:'↻', cs:'blue', c:'#ff5fa2', tier:1, w:32, f:null},
 {n:'CURSE', g:'☠', cs:'blue', c:'#640a16', tier:0, w:26, f:()=>{ const dl=applyDebuff(DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0]); SFX.bust(); flash(0.45,'#8b1620'); announce('☠ '+dl+' ☠',false); }},
 // ── RESTRICTED PURPLE (40/200 = 20%)
 {n:'90 COINS', g:'◈', cs:'purple', c:'#e8a112', tier:2, w:12, f:(m)=>{ const g2=90*m; P.coins+=g2; LT.coins+=g2; coinRain(24); SFX.cashout(); SFX.dingBells(); announce('◈ +'+g2+' COINS ◈',true); }},
 {n:'GILT +35', g:'◆', cs:'purple', c:'#96700e', tier:2, w:10, f:(m)=>{ const g3=35*m; gilt+=g3; saveGilt(); SFX.chipStack(); SFX.casinoDing(); try{ ftext(P.x,P.y-40,'+'+g3+' ◈ GILT','#fff2c0',true); }catch(e){} announce('◈ +'+g3+' GILT BANKED ◈',true); }},
 {n:'FEVER', g:'⚡', cs:'purple', c:'#f2701a', tier:2, w:9, f:()=>{ if(!feverOn){ fever=1; startFever(); } else { feverT=Math.min(12+(P.feverDur||0),feverT+5); announce('⚡ FEVER +5s ⚡',true); SFX.dingBells(); } }},
 {n:'DOUBLE', g:'×2', cs:'purple', c:'#7a3cff', tier:2, w:9, f:null},
 // ── CLASSIFIED PINK (13/200 = 6.5%)
 {n:'+1 LEVEL', g:'⚜', cs:'pink', c:'#e0203a', tier:3, w:5, f:(m)=>{ for(let i=0;i<m;i++) pending.push({}); SFX.levelUp(); announce('⚜ +'+m+' LEVEL'+(m>1?'S':'')+' ⚜',true); }},
 {n:'⚔ ARSENAL', g:'⚔', cs:'pink', c:'#c22ca0', tier:3, w:4, f:()=>{ slotForceWeapon=true; pending.push({}); SFX.levelUp(); announce('⚔ THE ARSENAL WHEEL AWAITS ⚔',true); }},
 {n:'⚔ SIDE ARM', g:'⚔', cs:'pink', c:'#2a9db8', tier:3, w:4, f:()=>{
   const fresh=availableWeapons().filter(w=>!(P.wlv[w.id]>0) && (w.rar==='common'||w.rar==='uncommon'));
   let def=fresh.length?pick(fresh):null;
   if(!def){ const grown=WEAPONS.filter(w=>(P.wlv[w.id]||0)>0 && (P.wlv[w.id]||0)<w.max); def=grown.length?pick(grown):null; }
   if(def){ grantWeaponLevels(def,1); flash(0.35,'#2a9db8'); }
   else { P.coins+=45; LT.coins+=45; coinRain(14); SFX.cashout(); announce('⚔ ARSENAL FULL — +45 COINS ⚔',true); }
 }},
 // ── COVERT RED (5/200 = 2.5%)
 {n:'✦ SKILL', g:'✦', cs:'red', c:'#3c58e8', tier:3, w:3, f:(m)=>{ rollAscentPrize(m*1.6); }},
 {n:'▲ ASCENT', g:'▲', cs:'red', c:'#0ac878', tier:3, w:2, f:()=>{ wheel.toAscent=true; announce('▲ THE WHEEL OPENS THE ASCENT ▲',true); SFX.riser(); }},
 // ── GOLD (2/200 = 1%) — the knife
 {n:'★ THE HOUSE BLADE', g:'★', cs:'gold', c:'#e4ae39', tier:4, w:2, f:()=>{
   const myth=PASSIVES.filter(p=>p.rar==='mythic' && !owned.has(p.id));
   const pd=myth.length?pick(myth):PASSIVES.find(p=>p.id==='allin');
   grantSkill(pd,1);
   gilt+=60; saveGilt(); coinRain(40);
   setTimeout(()=>announce('★ THE HOUSE BLADE — '+pd.n.toUpperCase()+' ★',true), 500);
   [0,220,460,700].forEach(d=>setTimeout(()=>{ flash(0.5,'#ffd700'); SFX.seraph(); },d)); setTimeout(()=>SFX.dingBells(),550);
   SFX.dingBells(); setTimeout(()=>SFX.record(),300); domConfetti(44); shake=Math.min(26,shake+16);
 }}
];
const TK_STEP=118, TK_CARD=110; // card 110px + 8px gap
function buildWheelDom(){
  const box=$('tickerBox'); if(box._built) return; box._built=true;
  const mq=document.createElement('div'); mq.className='wheelMarq'; mq.textContent='THE HOUSE SPINS FOR YOUR SOUL';
  box.parentNode.insertBefore(mq, box);
  const felt=document.createElement('div'); felt.className='wheelFelt';
  $('wheelLayer').insertBefore(felt, $('wheelLayer').firstChild);
  const seal=document.createElement('div'); seal.id='wheelSeal';
  seal.innerHTML='<div class="wsWax">☨</div>';
  box.appendChild(seal);
}
// sixteen ways to chain a case — each entry is a set of {t:top%, r:rot°}
const CHAIN_SETS=[
  [{t:30,r:-5},{t:66,r:4}], [{t:24,r:8},{t:74,r:-7}], [{t:50,r:-14},{t:50,r:14}],
  [{t:38,r:0},{t:60,r:0}], [{t:20,r:-3},{t:48,r:6},{t:78,r:-4}], [{t:34,r:12},{t:64,r:-12}],
  [{t:28,r:-9},{t:52,r:0},{t:76,r:9}], [{t:44,r:-18},{t:56,r:18}], [{t:18,r:5},{t:82,r:-5}],
  [{t:40,r:7},{t:58,r:-9},{t:30,r:-2}], [{t:26,r:0},{t:50,r:-11},{t:72,r:11}], [{t:60,r:-6},{t:36,r:6}],
  [{t:48,r:22},{t:52,r:-22}], [{t:22,r:-12},{t:70,r:12}], [{t:32,r:3},{t:56,r:-3},{t:80,r:3}],
  [{t:42,r:-8},{t:66,r:8}]
];
function buildChains(){
  const seal=$('wheelSeal'); if(!seal) return;
  seal.querySelectorAll('.wsChain').forEach(c=>c.remove());
  const set=CHAIN_SETS[(Math.random()*CHAIN_SETS.length)|0];
  wheel.chains=set.length; wheel._chainN=set.length; wheel.chainEls=[];
  set.forEach(cd=>{ const c=document.createElement('div'); c.className='wsChain';
    c.style.top=cd.t+'%'; c.style.transform='rotate('+cd.r+'deg)';
    seal.insertBefore(c, seal.firstChild); wheel.chainEls.push(c); });
}
// the case costs a cut — paid on the FIRST press. Every SPACE snaps ONE chain;
// when the last snaps, the wax shatters and SPACE spins.
function unsealWheel(){
  if(wheel.phase!=='sealed') return;
  if(wheel.chains===undefined) wheel.chains=1;
  // first press pays
  if(!wheel._paid){ wheel._paid=true;
    const cost=wheel.cost||0;
    if(cost>0){ P.coins-=cost; $('coinCount').textContent=P.coins;
      SFX.cashout(); coinRain(Math.min(14,4+(cost/8|0)));
      if(cost>=100) secret('highroller','HIGH ROLLER');
      announce('◈ THE HOUSE TAKES ITS CUT — '+cost+' ◈',true); } }
  // snap one chain — hard clack, sparks, the box takes the hit
  const el=(wheel.chainEls||[]).pop();
  if(el){ el.classList.add('snap'); setTimeout(()=>el.remove(),500); }
  wheel.chains--;
  if(wheel.chains===0 && (wheel._chainN||0)>=3) secret('chained3','CHAINBREAKER');
  SFX.reelLock(); tone(84,0.16,'sine',0.3,44); noise(0.1,0.2,1600); SFX.leverSlam();
  flash(0.3,'#ffd36b'); shake=Math.min(16,shake+7); sparkBurstAt('tickerBox','wheelLayer',12);
  { const box=$('tickerBox'); if(box){ box.classList.remove('slam'); void box.offsetWidth; box.classList.add('slam'); } }
  if(wheel.chains>0){
    $('wheelMsg').innerHTML='⛓ '+wheel.chains+' CHAIN'+(wheel.chains>1?'S':'')+' LEFT · <span class="keyhint">SPACE</span> snaps the next';
    return;
  }
  // the wax shatters
  const seal=$('wheelSeal');
  if(seal){ seal.classList.add('crack'); setTimeout(()=>{ seal.classList.add('hidden'); seal.classList.remove('crack'); },450); }
  SFX.dingBells(); flash(0.4,'#fff2c0'); sparkBurstAt('tickerBox','wheelLayer',18);
  wheel.phase='idle';
  $('wheelMsg').innerHTML=(wheel.golden?'✦ ALL PRIZES DOUBLED ✦ · ':'')+'<span class="keyhint">SPACE</span> — spin the ticker';
}
function buildTickerStrip(){
  // the exact 200-card CS bag (weights sum to 200), shuffled with no adjacent twins
  const bag=[]; WSEGS.forEach((sg,i)=>{ const w=sg.w||5; for(let k=0;k<w;k++) bag.push(i); });
  for(let i=bag.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [bag[i],bag[j]]=[bag[j],bag[i]]; }
  for(let i=1;i<bag.length;i++){ if(bag[i]===bag[i-1]) { const j=(i+7)%bag.length; [bag[i],bag[j]]=[bag[j],bag[i]]; } }
  const strip=bag.slice();
  wheel.strip=strip;
  const el=$('tickerStrip'); el.innerHTML='';
  strip.forEach(si=>{ const sg=WSEGS[si];
    const c=document.createElement('div'); c.className='tkCard tkcs-'+(sg.cs||'blue')+(sg.tier===0?' tkdud':''); c.style.setProperty('--tc',csCol(sg));
    const dn=(sg.g && sg.n.indexOf(sg.g)===0)? sg.n.slice(sg.g.length).trim() : sg.n;
    c.innerHTML='<span class="tkG">'+(sg.g||'◈')+'</span><span class="tkN">'+dn+'</span><i class="tkBar"></i>';
    el.appendChild(c); });
}
function tkX(x){ $('tickerStrip').style.transform='translate3d('+x+'px,0,-0px)'; }
function tkCenter(i){ return i*TK_STEP+TK_CARD/2; }
function openWheel(){
  coachMark('wheel','SPACE snaps the chains — CONTRABAND is the finest shelf');
  buildWheelDom(); state='wheel';
  wheel={x:0, phase:'sealed', mult:1, lastSeg:-1, done:false, windT:0, setT:0, toAscent:false,
    golden:Math.random()<(0.05+(P.goldenBoost||0)), windK:0, slowTicks:0, hbT:0, strip:[], tIdx:0, jit:0, rigSeg:(wheel&&wheel.rigSeg)||null};
  wheel.cost=Math.ceil((P.coins||0)*0.25);
  buildTickerStrip();
  $('wheelMult').classList.add('hidden');
  { const ww=$('wheelWin'); if(ww) ww.classList.remove('go','quick'); }
  const box=$('tickerBox'); box.classList.remove('landed','rehot'); box.style.boxShadow='';
  { const seal=$('wheelSeal'); if(seal){ seal.classList.remove('hidden','crack'); } }
  buildChains();
  stopDrumroll();
  $('wheelLayer').classList.toggle('golden', wheel.golden);
  const mq=document.querySelector('.wheelMarq'); if(mq) mq.textContent=wheel.golden?'✦ GOLDEN SPIN — ALL PRIZES DOUBLED ✦':'THE HOUSE SPINS FOR YOUR SOUL';
  $('wheelMsg').innerHTML = wheel.cost>0
    ? '⛓ '+wheel.chains+' CHAINS — PAY <b style="color:#ffd36b">'+wheel.cost+' ◈</b> · <span class="keyhint">SPACE</span> snaps one'
    : '⛓ '+wheel.chains+' CHAINS — COMPED · <span class="keyhint">SPACE</span> snaps one';
  $('wheelLayer').classList.remove('hidden');
  wheel.boxW=box.clientWidth||Math.min(720,window.innerWidth*0.92);
  wheel.x=-(tkCenter(8)-wheel.boxW/2); tkX(wheel.x);
  SFX.vaultOpen(); startDrone();
  if(wheel.golden) setTimeout(()=>{ if(state==='wheel' && wheel.phase==='idle'){ SFX.achieve(); SFX.tingle(); flash(0.4,'#ffd36b');
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
  let tIdx=120+((Math.random()*40)|0);
  if(wheel.rigSeg){ let k=110; while(k<wheel.strip.length && WSEGS[wheel.strip[k]].n!==wheel.rigSeg) k++;
    if(k<wheel.strip.length) tIdx=k; else { let k2=8; while(k2<wheel.strip.length && WSEGS[wheel.strip[k2]].n!==wheel.rigSeg) k2++; if(k2<wheel.strip.length) tIdx=k2; }
    wheel.rigSeg=null; }
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
  startWhirr();
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
    whirrSpeed(t);
    if(card!==wheel.lastSeg){ wheel.lastSeg=card;
      SFX.wheelTick(t);
      if(t<0.5) noise(0.02,0.03,5200); // card flutter while fast
      const sg=WSEGS[wheel.strip[card]];
      if(sg) $('tickerBox').style.boxShadow='0 0 0 2px #3a0a10,0 0 56px '+csCol(sg)+',inset 0 0 60px rgba(0,0,0,.85)';
      const mk=$('tickerMarker'); if(mk){ mk.classList.remove('kick'); void mk.offsetWidth; mk.classList.add('kick'); if(sg) mk.style.setProperty('--mc',csCol(sg)); }
      const cEl=el.children[card]; if(cEl){ cEl.classList.remove('pass'); void cEl.offsetWidth; cEl.classList.add('pass'); }
      if(t>0.82){ wheel.slowTicks++; SFX.dingHit(Math.min(5,wheel.slowTicks)); tone(160,0.12+wheel.slowTicks*0.05,'sine',0.1,90); } // the brake drags
    }
    if(t>0.86){ wheel.hbT-=dt; if(wheel.hbT<=0){ wheel.hbT=0.22+0.3*(1-t); window._hbDuck=performance.now()+700; tone(50,0.16,'sine',0.3,38); setTimeout(()=>tone(62,0.1,'sine',0.2,44),120); } }
    if(t>=1){ wheel.phase='settle'; wheel.setT=0; stopWhirr();
      noise(0.09,0.16,3800); tone(1180,0.12,'square',0.1); tone(64,0.3,'sine',0.26,42); // SHINK + felt thump
      setTimeout(()=>tone(330,0.15,'sine',0.12,180),100); }
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
  stopWhirr();
  const box=$('tickerBox'); box.classList.remove('landed');
  [...$('tickerStrip').children].forEach(c=>c.classList.remove('hit','pass'));
  wheel._braked=false;
  wheel.phase='wind'; wheel.windT=0; wheel.windFrom=wheel.x; wheel.windK=0;
}
// SPACE mid-roll: slam the brake — the strip jumps to its crawl with a heavy clack
function brakeTicker(){
  if(wheel.phase!=='roll' || wheel._braked) return; wheel._braked=true;
  { const bx=$('tickerBox'); if(bx){ bx.classList.remove('pressflash'); void bx.offsetWidth; bx.classList.add('pressflash'); } }
  wheel.rollT=Math.max(wheel.rollT, wheel.rollDur*0.86);
  SFX.reelLock(); tone(120,0.24,'sine',0.26,68); noise(0.16,0.1,900); shake=Math.min(12,shake+6);
  // brake feels like a reel stop now: flash, sparks, and the box takes the hit
  tone(64,0.2,'sine',0.34,36); noise(0.12,0.18,1100);
  flash(0.34,'#fff0c8'); sparkBurstAt('tickerBox','wheelLayer',16);
  { const box=$('tickerBox'); if(box){ box.style.transition='transform .08s'; box.style.transform='scale(0.986)'; setTimeout(()=>{ box.style.transform=''; },90); } }
  const box=$('tickerBox'); if(box){ box.classList.remove('slam'); void box.offsetWidth; box.classList.add('slam'); }
}
// close the wheel NOW (space after landing) — same exit the auto-timer takes
function finishWheel(){
  if(wheel._closed) return; wheel._closed=true;
  stopWhirr();
  { const ww=$('wheelWin'); if(ww) ww.classList.remove('go','quick','mega'); }
  $('wheelLayer').classList.add('hidden'); stopDrone();
  if(state==='wheel'){ state='playing';
    if(wheel.toAscent) setTimeout(()=>{ if(state==='playing') openCrash(); },300);
    else if(pending.length) setTimeout(()=>{ if(state==='playing' && pending.length) openNextSlot(); },450); }
}
function landWheel(seg){
  const sg=WSEGS[seg];
  if(sg.cs==='gold' && !wheel._froze){ wheel._froze=true; stopDrumroll(); // CONTRABAND holds its breath for a beat
    const bx9=$('tickerBox'); if(bx9){ bx9.classList.add('goldHold'); setTimeout(()=>bx9.classList.remove('goldHold'),340); }
    setTimeout(()=>landWheel(seg), 340); return; }
  stopDrumroll();
  RUN.wheelCs.push(sg.cs||'blue');
  const gm=wheel.golden?2:1;
  shake=Math.min(18,shake+8+sg.tier*3); landChime(sg.tier);
  const box=$('tickerBox');
  if(box){ box.style.boxShadow='0 0 0 2px #3a0a10,0 0 90px '+sg.c+',inset 0 0 60px rgba(0,0,0,.85)'; }
  const mk=$('tickerMarker'); if(mk){ mk.classList.remove('slam'); void mk.offsetWidth; mk.classList.add('slam'); setTimeout(()=>mk.classList.remove('slam'),600); }
  if(sg.n==='↻ FREE SPIN'){
    announce('↻ THE HOUSE SPINS AGAIN — FREE ↻',true); SFX.achieve(); SFX.dingBells(); flash(0.35,'#ff5fa2');
    wheel.phase='freespin'; // the respin waits for YOUR press
    $('wheelMsg').innerHTML='↻ FREE SPIN · <span class="keyhint">SPACE</span> — roll it';
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
  wheel.done=true; wheel._froze=false;
  // CS-tier land ceremony: pink pops, red screams, gold changes the run
  const csc=csCol(sg);
  if(sg.cs==='pink'){ domConfetti(26); flash(0.35,csc); }
  else if(sg.cs==='red'){ domConfetti(32); flash(0.5,csc); setTimeout(()=>flash(0.4,csc),200); setTimeout(()=>SFX.dingBells(),260); }
  else if(sg.cs==='gold'){ domConfetti(50); }
  const big=sg.tier>=3||(wheel.mult*gm>=2&&sg.f);
  if(big){ bigWin(sg.n,3); domConfetti(18+sg.tier*6); }
  { let ww=$('wheelWin'); if(!ww){ ww=document.createElement('div'); ww.id='wheelWin'; $('wheelLayer').appendChild(ww); }
    ww.classList.toggle('mega', sg.cs==='gold');
    ww.innerHTML='<div class="awT" style="color:'+(sg.tier===0?'#ff7b7b':csc)+';filter:brightness(1.6) saturate(1.3)">'+sg.n+((wheel.mult*gm)>1&&sg.f?' ×'+(wheel.mult*gm):'')+'</div>';
    ww.classList.remove('go'); void ww.offsetWidth; ww.classList.add('go'); }
  if(sg.f) sg.f(wheel.mult*gm);
  if(wheel.golden&&sg.tier>=1) setTimeout(()=>SFX.record(),150);
  LT.wheel=(LT.wheel||0)+1; bump('wheel',LT.wheel);
  $('wheelMsg').innerHTML=sg.n+((wheel.mult*gm)>1&&sg.f?'  ×'+(wheel.mult*gm):'')+' · <span class="keyhint">SPACE</span> continue';
  // ASCENT prize: shorten the win slam and close the wheel BEFORE the crash
  // lobby opens — the two ceremonies used to overlap for ~500ms
  if(wheel.toAscent){ const ww=$('wheelWin'); if(ww) ww.classList.add('quick'); }
  setTimeout(finishWheel, wheel.toAscent?1100:(sg.cs==='gold'?2600:1600));
}
function tickWheelTok(dt){
  if(houseActive) return; // no cases on the House's floor
  if(!wheelTok){ wheelTokT-=dt;
    if(wheelTokT<=0){ wheelTokT=(50+Math.random()*20-10)*(1-(P.wheelHaste||0)); // pity window: 40-60s, droughts impossible
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
  // a gilded reliquary case now — you pay to crack it open
  if(!wheelTok) return; const w=wheelTok, fl=w.t<4?(Math.floor(gt*8)%2?0.4:1):1;
  ctx.save(); ctx.translate(w.x,w.y+Math.sin(gt*2.6+w.ph)*3); ctx.globalAlpha=fl;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g2=ctx.createRadialGradient(0,0,0,0,0,36); g2.addColorStop(0,'rgba(201,139,255,0.4)'); g2.addColorStop(1,'rgba(201,139,255,0)');
  ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(0,0,36,0,6.28); ctx.fill(); ctx.restore();
  // body — dark lacquer chest with a raised lid
  ctx.fillStyle='#1c0f14';
  ctx.beginPath(); ctx.roundRect(-14,-9,28,19,3.5); ctx.fill();
  ctx.fillStyle='#2c161e';
  ctx.beginPath(); ctx.roundRect(-14,-9,28,8,3.5); ctx.fill();
  // gold trim: rim, lid seam, corner studs
  ctx.strokeStyle='#e8b64c'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.roundRect(-14,-9,28,19,3.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14,-1); ctx.lineTo(14,-1); ctx.stroke();
  ctx.fillStyle='#ffd36b';
  [[-11,-6],[11,-6],[-11,7],[11,7]].forEach(p=>{ ctx.beginPath(); ctx.arc(p[0],p[1],1.2,0,6.28); ctx.fill(); });
  // the latch — violet gem in a gold clasp
  ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.roundRect(-3,-3.4,6,7,1.6); ctx.fill();
  ctx.fillStyle='#c98bff'; ctx.beginPath(); ctx.arc(0,0,1.9,0,6.28); ctx.fill();
  // glint sweep across the lid
  { const gx=((gt*1.4+w.ph)%2.2)*14-14;
    if(gx>-13&&gx<13){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55*fl;
      ctx.strokeStyle='#fff2c0'; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(gx-2,-8.4); ctx.lineTo(gx+2,-1.6); ctx.stroke(); ctx.restore(); ctx.globalAlpha=fl; } }
  ctx.restore(); ctx.globalAlpha=1;
}
