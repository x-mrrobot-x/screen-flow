const Modal = (() => {
  'use strict';
  const modalStack = [];
  const modalCallbacks = new Map();

  function toggleModal(modalElement, show) {
    if (show) {
      // Ensure the element has the correct display property
      modalElement.style.display = 'flex';
      // Small delay to allow display:flex to take effect before adding active class
      setTimeout(() => {
        modalElement.classList.add("active");
      }, 10);
    } else {
      modalElement.classList.remove("active");
      // Wait for the transition to complete before hiding
      setTimeout(() => {
        modalElement.style.display = 'none';
      }, 300); // Match the CSS transition time
    }
  }

  function show(modalElement, onCloseCallback = null) {
    if (!modalStack.includes(modalElement)) {
      modalStack.push(modalElement);
    }

    if (onCloseCallback) {
      modalCallbacks.set(modalElement, onCloseCallback);
    }

    toggleModal(modalElement, true);
  }

  function hide(modalElement) {
    toggleModal(modalElement, false);

    const index = modalStack.indexOf(modalElement);
    if (index > -1) {
      modalStack.splice(index, 1);
    }
    modalCallbacks.delete(modalElement);
  }

  function goBack() {
    if (modalStack.length > 0) {
      const currentModal = modalStack.pop();
      toggleModal(currentModal, false);

      const callback = modalCallbacks.get(currentModal);
      if (callback) {
        callback();
        modalCallbacks.delete(currentModal);
      }

      return true;
    }
    return false;
  }

  // Initialize modal elements to be hidden by default
  function init() {
    // Find all modal overlays and ensure they're hidden initially
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
      overlay.style.display = 'none';
      overlay.classList.remove('active'); // Ensure no active class initially
    });
  }

  // Initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    show,
    hide,
    goBack
  };
})();