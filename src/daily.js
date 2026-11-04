"use strict";
/* ==== B1 — DAILY DEBT ====
   One seeded night per UTC day, identical for every player in the world. The
   first attempt of the day is SCORED; any further attempt is PRACTICE.
   - seed: the UTC date YYYYMMDD. startGame() calls dlyBegin(), which arms
     DLY_RNG (core.js) only when the plaque was played; rng(stream) then serves
     one mulberry32 stream per system. Normal nights never touch it.
   - terms: a name + 1-2 modifiers + a fixed soul and floor, drawn from the seed.
   - fair field: no vault seals, rank perks, favors, contracts or indulgences
     (guards live at the call sites, each tagged B1). The whole armory is open.
   - persistence: NEW additive key am_daily_v1 (per-day results, best, streak).
   - ledger: a DAILY DEBT band + the share line/card variant (wraps A3's helpers).
   Loaded LAST (after ui.js), so it may wrap globals that were declared earlier. */
const DLY_KEY='am_daily_v1';
const DLY_EPOCH=Date.UTC(2026,10,5); // 2026-11-05 is DAILY DEBT #1
const DLY={ next:null, on:false, day:0, terms:null, scored:false, done:false,
  data:{v:1, days:{}, bestT:0, bestDay:0, streak:0, lastDay:0},
  track:[], _min:0, _tr3:0, _pairs:0, _boss:0, _seq:0 };

/* ---------- the calendar ---------- */
function dlyDayKey(ms){ const d=new Date(ms); return d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate(); }
function dlyToday(){ return (window._dlyDay|0) || dlyDayKey(Date.now()); } // _dlyDay: probe override
function dlyMs(day){ return Date.UTC(Math.floor(day/10000), Math.floor(day/100)%100-1, day%100); }
function dlyNum(day){ return Math.round((dlyMs(day)-DLY_EPOCH)/86400000)+1; }
function dlyPrev(day){ return dlyDayKey(dlyMs(day)-86400000); }
function dlyLeft(){ const now=Date.now(); const nx=dlyMs(dlyDayKey(now))+86400000; return Math.max(0, nx-now); }
function dlyClock(ms){ const s=Math.floor(ms/1000), h=Math.floor(s/3600), m=Math.floor(s/60)%60, x=s%60; return h+':'+(m<10?'0':'')+m+':'+(x<10?'0':'')+x; }

