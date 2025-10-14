const STORAGE_KEY = "mygym.gyms";
const STORAGE_VERSION = 1;

function warn(message, error) {
  const logger = typeof globalThis !== "undefined" ? globalThis.console : undefined;

  if (logger && typeof logger.warn === "function") {
    logger.warn(message, error);
  }
}

function getStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function isValidGym(gym) {
  return Boolean(gym && typeof gym.id === "string" && typeof gym.name === "string");
}

function normaliseGyms(candidate) {
  if (!Array.isArray(candidate)) {
    return undefined;
  }

  const validGyms = candidate.filter(isValidGym);

  if (validGyms.length !== candidate.length) {
    return undefined;
  }

  return validGyms;
}

function runMigrations(serialised) {
  if (serialised.version === STORAGE_VERSION) {
    return normaliseGyms(serialised.gyms);
  }

  // Future storage versions can be handled here. Returning undefined triggers fallback data.
  return undefined;
}

export function loadGyms(fallbackGyms) {
  const storage = getStorage();

  if (!storage) {
    return fallbackGyms;
  }

  const storedValue = storage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return fallbackGyms;
  }

  try {
    const parsed = JSON.parse(storedValue);

    if (!parsed || typeof parsed !== "object") {
      return fallbackGyms;
    }

    const migrated = runMigrations(parsed);

    if (!migrated) {
      return fallbackGyms;
    }

    return migrated;
  } catch (error) {
    warn("Failed to load gyms from storage", error);
    return fallbackGyms;
  }
}

export function saveGyms(gyms) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    const payload = JSON.stringify({ version: STORAGE_VERSION, gyms });
    storage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    warn("Failed to persist gyms to storage", error);
  }
}

export function storageKey() {
  return STORAGE_KEY;
}

export function storageVersion() {
  return STORAGE_VERSION;
}
