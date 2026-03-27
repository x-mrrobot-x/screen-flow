const history = [];
const callbacks = new Map();
const overlays = new Map();
const TRANSITION_DURATION = 250;
let entryIdCounter = 0;

function registerCallback(dialogElement, onCloseCallback) {
  if (onCloseCallback) callbacks.set(dialogElement, onCloseCallback);
}

function popCallback(dialogElement) {
  const cb = callbacks.get(dialogElement);
  callbacks.delete(dialogElement);
  return cb;
}

function buildOverlayElement() {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";
  return overlay;
}

function attachOverlayClickHandler(overlay) {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) goBack();
  });
}

function insertOverlayBeforeDialog(overlay, dialogElement) {
  dialogElement.parentNode.insertBefore(overlay, dialogElement);
  overlays.set(dialogElement, overlay);
}

function createOverlay(dialogElement) {
  const overlay = buildOverlayElement();
  attachOverlayClickHandler(overlay);
  insertOverlayBeforeDialog(overlay, dialogElement);
  return overlay;
}

function removeOverlay(dialogElement) {
  const overlay = overlays.get(dialogElement);
  if (!overlay) return;
  overlay.remove();
  overlays.delete(dialogElement);
}

function setDialogVisible(dialogElement) {
  dialogElement.setAttribute("aria-hidden", "false");
  dialogElement.style.display = "flex";
}

function triggerOpenClasses(dialogElement, overlay) {
  overlay.classList.add("is-open");
  dialogElement.classList.add("is-open");
}

function animateOpen(dialogElement, overlay) {
  setDialogVisible(dialogElement);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => triggerOpenClasses(dialogElement, overlay));
  });
}

function triggerCloseClasses(dialogElement, overlay) {
  dialogElement.classList.remove("is-open");
  dialogElement.classList.add("is-closing");
  if (overlay) {
    overlay.classList.remove("is-open");
    overlay.classList.add("is-closing");
  }
}

function resetDialogState(dialogElement) {
  dialogElement.classList.remove("is-closing");
  dialogElement.style.display = "none";
  dialogElement.setAttribute("aria-hidden", "true");
}

function animateClose(dialogElement, overlay) {
  triggerCloseClasses(dialogElement, overlay);
}

function finalizeClose(dialogElement, cb) {
  resetDialogState(dialogElement);
  removeOverlay(dialogElement);
  if (cb) cb();
}

function isDialogInHistory(dialogElement) {
  return history.some(e => e.element === dialogElement);
}

function removeEntryFromHistory(predicate) {
  const i = history.findLastIndex(predicate);
  if (i !== -1) history.splice(i, 1);
}

function handleContextOrTabBack(entry) {
  entry.actionFn();
}

function handleDialogBack(element) {
  const cb = popCallback(element);
  const overlay = overlays.get(element);
  animateClose(element, overlay);
  setTimeout(() => finalizeClose(element, cb), TRANSITION_DURATION);
}

function pushDialog(dialogElement, onCloseCallback = null) {
  if (isDialogInHistory(dialogElement)) return;
  registerCallback(dialogElement, onCloseCallback);
  const overlay = createOverlay(dialogElement);
  history.push({ type: "dialog", element: dialogElement });
  animateOpen(dialogElement, overlay);
}

function pushContext(actionFn) {
  const id = ++entryIdCounter;
  history.push({ type: "context", id, actionFn });
  return id;
}

function popContext(id) {
  removeEntryFromHistory(e => e.type === "context" && e.id === id);
}

function pushTab(tabId, actionFn) {
  removeEntryFromHistory(e => e.type === "tab" && e.tabId === tabId);
  history.push({ type: "tab", tabId, actionFn });
}

function goBack() {
  if (history.length === 0) return false;
  const entry = history.pop();

  if (entry.type === "context" || entry.type === "tab") {
    handleContextOrTabBack(entry);
  } else {
    handleDialogBack(entry.element);
  }

  return true;
}

export default {
  pushDialog,
  pushContext,
  popContext,
  pushTab,
  goBack
};
