"use strict";
let crashTok=null, crashTokT=38;
let crashHist=[];
let crash={on:false, mult:1, cp:2, stakePct:2, wager:0, live:false, done:false, tick:0};
/* ◆ J1 — THE FEED (replaced RAGE). A full XP bar becomes a mouth: souls and coins feed it,
   it drains faster the longer it lives, and every second fed lights a jewel —
   I WARM at 3s, II HOT at 7s, III FEAST at 12s. SPACE cashes any time: the next
   level's reels run at the tier's odds. Let it starve and a quarter of the XP is gone. */
const FEED_T=[0,3,7,12];
const FEED_NAME=['','WARM ◆','HOT ◆◆','FEAST ★'];
const FEED_COL=['#8fd977','#6db4ff','#c98bff','#ffd36b']; // jewel colors: feeding · I rare-blue · II epic-violet · III legendary-gold
function startOvercharge(){
  if(P.ovT>0) return;
  P.ovT=100; P.ovAge=0; P.ovCharge=0; P.ovTier=0; P._ovR=P.fireRate; P._ovD=P.damage;
  P.fireRate*=1.5; P.damage*=1.5;
  const h2r=(typeof fnOn==='function' && fnOn() && P._fnN===1 && !P._h2R); P._h2R=1;
  announce(h2r?'✦ THE FEED — KEEP KILLING · SPACE CASHES ✦':'✦ THE FEED — FEED IT SOULS · THE LONGER, THE RICHER ✦', true);
  SFX.riser(); SFX.hotSix(); flash(0.4,'#ff9a3c'); shake=Math.min(14,shake+6);
}
function ovRevert(){
  if(P._ovR!==undefined){ P.fireRate=P._ovR; P._ovR=undefined; }
  if(P._ovD!==undefined){ P.damage=P._ovD; P._ovD=undefined; }
  P.ovT=0; feedBody(0);
}
function feedBody(t){ if(feedBody._t===t) return; feedBody._t=t; const b=document.body; b.classList.remove('feed-1','feed-2','feed-3'); if(t>0) b.classList.add('feed-'+t); }
function feedTick(dt){
  if(!(P.ovT>0)){ if(feedBody._t) feedBody(0); return; }
  P.ovAge+=dt;
  P.ovT-=dt*(5+P.ovAge*0.5);
  P.ovCharge=(P.ovCharge||0)+dt*(P.ovT>=50?1:0.5);
  const tier=P.ovCharge>=FEED_T[3]?3:P.ovCharge>=FEED_T[2]?2:P.ovCharge>=FEED_T[1]?1:0;
  if(tier>(P.ovTier||0)){ P.ovTier=tier; feedTierUp(tier); }
  feedBody(P.ovTier||0);
  P._ovHb=(P._ovHb||0)-dt; if(P._ovHb<=0){ P._ovHb=Math.max(0.16,0.45-P.ovTier*0.09); tone(56+P.ovTier*14,0.1,'sine',0.13,44); }
  if(Math.random()<0.5) parts.push({x:P.x+rnd(-14,14),y:P.y+rnd(-8,12),vx:rnd(-16,16),vy:-rnd(60,140),life:rnd(.25,.5),col:P.ovTier?FEED_COL[P.ovTier]:'#ffd36b',r:rnd(1.4,2.6)});
  if(P.ovT<30 && !P._ovWarn && P.ovT>0){ P._ovWarn=1; // it is about to starve — the room tells you
    [740,560,420].forEach((f,i)=>setTimeout(()=>tone(f,0.11,'square',0.07),i*90)); showStreak('☠ IT STARVES — FEED IT OR CASH IT ☠'); }
  if(P.ovT>=45) P._ovWarn=0;
  if(P.ovT<=0) feedStarve();
}
function feedTierUp(t){
  const c=FEED_COL[t]; P._tierUpT=gt;
  try{ SFX.rarSting(t===3?4:t); }catch(e){ try{ SFX.dingBells(); }catch(x){} }
  flash(0.18+t*0.08, c); shake=Math.min(16,shake+2+t*2);
  ring(P.x,P.y,70+t*30,c); ring(P.x,P.y,40+t*16,'#fff2c0'); burst(P.x,P.y,10+t*6,c);
  if(t===3){ SFX.seraph(); sparkBurst(26); }
  announce(t===1?'◆ THE REELS RUN WARM ◆':t===2?'◆◆ THE REELS RUN HOT ◆◆':'★ THE FEAST — ONLY EPIC & LEGENDARY ★', c);
}
function cashRage(){
  const tier=P.ovTier||0; ovRevert(); P.ovCharge=0; P.ovTier=0;
  try{ RUN.feedBest=Math.max(RUN.feedBest||0,tier); RUN.feeds=(RUN.feeds||0)+1; if(tier===3) RUN.feasts=(RUN.feasts||0)+1; }catch(e){}
  slotFeedTier=Math.max(slotFeedTier||0, tier);
  if(tier>0){ SFX.dingBells(); SFX.cashout(); sparkBurst(14+tier*8); flash(0.3+tier*0.08, FEED_COL[tier]);
    if(tier===3){ SFX.seraph(); try{ domConfetti(); }catch(e){} setTimeout(()=>secret('glutton','THE GLUTTON'),900); }
    if(!(gt-(P._tierUpT||-9)<1.2)) announce(tier===3?'★ CASHED AT THE FEAST — THE REELS RUN GOLD ★':tier===2?'◆◆ CASHED HOT — RICHER REELS ◆◆':'◆ CASHED WARM — BETTER REELS ◆', FEED_COL[tier]); }
  else { SFX.cashout(); announce('◈ CASHED COLD — PLAIN REELS ◈', true); }
  P._ovPass=true; gainXP(0);
}
const cashFeed=(...a)=>cashRage(...a);
function feedStarve(){
  ovRevert(); P.ovCharge=0; P.ovTier=0;
  P.xp=Math.floor(P.xpNext*0.75);
  announce('☠ THE BAR STARVES — A QUARTER OF YOUR XP IS GONE ☠', false);
  SFX.bust(); noise(0.4,0.18,420); flash(0.45,'#8b1620'); shake=Math.min(18,shake+8);
  ftext(P.x,P.y-26,'−25% XP','#ff6b6b',true);
}
function openCrash(){
  const rig9=crash&&crash.rigCp; state='crash'; crash={on:true, mult:1, cp:0, wager:0, live:false, done:false, next:0.25, msIdx:0, hb:0, rigCp:rig9||0};
  const rk=$('crashRocket'); rk.className=''; rk.style.bottom='0px'; rk.style.opacity='';
  $('crashLayer').style.filter=''; $('crashLayer').classList.remove('gatehold');
  { const cb9=$('crashBulbs'); if(cb9) cb9.classList.remove('frenzy'); }
  { const cm9=$('crashMult'); cm9.style.color=''; }
  { let au=$('crashAurora'); if(!au){ au=document.createElement('div'); au.id='crashAurora'; $('crashLayer').insertBefore(au,$('crashLayer').firstChild); } au.style.opacity=0; }
  { let em=$('crashEmbers'); if(!em){ em=document.createElement('div'); em.id='crashEmbers';
      for(let i=0;i<9;i++){ const p=document.createElement('span'); p.className='cem';
        p.style.left=(Math.random()*100)+'%'; p.style.animationDelay=(Math.random()*5)+'s';
        p.style.width=p.style.height=(8+Math.random()*14)+'px'; em.appendChild(p); }
      $('crashLayer').insertBefore(em,$('crashLayer').firstChild); } }
  ['crashSlam','crashGhost','crashFrenzy','ascWin'].forEach(id=>{ let d=$(id);
    if(!d){ d=document.createElement('div'); d.id=id; $('crashMult').parentNode.insertBefore(d, id==='crashGhost'?$('crashMult'):$('crashMult').nextSibling); }
    d.className=''; d.textContent=''; });
  { let tl=$('tierLadder'); if(!tl){ tl=document.createElement('div'); tl.id='tierLadder';
      tl.innerHTML='<div class="tln" data-x="7.77">☆ 7.77× · ASCENSION</div><div class="tlbar"></div><div class="tln" data-x="3.69">III 3.69× · THE ARMORY</div><div class="tlbar"></div><div class="tln" data-x="2.77">II 2.77× · HOT LEVEL</div><div class="tlbar"></div><div class="tln" data-x="1.77">I 1.77× · +1 LEVEL</div>';
      $('crashSky').appendChild(tl); }
    tl.querySelectorAll('.tln').forEach(n=>n.classList.remove('lit','pop')); }
  crash.band=0; crash.fz=0; crash.lastP=0; $('crashStrobe').style.opacity=0;
  const cm0=$('crashMult'); cm0.style.transform=''; cm0.style.animationDuration='';
  { let cz=$('crashZone'); if(!cz){ cz=document.createElement('div'); cz.id='crashZone'; $('crashMult').parentNode.insertBefore(cz,$('crashMult').nextSibling); } cz.textContent='THE CASINO FLOOR'; }
  { let st=$('crashStars'); if(!st){ st=document.createElement('div'); st.id='crashStars';
      for(let i=0;i<26;i++){ const p=document.createElement('span'); p.className='cst';
        p.style.left=(Math.random()*100)+'%'; p.style.animationDelay=(Math.random()*2)+'s';
        p.style.opacity=0.25+Math.random()*0.6; p.style.width=p.style.height=(2+Math.random()*3)+'px';
        st.appendChild(p); }
      $('crashLayer').insertBefore(st,$('crashLayer').firstChild); }
    st.style.setProperty('--sd','2.4s'); }
  if(!$('crashBulbs')){
    const cb=document.createElement('div'); cb.id='crashBulbs';
    cb.innerHTML=Array.from({length:14},()=>'<span class="cb"></span>').join('');
    $('crashLayer').appendChild(cb);
    const cp2=document.createElement('div'); cp2.id='crashPing';
    cm0.parentNode.insertBefore(cp2,cm0);
  }
  { const shl=document.querySelector('#crashLayer .wheelShell'); if(shl) shl.style.transform=''; }
  { const ct=$('crashTimer'); if(ct) ct.remove(); }
  $('crashMult').textContent='1.00×'; $('crashMult').className='';
  $('crashStake').innerHTML='<span class="stk" data-x="1.77">I · +1 LEVEL</span><span class="stk" data-x="2.77">II · HOT LEVEL ◆◆</span><span class="stk" data-x="3.69">III · THE ARMORY</span><span class="stk" data-x="7.77">☆ ASCENSION + 2 FEASTS</span>';
  $('crashHist').innerHTML=crashHist.slice(-6).map(h=>'<span class="'+(h.ok?'ok':'no')+'">'+h.v.toFixed(2)+'×</span>').join('');
  $('crashMsg').innerHTML='THE HOUSE ASKS ONLY NERVE · <span class="keyhint">'+(window._touchUI?'◈ BET':'SPACE')+'</span> LAUNCHES · IT CLIMBS ALONE · CASH ON ANY RUNG · CRASH: <b style="color:#ff6b6b">THE FALL — A CURSE, 5-15s</b>';
  $('crashLayer').classList.remove('hidden'); SFX.vaultOpen(); startDrone();
}
// crash-point sampler pinned to the director's reach odds:
// J2: P(cp≥1.77)=82% · P(cp≥2.77)=58% · P(cp≥3.69)=35% · P(cp≥7.77)=12%
const CP_ANCH=[[1.01,1],[1.77,0.82],[2.77,0.58],[3.69,0.35],[7.77,0.12],[40,0.001]];
function rollCrashPoint(){
  const u=rng('ascent');
  for(let i=1;i<CP_ANCH.length;i++){ const a=CP_ANCH[i-1], b=CP_ANCH[i];
    if(u>=b[1]) return a[0]*Math.pow(b[0]/a[0],(a[1]-u)/(a[1]-b[1])); }
  return 40;
}
function launchCrash(){
  if(crash.live||crash.done) return;
  crash.wager=0; crash.loan=false;
  crash.cp = crash.rigCp || rollCrashPoint(); crash.rigCp=0; // J3's lesson can rig the ride
  if(crash.cp<1.01) crash.cp=1.01; crash.ct=0; crash._mt=-1; crash.msIdx=crash.msIdx||0;
  crash.live=true; crash.mult=1+0.12*(P.ascStart||0); $('crashMult').textContent=crash.mult.toFixed(2)+'\u00d7';
  noise(0.45,0.18,140); tone(70,0.5,'sawtooth',0.14,220);
  $('crashMsg').innerHTML='IT CLIMBS ON ITS OWN · <span class="keyhint">'+(window._touchUI?'◈ BET':'SPACE')+'</span> CASHES · CRASH = <b style="color:#ff6b6b">THE FALL</b>';
  SFX.riser();
}
const CR_MS=[1.77,2.77,3.69,5,7.77,10,15,20];
function tickCrash(dt){
  if(!crash.live) return;
  climbCrash(dt); if(!crash.live) return;
  // ladder rungs light per FRAME against the ROUNDED display value — if the
  // big number reads 2.77x, rung II is lit. (True-mult 2.768 shows 2.77x; the
  // old per-press check against raw mult left the rung dark. Diagnosed live.)
  { const md=+Math.min(crash.mult,crash.cp).toFixed(2);
    document.querySelectorAll('#tierLadder .tln').forEach(n=>{
      if(md>=+n.dataset.x && !n.classList.contains('lit')){
        n.classList.add('lit','pop');
        try{ gateFx(+n.dataset.x); }catch(e){ console.error('[ANTE ASCENT] gateFx',e); }
      }
    });
    document.querySelectorAll('#crashStake .stk[data-x]').forEach(n=>{
      if(md>=+n.dataset.x) n.classList.add('on');
    }); }
  crash.hb-=dt; if(crash.hb<=0){ crash.hb=0.5/Math.min(3,crash.mult); tone(58,0.12,'sine',0.14,44);
    if(crash.mult>=3) setTimeout(()=>tone(72,0.08,'sine',0.1,50),90); }
  const cs9=$('crashStrobe');
  cs9.style.opacity=(Math.floor(gt*(4+crash.mult))%2)?Math.min(0.85,0.42+crash.mult*0.04):0;
  if(crash.boostT && performance.now()<crash.boostT) cs9.style.opacity=0.95;
  { const hu='hue-rotate('+Math.round(Math.sin(gt*(1+crash.mult*0.7))*24/3)*3+'deg)';
    if(cs9._f!==hu){ cs9._f=hu; cs9.style.filter=hu; } }
  if(crash.mult>=2 && Math.random()<dt*7) tone(2100+Math.random()*(900+crash.mult*260),0.04,'sine',0.032);
  { const on9=Math.floor(gt*(4+crash.mult*1.8));
    document.querySelectorAll('#crashBulbs .cb').forEach((b,i)=>b.classList.toggle('on',(i+on9)%4===0)); }
}
function ascWinSlam(txt,sub,col){
  let w=$('ascWin'); if(!w){ w=document.createElement('div'); w.id='ascWin'; $('crashLayer').appendChild(w); }
  w.innerHTML='<div class="awT" style="color:'+col+'">'+txt+'</div>'+(sub?'<div class="awS">'+sub+'</div>':'');
  w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
}
function gateSlam(txt,col,hold){ const sl=$('crashSlam'); if(!sl) return;
  sl.textContent=txt; sl.style.color=col; sl.classList.add('tier');
  sl.classList.remove('go'); void sl.offsetWidth; sl.classList.add('go');
  crash.slamHold=performance.now()+(hold||1200); setTimeout(()=>sl.classList.remove('tier'),1500); }
