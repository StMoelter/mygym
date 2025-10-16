import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";
import { describeEntry, formatLoads } from "../../utils/trainingStats.js";
import { formatDateTime } from "../../utils/datetime.js";

function mapUnitAbbreviations(t) {
  return {
    kg: t("gym.training.log.weightUnitAbbreviationKg"),
    lb: t("gym.training.log.weightUnitAbbreviationLb")
  };
}

export default function UserTrainingOverview({
  summaries,
  selectedExerciseKey,
  onSelectExercise,
  onBackToGyms,
  onOpenGym,
  currentGymId,
  currentGymName
}) {
  const { t, i18n } = useTranslation();
  const unitAbbreviations = useMemo(() => mapUnitAbbreviations(t), [t]);
  const [filter, setFilter] = useState("");

  const filteredSummaries = useMemo(() => {
    if (!filter.trim()) {
      return summaries;
    }

    const normalisedFilter = filter.trim().toLowerCase();

    return summaries.filter((summary) => {
      const haystack = `${summary.exerciseName} ${summary.deviceName} ${summary.gymName}`.toLowerCase();
      return haystack.includes(normalisedFilter);
    });
  }, [filter, summaries]);

  useEffect(() => {
    if (selectedExerciseKey || filteredSummaries.length === 0) {
      return;
    }

    onSelectExercise(filteredSummaries[0].key);
  }, [filteredSummaries, onSelectExercise, selectedExerciseKey]);

  const activeSummary = useMemo(() => {
    if (!selectedExerciseKey) {
      return null;
    }

    return (
      filteredSummaries.find((summary) => summary.key === selectedExerciseKey) ??
      summaries.find((summary) => summary.key === selectedExerciseKey) ??
      null
    );
  }, [filteredSummaries, selectedExerciseKey, summaries]);

  const listSummary = t("userOverview.summary", { count: filteredSummaries.length });

  const detailHeader = activeSummary
    ? t("userOverview.detail.title", { exercise: activeSummary.exerciseName })
    : t("userOverview.detail.emptyTitle");

  const detailSubtitle = activeSummary
    ? `${activeSummary.gymName} · ${activeSummary.deviceName}`
    : t("userOverview.detail.emptySubtitle");

  const lastEntry = activeSummary?.entries[0] ?? null;
  const personalBestEntry = activeSummary?.personalBestEntry ?? null;
  const recentEntries = activeSummary ? activeSummary.entries.slice(0, 5) : [];

  const lastPerformedLabel = lastEntry
    ? t("userOverview.detail.lastPerformed", {
        timestamp: formatDateTime(lastEntry.performedAt, i18n.language),
        weights: formatLoads(lastEntry.loads, i18n.language),
        unit: unitAbbreviations[lastEntry.unit === "lb" ? "lb" : "kg"]
      })
    : t("userOverview.detail.lastPerformedNever");

  const personalBestLabel = personalBestEntry
    ? t("userOverview.detail.personalBest", {
        weights: formatLoads(personalBestEntry.loads, i18n.language),
        unit: unitAbbreviations[personalBestEntry.unit === "lb" ? "lb" : "kg"]
      })
    : null;

  const historyItems = recentEntries
    .map((entry) => describeEntry(entry, i18n.language, t, unitAbbreviations))
    .filter(Boolean);

  const setCountLabel = activeSummary
    ? t("userOverview.detail.setCount", { count: activeSummary.entries.length })
    : null;

  return (
    <section className={`${styles.manager} ${styles.viewPanel}`} aria-labelledby="user-training-overview">
      <header className={styles.viewHeader}>
        <div className={styles.viewNavigation}>
          <button type="button" className={styles.navigationLink} onClick={onBackToGyms}>
            {t("navigation.backToGyms")}
          </button>
        </div>
        <div className={styles.viewIntro}>
          <p className={styles.viewOverline}>{t("userOverview.overline")}</p>
          <h2 id="user-training-overview">{t("userOverview.title")}</h2>
          <p className={styles.viewLead}>{t("userOverview.lead")}</p>
        </div>
        <div className={styles.viewActions}>
          {currentGymId ? (
            <button type="button" className={styles.secondaryAction} onClick={() => onOpenGym(currentGymId)}>
              {t("userOverview.openCurrentGym", { name: currentGymName ?? "" })}
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.userOverviewLayout}>
        <div className={styles.userOverviewList}>
          <div className={styles.userOverviewListHeader}>
            <h3>{t("userOverview.listTitle")}</h3>
            <p className={styles.managerSummary}>{listSummary}</p>
          </div>

          <label className={styles.field} htmlFor="user-overview-filter">
            <span>{t("userOverview.filterLabel")}</span>
            <input
              id="user-overview-filter"
              type="search"
              value={filter}
              placeholder={t("userOverview.filterPlaceholder")}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>

          {filteredSummaries.length === 0 ? (
            <p className={styles.emptyState}>{t("userOverview.empty")}</p>
          ) : (
            <ul className={styles.userExerciseList}>
              {filteredSummaries.map((summary) => {
                const isSelected = summary.key === selectedExerciseKey;
                const lastPerformed = formatDateTime(summary.lastPerformedAt, i18n.language);

                return (
                  <li key={summary.key}>
                    <button
                      type="button"
                      className={`${styles.userExerciseButton} ${
                        isSelected ? styles.userExerciseButtonActive : ""
                      }`}
                      onClick={() => onSelectExercise(summary.key)}
                    >
                      <span className={styles.userExerciseName}>{summary.exerciseName}</span>
                      <span className={styles.userExerciseMeta}>
                        {summary.gymName} · {summary.deviceName}
                      </span>
                      <span className={styles.userExerciseMeta}>{lastPerformed}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={styles.userOverviewDetail} aria-live="polite">
          <div className={styles.userOverviewDetailHeader}>
            <h3>{detailHeader}</h3>
            <p className={styles.userOverviewDetailSubtitle}>{detailSubtitle}</p>
            {setCountLabel ? <p className={styles.userOverviewDetailSubtitle}>{setCountLabel}</p> : null}
          </div>

          <div className={styles.userOverviewDetailContent}>
            <p className={styles.userOverviewHighlight}>{lastPerformedLabel}</p>
            {personalBestLabel ? <p className={styles.userOverviewHighlight}>{personalBestLabel}</p> : null}

            {historyItems.length > 0 ? (
              <div className={styles.userOverviewHistory}>
                <h4>{t("userOverview.detail.recentSets")}</h4>
                <ul>
                  {historyItems.map((item, index) => (
                    <li key={`history-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeSummary ? (
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => onOpenGym(activeSummary.gymId)}
              >
                {t("userOverview.openGym", { name: activeSummary.gymName })}
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

const summaryShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  gymId: PropTypes.string.isRequired,
  gymName: PropTypes.string.isRequired,
  deviceId: PropTypes.string.isRequired,
  deviceName: PropTypes.string.isRequired,
  exerciseId: PropTypes.string.isRequired,
  exerciseName: PropTypes.string.isRequired,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      performedAt: PropTypes.string.isRequired,
      loads: PropTypes.arrayOf(PropTypes.number),
      repetitions: PropTypes.number.isRequired,
      unit: PropTypes.oneOf(["kg", "lb"])
    })
  ).isRequired,
  lastPerformedAt: PropTypes.string.isRequired,
  weightStackCount: PropTypes.number.isRequired,
  personalBestEntry: PropTypes.shape({
    id: PropTypes.string,
    performedAt: PropTypes.string,
    loads: PropTypes.arrayOf(PropTypes.number),
    repetitions: PropTypes.number,
    unit: PropTypes.oneOf(["kg", "lb"])
  })
});

UserTrainingOverview.propTypes = {
  summaries: PropTypes.arrayOf(summaryShape).isRequired,
  selectedExerciseKey: PropTypes.string,
  onSelectExercise: PropTypes.func.isRequired,
  onBackToGyms: PropTypes.func.isRequired,
  onOpenGym: PropTypes.func.isRequired,
  currentGymId: PropTypes.string,
  currentGymName: PropTypes.string
};
