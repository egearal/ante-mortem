"use strict";
 let markerRef=null;

/* ============================================================
   DEATH + LEADERBOARD
   ============================================================ */
function computeScore(){ return Math.floor(gt*7 + P.kills*6 + P.coins*3 + P.level*45); }
async function die(){
  if(state==='dead'||state==='marker') return;
  if(!P.markerUsed){ P.markerUsed=true; LT.markers=(LT.markers||0)+1; bump('markers',LT.markers); markerSpin(); return; }
  actuallyDie();
}
/* THE FINAL PRESS — no gold at the door. 35% to live; mash SPACE for 3.2 seconds, every press buys +0.5-1.5%, cap 50%. */
function markerSpin(){
  state='marker'; stopDrone(); try{ keys.clear(); }catch(e){}
  const l=$('jackpotLayer'), t=$('jackpotText');
  l.classList.remove('hidden');
  const base=Math.min(0.46, 0.35+(P.pressBase||0));
  const mk={p:base, base, max:0.50+0.02*vlv('marker')+(P.pressCap||0), presses:0, window:3.2, t0:performance.now(), phase:'press', resolved:false}; // 5 seals = 60.000%
  markerRef=mk;
  t.textContent='PRESS FOR YOUR LIFE'; t.className='jackpotText marker'; t.style.color='#e8b64c';
  // marquee bulbs circle the meter, casino-style
  let fr=$('fpRing');
  if(!fr){ fr=document.createElement('div'); fr.id='fpRing'; l.appendChild(fr);
    for(let i=0;i<26;i++){ const b=document.createElement('div'); b.className='bulb chase';
      const a=i/26*6.283; b.style.left=(50+Math.cos(a)*48)+'%'; b.style.top=(50+Math.sin(a)*46)+'%';
      b.style.animationDelay=((i%13)*0.104)+'s'; fr.appendChild(b); } }
  fr.style.display='';
  const sub=$('jackpotSub'); sub.classList.remove('hidden'); renderPressMeter();
  SFX.riser(); SFX.murmur(); flash(0.4,'#8b1620'); shake=Math.min(16,shake+8);
  mk._iv=setInterval(()=>{
    if(mk.phase!=='press'){ clearInterval(mk._iv); return; }
    const left=mk.window-(performance.now()-mk.t0)/1000;
    if(left<=0 || mk.p>=mk.max){ clearInterval(mk._iv); startFlicker(mk); }
    else renderPressMeter();
  }, 50);
}
function renderPressMeter(){
  const mk=markerRef; if(!mk||mk.phase!=='press') return;
  const left=Math.max(0,mk.window-(performance.now()-mk.t0)/1000);
  // the number physically GROWS with every press (42 -> 64px) and the bulbs
  // chase faster the closer you get to the cap — ascent-grade escalation
  const fsz=42+Math.min(22, mk.presses*1.2);
  { const fr9=$('fpRing'); if(fr9) fr9.style.setProperty('--chase', Math.max(0.45, 1.35-((mk.p-mk.base)/(mk.max-mk.base))*0.9).toFixed(2)+'s'); }
  $('jackpotSub').innerHTML=
    '<div class="fpPct" style="font-size:'+fsz.toFixed(1)+'px">'+(mk.p*100).toFixed(3)+'<i>%</i> TO LIVE</div>'
    +'<div class="fpBar"><i style="width:'+Math.min(100,(mk.p-mk.base)/(mk.max-mk.base)*100)+'%"></i></div>'
    +'<div class="fpTime"><i style="width:'+(left/mk.window*100)+'%"></i></div>'
    +'<div class="fpHint"><span class="keyhint">SPACE</span> PRESS · PRESS · PRESS</div>';
}
function pressFx(mk){
  tone(660*Math.pow(1.0595,Math.min(24,mk.presses)),0.07,'sine',0.11);
  tone(1320*Math.pow(1.0595,Math.min(24,mk.presses)),0.05,'sine',0.05);
  sparkBurstAt('jackpotText','jackpotLayer',8); shake=Math.min(10,shake+2);
  { const l9=$('jackpotLayer'); const wv=document.createElement('span'); wv.className='fpWave';
    l9.appendChild(wv); setTimeout(()=>wv.remove(),520); }
  if(mk.p>=mk.max){ SFX.seraph(); SFX.dingBells(); flash(0.5,'#ffd36b'); sparkBurstAt('jackpotText','jackpotLayer',30); domConfetti(18,'jackpotLayer');
    $('jackpotText').textContent='◈ MAX ◈'; $('jackpotText').style.color='#ffd36b'; }
}
/* THE DEATH ROLL — a number tumbles 0-100 and lands. Roll ≤ your % and you live. The math is felt. */
function startFlicker(mk){
  mk.phase='flicker';
  const l=$('jackpotLayer'), t=$('jackpotText');
  const pPct=mk.p*100;
  $('jackpotSub').innerHTML='<div class="fpPct big">'+pPct.toFixed(3)+'<i>%</i> TO LIVE</div><div class="fpHint">THE HOUSE ROLLS…</div>';
  t.className='jackpotText marker';
  const roll=Math.random()*100; // the truth, decided now
  mk.roll=roll; mk.margin=pPct-roll; RUN.rollMargin=mk.margin;
  let n=0, N=16;
  const step=()=>{
    n++;
    const flick = n<N ? Math.random()*100 : roll;
    const green = flick<=pPct;
    t.textContent=flick.toFixed(3);
    t.style.color=green?'#8bff9a':'#ff5560';
    t.classList.remove('tickPop'); void t.offsetWidth; t.classList.add('tickPop');
    SFX.selectorTick(Math.min(6,Math.floor(n/2)+1)); shake=Math.min(14,shake+2); sparkBurstAt('jackpotText','jackpotLayer',6); flash(0.12, green?'#1c4a28':'#4a0a10');
    if(n<N){ setTimeout(step, 55+n*24); }
    else {
      mk.resolved=true;
      const win=roll<=pPct;
      $('jackpotSub').innerHTML='<div class="fpPct big" style="color:'+(win?'#8bff9a':'#ff5560')+'">ROLL '+roll.toFixed(3)+' '+(win?'≤':'>')+' '+pPct.toFixed(3)+'</div>'
        +'<div class="fpHint" style="color:'+(win?'#8bff9a':'#ff5560')+'">'+(win?'THE HOUSE GRANTS A MARKER':'THE HOUSE COLLECTS')+'</div>';
      t.textContent=roll.toFixed(3);
      t.style.color=win?'#8bff9a':'#ff5560';
      if(win){ SFX.dingBells(); SFX.cashout(); coinRain(24); flash(0.5,'#8bff9a'); sparkBurstAt('jackpotText','jackpotLayer',36); domConfetti(24,'jackpotLayer');
        setTimeout(()=>{ l.classList.add('hidden'); t.style.color=''; $('jackpotSub').classList.add('hidden'); { const fr9=$('fpRing'); if(fr9) fr9.style.display='none'; }
          LT.markerWins=(LT.markerWins||0)+1; if(LT.markerWins>=2) secret('debtor','DEATH\'S DEBTOR');
          P.hp=Math.max(P.hp,P.maxHp*0.5); P.inv=2.5; state='playing';
          ring(P.x,P.y,260,'#8bff9a'); ring(P.x,P.y,170,'#ffd36b'); shake=Math.min(20,shake+10);
          for(const e of enemies){ const dd=Math.hypot(e.x-P.x,e.y-P.y); if(dd<260 && !e.boss){ const kd=Math.max(1,dd); e.kx+=(e.x-P.x)/kd*520; e.ky+=(e.y-P.y)/kd*520; e.hp-=60; e.flash=0.12; } }
          showStreak('✦ ONE MORE HAND ✦');
        },1500);
      } else { SFX.bust(); flash(0.55,'#8b1620');
        setTimeout(()=>{ l.classList.add('hidden'); t.style.color=''; $('jackpotSub').classList.add('hidden'); { const fr9=$('fpRing'); if(fr9) fr9.style.display='none'; } actuallyDie(); },1500); }
    }
  };
  setTimeout(step, 420);
}
async function actuallyDie(){
  if(state==='dead') return;
  // the door opens FIRST — no recap decoration may ever stand between a corpse and its ledger
  state='dead'; try{ keys.clear(); }catch(e){}
  elGO.classList.remove('hidden');
  if(P.coins===0) secret('broke','BROKE AT THE END');
  { const g6=Math.floor(gt); if(g6>=425&&g6<=427) secret('sixsix',"THE BEAST'S HOUR"); }
  if(gt>=900 && (P._lastHurtGt===undefined || gt-P._lastHurtGt>=60)) secret('untouched60','THE UNTOUCHED MINUTE');
  if(P.coins>=500) secret('unspent','UNSPENT');
  if((gt-(window._gt0||0))<30) secret('mayfly','THE MAYFLY');
  if(gt>=899) secret('fullnight','THE FULL NIGHT');
  if(gt>=899 && !P._houseHurt){ const had=SEC.has('deathless'); secret('deathless','DEATHLESS');
    if(!had && SEC.has('deathless')){ gilt+=975; saveGilt(); setTimeout(()=>announce('♛ DEATHLESS — THE HOUSE PAYS 1,000 GILT ♛',true),1200); } }
  stopDrone(); SFX.death(); shake=18; flash(0.6,'#8b1620');
  const score=computeScore(), giltEarned=Math.floor(score/40);
  gilt+=giltEarned; saveGilt();
  LT.deaths++; bump('deaths',LT.deaths);
  LT.gilt+=giltEarned; bump('gilt',LT.gilt);
  bump('score',score); recCheck('score',score,'Score');
  // THE BOOKS — where did tonight land, all-time?
  const mkFinal=Math.round((P.kills + wave*12 + P.level*10 + giltEarned*2)*(window._markMult||1));
  const plc={ kills:rec10Place('kills',P.kills), dmg:rec10Place('dmg',Math.round(P.dmgDealt||0)),
    streak:rec10Place('streak',P.bestStreak||0), level:rec10Place('level',P.level),
    time:rec10Place('time',Math.round(gt)), marks:rec10Place('marks',mkFinal) };
  saveAch();
  const newBest = score>best; if(newBest) best=score;
  $('goResult').textContent = newBest? 'A RECORD IN BLOOD' : 'YOU BLINKED OUT';
  { const by=(gt>=900)?'THE FORECLOSURE':(window._hitBy||'').toUpperCase();
    $('goSub').textContent = (newBest? 'The court will remember this run.' : 'The house collects its due.')+(by?(' — taken by '+by):''); }
  quillFlick();
  // THE RECKONING — stat rows slam in with rising dings, everything skippable, back in the pit in seconds
  const abbrev=v=>v>=10000?(v/1000).toFixed(1)+'k':Math.round(v).toLocaleString();
  const stats=[
    ['☠','SLAIN',P.kills,plc.kills],
    ['⚔','DAMAGE',abbrev(P.dmgDealt||0),plc.dmg],
    ['🔥','BEST STREAK',P.bestStreak||0,plc.streak],
    ['⚜','LEVEL',P.level,plc.level],
    ['⏱','TIME',fmt(gt),plc.time],
    ['◈','MARKS',mkFinal.toLocaleString(),plc.marks]
  ];
  const placedN=stats.filter(s=>s[3]>0).length;
  const gs=$('goStats'); if(gs) gs.innerHTML='';
  window._recapT0=performance.now(); window._recapDone=false; window._recapFast=false;
  const addRow=(s,i,instant)=>{ if(!gs) return; const d=document.createElement('div'); d.className='gsRow'+(instant?' now':'');
    const bd=s[3]?('<em class="rk10 '+(s[3]===1?'rk1':s[3]===2?'rk2':s[3]===3?'rk3b':'rkX')+'">#'+s[3]+' ALL-TIME</em>'):'';
    d.innerHTML='<b>'+s[0]+'</b><span>'+s[1]+'</span><i>'+s[2]+bd+'</i>'; gs.appendChild(d);
    if(!instant){ SFX.dingHit(Math.min(6,i+1)); sparkBurst(6);
      if(s[3]===1){ SFX.rarSting(5); flash(0.4,'#ffd36b'); sparkBurst(30); shake=Math.min(16,shake+7); }
      else if(s[3]&&s[3]<=3){ SFX.dingBells(); flash(0.22,'#e8e2d0'); } } };
  const tms=stats.map((s,i)=>setTimeout(()=>addRow(s,i,false), 250+i*170));
  tms.push(setTimeout(()=>{ window._recapDone=true;
    if(placedN>0 && gs){ const sm=document.createElement('div'); sm.className='gsSum';
      sm.textContent='✦ '+placedN+' ALL-TIME MARK'+(placedN>1?'S':'')+' SET TONIGHT ✦'; gs.appendChild(sm);
      SFX.cashout(); if(stats.some(s=>s[3]===1)) domConfetti(26,'gameover'); }
  }, 250+stats.length*170+150));
  window._recapSkip=()=>{ tms.forEach(clearTimeout); if(gs) gs.innerHTML=''; stats.forEach((s,i)=>addRow(s,i,true)); window._recapFast=true; window._recapDone=true;
    $('goScore').textContent=score.toLocaleString(); $('goGilt').textContent=giltEarned.toLocaleString(); SFX.coinPling(); };
  // the tally ticks up like a payout counter
  const countUp=(el,target,dur)=>{ const t0=performance.now(); let lastTick=0;
    const tick=()=>{ if(window._recapFast){ el.textContent=target.toLocaleString(); return; }
      const f=Math.min(1,(performance.now()-t0)/dur), e=1-Math.pow(1-f,3);
      const v=Math.round(target*e); el.textContent=v.toLocaleString();
      if(performance.now()-lastTick>45 && f<1){ lastTick=performance.now(); tone(600+e*900,0.025,'square',0.045); }
      if(f<1) setTimeout(tick,16); else { el.textContent=target.toLocaleString(); SFX.coinPling(); } };
    tick(); };
  countUp($('goScore'), score, 1200);
  countUp($('goGilt'), giltEarned, 900); $('goGiltTotal').textContent=gilt;
  // THE LEDGER — the whole run at a glance: wave, arsenal, skills, wounds, the dice record, the best pull
  { const gl=$('goLedger');
    if(gl){
      const wchips=WEAPONS.filter(w=>(P.wlv[w.id]||0)>0).map(w=>'<span class="glChip" style="color:'+(GLYPH_COL[w.id]||'#e8d9b0')+'">'+w.g+'<i>'+(P.wlv[w.id]||0)+'</i></span>').join('');
      const schips=(P.passiveList||[]).map(r=>'<span class="glChip" style="color:'+(GLYPH_COL[r.id]||'#8bff9a')+'">'+r.g+'<i>'+r.count+'</i></span>').join('');
      const bp=RUN.bestPull;
      const lo9=(typeof curSoul==='function')?(curSoul().g+' '+curSoul().n+' · '+curFloor().g+' '+curFloor().n+((IDX.ct||[]).length?' · ✍ '+(IDX.ct||[]).length+' CONTRACT'+((IDX.ct||[]).length>1?'S':''):'')):'';
      gl.innerHTML=
        (lo9?'<div class="glRow" style="color:#c9b78e;letter-spacing:.12em">'+lo9+'</div>':'')+
        '<div class="glRow"><span>WAVE</span><b>'+wave+'</b><span>CURSES</span><b>'+(RUN.curses||0)+'</b><span>SCARS</span><b>'+((P.scars||[]).length)+'</b><span>DICE</span><b>'+RUN.diceWins+'/'+RUN.diceTries+'</b>'
        +(bp?'<span>BEST PULL</span><b style="color:'+RARC[bp]+'">'+SLOT_RAR[bp]+'</b>':'')+'</div>'
        +(wchips?'<div class="glRow glChips">'+wchips+'</div>':'')
        +(schips?'<div class="glRow glChips">'+schips+'</div>':'');
    } }
  // LUCK — the verdict of the night, in seven grades
  { const lk=$('goLuck');
    if(lk){ const v=luckVerdict();
      setTimeout(()=>{ lk.innerHTML='LUCK: <b style="color:'+v.col+'">'+v.grade+'</b>'; lk.classList.remove('go'); void lk.offsetWidth; lk.classList.add('go');
        SFX.rarSting(v.tier); }, 1450); } }
  { const mk9=P.kills + wave*12 + P.level*10 + giltEarned*2;
    const res=awardMarks(Math.round((mk9)*(window._markMult||1)));
    let rl=$('goRank'); if(!rl){ rl=document.createElement('div'); rl.id='goRank'; $('goLuck').parentNode.insertBefore(rl,$('goLuck').nextSibling); }
    rl.innerHTML='<div class="rkTop">HOUSE RANK '+RANK.rank+' — '+RANKS[RANK.rank-1].n+(res.up?' <span class="rkUp">RANK UP!</span>':'')+'</div>'
      +'<div class="rkBar"><i style="width:'+res.pct+'%"></i></div>'
      +'<div class="rkSub">+'+mk9+' MARKS · '+res.have+' / '+res.need+' TO '+(RANKS[RANK.rank]?RANKS[RANK.rank].n:'THE SUMMIT')+(res.up&&res.reward?' · <span class="rkUn">UNLOCKED: '+res.reward+'</span>':'')+'</div>'
      +(RANKS[RANK.rank]&&RANKS[RANK.rank].r?'<div class="rkNext">NEXT: '+RANKS[RANK.rank].r+' — '+(res.need-res.have)+' MARKS AWAY</div>':'');
    if(res.up){ SFX.seraph(); SFX.dingBells(); flash(0.5,'#ffd36b'); coinRain(22); }
  }
}
/* the LUCK math: how the night's RNG treated you, normalized across dice, pulls, wheel, ascent, and the death roll */
function luckVerdict(){
  let score=0, events=0;
  if(RUN.diceTries>0){ score+=(RUN.diceWins-RUN.diceP)/Math.sqrt(Math.max(1,RUN.diceTries))*1.6; events+=RUN.diceTries; }
  { const tv={common:0,uncommon:0.5,rare:1.2,epic:2.4,legendary:5}; let n=0,s=0;
    for(const k in RUN.pulls){ n+=RUN.pulls[k]; s+=RUN.pulls[k]*tv[k]; }
    if(n>0){ score+=(s/n-0.581)*Math.min(2,Math.sqrt(n))*0.9; events+=n; } }
  { const wv={blue:0,purple:1,pink:2.5,red:4,gold:6}; let s=0;
    RUN.wheelCs.forEach(c=>s+=(wv[c]||0)-0.485);
    if(RUN.wheelCs.length) { score+=s/Math.sqrt(RUN.wheelCs.length)*0.7; events+=RUN.wheelCs.length; } }
  { let s=0; RUN.crashPts.forEach(cp=>s+=(cp-2.11)/2);
    if(RUN.crashPts.length){ score+=s/Math.sqrt(RUN.crashPts.length)*0.8; events+=RUN.crashPts.length; } }
  if(RUN.rollMargin!==null){ score+=RUN.rollMargin>0?0.5:-0.5; events+=1; }
  if(events<3) return {grade:'EVEN', col:'#bfae8c', tier:1};
  const G=[[-2,'EXTREMELY UNLUCKY','#ff3040',0],[-1.2,'UNLUCKY','#ff5560',0],[-0.4,'A LITTLE UNLUCKY','#c98b7e',0],[0.4,'EVEN','#bfae8c',1],[1.2,'LUCKY','#8bff9a',2],[2,'VERY LUCKY','#ffd36b',4],[Infinity,'EXTREMELY LUCKY','#fff2c0',5]];
  for(const [th,grade,col,tier] of G){ if(score<th || th===Infinity) return {grade,col,tier}; }
  return {grade:'EVEN', col:'#bfae8c', tier:1};
}

