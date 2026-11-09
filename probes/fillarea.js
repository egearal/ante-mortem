// Approximate fill-rate demand per frame: sum of drawImage destination areas and fillRect areas (logical px²).
const path=require('path'); const { chromium } = require('playwright');
const file=process.argv[2], N=+(process.argv[3]||300), TGT=+(process.argv[4]||150), QQ=process.argv[5]||'high';
const src=require('fs').readFileSync(require('path').join(__dirname,'lib.js'),'utf8');
const VC=src.slice(src.indexOf('const VCLOCK = `')+16, src.indexOf('`;', src.indexOf('const VCLOCK = `')));
const BOT=src.slice(src.indexOf('const BOT = `')+13, src.indexOf('`;', src.indexOf('const BOT = `')));
(async()=>{
  const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(()=>{ self.__fa={img:0,imgBig:0,rect:0,rectBig:0,n:0}; const P=CanvasRenderingContext2D.prototype;
    const di=P.drawImage; P.drawImage=function(){ let w,h; const a=arguments; if(a.length===9){ w=a[7]; h=a[8]; } else if(a.length===5){ w=a[3]; h=a[4]; } else { w=a[0].width||0; h=a[0].height||0; }
      const t=this.getTransform(); const sx=Math.hypot(t.a,t.b), sy=Math.hypot(t.c,t.d); const area=Math.abs(w*h*sx*sy); self.__fa.img+=area; if(area>150000) self.__fa.imgBig++; self.__fa.n++; return di.apply(this,arguments); };
    const fr=P.fillRect; P.fillRect=function(x,y,w,h){ const t=this.getTransform(); const area=Math.abs(w*h*Math.hypot(t.a,t.b)*Math.hypot(t.c,t.d)); self.__fa.rect+=area; if(area>150000) self.__fa.rectBig++; return fr.apply(this,arguments); };
  });
  await page.addInitScript(VC); await page.addInitScript(()=>{ try{ localStorage.clear(); }catch(e){} });
  await page.goto('file://'+path.resolve(file)); await page.evaluate(BOT);
  await page.evaluate((q)=>{ window.muted=true; window.__bot.god=true; window.__bot.renderEvery=30; try{ GFX.q=q; }catch(e){} }, QQ);
  await page.evaluate(async(T)=>{ for(let i=0;i<30000;i++){ window.__vc.step(16.7); window.__bot.step(); if(i%10===9) await null; if(state==='playing'&&gt>T) break; } }, TGT);
  const r=await page.evaluate(async(N)=>{
    window.__bot.renderEvery=1; window.__bot.step=()=>{};
    while(enemies.length<N){ const a=Math.random()*6.283, d=120+Math.random()*420; spawnEnemy(['shambler','husk','wraith','swarm','stalker'][(Math.random()*5)|0], P.x+Math.cos(a)*d, P.y+Math.sin(a)*d); }
    for(let i=0;i<20;i++) window.__vc.step(16.7);
    const a={...self.__fa}; for(let i=0;i<60;i++) window.__vc.step(16.7); const b={...self.__fa};
    const per=k=>(b[k]-a[k])/60; const screen=VW*VH;
    return { clock:fmt(gt), enemies:enemies.length, screensPerFrame_drawImage:+(per('img')/screen).toFixed(1), screensPerFrame_fillRect:+(per('rect')/screen).toFixed(1), bigDrawImagesPerFrame:+per('imgBig').toFixed(1), bigRectsPerFrame:+per('rectBig').toFixed(1), drawImagesPerFrame:+per('n').toFixed(0) };
  }, N);
  console.log(JSON.stringify(r)); await browser.close();
})().catch(e=>{ console.error(e); process.exit(1); });
