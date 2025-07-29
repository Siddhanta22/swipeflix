// src/storage.js

/** Safely save a JSON-serializable value to localStorage */
export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (_) { /* ignore */ }
}

/** Safely load and parse a JSON value from localStorage */
export function loadFromStorage(key) {
  try {
    const v = window.localStorage.getItem(key)
    return v == null ? null : JSON.parse(v)
  } catch (_) {
    return null
  }
}

// Watchlist helpers
export function getWatchlist() {
  return loadFromStorage('watchlist') || [];
}

export function addToWatchlist(item) {
  const list = getWatchlist();
  if (!list.find(m => m.id === item.id)) {
    saveToStorage('watchlist', [...list, item]);
  }
}

export function removeFromWatchlist(id) {
  const list = getWatchlist();
  saveToStorage('watchlist', list.filter(m => m.id !== id));
}

export function isInWatchlist(id) {
  return getWatchlist().some(m => m.id === id);
}
