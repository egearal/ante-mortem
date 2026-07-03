"use strict";
// Leaderboard retired 2026-07 (director's call). Stored data under 'antemortem_board_v1' is preserved, just unread.
const GILT_KEY='antemortem_gilt_v1';
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
// THE WHISPERS — every secret taunts you as a riddle until you solve it.
// [name, riddle-while-locked, plain truth once found]
const WHISPERS={
  statue:['STATUE OF THE DAMNED','Be still a full minute among the hungry.','Stood motionless for 60 seconds mid-run.'],
  heart:['HEART OF THE HOUSE','Stand on the House\'s heart and count to six.','Held the arena\'s center sigil for 6 seconds.'],
  surveyor:['SURVEYOR OF HELL','Walk every corner of the pit in one night.','Visited all four arena corners in one run.'],
  knock:['KNOCKING ON THE VAULT','Come knocking where the gilt sleeps.','Approached the sealed vault door.'],
  touched:['TOUCHED BY THE PAST','Walk through one who is no longer there.','Passed through a ghost patron.'],
  thirteen:['THIRTEEN THIRTEEN','Endure until the clock reads its cursed twin.','Survived to 13:13 on the run clock.'],
  murder:['MURDER DISPERSED','Startle every raven from its roost.','Scared off the whole unkindness of ravens.'],
  glutton:['GIFT GLUTTON','Take three gifts in one sitting.','Opened 3 chests in a single run.'],
  wheeladdict:['WHEEL ADDICT','Bet the floor three times in one night.','Played 3 floor roulettes in one run.'],
  goldongold:['GOLD ON GOLD','Fell a gilded soul while burning.','Killed a gilded soul during Fever.'],
  godslayer:['GODSLAYER','Slay a king while you cannot be slain.','Killed a boss while untouchable.'],
  streak500:['THE FIVE HUNDRED','Five hundred souls without letting the count die.','Reached a 500 kill streak.'],
  sevens:['TRIPLE SEVENS','Carry the jackpot number in coin.','Held exactly 777 coins.'],
  midnight:['THE WITCHING HOUR','Die when the living world strikes twelve.','Died at real-world midnight.'],
  friday13:['UNLUCKIEST NIGHT','Die on the unluckiest night there is.','Died on a Friday the 13th.'],
  edge:['DANCING ON THE EDGE','Catch fire with two drops of blood left.','Started Fever at 2% blood or less.'],
  cursed13:['CURSED POCKET','Bring the cursed number to the reels.','Entered the slot holding exactly 13 coins.'],
  snakeeyes:['SNAKE EYES','Roll the serpent\'s stare.','Rolled double ones.'],
  bornlucky:['BORN LUCKY','Perfection on your very first bones.','Rolled a perfect 12 on the first rung.'],
  dblperfect:['DOUBLE PERFECTION','Perfection, twice, without breathing.','Rolled perfect 12s back to back.'],
  longfall:['THE LONG FALL','Fall three times and keep your seat.','Lost three dice rolls in one ladder.'],
  konami:['THE OLD CODE','The oldest code the old world knows.','Entered the ancient code.'],
  ante:['HOUSE PASSWORD','Type the price of admission.','Typed the word ante.'],
  beast:['THE BEAST\'S NUMBER','Spell the beast in digits.','Typed 666.'],
  greedy:['GREEDY WORDS','Say the word every gambler prays.','Typed the word jackpot.'],
  vesper:['KNOW THYSELF','Type the name the House gave you.','Typed vesper.'],
  house:['SPEAK ITS NAME','Name the thing that owns you.','Typed house.'],
  checking:['JUST CHECKING','Doubt the silence twice, quickly.','Double-tapped the mute bell.'],
  namehouse:['NAME OF THE HOUSE','Knock seven times upon the title.','Clicked the title seven times.'],
  debtor:['DEATH\'S DEBTOR','Talk death out of it twice in one lifetime.','Won the final press twice, ever.'],
  broke:['BROKE AT THE END','Die without a coin to your name.','Died holding exactly 0 coins.'],
  icarus:['ICARUS ASCENDANT','Ride the climb past the seventh heaven.','Passed 7.77x in the Ascent.'],
  coldfeet:['COLD FEET','Hesitate thirteen times in one night.','Paused 13 times in one run.'],
  theegg:['THE EGG','Something small and golden hides far from the lights.','Found and ate the golden egg.'],
  pactbreaker:['PACT BREAKER','Refuse the red lever thrice in one night.','Refused the blood lever 3 times in one run.'],
  highroller:['HIGH ROLLER','Pay a three-figure cut for one case.','Paid 100+ coins to unseal the wheel.'],
};
const WHISPER_TOTAL=Object.keys(WHISPERS).length;
let secPaid=false;
function secret(id,name){
  if(SEC.has(id)) return; SEC.add(id); achSaveSoon();
  gilt+=25; saveGilt(); // every whisper answered pays
  announce('🗝 SECRET — '+name+' · +25 GILT 🗝', true);
  SFX.secretFound(); sparkBurst(26); flash(0.3,'#c98bff'); coinRain(8);
  LT.secrets=SEC.size; bump('secrets',SEC.size);
  try{ idxBump(); }catch(e){}
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
  [1,5,10,25,50].forEach(v=>achAdd('scars',v,'Scarred ×'+v,'Take '+v+' permanent wounds from the dice'));
  STAT_LABEL.scars='Scars';
  achAdd('index',25,'The First Folio','Catalogue 25% of the Index');
  achAdd('index',50,'Half the Library','Catalogue 50% of the Index');
  achAdd('index',75,'The Deep Stacks','Catalogue 75% of the Index');
  achAdd('index',100,'Marginalia','Catalogue the entire Index');
  STAT_LABEL.index='The Index';
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
/* THE INDEX — persistent catalogue of everything ever encountered (new key, additive) */
const IDX_KEY='am_index_v1';
let IDX={w:[],p:[],c:[],t:[],e:[],b:[],st:[],sl:'vesper',fl:'pit',ct:[]};
let _idxT=null;
function idxSee(cat,id){ if(!id||typeof IDX==='undefined') return; const a=IDX[cat]; if(!a||a.indexOf(id)>=0) return; a.push(id); idxSaveSoon(); idxBump(); }
function idxTotal(){ return WEAPONS.length + PASSIVES.length + DEBUFF_POOL.length + TAROT_FATES.length + Object.keys(CFG.enemy).length + WHISPER_TOTAL; } // CFG.enemy already includes the 4 bosses
function idxSeen(){ return IDX.w.length+IDX.p.length+IDX.c.length+IDX.t.length+IDX.e.length+IDX.b.length+SEC.size; }
function idxPct(){ return Math.min(100,Math.floor(idxSeen()/idxTotal()*100)); }
function idxBump(){ bump('index', idxPct()); }
function idxSaveSoon(){ clearTimeout(_idxT); _idxT=setTimeout(idxSave, 800); }
async function idxSave(){ try{ if(!store)return; await store.set(IDX_KEY,JSON.stringify(IDX),false); }catch(e){} }
async function idxLoad(){ try{ if(!store)return; const r=await store.get(IDX_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); for(const k of ['w','p','c','t','e','b','st','ct']) if(Array.isArray(o[k])) IDX[k]=o[k];
      if(typeof o.sl==='string') IDX.sl=o.sl; if(typeof o.fl==='string') IDX.fl=o.fl; } }catch(e){} }
