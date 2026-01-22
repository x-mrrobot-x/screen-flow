const AutoCleanModel = (function() {
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
        folder.autoClean.ss.on = !folder.autoClean.ss.on;
      } else if (mediaType === "recordings") {
        folder.autoClean.sr.on = !folder.autoClean.sr.on;
      }
    });

    const folder = updatedFolders.find(f => f.id === folderId);
    if (folder) {
      const actionType = mediaType === "screenshots" ? "screenshots" : "recordings";
      const isEnabled = mediaType === "screenshots" ? folder.autoClean.ss.on : folder.autoClean.sr.on;

      AppState.addActivity({
        type: "auto-clean-folder-toggle",
        feature: `auto-clean-folder-${actionType}`,
        folder: folder.name,
        enabled: isEnabled
      });
    }
  }

  function setFolderDays(folderId, mediaType, days) {
    updateFolderState(folderId, mediaType, folder => {
      if (mediaType === "screenshots") {
        folder.autoClean.ss.days = days;
      } else if (mediaType === "recordings") {
        folder.autoClean.sr.days = days;
      }
    });
  }

  function toggleAutoCleanup() {
    const newValue = AppState.toggleSetting('autoCleanup');

    AppState.addActivity({
      type: "feature-toggle",
      feature: "auto-clean",
      enabled: newValue
    });
    return newValue;
  }

  function getFolders() {
    return AppState.getFolders();
  }

  function getState() {
    return {
      autoCleanup: AppState.getSetting('autoCleanup'),
      ...AppState.getStats()
    };
  }

  return {
    toggleFolderClean,
    setFolderDays,
    toggleAutoCleanup,
    getFolders,
    getState
  };
})();
