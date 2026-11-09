"use strict";
/* ==== J3 — THE LESSON (the interactive tutorial) ====
   Six short lessons on a gentle floor, one per system: WALK · HUNT · THE FEED ·
   THE REELS · THE WHEEL · THE ASCENT. ~2 minutes, cannot be lost.
   - entry: lessonPlay() (menu button ✒ THE LESSON, the NEW HERE? chip, hotkey T).
     It seats Vesper on THE PIT with no contracts/indulgences/stake, then calls
     startGame(); startGame calls lessonBegin() right after fnStart().
   - while LESSON.on: bump/awardMarks/recCheck/secret/idxSee are silent (guards in
     ranks.js read window.LESSON — never a bare LESSON: the build concatenates every
     script into one, so a bare reference from an earlier file would hit the TDZ),
     no bosses (spawnBoss guard), only crawlers, no tarot/bounty/dare/props, blood
     never falls under 40% and death is refused. LT is snapshotted before the
     night and restored after it: the lesson leaves no fingerprints on the ledger
     (LT.runs included — no gentle night is consumed).
   - each step: #lessonBar banner (n/6, title, how-to line, live status) + the
     matching coach toast; on its condition: SFX.levelDing, gold ring, next in 900ms.
   - finish: '♠ THE HOUSE IS OPEN — PLAY TONIGHT ♠', confetti, seraph, save, menu in 2.5s.
   - persistence: NEW additive key am_lesson_v1 = {done:0|1, n:plays}.
   Loaded LAST (after daily.js), so it may wrap globals declared earlier.          */
const LESSON_KEY='am_lesson_v1';
const LESSON=window.LESSON={ on:false, step:0, done:false, flags:{}, data:{done:0,n:0}, ring:null, kills0:0, gt0:0, w0:0, res:null, _lt:null, _iv:0, _nx:0, _seq:0, starved:0 };
const LSN_COL={ walk:'#ffd36b', hunt:'#ff5560', feed:'#ff9a3c', reels:'#6db4ff', wheel:'#c98bff', ascent:'#8bff9a' };
try{ for(const id in LSN_COL) GLYPH_COL['lsn_'+id]=LSN_COL[id]; }catch(e){}
function lsnTouch(){ return !!window._touchUI; }
function lsnAuto(){ return typeof pushCrash!=='function'; } // J2's ascent climbs on its own and retires pushCrash
const LSN_STEPS=[
  null,
  { id:'walk',   g:'♞', n:'WALK',       how:()=>(lsnTouch()?'DRAG':'WASD')+' to walk · reach the gold ring',
    coach:()=>(lsnTouch()?'DRAG anywhere':'WASD or ARROWS')+' to walk — follow the gold arrow to the ring' },
  { id:'hunt',   g:'⚔', n:'HUNT',       how:()=>'your bolt aims itself · kill 8',
    coach:()=>'you never aim — your bolt finds the nearest dead · just keep moving and reap 8' },
  { id:'feed',   g:'◆', n:'THE FEED',   how:()=>'THE BAR EATS · keep killing · watch the jewels light · cash with SPACE at ◆◆ or risk the FEAST',
    coach:()=>'a full bar becomes THE FEED — souls feed it, the jewels light as it feeds · SPACE cashes for richer reels' },
  { id:'reels',  g:'♠', n:'THE REELS',  how:()=>'SPACE stops each reel · TAKE, or hold SPACE to ROLL the dice',
    coach:()=>'every level pulls the slot — SPACE stops each reel · then TAKE it, or HOLD SPACE and roll for more' },
  { id:'wheel',  g:'☸', n:'THE WHEEL',  how:()=>'the purple case · SPACE snaps the chains, SPACE spins, SPACE brakes',
    coach:()=>'walk into the purple case — SPACE snaps each chain, SPACE spins, SPACE brakes' },
  { id:'ascent', g:'▲', n:'THE ASCENT', how:()=>lsnAuto()
      ? 'the green gate climbs alone · SPACE cashes · the higher, the richer · crash = a curse'
      : 'the green gate · SPACE launches & climbs · ENTER cashes · the higher, the richer · crash = a curse',
    coach:()=>lsnAuto()
      ? 'walk into the green gate — it climbs alone · SPACE cashes · higher is richer · a crash curses you'
      : 'walk into the green gate — SPACE climbs, ENTER cashes · higher is richer · a crash curses you' }
];

