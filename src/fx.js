"use strict";
// cached radial-glow sprites — createRadialGradient per frame per entity is the
// main canvas cost; draw these with ctx.globalAlpha for per-entity fade
const _glowCache={};
function glowSprite(c0,c1,r){
  const rb=Math.max(8,Math.ceil(r/8)*8), key=c0+'|'+c1+'|'+rb;
  let cv2=_glowCache[key];
  if(!cv2){ cv2=document.createElement('canvas'); cv2.width=cv2.height=rb*2;
    const g2=cv2.getContext('2d'); const gr2=g2.createRadialGradient(rb,rb,0,rb,rb,rb);
    gr2.addColorStop(0,c0); gr2.addColorStop(1,c1); g2.fillStyle=gr2; g2.fillRect(0,0,rb*2,rb*2);
    _glowCache[key]=cv2; }
  return cv2;
}
// cached vertical linear gradients for enemy body parts (local coords after
// ctx.translate) — keyed by half-height bucket + colors
const _lgCache={};
function lgrad(ry,c1,c2,mp,mc){
  const rb=Math.max(0.5,Math.round(ry*2)/2), key=rb+'|'+c1+'|'+c2+(mp?'|'+mp+'|'+mc:'');
  let g=_lgCache[key];
  if(!g){ g=ctx.createLinearGradient(0,-rb,0,rb); g.addColorStop(0,c1); if(mp) g.addColorStop(mp,mc); g.addColorStop(1,c2); _lgCache[key]=g; }
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
function ftext(x,y,t,col,big){ texts.push({x,y,t,col,life:big?1.0:0.9,vy:big?-52:-40,size:big?31:15}); }
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
      const gr=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.rad); gr.addColorStop(0,'rgba(255,220,130,0.8)'); gr.addColorStop(1,'rgba(255,180,60,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(s.x,s.y,s.rad,0,6.28); ctx.fill(); ctx.restore(); ctx.globalAlpha=1;
    }
  }
}
function bigWin(label,tier){
  const l=$('jackpotLayer'), t=$('jackpotText'); t.textContent=label; t.className='jackpotText t'+tier;
  l.classList.remove('hidden'); t.style.animation='none'; void t.offsetWidth; t.style.animation='';
  SFX.bigWin(tier); SFX.dingBells(); setTimeout(()=>SFX.dingBells(),240); setTimeout(()=>SFX.dingBells(),520); SFX.cashout(); setTimeout(()=>SFX.cashout(),400);
  coinRain(38+tier*24); excite=1; shake=Math.min(28,shake+18);
  sparkBurst(50+tier*10);
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
function sparkBurst(n){
  const m=$('machine'), host=$('slot'); if(!m||!host) return;
  const r=m.getBoundingClientRect();
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
