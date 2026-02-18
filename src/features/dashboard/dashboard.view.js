const DashboardView = (function () {
  "use strict";

  const elements = {};

  function queryElements() {
    const selectors = DashboardConfig.SELECTORS;

    // Helper function to query selectors
    const qs = selector => document.querySelector(selector);

    elements.summaryCard = {
      organized: qs(selectors.summaryCard.organized),
      removed: qs(selectors.summaryCard.removed)
    };
    elements.toOrganize = {
      images: qs(selectors.toOrganize.images),
      videos: qs(selectors.toOrganize.videos)
    };
    elements.foldersCreated = {
      images: qs(selectors.foldersCreated.images),
      videos: qs(selectors.foldersCreated.videos)
    };
    elements.lastOrganization = {
      images: qs(selectors.lastOrganization.images),
      videos: qs(selectors.lastOrganization.videos)
    };
    elements.lastClean = {
      images: qs(selectors.lastClean.images),
      videos: qs(selectors.lastClean.videos)
    };
    elements.mostCapturedApp = {
      icon: qs(selectors.mostCapturedApp.icon),
      name: qs(selectors.mostCapturedApp.name),
      count: qs(selectors.mostCapturedApp.count)
    };
  }

  function init() {
    try {
      queryElements();
    } catch (error) {
      Logger.error("Failed to initialize DashboardView elements:", error);
    }
  }

  function updateWithAnimation(element, newValue) {
    if (!element) return;
    const currentText = element.textContent;
    const newText = String(newValue);

    if (currentText !== newText) {
      element.textContent = newText;

      const runPulse = () => {
        element.classList.remove("animate-pulse-highlight");
        void element.offsetWidth; // Trigger reflow
        element.classList.add("animate-pulse-highlight");

        const onAnimationEnd = () => {
          element.classList.remove("animate-pulse-highlight");
          element.removeEventListener("animationend", onAnimationEnd);
        };
        element.addEventListener("animationend", onAnimationEnd);
      };

      const entranceParent = element.closest(
        ".animate-fade-in-up, .animate-fade-in, .animate-scale-in"
      );

      // If it's a first load or there's an active entrance animation
      if (entranceParent && entranceParent.getAnimations) {
        const animations = entranceParent.getAnimations();
        if (animations.length > 0) {
          Promise.all(animations.map(a => a.finished)).then(runPulse);
        } else {
          runPulse();
        }
      } else {
        runPulse();
      }
    }
  }

  function update(data) {
    if (!data) return;

    updateWithAnimation(
      elements.summaryCard.organized,
      data.organizedFiles.toLocaleString()
    );
    updateWithAnimation(
      elements.summaryCard.removed,
      data.removedFiles.toLocaleString()
    );

    updateWithAnimation(elements.toOrganize.images, data.toOrganize.images);
    updateWithAnimation(elements.toOrganize.videos, data.toOrganize.videos);

    updateWithAnimation(
      elements.foldersCreated.images,
      data.foldersCreated.images
    );
    updateWithAnimation(
      elements.foldersCreated.videos,
      data.foldersCreated.videos
    );

    updateWithAnimation(
      elements.lastOrganization.images,
      data.lastOrganization.images
    );
    updateWithAnimation(
      elements.lastOrganization.videos,
      data.lastOrganization.videos
    );

    updateWithAnimation(elements.lastClean.images, data.lastClean.images);
    updateWithAnimation(elements.lastClean.videos, data.lastClean.videos);

    // App name doesn't need highlight usually, but count does
    if (elements.mostCapturedApp.name.textContent !== data.mostCapturedApp.name) {
       elements.mostCapturedApp.name.textContent = data.mostCapturedApp.name;
    }
    
    updateWithAnimation(
      elements.mostCapturedApp.count,
      data.mostCapturedApp.count.toLocaleString()
    );

    const newIconSrc = ENV.resolveIconPath(data.mostCapturedApp.pkg);
    if (elements.mostCapturedApp.icon.getAttribute('src') !== newIconSrc) {
       elements.mostCapturedApp.icon.src = newIconSrc;
    }
  }

  return {
    init,
    update
  };
})();
