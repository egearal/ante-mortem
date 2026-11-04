# THE HOUSE BAND — drop your music here

The game plays music from this folder **if the files exist**. If they don't, it stays silent
(the synthesized sound effects still play) and nothing breaks.

## The five filenames

| File name | When it plays |
|---|---|
| `menu.ogg` / `menu.mp3` | The title screen, every menu, and the death ledger once the tally is read |
| `run.ogg` / `run.mp3` | A normal night in the pit (also the slot, the wheel, the vault and the pause — quieter while paused) |
| `boss.ogg` / `boss.mp3` | While a boss is alive (falls back to `run` if missing) |
| `ascent.ogg` / `ascent.mp3` | THE ASCENT crash game (falls back to `run`) |
| `house.ogg` / `house.mp3` | When THE HOUSE itself arrives at 13:00 (falls back to `boss`, then `run`) |

- Names must be **exactly** these, lowercase. `.ogg`, `.mp3` and `.m4a` all work.
- Give both `.ogg` and `.mp3` if you can — Safari/iPhone can't play `.ogg`, so it will pick the `.mp3`.
  If you only give one, give `.mp3`.
- Every track **loops**, so make it loop cleanly (end where it began).
- Switching context **crossfades** over about 1.6 seconds. Big moments (jackpots, level-ups, the vault,
  a boss roar, your death) briefly **duck** the music so the sting can sing.
- Keep each file under ~5 MB if you can (a 2–3 minute loop at 128–160 kbps is plenty).

## How to get them into the game

1. Put the files in this folder: `assets/music/` (next to this README).
2. Run `npm run build`. The build bakes the list of tracks it found into `dist/ante-mortem.html`
   and copies the files to `dist/assets/music/`, right beside the page.
3. Commit the files here (not the copies in `dist/`) and push — the hosted build picks them up.

`npm run dev` also finds them automatically.

### "I just copied the files next to an already-built page"
That works too, without rebuilding: put them in an `assets/music/` folder **beside**
`ante-mortem.html`, open the game, go to **OPTIONS → THE DIALS → LOOK FOR TRACKS → ON**.
The game then knocks on each filename once at startup. (The browser log shows a harmless
"not found" line for each name you didn't provide — that's the only reason it's off by default.)

## Volume
**OPTIONS → THE DIALS → MUSIC** sets the band's volume (MASTER sits above it, SOUND EFFECTS is separate).
The music line in THE DIALS shows which of the five tracks the House found.
