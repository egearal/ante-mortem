# THE SECOND NIGHT — THE FEED, THE ASCENT v3, THE LESSON (2026-11-09)

The director said the RAGE bar felt like a chore, the 7.77 Ascent almost never paid, weapons came too late, and there was no tutorial. All four are fixed, and the game now runs smoothly in big fights. Full write-ups: `notes/J0.md`, `notes/J1.md`, `notes/J2.md`, `notes/J3.md`.

- **THE SMOOTH TABLE (J0): the frame rate.** Before, in a big fight one second of game took several real seconds. Two things caused it:
  - The screen was painted about 26 times per frame. It is now painted about 14 times (12 on the low tier) and looks the same.
  - Slow frames used to turn into slow motion. Now game time keeps pace with real time down to 10 frames per second.
  - When a machine struggles, the resolution drops to 1.5× before it drops to 1×, and climbs back the same way.
  - Light shafts and candle pools stay on every machine, phones included.
  - Full write-up: `notes/J0.md`.
- **THE FEED replaces RAGE (J1).** A full XP bar now gets hungry instead of punishing you.
  - Keep killing to feed it. Jewels light at 3s (WARM ◆), 7s (HOT ◆◆) and 12s (FEAST ★).
  - SPACE cashes any time, and the next slot's reels run at that tier's odds. At the FEAST only epic and legendary can land, and the machine glows gold.
  - Let it starve and you lose a quarter of your XP. That's the only penalty: no more coin sweep, no extra damage taken.
- **Weapons sooner (J1):** your 2nd level-up is a new weapon, then every 3rd.
- **THE ASCENT v3 (J2):** the multiplier climbs on its own and SPACE cashes. Every rung pays:
  - I: a level.
  - II: a HOT level plus 25% blood.
  - III: THE ARMORY, a pick of 3 epic/legendary weapons and skills.
  - ☆ 7.77: an Ascension plus two FEAST slots.
  - Reaching each rung is far likelier than before: 82/58/35/12% (was 75/40/15/4).
- **THE LESSON (J3):** a two-minute interactive tutorial. Start it from the menu's ✒ THE LESSON button, the "NEW HERE?" chip a first-timer sees under PLAY TONIGHT, or T.
  - Six steps, each with its own gilt banner and live status: walk, hunt, feed the bar, pull the reels, spin the wheel, ride the Ascent.
  - You can't die, and it leaves no trace on your save (no runs, marks or records). It ends with a LESSON LEARNED fanfare.
  - The bot finishes it in about 40 game-seconds on desktop and phone.
- **Little things:**
  - Vesper wears the feed as a colored halo, with an alarm when it's about to starve.
  - Two new secrets: THE GLUTTON and THE ARMORER.
  - Tier banners come in their jewel colors.
  - Night one's 0:00 trophy toasts now wait their turn.
  - v5.0 stamps, and the offline install updates itself and stores every script.
- **Balance (bot, 16 nights each):** median survival went from 3:50 to ~5:40, with more levels. The Ascent now pays real power. If it should bite harder, the first knob is the tier II heal.

# THE LONG NIGHT — what changed on 2026-11-04

Play it: **https://egearal.github.io/ante-mortem/** (phone: Add to Home Screen to install).
Each feature was built by its own Claude session, tested by the autoplay bot on desktop and phone, and merged
into `main` only after it passed. Each session's full write-up is in `notes/<id>.md`.

## How it looks and sounds
- **Gilt Noir world (A1, E1):** velvet-dark floor under real candlelight. Vesper is bigger, with a coat, a hat, ember eyes and a run cycle.
  - Every enemy type has its own animated silhouette, outline and glowing eyes, and dies in its own way.
  - Every weapon has its own visual effect. Hits flash white, and elite kills freeze the screen for an instant.
- **The machine and the hall (A2):** the slot is a brass machine with a lever, clunking reels, near-miss crawls and triple fanfares.
  - The HUD is engraved plaques.
  - The death ledger fits the screen, the menu isn't clipped, and notices never overlap.
- **The sound of the House (E3):** one mixer for every sound.
  - A recurring House motif plays on jackpots, level-ups, rank-ups and the House's arrival.
  - Each floor has its own ambience, a limiter means nothing clips, and storms of kills no longer turn to noise.

