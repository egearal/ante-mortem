# ANTE MORTEM — Game Design Document
(The institutional memory. Read before modifying any system.)

## Core loop
Top-down survivor: WASD/touch move, auto-fire at nearest, waves escalate, 4 bosses. Camera-culled gothic casino arena (candles, sconces, light shafts, ghost patrons). Near-death slow-mo. Crash-proofed frame loop.

## Currencies
- **⚜ XP** — level charge. Fills the bar → level-up → THE SLOT. Run-only.
- **◈ COINS** — run gold. Feeds RAGE, cashes from streaks (SPACE at ×27+), wheel prizes. Run-only.
- **GILT** — eternal. From boss bounties, wheel, daily blessing, Index milestones, score at death (score/40). Spent on VAULT seals/contracts and death-bribes. Persists via storage.
- **MARKS** — eternal rank XP (see HOUSE RANKS).

## Rarity taxonomy (THE ODDS, loud since 2026-07)
`rar` field: common / rare / epic (shown "ULTRA RARE") / legendary / **mythic** (wheel-chain only) / **ascend** (Ascent-only until owned). **Reels are weighted by CFG.weights {common:54, rare:28, epic:13, legendary:5}** via weightedByRarity (before 2026-07 the weights were decorative and reels were uniform). A #payTable strip beside the machine shows the odds live and flares the landed row; every offer card slams a #rarBanner (label + RARC color + tiered SFX.rarSting — legendary/ascend pulse and confetti). Unowned ascensions are EXCLUDED from availableSkills (they leaked before); owned ones appear to level up.
RARC colors: common #c9c1b4, rare #6db4ff, epic #c98bff, legendary #f8e2a0, ascend #8bffd0, mythic #fff2c0.

## THE SLOT (level-up) — economy v3 (2026-07, "director found it too easy")
Reels stage **1 / 2 / 3** levels (single / pair / triple — level one is the floor). Dice threshold starts **8** and climbs 9/10/11 per round (RED TABLE −1, LOADED DICE seal −1, hexDice/CROOKED TABLE scar +1); up to 4 wins = GOD LEVEL (~0.5% — a legend); PERFECT 12 +1. BANK n/7 → HOUSE VOUCHER.
**The rung script** (`rungGain` in slot.js): rung 1 win = **+1 level** · rung 2 win = **⬆ THE UPGRADE** (one rarity tier via nextUpgrade, staged levels carry; ascend/mythic → +1 lv 'DEEPENS') · rung 3 win = **+2 levels** · rung 4 = GOD LEVEL. One upgrade per ladder, max.
**The miss script**: round 1 miss = temp curse (ladder continues) · round 2 miss = **SCAR** (continues) · round 3+ miss = LOSE SKILL **+ SCAR**.
**SCARS** (core.js SCARS/applyScar): ~10 run-permanent wounds (−8 max blood, −4 speed, −3% dmg/fire, −6% coins, +3% dmg taken, CROOKED TABLE next-dice +1…), ☒ chips in the relic bar, LT.scars achievements. dmgTakenMult consumed in hurtPlayer.
**Overflow law** (unchanged): clamped levels pay +12 ◈ each inside grantSkill/grantWeaponLevels; every grant announces.
**Card language** (compact by decree): 'LEVEL 3' for new items (never 'Lv 0 → 3'), 'LEVEL 2 → 4' for owned, one stat line, dice promise + miss in ≤3 words, curse label on a tiny sub-line. THE ODDS paytable is big (14px sheen head, 13.5px rows) and flares the landed row; the RED TABLE re-renders it hot.
**Tingle ladder**: every stopped die rings one semitone-ish step higher across the visit (gamble.diceN); a miss drops the scale.
**Skip law**: SPACE during any post-roll ceremony wait (win pause, god grant, curse pause) fast-forwards it (`window._slotFF`).
Caps: WEAPON_CAP=5 owned weapons, SKILL_CAP=7 distinct passives.

## ☨ THE RED TABLE (≤40% blood — replaced LAST RITES 2026-07)
Same red dressing (class 'lastrites', drone, whispers, court), new deal: **no blood costs, no heals** — reels run RICHER (weights 30/40/22/8, hot in THE ODDS), dice soften to 7+, but **ANY miss = instant bust + SCAR** ('THE TABLE TAKES'). BLOOD CODICIL contract = first miss forgiven, once per table. LT.rites/achievements/'edge' secret intact. The `lastRites` flag name survives for CSS/stat continuity; only semantics changed.

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

