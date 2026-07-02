"use strict";
$('achBtn').addEventListener('click',()=>{ openAchPanel(); });
$('vaultBtn').addEventListener('click',()=>{ openVault(); });
{ const vb=$('vaultBtn'); if(vb){ const gb=document.createElement('button'); gb.className=vb.className; gb.id='gfxBtn'; gb.textContent='⚙ GRAPHICS'; vb.parentNode.insertBefore(gb,vb.nextSibling); gb.addEventListener('click',openGfx); } }
{ const pl=$('pauseLayer');
  if(pl){
    const row=document.createElement('div'); row.id='howBtnRow';
    row.innerHTML='<button class="gxBtn" id="howBtn">❓ HOW TO PLAY</button><button class="gxBtn" id="quitBtn">⌂ QUIT TO MENU</button>';
    pl.appendChild(row);
    const H=[
      ['🎮','MOVE & FIGHT','WASD or drag to move. Vesper auto-fires at the nearest soul. Survive the waves.'],
      ['⚜','LEVEL CHARGE','Kills fill the red bar at the bottom. A full bar ignites RAGE.'],
      ['⚡','RAGE','+50% power, but coins become bar FUEL. Hold above 90% for 10s to enter THE ASCENT with a bonus level. Slip below 90 and half your XP burns and the floor is swept. SPACE cashes a level any time above 90.'],
      ['🎰','THE MACHINE','Every level opens the slots. SPACE stops the reels — pairs and triples pay extra skill picks.'],
      ['🎲','DICE LADDER','After the reels, SPACE rolls the bones. Beat the number to climb; four wins in one visit is a GOD LEVEL. A miss costs a curse or a skill.'],
      ['☨','LAST RITES','Gamble while below 40% blood: each roll drains life, but wins return it doubled in fortune.'],
      ['☸','WHEEL OF SOULS','Grab the violet token, SPACE to spin. DOUBLE segments respin everything at ×2, then ×4.'],
      ['▲','THE ASCENT','Hold RAGE 90%+ or find the green gate. Free to ride: SPACE pushes the multiplier. Cash below 1.5× and you get NOTHING. Tier I passive at 1.5×, II at 2.5×, III at 5× — and at 10×, the JACKPOT: your pick of 3 weapons. Crash and THE FALL curses you 30 seconds.'],
      ['💀','THE MARKER','On death the House flips LIVE or DIE. Hammer SPACE to bribe with Gilt — 1◈ +10%, then 2◈ +10%, then 3◈ +5%. Odds cap at 75%.'],
      ['◈','COINS','The gold of this run. They feed the rage bar, and a 27+ kill streak can be CASHED with SPACE for coins.'],
      ['◈','GILT','Eternal money from boss bounties and the Wheel. Spend it in the VAULT — or on death bribes.'],
      ['🚪','THE VAULT','Walk to the great door and press SPACE mid-run. Buy permanent seals and fulfil Contracts for forever-perks.'],
      ['🃏','TAROT','Flipping ghost-cards on the marble. 24 fates — half bless, half curse. A violet arrow guides you to them; a phantom card at the top reveals your draw.'],
      ['☠','BOUNTY','A marked soul with a gold ring and timer. Kill it in 12s for rising pay — streaks pay more.'],
      ['⚔','HOUSE DARE','A kill quota flashes mid-screen. Meet it inside 10 seconds for +40 coins.'],
      ['✨','FEVER & GOLDEN HOUR','Kills fill the fever meter — full means a god-flash then a golden rush. Every 3rd minute is GOLDEN HOUR: double coins for 20s.'],
      ['🗝','SECRETS','34 hidden rituals — typed words, strange behaviors, cursed numbers. Each one is scratched forever into the Vault door.'],
      ['⏸','THIS SCREEN','ESC or click resumes. Hover your relics below to inspect them.']
    ];
    const hp=document.createElement('div'); hp.id='howPanel'; hp.className='hidden';
    hp.innerHTML='<div id="howTitle">❓ HOUSE RULES — EVERYTHING</div><div class="howGrid">'
      +H.map(h=>'<div class="howItem"><div class="howIco">'+h[0]+'</div><div><div class="howName">'+h[1]+'</div><div class="howDesc">'+h[2]+'</div></div></div>').join('')
      +'</div><button class="gxBtn gxClose" id="howClose">CLOSE</button>';
    pl.appendChild(hp);
    row.addEventListener('click',e=>e.stopPropagation());
    hp.addEventListener('click',e=>e.stopPropagation());
    $('howBtn').addEventListener('click',()=>{ hp.classList.remove('hidden'); SFX.uiDing(); });
    $('howClose').addEventListener('click',()=>{ hp.classList.add('hidden'); SFX.casinoDing(); });
    $('quitBtn').addEventListener('click',()=>{ hp.classList.add('hidden'); pl.classList.add('hidden');
      elHud.classList.add('hidden'); elGO.classList.add('hidden'); elMenu.classList.remove('hidden');
      try{ stopDrone(); }catch(e){} state='menu'; SFX.casinoDing(); });
  } }
{ let lastMute=0;
  $('mute').addEventListener('click',()=>{ const n2=performance.now(); if(n2-lastMute<2000 && lastMute>0) secret('checking','JUST CHECKING'); lastMute=n2; });
  let tclk=0; const h1=document.querySelector('#menu h1');
  if(h1){ h1.style.cursor='default'; h1.addEventListener('click',()=>{ if(++tclk>=7) secret('namehouse','NAME OF THE HOUSE'); }); } }
