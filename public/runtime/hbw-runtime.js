/* HBW recovered runtime — unique inline scripts, Webflow JS omitted */

/* ---- 01-route-class.js ---- */
(function () {
    try {
      var p = (window.location && window.location.pathname) || '/';
      p = p.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
      if (p === '/') {
        document.documentElement.classList.add('hbw-route-home');
      }
      if (p === '/projects' || p === '/project' || p.indexOf('/projects/') === 0 || p.indexOf('/project/') === 0) {
        document.documentElement.classList.add('hbw-route-projects');
      }
      document.documentElement.classList.toggle('hbw-route-intake-start', p === '/intake/start');
      /*
        If we land directly on a project detail route, ensure the "loading" gate is
        applied before first paint. This prevents the gallery from rendering, then
        immediately being hidden/re-shown by footer scripts (perceived as flashing).
      */
      if ((p.indexOf('/projects/') === 0 && p !== '/projects') || (p.indexOf('/project/') === 0 && p !== '/project')) {
        document.documentElement.classList.add('hbw-project-page-loading');
      }
    } catch (e) {}
  })();;

/* ---- 02-vh.js ---- */
(function () {
  function hbwSetVH() {
    try {
      var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--vh", h * 0.01 + "px");
    } catch (e) {}
  }
  hbwSetVH();
  window.addEventListener("resize", hbwSetVH, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", hbwSetVH, { passive: true });
  window.addEventListener("orientationchange", hbwSetVH, { passive: true });
  window.addEventListener("pageshow", hbwSetVH, { passive: true });
})();;

/* ---- 03-body-fade-init.js ---- */
(function () {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!sessionStorage.getItem("hbw.body.sessionInit")) {
      document.documentElement.classList.add("hbw-body-fade-pending");
    }
  } catch (e) {}
})();;

/* ---- 04-body-fade-init.js ---- */
(function () {
  function finish() {
    try {
      var root = document.documentElement;
      if (root.classList.contains("hbw-body-fade-pending")) {
        requestAnimationFrame(function () {
          root.classList.add("hbw-body-fade-in");
        });
      }
      if (!sessionStorage.getItem("hbw.body.sessionInit")) {
        sessionStorage.setItem("hbw.body.sessionInit", "1");
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finish, { once: true });
  } else {
    finish();
  }
})();;

/* ---- 05-protect-media.js ---- */
document.addEventListener('contextmenu', function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    if (t.closest('img, video, picture')) {
      event.preventDefault();
    }
  });

  document.addEventListener('dragstart', function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    if (t.closest('img, video, picture')) {
      event.preventDefault();
    }
  });;

/* ---- 06-video-playsinline.js ---- */
document.addEventListener('DOMContentLoaded', function () {
    var videos = document.getElementsByTagName('video');
    for (var i = 0; i < videos.length; i++) {
      videos[i].setAttribute('playsinline', '');
      videos[i].setAttribute('muted', '');
    }

    var mediaElements = document.querySelectorAll('img, video');
    mediaElements.forEach(function (media) {
      media.addEventListener('load', function () {
        media.classList.add('loaded');
      });
      if (media.tagName === 'IMG' && media.complete) {
        media.classList.add('loaded');
      }
      media.addEventListener('loadeddata', function () {
        media.classList.add('loaded');
      });
    });
  });;

/* ---- 07-description-fade.js ---- */
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
})();;

/* ---- 08-folder-tab.js ---- */
(function () {
    var BOUND = "__HBW_FOLDER_TAB_SWIPE_BOUND__";
    var LEAVE_NAV_DELAY_MS = 460;
    var FAILSAFE_SHOW_MS = 720;
    var ROW_IO_KEY = "__HBW_FOLDER_TAB_ROW_IO__";
    /** Row must be at least this visible in the viewport before description/note expand (mobile). */
    var ROW_IO_RATIO = 0.28;

    function isLeavingLayer(el) {
      return !!(el && el.getAttribute && el.getAttribute("data-hbw-folder-tab-leave-layer"));
    }

    /** Prefer the instance inside .swup (fresh route HTML), then any other non-leave copy. */
    function getContainer() {
      var all = document.querySelectorAll("#folder-tab-container, .folder-tab-container");
      var swup = document.querySelector(".swup");
      var i;
      for (i = 0; i < all.length; i++) {
        if (isLeavingLayer(all[i])) continue;
        if (swup && swup.contains(all[i])) return all[i];
      }
      for (i = 0; i < all.length; i++) {
        if (!isLeavingLayer(all[i])) return all[i];
      }
      return null;
    }

    function removeStaleBodyFolderTabs(keep) {
      var ch = document.body.children;
      var i;
      for (i = 0; i < ch.length; i++) {
        var n = ch[i];
        if (n === keep) continue;
        if (!n || !n.matches) continue;
        if (!n.matches("#folder-tab-container, .folder-tab-container")) continue;
        if (isLeavingLayer(n)) continue;
        try {
          n.remove();
        } catch (e) {}
      }
    }

    /** Move panel under body so position:fixed is viewport-anchored (Swup uses filter → containing block). */
    function portalFolderTabToBody(container) {
      if (!container || isLeavingLayer(container)) return;
      try {
        if (container.parentNode !== document.body) {
          document.body.appendChild(container);
        }
        removeStaleBodyFolderTabs(container);
        container.style.setProperty("position", "fixed", "important");
        container.style.setProperty("left", "0", "important");
        container.style.setProperty("top", "0", "important");
        container.style.setProperty("right", "auto", "important");
        container.style.setProperty("margin", "0", "important");
        if (!isLeavingLayer(container)) {
          container.style.removeProperty("width");
          container.style.removeProperty("height");
          container.style.removeProperty("pointer-events");
        }
      } catch (e) {}
    }

    /** After Swup swap, drop a stale portaled copy if a new tree arrived inside .swup. */
    function reconcileDuplicateFolderTabs() {
      var swup = document.querySelector(".swup");
      if (!swup) return;
      var fresh = swup.querySelector("#folder-tab-container, .folder-tab-container");
      if (!fresh || isLeavingLayer(fresh)) return;
      removeStaleBodyFolderTabs(fresh);
    }

    function isStudioDockedPage() {
      try {
        var seg = (location.pathname || "").replace(/\/$/, "").split("/").pop();
        return seg === "studio";
      } catch (e) {
        return false;
      }
    }

    function normPath(p) {
      return (p || "/").replace(/\/+$/, "") || "/";
    }

    function isFolderTabShellPage() {
      try {
        var p = normPath(location.pathname);
        if (p === "/" || p === "/home" || p.endsWith("/home")) return true;
      } catch (e1) {}
      if (!isStudioDockedPage()) return false;
      var c = getContainer();
      return !!(c && c.classList.contains("is-visible"));
    }

    function shouldRunLeaveForLink(a) {
      if (!a || !a.getAttribute) return false;
      if (a.target === "_blank") return false;
      var raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return false;
      try {
        var u = new URL(a.href, location.origin);
        if (u.origin !== location.origin) return false;
        return normPath(u.pathname) !== normPath(location.pathname);
      } catch (e2) {
        return false;
      }
    }

    function prefersReduced() {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e) {
        return false;
      }
    }

    function scrollPageToTop() {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      requestAnimationFrame(function () {
        window.scrollTo(0, 0);
        var root = document.scrollingElement || document.documentElement;
        if (root) root.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }

    var releaseGen = 0;

    function teardownFolderRowInView() {
      var prev = window[ROW_IO_KEY];
      if (prev && typeof prev.disconnect === "function") {
        try {
          prev.disconnect();
        } catch (e) {}
      }
      window[ROW_IO_KEY] = null;
      try {
        document.querySelectorAll(".project-link-block.is-hbw-folder-row-inview").forEach(function (el) {
          el.classList.remove("is-hbw-folder-row-inview");
        });
      } catch (e2) {}
    }

    function shouldUseFolderRowInView() {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
        if (!window.matchMedia("(max-width: 767px)").matches) return false;
      } catch (e) {
        return false;
      }
      return typeof IntersectionObserver !== "undefined";
    }

    var folderRowInViewTimer = 0;
    function scheduleFolderRowInView() {
      if (folderRowInViewTimer) clearTimeout(folderRowInViewTimer);
      folderRowInViewTimer = window.setTimeout(function () {
        folderRowInViewTimer = 0;
        initFolderRowInView();
      }, 32);
    }

    function initFolderRowInView() {
      teardownFolderRowInView();
      if (!shouldUseFolderRowInView()) return;
      var tab = getContainer();
      if (!tab || !tab.isConnected) return;
      var list = tab.querySelector(".folder-projects-list");
      if (!list) return;
      var rows = list.querySelectorAll(".project-link-block");
      if (!rows.length) return;
      var th = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.65, 0.8, 1];
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            var link = en.target;
            if (!link || !link.classList) return;
            if (en.isIntersecting && en.intersectionRatio >= ROW_IO_RATIO) link.classList.add("is-hbw-folder-row-inview");
            else link.classList.remove("is-hbw-folder-row-inview");
          });
        },
        { root: null, rootMargin: "0px", threshold: th }
      );
      window[ROW_IO_KEY] = io;
      for (var i = 0; i < rows.length; i++) io.observe(rows[i]);
    }

    function releaseBootAndShow(container) {
      if (!container) return;
      if (prefersReduced()) {
        container.classList.remove("is-booting");
        container.classList.add("is-visible");
        container.classList.remove("is-leaving");
        scheduleFolderRowInView();
        return;
      }
      releaseGen++;
      var rg = releaseGen;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (rg !== releaseGen) return;
          if (!container.isConnected) return;
          container.classList.remove("is-booting");
          container.classList.add("is-visible");
          container.classList.remove("is-leaving");
          scheduleFolderRowInView();
          window.setTimeout(scheduleFolderRowInView, 420);
        });
      });
    }

    function scheduleFailsafeShow(container) {
      if (!container || prefersReduced()) return;
      var el = container;
      window.setTimeout(function () {
        if (!el.isConnected || isLeavingLayer(el)) return;
        if (el.classList.contains("is-leaving")) return;
        if (!el.classList.contains("is-visible")) {
          el.classList.remove("is-booting");
          el.classList.add("is-visible");
        }
        scheduleFolderRowInView();
      }, FAILSAFE_SHOW_MS);
    }

    function liftFolderTabOutOfSwupForLeave(c) {
      if (!c || c.dataset.hbwFolderTabLeaveLayer) return;
      var swupEl = document.querySelector(".swup");
      var inSwup = swupEl && swupEl.contains(c);
      if (!inSwup && (!c.isConnected || !document.documentElement.contains(c))) return;
      var rect = c.getBoundingClientRect();
      c.dataset.hbwFolderTabLeaveLayer = "1";
      document.body.appendChild(c);
      c.style.position = "fixed";
      c.style.top = rect.top + "px";
      c.style.left = rect.left + "px";
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      c.style.margin = "0";
      c.style.boxSizing = "border-box";
      c.style.zIndex = "9999999990";
      c.style.pointerEvents = "none";
    }

    function startLeaveOnly() {
      if (prefersReduced()) return;
      if (isMobileViewport()) {
        try {
          var ts = window.__HBW_LAST_NAV_INTERACTION_TS__ || 0;
          if (ts && Date.now() - ts < 900) return;
        } catch (eTs) {}
      }
      var container = getContainer();
      if (!container) return;
      liftFolderTabOutOfSwupForLeave(container);
      if (!container.isConnected) return;
      container.classList.remove("is-leaving");
      container.classList.remove("is-booting");
      container.classList.add("is-visible");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!container.isConnected) return;
          container.classList.remove("is-visible");
          container.classList.add("is-leaving");
        });
      });
    }

    function safeNavigate(url) {
      try {
        if (window.swup && typeof window.swup.navigate === "function") {
          window.swup.navigate(url);
          return;
        }
      } catch (e) {}
      window.location.href = url;
    }

    var enterGen = 0;

    function isMobileViewport() {
      try {
        return window.matchMedia("(max-width: 767px)").matches;
      } catch (e) {
        return false;
      }
    }

    function isNavElement(t) {
      if (!t || !t.closest) return false;
      if (
        t.closest(".hbw-floatnav, nav, [role='navigation'], .w-nav, .w-nav-button, .w-nav-menu, .navbar, .nav, .menu")
      )
        return true;
      // Fallback: many navs use custom classnames (e.g. "hbw-nav", "top-nav", "mobileMenu").
      // We only use this on mobile to avoid accidental matches elsewhere.
      var el = t;
      for (var i = 0; i < 10 && el; i++) {
        if (el === document.body || el === document.documentElement) break;
        try {
          if (el.tagName === "NAV") return true;
          var role = el.getAttribute && el.getAttribute("role");
          if (role === "navigation") return true;
          var cn = (el.className && String(el.className)) || "";
          if (cn) {
            var s = cn.toLowerCase();
            if (
              s.indexOf("nav") !== -1 ||
              s.indexOf("navbar") !== -1 ||
              s.indexOf("menu") !== -1 ||
              s.indexOf("header") !== -1
            )
              return true;
          }
        } catch (e) {}
        el = el.parentNode;
      }
      return false;
    }

    function isMobileCloseTapTarget(t, container) {
      if (!t || !t.closest) return false;
      if (container && t.closest("#folder-tab-container, .folder-tab-container") === container) return false;
      if (isNavElement(t)) return false;
      if (t.closest(".project-link-block")) return false;
      return true;
    }

    function bindMobileReveal(container) {
      if (!container || prefersReduced()) return;
      if (!isMobileViewport()) return;
      if (window.__HBW_FOLDER_TAB_MOBILE_REVEAL_BOUND__) return;
      window.__HBW_FOLDER_TAB_MOBILE_REVEAL_BOUND__ = true;

      var closeWithoutLeaveLayer = function (c) {
        if (!c || !c.isConnected || isLeavingLayer(c)) return;
        portalFolderTabToBody(c);
        c.classList.remove("is-booting");
        c.classList.remove("is-visible");
        c.classList.add("is-leaving");
        window.__HBW_FOLDER_TAB_MOBILE_REVEALED__ = false;
      };

      var tryOpen = function () {
        if (!isMobileViewport()) return;
        var c = getContainer() || container;
        if (!c || !c.isConnected || isLeavingLayer(c)) return;
        if (c.classList.contains("is-visible")) return;
        window.__HBW_FOLDER_TAB_MOBILE_REVEALED__ = true;
        releaseBootAndShow(c);
      };

      var lastScrollY = (function () {
        try {
          return window.scrollY || 0;
        } catch (e) {
          return 0;
        }
      })();

      var onScroll = function () {
        var y = 0;
        try {
          y = window.scrollY || 0;
        } catch (eY) {}
        if (Math.abs(y - lastScrollY) < 2) return;
        lastScrollY = y;
        tryOpen();
      };

      var touchStartY = 0;
      var touchStartBlocked = false;
      var onTouchStartForOpen = function (ev) {
        if (!isMobileViewport()) return;
        var t = ev && ev.target;
        touchStartBlocked = !!(isNavElement(t) || (t && t.closest && t.closest(".project-link-block")));
        try {
          touchStartY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : 0;
        } catch (eTs) {
          touchStartY = 0;
        }
      };

      var onTouchMoveForOpen = function (ev) {
        if (!isMobileViewport()) return;
        if (touchStartBlocked) return;
        var dy = 0;
        try {
          var y = ev.touches && ev.touches[0] ? ev.touches[0].clientY : 0;
          dy = Math.abs(y - touchStartY);
        } catch (eTm) {
          dy = 0;
        }
        if (dy < 10) return;
        tryOpen();
      };

      var onOutsideTap = function (ev) {
        if (!isMobileViewport()) return;
        if (!isFolderTabShellPage()) return;
        var c = getContainer() || container;
        if (!c || !c.isConnected || isLeavingLayer(c)) return;
        if (!c.classList.contains("is-visible")) return;
        var t = ev && ev.target;
        if (isNavElement(t)) return;
        if (!isMobileCloseTapTarget(t, c)) return;
        closeWithoutLeaveLayer(c);
      };

      window.addEventListener("scroll", onScroll, { passive: true, capture: true });
      // Track nav interactions so nav navigation doesn't trigger the leave animation flash.
      document.addEventListener(
        "pointerdown",
        function (ev) {
          var t = ev && ev.target;
          if (!isNavElement(t)) return;
          try {
            window.__HBW_LAST_NAV_INTERACTION_TS__ = Date.now();
          } catch (e) {}
        },
        true
      );
      document.addEventListener("touchstart", onTouchStartForOpen, { passive: true, capture: true });
      document.addEventListener("touchmove", onTouchMoveForOpen, { passive: true, capture: true });
      document.addEventListener("pointerdown", onOutsideTap, true);
      document.addEventListener("touchstart", onOutsideTap, true);
    }

    function initEnter() {
      enterGen++;
      var gen = enterGen;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (gen !== enterGen) return;
          var container = getContainer();
          if (!container) return;

          if (isStudioDockedPage()) {
            scrollPageToTop();
            portalFolderTabToBody(container);
            container.classList.remove("is-visible", "is-leaving");
            container.classList.add("is-booting");
            if (prefersReduced()) {
              container.classList.remove("is-booting");
              return;
            }
            if (isMobileViewport()) {
              container.classList.add("is-booting");
              container.classList.remove("is-visible");
              container.classList.remove("is-leaving");
              bindMobileReveal(container);
              return;
            }
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                if (gen !== enterGen || !container.isConnected) return;
                container.classList.remove("is-booting");
              });
            });
            return;
          }

          scrollPageToTop();
          portalFolderTabToBody(container);
          container.classList.add("is-booting");
          container.classList.remove("is-visible");
          container.classList.remove("is-leaving");
          if (isMobileViewport()) {
            bindMobileReveal(container);
            return;
          }
          releaseBootAndShow(container);
          scheduleFailsafeShow(container);
        });
      });
    }

    function onPageShow(ev) {
      var container = getContainer();
      if (!container) return;
      scrollPageToTop();
      if (!ev.persisted) return;
      portalFolderTabToBody(container);
      if (isStudioDockedPage()) {
        container.classList.add("is-booting");
        container.classList.remove("is-leaving");
        container.classList.remove("is-visible");
        if (prefersReduced()) {
          container.classList.remove("is-booting");
          return;
        }
        if (isMobileViewport()) {
          bindMobileReveal(container);
          return;
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (!container.isConnected) return;
            container.classList.remove("is-booting");
          });
        });
        return;
      }
      container.classList.add("is-booting");
      container.classList.remove("is-leaving");
      container.classList.remove("is-visible");
      if (isMobileViewport()) {
        bindMobileReveal(container);
        return;
      }
      releaseBootAndShow(container);
      scheduleFailsafeShow(container);
      scheduleFolderRowInView();
    }

    function cleanupLiftedNodes() {
      document.querySelectorAll("[data-hbw-folder-tab-leave-layer]").forEach(function (n) {
        n.remove();
      });
    }

    if (!window[BOUND]) {
      window[BOUND] = true;

      document.addEventListener(
        "click",
        function (event) {
          var t = event.target;
          if (!t || !t.closest) return;
          var inFolder = t.closest("#folder-tab-container, .folder-tab-container");
          if (inFolder && t.closest("[data-hbw-folder-tab-back]")) {
            var a0 = t.closest("a[href]");
            if (a0 && shouldRunLeaveForLink(a0)) {
              event.preventDefault();
              startLeaveOnly();
              setTimeout(function () {
                safeNavigate(a0.href);
              }, LEAVE_NAV_DELAY_MS);
            } else {
              startLeaveOnly();
            }
            return;
          }
          if (t.closest(".hbw-back, .hbw-bottom-back")) {
            startLeaveOnly();
          }
        },
        true
      );

      document.addEventListener(
        "click",
        function (event) {
          if (!isFolderTabShellPage()) return;
          var t = event.target;
          if (!t || !t.closest) return;
          if (isMobileViewport() && isNavElement(t)) return;
          if (t.closest(".hbw-floatnav")) return;
          if (t.closest(".hbw-back, .hbw-bottom-back")) return;
          var a = t.closest("a[href]");
          if (!a || !shouldRunLeaveForLink(a)) return;
          if (a.hasAttribute("data-hbw-studio-manifesto") || a.classList.contains("hbw-studio-manifesto-link"))
            return;
          event.preventDefault();
          startLeaveOnly();
          setTimeout(function () {
            safeNavigate(a.href);
          }, LEAVE_NAV_DELAY_MS);
        },
        true
      );

      document.addEventListener("about:leave", startLeaveOnly, false);
      document.addEventListener("manifesto:leave", startLeaveOnly, false);

      document.addEventListener("page:swup-complete", function () {
        cleanupLiftedNodes();
        reconcileDuplicateFolderTabs();
        scheduleFolderRowInView();
        window.setTimeout(scheduleFolderRowInView, 400);
      });

      try {
        var mm767 = window.matchMedia("(max-width: 767px)");
        function onFolderRowVpChange() {
          if (mm767.matches) scheduleFolderRowInView();
          else teardownFolderRowInView();
        }
        if (mm767.addEventListener) mm767.addEventListener("change", onFolderRowVpChange);
        else if (mm767.addListener) mm767.addListener(onFolderRowVpChange);
      } catch (eMm) {}
    }

    if (!window.__HBW_FOLDER_TAB_SWIPE_PAGESHOW__) {
      window.__HBW_FOLDER_TAB_SWIPE_PAGESHOW__ = true;
      window.addEventListener("pageshow", onPageShow, false);
    }

    var initEnterTimer = 0;
    function scheduleInitEnter() {
      if (initEnterTimer) return;
      initEnterTimer = window.setTimeout(function () {
        initEnterTimer = 0;
        initEnter();
        requestAnimationFrame(function () {
          if (getContainer()) initEnter();
        });
      }, 16);
    }

    document.addEventListener("DOMContentLoaded", scheduleInitEnter, false);
    document.addEventListener("page:swup-complete", scheduleInitEnter, false);

    if (document.readyState !== "loading") scheduleInitEnter();
  })();;

