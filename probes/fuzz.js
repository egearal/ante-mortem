#!/usr/bin/env node
// node probes/fuzz.js [--events 6000] [--seed 7] [--src] [--only desktop|phone|land] [--heap 5] [--noheap]
//
// THE WRECKING CREW. Throws thousands of random inputs at the BUILT game on the
// virtual clock (probes/lib.js) at desktop 1280x720, phone 390x844 and
// landscape 844x390: keys (SPACE/ESC/TAB/R/ENTER/F/M/WASD/arrows/1-3/hotkeys,
// taps, holds, auto-repeat), mouse + touch + pen pointers, raw TouchEvents,
// every visible button, resizes, visibility/blur/focus flips, and state churn
// (start a night, pause, open every panel, quit, force a death, re-ante,
// grant XP / coins so the slot, wheel and Ascent actually open).
//
// After every batch of events a RECOVERY pass lets the autoplay bot drive for
// up to ~70 virtual seconds: the state machine must come back to
// playing / menu / dead (and a dead table must re-ante), or it is STUCK.
// Asserts: zero page errors, zero _amErr, no stuck states, DOM/state agree
// (no ghost layers over live play), bounded arrays, and (desktop) a flat heap
// + DOM node count across 5 consecutive nights in one page.
// Exit 1 on any failure; JSON report on stdout.
'use strict';
const { launch } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const EVENTS = +opt('events', 6000), SEED = +opt('seed', 7), HEAPN = opt('noheap', false) ? 0 : +opt('heap', 5);
const which = opt('src', false) ? 'src' : 'dist';
const ONLY = opt('only', null);
const PROFILES = [
  { name: 'desktop', viewport: { width: 1280, height: 720 }, mobile: false },
  { name: 'phone', viewport: { width: 390, height: 844 }, mobile: true },
  { name: 'land', viewport: { width: 844, height: 390 }, mobile: true },
].filter(p => !ONLY || p.name === ONLY);
const SIZES = [[1280, 720], [390, 844], [844, 390], [1920, 1080], [360, 640], [1024, 768], [700, 300], [320, 568]];
// bounds: anything past these means a list stopped being culled
const BOUNDS = { enemies: 900, bullets: 1500, ebullets: 900, parts: 3000, texts: 600, orbs: 2500, coins: 1500, decals: 1500 };

