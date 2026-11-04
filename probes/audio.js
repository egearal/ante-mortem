// E3 — THE SOUND OF THE HOUSE: offline audio meter.
// Renders scripted sound sequences through the game's REAL synth graph into an
// OfflineAudioContext (the page's AudioContext is swapped for the offline one,
// and timers/performance.now run on the offline clock), then reports peak,
// loudness and clipping per category.
//
//   node probes/audio.js                 # after (dist/ante-mortem.html)
//   node probes/audio.js --before FILE   # also meter an older build and compare
//   node probes/audio.js --src           # unbuilt index.html
//   node probes/audio.js --wav DIR       # also write each render as a .wav
// Exit 1 on a page error, or if the AFTER build clips a single sample.
'use strict';
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : null; };
const AFTER = opt('--src') ? path.join(ROOT, 'index.html') : path.join(ROOT, 'dist', 'ante-mortem.html');
const BEFORE = opt('--before');
const WAV = opt('--wav');

// a tiny clock the harness owns: timers and performance.now follow the offline render
const CLOCK = `(()=>{
  let VT=0, id=1; const q=[];
  performance.now=()=>VT; const base=Date.now(); Date.now=()=>base+VT;
  window.setTimeout=(fn,ms,...a)=>{ q.push({id:id++,at:VT+Math.max(0,+ms||0),fn,a,iv:0}); return id-1; };
  window.setInterval=(fn,ms,...a)=>{ const iv=Math.max(4,+ms||0); q.push({id:id++,at:VT+iv,fn,a,iv}); return id-1; };
  window.clearTimeout=window.clearInterval=(i)=>{ const k=q.findIndex(t=>t.id===i); if(k>=0) q.splice(k,1); };
  window.requestAnimationFrame=()=>id++; window.cancelAnimationFrame=()=>{};
  window.__clk={ to(ms){ if(ms<VT) return; for(let g=0;g<5000;g++){ let b=-1; for(let i=0;i<q.length;i++) if(q[i].at<=ms&&(b<0||q[i].at<q[b].at)) b=i;
      if(b<0) break; const t=q[b]; VT=t.at; if(t.iv) t.at+=t.iv; else q.splice(b,1); try{ t.fn(...t.a); }catch(e){ console.error('[timer]',e&&e.stack||e); } } VT=ms; } };
  window._noAutoPause=true;
})();`;

