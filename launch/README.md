# ♠ THE LAUNCH KIT

Store-ready assets for ANTE MORTEM, all generated from the game itself (the built file, on the probe
harness's virtual clock, with a god-mode bot and seeded randomness, so a re-run deals the same nights).

| File | Size | Use |
|---|---|---|
| `cover-itch-630x500.png` | 630×500 | itch.io cover image |
| `cover-itch-315x250.png` | 315×250 | itch.io cover at listing size (check legibility / small uses) |
| `capsule-steam-header-460x215.png` | 460×215 | Steam header capsule |
| `capsule-steam-main-616x353.png` | 616×353 | Steam main capsule |
| `hero-1920x1080.png` | 1920×1080 | hero / banner / press kit key art |
| `social-1200x630.png` | 1200×630 | link preview — wired as `og:image` + `twitter:image` in `index.html` |
| `screenshots/01…08_*.jpg` | 1920×1080 | store screenshots (storm, slot mid-triple, triple MAX, pairing, Croupier, the Tower, Book of Debts, phone) |
| `gameplay-loop.gif` | 480×270, 13s, < 8MB | social posts (seamless loop) |
| `gameplay-loop.webm` | 1280×720, 13s | where video is allowed (sharper, 4MB) |
| `ante-mortem-itch.zip` + `itch/` | — | the itch.io HTML5 upload — see `itch/README.md` |
| `STORE_PAGE.md` | — | itch + Steam copy, tags, controls, the 280-char post |

## Remaking them

```
npm run build
npm run launch:shots     # launch/tools/capture.js → launch/raw/*.png  (≈8 min; --only slot,boss,evo,arcana,storm,book,phone,portrait)
npm run launch:compose   # launch/tools/compose.js → covers, capsules, social, phone plate, screenshots/
npm run launch:gif       # launch/tools/gif.js     → gameplay-loop.gif/.webm (≈4 min; --encode re-encodes cached frames)
npm run launch:itch      # launch/tools/itch.js    → itch/ + ante-mortem-itch.zip
```

- `launch/tools/picks.json` chooses which raw frame becomes which screenshot and which sits under each cover.
- `launch/tools/compose.html` is the canvas page the composer paints in (rewritten each run, git-ignored: it embeds the fonts and raw frames).
- `launch/raw/` is git-ignored (lossless captures, ~40MB).
- Store shots are rendered at 1280×720 logical × 1.5 device pixels, so they show the game's real camera at full 1920×1080 sharpness.
- Presentation-only liberties: outcomes are forced through the same hooks the probes use (the slot's fate dealer for the triple, `spawnBoss`, the arcana deal hook, a held pairing), a veteran save skips first-night tips, transient unlock toasts are hidden, and the storm's 300 bodies are spawned harmless. Cover backgrounds use a "clean plate" of the storm with the DOM HUD lifted. No gameplay code was changed.
