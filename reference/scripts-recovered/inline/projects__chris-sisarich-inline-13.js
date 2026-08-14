(() => {
  'use strict';

  const C = {
    HOTKEY_CODE: 'KeyS',
    IDLE_MS: 90000,
    IDLE_FIRST_MS: 60000,
    FPS_TARGET: 36,
    FPS_TARGET_MOBILE: 28,
    DPR_CAP: 2,
    DPR_CAP_MOBILE: 1.5,
    CELL_BASE: 22,
    CELL_MIN: 16,
    CELL_MAX: 28,
    CELL_MOBILE: 28,
    TILE_COLOR: '#174a8c',
    DEBUG: false
  };

  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ic = matchMedia('(pointer: coarse)').matches;
  const it = matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;

  let wrap = document.getElementById('hbw-ss');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'hbw-ss';
    const el = document.createElement('canvas');
    el.id = 'hbw-ss-c';
    wrap.appendChild(el);
    document.documentElement.appendChild(wrap);
  }

  const canvas = document.getElementById('hbw-ss-c');
  if (!canvas) {
    console.error('SS: Canvas not found');
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) {
    console.error('SS: Context not available');
    return;
  }
  ctx.imageSmoothingEnabled = true;

  let on = false;
  let raf = null;
  let idleT = null;
  let dpr = 1;
  let W = 0;
  let H = 0;
  let CELL = C.CELL_BASE;
  let gridW = 0;
  let gridH = 0;
  let t0 = 0;
  let lastDrawTime = 0;
  let sessionSeed = 0;
  let instantOn = false;
  let lastW = 0;
  let lastH = 0;
  let lastDpr = 0;
  let hasShownOnce = false;
  let paused = false;
  const ROOT_SS_CLASS = 'hbw-ss-active';

  function setSwupBlur(active) {
    try {
      document.documentElement.classList.toggle(ROOT_SS_CLASS, !!active);
    } catch (e) {}
  }

  function resize() {
    const vv = window.visualViewport;
    W = Math.floor(vv?.width ?? innerWidth);
    H = Math.floor(vv?.height ?? innerHeight);
    const raw = devicePixelRatio || 1;
    dpr = Math.max(1, Math.min((ic || it) ? C.DPR_CAP_MOBILE : C.DPR_CAP, raw));

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    CELL = (ic || it) ? C.CELL_MOBILE : C.CELL_BASE;
    CELL = Math.max(C.CELL_MIN, Math.min(C.CELL_MAX, CELL));
    gridW = Math.ceil(W / CELL);
    gridH = Math.ceil(H / CELL);
  }

  function clear() {
    ctx.clearRect(0, 0, W, H);
  }

  /**
   * Flowing fields (water / smoke): stacked waves + drift + swirl; threshold breathes.
   */
  function cellPattern(gx, gy, tSec, seed) {
    const s = (seed % 1009) * 0.0024;
    const invW = 1 / Math.max(1, gridW - 1);
    const invH = 1 / Math.max(1, gridH - 1);
    const nx = gx * invW;
    const ny = gy * invH;

    const driftX = tSec * 0.34 + s;
    const driftY = tSec * 0.27 - s * 0.55;
    const driftZ = tSec * 0.21 + s * 0.8;

    let f = 0;
    f += Math.sin((nx * 0.95 + ny * 0.82) * Math.PI * 2.05 + driftX);
    f += Math.sin((nx * 1.05 - ny * 0.92) * Math.PI * 1.72 - driftY * 1.05);
    f += 0.48 * Math.sin((nx * 2.05 + ny * 1.95) * Math.PI + driftX * 0.88 + driftY * 0.62);
    f += 0.32 * Math.sin((nx * 3.1 - ny * 2.85) * Math.PI + driftZ * 1.15);

    const cx = nx - 0.5;
    const cy = ny - 0.5;
    const r = Math.sqrt(cx * cx + cy * cy + 0.035);
    const ang = Math.atan2(cy, cx);
    f += 0.52 * Math.sin(r * Math.PI * 3.25 - tSec * 0.92 + s * 2.8);
    f += 0.28 * Math.sin(ang * 3 + r * Math.PI * 4.2 + tSec * 0.44);

    f += 0.3 * Math.sin(ny * Math.PI * 2.8 - tSec * 0.68 + s);
    f += 0.22 * Math.sin(nx * Math.PI * 2.4 + tSec * 0.55 - s * 0.7);

    f += 0.28 * Math.sin((gx + gy) * 0.22 + tSec * 0.168 + s * 1.7);
    f += 0.18 * Math.sin((gx * 1.1 - gy * 0.9) * 0.31 + tSec * 0.2 + s * 2.1);

    const breath =
      0.16 * Math.sin(tSec * 0.38 + s * 1.2) +
      0.08 * Math.sin(tSec * 0.72 - s) +
      0.045 * Math.sin(tSec * 1.05 + s * 0.5);
    return f > breath ? 1 : 0;
  }

  function cellPatternStatic(gx, gy, seed) {
    return cellPattern(gx, gy, 0, seed);
  }

  function draw(tsv) {
    if (tsv !== undefined) {
      const tfps = (ic || it) ? C.FPS_TARGET_MOBILE : C.FPS_TARGET;
      const tdt = 1000 / tfps;
      if (lastDrawTime > 0 && tsv - lastDrawTime < tdt) {
        if (on) raf = requestAnimationFrame(draw);
        return;
      }
      lastDrawTime = tsv;
    }

    const now = performance.now();
    const tSec = (now - t0) / 1000;

    clear();
    if (gridW <= 0 || gridH <= 0) {
      if (on) raf = requestAnimationFrame(draw);
      return;
    }

    ctx.fillStyle = C.TILE_COLOR;
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const lit = rm ? cellPatternStatic(gx, gy, sessionSeed) : cellPattern(gx, gy, tSec, sessionSeed);
        if (lit) ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL);
      }
    }

    if (rm) {
      raf = null;
      return;
    }
    if (on && !paused) raf = requestAnimationFrame(draw);
  }

  function activate(isHotkey) {
    if (on) return;

    const now = performance.now();
    const vv = window.visualViewport;
    const currentW = Math.floor(vv?.width ?? innerWidth);
    const currentH = Math.floor(vv?.height ?? innerHeight);
    const currentDpr = devicePixelRatio || 1;

    if (currentW !== lastW || currentH !== lastH || currentDpr !== lastDpr || W < 1 || H < 1) {
      resize();
      lastW = currentW;
      lastH = currentH;
      lastDpr = currentDpr;
    }

    on = true;
    instantOn = !!isHotkey;
    sessionSeed = Math.floor(now / 1000);
    t0 = now;
    lastDrawTime = 0;
    paused = false;

    if (instantOn) {
      const prev = wrap.style.transition;
      wrap.style.transition = 'none';
      wrap.classList.add('on');
      wrap.offsetHeight;
      requestAnimationFrame(() => {
        wrap.style.transition = prev || '';
      });
    } else {
      wrap.classList.add('on');
    }
    setSwupBlur(true);

    try {
      draw(performance.now());
    } catch (e) {
      console.error('SS draw error:', e);
    }

    if (!rm && !paused) raf = requestAnimationFrame(draw);
  }

  function deactivate() {
    if (!on) return;
    on = false;
    wrap.classList.remove('on');
    setSwupBlur(false);
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    clear();
    paused = false;
  }

  function handleKeydown(e) {
    if (C.DEBUG && on && e.code === 'Space' && !e.shiftKey) {
      e.preventDefault();
      paused = !paused;
      if (!paused && on && !rm) {
        lastDrawTime = 0;
        raf = requestAnimationFrame(draw);
      }
      return true;
    }

    if (!e.shiftKey || e.code !== C.HOTKEY_CODE) return false;

    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return false;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (on) deactivate();
    else {
      activate(true);
      hasShownOnce = true;
    }
    resetIdleTimer();
    return true;
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    } else if (on && !rm && !raf) {
      lastDrawTime = 0;
      raf = requestAnimationFrame(draw);
    }
  }

  function resetIdleTimer() {
    if (idleT) clearTimeout(idleT);
    if (!on && !document.hidden && !rm) {
      const timeoutMs = hasShownOnce ? C.IDLE_MS : C.IDLE_FIRST_MS;
      idleT = setTimeout(() => {
        if (!on && !document.hidden) {
          activate(false);
          hasShownOnce = true;
        }
      }, timeoutMs);
    }
  }

  function attachListeners() {
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Use capture so gallery components that stopPropagation() still count as activity.
    // Also include pointer/touch move so drag/scroll gestures keep the timer alive.
    [
      'mousedown',
      'mousemove',
      'pointerdown',
      'pointermove',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel'
    ].forEach((ev) => {
      const passive = ev !== 'touchmove' ? true : false;
      document.addEventListener(ev, resetIdleTimer, { passive, capture: true });
    });

    const exit = (e) => {
      if (!on) return;
      if (e.type === 'keydown' && e.shiftKey && e.code === C.HOTKEY_CODE) return;
      if (e.type.startsWith('touch') && e.touches && e.touches.length > 1) return;
      deactivate();
      resetIdleTimer();
    };

    ['mousemove', 'mousedown', 'pointerdown', 'touchstart', 'wheel', 'scroll'].forEach((ev) => {
      document.addEventListener(ev, exit, { passive: true, capture: true });
    });
    document.addEventListener('keydown', exit, false);

    window.addEventListener('resize', () => {
      if (on) resize();
    }, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (on) resize();
      }, { passive: true });
      window.visualViewport.addEventListener('scroll', () => {
        if (on) resize();
      }, { passive: true });
    }
  }

  function init() {
    if (window.__HBW_SS_INITED) return;
    window.__HBW_SS_INITED = true;
    resize();
    attachListeners();
    if (!rm) resetIdleTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  })();