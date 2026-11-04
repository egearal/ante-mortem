# ANTE MORTEM — THE LONG NIGHT (15-hour build plan)

Director's brief: "a proper roguelike, Vampire Survivors but casino, addicting, everyone would love to play. Full creative freedom. Make it good."
Orchestrator: the main Claude session. Workers: parallel cloud sessions, one branch each, PR to main.
Every worker reads CLAUDE.md and GAME_DESIGN.md first. Hard rules there still apply (fake currency, save keys, one file, 13 scripts, glyph safety).

## Art direction — "GILT NOIR"
The House is a velvet-and-bone casino lit by candles. Everything on screen obeys five laws:

1. **Silhouette first.** Every living thing reads at a glance by shape alone. Enemies get a 2px near-black outline and a thin rim light on the side facing the player. Each enemy type has one unmistakable silhouette (winged / spider / hooded / mass / pauldron / crawler / archer). Eyes track the player.
2. **Three values.** Floor is the darkest thing on screen (velvet black-red, desaturated). Enemies are the mid value. The player, pickups, bullets and anything that rewards are the brightest. If a screenshot's brightest pixel isn't the player or a reward, it's wrong.
3. **Gold is earned.** Gold (#ffd36b / #e8b64c) appears only on things that pay: coins, jackpots, level-ups, the HUD frame. The floor and enemies never use gold.
4. **Light is real.** Candle pools, sconces and the player's own halo are additive light sources with soft falloff. Edges of the screen fall into vignette dark. Bloom on gold and on the mint ascension color only.
5. **Every hit is felt.** White flash on damage (enemy and player), 40ms hit-stop on elite kills, kill bursts scale with enemy tier, blood lands on the floor (gore ledger exists). Screen shake is short and sharp, never mushy.

Palette: velvet #1a0a10 / #2a0f16 floor · bone #e6d9c2 · gold #ffd36b · blood #8b1620 · mint #8bffd0 (ascension) · violet #c98bff (curse) · white-gold #fff2c0 (highlights).
Typography stays: the display serif for titles, small caps tracking for labels.
Vesper, the player: redrawn larger and more distinct — long coat, hat brim, a visible face, a two-frame run cycle and an idle breathe. Hitbox unchanged.

Workers in the art sessions commit before/after PNG pairs to `shots/` so the director can judge in the morning.

## Foundation (orchestrator, hour 0–1)
- `probes/bot.js`: Playwright harness per GAME_DESIGN appendix — fast-forward clock, autoplay bot, runs N nights, reports death times, level reached, errors, heap. `npm run probe`.
- `probes/shots.js`: deterministic screenshot set (menu, 0:30, 3:00, slot open, death, mobile 390×844) → `shots/`.
- GitHub Actions: build + probe on PR; deploy `dist/` to GitHub Pages on main.
- Branch protection by convention: nothing merges that fails build or probe.

## Wave A (hours 1–6, 4 parallel sessions)
- **A1 — Gilt Noir: the floor and the court.** Laws 1–5 applied to world rendering: outlines, rim light, three-value grade, additive candle light, bloom, hit flash, hit-stop, kill bursts by tier, Vesper redesign. Before/after shots at 0:30 and 5:00 on q=high and q=low. No gameplay number changes.
- **A2 — Gilt Noir: the machine and the hall.** Slot reels as a physical cast-brass machine (chrome bezel, glass, lever pull, reel-stop clunk, near-miss wobble, payline flash). HUD reframed as engraved brass plaques. Death ledger and menu given the same treatment. Before/after shots.
- **A3 — The first night.** New players die in ~15s. For a player's first 3 nights (tracked in a new additive key, never changing existing keys): spawn ramp starts at 55% for 90s, first level-up at 10 XP, three short in-world tips (move, SPACE is every bet, the slot). Veteran curve untouched. Prove it with the probe: fresh-save bot survives ≥2:30 median; rank-20 sim unchanged. Also: a **death share card** — one tap copies "♠ ANTE MORTEM · survived 7:56 · lvl 14 · 2 jackpots · <link>" and renders a PNG card.
- **A4 — The pocket casino.** Phone support: virtual stick (left half), BET button (right thumb) that is SPACE, pause and codex reachable, HUD and slot layouts that fit 390×844 portrait and landscape, safe-area insets, no 300ms tap delay, audio unlock on first touch. PWA: manifest + service worker so it installs to the home screen and runs offline (still one HTML file for `dist/`; the SW and manifest are additional files in `dist/` for the hosted build only). Probe on a mobile viewport.

## Wave B (hours 6–11, 4 parallel sessions)
- **B1 — Daily Debt.** One seeded run per day (seed from UTC date; all RNG for spawns/slots/wheel through a seeded PRNG for that mode only). Fixed loadout, one attempt, local best, streak counter, menu plaque with countdown to next debt, share card variant "DAILY DEBT #<n>".
- **B2 — Stakes and the Endless floor.** After the HOUSE is beaten: CRIMSON DECK → OBSIDIAN DECK → IVORY DECK, each adding modifiers and an exclusive reward. Endless mode after 13:00 with escalating court and a score multiplier.
- **B3 — Hands and dials.** Gamepad for menus + gameplay (Steam Deck layout), settings panel: master/SFX/music sliders, key rebinding, music channel with hooks (menu/run/boss/ascent) reading `assets/music/*` when present.
- **B4 — The wrecking crew.** Fuzz 5,000 inputs across state churn on desktop and mobile sizes, 20 full nights with the probe, profiler on a throttled phone profile. Fix everything found. Perf budget: p95 frame ≤ 12ms at 300 enemies on q=high.

## Integration (hours 11–14, orchestrator + fix sessions)
Merge order: A1, A2, A4, A3, B3, B1, B2, B4. Resolve conflicts, rebuild, full probe suite, visual check of shots. Spawn fix sessions for anything red. One balance session if the probe shows the new-player curve or stakes are off.

## Ship (hour 14–15)
Main deployed to GitHub Pages. `dist/ante-mortem.html` rebuilt. itch.io zip. Auto-recorded gameplay GIF. CHANGELOG_NIGHT.md in plain English. Director plays the link at 9:00.

## Worker rules
- Branch `claude/<task-id>-<slug>` from latest main. Rebase before PR.
- `npm run build` and `npm run probe` green before PR. Zero `_amErr`.
- Report in plain English with flavor, per CLAUDE.md. Screenshots in `shots/` for anything visual.
- Never touch persistent save keys. New persistence = new additive key.
- Stay in your lane: don't refactor files outside your task. Conflicts cost the night.
