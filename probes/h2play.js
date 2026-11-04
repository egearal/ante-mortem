#!/usr/bin/env node
// H2 — FRESH EYES: play nights 1-3 on a fresh save as a stranger would see them.
// Logs every announce / coach tip / bigWin with its game time, counts how many
// overlays are on screen at once, and screenshots the beats a newcomer hits.
// node probes/h2play.js <label> [--phone] [--nights N]
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run, until, ROOT } = require('./lib');
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'h2-now';
const phone = process.argv.includes('--phone');
const ni = process.argv.indexOf('--nights'); const NIGHTS = ni > 0 ? +process.argv[ni + 1] : 2;
const OUT = path.join(ROOT, 'shots', 'h2', label + (phone ? '-phone' : ''));
fs.mkdirSync(OUT, { recursive: true });
const HOOK = `(()=>{
  const L=window.__h2log=[];
  const t=()=>(typeof gt==='number'?gt.toFixed(1):'-')+' '+(typeof state!=='undefined'?state:'');
  const wrap=(name)=>{ const f=window[name]; if(typeof f!=='function') return; window[name]=function(){ try{ L.push(t()+' '+name+': '+[...arguments].map(a=>typeof a==='string'?a.replace(/<[^>]+>/g,''):JSON.stringify(a)).join(' | ').slice(0,160)); }catch(e){} return f.apply(this,arguments); }; };
  ['coachMark','bigWin'].forEach(wrap);
  // log what is actually SHOWN in the banner (wrappers may hold or drop a call)
  const an=document.getElementById('announce');
  if(an) new MutationObserver(()=>{ if(!an.classList.contains('hidden')) L.push(t()+' SHOWN: '+an.textContent.slice(0,120)); }).observe(an,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  const at=document.getElementById('achToasts');
  if(at) new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes) L.push(t()+' TOAST: '+(n.textContent||'').slice(0,80)); }).observe(at,{childList:true});
  window.__h2vis=()=>{ const ids=['announce','coachToast','streak','bossBar']; const out=[];
    for(const id of ids){ const e=document.getElementById(id); if(!e) continue; const cs=getComputedStyle(e); if(e.classList.contains('hidden')||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.05) continue; if(id==='coachToast'&&!e.classList.contains('go')) continue; out.push(id+':'+e.textContent.slice(0,40)); }
    return out; };
})();`;
async function shot(page, name) {
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  await run(page, 3);
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 80 });
  await page.evaluate(() => { window.__bot.renderEvery = 30; });
  console.error('  ✓ ' + name);
}
(async () => {
  const vp = phone ? { width: 390, height: 844 } : { width: 1280, height: 720 };
  const { browser, page, errors } = await launch({ viewport: vp, mobile: phone });
  await page.evaluate(HOOK);
  await page.evaluate(() => { window.__bot.renderEvery = 1; });
  for (let i = 0; i < 90; i++) await page.evaluate(() => { window.__vc.step(16.7); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'n1_00_menu.jpg'), type: 'jpeg', quality: 80 });
  const menuText = await page.evaluate(() => document.getElementById('menu').innerText);
  const vis = [];
  for (let n = 1; n <= NIGHTS; n++) {
    await until(page, "state==='playing'", 4000);
    const marks = [1, 3, 6, 10, 15, 25, 40, 60];
    let k = 0, slotShot = false;
    for (let f = 0; f < 60 * 70; f += 15) {
      await run(page, 15);
      const s = await page.evaluate(() => ({ st: state, gt, v: window.__h2vis(), dead: state === 'dead' }));
      if (s.v.length) vis.push(`n${n} ${s.gt.toFixed(1)} ${s.st} [${s.v.length}] ${s.v.join(' ‖ ')}`);
      if (s.dead) break;
      if (!slotShot && s.st === 'slot') { slotShot = true; await run(page, 20); await shot(page, `n${n}_slot`); }
      if (k < marks.length && s.gt >= marks[k] && s.st === 'playing') { await shot(page, `n${n}_${String(marks[k]).padStart(2, '0')}s`); k++; }
    }
    if (n === 1) await page.evaluate(() => { window.__bot.god = false; });
    await until(page, "state==='dead'", 60 * 60 * 14);
    await page.evaluate(() => { for (let k = 0; k < 60; k++) window.__vc.step(16.7); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `n${n}_dr_early.jpg`), type: 'jpeg', quality: 80 });
    await page.evaluate(() => { for (let k = 0; k < 300; k++) window.__vc.step(16.7); });
    await page.waitForTimeout(700);
    await page.evaluate(() => { window.__bot.renderEvery = 1; });
    await page.screenshot({ path: path.join(OUT, `n${n}_ledger.jpg`), type: 'jpeg', quality: 80 });
    const led = await page.evaluate(() => { const g = document.getElementById('gameover'); return { txt: g.innerText.slice(0, 3000), h: g.querySelector('.panel') && g.querySelector('.panel').scrollHeight }; });
    fs.writeFileSync(path.join(OUT, `n${n}_ledger.txt`), led.h + '\n' + led.txt);
    console.error(`  night ${n} ended at ${await page.evaluate(() => fmt(gt))}`);
    if (n < NIGHTS) {
      // back to menu like a stranger would (click THE MENU if there, else restart)
      await page.evaluate(() => { window.__bot.res = null; window.__bot.startedAt = null; const b=document.getElementById('goMenuBtn'); if(b) b.click(); });
      await page.evaluate(() => { for (let k = 0; k < 90; k++) window.__vc.step(16.7); });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `n${n + 1}_00_menu.jpg`), type: 'jpeg', quality: 80 });
      fs.writeFileSync(path.join(OUT, `n${n + 1}_menu.txt`), await page.evaluate(() => document.getElementById('menu').innerText + '\nstate=' + state));
      await page.evaluate(() => { if (state !== 'menu') { try { startGame(); } catch (e) { console.error(e); } } });
    }
  }
  const log = await page.evaluate(() => window.__h2log);
  fs.writeFileSync(path.join(OUT, 'log.txt'), 'MENU:\n' + menuText + '\n\nEVENTS:\n' + log.join('\n') + '\n\nOVERLAYS:\n' + vis.join('\n') + '\n\nERRORS:\n' + errors.join('\n'));
  console.log(JSON.stringify({ out: OUT, errors: errors.slice(0, 5), events: log.length }));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
