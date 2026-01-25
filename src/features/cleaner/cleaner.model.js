const CleanerModel = (function() {
  'use strict';
  
  function updateFolderState(folderId, mediaType, updateFn) {
    const folders = AppState.getFolders();
    const updatedFolders = folders.map(folder => {
      if (folder.id === folderId) {
        const newState = { ...folder };
        updateFn(newState);
        return newState;
      }
      return folder;
    });
    AppState.setFolders(updatedFolders);
    return updatedFolders;
  }

  function toggleFolderClean(folderId, mediaType) {
    const updatedFolders = updateFolderState(folderId, mediaType, folder => {
      if (mediaType === "screenshots") {
        folder.cleaner.ss.on = !folder.cleaner.ss.on;
      } else if (mediaType === "recordings") {
        folder.cleaner.sr.on = !folder.cleaner.sr.on;
      }
    });

    const folder = updatedFolders.find(f => f.id === folderId);
    if (folder) {
      const actionType = mediaType === "screenshots" ? "screenshots" : "recordings";
      const isEnabled = mediaType === "screenshots" ? folder.cleaner.ss.on : folder.cleaner.sr.on;

      AppState.addActivity({
        type: "auto-cleaner-folder-toggle",
        feature: `cleaner-folder-${actionType}`,
        folder: folder.name,
        enabled: isEnabled
      });
    }
  }

  function setFolderDays(folderId, mediaType, days) {
    updateFolderState(folderId, mediaType, folder => {
      if (mediaType === "screenshots") {
        folder.cleaner.ss.days = days;
      } else if (mediaType === "recordings") {
        folder.cleaner.sr.days = days;
      }
    });
  }

  function toggleAutoCleaner() {
    const newValue = AppState.toggleSetting('autoCleaner');

    AppState.addActivity({
      type: "feature-toggle",
      feature: "auto-cleaner",
      enabled: newValue
    });
    return newValue;
  }

  function getFolders() {
    return AppState.getFolders();
  }

  function getState() {
    return {
      autoCleaner: AppState.getSetting('autoCleaner'),
      ...AppState.getStats()
    };
  }

  return {
    toggleFolderClean,
    setFolderDays,
    toggleAutoCleaner,
    getFolders,
    getState
  };
})();