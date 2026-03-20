import AppState from "../../../core/state/app-state.js";
import ImageUtils from "../../../lib/image-utils.js";
import Gemini from "../../../lib/gemini.js";

function isVideoFile(filePath) {
  return /\.(mp4|mkv|webm|mov|avi|3gp)$/i.test(filePath || "");
}

function geminiConfig() {
  const gemini = AppState.getSetting("gemini") || {};
  return {
    model: gemini.model || "gemini-2.5-flash-lite",
    apiKeys: gemini.apiKeys || [],
    activeKeyIndex: gemini.activeKeyIndex || 0,
    lang: AppState.getSetting("language") || "en",
    gemini
  };
}

function withFallbacks(cfg, base64, filename) {
  return Gemini.generateTagsWithFallback(
    base64,
    cfg.model,
    cfg.apiKeys,
    cfg.activeKeyIndex,
    filename,
    cfg.lang,
    workingModel => {
      const current = AppState.getSetting("gemini") || {};
      if (current.model !== workingModel)
        AppState.setSetting("gemini", { ...current, model: workingModel });
    },
    keyIndex => {
      const current = AppState.getSetting("gemini") || {};
      if (current.activeKeyIndex !== keyIndex)
        AppState.setSetting("gemini", { ...current, activeKeyIndex: keyIndex });
    }
  );
}

async function generateTagsGemini(imagePath) {
  const cfg = geminiConfig();
  const base64 = await ImageUtils.imageToBase64(imagePath);
  return withFallbacks(cfg, base64, imagePath.split("/").pop());
}

async function generateTagsGeminiFromBase64(base64, filePath) {
  const cfg = geminiConfig();
  return withFallbacks(cfg, base64, filePath.split("/").pop());
}

async function generateTagsGeminiFromVideo(videoPath) {
  const cfg = geminiConfig();
  const base64 = await ImageUtils.videoToBase64(videoPath);
  return withFallbacks(cfg, base64, videoPath.split("/").pop());
}

async function generateTags(filePath) {
  return isVideoFile(filePath)
    ? generateTagsGeminiFromVideo(filePath)
    : generateTagsGemini(filePath);
}

export default {
  isVideoFile,
  generateTags,
  generateTagsGemini,
  generateTagsGeminiFromBase64,
  generateTagsGeminiFromVideo
};
