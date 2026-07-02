"use strict";
let localBoard=[];
const LB_KEY='antemortem_board_v1', GILT_KEY='antemortem_gilt_v1';
let pendingEntry=null;
function localStorage_name(){ try{ return sessionName; }catch(e){ return ''; } }
let sessionName='';
async function submitScore(entry){
  try{
    if(!store){ localBoard.push(entry); localBoard.sort((a,b)=>b.s-a.s); localBoard=localBoard.slice(0,100); return {board:localBoard, ...pctl(localBoard,entry)}; }
    let board=[];
    try{ const r=await store.get(LB_KEY,true); if(r&&r.value) board=JSON.parse(r.value); }catch(e){ board=[]; }
    if(!Array.isArray(board)) board=[];
    board.push(entry); board.sort((a,b)=>b.s-a.s); board=board.slice(0,100);
    try{ await store.set(LB_KEY,JSON.stringify(board),true); }catch(e){}
    return {board, ...pctl(board,entry)};
  }catch(e){ localBoard.push(entry); localBoard.sort((a,b)=>b.s-a.s); return {board:localBoard, ...pctl(localBoard,entry)}; }
}
function pctl(board,entry){
  const total=board.length;
  const below=board.filter(x=>x.s<entry.s).length;
  const others=Math.max(1,total-1);
  const betterThan = total<=1?100:Math.round(below/others*100);
  const rank = board.findIndex(x=>x===entry)+1;
  return {betterThan,rank,total};
}
function renderBoard(board,res,entry){
  const p=$('goPctl');
  if(res.total<=1) p.innerHTML='First name in the ledger. <b>The court awaits challengers.</b>';
  else p.innerHTML=`You bled better than <b>${res.betterThan}%</b> of souls — rank <b>#${res.rank}</b> of ${res.total}.`;
  const ol=$('board'); ol.innerHTML='';
  board.slice(0,10).forEach((e,i)=>{
    const li=document.createElement('li'); if(e===entry) li.className='you';
    li.innerHTML=`<span class="rank">#${i+1}</span><span>${escapeHtml(e.n)}</span><span class="sc">${e.s.toLocaleString()}</span>`;
    ol.appendChild(li);
  });
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
/* ============================================================
   ACHIEVEMENTS — 1000+ procedurally generated, toasts, records
   ============================================================ */
const ACH_KEY='antemortem_ach_v2';
let LT={kills:0,coins:0,runs:0,deaths:0,diceWins:0,perfects:0,curses:0,skillLost:0,triples:0,pairs:0,ladders:0,spins:0,bossKills:0,gilt:0,gilded:0,killsBy:{},bossBy:{}};
let REC={level:0,wave:0,kills:0,score:0,weaponLv:0,streak:0,minutes:0};
let unlocked=new Set(), achQ=[], achShowing=0, achSaveT=null;
const ACH_BY_STAT={}; let ACH_TOTAL=0;
const STAT_LABEL={level:'Ascension',wave:'Waves',minutes:'Endurance',runKills:'Slaughter (run)',ltKills:'Slaughter (lifetime)',runCoins:'Riches (run)',ltCoins:'Riches (lifetime)',score:'Score',streak:'Kill Streaks',diceWins:'Dice Wins',perfects:'Perfect Twelves',curses:'Curses Endured',skillLost:'Souls Forfeit',triples:'Triple Jackpots',pairs:'Pairs',ladders:'Full Ladders',spins:'Spins',deaths:'Deaths',runs:'Runs',gilt:'Gilt Hoard',bossKills:'Bosses Slain',gilded:'Gilded Souls'};
const SEC=new Set();
function secret(id,name){
  if(SEC.has(id)) return; SEC.add(id); achSaveSoon();
  announce('🗝 SECRET — '+name+' 🗝', true);
  SFX.secretFound(); sparkBurst(26); flash(0.3,'#c98bff');
  LT.secrets=SEC.size; bump('secrets',SEC.size);
}
let keyBuf='', konamiIdx=0;
const KONAMI=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
function feedSecretKeys(k){
  if(k===KONAMI[konamiIdx]){ konamiIdx++; if(konamiIdx>=KONAMI.length){ konamiIdx=0; secret('konami','THE OLD CODE'); if(P&&state==='playing'){ P.coins+=30; coinRain(12); } } }
  else konamiIdx=(k===KONAMI[0])?1:0;
  if(k.length===1 && /[a-z0-9]/.test(k)){ keyBuf=(keyBuf+k).slice(-12);
    if(keyBuf.endsWith('ante')) secret('ante','HOUSE PASSWORD');
    if(keyBuf.endsWith('666')){ secret('beast','THE BEAST\'S NUMBER'); flash(0.4,'#8b1620'); }
    if(keyBuf.endsWith('jackpot')){ secret('greedy','GREEDY WORDS'); if(state==='playing') coinRain(10); }
    if(keyBuf.endsWith('vesper')) secret('vesper','KNOW THYSELF');
    if(keyBuf.endsWith('house')) secret('house','SPEAK ITS NAME');
  }
}
function achAdd(stat,v,name,desc){ (ACH_BY_STAT[stat]=ACH_BY_STAT[stat]||[]).push({id:stat+'_'+v,v,name,desc}); ACH_TOTAL++; }
function buildAch(){
  const RN=['I','II','III','IV','V','VI','VII','VIII'];
  for(let l=5;l<=250;l+=5) achAdd('level',l,'Ascendant '+l,'Reach level '+l+' in one run');
  for(let w=5;w<=150;w+=5) achAdd('wave',w,'Wave '+w,'Survive to wave '+w);
  [3,5,8,10,15,20,25,30,40,50,60].forEach(m=>achAdd('minutes',m,m+' Minutes in Hell','Survive '+m+' minutes in one run'));
  [50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500,1550,1600,1650,1700,1750,1800,1850,1900,1950,2000,2050,2100,2150,2200,2250,2300,2350,2400,2450,2500,2550,2600,2650,2700,2750,2800,2850,2900,2950,3000,3050,3100,3150,3200,3250,3300,3350,3400,3450,3500,3550,3600,3650,3700,3750,3800,3850,3900,3950,4000,4050,4100,4150,4200,4250,4300,4350,4400,4450,4500,4550,4600,4650,4700,4750,4800,4850,4900,4950,5000].forEach(v=>achAdd('runKills',v,'Reaper ×'+v,v+' kills in one run'));
  [100,250,500,1000,2000,3000,4000,5000,7500,10000,15000,25000,40000,60000,100000,150000,250000,400000,650000,1000000].forEach(v=>achAdd('ltKills',v,'Eternal Reaper ×'+v,v+' lifetime kills'));
  [100,250,500,1000,2000,3500,5000,10000,20000].forEach(v=>achAdd('runCoins',v,'High Roller '+v,'Hold '+v+' coins in one run'));
  [500,1000,2500,5000,10000,25000,50000,100000,250000,500000].forEach(v=>achAdd('ltCoins',v,'House Money '+v,v+' lifetime coins'));
  for(let s=1;s<=24;s++) achAdd('score',s*2500,'Legend '+(s*1000),'Score '+(s*1000)+' in one run');
  [27,54,81,108,135,162,189,216,243,270,297,324,351,378,405,432,459,486,513,540,567,594,621,648,675,702,729,756,783,810,837,864,891,918,945,972,999,1026,1053,1080].forEach(v=>achAdd('streak',v,'Bloodrush ×'+v,v+' kill streak'));
  [5,10,25,50,100,200,400,700,1000,1500].forEach(v=>achAdd('diceWins',v,'Hot Hands ×'+v,'Win '+v+' dice rolls (lifetime)'));
  [1,5,10,25,50,100,200].forEach(v=>achAdd('perfects',v,'Perfect ×'+v,v+' perfect twelves'));
  [5,10,25,50,100,200,400,666].forEach(v=>achAdd('curses',v,'Cursed ×'+v,'Endure '+v+' curses'));
  [1,5,10,25,50].forEach(v=>achAdd('skillLost',v,'The House Takes ×'+v,'Lose '+v+' skills to the dice'));
  [1,5,10,25,50,100,200].forEach(v=>achAdd('triples',v,'JACKPOT ×'+v,v+' triple matches'));
  [5,10,25,50,100,200,400,700,1000].forEach(v=>achAdd('pairs',v,'Paired ×'+v,v+' pair matches'));
  [1,3,5,10,25,50].forEach(v=>achAdd('ladders',v,'All The Way ×'+v,'Complete '+v+' full 4-win ladders'));
  [10,50,100,250,500,1000,2500,5000,10000].forEach(v=>achAdd('spins',v,'Spinner ×'+v,v+' lifetime spins'));
  [1,5,10,25,50,100,200].forEach(v=>achAdd('deaths',v,'The House Always Wins ×'+v,'Die '+v+' times'));
  [1,5,10,25,50,100,250,500].forEach(v=>achAdd('runs',v,'Regular ×'+v,'Play '+v+' runs'));
  [10,50,100,250,500,1000,2000,3500,5000,7500,10000,15000,25000,40000,60000].forEach(v=>achAdd('gilt',v,'Gilt Hoard '+v,'Earn '+v+' lifetime Gilt'));
  [1,5,10,25,50,100].forEach(v=>achAdd('bossKills',v,'Boss Slayer ×'+v,'Slay '+v+' bosses'));
  [1,5,10,25,50].forEach(v=>achAdd('gilded',v,'Gold Rush ×'+v,'Slay '+v+' gilded souls'));
  [1,5,10,25,50,100].forEach(v=>achAdd('fevers',v,'FEVER ×'+v,'Enter Fever Mode '+v+' times'));
  [1,3,5,10,20,35,50,75,100].forEach(v=>achAdd('tarot',v,'Fortune Read ×'+v,'Collect '+v+' tarot cards'));
  [1,5,10,25].forEach(v=>achAdd('markers',v,'Marker Called ×'+v,'Face the House Marker '+v+' times'));
  [1,3,5,10,25,50].forEach(v=>achAdd('gods',v,'GOD LEVEL ×'+v,'Complete the full 4-win ladder '+v+' times'));
  [50,100,150,250,400,600,1000].forEach(v=>achAdd('noDmg',v,'Untouchable ×'+v,'Kill '+v+' without taking damage'));
  [1,5,10,25,50,100].forEach(v=>achAdd('rites',v,'Blood Gambler ×'+v,'Gamble at death\'s door '+v+' times'));
  [1,5,10,25,50,100].forEach(v=>achAdd('roul',v,'Floor Bets ×'+v,'Spin the roulette plate '+v+' times'));
  [1,5,10,25,50,100].forEach(v=>achAdd('chests',v,'Looter ×'+v,'Open '+v+' of the House\'s gifts'));
  [1,3,5,10,15,20,25,30,36].forEach(v=>achAdd('seals',v,'Vault Seal ×'+v,'Unseal '+v+' Vault blessings'));
  [1,3,5,10,15,20,25,30].forEach(v=>achAdd('secrets',v,'Secret Keeper ×'+v,'Uncover '+v+' of the House\'s secrets'));
  [1,5,10,25,50,100].forEach(v=>achAdd('wheel',v,'Soul Spinner ×'+v,'Spin the Wheel of Souls '+v+' times'));
  [1,5,10,25,50,100].forEach(v=>achAdd('crash',v,'Ascendant Gambler ×'+v,'Ride the Ascent '+v+' times'));
  [1,5,10,25,50,100].forEach(v=>achAdd('bounty',v,'Headhunter ×'+v,'Claim '+v+' bounties'));
  [10,20,30,40,50,100,150,200,250,300,350,400,450,500].forEach(v=>achAdd('milestone',v,'Streak Mark '+v,'Hit a '+v+' kill streak'));
  STAT_LABEL.bounty='Bounties'; STAT_LABEL.milestone='Streak Marks';
  STAT_LABEL.wheel='Wheel of Souls'; STAT_LABEL.crash='The Ascent';
  STAT_LABEL.secrets='Secrets';
  STAT_LABEL.noDmg='Untouchable'; STAT_LABEL.rites='Last Rites'; STAT_LABEL.roul='Floor Bets'; STAT_LABEL.chests='Gifts Opened'; STAT_LABEL.seals='The Vault';
  STAT_LABEL.fevers='Fever Mode'; STAT_LABEL.tarot='Tarot Cards'; STAT_LABEL.markers='House Markers'; STAT_LABEL.gods='God Levels';
  WEAPONS.forEach(w=>{ for(let l=1;l<=w.max;l++){ achAdd('w_'+w.id,l,w.n+' '+(RN[l-1]||l),w.n+' to level '+l); } STAT_LABEL['w_'+w.id]=w.n; });
  PASSIVES.forEach(s=>{ for(let l=1;l<=s.max;l++){ achAdd('s_'+s.id,l,s.n+' '+(RN[l-1]||l),s.n+' to level '+l); } STAT_LABEL['s_'+s.id]=s.n; });
  const foes=['shambler','husk','swarm','shooter','stalker','hexer','revenant','brute','wraith','elite','leech','bomber'];
  foes.forEach(f=>{ [100,500,1000,2500,5000].forEach(v=>achAdd('ek_'+f,v,f.charAt(0).toUpperCase()+f.slice(1)+' Bane ×'+v,'Slay '+v+' '+f+'s')); STAT_LABEL['ek_'+f]=f.charAt(0).toUpperCase()+f.slice(1)+'s'; });
  ['pitboss','croupier','collector','thehouse'].forEach(b=>{ [1,3,5,10,25,50].forEach(v=>achAdd('boss_'+b,v,BOSS_DEFS[b].name+' ×'+v,'Slay '+BOSS_DEFS[b].name+' '+v+' times')); STAT_LABEL['boss_'+b]=BOSS_DEFS[b].name; });
}
function bump(stat,value){
  const arr=ACH_BY_STAT[stat]; if(!arr) return;
  for(const a of arr){ if(a.v>value) break; if(!unlocked.has(a.id)){ unlocked.add(a.id); achQ.push(a); } }
  if(achQ.length) pumpToasts();
}
function pumpToasts(){
  if(achShowing>=3 || !achQ.length) return;
  let a;
  if(achQ.length>8){ const n=achQ.length; achQ.length=0; a={name:'+'+n+' ACHIEVEMENTS',desc:'unlocked at once'}; }
  else a=achQ.shift();
  achShowing++; achSaveSoon();
  const box=$('achToasts'); if(!box){ achShowing--; return; }
  const t=document.createElement('div'); t.className='achToast';
  t.innerHTML='<span class="achIcon">🏆</span><span class="achTxt"><b>'+a.name+'</b><i>'+(a.desc||'')+'</i></span>';
  box.appendChild(t); SFX.achieve();
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>{ t.remove(); achShowing--; pumpToasts(); },380); }, 2600);
}
let recToasted=new Set();
function recCheck(key,value,label){
  if(value>REC[key]){ const had=REC[key]>0; REC[key]=value; achSaveSoon();
    if(had && !recToasted.has(key)){ recToasted.add(key); const box=$('achToasts'); if(box){ const t=document.createElement('div'); t.className='achToast record';
      t.innerHTML='<span class="achIcon">✦</span><span class="achTxt"><b>NEW RECORD</b><i>'+label+': '+value+'</i></span>';
      box.appendChild(t); SFX.record(); setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),380); },2800); } }
  }
}
function achSaveSoon(){ clearTimeout(achSaveT); achSaveT=setTimeout(saveAch, 1500); }
async function saveAch(){ try{ if(!store)return; await store.set(ACH_KEY,JSON.stringify({u:[...unlocked],LT,REC,V:VAULT.lv,S:[...SEC]}),false); }catch(e){} }
async function loadAch(){ try{ if(!store)return; const r=await store.get(ACH_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); unlocked=new Set(o.u||[]); Object.assign(LT,o.LT||{}); Object.assign(REC,o.REC||{}); VAULT.lv=o.V||{}; (o.S||[]).forEach(x=>SEC.add(x)); } }catch(e){} }
function openAchPanel(){
  const p=$('achPanel'), list=$('achList'); if(!p) return;
  $('achCount').textContent=unlocked.size+' / '+ACH_TOTAL+'  ·  SECRETS '+SEC.size+' / 34';
  $('achProg').style.width=(unlocked.size/ACH_TOTAL*100).toFixed(1)+'%';
  let html='';
  for(const stat in ACH_BY_STAT){ const arr=ACH_BY_STAT[stat]; const got=arr.filter(a=>unlocked.has(a.id)).length;
    html+='<div class="achCat"><div class="achCatHead">'+(STAT_LABEL[stat]||stat)+' <span>'+got+'/'+arr.length+'</span></div><div class="achGrid">';
    for(const a of arr){ const on=unlocked.has(a.id); html+='<div class="achTile'+(on?' on':'')+'" title="'+a.desc+'">'+(on?'🏆 ':'')+a.name+'</div>'; }
    html+='</div></div>';
  }
  list.innerHTML=html; p.classList.remove('hidden');
}

