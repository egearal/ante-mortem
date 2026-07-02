"use strict";
 let slotBank=0, vouchers=0;
function rollMainReward(floor){
  const order={common:0,rare:1,epic:2,legendary:3};
  const min = floor?order[floor]:0;
  const cands=[];
  const ownedCount = WEAPONS.filter(w=>(P.wlv[w.id]||0)>0).length;
  WEAPONS.forEach(w=>{
    const cur=P.wlv[w.id]||0;
    if(cur>0){ if(cur<w.max && order[w.rar]>=min) cands.push(weaponReward(w)); }
    else if(ownedCount<WEAPON_CAP && order[w.rar]>=min) cands.push(weaponReward(w));
  });
  PASSIVES.forEach(pd=>{ if(order[pd.rar]>=min && !(pd.u && owned.has(pd.id)) && skillLevel(pd.id)<pd.max) cands.push(passiveReward(pd)); });
  const w=Object.assign({},CFG.weights);
  if(floor){ for(const k in w){ if(order[k]<order[floor]) w[k]=0; } }
  const have={common:0,rare:0,epic:0,legendary:0};
  cands.forEach(c=>have[c.rar]++);
  for(const k in w) if(!have[k]) w[k]=0;
  let total=0; for(const k in w) total+=w[k];
  if(total<=0) return pick(cands.length?cands:[weaponReward(WEAPONS[0])]);
  let x=Math.random()*total, chosen='common';
  for(const k in w){ if(x<w[k]){ chosen=k; break; } x-=w[k]; }
  const tier=cands.filter(c=>c.rar===chosen);
  return pick(tier.length?tier:cands);
}

/* ============================================================
   SLOT
   ============================================================ */
