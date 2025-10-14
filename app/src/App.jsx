import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./App.module.css";
import {
  createInitialWorkspace,
  loadWorkspace,
  saveWorkspace
} from "./storage/gymStorage.js";
import { loadUser, saveUser } from "./storage/userStorage.js";

const initialGyms = [
  { id: "pulse-arena", name: "Pulse Arena" },
  { id: "iron-haven", name: "Iron Haven" },
  { id: "urban-move", name: "Urban Move Loft" }
];

const initialWorkspace = createInitialWorkspace(initialGyms);
const DEFAULT_USER = { id: "primary-user", name: "" };
const DEFAULT_TENANT_ID = "tenant-default";

function generateId(prefix) {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoApi?.randomUUID) {
    return `${prefix}-${cryptoApi.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDeviceTemplate(name, exerciseName, tenantId) {
  const deviceId = generateId("device");
  const exerciseId = generateId("exercise");

  return {
    id: deviceId,
    name,
    tenantId,
    published: false,
    settingsDefinitions: [],
    exercises: [
      {
        id: exerciseId,
        name: exerciseName
      }
    ]
  };
}

function instantiateDevice(template) {
  return {
    id: generateId("assignment"),
    name: template.name,
    libraryDeviceId: template.id,
    tenantId: template.tenantId,
    published: Boolean(template.published),
    settingsLocked: false,
    settingsDefinitions: template.settingsDefinitions.map((definition) => ({ ...definition })),
    exercises:
      template.exercises.length > 0
        ? template.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            settingsValues: {}
          }))
        : [
            {
              id: generateId("exercise"),
              name: template.name,
              settingsValues: {}
            }
          ]
  };
}

function hasRecordedSettings(device, userId) {
  return device.exercises.some((exercise) => {
    const values = exercise.settingsValues?.[userId];

    if (!values) {
      return false;
    }

    return Object.values(values).some((value) => value.trim().length > 0);
  });
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [workspace, setWorkspace] = useState(() => loadWorkspace(initialWorkspace));
  const [newGymName, setNewGymName] = useState("");
  const [editingGym, setEditingGym] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState(() => loadUser(DEFAULT_USER));
  const [profileDraft, setProfileDraft] = useState(() => loadUser(DEFAULT_USER));
  const [deviceDraft, setDeviceDraft] = useState({ name: "", exerciseName: "" });
  const [librarySelection, setLibrarySelection] = useState("");
  const [newSettingDrafts, setNewSettingDrafts] = useState({});
  const [newExerciseDrafts, setNewExerciseDrafts] = useState({});
  const [deviceNameDrafts, setDeviceNameDrafts] = useState({});
  const [settingNameDrafts, setSettingNameDrafts] = useState({});
  const [exerciseNameDrafts, setExerciseNameDrafts] = useState({});

  const gyms = workspace.gyms;
  const selectedGymId = workspace.selectedGymId ?? (gyms[0]?.id ?? null);
  const selectedGym = useMemo(
    () => gyms.find((gym) => gym.id === selectedGymId) ?? null,
    [gyms, selectedGymId]
  );
  const activeUserId = profile?.id ?? DEFAULT_USER.id;

  useLayoutEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  useLayoutEffect(() => {
    saveUser(profile);
  }, [profile]);

  useEffect(() => {
    if (isSettingsOpen) {
      setProfileDraft(profile);
    }
  }, [isSettingsOpen, profile]);

  const totalGyms = gyms.length;
  const gymSummary = t("management.list.summary", { count: totalGyms });
  const deviceSummary = selectedGym
    ? t("devices.summary", { count: selectedGym.devices.length })
    : t("devices.summary", { count: 0 });

  function handleAddGym(event) {
    event.preventDefault();
    const trimmed = newGymName.trim();

    if (!trimmed) {
      return;
    }

    const newGym = { id: generateId("gym"), name: trimmed, devices: [] };

    setWorkspace((previous) => ({
      ...previous,
      gyms: [...previous.gyms, newGym],
      selectedGymId: newGym.id
    }));
    setNewGymName("");
  }

  function handleDeleteGym(id) {
    setWorkspace((previous) => {
      const gymsAfterRemoval = previous.gyms.filter((gym) => gym.id !== id);
      const nextSelected = previous.selectedGymId === id ? gymsAfterRemoval[0]?.id ?? null : previous.selectedGymId;

      return {
        ...previous,
        gyms: gymsAfterRemoval,
        selectedGymId: nextSelected
      };
    });

    setEditingGym((current) => {
      if (!current || current.id !== id) {
        return current;
      }

      return null;
    });
  }

  function startEditing(gym) {
    setEditingGym({ id: gym.id, name: gym.name });
  }

  function handleEditingChange(event) {
    const { value } = event.target;
    setEditingGym((current) => (current ? { ...current, name: value } : current));
  }

  function handleRenameGym(event) {
    event.preventDefault();

    if (!editingGym) {
      return;
    }

    const trimmed = editingGym.name.trim();

    if (!trimmed) {
      return;
    }

    setWorkspace((previous) => ({
      ...previous,
      gyms: previous.gyms.map((gym) => (gym.id === editingGym.id ? { ...gym, name: trimmed } : gym))
    }));
    setEditingGym(null);
  }

  function cancelEditing() {
    setEditingGym(null);
  }

  function handleSelectGym(id) {
    setWorkspace((previous) => ({ ...previous, selectedGymId: id }));
  }

  function toggleSettings() {
    setIsSettingsOpen((state) => !state);
  }

  function closeSettings() {
    setIsSettingsOpen(false);
  }

  function handleLanguageChange(event) {
    const { value } = event.target;

    if (!value) {
      return;
    }

    void i18n.changeLanguage(value);
  }

  const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;
  const displayName = profile?.name?.trim() ? profile.name : t("profile.defaultName");

  function handleProfileDraftChange(event) {
    const { value } = event.target;
    setProfileDraft((current) => (current ? { ...current, name: value } : current));
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    const trimmed = profileDraft?.name?.trim() ?? "";
    const nextName = trimmed.length > 0 ? trimmed : "";

    setProfile((current) => {
      const base = current ?? DEFAULT_USER;
      return { ...base, name: nextName };
    });
  }

  function handleDeviceDraftChange(field, value) {
    setDeviceDraft((current) => ({ ...current, [field]: value }));
  }

  function handleDeviceNameInputChange(deviceId, value) {
    setDeviceNameDrafts((current) => ({ ...current, [deviceId]: value }));
  }

  function handleDeviceNameBlur(deviceId) {
    if (!selectedGym) {
      setDeviceNameDrafts((current) => {
        if (!(deviceId in current)) {
          return current;
        }

        const rest = { ...current };
        delete rest[deviceId];
        return rest;
      });
      return;
    }

    setDeviceNameDrafts((current) => {
      if (!(deviceId in current)) {
        return current;
      }

      const draftValue = current[deviceId];
      const trimmed = draftValue.trim();
      const rest = { ...current };
      delete rest[deviceId];

      if (trimmed) {
        updateDevice(selectedGym.id, deviceId, (device) => ({ ...device, name: trimmed }));
      }

      return rest;
    });
  }

  function handleCreateDevice(event) {
    event.preventDefault();

    if (!selectedGym) {
      return;
    }

    const trimmedName = deviceDraft.name.trim();
    const trimmedExercise = deviceDraft.exerciseName.trim();

    if (!trimmedName || !trimmedExercise) {
      return;
    }

    const template = createDeviceTemplate(trimmedName, trimmedExercise, DEFAULT_TENANT_ID);
    const assignment = instantiateDevice(template);

    setWorkspace((previous) => ({
      ...previous,
      gyms: previous.gyms.map((gym) =>
        gym.id === selectedGym.id ? { ...gym, devices: [...gym.devices, assignment] } : gym
      ),
      deviceLibrary: [...previous.deviceLibrary, template]
    }));

    setDeviceDraft({ name: "", exerciseName: "" });
  }

  function handleAdoptFromLibrary(event) {
    event.preventDefault();

    if (!selectedGym || !librarySelection) {
      return;
    }

    const template = workspace.deviceLibrary.find((device) => device.id === librarySelection);

    if (!template) {
      return;
    }

    const assignment = instantiateDevice(template);

    setWorkspace((previous) => ({
      ...previous,
      gyms: previous.gyms.map((gym) =>
        gym.id === selectedGym.id ? { ...gym, devices: [...gym.devices, assignment] } : gym
      )
    }));

    setLibrarySelection("");
  }

  function updateDevice(gymId, deviceId, updater) {
    setWorkspace((previous) => {
      let updatedDevice;

      const gymsWithUpdate = previous.gyms.map((gym) => {
        if (gym.id !== gymId) {
          return gym;
        }

        const updatedDevices = gym.devices.map((device) => {
          if (device.id !== deviceId) {
            return device;
          }

          const nextDevice = updater(device);
          updatedDevice = nextDevice;
          return nextDevice;
        });

        return { ...gym, devices: updatedDevices };
      });

      if (!updatedDevice) {
        return previous;
      }

      const updatedLibrary = previous.deviceLibrary.map((libraryDevice) => {
        if (libraryDevice.id !== updatedDevice.libraryDeviceId) {
          return libraryDevice;
        }

        return {
          ...libraryDevice,
          name: updatedDevice.name,
          tenantId: updatedDevice.tenantId,
          published: updatedDevice.published,
          settingsDefinitions: updatedDevice.settingsDefinitions.map((definition) => ({
            id: definition.id,
            name: definition.name
          })),
          exercises: updatedDevice.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name
          }))
        };
      });

      return { ...previous, gyms: gymsWithUpdate, deviceLibrary: updatedLibrary };
    });
  }

  function handlePublishDevice(deviceId) {
    if (!selectedGym) {
      return;
    }

    updateDevice(selectedGym.id, deviceId, (device) => ({ ...device, published: true }));
  }

  function handleNewSettingDraftChange(deviceId, value) {
    setNewSettingDrafts((current) => ({ ...current, [deviceId]: value }));
  }

  function handleAddSetting(event, deviceId) {
    event.preventDefault();

    if (!selectedGym) {
      return;
    }

    const draftValue = newSettingDrafts[deviceId] ?? "";
    const trimmed = draftValue.trim();

    if (!trimmed) {
      return;
    }

    updateDevice(selectedGym.id, deviceId, (device) => ({
      ...device,
      settingsDefinitions: [...device.settingsDefinitions, { id: generateId("setting"), name: trimmed }]
    }));

    setNewSettingDrafts((current) => ({ ...current, [deviceId]: "" }));
  }

  function handleSettingNameInputChange(deviceId, settingId, value) {
    setSettingNameDrafts((current) => {
      const forDevice = current[deviceId] ?? {};
      return { ...current, [deviceId]: { ...forDevice, [settingId]: value } };
    });
  }

  function handleSettingNameBlur(deviceId, settingId) {
    if (!selectedGym) {
      setSettingNameDrafts((current) => {
        const forDevice = current[deviceId];

        if (!forDevice || !(settingId in forDevice)) {
          return current;
        }

        const restSettings = { ...forDevice };
        delete restSettings[settingId];
        const next = { ...current };

        if (Object.keys(restSettings).length === 0) {
          delete next[deviceId];
        } else {
          next[deviceId] = restSettings;
        }

        return next;
      });
      return;
    }

    setSettingNameDrafts((current) => {
      const forDevice = current[deviceId];

      if (!forDevice || !(settingId in forDevice)) {
        return current;
      }

      const draftValue = forDevice[settingId];
      const trimmed = draftValue.trim();
      const restSettings = { ...forDevice };
      delete restSettings[settingId];
      const next = { ...current };

      if (Object.keys(restSettings).length === 0) {
        delete next[deviceId];
      } else {
        next[deviceId] = restSettings;
      }

      if (trimmed) {
        updateDevice(selectedGym.id, deviceId, (device) => ({
          ...device,
          settingsDefinitions: device.settingsDefinitions.map((definition) =>
            definition.id === settingId ? { ...definition, name: trimmed } : definition
          )
        }));
      }

      return next;
    });
  }

  function handleRemoveSetting(deviceId, settingId) {
    if (!selectedGym) {
      return;
    }

    updateDevice(selectedGym.id, deviceId, (device) => ({
      ...device,
      settingsDefinitions: device.settingsDefinitions.filter((definition) => definition.id !== settingId),
      exercises: device.exercises.map((exercise) => {
        const values = exercise.settingsValues ?? {};
        const nextEntries = Object.entries(values).reduce((accumulator, [userId, userValues]) => {
          const updatedValues = { ...userValues };
          delete updatedValues[settingId];

          if (Object.keys(updatedValues).length > 0) {
            accumulator.push([userId, updatedValues]);
          }

          return accumulator;
        }, []);
        const nextValues = Object.fromEntries(nextEntries);
        return { ...exercise, settingsValues: nextValues };
      })
    }));

    setSettingNameDrafts((current) => {
      const forDevice = current[deviceId];

      if (!forDevice || !(settingId in forDevice)) {
        return current;
      }

      const restSettings = { ...forDevice };
      delete restSettings[settingId];

      if (Object.keys(restSettings).length === 0) {
        const next = { ...current };
        delete next[deviceId];
        return next;
      }

      return { ...current, [deviceId]: restSettings };
    });
  }

  function handleNewExerciseDraftChange(deviceId, value) {
    setNewExerciseDrafts((current) => ({ ...current, [deviceId]: value }));
  }

  function handleAddExercise(event, deviceId) {
    event.preventDefault();

    if (!selectedGym) {
      return;
    }

    const draftValue = newExerciseDrafts[deviceId] ?? "";
    const trimmed = draftValue.trim();

    if (!trimmed) {
      return;
    }

    updateDevice(selectedGym.id, deviceId, (device) => ({
      ...device,
      exercises: [
        ...device.exercises,
        {
          id: generateId("exercise"),
          name: trimmed,
          settingsValues: {}
        }
      ]
    }));

    setNewExerciseDrafts((current) => ({ ...current, [deviceId]: "" }));
  }

  function handleExerciseNameInputChange(deviceId, exerciseId, value) {
    setExerciseNameDrafts((current) => {
      const forDevice = current[deviceId] ?? {};
      return { ...current, [deviceId]: { ...forDevice, [exerciseId]: value } };
    });
  }

  function handleExerciseNameBlur(deviceId, exerciseId) {
    if (!selectedGym) {
      setExerciseNameDrafts((current) => {
        const forDevice = current[deviceId];

        if (!forDevice || !(exerciseId in forDevice)) {
          return current;
        }

        const restExercises = { ...forDevice };
        delete restExercises[exerciseId];
        const next = { ...current };

        if (Object.keys(restExercises).length === 0) {
          delete next[deviceId];
        } else {
          next[deviceId] = restExercises;
        }

        return next;
      });
      return;
    }

    setExerciseNameDrafts((current) => {
      const forDevice = current[deviceId];

      if (!forDevice || !(exerciseId in forDevice)) {
        return current;
      }

      const draftValue = forDevice[exerciseId];
      const trimmed = draftValue.trim();
      const restExercises = { ...forDevice };
      delete restExercises[exerciseId];
      const next = { ...current };

      if (Object.keys(restExercises).length === 0) {
        delete next[deviceId];
      } else {
        next[deviceId] = restExercises;
      }

      if (trimmed) {
        updateDevice(selectedGym.id, deviceId, (device) => ({
          ...device,
          exercises: device.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, name: trimmed } : exercise
          )
        }));
      }

      return next;
    });
  }

  function handleRemoveExercise(deviceId, exerciseId) {
    if (!selectedGym) {
      return;
    }

    updateDevice(selectedGym.id, deviceId, (device) => {
      if (device.exercises.length <= 1) {
        return device;
      }

      return {
        ...device,
        exercises: device.exercises.filter((exercise) => exercise.id !== exerciseId)
      };
    });

    setExerciseNameDrafts((current) => {
      const forDevice = current[deviceId];

      if (!forDevice || !(exerciseId in forDevice)) {
        return current;
      }

      const restExercises = { ...forDevice };
      delete restExercises[exerciseId];

      if (Object.keys(restExercises).length === 0) {
        const next = { ...current };
        delete next[deviceId];
        return next;
      }

      return { ...current, [deviceId]: restExercises };
    });
  }

  function handleSettingValueChange(deviceId, exerciseId, settingId, value) {
    if (!selectedGym) {
      return;
    }

    updateDevice(selectedGym.id, deviceId, (device) => {
      const exercises = device.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const values = exercise.settingsValues ?? {};
        const userValues = values[activeUserId] ?? {};
        const nextUserValues = { ...userValues };
        const trimmed = value.trim();

        if (trimmed.length === 0) {
          delete nextUserValues[settingId];
        } else {
          nextUserValues[settingId] = value;
        }

        const nextValues = { ...values };

        if (Object.keys(nextUserValues).length === 0) {
          delete nextValues[activeUserId];
        } else {
          nextValues[activeUserId] = nextUserValues;
        }

        return { ...exercise, settingsValues: nextValues };
      });

      const shouldLock = device.settingsLocked || hasRecordedSettings({ ...device, exercises }, activeUserId);

      return {
        ...device,
        exercises,
        settingsLocked: shouldLock
      };
    });
  }

  const adoptableDevices = workspace.deviceLibrary;

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.branding}>
            <span className={styles.brand}>{t("hero.brand")}</span>
            <h1 className={styles.title}>{t("hero.title")}</h1>
            <p className={styles.tagline}>{t("hero.lead")}</p>
          </div>
          <div className={styles.profileBadge}>
            <span className={styles.greeting}>{t("hero.greeting", { name: displayName })}</span>
            <button
              type="button"
              className={`${styles.settingsButton} ${styles.secondaryAction}`}
              onClick={toggleSettings}
              aria-expanded={isSettingsOpen}
              aria-controls="settings-panel"
            >
              {t("settings.toggle")}
            </button>
          </div>
        </div>
      </header>

      {isSettingsOpen ? (
        <section
          className={styles.settingsPanel}
          id="settings-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="settings-title"
        >
          <div className={styles.settingsHeader}>
            <h2 id="settings-title">{t("settings.title")}</h2>
            <button type="button" onClick={closeSettings} className={styles.secondaryAction}>
              {t("settings.close")}
            </button>
          </div>
          <form className={styles.settingsForm} onSubmit={handleProfileSubmit}>
            <label className={styles.field} htmlFor="profile-name">
              <span>{t("profile.label")}</span>
              <input
                id="profile-name"
                type="text"
                value={profileDraft?.name ?? ""}
                onChange={handleProfileDraftChange}
                placeholder={t("profile.placeholder")}
                autoComplete="off"
              />
            </label>
            <p className={styles.settingsHint}>{t("profile.hint")}</p>
            <div className={styles.settingsActions}>
              <button type="submit" className={styles.primaryAction}>
                {t("profile.save")}
              </button>
              <button type="button" onClick={closeSettings} className={styles.secondaryAction}>
                {t("settings.close")}
              </button>
            </div>
          </form>
          <div className={styles.languageSection}>
            <label className={styles.field} htmlFor="language-select">
              <span>{t("settings.languageLabel")}</span>
              <select id="language-select" value={resolvedLanguage} onChange={handleLanguageChange}>
                <option value="de">{t("settings.languages.de")}</option>
              </select>
            </label>
            <p className={styles.settingsHint}>{t("settings.languageHint")}</p>
          </div>
        </section>
      ) : null}

      <main className={styles.main}>
        <section className={styles.manager} aria-labelledby="gym-management">
          <div className={styles.managerHeader}>
            <h2 id="gym-management">{t("management.title")}</h2>
            <p>{t("management.description")}</p>
            <p className={styles.managerSummary}>{gymSummary}</p>
          </div>

          <form className={styles.addForm} onSubmit={handleAddGym}>
            <label className={styles.field} htmlFor="gym-name">
              <span>{t("management.form.label")}</span>
              <input
                id="gym-name"
                name="gym-name"
                type="text"
                value={newGymName}
                onChange={(event) => setNewGymName(event.target.value)}
                placeholder={t("management.form.placeholder")}
                autoComplete="off"
              />
            </label>
            <button type="submit" className={styles.primaryAction}>
              {t("management.form.submit")}
            </button>
          </form>

          <div className={styles.listHeader}>
            <h3>{t("management.list.title")}</h3>
          </div>

          {gyms.length === 0 ? (
            <p className={styles.emptyState}>{t("emptyState")}</p>
          ) : (
            <ul className={styles.gymList}>
              {gyms.map((gym) => {
                const isEditing = editingGym?.id === gym.id;
                const isSelected = selectedGym?.id === gym.id;

                return (
                  <li key={gym.id} className={`${styles.gymCard} ${isSelected ? styles.gymCardSelected : ""}`}>
                    {isEditing ? (
                      <form className={styles.renameForm} onSubmit={handleRenameGym}>
                        <label className={styles.field} htmlFor={`rename-${gym.id}`}>
                          <span>{t("management.renameForm.label")}</span>
                          <input
                            id={`rename-${gym.id}`}
                            type="text"
                            value={editingGym.name}
                            onChange={handleEditingChange}
                            autoFocus
                          />
                        </label>
                        <div className={styles.cardActions}>
                          <button type="submit" className={styles.primaryAction}>
                            {t("management.renameForm.save")}
                          </button>
                          <button type="button" onClick={cancelEditing} className={styles.secondaryAction}>
                            {t("management.renameForm.cancel")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className={styles.cardHeader}>
                          <h4>{gym.name}</h4>
                          <div className={styles.cardActions}>
                            <button type="button" onClick={() => startEditing(gym)} className={styles.secondaryAction}>
                              {t("management.actions.rename")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGym(gym.id)}
                              className={styles.dangerAction}
                            >
                              {t("management.actions.remove")}
                            </button>
                          </div>
                        </div>
                        <div className={styles.cardFooter}>
                          <button
                            type="button"
                            onClick={() => handleSelectGym(gym.id)}
                            className={`${styles.secondaryAction} ${styles.manageButton}`}
                            aria-pressed={isSelected}
                          >
                            {t("management.actions.manage")}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {selectedGym ? (
            <section className={styles.deviceBoard} aria-labelledby="device-management">
              <div className={styles.deviceBoardHeader}>
                <h3 id="device-management">{t("devices.title", { gym: selectedGym.name })}</h3>
                <p>{t("devices.description")}</p>
                <p className={styles.managerSummary}>{deviceSummary}</p>
              </div>

              <div className={styles.deviceForms}>
                <form className={styles.deviceForm} onSubmit={handleCreateDevice}>
                  <h4>{t("devices.create.title")}</h4>
                  <label className={styles.field} htmlFor="device-name">
                    <span>{t("devices.create.deviceNameLabel")}</span>
                    <input
                      id="device-name"
                      type="text"
                      value={deviceDraft.name}
                      onChange={(event) => handleDeviceDraftChange("name", event.target.value)}
                    />
                  </label>
                  <label className={styles.field} htmlFor="device-initial-exercise">
                    <span>{t("devices.create.exerciseNameLabel")}</span>
                    <input
                      id="device-initial-exercise"
                      type="text"
                      value={deviceDraft.exerciseName}
                      onChange={(event) => handleDeviceDraftChange("exerciseName", event.target.value)}
                    />
                  </label>
                  <button type="submit" className={styles.primaryAction}>
                    {t("devices.create.submit")}
                  </button>
                </form>

                <form className={styles.deviceForm} onSubmit={handleAdoptFromLibrary}>
                  <h4>{t("devices.adopt.title")}</h4>
                  {adoptableDevices.length === 0 ? (
                    <p className={styles.deviceHint}>{t("devices.adopt.empty")}</p>
                  ) : (
                    <label className={styles.field} htmlFor="adopt-device-select">
                      <span>{t("devices.adopt.selectLabel")}</span>
                      <select
                        id="adopt-device-select"
                        value={librarySelection}
                        onChange={(event) => setLibrarySelection(event.target.value)}
                      >
                        <option value="">{t("devices.adopt.placeholder")}</option>
                        {adoptableDevices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {t("devices.adopt.optionLabel", { name: device.name, tenant: device.tenantId })}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button type="submit" className={styles.secondaryAction} disabled={!librarySelection}>
                    {t("devices.adopt.submit")}
                  </button>
                </form>
              </div>

              {selectedGym.devices.length === 0 ? (
                <p className={styles.emptyState}>{t("devices.empty")}</p>
              ) : (
                <ul className={styles.deviceList}>
                  {selectedGym.devices.map((device) => {
                    const canEditSettings = !device.published && !device.settingsLocked;
                    const settingsDraft = newSettingDrafts[device.id] ?? "";
                    const exerciseDraft = newExerciseDrafts[device.id] ?? "";
                    const deviceNameValue = deviceNameDrafts[device.id] ?? device.name;
                    const settingDraftValues = settingNameDrafts[device.id] ?? {};
                    const exerciseDraftValues = exerciseNameDrafts[device.id] ?? {};
                    const settingsHint = device.settingsLocked
                      ? t("devices.card.settingsHintLocked")
                      : device.published
                      ? t("devices.card.settingsHintPublished")
                      : t("devices.card.settingsHintEditable");

                    return (
                      <li key={device.id} className={styles.deviceCard}>
                        <div className={styles.deviceHeader}>
                          <div>
                            <h4>{device.name}</h4>
                            <span className={styles.deviceMeta}>
                              {t("devices.card.tenantLabel", { tenant: device.tenantId })}
                            </span>
                          </div>
                          <div className={styles.deviceBadges}>
                            {device.published ? (
                              <span className={styles.deviceBadge}>{t("devices.card.publishedBadge")}</span>
                            ) : null}
                            {device.settingsLocked ? (
                              <span className={styles.deviceBadge}>{t("devices.card.settingsLockedBadge")}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className={styles.deviceNameField}>
                          <label className={styles.field} htmlFor={`device-name-${device.id}`}>
                            <span>{t("devices.card.deviceNameLabel")}</span>
                            <input
                              id={`device-name-${device.id}`}
                              type="text"
                              value={deviceNameValue}
                              onChange={(event) => handleDeviceNameInputChange(device.id, event.target.value)}
                              onBlur={() => handleDeviceNameBlur(device.id)}
                            />
                          </label>
                        </div>

                        <div className={styles.deviceSettingsSection}>
                          <h5>{t("devices.card.settingsSectionTitle")}</h5>
                          <p className={styles.deviceHint}>{settingsHint}</p>
                          {device.settingsDefinitions.length === 0 ? (
                            <p className={styles.deviceHint}>{t("devices.card.noSettingsDefined")}</p>
                          ) : (
                            <ul className={styles.settingsList}>
                              {device.settingsDefinitions.map((definition, index) => (
                                <li key={definition.id} className={styles.settingsListItem}>
                                  <label className={styles.field} htmlFor={`setting-${device.id}-${definition.id}`}>
                                    <span>
                                      {t("devices.card.settingLabel", { index: index + 1 })}
                                    </span>
                                    <input
                                      id={`setting-${device.id}-${definition.id}`}
                                      type="text"
                                      value={settingDraftValues[definition.id] ?? definition.name}
                                      onChange={(event) =>
                                        handleSettingNameInputChange(device.id, definition.id, event.target.value)
                                      }
                                      onBlur={() => handleSettingNameBlur(device.id, definition.id)}
                                      disabled={!canEditSettings}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSetting(device.id, definition.id)}
                                    className={styles.secondaryAction}
                                    disabled={!canEditSettings}
                                  >
                                    {t("devices.card.removeSetting")}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}

                          <form className={styles.inlineForm} onSubmit={(event) => handleAddSetting(event, device.id)}>
                            <label className={styles.field} htmlFor={`new-setting-${device.id}`}>
                              <span>{t("devices.card.newSettingLabel")}</span>
                              <input
                                id={`new-setting-${device.id}`}
                                type="text"
                                value={settingsDraft}
                                onChange={(event) => handleNewSettingDraftChange(device.id, event.target.value)}
                                disabled={!canEditSettings}
                              />
                            </label>
                            <button type="submit" className={styles.secondaryAction} disabled={!canEditSettings}>
                              {t("devices.card.addSetting")}
                            </button>
                          </form>

                          <button
                            type="button"
                            onClick={() => handlePublishDevice(device.id)}
                            className={styles.primaryAction}
                            disabled={device.published}
                          >
                            {t("devices.card.publish")}
                          </button>
                        </div>

                        <div className={styles.exerciseSection}>
                          <h5>{t("devices.card.exercisesTitle")}</h5>
                          <ul className={styles.exerciseList}>
                            {device.exercises.map((exercise, index) => (
                              <li key={exercise.id} className={styles.exerciseItem}>
                                <div className={styles.exerciseHeader}>
                                  <label className={styles.field} htmlFor={`exercise-${device.id}-${exercise.id}`}>
                                    <span>{t("devices.card.exerciseLabel", { index: index + 1 })}</span>
                                    <input
                                      id={`exercise-${device.id}-${exercise.id}`}
                                      type="text"
                                      value={exerciseDraftValues[exercise.id] ?? exercise.name}
                                      onChange={(event) =>
                                        handleExerciseNameInputChange(device.id, exercise.id, event.target.value)
                                      }
                                      onBlur={() => handleExerciseNameBlur(device.id, exercise.id)}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExercise(device.id, exercise.id)}
                                    className={styles.secondaryAction}
                                    disabled={device.exercises.length <= 1}
                                  >
                                    {t("devices.card.removeExercise")}
                                  </button>
                                </div>

                                {device.settingsDefinitions.length === 0 ? (
                                  <p className={styles.deviceHint}>{t("devices.card.noSettingsDefined")}</p>
                                ) : (
                                  <div className={styles.valuesGrid}>
                                    {device.settingsDefinitions.map((definition) => {
                                      const values = exercise.settingsValues?.[activeUserId] ?? {};
                                      const currentValue = values[definition.id] ?? "";

                                      return (
                                        <label
                                          key={definition.id}
                                          className={styles.field}
                                          htmlFor={`value-${device.id}-${exercise.id}-${definition.id}`}
                                        >
                                          <span>{definition.name}</span>
                                          <input
                                            id={`value-${device.id}-${exercise.id}-${definition.id}`}
                                            type="text"
                                            value={currentValue}
                                            onChange={(event) =>
                                              handleSettingValueChange(
                                                device.id,
                                                exercise.id,
                                                definition.id,
                                                event.target.value
                                              )
                                            }
                                          />
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>

                          <form className={styles.inlineForm} onSubmit={(event) => handleAddExercise(event, device.id)}>
                            <label className={styles.field} htmlFor={`new-exercise-${device.id}`}>
                              <span>{t("devices.card.newExerciseLabel")}</span>
                              <input
                                id={`new-exercise-${device.id}`}
                                type="text"
                                value={exerciseDraft}
                                onChange={(event) => handleNewExerciseDraftChange(device.id, event.target.value)}
                              />
                            </label>
                            <button type="submit" className={styles.secondaryAction}>
                              {t("devices.card.addExercise")}
                            </button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}
        </section>
      </main>

      <footer className={styles.footer}>
        <small>{t("footer")}</small>
      </footer>
    </div>
  );
}
