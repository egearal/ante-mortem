# ANTE MORTEM — Project Rules

## What this is
A gothic-casino roguelite (top-down survivor + gambling systems). Single-player, browser, HTML5 canvas.
Tone: **dark glamour** — velvet, gilt, bone, candlelight. The House is a character.
Design goal: **maximum dopamine**. Every system should feel like a slot machine paying out: escalating sounds, slams, confetti, near-misses, visible odds.

## Who you're working with
- The director does NOT code. They give plain-English directions, often in ALL CAPS.
- YOU decide all technical details, ambiguities, and numbers yourself. Do not ask permission for implementation choices — ask only for design-direction forks.
- When the director changes their mind, the LATER statement wins.
- Read GAME_DESIGN.md before touching any system — it documents how everything works and why.

## Hard rules (never break)
1. **FAKE currency only.** Never real money, never real-money framing, ever.
2. Never change persistent-save keys (`am_rank_v1`, gilt storage key) — players must not lose progress.
3. The shippable product is always ONE self-contained file: `dist/ante-mortem.html` via `npm run build`.
4. The code is 13 plain scripts in `src/` sharing global scope, loaded in fixed order. Do NOT convert to ES modules or introduce a state-object refactor without explicit approval.
5. **Glyph safety:** any new symbol shown in UI must render on all platforms. Stick to widely-supported Unicode (card suits, chess, stars ✦✧✵✷✸✹, ⚔⚡⚙☠, dice ⚀-⚅, common emoji). NO alchemical symbols (🜁🜂), NO rare geometric blocks. Every new item gets a distinct highly-saturated color in GLYPH_COL.
6. Every new skill/weapon/curse needs: glyph + GLYPH_COL color + description function d(l) with real numbers + (weapons) PROJ_FX short label. Cards must always say exactly what a thing does.

## Workflow (every task)
1. Make the change in the relevant src/ file(s) only.
2. Run `npm run build` and verify zero console errors (boot the built file headlessly if the change is risky).
3. Commit with a short descriptive message.
4. Report to the director in plain English with flavor — what it feels like in-game, not just what code changed.

## Style conventions in code
- Announces: `announce('◈ TEXT IN CAPS ◈', goodBool)` with a framing glyph pair.
- Colors: gold #ffd36b / #e8b64c, blood #8b1620, mint-ascension #8bffd0, violet #c98bff, white-gold #fff2c0.
- Big moments: bigWin(), domConfetti(), coinRain(), sparkBurst(), flash(), shake — layer them, escalate by tier.
- SFX are synthesized (tone/noise helpers + SFX.* library). New features need sound.
