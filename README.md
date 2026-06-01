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

- `index.html` — the application entrypoint, including markup, styles, controls, animation, audio, and radio logic.
- `*.png` — aquarium backgrounds, fish sprites, plant sprites, and decorative props.
- `index.webm` — recorded/demo media asset kept with the prototype.

## Current maintenance notes

- The app is intentionally static and self-contained right now.
- Most logic still lives in `index.html`; future cleanup should split CSS and JavaScript into dedicated files after preserving visual parity.
- Image assets are large because they prioritize prototype fidelity. Asset compression/responsive variants should be handled in a dedicated optimization pass.

## Smoke checks

After changing the app, run these quick checks from the repo root:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path('index.html').read_text()
start = s.index('<script>') + len('<script>')
end = s.index('</script>', start)
Path('/tmp/index-script.js').write_text(s[start:end])
PY
node --check /tmp/index-script.js
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
