"use strict";
/* ---------- weapons, passives, boons ---------- */
const WEAPON_CAP=5, SKILL_CAP=7;
const WEAPONS=[
  {id:'bolt',  n:'Bone Bolt',      g:'♠',rar:'common',max:6,d:l=>'Fires '+((l>=2?1:0)+(l>=4?1:0)+(l>=6?1:0)+1)+' bone shard'+(((l>=2?1:0)+(l>=4?1:0)+(l>=6?1:0)+1)>1?'s':'')+' at the nearest foe'+(l>=3?', piercing':'')+'. +'+Math.round(12*(l-1))+'% damage.'},
  {id:'cards', n:"Dealer's Hand",  g:'♣',rar:'uncommon',max:5,d:l=>'Throws a fan of '+(3+l)+' piercing cards in your facing.'},
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
  {id:'fangs', n:"Rat King's Fangs",g:'∴',rar:'uncommon',max:5,d:l=>'Releases '+(2+l)+' gnashing spirits that swarm and bite the living.'},
  {id:'bell',  n:'Funeral Bell',   g:'🔔',rar:'epic',max:5,d:l=>'Tolls every '+(4.0-l*0.35).toFixed(1)+'s — all foes within '+(130+l*20)+'px are hurled back and struck.'},
  {id:'dice',  n:'Loaded Die',     g:'⚂',rar:'epic',max:5,d:l=>'Throws a cursed die that ricochets between '+(2+l)+' victims.'},
  {id:'phantom',n:'Card Shark',    g:'♤',rar:'epic',max:5,d:l=>'A phantom dealer hurls a wide spectral card-wave that pierces '+(4+l)+' foes.'},
  {id:'coffin',n:'Coffin Nails',   g:'⚰',rar:'uncommon',max:5,d:l=>'Fires '+(2+l)+' iron nails behind you — the House covers your retreat.'},
  {id:'moths', n:'Grave Moths',    g:'❋',rar:'legendary',max:5,d:l=>'Breeds hungry moths every '+(1.1-l*0.08).toFixed(1)+'s that hunt flesh on their own.'},
  {id:'razor', n:'Razor Deck',     g:'✂',rar:'common',max:5,d:l=>'Hurls '+(1+Math.floor(l/2))+' card-sliver'+(l>=2?'s':'')+' that arc out and RETURN through the crowd.'},
  {id:'cinders',n:'Cinder Spit',   g:'🔥',rar:'common',max:5,d:l=>'Spits a cone of '+(5+l)+' burning embers every '+(1.6-l*0.1).toFixed(1)+'s. Short reach, cruel heat.'},
  {id:'pendulum',n:'Pendulum',     g:'⌛',rar:'uncommon',max:5,d:l=>'A metronome blade swings before you, carving a '+Math.round(70+l*14)+'px arc. Tick. Tock.'},
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
function fireMortar(l){ const t=nearestFoe(520)||{x:P.x+rrnd('combat',-200,200),y:P.y+rrnd('combat',-200,200)};
  const a=Math.atan2(t.y-P.y,t.x-P.x)+rrnd('combat',-0.15,0.15), sp=P.projSpeed*0.55;
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:8,dmg:P.damage*(0.9+0.2*l),life:1.1,blast:70+l*12,spin:0});
  tone(120,0.16,'sine',0.12,60); }
function fireLantern(l){ const t=nearestFoe(430); if(!t) return;
  const lx=P.x+Math.cos(gt*1.7)*46, ly=P.y+Math.sin(gt*1.7)*46-22;
  parts.push({x:lx,y:ly,vx:0,vy:-20,life:0.3,col:'#ffb74d',r:4});
  const n=1+Math.floor(l/2);
  for(let i=0;i<n;i++){ const a=Math.atan2(t.y-ly,t.x-lx)+rrnd('combat',-0.06,0.06);
    bullets.push({x:lx,y:ly,px:lx,py:ly,vx:Math.cos(a)*P.projSpeed*1.15,vy:Math.sin(a)*P.projSpeed*1.15,r:4,dmg:P.damage*0.85,life:0.9,spin:0}); }
  tone(1400,0.05,'sine',0.06); }
function fireFangs(n){ for(let i=0;i<n;i++){ const a=rng('combat')*6.283;
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
function fireMoths(){ const a=rng('combat')*6.283;
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
  for(let i=0;i<5+l;i++){ const a=a0+rrnd('combat',-0.5,0.5), sp=P.projSpeed*(0.45+rng('combat')*0.3);
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      r:3,dmg:P.damage*0.38,life:0.34+rng('combat')*0.12,kind:'ember',spin:0}); }
  noise(0.12,0.08,1600); tone(220,0.1,'sawtooth',0.06,90); }
function fireStakes(l){ const t=nearestFoe(460); if(!t) return;
  const a=Math.atan2(t.y-P.y,t.x-P.x);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*1.25,vy:Math.sin(a)*P.projSpeed*1.25,
    r:5,dmg:P.damage*(1.1+0.2*l),life:0.55,kind:'stake',pierce:2,spin:0,_plant:l});
  tone(160,0.09,'square',0.1,80); }
function fireSerpent(l){ const t=nearestFoe(430); if(!t) return;
  const a=Math.atan2(t.y-P.y,t.x-P.x);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.8,vy:Math.sin(a)*P.projSpeed*0.8,
    r:5,dmg:P.damage*(0.9+0.18*l),life:1.4,kind:'serpent',pierce:3+l,spin:0,_ph:rng('combat')*6.28});
  tone(740,0.12,'triangle',0.07,520); }
function fireChalice(l){ const t=nearestFoe(420)||{x:P.x+rrnd('combat',-180,180),y:P.y+rrnd('combat',-180,180)};
  const a=Math.atan2(t.y-P.y,t.x-P.x)+rrnd('combat',-0.1,0.1);
  bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.5,vy:Math.sin(a)*P.projSpeed*0.5,
    r:6,dmg:P.damage*0.4,life:0.85,kind:'chalice',spin:0,_pool:l});
  tone(980,0.08,'sine',0.06); noise(0.04,0.03,3000); }
function fireGramo(l){ const t=nearestFoe(400), a0=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
  const n=2+Math.floor(l/2);
  for(let i=0;i<n;i++) setTimeout(()=>{ if(state!=='playing')return;
    waves.push({x:P.x,y:P.y,a:a0,r:26,t:0.55,l,id:++window._waveId});
    tone(196,0.14,'triangle',0.055,150); },i*140); // a muted felt horn, not a bee
  tone(98,0.22,'sine',0.07,70); }
function fireCylinder(l){ P._cylN=6; P._cylGap=0; P._cylLvl=l;
  SFX.diceRattle(); tone(300,0.08,'square',0.09,150); }
function fireCandles(l){ // three orbiting candles snipe independently
  for(let i=0;i<3;i++){ const t=nearestFoe(430); if(!t) break;
    const ca=gt*1.4+i*2.094, cx=P.x+Math.cos(ca)*52, cy=P.y+Math.sin(ca)*52-14;
    const a=Math.atan2(t.y-cy,t.x-cx)+rrnd('combat',-0.05,0.05);
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
    let crit=rng('combat')<Math.min(0.9,P.crit);
    const lucky=(P.shotCount%50===0); if(lucky) crit=true;
    if(P.croup && P.shotCount%7===0) crit=true;
    const kill=rng('combat')<P.instakill;
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
      life:P.projLife*1.1,r:P.projRadius+1,dmg:P.damage*1.3,crit:rng('combat')<P.crit,kill:false,pierce:2,kind:'card',spin:rng('combat')*6.28});
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
    const a=rng('combat')*6.28;
    bullets.push({x:P.x,y:P.y,px:P.x,py:P.y,vx:Math.cos(a)*P.projSpeed*0.7,vy:Math.sin(a)*P.projSpeed*0.7,
      life:2.4,r:P.projRadius+2,dmg:P.damage*1.8,crit:rng('combat')<P.crit,kill:false,pierce:1,kind:'seeker',seek:true,spin:0});
  }
  SFX.seeker();
}
function ownedWeaponCount(){ return WEAPONS.filter(w=>(P.wlv[w.id]||0)>0).length; }
// THE ARSENAL DRIP — 14 blades on night one; the House hands over the rest as
// your RANK climbs. Pure derivation: old saves own everything at/below their
// rank automatically, and nothing is ever taken away mid-run.
const WEAPON_UNLOCKS={coil:3, chalice:5, spark:7, chand:9, dice:11, mortar:13, nova:15, bell:18, phantom:21, gramo:24, cylinder:27, seeker:30, moths:34, candelabra:38, guillotine:42};
function weaponUnlocked(id){ if(DLY_RNG) return true; /* B1: the debt opens the whole armory, for everyone */ const thr=WEAPON_UNLOCKS[id]; return !thr || (typeof RANK!=='undefined' && RANK.rank>=thr); }
function nextArmUnlock(){
  let best=null;
  for(const id in WEAPON_UNLOCKS){ const thr=WEAPON_UNLOCKS[id];
    if(RANK.rank<thr && (!best||thr<best.thr)) best={id,thr}; }
  return best;
}
function availableWeapons(){
  const canNew = ownedWeaponCount() < WEAPON_CAP;
  return WEAPONS.filter(w=>{ const lv=P.wlv[w.id]||0; return lv>0 ? lv<w.max : (canNew && weaponUnlocked(w.id)); });
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
  if(nl>=def.max) secret('maxlove','THE FINAL EDGE');
  if(nl>cur) setTimeout(()=>announce('⚔ '+def.n.toUpperCase()+' — Lv '+cur+' → '+nl+' ⚔', true), 60);
  grantOverflow(levels-(nl-cur));
  return nl;
}

/* ==== C1 — THE PAIRINGS (weapon evolutions) ====
   A weapon at MAX + its one paired skill (any level) → the next slot visit opens
   THE PAIRING: the weapon is reborn as something the House keeps in the back
   room. Evolved weapons REPLACE their parent's attack (the Bone Bolt is the
   exception: the Ossuary rides on top of your main gun). State lives on P.evo
   ({weaponId: pairingId}) so it dies with the run. All evolved projectiles run
   through their own small engine here (evoShots/evoPlants), ticked by one hook
   in update() and drawn by one hook in render(). */
