const ProcessView = (function () {
  "use strict";

  let elements = null;

  function queryElements() {
    elements = {
      dialog: DOM.qs("#process-dialog"),
      title: DOM.qs("#process-dialog-title"),
      bar: DOM.qs("#process-dialog-bar"),
      info: DOM.qs(".process-progress-info"),
      label: DOM.qs("#process-dialog-step-label"),
      percent: DOM.qs("#process-dialog-percent"),
      steps: DOM.qs("#process-dialog-steps"),
      completion: DOM.qs("#process-dialog-completion"),
      result: DOM.qs("#process-dialog-result"),
      closeBtn: DOM.qs("#process-dialog-close")
    };
  }

  const helpers = {
    stepItemTemplate: (step, index) => `
      <div class="process-step-item" id="process-step-${index}">
        <div class="process-step-icon-wrap" id="process-icon-${index}">
          <div class="process-step-spinner"></div>
          <div class="process-step-checkmark">${Icons.getSvg("check")}</div>
        </div>
        <span class="process-step-label">${step.label}</span>
      </div>`,

    animateStepsIn: count => {
      for (let i = 0; i < count; i++) {
        const el = DOM.qs(`#process-step-${i}`, elements.steps);
        setTimeout(() => el?.classList.add("visible"), i * 65 + 80);
      }
    },

    createParticle: (cx, cy, colors) => {
      const p = document.createElement("div");
      p.className = "process-particle";

      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      const size = 3 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const duration = 900 + Math.random() * 400;
      const delay = Math.random() * 150;

      p.style.cssText = [
        `position: absolute`,
        `left: ${cx}px`,
        `top: ${cy}px`,
        `width: ${size}px`,
        `height: ${size}px`,
        `background: ${color}`,
        `opacity: 1`,
        `transform: translate(0, 0) scale(1)`,
        `transition: transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`,
        `-webkit-transition: -webkit-transform ${duration}ms ease-out ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`
      ].join("; ");

      elements.dialog.appendChild(p);

      requestAnimationFrame(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        p.style.opacity = "0";
        p.style.webkitTransform = `translate(${tx}px, ${ty}px) scale(0)`;
      });

      setTimeout(
        () => {
          if (p.parentNode) p.remove();
        },
        duration + delay + 500
      );
    },

    spawnParticles: () => {
      if (!elements.completion.classList.contains("visible")) return;

      requestAnimationFrame(() => {
        const rect = elements.completion.getBoundingClientRect();
        const dialogRect = elements.dialog.getBoundingClientRect();
        const cx = rect.left - dialogRect.left + rect.width / 2;
        const cy = rect.top - dialogRect.top + rect.height / 3;
        const colors = ["#22c55e", "#3b82f6", "#f59e0b"];

        for (let i = 0; i < 24; i++) helpers.createParticle(cx, cy, colors);
      });
    }
  };

  function render(steps) {
    elements.steps.innerHTML = steps
      .map((step, i) => helpers.stepItemTemplate(step, i))
      .join("");

    helpers.animateStepsIn(steps.length);
  }

  const update = {
    title: title => {
      elements.title.textContent = title;
    },

    stepLabel: label => {
      elements.label.textContent = label;
    },

    progress: percent => {
      elements.bar.style.width = `${percent}%`;
      elements.percent.textContent = `${Math.round(percent)}%`;
    },

    stepStatus: (index, status) => {
      const stepEl = DOM.qs(`#process-step-${index}`);
      const iconEl = DOM.qs(`#process-icon-${index}`);
      if (!stepEl || !iconEl) return;

      stepEl.classList.remove("running", "done", "connected", "failed");
      iconEl.classList.remove("running", "done", "failed");

      if (status === "running") {
        void stepEl.offsetWidth;
        stepEl.classList.add("running");
        iconEl.classList.add("running");
      } else if (status === "completed") {
        stepEl.classList.add("done", "connected");
        iconEl.classList.add("done");
      } else if (status === "failed") {
        stepEl.classList.add("failed");
        iconEl.classList.add("failed");
      }
    },

    completion: (resultText, success = true) => {
      elements.result.textContent = resultText;

      if (success) elements.info.classList.add("done");

      requestAnimationFrame(() => {
        elements.completion.classList.add("visible");

        if (success) {
          elements.steps.scrollTo({
            top: elements.steps.scrollHeight,
            behavior: "smooth"
          });

          setTimeout(helpers.spawnParticles, 300);
        }
      });
    },

    scrollToStep: index => {
      const stepEl = DOM.qs(`#process-step-${index}`);
      stepEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  function reset() {
    elements.title.textContent = "Processando";
    elements.bar.style.width = "0%";
    elements.label.textContent = "Iniciando...";
    elements.percent.textContent = "0%";
    elements.steps.innerHTML = "";
    elements.completion.classList.remove("visible");
    elements.info.classList.remove("done");
  }

  function init() {
    queryElements();
  }

  function getElements() {
    return elements;
  }

  return {
    init,
    reset,
    render,
    update,
    getElements
  };
})();
