import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styles from "./App.module.css";

const initialGyms = [
  { id: "pulse-arena", name: "Pulse Arena" },
  { id: "iron-haven", name: "Iron Haven" },
  { id: "urban-move", name: "Urban Move Loft" }
];

export const GYM_STORAGE_KEY = "mygym.gyms";

function getStorage() {
  if (typeof globalThis === "undefined") {
    return undefined;
  }

  return globalThis.localStorage ?? undefined;
}

function readStoredGyms() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(GYM_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (
      Array.isArray(parsed) &&
      parsed.every((item) => item && typeof item.id === "string" && typeof item.name === "string")
    ) {
      return parsed;
    }
  } catch (error) {
    const logger = typeof globalThis !== "undefined" ? globalThis.console : undefined;
    logger?.warn("Failed to parse stored gyms", error);
  }

  return null;
}

function createGym(name) {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoApi?.randomUUID) {
    return { id: cryptoApi.randomUUID(), name };
  }

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name
  };
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [gyms, setGyms] = useState(() => readStoredGyms() ?? initialGyms);
  const [newGymName, setNewGymName] = useState("");
  const [editing, setEditing] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    try {
      storage.setItem(GYM_STORAGE_KEY, JSON.stringify(gyms));
    } catch (error) {
      const logger = typeof globalThis !== "undefined" ? globalThis.console : undefined;
      logger?.warn("Failed to persist gyms", error);
    }
  }, [gyms]);

  const focusRotation = t("metrics.focus.values", { returnObjects: true });
  const highlightItems = t("highlights.items", { returnObjects: true });
  const totalGyms = gyms.length;
  const gymSummary = t("management.list.summary", { count: totalGyms });

  function handleAddGym(event) {
    event.preventDefault();
    const trimmed = newGymName.trim();

    if (!trimmed) {
      return;
    }

    setGyms((previous) => [...previous, createGym(trimmed)]);
    setNewGymName("");
  }

  function handleDeleteGym(id) {
    setGyms((previous) => previous.filter((gym) => gym.id !== id));

    setEditing((current) => {
      if (!current || current.id !== id) {
        return current;
      }

      return null;
    });
  }

  function startEditing(gym) {
    setEditing({ id: gym.id, name: gym.name });
  }

  function handleEditingChange(event) {
    const { value } = event.target;
    setEditing((current) => (current ? { ...current, name: value } : current));
  }

  function handleRenameGym(event) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    const trimmed = editing.name.trim();

    if (!trimmed) {
      return;
    }

    setGyms((previous) => previous.map((gym) => (gym.id === editing.id ? { ...gym, name: trimmed } : gym)));
    setEditing(null);
  }

  function cancelEditing() {
    setEditing(null);
  }

  function toggleSettings() {
    setIsSettingsOpen((state) => !state);
  }

  function closeSettings() {
    setIsSettingsOpen(false);
  }

  function handleLanguageChange(event) {
    const { value } = event.target;

    if (!value) {
      return;
    }

    void i18n.changeLanguage(value);
  }

  const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className={styles.appShell}>
      <header className={styles.hero}>
        <div className={styles.topBar}>
          <span className={styles.brand}>{t("hero.brand")}</span>
          <button
            type="button"
            className={`${styles.settingsButton} ${styles.secondaryAction}`}
            onClick={toggleSettings}
            aria-expanded={isSettingsOpen}
            aria-controls="settings-panel"
          >
            {t("settings.toggle")}
          </button>
        </div>
        <div className={styles.heroContent}>
          <p className={styles.subtitle}>{t("hero.subtitle")}</p>
          <h1>{t("hero.title")}</h1>
          <p className={styles.heroLead}>{t("hero.lead")}</p>
        </div>
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt>{t("metrics.active.label")}</dt>
            <dd>{totalGyms}</dd>
          </div>
          <div className={styles.metric}>
            <dt>{t("metrics.focus.label")}</dt>
            <dd>{focusRotation.join(" · ")}</dd>
          </div>
          <div className={styles.metric}>
            <dt>{t("metrics.mindset.label")}</dt>
            <dd>{t("metrics.mindset.value")}</dd>
          </div>
        </dl>
      </header>

      {isSettingsOpen ? (
        <section
          className={styles.settingsPanel}
          id="settings-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="settings-title"
        >
          <div className={styles.settingsHeader}>
            <h2 id="settings-title">{t("settings.title")}</h2>
            <button type="button" onClick={closeSettings} className={styles.secondaryAction}>
              {t("settings.close")}
            </button>
          </div>
          <form className={styles.settingsForm}>
            <label className={styles.field} htmlFor="language-select">
              <span>{t("settings.languageLabel")}</span>
              <select id="language-select" value={resolvedLanguage} onChange={handleLanguageChange}>
                <option value="de">{t("settings.languages.de")}</option>
              </select>
            </label>
            <p className={styles.settingsHint}>{t("settings.languageHint")}</p>
          </form>
        </section>
      ) : null}

      <main className={styles.main}>
        <section className={styles.manager} aria-labelledby="gym-management">
          <div className={styles.managerHeader}>
            <h2 id="gym-management">{t("management.title")}</h2>
            <p>{t("management.description")}</p>
          </div>

          <form className={styles.addForm} onSubmit={handleAddGym}>
            <label className={styles.field} htmlFor="gym-name">
              <span>{t("management.form.label")}</span>
              <input
                id="gym-name"
                name="gym-name"
                type="text"
                value={newGymName}
                onChange={(event) => setNewGymName(event.target.value)}
                placeholder={t("management.form.placeholder")}
                autoComplete="off"
              />
            </label>
            <button type="submit" className={styles.primaryAction}>
              {t("management.form.submit")}
            </button>
          </form>

          <div className={styles.listHeader}>
            <h3>{t("management.list.title")}</h3>
            <p>{gymSummary}</p>
          </div>

          {gyms.length === 0 ? (
            <p className={styles.emptyState}>{t("emptyState")}</p>
          ) : (
            <ul className={styles.gymList}>
              {gyms.map((gym) => {
                const isEditing = editing?.id === gym.id;

                return (
                  <li key={gym.id} className={styles.gymCard}>
                    {isEditing ? (
                      <form className={styles.renameForm} onSubmit={handleRenameGym}>
                        <label className={styles.field} htmlFor={`rename-${gym.id}`}>
                          <span>{t("management.renameForm.label")}</span>
                          <input
                            id={`rename-${gym.id}`}
                            type="text"
                            value={editing.name}
                            onChange={handleEditingChange}
                            autoFocus
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
                              onClick={() => handleDeleteGym(gym.id)}
                              className={styles.dangerAction}
                            >
                              {t("management.actions.remove")}
                            </button>
                          </div>
                        </div>
                        <p className={styles.cardHint}>{t("management.cardHint")}</p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className={styles.highlights} aria-labelledby="focus-highlights">
          <h2 id="focus-highlights">{t("highlights.title")}</h2>
          <ul>
            {highlightItems.map((_, index) => (
              <li key={String(index)}>
                <Trans i18nKey={`highlights.items.${index}`} components={{ strong: <strong /> }} />
              </li>
            ))}
          </ul>
          <p>{t("highlights.closing")}</p>
        </aside>
      </main>

      <footer className={styles.footer}>
        <small>{t("footer")}</small>
      </footer>
    </div>
  );
}
