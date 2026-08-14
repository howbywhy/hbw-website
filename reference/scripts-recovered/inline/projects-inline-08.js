(function () {
  'use strict';

  // Prevent duplicate listener binding (common with Webflow embeds + Swup).
  var __initKey = '__hbwDescriptionFadeInitV3';
  if (window[__initKey]) return;
  window[__initKey] = true;

  var SEL =
    '[id="HBW-description" i], [class~="HBW-description" i],' +
    '[id="hbw-description" i], [class~="hbw-description" i],' +
    '[id="contact-info" i], [class~="contact-info" i]';
  var C_VIS = 'hbw-descfade-visible';
  var fadeInDebounce = null;
  var FADE_IN_DEBOUNCE_MS = 28;
  var isLeaving = false;
  var observer = null;

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function getTargets() {
    return document.querySelectorAll(SEL);
  }

  function anyMissingVisibleClass(list) {
    for (var i = 0; i < list.length; i++) {
      if (!list[i].classList.contains(C_VIS)) return true;
    }
    return false;
  }

  function fadeOut() {
    isLeaving = true;
    var els = getTargets();
    if (!els.length) return;
    for (var i = 0; i < els.length; i++) {
      els[i].classList.remove(C_VIS);
    }
    if (prefersReducedMotion()) return;
    void els[0].offsetWidth;
  }

  function fadeIn() {
    if (isLeaving) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (isLeaving) return;
        var els = getTargets();
        if (!els.length) return;
        if (!anyMissingVisibleClass(els)) return;

        for (var i = 0; i < els.length; i++) {
          els[i].classList.remove(C_VIS);
        }
        void els[0].offsetWidth;
        for (var j = 0; j < els.length; j++) {
          els[j].classList.add(C_VIS);
        }
      });
    });
  }

  function scheduleFadeIn() {
    if (fadeInDebounce) clearTimeout(fadeInDebounce);
    fadeInDebounce = setTimeout(function () {
      fadeInDebounce = null;
      fadeIn();
    }, FADE_IN_DEBOUNCE_MS);
  }

  function onEnterSignal() {
    isLeaving = false;
    scheduleFadeIn();
  }

  function ensureObserver() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver(function () {
      if (isLeaving) return;
      var els = getTargets();
      if (!els.length) return;
      if (!anyMissingVisibleClass(els)) return;
      scheduleFadeIn();
    });
    try {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
      observer = null;
    }
  }

  // Swup lifecycle (this is how your site actually changes pages).
  document.addEventListener('swup:visit:start', fadeOut, false);
  document.addEventListener('swup:visit:abort', onEnterSignal, false);
  document.addEventListener('page:swup-complete', onEnterSignal, false);
  document.addEventListener('swup:page:view', onEnterSignal, false);
  // Some installs fire intermediate replace/end events; safe to treat as “enter signal”.
  document.addEventListener('swup:content:replace', onEnterSignal, false);
  document.addEventListener('swup:visit:end', onEnterSignal, false);

  // Your other page embeds dispatch these on leave; hook them too.
  document.addEventListener('about:leave', fadeOut, false);
  document.addEventListener('manifesto:leave', fadeOut, false);
  // Home drawer (folder tab) dispatches this in its global binder.
  document.addEventListener('hbw:folder-leave', fadeOut, false);

  /*
    Fallback: folder-tab links can stop propagation / navigate in ways that don’t always
    yield swup events early enough for the fade. Mirror the folder-tab capture strategy:
    fade OUT on eligible link clicks inside .folder-tab-container, but never prevent navigation.
  */
  document.addEventListener(
    'click',
    function (e) {
      try {
        if (e.defaultPrevented) return;
        if (typeof e.button === 'number' && e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var t = e.target;
        if (!t || !t.closest) return;
        if (!t.closest('.folder-tab-container')) return;

        // Webflow “Link Block” commonly uses .project-link-block; also support real anchors.
        var linkBlock = t.closest('.project-link-block');
        var a = t.closest('a[href]');
        if (!linkBlock && !a) return;

        // Hash-only jumps shouldn't fade-out.
        var href = a && a.getAttribute ? a.getAttribute('href') : null;
        if (href && href.trim().charAt(0) === '#') return;

        fadeOut();
      } catch (err) {}
    },
    true
  );

  // First load / bfcache.
  window.addEventListener('pageshow', function () {
    isLeaving = false;
    fadeOut(); // establishes hidden baseline if targets already exist
    isLeaving = false;
    ensureObserver();
    scheduleFadeIn();
  }, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      isLeaving = false;
      fadeOut();
      isLeaving = false;
      ensureObserver();
      scheduleFadeIn();
    }, false);
  } else {
    isLeaving = false;
    fadeOut();
    isLeaving = false;
    ensureObserver();
    scheduleFadeIn();
  }
})();