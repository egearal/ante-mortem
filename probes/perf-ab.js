// A/B frame profiler. node perf.js <dist.html> [dpr] [enemies] [q]
// Drives the bot on the virtual clock to ~2:30, forces a storm, then times real
// update() and render() calls (raster forced via getImageData) and reads __prof.
const path=require('path');
const { chromium } = require('playwright');
const file=process.argv[2], DPR=+(process.argv[3]||1), N=+(process.argv[4]||300), Q=process.argv[5]||'high', TGT=+(process.argv[6]||150);
const lib=require(require('path').join(__dirname,'lib.js'));
(async()=>{
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:DPR});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  // reuse the harness' virtual clock + bot by reading them from lib.js source
  const src=require('fs').readFileSync(require('path').join(__dirname,'lib.js'),'utf8');
  const VC=src.slice(src.indexOf('const VCLOCK = `')+16, src.indexOf('`;', src.indexOf('const VCLOCK = `')));
  const BOT=src.slice(src.indexOf('const BOT = `')+13, src.indexOf('`;', src.indexOf('const BOT = `')));
  await page.addInitScript(()=>{ self.__realNow=performance.now.bind(performance); });
  await page.addInitScript(VC);
  await page.addInitScript(()=>{ try{ localStorage.clear(); }catch(e){} });
  await page.goto('file://'+path.resolve(file)+'?prof');
  await page.evaluate(BOT);
  await page.evaluate((q)=>{ window.muted=true; window.__bot.god=true; window.__bot.renderEvery=30; try{ GFX.q=q; }catch(e){} }, Q);
  // play to 2:30 game time
  await page.evaluate(async(TGT)=>{ for(let i=0;i<20000;i++){ window.__vc.step(16.7); window.__bot.step(); if(i%10===9) await null; if(state==='playing'&&gt>TGT) break; } }, TGT);
  const r=await page.evaluate(async(N)=>{
    // force a storm around the player and freeze the bot
    window.__bot.renderEvery=1; window.__bot.step=()=>{};
    while(enemies.length<N){ const a=Math.random()*6.283, d=120+Math.random()*420; spawnEnemy(['shambler','husk','wraith','swarm','stalker'][(Math.random()*5)|0], P.x+Math.cos(a)*d, P.y+Math.sin(a)*d); }
    const c=document.getElementById('cv')||document.querySelector('canvas'); const cx=c.getContext('2d');
    // warm
    for(let i=0;i<20;i++){ window.__vc.step(16.7); update(0.0167*1.71); render(); }
    __prof.reset();
    const vnow=performance.now; performance.now=self.__realNow; // real timer for the measured window so __prof stages are real ms
    const up=[], rd=[], ras=[];
    for(let i=0;i<120;i++){
      window.__vc.step(16.7);
      const r0=self.__realNow(); update(0.0167*1.71); const r1=self.__realNow();
      PROF.frameStart(); render(); PROF.frameEnd(); const r2=self.__realNow();
      cx.getImageData(0,0,2,2); const r3=self.__realNow();
      up.push(r1-r0); rd.push(r2-r1); ras.push(r3-r2);
    }
    performance.now=vnow;
    const med=a=>{ const s=[...a].sort((x,y)=>x-y); return +s[s.length>>1].toFixed(2); };
    const p95=a=>{ const s=[...a].sort((x,y)=>x-y); return +s[Math.floor(s.length*0.95)].toFixed(2); };
    return { enemies:enemies.length, bullets:bullets.length, parts:parts.length, q:GFX.q, dpr:DPR, canvas:[cv.width,cv.height],
      updateMs:{med:med(up),p95:p95(up)}, renderMs:{med:med(rd),p95:p95(rd)}, rasterMs:{med:med(ras),p95:p95(ras)}, prof:__prof.report() };
  }, N);
  console.log(JSON.stringify({file:path.basename(path.dirname(path.dirname(path.resolve(file)))), ...r, errors:errs.slice(0,3)}));
  await browser.close();
})().catch(e=>{ console.error(e); process.exit(1); });