## New ways to play
- **First night (A3):** brand-new players reach their first slot in about 20 seconds instead of 70, and get three short tips. Veterans are unchanged.
- **Share your night (A3):** copies a brag line and saves a gilt card image from the death screen.
- **Phones (A4):** thumb stick, gold BET coin and phone layouts, plus installing as an app that plays offline.
- **Controller + settings (B3):** full gamepad and Steam Deck support, volume sliders, key rebinding, reduce-flashing and rumble.
  - It also has music slots: drop your tracks into `assets/music/` (see the README there).
- **Daily Debt (B1):** one seeded night per day, identical for everyone, with streaks and a daily share card.
- **Stakes + Endless (B2):** beat the House to unlock 5 harder decks, then PRESS ON past 13:00 for a climbing score.
- **The Pairings (C1):** max a weapon while holding its paired skill and it evolves, with a huge ceremony. There are 10 secret recipes.
- **The High Rollers (C2):** three gambling bosses.
  - The Croupier deals hazard cards and forces coin flips.
  - The Bookie makes you stand in odds markers to bet.
  - The Twins of Fortune switch which one can be hurt with each roulette spin.
  - There are also two new elite affixes.
- **The Seats (D1):** four new souls with painted portraits.
  - The Cardsharp sees the slot result before pulling.
  - The Martyr never heals but grows stronger as she bleeds.
  - The Magpie's golden chips spin a mini slot.
  - The Banker's Ghost earns interest on held coins.
- **The Ballroom (D3):** a fourth floor with waltz currents, falling chandeliers and mirror enemies.
- **The Major Arcana (D4):** 12 rare tarot cards that bend the whole night.
- **The Book of Debts (E2):** one screen mapping every unlock, with your three nearest goals pinned and the nearest shown on the death screen.

## After midnight
- **Twenty Pairings (H3):** ten more evolution recipes, among them the Chain Gang, the Carpet Bomb, the Craps Table, the Loan Shark, the Ouroboros, the Champagne Tower and the Black Death.
- **Fresh eyes (H2):** a stranger's first minutes were cleaned up.
  - Side-bet banners wait until after the first slot.
  - The first rage bar says "press SPACE".
  - Night one shows no "#1 ALL-TIME" badge spam.
  - The menu no longer shows a frozen battlefield behind it, and its chips use plain words.
  - Daily Debt warns newcomers that it skips the gentle first night.
  - The day streak no longer goes up on every reload (bug fix).
- **Polish (G1):** the death ledger fits a 720p laptop with every button visible, and the phone title doesn't wrap. Per-arena balance was measured and is in range.
- **How to Play + codex (F1):** five new pages explain tonight's systems, and holding TAB shows every pairing recipe and whether it's ready.
- **Launch kit (H1):** `launch/` holds store covers and capsules for itch.io and Steam, a 1080p hero image, 8 screenshots, a looping gameplay GIF and WebM, and a social preview image (wired into the page).
  - It also has itch.io and Steam store copy in `launch/STORE_PAGE.md`, and an upload-ready itch.io zip.

- **Last cleanup (I1):** phone banners, tarot cards and curse tags no longer overlap at the top of the screen. The phone ledger leaves room under the Again coin, and the stale Cloakroom line is gone.
  - Store art was re-rendered without leftover HUD text.
  - The wave line now reads "SLAY N" instead of "N TO THIN".

## Fixed
- **A rare crash:** when several enemies died in the same instant, the game could stop. GitHub's test run caught it, and it's fixed.
- **A real softlock (B4):** the 7.77× Ascent jackpot card pick only took the 1/2/3 keys, so controller and Steam Deck players were stuck forever. It now works with arrows, the d-pad, SPACE and Ⓐ.
- **Smaller fixes (B4):** a clipped COMBO label, a doubled streak message, OPTIONS clipping on short screens, and more. The full list is in `notes/B4.md`.

## Tools for whoever works on it next
- `npm run probe`: an autoplay bot that plays full nights in seconds and fails on any error or frozen clock.
- `npm run shots`: screenshot sets.
- Feature-specific probes: `probes/daily-check.js` (determinism), `pad.js`, `phone.js`, `fuzz.js`, `pairing.js`, `arcana.js`, `c2-bosses.js`, `e2book.js`, `npm run audio`.
