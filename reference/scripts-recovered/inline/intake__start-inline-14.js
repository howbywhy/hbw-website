document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".w-form form");
    if (!form) return;

    const steps = Array.from(form.querySelectorAll(".step")).sort((a, b) => {
      const aNum = parseInt((a.id.match(/step-(\d+)/) || [])[1] || 0, 10);
      const bNum = parseInt((b.id.match(/step-(\d+)/) || [])[1] || 0, 10);
      return aNum - bNum;
    });

    if (!steps.length) return;

    let currentStep = 0;
    let isAnimating = false;

    const ENTER_DURATION = 420;
    const EXIT_DURATION = 240;

    function getFields(step) {
      return Array.from(step.querySelectorAll("input, textarea, select")).filter((field) => {
        const type = (field.type || "").toLowerCase();
        return (
          type !== "hidden" &&
          type !== "submit" &&
          type !== "button" &&
          type !== "reset" &&
          !field.disabled
        );
      });
    }

    function validateStep(step) {
      const fields = getFields(step);

      for (const field of fields) {
        if (!field.checkValidity()) {
          field.reportValidity();
          field.focus();
          return false;
        }
      }

      return true;
    }

    function focusFirstField(step) {
      const firstField = getFields(step)[0];
      if (firstField) {
        setTimeout(() => firstField.focus(), 120);
      }
    }

    function resetStepState(step) {
      step.classList.remove("active", "is-entering", "is-leaving");
      step.style.display = "none";
    }

    function showInitialStep(index) {
      steps.forEach(resetStepState);

      const step = steps[index];
      step.style.display = "block";
      step.classList.add("active");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          step.classList.add("is-entering");
          focusFirstField(step);
        });
      });
    }

    function transitionToStep(nextIndex) {
      if (isAnimating) return;
      if (nextIndex < 0 || nextIndex >= steps.length || nextIndex === currentStep) return;

      isAnimating = true;

      const current = steps[currentStep];
      const next = steps[nextIndex];

      current.classList.remove("is-entering");
      current.classList.add("is-leaving");

      setTimeout(() => {
        current.classList.remove("active", "is-leaving");
        current.style.display = "none";

        next.style.display = "block";
        next.classList.add("active");

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            next.classList.add("is-entering");
            focusFirstField(next);
          });
        });

        currentStep = nextIndex;

        setTimeout(() => {
          isAnimating = false;
        }, ENTER_DURATION);
      }, EXIT_DURATION);
    }

    function nextStep() {
      const activeStep = steps[currentStep];
      if (!activeStep) return;
      if (!validateStep(activeStep)) return;

      if (currentStep < steps.length - 1) {
        transitionToStep(currentStep + 1);
      }
    }

    function prevStep() {
      if (currentStep > 0) {
        transitionToStep(currentStep - 1);
      }
    }

    form.querySelectorAll(".next-btn").forEach((btn) => {
      if (btn.tagName === "BUTTON") {
        btn.type = "button";
      }

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        nextStep();
      });
    });

    form.querySelectorAll(".back-btn").forEach((btn) => {
      if (btn.tagName === "BUTTON") {
        btn.type = "button";
      }

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        prevStep();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (isAnimating) return;

      const activeStep = steps[currentStep];
      if (!activeStep) return;

      const activeElement = document.activeElement;
      const isTextarea = activeElement && activeElement.tagName === "TEXTAREA";

      if (e.key === "Enter" && !isTextarea) {
        const submitControl = activeStep.querySelector(
          'input[type="submit"], button[type="submit"]'
        );

        if (!submitControl) {
          e.preventDefault();
          nextStep();
        }
      }
    });

    showInitialStep(currentStep);
  });