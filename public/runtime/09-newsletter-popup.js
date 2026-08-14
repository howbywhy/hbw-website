(function () {
    // Uses your existing Webflow structure/classes:
    // .popup-overlay > .popup-form > .popup-box
    // plus your Webflow Success/Error message elements inside the form.
    //
    // This embed may run in <head> before body exists, and your site uses Swup.
    // So we initialize on DOMContentLoaded + on page:swup-complete.

    var didBindGlobal = false;
    var overlay = null;
    var box = null;
    var formWrap = null;
    var formEl = null;
    var closeLink = null;
    var swup = null;
    var OPEN_DISPLAY = "flex";
    var wfSuccess = null;
    var wfError = null;
    var pendingOpenTimer = 0;

    function isCloseClickTarget(t) {
      return !!(t && t.closest && t.closest("[data-popup-close]"));
    }

    function normalizedPath() {
      var p = "/";
      try {
        p = String(location.pathname || "/");
      } catch (e) {}
      p = p.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
      return p;
    }

    function keyFor(suffix) {
      return "HBW_POPUP__" + suffix + "__" + normalizedPath();
    }

    function applyOpenEffects() {
      try {
        if (overlay) overlay.style.zIndex = "9999999999";
      } catch (e) {}

      if (swup) {
        try {
          swup.style.willChange = "filter";
          swup.style.filter = "blur(6px)";
        } catch (e2) {}
      }
    }

    function clearOpenEffects() {
      if (swup) {
        try {
          swup.style.filter = "";
          swup.style.willChange = "";
        } catch (e) {}
      }
    }

    function openPopup() {
      if (!overlay) return;
      try {
        overlay.style.display = OPEN_DISPLAY;
      } catch (e0) {}

      // Let Webflow transitions (if any) run off the class toggle.
      requestAnimationFrame(function () {
        applyOpenEffects();
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
      });

      if (box && !box.hasAttribute("role")) {
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
      }

      try {
        var firstInput = overlay.querySelector("input, textarea, select, button");
        if (firstInput) firstInput.focus();
      } catch (e) {}
    }

    function closePopup() {
      if (!overlay) return;
      if (pendingOpenTimer) {
        clearTimeout(pendingOpenTimer);
        pendingOpenTimer = 0;
      }
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      clearOpenEffects();
      try {
        overlay.style.display = "none";
      } catch (e) {}
    }

    function isElementVisible(el) {
      if (!el) return false;
      try {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      } catch (e) {
        return false;
      }
    }

    function maybeOpenOnSecondLoad() {
      if (!overlay) return;
      var shownKey = keyFor("shown");
      var rendersKey = keyFor("renders_session");

      var shown = "0";
      var renders = 0;
      try {
        shown = localStorage.getItem(shownKey) || "0";
      } catch (e0) {}
      try {
        renders = parseInt(sessionStorage.getItem(rendersKey) || "0", 10) || 0;
      } catch (e1) {}

      renders += 1;
      try {
        sessionStorage.setItem(rendersKey, String(renders));
      } catch (e2) {}

      // "2nd load" on a Swup site = the 2nd time this page is rendered in this tab/session.
      // Still only show once overall (persisted in localStorage).
      if (renders === 2 && shown !== "1") {
        try {
          localStorage.setItem(shownKey, "1");
        } catch (e3) {}
        if (pendingOpenTimer) clearTimeout(pendingOpenTimer);
        pendingOpenTimer = setTimeout(function () {
          pendingOpenTimer = 0;
          openPopup();
        }, 450);
      }
    }

    function bindGlobalOnce() {
      if (didBindGlobal) return;
      didBindGlobal = true;

      document.addEventListener(
        "click",
        function (e) {
          if (!overlay) return;
          if (e.target === overlay) return closePopup();
          if (isCloseClickTarget(e.target)) return closePopup();
        },
        true
      );

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closePopup();
      });
    }

    function init() {
      overlay = document.querySelector(".popup-overlay");
      if (!overlay) return;

      box = overlay.querySelector(".popup-box");
      formWrap = overlay.querySelector(".popup-form");
      formEl = formWrap ? formWrap.querySelector("form") : null;
      closeLink = document.getElementById("CLOSE");
      swup = document.querySelector(".swup");

      OPEN_DISPLAY = overlay.getAttribute("data-popup-display") || "flex";
      wfSuccess = formWrap ? formWrap.querySelector(".w-form-done") : null;
      wfError = formWrap ? formWrap.querySelector(".w-form-fail") : null;

      overlay.setAttribute("aria-hidden", overlay.classList.contains("is-open") ? "false" : "true");
      // Only force-hide if we're not already open and not about to open.
      if (!overlay.classList.contains("is-open") && !pendingOpenTimer) {
        try {
          overlay.style.display = "none";
        } catch (e) {}
      }

      if (closeLink && closeLink.getAttribute("data-hbw-popup-close-bound") !== "1") {
        closeLink.setAttribute("data-hbw-popup-close-bound", "1");
        closeLink.addEventListener("click", function (e) {
          try {
            e.preventDefault();
          } catch (err) {}
          closePopup();
        });
      }

      // Auto-close when Webflow success shows
      if (wfSuccess && typeof MutationObserver !== "undefined" && wfSuccess.getAttribute("data-hbw-popup-obs") !== "1") {
        wfSuccess.setAttribute("data-hbw-popup-obs", "1");
        var obs = new MutationObserver(function () {
          if (isElementVisible(wfSuccess)) setTimeout(closePopup, 900);
        });
        obs.observe(wfSuccess, { attributes: true, childList: true, subtree: true });
      } else if (formEl && formEl.getAttribute("data-hbw-popup-submit-bound") !== "1") {
        formEl.setAttribute("data-hbw-popup-submit-bound", "1");
        formEl.addEventListener("submit", function () {
          setTimeout(function () {
            if (!wfError || !isElementVisible(wfError)) closePopup();
          }, 1200);
        });
      }

      bindGlobalOnce();
      maybeOpenOnSecondLoad();
    }

    // Manual hooks (useful for testing)
    window.HBW_POPUP_OPEN = function () {
      init();
      openPopup();
    };
    window.HBW_POPUP_CLOSE = closePopup;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }

    document.addEventListener("page:swup-complete", init);
  })();