function gatePing(col,sz){ const cp=$('crashPing'); if(!cp) return;
  cp.style.borderColor=col; cp.style.width=cp.style.height=sz+'px';
  cp.classList.remove('go'); void cp.offsetWidth; cp.classList.add('go'); }
function gateHold(ms){ $('crashLayer').classList.add('gatehold'); setTimeout(()=>$('crashLayer').classList.remove('gatehold'),ms); }
function gateBulbs(ms){ const cb=$('crashBulbs'); if(!cb) return; cb.classList.add('frenzy'); setTimeout(()=>cb.classList.remove('frenzy'),ms); }
function gateFx(x){
  const G=(ms,fn)=>setTimeout(()=>{ if(state!=='crash') return; fn(); },ms);
  if(x===1.77){
    gateSlam('TIER I — THE FLOOR FALLS AWAY','#8bffd0'); SFX.dingHit(2);
    flash(0.22,'#8bffd0'); shake=Math.min(18,shake+5); gatePing('#8bffd0',200);
    crash.boostT=performance.now()+180;
    G(130,()=>{ SFX.casinoDing(); flash(0.14,'#8bff9a'); });
  } else if(x===2.77){
    gateSlam('TIER II — THE CHANDELIERS BOW','#c98bff'); SFX.dingHit(3); SFX.chipStack();
    flash(0.3,'#c98bff'); shake=Math.min(20,shake+7); gatePing('#c98bff',240);
    crash.boostT=performance.now()+260; gateBulbs(700);
    const au=$('crashAurora'); if(au) au.style.opacity=0.45;
    G(120,()=>SFX.tingle());
    G(260,()=>{ SFX.casinoDing(); flash(0.18,'#c98bff'); gatePing('#c98bff',300); });
  } else if(x===3.69){
    gateSlam('TIER III — DEAD STARS APPLAUD','#ffd36b'); SFX.dingHit(4); SFX.record();
    flash(0.34,'#ffd36b'); shake=Math.min(22,shake+9); gatePing('#ffd36b',280);
    crash.boostT=performance.now()+380; gateHold(160); gateBulbs(1000);
    G(120,()=>{ SFX.tingle(); flash(0.2,'#c98bff'); });
    G(260,()=>{ SFX.hotSix(); gatePing('#fff2c0',340); coinRain(12); });
    G(420,()=>{ SFX.casinoDing(); flash(0.16,'#fff2c0'); domConfetti(12,'crashLayer'); });
  } else if(x===7.77){
    gateSlam('☆ THE HOUSE LOSES SIGHT OF YOU ☆','#fff2c0',1400); SFX.seraph(); SFX.record();
    flash(0.5,'#fff2c0'); shake=Math.min(26,shake+14); gatePing('#fff2c0',320);
    crash.boostT=performance.now()+1000; gateHold(240); gateBulbs(1800);
    G(140,()=>{ SFX.dingBells(); flash(0.3,'#ffd36b'); gatePing('#ffd36b',420); });
    G(300,()=>{ domConfetti(22,'crashLayer'); coinRain(22); SFX.dingHit(6); });
    G(480,()=>{ SFX.tingle(); flash(0.26,'#c98bff'); gatePing('#c98bff',500); });
    G(700,()=>{ SFX.hotSix(); flash(0.2,'#fff2c0'); gateHold(140); });
    G(950,()=>{ SFX.casinoDing(); const cz=$('crashZone'); if(cz){ cz.classList.remove('gatepop'); void cz.offsetWidth; cz.classList.add('gatepop'); } });
  }
}
/* ▲ J2 — THE ASCENT v3: it climbs on its own (1.77 at ~2.8s, 2.77 ~5.2s, 3.69 ~6.8s, 7.77 ~11s).
   SPACE or ENTER cashes. Every rung pays something real: a level, a hot level, THE ARMORY, an Ascension. */
