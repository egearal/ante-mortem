"use strict";
let crashTok=null, crashTokT=38;
let crashHist=[]; let ascTime=5; let ascPend=0;
let crash={on:false, mult:1, cp:2, stakePct:2, wager:0, live:false, done:false, tick:0};
function startOvercharge(){
  if(P.ovT>0) return;
  P.ovT=100; P.ovAge=0; P.ovHold=0; P._ovR=P.fireRate; P._ovD=P.damage;
  P.fireRate*=1.5; P.damage*=1.5;
  announce('⚡ RAGE — HOLD ABOVE 90 FOR 10s → THE ASCENT ⚡', true);
  SFX.riser(); SFX.hotSix(); flash(0.4,'#ff9a3c'); shake=Math.min(14,shake+6);
}
function ovRevert(){
  if(P._ovR!==undefined){ P.fireRate=P._ovR; P._ovR=undefined; }
  if(P._ovD!==undefined){ P.damage=P._ovD; P._ovD=undefined; }
  P.ovT=0;
}
function cashRage(){
  const bar=P.ovT, held=P.ovAge; ovRevert();
  if(bar>=90){
    if(held>=8){ ovBonusNext=true; SFX.seraph(); flash(0.5,'#ffd36b'); }
    SFX.dingBells(); SFX.cashout(); sparkBurst(22);
    announce(held>=8?'⚡ OVERCHARGED CASH-OUT — BONUS LEVEL ⚡':'⚡ CASHED AT '+Math.round(bar)+'% ⚡', true);
  } else {
    const kept=Math.floor(P.coins*bar/100), lost=P.coins-kept;
    P.coins=kept;
    announce('☠ THE HOUSE TAKES '+lost+' COINS — CASHED AT '+Math.round(bar)+'% ☠', false);
    SFX.bust(); SFX.chipStack(); flash(0.45,'#8b1620'); shake=Math.min(16,shake+8);
  }
  P._ovPass=true; gainXP(0);
}
function rageAscend(){
  ovRevert(); ovBonusNext=true; ascTime=Math.min(10,ascTime+2.5); ascPend=10;
  announce('⚡ THE ASCENT WILL MANIFEST IN 10 SECONDS ⚡', true);
  SFX.seraph(); SFX.dingBells(); flash(0.5,'#8bff9a'); sparkBurst(26);
  P._ovPass=true; gainXP(0);
}
function spawnAscentGate(){
  const a=Math.random()*6.283, d=260+Math.random()*220;
  crashTok={x:clamp(P.x+Math.cos(a)*d,60,CFG.arena-60), y:clamp(P.y+Math.sin(a)*d,60,CFG.arena-60), t:30, ph:Math.random()*6.28, blessed:true};
  announce('▲ THE ASCENT HAS MANIFESTED — SEEK THE GATE ▲', true);
  SFX.dingBells(); SFX.casinoDing(); ring(crashTok.x,crashTok.y,120,'#8bff9a'); ring(crashTok.x,crashTok.y,70,'#fff2c0');
}
function rageDrop(){
  ovRevert();
  const swept=coins.length; for(const c5 of coins) burst(c5.x,c5.y,1,'#5a4a3a'); coins.length=0;
  P.xp=Math.floor(P.xp*0.5); if(P.xp>=P.xpNext) P.xp=P.xpNext-1;
  announce('☠ THE BAR SLIPS — HALF YOUR XP FORFEIT · THE FLOOR IS SWEPT ☠', false);
  SFX.bossRoar(); SFX.bust(); noise(0.5,0.25,420); flash(0.55,'#8b1620'); shake=Math.min(24,shake+14);
  if(swept>0) ftext(P.x,P.y-26,'−'+swept+' COINS SWEPT','#ff6b6b',true);
}
const CR_PCTS=[0.25,0.5,1.0], CR_LBL=['25%','50%','ALL'];
function crashStakeUI(){ $('crashStake').innerHTML=CR_PCTS.map((p,i)=>'<span class="stk'+(i===crash.stakePct?' on':'')+'" data-i="'+i+'" style="cursor:pointer">'+(i+1)+' — '+CR_LBL[i]+' XP</span>').join('');
  $('crashStake').querySelectorAll('.stk').forEach(el=>el.onclick=()=>{ if(!crash.live&&!crash.done){ crash.stakePct=+el.dataset.i; crashStakeUI(); SFX.uiDing(); } }); }
