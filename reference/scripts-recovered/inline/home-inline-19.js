(function () {
  'use strict';
  /*
    Prevent duplicate embeds (e.g. global + page footer) from double-binding listeners,
    but still allow re-mounting after Swup replaces the DOM.
  */
  if (window.__HBW_PROJECT_GALLERY_SECTION_B__) {
    try {
      if (typeof window.__HBW_updateVH__ === 'function') window.__HBW_updateVH__();
      if (typeof window.__HBW_PROJECT_GALLERY_MOUNT_ALL__ === 'function') {
        window.__HBW_PROJECT_GALLERY_MOUNT_ALL__();
      }
    } catch (e) {}
    return;
  }
  window.__HBW_PROJECT_GALLERY_SECTION_B__ = true;

  /**
   * Nav class hooks (Webflow): assign on links/elements. Used by SECTION B + C.
   * leave — triggers portfolio shell slide-off (SECTION C).
   * counterHide — hides the gallery slide counter when clicking these nav items.
   */
  window.HBW_NAV = {
    leave: '.hbw-back, .hbw-bottom-back',
    counterHide: '.hbw-nav-counter-hide, .hbw-box, .hbw-back, .hbw-studio'
  };

  var CONFIG = {
    friction: 0.965,
    /* Desktop: slightly stronger wheel + optional gentle drift */
    wheelMultiplier: 0.095,
    /* > 0 = gentle endless drift on desktop (keeps RAF alive). 0 = drift off. */
    desktopAutoDrift: 0,
    /* Mobile: gentle auto-scroll drift (stops on first user interaction). */
    mobileAutoDrift: 0.42,
    minViewportMultiplier: 3,
    gapFallback: 0,
    maxInitAttempts: 60,
    resizeDebounceMs: 200,
    idleVelocityEpsilon: 0.012,
    mobileDyScale: 1,
    flingMul: 0.62,
    flingMaxFactor: 0.22,
    rewindDurationMs: 1100,
    endEpsilonPx: 4,
    recycleEps: 0.35
  };

  function parseGapPx(track) {
    if (!track) return CONFIG.gapFallback;
    try {
      var g = window.getComputedStyle(track).gap || window.getComputedStyle(track).columnGap;
      var m = g && g.match(/^([\d.]+)px$/);
      if (m) return parseFloat(m[1], 10);
    } catch (e) {}
    return CONFIG.gapFallback;
  }

  function stripLegacyClones(track) {
    if (!track) return;
    var clones = track.querySelectorAll('[data-clone="true"]');
    for (var i = 0; i < clones.length; i++) {
      clones[i].remove();
    }
  }

  function prepareTrackMedia(track, done) {
    if (!track) {
      if (typeof done === 'function') done();
      return;
    }
    var imgs = track.querySelectorAll('img');
    var vids = track.querySelectorAll('video');
    var pending = 0;
    var finished = false;
    var safetyTimer = null;

    function finish() {
      if (finished) return;
      finished = true;
      if (safetyTimer) window.clearTimeout(safetyTimer);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (typeof done === 'function') done();
        });
      });
    }

    function arm() {
      if (pending <= 0) finish();
    }

    safetyTimer = window.setTimeout(finish, 12000);

    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      try {
        img.setAttribute('loading', 'eager');
        img.setAttribute('decoding', 'async');
      } catch (e) {}
      if (img.complete && img.naturalWidth > 0) continue;
      pending++;
      img.addEventListener('load', function () {
        pending--;
        arm();
      }, { once: true });
      img.addEventListener(
        'error',
        function () {
          pending--;
          arm();
        },
        { once: true }
      );
    }

    for (var v = 0; v < vids.length; v++) {
      var vid = vids[v];
      if (vid.readyState >= 2) continue;
      pending++;
      vid.addEventListener(
        'loadeddata',
        function () {
          pending--;
          arm();
        },
        { once: true }
      );
      vid.addEventListener(
        'error',
        function () {
          pending--;
          arm();
        },
        { once: true }
      );
    }

    arm();
  }

  function formatCounter(index, total) {
    return (
      String(index).padStart(2, '0') +
      ' / ' +
      String(total).padStart(2, '0')
    );
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function updateVH() {
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', h * 0.01 + 'px');
  }

  window.__HBW_updateVH__ = updateVH;

  function initOneGallery(gallery) {
    if (!gallery || gallery.getAttribute('data-hbw-gallery-init') === '1') return;
    gallery.setAttribute('data-hbw-gallery-init', '1');

    var track = gallery.querySelector('.project-gallery__track');
    if (!track) {
      gallery.removeAttribute('data-hbw-gallery-init');
      return;
    }

    stripLegacyClones(track);

    var originals = Array.prototype.slice.call(
      track.querySelectorAll('.hbw-hscroll__item, .project-gallery__item')
    );
    if (!originals.length) {
      gallery.removeAttribute('data-hbw-gallery-init');
      return;
    }

    originals.forEach(function (el, i) {
      el.setAttribute('data-hbw-orig-idx', String(i));
    });

    var gapPx = parseGapPx(track);
    var offsetX = 0;
    var velocity = 0;
    var isDragging = false;
    var dragStartX = 0;
    var dragStartY = 0;
    var dragStartOffset = 0;
    var rafId = null;
    var totalItems = originals.length;
    var isMobile = window.innerWidth <= 767;
    var bodyScrollY = 0;
    var lastIndexSync = 0;
    var indexSyncIntervalMs = 100;
    var resizeDebounceTimer = null;
    var trackResizeObserver = null;
    var lastPointerClientX = 0;
    var lastPointerClientY = 0;
    var lastPointerTime = 0;
    var flingVx = 0;
    var flingVy = 0;
    var reduceMotion = prefersReducedMotion();
    var isRewinding = false;
    var rewindRafId = null;
    var desktopCycleWidth = 0; // width of one full originals sequence (for progress bar)
    var desktopVirtualX = 0; // monotonic-ish position that ignores DOM recycling adjustments
    var dragStartVirtual = 0;
    var mobileUserInteracted = false;

    var progressWrap = document.createElement('div');
    progressWrap.className = 'project-gallery__progress';
    progressWrap.innerHTML = '<span></span>';
    gallery.appendChild(progressWrap);
    var progressBar = progressWrap.querySelector('span');

    var counterEl = document.createElement('div');
    counterEl.className = 'project-gallery__counter';
    counterEl.textContent = formatCounter(1, totalItems);
    gallery.appendChild(counterEl);

    var handlers = {
      wheel: null,
      pointerdown: null,
      pointermove: null,
      pointerup: null,
      pointercancel: null,
      resize: null,
      orientationchange: null,
      vvResize: null,
      touchmoveGlobal: null,
      counterHide: null,
      counterShow: null,
      navClick: null,
      vis: null
    };

    function lockBodyScroll() {
      // Never lock body; fixed-position scroll locking is a common source of iOS jank.
      // The gallery itself is full-viewport and handles the pan gesture.
      return;
    }

    function unlockBodyScroll() {
      return;
    }

    function getScrollBounds() {
      var gw = gallery.clientWidth || 1;
      var tw = track.scrollWidth || 0;
      var extra = tw - gw;
      if (extra <= 0) {
        return { minX: 0, maxX: 0, span: 0 };
      }
      return { minX: -extra, maxX: 0, span: extra };
    }

    function clampOffsetAndVelocity() {
      if (!isMobile) return;
      var b = getScrollBounds();
      if (offsetX > b.maxX) {
        offsetX = b.maxX;
        if (!isDragging) velocity = 0;
      } else if (offsetX < b.minX) {
        offsetX = b.minX;
        if (!isDragging) velocity = 0;
      }
    }

    function itemStepWidth(node) {
      if (!node) return gapPx;
      return node.offsetWidth + gapPx;
    }

    function measureForwardStep(node) {
      if (!node) return gapPx;
      // OffsetLeft deltas can drift with flex gaps/clones; width+gap is stable.
      return itemStepWidth(node);
    }

    function measureBackwardStep(node) {
      if (!node) return gapPx;
      return itemStepWidth(node);
    }

    function updateDesktopCycleWidth() {
      if (isMobile) return;
      gapPx = parseGapPx(track);
      var w = 0;
      for (var i = 0; i < originals.length; i++) {
        w += (originals[i].offsetWidth || 0);
        if (i !== originals.length - 1) w += gapPx;
      }
      desktopCycleWidth = Math.max(1, w || 1);
    }

    function recycleForward() {
      if (isMobile) return;
      var first = track.firstElementChild;
      while (first && -offsetX >= measureForwardStep(first) - CONFIG.recycleEps) {
        var step = measureForwardStep(first);
        offsetX += step;
        track.appendChild(first);
        first = track.firstElementChild;
      }
    }

    function recycleBackward() {
      if (isMobile) return;
      var last = track.lastElementChild;
      while (last && offsetX > CONFIG.recycleEps) {
        var step = measureBackwardStep(last);
        offsetX -= step;
        track.insertBefore(last, track.firstElementChild);
        last = track.lastElementChild;
      }
    }

    function applyDesktopRecycle() {
      if (isMobile) return;
      gapPx = parseGapPx(track);
      recycleForward();
      recycleBackward();
    }

    function ensureDesktopClones() {
      if (isMobile) return;
      if (isDragging) {
        gallery.setAttribute('data-hbw-clone-pending', '1');
        return;
      }
      gallery.removeAttribute('data-hbw-clone-pending');
      gapPx = parseGapPx(track);
      updateDesktopCycleWidth();
      var clones = track.querySelectorAll('[data-clone="true"]');
      for (var c = 0; c < clones.length; c++) {
        clones[c].remove();
      }
      var vw = gallery.clientWidth || window.innerWidth || 1;
      var targetWidth = vw * CONFIG.minViewportMultiplier;
      var safety = 0;
      while (track.scrollWidth < targetWidth && originals.length > 0 && safety < 500) {
        safety++;
        var progressed = false;
        for (var i = 0; i < originals.length; i++) {
          if (track.scrollWidth >= targetWidth) break;
          var el = originals[i];
          var clone = el.cloneNode(true);
          clone.setAttribute('data-clone', 'true');
          clone.setAttribute('data-hbw-orig-idx', el.getAttribute('data-hbw-orig-idx') || '0');
          track.appendChild(clone);
          progressed = true;
        }
        if (!progressed) break;
      }
    }

    function syncIndexFromViewport() {
      var gx = gallery.getBoundingClientRect().left;
      var target = gx + gallery.clientWidth * 0.5;
      var bestIdx = 0;
      var bestDist = Infinity;
      var list = isMobile ? originals : Array.prototype.slice.call(track.children);
      for (var i = 0; i < list.length; i++) {
        var node = list[i];
        var r = node.getBoundingClientRect();
        var mid = r.left + r.width * 0.5;
        var d = Math.abs(mid - target);
        if (d < bestDist) {
          bestDist = d;
          var raw = node.getAttribute('data-hbw-orig-idx');
          var idx = raw != null ? parseInt(raw, 10) : 0;
          if (isNaN(idx)) idx = 0;
          bestIdx = idx;
        }
      }
      var displayIndex = (bestIdx % totalItems + totalItems) % totalItems;
      var nextText = formatCounter(displayIndex + 1, totalItems);
      if (counterEl && counterEl.textContent !== nextText) {
        counterEl.textContent = nextText;
      }
    }

    function updateProgress() {
      if (!progressBar || !gallery) return;
      if (!isMobile) {
        var span = desktopCycleWidth || 1;
        var mod = ((desktopVirtualX % span) + span) % span;
        var pct = Math.min(100, Math.max(0, (mod / span) * 100));
        progressBar.style.width = pct + '%';
        return;
      }
      var b = getScrollBounds();
      if (b.span <= 0) {
        progressBar.style.width = '0%';
        return;
      }
      var pct2 = ((offsetX - b.minX) / b.span) * 100;
      pct2 = Math.min(100, Math.max(0, pct2));
      progressBar.style.width = pct2 + '%';
    }

    function applyTransform() {
      track.style.transform =
        'translate3d(' + Math.round(offsetX * 100) / 100 + 'px, -50%, 0)';
    }

    function cancelRewind() {
      if (!isRewinding) return;
      isRewinding = false;
      if (rewindRafId) {
        cancelAnimationFrame(rewindRafId);
        rewindRafId = null;
      }
    }

    function isAtEnd() {
      var b = getScrollBounds();
      if (b.span <= 0) return false;
      return offsetX <= b.minX + CONFIG.endEpsilonPx;
    }

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function startRewindToStart() {
      if (!isMobile) return;
      if (isRewinding || isDragging || !track || !gallery) return;
      var b = getScrollBounds();
      if (b.span <= 0) return;
      if (!isAtEnd()) return;

      var targetX = b.maxX;
      if (Math.abs(offsetX - targetX) < 0.5) return;

      cancelRewind();
      isRewinding = true;
      velocity = 0;
      stopAnimation();

      var from = offsetX;

      function finishRewind() {
        offsetX = targetX;
        clampOffsetAndVelocity();
        applyTransform();
        updateProgress();
        syncIndexFromViewport();
        isRewinding = false;
        rewindRafId = null;
      }

      if (reduceMotion) {
        finishRewind();
        return;
      }

      var t0 = window.performance && window.performance.now ? window.performance.now() : Date.now();
      var dur = CONFIG.rewindDurationMs;

      function rewindStep(now) {
        if (!isRewinding || isDragging) {
          cancelRewind();
          if (!isDragging) startAnimation();
          return;
        }
        var elapsed = now - t0;
        var t = Math.min(1, elapsed / dur);
        var e = easeInOutCubic(t);
        offsetX = from + (targetX - from) * e;
        applyTransform();
        updateProgress();
        syncIndexFromViewport();
        if (t >= 1) {
          finishRewind();
          return;
        }
        rewindRafId = requestAnimationFrame(rewindStep);
      }

      rewindRafId = requestAnimationFrame(rewindStep);
    }

    function tick() {
      if (!track || !gallery) {
        rafId = null;
        return;
      }

      if (isRewinding) {
        rafId = null;
        return;
      }

      var deskDrift =
        !isMobile && !reduceMotion && CONFIG.desktopAutoDrift > 0.0001
          ? CONFIG.desktopAutoDrift
          : 0;
      var mobDrift =
        isMobile && !reduceMotion && !mobileUserInteracted && CONFIG.mobileAutoDrift > 0.0001
          ? CONFIG.mobileAutoDrift
          : 0;

      if (!isDragging) {
        desktopVirtualX += velocity + deskDrift;
        offsetX += velocity + deskDrift + mobDrift;
        velocity *= reduceMotion ? 0.88 : CONFIG.friction;
      } else {
        velocity *= reduceMotion ? 0.88 : CONFIG.friction;
      }

      if (isMobile) {
        clampOffsetAndVelocity();
      } else {
        applyDesktopRecycle();
      }
      applyTransform();
      updateProgress();

      var now = window.performance && window.performance.now ? window.performance.now() : Date.now();
      if (!lastIndexSync || now - lastIndexSync >= indexSyncIntervalMs) {
        syncIndexFromViewport();
        lastIndexSync = now;
      }

      if (!isDragging && Math.abs(velocity) < CONFIG.idleVelocityEpsilon) {
        velocity = 0;
        if (deskDrift > 0.0001) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        if (mobDrift > 0.0001) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        rafId = null;
        if (isMobile && isAtEnd()) {
          startRewindToStart();
        }
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    function startAnimation() {
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function stopAnimation() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function onResizeImmediate() {
      isMobile = window.innerWidth <= 767;
      updateVH();
      cancelRewind();
      gapPx = parseGapPx(track);
      if (isMobile) {
        stripLegacyClones(track);
        clampOffsetAndVelocity();
      } else {
        ensureDesktopClones();
        applyDesktopRecycle();
      }
      updateProgress();
      lastIndexSync = 0;
      syncIndexFromViewport();
      applyTransform();
    }

    handlers.wheel = function (e) {
      if (isMobile) return;
      cancelRewind();
      var dx = e.deltaX || 0;
      var dy = e.deltaY || 0;
      if (!Math.abs(dx) && !Math.abs(dy)) return;
      // Use the dominant wheel axis and normalize sign for horizontal motion:
      // - trackpads often report mostly dy for "natural" horizontal intent
      // - dx is used when it's clearly a horizontal gesture
      var delta = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
      if (!delta) return;
      e.preventDefault();
      e.stopPropagation();
      var wm = reduceMotion ? CONFIG.wheelMultiplier * 0.45 : CONFIG.wheelMultiplier;
      velocity += delta * wm;
      var maxV = (gallery.clientWidth || 1) * CONFIG.flingMaxFactor;
      if (velocity > maxV) velocity = maxV;
      if (velocity < -maxV) velocity = -maxV;
      startAnimation();
    };
    gallery.addEventListener('wheel', handlers.wheel, { passive: false });

    handlers.pointerdown = function (e) {
      var interactive = e.target.closest('a, button, input, textarea, select');
      if (interactive) return;

      cancelRewind();
      if (isMobile) mobileUserInteracted = true;

      var video = e.target.closest('video');
      if (video && video.controls) {
        var rect = video.getBoundingClientRect();
        var clickY = e.clientY - rect.top;
        if (clickY > rect.height * 0.8) return;
      }

      isDragging = true;
      dragStartX = e.clientX || 0;
      dragStartY = e.clientY || 0;
      dragStartOffset = offsetX;
      dragStartVirtual = desktopVirtualX;
      gallery.classList.add('is-dragging');

      lastPointerClientX = dragStartX;
      lastPointerClientY = dragStartY;
      lastPointerTime = Date.now();
      flingVx = 0;
      flingVy = 0;
      velocity = 0;

      lockBodyScroll();

      if (isMobile && e.pointerType === 'touch') {
        e.preventDefault();
      }

      var mediaElement = e.target.closest('video, audio');
      if (mediaElement) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.pointerId !== undefined) {
        try {
          track.setPointerCapture(e.pointerId);
        } catch (err) {}
      }

      startAnimation();
    };

    handlers.pointermove = function (e) {
      if (!isDragging) return;

      var clientX = e.clientX || 0;
      var clientY = e.clientY || 0;
      var dx = clientX - dragStartX;
      var dy = clientY - dragStartY;
      var now = Date.now();

      if (isMobile) {
        offsetX = dragStartOffset + dx - dy * CONFIG.mobileDyScale;
      } else {
        offsetX = dragStartOffset + dx;
        desktopVirtualX = dragStartVirtual + dx;
      }

      var dt = now - lastPointerTime;
      if (dt > 0 && dt < 100) {
        flingVx = ((clientX - lastPointerClientX) / dt) * 16;
        flingVy = ((clientY - lastPointerClientY) / dt) * 16;
      }
      lastPointerClientX = clientX;
      lastPointerClientY = clientY;
      lastPointerTime = now;

      e.preventDefault();
      if (isMobile) {
        clampOffsetAndVelocity();
      } else {
        applyDesktopRecycle();
      }
      applyTransform();
      updateProgress();
      syncIndexFromViewport();
    };

    handlers.pointerup = function (e) {
      if (!isDragging) return;
      isDragging = false;
      gallery.classList.remove('is-dragging');
      unlockBodyScroll();

      if (!reduceMotion && Date.now() - lastPointerTime < 56) {
        var fv = flingVx - (isMobile ? flingVy * CONFIG.mobileDyScale : 0);
        velocity = fv * CONFIG.flingMul;
        var maxF = (gallery.clientWidth || window.innerWidth || 1) * CONFIG.flingMaxFactor;
        if (velocity > maxF) velocity = maxF;
        if (velocity < -maxF) velocity = -maxF;
      }

      if (isMobile) {
        clampOffsetAndVelocity();
      } else {
        applyDesktopRecycle();
      }

      if (!isMobile && gallery.getAttribute('data-hbw-clone-pending') === '1') {
        requestAnimationFrame(function () {
          ensureDesktopClones();
          applyDesktopRecycle();
          updateProgress();
          lastIndexSync = 0;
          syncIndexFromViewport();
        });
      }

      startAnimation();

      if (e.pointerId !== undefined) {
        try {
          track.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    };

    handlers.pointercancel = handlers.pointerup;

    track.addEventListener('pointerdown', handlers.pointerdown);
    track.addEventListener('pointermove', handlers.pointermove);
    track.addEventListener('pointerup', handlers.pointerup);
    track.addEventListener('pointercancel', handlers.pointercancel);
    window.addEventListener('pointerup', handlers.pointerup);

    if ('ontouchmove' in window) {
      handlers.touchmoveGlobal = function (e) {
        if (isDragging) e.preventDefault();
      };
      window.addEventListener('touchmove', handlers.touchmoveGlobal, { passive: false });
    }

    handlers.resize = function () {
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(function () {
        resizeDebounceTimer = null;
        onResizeImmediate();
      }, CONFIG.resizeDebounceMs);
    };
    window.addEventListener('resize', handlers.resize);

    handlers.orientationchange = function () {
      window.setTimeout(onResizeImmediate, 120);
    };
    window.addEventListener('orientationchange', handlers.orientationchange);

    if (window.visualViewport) {
      handlers.vvResize = function () {
        updateVH();
      };
      window.visualViewport.addEventListener('resize', handlers.vvResize);
    }

    handlers.counterHide = function () {
      if (counterEl) counterEl.classList.add('is-hidden');
    };
    handlers.counterShow = function () {
      if (counterEl) counterEl.classList.remove('is-hidden');
    };
    window.addEventListener('hbw:counter-hide', handlers.counterHide);
    window.addEventListener('hbw:counter-show', handlers.counterShow);

    handlers.navClick = function (e) {
      var sel = (window.HBW_NAV && window.HBW_NAV.counterHide) || '';
      if (!sel) return;
      var navClick = e.target.closest(sel);
      if (navClick && counterEl) counterEl.classList.add('is-hidden');
    };
    document.addEventListener('click', handlers.navClick);

    handlers.vis = function () {
      if (document.hidden) {
        cancelRewind();
        stopAnimation();
        updateProgress();
        unlockBodyScroll();
      } else {
        startAnimation();
      }
    };
    document.addEventListener('visibilitychange', handlers.vis);

    function destroy() {
      cancelRewind();
      stopAnimation();
      unlockBodyScroll();
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
        resizeDebounceTimer = null;
      }
      if (trackResizeObserver) {
        try {
          trackResizeObserver.disconnect();
        } catch (e) {}
        trackResizeObserver = null;
      }
      gallery.removeEventListener('wheel', handlers.wheel);
      track.removeEventListener('pointerdown', handlers.pointerdown);
      track.removeEventListener('pointermove', handlers.pointermove);
      track.removeEventListener('pointerup', handlers.pointerup);
      track.removeEventListener('pointercancel', handlers.pointercancel);
      window.removeEventListener('pointerup', handlers.pointerup);
      if (handlers.touchmoveGlobal) {
        window.removeEventListener('touchmove', handlers.touchmoveGlobal);
      }
      window.removeEventListener('resize', handlers.resize);
      window.removeEventListener('orientationchange', handlers.orientationchange);
      if (window.visualViewport && handlers.vvResize) {
        window.visualViewport.removeEventListener('resize', handlers.vvResize);
      }
      window.removeEventListener('hbw:counter-hide', handlers.counterHide);
      window.removeEventListener('hbw:counter-show', handlers.counterShow);
      document.removeEventListener('click', handlers.navClick);
      document.removeEventListener('visibilitychange', handlers.vis);
      if (progressWrap && progressWrap.parentNode) {
        progressWrap.parentNode.removeChild(progressWrap);
      }
      if (counterEl && counterEl.parentNode) {
        counterEl.parentNode.removeChild(counterEl);
      }
      stripLegacyClones(track);
      gallery.removeAttribute('data-hbw-gallery-init');
    }

    gallery._hbwDestroy = destroy;

    updateVH();
    prepareTrackMedia(track, function () {
      updateVH();
      isMobile = window.innerWidth <= 767;
      gapPx = parseGapPx(track);
      ensureDesktopClones();
      applyDesktopRecycle();
      updateProgress();
      lastIndexSync = 0;
      syncIndexFromViewport();
      applyTransform();

      if (window.ResizeObserver) {
        try {
          trackResizeObserver = new ResizeObserver(function () {
            clearTimeout(resizeDebounceTimer);
            resizeDebounceTimer = setTimeout(function () {
              resizeDebounceTimer = null;
              onResizeImmediate();
            }, CONFIG.resizeDebounceMs);
          });
          trackResizeObserver.observe(track);
        } catch (err) {
          trackResizeObserver = null;
        }
      }

      startAnimation();
    });
  }

  function waitForGallery(attemptsLeft) {
    var nodes = document.querySelectorAll('.project-gallery');
    if (nodes.length) {
      for (var i = 0; i < nodes.length; i++) {
        initOneGallery(nodes[i]);
      }
    } else if (attemptsLeft > 0) {
      requestAnimationFrame(function () {
        waitForGallery(attemptsLeft - 1);
      });
    }
  }

  function mountAllGalleries() {
    var nodes = document.querySelectorAll('.project-gallery');
    if (!nodes.length) return;
    for (var i = 0; i < nodes.length; i++) initOneGallery(nodes[i]);
  }

  window.HBWGalleryCounter = {
    fadeOut: function () {
      window.dispatchEvent(new CustomEvent('hbw:counter-hide'));
    },
    hide: function () {
      window.dispatchEvent(new CustomEvent('hbw:counter-hide'));
    },
    show: function () {
      window.dispatchEvent(new CustomEvent('hbw:counter-show'));
    }
  };

  updateVH();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      updateVH();
      waitForGallery(CONFIG.maxInitAttempts);
      mountAllGalleries();
    });
  } else {
    updateVH();
    waitForGallery(CONFIG.maxInitAttempts);
    mountAllGalleries();
  }

  function onSwupGalleryLayout() {
    updateVH();
    mountAllGalleries();
  }

  document.addEventListener('page:swup-complete', onSwupGalleryLayout, false);
  document.addEventListener('swup:page:view', onSwupGalleryLayout, false);

  try {
    new MutationObserver(function () {
      mountAllGalleries();
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  window.addEventListener('beforeunload', function () {
    var all = document.querySelectorAll('.project-gallery[data-hbw-gallery-init="1"]');
    for (var i = 0; i < all.length; i++) {
      if (all[i]._hbwDestroy) {
        try {
          all[i]._hbwDestroy();
        } catch (e) {}
      }
    }
  });
})();