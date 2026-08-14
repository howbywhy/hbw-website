(function () {
  'use strict';

  // If this snippet gets injected multiple times (common in Webflow/Swup setups),
  // duplicate listeners will cause repeated fade cycles (visible flicker).
  var __initKey = '__hbwArchiveGalleryFadeInitV1';
  if (window[__initKey]) {
    return;
  }
  window[__initKey] = true;

  var SEL = '.archive-gallery__world > .archive-gallery-item';
  var C_FADE = 'archive-gallery-item--hbw-fade';
  var C_VIS = 'archive-gallery-item--hbw-fade-visible';

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function getItems() {
    return document.querySelectorAll(SEL);
  }

  /** Fade out (leaving current page). */
  function fadeArchiveItemsOut() {
    var list = getItems();
    if (!list.length) return;

    for (var i = 0; i < list.length; i++) {
      list[i].classList.add(C_FADE);
      list[i].classList.remove(C_VIS);
      list[i].style.setProperty('--hbw-af-i', '0');
    }

    if (prefersReducedMotion()) return;

    void list[0].offsetWidth;
  }

  var fadeInRaf = 0;
  var fadeInDebounce = null;
  var FADE_IN_DEBOUNCE_MS = 28;

  /** Fade in (after Swup / DOM is ready). Inner double rAF waits for archive layout. */
  function fadeArchiveItemsIn() {
    if (fadeInRaf) cancelAnimationFrame(fadeInRaf);
    fadeInRaf = requestAnimationFrame(function () {
      fadeInRaf = requestAnimationFrame(function () {
        fadeInRaf = 0;
        var list = getItems();
        if (!list.length) return;

        var rm = prefersReducedMotion();

        for (var i = 0; i < list.length; i++) {
          list[i].classList.remove(C_VIS);
          list[i].classList.add(C_FADE);
          list[i].style.setProperty('--hbw-af-i', String(rm ? 0 : i));
        }

        void list[0].offsetWidth;

        for (var j = 0; j < list.length; j++) {
          list[j].classList.add(C_VIS);
        }
      });
    });
  }

  /** Coalesce swup:page:view + page:swup-complete in the same tick / close together. */
  function scheduleFadeIn(evtName) {
    if (fadeInDebounce) clearTimeout(fadeInDebounce);
    fadeInDebounce = setTimeout(function () {
      fadeInDebounce = null;
      fadeArchiveItemsIn();
    }, FADE_IN_DEBOUNCE_MS);
  }

  function onVisitStart() {
    fadeArchiveItemsOut();
  }

  function onVisitAbort() {
    if (fadeInDebounce) {
      clearTimeout(fadeInDebounce);
      fadeInDebounce = null;
    }
    fadeArchiveItemsIn();
  }

  document.addEventListener('swup:visit:start', onVisitStart, false);
  document.addEventListener('swup:visit:abort', onVisitAbort, false);

  document.addEventListener('page:swup-complete', function () { scheduleFadeIn('page:swup-complete'); }, false);
  document.addEventListener('swup:page:view', function () { scheduleFadeIn('swup:page:view'); }, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scheduleFadeIn('DOMContentLoaded'); }, false);
  } else {
    scheduleFadeIn('inline');
  }
})();