/* ---------- persistence ---------- */
async function lessonLoad(){ try{ if(!store) return; const v=await store.get(LESSON_KEY);
  if(v&&v.value){ const o=JSON.parse(v.value); LESSON.data.done=o.done?1:0; LESSON.data.n=Math.max(0,+o.n||0); } }catch(e){} }
async function lessonSave(){ try{ if(!store) return; await store.set(LESSON_KEY, JSON.stringify({done:LESSON.data.done?1:0, n:LESSON.data.n|0}), false); }catch(e){} }

/* ---------- entry ---------- */
function lessonPlay(){
  if(state!=='menu' || LESSON.on) return;
  try{ LESSON._lt=JSON.parse(JSON.stringify(LT)); }catch(e){ LESSON._lt=null; }
  LESSON.data.n=(LESSON.data.n|0)+1; lessonSave();
  LESSON.on=true; LESSON.step=0; LESSON.done=false; LESSON.res=null; LESSON.flags={}; LESSON.starved=0;
  try{ DLY.next=null; }catch(e){}
  // the lesson always seats Vesper in THE PIT, plain terms — the player's own picks wait for a real night
  const keep={}; try{ keep.sl=IDX.sl; keep.fl=IDX.fl; keep.ct=IDX.ct; keep.ind=IDX.ind; IDX.sl='vesper'; IDX.fl='pit'; IDX.ct=[]; IDX.ind=[]; }catch(e){}
  try{ keep.stk=STK.sel; STK.sel=0; }catch(e){}
  try{ SFX.press&&SFX.press(); SFX.casinoDing(); }catch(e){}
  try{ fadeVeil&&fadeVeil(); }catch(e){}
  try{ startGame(); }
  finally{ try{ IDX.sl=keep.sl; IDX.fl=keep.fl; IDX.ct=keep.ct; IDX.ind=keep.ind; }catch(e){} try{ STK.sel=keep.stk; }catch(e){} }
}
// called by startGame() right after fnStart()
function lessonBegin(){
  if(!LESSON.on) return;
  if(LESSON._lt) LT.runs=LESSON._lt.runs; // a lesson is not a night
  P._fn=false; if(P._fnXp){ P._fnXp=0; P.xpMult=(P.xpMult||1)/FN.xpBoost; }
  window._fmods={horde:0.35, noRanged:true}; document.body.classList.remove('floor-cellar','floor-chapel');
  tarotT=bountyT=dareT=interT=9e9; wheelTok=null; crashTok=null; wheelTokT=crashTokT=9e9; eggProp=null; bounty=null; dare=null;
  waveGap=9e9; // the floor stays empty until the first lesson is walked
  P.xp=0; P.xpNext=12;
  LESSON._seq=window._runSeq; LESSON.gt0=gt; LESSON.w0=performance.now(); LESSON.kills0=0;
  document.body.classList.add('lessonOn');
  lsnBar();
  setTimeout(()=>{ if(lsnLive()) announce('✒ THE LESSON — SIX THINGS, TWO MINUTES · YOU CANNOT DIE ✒', true); }, 300);
  setTimeout(()=>{ if(lsnLive()) lsnGo(1); }, 1300);
  clearInterval(LESSON._iv); LESSON._iv=setInterval(lsnPoll, 150);
}
function lsnLive(){ return LESSON.on && window._runSeq===LESSON._seq && state!=='menu' && state!=='dead'; }