// HOUSE FAVORS — specific feats seal small permanent bonuses, forever
const ACH_PERKS={
 'minutes_3':   {n:'PIT LEGS',          fx:'+2 MOVE SPEED, FOREVER',  ap:()=>{P.speed+=2;}},
 'triples_1':   {n:'JACKPOT NERVES',    fx:'+2 MOVE SPEED, FOREVER',  ap:()=>{P.speed+=2;}},
 'wave_15':     {n:'VELVET SHOULDERS',  fx:'+5 MAX BLOOD, FOREVER',   ap:()=>{P.maxHp+=5;P.hp+=5;}},
 'runKills_1000':{n:'THOUSAND TEETH',   fx:'+2% DAMAGE, FOREVER',     ap:()=>{P.damage*=1.02;}},
 'ltKills_25000':{n:'ETERNAL HEADCOUNT',fx:'+2% DAMAGE, FOREVER',     ap:()=>{P.damage*=1.02;}},
 'streak_54':   {n:'BLOODRUSH MEMORY',  fx:'+2% FIRE RATE, FOREVER',  ap:()=>{P.fireRate*=1.02;}},
 'diceWins_25': {n:'HOT HANDS',         fx:'+1% CRIT, FOREVER',       ap:()=>{P.crit=Math.min(0.9,(P.crit||0)+0.01);}},
 'perfects_5':  {n:"TWELVE'S BLESSING", fx:'+2% XP, FOREVER',         ap:()=>{P.xpMult=(P.xpMult||1)*1.02;}},
 'spins_100':   {n:"REGULAR'S RATE",    fx:'+2% COINS, FOREVER',      ap:()=>{P.coinMult=(P.coinMult||1)+0.02;}},
 'bossKills_10':{n:'TROPHY WALL',       fx:'+2% COINS, FOREVER',      ap:()=>{P.coinMult=(P.coinMult||1)+0.02;}},
 // Index milestones — g pays gilt ONCE at the unlock moment; ap (if any) is forever
 'index_25':    {n:'THE FIRST FOLIO',   fx:'+50 GILT',                        g:50},
 'index_50':    {n:'HALF THE LIBRARY',  fx:'+150 GILT · +1% COINS, FOREVER',  g:150, ap:()=>{P.coinMult=(P.coinMult||1)+0.01;}},
 'index_75':    {n:'THE DEEP STACKS',   fx:'+300 GILT · +2% XP, FOREVER',     g:300, ap:()=>{P.xpMult=(P.xpMult||1)*1.02;}},
 'index_100':   {n:'MARGINALIA',        fx:'+777 GILT · +2% DAMAGE, FOREVER', g:777, ap:()=>{P.damage*=1.02;}}
};
function applyAchPerks(){ for(const id in ACH_PERKS){ const pk=ACH_PERKS[id]; if(pk.ap && unlocked.has(id)) try{ pk.ap(); }catch(e){} } }
function bump(stat,value){
  const arr=ACH_BY_STAT[stat]; if(!arr) return;
  for(const a of arr){ if(a.v>value) break; if(!unlocked.has(a.id)){ unlocked.add(a.id); achQ.push(a);
    const pk=ACH_PERKS[a.id];
    if(pk){ try{ if(pk.ap) pk.ap(); if(pk.g){ gilt+=pk.g; saveGilt(); } }catch(e){} // this run benefits immediately; future runs via applyAchPerks
      setTimeout(()=>{ announce('★ HOUSE FAVOR SEALED — '+pk.n+': '+pk.fx+' ★',true); SFX.seraph(); SFX.dingBells(); flash(0.4,'#fff2c0'); coinRain(16); },600); } } }
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
async function saveAch(){ try{ if(!store)return; await store.set(ACH_KEY,JSON.stringify({u:[...unlocked],LT,REC,V:VAULT.lv,S:[...SEC],SP:secPaid}),false); }catch(e){} }
async function loadAch(){ try{ if(!store)return; const r=await store.get(ACH_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); unlocked=new Set(o.u||[]); Object.assign(LT,o.LT||{}); Object.assign(REC,o.REC||{}); VAULT.lv=o.V||{}; (o.S||[]).forEach(x=>SEC.add(x)); secPaid=!!o.SP;
  if(!secPaid && SEC.size){ gilt+=25*SEC.size; saveGilt(); secPaid=true; achSaveSoon(); } // one-time bounty sweep for whispers already answered
  else if(!secPaid){ secPaid=true; achSaveSoon(); } } }catch(e){} }
