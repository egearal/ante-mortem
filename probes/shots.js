#!/usr/bin/env node
// npm run shots -- <label>   → shots/<label>/*.jpg
// Deterministic-ish screenshot set for judging visual work: menu, play at 0:30
// and 3:00 (god-mode bot), the slot mid-spin, the death ledger, and phone
// portrait menu + play. Uses the virtual clock, renders every frame near a shot.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'current';
const which = process.argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', label);
fs.mkdirSync(OUT, { recursive: true });

async function snap(page, name) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await run(page, 4);
  await page.waitForTimeout(450); // let CSS transitions settle (they run on real time)
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 82 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('  ✓ ' + name);
}

(async () => {
  const errs = [];
  // desktop
  {
    const { browser, page, errors } = await launch({ which });
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'd1_menu.jpg'), type: 'jpeg', quality: 82 }); console.error('  ✓ d1_menu');
    await page.evaluate(() => { window.__bot.god = true; window.__bot.noSlotTap = true; });
    await until(page, "state==='slot'", 20000);
    await run(page, 50);
    await snap(page, 'd2_slot');
    await page.evaluate(() => { window.__bot.noSlotTap = false; });
    await until(page, "state==='playing' && gt>30", 20000);
    await snap(page, 'd3_play_0m30');
    await until(page, "state==='playing' && gt>180", 40000);
    await snap(page, 'd4_play_3m00');
    await page.evaluate(() => { window.__bot.god = false; });
    await until(page, "state==='dead'", 60000);
    await run(page, 240);
    await snap(page, 'd5_death');
    errs.push(...errors);
    await browser.close();
  }
  // phone portrait
  {
    const { browser, page, errors } = await launch({ which, mobile: true, viewport: { width: 390, height: 844 } });
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'm1_menu.jpg'), type: 'jpeg', quality: 82 }); console.error('  ✓ m1_menu');
    await page.evaluate(() => { window.__bot.god = true; });
    await until(page, "state==='playing' && gt>40", 20000);
    await snap(page, 'm2_play');
    errs.push(...errors);
    await browser.close();
  }
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), errors: errs.slice(0, 8) }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
