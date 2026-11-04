#!/usr/bin/env node
// node probes/pairing.js [--only ossuary,eye] [--src] [--shots label] [--night]
// C1 — THE PAIRINGS probe. For each pairing, on the BUILT file:
//   1. bot plays (god mode) to 2:00
//   2. the weapon is set to MAX and its partner skill granted; base-max DPS is
//      measured for 15 game-seconds (pairing held back)
//   3. a level-up is queued: the slot must open THE PAIRING (stage 'pairing'),
//      reach 'pairoffer' on its own clock (bot hands off), and CLAIM must evolve
//   4. evolved DPS over the same 15s window → ratio
//   5. 300 enemies are packed around the player; real ms per frame (update +
//      render, every frame, q=high) is measured over 120 frames with the
//      evolution firing
// --night: after the claim, take god off and let the bot play to death
// Exit 1 on any runtime error or failed check.
'use strict';
const { launch, run, until } = require('./lib');
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const which = opt('src', false) ? 'src' : 'dist';
const SHOTS = opt('shots', null), NIGHT = !!opt('night', false);
const ALL = ['ossuary','stacked','cuts','eye','ratking','maiden','hand','cremat','garden','russian',
  // H3 — the deeper back room
  'chaingang','carpet','craps','shark','queen','ouro','champagne','heart','grand','blackdeath'];
const ONLY = opt('only', null) ? String(opt('only')).split(',') : ALL;

