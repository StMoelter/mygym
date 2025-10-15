import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import styles from "../../App.module.css";
import { formatDateTime } from "../../utils/datetime.js";

function createEmptyLoads(count) {
  return Array.from({ length: count }, () => "");
}

export default function ExerciseSetRecorder({ idPrefix, weightStackCount, entries, onRecord }) {
  const { t, i18n } = useTranslation();
  const lastEntry = entries[0] ?? null;

  const defaultUnit = lastEntry?.unit === "lb" ? "lb" : "kg";
  const unitAbbreviations = useMemo(
    () => ({
      kg: t("gym.training.log.weightUnitAbbreviationKg"),
      lb: t("gym.training.log.weightUnitAbbreviationLb")
    }),
    [t]
  );

  const defaultLoads = useMemo(() => {
    if (!lastEntry) {
      return createEmptyLoads(weightStackCount);
    }

    return Array.from({ length: weightStackCount }, (_, index) => {
      const value = lastEntry.loads?.[index];

      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }

      return "";
    });
  }, [lastEntry, weightStackCount]);

  const defaultRepetitions = lastEntry ? String(lastEntry.repetitions ?? "") : "";

  const [loads, setLoads] = useState(defaultLoads);
  const [repetitions, setRepetitions] = useState(defaultRepetitions);
  const [unit, setUnit] = useState(defaultUnit);

  useEffect(() => {
    setLoads(defaultLoads);
  }, [defaultLoads]);

  useEffect(() => {
    setRepetitions(defaultRepetitions);
  }, [defaultRepetitions]);

  useEffect(() => {
    setUnit(defaultUnit);
  }, [defaultUnit]);

  const lastPerformedText = lastEntry
    ? t("gym.training.log.lastPerformed", {
        timestamp: formatDateTime(lastEntry.performedAt, i18n.language)
      })
    : t("gym.training.log.lastPerformedNever");

  const historyItems = entries.slice(0, 3).map((entry) => {
    const timestamp = formatDateTime(entry.performedAt, i18n.language);
    const entryUnit = entry.unit === "lb" ? "lb" : "kg";
    const weights = (entry.loads ?? [])
      .map((value) =>
        typeof value === "number" && Number.isFinite(value)
          ? value.toLocaleString(i18n.language, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            })
          : ""
      )
      .filter((value) => value.length > 0)
      .join(" / ");

    const unitLabel = unitAbbreviations[entryUnit] ?? unitAbbreviations.kg;

    return {
      id: entry.id,
      label: t("gym.training.log.historyEntry", {
        timestamp,
        repetitions: entry.repetitions,
        weights,
        unit: unitLabel
      })
    };
  });

  function handleSubmit(event) {
    event.preventDefault();
    onRecord(loads, repetitions, unit);
  }

  const resolvedUnit = unit === "lb" ? "lb" : "kg";
  const unitLabel = unitAbbreviations[resolvedUnit] ?? unitAbbreviations.kg;

  return (
    <div className={styles.exerciseLogSection}>
      <p className={styles.lastPerformedLabel}>{lastPerformedText}</p>

      <form className={styles.trainingForm} onSubmit={handleSubmit}>
        <div className={styles.trainingFields}>
          {Array.from({ length: weightStackCount }, (_, index) => (
            <label
              key={`weight-${index}`}
              className={styles.field}
              htmlFor={`${idPrefix}-weight-${index}`}
            >
              <span>
                {t("gym.training.log.weightLabel", {
                  index: index + 1,
                  unit: unitLabel
                })}
              </span>
              <input
                id={`${idPrefix}-weight-${index}`}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                className={styles.numericInput}
                value={loads[index] ?? ""}
                onChange={(event) =>
                  setLoads((previous) => {
                    const next = [...previous];
                    next[index] = event.target.value;
                    return next;
                  })
                }
              />
            </label>
          ))}

          <label className={styles.field} htmlFor={`${idPrefix}-weight-unit`}>
            <span>{t("gym.training.log.weightUnitLabel")}</span>
            <select
              id={`${idPrefix}-weight-unit`}
              value={resolvedUnit}
              onChange={(event) => setUnit(event.target.value === "lb" ? "lb" : "kg")}
            >
              <option value="kg">{t("gym.training.log.weightUnitKg")}</option>
              <option value="lb">{t("gym.training.log.weightUnitLb")}</option>
            </select>
          </label>

          <label className={styles.field} htmlFor={`${idPrefix}-repetitions`}>
            <span>{t("gym.training.log.repetitionsLabel")}</span>
            <input
              id={`${idPrefix}-repetitions`}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className={styles.numericInput}
              value={repetitions}
              onChange={(event) => setRepetitions(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.trainingFormActions}>
          <button type="submit" className={styles.primaryAction}>
            {t("gym.training.log.submit")}
          </button>
        </div>
      </form>

      {historyItems.length > 0 ? (
        <div className={styles.trainingHistorySection}>
          <h6 className={styles.trainingHistoryTitle}>{t("gym.training.log.historyTitle")}</h6>
          <ul className={styles.trainingHistory}>
            {historyItems.map((item) => (
              <li key={item.id} className={styles.trainingHistoryItem}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

ExerciseSetRecorder.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  weightStackCount: PropTypes.number.isRequired,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      performedAt: PropTypes.string.isRequired,
      loads: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
      repetitions: PropTypes.number.isRequired,
      unit: PropTypes.oneOf(["kg", "lb"])
    })
  ).isRequired,
  onRecord: PropTypes.func.isRequired
};
