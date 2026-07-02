"use strict";
/* gilt persistence (personal) */
async function loadGilt(){ try{ if(!store)return; const r=await store.get(GILT_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); gilt=o.gilt||0; best=o.best||0; } }catch(e){} }
const VAULT={ lv:{} };
const VAULT_DEFS=[
 {id:'hp',    n:'BLOODLINE',      d:'+8% max blood per seal',                    max:5, base:40,  icon:'hp'},
 {id:'dmg',   n:'SHARPER FATE',   d:'+5% damage per seal',                       max:5, base:40,  icon:'dmg'},
 {id:'fire',  n:'QUICK FINGERS',  d:'+4% fire rate per seal',                    max:5, base:45,  icon:'fire'},
 {id:'spd',   n:'FLEET BOOTS',    d:'+3% move speed per seal',                   max:5, base:35,  icon:'spd'},
 {id:'gold',  n:'GOLDEN TOUCH',   d:'+6% coin gain per seal',                    max:5, base:50,  icon:'luck'},
 {id:'pocket',n:'POCKET CHANGE',  d:'begin each run with +15 coins per seal',    max:4, base:30,  icon:'mag',   req:()=>(LT.chests||0)>=5,    reqTxt:'Open 5 of the House\'s gifts'},
 {id:'fever', n:'FEVER PITCH',    d:'fever charges +8% faster per seal',         max:5, base:60,  icon:'nova',  req:()=>(LT.fevers||0)>=3,    reqTxt:'Enter Fever Mode 3 times'},
 {id:'marker',n:"MARKER'S FAVOR", d:'+5% Marker revival odds per seal',          max:3, base:120, icon:'regen', req:()=>(LT.markers||0)>=1,   reqTxt:'Face the House Marker once'},
 {id:'credit',n:'HOUSE CREDIT',   d:'begin each run with a free slot spin per seal', max:3, base:150, icon:'cards', req:()=>(LT.bossKills||0)>=1, reqTxt:'Slay your first boss'},
 {id:'dice',  n:'LOADED DICE',    d:'every dice target lowered by 1, always',    max:1, base:420, icon:'proj',  req:()=>(LT.gods||0)>=1,      reqTxt:'Reach GOD LEVEL once'}
];
const CONTRACTS=[
 {id:'bloodpact', n:'BLOOD PACT',      d:'Fountains pour 25% faster, forever', goal:10,   cur:()=>(LT.rites||0),     gtxt:'Last Rites ×10'},
 {id:'highroller',n:'HIGH ROLLER',     d:'Begin every run one level richer',   goal:2000, cur:()=>(LT.coins||0),     gtxt:'2,000 lifetime coins'},
 {id:'collector', n:"COLLECTOR'S DUE", d:'Bosses drop double Gilt, forever',   goal:25,   cur:()=>(LT.bossKills||0), gtxt:'Slay 25 bosses'}
];
function contractDone(id){ const c=CONTRACTS.find(x=>x.id===id); return c && c.cur()>=c.goal; }
function vlv(id){ return (VAULT.lv[id]|0); }
function vaultCost(def){ return Math.round(def.base*Math.pow(1.6, vlv(def.id))); }
function vaultUnlocked(def){ return !def.req || def.req(); }
function applyVault(){
  P.maxHp=Math.round(P.maxHp*(1+0.08*vlv('hp'))); P.hp=P.maxHp;
  P.damage*=(1+0.05*vlv('dmg'));
  P.fireRate*=(1+0.04*vlv('fire'));
  P.speed*=(1+0.03*vlv('spd'));
  P.coinMult*=(1+0.06*vlv('gold'));
  if(vlv('pocket')){ P.coins+=15*vlv('pocket'); }
  for(let i=0;i<vlv('credit');i++) pending.push({});
  if(contractDone('highroller')) pending.push({});
}
function buyVault(id){
  const def=VAULT_DEFS.find(d=>d.id===id); if(!def) return;
  if(!vaultUnlocked(def) || vlv(id)>=def.max) return;
  const cost=vaultCost(def); if(gilt<cost){ SFX.bust(); return; }
  gilt-=cost; VAULT.lv[id]=vlv(id)+1;
  saveGilt(); saveAch(); SFX.vaultBuy(); sparkBurst(20);
  LT.seals=(LT.seals||0)+1; bump('seals',LT.seals);
  renderVault();
}
function renderVault(){
  $('vaultGilt').textContent=gilt;
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
async function saveGilt(){ try{ if(!store)return; await store.set(GILT_KEY,JSON.stringify({gilt,best}),false); }catch(e){} }
