#!/usr/bin/env node
// E1 — the court's baked frames laid out big: every type × 4 frames, body over a velvet tile, plus the
// ink plate, rim, wound and white-flash variants of frame 0. node probes/e1sheet.js <out.png> [--src]
'use strict';
const path = require('path'), fs = require('fs');
const { launch, run } = require('./lib');
const out = process.argv[2] || path.join(__dirname, '..', 'shots', 'e1-after', 'court_frames.png');
(async () => {
  const { browser, page, errors } = await launch({ which: process.argv.includes('--src') ? 'src' : 'dist' });
  await run(page, 10);
  const url = await page.evaluate(() => {
    const T = ['shambler', 'husk', 'swarm', 'bomber', 'leech', 'shooter', 'wraith', 'stalker', 'hexer', 'brute', 'revenant', 'elite', 'gilded'];
    const C = 150, cols = 8, cv = document.createElement('canvas'); cv.width = C * cols; cv.height = C * T.length; const g = cv.getContext('2d');
    g.fillStyle = '#1a0a10'; g.fillRect(0, 0, cv.width, cv.height);
    T.forEach((t, j) => { const b = CFG.enemy[t];
      for (let i = 0; i < cols; i++) { const x = i * C, y = j * C; g.fillStyle = (i + j) % 2 ? '#22101a' : '#1c0c14'; g.fillRect(x, y, C, C);
        const draw = (m, f) => { const s = courtBake(t, f, m, b.col, b.dark); const k = (C - 6) / s.width; g.drawImage(s, x + 3, y + 3, s.width * k, s.height * k); };
        if (i < 4) { draw('i', i); draw('b', i); }
        else if (i === 4) { draw('i', 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55; draw('r', 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; draw('b', 0); }
        else if (i === 5) { draw('i', 0); draw('b', 0); g.globalAlpha = 0.42; draw('d', 0); g.globalAlpha = 1; }
        else if (i === 6) { draw('i', 0); draw('w', 0); }
        else { draw('i', 0); } }
      g.fillStyle = '#e6d9c2'; g.font = '12px serif'; g.fillText(t, 4, j * C + 14); });
    return cv.toDataURL('image/png');
  });
  // the arsenal gallery: each new projectile drawn 3x with its trail (and the crit glint), on the game's own painter
  const url2 = await page.evaluate(() => {
    const W = 1200, H = 300; cv.width = W; cv.height = H; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#1a0a10'; ctx.fillRect(0, 0, W, H);
    const L = [['bone bolt', { crit: false, pierce: 0, r: 5 }], ['bolt · CRIT', { crit: true, pierce: 0, r: 5 }], ['cylinder round', { crit: false, r: 4 }], ['coffin nail', { pierce: 1, r: 4 }],
      ['lantern wisp', { r: 4 }], ['rat-king fang', { seek: true, r: 3.5 }], ['grave moth', { seek: true, r: 3 }], ['loaded die', { bounce: 3, r: 6, crit: false }],
      ['chip mortar', { blast: 80, r: 8, life: 0.55 }], ['card shark wave', { r: 20, pierce: 5, crit: false }], ['dealer card (face)', { kind: 'card', spin: 0.15, r: 6, crit: false }],
      ['dealer card (back)', { kind: 'card', spin: 2.9, r: 6, crit: false }], ['spinning knife', { kind: 'knife', spin: 0.9, r: 5, crit: false }]];
    L.forEach(([name, o], i) => { const col = i % 7, row = (i / 7) | 0, x = 80 + col * 160, y = 70 + row * 150;
      ctx.save(); ctx.translate(x, y); ctx.scale(2.6, 2.6); ctx.translate(-x, -y);
      const b = Object.assign({ x, y, px: x - 9, py: y - 2, vx: 300, vy: 60, life: 1 }, o);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; arsenalTrail(b); ctx.restore();
      arsenalDraw(b);
      if (b.crit && b.kind !== 'card') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); const gs = 8 + b.r * 1.6; ctx.drawImage(_glintSp(), -gs, -gs, gs * 2, gs * 2); ctx.restore(); }
      ctx.restore(); ctx.fillStyle = '#e6d9c2'; ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.fillText(name, x, y + 62); });
    return cv.toDataURL('image/png');
  });
  fs.writeFileSync(out.replace(/\.png$/, '') + '_arsenal.png', Buffer.from(url2.split(',')[1], 'base64'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close(); console.log(out, errors.slice(0, 4)); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
