# ANTE MORTEM — Game Design Document
(The institutional memory. Read before modifying any system.)

## Core loop
Top-down survivor: WASD/touch move, auto-fire at nearest, waves escalate, 4 bosses. Camera-culled gothic casino arena (candles, sconces, light shafts, ghost patrons). Near-death slow-mo. Crash-proofed frame loop.

## Currencies
- **⚜ XP** — level charge. Fills the bar → level-up → THE SLOT. Run-only.
- **◈ COINS** — run gold. Feeds RAGE, cashes from streaks (SPACE at ×27+), wheel prizes. Run-only.
- **GILT** — eternal. From boss bounties, wheel, daily blessing, Index milestones, score at death (score/40). Spent on VAULT seals/contracts and death-bribes. Persists via storage.
- **MARKS** — eternal rank XP (see HOUSE RANKS).

## Rarity taxonomy (THE ODDS — numbers hidden since Batch 7)
Weights now **{common:73, rare:17, epic:7, legendary:3}**; the paytable shows PIPS (◆…◆◆◆◆, flames ☨ at the red table), never percentages. Legacy notes:

### (previous odds notes)
`rar` field: common / rare / epic (shown "ULTRA RARE") / legendary / **mythic** (wheel-chain only) / **ascend** (Ascent-only until owned). **Reels are weighted by CFG.weights {common:54, rare:28, epic:13, legendary:5}** via weightedByRarity (before 2026-07 the weights were decorative and reels were uniform). A #payTable strip beside the machine shows the odds live and flares the landed row; every offer card slams a #rarBanner (label + RARC color + tiered SFX.rarSting — legendary/ascend pulse and confetti). Unowned ascensions are EXCLUDED from availableSkills (they leaked before); owned ones appear to level up.
RARC colors: common #c9c1b4, rare #6db4ff, epic #c98bff, legendary #f8e2a0, ascend #8bffd0, mythic #fff2c0.

