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
  })();