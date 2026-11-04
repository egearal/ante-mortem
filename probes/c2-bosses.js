#!/usr/bin/env node
// C2 — THE HIGH ROLLERS probe.  node probes/c2-bosses.js [--src] [--only croupier] [--noshots]
// For each new boss: fresh night, god-mode bot to 2:00, spawnBoss(kind), fight it to
// death on the virtual clock while timing every frame on the REAL clock
// (Performance.prototype.now — the harness only replaces the instance method).
// Exercises each table: calls the Croupier's coin, stands Vesper on a betting
// marker, watches the twins' wheel land; then a pinned elite-affix scene.
// NOTE: this sandbox's headless Chromium stalls ~10% of frames for 300-900ms even on an empty
// floor with no boss (GPU-less raster flushes) — read p50/p85 for the game's own cost, and
// compare against `--only pitboss` (an old boss) in the same run for an honest A/B.
// Writes shots/c2-bosses/*.jpg. Exit 1 on any runtime error or a boss that never dies.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, until, ROOT } = require('./lib');
const argv = process.argv.slice(2);
const which = argv.includes('--src') ? 'src' : 'dist';
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const noshots = argv.includes('--noshots');
const OUT = path.join(ROOT, 'shots', 'c2-bosses'); fs.mkdirSync(OUT, { recursive: true });
const p95 = a => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.floor(s.length * 0.95)].toFixed(2) : null; };
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.floor(s.length * q)].toFixed(2) : null; };
const avg = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null;

async function shot(page, name) {
  if (noshots) return;
  await page.evaluate(() => { window.__bot.renderEvery = 1; for (let k = 0; k < 3; k++) { window.__vc.step(16.7); window.__bot.step(); } });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 84 });
  console.error('  ✓ shot ' + name);
}

// one batch of fight frames, timed; plus the scripted "player" choices
const FIGHT = async (page, n, kind, timed = true, duel = false) => page.evaluate(({ n, kind, timed, duel }) => {
  const now = () => Performance.prototype.now.call(performance);
  const ft = []; const S = window.__c2 = window.__c2 || { flips: [], board: [], wheel: 0, suits: {}, deals: 0, maxEnemies: 0, pressed: 0 };
  window.__bot.renderEvery = timed ? 1 : 30;
  for (let i = 0; i < n; i++) {
    window.__fc = 0;
    window.__vc.step(16.7);
    try { window.__bot.step(); } catch (e) {}
    if (duel && state === 'playing') { // DUEL: the trash is swept off the felt and Vesper closes on the boss so auto-fire picks it
      for (let k = enemies.length - 1; k >= 0; k--) if (!enemies[k].boss) enemies.splice(k, 1);
      const b = enemies.find(e => e.bossKind === kind && (!hrWheel || e.tw === hrWheel.hot)) || enemies.find(e => e.bossKind === kind);
      if (b && !hrMarks) { const d = Math.hypot(b.x - P.x, b.y - P.y); for (const k of ['w', 'a', 's', 'd']) keys.delete(k);
        if (d > 200) { const ux = (b.x - P.x) / d, uy = (b.y - P.y) / d; if (ux > 0.38) keys.add('d'); if (ux < -0.38) keys.add('a'); if (uy > 0.38) keys.add('s'); if (uy < -0.38) keys.add('w'); } }
    }
    if (timed && state === 'playing') ft.push(window.__fc); // CPU ms of update()+render() this frame
    S.maxEnemies = Math.max(S.maxEnemies, enemies.length);
    for (const c of hrCards) if (c.done && !c._seen) { c._seen = 1; S.suits[c.s] = (S.suits[c.s] || 0) + 1; }
    // the player calls the coin: alternate a clean catch and an edge grab
    if (hrFlip && hrFlip.res < 0 && hrFlip.t > 1.2) {
      const u = hrFlip.ph - Math.floor(hrFlip.ph), face = Math.floor(hrFlip.ph) % 2;
      if (S.pressed % 2 === 0 ? (face === hrFlip.mine && Math.sin(Math.PI * u) > 0.7) : hrFlip.t > 2.4) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
        S.pressed++; S.flips.push({ res: hrFlip.res, mine: hrFlip.mine, how: hrFlip.how });
      }
    }
    // the player walks onto a betting marker just before bets close (cycles 2:1 → 5:1 → 10:1)
    if (hrMarks && hrMarks.t < 0.25 && !hrMarks._probe) { hrMarks._probe = 1; const m = hrMarks.m[S.board.length % 3]; P.x = m.x + 30; P.y = m.y; S.board.push({ o: m.o, debuffs0: debuffs.length, hp0: hrMarks.e.hp }); }
    if (hrWheel && hrWheel._probeT !== hrWheel.t && hrWheel.t > 7.9 && !hrWheel.spin) { if (!hrWheel._c) { hrWheel._c = 1; S.wheel++; } } else if (hrWheel && hrWheel.t < 7) hrWheel._c = 0;
    if (!enemies.some(e => e.bossKind === kind)) return { ft, dead: true, gt, S, err: !!window._amErr };
    if (state !== 'playing' && state !== 'slot') { /* bot handles */ }
  }
  return { ft, dead: false, gt, S, err: !!window._amErr };
}, { n, kind, timed, duel });

