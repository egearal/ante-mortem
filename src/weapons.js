"use strict";
/* ---------- weapons, passives, boons ---------- */
const WEAPON_CAP=5, SKILL_CAP=7;
const WEAPONS=[
  {id:'bolt',  n:'Bone Bolt',      g:'♠',rar:'common',max:6,d:l=>'Fires '+((l>=2?1:0)+(l>=4?1:0)+(l>=6?1:0)+1)+' bone shard'+(((l>=2?1:0)+(l>=4?1:0)+(l>=6?1:0)+1)>1?'s':'')+' at the nearest foe'+(l>=3?', piercing':'')+'. +'+Math.round(12*(l-1))+'% damage.'},
  {id:'cards', n:"Dealer's Hand",  g:'♣',rar:'common',max:5,d:l=>'Throws a fan of '+(3+l)+' piercing cards in your facing.'},
  {id:'orbit', n:'Roulette Orbit', g:'◍',rar:'rare',max:5,d:l=>l+' spectral chip'+(l>1?'s':'')+' orbit you, grinding foes on contact.'},
  {id:'scythe',n:"Reaper's Scythe",g:'⚔',rar:'rare',max:5,d:l=>'A sweeping blade carves a '+Math.round(100+30*l)+'% reach arc around you.'},
  {id:'spark', n:'Cursed Spark',   g:'⚡',rar:'epic',max:5,d:l=>'Every hit forks chain-lightning to '+(l+1)+' nearby foes.'},
  {id:'chand', n:'Chandelier Fall',g:'✦',rar:'epic',max:5,d:l=>'Candlelight smites a random foe for heavy damage every '+(2.8-l*0.25).toFixed(1)+'s.'},
  {id:'knives',n:'Fan of Knives',  g:'※',rar:'rare',max:5,d:l=>'Hurls '+(4+l)+' spinning knives outward every couple seconds.'},
  {id:'aura',  n:'Grave Miasma',   g:'☁',rar:'rare',max:5,d:l=>'A rotting cloud (radius '+(90+l*14)+') steadily burns any foe inside it.'},
  {id:'nova',  n:'Blood Nova',     g:'✹',rar:'epic',max:5,d:l=>'A shockwave erupts from you every '+(3.2-l*0.3).toFixed(1)+'s, blasting all nearby.'},
  {id:'seeker',n:'Wraith Skull',   g:'☠',rar:'legendary',max:5,d:l=>'Looses '+(1+l)+' homing skull'+((1+l)>1?'s':'')+' that hunt down the living.'},
  {id:'coil',  n:'Gallows Coil',   g:'§',rar:'rare',max:5,d:l=>'A spectral noose lashes the nearest foe every '+(1.6-l*0.12).toFixed(1)+'s for '+(180+l*40)+'% damage, yanking it toward you.'},
  {id:'mortar',n:'Chip Mortar',    g:'☄',rar:'epic',max:5,d:l=>'Lobs an explosive house chip; detonates for '+(90+l*20)+'% area damage in a '+(70+l*12)+'px blast.'},
  {id:'lantern',n:'Dead Lantern',  g:'🏮',rar:'rare',max:5,d:l=>'A ghost-lantern floats beside you, sniping '+(1+Math.floor(l/2))+' bolt'+(l>=2?'s':'')+' at the nearest foe every '+(1.4-l*0.1).toFixed(1)+'s.'},
  {id:'fangs', n:"Rat King's Fangs",g:'∴',rar:'rare',max:5,d:l=>'Releases '+(2+l)+' gnashing spirits that swarm and bite the living.'},
  {id:'bell',  n:'Funeral Bell',   g:'🔔',rar:'epic',max:5,d:l=>'Tolls every '+(4.0-l*0.35).toFixed(1)+'s — all foes within '+(130+l*20)+'px are hurled back and struck.'},
  {id:'dice',  n:'Loaded Die',     g:'⚂',rar:'epic',max:5,d:l=>'Throws a cursed die that ricochets between '+(2+l)+' victims.'},
  {id:'phantom',n:'Card Shark',    g:'♤',rar:'epic',max:5,d:l=>'A phantom dealer hurls a wide spectral card-wave that pierces '+(4+l)+' foes.'},
  {id:'coffin',n:'Coffin Nails',   g:'⚰',rar:'rare',max:5,d:l=>'Fires '+(2+l)+' iron nails behind you — the House covers your retreat.'},
  {id:'moths', n:'Grave Moths',    g:'❋',rar:'legendary',max:5,d:l=>'Breeds hungry moths every '+(1.1-l*0.08).toFixed(1)+'s that hunt flesh on their own.'},
  {id:'razor', n:'Razor Deck',     g:'✂',rar:'common',max:5,d:l=>'Hurls '+(1+Math.floor(l/2))+' card-sliver'+(l>=2?'s':'')+' that arc out and RETURN through the crowd.'},
  {id:'cinders',n:'Cinder Spit',   g:'🔥',rar:'common',max:5,d:l=>'Spits a cone of '+(5+l)+' burning embers every '+(1.6-l*0.1).toFixed(1)+'s. Short reach, cruel heat.'},
  {id:'pendulum',n:'Pendulum',     g:'⌛',rar:'common',max:5,d:l=>'A metronome blade swings before you, carving a '+Math.round(70+l*14)+'px arc. Tick. Tock.'},
  {id:'stakes',n:'Iron Stakes',    g:'⚒',rar:'rare',max:5,d:l=>'Fires piercing stakes that PLANT in the marble for 2.2s, wounding all who walk over them.'},
  {id:'serpent',n:'Brass Serpent', g:'≈',rar:'rare',max:5,d:l=>'A slithering bolt weaves through '+(3+l)+' foes, biting for '+(90+l*18)+'% damage.'},
  {id:'chalice',n:'Poison Chalice',g:'🍷',rar:'rare',max:5,d:l=>'Lobs a goblet that shatters into a bubbling pool ('+(56+l*9)+'px, '+(2.2+l*0.3).toFixed(1)+'s) — the living rot inside it.'},
  {id:'gramo', n:'Gramophone',     g:'🎺',rar:'epic',max:5,d:l=>'Blares '+(2+Math.floor(l/2))+' shattering sound-waves in your facing every '+(2.2-l*0.15).toFixed(1)+'s.'},
  {id:'cylinder',n:'Roulette Cylinder',g:'✪',rar:'epic',max:5,d:l=>'A six-round burst every '+(2.6-l*0.18).toFixed(1)+'s — the sixth chamber is ALWAYS a golden crit.'},
  {id:'candelabra',n:'Candelabra', g:'🕯',rar:'legendary',max:5,d:l=>'Three living candles orbit you, each sniping fire every '+(1.3-l*0.09).toFixed(1)+'s.'},
  {id:'guillotine',n:'The Guillotine',g:'🗡',rar:'legendary',max:5,d:l=>'A colossal blade falls on the thickest crowd every '+(4.6-l*0.35).toFixed(1)+'s for '+(300+l*80)+'% damage.'}
];
function nearestFoe(rg){ let t=null,td=(rg||1e9)*(rg||1e9); for(const e of enemies){ const d2=(e.x-P.x)**2+(e.y-P.y)**2; if(d2<td){td=d2;t=e;} } return t; }
function fireCoil(l){ const t=nearestFoe(240+l*25); if(!t) return;
  const dmg=P.damage*(1.8+0.4*l); t.hp-=dmg; trackDmg(dmg); t.flash=0.15; ftext(t.x,t.y-t.r,Math.round(dmg),'#ff7edb');
  const a=Math.atan2(P.y-t.y,P.x-t.x); t.kx+=Math.cos(a)*260; t.ky+=Math.sin(a)*260;
  for(let i=0;i<7;i++){ const f=i/6; spark(P.x+(t.x-P.x)*f-3,P.y+(t.y-P.y)*f,P.x+(t.x-P.x)*f+3,P.y+(t.y-P.y)*f,'#ff7edb'); }
  tone(180,0.1,'sawtooth',0.1,90); SFX.hit(); if(t.hp<=0){ const ix=enemies.indexOf(t); if(ix>=0) killEnemy(t,ix); } }
