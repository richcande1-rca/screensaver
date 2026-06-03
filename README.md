# Ambient Aquarium Screensaver

A standalone ambient aquarium prototype built as a static web page. The app layers aquarium backgrounds, animated fish, bubbles, lighting effects, foreground plants, fullscreen controls, bubble audio, and an optional YouTube radio panel into one screensaver-style scene.

## Run locally

No package install or build step is required.

```bash
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/index.html> in a browser.

You can also open `index.html` directly from disk, but serving it locally is closer to how the page behaves when hosted.

## Project layout

- `index.html` — the application markup and static scene structure.
- `styles.css` — aquarium layout, responsive rules, lighting, plant, fish, bubble, control, fullscreen, and radio presentation.
- `app.js` — controls, animation, audio, fullscreen, background selection, and radio behavior.
- `*.png` — aquarium backgrounds, fish sprites, plant sprites, and decorative props.
- `index.webm` — recorded/demo media asset kept with the prototype.

## Current maintenance notes

- The app is intentionally static and has no package/build tooling right now.
- Markup, styles, and behavior now live in separate files to make future visual or interaction changes easier to review.
- Image assets are large because they prioritize prototype fidelity. Asset compression/responsive variants should be handled in a dedicated optimization pass.

## Smoke checks

After changing the app, run these quick checks from the repo root:

```bash
node --check app.js
```

```bash
python3 -m http.server 8123 --bind 127.0.0.1
```

In another terminal, verify the page responds:

```bash
python3 - <<'PY'
import urllib.request
with urllib.request.urlopen('http://127.0.0.1:8123/index.html', timeout=5) as response:
    print(response.status, response.headers.get('content-type'))
PY
```
