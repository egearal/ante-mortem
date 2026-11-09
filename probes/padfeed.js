#!/usr/bin/env node
// J-wave pad proof: with a gamepad alone — the d-pad reaches ✒ THE LESSON on the menu, Ⓐ cashes THE FEED,
// Ⓐ launches and cashes the self-climbing Ascent. Exit 1 on any failed check or runtime error.
'use strict';
const fs = require('fs'), path = require('path');
const { launch } = require('./lib');
const FAKE = fs.readFileSync(path.join(__dirname, 'pad.js'), 'utf8').match(/const FAKE = `([\s\S]*?)`;/)[1];
(async () => {
  const { browser, page, errors } = await launch({});
  const fails = [], log = []; const ok = (c, m) => (c ? log : fails).push((c ? '✓ ' : '✗ ') + m);
  const step = (n = 1) => page.evaluate(n => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n);
  const press = async (i) => { await page.evaluate(i => { const b = __pad.buttons[i]; b.pressed = true; b.value = 1; }, i); await step(3);
    await page.evaluate(i => { const b = __pad.buttons[i]; b.pressed = false; b.value = 0; }, i); await step(3); };
  const A = 0, START = 9, DOWN = 13, RIGHT = 15;
  const focus = () => page.evaluate(() => { const f = document.querySelector('.b3Focus'); return f ? (f.id || f.textContent.trim().slice(0, 20)) : null; });
  await page.evaluate(() => { window.__bot.startedAt = 1; }); // the bot must not deal the night itself
  await step(30); await page.evaluate(FAKE); await page.waitForTimeout(1200); await step(30);
  let found = false;
  for (let i = 0; i < 24 && !found; i++) { const f = await focus(); if (f && /lesson/i.test(f)) found = true; else await press(i < 12 ? DOWN : RIGHT); }
  ok(found, 'd-pad reaches ✒ THE LESSON (' + await focus() + ')');
  await page.evaluate(() => { const b = document.querySelector('.b3Focus'); if (b) b.classList.remove('b3Focus'); });
  await page.evaluate(() => { window.__bot.startedAt = 0; window.__bot.god = true; window.__bot.manual = true; window.__bot.noSlotTap = false; });
  await page.evaluate(() => startGame()); await step(60);
  ok(await page.evaluate(() => state) === 'playing', 'a night is dealt');
  await page.evaluate(() => { P.xp = P.xpNext; gainXP(0); P.ovCharge = 7.5; }); await step(10);
  const t0 = await page.evaluate(() => ({ ov: P.ovT, tier: P.ovTier }));
  ok(t0.ov > 0 && t0.tier === 2, 'the feed runs HOT (' + JSON.stringify(t0) + ')');
  await press(A); await step(10);
  const t1 = await page.evaluate(() => ({ ov: P.ovT, st: state, tier: slotTierNow }));
  ok(t1.ov === 0 && t1.st === 'slot' && t1.tier === 2, 'Ⓐ cashes the feed into a HOT slot (' + JSON.stringify(t1) + ')');
  await page.evaluate(() => { window.__bot.noSlotTap = false; }); for (let i = 0; i < 40 && await page.evaluate(() => state) !== 'playing'; i++) await step(30);
  await page.evaluate(() => { window.__bot.noSlotTap = true; crash.rigCp = 9; openCrash(); }); await step(20);
  await page.evaluate(() => { window.__bot.manual = true; });
  ok(await page.evaluate(() => state) === 'crash', 'the Ascent opens');
  // the bot would cash on its own at 2.9x — park it out of crash
  await page.evaluate(() => { const s = window.__bot.step; window.__bot.step = function () { if (state === 'crash') return; return s.apply(this, arguments); }; });
  await press(A); await step(20);
  ok(await page.evaluate(() => crash.live), 'Ⓐ launches the climb');
  for (let i = 0; i < 200 && await page.evaluate(() => crash.mult < 2.0); i++) await step(5);
  await press(A); await step(5);
  const c = await page.evaluate(() => ({ live: crash.live, done: crash.done, m: +crash.mult.toFixed(2) }));
  ok(!c.live && c.done && c.m >= 1.77, 'Ⓐ cashes the Ascent on rung I (' + JSON.stringify(c) + ')');
  console.log(log.concat(fails).join('\n')); if (errors.length) console.log(errors.slice(0, 3));
  await browser.close(); process.exit(fails.length || errors.length ? 1 : 0);
})();
