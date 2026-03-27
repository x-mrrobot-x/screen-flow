import MediaDetailModel from "./media-detail.model.js";
import MediaDetailView from "./media-detail.view.js";
import History from "../../../core/ui/history.js";
import Toast from "../../../core/ui/toast.js";
import I18n from "../../../core/services/i18n.js";

let currentFile = null;
let currentType = null;
let onCardUpdated = null;
let generateTags = null;
let handleTaggingError = null;
let requireGeminiKey = null;

function setCardUpdateCallback(fn) {
  onCardUpdated = fn;
}

function onClose() {
  if (currentType === "video") MediaDetailView.update.stopVideo();
}

function open(file, type) {
  currentFile = file;
  currentType = type;
  MediaDetailView.update.open(file, type);
  const { dialog, player } = MediaDetailView.getElements();
  History.pushDialog(dialog, onClose);
  if (type === "video" && player) player.play().catch(() => {});
}

function applyFileUpdate(oldPath, newPath) {
  const newName = newPath.split("/").pop();
  currentFile = { ...currentFile, path: newPath, name: newName };
  MediaDetailView.update.tags(newName);
  onCardUpdated?.(oldPath, newPath, newName, currentType === "video");
}

function applyTagsToCurrentFile(tags) {
  return MediaDetailModel.applyTags(currentFile.path, tags).then(newPath => {
    if (newPath) applyFileUpdate(currentFile.path, newPath);
  });
}

function handleGenerateTags() {
  if (!currentFile) return;
  if (!requireGeminiKey()) return;

  MediaDetailView.update.generateBtnLoading(true);

  generateTags(currentFile.path)
    .then(tags => (tags.length ? applyTagsToCurrentFile(tags) : null))
    .catch(handleTaggingError)
    .finally(() => MediaDetailView.update.generateBtnLoading(false));
}

function handleTagRemoval(tag) {
  if (!currentFile) return;
  const oldPath = currentFile.path;
  MediaDetailModel.removeTag(oldPath, tag)
    .then(newPath => {
      if (newPath) applyFileUpdate(oldPath, newPath);
    })
    .catch(() => {});
}

const handlers = {
  onClose: () => History.goBack(),
  onTagsClick: e => {
    const btn = e.target.closest(".tag-remove-btn");
    if (btn) handleTagRemoval(btn.dataset.tag);
  },
  onGenerate: () => handleGenerateTags()
};

function attachEvents() {
  const { dialog, closeBtn, generateBtn } = MediaDetailView.getElements();

  const events = [
    [closeBtn, "click", handlers.onClose],
    [dialog, "click", handlers.onTagsClick],
    [generateBtn, "click", handlers.onGenerate]
  ];
  events.forEach(([el, event, handler]) => el.addEventListener(event, handler));
}

function setGenerateFn(fn) {
  generateTags = fn;
}

function setErrorHandler(fn) {
  handleTaggingError = fn;
}

function setRequireGeminiKey(fn) {
  requireGeminiKey = fn;
}

function init() {
  MediaDetailView.init();
  attachEvents();
}

export default {
  init,
  open,
  setCardUpdateCallback,
  setGenerateFn,
  setErrorHandler,
  setRequireGeminiKey
};
