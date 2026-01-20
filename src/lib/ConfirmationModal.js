const ConfirmationModal = (() => {
  "use strict";

  const elements = {
    modal: DOM.qs("#confirmation-modal"),
    overlay: DOM.qs("#confirmation-modal-overlay"),
    closeBtn: DOM.qs("#confirmation-modal-close"),
    title: DOM.qs("#confirmation-modal-title"),
    message: DOM.qs("#confirmation-modal-message"),
    confirmBtn: DOM.qs("#confirmation-modal-confirm"),
    cancelBtn: DOM.qs("#confirmation-modal-cancel")
  };

  let onConfirmCallback = null;
  let isInitialized = false;

  function open({ title, message }, onConfirm) {
    elements.title.textContent = title;
    elements.message.textContent = message;

    onConfirmCallback = onConfirm;
    Modal.show(elements.modal, onConfirmCallback);

    console.log(onConfirmCallback);
    if (!isInitialized) {
      bindEvents();
      isInitialized = true;
    }
  }

  function handleConfirm() {
    onConfirmCallback();
    close();
  }

  function close() {
    Modal.hide(elements.modal);
  }

  const handlers = {
    confirm: handleConfirm,
    cancel: close,
    close: close
  };

  function bindEvents() {
    const bindings = [
      [elements.confirmBtn, "click", handlers.confirm],
      [elements.cancelBtn, "click", handlers.cancel],
      // [elements.modal, "click", handlers.close],
      // [elements.overlay, "click", handlers.close],
      [elements.closeBtn, "click", handlers.close]
    ];

    bindings.forEach(([el, event, handler]) =>
      el.addEventListener(event, handler)
    );
  }

  return {
    open,
    close
  };
})();