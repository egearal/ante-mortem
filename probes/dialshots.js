#!/usr/bin/env node
// node probes/dialshots.js [label]  — THE DIALS with mouse + keyboard (desktop) and on a phone.
// Checks the click-a-keycap → press-a-key rebinding flow and writes shots/<label>/k*.jpg, p*.jpg.
'use strict';
const path = require('path');
const fs = require('fs');
const { launch, ROOT } = require('./lib');
const label = process.argv[2] || 'b3';
const dir = path.join(ROOT, 'shots', label); fs.mkdirSync(dir, { recursive: true });

(async () => {
  const fails = [], log = [];
  const ok = (c, m) => (c ? log : fails).push((c ? '✓ ' : '✗ ') + m);
  // desktop: mouse + keyboard
  {
    const { browser, page, errors } = await launch({});
    const step = n => page.evaluate(n => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n);
    await page.waitForTimeout(1100); await step(20);
    await page.click('#gfxBtn'); await step(12);
    ok(await page.evaluate(() => !$('b3Dials').classList.contains('hidden')), 'OPTIONS (mouse) opens THE DIALS');
    await page.click('.b3Bind[data-act="up"]'); await step(2);
    ok(await page.evaluate(() => B3C.act && B3C.act.id === 'up'), 'clicking MOVE UP listens for a key');
    await page.screenshot({ path: path.join(dir, 'k1_dials_listening.jpg'), type: 'jpeg', quality: 86 });
    await page.keyboard.press('i'); await step(2);
    ok(await page.evaluate(() => DIALS.binds.up === 'i' && !B3C.act), 'pressing I binds MOVE UP to I');
    await page.click('.b3Bind[data-act="bet"]'); await step(2);
    await page.keyboard.press('i'); await step(2);
    ok(await page.evaluate(() => DIALS.binds.bet === 'i' && DIALS.binds.up === ' '), 'BET onto I swaps MOVE UP onto SPACE');
    await page.screenshot({ path: path.join(dir, 'k2_dials_swapped.jpg'), type: 'jpeg', quality: 86 });
    await page.click('.b3Bind[data-act="pause"]'); await step(2);
    await page.keyboard.press('Escape'); await step(2);
    ok(await page.evaluate(() => !B3C.act && !DIALS.binds.pause && !$('b3Dials').classList.contains('hidden')), 'ESC while listening keeps the old key (panel stays)');
    await page.click('#b3KeyReset'); await step(2);
    ok(await page.evaluate(() => Object.keys(DIALS.binds).length === 0), 'RESET KEYS deals the House keys again');
    await page.keyboard.press(' '); await step(4);
    ok(await page.evaluate(() => state === 'menu'), 'SPACE under the dials does not start a night');
    await page.keyboard.press('Escape'); await step(6);
    ok(await page.evaluate(() => $('b3Dials').classList.contains('hidden') && state === 'menu'), 'ESC closes THE DIALS');
    await step(30);
    const saved = await page.evaluate(() => localStorage.getItem('am_dials_v1'));
    ok(!!saved && JSON.parse(saved).sfx !== undefined, 'dials persisted under am_dials_v1');
    await page.click('#gfxBtn'); await step(6); await page.click('#b3Gfx'); await step(6);
    ok(await page.evaluate(() => !$('gfxPanel').classList.contains('hidden') && $('b3Dials').classList.contains('hidden')), 'GRAPHICS & MORE opens the old options card');
    ok(await page.evaluate(() => ![...document.querySelectorAll('#gfxPanel .gxBtn')].some(b => /undefined/i.test(b.textContent))), 'no UNDEFINED rows on a fresh save');
    await page.click('#gfxClose'); await step(6);
    ok(await page.evaluate(() => !$('b3Dials').classList.contains('hidden')), 'closing graphics returns to THE DIALS');
    await page.keyboard.press('Escape'); await step(4);
    if (errors.length) fails.push('✗ desktop errors: ' + errors.slice(0, 3).join(' | '));
    await browser.close();
  }
  // phone
  {
    const { browser, page, errors } = await launch({ mobile: true, viewport: { width: 390, height: 844 } });
    const step = n => page.evaluate(n => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n);
    await page.waitForTimeout(1100); await step(20);
    await page.tap('#gfxBtn'); await step(12); await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dir, 'p1_phone_dials.jpg'), type: 'jpeg', quality: 86 });
    await page.evaluate(() => closeDials()); await step(4);
    await page.evaluate(() => { __bot.pauseHold = true; startGame(); }); await step(60);
    await page.evaluate(() => tcKey('keydown', 'Escape')); await step(10); await page.waitForTimeout(300); await step(4);
    await page.screenshot({ path: path.join(dir, 'p2_phone_pause_pills.jpg'), type: 'jpeg', quality: 86 });
    const fit = await page.evaluate(() => { const r = $('howBtnRow').getBoundingClientRect(); const c = $('b3PzSet2').getBoundingClientRect(); if (c.right > innerWidth || c.width < 10) return { l: -1, r: 0, w: innerWidth }; return { l: r.left, r: r.right, w: innerWidth }; });
    ok(fit.l >= 0 && fit.r <= fit.w + 1, 'phone pause pills fit the glass (' + Math.round(fit.l) + '..' + Math.round(fit.r) + ' of ' + fit.w + ')');
    await page.tap('#b3PzSet2'); await step(10); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !$('b3Dials').classList.contains('hidden') && state === 'paused'), 'phone: SETTINGS pill opens THE DIALS over the pause');
    await page.screenshot({ path: path.join(dir, 'p3_phone_pause_dials.jpg'), type: 'jpeg', quality: 86 });
    if (errors.length) fails.push('✗ phone errors: ' + errors.slice(0, 3).join(' | '));
    await browser.close();
  }
  for (const l of log.concat(fails)) console.log(l);
  console.log(JSON.stringify({ checks: log.length + fails.length, failed: fails.length }));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
