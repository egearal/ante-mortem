#!/usr/bin/env node
// npm run pad [-- --src] [-- --shots b3]
// B3 proof: emulates a standard-mapping gamepad (navigator.getGamepads is
// overridden in-page) and walks the House with it alone:
//   menu → Ante Room → back → THE DIALS → back → start a night → stick walks →
//   START pauses → SETTINGS from the pause → back → resume → Ⓨ codex → death ledger.
// Also checks rumble calls, prompt relabeling and keyboard rebinding.
// Exit 1 on any failed check or runtime error.
'use strict';
const path = require('path');
const fs = require('fs');
const { launch, ROOT } = require('./lib');
const argv = process.argv.slice(2);
const which = argv.includes('--src') ? 'src' : 'dist';
const si = argv.indexOf('--shots'); const SHOTS = si >= 0 ? (argv[si + 1] || 'b3') : null;

const FAKE = `(()=>{
  const mk=()=>({pressed:false,touched:false,value:0});
  const pad={ id:'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index:0, connected:true, mapping:'standard', timestamp:0,
    axes:[0,0,0,0], buttons:Array.from({length:17},mk),
    vibrationActuator:{ type:'dual-rumble', playEffect(t,o){ (window.__rumbles=window.__rumbles||[]).push(o.strongMagnitude.toFixed(2)); return Promise.resolve('complete'); } } };
  window.__pad=pad;
  navigator.getGamepads=()=>[pad,null,null,null];
  const ev=new Event('gamepadconnected'); ev.gamepad=pad; window.dispatchEvent(ev);
})();`;

