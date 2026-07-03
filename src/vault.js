"use strict";
/* gilt persistence (personal) */
async function loadGilt(){ try{ if(!store)return; const r=await store.get(GILT_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); gilt=o.gilt||0; best=o.best||0; } }catch(e){} }
const VAULT={ lv:{} };
const VAULT_DEFS=[
 {id:'hp',    n:'BLOODLINE',      d:'+5% max blood per seal',                    max:5, base:72,  icon:'hp'},
 {id:'dmg',   n:'SHARPER FATE',   d:'+3% damage per seal',                       max:5, base:72,  icon:'dmg'},
 {id:'fire',  n:'QUICK FINGERS',  d:'+3% fire rate per seal',                    max:5, base:80,  icon:'fire'},
 {id:'spd',   n:'FLEET BOOTS',    d:'+3% move speed per seal',                   max:5, base:64,  icon:'spd'},
 {id:'gold',  n:'GOLDEN TOUCH',   d:'+4% coin gain per seal',                    max:5, base:90,  icon:'luck'},
 {id:'pocket',n:'POCKET CHANGE',  d:'begin each run with +15 coins per seal',    max:4, base:55,  icon:'mag',   req:()=>(LT.chests||0)>=5,    reqTxt:'Open 5 of the House\'s gifts'},
 {id:'fever', n:'FEVER PITCH',    d:'fever charges +8% faster per seal',         max:5, base:110, icon:'nova',  req:()=>(LT.fevers||0)>=3,    reqTxt:'Enter Fever Mode 3 times'},
 {id:'marker',n:"MARKER'S FAVOR", d:'THE DEATH ROLL cap +2% per seal — to 60%', max:5, base:210, icon:'regen', req:()=>(LT.markers||0)>=1,   reqTxt:'Face the House Marker once'},
 {id:'credit',n:'HOUSE CREDIT',   d:'begin each run with a free slot spin per seal', max:3, base:260, icon:'cards', req:()=>(LT.bossKills||0)>=1, reqTxt:'Slay your first boss'},
 {id:'dice',  n:'LOADED DICE',    d:'every dice target lowered by 1, always',    max:1, base:640, icon:'proj',  req:()=>(LT.gods||0)>=1,      reqTxt:'Reach GOD LEVEL once'},
 {id:'wheel', n:'COURTESY SUMMONS',d:'the Wheel of Souls calls 8% sooner per seal', max:3, base:150, icon:'orbit', req:()=>(LT.wheel||0)>=3,   reqTxt:'Spin the Wheel of Souls 3 times'},
 {id:'rung',  n:'FIRST RUNG',     d:'the Ascent starts 0.12× higher per seal',   max:2, base:240, icon:'spark', req:()=>(LT.crash||0)>=3,     reqTxt:'Ride the Ascent 3 times'},
 {id:'marked',n:'MARKED CARDS',   d:'15% chance per seal a cursed tarot is redrawn', max:3, base:190, icon:'cards', req:()=>(LT.tarot||0)>=5,  reqTxt:'Read 5 tarot cards'},
 {id:'ledger',n:"HEADHUNTER'S LEDGER",d:'bounties pay +25% more coin per seal',  max:4, base:125, icon:'seeker',req:()=>(LT.bounty||0)>=5,    reqTxt:'Claim 5 bounties'},
 {id:'wick',  n:'SLOW BURN',      d:'FEVER burns +1.0s longer per seal',         max:3, base:220, icon:'chand', req:()=>(LT.fevers||0)>=5,    reqTxt:'Enter Fever Mode 5 times'},
 {id:'salt',  n:'WARDING SALT',   d:'curses run 8% shorter per seal',            max:3, base:170, icon:'aura',  req:()=>(LT.curses||0)>=10,   reqTxt:'Endure 10 curses'},
 {id:'oldbone',n:'OLD BONE',      d:'begin every run with BONE BOLT II',         max:1, base:500, icon:'bolt',  req:()=>(LT.kills||0)>=2500,  reqTxt:'2,500 lifetime kills'},
 {id:'borrow',n:'BORROWED TIME',  d:"death's-edge slow-mo lasts +0.25s per seal",max:2, base:270, icon:'scythe',req:()=>(LT.deaths||0)>=10,   reqTxt:'Die 10 times'}
];
const CONTRACTS=[
 {id:'bloodpact', n:'BLOOD PACT',      d:'Fountains pour 25% faster, forever', goal:10,   cur:()=>(LT.rites||0),     gtxt:'Last Rites ×10'},
 {id:'highroller',n:'HIGH ROLLER',     d:'Begin every run one level richer',   goal:2000, cur:()=>(LT.coins||0),     gtxt:'2,000 lifetime coins'},
 {id:'collector', n:"COLLECTOR'S DUE", d:'Bosses drop double Gilt, forever',   goal:25,   cur:()=>(LT.bossKills||0), gtxt:'Slay 25 bosses'},
 {id:'deadhand',  n:"DEAD MAN'S HAND", d:'Your first losing dice roll each run is forgiven', goal:50, cur:()=>(LT.diceWins||0), gtxt:'Win 50 dice rolls'},
 {id:'thefix',    n:'THE FIX IS IN',   d:'The CURSE wedge never holds — the Wheel ticks one past it', goal:40, cur:()=>(LT.wheel||0), gtxt:'Spin the Wheel 40 times'},
 {id:'cinder',    n:'CINDER CLAUSE',   d:'Entering FEVER detonates a golden nova (60 blood, close range)', goal:25, cur:()=>(LT.fevers||0), gtxt:'Enter Fever Mode 25 times'},
 {id:'pallbearer',n:"PALLBEARER'S TAB",d:'Bosses arrive already bleeding — a tenth of their blood gone', goal:50, cur:()=>(LT.bossKills||0), gtxt:'Slay 50 bosses'},
 {id:'dividend',  n:'GRAVE DIVIDEND',  d:'Gilded souls burst with double coin, forever', goal:50000, cur:()=>(LT.kills||0), gtxt:'50,000 lifetime kills'},
 {id:'codicil',   n:'BLOOD CODICIL',   d:'Your first miss at THE RED TABLE is forgiven, once per table, forever', goal:30, cur:()=>(LT.rites||0), gtxt:"Sit at the red table 30 times"}
];
function contractDone(id){ const c=CONTRACTS.find(x=>x.id===id); return c && c.cur()>=c.goal; }
function vlv(id){ return (VAULT.lv[id]|0); }
function vaultCost(def){ return Math.round(def.base*Math.pow(1.6, vlv(def.id))*(1-((P&&P.vaultDisc)||0))); }
function vaultUnlocked(def){ return !def.req || def.req(); }
function applyVault(){
  P.maxHp=Math.round(P.maxHp*(1+0.05*vlv('hp'))); P.hp=P.maxHp;
  P.damage*=(1+0.03*vlv('dmg'));
  P.fireRate*=(1+0.03*vlv('fire'));
  P.speed*=(1+0.03*vlv('spd'));
  P.coinMult*=(1+0.04*vlv('gold'));
  if(vlv('pocket')){ P.coins+=15*vlv('pocket'); }
  for(let i=0;i<vlv('credit');i++) pending.push({});
  P.wheelHaste=0.08*vlv('wheel');
  P.ascStart=vlv('rung');
  P.tarotLuck=0.15*vlv('marked');
  P.bountyPay=0.25*vlv('ledger');
  P.feverDur=vlv('wick');
  if(vlv('salt')) P.curseCut=(P.curseCut||1)*Math.pow(0.92,vlv('salt'));
  if(vlv('oldbone')) P.wlv.bolt=Math.max(P.wlv.bolt||1,2);
  P.slowEdge=0.25*vlv('borrow');
  if(contractDone('highroller')) pending.push({});
  if(contractDone('deadhand')) P.dmhArmed=true;
}
// mid-run purchases apply their single-level delta immediately
function applySealDelta(id){
  if(state!=='playing'&&state!=='vault') return;
  if(id==='hp'){ const a=Math.round(P.maxHp*0.06); P.maxHp+=a; P.hp+=a; }
  else if(id==='dmg') P.damage*=1.04;
  else if(id==='fire') P.fireRate*=1.03;
  else if(id==='spd') P.speed*=1.03;
  else if(id==='gold') P.coinMult*=1.06;
  else if(id==='wheel') P.wheelHaste=0.08*vlv('wheel');
  else if(id==='rung') P.ascStart=vlv('rung');
  else if(id==='marked') P.tarotLuck=0.15*vlv('marked');
  else if(id==='ledger') P.bountyPay=0.25*vlv('ledger');
  else if(id==='wick') P.feverDur=vlv('wick');
  else if(id==='salt') P.curseCut=(P.curseCut||1)*0.92;
  else if(id==='borrow') P.slowEdge=0.25*vlv('borrow');
  else if(id==='oldbone'||id==='pocket'||id==='credit') announce('◈ FROM THE NEXT DEAL ◈',true);
}
let vaultSpent=false;
function buyVault(id){
  const def=VAULT_DEFS.find(d=>d.id===id); if(!def) return;
  if(vaultSpent){ SFX.thud(); return; }
  if(!vaultUnlocked(def) || vlv(id)>=def.max) return;
  const cost=vaultCost(def); if(gilt<cost){ SFX.bust(); return; }
  gilt-=cost; VAULT.lv[id]=vlv(id)+1;
  saveGilt(); saveAch(); SFX.vaultBuy(); sparkBurst(20);
  LT.seals=(LT.seals||0)+1; bump('seals',LT.seals);
  applySealDelta(id);
  vaultSpent=true;
  renderVault();
  setTimeout(()=>{ if(state==='vault'){ $('vaultPanel').classList.add('hidden'); state='playing'; announce('◈ THE VAULT SEALS ITSELF — RETURNS IN 5 MINUTES ◈',true); SFX.reelLock(); } },1300);
}
let vaultBrowse=false; // menu window-shopping: everything visible, nothing buyable
function renderVault(){
  $('vaultGilt').textContent=gilt;
  const sub=document.querySelector('#vaultPanel .vaultSub');
  if(sub) sub.textContent = vaultBrowse ? '◈ THE DOOR MANIFESTS IN THE PIT — EVERY 5:00, ONE SEAL PER VISIT ◈' : 'PERMANENT BLESSINGS · SEALED IN GILT';
  const grid=$('vaultGrid'); let html='';
  for(const def of VAULT_DEFS){
    const lv=vlv(def.id), unlocked2=vaultUnlocked(def), maxed=lv>=def.max, cost=vaultCost(def);
    let pips=''; for(let i=0;i<def.max;i++) pips+= i<lv? '<b>◆</b>':'◇';
    html+='<div class="vCard'+(unlocked2?'':' locked')+(maxed?' maxed':'')+'">'
      +'<div class="vTop">'+iconSvg(def.icon)+'<div class="vName">'+def.n+'</div></div>'
      +'<div class="vDesc">'+def.d+'</div>'
      +'<div class="vPips">'+pips+'</div>'
      +(!unlocked2 ? '<div class="vLock">🔒 '+def.reqTxt+'</div>'
        : maxed ? '<button class="vBuy" disabled>FULLY UNSEALED</button>'
        : vaultBrowse ? '<button class="vBuy" disabled>AT THE DOOR — '+cost+' ◈</button>'
        : vaultSpent ? '<button class="vBuy" disabled>THE DOOR CLOSES</button>'
        : '<button class="vBuy" data-vid="'+def.id+'" '+(gilt<cost?'disabled':'')+'>UNSEAL — '+cost+' ◈</button>')
      +'</div>';
  }
  html+='<div class="vContractsHead">☩ CONTRACTS — fulfil the terms, keep the power forever</div>';
  for(const c of CONTRACTS){
    const cur=Math.min(c.goal,c.cur()), done=cur>=c.goal, pct=Math.round(cur/c.goal*100);
    html+='<div class="vCard vContract'+(done?' maxed':'')+'">'
      +'<div class="vTop"><div class="vName">'+(done?'✔ ':'')+c.n+'</div></div>'
      +'<div class="vDesc">'+c.d+'</div>'
      +'<div class="vProg"><div class="vProgFill" style="width:'+pct+'%"></div></div>'
      +'<div class="vProgTxt">'+(done?'CONTRACT FULFILLED':cur+' / '+c.goal+' — '+c.gtxt)+'</div>'
      +'</div>';
  }
  grid.innerHTML=html;
  grid.querySelectorAll('.vBuy[data-vid]').forEach(b=>b.addEventListener('click',()=>buyVault(b.dataset.vid)));
}
function openVault(){ renderVault(); $('vaultPanel').classList.remove('hidden'); SFX.vaultOpen(); }
function vaultWindowOpen(){ return !!(P&&P._vaultKey); } // the door answers to THE KEY now — the pit boss carries it
function nextVaultTime(){ return gt<300 ? 300 : (Math.floor(gt/300)+1)*300; }
function tickVaultDoor(){
  const vw=vaultWindowOpen();
  if(vw&&!window._vw){ window._vw=true; vaultSpent=false;
    announce('◈ THE KEY TURNS — THE VAULT ANSWERS ◈',true); SFX.vaultOpen(); SFX.dingBells();
    if(vaultProp){ ring(vaultProp.x,vaultProp.y,160,'#ffd36b'); ring(vaultProp.x,vaultProp.y,90,'#fff2c0'); } }
  if(vw&&vaultProp){ window._vwp=(window._vwp||0)+1; if(window._vwp%150===0) ring(vaultProp.x,vaultProp.y,120,'#ffd36b'); }
}
async function saveGilt(){ try{ if(!store)return; await store.set(GILT_KEY,JSON.stringify({gilt,best}),false); }catch(e){} }
