"use strict";
// cached radial-glow sprites — createRadialGradient per frame per entity is the
// main canvas cost; draw these with ctx.globalAlpha for per-entity fade
const _glowCache={}; let _glowN=0;
function glowSprite(c0,c1,r){
  const rb=Math.max(8,Math.ceil(r/8)*8), key=c0+'|'+c1+'|'+rb;
  let cv2=_glowCache[key];
  if(!cv2){ cv2=document.createElement('canvas'); cv2.width=cv2.height=rb*2;
    const g2=cv2.getContext('2d'); const gr2=g2.createRadialGradient(rb,rb,0,rb,rb,rb);
    gr2.addColorStop(0,c0); gr2.addColorStop(1,c1); g2.fillStyle=gr2; g2.fillRect(0,0,rb*2,rb*2);
    if(++_glowN>240){ const ks=Object.keys(_glowCache); const cut=ks.length>>2; for(let i=0;i<cut;i++) delete _glowCache[ks[i]]; _glowN=ks.length-cut+1; } // evict the oldest quarter — never a wipe-stutter
    _glowCache[key]=cv2; }
  return cv2;
}
// A1 GILT NOIR — light sprites: a soft, eased falloff (not glowSprite's linear cone), baked once per color.
// Draw with globalCompositeOperation='lighter' and globalAlpha for intensity.
const _lightC={};
function lightSprite(r,g,b){
  const k=r+','+g+','+b; let c=_lightC[k]; if(c) return c;
  c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  const gr=x.createRadialGradient(64,64,0,64,64,64);
  for(let i=0;i<=8;i++){ const f=i/8, a=Math.pow(1-f,2.2)*(1-0.25*f); gr.addColorStop(f,'rgba('+k+','+a.toFixed(3)+')'); }
  x.fillStyle=gr; x.fillRect(0,0,128,128); _lightC[k]=c; return c;
}
// cached vertical linear gradients for enemy body parts (local coords after
// ctx.translate) — keyed by half-height bucket + colors
const _lgCache={}; let _lgN=0;
function _lgCap(){ if(++_lgN>400){ const ks=Object.keys(_lgCache); const cut=ks.length>>2; for(let i=0;i<cut;i++) delete _lgCache[ks[i]]; _lgN=ks.length-cut+1; } }
function lgrad(ry,c1,c2,mp,mc){
  const rb=Math.max(0.5,Math.round(ry*2)/2), key=rb+'|'+c1+'|'+c2+(mp?'|'+mp+'|'+mc:'');
  let g=_lgCache[key];
  if(!g){ g=ctx.createLinearGradient(0,-rb,0,rb); g.addColorStop(0,c1); if(mp) g.addColorStop(mp,mc); g.addColorStop(1,c2); _lgCap(); _lgCache[key]=g; }
  return g;
}
function buildGrain(){
  grainC=document.createElement('canvas'); grainC.width=140; grainC.height=140;
  const g=grainC.getContext('2d'); const id=g.createImageData(140,140); const d=id.data;
  for(let i=0;i<d.length;i+=4){ const v=Math.random()*255; d[i]=d[i+1]=d[i+2]=v; d[i+3]=Math.random()*20; }
  g.putImageData(id,0,0); grainReady=true;
}

/* ---------- particles / text ---------- */
function burst(x,y,n,col){ for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=rnd(40,200); parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.7),col,r:rnd(1.5,3.5)}); } }
function goldFlood(x,y){ for(let i=0;i<60;i++){ const a=Math.random()*6.28,s=rnd(60,320); parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.5,1.1),col:'#e8b64c',r:rnd(2,4)}); } }
function ash(x,y,n){ for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=rnd(10,60); parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:rnd(.8,1.8),col:pick(['#3a2a24','#2c2320','#4a3a30']),r:rnd(1,3),ash:true}); } }
function ring(x,y,maxr,col){ rings.push({x,y,r:6,maxr,life:0.5,col}); }
function spark(x1,y1,x2,y2,col){ sparks.push({x1,y1,x2,y2,life:0.18,col:col||'#bfe0ff'}); }
function ftext(x,y,t,col,big){
  // stacked hits MERGE into one bigger number — less confetti, more punch
  const n=parseFloat(t);
  if(!big && !isNaN(n) && /^[-+]?\d+$/.test(String(t).trim())){
    for(let i=texts.length-1;i>=Math.max(0,texts.length-8);i--){ const o=texts[i];
      if(o._n!==undefined && o.life>0.55 && o.col===col && Math.abs(o.x-x)<32 && Math.abs(o.y-y)<36){
        o._n+=n; o.t=String(Math.round(o._n)); o.size=Math.min(27,o.size+2.5); o.life=Math.max(o.life,0.78); return; } }
    texts.push({x,y,t:String(n),col,life:0.9,vy:-40,size:15,_n:n}); return; }
  texts.push({x,y,t,col,life:big?1.0:0.9,vy:big?-52:-40,size:big?31:15});
}
function flash(a,col){ a*=GFX.flash; if(a<=0) return; if(REDUCE) a*=0.4; elFlash.style.background=`radial-gradient(circle,${col||'#e8b64c'},transparent 65%)`; elFlash.style.opacity=a; setTimeout(()=>elFlash.style.opacity=0,90); }
let smites=[];
function chandelierBurst(l){
  l=l||1; const rad=140+l*10;
  const dmg=P.damage*(1.8+0.5*l);
  smites.push({x:P.x,y:P.y,t:0,rad,dmg,done:false});
  SFX.riser();
}
function tickSmites(dt){
  for(let i=smites.length-1;i>=0;i--){ const s=smites[i]; s.t+=dt;
    if(!s.done && s.t>=0.42){ s.done=true;
      burst(s.x,s.y,26,'#e8b64c'); burst(s.x,s.y,10,'#fff2c0'); ring(s.x,s.y,s.rad,'#e8b64c'); ring(s.x,s.y,s.rad*0.6,'#fff2c0');
      shake=Math.min(13,shake+6); flash(0.2,'#ffd36b'); SFX.nova();
      for(const e of enemies){ if(Math.hypot(e.x-s.x,e.y-s.y)<s.rad){ e.hp-=s.dmg; e.flash=0.1; ftext(e.x,e.y,Math.round(s.dmg),'#ffd36b'); } }
    }
    if(s.t>0.95) smites.splice(i,1);
  }
}
function drawSmites(){
  for(const s of smites){
    const f=Math.min(1,s.t/0.42);
    if(!s.done){
      // target glow + descending chandelier
      ctx.save();
      ctx.globalAlpha=0.35+f*0.3; ctx.strokeStyle='#ffd36b'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.rad*(1-f*0.4),0,6.28); ctx.stroke();
      const cy=s.y-260*(1-f*f);
      ctx.globalAlpha=1; ctx.translate(s.x,cy);
      ctx.strokeStyle='#caa64e'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-200); ctx.lineTo(0,-14); ctx.stroke();
      ctx.fillStyle='#8a6a2a'; ctx.beginPath(); ctx.ellipse(0,0,20,7,0,0,6.28); ctx.fill();
      ctx.fillStyle='#caa64e'; ctx.beginPath(); ctx.ellipse(0,-3,15,5,0,0,6.28); ctx.fill();
      for(let k=-2;k<=2;k++){ const fx2=k*7;
        ctx.fillStyle='#f6e7c0'; ctx.fillRect(fx2-1.2,-11,2.4,7);
        ctx.fillStyle='rgba(255,190,80,0.9)'; ctx.beginPath(); ctx.ellipse(fx2,-13+Math.sin(gt*12+k)*0.8,2.4,4,0,0,6.28); ctx.fill(); }
      ctx.restore();
    } else {
      const g=1-(s.t-0.42)/0.53;
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=Math.max(0,g*0.5);
      ctx.drawImage(glowSprite('rgba(255,220,130,0.8)','rgba(255,180,60,0)',48), s.x-s.rad, s.y-s.rad, s.rad*2, s.rad*2); ctx.restore(); ctx.globalAlpha=1;
    }
  }
}
// the rarity LANDS: no words — the screen itself lights up by tier when the
// offer reveals. Body classes wash the arena canvas; heavy layers gated by lite.
function rarityLandFX(rar){
  const t=RAR_TIER[rar]||0, lite=GFX.lite;
  SFX.rarSting(t);
  document.body.classList.remove('rw-uncommon','rw-rare','rw-epic','rw-legendary');
  if(t>=1 && !lite){
    const cls = t>=4?'rw-legendary' : t>=3?'rw-epic' : t>=2?'rw-rare' : 'rw-uncommon';
    document.body.classList.add(cls);
    setTimeout(()=>document.body.classList.remove(cls), 650);
  }
  if(t>=4){ flash(0.55,RARC[rar]||'#f8e2a0'); domConfetti(lite?10:20,'machine'); coinRain(lite?5:10); shake=Math.min(20,shake+6); sparkBurst(lite?12:24); }
  else if(t===3){ flash(0.42,'#c98bff'); sparkBurst(lite?9:18); shake=Math.min(16,shake+3); }
  else if(t===2){ flash(0.3,'#6db4ff'); sparkBurst(lite?5:10); }
  else if(t===1){ flash(0.24,'#8fd977'); sparkBurst(lite?4:7); }
  else flash(0.18,'#c9c1b4');
}
// universal SPACE dopamine: pop the on-screen button/hint tied to a press
function pressPulse(el){
  if(typeof el==='string') el=$(el);
  if(!el) return;
  el.classList.remove('sp-pop'); void el.offsetWidth; el.classList.add('sp-pop');
}
// glyphs fly from where the money was made INTO the counter that holds it
function flyGlyphs(fromId,toId,glyph,n,col){
  try{
    const a=document.getElementById(fromId), b=document.getElementById(toId); if(!a||!b) return;
    const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
    if(!ra.width&&!ra.height) return;
    const x1=rb.left+rb.width/2, y1=rb.top+rb.height/2;
    for(let i=0;i<n;i++){
      const s=document.createElement('span'); s.className='flyG'; s.textContent=glyph;
      s.style.color=col||'#ffd36b';
      const x0=ra.left+ra.width/2+(Math.random()-0.5)*70, y0=ra.top+ra.height/2+(Math.random()-0.5)*36;
      s.style.left=x0+'px'; s.style.top=y0+'px';
      document.body.appendChild(s);
      setTimeout(()=>{ s.style.transform='translate('+(x1-x0)+'px,'+(y1-y0)+'px) scale(0.45)'; s.style.opacity='0'; }, 30+i*50);
      setTimeout(()=>{ s.remove(); if(i===n-1){ b.classList.remove('gulp'); void b.offsetWidth; b.classList.add('gulp'); try{ SFX.coinPling(); }catch(e){} } }, 720+i*50);
    }
  }catch(e){}
}
function bigWin(label,tier){
  if(typeof duckDrone==='function') duckDrone(1400);
  const l=$('jackpotLayer'), t=$('jackpotText'); t.textContent=label; t.className='jackpotText t'+tier;
  l.classList.remove('hidden'); t.style.animation='none'; void t.offsetWidth; t.style.animation='';
  SFX.bigWin(tier); SFX.dingBells(); setTimeout(()=>SFX.dingBells(),240); setTimeout(()=>SFX.dingBells(),520); SFX.cashout(); setTimeout(()=>SFX.cashout(),400);
  coinRain(38+tier*24); excite=1; shake=Math.min(28,shake+18);
  sparkBurst(50+tier*10);
  if(tier>=4){ let cv=document.getElementById('chromaV'); if(!cv){ cv=document.createElement('div'); cv.id='chromaV'; document.body.appendChild(cv); }
    cv.classList.remove('flick'); void cv.offsetWidth; cv.classList.add('flick'); } // 238: the world splits at the edges, once
  const cols=['#ffd36b','#8bff9a','#6db4ff','#c98bff','#fff2c0','#ff8a5a'];
  cols.forEach((c,i)=>setTimeout(()=>{ flash(0.42,c); sparkBurst(26); SFX.casinoDing(); },i*90));
  setTimeout(()=>l.classList.add('hidden'), 1600+tier*240);
}
function seraphCeremony(){
  const l=$('jackpotLayer'), t=$('jackpotText'); t.textContent='SERAPH'; t.className='jackpotText seraph';
  l.classList.remove('hidden'); t.style.animation='none'; void t.offsetWidth; t.style.animation='';
  SFX.seraph(); flash(0.5,'#dceeff'); coinRain(34); excite=1;
  setTimeout(()=>l.classList.add('hidden'),1400);
}
function coinRain(n){
  // the rain sounds as big as it pays
  try{ if(!muted&&AC) tone(520,0.05,'sine',Math.min(0.12,0.04+n*0.003)); }catch(e){}
  const box=$('coinRain'); if(!box) return;
  for(let i=0;i<n;i++){
    const c=document.createElement('div'); c.className='fallCoin';
    c.style.left=(Math.random()*100)+'%';
    const dur=1.1+Math.random()*1.2; c.style.animationDuration=dur+'s'; c.style.animationDelay=(Math.random()*0.4)+'s';
    const sz=(14+Math.random()*12)|0; c.style.width=sz+'px'; c.style.height=sz+'px';
    box.appendChild(c); setTimeout(()=>c.remove(),(dur+0.6)*1000);
  }
  // audible coin shower — more coins, more plinks
  const plinks=Math.min(14, 3+Math.floor(n/3));
  for(let i=0;i<plinks;i++) setTimeout(()=>SFX.coinPling(), i*55 + Math.random()*30);
  if(n>=14) setTimeout(()=>SFX.chipStack(),120);
}
function sparkBurst(n){ sparkBurstAt('machine','slot',n); }
// host-aware sparks: rect from boxId, sparks appended to layerId (a fixed
// inset-0 layer so viewport coords hold). Slot's sparkBurst is the wrapper.
function sparkBurstAt(boxId,layerId,n){ n=Math.round(n*1.4);
  const m=$(boxId), host=$(layerId); if(!m||!host) return;
  const r=m.getBoundingClientRect(); if(r.width===0&&r.height===0) return;
  for(let i=0;i<n;i++){
    const s=document.createElement('div'); s.className='spark';
    const ang=Math.random()*6.283, dist=55+Math.random()*150;
    const edge=Math.random()<0.5;
    const x0 = edge ? (Math.random()<0.5?r.left:r.right) : r.left+Math.random()*r.width;
    const y0 = edge ? r.top+Math.random()*r.height : (Math.random()<0.5?r.top:r.bottom);
    s.style.left=x0+'px'; s.style.top=y0+'px';
    s.style.setProperty('--dx',(Math.cos(ang)*dist)+'px');
    s.style.setProperty('--dy',(Math.sin(ang)*dist)+'px');
    const hue=Math.random()<0.5?'#ffd36b':'#fff2c0';
    s.style.background=hue; s.style.boxShadow='0 0 9px '+hue;
    host.appendChild(s);
    setTimeout(()=>{ if(s.parentNode) s.remove(); },700);
  }
}

