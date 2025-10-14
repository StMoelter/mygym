import { useCallback, useEffect, useState } from "react";

export const GYM_STORAGE_KEY = "mygym.gyms";

export const DEFAULT_GYMS = [
  { id: "pulse-arena", name: "Pulse Arena" },
  { id: "iron-haven", name: "Iron Haven" },
  { id: "urban-move", name: "Urban Move Loft" }
];

function getStorage() {
  if (typeof globalThis === "undefined") {
    return undefined;
  }

  return globalThis.localStorage ?? undefined;
}

function isValidGym(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.name === "string");
}

export function readStoredGyms(storage = getStorage()) {
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(GYM_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (Array.isArray(parsed) && parsed.every(isValidGym)) {
      return parsed;
    }
  } catch (error) {
    const logger = typeof globalThis !== "undefined" ? globalThis.console : undefined;
    logger?.warn("Failed to parse stored gyms", error);
  }

  return null;
}

function persistGyms(gyms, storage = getStorage()) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(GYM_STORAGE_KEY, JSON.stringify(gyms));
  } catch (error) {
    const logger = typeof globalThis !== "undefined" ? globalThis.console : undefined;
    logger?.warn("Failed to persist gyms", error);
  }
}

function createGym(name) {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoApi?.randomUUID) {
    return { id: cryptoApi.randomUUID(), name };
  }

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name
  };
}

export function usePersistentGyms(initialGyms = DEFAULT_GYMS) {
  const [gyms, setGyms] = useState(() => readStoredGyms() ?? initialGyms);

  useEffect(() => {
    persistGyms(gyms);
  }, [gyms]);

  const addGym = useCallback((name) => {
    setGyms((current) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return current;
      }

      return [...current, createGym(trimmed)];
    });
  }, []);

  const renameGym = useCallback((id, name) => {
    setGyms((current) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return current;
      }

      return current.map((gym) => (gym.id === id ? { ...gym, name: trimmed } : gym));
    });
  }, []);

  const removeGym = useCallback((id) => {
    setGyms((current) => current.filter((gym) => gym.id !== id));
  }, []);

  return { gyms, addGym, renameGym, removeGym };
}
