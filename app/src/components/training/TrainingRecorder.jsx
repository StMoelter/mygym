import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";
import ExerciseSetRecorder from "./ExerciseSetRecorder.jsx";
import { formatDateTime } from "../../utils/datetime.js";

export default function TrainingRecorder({
  gym,
  activeUserId,
  onUpdateSettingValue,
  onRecordExerciseSet,
  onOpenManagement,
  onOpenExerciseInsights
}) {
  const { t, i18n } = useTranslation();

  if (!gym) {
    return null;
  }

  const hasDevices = gym.devices.length > 0;

  return (
    <section className={styles.trainingBoard} aria-labelledby="training-board">
      <div className={styles.trainingBoardHeader}>
        <h3 id="training-board">{t("gym.training.title")}</h3>
        <p>{t("gym.training.description")}</p>
      </div>

      {!hasDevices ? (
        <div className={styles.trainingEmptyState}>
          <p>{t("gym.training.empty")}</p>
          <button type="button" className={styles.primaryAction} onClick={onOpenManagement}>
            {t("gym.training.emptyCta")}
          </button>
        </div>
      ) : (
        <ul className={styles.deviceList}>
          {gym.devices.map((device) => (
            <li key={device.id} className={styles.deviceCard}>
              <header className={styles.deviceHeader}>
                <div>
                  <h4>{device.name}</h4>
                  <div className={styles.deviceMetaList}>
                    <span className={styles.deviceMetaListItem}>
                      {t("devices.card.tenantLabel", { tenant: device.tenantId })}
                    </span>
                    <span className={styles.deviceMetaListItem}>
                      {t("devices.card.weightStackOption", { count: device.weightStackCount ?? 1 })}
                    </span>
                    <span className={styles.deviceMetaListItem}>
                      {(() => {
                        const latestEntry = device.exercises.reduce((latest, exercise) => {
                          const entries =
                            exercise.trainingLog?.[device.tenantId]?.[activeUserId] ?? [];
                          const current = entries[0]?.performedAt;

                          if (!current) {
                            return latest;
                          }

                          const currentTime = Date.parse(current);

                          if (Number.isNaN(currentTime)) {
                            return latest;
                          }

                          if (!latest) {
                            return current;
                          }

                          return Date.parse(latest) < currentTime ? current : latest;
                        }, null);

                        if (!latestEntry) {
                          return t("gym.training.deviceLastPerformedNever");
                        }

                        return t("gym.training.deviceLastPerformed", {
                          timestamp: formatDateTime(latestEntry, i18n.language)
                        });
                      })()}
                    </span>
                  </div>
                </div>
              </header>

              {device.exercises.length === 0 ? null : (
                <ul className={styles.exerciseList}>
                  {device.exercises.map((exercise) => {
                    const tenantValues = exercise.settingsValues?.[device.tenantId] ?? {};
                    const currentValues = tenantValues[activeUserId] ?? {};
                    const trainingEntries =
                      exercise.trainingLog?.[device.tenantId]?.[activeUserId] ?? [];

                    return (
                      <li key={exercise.id} className={styles.exerciseItem}>
                        <div className={styles.exerciseHeader}>
                          <h5>{exercise.name}</h5>
                          <button
                            type="button"
                            className={styles.tertiaryAction}
                            onClick={() =>
                              onOpenExerciseInsights(gym.id, device.id, exercise.id)
                            }
                          >
                            {t("gym.training.log.openInsights")}
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
                                htmlFor={`training-${device.id}-${exercise.id}-${definition.id}`}
                              >
                                <span>{definition.name}</span>
                                <input
                                  id={`training-${device.id}-${exercise.id}-${definition.id}`}
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

                        <ExerciseSetRecorder
                          idPrefix={`set-${device.id}-${exercise.id}`}
                          weightStackCount={device.weightStackCount ?? 1}
                          entries={trainingEntries}
                          onRecord={(loads, repetitions, unit) =>
                            onRecordExerciseSet(
                              gym.id,
                              device.id,
                              exercise.id,
                              loads,
                              repetitions,
                              unit,
                              activeUserId
                            )
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

TrainingRecorder.propTypes = {
  gym: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    devices: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        tenantId: PropTypes.string.isRequired,
        exercises: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            settingsValues: PropTypes.objectOf(PropTypes.object),
            trainingLog: PropTypes.objectOf(
              PropTypes.objectOf(
                PropTypes.arrayOf(
                  PropTypes.shape({
                    id: PropTypes.string.isRequired,
                    performedAt: PropTypes.string.isRequired,
                    loads: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
                    repetitions: PropTypes.number.isRequired,
                    unit: PropTypes.oneOf(["kg", "lb"])
                  })
                )
              )
            )
          })
        ).isRequired,
        weightStackCount: PropTypes.number.isRequired,
        settingsDefinitions: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired
          })
        ).isRequired
      })
    ).isRequired
  }),
  activeUserId: PropTypes.string.isRequired,
  onUpdateSettingValue: PropTypes.func.isRequired,
  onRecordExerciseSet: PropTypes.func.isRequired,
  onOpenManagement: PropTypes.func.isRequired,
  onOpenExerciseInsights: PropTypes.func.isRequired
};
