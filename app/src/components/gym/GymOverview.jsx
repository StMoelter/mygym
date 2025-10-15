import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";
import TrainingRecorder from "../training/TrainingRecorder.jsx";

export default function GymOverview({
  gym,
  deviceSummary,
  activeUserId,
  onOpenManagement,
  onBackToSelection,
  onUpdateSettingValue,
  onRecordExerciseSet
}) {
  const { t } = useTranslation();

  if (!gym) {
    return null;
  }

  return (
    <section className={`${styles.manager} ${styles.viewPanel}`} aria-labelledby="gym-overview">
      <header className={styles.viewHeader}>
        <div className={styles.viewNavigation}>
          <button type="button" className={styles.navigationLink} onClick={onBackToSelection}>
            {t("navigation.backToGyms")}
          </button>
        </div>
        <div className={styles.viewIntro}>
          <p className={styles.viewOverline}>{t("gym.overview.overline")}</p>
          <h2 id="gym-overview">{gym.name}</h2>
          <p className={styles.viewLead}>{t("gym.overview.lead")}</p>
        </div>
        <div className={styles.viewActions}>
          <p className={styles.managerSummary}>{deviceSummary}</p>
          <button type="button" className={styles.secondaryAction} onClick={onOpenManagement}>
            {t("navigation.openManagement")}
          </button>
        </div>
      </header>

      <TrainingRecorder
        gym={gym}
        activeUserId={activeUserId}
        onUpdateSettingValue={onUpdateSettingValue}
        onRecordExerciseSet={onRecordExerciseSet}
        onOpenManagement={onOpenManagement}
      />
    </section>
  );
}

GymOverview.propTypes = {
  gym: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    devices: PropTypes.array.isRequired
  }),
  deviceSummary: PropTypes.string.isRequired,
  activeUserId: PropTypes.string.isRequired,
  onOpenManagement: PropTypes.func.isRequired,
  onBackToSelection: PropTypes.func.isRequired,
  onUpdateSettingValue: PropTypes.func.isRequired,
  onRecordExerciseSet: PropTypes.func.isRequired
};