/* ---------- steps ---------- */
function lsnGo(n){
  if(!lsnLive()) return;
  LESSON.step=n; LESSON.stepDone=false; const S=LSN_STEPS[n];
  if(n===1){ // a gold ring 300px away, toward the open floor
    const a=(VH>VW*1.15)?1.25:0.32; // down on a tall phone, right on a wide screen — on the glass, clear of the banner
    LESSON.ring={x:clamp(P.x+Math.cos(a)*300,80,CFG.arena-80), y:clamp(P.y+Math.sin(a)*300,80,CFG.arena-80), r:46, born:gt};
    ring(LESSON.ring.x,LESSON.ring.y,120,'#ffd36b'); }
  if(n===2){ LESSON.kills0=P.kills; waveGap=0.3; }
  if(n===3){ LESSON.flags.cashed=false; if(!(P.ovT>0)) P.xp=Math.max(P.xp, Math.ceil(P.xpNext*0.7)); }
  if(n===5){ P.coins=Math.max(P.coins||0,20); try{ wheel.rigSeg='90 COINS'; }catch(e){} lsnToken('wheel'); }
  if(n===6){ lsnToken('crash'); }
  announce('✒ LESSON '+n+' OF 6 — '+S.n+' ✒', true);
  try{ SFX.tingle(); setTimeout(()=>{ try{ tone(784,0.12,'sine',0.08); tone(1175,0.18,'sine',0.06); }catch(e){} },120); }catch(e){}
  lsnCoach(S);
  lsnBar(true);
}
function lsnCoach(S){ try{ LT.coach=LT.coach||{}; const id='lesson_'+S.id; delete LT.coach[id]; coachMark(id, S.coach()); delete LT.coach[id]; }catch(e){} }
// the case and the gate land a short walk away (toward the open floor), and wait
function lsnToken(kind){
  const C=CFG.arena/2, a=Math.atan2(C-P.y, C-P.x)+(kind==='wheel'?0.7:-0.7)+(Math.random()-0.5)*0.4, d=190;
  const t={x:clamp(P.x+Math.cos(a)*d,80,CFG.arena-80), y:clamp(P.y+Math.sin(a)*d,80,CFG.arena-80), t:9e9, ph:Math.random()*6.28};
  if(kind==='wheel'){ wheelTok=t; announce('☸ THE WHEEL OF SOULS MANIFESTS ☸', true); ring(t.x,t.y,90,'#c98bff'); ring(t.x,t.y,54,'#ffd36b'); }
  else { crashTok=t; announce('▲ THE ASCENT BECKONS ▲', true); ring(t.x,t.y,90,'#8bffd0'); ring(t.x,t.y,54,'#fff2c0'); }
  try{ SFX.dingBells(); [988,1318,1760].forEach((f,i)=>setTimeout(()=>tone(f,0.14,'sine',0.08),i*110)); }catch(e){}
}
function lsnDone(n){
  if(!lsnLive() || LESSON.step!==n || LESSON.stepDone) return;
  LESSON.stepDone=true; const S=LSN_STEPS[n];
  try{ SFX.levelDing(); }catch(e){}
  if(state==='playing'){ ring(P.x,P.y,130,'#ffd36b'); ring(P.x,P.y,80,'#fff2c0'); burst(P.x,P.y,16,LSN_COL[S.id]); ftext(P.x,P.y-44,'✦ '+S.n+' — LEARNED ✦','#ffd36b',true); }
  flash(0.22,'#ffd36b');
  lsnBar(true);
  if(n===6){ clearTimeout(LESSON._nx); LESSON._nx=setTimeout(lsnFinish, 900); return; }
  clearTimeout(LESSON._nx); LESSON._nx=setTimeout(()=>lsnGo(n+1), 900);
}
function lsnFinish(){
  if(!lsnLive()) return;
  LESSON.done=true; LESSON.step=7;
  LESSON.res={ gt:+(gt-LESSON.gt0).toFixed(1), ms:Math.round(performance.now()-LESSON.w0) };
  LESSON.data.done=1; lessonSave();
  pending.length=0;
  // the House clears its floor for the graduate
  if(state==='playing'){ for(const e of enemies){ burst(e.x,e.y,6,'#ffd36b'); } enemies.length=0; waveGap=9e9; ebullets.length=0;
    ring(P.x,P.y,260,'#ffd36b'); ring(P.x,P.y,170,'#fff2c0'); ring(P.x,P.y,90,'#8bffd0'); }
  announce('♠ THE HOUSE IS OPEN — PLAY TONIGHT ♠', true);
  try{ SFX.seraph(); setTimeout(()=>{ try{ SFX.dingBells(); SFX.cashout(); }catch(e){} },260); }catch(e){}
  try{ bigWin('LESSON LEARNED', 4); }catch(e){}
  try{ domConfetti(GFX.lite?30:70); }catch(e){} try{ coinRain(GFX.lite?14:30); }catch(e){} try{ sparkBurst(30); }catch(e){}
  flash(0.45,'#fff2c0'); shake=Math.min(16,shake+8);
  lsnBar(true);
  const seq=LESSON._seq;
  setTimeout(()=>{ if(LESSON.on && window._runSeq===seq && state!=='menu'){ lsnLeave(); } }, 2500);
}
// back to the menu — through a slot/wheel/gate if one is somehow still open
function lsnLeave(){
  try{ ['slot','wheelLayer','crashLayer'].forEach(id=>{ const e=$(id); if(e) e.classList.add('hidden'); }); }catch(e){}
  try{ const jk=$('jkWrap'); if(jk){ jk.classList.remove('show'); jk.innerHTML=''; } }catch(e){}
  quitToMenu();
}
function lessonEnd(){
  if(!LESSON.on) return;
  const fin=LESSON.done;
  LESSON.on=false; LESSON.step=0; clearInterval(LESSON._iv); clearTimeout(LESSON._nx);
  LESSON.ring=null; document.body.classList.remove('lessonOn');
  { const b=$('lessonBar'); if(b) b.classList.remove('show'); }
  // the lesson leaves no fingerprints: the lifetime ledger is restored as it was (today's first-ante stamp stays)
  if(LESSON._lt){ try{ const keepDay=LT.lastAnte; for(const k of Object.keys(LT)) delete LT[k]; Object.assign(LT, LESSON._lt); if(keepDay!==undefined) LT.lastAnte=keepDay; achSaveSoon(); }catch(e){} LESSON._lt=null; }
  if(fin) setTimeout(()=>{ if(state==='menu'){ try{ announce('♠ LESSON LEARNED — THE TABLE IS YOURS ♠', true); }catch(e){} } }, 700);
}

