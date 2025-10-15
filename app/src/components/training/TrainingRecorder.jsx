import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";

export default function TrainingRecorder({ gym, activeUserId, onUpdateSettingValue, onOpenManagement }) {
  const { t } = useTranslation();

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
                  <span className={styles.deviceMeta}>
                    {t("devices.card.tenantLabel", { tenant: device.tenantId })}
                  </span>
                </div>
              </header>

              {device.exercises.length === 0 ? null : (
                <ul className={styles.exerciseList}>
                  {device.exercises.map((exercise) => {
                    const currentValues = exercise.settingsValues?.[activeUserId] ?? {};

                    return (
                      <li key={exercise.id} className={styles.exerciseItem}>
                        <div className={styles.exerciseHeader}>
                          <h5>{exercise.name}</h5>
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
                                  type="text"
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
            settingsValues: PropTypes.objectOf(PropTypes.object)
          })
        ).isRequired,
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
  onOpenManagement: PropTypes.func.isRequired
};