$('vaultClose').addEventListener('click',()=>{ $('vaultPanel').classList.add('hidden'); if(state==='vault') state='playing'; });
document.querySelector('.pauseCard').addEventListener('click',()=>{ if(state==='paused'){ state='playing'; $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); } });
$('achClose').addEventListener('click',()=>{ $('achPanel').classList.add('hidden'); });
$('mute').addEventListener('click',()=>{ muted=!muted; if(master) master.gain.value=muted?0:0.8; $('mute').textContent=muted?'♩':'♪'; $('mute').style.color=muted?'#5a4a3a':''; }); let tabHold=false;
function showTab(){
  let tp=$('tabPanel');
  if(!tp){ tp=document.createElement('div'); tp.id='tabPanel'; document.body.appendChild(tp); }
  tp.innerHTML='';
  const rc={common:'#cfc2a6',rare:'#6fb7ff',epic:'#c98bff',legendary:'#ffd36b',mythic:'#fff2c0',ascend:'#8bffd0'};
  const col1=document.createElement('div'); col1.className='tpCol';
  const mk=(html)=>{ const d=document.createElement('div'); d.innerHTML=html; return d.firstChild; };
  col1.appendChild(mk('<div class="tpH">⚔ WEAPONS</div>'));
  let anyW=false;
  WEAPONS.forEach(w=>{ const lv=P.wlv[w.id]||0; if(lv>0){ anyW=true;
    const it=mk('<div class="tpi hov"><span class="tpg" style="color:'+(GLYPH_COL[w.id]||rc[w.rar]||'#fff')+'">'+w.g+'</span><span>'+w.n+' — Lv '+lv+'</span></div>');
    relicTip(it, w.n, lv, projFx(w,lv)); col1.appendChild(it); }});
  if(!anyW) col1.appendChild(mk('<div class="tpi">—</div>'));
  col1.appendChild(mk('<div class="tpH">✦ PASSIVES</div>'));
  if(P.passiveList.length){ P.passiveList.forEach(r=>{
    const pdef=PASSIVES.find(p=>p.id===r.id);
    const it=mk('<div class="tpi hov"><span class="tpg" style="color:'+(GLYPH_COL[r.id]||rc[r.rar]||'#fff')+'">'+r.g+'</span><span>'+r.n+(r.count>1?' ×'+r.count:'')+(pdef&&pdef.fx?' — '+pdef.fx:'')+'</span></div>');
    relicTip(it, r.n, r.count, pdef?pdef.d(r.count):''); col1.appendChild(it); });
  } else col1.appendChild(mk('<div class="tpi">—</div>'));
  const col2=document.createElement('div'); col2.className='tpCol';
  col2.innerHTML='<div class="tpH">◈ THE LEDGER</div>'
    +'<div class="tpi">LEVEL '+P.level+' · XP '+Math.floor(P.xp)+' / '+P.xpNext+(P.debt>0?' · <span style="color:#ff6b6b">DEBT '+P.debt+'</span>':'')+'</div>'
    +'<div class="tpi">COINS '+P.coins+' · GILT '+gilt+' ◈</div>'
    +'<div class="tpi">WAVE '+wave+' · '+Math.floor(gt/60)+':'+String(Math.floor(gt%60)).padStart(2,'0')+'</div>'
    +'<div class="tpi">KILLS '+P.kills+' · STREAK ×'+killStreak+'</div>'
    +'<div class="tpi">ASCENT HOLD NEEDED: '+ascTime.toFixed(1)+'s ABOVE 90%</div>'
    +'<div class="tpi">XP BONUS +'+Math.round(((P.xpMult||1)-1)*100)+'% · BAR FEED +'+Math.round(((P.ovFeed||1)-1)*100)+'%</div>'
    +'<div class="tpi">SECRETS '+SEC.size+' / 34 · SEALS '+Object.values(VAULT.lv).reduce((a,b)=>a+b,0)+'</div>'
    +'<div class="tpi" style="color:#ffd36b">HOUSE RANK '+RANK.rank+' — '+RANKS[RANK.rank-1].n+' · '+RANK.marks+' MARKS</div>'
    +'<div class="tpH" style="margin-top:10px">RARITIES</div>'
    +'<div class="tpi"><span style="color:#cfc2a6">COMMON</span> · <span style="color:#6fb7ff">RARE</span> · <span style="color:#c98bff">ULTRA</span> · <span style="color:#fff2c0">MYTHIC</span> · <span style="color:#8bffd0">ASCENSION</span></div>'
    +'<div class="tpi" style="opacity:.7">HOVER ANY ITEM FOR ITS TALE</div>';
  tp.appendChild(col1); tp.appendChild(col2);
  tp.classList.add('show');
}
function hideTab(){ const tp=$('tabPanel'); if(tp) tp.classList.remove('show'); }
const GFX={ q:'auto', shafts:true, ghosts:true, shake:1, flash:1, grade:true, sat:true, pcap:260, fps:false };
const GFX_KEY='antemortem_gfx_v1';
async function loadGfx(){ try{ const r=await store.get(GFX_KEY,false); if(r&&r.value) Object.assign(GFX,JSON.parse(r.value)); }catch(e){} applyGfxSide(); }
function saveGfx(){ try{ store.set(GFX_KEY,JSON.stringify(GFX),false); }catch(e){} }
function applyGfxSide(){}
const GFX_DEFS=[
 {k:'q',    n:'QUALITY',        opts:[['auto','AUTO'],['high','HIGH'],['low','LOW']]},
 {k:'shafts',n:'LIGHT SHAFTS',  opts:[[true,'ON'],[false,'OFF']]},
 {k:'ghosts',n:'GHOST PATRONS', opts:[[true,'ON'],[false,'OFF']]},
 {k:'grade', n:'CINEMATIC GRADE',opts:[[true,'ON'],[false,'OFF']]},
 {k:'shake', n:'SCREEN SHAKE',  opts:[[1,'FULL'],[0.5,'REDUCED'],[0,'OFF']]},
 {k:'flash', n:'SCREEN FLASH',  opts:[[1,'FULL'],[0.5,'REDUCED'],[0,'OFF']]},
 {k:'pcap',  n:'PARTICLES',     opts:[[260,'FULL'],[140,'REDUCED'],[70,'MINIMAL']]},
 {k:'fps',   n:'FPS COUNTER',   opts:[[false,'OFF'],[true,'ON']]}
];
function gfxLabel(d){ const o=d.opts.find(o=>o[0]===GFX[d.k]); return o?o[1]:String(GFX[d.k]); }
function buildGfxPanel(){
  if($('gfxPanel')) return;
  const p=document.createElement('div'); p.id='gfxPanel'; p.className='hidden';
  p.innerHTML='<div id="gfxCard"><div id="gfxTitle">⚙ GRAPHICS OF THE HOUSE ⚙</div>'
    +GFX_DEFS.map(d=>'<div class="gxRow"><span class="gxName">'+d.n+'</span><button class="gxBtn" data-k="'+d.k+'">'+gfxLabel(d)+'</button></div>').join('')
    +'<button class="gxBtn gxClose" id="gfxClose">CLOSE</button></div>';
  document.body.appendChild(p);
  p.querySelectorAll('.gxBtn[data-k]').forEach(b=>b.addEventListener('click',()=>{
    const d=GFX_DEFS.find(x=>x.k===b.dataset.k);
    const i=d.opts.findIndex(o=>o[0]===GFX[d.k]);
    GFX[d.k]=d.opts[(i+1)%d.opts.length][0];
    b.textContent=gfxLabel(d); applyGfxSide(); saveGfx(); SFX.uiDing();
  }));
  $('gfxClose').addEventListener('click',()=>{ p.classList.add('hidden'); SFX.casinoDing(); });
}
function openGfx(){ buildGfxPanel(); $('gfxPanel').classList.remove('hidden'); SFX.vaultOpen(); }
function mkBribeLine(p,tier){
  const pct=Math.min(75,Math.round(p*100)), costs=[1,2,3];
  if(tier>=3||p>=0.75) return 'THE HOUSE IS BOUGHT — '+pct+'% TO LIVE';
  return 'ODDS '+pct+'% TO LIVE · SPACE — BRIBE '+costs[tier]+' GILT (+'+(tier<2?10:5)+'%) · YOU HOLD '+gilt+' ◈';
}
function bribeFx(tier,p){
  const jt=$('jackpotText'); if(jt){ jt.classList.remove('bribePop'); void jt.offsetWidth; jt.classList.add('bribePop'); }
  { const sb=$('jackpotSub'); sb.textContent=mkBribeLine(p,tier); sb.classList.remove('subPop'); void sb.offsetWidth; sb.classList.add('subPop'); }
  SFX.chipStack(); SFX.casinoDing();
  [660,880,1046].slice(0,tier).forEach((f9,i9)=>setTimeout(()=>tone(f9*(1+tier*0.12),0.16,'sine',0.12),i9*70));
  coinRain(6+tier*7);
  setTimeout(()=>flash(0.18+tier*0.08,'#fff2c0'),110);
  if(tier>=2){ SFX.dingBells(); ring(P.x,P.y,150,'#ffd36b'); }
  if(tier>=3){ SFX.hotSix(); SFX.cashout(); ring(P.x,P.y,230,'#fff2c0'); coinRain(18); }
  flash(0.25+tier*0.13,'#ffd36b'); sparkBurst(10+tier*10); shake=Math.min(20,shake+5+tier*3);
}
let annT=null;
function announce(txt, good){
  const a=$('announce'); if(!a) return;
  a.textContent=txt; a.className='ann '+(good?'good':'bad');
  a.style.animation='none'; void a.offsetWidth; a.style.animation='';
  a.classList.remove('hidden');
  tone(good?1760:520,0.07,'sine',0.06);
  clearTimeout(annT); annT=setTimeout(()=>a.classList.add('hidden'), 2700);
}
function showStreak(t){ elStreak.textContent=t; elStreak.style.opacity=1; elStreak.style.transition='none'; requestAnimationFrame(()=>{ elStreak.style.transition='opacity .8s'; setTimeout(()=>elStreak.style.opacity=0,500); }); }

