# Uploading ANTE MORTEM to itch.io (HTML5)

The upload is **`launch/ante-mortem-itch.zip`** — `index.html` (the whole game in one file) sits at the
zip's root, with the app manifest, icons and offline worker beside it. To rebuild it after a game change:

```
npm run build
npm run launch:itch
```

## Step by step

1. itch.io → **Dashboard → Create new project**.
2. **Kind of project:** `HTML` (this is what makes it playable in the page).
3. **Uploads → Upload files** → choose `ante-mortem-itch.zip`. When it finishes, tick
   **"This file will be played in the browser"**.
4. **Embed options** (appear once the file is marked playable):
   - **Viewport dimensions:** `1280 × 720` (the game is built and tested at 1280×720; it scales to any size).
   - ☑ **Mobile friendly** — orientation: **Landscape or portrait (any)**. The game has a thumb stick, a gold BET coin and phone layouts.
   - ☑ **Automatically start on page load** — leave **off** (browsers block sound until a click; the click-to-play button handles that cleanly).
   - ☑ **Fullscreen button** — on.
   - ☐ **Enable scrollbars** — off.
   - ☐ **SharedArrayBuffer support** — off (not used).
5. **Frame / embed:** "Embed in page" (not "Click to launch in fullscreen") reads best; fullscreen is one click away.
6. **Details:**
   - Cover image → `launch/cover-itch-630x500.png` (itch shows it at 315×250 in listings; `cover-itch-315x250.png` is that size exactly if you want to check how it reads).
   - Screenshots → `launch/screenshots/*.jpg` (all 1920×1080; itch shows up to 5 in the sidebar — use 01, 02, 04, 05, 08).
   - Gameplay video/GIF → itch takes a YouTube/Vimeo link for "Gameplay video"; the GIF `launch/gameplay-loop.gif` can go straight into the description body.
   - Copy → paste from `launch/STORE_PAGE.md` (short description, body, controls, tags).
   - **Genre:** Action · **Tags:** see STORE_PAGE.md · **Input:** Keyboard, Gamepad, Touchscreen.
7. **Pricing:** "No payments" (or "$0 or donate"). Never sell anything inside the game — it is fake currency only.
8. **Visibility:** Draft → open the page, play a night, check sound starts after the first click → **Public**.

## Notes
- Saves live in the player's browser storage on itch's domain — separate from the GitHub Pages copy (a player who moves between them starts fresh on the other).
- Music: the build plays the synthesized House score; if tracks were dropped into `assets/music/` before building, they are copied into the zip automatically.
- Zip size is about 0.9MB. itch's limit for HTML5 is far above that.
