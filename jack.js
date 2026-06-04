(() => {
  const tank = document.getElementById('tank');
  const fishLayer = document.getElementById('fishLayer');

  if (!tank || !fishLayer) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 800px)').matches;

  const shadow = document.createElement('span');
  shadow.className = 'jack-shadow';
  shadow.setAttribute('aria-hidden', 'true');

  const jack = document.createElement('div');
  jack.className = 'jack-fish';
  jack.setAttribute('aria-hidden', 'true');
  jack.innerHTML = '<img src="./jack1.png" alt="">';

  fishLayer.appendChild(shadow);
  fishLayer.appendChild(jack);

  const state = {
    x: isMobile ? 0.68 : 0.72,
    y: isMobile ? 0.58 : 0.56,
    targetX: isMobile ? 0.34 : 0.30,
    targetY: isMobile ? 0.66 : 0.62,
    vx: 0,
    vy: 0,
    dir: -1,
    visualDir: -1,
    phase: Math.random() * Math.PI * 2,
    pause: 0,
    targetTimer: 0,
    last: performance.now()
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function chooseTarget() {
    // Lower/mid patrol. He owns this corner, he does not school.
    state.targetX = rand(0.16, 0.86);
    state.targetY = rand(0.48, 0.76);
    state.targetTimer = rand(4.0, 8.5);
    state.pause = Math.random() < 0.34 ? rand(0.65, 1.85) : 0;
  }

  chooseTarget();

  function animate(now) {
    const rawDt = now - state.last;
    state.last = now;
    const dt = Math.min(90, rawDt);
    const dtSec = dt / 1000;

    const rect = tank.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;

    state.phase += dtSec * (prefersReducedMotion ? 0.55 : 1.25);
    state.targetTimer -= dtSec;

    const dx = state.targetX - state.x;
    const dy = state.targetY - state.y;
    const dist = Math.hypot(dx, dy) || 0.0001;

    if (state.pause > 0) {
      state.pause -= dtSec;
    } else {
      const speed = prefersReducedMotion ? 0.000014 : 0.000026;
      const accel = prefersReducedMotion ? 0.0014 : 0.0024;
      const ax = (dx / dist) * speed * dt;
      const ay = (dy / dist) * speed * dt * 0.72;

      state.vx = lerp(state.vx, ax, accel * dt);
      state.vy = lerp(state.vy, ay, accel * dt);
      state.x += state.vx;
      state.y += state.vy;
    }

    state.vx *= 0.988;
    state.vy *= 0.988;

    if (Math.abs(dx) > 0.012) state.dir = dx >= 0 ? 1 : -1;
    state.visualDir = lerp(state.visualDir, state.dir, 0.045 * Math.max(0.5, dt / 16.7));

    if (dist < 0.045 || state.targetTimer <= 0) chooseTarget();

    state.x = clamp(state.x, 0.10, 0.92);
    state.y = clamp(state.y, 0.42, 0.80);

    const speedNow = Math.min(1, Math.hypot(state.vx, state.vy) * 9000);
    const hover = Math.sin(state.phase) * 0.0045;
    const drawY = state.y + hover;
    const turnCompression = 1 - Math.min(0.18, Math.abs(state.visualDir - state.dir) * 0.08);
    const scaleX = state.visualDir * turnCompression;
    const scaleY = 1 + Math.sin(state.phase * 1.35) * 0.012;
    const tilt = clamp(state.vy * 1700, -4, 4) + Math.sin(state.phase * 0.55) * 0.7;

    const near = 0.42 + state.y * 0.42;
    const opacity = 0.86 + near * 0.12;
    const brightness = 0.88 + near * 0.18;
    const blur = Math.max(0, 0.34 - near * 0.26);

    jack.style.opacity = opacity.toFixed(3);
    jack.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px)`;
    jack.style.transform =
      `translate3d(${state.x * w}px, ${drawY * h}px, 0) translate(-50%,-50%) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) rotate(${tilt.toFixed(2)}deg)`;

    const shadowScale = 0.88 + near * 0.32 + speedNow * 0.08;
    shadow.style.opacity = (0.18 + near * 0.24).toFixed(3);
    shadow.style.filter = `blur(${(7 + (1 - near) * 5).toFixed(1)}px)`;
    shadow.style.transform =
      `translate3d(${state.x * w}px, ${(drawY + 0.105) * h}px, 0) translate(-50%,-50%) scale(${shadowScale.toFixed(3)}, ${(0.74 + near * 0.24).toFixed(3)})`;

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
