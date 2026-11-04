#!/usr/bin/env node
// node probes/perf.js [--src] [--enemies 300] [--q high|low] [--phone] [--cpu 4] [--secs 15]
//   [--matrix]   runs the B4 budget matrix: {300,500} enemies × {desktop q=high, phone q=low cpu×4}
//
// REAL-clock frame profile with ?prof. The night is pinned: god mode, XP and
// level-ups suppressed (no slot interrupts), and the court topped up to exactly
// N enemies every 200ms in a ring 280–760px around Vesper, so every sample sees
// the same load. Reports render() p95/avg from window.__prof (JS cost of a frame),
// spikes >25/40ms, the worst stages, and the real rAF interval p95.
// Headless Chromium rasterizes in software: rAF numbers are a floor, not a phone.
'use strict';
const { launch, target } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const which = opt('src', false) ? 'src' : 'dist';
const BOT = require('fs').readFileSync(__dirname + '/lib.js', 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];

async function one({ n, q, phone, cpu, secs }) {
  const { browser, page, errors } = await launch({ which, mobile: phone, vclock: false,
    viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 720 } });
  const cdp = await page.context().newCDPSession(page);
  await page.goto(target(which) + '?prof');
  await page.evaluate(BOT);
  await page.waitForTimeout(600);
  await page.evaluate(({ q }) => {
    window.muted = true; window.__bot.god = true; window.__bot.renderEvery = 1;
    try { applyGfxPreset(q); } catch (e) { GFX.q = q; }
    startGame();
  }, { q });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.evaluate(({ n }) => {
    const ring = () => { if (state !== 'playing' || !P) return;
      P.xp = 0; P.hp = P.maxHp; pending.length = 0;
      const types = Object.keys(CFG.enemy).filter(t => !/boss|house|elite/i.test(t) && !(BOSS_DEFS && BOSS_DEFS[t]));
      while (enemies.length > n) enemies.pop();
      let k = 0; while (enemies.length < n && k++ < 200) { const a = Math.random() * 6.283, d = 280 + Math.random() * 480;
        spawnEnemy(types[(Math.random() * types.length) | 0], clamp(P.x + Math.cos(a) * d, 30, CFG.arena - 30), clamp(P.y + Math.sin(a) * d, 30, CFG.arena - 30)); }
      for (const e of enemies) e.hp = Math.max(e.hp, e.maxhp * 0.5); // they live, so the count holds
    };
    setInterval(ring, 200); ring();
    // the bot steers in real time (keys + aim), never gambles
    setInterval(() => { try { if (state === 'playing') window.__bot.step(); else if (state !== 'dead') { /* close anything that opened */ } } catch (e) {} }, 16);
    window.__raf = []; let last = performance.now();
    const tick = t => { window.__raf.push(t - last); last = t; if (window.__raf.length > 4000) window.__raf.shift(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { n });
  await page.waitForTimeout(5000);
  await page.evaluate((t) => { window.__topN = t; window.__prof.reset(); window.__raf.length = 0; }, +opt('stages', 5));
  if (opt('bench', false)) {
    // A/B mode: the same world rendered back-to-back (raster forced between calls, outside the timing)
    for (let k = 0; k < 12; k++) {
      await page.waitForTimeout(250);
      await page.evaluate(() => { const PR = window.__prof; for (let i = 0; i < 25; i++) { PR.frameStart(); render(); PR.frameEnd(); ctx.getImageData(0, 0, 1, 1); } });
    }
  } else await page.waitForTimeout(secs * 1000);
  const r = await page.evaluate(() => {
    const rep = window.__prof.report(); const a = window.__raf.slice().sort((x, y) => x - y);
    const st = Object.entries(rep.stages).sort((x, y) => y[1] - x[1]).slice(0, +(window.__topN || 5)).map(([k, v]) => k + ' ' + v.toFixed(2));
    return { avgMs: rep.avgMs, p95Ms: rep.p95Ms, spikes25: rep.spikes25, spikes40: rep.spikes40, frames: rep.frames, topStages: st, spikeStage: rep.spikeStage,
      rafP95: a.length ? +a[Math.floor(a.length * 0.95)].toFixed(1) : null, rafAvg: a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null,
      enemies: enemies.length, state, qLow, DPR, parts: parts.length };
  });
  await browser.close();
  return Object.assign({ n, q, phone, cpu, errors: errors.slice(0, 3) }, r);
}

(async () => {
  const secs = +opt('secs', 15);
  const runs = opt('matrix', false)
    ? [[300, 'high', false, 1], [500, 'high', false, 1], [300, 'low', true, 4], [500, 'low', true, 4], [300, 'low', false, 1], [300, 'high', true, 4]]
    : [[+opt('enemies', 300), opt('q', 'high'), !!opt('phone', false), +opt('cpu', opt('phone', false) ? 4 : 1)]];
  const out = [];
  for (const [n, q, phone, cpu] of runs) {
    const r = await one({ n, q, phone, cpu, secs });
    const budget = phone ? 16 : 12;
    r.budget = budget; r.ok = r.p95Ms <= budget;
    console.error(`${phone ? 'phone×' + cpu : 'desktop'} q=${q} ${n} enemies: render p95 ${r.p95Ms}ms avg ${r.avgMs}ms · spikes>25 ${r.spikes25} >40 ${r.spikes40} · rAF p95 ${r.rafP95}ms · [${r.topStages.join(', ')}] ${r.ok ? '✓' : '✗ over ' + budget}`);
    out.push(r);
  }
  console.log(JSON.stringify(out, null, 1));
  process.exit(out.some(r => r.errors.length) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
