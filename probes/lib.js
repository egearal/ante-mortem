// Shared headless harness for ANTE MORTEM (see GAME_DESIGN.md appendix).
// Owns the clock: performance.now / Date.now / timers / rAF run on a virtual
// clock that only advances when the harness steps it, so a whole night runs
// in seconds and ceremony timers fire in order.
'use strict';
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');

function target(which) {
  // 'dist' = the shippable single file; 'src' = index.html + src/*.js
  return which === 'src'
    ? 'file://' + path.join(ROOT, 'index.html')
    : 'file://' + path.join(ROOT, 'dist', 'ante-mortem.html');
}

const VCLOCK = `(()=>{
  let VT=0, id=1; const q=[], raf=[];
  const base=Date.now();
  performance.now=()=>VT;
  Date.now=()=>base+VT;
  window.setTimeout=(fn,ms,...a)=>{ const t={id:id++,at:VT+Math.max(0,+ms||0),fn,a,iv:0}; q.push(t); return t.id; };
  window.setInterval=(fn,ms,...a)=>{ const iv=Math.max(4,+ms||0); const t={id:id++,at:VT+iv,fn,a,iv}; q.push(t); return t.id; };
  window.clearTimeout=window.clearInterval=(i)=>{ const k=q.findIndex(t=>t.id===i); if(k>=0) q.splice(k,1); };
  window.requestAnimationFrame=(fn)=>{ raf.push(fn); return id++; };
  window.cancelAnimationFrame=()=>{};
  window.__vc={
    get vt(){ return VT; },
    step(ms){
      VT+=ms;
      for(let g=0; g<4000; g++){
        let b=-1; for(let i=0;i<q.length;i++) if(q[i].at<=VT && (b<0||q[i].at<q[b].at)) b=i;
        if(b<0) break;
        const t=q[b];
        if(t.iv){ t.at+=t.iv; if(t.at<VT-250) t.at=VT; } else q.splice(b,1);
        if(typeof t.fn==='function'){ try{ t.fn(...t.a); }catch(e){ window.__timerErr=(window.__timerErr||0)+1; console.error('[timer]', e && e.stack || e); } }
      }
      const r=raf.splice(0); for(const f of r){ try{ f(VT); }catch(e){ console.error('[raf]', e && e.stack || e); } }
    }
  };
  window._noAutoPause=true;
})();`;

