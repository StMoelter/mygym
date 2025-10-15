import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";

export default function GymSelectionPanel({ gyms, selectedGymId, onAddGym, onSelectGym }) {
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState("");

  const summary = t("home.list.summary", { count: gyms.length });

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = draftName.trim();

    if (!trimmed) {
      return;
    }

    onAddGym(trimmed);
    setDraftName("");
  }

  return (
    <section className={`${styles.manager} ${styles.viewPanel}`} aria-labelledby="gym-selection">
      <header className={styles.viewHeader}>
        <div className={styles.viewIntro}>
          <p className={styles.viewOverline}>{t("home.overline")}</p>
          <h2 id="gym-selection">{t("home.title")}</h2>
          <p className={styles.viewLead}>{t("home.lead")}</p>
        </div>
      </header>

      <form className={styles.managementForm} onSubmit={handleSubmit}>
        <label className={styles.field} htmlFor="new-gym-name">
          <span>{t("home.create.label")}</span>
          <input
            id="new-gym-name"
            type="text"
            value={draftName}
            placeholder={t("home.create.placeholder")}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>
        <button type="submit" className={styles.primaryAction}>
          {t("home.create.submit")}
        </button>
      </form>

      <div className={styles.managementList}>
        <div className={styles.managementListHeader}>
          <h3>{t("home.list.title")}</h3>
          <p className={styles.managerSummary}>{summary}</p>
        </div>

        {gyms.length === 0 ? (
          <p className={styles.emptyState}>{t("home.list.empty")}</p>
        ) : (
          <ul className={styles.gymList}>
            {gyms.map((gym) => {
              const isLastVisited = gym.id === selectedGymId;
              const deviceSummary = t("home.card.devices", { count: gym.devices.length });

              return (
                <li key={gym.id} className={`${styles.gymCard} ${isLastVisited ? styles.gymCardSelected : ""}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleGroup}>
                      <h4>{gym.name}</h4>
                      <span className={styles.cardMeta}>{deviceSummary}</span>
                      {isLastVisited ? (
                        <span className={styles.statusBadge}>{t("home.card.lastVisited")}</span>
                      ) : null}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        onClick={() => onSelectGym(gym.id)}
                        className={styles.secondaryAction}
                      >
                        {t("home.card.open")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

GymSelectionPanel.propTypes = {
  gyms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      devices: PropTypes.array.isRequired
    })
  ).isRequired,
  selectedGymId: PropTypes.string,
  onAddGym: PropTypes.func.isRequired,
  onSelectGym: PropTypes.func.isRequired
};
