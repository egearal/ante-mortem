"use strict";
{ const rt=$('relicTip'); if(rt) document.body.appendChild(rt); } // escape #wrap stacking contexts — must beat #tabPanel (z 340)
$('achBtn').addEventListener('click',()=>{ openAchPanel(); });
$('indexBtn').addEventListener('click',()=>{ openIndexPanel(); SFX.uiDing(); });
$('gfxBtn').addEventListener('click',openGfx);
$('storyBtn').addEventListener('click', ()=>{ openStoryPanel(); });
$('storyClose').addEventListener('click', ()=>{ $('storyPanel').classList.add('hidden'); SFX.casinoDing(); });
$('vaultBtn').addEventListener('click',()=>{ vaultBrowse=true; openVault(); SFX.uiDing(); });
{ const pl=$('pauseLayer');
  if(pl){
    const row=document.createElement('div'); row.id='howBtnRow';
    row.innerHTML='<button class="pillBtn" id="resumeBtn">RESUME</button><button class="pillBtn" id="howBtn">HOW TO PLAY</button><button class="pillBtn quit" id="quitBtn">QUIT TO MENU</button>';
    pl.appendChild(row);
    const H4=[
      {ico:'🎮', name:'SURVIVE', col:'#8bff9a', items:[
        ['MOVE','WASD or arrows. Your weapons fire by themselves. You just dodge and collect.'],
        ['DON\'T GET TOUCHED','Everything that moves wants to touch you. Don\'t let it.'],
        ['PICK UP THE LIGHT','Dead enemies drop light. Walk over it. When the bottom bar fills, you level up.'],
        ['RAGE','A full bar sets you on fire: +50% power. Hold it hot for a few seconds and a green gate appears. SPACE banks it early.'],
        ['THE CLOCK','At 13:00 something unkillable arrives. At 15:00 the run ends. Nobody survives the night — score big before it.']
      ]},
      {ico:'🎰', name:'THE MACHINE', col:'#ffd36b', items:[
        ['THE REELS','Every level-up: SPACE spins, SPACE stops each reel. One of a kind = level 1. A pair = level 2. A triple = MAX, instantly.'],
        ['THE DICE','After the reels you can gamble the prize: HOLD SPACE and roll 8 or higher. Every win = +1 level. Every miss hurts more than the last.'],
        ['THE RED TABLE','Below 20% blood the slot turns RED. One of your skills sits beside the reels as THE STAKE. Any dice miss burns it a level. Survive all FOUR dice and the House blesses you: 5 seconds untouchable, double damage, double fire.'],
        ['FEVER','Kill fast to fill the fever meter. Full = a golden rampage.']
      ]},
      {ico:'🎡', name:'THE GAMBLES', col:'#c98bff', items:[
        ['THE CASE','A little gold case appears on the floor. It costs a cut of your coins. SPACE snaps each chain, then SPACE spins for a prize.'],
        ['THE ASCENT','The green gate. SPACE pushes a number up, ENTER cashes out. Higher = better prizes. 7.77 is the jackpot — but crash and you\'re cursed.'],
        ['TAROT','Ghost cards on the floor. Half bless you. Half don\'t. The violet arrow points the way.'],
        ['THE FINAL PRESS','When you die, the House offers one roll to live. MASH SPACE to raise your odds, then watch the number drop. Under your odds = one more hand.']
      ]},
      {ico:'◈', name:'THE LONG GAME', col:'#ff9a9a', items:[
        ['COINS','This run\'s money. Feeds your rage bar, pays for the case.'],
        ['GILT','Forever-money. You keep it when you die. Spend it in the VAULT for permanent power.'],
        ['THE VAULT','A great door in the arena. The first boss drops its KEY. One seal per visit.'],
        ['RANKS','Every run earns MARKS. Marks raise your HOUSE RANK — 100 levels, every one pays, new weapons unlock as you climb.'],
        ['SECRETS & PAGES','36 whispers hide in the walls (riddles in the INDEX). The House\'s story unlocks page by page as you rank up.']
      ]}
    ];
    const hp=document.createElement('div'); hp.id='howPanel'; hp.className='hidden';
    const sec=s=>'<div class="howSec" style="--hc:'+s.col+'"><div class="howSecH"><span class="howIco">'+s.ico+'</span>'+s.name+'</div>'
      +s.items.map(h=>'<div class="howItem"><div><div class="howName">'+h[0]+'</div><div class="howDesc">'+h[1]+'</div></div></div>').join('')+'</div>';
    const RULES_TAB={ico:'▣', name:'HOUSE RULES', col:'#e8b64c', items:[
      ['THE BET','You are Vesper. You owe the House your soul. Survive, level up, gamble — win it back or die trying.'],
      ['ONE BUTTON','Almost everything is SPACE. Spin, stop, roll, snap, push, live. WASD walks. That\'s the whole game.'],
      ['EVERY RUN ENDS','At 15:00 the House forecloses, always. The goal isn\'t to survive — it\'s to matter before you don\'t.'],
      ['THE HOUSE ALWAYS BLEEDS','…but it never loses. Play accordingly.']
    ]};
    const TABS=[RULES_TAB, H4[0], H4[1], H4[2], H4[3]];
    window._howTabs=TABS; window._howTab=0;
    const tabBtn=(s,i)=>'<button class="howTab'+(i===0?' on':'')+'" data-t="'+i+'" style="--hc:'+s.col+'">'+s.ico+' '+s.name+'</button>';
    hp.innerHTML='<div id="howTitle">♠ HOW TO PLAY ♠</div>'
      +'<div id="howTabs">'+TABS.map(tabBtn).join('')+'</div>'
      +'<div id="howBody"></div>'
      +'<button class="btn gold" id="howPlayNow" style="margin-top:10px;">♠ PLAY NOW</button>'
      +'<span class="prArrow hnPrev">‹</span><span class="prArrow hnNext">›</span>'
      +'<button class="gxBtn gxClose" id="howClose">CLOSE</button>';
    window._howShow=(i)=>{ if(i===undefined||isNaN(i)) i=window._howTab||0;
      window._howTab=((i%TABS.length)+TABS.length)%TABS.length;
      const s=TABS[window._howTab];
      hp.querySelectorAll('.howTab').forEach((b,bi)=>b.classList.toggle('on',bi===window._howTab));
      $('howBody').innerHTML=sec(s);
      SFX.uiDing(); };
    setTimeout(()=>window._howShow(0),0);
    setTimeout(()=>{ const pn=$('howPlayNow'); if(pn) pn.addEventListener('click',()=>{
      $('howPanel').classList.add('hidden');
      if(state==='menu'){ $('startBtn').click(); }
      else if(state==='paused'){ state='playing'; document.body.classList.remove('paused'); $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); }
    }); },0);
    document.body.appendChild(hp); // lives on the body — the MENU can open it too, not just the pause
    row.addEventListener('click',e=>e.stopPropagation());
    hp.addEventListener('click',e=>e.stopPropagation());
    $('howBtn').addEventListener('click',()=>{ hp.classList.remove('hidden'); window._howShow(window._howTab||0); });
    hp.addEventListener('click',e=>{ const b=e.target.closest('.howTab'); if(b) window._howShow(+b.dataset.t); });
    $('howClose').addEventListener('click',()=>{ hp.classList.add('hidden'); SFX.casinoDing(); });
    { const pv=hp.querySelector('.hnPrev'), nx=hp.querySelector('.hnNext');
      if(pv) pv.addEventListener('click',()=>window._howShow((window._howTab||0)-1));
      if(nx) nx.addEventListener('click',()=>window._howShow((window._howTab||0)+1)); }
    $('quitBtn').addEventListener('click',()=>quitToMenu());
    $('resumeBtn').addEventListener('click',()=>{ if(state==='paused'){ state='playing'; document.body.classList.remove('paused'); $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); } });
  } }
