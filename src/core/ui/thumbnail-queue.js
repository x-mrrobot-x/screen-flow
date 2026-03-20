import ImageUtils from "../../lib/image-utils.js";
import ThumbnailCache from "./thumbnail-cache.js";

const MAX_CONCURRENT = 3;

let queue = [];
let running = 0;
let session = 0;

function enqueue(card) {
  const videoPath = card?.dataset?.filePath;
  if (!videoPath) return;
  if (card.dataset.thumbQueued) return;
  card.dataset.thumbQueued = "1";
  queue.push({ card, cardSession: session });
  drain();
}

function enqueueAll(cards) {
  cards.forEach(enqueue);
}

function reset() {
  session++;
  queue = [];
}

function drain() {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    const item = queue.shift();
    processCard(item.card, item.cardSession);
  }
}

function isStale(cardSession, card) {
  return cardSession !== session || !card.isConnected;
}

async function resolveThumbnail(videoPath, mtime) {
  const cached = await ThumbnailCache.get(videoPath, mtime);
  if (cached) return cached;
  const result = await ImageUtils.videoToThumbnailUrl(videoPath);
  ThumbnailCache.set(videoPath, mtime, result.dataUrl).catch(() => {});
  return result.dataUrl;
}

function applyThumbnail(card, dataUrl) {
  const img = card.querySelector(".media-thumb");
  const placeholder = card.querySelector(".recording-thumb-placeholder");
  const playIcon = card.querySelector(".recording-play-icon");
  if (img) {
    img.src = dataUrl;
    img.style.display = "block";
  }
  if (placeholder) placeholder.style.display = "none";
  if (playIcon) playIcon.classList.add("thumb-ready");
}

function applyThumbnailError(card) {
  const placeholder = card.querySelector(".recording-thumb-placeholder");
  if (placeholder) placeholder.classList.add("thumb-error");
}

async function processCard(card, cardSession) {
  running++;
  const videoPath = card.dataset.filePath;
  const mtime = card.dataset.fileMtime || "0";

  try {
    const dataUrl = await resolveThumbnail(videoPath, mtime);
    if (isStale(cardSession, card)) return;
    applyThumbnail(card, dataUrl);
  } catch {
    if (isStale(cardSession, card)) return;
    applyThumbnailError(card);
  } finally {
    running--;
    drain();
  }
}

export default {
  enqueue,
  enqueueAll,
  reset
};
