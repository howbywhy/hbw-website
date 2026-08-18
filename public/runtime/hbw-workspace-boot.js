(function () {
  try {
    var p = (window.location && window.location.pathname) || "/";
    p = p.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
    var root = document.documentElement;
    root.classList.add("w-mod-js");
    if ("ontouchstart" in window) root.classList.add("w-mod-touch");
    var migrated = [
      // Duplicated live-slug list; dies in Stage 4a when recovered routes go away.
      "/projects/sub-3",
      "/projects/koja",
      "/projects/bar-closed",
      "/projects/our-boy-roy",
      "/projects/chris-sisarich",
      "/projects/bistro-nido",
    ];
    if (p === "/" || p === "/studio" || p === "/manifesto" || migrated.indexOf(p) !== -1) {
      if (p === "/") root.classList.add("hbw-route-home");
      root.classList.add("hbw-home-prototype");
      root.classList.add("hbw-workspace");
      root.classList.remove("hbw-project-page-loading");
      root.classList.remove("hbw-ss-active");
    }
    if (p === "/projects" || p.indexOf("/projects/") === 0) root.classList.add("hbw-route-projects");
    if (p === "/projects") root.classList.add("hbw-route-projects-index");
    if (p === "/projects/sub-3") root.classList.add("hbw-route-sub3");
    if (p.indexOf("/projects/") === 0 && p !== "/projects" && migrated.indexOf(p) !== -1) {
      root.classList.add("hbw-workspace");
      root.classList.add("hbw-home-prototype");
    }
    if (sessionStorage.getItem("hbw.entered.v2")) {
      root.classList.add("hbw-entered");
    } else if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("hbw.entered.v2", "1");
      root.classList.add("hbw-entered");
    } else if (p === "/") {
      root.classList.add("hbw-intro");
      window.setTimeout(function () {
        if (root.classList.contains("hbw-entered")) return;
        root.classList.remove("hbw-intro");
        root.classList.add("hbw-entered");
        try {
          sessionStorage.setItem("hbw.entered.v2", "1");
          sessionStorage.removeItem("hbw.intro.media.v1");
        } catch (e2) {}
      }, 2800);
    } else {
      sessionStorage.setItem("hbw.entered.v2", "1");
      root.classList.add("hbw-entered");
    }
  } catch (e) {}
})();
