#!/usr/bin/env node
// node probes/e2book.js [label]  → shots/<label>/ (default e2)
// E2 — THE BOOK OF DEBTS. Checks + shots on a FRESH save and a simulated MID-PROGRESS save,
// desktop 1280×720 and phone 390×844: the door (and its NEW! wax), the book, TONIGHT'S DEBTS,
// the chapters, ESC/SPACE law, pad focus walking the book (fake standard pad), and the death
// ledger's nearest-debt line moving as the night is tallied.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'e2';
const which = process.argv.includes('--src') ? 'src' : 'dist';
// the bot lives in lib.js as a page script; re-install it after a reload
const BOT_SRC = fs.readFileSync(path.join(__dirname, 'lib.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
const OUT = path.join(ROOT, 'shots', label); fs.mkdirSync(OUT, { recursive: true });
const checks = []; let failed = 0;
const ok = (c, n, info) => { checks.push((c ? '✓ ' : '✗ ') + n + (info ? '  ' + info : '')); if (!c) failed++; };
const vstep = (page, n) => page.evaluate(n => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n);
async function shot(page, name, el) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; }); await vstep(page, 6); await page.waitForTimeout(650);
  const o = { path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 84 };
  if (el) await (await page.$(el)).screenshot(o); else await page.screenshot(o);
  await page.evaluate(() => { window.__bot.renderEvery = 30; }); console.error('  ✓ ' + name);
}
const MID = {
  am_rank_v1: { v: 3, marks: 9000, rank: 1 },
  antemortem_ach_v2: { u: [], LT: { kills: 1900, coins: 4212, runs: 22, deaths: 21, triples: 2, rites: 6, spins: 60, houseMet: 0, bossKills: 2, bossBy: { pitboss: 2 } }, REC: { minutes: 8 }, S: ['a1','a2','a3','a4','a5','a6','a7','a8','a9'], SP: true },
  am_index_v1: { w: [], p: [], c: [], t: [], e: [], b: ['pitboss', 'croupier'], sl: 'vesper', fl: 'pit', ct: [], ind: [], ctSlots: 1 },
  antemortem_gilt_v1: { gilt: 4800, best: 4100 },
  am_seats_v1: { seen: ['vesper'], st: { rage: 9 } },
  am_book_v1: { v: 1, seen: ['soul:vesper', 'floor:pit', 'rank:5'], dsMax: 0 }
};
async function boot(opts, save) {
  const L = await launch(Object.assign({ which }, opts));
  if (save) {
    // seed before the page's own scripts run (an evaluate+reload races the page's unload saves)
    await L.page.addInitScript(s => { try { if (!sessionStorage.getItem('__e2seed')) { for (const k in s) localStorage.setItem(k, JSON.stringify(s[k])); sessionStorage.setItem('__e2seed', '1'); } } catch (e) {} }, save);
    await L.page.reload(); await L.page.evaluate(BOT_SRC); }
  await L.page.evaluate(() => { window.__bot = window.__bot || { renderEvery: 1, step() {} }; window.__bot.renderEvery = 1; });
  await vstep(L.page, 240); await L.page.waitForTimeout(400);
  await vstep(L.page, 540); await L.page.waitForTimeout(500); // let a seat ceremony (D1, 7s) finish before the shots
  return L;
}
async function bookChecks(page, tag, phone) {
  const door = await page.evaluate(() => { const b = document.getElementById('e2BookBtn'); if (!b) return null; const r = b.getBoundingClientRect();
    return { vis: r.width > 20 && r.height > 10, newSeal: b.classList.contains('e2New'), wax: b.querySelector('.e2Wax').textContent, sub: b.querySelector('.e2DoorS').textContent, inView: r.bottom <= innerHeight + 2 || phone }; });
  ok(!!door && door.vis, tag + ': the door stands in the hall', door && door.sub);
  await shot(page, tag + '_menu');
  await page.click('#e2BookBtn'); await vstep(page, 30);
  const bk = await page.evaluate(() => { const p = document.getElementById('e2Book'); const r = p.querySelector('.panel').getBoundingClientRect();
    return { open: !p.classList.contains('hidden'), pins: [...p.querySelectorAll('.e2Pin')].map(x => x.querySelector('.e2N').textContent + ' — ' + x.querySelector('.e2Pt').textContent),
      chapters: [...p.querySelectorAll('.e2Ch')].map(x => x.id.replace('e2ch_', '') + ':' + x.querySelector('.e2ChN').textContent),
      fits: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, hscroll: document.documentElement.scrollWidth > innerWidth + 1,
      undef: /undefined|NaN/.test(p.textContent), fresh: p.querySelectorAll('.e2Fresh').length,
      doorNew: document.getElementById('e2BookBtn').classList.contains('e2New') }; });
  ok(bk.open, tag + ': the book opens');
  ok(bk.pins.length === 3, tag + ': three marked debts', bk.pins.join(' | '));
  ok(bk.chapters.length === 9, tag + ': nine chapters', bk.chapters.join(' · '));
  ok(bk.fits && !bk.hscroll, tag + ': the book fits the glass');
  ok(!bk.undef, tag + ': no undefined/NaN in the book');
  await shot(page, tag + '_book');
  // scroll through the chapters
  await page.evaluate(() => { const n = document.querySelector('.e2NavB[data-ch="stakes"]'); n && n.click(); }); await page.waitForTimeout(700);
  await shot(page, tag + '_book_stakes');
  await page.evaluate(() => { const n = document.querySelector('.e2NavB[data-ch="ranks"]'); n && n.click(); }); await page.waitForTimeout(700);
  await shot(page, tag + '_book_ranks');
  // SPACE under the book deals no night; ESC closes
  await page.keyboard.press('Space'); await vstep(page, 20);
  const st = await page.evaluate(() => state);
  ok(st === 'menu', tag + ': SPACE under the book deals no night', st);
  await page.keyboard.press('Escape'); await vstep(page, 20);
  const cl = await page.evaluate(() => ({ hid: document.getElementById('e2Book').classList.contains('hidden'), st: state, nw: document.getElementById('e2BookBtn').classList.contains('e2New') }));
  ok(cl.hid && cl.st === 'menu', tag + ': ESC closes the book back to the hall');
  ok(!cl.nw, tag + ': the NEW! wax is broken after a visit');
  return bk;
}
(async () => {
  const errs = [];
  // 1 — FRESH save, desktop
  { const { browser, page, errors } = await boot({});
    const bk = await bookChecks(page, 'fresh_d', false);
    ok(bk.fresh === 0 && !bk.doorNew, 'fresh: nothing is NEW on a fresh save');
    // key B opens it
    await page.keyboard.press('b'); await vstep(page, 10);
    ok(await page.evaluate(() => !document.getElementById('e2Book').classList.contains('hidden')), 'fresh: B opens the book from the hall');
    await page.keyboard.press('Escape'); await vstep(page, 10);
    // play a night with the bot and check the ledger line
    await page.evaluate(() => { window.__bot.renderEvery = 30; document.getElementById('startBtn').click(); });
    await until(page, "state==='dead'", 90000);
    await until(page, "!!document.getElementById('e2Debt')", 600, { batch: 6 }); await vstep(page, 84);
    const l0 = await page.evaluate(() => { const d = document.getElementById('e2Debt'); return d ? { t: d.textContent, paid: d.classList.contains('e2Dp'), w: d.querySelector('.e2Bar i') && d.querySelector('.e2Bar i').style.width } : null; });
    await vstep(page, 200); await page.waitForTimeout(200);
    const l1 = await page.evaluate(() => { const d = document.getElementById('e2Debt'); return d ? { t: d.textContent, w: d.querySelector('.e2Bar i') && d.querySelector('.e2Bar i').style.width, go: d.classList.contains('go') } : null; });
    ok(!!l1, 'ledger: the nearest debt is written under the rank bar', l1 && l1.t);
    ok(!!l0 && !!l1 && (l0.paid || parseFloat(l1.w) > parseFloat(l0.w) || (l1.go && parseFloat(l1.w) >= parseFloat(l0.w))), 'ledger: its bar moves as the night is tallied (or a debt is stamped PAID)', l0 && l1 && (l0.paid ? 'PAID: ' + l0.t : l0.w + ' → ' + l1.w));
    await page.evaluate(() => { const r = document.getElementById('e2Debt'); r && r.scrollIntoView({ block: 'center' }); });
    await shot(page, 'fresh_d_ledger');
    errs.push(...errors); await browser.close(); }
  // 2 — MID-PROGRESS save, desktop
  { const { browser, page, errors } = await boot({}, MID);
    const pre = await page.evaluate(() => ({ nw: document.getElementById('e2BookBtn').classList.contains('e2New'), wax: document.querySelector('#e2BookBtn .e2Wax').textContent, rank: RANK.rank }));
    ok(pre.nw, 'mid: the door wears a NEW! wax seal', pre.wax + ' · rank ' + pre.rank);
    const bk = await bookChecks(page, 'mid_d', false);
    ok(bk.fresh > 0, 'mid: freshly paid debts are stamped NEW! in the book', bk.fresh + ' stamped');
    ok(bk.pins.some(p => /MAGPIE/.test(p) && /4,212 \/ 5,000 COINS/.test(p)), 'mid: the Magpie reads 4,212 / 5,000 COINS');
    // pad: a fake standard gamepad (B3's probe recipe) walks the book
    await page.evaluate(() => {
      const mk = () => ({ pressed: false, touched: false, value: 0 });
      const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
        axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, mk), vibrationActuator: { type: 'dual-rumble', playEffect() { return Promise.resolve('complete'); } } };
      window.__pad = pad; navigator.getGamepads = () => [pad, null, null, null];
      const ev = new Event('gamepadconnected'); ev.gamepad = pad; window.dispatchEvent(ev);
    });
    const press = async (b) => { await page.evaluate(b => { const x = window.__pad.buttons[b]; x.pressed = true; x.value = 1; }, b); await vstep(page, 3);
      await page.evaluate(b => { const x = window.__pad.buttons[b]; x.pressed = false; x.value = 0; }, b); await vstep(page, 3); };
    const focus = () => page.evaluate(() => { const f = document.querySelector('.b3Focus'); return f ? (f.id || f.className) : null; });
    await page.waitForTimeout(1200); await vstep(page, 30);
    let reached = false;
    for (const dir of [15, 13, 12]) { for (let i = 0; i < 12 && !reached; i++) { if ((await focus()) === 'e2BookBtn') { reached = true; break; } await press(dir); } if (reached) break; }
    ok(reached, 'pad: the D-pad reaches the BOOK OF DEBTS door', await focus());
    await press(0); await vstep(page, 30);
    const pf = await page.evaluate(() => ({ open: !document.getElementById('e2Book').classList.contains('hidden'), f: PAD.focus && (PAD.focus.className + '') }));
    ok(pf.open, 'pad: Ⓐ on the door opens the book');
    ok(/e2Pin/.test(pf.f || ''), 'pad: the ring lands on the first marked debt', pf.f);
    for (let i = 0; i < 6; i++) await press(13);
    const pf2 = await page.evaluate(() => { const f = PAD.focus; const b = document.getElementById('e2Body'); return { f: f && f.className + '', top: b.scrollTop, inBook: !!(f && f.closest('#e2Book')) }; });
    ok(pf2.inBook && pf2.top > 0, 'pad: ✚ down walks into the chapters and scrolls them', pf2.f + ' · scroll ' + pf2.top);
    await shot(page, 'mid_d_pad');
    await press(1); await vstep(page, 20);
    ok(await page.evaluate(() => document.getElementById('e2Book').classList.contains('hidden') && state === 'menu'), 'pad: Ⓑ closes the book');
    errs.push(...errors); await browser.close(); }
  // 2b — the chapters other branches bring (C1 PAIRINGS, D4 MAJOR ARCANA): their real rows, injected as globals
  { const { browser, page, errors } = await boot({}, MID);
    await page.evaluate(() => {
      window.PAIRINGS = [['ossuary','bolt','proj','THE OSSUARY','💀','The bones want more mouths to fire from…'],['stacked','cards','snake','THE STACKED DECK','🃏','A dealer who never loses would need loaded eyes…'],
        ['cuts','knives','fire','THE THOUSAND CUTS','✶','The knives ask for quicker hands…'],['eye','lantern','mag','THE EYE IN THE SKY','👁','The lantern wants to see your pockets…'],
        ['russian','cylinder','exec','RUSSIAN ROULETTE','⚅','Six chambers, and an executioner\'s patience…']].map(a => ({ id: a[0], w: a[1], p: a[2], n: a[3], g: a[4], hint: a[5] }));
      window.MAJOR_ARCANA = [['wheel','X','WHEEL OF FORTUNE','☸','#ffb300'],['death','XIII','DEATH','☠','#d24dff'],['tower','XVI','THE TOWER','⚡','#ff3b2f'],['star','XVII','THE STAR','✷','#5ee6ff']]
        .map(a => ({ id: a[0], num: a[1], n: a[2], g: a[3], c: a[4], dd: 'rule-bending card text' }));
      window.ARC_ODDS = { base: 0.05, perMin: 0.01, cap: 0.12 };
      IDX.pr = ['ossuary']; IDX.pm = ['cards']; IDX.t.push('MAJOR:tower');
    });
    await page.click('#e2BookBtn'); await vstep(page, 20);
    const r = await page.evaluate(() => { const g = id => { const c = document.getElementById('e2ch_' + id); return c ? { n: c.querySelector('.e2ChN').textContent, t: [...c.querySelectorAll('.e2E')].map(e => e.querySelector('.e2N').textContent + ' / ' + e.querySelector('.e2C').textContent) } : null; };
      return { pr: g('pairings'), ar: g('arcana'), undef: /undefined|NaN/.test(document.getElementById('e2Book').textContent) }; });
    ok(r.pr && /1 \/ (5|\d+) PAID/.test(r.pr.n) && r.pr.t.some(t => /OSSUARY/.test(t)) && !r.undef, /* real C1 table once merged (10 recipes); the mock above only applies pre-merge */ 'integ: PAIRINGS chapter reads C1 rows (known recipe + whispered hint)', r.pr && r.pr.n);
    ok(r.ar && /1 \/ (4|\d+) PAID/.test(r.ar.n) && !r.undef, /* real D4 table once merged (12 cards) */ 'integ: MAJOR ARCANA chapter reads D4 rows + odds', r.ar && r.ar.n);
    ok(!r.undef, 'integ: no undefined/NaN');
    await page.evaluate(() => { const n = document.querySelector('.e2NavB[data-ch="pairings"]'); n && n.click(); }); await page.waitForTimeout(700);
    await shot(page, 'integ_pairings_arcana');
    errs.push(...errors); await browser.close(); }
  // 3 — phones
  for (const [tag, save] of [['fresh_m', null], ['mid_m', MID]]) {
    const { browser, page, errors } = await boot({ mobile: true, viewport: { width: 390, height: 844 } }, save);
    await page.evaluate(() => { const b = document.getElementById('e2BookBtn'); b && b.scrollIntoView({ block: 'center' }); });
    await bookChecks(page, tag, true);
    // touch scroll the chapters
    await page.evaluate(() => { const b = document.getElementById('e2BookBtn'); b.click(); });
    await vstep(page, 20);
    await page.evaluate(() => { const b = document.getElementById('e2Body'); b.scrollTop = b.scrollHeight * 0.45; });
    const sc = await page.evaluate(() => document.getElementById('e2Body').scrollTop);
    ok(sc > 100, tag + ': the chapters scroll on the phone', 'scrollTop ' + sc);
    await shot(page, tag + '_book_scrolled');
    await page.tap('#e2Close'); await vstep(page, 10);
    ok(await page.evaluate(() => document.getElementById('e2Book').classList.contains('hidden')), tag + ': tapping Back closes it');
    errs.push(...errors); await browser.close(); }
  for (const c of checks) console.log(c);
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT), checks: checks.length, failed, errors: errs.slice(0, 8) }, null, 1));
  process.exit(failed || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
