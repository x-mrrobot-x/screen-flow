const AutoCleanModel = (function() {
  'use strict';
  
  function updateOrganizeItemState(organizeItemId, mediaType, updateFn) {
    const organizeItems = AppState.getOrganizeItems();
    const updatedOrganizeItems = organizeItems.map(item => {
      if (item.id === organizeItemId) {
        const newState = { ...item };
        updateFn(newState);
        return newState;
      }
      return item;
    });
    AppState.setOrganizeItems(updatedOrganizeItems);
    return updatedOrganizeItems;
  }

  function toggleOrganizeItemClean(organizeItemId, mediaType) {
    const updatedOrganizeItems = updateOrganizeItemState(organizeItemId, mediaType, item => {
      if (mediaType === "screenshots") {
        item.autoClean.ss.on = !item.autoClean.ss.on;
      } else if (mediaType === "recordings") {
        item.autoClean.sr.on = !item.autoClean.sr.on;
      }
    });

    const item = updatedOrganizeItems.find(f => f.id === organizeItemId);
    if (item) {
      const actionType = mediaType === "screenshots" ? "screenshots" : "recordings";
      const isEnabled = mediaType === "screenshots" ? item.autoClean.ss.on : item.autoClean.sr.on;

      AppState.addActivity({
        type: "feature-toggle",
        feature: `auto-clean-organize-${actionType}`,
        itemName: item.name,
        enabled: isEnabled
      });
    }
  }

  function setOrganizeItemDays(organizeItemId, mediaType, days) {
    updateOrganizeItemState(organizeItemId, mediaType, item => {
      if (mediaType === "screenshots") {
        item.autoClean.ss.days = days;
      } else if (mediaType === "recordings") {
        item.autoClean.sr.days = days;
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

  function getOrganizeItems() {
    return AppState.getOrganizeItems();
  }

  function getState() {
    return {
      autoCleanup: AppState.getSetting('autoCleanup'),
      ...AppState.getStats()
    };
  }

  return {
    toggleOrganizeItemClean,
    setOrganizeItemDays,
    toggleAutoCleanup,
    getOrganizeItems,
    getState
  };
})();
