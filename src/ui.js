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
function fadeCut(){ let v=document.getElementById('fadeVeil'); if(!v){ v=document.createElement('div'); v.id='fadeVeil'; document.body.appendChild(v); }
  v.classList.remove('go'); void v.offsetWidth; v.classList.add('go'); }
// 313: the whole soul — all five ledgers — leaves as one sealed string
async function exportSave(){
  try{
    if(!store){ announce('✕ NO LEDGER TO EXPORT ✕',false); return; }
    const keys=[RANK_KEY,ACH_KEY,GILT_KEY,GFX_KEY,IDX_KEY]; const out={_am:'v3', t:Date.now()};
    for(const k of keys){ const r=await store.get(k,false); if(r&&r.value) out[k]=r.value; }
    const blob='AMSAVE1.'+btoa(unescape(encodeURIComponent(JSON.stringify(out))));
    try{ await navigator.clipboard.writeText(blob); announce('◈ YOUR SOUL, PORTABLE — COPIED ◈',true); SFX.chipStack(); }
    catch(e){ prompt('COPY YOUR SOUL:', blob); }
  }catch(e){ announce('✕ THE EXPORT FAILED ✕',false); }
}
// 314: a pasted soul is inspected (schema + parse of every ledger) before it may sit down
async function importSave(){
  try{
    if(!store){ announce('✕ NO LEDGER TONIGHT ✕',false); return; }
    const s=prompt('PASTE YOUR SOUL (AMSAVE1.…):'); if(!s) return;
    const m=s.trim(); if(m.indexOf('AMSAVE1.')!==0) throw 0;
    const o=JSON.parse(decodeURIComponent(escape(atob(m.slice(8)))));
    if(!o || !o._am) throw 0;
    const keys=[RANK_KEY,ACH_KEY,GILT_KEY,GFX_KEY,IDX_KEY]; let found=0;
    for(const k of keys){ if(typeof o[k]==='string'){ JSON.parse(o[k]); found++; } }
    if(!found) throw 0;
    if(!confirm('OVERWRITE this ledger with the pasted soul? ('+found+' of 5 books present)')) return;
    for(const k of keys){ if(typeof o[k]==='string') await store.set(k,o[k],false); }
    announce('◈ THE SOUL TAKES ITS SEAT — RELOADING ◈',true);
    setTimeout(()=>location.reload(),900);
  }catch(e){ announce('✕ THAT SOUL IS COUNTERFEIT ✕',false); SFX.bust&&SFX.bust(); }
}
function setFav(g){ try{ const l=document.querySelector('link[rel="icon"]'); if(l) l.href='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><text y=%2226%22 font-size=%2226%22>'+encodeURIComponent(g)+'</text></svg>'; }catch(e){} }
function quitToMenu(){
  try{ fadeCut(); }catch(e){} setFav('♠');
  try{ stopAmbience(); }catch(e){}
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
$('mute').addEventListener('click',()=>{ muted=!muted; GFX.muted=muted; try{ saveGfx(); }catch(e){} try{ setMasterVol(true); }catch(e){} try{ if(!muted&&state==='playing') startAmbience(); else if(muted) stopAmbience(); }catch(e){} $('mute').textContent=muted?'♩':'♪'; $('mute').style.color=muted?'#5a4a3a':''; }); let tabHold=false;
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
async function loadGfx(){ try{ if(store){ const r=await store.get(GFX_KEY,false); if(r&&r.value) Object.assign(GFX,JSON.parse(r.value)); } }catch(e){}
  if(GFX.muted){ muted=true; const mb=$('mute'); if(mb){ mb.textContent='♩'; mb.style.color='#5a4a3a'; } } // 328: silence is remembered
  GFX.preset=gfxDerivePreset(); applyGfxSide(); }
function saveGfx(){ try{ store.set(GFX_KEY,JSON.stringify(GFX),false); }catch(e){} }
function applyGfxSide(){
  // the volume knob is real: master gain follows it (perceptual x^2 curve, faded)
  try{ setMasterVol(true); }catch(e){}
  try{ if(GFX.amb===false) stopAmbience(); else if(typeof state!=='undefined'&&state==='playing') startAmbience(); }catch(e){}
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
 {k:'tabT', n:'TAB CODEX',      opts:[[false,'HOLD'],[true,'TOGGLE']]},
 {k:'coach',n:'COACH MARKS',    opts:[[true,'ON'],[false,'OFF'],['reset','RESET']]},
 {k:'amb',  n:'AMBIENCE',       opts:[[true,'ON'],[false,'OFF']]}
];
if(GFX.amb===undefined) GFX.amb=true;
if(GFX.coach===undefined) GFX.coach=true;
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
    +'<div class="gxKeys">⌨ WASD walk · SPACE every bet · ENTER cash the ascent · ESC pause · TAB codex · M mute · R (hold) re-ante</div>'
    +'<div class="gxRow"><span class="gxName">YOUR SOUL, PORTABLE</span><span><button class="gxBtn" id="gxExport">EXPORT</button> <button class="gxBtn" id="gxImport">IMPORT</button></span></div>'
    +'<button class="gxBtn gxClose" id="gfxClose">CLOSE</button></div>';
  document.body.appendChild(p);
  p.querySelectorAll('.gxPre').forEach(b=>b.addEventListener('click',()=>{ applyGfxPreset(b.dataset.pre); SFX.casinoDing(); }));
  p.querySelectorAll('.gxBtn[data-k]').forEach(b=>b.addEventListener('click',()=>{
    const d=GFX_DEFS.find(x=>x.k===b.dataset.k);
    const i=d.opts.findIndex(o=>o[0]===GFX[d.k]);
    GFX[d.k]=d.opts[(i+1)%d.opts.length][0];
    if(d.k==='coach'&&GFX.coach==='reset'){ GFX.coach=true; try{ LT.coach={}; achSaveSoon(); announce('✒ THE HOUSE FORGETS — LESSONS RESET ✒',true); }catch(e){} }
    GFX.preset=gfxDerivePreset(); syncPresetRow();
    b.textContent=gfxLabel(d); applyGfxSide(); saveGfx(); SFX.uiDing();
  }));
  $('gfxClose').addEventListener('click',()=>{ p.classList.add('hidden'); SFX.casinoDing(); });
  { const ex=p.querySelector('#gxExport'); if(ex) ex.addEventListener('click',()=>exportSave());
    const im=p.querySelector('#gxImport'); if(im) im.addEventListener('click',()=>importSave()); }
  { const gf=p.querySelector('#gxFull'); if(gf) gf.addEventListener('click',()=>{ try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }catch(x){} SFX.uiDing(); }); }
  { const gr=p.querySelector('#gxReset'); if(gr) gr.addEventListener('click',()=>{
      applyGfxPreset('medium'); GFX.vol=1; GFX.cb=false; GFX.fps=false; applyGfxSide(); saveGfx();
      const gv2=p.querySelector('#gxVol'); if(gv2) gv2.value=1;
      p.querySelectorAll('.gxBtn[data-k]').forEach(b=>{ const d=GFX_DEFS.find(x=>x.k===b.dataset.k); if(d) b.textContent=gfxLabel(d); });
      SFX.casinoDing(); }); }
  { const gv=p.querySelector('#gxVol'); if(gv){
      gv.addEventListener('input',()=>{ GFX.vol=parseFloat(gv.value); applyGfxSide();
        if(!gv._tk||performance.now()-gv._tk>160){ gv._tk=performance.now(); try{ tone(523,0.12,'sine',0.09); tone(659,0.12,'sine',0.07); tone(784,0.14,'sine',0.07); }catch(x){} } });
      gv.addEventListener('change',()=>{ saveGfx(); }); } }
  syncPresetRow();
}
function openGfx(){ buildGfxPanel(); $('gfxPanel').classList.remove('hidden'); SFX.vaultOpen(); }
let annT=null;
// announces never overlap — rapid calls stack into a short queue, each gets its moment
let _annQ=[], _annBusy=false;
function announce(txt, good){
  _annQ.push([txt,good]); if(_annQ.length>4) _annQ.splice(0,_annQ.length-4);
  _annPump();
}
function _annPump(){
  if(_annBusy || !_annQ.length) return;
  const [txt,good]=_annQ.shift(); _annBusy=true;
  const a=$('announce');
  if(a){
    a.textContent=txt; a.className='ann '+(good?'good':'bad');
    a.style.animation='none'; void a.offsetWidth; a.style.animation='';
    a.classList.remove('hidden');
    tone(good?1760:520,0.07,'sine',0.06); tone(98,0.5,'sine',0.032,80); // the room leans in
    clearTimeout(annT); annT=setTimeout(()=>a.classList.add('hidden'), 2700);
  }
  setTimeout(()=>{ _annBusy=false; _annPump(); }, _annQ.length?700:120);
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
  { const tgt=P.coins; if(window._coinDisp===undefined||window._coinDisp>tgt) window._coinDisp=tgt;
    const dd=tgt-window._coinDisp;
    if(dd>60){ window._coinDisp+=Math.max(1,Math.ceil(dd*0.16)); // big gains ROLL like an odometer
      if(!window._coinTk||performance.now()-window._coinTk>70){ window._coinTk=performance.now(); try{ tone(680+Math.random()*240,0.02,'square',0.03); }catch(e){} } }
    else window._coinDisp=tgt;
    _hSet('coinCount',Math.round(window._coinDisp).toLocaleString()); }
  const bb=$('bossBar'); const bs=enemies.find(x=>x.boss);
  if(bs){ bb.classList.remove('hidden'); const bp9=Math.max(0,bs.hp/bs.maxhp*100);
    _hSet('bossName',BOSS_DEFS[bs.bossKind].name+' — '+Math.ceil(bp9)+'%'); _hW('bossFill',bp9.toFixed(1)+'%'); }
  else if(_hud.bossOn!==false) bb.classList.add('hidden');
  _hud.bossOn=!!bs;
  const hpPct=clamp(P.hp/P.maxHp,0,1)*100;
  _hW('hpfill',hpPct.toFixed(1)+'%');
  _hW('xpfill',(P.xp/P.xpNext*100).toFixed(1)+'%');
  _hSet('hptext',Math.ceil(P.hp)+' / '+P.maxHp);
  _hSet('level','LEVEL '+P.level);
  _hSet('killCount',P.kills.toLocaleString());
  const cm=$('combo');
  if(killStreak>=4){ cm.classList.remove('hidden');
    const ch='×'+(P.comboMult||1).toFixed(1)+'  COMBO'+(P.bestStreak>killStreak?' <s>best '+P.bestStreak+'</s>':'');
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
const touch={active:false,wx:0,wy:0,joy:false,jx:0,jy:0};
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
      $('pauseStats').innerHTML='<div class="ps"><b>'+P.kills+'</b><i>KILLS</i></div><div class="ps"><b>'+P.level+'</b><i>LEVEL</i></div><div class="ps"><b>'+P.coins+'</b><i>COINS</i></div><div class="ps"><b>'+wave+'</b><i>WAVE</i></div><div class="ps"><b>'+Math.floor(gt/60)+':'+String(Math.floor(gt%60)).padStart(2,'0')+'</b><i>TIME</i></div>'+'<div style="flex-basis:100%;text-align:center;font-family:var(--disp);font-size:10px;letter-spacing:.08em;color:#9a8f7e;margin-top:8px">◈ COINS — the House&#39;s gold, this run · ⚜ XP — level charge, wagered in the Ascent · GILT — eternal Vault currency</div>'; if(P){ P._pauses=(P._pauses||0)+1; if(P._pauses>=13) secret('coldfeet','COLD FEET'); }
      { let pf=$('pzFoot'); if(!pf){ pf=document.createElement('div'); pf.id='pzFoot'; $('pauseStats').parentNode.appendChild(pf); } pf.textContent='NIGHT №'+(LT.runs||0)+' · v4.0 — FINAL'; } }
    else if(state==='paused'){
      if(performance.now()-(window._pzT||0)<500){ quitToMenu(); return; } // ESC·ESC — straight to the door
      state='playing'; document.body.classList.remove('paused'); $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); }
    return;
  }
  if(k===' ' && state==='paused' && !e.repeat){ e.preventDefault(); state='playing'; document.body.classList.remove('paused'); $('pauseLayer').classList.add('hidden'); SFX.casinoDing(); return; }
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
      try{ flyGlyphs('combo','coinCount','◈',6,'#8bff9a'); }catch(e){}
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
    else if(wheel.phase!=='goldhold') launchWheel(); } return; }
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
// mouse: hold-to-walk toward the cursor. touch: the floating stick (A4 block, end of file)
function ptr(e){ touch.wx=e.clientX/ZOOM+camX; touch.wy=e.clientY/ZOOM+camY; }
cv.addEventListener('pointerdown',e=>{ if(e.pointerType==='touch'||e.pointerType==='pen'){ joyDown(e); return; } if(e.button!==0) return; touch.active=true; ptr(e); });
cv.addEventListener('pointermove',e=>{ if(e.pointerType==='touch'||e.pointerType==='pen'){ joyMove(e); return; } if(touch.active)ptr(e); });
window.addEventListener('pointerup',e=>{ if(e.pointerType==='touch'||e.pointerType==='pen'){ joyUp(e); return; } touch.active=false; });
window.addEventListener('pointercancel',e=>{ joyUp(e); touch.active=false; });
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('touchstart',e=>{ e.preventDefault(); },{passive:false});
cv.addEventListener('touchmove',e=>{ e.preventDefault(); },{passive:false});
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
{ const gm=$('goMenuBtn'); if(gm) gm.addEventListener('click',()=>quitToMenu()); }
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
        ic.classList.add('sealFlip'); setTimeout(()=>renderAnteRoom(),430); return; }
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
    return Math.max(0,Math.min(100,Math.round((ranks*0.30 + wsp*0.15 + idx*0.20 + pages*0.10 + feats*0.15 + (souls+floors)/2*0.10)*100)));
  }catch(e){ return 0; }
}
// ✒ THE FIRST NIGHT — the House explains itself exactly once per lesson (LT.coach, additive)
function coachMark(id, txt){
  try{
    if(GFX.coach===false) return;
    LT.coach=LT.coach||{}; if(LT.coach[id]) return; LT.coach[id]=1;
    if(typeof achSaveSoon==='function') achSaveSoon();
    let c=document.getElementById('coachToast');
    if(!c){ c=document.createElement('div'); c.id='coachToast'; document.body.appendChild(c);
      window.addEventListener('keydown',()=>{ if(c.classList.contains('go')&&performance.now()-(c._born||0)>600) c.classList.remove('go'); }); }
    c.innerHTML='✒ '+txt; c._born=performance.now();
    c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
    try{ SFX.tingle&&SFX.tingle(); }catch(e){}
    clearTimeout(c._t); c._t=setTimeout(()=>c.classList.remove('go'), 4600);
  }catch(e){}
}
function renderChips(){
  const _est=estatePct();
  try{ storyPulse(); }catch(e){}
  try{ menuMotion(); }catch(e){}
  // the loadout line — who, where, and on what terms
  { let ln9=$('lastNight');
    if(!ln9 && (best>0||(LT.runs||0)===0)){ ln9=document.createElement('div'); ln9.id='lastNight';
      const sb=$('startBtn'); if(sb) sb.parentNode.insertBefore(ln9, sb); }
    if(ln9) ln9.textContent = best>0 ? ('BEST NIGHT — '+best.toLocaleString()) : ((LT.runs||0)===0?'✦ YOUR FIRST NIGHT — PRESS SPACE ✦':''); }
  { if(_est>=100){ const tg=document.querySelector('#menu .tag'); if(tg && !tg.dataset.owned){ tg.dataset.owned='1'; tg.textContent='THE HOUSE IS YOURS';
      if(!LT.compleat){ LT.compleat=1; achSaveSoon();
        setTimeout(()=>{ try{ bigWin('THE COMPLEAT PATRON',4); domConfetti(60); announce('♛ 100% — THE HOUSE IS YOURS ♛',true); }catch(e){} },700); } } } }
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
  const chips=[
    best>0?['🏆',best.toLocaleString(),'#ffd36b']:null,
    idxPct()>0?['📖',idxPct()+'%','#c98bff']:null,
    SEC.size>0?['✦',SEC.size+'/'+WHISPER_TOTAL,'#8bffd0']:null,
    _est>0?['🏛',_est+'% OF THE HOUSE — ranks 30 · index 20 · whispers 15 · feats 15 · pages 10 · souls&floors 10','#e8b64c']:null,
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
// 356: CREDITS — the house was built by
function openCredits(){
  let p=$('creditsPanel');
  if(!p){ p=document.createElement('div'); p.id='creditsPanel'; p.className='layer hidden';
    p.innerHTML='<div class="panel" style="max-width:min(480px,92vw)">'
      +'<div class="tag">◈ the house was built by ◈</div>'
      +'<div class="crRow big">THE DIRECTOR — EGE</div>'
      +'<div class="crRow">THE ARCHITECT — CLAUDE · ANTHROPIC</div>'
      +'<div class="crRow dim">RAISED ON — HTML5 CANVAS · WEB AUDIO · VITE</div>'
      +'<div class="crRow dim">SET IN — CINZEL &amp; CORMORANT GARAMOND (OFL, CARRIED IN-HOUSE)</div>'
      +'<div class="crThanks">with thanks to the seventeen — the pit boss · the croupier · the collector · the dealer with no thumbs · the chandelier winder · the fountain keeper · the wheel greaser · the chain smith · the bone polisher · the ledger scratch · the whisper catcher · the velvet brusher · the candle counter · the door that knows you · the voice in the vents · the last patron · and the House, for losing gracefully once</div>'
      +'<div class="crRow dim">FAKE CURRENCY ONLY — the house pays in nothing you can spend</div>'
      +'<button class="btn" id="creditsClose">Back</button></div>';
    document.body.appendChild(p);
    $('creditsClose').addEventListener('click',()=>{ p.classList.add('hidden'); SFX.casinoDing(); }); }
  p.classList.remove('hidden'); SFX.uiDing();
}
{ const vs=$('verStamp'); if(vs) vs.addEventListener('click',()=>openCredits());
  const cl=$('creditLine'); if(cl) cl.addEventListener('click',()=>openCredits()); }
// 360: attract v2 — 90 idle seconds on the menu and the House leans in
{ const _idle9=['the seat is still warm.','the reels dream of you.','the door was never locked.','the house counts nothing but time.','come lose beautifully.'];
  window._lastInput=performance.now();
  ['pointerdown','keydown','wheel','mousemove'].forEach(ev=>window.addEventListener(ev,()=>{ window._lastInput=performance.now(); window._attracted=false; },{passive:true}));
  setInterval(()=>{ if(state!=='menu'||window._attracted) return;
    if(performance.now()-(window._lastInput||0)>90000){ window._attracted=true;
      const h1=document.querySelector('#menu h1'); if(h1){ h1.classList.remove('shimmer'); void h1.offsetWidth; h1.classList.add('shimmer'); }
      try{ houseSpeak(_idle9[(Math.random()*_idle9.length)|0]); }catch(e){} } },5000); }
// C8 — pre-warm the display face: the first raster of each Cinzel size used to hitch mid-run
{ try{ const wc=document.createElement('canvas'); wc.width=wc.height=8; const wg=wc.getContext('2d');
  ["700 11px 'Cinzel',serif","800 15px 'Cinzel',serif","700 13px 'Cinzel',serif","600 17px 'Cinzel',serif","800 26px 'Cinzel',serif"].forEach(f=>{ wg.font=f; wg.fillText('◈',0,7); });
}catch(e){} }
/* boot */
(async function boot(){
  buildAch(); await loadAch(); await loadGilt(); await loadGfx(); await idxLoad();
  { const today=new Date().toDateString();
    if(LT.lastDay!==today){
      LT.dayStreak=(LT.lastDay && (Date.now()-new Date(LT.lastDay).getTime())<172800000)?(LT.dayStreak||0)+1:1;
      LT.dayStreak=Math.max(1,Math.min(+LT.dayStreak||1,3650)); // 323: a moved clock can never mint a broken streak
      LT.lastDay=today; const bonus=25+LT.dayStreak*5;
      gilt+=bonus; saveGilt(); achSaveSoon();
      window._daily='DAILY BLESSING +'+bonus+' ◈ · DAY '+LT.dayStreak;
    } }
  if(!RANK._ld){ RANK._ld=1; await loadRank(); }
  if(window._ledgerRestored) setTimeout(()=>announce('◈ THE LEDGER WAS RESTORED FROM CARBON ◈', true), 900);
  if(!store){ const b9=document.createElement('div'); b9.id='noLedger'; b9.textContent='☒ THE LEDGER CANNOT REMEMBER TONIGHT — SAVES ARE OFF'; const m9=$('menu'); if(m9) m9.appendChild(b9); }
  try{ // 321: the House seats one — a second tab is offered the chair, not a crash
    const K9='am_seat_v1', me9=Math.random().toString(36).slice(2);
    const cur9=localStorage.getItem(K9); const p9=cur9?JSON.parse(cur9):null;
    if(p9 && Date.now()-p9.t<4000){
      const v9=document.createElement('div'); v9.id='seatVeil';
      v9.innerHTML='<div class="svCard"><div class="svT">♠ THE HOUSE SEATS ONE ♠</div><div class="svS">this table is already dealt in another tab</div><button class="btn" id="svTake">TAKE THE SEAT</button></div>';
      document.body.appendChild(v9);
      document.getElementById('svTake').addEventListener('click',()=>{ v9.remove(); window._seatMine=true; SFX.casinoDing&&SFX.casinoDing(); });
    } else window._seatMine=true;
    setInterval(()=>{ try{ if(window._seatMine!==false && document.getElementById('seatVeil')===null) localStorage.setItem(K9,JSON.stringify({id:me9,t:Date.now()})); }catch(e){} },1500);
  }catch(e){}
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

/* ============================================================
   ◈ A2 — THE LANES. Announces, secret cards, House tips and feat toasts
   share one stacked column (#a2Notes) so they can never overlap each other,
   and the column is parked wherever the open table/ledger is NOT: above it,
   beside it, below it — or, on the death ledger, in the margin (wide) or
   pushing the ledger down (narrow). Text scales to fit any width.
   ============================================================ */
const A2L={ el:null, raf:0, lastDead:false };
function a2Notes(){
  if(A2L.el) return A2L.el;
  const n=document.createElement('div'); n.id='a2Notes'; n.className='a2play';
  const w=$('wrap')||document.body; w.appendChild(n);
  const an=$('announce'); if(an) n.appendChild(an);
  let sr=$('secretReveal'); if(!sr){ sr=document.createElement('div'); sr.id='secretReveal'; sr.className='hidden'; }
  n.appendChild(sr);
  A2L.el=n;
  try{ new MutationObserver(()=>a2LaneSoon()).observe(n,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true}); }catch(e){}
  ['slot','gameover','wheelLayer','crashLayer','achToasts'].forEach(id=>{ const e=$(id); if(e) try{ new MutationObserver(()=>a2LaneSoon()).observe(e,{attributes:true,attributeFilter:['class'],childList:id==='achToasts'}); }catch(x){} });
  window.addEventListener('resize',()=>a2LaneSoon());
  return n;
}
function a2LaneSoon(){ if(A2L.raf) return; A2L.raf=requestAnimationFrame(()=>{ A2L.raf=0; try{ a2Lane(); }catch(e){} }); }
function _a2vis(e){ if(!e) return null; if(e.closest('.hidden')) return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; }
function _a2union(rs){ rs=rs.filter(Boolean); if(!rs.length) return null;
  return { left:Math.min(...rs.map(r=>r.left)), right:Math.max(...rs.map(r=>r.right)), top:Math.min(...rs.map(r=>r.top)), bottom:Math.max(...rs.map(r=>r.bottom)) }; }
function a2Lane(){
  const n=a2Notes(), W=innerWidth, H=innerHeight;
  const dead=(typeof state!=='undefined') && state==='dead' && !$('gameover').classList.contains('hidden');
  // what is open, and where does it stand?
  let m=null, parts=[];
  if(!dead){
    if(state==='slot'){ parts=[_a2vis($('machine')), _a2vis($('payTable')), _a2vis($('sacCard'))].filter(Boolean); m=_a2union(parts); }
    else if(state==='wheel') m=_a2vis(document.querySelector('#wheelLayer .wheelShell'));
    else if(state==='crash') m=_a2vis(document.querySelector('#crashLayer .wheelShell'));
  }
  const modal = dead || !!m;
  // tips and feat toasts join the column while a table or the ledger is open
  const co=$('coachToast'), at=$('achToasts');
  // feat toasts keep their bottom-left corner unless that corner would land on the open table
  const zone={left:8, right:Math.min(W,340), top:H-130-Math.max(60,(at&&at.offsetHeight)||0), bottom:H-120};
  const hitZ=r=>r && r.left<zone.right && r.right>zone.left && r.top<zone.bottom && r.bottom>zone.top;
  const dockAt = dead || (!!m && (parts.length?parts:[m]).some(hitZ));
  if(modal){ if(co && co.parentNode!==n) n.appendChild(co); }
  else if(co && co.parentNode===n) document.body.appendChild(co);
  if(dockAt){ if(at && at.parentNode!==n) n.appendChild(at); }
  else if(at && at.parentNode===n) ($('wrap')||document.body).insertBefore(at, n);
  // fit the announce to the width it will get
  const an=$('announce');
  const go=$('gameover');
  n.style.left=n.style.top=n.style.width=n.style.right=''; n.classList.remove('a2play','a2above','a2side','a2below','a2top','a2deadSide','a2deadTop');
  let availW=Math.min(W-24, 980);
  if(dead){
    const p=_a2vis(go&&go.querySelector('.panel'));
    const side = p && (W-p.right) >= 240;
    // A3's share plaque is pinned top-right of the death layer — the column always starts below it
    // if A3's share plaque is still pinned to the layer (not seated in the ledger), start below it
    const shEl=$('a3Share'), sh=(shEl && !shEl.closest('.panel')) ? _a2vis(shEl) : null;
    const top0 = sh ? Math.round(sh.bottom+10) : (side?18:10);
    n.style.top=top0+'px';
    if(side){ n.classList.add('a2deadSide'); n.style.left=Math.round(p.right+18)+'px'; n.style.width=Math.round(Math.min(380, W-p.right-32))+'px'; availW=Math.min(380, W-p.right-32); }
    else { n.classList.add('a2deadTop'); }
    a2FitAnn(an, availW);
    if(go){ const hN = side?0:n.getBoundingClientRect().height; go.style.paddingTop = hN>4 ? Math.round(top0+hN+12)+'px' : ''; }
    A2L.lastDead=true; return;
  }
  if(A2L.lastDead && go){ go.style.paddingTop=''; A2L.lastDead=false; }
  if(!m){ n.classList.add('a2play'); a2FitAnn(an, availW); return; }
  a2FitAnn(an, availW);
  let hN=n.getBoundingClientRect().height;
  if(hN<4){ n.classList.add('a2above'); n.style.top='8px'; return; }
  if(m.top-10 >= hN+6){ n.classList.add('a2above'); n.style.top=Math.round(Math.max(6, m.top-10-hN))+'px'; return; }
  const L=m.left, R=W-m.right;
  if(Math.max(L,R) >= 210){
    const onLeft = L>=R; const w=Math.min(380, (onLeft?L:R)-28);
    n.classList.add('a2side'); n.style.width=Math.round(w)+'px';
    if(onLeft) n.style.left=Math.round(L-18-w)+'px'; else n.style.left=Math.round(m.right+18)+'px';
    a2FitAnn(an, w); hN=n.getBoundingClientRect().height;
    n.style.top=Math.round(Math.max(8, Math.min(m.top+8, H-hN-8)))+'px'; return;
  }
  if(H-m.bottom-10 >= hN+6){ n.classList.add('a2below'); n.style.top=Math.round(m.bottom+10)+'px'; return; }
  n.classList.add('a2top'); n.style.top='6px'; // no clean room anywhere: hug the very top, compact
}
// the banner shrinks to its lane; if even the smallest size cannot hold it on one line, it wraps
function a2FitAnn(an, availW){
  if(!an || an.classList.contains('hidden')) return;
  const len=Math.max(8,(an.textContent||'').length);
  const fs=Math.max(14, Math.min(30, Math.floor((availW-56)/(len*0.86))));
  an.style.fontSize=fs+'px';
  an.classList.toggle('a2wrap', (len*fs*0.86) > (availW-56));
}
{ // a found secret already flips its own card (riddle → name → +25 GILT) — the duplicate banner is dropped
  const _ann=announce;
  announce=function(txt, good){
    a2Notes();
    if(typeof txt==='string' && txt.indexOf('🗝 SECRET — ')===0){
      const nm=txt.slice(11).split(' · ')[0].trim();
      setTimeout(()=>{ const sr=$('secretReveal'); if(sr && !sr.classList.contains('hidden') && sr.classList.contains('go') && nm && (sr.textContent||'').indexOf(nm)>=0) return; _ann(txt, good); }, 0);
      return;
    }
    return _ann(txt, good);
  };
  try{ a2Notes(); }catch(e){}
}

/* ◈ A2 — THE LEDGER'S HEADER: how you died and how long, engraved under the verdict */
function a2DressLedger(){
  try{
    const sub=$('goSub'); if(!sub) return;
    const t=sub.textContent||'', k=t.indexOf(' — taken by ');
    const by = k>=0 ? t.slice(k+12) : '';
    let ep=$('a2Epitaph');
    if(!ep){ ep=document.createElement('div'); ep.id='a2Epitaph'; sub.parentNode.insertBefore(ep, sub.nextSibling); }
    ep.innerHTML='<span class="a2epBy">☠ '+(by?('TAKEN BY <b>'+by+'</b>'):'THE HOUSE COLLECTS')+'</span>'
      +'<span class="a2epT">SURVIVED <b>'+fmt(gt)+'</b></span><span class="a2epL">LEVEL <b>'+(P?P.level:1)+'</b></span>';
    if(k>=0) sub.textContent=t.slice(0,k);
    // A3's share plaque gets a seat in the what's-next rows (same node, same handler — only moved)
    { const sh=$('a3Share'), pn=sub.parentNode, bb=$('booksBtn'); if(sh && pn && sh.parentNode!==pn) pn.insertBefore(sh, bb||null); }
    const sc=$('goScore'); if(sc && !sc.dataset.a2){ sc.dataset.a2=1; const lb=document.createElement('div'); lb.className='a2scoreLbl'; lb.textContent='THE TALLY'; sc.parentNode.insertBefore(lb, sc); }
  }catch(e){}
}
{ const _ad=actuallyDie;
  actuallyDie=async function(){ const was=state; const r=_ad.apply(this, arguments); if(was!=='dead') a2DressLedger(); return r; }; }

/* ◈ A2 — the LEVEL CHARGE gauge's brass frame (canvas HUD). Gradients cached per geometry. */
const _a2GF={};
function a2GaugeFrame(x,y,w,h){
  const k=(x|0)+'|'+(w|0)+'|'+(y|0);
  let g=_a2GF[k];
  if(!g){ for(const kk in _a2GF) delete _a2GF[kk];
    const b=ctx.createLinearGradient(x-6,y-6,x+w*0.35,y+h+6);
    b.addColorStop(0,'#fff2c0'); b.addColorStop(0.18,'#c8922e'); b.addColorStop(0.42,'#6e4a12'); b.addColorStop(0.6,'#e8b64c'); b.addColorStop(0.82,'#8a5f18'); b.addColorStop(1,'#f0cf7a');
    const c=ctx.createLinearGradient(0,y-2,0,y+h+2); c.addColorStop(0,'#030102'); c.addColorStop(1,'#16070b');
    g=_a2GF[k]={b,c}; }
  ctx.fillStyle='rgba(0,0,0,0.55)'; roundRect(x-7,y-5,w+14,h+12,9); ctx.fill();          // drop shadow
  ctx.fillStyle=g.b; roundRect(x-6,y-6,w+12,h+12,8); ctx.fill();                       // cast rim
  ctx.fillStyle='#140a03'; roundRect(x-3,y-3,w+6,h+6,6); ctx.fill();                   // the cut
  ctx.fillStyle=g.c; roundRect(x-2,y-2,w+4,h+4,5); ctx.fill();                         // the channel
  ctx.strokeStyle='rgba(255,240,192,0.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x-1,y-5.5); ctx.lineTo(x+w+1,y-5.5); ctx.stroke(); // top bevel catch-light
  ctx.fillStyle='#fff2c0'; for(const bx of [x-3, x+w+3]){ ctx.beginPath(); ctx.arc(bx, y+h/2, 1.6, 0, 6.283); ctx.fill(); } // rivets
}

/* ============================================================
   A4 — THE POCKET CASINO
   A phone is a casino you carry. Left thumb: a floating gilt stick that
   appears wherever it lands. Right thumb: the BET coin — it IS the space bar
   (real keydown/keyup, so hold-to-roll and hold-to-re-ante just work).
   II pauses, ✦ CODEX opens the book, CASH banks the ascent. On touch, every
   "SPACE" the House prints becomes "◈ BET".
   ============================================================ */
const IS_TOUCH=(()=>{ try{ return matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints>0 && matchMedia('(hover: none)').matches); }catch(e){ return false; } })();
window._touchUI=false;
function tcKey(type,k){
  const code=k===' '?'Space':k==='Escape'?'Escape':k==='Enter'?'Enter':'Key'+k.toUpperCase();
  try{ window.dispatchEvent(new KeyboardEvent(type,{key:k,code,bubbles:true,cancelable:true})); }catch(e){}
}
function tcBuzz(ms){ try{ if(navigator.vibrate && !muted) navigator.vibrate(ms); }catch(e){} }
// soft felt sounds for the thumb controls (synthesized, like everything else)
function tcSfx(kind){ if(!AC||muted) return;
  try{
    if(kind==='stick'){ tone(196,0.05,'sine',0.05,140); }
    else if(kind==='bet'){ tone(523,0.04,'triangle',0.05); tone(1046,0.03,'sine',0.025); }
    else if(kind==='btn'){ tone(880,0.04,'sine',0.04); setTimeout(()=>tone(1318,0.04,'sine',0.03),40); }
  }catch(e){} }

/* ---------- the stick ---------- */
const JOY={id:-1,ox:0,oy:0,R:56,el:null,knob:null};
function joyEls(){
  if(JOY.el) return;
  const b=document.createElement('div'); b.id='tcStick'; b.innerHTML='<div class="tcRing"></div><div class="tcKnob"></div>';
  $('wrap').appendChild(b); JOY.el=b; JOY.knob=b.querySelector('.tcKnob');
}
function joyPlace(){ if(!JOY.el) return; JOY.el.style.transform='translate('+(JOY.ox-JOY.R)+'px,'+(JOY.oy-JOY.R)+'px)'; }
function joyDown(e){
  setTouchUI(true);
  if(state!=='playing' || JOY.id!==-1 || tabHold) return;
  if(e.clientX>window.innerWidth*0.62) return; // the right thumb's half belongs to the BET coin
  joyEls();
  const sa=8; // keep the ring on screen
  JOY.id=e.pointerId;
  JOY.ox=clamp(e.clientX,JOY.R+sa,window.innerWidth-JOY.R-sa); JOY.oy=clamp(e.clientY,JOY.R+sa,window.innerHeight-JOY.R-sa);
  joyPlace(); JOY.knob.style.transform='translate(0px,0px)'; JOY.el.classList.add('on');
  try{ cv.setPointerCapture(e.pointerId); }catch(x){}
  touch.joy=false; tcSfx('stick');
}
function joyMove(e){
  if(e.pointerId!==JOY.id) return;
  let dx=e.clientX-JOY.ox, dy=e.clientY-JOY.oy; const d=Math.hypot(dx,dy)||1;
  if(d>JOY.R){ // the ring follows a thumb that overruns it
    JOY.ox=e.clientX-dx/d*JOY.R; JOY.oy=e.clientY-dy/d*JOY.R; dx=dx/d*JOY.R; dy=dy/d*JOY.R; joyPlace(); }
  JOY.knob.style.transform='translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px)';
  if(d>JOY.R*0.16){ touch.joy=true; touch.jx=dx/Math.min(d,JOY.R); touch.jy=dy/Math.min(d,JOY.R); }
  else touch.joy=false;
}
function joyUp(e){
  if(e && e.pointerId!==undefined && e.pointerId!==JOY.id) return;
  JOY.id=-1; touch.joy=false; touch.jx=touch.jy=0;
  if(JOY.el) JOY.el.classList.remove('on');
}
window.addEventListener('blur',()=>joyUp());

/* ---------- the thumb buttons ---------- */
const TC={bet:null,cash:null,pause:null,codex:null,betDown:false,deadT:0,last:'',tab:false};
function tcButton(id,html,title){ const b=document.createElement('button'); b.id=id; b.className='tcBtn'; b.type='button'; b.innerHTML=html; b.title=title;
  b.addEventListener('contextmenu',e=>e.preventDefault()); $('wrap').appendChild(b); return b; }
function tcBuild(){
  if(TC.bet) return;
  TC.bet=tcButton('tcBet','<span class="tcG">◈</span><span class="tcL">BET</span>','BET — the space bar');
  TC.cash=tcButton('tcCash','<span class="tcG">▲</span><span class="tcL">CASH</span>','CASH OUT the ascent');
  TC.pause=tcButton('tcPause','<span class="tcG">II</span>','Pause');
  TC.codex=tcButton('tcCodex','<span class="tcG">✦</span><span class="tcL">CODEX</span>','Your codex');
  // BET: pointerdown = keydown SPACE, pointerup = keyup SPACE. On the ledger it is R: hold to re-ante, tap to read on.
  TC.bet.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); setTouchUI(true);
    try{ TC.bet.setPointerCapture(e.pointerId); }catch(x){}
    if(TC.betDown) return; TC.betDown=true; TC.bet.classList.add('on'); tcBuzz(8); tcSfx('bet');
    if(state==='dead'){ TC.deadT=performance.now(); TC.bet.classList.add('holding'); tcKey('keydown','r'); }
    else { TC.deadT=0; tcKey('keydown',' '); } });
  const betUp=e=>{ if(!TC.betDown) return; TC.betDown=false; TC.bet.classList.remove('on','holding');
    if(TC.deadT){ const held=performance.now()-TC.deadT; TC.deadT=0; tcKey('keyup','r');
      if(held<400 && state==='dead'){ tcKey('keydown',' '); tcKey('keyup',' '); } }
    else tcKey('keyup',' '); };
  TC.bet.addEventListener('pointerup',betUp); TC.bet.addEventListener('pointercancel',betUp); TC.bet.addEventListener('lostpointercapture',betUp);
  TC.cash.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); tcBuzz(14); tcKey('keydown','Enter'); tcKey('keyup','Enter'); });
  TC.pause.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); tcSfx('btn'); tcKey('keydown','Escape'); tcKey('keyup','Escape'); });
  TC.codex.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); tcCodex(); });
  // the pause card gains a codex thumb (RESUME / HOW TO PLAY / QUIT pills already exist below it)
  const pc=document.querySelector('.pauseCard');
  if(pc && !$('tcPzRow')){ const r=document.createElement('div'); r.id='tcPzRow';
    r.innerHTML='<button class="btn msm" id="tcPzCodex" type="button">✦ YOUR CODEX</button><div class="tcPzHint">TAP THE CARD TO RESUME</div>';
    pc.appendChild(r);
    $('tcPzCodex').addEventListener('click',e=>{ e.stopPropagation(); tcCodex(); }); }
}
function tcCodex(){
  const tp=$('tabPanel');
  if(TC.tab && tp && tp.classList.contains('show')){ TC.tab=false; tabHold=false; hideTab(); SFX.casinoDing&&SFX.casinoDing(); return; }
  if(!(state==='playing'||state==='slot'||state==='wheel'||state==='paused')) return;
  joyUp(); TC.tab=true; tabHold=true; showTab(); SFX.uiDing&&SFX.uiDing(); tcBuzz(6);
}
// with the codex open by touch, a tap outside its columns closes it
document.addEventListener('pointerdown',e=>{
  if(!TC.tab || e.pointerType==='mouse') return;
  const t=e.target; if(t.closest && (t.closest('.tpCol')||t.closest('#tcCodex')||t.closest('#tcPzCodex'))) return;
  TC.tab=false; tabHold=false; hideTab(); e.stopPropagation(); e.preventDefault();
},true);
// the death roll is a mash: on touch, any tap on the layer is a press too
document.addEventListener('pointerdown',e=>{
  if(!window._touchUI || e.pointerType==='mouse' || state!=='marker') return;
  if(e.target.closest && e.target.closest('button')) return;
  tcKey('keydown',' '); tcKey('keyup',' ');
},false);