function openAchPanel(){
  const p=$('achPanel'), list=$('achList'); if(!p) return;
  $('achCount').textContent=unlocked.size+' / '+ACH_TOTAL+'  ·  SECRETS '+SEC.size+' / '+WHISPER_TOTAL;
  $('achProg').style.width=(unlocked.size/ACH_TOTAL*100).toFixed(1)+'%';
  let html='';
  for(const stat in ACH_BY_STAT){ const arr=ACH_BY_STAT[stat]; const got=arr.filter(a=>unlocked.has(a.id)).length;
    html+='<div class="achCat"><div class="achCatHead">'+(STAT_LABEL[stat]||stat)+' <span>'+got+'/'+arr.length+'</span></div><div class="achGrid">';
    for(const a of arr){ const on=unlocked.has(a.id); html+='<div class="achTile'+(on?' on':'')+'" title="'+a.desc+'">'+(on?'🏆 ':'')+a.name+'</div>'; }
    html+='</div></div>';
  }
  list.innerHTML=html; p.classList.remove('hidden');
}
function openIndexPanel(){
  const p=$('indexPanel'), list=$('idxList'); if(!p) return;
  const seen=idxSeen(), tot=idxTotal();
  $('idxCount').textContent=seen+' / '+tot+' CATALOGUED  ·  '+idxPct()+'%';
  $('idxProg').style.width=(seen/tot*100).toFixed(1)+'%';
  const tile=(got,g,n,c)=>{ let tip=''; const bar=n.indexOf('|');
    if(bar>=0){ tip=n.slice(bar+1); n=n.slice(0,bar); }
    return got? '<div class="idxTile on"'+(tip?' data-tip="'+tip.replace(/"/g,'&quot;')+'" data-name="'+n.replace(/"/g,'&quot;')+'"':'')+' style="--ic:'+c+'"><span class="idxG">'+g+'</span>'+n+'</div>'
              : '<div class="idxTile"><span class="idxG">?</span>???</div>'; };
  const sec=(ico,name,col,rows)=>{ const got=rows.filter(r=>r[0]).length;
    return '<div class="idxSec" style="--sc:'+col+'"><div class="idxSecH"><b>'+ico+' '+name+'</b><span>'+got+' / '+rows.length+'</span></div><div class="idxGrid">'
      +rows.map(r=>tile(r[0],r[1],r[2],r[3])).join('')+'</div></div>'; };
  if(!list._tipWired){ list._tipWired=true;
    list.addEventListener('mouseover',ev=>{ const el=ev.target.closest('.idxTile[data-tip]'); if(!el) return;
      const tp=$('relicTip'); tp.innerHTML='<b>'+el.dataset.name+'</b><br>'+el.dataset.tip; tp.classList.remove('hidden');
      const r9=el.getBoundingClientRect(); tp.style.right=(innerWidth-r9.left+10)+'px'; tp.style.top=(r9.top-6)+'px'; });
    list.addEventListener('mouseout',ev=>{ if(ev.target.closest('.idxTile')) $('relicTip').classList.add('hidden'); }); }
  list.innerHTML=
    ('<div class="idxSec" style="--sc:#ff9a3c"><div class="idxSecH"><b>⚔ THE ARSENAL</b><span>'+WEAPONS.filter(w=>IDX.w.indexOf(w.id)>=0).length+' / '+WEAPONS.length+'</span></div><div class="idxGrid">'
      +WEAPONS.map(w=>{ const seen=IDX.w.indexOf(w.id)>=0, unl=weaponUnlocked(w.id);
        if(!unl) return '<div class="idxTile lockedW"><span class="idxG" style="color:#6a5e50">'+w.g+'</span>🔒 RANK '+WEAPON_UNLOCKS[w.id]+'</div>';
        return seen? '<div class="idxTile on" style="--ic:'+(GLYPH_COL[w.id]||'#ffd36b')+'"><span class="idxG">'+w.g+'</span>'+w.n+'</div>'
                   : '<div class="idxTile"><span class="idxG">?</span>???</div>'; }).join('')
      +'</div></div>')
   +sec('✦','PASSIVES','#8bff9a', PASSIVES.filter(s=>s.rar!=='ascend'&&s.rar!=='mythic').map(s=>[IDX.p.indexOf(s.id)>=0, s.g, s.n, GLYPH_COL[s.id]||'#8bff9a']))
   +sec('▲','ASCENSIONS','#8bffd0', PASSIVES.filter(s=>s.rar==='ascend'||s.rar==='mythic').map(s=>[IDX.p.indexOf(s.id)>=0, s.g, s.n, GLYPH_COL[s.id]||'#8bffd0']))
   +sec('☠','CURSES ENDURED','#ff5560', DEBUFF_POOL.map(d=>[IDX.c.indexOf(d.label)>=0, '☠', d.label, '#ff5560']))
   +sec('★','THE TAROT','#c98bff', TAROT_FATES.map(f=>[IDX.t.indexOf(f.n)>=0, f.t>0?'★':'☠', IDX.t.indexOf(f.n)>=0?f.n+'|'+((f.dd||'')+' ['+(f.t>0?'BLESSING':'CURSE')+']'):f.n, f.c||'#c98bff']))
   +sec('♟','THE COURT','#c22ca0', Object.keys(CFG.enemy).filter(k=>!BOSS_DEFS[k]).map(k=>[IDX.e.indexOf(k)>=0, '♟', k.toUpperCase(), CFG.enemy[k].col||'#c98bff']))
   +sec('♛','THE BOSSES','#ffd36b', Object.keys(BOSS_DEFS).map(k=>[IDX.b.indexOf(k)>=0, '♛', BOSS_DEFS[k].name, '#ffd36b']))
   +'<div class="idxSec" style="--sc:#c98bff"><div class="idxSecH"><b>🗝 THE WHISPERS</b><span>'+SEC.size+' / '+WHISPER_TOTAL+'</span></div><div class="wspGrid">'
     +Object.keys(WHISPERS).map(id=>{ const w=WHISPERS[id], got=SEC.has(id);
        return got? '<div class="wsp on" data-name="'+w[0].replace(/"/g,'&quot;')+'" data-tip="'+w[2].replace(/"/g,'&quot;')+'">🗝 <b>'+w[0]+'</b></div>'
                  : '<div class="wsp"><i>“'+w[1]+'”</i></div>'; }).join('')
     +'</div><div class="idxHint">Each whisper answered pays 25 GILT. The riddles are the walls talking.</div></div>';
  p.classList.remove('hidden');
}


