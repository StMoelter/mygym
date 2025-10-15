import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";

export default function DeviceManagementBoard({
  gym,
  deviceLibrary,
  activeUserId,
  deviceSummary,
  onCreateDevice,
  onAdoptDevice,
  onRenameDevice,
  onPublishDevice,
  onUpdateWeightStackCount,
  onAddSetting,
  onRenameSetting,
  onRemoveSetting,
  onAddExercise,
  onRenameExercise,
  onRemoveExercise,
  onUpdateSettingValue
}) {
  const { t } = useTranslation();
  const [deviceDraft, setDeviceDraft] = useState({ name: "", exerciseName: "" });
  const [librarySelection, setLibrarySelection] = useState("");
  const [deviceNameDrafts, setDeviceNameDrafts] = useState({});
  const [newSettingDrafts, setNewSettingDrafts] = useState({});
  const [settingNameDrafts, setSettingNameDrafts] = useState({});
  const [newExerciseDrafts, setNewExerciseDrafts] = useState({});
  const [exerciseNameDrafts, setExerciseNameDrafts] = useState({});

  useEffect(() => {
    setDeviceDraft({ name: "", exerciseName: "" });
    setLibrarySelection("");
    setDeviceNameDrafts({});
    setNewSettingDrafts({});
    setSettingNameDrafts({});
    setNewExerciseDrafts({});
    setExerciseNameDrafts({});
  }, [gym?.id]);

  const adoptableDevices = useMemo(() => deviceLibrary, [deviceLibrary]);

  if (!gym) {
    return null;
  }

  function handleCreateDevice(event) {
    event.preventDefault();
    const trimmedName = deviceDraft.name.trim();
    const trimmedExercise = deviceDraft.exerciseName.trim();

    if (!trimmedName || !trimmedExercise) {
      return;
    }

    onCreateDevice(gym.id, trimmedName, trimmedExercise);
    setDeviceDraft({ name: "", exerciseName: "" });
  }

  function handleAdoptDevice(event) {
    event.preventDefault();
    if (!librarySelection) {
      return;
    }

    onAdoptDevice(gym.id, librarySelection);
    setLibrarySelection("");
  }

  function handleDeviceNameBlur(deviceId) {
    const draftValue = deviceNameDrafts[deviceId];

    if (typeof draftValue !== "string") {
      return;
    }

    setDeviceNameDrafts((current) => {
      const next = { ...current };
      delete next[deviceId];
      return next;
    });

    const trimmed = draftValue.trim();

    if (!trimmed) {
      return;
    }

    onRenameDevice(gym.id, deviceId, trimmed);
  }

  function handleSettingNameBlur(deviceId, settingId) {
    const forDevice = settingNameDrafts[deviceId];

    if (!forDevice || !(settingId in forDevice)) {
      return;
    }

    const draftValue = forDevice[settingId];

    setSettingNameDrafts((current) => {
      const rest = { ...current };
      const updatedForDevice = { ...forDevice };
      delete updatedForDevice[settingId];

      if (Object.keys(updatedForDevice).length === 0) {
        delete rest[deviceId];
      } else {
        rest[deviceId] = updatedForDevice;
      }

      return rest;
    });

    const trimmed = draftValue.trim();

    if (!trimmed) {
      return;
    }

    onRenameSetting(gym.id, deviceId, settingId, trimmed);
  }

  function handleExerciseNameBlur(deviceId, exerciseId) {
    const forDevice = exerciseNameDrafts[deviceId];

    if (!forDevice || !(exerciseId in forDevice)) {
      return;
    }

    const draftValue = forDevice[exerciseId];

    setExerciseNameDrafts((current) => {
      const rest = { ...current };
      const updatedForDevice = { ...forDevice };
      delete updatedForDevice[exerciseId];

      if (Object.keys(updatedForDevice).length === 0) {
        delete rest[deviceId];
      } else {
        rest[deviceId] = updatedForDevice;
      }

      return rest;
    });

    const trimmed = draftValue.trim();

    if (!trimmed) {
      return;
    }

    onRenameExercise(gym.id, deviceId, exerciseId, trimmed);
  }

  return (
    <section className={styles.deviceBoard} aria-labelledby="device-management">
      <div className={styles.deviceBoardHeader}>
        <h3 id="device-management">{t("devices.title", { gym: gym.name })}</h3>
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
              onChange={(event) => setDeviceDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className={styles.field} htmlFor="device-initial-exercise">
            <span>{t("devices.create.exerciseNameLabel")}</span>
            <input
              id="device-initial-exercise"
              type="text"
              value={deviceDraft.exerciseName}
              onChange={(event) =>
                setDeviceDraft((current) => ({ ...current, exerciseName: event.target.value }))
              }
            />
          </label>
          <button type="submit" className={styles.primaryAction}>
            {t("devices.create.submit")}
          </button>
        </form>

        <form className={styles.deviceForm} onSubmit={handleAdoptDevice}>
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

      {gym.devices.length === 0 ? (
        <p className={styles.emptyState}>{t("devices.empty")}</p>
      ) : (
        <ul className={styles.deviceList}>
          {gym.devices.map((device) => {
            const canEditSettings = !device.published && !device.settingsLocked;
            const settingsHint = device.settingsLocked
              ? t("devices.card.settingsHintLocked")
              : device.published
              ? t("devices.card.settingsHintPublished")
              : t("devices.card.settingsHintEditable");
            const deviceNameValue = deviceNameDrafts[device.id] ?? device.name;
            const settingDraftValues = settingNameDrafts[device.id] ?? {};
            const settingsDraft = newSettingDrafts[device.id] ?? "";
            const exerciseDraftValues = exerciseNameDrafts[device.id] ?? {};
            const exerciseDraft = newExerciseDrafts[device.id] ?? "";

            const weightStackCount = device.weightStackCount ?? 1;

            return (
              <li key={device.id} className={styles.deviceCard}>
                <div className={styles.deviceHeader}>
                  <div>
                    <h4>{device.name}</h4>
                    <div className={styles.deviceMetaList}>
                      <span className={styles.deviceMetaListItem}>
                        {t("devices.card.tenantLabel", { tenant: device.tenantId })}
                      </span>
                      <span className={styles.deviceMetaListItem}>
                        {t("devices.card.weightStackOption", { count: weightStackCount })}
                      </span>
                    </div>
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
                      onChange={(event) =>
                        setDeviceNameDrafts((current) => ({ ...current, [device.id]: event.target.value }))
                      }
                      onBlur={() => handleDeviceNameBlur(device.id)}
                    />
                  </label>
                </div>

                <div className={styles.deviceNameField}>
                  <label className={styles.field} htmlFor={`device-weight-stacks-${device.id}`}>
                    <span>{t("devices.card.weightStackLabel")}</span>
                    <select
                      id={`device-weight-stacks-${device.id}`}
                      value={weightStackCount}
                      onChange={(event) =>
                        {
                          const nextValue = Number.parseInt(event.target.value, 10);

                          if (!Number.isNaN(nextValue)) {
                            onUpdateWeightStackCount(gym.id, device.id, nextValue);
                          }
                        }
                      }
                      disabled={device.published || device.settingsLocked}
                    >
                      {[1, 2].map((option) => (
                        <option key={option} value={option}>
                          {t("devices.card.weightStackOption", { count: option })}
                        </option>
                      ))}
                    </select>
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
                            <span>{t("devices.card.settingLabel", { index: index + 1 })}</span>
                            <input
                              id={`setting-${device.id}-${definition.id}`}
                              type="text"
                              value={settingDraftValues[definition.id] ?? definition.name}
                              onChange={(event) =>
                                setSettingNameDrafts((current) => ({
                                  ...current,
                                  [device.id]: {
                                    ...(current[device.id] ?? {}),
                                    [definition.id]: event.target.value
                                  }
                                }))
                              }
                              onBlur={() => handleSettingNameBlur(device.id, definition.id)}
                              disabled={!canEditSettings}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => onRemoveSetting(gym.id, device.id, definition.id)}
                            className={styles.secondaryAction}
                            disabled={!canEditSettings}
                          >
                            {t("devices.card.removeSetting")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    className={styles.inlineForm}
                    onSubmit={(event) => {
                      event.preventDefault();

                      const trimmed = settingsDraft.trim();

                      if (!trimmed || !canEditSettings) {
                        return;
                      }

                      onAddSetting(gym.id, device.id, trimmed);
                      setNewSettingDrafts((current) => ({ ...current, [device.id]: "" }));
                    }}
                  >
                    <label className={styles.field} htmlFor={`new-setting-${device.id}`}>
                      <span>{t("devices.card.newSettingLabel")}</span>
                      <input
                        id={`new-setting-${device.id}`}
                        type="text"
                        value={settingsDraft}
                        onChange={(event) =>
                          setNewSettingDrafts((current) => ({ ...current, [device.id]: event.target.value }))
                        }
                        disabled={!canEditSettings}
                      />
                    </label>
                    <button type="submit" className={styles.secondaryAction} disabled={!canEditSettings}>
                      {t("devices.card.addSetting")}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => onPublishDevice(gym.id, device.id)}
                    className={styles.primaryAction}
                    disabled={device.published}
                  >
                    {t("devices.card.publish")}
                  </button>
                </div>

                <div className={styles.exerciseSection}>
                  <h5>{t("devices.card.exercisesTitle")}</h5>
                  <ul className={styles.exerciseList}>
                    {device.exercises.map((exercise, index) => {
                      const tenantValues = exercise.settingsValues?.[device.tenantId] ?? {};
                      const currentValues = tenantValues[activeUserId] ?? {};

                      return (
                        <li key={exercise.id} className={styles.exerciseItem}>
                          <div className={styles.exerciseHeader}>
                            <label className={styles.field} htmlFor={`exercise-${device.id}-${exercise.id}`}>
                              <span>{t("devices.card.exerciseLabel", { index: index + 1 })}</span>
                              <input
                                id={`exercise-${device.id}-${exercise.id}`}
                                type="text"
                                value={exerciseDraftValues[exercise.id] ?? exercise.name}
                                onChange={(event) =>
                                  setExerciseNameDrafts((current) => ({
                                    ...current,
                                    [device.id]: {
                                      ...(current[device.id] ?? {}),
                                      [exercise.id]: event.target.value
                                    }
                                  }))
                                }
                                onBlur={() => handleExerciseNameBlur(device.id, exercise.id)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => onRemoveExercise(gym.id, device.id, exercise.id)}
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
                          {device.settingsDefinitions.map((definition) => (
                            <label
                              key={definition.id}
                              className={styles.field}
                              htmlFor={`value-${device.id}-${exercise.id}-${definition.id}`}
                            >
                              <span>{definition.name}</span>
                              <input
                                id={`value-${device.id}-${exercise.id}-${definition.id}`}
                                type="number"
                                inputMode="decimal"
                                step="any"
                                className={styles.numericInput}
                                value={currentValues[definition.id] ?? ""}
                                onChange={(event) =>
                                  onUpdateSettingValue(
                                    gym.id,
                                    device.id,
                                    exercise.id,
                                        definition.id,
                                        event.target.value,
                                        activeUserId
                                      )
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <form
                    className={styles.inlineForm}
                    onSubmit={(event) => {
                      event.preventDefault();

                      const trimmed = exerciseDraft.trim();

                      if (!trimmed) {
                        return;
                      }

                      onAddExercise(gym.id, device.id, trimmed);
                      setNewExerciseDrafts((current) => ({ ...current, [device.id]: "" }));
                    }}
                  >
                    <label className={styles.field} htmlFor={`new-exercise-${device.id}`}>
                      <span>{t("devices.card.newExerciseLabel")}</span>
                      <input
                        id={`new-exercise-${device.id}`}
                        type="text"
                        value={exerciseDraft}
                        onChange={(event) =>
                          setNewExerciseDrafts((current) => ({ ...current, [device.id]: event.target.value }))
                        }
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
  );
}

const settingsDefinitionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

const exerciseShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  settingsValues: PropTypes.objectOf(PropTypes.object)
});

DeviceManagementBoard.propTypes = {
  gym: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    devices: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        tenantId: PropTypes.string.isRequired,
        published: PropTypes.bool.isRequired,
        weightStackCount: PropTypes.number.isRequired,
        settingsLocked: PropTypes.bool.isRequired,
        settingsDefinitions: PropTypes.arrayOf(settingsDefinitionShape).isRequired,
        exercises: PropTypes.arrayOf(exerciseShape).isRequired
      })
    ).isRequired
  }),
  deviceLibrary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      tenantId: PropTypes.string.isRequired,
      published: PropTypes.bool,
      weightStackCount: PropTypes.number.isRequired,
      settingsDefinitions: PropTypes.arrayOf(settingsDefinitionShape).isRequired,
      exercises: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired
        })
      ).isRequired
    })
  ).isRequired,
  activeUserId: PropTypes.string.isRequired,
  deviceSummary: PropTypes.string.isRequired,
  onCreateDevice: PropTypes.func.isRequired,
  onAdoptDevice: PropTypes.func.isRequired,
  onRenameDevice: PropTypes.func.isRequired,
  onPublishDevice: PropTypes.func.isRequired,
  onUpdateWeightStackCount: PropTypes.func.isRequired,
  onAddSetting: PropTypes.func.isRequired,
  onRenameSetting: PropTypes.func.isRequired,
  onRemoveSetting: PropTypes.func.isRequired,
  onAddExercise: PropTypes.func.isRequired,
  onRenameExercise: PropTypes.func.isRequired,
  onRemoveExercise: PropTypes.func.isRequired,
  onUpdateSettingValue: PropTypes.func.isRequired
};
