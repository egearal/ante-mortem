#!/usr/bin/env node
// npm run phone -- <label> [--src]   → shots/<label>/p_*.jpg
// Phone/tablet screenshot set (touch emulation): menu, options panel, play,
// pause, slot, wheel-or-ascent if reached, death ledger — in portrait 390×844,
// landscape 844×390 and tablet 768×1024. Also drives the touch controls for
// real (joystick drag + BET taps) and fails on any runtime error.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'phone';
const which = process.argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', label);
fs.mkdirSync(OUT, { recursive: true });
const VIEWS = [
  ['portrait', { width: 390, height: 844 }],
  ['landscape', { width: 844, height: 390 }],
  ['tablet', { width: 768, height: 1024 }],
];

async function snap(page, name) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await run(page, 4);
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 80 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('  ✓ ' + name);
}

(async () => {
  const errs = [];
  const only = process.argv.includes('--quick') ? VIEWS.slice(0, 2) : VIEWS;
  for (const [vn, viewport] of only) {
    const { browser, page, errors } = await launch({ which, mobile: true, viewport });
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'p_' + vn + '_1menu.jpg'), type: 'jpeg', quality: 80 }); console.error('  ✓ ' + vn + ' menu');
    // options panel by touch
    await page.tap('#gfxBtn').catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'p_' + vn + '_2options.jpg'), type: 'jpeg', quality: 80 }); console.error('  ✓ ' + vn + ' options');
    await page.evaluate(() => { const p = document.getElementById('gfxPanel'); if (p) p.classList.add('hidden'); });
    // start the night by tapping PLAY
    await page.evaluate(() => { window.__bot.god = true; window.__bot.noSlotTap = true; window.__bot.startedAt = 1; });
    await page.tap('#startBtn');
    await run(page, 30);
    // the bot is told to hold off the slot so we can photograph it
    await until(page, "state==='slot'", 20000);
    await run(page, 40);
    await snap(page, 'p_' + vn + '_3slot');
    // drive the slot with the touch BET button only
    const bet = await page.$('#tcBet');
    for (let i = 0; i < 40 && bet; i++) {
      const st = await page.evaluate(() => state);
      if (st !== 'slot') break;
      await page.evaluate(() => { const b = document.getElementById('tcBet'); const r = b.getBoundingClientRect();
        const o = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
        b.dispatchEvent(new PointerEvent('pointerdown', o)); b.dispatchEvent(new PointerEvent('pointerup', o)); });
      await run(page, 50);
    }
    await page.evaluate(() => { window.__bot.noSlotTap = false; });
    await until(page, "state==='playing' && gt>25", 20000);
    // joystick drag: thumb lands lower-left, pushes up-right
    await page.evaluate(() => { window.__bot.manual = true; });
    const vw = viewport.width, vh = viewport.height;
    const x0 = vw * 0.22, y0 = vh * 0.72;
    await page.evaluate(({ x0, y0 }) => { const c = document.getElementById('c');
      c.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: x0, clientY: y0, button: 0 }));
      c.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: x0 + 40, clientY: y0 - 30 })); }, { x0, y0 });
    const p0 = await page.evaluate(() => [P.x, P.y]);
    await run(page, 20);
    const p1 = await page.evaluate(() => [P.x, P.y, touch.joy, state]);
    console.error('  joystick moved player', Math.round(p1[0] - p0[0]), Math.round(p1[1] - p0[1]), 'state', p1[3]);
    await snap(page, 'p_' + vn + '_4play');
    await page.evaluate(({ x0, y0 }) => { const c = document.getElementById('c');
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: x0, clientY: y0 })); }, { x0, y0 });
    await page.evaluate(() => { window.__bot.manual = false; });
    // pause via the on-screen button
    await until(page, "state==='playing'", 4000);
    await page.tap('#tcPause').catch(e => console.error('  (no pause btn)', e.message));
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__bot.pauseHold = true; });
    await snap(page, 'p_' + vn + '_5pause');
    // codex from the pause card, then tap out, then tap the card to resume
    await page.tap('#tcPzCodex').catch(e => console.error('  (no codex btn)', e.message));
    await page.waitForTimeout(300);
    await snap(page, 'p_' + vn + '_5codex');
    await page.tap('.pauseCard .pz', { force: true }).catch(() => {});
    await page.waitForTimeout(200);
    await page.tap('.pauseCard .pz', { force: true }).catch(() => {});
    await run(page, 40);
    console.error('  after resume taps: state', await page.evaluate(() => state));
    await page.evaluate(() => { window.__bot.pauseHold = false; });
    // to the ledger
    await page.evaluate(() => { window.__bot.god = false; if (P) { P.hp = 1; } });
    await until(page, "state==='dead'", 60000);
    await run(page, 260);
    await snap(page, 'p_' + vn + '_6ledger');
    errs.push(...errors);
    await browser.close();
  }
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), errors: errs.slice(0, 8) }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
