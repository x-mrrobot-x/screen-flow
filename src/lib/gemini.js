const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-3-pro-preview",
  "gemini-2.5-pro"
];

const QUOTA_ERRORS = new Set(["quota_exceeded", "rate_limit"]);

const API_URL = model =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const LANG_NAMES = { pt: "Portuguese", es: "Spanish", en: "English" };

class GeminiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function parseErrorCode(status, httpStatus) {
  if (status === "RESOURCE_EXHAUSTED") {
    return httpStatus === 429 ? "quota_exceeded" : "rate_limit";
  }
  if (status === "UNAVAILABLE") return "overloaded";
  if (status === "PERMISSION_DENIED" || status === "UNAUTHENTICATED")
    return "invalid_key";
  if (status === "INVALID_ARGUMENT") return "bad_request";
  if (httpStatus >= 500) return "server_error";
  return "server_error";
}

function buildPrompt(filename, lang) {
  const langName = LANG_NAMES[lang] || "English";
  return (
    `Analyze this screenshot. The filename is "${filename}" — use it to identify the app name as the first tag ` +
    `(e.g. if the filename contains "org.telegram.messenger" use "telegram", if it contains "com.whatsapp" use "whatsapp"). ` +
    `Then add the most relevant tags describing the main content shown. ` +
    `Rules: maximum 10 tags total, no duplicate tags, prioritize the most important and specific tags first, use hyphens for multi-word tags (e.g. free-fire). ` +
    `Return only a comma-separated list of unique lowercase tags in ${langName}. ` +
    `No explanations, no punctuation, only tags separated by commas.`
  );
}

function buildRequestBody(base64, filename, lang) {
  return JSON.stringify({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: "image/jpeg", data: base64 } },
          { text: buildPrompt(filename, lang) }
        ]
      }
    ]
  });
}

async function throwIfResponseError(response) {
  if (response.ok) return;
  let status = "";
  try {
    const body = await response.json();
    status = body?.error?.status || "";
  } catch {}
  throw new GeminiError(
    parseErrorCode(status, response.status),
    `Gemini API error: ${response.status} ${status}`
  );
}

function parseTags(data) {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text
    .split(",")
    .map(t => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
}

async function generateTagsFromBase64(base64, model, apiKey, filename, lang) {
  let response;
  try {
    response = await fetch(`${API_URL(model)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: buildRequestBody(base64, filename, lang)
    });
  } catch {
    throw new GeminiError("network_error", "Network request failed");
  }

  await throwIfResponseError(response);

  const data = await response.json();
  return parseTags(data);
}

function buildModelQueue(preferredModel) {
  const startIndex = Math.max(FALLBACK_MODELS.indexOf(preferredModel), 0);
  return [
    ...FALLBACK_MODELS.slice(startIndex),
    ...FALLBACK_MODELS.slice(0, startIndex)
  ];
}

function buildKeyQueue(apiKeys, activeKeyIndex) {
  return [
    ...apiKeys.slice(activeKeyIndex),
    ...apiKeys.slice(0, activeKeyIndex)
  ];
}

function notifySuccess(
  model,
  preferredModel,
  realKeyIndex,
  activeKeyIndex,
  onModelChanged,
  onKeyChanged
) {
  if (model !== preferredModel && onModelChanged) onModelChanged(model);
  if (realKeyIndex !== activeKeyIndex && onKeyChanged)
    onKeyChanged(realKeyIndex);
}

async function generateTagsWithFallback(
  base64,
  preferredModel,
  apiKeys,
  activeKeyIndex,
  filename,
  lang,
  onModelChanged,
  onKeyChanged
) {
  const modelQueue = buildModelQueue(preferredModel);
  const keyQueue = buildKeyQueue(apiKeys, activeKeyIndex);

  let lastError = null;

  for (let ki = 0; ki < keyQueue.length; ki++) {
    const apiKey = keyQueue[ki];
    const realKeyIndex = (activeKeyIndex + ki) % apiKeys.length;

    for (const model of modelQueue) {
      try {
        const tags = await generateTagsFromBase64(
          base64,
          model,
          apiKey,
          filename,
          lang
        );
        notifySuccess(
          model,
          preferredModel,
          realKeyIndex,
          activeKeyIndex,
          onModelChanged,
          onKeyChanged
        );
        return tags;
      } catch (err) {
        if (QUOTA_ERRORS.has(err.code)) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
  }

  throw (
    lastError ||
    new GeminiError("quota_exceeded", "All keys and models exhausted")
  );
}

export { GeminiError, FALLBACK_MODELS };

export default {
  generateTagsFromBase64,
  generateTagsWithFallback
};
