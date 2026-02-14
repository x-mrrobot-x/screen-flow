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

  function update(data) {
    if (!data) return;

    elements.summaryCard.organized.textContent =
      data.organizedFiles.toLocaleString();
    elements.summaryCard.removed.textContent =
      data.removedFiles.toLocaleString();

    elements.toOrganize.images.textContent = data.toOrganize.images;
    elements.toOrganize.videos.textContent = data.toOrganize.videos;

    elements.foldersCreated.images.textContent = data.foldersCreated.images;
    elements.foldersCreated.videos.textContent = data.foldersCreated.videos;

    elements.lastOrganization.images.textContent = data.lastOrganization.images;
    elements.lastOrganization.videos.textContent = data.lastOrganization.videos;

    elements.lastClean.images.textContent = data.lastClean.images;
    elements.lastClean.videos.textContent = data.lastClean.videos;

    elements.mostCapturedApp.name.textContent = data.mostCapturedApp.name;
    elements.mostCapturedApp.count.textContent =
      data.mostCapturedApp.count.toLocaleString();

    elements.mostCapturedApp.icon.src = ENV.resolveIconPath(
      data.mostCapturedApp.pkg
    );
  }

  return {
    init,
    update
  };
})();
