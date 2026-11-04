# ♠ ANTE MORTEM — the House always bleeds

A gothic-casino roguelite in **one self-contained HTML file**. Top-down survivor
combat wired into slot machines, dice ladders, a wheel of souls, a crash-game
ascension, and a death roll you can press your luck against. Survive until 13:00 —
then the House itself walks the floor.

**FAKE currency only.** The House pays in nothing you can spend.

## ▶ Play

**In your browser, on any device: https://egearal.github.io/ante-mortem/**
On a phone, use your browser's *Add to Home Screen* to install it as an app — it then plays offline.

Or download **[`dist/ante-mortem.html`](dist/ante-mortem.html)** and open it in any
browser. No install, no server, no internet — fonts and art are baked in.
Press **SPACE**. Saves live in your browser's storage.

## Controls

- **Keyboard:** WASD walk · SPACE is every bet · ENTER cashes the Ascent · ESC pause · TAB codex · M mute · R (hold, when dead) re-ante. Rebind in OPTIONS.
- **Phone / tablet:** left thumb drags a floating stick · the gold **BET** coin is SPACE · ⏸ and ✦ CODEX buttons up top.
- **Controller / Steam Deck:** left stick moves · Ⓐ bet · Ⓑ back · START pause · every menu walks with the d-pad.

## What's in the House

10 souls with their own rules · 4 floors (THE PIT, THE CELLAR, THE CHAPEL, THE BALLROOM) · 29 weapons and
10 secret **Pairings** that evolve them · the slot, dice, wheel, crash-game Ascent and Death Roll · tarot plus
12 rare **Major Arcana** · 7 bosses including three gambling lords and THE HOUSE at 13:00 · **Daily Debt**, one
seeded night per day for everyone · 5 **Stakes** and the **Endless** floor after you win · the **Book of Debts**
mapping every unlock · 100 House ranks, feats, the Index and the Vault.

See `CHANGELOG_NIGHT.md` for everything added on the night of 2026-11-04.

## Build from source

The game is 14 plain scripts in `src/` sharing global scope, concatenated by Vite:

```
npm install
npm run build   # syntax-gates all scripts, emits dist/ante-mortem.html
```

`GAME_DESIGN.md` is the complete design record — every system, every number,
and the QA ledger across all sixteen development batches (v1.0 → v4.0 FINAL).

## Version

**v4.0 — FINAL** · one file · 951KB raw / 401KB gzip · zero network requests
