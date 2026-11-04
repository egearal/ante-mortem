#!/usr/bin/env node
// node probes/pwa.js [--dist]  — serves the repo root (as GitHub Pages does) or
// dist/ over http, loads the game, checks the manifest + service worker
// install, then goes OFFLINE and reloads: the night must still boot.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { ROOT } = require('./lib');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const dist = process.argv.includes('--dist');
const BASE = dist ? path.join(ROOT, 'dist') : ROOT;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/ante-mortem/, '');
  if (p.endsWith('/')) p += dist ? 'ante-mortem.html' : 'index.html';
  const f = path.join(BASE, p);
  if (!f.startsWith(BASE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, async () => {
  const url = 'http://127.0.0.1:' + srv.address().port + '/ante-mortem/' + (dist ? 'ante-mortem.html' : '');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  let ok = true; const say = (good, msg) => { console.log((good ? '  ✓ ' : '  ✕ ') + msg); if (!good) ok = false; };
  await page.goto(url);
  const man = await page.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); if (!l) return null; const r = await fetch(l.href); return r.ok ? r.json() : null; });
  say(man && man.icons && man.icons.length >= 3, 'manifest linked + parsed (' + (man && man.name) + ', start_url ' + (man && man.start_url) + ')');
  if (man) for (const ic of man.icons) { const st = await page.evaluate(async h => (await fetch(h)).status, new URL(ic.src, new URL('manifest.webmanifest', url)).href); say(st === 200, 'icon ' + ic.src + ' → ' + st); }
  const sw = await page.evaluate(async () => { const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 8000))]); return reg ? reg.active && reg.active.state : null; });
  say(sw === 'activated' || sw === 'activating', 'service worker active (' + sw + ')');
  await page.waitForTimeout(1500);
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return n; });
  say(cached >= (dist ? 3 : 15), 'cache holds ' + cached + ' files');
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForTimeout(1500);
  const boot = await page.evaluate(() => ({ menu: !!document.getElementById('startBtn'), state: typeof state === 'string' ? state : null, scripts: typeof startGame === 'function' }));
  say(boot.menu && boot.state === 'menu' && boot.scripts, 'OFFLINE reload boots to the menu (state ' + boot.state + ')');
  if (await page.$('#svTake')) await page.tap('#svTake'); // a fast reload trips the one-seat guard — take the seat
  await page.tap('#startBtn'); await page.waitForTimeout(1500);
  say(await page.evaluate(() => state === 'playing'), 'OFFLINE night starts');
  say(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close(); srv.close();
  process.exit(ok ? 0 : 1);
});
