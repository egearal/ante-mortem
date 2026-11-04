#!/usr/bin/env node
// node icons/make.js → icons/icon-{180,192,512}.png, icon-maskable-512.png, icon.svg
// A gilt ♠ on oxblood velvet, drawn as a path (no font dependency), rendered
// in headless Chromium so the PNGs are pixel-identical to the SVG.
'use strict';
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const OUT = __dirname;
// spade on a 100×100 board; `pad` shrinks it for maskable safe zone
const svg = (pad, ring) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
 <radialGradient id="v" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#4a0f1c"/><stop offset=".55" stop-color="#2a0f16"/><stop offset="1" stop-color="#0a0507"/></radialGradient>
 <linearGradient id="g" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff2c0"/><stop offset=".45" stop-color="#ffd36b"/><stop offset="1" stop-color="#a8701c"/></linearGradient>
 <radialGradient id="h" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#ffd36b" stop-opacity=".28"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
</defs>
<rect width="100" height="100" fill="url(#v)"/>
<circle cx="50" cy="48" r="40" fill="url(#h)"/>
${ring ? '<rect x="5" y="5" width="90" height="90" rx="14" fill="none" stroke="#e8b64c" stroke-opacity=".7" stroke-width="1.6"/><rect x="8.5" y="8.5" width="83" height="83" rx="11" fill="none" stroke="#e8b64c" stroke-opacity=".25" stroke-width=".8"/>' : ''}
<g transform="translate(50 50) scale(${(1 - pad).toFixed(3)}) translate(-50 -50)">
 <path d="M50 14 C 58 28, 82 40, 82 58 C 82 70, 70 76, 61 72 C 57 70, 55 67, 54 64 C 55 72, 58 80, 66 86 L 34 86 C 42 80, 45 72, 46 64 C 45 67, 43 70, 39 72 C 30 76, 18 70, 18 58 C 18 40, 42 28, 50 14 Z"
  fill="url(#g)" stroke="#5a3608" stroke-width="1.6" stroke-linejoin="round"/>
 <path d="M50 20 C 56 31, 72 41, 76 54" fill="none" stroke="#fff8e0" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>
</g>
</svg>`;
(async () => {
  fs.writeFileSync(path.join(OUT, 'icon.svg'), svg(0.08, true));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const jobs = [['icon-180.png', 180, 0.08, true], ['icon-192.png', 192, 0.08, true], ['icon-512.png', 512, 0.08, true], ['icon-maskable-512.png', 512, 0.3, false]];
  for (const [name, size, pad, ring] of jobs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:#000">${svg(pad, ring).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await page.screenshot({ path: path.join(OUT, name), clip: { x: 0, y: 0, width: size, height: size } });
    console.log('  ✓ ' + name);
  }
  await browser.close();
})();