## ☸ THE WHEEL — THE TICKER, CS2 edition (2026-07)
**CS2 rarities rule the strip** (CS_COL in wheel.js: blue #4b69ff / purple #8847ff / pink #d32ce6 / red #eb4b4b / gold #e4ae39; each card wears a bottom rarity bar): exact 200-card bag = BLUE 140 (60 COINS 46, HEAL 36, FREE SPIN 32, CURSE 26) · PURPLE 40 (90 COINS 12, GILT 10, FEVER 9, DOUBLE 9) · PINK 13 (+1 LEVEL 5, ARSENAL 4, SIDE ARM 4) · RED 5 (SKILL 3, ASCENT 2) · **GOLD 2 — ★ THE HOUSE BLADE**: an unowned MYTHIC passive on the spot + 60 gilt + coin shower + triple gold flash + mega slam. Compressed CS odds (70/20/6.5/2.5/1) per director. Land index 120+rand(40).
**Controls**: SPACE mid-roll = THE BRAKE (`brakeTicker` — jumps to the crawl with a heavy clack); SPACE after landing = instant close (`finishWheel`, idempotent, still fires toAscent/pending). Land ceremonies escalate by cs tier (pink confetti → red double-flash → gold run-changer). Backdrop at .62 alpha — the arena shows through. Legacy notes below still apply (DOUBLE chain, golden spin, THE FIX):

### (previous ticker notes)
Violet token. The round dial is GONE: a horizontal strip of neon prize cards (#tickerBox/#tickerStrip, 110px cards) rolls past a center gold needle with per-card ticks rising in pitch, crawls on the last cards with a heartbeat, lands off-center by a biased jitter and settles back with a bounce (visible near-miss). Winning card pops white-hot (.hit), rest dim (.landed). Frame glows in the passing card's color. Pure translate3d — no canvas.
14 prizes (WSEGS, weight w||5; strip = shuffled weighted bag ×~66 no-adjacent-dupes, land index 60+rand20): 60 COINS / CURSE (only dud) / HEAL 33% / DOUBLE ×2 / 90 COINS / GILT+35 / **⚔ ARSENAL** (slotForceWeapon+pending) / +1 LEVEL / FEVER / DOUBLE / **✦ SKILL** (rollAscentPrize ×mult·1.6, the ONLY mythic source) / **▲ ASCENT** (free ride after close) / **⚔ SIDE ARM** (#2a9db8, w:3 — instant NEW common weapon Lv1, else +1 level to an owned one, else +45 coins) / **↻ FREE SPIN** (#ff5fa2, w:3 — immediate respin, multiplier untouched, handled BEFORE wheel.done).
DOUBLE: instant +15×mult coins, ×2 all prizes (cap ×4 MAX FORTUNE 60×mult), red-hot reroll flash, auto respin via respinTicker(). Golden spin 5% ×2 all. **THE FIX IS IN contract works now**: a CURSE landing slides one card past (`startRoll`). Dev hook: `wheel.rigSeg='NAME'` before launch. COURTESY SUMMONS hastens tokens; token spawn plays a 3-note beckon + rings.

## ☨ TAROT (24 cards)
Ground cards, weighted flip, fate-arrow when idle. 2 blessed (SUN, WORLD) / 10 good / 10 cursed / 2 damned (DEATH REVERSED, TOWER REVERSED). THE DEVIL sweeps all ground coins. Reveal: top-screen faint card, roman numerals, tier SFX.

## 💀 THE FINAL PRESS (death — replaced gilt bribes 2026-07)
First death → **PRESS FOR YOUR LIFE**: odds start **35%** (+3%/MARKER'S FAVOR seal, capped base 44%), a **3.2s window** with a draining red time bar; every SPACE press (non-repeat) buys **+0.5–1.5%** up to the **50% cap**, each press one tingle higher; hitting max slams ◈ MAX ◈ with seraph. Then the 14-step green/red LIVE/DIE flicker (kept verbatim — director loves it) resolves at final odds. **Gilt is never charged at death.** LIVE = 50% hp revive + knockback nova. DIE → THE RECKONING. markerRef={p,base,max,presses,window,t0,phase}. LT.markers/markerWins + DEATH'S DEBTOR intact.

## ⚰ THE RECKONING (death screen, 2026-07)
Run tracks `P.dmgDealt` (all damage sites instrumented via trackDmg) and `P.bestStreak`. Death slams stat rows in at ~170ms intervals with rising dings (SLAIN / DAMAGE / BEST STREAK / LEVEL / TIME in #goStats), then score+gilt count up. **Skip law**: first SPACE completes the recap instantly (500ms dead-zone after death so FINAL PRESS mashing can't skip), second SPACE = Wager Again. Target: new run inside ~5s.

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

## Graphics & performance (presets 2026-07)
gfxPanel opens with a one-click preset row — **🍞 TOASTER / LOW / MEDIUM / HIGH** (GFX_PRESETS in ui.js) setting q/lite/shafts/ghosts/grade/shake/flash/pcap; any manual sub-change → CUSTOM (derived by exact table match; MEDIUM = classic defaults so legacy saves label right; fps stays personal). `GFX.lite` is the toaster master gate.
Renderer economics (perf round 4): full-screen vignette/danger/heartbeat/grade/shafts are PREBAKED half-res canvases (`bakeVign`, rebuilt on resize/danger-bucket change) drawn with live globalAlpha; glass pools + beams cache per-pool gradients (`gp._pg/_bg`); pillars/chandeliers/braziers/sigil/gargoyles/auras/court cache theirs; coins/orbs glow via cached glowSprite (no shadowBlur); knife/seeker bullets share one gradient per size (`bulletGrad`); homing shots re-target every 0.2s (`b._tg`); damage text batches ctx.font. Measured: ~24 → ~6 gradient allocations/frame at a 124-enemy horde. At lite additionally: no grain/embers/fog/pools/beams/audience/trail, decals ≤8, texts ≤24, LOD full-art 60→24, enemy separation off. Loop dt clamped [0, 0.05].

## The menu (v2, 2026-07)
Gold-sheen gradient title (keep the h1 NODE — 'namehouse' secret binds to it), cosmic dust + occasional shooting star (menuStar), stat CHIPS row (#chipRow: BEST/GILT/INDEX%/SECRETS/RANK + daily) — RANK now loads at boot. Hero ENTER THE CASINO plaque; secondary row INDEX/FEATS/VAULT/GRAPHICS. **Menu VAULT is browse-only** (`vaultBrowse` flag → renderVault disables buys as 'AT THE DOOR — cost ◈' with the 'MANIFESTS IN THE PIT — EVERY 5:00' banner); buying stays at the in-run door. Button hover is transform-only (the old letter-spacing hover reflowed neighbors — the "menu jitter" bug).

## Persistence
`store` (core.js) prefers the artifact-env `window.storage`; otherwise a localStorage shim with the SAME keys (added 2026-07 — before that, local play silently saved nothing). Keys — never rename: `antemortem_ach_v2` (u/LT/REC/V/S), `antemortem_gilt_v1`, `am_rank_v1`, `antemortem_board_v1`, `antemortem_gfx_v1`, `am_index_v1`.

## Content inventory
- **19 weapons** (bolt, cards, orbit, scythe, spark, chand, knives, aura, nova, seeker + coil lash, mortar blast, lantern turret, fangs swarm, bell knockback-toll, dice ricochet, phantom pierce-wave, coffin rear-nails, moths homing-stream). New-weapon mechanics use: timer blocks in update, helper fire fns, bullet flags (seek, pierce, blast, bounce, spin).
- **~21 slot passives** incl thorns, lifesteal, armor (flat reduction in hurtPlayer), on-kill heal, knockback mult, inv-bonus.
- **19 ascensions** (ASC_POOLS tiers 6/7/6) with fx labels — **max 5 since 2026-07** (all ap() pure additive/multiplicative, safe to reapply; FANGS ×5 = +76% dmg).
- **3 mythics**: PHOENIX MARKER (death-detonate save, outranks Second Chance), THE HOUSE'S CUT, ALL IN.
- **15 curses** in DEBUFF_POOL (schema: {label,dur,dot?,ap:()=>revert}).
- 34 secrets, ~1080 achievements, streak milestones to 500, bounty targets, House Dare, Golden Hour, fever, daily blessing.

## Known quirks (intentional / harmless)
- `grantAscPassive` is dead code (replaced by preroll system). Safe to delete someday.
- "STRENGTH +50%" label exists in two different buff systems — cosmetic overlap.
- Loan/debt system was REMOVED (Ascent is free now); `P.debt` siphon in gainXP is dormant-safe.
- iconSvg falls back to colored glyph span for ids without SVG entries — this is the norm for new items.
- TAB (hold) freezes update and shows the codex; z-index 340.