/* ---- 09-newsletter-popup.js ---- */
(function () {
    // Uses your existing Webflow structure/classes:
    // .popup-overlay > .popup-form > .popup-box
    // plus your Webflow Success/Error message elements inside the form.
    //
    // This embed may run in <head> before body exists, and your site uses Swup.
    // So we initialize on DOMContentLoaded + on page:swup-complete.

    var didBindGlobal = false;
    var overlay = null;
    var box = null;
    var formWrap = null;
    var formEl = null;
    var closeLink = null;
    var swup = null;
    var OPEN_DISPLAY = "flex";
    var wfSuccess = null;
    var wfError = null;
    var pendingOpenTimer = 0;

    function isCloseClickTarget(t) {
      return !!(t && t.closest && t.closest("[data-popup-close]"));
    }

    function normalizedPath() {
      var p = "/";
      try {
        p = String(location.pathname || "/");
      } catch (e) {}
      p = p.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
      return p;
    }

    function keyFor(suffix) {
      return "HBW_POPUP__" + suffix + "__" + normalizedPath();
    }

    function applyOpenEffects() {
      try {
        if (overlay) overlay.style.zIndex = "9999999999";
      } catch (e) {}

      if (swup) {
        try {
          swup.style.willChange = "filter";
          swup.style.filter = "blur(6px)";
        } catch (e2) {}
      }
    }

    function clearOpenEffects() {
      if (swup) {
        try {
          swup.style.filter = "";
          swup.style.willChange = "";
        } catch (e) {}
      }
    }

    function openPopup() {
      if (!overlay) return;
      try {
        overlay.style.display = OPEN_DISPLAY;
      } catch (e0) {}

      // Let Webflow transitions (if any) run off the class toggle.
      requestAnimationFrame(function () {
        applyOpenEffects();
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
      });

      if (box && !box.hasAttribute("role")) {
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
      }

      try {
        var firstInput = overlay.querySelector("input, textarea, select, button");
        if (firstInput) firstInput.focus();
      } catch (e) {}
    }

    function closePopup() {
      if (!overlay) return;
      if (pendingOpenTimer) {
        clearTimeout(pendingOpenTimer);
        pendingOpenTimer = 0;
      }
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      clearOpenEffects();
      try {
        overlay.style.display = "none";
      } catch (e) {}
    }

    function isElementVisible(el) {
      if (!el) return false;
      try {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      } catch (e) {
        return false;
      }
    }

    function maybeOpenOnSecondLoad() {
      if (!overlay) return;
      var shownKey = keyFor("shown");
      var rendersKey = keyFor("renders_session");

      var shown = "0";
      var renders = 0;
      try {
        shown = localStorage.getItem(shownKey) || "0";
      } catch (e0) {}
      try {
        renders = parseInt(sessionStorage.getItem(rendersKey) || "0", 10) || 0;
      } catch (e1) {}

      renders += 1;
      try {
        sessionStorage.setItem(rendersKey, String(renders));
      } catch (e2) {}

      // "2nd load" on a Swup site = the 2nd time this page is rendered in this tab/session.
      // Still only show once overall (persisted in localStorage).
      if (renders === 2 && shown !== "1") {
        try {
          localStorage.setItem(shownKey, "1");
        } catch (e3) {}
        if (pendingOpenTimer) clearTimeout(pendingOpenTimer);
        pendingOpenTimer = setTimeout(function () {
          pendingOpenTimer = 0;
          openPopup();
        }, 450);
      }
    }

    function bindGlobalOnce() {
      if (didBindGlobal) return;
      didBindGlobal = true;

      document.addEventListener(
        "click",
        function (e) {
          if (!overlay) return;
          if (e.target === overlay) return closePopup();
          if (isCloseClickTarget(e.target)) return closePopup();
        },
        true
      );

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closePopup();
      });
    }

    function init() {
      overlay = document.querySelector(".popup-overlay");
      if (!overlay) return;

      box = overlay.querySelector(".popup-box");
      formWrap = overlay.querySelector(".popup-form");
      formEl = formWrap ? formWrap.querySelector("form") : null;
      closeLink = document.getElementById("CLOSE");
      swup = document.querySelector(".swup");

      OPEN_DISPLAY = overlay.getAttribute("data-popup-display") || "flex";
      wfSuccess = formWrap ? formWrap.querySelector(".w-form-done") : null;
      wfError = formWrap ? formWrap.querySelector(".w-form-fail") : null;

      overlay.setAttribute("aria-hidden", overlay.classList.contains("is-open") ? "false" : "true");
      // Only force-hide if we're not already open and not about to open.
      if (!overlay.classList.contains("is-open") && !pendingOpenTimer) {
        try {
          overlay.style.display = "none";
        } catch (e) {}
      }

      if (closeLink && closeLink.getAttribute("data-hbw-popup-close-bound") !== "1") {
        closeLink.setAttribute("data-hbw-popup-close-bound", "1");
        closeLink.addEventListener("click", function (e) {
          try {
            e.preventDefault();
          } catch (err) {}
          closePopup();
        });
      }

      // Auto-close when Webflow success shows
      if (wfSuccess && typeof MutationObserver !== "undefined" && wfSuccess.getAttribute("data-hbw-popup-obs") !== "1") {
        wfSuccess.setAttribute("data-hbw-popup-obs", "1");
        var obs = new MutationObserver(function () {
          if (isElementVisible(wfSuccess)) setTimeout(closePopup, 900);
        });
        obs.observe(wfSuccess, { attributes: true, childList: true, subtree: true });
      } else if (formEl && formEl.getAttribute("data-hbw-popup-submit-bound") !== "1") {
        formEl.setAttribute("data-hbw-popup-submit-bound", "1");
        formEl.addEventListener("submit", function () {
          setTimeout(function () {
            if (!wfError || !isElementVisible(wfError)) closePopup();
          }, 1200);
        });
      }

      bindGlobalOnce();
      maybeOpenOnSecondLoad();
    }

    // Manual hooks (useful for testing)
    window.HBW_POPUP_OPEN = function () {
      init();
      openPopup();
    };
    window.HBW_POPUP_CLOSE = closePopup;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }

    document.addEventListener("page:swup-complete", init);
  })();;

