import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../App.module.css";

export default function SettingsPanel({
  isOpen,
  profile,
  resolvedLanguage,
  onClose,
  onSaveProfile,
  onLanguageChange
}) {
  const { t } = useTranslation();
  const [nameDraft, setNameDraft] = useState(profile?.name ?? "");

  useEffect(() => {
    if (isOpen) {
      setNameDraft(profile?.name ?? "");
    }
  }, [isOpen, profile]);

  function handleSubmit(event) {
    event.preventDefault();
    onSaveProfile(nameDraft ?? "");
  }

  return (
    <section
      className={styles.settingsPanel}
      id="settings-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="settings-title"
    >
      <div className={styles.settingsHeader}>
        <h2 id="settings-title">{t("settings.title")}</h2>
        <button type="button" onClick={onClose} className={styles.secondaryAction}>
          {t("settings.close")}
        </button>
      </div>
      <form className={styles.settingsForm} onSubmit={handleSubmit}>
        <label className={styles.field} htmlFor="profile-name">
          <span>{t("profile.label")}</span>
          <input
            id="profile-name"
            type="text"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder={t("profile.placeholder")}
            autoComplete="off"
          />
        </label>
        <p className={styles.settingsHint}>{t("profile.hint")}</p>
        <div className={styles.settingsActions}>
          <button type="submit" className={styles.primaryAction}>
            {t("profile.save")}
          </button>
        </div>
      </form>

      <div className={styles.languageSection}>
        <label className={styles.field} htmlFor="language-select">
          <span>{t("settings.languageLabel")}</span>
          <select id="language-select" value={resolvedLanguage} onChange={onLanguageChange}>
            <option value="de">{t("settings.languages.de")}</option>
          </select>
        </label>
        <p className={styles.settingsHint}>{t("settings.languageHint")}</p>
      </div>
    </section>
  );
}

SettingsPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  profile: PropTypes.shape({
    name: PropTypes.string
  }).isRequired,
  resolvedLanguage: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveProfile: PropTypes.func.isRequired,
  onLanguageChange: PropTypes.func.isRequired
};