const PAIRINGS=[
  {id:'ossuary', w:'bolt',     p:'proj',   n:'THE OSSUARY',        g:'💀', hint:'The bones want more mouths to fire from…',
    d:l=>'Your bone bolts keep flying (+1 shard per volley), and every 0.75s a skull bursts from your chest: it hits for 400% damage, splits into 12 bone splinters (130%), and each splinter shatters again into 3 shards (70%).'},
  {id:'stacked', w:'cards',    p:'snake',  n:'THE STACKED DECK',   g:'🃏', hint:'A dealer who never loses would need loaded eyes…',
    d:l=>'Every 1.3s the House deals a full 13-card pinwheel around you — every card is a CRITICAL hit (110% × crit), piercing 3. One card is the ACE OF SPADES: 330% × crit, pierces everything, and detonates (90px) when it lands.'},
  {id:'cuts',    w:'knives',   p:'fire',   n:'THE THOUSAND CUTS',  g:'✶', hint:'The knives ask for quicker hands…',
    d:l=>'Two counter-spinning spigots spray a double helix of knives — 22 per second, 140% damage each, piercing 2. A wall of steel that never stops turning.'},
  {id:'eye',     w:'lantern',  p:'mag',    n:'THE EYE IN THE SKY', g:'👁', hint:'The lantern wants to see your pockets…',
    d:l=>'A casino searchlight sweeps around you (380px beam): 700% damage per second to all in its light, and it drags every coin and soul it touches into your pocket. Every 3s the Eye takes a photograph — a 800% flash (110px) at the beam\'s end.'},
  {id:'ratking', w:'fangs',    p:'tithe',  n:"THE RAT KING'S FEAST",g:'🐀', hint:'The swarm would breed, if fed on blood…',
    d:l=>'A horde of up to 14 plague-rats lives at your heel, hunting on their own and biting for 90% damage. Every kill a rat makes births two more (horde of 30) and returns 1 lifeblood.'},
  {id:'maiden',  w:'coffin',   p:'corset', n:'THE IRON MAIDEN',    g:'♖', hint:'The nails would rather be a whole box… with ribs…',
    d:l=>'Four spiked iron caskets orbit you, crushing for 700%/s and hurling foes away. Every 2.6s they fling out to 260px and slam back, each landing a 600% blast (60px). You wear the iron too: +3 armor.'},
  {id:'hand',    w:'razor',    p:'leech',  n:'THE BLOODY HAND',    g:'🩸', hint:'The returning cards come back… thirsty…',
    d:l=>'Every 1.1s a crimson hand opens: five blade-fingers trace a rose out to 230px and close back on you, cutting everything for 300% damage. Every cut returns 0.4 lifeblood.'},
  {id:'cremat',  w:'cinders',  p:'thorn',  n:'THE CREMATORIUM',    g:'⚱', hint:'The embers would like to be provoked…',
    d:l=>'Three jets of furnace fire turn around you (150px), burning 400%/s and setting foes ABLAZE (150%/s for 2.5s). Burning dead spread the fire. Any foe that strikes you triggers a 140px firestorm.'},
  {id:'garden',  w:'stakes',   p:'pierce', n:"THE IMPALER'S GARDEN",g:'🌹', hint:'The stakes want to go all the way through…',
    d:l=>'Fires 3 stakes per second that pierce EVERYTHING (160%) and plant for 5s. Planted stakes string barbed wire to their neighbours — anything crossing the wire bleeds 600%/s and is slowed.'},
  {id:'russian', w:'cylinder', p:'exec',   n:'RUSSIAN ROULETTE',   g:'⚅', hint:'Six chambers, and an executioner\'s patience…',
    d:l=>'Five golden rounds (each a guaranteed crit at 250%, piercing 4), one every 0.7s — and the SIXTH chamber is a screen-wide EXECUTION: every foe in sight takes 350% × crit, and lesser foes left under 30% are simply dead.'}
];
const PAIR_BY_W={}; PAIRINGS.forEach(pr=>{ PAIR_BY_W[pr.w]=pr; pr.rar='pairing'; pr.max=1; });
let evoShots=[], evoPlants=[], _evoSeq=-1;
function evoHas(wid){ return !!(typeof P!=='undefined' && P && P.evo && P.evo[wid]); }
function evoOn(pid){ const pr=PAIRINGS.find(x=>x.id===pid); return !!(pr && P && P.evo && P.evo[pr.w]===pid); }
function pairingFor(wid){ return PAIR_BY_W[wid]||null; }
function pairReady(pr){ const W=WEAPONS.find(w=>w.id===pr.w); return !!(W && P && (P.wlv[pr.w]||0)>=W.max && skillLevel(pr.p)>0 && !(P.evo&&P.evo[pr.w])); }
function readyPairing(){ if(typeof P==='undefined'||!P) return null; for(const pr of PAIRINGS) if(pairReady(pr)) return pr; return null; }
function evoClaim(pr){
  P.evo=P.evo||{}; P.evo[pr.w]=pr.id;
  if(pr.id==='maiden') P.armor=(P.armor||0)+3;
  if(pr.id==='ossuary') P.projectiles=(P.projectiles||1)+1;
  P._evT=P._evT||{}; P._evT[pr.id]=0;
  try{ LT.pairings=(LT.pairings||0)+1; LT.pairBy=LT.pairBy||{}; LT.pairBy[pr.id]=(LT.pairBy[pr.id]||0)+1; if(typeof achSaveSoon==='function') achSaveSoon(); }catch(e){}
  try{ if(typeof IDX!=='undefined'){ if(!Array.isArray(IDX.pr)) IDX.pr=[]; idxSee('pr',pr.id); } }catch(e){}
  RUN.pairings=(RUN.pairings||0)+1;
}
// replace the parents' attacks once the marriage is sealed
{ const _c=fireCards;    fireCards=function(n){ if(evoHas('cards')) return; return _c.apply(this,arguments); }; }
{ const _k=fireKnives;   fireKnives=function(n){ if(evoHas('knives')) return; return _k.apply(this,arguments); }; }
{ const _l=fireLantern;  fireLantern=function(l){ if(evoHas('lantern')) return; return _l.apply(this,arguments); }; }
{ const _f=fireFangs;    fireFangs=function(n){ if(evoHas('fangs')) return; return _f.apply(this,arguments); }; }
{ const _o=fireCoffin;   fireCoffin=function(n){ if(evoHas('coffin')) return; return _o.apply(this,arguments); }; }
{ const _r=fireRazor;    fireRazor=function(l){ if(evoHas('razor')) return; return _r.apply(this,arguments); }; }
{ const _i=fireCinders;  fireCinders=function(l){ if(evoHas('cinders')) return; return _i.apply(this,arguments); }; }
{ const _s=fireStakes;   fireStakes=function(l){ if(evoHas('stakes')) return; return _s.apply(this,arguments); }; }
{ const _y=fireCylinder; fireCylinder=function(l){ if(evoHas('cylinder')) return; return _y.apply(this,arguments); }; }
// a maxed weapon with a pairing whispers about it (once per run per weapon)
{ const _g=grantWeaponLevels;
  grantWeaponLevels=function(def, levels){ const nl=_g.apply(this,arguments); try{ evoMaxNote(def); }catch(e){} return nl; }; }
function evoMaxNote(def){
  const pr=def&&pairingFor(def.id); if(!pr||!P||(P.wlv[def.id]||0)<def.max) return;
  P._evNote=P._evNote||{}; if(P._evNote[def.id]) return; P._evNote[def.id]=1;
  try{ if(typeof IDX!=='undefined'){ if(!Array.isArray(IDX.pm)) IDX.pm=[]; idxSee('pm',def.id); } }catch(e){}
  const known=(typeof IDX!=='undefined'&&Array.isArray(IDX.pr)&&IDX.pr.indexOf(pr.id)>=0);
  const pd=PASSIVES.find(x=>x.id===pr.p);
  const ready=skillLevel(pr.p)>0;
  setTimeout(()=>announce(ready?'♛ '+def.n.toUpperCase()+' — A PAIRING IS READY · NEXT PULL ♛'
    : (known?'♛ '+def.n.toUpperCase()+' AWAITS '+pd.n.toUpperCase()+' ♛':'♛ '+def.n.toUpperCase()+' IS MAXED — IT PAIRS WITH SOMETHING… ♛'), true), 900);
  try{ tone(392,0.5,'sine',0.12); setTimeout(()=>tone(587,0.6,'sine',0.1),160); }catch(e){}
}

