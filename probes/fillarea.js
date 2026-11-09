// Approximate fill-rate demand per frame: sum of drawImage destination areas and fillRect areas (logical px²).
const path=require('path'); const { chromium } = require('playwright');
const file=process.argv[2], N=+(process.argv[3]||300), TGT=+(process.argv[4]||150), QQ=process.argv[5]||'high', SEED=+process.argv[6]||0, SPOT=process.argv[7]||''; // J0: optional SEED (0 = none) and SPOT 'heart' = storm at the sigil, the worst case, so A/B runs compare the same scene
const src=require('fs').readFileSync(require('path').join(__dirname,'lib.js'),'utf8');
const VC=src.slice(src.indexOf('const VCLOCK = `')+16, src.indexOf('`;', src.indexOf('const VCLOCK = `')));
const BOT=src.slice(src.indexOf('const BOT = `')+13, src.indexOf('`;', src.indexOf('const BOT = `')));
(async()=>{
  const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(()=>{ self.__fa={img:0,imgBig:0,rect:0,rectBig:0,n:0,clip:0}; const P=CanvasRenderingContext2D.prototype;
    // J0: `clip` = the same areas, but only the part that lands inside the target canvas (device-space
    // bounding box ∩ canvas) — what the rasterizer can actually touch. Offscreen spills don't count.
    // rectangular clip() regions are honoured too (tracked through save/restore)
    const bb=(t,x,y,w,h)=>{ const X=[x,x+w,x,x+w], Y=[y,y,y+h,y+h]; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      for(let i=0;i<4;i++){ const u=t.a*X[i]+t.c*Y[i]+t.e, v=t.b*X[i]+t.d*Y[i]+t.f; if(u<x0)x0=u; if(u>x1)x1=u; if(v<y0)y0=v; if(v>y1)y1=v; }
      return [x0,y0,x1,y1]; };
    const wrap=(n,f)=>{ const o=P[n]; P[n]=function(){ f.apply(this,arguments); return o.apply(this,arguments); }; };
    wrap('beginPath',function(){ this.__pr=null; });
    wrap('rect',function(x,y,w,h){ this.__pr=(this.__pr===null)?bb(this.getTransform(),x,y,w,h):'x'; });
    for(const n of ['arc','ellipse','moveTo','lineTo','arcTo','quadraticCurveTo','bezierCurveTo','roundRect']) if(P[n]) wrap(n,function(){ this.__pr='x'; });
    wrap('clip',function(){ const r=this.__pr; if(!r||r==='x') return; const c=this.__clip; this.__clip=c?[Math.max(c[0],r[0]),Math.max(c[1],r[1]),Math.min(c[2],r[2]),Math.min(c[3],r[3])]:r; });
    wrap('save',function(){ (this.__cs||(this.__cs=[])).push(this.__clip); });
    wrap('restore',function(){ if(this.__cs&&this.__cs.length) this.__clip=this.__cs.pop(); });
    const inside=(c,t,x,y,w,h)=>{ const [x0,y0,x1,y1]=bb(t,x,y,w,h);
      let W0=0,H0=0,W=c.canvas.width, H=c.canvas.height; const k=c.__clip; if(k){ W0=Math.max(0,k[0]); H0=Math.max(0,k[1]); W=Math.min(W,k[2]); H=Math.min(H,k[3]); }
      const iw=Math.min(W,x1)-Math.max(W0,x0), ih=Math.min(H,y1)-Math.max(H0,y0);
      if(iw<=0||ih<=0) return 0; const full=(x1-x0)*(y1-y0)||1; return Math.abs(w*h*(t.a*t.d-t.b*t.c))*(iw*ih/full); };
    const di=P.drawImage; P.drawImage=function(){ let x,y,w,h; const a=arguments; if(a.length===9){ x=a[5]; y=a[6]; w=a[7]; h=a[8]; } else if(a.length===5){ x=a[1]; y=a[2]; w=a[3]; h=a[4]; } else { x=a[1]; y=a[2]; w=a[0].width||0; h=a[0].height||0; }
      const t=this.getTransform(); const sx=Math.hypot(t.a,t.b), sy=Math.hypot(t.c,t.d); const area=Math.abs(w*h*sx*sy); self.__fa.img+=area; if(area>150000) self.__fa.imgBig++; self.__fa.n++; self.__fa.clip+=inside(this,t,x,y,w,h); return di.apply(this,arguments); };
    const fr=P.fillRect; P.fillRect=function(x,y,w,h){ const t=this.getTransform(); const area=Math.abs(w*h*Math.hypot(t.a,t.b)*Math.hypot(t.c,t.d)); self.__fa.rect+=area; if(area>150000) self.__fa.rectBig++; self.__fa.clip+=inside(this,t,x,y,w,h); return fr.apply(this,arguments); };
  });
  if(SEED) await page.addInitScript((sd)=>{ let a=sd>>>0; Math.random=()=>{ a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }, +SEED);
  await page.addInitScript(VC); await page.addInitScript(()=>{ try{ localStorage.clear(); }catch(e){} });
  await page.goto('file://'+path.resolve(file)); await page.evaluate(BOT);
  await page.evaluate((q)=>{ window.muted=true; window.__bot.god=true; window.__bot.renderEvery=30; try{ GFX.q=q; }catch(e){} }, QQ);
  await page.evaluate(async(T)=>{ for(let i=0;i<30000;i++){ window.__vc.step(16.7); window.__bot.step(); if(i%10===9) await null; if(state==='playing'&&gt>T) break; } }, TGT);
  const r=await page.evaluate(async([N,SPOT])=>{
    window.__bot.renderEvery=1; window.__bot.step=()=>{};
    if(SPOT==='heart'){ P.x=CFG.arena/2+260; P.y=CFG.arena/2+90; }
    while(enemies.length<N){ const a=Math.random()*6.283, d=120+Math.random()*420; spawnEnemy(['shambler','husk','wraith','swarm','stalker'][(Math.random()*5)|0], P.x+Math.cos(a)*d, P.y+Math.sin(a)*d); }
    for(let i=0;i<20;i++) window.__vc.step(16.7);
    const a={...self.__fa}; for(let i=0;i<60;i++) window.__vc.step(16.7); const b={...self.__fa};
    const per=k=>(b[k]-a[k])/60; const screen=VW*VH;
    return { clock:fmt(gt), enemies:enemies.length, screensPerFrame_drawImage:+(per('img')/screen).toFixed(1), screensPerFrame_fillRect:+(per('rect')/screen).toFixed(1), bigDrawImagesPerFrame:+per('imgBig').toFixed(1), bigRectsPerFrame:+per('rectBig').toFixed(1), drawImagesPerFrame:+per('n').toFixed(0),
      screensPerFrame_total:+((per('img')+per('rect'))/screen).toFixed(1), screensPerFrame_onCanvas:+(per('clip')/screen).toFixed(1), sigilInView:inView(CFG.arena/2,CFG.arena/2,780) };
  }, [N,SPOT]);
  console.log(JSON.stringify(r)); await browser.close();
})().catch(e=>{ console.error(e); process.exit(1); });
