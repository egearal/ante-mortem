#!/usr/bin/env node
// node launch/tools/capture.js [--only slot,boss,...] [--src]
// H1 THE LAUNCH KIT — store screenshots straight from the BUILT game.
// Every scene is a fresh night on the probe harness (virtual clock, god-mode bot,
// seeded Math.random so a re-run deals the same night), rendered at 1280×720
// logical × 1.5 device pixels = 1920×1080 at the game's own camera.
// Presentation only: outcomes are forced through the same hooks the probes use
// (MFATE for the triple, spawnBoss, _arcForce, a held pairing) — no gameplay code changes.
// Writes launch/raw/*.png (lossless, inputs for compose) — see launch/README.md.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('../../probes/lib');
const argv = process.argv.slice(2);
const which = argv.includes('--src') ? 'src' : 'dist';
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].split(',') : null;
const RAW = path.join(ROOT, 'launch', 'raw'); fs.mkdirSync(RAW, { recursive: true });
const BOT_SRC = fs.readFileSync(path.join(ROOT, 'probes', 'lib.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
const DESK = { which, viewport: { width: 1280, height: 720 }, scale: 1.5 };

const vstep = (page, n) => page.evaluate(n => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n);
async function live(page, ms) { // virtual time at real speed so CSS transitions keep pace
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { await page.evaluate(() => { window.__vc.step(16.7); try { window.__bot.step(); } catch (e) {} }); await page.waitForTimeout(14); }
}
async function shot(page, name, { settle = 300, frames = 3 } = {}) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  if (frames) await run(page, frames);
  await page.waitForTimeout(settle);
  await page.screenshot({ path: path.join(RAW, name + '.png') });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('  ✓ ' + name);
}
// shared night setup: a dressed-up mid-game build so the felt is busy and every weapon shows its effect
const DRESS = `(()=>{ try{ GFX.q='high'; }catch(e){}
  const set={ orbit:5, scythe:5, chand:5, candelabra:5 };
  for(const k in set){ P.wlv[k]=set[k]; try{ idxSee('w',k); }catch(e){} }
  try{ renderRelics(); }catch(e){}
})()`;
// a veteran's save: past the first-night pacing and tips, a few nights on the books (store shots show the real game)
const VET = {
  antemortem_ach_v2: { u: [], LT: { kills: 6400, coins: 9200, runs: 34, deaths: 33, triples: 6, rites: 9, spins: 120, houseMet: 1, bossKills: 6, bossBy: { pitboss: 3, croupier: 2, bookie: 1 }, coach: { audio: 1, slot: 1, move: 1, bet: 1 } }, REC: { minutes: 12 }, S: [], SP: true },
  am_rank_v1: { v: 3, marks: 30000, rank: 1 },
};
// capture-only: unlock toasts, tips and the secret card are hidden so the felt reads (they are transient DOM notices, not the game)
const QUIET = '#achToasts,#coachToast,#secretReveal{display:none!important}';
async function prime(L, save, opts = {}) {
  await L.page.addInitScript(s => { try { if (!sessionStorage.getItem('__h1seed')) { for (const k in s) localStorage.setItem(k, JSON.stringify(s[k])); sessionStorage.setItem('__h1seed', '1'); } } catch (e) {} }, save);
  await L.page.reload(); await L.page.evaluate(BOT_SRC);
  await L.page.evaluate(() => { try { window.muted = true; } catch (e) {} });
  if (opts.quiet !== false) await L.page.addStyleTag({ content: QUIET });
  return L;
}
async function night(seed, extra) {
  const L = await prime(await launch(Object.assign({}, DESK, { seed })), VET);
  await L.page.evaluate(() => { window.__bot.god = true; });
  if (extra) await L.page.evaluate(extra);
  return L;
}

const SCENES = {
  // 1 — the brass slot mid-triple: fate forced to a triple, the last reel lands, the fanfare goes up
  async slot() {
    const { browser, page, errors } = await night(7);
    await page.evaluate(() => { window.__bot.noSlotTap = true; });
    await until(page, "state==='playing' && gt>50", 30000);
    await page.evaluate(() => { P.xp = Math.max(P.xp, P.xpNext - 0.01); if (typeof cashRage === 'function' && P.ovT > 0) cashRage(); });
    if (!await until(page, "state==='slot' && slotStage==='ready'", 30000)) throw new Error('slot never opened');
    await page.evaluate(() => { window.__bot.renderEvery = 1; }); await live(page, 700);
    await page.evaluate(() => { MFATE._T = MFATE.T; MFATE.T = 1; slotTap(); });
    await live(page, 900);
    await page.evaluate(() => { stopLock = 0; slotTap(); }); await live(page, 350);
    await page.evaluate(() => { stopLock = 0; slotTap(); }); await live(page, 450);
    await page.evaluate(() => { stopLock = 0; slotTap(); }); await live(page, 500);
    await shot(page, 'slot_creep', { frames: 0, settle: 50 });
    await live(page, 700);
    await shot(page, 'slot_lands', { frames: 0, settle: 50 });
    await until(page, "slotStage==='offer'", 600); await live(page, 300);
    await shot(page, 'slot_ceremony', { frames: 0, settle: 50 });
    await browser.close(); return errors;
  },
  // 2 — a High Roller at the table: the Croupier deals hazard cards and flips his coin
  async boss() {
    const out = [];
    for (const kind of ['croupier', 'twins']) {
      const { browser, page, errors } = await night(kind === 'twins' ? 21 : 13);
      await until(page, "state==='playing' && gt>=100", 40000);
      await page.evaluate(DRESS);
      await page.evaluate((kind) => { for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].boss) enemies.splice(i, 1); window.startWave = () => {}; spawnBoss(kind); }, kind);
      await until(page, "state==='playing'", 4000);
      await run(page, 20);
      await shot(page, 'boss_' + kind + '_entrance', { settle: 500 });
      if (kind === 'croupier') {
        await until(page, "state==='playing' && hrCards.length>=3", 2400);
        await shot(page, 'boss_croupier_cards');
        await until(page, "state==='playing' && hrFlip && hrFlip.t>0.9", 3000);
        await shot(page, 'boss_croupier_coin');
      } else {
        await until(page, "state==='playing' && hrWheel && hrWheel.spin", 3000);
        await run(page, 25);
        await shot(page, 'boss_twins_wheel');
      }
      out.push(...errors); await browser.close();
    }
    return out;
  },
  // 3 — an evolution ceremony: a maxed weapon + its paired skill, the slot opens THE PAIRING
  async evo() {
    const { browser, page, errors } = await night(31, () => { try { RANK.rank = 60; RANK._ld = 1; } catch (e) {} });
    await until(page, "state==='playing' && gt>=110", 200000);
    await page.evaluate(() => {
      const pr = PAIRINGS.find(x => x.id === 'eye') || PAIRINGS[0], W = WEAPONS.find(w => w.id === pr.w), Pd = PASSIVES.find(p => p.id === pr.p);
      const own = WEAPONS.filter(w => (P.wlv[w.id] || 0) > 0 && w.id !== 'bolt' && w.id !== W.id);
      while (own.length + 2 > WEAPON_CAP) { const w = own.pop(); P.wlv[w.id] = 0; }
      P.wlv[W.id] = W.max; if (skillLevel(Pd.id) === 0) { Pd.ap(); addPassiveHUD(Pd); } renderRelics();
    });
    await until(page, "state==='playing'", 20000);
    await page.evaluate(() => { window.__bot.noSlotTap = true; window.__bot.renderEvery = 1; pending.length = 0; pending.push({}); if (state === 'playing') openNextSlot(); });
    for (let ms = 0; ms < 7000; ms += 100) {
      await page.evaluate(() => { for (let i = 0; i < 6; i++) window.__vc.step(16.7); });
      await page.waitForTimeout(100);
      if (ms === 1100 || ms === 2900) await shot(page, 'evo_cer' + ms, { frames: 0, settle: 30 });
      if (await page.evaluate(() => slotStage) === 'pairoffer') { await page.waitForTimeout(400); await shot(page, 'evo_offer', { frames: 0, settle: 30 }); break; }
    }
    await page.evaluate(() => { slotTap(); window.__bot.noSlotTap = false; });
    await until(page, "state==='playing'", 4000);
    await run(page, 200);
    await shot(page, 'evo_play');
    await browser.close(); return errors;
  },
  // 4 — a Major Arcana reveal: the Tower is dealt, Vesper walks onto it
  async arcana() {
    const out = [];
    for (const id of ['tower', 'death']) {
      const { browser, page, errors } = await night(id === 'tower' ? 41 : 43);
      await until(page, "state==='playing' && gt>75 && enemies.length>12", 30000);
      await page.evaluate(DRESS);
      await page.evaluate((id) => { window._arcForce = id; tarotT = 0; tarots.length = 0; }, id);
      await until(page, 'tarots.some(t=>t.maj)', 2000);
      await page.evaluate(() => { const c = tarots.find(t => t.maj); if (c) { c.x = P.x; c.y = P.y; } });
      await run(page, 2);
      await shot(page, 'arcana_' + id, { settle: 1500 });
      out.push(...errors); await browser.close();
    }
    return out;
  },
  // 5 — the Ballroom storm: 300 of the damned on the waltz floor, every blade in the build turning
  async storm() {
    const { browser, page, errors } = await night(51, () => { window.__probeFloor = 'ballroom'; try { REC.minutes = Math.max(REC.minutes || 0, 10); } catch (e) {} });
    await until(page, "state==='playing' && gt>150", 60000);
    await page.evaluate(DRESS);
    await page.evaluate(() => {
      pending.length = 0; window.openNextSlot = () => {}; window.startWave = () => {}; // no level-up table opens over the storm
      const types = ['shambler', 'husk', 'swarm', 'stalker', 'brute', 'wraith'];
      for (let i = 0; i < 300; i++) { const a = Math.random() * 6.283, d = 230 + Math.random() * 520;
        spawnEnemy(types[i % types.length], P.x + Math.cos(a) * d * 1.5, P.y + Math.sin(a) * d); const e = enemies[enemies.length - 1]; if (e) { e.hp = e.maxhp = e.maxhp * 40; e.dmg = 0; } }
    });
    const clear = "state==='playing' && $('jackpotLayer').classList.contains('hidden')";
    await run(page, 50); await until(page, clear, 3000);
    await shot(page, 'storm_a', { frames: 2 });
    await run(page, 40); await until(page, clear, 3000);
    await shot(page, 'storm_b', { frames: 2 });
    // the clean plate for cover art: the same floor a beat later with every DOM layer (HUD, banners) lifted — canvas only
    await run(page, 30); await until(page, clear, 3000);
    await page.addStyleTag({ content: '#wrap > *:not(canvas), body > *:not(#wrap):not(script) { visibility: hidden !important; }' });
    await shot(page, 'storm_clean', { frames: 2 });
    const n = await page.evaluate(() => enemies.length); console.error('    enemies on the floor: ' + n);
    await browser.close(); return errors;
  },
  // 6 — the Book of Debts on a mid-progress save
  async book() {
    const MID = {
      am_rank_v1: { v: 3, marks: 9000, rank: 1 },
      antemortem_ach_v2: { u: [], LT: { kills: 1900, coins: 4212, runs: 22, deaths: 21, triples: 2, rites: 6, spins: 60, houseMet: 0, bossKills: 2, bossBy: { pitboss: 2 } }, REC: { minutes: 8 }, S: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9'], SP: true },
      am_index_v1: { w: [], p: [], c: [], t: [], e: [], b: ['pitboss', 'croupier'], sl: 'vesper', fl: 'pit', ct: [], ind: [], ctSlots: 1 },
      antemortem_gilt_v1: { gilt: 4800, best: 4100 },
      am_seats_v1: { seen: ['vesper'], st: { rage: 9 } },
      am_book_v1: { v: 1, seen: ['soul:vesper', 'floor:pit', 'rank:5'], dsMax: 0 }
    };
    const { browser, page, errors } = await prime(await launch(Object.assign({}, DESK, { seed: 61 })), MID);
    await page.evaluate(() => { window.__bot.renderEvery = 1; window.__bot.startedAt = -1; });
    await vstep(page, 240); await page.waitForTimeout(400); await vstep(page, 540); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(RAW, 'menu.png') }); console.error('  ✓ menu');
    await page.click('#e2BookBtn'); await vstep(page, 30); await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(RAW, 'book.png') }); console.error('  ✓ book');
    await browser.close(); return errors;
  },
  // 7 — the phone: portrait, thumb stick, mid-night (composited into 1920×1080 by compose)
  async phone() {
    const { browser, page, errors } = await prime(await launch({ which, mobile: true, viewport: { width: 390, height: 844 }, scale: 3, seed: 71 }), VET);
    await page.evaluate(() => { window.__bot.god = true; });
    await until(page, "state==='playing' && gt>95", 30000);
    await page.evaluate(DRESS);
    await run(page, 120);
    await shot(page, 'phone_play', { settle: 400 });
    await browser.close(); return errors;
  },
  // 8 — the hero: Vesper's painted portrait re-rendered at 10× (the same paint code the Ante Room uses)
  async portrait() {
    const { browser, page, errors } = await launch({ which, viewport: { width: 1280, height: 720 }, seed: 81 });
    const url = await page.evaluate(() => {
      const src = soulPortrait.toString().replace('function soulPortrait', 'function __hiPortrait').replace('S=2,', 'S=10,')
        .replace('if(_PORT[key]) return _PORT[key];', '').replace('_PORT[key]=c; return c;', 'return c;');
      const f = (0, eval)('(' + src + ')'); return f('vesper', false).toDataURL('image/png');
    });
    fs.writeFileSync(path.join(RAW, 'vesper_portrait.png'), Buffer.from(url.split(',')[1], 'base64')); console.error('  ✓ vesper_portrait');
    await browser.close(); return errors;
  },
};

(async () => {
  const errs = [];
  for (const k of Object.keys(SCENES)) {
    if (only && !only.includes(k)) continue;
    console.error('▸ ' + k);
    try { errs.push(...(await SCENES[k]())); } catch (e) { errs.push(k + ': ' + (e.stack || e)); console.error(e); }
  }
  console.log(JSON.stringify({ raw: path.relative(ROOT, RAW), errors: errs.slice(0, 10) }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
