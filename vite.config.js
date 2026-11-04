import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Single-file plugin: emits dist/ante-mortem.html with styles.css inlined
 * into a <style> tag and the game scripts concatenated (in index.html tag
 * order) into one classic <script> — reproducing the original one-file build.
 *
 * The game shares ~400 top-level bindings across files through the global
 * scope, so the scripts are classic (non-module) scripts and their load
 * order is meaningful; concatenation preserves it.
 */

/**
 * B3: the House band. Tracks dropped in assets/music/ (menu|run|boss|ascent|house
 * .ogg/.mp3/.m4a) are listed into window.__AM_MUSIC so the page only ever asks
 * for files that exist — a missing track costs no request and no console noise.
 */
const MUSIC_CTX = ['menu', 'run', 'boss', 'ascent', 'house'];
function musicFiles(root) {
  const dir = path.join(root, 'assets', 'music');
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { return []; }
  return names.filter(f => /^(menu|run|boss|ascent|house)\.(ogg|mp3|m4a)$/i.test(f));
}
function musicTag(files) {
  const order = { ogg: 0, mp3: 1, m4a: 2 };
  const map = {};
  for (const f of files.slice().sort((a, b) => order[a.split('.').pop().toLowerCase()] - order[b.split('.').pop().toLowerCase()])) {
    const k = f.split('.')[0].toLowerCase();
    if (MUSIC_CTX.includes(k)) (map[k] = map[k] || []).push('assets/music/' + f);
  }
  return '<script>window.__AM_MUSIC=' + JSON.stringify(map) + ';</script>\n';
}
function musicDev() {
  return {
    name: 'ante-mortem-music-dev',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace('<script src="./src/core.js"></script>', () => musicTag(musicFiles(path.resolve(__dirname))) + '<script src="./src/core.js"></script>');
    },
  };
}

function singleFile() {
  const VIRTUAL = '\0ante-mortem-empty';
  return {
    name: 'ante-mortem-single-file',
    apply: 'build',
    resolveId(id) {
      if (id === 'virtual:empty') return VIRTUAL;
    },
    load(id) {
      if (id === VIRTUAL) return 'export {}';
    },
    generateBundle(_options, bundle) {
      // drop the placeholder entry chunk; we emit the real artifact below
      for (const key of Object.keys(bundle)) delete bundle[key];

      const root = path.resolve(__dirname);
      let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

      const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
      html = html.replace(
        /<link rel="stylesheet" href="\.\/styles\.css">/,
        () => '<style>\n' + css + '</style>'
      );

      const srcTags = [...html.matchAll(/<script src="\.\/src\/([\w-]+)\.js"><\/script>\n?/g)];
      const js = srcTags
        .map(m => {
          const code = fs.readFileSync(path.join(root, 'src', m[1] + '.js'), 'utf8');
          return code.replace(/^"use strict";\n/, '');
        })
        .join('');
      const tracks = musicFiles(root);
      const inline = musicTag(tracks) + '<script>\n"use strict";\n' + js + '</script>\n';
      html = html.replace(srcTags[0][0], () => inline);
      for (const m of srcTags.slice(1)) html = html.replace(m[0], '');

      this.emitFile({ type: 'asset', fileName: 'ante-mortem.html', source: html });
      // B3: the band travels with the hosted build (beside dist/ante-mortem.html)
      for (const f of tracks)
        this.emitFile({ type: 'asset', fileName: 'assets/music/' + f, source: fs.readFileSync(path.join(root, 'assets', 'music', f)) });

      // A4: the hosted build also carries the install-as-app kit (ignored from file://)
      const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
      man.start_url = './ante-mortem.html';
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify(man, null, 2) });
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: fs.readFileSync(path.join(root, 'sw.js'), 'utf8') });
      for (const f of fs.readdirSync(path.join(root, 'icons')).filter(f => /\.(png|svg)$/.test(f)))
        this.emitFile({ type: 'asset', fileName: 'icons/' + f, source: fs.readFileSync(path.join(root, 'icons', f)) });
    },
  };
}

export default defineConfig({
  plugins: [singleFile(), musicDev()],
  build: {
    rollupOptions: { input: 'virtual:empty' },
  },
});
