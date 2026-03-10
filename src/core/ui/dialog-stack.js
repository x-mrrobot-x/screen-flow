const stack = [];
const callbacks = new Map();

function registerCallback(dialogElement, onCloseCallback) {
  if (onCloseCallback) callbacks.set(dialogElement, onCloseCallback);
}

function popCallback(dialogElement) {
  const callback = callbacks.get(dialogElement);
  callbacks.delete(dialogElement);
  return callback;
}

function push(dialogElement, onCloseCallback = null) {
  if (!stack.includes(dialogElement)) stack.push(dialogElement);
  registerCallback(dialogElement, onCloseCallback);
  dialogElement.showModal();
}

function goBack() {
  if (stack.length === 0) return false;
  const current = stack.pop();
  const callback = popCallback(current);
  current.close();
  if (callback) callback();
  return true;
}

export default {
  push,
  goBack
};