/* ---------- the terms of the debt ---------- */
const DLY_NOUN=['DEBT','MARKER','TAB','LIEN','TITHE','BOND','NOTE','WAGER','PROMISE','RECKONING'];
const DLY_ORD=['FIRST','SECOND','THIRD','FOURTH','FIFTH','SIXTH','SEVENTH','NINTH','THIRTEENTH','LAST'];
const DLY_WHO=['WIDOW','BISHOP','CROUPIER','HANGMAN','DUCHESS','GRAVEDIGGER','MAGPIE','ORPHAN','HEIR','JESTER','ABBESS','LAMPLIGHTER','DROWNED SAILOR','PAWNBROKER','SEXTON','VIOLINIST'];
// every modifier reuses a mechanic the game already has (contracts, floors, indulgences, souls)
const DLY_MODS=[
 {id:'pairs',    k:'hard', g:'☠', n:'elites in pairs',      d:'Every elite wave sends twice the elites.',                 ap:()=>{ P.noMercy=true; }},
 {id:'cold',     k:'hard', g:'❄', n:'reels lean cold',      d:'Slot pairs and triples land half as often (×0.5).',       ap:()=>{ P.fateMult=0.5; }},
 {id:'stampede', k:'hard', g:'♞', n:'a horde every wave',   d:'A swarm horde pours in on every wave from wave 2.',        ap:()=>{ P.stampede=true; }},
 {id:'crowd',    k:'hard', g:'♟', n:'the pit runs heavy',   d:'Every wave and every horde brings +30% bodies.',          ap:()=>{ P.crowd=true; }},
 {id:'drought',  k:'hard', g:'✕', n:'the fountains run dry',d:'Blood fountains refuse you. The wheel never heals.',       ap:()=>{ P.drought=true; }},
 {id:'thin',     k:'hard', g:'♡', n:'thin blood',           d:'Max blood −25% for the night.',                            ap:()=>{ P.maxHp=Math.max(30,Math.round(P.maxHp*0.75)); P.hp=P.maxHp; }},
 {id:'quick',    k:'hard', g:'⚡', n:'the court runs fast',  d:'Every enemy moves 10% faster.',                            ap:()=>{ window._fmods=Object.assign({},window._fmods,{spd:((window._fmods&&window._fmods.spd)||1)*1.1}); }},
 {id:'interest', k:'hard', g:'⚖', n:'the interest',         d:'You take +10% damage from everything.',                    ap:()=>{ P.dmgTakenMult=(P.dmgTakenMult||1)+0.10; }},
 {id:'hot',      k:'boon', g:'🔥', n:'hot reels',            d:'Your first 2 slots deal at red-table odds.',               ap:()=>{ P.hotSlots=Math.max(P.hotSlots||0,2); }},
 {id:'rich',     k:'boon', g:'◈', n:'a gilded floor',       d:'Coins ×1.25 all night.',                                   ap:()=>{ P.coinMult=(P.coinMult||1)*1.25; }},
 {id:'cards',    k:'boon', g:'☨', n:'the cards come early', d:'Tarot cards appear twice as often.',                       ap:()=>{ window._fmods=Object.assign({},window._fmods,{tarot:((window._fmods&&window._fmods.tarot)||1)*2}); }},
 {id:'scholar',  k:'boon', g:'✦', n:'a learned night',      d:'XP +15% all night.',                                       ap:()=>{ P.xpMult=(P.xpMult||1)*1.15; }},
 {id:'thick',    k:'boon', g:'♥', n:'thick blood',          d:'+25 max blood for the night.',                             ap:()=>{ P.maxHp+=25; P.hp=P.maxHp; }},
 {id:'pockets',  k:'boon', g:'⚜', n:'loaded pockets',       d:'Start the night with +60 coins.',                          ap:()=>{ P.coins+=60; }}
];
const DLY_COL={pairs:'#ff3b5c', cold:'#5fd8ff', stampede:'#ff8a3c', crowd:'#d65cff', drought:'#e0c060', thin:'#ff6b9a', quick:'#ffe14a', interest:'#ff4f2e',
  hot:'#ff5a1f', rich:'#ffd36b', cards:'#b98bff', scholar:'#7dffb0', thick:'#ff2d55', pockets:'#ffc93c'};