// ---- in-page fuzzer ------------------------------------------------------
const FUZZ = `(()=>{
  let s=0; const R=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
  const pick=a=>a[(R()*a.length)|0];
  const F=window.__fz={ seed(v){ s=v>>>0; }, log:[], errs:0, maxArr:{}, ghosts:[], held:new Set(), hidden:false, assist:true, counts:{}, visits:{} };
  // let the fuzzer flip visibility (the real headless tab never hides)
  try{ Object.defineProperty(document,'hidden',{configurable:true,get(){ return F.hidden; }});
       Object.defineProperty(document,'visibilityState',{configurable:true,get(){ return F.hidden?'hidden':'visible'; }}); }catch(e){}
  window._noAutoPause=false;
  const KEYS=[' ',' ',' ',' ','Escape','Escape','Tab','r','R','Enter','f','m','w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','1','2','3','i','l','o','h','q','z','e','x','Shift','Backspace'];
  const codeOf=k=>k===' '?'Space':k.length===1?(/[0-9]/.test(k)?'Digit'+k:'Key'+k.toUpperCase()):k;
  function kd(k,rep){ const ev=new KeyboardEvent('keydown',{key:k,code:codeOf(k),repeat:!!rep,bubbles:true,cancelable:true}); (document.activeElement||document.body).dispatchEvent(ev); }
  function ku(k){ const ev=new KeyboardEvent('keyup',{key:k,code:codeOf(k),bubbles:true,cancelable:true}); (document.activeElement||document.body).dispatchEvent(ev); }
  function vis(el){ if(!el||!el.isConnected) return false; const r=el.getBoundingClientRect(); if(r.width<2||r.height<2) return false;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.05) return false;
    return !el.closest('.hidden'); }
  function buttons(){ return [...document.querySelectorAll('button,.btn,[onclick],.card,.idxTile,.vSeal,.vaultItem,.chip,a[href="#"],[data-tip],[role=button]')].filter(vis); }
  function pe(type,x,y,ptype,id,target){ const t=target||document.elementFromPoint(x,y)||document.body;
    t.dispatchEvent(new PointerEvent(type,{clientX:x,clientY:y,pointerType:ptype,pointerId:id,isPrimary:id<=2,button:0,buttons:type==='pointerup'?0:1,bubbles:true,cancelable:true,composed:true})); return t; }
  function te(type,pts,target){ try{ const t=target||document.getElementById('c');
    const tl=pts.map(p=>new Touch({identifier:p.id,target:t,clientX:p.x,clientY:p.y}));
    t.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'||type==='touchcancel'?[]:tl,targetTouches:tl,changedTouches:tl,bubbles:true,cancelable:true})); }catch(e){} }
  const W=()=>innerWidth, H=()=>innerHeight;
  const ACTS=[
    [30,'key',()=>{ const k=pick(KEYS); const m=R(); if(m<0.6){ kd(k); ku(k); } else if(m<0.8){ kd(k); F.held.add(k); } else { kd(k); kd(k,true); kd(k,true); ku(k); } }],
    [6,'release',()=>{ for(const k of F.held) ku(k); F.held.clear(); }],
    [14,'button',()=>{ const b=buttons(); if(!b.length) return; const el=pick(b); const r=el.getBoundingClientRect();
      const x=r.left+r.width/2, y=r.top+r.height/2; const pt=R()<0.5?'touch':'mouse';
      pe('pointerdown',x,y,pt,pt==='touch'?11:1,el); pe('pointerup',x,y,pt,pt==='touch'?11:1,el); el.click(); }],
    [10,'mouse',()=>{ const x=R()*W(), y=R()*H(); const t=pe('pointerdown',x,y,'mouse',1);
      for(let i=0;i<3;i++) pe('pointermove',x+R()*80-40,y+R()*80-40,'mouse',1,t); pe('pointerup',x,y,'mouse',1,window); if(R()<0.5) t.click&&t.click(); }],
    [12,'touchptr',()=>{ const id=2+((R()*4)|0); const x=R()*W(), y=R()*H(); const t=pe('pointerdown',x,y,R()<0.85?'touch':'pen',id);
      for(let i=0;i<4;i++) pe('pointermove',x+R()*120-60,y+R()*120-60,'touch',id,t);
      if(R()<0.7) pe(R()<0.85?'pointerup':'pointercancel',x,y,'touch',id,R()<0.5?t:window); }],
    [6,'touchev',()=>{ const n=1+((R()*3)|0); const pts=[]; for(let i=0;i<n;i++) pts.push({id:20+i,x:R()*W(),y:R()*H()});
      te('touchstart',pts); te('touchmove',pts.map(p=>({id:p.id,x:p.x+R()*40,y:p.y+R()*40}))); te(R()<0.8?'touchend':'touchcancel',pts); }],
    [3,'resizeEv',()=>{ window.dispatchEvent(new Event('resize')); }],
    [3,'visibility',()=>{ F.hidden=!F.hidden; document.dispatchEvent(new Event('visibilitychange')); }],
    [3,'blurfocus',()=>{ window.dispatchEvent(new Event(R()<0.5?'blur':'focus')); }],
    [3,'start',()=>{ if(state==='menu'){ try{ startGame(); }catch(e){ F.log.push('startGame threw '+e); } } }],
    [2,'quit',()=>{ if(state==='paused'||state==='playing'){ try{ quitToMenu(); }catch(e){ F.log.push('quit threw '+e); } } }],
    [2,'die',()=>{ if(state==='playing'&&P){ window.__bot.god=false; P.inv=0; P.hp=0; F.dieAt=window.__vc.vt; } }],
    [4,'xp',()=>{ if(state==='playing'&&P){ P.xp+=P.xpNext*(0.5+R()); } }],
    [2,'coins',()=>{ if(P){ P.coins+=((R()*400)|0); } }],
    [2,'time',()=>{ if(state==='playing'&&typeof gt==='number'){ gt+=R()*90; } }],
    [3,'assist',()=>{ F.assist=!F.assist; }],
  ];
  const TOT=ACTS.reduce((a,b)=>a+b[0],0);
  function act(){ let r=R()*TOT; for(const a of ACTS){ r-=a[0]; if(r<=0){ F.counts[a[1]]=(F.counts[a[1]]||0)+1; try{ a[2](); }catch(e){ F.log.push('act '+a[1]+' threw '+(e&&e.message)); } return a[1]; } } }
  function frame(){ F.visits[state]=(F.visits[state]||0)+1; window.__vc.step(16.7); if(F.assist){ try{ window.__bot.step(); }catch(e){} } if(F.dieAt && window.__vc.vt-F.dieAt>300){ window.__bot.god=true; F.dieAt=0; } }
  function arrays(){ const o={}; for(const k of ${JSON.stringify(Object.keys(BOUNDS))}){ let v; try{ v=eval(k); }catch(e){ v=null; } if(Array.isArray(v)){ o[k]=v.length; if(!(F.maxArr[k]>=v.length)) F.maxArr[k]=v.length; } } return o; }
  const LAYERS={slot:'slot',pause:'pauseLayer',wheel:'wheelLayer',crash:'crashLayer',gameover:'gameover',menu:'menu',jackpot:'jackpotLayer'};
  function shown(id){ const el=document.getElementById(id); return !!el && !el.classList.contains('hidden') && getComputedStyle(el).display!=='none'; }
  F.layers=()=>{ const o={}; for(const k in LAYERS) o[k]=shown(LAYERS[k]); return o; };
  // DOM and state must agree once the state has settled for a beat
  F.consistency=()=>{ const L=F.layers(), bad=[];
    if(state==='playing'){ for(const k of ['slot','pause','wheel','crash','gameover','menu','jackpot']) if(L[k]) bad.push(k+' visible while playing'); if(!shown('hud')) bad.push('hud hidden while playing'); }
    if(state==='menu'){ if(!L.menu) bad.push('menu hidden in menu state'); for(const k of ['slot','pause','wheel','crash','gameover']) if(L[k]) bad.push(k+' visible in menu'); }
    if(state==='paused' && !L.pause) bad.push('paused but no pause layer');
    if(state==='wheel' && !L.wheel) bad.push('wheel state but wheel hidden');
    if(state==='crash' && !L.crash) bad.push('crash state but ascent hidden');
    if(state==='dead' && !L.gameover) bad.push('dead but no ledger');
    return bad; };
  F.batch=(n)=>{ const out=[]; for(let i=0;i<n;i++){ out.push(act()); const k=1+((R()*R()*24)|0); for(let j=0;j<k;j++) frame();
      if(window._amErr){ F.errs++; F.log.push('_amErr after '+out.slice(-4).join(',')+' state='+state); window._amErr=0; } }
    arrays(); return out; };
  // drive the bot until the table is somewhere a player can act again
  F.recover=(max)=>{ for(const k of F.held) ku(k); F.held.clear(); F.assist=true; F.hidden=false; document.dispatchEvent(new Event('visibilitychange'));
    const t0=window.__vc.vt; let deadSeen=0;
    for(let i=0;i<max;i++){ frame();
      if(state==='dead'){ deadSeen++; window.__bot.res=null;
        if(deadSeen%40===0){ kd(' '); ku(' '); } if(deadSeen>400){ const b=document.getElementById('againBtn'); if(b) b.click(); } continue; }
      if(state==='playing'||state==='menu'){ let st=0; for(let j=0;j<30;j++){ frame(); } if(state==='playing'||state==='menu') return { ok:true, vt:Math.round(window.__vc.vt-t0), state }; }
    }
    return { ok:false, state, slotStage:typeof slotStage!=='undefined'?slotStage:null, layers:F.layers(), vt:Math.round(window.__vc.vt-t0),
      wheel: typeof wheel!=='undefined'&&wheel?{phase:wheel.phase,closed:wheel._closed}:null, crash: typeof crash!=='undefined'&&crash?{live:crash.live,done:crash.done,jk:crash.jk}:null,
      pending: typeof pending!=='undefined'?pending.length:null, marker: typeof markerRef!=='undefined'&&markerRef?markerRef.phase:null };
  };
  F.arrays=arrays;
  // a ghost must persist: transient slams (bigWin / BUST / PERFECT ride the jackpot layer) clear in <3s
  F.persistent=()=>{ const a=F.consistency(); if(!a.length) return []; const s0=state;
    for(let i=0;i<240;i++) frame(); if(state!==s0) return []; const b=F.consistency(); return a.filter(x=>b.includes(x)); };
})();`;

