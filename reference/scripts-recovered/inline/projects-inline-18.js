(function () {
  'use strict';
  /*
    Prevent duplicate embeds from double-binding listeners, but allow re-running the
    enter scheduling on Swup navigations where the DOM was replaced.
  */
  if (window.__HBW_PROJECT_GALLERY_SECTION_C__) {
    try {
      if (typeof window.__HBW_PGC_SCHEDULE_ENTER__ === 'function') window.__HBW_PGC_SCHEDULE_ENTER__();
    } catch (e) {}
    return;
  }
  window.__HBW_PROJECT_GALLERY_SECTION_C__ = true;

  /** Single source for nav class lists — edit window.HBW_NAV in SECTION B only. */
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

  function primeProjectsPortfolioShell() {
    try {
      if (prefersReducedMotion()) return;
      var path = normPath(window.location && window.location.pathname);
      if (!isProjectsIndex(path)) return;
      var el = document.querySelector('.home-page-portfolio');
      if (!el || !el.isConnected) return;
      el.classList.add('hbw-panel');
      el.classList.add(C_BOOT);
      el.classList.remove(C_VIS);
      el.classList.remove(C_LEAVE);
    } catch (e) {}
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
    if (!el || !el.isConnected) {
      try {
        document.documentElement.classList.remove('hbw-project-page-loading');
      } catch (e) {}
      return;
    }

    if (el.classList.contains(C_VIS) && !el.classList.contains(C_LEAVE) && !el.classList.contains(C_BOOT)) {
      try {
        document.documentElement.classList.remove('hbw-project-page-loading');
      } catch (e) {}
      return;
    }

    el.classList.add('hbw-panel');
    el.classList.add(C_BOOT);
    el.classList.remove(C_VIS);
    el.classList.remove(C_LEAVE);
    releaseBootAndShow(el);
  }

  var MEDIA_WAIT_MS = 10000;

  function mediaOnce(el, ev, fn, opts) {
    if (!el || !el.addEventListener) return;
    var o = opts || {};
    el.addEventListener(ev, fn, Object.assign({ once: true }, o));
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
        mediaOnce(img, 'load', doneOne);
        mediaOnce(img, 'error', doneOne);
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
        mediaOnce(v, 'loadeddata', doneOne);
        mediaOnce(v, 'canplay', doneOne);
        mediaOnce(v, 'error', doneOne);
        try {
          if (!v.getAttribute('preload')) v.setAttribute('preload', 'auto');
          if (v.load) v.load();
        } catch (e) {}
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

  function waitForFontsReady() {
    try {
      if (document.fonts && document.fonts.ready) return document.fonts.ready;
    } catch (e) {}
    return Promise.resolve();
  }

  function waitForProjectReady(done) {
    if (prefersReducedMotion()) {
      done();
      return;
    }
    var scope = getProjectMediaScope();
    var safety = window.setTimeout(done, MEDIA_WAIT_MS);
    Promise.all([
      waitForImages(scope, MEDIA_WAIT_MS),
      waitForVideos(scope, MEDIA_WAIT_MS),
      waitForFontsReady()
    ])
      .catch(function () {})
      .then(function () {
        window.clearTimeout(safety);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              done();
            });
          });
        });
      });
  }

  function armProjectLoadingBlurEarly() {
    try {
      if (isProjectDetail(normPath(window.location && window.location.pathname))) {
        document.documentElement.classList.add('hbw-project-page-loading');
      }
    } catch (e) {}
  }

  function onIncomingProjectVisit(e) {
    try {
      var toUrl = null;
      if (e && e.detail) {
        if (e.detail.to && e.detail.to.url) toUrl = e.detail.to.url;
        else if (e.detail.visit && e.detail.visit.to && e.detail.visit.to.url)
          toUrl = e.detail.visit.to.url;
      }
      if (toUrl) {
        var p = normPath(new URL(toUrl, location.origin).pathname);
        if (isProjectDetail(p)) document.documentElement.classList.add('hbw-project-page-loading');
      }
    } catch (err) {}
  }

  function scheduleEnter() {
    try {
      if (typeof window.__HBW_updateVH__ === 'function') window.__HBW_updateVH__();
    } catch (e) {}
    scheduleSeq++;
    var seq = scheduleSeq;
    var path = normPath(window.location && window.location.pathname);

    if (isProjectDetail(path)) {
      primeProjectDetailShell();
    }

    function runInit() {
      if (seq !== scheduleSeq) return;
      requestAnimationFrame(function () {
        if (seq !== scheduleSeq) return;
        requestAnimationFrame(function () {
          if (seq !== scheduleSeq) return;
          initGalleryShell();
        });
      });
    }

    function clearLoadingAndRun() {
      runInit();
    }

    if (isProjectDetail(path)) {
      waitForProjectReady(function () {
        if (seq !== scheduleSeq) return;
        clearLoadingAndRun();
      });
    } else {
      document.documentElement.classList.remove('hbw-project-page-loading');
      runInit();
    }
  }
  // Expose scheduleEnter so duplicate embeds can safely retrigger enter logic.
  window.__HBW_PGC_SCHEDULE_ENTER__ = scheduleEnter;

  function liftPgcOutOfSwupForLeave(c) {
    if (!c || c.dataset.hbwPgcLeaveLayer) return;
    var swupEl = document.querySelector('.swup');
    if (!swupEl || !swupEl.contains(c)) return;
    var rect = c.getBoundingClientRect();
    c.dataset.hbwPgcLeaveLayer = '1';
    c._hbwPgcRestoreParent = c.parentNode;
    c._hbwPgcRestoreNext = c.nextSibling;
    document.body.appendChild(c);
    c.style.position = 'fixed';
    c.style.top = rect.top + 'px';
    c.style.left = rect.left + 'px';
    c.style.width = rect.width + 'px';
    c.style.height = rect.height + 'px';
    c.style.margin = '0';
    c.style.boxSizing = 'border-box';
    c.style.zIndex = '9999999990';
    c.style.pointerEvents = 'none';
  }

  function restorePgcLiftIfNeeded(c) {
    if (!c || !c.dataset.hbwPgcLeaveLayer) return;
    var par = c._hbwPgcRestoreParent;
    var next = c._hbwPgcRestoreNext;
    delete c._hbwPgcRestoreParent;
    delete c._hbwPgcRestoreNext;
    c.removeAttribute('data-hbw-pgc-leave-layer');
    c.style.cssText = '';
    if (par && par.isConnected) {
      try {
        par.insertBefore(c, next && next.parentNode === par ? next : null);
      } catch (e) {
        par.appendChild(c);
      }
    }
  }

  function cleanupLiftedPgcNodes() {
    document.querySelectorAll('[data-hbw-pgc-leave-layer]').forEach(function (n) {
      n.remove();
    });
  }

  function startLeaveOnly() {
    scheduleSeq++;
    if (prefersReducedMotion()) return;
    var el = getActivePanelForCurrentRoute();
    if (!el || !el.isConnected) return;
    el.classList.add('hbw-panel');
    liftPgcOutOfSwupForLeave(el);
    requestAnimationFrame(function () {
      if (!el.isConnected) return;
      el.classList.remove(C_VIS);
      el.classList.add(C_LEAVE);
    });
  }

  function onVisitStart() {
    startLeaveOnly();
  }

  function onVisitAbort() {
    scheduleSeq++;
    document.documentElement.classList.remove('hbw-project-page-loading');
    var el = getActivePanelForCurrentRoute();
    if (!el || !el.isConnected) return;
    restorePgcLiftIfNeeded(el);

    if (prefersReducedMotion()) {
      el.classList.remove(C_BOOT, C_LEAVE);
      el.classList.add(C_VIS);
      return;
    }

    el.classList.remove(C_LEAVE);
    el.classList.add(C_VIS);
  }

  primeProjectsPortfolioShell();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', primeProjectsPortfolioShell, false);
  }

  document.addEventListener('swup:visit:start', onIncomingProjectVisit, false);
  document.addEventListener('swup:visit:start', onVisitStart, false);
  document.addEventListener('swup:visit:abort', onVisitAbort, false);

  if (!window.__HBW_PGC_PROJECT_LINK__) {
    window.__HBW_PGC_PROJECT_LINK__ = true;
    document.addEventListener(
      'click',
      function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        var a = t.closest('a[href]');
        if (!a) return;
        try {
          var u = new URL(a.href, location.origin);
          if (u.origin !== location.origin) return;
          var tp = normPath(u.pathname);
          if (isProjectDetail(tp)) document.documentElement.classList.add('hbw-project-page-loading');
        } catch (e) {}
      },
      true
    );
  }
  document.addEventListener('page:swup-complete', scheduleEnter, false);
  document.addEventListener('swup:page:view', scheduleEnter, false);
  document.addEventListener('page:swup-complete', cleanupLiftedPgcNodes, false);
  document.addEventListener('about:leave', startLeaveOnly, false);
  document.addEventListener('manifesto:leave', startLeaveOnly, false);

  if (!window.__HBW_PGC_NAV_CLICK__) {
    window.__HBW_PGC_NAV_CLICK__ = true;
    document.addEventListener(
      'click',
      function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        if (NAV_LEAVE && t.closest(NAV_LEAVE)) startLeaveOnly();
      },
      true
    );
  }

  function onPageShow(ev) {
    var el = getActivePanelForCurrentRoute();
    if (!el || !el.isConnected) return;
    if (!ev.persisted) return;
    el.classList.add('hbw-panel');
    el.classList.add(C_BOOT);
    el.classList.remove(C_LEAVE);
    el.classList.remove(C_VIS);
    releaseBootAndShow(el);
  }

  window.addEventListener('pageshow', onPageShow, false);

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        armProjectLoadingBlurEarly();
        primeProjectsPortfolioShell();
        scheduleEnter();
      },
      false
    );
  } else {
    armProjectLoadingBlurEarly();
    primeProjectsPortfolioShell();
    scheduleEnter();
  }
})();