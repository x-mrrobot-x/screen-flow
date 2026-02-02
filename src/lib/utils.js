const Utils = (function() {
  'use strict';

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      if (diffMins < 1) return "Agora mesmo";
      return `${diffMins} min atrás`;
    } else if (diffDays < 1) {
      return `${diffHours}h atrás`;
    } else if (diffDays < 7) {
      return `${diffDays} dia${diffDays > 1 ? "s" : ""} atrás`;
    } else {
      const date = new Date(timestamp);
      const today = new Date();

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return `Hoje, ${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else if (date.getDate() === today.getDate() - 1) {
        return `Ontem, ${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else {
        return `${date.getDate()} ${date.toLocaleString("pt-BR", {
          month: "short"
        })}`;
      }
    }
  }

  const STORAGE_PREFIX = "@screenflow:";

  async function generateHash(str) {
      const buffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredData(key) {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
  }

  function setStoredData(key, data) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  }

  function sanitizeFolderName(name) {
    if (typeof name !== 'string') return '';
    return name
      .trim()
      .replace(/:/g, "-")
      .replace(/"/g, "")
      .replace(/\$/g, "")
      .replace(/`/g, "")
      .replace(/\\/g, "-");
  }

  return {
    formatTimestamp,
    generateHash,
    getStoredData,
    setStoredData,
    sanitizeFolderName
  };
})();
