#!/usr/bin/env node
// node probes/lesson.js [--src] [--desk-only|--phone-only]
// J3 proof: THE LESSON runs to completion with the autoplay bot on desktop
// (1280x720) and phone (390x844, touch): entered from the NEW HERE? chip, all six
// steps complete in < 150 game-seconds, no stall, am_lesson_v1 saved {done:1},
// LT.runs untouched (no gentle night consumed), no rank marks, zero errors.
// Screenshots of every step → shots/lesson/.
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const argv = process.argv.slice(2);
const which = argv.includes('--src') ? 'src' : 'dist';
const OUT = path.join(ROOT, 'shots', 'lesson');
fs.mkdirSync(OUT, { recursive: true });

// the lesson-aware driver: walk to whatever the lesson points at; ride the Ascent to ~2.9x and cash.
// Works on today's push-to-climb gate (SPACE pushes, ENTER cashes) and on J2's auto-climb (it detects
// the multiplier rising on its own and stops pushing; ENTER cashes in both).
const DRIVER = `(()=>{
  const B=window.__bot, _st=B.step; B.startedAt=1; // the bot never starts a night by itself here
  const key=(k,code)=>{ window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code,bubbles:true})); window.dispatchEvent(new KeyboardEvent('keyup',{key:k,code,bubbles:true})); };
  let last=null, pressed=false, auto=false, liveN=0;
  B.step=function(){
    const L=window.LESSON;
    if(L && L.on && state==='playing' && !B.pauseHold){
      const t=L.target && L.target();
      if(t){ B.n++; for(const k of ['w','a','s','d']) keys.delete(k);
        const dx=t.x-P.x, dy=t.y-P.y, d=Math.hypot(dx,dy)||1;
        if(dx/d>0.3) keys.add('d'); if(dx/d<-0.3) keys.add('a'); if(dy/d>0.3) keys.add('s'); if(dy/d<-0.3) keys.add('w');
        return; }
    }
    if(L && L.on && state==='crash' && typeof crash!=='undefined' && crash && !crash.jk){ B.n++;
      if(!crash.live){ liveN=0; last=null; if(!crash.done && B.n%12===0) key(' ','Space'); return; }
      liveN++;
      if(last!==null && crash.mult>last && !pressed) auto=true;
      last=crash.mult; pressed=false;
      if(crash.mult>=2.9 || liveN>900){ key('Enter','Enter'); pressed=true; return; }
      if(!auto && B.n%6===0){ key(' ','Space'); pressed=true; }
      return; }
    return _st.apply(this, arguments);
  };
})();`;

async function snap(page, name, tag) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await run(page, 6);
  await page.waitForTimeout(500); // CSS transitions run on real time
  await page.screenshot({ path: path.join(OUT, tag + '_' + name + '.jpg'), type: 'jpeg', quality: 80 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('  ✓ ' + tag + '_' + name);
}
// a layout check: the banner must not sit on the top HUD, the coach toast or the notice column
async function overlap(page) {
  return page.evaluate(() => {
    const b = document.getElementById('lessonBar'); if (!b || !b.classList.contains('show') || b.classList.contains('fold') || getComputedStyle(b).opacity === '0') return null;
    const r = b.getBoundingClientRect(), hit = (o) => o && o.width > 0 && o.height > 0 && r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top;
    const vis = (el) => { if (!el || el.closest('.hidden')) return null; if (getComputedStyle(el).opacity === '0') return null; return el.getBoundingClientRect(); };
    const out = [];
    const hudTop = vis(document.querySelector('.hudTop')), xp = vis(document.getElementById('xpbar'));
    if (hit(hudTop)) out.push('hudTop'); if (hit(xp)) out.push('xpbar');
    const co = document.getElementById('coachToast'); if (co && co.classList.contains('go') && hit(vis(co))) out.push('coachToast');
    const an = document.getElementById('announce'); if (an && !an.classList.contains('hidden') && hit(vis(an))) out.push('announce');
    for (const id of ['machine', 'payTable', 'tcBet', 'tcCodex', 'hpwrap']) { const e = document.getElementById(id); if (hit(vis(e))) out.push(id); }
    for (const sel of ['#wheelLayer .wheelShell', '#crashLayer .wheelShell']) if (hit(vis(document.querySelector(sel)))) out.push(sel);
    return out.length ? { state, step: window.LESSON.step, bar: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], hits: out } : null;
  });
}

