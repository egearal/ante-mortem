#!/usr/bin/env node
// node probes/arcana.js [--src] [--shots] [--only id,id]
// D4 — forces every Major Arcanum through the REAL path (deal → walk onto the card →
// ceremony → effect → expiry) on a fresh night each, checks the effect actually did
// what its card says, measures the real per-frame cost (update+render, every frame
// drawn) with the effect live vs. just before it, and fails on any runtime error.
// --shots also writes shots/d4/*.jpg (the reveal + effects in play).
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const which = process.argv.includes('--src') ? 'src' : 'dist';
const SHOTS = process.argv.includes('--shots');
const oi = process.argv.indexOf('--only');
const ONLY = oi > 0 ? process.argv[oi + 1].split(',') : null;
const OUT = path.join(ROOT, 'shots', 'd4');
if (SHOTS) fs.mkdirSync(OUT, { recursive: true });

// real per-frame cost (Performance.prototype.now is the real clock; the VCLOCK only shadows the instance).
// Whole frames in headless software-GL carry a periodic ~600ms flush every ~11th render (present
// before any arcanum, harness artifact), so the frame is reported by MEDIAN, and the budget is
// enforced on the arcana's own code: tickMajors + drawMajorsFX + drawMajorCard, p95 per frame.
async function frameCost(page, frames) {
  return page.evaluate(async (n) => {
    const real = () => Performance.prototype.now.call(performance);
    let acc = 0; const wrap = (k) => { const f = window[k]; window[k] = function () { const t = real(); try { return f.apply(this, arguments); } finally { acc += real() - t; } }; return f; };
    const o = ['tickMajors', 'drawMajorsFX', 'drawMajorCard'].map(k => [k, wrap(k)]);
    window.__bot.renderEvery = 1; const ts = [], arc = [];
    for (let i = 0; i < n; i++) {
      acc = 0; const t0 = real(); window.__vc.step(16.7); try { window.__bot.step(); } catch (e) {} ts.push(real() - t0); arc.push(acc);
      if (i % 10 === 9) await null;
    }
    for (const [k, f] of o) window[k] = f;
    window.__bot.renderEvery = 30;
    ts.sort((a, b) => a - b); arc.sort((a, b) => a - b);
    return { med: ts[n >> 1], arc95: arc[Math.floor(n * 0.95)], arcMax: arc[n - 1], enemies: enemies.length };
  }, frames);
}
async function snap(page, name, wait) {
  if (!SHOTS) return;
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await run(page, 3);
  await page.waitForTimeout(wait || 300);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 84 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('    📷 ' + name);
}
const secs = (s) => Math.ceil(s / 1.71 / 0.0167); // HUD/game seconds → frames (gt runs 1.71× wall)

