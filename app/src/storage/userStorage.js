const STORAGE_KEY = "sessionatlas.user";
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

function isValidUser(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const { id, name } = candidate;
  return typeof id === "string" && typeof name === "string";
}

function fromStoredPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  if (payload.version !== STORAGE_VERSION) {
    return undefined;
  }

  return isValidUser(payload.user) ? payload.user : undefined;
}

export function loadUser(fallbackUser) {
  const storage = getStorage();

  if (!storage) {
    return fallbackUser;
  }

  const storedValue = storage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return fallbackUser;
  }

  try {
    const parsed = JSON.parse(storedValue);
    const user = fromStoredPayload(parsed);

    return user ?? fallbackUser;
  } catch (error) {
    warn("Failed to load user from storage", error);
    return fallbackUser;
  }
}

export function saveUser(user) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (!isValidUser(user)) {
    warn("Refused to persist invalid user payload", user);
    return;
  }

  try {
    const payload = JSON.stringify({ version: STORAGE_VERSION, user });
    storage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    warn("Failed to persist user to storage", error);
  }
}

export function storageKey() {
  return STORAGE_KEY;
}

export function storageVersion() {
  return STORAGE_VERSION;
}