async function bossNight(kind) {
  const { browser, page, errors } = await launch({ which });
  await page.evaluate(() => { window.__bot.god = true; GFX.q = 'high';
    const RN = () => Performance.prototype.now.call(performance), wrap = (n) => { const f = window[n]; window[n] = function () { const t = RN(); try { return f.apply(this, arguments); } finally { window.__fc = (window.__fc || 0) + RN() - t; } }; };
    wrap('update'); wrap('render'); });
  await until(page, "state==='playing' && gt>=120", 40000);
  const pre = await page.evaluate((kind) => {
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].boss) enemies.splice(i, 1); // a clean table
    P.damage *= 5; // god-bot at lvl ~3 would take minutes of game time; the mechanics, not the dps, are under test
    window.startWave = () => {}; // the wave clock stops: no second boss walks in mid-test
    spawnBoss(kind); const b = enemies.filter(e => e.bossKind === kind);
    return { gt, level: P.level, n: b.length, hp: Math.round(b[0].maxhp), name: BOSS_DEFS[kind].name, vt: b[0].vt };
  }, kind);
  console.error(`${kind}: spawned at ${pre.gt.toFixed(1)}s (lvl ${pre.level}) hp ${pre.hp} bodies ${pre.n}`);
  let ft = [], dead = false, res, frames = 0, shotsTaken = 0;
  // entrance shot (nameplate + voice line)
  res = await FIGHT(page, 120, kind); ft = ft.concat(res.ft); frames += 120;
  await shot(page, kind + '_1_entrance');
  if (kind === 'croupier' && !noshots) { // the coin mid-spin, before anyone calls it
    await page.evaluate(() => { const b = enemies.find(e => e.bossKind === 'croupier'); if (b && !hrFlip) hrStartFlip(b); for (let i = 0; i < 36; i++) { window.__vc.step(16.7); window.__bot.step(); } });
    await shot(page, 'croupier_1b_coin_spin');
  }
  while (!dead && frames < 26000) {
    const timed = ft.length < 900 || (frames % 1200 < 240); // every frame rendered + timed in sample windows, the rest at bot speed
    res = await FIGHT(page, 120, kind, timed, frames >= 1800); ft = ft.concat(res.ft); frames += 120; dead = res.dead;
    if (frames % 1200 === 0) console.error(`  ${kind} f${frames} gt ${res.gt.toFixed(0)} bossHP ${await page.evaluate((k) => { const b = enemies.find(e => e.bossKind === k); return b ? Math.round(b.hp) : 0; }, kind)}`);
    const moment = await page.evaluate((kind) => kind === 'croupier' ? (hrCards.some(c => c.done) ? 'cards' : (hrFlip ? 'coin' : null))
      : kind === 'bookie' ? (hrMarks && hrMarks.t < 4 ? 'board' : null) : (hrWheel && hrWheel.spin ? 'wheel' : (hrWheel ? 'twins' : null)), kind);
    if (moment && shotsTaken < 2 && !dead) {
      const nm = moment + shotsTaken;
      if (shotsTaken === 0 || (kind === 'croupier' && moment === 'coin') || kind !== 'croupier') { await shot(page, kind + '_' + (shotsTaken + 2) + '_' + moment); shotsTaken++; }
    }
  }
  const after = await page.evaluate(() => ({ gt, gilt: typeof gilt !== 'undefined' ? gilt : null, crit: P.crit, dmg: P.damage, debuffs: debuffs.length, idx: IDX.b.slice(), cards: hrCards.length, marks: !!hrMarks, wheel: !!hrWheel, flip: !!hrFlip, leftovers: enemies.filter(e => e.boss).length }));
  for (let k = 0; k < 120; k++) await page.evaluate(() => { window.__vc.step(16.7); window.__bot.step(); });
  const r = { kind, spawn: pre, killed: dead, fightSec: +(res.gt - pre.gt).toFixed(1), frames, p50ms: pct(ft, 0.5), p85ms: pct(ft, 0.85), p95ms: p95(ft), avgms: avg(ft), stallFrac: +(ft.filter(x => x > 40).length / Math.max(1, ft.length)).toFixed(3), maxEnemies: res.S.maxEnemies, mech: res.S, after, errors: errors.slice(0, 5), amErr: res.err };
  await browser.close();
  return { r, errors };
}