// Sequences: [seconds, js] — the js runs in the page at that offline time.
// K(n) = one kill (new: SFX.kill; old builds: the inline tones core.js used to play)
const PRE = `
window.K=function(ks){ if(SFX.kill && SFX.kill.length!==undefined && SFX.kill.toString().length && typeof SFX.streakStep==='function'){ SFX.kill(ks); if(ks%25===0) SFX.streakStep(ks); }
  else { const kf=440*Math.pow(1.0595,Math.min(24,ks)); tone(kf,0.07,'triangle',0.09,kf*2); tone(kf*2,0.05,'sine',0.045); if(ks%25===0) tone(700*Math.pow(1.0595,Math.min(24,ks/25)),0.09,'sine',0.12); }
  if([10,25,50,100,200].includes(ks)){ const tier=ks>=200?5:ks>=100?4:ks>=50?3:ks>=25?2:1; SFX.cheer(); SFX.dingHit(tier); if(tier>=3) SFX.dingBells(); }
  if(ks%50===0) SFX.casinoDing(); };
window.C=function(cb){ if(typeof SFX.coinStep==='function') SFX.coinStep(cb); else tone(700*Math.pow(2,(cb%12)/12)*(cb>=12?1.5:1),0.06,'sine',0.07); if(cb>0&&cb%10===0) SFX.casinoDing(); };
window.X=function(cb){ if(typeof SFX.xpStep==='function') SFX.xpStep(cb); else tone(520*Math.pow(1.0595,cb),0.05,'triangle',0.07+cb*0.003); };
window.HOUSE=function(){ if(typeof SFX.houseArrive==='function') SFX.houseArrive(); else tone(38,1.6,'sine',0.32,24); SFX.bossRoar(); };
window.TRIPLE=function(){ if(typeof SFX.triple==='function') SFX.triple(); };
window.RANKUP=function(){ if(typeof SFX.rankUp==='function') SFX.rankUp(); else { SFX.seraph(); SFX.dingBells(); } };
`;
function every(t0, t1, dt, js) { const out = []; for (let t = t0; t < t1 - 1e-9; t += dt) out.push([+t.toFixed(3), typeof js === 'function' ? js(t, out.length) : js]); return out; }
const SEQ = {
  ui: { dur: 2.5, ev: [...every(0, 1.2, 0.04, 'SFX.press()'), ...every(0, 1, 0.2, 'SFX.uiDing()'), ...every(1.2, 1.9, 0.12, 'SFX.casinoDing()'), [2.0, 'SFX.chipStack()'], [2.1, 'SFX.tick()']] },
  combat: { dur: 3.5, ev: [...every(0, 3, 0.0167, 'SFX.shoot();SFX.hit();SFX.hit();SFX.hit()'), ...every(0, 3, 0.05, 'SFX.knife();if(SFX.crit)SFX.crit();else tone(2350,0.05,"triangle",0.085,1600)'), ...every(0, 3, 1, 'SFX.nova()'), ...every(0.2, 3, 0.4, 'SFX.hurt();SFX.eshoot()')] },
  storm: { dur: 2.6, ev: every(0, 2, 0.0167, (t, i) => `for(let j=0;j<3;j++){ window.__ks3=(window.__ks3||0)+1; const k=window.__ks3; if(SFX.streakStep) SFX.kill(k); else { const kf=440*Math.pow(1.0595,Math.min(24,k)); tone(kf,0.07,'triangle',0.09,kf*2); tone(kf*2,0.05,'sine',0.045); } }`) },
  kills: { dur: 3, ev: every(0, 2, 0.0167, (t, i) => `for(let j=0;j<3;j++){ window.__ks=(window.__ks||0)+1; if(window.__ks<=300) K(window.__ks); }`) },
  pickups: { dur: 2.6, ev: [...every(0, 1.5, 0.0167, (t, i) => `C(${Math.floor(i * 1.6) % 40});C(${Math.floor(i * 1.6 + 1) % 40})`), ...every(0, 1.6, 0.03, (t, i) => `X(${Math.min(14, i)})`), ...every(0, 1.5, 0.2, 'SFX.coinPling()')] },
  slot: { dur: 3.6, ev: [[0, 'SFX.lever&&SFX.lever();startWhirr&&startWhirr()'], [0.6, 'SFX.reelHit(1)'], [1.0, 'SFX.reelHit(2)'], [1.4, 'SFX.reelHit(3);stopWhirr()'], [1.5, 'SFX.reelLock()'], [1.72, 'SFX.nearMiss()'],
    ...every(2.4, 3.0, 0.1, (t, i) => `SFX.selectorTick(${i + 1})`), [3.05, 'SFX.dingHit(4)'], [3.2, 'SFX.multDing(6)']] },
  triple: { dur: 5, ev: [[0, 'SFX.reelLock();TRIPLE()'], [1.05, 'SFX.reelLock();SFX.dingHit(6)'], [1.9, 'SFX.bigWin(4);SFX.dingBells();SFX.seraph()'], [2.0, 'SFX.cashout();SFX.jackpot()'], [2.1, 'SFX.dingBells()']] },
  levelup: { dur: 4.5, ev: [[0, 'SFX.levelUp()'], [2.0, 'RANKUP()']] },
  boss: { dur: 5, ev: [[0, 'HOUSE()'], [1.4, 'startDrone();SFX.bossRoar()'], [3.0, 'SFX.death()']] },
  chaos: { dur: 5, ev: [...every(0, 4, 0.0167, (t, i) => `for(let j=0;j<4;j++){ window.__ks2=(window.__ks2||0)+1; K(window.__ks2%240+1); } SFX.shoot();SFX.hit();SFX.hit();C(${i % 30});X(${Math.min(14, i % 20)})`),
    [0.5, 'SFX.reelLock();TRIPLE()'], [1.6, 'SFX.bigWin(4);SFX.dingBells();SFX.seraph();SFX.jackpot()'], [1.7, 'SFX.cashout();SFX.levelUp()'], [2.5, 'HOUSE()'], [3.0, 'SFX.vaultOpen();SFX.dingBells()']] },
  amb_pit: { dur: 8, floor: 'pit', ev: [[0, 'startAmbience()']] },
  amb_cellar: { dur: 8, floor: 'cellar', ev: [[0, 'startAmbience()']] },
  amb_chapel: { dur: 8, floor: 'chapel', ev: [[0, 'startAmbience()']] },
  amb_ballroom: { dur: 8, floor: 'ballroom', ev: [[0, 'startAmbience();try{ Object.assign(BAL,{beatAcc:0,bi:0,tinkT:6,waltz:null}); }catch(e){}'], ...every(0, 8, 0.05, 'try{ if(typeof balMusic==="function") balMusic(0.05); }catch(e){ console.error(e); }')] },
  amb_duck: { dur: 6, floor: 'pit', ev: [[0, 'startAmbience()'], [2.9, 'window.__dk=[]; try{ window.__dk.push(_e3.bus.amb.gain.value); }catch(e){}'], [3, 'SFX.jackpot()'], [3.6, 'try{ window.__dk.push(_e3.bus.amb.gain.value); }catch(e){}'], [5.9, 'try{ window.__dk.push(_e3.bus.amb.gain.value); }catch(e){}']] },
};