/* ============================================================
   THE LEDGER PAGES — the House writes what it ate. 16 pages;
   13 unlock by HOUSE RANK, 3 by whispers answered. Read state
   lives in IDX.st (am_index_v1, additive field).
   ============================================================ */
const STORY_PAGES=[
 {id:'p1', r:1,  t:'THE ARRIVAL', tx:'You died owing. Not money — money the House has. You died owing YOURSELF, the only coin it cannot mint. So it sent the carriage. The horses had no eyes and did not need them; they had made the trip nine thousand times, and the road only goes one way.'},
 {id:'p2', r:2,  t:'THE TERMS', tx:'The Dealer read them aloud while your blood was still deciding whether to stay: ONE SOUL, STAKED. Interest compounds nightly. Winnings pay the principal. And should you clear the debt entire — the front door opens. The Dealer smiled when it said that. It has no face. It smiled anyway.'},
 {id:'p3', r:3,  t:'THE CHIPS', tx:'Turn one over. Feel it hum. Every chip in the House is pressed from a patron who stopped playing — ground fine, mixed with candle-wax, pressed in the cellar mill. When you spend one it screams, too high to hear. The pit refills the racks nightly. The mill is never idle.'},
 {id:'p4', r:5,  t:'THE PATRONS', tx:'The ones in the pit — the shamblers, the swarm, the whole rotting court — do not hate you. Understand: they are CHEERING. Every soul you cut down is one hand closer to your seat at the last table, and your seat is the only exit any of them has ever seen. They die hoping you make it. They die jealous.'},
 {id:'p5', r:7,  t:'THE DEALER\'S HANDS', tx:'Below the wrists, the Dealer is beautiful. Long pale fingers, a shuffle like water. The wrists themselves end in iron cuffs, bolted through the table. The rest of the Dealer was paid out long ago, to a player better than you. The hands keep dealing. They have no choice, and neither, now, do you.'},
 {id:'p6', r:9,  t:'THE FOUNTAIN', tx:'You have drunk from it. You noticed it was warm. You chose not to think about that, which the House appreciates — squeamish players bet small. Drink, darling. It is freely given. Whose it was matters so much less than whose it is now.'},
 {id:'p7', r:12, t:'THE WEDDING', tx:'Every soul the House claims, it MARRIES. There was a ceremony for you: the candles leaned in, the ravens stood witness, the organ played itself in a key that has no name. You slept through it. The ring is under your skin. That is what the marker is — a dowry, payable on death.'},
 {id:'p8', r:15, t:'THE KITCHEN', tx:'There is a door behind the vault that the maps deny. Steam under it, always. What the House serves upstairs is not meat and is not bread, but the patrons weep when they taste it, because it tastes like the year they were happiest. The chef borrows your face on Sundays.'},
 {id:'p9', r:20, t:'THE VAULT', tx:'Gilt is not gold. Look closer: every coin is a tooth, capped and polished. The House pulls one from every jackpot winner — the House\'s cut, it laughs, and the winners laugh too, bleeding at the mouth, because at last they have WON something. You have been spending smiles.'},
 {id:'p10',r:25, t:'THE ONE BEFORE YOU', tx:'Your name is Vesper. So was hers. So was the one before her — the House files its players under one name to save ink. She reached rank NINETY-NINE. She stood before the last table with the debt nearly paid, and she asked for one more spin. Not to win. Just to feel it. The House keeps her seat warm. It is your seat.'},
 {id:'p11',r:30, t:'THE ARCHITECT', tx:'No one built the House. The House grew, like scar tissue, around a wound in the world — a gambler once bet something that was not his to bet, and lost, and the loss kept COMPOUNDING. The pillars are its regret. The chandeliers are its eyes. You have been walking on its tongue since the door.'},
 {id:'p12',r:40, t:'THE EXIT', tx:'Here is the cruelty you have earned the right to read: the front door DOES open. The debt CAN be paid. Seventeen players have cleared it. All seventeen stood in the open doorway with the morning on their faces, free — and all seventeen turned around. Ask yourself why you are still reading. The House already knows.'},
 {id:'p13',r:50, t:'THE HOUSE ITSELF', tx:'Rank one hundred is not a title. It is a SEAT, and the seat empties, and the game does not stop for grief. One night — soon, as the House measures soon — the Dealer\'s cuffs will click open, and yours will click shut, and some new soul will push through the velvet doors owing themselves. You will smile at them. You will have no face. You will smile anyway. ANTE MORTEM, darling: the bet was always placed before the death.'},
 {id:'w1', w:5,  t:'WHAT THE WALLS ARE', tx:'You have started listening. Good. The walls are not stone — stone does not flinch. The House skins its bankrupts and stretches them thin and hangs them as wallpaper, and they are GRATEFUL, because even a wall still gets to watch the game.'},
 {id:'w2', w:15, t:'THE WHISPERERS', tx:'The riddles you keep answering are not tests. They are MESSAGES — pressed into the plaster by players who hid them faster than the House could eat the evidence. Every whisper you solve, somewhere in the walls a mouth that has held its breath for a century finally gets to exhale.'},
 {id:'w3', w:30, t:'THE LAST WHISPER', tx:'This page is not from a player. It is from the House, and it is the only true thing it will ever give you for free: it does not want your debt paid. It does not even want you dead. It wants you SEATED, forever, mid-spin, in the moment before the reels stop — because that is the only moment the wound stops hurting. You were never the gambler, darling. You are the painkiller.'}
];
function storyUnlocked(pg){ return pg.r ? RANK.rank>=pg.r : SEC.size>=pg.w; }
function storyUnreadCount(){ const rd=new Set(IDX.st||[]); return STORY_PAGES.filter(p=>storyUnlocked(p)&&!rd.has(p.id)).length; }
function nextStoryGate(){ const pg=STORY_PAGES.filter(p=>p.r&&RANK.rank<p.r).sort((a,b)=>a.r-b.r)[0]; return pg?pg.r:null; }
function openStoryPanel(){
  const p=$('storyPanel'), list=$('storyList'); if(!p) return;
  const rd=new Set(IDX.st||[]);
  const unlocked=STORY_PAGES.filter(pg=>storyUnlocked(pg)).length;
  $('storyCount').textContent=unlocked+' / '+STORY_PAGES.length+' PAGES RECOVERED';
  list.innerHTML=STORY_PAGES.map((pg,i)=>{
    const un=storyUnlocked(pg), isNew=un&&!rd.has(pg.id);
    if(!un) return '<div class="lpg locked"><span class="lpgN">'+(i+1)+'</span><b>🔒 '+(pg.r?('HOUSE RANK '+pg.r):(pg.w+' WHISPERS ANSWERED'))+'</b></div>';
    return '<div class="lpg on'+(isNew?' new':'')+'" data-pg="'+pg.id+'"><span class="lpgN">'+(i+1)+'</span><b>'+pg.t+'</b>'+(isNew?'<i class="lpgNew">UNREAD</i>':'')+'</div>';
  }).join('');
  if(!list._wired){ list._wired=true;
    list.addEventListener('click',ev=>{ const el=ev.target.closest('.lpg.on'); if(!el) return; readStoryPage(el.dataset.pg); });
  }
  p.classList.remove('hidden'); SFX.uiDing();
}
let _storyCur=null;
function stepStoryPage(dir){
  if(_storyCur===null) return;
  const i=STORY_PAGES.findIndex(p=>p.id===_storyCur);
  const j=i+dir;
  if(j<0 || j>=STORY_PAGES.length){ SFX.thud(); return; }
  const nx=STORY_PAGES[j];
  if(!storyUnlocked(nx)){
    SFX.thud();
    const rv=$('pageReveal'); const ar=rv&&rv.querySelector(dir>0?'.prNext':'.prPrev');
    if(ar){ ar.classList.remove('deny'); void ar.offsetWidth; ar.classList.add('deny'); }
    announce('🔒 '+(nx.r?('HOUSE RANK '+nx.r):(nx.w+' WHISPERS'))+' TO READ ON', false);
    return;
  }
  readStoryPage(nx.id);
}
function readStoryPage(id){
  const pg=STORY_PAGES.find(x=>x.id===id); if(!pg||!storyUnlocked(pg)) return;
  _storyCur=id;
  if((IDX.st||[]).indexOf(id)<0){ (IDX.st=IDX.st||[]).push(id); idxSaveSoon(); }
  let rv=$('pageReveal');
  if(!rv){ rv=document.createElement('div'); rv.id='pageReveal';
    rv.innerHTML='<div class="prVeil"></div><div class="prPage"><span class="prArrow prPrev">‹</span><span class="prArrow prNext">›</span><div class="prTitle"></div><div class="prBody"></div><div class="prFoot">— from the House\'s own ledger</div></div>';
    document.body.appendChild(rv);
    rv.querySelector('.prVeil').addEventListener('click',()=>{ rv.classList.add('hidden'); _storyCur=null; });
    rv.querySelector('.prPrev').addEventListener('click',()=>stepStoryPage(-1));
    rv.querySelector('.prNext').addEventListener('click',()=>stepStoryPage(1));
  }
  // arrow states: dim when the neighbor is locked or absent
  { const i=STORY_PAGES.findIndex(p=>p.id===id);
    const pv=rv.querySelector('.prPrev'), nx=rv.querySelector('.prNext');
    const prevOk=i>0 && storyUnlocked(STORY_PAGES[i-1]);
    const nextOk=i<STORY_PAGES.length-1 && storyUnlocked(STORY_PAGES[i+1]);
    if(pv) pv.classList.toggle('dim', !prevOk);
    if(nx) nx.classList.toggle('dim', !nextOk); }
  rv.querySelector('.prTitle').textContent=pg.t;
  rv.querySelector('.prBody').textContent=pg.tx;
  const card=rv.querySelector('.prPage');
  card.style.animation='none'; void card.offsetWidth; card.style.animation='';
  rv.classList.remove('hidden');
  noise(0.28,0.1,900); tone(96,0.4,'sine',0.14,60); setTimeout(()=>SFX.murmur(),200); // the page turns, the walls murmur
  clearTimeout(rv._t); rv._t=setTimeout(()=>{ rv.classList.add('hidden'); _storyCur=null; }, 30000);
  openStoryPanel(); // refresh badges
  try{ storyPulse(); }catch(e){}
}
function storyPulse(){ const b=$('storyBtn'); if(b) b.classList.toggle('pulse', storyUnreadCount()>0); }

