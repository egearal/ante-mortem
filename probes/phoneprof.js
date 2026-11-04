#!/usr/bin/env node
// node probes/phoneprof.js [--src] [--cpu 4] [--secs 45] [--desktop]
// REAL-clock frame profile on a 390×844 touch phone (CPU throttled to mimic a
// mid phone). The bot drives in real time; reports PROF avg/p95 frame time,
// quality tier reached (qLow) and DPR used. Exit 1 on runtime errors.
'use strict';
const { launch, target } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
(async () => {
  const which = opt('src', false) ? 'src' : 'dist';
  const desktop = !!opt('desktop', false);
  const { browser, page, errors } = await launch({ which, mobile: !desktop, vclock: false,
    viewport: desktop ? { width: 1280, height: 720 } : { width: 390, height: 844 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +opt('cpu', 4) });
  await page.goto(target(which) + '?prof');
  await page.evaluate(require('fs').readFileSync(__dirname + '/lib.js', 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1]);
  await page.evaluate(() => { window.muted = true; window.__bot.god = true; window.__bot.renderEvery = 1;
    window.render = window.render; setInterval(() => { try { window.__bot.step(); } catch (e) {} }, 16); });
  const secs = +opt('secs', 45);
  await page.waitForTimeout(8000);
  await page.evaluate(() => window.__prof.reset());
  await page.waitForTimeout(secs * 1000);
  const r = await page.evaluate(() => ({ prof: window.__prof.report(), qLow, DPR, ZOOM, VW: Math.round(VW), VH: Math.round(VH), gt: Math.round(gt), enemies: enemies.length, state, touchUI: window._touchUI }));
  delete r.prof.stages; 
  console.log(JSON.stringify(r, null, 1));
  console.log('errors', errors.slice(0, 5));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