// The autoplay bot, installed in-page. Kites around the arena centre, flees
// anything within 220px, walks to loot within 420px, cashes RAGE, taps the
// slot, mashes SPACE in every gambling state.
const BOT = `(()=>{
  const B=window.__bot={ n:0, god:false, res:null, maxLevel:1, states:{}, startedAt:null, renderEvery:30 };
  // render is the cost of a headless step; draw only every Nth frame (still exercises the renderer)
  const _render=window.render;
  window.render=function(){ if(B.renderEvery<=1 || B.n%B.renderEvery===0) return _render.apply(this, arguments); };
  const K=['w','a','s','d'];
  function space(){ window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true})); window.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true})); }
  function steer(){
    let fx=0, fy=0;
    for(const e of enemies){ const dx=P.x-e.x, dy=P.y-e.y, d=Math.hypot(dx,dy)||1; if(d<220){ const w=(220-d)/220; fx+=dx/d*w*w*3; fy+=dy/d*w*w*3; } }
    const C=CFG.arena/2, cx=C-P.x, cy=C-P.y, cd=Math.hypot(cx,cy)||1;
    // orbit: tangent around centre at ~300px
    fx+=-cy/cd*0.6 + cx/cd*(cd-300)/300; fy+=cx/cd*0.6 + cy/cd*(cd-300)/300;
    let best=null, bd=420;
    for(const arr of [orbs, coins]) if(arr) for(const o of arr){ const d=Math.hypot(o.x-P.x,o.y-P.y); if(d<bd){ bd=d; best=o; } }
    if(best){ const danger=Math.hypot(fx,fy); const w=danger<0.4?2.2:0.9; fx+=(best.x-P.x)/bd*w; fy+=(best.y-P.y)/bd*w; }
    for(const k of K) keys.delete(k);
    const L=Math.hypot(fx,fy); if(L<0.05) return;
    const ux=fx/L, uy=fy/L;
    if(ux>0.38) keys.add('d'); if(ux<-0.38) keys.add('a');
    if(uy>0.38) keys.add('s'); if(uy<-0.38) keys.add('w');
    let ne=null, nd=1e9; for(const e of enemies){ const d=Math.hypot(e.x-P.x,e.y-P.y); if(d<nd){ nd=d; ne=e; } }
    if(ne) P.aim=Math.atan2(ne.y-P.y, ne.x-P.x);
  }
  B.step=function(){
    B.n++;
    B.states[state]=(B.states[state]||0)+1;
    if(state==='menu'){ if(!B.startedAt){ B.startedAt=B.n; try{ startGame(); }catch(e){ console.error('[bot startGame]', e && e.stack || e); } } return; }
    if(state==='paused'){ try{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); }catch(e){} return; }
    if(state==='dead'){ if(!B.res) B.res={ gt, clock:fmt(gt), level:P.level, kills:P.kills, coins:P.coins, err:!!window._amErr }; return; }
    if(P && P.level>B.maxLevel) B.maxLevel=P.level;
    if(state==='playing'){
      if(B.god && P){ P.hp=P.maxHp; }
      steer();
      if(P.ovT>0 && typeof cashRage==='function'){ try{ cashRage(); }catch(e){} }
      if(B.n%9===0) { /* cash streaks and anything else wanting SPACE */ }
      return;
    }
    if(state==='slot'){ if(B.noSlotTap) return; if(B.n%6===0){ stopLock=0; try{ slotTap(); }catch(e){} } return; }
    if(B.n%4===0) space();
  };
})();`;

async function launch({ viewport = { width: 1280, height: 720 }, which = 'dist', mobile = false, fresh = true, vclock = true } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile
    ? { viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    : { viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  if (vclock) await page.addInitScript(VCLOCK);
  if (fresh) await page.addInitScript(() => { try { if (!sessionStorage.getItem('__probeInit')) { localStorage.clear(); sessionStorage.setItem('__probeInit', '1'); } } catch (e) {} });
  await page.goto(target(which));
  await page.evaluate(BOT);
  await page.evaluate(() => { try { window.muted = true; } catch (e) {} });
  return { browser, ctx, page, errors };
}

// advance virtual time: `steps` frames of 16.7ms, driving the bot each frame
async function run(page, steps, { batch = 120 } = {}) {
  let left = steps;
  while (left > 0) {
    const n = Math.min(batch, left); left -= n;
    const done = await page.evaluate(async (n) => {
      for (let i = 0; i < n; i++) {
        window.__vc.step(16.7);
        try { window.__bot.step(); } catch (e) { console.error('[bot]', e && e.stack || e); }
        if (i % 10 === 9) await null; // let promise chains (async die etc.) settle
        if (window.__bot.res) return true;
      }
      return false;
    }, n);
    if (done) return true;
  }
  return false;
}

// run until predicate(page state) is true or `max` frames pass
async function until(page, fnSrc, max = 40000, { batch = 60 } = {}) {
  for (let done = 0; done < max; done += batch) {
    const ok = await page.evaluate(async ({ n, src }) => {
      const f = new Function('return (' + src + ')');
      for (let i = 0; i < n; i++) {
        window.__vc.step(16.7);
        try { window.__bot.step(); } catch (e) {}
        if (i % 10 === 9) await null;
        try { if (f()) return true; } catch (e) {}
      }
      return false;
    }, { n: batch, src: fnSrc });
    if (ok) return true;
  }
  return false;
}

module.exports = { launch, run, until, ROOT, target };
