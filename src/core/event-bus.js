const EventBus = (function() {
  'use strict';
  
  const events = {};
  
  function on(eventName, callback) {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(callback);
  }
  
  function off(eventName, callback) {
    if (!events[eventName]) return;
    const index = events[eventName].indexOf(callback);
    if (index > -1) {
      events[eventName].splice(index, 1);
    }
  }
  
  function emit(eventName, data) {
    if (!events[eventName]) return;
    events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for "${eventName}":`, error);
      }
    });
  }
  
  function init() {
    console.log('✓ EventBus initialized');
  }
  
  return {
    init,
    on,
    off,
    emit
  };
})();