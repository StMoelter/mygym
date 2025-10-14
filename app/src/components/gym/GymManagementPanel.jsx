import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";

export default function GymManagementPanel({
  gyms,
  selectedGymId,
  gymSummary,
  onAddGym,
  onRenameGym,
  onRemoveGym,
  onSelectGym
}) {
  const { t } = useTranslation();
  const [newGymName, setNewGymName] = useState("");
  const [editingGym, setEditingGym] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = newGymName.trim();

    if (!trimmed) {
      return;
    }

    onAddGym(trimmed);
    setNewGymName("");
  }

  function startEditing(gym) {
    setEditingGym({ id: gym.id, name: gym.name });
  }

  function handleRenameSubmit(event) {
    event.preventDefault();

    if (!editingGym) {
      return;
    }

    const trimmed = editingGym.name.trim();

    if (!trimmed) {
      return;
    }

    onRenameGym(editingGym.id, trimmed);
    setEditingGym(null);
  }

  function handleRenameChange(event) {
    const { value } = event.target;
    setEditingGym((current) => (current ? { ...current, name: value } : current));
  }

  function cancelEditing() {
    setEditingGym(null);
  }

  return (
    <section className={styles.managementSection} aria-labelledby="gym-management">
      <div className={styles.managementIntro}>
        <h2 id="gym-management">{t("management.title")}</h2>
        <p>{t("management.description")}</p>
      </div>

      <form className={styles.managementForm} onSubmit={handleSubmit}>
        <label className={styles.field} htmlFor="new-gym-name">
          <span>{t("management.form.label")}</span>
          <input
            id="new-gym-name"
            type="text"
            value={newGymName}
            placeholder={t("management.form.placeholder")}
            onChange={(event) => setNewGymName(event.target.value)}
          />
        </label>
        <button type="submit" className={styles.primaryAction}>
          {t("management.form.submit")}
        </button>
      </form>

      <div className={styles.managementList}>
        <div className={styles.managementListHeader}>
          <h3>{t("management.list.title")}</h3>
          <p className={styles.managerSummary}>{gymSummary}</p>
        </div>

        {gyms.length === 0 ? (
          <p className={styles.emptyState}>{t("emptyState")}</p>
        ) : (
          <ul className={styles.gymList}>
            {gyms.map((gym) => {
              const isSelected = gym.id === selectedGymId;

              return (
                <li key={gym.id} className={styles.gymCard}>
                  {editingGym?.id === gym.id ? (
                    <form className={styles.renameForm} onSubmit={handleRenameSubmit}>
                      <label className={styles.field} htmlFor={`rename-gym-${gym.id}`}>
                        <span>{t("management.renameForm.label")}</span>
                        <input
                          id={`rename-gym-${gym.id}`}
                          type="text"
                          value={editingGym.name}
                          onChange={handleRenameChange}
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
                            onClick={() => onRemoveGym(gym.id)}
                            className={styles.dangerAction}
                          >
                            {t("management.actions.remove")}
                          </button>
                        </div>
                      </div>
                      <div className={styles.cardFooter}>
                        <button
                          type="button"
                          onClick={() => onSelectGym(gym.id)}
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
      </div>
    </section>
  );
}

GymManagementPanel.propTypes = {
  gyms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedGymId: PropTypes.string,
  gymSummary: PropTypes.string.isRequired,
  onAddGym: PropTypes.func.isRequired,
  onRenameGym: PropTypes.func.isRequired,
  onRemoveGym: PropTypes.func.isRequired,
  onSelectGym: PropTypes.func.isRequired
};
