(function () {
  'use strict';
  /*
    This block must always ensure LEAVE handlers are bound.
    Some pages may already have initialized the shared shell logic; in that case we
    retrigger enter scheduling but we do NOT early-return before binding leave.
  */
  var alreadyInit = !!window.__HBW_PROJECT_GALLERY_SECTION_C__;
  if (!alreadyInit) window.__HBW_PROJECT_GALLERY_SECTION_C__ = true;

  var NAV_LEAVE =
    window.HBW_NAV && window.HBW_NAV.leave
      ? window.HBW_NAV.leave
      : '.hbw-back, .hbw-bottom-back';

  var C_BOOT = 'hbw-pgc-booting';
  var C_VIS = 'hbw-pgc-visible';
  var C_LEAVE = 'hbw-pgc-leaving';

  var scheduleSeq = 0;

  function normPath(p) {
    p = (p || '/').trim();
    p = p.replace(/[?#].*$/, '');
    p = p.replace(/\/+$/, '') || '/';
    return p;
  }

  function isProjectsIndex(path) {
    return path === '/projects' || path === '/project';
  }

  function isProjectDetail(path) {
    if (path.indexOf('/projects/') === 0 && path !== '/projects') return true;
    if (path.indexOf('/project/') === 0 && path !== '/project') return true;
    return false;
  }

  function getActivePanelForCurrentRoute() {
    var path = normPath(window.location && window.location.pathname);
    if (isProjectDetail(path)) {
      return (
        document.querySelector('.project-gallery-section') ||
        document.querySelector('.project-page-gallery') ||
        document.querySelector('.project-gallery') ||
        null
      );
    }
    if (isProjectsIndex(path)) {
      return document.querySelector('.home-page-portfolio');
    }
    return document.querySelector('.project-gallery-container');
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function primeProjectDetailShell() {
    try {
      var path = normPath(window.location && window.location.pathname);
      if (!isProjectDetail(path)) return;
      var el = getActivePanelForCurrentRoute();
      if (!el || !el.isConnected) return;
      el.classList.add('hbw-panel');
      el.classList.add(C_BOOT);
      el.classList.remove(C_VIS);
      el.classList.remove(C_LEAVE);
    } catch (e) {}
  }

  function releaseBootAndShow(el) {
    if (!el || !el.isConnected) return;
    el.classList.add('hbw-panel');

    if (prefersReducedMotion()) {
      try {
        document.documentElement.classList.remove('hbw-project-page-loading');
      } catch (e) {}
      el.classList.remove(C_BOOT);
      el.classList.add(C_VIS);
      el.classList.remove(C_LEAVE);
      return;
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!el.isConnected) return;
        try {
          document.documentElement.classList.remove('hbw-project-page-loading');
        } catch (e) {}
        el.classList.remove(C_BOOT);
        el.classList.add(C_VIS);
        el.classList.remove(C_LEAVE);
      });
    });
  }

  function initGalleryShell() {
    var el = getActivePanelForCurrentRoute();
    if (!el || !el.isConnected) return;
    if (el.classList.contains(C_VIS) && !el.classList.contains(C_LEAVE) && !el.classList.contains(C_BOOT)) return;
    el.classList.add('hbw-panel');
    el.classList.add(C_BOOT);
    el.classList.remove(C_VIS);
    el.classList.remove(C_LEAVE);
    releaseBootAndShow(el);
  }

  var MEDIA_WAIT_MS = 10000;
  function waitForFontsReady() {
    try {
      if (document.fonts && document.fonts.ready) return document.fonts.ready;
    } catch (e) {}
    return Promise.resolve();
  }
  function waitForImages(root, deadlineMs) {
    var imgs = Array.prototype.slice.call((root || document).querySelectorAll('img'));
    if (!imgs.length) return Promise.resolve();
    var t0 = Date.now();
    return new Promise(function (resolve) {
      var left = 0;
      function doneOne() {
        left--;
        if (left <= 0) resolve();
      }
      function timeLeft() {
        return Math.max(0, deadlineMs - (Date.now() - t0));
      }
      imgs.forEach(function (img) {
        if (img.complete && img.naturalWidth > 0) return;
        left++;
        img.addEventListener('load', doneOne, { once: true });
        img.addEventListener('error', doneOne, { once: true });
        setTimeout(doneOne, timeLeft());
      });
      if (left <= 0) resolve();
    });
  }
  function waitForVideos(root, deadlineMs) {
    var vids = Array.prototype.slice.call((root || document).querySelectorAll('video'));
    if (!vids.length) return Promise.resolve();
    var t0 = Date.now();
    return new Promise(function (resolve) {
      var left = 0;
      function doneOne() {
        left--;
        if (left <= 0) resolve();
      }
      function timeLeft() {
        return Math.max(0, deadlineMs - (Date.now() - t0));
      }
      vids.forEach(function (v) {
        if (v.readyState >= 2) return;
        left++;
        v.addEventListener('loadeddata', doneOne, { once: true });
        v.addEventListener('canplay', doneOne, { once: true });
        v.addEventListener('error', doneOne, { once: true });
        setTimeout(doneOne, timeLeft());
      });
      if (left <= 0) resolve();
    });
  }
  function getProjectMediaScope() {
    return (
      document.querySelector('.project-gallery-section') ||
      document.querySelector('.project-page-gallery') ||
      document.querySelector('.project-gallery') ||
      document.querySelector('.swup') ||
      document.body
    );
  }
  function waitForProjectReady(done) {
    if (prefersReducedMotion()) return done();
    var scope = getProjectMediaScope();
    var safety = window.setTimeout(done, MEDIA_WAIT_MS);
    Promise.all([waitForImages(scope, MEDIA_WAIT_MS), waitForVideos(scope, MEDIA_WAIT_MS), waitForFontsReady()])
      .catch(function () {})
      .then(function () {
        window.clearTimeout(safety);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            done();
          });
        });
      });
  }

  function scheduleEnter() {
    scheduleSeq++;
    var seq = scheduleSeq;
    var path = normPath(window.location && window.location.pathname);

    if (isProjectDetail(path)) primeProjectDetailShell();

    function runInit() {
      if (seq !== scheduleSeq) return;
      requestAnimationFrame(function () {
        if (seq !== scheduleSeq) return;
        initGalleryShell();
      });
    }

    if (isProjectDetail(path)) {
      waitForProjectReady(function () {
        if (seq !== scheduleSeq) return;
        runInit();
      });
    } else {
      runInit();
    }
  }
  window.__HBW_PGC_SCHEDULE_ENTER__ = scheduleEnter;

  document.addEventListener('page:swup-complete', scheduleEnter, false);
  document.addEventListener('swup:page:view', scheduleEnter, false);

  // Ensure leave swipe runs even when "back" is browser/swup-driven (not a click).
  function liftPgcOutOfSwupForLeave(el) {
    if (!el || el.dataset.hbwPgcLeaveLayer) return;
    var swupEl = document.querySelector('.swup');
    if (!swupEl || !swupEl.contains(el)) return;
    var rect = el.getBoundingClientRect();
    el.dataset.hbwPgcLeaveLayer = '1';
    el._hbwPgcRestoreParent = el.parentNode;
    el._hbwPgcRestoreNext = el.nextSibling;
    document.body.appendChild(el);
    el.style.position = 'fixed';
    el.style.top = rect.top + 'px';
    el.style.left = rect.left + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    el.style.margin = '0';
    el.style.boxSizing = 'border-box';
    el.style.zIndex = '9999999990';
    el.style.pointerEvents = 'none';
  }

  function restoreLift(el) {
    if (!el || !el.dataset.hbwPgcLeaveLayer) return;
    var par = el._hbwPgcRestoreParent;
    var next = el._hbwPgcRestoreNext;
    delete el._hbwPgcRestoreParent;
    delete el._hbwPgcRestoreNext;
    el.removeAttribute('data-hbw-pgc-leave-layer');
    el.style.cssText = '';
    if (par && par.isConnected) {
      try {
        par.insertBefore(el, next && next.parentNode === par ? next : null);
      } catch (e) {
        par.appendChild(el);
      }
    }
  }

  function startLeaveOnly() {
    scheduleSeq++;
    if (prefersReducedMotion()) return;
    var el = getActivePanelForCurrentRoute();
    if (!el || !el.isConnected) return;
    el.classList.add('hbw-panel');
    /*
      Fast clicks can happen while the panel is still in BOOT state (off-canvas with transitions disabled).
      Force a stable visible baseline so the leave swipe always animates instead of flashing off.
    */
    el.classList.remove(C_LEAVE);
    el.classList.remove(C_BOOT);
    el.classList.add(C_VIS);
    liftPgcOutOfSwupForLeave(el);
    requestAnimationFrame(function () {
      if (!el.isConnected) return;
      el.classList.remove(C_VIS);
      el.classList.add(C_LEAVE);
    });
  }

  function shouldLeaveForClick(ev, a) {
    try {
      if (!a || !a.href) return false;
      if (a.hasAttribute('download')) return false;
      if ((a.getAttribute('target') || '').toLowerCase() === '_blank') return false;
      if (ev && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)) return false;
      if (ev && typeof ev.button === 'number' && ev.button !== 0) return false;
      var u = new URL(a.href, location.origin);
      if (u.origin !== location.origin) return false;
      var fromP = normPath(location.pathname);
      var toP = normPath(u.pathname);
      if (fromP === toP && u.hash) return false;
      if (u.href === location.href) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function onVisitAbort() {
    scheduleSeq++;
    var el = getActivePanelForCurrentRoute();
    if (!el || !el.isConnected) return;
    restoreLift(el);
    if (prefersReducedMotion()) return;
    el.classList.remove(C_LEAVE);
    el.classList.add(C_VIS);
  }

  document.addEventListener('swup:visit:start', startLeaveOnly, false);
  document.addEventListener('swup:visit:abort', onVisitAbort, false);

  if (!window.__HBW_PGC_NAV_CLICK__) {
    window.__HBW_PGC_NAV_CLICK__ = true;
    document.addEventListener(
      'click',
      function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        if (NAV_LEAVE && t.closest(NAV_LEAVE)) startLeaveOnly();
        // Any same-origin navigation should swipe the current panel out (gallery links, etc).
        var a = t.closest('a[href]');
        if (a && shouldLeaveForClick(event, a)) startLeaveOnly();
      },
      true
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleEnter, false);
  } else {
    scheduleEnter();
  }
})();