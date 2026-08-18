(function () {
  'use strict';

  var ATTR = 'data-archive-world-init';
  var DRAG_PX = 12;
  var LB_SWIPE = 50;

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function seeded01(i, salt) {
    var x = Math.sin(i * 12.9898 + salt * 78.233 + 42.1234) * 43758.5453;
    return x - Math.floor(x);
  }

  function isWebGLSupported() {
    try {
      var canvas = document.createElement('canvas');
      var gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!(gl && gl.getParameter);
    } catch (e) {
      return false;
    }
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function worldSlideEl(world, target) {
    var t = target;
    while (t && t !== world) {
      if (
        t.classList &&
        t.classList.contains('archive-gallery-item')
      )
        return t;
      t = t.parentElement;
    }
    return null;
  }

  function buildLightboxMarkup(root) {
    var lb = document.createElement('div');
    lb.className = 'archive-gallery__lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML =
      '<button type="button" class="archive-gallery__lightbox-backdrop" aria-label="Close gallery"></button>' +
      '<button type="button" class="archive-gallery__lightbox-close" aria-label="Close">(X)</button>' +
      '<div class="archive-gallery__lightbox-inner">' +
      '<div class="archive-gallery__lightbox-stage"></div>' +
      '<div class="archive-gallery__lightbox-thumbs" aria-label="Gallery thumbnails"></div>' +
      '</div>';
    document.body.appendChild(lb);
    return lb;
  }

  function restoreStageMedia(stage) {
    if (!stage) return;
    try {
      var node = stage.__mainMediaNode;
      if (!node) return;
      var parent = stage.__mainMediaOrigParent;
      var next = stage.__mainMediaOrigNext;
      if (parent) {
        if (next && next.parentNode === parent) parent.insertBefore(node, next);
        else parent.appendChild(node);
      }
    } catch (e) {}
    stage.__mainMediaNode = null;
    stage.__mainMediaOrigParent = null;
    stage.__mainMediaOrigNext = null;
  }

  function fillStage(stage, el) {
    // Important: move existing embed nodes into the lightbox (prevents re-loading iframes)
    restoreStageMedia(stage);
    stage.innerHTML = '';

    if (!el) return;

    var tag = el.tagName && el.tagName.toLowerCase();
    var node = null;

    if (
      tag === 'img' ||
      tag === 'video' ||
      tag === 'iframe' ||
      tag === 'embed' ||
      tag === 'object'
    ) {
      node = el;
    } else if (el.querySelector) {
      node = el.querySelector('img,video,iframe,embed,object');
    }

    if (!node) {
      var wrap = document.createElement('div');
      wrap.className = 'archive-gallery__lightbox-html';
      wrap.innerHTML = el.innerHTML || '';
      stage.appendChild(wrap);
      return;
    }

    try {
      stage.__mainMediaNode = node;
      stage.__mainMediaOrigParent = node.parentNode;
      stage.__mainMediaOrigNext = node.nextSibling;
    } catch (e2) {}

    // Apply sizing guarantees so content doesn't distort.
    try {
      var ntag = node.tagName && node.tagName.toLowerCase();
      if (ntag === 'img') {
        node.style.maxWidth = '100%';
        node.style.maxHeight = '100%';
        node.style.objectFit = 'contain';
        node.style.margin = '0 auto';
        node.style.width = 'auto';
        node.style.height = 'auto';
      } else if (ntag === 'video') {
        // Preserve the embed's intent (autoplay/muted/loop/playsinline) and do NOT force controls.
        node.removeAttribute('controls');
        node.style.maxWidth = '100%';
        node.style.maxHeight = '100%';
        node.style.width = 'auto';
        node.style.height = 'auto';
        node.style.objectFit = 'contain';
      } else if (ntag === 'iframe' || ntag === 'embed' || ntag === 'object') {
        node.style.width = '100%';
        node.style.height = '100%';
        node.style.maxWidth = '100%';
        node.style.border = '0';
        node.style.background = 'transparent';
      }
    } catch (e3) {}

    stage.appendChild(node);
    // Re-trigger playback after moving into the lightbox (Safari/iOS can pause on DOM moves).
    try {
      var ntag2 = node.tagName && node.tagName.toLowerCase();
      if (ntag2 === 'video') {
        if (node.muted !== true) node.muted = true;
        if (node.playsInline !== true) node.playsInline = true;
        try {
          node.classList.remove('archive-lightbox-landscape');
        } catch (e0) {}
        var p = node.play && node.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      } else if (ntag2 === 'img') {
        try {
          node.classList.remove('archive-lightbox-landscape');
          if (node.naturalWidth && node.naturalHeight && node.naturalWidth > node.naturalHeight) {
            node.classList.add('archive-lightbox-landscape');
          }
        } catch (e1) {}
      }
    } catch (e4) {}
  }

  function initGallery(root) {
    if (!root || root.getAttribute(ATTR) === '1') return;
    var kids = [];
    for (var ci = 0; ci < root.children.length; ci++) {
      var ch = root.children[ci];
      var tag = ch.tagName ? ch.tagName.toUpperCase() : '';
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      if (ch.classList && ch.classList.contains('archive-gallery__viewport')) continue;
      if (
        !ch.classList ||
        !ch.classList.contains('archive-gallery-item')
      )
        continue;
      kids.push(ch);
    }
    if (!kids.length) return;

    root.setAttribute(ATTR, '1');
    root.classList.add('archive-world');

    var viewport = document.createElement('div');
    viewport.className = 'archive-gallery__viewport';
    var world = document.createElement('div');
    world.className = 'archive-gallery__world';

    for (var i = 0; i < kids.length; i++) {
      world.appendChild(kids[i]);
    }
    viewport.appendChild(world);
    root.appendChild(viewport);

    var hint = document.createElement('p');
    hint.className = 'archive-gallery__hint';
    hint.textContent = 'Drag to rotate · Tap';
    root.appendChild(hint);

    // Olafur-like fallback overlay when WebGL isn't available.
    // (The gallery uses CSS 3D, but this matches the reference overlay behavior.)
    var webglOverlay = document.createElement('div');
    webglOverlay.className = 'archive-gallery__webgl-overlay';
    webglOverlay.setAttribute('role', 'status');
    webglOverlay.setAttribute('aria-live', 'polite');
    webglOverlay.innerHTML =
      '<div class="archive-gallery__webgl-card">' +
      '<h2 class="archive-gallery__webgl-title">This archive requires WebGL, which your browser or graphics card does not seem to support</h2>' +
      '<p class="archive-gallery__webgl-body">' +
      'Please click here for more details, or return to the homepage. Please check back soon.' +
      '</p>' +
      '<div class="archive-gallery__webgl-actions">' +
      '<a class="archive-gallery__webgl-link" href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer">Please click here for more details</a>' +
      '<a class="archive-gallery__webgl-return" href="/">Return to homepage</a>' +
      '</div>' +
      '</div>';
    root.appendChild(webglOverlay);

    if (!isWebGLSupported()) {
      webglOverlay.classList.add('is-open');
    }

    var lb = buildLightboxMarkup(root);
    var lbStage = lb.querySelector('.archive-gallery__lightbox-stage');
    var lbCount = lb.querySelector('.archive-gallery__lightbox-counter');
    var lbThumbsWrap = lb.querySelector('.archive-gallery__lightbox-thumbs');
    var lbBackdrop = lb.querySelector('.archive-gallery__lightbox-backdrop');
    var lbClose = lb.querySelector('.archive-gallery__lightbox-close');

    var lbIndex = 0;
    var lbOpen = false;
    var prevOverflow = '';
    var lbThumbButtons = [];
    var lbKids = [];
    var lbToKidsIndex = [];
    var kidsToLbIndex = [];
    for (var k0 = 0; k0 < kids.length; k0++) kidsToLbIndex[k0] = -1;
    for (var k1 = 0; k1 < kids.length; k1++) {
      if (isSignatureSlide(kids[k1])) continue;
      kidsToLbIndex[k1] = lbKids.length;
      lbToKidsIndex.push(k1);
      lbKids.push(kids[k1]);
    }

    function thumbSrcForSlide(slide) {
      try {
        var img = slide && slide.querySelector ? slide.querySelector('img') : null;
        if (!img) return '';
        return img.currentSrc || img.getAttribute('src') || '';
      } catch (e) {
        return '';
      }
    }

    function buildThumbs() {
      if (!lbThumbsWrap) return;
      lbThumbsWrap.innerHTML = '';
      lbThumbButtons = [];
      for (var li = 0; li < lbKids.length; li++) {
        var i = lbToKidsIndex[li];

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'archive-gallery__lightbox-thumb';
        btn.setAttribute('aria-label', 'Open item ' + String(li + 1));
        btn.dataset.lbIndex = String(li);

        var src = thumbSrcForSlide(lbKids[li]);
        if (src) {
          var im = document.createElement('img');
          im.src = src;
          im.alt = '';
          btn.appendChild(im);
        } else {
          // Try a video thumbnail (muted looping) for code-embed videos.
          var vid = null;
          try {
            vid = lbKids[li] && lbKids[li].querySelector ? lbKids[li].querySelector('video') : null;
          } catch (e0) {
            vid = null;
          }
          var vsrc = '';
          try {
            if (vid) vsrc = vid.currentSrc || vid.getAttribute('src') || '';
          } catch (e1) {
            vsrc = '';
          }
          if (vsrc) {
            var tv = document.createElement('video');
            tv.src = vsrc;
            tv.muted = true;
            tv.loop = true;
            tv.playsInline = true;
            tv.autoplay = true;
            tv.preload = 'metadata';
            tv.setAttribute('playsinline', '');
            tv.style.width = '100%';
            tv.style.height = '100%';
            tv.style.objectFit = 'cover';
            btn.appendChild(tv);
            try {
              var p = tv.play && tv.play();
              if (p && typeof p.catch === 'function') p.catch(function () {});
            } catch (e2) {}
          } else {
            var sp = document.createElement('span');
            sp.setAttribute('aria-hidden', 'true');
            btn.appendChild(sp);
          }
        }

        (function (idx) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            showLightboxAt(idx);
          });
        })(li);

        lbThumbsWrap.appendChild(btn);
        lbThumbButtons[li] = btn;
      }
    }

    buildThumbs();

    function setLbOpen(open) {
      if (open === lbOpen) return;
      lbOpen = open;
      if (open) {
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        try {
          document.body.classList.add('archive-lightbox-open');
        } catch (e) {}
      } else {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = prevOverflow;
        try {
          document.body.classList.remove('archive-lightbox-open');
        } catch (e) {}
        if (lbStage) {
          // Pause any playing videos before we move/clear nodes.
          var vids = lbStage.querySelectorAll('video');
          for (var vi = 0; vi < vids.length; vi++) {
            try {
              vids[vi].pause();
            } catch (e0) {}
          }
        }
        // Restore moved embed/media nodes back into the gallery.
        restoreStageMedia(lbStage);
        try {
          if (lbStage) lbStage.innerHTML = '';
        } catch (e1) {}
      }
    }

    function showLightboxAt(index) {
      if (!lbKids.length) return;
      lbIndex = (index % lbKids.length + lbKids.length) % lbKids.length;
      var slideEl = lbKids[lbIndex];

      // Open the overlay immediately so we can compute target rects.
      setLbOpen(true);

      if (lbCount) lbCount.textContent = String(lbIndex + 1) + ' / ' + String(lbKids.length);
      fillStage(lbStage, slideEl);

      if (lbThumbButtons && lbThumbButtons[lbIndex]) {
        for (var ti = 0; ti < lbThumbButtons.length; ti++) {
          if (lbThumbButtons[ti]) lbThumbButtons[ti].classList.remove('is-active');
        }
        centerActiveThumb(true);
      }
    }

    var thumbSnapTimer = null;
    function centerActiveThumb(smooth) {
      try {
        if (!lbThumbsWrap || !lbThumbButtons || !lbThumbButtons[lbIndex]) return;
        var btn = lbThumbButtons[lbIndex];
        var target =
          btn.offsetLeft + btn.offsetWidth / 2 - lbThumbsWrap.clientWidth / 2;
        var max = lbThumbsWrap.scrollWidth - lbThumbsWrap.clientWidth;
        if (max < 0) max = 0;
        if (target < 0) target = 0;
        if (target > max) target = max;
        lbThumbsWrap.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
      } catch (e) {}
    }

    if (lbThumbsWrap) {
      lbThumbsWrap.addEventListener(
        'scroll',
        function () {
          if (!lbOpen) return;
          if (thumbSnapTimer) window.clearTimeout(thumbSnapTimer);
          thumbSnapTimer = window.setTimeout(function () {
            thumbSnapTimer = null;
            // After user scrolls, gently pull back to the active thumb.
            centerActiveThumb(true);
          }, 260);
        },
        { passive: true }
      );
    }

    var ghostEl = null;
    function animateTileToLightbox(slideEl) {
      try {
        if (ghostEl && ghostEl.parentNode) ghostEl.remove();
        ghostEl = null;
      } catch (e) {}

      if (!lbStage) return;

      // Hide stage while animating.
      try {
        lbStage.style.transition = 'none';
        lbStage.style.opacity = '0';
      } catch (e2) {}

      var initial = slideEl && slideEl.getBoundingClientRect ? slideEl.getBoundingClientRect() : null;
      var target = lbStage.getBoundingClientRect ? lbStage.getBoundingClientRect() : null;
      if (!initial || !target || initial.width <= 0 || initial.height <= 0 || target.width <= 0 || target.height <= 0) {
        try {
          lbStage.style.transition = 'opacity 420ms ' + 'cubic-bezier(0.42,0,0.58,1)';
          lbStage.style.opacity = '1';
        } catch (e3) {}
        return;
      }

      // Only do the "ghost" morph for images. Embeds/iframes can be expensive/unreliable to clone.
      var imgEl = null;
      try {
        if (slideEl && slideEl.tagName && slideEl.tagName.toLowerCase() === 'img') imgEl = slideEl;
        else if (slideEl && slideEl.querySelector) imgEl = slideEl.querySelector('img');
      } catch (e4) {}

      var duration = 520;
      var ease = 'cubic-bezier(0.42,0,0.58,1)';

      if (!imgEl) {
        // Fallback: fade stage in.
        try {
          lbStage.style.transition = 'opacity ' + duration + 'ms ' + ease;
          requestAnimationFrame(function () {
            lbStage.style.opacity = '1';
          });
        } catch (e5) {}
        return;
      }

      var src = imgEl.currentSrc || imgEl.getAttribute('src') || '';
      if (!src) {
        try {
          lbStage.style.transition = 'opacity ' + duration + 'ms ' + ease;
          requestAnimationFrame(function () {
            lbStage.style.opacity = '1';
          });
        } catch (e6) {}
        return;
      }

      ghostEl = document.createElement('img');
      ghostEl.setAttribute('aria-hidden', 'true');
      ghostEl.src = src;
      ghostEl.alt = '';
      ghostEl.style.position = 'absolute';
      ghostEl.style.left = initial.left + 'px';
      ghostEl.style.top = initial.top + 'px';
      ghostEl.style.width = initial.width + 'px';
      ghostEl.style.height = initial.height + 'px';
      ghostEl.style.objectFit = 'contain';
      ghostEl.style.margin = '0';
      ghostEl.style.pointerEvents = 'none';
      ghostEl.style.zIndex = '1';
      ghostEl.style.border = '0';
      ghostEl.style.borderRadius = '0';
      lb.appendChild(ghostEl);

      var initCx = initial.left + initial.width / 2;
      var initCy = initial.top + initial.height / 2;
      var tgtCx = target.left + target.width / 2;
      var tgtCy = target.top + target.height / 2;
      var dx = tgtCx - initCx;
      var dy = tgtCy - initCy;
      var sx = target.width / initial.width;
      var sy = target.height / initial.height;

      // Fade stage in as the ghost morphs.
      try {
        lbStage.style.transition = 'opacity ' + duration + 'ms ' + ease;
        requestAnimationFrame(function () {
          lbStage.style.opacity = '1';
        });
      } catch (e7) {}

      try {
        var anim = ghostEl.animate(
          [
            { transform: 'translate(0px, 0px) scale(1)' },
            { transform: 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')' }
          ],
          { duration: duration, easing: ease, fill: 'forwards' }
        );
        anim.onfinish = function () {
          try {
            if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);
          } catch (e8) {}
          ghostEl = null;
        };
      } catch (e9) {
        // If animations API fails, just fade.
        try {
          ghostEl.remove();
        } catch (e10) {}
        ghostEl = null;
      }
    }

    function closeLightbox() {
      setLbOpen(false);
    }

    function nextSlide() {
      showLightboxAt(lbIndex + 1);
    }

    function prevSlide() {
      showLightboxAt(lbIndex - 1);
    }

    if (lbBackdrop) lbBackdrop.addEventListener('click', closeLightbox);
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    // No arrow buttons; navigation is via wheel/click-sides/swipe.

    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    // Click left/right side to navigate (desktop + mobile).
    if (lbStage) lbStage.addEventListener('click', function (e) {
      if (!lbOpen) return;
      if (e.target && e.target.closest && e.target.closest('.archive-gallery__lightbox-thumbs')) return;
      if (e.target && e.target.closest && e.target.closest('.archive-gallery__lightbox-close')) return;
      var rect = lbStage.getBoundingClientRect();
      var x = e.clientX - rect.left;
      if (x < rect.width / 2) prevSlide();
      else nextSlide();
    });

    // Wheel/trackpad scroll to navigate (desktop).
    var lastWheelAt = 0;
    lb.addEventListener(
      'wheel',
      function (e) {
        if (!lbOpen) return;
        var now = Date.now();
        if (now - lastWheelAt < 220) return;
        // Ignore wheel over thumbs (user may be scrolling the strip).
        try {
          if (lbThumbsWrap && e.target && lbThumbsWrap.contains(e.target)) return;
        } catch (e0) {}
        var dy = e.deltaY || 0;
        if (Math.abs(dy) < 2) return;
        lastWheelAt = now;
        if (dy > 0) nextSlide();
        else prevSlide();
        e.preventDefault();
      },
      { passive: false }
    );

    function onKeyDown(ev) {
      if (!lbOpen) return;
      if (ev.key === 'Escape') {
        closeLightbox();
        ev.preventDefault();
      } else if (ev.key === 'ArrowRight') {
        nextSlide();
        ev.preventDefault();
      } else if (ev.key === 'ArrowLeft') {
        prevSlide();
        ev.preventDefault();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    var lastInteractionWasDrag = false;
    var lastInteractionWasDragUntil = 0;

    var swipeX0 = 0;
    var swipeT0 = 0;
    var lbThumbTouching = false;
    lb.addEventListener(
      'touchstart',
      function (e) {
        if (!lbOpen || e.touches.length !== 1) return;
        try {
          lbThumbTouching =
            !!(lbThumbsWrap && e.target && lbThumbsWrap.contains(e.target));
        } catch (e2) {
          lbThumbTouching = false;
        }
        if (lbThumbTouching) return;
        swipeX0 = e.touches[0].clientX;
        swipeT0 = Date.now();
      },
      { passive: true }
    );
    lb.addEventListener(
      'touchend',
      function (e) {
        if (!lbOpen || !e.changedTouches.length) return;
        if (lbThumbTouching) {
          lbThumbTouching = false;
          return;
        }
        var dx = e.changedTouches[0].clientX - swipeX0;
        var dt = Date.now() - swipeT0;
        if (dt < 600 && Math.abs(dx) > LB_SWIPE) {
          if (dx < 0) nextSlide();
          else prevSlide();
        }
        lbThumbTouching = false;
      },
      { passive: true }
    );

    var n = kids.length;
    var spreadX = 420 + Math.min(320, n * 10);
    /* Tighter vertical spread + tilt fix keeps the field visually centered (less “half off screen”) */
    var spreadY = 220 + Math.min(180, n * 6);
    var spreadZ = 340 + Math.min(420, n * 14);

    // Store the "placement" transform so we can re-apply it with an inverse rotation
    // (billboarding) to keep every tile facing the camera.
    var baseTransforms = new Array(kids.length);

    function isSignatureSlide(el) {
      try {
        if (el && el.id && String(el.id).toLowerCase() === 'signature') return true;
        // Preferred: explicit signature marker inside the slide (e.g. code embed SVG wrapper).
        if (el && el.querySelector && el.querySelector('.signature')) return true;
        if (el && el.classList && el.classList.contains('signature')) return true;

        var hay = '';
        if (el && el.getAttribute) {
          hay += ' ' + (el.getAttribute('data-archive-key') || '');
          hay += ' ' + (el.getAttribute('aria-label') || '');
        }
        var im = el && el.querySelector ? el.querySelector('img') : null;
        if (im && im.getAttribute) {
          hay += ' ' + (im.getAttribute('alt') || '');
          hay += ' ' + (im.getAttribute('src') || '');
          hay += ' ' + (im.currentSrc || '');
        }
        var v = el && el.querySelector ? el.querySelector('video') : null;
        if (v && v.getAttribute) {
          hay += ' ' + (v.getAttribute('src') || '');
          hay += ' ' + (v.currentSrc || '');
        }
        hay = (hay || '').toLowerCase();
        return hay.indexOf('hbw-signature') !== -1;
      } catch (e) {
        return false;
      }
    }

    var signatureIdx = -1;
    for (var si2 = 0; si2 < kids.length; si2++) {
      if (isSignatureSlide(kids[si2])) {
        signatureIdx = si2;
        break;
      }
    }
    if (signatureIdx < 0) signatureIdx = 0;

    function sizeSlideToMedia(el) {
      if (!el) return;
      var maxW = Math.min(320, (window.innerWidth || 1200) * 0.42);
      var maxH = Math.min(420, (window.innerHeight || 800) * 0.52);
      var w = 260;
      var h = 340;
      try {
        var img = el.querySelector ? el.querySelector('img') : null;
        if (img && img.naturalWidth && img.naturalHeight) {
          w = img.naturalWidth;
          h = img.naturalHeight;
        } else {
          var vid = el.querySelector ? el.querySelector('video') : null;
          if (vid && vid.videoWidth && vid.videoHeight) {
            w = vid.videoWidth;
            h = vid.videoHeight;
          }
        }
      } catch (e) {}

      var scale = Math.min(maxW / w, maxH / h);
      scale = Math.max(0.2, Math.min(1, scale));
      var outW = Math.max(120, Math.round(w * scale));
      var outH = Math.max(120, Math.round(h * scale));

      try {
        el.style.width = outW + 'px';
        el.style.height = outH + 'px';
      } catch (e2) {}
    }

    for (var szi = 0; szi < kids.length; szi++) {
      sizeSlideToMedia(kids[szi]);
    }

    for (var j = 0; j < kids.length; j++) {
      var el = kids[j];
      // Re-anchor all randomness around HBW-signature so it is always the center piece.
      var k = j;
      if (k === signatureIdx) k = 0;
      else if (k < signatureIdx) k = k + 1;
      var sx = (seeded01(k, 1) - 0.5) * 2 * spreadX;
      var sy = (seeded01(k, 2) - 0.5) * 2 * spreadY;
      var sz = (seeded01(k, 3) - 0.5) * 2 * spreadZ;
      var rot = (seeded01(j, 4) - 0.5) * 14;

      if (j === signatureIdx) {
        sx = 0;
        sy = 0;
        sz = 0;
        rot = 0;
        try {
          el.style.zIndex = '5';
        } catch (e2) {}
      } else {
        try {
          el.style.zIndex = '1';
        } catch (e3) {}
      }

      baseTransforms[j] =
        'translate3d(' +
        sx.toFixed(2) +
        'px,' +
        sy.toFixed(2) +
        'px,' +
        sz.toFixed(2) +
        'px) translate(-50%, -50%) rotateZ(' +
        rot.toFixed(2) +
        'deg)';

      el.style.transform = baseTransforms[j];
      el.style.transformOrigin = 'center center';

      // Prevent native drag ghosting / "pulling" assets out of the page.
      try {
        el.setAttribute('draggable', 'false');
        var imgs = el.querySelectorAll ? el.querySelectorAll('img') : [];
        for (var di = 0; di < imgs.length; di++) {
          imgs[di].setAttribute('draggable', 'false');
        }
        var vids = el.querySelectorAll ? el.querySelectorAll('video') : [];
        for (var dv = 0; dv < vids.length; dv++) {
          vids[dv].setAttribute('draggable', 'false');
        }
      } catch (e4) {}
    }

    // Re-size once images/videos have metadata (prevents empty wrapper rectangles on load).
    try {
      window.setTimeout(function () {
        for (var szi2 = 0; szi2 < kids.length; szi2++) sizeSlideToMedia(kids[szi2]);
      }, 60);
    } catch (e5) {}

    // Explicit tap/click support for each slide.
    // (Some browsers suppress click after touch/pointer interactions, so we also open on pointerup already.)
    for (var si = 0; si < kids.length; si++) {
      (function (index) {
        var slide = kids[index];
        slide.addEventListener(
          'click',
          function (e) {
            // If the user was dragging, ignore the synthetic click.
            if (Date.now() <= lastInteractionWasDragUntil && lastInteractionWasDrag) return;
            if (lbOpen || pinchMode) return;
            if (isSignatureSlide(slide)) return;
            e.preventDefault();
            e.stopPropagation();
            var li = kidsToLbIndex[index];
            if (li < 0) return;
            showLightboxAt(li);
          },
          true
        );
      })(si);
    }

    var isMobile = window.innerWidth <= 767;
    var rotX = 0;
    var rotY = 0;
    // Start slightly zoomed out (cleaner overview).
    var zoom = 0.72;
    var velRX = 0;
    var velRY = 0;
    var reduceMotion = prefersReducedMotion();
    var rotYScale = isMobile ? 0.26 : 0.35;
    var rotXScale = isMobile ? 0.16 : 0.28;

    function wrapDeg(v) {
      v = v % 360;
      if (v > 180) v -= 360;
      if (v < -180) v += 360;
      return v;
    }

    function applyWorldTransform() {
      world.style.transform =
        'translate(-50%, calc(-50% - 4vh)) translateZ(0) scale(' +
        zoom.toFixed(4) +
        ') rotateX(' +
        rotX.toFixed(3) +
        'deg) rotateY(' +
        rotY.toFixed(3) +
        'deg)';

      // Billboard effect: counter-rotate each tile so it always faces the viewer,
      // while the world rotation still moves the tiles in 3D space.
      var faceRX = -rotX;
      var faceRY = -rotY;
      for (var i = 0; i < kids.length; i++) {
        kids[i].style.transform =
          baseTransforms[i] +
          ' rotateY(' +
          faceRY.toFixed(3) +
          'deg) rotateX(' +
          faceRX.toFixed(3) +
          'deg)';
      }
    }

    applyWorldTransform();

    function ensureMinHeight() {
      try {
        var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        var h = root.getBoundingClientRect().height;
        if (h < 160) {
          root.style.minHeight = Math.max(vh, 400) + 'px';
        }
      } catch (e) {}
    }

    ensureMinHeight();
    requestAnimationFrame(function () {
      requestAnimationFrame(ensureMinHeight);
    });
    window.addEventListener('resize', ensureMinHeight, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      try {
        var ro = new ResizeObserver(ensureMinHeight);
        ro.observe(root);
      } catch (e2) {}
    }

    var dragging = false;
    var panning = false;
    var ptrId = null;
    var lastX = 0;
    var lastY = 0;
    var lastT = 0;
    var downX = 0;
    var downY = 0;
    var downClientX = 0;
    var downClientY = 0;
    var pointerDownSlide = null;

    var pinchMode = false;
    var pinchStartDist = 0;
    var pinchStartZoom = 1;

    function pointerToLocal(ev) {
      var r = viewport.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height };
    }

    function onPointerDown(ev) {
      if (lbOpen) return;
      if (ev.button !== undefined && ev.button !== 0) return;
      if (viewport.setPointerCapture) {
        try {
          viewport.setPointerCapture(ev.pointerId);
        } catch (e) {}
      }
      dragging = true;
      panning = false;
      lastInteractionWasDrag = false;
      ptrId = ev.pointerId;
      var p = pointerToLocal(ev);
      lastX = p.x;
      lastY = p.y;
      downX = p.x;
      downY = p.y;
      downClientX = ev.clientX;
      downClientY = ev.clientY;
      lastT = typeof ev.timeStamp === 'number' ? ev.timeStamp : Date.now();
      velRX = 0;
      velRY = 0;

      // If the tap started inside an iframe/embed, the pointerup event target
      // may not exist in the parent DOM. Capture the slide on pointerdown and
      // reuse it on pointerup.
      try {
        pointerDownSlide = worldSlideEl(world, ev.target);
      } catch (e2) {
        pointerDownSlide = null;
      }
    }

    function dist(a, b) {
      var dx = a.clientX - b.clientX;
      var dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onPointerMove(ev) {
      if (lbOpen) return;
      if (pinchMode) return;

      if (!dragging || ev.pointerId !== ptrId) return;

      var p = pointerToLocal(ev);
      var moveFromDown = Math.sqrt(
        (p.x - downX) * (p.x - downX) + (p.y - downY) * (p.y - downY)
      );
      if (!panning && moveFromDown >= DRAG_PX) {
        panning = true;
        lastInteractionWasDrag = true;
        lastInteractionWasDragUntil = Date.now() + 300;
        root.classList.add('is-dragging');
      }

      if (!panning) return;

      var dx = p.x - lastX;
      var dy = p.y - lastY;
      var now = typeof ev.timeStamp === 'number' ? ev.timeStamp : Date.now();
      var dt = Math.max(8, now - lastT);

      rotY += dx * rotYScale;
      rotX -= dy * rotXScale;
      rotX = wrapDeg(rotX);
      rotY = wrapDeg(rotY);

      velRY = (dx * rotYScale) / dt * 16;
      velRX = (-dy * rotXScale) / dt * 16;

      lastX = p.x;
      lastY = p.y;
      lastT = now;
      applyWorldTransform();
      ev.preventDefault();
    }

    function tryOpenClick(ev) {
      if (panning) return;
      var move = Math.sqrt(
        (ev.clientX - downClientX) * (ev.clientX - downClientX) +
          (ev.clientY - downClientY) * (ev.clientY - downClientY)
      );
      if (move >= DRAG_PX) return;

      var item = pointerDownSlide || worldSlideEl(world, ev.target);
      if (!item) return;
      var idx = kids.indexOf(item);
      if (idx < 0) return;
      var li = kidsToLbIndex[idx];
      if (li < 0) return;
      showLightboxAt(li);
    }

    function endDrag(ev) {
      if (ev.pointerId !== ptrId && ptrId !== null) return;
      if (!dragging) return;
      var wasPanning = panning;
      dragging = false;
      ptrId = null;
      root.classList.remove('is-dragging');
      if (!lbOpen && !pinchMode) tryOpenClick(ev);
      panning = false;
      pointerDownSlide = null;
      // On mobile we want no "elastic" fling after release.
      if (isMobile || !wasPanning) {
        velRX = 0;
        velRY = 0;
      }
      if (isMobile && raf) {
        try {
          cancelAnimationFrame(raf);
        } catch (e0) {}
        raf = null;
      }
    }

    function onWheel(ev) {
      if (lbOpen) return;
      var delta = ev.deltaY;
      if (ev.deltaMode === 1) delta *= 16;
      else if (ev.deltaMode === 2) delta *= 400;
      var factor = Math.exp(-delta * 0.0018);
      zoom = clamp(zoom * factor, 0.35, 3.2);
      applyWorldTransform();
      ev.preventDefault();
    }

    viewport.addEventListener('pointerdown', onPointerDown, { passive: false });
    viewport.addEventListener('pointermove', onPointerMove, { passive: false });
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', function (ev) {
      if (ev.pointerType === 'mouse') endDrag(ev);
    });
    viewport.addEventListener(
      'wheel',
      onWheel,
      { passive: false }
    );

    function onTouchStart(ev) {
      if (lbOpen) return;
      if (ev.touches.length === 2) {
        pinchMode = true;
        pinchStartDist = dist(ev.touches[0], ev.touches[1]);
        pinchStartZoom = zoom;
        dragging = false;
        panning = false;
        ptrId = null;
        root.classList.remove('is-dragging');
        velRX = 0;
        velRY = 0;
        ev.preventDefault();
      }
    }

    function onTouchMove(ev) {
      if (lbOpen) return;
      if (ev.touches.length === 1 && !pinchMode) {
        ev.preventDefault();
        return;
      }
      if (ev.touches.length === 2 && pinchStartDist > 0) {
        var d = dist(ev.touches[0], ev.touches[1]);
        zoom = clamp(pinchStartZoom * (d / pinchStartDist), 0.35, 3.2);
        applyWorldTransform();
        ev.preventDefault();
      }
    }

    function onTouchEnd(ev) {
      if (ev.touches.length < 2) {
        pinchStartDist = 0;
        pinchMode = false;
      }
    }

    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);
    viewport.addEventListener('touchcancel', onTouchEnd);

    var raf = null;
    function tick() {
      raf = null;
      if (dragging || reduceMotion) return;
      var damp = 0.92;
      if (Math.abs(velRX) < 0.02) velRX = 0;
      else {
        rotX += velRX;
        velRX *= damp;
      }
      if (Math.abs(velRY) < 0.02) velRY = 0;
      else {
        rotY += velRY;
        velRY *= damp;
      }
      rotX = wrapDeg(rotX);
      rotY = wrapDeg(rotY);
      if (velRX !== 0 || velRY !== 0) applyWorldTransform();
      if (velRX !== 0 || velRY !== 0) {
        raf = requestAnimationFrame(tick);
      }
    }

    function kickInertia() {
      if (reduceMotion) return;
      if (!raf) raf = requestAnimationFrame(tick);
    }

    if (!isMobile) {
      viewport.addEventListener('pointerup', kickInertia);
      viewport.addEventListener('pointercancel', kickInertia);
    }

    function onResize() {
      applyWorldTransform();
    }
    window.addEventListener('resize', onResize, { passive: true });
  }

  function boot() {
    var list = document.querySelectorAll('.archive-gallery');
    for (var i = 0; i < list.length; i++) {
      initGallery(list[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();