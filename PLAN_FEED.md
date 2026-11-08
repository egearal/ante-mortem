# ANTE MORTEM — THE SECOND NIGHT (wave J): THE FEED, THE ASCENT v3, THE LESSON

How to start on the laptop, in Claude Code desktop with the `ante-mortem` folder open:
> Read PLAN_FEED.md and notes/briefs/J1.md, J2.md, J3.md. Do J1 first on branch claude/j1-the-feed and merge it. Then run J2 and J3 in parallel as subagents in their own worktrees, merge them, then do J4.


## Context
The director played the night build and said:
- The 7.77 Ascent isn't good: 7.77 is almost never reached (4% of rides) and the lower tiers pay only coins.
- The SPACE/RAGE bar at the bottom is a small counter you have to "keep up" (hold ≥90% for 7-12s or lose half your XP and every floor coin). It feels bad.
- Wanted instead, in their words: when the XP bar is full you FEED it or lose 25% of the XP; the longer you keep feeding, the better the odds; at max, common and rare are impossible, only "higher stat things".
- Weapons should come sooner. (Confirmed: new weapons sooner, not the purple wheel case.)
- A tutorial section.
Confirmed choices: starve = lose 25% XP and keep playing (no coin sweep). The Ascent climbs on its own, SPACE cashes. Ascent rewards change at every tier.

Where the work runs: on the director's laptop in Claude Code desktop, on their subscription. The cloud session that wrote this only committed the plan and the briefs (`notes/briefs/J1-J3.md`); no game code was changed by it.

