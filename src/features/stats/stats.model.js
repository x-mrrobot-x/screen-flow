const StatsModel = (function() {
  'use strict';
  
  let state = {
    activeMediaType: "screenshots",
    weeklyData: {},
    topOrganizeItems: []
  };

  const weeklyData = {
    screenshots: [
      { day: "Seg", value: 25 }, { day: "Ter", value: 40 },
      { day: "Qua", value: 18 }, { day: "Qui", value: 52 },
      { day: "Sex", value: 35 }, { day: "Sáb", value: 65 },
      { day: "Dom", value: 48 }
    ],
    recordings: [
      { day: "Seg", value: 20 }, { day: "Ter", value: 38 },
      { day: "Qua", value: 14 }, { day: "Qui", value: 43 },
      { day: "Sex", value: 32 }, { day: "Sáb", value: 55 },
      { day: "Dom", value: 41 }
    ]
  };

  function getWeeklyData(mediaType = 'screenshots') {
    return weeklyData[mediaType] || weeklyData.screenshots;
  }

  function getMediaTypeOptions() {
    return Object.keys(weeklyData);
  }

  function getTopOrganizeItems(mediaType) {
    return AppState.getTopOrganizeItemsByType(mediaType);
  }

  function getState() {
    state.weeklyData = getWeeklyData(state.activeMediaType);
    state.topOrganizeItems = getTopOrganizeItems(state.activeMediaType);
    return { ...state };
  }

  function setMediaType(mediaType) {
    if (getMediaTypeOptions().includes(mediaType)) {
      state.activeMediaType = mediaType;
    }
  }
  
  return {
    getState,
    setMediaType,
    getMediaTypeOptions
  };
})();