// what each card must have done — evaluated in-page, returns [ok, detail]
// stat cards are read the frame after the pickup, before any level-up can move the stats
const NOW = new Set(['wheel', 'death', 'devil', 'hanged', 'chariot0', 'sun0', 'tower0']);
const CHECK = {
  wheel: `(()=>{ const pool=[{id:'a',rar:'common'},{id:'b',rar:'rare'}]; let c=0; for(let i=0;i<300;i++) if(weightedByRarity(pool).rar==='common') c++;
           return [arcActive('wheel') && c===0, 'commons dealt while lifted: '+c+'/300']; })()`,
  death: `(()=>{ const ok1=P.markerUsed===true && ARC.deathSkip===true; window.__bot.god=false; P.inv=0; P.hp=1; hurtPlayer(99999);
           const ok2=state==='playing' && P.hp>=Math.round(P.maxHp*0.6)-1 && ARC.deathSkip===false && ARC.st.skip===1; window.__bot.god=true;
           return [ok1&&ok2, 'roll gone='+ok1+' · skipped death, state='+state+' hp='+Math.round(P.hp)+'/'+P.maxHp]; })()`,
  tower0: `[P.coins===0, 'coins '+window.__pre.coins+'→'+P.coins]`,
  tower: `[ARC.st.tower===1 && window.__pre.onScreen>0 && window.__post.killedOnScreen>0, 'on-screen '+window.__pre.onScreen+' · killed '+window.__post.killedOnScreen+' · blow '+ARC.st.tower+' t='+ARC.towerT.toFixed(2)+' '+state+' '+window.__post.dbg]`,
  star: `[ARC.st.zap>0, 'lightning chains '+ARC.st.zap]`,
  sun0: `[Math.abs((P.dmgTakenMult||1)-window.__pre.dtm*1.25)<1e-6, 'dmgTaken ×'+(P.dmgTakenMult||1).toFixed(2)]`,
  sun: `[P.dmgDealt>window.__pre.dealt, 'burned+shot '+Math.round(P.dmgDealt-window.__pre.dealt)]`,
  devil: `[Math.abs(P.damage/window.__pre.dmg-1.5)<0.01 && P.maxHp===Math.max(1,Math.round(window.__pre.maxHp*0.5)), 'dmg '+window.__pre.dmg.toFixed(1)+'→'+P.damage.toFixed(1)+' · max blood '+window.__pre.maxHp+'→'+P.maxHp]`,
  hanged: `[Math.abs((P.dmgTakenMult||1)-window.__pre.dtm*0.6)<1e-6 && Math.abs(P.speed/window.__pre.spd-0.8)<0.01, 'dmgTaken ×'+(P.dmgTakenMult||1).toFixed(2)+' · speed '+Math.round(window.__pre.spd)+'→'+Math.round(P.speed)]`,
  justice: `[ARC.st.justice>0, 'hits repaid '+ARC.st.justice]`,
  chariot0: `[Math.abs(P.speed/window.__pre.spd-1.3)<0.01, 'speed ×'+(P.speed/window.__pre.spd).toFixed(2)]`,
  chariot: `[ARC.st.wheel>0, 'wheel strikes '+ARC.st.wheel]`,
  moon: `[ARC.st.beam>0, 'moonbeams '+ARC.st.beam]`,
  judgement: `[arcActive('judgement') && orbs.every(o=>o._jx), 'orbs marked ×2: '+orbs.length]`,
  lovers: `[ARC.st.twin>0, 'twin bolts '+ARC.st.twin]`,
};
// after expiry, the reverts must have landed exactly
const AFTER = {
  sun: `[Math.abs((P.dmgTakenMult||1)-window.__pre.dtm)<1e-6, 'dmgTaken back to ×'+(P.dmgTakenMult||1).toFixed(2)]`,
  chariot: `[!arcActive('chariot') && Math.abs(P.speed-window.__late.spd/1.3)<0.5, 'speed '+Math.round(window.__late.spd)+'→'+Math.round(P.speed)+' (÷1.3)']`,
  wheel: `[!arcActive('wheel'), 'wheel off']`,
  star: `[!arcActive('star'), 'star off']`, moon: `[!arcActive('moon'), 'moon off']`, lovers: `[!arcActive('lovers'), 'lovers off']`,
  justice: `[!arcActive('justice'), 'justice off']`, judgement: `[!arcActive('judgement'), 'judgement off']`,
};