/* ---------- A1 GILT NOIR: hit feel — kill bursts by tier, elite hit-stop, the struck gambler ---------- */
let pops=[];
function killTier(e){ return e.boss?4:(e.elite?3:((e.r>=18||(e.maxhp||0)>=90)?2:1)); }
function killFX(e){
  const tier=killTier(e);
  if(pops.length<(GFX.lite?12:40)) pops.push({x:e.x,y:e.y,r:e.r*(1.3+tier*0.55),t:0,max:0.12+tier*0.06,tier,col:e.elite?'201,139,255':(e.boss?'255,90,120':'255,236,210')});
  const ns=GFX.lite?2:[0,4,8,18,30][tier];
  for(let i=0;i<ns;i++){ const a=Math.random()*6.283, sp=rnd(120,260+tier*60);
    parts.push({x:e.x,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rnd(.12,.22+tier*0.05),col:i%3?'#fff6e6':(tier>=3?'#e8ccff':'#ff6a6a'),r:rnd(1.2,1.6+tier*0.4)}); }
  if(tier>=3){ hitstop=Math.max(hitstop,tier>=4?0.09:0.04); // 40ms held breath on an elite, longer for a lord
    if(!muted){ noise(0.09,0.22,2400); tone(tier>=4?55:82,0.32,'sine',0.26,30); tone(1320,0.08,'triangle',0.06,660); } }
  else if(tier===2 && !muted){ if(!window._kpT||gt-window._kpT>0.06){ window._kpT=gt; tone(150,0.11,'sine',0.11,58); noise(0.04,0.06,1200); } }
  courtDeath(e); // E1 — the death animation of its family
}
function hurtFX(dmg){
  P._hurtF=gt+0.2;
  for(let i=0;i<(GFX.lite?4:12);i++){ const a=Math.random()*6.283, sp=rnd(60,200);
    parts.push({x:P.x,y:P.y-8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,life:rnd(.2,.45),col:i%2?'#c81e2c':'#ff4d5a',r:rnd(1.4,2.8)}); }
  ring(P.x,P.y,46,'#ff3344');
  if(!muted){ tone(68,0.2,'sine',0.24,38); noise(0.05,0.1,700); }
}
function drawPops(){
  if(!pops.length) return;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=pops.length-1;i>=0;i--){ const p=pops[i]; p.t+=1/60; if(p.t>=p.max){ pops.splice(i,1); continue; }
    const k=p.t/p.max, rr=p.r*(0.55+k*0.9);
    ctx.globalAlpha=(1-k)*(0.65+p.tier*0.08);
    ctx.drawImage(glowSprite('rgba(255,255,255,1)','rgba('+p.col+',0)',32), p.x-rr, p.y-rr, rr*2, rr*2);
    if(p.tier>=2){ ctx.globalAlpha=(1-k)*0.9; ctx.strokeStyle='rgba('+p.col+',1)'; ctx.lineWidth=1+p.tier*0.8; ctx.beginPath(); ctx.arc(p.x,p.y,rr*1.15,0,6.283); ctx.stroke(); } }
  ctx.restore(); ctx.globalAlpha=1;
}

/* ==== E1 — THE COURT IN MOTION ==================================================================
   Every regular enemy is a baked 4-frame sprite sheet (body + ink plate + white flash + wound shade,
   per palette), drawn with one drawImage per layer per frame; the far court (LOD) uses the very
   same frames. Live overlays are only what must track the world: eyes, the bow, the hexer's orb,
   the bomber's fuse. Bosses keep their own draw path (drawEnemy) untouched.
   ============================================================================================== */
const COURT_VS={shambler:1.2,husk:1.22,swarm:1.32,bomber:1.26,leech:1.16,shooter:1.2,wraith:1.24,stalker:1.24,hexer:1.2,brute:1.12,revenant:1.12,elite:1.1,gilded:1.24};
const COURT_FPS={shambler:4.2,husk:10,swarm:13,bomber:7,leech:3.4,shooter:3,wraith:4.5,stalker:11,hexer:3.6,brute:3.4,revenant:3.4,elite:3.6,gilded:11};
const COURT_K={brute:1.3,revenant:1.3,elite:1.5,leech:1.15,hexer:1.1,wraith:1.1}; // bake resolution for the big bodies
const COURT_FAM={shooter:'crumble',husk:'crumble',revenant:'crumble',gilded:'crumble',wraith:'dissolve',hexer:'dissolve',elite:'dissolve'}; // the rest burst
// eye anchors in art units (facing right; flipped with the body) and their glow color
const COURT_EYE={shambler:[[0.42,-0.66]],husk:[[0.5,-0.78],[0.36,-0.8]],swarm:[[-0.13,-0.2],[0.13,-0.2]],bomber:[[0.16,-0.05],[0.44,-0.05]],
  leech:[[0.62,-0.2]],shooter:[[0.06,-0.66],[0.24,-0.66]],wraith:[[0.12,-0.6],[0.32,-0.6]],stalker:[[0.62,-0.08],[0.62,0.08]],
  hexer:[[0.14,-0.62]],brute:[[0.3,-0.66],[0.5,-0.64]],revenant:[[0.12,-0.83],[0.3,-0.83]],elite:[[0.06,-0.72],[0.26,-0.72]],gilded:[[0.38,-0.7]]};
const COURT_EC={shambler:'255,77,77',husk:'255,150,60',swarm:'255,90,90',bomber:'255,170,60',leech:'170,255,110',shooter:'255,206,90',
  wraith:'150,215,255',stalker:'255,223,90',hexer:'201,255,122',brute:'255,77,77',revenant:'255,60,60',elite:'235,190,255',gilded:'255,250,220'};
