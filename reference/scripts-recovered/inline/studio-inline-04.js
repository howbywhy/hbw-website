(function () {
  function hbwSetVH() {
    try {
      var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--vh", h * 0.01 + "px");
    } catch (e) {}
  }
  hbwSetVH();
  window.addEventListener("resize", hbwSetVH, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", hbwSetVH, { passive: true });
  window.addEventListener("orientationchange", hbwSetVH, { passive: true });
  window.addEventListener("pageshow", hbwSetVH, { passive: true });
})();