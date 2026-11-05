#!/usr/bin/env node
// node launch/tools/itch.js   (run `npm run build` first)
// H1 THE LAUNCH KIT — the itch.io HTML5 upload: launch/itch/ (index.html = the built
// single file, plus the install-as-app kit so the hosted page makes no 404s) and
// launch/ante-mortem-itch.zip with index.html at the zip ROOT, as itch requires.
'use strict';
const path = require('path'), fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'), DIST = path.join(ROOT, 'dist'), OUT = path.join(ROOT, 'launch', 'itch');
const built = path.join(DIST, 'ante-mortem.html');
if (!fs.existsSync(built)) { console.error('no dist/ante-mortem.html — run npm run build'); process.exit(1); }
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) fs.rmSync(path.join(OUT, f), { force: true });
fs.rmSync(path.join(OUT, 'icons'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
fs.copyFileSync(built, path.join(OUT, 'index.html'));
const man = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8'));
man.start_url = './index.html';
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(man, null, 2));
fs.copyFileSync(path.join(DIST, 'sw.js'), path.join(OUT, 'sw.js'));
for (const f of fs.readdirSync(path.join(DIST, 'icons'))) fs.copyFileSync(path.join(DIST, 'icons', f), path.join(OUT, 'icons', f));
const music = path.join(DIST, 'assets', 'music');
if (fs.existsSync(music)) { fs.mkdirSync(path.join(OUT, 'assets', 'music'), { recursive: true }); for (const f of fs.readdirSync(music)) fs.copyFileSync(path.join(music, f), path.join(OUT, 'assets', 'music', f)); }
const zip = path.join(ROOT, 'launch', 'ante-mortem-itch.zip'); fs.rmSync(zip, { force: true });
// python's zipfile is everywhere python is; files go in at the zip root (no wrapping folder), README excluded
execFileSync('python3', ['-c', `
import os, sys, zipfile
src, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for d, _, fs in os.walk(src):
        for f in sorted(fs):
            if f == 'README.md': continue
            p = os.path.join(d, f); z.write(p, os.path.relpath(p, src))
`, OUT, zip]);
const kb = f => Math.round(fs.statSync(f).size / 1024) + 'KB';
console.log(JSON.stringify({ folder: path.relative(ROOT, OUT), index: kb(path.join(OUT, 'index.html')), zip: path.relative(ROOT, zip), zipSize: kb(zip) }, null, 1));