// ---- the evolved engine ----
function evoHurt(e, dmg, col, crit){
  if(!e || e.hp<=0) return false;
  e.hp-=dmg; trackDmg(dmg); e.flash=Math.max(e.flash||0,0.1);
  if(P.lifesteal>0) P.hp=Math.min(P.maxHp,P.hp+dmg*P.lifesteal*0.5);
  if(crit || Math.random()<0.3) ftext(e.x,e.y-e.r,Math.round(dmg),crit?'#ffd36b':(col||'#f0e6d6'),crit);
  if(e.unkillable){ e.hp=e.maxhp; return false; }
  if(e.hp<=0){ const ix=enemies.indexOf(e); if(ix>=0){ killEnemy(e,ix); return true; } }
  return false;
}
function evoShot(o){ const s=Object.assign({x:P.x,y:P.y,vx:0,vy:0,r:5,dmg:P.damage,life:1,pierce:0,col:'#fff',shape:'dot',t:0},o); s.max=s.life; s.hit=new Set(); evoShots.push(s); return s; }
function evoNear(x,y,rg,skip){ let t=null,td=rg*rg; for(const e of enemies){ if(skip&&skip.has(e)) continue; const d2=(e.x-x)**2+(e.y-y)**2; if(d2<td){td=d2;t=e;} } return t; }
function evoCd(e,key,t){ const k='_c1'+key; if((e[k]||0)>gt) return false; e[k]=gt+t; return true; }
// point-to-segment distance² (wires, beams)
function _segD2(px,py,ax,ay,bx,by){ const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy||1; let u=((px-ax)*dx+(py-ay)*dy)/L; u=u<0?0:(u>1?1:u); const qx=ax+dx*u-px, qy=ay+dy*u-py; return qx*qx+qy*qy; }
const EVO_FIRE={
  ossuary(){ const t=nearestFoe(520); const a=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
    evoShot({vx:Math.cos(a)*P.projSpeed*0.75,vy:Math.sin(a)*P.projSpeed*0.75,r:9,dmg:P.damage*4,life:0.95,col:'#e9ff70',shape:'skull',gen:0});
    tone(620,0.06,'triangle',0.09); setTimeout(()=>tone(930,0.05,'triangle',0.06),40); },
  stacked(){ const a0=rng('evo')*6.283, ace=(rng('evo')*13)|0;
    for(let i=0;i<13;i++){ const a=a0+i*(6.283/13), big=i===ace, sp=P.projSpeed*0.72;
      evoShot({vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?11:7,dmg:P.damage*(big?3.3:1.1)*P.critMult,crit:true,life:big?1.25:1.0,pierce:big?999:3,col:big?'#fff2c0':(i%2?'#ff3d6e':'#2a2030'),shape:'card',curl:2.2,spin:a,ace:big,suit:'♠♥♦♣'[i%4]}); }
    SFX.card(); setTimeout(()=>SFX.card(),60); noise(0.18,0.08,3800); tone(1760,0.08,'triangle',0.08,2600); },
  hand(){ const a0=rng('evo')*6.283;
    for(let k=0;k<5;k++) evoShot({a0:a0+k*1.2566,r:8,dmg:P.damage*3,life:1.1,pierce:999,col:'#ff1f3d',shape:'petal',petal:true});
    tone(330,0.18,'sawtooth',0.07,660); noise(0.12,0.06,2400); },
  garden(){ const t=nearestFoe(480); const a0=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
    for(let k=-1;k<=1;k++){ const a=a0+k*0.35; evoShot({vx:Math.cos(a)*P.projSpeed*1.25,vy:Math.sin(a)*P.projSpeed*1.25,r:5,dmg:P.damage*1.6,life:0.5,pierce:999,col:'#ff4fd8',shape:'stake',plant:true}); }
    tone(150,0.09,'square',0.1,70); },
  russian(){ P._evCh=((P._evCh||0)%6)+1;
    if(P._evCh<6){ const t=nearestFoe(520); const a=t?Math.atan2(t.y-P.y,t.x-P.x):P.aim;
      evoShot({vx:Math.cos(a)*P.projSpeed*1.5,vy:Math.sin(a)*P.projSpeed*1.5,r:5,dmg:P.damage*2.5*P.critMult,crit:true,life:0.8,pierce:4,col:'#ffb020',shape:'round'});
      tone(260,0.07,'square',0.12,110); noise(0.06,0.12,1800); tone(1200+P._evCh*120,0.03,'sine',0.05); }
    else evoExecute(); }
};
const EVO_CD={ossuary:0.75, stacked:1.3, hand:1.1, garden:1.0, russian:0.7};
function evoExecute(){ // the sixth chamber
  let n=0, ex=0;
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(!inView(e.x,e.y,20)) continue;
    n++; const dmg=P.damage*3.5*P.critMult; const died=evoHurt(e,dmg,'#ffb020',true);
    if(!died && !e.boss && !e.elite && !e.unkillable && e.hp>0 && e.hp<e.maxhp*0.30){ ftext(e.x,e.y-e.r-10,'EXECUTED','#ff3344',true); const ix=enemies.indexOf(e); if(ix>=0){ killEnemy(e,ix); ex++; } }
    else if(died) ex++; }
  flash(0.55,'#fff2c0'); shake=Math.min(26,shake+14); hitstop=Math.max(hitstop,0.06);
  ring(P.x,P.y,Math.max(VW,VH)*0.6,'#ffb020'); ring(P.x,P.y,120,'#fff');
  P._evBang=0.45;
  tone(55,0.5,'sine',0.32,30); noise(0.35,0.32,900); setTimeout(()=>{ tone(1568,0.5,'sine',0.12); tone(2093,0.4,'sine',0.08); },60);
  if(ex>=12) showStreak('⚅ THE SIXTH CHAMBER — '+ex+' EXECUTED ⚅');
  RUN.evoExec=(RUN.evoExec||0)+ex;
}
function tickPairings(dt){
  if(_evoSeq!==window._runSeq){ _evoSeq=window._runSeq; evoShots=[]; evoPlants=[]; }
  if(!P||!P.evo) return;
  P._evT=P._evT||{};
  for(const w in P.evo){ const id=P.evo[w];
    if(EVO_FIRE[id]){ P._evT[id]=(P._evT[id]||0)-dt; if(P._evT[id]<=0){ P._evT[id]=EVO_CD[id]; EVO_FIRE[id](); } } }
  if(P._evBang>0) P._evBang-=dt;
  // ✶ THE THOUSAND CUTS — a double helix, one knife every ~55ms
  if(evoOn('cuts')){ P._evCut=(P._evCut||0)-dt; let g=0;
    while(P._evCut<=0 && g++<4){ P._evCut+=0.045; P._evSide=!P._evSide; const a=P._evSide? gt*5 : -gt*5+Math.PI;
      evoShot({vx:Math.cos(a)*P.projSpeed*1.05,vy:Math.sin(a)*P.projSpeed*1.05,r:4,dmg:P.damage*1.4,life:0.6,pierce:2,col:'#7ff6ff',shape:'knife',spin:a}); }
    P._evSw=(P._evSw||0)-dt; if(P._evSw<=0){ P._evSw=0.33; tone(2200+Math.random()*400,0.03,'square',0.035,1400); noise(0.03,0.04,6000); } }
  // 👁 THE EYE IN THE SKY — the searchlight
  if(evoOn('eye')){ P._evEye=(P._evEye||0)+dt*1.5; const ba=P._evEye, L=380, hw=0.16, ca=Math.cos(ba), sa=Math.sin(ba);
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], dx=e.x-P.x, dy=e.y-P.y, d=Math.hypot(dx,dy); if(d>L+e.r) continue;
      let da=Math.atan2(dy,dx)-ba; da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)<hw+e.r/Math.max(30,d)){ evoHurt(e,P.damage*7*dt,'#ffe14d',false); if(Math.random()<0.08) burst(e.x,e.y,1,'#ffe14d'); } }
    for(const arr of [coins,orbs]) for(const o of arr){ const dx=o.x-P.x, dy=o.y-P.y, d=Math.hypot(dx,dy)||1; if(d>L) continue; let da=Math.atan2(dy,dx)-ba; da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)<hw*1.6){ o.x-=dx/d*620*dt; o.y-=dy/d*620*dt; } }
    P._evPh=(P._evPh||0)-dt; if(P._evPh<=0){ P._evPh=3; const fx=P.x+ca*L*0.8, fy=P.y+sa*L*0.8;
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(Math.hypot(e.x-fx,e.y-fy)<110) evoHurt(e,P.damage*8,'#fff2c0',true); }
      ring(fx,fy,110,'#ffe14d'); ring(fx,fy,60,'#fff'); burst(fx,fy,14,'#fff2c0'); flash(0.22,'#fff6c8'); tone(3100,0.05,'square',0.06); noise(0.12,0.18,5200); } }
  // 🐀 THE RAT KING'S FEAST — the horde keeps itself
  if(evoOn('ratking')){ P._evRat=(P._evRat||0)-dt; let rats=0; for(const s of evoShots) if(s.shape==='rat') rats++;
    if(P._evRat<=0 && rats<14){ P._evRat=0.5; const a=rng('evo')*6.283; evoShot({x:P.x+Math.cos(a)*20,y:P.y+Math.sin(a)*20,vx:Math.cos(a)*90,vy:Math.sin(a)*90,r:5,dmg:P.damage*0.9,life:6,pierce:9999,col:'#b4ff3a',shape:'rat',rat:true,spin:a}); if(Math.random()<0.4) tone(1900+Math.random()*700,0.04,'square',0.03); } }
  // ♖ THE IRON MAIDEN — four caskets, out and back
  if(evoOn('maiden')){ P._evMa=(P._evMa||0)+dt*2.4; P._evMt=(P._evMt||0)+dt; if(P._evMt>=2.6){ P._evMt=0; P._evMs=0; tone(80,0.3,'sawtooth',0.1,160); }
    const ph=Math.min(1,(P._evMt)/0.9), ext=P._evMt<0.9? Math.sin(ph*Math.PI) : 0, R=80+180*ext;
    if(P._evMt>=0.45 && !P._evMs){ P._evMs=1; for(let k=0;k<4;k++){ const a=P._evMa+k*1.5708, x=P.x+Math.cos(a)*R, y=P.y+Math.sin(a)*R;
        for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(Math.hypot(e.x-x,e.y-y)<60+e.r) evoHurt(e,P.damage*6,'#6f8cff',false); } ring(x,y,60,'#6f8cff'); burst(x,y,8,'#c9d6ff'); }
      shake=Math.min(16,shake+6); noise(0.18,0.2,600); tone(60,0.3,'sine',0.2,40); }
    P._evMR=R;
    for(let k=0;k<4;k++){ const a=P._evMa+k*1.5708, x=P.x+Math.cos(a)*R, y=P.y+Math.sin(a)*R;
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], dx=e.x-x, dy=e.y-y; if(dx*dx+dy*dy<(e.r+18)*(e.r+18)){ evoHurt(e,P.damage*7*dt,'#6f8cff',false); const d=Math.hypot(dx,dy)||1; e.kx+=dx/d*300*dt*8; e.ky+=dy/d*300*dt*8; } } } }
  // ⚱ THE CREMATORIUM — three turning jets, and the burning dead spread it
  if(evoOn('cremat')){ P._evCr=(P._evCr||0)+dt*2.2; const L=150, hw=0.28;
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], dx=e.x-P.x, dy=e.y-P.y, d=Math.hypot(dx,dy); if(d>L+e.r) continue;
      const ea=Math.atan2(dy,dx); for(let k=0;k<3;k++){ let da=ea-(P._evCr+k*2.094); da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)<hw){ e._c1burn=2.5; evoHurt(e,P.damage*4*dt,'#ff7a1a',false); break; } } }
    if(Math.random()<(GFX.lite?0.3:0.7)){ const k=(Math.random()*3)|0, a=P._evCr+k*2.094+rnd(-0.2,0.2), s=rnd(160,300); parts.push({x:P.x+Math.cos(a)*14,y:P.y+Math.sin(a)*14,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.25,.5),col:Math.random()<0.5?'#ff7a1a':'#ffd36b',r:rnd(1.6,3.2)}); }
    P._evCs=(P._evCs||0)-dt; if(P._evCs<=0){ P._evCs=0.4; noise(0.4,0.035,900); } }
  // burning foes (fire outlives the jets that lit it)
  if(evoOn('cremat')){ for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(!(e._c1burn>0)) continue; e._c1burn-=dt;
      const bx=e.x, by=e.y, died=evoHurt(e,P.damage*1.5*dt,'#ff7a1a',false); if(Math.random()<0.06) parts.push({x:bx+rnd(-6,6),y:by,vx:0,vy:-60,life:0.4,col:'#ff9a3c',r:2});
      if(died){ for(const o of enemies){ if(!(o._c1burn>0) && Math.hypot(o.x-bx,o.y-by)<70) o._c1burn=2.5; } burst(bx,by,6,'#ff7a1a'); } } }
  // 🌹 THE IMPALER'S GARDEN — planted stakes and the wire between them
  for(let i=evoPlants.length-1;i>=0;i--){ const s=evoPlants[i]; s.t-=dt; if(s.t<=0){ evoPlants.splice(i,1); } }
  if(evoPlants.length){ P._evWt=(P._evWt||0)-dt;
    if(P._evWt<=0){ P._evWt=0.1; const T=0.1;
      // each stake wires itself to its two nearest neighbours (≤260px)
      const W=[]; for(let i=0;i<evoPlants.length;i++){ const a=evoPlants[i]; const nb=[];
        for(let j=0;j<evoPlants.length;j++){ if(j===i) continue; const b=evoPlants[j], d2=(a.x-b.x)**2+(a.y-b.y)**2; if(d2<260*260) nb.push([d2,j]); }
        nb.sort((p,q)=>p[0]-q[0]); for(let k=0;k<Math.min(2,nb.length);k++){ const j=nb[k][1], key=i<j?i*64+j:j*64+i; if(!W._k) W._k=new Set(); if(!W._k.has(key)){ W._k.add(key); W.push([a,evoPlants[j]]); } } }
      P._evWires=W;
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; let hit=false;
        for(const s of evoPlants){ if((e.x-s.x)**2+(e.y-s.y)**2<(e.r+14)**2){ hit=true; break; } }
        if(!hit) for(const w of W){ if(_segD2(e.x,e.y,w[0].x,w[0].y,w[1].x,w[1].y)<(e.r+5)*(e.r+5)){ hit=true; break; } }
        if(hit){ e._slow=0.5; evoHurt(e,P.damage*6*T,'#ff4fd8',false); if(Math.random()<0.15) burst(e.x,e.y,1,'#ff4fd8'); } } } }
  else P._evWires=null;
  // move + collide every evolved projectile
  const lite=GFX.lite;
  for(let i=evoShots.length-1;i>=0;i--){ const s=evoShots[i]; s.t+=dt; s.life-=dt;
    if(s.petal){ const f=s.t/s.max, R=230*Math.sin(Math.PI*Math.min(1,f)), a=s.a0+f*1.6; s.px=s.x; s.py=s.y; s.x=P.x+Math.cos(a)*R; s.y=P.y+Math.sin(a)*R; s.spin=a+Math.PI/2;
      if(!lite && Math.random()<0.25) parts.push({x:s.x,y:s.y,vx:rnd(-20,20),vy:rnd(10,50),life:0.35,col:'#b0101e',r:rnd(1.4,2.4)}); }
    else if(s.rat){ s._tg=(s._tgT=(s._tgT||0)-dt)<=0 || !s._tg || s._tg.hp<=0 ? (s._tgT=0.25, evoNear(s.x,s.y,520)) : s._tg;
      if(s._tg){ const a=Math.atan2(s._tg.y-s.y,s._tg.x-s.x); s.vx+= (Math.cos(a)*260-s.vx)*Math.min(1,dt*5); s.vy+=(Math.sin(a)*260-s.vy)*Math.min(1,dt*5); }
      else { const a=Math.atan2(P.y-s.y,P.x-s.x); s.vx+=(Math.cos(a)*160-s.vx)*dt*3; s.vy+=(Math.sin(a)*160-s.vy)*dt*3; }
      s.x+=s.vx*dt; s.y+=s.vy*dt; s.spin=Math.atan2(s.vy,s.vx); }
    else { if(s.curl){ const sp=Math.hypot(s.vx,s.vy), a=Math.atan2(s.vy,s.vx)+s.curl*dt; s.vx=Math.cos(a)*sp; s.vy=Math.sin(a)*sp; s.spin+=dt*9; }
      s.x+=s.vx*dt; s.y+=s.vy*dt; }
    if(s.life<=0){ evoEnd(s); evoShots.splice(i,1); continue; }
    let gone=false;
    for(let j=enemies.length-1;j>=0;j--){ const e=enemies[j]; if(!e) continue; const dx=e.x-s.x, dy=e.y-s.y, rr=e.r+s.r; if(dx*dx+dy*dy>=rr*rr) continue;
      if(s.rat){ const cdm=s.cdm||(s.cdm=new Map()); if((cdm.get(e)||0)>gt) continue; cdm.set(e,gt+0.35); if(evoHurt(e,s.dmg,'#b4ff3a',false)){ if(!P.martyr) P.hp=Math.min(P.maxHp,P.hp+1); let n=0; for(const o of evoShots) if(o.rat) n++;
          for(let k=0;k<2&&n+k<30;k++){ const a=rng('evo')*6.283; evoShot({x:s.x,y:s.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:5,dmg:P.damage*0.9,life:4,pierce:9999,col:'#b4ff3a',shape:'rat',rat:true,spin:a}); }
          if(Math.random()<0.3) tone(2600,0.03,'square',0.03); } continue; }
      if(s.hit.has(e)) continue; s.hit.add(e);
      const died=evoHurt(e,s.dmg,s.col,!!s.crit);
      if(s.petal && !P.martyr) P.hp=Math.min(P.maxHp,P.hp+0.4);
      if(!s.petal && !s.rat){ const kd=Math.hypot(s.vx,s.vy)||1; e.kx+=s.vx/kd*90; e.ky+=s.vy/kd*90; }
      if(s.crit && Math.random()<0.25) tone(2350,0.04,'triangle',0.05,1600);
      if(s.shape==='skull' || (s.shape==='bone' && s.gen===1)){ evoEnd(s); gone=true; break; }
      if(s.pierce>0) s.pierce--; else { evoEnd(s); gone=true; break; }
      if(died) {}
    }
    if(gone) evoShots.splice(i,1);
  }
  if(evoShots.length>420) evoShots.splice(0,evoShots.length-420);
}
function evoEnd(s){
  if(s._ended) return; s._ended=true;
  if(s.shape==='skull'){ for(let k=0;k<12;k++){ const a=k*0.5236+rrnd('evo',-0.1,0.1), sp=rrnd('evo',320,420);
      evoShot({x:s.x,y:s.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:3.5,dmg:P.damage*1.3,life:0.45,pierce:0,col:'#f2ead8',shape:'bone',gen:1,spin:a}); }
    ring(s.x,s.y,48,'#e9ff70'); burst(s.x,s.y,8,'#f2ead8'); tone(880,0.05,'triangle',0.08); tone(440,0.08,'triangle',0.06); }
  else if(s.shape==='bone' && s.gen===1){ for(let k=0;k<3;k++){ const a=Math.atan2(s.vy,s.vx)+(k-1)*0.9+rrnd('evo',-0.2,0.2), sp=280;
      evoShot({x:s.x,y:s.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:2.5,dmg:P.damage*0.7,life:0.3,pierce:0,col:'#e9ff70',shape:'bone',gen:2,spin:a}); } }
  else if(s.ace){ const R=90; for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(Math.hypot(e.x-s.x,e.y-s.y)<R) evoHurt(e,s.dmg*0.6,'#fff2c0',true); }
    ring(s.x,s.y,R,'#fff2c0'); ring(s.x,s.y,R*0.5,'#ff3d6e'); burst(s.x,s.y,12,'#fff2c0'); shake=Math.min(12,shake+4); tone(1320,0.12,'sine',0.1); noise(0.1,0.12,2600); }
  else if(s.plant){ evoPlants.push({x:s.x,y:s.y,t:5,a:Math.atan2(s.vy,s.vx)}); if(evoPlants.length>12) evoPlants.shift(); tone(120,0.06,'square',0.08); noise(0.04,0.08,2000); }
}
// ⚱ thorns provoke the furnace
{ const _h=hurtPlayer;
  hurtPlayer=function(dmg){ const inv=P&&P.inv>0; const r=_h.apply(this,arguments);
    try{ if(!inv && P && evoOn('cremat') && state!=='dead' && (P._evFs||0)<=gt){ P._evFs=gt+0.8;
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(Math.hypot(e.x-P.x,e.y-P.y)<140){ e._c1burn=2.5; evoHurt(e,P.damage*2,'#ff7a1a',false); } }
      ring(P.x,P.y,140,'#ff7a1a'); ring(P.x,P.y,90,'#ffd36b'); noise(0.3,0.2,700); tone(110,0.3,'sawtooth',0.12,60); } }catch(e){}
    return r; }; }
