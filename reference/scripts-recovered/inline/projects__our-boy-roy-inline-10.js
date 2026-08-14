(function () {
  function finish() {
    try {
      var root = document.documentElement;
      if (root.classList.contains("hbw-body-fade-pending")) {
        requestAnimationFrame(function () {
          root.classList.add("hbw-body-fade-in");
        });
      }
      if (!sessionStorage.getItem("hbw.body.sessionInit")) {
        sessionStorage.setItem("hbw.body.sessionInit", "1");
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finish, { once: true });
  } else {
    finish();
  }
})();