const SYMS=['♠','♥','♦','♣','7','★','☠','♛','◆','✦','♜','♞','⚔','☾','⚄'];
const RARC={common:'#c9c1b4',rare:'#6db4ff',epic:'#c98bff',legendary:'#f8e2a0'};
let reelTimers=[];
function makeBulbs(){
  const cab=$('cabinet'); if(!cab || cab.querySelector('.bulb')) return;
  const top=11, side=5, order=[];
  const add=(x,y)=>{ const b=document.createElement('div'); b.className='bulb'; b.style.left=(x*100)+'%'; b.style.top=(y*100)+'%'; cab.appendChild(b); order.push(b); };
  for(let i=0;i<top;i++) add(i/(top-1),0);
  for(let j=1;j<=side;j++) add(1,j/(side+1));
  for(let i=top-1;i>=0;i--) add(i/(top-1),1);
  for(let j=side;j>=1;j--) add(0,j/(side+1));
  order.forEach((b,i)=>{ b.style.animationDelay=(i*0.09)+'s'; });
}
function weightedByRarity(arr){
  const w=CFG.weights, buckets={};
  arr.forEach(o=>{ (buckets[o.rar]=buckets[o.rar]||[]).push(o); });
  const keys=Object.keys(buckets); if(!keys.length) return pick(arr);
  let t=0; keys.forEach(k=>t+=w[k]||1);
  let x=Math.random()*t, chosen=keys[0];
  for(const k of keys){ if(x<(w[k]||1)){ chosen=k; break; } x-=(w[k]||1); }
  return pick(buckets[chosen]);
}
const DIE_PIP_POS={
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,28],[72,28],[28,50],[72,50],[28,72],[72,72]]
};
function renderDie(el, val){
  el.innerHTML='';
  (DIE_PIP_POS[val]||DIE_PIP_POS[1]).forEach(pos=>{ const p=document.createElement('div'); p.className='pip'; p.style.left=pos[0]+'%'; p.style.top=pos[1]+'%'; el.appendChild(p); });
}
const MINIPOWERS=[
  {t:'+2 Move Speed', ap:()=>{P.speed+=2;}},
  {t:'+1 Damage', ap:()=>{P.damage+=1;}},
  {t:'+0.3 HP / sec', ap:()=>{P.regen+=0.3;}},
  {t:'+5% Coins', ap:()=>{P.coinMult+=0.05;}},
  {t:'+8 Pickup Range', ap:()=>{P.pickup+=8;}},
  {t:'+1% Crit', ap:()=>{P.crit=Math.min(0.9,P.crit+0.01);}}
];
function grantMiniPower(){ const m=MINIPOWERS[(Math.random()*MINIPOWERS.length)|0]; m.ap(); return m.t; }
let slotForceWeapon=false, _seanceOn=false;
function endSeance(){
  if(_seanceOn){ _seanceOn=false; elSlot.classList.remove('seance'); if(!lastRites) stopDrone(); }
  const m9=$('machine'); if(m9) m9.classList.remove('selecting','hopShake');
}
function openNextSlot(){
  if(!pending.length) return;
  const p=pending.shift();
  slotFloor=p.floor||null;
  state='slot';
  lastRites=(P.hp/P.maxHp)<=CFG.slot.critPct;
  if(P.coins===13) secret('cursed13','CURSED POCKET');
  slotIndex++;
  makeBulbs();
  elSlot.classList.remove('hidden');
  elSlot.classList.toggle('lastrites',lastRites);
  $('machine').classList.remove('win','jackpot','bust','pulling');
  SFX.levelUp();
  if(lastRites){ excite=1; startDrone(); SFX.murmur(); LT.rites=(LT.rites||0)+1; bump('rites',LT.rites); }
  const weaponTurn = (slotForceWeapon || slotIndex % 4 === 0) && availableWeapons().length>0;
  slotForceWeapon=false;
  openSlotReady(weaponTurn?'weapon':'skill');
}
function buildStrip(strip, seq, defs){
  strip.innerHTML='';
  seq.concat(seq).forEach(id=>{ const s=defs.find(x=>x.id===id); const d=document.createElement('div'); d.className='sym symBig'; d.innerHTML=iconSvg(s.id); d.style.color=RARC[s.rar]||'#c9c1b4'; strip.appendChild(d); });
}
function ensureBulbs(){
  const m=$('machine'); if(m._bulbs) return; m._bulbs=true;
  for(let i=0;i<26;i++){ const b=document.createElement('div'); b.className='bulb chase';
    const t=i/26; let x,y;
    if(t<0.5){ x=3+(t/0.5)*94; y=0.5; } else { x=97-((t-0.5)/0.5)*94; y=99.5; }
    b.style.left=x+'%'; b.style.top=y+'%'; b.style.animationDelay=((i%13)*0.104)+'s';
    m.appendChild(b); }
}
function openSlotReady(kind){
  ensureBulbs();
  slotKind=kind; gamble=null; diceShown=false; const isW=kind==='weapon';
  $('slotTag').textContent = (lastRites?'☨ LAST RITES — BLOOD FOR FORTUNE ☨':(isW?'⚔ THE ARSENAL WHEEL ⚔':'THE WHEELS OF FATE'))+(slotBank>0?' · BANK '+slotBank+'/7':'');
  $('reelsRow').style.display=''; $('diceRow').style.display='none'; $('riskWrap').style.display='none';
  $('prizeTag').textContent = isW?'YOUR WEAPON':'YOUR SKILL';
  $('cardName').textContent='—'; $('cardName').className='r-common'; $('cardDesc').textContent = isW?'spin for a weapon':'spin for a skill';
  const defs=isW?WEAPONS:PASSIVES; const avail=isW?availableWeapons():availableSkills(); const pool=avail.length?avail:defs;
  const preStrips=[$('strip0'),$('strip1'),$('strip2')];
  preStrips.forEach(el=>{ const seq=[]; for(let k=0;k<22;k++) seq.push(pick(pool).id); buildStrip(el,seq,defs); el.classList.remove('blur'); el.style.transition='none'; el.style.transform='translateY(0px)'; });
  requestAnimationFrame(()=>{ preStrips.forEach(el=>{ const symH=(el.children[0]&&el.children[0].offsetHeight)||63; const boxH=(el.parentElement&&el.parentElement.clientHeight)||189; el.style.transform='translateY('+(boxH/2 - symH*1.5)+'px)'; }); });
  slotReels=[]; slotStage='ready';
  document.querySelectorAll('.reelbox').forEach(b=>b.classList.remove('antici','slam','pick','locked')); $('reelsRow').classList.remove('sweeping');
  $('gambleMsg').innerHTML='<span class="keyhint">SPACE</span> spin the reels';
  showSlotButtons();
}
function spinReels(){
  if(slotStage!=='ready') return;
  const isW=slotKind==='weapon'; const defs=isW?WEAPONS:PASSIVES;
  const avail=isW?availableWeapons():availableSkills(); const pool=avail.length?avail:defs;
  const strips=[$('strip0'),$('strip1'),$('strip2')];
  document.querySelectorAll('.reelbox').forEach(b=>b.classList.remove('antici','slam','pick','locked')); $('reelsRow').classList.remove('sweeping');
  slotReels = strips.map((el,i)=>{
    const N=22, seq=[]; for(let k=0;k<N;k++) seq.push(pick(pool).id);
    buildStrip(el,seq,defs); el.style.transition='none';
    return {el,seq,N,offset:Math.random()*N,speed:19+i*1.8,stopped:false,landedSym:null,symH:63,boxH:189};
  });
  LT.spins++; bump('spins',LT.spins);
  slotStage='spinning'; reelsStopped=0; stopLock=performance.now()+150;
  requestAnimationFrame(()=>{ slotReels.forEach(r=>{ r.symH=(r.el.children[0]&&r.el.children[0].offsetHeight)||63; r.boxH=r.el.parentElement.clientHeight||189; r.el.classList.add('blur'); }); });
  $('gambleMsg').innerHTML='<span class="keyhint">SPACE</span> stop each reel — match for more';
  SFX.lever();
  showSlotButtons();
}
function slotTap(){
  if(slotStage==='ready') spinReels();
  else if(slotStage==='spinning') stopNextReel();
  else if(slotStage==='select') stopSelector();
  else if(slotStage==='dicing') stopDie();
  else if(slotStage==='offer') takeReward();
  else if(slotStage==='resolved') closeSlot();
}
function ringShow(on){ const r=$('holdRing'); if(!r)return; r.classList.toggle('show',on); if(on) window._hq=0;
  if(!on){ r.querySelectorAll('.hrRect,.hrGlow').forEach(rc=>rc.style.strokeDashoffset=1000); } }
function ringUpdate(p){ const r=$('holdRing'); if(!r)return; const off=1000*(1-Math.min(1,p));
  r.querySelectorAll('.hrRect,.hrGlow').forEach(rc=>rc.style.strokeDashoffset=off);
  const q=Math.floor(Math.min(0.999,p)*4); if(q>(window._hq||0)){ window._hq=q; SFX.dingHit(1+q); } }