(async () => {
  const ids = ONLY || ['wheel', 'death', 'tower', 'star', 'sun', 'devil', 'hanged', 'justice', 'chariot', 'moon', 'judgement', 'lovers'];
  const rows = []; let fail = 0; const allErr = [];
  for (const id of ids) {
    const { browser, page, errors } = await launch({ which });
    await page.evaluate(() => { window.__bot.god = true; });
    await until(page, "state==='playing' && gt>75 && enemies.length>12", 30000);
    const base = await frameCost(page, 180);
    // deal it through the real path: the next manifesting tarot is this Major
    await page.evaluate((id) => { window._arcForce = id; tarotT = 0; tarots.length = 0; }, id);
    const dealt = await until(page, "tarots.some(t=>t.maj)", 2000);
    const card = await page.evaluate(() => { const c = tarots.find(t => t.maj); return c ? { maj: c.maj, d: Math.round(Math.hypot(c.x - P.x, c.y - P.y)) } : null; });
    if (id === 'judgement') await until(page, 'orbs.length>3', 3000);
    await page.evaluate(() => {
      const onScreen = enemies.filter(e => inView(e.x, e.y, 40)).length;
      window.__pre = { coins: P.coins = Math.max(P.coins, 37), dmg: P.damage, maxHp: P.maxHp, spd: P.speed, dtm: P.dmgTakenMult || 1, dealt: P.dmgDealt || 0, onScreen, ids: new Set(enemies.filter(e => inView(e.x, e.y, 40))) };
      const c = tarots.find(t => t.maj); if (c) { c.x = P.x; c.y = P.y; } // walk onto it
    });
    await run(page, 2);
    const revealed = await page.evaluate((id) => ({ drawn: ARC.drawn.includes(id), shown: !!document.getElementById('arcanaReveal') && !document.getElementById('arcanaReveal').classList.contains('hidden'), idx: IDX.t.includes('MAJOR:' + id), hud: debuffs.some(b => b._arc === id) }), id);
    const checks = [];
    for (const k of [id, id + '0']) if (NOW.has(k)) checks.push(await page.evaluate(CHECK[k]));
    if (SHOTS && (id === 'tower' || id === 'death' || id === 'devil')) await snap(page, 'reveal_' + id, 1500);
    if (id === 'justice') await page.evaluate(() => { P.inv = 0; hurtPlayer(10); });
    await run(page, secs(id === 'moon' ? 8 : 5));
    if (id === 'tower') { await until(page, 'ARC.st.tower>0', 6000); await run(page, 10); }
    if (id === 'tower') await page.evaluate(() => { const al=[...window.__pre.ids].filter(e => enemies.includes(e)); window.__post = { killedOnScreen: window.__pre.ids.size-al.length, dbg: al.slice(0,3).map(e=>Math.round(e.hp)+'/'+Math.round(e.maxhp)+(e.boss?'B':'')).join(',') }; });
    if (id === 'star' || id === 'lovers' || id === 'chariot') await until(page, `ARC.st.${{ star: 'zap', lovers: 'twin', chariot: 'wheel' }[id]}>0`, 3000);
    const during = await frameCost(page, 180);
    if (SHOTS && ['moon', 'chariot', 'star', 'sun', 'lovers'].includes(id)) {
      if (id === 'moon') await until(page, 'ARC.beams.some(b=>!b.hit && b.t<0.2)', 600, { batch: 1 });
      if (id === 'star') await until(page, 'ARC.bolts.length>0', 600, { batch: 1 });
      await snap(page, 'fx_' + id, 120);
    }
    if (!NOW.has(id)) checks.push(await page.evaluate(CHECK[id]));
    const ok = checks.every(c => c[0]), detail = checks.map(c => c[1]).join(' · ');
    let okAfter = true, dAfter = '';
    if (AFTER[id]) {
      await until(page, `(()=>{ const b=debuffs.find(b=>b._arc==='${id}'); return !b || b.t<2; })()`, 20000); // the last stats before the revert
      await page.evaluate(() => { window.__late = { spd: P.speed }; });
      await until(page, `!debuffs.some(b=>b._arc==='${id}')`, 3000);
      await run(page, 2);
      [okAfter, dAfter] = await page.evaluate(AFTER[id]);
    }
    const state = await page.evaluate(() => state);
    const budget = during.arc95 <= 1.5; // ms of arcana code per frame, p95
    const pass = dealt && card && card.maj === id && revealed.drawn && revealed.shown && revealed.idx && (revealed.hud || !AFTER[id]) && ok && okAfter && budget && errors.length === 0;
    if (!pass) fail++;
    rows.push({ id, pass, detail, after: dAfter, base, during, revealed, state });
    console.error(`${pass ? '✓' : '✗'} ${id.padEnd(10)} ${detail}${dAfter ? ' · after: ' + dAfter : ''} · frame median ${base.med.toFixed(1)}→${during.med.toFixed(1)}ms · arcana code p95 ${during.arc95.toFixed(2)}ms max ${during.arcMax.toFixed(2)}ms (${during.enemies} foes)${errors.length ? ' · ERRORS ' + errors.length : ''}${revealed.shown ? '' : ' · NO REVEAL'}`);
    allErr.push(...errors.map(e => id + ': ' + e));
    await browser.close();
  }
  // the reveal on a phone
  if (SHOTS) {
    const { browser, page, errors } = await launch({ which, mobile: true, viewport: { width: 390, height: 844 } });
    await page.evaluate(() => { window.__bot.god = true; });
    await until(page, "state==='playing' && gt>40", 30000);
    await page.evaluate(() => { window._arcForce = 'star'; tarotT = 0; tarots.length = 0; });
    await until(page, "tarots.some(t=>t.maj)", 2000);
    await page.evaluate(() => { const c = tarots.find(t => t.maj); c.x = P.x + 90; c.y = P.y - 40; });
    await snap(page, 'ground_major_phone', 200);
    await page.evaluate(() => { const c = tarots.find(t => t.maj); if (c) { c.x = P.x; c.y = P.y; } });
    await run(page, 2);
    await snap(page, 'reveal_phone', 1500);
    allErr.push(...errors.map(e => 'phone: ' + e)); if (errors.length) fail++;
    await browser.close();
  }
  if (allErr.length) console.error(allErr.slice(0, 10).join('\n'));
  console.log(JSON.stringify({ cards: rows.length, failed: fail, rows: rows.map(r => ({ id: r.id, pass: r.pass, arcP95ms: +r.during.arc95.toFixed(2), frameMedMs: +r.during.med.toFixed(1) })) }));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