// ---- the evolved look (world space; called from render() just before the player) ----
function drawPairings(){
  if(!P||!P.evo) { if(!evoShots.length) return; }
  const lite=GFX.lite;
  ctx.save();
  // 🌹 the garden: wire first, then the stakes, roses at their feet
  if(evoPlants.length){
    if(P._evWires){ ctx.strokeStyle='rgba(255,79,216,0.75)'; ctx.lineWidth=1.6; ctx.setLineDash([5,3]);
      ctx.beginPath(); for(const w of P._evWires){ ctx.moveTo(w[0].x,w[0].y-6); ctx.lineTo(w[1].x,w[1].y-6); } ctx.stroke(); ctx.setLineDash([]);
      if(!lite){ ctx.fillStyle='#ffd0f4'; for(const w of P._evWires){ for(let f=0.2;f<1;f+=0.2){ ctx.fillRect(w[0].x+(w[1].x-w[0].x)*f-1,w[0].y-6+(w[1].y-w[0].y)*f-1,2,2); } } } }
    for(const s of evoPlants){ ctx.globalAlpha=Math.min(1,s.t*2);
      ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(s.x,s.y+3,10,4,0,0,6.28); ctx.fill();
      ctx.fillStyle='#8a939c'; ctx.beginPath(); ctx.moveTo(s.x,s.y-20); ctx.lineTo(s.x+4,s.y+2); ctx.lineTo(s.x-4,s.y+2); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#ff4fd8'; ctx.beginPath(); ctx.arc(s.x+5,s.y,3.4,0,6.28); ctx.arc(s.x-4,s.y+1,2.6,0,6.28); ctx.fill();
      ctx.fillStyle='#2f7a3a'; ctx.fillRect(s.x+1,s.y+1,3,2); }
    ctx.globalAlpha=1; }
  if(P && P.evo){
    // 👁 the searchlight
    if(evoOn('eye')){ const ba=P._evEye||0, L=380, hw=0.16;
      ctx.save(); ctx.globalCompositeOperation='lighter';
      let g=window._c1beam; if(!g){ g=ctx.createRadialGradient(0,0,0,0,0,L); g.addColorStop(0,'rgba(255,240,150,0.42)'); g.addColorStop(0.7,'rgba(255,225,77,0.16)'); g.addColorStop(1,'rgba(255,225,77,0)'); window._c1beam=g; }
      ctx.translate(P.x,P.y); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,L,ba-hw,ba+hw); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(255,246,200,0.45)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ba)*L,Math.sin(ba)*L); ctx.stroke();
      ctx.restore();
      const ex=P.x+Math.cos(ba)*30, ey=P.y+Math.sin(ba)*30-26;
      ctx.drawImage(glowSprite('rgba(255,230,120,0.8)','rgba(255,200,60,0)',16),ex-16,ey-16,32,32);
      ctx.fillStyle='#fff6d0'; ctx.beginPath(); ctx.ellipse(ex,ey,8,4.6,0,0,6.28); ctx.fill();
      ctx.fillStyle='#2a1a08'; ctx.beginPath(); ctx.arc(ex+Math.cos(ba)*2.6,ey+Math.sin(ba)*1.6,2.6,0,6.28); ctx.fill(); }
    // ⚱ the furnace jets
    if(evoOn('cremat')){ const L=150, hw=0.28; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(P.x,P.y);
      let g=window._c1jet; if(!g){ g=ctx.createRadialGradient(0,0,8,0,0,L); g.addColorStop(0,'rgba(255,240,180,0.7)'); g.addColorStop(0.35,'rgba(255,140,30,0.5)'); g.addColorStop(1,'rgba(200,40,10,0)'); window._c1jet=g; }
      ctx.fillStyle=g; for(let k=0;k<3;k++){ const a=(P._evCr||0)+k*2.094, fl=1+Math.sin(gt*23+k)*0.08;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,L*fl,a-hw,a+hw); ctx.closePath(); ctx.fill(); }
      ctx.restore(); }
    // ♖ the caskets
    if(evoOn('maiden')){ const R=P._evMR||80;
      for(let k=0;k<4;k++){ const a=(P._evMa||0)+k*1.5708, x=P.x+Math.cos(a)*R, y=P.y+Math.sin(a)*R;
        ctx.save(); ctx.translate(x,y); ctx.rotate(a+Math.PI/2);
        if(!lite){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5; ctx.drawImage(glowSprite('rgba(111,140,255,0.8)','rgba(111,140,255,0)',22),-22,-22,44,44); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
        ctx.fillStyle='#22283a'; ctx.strokeStyle='#6f8cff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(9,-10); ctx.lineTo(7,16); ctx.lineTo(-7,16); ctx.lineTo(-9,-10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#c9d6ff'; for(let sp=-1;sp<=1;sp+=2){ for(let q=0;q<3;q++){ ctx.beginPath(); ctx.moveTo(sp*8.5,-6+q*8); ctx.lineTo(sp*13,-4+q*8); ctx.lineTo(sp*8,-2+q*8); ctx.closePath(); ctx.fill(); } }
        ctx.strokeStyle='#9fb6ff'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(0,9); ctx.moveTo(-4,-5); ctx.lineTo(4,-5); ctx.stroke();
        ctx.restore(); } }
    // ⚅ the cylinder — six chambers, and the bang
    if(evoOn('russian')){ const ch=P._evCh||0;
      for(let k=0;k<6;k++){ const a=-Math.PI/2+k*1.047, x=P.x+Math.cos(a)*30, y=P.y-34+Math.sin(a)*8;
        ctx.fillStyle=k<ch?'#3a2a10':(k===5?'#ff3344':'#ffb020'); ctx.beginPath(); ctx.arc(x,y,2.6,0,6.28); ctx.fill(); }
      if(P._evBang>0){ const f=P._evBang/0.45; ctx.save(); ctx.globalAlpha=f; ctx.strokeStyle='#ff3344'; ctx.lineWidth=3;
        const R=Math.max(VW,VH)*0.18*(1.6-f*0.6); ctx.beginPath(); ctx.arc(P.x,P.y,R,0,6.28); ctx.moveTo(P.x-R*1.4,P.y); ctx.lineTo(P.x+R*1.4,P.y); ctx.moveTo(P.x,P.y-R*1.4); ctx.lineTo(P.x,P.y+R*1.4); ctx.stroke(); ctx.restore(); } }
  }
  // every evolved projectile
  for(const s of evoShots){ const fade=Math.min(1,s.life*6); ctx.globalAlpha=fade;
    switch(s.shape){
      case 'skull': ctx.drawImage(glowSprite('rgba(233,255,112,0.7)','rgba(233,255,112,0)',16),s.x-16,s.y-16,32,32);
        ctx.fillStyle='#f2ead8'; ctx.beginPath(); ctx.arc(s.x,s.y-1,7,0,6.28); ctx.fill(); ctx.fillRect(s.x-4,s.y+3,8,5);
        ctx.fillStyle='#1a1208'; ctx.beginPath(); ctx.arc(s.x-2.6,s.y-1.5,1.9,0,6.28); ctx.arc(s.x+2.6,s.y-1.5,1.9,0,6.28); ctx.fill(); break;
      case 'bone': ctx.strokeStyle=s.col; ctx.lineWidth=s.gen===2?1.6:2.4; ctx.beginPath(); ctx.moveTo(s.x-Math.cos(s.spin)*5,s.y-Math.sin(s.spin)*5); ctx.lineTo(s.x+Math.cos(s.spin)*5,s.y+Math.sin(s.spin)*5); ctx.stroke(); break;
      case 'card': { ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.spin); const w=s.ace?11:7, h=s.ace?16:10;
        if(s.ace && !lite) ctx.drawImage(glowSprite('rgba(255,242,192,0.8)','rgba(255,242,192,0)',20),-20,-20,40,40);
        ctx.fillStyle='#f6efe0'; ctx.fillRect(-w,-h,w*2,h*2); ctx.strokeStyle=s.ace?'#ffd36b':'#ff3d6e'; ctx.lineWidth=1.4; ctx.strokeRect(-w,-h,w*2,h*2);
        ctx.fillStyle=s.ace?'#1a1208':((s.suit==='♥'||s.suit==='♦')?'#d01438':'#1a1208'); ctx.font='700 '+(s.ace?16:11)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.ace?'♠':s.suit,0,1);
        ctx.restore(); break; }
      case 'knife': { ctx.strokeStyle='#7ff6ff'; ctx.lineWidth=2; const c=Math.cos(s.spin), sn=Math.sin(s.spin);
        ctx.beginPath(); ctx.moveTo(s.x-c*7,s.y-sn*7); ctx.lineTo(s.x+c*6,s.y+sn*6); ctx.stroke();
        ctx.fillStyle='#e8fdff'; ctx.beginPath(); ctx.arc(s.x+c*6,s.y+sn*6,1.4,0,6.28); ctx.fill(); break; }
      case 'petal': { ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.spin);
        if(!lite) ctx.drawImage(glowSprite('rgba(255,31,61,0.7)','rgba(255,31,61,0)',18),-18,-18,36,36);
        ctx.fillStyle='#ff1f3d'; ctx.beginPath(); ctx.moveTo(0,-13); ctx.quadraticCurveTo(8,0,0,13); ctx.quadraticCurveTo(3,0,0,-13); ctx.fill();
        ctx.fillStyle='#ffd0d6'; ctx.fillRect(-1,-9,1.4,16); ctx.restore(); break; }
      case 'stake': { const a=Math.atan2(s.vy,s.vx), c=Math.cos(a), sn=Math.sin(a); ctx.strokeStyle='#aeb8c2'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(s.x-c*12,s.y-sn*12); ctx.lineTo(s.x+c*8,s.y+sn*8); ctx.stroke(); ctx.fillStyle='#ff4fd8'; ctx.beginPath(); ctx.arc(s.x-c*12,s.y-sn*12,2.6,0,6.28); ctx.fill(); break; }
      case 'round': { const a=Math.atan2(s.vy,s.vx), c=Math.cos(a), sn=Math.sin(a);
        ctx.strokeStyle='rgba(255,176,32,0.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.x-c*22,s.y-sn*22); ctx.lineTo(s.x,s.y); ctx.stroke();
        ctx.fillStyle='#ffe08a'; ctx.beginPath(); ctx.arc(s.x,s.y,4,0,6.28); ctx.fill(); break; }
      case 'rat': { ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.spin);
        ctx.strokeStyle='#5a7a2a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-6,0); ctx.quadraticCurveTo(-11,Math.sin(gt*20+s.x)*4,-15,0); ctx.stroke();
        ctx.fillStyle='#3a4a1c'; ctx.beginPath(); ctx.ellipse(0,0,7,4,0,0,6.28); ctx.fill();
        ctx.fillStyle='#b4ff3a'; ctx.beginPath(); ctx.arc(5,-1.6,1.1,0,6.28); ctx.arc(5,1.6,1.1,0,6.28); ctx.fill(); ctx.restore(); break; }
      default: ctx.fillStyle=s.col; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.28); ctx.fill();
    } }
  ctx.globalAlpha=1; ctx.restore();
}