// 300 immortal, harmless dummies packed around the player: controlled DPS + real frame cost
async function arena(page) {
  await until(page, `state==='playing'`, 20000);
  return page.evaluate(async () => {
    pending.length = 0; const ik = P.instakill; P.instakill = 0; P.godT = 0;
    try { GFX.q = 'high'; } catch (e) {}
    const keep = enemies.slice(); enemies.length = 0;
    const types = ['shambler', 'husk', 'swarm', 'stalker', 'brute', 'wraith'];
    const fill = () => { while (enemies.length < 300) { const a = Math.random() * 6.283, d = 90 + Math.random() * 380; spawnEnemy(types[enemies.length % types.length], P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); const e = enemies[enemies.length - 1]; e.hp = e.maxhp = 1e7; e.dmg = 0; e.ranged = false; } };
    fill();
    window.__bot.renderEvery = 1; const hp0 = P.hp;
    const now = () => Performance.prototype.now.call(performance);
    const ts = []; let d0 = 0, g0 = 0;
    for (let i = 0; i < 320; i++) { fill(); if (i === 20) { d0 = P.dmgDealt || 0; g0 = gt; }
      const t0 = now(); window.__vc.step(16.7); try { window.__bot.step(); } catch (e) {} const t1 = now(); if (i >= 20) ts.push(t1 - t0); if (i % 10 === 9) await null; }
    const dps = Math.round(((P.dmgDealt || 0) - d0) / Math.max(0.01, gt - g0));
    window.__bot.renderEvery = 30; enemies.length = 0; for (const e of keep) enemies.push(e); P.hp = Math.max(P.hp, hp0); P.instakill = ik;
    ts.sort((a, b) => a - b);
    return { dps, shots: (typeof evoShots !== 'undefined' ? evoShots.length : 0) + (typeof h3S !== 'undefined' ? h3S.length + h3Z.length + h3D.length : 0), avg: +(ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(2), p95: +ts[Math.floor(ts.length * 0.95)].toFixed(2) };
  });
}
async function dps(page, secs) {
  await page.evaluate(() => { window.__d0 = P.dmgDealt || 0; window.__g0 = gt; window.__k0 = P.kills; });
  await until(page, `gt - window.__g0 >= ${secs}`, 60000);
  return page.evaluate(() => ({ dps: Math.round(((P.dmgDealt || 0) - window.__d0) / (gt - window.__g0)), kills: P.kills - window.__k0, dmg: Math.round(P.damage) }));
}

(async () => {
  const out = []; let allErr = [], fails = [];
  for (const id of ONLY) {
    const { browser, page, errors } = await launch({ which });
    try {
      await page.evaluate(() => { window.__bot.god = true; try { RANK.rank = 60; RANK._ld = 1; } catch (e) {} });
      await until(page, `typeof gt==='number' && state==='playing' && gt>=120`, 200000);
      // close whatever table might be open, then set the stage
      const setup = await page.evaluate((id) => {
        const pr = PAIRINGS.find(x => x.id === id), W = WEAPONS.find(w => w.id === pr.w), Pd = PASSIVES.find(p => p.id === pr.p);
        window.__hold = true; // hold the pairing back while we measure the base weapon
        const _rp = readyPairing; window.readyPairing = function () { return window.__hold ? null : _rp(); };
        // make room: the weapon cap is 5
        const own = WEAPONS.filter(w => (P.wlv[w.id] || 0) > 0 && w.id !== 'bolt' && w.id !== W.id);
        while (own.length + 2 > WEAPON_CAP) { const w = own.pop(); P.wlv[w.id] = 0; }
        P.wlv[W.id] = W.max;
        if (skillLevel(Pd.id) === 0) { Pd.ap(); addPassiveHUD(Pd); }
        renderRelics();
        return { weapon: W.n, skill: Pd.n, ready: pairReady(pr) };
      }, id);
      await page.evaluate(() => { pending.length = 0; });
      const base = await dps(page, 15);
      const perfBase = await arena(page);
      // queue a level-up; the pairing must take the pull
      await until(page, `state==='playing'`, 20000);
      await page.evaluate(() => { window.__hold = false; window.__bot.noSlotTap = true; pending.length = 0; pending.push({}); if (state === 'playing') openNextSlot(); });
      const opened = await page.evaluate(() => ({ state, stage: slotStage, tag: (document.getElementById('slotTag') || {}).textContent }));
      if (SHOTS) { const dir = path.join(__dirname, '..', 'shots', SHOTS); fs.mkdirSync(dir, { recursive: true }); }
      const shot = async (n) => { if (!SHOTS) return; await page.screenshot({ path: path.join(__dirname, '..', 'shots', SHOTS, id + '_' + n + '.jpg'), type: 'jpeg', quality: 82 }); };
      // the ceremony runs on its own clock: real-time step so CSS transitions keep pace
      const tl = [];
      for (let ms = 0; ms < 7000; ms += 100) {
        await page.evaluate(() => { for (let i = 0; i < 6; i++) window.__vc.step(16.7); });
        await page.waitForTimeout(100);
        const st = await page.evaluate(() => slotStage);
        if (!tl.length || tl[tl.length - 1][1] !== st) tl.push([ms, st]);
        if (SHOTS && (ms === 1100 || ms === 2900 || ms === 3700)) await shot('cer' + ms);
        if (st === 'pairoffer') { await page.waitForTimeout(400); await shot('offer'); break; }
      }
      const offer = await page.evaluate(() => ({ stage: slotStage, name: document.getElementById('cardName').textContent, desc: document.getElementById('cardDesc').textContent.slice(0, 160) }));
      await page.evaluate(() => { slotTap(); window.__bot.noSlotTap = false; });
      await until(page, `state==='playing'`, 4000);
      const claimed = await page.evaluate((id) => ({ evo: P.evo && Object.values(P.evo).includes(id), idx: IDX.pr.indexOf(id) >= 0, lt: LT.pairings }), id);
      const evo = await dps(page, 15);
      if (SHOTS) { await page.evaluate(() => { window.__bot.renderEvery = 1; }); await run(page, 30); await shot('play'); await page.evaluate(() => { window.__bot.renderEvery = 30; }); }
      const perf = await arena(page);
      let night = null;
      if (NIGHT) { await page.evaluate(() => { enemies.length = 0; window.__bot.god = false; });
        await run(page, Math.ceil(12 * 60 / 1.71 / 0.0167));
        night = await page.evaluate(() => window.__bot.res || { alive: true, clock: fmt(gt), level: P.level }); }
      const r = { id, ...setup, opened, timeline: tl, offer, claimed, baseDps: base, evoDps: evo, ratio: +(evo.dps / Math.max(1, base.dps)).toFixed(2), perfBase, perf, arenaRatio: +(perf.dps / Math.max(1, perfBase.dps)).toFixed(2), night, errors: errors.slice(0, 4) };
      const ok = opened.stage === 'pairing' && offer.stage === 'pairoffer' && claimed.evo && claimed.idx && errors.length === 0;
      if (!ok) fails.push(id);
      out.push(r);
      console.error(`${id.padEnd(8)} ${ok ? 'OK ' : 'FAIL'} live ${base.dps}/s → ${evo.dps}/s (×${r.ratio}) · arena(300 dummies) ${perfBase.dps}/s → ${perf.dps}/s (×${r.arenaRatio}) · frame avg ${perfBase.avg}→${perf.avg}ms p95 ${perfBase.p95}→${perf.p95}ms (${perf.shots} shots)${night ? ' · night ' + (night.clock || '') + ' lvl ' + night.level : ''} · errors ${errors.length}`);
    } catch (e) { fails.push(id); console.error(id, 'CRASH', e); }
    allErr = allErr.concat(errors);
    await browser.close();
  }
  console.log(JSON.stringify({ summary: { pairings: out.length, fails, errors: allErr.length }, results: out }, null, 1));
  process.exit(allErr.length || fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
