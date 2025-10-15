const STORAGE_KEY = "mygym.workspace";
const STORAGE_VERSION = 3;

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

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normaliseSettingsDefinitions(candidate) {
  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate
    .filter((definition) => isNonEmptyString(definition?.id) && isNonEmptyString(definition?.name))
    .map((definition) => ({ id: definition.id, name: definition.name }));
}

function normaliseSettingsValues(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  const entries = Object.entries(candidate);

  if (entries.length === 0) {
    return {};
  }

  const resemblesLegacyFormat = entries.every(([, value]) => {
    if (!value || typeof value !== "object") {
      return false;
    }

    return Object.values(value).some((item) => typeof item === "string");
  });

  if (resemblesLegacyFormat) {
    const legacyValues = {};

    for (const [userId, values] of entries) {
      if (!isNonEmptyString(userId) || !values || typeof values !== "object") {
        continue;
      }

      const userValues = {};

      for (const [settingId, value] of Object.entries(values)) {
        if (isNonEmptyString(settingId) && typeof value === "string") {
          userValues[settingId] = value;
        }
      }

      if (Object.keys(userValues).length > 0) {
        legacyValues[userId] = userValues;
      }
    }

    if (Object.keys(legacyValues).length === 0) {
      return {};
    }

    return { "tenant-default": legacyValues };
  }

  const normalised = {};

  for (const [tenantId, tenantValues] of entries) {
    if (!isNonEmptyString(tenantId) || !tenantValues || typeof tenantValues !== "object") {
      continue;
    }

    const userValues = {};

    for (const [userId, values] of Object.entries(tenantValues)) {
      if (!isNonEmptyString(userId) || !values || typeof values !== "object") {
        continue;
      }

      const settings = {};

      for (const [settingId, value] of Object.entries(values)) {
        if (isNonEmptyString(settingId) && typeof value === "string") {
          settings[settingId] = value;
        }
      }

      if (Object.keys(settings).length > 0) {
        userValues[userId] = settings;
      }
    }

    if (Object.keys(userValues).length > 0) {
      normalised[tenantId] = userValues;
    }
  }

  return normalised;
}

function normaliseExercises(candidate, { allowEmpty = false } = {}) {
  if (!Array.isArray(candidate)) {
    return allowEmpty ? [] : undefined;
  }

  const exercises = candidate
    .filter((exercise) => isNonEmptyString(exercise?.id) && isNonEmptyString(exercise?.name))
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      settingsValues: normaliseSettingsValues(exercise.settingsValues)
    }));

  if (!allowEmpty && exercises.length === 0) {
    return undefined;
  }

  return exercises;
}

function normaliseDeviceAssignment(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const hasValidId = isNonEmptyString(candidate.id);
  const hasValidName = isNonEmptyString(candidate.name);
  const hasValidLibraryRef = isNonEmptyString(candidate.libraryDeviceId);

  if (!hasValidId || !hasValidName || !hasValidLibraryRef) {
    return undefined;
  }

  const exercises = normaliseExercises(candidate.exercises, { allowEmpty: true });

  if (!exercises) {
    return undefined;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    libraryDeviceId: candidate.libraryDeviceId,
    tenantId: isNonEmptyString(candidate.tenantId) ? candidate.tenantId : "tenant-default",
    published: Boolean(candidate.published),
    weightStackCount: candidate.weightStackCount === 2 ? 2 : 1,
    settingsLocked: Boolean(candidate.settingsLocked),
    settingsDefinitions: normaliseSettingsDefinitions(candidate.settingsDefinitions),
    exercises
  };
}

function normaliseLibraryDevice(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const hasValidId = isNonEmptyString(candidate.id);
  const hasValidName = isNonEmptyString(candidate.name);

  if (!hasValidId || !hasValidName) {
    return undefined;
  }

  const exercises = normaliseExercises(candidate.exercises, { allowEmpty: true });

  if (!exercises) {
    return undefined;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    tenantId: isNonEmptyString(candidate.tenantId) ? candidate.tenantId : "tenant-default",
    published: Boolean(candidate.published),
    weightStackCount: candidate.weightStackCount === 2 ? 2 : 1,
    settingsDefinitions: normaliseSettingsDefinitions(candidate.settingsDefinitions),
    exercises: exercises.map((exercise) => ({ id: exercise.id, name: exercise.name }))
  };
}

function normaliseGyms(candidate) {
  if (!Array.isArray(candidate)) {
    return [];
  }

  const gyms = candidate
    .filter((gym) => isNonEmptyString(gym?.id) && isNonEmptyString(gym?.name))
    .map((gym) => ({
      id: gym.id,
      name: gym.name,
      devices: Array.isArray(gym.devices)
        ? gym.devices.map(normaliseDeviceAssignment).filter(Boolean)
        : []
    }));

  return gyms;
}

function normaliseWorkspace(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const gyms = normaliseGyms(candidate.gyms);
  const deviceLibrary = Array.isArray(candidate.deviceLibrary)
    ? candidate.deviceLibrary.map(normaliseLibraryDevice).filter(Boolean)
    : [];
  const providedId = isNonEmptyString(candidate.selectedGymId) ? candidate.selectedGymId : null;
  const selectedGymId = providedId && gyms.some((gym) => gym.id === providedId) ? providedId : gyms[0]?.id ?? null;

  return {
    gyms,
    deviceLibrary,
    selectedGymId
  };
}

function createWorkspaceFromGyms(fallbackGyms) {
  if (!Array.isArray(fallbackGyms)) {
    return { gyms: [], deviceLibrary: [], selectedGymId: null };
  }

  const gyms = fallbackGyms
    .filter((gym) => isNonEmptyString(gym?.id) && isNonEmptyString(gym?.name))
    .map((gym) => ({ id: gym.id, name: gym.name, devices: [] }));

  return {
    gyms,
    deviceLibrary: [],
    selectedGymId: gyms[0]?.id ?? null
  };
}

function runMigrations(serialised) {
  if (serialised?.version === STORAGE_VERSION) {
    return normaliseWorkspace(serialised.workspace);
  }

  if (serialised?.version === 2) {
    return normaliseWorkspace(serialised.workspace);
  }

  if (serialised?.version === 1 && Array.isArray(serialised.gyms)) {
    return normaliseWorkspace(createWorkspaceFromGyms(serialised.gyms));
  }

  return undefined;
}

export function createInitialWorkspace(initialGyms) {
  return createWorkspaceFromGyms(initialGyms);
}

export function loadWorkspace(fallbackWorkspace) {
  const storage = getStorage();
  const safeFallback = normaliseWorkspace(fallbackWorkspace) ?? { gyms: [], deviceLibrary: [], selectedGymId: null };

  if (!storage) {
    return safeFallback;
  }

  const storedValue = storage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return safeFallback;
  }

  try {
    const parsed = JSON.parse(storedValue);
    const migrated = runMigrations(parsed);

    if (!migrated) {
      return safeFallback;
    }

    return migrated;
  } catch (error) {
    warn("Failed to load workspace from storage", error);
    return safeFallback;
  }
}

export function saveWorkspace(workspace) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    const payload = JSON.stringify({ version: STORAGE_VERSION, workspace });
    storage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    warn("Failed to persist workspace to storage", error);
  }
}

export function storageKey() {
  return STORAGE_KEY;
}

export function storageVersion() {
  return STORAGE_VERSION;
}