/* ---- 10-newsletter-popup.js ---- */
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('email-input');
  if (!form) return;

  var formEl = form.closest('form');
  if (!formEl) return;

  formEl.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var email = document.getElementById('email-input').value;
    if (!email) return;

    fetch('https://a.klaviyo.com/client/subscriptions/?company_id=RUYTQB', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'revision': '2023-08-15'
      },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            custom_source: 'Webflow Popup Form',
            profile: {
              data: {
                type: 'profile',
                attributes: { email: email }
              }
            }
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: 'ST8dTa'
              }
            }
          }
        }
      })
    })
    .then(function(response) {
      console.log('Klaviyo response status:', response.status);
      if (response.ok) {
        console.log('Success! Email sent to Klaviyo.');
        var done = formEl.parentElement.querySelector('.w-form-done');
        if (done) done.style.display = 'block';
        formEl.style.display = 'none';
      } else {
        response.text().then(function(t) { console.log('Klaviyo error:', t); });
        var fail = formEl.parentElement.querySelector('.w-form-fail');
        if (fail) fail.style.display = 'block';
      }
    })
    .catch(function(err) {
      console.log('Fetch error:', err);
    });
  });
});;

/* ---- 11-rainbow-favicon.js ---- */
(function(){
  if (window.__hbwRainbowFaviconInit) return;
  window.__hbwRainbowFaviconInit = true;

  function createFavicon(color){
    const c=document.createElement('canvas'); c.width=c.height=32;
    const ctx=c.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle=color; ctx.fillRect(0,0,32,32);
    return c.toDataURL('image/png');
  }

  /* Drop Webflow (or theme) static favicons so they don’t win over our script. */
  function removeStaticFavicons() {
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(function (el) {
      if (/^hbw-rainbow-favicon/.test(el.id || '')) return;
      el.remove();
    });
  }

  function ensureLink(id, media) {
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('link');
    el.id = id;
    el.rel = 'icon';
    el.type = 'image/png';
    el.setAttribute('sizes', '32x32');
    if (media) el.setAttribute('media', media);
    document.head.insertBefore(el, document.head.firstChild);
    return el;
  }

  removeStaticFavicons();

  /* Prepend in order: fallback → dark → light so final head order is light → dark → fallback.
     Browsers match the first applicable icon; fallback (no media) must be last. */
  ensureLink('hbw-rainbow-favicon', null);
  ensureLink('hbw-rainbow-favicon-dark', '(prefers-color-scheme: dark)');
  ensureLink('hbw-rainbow-favicon-light', '(prefers-color-scheme: light)');

  var links = [
    document.getElementById('hbw-rainbow-favicon-light'),
    document.getElementById('hbw-rainbow-favicon-dark'),
    document.getElementById('hbw-rainbow-favicon')
  ];

  const colors=['#FF0000','#FF8C00','#FFFF00','#008000','#0000FF','#8B00FF'];
  let i=0;

  function changeFavicon(){
    const url = createFavicon(colors[i]);
    if (!url) return;
    i = (i + 1) % colors.length;
    links.forEach(function (link) {
      if (!link) return;
      link.removeAttribute('href');
      link.href = url;
    });
  }

  changeFavicon();
  setInterval(changeFavicon, 250);
})();;

/* ---- 12-screensaver.js ---- */
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
  })();;

