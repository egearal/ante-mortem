#!/usr/bin/env node
// I1 — phone top band: force banner + tarot card + 3 curses at once at 390x844, measure overlaps, screenshot.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] || 'i1-top';
const OUT = path.join(ROOT, 'shots', 'i1'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
  await until(page, "state==='playing'", 4000);
  await run(page, 60 * 8);
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) applyDebuff(DEBUFF_POOL[i]);
    announce('☸ THE WHEEL OF SOULS MANIFESTS ☸', true);
    revealTarot(TAROT_FATES.find(c => c.n === 'TOWER REVERSED') || TAROT_FATES[0]);
  });
  await run(page, 20); await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { l: b.left, r: b.right, t: b.top, b: b.bottom } : null; };
    const o = { ann: box('#announce'), card: box('#tarotReveal .trCard'), curses: box('#debuffs'), hud: box('#hud') };
    const hit = (a, b) => a && b && a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    o.overlaps = [['ann', 'card'], ['ann', 'curses'], ['card', 'curses']].filter(([a, b]) => hit(o[a], o[b])).map(x => x.join('×'));
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
  await page.screenshot({ path: path.join(OUT, label + '.jpg'), type: 'jpeg', quality: 82 });
  await browser.close();
  if (errors.length) { console.error(errors); process.exit(1); }
  process.exit(r.overlaps.length ? 2 : 0);
})();
