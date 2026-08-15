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
  })();