/* ============================================================
   HUD update
   ============================================================ */
function updateHUD(){
  $('timer').textContent=fmt(gt);
  $('coinCount').textContent=P.coins;
  const bb=$('bossBar'); const bs=enemies.find(x=>x.boss);
  if(bs){ bb.classList.remove('hidden'); $('bossName').textContent=BOSS_DEFS[bs.bossKind].name; $('bossFill').style.width=Math.max(0,bs.hp/bs.maxhp*100)+'%'; }
  else bb.classList.add('hidden');
  $('killCount').textContent=P.kills;
  const hpPct=clamp(P.hp/P.maxHp,0,1)*100;
  $('hpfill').style.width=hpPct+'%';
  $('hptext').textContent=Math.ceil(P.hp)+' / '+P.maxHp;
  $('xpfill').style.width=(P.xp/P.xpNext*100)+'%';
  $('level').textContent='LEVEL '+P.level;
  const cm=$('combo');
  if(killStreak>=4){ cm.classList.remove('hidden'); cm.textContent='×'+(P.comboMult||1).toFixed(1)+'  COMBO'; cm.style.transform='translateX(-50%) scale('+(1+Math.min(0.5,killStreak*0.01))+')'; }
  else cm.classList.add('hidden');
  const db=$('debuffs');
  if(db){ if(debuffs.length){ db.innerHTML=debuffs.map(b=>'<span class="debuff'+(b.good?' buff':(b.poison?' poison':''))+'">'+b.label+' '+Math.ceil(b.t)+'s</span>').join(''); } else if(db.childElementCount) db.innerHTML=''; }
}
function relicTip(el, name, lv, fx){
  el.onmouseenter=(ev)=>{ const t=$('relicTip'); t.innerHTML='<b>'+name+'</b> · Lv '+lv+'<br>'+fx; t.classList.remove('hidden');
    const r=el.getBoundingClientRect(); t.style.right=(innerWidth-r.left+10)+'px'; t.style.top=(r.top-6)+'px'; };
  el.onmouseleave=()=>{ $('relicTip').classList.add('hidden'); };
}
const GLYPH_COL={
 bolt:'#ff5c5c',orbit:'#ffb300',spark:'#fff176',chand:'#ffd700',knives:'#00e5ff',aura:'#76ff03',nova:'#ff1744',seeker:'#b388ff',scythe:'#ff6ec7',
 dmg:'#ff3d00',fire:'#ff9100',spd:'#00b0ff',vital:'#00e676',hp:'#7cfc00',fortune:'#ffd600',stoker:'#d500f9',luck:'#e8b64c',
 proj:'#ff4dd2',pierce:'#c6ff00',mag:'#40c4ff',regen:'#1de9b6',exec:'#ff005d',crit:'#ffab00',
 a_iron:'#7c9eff',a_eye:'#e040fb',a_wind:'#18ffff',a_fang:'#ff4569',a_storm:'#f4ff00',a_greed:'#ffa726',
 a_crown:'#ffd740',a_void:'#b388ff',a_king:'#fffde7',
 phoenix:'#ff6d00',housecut:'#ffc400',allin:'#ff00a8',
 coil:'#ff7edb',mortar:'#ff8f00',lantern:'#ffb74d',fangs:'#9ccc65',bell:'#ffd54f',dice:'#ce93d8',phantom:'#c9d8ff',coffin:'#a1887f',moths:'#d7ffb8',
 thorn:'#ef5350',leech:'#ec407a',haste:'#4dd0e1',reach:'#81d4fa',tip:'#ffee58',corset:'#e0e0e0',snake:'#aed581',chips:'#ff7043',tithe:'#f44336',shell:'#b0bec5',
 a_gild:'#ffe082',a_hand:'#80deea',a_skin:'#cfd8dc',a_fuse:'#82b1ff',a_holl:'#ffab91',a_swrm:'#ea80fc',a_veil:'#b39ddb',a_reap:'#ff5252',a_engn:'#69f0ae',a_mirr:'#fff59d'
};
function renderRelics(){
  const bw=$('relicsW'), bs=$('relicsS'); bw.innerHTML=''; bs.innerHTML='';
  WEAPONS.forEach(w=>{ const lv=P.wlv[w.id]||0; if(lv>0){
    const d=document.createElement('div'); d.className='relic weapon r-'+w.rar;
    if(GLYPH_COL[w.id]) d.style.color=GLYPH_COL[w.id];
    d.innerHTML=iconSvg(w.id)+'<span class="lvpips">'+'●'.repeat(lv)+'</span>';
    relicTip(d, w.n, lv, projFx(w,lv));
    bw.appendChild(d);
  }});
  P.passiveList.forEach(r=>{ const d=document.createElement('div'); d.className='relic r-'+r.rar; { const gc=GLYPH_COL[r.id]||(r.rar==='ascend'?'#8bffd0':''); if(r.rar==='ascend'||r.rar==='mythic'){ d.innerHTML='<span style="font-size:24px;color:'+(gc||'#fff2c0')+';text-shadow:0 0 10px '+(gc||'#fff2c0')+'">'+r.g+'</span>'; } else { const pdef=PASSIVES.find(p=>p.g===r.g); d.innerHTML=iconSvg(pdef?pdef.id:'dmg'); if(gc) d.style.color=gc; } }
    const def=PASSIVES.find(p=>p.g===r.g)||r;
    relicTip(d, r.n, r.count, projFx(def,r.count));
    if(r.count>1){ const c=document.createElement('span'); c.className='pcount'; c.textContent=r.count; d.appendChild(c); } bs.appendChild(d); });
  const box=bs;
  // active curses
  if(P.curses){ P.curses.forEach(c=>{ const d=document.createElement('div'); d.className='relic curse'; d.textContent='☠'; d.title='CURSE '+c.short+' · '+c.waves+' waves left'; box.appendChild(d); }); }
}