function quitToMenu(){
  document.body.classList.remove('floor-cellar','floor-chapel','bloodhour','paused');
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
{ const hb=$('howMenuBtn'); if(hb) hb.addEventListener('click',()=>{
  const hp9=$('howPanel'); if(hp9){ hp9.classList.remove('hidden'); if(typeof window._howShow==='function') window._howShow(window._howTab||0); SFX.uiDing(); } }); }
// F — the whole window belongs to the House
window.addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='f' && !e.repeat && (state==='menu'||state==='playing'||state==='paused')){
  try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }catch(x){} } });
// right-click stays native in menus, silent in the pit
window.addEventListener('contextmenu',e=>{ if(state==='playing'||state==='slot'||state==='wheel'||state==='dead') e.preventDefault(); });
$('mute').addEventListener('click',()=>{ muted=!muted; if(master) master.gain.value=muted?0:0.8; $('mute').textContent=muted?'♩':'♪'; $('mute').style.color=muted?'#5a4a3a':''; }); let tabHold=false;
function showTab(){
  let tp=$('tabPanel');
  if(!tp){ tp=document.createElement('div'); tp.id='tabPanel'; document.body.appendChild(tp); }
  const rc={common:'#cfc2a6',uncommon:'#8fd977',rare:'#6fb7ff',epic:'#c98bff',legendary:'#ffd36b',mythic:'#fff2c0',ascend:'#8bffd0'};
  // v4 — one modern sheet: stat tiles up top, weapon cards with their numbers
  // in plain sight, skill rows with live values, a thin red scar strip
  let h='<div class="tpSheet">';
  h+='<div class="tpStats">'
    +'<div class="tpTile"><b>'+P.level+'</b><i>LEVEL</i></div>'
    +'<div class="tpTile"><b>'+Math.ceil(P.hp)+'<em>/'+P.maxHp+'</em></b><i>BLOOD</i></div>'
    +'<div class="tpTile"><b>'+Math.round(P.damage)+'</b><i>DAMAGE</i></div>'
    +'<div class="tpTile"><b>'+P.coins.toLocaleString()+'</b><i>COINS</i></div>'
    +'<div class="tpTile"><b>'+RANK.rank+'</b><i>RANK</i></div>'
    +'</div>';
  h+='<div class="tpH">⚔ WEAPONS</div><div class="tpWGrid">';
  let anyW=false;
  WEAPONS.forEach(w=>{ const lv=P.wlv[w.id]||0; if(lv>0){ anyW=true;
    h+='<div class="tpWCard" style="--wc:'+(GLYPH_COL[w.id]||rc[w.rar]||'#fff')+'">'
      +'<span class="tpWG">'+w.g+'</span><b>'+w.n+'</b><i>Lv '+lv+'</i>'
      +'<em>'+projFx(w,lv)+'</em></div>'; }});
  if(!anyW) h+='<div class="tpEmpty">— unarmed —</div>';
  h+='</div>';
  h+='<div class="tpH">✦ SKILLS</div><div class="tpSRows">';
  if(P.passiveList.length){ P.passiveList.forEach(r=>{ const pdef=PASSIVES.find(p=>p.id===r.id);
    h+='<div class="tpSRow"><span class="tpg" style="color:'+(GLYPH_COL[r.id]||rc[r.rar]||'#fff')+'">'+r.g+'</span>'
      +'<b>'+r.n+'</b>'+(r.count>1?'<u>×'+r.count+'</u>':'')
      +'<em>'+(pdef?String(pdef.d(r.count)).slice(0,72):'')+'</em></div>'; });
  } else h+='<div class="tpEmpty">— empty-handed —</div>';
  h+='</div>';
  if(P.scars && P.scars.length){
    h+='<div class="tpScars">☠ SCARS &nbsp;·&nbsp; '+P.scars.map(sc=>(sc.g||'☒')+' '+(sc.l||sc)).join(' &nbsp;·&nbsp; ')+'</div>';
  }
  h+='</div>';
  tp.innerHTML=h;
  tp.classList.add('show');
}
function hideTab(){ const tp=$('tabPanel'); if(tp) tp.classList.remove('show'); }
const GFX={ q:'auto', shafts:true, ghosts:true, shake:1, flash:1, grade:true, sat:true, pcap:220, fps:false, lite:false, lod:'normal', preset:'medium' };
const GFX_KEY='antemortem_gfx_v1';
// one-click presets — MEDIUM matches the classic defaults so old saves label correctly
const GFX_PRESETS={
  toaster:{ q:'low',  lite:true,  shafts:false, ghosts:false, grade:false, shake:0.5, flash:0.5, pcap:70,  lod:'low' },
  low:    { q:'low',  lite:false, shafts:false, ghosts:false, grade:true,  shake:1,   flash:1,   pcap:140, lod:'low' },
  medium: { q:'auto', lite:false, shafts:true,  ghosts:true,  grade:true,  shake:1,   flash:1,   pcap:220, lod:'normal' },
  high:   { q:'high', lite:false, shafts:true,  ghosts:true,  grade:true,  shake:1,   flash:1,   pcap:220, lod:'high' }
};
function gfxDerivePreset(){
  for(const name in GFX_PRESETS){ const p=GFX_PRESETS[name];
    if(Object.keys(p).every(k=>GFX[k]===p[k])) return name; }
  return 'custom';
}
async function loadGfx(){ try{ const r=await store.get(GFX_KEY,false); if(r&&r.value) Object.assign(GFX,JSON.parse(r.value)); }catch(e){} GFX.preset=gfxDerivePreset(); applyGfxSide(); }
function saveGfx(){ try{ store.set(GFX_KEY,JSON.stringify(GFX),false); }catch(e){} }
function applyGfxSide(){
  // the volume knob is real: master gain follows it
  if(typeof master!=='undefined' && master && typeof muted!=='undefined' && !muted)
    master.gain.value=0.8*(GFX.vol!==undefined?GFX.vol:1);
}
const GFX_DEFS=[
 {k:'vol',  n:'MASTER VOLUME',  opts:[[1,'FULL'],[0.7,'70%'],[0.4,'40%'],[0.15,'15%'],[0,'MUTE']]},
 {k:'q',    n:'QUALITY',        opts:[['auto','AUTO'],['high','HIGH'],['low','LOW']]},
 {k:'shafts',n:'LIGHT SHAFTS',  opts:[[true,'ON'],[false,'OFF']]},
 {k:'ghosts',n:'GHOST PATRONS', opts:[[true,'ON'],[false,'OFF']]},
 {k:'grade', n:'CINEMATIC GRADE',opts:[[true,'ON'],[false,'OFF']]},
 {k:'shake', n:'SCREEN SHAKE',  opts:[[1,'FULL'],[0.5,'REDUCED'],[0,'OFF']]},
 {k:'flash', n:'SCREEN FLASH',  opts:[[1,'FULL'],[0.5,'REDUCED'],[0,'OFF']]},
 {k:'pcap',  n:'PARTICLES',     opts:[[260,'FULL'],[140,'REDUCED'],[70,'MINIMAL']]},
 {k:'lod',  n:'CHUNK DISTANCE', opts:[['low','LOW — 20 IN FULL ART'],['normal','NORMAL — 44'],['high','HIGH — 120'],['inf','INFINITE — ALL']]},
 {k:'fps',   n:'FPS COUNTER',   opts:[[false,'OFF'],[true,'ON']]},
 {k:'cb',   n:'COLORBLIND PIPS', opts:[[false,'OFF'],[true,'SHAPES']]},
 {k:'tabT', n:'TAB CODEX',      opts:[[false,'HOLD'],[true,'TOGGLE']]}
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
  p.innerHTML='<div id="gfxCard"><div id="gfxTitle">⚙ OPTIONS OF THE HOUSE ⚙</div>'
    +'<div id="gxPresets">'
    +[['toaster','🍞 TOASTER'],['low','LOW'],['medium','MEDIUM'],['high','HIGH']].map(x=>'<button class="gxPre" data-pre="'+x[0]+'">'+x[1]+'</button>').join('')
    +'</div><div id="gxCustom" style="display:none">CUSTOM</div>'
    +'<div class="gxRow"><span class="gxName">MASTER VOLUME</span><input type="range" id="gxVol" min="0" max="1" step="0.05" value="'+(GFX.vol!==undefined?GFX.vol:1)+'"></div>'
    +GFX_DEFS.filter(d=>d.k!=='vol').map(d=>'<div class="gxRow"><span class="gxName">'+d.n+'</span><button class="gxBtn" data-k="'+d.k+'">'+gfxLabel(d)+'</button></div>').join('')
    +'<div class="gxRow"><span class="gxName">FULLSCREEN</span><button class="gxBtn" id="gxFull">F — TOGGLE</button></div>'
    +'<div class="gxRow"><span class="gxName">EVERYTHING</span><button class="gxBtn" id="gxReset">RESET TO DEFAULTS</button></div>'
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
  { const gf=p.querySelector('#gxFull'); if(gf) gf.addEventListener('click',()=>{ try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }catch(x){} SFX.uiDing(); }); }
  { const gr=p.querySelector('#gxReset'); if(gr) gr.addEventListener('click',()=>{
      applyGfxPreset('medium'); GFX.vol=1; GFX.cb=false; GFX.fps=false; applyGfxSide(); saveGfx();
      const gv2=p.querySelector('#gxVol'); if(gv2) gv2.value=1;
      p.querySelectorAll('.gxBtn[data-k]').forEach(b=>{ const d=GFX_DEFS.find(x=>x.k===b.dataset.k); if(d) b.textContent=gfxLabel(d); });
      SFX.casinoDing(); }); }
  { const gv=p.querySelector('#gxVol'); if(gv){
      gv.addEventListener('input',()=>{ GFX.vol=parseFloat(gv.value); applyGfxSide();
        if(!gv._tk||performance.now()-gv._tk>120){ gv._tk=performance.now(); try{ tone(880,0.04,'sine',0.08); }catch(x){} } });
      gv.addEventListener('change',()=>{ saveGfx(); }); } }
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
const _hud={};
function _hSet(id,v){ if(_hud[id]===v) return; _hud[id]=v; $(id).textContent=v; }
function _hW(id,v){ const k='w'+id; if(_hud[k]===v) return; _hud[k]=v; $(id).style.width=v; }
function updateHUD(){
  // text/DOM writes only on change — the browser skips the rest for free
  _hSet('timer',fmt(gt));
  { let wv=$('waveInfo'); if(!wv){ wv=document.createElement('div'); wv.id='waveInfo'; const tm=$('timer'); if(tm&&tm.parentNode) tm.parentNode.insertBefore(wv,tm.nextSibling); }
    if(wv) { const left9=Math.max(0,enemies.filter(e=>!e.boss).length-waveClearTarget);
      let wtxt='WAVE '+wave+(left9>0?' · '+left9+' TO THIN':'');
      if(gt>=720&&gt<780) wtxt='☷ THE HOUSE IN '+Math.ceil(780-gt)+'s ☷'; if(_hud.wv!==wtxt){ _hud.wv=wtxt; wv.textContent=wtxt; } } }
  _hSet('coinCount',P.coins.toLocaleString());
  const bb=$('bossBar'); const bs=enemies.find(x=>x.boss);
  if(bs){ bb.classList.remove('hidden'); const bp9=Math.max(0,bs.hp/bs.maxhp*100);
    _hSet('bossName',BOSS_DEFS[bs.bossKind].name+' — '+Math.ceil(bp9)+'%'); _hW('bossFill',bp9.toFixed(1)+'%'); }
  else if(_hud.bossOn!==false) bb.classList.add('hidden');
  _hud.bossOn=!!bs;
  const hpPct=clamp(P.hp/P.maxHp,0,1)*100;
  _hW('hpfill',hpPct.toFixed(1)+'%');
  _hSet('hptext',Math.ceil(P.hp)+' / '+P.maxHp);
  _hSet('level','LEVEL '+P.level);
  _hSet('killCount',P.kills.toLocaleString());
  const cm=$('combo');
  if(killStreak>=4){ cm.classList.remove('hidden');
    const gp9=Math.max(0,Math.min(1,streakT/1.0))*100;
    const ch='×'+(P.comboMult||1).toFixed(1)+'  COMBO'+(P.bestStreak>killStreak?' <s>best '+P.bestStreak+'</s>':'')+'<i class="grace" style="width:'+gp9.toFixed(0)+'%"></i>';
    if(_hud.combo!==ch){ _hud.combo=ch; cm.innerHTML=ch; }
    cm.classList.toggle('flames', killStreak>=50);
    cm.style.transform='translateX(-50%) scale('+(1+Math.min(0.5,killStreak*0.01))+')'; }
  else cm.classList.add('hidden');
  const db=$('debuffs');
  if(db){ if(debuffs.length){
      const key=debuffs.map(b=>b.label+((b.t*4)|0)).join('|');
      if(_hud.dbKey!==key){ _hud.dbKey=key;
        db.innerHTML=debuffs.map(b=>'<span class="debuff'+(b.good?' buff':(b.poison?' poison':''))+'">'+(b.good?'✦ ':(b.poison?'☣ ':'☠ '))+b.label+' '+Math.ceil(b.t)+'s</span>').join(''); }
    } else if(db.childElementCount){ db.innerHTML=''; _hud.dbKey=''; } }
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
  const bw=$('relicsW'), bs=$('relicsS'), bc=$('relicsC'); bw.innerHTML=''; bs.innerHTML=''; if(bc) bc.innerHTML='';
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
  // afflictions live in their OWN row now — curses and scars are not skills
  { const tag=$('relicTagC');
    const any=(P.curses&&P.curses.length)||(P.scars&&P.scars.length);
    if(tag) tag.style.display=any?'':'none';
    if(bc){ bc.style.display=any?'':'none';
      if(P.curses) P.curses.forEach(c=>{ const d=document.createElement('div'); d.className='relic curse'; d.textContent='☠'; d.title='CURSE '+c.short+' · '+c.waves+' waves left'; bc.appendChild(d); });
      if(P.scars) P.scars.forEach(sl=>{ const isO=typeof sl==='object'; const d=document.createElement('div'); d.className='relic scar'; d.textContent=isO?sl.g:'☒'; relicTip(d,'SCAR',1,(isO?sl.l:sl)+' — this run'); bc.appendChild(d); }); } }
}

