// J0 — does game time keep pace with real time when frames are slow?
// node probes/pace.js [dist.html] [seconds=10]
// Plays to ~0:20 on the virtual clock, then steps fixed-length frames (16.7 / 60 / 100 / 150 ms)
// for N "real" seconds each and compares how far `gt` moved against what real time asks for
// (real seconds × 1.71 world speed). Frames that start or end in hit-stop, slow-mo, TAB-hold or a
// gambling screen are left out of both sides — those pause/slow the world on purpose.
// Gate: ≥95% at 60ms and 100ms. Exit 1 on a runtime error or a missed gate.
const path = require('path');
const { chromium } = require('playwright');
const file = process.argv[2] || path.join(__dirname, '..', 'dist', 'ante-mortem.html');
const SECS = +(process.argv[3] || 10);
const src = require('fs').readFileSync(path.join(__dirname, 'lib.js'), 'utf8');
const VC = src.slice(src.indexOf('const VCLOCK = `') + 16, src.indexOf('`;', src.indexOf('const VCLOCK = `')));
const BOT = src.slice(src.indexOf('const BOT = `') + 13, src.indexOf('`;', src.indexOf('const BOT = `')));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.addInitScript(VC); await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto('file://' + path.resolve(file)); await page.evaluate(BOT);
  await page.evaluate(() => { window.muted = true; window.__bot.god = true; window.__bot.renderEvery = 30; });
  await page.evaluate(async () => { for (let i = 0; i < 6000; i++) { window.__vc.step(16.7); window.__bot.step(); if (i % 10 === 9) await null; if (state === 'playing' && gt > 20) break; } });
  const out = {};
  for (const ms of [16.7, 60, 100, 150]) {
    out[ms + 'ms'] = await page.evaluate(async ({ ms, SECS }) => {
      const clean = () => state === 'playing' && !(hitstop > 0) && !(slowT > 0) && !tabHold;
      // a kill's hit-stop can start AND finish inside one long frame — watch every update() call
      let dirty = false; const u0 = window.update;
      window.update = function () { const r = u0.apply(this, arguments); if (!clean()) dirty = true; return r; };
      let exp = 0, got = 0, frames = 0, used = 0; const gStart = gt;
      const n = Math.round(SECS * 1000 / ms);
      for (let i = 0; i < n; i++) {
        const c0 = clean(), g0 = gt; dirty = false;
        window.__bot.step(); window.__vc.step(ms); frames++;
        if (c0 && !dirty && clean()) { exp += ms / 1000 * 1.71; got += gt - g0; used++; }
        if (i % 5 === 4) await null;
      }
      window.update = u0;
      // raw = everything, hit-stops and slots included (informative only)
      return { pace: exp ? +(got / exp * 100).toFixed(1) : null, raw: +((gt - gStart) / (n * ms / 1000 * 1.71) * 100).toFixed(1), framesUsed: used + '/' + frames, clock: fmt(gt) };
    }, { ms, SECS });
  }
  const amErr = await page.evaluate(() => !!window._amErr);
  const ok = out['60ms'].pace >= 95 && out['100ms'].pace >= 95 && !amErr && !errs.length;
  console.log(JSON.stringify({ ...out, amErr, errors: errs.slice(0, 5), gate: ok ? 'PASS' : 'FAIL' }));
  await browser.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
