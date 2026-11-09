#!/usr/bin/env node
// J2 — THE ASCENT v3: posed shots (ladder mid-climb, THE ARMORY, the 7.77 jackpot) on desktop + phone → shots/ascent3/
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const OUT = path.join(ROOT, 'shots', 'ascent3'); fs.mkdirSync(OUT, { recursive: true });
const snap = async (page, n) => { await page.evaluate(() => { window.__bot.renderEvery = 1; }); await run(page, 2); await page.waitForTimeout(450); await page.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 82 }); };
async function ride(page, cp, cashAt) {
  await until(page, "state==='playing'", 20000);
  await page.evaluate(({ cp }) => { crash.rigCp = cp; openCrash(); }, { cp });
  await run(page, 30);
  await page.evaluate(() => { if (!crash.live && !crash.done) window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); });
  let m = 0; for (let i = 0; i < 1500 && m < cashAt; i++) { await run(page, 3); m = await page.evaluate(() => crash.live ? crash.mult : 99); }
}
async function one(phone) {
  const tag = phone ? 'phone' : 'desk';
  const vp = phone ? { width: 390, height: 844 } : { width: 1280, height: 720 };
  const { browser, page, errors } = await launch({ viewport: vp, mobile: phone });
  await until(page, "state==='playing'", 4000);
  await page.evaluate(() => { window.__bot.god = true; window.__bot.noSpace = true; window.__bot.crashAt = 99; window.__bot.holdCards = true; });
  await run(page, 600);
  // 1 — mid-climb, rung II lit
  await ride(page, 9, 3.2); await snap(page, tag + '_climb');
  const lv0 = await page.evaluate(() => P.level);
  for (let i = 0; i < 400; i++) { await run(page, 3); if (await page.evaluate(() => !crash.live || crash.mult >= 3.8)) break; }
  await page.evaluate(() => { window.__bot.noSlotTap = true; crash._botHold = 1; });
  await page.evaluate(() => cashCrash()); await run(page, 125); await snap(page, tag + '_armory');
  const arm = await page.evaluate(() => ({ jk: crash.jk, n: (crash.jkOpts || []).length, names: (crash.jkOpts || []).map(o => o.def.n + ':' + o.def.rar) }));
  await page.evaluate(() => pickJackpot(0)); await run(page, 200);
  // 2 — the summit
  await ride(page, 12, 99); await run(page, 160); await snap(page, tag + '_jackpot');
  const jk = await page.evaluate(() => ({ jk: crash.jk, pend: pending.length, lvl: P.level }));
  await page.evaluate(() => pickJackpot(0)); await run(page, 260);
  const after = await page.evaluate(() => ({ state, slotTierNow, lvl: P.level }));
  console.log(tag, JSON.stringify({ lv0, arm, jk, after }), 'errors', errors.length, errors.slice(0, 3));
  await browser.close(); return errors.length;
}
(async () => { let e = await one(false); e += await one(true); process.exit(e ? 1 : 0); })();
