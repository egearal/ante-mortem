"use strict";
{ const rt=$('relicTip'); if(rt) document.body.appendChild(rt); } // escape #wrap stacking contexts — must beat #tabPanel (z 340)
$('achBtn').addEventListener('click',()=>{ openAchPanel(); });
$('indexBtn').addEventListener('click',()=>{ openIndexPanel(); SFX.uiDing(); });
$('gfxBtn').addEventListener('click',openGfx);
$('vaultBtn').addEventListener('click',()=>{ vaultBrowse=true; openVault(); SFX.uiDing(); });
{ const pl=$('pauseLayer');
  if(pl){
    const row=document.createElement('div'); row.id='howBtnRow';
    row.innerHTML='<button class="gxBtn" id="howBtn">❓ HOW TO PLAY</button><button class="gxBtn" id="quitBtn">⌂ QUIT TO MENU</button>';
    pl.appendChild(row);
    const H4=[
      {ico:'🎮', name:'SURVIVE', col:'#8bff9a', items:[
        ['MOVE','WASD or arrows. On a phone, drag. Your weapon fires by itself — you steer, dodge, and collect.'],
        ['LEVEL CHARGE','Kills drop ⚜ light. It fills the red bar at the bottom. Full bar = RAGE ignites.'],
        ['RAGE','+50% power while it burns, and coins now FEED the bar. Hold it above 90 for 10 seconds and THE ASCENT arrives. SPACE cashes it into a level. Slip below 90 and the House sweeps the floor.'],
        ['BLOOD','Your life. Below 40% the slot machine becomes THE RED TABLE — richer, crueler.'],
        ['BOUNTY & DARES','Marked souls with gold rings pay big if killed fast. Kill-quota dares pay +40 coins.']
      ]},
      {ico:'🎰', name:'THE MACHINE', col:'#ffd36b', items:[
        ['THE SLOTS','Every level-up opens the reels. SPACE stops them one by one. One of a kind = LEVEL 1 · a PAIR = LEVEL 2 · a TRIPLE = MAX LEVEL on the spot (very rare). The rarity you pull is the rarity you keep.'],
        ['THE DICE','After the reels: TAKE the sure thing, or HOLD SPACE to roll the bones at 8+. EVERY win = +1 LEVEL, shown in real numbers before you roll. Misses curse you, then SCAR you, then take the skill. Beat the 3rd dice and R re-spins the reels, once. Four wins = ⚜ GOD LEVEL.'],
        ['THE RED TABLE','Under 40% blood the slot deals richer reels and softer dice (7+) — but ONE miss busts the ladder and leaves a permanent SCAR. The BLOOD CODICIL contract forgives your first miss.'],
        ['FEVER','Kills charge the fever meter. Full = a golden killing rush. Every 3rd minute is GOLDEN HOUR: double coins.']
      ]},
      {ico:'🎡', name:'THE GAMBLES', col:'#c98bff', items:[
        ['WHEEL OF SOULS','Grab the violet token — SPACE rolls a strip of prizes past the gold needle, tick by tick, until one lands. DOUBLE respins everything at ×2 then ×4. FREE SPIN rolls again for nothing. SIDE ARM hands you a weapon on the spot. One spin in 20 comes up GOLDEN — all prizes doubled.'],
        ['THE ASCENT','The green gate. Free to ride: SPACE pushes the number up, ENTER cashes out. Prizes at 1.77× / 2.77× / 3.69× — and 7.77× is the JACKPOT: your pick of 3 weapons. Crash = a random curse, 5-15 seconds.'],
        ['TAROT','Ghost cards flip on the marble — half bless, half curse. The violet arrow points to them.'],
        ['THE FINAL PRESS','Die once and the House considers. 35.000% to live — MASH SPACE for 3 seconds, every press buys +0.25-0.75%, cap 50.000%. Then the House ROLLS 0-100: land at or under your number and you live. Gilt never touched.']
      ]},
      {ico:'◈', name:'THE LONG GAME', col:'#ff9a9a', items:[
        ['COINS','This run\'s gold. They feed RAGE, and a 27+ kill streak can be CASHED with SPACE.'],
        ['GILT','Forever-money: bosses, the wheel, your final score. It survives death.'],
        ['THE VAULT','The great door MANIFESTS every 5 minutes. One seal per visit — choose well. Contracts grant forever-perks.'],
        ['RANKS & FAVORS','Marks raise your House Rank — 100 planned levels, every one pays, milestones every 10th change the game. Certain feats also seal permanent FAVORS.'],
        ['THE INDEX & SECRETS','Everything you meet — weapons, curses, enemies, fates — is pinned in THE INDEX on the menu. 34 secrets hide in the walls.']
      ]}
    ];
    const hp=document.createElement('div'); hp.id='howPanel'; hp.className='hidden';
    const sec=s=>'<div class="howSec" style="--hc:'+s.col+'"><div class="howSecH"><span class="howIco">'+s.ico+'</span>'+s.name+'</div>'
      +s.items.map(h=>'<div class="howItem"><div><div class="howName">'+h[0]+'</div><div class="howDesc">'+h[1]+'</div></div></div>').join('')+'</div>';
    hp.innerHTML='<div id="howTitle">♠ HOUSE RULES ♠</div><div class="howCols"><div class="howCol">'
      +sec(H4[0])+sec(H4[1])+'</div><div class="howCol">'+sec(H4[2])+sec(H4[3])+'</div></div>'
      +'<button class="gxBtn gxClose" id="howClose">CLOSE</button>';
    pl.appendChild(hp);
    row.addEventListener('click',e=>e.stopPropagation());
    hp.addEventListener('click',e=>e.stopPropagation());
    $('howBtn').addEventListener('click',()=>{ hp.classList.remove('hidden'); SFX.uiDing(); });
    $('howClose').addEventListener('click',()=>{ hp.classList.add('hidden'); SFX.casinoDing(); });
    $('quitBtn').addEventListener('click',()=>quitToMenu());
  } }