async function lesson(tag, opts) {
  const { browser, page, errors } = await launch(Object.assign({ which }, opts));
  await page.evaluate(DRIVER);
  const res = { tag, fails: [], overlaps: [], shots: 0 };
  const watch = async () => { const o = await overlap(page); if (o) res.overlaps.push(o); };
  const step = async (cond, max, label) => {
    // advance in slices so the overlap checker samples the whole lesson
    for (let done = 0; done < max; done += 300) {
      if (await until(page, cond, 300)) { await watch(); return true; }
      await watch();
    }
    const st = await page.evaluate(() => ({ state, step: window.LESSON && window.LESSON.step, gt: typeof gt === 'number' ? +gt.toFixed(1) : null, stall: window.__bot.stall || null, ovT: P && P.ovT, xp: P && P.xp, xpNext: P && P.xpNext, kills: P && P.kills, wheelTok: !!wheelTok, crashTok: !!crashTok }));
    res.fails.push({ label, st }); return false;
  };
  try {
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    await page.waitForTimeout(600);
    res.menu = await page.evaluate(() => ({ chip: !!document.getElementById('lessonChip'), chipTxt: (document.getElementById('lessonChip') || {}).textContent, btn: (document.getElementById('lessonBtn') || {}).textContent, runs: LT.runs }));
    await page.screenshot({ path: path.join(OUT, tag + '_0menu.jpg'), type: 'jpeg', quality: 80 }); console.error('  ✓ ' + tag + '_0menu');
    if (opts.mobile) await page.tap('#lessonChip'); else await page.click('#lessonChip');
    await run(page, 2);
    const ok = res.menu.chip && (await page.evaluate(() => !!(window.LESSON && window.LESSON.on)));
    if (!ok) { res.fails.push({ label: 'chip did not start the lesson' }); throw new Error('no lesson'); }
    if (!(await step('window.LESSON.step===1', 2000, 'step 1'))) throw 0;
    await run(page, 8); await snap(page, '1walk', tag);
    if (!(await step('window.LESSON.step===2', 6000, 'step 2 (ring)'))) throw 0;
    await run(page, 200); await snap(page, '2hunt', tag);
    // ESC pauses with the quit pill relabelled
    await page.evaluate(() => { window.__bot.pauseHold = true; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    for (let i = 0; i < 40; i++) await page.evaluate(() => { window.__vc.step(16.7); });
    res.pausePill = await page.evaluate(() => ({ state, pill: (document.getElementById('quitBtn') || {}).textContent }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, tag + '_2pause.jpg'), type: 'jpeg', quality: 80 }); console.error('  ✓ ' + tag + '_2pause');
    await page.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); window.__bot.pauseHold = false; });
    if (!(await step('window.LESSON.step===3', 9000, 'step 3 (8 kills)'))) throw 0;
    if (!(await step('window.LESSON.step===3 && P.ovT>0 && (P.ovCharge||0)>1.5', 9000, 'step 3 feed'))) throw 0;
    await snap(page, '3feed', tag);
    if (!(await step("state==='slot'", 9000, 'cash → slot'))) throw 0;
    await page.evaluate(() => { window.__bot.noSlotTap = true; });
    await until(page, 'window.LESSON.step>=4', 200); await run(page, 30); await snap(page, '4reels', tag);
    await page.evaluate(() => { window.__bot.noSlotTap = false; });
    if (!(await step("window.LESSON.step>=5 && state==='playing'", 12000, 'step 5'))) throw 0;
    await run(page, 30); await snap(page, '5case', tag);
    if (!(await step("state==='wheel'", 6000, 'wheel opens'))) throw 0;
    await run(page, 50); await snap(page, '5wheel', tag);
    if (!(await step("window.LESSON.step>=6", 9000, 'step 6'))) throw 0;
    if (!(await step("state==='crash' && crash.live && crash.mult>1.5", 9000, 'ascent rides'))) throw 0;
    await snap(page, '6ascent', tag);
    if (!(await step('window.LESSON.step===7', 9000, 'finish'))) throw 0;
    await run(page, 40); await snap(page, '7finish', tag);
    if (!(await step("state==='menu'", 2000, 'back to menu'))) throw 0;
    await page.evaluate(() => { for (let k = 0; k < 200; k++) window.__vc.step(16.7); }); // saves land (achSaveSoon 1.5s)
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, tag + '_8menu.jpg'), type: 'jpeg', quality: 80 }); console.error('  ✓ ' + tag + '_8menu');
  } catch (e) { if (e && e.message && e.message !== 'no lesson') res.fails.push({ label: 'exception', e: String(e.stack || e) }); }
  Object.assign(res, await page.evaluate(() => {
    const ls = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    let ach = null; try { ach = JSON.parse(ls('antemortem_ach_v2') || 'null'); } catch (e) {}
    let rank = null; try { rank = JSON.parse(ls('am_rank_v1') || 'null'); } catch (e) {}
    return { result: window.LESSON.res, key: ls('am_lesson_v1'), ltRuns: LT.runs, savedRuns: ach && ach.LT ? ach.LT.runs : null, marks: rank ? rank.marks : 0,
      amErr: !!window._amErr, stall: window.__bot.stall || null, state, chipAfter: !!document.getElementById('lessonChip'), btnAfter: (document.getElementById('lessonBtn') || {}).textContent };
  }));
  res.errors = errors.slice(0, 8);
  await browser.close();
  let key = null; try { key = JSON.parse(res.key || 'null'); } catch (e) {}
  res.pass = !res.fails.length && !!res.result && res.result.gt < 150 && key && key.done === 1 && (res.ltRuns | 0) === 0 && !(res.savedRuns > 0) && !(res.marks > 0)
    && !res.amErr && !res.stall && !errors.length && res.pausePill && res.pausePill.pill === 'LEAVE THE LESSON' && !res.overlaps.length && !res.chipAfter;
  return res;
}

(async () => {
  const runs = [];
  if (!argv.includes('--phone-only')) runs.push(await lesson('desk', { viewport: { width: 1280, height: 720 } }));
  if (!argv.includes('--desk-only')) runs.push(await lesson('phone', { mobile: true, viewport: { width: 390, height: 844 } }));
  const pass = runs.every(r => r.pass);
  console.log(JSON.stringify({ pass, out: path.relative(ROOT, OUT), runs }, null, 1));
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
