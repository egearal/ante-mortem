#!/usr/bin/env node
// node probes/slotshots.js <label> [--src] [--phone]
// The slot machine, frame by frame: ready, mid-spin, a reel clunking to a stop,
// the near-miss tease (two match, the last reel wobbles past), a pair payout,
// a triple, and the red table. Outcomes are FORCED by temporarily rigging the
// fate dealer (MFATE) — presentation proof only, the odds are not touched.
// CSS transitions run on real time, so ceremonies are driven "live": the
// virtual clock is stepped in step with real waits.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'slot';
const which = process.argv.includes('--src') ? 'src' : 'dist';
const phone = process.argv.includes('--phone');
const OUT = path.join(ROOT, 'shots', label);
fs.mkdirSync(OUT, { recursive: true });

async function live(page, ms) { // advance virtual time at real speed, rendering every frame
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await page.evaluate(() => { window.__vc.step(16.7); });
    await page.waitForTimeout(14);
  }
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 85 });
  console.error('  ✓ ' + name);
}
async function toSlot(page) {
  await page.evaluate(() => { window.__bot.noSlotTap = true; });
  await until(page, "state==='playing'", 30000);
  await page.evaluate(() => { P.xp = Math.max(P.xp, P.xpNext - 0.01); if (typeof cashRage === 'function' && P.ovT > 0) cashRage(); });
  const ok = await until(page, "state==='slot' && slotStage==='ready'", 30000);
  if (!ok) throw new Error('slot never opened');
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await live(page, 700);
}
async function stopReel(page) { await page.evaluate(() => { stopLock = 0; slotTap(); }); }
async function finishSlot(page) { // let the bot play the rest of the visit out
  await page.evaluate(() => { window.__bot.noSlotTap = false; window.__bot.renderEvery = 30; });
  await until(page, "state==='playing'", 20000);
}

(async () => {
  const opts = phone ? { which, mobile: true, viewport: { width: 390, height: 844 } } : { which };
  const { browser, page, errors } = await launch(opts);
  await page.evaluate(() => { window.__bot.god = true; });
  const pre = phone ? 'p_' : '';

  // 1 — the near-miss: fate deals a PAIR, reels one and two match, the last one teases
  await toSlot(page);
  await shot(page, pre + 's1_ready');
  await page.evaluate(() => { MFATE._T = MFATE.T; MFATE._P = MFATE.P; MFATE.T = 0; MFATE.P = 1; slotTap(); });
  await live(page, 130);
  await shot(page, pre + 's2_lever_pull');
  await live(page, 900);
  await shot(page, pre + 's3_spinning');
  await stopReel(page); await live(page, 60);
  await shot(page, pre + 's4_reel_clunk');
  await live(page, 400);
  await stopReel(page); await live(page, 500);
  await shot(page, pre + 's5_two_match');
  await stopReel(page); await live(page, 720);
  await shot(page, pre + 's6_nearmiss_tease');
  await live(page, 600);
  await shot(page, pre + 's7_nearmiss_settled');
  await until(page, "slotStage==='offer'", 600);
  await live(page, 250);
  await shot(page, pre + 's8_pair_payout');
  await page.evaluate(() => { MFATE.T = MFATE._T; MFATE.P = MFATE._P; });
  await finishSlot(page);

  // 2 — the triple
  await toSlot(page);
  await page.evaluate(() => { MFATE.T = 1; slotTap(); });
  await live(page, 900);
  await stopReel(page); await live(page, 350);
  await stopReel(page); await live(page, 450);
  await stopReel(page); await live(page, 500);
  await shot(page, pre + 's9_triple_creep');
  await live(page, 700);
  await shot(page, pre + 's10_triple_lands');
  await until(page, "slotStage==='offer'", 600);
  await live(page, 300);
  await shot(page, pre + 's11_triple_ceremony');
  await page.evaluate(() => { MFATE.T = MFATE._T; });
  await finishSlot(page);

  // 3 — the red table (low blood)
  if (!phone) {
    await page.evaluate(() => { window.__bot.god = false; });
    await page.evaluate(() => { window.__bot.noSlotTap = true; });
    await until(page, "state==='playing' && (P.passiveList||[]).length>0", 30000);
    await page.evaluate(() => { P.hp = P.maxHp * 0.12; P.inv = 99; P.xp = P.xpNext - 0.5; });
    await page.evaluate(() => { window.__bot.god = false; });
    const ok = await until(page, "state==='slot' && slotStage==='ready'", 20000);
    if (ok) { await page.evaluate(() => { window.__bot.renderEvery = 1; });
      await until(page, "$('jackpotLayer').classList.contains('hidden')", 600);
      await live(page, 1200); await shot(page, 's12_red_table'); }
  }

  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), errors: errors.slice(0, 8) }, null, 1));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