function openCrash(){
  state='crash'; crash={on:true, mult:1, cp:0, wager:0, live:false, done:false, next:0.25, msIdx:0, hb:0};
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
  ['crashSlam','crashGhost','crashFrenzy'].forEach(id=>{ let d=$(id);
    if(!d){ d=document.createElement('div'); d.id=id; $('crashMult').parentNode.insertBefore(d, id==='crashGhost'?$('crashMult'):$('crashMult').nextSibling); }
    d.className=''; d.textContent=''; });
  { let tl=$('tierLadder'); if(!tl){ tl=document.createElement('div'); tl.id='tierLadder';
      tl.innerHTML='<div class="tln" data-x="7.77" style="color:#6a5a30">☆ 7.77×</div><div class="tlbar"></div><div class="tln" data-x="3.69">III · 3.69×</div><div class="tlbar"></div><div class="tln" data-x="2.77">II · 2.77×</div><div class="tlbar"></div><div class="tln" data-x="1.77">I · 1.77×</div>';
      $('crashSky').appendChild(tl); }
    tl.querySelectorAll('.tln').forEach(n=>{ if(n.dataset.x!=='1') n.classList.remove('lit','pop'); }); }
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
  prerollAsc();
  $('crashStake').innerHTML='<span class="stk on">I at 1.77×: '+przLabel(1)+'</span><span class="stk">II at 2.77×: '+przLabel(2)+'</span><span class="stk">III at 3.69×: '+przLabel(3)+'</span><span class="stk" style="color:#fff2c0;border-color:#fff2c0">7.77× JACKPOT: PICK OF 3 WEAPONS</span>';
  $('crashHist').innerHTML=crashHist.slice(-6).map(h=>'<span class="'+(h.ok?'ok':'no')+'">'+h.v.toFixed(2)+'×</span>').join('');
  $('crashMsg').innerHTML='THE HOUSE ASKS NOTHING — ONLY NERVE · WIN: A <b style="color:#8bffd0">PASSIVE</b> (II AT 2×, III AT 3×) · CRASH: <b style="color:#ff6b6b">THE FALL — 30s CURSE</b> · <span class="keyhint">SPACE</span> PUSH';
  $('crashLayer').classList.remove('hidden'); SFX.vaultOpen(); startDrone();
}
function launchCrash(){
  if(crash.live||crash.done) return;
  crash.wager=0; crash.loan=false;
  const r=Math.random();
  crash.cp = r<0.05 ? 1+Math.random()*0.03 : Math.min(40, 0.99/(1-Math.random()*0.99));
  if(crash.cp<1.01) crash.cp=1.01;
  crash.live=true; crash.mult=1;
  noise(0.45,0.18,140); tone(70,0.5,'sawtooth',0.14,220);
  $('crashMsg').innerHTML='CLIMB FOR HIGHER TIERS · CRASH = <b style="color:#ff6b6b">THE FALL</b> · <span class="keyhint">ENTER</span> CASH';
  SFX.riser();
}
const CR_MS=[1.77,2.77,3.69,5,7.77,10,15,20];
function tickCrash(dt){
  if(!crash.live) return;
  { const fr=$('crashFrenzy'); if(fr && performance.now()-crash.lastP>520) fr.classList.remove('on'); }
  crash.hb-=dt; if(crash.hb<=0){ crash.hb=0.5/Math.min(3,crash.mult); tone(58,0.12,'sine',0.14,44);
    if(crash.mult>=3) setTimeout(()=>tone(72,0.08,'sine',0.1,50),90); }
  const cs9=$('crashStrobe');
  cs9.style.opacity=(Math.floor(gt*(4+crash.mult))%2)?Math.min(0.85,0.3+crash.mult*0.04):0;
  if(crash.boostT && performance.now()<crash.boostT) cs9.style.opacity=0.95;
  { const hu='hue-rotate('+Math.round(Math.sin(gt*(1+crash.mult*0.7))*24/3)*3+'deg)';
    if(cs9._f!==hu){ cs9._f=hu; cs9.style.filter=hu; } }
  if(crash.mult>=2 && Math.random()<dt*7) tone(2100+Math.random()*(900+crash.mult*260),0.04,'sine',0.032);
  { const on9=Math.floor(gt*(3+crash.mult*1.4));
    document.querySelectorAll('#crashBulbs .cb').forEach((b,i)=>b.classList.toggle('on',(i+on9)%4===0)); }
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
function pushCrash(){
  if(!crash.live) return;
  const inc=(0.01+Math.random()*0.19)*(1+crash.mult*0.08);
  crash.mult+=inc;
  const big=inc>(0.13*(1+crash.mult*0.08));
  { const bf=200*Math.pow(crash.mult,0.85);
    tone(bf,0.06,'square',0.09+Math.min(0.08,inc*0.5));
    tone(bf*2.5,0.05,'sine',0.05); tone(bf*2.53,0.05,'sine',0.035);
    tone(bf*4,0.14,'sine',0.03); }
  if(Math.random()<0.5) tone(1800+Math.random()*900,0.05,'sine',0.045);
  { const nn=Math.min(5,1+Math.floor(crash.mult));
    for(let ti=0;ti<nn;ti++) setTimeout(()=>tone(1200*Math.pow(1.12,ti)*Math.pow(crash.mult,0.35),0.05,'sine',0.05),ti*28); }
  tone(50+crash.mult*4,0.09,'sine',0.1+Math.min(0.12,crash.mult*0.02));
  { const cp3=$('crashPing'); if(cp3){ cp3.style.width=cp3.style.height=(120+crash.mult*26)+'px';
      cp3.classList.remove('go'); void cp3.offsetWidth; cp3.classList.add('go'); } }
  { const shl=document.querySelector('#crashLayer .wheelShell');
    if(shl && crash.mult>1.6){ const j=Math.min(7,crash.mult*1.2);
      shl.style.transform='translate('+rnd(-j,j)+'px,'+rnd(-j,j)+'px)';
      setTimeout(()=>{ if(shl) shl.style.transform=''; },70); } }
  $('crashMult').style.animationDuration=Math.max(0.16,0.5-crash.mult*0.03)+'s';
  const el=$('crashMult');
  { const m9=crash.mult;
    const bc = m9<1.77?'#e8d9c0': m9<2.77?'#8bff9a': m9<3.69?'#6fe3ff': m9<7.77?'#c98bff':'#fff2c0';
    el.style.color=bc;
    if(m9>=1.3) el.className='hot';
    $('crashLayer').style.filter='saturate('+(1+Math.min(1.3,(m9-1)*0.24)).toFixed(2)+') contrast('+(1+Math.min(0.28,m9*0.035)).toFixed(2)+')';
    const st9=$('crashStars'); if(st9) st9.style.filter='hue-rotate('+Math.round(m9*42)+'deg) saturate(1.7)';
    const cp9=$('crashPing'); if(cp9) cp9.style.borderColor=bc;
    const au9=$('crashAurora'); if(au9){ au9.style.opacity=Math.max(0,Math.min(0.9,(m9-2.5)/2.5)); au9.style.animationDuration=Math.max(1.1,6-m9*0.55)+'s'; }
    if(m9>=3 && cp9){ setTimeout(()=>{ if(crash.live){ cp9.style.width=cp9.style.height=(180+m9*30)+'px'; cp9.classList.remove('go'); void cp9.offsetWidth; cp9.classList.add('go'); } },110); }
    const nb=m9<1.77?0:m9<2.77?1:m9<3.69?2:m9<7.77?3:4;
    if(nb>crash.band){ crash.band=nb;
      noise(0.25,0.1,900+nb*500);
      [392,523,659].forEach((f9,i9)=>setTimeout(()=>tone(f9*Math.pow(1.25,nb),0.18,'triangle',0.1),i9*60));
      $('crashLayer').classList.add('bandflash'); setTimeout(()=>$('crashLayer').classList.remove('bandflash'),260);
    }
    document.querySelectorAll('#tierLadder .tln').forEach(n=>{
      const x=+n.dataset.x;
      if(x>1 && m9>=x && !n.classList.contains('lit')){ n.classList.add('lit','pop'); gateFx(x); }
    });
  }
  noise(0.06,0.03,1600+crash.mult*260);
  { const st=$('crashStars'); if(st) st.style.setProperty('--sd',Math.max(0.35,2.4/(0.6+crash.mult*0.45))+'s'); }
  { const cz=$('crashZone'); if(cz){ const m=crash.mult;
      cz.textContent = m<1.77?'LEAVING THE FLOOR': m<2.77?'ABOVE THE CHANDELIERS': m<3.69?'THROUGH THE VAULTED DARK': m<7.77?'AMONG DEAD STARS':'THE HOUSE CANNOT SEE YOU';
      cz.style.color = m<2.77?'#9adcff': m<3.69?'#c98bff': m<7.77?'#ffd36b':'#fff2c0'; } }
  if(big){ SFX.uiDing(); flash(0.1,'#8bff9a'); sparkBurst(6); }
  while(crash.msIdx<CR_MS.length && crash.mult>=CR_MS[crash.msIdx]){
    SFX.casinoDing(); if(CR_MS[crash.msIdx]>=3) SFX.dingBells();
    flash(0.18,'#8bff9a'); sparkBurst(12);
    if(!(crash.slamHold&&performance.now()<crash.slamHold)){ const sl=$('crashSlam'); if(sl){ sl.textContent=CR_MS[crash.msIdx]+'×';
        const m8=crash.mult; sl.style.color=m8<1.77?'#e8d9c0':m8<2.77?'#8bff9a':m8<3.69?'#6fe3ff':m8<7.77?'#c98bff':'#fff2c0';
        sl.classList.remove('go'); void sl.offsetWidth; sl.classList.add('go'); } }
    crash.msIdx++;
  }
  { const gh=$('crashGhost'); if(gh){ gh.textContent=el.textContent; gh.style.color=el.style.color||'#e8d9c0';
      gh.classList.remove('go'); void gh.offsetWidth; gh.classList.add('go'); } }
  { const nw=performance.now();
    crash.fz=(nw-crash.lastP<280)?(crash.fz+1):1; crash.lastP=nw;
    const fr=$('crashFrenzy');
    if(fr){ if(crash.fz>=4){ fr.textContent='×'+crash.fz+' FRENZY'; fr.classList.add('on');
        tone(900+crash.fz*70,0.05,'square',0.06); }
      else fr.classList.remove('on'); } }
  el.textContent=crash.mult.toFixed(2)+'×';
  el.className=crash.mult>=2?'hot':'';
  el.style.transform='scale('+(1+Math.min(0.5,0.1+inc*2.2))+')';
  setTimeout(()=>{ if(crash.live) el.style.transform='scale(1.05)'; },80);
  $('crashRocket').style.bottom=Math.min(104, Math.log(crash.mult)*46)+'px';
  { const t=ascTier(crash.mult);
    if(t>=4){ $('crashMsg').innerHTML='CASH: <b style="color:#fff2c0">☆ JACKPOT — CHOOSE OF 3 WEAPONS ☆</b> · <span class="keyhint">ENTER</span>'; }
    else if(t===0){ $('crashMsg').innerHTML='CASH: <b style="color:#8a7a58">NOTHING — TIER I AT 1.77×</b> · <span class="keyhint">ENTER</span>'; }
    else { const gates=[1.77,2.77,3.69,7.77];
      $('crashMsg').innerHTML='CASH: <b style="color:#8bffd0">'+przLabel(t)+'</b> · AT '+gates[t]+'×: '+(t<3?przLabel(t+1):'<b style="color:#fff2c0">JACKPOT</b>')+' · <span class="keyhint">ENTER</span>'; } }
  if(crash.mult>=crash.cp){
    crash.live=false; crash.done=true;
    el.textContent=crash.cp.toFixed(2)+'× — CRASHED'; el.className='dead'; el.style.transform='';
    $('crashRocket').className='dead'; $('crashStrobe').style.opacity=0;
    $('crashLayer').classList.add('rip'); setTimeout(()=>$('crashLayer').classList.remove('rip'),200);
    noise(0.5,0.3,320); tone(320,0.55,'sawtooth',0.22,80); tone(90,0.6,'sine',0.2,40);
    crashHist.push({v:crash.cp,ok:false});
    theFall();
    $('crashMsg').innerHTML='<b style="color:#ff6b6b">☄ THE FALL — CURSED FOR 30 SECONDS ☄</b>';
    SFX.bust(); SFX.thud(); flash(0.5,'#8b1620'); shake=Math.min(22,shake+14);
    LT.crash=(LT.crash||0)+1; bump('crash',LT.crash);
    setTimeout(closeCrash, 1600);
  }
}
const ASC_TIERS=[['common',65,0],['rare',20,1.77],['epic',10,2.77],['mythic',5,3.69]];
const RAR_LABEL={common:'COMMON',rare:'RARE',epic:'ULTRA RARE',legendary:'ULTRA RARE',mythic:'MYTHIC'};
function rollAscentPrize(m){
  const un=ASC_TIERS.filter(t=>m>=t[2]);
  let tot=un.reduce((a,t)=>a+t[1],0), r=Math.random()*tot, tier='common';
  for(const t of un){ r-=t[1]; if(r<=0){ tier=t[0]; break; } }
  let pool=PASSIVES.filter(p=>tier==='epic' ? (p.rar==='epic'||p.rar==='legendary') : p.rar===tier);
  if(tier==='mythic'){ pool=pool.filter(p=>!P.passiveList.find(x=>x.id===p.id)); if(!pool.length){ tier='epic'; pool=PASSIVES.filter(p=>p.rar==='epic'||p.rar==='legendary'); } }
  if(!pool.length) pool=PASSIVES.filter(p=>p.rar==='common');
  const pd=pool[(Math.random()*pool.length)|0];
  if(pd.sc) pd.sc(m); else pd.ap();
  addPassiveHUD(pd); renderRelics();
  const lbl=RAR_LABEL[tier]||tier.toUpperCase();
  setTimeout(()=>{
    announce('✦ PRIZE — '+lbl+': '+pd.n+(pd.sc?' ×'+m.toFixed(1):'')+' ✦', true);
    if(tier==='mythic'){ bigWin('MYTHIC — '+pd.n,4); SFX.seraph(); SFX.dingBells(); flash(0.6,'#fff2c0'); coinRain(30); }
    else if(tier==='epic'){ SFX.hotSix(); SFX.dingBells(); flash(0.4,'#c98bff'); sparkBurst(24); }
    else if(tier==='rare'){ SFX.dingBells(); flash(0.3,'#6fb7ff'); sparkBurst(16); }
    else { SFX.casinoDing(); sparkBurst(10); }
  }, 500);
}
function theFall(){
  P.damage*=0.82; P.speed*=0.85;
  debuffs.push({label:'☄ THE FALL −18% DMG −15% SPD', t:30, dur:30, dot:0.6, poison:true,
    revert:()=>{ P.damage/=0.82; P.speed/=0.85; }});
  flash(0.6,'#8b1620'); SFX.bust(); SFX.thud(); shake=Math.min(20,shake+10);
  setTimeout(()=>announce('☄ THE FALL — THE HOUSE CURSES YOUR DESCENT ☄', false), 400);
}
function ascTier(m){ return m>=7.77?4:m>=3.69?3:m>=2.77?2:m>=1.77?1:0; }
const ASC_POOLS=[null,['a_iron','a_eye','a_wind','a_gild','a_hand','a_skin'],['a_fang','a_storm','a_greed','a_fuse','a_holl','a_veil','a_swrm'],['a_crown','a_void','a_king','a_reap','a_engn','a_mirr']];
function prerollAsc(){
  crash.prz={};
  for(let t=1;t<=3;t++){
    const pool=PASSIVES.filter(p=>ASC_POOLS[t].includes(p.id) && !P.passiveList.find(x=>x.id===p.id));
    crash.prz[t]=pool.length?pool[(Math.random()*pool.length)|0]:null;
  }
}
function przLabel(t){ const p=crash.prz&&crash.prz[t]; return p?(p.n+' ('+p.fx+')'):'+'+(60*t)+' COINS'; }
function grantAscPassive(m){
  const t=ascTier(m);
  const pools=[null,['a_iron','a_eye','a_wind'],['a_fang','a_storm','a_greed'],['a_crown','a_void','a_king']];
  let pool=PASSIVES.filter(p=>pools[t].includes(p.id) && !P.passiveList.find(x=>x.id===p.id));
  if(!pool.length && t<3) pool=PASSIVES.filter(p=>pools[t+1].includes(p.id) && !P.passiveList.find(x=>x.id===p.id));
  if(!pool.length){ const g=Math.round(60*m); P.coins+=g; LT.coins+=g; coinRain(20); announce('◈ ALL PASSIVES HELD — +'+g+' COINS ◈',true); return null; }
  const pd=pool[(Math.random()*pool.length)|0];
  pd.ap(); addPassiveHUD(pd); renderRelics();
  return pd;
}
function jackpotOffer(){
  LT.crash=(LT.crash||0)+1; bump('crash',LT.crash);
  secret('icarus','ICARUS ASCENDANT');
  bigWin('☆ JACKPOT ☆',4); SFX.seraph(); SFX.dingBells(); SFX.hotSix(); domConfetti(34,'crashLayer'); flash(0.7,'#fff2c0');
  $('crashStrobe').style.opacity=1; $('crashStrobe').style.filter='hue-rotate(40deg) saturate(2)';
  const opts=[]; let pool=availableWeapons();
  for(let i=0;i<3 && pool.length;i++){ const pk=weightedByRarity(pool); opts.push(pk); pool=pool.filter(w=>w!==pk); }
  crash.jk=true; crash.jkOpts=opts;
  if(!opts.length){ P.coins+=500; LT.coins+=500; announce('◈ ARSENAL FULL — 500 COINS ◈',true); crash.jk=false; setTimeout(closeCrash,1600); return; }
  let w9=$('jkWrap'); if(!w9){ w9=document.createElement('div'); w9.id='jkWrap'; $('crashLayer').appendChild(w9); }
  const rc={common:'#cfc2a6',rare:'#6fb7ff',epic:'#c98bff',legendary:'#ffd36b'};
  w9.innerHTML='<div class="jkTitle">☆ THE HOUSE OPENS THE ARMORY — CHOOSE ☆</div><div class="jkRow">'+
    opts.map((w,i)=>{ const lv=P.wlv[w.id]||0;
      return '<div class="jkCard" data-i="'+i+'"><div class="jkKey">'+(i+1)+'</div>'
        +'<div class="jkG" style="color:'+(GLYPH_COL[w.id]||rc[w.rar])+'">'+w.g+'</div>'
        +'<div class="jkN">'+w.n+'</div>'
        +'<div class="jkR" style="color:'+(rc[w.rar]||'#fff')+'">'+(RAR_LABEL[w.rar]||w.rar.toUpperCase())+(lv>0?' · Lv '+lv+' → '+(lv+1):' · NEW')+'</div>'
        +'<div class="jkD">'+projFx(w,lv+1)+'</div></div>'; }).join('')+'</div>';
  w9.classList.add('show');
  w9.querySelectorAll('.jkCard').forEach(c=>c.onclick=()=>pickJackpot(+c.dataset.i));
  $('crashMsg').innerHTML='PRESS <span class="keyhint">1</span> <span class="keyhint">2</span> <span class="keyhint">3</span> OR CLICK';
}
function pickJackpot(i){
  if(!crash.jk) return; const def=crash.jkOpts[i]; if(!def) return;
  crash.jk=false;
  grantWeaponLevels(def,1);
  const w9=$('jkWrap'); if(w9){ const cd=w9.querySelectorAll('.jkCard')[i]; if(cd) cd.classList.add('take'); setTimeout(()=>{ w9.classList.remove('show'); w9.innerHTML=''; },600); }
  let gd=$('ascGift');
  if(!gd){ gd=document.createElement('div'); gd.id='ascGift'; $('crashLayer').appendChild(gd); }
  gd.innerHTML='<div class="agG" style="color:'+(GLYPH_COL[def.id]||'#ffd36b')+';text-shadow:0 0 30px currentColor">'+def.g+'</div><div class="agN">'+def.n+'</div><div class="agT">JACKPOT ARM · '+projFx(def,P.wlv[def.id])+'</div>';
  gd.classList.remove('go'); void gd.offsetWidth; gd.classList.add('go');
  announce('☆ JACKPOT — '+def.n+' JOINS YOUR ARSENAL ☆', true);
  SFX.cashout(); SFX.casinoDing(); coinRain(24); sparkBurst(26);
  setTimeout(closeCrash, 2000);
}
function cashCrash(){
  if(!crash.live) return;
  crash.live=false; crash.done=true;
  crashHist.push({v:crash.mult,ok:true});
  const t=ascTier(crash.mult);
  const rk=$('crashRocket'); rk.classList.add('blast');
  $('crashStrobe').style.opacity=0.95; $('crashStrobe').style.filter='hue-rotate(40deg) saturate(1.5)';
  $('crashMult').className='hot';
  [784,988,1175,1568,1976,2637].forEach((f,i)=>setTimeout(()=>{ tone(f,0.22,'sine',0.13); tone(f/2,0.22,'triangle',0.07); },i*65));
  SFX.cashout(); setTimeout(()=>SFX.dingBells(),200); domConfetti(16+Math.min(3,t)*8,'crashLayer'); flash(0.45,t>=4?'#fff2c0':'#8bff9a'); shake=Math.min(20,shake+8+Math.min(3,t)*3);
  if(t>=4){ jackpotOffer(); return; }
  if(t===0){
    $('crashMsg').textContent='CASHED AT '+crash.mult.toFixed(2)+'× — BELOW THE MARK. NOTHING.';
    tone(220,0.3,'sawtooth',0.1,120); SFX.thud();
    LT.crash=(LT.crash||0)+1; bump('crash',LT.crash);
    setTimeout(closeCrash, 1400); return; }
  let pd=crash.prz&&crash.prz[t];
  if(pd){ pd.ap(); addPassiveHUD(pd); renderRelics(); }
  else { const g=Math.round(60*crash.mult); P.coins+=g; LT.coins+=g; coinRain(20); announce('◈ ALL HELD — +'+g+' COINS ◈',true); }
  if(pd){
    let gd=$('ascGift');
    if(!gd){ gd=document.createElement('div'); gd.id='ascGift'; $('crashLayer').appendChild(gd); }
    gd.innerHTML='<div class="agG">'+pd.g+'</div><div class="agN">'+pd.n+'</div><div class="agT">'+pd.fx+' · TIER '+['','I','II','III'][t]+'</div>';
    gd.classList.remove('go'); void gd.offsetWidth; gd.classList.add('go');
    setTimeout(()=>{ announce('✦ PASSIVE CLAIMED — '+pd.n+' ✦', true); if(t>=3){ SFX.seraph(); flash(0.5,'#fff2c0'); } },450);
  }
  $('crashMsg').textContent='ASCENDED AT '+crash.mult.toFixed(2)+'×';
  if(crash.mult>=3.69) bigWin('×'+crash.mult.toFixed(1)+' ASCENT',3);
  LT.crash=(LT.crash||0)+1; bump('crash',LT.crash);
  if(crash.mult>=7.77) secret('icarus','ICARUS ASCENDANT');
  setTimeout(closeCrash, 2100);
}
function closeCrash(){ crash.jk=false; { const w9=$('jkWrap'); if(w9){ w9.classList.remove('show'); w9.innerHTML=''; } } $('crashLayer').classList.add('hidden'); $('crashLayer').style.filter=''; stopDrone(); if(state==='crash'){ state='playing'; while(P.xp>=P.xpNext){ P.xp-=P.xpNext; P.level++; P.xpNext=Math.round(P.xpNext*1.18); pending.push({}); bump('level',P.level); recCheck('level',P.level,'Level'); SFX.levelUp(); }
  if(pending.length) setTimeout(()=>{ if(state==='playing' && pending.length) openNextSlot(); },450); } }
(function(){ const wrap=f=>function(...a){ try{ return f.apply(this,a); }catch(e){ if(!window._ascErr){ window._ascErr=1; console.error('[ANTE ASCENT]',e); } } };
  openCrash=wrap(openCrash); launchCrash=wrap(launchCrash); pushCrash=wrap(pushCrash); cashCrash=wrap(cashCrash); closeCrash=wrap(closeCrash);
})();
function tickCrashTok(dt){
  if(!crashTok){ crashTokT-=dt;
    if(crashTokT<=0){ crashTokT=48+Math.random()*34;
      const a=Math.random()*6.283, d=300+Math.random()*300;
      crashTok={x:clamp(P.x+Math.cos(a)*d,60,CFG.arena-60), y:clamp(P.y+Math.sin(a)*d,60,CFG.arena-60), t:20, ph:Math.random()*6.28};
      announce('▲ THE ASCENT BECKONS ▲', true); SFX.dingBells(); }
  } else {
    crashTok.t-=dt; crashTok._p=(crashTok._p||0)-dt; if(crashTok._p<=0){ crashTok._p=6; tone(1318,0.09,'sine',0.05); ring(crashTok.x,crashTok.y,52,'#8bff9a'); }
    if(crashTok.t<=0){ crashTok=null; return; }
    if(Math.hypot(P.x-crashTok.x,P.y-crashTok.y)<P.radius+16){ crashTok=null; openCrash(); }
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
