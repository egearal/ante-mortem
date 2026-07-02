# ANTE MORTEM — Game Design Document
(The institutional memory. Read before modifying any system.)

## Core loop
Top-down survivor: WASD/touch move, auto-fire at nearest, waves escalate, 4 bosses. Camera-culled gothic casino arena (candles, sconces, light shafts, ghost patrons). Near-death slow-mo. Crash-proofed frame loop.

## Currencies
- **⚜ XP** — level charge. Fills the bar → level-up → THE SLOT. Run-only.
- **◈ COINS** — run gold. Feeds RAGE, cashes from streaks (SPACE at ×27+), wheel prizes. Run-only.
- **GILT** — eternal. From boss bounties, wheel, daily blessing, Index milestones, score at death (score/40). Spent on VAULT seals/contracts and death-bribes. Persists via storage.
- **MARKS** — eternal rank XP (see HOUSE RANKS).

## Rarity taxonomy
common (65%) / rare (20%) / epic = shown as "ULTRA RARE" (10%) / legendary / **mythic** (5%, wheel-only) / **ascend** (Ascent-only). Internal `rar` field. Mythic & ascend are auto-excluded from the slot pool (order-map trick) and from wheel skill rolls except as designed.
Rarity colors: common #cfc2a6, rare #6fb7ff, epic #c98bff, legendary #ffd36b, mythic #fff2c0, ascend #8bffd0.

## THE SLOT (level-up)
Reels spin on level-up; pairs +1 / triples +2 base levels. Dice ladder: roll threshold 7 (LAST RITES −1, LOADED DICE seal −1, CROOKED DICE curse +1); up to 4 wins = GOD LEVEL; PERFECT 12 +1. BANK n/7 → HOUSE VOUCHER (+1 base next slot). LAST RITES at ≤40% HP: blood-cost gambling. Offer cards show: "TAKE Lv X — effect" vs "Roll N+ → Lv Y — effect" vs miss = curse (uses projFx, which falls back to def.d(l)).
Caps: WEAPON_CAP=5 owned weapons, SKILL_CAP=7 distinct passives.

## RAGE (Overcharge)
XP-full → bar 100, +50% dmg & fire rate; at ≥90% also +50% damage TAKEN. Drains at accelerating rate; coins feed +2.5×ovFeed; XP gains feed the bar during rage. SPACE = cash rage into the level. **Hold ≥90% for ascTime (5s, +2.5 per success, cap 10) → THE ASCENT manifests in 10s** → blessed gate token spawns 260-480px away (30s life, white embers, gold guide-arrow). Slipping below 90: all ground coins swept + XP halved.

