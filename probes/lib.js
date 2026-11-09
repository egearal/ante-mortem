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
  window.__realNow=performance.now.bind(performance); // B2: perf probes time real work inside virtual frames
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
    // telegraphed hazards (THE BALLROOM's chandeliers): a player sees the ring and steps out of it
    if(window.__hazards) for(const h of window.__hazards){ const dx=P.x-h.x, dy=P.y-h.y, d=Math.hypot(dx,dy)||1; if(d<h.r+40){ const w=Math.min(1,(h.r+40-d)/60)*4; fx+=dx/d*w; fy+=dy/d*w; } }
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
  // stall detector: if the game clock hasn't moved for ~20 virtual seconds outside the menu/ledger,
  // snapshot what the night is doing so a freeze can be diagnosed (reported as __bot.stall)
  B._lgt=-1; B._lgtN=0;
  function stallCheck(){
    if(state==='menu'||state==='dead'||typeof gt!=='number') { B._lgtN=0; return; }
    if(gt!==B._lgt){ B._lgt=gt; B._lgtN=0; return; }
    if(++B._lgtN===1200 && !B.stall){
      const vis=[...document.querySelectorAll('.layer:not(.hidden),[id$=Layer]:not(.hidden),[id$=Panel]:not(.hidden)')].map(e=>e.id||e.className).slice(0,12);
      B.stall={ state, gt, clock:fmt(gt), hitstop, tabHold:typeof tabHold!=='undefined'?tabHold:null, slotStage:typeof slotStage!=='undefined'?slotStage:null,
        slotBusy:typeof slotBusy!=='undefined'?slotBusy:null, pending:(typeof pending!=='undefined'&&pending)?pending.length:null, hp:P&&P.hp, ovT:P&&P.ovT,
        layers:vis, autoPaused:!!window._autoPaused,
        crash:(typeof crash!=='undefined'&&state==='crash')?{mult:crash.mult,cp:crash.cp,live:crash.live,done:crash.done,jk:!!crash.jk,on:crash.on,msg:(document.getElementById('crashMsg')||{}).textContent}:undefined };
      console.warn('[probe] STALL '+JSON.stringify(B.stall));
    }
  }
  B.step=function(){
    B.n++;
    try{ stallCheck(); }catch(e){}
    B.states[state]=(B.states[state]||0)+1;
    if(state==='menu'){ if(!B.startedAt){ B.startedAt=B.n; try{ startGame(); }catch(e){ console.error('[bot startGame]', e && e.stack || e); } } return; }
    if(state==='paused'){ if(B.pauseHold) return; try{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); }catch(e){} return; }
    if(state==='dead'){ if(!B.res) B.res={ gt, clock:fmt(gt), level:P.level, kills:P.kills, coins:P.coins, err:!!window._amErr }; return; }
    if(P && P.level>B.maxLevel) B.maxLevel=P.level;
    if(enemies && enemies.length>(B.peakE||0)) B.peakE=enemies.length;
    if(state==='playing'){
      if(B.god && P && (!B.godUntil || gt<B.godUntil)){ P.hp=P.maxHp; P.inv=Math.max(P.inv||0,0.25); }
      if(B.manual){ for(const k of K) keys.delete(k); return; } // a human thumb is driving (probes/phone.js)
      steer();
      // J1 THE FEED: hold it until it runs WARM (or --feed-tier N), cash before it starves
      if(P.ovT>0 && typeof cashRage==='function' && ((P.ovTier||0)>=(B.feedTier||1) || P.ovT<35)){ try{ cashRage(); }catch(e){} }
      if(B.n%9===0) { /* cash streaks and anything else wanting SPACE */ }
      return;
    }
    if(state==='slot'){ if(B.noSlotTap) return; if(B.n%6===0){ stopLock=0; try{ slotTap(); }catch(e){} } return; }
    if(B.noSpace && state==='b2gate') return;
    // the vault takes ESC / its CLOSE button — the bot browses for a beat, then leaves (SPACE alone would wait forever)
    if(state==='vault'){ if(B.n%45===0){ try{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); }catch(e){} } return; }
    // the 7.77x jackpot waits for a card (1/2/3 or a click) — SPACE alone would wait forever
    if(state==='crash' && typeof crash!=='undefined' && crash && crash.jk){ if(B.n%20===0){ const k=String(1+(B.n/20|0)%3); window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Digit'+k,bubbles:true})); } return; }
    if(B.n%4===0) space();
  };
})();`;

// H1: `scale` = deviceScaleFactor (the game honours DPR up to 2 — crisp store shots at the normal camera);
// `seed` = replace Math.random with a seeded mulberry32 stream so a capture replays the same night
async function launch({ viewport = { width: 1280, height: 720 }, which = 'dist', mobile = false, fresh = true, vclock = true, args = [], scale = 1, seed = null } = {}) {
  const browser = await chromium.launch(args.length ? { args } : undefined);
  const ctx = await browser.newContext(mobile
    ? { viewport, deviceScaleFactor: scale, isMobile: true, hasTouch: true }
    : { viewport, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  if (seed != null) await page.addInitScript((sd) => { let a = sd >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
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