function climbCrash(dt){
  if(!crash.live) return;
  const prev=crash.mult;
  crash.mult+=dt*(0.06+0.16*crash.mult);
  // 7.77 is the ceiling of heaven — touch it and the jackpot claims you
  if(crash.mult>=7.77 && crash.cp>=7.77){
    crash.mult=7.77; $('crashMult').textContent='7.77×';
    document.querySelectorAll('#tierLadder .tln, #crashStake .stk[data-x]').forEach(n=>{ if(+n.dataset.x<=7.77) n.classList.add(n.classList.contains('tln')?'lit':'on'); });
    cashCrash(); return;
  }
  const m9=Math.min(crash.mult, crash.cp);
  // the climb sings: a tick whose pitch and pace follow the multiplier
  crash.ct=(crash.ct||0)-dt;
  if(crash.ct<=0){ crash.ct=Math.max(0.07,0.32/Math.pow(m9,0.8));
    const bf=200*Math.pow(m9,0.85);
    tone(bf,0.06,'square',0.07); tone(bf*2.5,0.05,'sine',0.04);
    if(m9>=2) tone(bf*4,0.08,'sine',0.025); }
  const el=$('crashMult');
  const txt=m9.toFixed(2)+'×'; if(el.textContent!==txt) el.textContent=txt;
  const bc = m9<1.77?'#e8d9c0': m9<2.77?'#8bff9a': m9<3.69?'#6fe3ff': m9<7.77?'#c98bff':'#fff2c0';
  if(el._bc!==bc){ el._bc=bc; el.style.color=bc; const cp9=$('crashPing'); if(cp9) cp9.style.borderColor=bc; }
  el.className=m9>=1.12?'hot':'';
  el.style.fontWeight=m9>=5?'900':m9>=2.5?'800':'700'; el.style.letterSpacing=m9>=5?'-1px':'0';
  el.style.transform='scale('+(1.04+Math.sin(gt*(8+m9*3))*0.03*Math.min(3,m9))+')';
  $('crashMult').style.animationDuration=Math.max(0.16,0.5-m9*0.03)+'s';
  if(Math.floor(prev*20)!==Math.floor(m9*20)){ // a few times a second, not every frame
    $('crashLayer').style.filter='saturate('+(1+Math.min(1.6,(m9-1)*0.4)).toFixed(2)+') contrast('+(1+Math.min(0.34,m9*0.035)).toFixed(2)+')';
    const st9=$('crashStars'); if(st9){ st9.style.filter='hue-rotate('+Math.round(m9*42)+'deg) saturate(1.7)'; st9.style.setProperty('--sd',Math.max(0.35,2.4/(0.6+m9*0.45))+'s'); }
    const au9=$('crashAurora'); if(au9){ au9.style.opacity=Math.max(0,Math.min(0.9,(m9-1.15)/1.8)); au9.style.animationDuration=Math.max(1.1,6-m9*0.55)+'s'; }
    const shl=document.querySelector('#crashLayer .wheelShell');
    if(shl && m9>1.6){ const j=Math.min(6,m9*1.0); shl.style.transform='translate('+rnd(-j,j)+'px,'+rnd(-j,j)+'px)'; }
    const cz=$('crashZone'); if(cz){
      cz.textContent = m9<1.77?'LEAVING THE FLOOR': m9<2.77?'ABOVE THE CHANDELIERS': m9<3.69?'THROUGH THE VAULTED DARK': m9<7.77?'AMONG DEAD STARS':'THE HOUSE CANNOT SEE YOU';
      cz.style.color = m9<2.77?'#9adcff': m9<3.69?'#c98bff': m9<7.77?'#ffd36b':'#fff2c0'; }
    let eg=document.getElementById('ascEdge'); if(!eg){ eg=document.createElement('div'); eg.id='ascEdge'; $('crashLayer').appendChild(eg); }
    eg.classList.toggle('on', m9>=5);
  }
  $('crashRocket').style.bottom=Math.min(104, Math.log(m9)*46)+'px';
  { const nb=m9<1.77?0:m9<2.77?1:m9<3.69?2:m9<7.77?3:4;
    if(nb>crash.band){ crash.band=nb;
      noise(0.25,0.1,900+nb*500);
      [392,523,659].forEach((f9,i9)=>setTimeout(()=>tone(f9*Math.pow(1.25,nb),0.18,'triangle',0.1),i9*60));
      $('crashLayer').classList.add('bandflash'); setTimeout(()=>$('crashLayer').classList.remove('bandflash'),260); } }
  while(crash.msIdx<CR_MS.length && m9>=CR_MS[crash.msIdx]){
    SFX.casinoDing(); if(CR_MS[crash.msIdx]>=3) SFX.dingBells();
    flash(0.14,'#8bff9a'); sparkBurst(8);
    if(!(crash.slamHold&&performance.now()<crash.slamHold)){ const sl=$('crashSlam'); if(sl){ sl.textContent=CR_MS[crash.msIdx]+'×'; sl.style.color=bc;
        sl.classList.remove('go'); void sl.offsetWidth; sl.classList.add('go'); } }
    crash.msIdx++;
  }
  { const t=ascTier(m9);
    if(crash._mt!==t){ crash._mt=t;
      const sp='<span class="keyhint">'+(window._touchUI?'◈ BET':'SPACE')+'</span>';
      const PRZ=['NOTHING YET — TIER I AT 1.77×','+1 LEVEL','A HOT LEVEL ◆◆ + 25% BLOOD','THE ARMORY — PICK 1 OF 3 EPIC+','☆ ASCENSION + 2 FEAST LEVELS'];
      const NXT=['','HOT LEVEL AT 2.77×','THE ARMORY AT 3.69×','ASCENSION AT 7.77×',''];
      $('crashMsg').innerHTML='CASH NOW: <b style="color:'+(t?['','#8bff9a','#6fb7ff','#c98bff','#fff2c0'][t]:'#8a7a58')+'">'+PRZ[t]+'</b>'+(NXT[t]?' · NEXT: '+NXT[t]:'')+' · '+sp+' CASHES'; } }
  if(crash.mult>=crash.cp){
    crash.live=false; crash.done=true;
    el.textContent=crash.cp.toFixed(2)+'× — CRASHED'; el.className='dead'; el.style.transform='';
    $('crashRocket').className='dead'; $('crashStrobe').style.opacity=0;
    $('crashLayer').classList.add('rip'); setTimeout(()=>$('crashLayer').classList.remove('rip'),200);
    noise(0.5,0.3,320); tone(320,0.55,'sawtooth',0.22,80); tone(90,0.6,'sine',0.2,40);
    crashHist.push({v:crash.cp,ok:false}); RUN.crashPts.push(crash.cp);
    const fell=theFall();
    $('crashMsg').innerHTML='<b style="color:#ff6b6b">☄ THE FALL — '+fell+' ☄</b>';
    SFX.bust(); SFX.thud(); flash(0.5,'#8b1620'); shake=Math.min(22,shake+14);
    LT.crash=(LT.crash||0)+1; bump('crash',LT.crash);
    setTimeout(closeCrash, 1600);
  }
}
const ASC_TIERS=[['common',65,0],['rare',20,1.77],['epic',10,2.77],['mythic',5,3.69]];
const RAR_LABEL={common:'COMMON',uncommon:'UNCOMMON',rare:'RARE',epic:'ULTRA RARE',legendary:'LEGENDARY',mythic:'MYTHIC'};
function rollAscentPrize(m){
  const un=ASC_TIERS.filter(t=>m>=t[2]);
  let tot=un.reduce((a,t)=>a+t[1],0), r=rng('ascent')*tot, tier='common';
  for(const t of un){ r-=t[1]; if(r<=0){ tier=t[0]; break; } }
  let pool=PASSIVES.filter(p=>tier==='epic' ? (p.rar==='epic'||p.rar==='legendary') : tier==='common' ? (p.rar==='common'||p.rar==='uncommon') : p.rar===tier);
  if(tier==='mythic'){ pool=pool.filter(p=>!P.passiveList.find(x=>x.id===p.id)); if(!pool.length){ tier='epic'; pool=PASSIVES.filter(p=>p.rar==='epic'||p.rar==='legendary'); } }
  if(!pool.length) pool=PASSIVES.filter(p=>p.rar==='common'||p.rar==='uncommon');
  const pd=pool[(rng('ascent')*pool.length)|0];
  if(pd.sc) pd.sc(m); else pd.ap();
  if(pd.u) owned.add(pd.id);
  addPassiveHUD(pd); renderRelics();
  const lbl=RAR_LABEL[tier]||tier.toUpperCase();
  setTimeout(()=>{
    announce('✦ PRIZE — '+lbl+': '+pd.n+(pd.sc?' ×'+m.toFixed(1):'')+' ✦', true);
    if(tier==='mythic'){ bigWin('MYTHIC — '+pd.n,4); SFX.seraph(); SFX.dingBells(); flash(0.6,'#fff2c0'); coinRain(30); }
    else if(tier==='epic'){ SFX.hotSix(); SFX.dingBells(); flash(0.4,'#c98bff'); sparkBurstAt('crashMult','crashLayer',24); }
    else if(tier==='rare'){ SFX.dingBells(); flash(0.3,'#6fb7ff'); sparkBurstAt('crashMult','crashLayer',16); }
    else { SFX.casinoDing(); sparkBurstAt('crashMult','crashLayer',10); }
  }, 500);
}
function theFall(){
  const d=DEBUFF_POOL[(rng('ascent')*DEBUFF_POOL.length)|0];
  const dur=Math.round(5+rng('ascent')*10); // 5-15s, a different curse every fall
  const lbl=applyDebuff({label:d.label, dur:dur, dot:d.dot, ap:d.ap});
  flash(0.6,'#8b1620'); SFX.bust(); SFX.thud(); shake=Math.min(20,shake+10);
  setTimeout(()=>announce('☄ THE FALL — '+lbl+' ☄', false), 400);
  return lbl;
}
function ascTier(m){ return m>=7.77?4:m>=3.69?3:m>=2.77?2:m>=1.77?1:0; }
// J2: one card offer for both prizes — the 7.77 Ascension (mint) and tier III's ARMORY (violet)
function cardOffer({word, title, opts, color, tag, onPick, empty}){
  crash.jkOpts=opts; crash.jkPick=onPick; crash.jkCol=color; crash.jkTag=tag;
  if(!opts.length){ empty(); setTimeout(closeCrash,1600); return; }
  const lite=GFX.lite;
  startDrumroll();
  $('crashStrobe').style.opacity=1; $('crashStrobe').style.filter='hue-rotate(40deg) saturate(2)';
  flash(0.6,color); domConfetti(lite?14:30,'crashLayer'); SFX.seraph();
  let mq=$('jkMarq'); if(!mq){ mq=document.createElement('div'); mq.id='jkMarq'; $('crashLayer').appendChild(mq); }
  mq.innerHTML=word.split('').map((ch,i)=>'<span style="animation-delay:'+(i*0.12)+'s;color:'+color+'">'+ch+'</span>').join('');
  mq.className='go';
  word.split('').forEach((_,i)=>setTimeout(()=>{ if(state!=='crash') return;
    SFX.dingHit(1+Math.min(5,i)); if(i%2===0) flash(0.14,color); shake=Math.min(20,shake+2); }, 120+i*120));
  $('crashMsg').textContent='';
  setTimeout(()=>{ if(state!=='crash') return;
    stopDrumroll(); SFX.dingBells(); SFX.hotSix(); coinRain(lite?10:22);
    mq.classList.add('up');
    crash.jk=true;
    { const aw=$('ascWin'); if(aw) aw.classList.remove('go'); }
    let w9=$('jkWrap'); if(!w9){ w9=document.createElement('div'); w9.id='jkWrap'; $('crashLayer').appendChild(w9); }
    w9.style.setProperty('--jkc',color);
    w9.innerHTML='<div class="jkTitle" style="color:'+color+'">'+title+'</div><div class="jkRow">'+
      opts.map((o,i)=>'<div class="jkCard" data-i="'+i+'"><div class="jkKey">'+(i+1)+'</div>'
          +'<div class="jkG" style="color:'+(GLYPH_COL[o.def.id]||color)+'">'+o.def.g+'</div>'
          +'<div class="jkN">'+o.def.n+'</div>'
          +'<div class="jkR" style="color:'+(o.col||color)+'">'+o.tag+'</div>'
          +'<div class="jkD">'+o.desc+'</div></div>').join('')+'</div>';
    w9.classList.add('show');
    w9.querySelectorAll('.jkCard').forEach(c=>c.onclick=()=>pickJackpot(+c.dataset.i));
    crash.jkSel=0; crash.jkT=performance.now(); jkPaint();
    $('crashMsg').innerHTML='<span class="keyhint">◀</span> <span class="keyhint">▶</span> CHOOSE · <span class="keyhint">SPACE</span> TAKES · OR <span class="keyhint">1</span> <span class="keyhint">2</span> <span class="keyhint">3</span> · OR CLICK';
  }, 120+word.length*120+200);
}
// a level paid by the Ascent: the counter climbs now, the reels wait for the ride to close (at the given feed tier)
function ascLevel(ft){ P.level++; P.xpNext=Math.floor(20+P.level*7+P.level*P.level*1.3); if(P.xp>=P.xpNext) P.xp=P.xpNext-1;
  pending.push({ft:ft||0}); bump('level',P.level); recCheck('level',P.level,'Level'); }