// which thumbs show, and what the coin says — cheap, class flips only on change
function tcSync(){
  if(!window._touchUI || !TC.bet) return;
  if(state!=='playing' && JOY.id!==-1) joyUp();
  if(TC.tab){ const tp=$('tabPanel'); if(!tp || !tp.classList.contains('show')) TC.tab=false; }
  const crashLive = state==='crash' && typeof crash!=='undefined' && crash && crash.live && !crash.jk;
  const betOn = ['playing','slot','wheel','crash','marker','dead'].includes(state) && !(state==='crash' && crash && crash.jk);
  let lbl='BET';
  if(state==='dead') lbl=(window._recapDone?'AGAIN':'READ');
  else if(state==='marker') lbl='PRESS';
  else if(state==='crash') lbl=crash&&crash.live?'PUSH':'LAUNCH';
  else if(state==='slot' && typeof slotStage!=='undefined' && slotStage==='offer') lbl='HOLD';
  const key=state+'|'+betOn+'|'+crashLive+'|'+lbl;
  if(key===TC.last) return; TC.last=key;
  TC.bet.classList.toggle('show',betOn);
  TC.bet.classList.toggle('dead',state==='dead');
  TC.bet.querySelector('.tcL').textContent=lbl;
  TC.cash.classList.toggle('show',crashLive);
  TC.pause.classList.toggle('show',state==='playing');
  TC.codex.classList.toggle('show',state==='playing'||state==='slot'||state==='wheel');
}
setInterval(tcSync,90);

