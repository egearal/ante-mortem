# ANTE MORTEM — Roadmap / Idea Backlog
(Director adds ideas here in plain English; Claude Code picks them up. Later entries override earlier ones.)

## PRIORITY — Steam-ready commercial features (agreed with director)
- [ ] **PLAYABLE CHARACTERS** (4-6 unlockable gamblers, each warps core rules; unlocked via Ranks/secrets; character select screen on menu). Examples: The Debtor (starts cursed, +50% coins), The Croupier (slot odds shifted), The Widow (1 HP, triple damage). Biggest replay multiplier.
- [x] **THE COLLECTION** — shipped 2026-07 as **THE INDEX** (menu panel, 8 sections, ??? tiles fill in as encountered, persists under `am_index_v1`, completion % on menu, milestone gilt+favor rewards at 25/50/75/100%).
- [x] **DAILY DEBT** *(shipped B1, 2026-11)* — daily seeded challenge, fixed loadout, one attempt, local best (leaderboard later).
- [x] **STAKES** *(shipped B2: 5 decks + Endless, 2026-11)* — post-win difficulty ladder (CRIMSON DECK → OBSIDIAN DECK...), each adds modifiers + exclusive rewards.
- [x] **Next-unlock teaser** on death screen under the rank bar: "NEXT: <reward> — N MARKS AWAY". *(shipped 2026-07)*
- [x] **Controller / Steam Deck support** *(shipped B3, 2026-11)* (menus + gameplay navigable by pad). Mandatory for Steam.
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

## Shipped in THE SECOND NIGHT (2026-11, v5.0)
- [x] THE FEED replaces RAGE · weapons sooner · THE ASCENT v3 (self-climbing, THE ARMORY) · THE LESSON tutorial — see PLAN_FEED.md / notes/J1-J3.md

## Later / director-owned
- [ ] **SOUNDTRACK: director will make the music himself later.** *(code side shipped B3: drop files in assets/music/)* Code side: add a music channel with volume slider + hooks (menu theme, run theme, boss theme, ascent theme) that play files from an assets/music folder when they exist.
- [x] More bosses *(C2: the Croupier, the Bookie, the Twins of Fortune)* (currently 4) with gambling-themed mechanics (a Croupier boss that forces coin-flips?)
- [x] More tarot cards or a "major arcana upgrade" tier *(D4: 12 Major Arcana)*
- [ ] Slot machine visual overhaul pass (reels are functional; could be lusher)
- [x] Endless mode / prestige after wave X *(B2)*
- [x] Settings: volume sliders, key rebinding *(B3)*
- [x] Steam/itch packaging *(H1 launch kit: covers, capsules, store copy, itch zip)*
- [ ] Balance pass once real playtesting data exists (JACKPOT weapon power vs 8.5% odds)
- [ ] Localization (after content freeze)

## Explicitly rejected (do not re-add)
- Real-money anything.
- ~~XP/money payouts from the Ascent (it pays PASSIVES/JACKPOT only).~~ *Superseded 2026-11 by the director's THE SECOND NIGHT plan (PLAN_FEED.md): every Ascent rung now pays — levels, a hot level, THE ARMORY, Ascension.*
- Entry fees or loans for the Ascent (it is free; crash = THE FALL curse).
- RICH COLOR as a toggle (saturation is permanent + gamble-boosted).
