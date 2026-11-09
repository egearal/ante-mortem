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
        ['THE FEED','A full bar turns into THE FEED: +50% power, and it starts to starve. Keep killing to feed it. The longer it feeds, the richer the next reels: WARM at 3s, HOT at 7s, FEAST at 12s (only epic & legendary). SPACE cashes any time. Let it starve and you lose a quarter of the XP.'],
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
        ['COINS','This run\'s money. Feeds THE FEED, pays for the case.'],
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
    // F1: tonight's systems, in the House's voice
    const NEW_TABS=[
      {ico:'♛', name:'FATES', col:'#fff2c0', items:[
        ['♛ PAIRINGS','Max a weapon while you hold its one true skill: the next slot fuses them into an evolved weapon. TAB shows each recipe.'],
        ['✦ MAJOR ARCANA','Tarot in a column of gold light. Huge power, often a price: THE TOWER takes your coins. Read its name before you step on.'],
        ['∞ PRESS ON','Live to 15:00 and the night is WON. PRESS ON into the endless dark, or CASH OUT.']
      ]},
      {ico:'⚔', name:'HIGH ROLLERS', col:'#ff9a5a', items:[
        ['🃏 THE CROUPIER','His cards flip: ♠ blades, ♥ he heals (step on it, steal it), ♦ coins, ♣ frost. On his coin flip, SPACE when your face shows.'],
        ['⚖ THE BOOKIE','When bets close, stand on an odds marker. 2:1 is safe, 10:1 is under his feet. Win: he bleeds. Lose: a curse.'],
        ['☯ THE TWINS','Two masks, one life. Their roulette picks who bleeds — hit the twin wearing ×1. Never touch the chain.']
      ]},
      {ico:'☀', name:'NEW TABLES', col:'#8bffd0', items:[
        ['☀ DAILY DEBT','One seeded night a day, the same for everyone. First try is SCORED; the rest are practice. Keep the streak.'],
        ['◆ THE STAKES','A won night unseals five decks, each crueler and richer, each with a prize on its first clear.'],
        ['⚖ BOOK OF DEBTS','The first door in the hall: every seal the House still owes you, nearest first.']
      ]},
      {ico:'♕', name:'NEW FACES', col:'#d9a3c0', items:[
        ['♕ THE BALLROOM','A floor of mirror glass. It WALTZES you in circles, chandeliers crush the crowd (stay out of the ring), mirror twins step from the edges.'],
        ['♣ ✝ SOULS','THE CARDSHARP sees each pull first. THE MARTYR never heals, but bleeding makes her stronger.'],
        ['✧ ♖ SOULS','THE MAGPIE drags coins from afar. THE BANKER\'S GHOST earns interest on his purse.']
      ]},
      {ico:'⚙', name:'HANDS & DIALS', col:'#c98bff', items:[
        ['🎮 PAD','L-STICK walks · Ⓐ every bet (hold to roll) · Ⓧ cash · Ⓨ codex · START pause · Ⓑ back.'],
        ['☝ PHONE','Left thumb anywhere walks. The gold ◈ BET coin is SPACE. II pauses, ✦ CODEX opens your book.'],
        ['⚙ SETTINGS','OPTIONS on the menu, SETTINGS on the pause: volume, shake, flash, REDUCE FLASHING, rumble.']
      ]}
    ];
    const TABS=[RULES_TAB, H4[0], H4[1], H4[2], H4[3]].concat(NEW_TABS);
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
  try{ const g9=cv.getContext('2d'); g9.save(); g9.setTransform(1,0,0,1,0,0); g9.clearRect(0,0,cv.width,cv.height); g9.restore(); }catch(e){} // H2: a clean felt behind the menu, as on first boot
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
  try{ const fp=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(); if(fp&&fp.catch) fp.catch(()=>{}); }catch(x){} } });
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
  // F1: the pairing recipes for the guns you carry, in plain sight
  try{ if(typeof PAIRINGS!=='undefined'){ const rows=[];
    WEAPONS.forEach(w=>{ const lv=P.wlv[w.id]||0; const pr=PAIR_BY_W[w.id]; if(!lv||!pr) return;
      const ps=PASSIVES.find(p=>p.id===pr.p); const pn=ps?(ps.g+' '+ps.n):pr.p;
      const st=(P.evo&&P.evo[w.id])?'<b style="color:#ffd36b">♛ EVOLVED</b>':(pairReady(pr)?'<b style="color:#8bffd0">✓ READY — NEXT LEVEL</b>':'<i>'+w.n+' '+lv+'/'+w.max+(skillLevel(pr.p)>0?' · skill ✓':'')+'</i>');
      rows.push('<div class="tpPair">'+w.g+' MAX '+w.n+' + '+pn+' → <span style="color:'+(GLYPH_COL[pr.id]||'#fff2c0')+'">'+pr.g+' '+pr.n+'</span> · '+st+'</div>'); });
    if(rows.length) h+='<div class="tpH">♛ PAIRINGS</div><div class="tpPairs">'+rows.join('')+'</div>';
  } }catch(e){}
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
if(GFX.cb===undefined) GFX.cb=false; if(GFX.tabT===undefined) GFX.tabT=false; // B4: fresh saves printed 'UNDEFINED'
function gfxLabel(d){ let o=d.opts.find(o=>o[0]===GFX[d.k]);
  if(!o && typeof GFX[d.k]==='number') o=d.opts.reduce((a,b)=>Math.abs(b[0]-GFX[d.k])<Math.abs(a[0]-GFX[d.k])?b:a); // B4: preset values between stops (pcap 220) read as the nearest stop, not a raw number
  return o?o[1]:String(GFX[d.k]); }
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
  { const gf=p.querySelector('#gxFull'); if(gf) gf.addEventListener('click',()=>{ try{ const fp=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(); if(fp&&fp.catch) fp.catch(()=>{}); }catch(x){} SFX.uiDing(); }); }
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
      let wtxt='WAVE '+wave+(left9>0?' · SLAY '+left9:'');
      { const ha9=(typeof b2HouseAt==='function')?b2HouseAt():780; if(gt>=ha9-60&&gt<ha9&&!P._endless) wtxt='☷ THE HOUSE IN '+Math.ceil(ha9-gt)+'s ☷'; } if(_hud.wv!==wtxt){ _hud.wv=wtxt; wv.textContent=wtxt; } } }
  { const tgt=P.coins; if(window._coinDisp===undefined||window._coinDisp>tgt) window._coinDisp=tgt;
    const dd=tgt-window._coinDisp;
    if(dd>60){ window._coinDisp+=Math.max(1,Math.ceil(dd*0.16)); // big gains ROLL like an odometer
      if(!window._coinTk||performance.now()-window._coinTk>70){ window._coinTk=performance.now(); try{ tone(680+Math.random()*240,0.02,'square',0.03); }catch(e){} } }
    else window._coinDisp=tgt;
    _hSet('coinCount',Math.round(window._coinDisp).toLocaleString()); }
  const bb=$('bossBar'); const bs=state==='dead'?null:enemies.find(x=>x.boss); // G1: a living boss must not re-raise its bar over the ledger
  if(bs){ bb.classList.remove('hidden'); const bp9=Math.max(0,bs.hp/bs.maxhp*100);
    _hSet('bossName',BOSS_DEFS[bs.bossKind].bar?BOSS_DEFS[bs.bossKind].bar(bs,bp9):BOSS_DEFS[bs.bossKind].name+' — '+Math.ceil(bp9)+'%'); _hW('bossFill',bp9.toFixed(1)+'%'); }
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
    cm.style.transform='translateX(-50%) scale('+(1+Math.min(window._touchUI?0.15:0.5,killStreak*0.01))+')'; } // B4: on a phone the plaque has ~200px between the buttons — it swells less
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
  croupier:'#ff2a6a', bookie:'#2bff9e', twins:'#f2a900', loaded:'#ff8af7', marked:'#ff5a1f', // C2 — the high rollers + elite affixes
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
      { const qb=$('quitBtn'); if(qb) qb.textContent=(window.LESSON&&window.LESSON.on)?'LEAVE THE LESSON':'QUIT TO MENU'; } // J3
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
    if(typeof hrSpace==='function' && hrSpace()) return; // C2 — the Croupier's coin takes the call first
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
    if(crash&&crash.jk){ e.preventDefault(); const n9=(crash.jkOpts||[]).length; // B4: the pick no longer needs a 1/2/3 key — a pad (Ⓐ = SPACE) was locked out of it forever
      if(k==='1'||k==='2'||k==='3') pickJackpot(+k-1);
      else if(n9 && !e.repeat && (k==='a'||k==='arrowleft'||k==='d'||k==='arrowright')){ crash.jkSel=((crash.jkSel||0)+((k==='a'||k==='arrowleft')?-1:1)+n9)%n9; jkPaint(); SFX.uiDing&&SFX.uiDing(); }
      else if(n9 && !e.repeat && (k===' '||k==='enter') && performance.now()-(crash.jkT||0)>450) pickJackpot(crash.jkSel||0);
      return; }
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
        mk.p=Math.min(mk.max, mk.p+0.0025+rng('fate')*0.005); // +0.25–0.75% a press — every decimal earned
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
   u:()=>(LT.houseMet||0)>=3, uTxt:'MEET THE HOUSE 3 TIMES', mods:{spd:1.1, xp:1.1, tarot:2, tint:'chapel'}},
 {id:'ballroom', n:'THE BALLROOM', g:'♕', col:'#d9a3c0', d:'A mirrored floor under the great chandelier. Every 90s the floor WALTZES (a turning current). Chandeliers fall — everything under one dies, you too — and leave coins. Mirrors at the edges send reflections.',
   u:()=>(REC.minutes||0)>=10 || (LT.houseMet||0)>=1 || !!(typeof stakeCleared==='function'&&stakeCleared(1)), uTxt:'SURVIVE 10:00 (OR CLEAR STAKE 1)', mods:{ballroom:true}}
];
function curFloor(){ if(DLY_RNG && typeof dlyFloor==='function') return dlyFloor(); const pf=window.__probeFloor, f=FLOORS.find(x=>x.id===(pf||IDX.fl||'pit')); return (f&&(pf||f.u()))?f:FLOORS[0]; } // __probeFloor: headless harness only (probes --floor)
/* ==== D3 — THE BALLROOM ====================================================
   The fourth floor. A mirrored dance floor under a vast chandelier.
   · every 90s THE WALTZ — a slow rotating current carries the court (and you)
   · CHANDELIER CRASH — a telegraphed circle; everything under it dies (you too),
     a pile of coins is left in the glass
   · MIRROR TWINS — a view edge silvers over and the court's reflections step out
   All state lives in BAL (reset per run via _runSeq). Hooks in core.js: balUpdate (update),
   balTile / balMedallion / balGround / balSky (render). Art is baked once (Batch 16).
   ========================================================================== */
const BAL={seq:-1, crashes:[], wreck:[], mirrors:[], stuns:[]}, BAL_NONE=[];
function balOn(){ return !!(window._fmods&&window._fmods.ballroom); }
function balReset(){
  BAL.seq=window._runSeq;
  BAL.waltzAt=(Math.floor(gt/90)+1)*90; BAL.waltz=null; BAL.dir=-1;
  BAL.chandAt=gt+48; BAL.crashes=[]; BAL.wreck=[]; BAL.stuns=[];
  BAL.mirAt=gt+72; BAL.seam=null; BAL.mirrors=[]; BAL.mirChk=0;
  BAL.beatAcc=0; BAL.bi=0; BAL.tinkT=6; BAL.shatT=0; BAL.crushed=0;
  window.__hazards=BAL.crashes; // the probe bot reads the telegraphs like a player would
}
// ---- sound: all synthesized ----
const BAL_SFX={
  swell(){ [220,277,330,440,554,659].forEach((f,i)=>setTimeout(()=>tone(f,0.9,'triangle',0.07),i*90)); tone(110,1.6,'sine',0.16,112); noise(0.9,0.05,5200); },
  settle(){ [659,554,440,330].forEach((f,i)=>setTimeout(()=>tone(f,0.5,'sine',0.05),i*110)); },
  creak(){ tone(62,0.9,'sawtooth',0.07,48); tone(95,0.7,'sawtooth',0.04,80); noise(0.5,0.05,600); for(let i=0;i<4;i++) setTimeout(()=>tone(2600+Math.random()*1800,0.08,'sine',0.04),120+i*140); },
  tinkle(){ for(let i=0;i<6;i++) setTimeout(()=>tone(3000+Math.random()*2200,0.09,'sine',0.05),i*55); },
  snap(){ tone(1800,0.05,'square',0.10,600); noise(0.08,0.16,4200); tone(180,0.25,'sawtooth',0.08,90); },
  crash(big){ noise(0.9,0.42,5200); noise(0.5,0.3,900); tone(52,0.9,'sine',0.34,28); tone(96,0.5,'triangle',0.2,40);
    for(let i=0;i<(big?14:9);i++) setTimeout(()=>tone(2200+Math.random()*3600,0.14+Math.random()*0.2,'sine',0.07),40+i*38+Math.random()*30); },
  shatter(){ noise(0.14,0.10,6000); tone(3200+Math.random()*1600,0.12,'sine',0.06); tone(4800+Math.random()*900,0.08,'sine',0.04); },
  mirror(){ for(let i=0;i<5;i++) setTimeout(()=>tone(880*Math.pow(1.26,i),0.4,'sine',0.05),i*70); noise(0.6,0.05,7000); tone(220,0.8,'triangle',0.06,440); }
};
// THE BALLROOM'S OWN AIR — a distant music box in 3/4 (A minor), swelling into the waltz
const BAL_CH=[[110,[220,261.6,329.6]],[82.4,[207.7,246.9,329.6]],[110,[220,261.6,329.6]],[73.4,[220,293.7,349.2]],
              [110,[220,261.6,329.6]],[82.4,[207.7,246.9,293.7]],[110,[261.6,329.6,440]],[82.4,[246.9,329.6,415.3]]];
