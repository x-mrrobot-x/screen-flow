import DOM from "../../lib/dom.js";
import DialogStack from "./dialog-stack.js";

let elements = null;
let onConfirmCallback = null;

function queryElements() {
  elements = {
    dialog: DOM.qs("#confirmation-dialog"),
    closeBtn: DOM.qs("#confirmation-dialog-close"),
    title: DOM.qs("#confirmation-dialog-title"),
    message: DOM.qs("#confirmation-dialog-message"),
    confirmBtn: DOM.qs("#confirmation-dialog-confirm"),
    cancelBtn: DOM.qs("#confirmation-dialog-cancel")
  };
}

function open({ title, message }, onConfirm) {
  elements.title.textContent = title;
  elements.message.textContent = message;
  onConfirmCallback = onConfirm;
  DialogStack.push(elements.dialog);
}

function close() {
  DialogStack.goBack();
  onConfirmCallback = null;
}

function handleConfirm() {
  const cb = onConfirmCallback;
  close();
  cb();
}

const handlers = {
  onConfirm: handleConfirm,
  onClose: close
};

function attachEvents() {
  const { closeBtn, confirmBtn, cancelBtn } = elements;
  const events = [
    [confirmBtn, "click", handlers.onConfirm],
    [cancelBtn, "click", handlers.onClose],
    [closeBtn, "click", handlers.onClose]
  ];
  events.forEach(([el, event, handler]) => el.addEventListener(event, handler));
}

function setup() {
  queryElements();
  attachEvents();
}

export default {
  setup,
  open,
  close
};
