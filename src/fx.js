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
