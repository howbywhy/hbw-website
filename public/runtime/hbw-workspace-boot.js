(function () {
  try {
    var p = (window.location && window.location.pathname) || "/";
    p = p.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
    var root = document.documentElement;
    root.classList.add("w-mod-js");
    if ("ontouchstart" in window) root.classList.add("w-mod-touch");
    var migrated = [
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
    var q = location.search || "";
    if (sessionStorage.getItem("hbw.entered.v2")) {
    } else if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("hbw.entered.v2", "1");
    } else if (p === "/" && q.indexOf("layer=") === -1) {
      root.classList.add("hbw-intro");
    } else {
      sessionStorage.setItem("hbw.entered.v2", "1");
    }
  } catch (e) {}
})();
