#!/usr/bin/env node
// node probes/h3-daily.js — two DAILY DEBT runs of the same seed with H3
// evolutions forced on at 0:10 must match spawn-for-spawn and kill-for-kill.
'use strict';
const { launch, until } = require('./lib');
const SETS = [['dice','craps','luck'],['mortar','carpet','reach'],['aura','blackdeath','regen'],['chalice','champagne','vital'],['moths','queen','fortune']];
const SETS2 = [['phantom','shark','tip'],['coil','chaingang','chips'],['serpent','ouro','spd'],['nova','heart','shell'],['chand','grand','dmg']];
async function night(set) {
  const { browser, page, errors } = await launch({ which: 'dist' });
  await page.evaluate(() => { window.__bot.god = true; const L = window.__dl = []; const _se = spawnEnemy;
    spawnEnemy = function () { const r = _se.apply(this, arguments); const e = enemies[enemies.length - 1]; L.push([+gt.toFixed(2), e ? Math.round(e.x) : 0]); return r; };
    window._dlyDay = 20261112; DLY.next = 'daily'; });
  await until(page, `state==='playing' && gt>=10`, 60000);
  await page.evaluate((set) => { for (const [w, id, p] of set) { P.wlv[w] = WEAPONS.find(x => x.id === w).max; P.evo = P.evo || {}; P.evo[w] = id; } renderRelics(); }, set);
  await until(page, `gt>=70`, 120000);
  const o = await page.evaluate(() => ({ spawns: window.__dl.length, sig: JSON.stringify(window.__dl).length, kills: P.kills, coins: P.coins, dmg: Math.round(P.dmgDealt || 0), daily: !!DLY_RNG }));
  o.errors = errors.length; await browser.close(); return o;
}
(async () => { let bad = 0;
  for (const set of [SETS, SETS2]) { const a = await night(set), b = await night(set);
    const same = JSON.stringify(a) === JSON.stringify(b); console.log(set.map(s => s[1]).join(','), same ? 'IDENTICAL' : 'DIVERGED', JSON.stringify(a), JSON.stringify(b));
    if (!same || a.errors || !a.daily) bad++; }
  process.exit(bad ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
