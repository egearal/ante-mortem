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
      const inline = '<script>\n"use strict";\n' + js + '</script>\n';
      html = html.replace(srcTags[0][0], () => inline);
      for (const m of srcTags.slice(1)) html = html.replace(m[0], '');

      this.emitFile({ type: 'asset', fileName: 'ante-mortem.html', source: html });
    },
  };
}

export default defineConfig({
  plugins: [singleFile()],
  build: {
    rollupOptions: { input: 'virtual:empty' },
  },
});