async function heapNow(cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  const h = await cdp.send('Runtime.getHeapUsage');
  return Math.round(h.usedSize / 1048576 * 10) / 10;
}

(async () => {
  const report = { seed: SEED, events: EVENTS, profiles: [], fail: [] };
  const per = Math.ceil(EVENTS / PROFILES.length);
  for (const pf of PROFILES) {
    const { browser, page, errors } = await launch({ which, mobile: pf.mobile, viewport: pf.viewport });
    // B3's DIALS → SEEK knocks on assets/music/{ctx}.{ogg,mp3,m4a} when the player asks: those 404s are by design
    let musicMiss = 0; page.on('requestfailed', rq => { if (/assets\/music\//.test(rq.url())) musicMiss++; });
    await page.evaluate(FUZZ);
    await page.evaluate(seed => { window.__fz.seed(seed); window.__bot.god = true; }, SEED + pf.name.length * 101);
    const t0 = Date.now();
    const R = { name: pf.name, events: 0, recover: [], stuck: [], ghosts: [], resizes: 0, states: {} };
    let rs = SEED * 7 + 3; const rnd = () => (rs = (rs * 1103515245 + 12345) % 2147483648) / 2147483648;
    const BATCH = 50;
    while (R.events < per) {
      if (rnd() < 0.12) { const [w, h] = SIZES[(rnd() * SIZES.length) | 0]; try { await page.evaluate(() => document.fullscreenElement && document.exitFullscreen().catch(() => {})); await page.setViewportSize({ width: w, height: h }); R.resizes++; } catch (e) { R.resizeFail = (R.resizeFail || 0) + 1; } }
      await page.evaluate(n => window.__fz.batch(n), BATCH);
      R.events += BATCH;
      // every few batches: settle and demand the table comes back
      if ((R.events / BATCH) % 3 === 0) {
        const rec = await page.evaluate(() => window.__fz.recover(4200));
        R.states[rec.state] = (R.states[rec.state] || 0) + 1;
        if (!rec.ok) { R.stuck.push(Object.assign({ at: R.events }, rec)); console.error(`  ✗ ${pf.name} STUCK at ${R.events}: ${JSON.stringify(rec)}`);
          // unstick so the run continues: back to the menu
          await page.evaluate(() => { try { quitToMenu(); } catch (e) {} });
        } else {
          const bad = await page.evaluate(() => window.__fz.persistent());
          if (bad.length) { R.ghosts.push({ at: R.events, bad }); console.error(`  ✗ ${pf.name} GHOST at ${R.events}: ${bad.join('; ')}`); }
        }
        R.recover.push(rec.vt);
      }
      if (R.events % 1000 === 0) console.error(`  ${pf.name}: ${R.events} events · ${errors.length} errors · ${Math.round((Date.now() - t0) / 1000)}s`);
    }
    const fz = await page.evaluate(() => ({ errs: window.__fz.errs, log: window.__fz.log.slice(0, 20), maxArr: window.__fz.maxArr, counts: window.__fz.counts, visits: window.__fz.visits }));
    Object.assign(R, fz);
    R.recoverMaxVt = Math.max(0, ...R.recover); delete R.recover;
    for (let k = errors.length - 1; k >= 0 && musicMiss > 0; k--) if (/Failed to load resource: net::ERR_FILE_NOT_FOUND/.test(errors[k])) { errors.splice(k, 1); musicMiss--; }
    R.errors = errors.slice(0, 10); R.errorCount = errors.length;
    R.realSec = Math.round((Date.now() - t0) / 1000);
    for (const k in BOUNDS) if (fz.maxArr[k] > BOUNDS[k]) report.fail.push(`${pf.name}: ${k} reached ${fz.maxArr[k]} (bound ${BOUNDS[k]})`);
    if (errors.length) report.fail.push(`${pf.name}: ${errors.length} page errors`);
    if (fz.errs) report.fail.push(`${pf.name}: _amErr ${fz.errs}x`);
    if (R.stuck.length) report.fail.push(`${pf.name}: ${R.stuck.length} stuck states`);
    if (R.ghosts.length) report.fail.push(`${pf.name}: ${R.ghosts.length} ghost layers`);
    console.error(`${pf.name}: ${R.events} events, ${R.errorCount} errors, ${R.stuck.length} stuck, ${R.ghosts.length} ghosts, ${R.realSec}s`);
    report.profiles.push(R);
    await browser.close();
  }

  // ---- heap: 5 consecutive nights in ONE page (desktop) ----
  if (HEAPN > 0 && (!ONLY || ONLY === 'desktop')) {
    const { browser, page, errors } = await launch({ which });
    const cdp = await page.context().newCDPSession(page);
    await page.evaluate(FUZZ);
    await page.evaluate(() => { window._noAutoPause = true; });
    const nights = [];
    for (let n = 0; n < HEAPN; n++) {
      // play one night: bot drives, death forced at 4:00 game time so nights are comparable
      const r = await page.evaluate(async () => {
        const B = window.__bot; B.res = null; B.god = true; let f = 0;
        if (state === 'menu') startGame();
        while (state !== 'dead' && f < 30000) {
          for (let i = 0; i < 200 && state !== 'dead'; i++, f++) { window.__vc.step(16.7); B.step(); if (state === 'playing' && gt > 240) { B.god = false; P.inv = 0; P.hp = 0; } }
          await null;
        }
        for (let i = 0; i < 400; i++) window.__vc.step(16.7); // the ledger writes itself
        const out = { gt: Math.round(gt), level: P.level, dom: document.getElementsByTagName('*').length - (($('wheelLayer')||document.createElement('i')).getElementsByTagName('*').length), // F1: the Wheel of Souls builds ~830 nodes once, the first night it manifests — lazy, not a leak frames: f, state,
          arr: window.__fz.arrays() };
        // re-ante the way a player does: SPACE (finish recap), SPACE (again)
        for (let k = 0; k < 2; k++) { window.__vc.step(600); window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true })); }
        for (let i = 0; i < 120; i++) { window.__vc.step(16.7); }
        out.after = state;
        return out;
      });
      r.heapMB = await heapNow(cdp);
      nights.push(r);
      console.error(`  heap night ${n + 1}: ${r.heapMB} MB · DOM ${r.dom} · died ${r.gt}s lvl ${r.level} · then ${r.after}`);
      if (r.after !== 'playing') { report.fail.push(`heap night ${n + 1}: re-ante left state ${r.after}`); await page.evaluate(() => { try { quitToMenu(); } catch (e) {} }); }
    }
    const h = nights.map(x => x.heapMB), d = nights.map(x => x.dom);
    const growth = h.length > 2 ? Math.round((h[h.length - 1] - h[1]) * 10) / 10 : 0;
    const domGrowth = d.length > 2 ? d[d.length - 1] - d[1] : 0;
    report.heap = { nights, heapMB: h, dom: d, growthMB_2toN: growth, domGrowth_2toN: domGrowth, errors: errors.slice(0, 5) };
    if (growth > 8) report.fail.push(`heap grew ${growth} MB from night 2 to night ${h.length}`);
    if (domGrowth > 400) report.fail.push(`DOM grew ${domGrowth} nodes from night 2 to night ${d.length}`);
    if (errors.length) report.fail.push(`heap run: ${errors.length} page errors`);
    await browser.close();
  }
  report.ok = report.fail.length === 0;
  console.log(JSON.stringify(report, null, 1));
  console.error(report.ok ? 'FUZZ: CLEAN' : 'FUZZ: ' + report.fail.length + ' FAILURES\n  ' + report.fail.join('\n  '));
  process.exit(report.ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
