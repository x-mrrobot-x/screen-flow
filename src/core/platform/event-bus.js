import Logger from "./logger.js";

const events = {};

function on(eventName, callback) {
  if (!events[eventName]) events[eventName] = [];
  events[eventName].push(callback);
}

function once(eventName, callback) {
  function wrapper(data) {
    off(eventName, wrapper);
    callback(data);
  }
  on(eventName, wrapper);
}

function off(eventName, callback) {
  if (!events[eventName]) return;
  const index = events[eventName].indexOf(callback);
  if (index !== -1) events[eventName].splice(index, 1);
}

function emit(eventName, data) {
  if (!events[eventName]) return;
  const listeners = [...events[eventName]];
  for (const callback of listeners) {
    try {
      callback(data);
    } catch (error) {
      Logger.error(`Error in event listener for "${eventName}":`, error);
    }
  }
}

export default {
  on,
  once,
  off,
  emit
};