try{ for(const id in DLY_COL) GLYPH_COL['dly_'+id]=DLY_COL[id]; }catch(e){}
function dlyTerms(day){
  let a=dlyHash('ANTE-MORTEM-TERMS|'+day);
  const r=()=>{ a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  const pk=arr=>arr[(r()*arr.length)|0];
  const name='THE '+pk(DLY_NOUN)+' OF THE '+pk(DLY_ORD)+' '+pk(DLY_WHO);
  // the seat: Vesper 3 in 8, every other soul 1 in 8 — locked souls included (a taste of what's sealed)
  const sw=[['vesper',3],['dealer',1],['widow',1],['debtor',1],['brute',1],['yolk',1]];
  let x=r()*8, soul='vesper'; for(const [id,w] of sw){ if(x<w){ soul=id; break; } x-=w; }
  const fw=[['pit',2],['cellar',1],['chapel',1]];
  let y=r()*4, floor='pit'; for(const [id,w] of fw){ if(y<w){ floor=id; break; } y-=w; }
  const hard=DLY_MODS.filter(m=>m.k==='hard'), boon=DLY_MODS.filter(m=>m.k==='boon'&&!(floor==='chapel'&&m.id==='cards'));
  const mods=[pk(hard)];
  const roll=r();
  if(roll<0.55) mods.push(pk(boon));                       // a curse and a kindness
  else if(roll<0.75){ let m2=pk(hard); if(m2===mods[0]) m2=hard[(hard.indexOf(m2)+1)%hard.length]; mods.push(m2); } // a cruel night: two curses
  return { day, n:dlyNum(day), name, soul, floor, mods };
}
function dlySoul(){ const t=DLY.terms; return (t&&SOULS.find(s=>s.id===t.soul))||SOULS[0]; }
function dlyFloor(){ const t=DLY.terms; return (t&&FLOORS.find(f=>f.id===t.floor))||FLOORS[0]; }
function dlyModLine(t,html){
  return t.mods.map(m=> html ? '<span style="color:'+DLY_COL[m.id]+'" title="'+m.d+'">'+m.g+' '+m.n+'</span>' : m.g+' '+m.n).join(' · ');
}

/* ---------- persistence (am_daily_v1, additive) ---------- */
async function dlyLoad(){ try{ if(!store) return; const r=await store.get(DLY_KEY,false);
  if(r&&r.value){ const o=JSON.parse(r.value); if(o&&o.v===1&&o.days) DLY.data=Object.assign(DLY.data,o); } }catch(e){} }
async function dlySave(){ try{ if(!store) return;
  const ks=Object.keys(DLY.data.days).sort(); while(ks.length>90) delete DLY.data.days[ks.shift()]; // the ledger keeps ~three months
  await store.set(DLY_KEY,JSON.stringify(DLY.data),false); }catch(e){} }
function dlyStreak(){ const d=DLY.data, t=dlyToday(); return (d.lastDay===t||d.lastDay===dlyPrev(t))?(d.streak||0):0; }

/* ---------- the night itself ---------- */
function dlyBegin(){ // called first thing in startGame()
  if(DLY.next!=='daily'){ DLY_RNG=null; DLY.on=false; return; }
  const day=dlyToday();
  DLY.on=true; DLY.day=day; DLY.terms=dlyTerms(day); DLY.done=false;
  DLY_RNG={_seed:'ANTE-MORTEM-DAILY|'+day};
  DLY.scored=!DLY.data.days[day];
  if(DLY.scored){ const d=DLY.data;
    d.streak = d.lastDay===dlyPrev(day) ? (d.streak||0)+1 : (d.lastDay===day ? (d.streak||1) : 1);
    d.lastDay=day; d.days[day]={n:dlyNum(day), s:1}; dlySave(); } // the attempt is spent the moment the bell rings
  DLY.track=[]; DLY._min=0; DLY._tr3=0; DLY._pairs=LT.pairs||0; DLY._boss=LT.bossKills||0;
}
function dlyStart(){ // called at the end of startGame(), after soul + floor
  const t=DLY.terms; if(!t) return;
  DLY._seq=window._runSeq;
  t.mods.forEach(m=>{ try{ m.ap(); }catch(e){} });
  try{ dlyBell(DLY.scored); }catch(e){}
  try{ flash(0.35, DLY.scored?'#ffd36b':'#c98bff'); }catch(e){}
  setTimeout(()=>{ if(window._runSeq!==DLY._seq) return;
    announce('☀ DAILY DEBT #'+t.n+' — '+t.name+' ☀', true); }, 350);
  setTimeout(()=>{ if(window._runSeq!==DLY._seq) return;
    announce('☀ '+dlyModLine(t,false).toUpperCase()+' ☀', t.mods.every(m=>m.k==='boon')); }, 1200);
  setTimeout(()=>{ if(window._runSeq!==DLY._seq) return;
    announce(DLY.scored?'◈ THIS ONE IS SCORED — ONE ATTEMPT ◈':'◈ PRACTICE — THE LEDGER KEPT YOUR FIRST ◈', DLY.scored); }, 2400);
}
// per-frame: write one mark per minute survived
function dlyTick(){
  if(!DLY.on || window._runSeq!==DLY._seq) return;
  const m=Math.floor((gt-(window._gt0||0))/60);
  while(DLY._min<m && DLY.track.length<15){ DLY._min++; DLY.track.push(dlyMark()); try{ tone(1568,0.05,'sine',0.04); }catch(e){} }
}
function dlyMark(){ // the minute's best moment: ⚔ a boss fell · ★ a jackpot · ♦ a pair · ♠ survived
  const tr3=(RUN&&RUN.pulls&&RUN.pulls._tr3)||0, pr=LT.pairs||0, bk=LT.bossKills||0;
  let s='♠';
  if(pr>DLY._pairs) s='♦';
  if(tr3>DLY._tr3) s='★';
  if(bk>DLY._boss) s='⚔';
  DLY._tr3=tr3; DLY._pairs=pr; DLY._boss=bk;
  return s;
}
const DLY_MARK_COL={'♠':'#e6d9c2','♦':'#ff4f6a','★':'#ffd36b','⚔':'#c98bff','☠':'#d4212f','♛':'#8bffd0'};
function dlyTrackStr(){ return DLY.track.join(''); }

/* ---------- the sound of the debt ---------- */
function dlyBell(loud){ // a funeral bell in a counting house: low toll, gold shimmer on top
  if(muted) return;
  tone(110,2.2,'sine',0.16,104); tone(220,1.8,'sine',0.07,214); tone(331,1.4,'triangle',0.04);
  setTimeout(()=>{ tone(1318,0.5,'sine',0.05); tone(1760,0.4,'sine',0.03); },140);
  if(loud) setTimeout(()=>{ tone(98,1.6,'sine',0.12,92); try{ SFX.casinoDing(); }catch(e){} },620);
}
function dlyFanfare(){ // a new personal best: ascending gold peal over the bell
  if(muted) return;
  dlyBell(true);
  [784,988,1175,1568,1976].forEach((f,i)=>setTimeout(()=>{ tone(f,0.32,'triangle',0.09); tone(f*2,0.2,'sine',0.03); },220+i*95));
}

/* ---------- the ledger ---------- */
function dlyDeath(){
  if(!DLY.on || DLY.done || window._runSeq!==DLY._seq) return;
  DLY.done=true;
  const t=DLY.terms, d=DLY.data, day=DLY.day;
  const secs=Math.round(gt-(window._gt0||0));
  if(DLY.track.length<15) DLY.track.push(gt>=900?'♛':'☠');
  const res={ t:secs, lvl:P.level, kills:P.kills, track:dlyTrackStr() };
  const rec=d.days[day]||(d.days[day]={n:t.n, s:1});
  let pay=null, pb=false;
  if(DLY.scored){
    Object.assign(rec,res,{done:1});
    pb = secs>(d.bestT||0);
    if(pb){ d.bestT=secs; d.bestDay=day; }
    const st=dlyStreak();
    pay={ base:20, mins:4*Math.min(15,Math.floor(secs/60)), streak:5*Math.min(10,Math.max(0,st-1)), pb:pb?25:0 };
    pay.total=pay.base+pay.mins+pay.streak+pay.pb;
    gilt+=pay.total; saveGilt();
    LT.gilt=(LT.gilt||0)+pay.total;
  } else {
    if(!rec.pt || secs>rec.pt){ rec.pt=secs; rec.pl=P.level; }
  }
  dlySave();
  dlyBand(res, pay, pb);
}
function dlyBand(res, pay, pb){
  const go=$('gameover'), pn=go&&go.querySelector('.panel'); if(!pn) return;
  let b=$('dlyBand'); if(!b){ b=document.createElement('div'); b.id='dlyBand'; pn.insertBefore(b, pn.firstChild); }
  const t=DLY.terms, d=DLY.data, rec=d.days[DLY.day]||{};
  const trk=DLY.track.map(s=>'<i style="color:'+(DLY_MARK_COL[s]||'#e6d9c2')+'">'+s+'</i>').join('');
  b.className=DLY.scored?'scored':'practice';
  b.innerHTML='<div class="dbTop">☀ DAILY DEBT #'+t.n+' <b>'+(DLY.scored?'SCORED':'PRACTICE')+'</b></div>'
    +'<div class="dbName">'+t.name+'</div>'
    +'<div class="dbTerms">'+dlyModLine(t,true)+'</div>'
    +'<div class="dbTrack" title="one mark per minute — ♠ survived · ♦ a pair · ★ a jackpot · ⚔ a boss fell · ☠ the end">'+trk+'</div>'
    +'<div class="dbFoot">'
      +(DLY.scored
        ? 'TODAY <b>'+fmt(res.t)+'</b> · BEST EVER <b>'+fmt(d.bestT||0)+'</b> · 🔥 STREAK <b>'+dlyStreak()+'</b>'
        : 'SCORED TODAY <b>'+(rec.done?fmt(rec.t):'FORFEIT')+'</b> · THIS PRACTICE <b>'+fmt(res.t)+'</b>')
    +'</div>'
    +(pay?'<div class="dbPay">+'+pay.total+' ◈ GILT <span>(debt '+pay.base+' · minutes '+pay.mins+(pay.streak?' · streak '+pay.streak:'')+(pay.pb?' · best '+pay.pb:'')+')</span></div>'
         :'<div class="dbPay prac">AGAIN = PRACTICE THE SAME NIGHT · NEXT DEBT IN '+dlyClock(dlyLeft())+'</div>')
    +(pb?'<div class="dbPb">✦ A NEW DAILY BEST ✦</div>':'');
  b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  try{ const gt9=$('goGiltTotal'); if(gt9) gt9.textContent=gilt; }catch(e){}
  setTimeout(()=>{ try{ dlyBell(DLY.scored); }catch(e){} }, 300);
  if(pay) setTimeout(()=>{ try{ SFX.cashout(); SFX.coinPling(); coinRain(10); }catch(e){} }, 1100);
  if(pb) setTimeout(()=>{ try{
    dlyFanfare(); bigWin('NEW DAILY BEST',3); domConfetti(60,'gameover'); flash(0.5,'#ffd36b');
    announce('☀ A NEW DAILY BEST — '+fmt(res.t)+' ☀', true);
    const pbe=b.querySelector('.dbPb'); if(pbe) pbe.classList.add('go'); }catch(e){} }, 1700);
}

/* ---------- share: the daily variant of A3's line and card ---------- */
function dlyShareLine(){
  const t=DLY.terms, secs=Math.round(gt-(window._gt0||0));
  return '♠ ANTE MORTEM · DAILY DEBT #'+t.n+(DLY.scored?'':' (practice)')+' · survived '+fmt(secs)+' · lvl '+P.level
    +'\n'+dlyTrackStr()+'\n'+(typeof A3_URL!=='undefined'?A3_URL:'');
}
if(typeof a3Line==='function'){ const _a3l=a3Line;
  a3Line=function(n){ return (DLY_RNG&&DLY.on&&DLY.done)?dlyShareLine():_a3l(n); }; }
if(typeof a3Night==='function'){ const _a3n=a3Night;
  a3Night=function(){ const n=_a3n(); if(DLY_RNG&&DLY.on&&DLY.done){ n.pull=null; n.time=fmt(Math.round(gt-(window._gt0||0))); } return n; }; }
if(typeof a3Card==='function'){ const _a3c=a3Card;
  a3Card=function(n){ const c=_a3c(n); if(!(DLY_RNG&&DLY.on&&DLY.done)) return c;
    try{ const g=c.getContext('2d'), W=c.width, H=c.height, t=DLY.terms;
      const DISP="'Cinzel', 'Times New Roman', serif";
      // the debt ribbon over the night line
      g.save(); g.fillStyle='rgba(10,4,7,.92)'; g.fillRect(W/2-430,112,860,42);
      g.strokeStyle='#e8b64c'; g.lineWidth=1.5; g.strokeRect(W/2-430+0.5,112.5,859,41);
      g.textAlign='center'; g.textBaseline='middle';
      g.font='700 22px '+DISP; g.fillStyle=DLY.scored?'#ffd36b':'#c98bff';
      g.fillText('☀ DAILY DEBT #'+t.n+(DLY.scored?'':' · PRACTICE')+' · '+t.name+' ☀', W/2, 134);
      // the night, minute by minute
      const tr=DLY.track; const fs=tr.length>11?30:36; g.font='700 '+fs+'px '+DISP;
      const sp=fs*1.25, x0=W/2-(tr.length-1)*sp/2;
      tr.forEach((s,i)=>{ g.fillStyle=DLY_MARK_COL[s]||'#e6d9c2'; g.shadowColor=g.fillStyle; g.shadowBlur=10; g.fillText(s,x0+i*sp,548); });
      g.restore();
    }catch(e){ console.warn('[daily card]',e); }
    return c; }; }

/* ---------- the menu plaque ---------- */
function dlyPlaque(){
  const menu=$('menu'), pn=menu&&menu.querySelector('.panel'); if(!pn) return;
  let p=$('dlyPlaque');
  if(!p){ p=document.createElement('div'); p.id='dlyPlaque';
    const anchor=$('loadoutLine')||$('startBtn');
    if(anchor&&anchor.parentNode===pn) pn.insertBefore(p, anchor.nextSibling); else pn.appendChild(p);
    p.addEventListener('click',ev=>{ ev.stopPropagation(); dlyPlay(); }); }
  const day=dlyToday(), t=dlyTerms(day), d=DLY.data, rec=d.days[day], st=dlyStreak();
  const played=!!rec;
  const today= !played ? 'UNPAID' : (rec.done ? fmt(rec.t)+(rec.track?' '+rec.track:'') : 'FORFEIT');
  p.className=played?'paid':'';
  p.innerHTML='<div class="dpTop"><b>☀ DAILY DEBT #'+t.n+'</b><span class="dpCd">NEXT DEBT IN <i id="dlyCd">'+dlyClock(dlyLeft())+'</i></span></div>'
    +'<div class="dpName">'+t.name+'</div>'
    +'<div class="dpTerms"><span style="color:'+dlySoulFor(t).col+'">'+dlySoulFor(t).g+' '+dlySoulFor(t).n+'</span> · <span style="color:'+dlyFloorFor(t).col+'">'+dlyFloorFor(t).g+' '+dlyFloorFor(t).n+'</span> · '+dlyModLine(t,true)+'</div>'
    +'<div class="dpFoot"><span>TODAY <b>'+today+'</b></span><span>BEST <b>'+(d.bestT?fmt(d.bestT):'—')+'</b></span><span>🔥 STREAK <b>'+st+'</b></span></div>'
    +'<button class="btn dpBtn" type="button">'+(played?'☀ PRACTICE THE DEBT':'☀ PAY TODAY\'S DEBT')+'</button>';
  p.dataset.day=day;
}
function dlySoulFor(t){ return SOULS.find(s=>s.id===t.soul)||SOULS[0]; }
function dlyFloorFor(t){ return FLOORS.find(f=>f.id===t.floor)||FLOORS[0]; }
function dlyPlay(){
  if(state!=='menu') return;
  DLY.next='daily';
  try{ SFX.press&&SFX.press(); dlyBell(!DLY.data.days[dlyToday()]); }catch(e){}
  try{ fadeVeil&&fadeVeil(); }catch(e){}
  startGame();
}
// the countdown ticks while the menu is up; at midnight UTC a new debt is posted
setInterval(()=>{ try{
  if(state!=='menu') return; const p=$('dlyPlaque'); if(!p) return;
  if(+p.dataset.day!==dlyToday()){ dlyPlaque(); dlyBell(true); p.classList.add('fresh'); return; }
  const cd=$('dlyCd'); if(cd) cd.textContent=dlyClock(dlyLeft());
}catch(e){} }, 1000);

/* ---------- wiring ---------- */
// PLAY TONIGHT is always a normal night; ANTE UP after a daily replays the debt (as practice)
document.addEventListener('click',ev=>{ const b=ev.target&&ev.target.closest&&ev.target.closest('#startBtn'); if(b) DLY.next=null; },true);
if(typeof quitToMenu==='function'){ const _q=quitToMenu;
  quitToMenu=function(){
    try{ if(DLY.on && !DLY.done && DLY.scored && P && window._runSeq===DLY._seq){ // fled mid-debt: the attempt stands as it was
        const rec=DLY.data.days[DLY.day]; if(rec&&!rec.done){ rec.t=Math.round(gt-(window._gt0||0)); rec.lvl=P.level; rec.fled=1; dlySave(); } } }catch(e){}
    DLY.next=null; DLY.on=false; DLY_RNG=null;
    const r=_q.apply(this, arguments);
    try{ dlyPlaque(); }catch(e){}
    return r; }; }
if(typeof actuallyDie==='function'){ const _ad=actuallyDie;
  actuallyDie=async function(){ const was=state; const r=await _ad.apply(this, arguments);
    try{ if(was!=='dead') dlyDeath(); }catch(e){ console.error('[daily death]',e); }
    return r; }; }
// a normal corpse never wears the daily band
try{ new MutationObserver(()=>{ const go=$('gameover'); if(go && !go.classList.contains('hidden') && !(DLY_RNG&&DLY.on)){ const b=$('dlyBand'); if(b) b.remove(); } })
  .observe($('gameover'),{attributes:true, attributeFilter:['class']}); }catch(e){}
if(typeof renderChips==='function'){ const _rc=renderChips;
  renderChips=function(){ const r=_rc.apply(this, arguments); try{ dlyPlaque(); }catch(e){} return r; }; }
try{ dlyPlaque(); }catch(e){}
dlyLoad().then(()=>{ try{ dlyPlaque(); }catch(e){} });