## ▲ THE ASCENT (crash game)
Entry: green token (48-82s spawns) or rage-earned gate. **FREE to ride — no stake.**
SPACE = launch, then each SPACE = one push: mult += (0.01+rnd*0.19)*(1+m*0.08). ENTER = cash.
Crash point: anchor-table inverse sampler pinned to reach odds — P(cp≥1.77)=75%, P(≥2.77)=40%, P(≥3.69)=15%, P(≥7.77)=4% (geometric interpolation between anchors, min 1.01, cap 40; no instant-bust tier). Retuned 2026-07 per director.
**Prize tiers (cash-out): <1.77× = NOTHING · Tier I ≥1.77× · Tier II ≥2.77× · Tier III ≥3.69× · ☆ JACKPOT ≥7.77×.** (Retuned 2026-07 from 1.5/2.5/5/10 — old gates were too hard to reach.)
- Tiers I-III grant one pre-rolled un-owned ASCENSION passive (shown in lobby chips + live line with fx labels).
- JACKPOT: pick 1 of 3 rarity-weighted weapons (cards, click or keys 1/2/3; new or +1 level; availableWeapons()/weightedByRarity()).
**Crash = THE FALL:** ONE random curse from DEBUFF_POOL, random duration 5-15s + ceremony naming the drawn curse (retuned 2026-07 from a fixed 30s composite). Rank XI / WARDING SALT seal shorten all curses. Prize wins slam center-screen IN the crash layer (#ascWin — announce() alone renders under it).
Vibe stack: accelerating starfield, rising ember orbs, aurora ≥2.5×, altitude zone texts, band colors (cream→green 1.5→cyan 2→violet 3→whitegold 5), milestone slams (CR_MS), ghost afterimages, tier ladder (1.5/2.5/5/☆10), frenzy combo (4+ fast presses), band-change chords, twin shockwaves ≥3×, saturation ramp, harp-gliss cash, gift-card slam, tumbling rocket + screen rip on death. All entry fns wrapped in try/catch logging [ANTE ASCENT].

## ☸ THE WHEEL
Violet token. Wind-back → spin (bulb chase, pointer kicks) → spring-settle to segment center → wedge flash + confetti. 12 segs: 60 COINS / CURSE / HEAL 33% / DOUBLE / 90 COINS / GILT+35 / **⚔ ARSENAL** (free weapon slot: slotForceWeapon flag + pending level, opens after close) / +1 LEVEL / FEVER / DOUBLE / **✦ SKILL** (rarity roll ×mult·1.6 — the ONLY mythic source, needs ×4 chain) / **▲ ASCENT** (free ride after close). DOUBLE: instant +15×mult coins, ×2 all prizes, slam, auto respin; ×4 cap = MAX FORTUNE 60×mult. NOTHING was removed 2026-07 (rewards felt weak); CURSE remains the only dud.
Design v2 (2026-07): 400px dial, saturated neon-gothic segment palette, glossy black hub with gold ♠, outer neon ring that follows the live segment's color while spinning, landed prize slams center-screen (#wheelWin) in the segment color. COURTESY SUMMONS seal hastens token spawns.

## ☨ TAROT (24 cards)
Ground cards, weighted flip, fate-arrow when idle. 2 blessed (SUN, WORLD) / 10 good / 10 cursed / 2 damned (DEATH REVERSED, TOWER REVERSED). THE DEVIL sweeps all ground coins. Reveal: top-screen faint card, roman numerals, tier SFX.

## 💀 THE MARKER (death)
First death → LIVE/DIE spin, base odds 30% (+5%/MARKER'S FAVOR seal lvl), cap 75%. SPACE bribes GILT as percentage wagers of the gilt you held at death (g0): tier 1 = 30% of g0 → +5-10% (rolled), tier 2 = 30% more → +5-10%, tier 3 = the rest (~40%) → flat +5%. The sub-line always shows current gilt, cost of the next bribe, and what was just paid. Zero gilt = EMPTY HANDS. Lose = actual death → score, gilt payout, RANK marks, leaderboard. (Percentage bribes 2026-07; before that flat costs.)

## ⚜ HOUSE RANKS (meta)
MARKS = kills + wave·12 + level·10 + giltEarned·2 per run. Curve: step(k)=140·k^1.6 cumulative; Rank 12 ≈ 31k marks.
Rewards: II +25 GILT · III start +15 coins · IV +40 GILT · V +10 start HP · VI +50 GILT · VII start Lv2 · VIII +75 GILT · IX XP+5% · X rage feed +10% · XI curses 25% shorter · XII coins +10%. Death screen shows plaque + animated bar + RANK UP ceremony. Persist key `am_rank_v1`.

## VAULT (overhauled 2026-07 — timed door economy)
No menu button anymore. The door MANIFESTS in-run at gt=300s, 600s, 900s… (every 5 min, 45s window: `vaultWindowOpen()`), with announce + glow; outside the window SPACE says when it returns. **One purchase per visit** (`vaultSpent`, THE DOOR CLOSES, auto-close ~1.3s after buying). Purchases apply mid-run instantly via `applySealDelta`.
- **18 seals** (gilt-priced, ×1.6 curve, some rank/feat-gated): the original stat seals (trimmed: hp +6%, dmg +4%, fire +3%) + wheel token haste (COURTESY SUMMONS), Ascent head-start (FIRST RUNG, +0.12 mult/lvl), tarot redraw luck (MARKED CARDS), bounty pay (HEADHUNTER'S LEDGER), curse duration cut (WARDING SALT ×0.92^lv), fever duration (SLOW BURN +1s/lv — full table in vault.js), starting bolt Lv2 (OLD BONE), slow-mo edge (BORROWED TIME), etc.
- **9 contracts** (feat → forever-perk): 3 original + DEAD HAND (one losing dice roll re-armed as a win, once per run), THE FIX, CINDER (fever nova), PALLBEARER (bosses −10% hp), DIVIDEND (gilded coins drop more), CODICIL (blood rites cost 3% instead of 6%).
Long-run budget audited: full vault ≈ 15-25 runs of gilt income; income buffs (score/40, boss 40, GILT+35) sized against it.

## ★ HOUSE FAVORS (achievement perma-perks, 2026-07)
Ten specific feats seal small PERMANENT bonuses (ACH_PERKS in ranks.js, keyed by achievement id): survive 3 min → +2 speed, first triple jackpot → +2 speed, wave 15 → +5 blood, 1k run kills / 25k lifetime → +2% dmg each, 54 streak → +2% fire, 25 dice wins → +1% crit, 5 perfects → +2% XP, 100 spins / 10 bosses → +2% coins each. Applied instantly at unlock (seraph ceremony) + every startGame via `applyAchPerks()`. Index milestones ride the same table with `g` = one-time gilt paid only at the unlock moment. Total budget ~10% power — keep it there.

## 📖 THE INDEX (lifetime collection, 2026-07)
Menu panel. Everything ever encountered is catalogued forever under NEW key `am_index_v1` (`{w,p,c,t,e,b}` id arrays; secrets counted via SEC): weapons (incl. implicit starting bolt at startGame), passives/ascensions (addPassiveHUD), curses (applyDebuff by label), tarot (revealTarot by name), enemies & bosses (spawnEnemy — CFG.enemy includes the 4 bosses; BOSS_DEFS membership decides the section). Unmet = dark ??? tile; met = glyph in its GLYPH_COL. `idxPct()` on menu line; milestones 25/50/75/100% pay gilt + favors (MARGINALIA at 100%). Hook = `idxSee(cat,id)` — call it from any NEW acquisition path or the thing won't catalogue.

## Persistence
`store` (core.js) prefers the artifact-env `window.storage`; otherwise a localStorage shim with the SAME keys (added 2026-07 — before that, local play silently saved nothing). Keys — never rename: `antemortem_ach_v2` (u/LT/REC/V/S), `antemortem_gilt_v1`, `am_rank_v1`, `antemortem_board_v1`, `antemortem_gfx_v1`, `am_index_v1`.

## Content inventory
- **19 weapons** (bolt, cards, orbit, scythe, spark, chand, knives, aura, nova, seeker + coil lash, mortar blast, lantern turret, fangs swarm, bell knockback-toll, dice ricochet, phantom pierce-wave, coffin rear-nails, moths homing-stream). New-weapon mechanics use: timer blocks in update, helper fire fns, bullet flags (seek, pierce, blast, bounce, spin).
- **~21 slot passives** incl thorns, lifesteal, armor (flat reduction in hurtPlayer), on-kill heal, knockback mult, inv-bonus.
- **19 ascensions** (ASC_POOLS tiers 6/7/6) with fx labels.
- **3 mythics**: PHOENIX MARKER (death-detonate save, outranks Second Chance), THE HOUSE'S CUT, ALL IN.
- **15 curses** in DEBUFF_POOL (schema: {label,dur,dot?,ap:()=>revert}).
- 34 secrets, ~1080 achievements, streak milestones to 500, bounty targets, House Dare, Golden Hour, fever, daily blessing.

## Known quirks (intentional / harmless)
- `grantAscPassive` is dead code (replaced by preroll system). Safe to delete someday.
- "STRENGTH +50%" label exists in two different buff systems — cosmetic overlap.
- Loan/debt system was REMOVED (Ascent is free now); `P.debt` siphon in gainXP is dormant-safe.
- iconSvg falls back to colored glyph span for ids without SVG entries — this is the norm for new items.
- TAB (hold) freezes update and shows the codex; z-index 340.