function pick3(pool){ const out=[]; pool=pool.slice(); for(let i=0;i<3&&pool.length;i++){ const k=(rng('ascent')*pool.length)|0; out.push(pool[k]); pool.splice(k,1); } return out; }
function jackpotOffer(){
  try{ SFX.ascMotif(); }catch(e){}
  secret('icarus','ICARUS ASCENDANT');
  // the summit also feeds the machine: two levels at FEAST odds wait when the ride closes
  ascLevel(3); ascLevel(3);
  let pool=PASSIVES.filter(p=>p.rar==='ascend' && skillLevel(p.id)===0);
  if(pool.length<3){ const up=PASSIVES.filter(p=>p.rar==='ascend' && skillLevel(p.id)>0 && skillLevel(p.id)<p.max && pool.indexOf(p)<0); pool=pool.concat(up); }
  const opts=pick3(pool).map(w=>{ const lv=skillLevel(w.id); return {def:w, kind:'s', tag:'ASCENSION'+(lv>0?' · Lv '+lv+' → '+(lv+1):' · NEW'), desc:w.fx}; });
  cardOffer({word:'JACKPOT', title:'☆ CHOOSE YOUR ASCENSION · 2 FEASTS FOLLOW ☆', opts, color:'#8bffd0', tag:'ASCENSION',
    onPick:o=>{ grantSkill(o.def,1); return '☆ ASCENSION — '+o.def.n+' IS YOURS ☆'; },
    empty:()=>{ P.coins+=500; LT.coins+=500; announce('◈ ALL ASCENSIONS HELD — 500 COINS + 2 FEAST LEVELS ◈',true); }});
}
// THE ARMORY (tier III): epic & legendary only — weapons and skills, new at Lv1 or +1 level
function armoryOffer(){
  const ws=availableWeapons().filter(w=>w.rar==='epic'||w.rar==='legendary').map(w=>{ const lv=P.wlv[w.id]||0; return {def:w, kind:'w', col:RARC[w.rar], tag:'⚔ '+(w.rar==='legendary'?'LEGENDARY':'EPIC')+' WEAPON'+(lv>0?' · Lv '+lv+' → '+(lv+1):' · NEW'), desc:(typeof w.d==='function'?w.d(lv+1):'')}; });
  const ss=availableSkills().filter(p=>p.rar==='epic'||p.rar==='legendary').map(p=>{ const lv=skillLevel(p.id); return {def:p, kind:'s', col:RARC[p.rar], tag:'✦ '+(p.rar==='legendary'?'LEGENDARY':'EPIC')+(lv>0?' · Lv '+lv+' → '+(lv+1):' · NEW'), desc:(typeof p.d==='function'?p.d(lv+1):p.fx||'')}; });
  // weapons first where the armory holds them — then skills fill the rack
  let opts=pick3(ws).slice(0,ws.length>=2?2:ws.length); opts=opts.concat(pick3(ss.filter(x=>!opts.includes(x))).slice(0,3-opts.length));
  cardOffer({word:'ARMORY', title:'⚔ THE ARMORY — EPIC & LEGENDARY · CHOOSE ⚔', opts, color:'#c98bff', tag:'ARMORY',
    onPick:o=>{ if(o.kind==='w') grantWeaponLevels(o.def,1); else grantSkill(o.def,1); setTimeout(()=>secret('armorer','THE ARMORER'),1600); return '⚔ THE ARMORY — '+o.def.n+' IS YOURS ⚔'; },
    empty:()=>{ ascLevel(3); announce('⚔ THE ARMORY IS BARE — A FEAST LEVEL INSTEAD ⚔',true); }});
}
function jkPaint(){ const w9=$('jkWrap'); if(!w9||!crash) return; w9.querySelectorAll('.jkCard').forEach((c,i)=>c.classList.toggle('b4sel', i===(crash.jkSel||0))); }
function pickJackpot(i){
  if(!crash.jk) return; const o=crash.jkOpts[i]; if(!o) return;
  crash.jk=false;
  const lite=GFX.lite, col=crash.jkCol||'#8bffd0', def=o.def;
  const line=crash.jkPick(o);
  const w9=$('jkWrap'); if(w9){ const cd=w9.querySelectorAll('.jkCard')[i]; if(cd) cd.classList.add('take'); setTimeout(()=>{ w9.classList.remove('show'); w9.innerHTML=''; },600); }
  { const mq=$('jkMarq'); if(mq) mq.className=''; }
  let gd=$('ascGift');
  if(!gd){ gd=document.createElement('div'); gd.id='ascGift'; $('crashLayer').appendChild(gd); }
  gd.innerHTML='<div class="agG" style="color:'+(GLYPH_COL[def.id]||col)+';text-shadow:0 0 30px currentColor">'+def.g+'</div><div class="agN">'+def.n+'</div><div class="agT" style="color:'+col+'">✦ '+o.tag+'</div>';
  gd.classList.remove('go'); void gd.offsetWidth; gd.classList.add('go');
  announce(line, col);
  SFX.rarSting(4); SFX.cashout(); setTimeout(()=>SFX.seraph(),180); SFX.casinoDing();
  gatePing(col,520); flash(0.5,col); shake=Math.min(24,shake+10);
  coinRain(lite?16:40); domConfetti(lite?20:50,'crashLayer'); sparkBurstAt('crashMult','crashLayer',lite?14:26);
  setTimeout(closeCrash, 2100);
}
function cashCrash(){
  if(!crash.live) return;
  crash.live=false; crash.done=true;
  const m=Math.min(crash.mult,crash.cp);
  try{ RUN.ascBest=Math.max(RUN.ascBest||0,m); if(ascTier(m)>=3) RUN.armory=(RUN.armory||0)+1; }catch(e){}
  crashHist.push({v:m,ok:true}); RUN.crashPts.push(crash.cp);
  const t=ascTier(m);
  const rk=$('crashRocket'); rk.classList.add('blast');
  $('crashStrobe').style.opacity=0.95; $('crashStrobe').style.filter='hue-rotate(40deg) saturate(1.5)';
  $('crashMult').className='hot';
  [784,988,1175,1568,1976,2637].forEach((f,i)=>setTimeout(()=>{ tone(f,0.22,'sine',0.13); tone(f/2,0.22,'triangle',0.07); },i*65));
  SFX.cashout(); setTimeout(()=>SFX.dingBells(),200); domConfetti(16+Math.min(3,t)*8,'crashLayer'); flash(0.45,t>=4?'#fff2c0':'#8bff9a'); shake=Math.min(20,shake+8+Math.min(3,t)*3);
  LT.crash=(LT.crash||0)+1; bump('crash',LT.crash);
  if(t>=4){ jackpotOffer(); return; }
  if(t===0){
    $('crashMsg').textContent='CASHED AT '+m.toFixed(2)+'× — BELOW THE FIRST RUNG. NOTHING.';
    tone(220,0.3,'sawtooth',0.1,120); SFX.thud();
    setTimeout(closeCrash, 1400); return; }
  $('crashMsg').textContent='CASHED AT '+m.toFixed(2)+'×';
  if(t===3){ const g=Math.round(60*m); P.coins+=g; LT.coins+=g;
    ascWinSlam('THE ARMORY','TIER III — PICK 1 OF 3 · +'+g+' COINS','#c98bff'); coinRain(16); SFX.record();
    announce('⚔ CASHED AT '+m.toFixed(2)+'× — THE ARMORY OPENS · +'+g+' COINS ⚔',true);
    setTimeout(()=>{ if(state==='crash') armoryOffer(); }, 900); return; }
  if(t===2){ ascLevel(2); const h=Math.round(P.maxHp*0.25); if(!P.martyr){ P.hp=Math.min(P.maxHp,P.hp+h); }
    ascWinSlam('A HOT LEVEL ◆◆','TIER II — RICHER REELS'+(P.martyr?'':' · +'+h+' BLOOD'),'#6fb7ff');
    announce('◆◆ CASHED AT '+m.toFixed(2)+'× — A HOT LEVEL'+(P.martyr?'':' + 25% BLOOD')+' ◆◆',true); SFX.levelUp(); }
  else { ascLevel(1); const g=Math.round(40*m); P.coins+=g; LT.coins+=g; coinRain(14);
    ascWinSlam('+1 LEVEL','TIER I — WARM REELS ◆ · +'+g+' COINS','#8bff9a');
    announce('◆ CASHED AT '+m.toFixed(2)+'× — +1 LEVEL · +'+g+' COINS ◆',true); SFX.levelUp();
    try{ flyGlyphs('crashMult','coinCount','◈',6,'#ffd36b'); }catch(e){} }
  setTimeout(closeCrash, 2100);
}
function closeCrash(){ crash.jk=false; { const w9=$('jkWrap'); if(w9){ w9.classList.remove('show'); w9.innerHTML=''; } } $('crashLayer').classList.add('hidden'); $('crashLayer').style.filter=''; stopDrone(); if(state==='crash'){ state='playing'; while(P.xp>=P.xpNext){ P.xp-=P.xpNext; P.level++; P.xpNext=Math.floor(20+P.level*7+P.level*P.level*1.3); pending.push({}); bump('level',P.level); recCheck('level',P.level,'Level'); SFX.levelUp(); }
  if(pending.length) setTimeout(()=>{ if(state==='playing' && pending.length) openNextSlot(); },450); } }
