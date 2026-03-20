const MAX_WIDTH = 512;
const MAX_HEIGHT = 1024;
const THUMB_MAX = 320;
const BLACK_THRESHOLD = 15;
const SEEK_FALLBACKS = [1, 2, 3];

function imageToBase64(filePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
      resolve(base64);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${filePath}`));
    img.src = filePath;
  });
}

function createVideoElement(path, { playsInline = false } = {}) {
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.playsInline = playsInline;
  video.src = path;
  return video;
}

function thumbSize(videoWidth, videoHeight) {
  const vw = videoWidth || 720;
  const vh = videoHeight || 1280;
  const scale = Math.min(THUMB_MAX / vw, THUMB_MAX / vh, 1);
  return { w: Math.round(vw * scale), h: Math.round(vh * scale) };
}

function scaledSize(videoWidth, videoHeight) {
  const vw = videoWidth || MAX_WIDTH;
  const vh = videoHeight || MAX_HEIGHT;
  const scale = Math.min(MAX_WIDTH / vw, MAX_HEIGHT / vh, 1);
  return { w: Math.round(vw * scale), h: Math.round(vh * scale) };
}

function waitForFrame(video, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2) return resolve();

    let timer;
    const cleanup = () => clearTimeout(timer);

    const onReady = () => {
      cleanup();
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      cleanup();
      video.removeEventListener("loadeddata", onReady);
      reject(new Error("Video load error"));
    };

    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });

    timer = setTimeout(() => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      reject(new Error("Video load timeout"));
    }, timeoutMs);
  });
}

async function renderToCanvas(source, w, h, quality = "medium") {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(source, {
      resizeWidth: w,
      resizeHeight: h,
      resizeQuality: quality
    }).catch(() => createImageBitmap(source));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(source, 0, 0, w, h);
  return canvas;
}

async function captureFrame(video) {
  const { w, h } = thumbSize(video.videoWidth, video.videoHeight);
  const canvas = await renderToCanvas(video, w, h, "medium");
  return { canvas, dataUrl: canvas.toDataURL("image/jpeg", 0.75) };
}

async function captureScaled(video) {
  const { w, h } = scaledSize(video.videoWidth, video.videoHeight);
  return renderToCanvas(video, w, h, "high");
}

function isFrameBlack(canvas) {
  try {
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const totalPixels = data.length / 4;
    const step = Math.max(1, Math.floor(totalPixels / 100)) * 4;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += step) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      count++;
    }
    return count === 0 || sum / count < BLACK_THRESHOLD;
  } catch {
    return false;
  }
}

function seekTo(video, seekTime) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      reject(new Error("Seek failed"));
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = Math.min(
      seekTime,
      Math.max((video.duration || seekTime + 1) - 0.1, 0)
    );
  });
}

async function seekForNonBlackFrame(video, captureFunc) {
  for (const seekTime of SEEK_FALLBACKS) {
    try {
      await seekTo(video, seekTime);
      const canvas = await captureFunc(video);
      if (!isFrameBlack(canvas)) return canvas;
    } catch {
      break;
    }
  }
  return null;
}

async function videoToThumbnailUrl(videoPath) {
  const video = createVideoElement(videoPath, { playsInline: true });
  await waitForFrame(video);

  let { canvas, dataUrl } = await captureFrame(video);

  if (isFrameBlack(canvas)) {
    const fallback = await seekForNonBlackFrame(
      video,
      async v => (await captureFrame(v)).canvas
    );
    if (fallback) {
      canvas = fallback;
      dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    }
  }

  return { dataUrl, isBlack: isFrameBlack(canvas) };
}

async function videoToBase64(videoPath) {
  const video = createVideoElement(videoPath);
  await waitForFrame(video);

  let canvas = await captureScaled(video);

  if (isFrameBlack(canvas)) {
    const fallback = await seekForNonBlackFrame(video, captureScaled);
    if (fallback) canvas = fallback;
  }

  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
}

export default {
  imageToBase64,
  videoToThumbnailUrl,
  videoToBase64
};