/* ============================================================
   INPUT
   ============================================================ */
const keys=new Set();
const touch={active:false,wx:0,wy:0};
window.addEventListener('keyup',e=>{ if(e.key==='Tab'){ e.preventDefault(); tabHold=false; hideTab(); } });
window.addEventListener('keydown',e=>{
  let k=e.key.toLowerCase();
  if(e.code==='NumpadEnter') k=' ';
  if(k==='m' && !e.repeat && !(document.activeElement&&document.activeElement.tagName==='INPUT')){ const mb=$('mute'); if(mb){ mb.click(); } }
  feedSecretKeys(k);
  { const hp9=$('howPanel');
    if(hp9 && !hp9.classList.contains('hidden') && window._howShow){
      if(k==='d'||k==='arrowright'){ e.preventDefault(); window._howShow((window._howTab||0)+1); return; }
      if(k==='a'||k==='arrowleft'){ e.preventDefault(); window._howShow((window._howTab||0)-1); return; } } }
  { const pr9=document.getElementById('pageReveal');
    if(pr9 && !pr9.classList.contains('hidden') && typeof stepStoryPage==='function'){
      if(k==='d'||k==='arrowright'){ e.preventDefault(); stepStoryPage(1); return; }
      if(k==='a'||k==='arrowleft'){ e.preventDefault(); stepStoryPage(-1); return; } } }
  if(k==='tab'){ e.preventDefault(); if(!e.repeat && (state==='playing'||state==='slot'||state==='wheel')){
    if(GFX.tabT){ const tp=$('tabPanel'); if(tp&&tp.classList.contains('show')) hideTab(); else { showTab(); SFX.uiDing(); } }
    else { tabHold=true; showTab(); SFX.uiDing(); } } return; }
  const inInput = document.activeElement && document.activeElement.tagName==='INPUT';
  if(!inInput && ['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(state==='menu' && !e.repeat && !(document.activeElement&&document.activeElement.tagName==='INPUT')){
    const hot={'i':'indexBtn','l':'storyBtn','o':'gfxBtn','h':'howMenuBtn'};
    if(hot[k] && !$('menu').classList.contains('hidden')){ const b=$(hot[k]); if(b){ b.click(); return; } }
  }
  if(state==='menu' && k===' ' && !e.repeat){
    const panelOpen=['storyPanel','indexPanel','achPanel','vaultPanel','gfxPanel'].some(id=>{ const p=$(id); return p && !p.classList.contains('hidden'); });
    if(!panelOpen && !$('menu').classList.contains('hidden')){ e.preventDefault(); SFX.press(); $('startBtn').click(); return; }
  }
  if(state==='marker' || state==='dead'){
    if(['w','a','s','d','z','q','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){ e.preventDefault(); return; } }
  if(state==='dead'){
    if(k==='r' && !e.repeat){ window._rHold=performance.now(); SFX.press(); pressPulse('againBtn'); return; }
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
    if(state==='slot'||state==='wheel'){ showStreak('… FINISH THE HAND …'); SFX.thud(); return; }
    // universal BACK: any open parlor closes before the pause even wakes
    { const open=['booksPanel','antePanel','gfxPanel','indexPanel','achPanel','storyPanel','vaultPanel','howPanel']
        .map(id=>$(id)).find(p=>p && !p.classList.contains('hidden'));
      if(open && state!=='vault'){ open.classList.add('hidden'); if(open.id==='vaultPanel') vaultBrowse=false; SFX.casinoDing(); return; } }
    if(state==='vault'){ $('vaultPanel').classList.add('hidden'); state='playing'; SFX.casinoDing(); return; }
    if(state==='playing'){ state='paused'; document.body.classList.add('paused'); $('pauseLayer').classList.remove('hidden'); SFX.thud(); window._pzT=performance.now();
      { const pt=document.querySelector('.pauseCard .pz'); if(pt) pt.textContent='◈ PAUSED ◈'; }
      $('pauseStats').innerHTML='<div class="ps"><b>'+P.kills+'</b><i>KILLS</i></div><div class="ps"><b>'+P.level+'</b><i>LEVEL</i></div><div class="ps"><b>'+P.coins+'</b><i>COINS</i></div><div class="ps"><b>'+wave+'</b><i>WAVE</i></div><div class="ps"><b>'+Math.floor(gt/60)+':'+String(Math.floor(gt%60)).padStart(2,'0')+'</b><i>TIME</i></div>'+'<div style="flex-basis:100%;text-align:center;font-family:var(--disp);font-size:10px;letter-spacing:.08em;color:#9a8f7e;margin-top:8px">◈ COINS — the House&#39;s gold, this run · ⚜ XP — level charge, wagered in the Ascent · GILT — eternal Vault currency</div>'; if(P){ P._pauses=(P._pauses||0)+1; if(P._pauses>=13) secret('coldfeet','COLD FEET'); } }
    else if(state==='paused'){
      if(performance.now()-(window._pzT||0)<500){ quitToMenu(); return; } // ESC·ESC — straight to the door
      state='playing'; document.body.classList.remove('paused'); $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); }
    return;
  }
  if(k==='q' && state==='paused'){ e.preventDefault(); quitToMenu(); return; }
  if(state==='playing' && k===' '){
    e.preventDefault();
    if(P.ovT>0){ cashRage(); return; }
    if(vaultProp && Math.hypot(P.x-vaultProp.x,P.y-vaultProp.y)<115){
      if(vaultWindowOpen()){ state='vault'; openVault(); }
      else if(gt<180){ announce('◈ THE VAULT MANIFESTS AT 3:00 ◈',false); SFX.thud(); }
      else { announce('◈ THE VAULT RESTS — BACK IN '+Math.max(1,Math.ceil((vaultLocked-gt)/60))+' MIN ◈',false); SFX.thud(); }
      return; }
    if(killStreak>=27){ const cash=Math.floor(killStreak/4);
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
        if(mk.p>=mk.max) secret('pressmax','THE CEILING');
        SFX.press();
        pressFx(mk);
        renderPressMeter();
        pressPulse(document.querySelector('#jackpotSub .fpHint')); // after render — the div is rebuilt each press
      }
    }
    return; }
  if(state==='wheel'){ if(k===' '){ e.preventDefault();
    if(!e.repeat){ SFX.press(); pressPulse('wheelMsg'); }
    if(wheel.phase==='sealed') unsealWheel();
    else if(wheel.phase==='roll') brakeTicker();
    else if(wheel.phase==='freespin'){ SFX.leverWind(); SFX.tingle(); respinTicker(); }
    else if(wheel.done) finishWheel();
    else launchWheel(); } return; }
  if(state==='slot'){
    if(k===' '){
      if(e.repeat) return;
      SFX.press(); pressPulse('gambleMsg');
      if(slotStage==='offer'){ spaceHold=true; holdProg=0; holdFired=false; ringShow(true);
        const rb=$('rollBtn'); if(rb) rb.classList.add('held'); }
      else slotTap();
      // pulse AFTER the action — showSlotButtons rebuilds the button, so the
      // flash must land on the NEW element (this is why only the last stop lit)
      { const ab=document.querySelector('#slotBtns .btn'); if(ab) pressPulse(ab); }
      { const m=$('machine'); if(m){ m.classList.remove('pressflash'); void m.offsetWidth; m.classList.add('pressflash'); } }
    }
    return;
  }
  keys.add(k);
});
window.addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  if(k==='r' && state==='dead' && window._rHold){ if(performance.now()-window._rHold>=400){ $('againBtn').click(); } window._rHold=0; return; }
  if(k===' ' && state==='slot'){
    { const rb=$('rollBtn'); if(rb) rb.classList.remove('held'); }
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
{ const chime=b=>{ if(!AC||muted) return;
    if(b.id==='startBtn'){ // PLAY TONIGHT speaks in velvet — a low thump under a gold chime
      tone(196,0.16,'sine',0.14,150); tone(988,0.1,'sine',0.05); setTimeout(()=>tone(1318,0.08,'sine',0.04),60); return; }
    const sibs=[...b.parentNode.querySelectorAll('.btn')]; const i=Math.max(0,sibs.indexOf(b));
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
$('booksBtn').addEventListener('click',()=>{ openBooks(); });
}
window.addEventListener('blur',()=>{ keys.clear(); touch.active=false; tabHold=false; hideTab(); }); // blur clears input only — it must NEVER pause (fires constantly in embeds/iframes)
window.addEventListener('error',ev=>{ if(!window._amErr){ window._amErr=1; console.error('[ANTE MORTEM]',ev.error||ev.message); } });
$('againBtn').addEventListener('click',()=>{ startGame(); });

function menuMotion(){
  const m=$('menu'); if(!m || m._motion) return; m._motion=true;
  const holder=document.createElement('div'); holder.id='menuMotion'; m.insertBefore(holder, m.firstChild);
  for(let i=0;i<12;i++){ const em=document.createElement('span'); em.className='mEmber';
    em.style.left=(Math.random()*100)+'%'; em.style.animationDelay=(Math.random()*9)+'s';
    em.style.animationDuration=(7+Math.random()*7)+'s'; em.style.width=em.style.height=(2+Math.random()*3.5)+'px';
    holder.appendChild(em); }
  const suits=['♠','♥','♦','♣'];
  for(let i=0;i<6;i++){ const su=document.createElement('span'); su.className='mSuit';
    su.textContent=suits[i%4]; su.style.left=(6+Math.random()*88)+'%';
    su.style.animationDelay=(Math.random()*14)+'s'; su.style.animationDuration=(12+Math.random()*8)+'s';
    su.style.fontSize=(13+Math.random()*14)+'px';
    holder.appendChild(su); }
  const aur=document.createElement('div'); aur.id='menuAurora'; m.insertBefore(aur, m.firstChild);
}

/* ============================================================
   THE SOULS — six ways to owe the House. Selection lives in
   IDX.sl (am_index_v1, additive). Applied last in startGame.
   ============================================================ */

/* THE FLOORS — where tonight happens */
const FLOORS=[
 {id:'pit',    n:'THE PIT',    g:'♠', col:'#c9b78e', d:'The casino floor as the House built it.', u:()=>true, uTxt:'', mods:{}},
 {id:'cellar', n:'THE CELLAR', g:'♣', col:'#8fd977', d:'Below the tables. The swarm owns it — hordes +40%, no shooters, coins +15%.',
   u:()=>RANK.rank>=20, uTxt:'REACH HOUSE RANK 20', mods:{horde:1.4, noRanged:true, coin:1.15, tint:'cellar'}},
 {id:'chapel', n:'THE CHAPEL', g:'☨', col:'#fff2c0', d:'Where the House prays to itself. Everything runs 10% faster. XP +10%, tarot twice as often.',
   u:()=>(LT.houseMet||0)>=3, uTxt:'MEET THE HOUSE 3 TIMES', mods:{spd:1.1, xp:1.1, tarot:2, tint:'chapel'}}
];
function curFloor(){ const f=FLOORS.find(x=>x.id===(IDX.fl||'pit')); return (f&&f.u())?f:FLOORS[0]; }
/* THE CONTRACTS — sign up to two; each pays ×1.25 marks & gilt at the ledger */
const RUN_CONTRACTS=[
 {id:'glass',    g:'♡', n:'GLASS SOUL',     d:'Max blood halved. Every touch is a sentence.', u:()=>RANK.rank>=15, uTxt:'HOUSE RANK 15', ap:()=>{ P.maxHp=Math.max(20,Math.round(P.maxHp*0.5)); P.hp=P.maxHp; }},
 {id:'drought',  g:'✕', n:'THE DROUGHT',    d:'Fountains run dry. The wheel never heals.', u:()=>(LT.deaths||0)>=25, uTxt:'DIE 25 TIMES', ap:()=>{ P.drought=true; }},
 {id:'crowd',    g:'♟', n:'CROWDED TABLE',  d:'The pit spawns 30% heavier, all night.', u:()=>(LT.kills||0)>=5000, uTxt:'5,000 LIFETIME KILLS', ap:()=>{ P.crowd=true; }},
 {id:'cold',     g:'❄', n:'COLD DECK',      d:'The reels never match. No pairs. No triples. Ever.', u:()=>(LT.spins||0)>=100, uTxt:'SPIN 100 SLOTS', ap:()=>{ P.coldDeck=true; }},
 {id:'midnight', g:'☾', n:'MIDNIGHT START', d:'The clock opens at 3:00 — ten minutes to matter.', u:()=>(LT.houseMet||0)>=1, uTxt:'MEET THE HOUSE ONCE', ap:()=>{ gt=180; }},
 {id:'nomercy',  g:'☠', n:'NO MERCY',       d:'Elites hunt in pairs, all night.', u:()=>RANK.rank>=35, uTxt:'HOUSE RANK 35', ap:()=>{ P.noMercy=true; }},
 {id:'stampede', g:'♞', n:'THE STAMPEDE',   d:'A horde pours in EVERY wave. No quiet ones.', u:()=>(LT.kills||0)>=10000, uTxt:'10,000 LIFETIME KILLS', ap:()=>{ P.stampede=true; }},
 {id:'nothing',  g:'⚖', n:'DOUBLE OR NOTHING', d:'No DEATH ROLL. Die once, die for real.', u:()=>RANK.rank>=50, uTxt:'HOUSE RANK 50', ap:()=>{ P.markerUsed=true; P.noRoll=true; }}
];
// contract SLOTS — one comes free; the second and third are bought in gilt
function ctSlots(){ return Math.min(3, IDX.ctSlots||1); }
const CT_SLOT_COST=[0, 25000, 100000];
const SOULS=[
 {id:'vesper', n:'VESPER',     g:'♠', col:'#e6d9c2', d:'The staked soul. Balanced hands, every door open.',
   pips:'♥♥♥ · 👢👢👢 · 🎲🎲🎲', u:()=>true, uTxt:'', ap:()=>{}},
 {id:'dealer', n:'THE DEALER', g:'♦', col:'#6fb7ff', d:'Starts with Dealer\'s Hand. Every dice target −1, forever. Thin blood: −20 max.',
   pips:'♥♥ · 👢👢👢 · 🎲🎲🎲🎲🎲', u:()=>RANK.rank>=12, uTxt:'REACH HOUSE RANK 12', ap:()=>{ P.wlv={cards:1}; P.diceEase=1; P.maxHp=Math.max(40,P.maxHp-20); P.hp=P.maxHp; }},
 {id:'widow',  n:'THE WIDOW',  g:'☾', col:'#c98bff', d:'She kept her Grave Moths. +15% XP. −15% damage — grief dulls the blade.',
   pips:'♥♥ · 👢👢👢👢 · ✦✦✦✦', u:()=>SEC.size>=12, uTxt:'ANSWER 12 WHISPERS', ap:()=>{ P.wlv={moths:1}; P.xpMult=(P.xpMult||1)*1.15; P.damage*=0.85; }},
 {id:'debtor', n:'THE DEBTOR', g:'◈', col:'#ffd36b', d:'Starts rich: 60 coins, ×1.35 coin gain. Takes +10% damage — the interest.',
   pips:'♥♥♥ · 👢👢 · ◈◈◈◈◈', u:()=>(LT.deaths||0)>=25, uTxt:'DIE 25 TIMES', ap:()=>{ P.coins+=60; P.coinMult=(P.coinMult||1)*1.35; P.dmgTakenMult=(P.dmgTakenMult||1)+0.10; }},
 {id:'brute',  n:'THE BRUTE',  g:'⚒', col:'#ff9a3c', d:'Starts with Iron Stakes. +25% damage, +20 blood, −15% speed. Subtlety is for the thin.',
   pips:'♥♥♥♥♥ · 👢 · ⚔⚔⚔⚔', u:()=>(LT.kills||0)>=2500, uTxt:'2,500 LIFETIME KILLS', ap:()=>{ P.wlv={stakes:1}; P.damage*=1.25; P.maxHp+=20; P.hp=P.maxHp; P.speed*=0.85; }},
 {id:'yolk',   n:'THE YOLK',   g:'◌', col:'#fff2c0', d:'Hatched too early. Tiny, quick, 60 blood — wide pockets, and the reels lean toward pairs for it.',
   pips:'♥ · 👢👢👢👢👢 · 🎲🎲🎲🎲', u:()=>SEC.has('theegg'), uTxt:'FIND THE EGG', ap:()=>{ P.wlv={razor:1}; P.radius*=0.7; P.speed*=1.2; P.maxHp=60; P.hp=60; P.pickup+=24; P.yolkFate=true; }}
];
function curSoul(){ const s=SOULS.find(x=>x.id===(IDX.sl||'vesper')); return (s&&s.u())?s:SOULS[0]; }
// INDULGENCES — gilt buys the night a head start. Consumed when the run begins.
const INDULGENCES=[
 {id:'coffee', g:'☕', n:"DEALER'S COFFEE", cost:60,  d:'Your first slot of the night deals HOT — red-tier odds.'},
 {id:'pockets',g:'◈', n:'LOADED POCKETS',  cost:80,  d:'Start the night with +60 coins.'},
 {id:'blood',  g:'♥', n:'THICK BLOOD',     cost:100, d:'+25 max blood for the night.'},
 {id:'roller', g:'⚜', n:'HIGH ROLLER',     cost:150, d:'Your first 3 slots deal HOT — red-tier odds.'}
];
function openAnteRoom(){
  let p=$('antePanel');
  if(!p){ p=document.createElement('div'); p.id='antePanel'; p.className='layer hidden';
    p.innerHTML='<div class="panel" style="max-width:min(880px,94vw);max-height:88vh;display:flex;flex-direction:column;">'
      +'<h2 style="font-family:var(--disp);color:var(--gold-bright);letter-spacing:.14em;margin:0 0 10px;">♠ THE ANTE ROOM</h2>'
      +'<div id="anteBody" style="overflow-y:auto;flex:1;text-align:left;padding-right:6px;"></div>'
      +'<button class="btn" id="anteClose" style="margin-top:12px;">Back</button></div>';
    document.body.appendChild(p);
    $('anteClose').addEventListener('click',()=>{ p.classList.add('hidden'); renderChips(); SFX.casinoDing(); });
    $('anteBody').addEventListener('click',ev=>{
      const sc=ev.target.closest('.soulCard'); if(sc && !sc.classList.contains('locked')){ IDX.sl=sc.dataset.id; idxSaveSoon(); renderAnteRoom(); SFX.uiDing(); return; }
      const fc=ev.target.closest('.floorCard'); if(fc && !fc.classList.contains('locked')){ IDX.fl=fc.dataset.id; idxSaveSoon(); renderAnteRoom(); SFX.uiDing(); return; }
      const cc=ev.target.closest('.ctChip'); if(cc){
        if(cc.classList.contains('locked')){ SFX.thud(); return; }
        const id=cc.dataset.id; IDX.ct=IDX.ct||[];
        const i=IDX.ct.indexOf(id); if(i>=0) IDX.ct.splice(i,1); else if(IDX.ct.length<ctSlots()) IDX.ct.push(id); else { SFX.thud(); return; }
        idxSaveSoon(); renderAnteRoom(); SFX.press(); return; }
      const sb9=ev.target.closest('.ctSlotBuy'); if(sb9){
        const nxt=ctSlots()+1; const cost=CT_SLOT_COST[nxt-1];
        if(nxt>3||!cost) return;
        if(gilt<cost){ SFX.bust(); sb9.classList.add('deny'); setTimeout(()=>sb9.classList.remove('deny'),350); return; }
        gilt-=cost; saveGilt(); IDX.ctSlots=nxt; idxSaveSoon();
        SFX.vaultBuy&&SFX.vaultBuy(); SFX.dingBells(); coinRain(18); sparkBurst(24); flash(0.4,'#ffd36b');
        announce('✍ A '+(nxt===2?'SECOND':'THIRD')+' CONTRACT SLOT — THE HOUSE NOTARIZES ✍', true);
        renderAnteRoom(); return; }
      const ic=ev.target.closest('.indChip'); if(ic && !ic.classList.contains('owned')){
        const d=INDULGENCES.find(x=>x.id===ic.dataset.id); if(!d) return;
        if(gilt<d.cost){ SFX.bust(); ic.classList.add('deny'); setTimeout(()=>ic.classList.remove('deny'),350); return; }
        gilt-=d.cost; saveGilt(); (IDX.ind=IDX.ind||[]).push(d.id); idxSaveSoon();
        SFX.chipStack(); SFX.dingBells(); coinRain(10); sparkBurst(16);
        renderAnteRoom(); return; }
    });
  }
  renderAnteRoom();
  p.classList.remove('hidden'); SFX.uiDing();
}
function renderAnteRoom(){
  const b=$('anteBody'); if(!b) return;
  const cur=curSoul();
  let html='<div class="anteH">CHOOSE YOUR SOUL</div><div class="soulRow">';
  SOULS.forEach(s=>{ const un=s.u(), on=cur.id===s.id;
    html+= un
      ? '<div class="soulCard'+(on?' on':'')+'" data-id="'+s.id+'" style="--sc:'+s.col+'"><div class="soulG">'+s.g+'</div><div class="soulN">'+s.n+'</div><div class="soulD">'+s.d+'</div>'+(s.pips?'<div class="soulPips">'+s.pips+'</div>':'')+(on?'<div class="soulPick">— AT THE TABLE —</div>':'')+'</div>'
      : '<div class="soulCard locked" title="'+s.uTxt.replace(/"/g,'&quot;')+'"><div class="soulG">?</div><div class="soulN">SEALED</div><div class="soulD">🔒 '+s.uTxt+'</div></div>';
  });
  html+='</div>';
  if(typeof FLOORS!=='undefined'){
    const curF=curFloor();
    html+='<div class="anteH">CHOOSE YOUR FLOOR</div><div class="soulRow">';
    FLOORS.forEach(f=>{ const un=f.u(), on=curF.id===f.id;
      html+= un
        ? '<div class="floorCard'+(on?' on':'')+'" data-id="'+f.id+'" style="--sc:'+f.col+'"><div class="soulG">'+f.g+'</div><div class="soulN">'+f.n+'</div><div class="soulD">'+f.d+'</div>'+(on?'<div class="soulPick">— TONIGHT —</div>':'')+'</div>'
        : '<div class="floorCard locked"><div class="soulG">?</div><div class="soulN">SEALED</div><div class="soulD">🔒 '+f.uTxt+'</div></div>';
    });
    html+='</div>';
  }
  if(typeof RUN_CONTRACTS!=='undefined'){
    const act=IDX.ct||[]; const sl9=ctSlots();
    while(act.length>sl9) act.pop(); // stale saves respect the cap
    let slotPips=''; for(let i=0;i<3;i++) slotPips+= i<sl9?'◆':'◇';
    html+='<div class="anteH">SIGN CONTRACTS <span style="opacity:.6;font-size:11px">(slots '+slotPips+' · each pays ×1.25)</span>'
      +(act.length?' <b style="color:#8bff9a;letter-spacing:.1em;font-size:12px">— TONIGHT PAYS ×'+Math.pow(1.25,act.length).toFixed(2)+' MARKS & GILT</b>':'')
      +'</div>';
    if(sl9<3){ const cost=CT_SLOT_COST[sl9];
      html+='<div class="ctSlotBuy'+(gilt<cost?' broke':'')+'">🖋 UNLOCK '+(sl9===1?'SECOND':'THIRD')+' CONTRACT SLOT — <b>'+cost.toLocaleString()+' ◈ GILT</b></div>'; }
    html+='<div class="ctRow">';
    RUN_CONTRACTS.forEach(c=>{ const un=!c.u||c.u();
      html+= un
        ? '<div class="ctChip'+(act.includes(c.id)?' on':'')+'" data-id="'+c.id+'"><b>'+c.g+' '+c.n+'</b><span>'+c.d+'</span></div>'
        : '<div class="ctChip locked" title="'+(c.uTxt||'')+'"><b>🔒 SEALED</b><span>'+c.uTxt+'</span></div>'; });
    html+='</div>';
  }
  { const owned=IDX.ind||[];
    html+='<div class="anteH">BUY INDULGENCES <span style="opacity:.6;font-size:11px">(gilt · one night only) — YOU HOLD <b style="color:var(--gold-bright)">'+gilt+' ◈ GILT</b></span></div><div class="ctRow">';
    INDULGENCES.forEach(d=>{ const own=owned.includes(d.id);
      html+='<div class="indChip'+(own?' owned':'')+(gilt<d.cost&&!own?' broke':'')+'" data-id="'+d.id+'"><b>'+d.g+' '+d.n+'</b><span>'+d.d+'</span>'
        +'<i>'+(own?'SEALED FOR TONIGHT':d.cost+' ◈')+'</i></div>'; });
    html+='</div>'; }
  b.innerHTML=html;
}

// THE ESTATE — how much of the House is yours yet
function estatePct(){
  try{
    const ranks=Math.min(1, RANK.rank/100);
    const wsp=Math.min(1, SEC.size/WHISPER_TOTAL);
    const idx=idxSeen()/Math.max(1,idxTotal());
    const pages=STORY_PAGES.filter(p=>storyUnlocked(p)).length/STORY_PAGES.length;
    const feats=unlocked.size/Math.max(1,ACH_TOTAL);
    const souls=SOULS.filter(s=>s.u()).length/SOULS.length;
    const floors=FLOORS.filter(f=>f.u()).length/FLOORS.length;
    return Math.round((ranks*0.30 + wsp*0.15 + idx*0.20 + pages*0.10 + feats*0.15 + (souls+floors)/2*0.10)*100);
  }catch(e){ return 0; }
}
function renderChips(){
  try{ storyPulse(); }catch(e){}
  try{ menuMotion(); }catch(e){}
  // the loadout line — who, where, and on what terms
  { let ln9=$('lastNight');
    if(!ln9 && best>0){ ln9=document.createElement('div'); ln9.id='lastNight';
      const sb=$('startBtn'); if(sb) sb.parentNode.insertBefore(ln9, sb); }
    if(ln9) ln9.textContent = best>0 ? ('BEST NIGHT — '+best.toLocaleString()) : ''; }
  { if(_est>=100){ const tg=document.querySelector('#menu .tag'); if(tg && !tg.dataset.owned){ tg.dataset.owned='1'; tg.textContent='THE HOUSE IS YOURS'; } } }
  { let ll=$('loadoutLine');
    if(!ll){ ll=document.createElement('div'); ll.id='loadoutLine';
      const sb=$('startBtn'); if(sb) sb.parentNode.insertBefore(ll, sb.nextSibling);
      ll.addEventListener('click',()=>openAnteRoom()); }
    if(ll){ const s=curSoul(); const f=(typeof curFloor==='function')?curFloor():null;
      const cts=(IDX.ct||[]).length;
      ll.innerHTML='<span style="color:'+s.col+'">'+s.g+' '+s.n+'</span>'+(f?' · <span style="color:'+f.col+'">'+f.g+' '+f.n+'</span>':'')+(cts?' · ✍ '+cts+' CONTRACT'+(cts>1?'S':''):'')+' <i>— change</i>'; } }
  // the road ahead, visible: rank progress under the chips
  { let rb=$('menuRank');
    if(!rb){ rb=document.createElement('div'); rb.id='menuRank';
      const cr=$('chipRow'); if(cr) cr.parentNode.insertBefore(rb, cr.nextSibling);
      rb.style.cursor='pointer'; rb.title='THE LADDER — every rank, every reward';
      rb.addEventListener('click',()=>{ openIndexPanel(); SFX.uiDing(); }); }
    if(rb && typeof RANK!=='undefined' && typeof rkCum==='function'){
      const base=rkCum(RANK.rank), next=RANK.rank<RANKS.length?rkCum(RANK.rank+1):base+1;
      const pct=Math.min(100,Math.round((RANK.marks-base)/(next-base)*100));
      rb.classList.toggle('near', pct>=90);
      rb.innerHTML='<div class="mrTop">⚜ RANK '+RANK.rank+' — '+RANKS[RANK.rank-1].n+'</div>'
        +'<div class="mrBar"><i style="width:'+pct+'%"></i></div>'
        +'<div class="mrSub">'+(RANK.marks-base)+' / '+(next-base)+' MARKS TO RANK '+(RANK.rank+1)+'</div>'; } }
  const _est=estatePct();
  const chips=[
    best>0?['🏆',best.toLocaleString(),'#ffd36b']:null,
    ['📖',idxPct()+'%','#c98bff'],
    ['✦',SEC.size+'/'+WHISPER_TOTAL,'#8bffd0'],
    ['🏛',_est+'% OF THE HOUSE — ranks 30 · index 20 · whispers 15 · feats 15 · pages 10 · souls&floors 10','#e8b64c'],
    (LT.minutes||0)>=30?['⏱',((LT.minutes||0)/60).toFixed(1)+'h AT THE TABLE','#9adcff']:null,
    ...(function(){ const nx=nextArmUnlock(); if(!nx) return []; const wd=WEAPONS.find(x=>x.id===nx.id);
      return wd?[['🗡','NEXT ARM: '+wd.n.toUpperCase()+' · RANK '+nx.thr,'#ff9a3c']]:[]; })(),
    ['⚜','RANK '+RANK.rank+' · '+RANKS[RANK.rank-1].n,'#fff2c0'],
    window._daily?['☀',window._daily,'#8bff9a']:null
  ].filter(Boolean);
  const tipFor=(g)=>({'🏆':'FEATS — lifetime marks of skill','📖':'THE INDEX — everything catalogued','✦':'WHISPERS — riddles answered','🏛':'THE ESTATE — how much of the House is yours','🗡':'THE ARSENAL DRIP — the next blade and its rank','⚜':'HOUSE RANK — your standing tonight'})[g]||'';
  const cr=$('chipRow'); if(cr) cr.innerHTML=chips.map(c=>'<span class="mChip" style="--cc:'+c[2]+'" title="'+tipFor(c[0])+'"><b>'+c[0]+'</b>'+c[1]+'</span>').join('');
  if(window._lastEst!==undefined && _est>window._lastEst && cr){ const ec=[...cr.children].find(x=>x.textContent.includes('OF THE HOUSE'));
    if(ec){ ec.classList.add('estGrow'); setTimeout(()=>ec.classList.remove('estGrow'),2600); SFX.tingle&&SFX.tingle(); } }
  window._lastEst=_est;
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

// THE HOUSE WAITS — only a genuinely backgrounded TAB pauses the night. blur is
// far too eager (embeds, iframes, devtools, clicking off-window all fire it), so
// it must never pause — and this auto-pause SELF-HEALS the instant you return.
function houseWaits(){
  if(window._noAutoPause) return;
  if(state!=='playing') return;
  window._autoPaused=true;
  state='paused'; document.body.classList.add('paused');
  $('pauseLayer').classList.remove('hidden');
  const pt=document.querySelector('.pauseCard .pz'); if(pt) pt.textContent='◈ THE HOUSE WAITS ◈';
  SFX.thud&&SFX.thud();
}
function houseReturns(){
  if(window._autoPaused && state==='paused'){
    window._autoPaused=false;
    state='playing'; document.body.classList.remove('paused'); $('pauseLayer').classList.add('hidden');
    const pt=document.querySelector('.pauseCard .pz'); if(pt) pt.textContent='◈ PAUSED ◈';
    if(P) P.inv=Math.max(P.inv||0,1); // a breath of grace on return
  }
}
window.addEventListener('blur',()=>{ try{ keys.clear(); }catch(e){} }); // input hygiene only — no pause
window.addEventListener('focus',()=>{ houseReturns(); if(P && state==='playing') P.inv=Math.max(P.inv||0,1); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) houseWaits(); else houseReturns(); });
// the menu beckons after a quiet minute
let _idleT=performance.now();
['keydown','mousemove','mousedown'].forEach(ev=>window.addEventListener(ev,()=>{ _idleT=performance.now();
  const sb=$('startBtn'); if(sb) sb.classList.remove('beckon'); }));
setInterval(()=>{ if(state==='menu' && performance.now()-_idleT>60000){
  const sb=$('startBtn'); if(sb && !sb.classList.contains('beckon')){ sb.classList.add('beckon'); SFX.tingle&&SFX.tingle(); } } }, 5000);
// every menu press answers back
{ const mr=$('menuRow2'); if(mr) mr.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b){ pressPulse(b); } }); }

// the mouse is a SPACE too — on the safe beats (never on the offer; no misclick takes)
{ const sl=$('slot'); if(sl) sl.addEventListener('click',e=>{
    if(e.target.closest('button')) return;
    if(state!=='slot') return;
    if(['spinning','select','dicing','resolved','ready'].includes(slotStage)){ SFX.press&&SFX.press(); slotTap(); } }); }
{ const wl=$('wheelLayer'); if(wl) wl.addEventListener('click',e=>{
    if(e.target.closest('button')) return;
    if(state!=='wheel') return;
    SFX.press&&SFX.press();
    if(wheel.phase==='sealed') unsealWheel();
    else if(wheel.phase==='roll') brakeTicker();
    else if(wheel.phase==='freespin') respinTicker();
    else if(wheel.done) finishWheel();
    else launchWheel(); }); }

// every button in the House answers the finger — one quiet felt tick, always
document.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  try{ tone(1450,0.02,'square',0.028); }catch(x){}
},true);
