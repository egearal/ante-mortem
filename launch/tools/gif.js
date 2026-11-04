#!/usr/bin/env node
// node launch/tools/gif.js [--seconds 13] [--fps 15] [--width 640]
// H1 THE LAUNCH KIT — a looping clip of a busy night for social posts.
// The night runs on the probe harness's virtual clock, so every captured frame is
// exactly 1/fps of game time apart no matter how slow headless rendering is
// (a real-time screen recording would stutter). Seeded, god-mode, the Ballroom,
// a dressed mid-game build, the floor topped up to a storm.
// Output: launch/gameplay-loop.webm (1280×720 VP9) + launch/gameplay-loop.gif (palette, < 8MB).
// The clip's last second cross-fades into its first so the loop has no seam.
'use strict';
const path = require('path'), fs = require('fs');
const { execFileSync } = require('child_process');
const { launch, run, until, ROOT } = require('../../probes/lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : +argv[i + 1]; };
const SECS = opt('seconds', 13), FPS = opt('fps', 15), GW = opt('width', 640), FADE = 1;
const L = path.join(ROOT, 'launch');
const TMP = path.join(L, 'raw', 'clip'); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const BOT_SRC = fs.readFileSync(path.join(ROOT, 'probes', 'lib.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
const VET = { antemortem_ach_v2: { u: [], LT: { kills: 6400, coins: 9200, runs: 34, deaths: 33, triples: 6, coach: { audio: 1 } }, REC: { minutes: 12 }, S: [], SP: true } };

(async () => {
  const { browser, page, errors } = await launch({ viewport: { width: 1280, height: 720 }, scale: 1, seed: 1313 });
  await page.addInitScript(s => { try { if (!sessionStorage.getItem('__h1seed')) { for (const k in s) localStorage.setItem(k, JSON.stringify(s[k])); sessionStorage.setItem('__h1seed', '1'); } } catch (e) {} }, VET);
  await page.reload(); await page.evaluate(BOT_SRC);
  await page.addStyleTag({ content: '#achToasts,#coachToast,#secretReveal{display:none!important}' });
  await page.evaluate(() => { window.muted = true; window.__probeFloor = 'ballroom'; window.__bot.god = true; });
  await until(page, "state==='playing' && gt>170", 80000);
  await page.evaluate(() => {
    try { GFX.q = 'high'; } catch (e) {}
    for (const [k, v] of Object.entries({ orbit: 5, scythe: 5, chand: 5, candelabra: 5 })) P.wlv[k] = v;
    try { renderRelics(); } catch (e) {}
    P.xpNext = 1e9; pending.length = 0; // no level-up tables mid-clip: the slot's CSS ceremony runs on real time
    window.__storm = () => { const types = ['shambler', 'husk', 'swarm', 'stalker', 'brute', 'wraith'];
      while (enemies.length < 230) { const a = Math.random() * 6.283, d = 420 + Math.random() * 380;
        spawnEnemy(types[enemies.length % types.length], P.x + Math.cos(a) * d * 1.4, P.y + Math.sin(a) * d); const e = enemies[enemies.length - 1]; if (e) { e.hp = e.maxhp = e.maxhp * 6; e.dmg = 0; } } };
    window.__storm();
  });
  await run(page, 60);
  const N = Math.round((SECS + FADE) * FPS), per = Math.round(1000 / FPS / 16.7);
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  for (let i = 0; i < N; i++) {
    await page.evaluate((per) => { for (let k = 0; k < per; k++) { if (state !== 'playing' && state !== 'dead') { /* a table opened anyway: let the bot close it */ } window.__vc.step(16.7); try { window.__bot.step(); } catch (e) {} } if (state === 'playing') { if (enemies.length < 160) window.__storm(); pending.length = 0; } }, per);
    await page.screenshot({ path: path.join(TMP, 'f' + String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % 30 === 0) console.error('  frame ' + i + '/' + N + ' · enemies ' + await page.evaluate(() => enemies.length + ' · ' + state));
  }
  await browser.close();
  const src = ['-framerate', String(FPS), '-i', path.join(TMP, 'f%04d.jpg')];
  // seamless loop: the body is [FADE .. FADE+SECS]; its last FADE seconds cross-fade into the clip's first FADE seconds
  const xf = `[0:v]split[a][b];[a]trim=start=${FADE},setpts=PTS-STARTPTS[body];[b]trim=end=${FADE},setpts=PTS-STARTPTS[head];[body][head]xfade=transition=fade:duration=${FADE}:offset=${SECS - FADE},format=yuv420p[x]`;
  const webm = path.join(L, 'gameplay-loop.webm'), gif = path.join(L, 'gameplay-loop.gif');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...src, '-filter_complex', xf, '-map', '[x]', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1', '-an', webm]);
  const gf = xf.replace(',format=yuv420p[x]', `,scale=${GW}:-2:flags=lanczos,split[p][q];[p]palettegen=max_colors=160:stats_mode=diff[pal];[q][pal]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[x]`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...src, '-filter_complex', gf, '-map', '[x]', '-loop', '0', gif]);
  const mb = f => +(fs.statSync(f).size / 1048576).toFixed(2);
  console.log(JSON.stringify({ webm: mb(webm) + 'MB', gif: mb(gif) + 'MB', frames: N, errors: errors.slice(0, 6) }, null, 1));
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
