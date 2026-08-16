# ♠ ANTE MORTEM — the House always bleeds

A gothic-casino roguelite in **one self-contained HTML file**. Top-down survivor
combat wired into slot machines, dice ladders, a wheel of souls, a crash-game
ascension, and a death roll you can press your luck against. Survive until 13:00 —
then the House itself walks the floor.

**FAKE currency only.** The House pays in nothing you can spend.

## ▶ Play

Download **[`dist/ante-mortem.html`](dist/ante-mortem.html)** and open it in any
browser. No install, no server, no internet — fonts and art are baked in.
Press **SPACE**. Saves live in your browser's storage.

## Controls

WASD walk · SPACE is every bet · ENTER cashes the Ascent · ESC pause · TAB codex ·
M mute · R (hold, when dead) re-ante

## Build from source

The game is 13 plain scripts in `src/` sharing global scope, concatenated by Vite:

```
npm install
npm run build   # syntax-gates all scripts, emits dist/ante-mortem.html
```

`GAME_DESIGN.md` is the complete design record — every system, every number,
and the QA ledger across all sixteen development batches (v1.0 → v4.0 FINAL).

## Version

**v4.0 — FINAL** · one file · 951KB raw / 401KB gzip · zero network requests
