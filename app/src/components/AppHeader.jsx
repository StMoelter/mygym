import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import styles from "../App.module.css";

export default function AppHeader({ displayName, isSettingsOpen, onToggleSettings }) {
  const { t } = useTranslation();

  return (
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
            onClick={onToggleSettings}
            aria-expanded={isSettingsOpen}
            aria-controls="settings-panel"
          >
            {t("settings.toggle")}
          </button>
        </div>
      </div>
    </header>
  );
}

AppHeader.propTypes = {
  displayName: PropTypes.string.isRequired,
  isSettingsOpen: PropTypes.bool.isRequired,
  onToggleSettings: PropTypes.func.isRequired
};