function fireMortar(l){ const t=nearestFoe(520)||{x:P.x+rnd(-200,200),y:P.y+rnd(-200,200)};
  const a=Math.atan2(t.y-P.y,t.x-P.x)+rnd(-0.15,0.15), sp=P.projSpeed*0.55;
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:8,dmg:P.damage*(0.9+0.2*l),life:1.1,blast:70+l*12,spin:0});
  tone(120,0.16,'sine',0.12,60); }
function fireLantern(l){ const t=nearestFoe(430); if(!t) return;
  const lx=P.x+Math.cos(gt*1.7)*46, ly=P.y+Math.sin(gt*1.7)*46-22;
  parts.push({x:lx,y:ly,vx:0,vy:-20,life:0.3,col:'#ffb74d',r:4});
  const n=1+Math.floor(l/2);
  for(let i=0;i<n;i++){ const a=Math.atan2(t.y-ly,t.x-lx)+rnd(-0.06,0.06);
    bullets.push({x:lx,y:ly,px:lx,py:ly,vx:Math.cos(a)*P.projSpeed*1.15,vy:Math.sin(a)*P.projSpeed*1.15,r:4,dmg:P.damage*0.85,life:0.9,spin:0}); }
  tone(1400,0.05,'sine',0.06); }
function fireFangs(n){ for(let i=0;i<n;i++){ const a=Math.random()*6.283;
    bullets.push({x:P.x+Math.cos(a)*18,y:P.y+Math.sin(a)*18,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.7,vy:Math.sin(a)*P.projSpeed*0.7,r:3.5,dmg:P.damage*0.55,life:2.2,seek:true,spin:0}); }
  tone(700,0.06,'square',0.05); }
