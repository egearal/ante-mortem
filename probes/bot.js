#!/usr/bin/env node
// npm run probe [-- --nights 5 --src --god --mobile --rank 20 --minutes 14 --soul martyr --floor ballroom]
// B2: --stake N (0-5, unlocks + selects that deck) · --god-until S (god only while gt<S, e.g. 930 =
//     survive the House, then fight the endless floor for real; implies --god)
// Plays N full nights with the autoplay bot on a virtual clock and prints a
// JSON report. Exit code 1 on any runtime error.
'use strict';
const { launch, run } = require('./lib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const NIGHTS = +opt('nights', 3), MAXMIN = +opt('minutes', 14);
const which = opt('src', false) ? 'src' : 'dist';

(async () => {
  const results = []; let allErrors = [];
  for (let n = 0; n < NIGHTS; n++) {
    const mobile = !!opt('mobile', false);
    const { browser, page, errors } = await launch({ which, mobile, viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 } });
    const rank = opt('rank', null);
    const godUntil = opt('god-until', null), stake = opt('stake', null);
    await page.evaluate(({ god, rank, godUntil, stake, floor }) => { window.__bot.god = god; if (floor) window.__probeFloor = floor; if (godUntil) window.__bot.godUntil = +godUntil; if (rank) { try { RANK.rank = +rank; RANK._ld = 1; } catch (e) {} }
      if (stake != null) { try { STK.won = 1; STK.best = {}; SOULS.forEach(s => { STK.best[s.id] = Math.max(-1, +stake - 1); }); STK.sel = +stake; } catch (e) {} } }, { god: !!opt('god', false) || !!godUntil, rank, godUntil, stake, floor: opt('floor', null) });
    // --soul <id>: seat a soul for the night (D1) — unseals it for this page only
    if (opt('no-gate', false)) await page.evaluate(() => { window.__bot.noGate = true; });
    if (opt('feed-tier', null) != null) await page.evaluate(n => { window.__bot.feedTier = n; }, +opt('feed-tier', 1));
    const soul = opt('soul', null);
    if (soul) await page.evaluate((id) => { const s = SOULS.find(x => x.id === id); if (!s) throw new Error('no soul ' + id); s.u = () => true; IDX.sl = id; }, soul);
    const t0 = Date.now();
    // virtual frames: gt runs at 1.71x, so MAXMIN game-minutes ≈ MAXMIN*60/1.71 s
    const frames = Math.ceil(MAXMIN * 60 / 1.71 / 0.0167) + 3000;
    await run(page, frames);
    const r = await page.evaluate(() => ({
      res: window.__bot.res, stall: window.__bot.stall || null,
      alive: !window.__bot.res, clock: typeof gt === 'number' ? fmt(gt) : null, gt,
      level: P && P.level, maxLevel: window.__bot.maxLevel, kills: P && P.kills,
      stake: P && P.stake, won: !!window._b2won, endless: !!(P && P._endless), endlessSec: (P && P._endless) ? Math.round(gt - P._endT0) : null, scoreMult: (typeof b2ScoreMult === 'function') ? b2ScoreMult() : null, peakEnemies: window.__bot.peakE || 0,
      states: window.__bot.states, amErr: !!window._amErr, timerErr: window.__timerErr || 0,
      soulFx: P ? { mSt: P._mSt || 0, chips: LT.chips || 0, bkPaid: P._bkPaid || 0, coins: P.coins } : null,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    }));
    r.realSec = Math.round((Date.now() - t0) / 100) / 10;
    r.errors = errors.slice(0, 5);
    allErrors = allErrors.concat(errors);
    if (r.stall) allErrors.push('stall: ' + JSON.stringify(r.stall)); // a frozen night fails the probe
    results.push(r);
    if (r.stall) console.error('  STALL ' + JSON.stringify(r.stall));
    console.error(`night ${n + 1}: ${r.res ? 'died ' + r.res.clock + ' lvl ' + r.res.level + ' kills ' + r.res.kills : 'alive at ' + r.clock + ' lvl ' + r.level}${r.stake ? ' · stake ' + r.stake : ''}${r.won ? ' · WON' : ''}${r.endless ? ' · endless +' + r.endlessSec + 's ×' + r.scoreMult : ''} · ${r.realSec}s real · errors ${errors.length}`);
    await browser.close();
  }
  const deaths = results.filter(r => r.res).map(r => r.res.gt).sort((a, b) => a - b);
  const med = deaths.length ? deaths[deaths.length >> 1] : null;
  const fmt = s => s == null ? null : Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const summary = { nights: NIGHTS, deaths: deaths.length, medianDeath: fmt(med), errors: allErrors.length, which, soul: opt('soul', null), floor: opt('floor', 'pit') };
  console.log(JSON.stringify({ summary, results }, null, 1));
  process.exit(allErrors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
