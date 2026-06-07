(() => {
  const tank = document.getElementById('tank');
  const fishLayer = document.getElementById('fishLayer');
  const swimSpeed = document.getElementById('swimSpeed');

  if (!tank || !fishLayer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  const mobile = window.matchMedia('(max-width: 800px)').matches;

  // jack1.png faces left natively. Multiply by -1 so positive swim direction
  // points the fish's nose in the same direction as travel.
  const nativeFacing = -1;

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
  let vx = 0;
  let vy = 0;
  let targetX = home.x;
  let targetY = home.y;
  let state = 'patrol';
  let stateTimer = 0;
  let last = performance.now();
  let facingDir = 1;
  let turnAge = 999;
  let phase = Math.random() * Math.PI * 2;
  let lastClaimAt = -Infinity;

  function speed01() {
    const n = Number(swimSpeed && swimSpeed.value);
    return clamp(Number.isFinite(n) ? n / 100 : 0.20, 0, 1);
  }

  function pickCruiseTarget(forceCrossTank = false) {
    const lowPass = Math.random() < 0.44;
    targetY = lowPass ? rand(0.68, bounds.bottom) : rand(bounds.top, 0.73);

    if (forceCrossTank) {
      targetX = x < home.x ? rand(0.60, bounds.right) : rand(bounds.left, 0.40);
      return;
    }

    const territorialDrift = Math.random() < 0.76;
    const center = territorialDrift ? home.x : rand(bounds.left + 0.08, bounds.right - 0.08);
    targetX = clamp(center + rand(-0.22, 0.22), bounds.left, bounds.right);
  }

  function pickNextState(now) {
    const r = Math.random();
    const canClaim = (now - lastClaimAt) > 22000;

    if (canClaim && r > 0.965) {
      state = 'claim';
      lastClaimAt = now;
      stateTimer = rand(0.9, 1.35);
      const pushDir = x < 0.5 ? 1 : -1;
      targetX = clamp(x + pushDir * rand(0.11, 0.18), bounds.left, bounds.right);
      targetY = clamp(y + rand(-0.030, 0.030), bounds.top, bounds.bottom);
      return;
    }

    if (r < 0.34) {
      state = 'hover';
      stateTimer = rand(2.8, 6.4);
      targetX = clamp(x + rand(-0.034, 0.034), bounds.left, bounds.right);
      targetY = clamp(y + rand(-0.024, 0.024), bounds.top, bounds.bottom);
      return;
    }

    state = 'patrol';
    stateTimer = rand(5.2, 10.8);
    pickCruiseTarget(r > 0.76);
  }

  function softlyAvoidDiver(dtSec) {
    const dx = x - 0.535;
    const dy = y - 0.70;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.001 && dist < 0.145) {
      const pressure = (0.145 - dist) / 0.145;
      vx += (dx / dist) * pressure * 0.018 * dtSec;
      vy += (dy / dist) * pressure * 0.008 * dtSec;
    }
  }

  function animate(now) {
    const rect = tank.getBoundingClientRect();
    const dt = Math.min(120, Math.max(0, now - last));
    const dtSec = dt / 1000;
    const frameScale = dt / (1000 / 60);
    last = now;

    phase += dtSec * lerp(0.58, 1.20, speed01());

    if (rect.width > 0 && rect.height > 0) {
      stateTimer -= dtSec;

      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.hypot(dx, dy);

      if (stateTimer <= 0 || dist < 0.045) {
        pickNextState(now);
      }

      const ndx = dist > 0.0001 ? dx / dist : 0;
      const ndy = dist > 0.0001 ? dy / dist : 0;
      const swim = lerp(0.70, 1.35, speed01());
      const targetSpeed =
        state === 'claim' ? 0.145 * swim :
        state === 'hover' ? 0.030 * swim :
        0.092 * swim;
      const steer =
        state === 'claim' ? 0.048 :
        state === 'hover' ? 0.028 :
        0.038;
      const steerT = clamp(steer * frameScale, 0, 0.36);

      vx = lerp(vx, ndx * targetSpeed, steerT);
      vy = lerp(vy, ndy * targetSpeed, steerT);
      softlyAvoidDiver(dtSec);

      const drag = Math.pow(state === 'hover' ? 0.970 : 0.986, frameScale);
      vx *= drag;
      vy *= drag;

      x = clamp(x + vx * dtSec, bounds.left, bounds.right);
      y = clamp(y + vy * dtSec, bounds.top, bounds.bottom);

      if (x <= bounds.left || x >= bounds.right) vx *= -0.35;
      if (y <= bounds.top || y >= bounds.bottom) vy *= -0.35;

      const movingDir = Math.abs(vx) > 0.002 ? (vx >= 0 ? 1 : -1) : facingDir;
      if (movingDir !== facingDir) {
        facingDir = movingDir;
        turnAge = 0;
      }

      turnAge = Math.min(turnAge + dt, 950);

      const turnP = clamp(turnAge / 950, 0, 1);
      const turnPulse = Math.sin(Math.PI * turnP);
      const depth = clamp((y - bounds.top) / (bounds.bottom - bounds.top), 0, 1);
      const bob = Math.sin(phase * 1.35) * (state === 'hover' ? 0.0032 : 0.0048);
      const glideTilt = Math.sin(phase * 0.72) * 0.55 + clamp(vy * 90, -1.15, 1.15);
      const claimLean = state === 'claim' ? facingDir * 0.75 : 0;
      const baseScale = mobile ? 1.04 : 1.16;
      const scale = baseScale * lerp(0.91, 1.08, depth);
      const width = scale * (1 - turnPulse * 0.075);
      const height = scale * (1 + turnPulse * 0.012);
      const opacity = clamp(0.72 + depth * 0.20, 0.72, 0.92);
      const sat = lerp(0.84, 1.04, depth);
      const bright = lerp(0.80, 1.01, depth);

      el.style.opacity = opacity.toFixed(3);
      el.style.filter = 'saturate(' + sat.toFixed(3) + ') brightness(' + bright.toFixed(3) + ')';
      el.style.transform =
        'translate3d(' + (x * rect.width).toFixed(2) + 'px, ' + ((y + bob) * rect.height).toFixed(2) + 'px, 0) ' +
        'translate(-50%,-50%) scale(' + (nativeFacing * facingDir * width).toFixed(3) + ', ' + height.toFixed(3) + ') ' +
        'rotate(' + (glideTilt + claimLean).toFixed(2) + 'deg)';
    }

    requestAnimationFrame(animate);
  }

  pickCruiseTarget(true);
  requestAnimationFrame(animate);
})();
