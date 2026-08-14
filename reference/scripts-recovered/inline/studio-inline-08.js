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
  })();