/* ==== H3 — TEN MORE PAIRINGS (the deeper back room) ====
   Same contract as C1: weapon at MAX + its one true skill → THE PAIRING.
   The table above is extended in place, so the ceremony, the Index, the
   codex, the Book, TAB and the slot hints all read the new recipes for free.
   Every run-shaping roll is on rng('evo') (Daily Debt stays deterministic);
   sparkle, pitch and number pops stay on Math.random. No pairing here heals:
   the Martyr has nothing to refuse. State lives on P (_h3*) and in three
   small arrays reset per run (h3S shots, h3Z ground/sky effects, h3D dice). */
PAIRINGS.push(
  {id:'chaingang', w:'coil',    p:'chips',   n:'THE CHAIN GANG',       g:'⛓', hint:'The noose wants company… and heavier hands…',
    d:l=>'Every 1.5s a chain catches up to 8 foes (hopping up to 130px between them), drags the whole gang into one knot before you, and SLAMS them together: each takes 250% + 50% per prisoner (650% for a full gang). Anything near the knot (70px) takes 300%.'},
  {id:'carpet',    w:'mortar',  p:'reach',   n:'THE CARPET BOMB',      g:'💣', hint:'The mortar needs a longer table to walk on…',
    d:l=>'Every 2.4s the House rolls out a carpet: 8 chips fall in a marching line from 80px to 490px toward the thickest crowd, each blast 400% damage in a 75px circle.'},
  {id:'craps',     w:'dice',    p:'luck',    n:'THE CRAPS TABLE',      g:'🎲', hint:'The die is lonely… and a fool would roll it twice…',
    d:l=>'Every 2.2s you throw TWO big dice. Each lands for its face × 110% damage in a (60 + 10 × face)px blast. DOUBLES explode again for double. A NATURAL (7 or 11) sprays 7 golden pips from each die (150%, pierce 3). SNAKE EYES pays 500% × crit to every foe on screen.'},
  {id:'shark',     w:'phantom', p:'tip',     n:'THE LOAN SHARK',       g:'🦈', hint:'The card shark wants to collect… with interest…',
    d:l=>'A spectral shark circles you (150px), biting all it brushes for 300%/s. Every 1.8s it lunges at the healthiest debtor within 420px: 600% to everything in its path, +1200% to the debtor. Every kill it makes pays 2 coins of INTEREST.'},
  {id:'queen',     w:'moths',   p:'fortune', n:'THE MOTH QUEEN',       g:'🦋', hint:'The moths want a queen… dusted in gold…',
    d:l=>'A great moth queen hovers over the thickest crowd (up to 420px away), shedding a 120px cloud of grave-dust: 320%/s and every foe in it is slowed. Every 1.6s she lays a clutch of 5 hunting moths (140% each).'},
  {id:'ouro',      w:'serpent', p:'spd',     n:'THE OUROBOROS',        g:'🐍', hint:'The serpent would follow you anywhere… if you ran…',
    d:l=>'A brass serpent 20 segments long follows the exact path you walk (stand still and it coils around you): every segment bites for 380%/s. Every 3.5s it eats its own tail: a ring at 240px CONSTRICTS to you, hitting everything it crosses for 700%.'},
  {id:'champagne', w:'chalice', p:'vital',   n:'THE CHAMPAGNE TOWER',  g:'🥂', hint:'The chalice wants a sturdier drinker… and more glasses…',
    d:l=>'Every 3s six goblets fly out in a ring (140–200px) and shatter into pools (70px, 4s) that rot foes for 350%/s and slow them. Every third tower is THE TOAST: every pool on the floor erupts for 800%.'},
  {id:'heart',     w:'nova',    p:'shell',   n:'THE TELL-TALE HEART',  g:'❣', hint:'The nova beats like something buried alive…',
    d:l=>'A heart beats in your chest, lub-dub every 0.8s: LUB blasts 200px for 300%, DUB 130px for 180%. Every 6th beat it BURSTS: 360px, 1200%, hurling foes back. Getting hit bursts it at once (every 4s) and keeps you untouchable 1s.'},
  {id:'grand',     w:'chand',   p:'dmg',     n:'THE GRAND CHANDELIER', g:'💎', hint:'The candlelight wants sharper crystal…',
    d:l=>'Every 2.8s the whole ballroom chandelier falls on the thickest crowd: 1100% in 150px, 16 crystal shards fly out (160%, pierce 2), and burning wax pools for 2.5s (90px, 250%/s).'},
  {id:'blackdeath',w:'aura',    p:'regen',   n:'THE BLACK DEATH',      g:'☣', hint:'The miasma is tired of the slow bleed — it wants to wander…',
    d:l=>'The miasma leaves your body: three plague clouds (105px) roam the floor, each hunting a crowd within 380px and rotting it for 380%/s. Foes that die inside a cloud burst into a new small cloud (60px, 3s, 250%/s; up to 10).'}
);
PAIRINGS.forEach(pr=>{ PAIR_BY_W[pr.w]=pr; pr.rar='pairing'; pr.max=1; });
let h3S=[], h3Z=[], h3D=[], _h3Seq=-1;
// the parents step aside once the marriage is sealed (aura is gated in core/passives)
{ const _a=fireCoil;     fireCoil=function(l){ if(evoHas('coil')) return; return _a.apply(this,arguments); }; }
{ const _a=fireMortar;   fireMortar=function(l){ if(evoHas('mortar')) return; return _a.apply(this,arguments); }; }
{ const _a=fireDie;      fireDie=function(l){ if(evoHas('dice')) return; return _a.apply(this,arguments); }; }
{ const _a=firePhantom;  firePhantom=function(l){ if(evoHas('phantom')) return; return _a.apply(this,arguments); }; }
{ const _a=fireMoths;    fireMoths=function(){ if(evoHas('moths')) return; return _a.apply(this,arguments); }; }
{ const _a=fireSerpent;  fireSerpent=function(l){ if(evoHas('serpent')) return; return _a.apply(this,arguments); }; }
{ const _a=fireChalice;  fireChalice=function(l){ if(evoHas('chalice')) return; return _a.apply(this,arguments); }; }
{ const _a=bloodNova;    bloodNova=function(l){ if(evoHas('nova')) return; return _a.apply(this,arguments); }; }
{ const _a=chandelierBurst; chandelierBurst=function(l){ if(evoHas('chand')) return; return _a.apply(this,arguments); }; }
// the densest pack within reach of you (sampled: ≤40×40 checks at 300 foes)
function h3Dense(range){ let bx=null,by=null,bn=0; const st=Math.max(1,(enemies.length/40)|0), R2=range*range;
  for(let i=0;i<enemies.length;i+=st){ const e=enemies[i]; if((e.x-P.x)**2+(e.y-P.y)**2>R2) continue; let n=0;
    for(let j=0;j<enemies.length;j+=st){ const o=enemies[j]; if((o.x-e.x)**2+(o.y-e.y)**2<8100) n++; }
    if(n>bn){ bn=n; bx=e.x; by=e.y; } }
  return bx===null?null:{x:bx,y:by}; }
