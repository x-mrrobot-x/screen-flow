const DOM = (function() {
  'use strict';

  function get(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function qs(selector, parent = document) {
    return parent.querySelector(selector);
  }
  
  function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }
  
  function create(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
      } else {
        el.setAttribute(key, value);
      }
    });
    return el;
  }

  function delegate(parent, selector, event, handler) {
    parent.addEventListener(event, function(e) {
      if (e.target.closest(selector)) {
        handler(e);
      }
    });
  }
  
  return { get, qs, qsa, create, delegate };
})();