## What exists today (facts from the code)
- Level-up is a slot machine, not a card pick. `openNextSlot` (`src/slot.js:82`), reels drawn by `weightedByRarity(pool, wOver)` (`slot.js:46`), weights `CFG.weights {common:48, uncommon:27, rare:15, epic:9, legendary:1}` (`core.js:14`), red table `RED_W` via `slotHot()` (`slot.js:185`). Weapon turn: `slotIndex % 4 === 0` (`slot.js:98`).
- RAGE: `startOvercharge/cashRage/rageAscend/rageDrop/ovRevert` (`src/ascent.js:5-53`). Tick + drain + hold/drop logic `core.js:631-644`. XP diverted into the bar while raging `core.js:1197-1201`; coins feed `+2.5*ovFeed` (`core.js:926`). Damage taken ×1.5 at ≥90 (`core.js:431`). Gauge drawn `core.js:2030-2089` (14px tall, ≤340 wide, `xy=VH-46`, frame `a2GaugeFrame`, phone fallback via `_b4HpRect`). SPACE → `cashRage` (`ui.js:491`). First-night lesson text + forgiveness (`ranks.js:724-729`). HOW TO PLAY row (`ui.js:19`). Banker soul wraps `cashRage` and counts ≥90 cashes as `SEATS.st.rage` (`ui.js:926-927, 2491-2494, 2553`). `ovFeed` sources: Bar Stoker (`passives.js:37`), rank 80 (`ranks.js:629`).
- Ascent: token every 56-80s (`ascent.js:438`), `openCrash` (`:57`), crash point `CP_ANCH` 75/40/15/4% (`:104`), `launchCrash` (`:111`), each SPACE = `pushCrash` (`:195`), ENTER = `cashCrash` (`:406`): tiers I-III pay `80*mult` coins, 7.77 → `jackpotOffer` (`:347`) = pick 1 of 3 Ascension passives via `#jkWrap` cards, keys 1/2/3. `closeCrash` (`:433`) uses `xpNext*1.18` (inconsistent with `gainXP`'s `20+7L+1.3L²` at `core.js:1215`). Ladder/stake text `:72-97`. SPACE/ENTER wiring `ui.js:513-514`; touch CASH button `ui.js:1435`.
- Early timeline: first wheel case 0:40 (`wheelTokT=40`, `core.js:3412`), first Ascent token 0:50, first slot ~0:20 on night one, weapons only at the 4th slot (3-5 min).
- Onboarding: no tutorial mode. First 3 nights are gentler (`FN`, `fnStart/fnTick`, `ranks.js:683-741`), tips via `coachMark(id,txt)` (`ui.js:1036`), HOW TO PLAY panel. Menu buttons injected by JS: Daily plaque pattern `dlyPlaque/dlyPlace/dlyPlay` (`daily.js:227-254`), door `e2Door` (`ui.js:2672`). `quitToMenu()` (`ui.js:109`) returns to menu. `startGame` (`core.js:3412..3457`) calls `fnStart()`; `LT.runs++` happens there. Marks: `awardMarks` (`ranks.js:659`), stats `bump` (`ranks.js:316`).
- Probe bot (`probes/lib.js:102-116`): in `playing` it calls `cashRage()` the instant `P.ovT>0`; in `crash` it mashes SPACE every 4 frames (would cash at ~1.0× under auto-climb); card picks handled when `crash.jk`. Stall detector trips after ~20 virtual seconds without `gt` moving.
- Persistence keys that must never change are listed in GAME_DESIGN.md. New key allowed for the lesson: `am_lesson_v1`.

## Design

### J1 — THE FEED (replaces RAGE) + weapons sooner
When the XP bar fills (HP ≥20%, as today) the bar becomes THE FEED instead of RAGE. Same variables (`P.ovT` 0-100, `P.ovAge`) so every hook keeps working, plus `P.ovCharge` (seconds fed) and `P.ovTier` 0-3.
- Buff while feeding: ×1.5 damage and fire rate (keep). **Remove** the ×1.5 damage-taken penalty (`core.js:431`).
- Drain: `ovT -= dt*(5 + ovAge*0.5)` (unfed it starves in ~11s). Feeding: XP gems `+n*0.8*ovFeed` (was 0.5), coins `+2.5*ovFeed` (unchanged). Cap 100.
- Charge: `ovCharge += dt*(ovT>=50 ? 1 : 0.5)` — a fat bar charges at full speed. Tiers by charge: **I at 3s, II at 7s, III (FEAST) at 12s**. Tier-up: `SFX.rarSting(tier)`, `flash` in the tier color, `announce('◆◆ THE REELS RUN HOT ◆◆')` style lines (I: WARM ◆, II: HOT ◆◆, III: FEAST ★), small `shake`.
- Reel weights by tier, `FEED_W` in slot.js:
  - 0: `CFG.weights` (48/27/15/9/1)
  - I: `{common:24, uncommon:30, rare:25, epic:17, legendary:4}`
  - II: `{common:0, uncommon:22, rare:38, epic:30, legendary:10}`
  - III: `{common:0, uncommon:0, rare:0, epic:80, legendary:20}` — the director's "cannot get common or rare".
  Implement as `slotWeights()` replacing `slotHot()` at both call sites (`slot.js:200, 212`): feed tier ≥1 wins, else `RED_W` if `P.hotSlots>0`, else null. The tier is parked in `slotFeedTier` by the cash and consumed by the next `spinReels`; the paytable (`#payTable`) re-renders hot for the tier like the red table does.
- SPACE = `cashRage()` (keep the name; add alias `cashFeed`). Any tier, any time, no penalty: revert buff, set `slotFeedTier=P.ovTier`, `P._ovPass=true; gainXP(0)` as today. Drop the old ≥90/8s bonus-level logic and the coin-loss branch.
- Starve (`ovT<=0`): `ovRevert()`, `P.xp=Math.floor(P.xpNext*0.75)` (so the bar reads 75%), `ovCharge=0`, announce `'☠ THE BAR STARVES — A QUARTER OF YOUR XP IS GONE ☠'`, `SFX.bust`, red flash. No coin sweep. Refill → FEED starts again at tier 0. `rageDrop` becomes this; `rageAscend`, `ascPend`, `ascTime`, `spawnAscentGate`'s blessed path are deleted (Ascent entry is tokens + wheel only; token pity window 56-80s → **45-65s**).
- Gauge (`core.js:2030-2089`): during the feed it grows to 20px tall and `min(440, VW*0.56)` wide; four jewel sockets on the top edge (◆ ◆ ◆ ★) light with `RARC` colors (uncommon green, rare blue, epic violet, legendary gold) as tiers land; label `'✦ THE FEED · HOT ◆◆ · 4.2s TO FEAST · SPACE CASHES'`; hint line `'SOULS & COINS FEED IT · STARVE = −25% XP'`. Fill gradient shifts by tier. Phone: same jewels, existing `_b4HpRect` fallback keeps it above the HP bar. The 6px DOM `#xpbar` gets `body.feed-1/2/3` tint classes.
- Text sweep: `startOvercharge` announces (`ascent.js:11`), HOW TO PLAY row (`ui.js:19`), first-night coach `fn_space` → `'THE BAR EATS SOULS & COINS — the longer it feeds, the richer the reels · SPACE cashes any time'`; forgiveness: on night one, if the first feed falls under 30 the House cashes it once (`ranks.js:727`). Bar Stoker/rank-80 descriptions say "feed" not "rage". Banker soul: "double interest" now triggers on a cash at tier ≥II; `SEATS.st.rage` counts tier ≥II cashes (key name unchanged). Streak hint `/3` → `/4` (`core.js:2120`).
- Weapons sooner: `slot.js:98` → `weaponTurn = slotForceWeapon || slotIndex===2 || (slotIndex>2 && (slotIndex-2)%3===0)` (slots 2, 5, 8, …; slot 1 stays a skill so the first-night hook is unchanged).
- Probe bot (`probes/lib.js:106`): hold the feed until `P.ovTier>=1 || P.ovT<35`, then `cashRage()`. Add `--feed-tier N` env/flag to force holding to tier N for balance probes.
- GAME_DESIGN.md: replace the RAGE section with THE FEED (tiers, weights, starve law), mark the old text legacy; note weapon cadence. CLAUDE.md: nothing unless a script is added.

### J2 — THE ASCENT v3 (auto-climb, real prizes)
- `launchCrash` on SPACE as today. In `tickCrash`: `crash.mult += dt*(0.06 + 0.16*crash.mult)` (1.77 at ~2.8s, 2.77 at ~5.2s, 3.69 at ~6.8s, 7.77 at ~11s). Climb sound pitch follows mult. `pushCrash` retired (wrapper list `ascent.js:436` updated), frenzy bulbs removed.
- SPACE **and** ENTER = `cashCrash` while live (`ui.js:513-514`); touch CASH button label stays, BET coin also cashes. Pad relabel unaffected.
- Crash point: `CP_ANCH` → `[[1.01,1],[1.77,0.82],[2.77,0.58],[3.69,0.35],[7.77,0.12],[40,0.001]]`. FIRST RUNG seal head start unchanged. Lesson rig hook: `crash.rigCp` overrides the roll when set.
- Prizes (`cashCrash`):
  - <1.77: nothing (text as today).
  - I ≥1.77: **+1 LEVEL** (queue a slot with `slotFeedTier=1`) + `40*mult` coins.
  - II ≥2.77: **+1 LEVEL at HOT odds** (`slotFeedTier=2`) + heal 25%.
  - III ≥3.69: **THE ARMORY** — pick 1 of 3 cards drawn from epic+legendary weapons and skills (new at Lv1 or +1 level), via the generalized card offer (below) + `60*mult` coins.
  - ☆ 7.77: Ascension pick (existing) **plus 2 levels at FEAST odds** (`slotFeedTier=3`, `pending.push({},{})`).
  - Crash = THE FALL unchanged (one curse 5-15s).
- Generalize `jackpotOffer` into `cardOffer({title, pool, color, onPick})`; the 7.77 path passes the Ascension pool (mint), tier III the armory pool (violet `#c98bff`). Card markup/keys/bot handling (`crash.jk`) reused.
- Ladder (`ascent.js:72-97`): rung labels become prize names: `I 1.77× · +1 LEVEL`, `II 2.77× · HOT LEVEL`, `III 3.69× · THE ARMORY`, `☆ 7.77× · ASCENSION`. `crashMsg` while live: `'IT CLIMBS ON ITS OWN · SPACE CASHES · CRASH = THE FALL'`.
- `closeCrash` level loop uses the same formula as `gainXP` (`20+7L+1.3L²`).
- Probe bot: in `crash`, if `!crash.live && !crash.done` press SPACE once (launch); if live, press SPACE only when `crash.mult>=2.9` (so most bot rides land tier II or crash); card picks as today.
- GAME_DESIGN.md: new Ascent section; old marked legacy. Coach text "stakes your LEVEL" → `'the GREEN GATE — it climbs alone · SPACE cashes · higher is richer'` (`ascent.js:43, 445`).

### J3 — THE LESSON (tutorial)
- New script `src/lesson.js`, loaded **after** `daily.js` (index.html tag + `scripts-check.js` if it counts files; CLAUDE.md rule 4 → "15 plain scripts, `lesson.js` last"). New key `am_lesson_v1` = `{done:0|1, n:plays}`; add to the GAME_DESIGN persistence list.
- Menu: `✒ THE LESSON` button inserted in `#menuRow2` from a `renderChips` wrapper (copy `e2Door`, `ui.js:2672`). For saves with `LT.runs===0` and lesson not done, a chip under PLAY TONIGHT: `'✦ NEW HERE? TAKE THE LESSON · 2 MINUTES ✦'` (copy `dlyPlaque` placement, `daily.js:227-254`). Hotkey `t` in the menu.
- Flow: `lessonPlay()` sets `LESSON.on=true` and calls `startGame()`. One hook line in `startGame` after `fnStart()`: `if(typeof lessonBegin==='function') lessonBegin();`. `lessonBegin`: undo `LT.runs++` (restore the pre-value so a gentle night isn't consumed), `P._fn=false`, `window._fmods.horde=0.35`, `noRanged`, huge timers for tarot/bounty/dare/offerings/vault (`tarotT=bountyT=dareT=interT=9e9`), no bosses (`waveN` cap or guard in `spawnBoss`), `P.inv` refreshed every frame (hits still flash, you cannot die), `P.xpNext=12`. `bump/awardMarks/recCheck/secret/achievements` early-return while `LESSON.on` (one guard each at the top of `bump` and `awardMarks`; death can't happen).
- Steps, each shown in a new `#lessonBar` DOM banner at the top (step n/6, big display serif, gold rule) with the matching `coachMark` text on screen; a step completes on its condition, chime `SFX.levelDing`, next step after 900ms:
  1. **WALK** — "WASD / DRAG to walk · reach the gold ring" (ring 300px away, done on reach).
  2. **HUNT** — "your bolt aims itself · kill 8" (gentle crawlers only; done at 8 kills).
  3. **FEED** — bar fills → "THE BAR EATS · keep killing · watch the jewels light · cash with SPACE at ◆◆ or risk the FEAST" (done when cashed; if it starves, banner explains −25% XP and XP refills fast).
  4. **REELS** — slot opens → "SPACE stops each reel · TAKE, or hold SPACE to ROLL the dice" (done when the slot closes).
  5. **THE WHEEL** — `wheelTokT=0`, `P.coins=20` → "the purple case · SPACE snaps the chains, SPACE spins, SPACE brakes" (done on `finishWheel`).
  6. **THE ASCENT** — `crashTokT=0`, `crash.rigCp=4.2` → "the green gate climbs alone · SPACE cashes · the higher, the richer · crash = a curse" (done on `closeCrash`).
  Finish: `'♠ THE HOUSE IS OPEN — PLAY TONIGHT ♠'`, `domConfetti`, `SFX.seraph`, save `am_lesson_v1.done=1`, `quitToMenu()` after 2.5s. ESC pauses with the quit pill relabeled `LEAVE THE LESSON`. Touch: `tcSync` labels already follow state.
- Probe `probes/lesson.js`: runs the lesson to completion on desktop and 390×844 with the bot (bot needs: in lesson, hold the feed to tier ≥1 — J1's rule covers it; crash rule from J2 covers step 6), asserts completion < 150 game-seconds, no stall, key saved, no `_amErr`; screenshots to `shots/lesson/`.

### J4 — integrate, document, ship (orchestrator on the laptop)
Merge order J1 → J2 → J3 (J1 and J2 both touch `ascent.js`: J1 owns lines 1-53, J2 owns the crash game; keep diff3 + `both.py` habit). Rebuild, gates, `shots/feed/` after-set, `CHANGELOG_NIGHT.md` plain-English entry "THE SECOND NIGHT", README controls (SPACE cashes the Ascent), commit `dist/`, push main.

## How to run it on the laptop
In Claude Code desktop, project folder `ante-mortem`, say: "Read PLAN_FEED.md and notes/briefs/J1.md..J3.md. Do J1 first on branch claude/j1-the-feed. Then run J2 and J3 in parallel as subagents in their own worktrees. Then J4." Each worker follows CLAUDE.md workflow (build, probe, commit, report in `notes/Jn.md`), does not commit `dist/`, never changes save keys.

## Verification (gates, all must be green before `dist/` is committed)
```bash
npm run build
npm run probe -- --nights 3
npm run probe -- --mobile --nights 1
node probes/daily-check.js
node probes/pairing.js
node probes/lesson.js
npm run shots -- feed
```
Plus hand checks on the laptop: hold the feed to FEAST once and see only violet/gold symbols on the reels; starve once and see the bar drop to 75%; ride the Ascent to 7.77 with `crash.rigCp=8` in the console and get the Ascension pick plus two FEAST slots; first new weapon by the second level-up; the lesson completes with keyboard and on a phone-sized window.

## Files
- J1: `src/ascent.js` (1-53), `src/core.js` (431, 631-644, 926, 1197-1201, 2030-2089, 3412), `src/slot.js` (45-55, 98, 185-213, paytable), `src/ranks.js` (629, 724-729), `src/ui.js` (19, 491, 926-927, 2491-2553), `src/passives.js:37`, `styles.css` (feed tints), `probes/lib.js:106`, `GAME_DESIGN.md`.
- J2: `src/ascent.js` (57-130, 195-240, 347-437, 438-457), `src/ui.js:513-514, 1435`, `styles.css` (ladder/armory colors), `probes/lib.js:115-116`, `GAME_DESIGN.md`.
- J3: new `src/lesson.js`, `index.html` (script tag, menu), `scripts-check.js`, `src/core.js` (one hook line in `startGame`, `spawnBoss` guard), `src/ranks.js` (`bump`/`awardMarks` guards), `src/ui.js` (quit pill label), `styles.css` (`#lessonBar`), new `probes/lesson.js`, `CLAUDE.md`, `GAME_DESIGN.md`, `README.md`.
