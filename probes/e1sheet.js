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
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close(); console.log(out, errors.slice(0, 4)); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