/* ---- 13-floatnav.js ---- */
(function () {
    let floatNavAc = null;
    let pillRo = null;
    let mountNavRaf = 0;
    let mountNavFollowT = 0;

    function mountFloatNav(opts) {
      opts = opts || {};
      const animateLabelOnMount = !!opts.animateLabelOnMount;
      if (floatNavAc) floatNavAc.abort();
      floatNavAc = new AbortController();
      const { signal } = floatNavAc;

      if (pillRo) {
        try {
          pillRo.disconnect();
        } catch (e) {}
        pillRo = null;
      }

      signal.addEventListener(
        "abort",
        () => {
          if (pillRo) {
            try {
              pillRo.disconnect();
            } catch (e2) {}
            pillRo = null;
          }
        },
        { once: true }
      );

      const inner = document.querySelector("[data-hbw-nav]");
      const nav = inner && inner.closest(".hbw-floatnav");
      if (!inner || !nav) return;

      /* Fresh bind after Swup (or remount): float nav DOM may persist with is-locked from last click. */
      inner.classList.remove("is-locked");

      const menuLabelEl = inner.querySelector("[data-hbw-menu-label]");
      let menuTextT = 0;
      const clearMenuTextT = () => {
        if (menuTextT) {
          clearTimeout(menuTextT);
          menuTextT = 0;
        }
      };
      signal.addEventListener("abort", clearMenuTextT, { once: true });

      const norm = (p) => (p || "/").replace(/\/+$/, "") || "/";
      const path = norm(location.pathname);

      try {
        document.documentElement.classList.toggle("hbw-route-intake-start", path === "/intake/start");
      } catch (eIntake) {}

      const isProjectDetail = (p) => p.startsWith("/projects/") && p !== "/projects";

      const isManifestoPath = (p) => {
        if (typeof p !== "string") return false;
        const low = p.toLowerCase();
        return low === "/manifesto" || low.endsWith("/manifesto");
      };

      // Used by CSS to selectively reveal the Manifesto nav item only on /manifesto.
      try {
        document.documentElement.classList.toggle("hbw-route-manifesto", isManifestoPath(path));
      } catch (eTog) {}

      // Used by CSS to selectively hide Collections on /projects/<slug>.
      try {
        document.documentElement.classList.toggle("hbw-route-project-detail", isProjectDetail(path));
      } catch (eProj) {}

      const routeForPath = (p) => {
        if (p === "/" || p === "/index.html") return "home";
        if (p === "/studio") return "studio";
        if (p === "/projects" || p.startsWith("/projects/")) return "projects";
        if (p === "/collections" || p.startsWith("/collections/")) return "collections";
        if (isManifestoPath(p)) return "manifesto";
        return null;
      };

      const activeRoute = routeForPath(path);

      /** Same idea as Manifesto Swipe: /manifesto URL, or /studio while the manifesto layer is open. */
      const isManifestoShellPage = () => {
        if (isManifestoPath(path)) return true;
        if (path !== "/studio") return false;
        try {
          const m = document.querySelector("#manifesto-contents, .manifesto-contents");
          return !!(m && m.classList.contains("is-visible"));
        } catch (eM) {
          return false;
        }
      };

      const tray = inner.querySelector(".hbw-floatnav__tray");
      const pill = tray && tray.querySelector(".hbw-floatnav__pill");

      const navLinks = Array.from(inner.querySelectorAll("[data-hbw-route]"));
      navLinks.forEach((a) => {
        if (!activeRoute) {
          a.classList.remove("is-active", "is-hidden");
          a.removeAttribute("aria-current");
          return;
        }
        const route = a.getAttribute("data-hbw-route");
        const matchesRoute = route === activeRoute;
        const showActive = matchesRoute && !(isProjectDetail(path) && route === "projects");
        a.classList.toggle("is-active", showActive);
        a.classList.remove("is-hidden");
        if (showActive) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });

      const getProjectTitle = () => {
        const og =
          (document.querySelector('meta[property="og:title"]') &&
            document.querySelector('meta[property="og:title"]').content &&
            document.querySelector('meta[property="og:title"]').content.trim()) ||
          (document.querySelector('meta[name="twitter:title"]') &&
            document.querySelector('meta[name="twitter:title"]').content &&
            document.querySelector('meta[name="twitter:title"]').content.trim());
        if (og) return og;
        const t = (document.title || "").trim();
        if (!t) return "Project";
        const parts = t.split(/[-–—|·•]/);
        return (parts[0] && parts[0].trim()) || t;
      };

      const activeLabel = (() => {
        if (isManifestoShellPage()) return "Manifesto";
        if (!activeRoute) return "Menu";
        if (activeRoute === "projects" && isProjectDetail(path)) {
          return getProjectTitle();
        }
        if (activeRoute === "studio") return "Studio";
        if (activeRoute === "manifesto") return "Manifesto";
        const linkEl = inner.querySelector('[data-hbw-route="' + activeRoute + '"]');
        return (linkEl && linkEl.textContent && linkEl.textContent.trim()) || "Menu";
      })();

      const closedLabel = (() => {
        if (isManifestoShellPage()) return "Manifesto";
        if (!activeRoute) return "Menu";
        if (isProjectDetail(path)) return activeLabel;
        if (activeRoute === "home") return "Home";
        if (activeRoute === "projects") return "Projects";
        if (activeRoute === "studio") return "Studio";
        if (activeRoute === "collections") return "Collections";
        if (activeRoute === "manifesto") return "Manifesto";
        return "Menu";
      })();

      function animateMenuTextTo(nextText, opts) {
        opts = opts || {};
        if (!menuLabelEl) return;
        const immediate = !!opts.immediate;
        const current = (menuLabelEl.textContent || "").trim();
        if (current === nextText) return;
        clearMenuTextT();
        if (immediate) {
          menuLabelEl.textContent = nextText;
          menuLabelEl.classList.remove("is-changing");
          return;
        }
        menuLabelEl.classList.add("is-changing");
        void menuLabelEl.offsetWidth;
        menuTextT = setTimeout(function () {
          menuTextT = 0;
          menuLabelEl.textContent = nextText;
          requestAnimationFrame(function () {
            menuLabelEl.classList.remove("is-changing");
          });
        }, 160);
      }

      function syncStudioManifestoMenuLabel() {
        if (path !== "/studio" || !menuLabelEl) return;
        const want = isManifestoShellPage() ? "Manifesto" : "Studio";
        if ((menuLabelEl.textContent || "").trim() === want) return;
        animateMenuTextTo(want, { immediate: prefersReducedMotionNav() });
      }

      const manifestoObsEl = document.querySelector("#manifesto-contents, .manifesto-contents");
      if (manifestoObsEl && typeof MutationObserver !== "undefined") {
        const manifestoMo = new MutationObserver(function () {
          syncStudioManifestoMenuLabel();
        });
        manifestoMo.observe(manifestoObsEl, { attributes: true, attributeFilter: ["class"] });
        signal.addEventListener(
          "abort",
          function () {
            try {
              manifestoMo.disconnect();
            } catch (eMo) {}
          },
          { once: true }
        );
      }
      requestAnimationFrame(syncStudioManifestoMenuLabel);

      const isCoarse =
        (window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches) ||
        navigator.maxTouchPoints > 0;

      let pillHoverLink = null;

      const getRestingPillLink = () =>
        navLinks.find(
          (a) => !a.classList.contains("is-hidden") && a.classList.contains("is-active")
        ) || null;

      const getPillTargetLink = () => {
        if (pillHoverLink) return pillHoverLink;
        const ae = document.activeElement;
        if (
          ae &&
          ae.classList.contains("hbw-floatnav__link") &&
          tray &&
          tray.contains(ae)
        )
          return ae;
        return getRestingPillLink();
      };

      const syncPill = () => {
        if (isCoarse || !pill || !tray) return;
        if (!inner.classList.contains("is-open")) {
          pill.style.opacity = "0";
          return;
        }
        const el = getPillTargetLink();
        if (!el || el.classList.contains("is-hidden")) {
          pill.style.opacity = "0";
          return;
        }
        const t = tray.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const left = r.left - t.left;
        pill.style.width = r.width + "px";
        pill.style.transform = "translateX(" + left + "px)";
        pill.style.opacity = "1";
      };

      let labelCloseT = 0;
      const LABEL_CLOSE_AFTER_TRAY_MS = 105;

      let itemsCloseT = 0;
      const ITEMS_OUT_BEFORE_TRAY_MS = 100;
      let closeSeqT = 0;
      let closeSeqRunning = false;

      function prefersReducedMotionNav() {
        try {
          return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch (e) {
          return false;
        }
      }

      let trayCloseEndHandler = null;
      let trayCloseTimeout = 0;
      const TRAY_CLOSE_FALLBACK_MS = 700;

      function clearTrayCloseDeferred() {
        if (trayCloseEndHandler && tray) {
          try {
            tray.removeEventListener("transitionend", trayCloseEndHandler);
          } catch (eT) {}
          trayCloseEndHandler = null;
        }
        if (trayCloseTimeout) {
          clearTimeout(trayCloseTimeout);
          trayCloseTimeout = 0;
        }
      }

      const setOpen = (open, opts) => {
        opts = opts || {};
        if (inner.classList.contains("is-locked")) return;
        clearTrayCloseDeferred();
        clearTimeout(labelCloseT);
        labelCloseT = 0;
        clearTimeout(itemsCloseT);
        itemsCloseT = 0;
        clearTimeout(closeSeqT);
        closeSeqT = 0;
        closeSeqRunning = false;
        inner.classList.remove("hbw-floatnav--items-out");
        inner.classList.toggle("is-open", open);
        if (menuLabelEl) menuLabelEl.setAttribute("aria-expanded", open ? "true" : "false");

        const keepProjectsVisible =
          activeRoute === "projects" && isProjectDetail(path);
        navLinks.forEach((a) => {
          if (!activeRoute) {
            a.classList.remove("is-hidden");
            return;
          }
          const isActive = a.getAttribute("data-hbw-route") === activeRoute;
          const shouldHideWhenOpen = isActive && !keepProjectsVisible;
          if (open) {
            a.classList.toggle("is-hidden", shouldHideWhenOpen);
          } else if (prefersReducedMotionNav()) {
            a.classList.remove("is-hidden");
          } else if (shouldHideWhenOpen) {
            a.classList.add("is-hidden");
          } else {
            a.classList.remove("is-hidden");
          }
        });

        if (
          !open &&
          !prefersReducedMotionNav() &&
          tray &&
          activeRoute &&
          !(activeRoute === "projects" && isProjectDetail(path))
        ) {
          trayCloseEndHandler = function (e) {
            if (e.target !== tray) return;
            if (e.propertyName !== "max-width") return;
            clearTrayCloseDeferred();
            if (inner.classList.contains("is-open")) return;
            navLinks.forEach((a) => a.classList.remove("is-hidden"));
          };
          tray.addEventListener("transitionend", trayCloseEndHandler);
          trayCloseTimeout = window.setTimeout(function () {
            trayCloseTimeout = 0;
            if (!trayCloseEndHandler) return;
            clearTrayCloseDeferred();
            if (inner.classList.contains("is-open")) return;
            navLinks.forEach((a) => a.classList.remove("is-hidden"));
          }, TRAY_CLOSE_FALLBACK_MS);
        }

        requestAnimationFrame(function () {
          requestAnimationFrame(syncPill);
        });

        if (!menuLabelEl) return;
        if (isProjectDetail(path)) {
          animateMenuTextTo(activeLabel, { immediate: !animateLabelOnMount });
          return;
        }
        /* Label should always be the page name (closedLabel). Animate only when it changes. */
        animateMenuTextTo(closedLabel, { immediate: !!opts.immediateLabel });
      };

      /** Consistent close everywhere: phase1 items-out → phase2 collapse. Optional lock at end. */
      function scheduleCloseNav(lockAfter) {
        if (inner.classList.contains("is-locked")) return;
        if (!inner.classList.contains("is-open")) return;
        if (closeSeqRunning) return;

        closeSeqRunning = true;
        clearTimeout(closeSeqT);
        closeSeqT = 0;

        if (prefersReducedMotionNav()) {
          if (lockAfter) lockNav();
          else setOpen(false, { immediateLabel: true });
          closeSeqRunning = false;
          return;
        }

        inner.classList.add("hbw-floatnav--items-out");
        closeSeqT = setTimeout(function () {
          closeSeqT = 0;
          if (lockAfter) lockNav();
          else setOpen(false, { immediateLabel: true });
          closeSeqRunning = false;
        }, ITEMS_OUT_BEFORE_TRAY_MS);
      }

      const lockNav = () => {
        clearTrayCloseDeferred();
        clearTimeout(labelCloseT);
        labelCloseT = 0;
        clearTimeout(itemsCloseT);
        itemsCloseT = 0;
        clearTimeout(closeSeqT);
        closeSeqT = 0;
        closeSeqRunning = false;
        inner.classList.remove("hbw-floatnav--items-out");
        inner.classList.add("is-locked");
        inner.classList.remove("is-open");
        if (menuLabelEl) menuLabelEl.setAttribute("aria-expanded", "false");
        const trayEl = inner.querySelector(".hbw-floatnav__tray");
        if (trayEl) trayEl.classList.remove("has-hl");
        pillHoverLink = null;
        syncPill();
      };

      const getSwup = () => window.swup || window.__HBW_SWUP__;

      const navigateInternal = (href) => {
        const swup = getSwup();
        if (swup) {
          if (typeof swup.navigate === "function") {
            swup.navigate(href);
            return true;
          }
          if (typeof swup.loadPage === "function") {
            try {
              swup.loadPage({ url: href });
              return true;
            } catch (e3) {}
          }
        }
        location.href = href;
        return false;
      };

      if (!isCoarse && tray && pill && typeof ResizeObserver !== "undefined") {
        pillRo = new ResizeObserver(syncPill);
        pillRo.observe(tray);
      }

      if (!isCoarse && tray && pill) {
        navLinks.forEach((a) => {
          a.addEventListener(
            "mouseenter",
            function () {
              pillHoverLink = a;
              syncPill();
            },
            { signal }
          );
        });
        tray.addEventListener(
          "mouseleave",
          function () {
            pillHoverLink = null;
            syncPill();
          },
          { signal }
        );
        tray.addEventListener("focusin", syncPill, { signal });
        tray.addEventListener(
          "focusout",
          function (e) {
            if (tray.contains(e.relatedTarget)) return;
            syncPill();
          },
          { signal }
        );
        window.addEventListener("resize", syncPill, { passive: true, signal });
      }

      setOpen(false, { immediateLabel: !animateLabelOnMount });

      let hoverOpenT = 0;
      let hoverCloseT = 0;
      let focusCloseT = 0; /* cleared on signal abort */
      const HOVER_OPEN_DELAY_MS = 95;
      const HOVER_CLOSE_DELAY_MS = 285;

      if (!isCoarse) {
        const onInnerEnter = function () {
          clearTimeout(hoverCloseT);
          clearTimeout(hoverOpenT);
          clearTimeout(focusCloseT);
          clearTimeout(itemsCloseT);
          itemsCloseT = 0;
          clearTimeout(closeSeqT);
          closeSeqT = 0;
          closeSeqRunning = false;
          inner.classList.remove("hbw-floatnav--items-out");
          hoverOpenT = setTimeout(function () {
            setOpen(true);
          }, HOVER_OPEN_DELAY_MS);
        };

        const onInnerLeave = function () {
          clearTimeout(hoverOpenT);
          clearTimeout(hoverCloseT);
          hoverCloseT = setTimeout(function () {
            scheduleCloseNav(false);
          }, HOVER_CLOSE_DELAY_MS);
        };

        inner.addEventListener("pointerenter", onInnerEnter, { passive: true, signal });
        inner.addEventListener("pointerleave", onInnerLeave, { passive: true, signal });

        inner.addEventListener(
          "focusin",
          function () {
            clearTimeout(focusCloseT);
            clearTimeout(hoverCloseT);
            setOpen(true);
          },
          { signal }
        );
        inner.addEventListener(
          "focusout",
          function () {
            clearTimeout(focusCloseT);
            focusCloseT = setTimeout(function () {
              focusCloseT = 0;
              if (!inner.matches(":focus-within")) scheduleCloseNav(false);
            }, 120);
          },
          { signal }
        );
      }

      signal.addEventListener(
        "abort",
        function () {
          clearTrayCloseDeferred();
          clearTimeout(hoverOpenT);
          clearTimeout(hoverCloseT);
          clearTimeout(focusCloseT);
          clearTimeout(labelCloseT);
          clearTimeout(itemsCloseT);
          clearTimeout(closeSeqT);
        },
        { once: true }
      );

      if (isCoarse && menuLabelEl) {
        let suppressMenuClickUntil = 0;

        const toggleMenuFromTouch = () => {
          if (inner.classList.contains("is-locked")) return;
          suppressMenuClickUntil = Date.now() + 700;
          if (inner.classList.contains("is-open")) scheduleCloseNav(false);
          else setOpen(true);
        };

        menuLabelEl.addEventListener(
          "pointerup",
          function (e) {
            if (e.pointerType === "mouse") return;
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            toggleMenuFromTouch();
          },
          { capture: true, signal }
        );

        menuLabelEl.addEventListener(
          "click",
          function (e) {
            if (Date.now() < suppressMenuClickUntil) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (inner.classList.contains("is-locked")) return;
            e.preventDefault();
            e.stopPropagation();
            if (inner.classList.contains("is-open")) scheduleCloseNav(false);
            else setOpen(true);
          },
          { capture: true, signal }
        );

        document.addEventListener(
          "pointerdown",
          function (e) {
            if (!inner.classList.contains("is-open")) return;
            if (inner.contains(e.target)) return;
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                if (!inner.classList.contains("is-open")) return;
                if (inner.contains(document.activeElement)) return;
                scheduleCloseNav(false);
              });
            });
          },
          { capture: true, signal }
        );
      }

      const isInternal = (href) => {
        try {
          const u = new URL(href, location.origin);
          return u.origin === location.origin;
        } catch (e4) {
          return false;
        }
      };

      const labelForTargetPath = (p) => {
        if (p === "/" || p === "/index.html") return "Home";
        if (p === "/studio") return "Studio";
        if (p === "/projects" || p.startsWith("/projects/")) return "Projects";
        if (p === "/collections" || p.startsWith("/collections/")) return "Collections";
        if (isManifestoPath(p)) return "Manifesto";
        return "Menu";
      };

      inner.addEventListener(
        "click",
        function (e) {
          const raw = e.target;
          const el =
            raw && raw.nodeType === 1 ? raw : raw && raw.parentElement;
          const a = el && typeof el.closest === "function" ? el.closest("a[href]") : null;
          if (!a) return;
          if (a.target === "_blank") return;
          const href = a.getAttribute("href") || "";
          if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
            return;
          if (!isInternal(a.href)) return;

          const u = new URL(a.href, location.origin);
          const tp = norm(u.pathname);
          const nextLabel = labelForTargetPath(tp);
          e.preventDefault();
          scheduleCloseNav(true);
          animateMenuTextTo(nextLabel);

          const LABEL_SWAP_MS = 160;
          const NAVIGATE_AFTER_MS = LABEL_SWAP_MS + 260;

          try {
            document.dispatchEvent(new Event("about:leave"));
            document.dispatchEvent(new Event("hbw:folder-leave"));
          } catch (err) {}
          setTimeout(function () {
            navigateInternal(u.href);
          }, NAVIGATE_AFTER_MS);
        },
        { capture: true, signal }
      );
    }

    function scheduleMountFloatNav() {
      if (mountNavRaf) cancelAnimationFrame(mountNavRaf);
      mountNavRaf = requestAnimationFrame(function () {
        mountNavRaf = 0;
        mountFloatNav({ animateLabelOnMount: true });
      });
      if (mountNavFollowT) clearTimeout(mountNavFollowT);
      mountNavFollowT = setTimeout(function () {
        mountNavFollowT = 0;
        mountFloatNav({ animateLabelOnMount: true });
      }, 48);
    }

    mountFloatNav({ animateLabelOnMount: false });
    document.addEventListener("page:swup-complete", scheduleMountFloatNav);
    document.addEventListener("swup:page:view", scheduleMountFloatNav);
    document.addEventListener("swup:content:replace", scheduleMountFloatNav);
    document.addEventListener("swup:visit:end", scheduleMountFloatNav);
    window.addEventListener("pageshow", scheduleMountFloatNav);
    window.addEventListener("popstate", scheduleMountFloatNav);
  })();;

/* ---- 14-project-gallery-b.js ---- */
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
    var mediaRoot = track;
    try {
      var sub3Path = (location.pathname || '').replace(/\/+$/, '') || '/';
      if (sub3Path === '/projects/sub-3') {
        var firstSpread = track.querySelector('.hbw-hscroll__item, .project-gallery__item');
        if (firstSpread) mediaRoot = firstSpread;
      }
    } catch (eSub3Media) {}
    var imgs = mediaRoot.querySelectorAll('img');
    var vids = mediaRoot.querySelectorAll('video');
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
})();;

