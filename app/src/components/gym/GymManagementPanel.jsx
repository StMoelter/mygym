import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";
import DeviceManagementBoard from "../devices/DeviceManagementBoard.jsx";

export default function GymManagementPanel({
  gym,
  deviceLibrary,
  deviceSummary,
  activeUserId,
  onBack,
  onRenameGym,
  onRemoveGym,
  onCreateDevice,
  onAdoptDevice,
  onRenameDevice,
  onPublishDevice,
  onAddSetting,
  onRenameSetting,
  onRemoveSetting,
  onAddExercise,
  onRenameExercise,
  onRemoveExercise,
  onUpdateSettingValue
}) {
  const { t } = useTranslation();
  const [renameDraft, setRenameDraft] = useState(gym?.name ?? "");

  useEffect(() => {
    setRenameDraft(gym?.name ?? "");
  }, [gym?.id, gym?.name]);

  if (!gym) {
    return null;
  }

  const canRemove = gym.devices.length === 0;

  function handleRenameSubmit(event) {
    event.preventDefault();
    const trimmed = renameDraft.trim();

    if (!trimmed || trimmed === gym.name) {
      return;
    }

    onRenameGym(gym.id, trimmed);
  }

  function handleRemoveGym() {
    if (canRemove) {
      onRemoveGym(gym.id);
    }
  }

  return (
    <section className={`${styles.manager} ${styles.viewPanel}`} aria-labelledby="gym-management">
      <header className={styles.viewHeader}>
        <div className={styles.viewNavigation}>
          <button type="button" className={styles.navigationLink} onClick={onBack}>
            {t("navigation.backToGym")}
          </button>
        </div>
        <div className={styles.viewIntro}>
          <p className={styles.viewOverline}>{t("managementPage.overline")}</p>
          <h2 id="gym-management">{t("managementPage.title", { name: gym.name })}</h2>
          <p className={styles.viewLead}>{t("managementPage.lead")}</p>
        </div>
        <div className={styles.viewActions}>
          <p className={styles.managerSummary}>{deviceSummary}</p>
        </div>
      </header>

      <div className={styles.managementActions}>
        <form className={styles.managementForm} onSubmit={handleRenameSubmit}>
          <label className={styles.field} htmlFor="rename-gym-name">
            <span>{t("managementPage.rename.label")}</span>
            <input
              id="rename-gym-name"
              type="text"
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
            />
          </label>
          <button type="submit" className={styles.primaryAction}>
            {t("managementPage.rename.submit")}
          </button>
        </form>

        <div className={styles.dangerZone}>
          <div>
            <h3>{t("managementPage.delete.title")}</h3>
            <p>{t("managementPage.delete.description")}</p>
            {!canRemove ? <p className={styles.dangerHint}>{t("managementPage.delete.disabledHint")}</p> : null}
          </div>
          <button
            type="button"
            className={styles.dangerAction}
            onClick={handleRemoveGym}
            disabled={!canRemove}
          >
            {t("managementPage.delete.action")}
          </button>
        </div>
      </div>

      <div className={styles.sectionDivider} aria-hidden="true" />

      <div className={styles.managementDevices}>
        <h3 className={styles.managementDevicesTitle}>{t("managementPage.devicesTitle")}</h3>
        <DeviceManagementBoard
          gym={gym}
          deviceLibrary={deviceLibrary}
          activeUserId={activeUserId}
          deviceSummary={deviceSummary}
          onCreateDevice={onCreateDevice}
          onAdoptDevice={onAdoptDevice}
          onRenameDevice={onRenameDevice}
          onPublishDevice={onPublishDevice}
          onAddSetting={onAddSetting}
          onRenameSetting={onRenameSetting}
          onRemoveSetting={onRemoveSetting}
          onAddExercise={onAddExercise}
          onRenameExercise={onRenameExercise}
          onRemoveExercise={onRemoveExercise}
          onUpdateSettingValue={onUpdateSettingValue}
        />
      </div>
    </section>
  );
}

GymManagementPanel.propTypes = {
  gym: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    devices: PropTypes.array.isRequired
  }),
  deviceLibrary: PropTypes.array.isRequired,
  deviceSummary: PropTypes.string.isRequired,
  activeUserId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onRenameGym: PropTypes.func.isRequired,
  onRemoveGym: PropTypes.func.isRequired,
  onCreateDevice: PropTypes.func.isRequired,
  onAdoptDevice: PropTypes.func.isRequired,
  onRenameDevice: PropTypes.func.isRequired,
  onPublishDevice: PropTypes.func.isRequired,
  onAddSetting: PropTypes.func.isRequired,
  onRenameSetting: PropTypes.func.isRequired,
  onRemoveSetting: PropTypes.func.isRequired,
  onAddExercise: PropTypes.func.isRequired,
  onRenameExercise: PropTypes.func.isRequired,
  onRemoveExercise: PropTypes.func.isRequired,
  onUpdateSettingValue: PropTypes.func.isRequired
};
