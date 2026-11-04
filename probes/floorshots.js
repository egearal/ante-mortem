#!/usr/bin/env node
// node probes/floorshots.js <label> [--floor ballroom] [--src]
// Screenshots one floor through a god-mode night: 0:30, 5:00, 13:00 (THE HOUSE), plus the
// floor's events when it has them (ballroom: chandelier telegraph, the fall, the waltz, a mirror seam)
// and the ante room card. Writes shots/<label>/f*.jpg.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const label = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'floor';
const floor = opt('floor', 'ballroom'), which = argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', label); fs.mkdirSync(OUT, { recursive: true });
async function snap(page, name) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; }); await run(page, 3);
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 82 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; }); console.error('  ✓ ' + name);
}
(async () => {
  const { browser, page, errors } = await launch({ which });
  await page.evaluate((f) => { window.__probeFloor = f; window.__bot.god = true; try { REC.minutes = Math.max(REC.minutes || 0, 10); } catch (e) {} }, floor);
  // the ante room with the floor card
  await page.evaluate(() => { window.__bot.startedAt = -1; window.__bot.renderEvery = 1; try { IDX.fl = window.__probeFloor; openAnteRoom(); } catch (e) { console.error(e); } });
  for (let i = 0; i < 30; i++) await page.evaluate(() => window.__vc.step(16.7));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'f0_anteroom.jpg'), type: 'jpeg', quality: 82 }); console.error('  ✓ f0_anteroom');
  await page.evaluate(() => { try { const p = document.getElementById('antePanel'); if (p) p.classList.add('hidden'); } catch (e) {} window.__bot.startedAt = null; });
  await until(page, "state==='playing' && gt>30", 30000); await snap(page, 'f1_play_0m30');
  if (floor === 'ballroom') {
    await until(page, "state==='playing' && BAL.crashes.length && BAL.crashes[0].t>1.4", 60000); await snap(page, 'f2_chandelier_telegraph');
    await until(page, "state==='playing' && BAL.crashes.length && BAL.crashes[0].t>2.35", 3000); await snap(page, 'f3_chandelier_falls');
    await until(page, "state==='playing' && BAL.wreck.length && BAL.wreck[BAL.wreck.length-1].t>0.25", 3000); await snap(page, 'f4_wreck_coins');
    await until(page, "state==='playing' && BAL.waltz && BAL.waltz.t>4", 60000); await snap(page, 'f5_waltz');
    await until(page, "state==='playing' && BAL.seam && BAL.seam.t>1.5", 60000); await snap(page, 'f6_mirror_twins');
  }
  await until(page, "state==='playing' && gt>300", 80000); await snap(page, 'f7_play_5m00');
  await until(page, "state==='playing' && gt>792", 160000); await snap(page, 'f8_play_13m00_house');
  await browser.close();
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), floor, errors: errors.slice(0, 8) }, null, 1));
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