## THE SLOT — MATCH LAW v3 + THE BLOOD LEVER (Batch 8)
**Single = LEVEL 1 · pair = LEVEL 2 · TRIPLE = INSTANT MAX** (owned: +1/+2/fill-to-max; red table owned +1 keeps). Match coins/softDice are gone. **Fate is dealt at the lever** (`dealFate`/`MFATE {T:0.008,P:0.09}`): 0.8% of spins are born triples, 9% born pairs, the rest born loose — the fated symbol (drawn by the same rarity law) is seeded 3× per strip and the reels NUDGE ≤4 rows at stop time (`stopNextReel`) to land the deal; nudge-aways one row off the pair ARE the near-miss. 4000-spin harness: skills 9.00/0.75, weapons 8.63/0.85, red 9.18/0.73 (pair%/triple%).
**Dice are pure**: every rung win = **+1 level** (PERFECT 12 +1 more), rarity NEVER changes post-pull (nextUpgrade deleted), promises show real numbers via projFx ('LEVEL 2 · +40 Move Speed'), maxed → honest '+12 ◈'. **THE REROLL**: win rung 3 → `R` re-spins the reels ONCE per visit (`rerollReels`/`rerollCarry`) — the abandoned offer + its diced levels are FORFEIT (director's law), consumed vouchers/overcharge refunded, `_forgiven` carries (codicil once per table), ladder resumes at rung 4.
**THE BLOOD LEVER**: ≤40% blood no longer auto-reds — slotStage `'lever'` offers it (terms on card, ball beats red): SPACE pulls (leverWind/Slam, RED_W restrips, dice 7+, LT.rites), X refuses to the common table.
**Presentation**: no rarity words on the card (banner deleted) — the paytable row flares (222px, saturated) and `rarityLandFX` washes the whole arena by tier (body rw-* canvas filters, GFX.lite skips); 'spin for a skill' header deleted.

## (legacy) THE SLOT — the LEVEL-1 LAW (Batch 7)
**A new thing always enters at LEVEL 1.** Matches pay coins instead of levels for unowned items: pair = +20 ◈, triple = +50 ◈ + threshold −1 this visit + jackpot fanfare. Owned items still stage 1/2/3 by match. The `.ofmini` curse-detail line is gone — misses are surprises. All legacy notes below still hold (rung script, scars, red table):

### (economy v3 notes)
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

## ▲ THE ASCENT — ladder truth + JACKPOT v2 (Batch 8)
**Ladder bug fixed** (two real defects, diagnosed live): rungs were checked per-press against the RAW multiplier while the display rounds — at true 2.768 the screen says 2.77× but rung II stayed dark; AND the ☆7.77 rung carried an inline color that beat `.lit` forever. Now `tickCrash` checks **the rounded display value per frame**, rungs clear every ride, gateFx is try/caught, and the star rung lights white-gold.
**JACKPOT v2** (`jackpotOffer` two-phase): 0-1.05s drumroll + #jkMarq J·A·C·K·P·O·T letters slam at 120ms stagger (keys INERT — crash.jk set in phase B); then the marquee lifts (.up) and the armory cards descend over a rotating godray (conic ::before). pickJackpot: rarSting(3)+seraph, gold gatePing, coinRain 40, confetti 50 (GFX.lite halves). Ascent prize sparks route to crashLayer (sparkBurstAt).

## (legacy) THE ASCENT (crash game)
Entry: green token (48-82s spawns) or rage-earned gate. **FREE to ride — no stake.**
SPACE = launch, then each SPACE = one push: mult += (0.01+rnd*0.19)*(1+m*0.08). ENTER = cash.
Crash point: anchor-table inverse sampler pinned to reach odds — P(cp≥1.77)=75%, P(≥2.77)=40%, P(≥3.69)=15%, P(≥7.77)=4% (geometric interpolation between anchors, min 1.01, cap 40; no instant-bust tier). Retuned 2026-07 per director.
**Prize tiers (cash-out): <1.77× = NOTHING · Tier I ≥1.77× · Tier II ≥2.77× · Tier III ≥3.69× · ☆ JACKPOT ≥7.77×.** (Retuned 2026-07 from 1.5/2.5/5/10 — old gates were too hard to reach.)
- Tiers I-III grant one pre-rolled un-owned ASCENSION passive (shown in lobby chips + live line with fx labels).
- JACKPOT: pick 1 of 3 rarity-weighted weapons (cards, click or keys 1/2/3; new or +1 level; availableWeapons()/weightedByRarity()).
**Crash = THE FALL:** ONE random curse from DEBUFF_POOL, random duration 5-15s + ceremony naming the drawn curse (retuned 2026-07 from a fixed 30s composite). Rank XI / WARDING SALT seal shorten all curses. Prize wins slam center-screen IN the crash layer (#ascWin — announce() alone renders under it).
Vibe stack: accelerating starfield, rising ember orbs, aurora ≥2.5×, altitude zone texts, band colors (cream→green 1.5→cyan 2→violet 3→whitegold 5), milestone slams (CR_MS), ghost afterimages, tier ladder (1.5/2.5/5/☆10), frenzy combo (4+ fast presses), band-change chords, twin shockwaves ≥3×, saturation ramp, harp-gliss cash, gift-card slam, tumbling rocket + screen rip on death. All entry fns wrapped in try/catch logging [ANTE ASCENT].

## ☸ THE WHEEL — THE SEALED CASE (Batch 8)
The token is a **gilded reliquary case** (drawWheelTok: lacquer chest, gold studs, violet gem latch, glint sweep). Touching it opens the ticker **sealed** (`wheel.phase='sealed'`, #wheelSeal chains + beating wax): **cost = ceil(25% of run coins)** — SPACE pays (ka-ching, coin deduct, seal cracks), 0 coins = comped. Then SPACE spins — two presses minimum, every one clicks. **FREE SPIN is SPACE-gated** (`phase='freespin'`, no auto-respin; DOUBLE still auto). **Brake parity**: brakeTicker adds flash + sparks + #tickerBox slam. **ASCENT hand-off fixed**: the prize plays a `quick` 1s win slam and finishWheel fires at 1100ms, so the crash lobby never opens over wheel text. Backdrop rgba(4,2,5,.42) + side gradients .55 / 10-90%. ui.js SPACE order: sealed→unseal · roll→brake · freespin→respin · done→finish · else launch.

## (legacy) THE TICKER, CS2 edition (2026-07)
**CS2 rarities rule the strip** (CS_COL in wheel.js: blue #4b69ff / purple #8847ff / pink #d32ce6 / red #eb4b4b / gold #e4ae39; each card wears a bottom rarity bar): exact 200-card bag = BLUE 140 (60 COINS 46, HEAL 36, FREE SPIN 32, CURSE 26) · PURPLE 40 (90 COINS 12, GILT 10, FEVER 9, DOUBLE 9) · PINK 13 (+1 LEVEL 5, ARSENAL 4, SIDE ARM 4) · RED 5 (SKILL 3, ASCENT 2) · **GOLD 2 — ★ THE HOUSE BLADE**: an unowned MYTHIC passive on the spot + 60 gilt + coin shower + triple gold flash + mega slam. Compressed CS odds (70/20/6.5/2.5/1) per director. Land index 120+rand(40).
**Controls**: SPACE mid-roll = THE BRAKE (`brakeTicker` — jumps to the crawl with a heavy clack); SPACE after landing = instant close (`finishWheel`, idempotent, still fires toAscent/pending). Land ceremonies escalate by cs tier (pink confetti → red double-flash → gold run-changer). Backdrop at .62 alpha — the arena shows through. Legacy notes below still apply (DOUBLE chain, golden spin, THE FIX):

### (previous ticker notes)
Violet token. The round dial is GONE: a horizontal strip of neon prize cards (#tickerBox/#tickerStrip, 110px cards) rolls past a center gold needle with per-card ticks rising in pitch, crawls on the last cards with a heartbeat, lands off-center by a biased jitter and settles back with a bounce (visible near-miss). Winning card pops white-hot (.hit), rest dim (.landed). Frame glows in the passing card's color. Pure translate3d — no canvas.
14 prizes (WSEGS, weight w||5; strip = shuffled weighted bag ×~66 no-adjacent-dupes, land index 60+rand20): 60 COINS / CURSE (only dud) / HEAL 33% / DOUBLE ×2 / 90 COINS / GILT+35 / **⚔ ARSENAL** (slotForceWeapon+pending) / +1 LEVEL / FEVER / DOUBLE / **✦ SKILL** (rollAscentPrize ×mult·1.6, the ONLY mythic source) / **▲ ASCENT** (free ride after close) / **⚔ SIDE ARM** (#2a9db8, w:3 — instant NEW common weapon Lv1, else +1 level to an owned one, else +45 coins) / **↻ FREE SPIN** (#ff5fa2, w:3 — immediate respin, multiplier untouched, handled BEFORE wheel.done).
DOUBLE: instant +15×mult coins, ×2 all prizes (cap ×4 MAX FORTUNE 60×mult), red-hot reroll flash, auto respin via respinTicker(). Golden spin 5% ×2 all. **THE FIX IS IN contract works now**: a CURSE landing slides one card past (`startRoll`). Dev hook: `wheel.rigSeg='NAME'` before launch. COURTESY SUMMONS hastens tokens; token spawn plays a 3-note beckon + rings.

## ☨ TAROT (24 cards)
Ground cards, weighted flip, fate-arrow when idle. 2 blessed (SUN, WORLD) / 10 good / 10 cursed / 2 damned (DEATH REVERSED, TOWER REVERSED). THE DEVIL sweeps all ground coins. Reveal: top-screen faint card, roman numerals, tier SFX.

## 💀 THE DEATH ROLL v2 (Batch 8 form)
The tumble AND the verdict read in **3 decimals** ('ROLL 79.745 > 40.423'). Every press **grows the number** (42→64px, fpPop spring), blooms an `.fpWave` shockwave ring, and speeds the 26-bulb chase (`--chase` 1.35s→0.45s by progress). Press sparks are host-aware (sparkBurstAt over #jackpotLayer).

### (Batch 7 notes)
Odds display to **three decimals** (35.000%…50.000%); each press buys **+0.25–0.75%**; MARKER'S FAVOR seals +3% base, rank milestones add press base/cap. The resolve is **THE DEATH ROLL**: a number tumbles 0–100 (green when the flicker would save you, red when not) and lands on the truth — **roll ≤ your % lives** ('ROLL 47.3 ≤ 48.250 — LIVE'). markerRef gains {roll, margin}; margin feeds LUCK. 26 marquee bulbs ring the meter; backdrop is glass (arena visible). Legacy notes:

### (final press v1 notes)
First death → **PRESS FOR YOUR LIFE**: odds start **35%** (+3%/MARKER'S FAVOR seal, capped base 44%), a **3.2s window** with a draining red time bar; every SPACE press (non-repeat) buys **+0.5–1.5%** up to the **50% cap**, each press one tingle higher; hitting max slams ◈ MAX ◈ with seraph. Then the 14-step green/red LIVE/DIE flicker (kept verbatim — director loves it) resolves at final odds. **Gilt is never charged at death.** LIVE = 50% hp revive + knockback nova. DIE → THE RECKONING. markerRef={p,base,max,presses,window,t0,phase}. LT.markers/markerWins + DEATH'S DEBTOR intact.

## ⚰ THE RECKONING + THE LEDGER + LUCK (Batch 7 form)
Leaderboard/name input/percentile REMOVED (board key preserved, unread). After the slam rows: **THE LEDGER** (#goLedger — wave, weapon chips with levels, skill chips, CURSES/SCARS counts, DICE w/t, BEST PULL in rarity color) and the **LUCK verdict** — seven grades (EXTREMELY UNLUCKY → EXTREMELY LUCKY) computed by `luckVerdict()` from the run's `RUN` trackers (dice vs expected P(2d6≥thr), pull tiers vs 73/17/7/3, wheel cs tiers, crash points vs 2.11 mean, death-roll margin; <3 events = EVEN). `RUN` resets in startGame and is bumped at resolveRisk / showRewardPanel / landWheel / crash cash+bust / the death roll.

### (reckoning v1 notes)
Run tracks `P.dmgDealt` (all damage sites instrumented via trackDmg) and `P.bestStreak`. Death slams stat rows in at ~170ms intervals with rising dings (SLAIN / DAMAGE / BEST STREAK / LEVEL / TIME in #goStats), then score+gilt count up. **Skip law**: first SPACE completes the recap instantly (500ms dead-zone after death so FINAL PRESS mashing can't skip), second SPACE = Wager Again. Target: new run inside ~5s.

## ⚜ HOUSE RANKS — 100 LEVELS (Batch 7)
`RANKS=buildRanks()`: 20 titles × 5 roman tiers (FRESH MEAT I → THE HOUSE ITSELF V). Curve `rkStep(k)=135·k^0.875` — rank 5 ≈ 1 run, 10 ≈ 5, 30 ≈ 46, 100 ≈ 446 runs (~900 marks/run). Every rank pays: +GILT (12+2r) by default, RANK_FIVES forever-perks each 5th, RANK_MILESTONES each 10th (start Lv2 · +10 blood · +20 coins · golden spin +2% · press base +2% · curses −15% · vault −8% · rage feed +15% · press cap 55% · rank 100: all coins +15%). `applyRankPerks` iterates ALL reached ranks (idempotent per run). **Migration**: on load `rank=max(saved, rankFromMarks(marks))` — never down; old rank-12 (31k marks) lands ~25. Rank-up = two-beat ceremony (UNLOCKED → NEXT). Key `am_rank_v1` unchanged.

### (old 12-rank notes)
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

## Difficulty (Batch 7 — 'you won't survive the first minute')
CFG: spawn{startInt:0.75, minInt:0.26, baseBatch:4}, wave{first:26, grow:6, cap:96}, scale{hp:0.62, dmg:0.22, spdCap:1.95}, 5-wave spikes hp+0.10/dmg+0.03. Measured: no-input death ~8s; kiting-never-leveling death ~50s.

## Content inventory
- **29 weapons** (+Batch 7: ✂ Razor Deck returning slivers · 🔥 Cinder Spit ember cones · ⌛ Pendulum metronome arc · ⚒ Iron Stakes planted ground spikes · ≈ Brass Serpent sine bolt · 🍷 Poison Chalice rot pools (gpools) · 🎺 Gramophone wave arcs (waves) · ✪ Roulette Cylinder 6-burst with golden crit tracer · 🕯 Candelabra triple candle familiars · 🗡 The Guillotine telegraphed blade slam (guils)). New bullet kinds: razor/ember/stake/serpent/chalice/flamebolt/tracer; ground arrays waves/guils/gpools/gstakes reset in startGame.
- (legacy) **19 weapons** (bolt, cards, orbit, scythe, spark, chand, knives, aura, nova, seeker + coil lash, mortar blast, lantern turret, fangs swarm, bell knockback-toll, dice ricochet, phantom pierce-wave, coffin rear-nails, moths homing-stream). New-weapon mechanics use: timer blocks in update, helper fire fns, bullet flags (seek, pierce, blast, bounce, spin).
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

## Perf round 5 + sound (Batch 7)
Floor tiles bake once per variant (≤48 sprites, `tileSprite`) — per-frame floor path work is zero; watch the unsigned-shift lesson (`(vh>>>3)%4`, signed shift stamped 'undefined' into the marble). 13 drawEnemy shadowBlur sites gated by qLow/lite (toaster 120→27 shadows/frame). sparkBurst counts ×1.4 globally. Ticker rolls under a real whirr (startWhirr/whirrSpeed/stopWhirr — bandpass noise loop, MUST stop on brake/respin/finish), card-flutter at speed, SHINK+felt-thump settle; reels hum awake; crits ping (throttled 160ms). Tokens on pity clocks (wheel 40-60s, ascent 42-62s). Blood fountain redrawn (gilded twin basins + falling arcs). HP bar 22px glass (no LIFEBLOOD label), lowhp shimmer <30%. GLYPH_NUDGE map centers glyph-fallback reel icons. TAROT_FATES carry `dd` one-liners; INDEX tarot tiles show them via one delegated listener on #idxList.

## Batch 8 conventions
- **pressPulse(el) + SFX.press()**: EVERY interactive SPACE anywhere pops its on-screen button (.sp-pop) and clicks (throttled 60ms). Wired in ui.js keydown per state; new flows must wire their own.
- **sparkBurstAt(boxId, layerId, n)**: sparks positioned by any box, appended to any fixed inset-0 layer. Plain `sparkBurst` is slot-bound (0×0 rect skip protects the rest). ALL non-slot spark calls use the At form.
- **Passive rebalance**: `proj` Extra Ante is LEGENDARY (the first legendary skill bucket — shifts strip odds) and stepped (+1 shard at Lv1/Lv3; `ap()` checks pre-increment skillLevel, `sc` deleted so ascent prizes can't bypass); `a_swrm` steps at Lv1/3/5; `pierce` is epic.
- **Global-scope trap**: `FATE` was taken (tarot.js) — the slot's fate constants are `MFATE`. Grep before naming globals.
- CS2 colors confirmed exact (#4b69ff/#8847ff/#d32ce6/#eb4b4b/#e4ae39) — director asked; no change was needed.

## Batch 9 — THE SHIP (v1.0)
- **FOUNTAIN POSTMORTEM**: the heal never existed — the B7 gilded redraw shipped inside tickMapProps (pre-camera, painted over every frame) and no heal branch was ever written. Now: idist<60 drinks 16 blood/s, drains it.res, +8 ftexts on a rising chime, pool flares while drinking, dry = crumbles. The gilded art finally lives in the render-side draw (core.js ~900).
- **Selector v2**: hop 0.05s, decel +0.012, 1-2 loops, min 4 hops, lock 240ms (~0.6-0.9s total); `paintPick(i)` sets `--pkc` per hop to the RARC of the symbol under the halo; `.pick` CSS is var-driven (color-mix); séance keeps scale only.
- **UNCOMMON tier**: weights {48/27/15/9/1} (legendary = 1 in 100 by decree), RED_W {16/26/30/21/7}. RAR_TIER {c0,u1,r2,e3,l4,asc5,myth5} — EVERY numeric tier check shifted (fx washes incl new rw-uncommon, rarSting 6 steps w/ seraph at ≥5, ascent rarSting(4), luck tv {0,.5,1.2,2.4,5} baseline 0.581, LUCK grade tiers 4/5). Re-buckets: haste/reach/tip/snake/stoker/mag + cards/pendulum/coffin/fangs → uncommon (snake +5%/lv, haste +7%/lv). The rollMainReward `have` init REQUIRED uncommon:0 (NaN silently zeroed the tier — the validator's catch).
- **Perf round 6**: enemies cull on CAMERA bounds (pad 100, bosses exempt — player-centered inView is WRONG near walls, camera is edge-clamped); canvas alpha:false + boot paint in resize (render only runs when P exists); last per-frame gradients cached (player glow/coat, banners, XP bar); shafts gained a warm inner beam (baked). Global speed 1.63→**1.71**.
- **THE WHISPERS**: all 36 secrets (33 original + THE EGG ~34% spawn/run, PACT BREAKER refuse lever ×3, HIGH ROLLER pay ≥100◈ cut) render in the INDEX as riddles → flip to plain truth when found; every find pays +25 GILT; one-time retro sweep (SP flag in ach payload); count is WHISPER_TOTAL (computed, never hardcoded again).
- **THE LEDGER PAGES**: 16-page story in a menu STORY tab; unlocks derived (ranks [1,2,3,5,7,9,12,15,20,25,30,40,50] + whispers [5,15,30]); read state IDX.st in am_index_v1; parchment reveal ceremony (#pageReveal); rank-ups crossing a page slam the announce; storyBtn pulses while unread.
- **ARSENAL DRIP**: WEAPON_UNLOCKS (weapons.js) — 14 starters; coil3/chalice5/spark7/chand9/dice11/mortar13/nova15/bell18/phantom21/gramo24/cylinder27/seeker30/moths34/candelabra38/guillotine42. weaponUnlocked() = pure RANK derivation (grandfathered, zero storage). Gated at availableWeapons + rollMainReward; INDEX shows 🔒 RANK n; rank-up slams 'X JOINS THE HOUSE'; menu chip teases the next arm.
- **Pitch ladders**: XP gems +1 semitone per pickup within 1.5s (cap +14, tingle at peak); streaks ring every 25.
- Version stamp: v1.0 — THE HOUSE OPENS.

## Batch 10 — THE PLAYTEST VERDICT (v1.1)
- **THE HOUSE (13:00→15:00)**: houseActive latch in update() — at gt≥780 the pit purges (enemies/ebullets/bounty/tarots/tokens/egg/interactable cleared, ZERO drops since killEnemy is bypassed), every spawn ticker gates on !houseActive (waves core.js wave-gate — THE critical one — bounty/dare/interactables/tarot/wheelTok/crashTok), then 'housegod' spawns (CFG.enemy def + BOSS_DEFS entry for the bossBar; stats overwritten post-spawn to escape time scaling: 1M hp, 300 dmg, spd 385, unkillable clamp e.hp=e.maxhp + !e.boss instakill guard + kx/ky zeroed). Plain-chase AI via bossAI fallthrough. Draw: void smoke, gold eyes, orbiting scythe, ∞ over the hp sliver. VOICE: HOUSE_LINES[250] ordered by LT.houseMet (persisted), #voiceLayer huge blood-lit center text. gt≥900 while playing = FORECLOSURE: markerUsed forced, actuallyDie() — no final press, even after a won press moments earlier. NOTE gt runs 1.71× wall clock; 13:00 is the HUD clock.
- **RED TABLE 50/50**: pullBloodLever casts redFlip; tails hijacks finalizeReward (before voucher spends) → tableTakes(): a random P.passiveList entry loses a level (real removal — the old 'LOSE SKILL' label never actually removed anything), + a curse; nothing owned = a scar. CODICIL forgives the first tails (redForgiven latch shared into g._forgiven → whichever-comes-first). The any-miss=bust red rule RETIRED — red misses follow the normal curse/scar/bust script.
- **Economy**: MARKER'S FAVOR = 5 seals × +2% DEATH ROLL CAP (60.000% ceiling; rank 90 now press base +2%); vault prices ×~1.8 floor (oldbone 500, dice 640); vault door answers only to 🗝 THE KEY dropped at the first boss corpse of the run (vaultWindowOpen = P._vaultKey; timed window retired); gilt chip removed from menu.
- **Presentation**: .locked reel boxes wear the rarity via --pkc (lock + pair paths + all flashes); ascension = ▲▲▲▲▲▲ + ascShimmer everywhere; selector loops 2-3 min 6 (+40% travel); DICE v2 (tumble, dust ring, gold crit pips). HUD: .gfall fallback glyphs clamped to the 45px chip (the 9 emoji weapons); ☠ AFFLICTIONS row (curses+scars out of SKILLS); debuff pills wear ☠/☣/✦. fortune+stoker → rare.
- **Pacing**: xpNeed 7+3.9lv+0.8lv²; ascTime 7 (cap 12), crash token pity 56-80s; shooters 5%/hexers 4%, hordes 20+wave×3 @55%; scale.hp 0.66, minInt 0.24. Gramophone = muted felt horn. Perf: LODN 44/20, auto-low at 19ms, pcap 220.
- **Menu/pause/howto**: menuMotion() embers+suits+aurora+breathing panel; pauseRules LEFT; HOW TO = 5 tabs (▣ HOUSE RULES/🎮/🎰/🎡/◈) with D/→ A/← nav (early keydown intercept). Story pages: ‹ › arrows + D/→ A/← via stepStoryPage (locked neighbors dim + deny-shake + announce the price).

## Batch 11 — ITERATION (v1.2)
- **Ascent**: rungs + bottom stake chips light per tier (I green #8bff9a / II blue #6fb7ff / III red #ff5560 / ☆ gold #ffd36b, via --tc9 + data-x); **7.77 hard cap** — pushCrash clamps and auto-cashCrash into the jackpot.
- **RED TABLE v4 = THE SACRIFICE** (director-approved): pull → a random owned skill goes on a side card (#sacCard) as THE STAKE (no skills → no lever). TAKE without dicing = a coin for BOTH piles; DICE = no coin, every win +1 level AND heals ceil(25% maxHp) (real number on the promise), ONE miss burns offer+stake (sacBurn anim). CODICIL shields once per table (tableTakes returns false when forgiven). Diced takes always return the stake. bloodhour body class tints the screen while the lever waits.
- **The case wears CHAINS**: CHAIN_SETS (16 layouts), 2-3 per open; each SPACE snaps one (pay on first press), wax shatters on the last, then SPACE spins. Brake hits harder (sub-thump + box compression).
- **Consistency law**: ◆ pips on every table (☨ pip set retired; color carries the mood), ascension = ◆×6, ONLY .ptRow.on glows anywhere; ascend shimmer → static glow. Golden .goldwin dice flare on EVERY win. stopLock 40/45/60ms (immediate). Hold-to-roll presses #rollBtn (.held); slot SPACE pulses the live button. ARSENAL turns wear #slot.arsenal (ember marquee, ⚔ watermark).
- **The great slowdown**: xpNeed 14+5.5lv+1.1lv² (start 21) + orbs ×0.75 → slot cadence ≈ ⅓ of the director's clocked rate; coins −20% (chest 9-16, streak /4, elite 20, bosses −25%); vault compounders 5/3/4%; shooters 3% / hexers 2.5%, ebullets ≤90; **8:00 THE FLOOR RISES** (minInt −15%, batch +2, hp +0.06, one-time).
- **HUD**: weapon chips fixed 45px (lvpips overlay); body.paused lifts #hud to z25; SCARS carry glyphs ({l,g} in P.scars — ♥👢⚔⚡◈◎✦▣◑🎲); hp bar 28px capsule; TAB codex v2 (26px glyphs, inline projFx/d() stats under every item).
- **Pause/menu**: pauseRules panel DELETED; footer pills RESUME/HOW TO PLAY/QUIT; HOW TO v3 top-anchored (header never moves) + kid-simple rewrite; menu SPACE-starts + #menuRank marks progress bar. Fever overlay thinned (fp .07, center ×0.4).

## Batch 12 — THE FULL HOUSE (v2.0): the 20-hour game
- **SOULS** (ui.js SOULS, selection IDX.sl in am_index_v1, applied LAST in startGame after all perks): vesper (default) · dealer (rank 12: wlv={cards:1}, P.diceEase=1 → threshold −1 in finalizeReward, −20 maxHp) · widow (12 whispers: moths, xp ×1.15, dmg ×0.85) · debtor (25 deaths: +60 coins, coin ×1.35, dmgTaken +10%) · brute (2,500 kills: stakes, dmg ×1.25, +20 blood, spd ×0.85) · yolk (theegg secret: razor, radius ×0.7, spd ×1.2, 60 hp, P.yolk → TWO respins per slot via g._rerolls/maxR).
- **FLOORS** (FLOORS, IDX.fl): pit · cellar (rank 20: horde ×1.4, noRanged override→stalker, coin ×1.15, body.floor-cellar canvas tint) · chapel (LT.houseMet ≥3: enemy spd ×1.1 at spawn, xp ×1.1, tarot cadence ×2, sepia-gold tint). Mods live in window._fmods.
- **RUN_CONTRACTS** (≤2, each ×1.25 marks AND gilt via window._markMult at awardMarks): GLASS SOUL (maxHp ×0.5) · THE DROUGHT (P.drought: fountain refuses, wheel HEAL pays coins) · CROWDED TABLE (P.crowd: wave + horde ×1.3) · COLD DECK (P.coldDeck: dealFate always n:0 — no matches ever) · MIDNIGHT START (gt=180). NOTE: named RUN_CONTRACTS — plain CONTRACTS was taken by the vault.
- **THE ANTE ROOM** (#antePanel, openAnteRoom/renderAnteRoom): soul cards + floor cards + contract chips, locked show their price; #loadoutLine under START opens it; selections persist (idxSave rides sl/fl/ct).
- **THE ESTATE**: estatePct() = ranks 30% + whispers 15% + index 20% + pages 10% + feats 15% + souls&floors 10% → menu chip '🏛 n% OF THE HOUSE'.
- The 20-hour arc: 100 ranks × 6 souls × 3 floors × contract stakes × 29 dripped weapons × 36 whispers × 16 pages × ~400 feats — every run ends by 15:00 and every run feeds the estate.

## Batch 13 — THE POLISH BLITZ (v2.1)
Director: fix the double-slot, simplify the red table, 100+ QoL, optimize without dimming, Steam-grade design, full secret system. 17 commits.
- **HOUSE CREDIT staged**: comp spins from the vault seal announce as "◈ ON THE HOUSE ◈" one at a time (gt≥2.5), gold-stamped slot header. Generic pending drain — queued slots never wait for XP. (The "2 slots on first pickup" report was this seal firing silently.)
- **Pacing**: xpNeed=floor(18+6.5lv+1.35lv²) start 25; waves jitter (size ×0.85–1.2, gap ×0.9–1.15, 15% flavor-swap waves, horde ×0.85–1.2).
- **RED TABLE v5 (final)**: automatic below 20% HP (critPct 0.20), no lever. Normal odds/law/threshold(8); a random owned skill rides as THE STAKE (labeled side card). ANY dice miss burns the stake one level (CODICIL shields once/table) plus normal miss law. Win all 4 rungs → ♛ HOUSE'S BLESSING: 5s invulnerable, ×2 damage, ×2 fire rate; stake returns. TAKE = plain take + stake returns. Below 20% HP ascension is SEALED (level-ups pass plain, rage can't crown, gate denies, bar reads SEALED).
- **Dice law**: misses scar only on rung 3+; rungs 1–2 curse only.
- **Elites bless**: elite kills grant a random 12–18s blessing (HOUSE FAVOR +40% dmg / HOT HANDS +35% rate / SWIFT +30% spd / GILDED ×2 coins / MENDING +3/s) instead of a slot.
- **Vault**: always open, five seals per run then rests 5:00 (vaultBuys/vaultLocked); THE KEY retired entirely. Selector LOCK press now hits with the thick reel-stop family. Press-flash lands on all 3 stops (pulse after re-render + machine pressflash ring). FRENZY: 30s cooldown, ignition flare.
- **INDULGENCES** (gilt sink, ANTE ROOM): ☕ Dealer's Coffee 60 (2 comp spins) · ◈ Loaded Pockets 80 (+60 coins) · ♥ Thick Blood 100 (+25 max) · ⚜ High Roller 150 (first 3 slots deal RED_W hot via P.hotSlots/slotHot()). IDX.ind additive, consumed at run start.
- **THE BOOKS**: REC10 top-10 per stat {kills,dmg,streak,level,time,marks} in ach payload (R10, additive). Death rows wear #1/#2–3/#4–10 badges (gold burn/silver/violet), "N ALL-TIME MARKS SET", confetti on a #1. BOOKS panel on death screen + INDEX. AGAIN = "◈ ANTE UP — AGAIN ◈".
- **Arrows tell the truth**: shared drawGuide(x,y,col); ascent green, case violet, egg gold, fountain red, boss its own color at screen edge, vault white-gold for 8s after reopening. Roulette prop labeled "THE HOUSE'S TABLE — STAND TO BET", gold arc.
- **THE LADDER**: INDEX lists all 100 ranks (title · marks · reward · ⚔ drips), current highlighted, next 3 glowing, autoscrolls; menu rank bar clicks through.
- **TAB v3**: WEAPONS / SKILLS / SCARS / LEDGER glass columns, big type, no rarities legend. Keycap-styled keyhints, slimmer announce.
- **Smooth pass**: coins/orbs off-camera culls, HUD DOM writes change-detected, debuff pills keyed at 4Hz, candlelight pool under the player, boss floor-menace glow. (A half-res world bake of pools+shafts was measured SLOWER than culled live fills and reverted — noted for the record.)
- **STEAM SKIN**: full-bleed title screen (wordmark, left nav stack, chips row, ladder bar), gilt corner filigree on every screen, custom gilt cursor + ring crosshair, user-select/context-menu/scroll purged, F = fullscreen, Ken Burns menu drift, v2.1 stamp.
- **QoL 1–100** (packs I–IX): OPTIONS panel (volume that drives master gain, shake/flash, fps, colorblind shape pips, fullscreen), blur/hidden auto-pause "THE HOUSE WAITS", ESC universal back, ESC·ESC quick-quit, R re-ante, menu hotkeys I/L/O/H, banked reel presses, click-to-advance (safe stages), ZQSD/arrows/numpad-enter/gamepad, TAB mid-gamble, M mute, merging damage numbers, boss edge arrow + hp %, clock STIRS at 12:00, streak flames + grace fuse, coin-rush floats + octave-wrapped pitch, wave info line, xp flick, green heal floats, hit-direction arc, curse tooltips, panel-in animations, ante room live "TONIGHT PAYS ×", vault NEXT DOOR + lifetime seals, TAKEN BY killer line, loadout recap on death, quill autosave flick, "THE HOUSE SMOOTHS THE FELT" honesty toast, HOW TO PLAY NOW button, reel-order dots, live dice sum + honest % odds, BANK tooltip, stake fear-pulse while dicing, horde sigils, elite spawn rings, ranged wind-up glow, i-frame flicker, 260px spawn dead-zone, fountain reserve arc, roulette result floats, chest ribbon beat + shimmer-priced payouts, hours-at-the-table chip, daily first-ante +15 gilt, INDEX section %, estate chip growth pop, ceremony drone-ducking, universal button tick, daily stamp.
- **THE VEIL**: WHISPERS 36→51 (15 new: BEAST'S HOUR 6:66 death · ONE DROP LEFT · THE FOURTH DIE · UNTOUCHED MINUTE · BATHED IN FIRE · TWIN SERPENTS · THE HOARDER · ONE CANDLE · HEXWEARER · FIVE UNBLED · THE FINAL EDGE · ONE BREATH · CHAINBREAKER · WEIGHTED POCKET · MORTEM door-code; PACT BREAKER rewired to red-table takes). Card-flip reveal overlay, proximity murmurs ("THE WALLS LEAN IN"), GRAND SECRET: all 51 → ♛ THE HOUSE'S EQUAL (permanent golden trail + +5% coins, LT.equal additive).

## Batch 14 — ITERATION 3 (v2.2)
Director's third iteration sheet. 15 commits.
- **No hand is free**: HOUSE CREDIT seal deleted (stale save levels harmless); rank-10 milestone → +5% XP forever; HIGH ROLLER contract pays +40 coins; DEALER'S COFFEE re-brewed to 1 HOT slot. The REROLL/RESPIN is gone entirely (fn, button, R key, carry); THE YOLK reperked (+24 pickup, +3% pair odds via P.yolkFate). xpNeed=floor(20+7lv+1.5lv²), start 28. Slots come ONLY from levels.
- **The dead see the door**: #gameover reveals FIRST in actuallyDie (state+keys.clear+reveal before any recap decoration — the S-key death-screen bug can never recur); movement keys swallowed in marker/dead; "THE HOUSE ROLLS…" copy; books top-3 = GOLD/SILVER/BRONZE (.rk1/.rk2/.rk3b), 4–10 plain.
- **Fever leashed**: charge bar deleted, full-screen fever wash deleted (label only — the arena stays true); kill-fill ignition locked 60s after each fever (fill parks at 0.99); granted fevers (tarot/wheel) bypass.
- **The contract economy**: 8 contracts with hard unlocks (GLASS rank 15 · DROUGHT 25 deaths · CROWDED 5k kills · COLD DECK 100 spins · MIDNIGHT meet the HOUSE · NO MERCY rank 35, elites ×2 · STAMPEDE 10k kills, horde every wave · DOUBLE OR NOTHING rank 50, no death roll). Equip slots: 1 free, 2nd 25,000 gilt, 3rd 100,000 (IDX.ctSlots additive; startGame filters locked/over-cap).
- **The vault waits and gouges**: opens at 3:00; growth ×2.2/level, bases ×3; OLD BONE 25,000; 1,000+ buys ask twice.
- **The case reads its own odds**: side legend (consumer→HOUSE BLADE); PLAY TONIGHT: hover lift + suit reveal + unique velvet hover sound.
- **OPTIONS v2**: master volume is a draggable range slider (live gain); CHUNK DISTANCE = LOW/NORMAL/HIGH/INFINITE (LODN 20/44/120/∞, presets aligned); RESET TO DEFAULTS; TAB hold-vs-toggle; menu HOW TO fixed (panel moved to body, _howShow hardened).
- **TAB v4**: one modern sheet — stat tiles, weapon cards with numbers in plain sight, skill rows with live values, red scar strip. **HOW TO v4**: ledger ‹ › arrows, key-label row gone.
- **THE HUNDRED CHAPTERS**: STORY_PAGES → 100 rank-gated chapters in ten acts (THE DEBT → THE SEAT: the lost morning, the mill, the seventeen, the architect's wound, the foreclosure of heaven) + 3 whisper interludes; act-grouped panel with spine bar; allpages secret at 20 reads.
- **THE HUNDRED-AND-ONE WHISPERS**: 101 total; whisperSweep() threshold engine (5s cadence) + death hooks; 10 VERY RARE (violet tiles) + 1 MYTHIC — DEATHLESS: survive THE HOUSE 13:00→15:00 untouched, pays 1,000 gilt (obsidian tile). Unfound riddles blurred (hover half-clears); WHISPER HINTS: 500 gilt buys the first word.
- **QoL 101–200 packs**: reel hum climbs per lock, felt-brush close, dice dust, bank/voucher chips on the paytable, boss name-plates, elite double-rings, distinct bomber/revenant deaths, gilded gold-flood, HOUSE lines typewriter, foreclosure breath-hold, wave-thinned flicks, estate weight tooltip, soul stat-pips, BEST NIGHT under PLAY, rank-bar glow near rank-up, OPTIONS reset, books highlight tonight, fever exit motif, relief beat + drone that leans in as you bleed, coinRain loudness scaling, blur clears keys + grace i-frames on return, ESC mid-hand refusal, hold-R re-ante, TAB toggle mode, streak best-ghost, HOUSE countdown in the wave line, ascent token expiry ring, vault rest label, case brake pressflash, ♠ favicon + flavored title, reduced-motion respect, selection guards, hit-area minimums, night fingerprint + numbered nights, daily streak, estate-100 menu stamp, misclick confirms.

## Batch 15 — G5 THE CURVE (measured 2026-07-07, fast-forward headless probes)
Probe: autoplay bot (orbit-kite, orb magnet, aims nearest, cashes rage, auto-takes slots,
skips dice/ascent rides) — a FLOOR on player power. Human play adds dice levels, ascent
rides, contracts; expect ~2-3× these numbers.

| gt (min) | FRESH lv/coins/kills | RANK 20 lv/coins/kills | RANK 90+seals lv/coins/kills |
|---|---|---|---|
| 3  | 4 / 106 / 122 | 3 / 100 / 116 | 3 / 92 / 125 |
| 6  | 5 / ~200 / 230 | 5 / 207 / 211 | 5 / 170 / 201 |
| 9  | 6 / ~300 / 300 | 6 / 333 / 271 | 5 / 196 / 221 |
| 12 | 7 / ~400 / 390 | 6 / 419 / 339 | 6 / 318 / 256 |
| 13:05 | ☠ THE HOUSE | ☠ THE HOUSE | ☠ THE HOUSE |

Verdicts (296–310):
- 296 ✓ first level at 0:48 (target 0:45–1:10) — no tune.
- 297 ✓ minutes 8–13 pressure real but survivable: deepest hp 54–56% on mid save.
- 298 ✓ coin faucet 430–500/night floor ≈ one mid vault seal per decent night.
- 299 ◐ gilt floor ~235/night (score/40). Good human nights est. 700–1500. 25k contract
  slot = a deliberate long-term chase; left untuned by design.
- 300 ✗→✓ TUNED: xpNeed quadratic 1.5→1.3 per level² (lv10 240→220, lv15 457→412).
  Probes showed 3.0–3.5-min level droughts past level 7; target ≤3 min. Early curve
  unchanged (lv2 gate 28 xp both before/after).
- 301 red-table trigger: bot never dipped <20% naturally; reaches the death roll only
  via the HOUSE. Humans hit it via bursts — leave as the drama valve it is.
- 302 ✓ ascent tokens: 11 spawns/13 min for a bot that deletes them instantly; riding
  consumes clock → effective human cadence 6–9/night as designed.
- 305 ✓ HOT DECK math: RED_W epic+legendary = 28% vs base 10% — worth its 150 gilt.
- 306 THE HOUSE (spd 385 > player, 300/touch): NOT kiteable in open field — working
  as directed ("the 13th minute reaper"). The red table is the sanctioned second chance;
  the min-13 whisper stays the crown jewel.
- 308 marker press EV: base 35%+2%/press to cap 50–60% (5 seals) — documented.

## Batch 15 — GOLD MASTER (v3.0): the finished-game audit
Ten commits, ~150 verified items (lifetime QoL ledger → ~350 of the director's 1000; the
road continues in future iterations). Every commit: edit → syntax-gated build → headless
verify in a live browser → commit.

**G1 THE FIRST NIGHT** — 10 one-time coach marks (LT.coach flags; gold-edge toast, any key
dismisses; OPTIONS: COACH MARKS ON/OFF/RESET). Fresh saves see "YOUR FIRST NIGHT — PRESS
SPACE" and no empty-stat chips. Also fixed a TDZ bug that silently killed menu chips.
**G2 THE DOPAMINE MIX** — 30 concentrated hits: escalating reel stops, two-match heartbeat,
TRIPLE hold-then-slam, coin odometer, amber near-miss + paytable flare, dice held-breath
verdict, PERFECT gold ring, ON THE NOSE tag, rung-4 machine breathing, wheel brake-drag
ticks + CONTRABAND freeze-then-eruption, ascent number weight + mint edges past 5x,
flyGlyphs (coins visibly fly into counters: ascent cash, combo cash, vault buys, voucher
mint), death rank-bar rising tone, streak echo, boss slow-mo gold, fountain harp, chroma
edge flick on t4 ceremonies, indulgence seal-flip, hot-deck red tint, first-pull savor.
**G3 SLEEK & MODERN** — easing/shadow tokens, 6px gold scrollbars, tabular-nums on all
counters, ::selection, :focus-visible rings, hover/active on every control, unified hint
text + progress bars + close buttons, pause veil blur, announce QUEUE (never overlap),
fade-through-black on every menu↔game transition, books empty-state flavor.
**G4 THE MASTER BUS** — DynamicsCompressor (-18dB/4:1) on everything; 14-voice pool
(soft voices yield); UI -6dB / pickup -3dB trims; xp=sine vs coins=square; heartbeat ducks
coin pings 40%; room-tone ambience (OPTIONS toggle); F-A-C reel triad; perceptual x²
volume; 120ms mute fades; distance-muffled boss roars; ascension's private 5-note motif;
tiered whisper motifs; sub-bass under the House's voice; heavier vault door.
**G5 THE CURVE** — (table above). One tune: late xpNeed 1.5→1.3 per lv².
**G6 THE IRON LEDGER** — every clean load mirrors to <key>__bak; corrupt primaries restore
from carbon ("THE LEDGER WAS RESTORED FROM CARBON"); EXPORT/IMPORT SAVE (AMSAVE1 blob,
validated, confirm-overwrite); v:3 payload stamps; global error boundary (1 toast/30s,
error-burst → safe menu); quota warn-once; private-mode banner; beforeunload guard past
1:00; THE HOUSE SEATS ONE second-tab veil; daily-streak clock-skew clamp; NaN coercion on
all loads; REC10 capped; mute persisted; build now refuses unparseable src (scripts-check).
**G7 THE EXTERMINATION** — goldhold owns SPACE during the CONTRABAND freeze (respin
regression); run-seq + state fences on death-roll verdicts; startGame resets slot
machinery; closeSlot drops skip handles; empty-stake red-table guard; unmute restores
ambience. Panel×ESC matrix (7 panels), pause/resume/quit paths all verified.
**G8 THE SOAK** — heap flat (6→5MB) across 3 straight full nights; gradient/glow caches
capped (240/400, incl. coordinate-keyed banner gradients — a real slow leak); texts/rings/
sparks hard caps; parked-tab ticker drops to ~240ms; 0 zombie timers; DOM stable across
50 panel cycles (0 nodes/open × 4 panels); ~0.4ms/frame at 61 enemies; **fonts embedded**
(Cinzel + Cormorant latin, OFL, base64) — zero network requests, truly ONE file.
Bundle: 933KB raw / 394KB gzip (grew past the 650KB note by carrying its own type — accepted).
**G9 THE FURNITURE** — CREDITS behind the clickable v3.0 — GOLD stamp (menu/pause/death all
stamped); INDEX header "you hold N% of everything the House owns"; one-time THE COMPLEAT
PATRON ceremony at 100%; attract v2 (90s idle → title shimmer + house whisper); death
screen MENU pill; SPACE resumes pause; favicon ♠→☠ with your fortunes; keyboard map in
OPTIONS; NIGHT № on the pause card.
**G10 GOLD QA** — three scripted nights on the final build (fresh · rank-20 · rank-90+seals):
boot → ante → full night → death/marker → books → re-ante. Zero _amErr. Ship gate: PASSED.

### Ship checklist (v3.0 — GOLD)
- [x] One self-contained file, zero network (fonts embedded, OFL)
- [x] Build syntax gate (node --check × 13 scripts) before every bundle
- [x] Save integrity: carbon backups, corrupt-restore, export/import, NaN guards
- [x] Error boundary: no script error can dead-screen a night
- [x] 3 full scripted nights clean on final build; heap flat; 0 zombie timers
- [x] Onboarding: 10 coach marks, resettable, off-switch
- [x] Audio mastered: compressor, voice pool, perceptual volume, trims
- [x] All 5 persistent keys unchanged (am_rank_v1, antemortem_ach_v2,
      antemortem_gilt_v1, antemortem_gfx_v1, am_index_v1) — additive fields only
- [x] FAKE currency only — verified in credits copy too
- Known-good: Chromium (headless-verified live); Safari/iOS audio-resume retry wired
- Known cosmetic: mid-spin window resize can land a reel a few px off-center (self-heals next spin)

## Batch 16 — THE FINAL CUT (v4.0): stable, fast, dressed, publishable
Nine commits. All render-side: zero balance changes, zero save-format changes (verified
by localStorage key-diff across a full QA night: the same 5 primaries, additive only).

**C1** per-stage frame profiler (?prof): ring buffer, p95, spike counter with owning
stage, __prof.report() as the batch's verification backbone.
**C2 THE SHADOW PURGE** — 30+ world shadowBlur sites removed (the elite/boss body halo
left blur ACTIVE across every subsequent fill — the single biggest whale; now a baked
elliptical glow). 13 per-frame gradient sites cached/baked. Caches evict oldest-quarter
instead of wiping (stutter class dead). Carpet glyphs culled; LOD sort de-allocated.
Pinned A/B: storm-300 −19%, storm-500 −18% CPU; real GPU gains larger (blur rasterizes on paint).
**C3 THE COURT REDRAWN** — verdict: near enemies stay hand-drawn vector (the parametric
animation IS the look; sprite-sheeting = quantized motion + cache explosion). Far-LOD
silhouettes now BAKED per type: shaped (winged/spider/hooded/mass/pauldron/crawler/archer),
rim-lit, pre-blurred eyes — one drawImage each. Pinned A/B at 500-storm: enemies stage −31%.
Storms read as a court of the damned, and cost less.
**C4 THE GORE LEDGER** — the floor remembers the whole night: 3×3-tiled offscreen blood
canvas, kills stamp once (~20/s cap), a staggered wash dries old blood toward black-brown,
per frame only visible sub-rects blit. Whole system: +0.17ms. Found+fixed: the stamp
rate-cap window survived across runs and silently rejected every stamp of the next night.
**C5 THE HALL DRESSED** — sigil baked to 4 sprites + a NEW orbiting rune ward
(♠♥♦♣☠◈†♛⚜◆✦♞) + view cull (it used to draw ~110 strokes even off-screen); beveled
wainscot paneling strip; woven herringbone damask runner; gilt portrait corner
flourishes; engraved vault notch ring; fringed banners. Dressed AND cheaper (floor
stage at sigil center: 0.17ms).
**C6 THE NIGHT ARC** — the vignette grade cools candle-amber → bone-violet across 12
hour-buckets as 13:00 nears; the HOUSE's arrival snaps to the coldest grade (tb=99).
~13 half-res rebakes/night, zero per-frame cost, verified 1 bake per bucket. Candle
pools wander on Lissajous paths. One BULLET_COL voice per kind (no per-bullet string
garbage). Velvet stipple in the coat. CAMERA SMOOTHING REJECTED BY DESIGN: lookahead
moves aim mid-motion — a gameplay change this batch is forbidden to make.
**C7 THE BOSS PRESENCE** — 3 fading afterimages (90ms trail), counter-rotating lair
ring, breathing rune ward (reuses the sigil bake re-tinted), gold-filigreed nameplate.
All shed on low/lite. Cost below measurement noise.
**C8 THE IRON NIGHT** — the auto-quality FLAP ENGINE is dead: every flip called
resize(), whose slow frame re-fed the EMA. Now: 5s dwell, 45-consecutive-good-frame
upgrades, 30-frame amnesty after any flip/state change. Violent-oscillation test:
0 flips (was ~1 per 40 frames). Fonts pre-warmed at boot (first-raster hitch gone).
2000-event input fuzz across state churn: clean. 500-storm: stable, 452 silhouetted.
**C9** — head meta (description/og/theme-color, FAKE-currency-safe copy), v4.0 — FINAL
stamp sweep (menu/pause/death), this record, and the QA gate below.

### v4.0 FINAL — QA gate (run on the BUILT single file)
- Night 1 (fresh save): boot → ante → died fighting at 7:56 → death ledger → BOOKS → re-ante. Clean.
- Night 2 (rank-20 sim): full arc → cold snap → HOUSE at 13:00 → reaped 13:06. Clean.
- Night 3 (rank-90 + seals): full arc → HOUSE → 13:03. Clean.
- Zero _amErr across all three. Heap flat (5MB at the last death). Gore ledger alive at night's end.
- localStorage before/after: {am_rank_v1, antemortem_ach_v2, antemortem_gilt_v1,
  antemortem_gfx_v1(on options touch), am_index_v1} — additive only, plus __bak carbons on load.
- Bundle: 951KB raw / 401KB gzip, one file, zero network, fonts embedded (OFL).
- Measurement honesty: all ms are hidden-tab CPU under a pinned protocol (q=high, fixed
  viewport, fixed storm seeds). Visible-tab GPU gains exceed these — shadowBlur's true
  cost is paid at raster, which the hidden tab never does.

## Appendix — how to test this game headlessly (for future development sessions)
Knowledge earned across sixteen batches; without it, verification is slow and flaky.

1. **The fast-forward harness.** Own the clock: stub `window.setTimeout/setInterval/
   clearTimeout` into a queue keyed on a virtual clock, then drive frames with
   `tick(vt+=16.7)` and flush due timers each step. A full 15:00 night runs in ~15
   real seconds. NEVER run long synchronous eval loops against REAL timers — your
   loop blocks the event loop, ceremony setTimeouts never fire, and slots hang.
2. **Set `window._noAutoPause=true`** or the visibility auto-pause flips state to
   'paused' mid-test. Set `muted=true` to skip audio nodes.
3. **The autoplay bot** (probes/QA): orbit-kite around arena center, flee vector from
   enemies <220px, aim at nearest enemy every frame (position writes bypass the input
   path, so P.aim goes stale otherwise), magnet orbs/coins within 420px (the bot never
   walks over its kills), `cashRage()` whenever `P.ovT>0` (XP fills an overcharge that
   wants SPACE — without it the bot never levels), `slotTap()` with `stopLock=0` every
   ~6 ticks in slot state, SPACE-mash in marker state.
4. **Hidden-tab physics:** requestAnimationFrame never fires (the 15ms fallback ticker
   drives the loop); real setTimeout clamps to ~1s; the compositor never presents the
   canvas (screenshots show black — sample pixels with getImageData instead); the tab
   gets progressively CPU-throttled, so absolute profiler numbers drift — only
   within-run A/B deltas and pinned back-to-back build comparisons are trustworthy.
   Pin `GFX.q='high'` during measurement or auto-quality (fed garbage by the throttle)
   will resize the canvas mid-probe.
5. **The profiler:** load with `?prof`, read `window.__prof.report()` — avg/p95/
   spikes25/spikes40/per-stage ms. Reset with `__prof.reset()`.
6. **Cross-run leaks bite twice a batch.** Anything keyed on `gt` or real timestamps
   must be reset in startGame (see: the gore rate-cap and the marker death-roll timers,
   both of which survived into the next night before being fenced by `_runSeq`).
7. **Build gate:** `npm run build` runs `node --check` on all 13 scripts first — a
   `//` comment pasted into a single-line block once commented out a closing brace and
   shipped a blank game through a "successful" build. Trust the gate, not the bundler.
8. **gzip check:** `dist/ante-mortem.html` must stay self-contained — zero network
   requests (fonts are embedded base64, OFL-licensed). Verify with the network tab.

## 🎮 HANDS AND DIALS (B3)
- **THE DIALS** (`#b3Dials`, ui.js B3 block) is the settings hub: menu OPTIONS and the pause SETTINGS pill open it (on phones the SETTINGS button sits on the pause card beside ✦ YOUR CODEX). SOUND: MASTER (= `GFX.vol`), SOUND EFFECTS (`DIALS.sfx` → `sfxBus`), MUSIC (`DIALS.music` → `musicBus`), LOOK FOR TRACKS. FEEL: SCREEN SHAKE (`GFX.shake`, 0–150%, now scales amplitude in render), FLASH INTENSITY (`GFX.flash`), REDUCE FLASHING (`DIALS.calm`: flashes capped at 0.12, `body.b3calm` kills strobes/chroma/canvas washes), PAD RUMBLE. HANDS: rebinding for move ×4 / bet / pause / codex. GRAPHICS & MORE ▸ opens the old `#gfxPanel` (it now scrolls). New key **`am_dials_v1`** `{sfx,music,rumble,calm,seek,binds}`; GFX keys stay in `antemortem_gfx_v1`.
- **Rebinding = translation.** A capture-phase keydown/keyup on window turns a trusted press of a bound key into a synthetic event of the canonical key (`w a s d`, `' '`, `Escape`, `Tab`) — so every existing handler keeps listening to the keys it always did. Default keys keep working unless another action claims them. A taken key **swaps** the two actions. Reserved (ESC F M ENTER R Q 1 2 3) are refused. Arrows always walk.
- **The pad** (`PAD`, `b3PadFrame` on rAF): standard mapping. In the pit: left stick / D-pad walk (core.js reads `PAD.mx/my`), Ⓐ = SPACE keydown/keyup (holds work), Ⓧ = ENTER, START = ESC, Ⓨ / VIEW = codex (`tcCodex`), Ⓑ in slot/wheel = ESC. In any **scope** (topmost visible panel, else pause / ledger / menu / jackpot cards): D-pad or stick walks the gilt focus ring (`.b3Focus`, spatial nav with wrap-around, held-repeat 360/110ms, scroll-into-view), Ⓐ clicks, Ⓑ = back (ESC), START at the menu = PLAY, LB/RB = page arrows, right stick scrolls, ◀ ▶ on a slider adjusts it. Ⓐ on ANTE UP sends SPACE so the ledger skip law holds. Focusables are found generically (buttons, inputs, `B3_CLICKY` cards) — new panels get pad support for free if their clickables are buttons; add a selector to `B3_CLICKY` otherwise.
- **Prompts follow the last hand used.** Pad → a reversible text relabeler (SPACE→Ⓐ, ENTER cash→Ⓧ, ESC→START, TAB→Ⓨ, WASD→L-STICK; ✕○□△ for PlayStation pads) + `#b3PadBar`; a key or mouse press restores the keyboard text; touch keeps A4's labels. Canvas hints read `window._padUI/_padA`.
- **Rumble** rides SFX wrappers (hurt, death, jackpot, reelLock, bigWin by tier, bossRoar, cashout, vaultBuy, levelUp, nearMiss) via `vibrationActuator.playEffect('dual-rumble')`, only while the pad is the hand in use and the toggle is on.
- **THE HOUSE BAND** (sfx.js B3 block): contexts menu / run / boss / ascent / house with fallback chains (house→boss→run, ascent→run, boss→run). Two-deck 1.6s crossfades; paused ×0.45, codex ×0.6; dead → silence until the recap is read, then menu. Big SFX duck it (`musicDuck`). Over http(s) tracks route through Web Audio (`musicBus`, works on iOS); from file:// they ride `element.volume`. **No 404s by design**: the build bakes `window.__AM_MUSIC` from `assets/music/` and copies the files beside the page; only LOOK FOR TRACKS (opt-in) probes unknown files. See `assets/music/README.md`.
- Probes: `npm run pad` (39 checks, fake pad walks menu → Ante Room → DIALS → night → pause → settings → codex → ledger), `npm run music` (13 checks on a served stage with ffmpeg loops), `node probes/dialshots.js` (mouse/keyboard rebinding + phone).