function funeralBell(l){ const R=130+l*20;
  ring(P.x,P.y,R,'#ffd36b'); ring(P.x,P.y,R*0.6,'#fff2c0'); shake=Math.min(14,shake+6);
  SFX.dingBells(); tone(220,0.5,'sine',0.16,110);
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], d=Math.hypot(e.x-P.x,e.y-P.y);
    if(d<R){ const dmg=P.damage*(0.8+0.25*l); e.hp-=dmg; trackDmg(dmg); e.flash=0.12;
      const a=Math.atan2(e.y-P.y,e.x-P.x); e.kx+=Math.cos(a)*420; e.ky+=Math.sin(a)*420;
      ftext(e.x,e.y-e.r,Math.round(dmg),'#ffd36b'); if(e.hp<=0) killEnemy(e,i); } } }
function fireDie(l){ const t=nearestFoe(460); if(!t) return;
  const a=Math.atan2(t.y-P.y,t.x-P.x);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.9,vy:Math.sin(a)*P.projSpeed*0.9,r:6,dmg:P.damage*1.25,life:2.6,bounce:2+l,spin:0});
  SFX.diceRattle(); }
function firePhantom(l){ const t=nearestFoe(480), a=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.8,vy:Math.sin(a)*P.projSpeed*0.8,r:20,dmg:P.damage*1.1,life:0.85,pierce:4+l,spin:0});
  burst(P.x,P.y,6,'#c9d8ff'); tone(500,0.12,'triangle',0.09,260); }
function fireCoffin(n){ const back=P.aim+Math.PI;
  for(let i=0;i<n;i++){ const a=back+(i-(n-1)/2)*0.28;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed,vy:Math.sin(a)*P.projSpeed,r:4,dmg:P.damage*0.95,life:0.8,pierce:1,spin:0}); }
  tone(150,0.08,'square',0.09,80); }
