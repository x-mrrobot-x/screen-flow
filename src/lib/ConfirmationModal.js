const ConfirmationModal = (() => {
  'use strict';
  let elements = {};

  let onConfirmCallback = null;
  let onCancelCallback = null;

  function initializeElements() {
    elements = {
      modal: DOM.qs('#confirmation-modal'),
      title: DOM.qs('#confirmation-modal-title'),
      message: DOM.qs('#confirmation-modal-message'),
      confirmBtn: DOM.qs('#confirmation-modal-confirm'),
      cancelBtn: DOM.qs('#confirmation-modal-cancel')
    };
  }

  // Initialize elements when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeElements);
  } else {
    initializeElements();
  }

  function show(title, message, onConfirm, onCancel = null) {
    // Ensure elements are initialized
    if (!elements.modal) {
      initializeElements();
    }

    if (!elements.modal) return;

    // Set the title and message
    if (elements.title) elements.title.textContent = title;
    if (elements.message) elements.message.textContent = message;

    // Store callbacks
    onConfirmCallback = onConfirm;
    onCancelCallback = onCancel;

    // Bind event listeners
    bindEvents();

    // Show the modal using the Modal service
    Modal.show(elements.modal, onCancel);
  }

  function hide() {
    if (elements.modal) {
      Modal.hide(elements.modal);
    }
  }

  function bindEvents() {
    // Confirm button - remove any existing listener and add new one
    if (elements.confirmBtn) {
      elements.confirmBtn.onclick = null; // Clear any existing listener
      elements.confirmBtn.onclick = handleConfirm;
    }

    // Cancel button - remove any existing listener and add new one
    if (elements.cancelBtn) {
      elements.cancelBtn.onclick = null; // Clear any existing listener
      elements.cancelBtn.onclick = handleCancel;
    }

    // Click on overlay to cancel - remove any existing listener and add new one
    if (elements.modal) {
      elements.modal.onclick = null; // Clear any existing listener
      elements.modal.onclick = (e) => {
        if (e.target === elements.modal) {
          handleCancel();
        }
      };
    }
  }

  function handleConfirm() {
    hide();
    if (onConfirmCallback) {
      onConfirmCallback();
    }
  }

  function handleCancel() {
    hide();
    if (onCancelCallback) {
      onCancelCallback();
    }
  }

  // Extend the global Modal object with confirm functionality
  if (typeof Modal !== 'undefined') {
    Modal.confirm = function(title, message, onConfirm, onCancel = null) {
      show(title, message, onConfirm, onCancel);
    };
  }

  return {
    show,
    hide
  };
})();