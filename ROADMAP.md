# ANTE MORTEM — Roadmap / Idea Backlog
(Director adds ideas here in plain English; Claude Code picks them up. Later entries override earlier ones.)

## PRIORITY — Steam-ready commercial features (agreed with director)
- [ ] **PLAYABLE CHARACTERS** (4-6 unlockable gamblers, each warps core rules; unlocked via Ranks/secrets; character select screen on menu). Examples: The Debtor (starts cursed, +50% coins), The Croupier (slot odds shifted), The Widow (1 HP, triple damage). Biggest replay multiplier.
- [ ] **THE COLLECTION** — permanent museum built from the TAB codex: silhouettes fill in for every weapon/passive/tarot/curse ever encountered across all runs (persist!). Completion % shown on main menu.
- [ ] **DAILY DEBT** — daily seeded challenge, fixed loadout, one attempt, local best (leaderboard later).
- [ ] **STAKES** — post-win difficulty ladder (CRIMSON DECK → OBSIDIAN DECK...), each adds modifiers + exclusive rewards.
- [x] **Next-unlock teaser** on death screen under the rank bar: "NEXT: <reward> — N MARKS AWAY". *(shipped 2026-07)*
- [ ] **Controller / Steam Deck support** (menus + gameplay navigable by pad). Mandatory for Steam.
- [ ] Steam achievements mapped from existing achievement system; cloud-save-safe persistence.
- [ ] Free demo build target (first 15 min / rank-capped) for Next Fest wishlisting.

## MENU JUICE PASS — "kill the HTML look" *(SHIPPED 2026-07 — spec kept for reference)*
Goal: every menu element behaves like a physical casino object. Pure CSS+JS, no libraries.
- Buttons become **gilded plaques**: layered gradient (dark velvet body, gold bevel edge, inner shadow), NOT flat rects.
- **Hover:** lift (translateY -3px, scale 1.04) + glow bloom + slight 3D tilt toward cursor (perspective transform following mouse) + a light-shimmer sweep (moving diagonal gradient) + hover-chime SFX where EACH button has a slightly different pitch (like piano keys). Letter-spacing eases wider on hover.
- **Press:** squash (scale .95, 80ms) → release pop, gold ring-burst at click point, chip-clink SFX; the action fires on the release pop, not instantly.
- **Screen transitions:** menu items CASCADE in (staggered 60ms slide+fade from below); panels slide+fade, never pop. Leaving a screen: quick fade-through-black (120ms).
- **Ambience:** ember particles drifting over menus, subtle animated vignette breathing, low casino drone on the title screen, title strobe kept.
- **Cursor:** custom small gold spade cursor in menus (CSS cursor image), reverts to crosshair in gameplay.
- Apply the same treatment to: main menu, pause, vault, graphics menu, HOW TO PLAY, game-over buttons, jackpot cards.

## Later / director-owned
- [ ] **SOUNDTRACK: director will make the music himself later.** Code side: add a music channel with volume slider + hooks (menu theme, run theme, boss theme, ascent theme) that play files from an assets/music folder when they exist.
- [ ] More bosses (currently 4) with gambling-themed mechanics (a Croupier boss that forces coin-flips?)
- [ ] More tarot cards or a "major arcana upgrade" tier
- [ ] Slot machine visual overhaul pass (reels are functional; could be lusher)
- [ ] Endless mode / prestige after wave X
- [ ] Settings: volume sliders, key rebinding
- [ ] Steam/itch packaging (dist file is ready; needs capsule art + store description)
- [ ] Balance pass once real playtesting data exists (JACKPOT weapon power vs 8.5% odds)
- [ ] Localization (after content freeze)

## Explicitly rejected (do not re-add)
- Real-money anything.
- XP/money payouts from the Ascent (it pays PASSIVES/JACKPOT only).
- Entry fees or loans for the Ascent (it is free; crash = THE FALL curse).
- RICH COLOR as a toggle (saturation is permanent + gamble-boosted).
