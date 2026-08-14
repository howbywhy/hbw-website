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
  })();