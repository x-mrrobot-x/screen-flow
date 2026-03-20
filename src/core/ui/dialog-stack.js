const stack = [];
const callbacks = new Map();
const overlays = new Map();
const TRANSITION_DURATION = 250;

function registerCallback(dialogElement, onCloseCallback) {
  if (onCloseCallback) callbacks.set(dialogElement, onCloseCallback);
}

function popCallback(dialogElement) {
  const cb = callbacks.get(dialogElement);
  callbacks.delete(dialogElement);
  return cb;
}

function createOverlay(dialogElement) {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";
  overlay.addEventListener("click", e => {
    if (e.target === overlay) goBack();
  });
  dialogElement.parentNode.insertBefore(overlay, dialogElement);
  overlays.set(dialogElement, overlay);
  return overlay;
}

function removeOverlay(dialogElement) {
  const overlay = overlays.get(dialogElement);
  if (overlay) {
    overlay.remove();
    overlays.delete(dialogElement);
  }
}

function animateOpen(dialogElement, overlay) {
  dialogElement.setAttribute("aria-hidden", "false");
  dialogElement.style.display = "flex";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      dialogElement.classList.add("is-open");
    });
  });
}

function animateClose(dialogElement, overlay) {
  dialogElement.classList.remove("is-open");
  dialogElement.classList.add("is-closing");
  if (overlay) {
    overlay.classList.remove("is-open");
    overlay.classList.add("is-closing");
  }
}

function finalizeClose(dialogElement, cb) {
  dialogElement.classList.remove("is-closing");
  dialogElement.style.display = "none";
  dialogElement.setAttribute("aria-hidden", "true");
  removeOverlay(dialogElement);
  if (cb) cb();
}

function push(dialogElement, onCloseCallback = null) {
  if (stack.includes(dialogElement)) return;
  stack.push(dialogElement);
  registerCallback(dialogElement, onCloseCallback);

  const overlay = createOverlay(dialogElement);
  animateOpen(dialogElement, overlay);
}

function goBack() {
  if (stack.length === 0) return false;
  const current = stack.pop();
  const cb = popCallback(current);
  const overlay = overlays.get(current);

  animateClose(current, overlay);
  setTimeout(() => finalizeClose(current, cb), TRANSITION_DURATION);

  return true;
}

export default {
  push,
  goBack
};
