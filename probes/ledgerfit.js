#!/usr/bin/env node
// node probes/ledgerfit.js [label] — die after ~2:00, then measure the death ledger at
// 1280x720, 1366x768, 1920x1080 (desktop) and 390x844 (phone). Fails if ANTE UP (desktop) or the
// ◈ AGAIN thumb button (phone) isn't fully on screen.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const OUT = label ? path.join(ROOT, 'shots', label) : null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const measure = page => page.evaluate(() => {
  const r = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
  const p = document.querySelector('#gameover .panel'), pb = p.getBoundingClientRect();
  return { vh: innerHeight, panel: { top: Math.round(pb.top), bottom: Math.round(pb.bottom), scrollH: p.scrollHeight, clientH: p.clientHeight }, ante: r('againBtn'), menu: r('goMenuBtn'), layerScroll: document.getElementById('gameover').scrollHeight };
});
async function die(page) {
  await page.evaluate(() => { window.__bot.god = true; });
  await until(page, "state==='playing' && gt>120", 40000);
  await page.evaluate(() => { window.__bot.god = false; });
  await until(page, "state==='dead'", 60000);
  await page.evaluate(() => { for (let k = 0; k < 240; k++) window.__vc.step(16.7); });
  await page.waitForTimeout(900);
}
(async () => {
  const res = {}, errs = []; let bad = 0;
  {
    const { browser, page, errors } = await launch({});
    await die(page);
    for (const [w, h] of [[1280, 720], [1366, 768], [1920, 1080]]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400);
      const m = await measure(page); res[w + 'x' + h] = m; if (!m.ante || m.ante.bottom > h) bad++;
      if (OUT) await page.screenshot({ path: path.join(OUT, `ledger_${w}x${h}.jpg`), type: 'jpeg', quality: 82 });
    }
    errs.push(...errors); await browser.close();
  }
  {
    const { browser, page, errors } = await launch({ mobile: true, viewport: { width: 390, height: 844 } });
    await die(page);
    // phones re-ante with the ◈ AGAIN thumb button (the ledger itself scrolls) — that button must be on screen
    const m = await measure(page);
    m.thumb = await page.evaluate(() => { const b = typeof TC !== 'undefined' && TC.bet; if (!b || !b.classList.contains('show')) return null; const r = b.getBoundingClientRect(); return { label: b.textContent.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom) }; });
    res['390x844'] = m; if (!m.thumb || m.thumb.bottom > 844 || !/AGAIN|READ/.test(m.thumb.label)) bad++;
    if (OUT) await page.screenshot({ path: path.join(OUT, 'ledger_390x844.jpg'), type: 'jpeg', quality: 82 });
    errs.push(...errors); await browser.close();
  }
  console.log(JSON.stringify({ res, bad, errors: errs.slice(0, 6) }, null, 1));
  process.exit(errs.length || bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
