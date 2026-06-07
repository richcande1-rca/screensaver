(() => {
  const tank = document.getElementById('tank');
  const fishLayer = document.getElementById('fishLayer');
  const swimSpeed = document.getElementById('swimSpeed');

  if (!tank || !fishLayer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  const mobile = window.matchMedia('(max-width: 800px)').matches;
  const nativeFacing = 1;

  const el = document.createElement('div');
  el.className = 'fish jack-dempsey';
  el.style.width = mobile ? '74px' : '88px';
  el.style.height = mobile ? '44px' : '52px';
  el.style.opacity = '0';
  el.style.zIndex = '7';
  el.style.setProperty('--fish-sprite-filter', 'drop-shadow(0 2px 4px rgba(0,0,0,.30)) drop-shadow(0 0 7px rgba(90,170,210,.10)) saturate(.98) contrast(1.04)');

  const sprite = document.createElement('img');
  sprite.className = 'fish-sprite';
  sprite.src = './jack1.png';
  sprite.alt = '';
  sprite.draggable = false;
  el.appendChild(sprite);
  fishLayer.appendChild(el);

  const bounds = mobile
    ? { left: 0.15, right: 0.86, top: 0.48, bottom: 0.84 }
    : { left: 0.13, right: 0.87, top: 0.46, bottom: 0.84 };

  const home = {
    x: mobile ? 0.47 : 0.50,
    y: mobile ? 0.67 : 0.66
  };

  let x = mobile ? 0.30 : 0.27;
  let y = mobile ? 0.69 : 0.66;
  let targetX = home.x;
  let targetY = home.y;
  let state = 'patrol';
  let stateTimer = 0;
  let last = performance.now();
  let dir = 1;
  let visualDir = 1;
  let turnAge = 900;
  let phase = Math.random() * Math.PI * 2;
  let lastClaimAt = -Infinity;

  function speed01() {
    const n = Number(swimSpeed && swimSpeed.value);
    return clamp(Number.isFinite(n) ? n / 100 : 0.20, 0, 1);
  }

  function pickCruiseTarget(forceCrossTank = false) {
    const lowPass = Math.random() < 0.38;
    targetY = lowPass ? rand(0.68, bounds.bottom) : rand(bounds.top, 0.73);

    if (forceCrossTank) {
      targetX = x < home.x ? rand(0.61, bounds.right) : rand(bounds.left, 0.39);
    } else {
      const territorialDrift = Math.random() < 0.72;
      const center = territorialDrift ? home.x : rand(bounds.left + 0.08, bounds.right - 0.08);
      targetX = clamp(center + rand(-0.24, 0.24), bounds.left, bounds.right);
    }
  }

  function pickNextState(now) {
    const r = Math.random();
    const canClaim = (now - lastClaimAt) > 18000;

    if (canClaim && r > 0.93) {
      state = 'claim';
      lastClaimAt = now;
      stateTimer = rand(0.55, 0.95);
      const pushDir = x < 0.5 ? 1 : -1;
      targetX = clamp(x + pushDir * rand(0.11, 0.18), bounds.left, bounds.right);
      targetY = clamp(y + rand(-0.035, 0.035), bounds.top, bounds.bottom);
      return;
    }

    if (r < 0.30) {
      state = 'hover';
      stateTimer = rand(2.4, 6.6);
      targetX = clamp(x + rand(-0.035, 0.035), bounds.left, bounds.right);
      targetY = clamp(y + rand(-0.025, 0.025), bounds.top, bounds.bottom);
      return;
    }

    state = 'patrol';
    stateTimer = rand(4.8, 10.8);
    pickCruiseTarget(r > 0.72);
  }

  function nudgeAwayFromDiver() {
    const dx = x - 0.535;
    const dy = y - 0.70;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.001 && dist < 0.13) {
      const push = (0.13 - dist) * 0.006;
      x = clamp(x + (dx / dist) * push, bounds.left, bounds.right);
      y = clamp(y + (dy / dist) * push * 0.55, bounds.top, bounds.bottom);
    }
  }

  function animate(now) {
    const rect = tank.getBoundingClientRect();
    const rawDt = now - last;
    const dt = Math.min(120, Math.max(0, rawDt));
    const dtSec = dt / 1000;
    const frameScale = dt / (1000 / 60);
    last = now;
    phase += dtSec * lerp(0.58, 1.18, speed01());

    if (rect.width > 0 && rect.height > 0) {
      stateTimer -= dtSec;
      if (stateTimer <= 0) pickNextState(now);

      const swim = lerp(0.50, 1.24, speed01());
      const follow =
        state === 'claim' ? 0.040 :
        state === 'hover' ? 0.010 :
        0.018;
      const easedFollow = 1 - Math.pow(1 - follow * swim, Math.max(0.5, frameScale));

      x = clamp(x + (targetX - x) * easedFollow, bounds.left, bounds.right);
      y = clamp(y + (targetY - y) * easedFollow, bounds.top, bounds.bottom);
      nudgeAwayFromDiver();

      const desiredDir = (targetX - x) >= 0 ? 1 : -1;
      if (desiredDir !== dir && Math.abs(targetX - x) > 0.012) {
        dir = desiredDir;
        turnAge = 0;
      }

      turnAge = Math.min(turnAge + dt, 900);
      visualDir = lerp(visualDir, dir, 0.055 * frameScale);

      const turnP = clamp(turnAge / 900, 0, 1);
      const turnPulse = Math.sin(Math.PI * turnP);
      const depth = clamp((y - bounds.top) / (bounds.bottom - bounds.top), 0, 1);
      const bob = Math.sin(phase * 1.7) * (state === 'hover' ? 0.004 : 0.006);
      const glideTilt = Math.sin(phase * 0.8) * 0.75 + (targetY - y) * 9;
      const claimLean = state === 'claim' ? dir * 1.5 : 0;
      const baseScale = mobile ? 1.05 : 1.18;
      const scale = baseScale * lerp(0.90, 1.11, depth);
      const width = scale * (1 - turnPulse * 0.12);
      const height = scale * (1 + turnPulse * 0.025);
      const opacity = clamp(0.70 + depth * 0.22, 0.70, 0.92);
      const sat = lerp(0.82, 1.05, depth);
      const bright = lerp(0.78, 1.02, depth);

      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(3)})`;
      el.style.transform =
        `translate3d(${(x * rect.width).toFixed(2)}px, ${((y + bob) * rect.height).toFixed(2)}px, 0) ` +
        `translate(-50%,-50%) scale(${(nativeFacing * visualDir * width).toFixed(3)}, ${height.toFixed(3)}) ` +
        `rotate(${(glideTilt + claimLean).toFixed(2)}deg)`;
    }

    requestAnimationFrame(animate);
  }

  pickCruiseTarget(true);
  requestAnimationFrame(animate);
})();
