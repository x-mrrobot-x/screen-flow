const ConfirmationModal = (() => {
  "use strict";

  const elements = {
    modal: DOM.qs("#confirmation-modal"),
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

    if (!isInitialized) {
      bindEvents();
      isInitialized = true;
    }

    Modal.show(elements.modal);
  }

  function handleConfirm() {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    close();
  }

  function handleBackdropClick(e) {
    if (e.target === elements.modal) {
      close();
    }
  }

  function close() {
    Modal.hide(elements.modal);
  }

  const handlers = {
    confirm: handleConfirm,
    cancel: close,
    close: close,
    backdropClick: handleBackdropClick
  };

  function bindEvents() {
    const bindings = [
      [elements.confirmBtn, "click", handlers.confirm],
      [elements.cancelBtn, "click", handlers.cancel],
      [elements.closeBtn, "click", handlers.close],
      [elements.modal, "click", handlers.backdropClick]
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