/* ---- 15-project-gallery-b.js ---- */
(function () {
  'use strict';
  /*
    Prevent duplicate embeds from double-binding listeners,
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
    wheelMultiplier: 0.095,
    desktopAutoDrift: 0,
    mobileAutoDrift: 0,
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

  /**
   * iOS rubber-band (elastic overscroll) suppression.
   *
   * iOS Safari ignores `overscroll-behavior` on the root scroller, so we
   * prevent vertical touchmove default *only* on project detail pages and
   * only when the gesture is predominantly vertical.
   *
   * This keeps horizontal swipes on the gallery smooth, and removes the
   * page-level elastic “bounce” feel.
   */
  (function installIosOverscrollLock() {
    if (window.__HBW_IOS_OVERSCROLL_LOCK__) return;

    var path = '';
    try {
      path = (location && location.pathname) || '';
    } catch (e) {}
    var isProjectDetail =
      (path.indexOf('/projects/') === 0 && path !== '/projects') ||
      (path.indexOf('/project/') === 0 && path !== '/project');
    if (!isProjectDetail) return;

    var ua = '';
    try {
      ua = navigator.userAgent || '';
    } catch (e2) {}
    var isIOS =
      /iP(ad|hone|od)/.test(ua) ||
      (ua.indexOf('Mac') >= 0 && 'ontouchend' in document); // iPadOS (desktop UA)
    if (!isIOS) return;

    window.__HBW_IOS_OVERSCROLL_LOCK__ = true;

    var sx = 0;
    var sy = 0;
    var active = false;

    function isInteractiveTarget(t) {
      if (!t || !t.closest) return false;
      return !!t.closest('a, button, input, textarea, select, label, [contenteditable="true"]');
    }

    function onTouchStart(e) {
      if (!e || !e.touches || e.touches.length !== 1) {
        active = false;
        return;
      }
      if (isInteractiveTarget(e.target)) {
        active = false;
        return;
      }
      active = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (!active || !e || !e.touches || e.touches.length !== 1) return;

      var t = e.target;
      if (isInteractiveTarget(t)) return;

      var cx = e.touches[0].clientX;
      var cy = e.touches[0].clientY;
      var dx = cx - sx;
      var dy = cy - sy;

      // If the touch is inside a known horizontal scroller, only suppress
      // vertical-ish moves (this removes the “bounce” without breaking swipe).
      if (t && t.closest && (t.closest('.project-gallery') || t.closest('.project-page-gallery'))) {
        if (Math.abs(dy) > Math.abs(dx) + 2) {
          e.preventDefault();
        }
        return;
      }

      // Anywhere else on the project detail page, stop vertical rubber-band.
      if (Math.abs(dy) > Math.abs(dx) + 2) {
        e.preventDefault();
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  })();

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
    var mediaRoot = track;
    try {
      var sub3Path = (location.pathname || '').replace(/\/+$/, '') || '/';
      if (sub3Path === '/projects/sub-3') {
        var firstSpread = track.querySelector('.hbw-hscroll__item, .project-gallery__item');
        if (firstSpread) mediaRoot = firstSpread;
      }
    } catch (eSub3Media) {}
    var imgs = mediaRoot.querySelectorAll('img');
    var vids = mediaRoot.querySelectorAll('video');
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
      img.addEventListener('error', function () {
        pending--;
        arm();
      }, { once: true });
    }

    for (var v = 0; v < vids.length; v++) {
      var vid = vids[v];
      if (vid.readyState >= 2) continue;
      pending++;
      vid.addEventListener('loadeddata', function () {
        pending--;
        arm();
      }, { once: true });
      vid.addEventListener('error', function () {
        pending--;
        arm();
      }, { once: true });
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
    var desktopCycleWidth = 0;
    var desktopVirtualX = 0;
    var dragStartVirtual = 0;
    /** True while any finger is on the gallery (mobile). Pauses auto-drift so slides stay readable; ends when touch ends. */
    var mobileTouchHoldPause = false;
    /** Touch identifiers currently down inside this gallery (document-capture tracking; survives stopPropagation on children). */
    var galleryTouchIdentifiers = new Set();
    /** Last known positions per touch identifier (for vertical-to-horizontal mapping). */
    var galleryTouchLast = Object.create(null);
    // Mobile touch gesture state (single-finger for smoothness).
    var touchActiveId = null;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchBaseOffset = 0;
    var touchMode = 'none'; // 'none' | 'pending' | 'h' | 'v'
    var touchRaf = 0;
    var touchNextOffset = 0;
    var touchLastOffset = 0;
    var touchLastTime = 0;
    var touchFlingV = 0;

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
      docTouchStartCapture: null,
      docTouchEndCapture: null,
      docTouchMoveCapture: null,
      counterHide: null,
      counterShow: null,
      navClick: null,
      vis: null
    };

    function getScrollBounds() {
      var gw = gallery.clientWidth || 1;
      var tw = track.scrollWidth || 0;
      var extra = tw - gw;
      if (extra <= 0) return { minX: 0, maxX: 0, span: 0 };
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

    // Mobile-only elastic edges (premium feel): resistance while dragging, spring-back after release.
    function applyElasticEdges() {
      if (!isMobile) return;
      var b = getScrollBounds();
      var over = 0;
      var maxOver = 140;
      var resist = 0.38;

      if (offsetX > b.maxX) {
        over = offsetX - b.maxX;
        over = Math.min(maxOver, over);
        if (isDragging || touchActiveId != null) {
          offsetX = b.maxX + over * resist;
        } else {
          // Spring back when released.
          velocity += (b.maxX - offsetX) * 0.12;
          velocity *= 0.82;
        }
      } else if (offsetX < b.minX) {
        over = b.minX - offsetX;
        over = Math.min(maxOver, over);
        if (isDragging || touchActiveId != null) {
          offsetX = b.minX - over * resist;
        } else {
          velocity += (b.minX - offsetX) * 0.12;
          velocity *= 0.82;
        }
      }
    }

    function itemStepWidth(node) {
      if (!node) return gapPx;
      return node.offsetWidth + gapPx;
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
      while (first && -offsetX >= itemStepWidth(first) - CONFIG.recycleEps) {
        var step = itemStepWidth(first);
        offsetX += step;
        desktopVirtualX += step;
        track.appendChild(first);
        first = track.firstElementChild;
      }
    }

    function recycleBackward() {
      if (isMobile) return;
      var last = track.lastElementChild;
      while (last && offsetX > CONFIG.recycleEps) {
        var step = itemStepWidth(last);
        offsetX -= step;
        desktopVirtualX -= step;
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
      for (var c = 0; c < clones.length; c++) clones[c].remove();
      var vw = gallery.clientWidth || window.innerWidth || 1;
      var targetWidth = vw * CONFIG.minViewportMultiplier;
      var safety = 0;
      while (track.scrollWidth < targetWidth && originals.length > 0 && safety < 500) {
        safety++;
        for (var i = 0; i < originals.length; i++) {
          if (track.scrollWidth >= targetWidth) break;
          var el = originals[i];
          var clone = el.cloneNode(true);
          clone.setAttribute('data-clone', 'true');
          clone.setAttribute('data-hbw-orig-idx', el.getAttribute('data-hbw-orig-idx') || '0');
          track.appendChild(clone);
        }
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
      if (counterEl && counterEl.textContent !== nextText) counterEl.textContent = nextText;
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
      var x = isMobile ? offsetX : Math.round(offsetX * 100) / 100;
      track.style.transform = 'translate3d(' + x + 'px, -50%, 0)';
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
        !isMobile && !reduceMotion && CONFIG.desktopAutoDrift > 0.0001 ? CONFIG.desktopAutoDrift : 0;
      var mobDrift =
        isMobile &&
        !reduceMotion &&
        !mobileTouchHoldPause &&
        CONFIG.mobileAutoDrift > 0.0001
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
        applyElasticEdges();
        // Keep the hard clamp as a safety net for extreme values.
        if (!isDragging && touchActiveId == null) clampOffsetAndVelocity();
      }
      else applyDesktopRecycle();

      applyTransform();
      updateProgress();

      var now = window.performance && window.performance.now ? window.performance.now() : Date.now();
      if (!lastIndexSync || now - lastIndexSync >= indexSyncIntervalMs) {
        syncIndexFromViewport();
        lastIndexSync = now;
      }

      if (!isDragging && Math.abs(velocity) < CONFIG.idleVelocityEpsilon) {
        velocity = 0;
        if (deskDrift > 0.0001 || mobDrift > 0.0001) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        rafId = null;
        if (isMobile && isAtEnd()) startRewindToStart();
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function startAnimation() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function stopAnimation() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function onResizeImmediate() {
      isMobile = window.innerWidth <= 767;
      if (!isMobile) {
        mobileTouchHoldPause = false;
        galleryTouchIdentifiers.clear();
      }
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
      var delta = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
      if (!delta) return;
      e.preventDefault();
      e.stopPropagation();
      var wm = reduceMotion ? CONFIG.wheelMultiplier * 0.45 : CONFIG.wheelMultiplier;
      // If the user reverses direction, drop some momentum so it feels responsive (premium).
      if (velocity && ((velocity > 0) !== (delta > 0))) {
        velocity *= 0.35;
      }
      velocity += delta * wm;
      var maxV = (gallery.clientWidth || 1) * CONFIG.flingMaxFactor;
      if (velocity > maxV) velocity = maxV;
      if (velocity < -maxV) velocity = -maxV;
      startAnimation();
    };
    gallery.addEventListener('wheel', handlers.wheel, { passive: false });

    handlers.pointerdown = function (e) {
      // Mobile touch is handled via touch events (below) to support
      // “scroll down to move across” and press/hold smoothly.
      if (isMobile && e.pointerType === 'touch') return;
      var interactive = e.target.closest('a, button, input, textarea, select');
      if (interactive) return;

      cancelRewind();

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

      if (isMobile && e.pointerType === 'touch') e.preventDefault();

      if (e.pointerId !== undefined) {
        try {
          track.setPointerCapture(e.pointerId);
        } catch (err) {}
      }

      startAnimation();
    };

    handlers.pointermove = function (e) {
      if (isMobile && e.pointerType === 'touch') return;
      if (!isDragging) return;

      var clientX = e.clientX || 0;
      var clientY = e.clientY || 0;
      var dx = clientX - dragStartX;
      var dy = clientY - dragStartY;
      var now = Date.now();

      if (isMobile) offsetX = dragStartOffset + dx - dy * CONFIG.mobileDyScale;
      else {
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
      if (isMobile) clampOffsetAndVelocity();
      else applyDesktopRecycle();

      applyTransform();
      updateProgress();
      syncIndexFromViewport();
    };

    handlers.pointerup = function (e) {
      if (isMobile && e.pointerType === 'touch') return;
      if (!isDragging) return;
      isDragging = false;
      gallery.classList.remove('is-dragging');

      if (!reduceMotion && Date.now() - lastPointerTime < 56) {
        var fv = flingVx - (isMobile ? flingVy * CONFIG.mobileDyScale : 0);
        velocity = fv * CONFIG.flingMul;
        var maxF = (gallery.clientWidth || window.innerWidth || 1) * CONFIG.flingMaxFactor;
        if (velocity > maxF) velocity = maxF;
        if (velocity < -maxF) velocity = -maxF;
      }

      if (isMobile) clampOffsetAndVelocity();
      else applyDesktopRecycle();

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

    /**
     * Mobile touch (single unified path):
     * - press/hold pauses (mobileTouchHoldPause)
     * - vertical swipes over the gallery translate into horizontal progress
     * - horizontal swipes behave like normal drag
     * Uses document capture so links/children can't block it.
     */
    function scheduleTouchApply(next) {
      var now = Date.now();
      if (touchLastTime) {
        var dt = now - touchLastTime;
        if (dt > 0 && dt < 120) {
          touchFlingV = ((next - touchLastOffset) / dt) * 16;
        }
      }
      touchLastOffset = next;
      touchLastTime = now;
      touchNextOffset = next;
      if (touchRaf) return;
      touchRaf = requestAnimationFrame(function () {
        touchRaf = 0;
        offsetX = touchNextOffset;
        cancelRewind();
        clampOffsetAndVelocity();
        applyTransform();
        updateProgress();
        syncIndexFromViewport();
        startAnimation();
      });
    }

    handlers.docTouchStartCapture = function (e) {
      if (!e.changedTouches) return;
      isMobile = window.innerWidth <= 767;
      if (!isMobile) return;

      var hit = false;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var el = t.target;
        if (el && gallery.contains(el)) {
          galleryTouchIdentifiers.add(t.identifier);
          galleryTouchLast[t.identifier] = { x: t.clientX, y: t.clientY };
          hit = true;
          // Pick the first touch that begins inside the gallery as the active gesture.
          if (touchActiveId == null) {
            touchActiveId = t.identifier;
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchBaseOffset = offsetX;
            touchMode = 'pending';
            touchLastOffset = offsetX;
            touchLastTime = Date.now();
            touchFlingV = 0;
          }
        }
      }
      if (!hit) return;
      mobileTouchHoldPause = true;
      cancelRewind();
      startAnimation();
    };

    handlers.docTouchMoveCapture = function (e) {
      if (!e.changedTouches || touchActiveId == null) return;
      isMobile = window.innerWidth <= 767;
      if (!isMobile) return;

      // Find the active touch in the full touches list (more reliable than changedTouches).
      var t = null;
      if (e.touches) {
        for (var k = 0; k < e.touches.length; k++) {
          if (e.touches[k].identifier === touchActiveId) {
            t = e.touches[k];
            break;
          }
        }
      }
      if (!t) return;

      var totalDx = t.clientX - touchStartX;
      var totalDy = t.clientY - touchStartY;

      if (touchMode === 'pending') {
        if (Math.abs(totalDx) + Math.abs(totalDy) < 6) return;
        touchMode = Math.abs(totalDy) > Math.abs(totalDx) + 2 ? 'v' : 'h';
      }

      // Once a direction is chosen, prevent page scroll while interacting with the gallery.
      e.preventDefault();
      mobileTouchHoldPause = true;

      var nextOffset =
        touchMode === 'v'
          ? touchBaseOffset + totalDy
          : touchBaseOffset + totalDx - totalDy * CONFIG.mobileDyScale;

      scheduleTouchApply(nextOffset);
    };

    handlers.docTouchEndCapture = function (e) {
      if (!e.changedTouches) return;
      for (var j = 0; j < e.changedTouches.length; j++) {
        var id = e.changedTouches[j].identifier;
        galleryTouchIdentifiers.delete(id);
        if (galleryTouchLast[id]) delete galleryTouchLast[id];
        if (touchActiveId === id) {
          touchActiveId = null;
          touchMode = 'none';
          // Only fling when the last finger leaves the gallery.
          if (!reduceMotion && galleryTouchIdentifiers.size === 0) {
            velocity = touchFlingV * CONFIG.flingMul;
            var maxF = (gallery.clientWidth || window.innerWidth || 1) * CONFIG.flingMaxFactor;
            if (velocity > maxF) velocity = maxF;
            if (velocity < -maxF) velocity = -maxF;
          }
        }
      }
      mobileTouchHoldPause = galleryTouchIdentifiers.size > 0;
      if (!mobileTouchHoldPause) {
        touchBaseOffset = offsetX;
      }
      startAnimation();
    };

    document.addEventListener('touchstart', handlers.docTouchStartCapture, { passive: true, capture: true });
    document.addEventListener('touchmove', handlers.docTouchMoveCapture, { passive: false, capture: true });
    document.addEventListener('touchend', handlers.docTouchEndCapture, { passive: true, capture: true });
    document.addEventListener('touchcancel', handlers.docTouchEndCapture, { passive: true, capture: true });

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
      } else {
        startAnimation();
      }
    };
    document.addEventListener('visibilitychange', handlers.vis);

    function destroy() {
      cancelRewind();
      stopAnimation();
      if (touchRaf) {
        cancelAnimationFrame(touchRaf);
        touchRaf = 0;
      }
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      if (trackResizeObserver) {
        try {
          trackResizeObserver.disconnect();
        } catch (e) {}
      }
      gallery.removeEventListener('wheel', handlers.wheel);
      track.removeEventListener('pointerdown', handlers.pointerdown);
      track.removeEventListener('pointermove', handlers.pointermove);
      track.removeEventListener('pointerup', handlers.pointerup);
      track.removeEventListener('pointercancel', handlers.pointercancel);
      window.removeEventListener('pointerup', handlers.pointerup);
      document.removeEventListener('touchstart', handlers.docTouchStartCapture, { capture: true });
      document.removeEventListener('touchmove', handlers.docTouchMoveCapture, { capture: true });
      document.removeEventListener('touchend', handlers.docTouchEndCapture, { capture: true });
      document.removeEventListener('touchcancel', handlers.docTouchEndCapture, { capture: true });
      galleryTouchIdentifiers.clear();
      galleryTouchLast = Object.create(null);
      touchActiveId = null;
      touchMode = 'none';
      window.removeEventListener('resize', handlers.resize);
      window.removeEventListener('orientationchange', handlers.orientationchange);
      if (window.visualViewport && handlers.vvResize) window.visualViewport.removeEventListener('resize', handlers.vvResize);
      window.removeEventListener('hbw:counter-hide', handlers.counterHide);
      window.removeEventListener('hbw:counter-show', handlers.counterShow);
      document.removeEventListener('click', handlers.navClick);
      document.removeEventListener('visibilitychange', handlers.vis);
      if (progressWrap && progressWrap.parentNode) progressWrap.parentNode.removeChild(progressWrap);
      if (counterEl && counterEl.parentNode) counterEl.parentNode.removeChild(counterEl);
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
            resizeDebounceTimer = setTimeout(onResizeImmediate, CONFIG.resizeDebounceMs);
          });
          trackResizeObserver.observe(track);
        } catch (err) {
          trackResizeObserver = null;
        }
      }

      startAnimation();
    });
  }

  function mountAllGalleries() {
    var nodes = document.querySelectorAll('.project-gallery');
    if (!nodes.length) return;
    for (var i = 0; i < nodes.length; i++) initOneGallery(nodes[i]);
  }
  window.__HBW_PROJECT_GALLERY_MOUNT_ALL__ = mountAllGalleries;

  updateVH();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      updateVH();
      mountAllGalleries();
    });
  } else {
    mountAllGalleries();
  }

  function onSwupGalleryLayout() {
    updateVH();
    mountAllGalleries();
  }

  document.addEventListener('page:swup-complete', onSwupGalleryLayout, false);
  document.addEventListener('swup:page:view', onSwupGalleryLayout, false);
})();;