/* ---------- fit the cabinets to the glass ----------
   A short landscape phone can't hold the slot machine, the wheel or the ascent
   at full size. Measure the natural box and shrink it (CSS `scale`, which
   composes with any transform animation the machine wears) until it fits. */
const TC_FIT=['#machine','#wheelLayer .wheelShell','#crashLayer .wheelShell','#pauseLayer .pauseCard'];
function tcFit(){
  const vw=window.innerWidth, vh=window.innerHeight;
  for(const sel of TC_FIT){ const el=document.querySelector(sel); if(!el) continue;
    if(!el.offsetParent && el.offsetWidth===0){ continue; } // hidden layer — leave as is
    const w=el.offsetWidth, h=el.offsetHeight; if(!w||!h) continue;
    // on a short touch screen the pause card shares the glass with the pill row + HUD
    const ah = (sel==='#pauseLayer .pauseCard' && window._touchUI && vh<560) ? vh-176 : vh-12;
    const s=Math.min(1,(vw-12)/w,ah/h);
    const v=s<0.995?s.toFixed(3):'';
    if(el.style.scale!==v) el.style.scale=v; }
}
window.addEventListener('resize',()=>setTimeout(tcFit,60));
setInterval(()=>{ if(state==='slot'||state==='wheel'||state==='crash'||state==='paused') tcFit(); },250);

