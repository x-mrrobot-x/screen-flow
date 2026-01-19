const Storage = (function() {
  'use strict';
  
  function get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage.get error for key "${key}":`, error);
      return defaultValue;
    }
  }
  
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage.set error for key "${key}":`, error);
      return false;
    }
  }
  
  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage.remove error for key "${key}":`, error);
      return false;
    }
  }
  
  function clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage.clear error:', error);
      return false;
    }
  }
  
  return {
    get,
    set,
    remove,
    clear
  };
})();