/* ---- 16-project-gallery-b.js ---- */
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
    var mediaRoot = track;
    try {
      var sub3Path = (location.pathname || '').replace(/\/+$/, '') || '/';
      if (sub3Path === '/projects/sub-3') {
        var firstSpread = track.querySelector('.hbw-hscroll__item, .project-gallery__item');
        if (firstSpread) mediaRoot = firstSpread;
      }
    } catch (eSub3Media) {}
    var imgs = mediaRoot.querySelectorAll('img');
    var vids = mediaRoot.querySelectorAll('video');
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
      img.addEventListener(
        'load',
        function () {
          pending--;
          arm();
        },
        { once: true }
      );
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
    return String(index).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
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
    var desktopCycleWidth = 0;
    var desktopVirtualX = 0;
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

    function getScrollBounds() {
      var gw = gallery.clientWidth || 1;
      var tw = track.scrollWidth || 0;
      var extra = tw - gw;
      if (extra <= 0) return { minX: 0, maxX: 0, span: 0 };
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

    function updateDesktopCycleWidth() {
      if (isMobile) return;
      gapPx = parseGapPx(track);
      var w = 0;
      for (var i = 0; i < originals.length; i++) {
        w += originals[i].offsetWidth || 0;
        if (i !== originals.length - 1) w += gapPx;
      }
      desktopCycleWidth = Math.max(1, w || 1);
    }

    function recycleForward() {
      if (isMobile) return;
      var first = track.firstElementChild;
      while (first && -offsetX >= itemStepWidth(first) - CONFIG.recycleEps) {
        var step = itemStepWidth(first);
        offsetX += step;
        track.appendChild(first);
        first = track.firstElementChild;
      }
    }

    function recycleBackward() {
      if (isMobile) return;
      var last = track.lastElementChild;
      while (last && offsetX > CONFIG.recycleEps) {
        var step = itemStepWidth(last);
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
      for (var c = 0; c < clones.length; c++) clones[c].remove();
      var vw = gallery.clientWidth || window.innerWidth || 1;
      var targetWidth = vw * CONFIG.minViewportMultiplier;
      var safety = 0;
      while (track.scrollWidth < targetWidth && originals.length > 0 && safety < 500) {
        safety++;
        for (var i = 0; i < originals.length; i++) {
          if (track.scrollWidth >= targetWidth) break;
          var el = originals[i];
          var clone = el.cloneNode(true);
          clone.setAttribute('data-clone', 'true');
          clone.setAttribute('data-hbw-orig-idx', el.getAttribute('data-hbw-orig-idx') || '0');
          track.appendChild(clone);
        }
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
      if (counterEl && counterEl.textContent !== nextText) counterEl.textContent = nextText;
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
      track.style.transform = 'translate3d(' + Math.round(offsetX * 100) / 100 + 'px, -50%, 0)';
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
        !isMobile && !reduceMotion && CONFIG.desktopAutoDrift > 0.0001 ? CONFIG.desktopAutoDrift : 0;
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

      if (isMobile) clampOffsetAndVelocity();
      else applyDesktopRecycle();

      applyTransform();
      updateProgress();

      var now = window.performance && window.performance.now ? window.performance.now() : Date.now();
      if (!lastIndexSync || now - lastIndexSync >= indexSyncIntervalMs) {
        syncIndexFromViewport();
        lastIndexSync = now;
      }

      if (!isDragging && Math.abs(velocity) < CONFIG.idleVelocityEpsilon) {
        velocity = 0;
        if (deskDrift > 0.0001 || mobDrift > 0.0001) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        rafId = null;
        if (isMobile && isAtEnd()) startRewindToStart();
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function startAnimation() {
      if (!rafId) rafId = requestAnimationFrame(tick);
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

      if (isMobile && e.pointerType === 'touch') e.preventDefault();

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

      if (isMobile) offsetX = dragStartOffset + dx - dy * CONFIG.mobileDyScale;
      else {
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
      if (isMobile) clampOffsetAndVelocity();
      else applyDesktopRecycle();

      applyTransform();
      updateProgress();
      syncIndexFromViewport();
    };

    handlers.pointerup = function (e) {
      if (!isDragging) return;
      isDragging = false;
      gallery.classList.remove('is-dragging');

      if (!reduceMotion && Date.now() - lastPointerTime < 56) {
        var fv = flingVx - (isMobile ? flingVy * CONFIG.mobileDyScale : 0);
        velocity = fv * CONFIG.flingMul;
        var maxF = (gallery.clientWidth || window.innerWidth || 1) * CONFIG.flingMaxFactor;
        if (velocity > maxF) velocity = maxF;
        if (velocity < -maxF) velocity = -maxF;
      }

      if (isMobile) clampOffsetAndVelocity();
      else applyDesktopRecycle();

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
      } else {
        startAnimation();
      }
    };
    document.addEventListener('visibilitychange', handlers.vis);

    function destroy() {
      cancelRewind();
      stopAnimation();
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      if (trackResizeObserver) {
        try {
          trackResizeObserver.disconnect();
        } catch (e) {}
      }
      gallery.removeEventListener('wheel', handlers.wheel);
      track.removeEventListener('pointerdown', handlers.pointerdown);
      track.removeEventListener('pointermove', handlers.pointermove);
      track.removeEventListener('pointerup', handlers.pointerup);
      track.removeEventListener('pointercancel', handlers.pointercancel);
      window.removeEventListener('pointerup', handlers.pointerup);
      window.removeEventListener('resize', handlers.resize);
      window.removeEventListener('orientationchange', handlers.orientationchange);
      if (window.visualViewport && handlers.vvResize) {
        window.visualViewport.removeEventListener('resize', handlers.vvResize);
      }
      window.removeEventListener('hbw:counter-hide', handlers.counterHide);
      window.removeEventListener('hbw:counter-show', handlers.counterShow);
      document.removeEventListener('click', handlers.navClick);
      document.removeEventListener('visibilitychange', handlers.vis);
      if (progressWrap && progressWrap.parentNode) progressWrap.parentNode.removeChild(progressWrap);
      if (counterEl && counterEl.parentNode) counterEl.parentNode.removeChild(counterEl);
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
            resizeDebounceTimer = setTimeout(onResizeImmediate, CONFIG.resizeDebounceMs);
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
      for (var i = 0; i < nodes.length; i++) initOneGallery(nodes[i]);
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
  // Expose a safe remount hook for Swup / duplicate embeds.
  window.__HBW_PROJECT_GALLERY_MOUNT_ALL__ = mountAllGalleries;

  window.HBWGalleryCounter = window.HBWGalleryCounter || {
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
})();;

/* ---- 17-project-gallery.js ---- */
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
    try {
      var waitPath = (location.pathname || '').replace(/\/+$/, '') || '/';
      if (waitPath === '/projects/sub-3' && scope) {
        var firstWait = scope.querySelector('.hbw-hscroll__item, .project-gallery__item');
        if (firstWait) scope = firstWait;
      }
    } catch (eSub3Wait) {}
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
})();;

/* ---- 18-project-gallery.js ---- */
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
})();;

/* ---- 19-studio-swipe.js ---- */
(function () {
    var BOUND = "__HBW_ABOUT_SWIPE_BOUND__";
    var LEAVE_NAV_DELAY_MS = 460; // matches --about-swipe-leave-duration (~440ms) + small buffer

    /* Prefer #about-contents / .about-contents (About page). Only then .about-container. */
    function getContainer() {
      return (
        document.querySelector("#about-contents, .about-contents") ||
        document.querySelector("#about-container, .about-container")
      );
    }

    function isStudioDockedPage() {
      try {
        var seg = (location.pathname || "").replace(/\/$/, "").split("/").pop();
        return seg === "studio";
      } catch (e) {
        return false;
      }
    }

    function normPath(p) {
      return (p || "/").replace(/\/+$/, "") || "/";
    }

    /** About swipe embed is used on /studio and may be used on /about — treat both as “about shell”. */
    function isAboutShellPage() {
      if (isStudioDockedPage()) return true;
      try {
        var p = normPath(location.pathname);
        return p === "/about" || p.endsWith("/about");
      } catch (e2) {
        return false;
      }
    }

    function shouldRunLeaveForLink(a) {
      if (!a || !a.getAttribute) return false;
      if (a.target === "_blank") return false;
      var raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return false;
      try {
        var u = new URL(a.href, location.origin);
        if (u.origin !== location.origin) return false;
        return normPath(u.pathname) !== normPath(location.pathname);
      } catch (e3) {
        return false;
      }
    }

    function prefersReduced() {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e) {
        return false;
      }
    }

    function scrollPageToTop() {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      requestAnimationFrame(function () {
        window.scrollTo(0, 0);
        var root = document.scrollingElement || document.documentElement;
        if (root) root.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }

    function releaseBootAndShow(container) {
      if (!container) return;
      if (prefersReduced()) {
        container.classList.remove("is-booting");
        container.classList.add("is-visible");
        container.classList.remove("is-leaving");
        return;
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!container.isConnected) return;
          container.classList.remove("is-booting");
          container.classList.add("is-visible");
          container.classList.remove("is-leaving");
        });
      });
    }

    function liftAboutOutOfSwupForLeave(c) {
      if (!c || c.dataset.hbwAboutLeaveLayer) return;
      var swupEl = document.querySelector(".swup");
      var inSwup = swupEl && swupEl.contains(c);
      /* If the panel isn’t under .swup, Swup may still replace the rest of the page — lift anyway so the node survives for the exit transition. */
      if (!inSwup && (!c.isConnected || !document.documentElement.contains(c))) return;
      var rect = c.getBoundingClientRect();
      c.dataset.hbwAboutLeaveLayer = "1";
      document.body.appendChild(c);
      c.style.position = "fixed";
      c.style.top = rect.top + "px";
      c.style.left = rect.left + "px";
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      c.style.margin = "0";
      c.style.boxSizing = "border-box";
      c.style.zIndex = "9999999990";
      c.style.pointerEvents = "none";
    }

    function startLeaveOnly() {
      if (prefersReduced()) return;
      var container = getContainer();
      if (!container) return;
      liftAboutOutOfSwupForLeave(container);
      if (!container.isConnected) return;
      /*
        Fast clicks can happen while the panel is still in BOOT state (off-canvas with transitions disabled).
        Force a stable visible baseline so the leave swipe always animates instead of flashing off.
      */
      container.classList.remove("is-leaving");
      container.classList.remove("is-booting");
      container.classList.add("is-visible");
      /*
        Double rAF after lift: one frame to commit fixed layout + transform at translateX(0),
        then toggle — avoids a “dead” exit where the browser skipped interpolating after reparent.
        Panel is already on document.body so Swup won’t remove it next tick.
      */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!container.isConnected) return;
          container.classList.remove("is-visible");
          container.classList.add("is-leaving");
        });
      });
    }

    function safeNavigate(url) {
      try {
        if (window.swup && typeof window.swup.navigate === "function") {
          window.swup.navigate(url);
          return;
        }
      } catch (e) {}
      window.location.href = url;
    }

    var enterGen = 0;

    function initEnter() {
      enterGen++;
      var gen = enterGen;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (gen !== enterGen) return;

          /*
            /studio: swup > #about-contents > .about-container wraps Hero + bio (see Navigator).
            Docking either layer translated the entire page off-screen. Keep both visible on load;
            manifesto link flow handles overlays in Manifesto Swipe Code.
          */
          if (isStudioDockedPage()) {
            scrollPageToTop();
            var outer = document.querySelector("#about-contents, .about-contents");
            var inner = document.querySelector("#about-container, .about-container");
            if (outer && inner && outer.contains(inner)) {
              releaseBootAndShow(outer);
              releaseBootAndShow(inner);
              return;
            }
            var c = getContainer();
            if (!c) return;
            releaseBootAndShow(c);
            return;
          }

          var container = getContainer();
          if (!container) return;
          scrollPageToTop();
          container.classList.add("is-booting");
          container.classList.remove("is-visible");
          container.classList.remove("is-leaving");
          releaseBootAndShow(container);
        });
      });
    }

    function onPageShow(ev) {
      if (!ev.persisted) return;
      scrollPageToTop();
      if (isStudioDockedPage()) {
        var outer = document.querySelector("#about-contents, .about-contents");
        var inner = document.querySelector("#about-container, .about-container");
        if (outer && inner && outer.contains(inner)) {
          releaseBootAndShow(outer);
          releaseBootAndShow(inner);
          return;
        }
      }
      var container = getContainer();
      if (!container) return;
      container.classList.add("is-booting");
      container.classList.remove("is-leaving");
      container.classList.remove("is-visible");
      releaseBootAndShow(container);
    }

    function cleanupLiftedNodes() {
      document.querySelectorAll("[data-hbw-about-leave-layer]").forEach(function (n) {
        n.remove();
      });
    }

    if (!window[BOUND]) {
      window[BOUND] = true;

      document.addEventListener(
        "click",
        function (event) {
          var t = event.target;
          if (!t || !t.closest) return;
          if (t.closest(".hbw-back, .hbw-bottom-back")) startLeaveOnly();
        },
        true
      );

      // Tap outside the about panel closes it and returns to Home.
      document.addEventListener(
        "pointerdown",
        function (event) {
          if (!isAboutShellPage()) return;
          var t = event.target;
          if (!t || !t.closest) return;
          if (t.closest(".hbw-floatnav")) return;
          var outer = document.querySelector("#about-contents, .about-contents");
          var inner = document.querySelector("#about-container, .about-container");
          var c = getContainer();
          if (!c) return;
          // /studio often renders #about-contents as a full-page wrapper, with .about-container inside it.
          // Treat taps on the outer wrapper (but not inside the inner container) as "outside".
          if (outer && inner && outer.contains(inner)) {
            if (inner.contains(t)) return;
          } else {
            if (t.closest("#about-contents, .about-contents, #about-container, .about-container")) return;
          }
          if (prefersReduced()) {
            safeNavigate("/");
            return;
          }
          startLeaveOnly();
          setTimeout(function () {
            safeNavigate("/");
          }, LEAVE_NAV_DELAY_MS);
        },
        true
      );

      /*
        Capture phase, before Swup: inline text links don’t dispatch about:leave (float nav does).
        visit:start often fires after Swup begins replacing DOM — too late to lift the panel. Starting
        the leave here matches the working float-nav timing.
      */
      document.addEventListener(
        "click",
        function (event) {
          if (!isAboutShellPage()) return;
          var t = event.target;
          if (!t || !t.closest) return;
          if (t.closest(".hbw-floatnav")) return;
          if (t.closest(".hbw-back, .hbw-bottom-back")) return;
          var a = t.closest("a[href]");
          if (!a || !shouldRunLeaveForLink(a)) return;
          if (a.hasAttribute("data-hbw-studio-manifesto") || a.classList.contains("hbw-studio-manifesto-link"))
            return;
          /*
            /studio: when the manifesto panel is on top (is-visible), Manifesto Swipe handles the exit;
            animating #about-contents here would feel out of sync.
          */
          if (isStudioDockedPage()) {
            var man = document.querySelector("#manifesto-contents, .manifesto-contents");
            if (man && man.classList.contains("is-visible")) return;
          }
          // Delay navigation so the leave swipe is visible (same feel as Manifesto swipe).
          event.preventDefault();
          startLeaveOnly();
          setTimeout(function () {
            safeNavigate(a.href);
          }, LEAVE_NAV_DELAY_MS);
        },
        true
      );

      document.addEventListener("about:leave", startLeaveOnly, false);
      document.addEventListener("swup:visit:start", startLeaveOnly, false);

      document.addEventListener("page:swup-complete", cleanupLiftedNodes, false);
    }

    if (!window.__HBW_ABOUT_SWIPE_PAGESHOW__) {
      window.__HBW_ABOUT_SWIPE_PAGESHOW__ = true;
      window.addEventListener("pageshow", onPageShow, false);
    }

    document.addEventListener("DOMContentLoaded", initEnter, false);
    document.addEventListener("page:swup-complete", initEnter, false);

    if (document.readyState !== "loading") initEnter();
  })();;

