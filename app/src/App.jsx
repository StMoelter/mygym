import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./App.module.css";
import { loadGyms, saveGyms } from "./storage/gymStorage.js";
import { loadUser, saveUser } from "./storage/userStorage.js";

const initialGyms = [
  { id: "pulse-arena", name: "Pulse Arena" },
  { id: "iron-haven", name: "Iron Haven" },
  { id: "urban-move", name: "Urban Move Loft" }
];

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
  const [gyms, setGyms] = useState(() => loadGyms(initialGyms));
  const [newGymName, setNewGymName] = useState("");
  const [editing, setEditing] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState(() => loadUser({ id: "primary-user", name: "" }));
  const [profileDraft, setProfileDraft] = useState(() => loadUser({ id: "primary-user", name: "" }));
  useLayoutEffect(() => {
    saveGyms(gyms);
  }, [gyms]);

  useLayoutEffect(() => {
    saveUser(profile);
  }, [profile]);

  useEffect(() => {
    if (isSettingsOpen) {
      setProfileDraft(profile);
    }
  }, [isSettingsOpen, profile]);
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
  const displayName = profile?.name?.trim() ? profile.name : t("profile.defaultName");

  function handleProfileDraftChange(event) {
    const { value } = event.target;
    setProfileDraft((current) => (current ? { ...current, name: value } : current));
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    const trimmed = profileDraft?.name?.trim() ?? "";
    const nextName = trimmed.length > 0 ? trimmed : "";

    setProfile((current) => {
      const base = current ?? { id: "primary-user", name: "" };
      const updated = { ...base, name: nextName };
      return updated;
    });
  }

  return (
    <div className={styles.appShell}>
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
              onClick={toggleSettings}
              aria-expanded={isSettingsOpen}
              aria-controls="settings-panel"
            >
              {t("settings.toggle")}
            </button>
          </div>
        </div>
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
          <form className={styles.settingsForm} onSubmit={handleProfileSubmit}>
            <label className={styles.field} htmlFor="profile-name">
              <span>{t("profile.label")}</span>
              <input
                id="profile-name"
                type="text"
                value={profileDraft?.name ?? ""}
                onChange={handleProfileDraftChange}
                placeholder={t("profile.placeholder")}
                autoComplete="off"
              />
            </label>
            <p className={styles.settingsHint}>{t("profile.hint")}</p>
            <div className={styles.settingsActions}>
              <button type="submit" className={styles.primaryAction}>
                {t("profile.save")}
              </button>
              <button type="button" onClick={closeSettings} className={styles.secondaryAction}>
                {t("settings.close")}
              </button>
            </div>
          </form>
          <div className={styles.languageSection}>
            <label className={styles.field} htmlFor="language-select">
              <span>{t("settings.languageLabel")}</span>
              <select id="language-select" value={resolvedLanguage} onChange={handleLanguageChange}>
                <option value="de">{t("settings.languages.de")}</option>
              </select>
            </label>
            <p className={styles.settingsHint}>{t("settings.languageHint")}</p>
          </div>
        </section>
      ) : null}

      <main className={styles.main}>
        <section className={styles.manager} aria-labelledby="gym-management">
          <div className={styles.managerHeader}>
            <h2 id="gym-management">{t("management.title")}</h2>
            <p>{t("management.description")}</p>
            <p className={styles.managerSummary}>{gymSummary}</p>
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
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <small>{t("footer")}</small>
      </footer>
    </div>
  );
}
