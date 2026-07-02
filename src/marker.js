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
function markerSpin(){
  state='marker'; stopDrone();
  const l=$('jackpotLayer'), t=$('jackpotText');
  l.classList.remove('hidden');
  let n=0, N=14;
  const g0=gilt, c1=Math.ceil(g0*0.30), c2=Math.ceil(g0*0.30);
  const mk={p:0.30+0.05*vlv('marker'), tier:0, resolved:false, g0:g0,
    costs:[g0>0?Math.max(1,c1):0, g0>0?Math.max(1,c2):0, Math.max(0,g0-c1-c2)]}; markerRef=mk;
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
  SFX.riser(); SFX.murmur(); t.textContent='THE HOUSE CONSIDERS…'; t.className='jackpotText marker'; t.style.color='#e8b64c';
  const sub=$('jackpotSub'); sub.innerHTML=mkBribeLine(mk.p,0); sub.classList.remove('hidden');
  flash(0.4,'#8b1620'); shake=Math.min(16,shake+8);
  setTimeout(step, 750);
}
async function actuallyDie(){
  if(state==='dead') return;
  if(P.coins===0) secret('broke','BROKE AT THE END');
  state='dead'; stopDrone(); SFX.death(); shake=18; flash(0.6,'#8b1620');
  const score=computeScore(), giltEarned=Math.floor(score/50);
  gilt+=giltEarned; saveGilt();
  LT.deaths++; bump('deaths',LT.deaths);
  LT.gilt+=giltEarned; bump('gilt',LT.gilt);
  bump('score',score); recCheck('score',score,'Score');
  saveAch();
  const newBest = score>best; if(newBest) best=score;
  $('goResult').textContent = newBest? 'A RECORD IN BLOOD' : 'YOU BLINKED OUT';
  $('goSub').textContent = newBest? 'The court will remember this run.' : 'The house collects its due.';
  $('goScore').textContent=score.toLocaleString();
  $('goTime').textContent=fmt(gt); $('goKills').textContent=P.kills; $('goLevel').textContent=P.level;
  $('goGilt').textContent=giltEarned; $('goGiltTotal').textContent=gilt;
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