function h3Area(x,y,R,dmg,col,crit,skip){ let k=0; for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(!e||(skip&&skip.has(e))) continue; const rr=R+e.r; if((e.x-x)**2+(e.y-y)**2<rr*rr){ if(evoHurt(e,dmg,col,crit)) k++; } } return k; }
function h3Shot(o){ const s=Object.assign({x:P.x,y:P.y,vx:0,vy:0,r:4,dmg:P.damage,life:1,pierce:0,col:'#fff',shape:'dot',t:0,spin:0},o); s.max=s.life; s.hit=new Set(); h3S.push(s); return s; }
const H3_FIRE={
  chaingang(){ if(P._h3cg) return 0.2; const t=nearestFoe(320); if(!t) return 0.3;
    const links=[t], seen=new Set([t]); while(links.length<8){ const l=links[links.length-1], nx=evoNear(l.x,l.y,130,seen); if(!nx) break; links.push(nx); seen.add(nx); }
    const a=Math.atan2(t.y-P.y,t.x-P.x); P._h3cg={links,kx:P.x+Math.cos(a)*90,ky:P.y+Math.sin(a)*90,t:0};
    tone(180,0.12,'sawtooth',0.1,90); noise(0.1,0.1,2400); for(let i=0;i<links.length;i++) setTimeout(()=>tone(900+i*90,0.03,'square',0.04),i*25);
    return 1.5; },
  carpet(){ const d=h3Dense(520)||nearestFoe(520); const a=(d?Math.atan2(d.y-P.y,d.x-P.x):P.aim)+rrnd('evo',-0.15,0.15);
    for(let i=0;i<8;i++){ const r=80+i*58; h3Z.push({k:'bomb',x:P.x+Math.cos(a)*r,y:P.y+Math.sin(a)*r,t:0.3+i*0.08,m:0.3+i*0.08,r:75}); }
    tone(1400,0.5,'sine',0.05,500); return 2.4; },
  craps(){ const d=h3Dense(460)||nearestFoe(460); const tx=d?d.x:P.x+Math.cos(P.aim)*200, ty=d?d.y:P.y+Math.sin(P.aim)*200;
    const f=[1+((rng('evo')*6)|0), 1+((rng('evo')*6)|0)], pid=gt;
    for(let k=0;k<2;k++) h3D.push({sx:P.x,sy:P.y,x:P.x,y:P.y,tx:tx+rrnd('evo',-45,45),ty:ty+rrnd('evo',-45,45),t:0,T:0.55,face:f[k],pair:f,last:k===1,spin:0});
    SFX.diceRattle(); setTimeout(()=>SFX.diceRattle(),90); return 2.2; },
  champagne(){ P._h3cn=(P._h3cn||0)+1;
    if(P._h3cn%3===0){ let n=0; for(const z of h3Z){ if(z.k!=='pool') continue; n++; h3Area(z.x,z.y,z.r,P.damage*8,'#ffb3d1',false); ring(z.x,z.y,z.r*1.2,'#fff2c0'); burst(z.x,z.y,GFX.lite?4:10,'#ffb3d1'); z.t=Math.min(z.t,0.25); z.pop=0.25; }
      if(n){ shake=Math.min(14,shake+5); showStreak('🥂 THE TOAST — '+n+' POOLS ERUPT 🥂'); for(let i=0;i<5;i++) setTimeout(()=>tone(1760*Math.pow(1.12,i),0.12,'sine',0.07),i*45); noise(0.25,0.12,4200); } }
    const R=rrnd('evo',140,200), off=rng('evo')*6.283;
    for(let k=0;k<6;k++){ const a=off+k*1.0472; h3Z.push({k:'goblet',sx:P.x,sy:P.y,x:P.x+Math.cos(a)*R,y:P.y+Math.sin(a)*R,t:0.45,m:0.45}); }
    tone(1320,0.08,'sine',0.06); tone(1760,0.08,'sine',0.05); return 3; },
  grand(){ const d=h3Dense(480)||nearestFoe(480); if(!d) return 0.5;
    h3Z.push({k:'chand',x:d.x,y:d.y,t:0.9,m:0.9}); tone(70,0.9,'sine',0.12,45); noise(0.6,0.03,5200); return 2.8; }
};
function h3Shark(dt){ let s=P._h3sk; if(!s) s=P._h3sk={x:P.x,y:P.y,a:0,mode:'c',cd:1.2,hx:1,hy:0};
  const ox=s.x, oy=s.y;
  if(s.mode==='c'){ s.a+=dt*2.2; const tx=P.x+Math.cos(s.a)*150, ty=P.y+Math.sin(s.a)*150; s.x+=(tx-s.x)*Math.min(1,dt*8); s.y+=(ty-s.y)*Math.min(1,dt*8);
    s.cd-=dt; if(s.cd<=0){ let db=null, bh=0; for(const e of enemies){ if((e.x-P.x)**2+(e.y-P.y)**2>420*420) continue; if(e.hp>bh){ bh=e.hp; db=e; } }
      if(db){ const a=Math.atan2(db.y-s.y,db.x-s.x), L=Math.hypot(db.x-s.x,db.y-s.y)*1.3+60; s.mode='l'; s.vx=Math.cos(a)*1100; s.vy=Math.sin(a)*1100; s.left=L; s.db=db; s.hit=new Set();
        tone(90,0.25,'sawtooth',0.12,220); noise(0.2,0.1,1400); } else s.cd=0.3; }
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], rr=e.r+24; if((e.x-s.x)**2+(e.y-s.y)**2<rr*rr && evoCd(e,'sk',0.25)) evoHurt(e,P.damage*0.75,'#0099ff',false); } }
  else if(s.mode==='l'){ const st=Math.min(s.left,1100*dt); s.x+=s.vx/1100*st; s.y+=s.vy/1100*st; s.left-=st;
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(s.hit.has(e)) continue; const rr=e.r+30; if((e.x-s.x)**2+(e.y-s.y)**2>=rr*rr) continue; s.hit.add(e);
      const ex=e.x, ey=e.y, deb=e===s.db; if(deb){ ftext(ex,ey-e.r-12,'DEBTOR','#0099ff',true); shake=Math.min(12,shake+4); }
      if(evoHurt(e,P.damage*(deb?18:6),'#0099ff',deb)){ for(let c=0;c<2;c++) coins.push({x:ex+rrnd('evo',-10,10),y:ey+rrnd('evo',-10,10),r:6,vx:rrnd('evo',-120,120),vy:rrnd('evo',-120,120)});
        P._h3int=(P._h3int||0)+2; if(Math.random()<0.5) ftext(ex,ey-20,'+2 INTEREST','#ffd36b'); tone(2200,0.04,'triangle',0.05); } }
    if(!GFX.lite && Math.random()<0.6) parts.push({x:s.x,y:s.y,vx:rnd(-30,30),vy:rnd(-30,30),life:0.4,col:'#7fd0ff',r:rnd(1.5,3)});
    if(s.left<=0){ s.mode='r'; } }
  else { const tx=P.x+Math.cos(s.a)*150, ty=P.y+Math.sin(s.a)*150, dx=tx-s.x, dy=ty-s.y, d=Math.hypot(dx,dy)||1, st=Math.min(d,700*dt);
    s.x+=dx/d*st; s.y+=dy/d*st; if(d<12){ s.mode='c'; s.cd=1.8; } }
  const mx=s.x-ox, my=s.y-oy, ml=Math.hypot(mx,my); if(ml>0.5){ s.hx=mx/ml; s.hy=my/ml; } }
function h3Queen(dt){ let q=P._h3q; if(!q) q=P._h3q={x:P.x,y:P.y-40,tx:P.x,ty:P.y,rt:0,lay:0.8};
  q.rt-=dt; if(q.rt<=0){ q.rt=1; const d=h3Dense(420); if(d){ q.tx=d.x; q.ty=d.y; } else { q.tx=P.x+60; q.ty=P.y-60; } }
  const dx=q.tx-q.x, dy=q.ty-q.y, d=Math.hypot(dx,dy)||1, st=Math.min(d,240*dt); q.x+=dx/d*st; q.y+=dy/d*st;
  if(Math.hypot(q.x-P.x,q.y-P.y)>460){ const a=Math.atan2(q.y-P.y,q.x-P.x); q.x=P.x+Math.cos(a)*460; q.y=P.y+Math.sin(a)*460; }
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], rr=120+e.r; if((e.x-q.x)**2+(e.y-q.y)**2<rr*rr){ e._slow=0.5; evoHurt(e,P.damage*3.2*dt,'#c050ff',false); } }
  if(!GFX.lite && Math.random()<0.5){ const a=Math.random()*6.283, r=Math.random()*120; parts.push({x:q.x+Math.cos(a)*r,y:q.y+Math.sin(a)*r,vx:rnd(-12,12),vy:rnd(10,40),life:0.6,col:Math.random()<0.5?'#e9b8ff':'#ffd36b',r:rnd(1,2)}); }
  q.lay-=dt; if(q.lay<=0){ q.lay=1.6; let n=0; for(const s of h3S) if(s.shape==='moth') n++;
    for(let k=0;k<5&&n+k<40;k++){ const a=rng('evo')*6.283; h3Shot({x:q.x,y:q.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,r:4,dmg:P.damage*1.4,life:3,col:'#c050ff',shape:'moth',seek:true}); }
    tone(1900,0.05,'sine',0.04); tone(2400,0.05,'sine',0.03); } }
function h3Ouro(dt){ const tr=P._h3tr||(P._h3tr=[{x:P.x,y:P.y}]); const h=tr[0];
  let nx=P.x, ny=P.y;
  if(Math.hypot(P.x-(P._h3lx||P.x),P.y-(P._h3ly||P.y))<1){ P._h3idle=(P._h3idle||0)+dt; } else P._h3idle=0;
  P._h3lx=P.x; P._h3ly=P.y;
  if(P._h3idle>0.25){ P._h3ph=(P._h3ph||0)+dt*4; nx=P.x+Math.cos(P._h3ph)*64; ny=P.y+Math.sin(P._h3ph)*64; }
  if(Math.hypot(nx-h.x,ny-h.y)>=7){ tr.unshift({x:nx,y:ny}); if(tr.length>60) tr.length=60; }
  // every 3rd trail point is a segment
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if((e.x-P.x)**2+(e.y-P.y)**2>520*520) continue;
    for(let k=0;k<tr.length;k+=3){ const p=tr[k], rr=e.r+9; if((e.x-p.x)**2+(e.y-p.y)**2<rr*rr){ evoHurt(e,P.damage*3.8*dt,'#00e0b0',false); break; } } }
  P._h3oT=(P._h3oT||0)+dt;
  if(P._h3oT>=3.5){ P._h3oT=0; P._h3oc={t:0,hit:new Set()}; tone(330,0.7,'triangle',0.08,110); noise(0.5,0.05,3000); }
  const c=P._h3oc; if(c){ c.t+=dt; const R=240-210*Math.min(1,c.t/0.7); c.R=R;
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(c.hit.has(e)) continue; const d=Math.hypot(e.x-P.x,e.y-P.y); if(d>R-12 && d<R+12+e.r){ c.hit.add(e); evoHurt(e,P.damage*7,'#00e0b0',false); } }
    if(c.t>=0.7){ ring(P.x,P.y,60,'#00e0b0'); burst(P.x,P.y,GFX.lite?4:12,'#7fffe0'); tone(110,0.3,'sine',0.14,55); shake=Math.min(10,shake+3);
      if(c.hit.size>=10) showStreak('🐍 THE OUROBOROS SWALLOWS '+c.hit.size+' 🐍'); P._h3oc=null; } } }
function h3Heart(dt,forced){ if(forced){ h3HeartBurst(); return; }
  P._h3hb=(P._h3hb||0.8)-dt;
  if(P._h3hb<=0){ P._h3hb=0.8; P._h3n=(P._h3n||0)+1; P._h3beat=1;
    if(P._h3n%6===0){ h3HeartBurst(); }
    else { h3Area(P.x,P.y,200,P.damage*3,'#ff0060',false); ring(P.x,P.y,200,'#ff0060'); tone(70,0.18,'sine',0.2,45); P._h3dub=0.18; } }
  if(P._h3dub>0){ P._h3dub-=dt; if(P._h3dub<=0){ h3Area(P.x,P.y,130,P.damage*1.8,'#ff6a9a',false); ring(P.x,P.y,130,'#ff6a9a'); tone(90,0.12,'sine',0.14,60); P._h3beat=0.7; } }
  if(P._h3beat>0) P._h3beat=Math.max(0,P._h3beat-dt*3); }
function h3HeartBurst(){ for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], d=Math.hypot(e.x-P.x,e.y-P.y); if(d>=360+e.r) continue; const kd=Math.max(1,d); e.kx+=(e.x-P.x)/kd*380; e.ky+=(e.y-P.y)/kd*380; evoHurt(e,P.damage*12,'#ff0060',false); }
  ring(P.x,P.y,360,'#ff0060'); ring(P.x,P.y,240,'#ffd36b'); ring(P.x,P.y,120,'#fff'); flash(0.3,'#ff0060'); shake=Math.min(18,shake+8); P._h3beat=1.6;
  tone(48,0.6,'sine',0.3,30); noise(0.3,0.2,800); setTimeout(()=>tone(52,0.4,'sine',0.2,30),140);
  if(!GFX.lite) for(let i=0;i<24;i++){ const a=i/24*6.283, s=rnd(220,380); parts.push({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.5),col:i%2?'#ff0060':'#ffd36b',r:rnd(2,3.5)}); } }
function h3Plague(dt){ let C=P._h3bd; if(!C){ C=P._h3bd=[0,1,2].map(k=>({x:P.x+Math.cos(k*2.094)*120,y:P.y+Math.sin(k*2.094)*120,tx:P.x,ty:P.y,rt:k*0.4})); }
  const near=[]; for(const e of enemies) if((e.x-P.x)**2+(e.y-P.y)**2<380*380) near.push(e);
  C.forEach((c,k)=>{ c.rt-=dt; if(c.rt<=0){ c.rt=1.2; if(near.length){ const e=near[(rng('evo')*near.length)|0]; c.tx=e.x; c.ty=e.y; } else { const a=k*2.094+gt*0.5; c.tx=P.x+Math.cos(a)*140; c.ty=P.y+Math.sin(a)*140; } }
    const dx=c.tx-c.x, dy=c.ty-c.y, d=Math.hypot(dx,dy)||1, st=Math.min(d,120*dt); c.x+=dx/d*st; c.y+=dy/d*st;
    if(Math.hypot(c.x-P.x,c.y-P.y)>400){ const a=Math.atan2(c.y-P.y,c.x-P.x); c.x=P.x+Math.cos(a)*400; c.y=P.y+Math.sin(a)*400; }
    h3Rot(c.x,c.y,105,P.damage*3.8*dt);
    if(!GFX.lite && Math.random()<0.35){ const a=Math.random()*6.283, r=Math.random()*100; parts.push({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,vx:0,vy:-25,life:0.7,col:Math.random()<0.6?'#8fbf00':'#2a3a08',r:rnd(2,4)}); } }); }
// plague damage: a death inside a cloud blooms a small cloud where it fell
function h3Rot(x,y,R,dmg){ for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], rr=R+e.r; if((e.x-x)**2+(e.y-y)**2>=rr*rr) continue; const ex=e.x, ey=e.y;
    if(evoHurt(e,dmg,'#8fbf00',false)){ let n=0; for(const z of h3Z) if(z.k==='cloud') n++; if(n<10){ h3Z.push({k:'cloud',x:ex,y:ey,r:60,t:3,m:3}); if(Math.random()<0.4) tone(160,0.12,'sawtooth',0.04,80); } } } }
