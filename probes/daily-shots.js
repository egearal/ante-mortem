#!/usr/bin/env node
// node probes/daily-shots.js [label] [--src]   → shots/<label>/ (default shots/b1)
// B1 screenshot set: the DAILY DEBT menu plaque (desktop + phone), the debt's
// opening announce, the daily death ledger (scored), a practice ledger, and the
// daily share card PNG.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'b1';
const which = process.argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', label);
fs.mkdirSync(OUT, { recursive: true });
async function snap(page, name) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await run(page, 4);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 84 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('  ✓ ' + name);
}
async function menuIdle(page) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
  await page.waitForTimeout(600);
}
(async () => {
  const errs = [];
  {
    const { browser, page, errors } = await launch({ which });
    // a returning player: a 3-day streak and a best on the books
    await page.evaluate(() => { const t = dlyToday(); DLY.data.streak = 3; DLY.data.lastDay = dlyPrev(t); DLY.data.bestT = 371; DLY.data.days[dlyPrev(t)] = { n: dlyNum(dlyPrev(t)), s: 1, done: 1, t: 371, lvl: 9, track: '♠♠♦♠★♠☠' }; dlyPlaque(); });
    await menuIdle(page);
    await page.screenshot({ path: path.join(OUT, 'b1_menu_plaque.jpg'), type: 'jpeg', quality: 84 }); console.error('  ✓ b1_menu_plaque');
    const pl = await page.$('#dlyPlaque'); if (pl) { await pl.screenshot({ path: path.join(OUT, 'b1_plaque_close.png') }); console.error('  ✓ b1_plaque_close'); }
    await page.evaluate(() => { window.__bot.god = true; DLY.next = 'daily'; startGame(); });
    await run(page, 30);
    await snap(page, 'b1_daily_open');
    await until(page, "state==='playing' && gt>250", 80000);
    await page.evaluate(() => { window.__bot.god = false; P.markerUsed = true; die(); });
    await until(page, "state==='dead'", 20000);
    await run(page, 420);
    await snap(page, 'b1_daily_ledger');
    // the share card
    await page.evaluate(() => { const b = document.querySelector('#a3Share .a3ShareBtn'); if (b) b.click(); });
    await run(page, 30); await page.waitForTimeout(900);
    const line = await page.evaluate(() => { try { return a3Line(a3Night()); } catch (e) { return String(e); } });
    console.error('  share line:\n' + line);
    fs.writeFileSync(path.join(OUT, 'b1_share_line.txt'), line + '\n');
    const png = await page.evaluate(() => { try { return a3Card(a3Night()).toDataURL('image/png'); } catch (e) { return null; } });
    if (png) { fs.writeFileSync(path.join(OUT, 'b1_share_card.png'), Buffer.from(png.split(',')[1], 'base64')); console.error('  ✓ b1_share_card'); }
    await page.screenshot({ path: path.join(OUT, 'b1_share_modal.jpg'), type: 'jpeg', quality: 84 }); console.error('  ✓ b1_share_modal');
    // a practice attempt of the same debt
    await page.evaluate(() => { const x = document.querySelector('#a3Share .a3ShareX'); if (x) x.click(); });
    await page.evaluate(() => { window.__bot.god = false; document.getElementById('againBtn').click(); });
    await until(page, "state==='playing' && gt>20", 20000);
    await page.evaluate(() => { P.markerUsed = true; die(); });
    await until(page, "state==='dead'", 20000);
    await run(page, 300);
    await snap(page, 'b1_practice_ledger');
    // back to the menu: the plaque now shows today's result
    await page.evaluate(() => { document.getElementById('goMenuBtn').click(); });
    await menuIdle(page);
    await page.screenshot({ path: path.join(OUT, 'b1_menu_after.jpg'), type: 'jpeg', quality: 84 }); console.error('  ✓ b1_menu_after');
    const saved = await page.evaluate(() => localStorage.getItem('am_daily_v1'));
    console.error('  am_daily_v1 = ' + saved);
    errs.push(...errors);
    await browser.close();
  }
  {
    const { browser, page, errors } = await launch({ which, mobile: true, viewport: { width: 390, height: 844 } });
    await menuIdle(page);
    await page.screenshot({ path: path.join(OUT, 'b1_phone_menu.jpg'), type: 'jpeg', quality: 84 }); console.error('  ✓ b1_phone_menu');
    await page.evaluate(() => { window.__bot.god = true; DLY.next = 'daily'; startGame(); });
    await until(page, "state==='playing' && gt>90", 40000);
    await page.evaluate(() => { window.__bot.god = false; P.markerUsed = true; die(); });
    await until(page, "state==='dead'", 20000);
    await run(page, 420);
    await snap(page, 'b1_phone_ledger');
    errs.push(...errors);
    await browser.close();
  }
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), errors: errs.slice(0, 8) }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