const BAL_MEL=[659,523,440, 659,494,415, 587,523,440, 698,587,440, 659,523,440, 587,494,415, 523,659,880, 831,659,494];
function balMusic(dt){
  BAL.beatAcc+=dt; if(BAL.beatAcc<0.46) return; BAL.beatAcc-=0.46; if(BAL.beatAcc>0.46) BAL.beatAcc=0;
  const w=BAL.waltz, env=w?balEnv(w):0;
  const bed=(typeof GFX!=='undefined'&&GFX.amb===false)?0:1;
  if(!bed && env<=0.05) { BAL.bi++; return; }
  const v=0.018*bed+0.05*env, i=BAL.bi++, ch=BAL_CH[((i/3)|0)%8], b=i%3;
  if(b===0) tone(ch[0],0.44,'sine',v*1.5);
  else { tone(ch[1][b],0.2,'triangle',v*0.55); tone(ch[1][b===1?0:2],0.2,'triangle',v*0.45); }
  if(env>0.15) tone(BAL_MEL[i%24],0.42,'sine',0.055*env);
  BAL.tinkT-=0.46; if(BAL.tinkT<=0 && bed){ BAL.tinkT=7+Math.random()*7; for(let k=0;k<3;k++) setTimeout(()=>tone(3400+Math.random()*1800,0.12,'sine',0.014),k*90); }
}
function balEnv(w){ return Math.max(0,Math.min(1, w.t/2, (w.dur-w.t)/2.5)); }
// ---- the night's machinery ----
function balUpdate(dt){
  if(BAL.seq!==window._runSeq) balReset();
  if(typeof state!=='undefined' && state!=='playing') return;
  balMusic(dt);
  // ♫ THE WALTZ — every 90s the floor turns
  if(!BAL.waltz && gt>=BAL.waltzAt){ BAL.waltzAt+=90; BAL.dir=-BAL.dir;
    BAL.waltz={x:P.x,y:P.y,t:0,dur:16,dir:BAL.dir};
    announce('♫ THE FLOOR WALTZES — '+(BAL.dir>0?'TURNING SUNWISE':'TURNING WIDDERSHINS')+' ♫', true);
    BAL_SFX.swell(); flash(0.22,'#cdd5e8'); ring(P.x,P.y,260,'#cdd5e8'); ring(P.x,P.y,180,'#a03050'); shake=Math.min(10,shake+4); }
  if(BAL.waltz){ const w=BAL.waltz; w.t+=dt;
    if(w.t>=w.dur){ BAL.waltz=null; showStreak('♫ THE MUSIC SETTLES ♫'); BAL_SFX.settle(); }
    else { const S=92*balEnv(w)*w.dir*dt, cx=w.x, cy=w.y, A=CFG.arena;
      const drift=(o,k)=>{ const dx=o.x-cx, dy=o.y-cy, d=Math.sqrt(dx*dx+dy*dy); if(d<1||d>1150) return;
        const f=Math.min(1,d/220)*(d>820?Math.max(0,1-(d-820)/330):1)*k; o.x-=dy/d*S*f; o.y+=dx/d*S*f; };
      for(const e of enemies) drift(e, e.boss?0.5:1);
      drift(P,0.5); P.x=clamp(P.x,14,A-14); P.y=clamp(P.y,14,A-14);
      for(const c of coins) drift(c,0.8); for(const o of orbs) drift(o,0.8); } }
  // ✦ CHANDELIER CRASH — telegraphed, lethal, generous
  if(gt>=BAL.chandAt && BAL.crashes.length<(houseActive?2:1)){
    BAL.chandAt=gt+(houseActive?11+Math.random()*4:26+Math.random()*12); balDrop(); }
  for(let i=BAL.crashes.length-1;i>=0;i--){ const c=BAL.crashes[i]; const pt=c.t; c.t+=dt;
    if(pt<1.1 && c.t>=1.1) BAL_SFX.tinkle();
    if(pt<c.tel-0.45 && c.t>=c.tel-0.45) BAL_SFX.snap();
    if(c.t>=c.tel){ BAL.crashes.splice(i,1); balImpact(c); } }
  for(let i=BAL.wreck.length-1;i>=0;i--){ if((BAL.wreck[i].t+=dt)>20) BAL.wreck.splice(i,1); }
  for(let i=BAL.stuns.length-1;i>=0;i--){ const s=BAL.stuns[i]; s.t-=dt;
    if(s.t<=0||enemies.indexOf(s.e)<0){ s.e.spd=s.spd; s.e._balStun=false; BAL.stuns.splice(i,1); } }
  // ◇ MIRROR TWINS — the edge of the floor silvers, and the court's reflections step out of it
  if(!houseActive && !BAL.seam && gt>=BAL.mirAt){ BAL.mirAt=gt+24+Math.random()*10;
    BAL.seam={side:(Math.random()*4)|0, t:0, done:false}; showStreak('◇ THE MIRRORS STIR ◇'); BAL_SFX.mirror(); }
  if(BAL.seam){ const s=BAL.seam; s.t+=dt; if(!s.done && s.t>=1.1){ s.done=true; if(!houseActive) balReflect(s.side); } if(s.t>2.4) BAL.seam=null; }
  for(let i=BAL.mirrors.length-1;i>=0;i--){ const m=BAL.mirrors[i];
    if(m.hp<=0){ BAL.mirrors.splice(i,1);
      for(let k=0;k<7;k++){ const a=Math.random()*6.283, s=rnd(60,220); parts.push({x:m.x,y:m.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.6),col:k%2?'#e6ecff':'#9aa6c8',r:rnd(1.2,2.6)}); }
      if(gt-BAL.shatT>0.09){ BAL.shatT=gt; BAL_SFX.shatter(); } } }
  if((BAL.mirChk+=dt)>1){ BAL.mirChk=0; for(let i=BAL.mirrors.length-1;i>=0;i--) if(enemies.indexOf(BAL.mirrors[i])<0) BAL.mirrors.splice(i,1); }
}
function balDrop(){
  const R=houseActive?120:140; let tx, ty;
  if(houseActive){ tx=P.x+rnd(-50,50); ty=P.y+rnd(-50,50); }
  else { const vis=[]; for(const e of enemies){ if(!e.boss && e.x>camX+70&&e.x<camX+VW-70&&e.y>camY+70&&e.y<camY+VH-70) vis.push(e); }
    let best=null, bn=-1;
    for(let k=0;k<Math.min(14,vis.length);k++){ const a=vis[(Math.random()*vis.length)|0]; let n=0;
      for(const b of vis){ const dx=a.x-b.x, dy=a.y-b.y; if(dx*dx+dy*dy<R*R) n++; } if(n>bn){ bn=n; best=a; } }
    if(best){ // lead the target: the court walks toward you, so the glass lands where they WILL be
      let mx=0, my=0, ms=0, mn=0; for(const b of vis){ const dx=best.x-b.x, dy=best.y-b.y; if(dx*dx+dy*dy<R*R){ mx+=b.x; my+=b.y; ms+=b.spd; mn++; } }
      mx/=mn; my/=mn; ms/=mn; const ddx=P.x-mx, ddy=P.y-my, dd=Math.hypot(ddx,ddy)||1, lead=Math.min(dd*0.55, ms*2.0, 260);
      tx=mx+ddx/dd*lead; ty=my+ddy/dd*lead;
      // the House's own drops hunt you; the night's drops are a gift you must not walk into
      const px=tx-P.x, py=ty-P.y, pd=Math.hypot(px,py)||1; if(pd<R+30){ tx=P.x+px/pd*(R+30); ty=P.y+py/pd*(R+30); } } else { const a=Math.random()*6.283, d=rnd(170,280); tx=P.x+Math.cos(a)*d; ty=P.y+Math.sin(a)*d; } }
  const A=CFG.arena; tx=clamp(tx,R,A-R); ty=clamp(ty,R,A-R);
  BAL.crashes.push({x:tx,y:ty,r:R,t:0,tel:2.6,ph:Math.random()*6.283});
  showStreak('✦ THE CHANDELIER SWAYS — STAND CLEAR ✦'); BAL_SFX.creak();
}
function balImpact(c){
  const R=c.r; let k=0;
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(!e) continue; const dx=e.x-c.x, dy=e.y-c.y, rr=R+e.r;
    if(dx*dx+dy*dy>rr*rr) continue;
    if(e.boss){ e.flash=0.3;
      if(e.unkillable||e.bossKind==='housegod'){ if(!e._balStun){ e._balStun=true; BAL.stuns.push({e,t:2.6,spd:e.spd}); e.spd*=0.08; ftext(e.x,e.y-50,'STAGGERED','#e6ecff',true); } }
      else { const dm=e.maxhp*0.12; e.hp=Math.max(1,e.hp-dm); trackDmg(dm); ftext(e.x,e.y-40,Math.round(dm),'#e6ecff',true); }
      continue; }
    e.hp=0; killEnemy(e,i); k++; }
  BAL.crushed+=k;
  // the glass pays — a pile of coins in the wreck
  const n=Math.min(20, 3+Math.ceil(k/2));
  for(let i=0;i<n;i++){ const a=Math.random()*6.283, d=Math.random()*R*0.55; coins.push({x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d,r:6,vx:rnd(-70,70),vy:rnd(-70,70)}); }
  BAL.wreck.push({x:c.x,y:c.y,t:0,a:Math.random()*6.283});
  ring(c.x,c.y,R*1.5,'#ffffff'); ring(c.x,c.y,R*1.1,'#cdd5e8'); ring(c.x,c.y,R*0.7,'#a03050');
  for(let i=0;i<34;i++){ const a=Math.random()*6.283, s=rnd(120,420); parts.push({x:c.x+Math.cos(a)*R*0.3,y:c.y+Math.sin(a)*R*0.3,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.4,.9),col:i%3===0?'#ffffff':(i%3===1?'#cdd5e8':'#8fa0d0'),r:rnd(1.4,3.4)}); }
  shake=Math.min(26,shake+16); hitstop=Math.max(hitstop||0,0.06); flash(0.45,'#e6ecff');
  BAL_SFX.crash(k>=12);
  ftext(c.x,c.y-30,'+'+n+' ◈','#ffd36b',true);
  if(k>=25) bigWin('CRYSTAL MASSACRE ×'+k,3);
  else if(k>=14) bigWin('CHANDELIER ×'+k,2);
  else if(k>=7) bigWin('CHANDELIER ×'+k,1);
  else { coinRain(6); sparkBurst(12); }
  announce('✦ THE CHANDELIER FALLS — '+(k?k+' CRUSHED':'THE FLOOR IS SPARED')+' ✦', k>0);
  // the player stood under it
  const pdx=P.x-c.x, pdy=P.y-c.y;
  if(pdx*pdx+pdy*pdy<(R*0.9)*(R*0.9) && !(window.__bot&&window.__bot.god)){ announce('☠ CRUSHED UNDER THE CHANDELIER ☠', false); hurtPlayer(99999); }
}
function balReflect(side){
  const E=side===0?camX:side===1?camX+VW:side===2?camY:camY+VH, vert=side<2, A=CFG.arena;
  const N=Math.min(10, 3+Math.floor(gt/120));
  const pool=[]; for(const e of enemies){ if(e.boss||e.mirror) continue; if(e.x>camX&&e.x<camX+VW&&e.y>camY&&e.y<camY+VH) pool.push(e); }
  let made=0;
  for(let k=0;k<N && enemies.length<CFG.spawn.max;k++){
    let t='husk', x, y;
    if(pool.length){ const src=pool.splice((Math.random()*pool.length)|0,1)[0]; t=src.type;
      if(t==='elite'||t==='gilded'||t==='housegod'||!CFG.enemy[t]||BOSS_DEFS[t]) t='wraith';
      x=vert?2*E-src.x:src.x; y=vert?src.y:2*E-src.y; }
    else { const u=Math.random(); x=vert?E+(side===0?-60:60):camX+u*VW; y=vert?camY+u*VH:E+(side===2?-60:60); t=Math.random()<0.5?'husk':'shambler'; }
    x=clamp(x,20,A-20); y=clamp(y,20,A-20);
    spawnEnemy(t,x,y); const m=enemies[enemies.length-1]; if(!m) continue;
    m.mirror=true; m.hp*=0.5; m.maxhp*=0.5; m.col='#cdd5e8'; m.dark='#3c4258'; BAL.mirrors.push(m); made++; }
  if(made){ showStreak('◇ '+made+' REFLECTIONS STEP OUT ◇'); }
}
// ---- art: baked once ----
const _balTC=new Map();
function balTile(dark,variant){
  const key=(dark?1:0)*24+variant; let sp=_balTC.get(key); if(sp) return sp;
  const cs=200; sp=document.createElement('canvas'); sp.width=cs; sp.height=cs; const x=sp.getContext('2d');
  const vh=((variant+13)*2654435761)>>>0;
  // smoked mirror glass: violet-black, the darkest thing on screen (law 2)
  x.fillStyle=dark?'#09070c':'#0e0a11'; x.fillRect(0,0,cs,cs);
  { const g=x.createLinearGradient(0,0,cs,cs); g.addColorStop(0,'rgba(190,200,230,0.035)'); g.addColorStop(0.45,'rgba(0,0,0,0)'); g.addColorStop(0.62,'rgba(205,213,232,0.045)'); g.addColorStop(1,'rgba(60,10,30,0.05)');
    x.fillStyle=g; x.fillRect(0,0,cs,cs); }
  // reflection streaks — the mirror catches the chandeliers
  x.strokeStyle='rgba(205,213,232,0.035)'; x.lineWidth=1;
  for(let s=0;s<2;s++){ const o=((vh>>(s*6))&63)/63*cs; x.beginPath(); x.moveTo(o-40,cs); x.lineTo(o+40,0); x.stroke(); }
  // silver-gilt inlay frame and wine corner diamonds (four quarters meet at each grout cross)
  x.strokeStyle='rgba(205,213,232,0.05)'; x.lineWidth=1.2; x.strokeRect(7,7,cs-14,cs-14);
  x.fillStyle='rgba(74,14,34,0.40)';
  for(const [ux,uy] of [[0,0],[cs,0],[0,cs],[cs,cs]]){ x.beginPath(); x.moveTo(ux,uy-22); x.lineTo(ux+22,uy); x.lineTo(ux,uy+22); x.lineTo(ux-22,uy); x.closePath(); x.fill(); }
  x.strokeStyle='rgba(205,213,232,0.06)'; x.lineWidth=1;
  for(const [ux,uy] of [[0,0],[cs,0],[0,cs],[cs,cs]]){ x.beginPath(); x.moveTo(ux,uy-22); x.lineTo(ux+22,uy); x.lineTo(ux,uy+22); x.lineTo(ux-22,uy); x.closePath(); x.stroke(); }
  if(vh%5===0){ // an inlaid eight-point star, silver on smoke
    x.save(); x.translate(cs/2,cs/2); x.fillStyle='rgba(205,213,232,0.035)'; x.beginPath();
    for(let i=0;i<16;i++){ const a=i/16*6.283, rr=i%2?14:44; x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } x.closePath(); x.fill();
    x.strokeStyle='rgba(160,48,80,0.08)'; x.stroke(); x.restore(); }
  _balTC.set(key,sp); return sp;
}
let _balMed=null, _balCh=null, _balWr=null;
function balMedallion(cx,cy){ // the dance-floor rosette under the great chandelier (replaces the sigil)
  const R=460;
  if(!inView(cx,cy,R+300)) return;
  if(!_balMed){ const c=document.createElement('canvas'); c.width=c.height=R*2; const x=c.getContext('2d'); x.translate(R,R);
    x.fillStyle='rgba(60,10,28,0.22)'; x.beginPath(); x.arc(0,0,R*0.96,0,6.283); x.fill();
    for(const [rr,a,w] of [[R*0.96,0.10,3],[R*0.9,0.05,1.5],[R*0.62,0.08,2],[R*0.3,0.07,1.5]]){ x.strokeStyle='rgba(205,213,232,'+a+')'; x.lineWidth=w; x.beginPath(); x.arc(0,0,rr,0,6.283); x.stroke(); }
    x.fillStyle='rgba(205,213,232,0.035)'; x.beginPath();
    for(let i=0;i<32;i++){ const a=i/32*6.283, rr=i%2?R*0.2:(i%4===0?R*0.88:R*0.6); x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } x.closePath(); x.fill();
    x.strokeStyle='rgba(205,213,232,0.06)'; x.lineWidth=1; x.stroke();
    x.fillStyle='rgba(120,24,56,0.18)';
    for(let i=0;i<24;i++){ const a=i/24*6.283; x.save(); x.rotate(a); x.beginPath(); x.moveTo(R*0.74,0); x.lineTo(R*0.78,-9); x.lineTo(R*0.82,0); x.lineTo(R*0.78,9); x.closePath(); x.fill(); x.restore(); }
    _balMed=c; }
  ctx.drawImage(_balMed,cx-R,cy-R);
}
function balChSprite(){ // a silver-gilt chandelier, crystals and candles — seen from below
  if(_balCh) return _balCh; const S=320, c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d'); x.translate(S/2,S/2);
  x.fillStyle='rgba(0,0,0,0.35)'; x.beginPath(); x.arc(0,0,128,0,6.283); x.fill();
  x.lineCap='round';
  for(const [rr,w,col] of [[118,6,'#1c1a24'],[118,3,'#b9c0d6'],[74,5,'#1c1a24'],[74,2.4,'#dfe4f2'],[30,8,'#1c1a24'],[30,4,'#cdd5e8']]){ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.arc(0,0,rr,0,6.283); x.stroke(); }
  for(let i=0;i<12;i++){ const a=i/12*6.283; x.strokeStyle='#1c1a24'; x.lineWidth=5; x.beginPath(); x.moveTo(Math.cos(a)*30,Math.sin(a)*30); x.quadraticCurveTo(Math.cos(a+0.25)*80,Math.sin(a+0.25)*80,Math.cos(a)*118,Math.sin(a)*118); x.stroke();
    x.strokeStyle='#aab2ca'; x.lineWidth=2; x.stroke(); }
  for(let i=0;i<36;i++){ const a=i/36*6.283, rr=i%2?98:132; const px=Math.cos(a)*rr, py=Math.sin(a)*rr;
    x.fillStyle=i%3?'#e6ecff':'#9fb2e6'; x.beginPath(); x.moveTo(px,py-6); x.lineTo(px+3,py); x.lineTo(px,py+6); x.lineTo(px-3,py); x.closePath(); x.fill(); }
  for(let i=0;i<12;i++){ const a=i/12*6.283+0.26, px=Math.cos(a)*118, py=Math.sin(a)*118;
    const g=x.createRadialGradient(px,py,0,px,py,16); g.addColorStop(0,'rgba(255,236,190,0.9)'); g.addColorStop(1,'rgba(255,200,120,0)'); x.fillStyle=g; x.fillRect(px-16,py-16,32,32);
    x.fillStyle='#fff2c0'; x.beginPath(); x.arc(px,py,3,0,6.283); x.fill(); }
  x.fillStyle='#e6ecff'; x.beginPath(); x.arc(0,0,10,0,6.283); x.fill();
  _balCh=c; return c;
}
function balWrSprite(){ // the wreck: bent rings, glass everywhere
  if(_balWr) return _balWr; const S=320, c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d'); x.translate(S/2,S/2);
  x.lineCap='round';
  for(let i=0;i<5;i++){ const a0=i*1.3, r=60+i*14; x.strokeStyle='rgba(20,18,26,0.9)'; x.lineWidth=6; x.beginPath(); x.arc(i*4-8,i*3-6,r,a0,a0+1.6+i*0.2); x.stroke();
    x.strokeStyle='rgba(170,178,202,0.55)'; x.lineWidth=2; x.stroke(); }
  for(let i=0;i<70;i++){ const a=Math.random()*6.283, d=Math.pow(Math.random(),0.7)*140, px=Math.cos(a)*d, py=Math.sin(a)*d, s=1+Math.random()*3;
    x.fillStyle=i%4?'rgba(214,224,250,0.55)':'rgba(255,255,255,0.8)'; x.beginPath(); x.moveTo(px,py-s); x.lineTo(px+s*0.6,py); x.lineTo(px,py+s); x.lineTo(px-s*0.6,py); x.closePath(); x.fill(); }
  _balWr=c; return c;
}
// world-space, under the court: the great chandelier's pool, the waltz current, wrecks, telegraphs, mirror seams
function balGround(){
  if(BAL.seq!==window._runSeq) return;
  const A=CFG.arena, C=A/2;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  if(!GFX.lite && inView(C,C,700)){ ctx.globalAlpha=0.16+Math.sin(gt*0.9)*0.02; ctx.drawImage(lightSprite(205,213,240),C-560,C-430,1120,860); }
  // mirror twins shimmer — a silver ghost under each reflection
  if(!qLow){ ctx.globalAlpha=0.85; const gs=glowSprite('rgba(205,213,240,0.6)','rgba(205,213,240,0)',24); let n=0;
    for(const m of BAL.mirrors){ if(n>40) break; if(!inView(m.x,m.y,40)) continue; n++; const rr=m.r*1.9; ctx.drawImage(gs,m.x-rr,m.y-rr*0.7,rr*2,rr*1.4); } }
  ctx.restore(); ctx.globalAlpha=1;
  for(const w of BAL.wreck){ if(!inView(w.x,w.y,200)) continue; ctx.save(); ctx.globalAlpha=Math.min(1,(20-w.t)/4)*0.85; ctx.translate(w.x,w.y); ctx.rotate(w.a); ctx.drawImage(balWrSprite(),-160,-160); ctx.restore(); }
  if(BAL.waltz){ const w=BAL.waltz, env=balEnv(w);
    ctx.save(); ctx.translate(w.x,w.y); ctx.lineCap='round';
    for(const [rr,sp] of [[200,0.9],[440,0.6],[720,0.42]]){ if(!inView(w.x,w.y,rr+60)) continue;
      ctx.strokeStyle='rgba(205,213,232,'+(0.16*env).toFixed(3)+')'; ctx.lineWidth=3; ctx.setLineDash([26,22]); ctx.lineDashOffset=-gt*sp*60*w.dir;
      ctx.beginPath(); ctx.arc(0,0,rr,0,6.283); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba(176,52,88,'+(0.34*env).toFixed(3)+')'; ctx.lineWidth=3;
    for(let i=0;i<14;i++){ const a=i/14*6.283+gt*0.6*w.dir, rr=i%2?320:580; ctx.save(); ctx.rotate(a); ctx.translate(rr,0); if(w.dir<0) ctx.scale(1,-1);
      ctx.beginPath(); ctx.moveTo(-8,-10); ctx.lineTo(4,0); ctx.lineTo(-8,10); ctx.stroke(); ctx.restore(); }
    ctx.restore(); }
  for(const c of BAL.crashes){ const p=Math.min(1,c.t/c.tel), R=c.r, late=p>0.7;
    ctx.fillStyle='rgba(0,0,0,'+(0.18+0.5*p).toFixed(3)+')'; ctx.beginPath(); ctx.arc(c.x,c.y,R*(0.55+0.45*p),0,6.283); ctx.fill();
    const pulse=0.55+0.45*Math.sin(gt*(late?34:16));
    ctx.strokeStyle='rgba(230,236,255,'+(0.5+0.4*pulse).toFixed(3)+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(c.x,c.y,R,0,6.283); ctx.stroke();
    ctx.strokeStyle='rgba(200,40,70,'+(0.45+0.4*pulse).toFixed(3)+')'; ctx.lineWidth=4; ctx.setLineDash([14,10]); ctx.lineDashOffset=gt*40;
    ctx.beginPath(); ctx.arc(c.x,c.y,R*(1.7-0.7*p),0,6.283); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle='rgba(230,236,255,0.35)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(c.x-18,c.y); ctx.lineTo(c.x+18,c.y); ctx.moveTo(c.x,c.y-18); ctx.lineTo(c.x,c.y+18); ctx.stroke(); }
  if(BAL.seam){ const s=BAL.seam, a=Math.max(0,Math.min(1,s.t/0.5,(2.4-s.t)/0.8)), W=34;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const vx=s.side===0?camX:s.side===1?camX+VW-W:camX, vy=s.side===2?camY:s.side===3?camY+VH-W:camY;
    const ww=s.side<2?W:VW, hh=s.side<2?VH:W;
    ctx.fillStyle='rgba(205,213,240,'+(0.17*a).toFixed(3)+')'; ctx.fillRect(vx,vy,ww,hh); ctx.fillStyle='rgba(205,213,240,'+(0.08*a).toFixed(3)+')'; ctx.fillRect(s.side===0?vx+W:s.side===1?vx-W:vx, s.side===2?vy+W:s.side===3?vy-W:vy, ww, hh);
    ctx.fillStyle='rgba(235,240,255,'+(0.85*a).toFixed(3)+')';
    if(s.side<2) ctx.fillRect(s.side===0?camX+W-3:camX+VW-W,camY,3,VH); else ctx.fillRect(camX,s.side===2?camY+W-3:camY+VH-W,VW,3);
    ctx.restore(); }
}
// world-space, over the court: the chandelier hanging above its circle, then falling
function balSky(){
  if(BAL.seq!==window._runSeq || !BAL.crashes.length) return;
  const sp=balChSprite();
  for(const c of BAL.crashes){ const fall=c.tel-0.45, R=c.r;
    let q=0, sc=1.35, a=0.42, oy=-30; if(c.t>fall){ q=(c.t-fall)/0.45; sc=1.35-0.35*q; a=0.42+0.58*q; oy=-30*(1-q*q); }
    const sw=c.t<fall?Math.sin(gt*5+c.ph)*0.06*(c.t/fall):0;
    ctx.save(); ctx.globalAlpha=a; ctx.translate(c.x+Math.sin(gt*5+c.ph)*6*(1-q),c.y+oy); ctx.rotate(sw+c.ph); ctx.scale(sc*R/140,sc*R/140); ctx.drawImage(sp,-160,-160); ctx.restore(); }
  ctx.globalAlpha=1;
}
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
   pips:'♥ · 👢👢👢👢👢 · 🎲🎲🎲🎲', u:()=>SEC.has('theegg'), uTxt:'FIND THE EGG', ap:()=>{ P.wlv={razor:1}; P.radius*=0.7; P.speed*=1.2; P.maxHp=60; P.hp=60; P.pickup+=24; P.yolkFate=true; }},
 // ==== D1 — THE SEATS: four souls that change HOW you play (mechanics block at the end of this file) ====
 {id:'sharp',  n:'THE CARDSHARP', g:'♣', col:'#36f08a', d:'Reads the deck: every slot shows its result BEFORE you pull — the skill and the match. Don\'t like the hand? Burn 25 coins to RE-DEAL, once per slot (R). −15 max blood.',
   pips:'♥♥ · 👢👢👢 · 🃏🃏🃏🃏🃏', u:()=>(LT.triples||0)>=3, uTxt:'LAND 3 TRIPLES', ap:()=>{ P.sharp=true; P.maxHp=Math.max(40,P.maxHp-15); P.hp=P.maxHp; }},
 {id:'martyr', n:'THE MARTYR',    g:'✝', col:'#ff2448', d:'Never heals — no regen, no leech, no fountains, no wheel mercy. Every 10% of blood missing: +6% damage, +4% fire rate (up to +54% / +36%). +40 max blood to bleed with.',
   pips:'♥♥♥♥ · 👢👢👢 · ⚔⚔⚔⚔⚔', u:()=>(LT.rites||0)>=10, uTxt:'SIT AT THE RED TABLE 10 TIMES', ap:()=>{ P.martyr=true; P.maxHp+=40; P.hp=P.maxHp; P.regen=0; P.lifesteal=0; }},
 {id:'magpie', n:'THE MAGPIE',    g:'✧', col:'#2ee6ff', d:'Pickup reach ×2.5. Every coin has a 3% chance to be a GOLDEN CHIP — grab it and a free mini-slot spins: triple = a free level, pair = a free power, bust = coins. −20% damage.',
   pips:'♥♥♥ · 👢👢👢👢 · ◈◈◈◈', u:()=>(LT.coins||0)>=5000, uTxt:'PICK UP 5,000 LIFETIME COINS', ap:()=>{ P.magpie=true; P.pickup*=2.5; P.damage*=0.8; }},
 {id:'banker', n:'THE BANKER\'S GHOST', g:'♖', col:'#c4ff4d', d:'Interest: every 60s, +8% of the coins you hold. Cash THE FEED HOT (◆◆) or richer and it pays DOUBLE that: +16% of your purse. The wheel won\'t spin for the dead — no Wheel of Souls. −10 max blood.',
   pips:'♥♥ · 👢👢👢 · ◈◈◈◈◈', u:()=>((typeof SEATS!=='undefined'&&SEATS.st.rage)||0)>=15, uTxt:'CASH THE FEED HOT OR RICHER 15 TIMES', ap:()=>{ P.banker=true; P.maxHp=Math.max(40,P.maxHp-10); P.hp=P.maxHp; }},
 {id:'twin',   n:'THE OBSIDIAN TWIN', g:'♝', col:'#d36bff', stake:true, d:'Fights beside its own shadow: +1 projectile on every shot, every dice target −1. Half a soul: −30 max blood.',
   pips:'♥ · 👢👢👢 · 🎲🎲🎲🎲🎲', u:()=>!!(typeof STK!=='undefined'&&STK.first&&STK.first[2]), uTxt:'CLEAR THE OBSIDIAN DECK', ap:()=>{ P.projectiles+=1; P.diceEase=(P.diceEase||0)+1; P.maxHp=Math.max(40,P.maxHp-30); P.hp=P.maxHp; }}
];
function curSoul(){ if(DLY_RNG && typeof dlySoul==='function') return dlySoul(); const s=SOULS.find(x=>x.id===(IDX.sl||'vesper')); return (s&&s.u())?s:SOULS[0]; }
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
      if(typeof b2AnteClick==='function' && b2AnteClick(ev)) return; // B2 stakes + adornments
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
  try{ if(typeof b2AnteHtml==='function') html+=b2AnteHtml(); }catch(e){}
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
    const SL9=SOULS.filter(s=>!s.stake); const souls=SL9.filter(s=>s.u()).length/SL9.length; // B2: stake souls are a bonus, never a debt
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
      window.addEventListener('keydown',()=>{ if(c.classList.contains('go')&&performance.now()-(c._born||0)>600) c.classList.remove('go'); });
      window.addEventListener('pointerdown',()=>{ if(c.classList.contains('go')&&performance.now()-(c._born||0)>600) c.classList.remove('go'); },true); } // B4: a thumb dismisses the tip too
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
      ll.innerHTML='<span style="color:'+s.col+'">'+s.g+' '+s.n+'</span>'+(f?' · <span style="color:'+f.col+'">'+f.g+' '+f.n+'</span>':'')+(cts?' · ✍ '+cts+' CONTRACT'+(cts>1?'S':''):'')+((typeof b2LoadoutTag==='function')?b2LoadoutTag():'')+' <i>— change</i>'; } }
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
  const h2New=(LT.runs||0)<3; // H2: a stranger's first three nights — fewer, plainer chips
  const chips=[
    (best>0&&!h2New)?['🏆','BEST '+best.toLocaleString(),'#ffd36b']:null, // H2: chips name their number (BEST NIGHT already sits over PLAY)
    idxPct()>0?['📖','INDEX '+idxPct()+'%','#c98bff']:null,
    SEC.size>0?['✦','SECRETS '+SEC.size+'/'+WHISPER_TOTAL,'#8bffd0']:null,
    _est>0?['🏛',_est+'% OF THE HOUSE'+(h2New?'':' — ranks 30 · index 20 · whispers 15 · feats 15 · pages 10 · souls&floors 10'),'#e8b64c']:null, // H2: the weights wait until night 3
    (LT.minutes||0)>=30?['⏱',((LT.minutes||0)/60).toFixed(1)+'h AT THE TABLE','#9adcff']:null,
    ...(function(){ const nx=nextArmUnlock(); if(!nx) return []; const wd=WEAPONS.find(x=>x.id===nx.id);
      return wd?[['🗡','NEW WEAPON AT RANK '+nx.thr+': '+wd.n.toUpperCase(),'#ff9a3c']]:[]; })(),
    h2New?null:['⚜','RANK '+RANK.rank+' · '+RANKS[RANK.rank-1].n,'#fff2c0'], // H2: the rank bar below already says it
    window._daily?['☀',window._daily,'#8bff9a']:null
  ].filter(Boolean);
  const tipFor=(g)=>({'🏆':'BEST NIGHT — your highest tally','📖':'THE INDEX — everything catalogued','✦':'WHISPERS — riddles answered','🏛':'THE ESTATE — how much of the House is yours · ranks 30 · index 20 · whispers 15 · feats 15 · pages 10 · souls&floors 10','🗡':'THE ARSENAL DRIP — the next blade and its rank','⚜':'HOUSE RANK — your standing tonight'})[g]||'';
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
      window._daily='DAILY BLESSING +'+bonus+' GILT · DAY '+LT.dayStreak;
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
  try{ new MutationObserver(recs=>{ if(recs.some(r=>!(r.type==='attributes'&&r.target===n))) a2LaneSoon(); }).observe(n,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true}); }catch(e){} // B4: a2Lane's own class writes on the column must not re-arm it (it re-laid-out every frame, forever)
  ['slot','gameover','wheelLayer','crashLayer','achToasts'].forEach(id=>{ const e=$(id); if(e) try{ new MutationObserver(()=>a2LaneSoon()).observe(e,{attributes:true,attributeFilter:['class'],childList:id==='achToasts'}); }catch(x){} });
  window.addEventListener('resize',()=>a2LaneSoon());
  setInterval(()=>{ if(state==='slot'||state==='wheel'||state==='crash'||state==='dead') a2LaneSoon(); },400); // B4: tables settle/scale without a class change — re-park the column a few times a second, not every frame
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
  if(modal || document.body.classList.contains('touchUI')){ if(co && co.parentNode!==n) n.appendChild(co); } // B4: on a phone the tip stacks in the column — it used to sit on top of the banner
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
  if(!m){ n.classList.add('a2play'); a2FitAnn(an, availW);
    // I1: on phones the tarot card and curse tags start below whatever the column is showing
    try{ const r=n.getBoundingClientRect(); document.documentElement.style.setProperty('--a2bot', (r.height>4?Math.round(r.bottom):0)+'px'); }catch(e){}
    return; }
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
  if(state==='crash' && typeof crash!=='undefined' && crash && crash.jk){ if(edge(14)) tcKey('keydown','ArrowLeft'); if(edge(15)) tcKey('keydown','ArrowRight'); } // B4: the d-pad walks the ascension cards
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

