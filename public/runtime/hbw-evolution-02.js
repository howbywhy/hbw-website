/* Evolution 02 — Work / Index / Inspector prototype. Isolated; reversible. */
(function () {
  "use strict";

  var BOUND = "__HBW_EVOLUTION_02__";
  if (window[BOUND]) return;
  window[BOUND] = true;

  var HOME_KEY = "HBW_E02_HOME_MODE";
  var PROJECTS_KEY = "HBW_E02_PROJECTS_MODE";
  var infoLeaveTimer = 0;
  var infoOpen = false;

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

  function isHome() {
    return currentPath() === "/";
  }

  function isProjectsIndex() {
    return currentPath() === "/projects";
  }

  function isSub3() {
    return currentPath() === "/projects/sub-3";
  }

  function syncRouteFlags() {
    var p = currentPath();
    var root = document.documentElement;
    root.classList.toggle("hbw-route-home", p === "/");
    root.classList.toggle("hbw-route-projects", p === "/projects" || p.indexOf("/projects/") === 0);
    root.classList.toggle("hbw-route-projects-index", p === "/projects");
    root.classList.toggle("hbw-route-sub3", p === "/projects/sub-3");
    if (p !== "/projects/sub-3") {
      root.classList.remove("hbw-info-open");
    }
  }

  function readMode(key, fallback) {
    try {
      var v = sessionStorage.getItem(key);
      if (v === "index" || v === "visual" || v === "image") return v;
    } catch (e) {}
    return fallback;
  }

  function writeMode(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (e2) {}
  }

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function makeSwitch(className, leftLabel, rightLabel, leftValue, rightValue, current, onChange) {
    var wrap = document.createElement("div");
    wrap.className = className;
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", leftLabel + " or " + rightLabel);

    function btn(label, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hbw-mode-switch__btn";
      b.setAttribute("data-hbw-mode", value);
      b.textContent = label;
      b.setAttribute("aria-pressed", value === current ? "true" : "false");
      if (value === current) b.classList.add("is-current");
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        onChange(value);
      });
      return b;
    }

    wrap.appendChild(btn(leftLabel, leftValue));
    var rule = document.createElement("span");
    rule.className = "hbw-mode-switch__rule";
    rule.setAttribute("aria-hidden", "true");
    rule.textContent = "/";
    wrap.appendChild(rule);
    wrap.appendChild(btn(rightLabel, rightValue));
    return wrap;
  }

  function syncSwitch(wrap, current) {
    if (!wrap) return;
    var btns = wrap.querySelectorAll("[data-hbw-mode]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-hbw-mode") === current;
      btns[i].classList.toggle("is-current", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  /* ---- Home VISUAL / INDEX ---- */

  function getFolder() {
    var all = document.querySelectorAll("#folder-tab-container, .folder-tab-container");
    for (var i = 0; i < all.length; i++) {
      if (all[i].getAttribute && all[i].getAttribute("data-hbw-folder-tab-leave-layer")) continue;
      return all[i];
    }
    return all[0] || null;
  }

  function setHomePresent(folder, link) {
    if (!folder) return;
    var links = folder.querySelectorAll(".project-link-block");
    if (!link && links.length) link = links[0];
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("is-hbw-index-present", links[i] === link);
    }
  }

  function applyHomeMode(mode) {
    var folder = getFolder();
    if (!folder) return;
    var next = mode === "index" ? "index" : "visual";
    folder.classList.toggle("is-hbw-mode-index", next === "index");
    writeMode(HOME_KEY, next);
    syncSwitch(folder.querySelector(".hbw-mode-switch"), next);
    if (next === "index") {
      var current = folder.querySelector(".project-link-block.is-hbw-index-present");
      setHomePresent(folder, current);
    }
  }

  function bindHomeIndex() {
    if (isWorkspaceShell()) return;
    var folder = getFolder();
    if (!folder || folder.getAttribute("data-hbw-e02-home") === "1") {
      if (folder && isHome()) applyHomeMode(readMode(HOME_KEY, "visual"));
      return;
    }
    folder.setAttribute("data-hbw-e02-home", "1");

    var existing = folder.querySelector(".hbw-mode-switch");
    if (!existing) {
      var mode = readMode(HOME_KEY, "visual");
      var sw = makeSwitch(
        "hbw-mode-switch",
        "Visual",
        "Index",
        "visual",
        "index",
        mode,
        applyHomeMode
      );
      var list = folder.querySelector(".folder-projects-list");
      if (list && list.parentNode === folder) {
        folder.insertBefore(sw, list);
      } else {
        folder.insertBefore(sw, folder.firstChild);
      }
    }

    if (!folder.__hbwE02HomeBound) {
      folder.__hbwE02HomeBound = true;
      folder.addEventListener(
        "pointerover",
        function (ev) {
          if (!folder.classList.contains("is-hbw-mode-index")) return;
          var link = ev.target && ev.target.closest && ev.target.closest(".project-link-block");
          if (link && folder.contains(link)) setHomePresent(folder, link);
        },
        false
      );
      folder.addEventListener(
        "focusin",
        function (ev) {
          if (!folder.classList.contains("is-hbw-mode-index")) return;
          var link = ev.target && ev.target.closest && ev.target.closest(".project-link-block");
          if (link && folder.contains(link)) setHomePresent(folder, link);
        },
        false
      );
    }

    applyHomeMode(isHome() ? readMode(HOME_KEY, "visual") : "visual");
  }

  /* ---- Projects IMAGE / INDEX ---- */

  function humanizeId(id) {
    if (!id) return "";
    return id.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  }

  function setProjectsPresent(href) {
    var items = document.querySelectorAll(".home-page-portfolio .gallery-item-link");
    var match = null;
    for (var i = 0; i < items.length; i++) {
      var same = false;
      try {
        same = normPath(new URL(items[i].href, location.origin).pathname) === normPath(new URL(href, location.origin).pathname);
      } catch (e) {
        same = items[i].getAttribute("href") === href;
      }
      items[i].classList.toggle("is-hbw-index-present", same);
      if (same) match = items[i];
    }
    if (!match && items[0]) items[0].classList.add("is-hbw-index-present");
  }

  function buildProjectsIndex() {
    var existing = document.querySelector(".hbw-projects-index");
    if (existing) existing.parentNode.removeChild(existing);
    var portfolio = document.querySelector(".home-page-portfolio");
    if (!portfolio) return null;

    var nav = document.createElement("nav");
    nav.className = "hbw-projects-index";
    nav.setAttribute("aria-label", "Project index");

    var items = portfolio.querySelectorAll(".gallery-item-link");
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var href = item.getAttribute("href") || item.href || "";
      var name = textOf(item.querySelector(".pct-type"));
      var year = textOf(item.querySelector(".pcn-type"));
      var pos = humanizeId(item.id);
      if (!name || !href) continue;

      var a = document.createElement("a");
      a.className = "hbw-projects-index__row";
      a.href = href;
      a.setAttribute("data-hbw-index-href", href);

      var n = document.createElement("div");
      n.className = "hbw-projects-index__name";
      n.textContent = name;
      a.appendChild(n);

      if (pos) {
        var p = document.createElement("div");
        p.className = "hbw-projects-index__pos";
        p.textContent = pos;
        a.appendChild(p);
      }
      if (year) {
        var y = document.createElement("div");
        y.className = "hbw-projects-index__year";
        y.textContent = year;
        a.appendChild(y);
      }

      a.addEventListener("pointerover", function (ev) {
        var row = ev.currentTarget;
        setProjectsPresent(row.getAttribute("data-hbw-index-href"));
      });
      a.addEventListener("focus", function (ev) {
        var row = ev.currentTarget;
        setProjectsPresent(row.getAttribute("data-hbw-index-href"));
      });
      nav.appendChild(a);
    }

    document.body.appendChild(nav);
    if (items[0]) setProjectsPresent(items[0].getAttribute("href") || items[0].href);
    return nav;
  }

  function applyProjectsMode(mode) {
    var next = mode === "index" ? "index" : "image";
    document.documentElement.classList.toggle("hbw-projects-mode-index", next === "index" && isProjectsIndex());
    writeMode(PROJECTS_KEY, next);
    var sw = document.querySelector(".hbw-projects-switch");
    syncSwitch(sw, next);
    if (next === "index" && isProjectsIndex()) {
      if (!document.querySelector(".hbw-projects-index")) buildProjectsIndex();
    }
  }

  function bindProjectsIndex() {
    var leftoverNav = document.querySelector(".hbw-projects-index");
    var leftoverSw = document.querySelector(".hbw-projects-switch");
    if (!isProjectsIndex()) {
      document.documentElement.classList.remove("hbw-projects-mode-index");
      if (leftoverNav && leftoverNav.parentNode) leftoverNav.parentNode.removeChild(leftoverNav);
      if (leftoverSw && leftoverSw.parentNode) leftoverSw.parentNode.removeChild(leftoverSw);
      return;
    }

    if (!document.querySelector(".hbw-projects-switch")) {
      var mode = readMode(PROJECTS_KEY, "image");
      var sw = makeSwitch(
        "hbw-mode-switch hbw-projects-switch",
        "Image",
        "Index",
        "image",
        "index",
        mode,
        applyProjectsMode
      );
      document.body.appendChild(sw);
    }

    applyProjectsMode(readMode(PROJECTS_KEY, "image"));
  }

  /* ---- SUB:3 Inspector ---- */

  function readSpreadIndex() {
    var el = document.querySelector(".project-gallery__counter");
    var raw = textOf(el);
    var m = raw.match(/(\d+)/);
    var n = m ? parseInt(m[1], 10) : 1;
    if (!n || n < 1) n = 1;
    return n;
  }

  function sectionForSpread(n) {
    if (n <= 3) return "idea";
    if (n <= 6) return "shift";
    if (n <= 9) return "system";
    return "outcome";
  }

  function focusInspectorSection(info) {
    var key = sectionForSpread(readSpreadIndex());
    var section = info.querySelector('[data-hbw-info-section="' + key + '"]');
    if (!section) return;
    try {
      section.scrollIntoView({ block: "start", behavior: "auto" });
    } catch (e) {
      section.scrollTop = section.offsetTop;
    }
  }

  function getInfo() {
    return document.querySelector("[data-hbw-info]");
  }

  function closeInspector(immediate) {
    var info = getInfo();
    var toggle = document.querySelector(".hbw-info-toggle");
    infoOpen = false;
    document.documentElement.classList.remove("hbw-info-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("is-open");
    }
    if (!info) return;
    info.setAttribute("aria-hidden", "true");
    try {
      info.inert = true;
    } catch (e) {}
    if (infoLeaveTimer) {
      window.clearTimeout(infoLeaveTimer);
      infoLeaveTimer = 0;
    }
    if (immediate || prefersReduced() || !info.classList.contains("is-visible")) {
      info.classList.remove("is-visible");
      info.classList.remove("is-leaving");
      return;
    }
    info.classList.add("is-leaving");
    info.classList.remove("is-visible");
    infoLeaveTimer = window.setTimeout(function () {
      info.classList.remove("is-leaving");
      infoLeaveTimer = 0;
    }, 460);
  }

  function openInspector() {
    var info = getInfo();
    if (!info) return;
    var toggle = document.querySelector(".hbw-info-toggle");
    if (info.parentNode !== document.body) {
      document.body.appendChild(info);
    }
    if (infoLeaveTimer) {
      window.clearTimeout(infoLeaveTimer);
      infoLeaveTimer = 0;
    }
    info.classList.remove("is-leaving");
    info.setAttribute("aria-hidden", "false");
    try {
      info.inert = false;
    } catch (e) {}
    infoOpen = true;
    document.documentElement.classList.add("hbw-info-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
      toggle.classList.add("is-open");
    }
    try {
      void info.offsetWidth;
    } catch (e2) {}
    info.classList.add("is-visible");
    focusInspectorSection(info);
  }

  function toggleInspector() {
    if (infoOpen) closeInspector(false);
    else openInspector();
  }

  function isWorkspaceShell() {
    return document.documentElement.classList.contains("hbw-workspace");
  }

  function bindInspector() {
    if (isWorkspaceShell()) {
      var leftoverToggle = document.querySelector(".hbw-info-toggle");
      if (leftoverToggle && leftoverToggle.parentNode) leftoverToggle.parentNode.removeChild(leftoverToggle);
      return;
    }
    var leftoverToggle = document.querySelector(".hbw-info-toggle");
    var leftoverInfo = document.querySelector("body > [data-hbw-info]");
    if (!isSub3()) {
      closeInspector(true);
      if (leftoverToggle && leftoverToggle.parentNode) leftoverToggle.parentNode.removeChild(leftoverToggle);
      if (leftoverInfo && leftoverInfo.parentNode) leftoverInfo.parentNode.removeChild(leftoverInfo);
      return;
    }

    var info = document.querySelector(".swup [data-hbw-info], [data-hbw-info]");
    if (!info) return;

    if (!info.hasAttribute("inert")) {
      try {
        info.inert = true;
      } catch (e) {}
    }

    var toggle = document.querySelector(".hbw-info-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "hbw-info-toggle";
      toggle.textContent = "Info";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "hbw-info-panel");
      toggle.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        toggleInspector();
      });
      toggle.addEventListener("pointerdown", function (ev) {
        ev.stopPropagation();
      });
      document.body.appendChild(toggle);
    }
    var panel = info.querySelector(".hbw-info__panel");
    if (panel && !panel.id) panel.id = "hbw-info-panel";
  }

  function onKeydown(event) {
    if (event.key !== "Escape") return;
    if (!infoOpen) return;
    event.preventDefault();
    closeInspector(false);
  }

  function suppressWorkspaceLegacy() {
    if (!document.documentElement.classList.contains("hbw-workspace")) return;
    document.documentElement.classList.remove("hbw-ss-active", "hbw-project-page-loading");
    var ss = document.getElementById("hbw-ss");
    if (ss) {
      ss.classList.remove("on");
      ss.setAttribute("hidden", "true");
    }
    var sig = document.querySelectorAll(".hbw-signature");
    for (var i = 0; i < sig.length; i++) {
      sig[i].setAttribute("hidden", "true");
      try {
        sig[i].inert = true;
      } catch (e) {}
    }
    var mount = document.querySelector(".hbw-stage .hbw-stage__mount");
    var lifted = document.querySelectorAll("[data-hbw-pgc-leave-layer]");
    for (var j = 0; j < lifted.length; j++) {
      var node = lifted[j];
      node.removeAttribute("data-hbw-pgc-leave-layer");
      node.style.cssText = "";
      node.classList.remove("hbw-pgc-leaving", "hbw-panel");
      if (mount && !mount.contains(node)) mount.appendChild(node);
    }
  }

  function boot() {
    syncRouteFlags();
    suppressWorkspaceLegacy();
    bindHomeIndex();
    bindProjectsIndex();
    bindInspector();
  }

  document.addEventListener(
    "keydown",
    function (event) {
      if (!isWorkspaceShell()) return;
      if (event.code !== "KeyS" || event.metaKey || event.ctrlKey || event.altKey) return;
      var t = event.target;
      if (t && t.closest && t.closest("input, textarea, [contenteditable='true']")) return;
      event.stopImmediatePropagation();
    },
    true
  );

  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("page:swup-complete", boot, false);
  document.addEventListener("swup:page:view", boot, false);
  document.addEventListener("swup:content:replace", boot, false);
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
  window.setTimeout(boot, 480);
})();
