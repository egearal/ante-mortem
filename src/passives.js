"use strict";
const PASSIVES=[
  {id:'vital', n:'Iron Constitution',g:'✚',rar:'common',max:10,d:l=>'Thicker blood: +12 max HP per level.',ap:()=>{P.maxHp+=12;P.hp+=12;},sc:m=>{const a=Math.round(12*m);P.maxHp+=a;P.hp+=a;}},
  {id:'a_iron', fx:'+20 HP', n:'IRONBLOOD',      g:'♜',rar:'ascend',max:1,u:true,d:l=>'Ascension: +20 max HP.',ap:()=>{P.maxHp+=20;P.hp+=20;}},
  {id:'a_eye', fx:'+6% CRIT',  n:'EVIL EYE',       g:'◉',rar:'ascend',max:1,u:true,d:l=>'Ascension: +6% critical chance.',ap:()=>{P.crit=(P.crit||0)+0.06;}},
  {id:'a_wind', fx:'+25 SPD', n:'TAILWIND',       g:'»',rar:'ascend',max:1,u:true,d:l=>'Ascension: +25 move speed.',ap:()=>{P.speed+=25;}},
  {id:'a_fang', fx:'+12% DMG', n:'FANGS OF THE HOUSE',g:'♆',rar:'ascend',max:1,u:true,d:l=>'Ascension: +12% damage.',ap:()=>{P.damage*=1.12;}},
  {id:'a_storm', fx:'+12% RATE',n:'TRIGGER STORM',  g:'≋',rar:'ascend',max:1,u:true,d:l=>'Ascension: +12% fire rate.',ap:()=>{P.fireRate*=1.12;}},
  {id:'a_greed', fx:'+50% COINS',n:'GREED ENGINE',   g:'⚙',rar:'ascend',max:1,u:true,d:l=>'Ascension: coins gained +50%.',ap:()=>{P.coinMult=(P.coinMult||1)+0.5;}},
  {id:'a_crown', fx:'+20% DMG +10% RATE',n:'CROWN OF ASH',   g:'♔',rar:'ascend',max:1,u:true,d:l=>'Ascension: +20% damage, +10% fire rate.',ap:()=>{P.damage*=1.20;P.fireRate*=1.10;}},
  {id:'a_void', fx:'+40 SPD +10% CRIT', n:'VOIDSTEP',       g:'✧',rar:'ascend',max:1,u:true,d:l=>'Ascension: +40 speed, +10% crit.',ap:()=>{P.speed+=40;P.crit=(P.crit||0)+0.10;}},
  {id:'a_king', fx:'+15% XP +10% DMG', n:'KINGMAKER',      g:'✷',rar:'ascend',max:1,u:true,d:l=>'Ascension: +15% XP, +10% damage, richer bar fuel.',ap:()=>{P.xpMult=(P.xpMult||1)*1.15;P.damage*=1.10;P.ovFeed=(P.ovFeed||1)*1.15;}},
  {id:'a_gild', fx:'+15% COINS', n:'GILDED VEINS',   g:'✺',rar:'ascend',max:1,u:true,d:l=>'Ascension: +15% coins.',ap:()=>{P.coinMult=(P.coinMult||1)+0.15;}},
  {id:'a_hand', fx:'+8% SHOT SPD', n:'STEADY HANDS',  g:'✜',rar:'ascend',max:1,u:true,d:l=>'Ascension: shots travel +8% faster.',ap:()=>{P.projSpeed*=1.08;}},
  {id:'a_skin', fx:'+1 ARMOR', n:'THICK SKIN',        g:'⊞',rar:'ascend',max:1,u:true,d:l=>'Ascension: incoming hits reduced by 1.',ap:()=>{P.armor=(P.armor||0)+1;}},
  {id:'a_fuse', fx:'+18% RANGE', n:'LONG FUSE',       g:'∞',rar:'ascend',max:1,u:true,d:l=>'Ascension: shots live +18% longer.',ap:()=>{P.projLife*=1.18;}},
  {id:'a_holl', fx:'+1 PIERCE', n:'HOLLOW POINTS',    g:'≫',rar:'ascend',max:1,u:true,d:l=>'Ascension: shots pierce +1 foe.',ap:()=>{P.pierce=(P.pierce||0)+1;}},
  {id:'a_swrm', fx:'+1 PROJECTILE', n:'CHIP STORM',   g:'∵',rar:'ascend',max:1,u:true,d:l=>'Ascension: +1 projectile.',ap:()=>{P.projectiles=(P.projectiles||1)+1;}},
  {id:'a_veil', fx:'+0.15s SHIELD', n:'VELVET VEIL',  g:'◑',rar:'ascend',max:1,u:true,d:l=>'Ascension: +0.15s invulnerability after each hit.',ap:()=>{P.invBonus=(P.invBonus||0)+0.15;}},
  {id:'a_reap', fx:'+0.6× CRIT DMG', n:"REAPER'S DUE",g:'☨',rar:'ascend',max:1,u:true,d:l=>'Ascension: critical hits deal +0.6× more.',ap:()=>{P.critMult=(P.critMult||1.5)+0.6;}},
  {id:'a_engn', fx:'+12% RATE +8% SPD', n:'PERPETUAL ENGINE',g:'⚛',rar:'ascend',max:1,u:true,d:l=>'Ascension: +12% fire rate, +8% move speed.',ap:()=>{P.fireRate*=1.12;P.speed*=1.08;}},
  {id:'a_mirr', fx:'+10% DMG +10% COINS +5% XP', n:'HOUSE MIRROR',g:'✠',rar:'ascend',max:1,u:true,d:l=>'Ascension: +10% damage, +10% coins, +5% XP.',ap:()=>{P.damage*=1.10;P.coinMult=(P.coinMult||1)+0.10;P.xpMult=(P.xpMult||1)*1.05;}},
  {id:'phoenix',n:'PHOENIX MARKER', g:'✵',rar:'mythic',max:1,u:true,d:l=>'Once per run: the killing blow instead detonates — 100 damage around you, 5s invincibility, +50 speed.',ap:()=>{P.mythPhoenix=true;}},
  {id:'housecut',n:"THE HOUSE'S CUT",g:'♛',rar:'mythic',max:1,u:true,d:l=>'Eternal skim: +1 coin multiplier and +10% damage, forever this run.',ap:()=>{P.coinMult=(P.coinMult||1)+1;P.damage*=1.10;}},
  {id:'allin', n:'ALL IN',          g:'✸',rar:'mythic',max:1,u:true,d:l=>'Everything on the table: +25% damage, +15% fire rate, +40 speed.',ap:()=>{P.damage*=1.25;P.fireRate*=1.15;P.speed+=40;}},
  {id:'thorn', n:'Barbed Chips',   g:'✱',rar:'rare',max:5,d:l=>'Attackers bleed: foes striking you take '+(3*l)+' damage.',ap:()=>{P.thorns=(P.thorns||0)+3;}},
  {id:'leech', n:'Velvet Leech',   g:'♥',rar:'rare',max:4,d:l=>'Drink deep: heal '+(1.5*l).toFixed(1)+'% of all damage you deal.',ap:()=>{P.lifesteal=(P.lifesteal||0)+0.015;}},
  {id:'haste', n:"Dealer's Tempo",g:'♬',rar:'common',max:8,d:l=>'Shots fly +6% faster per level.',ap:()=>{P.projSpeed*=1.06;}},
  {id:'reach', n:'Long Table',     g:'⊕',rar:'common',max:6,d:l=>'Shots live +8% longer per level — more range.',ap:()=>{P.projLife*=1.08;}},
  {id:'tip',   n:'Tip Jar',        g:'¢',rar:'common',max:6,d:l=>'Every corpse tips better: +10% coins per level.',ap:()=>{P.coinMult=(P.coinMult||1)+0.10;}},
  {id:'corset',n:'Bone Corset',    g:'▣',rar:'rare',max:5,d:l=>'Armor of the dead: incoming hits reduced by '+(2*l)+'.',ap:()=>{P.armor=(P.armor||0)+2;}},
  {id:'snake', n:'Snake Eyes',     g:'⚁',rar:'common',max:6,d:l=>'The dice love you: +4% crit chance per level.',ap:()=>{P.crit=(P.crit||0)+0.04;}},
  {id:'chips', n:'Heavy Chips',    g:'▮',rar:'rare',max:5,d:l=>'Shots hit like bricks: +15% knockback per level.',ap:()=>{P.kb=(P.kb||1)+0.15;}},
  {id:'tithe', n:'Blood Tithe',    g:'✝',rar:'rare',max:5,d:l=>'Every kill returns '+(1*l)+' lifeblood to you.',ap:()=>{P.onKillHeal=(P.onKillHeal||0)+1;}},
  {id:'shell', n:"Dead Man's Shell",g:'◐',rar:'epic',max:4,d:l=>'After taking a hit, remain untouchable +'+(0.1*l).toFixed(1)+'s longer.',ap:()=>{P.invBonus=(P.invBonus||0)+0.1;}},
  {id:'fortune',n:'Gilded Fortune', g:'✦',rar:'common',max:10,d:l=>'The House favors you: +4% XP gained per level (now +'+(4*l)+'%).',ap:()=>{P.xpMult=(P.xpMult||1)*1.04;}},
  {id:'stoker', n:'Bar Stoker',     g:'⚗',rar:'common',max:10,d:l=>'Rage fuel burns richer: coins & XP feed the bar +4% per level.',ap:()=>{P.ovFeed=(P.ovFeed||1)*1.04;}},
  {id:'dmg',   n:'Sharpened Aces', g:'♦',rar:'common',max:8,d:l=>'Sharper shots: +5 damage per level (now +'+(5*l)+').',ap:()=>{P.damage+=5;},sc:m=>{P.damage+=Math.round(5*m);}},
  {id:'fire',  n:'Swift Hands',    g:'♗',rar:'common',max:8,d:l=>'Fire faster: +0.25 shots/sec per level.',ap:()=>{P.fireRate+=0.25;},sc:m=>{P.fireRate+=0.25*m;}},
  {id:'spd',   n:'Quick Step',     g:'♞',rar:'common',max:8,d:l=>'Fleeter of foot: +20 move speed per level.',ap:()=>{P.speed+=20;},sc:m=>{P.speed+=Math.round(20*m);}},
  {id:'hp',    n:'Iron Vein',      g:'✚',rar:'common',max:8,d:l=>'Tougher body: +30 max lifeblood & heal per level.',ap:()=>{P.maxHp+=30;P.hp=Math.min(P.maxHp,P.hp+30);}},
  {id:'luck',  n:"Fool's Luck",    g:'◈',rar:'rare',max:6,d:l=>'Fortune favours you: +6% crit & +18% coins per level.',ap:()=>{P.crit=Math.min(0.9,P.crit+0.06);P.coinMult+=0.18;}},
  {id:'proj',  n:'Extra Ante',     g:'❖',rar:'rare',max:4,d:l=>'+1 extra bone shard fired per level.',ap:()=>{P.projectiles+=1;}},
  {id:'pierce',n:'Piercing Fate',  g:'†',rar:'rare',max:4,d:l=>'Shots pierce +1 additional foe per level.',ap:()=>{P.pierce+=1;}},
  {id:'mag',   n:'Deep Pockets',   g:'◎',rar:'common',max:6,d:l=>'+40 pickup range & +8% coins per level.',ap:()=>{P.pickup+=40;P.coinMult+=0.08;}},
  {id:'regen', n:'Slow Bleed',     g:'♻',rar:'rare',max:6,d:l=>'Regenerate +1.0 lifeblood/sec per level.',ap:()=>{P.regen+=1.0;P.hp=Math.min(P.maxHp,P.hp+15);}},
  {id:'exec',  n:'Executioner',    g:'‡',rar:'epic',max:5,d:l=>'Brutal crits: +0.4× critical damage per level.',ap:()=>{P.critMult+=0.4;}}
];
function auraRadius(){ const l=P.wlv.aura||0; return l? 86+l*12 : 0; }
function addPassiveHUD(def){ const e=P.passiveList.find(x=>x.id===def.id); if(e){ e.count++; } else { P.passiveList.push({id:def.id,g:def.g,n:def.n,rar:def.rar,count:1}); } }
function passiveReward(pd){
  return { kind:'passive', id:pd.id, g:pd.g, n:pd.n, rar:pd.rar, u:pd.u,
    d:()=>pd.d(), apply:()=>{ pd.ap(); addPassiveHUD(pd); if(pd.u) owned.add(pd.id); } };
}
function skillLevel(id){ const e=P.passiveList.find(x=>x.id===id); return e?e.count:0; }
function ownedSkillCount(){ return P.passiveList.length; }
function availableSkills(){
  const canNew = ownedSkillCount() < SKILL_CAP;
  return PASSIVES.filter(s=>{ const lv=skillLevel(s.id); return lv>0 ? lv<s.max : canNew; });
}
function grantSkill(def, levels){
  const cur=skillLevel(def.id); const add=Math.min(levels, def.max-cur);
  for(let i=0;i<add;i++){ def.ap(); addPassiveHUD(def); }
  renderRelics(); bump('s_'+def.id, skillLevel(def.id));
  return add;
}
