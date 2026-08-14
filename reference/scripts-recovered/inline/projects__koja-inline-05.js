(function () {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!sessionStorage.getItem("hbw.body.sessionInit")) {
      document.documentElement.classList.add("hbw-body-fade-pending");
    }
  } catch (e) {}
})();