/* ---------- the banner ---------- */
function lsnBar(pop){
  let b=$('lessonBar');
  if(!b){ b=document.createElement('div'); b.id='lessonBar';
    b.innerHTML='<div class="lsnHead"><span class="lsnN"></span><span class="lsnPips"></span></div><div class="lsnT"></div><div class="lsnRule"></div><div class="lsnD"></div><div class="lsnS"></div>';
    document.body.appendChild(b); }
  if(!LESSON.on){ b.classList.remove('show'); return; }
  const n=LESSON.step, S=LSN_STEPS[Math.min(6,Math.max(1,n))];
  let pips=''; for(let i=1;i<=6;i++){ const st=i<n||(i===n&&LESSON.stepDone)||n>6?'d':(i===n?'c':''); pips+='<i class="'+st+'" style="--pc:'+LSN_COL[LSN_STEPS[i].id]+'">'+(st==='d'?'◆':'◇')+'</i>'; }
  const q=s=>b.querySelector(s);
  if(n<1){ q('.lsnN').textContent='THE LESSON'; q('.lsnT').textContent='✒ THE HOUSE TEACHES ✒'; q('.lsnD').textContent='six things · two minutes · you cannot die here'; }
  else if(n>6){ q('.lsnN').textContent='THE LESSON · LEARNED'; q('.lsnT').textContent='♠ ALL SIX LEARNED ♠'; q('.lsnD').textContent='walk · hunt · feed · reels · wheel · ascent — every bet is yours now'; }
  else { q('.lsnN').textContent='LESSON '+n+' / 6'; q('.lsnT').innerHTML='<b style="color:'+LSN_COL[S.id]+'">'+S.g+'</b> '+S.n+(LESSON.stepDone?' <em>✓</em>':''); q('.lsnD').textContent=S.how(); }
  q('.lsnPips').innerHTML=pips;
  b.style.setProperty('--lc', n>=1&&n<=6?LSN_COL[S.id]:'#ffd36b');
  b.classList.toggle('stepDone', !!LESSON.stepDone || n>6);
  lsnStatus();
  b.classList.add('show');
  if(pop){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  lsnPlace();
}
// the live line under the lesson: counters, the feed's jewels, what to do next
function lsnStatus(){
  const b=$('lessonBar'); if(!b) return; const s=b.querySelector('.lsnS'); if(!s) return;
  const n=LESSON.step; let t='';
  if(!P || n<1 || n>6){ t=''; }
  else if(LESSON.stepDone) t='✦ LEARNED ✦';
  else if(n===1){ const r=LESSON.ring; t=r?('THE RING · '+Math.max(0,Math.round(Math.hypot(r.x-P.x,r.y-P.y)-r.r))+' PACES'):''; }
  else if(n===2){ t='SOULS REAPED · '+Math.min(8,P.kills-LESSON.kills0)+' / 8'; }
  else if(n===3){
    if(P.ovT>0){ const tr=P.ovTier||0, ch=P.ovCharge||0, nx=tr<3?FEED_T[tr+1]:0;
      t='FEEDING '+['◇◇◇','◆◇◇','◆◆◇','◆◆★'][tr]+' · '+(tr?FEED_NAME[tr]:'COLD')+(tr<3?' · '+Math.max(0,nx-ch).toFixed(1)+'s TO '+FEED_NAME[tr+1]:'')+(tr>=2?' · CASH IT — SPACE':'');
      if(P.ovT<35) t='☠ IT STARVES — SPACE NOW ☠'; }
    else if(LESSON.starved) t='☠ IT STARVED: −25% XP · it refills fast · this time cash before it empties';
    else t='FILL THE BAR · '+Math.floor(P.xp)+' / '+P.xpNext+' XP'; }
  else if(n===4){ t=state==='slot'?'THE REELS ARE YOURS':'THE MACHINE IS WAITING'; }
  else if(n===5){ t=state==='wheel'?'SNAP · SPIN · BRAKE':'FOLLOW THE VIOLET ARROW · '+(P.coins|0)+' ◈ IN YOUR POCKET'; }
  else if(n===6){ t=state==='crash'?(crash&&crash.live?'CLIMBING · '+(+crash.mult||1).toFixed(2)+'×':'LAUNCH IT'):'FOLLOW THE GREEN ARROW'; }
  if(s.textContent!==t) s.textContent=t;
}
/* placement: on the floor the banner hangs under the HUD and the notice column moves
   below it; when a table is open it takes the free margin the table and the
   notice column leave (below → beside → above), else it folds away. */
function lsnRect(el){ if(!el) return null; if(el.closest&&el.closest('.hidden')) return null; const r=el.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; }
function lsnHit(a,b){ return a&&b && a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top; }
function lsnPlace(){
  const b=$('lessonBar'); if(!b || !b.classList.contains('show')) return;
  const W=innerWidth, H=innerHeight, touchy=document.body.classList.contains('touchUI');
  // the top HUD (+ the combo line, + the phone's codex coin) is sacred
  let hudB=0;
  for(const el of [document.querySelector('.hudTop'), $('xpbar')]){ const r=lsnRect(el); if(r) hudB=Math.max(hudB,r.bottom); }
  hudB=Math.max(hudB, touchy?80:78);
  { const cx=lsnRect($('tcCodex')); if(cx && cx.top<160) hudB=Math.max(hudB, cx.bottom); }
  let m=null, parts=[];
  if(state==='slot') parts=[lsnRect($('machine')), lsnRect($('payTable')), lsnRect($('sacCard'))].filter(Boolean);
  else if(state==='wheel') parts=[lsnRect(document.querySelector('#wheelLayer .wheelShell'))].filter(Boolean);
  else if(state==='crash') parts=[lsnRect(document.querySelector('#crashLayer .wheelShell')), lsnRect($('jkWrap'))].filter(Boolean);
  if(parts.length) m={left:Math.min(...parts.map(r=>r.left)), right:Math.max(...parts.map(r=>r.right)), top:Math.min(...parts.map(r=>r.top)), bottom:Math.max(...parts.map(r=>r.bottom))};
  // a table that has just opened is still growing in (and the notice column is still moving): stand aside a beat
  if(state!==LESSON._ps){ LESSON._ps=state; LESSON._psT=performance.now(); }
  if((state==='slot'||state==='wheel'||state==='crash') && (!m || performance.now()-LESSON._psT<450)){ b.classList.add('fold'); return; }
  const set=(x,y,w,cmp)=>{ b.classList.toggle('cmp',!!cmp); b.classList.toggle('one',cmp===2); b.classList.remove('fold'); b.style.width=Math.round(w)+'px'; b.style.left=Math.round(x)+'px'; b.style.top=Math.round(y)+'px'; };
  if(!m){ // on the floor: under the HUD, centered
    const w=Math.min(touchy?W-16:600, W-16); set((W-w)/2, hudB+6, w, false);
    const r=b.getBoundingClientRect(); document.documentElement.style.setProperty('--lsnB', Math.round(r.bottom)+'px');
    return; }
  // a table is open: find the margin it leaves (the notice column keeps whichever lane it chose)
  const nt=$('a2Notes'), lane=nt?(nt.classList.contains('a2above')?'above':nt.classList.contains('a2side')?'side':nt.classList.contains('a2below')?'below':''):'';
  const ntR=lsnRect(nt);
  const obst=[...parts, ntR, lsnRect($('hpwrap')), lsnRect($('tcBet')), lsnRect($('tcCash')), lsnRect(document.querySelector('.hudBottom > div:last-child')), lsnRect($('coachToast'))].filter(Boolean);
  const tryOne=(x,y,w,maxH,cmp)=>{ if(w<200 || maxH<24) return false; set(x,y,w,cmp); const r=b.getBoundingClientRect();
    if(r.height>maxH) return false; for(const o of obst) if(lsnHit(r,o)) return false; return true; };
  // each margin tries the full card (sides) or the compact plate, then a single engraved line
  const tryAt=(x,y,w,maxH,cmp)=>tryOne(x,y,w,maxH,cmp) || (cmp!==2 && tryOne(x,y,w,maxH,cmp?2:true)) || (!cmp && tryOne(x,y,w,maxH,2));
  const cands=[];
  // below the table (left of the phone's BET coin)
  if(lane!=='below'){ const y=m.bottom+8; let right=W-8; for(const c of [lsnRect($('tcBet')), lsnRect($('tcCash'))]) if(c && c.bottom>y && c.left>W*0.4) right=Math.min(right, c.left-8);
    const w=Math.min(560, right-8); cands.push([Math.max(8,Math.min((W-w)/2, right-w)), y, w, Math.max(0,H-8-y), true]); }
  // beside it (the side the notice column didn't take)
  const sideL=ntR && ntR.right<=m.left+4, sideR=ntR && ntR.left>=m.right-4;
  if(!(lane==='side'&&sideL)){ const w=Math.min(300, m.left-24); cands.push([m.left-12-w, Math.max(hudB+8, m.top+20), w, H-120-Math.max(hudB+8, m.top+20), false]); }
  if(!(lane==='side'&&sideR)){ const w=Math.min(300, W-m.right-24); cands.push([m.right+12, Math.max(hudB+8, m.top+20), w, H-120-Math.max(hudB+8, m.top+20), false]); }
  if(lane==='side'||lane==='below'){ const w=Math.min(560, W-16); cands.push([(W-w)/2, hudB+6, w, m.top-6-(hudB+6), true]); }
  if(!touchy && cands.length>1 && lane!=='below') cands.push(cands.shift()); // a desk has room beside the table — the margin under it is the fallback
  for(const c of cands){ if(tryAt(...c)) return; }
  b.classList.add('fold'); // nowhere clean to stand — the table speaks for itself
}

/* ---------- per-frame (playing) + poll (every state) ---------- */
function lessonTick(dt){
  if(!lsnLive()) return;
  // you cannot die here — hits still land and flash, blood never drops under 40%
  if(P.hp<P.maxHp*0.4) P.hp=P.maxHp*0.4;
  if(enemies.length>46){ for(let i=enemies.length-1;i>=0 && enemies.length>46;i--){ const e=enemies[i]; if(!inView(e.x,e.y,60)) enemies.splice(i,1); } }
  const n=LESSON.step;
  if(n===1 && LESSON.ring && !LESSON.stepDone){ const r=LESSON.ring;
    if(Math.hypot(P.x-r.x,P.y-r.y)<r.r+P.radius){ burst(r.x,r.y,22,'#ffd36b'); ring(r.x,r.y,140,'#fff2c0'); LESSON.ring=null; lsnDone(1); } }
  if(n===2 && !LESSON.stepDone && P.kills-LESSON.kills0>=8) lsnDone(2);
  if(n===5 && !LESSON.stepDone && !wheelTok && state==='playing' && !LESSON.flags.wheelDone) lsnToken('wheel'); // never strand the lesson
  if(n===6 && !LESSON.stepDone && !crashTok && state==='playing' && !LESSON.flags.crashDone) lsnToken('crash');
  lsnCheck();
}
// the event-driven lessons complete in any state (a cash opens the slot at once — update() sleeps while it is open)
function lsnCheck(){
  const n=LESSON.step; if(!lsnLive() || LESSON.stepDone) return;
  if(n===3 && LESSON.flags.cashed) lsnDone(3);
  if(n===4 && LESSON.flags.slotDone && state==='playing') lsnDone(4);
  if(n===5 && LESSON.flags.wheelDone) lsnDone(5);
  if(n===6 && LESSON.flags.crashDone) lsnDone(6);
}
function lsnPoll(){
  if(!LESSON.on) return;
  if(window._runSeq!==LESSON._seq || state==='menu'){ lessonEnd(); return; }
  const b=$('lessonBar'); if(b) b.classList.toggle('pz', state==='paused');
  if(state==='paused'){ const qb=$('quitBtn'); if(qb && qb.textContent!=='LEAVE THE LESSON') qb.textContent='LEAVE THE LESSON'; }
  try{ lsnCheck(); }catch(e){ console.error('[lesson]',e); }
  lsnStatus(); lsnPlace();
}
// what the lesson wants you to walk to (also read by probes/lesson.js)
LESSON.target=function(){ if(!LESSON.on||!P) return null; const n=LESSON.step;
  if(n===1&&LESSON.ring) return LESSON.ring; if(n===5&&wheelTok) return wheelTok; if(n===6&&crashTok) return crashTok; return null; };

/* ---------- hooks (wrapped by name; every call site looks the name up at call time) ---------- */
{ const _u=update; update=function(dt){ const r=_u.apply(this,arguments); if(LESSON.on) try{ lessonTick(dt); }catch(e){ console.error('[lesson]',e); } return r; }; }
// the bar fills only when the lesson is about the bar
{ const _g=gainXP; gainXP=function(n){
    if(LESSON.on && n>0 && !(LESSON.step===3 && !LESSON.stepDone) && !(P.ovT>0)){
      const room=Math.floor((P.xpNext-1-P.xp)/(P.xpMult||1)); if(room<=0) return; n=Math.min(n,room); }
    return _g.apply(this,[n]); }; }
{ const _c=cashRage; cashRage=function(){ const r=_c.apply(this,arguments); if(LESSON.on && LESSON.step===3) LESSON.flags.cashed=true; return r; }; }
{ const _s=feedStarve; feedStarve=function(){ const r=_s.apply(this,arguments);
    if(LESSON.on && LESSON.step===3){ LESSON.starved++; P.xp=Math.max(P.xp, Math.floor(P.xpNext*0.85));
      setTimeout(()=>{ if(lsnLive()) announce('✒ IT STARVED — FEED IT, THEN SPACE BEFORE IT EMPTIES ✒', false); }, 900); } return r; }; }
{ const _cs=closeSlot; closeSlot=function(){ const r=_cs.apply(this,arguments); if(LESSON.on && LESSON.step>=3) LESSON.flags.slotDone=true; return r; }; }
{ const _fw=finishWheel; finishWheel=function(){ const r=_fw.apply(this,arguments); if(LESSON.on && LESSON.step===5) LESSON.flags.wheelDone=true; return r; }; }
{ const _ow=openWheel; openWheel=function(){ if(LESSON.on){ try{ wheel.rigSeg='90 COINS'; }catch(e){} } return _ow.apply(this,arguments); }; }
// J2's planned rig: crash.rigCp overrides the roll. openCrash rebuilds `crash`, so the rig is set after it opens;
// rollCrashPoint honors it today too (J2 reads it in launchCrash — either way the gate breaks at 4.2×)
{ const _oc=openCrash; openCrash=function(){ const r=_oc.apply(this,arguments); if(LESSON.on){ try{ crash.rigCp=4.2; }catch(e){} lsnPlace(); } return r; }; }
if(typeof rollCrashPoint==='function'){ const _rc=rollCrashPoint; rollCrashPoint=function(){ if(LESSON.on && crash && crash.rigCp) return crash.rigCp; return _rc.apply(this,arguments); }; }
{ const _cc=closeCrash; closeCrash=function(){ const was=state; const r=_cc.apply(this,arguments);
    if(LESSON.on && was==='crash'){ if(LESSON.step===6||LESSON.step===5){ LESSON.flags.crashDone=true; pending.length=0; } } return r; }; }
// only the gentle crawlers come to class
{ const _se=spawnEnemy; spawnEnemy=function(type,x,y){ if(LESSON.on && type!=='shambler' && type!=='swarm') type='shambler'; return _se.call(this,type,x,y); }; }
// the gold ring + its arrow
{ const _dg=drawGuides; drawGuides=function(){ const r0=_dg.apply(this,arguments);
    if(LESSON.on && state==='playing' && LESSON.ring){ const r=LESSON.ring, pu=0.75+Math.sin(gt*5)*0.25;
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const g=ctx.createRadialGradient(r.x,r.y,0,r.x,r.y,r.r*1.6); g.addColorStop(0,'rgba(255,211,107,0.30)'); g.addColorStop(1,'rgba(255,211,107,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(r.x,r.y,r.r*1.6,0,6.283); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle='#ffd36b'; ctx.shadowColor='#ffd36b'; ctx.shadowBlur=18; ctx.lineWidth=4; ctx.globalAlpha=pu;
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.283); ctx.stroke();
      ctx.lineWidth=1.5; ctx.strokeStyle='#fff2c0'; ctx.setLineDash([6,8]); ctx.lineDashOffset=-gt*30;
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r+12+Math.sin(gt*4)*4,0,6.283); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.fillStyle='#ffd36b'; ctx.font='700 20px Cinzel, Georgia, serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('✦', r.x, r.y+Math.sin(gt*3)*3); ctx.restore();
      drawGuide(r.x, r.y, '#ffd36b'); }
    return r0; }; }
