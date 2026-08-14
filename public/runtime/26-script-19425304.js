(function () {
  'use strict';

  // Prevent duplicate embeds (but allow retrigger on Swup view).
  if (window.__HBW_PROJECTS_INDEX_SHELL__) {
    try {
      if (typeof window.__HBW_PROJECTS_INDEX_ENTER__ === 'function') window.__HBW_PROJECTS_INDEX_ENTER__();
    } catch (e) {}
    return;
  }
  window.__HBW_PROJECTS_INDEX_SHELL__ = true;

  var NAV_LEAVE =
    window.HBW_NAV && window.HBW_NAV.leave
      ? window.HBW_NAV.leave
      : '.hbw-back, .hbw-bottom-back';

  var C_BOOT = 'hbw-pgc-booting';
  var C_VIS = 'hbw-pgc-visible';
  var C_LEAVE = 'hbw-pgc-leaving';

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function getPortfolioPanel() {
    return document.querySelector('.home-page-portfolio');
  }

  function enter() {
    var el = getPortfolioPanel();
    if (!el || !el.isConnected) return;
    el.classList.add('hbw-panel');

    if (prefersReducedMotion()) {
      el.classList.remove(C_BOOT, C_LEAVE);
      el.classList.add(C_VIS);
      return;
    }

    el.classList.add(C_BOOT);
    el.classList.remove(C_VIS);
    el.classList.remove(C_LEAVE);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!el.isConnected) return;
        el.classList.remove(C_BOOT);
        el.classList.add(C_VIS);
        el.classList.remove(C_LEAVE);
      });
    });
  }

  function liftOutOfSwupForLeave(el) {
    if (!el || el.dataset.hbwPgcLeaveLayer) return;
    var swupEl = document.querySelector('.swup');
    if (!swupEl || !swupEl.contains(el)) return;
    var rect = el.getBoundingClientRect();
    el.dataset.hbwPgcLeaveLayer = '1';
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

  function leave() {
    if (prefersReducedMotion()) return;
    var el = getPortfolioPanel();
    if (!el || !el.isConnected) return;
    el.classList.add('hbw-panel');
    liftOutOfSwupForLeave(el);
    requestAnimationFrame(function () {
      if (!el.isConnected) return;
      el.classList.remove(C_VIS);
      el.classList.add(C_LEAVE);
    });
  }

  window.__HBW_PROJECTS_INDEX_ENTER__ = enter;

  document.addEventListener('swup:visit:start', leave, false);
  document.addEventListener('swup:visit:abort', enter, false);
  document.addEventListener('page:swup-complete', enter, false);
  document.addEventListener('swup:page:view', enter, false);

  document.addEventListener(
    'click',
    function (event) {
      var t = event.target;
      if (!t || !t.closest) return;
      if (NAV_LEAVE && t.closest(NAV_LEAVE)) leave();
    },
    true
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enter, false);
  } else {
    enter();
  }
})();