function fireMoths(){ const a=Math.random()*6.283;
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.5,vy:Math.sin(a)*P.projSpeed*0.5,r:3,dmg:P.damage*0.45,life:3.5,seek:true,spin:0});
  parts.push({x:P.x,y:P.y,vx:rnd(-30,30),vy:rnd(-40,-10),life:0.4,col:'#d7ffb8',r:2}); }
/* ── the new arsenal (Batch 7) — each with its own silhouette in flight ── */
function fireRazor(l){ const t=nearestFoe(420); if(!t) return;
  const n=1+Math.floor(l/2);
  for(let i=0;i<n;i++){ const a=Math.atan2(t.y-P.y,t.x-P.x)+(i-(n-1)/2)*0.35;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.9,vy:Math.sin(a)*P.projSpeed*0.9,
      r:6,dmg:P.damage*(1.0+0.22*l),life:1.7,kind:'razor',pierce:9,spin:0,_out:0.8}); }
  tone(1200,0.07,'square',0.07); noise(0.05,0.04,4200); }
function fireCinders(l){ const t=nearestFoe(240), a0=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
  for(let i=0;i<5+l;i++){ const a=a0+rnd(-0.5,0.5), sp=P.projSpeed*(0.45+Math.random()*0.3);
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      r:3,dmg:P.damage*0.38,life:0.34+Math.random()*0.12,kind:'ember',spin:0}); }
  noise(0.12,0.08,1600); tone(220,0.1,'sawtooth',0.06,90); }
function fireStakes(l){ const t=nearestFoe(460); if(!t) return;
  const a=Math.atan2(t.y-P.y,t.x-P.x);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*1.25,vy:Math.sin(a)*P.projSpeed*1.25,
    r:5,dmg:P.damage*(1.1+0.2*l),life:0.55,kind:'stake',pierce:2,spin:0,_plant:l});
  tone(160,0.09,'square',0.1,80); }
function fireSerpent(l){ const t=nearestFoe(430); if(!t) return;
  const a=Math.atan2(t.y-P.y,t.x-P.x);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.8,vy:Math.sin(a)*P.projSpeed*0.8,
    r:5,dmg:P.damage*(0.9+0.18*l),life:1.4,kind:'serpent',pierce:3+l,spin:0,_ph:Math.random()*6.28});
  tone(740,0.12,'triangle',0.07,520); }
function fireChalice(l){ const t=nearestFoe(420)||{x:P.x+rnd(-180,180),y:P.y+rnd(-180,180)};
  const a=Math.atan2(t.y-P.y,t.x-P.x)+rnd(-0.1,0.1);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.5,vy:Math.sin(a)*P.projSpeed*0.5,
    r:6,dmg:P.damage*0.4,life:0.85,kind:'chalice',spin:0,_pool:l});
  tone(980,0.08,'sine',0.06); noise(0.04,0.03,3000); }
function fireGramo(l){ const t=nearestFoe(400), a0=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
  const n=2+Math.floor(l/2);
  for(let i=0;i<n;i++) setTimeout(()=>{ if(state!=='playing')return;
    waves.push({x:P.x,y:P.y,a:a0,r:26,t:0.55,l,id:++window._waveId}); SFX.dingHit(2+i); },i*140);
  tone(180,0.3,'sawtooth',0.1,110); }
function fireCylinder(l){ P._cylN=6; P._cylGap=0; P._cylLvl=l;
  SFX.diceRattle(); tone(300,0.08,'square',0.09,150); }
function fireCandles(l){ // three orbiting candles snipe independently
  for(let i=0;i<3;i++){ const t=nearestFoe(430); if(!t) break;
    const ca=gt*1.4+i*2.094, cx=P.x+Math.cos(ca)*52, cy=P.y+Math.sin(ca)*52-14;
    const a=Math.atan2(t.y-cy,t.x-cx)+rnd(-0.05,0.05);
    bullets.push({x:cx,y:cy,px:cx,py:cy,vx:Math.cos(a)*P.projSpeed*1.1,vy:Math.sin(a)*P.projSpeed*1.1,
      r:3.5,dmg:P.damage*(0.6+0.1*l),life:0.9,kind:'flamebolt',spin:0}); }
  tone(1500,0.05,'sine',0.05); }