// the ledger stays shut while the House teaches
{ const _is=idxSee; idxSee=function(){ if(LESSON.on) return; return _is.apply(this,arguments); }; }
// death is refused (a backstop — blood is floored in lessonTick)
if(typeof die==='function'){ const _d=die; die=function(){ if(LESSON.on && lsnLive()){ P.hp=Math.max(1,P.maxHp*0.4); P.inv=1; return; } return _d.apply(this,arguments); }; }
{ const _q=quitToMenu; quitToMenu=function(){ const r=_q.apply(this,arguments); try{ lessonEnd(); }catch(e){ console.error('[lesson end]',e); } try{ lsnMenu(); }catch(e){} return r; }; }
window.addEventListener('resize',()=>{ try{ lsnPlace(); }catch(e){} try{ if(state==='menu') lsnMenu(); }catch(e){} });
// a table opening or closing re-seats the banner at once (the poll would lag a beat)
setTimeout(()=>{ try{ ['slot','wheelLayer','crashLayer','pauseLayer','a2Notes'].forEach(id=>{ const e=$(id); if(e) new MutationObserver(()=>{ if(LESSON.on){ try{ lsnPlace(); }catch(x){} } }).observe(e,{attributes:true,attributeFilter:['class']}); }); }catch(e){} }, 0);

