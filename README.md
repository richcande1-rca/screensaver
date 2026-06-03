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

- `index.html` — the application entrypoint and scene markup.
- `styles/aquarium.css` — aquarium layout, visual effects, controls, radio panel, responsive, and fullscreen styles.
- `*.png` — aquarium backgrounds, fish sprites, plant sprites, and decorative props.
- `index.webm` — recorded/demo media asset kept with the prototype.

## Current maintenance notes

- The app is intentionally static and self-contained right now.
- JavaScript still lives in `index.html`; future cleanup should split it into dedicated files after preserving visual parity.
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

In another terminal, verify the page and stylesheet respond:

```bash
python3 - <<'PY'
import urllib.request
for url in [
    'http://127.0.0.1:8123/index.html',
    'http://127.0.0.1:8123/styles/aquarium.css',
]:
    with urllib.request.urlopen(url, timeout=5) as response:
        print(url, response.status, response.headers.get('content-type'))
PY
```

Check that local HTML and CSS asset references exist:

```bash
python3 - <<'PY'
import re
from pathlib import Path
for source in [Path('index.html'), Path('styles/aquarium.css')]:
    text = source.read_text()
    refs = re.findall(r'(?:src|href)="(\.\.?/[^"#?]+)"', text)
    refs += re.findall(r'url\(["\']?(\.\.?/[^"\')#?]+)', text)
    missing = [ref for ref in refs if not (source.parent / ref).resolve().exists()]
    print(source, 'missing relative refs:', missing)
    if missing:
        raise SystemExit(1)
PY
```
