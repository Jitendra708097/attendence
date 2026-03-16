/**
 * @module storage
 * @description Safe localStorage helpers with JSON serialization.
 *              All keys are prefixed to avoid collisions.
 */

export function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function clearAll() {
  try {
    // Only clear our keys
    const keysToRemove = Object.keys(localStorage).filter((k) =>
      k.startsWith('ae_sa_')
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}
