const Modal = (() => {
  const modalStack = [];
  const modalCallbacks = new Map();

  function toggleModal(modalElement, active) {
    if (active) {
      modalElement.showModal();
      document.body.style.overflow = "hidden";
    } else {
      modalElement.close();
      if (modalStack.length <= 1) {
        document.body.style.overflow = "";
      }
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
    console.log(modalStack)
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

  return {
    show,
    hide,
    goBack
  };
})();
