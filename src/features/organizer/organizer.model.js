const OrganizerModel = (function () {
  "use strict";

  let state = {
    folders: [],
    activeFilter: "all",
    searchTerm: ""
  };

  function getFolders() {
    state.folders = AppState.getFolders();

    let filteredFolders = state.folders;

    if (state.searchTerm) {
      filteredFolders = filteredFolders.filter(folder =>
        folder.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    return filteredFolders;
  }

  function setFilter(filter) {
    state.activeFilter = filter;
  }

  function setSearchTerm(term) {
    state.searchTerm = term;
  }

  function deleteFolder(id) {
    const folders = AppState.getFolders();
    const updatedFolders = folders.filter(f => f.id !== id);
    AppState.setFolders(updatedFolders);
  }

  async function clearMedia(folder, mediaType, basePath) {
    const mediaFolderPath = `${basePath}/${folder.name}`;

    const result = await TaskQueue.add(
      "delete_folder_contents",
      [mediaFolderPath],
      "shell"
    );

    let removedCount = 0;
    if (result && result.deleted > 0) {
      folder[mediaType].count = 0;
      if (result.mtime) {
        folder[mediaType].mtime = result.mtime;
      }
      removedCount = result.deleted;
    }

    return removedCount;
  }

  async function clearFolderContents(folderId, type) {
    const folders = AppState.getFolders();
    const folderIndex = folders.findIndex(f => f.id === folderId);

    if (folderIndex === -1) {
      Logger.warn(`[OrganizerModel] Folder with id ${folderId} not found.`);
      return 0;
    }

    const folder = folders[folderIndex];

    try {
      const clearPromises = [];

      const canClearSs = (type === "ss" || type === "both") && folder.ss;
      if (canClearSs) {
        clearPromises.push(
          clearMedia(folder, "ss", ENV.ORGANIZED_SCREENSHOTS_PATH)
        );
      }

      const canClearSr = (type === "sr" || type === "both") && folder.sr;
      if (canClearSr) {
        clearPromises.push(
          clearMedia(folder, "sr", ENV.ORGANIZED_RECORDINGS_PATH)
        );
      }

      const removedCounts = await Promise.all(clearPromises);
      const totalRemoved = removedCounts.reduce((sum, count) => sum + count, 0);

      if (totalRemoved > 0) {
        AppState.setFolders(folders);
      }

      return totalRemoved;
    } catch (error) {
      Logger.error("Error clearing folder contents:", error);
      return 0;
    }
  }

  return {
    getFolders,
    setFilter,
    setSearchTerm,
    deleteFolder,
    clearFolderContents,
    getState: () => ({ ...state })
  };
})();