(async () => {
  const { browser, page, errors } = await launch({ which });
  const fails = []; const log = [];
  const ok = (c, msg) => { (c ? log : fails).push((c ? '✓ ' : '✗ ') + msg); };
  const step = (n = 1) => page.evaluate(n => { for (let i = 0; i < n; i++) window.__vc.step(16.7); }, n);
  // a press is held for 3 frames, then released for 3 — the pad loop reads edges
  const press = async (i, hold = 3) => { await page.evaluate(i => { const b = __pad.buttons[i]; b.pressed = true; b.value = 1; }, i); await step(hold);
    await page.evaluate(i => { const b = __pad.buttons[i]; b.pressed = false; b.value = 0; }, i); await step(3); };
  const A = 0, B = 1, X = 2, Y = 3, LB = 4, RB = 5, START = 9, UP = 12, DOWN = 13, LEFT = 14, RIGHT = 15;
  const focus = () => page.evaluate(() => { const f = document.querySelector('.b3Focus'); return f ? (f.id || f.className.split(' ')[0] + ':' + (f.dataset.k || f.dataset.id || f.textContent.trim().slice(0, 18))) : null; });
  const vis = id => page.evaluate(id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden') && e.getClientRects().length > 0; }, id);
  const st = () => page.evaluate(() => state);
  let shotN = 0;
  const shot = async name => { if (!SHOTS) return; const dir = path.join(ROOT, 'shots', SHOTS); fs.mkdirSync(dir, { recursive: true });
    await step(2); await page.screenshot({ path: path.join(dir, 'g' + (++shotN) + '_' + name + '.jpg'), type: 'jpeg', quality: 86 }); };
  const navTo = async (pred, dir, max = 12) => { for (let i = 0; i < max; i++) { const f = await focus(); if (f && pred(f)) return true; await press(dir); } const f = await focus(); return !!f && pred(f); };

  await step(30);
  await page.evaluate(FAKE);
  await page.waitForTimeout(1200); await step(30); // the menu cascades in on real CSS time; PLAY takes the ring when it arrives
  ok(await page.evaluate(() => PAD.mode === 'pad' && document.body.classList.contains('padUI')), 'pad connects → pad mode');
  ok((await focus()) === 'startBtn', 'menu focus starts on PLAY (got ' + (await focus()) + ')');
  ok(await page.evaluate(() => /Ⓐ/.test(document.querySelector('#menu .controls').textContent)), 'menu prompt relabeled to Ⓐ: ' + await page.evaluate(() => document.querySelector('#menu .controls').textContent.trim()));
  await shot('menu_focus');

  // → the Ante Room via the loadout line under PLAY
  ok(await navTo(f => f === 'loadoutLine', DOWN), 'D-pad reaches the loadout line');
  await press(A); await step(10);
  ok(await vis('antePanel'), 'Ⓐ opens the Ante Room');
  ok(/soulCard/.test(await focus() || ''), 'Ante Room focus on a soul card (' + await focus() + ')');
  await press(RIGHT); await press(DOWN);
  await shot('anteroom_focus');
  await press(B); await step(10);
  ok(!(await vis('antePanel')), 'Ⓑ closes the Ante Room');
  ok(await st() === 'menu', 'still at the menu');

  // → THE DIALS via OPTIONS
  ok(await navTo(f => f === 'gfxBtn', RIGHT, 2) || await navTo(f => f === 'gfxBtn', DOWN, 10) || await navTo(f => f === 'gfxBtn', UP, 10), 'D-pad reaches OPTIONS (' + await focus() + ')');
  await press(A); await step(10);
  ok(await vis('b3Dials'), 'Ⓐ on OPTIONS opens THE DIALS');
  ok(/b3Rng:vol/.test(await focus() || ''), 'dials focus on MASTER slider (' + await focus() + ')');
  const v0 = await page.evaluate(() => GFX.vol === undefined ? 1 : GFX.vol);
  await press(LEFT); await press(LEFT);
  const v1 = await page.evaluate(() => GFX.vol);
  ok(Math.abs((v0 - v1) - 0.1) < 0.001, 'D-pad ◀ turns the master dial down (' + v0 + ' → ' + v1 + ')');
  await press(RIGHT); await press(RIGHT);
  await press(DOWN); await press(DOWN);
  await shot('dials_focus');
  for (let i = 0; i < 30; i++) { const f = await focus(); if (f === 'b3Close') break; await press(DOWN); }
  ok((await focus()) === 'b3Close', 'D-pad walks to CLOSE at the bottom (scroll-into-view)');
  await press(DOWN);
  ok((await focus()) !== 'b3Close' && /b3Rng/.test(await focus() || ''), 'focus wraps around to the top (' + await focus() + ')');
  await press(B); await step(10);
  ok(!(await vis('b3Dials')), 'Ⓑ closes THE DIALS');
  ok((await focus()) === 'gfxBtn', 'menu focus remembered on OPTIONS');

  // → start a night with START
  await press(START); await step(60);
  ok(await st() === 'playing', 'START at the menu deals the night');
  const x0 = await page.evaluate(() => P.x);
  await page.evaluate(() => { __pad.axes[0] = 0.9; }); await step(60); await page.evaluate(() => { __pad.axes[0] = 0; }); await step(2);
  const x1 = await page.evaluate(() => P.x);
  ok(x1 - x0 > 40, 'left stick walks Vesper right (' + Math.round(x1 - x0) + 'px)');
  await press(START); await step(10);
  ok(await st() === 'paused', 'START pauses');
  ok((await focus()) === 'resumeBtn', 'pause focus on RESUME (' + await focus() + ')');
  ok(await page.evaluate(() => /Ⓨ/.test(document.querySelector('.pauseCard .pzsub').textContent)), 'pause prompt shows Ⓨ for the codex');
  await shot('pause_focus');
  ok(await navTo(f => f === 'b3PzSet', RIGHT, 4), 'D-pad reaches SETTINGS on the pause row');
  await press(A); await step(10);
  ok(await vis('b3Dials') && await st() === 'paused', 'SETTINGS opens THE DIALS over the pause');
  await press(DOWN); await press(DOWN); await press(DOWN);
  await shot('pause_dials');
  await press(B); await step(8);
  ok(!(await vis('b3Dials')) && await st() === 'paused', 'Ⓑ closes the dials, still paused');
  await press(B); await step(8);
  ok(await st() === 'playing', 'Ⓑ on the pause resumes');

  // codex
  await press(Y); await step(4);
  ok(await page.evaluate(() => $('tabPanel') && $('tabPanel').classList.contains('show')), 'Ⓨ opens the codex');
  await shot('codex');
  await press(Y); await step(4);
  ok(await page.evaluate(() => !$('tabPanel').classList.contains('show')), 'Ⓨ closes the codex');

  // rumble on a hit
  await page.evaluate(() => { window.__rumbles = []; SFX.hurt(); });
  ok(await page.evaluate(() => (window.__rumbles || []).length === 1), 'a hit rumbles the pad');
  await page.evaluate(() => { DIALS.rumble = false; PAD.rumbleUntil = 0; window.__rumbles = []; SFX.jackpot(); DIALS.rumble = true; });
  ok(await page.evaluate(() => (window.__rumbles || []).length === 0), 'rumble toggle off silences it');

  // Ⓐ is SPACE in the pit: cash a streak / tap the slot
  await page.evaluate(() => { window.__sp = 0; window.addEventListener('keydown', e => { if (e.key === ' ') window.__sp++; }); });
  await press(A);
  ok(await page.evaluate(() => window.__sp === 1), 'Ⓐ in the pit is one SPACE');

  // keyboard rebinding: MOVE UP → I (trusted key from the browser)
  await page.evaluate(() => { DIALS.binds = { up: 'i' }; keys.clear(); });
  await page.keyboard.down('i'); await step(2);
  ok(await page.evaluate(() => keys.has('w') && !keys.has('i')), 'rebinding: I walks up (translated to W)');
  await page.keyboard.up('i'); await step(2);
  ok(await page.evaluate(() => !keys.has('w')), 'rebinding: releasing I stops');
  // the swap law: give BET the W key → UP takes SPACE
  await page.evaluate(() => { DIALS.binds = {}; b3Assign(BIND_ACTS.find(a => a.id === 'bet'), 'w'); });
  ok(await page.evaluate(() => DIALS.binds.bet === 'w' && DIALS.binds.up === ' '), 'conflict: BET on W swaps MOVE UP onto SPACE');
  await page.evaluate(() => { b3Assign(BIND_ACTS.find(a => a.id === 'up'), 'f'); });
  ok(await page.evaluate(() => DIALS.binds.up === ' '), 'reserved key (F) refused');
  await page.evaluate(() => { DIALS.binds = {}; });

  // a pad mid-night switches to the keyboard and back: prompts follow the hand
  await page.keyboard.press('Shift'); await step(2);
  ok(await page.evaluate(() => PAD.mode === 'kb' && !document.body.classList.contains('padUI')), 'a key press hands prompts back to the keyboard');
  await press(LB); await step(2);
  ok(await page.evaluate(() => PAD.mode === 'pad'), 'a pad press takes them back');

  // die → the ledger is walkable
  await page.evaluate(() => { P.hp = 1; P.inv = 0; try { hurtPlayer(9999); } catch (e) {} });
  for (let i = 0; i < 400 && (await st()) !== 'dead'; i += 20) { await page.evaluate(() => { if (state === 'marker') { try { markerRef && (markerRef.p = 0); } catch (e) {} } }); await step(20); }
  for (let i = 0; i < 60 && (await st()) === 'marker'; i++) await step(30);
  await step(240);
  ok(await st() === 'dead', 'the night ends at the ledger (' + await st() + ')');
  await step(200);
  ok((await focus()) === 'againBtn', 'ledger focus on ANTE UP (' + await focus() + ')');
  await press(DOWN);
  const lf = await focus();
  ok(!!lf && lf !== 'againBtn', 'D-pad walks the ledger (' + lf + ')');
  await shot('ledger_focus');

  await browser.close();
  for (const l of log) console.log(l);
  for (const l of fails) console.log(l);
  for (const e of errors.slice(0, 8)) console.log('ERR ' + e);
  console.log(JSON.stringify({ checks: log.length + fails.length, failed: fails.length, errors: errors.length, which }));
  process.exit(fails.length || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