/* ---------- the House speaks touch ---------- */
const TC_PHRASES=[
  [/⌨ WASD walk.*$/, '☝ LEFT THUMB walks · ◈ BET is every bet · CASH banks the ascent · II pause · ✦ CODEX · hold ◈ AGAIN to re-ante'],
  [/— PRESS SPACE ✦/, '— TAP PLAY ✦'],
  [/\b(press|PRESS) SPACE\b/g, 'TAP'],
  [/\bHOLD SPACE\b/g, 'HOLD ◈ BET'],
  [/\bMASH SPACE\b/g, 'MASH ◈ BET'],
  [/\bWASD walks\b/g, 'Your left thumb walks'],
  [/\bWASD\b/g, 'LEFT THUMB'],
  [/\bSPACE\b/g, '◈ BET'],
  [/\bENTER cashes\b/g, 'CASH cashes'],
];
function tcRelabelText(n){
  const v=n.nodeValue; if(!v || !/SPACE|WASD|ENTER/.test(v)) return;
  const par=n.parentNode; if(!par || par.nodeName==='SCRIPT' || par.nodeName==='STYLE' || par.nodeName==='TEXTAREA') return;
  let o=v;
  if(par.classList && par.classList.contains('keyhint')){ o=o.replace(/^\s*SPACE\s*$/,'◈ BET').replace(/^\s*ENTER\s*$/,'▲'); }
  for(const [re,to] of TC_PHRASES) o=o.replace(re,to);
  if(o!==v) n.nodeValue=o;
}
function tcRelabel(root){
  if(!root) return;
  if(root.nodeType===3){ tcRelabelText(root); return; }
  if(root.nodeType!==1) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) tcRelabelText(n);
}
let _tcMO=null;
function setTouchUI(on){
  if(!on || window._touchUI) return;
  window._touchUI=true; document.body.classList.add('touchUI');
  tcBuild(); tcRelabel(document.body); TC.last=''; tcSync();
  try{ _tcMO=new MutationObserver(ms=>{ for(const m of ms){
      if(m.type==='characterData') tcRelabelText(m.target);
      else for(const a of m.addedNodes) tcRelabel(a); } });
    _tcMO.observe(document.body,{subtree:true,childList:true,characterData:true}); }catch(e){}
  // phones start on the lighter felt — auto-quality may still climb back if the device flies
  try{ if(GFX.q==='auto' && state!=='playing'){ qLow=true; window._qFlipT=performance.now(); } }catch(e){}
}
// a touch device announces itself at boot; a touchscreen laptop on its first touch
if(IS_TOUCH) setTouchUI(true);
window.addEventListener('touchstart',()=>setTouchUI(true),{passive:true,capture:true});

