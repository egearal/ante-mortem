#!/usr/bin/env node
// node probes/seats.js [label]  → shots/<label>/ (default d1-seats)
// D1 THE SEATS: portrait sheet (every soul, sealed + seated), the Ante Room on
// desktop and phone (half the seats sealed, then all open), the unlock toast,
// the Cardsharp's tell in the slot, the Magpie's golden chip, the death ledger.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'd1-seats';
const which = process.argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', label);
fs.mkdirSync(OUT, { recursive: true });
const shot = async (page, name, opt = {}) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, name + '.' + (opt.png ? 'png' : 'jpg')), type: opt.png ? 'png' : 'jpeg', quality: opt.png ? undefined : 85, clip: opt.clip }); console.error('  ✓ ' + name); };
const settle = async (page, n = 60) => { await page.evaluate((n) => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n); };
// seat some souls: real unlock conditions met through the stats they read
const unlockHalf = () => { RANK.rank = 14; RANK._ld = 1; LT.deaths = 30; LT.triples = 3; LT.rites = 4; LT.coins = 3120; SEATS.st.rage = 6; };

(async () => {
  const errs = [];
  {
    const { browser, page, errors } = await launch({ which, viewport: { width: 1280, height: 860 } });
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    await settle(page, 90);
    // 1 — the portrait sheet: seated row over sealed row
    await page.evaluate(() => {
      const d = document.createElement('div'); d.id = 'd1sheet';
      d.style.cssText = 'position:fixed;inset:0;z-index:999;background:#0a0407;display:flex;flex-direction:column;gap:18px;align-items:center;justify-content:center;font-family:Cinzel,serif;color:#e6d9c2';
      const row = (locked) => '<div style="display:flex;gap:14px">' + SOULS.map(s => '<div style="text-align:center;width:112px"><img src="' + soulPortraitURL(s.id, locked) + '" style="width:112px;height:134px"><div style="font-size:10px;letter-spacing:.1em;color:' + s.col + ';margin-top:4px">' + s.g + ' ' + s.n + '</div></div>').join('') + '</div>';
      d.innerHTML = row(false) + row(true); document.body.appendChild(d);
    });
    await shot(page, 's1_portraits', { png: true });
    // 2 — big portraits, 2 per soul pair for detail
    await page.evaluate(() => { const d = document.getElementById('d1sheet');
      d.innerHTML = '<div style="display:grid;grid-template-columns:repeat(5,200px);gap:16px 22px">' + SOULS.map(s => '<div style="text-align:center"><img src="' + soulPortraitURL(s.id) + '" style="width:200px;height:240px"><div style="font-size:12px;letter-spacing:.12em;color:' + s.col + '">' + s.n + '</div></div>').join('') + '</div>'; });
    await shot(page, 's2_portraits_large', { png: true });
    await page.evaluate(() => document.getElementById('d1sheet').remove());
    // 3 — the Ante Room with half the seats taken
    await page.evaluate(unlockHalf); await page.evaluate(() => { SEATS.seen = SOULS.map(s => s.id); openAnteRoom(); });
    await settle(page, 30); await shot(page, 's3_anteroom_desktop');
    await page.evaluate(() => { const b = document.getElementById('anteBody'); if (b) b.scrollTop = 260; }); await settle(page, 10); await shot(page, 's3b_anteroom_desktop_scrolled');
    await page.evaluate(() => { document.getElementById('antePanel').classList.add('hidden'); });
    // 4 — the unlock ceremony (Martyr earns the seat)
    await page.evaluate(() => { SEATS.seen = SOULS.map(s => s.id).filter(x => x !== 'martyr'); LT.rites = 10; seatSweep(); });
    await settle(page, 70); await shot(page, 's4_unlock_toast');
    await settle(page, 500);
    // 5 — the Index SEATS section
    await page.evaluate(() => { openIndexPanel(); const s = [...document.querySelectorAll('.idxSec')].find(x => /THE SEATS/.test(x.textContent)); if (s) s.scrollIntoView({ block: 'center' }); });
    await settle(page, 20); await shot(page, 's5_index_seats');
    await page.evaluate(() => { document.getElementById('indexPanel').classList.add('hidden'); });
    // 6 — the Cardsharp's tell
    await page.evaluate(() => { LT.triples = 3; IDX.sl = 'sharp'; window.__bot.noSlotTap = true; window.__bot.god = true; window.__bot.renderEvery = 30; });
    await until(page, "state==='slot' && slotStage==='ready'", 30000);
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    await settle(page, 40); await shot(page, 's6_cardsharp_tell');
    await page.evaluate(() => { P.coins = 60; sharpRedeal(); }); await settle(page, 30); await shot(page, 's6b_cardsharp_redealt');
    // check the tell is honoured through the whole pull
    const tell = await page.evaluate(() => ({ n: slotFate ? null : null, t: window._sharpTell ? Object.assign({}, window._sharpTell) : null }));
    await page.evaluate(() => { window.__bot.noSlotTap = false; });
    await until(page, "state==='playing'", 20000);
    const got = await page.evaluate(() => ({ fate: slotFate, last: window.__d1last || null }));
    console.error('  tell ' + JSON.stringify(tell.t) + ' → fate ' + JSON.stringify(got.fate));
    errs.push(...errors);
    await browser.close();
  }
  // 7 — the Magpie's golden chip, mid-night
  {
    const { browser, page, errors } = await launch({ which });
    await page.evaluate(() => { window.__bot.renderEvery = 30; const s = SOULS.find(x => x.id === 'magpie'); s.u = () => true; IDX.sl = 'magpie'; window.__bot.god = true; });
    await until(page, "state==='playing' && gt>20", 20000);
    await page.evaluate(() => { for (let i = 0; i < 4; i++) coins.push({ x: P.x + 60 + i * 30, y: P.y + 40, r: 6, vx: 0, vy: 0, _d1: 1, gold: 1 }); });
    await settle(page, 4);
    await page.evaluate(() => { window.__bot.renderEvery = 1; }); await shot(page, 's7_magpie_chips');
    await page.evaluate(() => { const c = coins.find(x => x.gold); if (c) magpieChip(c); });
    await settle(page, 72); await shot(page, 's7b_magpie_chipslot');
    errs.push(...errors);
    await browser.close();
  }
  // 8 — the death ledger with the portrait (the Martyr)
  {
    const { browser, page, errors } = await launch({ which });
    await page.evaluate(() => { window.__bot.renderEvery = 30; const s = SOULS.find(x => x.id === 'martyr'); s.u = () => true; IDX.sl = 'martyr'; });
    await until(page, "state==='dead'", 80000);
    await page.evaluate(() => { for (let k = 0; k < 240; k++) window.__vc.step(16.7); window.__bot.renderEvery = 1; });
    await page.waitForTimeout(800); await shot(page, 's8_death_ledger');
    errs.push(...errors);
    await browser.close();
  }
  // 9 — phone: the Ante Room in portrait
  {
    const { browser, page, errors } = await launch({ which, mobile: true, viewport: { width: 390, height: 844 } });
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    await settle(page, 90);
    await page.evaluate(unlockHalf); await page.evaluate(() => { SEATS.seen = SOULS.map(s => s.id); openAnteRoom(); });
    await settle(page, 30); await shot(page, 's9_anteroom_phone');
    await page.evaluate(() => { const b = document.getElementById('anteBody'); if (b) b.scrollTop = 900; }); await settle(page, 10); await shot(page, 's9b_anteroom_phone_scrolled');
    await page.evaluate(() => { document.getElementById('antePanel').classList.add('hidden'); SEATS.seen = SOULS.map(s => s.id).filter(x => x !== 'sharp'); seatSweep(); });
    await settle(page, 70); await shot(page, 's9c_unlock_toast_phone');
    errs.push(...errors);
    await browser.close();
  }
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), errors: errs.slice(0, 8) }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
