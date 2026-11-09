#!/usr/bin/env node
// J1 — THE FEED: posed shots of the gauge at each tier (desktop + phone) and a FEAST slot → shots/feed/
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const OUT = path.join(ROOT, 'shots', 'feed'); fs.mkdirSync(OUT, { recursive: true });
async function one(phone) {
  const vp = phone ? { width: 390, height: 844 } : { width: 1280, height: 720 };
  const { browser, page, errors } = await launch({ viewport: vp, mobile: phone });
  await until(page, "state==='playing'", 4000);
  await page.evaluate(() => { window.__bot.god = true; window.__bot.feedTier = 99; });
  await run(page, 60 * 25);
  await until(page, "state==='playing'", 8000);
  const tag = phone ? 'phone' : 'desk';
  for (const [t, ch] of [[0, 1.2], [1, 4.1], [2, 9.3], [3, 12.5]]) {
    await page.evaluate(({ ch }) => { if (!(P.ovT > 0)) startOvercharge(); P.ovT = 82; P.ovCharge = ch; P.ovAge = 0; }, { ch });
    await page.evaluate(() => { window.__bot.renderEvery = 1; window.__bot.manual = true; });
    await run(page, 30); await page.evaluate(() => { P.ovT = 80; });
    await run(page, 2); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, `${tag}_tier${t}.jpg`), type: 'jpeg', quality: 82 });
  }
  const tiers = await page.evaluate(() => P.ovTier);
  await page.evaluate(() => { window.__bot.noSlotTap = true; P.xp = P.xpNext; cashRage(); });
  await run(page, 90); await page.waitForTimeout(600);
  const st = await page.evaluate(() => ({ state, tier: slotTierNow, head: (document.querySelector('#payTable .ptHead') || {}).textContent }));
  await page.screenshot({ path: path.join(OUT, `${tag}_feast_slot.jpg`), type: 'jpeg', quality: 82 });
  console.log(tag, 'tierReached', tiers, JSON.stringify(st), 'errors', errors.length);
  await browser.close();
  return errors.length;
}
(async () => { let e = 0; e += await one(false); e += await one(true); process.exit(e ? 1 : 0); })();
