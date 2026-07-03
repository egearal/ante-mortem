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
  state='marker'; stopDrone();
  const l=$('jackpotLayer'), t=$('jackpotText');
  l.classList.remove('hidden');
  const base=Math.min(0.44, 0.35+0.03*vlv('marker'));
  const mk={p:base, base, max:0.50, presses:0, window:3.2, t0:performance.now(), phase:'press', resolved:false};
  markerRef=mk;
  t.textContent='PRESS FOR YOUR LIFE'; t.className='jackpotText marker'; t.style.color='#e8b64c';
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
  $('jackpotSub').innerHTML=
    '<div class="fpPct">'+Math.round(mk.p*100)+'<i>%</i> TO LIVE</div>'
    +'<div class="fpBar"><i style="width:'+Math.min(100,(mk.p-mk.base)/(mk.max-mk.base)*100)+'%"></i></div>'
    +'<div class="fpTime"><i style="width:'+(left/mk.window*100)+'%"></i></div>'
    +'<div class="fpHint"><span class="keyhint">SPACE</span> PRESS · PRESS · PRESS</div>';
}
function pressFx(mk){
  tone(660*Math.pow(1.0595,Math.min(24,mk.presses)),0.07,'sine',0.11);
  tone(1320*Math.pow(1.0595,Math.min(24,mk.presses)),0.05,'sine',0.05);
  sparkBurst(6); shake=Math.min(10,shake+2);
  if(mk.p>=mk.max){ SFX.seraph(); SFX.dingBells(); flash(0.5,'#ffd36b'); sparkBurst(30);
    $('jackpotText').textContent='◈ MAX ◈'; $('jackpotText').style.color='#ffd36b'; }
}
function startFlicker(mk){
  mk.phase='flicker';
  const l=$('jackpotLayer'), t=$('jackpotText');
  $('jackpotSub').innerHTML='<div class="fpPct big">'+Math.round(mk.p*100)+'<i>%</i> TO LIVE</div>';
  let n=0, N=14;
  const step=()=>{
    n++;
    const showLive=n%2===0;
    t.textContent=showLive?'LIVE':'DIE'; t.className='jackpotText marker'; t.style.color=showLive?'#8bff9a':'#ff5560';
    t.classList.remove('tickPop'); void t.offsetWidth; t.classList.add('tickPop');
    SFX.selectorTick(Math.min(6,Math.floor(n/2)+1)); shake=Math.min(14,shake+2); sparkBurst(6); flash(0.12, showLive?'#1c4a28':'#4a0a10');
    if(n<N){ setTimeout(step, 60+n*26); }
    else {
      mk.resolved=true;
      const win=Math.random()<mk.p;
      t.textContent=win?'THE HOUSE GRANTS A MARKER':'THE HOUSE COLLECTS';
      t.style.color=win?'#8bff9a':'#ff5560';
      if(win){ SFX.dingBells(); SFX.cashout(); coinRain(24); flash(0.5,'#8bff9a'); sparkBurst(36);
        setTimeout(()=>{ l.classList.add('hidden'); t.style.color=''; $('jackpotSub').classList.add('hidden');
          LT.markerWins=(LT.markerWins||0)+1; if(LT.markerWins>=2) secret('debtor','DEATH\'S DEBTOR');
          P.hp=Math.max(P.hp,P.maxHp*0.5); P.inv=2.5; state='playing';
          ring(P.x,P.y,260,'#8bff9a'); ring(P.x,P.y,170,'#ffd36b'); shake=Math.min(20,shake+10);
          for(const e of enemies){ const dd=Math.hypot(e.x-P.x,e.y-P.y); if(dd<260 && !e.boss){ const kd=Math.max(1,dd); e.kx+=(e.x-P.x)/kd*520; e.ky+=(e.y-P.y)/kd*520; e.hp-=60; e.flash=0.12; } }
          showStreak('✦ ONE MORE HAND ✦');
        },1400);
      } else { SFX.bust(); flash(0.55,'#8b1620');
        setTimeout(()=>{ l.classList.add('hidden'); t.style.color=''; $('jackpotSub').classList.add('hidden'); actuallyDie(); },1400); }
    }
  };
  setTimeout(step, 420);
}
async function actuallyDie(){
  if(state==='dead') return;
  if(P.coins===0) secret('broke','BROKE AT THE END');
  state='dead'; stopDrone(); SFX.death(); shake=18; flash(0.6,'#8b1620');
  const score=computeScore(), giltEarned=Math.floor(score/40);
  gilt+=giltEarned; saveGilt();
  LT.deaths++; bump('deaths',LT.deaths);
  LT.gilt+=giltEarned; bump('gilt',LT.gilt);
  bump('score',score); recCheck('score',score,'Score');
  saveAch();
  const newBest = score>best; if(newBest) best=score;
  $('goResult').textContent = newBest? 'A RECORD IN BLOOD' : 'YOU BLINKED OUT';
  $('goSub').textContent = newBest? 'The court will remember this run.' : 'The house collects its due.';
  // THE RECKONING — stat rows slam in with rising dings, everything skippable, back in the pit in seconds
  const abbrev=v=>v>=10000?(v/1000).toFixed(1)+'k':Math.round(v).toLocaleString();
  const stats=[
    ['☠','SLAIN',P.kills],
    ['⚔','DAMAGE',abbrev(P.dmgDealt||0)],
    ['🔥','BEST STREAK',P.bestStreak||0],
    ['⚜','LEVEL',P.level],
    ['⏱','TIME',fmt(gt)]
  ];
  const gs=$('goStats'); if(gs) gs.innerHTML='';
  window._recapT0=performance.now(); window._recapDone=false; window._recapFast=false;
  const addRow=(s,i,instant)=>{ if(!gs) return; const d=document.createElement('div'); d.className='gsRow'+(instant?' now':'');
    d.innerHTML='<b>'+s[0]+'</b><span>'+s[1]+'</span><i>'+s[2]+'</i>'; gs.appendChild(d);
    if(!instant){ SFX.dingHit(Math.min(6,i+1)); sparkBurst(6); } };
  const tms=stats.map((s,i)=>setTimeout(()=>addRow(s,i,false), 250+i*170));
  tms.push(setTimeout(()=>{ window._recapDone=true; }, 250+stats.length*170+150));
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
  $('goPctl').textContent='Tallying the ledger…';
  { const mk9=P.kills + wave*12 + P.level*10 + giltEarned*2;
    const res=awardMarks(mk9);
    let rl=$('goRank'); if(!rl){ rl=document.createElement('div'); rl.id='goRank'; $('goPctl').parentNode.insertBefore(rl,$('goPctl')); }
    rl.innerHTML='<div class="rkTop">HOUSE RANK '+RANK.rank+' — '+RANKS[RANK.rank-1].n+(res.up?' <span class="rkUp">RANK UP!</span>':'')+'</div>'
      +'<div class="rkBar"><i style="width:'+res.pct+'%"></i></div>'
      +'<div class="rkSub">+'+mk9+' MARKS · '+res.have+' / '+res.need+' TO '+(RANKS[RANK.rank]?RANKS[RANK.rank].n:'THE SUMMIT')+(res.up&&res.reward?' · <span class="rkUn">UNLOCKED: '+res.reward+'</span>':'')+'</div>'
      +(RANKS[RANK.rank]&&RANKS[RANK.rank].r?'<div class="rkNext">NEXT: '+RANKS[RANK.rank].r+' — '+(res.need-res.have)+' MARKS AWAY</div>':'');
    if(res.up){ SFX.seraph(); SFX.dingBells(); flash(0.5,'#ffd36b'); coinRain(22); }
  }
  $('board').innerHTML='';
  elGO.classList.remove('hidden');
  const nameEl=$('nameInput'); nameEl.value = (localStorage_name())||'';
  // submit
  const entry={n:(nameEl.value||'VESPER').toUpperCase().slice(0,12),s:score,t:Math.floor(gt),k:P.kills,d:new Date().toISOString()};
  pendingEntry=entry;
  const res=await submitScore(entry);
  renderBoard(res.board,res,entry);
}
