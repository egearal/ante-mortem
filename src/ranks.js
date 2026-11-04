"use strict";
// Leaderboard retired 2026-07 (director's call). Stored data under 'antemortem_board_v1' is preserved, just unread.
const GILT_KEY='antemortem_gilt_v1';
/* ============================================================
   ACHIEVEMENTS — 1000+ procedurally generated, toasts, records
   ============================================================ */
const ACH_KEY='antemortem_ach_v2';
let LT={kills:0,coins:0,runs:0,deaths:0,diceWins:0,perfects:0,curses:0,skillLost:0,triples:0,pairs:0,ladders:0,spins:0,bossKills:0,gilt:0,gilded:0,killsBy:{},bossBy:{}};
let REC={level:0,wave:0,kills:0,score:0,weaponLv:0,streak:0,minutes:0};
// THE BOOKS — top-10 all-time per stat, persisted with the feats (additive key)
let REC10={};
function rec10Place(stat, v){
  if(!v || v<=0) return 0;
  const a=REC10[stat]=(REC10[stat]||[]);
  const entry={v, d:new Date().toISOString().slice(0,10)};
  a.push(entry); a.sort((x,y)=>y.v-x.v); if(a.length>10) a.length=10;
  const i=a.indexOf(entry);
  return i>=0 ? i+1 : 0;
}
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
  pactbreaker:['PACT BREAKER','Take from the red table thrice, and never roll.','Took 3 red-table offers in one night without dicing.'],
  highroller:['HIGH ROLLER','Pay a three-figure cut for one case.','Paid 100+ coins to unseal the wheel.'],
  sixsix:['THE BEAST\'S HOUR','Fall when the clock lies about the number of the beast.','Died at 6:66 on the run clock (7:06).'],
  redone:['ONE DROP LEFT','Leave the red table paid, with a single drop in you.','Won a red table offer at 1 HP.'],
  blessedgod:['THE FOURTH DIE','Ride all four dice where the felt runs red.','Earned the HOUSE\'S BLESSING.'],
  untouched60:['THE UNTOUCHED MINUTE','Let the last minute pass without a scratch.','Reached foreclosure untouched for the final 60s.'],
  fountgold:['BATHED IN FIRE','Drink from the well while you burn.','Healed at the fountain during Fever.'],
  snake2:['TWIN SERPENTS','Two pairs of serpent eyes at one sitting.','Rolled snake eyes twice in one table.'],
  voucher3:['THE HOARDER','Hoard three favors unspent.','Held 3 house vouchers at once.'],
  allpages:['ONE CANDLE','Read eight pages by a single candle.','Read 8 ledger pages in one sitting.'],
  curse3:['HEXWEARER','Wear three hexes and keep walking.','Carried 3 curses at once.'],
  dodger:['FIVE UNBLED','Reach the fifth minute without bleeding once.','Took zero damage before 5:00.'],
  maxlove:['THE FINAL EDGE','Take one blade to its final edge.','Maxed a weapon to its level cap.'],
  sealfive:['ONE BREATH','Drain the vault of five seals in one breath.','Bought 5 vault seals in a single run.'],
  chained3:['CHAINBREAKER','Break three chains from a single case.','Snapped a 3-chain sealed case.'],
  richman:['THE WEIGHTED POCKET','Let three hundred coins weigh you down.','Held 300 coins at once.'],
  mortem:['THE OTHER HALF','The door knows both halves of its own name.','Typed the second word at the door.'],
  fasthands:['FAST HANDS','Thirty souls before the second wave learns your name.','30 kills within the first two waves.'],
  pacifist:['THE OBJECTOR','A minute and a half of mercy in a merciless house.','Reached 1:30 of a run with zero kills.'],
  arsenal5:['FIVE BLADES','Carry five instruments of the trade at once.','Held 5 weapons in one night.'],
  level15:['FIFTEENTH CHARGE','Fifteen levels in a single night.','Reached level 15 in one run.'],
  max3arms:['THREE FINAL EDGES','Three blades honed past improving.','Maxed 3 weapons in one night.'],
  curse0:['UNHEXED','Ten minutes without wearing a single hex.','Reached 10:00 with zero curses taken.'],
  pauper:['THE EMPTY POCKET','Walk four minutes owning nothing at all.','Reached 4:00 with zero coins.'],
  blood1:['THE LONG BLEED','Half a minute lived below a tenth of your blood.','Survived 30s straight under 10% HP.'],
  overheal:['THE RESERVOIR','Two hundred drops in one body.','Reached 200 max blood.'],
  speed99:['THE DRAUGHT','Outrun the House\'s patience.','Reached 350 move speed.'],
  damage100:['THE HEAVY HAND','A hundredweight behind every blow.','Reached 100 damage.'],
  pickup200:['THE LONG ARM','Nothing on the floor is out of reach.','Reached 200 pickup range.'],
  streak200:['TWO HUNDRED','Two hundred souls without letting the count die.','Reached a 200 kill streak.'],
  wave20:['THE TWENTIETH TIDE','Stand when the twentieth wave breaks.','Reached wave 20.'],
  dice10:['TEN BONES','Ten dice rungs won in a single night.','Won 10 dice rolls in one run.'],
  cartomancer:['CARTOMANCER','Fifty cards read from the marble.','Read 50 tarot cards, lifetime.'],
  wheelwarden:['WHEEL WARDEN','Twenty-five spins of the chained case.','Spun the Wheel of Souls 25 times, lifetime.'],
  seals20:['TWENTY SEALS','Twenty permanent marks of gilt on your soul.','Bought 20 vault seals, lifetime.'],
  gilt10k:['THE FIRST FORTUNE','Ten thousand teeth in the bank.','Held 10,000 gilt.'],
  marks10k:['TEN THOUSAND MARKS','The ladder remembers every one.','Earned 10,000 lifetime marks.'],
  rank25:['THE QUARTER CLIMB','A quarter of the way to the seat.','Reached HOUSE RANK 25.'],
  rank50:['THE HALFWAY HOUSE','Half the ladder behind you.','Reached HOUSE RANK 50.'],
  rank75:['THE HIGH FLOORS','Three quarters up. The air is thinner. The stakes are not.','Reached HOUSE RANK 75.'],
  deaths50:['FIFTY FUNERALS','Die fifty times and still come back for the reels.','50 lifetime deaths.'],
  kills25k:['THE RECKONING','Twenty-five thousand souls by your hand.','25,000 lifetime kills.'],
  runs50:['FIFTY NIGHTS','Fifty antes. The chair knows your shape.','50 lifetime runs.'],
  hours5:['THE FIFTH HOUR','Five hours of your death spent at the table.','5 hours lifetime playtime.'],
  fevers10:['SERIAL BURNER','Ten fevers survived — or enjoyed.','Entered Fever 10 times, lifetime.'],
  perfects5:['FIVE TWELVES','Boxcars, five times over.','Rolled 5 PERFECT 12s, lifetime.'],
  ladders10:['LADDER MONK','Ten dice ladders climbed to the top.','Completed 10 full dice ladders, lifetime.'],
  estate50:['HALF THE HOUSE','Half of everything, catalogued and claimed.','Reached 50% estate.'],
  pressmax:['THE CEILING','Press your life to the very cap of mercy.','Hit the DEATH ROLL press cap.'],
  bounty10:['HEADHUNTER','Ten bounties collected in the House\'s name.','Claimed 10 bounties, lifetime.'],
  chests20:['GIFT HISTORIAN','Twenty gifts opened, mimics notwithstanding.','Opened 20 chests, lifetime.'],
  gods5:['FIVE CROWNS','GOD LEVEL, five times over.','Reached GOD LEVEL 5 times, lifetime.'],
  unspent:['UNSPENT','Die holding a fortune you never touched.','Died with 500+ coins.'],
  mayfly:['THE MAYFLY','A whole night, over in half a minute.','Died before 0:30.'],
  fullnight:['THE FULL NIGHT','See the fifteenth minute with your own eyes.','Reached foreclosure.'],
  triple2:['TWICE-BORN TRIPLES','Two triples pulled in a single night.','Landed 2 triples in one run.'],
  arsenal6:['SIX BLADES','Six instruments. No hands left for prayer.','Held 6 weapons in one night.','vr'],
  skillmonk:['THE BARE-HANDED','Five minutes on blades alone — not one skill taken.','Reached 5:00 with zero skills.','vr'],
  level20:['TWENTIETH CHARGE','Twenty levels in one night. The reels are frightened.','Reached level 20 in one run.','vr'],
  wave25:['THE SILVER TIDE','The twenty-fifth wave, and still standing.','Reached wave 25.','vr'],
  dice15:['FIFTEEN BONES','Fifteen rungs in one night.','Won 15 dice rolls in one run.','vr'],
  gilt50k:['THE DEEP VAULT','Fifty thousand teeth. The mill hums your name.','Held 50,000 gilt.','vr'],
  estate75:['THE MAJOR SHAREHOLDER','Three quarters of the House in your name.','Reached 75% estate.','vr'],
  perfrow:['THE IMPOSSIBLE ROW','Three perfect twelves at one sitting.','3 PERFECT 12s in one table.','vr'],
  chapelblessed:['CHAPEL RITES','Earn the blessing where the light is holy.','HOUSE\'S BLESSING on THE CHAPEL floor.','vr'],
  gold600:['THE DRAGON\'S POCKET','Six hundred coins, carried, jingling.','Held 600 coins at once.','vr'],
  deathless:['DEATHLESS','Let death walk beside you for two whole minutes, and never once be touched.','Survived THE HOUSE\'s reign (13:00–15:00) untouched. Pays 1,000 gilt.','myth'],
};
// THE SWEEP — cheap threshold whispers, checked every ~5s from the update loop
function whisperSweep(){
  if(!P || state!=='playing') return;
  const t0=window._gt0||0, rt=gt-t0;
  const arms=WEAPONS.filter(w=>(P.wlv[w.id]||0)>0).length;
  const armsMax=WEAPONS.filter(w=>(P.wlv[w.id]||0)>=w.max).length;
  if(wave<=2 && P.kills>=30) secret('fasthands','FAST HANDS');
  if(rt>=90 && P.kills===0) secret('pacifist','THE OBJECTOR');
  if(arms>=5) secret('arsenal5','FIVE BLADES');
  if(arms>=6) secret('arsenal6','SIX BLADES');
  if(armsMax>=3) secret('max3arms','THREE FINAL EDGES');
  if(P.level>=15) secret('level15','FIFTEENTH CHARGE');
  if(P.level>=20) secret('level20','TWENTIETH CHARGE');
  if(rt>=600 && (RUN.curses||0)===0) secret('curse0','UNHEXED');
  if(rt>=240 && P.coins===0) secret('pauper','THE EMPTY POCKET');
  if(rt>=300 && (!P.passiveList||!P.passiveList.length)) secret('skillmonk','THE BARE-HANDED');
  if(P.hp/P.maxHp<0.10){ P._lowT=(P._lowT||0)+5; if(P._lowT>=30) secret('blood1','THE LONG BLEED'); } else P._lowT=0;
  if(P.maxHp>=200) secret('overheal','THE RESERVOIR');
  if(P.speed>=350) secret('speed99','THE DRAUGHT');
  if(P.damage>=100) secret('damage100','THE HEAVY HAND');
  if(P.pickup>=200) secret('pickup200','THE LONG ARM');
  if(killStreak>=200) secret('streak200','TWO HUNDRED');
  if(wave>=20) secret('wave20','THE TWENTIETH TIDE');
  if(wave>=25) secret('wave25','THE SILVER TIDE');
  if((RUN.diceWins||0)>=10) secret('dice10','TEN BONES');
  if((RUN.diceWins||0)>=15) secret('dice15','FIFTEEN BONES');
  if(P.coins>=600) secret('gold600',"THE DRAGON'S POCKET");
  if((LT.tarot||0)>=50) secret('cartomancer','CARTOMANCER');
  if((LT.wheel||0)>=25) secret('wheelwarden','WHEEL WARDEN');
  if((LT.seals||0)>=20) secret('seals20','TWENTY SEALS');
  if(gilt>=10000) secret('gilt10k','THE FIRST FORTUNE');
  if(gilt>=50000) secret('gilt50k','THE DEEP VAULT');
  if(RANK.marks>=10000) secret('marks10k','TEN THOUSAND MARKS');
  if(RANK.rank>=25) secret('rank25','THE QUARTER CLIMB');
  if(RANK.rank>=50) secret('rank50','THE HALFWAY HOUSE');
  if(RANK.rank>=75) secret('rank75','THE HIGH FLOORS');
  if((LT.deaths||0)>=50) secret('deaths50','FIFTY FUNERALS');
  if((LT.kills||0)>=25000) secret('kills25k','THE RECKONING');
  if((LT.runs||0)>=50) secret('runs50','FIFTY NIGHTS');
  if((LT.minutes||0)>=300) secret('hours5','THE FIFTH HOUR');
  if((LT.fevers||0)>=10) secret('fevers10','SERIAL BURNER');
  if((LT.perfects||0)>=5) secret('perfects5','FIVE TWELVES');
  if((LT.ladders||0)>=10) secret('ladders10','LADDER MONK');
  if((LT.bounty||0)>=10) secret('bounty10','HEADHUNTER');
  if((LT.chests||0)>=20) secret('chests20','GIFT HISTORIAN');
  if((LT.gods||0)>=5) secret('gods5','FIVE CROWNS');
  if((RUN.pulls&&((RUN.pulls._tr3||0)>=2))) secret('triple2','TWICE-BORN TRIPLES');
  try{ if(typeof estatePct==='function'){ const ep=estatePct(); if(ep>=50) secret('estate50','HALF THE HOUSE'); if(ep>=75) secret('estate75','THE MAJOR SHAREHOLDER'); } }catch(e){}
}
const WHISPER_TOTAL=Object.keys(WHISPERS).length;
let secPaid=false;
function secret(id,name){
  if(SEC.has(id)) return; SEC.add(id); achSaveSoon();
  gilt+=25; saveGilt(); // every whisper answered pays
  announce('🗝 SECRET — '+name+' · +25 GILT 🗝', true);
  { const wt=((typeof WHISPERS!=='undefined'&&WHISPERS[id])||[])[3]; // motifs rise with the whisper's tier
    if(wt==='vr'){ SFX.secretFound(); setTimeout(()=>SFX.dingBells(),320); }
    else if(wt){ SFX.seraph(); SFX.secretFound(); setTimeout(()=>SFX.dingBells(),420); }
    else SFX.secretFound(); }
  sparkBurst(26); flash(0.3,'#c98bff'); coinRain(8);
  LT.secrets=SEC.size; bump('secrets',SEC.size);
  // the card-flip reveal: the riddle burns, the truth stands in gold
  try{ const w=WHISPERS[id];
    if(w){ let rv=$('secretReveal');
      if(!rv){ rv=document.createElement('div'); rv.id='secretReveal'; document.body.appendChild(rv); }
      rv.innerHTML='<div class="srCard"><div class="srRiddle">“'+w[1]+'”</div><div class="srName">🗝 '+w[0]+'</div><div class="srPay">+25 ◈ GILT</div></div>';
      rv.classList.remove('hidden','go'); void rv.offsetWidth; rv.classList.add('go');
      setTimeout(()=>rv.classList.add('hidden'), 2600); } }catch(e){}
  // THE GRAND SECRET — all whispers answered: the House bows
  if(SEC.size>=WHISPER_TOTAL && !LT.equal){ LT.equal=true; achSaveSoon();
    setTimeout(()=>{ announce("♛ THE HOUSE'S EQUAL — ALL WHISPERS ANSWERED ♛", true);
      SFX.seraph&&SFX.seraph(); if(typeof bigWin==='function') bigWin("THE HOUSE'S EQUAL",4);
      if(typeof domConfetti==='function') domConfetti(30); }, 2800); }
  try{ idxBump(); }catch(e){}
}
// proximity murmur — one step from a secret, the walls lean in (once per run each)
function nearWhisper(id){
  if(SEC.has(id) || !P) return;
  P._nw=P._nw||new Set(); if(P._nw.has(id)) return; P._nw.add(id);
  try{ whisper(); }catch(e){ SFX.murmur&&SFX.murmur(); }
  showStreak('… THE WALLS LEAN IN …');
}
let keyBuf='', konamiIdx=0;
const KONAMI=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
function feedSecretKeys(k){
  if(k===KONAMI[konamiIdx]){ konamiIdx++; if(konamiIdx>=KONAMI.length){ konamiIdx=0; secret('konami','THE OLD CODE'); if(P&&state==='playing'){ P.coins+=30; coinRain(12); } } }
  else konamiIdx=(k===KONAMI[0])?1:0;
  if(k.length===1 && /[a-z0-9]/.test(k)){ keyBuf=(keyBuf+k).slice(-12);
    if(keyBuf.endsWith('ante')) secret('ante','HOUSE PASSWORD');
    if(keyBuf.endsWith('mortem')){ secret('mortem','THE OTHER HALF'); flash(0.5,'#8b1620'); }
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
let IDX={w:[],p:[],c:[],t:[],e:[],b:[],st:[],sl:'vesper',fl:'pit',ct:[],ind:[],ctSlots:1};
let _idxT=null;
function idxSee(cat,id){ if(!id||typeof IDX==='undefined') return; const a=IDX[cat]; if(!a||a.indexOf(id)>=0) return; a.push(id); idxSaveSoon(); idxBump(); }
function idxTotal(){ return WEAPONS.length + PASSIVES.length + DEBUFF_POOL.length + TAROT_FATES.length + Object.keys(CFG.enemy).length + WHISPER_TOTAL; } // CFG.enemy already includes the 4 bosses
function idxSeen(){ return IDX.w.length+IDX.p.length+IDX.c.length+IDX.t.length+IDX.e.length+IDX.b.length+SEC.size; }
function idxPct(){ return Math.min(100,Math.floor(idxSeen()/idxTotal()*100)); }
function idxBump(){ bump('index', idxPct()); }
function idxSaveSoon(){ clearTimeout(_idxT); _idxT=setTimeout(idxSave, 800); }
async function idxSave(){ try{ if(!store)return; await store.set(IDX_KEY,JSON.stringify(IDX),false); }catch(e){} }
async function idxLoad(){ try{ if(!store)return; const r=await store.get(IDX_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); for(const k of ['w','p','c','t','e','b','st','ct','ind']) if(Array.isArray(o[k])) IDX[k]=o[k];
  if(typeof o.ctSlots==='number') IDX.ctSlots=Math.min(3,Math.max(1,o.ctSlots|0));
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
function applyAchPerks(){ if(DLY_RNG) return; for(const id in ACH_PERKS){ const pk=ACH_PERKS[id]; if(pk.ap && unlocked.has(id)) try{ pk.ap(); }catch(e){} } }
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
async function saveAch(){ try{ if(!store)return; await store.set(ACH_KEY,JSON.stringify({v:3,u:[...unlocked],LT,REC,V:VAULT.lv,S:[...SEC],SP:secPaid,R10:REC10}),false); }catch(e){} }
async function loadAch(){ try{ if(!store)return; const r=await store.get(ACH_KEY,false); if(r&&r.value){ const o=JSON.parse(r.value); unlocked=new Set(o.u||[]); Object.assign(LT,o.LT||{}); Object.assign(REC,o.REC||{}); VAULT.lv=o.V||{}; (o.S||[]).forEach(x=>SEC.add(x)); secPaid=!!o.SP; REC10=o.R10||{};
  for(const k9 in REC10){ if(Array.isArray(REC10[k9])) REC10[k9]=REC10[k9].slice(0,10); else delete REC10[k9]; } // 326: ledgers hold ten nights, no matter what was pasted in
  ['runs','coins','deaths','minutes','spins','kills'].forEach(k9=>{ if(LT[k9]!==undefined) LT[k9]=+LT[k9]||0; }); // 324: a bad payload cannot NaN the HUD
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
  $('idxCount').textContent=seen+' / '+tot+' CATALOGUED — you hold '+idxPct()+'% of everything the House owns';
  $('idxProg').style.width=(seen/tot*100).toFixed(1)+'%';
  const tile=(got,g,n,c)=>{ let tip=''; const bar=n.indexOf('|');
    if(bar>=0){ tip=n.slice(bar+1); n=n.slice(0,bar); }
    return got? '<div class="idxTile on"'+(tip?' data-tip="'+tip.replace(/"/g,'&quot;')+'" data-name="'+n.replace(/"/g,'&quot;')+'"':'')+' style="--ic:'+c+'"><span class="idxG">'+g+'</span>'+n+'</div>'
              : '<div class="idxTile"><span class="idxG">?</span>???</div>'; };
  const sec=(ico,name,col,rows)=>{ const got=rows.filter(r=>r[0]).length;
    return '<div class="idxSec" style="--sc:'+col+'"><div class="idxSecH"><b>'+ico+' '+name+'</b><span>'+got+' / '+rows.length+' · '+Math.round(got/Math.max(1,rows.length)*100)+'%</span></div><div class="idxGrid">'
      +rows.map(r=>tile(r[0],r[1],r[2],r[3])).join('')+'</div></div>'; };
  if(!list._tipWired){ list._tipWired=true;
    list.addEventListener('mouseover',ev=>{ const el=ev.target.closest('.idxTile[data-tip]'); if(!el) return;
      const tp=$('relicTip'); tp.innerHTML='<b>'+el.dataset.name+'</b><br>'+el.dataset.tip; tp.classList.remove('hidden');
      const r9=el.getBoundingClientRect(); tp.style.right=(innerWidth-r9.left+10)+'px'; tp.style.top=(r9.top-6)+'px'; });
    list.addEventListener('mouseout',ev=>{ if(ev.target.closest('.idxTile')) $('relicTip').classList.add('hidden'); });
    list.addEventListener('click',ev=>{ if(ev.target.closest('.ldBooks')){ openBooks(); return; }
      const wt=ev.target.closest('.wsp:not(.on)');
      if(wt){ const idx=[...wt.parentNode.children].indexOf(wt); const id=Object.keys(WHISPERS)[idx]; const w=WHISPERS[id];
        if(!w || SEC.has(id)) return;
        if(gilt<500){ SFX.thud(); showStreak('… A HINT COSTS 500 GILT …'); return; }
        gilt-=500; saveGilt(); const word=w[0].split(' ')[0];
        wt.innerHTML='<i>“'+w[1]+'”</i><b style="display:block;color:#c98bff;font-size:10px;letter-spacing:.14em;margin-top:4px">HINT: '+word+' …</b>';
        SFX.chipStack(); SFX.murmur(); flash(0.2,'#c98bff');
      } } ); }
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
   +('<div class="idxSec" style="--sc:#e8b64c"><div class="idxSecH"><b>⚜ THE LADDER</b><span>RANK '+RANK.rank+' / 100 · <i class="ldBooks">📖 THE BOOKS</i></span></div><div class="ldWrap">'
     +RANKS.map((e,i)=>{ const r=i+1;
        const cls=r===RANK.rank?' now':(r>RANK.rank&&r<=RANK.rank+3?' soon':(r<RANK.rank?' done':''));
        const arm=Object.keys(WEAPON_UNLOCKS).find(id=>WEAPON_UNLOCKS[id]===r);
        const wd=arm&&WEAPONS.find(x=>x.id===arm);
        return '<div class="ldRow'+cls+'"><b>'+r+'</b><span class="ldN">'+e.n+'</span>'
          +'<span class="ldM">'+rkCum(r).toLocaleString()+' ◈</span>'
          +'<span class="ldR">'+(e.r||'')+(wd?(' <em style="color:'+(GLYPH_COL[wd.id]||'#ff9a3c')+'">⚔ '+wd.n+'</em>'):'')+'</span></div>';
      }).join('')
     +'</div><div class="idxHint">MARKS raise your rank. Every rung pays — gilt, blood, or a blade.</div></div>')
   +'<div class="idxSec" style="--sc:#c98bff"><div class="idxSecH"><b>🗝 THE WHISPERS</b><span>'+SEC.size+' / '+WHISPER_TOTAL+'</span></div><div class="wspGrid">'
     +Object.keys(WHISPERS).map(id=>{ const w=WHISPERS[id], got=SEC.has(id), tier=w[3]||'';
        const tc=tier==='myth'?' myth':(tier==='vr'?' vrare':'');
        return got? '<div class="wsp on'+tc+'" data-name="'+w[0].replace(/"/g,'&quot;')+'" data-tip="'+w[2].replace(/"/g,'&quot;')+'">🗝 <b>'+w[0]+'</b></div>'
                  : '<div class="wsp'+tc+'"><i>“'+w[1]+'”</i></div>'; }).join('')
     +'</div><div class="idxHint">Each whisper answered pays 25 GILT. The riddles are the walls talking.</div></div>';
  p.classList.remove('hidden');
  { const now=list.querySelector('.ldRow.now'); if(now) now.scrollIntoView({block:'center'}); }
}


/* ============================================================
   THE LEDGER PAGES — the House writes what it ate. 16 pages;
   13 unlock by HOUSE RANK, 3 by whispers answered. Read state
   lives in IDX.st (am_index_v1, additive field).
   ============================================================ */
const STORY_PAGES=[
 {id:"c1", r:1, t:"THE ARRIVAL", tx:"You died owing. Not money \u2014 money the House has. You died owing YOURSELF, the only coin it cannot mint. So it sent the carriage. The horses had no eyes and did not need them; the road only goes one way."},
 {id:"c2", r:2, t:"THE TERMS", tx:"The Dealer read them aloud while your blood was still deciding whether to stay: ONE SOUL, STAKED. Interest compounds nightly. Winnings pay the principal. Clear the debt entire and the front door opens. The Dealer smiled when it said that. It has no face. It smiled anyway."},
 {id:"c3", r:3, t:"THE SIGNATURE", tx:"You do not remember signing. Nobody does. The House holds that a death is a signature \u2014 the oldest kind, it says, the only one no lawyer has ever broken. Your name on the ledger is written in a hand you recognize. It is yours. It is shaking."},
 {id:"c4", r:4, t:"THE FIRST NIGHT", tx:"They gave you a floor of marble and a courtyard of the damned and they said: survive until the clock forgives you. You asked what happens at fifteen. The croupier laughed so hard a tooth fell out. Someone picked it up and spent it."},
 {id:"c5", r:5, t:"THE INTEREST", tx:"Understand the arithmetic of this place: every night you fail to win yourself back, you are worth slightly less. Not much. A sliver. The House shaves souls the way a crooked grocer shaves ham \u2014 smiling, chatting, thumb on the scale."},
 {id:"c6", r:6, t:"THE MARKER", tx:"Under your skin, left wrist, something small and square. That is the marker \u2014 one stay of execution, pre-paid. When death comes early, the House lets you PRESS for your life, because watching you mash that button is the funniest thing the pit boss has ever seen."},
 {id:"c7", r:7, t:"THE CLOCK", tx:"The clock over the floor has thirteen numbers and none of them is now. It counts something else: how much of the night the House has already eaten. At fifteen minutes it is full. Nothing you love has ever happened after fifteen."},
 {id:"c8", r:8, t:"THE CHIPS", tx:"Turn one over. Feel it hum. Every chip in the House is pressed from a patron who stopped playing \u2014 ground fine, mixed with candle-wax, pressed in the cellar mill. When you spend one it screams, too high to hear. The racks refill nightly."},
 {id:"c9", r:9, t:"THE ODDS", tx:"Posted over every table, in gold leaf, entirely honest: THE HOUSE ALWAYS BLEEDS. Not wins \u2014 bleeds. It wants you to hurt it. A casino that cannot lose is a slaughterhouse, and slaughterhouses get no repeat customers. The House is subtler than that. It is a farm."},
 {id:"c10", r:10, t:"WHAT YOU ARE OWED", tx:"One thing, and the House will honor it to the letter: a game. Real reels, real dice, real odds it publishes and keeps. It will never cheat you. It does not have to. It has time, darling, and you have fifteen minutes."},
 {id:"c11", r:11, t:"THE PIT", tx:"The pit is not a room. Rooms end. Walk any direction long enough and you arrive where you started, slightly older, slightly poorer, applause from nowhere. The regulars call it the honest mile. It is the only track where everyone is the horse."},
 {id:"c12", r:12, t:"THE PATRON MASSES", tx:"The shamblers, the swarm, the whole rotting court \u2014 they do not hate you. They are CHEERING. Every soul you cut down is one hand closer to your seat at the last table, and your seat is the only exit any of them has ever seen. They die hoping. They die jealous."},
 {id:"c13", r:13, t:"THE FOUNTAIN", tx:"You have drunk from it. You noticed it was warm. You chose not to think about that, which the House appreciates \u2014 squeamish players bet small. Drink, darling. It is freely given. Whose it was matters so much less than whose it is now."},
 {id:"c14", r:14, t:"THE FLOOR BET", tx:"The roulette sunk into the marble takes no chips. Stand on it and it reads you \u2014 weighs the night's fear against the night's greed and pays in whichever you have less of. Sometimes it pays in teeth. The wheel is old. Its jokes are older."},
 {id:"c15", r:15, t:"THE GIFTS", tx:"Sometimes a chest. Sometimes a mimic wearing a chest the way you wear your face. The House leaves both with love. It genuinely cannot tell the difference anymore, and it has stopped trying, and honestly neither can you."},
 {id:"c16", r:16, t:"THE VAULT DOOR", tx:"A wheel of gold in the floor, locked until the third minute because the House believes in foreplay. Behind it: everything you have ever paid, melted down and priced back to you at compound interest. The vault does not sell power. It sells your own funeral flowers, arranged."},
 {id:"c17", r:17, t:"THE WHEEL OF SOULS", tx:"It arrives chained, because the last thing it gave away was too generous and the House had to have a talk with it. Snap the chains. Spin it. Somewhere between CONSUMER blue and the HOUSE BLADE gold is the exact measure of what tonight thinks you deserve."},
 {id:"c18", r:18, t:"THE ASCENT", tx:"The green gate opens on a ladder of multipliers and a single rule: ride it or bank it. 1.77, 2.77, 3.69 \u2014 and 7.77, which the House calls the ceiling and the regulars call the lie, because no one riding at 7.76 has ever once wanted to stop."},
 {id:"c19", r:19, t:"THE TAROT", tx:"Cards grow from the marble like pale flowers. Pick them. Most bless, some curse, and the deck keeps its own census. The Magician is in there somewhere, burning. The House confiscated his hands centuries ago. He deals anyway. Respect that."},
 {id:"c20", r:20, t:"THE GOLDEN WAVE", tx:"Every seventh wave comes gilded \u2014 souls plated in the House's own metal, waddling under the weight of what they swallowed. Kill them gently. What pours out was going to be your inheritance either way."},
 {id:"c21", r:21, t:"THE HANDS", tx:"Below the wrists, the Dealer is beautiful. Long pale fingers, a shuffle like water. The wrists themselves end in iron cuffs, bolted through the table. The rest of the Dealer was paid out long ago, to a player better than you. The hands keep dealing. They have no choice, and neither, now, do you."},
 {id:"c22", r:22, t:"THE SHUFFLE", tx:"Watch closely: the hands never repeat a shuffle. Not once in nine thousand years. Asked why, the House said cards remember, and a remembered shuffle is a debt, and it would rather die than owe. Everyone laughed. The chandeliers did not."},
 {id:"c23", r:23, t:"THE REELS", tx:"Three windows, twenty-two symbols, weights published on the paytable like scripture. The reels are the only honest thing you will ever love. They do not care that you need it. They do not care that you don't. That, darling, is what honest means."},
 {id:"c24", r:24, t:"THE MATCH LAW", tx:"One of a kind seats you at level one. A pair seats you at two. Three of a kind \u2014 the reels standing up together, all agreeing on you at once \u2014 fills the cup to the brim. It happens. The House has seen it happen twice in a week. It still talks about that week."},
 {id:"c25", r:25, t:"THE DICE", tx:"Two bones, six faces each, and a ladder that climbs from eight. Every rung won is a level. Every rung missed is a lesson wearing a curse's coat. The third rung misses differently \u2014 the third rung leaves SCARS, and scars are how the night takes attendance."},
 {id:"c26", r:26, t:"THE PERFECT TWELVE", tx:"Boxcars. The bones showing their whole hand at once. The pit goes quiet when it lands, and for exactly one breath the House remembers being young, when twelve was just a number and the wound had not yet learned to count."},
 {id:"c27", r:27, t:"THE RED TABLE", tx:"Below a fifth of your blood, the felt turns red and one of your own skills climbs onto the side table to watch. Any miss burns it. Four rungs ridden clean and the House itself leans down and BLESSES you \u2014 five seconds of divinity, double fury, untouchable. Cheap, for what it costs."},
 {id:"c28", r:28, t:"THE STAKE", tx:"The skill on the side table is not collateral. Collateral implies the House wants it. It wants the LOOK on you when it burns \u2014 that particular arithmetic behind the eyes, subtracting a piece of yourself from yourself. The House has a gallery of those looks. You are already in it."},
 {id:"c29", r:29, t:"THE BANK", tx:"Seven chips of matched pairs earn a voucher, and a voucher is the House admitting, in writing, that you were briefly better than the odds. It hates issuing them. Frame it, spend it, either way it clears you nothing at the last table. But it is lovely to hold."},
 {id:"c30", r:30, t:"THE HOUSE'S BLESSING", tx:"When it comes \u2014 and if you sit the red table long enough it will \u2014 do not thank the House. Thanking it resets the ledger of contempt you have both been keeping, and that ledger is the only game the two of you play as equals."},
 {id:"c31", r:31, t:"THE COURT", tx:"Learn the fauna. The shambler, who forgot everything but forward. The husk, who is mostly door. The wraith, who files a complaint through your ribs. The stalker, all blades and grievance. The bomber, who loved fireworks and became one. All of them yours, eventually, one way or the other."},
 {id:"c32", r:32, t:"THE SWARM", tx:"Bat-imps in their hundreds, wings of stretched apology. They were small sins \u2014 cheating at solitaire, borrowed umbrellas. The House prosecutes everything. Nothing is beneath the law of the floor. Remember that, next time you consider being only slightly damned."},
 {id:"c33", r:33, t:"THE ELITES", tx:"The violet-crowned ones hunt alone, and when they die they bless you \u2014 borrowed power, twelve seconds, eighteen if the night is generous. It is not gratitude. It is a will. Everything here writes a will, constantly, mid-stride. You are in several already."},
 {id:"c34", r:34, t:"THE WIDOW", tx:"She answered twelve whispers before anyone knew the walls could talk, and the House married her twice out of spite. She keeps grave moths now, in her sleeves, and when she plays the pit the moths eat the light around her. Ask her nothing. She answers everything, and it costs."},
 {id:"c35", r:35, t:"THE DEBTOR", tx:"He starts every night rich because the House pays interest on despair, and his is compounding. Watch him play: he bets like a man mailing letters to a house that burned down. He knows. Knowing is his stake. The House finds him hilarious and has never once said so."},
 {id:"c36", r:36, t:"THE BRUTE", tx:"Two thousand five hundred kills before breakfast, is the joke. He does not level; he insists. He walked slow before it was a handicap \u2014 says speed is for people with somewhere better to be, and there is nowhere better, and there never was. The pit agrees. The pit is his."},
 {id:"c37", r:37, t:"THE YOLK", tx:"It hatched early, in the dark, far from the lights, and the reels adore it the way old women adore anything unfinished. Tiny, quick, sixty drops of blood in total. Pairs come easier when it plays. The House cannot explain that and has stopped auditing it. Some luck is grief in disguise."},
 {id:"c38", r:38, t:"THE GHOST PATRONS", tx:"The drifting ones, translucent, still circling tables that were moved centuries ago. They are not trapped. They are REGULARS. There is a difference and it matters to them enormously, and if you pass through one on purpose it counts as a dance, and somewhere the organ notices."},
 {id:"c39", r:39, t:"THE RAVENS", tx:"An unkindness of them roosts on the gargoyles' shoulders, auditing. They belonged to the seventeen who left \u2014 left BEHIND, note, not taken along. Scatter all of them in one night and the walls will whisper about you. The ravens do not forgive it. Being startled is their only remaining possession."},
 {id:"c40", r:40, t:"THE GARGOYLES", tx:"Hunched on their plinths, eyes like banked coals. They were players once \u2014 the ones who asked to watch just one more hand after their souls were spent. The House, which honors every contract to the letter, said: forever, then. They have the best seats in the pit. Sit near them. Learn."},
 {id:"c41", r:41, t:"THE CEREMONY", tx:"Every soul the House claims, it MARRIES. There was a ceremony for you: the candles leaned in, the ravens stood witness, the organ played itself in a key that has no name. You slept through it. Everyone does. The House prefers its vows unanswered \u2014 that way they cannot be misquoted."},
 {id:"c42", r:42, t:"THE RING", tx:"Under your skin, beside the marker. You have felt it when the reels land \u2014 a small gold ache turning on the bone. The House does not consider this sinister. It considers it a marriage of assets. In its defense: it has never once been unfaithful. You are all it thinks about."},
 {id:"c43", r:43, t:"THE DOWRY", tx:"The marker is a dowry, payable on death \u2014 one PRESS at the last percentage, one chance to talk the reaper's arithmetic upward. The House pays it grudgingly, publicly, every time, because a dowry honored in front of witnesses is worth ten kept quietly. It is a romantic, in the way of collection agencies."},
 {id:"c44", r:44, t:"THE ORGAN", tx:"No one plays it. It plays itself, or rather it is played from the OTHER side, by whatever the music is standing on. Weddings, foreclosures, the seventh wave \u2014 it knows the difference before you do. If it ever plays your name, and it will, try to look surprised. It works so hard."},
 {id:"c45", r:45, t:"THE WITNESSES", tx:"The candles that leaned in at your wedding lean in still \u2014 soul-candles, drifting the floor, each one a guest who could not stop attending things. They pierce the dark for you out of ceremony, not kindness. You are the bride here. The bride gets light. That is the whole of their theology."},
 {id:"c46", r:46, t:"THE VOWS", tx:"To have and to hold, nightly, at interest. In sickness \u2014 especially in sickness. Till death do you part was struck from the contract in negotiations you were not alive for; death is how you ARRIVED. What parts you now is principal. Pay it and see."},
 {id:"c47", r:47, t:"THE TROUSSEAU", tx:"Your skills, your blades, your little constellation of powers \u2014 community property, darling. Everything you win at the tables you win INTO the marriage. This is why the red table can burn your things: legally, they are also its things. You did sleep through the ceremony. There were disclosures."},
 {id:"c48", r:48, t:"THE ANNIVERSARY", tx:"Once a night, around the third minute, the chandeliers dim a degree and the whole floor holds a breath it does not need. That is the hour of your wedding, observed. The House never misses it. Whatever else it is \u2014 and it is everything else \u2014 it remembers."},
 {id:"c49", r:49, t:"THE IN-LAWS", tx:"The pit bosses, the croupier of bones, the collector \u2014 family now. They will not be kind, but they will be PRESENT, massively, at the worst times, which the House genuinely believes is the same thing. You cannot divorce them. You can only outplay them, which \u2014 between us \u2014 is better."},
 {id:"c50", r:50, t:"THE CONSUMMATION", tx:"It has not happened yet. It is scheduled. It is what rank one hundred IS. The House does not speak of it and the walls will not whisper it, but the organ has been rehearsing something, low, for years, and it is in your key."},
 {id:"c51", r:51, t:"THE MILL", tx:"Below the marble, below the vault, the mill turns. It was turning before the House had walls; some say the House grew around the mill the way flesh grows around a splinter. What it grinds, you spend. What it cannot grind, it promotes to staff."},
 {id:"c52", r:52, t:"THE KITCHEN", tx:"There is a door behind the vault that the maps deny. Steam under it, always. What the House serves upstairs is not meat and is not bread, but the patrons weep when they taste it, because it tastes like the year they were happiest. The chef borrows your face on Sundays."},
 {id:"c53", r:53, t:"GILT", tx:"Gilt is not gold. Look closer: every coin is a tooth, capped and polished. The House pulls one from every jackpot winner \u2014 the House's cut, it laughs, and the winners laugh too, bleeding at the mouth, because at last they have WON something. You have been spending smiles."},
 {id:"c54", r:54, t:"THE PRESSING", tx:"A patron who stops playing is not thrown out. Nothing is thrown out. They are taken down, and ground fine, and mixed with candle-wax, and pressed, and racked, and by Thursday you are betting them on a hard eight. The mill's motto, in iron over the intake: NOTHING LEAVES. IT ONLY CHANGES DENOMINATION."},
 {id:"c55", r:55, t:"THE WAX", tx:"The candle-wax in the chips is rendered from the candles that attend the weddings, which are rendered from guests, who arrived as patrons, who arrived as souls, who arrived as you did \u2014 owing. The House's economy is a circle, and you have been walking it since the door, and it is the honest mile."},
 {id:"c56", r:56, t:"THE FLOOR BELOW THE FLOOR", tx:"Cellar-rank patrons whisper of a floor below the mill where the House keeps its own losses \u2014 the hands it has overplayed, the nights it bled too much. No one has seen it. The freight lift has a button with no symbol, worn shiny. Worn shiny, note. Something presses it."},
 {id:"c57", r:57, t:"THE SMELL", tx:"New arrivals ask about the smell and are told: candle smoke. It is candle smoke. What they are smelling underneath \u2014 the sweetness, the turned earth, the birthday-cake wrongness of it \u2014 is concentrated luck, rendering. Luck is fat, darling. It has to be cut off something."},
 {id:"c58", r:58, t:"THE STAFF", tx:"The pit crews, the rack-fillers, the unseen hands that reset the tables between waves \u2014 promoted patrons, all. The House prefers the word ELEVATED. They do not speak, but they hum, in shifts, and if you assemble the hums across a full night they are the organ's rehearsal, harmonized. They know the piece."},
 {id:"c59", r:59, t:"THE AUDIT", tx:"Twice an age, the House counts itself. Every chip, every tooth, every soul in inventory, every whisper still hidden in the plaster. The last audit came up ONE SHORT and the House has never recovered \u2014 that missing unit is the wound below all wounds. It was not a chip. Chips do not leave."},
 {id:"c60", r:60, t:"WHAT THE MILL CANNOT GRIND", tx:"Nerve. It has tried. The mill can take the body, the debt, the name, the luck, the grief \u2014 but nerve jams the stones. That is why the House gambles instead of harvesting: gambling is a press for nerve, and you, tonight, are the finest ore it has had in years."},
 {id:"c61", r:61, t:"THE COUNT", tx:"Seventeen players, in the whole scream of the House's history, have paid the debt entire and stood in the open door with the morning on their faces. Free. Finished. All seventeen turned around. Ask yourself why you keep reading these pages. The House already knows."},
 {id:"c62", r:62, t:"THE FIRST", tx:"A stonemason's widow with a limp and no talent for cards whatsoever \u2014 she simply refused to lose faster than she could pray. Two hundred years to clear the debt. At the door she looked at the morning and said, not to anyone: it's smaller than I remembered. And came back in."},
 {id:"c63", r:63, t:"THE SECOND AND THIRD", tx:"Twins. They played as one soul across two bodies, which the House ruled legal after nine years of deliberation it clearly enjoyed. They reached the door together. One stepped OUT \u2014 the only step outward ever taken \u2014 and the other watched, and the one outside stood in the sun, and could not hear her sister's chips, and came back in weeping. Both play still. They no longer speak. They still win."},
 {id:"c64", r:64, t:"THE FOURTH", tx:"A cartographer. He cleared the debt in record time because he wanted, he said, only to map the way OUT. At the open door he looked at a world with edges he had already drawn and a House behind him that went down forever, unmapped. You know what he chose. His charts paper the cellar stairwell. They are beautiful. They are all of the inside."},
 {id:"c65", r:65, t:"THE FIFTH", tx:"Nobody remembers the fifth, which the House finds hysterical, because the fifth bet his MEMORABILITY on the last hand and won his soul with it. He is free. He is out there now, somewhere, unremembered by anyone including himself. The House keeps his page blank on purpose. This is that page."},
 {id:"c66", r:66, t:"THE SIXTH THROUGH TENTH", tx:"The gambling club \u2014 five friends who came in on one carriage, died in the same landslide, played the same corner table for an epoch. They cleared the debt as a syndicate, split the freedom five ways, and found it did not divide \u2014 freedom is denominated per soul. They drew cards for it. The winner tore the card. They are at the corner table now. Do not take the sixth chair."},
 {id:"c67", r:67, t:"THE ELEVENTH", tx:"A child. The House does not discuss the eleventh. The organ does not play near that page of the ledger, the ravens will not roost on it, and the Dealer's hands, which never repeat a shuffle, repeat one \u2014 a slow one, small, like folding something \u2014 every year on the eleventh's arrival day. The door was open. The child asked if it could stay until it was tall enough to reach the last table. It is tall enough now."},
 {id:"c68", r:68, t:"THE TWELFTH AND THIRTEENTH", tx:"A marriage \u2014 a real one, prior, mortal. They cleared the debt on the same night at different tables and met at the door by accident, and each turned around to fetch the other, and missed, and turned back, and missed. The House SWEARS it does not arrange this. They pass within a table of each other nine times a night. The regulars bet on it. The line never closes."},
 {id:"c69", r:69, t:"THE FOURTEENTH THROUGH SIXTEENTH", tx:"A poet, a butcher, a thief \u2014 cleared within a decade of each other, all turned back at the threshold citing, respectively: the light, the quiet, the locks. The poet meant the light was wrong. The butcher meant the quiet was wrong. The thief meant the locks were beneath her. The House had all three reasons framed. They hang in the ante room. You have walked past them nightly."},
 {id:"c70", r:70, t:"THE SEVENTEENTH", tx:"Her name is Vesper. So is yours \u2014 the House files its players under one name to save ink. She reached rank ninety-nine, stood before the last table with the debt nearly paid, and asked for one more spin. Not to win. To FEEL it. The House keeps her seat warm. It is your seat. Every chapter of this book was always about the seat."},
 {id:"c71", r:71, t:"NO ARCHITECT", tx:"No one built the House. The House grew, like scar tissue, around a wound in the world \u2014 a gambler once bet something that was not his to bet, and lost, and the loss kept COMPOUNDING. The pillars are its regret. The chandeliers are its eyes. You have been walking on its tongue since the door."},
 {id:"c72", r:72, t:"THE GAMBLER BEFORE HOUSES", tx:"Before walls, before marble, there was a table of packed earth and a game older than counting. He was good. He was so good the game itself got proud of him, the way a knife gets proud of a hand. And one night, out of stakes, ahead of everyone, unable to stand the thought of stopping \u2014 he reached for the one thing on the table that was not his."},
 {id:"c73", r:73, t:"WHAT HE BET", tx:"Not his soul; souls were common tender even then. He bet the MORNING. Everyone's. The one thing held in common, the thing that ends nights. He put the morning itself on a hard eight, and the bones came up seven, and somewhere a rooster opened its mouth and nothing happened."},
 {id:"c74", r:74, t:"THE COMPOUNDING", tx:"A lost morning gathers interest. Every night since has run long by a sliver \u2014 you have felt this, mortals feel it as winter. The debt passed from the gambler to his table, from the table to the ground under it, and the ground, having no pockets, GREW. Grew walls to hold the loss. Grew a mill to service it. Grew a House."},
 {id:"c75", r:75, t:"THE PILLARS", tx:"Count them sometime, mid-wave: the number changes. The House grows a pillar every time the wound compounds past a threshold and reabsorbs one in its rare good years. The count has not gone down in your lifetime. The count has not gone down in anyone's lifetime. The masons in the cellar no longer make plans. They make apologies, load-bearing."},
 {id:"c76", r:76, t:"THE EYES", tx:"The chandeliers do not light the floor; the floor is lit BY being watched \u2014 attention, at the House's age, is indistinguishable from light. This is why the shadows here move wrong: they are not the absence of light, they are the House blinking. It tries not to. For you, lately, it has been trying not to."},
 {id:"c77", r:77, t:"THE WOUND'S WEATHER", tx:"When the wound aches, the pit spawns heavy \u2014 you have played those nights, the crowded ones, the walls sweating fog. When the wound sleeps, the golden waves come. There is no schedule. There is only symptom. You are not a customer, in the end. You are a poultice."},
 {id:"c78", r:78, t:"THE FIRST DEALER", tx:"The gambler himself, of course. The House grew around him mid-deal and never let the hands stop \u2014 why would it? They were the best hands in the world, and they OWED. Everything below the wrists was repossessed over the eras, sold to pay interest on the morning. The hands remain. You have watched them shuffle. They were the whole of him that never once cheated."},
 {id:"c79", r:79, t:"THE MORNING, HELD", tx:"It is in the vault. The real vault \u2014 not the gold-wheel door the players see; the one below the mill, behind the button worn shiny. The morning, folded, original, still warm at one edge. The House cannot spend it and will not release it, because the day it opens that vault, every night everywhere balances, and the House, being made of imbalance, closes."},
 {id:"c80", r:80, t:"THE HOUSE'S PRAYER", tx:"It has one. It prays \u2014 to whom is not recorded \u2014 the same eleven words, once an age, in the voice of every patron at once: LET SOMEONE WIN IT BACK BEFORE I GET USED TO THIS. The last recital was long ago. The walls think it is overdue. The walls, as you know by now, talk."},
 {id:"c81", r:81, t:"THIRTEEN", tx:"At the thirteenth minute the House stops pretending the night belongs to you. The floor is cleared \u2014 every patron, every gift, every kindness, repossessed mid-air. The bar is struck. And it walks the length of its own tongue toward you, wearing the body it saves for collections: the tall one. The scythed one."},
 {id:"c82", r:82, t:"THE COLLECTOR OF LAST RESORT", tx:"The HOUSE, the patrons call it, capitalized, as if the building had condensed \u2014 and that is exactly what it is: the whole establishment, gathered to a point, ethereal and dark, a little taller than the pit boss, holding a scythe that predates farming. It has a million points of blood and needs none of them. You cannot kill the venue, darling."},
 {id:"c83", r:83, t:"WHAT THE SCYTHE IS", tx:"Not a weapon. An INSTRUMENT, in the accounting sense. It does not cut flesh; it cuts ENTITLEMENT \u2014 your standing to remain. Three hundred points of you, per touch, reclassified as the House's. The reaping is paperwork. The pain is a courtesy, so you know the paperwork went through."},
 {id:"c84", r:84, t:"THE TWO MINUTES", tx:"From thirteen to fifteen, the House gives you the strangest gift on its books: a fight it cannot lose and will not shorten. Two full minutes of divinity paying attention to you personally. Some players call it the audience. The Widow calls it the visit. The Brute calls it Tuesday. Survive it untouched, and the walls will never stop whispering your name."},
 {id:"c85", r:85, t:"WHAT IT SAYS", tx:"It talks to you, mid-reaping \u2014 you have seen the lines burn across the middle of the night. Two hundred fifty things, in strict order, curiosity to contempt to something the ledger has no column for. It has never repeated one. It is working from a list it wrote before you arrived. It wrote a list for everyone. It has always been going to meet you."},
 {id:"c86", r:86, t:"FORECLOSURE", tx:"At fifteen: not death. Death implies the estate passes to heirs. FORECLOSURE \u2014 the House repossessing the night, the body, the standing, the game, with the marker honored first if you still hold it, every clause to the letter. The final press does not apply. Even the House's mercy has a floor, and you have been standing on it."},
 {id:"c87", r:87, t:"HEAVEN, MORTGAGED", tx:"Where do foreclosed souls go? Wrong question. Heaven itself carries paper on the House \u2014 has since the morning was lost, since nights began running long. The arrangement is delicate and neither party discusses it, but notice: it never rains inside, and no prayer said on the floor has ever been returned as undeliverable. They are received. They are held as collateral."},
 {id:"c88", r:88, t:"THE ANGELS' TABLE", tx:"There is a room the maps deny harder than the kitchen. High-limit. White felt. The seraph sting you hear on a mythic pull leaks under its door. Who plays there is not recorded; what they stake, the mill cannot grind; and once an era the door opens for a hand to be shaken, and the light that comes out is the light the poet said was wrong."},
 {id:"c89", r:89, t:"THE REPOSSESSED DAWN", tx:"Some nights, at the very edge of fifteen, the ceiling of the pit goes briefly grey-gold \u2014 the color of five a.m. The new players point. The old ones look away. It is the morning, in the deep vault, turning over in its sleep. It knows someone is still trying to win it back. It is trying to stay warm for you."},
 {id:"c90", r:90, t:"THE LAST CLAUSE", tx:"Read your contract to the end \u2014 past the interest, past the marriage, past the mill. The final clause, in the smallest hand, added late, in different ink: paragraph 101 \u2014 'SHOULD THE BEARER SURVIVE THE VISIT UNTOUCHED, THE HOUSE WILL REMEMBER THAT IT WANTED TO LOSE.' The walls say the ink is still wet. The walls say it is your handwriting. The walls talk too much."},
 {id:"c91", r:91, t:"RANK ONE HUNDRED", tx:"It is not a title. It is a SEAT, and the seat empties, and the game does not stop for grief. One night \u2014 soon, as the House measures soon \u2014 the Dealer's cuffs will click open, and yours will click shut, and some new soul will push through the velvet doors owing themselves."},
 {id:"c92", r:92, t:"THE SUCCESSION", tx:"This is how the hands stay beautiful: they are always the best player of the age, always mid-deal, always paying down a debt that outgrew the concept of payment. The gambler dealt until the eleventh's shuffle broke something in him. The next dealt until the twins. The seat wears through its occupants like the mill wears its stones. The seat is the mill, for a finer flour."},
 {id:"c93", r:93, t:"WHAT THE SEAT GRINDS", tx:"Hope, obviously \u2014 but that is a byproduct. The seat exists to grind ONE MORE SPIN out of the universe, forever, because as long as somebody is mid-spin the morning stays collateral and the wound stays serviceable and the House stays open. The whole establishment is a machine for never finding out how the hand ends."},
 {id:"c94", r:94, t:"VESPER'S SPIN", tx:"She is still mid-spin. Understand that: the seventeenth's last spin, requested at rank ninety-nine, has not landed. The reels have been turning for longer than you have been dead. The House will not stop them, because the moment they land she is either free or FINISHED, and either way the seat empties, and the seat abhors emptying. You were recruited to be her landing."},
 {id:"c95", r:95, t:"THE OFFER THEY WILL MAKE YOU", tx:"At the last table they do not deal you a hand. They deal you the LEDGER \u2014 every night, every burn, every scar, every whisper you answered, totaled. And the Dealer's hands turn it around, and push it across the felt, and the House asks the only question it has ever genuinely wanted answered: 'DOUBLE, OR NOTHING?'"},
 {id:"c96", r:96, t:"WHAT DOUBLE MEANS", tx:"Double is the seat. Dealer of the age, hands preserved, debt serviced, name filed under the one name. Double is never dying again and never once leaving. Double is what sixteen of the seventeen chose without knowing they were choosing it, the moment they turned from the door. The House does not trick anyone. It just waits for you to have already decided."},
 {id:"c97", r:97, t:"WHAT NOTHING MEANS", tx:"Nothing is the morning. Nothing is the deep vault opened, the fold shaken out, the rooster's held note finally landing. Nothing is every night everywhere balancing, the House closing, the mill stopping, the patrons pouring out blinking into a dawn nine thousand years overdue. Nothing is the only payout big enough to cover the original bet. The House calls it nothing because it cannot bear to say its name."},
 {id:"c98", r:98, t:"THE DEALER'S TELL", tx:"One exists. The hands, which never repeat a shuffle, will repeat one for you at the last table \u2014 small, slow, like folding something. It is not a shuffle. It has never been a shuffle. It is the eleventh's blanket, remembered. It means even the House's own hands are hoping you pick the door. It means the hands have been losing on purpose for eleven ages. It means take the bet, darling."},
 {id:"c99", r:99, t:"ANTE MORTEM", tx:"The name over the door, finally translated in full. Not 'before death' \u2014 before-death is the STAKE, the thing wagered, the life you put up without being asked. The bet was always placed before the death. Yours was. Everyone's was. The House merely collects on wagers the living do not remember making \u2014 and pays out, once an age, to the one who remembers WHY they bet."},
 {id:"c100", r:100, t:"THE HUNDREDTH PAGE", tx:"There is no prose on the hundredth page of the true ledger. There is a mirror of polished gilt, and above it one line in the House's own hand \u2014 the only sentence it has ever written about itself: 'I WAS A GOOD GAME ONCE. WIN, AND I WILL BE AGAIN.' The page is signed. The signature is shaking. Deal."},
 {id:"w1", w:5, t:"WHAT THE WALLS ARE", tx:"You have started listening. Good. The walls are not stone \u2014 stone does not flinch. The House skins its bankrupts and stretches them thin and hangs them as wallpaper, and they are GRATEFUL, because even a wall still gets to watch the game."},
 {id:"w2", w:15, t:"THE WHISPERERS", tx:"The riddles you keep answering are not tests. They are MESSAGES \u2014 pressed into the plaster by players who hid them faster than the House could eat the evidence. Every whisper you solve, somewhere in the walls a mouth that has held its breath for a century finally gets to exhale."},
 {id:"w3", w:30, t:"THE LAST WHISPER", tx:"This page is not from a player. It is from the House, and it is the only true thing it will ever give you for free: it does not want your debt paid. It does not even want you dead. It wants you SEATED, forever, mid-spin, in the moment before the reels stop \u2014 because that is the only moment the wound stops hurting. You were never the gambler, darling. You are the painkiller."}
];
const STORY_ACTS=[["I \u2014 THE DEBT", 1], ["II \u2014 THE FLOOR", 11], ["III \u2014 THE DEALER'S HANDS", 21], ["IV \u2014 THE PATRONS", 31], ["V \u2014 THE WEDDING", 41], ["VI \u2014 THE CELLAR MILL", 51], ["VII \u2014 THE SEVENTEEN", 61], ["VIII \u2014 THE ARCHITECT'S WOUND", 71], ["IX \u2014 THE FORECLOSURE OF HEAVEN", 81], ["X \u2014 THE SEAT", 91]];
function storyUnlocked(pg){ return pg.r ? RANK.rank>=pg.r : SEC.size>=pg.w; }
function storyUnreadCount(){ const rd=new Set(IDX.st||[]); return STORY_PAGES.filter(p=>storyUnlocked(p)&&!rd.has(p.id)).length; }
function nextStoryGate(){ const pg=STORY_PAGES.filter(p=>p.r&&RANK.rank<p.r).sort((a,b)=>a.r-b.r)[0]; return pg?pg.r:null; }
function openStoryPanel(){
  const p=$('storyPanel'), list=$('storyList'); if(!p) return;
  const rd=new Set(IDX.st||[]);
  const unlocked=STORY_PAGES.filter(pg=>storyUnlocked(pg)).length;
  const chapters=STORY_PAGES.filter(pg=>pg.r).length;
  const chUn=STORY_PAGES.filter(pg=>pg.r&&storyUnlocked(pg)).length;
  $('storyCount').innerHTML=unlocked+' / '+STORY_PAGES.length+' PAGES RECOVERED'
    +'<div class="spSpine"><i style="width:'+(chUn/chapters*100).toFixed(1)+'%"></i><b>'+chUn+' / '+chapters+' CHAPTERS</b></div>';
  let html=''; let actIdx=-1;
  STORY_PAGES.forEach((pg,i)=>{
    if(pg.r){ const na=STORY_ACTS.findIndex(a=>pg.r>=a[1] && (!STORY_ACTS[STORY_ACTS.indexOf(a)+1]||pg.r<STORY_ACTS[STORY_ACTS.indexOf(a)+1][1]));
      if(na!==actIdx){ actIdx=na; html+='<div class="lpgAct">ACT '+STORY_ACTS[na][0]+'</div>'; } }
    else if(actIdx!==-2){ actIdx=-2; html+='<div class="lpgAct">— WHISPER INTERLUDES —</div>'; }
    const un=storyUnlocked(pg), isNew=un&&!rd.has(pg.id);
    if(!un){ html+='<div class="lpg locked"><span class="lpgN">'+(pg.r||'✦')+'</span><b>🔒 '+(pg.r?('HOUSE RANK '+pg.r):(pg.w+' WHISPERS'))+'</b></div>'; return; }
    html+='<div class="lpg on'+(isNew?' new':'')+'" data-pg="'+pg.id+'"><span class="lpgN">'+(pg.r||'✦')+'</span><b>'+pg.t+'</b>'+(isNew?'<i class="lpgNew">UNREAD</i>':'')+'</div>';
  });
  list.innerHTML=html;
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
  window._pgSes=(window._pgSes||new Set()); window._pgSes.add(id);
  if(window._pgSes.size>=20) secret('allpages','ONE CANDLE');
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
 10:{r:'+5% XP FOREVER',              ap:()=>{ P.xpMult=(P.xpMult||1)*1.05; }},
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
async function loadRank(){ try{ if(!store)return; const v=await store.get(RANK_KEY); if(v&&v.value){ const o=JSON.parse(v.value); RANK.marks=Math.max(0,+o.marks||0); RANK.rank=Math.max(1,Math.min(100,Math.round(+o.rank)||1)); } }catch(e){}
  // new curve, never a demotion: old saves land at whichever is HIGHER
  RANK.rank=Math.min(RANKS.length, Math.max(RANK.rank, rankFromMarks(RANK.marks))); }
async function saveRank(){ try{ if(!store)return; await store.set(RANK_KEY,JSON.stringify({v:3,marks:RANK.marks,rank:RANK.rank}),false); }catch(e){} }
function awardMarks(m){
  RANK.marks+=m; let up=false, reward='';
  while(RANK.rank<RANKS.length && RANK.marks>=rkCum(RANK.rank+1)){
    RANK.rank++; up=true; const rk=RANKS[RANK.rank-1]; reward=rk.r||'';
    if(rk.g){ gilt+=rk.g; saveGilt(); }
  }
  saveRank(); if(typeof quillFlick==='function') try{ quillFlick(); }catch(e){}
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
  if(DLY_RNG) return; // B1: fair field
  for(let r=2;r<=RANK.rank;r++){ const e=RANKS[r-1]; if(e&&e.ap){ try{ e.ap(); }catch(x){} } }
}

/* ==== A3 — THE FIRST NIGHT (new-player onboarding) ====
   A stranger's first 3 nights (lifetime LT.runs <= 3, read-only) and never a
   ranked soul (RANK.rank >= 8 is a regular): the floor fills slower and ramps to
   the true curve by ~1:45, the first level costs 8 souls (each worth double until then), the first RAGE is
   cashed for you if you miss it, and the House explains three things once.
   No new save keys: lessons ride LT.coach like every other coach mark.        */
const FN={ nights:3, rankVet:8, ramp:105, start:0.55, xp1:8, xpBoost:1.5, bite:0.6 };
function fnOn(){ try{ return !!(P && P._fn); }catch(e){ return false; } }
// pressure multiplier for tonight: 0.55 at the opening bell → 1.0 at 1:45 (smoothstep)
function fnEase(){
  if(!fnOn()) return 1;
  const t=Math.min(1, Math.max(0, (gt-(window._gt0||0))/FN.ramp)), s=t*t*(3-2*t);
  return FN.start+(1-FN.start)*s;
}
// contact bite of anything born during the ramp: 0.6 → 1.0 alongside the spawn ease
function fnBite(){ if(!fnOn()) return 1; const e=(fnEase()-FN.start)/(1-FN.start); return FN.bite+(1-FN.bite)*e; }
function fnStart(){
  if(typeof DLY_RNG!=='undefined' && DLY_RNG){ P._fn=false; return; } // B1: the daily is the same night for everyone — no gentle ramp
  P._fn = !window._fnOff && (LT.runs||0)<=FN.nights && (RANK.rank||1)<FN.rankVet;
  if(!P._fn) return;
  P._fnN=LT.runs||1; P._fnK=0; P._fnL=0; P._fnR=0; P._fnS=0;
  P.xpNext=FN.xp1; // the first slot is the hook — get them there fast
  P.xpMult=(P.xpMult||1)*FN.xpBoost; P._fnXp=1; // level-1 souls weigh double (reverted at the first level)
  const touchy=(typeof matchMedia==='function') && matchMedia('(pointer: coarse)').matches;
  if(P._fnN===1){
    setTimeout(()=>{ if(state==='playing' && fnOn()) coachMark('fn_move', touchy
      ? 'DRAG to walk — your bolt aims itself at the nearest dead · never stand still'
      : 'WASD or ARROWS to walk — your bolt aims itself at the nearest dead · never stand still'); }, 900);
  }
  if(P._fnN<FN.nights || P._fnN===1) setTimeout(()=>{ if(state==='playing' && fnOn())
    announce(P._fnN===1?'✦ THE HOUSE OPENS GENTLY — FOR NOW ✦':'✦ NIGHT '+P._fnN+' OF 3 — THE HOUSE STILL GOES EASY ✦', true); }, 1400);
  else setTimeout(()=>{ if(state==='playing' && fnOn()) announce('☠ YOUR LAST GENTLE NIGHT — TOMORROW THE HOUSE PLAYS FOR KEEPS ☠', false); }, 1400);
}
// per-frame, called from update() right before the RAGE bar decays
function fnTick(dt){
  if(!fnOn()) return;
  // FIRST BLOOD — the first corpse pays out like a jackpot (small one)
  if(!P._fnK && P.kills>=1){ P._fnK=1;
    ftext(P.x,P.y-46,'✦ FIRST BLOOD ✦','#ffd36b',true); ring(P.x,P.y,90,'#ffd36b'); ring(P.x,P.y,52,'#fff2c0');
    burst(P.x,P.y,18,'#ffd36b'); flash(0.18,'#ffd36b'); shake=Math.min(8,shake+3);
    SFX.casinoDing(); setTimeout(()=>{ try{ SFX.coinPling(); SFX.coinPling(); }catch(e){} },90); }
  // the first RAGE: teach SPACE, and if the lesson doesn't land, the House cashes once
  if(P.ovT>0 && !P._fnR){ P._fnR=1;
    coachMark('fn_space','SPACE IS EVERY BET — press it NOW to cash the RAGE · reels, dice, wheel: all SPACE'); }
  if(P.ovT>0 && P.ovT<90.6 && P._fnR===1){ P._fnR=2;
    P.ovT=90.6; P.ovAge=0; cashRage();
    setTimeout(()=>announce('◈ THE HOUSE CASHED FOR YOU — THIS ONCE · NEXT TIME, SPACE ◈', true), 200); }
  // back on the floor after the first pull: say what the machine is for
  if(P._fnL && !P._fnS && state==='playing'){ P._fnS=1;
    if(P._fnN===1) setTimeout(()=>{ if(state==='playing' && fnOn()) coachMark('fn_slot','EVERY LEVEL PULLS THE SLOT — what lands is yours for the night: weapons, skills, sometimes a curse'); }, 5200); }
}
// FIRST LEVEL — gilded welcome as the reels drop (called from gainXP, before the slot opens)
function fnFirstLevel(){
  if(!fnOn() || P._fnL) return; P._fnL=1;
  if(P._fnXp){ P._fnXp=0; P.xpMult=(P.xpMult||1)/FN.xpBoost; }
  announce('♛ FIRST LEVEL — THE REELS ARE YOURS ♛', true);
  try{ SFX.seraph(); coinRain(14); flash(0.3,'#ffd36b'); ring(P.x,P.y,170,'#ffd36b'); ring(P.x,P.y,110,'#fff2c0');
    setTimeout(()=>{ try{ if(state==='slot') domConfetti(24,'slot'); }catch(e){} }, 60); }catch(e){}
}