function quitToMenu(){
  const hp=$('howPanel'), pl=$('pauseLayer');
  if(hp) hp.classList.add('hidden'); if(pl) pl.classList.add('hidden');
  elHud.classList.add('hidden'); elGO.classList.add('hidden'); elMenu.classList.remove('hidden');
  { const bb=$('bossBar'); if(bb) bb.classList.add('hidden'); }
  hideTab(); tabHold=false; keys.clear(); touch.active=false;
  try{ stopDrone(); }catch(e){} try{ stopDrumroll(); }catch(e){}
  state='menu'; SFX.casinoDing();
  try{ renderChips(); }catch(e){}
}
{ let lastMute=0;
  $('mute').addEventListener('click',()=>{ const n2=performance.now(); if(n2-lastMute<2000 && lastMute>0) secret('checking','JUST CHECKING'); lastMute=n2; });
  let tclk=0; const h1=document.querySelector('#menu h1');
  if(h1){ h1.style.cursor='default'; h1.addEventListener('click',()=>{ if(++tclk>=7) secret('namehouse','NAME OF THE HOUSE'); }); } }
$('vaultClose').addEventListener('click',()=>{ $('vaultPanel').classList.add('hidden'); vaultBrowse=false; if(state==='vault') state='playing'; });
document.querySelector('.pauseCard').addEventListener('click',()=>{ if(state==='paused'){ state='playing'; $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); } });
$('achClose').addEventListener('click',()=>{ $('achPanel').classList.add('hidden'); });
$('idxClose').addEventListener('click',()=>{ $('indexPanel').classList.add('hidden'); SFX.casinoDing(); });
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
const GFX={ q:'auto', shafts:true, ghosts:true, shake:1, flash:1, grade:true, sat:true, pcap:260, fps:false, lite:false, preset:'medium' };
const GFX_KEY='antemortem_gfx_v1';
// one-click presets — MEDIUM matches the classic defaults so old saves label correctly
const GFX_PRESETS={
  toaster:{ q:'low',  lite:true,  shafts:false, ghosts:false, grade:false, shake:0.5, flash:0.5, pcap:70 },
  low:    { q:'low',  lite:false, shafts:false, ghosts:false, grade:true,  shake:1,   flash:1,   pcap:140 },
  medium: { q:'auto', lite:false, shafts:true,  ghosts:true,  grade:true,  shake:1,   flash:1,   pcap:260 },
  high:   { q:'high', lite:false, shafts:true,  ghosts:true,  grade:true,  shake:1,   flash:1,   pcap:260 }
};
function gfxDerivePreset(){
  for(const name in GFX_PRESETS){ const p=GFX_PRESETS[name];
    if(Object.keys(p).every(k=>GFX[k]===p[k])) return name; }
  return 'custom';
}
async function loadGfx(){ try{ const r=await store.get(GFX_KEY,false); if(r&&r.value) Object.assign(GFX,JSON.parse(r.value)); }catch(e){} GFX.preset=gfxDerivePreset(); applyGfxSide(); }
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
function applyGfxPreset(name){
  const p=GFX_PRESETS[name]; if(!p) return;
  Object.assign(GFX,p); GFX.preset=name;
  applyGfxSide(); saveGfx();
  const gp=$('gfxPanel'); if(gp){ gp.querySelectorAll('.gxBtn[data-k]').forEach(b=>{
    const d=GFX_DEFS.find(x=>x.k===b.dataset.k); if(d) b.textContent=gfxLabel(d); }); }
  syncPresetRow();
}
function syncPresetRow(){
  const gp=$('gfxPanel'); if(!gp) return;
  gp.querySelectorAll('.gxPre').forEach(b=>b.classList.toggle('on', b.dataset.pre===GFX.preset));
  const cl=gp.querySelector('#gxCustom'); if(cl) cl.style.display = GFX.preset==='custom' ? '' : 'none';
}
function buildGfxPanel(){
  if($('gfxPanel')) return;
  const p=document.createElement('div'); p.id='gfxPanel'; p.className='hidden';
  p.innerHTML='<div id="gfxCard"><div id="gfxTitle">⚙ GRAPHICS OF THE HOUSE ⚙</div>'
    +'<div id="gxPresets">'
    +[['toaster','🍞 TOASTER'],['low','LOW'],['medium','MEDIUM'],['high','HIGH']].map(x=>'<button class="gxPre" data-pre="'+x[0]+'">'+x[1]+'</button>').join('')
    +'</div><div id="gxCustom" style="display:none">CUSTOM</div>'
    +GFX_DEFS.map(d=>'<div class="gxRow"><span class="gxName">'+d.n+'</span><button class="gxBtn" data-k="'+d.k+'">'+gfxLabel(d)+'</button></div>').join('')
    +'<button class="gxBtn gxClose" id="gfxClose">CLOSE</button></div>';
  document.body.appendChild(p);
  p.querySelectorAll('.gxPre').forEach(b=>b.addEventListener('click',()=>{ applyGfxPreset(b.dataset.pre); SFX.casinoDing(); }));
  p.querySelectorAll('.gxBtn[data-k]').forEach(b=>b.addEventListener('click',()=>{
    const d=GFX_DEFS.find(x=>x.k===b.dataset.k);
    const i=d.opts.findIndex(o=>o[0]===GFX[d.k]);
    GFX[d.k]=d.opts[(i+1)%d.opts.length][0];
    GFX.preset=gfxDerivePreset(); syncPresetRow();
    b.textContent=gfxLabel(d); applyGfxSide(); saveGfx(); SFX.uiDing();
  }));
  $('gfxClose').addEventListener('click',()=>{ p.classList.add('hidden'); SFX.casinoDing(); });
  syncPresetRow();
}
function openGfx(){ buildGfxPanel(); $('gfxPanel').classList.remove('hidden'); SFX.vaultOpen(); }
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
  razor:'#bfe4ff', cinders:'#ff7a30', pendulum:'#c9b7ff', stakes:'#aeb8c2', serpent:'#e8c261',
  chalice:'#a05ae8', gramo:'#ffd36b', cylinder:'#ff4060', candelabra:'#fff2c0', guillotine:'#ff2030',
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
  // scars — permanent wounds from the dice
  if(P.scars){ P.scars.forEach(sl=>{ const d=document.createElement('div'); d.className='relic scar'; d.textContent='☒'; relicTip(d,'SCAR',1,sl+' — this run'); box.appendChild(d); }); }
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
    if(k===' ' && !inInput && !e.repeat){
      if(performance.now()-(window._recapT0||0)<500) return; // FINAL PRESS mashers don't skip-restart
      SFX.press();
      if(!window._recapDone && window._recapSkip){ window._recapSkip(); SFX.uiDing(); return; } // first space: complete the recap
      pressPulse('againBtn');
      $('againBtn').click(); // second space: wager again
    }
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
  if(k==='q' && state==='paused'){ e.preventDefault(); quitToMenu(); return; }
  if(state==='playing' && k===' '){
    e.preventDefault();
    if(P.ovT>0){ cashRage(); return; }
    if(vaultProp && Math.hypot(P.x-vaultProp.x,P.y-vaultProp.y)<115){
      if(vaultWindowOpen()){ state='vault'; openVault(); }
      else { announce('◈ THE VAULT IS SEALED — IT RETURNS AT '+fmt(nextVaultTime())+' ◈',false); SFX.thud(); }
      return; }
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
    if(k===' '){ if(crash.live){ SFX.press(); pressPulse('crashMsg'); pushCrash(); } else if(!crash.done){ SFX.press(); pressPulse('crashMsg'); launchCrash(); } }
    else if(k==='enter'){ if(crash.live){ SFX.press(); pressPulse('crashMsg'); cashCrash(); } }
    return;
  }
  if(state==='marker'){
    if(k===' ' && !e.repeat && markerRef && markerRef.phase==='press' && !markerRef.resolved){
      e.preventDefault();
      const mk=markerRef;
      if(mk.p<mk.max){
        mk.presses++;
        mk.p=Math.min(mk.max, mk.p+0.0025+Math.random()*0.005); // +0.25–0.75% a press — every decimal earned
        SFX.press();
        pressFx(mk);
        renderPressMeter();
        pressPulse(document.querySelector('#jackpotSub .fpHint')); // after render — the div is rebuilt each press
      }
    }
    return; }
  if(state==='wheel'){ if(k===' '){ e.preventDefault();
    if(!e.repeat){ SFX.press(); pressPulse('wheelMsg'); }
    if(wheel.phase==='roll') brakeTicker();
    else if(wheel.done) finishWheel();
    else launchWheel(); } return; }
  if(state==='slot'){
    if(k==='r' && !e.repeat){ SFX.press(); pressPulse('gambleMsg'); rerollReels(); return; }
    if(k===' '){
      if(e.repeat) return;
      SFX.press(); pressPulse('gambleMsg');
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
cv.addEventListener('pointerdown',e=>{ if(e.button!==0) return; touch.active=true; ptr(e); });
cv.addEventListener('pointermove',e=>{ if(touch.active)ptr(e); });
window.addEventListener('pointerup',()=>touch.active=false);
window.addEventListener('pointercancel',()=>touch.active=false);
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('touchstart',e=>{ touch.active=true; ptr(e); e.preventDefault(); },{passive:false});
cv.addEventListener('touchmove',e=>{ ptr(e); e.preventDefault(); },{passive:false});
cv.addEventListener('touchend',()=>touch.active=false);
cv.addEventListener('touchcancel',()=>touch.active=false,{passive:true});
$('startBtn').addEventListener('click',startGame);
/* menu juice: plaque tilt toward cursor, piano-key hover chimes, press squash + ring burst */
{ const chime=b=>{ if(!AC||muted) return; const sibs=[...b.parentNode.querySelectorAll('.btn')]; const i=Math.max(0,sibs.indexOf(b));
    tone(740*Math.pow(1.122,i%8),0.07,'sine',0.06); tone(1480*Math.pow(1.122,i%8),0.05,'sine',0.03); };
  document.addEventListener('mouseover',e=>{ if(state==='playing') return; const b=e.target.closest&&e.target.closest('.btn'); if(!b||(e.relatedTarget&&b.contains(e.relatedTarget))) return; chime(b); },true);
  document.addEventListener('mouseout',e=>{ if(state==='playing') return; const b=e.target.closest&&e.target.closest('.btn'); if(!b||(e.relatedTarget&&b.contains(e.relatedTarget))) return;
    b.style.setProperty('--tx','0deg'); b.style.setProperty('--ty','0deg'); },true);
  document.addEventListener('mousemove',e=>{ if(state==='playing') return; const b=e.target.closest&&e.target.closest('.btn'); if(!b) return; const r=b.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
    b.style.setProperty('--ty',(px*7)+'deg'); b.style.setProperty('--tx',(-py*7)+'deg'); },true);
  document.addEventListener('pointerdown',e=>{ if(state==='playing') return; const b=e.target.closest&&e.target.closest('.btn'); if(b) b.classList.add('pressing'); },true);
  document.addEventListener('pointerup',e=>{ if(state==='playing') return; const b=e.target.closest&&e.target.closest('.btn'); if(!b) return; b.classList.remove('pressing');
    SFX.chipStack(); const r=b.getBoundingClientRect(); const rg=document.createElement('span'); rg.className='btnRing';
    rg.style.left=(e.clientX-r.left)+'px'; rg.style.top=(e.clientY-r.top)+'px'; b.appendChild(rg); setTimeout(()=>rg.remove(),520); },true);
}
{ const v=document.createElement('div'); v.id='fadeVeil'; document.body.appendChild(v);
  window.fadeVeil=()=>{ v.classList.add('on'); setTimeout(()=>v.classList.remove('on'),160); };
  $('startBtn').addEventListener('click',()=>fadeVeil());
  $('againBtn').addEventListener('click',()=>fadeVeil());
}
window.addEventListener('blur',()=>{ keys.clear(); touch.active=false; tabHold=false; hideTab(); if(state==='playing'){ state='paused'; $('pauseLayer').classList.remove('hidden'); } });
window.addEventListener('error',ev=>{ if(!window._amErr){ window._amErr=1; console.error('[ANTE MORTEM]',ev.error||ev.message); } });
$('againBtn').addEventListener('click',()=>{ startGame(); });

function renderChips(){
  const chips=[
    best>0?['🏆',best.toLocaleString(),'#ffd36b']:null,
    ['◈',gilt+' GILT','#e8b64c'],
    ['📖',idxPct()+'%','#c98bff'],
    ['✦',SEC.size+'/34','#8bffd0'],
    ['⚜','RANK '+RANK.rank+' · '+RANKS[RANK.rank-1].n,'#fff2c0'],
    window._daily?['☀',window._daily,'#8bff9a']:null
  ].filter(Boolean);
  const cr=$('chipRow'); if(cr) cr.innerHTML=chips.map(c=>'<span class="mChip" style="--cc:'+c[2]+'"><b>'+c[0]+'</b>'+c[1]+'</span>').join('');
}
/* a rare shooting star across the menu sky */
function menuStar(){
  setTimeout(()=>{ menuStar();
    if(state!=='menu') return;
    const s=document.createElement('div'); s.className='mStar';
    s.style.left=(8+Math.random()*64)+'%'; s.style.top=(4+Math.random()*30)+'%';
    $('menu').appendChild(s); setTimeout(()=>s.remove(),1500);
  }, 6000+Math.random()*8000);
}
/* boot */
(async function boot(){
  buildAch(); await loadAch(); await loadGilt(); await loadGfx(); await idxLoad();
  { const today=new Date().toDateString();
    if(LT.lastDay!==today){
      LT.dayStreak=(LT.lastDay && (Date.now()-new Date(LT.lastDay).getTime())<172800000)?(LT.dayStreak||0)+1:1;
      LT.lastDay=today; const bonus=25+LT.dayStreak*5;
      gilt+=bonus; saveGilt(); achSaveSoon();
      window._daily='DAILY BLESSING +'+bonus+' ◈ · DAY '+LT.dayStreak;
    } }
  if(!RANK._ld){ RANK._ld=1; await loadRank(); }
  renderChips();
  menuStar();
  requestAnimationFrame(loop);
})();