function h3Chain(dt){ const c=P._h3cg; if(!c) return; c.t+=dt;
  for(const e of c.links){ if(e.hp<=0||e.boss) continue; e.x+=(c.kx-e.x)*Math.min(1,dt*10); e.y+=(c.ky-e.y)*Math.min(1,dt*10); }
  if(c.t>=0.35){ const live=c.links.filter(e=>e.hp>0), n=c.links.length, set=new Set(c.links);
    for(const e of live) evoHurt(e,P.damage*(2.5+0.5*n),'#9b8cff',n>=6);
    h3Area(c.kx,c.ky,70,P.damage*3,'#9b8cff',false,set);
    ring(c.kx,c.ky,70,'#9b8cff'); ring(c.kx,c.ky,36,'#fff2c0'); burst(c.kx,c.ky,GFX.lite?5:14,'#c9c0ff'); shake=Math.min(14,shake+3+n*0.6);
    tone(70,0.3,'sine',0.2,40); noise(0.2,0.2,700); setTimeout(()=>tone(1200,0.06,'square',0.05,600),30);
    if(n>=6) ftext(c.kx,c.ky-30,'GANG OF '+n,'#9b8cff',true);
    P._h3cg=null; } }
function h3Ground(dt){ const lite=GFX.lite;
  for(let i=h3Z.length-1;i>=0;i--){ const z=h3Z[i]; z.t-=dt;
    switch(z.k){
      case 'bomb': if(z.t<=0){ h3Area(z.x,z.y,z.r,P.damage*4,'#ff4a00',false); ring(z.x,z.y,z.r,'#ff4a00'); ring(z.x,z.y,z.r*0.5,'#ffd36b'); burst(z.x,z.y,lite?4:10,'#ff8a3c');
          shake=Math.min(12,shake+1.5); noise(0.16,0.14,700); tone(80,0.18,'sine',0.12,40); h3Z.splice(i,1); } break;
      case 'goblet': if(z.t<=0){ z.k='pool'; z.r=70; z.t=z.m=4; z.tk=0; burst(z.x,z.y,lite?3:8,'#ffe9f2'); if(Math.random()<0.5) tone(2600+Math.random()*600,0.05,'triangle',0.05); noise(0.05,0.05,6000); } break;
      case 'pool': if(z.pop>0) z.pop-=dt; z.tk=(z.tk||0)-dt; if(z.tk<=0){ z.tk=0.1; for(let j=enemies.length-1;j>=0;j--){ const e=enemies[j], rr=z.r+e.r; if((e.x-z.x)**2+(e.y-z.y)**2<rr*rr){ e._slow=0.5; evoHurt(e,P.damage*0.35,'#ffb3d1',false); } } }
        if(z.t<=0) h3Z.splice(i,1); break;
      case 'chand': if(z.t<=0){ const k=h3Area(z.x,z.y,150,P.damage*11,'#7fd4ff',true);
          for(let s=0;s<16;s++){ const a=s*0.3927; h3Shot({x:z.x,y:z.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:4,dmg:P.damage*1.6,life:0.5,pierce:2,col:'#7fd4ff',shape:'crystal',spin:a}); }
          h3Z.splice(i,1); h3Z.push({k:'wax',x:z.x,y:z.y,r:90,t:2.5,m:2.5,tk:0});
          ring(z.x,z.y,150,'#7fd4ff'); ring(z.x,z.y,90,'#fff2c0'); burst(z.x,z.y,lite?8:24,'#dff6ff'); flash(0.18,'#dff6ff'); shake=Math.min(20,shake+9); hitstop=Math.max(hitstop||0,0.03);
          noise(0.5,0.25,5200); tone(60,0.5,'sine',0.25,35); for(let q=0;q<6;q++) setTimeout(()=>tone(2600+q*330+Math.random()*200,0.12,'triangle',0.05),40+q*35);
          if(k>=8) showStreak('💎 THE CHANDELIER CRUSHES '+k+' 💎'); } break;
      case 'wax': z.tk-=dt; if(z.tk<=0){ z.tk=0.1; h3Area(z.x,z.y,z.r,P.damage*0.25,'#ffb74d',false); } if(z.t<=0) h3Z.splice(i,1); break;
      case 'cloud': h3Rot(z.x,z.y,z.r,P.damage*2.5*dt); if(z.t<=0) h3Z.splice(i,1); break;
      case 'boom': if(z.t<=0){ h3Area(z.x,z.y,z.r,z.dmg,'#00ff6a',true); ring(z.x,z.y,z.r,'#00ff6a'); ring(z.x,z.y,z.r*0.5,'#fff2c0'); burst(z.x,z.y,lite?4:12,'#00ff6a'); shake=Math.min(12,shake+3); noise(0.15,0.15,1200); h3Z.splice(i,1); } break;
      default: if(z.t<=0) h3Z.splice(i,1);
    } }
  if(h3Z.length>140) h3Z.splice(0,h3Z.length-140); }
function h3Dice(dt){ for(let i=h3D.length-1;i>=0;i--){ const d=h3D[i]; d.t+=dt; const f=Math.min(1,d.t/d.T);
    d.x=d.sx+(d.tx-d.sx)*(1-(1-f)*(1-f)); d.y=d.sy+(d.ty-d.sy)*(1-(1-f)*(1-f)); d.spin+=dt*(1-f)*22;
    if(f<1) continue; h3D.splice(i,1);
    const R=60+d.face*10; h3Area(d.x,d.y,R,P.damage*1.1*d.face,'#00ff6a',false);
    ring(d.x,d.y,R,'#00ff6a'); burst(d.x,d.y,GFX.lite?4:10,'#eaffef'); ftext(d.x,d.y-24,String(d.face),'#00ff6a',true); tone(300+d.face*90,0.1,'square',0.08,150); noise(0.08,0.1,2000);
    (d.pair._at=d.pair._at||[]).push([d.x,d.y]);
    if(!d.last) continue;
    const a=d.pair[0], b=d.pair[1], sum=a+b, at=d.pair._at;
    if(a===b){ for(const p of at) h3Z.push({k:'boom',x:p[0],y:p[1],r:R,t:0.3,m:0.3,dmg:P.damage*2.2*a});
      showStreak(a===1?'🎲 SNAKE EYES — THE HOUSE PAYS 🎲':'🎲 DOUBLES — '+a+' & '+b+' 🎲'); setTimeout(()=>{ tone(1046,0.1,'triangle',0.08); tone(1318,0.14,'triangle',0.07); },300); }
    if(sum===7||sum===11){ for(const p of at) for(let k=0;k<7;k++){ const an=k*0.8976+rrnd('evo',-0.1,0.1); h3Shot({x:p[0],y:p[1],vx:Math.cos(an)*380,vy:Math.sin(an)*380,r:4,dmg:P.damage*1.5,life:0.6,pierce:3,col:'#ffd36b',shape:'pip'}); }
      showStreak('🎲 NATURAL '+sum+' — '+a+' + '+b+' 🎲'); for(let q=0;q<4;q++) setTimeout(()=>tone(880*Math.pow(1.26,q),0.1,'triangle',0.07),q*60); }
    if(a===1&&b===1){ for(let j=enemies.length-1;j>=0;j--){ const e=enemies[j]; if(inView(e.x,e.y,20)) evoHurt(e,P.damage*5*P.critMult,'#00ff6a',true); }
      flash(0.45,'#00ff6a'); shake=Math.min(24,shake+12); tone(55,0.5,'sine',0.3,30); coinRain&&coinRain(10); } } }
function h3Shots(dt){ for(let i=h3S.length-1;i>=0;i--){ const s=h3S[i]; s.t+=dt; s.life-=dt;
    if(s.seek){ s._tT=(s._tT||0)-dt; if(s._tT<=0||!s._tg||s._tg.hp<=0){ s._tT=0.2; s._tg=evoNear(s.x,s.y,420); }
      if(s._tg){ const a=Math.atan2(s._tg.y-s.y,s._tg.x-s.x); s.vx+=(Math.cos(a)*300-s.vx)*Math.min(1,dt*4); s.vy+=(Math.sin(a)*300-s.vy)*Math.min(1,dt*4); } }
    s.x+=s.vx*dt; s.y+=s.vy*dt; s.spin=s.shape==='crystal'?s.spin+dt*12:Math.atan2(s.vy,s.vx);
    if(s.life<=0){ h3S.splice(i,1); continue; }
    for(let j=enemies.length-1;j>=0;j--){ const e=enemies[j]; if(!e||s.hit.has(e)) continue; const rr=e.r+s.r; if((e.x-s.x)**2+(e.y-s.y)**2>=rr*rr) continue;
      s.hit.add(e); evoHurt(e,s.dmg,s.col,false);
      if(s.pierce>0) s.pierce--; else { s.life=0; break; } }
    if(s.life<=0) h3S.splice(i,1); }
  if(h3S.length>300) h3S.splice(0,h3S.length-300); }
{ const _tp=tickPairings;
  tickPairings=function(dt){ const r=_tp.apply(this,arguments);
    if(_h3Seq!==window._runSeq){ _h3Seq=window._runSeq; h3S=[]; h3Z=[]; h3D=[]; }
    if(!P) return r;
    if(P.evo){ P._evT=P._evT||{};
      for(const w in P.evo){ const id=P.evo[w]; if(H3_FIRE[id]){ P._evT[id]=(P._evT[id]||0)-dt; if(P._evT[id]<=0) P._evT[id]=H3_FIRE[id]()||1; } }
      if(evoOn('chaingang')) h3Chain(dt); else P._h3cg=null;
      if(evoOn('shark')) h3Shark(dt);
      if(evoOn('queen')) h3Queen(dt);
      if(evoOn('ouro')) h3Ouro(dt);
      if(evoOn('heart')) h3Heart(dt);
      if(evoOn('blackdeath')) h3Plague(dt); }
    if(h3Z.length) h3Ground(dt);
    if(h3D.length) h3Dice(dt);
    if(h3S.length) h3Shots(dt);
    return r; }; }
// ❣ a blow to the chest bursts the heart (and the House keeps you untouchable a beat)
{ const _h=hurtPlayer;
  hurtPlayer=function(dmg){ const inv=P&&P.inv>0, hp0=P&&P.hp; const r=_h.apply(this,arguments);
    try{ if(!inv && P && evoOn('heart') && state!=='dead' && P.hp<hp0 && (P._h3hx||0)<=gt){ P._h3hx=gt+4; h3HeartBurst(); P.inv=Math.max(P.inv||0,1.0); } }catch(e){}
    return r; }; }