function stopNextReel(){
  if(slotStage!=='spinning') return;
  if(performance.now()<(stopLock||0)) return;
  const r=slotReels.find(x=>!x.stopped); if(!r) return;
  stopLock=performance.now()+180;
  r.stopped=true; r.el.classList.remove('blur');
  const centerBias=(r.boxH/2 - r.symH/2)/r.symH;
  const target=Math.round((r.offset % r.N)+centerBias);
  const idx=((target % r.N)+r.N)%r.N;
  r.landedSym=r.seq[idx]; r.landedIdx=idx;
  const tyFinal=-((target-centerBias)*r.symH);
  r.el.style.transition='transform .16s cubic-bezier(.34,1.7,.5,1)';
  r.el.style.transform='translateY('+(tyFinal-10)+'px)';
  setTimeout(()=>{ if(r.el){ r.el.style.transform='translateY('+tyFinal+'px)'; setTimeout(()=>{ if(r.el)r.el.style.transition='none'; },170); } },90);
  reelsStopped++;
  const box=r.el.parentElement; box.classList.remove('slam'); void box.offsetWidth; box.classList.add('slam');
  SFX.reelHit(reelsStopped); SFX.dingHit(reelsStopped); setTimeout(()=>SFX.casinoDing(),60); shake=Math.min(12,shake+5); flash(0.25,'#fff0c8'); sparkBurst(14);
  const defs=slotKind==='weapon'?WEAPONS:PASSIVES; const s=defs.find(x=>x.id===r.landedSym);
  if(s){ $('cardName').textContent=s.n; $('cardName').className='r-'+s.rar; $('cardDesc').innerHTML='<div class="ofsub">'+projFx(s, skLevel(s)+1)+'</div>'; }
  if(reelsStopped===2){
    const st=slotReels.filter(x=>x.stopped).map(x=>x.landedSym); const last=slotReels.find(x=>!x.stopped);
    if(last && st[0]===st[1]){ last.el.parentElement.classList.add('antici'); SFX.tingle(); excite=1; $('gambleMsg').innerHTML='<span style="color:#ffd36b">◈ TWO MATCH ◈</span>'; }
  }
  if(reelsStopped>=3){ slotStage='locking'; SFX.reelLock(); shake=Math.min(15,shake+6); flash(0.35,'#e8b64c');
    let selDelay=300;
    { // near-miss: two matched, and the odd reel stopped ONE row away from completing the triple
      const landed=slotReels.map(x=>x.landedSym);
      const counts={}; landed.forEach(sy=>counts[sy]=(counts[sy]||0)+1);
      let pairId=null; for(const sy in counts) if(counts[sy]===2) pairId=sy;
      const odd=pairId?slotReels.find(x=>x.landedSym!==pairId):null;
      if(odd && (odd.seq[((odd.landedIdx-1)+odd.N)%odd.N]===pairId || odd.seq[(odd.landedIdx+1)%odd.N]===pairId)){
        selDelay=900; excite=1;
        setTimeout(()=>{ if(slotStage!=='locking') return;
          flash(0.35,'#8b1620'); SFX.nearMiss(); shake=Math.min(16,shake+7);
          $('gambleMsg').innerHTML='<span style="color:#ff7b7b">◈ ONE ROW OFF ◈</span>';
          const bx=odd.el.parentElement; bx.classList.add('pick'); setTimeout(()=>bx.classList.remove('pick'),640);
        },220);
      } }
    setTimeout(startSelector,selDelay); }
  else showSlotButtons();
}
function ceremony(matchN, def){
  if(matchN>=3){ bigWin(shinyWord()+'  +'+matchN+' LV',4); flash(0.5,RARC[def.rar]||'#e8b64c'); SFX.dingBells(); sparkBurst(30); }
  else if(matchN===2){ $('machine').classList.add('win'); SFX.dingBells(); coinRain(14); flash(0.3,'#e8b64c'); sparkBurst(18); }
  else { SFX.coinPling(); SFX.dingHit(1); coinRain(4); sparkBurst(8); }
}
function startSelector(){
  const landed=slotReels.map(r=>r.landedSym);
  const counts={}; landed.forEach(s=>counts[s]=(counts[s]||0)+1);
  let pairId=null, pairN=1;
  for(const s in counts){ if(counts[s]>pairN){ pairN=counts[s]; pairId=s; } }
  document.querySelectorAll('.reelbox').forEach(b=>b.classList.remove('antici','pick','locked'));
  if(pairN>=2){
    // 2+ of a kind — base levels (2 or 5), and you can STILL dice for more
    slotStage='locking';
    landed.forEach((s,i)=>{ if(s===pairId) boxOf(i).classList.add('locked'); });
    SFX.reelLock(); SFX.dingHit(3+pairN); shake=Math.min(20,shake+9); flash(0.5,'#ffd36b'); sparkBurst(28+pairN*10);
    setTimeout(()=>finalizeReward(pairId, pairN), pairN>=3?820:540);
    return;
  }
  // all different — random reveal wheel (your stop does NOT change the result)
  slotStage='select';
  $('reelsRow').classList.add('sweeping');
  if(!lastRites){ elSlot.classList.add('seance'); _seanceOn=true; startDrone(); }
  $('machine').classList.add('selecting');
  selWinner=(Math.random()*3)|0;
  selPos=(Math.random()*3)|0; selT=0; selHop=0.08; selStopping=false; selHopsLeft=0;
  boxOf(selPos).classList.add('pick');
  SFX.selectorGo();
  $('cardName').textContent='FATE SPINS'; $('cardName').className='r-common';
  $('cardDesc').innerHTML='';
  $('gambleMsg').innerHTML='';
  showSlotButtons();
}
function boxOf(i){ return $('reelBox'+i) || (slotReels[i]&&slotReels[i].el.parentElement); }
function stopSelector(){
  if(slotStage!=='select' || selStopping) return;
  selStopping=true;
  const loops = 2 + ((Math.random()*2)|0);
  let h = loops*3 + ((((selWinner - selPos)%3)+3)%3);
  if(h < 5) h += 3;
  selHopsLeft = h;
  SFX.tingle();
}
function lockSelector(){
  slotStage='locking';
  $('reelsRow').classList.remove('sweeping');
  document.querySelectorAll('.reelbox').forEach(b=>b.classList.remove('pick'));
  const bx=boxOf(selPos); if(bx) bx.classList.add('locked');
  const landed=slotReels.map(r=>r.landedSym);
  const bestId=landed[selPos];
  const matchN=landed.filter(s=>s===bestId).length;
  SFX.reelLock(); SFX.dingHit(3+matchN); shake=Math.min(18,shake+8); flash(0.42,matchN>=2?'#ffd36b':'#fff0c8'); sparkBurst(22+matchN*8);
  setTimeout(()=>finalizeReward(bestId, matchN), 430);
}
{ const _pf=projFx;
  projFx=function(def,lv){
    if(def && PROJ_FX[def.id]) return PROJ_FX[def.id](lv);
    if(def && def.d) return def.d(Math.max(1,lv));
    return _pf(def,lv);
  }; }
