(() => {
  const tank = document.getElementById('tank');
  const swimSpeed = document.getElementById('swimSpeed');

  if (!tank || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  const mobile = window.matchMedia('(max-width: 800px)').matches;
  const centerX = mobile ? 0.555 : 0.565;
  const centerY = mobile ? 0.615 : 0.600;
  const radiusX = mobile ? 0.125 : 0.155;
  const radiusY = mobile ? 0.085 : 0.105;

  let discus = null;
  let phase = Math.random();
  let last = performance.now();
  let lastX = centerX;
  let dir = -1;
  let turnAge = 999;

  function getDiscus() {
    if (discus && document.body.contains(discus)) return discus;
    discus = tank.querySelector('.fish.discus');
    if (discus) {
      discus.dataset.patrol = 'figure8';
    }
    return discus;
  }

  function getSpeed01() {
    const n = Number(swimSpeed && swimSpeed.value);
    return clamp(Number.isFinite(n) ? n / 100 : 0.20, 0, 1);
  }

  function animate(now) {
    const el = getDiscus();
    const rect = tank.getBoundingClientRect();
    const dt = Math.min(120, now - last);
    last = now;

    if (el && rect.width > 0 && rect.height > 0) {
      const speed01 = getSpeed01();
      const period = lerp(76, 28, speed01);
      phase = (phase + (dt / 1000) / period) % 1;

      const a = phase * Math.PI * 2;
      const x = centerX + Math.sin(a) * radiusX;
      const y = centerY + Math.sin(a * 2) * radiusY;
      const vx = x - lastX;
      const desiredDir = vx >= 0 ? 1 : -1;

      if (desiredDir !== dir && Math.abs(vx) > 0.00004) {
        dir = desiredDir;
        turnAge = 0;
      }

      lastX = x;
      turnAge = Math.min(turnAge + dt, 1350);

      const turnP = clamp(turnAge / 1350, 0, 1);
      const turnPulse = Math.sin(Math.PI * turnP);
      const depth = clamp(0.54 + Math.sin(a + Math.PI * 0.35) * 0.18 + (y - centerY) * 1.05, 0, 1);
      const baseScale = mobile ? 1.46 : 1.74;
      const scale = baseScale * lerp(0.88, 1.14, depth);
      const width = scale * (1 - turnPulse * 0.075);
      const height = scale * (1 + turnPulse * 0.010);
      const tilt = Math.sin(a * 2.0) * 1.15 + turnPulse * dir * 1.25;
      const opacity = clamp(0.875 + depth * 0.105, 0.86, 0.985);
      const sat = lerp(0.72, 1.05, depth);
      const bright = lerp(0.76, 1.03, depth);

      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(3)})`;
      el.style.transform =
        `translate3d(${(x * rect.width).toFixed(2)}px, ${(y * rect.height).toFixed(2)}px, 0) translate(-50%,-50%) scale(${(-dir * width).toFixed(3)}, ${height.toFixed(3)}) rotate(${tilt.toFixed(2)}deg)`;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
