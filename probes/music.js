#!/usr/bin/env node
// npm run music
// B3 proof for the House band. Builds a throwaway stage in the OS temp dir:
// a copy of dist/ante-mortem.html whose baked track list names menu/run/boss
// (ascent + house deliberately missing), plus tiny ffmpeg-made loops beside it.
// Serves it over http (the Web Audio route) and checks: nothing plays before a
// gesture, the menu track plays after one, a night crossfades to `run`, missing
// contexts fall back down the chain, a jackpot ducks the band, the MUSIC dial
// silences it, and the page logs no errors. Then the real dist file with NO
// tracks: zero requests to assets/music. Exit 1 on any failure.
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const fails = [], log = [];
  const ok = (c, m) => (c ? log : fails).push((c ? '✓ ' : '✗ ') + m);
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'am-band-'));
  fs.mkdirSync(path.join(stage, 'assets', 'music'), { recursive: true });
  const tones = { menu: 220, run: 330, boss: 110 };
  for (const [k, hz] of Object.entries(tones))
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `sine=frequency=${hz}:duration=3`, '-c:a', 'libvorbis', '-y', path.join(stage, 'assets', 'music', k + '.ogg')]);
  let html = fs.readFileSync(path.join(ROOT, 'dist', 'ante-mortem.html'), 'utf8');
  if (!html.includes('window.__AM_MUSIC={};')) { console.error('dist has no empty track list — run npm run build'); process.exit(2); }
  html = html.replace('window.__AM_MUSIC={};', 'window.__AM_MUSIC=' + JSON.stringify({ menu: ['assets/music/menu.ogg'], run: ['assets/music/run.ogg'], boss: ['assets/music/boss.ogg'] }) + ';');
  fs.writeFileSync(path.join(stage, 'index.html'), html);
  // the hosted kit (A4's service worker + manifest) rides along so the stage is a faithful host
  for (const f of ['sw.js', 'manifest.webmanifest']) if (fs.existsSync(path.join(ROOT, 'dist', f))) fs.copyFileSync(path.join(ROOT, 'dist', f), path.join(stage, f));
  const srv = http.createServer((q, r) => {
    const f = path.join(stage, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(stage) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end(); }
    r.setHeader('Content-Type', f.endsWith('.ogg') ? 'audio/ogg' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html'); r.end(fs.readFileSync(f));
  }).listen(0);
  const port = srv.address().port;

  const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [], reqs = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('request', q => { if (/assets\/music/.test(q.url())) reqs.push(q.url().split('/').pop()); });
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} window._noAutoPause = true; });
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForTimeout(700);
  const M = () => page.evaluate(() => ({ track: MUSIC.track && MUSIC.track.split('/').pop(), decks: MUSIC.decks.map(d => ({ s: d.src.split('/').pop(), v: +d.vol.toFixed(2), t: d.target, g: d.g ? +d.g.gain.value.toFixed(3) : null, paused: d.el.paused, ct: +d.el.currentTime.toFixed(2) })), duck: +MUSIC.duck.toFixed(2), found: Object.keys(MUSIC.found) }));
  let m = await M();
  ok(m.found.join() === 'menu,run,boss', 'baked list read: ' + m.found.join(','));
  ok(m.decks.length === 0, 'silent before any gesture (autoplay law)');
  await page.mouse.click(30, 700); await page.waitForTimeout(2200);
  m = await M();
  const menuDeck = m.decks.find(d => d.s === 'menu.ogg');
  ok(menuDeck && !menuDeck.paused && menuDeck.ct > 0.3, 'menu.ogg plays after the first click (t=' + (menuDeck && menuDeck.ct) + 's)');
  ok(menuDeck && menuDeck.v > 0.9 && menuDeck.g > 0.3, 'menu track faded up through the Web Audio bus (gain ' + (menuDeck && menuDeck.g) + ')');
  await page.evaluate(() => startGame()); await page.waitForTimeout(600);
  m = await M();
  ok(m.track === 'run.ogg' && m.decks.length === 2, 'a night starts → crossfading menu → run ' + JSON.stringify(m.decks.map(d => d.s + ':' + d.v)));
  await page.waitForTimeout(1800);
  m = await M();
  ok(m.decks.length === 1 && m.decks[0].s === 'run.ogg' && !m.decks[0].paused, 'crossfade finished, menu deck released');
  const chain = await page.evaluate(() => ({ boss: musicTrackFor('boss'), ascent: musicTrackFor('ascent'), house: musicTrackFor('house') }));
  ok(/boss\.ogg$/.test(chain.boss) && /run\.ogg$/.test(chain.ascent) && /boss\.ogg$/.test(chain.house), 'fallbacks: ascent → run, house → boss (' + Object.values(chain).map(s => s.split('/').pop()).join(', ') + ')');
  await page.evaluate(() => SFX.jackpot()); await page.waitForTimeout(250);
  m = await M();
  ok(m.duck < 0.45, 'a jackpot ducks the band (duck ' + m.duck + ')');
  // other moments (a secret, a feat) may extend the hush — wait until the last one lets go, then 1.5s
  for (let i = 0; i < 40; i++) { const left = await page.evaluate(() => MUSIC.duckUntil - performance.now()); if (left < 0) break; await page.waitForTimeout(Math.min(400, left + 20)); }
  await page.waitForTimeout(1500);
  m = await M();
  ok(m.duck > 0.85, 'the band breathes back up after (duck ' + m.duck + ')');
  await page.evaluate(() => { DIALS.music = 0; }); await page.waitForTimeout(500);
  m = await M();
  ok(m.decks[0].g < 0.01, 'MUSIC dial at 0 silences it (gain ' + m.decks[0].g + ')');
  await page.evaluate(() => { DIALS.music = 0.8; });
  ok(!reqs.includes('ascent.ogg') && !reqs.includes('house.ogg') && !reqs.some(r => /\.mp3$/.test(r)), 'never asked for a file that is not there (requests: ' + [...new Set(reqs)].join(',') + ')');
  ok(errors.length === 0, 'no page errors on the http stage');
  await page.close();

  // the real shippable file, no tracks, from file:// — must not knock on any door
  const p2 = await browser.newPage();
  const e2 = [], r2 = [];
  p2.on('pageerror', e => e2.push(e.message)); p2.on('console', x => { if (x.type() === 'error') e2.push(x.text()); });
  p2.on('request', q => { if (/assets\/music/.test(q.url())) r2.push(q.url()); });
  await p2.goto('file://' + path.join(ROOT, 'dist', 'ante-mortem.html'));
  await p2.mouse.click(30, 700); await p2.waitForTimeout(800);
  await p2.evaluate(() => startGame()); await p2.waitForTimeout(800);
  ok(r2.length === 0 && e2.length === 0, 'dist with no tracks: 0 music requests, 0 errors (' + r2.length + ', ' + e2.length + ')');
  await browser.close(); srv.close();
  fs.rmSync(stage, { recursive: true, force: true });
  for (const l of log.concat(fails)) console.log(l);
  for (const e of errors.concat(e2).slice(0, 6)) console.log('ERR ' + e);
  console.log(JSON.stringify({ checks: log.length + fails.length, failed: fails.length }));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
