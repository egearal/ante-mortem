"use strict";
const PASSIVES=[
  {id:'vital', n:'Iron Constitution',g:'✚',rar:'common',max:10,d:l=>'Thicker blood: +12 max HP per level.',ap:()=>{P.maxHp+=12;P.hp+=12;},sc:m=>{const a=Math.round(12*m);P.maxHp+=a;P.hp+=a;}},
  {id:'a_iron', fx:'+20 HP/lv', n:'IRONBLOOD',      g:'♜',rar:'ascend',max:5,d:l=>'Ascension: +'+(20*l)+' max HP.',ap:()=>{P.maxHp+=20;P.hp+=20;},sc:m=>{const a=Math.round(20*m);P.maxHp+=a;P.hp+=a;}},
  {id:'a_eye', fx:'+6% CRIT/lv',  n:'EVIL EYE',       g:'◉',rar:'ascend',max:5,d:l=>'Ascension: +'+(6*l)+'% critical chance.',ap:()=>{P.crit=(P.crit||0)+0.06;},sc:m=>{P.crit=Math.min(0.9,(P.crit||0)+0.06*m);}},
  {id:'a_wind', fx:'+25 SPD/lv', n:'TAILWIND',       g:'»',rar:'ascend',max:5,d:l=>'Ascension: +'+(25*l)+' move speed.',ap:()=>{P.speed+=25;},sc:m=>{P.speed+=Math.round(25*m);}},
  {id:'a_fang', fx:'+12% DMG/lv', n:'FANGS OF THE HOUSE',g:'♆',rar:'ascend',max:5,d:l=>'Ascension: +'+Math.round((Math.pow(1.12,l)-1)*100)+'% damage.',ap:()=>{P.damage*=1.12;},sc:m=>{P.damage*=Math.pow(1.12,m);}},
  {id:'a_storm', fx:'+12% RATE/lv',n:'TRIGGER STORM',  g:'≋',rar:'ascend',max:5,d:l=>'Ascension: +'+Math.round((Math.pow(1.12,l)-1)*100)+'% fire rate.',ap:()=>{P.fireRate*=1.12;},sc:m=>{P.fireRate*=Math.pow(1.12,m);}},
  {id:'a_greed', fx:'+50% COINS/lv',n:'GREED ENGINE',   g:'⚙',rar:'ascend',max:5,d:l=>'Ascension: coins gained +'+(50*l)+'%.',ap:()=>{P.coinMult=(P.coinMult||1)+0.5;},sc:m=>{P.coinMult=(P.coinMult||1)+0.5*m;}},
  {id:'a_crown', fx:'+20% DMG +10% RATE/lv',n:'CROWN OF ASH',   g:'♔',rar:'ascend',max:5,d:l=>'Ascension: +'+Math.round((Math.pow(1.20,l)-1)*100)+'% damage, +'+Math.round((Math.pow(1.10,l)-1)*100)+'% fire rate.',ap:()=>{P.damage*=1.20;P.fireRate*=1.10;},sc:m=>{P.damage*=Math.pow(1.20,m);P.fireRate*=Math.pow(1.10,m);}},
  {id:'a_void', fx:'+40 SPD +10% CRIT/lv', n:'VOIDSTEP',       g:'✧',rar:'ascend',max:5,d:l=>'Ascension: +'+(40*l)+' speed, +'+(10*l)+'% crit.',ap:()=>{P.speed+=40;P.crit=(P.crit||0)+0.10;},sc:m=>{P.speed+=Math.round(40*m);P.crit=Math.min(0.9,(P.crit||0)+0.10*m);}},
  {id:'a_king', fx:'+15% XP +10% DMG/lv', n:'KINGMAKER',      g:'✷',rar:'ascend',max:5,d:l=>'Ascension: +'+Math.round((Math.pow(1.15,l)-1)*100)+'% XP, +'+Math.round((Math.pow(1.10,l)-1)*100)+'% damage, richer bar fuel.',ap:()=>{P.xpMult=(P.xpMult||1)*1.15;P.damage*=1.10;P.ovFeed=(P.ovFeed||1)*1.15;},sc:m=>{P.xpMult=(P.xpMult||1)*Math.pow(1.15,m);P.damage*=Math.pow(1.10,m);P.ovFeed=(P.ovFeed||1)*Math.pow(1.15,m);}},
  {id:'a_gild', fx:'+15% COINS/lv', n:'GILDED VEINS',   g:'✺',rar:'ascend',max:5,d:l=>'Ascension: +'+(15*l)+'% coins.',ap:()=>{P.coinMult=(P.coinMult||1)+0.15;},sc:m=>{P.coinMult=(P.coinMult||1)+0.15*m;}},
  {id:'a_hand', fx:'+8% SHOT SPD/lv', n:'STEADY HANDS',  g:'✜',rar:'ascend',max:5,d:l=>'Ascension: shots travel +'+Math.round((Math.pow(1.08,l)-1)*100)+'% faster.',ap:()=>{P.projSpeed*=1.08;},sc:m=>{P.projSpeed*=Math.pow(1.08,m);}},
  {id:'a_skin', fx:'+1 ARMOR/lv', n:'THICK SKIN',        g:'⊞',rar:'ascend',max:5,d:l=>'Ascension: incoming hits reduced by '+l+'.',ap:()=>{P.armor=(P.armor||0)+1;},sc:m=>{P.armor=(P.armor||0)+Math.max(1,Math.round(m));}},
  {id:'a_fuse', fx:'+18% RANGE/lv', n:'LONG FUSE',       g:'∞',rar:'ascend',max:5,d:l=>'Ascension: shots live +'+Math.round((Math.pow(1.18,l)-1)*100)+'% longer.',ap:()=>{P.projLife*=1.18;},sc:m=>{P.projLife*=Math.pow(1.18,m);}},
  {id:'a_holl', fx:'+1 PIERCE/lv', n:'HOLLOW POINTS',    g:'≫',rar:'ascend',max:5,d:l=>'Ascension: shots pierce +'+l+' foe'+(l>1?'s':'')+'.',ap:()=>{P.pierce=(P.pierce||0)+1;},sc:m=>{P.pierce=(P.pierce||0)+Math.max(1,Math.round(m));}},
  {id:'a_swrm', fx:'+1 PROJECTILE/lv', n:'CHIP STORM',   g:'∵',rar:'ascend',max:5,d:l=>'Ascension: +'+l+' projectile'+(l>1?'s':'')+'.',ap:()=>{P.projectiles=(P.projectiles||1)+1;},sc:m=>{P.projectiles=(P.projectiles||1)+Math.max(1,Math.round(m));}},
  {id:'a_veil', fx:'+0.15s SHIELD/lv', n:'VELVET VEIL',  g:'◑',rar:'ascend',max:5,d:l=>'Ascension: +'+(0.15*l).toFixed(2)+'s invulnerability after each hit.',ap:()=>{P.invBonus=(P.invBonus||0)+0.15;},sc:m=>{P.invBonus=(P.invBonus||0)+0.15*m;}},
  {id:'a_reap', fx:'+0.6× CRIT DMG/lv', n:"REAPER'S DUE",g:'☨',rar:'ascend',max:5,d:l=>'Ascension: critical hits deal +'+(0.6*l).toFixed(1)+'× more.',ap:()=>{P.critMult=(P.critMult||1.5)+0.6;},sc:m=>{P.critMult=(P.critMult||1.5)+0.6*m;}},
  {id:'a_engn', fx:'+12% RATE +8% SPD/lv', n:'PERPETUAL ENGINE',g:'⚛',rar:'ascend',max:5,d:l=>'Ascension: +'+Math.round((Math.pow(1.12,l)-1)*100)+'% fire rate, +'+Math.round((Math.pow(1.08,l)-1)*100)+'% move speed.',ap:()=>{P.fireRate*=1.12;P.speed*=1.08;},sc:m=>{P.fireRate*=Math.pow(1.12,m);P.speed*=Math.pow(1.08,m);}},
  {id:'a_mirr', fx:'+10% DMG +10% COINS +5% XP/lv', n:'HOUSE MIRROR',g:'✠',rar:'ascend',max:5,d:l=>'Ascension: +'+Math.round((Math.pow(1.10,l)-1)*100)+'% damage, +'+(10*l)+'% coins, +'+Math.round((Math.pow(1.05,l)-1)*100)+'% XP.',ap:()=>{P.damage*=1.10;P.coinMult=(P.coinMult||1)+0.10;P.xpMult=(P.xpMult||1)*1.05;},sc:m=>{P.damage*=Math.pow(1.10,m);P.coinMult=(P.coinMult||1)+0.10*m;P.xpMult=(P.xpMult||1)*Math.pow(1.05,m);}},
  {id:'phoenix',n:'PHOENIX MARKER', g:'✵',rar:'mythic',max:1,u:true,d:l=>'Once per run: the killing blow instead detonates — 100 damage around you, 5s invincibility, +50 speed.',ap:()=>{P.mythPhoenix=true;}},
  {id:'housecut',n:"THE HOUSE'S CUT",g:'♛',rar:'mythic',max:1,u:true,d:l=>'Eternal skim: +1 coin multiplier and +10% damage, forever this run.',ap:()=>{P.coinMult=(P.coinMult||1)+1;P.damage*=1.10;}},
  {id:'allin', n:'ALL IN',          g:'✸',rar:'mythic',max:1,u:true,d:l=>'Everything on the table: +25% damage, +15% fire rate, +40 speed.',ap:()=>{P.damage*=1.25;P.fireRate*=1.15;P.speed+=40;}},
  {id:'thorn', n:'Barbed Chips',   g:'✱',rar:'rare',max:5,d:l=>'Attackers bleed: foes striking you take '+(3*l)+' damage.',ap:()=>{P.thorns=(P.thorns||0)+3;},sc:m=>{P.thorns=(P.thorns||0)+Math.round(3*m);}},
  {id:'leech', n:'Velvet Leech',   g:'♥',rar:'rare',max:4,d:l=>'Drink deep: heal '+(1.5*l).toFixed(1)+'% of all damage you deal.',ap:()=>{P.lifesteal=(P.lifesteal||0)+0.015;},sc:m=>{P.lifesteal=(P.lifesteal||0)+0.015*m;}},
  {id:'haste', n:"Dealer's Tempo",g:'♬',rar:'common',max:8,d:l=>'Shots fly +'+Math.round((Math.pow(1.06,l)-1)*100)+'% faster.',ap:()=>{P.projSpeed*=1.06;},sc:m=>{P.projSpeed*=Math.pow(1.06,m);}},
  {id:'reach', n:'Long Table',     g:'⊕',rar:'common',max:6,d:l=>'Shots live +'+Math.round((Math.pow(1.08,l)-1)*100)+'% longer — more range.',ap:()=>{P.projLife*=1.08;},sc:m=>{P.projLife*=Math.pow(1.08,m);}},
  {id:'tip',   n:'Tip Jar',        g:'¢',rar:'common',max:6,d:l=>'Every corpse tips better: +'+(10*l)+'% coins.',ap:()=>{P.coinMult=(P.coinMult||1)+0.10;},sc:m=>{P.coinMult=(P.coinMult||1)+0.10*m;}},
  {id:'corset',n:'Bone Corset',    g:'▣',rar:'rare',max:5,d:l=>'Armor of the dead: incoming hits reduced by '+(2*l)+'.',ap:()=>{P.armor=(P.armor||0)+2;},sc:m=>{P.armor=(P.armor||0)+Math.round(2*m);}},
  {id:'snake', n:'Snake Eyes',     g:'⚁',rar:'common',max:6,d:l=>'The dice love you: +'+(4*l)+'% crit chance.',ap:()=>{P.crit=(P.crit||0)+0.04;},sc:m=>{P.crit=Math.min(0.9,(P.crit||0)+0.04*m);}},
  {id:'chips', n:'Heavy Chips',    g:'▮',rar:'rare',max:5,d:l=>'Shots hit like bricks: +'+(15*l)+'% knockback.',ap:()=>{P.kb=(P.kb||1)+0.15;},sc:m=>{P.kb=(P.kb||1)+0.15*m;}},
  {id:'tithe', n:'Blood Tithe',    g:'✝',rar:'rare',max:5,d:l=>'Every kill returns '+(1*l)+' lifeblood to you.',ap:()=>{P.onKillHeal=(P.onKillHeal||0)+1;},sc:m=>{P.onKillHeal=(P.onKillHeal||0)+Math.max(1,Math.round(m));}},
  {id:'shell', n:"Dead Man's Shell",g:'◐',rar:'epic',max:4,d:l=>'After taking a hit, remain untouchable +'+(0.1*l).toFixed(1)+'s longer.',ap:()=>{P.invBonus=(P.invBonus||0)+0.1;},sc:m=>{P.invBonus=(P.invBonus||0)+0.1*m;}},
  {id:'fortune',n:'Gilded Fortune', g:'✦',rar:'common',max:10,d:l=>'The House favors you: +'+Math.round((Math.pow(1.04,l)-1)*100)+'% XP gained.',ap:()=>{P.xpMult=(P.xpMult||1)*1.04;},sc:m=>{P.xpMult=(P.xpMult||1)*Math.pow(1.04,m);}},
  {id:'stoker', n:'Bar Stoker',     g:'⚗',rar:'common',max:10,d:l=>'Rage fuel burns richer: bar feeds +'+Math.round((Math.pow(1.04,l)-1)*100)+'%.',ap:()=>{P.ovFeed=(P.ovFeed||1)*1.04;},sc:m=>{P.ovFeed=(P.ovFeed||1)*Math.pow(1.04,m);}},
  {id:'dmg',   n:'Sharpened Aces', g:'♦',rar:'common',max:8,d:l=>'Sharper shots: +'+(5*l)+' damage.',ap:()=>{P.damage+=5;},sc:m=>{P.damage+=Math.round(5*m);}},
  {id:'fire',  n:'Swift Hands',    g:'♗',rar:'common',max:8,d:l=>'Fire faster: +'+(0.25*l)+' shots/sec.',ap:()=>{P.fireRate+=0.25;},sc:m=>{P.fireRate+=0.25*m;}},
  {id:'spd',   n:'Quick Step',     g:'♞',rar:'common',max:8,d:l=>'Fleeter of foot: +'+(20*l)+' move speed.',ap:()=>{P.speed+=20;},sc:m=>{P.speed+=Math.round(20*m);}},
  {id:'hp',    n:'Iron Vein',      g:'✚',rar:'common',max:8,d:l=>'Tougher body: +'+(30*l)+' max lifeblood.',ap:()=>{P.maxHp+=30;P.hp=Math.min(P.maxHp,P.hp+30);},sc:m=>{const a=Math.round(30*m);P.maxHp+=a;P.hp=Math.min(P.maxHp,P.hp+a);}},
  {id:'luck',  n:"Fool's Luck",    g:'◈',rar:'rare',max:6,d:l=>'Fortune favours you: +'+(6*l)+'% crit & +'+(18*l)+'% coins.',ap:()=>{P.crit=Math.min(0.9,P.crit+0.06);P.coinMult+=0.18;},sc:m=>{P.crit=Math.min(0.9,P.crit+0.06*m);P.coinMult+=0.18*m;}},
  {id:'proj',  n:'Extra Ante',     g:'❖',rar:'rare',max:4,d:l=>'+'+l+' extra bone shard'+(l>1?'s':'')+' per volley.',ap:()=>{P.projectiles+=1;},sc:m=>{P.projectiles+=Math.max(1,Math.round(m));}},
  {id:'pierce',n:'Piercing Fate',  g:'†',rar:'rare',max:4,d:l=>'Shots pierce +'+l+' additional foe'+(l>1?'s':'')+'.',ap:()=>{P.pierce+=1;},sc:m=>{P.pierce+=Math.max(1,Math.round(m));}},
  {id:'mag',   n:'Deep Pockets',   g:'◎',rar:'common',max:6,d:l=>'+'+(40*l)+' pickup range & +'+(8*l)+'% coins.',ap:()=>{P.pickup+=40;P.coinMult+=0.08;},sc:m=>{P.pickup+=Math.round(40*m);P.coinMult+=0.08*m;}},
  {id:'regen', n:'Slow Bleed',     g:'♻',rar:'rare',max:6,d:l=>'Regenerate +'+(1.0*l).toFixed(1)+' lifeblood/sec.',ap:()=>{P.regen+=1.0;P.hp=Math.min(P.maxHp,P.hp+15);},sc:m=>{P.regen+=m;P.hp=Math.min(P.maxHp,P.hp+15);}},
  {id:'exec',  n:'Executioner',    g:'‡',rar:'epic',max:5,d:l=>'Brutal crits: +'+(0.4*l).toFixed(1)+'× critical damage.',ap:()=>{P.critMult+=0.4;},sc:m=>{P.critMult+=0.4*m;}}
];
function auraRadius(){ const l=P.wlv.aura||0; return l? 86+l*12 : 0; }
function addPassiveHUD(def){ idxSee('p',def.id); const e=P.passiveList.find(x=>x.id===def.id); if(e){ e.count++; } else { P.passiveList.push({id:def.id,g:def.g,n:def.n,rar:def.rar,count:1}); } }
function passiveReward(pd){
  return { kind:'passive', id:pd.id, g:pd.g, n:pd.n, rar:pd.rar, u:pd.u,
    d:()=>pd.d(), apply:()=>{ pd.ap(); addPassiveHUD(pd); if(pd.u) owned.add(pd.id); } };
}
function skillLevel(id){ const e=P.passiveList.find(x=>x.id===id); return e?e.count:0; }
function ownedSkillCount(){ return P.passiveList.length; }
function availableSkills(){
  const canNew = ownedSkillCount() < SKILL_CAP;
  return PASSIVES.filter(s=>{ if(s.rar==='mythic') return false; const lv=skillLevel(s.id); if(s.rar==='ascend' && lv===0) return false; return lv>0 ? lv<s.max : canNew; });
}
function grantSkill(def, levels){
  const cur=skillLevel(def.id); const add=Math.min(levels, def.max-cur);
  for(let i=0;i<add;i++){ def.ap(); addPassiveHUD(def); }
  if(def.u) owned.add(def.id);
  renderRelics(); bump('s_'+def.id, skillLevel(def.id));
  if(add>0) setTimeout(()=>announce('✦ '+def.n.toUpperCase()+' — Lv '+cur+' → '+(cur+add)+' ✦', true), 60);
  grantOverflow(levels-add);
  return add;
}