/* ============================================================
   D1 — THE SEATS. Four new souls (Cardsharp, Martyr, Magpie,
   Banker's Ghost), their mechanics hooks, the unlock ceremony,
   and a painted-in-code GILT NOIR portrait for EVERY soul,
   baked once to an offscreen canvas. Persistence: am_seats_v1
   (new, additive) — {seen:[soul ids already celebrated], st:{rage}}.
   ============================================================ */
const SEATS_KEY='am_seats_v1';
const SEATS={seen:null, st:{rage:0}, _ld:false};
const SEAT_OLD=['vesper','dealer','widow','debtor','brute','yolk'];
let _seatsT=null;
function seatsSaveSoon(){ clearTimeout(_seatsT); _seatsT=setTimeout(()=>{ try{ if(store) store.set(SEATS_KEY, JSON.stringify({seen:SEATS.seen||[], st:SEATS.st}), false); }catch(e){} }, 700); }
(async function seatsLoad(){
  try{ if(store){ const r=await store.get(SEATS_KEY,false);
    if(r&&r.value){ const o=JSON.parse(r.value);
      if(Array.isArray(o.seen)) SEATS.seen=o.seen.filter(x=>typeof x==='string');
      if(o.st&&typeof o.st==='object'){ SEATS.st.rage=Math.max(0,(+o.st.rage)|0); } } } }catch(e){}
  SEATS._ld=true;
})();
Object.assign(GLYPH_COL,{ soul_vesper:'#e6d9c2', soul_dealer:'#6fb7ff', soul_widow:'#c98bff', soul_debtor:'#ffd36b', soul_brute:'#ff9a3c', soul_yolk:'#fff2c0',
  soul_sharp:'#36f08a', soul_martyr:'#ff2448', soul_magpie:'#2ee6ff', soul_banker:'#c4ff4d', soul_twin:'#d36bff' });
// how close is a sealed seat? [have, need] — shown under the lock
const SOUL_PROG={
  dealer:()=>[RANK.rank,12], widow:()=>[SEC.size,12], debtor:()=>[LT.deaths||0,25], brute:()=>[LT.kills||0,2500],
  sharp:()=>[LT.triples||0,3], martyr:()=>[LT.rites||0,10], magpie:()=>[LT.coins||0,5000], banker:()=>[SEATS.st.rage||0,15],
  twin:()=>[(typeof STK!=='undefined'&&STK.first&&STK.first[2])?1:0,1] }; // B2: the OBSIDIAN DECK's soul
function _hexA(h,a){ const n=parseInt((h||'#ffffff').slice(1),16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }

/* ---------- SFX for the seats (all synthesized) ---------- */
Object.assign(SFX,{
  seatUnlock(){ tone(55,1.6,'sine',0.22,49); tone(82,1.3,'triangle',0.09,80); noise(0.6,0.05,900);
    [392,523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>{ tone(f,0.55,'sine',0.12); tone(f*2,0.2,'sine',0.03); },380+i*95));
    setTimeout(()=>{ SFX.dingBells(); SFX.chipStack(); },1000); },
  cardFlip(){ noise(0.04,0.12,4200); tone(1250,0.035,'square',0.04); setTimeout(()=>tone(1660,0.05,'sine',0.05),45); },
  riffle(){ for(let i=0;i<9;i++) setTimeout(()=>noise(0.022,0.09,3200+i*180),i*28); setTimeout(()=>SFX.cardFlip(),300); },
  stigmata(n){ tone(98-n*3,0.7,'sine',0.2,80); tone(196,0.35,'triangle',0.05,150); setTimeout(()=>tone(1046+n*60,0.25,'sine',0.05),90); },
  refuse(){ noise(0.12,0.04,700); tone(180,0.12,'sine',0.05,120); },
  chipClink(){ tone(2093,0.05,'square',0.06); setTimeout(()=>tone(2637,0.09,'sine',0.08),50); noise(0.03,0.05,5000); },
  chipTick(i){ tone(700+i*160,0.05,'square',0.05); noise(0.02,0.04,3000); },
  register(){ tone(1568,0.07,'square',0.07); setTimeout(()=>tone(2093,0.16,'sine',0.1),70); setTimeout(()=>{ noise(0.08,0.08,2400); SFX.chipStack(); },160); }
});

