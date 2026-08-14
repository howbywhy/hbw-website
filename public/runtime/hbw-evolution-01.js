/* Evolution 01 — isolated rail, float-nav, and SUB:3 helpers. */
(function () {
  "use strict";

  var RAIL_KEY = "HBW_E01_RAIL_HREF";
  var BOUND = "__HBW_EVOLUTION_01__";
  if (window[BOUND]) return;
  window[BOUND] = true;

  function prefersReduced() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function normPath(p) {
    return (p || "/").replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  }

  function currentPath() {
    try {
      return normPath(location.pathname);
    } catch (e) {
      return "/";
    }
  }

  function isSub3() {
    return currentPath() === "/projects/sub-3";
  }

  function getFolder() {
    var all = document.querySelectorAll("#folder-tab-container, .folder-tab-container");
    for (var i = 0; i < all.length; i++) {
      if (all[i].getAttribute && all[i].getAttribute("data-hbw-folder-tab-leave-layer")) continue;
      return all[i];
    }
    return all[0] || null;
  }

  function storeRailHref(href) {
    try {
      if (href) sessionStorage.setItem(RAIL_KEY, href);
    } catch (e) {}
  }

  function readRailHref() {
    try {
      return sessionStorage.getItem(RAIL_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function linkMatchesStored(link, stored) {
    if (!link || !stored) return false;
    try {
      var a = new URL(link.href, location.origin);
      var b = new URL(stored, location.origin);
      return normPath(a.pathname) === normPath(b.pathname);
    } catch (e) {
      return link.getAttribute("href") === stored;
    }
  }

  function scrollRailItem(list, link) {
    if (!list || !link) return;
    var listRect = list.getBoundingClientRect();
    var r = link.getBoundingClientRect();
    var offset = r.top - listRect.top;
    var target = list.scrollTop + offset - Math.max(24, list.clientHeight * 0.16);
    if (target < 0) target = 0;
    if (prefersReduced()) {
      list.scrollTop = target;
      return;
    }
    if (typeof list.scrollTo === "function") {
      list.scrollTo({ top: target, behavior: "smooth" });
    } else {
      list.scrollTop = target;
    }
  }

  function applyRailActive(opts) {
    opts = opts || {};
    var folder = getFolder();
    if (!folder) return;
    var list = folder.querySelector(".folder-projects-list");
    if (!list) return;
    var links = list.querySelectorAll(".project-link-block");
    if (!links.length) return;

    var path = currentPath();
    var stored = readRailHref();
    var active = null;

    if (path.indexOf("/projects/") === 0 && path !== "/projects") {
      for (var i = 0; i < links.length; i++) {
        if (linkMatchesStored(links[i], path) || linkMatchesStored(links[i], stored)) {
          active = links[i];
          break;
        }
      }
    }
    if (!active && stored) {
      for (var j = 0; j < links.length; j++) {
        if (linkMatchesStored(links[j], stored)) {
          active = links[j];
          break;
        }
      }
    }

    for (var k = 0; k < links.length; k++) {
      links[k].classList.toggle("is-hbw-rail-active", links[k] === active);
    }
    folder.classList.toggle("is-hbw-rail-has-active", !!active);

    if (active && opts.scroll !== false && normPath(path) === "/") {
      scrollRailItem(list, active);
    }
  }

  function onRailClick(event) {
    var t = event.target;
    if (!t || !t.closest) return;
    var folder = t.closest("#folder-tab-container, .folder-tab-container");
    if (!folder) return;
    var link = t.closest("a.project-link-block, .project-link-block");
    if (!link || !link.href) return;
    storeRailHref(link.href);
    var list = folder.querySelector(".folder-projects-list");
    var links = list ? list.querySelectorAll(".project-link-block") : [];
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("is-hbw-rail-active", links[i] === link);
    }
    folder.classList.add("is-hbw-rail-has-active");
    if (list) scrollRailItem(list, link);
  }

  /* ---- float nav centre lock + keyboard ---- */

  function ensureNavBalance(inner) {
    if (!inner) return null;
    var existing = inner.querySelector("[data-hbw-nav-balance]");
    if (existing) return existing;
    var bal = document.createElement("span");
    bal.className = "hbw-floatnav__balance";
    bal.setAttribute("data-hbw-nav-balance", "1");
    bal.setAttribute("aria-hidden", "true");
    inner.insertBefore(bal, inner.firstChild);
    return bal;
  }

  function syncNavBalance(inner) {
    if (!inner) return;
    var bal = ensureNavBalance(inner);
    var tray = inner.querySelector(".hbw-floatnav__tray");
    if (!bal || !tray) return;
    var open = inner.classList.contains("is-open");
    var w = open ? Math.round(tray.getBoundingClientRect().width) : 0;
    if (w < 0) w = 0;
    bal.style.width = w + "px";
  }

  var navRo = null;
  function bindNavBalance() {
    var inner = document.querySelector("[data-hbw-nav]");
    if (!inner) return;
    ensureNavBalance(inner);
    var tray = inner.querySelector(".hbw-floatnav__tray");
    syncNavBalance(inner);
    if (navRo) {
      try {
        navRo.disconnect();
      } catch (e) {}
      navRo = null;
    }
    if (tray && typeof ResizeObserver !== "undefined") {
      navRo = new ResizeObserver(function () {
        syncNavBalance(inner);
      });
      navRo.observe(tray);
      navRo.observe(inner);
    }
  }

  function onNavKeydown(event) {
    var inner = document.querySelector("[data-hbw-nav]");
    if (!inner) return;
    var inNav = event.target && event.target.closest && event.target.closest("[data-hbw-nav], .hbw-floatnav");
    if (event.key === "Escape" && inner.classList.contains("is-open")) {
      inner.classList.remove("is-open");
      inner.classList.remove("hbw-floatnav--items-out");
      var menu = inner.querySelector("[data-hbw-menu-label]");
      if (menu) {
        menu.setAttribute("aria-expanded", "false");
        menu.focus();
      }
      syncNavBalance(inner);
      return;
    }
    if (!inNav) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    var links = Array.prototype.filter.call(inner.querySelectorAll(".hbw-floatnav__link"), function (a) {
      if (a.classList.contains("is-hidden")) return false;
      var cs = window.getComputedStyle(a);
      return cs.display !== "none" && cs.visibility !== "hidden" && a.offsetWidth > 0;
    });
    if (!links.length) return;
    var idx = links.indexOf(document.activeElement);
    if (idx < 0) idx = event.key === "ArrowRight" ? -1 : 0;
    var next = event.key === "ArrowRight" ? idx + 1 : idx - 1;
    if (next < 0) next = links.length - 1;
    if (next >= links.length) next = 0;
    event.preventDefault();
    inner.classList.add("is-open");
    links[next].focus();
  }

  /* ---- SUB:3 media ratios from metadata, first-spread eager ---- */

  function applyMediaRatio(item) {
    if (!item || !item.querySelector) return;
    var media = item.querySelector("img, video");
    if (!media) return;
    var w = 0;
    var h = 0;
    if (media.tagName === "IMG") {
      w = media.naturalWidth || 0;
      h = media.naturalHeight || 0;
    } else {
      w = media.videoWidth || 0;
      h = media.videoHeight || 0;
    }
    if (w > 0 && h > 0) {
      item.style.setProperty("--hbw-item-ratio", w + " / " + h);
    }
  }

  function prepareSub3() {
    if (!isSub3()) return;
    try {
      document.documentElement.classList.add("hbw-route-sub3");
      document.documentElement.classList.remove("hbw-project-page-loading");
    } catch (e) {}
    var gallery = document.querySelector(".project-gallery");
    if (!gallery) return;
    var track = gallery.querySelector(".project-gallery__track");
    if (!track) return;
    var items = track.querySelectorAll(".hbw-hscroll__item");
    for (var i = 0; i < items.length; i++) {
      applyMediaRatio(items[i]);
      var media = items[i].querySelector("img, video");
      if (!media) continue;
      if (i === 0 && media.tagName === "IMG") {
        try {
          media.setAttribute("loading", "eager");
          media.setAttribute("fetchpriority", "high");
        } catch (e2) {}
      }
      if (media.tagName === "IMG" && !media.complete) {
        media.addEventListener(
          "load",
          function (ev) {
            var item = ev.target && ev.target.closest && ev.target.closest(".hbw-hscroll__item");
            applyMediaRatio(item);
          },
          { once: true }
        );
      }
      if (media.tagName === "VIDEO") {
        media.addEventListener(
          "loadedmetadata",
          function (ev) {
            var item = ev.target && ev.target.closest && ev.target.closest(".hbw-hscroll__item");
            applyMediaRatio(item);
          },
          { once: true }
        );
      }
    }
  }

  function onSub3Arrow(event) {
    if (!isSub3()) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target && event.target.closest && event.target.closest("input, textarea, select, [contenteditable='true'], .hbw-floatnav"))
      return;
    var gallery = document.querySelector(".project-gallery");
    if (!gallery) return;
    event.preventDefault();
    var dir = event.key === "ArrowRight" ? 1 : -1;
    var dx = dir * Math.max(240, gallery.clientWidth * 0.42);
    gallery.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: dx,
        deltaY: 0,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  function boot() {
    if (isSub3()) {
      try {
        document.documentElement.classList.add("hbw-route-sub3");
      } catch (e) {}
      prepareSub3();
    }
    applyRailActive({ scroll: true });
    bindNavBalance();
  }

  document.addEventListener("click", onRailClick, true);
  document.addEventListener("keydown", onNavKeydown, true);
  document.addEventListener("keydown", onSub3Arrow, false);
  document.addEventListener("page:swup-complete", boot, false);
  window.addEventListener("pageshow", boot, false);
  window.addEventListener("popstate", function () {
    window.setTimeout(boot, 0);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, false);
  } else {
    boot();
  }
  window.setTimeout(boot, 80);
  window.setTimeout(function () {
    applyRailActive({ scroll: true });
    bindNavBalance();
    prepareSub3();
  }, 480);
})();