const RANK_KEY='am_rank_v1';
let RANK={marks:0, rank:1, _ld:0};
const RANKS=[
 {n:'FRESH MEAT'},
 {n:'PATRON',        r:'+25 GILT',            g:25},
 {n:'GAMBLER',       r:'START WITH 15 COINS'},
 {n:'HIGH ROLLER',   r:'+40 GILT',            g:40},
 {n:'DEBTOR',        r:'+10 STARTING HP'},
 {n:'MARKED SOUL',   r:'+50 GILT',            g:50},
 {n:'HOUSE FAVORITE',r:'START AT LEVEL 2'},
 {n:'PIT FIEND',     r:'+75 GILT',            g:75},
 {n:'CROUPIER OF BONES', r:'XP +5% FOREVER'},
 {n:'VAULT KIN',     r:'RAGE FEED +10%'},
 {n:'HOUSE SHADOW',  r:'CURSES 25% SHORTER'},
 {n:'THE HOUSE ITSELF', r:'ALL COINS +10%'}
];
function rkStep(k){ return Math.round(140*Math.pow(k,1.6)); }
function rkCum(n){ let t=0; for(let k=1;k<n;k++) t+=rkStep(k); return t; }
async function loadRank(){ try{ if(!store)return; const v=await store.get(RANK_KEY); if(v&&v.value){ const o=JSON.parse(v.value); RANK.marks=o.marks||0; RANK.rank=o.rank||1; } }catch(e){} }
async function saveRank(){ try{ if(!store)return; await store.set(RANK_KEY,JSON.stringify({marks:RANK.marks,rank:RANK.rank}),false); }catch(e){} }
function awardMarks(m){
  RANK.marks+=m; let up=false, reward='';
  while(RANK.rank<RANKS.length && RANK.marks>=rkCum(RANK.rank+1)){
    RANK.rank++; up=true; const rk=RANKS[RANK.rank-1]; reward=rk.r||'';
    if(rk.g){ gilt+=rk.g; saveGilt(); }
  }
  saveRank();
  const base=rkCum(RANK.rank), next=RANK.rank<RANKS.length?rkCum(RANK.rank+1):base+1;
  return { up, reward, have:RANK.marks-base, need:next-base, pct:Math.min(100,Math.round((RANK.marks-base)/(next-base)*100)) };
}
function applyRankPerks(){
  const r=RANK.rank;
  if(r>=3) P.coins+=15;
  if(r>=5){ P.maxHp+=10; P.hp+=10; }
  if(r>=7) pending.push({});
  if(r>=9) P.xpMult=(P.xpMult||1)*1.05;
  if(r>=10) P.ovFeed=(P.ovFeed||1)*1.10;
  if(r>=11) P.curseCut=0.75;
  if(r>=12) P.coinMult=(P.coinMult||1)*1.10;
}