function dropGuillotine(l){
  // find the densest pack within reach
  let bx=null,by=null,bn=0;
  for(const e of enemies){ let n=0; for(const o of enemies){ if((o.x-e.x)**2+(o.y-e.y)**2<90*90) n++; }
    if(n>bn && Math.hypot(e.x-P.x,e.y-P.y)<520){ bn=n; bx=e.x; by=e.y; } }
  if(bx===null) return;
  guils.push({x:bx,y:by,t:0.55,l,fell:false});
  tone(90,0.3,'sine',0.2,55); SFX.murmur(); }
function weaponReward(w){
  const cur=P.wlv[w.id]||0;
  return { kind:'weapon', id:w.id, g:w.g, n:w.n+(cur>0?' — Lv '+(cur+1):''), rar:w.rar, cur,
    d:()=>{ const nl=Math.min(w.max,cur+1); return (cur===0?'NEW WEAPON · ':'Lv '+nl+' · ')+w.d(nl); },
    apply:()=>{ P.wlv[w.id]=Math.min(w.max,cur+1); idxSee('w',w.id); } };
}
function fire(){
  // target nearest enemy
  let best=null, bd=1e9;
  for(const e of enemies){ const dx=e.x-P.x, dy=e.y-P.y, d=dx*dx+dy*dy; if(d<bd){bd=d;best=e;} }
  const baseAng = best? Math.atan2(best.y-P.y,best.x-P.x) : P.aim;
  const bl=P.wlv.bolt||1;
  const dmgBase = P.damage*(1+0.12*(bl-1))*(P.giltDmg? 1+Math.min(1.5,P.coins*0.001) : 1);
  const n=P.projectiles + (bl>=2?1:0) + (bl>=4?1:0) + (bl>=6?1:0);
  const pierce=P.pierce + (bl>=3?1:0) + (bl>=5?1:0);
  const spread=n>1?0.16:0;
  for(let i=0;i<n;i++){
    const ang=baseAng+(n>1? (i-(n-1)/2)*spread : 0);
    P.shotCount=(P.shotCount||0)+1;
    let crit=Math.random()<Math.min(0.9,P.crit);
    const lucky=(P.shotCount%50===0); if(lucky) crit=true;
    if(P.croup && P.shotCount%7===0) crit=true;
    const kill=Math.random()<P.instakill;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(ang)*P.projSpeed,vy:Math.sin(ang)*P.projSpeed,
      life:P.projLife,r:P.projRadius,dmg:dmgBase*(crit?P.critMult:1),crit,lucky,kill,pierce});
  }
  SFX.shoot(); tone(1600+Math.random()*400,0.03,'square',0.045);
  parts.push({x:P.x+Math.cos(P.aim)*16,y:P.y+Math.sin(P.aim)*16,vx:Math.cos(P.aim)*60,vy:Math.sin(P.aim)*60,life:0.08,col:'#ffe9a8',r:4.2});
  for(let sm=0;sm<2;sm++) parts.push({x:P.x+Math.cos(P.aim)*14,y:P.y+Math.sin(P.aim)*14,vx:Math.cos(P.aim)*30+rnd(-14,14),vy:Math.sin(P.aim)*30-16,life:rnd(.2,.4),col:'#6a5c58',r:rnd(1.4,2.4)});
}
function fireKnives(n){
  for(let i=0;i<n;i++){
    const ang=(i/n)*6.283 + gt*0.7;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(ang)*P.projSpeed*0.9,vy:Math.sin(ang)*P.projSpeed*0.9,
      life:P.projLife*0.9,r:P.projRadius,dmg:P.damage*1.15,crit:false,kill:false,pierce:1,kind:'knife',spin:Math.random()*6.28});
  }
  SFX.knife();
}
function fireCards(n){
  let best=null,bd=1e9; for(const e of enemies){ const dx=e.x-P.x,dy=e.y-P.y,d=dx*dx+dy*dy; if(d<bd){bd=d;best=e;} }
  const base=best?Math.atan2(best.y-P.y,best.x-P.x):P.aim;
  const spread=0.42;
  for(let i=0;i<n;i++){
    const ang=base+(i-(n-1)/2)*(spread/Math.max(1,n-1))*2;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(ang)*P.projSpeed*1.05,vy:Math.sin(ang)*P.projSpeed*1.05,
      life:P.projLife*1.1,r:P.projRadius+1,dmg:P.damage*1.3,crit:Math.random()<P.crit,kill:false,pierce:2,kind:'card',spin:Math.random()*6.28});
  }
  SFX.card();
}
function bloodNova(level){
  const R=120+level*34;
  ring(P.x,P.y,R,'#ff3344'); ring(P.x,P.y,R*0.72,'#ffd36b');
  setTimeout(()=>{ if(state==='playing') ring(P.x,P.y,R*1.12,'#8b1620'); },70);
  SFX.nova(); shake=Math.min(14,shake+5); flash(0.18,'#ff3344');
  for(const e of enemies){ const d=Math.hypot(e.x-P.x,e.y-P.y); if(d<R){ const dm=P.damage*(2.2+level*0.7); e.hp-=dm; trackDmg(dm); e.flash=0.12; const kd=Math.max(1,d); e.kx+=(e.x-P.x)/kd*260; e.ky+=(e.y-P.y)/kd*260; ftext(e.x,e.y-e.r,Math.round(dm),'#ff8a9a'); if(e.hp<=0){ const idx=enemies.indexOf(e); if(idx>=0)killEnemy(e,idx); } } }
  for(let i=0;i<26;i++){ const a=(i/26)*6.28+rnd(-0.1,0.1), s=rnd(160,330);
    parts.push({x:P.x+Math.cos(a)*14,y:P.y+Math.sin(a)*14,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.28,.5),col:i%3?'#ff5566':'#ffd36b',r:rnd(1.8,3.6)}); }
}
function fireSeekers(n){
  for(let i=0;i<n;i++){
    const a=Math.random()*6.28;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.7,vy:Math.sin(a)*P.projSpeed*0.7,
      life:2.4,r:P.projRadius+2,dmg:P.damage*1.8,crit:Math.random()<P.crit,kill:false,pierce:1,kind:'seeker',seek:true,spin:0});
  }
  SFX.seeker();
}
function ownedWeaponCount(){ return WEAPONS.filter(w=>(P.wlv[w.id]||0)>0).length; }
function availableWeapons(){
  const canNew = ownedWeaponCount() < WEAPON_CAP;
  return WEAPONS.filter(w=>{ const lv=P.wlv[w.id]||0; return lv>0 ? lv<w.max : canNew; });
}
// levels the House can't fit into a maxed item are paid out in coins — a win must always pay
function grantOverflow(lost){
  if(lost<=0) return; const pay=lost*12;
  P.coins+=pay; LT.coins+=pay; bump('runCoins',P.coins); bump('ltCoins',LT.coins);
  setTimeout(()=>announce('◈ MAXED — THE HOUSE PAYS OVERFLOW: +'+pay+' COINS ◈', true), 320);
  SFX.cashout(); coinRain(Math.min(20,6+lost*3));
}
function grantWeaponLevels(def, levels){
  const cur=P.wlv[def.id]||0; P.wlv[def.id]=Math.min(def.max, cur+levels); renderRelics();
  bump('w_'+def.id, P.wlv[def.id]); recCheck('weaponLv', P.wlv[def.id], def.n+' level'); idxSee('w',def.id);
  const nl=P.wlv[def.id];
  if(nl>cur) setTimeout(()=>announce('⚔ '+def.n.toUpperCase()+' — Lv '+cur+' → '+nl+' ⚔', true), 60);
  grantOverflow(levels-(nl-cur));
  return nl;
}
