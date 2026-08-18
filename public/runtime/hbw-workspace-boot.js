(function () {
  try {
    var p = (window.location && window.location.pathname) || "/";
    p = p.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
    var root = document.documentElement;
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