// the how-to book and the ledger pages turn with a swipe, like paper
{ let sx=0, sy=0, sid=-1;
  document.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse') return; sid=e.pointerId; sx=e.clientX; sy=e.clientY; },true);
  document.addEventListener('pointerup',e=>{ if(e.pointerId!==sid) return; sid=-1;
    const dx=e.clientX-sx, dy=e.clientY-sy; if(Math.abs(dx)<56 || Math.abs(dx)<Math.abs(dy)*1.4) return;
    const hp=$('howPanel'), pr=document.getElementById('pageReveal');
    const open=(hp&&!hp.classList.contains('hidden')) || (pr&&!pr.classList.contains('hidden'));
    if(open) tcKey('keydown', dx<0?'ArrowRight':'ArrowLeft'); },true); }

/* ---------- no zoom, no long-press menus, no stray selection ---------- */
document.addEventListener('gesturestart',e=>e.preventDefault()); // iOS pinch
document.addEventListener('dblclick',e=>{ if(window._touchUI) e.preventDefault(); });
document.addEventListener('contextmenu',e=>{ if(window._touchUI && !(e.target.closest && e.target.closest('input,textarea'))) e.preventDefault(); });
document.addEventListener('selectstart',e=>{ if(window._touchUI && !(e.target.closest && e.target.closest('input,textarea'))) e.preventDefault(); });
// audio: iOS wants the context woken INSIDE a finished gesture, and a silent
// buffer played through it, before it will ever sing
{ const wake=()=>{ try{ initAudio(); if(AC){ if(AC.state==='suspended') AC.resume().catch(()=>{});
      const b=AC.createBuffer(1,1,22050), s=AC.createBufferSource(); s.buffer=b; s.connect(AC.destination); s.start(0); }
    if(AC && AC.state==='running'){ ['touchend','click','pointerup'].forEach(ev=>window.removeEventListener(ev,wake,true)); } }catch(e){} };
  ['touchend','click','pointerup'].forEach(ev=>window.addEventListener(ev,wake,true)); }

/* ---------- install as an app (hosted build only — never from file://) ---------- */
if(/^https?:$/.test(location.protocol) && !document.querySelector('link[rel="manifest"]')){
  const l=document.createElement('link'); l.rel='manifest'; l.href='./manifest.webmanifest'; document.head.appendChild(l); }
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('./sw.js').catch(()=>{}); });
}

/* ============================================================
   B3 — HANDS AND DIALS
   A pad in hand: the left stick walks, Ⓐ is every bet, START pauses,
   Ⓨ opens the codex. In every menu the D-pad walks a gilt focus ring
   and Ⓐ/Ⓑ choose and go back. THE DIALS: master/SFX/music, shake, flash,
   reduce-flashing, rumble, key rebinding. Persisted under am_dials_v1
   (new, additive — no existing key is touched).
   ============================================================ */
const DIALS_KEY='am_dials_v1';
const DIALS={ sfx:1, music:0.8, rumble:true, calm:false, seek:false, binds:{} };
if(GFX.cb===undefined) GFX.cb=false;   // fresh saves printed UNDEFINED on these two rows
if(GFX.tabT===undefined) GFX.tabT=false;
const BIND_ACTS=[
 {id:'up',    n:'MOVE UP',    canon:'w'},
 {id:'down',  n:'MOVE DOWN',  canon:'s'},
 {id:'left',  n:'MOVE LEFT',  canon:'a'},
 {id:'right', n:'MOVE RIGHT', canon:'d'},
 {id:'bet',   n:'BET',        canon:' '},
 {id:'pause', n:'PAUSE',      canon:'escape'},
 {id:'codex', n:'CODEX',      canon:'tab'}
];
const BIND_RESERVED={ escape:'ESC — IT CANCELS', f:'F — FULLSCREEN', m:'M — MUTE', enter:'ENTER — CASH', r:'R — RE-ANTE', q:'Q — QUIT', '1':'1 — JACKPOT', '2':'2 — JACKPOT', '3':'3 — JACKPOT' };
function bindKey(a){ return (DIALS.binds&&DIALS.binds[a.id])||a.canon; }
function keyName(k){ const N={' ':'SPACE',escape:'ESC',tab:'TAB',arrowup:'↑',arrowdown:'↓',arrowleft:'←',arrowright:'→',shift:'SHIFT',control:'CTRL',alt:'ALT',backspace:'BKSP',capslock:'CAPS'};
  return N[k]||String(k).toUpperCase(); }
let _dialsSaveT=0;
function saveDials(){ clearTimeout(_dialsSaveT); _dialsSaveT=setTimeout(()=>{ try{ if(store) store.set(DIALS_KEY,JSON.stringify(DIALS),false); }catch(e){} },250); }
function applyDials(){
  try{ b3SetBusVols(); }catch(e){}
  document.body.classList.toggle('b3calm', !!DIALS.calm);
}
(async()=>{ try{ if(store){ const r=await store.get(DIALS_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value);
      if(o&&typeof o==='object'){ Object.assign(DIALS,o); if(!DIALS.binds||typeof DIALS.binds!=='object') DIALS.binds={}; } } } }catch(e){}
  applyDials(); try{ musicInit(); }catch(e){} })();
// reduce-flashing: every screen flash is capped soft (the CSS side kills strobes and canvas washes)
{ const _fl=flash; flash=function(a,col){ if(DIALS.calm) a=Math.min(0.12,(a||0)*0.3); return _fl(a,col); }; }

/* ---------- B3 sounds (synthesized) ---------- */
SFX.padNav=function(){ const n=performance.now(); if(n-(SFX._pnT||0)<45) return; SFX._pnT=n; tone(1560,0.03,'triangle',0.06); tone(3120,0.02,'sine',0.02); };
SFX.padBack=function(){ tone(740,0.06,'sine',0.07,520); noise(0.03,0.03,2400); };
SFX.padJoin=function(){ [784,1175,1568].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'sine',0.12),i*70)); setTimeout(()=>SFX.chipStack&&SFX.chipStack(),180); };
SFX.padLeave=function(){ [988,659,440].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'sine',0.1),i*80)); };
SFX.bindSet=function(){ tone(1046,0.05,'square',0.08); setTimeout(()=>tone(1568,0.12,'sine',0.12),50); noise(0.04,0.05,4000); };

/* ---------- input mode: the House labels prompts for the hand you used last ---------- */
const PAD={on:false,mx:0,my:0,mode:'kb',fam:'xbox',prev:[],aDown:false,rep:{},focus:null,scope:null,mem:{},rumbleUntil:0,rumbleLvl:0,id:''};
const PADG_X={a:'Ⓐ',b:'Ⓑ',x:'Ⓧ',y:'Ⓨ',start:'START',sel:'VIEW',lb:'LB',rb:'RB'};
const PADG_P={a:'✕',b:'○',x:'□',y:'△',start:'OPTIONS',sel:'SHARE',lb:'L1',rb:'R1'};
function padG(){ return PAD.fam==='ps'?PADG_P:PADG_X; }
window._padUI=false; window._padA='Ⓐ';
const B3R={nodes:new Set(),mo:null};
function b3Phrases(){ const G=padG(); return [
  [/(⌨ WASD walk|☝ LEFT THUMB walks).*$/, '🎮 L-STICK walks · '+G.a+' every bet · '+G.x+' cash the ascent · '+G.start+' pause · '+G.y+' codex · '+G.b+' back'],
  [/\b(press|PRESS|HOLD|hold|Hold|MASH|mash|Mash) SPACE\b/g, '$1 '+G.a],
  [/\b(HOLD|MASH) ◈ BET\b/g, '$1 '+G.a],
  [/\bWASD( or arrows)?/g, 'L-STICK'],
  [/\bLEFT THUMB\b/g, 'L-STICK'],
  [/\bSPACE\b/g, G.a],
  [/◈ BET\b/g, G.a],
  [/\bENTER (cash|cashes|=|—)/g, G.x+' $1'],
  [/\bESC\b/g, G.start],
  [/\bTAB\b/g, G.y]
]; }
function b3RelabelText(n){
  const v=n.nodeValue; if(!v || n.__b3w===v) return;
  if(!/SPACE|WASD|ENTER|ESC|TAB|◈ BET|LEFT THUMB/.test(v)) return;
  const par=n.parentNode; if(!par || par.nodeName==='SCRIPT' || par.nodeName==='STYLE' || par.nodeName==='TEXTAREA') return;
  if(par.closest && par.closest('#b3Dials .b3Bind')) return; // the rebinding keycaps always show the real key
  let o=v; const G=padG();
  if(par.classList && par.classList.contains('keyhint')){ o=o.replace(/^\s*(SPACE|◈ BET)\s*$/,G.a).replace(/^\s*(ENTER|▲)\s*$/,G.x); }
  for(const [re,to] of b3Phrases()) o=o.replace(re,to);
  if(o!==v){ n.__b3o=v; n.__b3w=o; n.nodeValue=o; B3R.nodes.add(n); }
}
function b3Relabel(root){
  if(!root) return;
  if(root.nodeType===3){ b3RelabelText(root); return; }
  if(root.nodeType!==1) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) b3RelabelText(n);
}
function b3Restore(){
  for(const n of B3R.nodes){ try{ if(n.isConnected && n.nodeValue===n.__b3w) n.nodeValue=n.__b3o; }catch(e){} n.__b3w=null; }
  B3R.nodes.clear();
}
function b3SetInput(mode){
  if(mode===PAD.mode) return;
  PAD.mode=mode; const pad=mode==='pad';
  window._padUI=pad; document.body.classList.toggle('padUI',pad);
  if(pad){ window._padA=padG().a; b3Relabel(document.body);
    try{ if(!B3R.mo){ B3R.mo=new MutationObserver(ms=>{ for(const m of ms){
          if(m.type==='characterData') b3RelabelText(m.target); else for(const a of m.addedNodes) b3Relabel(a); } }); }
      B3R.mo.observe(document.body,{subtree:true,childList:true,characterData:true}); }catch(e){}
    PAD.scope=null; b3PollScope(true); }
  else { try{ if(B3R.mo) B3R.mo.disconnect(); }catch(e){} b3Restore(); b3SetFocus(null); }
  b3PadBar();
  try{ if($('b3Dials') && !$('b3Dials').classList.contains('hidden')) b3RenderPadLine(); }catch(e){}
}
window.addEventListener('pointerdown',e=>{ if(!e.isTrusted) return; b3SetInput(e.pointerType==='touch'||e.pointerType==='pen'?'touch':'kb'); },true);

