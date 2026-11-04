#!/usr/bin/env node
// B2 screenshot set → shots/b2/: menu stake tag, Ante Room stakes (desktop + phone),
// a GILT-deck night with an adornment, THE NIGHT IS WON gate, the endless HUD, the endless ledger.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const OUT = path.join(ROOT, 'shots', process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'b2');
fs.mkdirSync(OUT, { recursive: true });
const SEED = () => { STK.won = 3; STK.best = { vesper: 3 }; STK.first = { 1: 1, 2: 1, 3: 1 }; STK.sel = 4; STK.cos = 'crown'; STK.endless = { best: 191, score: 48210, stake: 3, soul: 'vesper', mult: 1.6 }; };
async function shot(page, name, settle = 450) { await page.waitForTimeout(settle); await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 82 }); console.error('  ✓ ' + name); }
async function snap(page, name) { await page.evaluate(() => { window.__bot.renderEvery = 1; }); await run(page, 4); await shot(page, name); await page.evaluate(() => { window.__bot.renderEvery = 30; }); }
(async () => {
  const errs = [];
  {
    const { browser, page, errors } = await launch({});
    await page.evaluate(SEED);
    await page.evaluate(() => { window.__bot.renderEvery = 1; renderChips(); });
    for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    await shot(page, 'b1_menu', 600);
    await page.evaluate(() => { openAnteRoom(); const b = document.getElementById('anteBody'); const h = [...b.querySelectorAll('.anteH')].find(x => /STAKE/.test(x.textContent)); if (h) b.scrollTop = h.offsetTop - 20; });
    await shot(page, 'b2_ante_stakes');
    await page.evaluate(() => { document.getElementById('antePanel').classList.add('hidden'); window.__bot.god = true; STK.sel = 5; STK.best = { vesper: 4 }; startGame(); gt = 690; });
    await until(page, "state==='playing' && gt>705", 4000);
    await snap(page, 'b3_gilt_night_crown');
    await until(page, "state==='b2gate'", 30000);
    await page.evaluate(() => { window.__bot.noSpace = true; window.__bot.renderEvery = 1; });
    await run(page, 200); // the jackpot slam clears, the gate rises
    await shot(page, 'b4_night_won_gate', 700);
    await page.evaluate(() => { b2PressOn(); });
    await until(page, "state==='playing' && P._endless && gt-P._endT0>95", 30000);
    await snap(page, 'b5_endless_hud');
    await page.evaluate(() => { window.__bot.god = false; });
    await until(page, "state==='dead'", 60000);
    await run(page, 300);
    await snap(page, 'b6_endless_ledger');
    errs.push(...errors); await browser.close();
  }
  {
    const { browser, page, errors } = await launch({ mobile: true, viewport: { width: 390, height: 844 } });
    await page.evaluate(SEED);
    for (let i = 0; i < 60; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    await page.evaluate(() => { openAnteRoom(); const b = document.getElementById('anteBody'); const h = [...b.querySelectorAll('.anteH')].find(x => /STAKE/.test(x.textContent)); if (h) b.scrollTop = h.offsetTop - 10; });
    await shot(page, 'm1_ante_stakes');
    errs.push(...errors); await browser.close();
  }
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), errors: errs.slice(0, 8) }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