(function(){ const wrap=f=>function(...a){ try{ return f.apply(this,a); }catch(e){ if(!window._ascErr){ window._ascErr=1; console.error('[ANTE ASCENT]',e); } } };
  openCrash=wrap(openCrash); launchCrash=wrap(launchCrash); cashCrash=wrap(cashCrash); closeCrash=wrap(closeCrash);
})();
function tickCrashTok(dt){
  if(houseActive) return;
  if(!crashTok){ crashTokT-=dt;
    if(crashTokT<=0){ crashTokT=55+rng('ascent')*20-10; // pity window: 45-65s (J1: the Ascent comes by token and wheel only)
      const a=rng('ascent')*6.283, d=300+rng('ascent')*300;
      crashTok={x:clamp(P.x+Math.cos(a)*d,60,CFG.arena-60), y:clamp(P.y+Math.sin(a)*d,60,CFG.arena-60), t:20, ph:rng('ascent')*6.28};
      announce('▲ THE ASCENT BECKONS ▲', true); SFX.dingBells();
      coachMark('ascent','the GREEN GATE — it climbs alone · SPACE cashes · higher is richer');
      [988,1318,1760].forEach((f,i)=>setTimeout(()=>tone(f,0.14,'sine',0.08),i*110)); // come-play beckon
      ring(crashTok.x,crashTok.y,90,'#8bffd0'); ring(crashTok.x,crashTok.y,54,'#fff2c0'); }
  } else {
    crashTok.t-=dt; crashTok._p=(crashTok._p||0)-dt; if(crashTok._p<=0){ crashTok._p=6; tone(1318,0.09,'sine',0.05); ring(crashTok.x,crashTok.y,52,'#8bff9a'); }
    if(crashTok.t<=0){ crashTok=null; return; }
    if(Math.hypot(P.x-crashTok.x,P.y-crashTok.y)<P.radius+16){
      if(P.hp<P.maxHp*0.2){ crashTok._d=(crashTok._d||0)-dt;
        if(crashTok._d<=0){ crashTok._d=2; showStreak('☨ SEALED — TOO BLED TO ASCEND ☨'); SFX.thud(); flash(0.25,'#8b1620'); }
        return; }
      crashTok=null; openCrash(); }
  }
}
function drawCrashTok(){
  if(!crashTok) return; const w=crashTok, fl=w.t<4?(Math.floor(gt*8)%2?0.4:1):1;
  if(w.blessed && state==='playing'){
    const nd=Math.hypot(w.x-P.x,w.y-P.y);
    if(nd>140){ const aa=Math.atan2(w.y-P.y,w.x-P.x), orb=58+Math.sin(gt*6)*10;
      ctx.save(); ctx.translate(P.x+Math.cos(aa)*orb,P.y+Math.sin(aa)*orb); ctx.rotate(aa);
      ctx.globalAlpha=0.75+Math.sin(gt*6)*0.2; ctx.shadowColor='#ffd36b'; ctx.shadowBlur=18; ctx.fillStyle='#ffd36b';
      ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-9,-12); ctx.lineTo(-3,0); ctx.lineTo(-9,12); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha=1; }
    if(Math.random()<0.2) parts.push({x:w.x+rnd(-16,16),y:w.y+rnd(-14,10),vx:0,vy:-rnd(30,70),life:0.6,col:'#fff2c0',r:1.8});
  }
  ctx.save(); ctx.translate(w.x,w.y+Math.sin(gt*2.6+w.ph)*3); ctx.globalAlpha=fl;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g2=ctx.createRadialGradient(0,0,0,0,0,34); g2.addColorStop(0,'rgba(139,255,154,0.45)'); g2.addColorStop(1,'rgba(139,255,154,0)');
  ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(0,0,34,0,6.28); ctx.fill(); ctx.restore();
  const rise=((gt*1.4+w.ph)%1);
  ctx.fillStyle='#8bff9a'; ctx.shadowColor='#8bff9a'; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.moveTo(0,-14+rise*-4); ctx.lineTo(-9,4-rise*4); ctx.lineTo(-3,2-rise*4); ctx.lineTo(-3,12); ctx.lineTo(3,12); ctx.lineTo(3,2-rise*4); ctx.lineTo(9,4-rise*4); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
  ctx.restore(); ctx.globalAlpha=1;
}