/* ---------- the menu: a button in the parlor row, a chip for strangers, hotkey T ---------- */
function lsnMenu(){
  const row=$('menuRow2'); if(!row) return;
  let b=$('lessonBtn');
  if(!b){ b=document.createElement('button'); b.id='lessonBtn'; b.className='btn msm'; b.type='button';
    const how=$('howMenuBtn'); if(how && how.parentNode===row) row.insertBefore(b, how.nextSibling); else row.appendChild(b);
    b.addEventListener('click',()=>lessonPlay()); }
  b.innerHTML='✒ THE LESSON'+(LESSON.data.done?' <small class="lsnOk">✓</small>':'');
  b.title='THE LESSON — six things, two minutes (T)';
  b.classList.toggle('lsnNew', !LESSON.data.done);
  const pn=$('menu')&&$('menu').querySelector('.panel'); if(!pn) return;
  let c=$('lessonChip');
  const want=(LT.runs||0)===0 && !LESSON.data.done;
  if(!want){ if(c) c.remove(); return; }
  if(!c){ c=document.createElement('button'); c.id='lessonChip'; c.type='button'; c.textContent='✦ NEW HERE? TAKE THE LESSON · 2 MINUTES ✦';
    c.addEventListener('click',ev=>{ ev.stopPropagation(); lessonPlay(); }); }
  const anchor=$('loadoutLine')||$('startBtn');
  if(anchor && anchor.parentNode===pn){ if(c.previousSibling!==anchor || c.parentNode!==pn) pn.insertBefore(c, anchor.nextSibling); }
  else if(c.parentNode!==pn) pn.appendChild(c);
}
{ const _rc=renderChips; renderChips=function(){ const r=_rc.apply(this,arguments); try{ lsnMenu(); }catch(e){} return r; }; }
window.addEventListener('keydown',e=>{
  if((e.key||'').toLowerCase()!=='t' || e.repeat || state!=='menu') return;
  const m=$('menu'); if(!m || m.classList.contains('hidden')) return;
  if(document.activeElement && document.activeElement.tagName==='INPUT') return;
  if(document.querySelector('.layer:not(.hidden):not(#menu):not(#hud)')) return;
  if(['storyPanel','indexPanel','achPanel','vaultPanel','gfxPanel','howPanel','antePanel','booksPanel'].some(id=>{ const p=$(id); return p && !p.classList.contains('hidden'); })) return;
  e.preventDefault(); lessonPlay();
});
try{ lsnMenu(); }catch(e){}
lessonLoad().then(()=>{ try{ if(state==='menu') lsnMenu(); }catch(e){} });