async function affixScene() {
  const { browser, page, errors } = await launch({ which });
  await page.evaluate(() => { window.__bot.god = true; GFX.q = 'high'; });
  await until(page, "state==='playing' && gt>=60", 30000);
  const out = await page.evaluate(() => {
    const mk = (aff, dx) => { spawnEnemy('elite', P.x + dx, P.y - 200); const e = enemies[enemies.length - 1]; e.affix = aff; e.v9 = 0.2; return e; };
    const L = mk('loaded', -160), M = mk('marked', 160);
    let splitSeen = 0, dice = 0, slowed = 0;
    const n0 = enemies.filter(e => e.elite).length;
    P.crit = 1; // every shot crits — MARKED must split exactly once
    window.startWave = () => {};
    for (let i = 0; i < 420; i++) { for (let k = enemies.length - 1; k >= 0; k--) if (!enemies[k].elite) enemies.splice(k, 1); // only the two elites on the felt, so the bolts find them
      window.__vc.step(16.7); window.__bot.step();
      dice = Math.max(dice, hrDice.length); slowed = Math.max(slowed, enemies.filter(e => e._ldT > 0).length);
      if (enemies.some(e => e.affix === 'split')) splitSeen = 1; }
    return { n0, elitesNow: enemies.filter(e => e.elite).length, splitSeen, splits: enemies.filter(e => e.affix === 'split').length, dice, slowed, err: !!window._amErr };
  });
  await page.evaluate(() => { P.crit = 0.05; const x = P.x, y = P.y; for (const aff of ['loaded', 'marked']) { spawnEnemy('elite', x + (aff === 'loaded' ? -120 : 120), y - 110); const e = enemies[enemies.length - 1]; e.affix = aff; e.v9 = 0.1; } });
  for (let k = 0; k < 4; k++) await page.evaluate(() => { for (let i = 0; i < 20; i++) { window.__vc.step(16.7); window.__bot.step(); } });
  await shot(page, 'affix_loaded_marked');
  await browser.close();
  return { r: { kind: 'affixes', ...out, errors: errors.slice(0, 5) }, errors };
}

(async () => {
  const kinds = only === 'affixes' ? [] : only ? [only] : ['croupier', 'bookie', 'twins'];
  const results = []; let allErr = [], bad = false;
  for (const k of kinds) { const { r, errors } = await bossNight(k); results.push(r); allErr = allErr.concat(errors); if (!r.killed || r.amErr) bad = true;
    console.error(`${k}: ${r.killed ? 'SLAIN' : 'ALIVE'} after ${r.fightSec}s game · frame CPU p50 ${r.p50ms} / p85 ${r.p85ms} / p95 ${r.p95ms}ms · stall frames(>40ms) ${(r.stallFrac*100).toFixed(1)}% · errors ${r.errors.length}`); }
  if (!only || only === 'affixes') { const { r, errors } = await affixScene(); results.push(r); allErr = allErr.concat(errors); if (r.err || !r.splitSeen) bad = true; console.error('affixes:', JSON.stringify(r)); }
  console.log(JSON.stringify({ errors: allErr.length, results }, null, 1));
  process.exit(allErr.length || bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