/* ---- 20-manifesto-swipe.js ---- */
(function () {
    var BOUND = "__HBW_MANIFESTO_SWIPE_BOUND__";
    var LEAVE_NAV_DELAY_MS = 460; // matches --manifesto-swipe-leave-duration (~440ms) + small buffer

    function getContainer() {
      return document.querySelector("#manifesto-contents, .manifesto-contents");
    }

    function isStudioDockedPage() {
      try {
        var seg = (location.pathname || "").replace(/\/$/, "").split("/").pop();
        return seg === "studio";
      } catch (e) {
        return false;
      }
    }

    function normPath(p) {
      return (p || "/").replace(/\/+$/, "") || "/";
    }

    /** Standalone /manifesto, or /studio while the manifesto layer is visibly open. */
    function isManifestoShellPage() {
      try {
        var p = normPath(location.pathname);
        if (p === "/manifesto" || p.endsWith("/manifesto")) return true;
      } catch (e1) {}
      if (!isStudioDockedPage()) return false;
      var m = getContainer();
      return !!(m && m.classList.contains("is-visible"));
    }

    function shouldRunLeaveForLink(a) {
      if (!a || !a.getAttribute) return false;
      if (a.target === "_blank") return false;
      var raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return false;
      try {
        var u = new URL(a.href, location.origin);
        if (u.origin !== location.origin) return false;
        return normPath(u.pathname) !== normPath(location.pathname);
      } catch (e2) {
        return false;
      }
    }

    function prefersReduced() {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e) {
        return false;
      }
    }

    function scrollPageToTop() {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      requestAnimationFrame(function () {
        window.scrollTo(0, 0);
        var root = document.scrollingElement || document.documentElement;
        if (root) root.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }

    function releaseBootAndShow(container) {
      if (!container) return;
      if (prefersReduced()) {
        container.classList.remove("is-booting");
        container.classList.add("is-visible");
        container.classList.remove("is-leaving");
        return;
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!container.isConnected) return;
          container.classList.remove("is-booting");
          container.classList.add("is-visible");
          container.classList.remove("is-leaving");
        });
      });
    }

    /* Match About: lift so Swup doesn’t remove the node mid-transition; allow nodes outside .swup too. */
    function liftManifestoOutOfSwupForLeave(c) {
      if (!c || c.dataset.hbwManifestoLeaveLayer) return;
      var swupEl = document.querySelector(".swup");
      var inSwup = swupEl && swupEl.contains(c);
      if (!inSwup && (!c.isConnected || !document.documentElement.contains(c))) return;
      var rect = c.getBoundingClientRect();
      c.dataset.hbwManifestoLeaveLayer = "1";
      document.body.appendChild(c);
      c.style.position = "fixed";
      c.style.top = rect.top + "px";
      c.style.left = rect.left + "px";
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      c.style.margin = "0";
      c.style.boxSizing = "border-box";
      c.style.zIndex = "9999999990";
      c.style.pointerEvents = "none";
    }

    function startLeaveOnly() {
      if (prefersReduced()) return;
      var container = getContainer();
      if (!container) return;
      liftManifestoOutOfSwupForLeave(container);
      if (!container.isConnected) return;
      /*
        Fast clicks can happen while the manifesto is still in BOOT state (off-canvas with transitions disabled).
        Force a stable visible baseline so the leave swipe always animates instead of flashing off.
      */
      container.classList.remove("is-leaving");
      container.classList.remove("is-booting");
      container.classList.add("is-visible");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!container.isConnected) return;
          container.classList.remove("is-visible");
          container.classList.add("is-leaving");
        });
      });
    }

    function safeNavigate(url) {
      try {
        if (window.swup && typeof window.swup.navigate === "function") {
          window.swup.navigate(url);
          return;
        }
      } catch (e) {}
      window.location.href = url;
    }

    var enterGen = 0;

    function initEnter() {
      enterGen++;
      var gen = enterGen;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (gen !== enterGen) return;
          var container = getContainer();
          if (!container) return;

          if (isStudioDockedPage()) {
            scrollPageToTop();
            container.classList.remove("is-visible", "is-leaving");
            container.classList.add("is-booting");
            if (prefersReduced()) {
              container.classList.remove("is-booting");
              return;
            }
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                if (gen !== enterGen || !container.isConnected) return;
                container.classList.remove("is-booting");
              });
            });
            return;
          }

          scrollPageToTop();
          container.classList.add("is-booting");
          container.classList.remove("is-visible");
          container.classList.remove("is-leaving");
          releaseBootAndShow(container);
        });
      });
    }

    function onPageShow(ev) {
      var container = getContainer();
      if (!container) return;
      scrollPageToTop();
      if (!ev.persisted) return;
      if (isStudioDockedPage()) {
        container.classList.add("is-booting");
        container.classList.remove("is-leaving");
        container.classList.remove("is-visible");
        if (prefersReduced()) {
          container.classList.remove("is-booting");
          return;
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (!container.isConnected) return;
            container.classList.remove("is-booting");
          });
        });
        return;
      }
      container.classList.add("is-booting");
      container.classList.remove("is-leaving");
      container.classList.remove("is-visible");
      releaseBootAndShow(container);
    }

    function cleanupLiftedNodes() {
      document.querySelectorAll("[data-hbw-manifesto-leave-layer]").forEach(function (n) {
        n.remove();
      });
    }

    if (!window[BOUND]) {
      window[BOUND] = true;

      document.addEventListener(
        "click",
        function (event) {
          var t = event.target;
          if (!t || !t.closest) return;
          var inManifesto = t.closest("#manifesto-contents, .manifesto-contents");
          if (inManifesto && t.closest("[data-hbw-manifesto-back]")) {
            // Delay navigation so the leave swipe is visible (matches About/Studio feel).
            var a0 = t.closest("a[href]");
            if (a0 && shouldRunLeaveForLink(a0)) {
              event.preventDefault();
              startLeaveOnly();
              setTimeout(function () {
                safeNavigate(a0.href);
              }, LEAVE_NAV_DELAY_MS);
            } else {
              startLeaveOnly();
            }
            return;
          }
          if (t.closest(".hbw-back, .hbw-bottom-back")) startLeaveOnly();
        },
        true
      );

      // Tap outside the manifesto panel closes it and returns to Home.
      document.addEventListener(
        "pointerdown",
        function (event) {
          if (!isManifestoShellPage()) return;
          var t = event.target;
          if (!t || !t.closest) return;
          if (t.closest(".hbw-floatnav")) return;
          var c = getContainer();
          if (!c) return;
          if (t.closest("#manifesto-contents, .manifesto-contents")) return;
          if (prefersReduced()) {
            safeNavigate("/");
            return;
          }
          startLeaveOnly();
          setTimeout(function () {
            safeNavigate("/");
          }, LEAVE_NAV_DELAY_MS);
        },
        true
      );

      /* Capture before Swup — inline links never get float-nav’s custom leave events. */
      document.addEventListener(
        "click",
        function (event) {
          if (!isManifestoShellPage()) return;
          var t = event.target;
          if (!t || !t.closest) return;
          if (t.closest(".hbw-floatnav")) return;
          if (t.closest(".hbw-back, .hbw-bottom-back")) return;
          var a = t.closest("a[href]");
          if (!a || !shouldRunLeaveForLink(a)) return;
          if (a.hasAttribute("data-hbw-studio-manifesto") || a.classList.contains("hbw-studio-manifesto-link"))
            return;
          // Delay navigation so the leave swipe is visible (bottom Webflow "button", inline links, etc).
          event.preventDefault();
          startLeaveOnly();
          setTimeout(function () {
            safeNavigate(a.href);
          }, LEAVE_NAV_DELAY_MS);
        },
        true
      );

      /* Nav / Swup hooks — same custom event name as legacy About pairing */
      document.addEventListener("about:leave", startLeaveOnly, false);
      document.addEventListener("manifesto:leave", startLeaveOnly, false);
      document.addEventListener("swup:visit:start", startLeaveOnly, false);

      document.addEventListener("page:swup-complete", cleanupLiftedNodes, false);
    }

    if (!window.__HBW_MANIFESTO_SWIPE_PAGESHOW__) {
      window.__HBW_MANIFESTO_SWIPE_PAGESHOW__ = true;
      window.addEventListener("pageshow", onPageShow, false);
    }

    document.addEventListener("DOMContentLoaded", initEnter, false);
    document.addEventListener("page:swup-complete", initEnter, false);

    if (document.readyState !== "loading") initEnter();
  })();

  /* /studio: bio link opens about panel, then manifesto; back control uses .hbw-back or [data-hbw-manifesto-back]. */
  (function () {
    var KEY = "__HBW_STUDIO_MANIFESTO_FLOW__";
    if (window[KEY]) return;
    window[KEY] = true;

    var PANEL_MS = 380;

    function isStudioDockedPage() {
      try {
        var seg = (location.pathname || "").replace(/\/$/, "").split("/").pop();
        return seg === "studio";
      } catch (e) {
        return false;
      }
    }

    function getAboutEl() {
      return (
        document.querySelector("#about-contents, .about-contents") ||
        document.querySelector("#about-container, .about-container")
      );
    }

    function getManifestoEl() {
      return document.querySelector("#manifesto-contents, .manifesto-contents");
    }

    function prefersReduced() {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e) {
        return false;
      }
    }

    function bootShow(el) {
      el.classList.remove("is-leaving");
      el.classList.add("is-booting");
      el.classList.remove("is-visible");
      if (prefersReduced()) {
        el.classList.remove("is-booting");
        el.classList.add("is-visible");
        return;
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!el.isConnected) return;
          el.classList.remove("is-booting");
          el.classList.add("is-visible");
        });
      });
    }

    function openStudioManifestoFlow() {
      if (!isStudioDockedPage()) return;
      var man = getManifestoEl();
      if (!man) return;
      var outer = document.querySelector("#about-contents, .about-contents");
      var inner = document.querySelector("#about-container, .about-container");
      /*
        When #about-contents > .about-container wraps the page, About Swipe keeps both visible.
        Only #manifesto-contents should slide in here (no second bootShow on about layers).
      */
      if (outer && inner && outer.contains(inner)) {
        if (prefersReduced()) {
          bootShow(man);
          return;
        }
        setTimeout(function () {
          if (!man.isConnected) return;
          bootShow(man);
        }, PANEL_MS);
        return;
      }
      var about = getAboutEl();
      if (!about) return;
      bootShow(about);
      if (prefersReduced()) {
        bootShow(man);
        return;
      }
      setTimeout(function () {
        if (!man.isConnected) return;
        bootShow(man);
      }, PANEL_MS);
    }

    document.addEventListener(
      "click",
      function (e) {
        if (!isStudioDockedPage()) return;
        var a = e.target.closest("a[data-hbw-studio-manifesto], a.hbw-studio-manifesto-link");
        if (!a) return;
        e.preventDefault();
        openStudioManifestoFlow();
      },
      true
    );
  })();

  /* /manifesto only: ensure float-nav label reads "Manifesto" even if sitewide nav bundle is older. */
  (function () {
    function isManifestoPath() {
      try {
        var p = (location.pathname || "").toLowerCase().replace(/\/+$/, "") || "/";
        return p === "/manifesto" || p.endsWith("/manifesto");
      } catch (e) {
        return false;
      }
    }

    function syncLabel() {
      if (!isManifestoPath()) return;
      var el = document.querySelector("[data-hbw-menu-label]");
      if (!el) return;
      var cur = (el.textContent || "").trim();
      if (cur === "Manifesto") return;
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.textContent = "Manifesto";
          return;
        }
      } catch (eRm) {}
      el.classList.add("is-changing");
      void el.offsetWidth;
      setTimeout(function () {
        el.textContent = "Manifesto";
        requestAnimationFrame(function () {
          el.classList.remove("is-changing");
        });
      }, 160);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", syncLabel, { once: true });
    } else {
      syncLabel();
    }
    // Re-assert after in-site transitions / rebinds.
    document.addEventListener("page:swup-complete", syncLabel, false);
    document.addEventListener("swup:page:view", syncLabel, false);
    window.addEventListener("pageshow", syncLabel, false);
  })();;