/* HOUSE RANK — 100 planned levels. Every rank pays something; every 5th pays forever; every 10th changes the game. */
const RANK_KEY='am_rank_v1';
let RANK={marks:0, rank:1, _ld:0};
const RANK_TITLES=['FRESH MEAT','PATRON','GAMBLER','HIGH ROLLER','DEBTOR','MARKED SOUL','HOUSE FAVORITE','PIT FIEND','CROUPIER OF BONES','VAULT KIN','HOUSE SHADOW','CARD BARON','BONE MARQUIS','GILT SOVEREIGN',"DEATH'S CONSORT",'WHEEL WARDEN','ASH ROYAL','THE CROWNED DEBT','MIDNIGHT MAGNATE','THE HOUSE ITSELF'];
const RANK_MILESTONES={
 10:{r:'START AT LEVEL 2',            ap:()=>{ pending.push({}); }},
 20:{r:'+10 STARTING BLOOD',          ap:()=>{ P.maxHp+=10; P.hp+=10; }},
 30:{r:'START WITH 20 COINS',         ap:()=>{ P.coins+=20; }},
 40:{r:'GOLDEN SPIN +2%',             ap:()=>{ P.goldenBoost=(P.goldenBoost||0)+0.02; }},
 50:{r:'FINAL PRESS STARTS +2%',      ap:()=>{ P.pressBase=(P.pressBase||0)+0.02; }},
 60:{r:'CURSES 15% SHORTER',          ap:()=>{ P.curseCut=Math.min(P.curseCut||1,0.85); }},
 70:{r:'VAULT PRICES −8%',            ap:()=>{ P.vaultDisc=(P.vaultDisc||0)+0.08; }},
 80:{r:'RAGE FEED +15%',              ap:()=>{ P.ovFeed=(P.ovFeed||1)*1.15; }},
 90:{r:'FINAL PRESS STARTS +2%',      ap:()=>{ P.pressBase=(P.pressBase||0)+0.02; }},
 100:{r:'ALL COINS +15% — THE HOUSE IS YOURS', ap:()=>{ P.coinMult=(P.coinMult||1)*1.15; }}
};
const RANK_FIVES=[
 {r:'+2% COINS FOREVER', ap:()=>{ P.coinMult=(P.coinMult||1)+0.02; }},
 {r:'+2% XP FOREVER',    ap:()=>{ P.xpMult=(P.xpMult||1)*1.02; }},
 {r:'+4 SPEED FOREVER',  ap:()=>{ P.speed+=4; }},
 {r:'+5 BLOOD FOREVER',  ap:()=>{ P.maxHp+=5; P.hp+=5; }},
 {r:'+1% CRIT FOREVER',  ap:()=>{ P.crit=Math.min(0.9,(P.crit||0)+0.01); }}
];
function buildRanks(){
  const roman=['I','II','III','IV','V'], out=[];
  for(let r=1;r<=100;r++){
    const e={n:RANK_TITLES[Math.floor((r-1)/5)]+' '+roman[(r-1)%5]};
    if(RANK_MILESTONES[r]){ e.r=RANK_MILESTONES[r].r; e.ap=RANK_MILESTONES[r].ap; }
    else if(r%5===0){ const f=RANK_FIVES[(r/5)%5]; e.r=f.r; e.ap=f.ap; }
    else if(r>1){ e.g=12+r*2; e.r='+'+e.g+' GILT'; }
    out.push(e);
  }
  return out;
}
const RANKS=buildRanks();
function rkStep(k){ return Math.round(135*Math.pow(k,0.875)); }
function rkCum(n){ let t=0; for(let k=1;k<n;k++) t+=rkStep(k); return t; }
function rankFromMarks(m){ let r=1; while(r<RANKS.length && m>=rkCum(r+1)) r++; return r; }
async function loadRank(){ try{ if(!store)return; const v=await store.get(RANK_KEY); if(v&&v.value){ const o=JSON.parse(v.value); RANK.marks=o.marks||0; RANK.rank=o.rank||1; } }catch(e){}
  // new curve, never a demotion: old saves land at whichever is HIGHER
  RANK.rank=Math.min(RANKS.length, Math.max(RANK.rank, rankFromMarks(RANK.marks))); }
