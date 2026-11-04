#!/usr/bin/env node
// B2 perf gate: drive a GILT-deck night (god bot) to the ENDLESS FLOOR, let the
// court fill toward its 300 cap, then time 600 real frames (update + render,
// every frame rendered, GFX.q='high'), against a plain-night 300-storm baseline measured identically.
// node probes/b2perf.js [--src] [--frames 600] [--min-enemies 280] [--storm = baseline plain-night 300-storm]
'use strict';
const { launch, run, until } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
(async () => {
  // CPU-backed canvas flags are kept for reference; in this container the cost is raster either way.
  const args = opt('gpu', true) === true ? [] : ['--disable-accelerated-2d-canvas'];
  const N = +opt('frames', 600), MINE = +opt('min-enemies', 280);
  async function measure(page) {
    return page.evaluate(async (N) => {
      GFX.q = 'high'; window.__bot.renderEvery = 1;
      const rn = window.__realNow, f0 = window.frame, T = [], E = [];
      window.frame = function (now) { const t = rn(); f0(now); T.push(rn() - t); E.push(enemies.length); };
      for (let i = 0; i < N; i++) { window.__vc.step(16.7); try { window.__bot.step(); } catch (e) {} if (i % 10 === 9) await null; }
      window.frame = f0;
      const s = T.slice(30).sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(s.length * p))];
      let el = 0, bo = 0; for (const e of enemies) { if (e.elite) el++; if (e.boss) bo++; }
      return { frames: s.length, avg: +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(2), p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2),
        enemiesAvg: Math.round(E.reduce((a, b) => a + b, 0) / E.length), enemiesMax: Math.max(...E), elites: el, bosses: bo, clock: fmt(gt), endless: !!P._endless, mult: b2ScoreMult(), qLow, amErr: !!window._amErr };
    }, N);
  }
  const out = {}; let errs = [];
  { // BASELINE — a plain night, 300 walkers dropped around the player at 5:00
    const { browser, page, errors } = await launch({ which: opt('src', false) ? 'src' : 'dist', args });
    await page.evaluate(() => { window.__bot.god = true; });
    await run(page, 30);
    await page.evaluate(() => { startGame(); gt = 300; });
    await run(page, 30);
    await page.evaluate(() => { const T = ['shambler','husk','swarm','wraith','stalker','brute','shooter','elite'];
      for (let i = 0; enemies.length < 300 && i < 400; i++) { const a = Math.random() * 6.283, d = 300 + Math.random() * 900;
        spawnEnemy(T[i % T.length], clamp(P.x + Math.cos(a) * d, 20, CFG.arena - 20), clamp(P.y + Math.sin(a) * d, 20, CFG.arena - 20)); }
      waveGap = 999; });
    out.baseline = await measure(page); errs = errs.concat(errors); await browser.close();
    console.error('baseline storm:', JSON.stringify(out.baseline));
  }
  { // ENDLESS — a GILT-deck night driven through the House to the floor, filled toward its 300 cap
    const { browser, page, errors } = await launch({ which: opt('src', false) ? 'src' : 'dist', args });
    await page.evaluate(() => { window.__bot.god = true; STK.won = 1; STK.best = { vesper: 4 }; STK.sel = 5; });
    await run(page, 30);
    await page.evaluate(() => { gt = 700; }); // skip the early night — we are here for the floor below it
    out.reached = await until(page, "P && P._endless && enemies.length >= " + MINE, 60000);
    out.endless = await measure(page); errs = errs.concat(errors); await browser.close();
    console.error('endless floor:', JSON.stringify(out.endless));
  }
  // the gate: the endless floor may not cost more per frame than a plain 300-storm (+15% noise), and it
  // must respect its caps. The absolute 12ms budget is checked too, but this container rasterizes on a
  // software GPU (batched flushes of ~500ms land every ~6 frames on BOTH scenarios), so the relative
  // check is the one that can be trusted here; absolute numbers need real hardware.
  const B = out.baseline, E = out.endless;
  out.ratioAvg = +(E.avg / B.avg).toFixed(2); out.ratioP95 = +(E.p95 / B.p95).toFixed(2);
  out.capsOk = E.enemiesMax <= 300 && E.elites <= 8 && E.bosses <= 1;
  out.absoluteP95Ok = E.p95 <= 12;
  out.errors = errs.length;
  out.pass = out.reached && out.capsOk && (out.absoluteP95Ok || (out.ratioAvg <= 1.15 && out.ratioP95 <= 1.15)) && !errs.length;
  console.log(JSON.stringify(out, null, 1));
  if (errs.length) console.error(errs.slice(0, 5).join('\n'));
  process.exit(out.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