/* ---- 21-collections-world.js ---- */
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
})();;

/* ---- 22-collections-world.js ---- */
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
})();;

/* ---- 23-intake.js ---- */
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".w-form form");
    if (!form) return;

    const steps = Array.from(form.querySelectorAll(".step")).sort((a, b) => {
      const aNum = parseInt((a.id.match(/step-(\d+)/) || [])[1] || 0, 10);
      const bNum = parseInt((b.id.match(/step-(\d+)/) || [])[1] || 0, 10);
      return aNum - bNum;
    });

    if (!steps.length) return;

    let currentStep = 0;
    let isAnimating = false;

    const ENTER_DURATION = 420;
    const EXIT_DURATION = 240;

    function getFields(step) {
      return Array.from(step.querySelectorAll("input, textarea, select")).filter((field) => {
        const type = (field.type || "").toLowerCase();
        return (
          type !== "hidden" &&
          type !== "submit" &&
          type !== "button" &&
          type !== "reset" &&
          !field.disabled
        );
      });
    }

    function validateStep(step) {
      const fields = getFields(step);

      for (const field of fields) {
        if (!field.checkValidity()) {
          field.reportValidity();
          field.focus();
          return false;
        }
      }

      return true;
    }

    function focusFirstField(step) {
      const firstField = getFields(step)[0];
      if (firstField) {
        setTimeout(() => firstField.focus(), 120);
      }
    }

    function resetStepState(step) {
      step.classList.remove("active", "is-entering", "is-leaving");
      step.style.display = "none";
    }

    function showInitialStep(index) {
      steps.forEach(resetStepState);

      const step = steps[index];
      step.style.display = "block";
      step.classList.add("active");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          step.classList.add("is-entering");
          focusFirstField(step);
        });
      });
    }

    function transitionToStep(nextIndex) {
      if (isAnimating) return;
      if (nextIndex < 0 || nextIndex >= steps.length || nextIndex === currentStep) return;

      isAnimating = true;

      const current = steps[currentStep];
      const next = steps[nextIndex];

      current.classList.remove("is-entering");
      current.classList.add("is-leaving");

      setTimeout(() => {
        current.classList.remove("active", "is-leaving");
        current.style.display = "none";

        next.style.display = "block";
        next.classList.add("active");

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            next.classList.add("is-entering");
            focusFirstField(next);
          });
        });

        currentStep = nextIndex;

        setTimeout(() => {
          isAnimating = false;
        }, ENTER_DURATION);
      }, EXIT_DURATION);
    }

    function nextStep() {
      const activeStep = steps[currentStep];
      if (!activeStep) return;
      if (!validateStep(activeStep)) return;

      if (currentStep < steps.length - 1) {
        transitionToStep(currentStep + 1);
      }
    }

    function prevStep() {
      if (currentStep > 0) {
        transitionToStep(currentStep - 1);
      }
    }

    form.querySelectorAll(".next-btn").forEach((btn) => {
      if (btn.tagName === "BUTTON") {
        btn.type = "button";
      }

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        nextStep();
      });
    });

    form.querySelectorAll(".back-btn").forEach((btn) => {
      if (btn.tagName === "BUTTON") {
        btn.type = "button";
      }

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        prevStep();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (isAnimating) return;

      const activeStep = steps[currentStep];
      if (!activeStep) return;

      const activeElement = document.activeElement;
      const isTextarea = activeElement && activeElement.tagName === "TEXTAREA";

      if (e.key === "Enter" && !isTextarea) {
        const submitControl = activeStep.querySelector(
          'input[type="submit"], button[type="submit"]'
        );

        if (!submitControl) {
          e.preventDefault();
          nextStep();
        }
      }
    });

    showInitialStep(currentStep);
  });;

/* ---- 24-script-4dc8676b.js ---- */
!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);;

/* ---- 25-script-c96928a2.js ---- */
(function(){
  const mq = window.matchMedia('(min-width: 768px)');

  let rail = null;
  let bar  = null;
  let raf = null;
  let idleTimer = null;
  let attached = false;

  function update(){
    raf = null;
    if (!attached) return;

    const doc = document.scrollingElement || document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const y   = doc.scrollTop;

    // idle fade
    if (!rail._lastYSet || y !== rail._lastY){
      rail.classList.remove('is-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => rail.classList.add('is-idle'), 520);
      rail._lastYSet = true;
      rail._lastY = y;
    }

    // progress
    const p = Math.min(1, Math.max(0, y / max));
    bar.style.height = (p * 100).toFixed(2) + '%';

    // hide at bottom / no scroll
    const noScroll = doc.scrollHeight <= doc.clientHeight + 1;
    const atBottom = p >= 0.999;
    rail.classList.toggle('is-complete', noScroll || atBottom);
  }

  function onTick(){
    if (!raf) raf = requestAnimationFrame(update);
  }

  function attach(){
    if (attached || !mq.matches) return;

    rail = document.createElement('div');
    rail.className = 'scroll-progress is-idle';
    bar = document.createElement('div');
    bar.className = 'scroll-progress__bar';
    rail.appendChild(bar);
    document.body.appendChild(rail);

    ['scroll','resize','load'].forEach(evt=>{
      window.addEventListener(evt, onTick, { passive:true });
    });

    attached = true;
    update();
  }

  function detach(){
    if (!attached) return;

    ['scroll','resize','load'].forEach(evt=>{
      window.removeEventListener(evt, onTick);
    });

    clearTimeout(idleTimer);
    cancelAnimationFrame(raf);
    raf = null; idleTimer = null;

    rail?.remove();
    rail = null; bar = null;
    attached = false;
  }

  // Initial mount (desktop only)
  if (mq.matches) attach();

  // Respond to breakpoint changes (e.g., rotate or resize)
  const mqHandler = (e) => { e.matches ? attach() : detach(); };
  if (mq.addEventListener) mq.addEventListener('change', mqHandler);
  else mq.addListener(mqHandler); // older Safari fallback
})();;

/* ---- 26-script-19425304.js ---- */
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
})();;