// THE BOOKS — six ledgers, ten nights each. Opened from the death screen and the INDEX.
function openBooks(){
  let p=$('booksPanel');
  if(!p){ p=document.createElement('div'); p.id='booksPanel'; p.className='layer hidden';
    p.innerHTML='<div class="panel" style="max-width:min(920px,94vw);max-height:86vh;display:flex;flex-direction:column;">'
      +'<h2 style="font-family:var(--disp);color:var(--gold-bright);letter-spacing:.14em;margin:0 0 4px;">📖 THE BOOKS</h2>'
      +'<div style="color:#a99;font-size:11px;letter-spacing:.12em;margin-bottom:10px;">TEN NIGHTS THE HOUSE COULD NOT FORGET — PER LEDGER</div>'
      +'<div id="booksBody" style="overflow-y:auto;flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;text-align:left;"></div>'
      +'<button class="btn" id="booksClose" style="margin-top:12px;">Back</button></div>';
    document.body.appendChild(p);
    $('booksClose').addEventListener('click',()=>{ p.classList.add('hidden'); SFX.casinoDing(); });
  }
  const names={kills:'☠ SLAIN', dmg:'⚔ DAMAGE', streak:'🔥 STREAK', level:'⚜ LEVEL', time:'⏱ TIME', marks:'◈ MARKS'};
  const fv=(k,v)=> k==='time'?fmt(v):(v>=10000?(v/1000).toFixed(1)+'k':v.toLocaleString());
  $('booksBody').innerHTML=Object.keys(names).map(k=>{
    const a=REC10[k]||[];
    return '<div class="bkCol"><div class="bkH">'+names[k]+'</div>'
      +(a.length? a.map((e,i)=>'<div class="bkRow'+(i===0?' top':'')+'"><b>#'+(i+1)+'</b><i>'+fv(k,e.v)+'</i><span>'+e.d+'</span></div>').join('')
                : '<div class="bkRow none">no nights recorded</div>')
      +'</div>';
  }).join('');
  p.classList.remove('hidden'); SFX.uiDing();
}

// the quill — a tiny corner flick whenever the ledger writes itself
function quillFlick(){
  let q=$('quill');
  if(!q){ q=document.createElement('div'); q.id='quill'; q.textContent='✒'; document.body.appendChild(q); }
  q.classList.remove('on'); void q.offsetWidth; q.classList.add('on');
}