/* ============================================================
   INPUT
   ============================================================ */
const keys=new Set();
const touch={active:false,wx:0,wy:0};
window.addEventListener('keyup',e=>{ if(e.key==='Tab'){ e.preventDefault(); tabHold=false; hideTab(); } });
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  feedSecretKeys(k);
  if(k==='tab'){ e.preventDefault(); if(!e.repeat && state==='playing'){ tabHold=true; showTab(); SFX.uiDing(); } return; }
  const inInput = document.activeElement && document.activeElement.tagName==='INPUT';
  if(!inInput && ['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(state==='dead'){
    if(k===' ' && !inInput && !e.repeat){ $('againBtn').click(); }
    return;
  }
  if(k==='escape'){
    if(e.repeat) return;
    e.preventDefault();
    if(state==='vault'){ $('vaultPanel').classList.add('hidden'); state='playing'; SFX.casinoDing(); return; }
    if(state==='playing'){ state='paused'; $('pauseLayer').classList.remove('hidden'); SFX.thud();
      $('pauseStats').innerHTML='<div class="ps"><b>'+P.kills+'</b><i>KILLS</i></div><div class="ps"><b>'+P.level+'</b><i>LEVEL</i></div><div class="ps"><b>'+P.coins+'</b><i>COINS</i></div><div class="ps"><b>'+wave+'</b><i>WAVE</i></div><div class="ps"><b>'+Math.floor(gt/60)+':'+String(Math.floor(gt%60)).padStart(2,'0')+'</b><i>TIME</i></div>'+'<div style="flex-basis:100%;text-align:center;font-family:var(--disp);font-size:10px;letter-spacing:.08em;color:#9a8f7e;margin-top:8px">◈ COINS — the House&#39;s gold, this run · ⚜ XP — level charge, wagered in the Ascent · GILT — eternal Vault currency</div>'; if(P){ P._pauses=(P._pauses||0)+1; if(P._pauses>=13) secret('coldfeet','COLD FEET'); } }
    else if(state==='paused'){ state='playing'; $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); }
    return;
  }
  if(state==='playing' && k===' '){
    e.preventDefault();
    if(P.ovT>0){ cashRage(); return; }
    if(vaultProp && Math.hypot(P.x-vaultProp.x,P.y-vaultProp.y)<115){ state='vault'; openVault(); return; }
    if(killStreak>=27){ const cash=Math.floor(killStreak/3);
      P.coins+=cash; LT.coins+=cash; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
      announce('◈ STREAK CASHED ×'+killStreak+' → +'+cash+' COINS ◈', true);
      SFX.cashout(); SFX.dingBells(); coinRain(Math.min(24,cash)); sparkBurst(20);
      killStreak=0; streakT=0;
    }
    return;
  }
  if(state==='crash'){
    if(crash&&crash.jk){ if(k==='1'||k==='2'||k==='3'){ e.preventDefault(); pickJackpot(+k-1); } return; }
    e.preventDefault();
    if(k===' '){ if(crash.live) pushCrash(); else if(!crash.done) launchCrash(); }
    else if(k==='enter'){ if(crash.live) cashCrash(); }
    return;
  }
  if(state==='marker'){
    if(k===' ' && markerRef && !markerRef.resolved){
      const costs=[1,2,3], gains=[0.10,0.10,0.05], t9=markerRef.tier;
      if(t9<3 && markerRef.p<0.75 && gilt>=costs[t9]){
        gilt-=costs[t9]; saveGilt();
        markerRef.p=Math.min(0.75, markerRef.p+gains[t9]); markerRef.tier++;
        bribeFx(markerRef.tier, markerRef.p);
      } else if(t9<3 && markerRef.p<0.75){
        SFX.thud(); $('jackpotSub').textContent='THE HOUSE REJECTS EMPTY HANDS — YOU NEED '+costs[t9]+' GILT';
      }
    }
    return; }
  if(state==='wheel'){ if(k===' '){ e.preventDefault(); launchWheel(); } return; }
  if(state==='slot'){
    if(k===' '){
      if(e.repeat) return;
      if(slotStage==='offer'){ spaceHold=true; holdProg=0; holdFired=false; ringShow(true); }
      else slotTap();
    }
    return;
  }
  keys.add(k);
});
window.addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  if(k===' ' && state==='slot'){
    if(spaceHold){ spaceHold=false; ringShow(false); if(!holdFired && holdProg<1) slotTap(); holdProg=0; }
    return;
  }
  keys.delete(k);
});
function ptr(e){ const t=e.touches?e.touches[0]:e; touch.wx=t.clientX+camX; touch.wy=t.clientY+camY; }
cv.addEventListener('pointerdown',e=>{ touch.active=true; ptr(e); });
cv.addEventListener('pointermove',e=>{ if(touch.active)ptr(e); });
window.addEventListener('pointerup',()=>touch.active=false);
cv.addEventListener('touchstart',e=>{ touch.active=true; ptr(e); e.preventDefault(); },{passive:false});
cv.addEventListener('touchmove',e=>{ ptr(e); e.preventDefault(); },{passive:false});
cv.addEventListener('touchend',()=>touch.active=false);
$('startBtn').addEventListener('click',startGame);
document.querySelectorAll('.btn').forEach(b=>b.addEventListener('mouseenter',()=>SFX.uiDing()));
window.addEventListener('blur',()=>{ if(state==='playing'){ state='paused'; $('pauseLayer').classList.remove('hidden'); } });
window.addEventListener('error',ev=>{ if(!window._amErr){ window._amErr=1; console.error('[ANTE MORTEM]',ev.error||ev.message); } });
$('againBtn').addEventListener('click',()=>{ const nm=$('nameInput').value.trim().toUpperCase(); if(nm){ sessionName=nm; if(pendingEntry)pendingEntry.n=nm.slice(0,12); } startGame(); });
$('nameInput').addEventListener('change',e=>{ sessionName=e.target.value.trim().toUpperCase(); });

/* boot */
(async function boot(){
  buildAch(); await loadAch(); await loadGilt(); await loadGfx();
  { const today=new Date().toDateString();
    if(LT.lastDay!==today){
      LT.dayStreak=(LT.lastDay && (Date.now()-new Date(LT.lastDay).getTime())<172800000)?(LT.dayStreak||0)+1:1;
      LT.lastDay=today; const bonus=25+LT.dayStreak*5;
      gilt+=bonus; saveGilt(); achSaveSoon();
      window._daily='DAILY BLESSING +'+bonus+' ◈ · DAY '+LT.dayStreak;
    } }
  { const seals=Object.values(VAULT.lv).reduce((a,b)=>a+b,0);
    $('bestLine').innerHTML=(best>0?`Your best: <b>${best.toLocaleString()}</b> &nbsp;·&nbsp; `:'')+`Gilt: <b>${gilt}</b> ◈ &nbsp;·&nbsp; Secrets: <b>${SEC.size}</b>/34 &nbsp;·&nbsp; Seals: <b>${seals}</b>`+(window._daily?` &nbsp;·&nbsp; <b style="color:#8bff9a">${window._daily}</b>`:''); }
  requestAnimationFrame(loop);
})();
