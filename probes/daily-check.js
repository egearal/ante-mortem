#!/usr/bin/env node
// node probes/daily-check.js [--src] [--seconds 60]
// B1 proof: two fresh DAILY DEBT runs of the same seed, driven by the same
// scripted inputs (the autoplay bot on the virtual clock), must produce the
// identical first N game-seconds of spawns and slot results. A different seed
// must diverge, and two NORMAL nights must diverge too (they stay on Math.random).
'use strict';
const { launch, until } = require('./lib');
const argv = process.argv.slice(2);
const which = argv.includes('--src') ? 'src' : 'dist';
const SECS = +(argv[argv.indexOf('--seconds') + 1] || 60) || 60;

async function night(day) {
  const { browser, page, errors } = await launch({ which });
  await page.evaluate((day) => {
    const L = window.__dlog = { spawns: [], slots: [], fates: [] };
    const _se = spawnEnemy;
    spawnEnemy = function (type, x, y) { const r = _se.apply(this, arguments);
      const e = enemies[enemies.length - 1]; L.spawns.push([+gt.toFixed(2), type, e ? Math.round(e.x) : null, e ? Math.round(e.y) : null]); return r; };
    const _fr = finalizeReward;
    finalizeReward = function (bestId, matchN) { L.slots.push([+gt.toFixed(2), slotKind, bestId, matchN]); return _fr.apply(this, arguments); };
    const _df = dealFate;
    dealFate = function () { const r = _df.apply(this, arguments); L.fates.push(slotFate ? [slotFate.n, slotFate.s || null] : null); return r; };
    if (day) { window._dlyDay = day; DLY.next = 'daily'; }
  }, day);
  await until(page, `state!=='menu' && typeof gt==='number' && gt>=${SECS}`, 60000);
  const out = await page.evaluate(() => ({ log: window.__dlog, daily: !!DLY_RNG, terms: DLY.terms && { n: DLY.terms.n, name: DLY.terms.name, soul: DLY.terms.soul, floor: DLY.terms.floor, mods: DLY.terms.mods.map(m => m.id) },
    gt, level: P.level, kills: P.kills, state }));
  out.errors = errors;
  await browser.close();
  return out;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const DAY = 20261112, OTHER = 20261113;
  const A = await night(DAY), B = await night(DAY), C = await night(OTHER), N1 = await night(0), N2 = await night(0);
  const rows = {
    'daily A == daily B (spawns)': same(A.log.spawns, B.log.spawns),
    'daily A == daily B (slot results)': same(A.log.slots, B.log.slots),
    'daily A == daily B (slot fates)': same(A.log.fates, B.log.fates),
    'daily seed differs from next day': !same(A.log.spawns, C.log.spawns),
    'normal nights stay random': !same(N1.log.spawns, N2.log.spawns),
    'daily mode armed / normal not': A.daily && B.daily && C.daily && !N1.daily && !N2.daily,
  };
  const errors = [A, B, C, N1, N2].reduce((s, r) => s.concat(r.errors), []);
  const pass = Object.values(rows).every(Boolean) && !errors.length && A.log.spawns.length > 20 && A.log.slots.length > 0;
  console.log(JSON.stringify({
    pass, seconds: SECS, checks: rows,
    debt: A.terms, nextDebt: C.terms,
    counts: { spawnsA: A.log.spawns.length, spawnsB: B.log.spawns.length, slotsA: A.log.slots.length, slotsB: B.log.slots.length },
    firstSlotsA: A.log.slots.slice(0, 4), firstSlotsB: B.log.slots.slice(0, 4),
    firstSpawnsA: A.log.spawns.slice(0, 3), firstSpawnsB: B.log.spawns.slice(0, 3),
    errors: errors.slice(0, 6),
  }, null, 1));
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