/* ---------- THE PORTRAITS — busts in the GILT NOIR manner ---------- */
const _PORT={}, _PORTURL={};
const SOUL_PAINT=(function(){
  const INK='#050203';
  const lg=(g,x0,y0,x1,y1,st)=>{ const r=g.createLinearGradient(x0,y0,x1,y1); st.forEach(s=>r.addColorStop(s[0],s[1])); return r; };
  const rg=(g,x,y,r0,r1,st)=>{ const r=g.createRadialGradient(x,y,r0,x,y,r1); st.forEach(s=>r.addColorStop(s[0],s[1])); return r; };
  const ink=(g,fill,lw)=>{ g.fillStyle=fill; g.fill(); g.strokeStyle=INK; g.lineWidth=lw||1.3; g.lineJoin='round'; g.stroke(); };
  function shoulders(g,fill,w){ w=w||1; const L=50-44*w, R=50+44*w;
    g.beginPath(); g.moveTo(L-4,122); g.bezierCurveTo(L,104,L+6,92,50-22*w,86); g.quadraticCurveTo(44,83,50,83); g.quadraticCurveTo(56,83,50+22*w,86);
    g.bezierCurveTo(R-6,92,R,104,R+4,122); g.closePath(); ink(g,fill,1.6); }
  function neck(g,skin,w){ w=w||1; g.beginPath(); g.moveTo(50-7*w,62); g.lineTo(50-8*w,86); g.quadraticCurveTo(50,90,50+8*w,86); g.lineTo(50+7*w,62); g.closePath(); ink(g,skin,1.1);
    g.fillStyle='rgba(30,8,12,0.35)'; g.beginPath(); g.moveTo(50-7*w,66); g.quadraticCurveTo(50,74,50+7*w,66); g.lineTo(50+7*w,62); g.lineTo(50-7*w,62); g.fill(); }
  function headPath(g,o){ const w=o.w||1, cy=o.cy||50, top=o.top||29, chin=o.chin||72;
    g.beginPath(); g.moveTo(50,top); g.bezierCurveTo(50+13*w,top,50+16*w,cy-10,50+15*w,cy); g.bezierCurveTo(50+14*w,cy+12,50+7*w,chin-1,50,chin);
    g.bezierCurveTo(50-7*w,chin-1,50-14*w,cy+12,50-15*w,cy); g.bezierCurveTo(50-16*w,cy-10,50-13*w,top,50,top); g.closePath(); }
  function head(g,skin,o){ o=o||{}; headPath(g,o); ink(g,lg(g,36,30,64,72,[[0,skin],[1,o.skin2||'#8a7464']]),1.4);
    // cheek hollows + jaw shade
    g.save(); headPath(g,o); g.clip();
    g.fillStyle=rg(g,63,58,1,16,[[0,'rgba(40,10,16,0.38)'],[1,'rgba(40,10,16,0)']]); g.fillRect(30,25,40,50);
    if(o.gaunt){ g.fillStyle='rgba(40,12,16,0.32)'; g.beginPath(); g.ellipse(41,58,3,5,0.2,0,6.283); g.ellipse(59,58,3,5,-0.2,0,6.283); g.fill(); }
    g.restore(); }
  function face(g,o){ const eyes=[]; const ey=o.ey||50, ex=o.ex||6.2, er=o.er||1.5, cx=50;
    // brows
    g.strokeStyle=o.brow||'#1a0c0e'; g.lineWidth=o.browW||1.3; g.lineCap='round';
    g.beginPath(); g.moveTo(cx-ex-4,ey-4+(o.browTilt||0)); g.quadraticCurveTo(cx-ex,ey-6,cx-ex+3.6,ey-4.2); g.moveTo(cx+ex+4,ey-4-(o.browTilt||0)); g.quadraticCurveTo(cx+ex,ey-6,cx+ex-3.6,ey-4.2); g.stroke();
    for(const sd of [-1,1]){ const x=cx+sd*ex;
      g.fillStyle='rgba(30,6,10,0.45)'; g.beginPath(); g.ellipse(x,ey+0.3,4.6,2.8,0,0,6.283); g.fill();
      g.fillStyle='#0d0406'; g.beginPath(); g.moveTo(x-3.6,ey); g.quadraticCurveTo(x,ey-2.4*(o.round||1),x+3.6,ey); g.quadraticCurveTo(x,ey+2.1*(o.round||1),x-3.6,ey); g.fill();
      g.fillStyle=o.eye; g.beginPath(); g.arc(x+(o.look||0.6),ey,er,0,6.283); g.fill();
      g.fillStyle='#fff8e0'; g.beginPath(); g.arc(x+(o.look||0.6)-0.5,ey-0.5,0.45,0,6.283); g.fill();
      eyes.push([x+(o.look||0.6),ey,o.eye]); }
    // nose
    if(!o.noNose){ g.strokeStyle='rgba(40,12,14,0.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(cx+0.6,ey+1); g.quadraticCurveTo(cx+2.2,ey+7,cx+0.4,ey+8.6); g.quadraticCurveTo(cx-1,ey+9,cx-2,ey+8.2); g.stroke(); }
    // lips
    const ly=o.ly||ey+13; g.fillStyle=o.lip||'#6a1820'; g.beginPath(); g.moveTo(cx-4.4,ly); g.quadraticCurveTo(cx,ly-1.6+(o.smirk||0),cx+4.4,ly-(o.smirk||0)); g.quadraticCurveTo(cx,ly+2.4,cx-4.4,ly); g.fill();
    g.strokeStyle='rgba(20,4,8,0.7)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(cx-4.4,ly); g.quadraticCurveTo(cx,ly+0.3,cx+4.4,ly-(o.smirk||0)); g.stroke();
    return eyes; }
  function lapels(g,col){ g.beginPath(); g.moveTo(39,86); g.lineTo(50,110); g.lineTo(61,86); g.lineTo(56,84); g.lineTo(50,97); g.lineTo(44,84); g.closePath(); ink(g,col,1); }
  function buttons(g,col,y0,n){ g.fillStyle=col; for(let i=0;i<n;i++){ g.beginPath(); g.arc(50,y0+i*7,1.2,0,6.283); g.fill(); } }
  function brimHat(g,o){ // wide brim + crown + band
    const y=o.y||31, rx=o.rx||33, top=o.top||12;
    g.beginPath(); g.ellipse(50,y,rx,o.ry||6.5,o.tilt||0,0,6.283); ink(g,o.col,1.4);
    g.beginPath(); g.moveTo(50-14,y); g.bezierCurveTo(50-16,top+6,50-12,top,50,top); g.bezierCurveTo(50+12,top,50+16,top+6,50+14,y); g.closePath(); ink(g,o.col2||o.col,1.4);
    if(o.band){ g.fillStyle=o.band; g.beginPath(); g.moveTo(36,y-1); g.lineTo(36.6,y-5.4); g.quadraticCurveTo(50,y-7,63.4,y-5.4); g.lineTo(64,y-1); g.quadraticCurveTo(50,y+0.6,36,y-1); g.fill(); }
    g.strokeStyle='rgba(255,240,210,0.22)'; g.lineWidth=0.8; g.beginPath(); g.ellipse(50,y-0.6,rx-2,(o.ry||6.5)-2,o.tilt||0,3.5,5.6); g.stroke(); }
  function hairBack(g,col,o){ o=o||{}; g.beginPath(); g.moveTo(34,44); g.bezierCurveTo(30,30,40,24,50,24); g.bezierCurveTo(60,24,70,30,66,44);
    g.bezierCurveTo(68,o.len||66,66,(o.len||66)+6,60,(o.len||66)+4); g.lineTo(40,(o.len||66)+4); g.bezierCurveTo(34,(o.len||66)+6,32,o.len||66,34,44); g.closePath(); ink(g,col,1.3); }

  const P_={
    vesper(g){ hairBack(g,'#1a0c10',{len:64});
      shoulders(g,lg(g,0,84,0,120,[[0,'#b0202f'],[0.5,'#7a1020'],[1,'#3a060d']]));
      neck(g,'#d9c8b4'); lapels(g,'#120609');
      g.fillStyle='#e6d9c2'; g.beginPath(); g.moveTo(46,85); g.lineTo(50,93); g.lineTo(54,85); g.closePath(); g.fill(); // cravat
      buttons(g,'#e8b64c',100,3);
      head(g,'#efe2cf'); const e=face(g,{eye:'#ff9a3c', lip:'#9a1a26'});
      g.beginPath(); g.moveTo(35,44); g.quadraticCurveTo(38,34,50,33); g.quadraticCurveTo(44,38,40,50); g.quadraticCurveTo(37,46,35,44); ink(g,'#1a0c10',0.9); // fringe
      brimHat(g,{col:'#0e0609', col2:'#140a0d', band:'#e8b64c', y:32, rx:34, top:11, tilt:-0.06});
      g.beginPath(); g.moveTo(62,27); g.bezierCurveTo(70,18,78,10,86,6); g.bezierCurveTo(82,14,74,22,64,29); g.closePath(); ink(g,lg(g,62,28,86,6,[[0,'#7a1020'],[1,'#ff3a4a']]),1); // the red feather
      g.strokeStyle='rgba(255,200,200,0.5)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(63,28); g.quadraticCurveTo(74,17,85,7); g.stroke();
      return e; },
    dealer(g){ shoulders(g,lg(g,0,84,0,120,[[0,'#1e2332'],[1,'#07080d']]));
      neck(g,'#d6c6b2');
      g.beginPath(); g.moveTo(41,86); g.lineTo(50,112); g.lineTo(59,86); g.closePath(); ink(g,'#e6e0d4',1); // shirt
      g.beginPath(); g.moveTo(36,88); g.lineTo(47,110); g.lineTo(42,120); g.lineTo(28,120); g.closePath(); ink(g,'#2a3550',1); // waistcoat
      g.beginPath(); g.moveTo(64,88); g.lineTo(53,110); g.lineTo(58,120); g.lineTo(72,120); g.closePath(); ink(g,'#2a3550',1);
      g.beginPath(); g.moveTo(50,88); g.lineTo(43,84.5); g.lineTo(43,91.5); g.closePath(); g.moveTo(50,88); g.lineTo(57,84.5); g.lineTo(57,91.5); g.closePath(); ink(g,'#0a0a10',0.8); // bow tie
      g.beginPath(); g.moveTo(50,95); g.lineTo(52,98); g.lineTo(50,101); g.lineTo(48,98); g.closePath(); ink(g,'#6fb7ff',0.6); // diamond pin
      for(let i=0;i<3;i++){ g.save(); g.translate(78,104); g.rotate(-0.5+i*0.32); g.beginPath(); g.rect(-5,-16,10,14); ink(g,'#f2ece0',0.8);
        g.fillStyle=i===1?'#c0182a':'#0a0a10'; g.font='7px serif'; g.textAlign='center'; g.fillText(['♠','♦','♣'][i],0,-7); g.restore(); }
      head(g,'#e7d7c2'); const e=face(g,{eye:'#6fb7ff', lip:'#6a2a30', smirk:0.8});
      g.strokeStyle='#120a0c'; g.lineWidth=1.1; g.beginPath(); g.moveTo(45.5,61); g.quadraticCurveTo(50,59.5,54.5,61); g.stroke(); // pencil moustache
      g.beginPath(); g.moveTo(35,42); g.bezierCurveTo(35,28,44,25,50,25); g.bezierCurveTo(58,25,66,28,65,42); g.quadraticCurveTo(58,33,50,33); g.quadraticCurveTo(42,33,35,42); ink(g,'#0e0a0c',1.1); // slicked hair
      g.fillStyle='rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(45,30,6,1.4,-0.3,0,6.283); g.fill();
      g.beginPath(); g.moveTo(34,37); g.quadraticCurveTo(50,33,66,37); g.lineTo(66,40); g.quadraticCurveTo(50,36,34,40); g.closePath(); ink(g,'#1a2a40',0.9); // visor band
      g.beginPath(); g.moveTo(32,39); g.quadraticCurveTo(50,34,68,39); g.quadraticCurveTo(62,47,50,47); g.quadraticCurveTo(38,47,32,39); g.closePath(); g.fillStyle='rgba(111,183,255,0.42)'; g.fill(); g.strokeStyle=INK; g.lineWidth=1.1; g.stroke();
      return e; },
    widow(g){ g.beginPath(); g.ellipse(50,30,15,11,0,0,6.283); ink(g,'#120a16',1.2); // the updo
      shoulders(g,lg(g,0,84,0,120,[[0,'#2c1840'],[1,'#07040a']]),0.92);
      neck(g,'#e4d6cc',0.9);
      for(let i=0;i<9;i++){ const a=Math.PI*(0.12+i*0.095); g.beginPath(); g.ellipse(50+Math.cos(a)*-13,82-Math.sin(a)*3.5+4,3.4,6,a-1.57,0,6.283); ink(g,'#1c1026',0.6); } // high lace ruff
      g.strokeStyle='rgba(201,139,255,0.35)'; g.lineWidth=0.5; for(let i=0;i<7;i++){ g.beginPath(); g.moveTo(38+i*4,80); g.lineTo(39+i*4,90); g.stroke(); }
      // moth brooch
      g.fillStyle='#c98bff'; g.beginPath(); g.ellipse(46,101,4.2,3,-0.5,0,6.283); g.ellipse(54,101,4.2,3,0.5,0,6.283); g.fill();
      g.fillStyle='#7a4aa8'; g.beginPath(); g.ellipse(46.5,104,2.6,2,0.4,0,6.283); g.ellipse(53.5,104,2.6,2,-0.4,0,6.283); g.fill();
      g.fillStyle='#e8b64c'; g.beginPath(); g.ellipse(50,102,1.1,3.4,0,0,6.283); g.fill();
      head(g,'#f0e4dc',{w:0.94}); const e=face(g,{eye:'#c98bff', lip:'#4a1838', ex:5.8});
      g.beginPath(); g.moveTo(36,46); g.bezierCurveTo(34,30,44,27,50,27); g.bezierCurveTo(56,27,66,30,64,46); g.quadraticCurveTo(60,35,50,34); g.quadraticCurveTo(40,35,36,46); ink(g,'#120a16',1); // parted hair
      // the veil: a mesh over brow and eyes
      g.save(); g.beginPath(); g.moveTo(32,33); g.quadraticCurveTo(50,26,68,33); g.lineTo(67,57); g.quadraticCurveTo(50,62,33,57); g.closePath();
      g.fillStyle='rgba(12,4,18,0.42)'; g.fill(); g.clip(); g.strokeStyle='rgba(201,139,255,0.22)'; g.lineWidth=0.4;
      for(let i=-6;i<12;i++){ g.beginPath(); g.moveTo(26+i*4,26); g.lineTo(46+i*4,62); g.stroke(); g.beginPath(); g.moveTo(46+i*4,26); g.lineTo(26+i*4,62); g.stroke(); }
      g.restore();
      g.beginPath(); g.ellipse(60,27,9,4,0.35,0,6.283); ink(g,'#1a0e22',1); // the pillbox
      g.fillStyle='#c98bff'; g.beginPath(); g.arc(65,25,1.4,0,6.283); g.fill();
      return e; },
    debtor(g){ shoulders(g,lg(g,0,84,0,120,[[0,'#5a4420'],[1,'#1e1508']]));
      neck(g,'#cdbb9e',0.9); lapels(g,'#2a1e0e');
      g.beginPath(); g.moveTo(45,85); g.lineTo(50,96); g.lineTo(55,85); g.closePath(); ink(g,'#c9bc9e',0.8);
      g.strokeStyle='#8a7a5a'; g.lineWidth=0.5; for(let i=0;i<6;i++){ g.beginPath(); g.moveTo(22+i*3,100+i*2); g.lineTo(26+i*3,104+i*2); g.stroke(); } // threadbare darn
      // the chain and padlock
      g.strokeStyle='#9a8048'; g.lineWidth=1.3; for(let i=0;i<9;i++){ const t=i/8, x=38+t*24, y=86+Math.sin(t*Math.PI)*16; g.beginPath(); g.ellipse(x,y,1.8,1.1,t*2,0,6.283); g.stroke(); }
      g.beginPath(); g.rect(46.5,103,7,6); ink(g,'#b08a3a',0.8); g.strokeStyle='#b08a3a'; g.lineWidth=1.2; g.beginPath(); g.arc(50,103,2.4,Math.PI,0); g.stroke();
      head(g,'#e2d2b8',{gaunt:true, skin2:'#7a6a52'}); const e=face(g,{eye:'#ffd36b', lip:'#5a2a22', browTilt:1.2});
      g.fillStyle='rgba(30,20,14,0.5)'; for(let i=0;i<26;i++){ g.fillRect(42+((i*37)%17),63+((i*13)%7),0.6,0.6); } // stubble
      g.strokeStyle='#d8b24a'; g.lineWidth=1.1; g.beginPath(); g.arc(56.8,50,4.6,0,6.283); g.stroke(); g.strokeStyle='rgba(216,178,74,0.7)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(61,52); g.quadraticCurveTo(66,66,62,84); g.stroke(); // monocle
      // battered top hat
      g.beginPath(); g.ellipse(50,33,24,4.6,0.05,0,6.283); ink(g,'#16110c',1.3);
      g.beginPath(); g.moveTo(37,33); g.lineTo(38,8); g.quadraticCurveTo(44,10,48,6); g.lineTo(62,8); g.lineTo(63,33); g.closePath(); ink(g,'#1e1812',1.3);
      g.strokeStyle='rgba(0,0,0,0.6)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(48,7); g.lineTo(47,16); g.stroke();
      g.fillStyle='#6b5320'; g.fillRect(37.6,27,25,3.6);
      return e; },
    brute(g){ shoulders(g,lg(g,0,84,0,120,[[0,'#5a3218'],[1,'#1c0e06']]),1.18);
      for(const sd of [-1,1]){ g.beginPath(); g.ellipse(50+sd*34,96,15,10,sd*0.35,0,6.283); ink(g,lg(g,0,86,0,106,[[0,'#8a929c'],[1,'#3a3f46']]),1.4); // iron pauldrons
        for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(50+sd*(26+k*7),90-k*1.5); g.lineTo(50+sd*(28+k*7),76-k*3); g.lineTo(50+sd*(31+k*7),89-k*1.5); g.closePath(); ink(g,'#c9c2b4',0.8); } }
      neck(g,'#c4987a',1.5);
      g.beginPath(); g.rect(38,74,24,7); ink(g,'#4a4f56',1.2); g.fillStyle='#9aa2ac'; for(let i=0;i<5;i++){ g.beginPath(); g.arc(40.5+i*4.75,77.5,0.9,0,6.283); g.fill(); } // iron collar
      head(g,'#d0a688',{w:1.18, top:27, chin:73, skin2:'#6a4a36'}); const e=face(g,{eye:'#ff9a3c', lip:'#5a2018', ex:6.8, browW:2.6, brow:'#2a140c', browTilt:-1});
      g.strokeStyle='rgba(255,170,150,0.85)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(41,41); g.lineTo(45.5,58); g.stroke(); // the scar
      g.strokeStyle='rgba(90,30,20,0.6)'; g.lineWidth=0.5; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(41.5+i*1.1,45+i*3.5); g.lineTo(44.5+i*1.1,44+i*3.5); g.stroke(); }
      g.fillStyle='rgba(255,240,220,0.16)'; g.beginPath(); g.ellipse(45,33,8,3,-0.3,0,6.283); g.fill(); // bald sheen
      return e; },
    yolk(g){ shoulders(g,lg(g,0,90,0,120,[[0,'#2a2014'],[1,'#0a0806']]),0.7);
      for(const sd of [-1,1]){ g.beginPath(); g.moveTo(50,86); g.lineTo(50+sd*24,74); g.lineTo(50+sd*30,98); g.lineTo(50+sd*10,94); g.closePath(); ink(g,'#3a2c1a',1.1); } // a collar three sizes too big
      neck(g,'#f0e2a8',0.7);
      g.beginPath(); g.ellipse(50,62,14,15,0,0,6.283); ink(g,lg(g,38,48,62,78,[[0,'#fff4c8'],[1,'#c9b070']]),1.4);
      const eyes=[]; for(const sd of [-1,1]){ const x=50+sd*5.6;
        g.fillStyle='#0d0406'; g.beginPath(); g.arc(x,62,3.6,0,6.283); g.fill();
        g.fillStyle='#ffe066'; g.beginPath(); g.arc(x+0.5,62,2,0,6.283); g.fill();
        g.fillStyle='#fffbe8'; g.beginPath(); g.arc(x-0.6,60.8,0.8,0,6.283); g.fill(); eyes.push([x+0.5,62,'#ffe066']); }
      g.fillStyle='#8a3a20'; g.beginPath(); g.ellipse(50,70.5,2,1.3,0,0,6.283); g.fill(); // a small round 'o'
      g.fillStyle='rgba(255,140,120,0.25)'; g.beginPath(); g.ellipse(41,67,2.6,1.6,0,0,6.283); g.ellipse(59,67,2.6,1.6,0,0,6.283); g.fill();
      // the cracked shell cap
      g.beginPath(); g.moveTo(35,55); g.bezierCurveTo(35,38,44,33,50,33); g.bezierCurveTo(56,33,65,38,65,55);
      const zz=[[62,52],[59,56],[56,51],[53,55],[50,50],[47,55],[44,51],[41,56],[38,52]]; zz.forEach(p=>g.lineTo(p[0],p[1])); g.closePath(); ink(g,lg(g,40,34,60,56,[[0,'#fffaf0'],[1,'#d8ccb4']]),1.3);
      g.strokeStyle='rgba(120,100,70,0.6)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(45,38); g.lineTo(47,43); g.lineTo(45,46); g.stroke();
      return eyes; },
    sharp(g){ shoulders(g,lg(g,0,84,0,120,[[0,'#16201a'],[1,'#050906']]));
      neck(g,'#d8c6ae');
      g.beginPath(); g.moveTo(40,86); g.lineTo(50,104); g.lineTo(60,86); g.closePath(); ink(g,'#e6e0d4',0.9);
      g.beginPath(); g.moveTo(33,90); g.lineTo(47,110); g.lineTo(44,121); g.lineTo(26,121); g.closePath(); ink(g,lg(g,0,90,0,120,[[0,'#2bd07a'],[1,'#0a4a28']]),1); // emerald waistcoat
      g.beginPath(); g.moveTo(67,90); g.lineTo(53,110); g.lineTo(56,121); g.lineTo(74,121); g.closePath(); ink(g,lg(g,0,90,0,120,[[0,'#2bd07a'],[1,'#0a4a28']]),1);
      g.strokeStyle='#0a0a0a'; g.lineWidth=1.2; g.beginPath(); g.moveTo(47,88); g.lineTo(50,99); g.lineTo(53,88); g.stroke(); // string tie
      g.strokeStyle='#e8b64c'; g.lineWidth=0.7; g.beginPath(); g.moveTo(36,108); g.quadraticCurveTo(42,114,46,110); g.stroke(); // watch chain
      // the fan — five cards at the shoulder, ace of clubs on top
      for(let i=0;i<5;i++){ g.save(); g.translate(20,110); g.rotate(-0.75+i*0.22); g.beginPath(); g.rect(-5.5,-21,11,15); ink(g,'#f4eee2',0.8);
        g.fillStyle=(i%2)?'#c0182a':'#0a0a10'; g.font='8px serif'; g.textAlign='center'; g.fillText(['♠','♥','♦','♥','♣'][i],0,-11); g.restore(); }
      g.beginPath(); g.ellipse(22,113,6,4.5,0.3,0,6.283); ink(g,'#d8c6ae',1); // fingertips on the fan
      head(g,'#e8d6bf',{w:0.96}); const e=face(g,{eye:'#36f08a', lip:'#6a2a26', smirk:1.6, browTilt:1.4, look:1.1});
      g.strokeStyle='#120a08'; g.lineWidth=1.2; g.beginPath(); g.moveTo(44,61.5); g.quadraticCurveTo(47,59.5,50,60.6); g.quadraticCurveTo(53,59.5,56,61.5); g.quadraticCurveTo(58,62.5,58.6,60.8); g.moveTo(44,61.5); g.quadraticCurveTo(42,62.5,41.4,60.8); g.stroke(); // curled moustache
      g.fillStyle='#120a08'; g.beginPath(); g.moveTo(48.6,68); g.lineTo(50,73); g.lineTo(51.4,68); g.fill(); // goatee
      // flat-brim gambler's hat, a card in the band
      g.beginPath(); g.ellipse(50,32,30,5.2,0.08,0,6.283); ink(g,'#0c140f',1.4);
      g.beginPath(); g.moveTo(37,32); g.lineTo(38,17); g.quadraticCurveTo(50,13,62,17); g.lineTo(63,32); g.closePath(); ink(g,'#121c16',1.4);
      g.fillStyle='#36f08a'; g.fillRect(37.4,26.5,25.2,3.4);
      g.save(); g.translate(58,22); g.rotate(0.35); g.beginPath(); g.rect(-3.4,-6,6.8,9); ink(g,'#f4eee2',0.7); g.fillStyle='#0a0a10'; g.font='6px serif'; g.textAlign='center'; g.fillText('♣',0,0.6); g.restore();
      return e; },
    martyr(g){ g.beginPath(); g.ellipse(50,44,25,25,0,0,6.283); g.strokeStyle='rgba(255,36,72,0.75)'; g.lineWidth=1.6; g.stroke(); // the crimson halo
      g.strokeStyle='rgba(255,36,72,0.3)'; g.lineWidth=4; g.stroke();
      hairBack(g,'#2a1810',{len:72});
      shoulders(g,lg(g,0,84,0,120,[[0,'#e6d9c2'],[1,'#6b5d4c']]),0.98);
      g.strokeStyle='rgba(90,70,50,0.55)'; g.lineWidth=0.8; [[30,92,36,120],[40,90,42,120],[60,90,58,120],[70,92,64,120],[50,94,50,120]].forEach(l=>{ g.beginPath(); g.moveTo(l[0],l[1]); g.quadraticCurveTo((l[0]+l[2])/2+3,(l[1]+l[3])/2,l[2],l[3]); g.stroke(); }); // shroud folds
      g.fillStyle=rg(g,56,104,1,15,[[0,'rgba(160,12,32,0.95)'],[0.6,'rgba(139,22,32,0.6)'],[1,'rgba(139,22,32,0)']]); g.beginPath(); g.ellipse(56,104,16,14,0,0,6.283); g.fill(); // the wound blooms
      neck(g,'#d8c8b8',0.9);
      head(g,'#e6d8c8',{gaunt:true, w:0.92, skin2:'#7a6656'}); const e=face(g,{eye:'#ff2448', lip:'#5a1a22', ex:5.8, browTilt:-1.6});
      g.strokeStyle='#b0102a'; g.lineWidth=1; for(const sd of [-1,1]){ g.beginPath(); g.moveTo(50+sd*5.8,52.5); g.quadraticCurveTo(50+sd*6.6,58,50+sd*6,64); g.stroke(); g.fillStyle='#b0102a'; g.beginPath(); g.arc(50+sd*6,64.5,0.9,0,6.283); g.fill(); } // blood tears
      g.beginPath(); g.moveTo(37,46); g.bezierCurveTo(36,32,44,28,50,28); g.bezierCurveTo(56,28,64,32,63,46); g.quadraticCurveTo(57,34,50,36); g.quadraticCurveTo(43,34,37,46); ink(g,'#2a1810',1); // lank parted hair
      // the crown of thorns
      g.strokeStyle='#3a2414'; g.lineWidth=1.8; g.beginPath(); g.ellipse(50,35,16,4.2,0,0,6.283); g.stroke();
      g.strokeStyle='#5a3a20'; g.lineWidth=0.9; g.beginPath(); g.ellipse(50,34.4,16.5,3.6,0.08,0,6.283); g.stroke();
      g.strokeStyle='#2a1a0c'; g.lineWidth=0.8; for(let i=0;i<14;i++){ const a=i/14*6.283, x=50+Math.cos(a)*16, y=35+Math.sin(a)*4.2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a+1)*3.2,y-2.4-Math.abs(Math.sin(a))*1.4); g.stroke(); }
      g.fillStyle='#b0102a'; g.beginPath(); g.arc(44,39.5,0.8,0,6.283); g.arc(57,40,0.7,0,6.283); g.fill();
      return e; },
    magpie(g){ hairBack(g,'#0a0a10',{len:60});
      shoulders(g,'#0a0a10');
      // the feather mantle — black and white quills, a cyan sheen
      for(let i=0;i<13;i++){ const t=i/12, x=10+t*80, y=92+Math.abs(t-0.5)*-14; g.beginPath(); g.moveTo(x-5,y+12); g.lineTo(x,y-6-((i%2)*4)); g.lineTo(x+5,y+12); g.closePath(); ink(g,(i%3===1)?'#e8e8f0':'#0e0e18',0.8);
        if(i%3!==1){ g.strokeStyle='rgba(46,230,255,0.55)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(x-1.6,y+8); g.lineTo(x,y-3); g.stroke(); } }
      neck(g,'#dccab8',0.85);
      // a necklace of stolen things
      g.strokeStyle='#c9b78e'; g.lineWidth=0.5; g.beginPath(); g.moveTo(38,86); g.quadraticCurveTo(50,104,62,86); g.stroke();
      [['#ffd36b',40,90,2],['#ff3a5a',44,95,1.6],['#e6e6f0',48,98,2.2],['#2ee6ff',52,98,1.7],['#8bff9a',56,95,1.6],['#ffd36b',60,90,1.8]].forEach(b=>{ g.beginPath(); g.arc(b[1],b[2],b[3],0,6.283); ink(g,b[0],0.6); });
      g.strokeStyle='#ffd36b'; g.lineWidth=0.8; g.beginPath(); g.arc(50,103,2.6,0,6.283); g.stroke(); // a ring, not hers
      head(g,'#ecdcca',{w:0.95}); const e=face(g,{eye:'#2ee6ff', lip:'#5a2030', smirk:1.2, look:-0.6});
      // the domino mask
      g.beginPath(); g.moveTo(37,47); g.quadraticCurveTo(43,43,48.5,47); g.quadraticCurveTo(50,48.5,51.5,47); g.quadraticCurveTo(57,43,63,47); g.quadraticCurveTo(64,53,58,54); g.quadraticCurveTo(53,54,50,51.5); g.quadraticCurveTo(47,54,42,54); g.quadraticCurveTo(36,53,37,47); g.closePath();
      g.fillStyle='#0a0a12'; g.fill('evenodd'); g.strokeStyle='rgba(46,230,255,0.7)'; g.lineWidth=0.8; g.stroke();
      for(const sd of [-1,1]){ const x=50+sd*6.2; g.fillStyle='#2ee6ff'; g.beginPath(); g.arc(x-0.6,50,1.5,0,6.283); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(x-1.1,49.5,0.45,0,6.283); g.fill(); }
      g.beginPath(); g.moveTo(35,46); g.bezierCurveTo(33,30,44,26,50,26); g.bezierCurveTo(58,26,67,30,65,46); g.quadraticCurveTo(60,32,52,33); g.quadraticCurveTo(42,33,35,46); ink(g,'#0a0a10',1);
      g.strokeStyle='#f0f0f8'; g.lineWidth=1.6; g.beginPath(); g.moveTo(55,28); g.quadraticCurveTo(60,32,62,40); g.stroke(); // the white streak
      g.strokeStyle='#ffd36b'; g.lineWidth=0.9; g.beginPath(); g.arc(35.4,58,2.2,0,6.283); g.stroke(); // hoop earring
      return e; },
    banker(g){ shoulders(g,lg(g,0,84,0,120,[[0,'#26341a'],[1,'#0a1006']]));
      neck(g,'#cfdcc0',0.9);
      g.beginPath(); g.moveTo(40,84); g.lineTo(46,92); g.lineTo(50,86); g.lineTo(54,92); g.lineTo(60,84); g.lineTo(55,80); g.lineTo(45,80); g.closePath(); ink(g,'#eef4e2',0.9); // starched wing collar
      g.beginPath(); g.moveTo(46,88); g.quadraticCurveTo(50,100,54,88); g.quadraticCurveTo(50,92,46,88); ink(g,'#2a3a1a',0.8); // cravat
      lapels(g,'#141c0c'); buttons(g,'#9ab06a',103,2);
      // a ledger under the arm
      g.save(); g.translate(80,104); g.rotate(-0.2); g.beginPath(); g.rect(-9,-12,18,22); ink(g,'#3a2a14',1); g.fillStyle='#c4ff4d'; g.fillRect(-9,-4,18,1.6); g.restore();
      head(g,'#d6e4c8',{gaunt:true, skin2:'#6a7a5a'}); const e=face(g,{eye:'#c4ff4d', lip:'#3a4a2a', er:1.1, round:1.2});
      for(const sd of [-1,1]){ g.beginPath(); g.moveTo(50+sd*14.5,44); g.quadraticCurveTo(50+sd*17,58,50+sd*9,64); g.quadraticCurveTo(50+sd*12,54,50+sd*13,44); g.closePath(); ink(g,'#b8bcae',0.8); } // grey mutton chops
      g.strokeStyle='#c4ff4d'; g.lineWidth=0.7; g.beginPath(); g.arc(43.8,50,3.4,0,6.283); g.moveTo(59.6,50); g.arc(56.2,50,3.4,0,6.283); g.moveTo(47.2,50); g.lineTo(52.8,50); g.stroke(); // pince-nez
      g.beginPath(); g.moveTo(59.6,51); g.quadraticCurveTo(66,62,61,78); g.stroke();
      // a tall top hat
      g.beginPath(); g.ellipse(50,32,22,4.4,0,0,6.283); ink(g,'#0c1208',1.3);
      g.beginPath(); g.moveTo(38,32); g.lineTo(37,4); g.quadraticCurveTo(50,1.5,63,4); g.lineTo(62,32); g.closePath(); ink(g,'#121a0c',1.3);
      g.fillStyle='#c4ff4d'; g.fillRect(37.8,25.5,24.4,3.2);
      g.fillStyle='rgba(220,255,180,0.14)'; g.fillRect(40,6,3,18);
      // the ghost fades out at the waist
      g.globalCompositeOperation='destination-out'; g.fillStyle=lg(g,0,92,0,121,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,0.92)']]); g.fillRect(0,88,100,34); g.globalCompositeOperation='source-over';
      return e; }
  };
  return P_;
})();
function soulPortrait(id, locked){
  const key=id+(locked?'_L':''); if(_PORT[key]) return _PORT[key];
  const S=2, W=100, H=120, s=SOULS.find(x=>x.id===id)||SOULS[0], col=s.col;
  const mk=()=>{ const c=document.createElement('canvas'); c.width=W*S; c.height=H*S; const g=c.getContext('2d'); g.scale(S,S); return [c,g]; };
  const [fc,f]=mk(); let eyes=[];
  try{ eyes=(SOUL_PAINT[id]||SOUL_PAINT.vesper)(f)||[]; }catch(e){ eyes=[]; }
  // light it: rim on the right in the soul's color, candle key on the left, falloff toward the hem
  const edge=(dx,dy,fill)=>{ const [ec,eg]=mk(); eg.setTransform(1,0,0,1,0,0); eg.drawImage(fc,0,0); eg.globalCompositeOperation='destination-out'; eg.drawImage(fc,dx*S,dy*S);
    eg.globalCompositeOperation='source-in'; eg.fillStyle=fill; eg.fillRect(0,0,W*S,H*S); return ec; };
  const rim=edge(-2.2,0.8,_hexA(col,locked?0.95:0.8)), keyL=edge(1.6,1.2,'rgba(255,232,190,0.55)');
  f.save(); f.setTransform(1,0,0,1,0,0); f.globalCompositeOperation='source-atop';
  if(locked){ f.fillStyle='#07030a'; f.fillRect(0,0,W*S,H*S); }
  else { const sh=f.createLinearGradient(0,0,W*S,H*S); sh.addColorStop(0,'rgba(255,220,170,0.10)'); sh.addColorStop(0.55,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.42)'); f.fillStyle=sh; f.fillRect(0,0,W*S,H*S);
    const hem=f.createLinearGradient(0,96*S,0,H*S); hem.addColorStop(0,'rgba(0,0,0,0)'); hem.addColorStop(1,'rgba(0,0,0,0.6)'); f.fillStyle=hem; f.fillRect(0,0,W*S,H*S); }
  f.globalCompositeOperation='source-over'; f.drawImage(rim,0,0); if(!locked) f.drawImage(keyL,0,0); f.restore();
  // the cameo
  const [c,g]=mk();
  g.save(); g.beginPath(); g.ellipse(50,60,46,57,0,0,6.283); g.clip();
  let bg=g.createRadialGradient(50,40,2,50,52,72); bg.addColorStop(0,locked?'#1c0d14':'#3a1520'); bg.addColorStop(0.55,locked?'#0d0609':'#1a0a10'); bg.addColorStop(1,'#050203'); g.fillStyle=bg; g.fillRect(0,0,W,H);
  bg=g.createRadialGradient(50,46,2,50,46,40); bg.addColorStop(0,_hexA(col,locked?0.14:0.3)); bg.addColorStop(1,_hexA(col,0)); g.fillStyle=bg; g.fillRect(0,0,W,H);
  if(!locked){ bg=g.createRadialGradient(22,28,1,22,28,30); bg.addColorStop(0,'rgba(255,196,120,0.22)'); bg.addColorStop(1,'rgba(255,196,120,0)'); g.fillStyle=bg; g.fillRect(0,0,W,H);
    g.fillStyle='#fff2c0'; g.beginPath(); g.ellipse(14,40,1.1,2.4,0,0,6.283); g.fill(); g.fillStyle='#e6d9c2'; g.fillRect(13.2,42,1.6,10); } // a candle in the dark
  { let sd=0; for(let i=0;i<id.length;i++) sd=(sd*31+id.charCodeAt(i))>>>0; const rnd9=()=>((sd=(sd*1103515245+12345)>>>0)/4294967296);
    g.fillStyle='rgba(255,255,255,0.035)'; for(let i=0;i<140;i++) g.fillRect(rnd9()*W,rnd9()*H,0.5,0.5); } // velvet stipple
  g.drawImage(fc,0,0,W,H);
  g.globalCompositeOperation='lighter';
  for(const e of eyes){ const r=g.createRadialGradient(e[0],e[1],0,e[0],e[1],5.5); r.addColorStop(0,_hexA(e[2],0.8)); r.addColorStop(1,_hexA(e[2],0)); g.fillStyle=r; g.fillRect(e[0]-6,e[1]-6,12,12); }
  g.globalCompositeOperation='source-over';
  bg=g.createRadialGradient(50,56,30,50,60,62); bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(1,'rgba(0,0,0,0.78)'); g.fillStyle=bg; g.fillRect(0,0,W,H);
  if(locked){ g.fillStyle=_hexA(col,0.9); g.font="700 16px 'Cinzel',serif"; g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',50,104); }
  g.restore();
  // the gilt frame
  const fr=g.createLinearGradient(0,0,W,H); if(locked){ fr.addColorStop(0,'#3a2a14'); fr.addColorStop(0.5,'#7a5a2a'); fr.addColorStop(1,'#2a1c0c'); } else { fr.addColorStop(0,'#7a5a1c'); fr.addColorStop(0.35,'#ffd36b'); fr.addColorStop(0.6,'#a07828'); fr.addColorStop(1,'#fff2c0'); }
  g.strokeStyle='#120804'; g.lineWidth=5; g.beginPath(); g.ellipse(50,60,46.5,57.5,0,0,6.283); g.stroke();
  g.strokeStyle=fr; g.lineWidth=3; g.stroke();
  g.strokeStyle=locked?'rgba(120,90,40,0.4)':'rgba(255,242,192,0.55)'; g.lineWidth=0.6; g.beginPath(); g.ellipse(50,60,44.4,55.4,0,0,6.283); g.stroke();
  for(const yy of [2.8,117.2]){ g.beginPath(); g.moveTo(50,yy-3); g.lineTo(53,yy); g.lineTo(50,yy+3); g.lineTo(47,yy); g.closePath(); g.fillStyle=fr; g.fill(); g.strokeStyle='#120804'; g.lineWidth=0.6; g.stroke(); }
  _PORT[key]=c; return c;
}
function soulPortraitURL(id, locked){ const key=id+(locked?'_L':''); if(_PORTURL[key]) return _PORTURL[key];
  try{ _PORTURL[key]=soulPortrait(id,locked).toDataURL('image/png'); }catch(e){ _PORTURL[key]=''; } return _PORTURL[key]; }
function soulPortraitImg(id, cls, locked){ const u=soulPortraitURL(id,locked); return u?'<img class="'+(cls||'soulPort')+'" src="'+u+'" alt="" draggable="false">':''; }

/* ---------- THE ANTE ROOM — soul cards wear their portraits ---------- */
{ const _rar=renderAnteRoom;
  renderAnteRoom=function(){ _rar.apply(this,arguments);
    try{ const row=document.querySelector('#anteBody .soulRow'); if(!row) return;
      const cur=curSoul(); let html='';
      SOULS.forEach(s=>{ const un=s.u(), on=cur.id===s.id;
        if(un) html+='<div class="soulCard d1'+(on?' on':'')+'" data-id="'+s.id+'" style="--sc:'+s.col+'">'+soulPortraitImg(s.id,'soulPort')
          +'<div class="soulTx"><div class="soulN"><span class="soulGi">'+s.g+'</span> '+s.n+'</div><div class="soulD">'+s.d+'</div>'+(s.pips?'<div class="soulPips">'+s.pips+'</div>':'')+(on?'<div class="soulPick">— AT THE TABLE —</div>':'')+'</div></div>';
        else { const pr=SOUL_PROG[s.id]?SOUL_PROG[s.id]():null; const pct=pr?Math.min(100,Math.floor(pr[0]/pr[1]*100)):0;
          html+='<div class="soulCard d1 locked" style="--sc:'+s.col+'" title="'+s.uTxt.replace(/"/g,'&quot;')+'">'+soulPortraitImg(s.id,'soulPort',true)
          +'<div class="soulTx"><div class="soulN">'+s.n+'</div><div class="soulD">🔒 '+s.uTxt+'</div>'
          +(pr?'<div class="soulProg"><i style="width:'+pct+'%"></i></div><div class="soulProgT">'+Math.min(pr[0],pr[1]).toLocaleString()+' / '+pr[1].toLocaleString()+'</div>':'<div class="soulProgT">THE HOUSE WILL NOT SAY</div>')+'</div></div>'; } });
      row.innerHTML=html; row.classList.add('d1seats');
    }catch(e){} };
}

/* ---------- THE INDEX — a SEATS section (rows for ranks.js' sec()) ---------- */
function soulIdxRows(){ return SOULS.map(s=>[s.u(), s.g, s.n+'|'+s.d.replace(/"/g,'&quot;'), s.col]); }

/* ---------- THE UNLOCK CEREMONY ---------- */
const _seatQ=[];
function seatSweep(){
  if(!SEATS._ld || typeof RANK==='undefined' || !RANK._ld) return;
  if(!SEATS.seen){ SEATS.seen=SOULS.filter(s=>SEAT_OLD.includes(s.id)&&s.u()).map(s=>s.id); if(!SEATS.seen.includes('vesper')) SEATS.seen.push('vesper'); seatsSaveSoon(); }
  let ch=false;
  SOULS.forEach(s=>{ if(!SEATS.seen.includes(s.id) && s.u()){ SEATS.seen.push(s.id); _seatQ.push(s.id); ch=true; } });
  if(ch) seatsSaveSoon();
  seatPump();
}
function seatPump(){
  if(!_seatQ.length || window._seatBusy) return;
  if(state!=='menu' && state!=='dead' && state!=='playing') return setTimeout(seatPump,1500);
  const id=_seatQ.shift(), s=SOULS.find(x=>x.id===id); if(!s) return;
  window._seatBusy=true;
  let t=document.getElementById('soulToast');
  if(!t){ t=document.createElement('div'); t.id='soulToast'; document.body.appendChild(t);
    t.addEventListener('click',()=>{ t.classList.remove('go'); }); }
  t.style.setProperty('--sc', s.col);
  t.innerHTML=soulPortraitImg(s.id,'stPort')+'<div class="stTx"><div class="stH">✦ A NEW SOUL TAKES A SEAT ✦</div><div class="stN">'+s.g+' '+s.n+'</div><div class="stD">'+s.d+'</div><div class="stF">'+(s.uTxt?'EARNED: '+s.uTxt+' · ':'')+'CHOOSE THEM IN THE ANTE ROOM</div></div>';
  t.classList.remove('go'); void t.offsetWidth; t.classList.add('go');
  try{ SFX.seatUnlock(); flash(0.5,s.col); coinRain(state==='playing'?10:22); domConfetti(36,'coinRain'); if(state!=='playing') sparkBurstAt('soulToast','coinRain',28); }catch(e){}
  try{ announce('✦ '+s.n+' — UNSEALED ✦', true); }catch(e){}
  setTimeout(()=>{ t.classList.remove('go'); window._seatBusy=false; setTimeout(seatPump,500); }, state==='playing'?5200:7000);
}
{ const _rc=renderChips; renderChips=function(){ const r=_rc.apply(this,arguments); try{ seatSweep(); }catch(e){} return r; }; }

/* ---------- THE MECHANICS — one tick from update(), a few wrappers ---------- */
function soulTick(dt){
  if(!P) return;
  // the ledger notices new seats mid-run, too
  { const n=performance.now(); if(n-(window._seatSwT||0)>4000){ window._seatSwT=n; try{ seatSweep(); }catch(e){} } }
  if(P.martyr){
    P.regen=0; P.lifesteal=0; P.onKillHeal=0;
    const rev=(P.revived?1:0)+(P.phUsed?1:0)+(P.markerUsed?1:0);
    if(P._mRev!==rev || P._mCap===undefined){ P._mRev=rev; P._mCap=P.hp; } // resurrection is not healing
    if(P.hp>P._mCap+0.01){ const dh=P.hp-P._mCap; P.hp=P._mCap;
      if(dh>=2 && performance.now()-(P._mRefT||0)>1600){ P._mRefT=performance.now(); ftext(P.x,P.y-34,'✝ REFUSED','#ff2448'); try{ SFX.refuse(); }catch(e){} } }
    P._mCap=P.hp;
    const st=Math.max(0,Math.min(9,Math.floor((1-P.hp/Math.max(1,P.maxHp))*10+1e-6))), o=P._mSt||0;
    if(st!==o){ const fd=(1+0.06*st)/(1+0.06*o), fr=(1+0.04*st)/(1+0.04*o);
      P.damage*=fd; P.fireRate*=fr; if(P._ovD!==undefined) P._ovD*=fd; if(P._ovR!==undefined) P._ovR*=fr;
      P._mSt=st;
      if(st>o){ const rn=['','I','II','III','IV','V','VI','VII','VIII','IX'][st];
        showStreak('✝ STIGMATA '+rn+' — +'+(st*6)+'% DMG · +'+(st*4)+'% FIRE ✝'); try{ SFX.stigmata(st); }catch(e){}
        flash(0.18+st*0.03,'#8b1620'); ring(P.x,P.y,60+st*8,'#ff2448'); if(st>=5) shake=Math.min(16,shake+st); } } }
  if(P.magpie){ for(const c of coins){ if(!c._d1){ c._d1=1; if(rng('loot')<0.03) c.gold=1; } } }
  if(P.banker){ P._bkT=(P._bkT||0)+dt;
    if(P._bkT>=55 && !P._bkW){ P._bkW=1; ftext(P.x,P.y-40,'♖ INTEREST IN 5…','#c4ff4d'); try{ tone(1318,0.06,'sine',0.05); }catch(e){} }
    if(P._bkT>=60){ P._bkT-=60; P._bkW=0;
      const gain=P.coins>0?Math.max(1,Math.round(P.coins*0.08)):0;
      if(gain>0){ P.coins+=gain; LT.coins+=gain; try{ bump('runCoins',P.coins); bump('ltCoins',LT.coins); }catch(e){}
        announce('♖ INTEREST ACCRUES — +'+gain+' COINS ♖', true); try{ SFX.register(); }catch(e){}
        coinRain(Math.min(30,6+Math.floor(gain/4))); ftext(P.x,P.y-36,'+'+gain+' ◈','#c4ff4d',true); flash(0.22,'#c4ff4d');
        P._bkPaid=(P._bkPaid||0)+gain; }
      else { announce('♖ NOTHING TO COMPOUND ♖', false); try{ SFX.refuse(); }catch(e){} } } }
}
// world overlay — the Magpie's golden chips, the Martyr's bleeding halo
function soulDrawWorld(){
  if(!P) return;
  if(P.magpie){ for(const c of coins){ if(!c.gold || !inView(c.x,c.y,40)) continue;
    const sp=Math.abs(Math.cos(gt*3+c.x*0.05)), w=8*(0.4+0.6*sp);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(46,230,255,0.25)'; ctx.beginPath(); ctx.arc(c.x,c.y,14+Math.sin(gt*8)*2,0,6.283); ctx.fill(); ctx.restore();
    ctx.fillStyle='#1a0408'; ctx.beginPath(); ctx.ellipse(c.x,c.y,w+1.4,9.4,0,0,6.283); ctx.fill();
    ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.ellipse(c.x,c.y,w,8,0,0,6.283); ctx.fill();
    ctx.fillStyle='#b0122a'; ctx.beginPath(); ctx.ellipse(c.x,c.y,w*0.7,5.6,0,0,6.283); ctx.fill();
    ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.ellipse(c.x,c.y,w*0.3,2.6,0,0,6.283); ctx.fill(); } }
  if(P.martyr && (P._mSt||0)>0){ const st=P._mSt;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,36,72,'+(0.08+st*0.035+Math.sin(gt*5)*0.04)+')'; ctx.lineWidth=1.5+st*0.25;
    ctx.beginPath(); ctx.arc(P.x,P.y-2,30+Math.sin(gt*3)*2,0,6.283); ctx.stroke(); ctx.restore(); }
}
// THE MAGPIE'S GOLDEN CHIP — a free three-reel mini-slot that never stops the night
const _chipQ=[];
function magpieChip(c){
  try{ SFX.chipClink(); }catch(e){} ring(c.x,c.y,40,'#2ee6ff'); burst(c.x,c.y,10,'#ffd36b'); ftext(c.x,c.y-20,'✧ GOLDEN CHIP','#2ee6ff');
  LT.chips=(LT.chips||0)+1;
  _chipQ.push(1); if(!window._chipBusy) chipSpin();
}
function chipSpin(){
  if(!_chipQ.length){ window._chipBusy=false; return; } _chipQ.shift(); window._chipBusy=true;
  const seq=window._runSeq;
  let el=document.getElementById('chipSlot');
  if(!el){ el=document.createElement('div'); el.id='chipSlot'; el.innerHTML='<div class="csH">✧ GOLDEN CHIP ✧</div><div class="csR"><b></b><b></b><b></b></div><div class="csO"></div>'; document.body.appendChild(el); }
  const SY=['7','♠','♥','♦','♣','◈','★'], u=rng('slot');
  const kind=u<0.12?3:(u<0.47?2:0);
  const fin = kind===3 ? ['7','7','7'] : (()=>{ const a=SY[(Math.random()*SY.length)|0]; if(kind===2){ const o=SY.filter(x=>x!==a); return [a,a,o[(Math.random()*o.length)|0]]; } const sh=SY.slice().sort(()=>Math.random()-0.5); return [sh[0],sh[1],sh[2]]; })();
  const reels=[...el.querySelectorAll('.csR b')]; reels.forEach(r=>{ r.className=''; });
  el.querySelector('.csO').textContent=''; el.classList.remove('win3','win2','bust'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  let stopped=0; const iv=setInterval(()=>{ reels.forEach((r,i)=>{ if(i>=stopped) r.textContent=SY[(Math.random()*SY.length)|0]; }); },55);
  [480,760,1060].forEach((ms,i)=>setTimeout(()=>{ stopped=i+1; reels[i].textContent=fin[i]; reels[i].className='st'; try{ SFX.chipTick(i); }catch(e){}
    if(i===1 && fin[0]===fin[1]){ try{ SFX.tingle(); }catch(e){} reels[2].className='antici'; } },ms));
  setTimeout(()=>{ clearInterval(iv);
    if(window._runSeq!==seq || !P || state==='dead' || state==='menu'){ el.classList.remove('go'); window._chipBusy=false; _chipQ.length=0; return; }
    const out=el.querySelector('.csO');
    if(kind===3){ el.classList.add('win3'); out.textContent='TRIPLE SEVENS — A FREE LEVEL';
      pending.push({}); announce('✧ GOLDEN CHIP — 7 7 7 — A FREE LEVEL ✧', true); try{ SFX.jackpot(); SFX.dingBells(); }catch(e){}
      coinRain(26); flash(0.45,'#2ee6ff'); shake=Math.min(16,shake+7); }
    else if(kind===2){ el.classList.add('win2'); let txt='A FREE POWER'; try{ txt=grantMiniPower()||txt; }catch(e){}
      out.textContent='PAIR — '+txt; announce('✧ CHIP PAIR — '+String(txt).toUpperCase()+' ✧', true); try{ SFX.dingBells(); SFX.casinoDing(); }catch(e){}
      coinRain(12); flash(0.3,'#2ee6ff'); }
    else { el.classList.add('bust'); const g=8+((rng('drop')*8)|0); P.coins+=g; LT.coins+=g; out.textContent='BUST — +'+g+' COINS';
      try{ SFX.coinPling(); }catch(e){} ftext(P.x,P.y-30,'+'+g+' ◈','#ffd36b'); }
    setTimeout(()=>{ el.classList.remove('go'); setTimeout(chipSpin,260); }, 1300);
  }, 1200);
}
// THE CARDSHARP — the tell is dealt when the machine opens; the reels obey it
function sharpDeal(pool, redeal){
  if(!P||!P.sharp) { window._sharpTell=null; return; }
  if(!redeal) window._sharpRedealt=false;
  window._sharpPool=pool;
  const u=rng('slot'), pB=MFATE.P+(P.yolkFate?0.03:0);
  const n = P.coldDeck ? 1 : (u<MFATE.T ? 3 : (u<MFATE.T+pB ? 2 : 1));
  const d=weightedByRarity(pool, slotWeights());
  window._sharpTell={n, s:d.id};
  sharpShow();
}
function sharpShow(){
  const t=window._sharpTell; if(!t||slotStage!=='ready') return;
  const defs=slotKind==='weapon'?WEAPONS:PASSIVES, d=defs.find(x=>x.id===t.s); if(!d) return;
  const n=(slotFloor&&t.n<2)?2:t.n;
  const lvTxt = n>=3 ? 'TRIPLE — MAX LEVEL' : (n===2 ? 'PAIR — +2 LEVELS' : 'SINGLE — +1 LEVEL');
  $('cardName').textContent=d.n; $('cardName').className='r-'+d.rar; $('cardName').style.color='';
  $('cardDesc').innerHTML='<div class="ofsub sharpTell">♣ THE TELL: '+lvTxt+'</div><div class="ofsub">'+projFx(d, skLevel(d)+1)+'</div>';
  flarePayRow(d.rar);
  const can=!window._sharpRedealt;
  $('gambleMsg').innerHTML='<span class="keyhint">SPACE</span> take the hand'+(can?' · <span class="keyhint">R</span> re-deal · 25 ◈':' · <span style="color:#8a7c66">the deck is cut</span>');
  const m=$('machine'); if(m){ m.classList.remove('sharpFlip'); void m.offsetWidth; m.classList.add('sharpFlip'); }
}
function sharpBtn(){
  if(!P||!P.sharp||slotStage!=='ready') return null;
  const can=!window._sharpRedealt, rich=(P.coins||0)>=25;
  const b=makeBtn('♣ RE-DEAL', 'sharpBtn'+(can&&rich?'':' dim'), can?(rich?'25 ◈ · R':'NEED 25 ◈'):'ONCE PER SLOT', ()=>sharpRedeal());
  return b;
}
function sharpRedeal(){
  if(!P||!P.sharp||slotStage!=='ready'||!window._sharpPool) return;
  if(window._sharpRedealt){ try{ SFX.thud(); }catch(e){} return; }
  if((P.coins||0)<25){ try{ SFX.bust(); }catch(e){} announce('♣ THE HOUSE WANTS 25 COINS TO RE-DEAL ♣', false); return; }
  P.coins-=25; window._sharpRedealt=true;
  try{ SFX.riffle(); }catch(e){} flash(0.25,'#36f08a'); sparkBurst(14);
  sharpDeal(window._sharpPool, true); showSlotButtons();
}
window.addEventListener('keydown',e=>{ try{ if(state==='slot' && slotStage==='ready' && P && P.sharp && (e.key||'').toLowerCase()==='r' && !e.repeat){ e.preventDefault(); sharpRedeal(); } }catch(err){} });
// THE BANKER'S GHOST — no wheel for the dead; THE FEED pays a dividend. Every HOT-or-richer cash counts toward his seat (key name 'rage' kept).
{ const _tw=tickWheelTok; tickWheelTok=function(dt){ if(P&&P.banker){ wheelTok=null; return; } return _tw.apply(this,arguments); }; }
{ const _ow=openWheel; openWheel=function(){ if(P&&P.banker){ announce('♖ THE WHEEL WILL NOT SPIN FOR THE DEAD ♖', false); return; } return _ow.apply(this,arguments); }; }
{ const _cr=cashRage; cashRage=function(){ const good=P&&(P.ovTier||0)>=2, purse=P?P.coins:0; const r=_cr.apply(this,arguments);
    if(good){ SEATS.st.rage=(SEATS.st.rage||0)+1; seatsSaveSoon();
      if(P.banker){ const g=Math.max(10,Math.round(purse*0.16)); P.coins+=g; LT.coins+=g;
        setTimeout(()=>{ announce('♖ THE DIVIDEND — +'+g+' COINS ♖', true); try{ SFX.register(); }catch(e){} coinRain(Math.min(34,10+Math.floor(g/4))); flash(0.3,'#c4ff4d'); }, 500); } }
    return r; }; }

/* ==== C1 — THE PAIRINGS: colors + the evolved relic ==== */
Object.assign(GLYPH_COL, {
  ossuary:'#e9ff70', stacked:'#ff3d6e', cuts:'#7ff6ff', eye:'#ffe14d', ratking:'#b4ff3a',
  maiden:'#6f8cff', hand:'#ff1f3d', cremat:'#ff7a1a', garden:'#ff4fd8', russian:'#ffb020'
});
{ const _rr=renderRelics;
  renderRelics=function(){ const r=_rr.apply(this, arguments);
    try{ if(P && P.evo){ const bw=$('relicsW'); const owned9=WEAPONS.filter(w=>(P.wlv[w.id]||0)>0);
      owned9.forEach((w,i)=>{ const pid=P.evo[w.id]; const d=bw&&bw.children[i]; if(!pid||!d) return; const pr=PAIRINGS.find(x=>x.id===pid); if(!pr) return;
        d.classList.add('c1evo'); d.style.color=GLYPH_COL[pid]||'#ffd36b';
        d.innerHTML=iconSvg(pid)+'<span class="lvpips c1pip">♛</span>';
        relicTip(d, pr.n, '♛', projFx(pr,1)); }); } }catch(e){}
    return r; }; }

/* ==== E2 — THE HOUSE'S BOOK OF DEBTS ======================================
   A menu door that maps everything left to win, chapter by chapter, with the
   live progress of each seal; TONIGHT'S DEBTS pins the three nearest; the
   death ledger tallies the single nearest one. Every condition and number is
   READ from the real tables (SOULS / SOUL_PROG / FLOORS / STAKES / PAIRINGS /
   MAJOR_ARCANA / BOSS_DEFS / RUN_CONTRACTS / CT_SLOT_COST / RANKS / DLY) —
   unlock text like "5,000 LIFETIME KILLS" is parsed for its target.
   Persistence: NEW additive key am_book_v1 {seen:[paid entry ids], dsMax}.
   Read-only toward every other system.
   ========================================================================== */
const E2_KEY='am_book_v1';
const E2={seen:null, dsMax:0, _ld:false, snap:null, fresh:[], _t:null, waxRung:false};
const E2_NIGHT_MIN=15; // B2: the night is won by standing at 15:00 (the end of the House's reign)
(async function e2Load(){
  try{ if(store){ const r=await store.get(E2_KEY,false);
    if(r&&r.value){ const o=JSON.parse(r.value);
      if(Array.isArray(o.seen)) E2.seen=o.seen.filter(x=>typeof x==='string');
      E2.dsMax=Math.max(0,(+o.dsMax)|0); } } }catch(e){}
  E2._ld=true;
})();
function e2Save(){ clearTimeout(E2._t); E2._t=setTimeout(()=>{ try{ if(store) store.set(E2_KEY, JSON.stringify({v:1, seen:E2.seen||[], dsMax:E2.dsMax||0}), false); }catch(e){} }, 400); }
const e2Num=s=>+String(s).replace(/,/g,'');
const e2Fmt=n=>Math.floor(n).toLocaleString();
function e2Esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function e2StakeAny(n){ try{ for(const k in (STK.best||{})) if(STK.best[k]>=n) return true; }catch(e){} return false; }
// unlock text → [have, need, unit]; the target number comes from the table's own words
const E2_RX=[
 [/HOUSE RANK (\d+)/,            n=>[RANK.rank, n, 'RANK']],
 [/DIE ([\d,]+) TIMES/,          n=>[LT.deaths||0, n, 'DEATHS']],
 [/([\d,]+) LIFETIME KILLS/,     n=>[LT.kills||0, n, 'KILLS']],
 [/([\d,]+) LIFETIME COINS/,     n=>[LT.coins||0, n, 'COINS']],
 [/SPIN ([\d,]+) SLOTS/,         n=>[LT.spins||0, n, 'SPINS']],
 [/MEET THE HOUSE (\d+) TIMES/,  n=>[LT.houseMet||0, n, 'MEETINGS']],
 [/MEET THE HOUSE ONCE/,         ()=>[LT.houseMet||0, 1, 'MEETING']],
 [/SURVIVE (\d+):(\d+)/,         (m,s)=>[REC.minutes||0, m+s/60, 'MINUTES']],
 [/CLEAR STAKE (\d)/,            n=>[e2StakeAny(n)?1:0, 1, 'CLEAR']],
 [/ANSWER (\d+) WHISPERS/,       n=>[SEC.size, n, 'WHISPERS']],
 [/(\d+) TRIPLES/,               n=>[LT.triples||0, n, 'TRIPLES']],
 [/RED TABLE (\d+) TIMES/,       n=>[LT.rites||0, n, 'RITES']],
 [/FEED HOT OR RICHER (\d+) TIMES/,   n=>[(typeof SEATS!=='undefined'&&SEATS.st.rage)||0, n, 'CASH-OUTS']]
];
function e2Parse(txt){
  let best=null;
  String(txt||'').toUpperCase().split(/\(?\bOR\b\)?/).forEach(alt=>{
    for(const [rx,f] of E2_RX){ const m=alt.match(rx); if(!m) continue;
      try{ const r=f(...m.slice(1).map(e2Num)); if(!best || r[0]/r[1]>best[0]/best[1]) best=r; }catch(e){} break; } });
  return best;
}
function e2Mk(o){
  o.done=!!o.done; o.need=Math.max(1e-9,+o.need||1); o.have=Math.max(0,+o.have||0);
  o.pct=o.done?1:Math.max(0,Math.min(0.999,o.have/o.need));
  // a rank gate is measured in MARKS (rank 1 of 12 is not 8% of the way there)
  if(!o.done && o.unit==='RANK' && typeof rkCum==='function'){ try{ o.pct=Math.max(0,Math.min(0.999,RANK.marks/Math.max(1,rkCum(Math.round(o.need))))); }catch(e){} }
  return o;
}
function e2PT(e){ // the live progress text
  if(e.pt) return e.pt;
  if(e.done) return 'PAID';
  if(e.unit==='RANK') return 'RANK '+e2Fmt(e.have)+' / '+e2Fmt(e.need);
  return e2Fmt(Math.min(e.have,e.need))+' / '+e2Fmt(e.need)+(e.unit?' '+e.unit:'');
}
/* ---------- the chapters, read live from the tables ---------- */
function e2Chapters(){
  const C=[];
  const ch=(id,n,g,col,entries,note)=>{ C.push({id,n,g,col,entries:entries||[],note:note||''}); };
  // I — SOULS
  try{ ch('souls','SOULS','♠','#e6d9c2', SOULS.map(s=>{ const done=!!s.u();
      const pp=(typeof SOUL_PROG!=='undefined'&&SOUL_PROG[s.id])?SOUL_PROG[s.id]():null, px=e2Parse(s.uTxt);
      const pr=pp||px;
      return e2Mk({id:'soul:'+s.id, g:s.g, col:s.col, n:s.n, port:s.id, cond:s.uTxt||'SEATED FROM THE FIRST NIGHT',
        have:pr?pr[0]:(done?1:0), need:pr?pr[1]:1, unit:(px&&px[2])||(s.stake?'CLEAR':''), done}); })); }catch(e){}
  // II — FLOORS
  try{ if(typeof FLOORS!=='undefined') ch('floors','FLOORS','♣','#8fd977', FLOORS.map(f=>{ const done=!!f.u(), pr=e2Parse(f.uTxt);
      return e2Mk({id:'floor:'+f.id, g:f.g, col:f.col, n:f.n, cond:f.uTxt||'OPEN FROM THE FIRST NIGHT', have:pr?pr[0]:(done?1:0), need:pr?pr[1]:1, unit:pr?pr[2]:'', done}); })); }catch(e){}
  // III — STAKES (per soul)
  try{ if(typeof STAKES!=='undefined' && typeof STK!=='undefined'){
    const E=[e2Mk({id:'stake:win', g:STAKES[1].g, col:STAKES[1].col, n:'BEAT THE NIGHT', cond:'STAND AT '+E2_NIGHT_MIN+':00 — THE '+STAKES[1].name+' OPENS FOR EVERY SOUL',
      have:REC.minutes||0, need:E2_NIGHT_MIN, unit:'MINUTES', done:(STK.won||0)>0})];
    SOULS.forEach(s=>{ const best=b2BestFor(s.id), seat=!!s.u();
      for(let n=1;n<STAKES.length;n++){ const st=STAKES[n];
        E.push(e2Mk({id:'stake:'+s.id+':'+n, soul:s.id, deck:n, g:st.g, col:st.col, n:s.n+' · '+st.name, cond:'CLEAR THE '+st.name+' WITH '+s.n,
          have:0, need:1, done:best>=n, open:seat&&b2Avail(n,s.id), nopin:true})); } });
    ch('stakes','STAKES','♦','#ff2a3c',E); } }catch(e){}
  // IV — PAIRINGS (C1)
  try{ if(typeof PAIRINGS!=='undefined' && Array.isArray(PAIRINGS)){
    ch('pairings','PAIRINGS','♛','#ffd36b', PAIRINGS.map(pr=>{ const W=WEAPONS.find(w=>w.id===pr.w)||{n:pr.w}, Pd=PASSIVES.find(p=>p.id===pr.p)||{n:pr.p};
      const known=Array.isArray(IDX.pr)&&IDX.pr.indexOf(pr.id)>=0, hinted=Array.isArray(IDX.pm)&&IDX.pm.indexOf(pr.w)>=0;
      return e2Mk({id:'pair:'+pr.id, g:known?pr.g:'?', col:(typeof GLYPH_COL!=='undefined'&&GLYPH_COL[pr.id])||'#ffd36b', n:known?pr.n:'??? + ???',
        cond:known?(String(W.n).toUpperCase()+' AT MAX + '+String(Pd.n).toUpperCase()):(hinted?'“'+(pr.hint||'IT PAIRS WITH SOMETHING…')+'”':'MAX A WEAPON TO HEAR IT WHISPER'),
        have:known?2:(hinted?1:0), need:2, unit:'', pt:known?'PAID':(hinted?'ONE HALF KNOWN':'UNKNOWN'), done:known}); })); }
    else ch('pairings','PAIRINGS','♛','#ffd36b',[],'THE HOUSE HAS NOT YET PRINTED THIS CHAPTER'); }catch(e){}
  // V — MAJOR ARCANA (D4)
  try{ if(typeof MAJOR_ARCANA!=='undefined' && Array.isArray(MAJOR_ARCANA)){
    const od=(typeof ARC_ODDS!=='undefined')?('DEALT ON '+Math.round(ARC_ODDS.base*100)+'% +'+Math.round(ARC_ODDS.perMin*100)+'%/MIN (MAX '+Math.round(ARC_ODDS.cap*100)+'%) OF TAROT'):'DEALT BY CHANCE FROM THE TAROT';
    ch('arcana','MAJOR ARCANA','✦','#c98bff', MAJOR_ARCANA.map(m=>{ const got=Array.isArray(IDX.t)&&IDX.t.indexOf('MAJOR:'+m.id)>=0;
      return e2Mk({id:'arc:'+m.id, g:m.g||'✦', col:m.c||'#c98bff', n:(m.num?m.num+' · ':'')+m.n, cond:got?(m.dd||od):od, have:0, need:1, pt:got?'PAID':'NOT YET DRAWN', done:got, nopin:true}); })); }
    else ch('arcana','MAJOR ARCANA','✦','#c98bff',[],'THE HOUSE HAS NOT YET PRINTED THIS CHAPTER'); }catch(e){}
  // VI — BOSSES
  try{ if(typeof BOSS_DEFS!=='undefined'){
    ch('bosses','BOSSES','☠','#ff5560', Object.keys(BOSS_DEFS).map(k=>{ const B=BOSS_DEFS[k], met=Array.isArray(IDX.b)&&IDX.b.indexOf(k)>=0, slain=(LT.bossBy&&LT.bossBy[k])||0;
      const col=(typeof CFG!=='undefined'&&CFG.enemy&&CFG.enemy[k]&&CFG.enemy[k].col)||'#ff5560';
      if(k==='housegod') return e2Mk({id:'boss:'+k, g:B.g||'♛', col:'#ff2a3c', n:B.name, cond:'OUTLAST ITS REIGN — STAND AT '+E2_NIGHT_MIN+':00', have:REC.minutes||0, need:E2_NIGHT_MIN, unit:'MINUTES', done:(STK&&STK.won||0)>0, nopin:true});
      return e2Mk({id:'boss:'+k, g:met?(B.g||'♛'):'?', col, n:met?B.name:'??? — A BOSS UNMET', cond:met?'SLAY IT ONCE':'IT WALKS IN ON A 10TH WAVE — MEET IT, THEN SLAY IT',
        have:slain?1:(met?0.5:0), need:1, pt:slain?('PAID · SLAIN '+slain+'×'):(met?'MET · NOT YET SLAIN':'NEVER MET'), done:slain>0}); })); } }catch(e){}
  // VII — CONTRACTS
  try{ if(typeof RUN_CONTRACTS!=='undefined'){
    const E=RUN_CONTRACTS.map(c=>{ const done=!c.u||!!c.u(), pr=e2Parse(c.uTxt);
      return e2Mk({id:'ct:'+c.id, g:c.g, col:'#e6c27a', n:c.n, cond:(c.uTxt||'OPEN')+' — '+c.d, have:pr?pr[0]:(done?1:0), need:pr?pr[1]:1, unit:pr?pr[2]:'', done}); });
    if(typeof CT_SLOT_COST!=='undefined') for(let n=2;n<=CT_SLOT_COST.length;n++){ const cost=CT_SLOT_COST[n-1]; if(!cost) continue;
      E.push(e2Mk({id:'ctslot:'+n, g:'✍', col:'#ffd36b', n:(n===2?'SECOND':'THIRD')+' CONTRACT SLOT', cond:'BUY IT IN THE ANTE ROOM — '+e2Fmt(cost)+' ◈ GILT', have:gilt, need:cost, unit:'GILT', done:ctSlots()>=n,
        nopin:ctSlots()<n-1 || gilt<cost*0.25})); } // a purchase is only a marked debt once it is in reach
    ch('contracts','CONTRACTS','✍','#e6c27a',E); } }catch(e){}
  // VIII — RANK REWARDS (every 5th rank pays forever)
  try{ if(typeof RANKS!=='undefined'){ const E=[];
    for(let r=5;r<=RANKS.length;r+=5){ const rk=RANKS[r-1]; if(!rk||!rk.r) continue;
      E.push(e2Mk({id:'rank:'+r, g:r%10===0?'⚜':'✦', col:r%10===0?'#ffd36b':'#e8b64c', n:'RANK '+r+' · '+rk.n, cond:rk.r, have:RANK.marks, need:rkCum(r), unit:'MARKS', done:RANK.rank>=r})); }
    ch('ranks','RANK REWARDS','⚜','#ffd36b',E); } }catch(e){}
  // IX — DAILY STREAK (B1)
  try{ if(typeof DLY!=='undefined' && typeof dlyStreak==='function'){
    const cur=dlyStreak(); if(cur>E2.dsMax){ E2.dsMax=cur; e2Save(); }
    const paidDays=Object.values((DLY.data&&DLY.data.days)||{}).filter(d=>d&&d.done).length;
    const bonus=st=>5*Math.min(10,Math.max(0,st-1)); // mirrors daily.js dlyDeath() streak pay
    const E=[e2Mk({id:'daily:1', g:'☀', col:'#ffe14a', n:'YOUR FIRST DAILY DEBT', cond:'PLAY ONE DAILY DEBT TO ITS END — THE MENU PLAQUE', have:paidDays, need:1, unit:'DEBTS', done:paidDays>=1})];
    [2,3,5,7,11].forEach(n=>E.push(e2Mk({id:'daily:'+n, g:'☀', col:n>=7?'#ffd36b':'#ffe14a', n:'A '+n+'-DAY STREAK', cond:'PAY '+n+' DAILY DEBTS IN A ROW — +'+bonus(n)+' GILT ON EVERY DEBT', have:Math.max(cur,E2.dsMax), need:n, unit:'DAYS', done:E2.dsMax>=n})));
    ch('daily','DAILY STREAK','☀','#ffe14a',E); } }catch(e){}
  return C;
}
function e2All(C){ const a=[]; (C||e2Chapters()).forEach(c=>c.entries.forEach(e=>{ e.ch=c.id; e.chn=c.n; a.push(e); })); return a; }
function e2Owed(all){ return all.filter(e=>!e.done && !e.nopin && e.pct>0).sort((a,b)=>b.pct-a.pct); }
function e2Pins(all){
  const owed=e2Owed(all), out=[], seenCh={};
  for(const e of owed){ if(out.length>=3) break; if(seenCh[e.ch]) continue; seenCh[e.ch]=1; out.push(e); }
  for(const e of owed){ if(out.length>=3) break; if(!out.includes(e)) out.push(e); }
  if(out.length<3){ // nothing measurable yet (a fresh save): the nearest honest goals, one per chapter
    const pri=['ranks','souls','floors','stakes','bosses','contracts','daily'], rest=all.filter(e=>!e.done && !e.nopin && !out.includes(e) && !/^\?/.test(e.n))
      .sort((a,b)=>((pri.indexOf(a.ch)+99)%99)-((pri.indexOf(b.ch)+99)%99));
    for(const e of rest){ if(out.length>=3) break; if(seenCh[e.ch]) continue; seenCh[e.ch]=1; out.push(e); }
    for(const e of rest){ if(out.length>=3) break; if(!out.includes(e)) out.push(e); } }
  return out;
}
function e2Ready(){ return E2._ld && typeof RANK!=='undefined' && RANK._ld && performance.now()>2500; }
function e2NewIds(all){ if(!E2.seen) return []; return all.filter(e=>e.done && E2.seen.indexOf(e.id)<0).map(e=>e.id); }
function e2InitSeen(all){ if(E2.seen || !e2Ready()) return; E2.seen=all.filter(e=>e.done).map(e=>e.id); e2Save(); }

/* ---------- sound: leather, vellum, wax ---------- */
Object.assign(SFX,{
  e2Open(){ tone(73,0.5,'sine',0.22,55); noise(0.16,0.09,500);
    for(let i=0;i<5;i++) setTimeout(()=>noise(0.05,0.05,1800+i*700),90+i*42); // the pages riffle
    [262,330,392,523].forEach((f,i)=>setTimeout(()=>{ tone(f,0.7,'sine',0.05); tone(f*2,0.25,'sine',0.015); },320+i*70)); },
  e2Page(){ noise(0.04,0.05,2600); setTimeout(()=>noise(0.05,0.04,3400),40); tone(880,0.05,'sine',0.02); },
  e2Tick(p){ tone(320+700*p,0.05,'sine',0.045,(320+700*p)*1.02); },
  e2Wax(){ tone(150,0.14,'triangle',0.13,80); noise(0.07,0.12,900); setTimeout(()=>tone(1320,0.12,'sine',0.03),60); },
  e2Paid(){ tone(62,0.5,'sine',0.3,40); noise(0.12,0.22,1100);
    [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>{ tone(f,0.5,'sine',0.09); tone(f*1.5,0.2,'sine',0.025); },140+i*80));
    setTimeout(()=>{ try{ SFX.dingBells(); }catch(e){} },560); }
});

/* ---------- the door in the hall ---------- */
function e2Door(){
  const row=$('menuRow2'); if(!row) return;
  let b=$('e2BookBtn');
  if(!b){ b=document.createElement('button'); b.id='e2BookBtn'; b.className='btn msm e2Door';
    b.innerHTML='<span class="e2DoorT">⚖ THE BOOK OF DEBTS</span><small class="e2DoorS"></small><i class="e2Wax">NEW!</i>';
    row.insertBefore(b,row.firstChild);
    b.addEventListener('click',()=>openBook()); }
  let all=[]; try{ all=e2All(); }catch(e){ return; }
  e2InitSeen(all);
  if(!E2.seen && !e2Ready()){ clearTimeout(E2._dt); E2._dt=setTimeout(()=>{ if(state==='menu') e2Door(); },2700); }
  const nw=e2NewIds(all).length, pin=e2Owed(all)[0];
  const s=b.querySelector('.e2DoorS'); if(s) s.textContent=pin?('NEAREST: '+pin.n+' · '+Math.floor(pin.pct*100)+'%'):'EVERY DEBT IS PAID';
  b.classList.toggle('e2New', nw>0);
  const w=b.querySelector('.e2Wax'); if(w) w.textContent=nw>1?nw+' NEW!':'NEW!';
  if(nw>0 && !E2.waxRung && state==='menu'){ E2.waxRung=true; setTimeout(()=>{ try{ SFX.e2Wax(); }catch(e){} },700); }
}
{ const _rc=renderChips; renderChips=function(){ const r=_rc.apply(this,arguments); try{ e2Door(); }catch(e){} return r; }; }

/* ---------- the book ---------- */
const E2_ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
function e2Bar(p,cls){ return '<div class="e2Bar'+(cls?' '+cls:'')+'"><i style="width:'+(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%"></i></div>'; }
function e2Medal(e){
  if(e.port && typeof soulPortraitImg==='function'){ const im=soulPortraitImg(e.port,'e2Port',!e.done); if(im) return '<span class="e2Med e2MedP">'+im+'</span>'; }
  return '<span class="e2Med">'+e2Esc(e.g)+'</span>';
}
function e2Entry(e, fresh){
  const st=e.done?'paid':'sealed';
  return '<button class="e2E '+st+(fresh?' e2Fresh':'')+'" data-id="'+e2Esc(e.id)+'" style="--ec:'+e.col+'">'
    +e2Medal(e)
    +'<span class="e2Tx"><b class="e2N">'+e2Esc(e.n)+'</b><span class="e2C">'+e2Esc(e.cond)+'</span>'
    +(e.done?'':e2Bar(e.pct))+'<span class="e2Pt">'+(e.done?'✦ PAID':e2Esc(e2PT(e)))+'</span></span>'
    +(fresh?'<i class="e2Stamp">NEW!</i>':(e.done?'':'<i class="e2Seal" title="sealed"></i>'))+'</button>';
}
function e2StakeGrid(c, fresh){
  let h='<div class="e2SG"><div class="e2SGr e2SGh"><span class="e2SGs">SOUL</span>';
  for(let n=1;n<STAKES.length;n++){ const st=STAKES[n], rw=st.reward||{};
    const rwT=(rw.gilt?'+'+e2Fmt(rw.gilt)+' ◈':'')+(rw.cos&&typeof B2_COS!=='undefined'&&B2_COS[rw.cos]?' · '+B2_COS[rw.cos].n:'')+(rw.soul?' · A SOUL':'');
    h+='<span class="e2SGd" style="--dc:'+st.col+'" title="'+e2Esc(st.mod)+'"><b>'+st.g+'</b>'+e2Esc(st.name.replace(' DECK',''))+'<small>×'+st.mult+(rwT?' · '+e2Esc(rwT):'')+'</small></span>'; }
  h+='</div>';
  SOULS.forEach(s=>{ const seat=!!s.u();
    h+='<button class="e2SGr e2E'+(seat?'':' e2SGoff')+'" data-id="stakes:'+s.id+'" style="--ec:'+s.col+'"><span class="e2SGs"><i>'+s.g+'</i> '+e2Esc(s.n)+(seat?'':' <small>· SEALED</small>')+'</span>';
    for(let n=1;n<STAKES.length;n++){ const e=c.entries.find(x=>x.soul===s.id&&x.deck===n); if(!e){ h+='<span></span>'; continue; }
      const f=fresh.indexOf(e.id)>=0;
      h+='<span class="e2SGc '+(e.done?'on':(e.open?'open':'shut'))+(f?' e2Fresh':'')+'" style="--dc:'+STAKES[n].col+'" title="'+e2Esc(e.cond)+'">'+(e.done?'◆':(e.open?'◇':'·'))+'</span>'; }
    h+='</button>'; });
  return h+'<div class="e2SGk"><b style="color:#ffd36b">◆</b> CLEARED · <b>◇</b> OPEN TO PLAY · · SEALED — CLEAR THE DECK BEFORE IT WITH THAT SOUL</div></div>';
}
function e2Render(){
  const body=$('e2Body'); if(!body) return;
  const C=e2Chapters(), all=e2All(C), fresh=E2.fresh||[];
  const paid=all.filter(e=>e.done).length;
  $('e2Tot').innerHTML='<span><b>'+paid+'</b> / '+all.length+' SEALS BROKEN</span>'+e2Bar(paid/Math.max(1,all.length),'e2BarTot');
  // TONIGHT'S DEBTS
  const pins=e2Pins(all);
  let h='<div class="e2PinH">✒ TONIGHT\'S DEBTS <span>— THE NEAREST THREE · PLAY ONE MORE NIGHT</span></div><div class="e2Pins">';
  if(!pins.length) h+='<div class="e2None">♛ THE HOUSE OWES YOU NOTHING. EVERY SEAL IS BROKEN. ♛</div>';
  pins.forEach((e,i)=>{ h+='<button class="e2Pin" data-id="'+e2Esc(e.id)+'" style="--ec:'+e.col+'"><i class="e2PinN">'+E2_ROMAN[i]+'</i>'
    +e2Medal(e)+'<span class="e2Tx"><small class="e2PinC">'+e2Esc(e.chn)+'</small><b class="e2N">'+e2Esc(e.n)+'</b><span class="e2C">'+e2Esc(e.cond)+'</span>'
    +e2Bar(e.pct,'e2BarBig')+'<span class="e2Pt"><b>'+Math.floor(e.pct*100)+'%</b> · '+e2Esc(e2PT(e))+'</span></span></button>'; });
  h+='</div>';
  // the chapters
  C.forEach((c,ci)=>{ const pd=c.entries.filter(e=>e.done).length, tot=c.entries.length;
    h+='<section class="e2Ch" id="e2ch_'+c.id+'" style="--cc:'+c.col+'"><div class="e2ChH"><span class="e2Ill">'+c.n.charAt(0)+'</span>'
      +'<span class="e2ChT"><b>'+c.n.slice(1)+'</b><small>CHAPTER '+E2_ROMAN[ci]+' · '+c.g+'</small></span>'
      +'<span class="e2ChN">'+(tot?pd+' / '+tot+' PAID':'—')+(tot?e2Bar(pd/tot):'')+'</span></div>';
    if(!tot) h+='<div class="e2None">'+e2Esc(c.note)+'</div>';
    else if(c.id==='stakes'){ h+='<div class="e2Grid">'+e2Entry(c.entries[0], fresh.indexOf(c.entries[0].id)>=0)+'</div>'+e2StakeGrid(c, fresh); }
    else h+='<div class="e2Grid">'+c.entries.map(e=>e2Entry(e, fresh.indexOf(e.id)>=0)).join('')+'</div>';
    h+='</section>'; });
  body.innerHTML=h;
  const nav=$('e2Nav'); if(nav) nav.innerHTML=C.map(c=>{ const pd=c.entries.filter(e=>e.done).length;
    return '<button class="e2NavB" data-ch="'+c.id+'" style="--cc:'+c.col+'">'+c.g+' '+c.n+(c.entries.length?' <i>'+pd+'/'+c.entries.length+'</i>':'')+'</button>'; }).join('');
}
function openBook(){
  let p=$('e2Book');
  if(!p){ p=document.createElement('div'); p.id='e2Book'; p.className='layer hidden';
    p.innerHTML='<div class="panel e2P"><div class="e2Hd"><div class="e2T">⚖ THE BOOK OF DEBTS</div><div class="e2Sub">WHAT THE HOUSE STILL OWES YOU — AND WHAT IT WILL TAKE</div><div id="e2Tot"></div></div>'
      +'<div id="e2Nav"></div><div id="e2Body"></div><button class="btn" id="e2Close">Back</button></div>';
    document.body.appendChild(p);
    $('e2Close').addEventListener('click',closeBook);
    p.addEventListener('click',ev=>{ if(ev.target===p){ closeBook(); return; } });
    $('e2Nav').addEventListener('click',ev=>{ const b=ev.target.closest('.e2NavB'); if(!b) return; const sec=$('e2ch_'+b.dataset.ch), body=$('e2Body');
      if(sec&&body){ body.scrollTo({top:sec.offsetTop-body.offsetTop-4, behavior:'smooth'}); } try{ SFX.e2Page(); }catch(e){} });
    $('e2Body').addEventListener('click',ev=>{ const b=ev.target.closest('.e2E,.e2Pin'); if(!b) return;
      b.classList.remove('e2Poke'); void b.offsetWidth; b.classList.add('e2Poke');
      try{ if(b.classList.contains('paid')) SFX.uiDing(); else SFX.e2Page(); }catch(e){} });
  }
  const all=e2All();
  e2InitSeen(all);
  E2.fresh=e2NewIds(all);
  if(E2.seen){ all.forEach(e=>{ if(e.done && E2.seen.indexOf(e.id)<0) E2.seen.push(e.id); }); e2Save(); }
  e2Render();
  p.classList.remove('hidden');
  const body=$('e2Body'); if(body) body.scrollTop=0;
  try{ SFX.e2Open(); }catch(e){}
  if(E2.fresh.length){ const n=E2.fresh.length;
    setTimeout(()=>{ try{ SFX.e2Paid(); flash(0.35,'#ffd36b'); domConfetti(Math.min(60,24+n*8),'e2Book'); coinRain(Math.min(24,8+n*3));
      announce('✦ '+(n===1?'A DEBT WAS':n+' DEBTS WERE')+' PAID SINCE YOUR LAST VISIT ✦', true); }catch(e){} }, 380); }
}
function closeBook(){ const p=$('e2Book'); if(!p||p.classList.contains('hidden')) return; p.classList.add('hidden'); E2.fresh=[]; try{ renderChips(); SFX.casinoDing(); }catch(e){} }
function e2BookOpen(){ const p=$('e2Book'); return !!(p && !p.classList.contains('hidden')); }
// keys: ESC closes the book, SPACE must not deal a night from under it, B opens it from the hall
window.addEventListener('keydown',e=>{
  const k=(e.key||'').toLowerCase();
  if(e2BookOpen()){
    if(k==='escape'){ e.preventDefault(); e.stopImmediatePropagation(); if(!e.repeat) closeBook(); return; }
    if(k===' '){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    return; }
  if(k==='b' && !e.repeat && typeof state!=='undefined' && state==='menu' && !$('menu').classList.contains('hidden')
     && !document.querySelector('.layer:not(.hidden):not(#menu):not(#hud)') && !(document.activeElement&&document.activeElement.tagName==='INPUT')){ e.preventDefault(); openBook(); }
}, true);
// B3 — the pad's ring walks the book; Ⓑ closes it
try{ if(typeof B3_SCOPES!=='undefined') B3_SCOPES.splice(1,0,'#e2Book'); if(typeof B3_DEFAULT!=='undefined') B3_DEFAULT.e2Book='.e2Pin'; }catch(e){}

/* ---------- the ledger: the nearest debt, tallied ---------- */
function e2Snap(){ try{ const m={}; e2All().forEach(e=>{ m[e.id]={have:e.have, pct:e.pct, done:e.done}; }); E2.snap=m; }catch(e){ E2.snap=null; } }
// a new night = a new _runSeq (startGame is bound by reference in places, so watch the counter instead of wrapping it)
setInterval(()=>{ try{ if(window._runSeq && window._runSeq!==E2._seq){ E2._seq=window._runSeq; e2Snap(); } }catch(e){} }, 200);
function e2Ledger(){
  const rk=$('goRank'); if(!rk || !E2.snap) return;
  const old=$('e2Debt'); if(old) old.remove();
  let all=[]; try{ all=e2All(); }catch(e){ return; }
  const paid=all.filter(e=>e.done && E2.snap[e.id] && !E2.snap[e.id].done);
  const d=document.createElement('div'); d.id='e2Debt';
  if(paid.length){ const e=paid[0];
    d.className='e2Dp'; d.style.setProperty('--ec',e.col);
    d.innerHTML='<span class="e2DpS">✦ DEBT PAID ✦</span><b>'+e2Esc(e.n)+'</b><small>'+e2Esc(e.chn)+(paid.length>1?' · +'+(paid.length-1)+' MORE':'')+' · SEE THE BOOK OF DEBTS</small>';
    rk.appendChild(d);
    setTimeout(()=>{ try{ d.classList.add('go'); SFX.e2Paid(); flash(0.4,e.col); domConfetti(40,'gameover'); }catch(x){} }, 1500);
    return; }
  const e=e2Owed(all).filter(x=>x.ch!=='ranks')[0]; if(!e) return; // the rank bar right above already tells the rank story
  const s0=E2.snap[e.id]||{have:e.have,pct:e.pct}, p0=Math.min(s0.pct,e.pct), h0=Math.min(s0.have,e.have);
  d.style.setProperty('--ec',e.col);
  d.innerHTML='<div class="e2DT"><span class="e2DL">✒ NEAREST DEBT</span><b>'+e2Esc(e.n)+'</b><span class="e2DN">'+e2Esc(e2PT(Object.assign({},e,{have:h0})))+'</span></div>'
    +e2Bar(p0,'e2BarL')+'<div class="e2DC">'+e2Esc(e.cond)+'<span class="e2DG">'+(e.pct>p0+0.0005?'+'+Math.max(1,Math.round((e.pct-p0)*100))+'% TONIGHT':'')+'</span></div>';
  rk.appendChild(d);
  const bar=d.querySelector('.e2Bar i'), num=d.querySelector('.e2DN'), g=d.querySelector('.e2DG');
  if(g) g.style.opacity=0;
  if(e.pct<=p0+0.0005) return;
  const T0=performance.now()+1300, DUR=1500; let lastTick=-1;
  const step=()=>{ if(!d.isConnected) return; const q=Math.max(0,Math.min(1,(performance.now()-T0)/DUR)), qe=1-Math.pow(1-q,3);
    const p=p0+(e.pct-p0)*qe, hv=h0+(e.have-h0)*qe;
    if(bar) bar.style.width=(p*100).toFixed(2)+'%';
    if(num) num.textContent=e2PT(Object.assign({},e,{have:hv}));
    const tk=Math.floor(q*10); if(tk!==lastTick && q>0 && q<1){ lastTick=tk; try{ SFX.e2Tick(p); }catch(x){} }
    if(q<1) requestAnimationFrame(step); else { d.classList.add('go'); if(g){ g.style.opacity=1; } try{ tone(880+e.pct*400,0.25,'sine',0.06); }catch(x){} } };
  requestAnimationFrame(step);
}
{ const _ad=actuallyDie; actuallyDie=async function(){ const r=await _ad.apply(this,arguments); try{ setTimeout(e2Ledger,60); }catch(e){} return r; }; }

/* ==== H2 — FRESH EYES: the first minute speaks one language ====
   On a stranger's FIRST night, the House holds its side-bets (gilt, secrets,
   favors, bounties, dares, feats) until the first slot's lesson has landed —
   then pays them out one by one. Records only toast when there was a record
   to beat before tonight ("NEW RECORD · STREAK 2" on night one was noise). */
const H2={ held:[], ach:false, rel:0 };
function h2Hush(){
  try{ if(typeof fnOn!=='function' || !fnOn() || P._fnN!==1 || H2.rel) return false;
    if(gt>=50){ h2Release(); return false; }
    return true; }catch(e){ return false; }
}
function h2Release(){
  if(H2.rel) return; H2.rel=1;
  const q=H2.held.splice(0); let k=0;
  for(const f of q) setTimeout(()=>{ try{ f(); }catch(e){} }, 300+1300*(k++));
  if(H2.ach) setTimeout(()=>{ H2.ach=false; try{ pumpToasts(); }catch(e){} }, 300+1300*k);
}
{ const _a=announce;
  announce=function(txt, good){
    if(typeof txt==='string' && /GILT|SECRET|FAVOR|BOUNTY|DARE|INDULGENCE/.test(txt) && h2Hush()){ H2.held.push(()=>_a(txt, good)); return; }
    return _a(txt, good);
  };
  const _s=secret; // the reveal card + its banner wait too, so nothing talks over the first lesson
  secret=function(id, name){ if(h2Hush() && !SEC.has(id)){ if(!H2.held.some(f=>f._id===id)){ const f=()=>_s(id, name); f._id=id; H2.held.push(f); } return; } return _s(id, name); };
  const _p=pumpToasts;
  pumpToasts=function(){ if(h2Hush()){ H2.ach=true; return; } return _p.apply(this, arguments); };
  const _fs=fnStart;
  fnStart=function(){ H2.held.length=0; H2.ach=false; H2.rel=0; H2.s0=0;
    const r=_fs.apply(this, arguments);
    try{ for(const k in REC) if(!(REC[k]>0)) recToasted.add(k); }catch(e){} // no record yet → nothing to beat tonight
    return r; };
  // release ~9s after the first slot closes (after its "what the slot is for" tip), or at 0:50 at the latest
  setInterval(()=>{ try{ if(H2.rel || !P || !P._fnS || state!=='playing') return;
    if(!H2.s0) H2.s0=gt; if(gt>=H2.s0+9 || gt>=50){ H2.s0=0; h2Release(); } }catch(e){} }, 250);
}
/* ==== H3 — TEN MORE PAIRINGS: colors ==== */
Object.assign(GLYPH_COL, {
  chaingang:'#9b8cff', carpet:'#ff4a00', craps:'#00ff6a', shark:'#0099ff', queen:'#c050ff',
  ouro:'#00e0b0', champagne:'#ffb3d1', heart:'#ff0060', grand:'#7fd4ff', blackdeath:'#8fbf00'
});