const _CT=new Map();
function _ck(g,R){ // the art kit: an R-unit path DSL with ink-under-fill, limbs, gradients, baked glows
  const INK='#07030a', OW=Math.max(2,R*0.15);
  const k={R,INK,OW,
    path(d){ const t=d.trim().split(/[\s,]+/); let i=0; const n=()=>parseFloat(t[i++])*R; g.beginPath();
      while(i<t.length){ const c=t[i++];
        if(c==='M') g.moveTo(n(),n()); else if(c==='L') g.lineTo(n(),n());
        else if(c==='Q'){ const a=n(),b=n(),x=n(),y=n(); g.quadraticCurveTo(a,b,x,y); }
        else if(c==='C'){ const a=n(),b=n(),c2=n(),d2=n(),x=n(),y=n(); g.bezierCurveTo(a,b,c2,d2,x,y); }
        else if(c==='E'){ const x=n(),y=n(),rx=n(),ry=n(); g.moveTo(x+rx,y); g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,6.2832); }
        else if(c==='Z') g.closePath(); } },
    fill(d,fill,ow){ k.path(d); g.lineJoin='round'; g.lineCap='round'; if(ow!==0){ g.strokeStyle=INK; g.lineWidth=ow||OW; g.stroke(); } g.fillStyle=fill; g.fill(); },
    line(d,col,w){ k.path(d); g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=col; g.lineWidth=w*R; g.stroke(); },
    limb(d,w,col){ k.path(d); g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=INK; g.lineWidth=w*R+OW; g.stroke(); g.strokeStyle=col; g.lineWidth=w*R; g.stroke(); },
    vg(y0,y1,...st){ const gr=g.createLinearGradient(0,y0*R,0,y1*R); for(let i=0;i<st.length;i+=2) gr.addColorStop(st[i],st[i+1]); return gr; },
    rg(x,y,r0,r1,...st){ const gr=g.createRadialGradient(x*R,y*R,r0*R,x*R,y*R,r1*R); for(let i=0;i<st.length;i+=2) gr.addColorStop(st[i],st[i+1]); return gr; },
    glow(x,y,r,col,core){ g.save(); g.shadowColor=col; g.shadowBlur=r*R*3; g.fillStyle=col; g.beginPath(); g.arc(x*R,y*R,r*R,0,6.2832); g.fill();
      g.shadowBlur=0; if(core){ g.fillStyle=core; g.beginPath(); g.arc(x*R,y*R,r*R*0.45,0,6.2832); g.fill(); } g.restore(); },
    sheen(d,a){ g.save(); k.path(d); g.clip(); g.globalCompositeOperation='lighter'; g.fillStyle='rgba(255,235,210,'+(a||0.16)+')'; g.fillRect(-R*3,-R*3,R*6,R*1.8+R*0.0); g.restore(); }
  };
  return k;
}
function _courtArt(g,T,R,f,col,dark){
  const k=_ck(g,R), ph=f*Math.PI/2, s=Math.sin(ph), c=Math.cos(ph), F=v=>(+v).toFixed(3);
  const INK=k.INK, bone='#e6d9c2', bone2='#b9ab8f';
  if(T==='shambler'){ // THE LOST GAMBLER — hunched corpse in a rotted dinner jacket, one hand still holding its last card
    const lift=x=>Math.max(0,x)*0.12;
    k.limb(`M -0.12 0.42 L ${F(-0.2-0.2*s)} 0.72 L ${F(-0.28-0.3*s)} ${F(0.98-lift(-c))}`,0.2,'#1d171c');
    k.limb(`M -0.3 -0.2 Q -0.62 0.12 ${F(-0.5+0.05*c)} ${F(0.52+0.04*s)}`,0.17,dark);
    k.fill(`E ${F(-0.5+0.05*c)} ${F(0.58+0.04*s)} 0.1 0.09`,col);
    k.fill('M -0.48 -0.34 Q 0.02 -0.8 0.5 -0.32 Q 0.66 0.12 0.44 0.58 L 0.3 0.5 L 0.18 0.66 L 0.04 0.52 L -0.12 0.68 L -0.26 0.52 L -0.42 0.62 Q -0.66 0.12 -0.48 -0.34 Z',k.vg(-0.6,0.7,0,'#3d3a44',0.5,'#211c26',1,'#0e0b10'));
    k.fill('M 0.02 -0.5 L 0.32 -0.42 L 0.16 0.1 Z',bone2,R*0.08);
    k.fill('M 0.17 -0.44 L 0.25 -0.4 L 0.22 -0.02 L 0.15 0.04 L 0.13 -0.4 Z','#8b1620',0);
    k.limb(`M -0.12 0.42 L ${F(-0.12+0.2*s)} 0.72 L ${F(-0.06+0.3*s)} ${F(0.98-lift(c))}`,0.2,'#2a2228');
    k.limb(`M 0.32 -0.24 Q 0.66 ${F(-0.12+0.05*s)} ${F(0.92+0.03*c)} ${F(0.02+0.07*s)}`,0.18,col);
    g.save(); g.translate((0.98+0.03*c)*R,(0.0+0.07*s)*R); g.rotate(-0.35+0.1*s);
    k.fill('M -0.1 -0.16 L 0.1 -0.16 L 0.1 0.16 L -0.1 0.16 Z','#efe8d8',R*0.07); k.fill('M 0 -0.07 L 0.05 0 L 0 0.07 L -0.05 0 Z','#c8102e',0); g.restore();
    k.fill(`E ${F(0.95+0.03*c)} ${F(0.04+0.07*s)} 0.09 0.08`,col);
    g.save(); g.translate((0.3+0.03*s)*R,(-0.64+0.03*c)*R); g.rotate(0.28+0.08*s);
    k.fill('E 0 0 0.31 0.27',k.vg(-0.27,0.27,0,col,1,dark));
    k.fill('M -0.08 0.14 Q 0.06 0.36 0.2 0.12 Z','#120608',R*0.06);
    k.fill('E 0.12 -0.03 0.09 0.1','#1a0e12',0); k.glow(0.12,-0.03,0.05,'#ff4d4d','#ffd0c0');
    k.line('M -0.06 -0.1 L 0.02 -0.0 M 0.02 -0.1 L -0.06 0.0','#120a0c',0.05);
    k.line('M -0.2 -0.22 Q -0.1 -0.42 0.0 -0.26 M -0.06 -0.24 Q 0.06 -0.44 0.14 -0.24','#0e0a0c',0.05);
    g.restore();
    k.sheen('M -0.48 -0.34 Q 0.02 -0.8 0.5 -0.32 Q 0.66 0.12 0.44 0.58 L -0.42 0.62 Q -0.66 0.12 -0.48 -0.34 Z',0.12);
  } else if(T==='husk'){ // EMBER HUSK — a charred sprinter, lungs still burning, cracks of live coal
    const legs=(sg,sh)=>{ const ss=s*sg, up=Math.max(0,-c*sg)*0.16;
      k.limb(`M 0 0.28 L ${F(0.3*ss+0.04)} 0.6 L ${F(0.42*ss-0.12)} ${F(0.98-up)}`,0.13,sh); };
    legs(-1,'#120d0a');
    k.limb(`M -0.02 -0.3 L ${F(-0.3-0.25*s)} -0.02 L ${F(-0.4-0.3*s)} 0.26`,0.11,'#1a120e');
    g.save(); g.rotate(0.34);
    k.fill('M -0.26 -0.62 Q 0.06 -0.74 0.28 -0.6 Q 0.32 -0.1 0.18 0.34 L -0.16 0.36 Q -0.34 -0.1 -0.26 -0.62 Z',k.vg(-0.7,0.4,0,col,0.35,dark,1,'#120c08'));
    k.line('M -0.12 -0.5 L 0.0 -0.22 L -0.12 0.06 L 0.02 0.28 M 0.14 -0.5 L 0.06 -0.2 L 0.18 0.1','rgba(255,120,30,0.55)',0.11);
    k.line('M -0.12 -0.5 L 0.0 -0.22 L -0.12 0.06 L 0.02 0.28 M 0.14 -0.5 L 0.06 -0.2 L 0.18 0.1','#ffb35a',0.04);
    k.line('M -0.18 -0.36 L 0.2 -0.36 M -0.2 -0.2 L 0.22 -0.2','rgba(10,6,4,0.7)',0.035);
    g.restore();
    legs(1,'#2a1e18');
    k.limb(`M 0.12 -0.32 L ${F(0.36+0.25*s)} -0.04 L ${F(0.6+0.3*s)} 0.1`,0.11,'#3a2c22');
    g.save(); g.translate(0.42*R,-0.78*R); g.rotate(0.3);
    k.fill('M -0.22 0.02 Q -0.22 -0.26 0.04 -0.26 Q 0.28 -0.24 0.26 0.04 Q 0.2 0.22 0.0 0.2 Q -0.2 0.2 -0.22 0.02 Z',k.vg(-0.26,0.22,0,col,1,'#16100c'));
    k.glow(-0.04,-0.32,0.07,'#ff8a2c','#ffe0a0'); k.glow(0.1,-0.36,0.05,'#ff6a1c','#ffd080');
    k.line('M 0.0 0.0 L 0.2 -0.02','#ffcf7a',0.06);
    g.restore();
  } else if(T==='swarm'){ // BAT-IMP — bone-fingered wings beating in four frames
    const tip=[-0.95,-0.25,0.5,-0.25][f], span=[1.5,1.62,1.32,1.62][f];
    for(const sd of [-1,1]){ const X=v=>F(v*sd);
      k.fill(`M ${X(0.18)} -0.12 Q ${X(0.8)} ${F(-0.6+tip*0.6)} ${X(span)} ${F(tip+0.1)} Q ${X(span*0.82)} ${F(0.22+tip*0.35)} ${X(span*0.6)} ${F(0.18+tip*0.2)} Q ${X(0.55)} ${F(0.36+tip*0.15)} ${X(0.38)} 0.18 Q ${X(0.3)} 0.3 ${X(0.16)} 0.22 Z`,k.vg(-0.9,0.5,0,'#4a2a2e',1,'#1a0c10'));
      k.line(`M ${X(0.2)} -0.08 L ${X(span*0.98)} ${F(tip+0.12)} M ${X(0.3)} 0.02 L ${X(span*0.62)} ${F(0.16+tip*0.2)}`,'rgba(150,110,100,0.7)',0.04); }
    k.line(`M 0 0.42 Q ${F(-0.3*s)} 0.8 ${F(0.25*c)} 1.05`,INK,0.11); k.line(`M 0 0.42 Q ${F(-0.3*s)} 0.8 ${F(0.25*c)} 1.05`,dark,0.06);
    k.fill('M -0.3 -0.45 L -0.42 -0.9 L -0.12 -0.55 Z M 0.3 -0.45 L 0.42 -0.9 L 0.12 -0.55 Z',dark);
    k.fill('E 0 0.02 0.42 0.52',k.vg(-0.5,0.5,0,col,1,dark));
    k.fill('M -0.2 0.16 L -0.12 0.34 L -0.04 0.18 L 0.04 0.18 L 0.12 0.34 L 0.2 0.16 Z','#ffd8d0',R*0.05);
    k.glow(-0.13,-0.2,0.08,'#ff5a5a','#ffe0e0'); k.glow(0.13,-0.2,0.08,'#ff5a5a','#ffe0e0');
  } else if(T==='bomber'){ // POWDER KEG — an iron bomb on stubby legs, a grinning skull painted on, fuse lit
    const tl=[0,0.09,0,-0.09][f];
    k.limb(`M -0.24 0.5 L ${F(-0.3+0.06*s)} ${F(0.9-Math.max(0,s)*0.12)}`,0.16,'#1c1412');
    k.limb(`M 0.24 0.5 L ${F(0.3-0.06*s)} ${F(0.9-Math.max(0,-s)*0.12)}`,0.16,'#2a1e18');
    g.save(); g.rotate(tl);
    k.fill('E 0 0.08 0.7 0.66',k.rg(-0.25,-0.2,0.05,0.85,0,'#5a4a46',0.55,'#241a18',1,'#0c0706'));
    k.fill('M -0.69 0.02 Q 0 0.2 0.69 0.02 L 0.68 0.2 Q 0 0.38 -0.68 0.2 Z',col,R*0.08);
    k.line('M -0.6 0.06 Q 0 0.22 0.6 0.06','rgba(255,235,180,0.5)',0.03);
    k.fill('M 0.06 -0.2 Q 0.3 -0.38 0.54 -0.2 Q 0.6 0.04 0.44 0.1 L 0.16 0.1 Q 0.0 0.04 0.06 -0.2 Z',bone,R*0.06);
    k.fill('E 0.18 -0.06 0.07 0.08 E 0.42 -0.06 0.07 0.08','#120806',0);
    k.line('M 0.18 0.06 L 0.42 0.06 M 0.24 0.02 L 0.24 0.1 M 0.3 0.02 L 0.3 0.1 M 0.36 0.02 L 0.36 0.1','#120806',0.03);
    k.fill('M -0.14 -0.58 L 0.14 -0.58 L 0.12 -0.7 L -0.12 -0.7 Z','#3a2e2a',R*0.07);
    k.limb(`M 0 -0.7 Q ${F(0.1+0.04*s)} -0.92 ${F(0.32+0.05*c)} -0.98`,0.05,'#b89a6a');
    k.sheen('E 0 0.08 0.7 0.66',0.1);
    g.restore();
  } else if(T==='leech'){ // THE LEECH — a three-ringed slug that drinks for the court; lamprey mouth, poison glands
    const q=[1,0.9,0.8,0.9][f], hb=[0,-0.03,-0.06,-0.03][f];
    const segs=[[-0.62*q,0.3,0.42,0.32],[-0.12*q,0.22+hb,0.48,0.38],[0.4*q,0.14,0.42,0.36]];
    for(let i=0;i<3;i++){ const S=segs[i]; k.fill(`E ${F(S[0])} ${F(S[1])} ${F(S[2])} ${F(S[3])}`,k.vg(S[1]-S[3],S[1]+S[3],0,col,0.6,dark,1,'#081a0e')); }
    for(let i=0;i<3;i++){ const S=segs[i]; k.line(`M ${F(S[0]-S[2]*0.6)} ${F(S[1]-S[3]*0.55)} Q ${F(S[0])} ${F(S[1]-S[3]*0.95)} ${F(S[0]+S[2]*0.6)} ${F(S[1]-S[3]*0.55)}`,'rgba(220,255,220,0.28)',0.06);
      k.glow(S[0]-S[2]*0.2,S[1]-S[3]*0.4,0.055,'#9dff6a','#efffd8'); k.glow(S[0]+S[2]*0.3,S[1]-S[3]*0.2,0.04,'#9dff6a'); }
    for(let i=0;i<3;i++){ const a=-1.9+i*0.4+0.12*s; k.limb(`M ${F(0.4*q)} -0.12 Q ${F(0.4*q+Math.cos(a)*0.3)} ${F(-0.12+Math.sin(a)*0.45)} ${F(0.4*q+Math.cos(a+0.5)*0.5)} ${F(-0.2+Math.sin(a+0.3)*0.6)}`,0.05,'#2a5a36'); }
    const mx=0.4*q+0.42; k.fill(`E ${F(mx)} 0.16 0.17 0.2`,'#3a0c12');
    for(let i=0;i<7;i++){ const a=i/7*6.283; k.fill(`M ${F(mx+Math.cos(a)*0.16)} ${F(0.16+Math.sin(a)*0.19)} L ${F(mx+Math.cos(a+0.2)*0.07)} ${F(0.16+Math.sin(a+0.2)*0.08)} L ${F(mx+Math.cos(a-0.2)*0.07)} ${F(0.16+Math.sin(a-0.2)*0.08)} Z`,bone,0); }
    k.fill(`E ${F(mx)} 0.16 0.05 0.06`,'#120204',0);
  } else if(T==='shooter'){ // SKELETAL ARCHER — a bone-ash hood, ribs behind the rags, a quiver of amber arrows
    const sw=[0,0.03,0,-0.03][f];
    k.fill('M -0.5 -0.66 L -0.3 -0.62 L -0.62 0.1 L -0.78 0.04 Z','#3a2a16',R*0.08);
    k.line('M -0.44 -0.7 L -0.36 -0.86 M -0.36 -0.66 L -0.24 -0.8','#ffce5a',0.06);
    k.limb(`M -0.1 0.5 L ${F(-0.14+0.08*s)} 0.96`,0.08,bone2); k.limb(`M 0.12 0.5 L ${F(0.16-0.08*s)} 0.96`,0.08,bone);
    k.fill(`M 0 -0.98 Q 0.62 -0.7 0.56 -0.1 Q 0.6 0.5 0.46 0.66 L 0.32 0.54 L 0.2 0.7 L 0.06 0.54 L ${F(-0.1+sw)} 0.72 L -0.2 0.54 L ${F(-0.36+sw)} 0.68 L -0.46 0.5 Q -0.6 -0.1 -0.44 -0.62 Q -0.3 -0.92 0 -0.98 Z`,k.vg(-1,0.7,0,col,0.45,dark,1,'#120c06'));
    k.fill('M -0.18 -0.3 Q 0.06 -0.4 0.3 -0.3 L 0.26 0.24 Q 0.06 0.32 -0.14 0.24 Z','#140c06',R*0.06);
    k.line('M -0.1 -0.18 Q 0.08 -0.1 0.24 -0.18 M -0.1 -0.06 Q 0.08 0.02 0.24 -0.06 M -0.08 0.06 Q 0.08 0.14 0.22 0.06 M 0.07 -0.3 L 0.07 0.22',bone2,0.045);
    k.fill('M -0.08 -0.64 Q -0.08 -0.88 0.16 -0.88 Q 0.38 -0.86 0.36 -0.6 Q 0.32 -0.44 0.14 -0.44 Q -0.06 -0.44 -0.08 -0.64 Z','#140c06',R*0.05);
    k.fill('M -0.02 -0.66 Q -0.02 -0.84 0.15 -0.84 Q 0.32 -0.82 0.31 -0.64 Q 0.28 -0.5 0.15 -0.5 Q 0.0 -0.5 -0.02 -0.66 Z',bone,0);
    k.fill('E 0.06 -0.66 0.06 0.07 E 0.24 -0.66 0.06 0.07','#0a0508',0);
    k.line('M 0.08 -0.54 L 0.22 -0.54','#6a5a40',0.03);
    k.sheen(`M 0 -0.98 Q 0.62 -0.7 0.56 -0.1 L -0.46 0.5 Q -0.6 -0.1 -0.44 -0.62 Q -0.3 -0.92 0 -0.98 Z`,0.1);
  } else if(T==='wraith'){ // BANSHEE — a shroud with no legs, hair streaming behind, arms already reaching for you
    const w1=0.12*s, w2=0.12*c;
    k.line(`M -0.1 -0.8 Q -0.7 ${F(-0.7+w1)} -1.05 ${F(-0.4+w2)} M -0.05 -0.7 Q -0.62 ${F(-0.4+w2)} -0.98 ${F(-0.1+w1)}`,'rgba(30,20,50,0.9)',0.1);
    k.line(`M -0.1 -0.8 Q -0.7 ${F(-0.7+w1)} -1.05 ${F(-0.4+w2)} M -0.05 -0.7 Q -0.62 ${F(-0.4+w2)} -0.98 ${F(-0.1+w1)}`,'rgba(150,140,200,0.55)',0.04);
    k.fill(`M 0.1 -1.02 Q 0.72 -0.82 0.6 -0.12 Q 0.56 0.4 ${F(0.36+w1)} 0.7 Q ${F(0.3+w2)} 1.0 ${F(0.12+w1)} 1.08 Q 0.12 0.8 ${F(-0.06+w2)} 0.74 Q ${F(-0.16-w1)} 1.06 ${F(-0.36-w2)} 1.0 Q -0.28 0.7 ${F(-0.44+w1)} 0.5 Q -0.62 0.0 -0.48 -0.52 Q -0.3 -0.98 0.1 -1.02 Z`,k.vg(-1.05,1.08,0,col,0.45,dark,1,'rgba(20,12,34,0.35)'));
    k.line(`M -0.2 -0.1 Q 0.05 0.3 ${F(0.0+w1)} 0.8 M 0.2 -0.1 Q 0.3 0.3 ${F(0.22+w2)} 0.7`,'rgba(200,190,255,0.22)',0.05);
    k.limb(`M 0.3 -0.3 Q 0.72 ${F(-0.32+w1)} ${F(0.98+0.04*c)} ${F(-0.2+w1)}`,0.07,'#b6b8d8'); k.limb(`M 0.24 -0.16 Q 0.6 ${F(-0.06+w2)} ${F(0.88+0.04*s)} ${F(0.02+w2)}`,0.065,'#9a9cc0');
    for(let i=0;i<3;i++){ k.line(`M ${F(0.98+0.04*c)} ${F(-0.2+w1)} L ${F(1.12+0.04*c)} ${F(-0.3+w1+i*0.1)}`,'#dfe4ff',0.035); }
    k.fill('M 0.0 -0.62 Q 0.0 -0.9 0.22 -0.9 Q 0.46 -0.88 0.44 -0.58 Q 0.42 -0.36 0.22 -0.32 Q 0.02 -0.34 0.0 -0.62 Z','#d6def0',R*0.05);
    k.fill('E 0.12 -0.6 0.07 0.09 E 0.32 -0.6 0.07 0.09','#0c0f1c',0);
    k.fill('M 0.14 -0.44 Q 0.22 -0.38 0.3 -0.44 L 0.26 -0.36 Q 0.22 -0.34 0.18 -0.36 Z','#0c0f1c',0);
    k.glow(0.12,-0.6,0.04,'#9adcff','#ffffff'); k.glow(0.32,-0.6,0.04,'#9adcff','#ffffff');
  } else if(T==='stalker'){ // SPIDER-BLADE — seen from above: four steel-tipped legs a side in an alternating gait, a cluster of yellow eyes
    const KX=[0.62,0.22,-0.22,-0.6], FX=[1.02,0.4,-0.4,-1.0], HX=[0.26,0.14,0.0,-0.14];
    const legs=(sd)=>{ for(let i=0;i<4;i++){ const grp=(i%2)^(sd>0?1:0), sw2=(grp?s:-s)*0.13, up=grp?Math.max(0,c):Math.max(0,-c);
        const kx=KX[i]+sw2*0.5, ky=sd*(0.56+up*0.06), fx=FX[i]+sw2, fy=sd*(0.9-up*0.12);
        k.limb(`M ${F(HX[i])} ${F(sd*0.12)} L ${F(kx)} ${F(ky)} L ${F(fx)} ${F(fy)}`,0.085,sd<0?'#2a0c20':dark);
        k.fill(`M ${F(fx)} ${F(fy)} L ${F(fx+(fx>0?0.12:-0.12))} ${F(fy+sd*0.1)} L ${F(fx+(fx>0?0.02:-0.02))} ${F(fy-sd*0.06)} Z`,'#d8dce6',R*0.04); } };
    legs(-1); legs(1);
    k.fill('E -0.36 0.0 0.5 0.4',k.vg(-0.4,0.4,0,col,0.6,dark,1,'#14040e'));
    k.line('M -0.7 0 L -0.12 0 M -0.58 -0.16 L -0.46 0 L -0.58 0.16 M -0.36 -0.2 L -0.24 0 L -0.36 0.2','rgba(255,200,230,0.4)',0.045);
    k.fill('E 0.22 0.0 0.3 0.26',k.vg(-0.26,0.26,0,col,1,dark));
    k.fill('E 0.56 0.0 0.2 0.18',dark);
    k.fill('M 0.72 -0.08 L 0.92 -0.14 L 0.78 0.0 Z M 0.72 0.08 L 0.92 0.14 L 0.78 0.0 Z','#d8dce6',R*0.04);
    k.glow(0.62,-0.08,0.05,'#ffdf5a','#fffbe0'); k.glow(0.62,0.08,0.05,'#ffdf5a','#fffbe0'); k.glow(0.52,-0.1,0.035,'#ffdf5a'); k.glow(0.52,0.1,0.035,'#ffdf5a');
    k.sheen('E -0.36 0.0 0.5 0.4',0.12); k.sheen('E 0.22 0.0 0.3 0.26',0.12);
  } else if(T==='hexer'){ // WARLOCK — a needle-tall hood, acid runes stitched down the robe, a face that is only one eye
    const hm=0.07*s;
    k.fill(`M 0.08 -1.16 Q 0.56 -0.62 0.52 0.1 Q 0.6 0.62 ${F(0.48+hm)} 0.92 L ${F(0.3+hm)} 0.8 L ${F(0.14+hm)} 0.96 L ${F(-0.02+hm)} 0.8 L ${F(-0.18+hm)} 0.96 L ${F(-0.34+hm)} 0.8 L ${F(-0.5+hm)} 0.92 Q -0.6 0.62 -0.5 0.1 Q -0.5 -0.5 0.08 -1.16 Z`,k.vg(-1.16,0.96,0,col,0.5,dark,1,'#0c0616'));
    k.line(`M 0.02 -0.3 L ${F(0.0+hm*0.5)} 0.86`,'rgba(201,255,122,0.35)',0.12); k.line(`M 0.02 -0.3 L ${F(0.0+hm*0.5)} 0.86`,'#c9ff7a',0.035);
    for(let i=0;i<4;i++) k.glow(0.01+hm*0.12*i,-0.12+i*0.24,0.04,'#c9ff7a','#f4ffe0');
    k.fill('M -0.1 -0.42 Q 0.1 -0.9 0.36 -0.42 Q 0.3 -0.26 0.13 -0.24 Q -0.06 -0.26 -0.1 -0.42 Z','#040208',R*0.05);
    k.glow(0.14,-0.42,0.07,'#c9ff7a','#ffffff');
    for(const sd of [-1,1]){ const hx=sd*0.62+0.06, hy=-0.32+0.04*s*sd;
      k.limb(`M ${F(sd*0.36)} -0.04 Q ${F(sd*0.6)} 0.0 ${F(hx)} ${F(hy)}`,0.13,dark);
      k.fill(`E ${F(hx)} ${F(hy-0.04)} 0.09 0.1`,'#cfc8b8',R*0.05); }
    k.sheen(`M 0.08 -1.16 Q 0.56 -0.62 0.52 0.1 L -0.5 0.1 Q -0.5 -0.5 0.08 -1.16 Z`,0.12);
  } else if(T==='brute'){ // CHAINED OGRE — a humped wall of meat, a sunk head, fists like anvils and the broken chain
    const sh=0.06*s;
    k.limb(`M -0.36 0.5 L ${F(-0.42-0.08*s)} ${F(0.92-Math.max(0,s)*0.08)}`,0.3,'#24080c');
    k.limb(`M 0.3 0.5 L ${F(0.38+0.08*s)} ${F(0.92-Math.max(0,-s)*0.08)}`,0.3,'#2e0a10');
    k.limb(`M -0.6 -0.2 Q -0.98 ${F(0.1-sh)} ${F(-0.9-0.08*s)} ${F(0.48-sh)}`,0.32,dark);
    k.fill(`E ${F(-0.92-0.08*s)} ${F(0.56-sh)} 0.27 0.25`,k.vg(0.3,0.8,0,col,1,dark));
    k.fill(`M -0.9 0.6 Q -1.02 -0.38 -0.34 ${F(-0.62+sh)} Q -0.1 -0.96 0.18 -0.9 Q 0.5 -0.8 0.62 ${F(-0.5-sh)} Q 1.04 -0.3 0.94 0.6 Q 0.0 0.98 -0.9 0.6 Z`,k.vg(-0.95,0.9,0,col,0.55,dark,1,'#1a0406'));
    k.fill('E 0.08 0.28 0.52 0.36',k.vg(-0.1,0.64,0,'rgba(200,90,90,0.55)',1,'rgba(60,10,14,0)'),0);
    k.line('M -0.82 -0.24 Q -0.1 0.36 0.86 -0.12','#121014',0.16);
    for(let i=0;i<7;i++){ const t9=i/6, x=-0.82+1.68*t9, y=-0.24+Math.sin(t9*3.14)*0.42-0.0+t9*0.12; k.fill(`E ${F(x)} ${F(y)} 0.075 0.055`,'#7a7484',R*0.04); }
    k.line('M -0.3 -0.46 L -0.08 -0.12 M 0.4 -0.4 L 0.18 -0.06','rgba(255,150,150,0.4)',0.035);
    k.fill('M 0.18 -0.86 Q 0.42 -0.94 0.6 -0.74 Q 0.66 -0.52 0.46 -0.46 Q 0.24 -0.44 0.16 -0.6 Z',dark,R*0.06);
    k.fill('M 0.3 -0.52 L 0.26 -0.72 L 0.36 -0.56 Z M 0.52 -0.5 L 0.56 -0.7 L 0.46 -0.54 Z',bone,R*0.03);
    k.glow(0.3,-0.66,0.05,'#ff4d4d','#ffd0c0'); k.glow(0.5,-0.64,0.05,'#ff4d4d','#ffd0c0');
    k.limb(`M 0.6 -0.2 Q 1.0 ${F(0.1+sh)} ${F(0.92+0.08*s)} ${F(0.48+sh)}`,0.32,col);
    k.fill(`E ${F(0.94+0.08*s)} ${F(0.56+sh)} 0.28 0.26`,k.vg(0.3,0.82,0,col,1,dark));
    k.line(`M ${F(0.7+0.08*s)} ${F(0.42+sh)} Q ${F(0.94+0.08*s)} ${F(0.3+sh)} ${F(1.18+0.08*s)} ${F(0.44+sh)}`,'#5a5464',0.09);
    k.limb(`M ${F(0.94+0.08*s)} ${F(0.8+sh)} L ${F(0.98+0.12*c)} ${F(1.02+sh)}`,0.04,'#7a7484');
    k.sheen(`M -0.9 0.6 Q -1.02 -0.38 -0.34 -0.62 Q -0.1 -0.96 0.18 -0.9 Q 0.5 -0.8 0.62 -0.5 Q 1.04 -0.3 0.94 0.6 Z`,0.1);
  } else if(T==='revenant'){ // DREAD KNIGHT — crimson plate, a sword over the shoulder, a tower shield, a visor of embers
    const st=0.05*s;
    k.limb(`M -0.2 0.5 L ${F(-0.24-0.1*s)} ${F(0.96-Math.max(0,s)*0.08)}`,0.2,'#14080a');
    k.limb(`M 0.22 0.5 L ${F(0.26+0.1*s)} ${F(0.96-Math.max(0,-s)*0.08)}`,0.2,'#1e0c0e');
    k.limb('M -0.3 -0.3 L -0.86 -1.06',0.12,'#8a8f9a'); k.line('M -0.34 -0.36 L -0.84 -1.0','rgba(255,255,255,0.6)',0.03);
    k.fill('M -0.42 -0.2 L -0.18 -0.44 L -0.12 -0.38 L -0.36 -0.14 Z','#3a2e2a',R*0.05);
    k.fill(`M 0 ${F(-1.1+st)} Q 0.3 -1.28 0.28 -0.86 Q 0.12 -0.98 0 ${F(-1.1+st)} Z`,'#c8102e',R*0.05);
    k.fill(`M -0.56 -0.46 Q 0 -0.66 0.56 -0.46 Q 0.66 0.2 0.44 0.58 L -0.44 0.58 Q -0.66 0.2 -0.56 -0.46 Z`,k.vg(-0.6,0.6,0,col,0.5,dark,1,'#0a0304'));
    k.line('M 0 -0.5 L 0 0.5','rgba(255,220,220,0.18)',0.05);
    for(const sd of [-1,1]) k.fill(`E ${F(sd*0.56)} -0.44 0.3 0.24`,k.vg(-0.68,-0.2,0,'#7a2a30',1,dark));
    k.fill('M -0.32 -0.62 Q -0.34 -1.02 0.08 -1.04 Q 0.48 -1.02 0.46 -0.62 Q 0.42 -0.48 0.06 -0.48 Q -0.3 -0.48 -0.32 -0.62 Z',k.vg(-1.04,-0.48,0,'#5a4a50',1,'#120608'));
    k.fill('M -0.16 -0.86 L 0.4 -0.86 L 0.38 -0.79 L -0.14 -0.79 Z','#ff3c3c',0); k.glow(0.12,-0.83,0.05,'#ff4040','#ffe0d0');
    k.fill(`M 0.56 ${F(-0.48+st)} L 1.0 ${F(-0.36+st)} L 1.0 ${F(0.46+st)} L 0.78 ${F(0.82+st)} L 0.56 ${F(0.46+st)} Z`,k.vg(-0.5,0.8,0,'#3a3236',1,'#0e0a0c'));
    k.line(`M 0.78 ${F(-0.3+st)} L 0.78 ${F(0.56+st)} M 0.62 ${F(-0.02+st)} L 0.94 ${F(-0.02+st)}`,bone2,0.05);
    k.sheen('M -0.56 -0.46 Q 0 -0.66 0.56 -0.46 Q 0.66 0.2 0.44 0.58 L -0.44 0.58 Q -0.66 0.2 -0.56 -0.46 Z',0.14);
  } else if(T==='elite'){ // THE MARQUIS — porcelain mask, a violet cape spread like a bat's, a collar of knives
    const fl=[0,0.06,0,-0.06][f];
    let hem=''; for(let i=1;i<6;i++){ const x=-1.12+i*0.373, y=0.82+((i%2)?-0.12:0.04)+Math.sin(i*1.3+f*1.57)*0.06; hem+=` L ${F(x)} ${F(y)}`; }
    k.fill(`M -0.2 -0.56 Q -0.86 ${F(-0.5+fl)} -1.16 0.0 L -1.12 0.82${hem} L 1.12 0.82 L 1.16 0.0 Q 0.86 ${F(-0.5-fl)} 0.2 -0.56 Z`,k.vg(-0.6,0.9,0,col,0.4,dark,1,'#12061e'));
    k.line(`M -0.6 -0.2 L ${F(-0.74+fl)} 0.7 M 0.6 -0.2 L ${F(0.74-fl)} 0.7 M -0.2 -0.3 L -0.26 0.76 M 0.2 -0.3 L 0.26 0.76`,'rgba(30,8,44,0.6)',0.05);
    k.fill('M -0.3 -0.5 Q 0 -0.6 0.3 -0.5 L 0.24 0.7 L -0.24 0.7 Z',k.vg(-0.6,0.7,0,'#2a1438',1,'#0c0412'));
    k.line('M 0 -0.46 L 0 0.66','rgba(201,139,255,0.7)',0.04);
    k.fill('M -0.42 -0.44 L -0.28 -0.82 L -0.1 -0.5 L 0 -0.86 L 0.1 -0.5 L 0.28 -0.82 L 0.42 -0.44 Z','#1e0c2a',R*0.05);
    k.fill('M -0.04 -0.72 Q -0.06 -1.02 0.16 -1.02 Q 0.4 -1.0 0.38 -0.72 Q 0.36 -0.5 0.16 -0.46 Q -0.02 -0.5 -0.04 -0.72 Z',k.vg(-1.02,-0.46,0,'#ffffff',1,'#cfc6dc'),R*0.05);
    k.fill('M 0.0 -0.74 L 0.12 -0.7 L 0.0 -0.68 Z M 0.32 -0.74 L 0.2 -0.7 L 0.32 -0.68 Z','#3a1a52',0);
    k.line('M 0.07 -0.66 L 0.06 -0.54','#8b1620',0.025);
    k.fill('M 0.1 -0.56 Q 0.16 -0.52 0.22 -0.56 Q 0.16 -0.5 0.1 -0.56 Z','#3a1a52',0);
    k.sheen(`M -1.16 0.0 Q -0.86 -0.5 -0.2 -0.56 L 0.2 -0.56 Q 0.86 -0.5 1.16 0.0 L 1.12 0.4 L -1.12 0.4 Z`,0.12);
  } else if(T==='gilded'){ // THE GILDED SOUL — a gold-leafed gambler sprinting off with the House's sack
    const legs=(sg,sh)=>{ const ss=s*sg, up=Math.max(0,-c*sg)*0.16; k.limb(`M 0 0.3 L ${F(0.3*ss+0.04)} 0.62 L ${F(0.4*ss-0.08)} ${F(0.98-up)}`,0.14,sh); };
    legs(-1,'#6a4a14');
    k.fill('E -0.42 -0.42 0.42 0.4',k.rg(-0.55,-0.6,0.05,0.5,0,'#e8c46a',1,'#6a4a14'));
    k.line('M -0.62 -0.74 Q -0.42 -0.62 -0.24 -0.76','#3a2808',0.06);
    k.fill('M -0.22 -0.5 Q 0.08 -0.68 0.32 -0.5 Q 0.36 0.0 0.22 0.36 L -0.18 0.36 Q -0.3 0.0 -0.22 -0.5 Z',k.vg(-0.6,0.4,0,'#fff2c0',0.35,col,1,dark));
    legs(1,'#a07a2a');
    k.limb(`M 0.12 -0.36 L ${F(0.36+0.24*s)} -0.06 L ${F(0.58+0.28*s)} 0.08`,0.1,col);
    k.limb('M -0.1 -0.42 L -0.3 -0.6',0.1,col);
    k.fill('E 0.28 -0.7 0.24 0.22',k.vg(-0.92,-0.48,0,'#fff2c0',1,col));
    k.fill('M 0.06 -0.8 L 0.52 -0.8 L 0.46 -0.98 L 0.12 -0.98 Z M -0.04 -0.8 L 0.62 -0.8','#2a1a06',R*0.05);
    for(let i=0;i<3;i++) k.glow(-0.62+i*0.2,-0.12-((i+f)%3)*0.08,0.04,'#ffd36b','#fff6d0');
    k.sheen('M -0.22 -0.5 Q 0.08 -0.68 0.32 -0.5 Q 0.36 0.0 0.22 0.36 L -0.18 0.36 Q -0.3 0.0 -0.22 -0.5 Z',0.22);
  } else return false;
  return true;
}
// one baked frame per (type, frame, mode, palette). modes: b body · k flat ink · i dilated ink plate · w white flash
// · d wound shade · h bomber heat · r rim (warm) · g<col> glow aura
function courtBake(T,f,mode,col,dark){
  const key=T+'|'+f+'|'+mode+'|'+col+'|'+dark; let cv=_CT.get(key); if(cv) return cv;
  if(_CT.size>520){ let n=0; for(const kk of _CT.keys()){ _CT.delete(kk); if(++n>=130) break; } } // evict the oldest quarter, never a wipe
  const R=26*(COURT_K[T]||1), S=Math.ceil(R*4.3/2)*2;
  cv=document.createElement('canvas'); cv.width=cv.height=S; const g=cv.getContext('2d');
  if(mode==='b'){ g.translate(S/2,S/2); _courtArt(g,T,R,f,col,dark); }
  else if(mode==='i'){ const w=courtBake(T,f,'k',col,dark), d=R*0.11; g.shadowColor='rgba(0,0,0,0.85)'; g.shadowBlur=R*0.16; // bake-time blur only
    for(let a=0;a<8;a++) g.drawImage(w,Math.cos(a*0.785)*d,Math.sin(a*0.785)*d); }
  else if(mode[0]==='g'){ const c=mode.slice(1), t=document.createElement('canvas'); t.width=t.height=S; const tg=t.getContext('2d');
    tg.drawImage(courtBake(T,f,'b',col,dark),0,0); tg.globalCompositeOperation='source-in'; tg.fillStyle=c; tg.fillRect(0,0,S,S);
    g.shadowColor=c; g.shadowBlur=R*0.4; g.drawImage(t,0,0); g.drawImage(t,0,0); }
  else { g.drawImage(courtBake(T,f,'b',col,dark),0,0); g.globalCompositeOperation='source-in';
    g.fillStyle=({w:'#ffffff',k:'rgba(4,1,3,0.9)',d:'#160408',h:'#ff7a1c',r:'#ffdcae'})[mode]||'#fff'; g.fillRect(0,0,S,S); }
  _CT.set(key,cv); return cv;
}
function _courtMotion(T,cph,e,r){ // continuous motion between the baked frames: bob, squash, lean
  const m=_courtM; m.bob=0; m.sx=1; m.sy=1; m.rot=0; const sn=Math.sin(cph), ab=Math.abs(sn);
  if(T==='wraith'||T==='hexer'){ m.bob=Math.sin(gt*2.1+e.ph)*r*0.13-r*0.1; m.rot=Math.sin(gt*1.3+e.ph)*0.04; }
  else if(T==='swarm'){ m.bob=Math.sin(cph)*r*0.12-r*0.25; }
  else if(T==='brute'||T==='revenant'){ const c0=Math.abs(Math.cos(cph)); m.sy=1-0.035*c0; m.sx=1+0.025*c0; m.bob=-ab*r*0.03; }
  else if(T==='leech'){ m.sx=1+0.06*sn; m.sy=1-0.05*sn; }
  else if(T==='bomber'){ m.bob=-ab*r*0.08; m.rot=Math.sin(cph)*0.05; }
  else if(T==='husk'||T==='gilded'||T==='stalker'){ m.bob=-ab*r*0.06; }
  else if(T==='elite'){ m.bob=Math.sin(gt*1.6+e.ph)*r*0.03; }
  else { m.bob=-ab*r*0.05; m.rot=Math.sin(cph*0.5)*0.05; } // the shamble: a lurch and a list
  return m;
}
const _courtM={bob:0,sx:1,sy:1,rot:0};
function courtDraw(e){
  const T=e.type, vs=COURT_VS[T]; if(!vs) return false; // a type the court doesn't know (a later wave's) keeps the old painter
  const r=e.r, R=26*(COURT_K[T]||1), u=r*vs/R*R; // u = world px per art unit
  const dxp=P.x-e.x; if(!e._fx) e._fx=dxp<0?-1:1; else if(dxp>16) e._fx=1; else if(dxp<-16) e._fx=-1; // faces her, with a dead zone
  const ph=gt*COURT_FPS[T]+e.ph*0.637, fr=(ph|0)&3, m=_courtMotion(T,ph*1.5708,e,r);
  const b=courtBake(T,fr,'b',e.col,e.dark), hw=b.width*u/R/2, fx=e._fx;
  ctx.save(); ctx.translate(e.x,e.y);
  const fly=(T==='wraith'||T==='hexer'||T==='swarm');
  ctx.fillStyle=fly?'rgba(0,0,0,0.22)':'rgba(0,0,0,0.36)'; ctx.beginPath(); ctx.ellipse(0,r*0.78*vs,r*(fly?0.55:0.84)*vs,r*0.26*vs,0,0,6.283); ctx.fill();
  if(e.flash>0){ const sq=Math.min(0.16,e.flash*1.4); ctx.scale(1+sq,1-sq); }
  if(e._lod){ // the far court: the very same frame, one blit
    ctx.translate(0,m.bob); ctx.scale(fx*m.sx,m.sy); ctx.drawImage(b,-hw,-hw,hw*2,hw*2);
    if(e.flash>0){ ctx.globalAlpha=Math.min(0.95,e.flash*8); ctx.drawImage(courtBake(T,fr,'w',e.col,e.dark),-hw,-hw,hw*2,hw*2); }
    ctx.restore(); return true;
  }
  { const bs9=Math.min(1,(gt-(e.born||gt-1))/0.22); if(bs9<1){ ctx.scale(bs9,bs9); ctx.globalAlpha=bs9; } }
  const ga=ctx.globalAlpha, lite=GFX.lite, d2=dxp*dxp+(P.y-e.y)*(P.y-e.y);
  if(e.elite&&!qLow){ const gr9=r*1.7; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*0.42;
    ctx.drawImage(glowSprite(e.col,'rgba(0,0,0,0)',48), -gr9, -gr9*0.82, gr9*2, gr9*2*0.82); ctx.restore(); }
  // the bomber's blast radius whispers when she stands inside it
  if(T==='bomber' && d2<170*170){ const kk=Math.min(1,(170-Math.sqrt(d2))/90); ctx.save(); ctx.globalAlpha=ga*kk*(0.35+0.25*Math.sin(gt*14));
    ctx.strokeStyle='#ff8a2c'; ctx.lineWidth=2; if(!window._dense) ctx.setLineDash([7,6]); ctx.beginPath(); ctx.arc(0,0,74,0,6.283); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  ctx.translate(0,m.bob); if(m.rot) ctx.rotate(m.rot*fx); ctx.scale(fx*m.sx,m.sy);
  if(e.elite && !lite){ const pu=1.14+Math.sin(gt*5+e.ph)*0.05; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*0.7;
    ctx.drawImage(courtBake(T,fr,'g#c98bff',e.col,e.dark),-hw*pu,-hw*pu,hw*2*pu,hw*2*pu); ctx.restore(); }
  ctx.drawImage(courtBake(T,fr,'i',e.col,e.dark),-hw,-hw,hw*2,hw*2);
  // rim light in the body's own shape: a warm copy nudged toward her candle, the body laid over it
  if(!qLow){ const pa=Math.atan2(P.y-e.y,dxp), o=Math.max(1.2,r*0.1); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*(e.elite?0.7:0.55);
    ctx.drawImage(courtBake(T,fr,'r',e.col,e.dark),-hw+Math.cos(pa)*o*fx,-hw+Math.sin(pa)*o,hw*2,hw*2); ctx.restore(); }
  if(T==='wraith'){ ctx.globalAlpha=ga*(0.82+Math.sin(gt*3.1+e.ph)*0.08); }
  ctx.drawImage(b,-hw,-hw,hw*2,hw*2); ctx.globalAlpha=ga;
  // ——— live telegraphs: only what must track the world ———
  if(T==='bomber'){ const fl=Math.random(), tx=(0.34+0.05*Math.cos(fr*1.5708))*u, ty=-0.98*u; // the fuse burns
    const near=d2<170*170?Math.min(1,(170-Math.sqrt(d2))/90):0;
    if(near>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*near*(0.3+0.3*Math.sin(gt*20)); ctx.drawImage(courtBake(T,fr,'h',e.col,e.dark),-hw,-hw,hw*2,hw*2); ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*(0.7+fl*0.3); const fs=u*(0.36+fl*0.18+near*0.25);
    ctx.drawImage(glowSprite('rgba(255,230,150,1)','rgba(255,120,30,0)',16),tx-fs,ty-fs,fs*2,fs*2); ctx.restore();
    if(!window._dense && fl<0.18) parts.push({x:e.x+tx*fx,y:e.y+m.bob+ty,vx:rnd(-30,30),vy:rnd(-60,-20),life:rnd(.15,.3),col:'#ffd27a',r:rnd(0.8,1.6)}); }
  else if(T==='husk'){ if(!window._dense && Math.random()<0.12) parts.push({x:e.x+rnd(-r*0.4,r*0.4),y:e.y-r*0.4,vx:rnd(-6,6),vy:-rnd(20,44),life:rnd(.3,.6),col:'#ff9a4c',r:rnd(1,2)}); }
  else if(T==='leech'){ const v=e.v1===undefined?1:e.v1; if(v<0.3 && !lite){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*(1-v/0.3)*0.8; const gr9=u*1.1;
      ctx.drawImage(glowSprite('rgba(157,255,106,0.7)','rgba(80,200,90,0)',24),-gr9,-gr9*0.7,gr9*2,gr9*1.4); ctx.restore(); } }
  else if(T==='gilded'){ ctx.save(); ctx.globalCompositeOperation='lighter'; const gl3=((gt*1.6+e.ph)%2)-1;
    ctx.strokeStyle='rgba(255,240,190,0.45)'; ctx.lineWidth=u*0.22; ctx.beginPath(); ctx.moveTo(gl3*u-u*0.4,-u*0.9); ctx.lineTo(gl3*u+u*0.1,u*0.8); ctx.stroke(); ctx.restore(); }
  // eyes glow and drift toward her
  if(!lite){ const ey=COURT_EYE[T], ec=COURT_EC[T]; if(ey){ const es=Math.max(4,r*0.55*vs), sp9=glowSprite('rgba('+ec+',0.95)','rgba('+ec+',0)',8), dl=Math.sqrt(d2)||1;
      const ox=(dxp/dl)*u*0.04*fx, oy=((P.y-e.y)/dl)*u*0.04; ctx.save(); ctx.globalCompositeOperation='lighter';
      for(const p9 of ey) ctx.drawImage(sp9,p9[0]*u+ox-es/2,p9[1]*u+oy-es/2,es,es); ctx.restore(); } }
  { const wnd=1-(e.hp/Math.max(1,e.maxhp)); if(wnd>0.25){ ctx.globalAlpha=ga*Math.min(0.42,(wnd-0.25)*0.7); ctx.drawImage(courtBake(T,fr,'d',e.col,e.dark),-hw,-hw,hw*2,hw*2); ctx.globalAlpha=ga; } }
  if(e.flash>0){ ctx.globalAlpha=Math.min(0.92,e.flash*8); ctx.drawImage(courtBake(T,fr,'w',e.col,e.dark),-hw,-hw,hw*2,hw*2); ctx.globalAlpha=ga; }
  ctx.scale(fx/m.sx,1/m.sy); // back to world-facing for the archer's aim, the warlock's orb and the crown
  if(T==='shooter'||T==='hexer') _courtCaster(e,T,u,fx,ga);
  if(e.elite){ _courtCrown(e,u,ga); }
  ctx.restore(); return true;
}
function _courtCaster(e,T,u,fx,ga){
  const cd=e.shootCd===undefined?1:e.shootCd, wu=cd<0.6&&cd>0?1-cd/0.6:0;
  if(T==='shooter'){ // the bone bow aims at her; the string draws back as the shot winds up, the arrowhead kindles
    const aa=Math.atan2(P.y-e.y,P.x-e.x), pull=0.12+wu*0.3;
    ctx.save(); ctx.translate(0.12*u*fx,-0.2*u); ctx.rotate(aa);
    const bx=0.42*u, ty=0.56*u;
    ctx.lineCap='round'; ctx.strokeStyle='#07030a'; ctx.lineWidth=Math.max(2.6,u*0.13);
    ctx.beginPath(); ctx.moveTo(bx-0.12*u,-ty); ctx.quadraticCurveTo(bx+0.36*u,0,bx-0.12*u,ty); ctx.stroke();
    ctx.strokeStyle='#e6dccb'; ctx.lineWidth=Math.max(1.4,u*0.07); ctx.stroke();
    ctx.strokeStyle='rgba(230,220,203,0.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx-0.12*u,-ty); ctx.lineTo(bx-pull*u,0); ctx.lineTo(bx-0.12*u,ty); ctx.stroke();
    ctx.strokeStyle='#cdbfa5'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(bx-pull*u,0); ctx.lineTo(bx+0.5*u,0); ctx.stroke();
    ctx.fillStyle='#ffce5a'; ctx.beginPath(); ctx.moveTo(bx+0.66*u,0); ctx.lineTo(bx+0.48*u,-0.08*u); ctx.lineTo(bx+0.48*u,0.08*u); ctx.closePath(); ctx.fill();
    if(wu>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*wu*0.9; const gs=u*(0.3+wu*0.5);
      ctx.drawImage(glowSprite('rgba(255,210,110,1)','rgba(255,150,60,0)',16),bx+0.58*u-gs,-gs,gs*2,gs*2); }
    ctx.restore(); return; }
  // hexer: a rune circle turns under it and the orb swells between its raised hands
  const ch=Math.max(0,Math.min(1,1-cd/2.4)), hov=Math.sin(gt*2.1+e.ph)*e.r*0.13-e.r*0.1;
  if(!window._dense && !GFX.lite){ ctx.save(); ctx.translate(0,-hov+u*0.82); ctx.scale(1,0.4); ctx.rotate(gt*1.1); ctx.strokeStyle='rgba(201,255,122,'+(0.18+ch*0.35)+')'; ctx.lineWidth=1.6; ctx.setLineDash([5,6]);
    ctx.beginPath(); ctx.arc(0,0,u*0.95,0,6.28); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  const oy=-0.9*u-ch*u*0.2, or9=u*(0.2+ch*0.32);
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=ga*Math.min(1,0.45+ch*0.55+wu*0.4);
  ctx.drawImage(glowSprite('rgba(220,255,160,1)','rgba(160,255,100,0)',16),0.06*u*fx-or9,oy-or9,or9*2,or9*2); ctx.restore();
  ctx.fillStyle='#f4ffd8'; ctx.beginPath(); ctx.arc(0.06*u*fx,oy,u*(0.07+ch*0.05),0,6.28); ctx.fill();
}
function _courtCrown(e,u,ga){ // the court's royalty: motes, a crown, the purse they carry as an HP bar
  if(!GFX.lite){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let m5=0;m5<3;m5++){ const ma=gt*1.6+e.ph+m5*2.09; ctx.fillStyle='rgba(255,220,120,'+(0.4+Math.sin(gt*5+m5)*0.3)+')';
      ctx.beginPath(); ctx.arc(Math.cos(ma)*u*1.2,-u*0.2+Math.sin(ma)*u*0.55,1.8,0,6.28); ctx.fill(); } ctx.restore(); }
  const cx=0.16*u*(e._fx||1), cy=-1.04*u, w=0.34*u;
  ctx.fillStyle='#07030a'; ctx.beginPath(); ctx.moveTo(cx-w-1.5,cy+1.5); ctx.lineTo(cx-w*0.5,cy-w*0.9-1.5); ctx.lineTo(cx,cy-w*0.3); ctx.lineTo(cx+w*0.5,cy-w*0.9-1.5); ctx.lineTo(cx+w+1.5,cy+1.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#e8b64c'; ctx.beginPath(); ctx.moveTo(cx-w,cy); ctx.lineTo(cx-w*0.5,cy-w*0.9); ctx.lineTo(cx,cy-w*0.3); ctx.lineTo(cx+w*0.5,cy-w*0.9); ctx.lineTo(cx+w,cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#c8102e'; ctx.beginPath(); ctx.arc(cx-w*0.5,cy-w*0.7,w*0.13,0,6.28); ctx.arc(cx+w*0.5,cy-w*0.7,w*0.13,0,6.28); ctx.fill();
  const r=e.r; ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(-r,u*1.02,r*2,4);
  ctx.fillStyle='#c98bff'; ctx.fillRect(-r,u*1.02,r*2*Math.max(0,e.hp/e.maxhp),4);
  if(e.unkillable){ ctx.fillStyle='#ffd36b'; ctx.font='700 10px serif'; ctx.textAlign='center'; ctx.fillText('∞',0,u*1.0); }
}
/* ---- E1: the court dies by family — flesh BURSTS, bone and plate CRUMBLE, spirits DISSOLVE into smoke, the keg goes up ---- */
let corpses=[]; const _cdT={};
function courtDeath(e){
  if(e.boss || !COURT_VS[e.type] || !P) return;
  const fam=e.type==='bomber'?'blast':(COURT_FAM[e.type]||'burst'), lite=GFX.lite;
  if(Math.abs(e.x-P.x)<VW/2+80 && Math.abs(e.y-P.y)<VH/2+80){
    if(corpses.length>=(lite?10:44)) corpses.shift();
    const ph=gt*COURT_FPS[e.type]+e.ph*0.637;
    corpses.push({T:e.type,f:(ph|0)&3,x:e.x,y:e.y,r:e.r,col:e.col,dark:e.dark,fx:e._fx||1,t0:gt,fam,elite:!!e.elite,
      max:fam==='dissolve'?(e.elite?0.9:0.7):fam==='crumble'?0.62:fam==='blast'?0.45:0.26}); }
  const n=lite?2:(e.elite?14:6), dense=window._dense;
  if(fam==='burst'){ for(let i=0;i<(dense?n>>1:n);i++){ const a=Math.random()*6.283, sp=rnd(70,210);
      parts.push({x:e.x,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-30,life:rnd(.25,.5),col:i%3?'#5a0a12':e.col,r:rnd(1.6,3.2)}); } }
  else if(fam==='crumble'){ const chip=e.type==='gilded'?'#ffd36b':(e.type==='husk'?'#ff9a4c':'#d8ccb8');
    for(let i=0;i<(dense?n>>1:n);i++){ const a=-Math.PI*Math.random(), sp=rnd(30,120);
      parts.push({x:e.x+rnd(-e.r*0.5,e.r*0.5),y:e.y+rnd(-e.r*0.6,e.r*0.2),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.6+40,life:rnd(.35,.7),col:i%2?chip:e.dark,r:rnd(1.2,2.6)}); } }
  else if(fam==='dissolve'){ for(let i=0;i<(dense?2:4);i++) parts.push({x:e.x+rnd(-e.r*0.5,e.r*0.5),y:e.y-rnd(0,e.r),vx:rnd(-12,12),vy:-rnd(30,70),life:rnd(.6,1.1),col:e.elite?'rgba(201,139,255,0.5)':'rgba(150,140,220,0.45)',r:rnd(3,6),ash:true}); }
  // each family has its own small voice, soft and throttled so a nova massacre stays a chord, not a wall
  if(muted || (gt-(_cdT[fam]||-1))<0.07 && gt>=(_cdT[fam]||0)) return; _cdT[fam]=gt;
  if(fam==='burst'){ noise(0.07,0.06,520); tone(120+Math.random()*30,0.09,'sine',0.06,55); }
  else if(fam==='crumble'){ noise(0.05,0.05,3600); tone(760+Math.random()*200,0.04,'triangle',0.035,420); setTimeout(()=>{ noise(0.04,0.04,2600); tone(520,0.04,'triangle',0.03,300); },45); }
  else if(fam==='dissolve'){ tone(660,0.32,'sine',0.045,170); noise(0.22,0.035,1900); }
  else { tone(58,0.4,'sine',0.09,30); }
}
function drawCorpses(){
  if(!corpses.length) return;
  for(let i=corpses.length-1;i>=0;i--){ const c=corpses[i], t=gt-c.t0; if(t>=c.max||t<0){ corpses.splice(i,1); continue; }
    if(Math.abs(c.x-P.x)>VW/2+120 || Math.abs(c.y-P.y)>VH/2+120) continue;
    const k=t/c.max, vs=COURT_VS[c.T], R=26*(COURT_K[c.T]||1), u=c.r*vs, b=courtBake(c.T,c.f,'b',c.col,c.dark), hw=b.width*u/R/2, S=b.width;
    ctx.save(); ctx.translate(c.x,c.y);
    if(c.fam==='burst'){ // swells white-hot and pops
      const sc=1+k*0.5; ctx.scale(c.fx*sc,sc*(1-k*0.15)); ctx.globalAlpha=1-k; ctx.drawImage(b,-hw,-hw,hw*2,hw*2);
      ctx.globalAlpha=(1-k)*0.95; ctx.drawImage(courtBake(c.T,c.f,'w',c.col,c.dark),-hw,-hw,hw*2,hw*2); }
    else if(c.fam==='blast'){ // the keg: a fireball, a smoke ring, the shell flying apart
      ctx.save(); ctx.globalCompositeOperation='lighter'; const fr=74*(0.35+0.65*Math.sqrt(k)); ctx.globalAlpha=(1-k)*0.9;
      ctx.drawImage(glowSprite('rgba(255,236,170,1)','rgba(255,110,30,0)',48),-fr,-fr,fr*2,fr*2); ctx.restore();
      ctx.globalAlpha=(1-k)*0.5; ctx.strokeStyle='#2a1a14'; ctx.lineWidth=10*(1-k)+2; ctx.beginPath(); ctx.arc(0,0,74*(0.4+0.6*k),0,6.283); ctx.stroke();
      if(k<0.5){ ctx.globalAlpha=1-k*2; ctx.scale(c.fx*(1+k),1+k); ctx.drawImage(courtBake(c.T,c.f,'h',c.col,c.dark),-hw,-hw,hw*2,hw*2); } }
    else if(c.fam==='crumble'){ // breaks into three slabs that slump and fall away, darkening to ash
      ctx.scale(c.fx,1); const sl=S/3, wh=hw*2/3;
      for(let j=0;j<3;j++){ const drop=k*k*u*(0.5+j*0.35)+k*u*0.15*(2-j), sx=(j-1)*k*u*0.22, rt=(j-1)*k*0.35;
        ctx.save(); ctx.translate(sx,drop); ctx.rotate(rt); ctx.globalAlpha=Math.max(0,1-k*k);
        ctx.drawImage(b,0,j*sl,S,sl,-hw,-hw+j*wh,hw*2,wh);
        ctx.globalAlpha=Math.max(0,1-k*k)*Math.min(0.85,k*1.4); ctx.drawImage(courtBake(c.T,c.f,'d',c.col,c.dark),0,j*sl,S,sl,-hw,-hw+j*wh,hw*2,wh); ctx.restore(); } }
    else { // dissolve: rises, thins and stretches into smoke
      ctx.translate(0,-k*u*1.1); ctx.scale(c.fx*(1-k*0.45),1+k*0.6); ctx.globalAlpha=(1-k)*0.85; ctx.drawImage(b,-hw,-hw,hw*2,hw*2);
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=(1-k)*0.45; ctx.drawImage(courtBake(c.T,c.f,c.elite?'g#c98bff':'g#9a8cff',c.col,c.dark),-hw,-hw,hw*2,hw*2);
      ctx.globalCompositeOperation='source-over';
      if(!GFX.lite){ for(let p=0;p<3;p++){ const px=Math.sin(p*2.3+c.x)*u*0.5, py=-k*u*(0.4+p*0.35)+u*0.2, pr=u*(0.35+k*0.6);
        ctx.globalAlpha=(1-k)*0.3; ctx.drawImage(glowSprite('rgba(60,44,80,0.9)','rgba(30,20,44,0)',24),px-pr,py-pr,pr*2,pr*2); } } }
    ctx.restore(); }
  ctx.globalAlpha=1;
}
/* ---- E1: THE ARSENAL — every projectile its own silhouette, trail and glint. Weapons that share the plain bullet
   are told apart by the fields their fire() already sets (no weapon code touched); unknown kinds keep the old painter. ---- */
const _AS=new Map();
function _rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); } // roundRect for older Safari
function armSp(key,w,h,fn){ let c=_AS.get(key); if(c) return c; c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.translate(w/2,h/2); fn(g); _AS.set(key,c); return c; }
function _bvk(b){ // visual kind, decided once per bullet
  if(b._vk!==undefined) return b._vk;
  let v=b.kind||'';
  if(!v){ if(b.blast!==undefined) v='mortar'; else if(b.bounce!==undefined) v='die';
    else if(b.seek) v=b.r>=3.4?'fang':'moth'; else if(b.r>=19 && b.pierce!==undefined) v='phantom';
    else if(b.crit===undefined) v=b.pierce===1?'nail':'wisp'; else if(b.pierce===undefined) v='round'; else v='bolt'; }
  b._vk=v; b._h=(Math.random()*1000)|0; return v;
}
const ARS_TRAIL={ bolt:['255,120,80','255,220,190'], round:['255,200,110','255,244,210'], nail:['255,120,50','255,190,120'], wisp:['110,230,255','220,250,255'],
  fang:['170,220,170','230,255,230'], moth:['215,255,184','245,255,230'], die:['201,139,255','240,220,255'], mortar:['255,140,60','255,220,160'],
  phantom:['150,180,255','225,235,255'], card:['245,240,220','255,255,255'], knife:['190,215,255','245,250,255'], crit:['255,211,107','255,246,210'] };
const _ATS={}; for(const k in ARS_TRAIL){ const t=ARS_TRAIL[k]; _ATS[k]=['rgba('+t[0]+',0.14)','rgba('+t[0]+',0.5)','rgba('+t[1]+',0.85)']; }
// trails (called inside the additive trail pass): returns true when this bullet's trail is ours
function arsenalTrail(b){
  const v=_bvk(b), st=_ATS[b.crit&&v!=='card'?'crit':v]; if(!st) return false;
  if(v==='card'||v==='phantom'||v==='die'||v==='mortar') return true; // these leave afterimages instead (drawn with the body)
  const dx=b.x-b.px, dy=b.y-b.py, L=Math.hypot(dx,dy)||1, ext=v==='wisp'||v==='fang'||v==='moth'?3.2:2.2, tx=b.x-dx*ext, ty=b.y-dy*ext;
  ctx.strokeStyle=st[0]; ctx.lineWidth=b.r*3.2; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(b.x,b.y); ctx.stroke();
  ctx.strokeStyle=st[1]; ctx.lineWidth=b.r*1.1; ctx.beginPath(); ctx.moveTo(b.x-dx*ext*0.6,b.y-dy*ext*0.6); ctx.lineTo(b.x,b.y); ctx.stroke();
  if(b.crit){ ctx.strokeStyle=st[2]; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(b.x-dx*ext*0.8,b.y-dy*ext*0.8); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  return true;
}
const _SUIT=[['M 0 -1 C 0.5 -0.5 1 -0.2 0.6 0.35 C 0.35 0.6 0.1 0.45 0 0.3 C -0.1 0.45 -0.35 0.6 -0.6 0.35 C -1 -0.2 -0.5 -0.5 0 -1 Z M 0 0.2 L 0.25 0.95 L -0.25 0.95 Z','#141018'],
  ['M 0 -0.9 L 0.65 0 L 0 0.9 L -0.65 0 Z','#c8102e'],['M 0 0.9 C -0.9 0.2 -0.9 -0.6 -0.45 -0.75 C -0.2 -0.82 0 -0.6 0 -0.4 C 0 -0.6 0.2 -0.82 0.45 -0.75 C 0.9 -0.6 0.9 0.2 0 0.9 Z','#c8102e'],
  ['','#141018']]; // clubs are drawn as three pips + stem
function _pathS(g,d,s){ const t=d.split(' '); let i=0; const n=()=>parseFloat(t[i++])*s; g.beginPath();
  while(i<t.length){ const c=t[i++]; if(c==='M') g.moveTo(n(),n()); else if(c==='L') g.lineTo(n(),n()); else if(c==='C'){ const a=n(),b2=n(),c2=n(),d2=n(),x=n(),y=n(); g.bezierCurveTo(a,b2,c2,d2,x,y); } else if(c==='Z') g.closePath(); } }
function _cardFace(su){ return armSp('cf'+su,40,56,g=>{ g.fillStyle='#07030a'; _rr(g,-18,-26,36,52,5); g.fill();
  g.fillStyle='#f7f2e4'; _rr(g,-16,-24,32,48,4); g.fill(); g.strokeStyle='rgba(140,20,30,0.35)'; g.lineWidth=1; _rr(g,-13,-21,26,42,3); g.stroke();
  if(su===3){ g.fillStyle='#141018'; for(const [x,y] of [[0,-5],[-5,3],[5,3]]){ g.beginPath(); g.arc(x,y,4.6,0,6.283); g.fill(); } g.fillRect(-1.5,3,3,9); }
  else { g.fillStyle=_SUIT[su][1]; _pathS(g,_SUIT[su][0],11); g.fill(); }
  g.fillStyle=su%3?'#c8102e':'#141018'; g.font='700 9px serif'; g.textAlign='center'; g.fillText('A',-9,-12); }); }
function _cardBack(){ return armSp('cb',40,56,g=>{ g.fillStyle='#07030a'; _rr(g,-18,-26,36,52,5); g.fill();
  g.fillStyle='#7a1020'; _rr(g,-16,-24,32,48,4); g.fill(); g.strokeStyle='#e8b64c'; g.lineWidth=1.2; _rr(g,-12,-20,24,40,3); g.stroke();
  g.strokeStyle='rgba(232,182,76,0.55)'; g.lineWidth=1; for(let i=-4;i<=4;i++){ g.beginPath(); g.moveTo(-12,i*5); g.lineTo(-12+20,i*5+20); g.moveTo(12,i*5); g.lineTo(-8,i*5+20); g.stroke(); }
  g.fillStyle='#e8b64c'; g.beginPath(); g.moveTo(0,-7); g.lineTo(5,0); g.lineTo(0,7); g.lineTo(-5,0); g.closePath(); g.fill(); }); }
function _glintSp(){ return armSp('glint',64,64,g=>{ g.globalCompositeOperation='lighter';
  const gr=g.createRadialGradient(0,0,0,0,0,30); gr.addColorStop(0,'rgba(255,250,230,1)'); gr.addColorStop(0.25,'rgba(255,211,107,0.55)'); gr.addColorStop(1,'rgba(255,211,107,0)'); g.fillStyle=gr; g.fillRect(-32,-32,64,64);
  g.fillStyle='rgba(255,252,236,1)'; for(const [w,h] of [[30,2.2],[2.2,30]]){ g.beginPath(); g.moveTo(-w,0); g.lineTo(0,-h); g.lineTo(w,0); g.lineTo(0,h); g.closePath(); g.fill(); }
  g.fillStyle='rgba(255,236,170,0.8)'; for(const [w,h] of [[14,1.4],[1.4,14]]){ g.save(); g.rotate(0.785); g.beginPath(); g.moveTo(-w,0); g.lineTo(0,-h); g.lineTo(w,0); g.lineTo(0,h); g.closePath(); g.fill(); g.restore(); } }); }
function _dieFace(n){ return armSp('die'+n,30,30,g=>{ g.fillStyle='#07030a'; _rr(g,-13,-13,26,26,6); g.fill(); g.fillStyle='#f4ecdc'; _rr(g,-11,-11,22,22,5); g.fill();
  g.fillStyle='rgba(120,90,150,0.35)'; g.fillRect(-11,5,22,6); const P9={1:[[0,0]],2:[[-5,-5],[5,5]],3:[[-5,-5],[0,0],[5,5]],4:[[-5,-5],[5,-5],[-5,5],[5,5]],5:[[-5,-5],[5,-5],[0,0],[-5,5],[5,5]],6:[[-5,-6],[5,-6],[-5,0],[5,0],[-5,6],[5,6]]}[n];
  g.fillStyle=n===1?'#c8102e':'#3a1a52'; for(const [x,y] of P9){ g.beginPath(); g.arc(x,y,2.5,0,6.283); g.fill(); } }); }
function _chipSp(){ return armSp('chip',34,34,g=>{ g.fillStyle='#07030a'; g.beginPath(); g.arc(0,0,15,0,6.283); g.fill(); g.fillStyle='#b0101e'; g.beginPath(); g.arc(0,0,13,0,6.283); g.fill();
  g.fillStyle='#f6e7c0'; for(let i=0;i<8;i++){ g.save(); g.rotate(i*0.785); g.fillRect(-2.2,-13,4.4,4.5); g.restore(); }
  g.strokeStyle='#f6e7c0'; g.lineWidth=1.3; g.beginPath(); g.arc(0,0,7.5,0,6.283); g.stroke(); g.fillStyle='#ffd36b'; g.font='700 10px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('♠',0,0.5); }); }
function _shardSp(c){ return armSp('shard'+c,40,14,g=>{ g.fillStyle='#07030a'; g.beginPath(); g.moveTo(18,0); g.lineTo(-4,-5.5); g.lineTo(-17,-2); g.lineTo(-17,2); g.lineTo(-4,5.5); g.closePath(); g.fill();
  const gr=g.createLinearGradient(0,-4,0,4); gr.addColorStop(0,c?'#fff6d6':'#f4ead6'); gr.addColorStop(1,c?'#e8b64c':'#b9a888'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(16,0); g.lineTo(-4,-4); g.lineTo(-15,-1.2); g.lineTo(-15,1.2); g.lineTo(-4,4); g.closePath(); g.fill(); g.fillStyle=c?'#fff':'#ffd8c8'; g.beginPath(); g.moveTo(16,0); g.lineTo(4,-1.3); g.lineTo(4,1.3); g.closePath(); g.fill(); }); }
function _nailSp(){ return armSp('nail',36,14,g=>{ g.fillStyle='#07030a'; g.fillRect(-14,-3,28,6); g.fillRect(-16,-6,5,12); g.beginPath(); g.moveTo(14,-3); g.lineTo(18,0); g.lineTo(14,3); g.fill();
  g.fillStyle='#5a5e66'; g.fillRect(-13,-1.8,27,3.6); g.fillStyle='#8a8f9a'; g.fillRect(-15,-5,3,10); g.fillStyle='#b0b6c0'; g.fillRect(-13,-1.8,27,1.1); g.fillStyle='#7a3a1c'; g.fillRect(-4,-1.8,3,3.6); }); }
function _knifeSp(){ return armSp('knife',40,16,g=>{ g.fillStyle='#07030a'; g.beginPath(); g.moveTo(19,0); g.lineTo(0,-5.5); g.lineTo(-6,-4); g.lineTo(-18,-3.5); g.lineTo(-18,3.5); g.lineTo(-6,4); g.lineTo(0,5.5); g.closePath(); g.fill();
  g.fillStyle='#c9d4e4'; g.beginPath(); g.moveTo(17,0); g.lineTo(0,-4); g.lineTo(-5,-3); g.lineTo(-5,3); g.lineTo(0,4); g.closePath(); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.moveTo(17,0); g.lineTo(0,-4); g.lineTo(0,-1.2); g.closePath(); g.fill();
  g.fillStyle='#3a2018'; g.fillRect(-17,-2.4,11,4.8); g.fillStyle='#8a8f9a'; g.fillRect(-7,-4.5,2.4,9); }); }
function _mothSp(f){ return armSp('moth'+f,30,26,g=>{ const w=f?0.45:1;
  g.fillStyle='#07030a'; for(const sd of [-1,1]){ g.beginPath(); g.ellipse(sd*7*w,-3,8.5*w+1.4,7.5,sd*0.5,0,6.283); g.fill(); g.beginPath(); g.ellipse(sd*5.5*w,5,5.5*w+1.2,5,-sd*0.4,0,6.283); g.fill(); }
  for(const sd of [-1,1]){ g.fillStyle='#cfe8b0'; g.beginPath(); g.ellipse(sd*7*w,-3,8.5*w,6.5,sd*0.5,0,6.283); g.fill(); g.fillStyle='#a8c890'; g.beginPath(); g.ellipse(sd*5.5*w,5,5.5*w,4,-sd*0.4,0,6.283); g.fill();
    g.fillStyle='#3a4a2a'; g.beginPath(); g.arc(sd*8*w,-3,2.2*w+0.6,0,6.283); g.fill(); }
  g.fillStyle='#2a2418'; g.beginPath(); g.ellipse(0,1,2.2,7,0,0,6.283); g.fill(); g.strokeStyle='#2a2418'; g.lineWidth=1; g.beginPath(); g.moveTo(-1,-6); g.lineTo(-4,-11); g.moveTo(1,-6); g.lineTo(4,-11); g.stroke(); }); }
function _fangSp(f){ return armSp('fang'+f,30,24,g=>{ const o=f?4:1.2; // a ghost rat-skull, jaws snapping
  g.fillStyle='#07030a'; g.beginPath(); g.ellipse(-2,0,11,8+o*0.4,0,0,6.283); g.fill(); g.beginPath(); g.moveTo(6,-5-o*0.3); g.lineTo(14,-1-o); g.lineTo(14,1+o); g.lineTo(6,5+o*0.3); g.fill();
  g.fillStyle='#d6e8d0'; g.beginPath(); g.ellipse(-2,0,9.5,6.8,0,0,6.283); g.fill(); g.beginPath(); g.moveTo(5,-4.5); g.lineTo(12.5,-o); g.lineTo(5,-0.8); g.closePath(); g.fill(); g.beginPath(); g.moveTo(5,4.5); g.lineTo(12.5,o); g.lineTo(5,0.8); g.closePath(); g.fill();
  g.fillStyle='#fff'; g.beginPath(); g.moveTo(10,-o+0.2); g.lineTo(11,-o+3); g.lineTo(12,-o+0.2); g.fill(); g.beginPath(); g.moveTo(10,o-0.2); g.lineTo(11,o-3); g.lineTo(12,o-0.2); g.fill();
  g.fillStyle='#0e1a10'; g.beginPath(); g.arc(1,-2.5,2,0,6.283); g.fill(); g.fillStyle='#8bff9a'; g.beginPath(); g.arc(1.4,-2.7,0.9,0,6.283); g.fill();
  g.fillStyle='#d6e8d0'; g.beginPath(); g.ellipse(-6,-6,3,2.2,-0.5,0,6.283); g.fill(); }); }
function _wispSp(){ return armSp('wisp',40,22,g=>{ g.globalCompositeOperation='lighter';
  const gr=g.createLinearGradient(-19,0,8,0); gr.addColorStop(0,'rgba(60,160,255,0)'); gr.addColorStop(0.6,'rgba(110,230,255,0.55)'); gr.addColorStop(1,'rgba(200,250,255,0.9)'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(9,0); g.quadraticCurveTo(4,-8,-6,-5); g.quadraticCurveTo(-14,-3,-19,0); g.quadraticCurveTo(-14,3,-6,5); g.quadraticCurveTo(4,8,9,0); g.fill();
  g.fillStyle='rgba(235,255,255,1)'; g.beginPath(); g.arc(4,0,3.6,0,6.283); g.fill(); }); }
function _slugSp(){ return armSp('slug',24,12,g=>{ g.fillStyle='#07030a'; g.beginPath(); g.ellipse(0,0,10,4.4,0,0,6.283); g.fill(); g.fillStyle='#c89a3a'; g.beginPath(); g.ellipse(-1,0,8.6,3.2,0,0,6.283); g.fill(); g.fillStyle='#ffe9a8'; g.beginPath(); g.ellipse(3,-0.8,4.6,1.4,0,0,6.283); g.fill(); }); }
function arsenalDraw(b){ // the bullet bodies we own; false hands the bullet back to the old painter
  const v=_bvk(b); if(!v || v==='seeker'||v==='ember'||v==='stake'||v==='serpent'||v==='chalice'||v==='flamebolt'||v==='tracer'||v==='razor') return false;
  const va=Math.atan2(b.vy,b.vx);
  if(v==='bolt'||v==='round'||v==='nail'||v==='knife'||v==='wisp'||v==='fang'||v==='moth'){
    const sp=v==='bolt'?_shardSp(b.crit?1:0):v==='round'?_slugSp():v==='nail'?_nailSp():v==='knife'?_knifeSp():v==='wisp'?_wispSp():v==='fang'?_fangSp(((gt*14+b._h)|0)&1):_mothSp(((gt*18+b._h)|0)&1);
    const sc=v==='bolt'?Math.max(0.6,b.r/5)*(b.crit?1.15:1):v==='knife'?Math.max(0.7,b.r/4.2):v==='moth'?0.75:v==='fang'?0.85:0.8;
    ctx.save(); ctx.translate(b.x,b.y);
    if(v==='knife'){ const sa=b.spin||0; // spins end over end, with two ghost blades smeared behind the turn
      ctx.globalCompositeOperation='lighter'; for(let j=2;j>=1;j--){ ctx.save(); ctx.rotate(sa-j*0.55); ctx.globalAlpha=0.22/j; ctx.drawImage(sp,-sp.width*sc/2,-sp.height*sc/2,sp.width*sc,sp.height*sc); ctx.restore(); }
      ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.rotate(sa); }
    else if(v==='moth'){ ctx.rotate(va+1.5708+Math.sin(gt*9+b._h)*0.4); }
    else ctx.rotate(va);
    if(v==='wisp'){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.85+Math.random()*0.15; }
    ctx.drawImage(sp,-sp.width*sc/2,-sp.height*sc/2,sp.width*sc,sp.height*sc); ctx.restore(); ctx.globalAlpha=1; return true; }
  if(v==='card'){ // flips end over end; the face shows its suit, the back its House pattern, and it glints at the turn
    const su=b._h&3, cs=Math.cos(b.spin||0), w=Math.max(0.12,Math.abs(cs)), sc=Math.max(0.55,b.r/9);
    const dx=b.x-b.px, dy=b.y-b.py;
    for(let j=2;j>=0;j--){ ctx.save(); ctx.translate(b.x-dx*j*0.9,b.y-dy*j*0.9); ctx.rotate(va+1.5708+Math.sin((b.spin||0)*0.5)*0.4); ctx.scale(w*sc,sc);
      ctx.globalAlpha=j?0.22/j:1; const sp=cs>0?_cardFace(su):_cardBack(); ctx.drawImage(sp,-20,-28); ctx.restore(); }
    ctx.globalAlpha=1;
    if(w>0.93 || b.crit){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=b.crit?0.9:(w-0.93)*12; const gs=b.crit?22:14; ctx.translate(b.x,b.y); ctx.rotate(gt*3);
      ctx.drawImage(_glintSp(),-gs,-gs,gs*2,gs*2); ctx.restore(); }
    return true; }
  if(v==='die'){ const face=1+(((gt*11+b._h)|0)%6); ctx.save(); ctx.translate(b.x,b.y);
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55; ctx.drawImage(glowSprite('rgba(201,139,255,0.9)','rgba(201,139,255,0)',16),-16,-16,32,32);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.rotate(gt*9+b._h); const s=Math.max(0.6,b.r/7.5); ctx.drawImage(_dieFace(face),-15*s,-15*s,30*s,30*s); ctx.restore(); return true; }
  if(v==='mortar'){ // a house chip lobbed in a high arc: its shadow runs the floor, the chip rides the air above it
    const age=Math.max(0,1.1-b.life), h=Math.sin(Math.min(1,age/1.1)*Math.PI)*42;
    ctx.save(); ctx.translate(b.x,b.y); ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0,4,9-h*0.08,3.5-h*0.03,0,0,6.283); ctx.fill();
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5; ctx.drawImage(glowSprite('rgba(255,150,60,0.9)','rgba(255,120,40,0)',16),-14,-h-14,28,28);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.translate(0,-h); ctx.rotate(gt*12+b._h); ctx.scale(1,0.55+0.45*Math.abs(Math.cos(gt*7+b._h)));
    ctx.drawImage(_chipSp(),-12,-12,24,24); ctx.restore(); return true; }
  if(v==='phantom'){ // the dealer's wave: five spectral cards fanned across the throw
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(va); ctx.globalCompositeOperation='lighter';
    const pu=0.85+Math.sin(gt*12)*0.15, sp=_cardFace(b._h&3);
    for(let j=-2;j<=2;j++){ ctx.save(); ctx.translate(-Math.abs(j)*5,j*b.r*0.62); ctx.rotate(1.5708+j*0.22); ctx.globalAlpha=0.42*pu; ctx.drawImage(sp,-12,-17,24,34); ctx.restore(); }
    ctx.globalAlpha=0.5; ctx.strokeStyle='rgba(201,216,255,0.9)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(-b.r*1.4,0,b.r*1.9,-0.62,0.62); ctx.stroke();
    ctx.restore(); ctx.globalAlpha=1; return true; }
  return false;
}
// ground layer, under the court: pools bubble and pop, the guillotine's frame stands over its shadow, cracks in the marble
const _E1={bellT:0,novaT:0,bells:[],novas:[],cracks:[]};
function _scySmear(sR){ return armSp('scy'+sR,(sR+16)*2,(sR+16)*2,g=>{ g.globalCompositeOperation='lighter'; // a crescent smear that fades behind the blade
  for(let i=0;i<14;i++){ const a0=-0.08*i-0.1, a1=a0-0.13, al=Math.pow(1-i/14,1.6)*0.5;
    g.strokeStyle='rgba(255,226,150,'+al.toFixed(3)+')'; g.lineWidth=16-i*0.6; g.beginPath(); g.arc(0,0,sR-2,a1,a0); g.stroke();
    g.strokeStyle='rgba(255,252,236,'+(al*0.9).toFixed(3)+')'; g.lineWidth=1.6; g.beginPath(); g.arc(0,0,sR+4,a1,a0); g.stroke(); } }); }
function _bellSp(){ return armSp('bell',44,48,g=>{ g.fillStyle='#07030a'; g.beginPath(); g.moveTo(-17,14); g.quadraticCurveTo(-14,-20,0,-20); g.quadraticCurveTo(14,-20,17,14); g.lineTo(20,18); g.lineTo(-20,18); g.closePath(); g.fill();
  const gr=g.createLinearGradient(-16,0,16,0); gr.addColorStop(0,'#6a4a1c'); gr.addColorStop(0.35,'#f6e0a8'); gr.addColorStop(0.6,'#c8962c'); gr.addColorStop(1,'#5a3c14'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(-15,13); g.quadraticCurveTo(-12,-18,0,-18); g.quadraticCurveTo(12,-18,15,13); g.lineTo(18,16); g.lineTo(-18,16); g.closePath(); g.fill();
  g.fillStyle='#3a2a10'; g.beginPath(); g.arc(0,19,3.6,0,6.283); g.fill(); g.strokeStyle='#3a2a10'; g.lineWidth=2; g.beginPath(); g.arc(0,-21,3,0,6.283); g.stroke(); }); }
function arsenalGround(){
  if(gpools.length){ ctx.save();
    for(const p9 of gpools){ if(!inView(p9.x,p9.y,p9.r)) continue; const al=Math.min(1,p9.t);
      ctx.globalAlpha=al*0.55; ctx.strokeStyle='rgba(220,170,255,0.8)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(p9.x,p9.y,p9.r*0.85,p9.r*0.55,0,0,6.283); ctx.stroke();
      for(let i=0;i<(window._dense?3:6);i++){ const q=(gt*1.25+i*0.173+p9.x*0.013)%1, a=i*2.4+p9.y*0.01, rr=(0.25+((i*37)%10)/14)*0.7;
        const bx=p9.x+Math.cos(a)*p9.r*0.85*rr, by=p9.y+Math.sin(a)*p9.r*0.55*rr;
        if(q<0.8){ const br=1+q*4.2; ctx.globalAlpha=al*0.75; ctx.fillStyle='rgba(190,130,255,0.85)'; ctx.beginPath(); ctx.arc(bx,by-q*3,br,0,6.283); ctx.fill();
          ctx.fillStyle='rgba(245,225,255,0.9)'; ctx.beginPath(); ctx.arc(bx-br*0.35,by-q*3-br*0.35,br*0.3,0,6.283); ctx.fill(); }
        else { const k=(q-0.8)/0.2; ctx.globalAlpha=al*(1-k)*0.8; ctx.strokeStyle='rgba(230,200,255,1)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(bx,by-2.4,4.4+k*7,0,6.283); ctx.stroke(); } } }
    ctx.restore(); ctx.globalAlpha=1; }
  if(guils.length){ for(const g9 of guils){ if(!g9.fell){ // the scaffold rises around the shadow: two posts, a beam, the blade hauled high
        const f9=1-Math.max(0,g9.t)/0.55, a=Math.min(1,f9*3); ctx.save(); ctx.translate(g9.x,g9.y); ctx.globalAlpha=a*0.9;
        ctx.fillStyle='#07030a'; ctx.fillRect(-58,-176,10,178); ctx.fillRect(48,-176,10,178); ctx.fillRect(-62,-184,124,12);
        ctx.fillStyle='#3a2216'; ctx.fillRect(-56,-174,6,174); ctx.fillRect(50,-174,6,174); ctx.fillStyle='#4a2c1c'; ctx.fillRect(-60,-182,120,8);
        ctx.fillStyle='#dfe8ee'; ctx.globalAlpha=a*(0.55+f9*0.4); const by=-168+f9*6; ctx.beginPath(); ctx.moveTo(-46,by); ctx.lineTo(46,by); ctx.lineTo(46,by+26); ctx.lineTo(-46,by+46); ctx.closePath(); ctx.fill();
        ctx.globalAlpha=a*0.85*(0.5+0.5*Math.sin(gt*30)); ctx.fillStyle='#ff5560'; ctx.fillRect(-46,by+44,92,2); ctx.restore(); }
      else if(!g9._e1){ g9._e1=1; // the slam: a burst of dust, a crack left in the floor, gravel under the boom
        for(let i=0;i<(GFX.lite?8:26);i++){ const a=Math.random()*6.283, sp=rnd(60,260); parts.push({x:g9.x+Math.cos(a)*30,y:g9.y+Math.sin(a)*14,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.45-30,life:rnd(.5,1.1),col:i%3?'rgba(120,100,90,0.55)':'rgba(200,180,160,0.5)',r:rnd(3,7),ash:true}); }
        _E1.cracks.push({x:g9.x,y:g9.y,t0:gt,h:(Math.random()*1000)|0}); if(_E1.cracks.length>6) _E1.cracks.shift();
        noise(0.3,0.09,420); tone(46,0.5,'sine',0.12,28); } } }
  for(let i=_E1.cracks.length-1;i>=0;i--){ const c=_E1.cracks[i], t=gt-c.t0; if(t>3.2||t<0){ _E1.cracks.splice(i,1); continue; } if(!inView(c.x,c.y,120)) continue;
    ctx.save(); ctx.globalAlpha=Math.min(1,(3.2-t))*0.75; ctx.strokeStyle='#07030a'; ctx.lineWidth=2.2; ctx.beginPath();
    for(let j=0;j<7;j++){ const a=j*0.9+c.h, L=40+((c.h*(j+3))%50); ctx.moveTo(c.x+Math.cos(a)*8,c.y+Math.sin(a)*4); ctx.lineTo(c.x+Math.cos(a+0.15)*L*0.5,c.y+Math.sin(a+0.15)*L*0.25); ctx.lineTo(c.x+Math.cos(a-0.05)*L,c.y+Math.sin(a-0.05)*L*0.45); }
    ctx.stroke(); ctx.strokeStyle='rgba(255,90,96,0.35)'; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); }
}
// over layer, above the bullets: crit glints, the scythe's smear, the bell's shock rings, the nova's blood disc, notes on the gramophone's waves
function arsenalOver(){
  if(!P) return;
  for(const b of bullets){ if(!b.crit || b._vk==='card') continue; const gs=(b.lucky?14:8)+b.r*1.6+Math.sin(gt*30+b.x)*2;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(b.x,b.y); ctx.rotate(gt*4+(b._h||0)); ctx.globalAlpha=0.9; ctx.drawImage(_glintSp(),-gs,-gs,gs*2,gs*2); ctx.restore(); }
  const bl=P.wlv.bell||0; if(bl){ if(P.bellT>_E1.bellT+0.5){ _E1.bells.push({x:P.x,y:P.y,t0:gt,R:130+bl*20}); if(_E1.bells.length>3) _E1.bells.shift(); tone(98,1.1,'sine',0.08,92); tone(147,0.9,'sine',0.04); } _E1.bellT=P.bellT; }
  const nl=P.wlv.nova||0; if(nl){ if(P.novaT>_E1.novaT+0.5){ _E1.novas.push({x:P.x,y:P.y,t0:gt,R:120+nl*34}); if(_E1.novas.length>3) _E1.novas.shift(); } _E1.novaT=P.novaT; }
  if(_E1.bells.length||_E1.novas.length){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=_E1.bells.length-1;i>=0;i--){ const B=_E1.bells[i], t=gt-B.t0; if(t>0.9||t<0){ _E1.bells.splice(i,1); continue; }
      for(let j=0;j<3;j++){ const tt=t-j*0.11; if(tt<0) continue; const k=Math.min(1,tt/0.55); if(k>=1) continue;
        ctx.globalAlpha=(1-k)*(0.8-j*0.18); ctx.strokeStyle=j===1?'#fff2c0':'#ffd36b'; ctx.lineWidth=(7-j*2)*(1-k)+1.2; ctx.beginPath(); ctx.ellipse(B.x,B.y,B.R*(0.25+k*0.85),B.R*(0.25+k*0.85)*0.82,0,0,6.283); ctx.stroke(); }
      ctx.globalCompositeOperation='source-over'; const sw=Math.sin(t*16)*0.5*(1-t/0.9); ctx.globalAlpha=Math.min(1,(0.9-t)*4); ctx.save(); ctx.translate(B.x,B.y-58); ctx.rotate(sw); ctx.drawImage(_bellSp(),-22,-6,44,48); ctx.restore(); ctx.globalCompositeOperation='lighter'; }
    for(let i=_E1.novas.length-1;i>=0;i--){ const N=_E1.novas[i], t=gt-N.t0; if(t>0.35||t<0){ _E1.novas.splice(i,1); continue; } const k=t/0.35, rr=N.R*(0.2+0.85*Math.sqrt(k));
      ctx.globalAlpha=(1-k)*0.45; ctx.drawImage(glowSprite('rgba(255,60,80,0.8)','rgba(139,22,32,0)',48),N.x-rr,N.y-rr,rr*2,rr*2); }
    ctx.restore(); ctx.globalAlpha=1; }
  if(P.wlv.scythe){ const sR=80+P.wlv.scythe*8; ctx.save(); ctx.translate(P.x,P.y); ctx.rotate((P.scytheA||0)-0.7); ctx.globalAlpha=GFX.lite?0.5:0.85; const S=_scySmear(sR); ctx.drawImage(S,-S.width/2,-S.height/2); ctx.restore(); ctx.globalAlpha=1; }
  if(P.wlv.orbit && !GFX.lite){ const oL=P.wlv.orbit, oR=54+oL*4; ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let kk=0;kk<oL;kk++) for(let j=1;j<=3;j++){ const oa=(P.orbitA||0)+kk*(6.28/oL)-j*0.13; ctx.globalAlpha=0.32/j; ctx.drawImage(glowSprite('rgba(255,70,80,0.9)','rgba(200,16,46,0)',16),P.x+Math.cos(oa)*oR-8,P.y+Math.sin(oa)*oR-8,16,16); }
    ctx.restore(); ctx.globalAlpha=1; }
  if(waves.length){ ctx.save(); ctx.font='700 15px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const w of waves){ ctx.globalAlpha=Math.min(1,w.t*2.4)*0.9; for(const sd of [-1,1]){ const a=w.a+sd*0.42, x=w.x+Math.cos(a)*(w.r-6), y=w.y+Math.sin(a)*(w.r-6)+Math.sin(gt*14+sd)*3;
        ctx.fillStyle='#07030a'; ctx.fillText(sd<0?'♪':'♫',x+1,y+1); ctx.fillStyle='#fff2c0'; ctx.fillText(sd<0?'♪':'♫',x,y); } }
    ctx.restore(); ctx.globalAlpha=1; }
}
