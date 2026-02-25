const OrganizerModel = (function () {
  "use strict";

  const state = {
    activeFilter: "all",
    searchTerm: ""
  };

  function getFolders() {
    let folders = AppState.getFolders();

    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      folders = folders.filter(f => f.name.toLowerCase().includes(term));
    }

    return folders;
  }

  function setFilter(filter) {
    state.activeFilter = filter;
  }

  function setSearchTerm(term) {
    state.searchTerm = term;
  }

  function deleteFolder(id) {
    const folders = AppState.getFolders().filter(f => f.id !== id);
    AppState.setFolders(folders);
  }

  async function clearMedia(folder, mediaType, basePath) {
    const mediaFolderPath = `${basePath}/${folder.name}`;
    const result = await TaskQueue.add(
      "delete_folder_contents",
      [mediaFolderPath],
      "shell"
    );

    if (result?.deleted > 0) {
      folder[mediaType].count = 0;
      if (result.mtime) folder[mediaType].mtime = result.mtime;
      return result.deleted;
    }

    return 0;
  }

  async function clearFolderContents(folderId, type) {
    const folders = AppState.getFolders();
    const folderIndex = folders.findIndex(f => f.id === folderId);

    if (folderIndex === -1) {
      Logger.warn(`[OrganizerModel] Folder with id ${folderId} not found.`);
      return 0;
    }

    const folder = { ...folders[folderIndex] };
    if (folder.ss) folder.ss = { ...folder.ss };
    if (folder.sr) folder.sr = { ...folder.sr };

    try {
      const clearPromises = [];

      if ((type === "ss" || type === "both") && folder.ss) {
        clearPromises.push(
          clearMedia(folder, "ss", ENV.ORGANIZED_SCREENSHOTS_PATH)
        );
      }
      if ((type === "sr" || type === "both") && folder.sr) {
        clearPromises.push(
          clearMedia(folder, "sr", ENV.ORGANIZED_RECORDINGS_PATH)
        );
      }

      const removedCounts = await Promise.all(clearPromises);
      const totalRemoved = removedCounts.reduce((sum, n) => sum + n, 0);

      folders[folderIndex] = folder;
      AppState.setFolders(folders);

      return totalRemoved;
    } catch (error) {
      Logger.error("Error clearing folder contents:", error);
      return 0;
    }
  }

  function getAutoOrganizerSetting() {
    return AppState.getSetting("autoOrganizer");
  }

  function toggleAutoOrganizer() {
    const newValue = AppState.toggleSetting("autoOrganizer");
    AppState.addActivity({
      type: "feature-toggle",
      feature: "auto-organizer",
      enabled: newValue
    });
    return newValue;
  }

  return {
    getFolders,
    setFilter,
    setSearchTerm,
    deleteFolder,
    clearFolderContents,
    getAutoOrganizerSetting,
    toggleAutoOrganizer,
    getState: () => ({ ...state })
  };
})();