async function saveRank(){ try{ if(!store)return; await store.set(RANK_KEY,JSON.stringify({marks:RANK.marks,rank:RANK.rank}),false); }catch(e){} }
function awardMarks(m){
  RANK.marks+=m; let up=false, reward='';
  while(RANK.rank<RANKS.length && RANK.marks>=rkCum(RANK.rank+1)){
    RANK.rank++; up=true; const rk=RANKS[RANK.rank-1]; reward=rk.r||'';
    if(rk.g){ gilt+=rk.g; saveGilt(); }
  }
  saveRank();
  if(up){ // the two-beat ceremony: what you unlocked, then what's next
    const cur=RANKS[RANK.rank-1], nx=RANKS[RANK.rank];
    setTimeout(()=>{ announce('⚜ RANK '+RANK.rank+' — '+cur.n+' · UNLOCKED: '+(cur.r||'THE TITLE')+' ⚜', true); SFX.seraph(); }, 500);
    if(nx) setTimeout(()=>{ announce('▲ NEXT: '+nx.n+' — '+(nx.r||'')+' ▲', true); }, 2600);
    { const arm=Object.keys(WEAPON_UNLOCKS).find(id=>WEAPON_UNLOCKS[id]===RANK.rank);
      if(arm){ const wd=WEAPONS.find(x=>x.id===arm);
        if(wd) setTimeout(()=>{ announce('🗡 '+wd.n.toUpperCase()+' JOINS THE HOUSE — '+wd.g+' 🗡', true); SFX.rarSting(RAR_TIER[wd.rar]||1); flash(0.4,GLYPH_COL[wd.id]||'#ffd36b'); }, 3500); } }
    if(STORY_PAGES.some(pg=>pg.r===RANK.rank)) setTimeout(()=>{ announce('📜 A LEDGER PAGE BURNS INTO MEMORY 📜', true); SFX.murmur(); SFX.tingle(); try{ storyPulse(); }catch(e){} }, 4400);
  }
  const base=rkCum(RANK.rank), next=RANK.rank<RANKS.length?rkCum(RANK.rank+1):base+1;
  return { up, reward, have:RANK.marks-base, need:next-base, pct:Math.min(100,Math.round((RANK.marks-base)/(next-base)*100)) };
}
function applyRankPerks(){
  for(let r=2;r<=RANK.rank;r++){ const e=RANKS[r-1]; if(e&&e.ap){ try{ e.ap(); }catch(x){} } }
}
