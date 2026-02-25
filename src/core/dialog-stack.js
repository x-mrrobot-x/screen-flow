const DialogStack = (() => {
  "use strict";

  const stack = [];
  const callbacks = new Map();

  function push(dialogElement, onCloseCallback = null) {
    if (!stack.includes(dialogElement)) stack.push(dialogElement);
    if (onCloseCallback) callbacks.set(dialogElement, onCloseCallback);
    dialogElement.showModal();
  }

  function goBack() {
    if (stack.length === 0) return false;

    const current = stack.pop();
    const callback = callbacks.get(current);

    callbacks.delete(current);
    current.close();

    if (callback) callback();

    return true;
  }

  return {
    push,
    goBack
  };
})();
