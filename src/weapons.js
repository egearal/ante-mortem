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
  stacked(){ const a0=Math.random()*6.283, ace=(Math.random()*13)|0;
    for(let i=0;i<13;i++){ const a=a0+i*(6.283/13), big=i===ace, sp=P.projSpeed*0.72;
      evoShot({vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?11:7,dmg:P.damage*(big?3.3:1.1)*P.critMult,crit:true,life:big?1.25:1.0,pierce:big?999:3,col:big?'#fff2c0':(i%2?'#ff3d6e':'#2a2030'),shape:'card',curl:2.2,spin:a,ace:big,suit:'♠♥♦♣'[i%4]}); }
    SFX.card(); setTimeout(()=>SFX.card(),60); noise(0.18,0.08,3800); tone(1760,0.08,'triangle',0.08,2600); },
  hand(){ const a0=Math.random()*6.283;
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
    if(P._evRat<=0 && rats<14){ P._evRat=0.5; const a=Math.random()*6.283; evoShot({x:P.x+Math.cos(a)*20,y:P.y+Math.sin(a)*20,vx:Math.cos(a)*90,vy:Math.sin(a)*90,r:5,dmg:P.damage*0.9,life:6,pierce:9999,col:'#b4ff3a',shape:'rat',rat:true,spin:a}); if(Math.random()<0.4) tone(1900+Math.random()*700,0.04,'square',0.03); } }
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
      if(s.rat){ const cdm=s.cdm||(s.cdm=new Map()); if((cdm.get(e)||0)>gt) continue; cdm.set(e,gt+0.35); if(evoHurt(e,s.dmg,'#b4ff3a',false)){ P.hp=Math.min(P.maxHp,P.hp+1); let n=0; for(const o of evoShots) if(o.rat) n++;
          for(let k=0;k<2&&n+k<30;k++){ const a=Math.random()*6.283; evoShot({x:s.x,y:s.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,r:5,dmg:P.damage*0.9,life:4,pierce:9999,col:'#b4ff3a',shape:'rat',rat:true,spin:a}); }
          if(Math.random()<0.3) tone(2600,0.03,'square',0.03); } continue; }
      if(s.hit.has(e)) continue; s.hit.add(e);
      const died=evoHurt(e,s.dmg,s.col,!!s.crit);
      if(s.petal) P.hp=Math.min(P.maxHp,P.hp+0.4);
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
  if(s.shape==='skull'){ for(let k=0;k<12;k++){ const a=k*0.5236+rnd(-0.1,0.1), sp=rnd(320,420);
      evoShot({x:s.x,y:s.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:3.5,dmg:P.damage*1.3,life:0.45,pierce:0,col:'#f2ead8',shape:'bone',gen:1,spin:a}); }
    ring(s.x,s.y,48,'#e9ff70'); burst(s.x,s.y,8,'#f2ead8'); tone(880,0.05,'triangle',0.08); tone(440,0.08,'triangle',0.06); }
  else if(s.shape==='bone' && s.gen===1){ for(let k=0;k<3;k++){ const a=Math.atan2(s.vy,s.vx)+(k-1)*0.9+rnd(-0.2,0.2), sp=280;
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