/* ---------- key rebinding: a bound key is translated into the key the House listens for ---------- */
let _b3Synth=false; const _b3Held={};
function b3Fire(type,canon,repeat){
  const key=canon===' '?' ':canon==='escape'?'Escape':canon==='tab'?'Tab':canon.length===1?canon:canon.charAt(0).toUpperCase()+canon.slice(1);
  const code=canon===' '?'Space':canon==='escape'?'Escape':canon==='tab'?'Tab':canon.length===1?'Key'+canon.toUpperCase():key;
  _b3Synth=true; try{ window.dispatchEvent(new KeyboardEvent(type,{key,code,repeat:!!repeat,bubbles:true,cancelable:true})); }catch(e){} _b3Synth=false;
}
function b3Key(e){ let k=(e.key||'').toLowerCase(); if(k==='spacebar') k=' '; return k; }
function b3BindMap(){ const m={}; for(const a of BIND_ACTS){ const k=bindKey(a); if(k!==a.canon) m[k]=a; } return m; }
const B3C={act:null};
window.addEventListener('keydown',e=>{
  if(_b3Synth || !e.isTrusted) return;
  b3SetInput('kb');
  const k=b3Key(e);
  if(B3C.act){ e.preventDefault(); e.stopImmediatePropagation(); if(e.repeat) return;
    if(k==='escape'){ b3EndCapture('— KEPT —'); return; }
    b3Assign(B3C.act,k); return; }
  const dl=$('b3Dials');
  if(dl && !dl.classList.contains('hidden')){
    if(k==='escape'){ e.preventDefault(); e.stopImmediatePropagation(); if(!e.repeat) closeDials(); return; }
    if(k===' '){ e.stopImmediatePropagation(); return; } // space never starts a night or resumes from under the dials
  }
  { const gp=$('gfxPanel'); if(k==='escape' && PAD.fromDials && gp && !gp.classList.contains('hidden')){ e.preventDefault(); e.stopImmediatePropagation(); gp.classList.add('hidden'); PAD.fromDials=false; openDials(); return; } }
  if(document.activeElement && document.activeElement.tagName==='INPUT' && document.activeElement.type!=='range') return;
  const a=b3BindMap()[k];
  if(a){ e.preventDefault(); e.stopImmediatePropagation(); _b3Held[k]=a.canon; b3Fire('keydown',a.canon,e.repeat); }
},true);
window.addEventListener('keyup',e=>{
  if(_b3Synth || !e.isTrusted) return;
  const k=b3Key(e);
  if(_b3Held[k]!==undefined){ e.preventDefault(); e.stopImmediatePropagation(); const c=_b3Held[k]; delete _b3Held[k]; b3Fire('keyup',c,false); }
},true);
window.addEventListener('blur',()=>{ for(const k in _b3Held){ const c=_b3Held[k]; delete _b3Held[k]; b3Fire('keyup',c,false); } });
function b3BeginCapture(act){ B3C.act=act; renderBinds(); const m=$('b3BindMsg'); if(m) m.textContent='PRESS A KEY FOR '+act.n+' · ESC KEEPS THE OLD ONE'; SFX.tick(); }
function b3EndCapture(msg){ B3C.act=null; renderBinds(); const m=$('b3BindMsg'); if(m) m.textContent=msg||''; }
function b3Assign(act,k){
  if(BIND_RESERVED[k] && !(k===act.canon)){ SFX.thud(); b3EndCapture('THE HOUSE KEEPS '+BIND_RESERVED[k]); return; }
  const old=bindKey(act); let msg='✦ '+act.n+' — '+keyName(k)+' ✦';
  const other=BIND_ACTS.find(o=>o!==act && bindKey(o)===k);
  if(other){ DIALS.binds[other.id]=old; msg='⇄ SWAPPED — '+act.n+' ON '+keyName(k)+' · '+other.n+' ON '+keyName(old); }
  DIALS.binds[act.id]=k;
  for(const a of BIND_ACTS) if(DIALS.binds[a.id]===a.canon) delete DIALS.binds[a.id];
  saveDials(); SFX.bindSet(); b3EndCapture(msg);
}
function renderBinds(){
  const box=$('b3Binds'); if(!box) return;
  box.innerHTML=BIND_ACTS.map(a=>{ const cap=B3C.act===a; const k=bindKey(a);
    return '<button class="b3Bind'+(cap?' cap':'')+(k!==a.canon?' moved':'')+'" data-act="'+a.id+'"><span class="b3BN">'+a.n+'</span><span class="b3Cap" data-cap="'+(cap?'…':keyName(k)).replace(/"/g,'&quot;')+'"></span></button>'; }).join(''); // keycap text lives in CSS — no prompt relabeler can touch it
}

/* ---------- the pad ---------- */
function b3Pad(){ try{ const gs=navigator.getGamepads?navigator.getGamepads():null; if(!gs) return null;
    for(let i=0;i<gs.length;i++){ const g=gs[i]; if(g && g.connected!==false && g.buttons && g.buttons.length) return g; } }catch(e){} return null; }
function b3Fam(id){ id=id||''; return (/054c|playstation|dualsense|dualshock/i.test(id) || (/wireless controller/i.test(id) && !/xbox|045e|xinput/i.test(id)))?'ps':'xbox'; }
function b3Rumble(ms,strong,weak){
  if(!DIALS.rumble || PAD.mode!=='pad') return;
  const gp=b3Pad(); const va=gp&&gp.vibrationActuator; if(!va || typeof va.playEffect!=='function') return;
  const now=performance.now(); if(now<PAD.rumbleUntil && strong<=PAD.rumbleLvl) return;
  PAD.rumbleUntil=now+ms; PAD.rumbleLvl=strong;
  try{ const p=va.playEffect(va.type||'dual-rumble',{startDelay:0,duration:ms,strongMagnitude:Math.min(1,strong),weakMagnitude:Math.min(1,weak)}); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
}
{ const R=[['hurt',[110,0.4,0.8]],['death',[700,1,0.6]],['jackpot',[560,0.9,1]],['reelLock',[280,0.55,0.8]],['levelUp',[200,0.25,0.55]],
    ['bossRoar',[460,0.85,0.3]],['cashout',[300,0.35,0.8]],['vaultBuy',[220,0.6,0.4]],['nearMiss',[160,0.2,0.5]]];
  for(const [k,v] of R){ const f=SFX[k]; if(typeof f!=='function') continue; SFX[k]=function(){ try{ b3Rumble(v[0],v[1],v[2]); }catch(e){} return f.apply(SFX,arguments); }; }
  const bw=SFX.bigWin; if(typeof bw==='function') SFX.bigWin=function(t){ try{ const tt=Math.max(0,Math.min(5,t||0)); b3Rumble(240+tt*110,0.3+tt*0.14,0.7); }catch(e){} return bw.apply(SFX,arguments); }; }
window.addEventListener('gamepadconnected',e=>{ try{ PAD.fam=b3Fam(e.gamepad&&e.gamepad.id); PAD.id=(e.gamepad&&e.gamepad.id)||'';
  announce('◈ '+(PAD.fam==='ps'?'A PLAYSTATION PAD':'A PAD')+' SITS DOWN AT THE TABLE ◈',true); SFX.padJoin(); b3SetInput('pad'); }catch(x){} });
window.addEventListener('gamepaddisconnected',()=>{ try{ if(b3Pad()) return; announce('◈ THE PAD LEAVES THE TABLE ◈',false); SFX.padLeave();
  PAD.mx=PAD.my=0; if(PAD.aDown){ PAD.aDown=false; tcKey('keyup',' '); }
  if(state==='playing') tcKey('keydown','Escape'); // the House holds your seat
  b3SetInput('kb'); }catch(x){} });

/* ---------- focus: a gilt ring walks every menu ---------- */
const B3_SCOPES=['#seatVeil','#b3Dials','#pageReveal','#gfxPanel','#howPanel','#booksPanel','#antePanel','#vaultPanel','#indexPanel','#achPanel','#storyPanel'];
const B3_NOT=new Set(['tabPanel','hud','menu','slot','wheelLayer','crashLayer','gameover','pauseLayer','jackpotLayer','relicTip','b3PadBar']);
const B3_CLICKY='.soulCard,.floorCard,.ctChip,.indChip,.ctSlotBuy,.jkCard,.prArrow,.howTab,.lpg,#loadoutLine,#menuRank';
function b3Vis(el){ if(!el || !el.isConnected) return false; if(el.classList.contains('hidden')) return false;
  if(!el.getClientRects().length) return false; const cs=getComputedStyle(el); return cs.visibility!=='hidden' && cs.display!=='none' && parseFloat(cs.opacity)>0.05; }
function b3Focusables(scope){
  const out=[]; if(!scope) return out;
  const all=scope.querySelectorAll('*');
  for(const el of all){
    let ok=false; const t=el.tagName;
    if(t==='BUTTON' || t==='SELECT' || (t==='A'&&el.hasAttribute('href'))) ok=true;
    else if(t==='INPUT') ok=el.type!=='hidden';
    else if(el.matches(B3_CLICKY)) ok=true;
    if(!ok) continue;
    if(el.matches('.pauseCard')) continue;
    const r=el.getBoundingClientRect(); if(r.width<3||r.height<3) continue;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.pointerEvents==='none'||parseFloat(cs.opacity)<0.05) continue;
    out.push(el);
  }
  // a clickable that wraps another clickable is a frame, not a choice
  return out.filter((el,i)=>!(out[i+1] && el.contains(out[i+1])));
}
function b3FindScope(){
  const cands=B3_SCOPES.map(s=>document.querySelector(s)).filter(Boolean);
  document.querySelectorAll('.layer,[id$="Panel"]').forEach(el=>{ if(!B3_NOT.has(el.id) && !cands.includes(el)) cands.push(el); });
  if(typeof state!=='undefined'){
    if(state==='crash' && typeof crash!=='undefined' && crash && crash.jk) cands.push($('crashLayer'));
    if(state==='paused') cands.push($('pauseLayer'));
    if(state==='dead') cands.push($('gameover'));
    if(state==='menu') cands.push($('menu'));
  }
  for(const el of cands){ if(!el || !b3Vis(el)) continue; const L=b3Focusables(el); if(L.length) return {el,L}; }
  return null;
}
function b3SKey(el){ if(!el) return ''; return el.id || ((el.className||'').toString().split(' ')[0]+'|'+(el.dataset.id||el.dataset.k||el.dataset.act||el.dataset.t||el.dataset.pre||el.dataset.i||(el.textContent||'').trim().slice(0,28))); }
const B3_DEFAULT={menu:'#startBtn',gameover:'#againBtn',pauseLayer:'#resumeBtn',antePanel:'.soulCard.on',b3Dials:'.b3Rng'};
function b3SetFocus(el){
  if(PAD.focus && PAD.focus!==el){ try{ PAD.focus.classList.remove('b3Focus'); }catch(e){} }
  PAD.focus=el||null;
  if(el){ el.classList.add('b3Focus'); PAD.fkey=b3SKey(el); if(PAD.scope && PAD.moved) PAD.mem[PAD.scope.id||'?']=PAD.fkey; b3ScrollTo(el); }
  b3PadBar();
}
function b3ScrollTo(el){
  let p=el.parentElement;
  while(p && p!==document.body){
    const cs=getComputedStyle(p);
    if(/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight>p.clientHeight+2){
      const r=el.getBoundingClientRect(), pr=p.getBoundingClientRect();
      if(r.top<pr.top+8) p.scrollTop-= (pr.top+8-r.top); else if(r.bottom>pr.bottom-8) p.scrollTop+=(r.bottom-(pr.bottom-8)); }
    if(/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth>p.clientWidth+2){
      const r=el.getBoundingClientRect(), pr=p.getBoundingClientRect();
      if(r.left<pr.left+8) p.scrollLeft-=(pr.left+8-r.left); else if(r.right>pr.right-8) p.scrollLeft+=(r.right-(pr.right-8)); }
    p=p.parentElement;
  }
}
function b3PollScope(force){
  if(PAD.mode!=='pad'){ if(PAD.focus) b3SetFocus(null); return null; }
  const s=b3FindScope();
  const el=s?s.el:null;
  // the scope's natural first choice (PLAY, ANTE UP…) may still be fading in — until the hand moves, it takes the ring when it arrives
  if(s && el===PAD.scope && !PAD.moved && !force){ const d=B3_DEFAULT[el.id]; if(d){ const q=el.querySelector(d); if(q && q!==PAD.focus && s.L.includes(q) && !PAD.mem[el.id]) b3SetFocus(q); } }
  if(el!==PAD.scope || force || (PAD.focus && !PAD.focus.isConnected) || (PAD.focus && s && !s.L.includes(PAD.focus))){
    if(el!==PAD.scope){ PAD.moved=false; if(el && (el.id==='gameover'||el.id==='pauseLayer')) delete PAD.mem[el.id]; } // a new pause / ledger always starts on its first choice
    PAD.scope=el;
    if(!s){ b3SetFocus(null); b3PadBar(); return null; }
    let pick=null;
    const want=PAD.focus&&!PAD.focus.isConnected?PAD.fkey:(PAD.mem[el.id||'?']||'');
    if(PAD.focus && s.L.includes(PAD.focus) && !force) pick=PAD.focus;
    if(!pick && want) pick=s.L.find(x=>b3SKey(x)===want)||null;
    if(!pick){ const d=B3_DEFAULT[el.id]; if(d){ const q=el.querySelector(d); if(q && s.L.includes(q)) pick=q; } }
    b3SetFocus(pick||s.L[0]); b3PadBar();
  }
  return s;
}
setInterval(()=>{ if(PAD.mode==='pad') b3PollScope(false); },200);
function b3Nav(dir){
  const s=b3PollScope(false); if(!s) return;
  const L=s.L, cur=PAD.focus;
  if(!cur || !L.includes(cur)){ PAD.moved=true; b3SetFocus(L[0]); SFX.padNav(); return; }
  if(cur.tagName==='INPUT' && cur.type==='range' && (dir==='left'||dir==='right')){ b3Nudge(cur, dir==='right'?1:-1); return; }
  const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];
  const r=cur.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let best=null, bs=1e9, wrap=null, ws=1e9;
  for(const el of L){ if(el===cur) continue;
    const q=el.getBoundingClientRect(), ex=q.left+q.width/2, ey=q.top+q.height/2;
    const along=(ex-cx)*D[0]+(ey-cy)*D[1];
    const gap = D[0]? Math.max(0, q.top-r.bottom, r.top-q.bottom) : Math.max(0, q.left-r.right, r.left-q.right);
    const perp = gap*2.4 + Math.abs(D[0]?(ey-cy):(ex-cx))*0.3;
    if(along>4){ const sc=along+perp; if(sc<bs){ bs=sc; best=el; } }
    else if(along<-4){ const sc=along+perp; if(sc<ws){ ws=sc; wrap=el; } }  // wrap-around: the far end of the same line
  }
  const go=best||wrap; if(go){ PAD.moved=true; b3SetFocus(go); SFX.padNav(); }
}
function b3Nudge(inp,sgn){
  const st=parseFloat(inp.step)||0.05, mn=parseFloat(inp.min)||0, mx=parseFloat(inp.max)||1;
  const v=Math.max(mn,Math.min(mx, Math.round(((parseFloat(inp.value)||0)+sgn*st)/st)*st));
  inp.value=v; inp.dispatchEvent(new Event('input',{bubbles:true}));
  clearTimeout(inp._b3c); inp._b3c=setTimeout(()=>inp.dispatchEvent(new Event('change',{bubbles:true})),260);
}
function b3Activate(){
  const s=b3PollScope(false); const el=PAD.focus;
  if(!s || !el){ return false; }
  if(el.tagName==='INPUT' && el.type==='range') { SFX.padNav(); return true; }
  if(el.id==='againBtn' && state==='dead'){ tcKey('keydown',' '); tcKey('keyup',' '); return true; } // the skip law: first press reads, second re-antes
  SFX.press(); try{ el.click(); }catch(e){}
  setTimeout(()=>b3PollScope(false),30);
  return true;
}
function b3Back(){
  const tp=$('tabPanel'); if(tp && tp.classList.contains('show')){ b3Codex(); return; }
  if(B3C.act){ b3EndCapture('— KEPT —'); return; }
  const dl=$('b3Dials'); if(dl && !dl.classList.contains('hidden')){ closeDials(); return; }
  const gp=$('gfxPanel'); if(gp && !gp.classList.contains('hidden') && PAD.fromDials){ gp.classList.add('hidden'); PAD.fromDials=false; openDials(); return; }
  const anyOpen=B3_SCOPES.some(q=>{ const e=document.querySelector(q); return e && b3Vis(e); });
  if(state==='menu' && !anyOpen) return;
  if(state==='dead' || state==='slot' || state==='wheel' || state==='crash' || state==='marker') { if(!anyOpen) return; }
  SFX.padBack(); tcKey('keydown','Escape'); tcKey('keyup','Escape');
}
function b3Codex(){
  if(typeof tcCodex==='function'){ const tp=$('tabPanel'); if(tp && !tp.classList.contains('show')) TC.tab=false; tcCodex(); }
}
function b3Page(sgn){ tcKey('keydown', sgn>0?'ArrowRight':'ArrowLeft'); tcKey('keyup', sgn>0?'ArrowRight':'ArrowLeft'); }

/* ---------- the pad loop ---------- */
function b3PadLoop(){
  try{ b3PadFrame(); }catch(e){ if(!PAD._err){ PAD._err=1; console.warn('[B3 pad]',e); } }
  requestAnimationFrame(b3PadLoop);
}
function b3PadFrame(){
  const gp=b3Pad();
  if(!gp){ if(PAD.on){ PAD.on=false; PAD.mx=PAD.my=0; if(PAD.aDown){ PAD.aDown=false; tcKey('keyup',' '); } } return; }
  PAD.on=true;
  if(gp.id!==PAD.id){ PAD.id=gp.id; PAD.fam=b3Fam(gp.id); }
  const B=i=>{ const b=gp.buttons[i]; return !!(b && (b.pressed || b.value>0.55)); };
  const now=[]; for(let i=0;i<Math.max(17,gp.buttons.length);i++) now[i]=B(i);
  const was=PAD.prev; const edge=i=>now[i]&&!was[i]; const rel=i=>!now[i]&&was[i];
  const ax=gp.axes[0]||0, ay=gp.axes[1]||0, ry=gp.axes[3]||0;
  let mx=Math.abs(ax)>0.25?ax:0, my=Math.abs(ay)>0.25?ay:0;
  if(now[12]) my-=1; if(now[13]) my+=1; if(now[14]) mx-=1; if(now[15]) mx+=1;
  PAD.mx=Math.max(-1,Math.min(1,mx)); PAD.my=Math.max(-1,Math.min(1,my));
  const any=now.some((v,i)=>v&&!was[i]) || Math.abs(ax)>0.5 || Math.abs(ay)>0.5;
  if(any) b3SetInput('pad');
  PAD.prev=now;
  if(PAD.mode!=='pad') return;
  // codex open: Ⓨ / Ⓑ / VIEW close it, nothing else is live
  const tp=$('tabPanel'); const codexOpen=tp && tp.classList.contains('show');
  if(edge(3)||edge(8)){ b3Codex(); return; }
  if(codexOpen){ if(edge(1)) b3Codex(); return; }
  // the rebinding keycap is listening: any pad press keeps the old key
  if(B3C.act){ if(now.some((v,i)=>v&&!was[i])) b3EndCapture('— KEPT — (KEYS ARE BOUND ON THE KEYBOARD)'); return; }
  const s=b3PollScope(false);
  if(s){
    if(PAD.aDown){ PAD.aDown=false; tcKey('keyup',' '); }
    // directions with a held-repeat (first step instant, then 360ms, then every 110ms)
    let dir=null;
    if(now[12]) dir='up'; else if(now[13]) dir='down'; else if(now[14]) dir='left'; else if(now[15]) dir='right';
    else if(Math.abs(ax)>0.6||Math.abs(ay)>0.6) dir=Math.abs(ax)>Math.abs(ay)?(ax>0?'right':'left'):(ay>0?'down':'up');
    const t=performance.now();
    if(dir){ if(PAD.rep.dir!==dir){ PAD.rep={dir,t:t+360}; b3Nav(dir); } else if(t>=PAD.rep.t){ PAD.rep.t=t+110; b3Nav(dir); } }
    else PAD.rep={};
    if(Math.abs(ry)>0.25){ // right stick scrolls the page you're reading
      const sc=[...s.el.querySelectorAll('*')].find(x=>x.scrollHeight>x.clientHeight+4 && /(auto|scroll)/.test(getComputedStyle(x).overflowY));
      if(sc) sc.scrollTop+=ry*16; }
    if(edge(0)) b3Activate();
    if(edge(1)) b3Back();
    if(edge(9)){ if(state==='menu' && s.el.id==='menu'){ SFX.press(); $('startBtn').click(); } else { SFX.padBack(); tcKey('keydown','Escape'); tcKey('keyup','Escape'); } }
    if(edge(4)) b3Page(-1); if(edge(5)) b3Page(1);
    return;
  }
  // in the pit: Ⓐ is the space bar (held — the dice want a hold), Ⓧ cashes, START pauses
  if(edge(0)){ PAD.aDown=true; tcKey('keydown',' '); }
  if(rel(0) && PAD.aDown){ PAD.aDown=false; tcKey('keyup',' '); }
  if(edge(2)){ tcKey('keydown','Enter'); tcKey('keyup','Enter'); }
  if(edge(9)){ tcKey('keydown','Escape'); tcKey('keyup','Escape'); }
  if(edge(1) && (state==='slot'||state==='wheel')){ tcKey('keydown','Escape'); tcKey('keyup','Escape'); }
}
requestAnimationFrame(b3PadLoop);

/* ---------- the pad bar: what the hand can do, right now ---------- */
function b3PadBar(){
  let b=$('b3PadBar');
  if(!b){ b=document.createElement('div'); b.id='b3PadBar'; document.body.appendChild(b); }
  const on=PAD.mode==='pad' && !!PAD.scope;
  b.classList.toggle('on',on);
  if(!on) return;
  const G=padG(); const inMenu=PAD.scope&&PAD.scope.id==='menu';
  b.innerHTML='<span><b>✚</b> CHOOSE</span><span><b>'+G.a+'</b> SELECT</span>'+(inMenu?'<span><b>'+G.start+'</b> PLAY</span>':'<span><b>'+G.b+'</b> BACK</span>')
    +(PAD.focus&&PAD.focus.type==='range'?'<span><b>◀ ▶</b> ADJUST</span>':'')+'<span><b>R-STICK</b> SCROLL</span>';
}

/* ---------- THE DIALS (settings panel) ---------- */
const DIAL_SLIDERS=[
  {k:'vol',   n:'MASTER',          sec:'snd', min:0, max:1,   get:()=>GFX.vol!==undefined?GFX.vol:1, set:v=>{ GFX.vol=v; applyGfxSide(); const g=$('gxVol'); if(g) g.value=v; }, save:()=>saveGfx(), fmt:v=>Math.round(v*100)+'%'},
  {k:'sfx',   n:'SOUND EFFECTS',   sec:'snd', min:0, max:1,   get:()=>DIALS.sfx, set:v=>{ DIALS.sfx=v; b3SetBusVols(); }, save:()=>saveDials(), fmt:v=>Math.round(v*100)+'%', prev:()=>{ SFX.coin(); }},
  {k:'music', n:'MUSIC',           sec:'snd', min:0, max:1,   get:()=>DIALS.music, set:v=>{ DIALS.music=v; }, save:()=>saveDials(), fmt:v=>Math.round(v*100)+'%'},
  {k:'shake', n:'SCREEN SHAKE',    sec:'feel',min:0, max:1.5, get:()=>GFX.shake!==undefined?GFX.shake:1, set:v=>{ GFX.shake=v; GFX.preset=gfxDerivePreset(); try{ shake=Math.min(11,(shake||0)+5*v); }catch(e){} }, save:()=>saveGfx(), fmt:v=>v===0?'OFF':Math.round(v*100)+'%', prev:()=>{ b3ShakeCard(); }},
  {k:'flash', n:'FLASH INTENSITY', sec:'feel',min:0, max:1,   get:()=>GFX.flash!==undefined?GFX.flash:1, set:v=>{ GFX.flash=v; GFX.preset=gfxDerivePreset(); }, save:()=>saveGfx(), fmt:v=>v===0?'OFF':Math.round(v*100)+'%', prev:()=>{ flash(0.32,'#ffd36b'); }}
];
const DIAL_TOGGLES=[
  {k:'calm',   n:'REDUCE FLASHING', sec:'feel', on:'ON — CALM', off:'OFF', after:()=>{ applyDials(); if(!DIALS.calm) flash(0.25,'#fff2c0'); }},
  {k:'rumble', n:'PAD RUMBLE',      sec:'feel', on:'ON',  off:'OFF', after:()=>{ if(DIALS.rumble){ const m=PAD.mode; PAD.mode='pad'; b3Rumble(220,0.6,0.9); PAD.mode=m; } }},
  {k:'seek',   n:'LOOK FOR TRACKS', sec:'snd',  on:'ON — BESIDE THE PAGE', off:'OFF', after:()=>{ if(DIALS.seek) musicSeek(); b3DialsMusicLine(); }}
];
function b3ShakeCard(){ const c=$('b3Card'); if(!c) return; const a=Math.max(0,Math.min(1.5,GFX.shake||0)); if(!a) return;
  c.style.setProperty('--b3sh',(4*a).toFixed(1)+'px'); c.classList.remove('b3Shk'); void c.offsetWidth; c.classList.add('b3Shk'); }
function buildDials(){
  if($('b3Dials')) return;
  const p=document.createElement('div'); p.id='b3Dials'; p.className='hidden';
  const sl=d=>'<div class="b3Row"><span class="b3N">'+d.n+'</span><span class="b3Ctl"><input type="range" class="b3Rng" data-k="'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="0.05"><b class="b3V" data-v="'+d.k+'"></b></span></div>';
  const tg=d=>'<div class="b3Row"><span class="b3N">'+d.n+'</span><button class="gxBtn b3Tg" data-t="'+d.k+'"></button></div>';
  p.innerHTML='<div id="b3Card">'
    +'<div class="b3Title">⚙ THE DIALS ⚙</div><div class="b3Sub">SOUND · FEEL · HANDS</div>'
    +'<div class="b3Sec">♪ SOUND</div>'+DIAL_SLIDERS.filter(d=>d.sec==='snd').map(sl).join('')+DIAL_TOGGLES.filter(d=>d.sec==='snd').map(tg).join('')
    +'<div class="b3Note" id="b3Music"></div>'
    +'<div class="b3Sec">✦ FEEL</div>'+DIAL_SLIDERS.filter(d=>d.sec==='feel').map(sl).join('')+DIAL_TOGGLES.filter(d=>d.sec==='feel').map(tg).join('')
    +'<div class="b3Sec">⌨ HANDS</div><div id="b3Binds"></div><div class="b3Note" id="b3BindMsg">CLICK A KEYCAP, THEN PRESS THE NEW KEY · A TAKEN KEY SWAPS</div>'
    +'<div class="b3Btns"><button class="gxBtn" id="b3KeyReset">RESET KEYS</button><button class="gxBtn" id="b3Gfx">GRAPHICS &amp; MORE ▸</button></div>'
    +'<div class="b3Note b3Pad" id="b3PadLine"></div>'
    +'<button class="gxBtn gxClose" id="b3Close">CLOSE</button></div>';
  document.body.appendChild(p);
  p.addEventListener('click',e=>e.stopPropagation());
  p.querySelectorAll('.b3Rng').forEach(inp=>{ const d=DIAL_SLIDERS.find(x=>x.k===inp.dataset.k);
    inp.addEventListener('input',()=>{ const v=parseFloat(inp.value); d.set(v); b3DialVal(d);
      if(!inp._tk||performance.now()-inp._tk>150){ inp._tk=performance.now(); if(d.prev) d.prev(); else { try{ tone(523+v*520,0.08,'sine',0.08); }catch(x){} } } });
    inp.addEventListener('change',()=>{ d.save(); }); });
  p.querySelectorAll('.b3Tg').forEach(b=>b.addEventListener('click',()=>{ const d=DIAL_TOGGLES.find(x=>x.k===b.dataset.t);
    DIALS[d.k]=!DIALS[d.k]; saveDials(); b3DialsSync(); SFX.uiDing(); if(d.after) d.after(); }));
  $('b3Binds').addEventListener('click',e=>{ const b=e.target.closest('.b3Bind'); if(!b) return; const a=BIND_ACTS.find(x=>x.id===b.dataset.act);
    if(B3C.act===a){ b3EndCapture('— KEPT —'); return; }
    if(PAD.mode==='pad'){ const m=$('b3BindMsg'); if(m) m.textContent='KEYS ARE BOUND ON THE KEYBOARD — THE PAD LAYOUT IS FIXED BELOW'; SFX.thud(); return; }
    b3BeginCapture(a); });
  $('b3KeyReset').addEventListener('click',()=>{ DIALS.binds={}; saveDials(); B3C.act=null; renderBinds(); const m=$('b3BindMsg'); if(m) m.textContent='✦ THE HOUSE KEYS, AS DEALT ✦'; SFX.casinoDing(); });
  $('b3Gfx').addEventListener('click',()=>{ p.classList.add('hidden'); PAD.fromDials=true; openGfx(); });
  $('b3Close').addEventListener('click',()=>closeDials());
}
function b3DialVal(d){ const v=$('b3Dials').querySelector('[data-v="'+d.k+'"]'); if(v) v.textContent=d.fmt(d.get()); }
function b3DialsSync(){
  const p=$('b3Dials'); if(!p) return;
  p.querySelectorAll('.b3Rng').forEach(inp=>{ const d=DIAL_SLIDERS.find(x=>x.k===inp.dataset.k); inp.value=d.get(); b3DialVal(d); });
  p.querySelectorAll('.b3Tg').forEach(b=>{ const d=DIAL_TOGGLES.find(x=>x.k===b.dataset.t); b.textContent=DIALS[d.k]?d.on:d.off; b.classList.toggle('on',!!DIALS[d.k]); });
  renderBinds(); b3DialsMusicLine(); b3RenderPadLine();
}
function b3DialsMusicLine(){
  const m=$('b3Music'); if(!m) return;
  const have=MUSIC_CTX.filter(k=>MUSIC.found[k]);
  m.innerHTML = have.length
    ? '♫ THE BAND KNOWS '+have.length+' OF 5 — '+MUSIC_CTX.map(k=>'<i class="'+(MUSIC.found[k]?'y':'n')+'">'+k.toUpperCase()+'</i>').join(' · ')
    : '♫ NO TRACKS YET — DROP menu · run · boss · ascent · house (.ogg / .mp3) INTO assets/music/';
}
function b3RenderPadLine(){
  const l=$('b3PadLine'); if(!l) return; const G=padG(); const gp=b3Pad();
  l.innerHTML=(gp?'🎮 '+(PAD.fam==='ps'?'PLAYSTATION PAD':'PAD')+' AT THE TABLE':'🎮 NO PAD — PRESS ANY BUTTON ON ONE')
    +'<br>L-STICK walk · <b>'+G.a+'</b> bet / select · <b>'+G.b+'</b> back · <b>'+G.x+'</b> cash · <b>'+G.y+'</b> codex · <b>'+G.start+'</b> pause · <b>'+G.lb+' '+G.rb+'</b> pages';
}
function openDials(){ buildDials(); b3DialsSync(); const p=$('b3Dials'); p.classList.remove('hidden'); SFX.vaultOpen(); if(PAD.mode==='pad'){ PAD.scope=null; b3PollScope(true); } }
function closeDials(){ const p=$('b3Dials'); if(!p) return; B3C.act=null; p.classList.add('hidden'); saveDials(); SFX.casinoDing(); }
// the menu's OPTIONS opens THE DIALS; graphics live one door further in
try{ const gb=$('gfxBtn'); gb.removeEventListener('click',openGfx); gb.addEventListener('click',openDials); }catch(e){}
document.addEventListener('click',e=>{ if(e.target && e.target.id==='gfxClose' && PAD.fromDials){ PAD.fromDials=false; setTimeout(openDials,0); } },true);
// the pause card gains a SETTINGS pill
{ const row=$('howBtnRow'); if(row && !$('b3PzSet')){ const b=document.createElement('button'); b.className='pillBtn'; b.id='b3PzSet'; b.textContent='SETTINGS';
    const q=$('quitBtn'); if(q) row.insertBefore(b,q); else row.appendChild(b);
    b.addEventListener('click',e=>{ e.stopPropagation(); openDials(); }); } }
// on a phone the pause card itself carries SETTINGS beside ✦ YOUR CODEX (four pills don't fit 390px)
setInterval(()=>{ const r=$('tcPzRow'); if(!r || $('b3PzSet2')) return;
  const b=document.createElement('button'); b.className='btn msm'; b.id='b3PzSet2'; b.type='button'; b.textContent='⚙ SETTINGS';
  const cx=$('tcPzCodex'); if(cx && cx.nextSibling) r.insertBefore(b,cx.nextSibling); else r.appendChild(b);
  b.addEventListener('click',e=>{ e.stopPropagation(); openDials(); }); },700);