function finalizeReward(bestId, matchN){
  let seraph=Math.random()<0.01; if(seraph&&matchN<3) matchN++;
  if(slotFloor && matchN<2) matchN=2;
  if(matchN>=3){ LT.triples++; bump('triples',LT.triples); } else if(matchN===2){ LT.pairs++; bump('pairs',LT.pairs); }
  { const add9=matchN>=3?2:(matchN===2?1:0);
    for(let t9=0;t9<add9;t9++) setTimeout(()=>{ tone(520+(slotBank+t9)*85,0.09,'sine',0.12); noise(0.05,0.05,3000); }, 250+t9*140);
    slotBank+=add9; }
  if(slotBank>=7){ slotBank-=7; vouchers++; SFX.dingBells(); SFX.chipStack();
    setTimeout(()=>announce('◈ BANK FULL — HOUSE VOUCHER EARNED ◈', true), 200); }
  let base = matchN>=3 ? 5 : (matchN===2 ? 2 : 1);
  if(lastRites) base+=1;
  if(ovBonusNext){ ovBonusNext=false; base+=1; setTimeout(()=>announce('⚡ OVERCHARGED — +1 BONUS LEVEL ⚡', true), 700); }
  if(vouchers>0){ vouchers--; base+=1; setTimeout(()=>{ announce('◈ HOUSE VOUCHER SPENT — +1 LEVEL ◈', true); flash(0.35,'#ffd36b'); SFX.casinoDing(); }, 1400); }
  const defs=slotKind==='weapon'?WEAPONS:PASSIVES; const def=defs.find(x=>x.id===bestId);
  gamble={ def, kind:slotKind, base, reward:base, matchN, round:1, threshold:(lastRites?6:7)-(vlv('dice')?1:0)+(P.hexDice?1:0), rites:lastRites, seraph, rollT:0, win:false, dL:0, dR:0, hist:[] };
  if(seraph) seraphCeremony();
  ceremony(matchN, def);
  openOffer();
}
function showRewardPanel(){
  const g=gamble, def=g.def;
  $('cardName').textContent=def.n; $('cardName').className='r-'+def.rar+' bigname';
}
function openOffer(){
  slotStage='offer'; endSeance(); const g=gamble; showRewardPanel();
  const deadly = g.round>=3;
  if(!deadly && !g.pendingCurse) g.pendingCurse=DEBUFF_POOL[(Math.random()*DEBUFF_POOL.length)|0];
  const gain=rollGain(g.round);
  const curLv=skLevel(g.def);
  const takeLv=Math.min(g.def.max, curLv+g.reward);
  const winLv=Math.min(g.def.max, curLv+g.reward+gain);
  const lossTxt = deadly ? 'LOSE THE SKILL' : curseLabel(g.pendingCurse);
  $('cardDesc').innerHTML =
    (g.rites?'<div class="ofsub" style="color:#ff7b7b">☨ roll −6% blood · win +22% blood</div>':'')+
    '<div class="ofbig">TAKE Lv '+takeLv+' — '+projFx(g.def, takeLv)+'</div>'+
    '<div class="ofrow"><span class="ofg">✦ Roll '+g.threshold+'+ → Lv '+winLv+' — '+projFx(g.def, winLv)+'</span>'+
    '<span class="ofl">✕ Miss → '+lossTxt+'</span></div>';
  $('gambleMsg').innerHTML='';
  SFX.casinoDing();
  updateLadderPips();
  showSlotButtons();
}
function doRisk(){
  if(slotStage!=='offer' || !gamble) return;
  const g=gamble;
  $('reelsRow').style.display='none'; $('diceRow').style.display='';
  if(!diceShown){ dice=[ {el:$('dieL'),val:1+((Math.random()*6)|0),rolling:false,ft:0}, {el:$('dieR'),val:1+((Math.random()*6)|0),rolling:false,ft:0} ]; diceShown=true; }
  dice.forEach(d=>{ d.rolling=true; d.ft=0; d.el.classList.remove('settle','crit','hot'); d.el.classList.add('rolling'); renderDie(d.el,d.val); });
  slotStage='dicing'; stopLock=performance.now()+150;
  if(g.rites){ P.hp=Math.max(1, P.hp-P.maxHp*(contractDone('codicil')?0.03:0.06)); flash(0.35,'#8b1620'); SFX.thud(); shake=Math.min(14,shake+5); }
  SFX.diceRattle(); SFX.riser(); sparkBurst(12);
  const gain=rollGain(g.round); const winLv=Math.min(g.def.max, skLevel(g.def)+g.reward+gain);
  $('cardName').textContent=g.def.n; $('cardName').className='r-'+g.def.rar+' bigname';
  $('cardDesc').innerHTML='<div class="ofbig">Need '+g.threshold+'+</div>'+
    '<div class="ofrow"><span class="ofg">✦ Win → Lv '+winLv+' — '+projFx(g.def, winLv)+'</span><span class="ofl">✕ Miss → '+(g.round>=3?'LOSE SKILL':curseLabel(g.pendingCurse))+'</span></div>';
  $('gambleMsg').innerHTML='';
  updateLadderPips();
  showSlotButtons();
}
function stopDie(){
  if(slotStage!=='dicing') return;
  if(performance.now()<(stopLock||0)) return;
  const idx = dice[0].rolling ? 0 : 1;
  const d=dice[idx]; if(!d.rolling) return;
  d.rolling=false; d.val=1+((Math.random()*6)|0); renderDie(d.el,d.val);
  d.el.classList.remove('rolling'); d.el.classList.add('settle'); setTimeout(()=>{ if(d.el)d.el.classList.remove('settle'); },340);
  stopLock=performance.now()+200;
  const mag = gamble? gamble.round : 1;
  SFX.reelHit(idx+1); SFX.dingHit(idx+mag); shake=Math.min(17,shake+5+mag); flash(0.26+mag*0.04,'#fff0c8'); sparkBurst(14+mag*7);
  const g=gamble;
  if(idx===0){
    if(d.val===6){ d.el.classList.add('hot'); SFX.hotSix(); flash(0.4,'#ffcc33'); sparkBurst(30); shake=Math.min(16,shake+7); excite=1;
      $('gambleMsg').innerHTML='<span style="color:#ffd36b">⚡ SIX — PERFECT LIVES ⚡</span>'; }
    else $('gambleMsg').innerHTML='';
    showSlotButtons();
  } else {
    dice.forEach(x=>x.el.classList.remove('hot'));
    g.dL=dice[0].val; g.dR=dice[1].val; slotStage='locking';
    g.win=(g.dL+g.dR)>=g.threshold;
    if(!g.win && P.dmhArmed){ P.dmhArmed=false; g.win=true; g._dmh=true; }
    SFX.reelLock();
    setTimeout(resolveRisk, 280);
  }
}
function updateLadderPips(){
  const box=$('ladderPips'); if(!box||!gamble) return;
  const pips=box.children, h=gamble.hist||[];
  for(let i=0;i<4;i++){ const p=pips[i]; p.className='lpip';
    if(h[i]==='w') p.classList.add('won');
    else if(h[i]==='l') p.classList.add('lost');
    else if(i===h.length && (slotStage==='dicing'||slotStage==='offer'||slotStage==='locking')) p.classList.add('cur');
  }
}
function godLevel(){
  const l=$('jackpotLayer'), t=$('jackpotText'); t.textContent='⚜ GOD LEVEL ⚜'; t.className='jackpotText t4 seraph';
  l.classList.remove('hidden'); t.style.animation='none'; void t.offsetWidth; t.style.animation='';
  SFX.seraph(); SFX.dingBells(); setTimeout(()=>SFX.dingBells(),240); setTimeout(()=>SFX.dingBells(),500); SFX.cashout(); setTimeout(()=>SFX.cashout(),350);
  coinRain(70); excite=1; shake=Math.min(30,shake+20); sparkBurst(80);
  ['#ffd36b','#eaf3ff','#8bff9a','#c98bff','#fff2c0','#9adcff'].forEach((c,i)=>setTimeout(()=>{ flash(0.45,c); sparkBurst(28); SFX.casinoDing(); },i*85));
  LT.gods=(LT.gods||0)+1; bump('gods',LT.gods);
  setTimeout(()=>l.classList.add('hidden'), 2400);
}
function perfectFlash(){
  const l=$('jackpotLayer'), t=$('jackpotText'); t.textContent='PERFECT'; t.className='jackpotText t4';
  l.classList.remove('hidden'); t.style.animation='none'; void t.offsetWidth; t.style.animation='';
  SFX.dingBells(); SFX.cashout(); setTimeout(()=>SFX.casinoDing(),120); coinRain(26); sparkBurst(44); shake=Math.min(26,shake+15); excite=1;
  const cols=['#ffd36b','#8bff9a','#6db4ff','#fff2c0'];
  cols.forEach((c,i)=>setTimeout(()=>{ flash(0.42,c); sparkBurst(22); },i*80));
  setTimeout(()=>l.classList.add('hidden'), 1150);
}
function resolveRisk(){
  const g=gamble; const sum=g.dL+g.dR;
  $('gambleMsg').innerHTML='';
  if(g.dL===1&&g.dR===1) secret('snakeeyes','SNAKE EYES');
  if(g.win){
    const perfect = sum===12;
    (g.hist=g.hist||[]).push('w'); updateLadderPips();
    if(perfect && g.round===1) secret('bornlucky','BORN LUCKY');
    if(perfect && g._lastPerfect) secret('dblperfect','DOUBLE PERFECTION');
    g._lastPerfect=perfect;
    if(g.rites){ const hl=Math.round(P.maxHp*0.22); P.hp=Math.min(P.maxHp,P.hp+hl); flash(0.4,'#8bff9a'); SFX.tingle();
      setTimeout(()=>{ if($('gambleMsg')) $('gambleMsg').innerHTML='<span style="color:#8bff9a">☨ THE BLOOD RETURNS +'+hl+' ☨</span>'; },60); }
    LT.diceWins++; bump('diceWins',LT.diceWins);
    if(perfect){ LT.perfects++; bump('perfects',LT.perfects); }
    if(g.round>=MAXROLL){ LT.ladders++; bump('ladders',LT.ladders); }
    let gain=rollGain(g.round); if(perfect) gain+=1;
    g.reward+=gain;
    dice.forEach(d=>d.el.classList.add('crit'));
    const rw=g.reward; SFX.dingBells(); SFX.casinoDing(); if(rw>=4) setTimeout(()=>SFX.cashout(),120); if(rw>=5) setTimeout(()=>SFX.dingBells(),220); coinRain(16+rw*4); flash(0.42,'#8bff9a'); $('machine').classList.add('win'); shake=Math.min(22,shake+7+rw); excite=1; sparkBurst(24+rw*5);
    if(perfect) perfectFlash();
    const nowLv=Math.min(g.def.max, skLevel(g.def)+g.reward);
    $('cardDesc').innerHTML='<div class="ofbig" style="color:'+(perfect?'#ffe066':'#b8ffbf')+'">'+(perfect?'✦ PERFECT 12! ✦ ':'')+projFx(g.def, nowLv)+'</div><div class="ofrow"><span class="ofg">✦ '+sum+' ≥ '+g.threshold+' — WIN!'+(perfect?' +1 bonus':'')+'</span></div>';
    if(g.round>=MAXROLL){
      setTimeout(()=>{ let nl; if(g.kind==='weapon'){ nl=grantWeaponLevels(g.def,g.reward); } else { grantSkill(g.def,g.reward); nl=skillLevel(g.def.id); }
        $('machine').classList.remove('win'); dice.forEach(d=>d.el.classList.remove('crit'));
        $('cardName').textContent=g.def.n; $('cardName').className='r-'+g.def.rar+' bigname';
        $('cardDesc').innerHTML='<div class="ofbig" style="color:#ffe9a8">'+projFx(g.def, nl)+'</div>';
        godLevel(); flash(0.5,RARC[g.def.rar]||'#e8b64c');
        slotStage='resolved'; showSlotButtons(); }, perfect?1150:850);
    } else {
      g.round++; g.threshold=Math.min(12, g.threshold+1); g.pendingCurse=null;
      setTimeout(()=>{ $('machine').classList.remove('win'); dice.forEach(d=>d.el.classList.remove('crit')); openOffer(); }, perfect?1250:850);
    }
  } else {
    if(g.round>=3){
      g.reward=0;
      (g.hist=g.hist||[]).push('l'); updateLadderPips();
      if(g.hist.length>=3 && g.hist.every(h=>h==='l')) secret('longfall','THE LONG FALL');
      LT.skillLost++; bump('skillLost',LT.skillLost);
      const near2 = sum===g.threshold-1;
      if(near2) SFX.nearMiss();
      $('machine').classList.remove('win','jackpot'); $('machine').classList.add('bust');
      $('cardName').textContent='SKILL LOST'; $('cardName').className='r-common bigname';
      $('cardDesc').innerHTML=(near2?'<div class="ofbig" style="color:#ffb066">SO CLOSE…</div>':'')+'<div class="ofrow"><span class="ofl">✕ '+sum+' &lt; '+g.threshold+' — BUST</span></div>';
      const l=$('jackpotLayer'), t=$('jackpotText'); t.textContent='BUST'; t.className='jackpotText'; t.style.color='#ff5560';
      l.classList.remove('hidden'); t.style.animation='none'; void t.offsetWidth; t.style.animation='';
      SFX.bust(); shake=Math.min(24,shake+12); flash(0.55,'#8b1620');
      setTimeout(()=>{ l.classList.add('hidden'); t.style.color=''; },1200);
      slotStage='resolved'; showSlotButtons();
    } else {
      const dl=applyDebuff(g.pendingCurse);
      (g.hist=g.hist||[]).push('l'); updateLadderPips();
      LT.curses++; bump('curses',LT.curses);
      const near1 = sum===g.threshold-1;
      if(near1) SFX.nearMiss();
      dice.forEach(d=>d.el.classList.remove('crit'));
      $('machine').classList.remove('win','jackpot');
      $('cardName').textContent=g.def.n; $('cardName').className='r-'+g.def.rar+' bigname';
      $('cardDesc').innerHTML=(near1?'<div class="ofbig" style="color:#ffb066">SO CLOSE…</div>':'')+'<div class="ofrow"><span class="ofl">✕ '+sum+' &lt; '+g.threshold+' — CURSED: '+dl+'</span></div>';
      shake=Math.min(16,shake+7);
      g.round++; g.threshold=Math.min(12, g.threshold+1); g.pendingCurse=null;
      setTimeout(()=>{ openOffer(); }, 1000);
    }
  }
}
function takeReward(){
  if(slotStage!=='offer' || !gamble) return;
  const g=gamble;
  if(g.kind==='weapon') grantWeaponLevels(g.def, g.reward); else grantSkill(g.def, g.reward);
  SFX.winDing(); coinRain(8); flash(0.25,'#e8b64c');
  closeSlot();
}
let whisperT=0;
function whisper(){
  const b=110+Math.random()*60;
  tone(b,1.4,'sine',0.10,b*0.86); tone(b*1.42,1.2,'sine',0.06,b*1.3);
  noise(0.9,0.05,520);
  setTimeout(()=>{ tone(b*0.5,1.1,'sine',0.09,b*0.44); noise(0.6,0.04,380); }, 420);
}
function tickSlot(dt){
  if(lastRites){ whisperT-=dt; if(whisperT<=0){ whisperT=2.6+Math.random()*2.4; whisper(); } }
  if(slotStage==='spinning'||slotStage==='locking'){
    for(const r of slotReels){ if(r.stopped) continue; r.offset += r.speed*dt; const ty=-((r.offset % r.N)*r.symH); r.el.style.transform='translateY('+ty+'px)'; }
  }
  if(slotStage==='select'){
    selT+=dt;
    if(selT>=selHop){
      selT=0;
      boxOf(selPos).classList.remove('pick');
      selPos=(selPos+1)%3;
      boxOf(selPos).classList.add('pick');
      { const m9=$('machine'); if(m9){ m9.classList.remove('hopShake'); void m9.offsetWidth; m9.classList.add('hopShake'); } }
      shake=Math.min(10,shake+2);
      SFX.selectorTick(selStopping?selHopsLeft:2); sparkBurst(16);
      if(selStopping){ selHopsLeft--; selHop+=0.022; if(selHopsLeft<=0){ lockSelector(); } }
    }
  }
  for(const d of dice){ if(!d.rolling) continue; d.ft-=dt; if(d.ft<=0){ d.val=1+((Math.random()*6)|0); renderDie(d.el,d.val); d.ft=0.055; } }
  if(spaceHold){
    if(slotStage==='offer'){ holdProg+=dt/0.5; ringUpdate(holdProg); if(holdProg>=1 && !holdFired){ holdFired=true; spaceHold=false; ringShow(false); SFX.tingle(); doRisk(); } }
    else { spaceHold=false; holdProg=0; ringShow(false); }
  }
}
function showSlotButtons(){
  const box=$('slotBtns'); box.innerHTML='';
  if(slotStage==='ready'){ box.appendChild(makeBtn('◈ SPIN','gold','press SPACE',()=>slotTap())); }
  else if(slotStage==='spinning'){ const left=slotReels.filter(x=>!x.stopped).length; box.appendChild(makeBtn('■ STOP','gold',left+' left · SPACE',()=>slotTap())); }
  else if(slotStage==='select'){ box.appendChild(makeBtn('🔴 LOCK','red',selStopping?'locking…':'SPACE',()=>slotTap())); }
  else if(slotStage==='dicing'){ const rolling=dice.filter(x=>x.rolling).length; box.appendChild(makeBtn('🎲 STOP DIE','gold',(rolling>1?'left die':'right die')+' · SPACE',()=>slotTap())); }
  else if(slotStage==='offer'){ const g=gamble;
    box.appendChild(makeBtn('◈ TAKE +'+g.reward,'gold','SPACE',()=>takeReward()));
    box.appendChild(makeBtn('🎲 ROLL','red','HOLD SPACE',()=>doRisk()));
  }
  else if(slotStage==='resolved'){ box.appendChild(makeBtn('CONTINUE','gold','press SPACE',()=>slotTap())); }
}
/* ---- shared ---- */
function makeBtn(label,cls,sub,fn){
  const b=document.createElement('button'); b.className='btn '+(cls||'');
  b.innerHTML = label + (sub?'<br><span class="costnote">'+sub+'</span>':'');
  b.onclick=fn; return b;
}
const SHINY=['JACKPOT','DIVINE','GILDED','RADIANT','ASCENDANT','BLESSED','MYTHIC','GOLDEN','SUBLIME','EXALTED','CELESTIAL','ANOINTED','HALLOWED'];
const SHORT_FX={
  dmg:'+5 Attack / lvl', fire:'+0.25 Fire Rate / lvl', spd:'+20 Move Speed / lvl', hp:'+30 Max HP / lvl',
  luck:'+6% Crit · +18% Coins', proj:'+1 Projectile / lvl', pierce:'+1 Pierce / lvl', mag:'+40 Pickup / lvl',
  regen:'+1 HP per sec', exec:'+40% Crit Damage / lvl',
  bolt:'Auto-fires bolts', cards:'Piercing card fan', orbit:'Orbiting chips', scythe:'Sweeping scythe arc',
  spark:'Chain lightning', chand:'Chandelier smite', knives:'Radial spinning knives', aura:'Damage aura cloud',
  nova:'Shockwave blast', seeker:'Homing skulls'
};
function shortFx(def){ return SHORT_FX[def.id] || 'power up'; }
const ICONS={
 bolt:'<path d="M5 19 L19 5 M19 5 h-6 M19 5 v6"/>',
 cards:'<rect x="6" y="4" width="8" height="12" rx="1.4"/><rect x="10" y="8" width="8" height="12" rx="1.4"/>',
 orbit:'<ellipse cx="12" cy="12" rx="9.5" ry="5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="21" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
 scythe:'<path d="M7 21 L15 5"/><path d="M15 5 C 21 5.5 22 11 18.5 13.5"/><path d="M15 5 L12 4"/>',
 spark:'<path d="M13 2 L7 13 h4.4 L10 22 L18 10 h-4.6 Z" fill="currentColor" stroke="none"/>',
 chand:'<path d="M12 2 v4"/><path d="M12 6 l-6 4 M12 6 l6 4"/><path d="M5 10 a7 4.2 0 0 0 14 0"/><path d="M6.5 9 v-2.2 M12 8 v-2.4 M17.5 9 v-2.2"/><circle cx="6.5" cy="5.6" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="4.4" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="5.6" r="1" fill="currentColor" stroke="none"/>',
 knives:'<path d="M12 12 L12 4 M12 12 L5.4 18.6 M12 12 L18.6 18.6"/><path d="M12 2 l-1.8 3.4 h3.6Z" fill="currentColor" stroke="none"/><path d="M4 20 l3.6-.5 -1.6-2.6Z" fill="currentColor" stroke="none"/><path d="M20 20 l-3.6-.5 1.6-2.6Z" fill="currentColor" stroke="none"/>',
 aura:'<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="7.2" opacity=".65" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="10.6" opacity=".35" stroke-dasharray="2 4"/>',
 nova:'<path d="M12 2 v5 M12 17 v5 M2 12 h5 M17 12 h5 M4.9 4.9 l3.4 3.4 M15.7 15.7 L19.1 19.1 M19.1 4.9 l-3.4 3.4 M8.3 15.7 L4.9 19.1"/>',
 seeker:'<circle cx="12" cy="10" r="6.2"/><path d="M9.4 15.6 v2.8 M12 16.2 v2.8 M14.6 15.6 v2.8"/><circle cx="9.8" cy="9.2" r="1.4" fill="currentColor" stroke="none"/><circle cx="14.2" cy="9.2" r="1.4" fill="currentColor" stroke="none"/>',
 dmg:'<path d="M12 2 L12 14 M8.4 14.5 h7.2 M12 14.5 v5.5 M9.6 20.5 h4.8"/><path d="M10.6 4.4 L12 2 L13.4 4.4"/>',
 fire:'<path d="M6.5 5 l6 7 -6 7 M12.5 5 l6 7 -6 7"/>',
 spd:'<path d="M4 7 h8 M3 12 h11 M4 17 h8"/><path d="M15 12 h6 m-3.4 -3.4 L21 12 l-3.4 3.4"/>',
 hp:'<path d="M12 20 C4.5 13.4 5.4 6.6 9.6 6.6 c1.5 0 2.4 1.3 2.4 1.3 s.9-1.3 2.4-1.3 c4.2 0 5.1 6.8-2.4 13.4Z" fill="currentColor" stroke="none"/>',
 luck:'<path d="M12 3.4 l2.4 2.4 -2.4 2.4 -2.4 -2.4Z M12 15.8 l2.4 2.4 -2.4 2.4 -2.4 -2.4Z M5.8 9.6 l2.4 2.4 -2.4 2.4 -2.4 -2.4Z M18.2 9.6 l2.4 2.4 -2.4 2.4 -2.4 -2.4Z" fill="currentColor" stroke="none"/>',
 proj:'<path d="M4 7 h10 M4 12 h13 M4 17 h10"/><path d="M17 12 l3.2 0 m-2.6 -2.6 L20.2 12 l-2.6 2.6 M14 7 l-2 -1.6 M14 7 l-2 1.6 M14 17 l-2 -1.6 M14 17 l-2 1.6"/>',
 pierce:'<circle cx="13.4" cy="12" r="5.2"/><path d="M2 12 h19 m-3 -3 l3 3 -3 3"/>',
 mag:'<path d="M7 4 v7.5 a5 5 0 0 0 10 0 V4"/><path d="M5.6 6.6 h4 M14.4 6.6 h4"/>',
 regen:'<path d="M12 3 C8.4 8.6 7.2 11.4 7.2 13.6 a4.8 4.8 0 0 0 9.6 0 c0-2.2-1.2-5-4.8-10.6Z"/><path d="M10 14 h4 M12 12 v4"/>',
 exec:'<path d="M13.6 4.6 L6 20"/><path d="M13 4 c5 -.6 8 2.6 8 6.4 -3.4 .4 -6.6 -.8 -8.6 -3.2Z" fill="currentColor" stroke="none"/>'
};
// per-icon viewBox normalized to the drawing's ink bbox (measured once, cached),
// so every icon renders at the same visual size regardless of how much of the
// 24x24 canvas its paths cover
const _iconVB={};
function _vbFor(id){
  if(_iconVB[id]) return _iconVB[id];
  let vb='0 0 24 24';
  try{
    const host=document.createElement('div');
    host.style.cssText='position:absolute;left:-9999px;top:0;visibility:hidden;';
    host.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24"><g>'+ICONS[id]+'</g></svg>';
    document.body.appendChild(host);
    const b=host.querySelector('g').getBBox(); host.remove();
    if(b && b.width>0 && b.height>0){
      const pad=1.6, s=Math.max(b.width,b.height)+pad*2, cx=b.x+b.width/2, cy=b.y+b.height/2;
      vb=(cx-s/2).toFixed(2)+' '+(cy-s/2).toFixed(2)+' '+s.toFixed(2)+' '+s.toFixed(2);
    }
  }catch(e){}
  _iconVB[id]=vb; return vb;
}
function iconSvg(id){ const p=ICONS[id];
  if(!p){
    const src=(typeof PASSIVES!=='undefined'&&PASSIVES.find(x=>x.id===id))||(typeof WEAPONS!=='undefined'&&WEAPONS.find(x=>x.id===id));
    const g=src?src.g:'✦';
    const c=(typeof GLYPH_COL!=='undefined'&&GLYPH_COL[id])||'currentColor';
    return '<span style="font-size:inherit;line-height:1;color:'+c+';text-shadow:0 0 8px '+c+'">'+g+'</span>';
  }
  return '<svg viewBox="'+_vbFor(id)+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'; }
const PROJ_FX={
  coil: l=>'Lash '+(180+l*40)+'% dmg / '+(1.6-l*0.12).toFixed(1)+'s',
  mortar: l=>(90+l*20)+'% blast, '+(70+l*12)+'px',
  lantern: l=>(1+Math.floor(l/2))+' snipe bolt'+(l>=2?'s':'')+' / '+(1.4-l*0.1).toFixed(1)+'s',
  fangs: l=>(2+l)+' hunting spirits',
  bell: l=>'Toll '+(130+l*20)+'px / '+(4.0-l*0.35).toFixed(1)+'s',
  dice: l=>'Ricochets ×'+(2+l),
  phantom: l=>'Wave pierces '+(4+l),
  coffin: l=>(2+l)+' rear nails',
  moths: l=>'Moth / '+(1.1-l*0.08).toFixed(1)+'s',
  dmg:  l=>'+'+(5*l)+' Attack',
  fire: l=>'+'+(+(0.25*l).toFixed(2))+' Fire Rate',
  spd:  l=>'+'+(20*l)+' Move Speed',
  hp:   l=>'+'+(30*l)+' Max HP',
  luck: l=>'+'+(6*l)+'% Crit · +'+(18*l)+'% Coins',
  proj: l=>'+'+l+' Projectile'+(l>1?'s':''),
  pierce: l=>'Pierces +'+l+' foes',
  mag:  l=>'+'+(40*l)+' Pickup',
  regen: l=>'+'+l+' HP / sec',
  exec: l=>'×'+(+(2+0.4*l).toFixed(1))+' Crit Damage',
  bolt: l=>'Fires '+((l>=2?1:0)+(l>=4?1:0)+(l>=6?1:0)+1)+' bolts'+(l>=3?', piercing':''),
  cards: l=>(3+l)+'-card piercing fan',
  orbit: l=>l+' orbiting chip'+(l>1?'s':''),
  scythe: l=>Math.round(100+30*l)+'% reach scythe',
  spark: l=>'Chain to '+(l+1)+' foes',
  chand: l=>'Smite every '+(2.8-l*0.25).toFixed(1)+'s',
  knives: l=>(4+l)+' knives / volley',
  aura: l=>'Aura radius '+(90+l*14),
  nova: l=>'Nova every '+(3.2-l*0.3).toFixed(1)+'s',
  seeker: l=>(1+l)+' homing skull'+((1+l)>1?'s':'')
};
function skLevel(def){ return WEAPONS.some(w=>w.id===def.id) ? (P.wlv[def.id]||0) : skillLevel(def.id); }
function projFx(def, level){ const f=PROJ_FX[def.id]; const lv=Math.max(1, Math.min(def.max, level)); return f? f(lv) : shortFx(def); }
function rollGain(r){ return r>=3 ? 2 : 1; }
const MAXROLL=4;
function shinyWord(){ return SHINY[(Math.random()*SHINY.length)|0]; }
function closeSlot(){
  endSeance();
  stopDrone();
  slotStage='idle';
  spaceHold=false; holdProg=0; holdFired=false; ringShow(false);
  dice.forEach(d=>{ if(d.el) d.el.classList.remove('rolling','settle','crit'); });
  $('machine').classList.remove('win','jackpot','bust','pulling');
  elSlot.classList.add('hidden'); elSlot.classList.remove('lastrites');
  if(pending.length){ setTimeout(openNextSlot,250); }
  else { state='playing'; last=performance.now(); }
}
