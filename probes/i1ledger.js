#!/usr/bin/env node
// I1 — phone ledger: die at 390x844, scroll the ledger to its end, check nothing sits under the AGAIN coin.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] || 'ledger-after';
const OUT = path.join(ROOT, 'shots', 'i1'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
  await until(page, "state==='playing'", 4000);
  await run(page, 60 * 20);
  await page.evaluate(() => { window.__bot.god = false; if (P) P.hp = 1; });
  await until(page, "state==='dead'", 60000);
  for (let i = 0; i < 8; i++) await page.evaluate(() => { for (let j = 0; j < 50; j++) window.__vc.step(16.7); });
  await page.evaluate(() => { const g = document.getElementById('gameover'); g.scrollTop = g.scrollHeight; });
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => { for (let j = 0; j < 30; j++) window.__vc.step(16.7); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const g = document.getElementById('gameover'); g.scrollTop = g.scrollHeight; });
  }
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const coin = document.getElementById('tcBet').getBoundingClientRect();
    const hit = [];
    for (const e of document.querySelectorAll('#gameover .panel *')) {
      if (e.children.length) continue; const b = e.getBoundingClientRect(); if (!b.width || !(e.textContent || '').trim()) continue;
      if (getComputedStyle(e).visibility === 'hidden') continue;
      if (b.left < coin.right && b.right > coin.left && b.top < coin.bottom && b.bottom > coin.top) hit.push(e.textContent.trim().slice(0, 30));
    }
    return { coin: [coin.top, coin.bottom], hit };
  });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.join(OUT, label + '.jpg'), type: 'jpeg', quality: 82 });
  await browser.close();
  if (errors.length) { console.error(errors); process.exit(1); }
  process.exit(r.hit.length ? 2 : 0);
})();
