#!/usr/bin/env node
// E1 — THE COURT IN MOTION: proof shots + perf.
// node probes/e1shots.js <label> [--src] [--perf-only] [--no-perf] [--frames 400]
//   s1_storm_3m00   a pinned 300 storm at 3:00 (every regular type + elites), q=high
//   s2_storm_8m00   the same at 8:00 (scaled court), q=high
//   s3_court_sheet  close-up sheet of every regular enemy type (frozen in a grid, 2x zoom crop)
//   s4_arsenal      --god, every weapon granted at max level, mid-storm
//   s5_arsenal_b    the same, a second later (cards/scythe/bell/guillotine phases)
//   s6_deaths       a massacre: kill a ring of every family at once, mid-animation
// perf: 300-enemy pinned storm, every frame rendered, real-clock ms for render() and for the
// drawEnemy loop, p50/p95 over N frames; printed as JSON and written to shots/<label>/perf.json.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const label = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'e1';
const which = argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', label); fs.mkdirSync(OUT, { recursive: true });
const TYPES = ['shambler', 'husk', 'swarm', 'bomber', 'leech', 'shooter', 'wraith', 'stalker', 'hexer', 'brute', 'revenant', 'elite', 'gilded'];

async function shot(page, name, clip) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 85, clip });
  console.error('  ✓ ' + name);
}
async function frames(page, n) { // render every frame, no bot steering (the scene is pinned)
  await page.evaluate(async (n) => { for (let i = 0; i < n; i++) { window.__vc.step(16.7); try { window.__bot.step(); } catch (e) {} if (i % 10 === 9) await null; } }, n);
}
async function storm(page, minutes, n, near) {
  await page.evaluate(({ minutes, n, TYPES, near }) => {
    let s = 7; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; // seeded storm
    gt = minutes * 60; enemies.length = 0; ebullets.length = 0; waveGap = 999; P.x = CFG.arena / 2; P.y = CFG.arena / 2;
    const T = TYPES.filter(t => t !== 'gilded');
    for (let i = 0; enemies.length < n && i < n * 2; i++) { const t = (i % 40 === 0) ? 'elite' : T[i % (T.length - 1)];
      const a = Math.random() * 6.283, d = near ? 110 + Math.random() * 300 : 90 + Math.pow(Math.random(), 0.7) * 820;
      spawnEnemy(t, clamp(P.x + Math.cos(a) * d, 20, CFG.arena - 20), clamp(P.y + Math.sin(a) * d, 20, CFG.arena - 20)); }
    for (const e of enemies) { e.born = gt - 1; e._spd0 = e.spd; }
    window.__pin = true; GFX.q = 'high'; qLow = false;
  }, { minutes, n, TYPES, near });
}
(async () => {
  const { browser, page, errors } = await launch({ which });
  await page.evaluate(() => { window.__bot.god = true; });
  await run(page, 30);
  await page.evaluate(() => { startGame(); });
  await run(page, 60);
  // hold the night: the bot only renders, the clock still ticks the court (they walk, flap, shoot)
  await page.evaluate(() => { window.__bot.renderEvery = 1; window.__bot.manual = true; });
  const res = {};
  if (!argv.includes('--no-perf')) {
    await storm(page, 5, 300);
    await frames(page, 60);
    res.perf = await page.evaluate(async (N) => {
      const rn = window.__realNow, R0 = window.render, D0 = window.drawEnemy; let de = 0;
      window.drawEnemy = function (e) { const t = rn(); D0(e); de += rn() - t; };
      const T = [], DE = [], E = [];
      window.render = function () { de = 0; const t = rn(); R0.apply(this, arguments); T.push(rn() - t); DE.push(de); E.push(enemies.length); };
      for (let i = 0; i < N; i++) { P.hp = P.maxHp; window.__vc.step(16.7); if (i % 10 === 9) await null; }
      window.render = R0; window.drawEnemy = D0;
      const st = a => { const s = a.slice(20).sort((x, y) => x - y), q = p => +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); const W = s.filter(x => x < 50), qw = p => +W[Math.min(W.length - 1, Math.floor(W.length * p))].toFixed(2); return { p50: q(0.5), p95: q(0.95), avg: +(s.reduce((x, y) => x + y, 0) / s.length).toFixed(2), cpuP50: qw(0.5), cpuP95: qw(0.95), cpuAvg: +(W.reduce((x, y) => x + y, 0) / W.length).toFixed(2), flush: s.length - W.length }; };
      return { render: st(T), drawEnemyLoop: st(DE), enemies: Math.round(E.reduce((a, b) => a + b, 0) / E.length), q: GFX.q, qLow };
    }, +opt('frames', 400));
    console.error('perf:', JSON.stringify(res.perf));
    fs.writeFileSync(path.join(OUT, 'perf.json'), JSON.stringify(res.perf, null, 1));
  }
  if (!argv.includes('--perf-only')) {
    await storm(page, 3, 300); await frames(page, 40); await shot(page, 's1_storm_3m00');
    await storm(page, 8, 300); await frames(page, 40); await shot(page, 's2_storm_8m00');
    // the court sheet: one of every type, frozen in a grid above the player, camera zoomed 1.8x (A4's ZOOM)
    await page.evaluate((TYPES) => {
      enemies.length = 0; ebullets.length = 0; bullets.length = 0; parts.length = 0; P.wlv = { bolt: 1 }; P.fireRate = 0.0001;
      const at = i => { const c = i % 7, r = (i / 7) | 0; return [P.x - 255 + c * 85 + (r ? 42 : 0), P.y - 140 + r * 85]; };
      TYPES.forEach((t, i) => { const [x, y] = at(i); spawnEnemy(t, x, y); });
      // spawnGuard pushes them off the player: place them by hand after the spawn
      enemies.forEach((e, i) => { const [x, y] = at(i); e.x = x; e.y = y; e.spd = 0; e.born = gt - 1; e.shootCd = 0.2 + (i % 3) * 0.1; });
      window.__freeze = setInterval(() => { enemies.forEach((e, i) => { const [x, y] = at(i); e.x = x; e.y = y; e.spd = 0; e.kx = 0; e.ky = 0; if (e.ranged) e.shootCd = 0.25; e.despawn = 9; }); P.hp = P.maxHp; }, 5);
      window.__hid = [...document.querySelectorAll('body *')].filter(el => el !== cv && !el.contains(cv) && el.style.visibility !== 'hidden'); window.__hid.forEach(el => el.style.visibility = 'hidden');
      ZOOM = 1.8; VW = innerWidth / ZOOM; VH = innerHeight / ZOOM; ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, 0, 0);
    }, TYPES);
    await frames(page, 40);
    await shot(page, 's3_court_sheet');
    await frames(page, 9);
    await shot(page, 's3b_court_sheet_f2');
    await page.evaluate(() => { enemies.forEach(e => { e.flash = 0.06; }); });
    await frames(page, 1);
    await shot(page, 's3c_court_sheet_hitflash');
    await page.evaluate(() => { resize(); window.__hid.forEach(el => el.style.visibility = ''); });
    await page.evaluate(() => { clearInterval(window.__freeze); });
    // the arsenal: every weapon, max level, a storm to spend it on (full chaos, HUD on)
    await page.evaluate(() => { for (const w of WEAPONS) P.wlv[w.id] = w.max; P.fireRate = 3; P.crit = 0.35; window.__bot.manual = true; });
    await storm(page, 4, 160);
    await page.evaluate(() => { for (const w of WEAPONS) P.wlv[w.id] = w.max; P.fireRate = 3; P.crit = 0.35; for (const e of enemies) { e.hp *= 30; e.maxhp *= 30; } });
    await frames(page, 150); await shot(page, 's4_arsenal');
    await frames(page, 47); await shot(page, 's5_arsenal_b');
    // the arsenal in groups, zoomed 1.6x with the HUD hidden, so each weapon's look can be read
    const GROUPS = { a_cards_knives_dice_mortar: ['bolt', 'cards', 'knives', 'dice', 'mortar'], b_fangs_moths_lantern_nails_phantom_cylinder: ['bolt', 'fangs', 'moths', 'lantern', 'coffin', 'phantom', 'cylinder'],
      c_scythe_bell_chalice_guillotine_gramo_orbit: ['scythe', 'bell', 'chalice', 'guillotine', 'gramo', 'orbit'], d_seeker_razor_cinders_stakes_serpent_candles: ['seeker', 'razor', 'cinders', 'stakes', 'serpent', 'candelabra', 'spark', 'coil'] };
    for (const [name, ws] of Object.entries(GROUPS)) {
      await storm(page, 4, 60, true);
      await page.evaluate((ws) => { P.wlv = {}; for (const id of ws) P.wlv[id] = WEAPONS.find(w => w.id === id).max; P.fireRate = 2.2; P.crit = 0.3; texts.length = 0;
        for (const e of enemies) { e.hp *= 40; e.maxhp *= 40; } window.__hid = [...document.querySelectorAll('body *')].filter(el => el !== cv && !el.contains(cv) && el.style.visibility !== 'hidden'); window.__hid.forEach(el => el.style.visibility = 'hidden');
        ZOOM = 1.6; VW = innerWidth / ZOOM; VH = innerHeight / ZOOM; ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, 0, 0); window.__noText = setInterval(() => { texts.length = 0; }, 4); }, ws);
      for (let k = 0; k < 2; k++) { await frames(page, k ? 53 : 140); await shot(page, 's7_' + name + (k ? '_2' : '')); }
      await page.evaluate(() => { clearInterval(window.__noText); resize(); window.__hid.forEach(el => el.style.visibility = ''); });
    }
    // deaths: a ring of every family, all killed in one frame, caught mid-animation (zoomed, HUD hidden; the gilded soul is spared — its GOLD RUSH covers the screen)
    await page.evaluate((TYPES) => { P.wlv = { bolt: 1 }; P.fireRate = 0.0001; bullets.length = 0; enemies.length = 0; parts.length = 0; texts.length = 0;
      TYPES.filter(t => t !== 'gilded').forEach((t, i, A) => { spawnEnemy(t, P.x, P.y); const e = enemies[enemies.length - 1]; const a = i / A.length * 6.283; e.x = P.x + Math.cos(a) * 150; e.y = P.y + Math.sin(a) * 105; e.spd = 0; e.born = gt - 1; });
      window.__hid = [...document.querySelectorAll('body *')].filter(el => el !== cv && !el.contains(cv) && el.style.visibility !== 'hidden'); window.__hid.forEach(el => el.style.visibility = 'hidden');
      ZOOM = 1.8; VW = innerWidth / ZOOM; VH = innerHeight / ZOOM; ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, 0, 0);
    }, TYPES);
    console.error('  state before deaths:', await page.evaluate(() => state + ' gt=' + gt.toFixed(2) + ' hitstop=' + hitstop));
    await frames(page, 10); await shot(page, 's6a_deaths_before');
    await page.evaluate(() => { for (let i = enemies.length - 1; i >= 0; i--) killEnemy(enemies[i], i); P.hp = P.maxHp; texts.length = 0; });
    await frames(page, 6); console.error('  after kill:', await page.evaluate(() => state + ' gt=' + gt.toFixed(2) + ' corpses=' + corpses.length)); await shot(page, 's6_deaths');
    await frames(page, 12); await shot(page, 's6b_deaths_late');
    await page.evaluate(() => { resize(); window.__hid.forEach(el => el.style.visibility = ''); });
  }
  await browser.close();
  res.errors = errors.slice(0, 8);
  console.log(JSON.stringify(res, null, 1));
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