async function meter(file, label) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const res = {};
  for (const [name, sq] of Object.entries(SEQ)) {
    // a fresh page per sequence: no timers or state leak from one render into the next
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ' pageerror: ' + (e.stack || e.message)));
    page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
    await page.addInitScript(CLOCK);
    await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto('file://' + file);
    await page.evaluate(() => window.__clk.to(1500));
    await page.evaluate(PRE);
    const r = await page.evaluate(async ({ name, sq, wav }) => {
      const sr = 44100, oc = new OfflineAudioContext(2, Math.ceil(sr * sq.dur), sr);
      window.AudioContext = window.webkitAudioContext = function () { return oc; };
      window.__probeFloor = sq.floor || 'pit';
      try { if (typeof GFX !== 'undefined') GFX.amb = true; } catch (e) {}
      // tear down the last render's graph and rebuild it on the offline context
      eval(`try{ stopAmbience(); }catch(e){} try{ _amb=null; }catch(e){} try{ drone=null; droneGain=null; }catch(e){} try{ _whirSrc=null; _drumSrc=null; }catch(e){}
        AC=null; master=null; muted=false; _voices=0; try{ sfxBus=null; musicBus=null; }catch(e){} try{ _comp=null; }catch(e){}`);
      eval('initAudio()');
      const T0 = performance.now();
      const evs = sq.ev.slice().sort((a, b) => a[0] - b[0]); let k = 0;
      const fire = (t) => { window.__clk.to(T0 + t * 1000); while (k < evs.length && evs[k][0] <= t + 1e-6) { try { (0, eval)(evs[k][1]); } catch (e) { console.error('[seq ' + name + ']', e && e.stack || e); } k++; } };
      fire(0);
      const STEP = 0.01;
      for (let i = 1; i * STEP < sq.dur - STEP; i++) { const t = +(i * STEP).toFixed(2); oc.suspend(t).then(() => { fire(t); oc.resume(); }); }
      const buf = await oc.startRendering();
      let peak = 0, clips = 0, ss = 0, n = 0, stMax = 0; const W = Math.floor(sr * 0.1);
      const chs = [buf.getChannelData(0), buf.getChannelData(1)];
      for (let i = 0; i < buf.length; i += W) { let s2 = 0, m = 0;
        for (let j = i; j < Math.min(buf.length, i + W); j++) for (const d of chs) { const v = d[j]; const a = Math.abs(v); if (a > peak) peak = a; if (a >= 0.999) clips++; s2 += v * v; m++; }
        ss += s2; n += m; stMax = Math.max(stMax, Math.sqrt(s2 / Math.max(1, m))); }
      const out = { peak, clips, rms: Math.sqrt(ss / Math.max(1, n)), st: stMax };
      // ducking proof: room level just before vs during the jackpot
      if (name === 'amb_duck') { const rmsAt = (a, b) => { let s = 0, m = 0; for (let j = Math.floor(a * sr); j < Math.floor(b * sr); j++) { const v = chs[0][j]; s += v * v; m++; } return Math.sqrt(s / m); };
        out.bedBefore = rmsAt(2.0, 2.9); out.dk = window.__dk || null; }
      if (wav) { const L = chs[0], R = chs[1], b = new Int16Array(buf.length * 2);
        for (let i = 0; i < buf.length; i++) { b[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; b[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
        let s = ''; const u8 = new Uint8Array(b.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        out.pcm = btoa(s); }
      try { out.drops = (typeof _e3 !== 'undefined') ? Object.assign({}, _e3.drops) : null; if (typeof _e3 !== 'undefined') _e3.drops = {}; } catch (e) {}
      return out;
    }, { name, sq, wav: !!WAV });
    await ctx.close();
    if (r.pcm) {
      const pcm = Buffer.from(r.pcm, 'base64'); delete r.pcm;
      const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
      h.writeUInt32LE(44100, 24); h.writeUInt32LE(44100 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
      fs.mkdirSync(WAV, { recursive: true }); fs.writeFileSync(path.join(WAV, `${label}-${name}.wav`), Buffer.concat([h, pcm]));
    }
    res[name] = r;
  }
  await browser.close();
  return { res, errors };
}
const db = v => v > 0 ? (20 * Math.log10(v)).toFixed(1).padStart(6) : '  -inf';
(async () => {
  const runs = [];
  if (BEFORE) runs.push(['before', path.resolve(BEFORE)]);
  runs.push(['after', AFTER]);
  const all = {};
  for (const [label, file] of runs) { all[label] = await meter(file, label); }
  console.log('\nE3 audio meter — peak / loudest 100ms RMS / mean RMS in dBFS, clipped samples (|x|≥0.999)\n');
  console.log('sequence      ' + runs.map(([l]) => `${l.padEnd(6)} peak    st   rms  clips`).join('   │ '));
  for (const name of Object.keys(SEQ)) {
    console.log(name.padEnd(13) + ' ' + runs.map(([l]) => { const r = all[l].res[name]; return `       ${db(r.peak)} ${db(r.st)} ${db(r.rms)} ${String(r.clips).padStart(6)}`; }).join('   │ '));
  }
  for (const [l] of runs) { const d = all[l].res.amb_duck; if (d && d.dk && d.dk.length === 3) console.log(`${l}: room-bed bus gain ${db(d.dk[0])} dB before the jackpot → ${db(d.dk[1])} dB under it → ${db(d.dk[2])} dB 2.9s later`); else console.log(`${l}: no room-bed bus (nothing ducks)`); }
  const a = all.after;
  const drops = {}; for (const n of Object.keys(SEQ)) { const d = a.res[n].drops; if (d) for (const k in d) drops[k] = (drops[k] || 0) + d[k]; }
  console.log('after: voices shed by caps/throttles:', JSON.stringify(drops));
  let bad = 0;
  for (const [l] of runs) { if (all[l].errors.length) { console.log(`${l} errors:`, all[l].errors.slice(0, 5)); if (l === 'after') bad++; } }
  const clipT = Object.values(a.res).reduce((s, r) => s + r.clips, 0);
  if (clipT) { console.log('AFTER CLIPS:', clipT); bad++; }
  fs.writeFileSync(path.join(ROOT, 'probes', 'audio-report.json'), JSON.stringify(Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.res])), null, 1));
  console.log(bad ? '\nFAIL' : '\nPASS — 0 clipped samples, 0 errors');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
