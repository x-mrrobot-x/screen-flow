function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function create(tag, attrs = {}) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "className") {
      el.className = value;
    } else if (key === "dataset") {
      Object.assign(el.dataset, value);
    } else if (key === "textContent" || key === "innerHTML") {
      el[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return el;
}

function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, e => {
    if (e.target.closest(selector)) handler(e);
  });
}

export default {
  qs,
  qsa,
  create,
  delegate
};
