#!/usr/bin/env node
// node probes/h3-codex.js [--src]
// H3 proof that the twenty recipes surface everywhere that reads PAIRINGS:
// the Index section (unknown / hinted / sealed tiles), the Book of Debts
// chapter, the TAB codex rows and the relic tooltip label. Exit 1 on any miss.
'use strict';
const { launch, until } = require('./lib');
const which = process.argv.includes('--src') ? 'src' : 'dist';
const NEW = ['chaingang','carpet','craps','shark','queen','ouro','champagne','heart','grand','blackdeath'];
(async () => {
  const { browser, page, errors } = await launch({ which });
  const fails = [];
  const r = await page.evaluate((NEW) => {
    const out = {};
    out.total = PAIRINGS.length;
    out.byW = NEW.map(id => { const pr = PAIRINGS.find(p => p.id === id); return pr && PAIR_BY_W[pr.w] === pr && !!GLYPH_COL[id] && typeof PROJ_FX[id] === 'function' && /\d/.test(pr.d(1)) && !!pr.hint; });
    // index: hint two, seal two, leave the rest unknown
    const pr0 = IDX.pr.slice(), pm0 = IDX.pm.slice();
    IDX.pm.push('mortar', 'dice'); IDX.pr.push('chaingang', 'heart');
    openIndexPanel();
    const sec = document.querySelector('.c1idx');
    out.idxTiles = sec ? sec.querySelectorAll('.c1tile').length : 0;
    out.idxHead = sec ? sec.querySelector('.idxSecH span').textContent : '';
    const txt = sec ? sec.textContent : '';
    out.idxSealed = txt.includes('THE CHAIN GANG') && txt.includes('THE TELL-TALE HEART');
    out.idxHint = txt.includes(PAIRINGS.find(p => p.id === 'carpet').hint) && txt.includes(PAIRINGS.find(p => p.id === 'craps').hint);
    out.idxNoLeak = !txt.includes('THE LOAN SHARK');
    // book
    const ch = e2Chapters().find(c => c.id === 'pairings');
    out.bookN = ch ? ch.entries.length : 0;
    out.bookSealed = ch ? ch.entries.filter(e => e.done).length : 0;
    IDX.pr.length = 0; pr0.forEach(x => IDX.pr.push(x)); IDX.pm.length = 0; pm0.forEach(x => IDX.pm.push(x));
    return out;
  }, NEW);
  // the codex (TAB) mid-run: own two new weapons, one paired
  await until(page, `typeof gt==='number' && state==='playing' && gt>=3`, 60000);
  const t = await page.evaluate(() => {
    P.wlv.serpent = 5; P.wlv.chalice = 2; P.evo = P.evo || {}; P.evo.serpent = 'ouro'; renderRelics();
    showTab(); const el = document.querySelector('.tpPairs'); const s = el ? el.textContent : '';
    return { ouro: s.includes('THE OUROBOROS') && s.includes('EVOLVED'), champ: s.includes('THE CHAMPAGNE TOWER'), relic: !!document.querySelector('#relicsW .c1evo') };
  });
  Object.assign(r, { tab: t });
  if (r.total !== 20) fails.push('total ' + r.total);
  if (r.byW.some(x => !x)) fails.push('table rows ' + JSON.stringify(r.byW));
  if (r.idxTiles !== 20) fails.push('index tiles ' + r.idxTiles);
  if (!r.idxSealed || !r.idxHint || !r.idxNoLeak) fails.push('index text');
  if (r.bookN !== 20 || r.bookSealed < 2) fails.push('book ' + r.bookN + '/' + r.bookSealed);
  if (!t.ouro || !t.champ || !t.relic) fails.push('tab ' + JSON.stringify(t));
  console.log(JSON.stringify({ ...r, errors: errors.slice(0, 4), fails }, null, 1));
  await browser.close();
  process.exit(fails.length || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
