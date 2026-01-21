const OrganizeModel = (function() {
  'use strict';

  let state = {
    organizeItems: [],
    activeFilter: 'all',
    searchTerm: ''
  };

  function getOrganizeItems() {
    state.organizeItems = AppState.getOrganizeItems();

    let filteredOrganizeItems = state.organizeItems;

    if (state.searchTerm) {
      filteredOrganizeItems = filteredOrganizeItems.filter(item =>
        item.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    return filteredOrganizeItems;
  }

  function setFilter(filter) {
    state.activeFilter = filter;
  }

  function setSearchTerm(term) {
    state.searchTerm = term;
  }

  function deleteOrganizeItem(id) {
    const organizeItems = AppState.getOrganizeItems();
    const updatedOrganizeItems = organizeItems.filter(f => f.id !== id);
    AppState.setOrganizeItems(updatedOrganizeItems);
  }

  function clearOrganizeStats(organizeId, type) {
    const organizeItems = AppState.getOrganizeItems();
    const itemIndex = organizeItems.findIndex(f => f.id === organizeId);

    if (itemIndex !== -1) {
      const item = organizeItems[itemIndex];
      let removedCount = 0;
      if (type === 'ss') {
        removedCount = item.stats.ss;
        item.stats.ss = 0;
      } else if (type === 'sr') {
        removedCount = item.stats.sr;
        item.stats.sr = 0;
      } else if (type === 'both') {
        removedCount = item.stats.ss + item.stats.sr;
        item.stats.ss = 0;
        item.stats.sr = 0;
      }
      item.stats.lu = Date.now();
      AppState.setOrganizeItems(organizeItems);
      return removedCount;
    }
    return 0;
  }

  return {
    getOrganizeItems,
    setFilter,
    setSearchTerm,
    deleteOrganizeItem,
    clearOrganizeStats,
    getState: () => ({...state})
  };
})();