// ---- the look ----
function h3Draw(){ const lite=GFX.lite;
  // ground first: pools, wax, plague, bomb marks, the chandelier's shadow
  for(const z of h3Z){ const f=z.m?Math.max(0,z.t/z.m):1;
    if(z.k==='pool'){ ctx.globalAlpha=Math.min(1,z.t*2)*0.85; ctx.drawImage(glowSprite('rgba(255,179,209,0.55)','rgba(255,120,170,0)',z.r),z.x-z.r,z.y-z.r,z.r*2,z.r*2);
      ctx.strokeStyle='rgba(255,233,242,0.6)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r*0.9,z.r*0.9,0,0,6.28); ctx.stroke();
      if(!lite){ ctx.fillStyle='#fff2c0'; for(let b=0;b<4;b++){ const a=gt*1.3+b*1.6+z.x, rr=(gt*30+b*17)%z.r; ctx.beginPath(); ctx.arc(z.x+Math.cos(a)*rr*0.8,z.y+Math.sin(a)*rr*0.8,1.6,0,6.28); ctx.fill(); } }
      if(z.pop>0){ ctx.globalAlpha=z.pop*3; ctx.fillStyle='#fff2c0'; ctx.fillRect(z.x-3,z.y-80*(1-z.pop*4),6,80*(1-z.pop*4)); } }
    else if(z.k==='wax'){ ctx.globalAlpha=Math.min(1,z.t)*0.8; ctx.drawImage(glowSprite('rgba(255,183,77,0.5)','rgba(255,120,30,0)',z.r),z.x-z.r,z.y-z.r,z.r*2,z.r*2); }
    else if(z.k==='cloud'){ ctx.globalAlpha=Math.min(1,z.t)*0.75; ctx.drawImage(glowSprite('rgba(143,191,0,0.45)','rgba(40,60,0,0)',z.r),z.x-z.r,z.y-z.r,z.r*2,z.r*2); }
    else if(z.k==='bomb'){ ctx.globalAlpha=0.8; ctx.strokeStyle='#ff4a00'; ctx.lineWidth=1.5; const rr=z.r*(0.3+0.7*f); ctx.beginPath(); ctx.arc(z.x,z.y,rr,0,6.28); ctx.moveTo(z.x-6,z.y); ctx.lineTo(z.x+6,z.y); ctx.moveTo(z.x,z.y-6); ctx.lineTo(z.x,z.y+6); ctx.stroke();
      const cy=z.y-f*220; ctx.fillStyle='#2a0a04'; ctx.strokeStyle='#ffd36b'; ctx.beginPath(); ctx.ellipse(z.x,cy,7,4,0,0,6.28); ctx.fill(); ctx.stroke(); }
    else if(z.k==='boom'){ ctx.globalAlpha=0.6; ctx.strokeStyle='#00ff6a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(z.x,z.y,z.r*(1-f),0,6.28); ctx.stroke(); }
    else if(z.k==='chand'){ const sr=150*(1-f*0.7); ctx.globalAlpha=0.5*(1-f)+0.15; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(z.x,z.y,sr,sr*0.45,0,0,6.28); ctx.fill(); ctx.globalAlpha=1; } }
  ctx.globalAlpha=1;
  if(P && P.evo){
    // ☣ the roaming clouds
    if(evoOn('blackdeath') && P._h3bd){ for(const c of P._h3bd){ ctx.globalAlpha=0.85; ctx.drawImage(glowSprite('rgba(143,191,0,0.5)','rgba(30,40,0,0)',105),c.x-105,c.y-105,210,210);
        ctx.globalAlpha=0.9; ctx.fillStyle='#d7ff6a'; ctx.font='700 18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('☣',c.x,c.y+Math.sin(gt*2+c.x)*3); } ctx.globalAlpha=1; }
    // 🦋 the queen's dust
    if(evoOn('queen') && P._h3q){ const q=P._h3q; ctx.globalAlpha=0.7; ctx.drawImage(glowSprite('rgba(192,80,255,0.35)','rgba(120,40,200,0)',120),q.x-120,q.y-120,240,240); ctx.globalAlpha=1; }
    // ⛓ the chain between the gang
    const c=P._h3cg; if(c){ ctx.strokeStyle='#9b8cff'; ctx.lineWidth=2.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.x,P.y); for(const e of c.links){ ctx.lineTo(e.x,e.y); } ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#e6e0ff'; for(const e of c.links){ ctx.beginPath(); ctx.arc(e.x,e.y,3,0,6.28); ctx.fill(); }
      ctx.globalAlpha=0.5+0.5*Math.sin(gt*30); ctx.strokeStyle='#fff2c0'; ctx.beginPath(); ctx.arc(c.kx,c.ky,10+c.t*60,0,6.28); ctx.stroke(); ctx.globalAlpha=1; }
    // 🐍 the brass serpent
    if(evoOn('ouro') && P._h3tr){ const tr=P._h3tr, n=Math.floor((tr.length-1)/3);
      for(let k=n;k>=0;k--){ const p=tr[k*3], s=9-k*0.25; ctx.fillStyle=k%2?'#00a884':'#00e0b0'; ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(3,s),0,6.28); ctx.fill();
        if(!lite){ ctx.fillStyle='rgba(255,233,160,0.6)'; ctx.beginPath(); ctx.arc(p.x-2,p.y-2,Math.max(1,s*0.35),0,6.28); ctx.fill(); } }
      const h=tr[0], h2=tr[Math.min(tr.length-1,2)], ha=Math.atan2(h.y-h2.y,h.x-h2.x);
      ctx.save(); ctx.translate(h.x,h.y); ctx.rotate(ha); ctx.fillStyle='#00e0b0'; ctx.beginPath(); ctx.ellipse(3,0,12,8,0,0,6.28); ctx.fill();
      ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.arc(7,-4,2,0,6.28); ctx.arc(7,4,2,0,6.28); ctx.fill(); ctx.strokeStyle='#ff2a3c'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(20,Math.sin(gt*20)*3); ctx.stroke(); ctx.restore();
      if(P._h3oc){ const R=P._h3oc.R||240; ctx.strokeStyle='#00e0b0'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(P.x,P.y,R,0,6.28); ctx.stroke();
        ctx.strokeStyle='#ffd36b'; ctx.lineWidth=1.5; ctx.setLineDash([3,6]); ctx.beginPath(); ctx.arc(P.x,P.y,R,0,6.28); ctx.stroke(); ctx.setLineDash([]); } }
    // 🦈 the shark
    if(evoOn('shark') && P._h3sk){ const s=P._h3sk, a=Math.atan2(s.hy,s.hx); ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(a);
      if(!lite){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55; ctx.drawImage(glowSprite('rgba(0,153,255,0.8)','rgba(0,153,255,0)',30),-30,-30,60,60); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
      const sw=Math.sin(gt*14)*4; ctx.fillStyle='#103a66'; ctx.strokeStyle='#0099ff'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(22,0); ctx.quadraticCurveTo(4,-10,-14,-3); ctx.lineTo(-26,-10+sw); ctx.lineTo(-22,0); ctx.lineTo(-26,10+sw); ctx.lineTo(-14,3); ctx.quadraticCurveTo(4,10,22,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#7fd0ff'; ctx.beginPath(); ctx.moveTo(2,-6); ctx.lineTo(-6,-16); ctx.lineTo(-8,-5); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(14,-3,1.6,0,6.28); ctx.fill(); if(s.mode==='l'){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.beginPath(); for(let t=0;t<4;t++){ ctx.moveTo(18-t*3,2); ctx.lineTo(16.5-t*3,5); } ctx.stroke(); }
      ctx.restore(); }
    // 🦋 the queen herself
    if(evoOn('queen') && P._h3q){ const q=P._h3q, fl=Math.abs(Math.sin(gt*9)); ctx.save(); ctx.translate(q.x,q.y-30);
      ctx.fillStyle='#c050ff'; ctx.strokeStyle='#ffd36b'; ctx.lineWidth=1.2;
      for(const sg of [-1,1]){ ctx.beginPath(); ctx.ellipse(sg*13*(0.4+0.6*fl),-6,14*(0.4+0.6*fl),10,sg*0.4,0,6.28); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(sg*9*(0.4+0.6*fl),8,9*(0.4+0.6*fl),7,-sg*0.4,0,6.28); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle='#2a1030'; ctx.beginPath(); ctx.ellipse(0,0,3.4,13,0,0,6.28); ctx.fill(); ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.arc(-1.6,-11,1.2,0,6.28); ctx.arc(1.6,-11,1.2,0,6.28); ctx.fill(); ctx.restore(); }
    // ❣ the heart at your chest
    if(evoOn('heart')){ const b=P._h3beat||0, s=1+b*0.35; ctx.save(); ctx.translate(P.x,P.y-36); ctx.scale(s,s);
      if(!lite){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35+0.4*Math.min(1,b); ctx.drawImage(glowSprite('rgba(255,0,96,0.9)','rgba(255,0,96,0)',18),-18,-18,36,36); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
      ctx.fillStyle='#ff0060'; ctx.beginPath(); ctx.moveTo(0,6); ctx.bezierCurveTo(-10,-2,-6,-10,0,-4); ctx.bezierCurveTo(6,-10,10,-2,0,6); ctx.fill();
      const n=(P._h3n||0)%6; ctx.fillStyle='#ffd36b'; for(let k=0;k<5;k++){ ctx.globalAlpha=k<n?1:0.25; ctx.fillRect(-9+k*4,9,2.4,2.4); } ctx.globalAlpha=1; ctx.restore(); }
  }
  // 💎 the chandelier in its fall
  for(const z of h3Z){ if(z.k!=='chand') continue; const f=Math.max(0,z.t/z.m), y=z.y-f*320; ctx.save(); ctx.translate(z.x,y);
    if(!lite) ctx.drawImage(glowSprite('rgba(255,236,170,0.8)','rgba(255,236,170,0)',40),-40,-40,80,80);
    ctx.strokeStyle='#ffd36b'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(0,-8); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,0,34,10,0,0,6.28); ctx.stroke();
    ctx.fillStyle='#7fd4ff'; for(let k=0;k<8;k++){ const a=k*0.785, x=Math.cos(a)*34, yy=Math.sin(a)*10; ctx.beginPath(); ctx.moveTo(x,yy); ctx.lineTo(x+3,yy+9); ctx.lineTo(x,yy+15); ctx.lineTo(x-3,yy+9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle='#fff2c0'; for(let k=0;k<5;k++){ const x=-28+k*14; ctx.fillRect(x-1.5,-12,3,8); ctx.fillStyle='#ffb74d'; ctx.beginPath(); ctx.arc(x,-14,2.2+Math.random(),0,6.28); ctx.fill(); ctx.fillStyle='#fff2c0'; }
    ctx.restore(); }
  // 🎲 the dice in flight
  for(const d of h3D){ const f=Math.min(1,d.t/d.T), hop=Math.abs(Math.sin(f*Math.PI*2.2))*(1-f)*40; ctx.save(); ctx.translate(d.x,d.y-hop); ctx.rotate(d.spin);
    ctx.fillStyle='#f6efe0'; ctx.strokeStyle='#00ff6a'; ctx.lineWidth=2; ctx.fillRect(-10,-10,20,20); ctx.strokeRect(-10,-10,20,20);
    const face=f>0.7?d.face:1+((d.spin*3)|0)%6, PIP={1:[[0,0]],2:[[-5,-5],[5,5]],3:[[-5,-5],[0,0],[5,5]],4:[[-5,-5],[5,-5],[-5,5],[5,5]],5:[[-5,-5],[5,-5],[0,0],[-5,5],[5,5]],6:[[-5,-6],[5,-6],[-5,0],[5,0],[-5,6],[5,6]]}[face];
    ctx.fillStyle=face===1?'#d01438':'#1a1208'; for(const p of PIP){ ctx.beginPath(); ctx.arc(p[0],p[1],2.1,0,6.28); ctx.fill(); }
    ctx.restore(); }
  // 🥂 goblets in flight
  for(const z of h3Z){ if(z.k!=='goblet') continue; const f=1-Math.max(0,z.t/z.m), x=z.sx+(z.x-z.sx)*f, y=z.sy+(z.y-z.sy)*f-Math.sin(f*Math.PI)*60;
    ctx.fillStyle='#ffb3d1'; ctx.strokeStyle='#fff2c0'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x-5,y-7); ctx.lineTo(x+5,y-7); ctx.lineTo(x,y+1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y+1); ctx.lineTo(x,y+6); ctx.moveTo(x-3,y+6); ctx.lineTo(x+3,y+6); ctx.stroke(); }
  // the small fry: moths, pips, crystal shards
  for(const s of h3S){ ctx.globalAlpha=Math.min(1,s.life*6);
    if(s.shape==='moth'){ const fl=Math.abs(Math.sin(gt*24+s.x)); ctx.fillStyle='#c050ff'; ctx.beginPath(); ctx.ellipse(s.x-3*fl,s.y,4*fl+1,3,0,0,6.28); ctx.ellipse(s.x+3*fl,s.y,4*fl+1,3,0,0,6.28); ctx.fill(); }
    else if(s.shape==='pip'){ ctx.fillStyle='#ffd36b'; ctx.beginPath(); ctx.arc(s.x,s.y,4,0,6.28); ctx.fill(); ctx.fillStyle='#1a1208'; ctx.beginPath(); ctx.arc(s.x,s.y,1.4,0,6.28); ctx.fill(); }
    else if(s.shape==='crystal'){ ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.spin); ctx.fillStyle='#7fd4ff'; ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(3,0); ctx.lineTo(0,6); ctx.lineTo(-3,0); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle=s.col; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.28); ctx.fill(); } }
  ctx.globalAlpha=1; }
{ const _dp=drawPairings;
  drawPairings=function(){ const r=_dp.apply(this,arguments);
    if(P && (P.evo || h3Z.length || h3S.length || h3D.length)){ ctx.save(); try{ h3Draw(); }catch(e){ console.error('[h3draw]',e); } ctx.restore(); }
    return r; }; }
