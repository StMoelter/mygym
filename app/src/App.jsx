import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./App.module.css";
import AppHeader from "./components/AppHeader.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import GymManagementPanel from "./components/gym/GymManagementPanel.jsx";
import GymOverview from "./components/gym/GymOverview.jsx";
import GymSelectionPanel from "./components/gym/GymSelectionPanel.jsx";
import { useWorkspaceActions } from "./hooks/useWorkspaceActions.js";
import { createInitialWorkspace, loadWorkspace, saveWorkspace } from "./storage/gymStorage.js";
import { loadUser, saveUser } from "./storage/userStorage.js";

const initialGyms = [
  { id: "pulse-arena", name: "Pulse Arena" },
  { id: "iron-haven", name: "Iron Haven" },
  { id: "urban-move", name: "Urban Move Loft" }
];

const initialWorkspace = createInitialWorkspace(initialGyms);
const DEFAULT_USER = { id: "primary-user", name: "" };
const DEFAULT_TENANT_ID = "tenant-default";

export default function App() {
  const { t, i18n } = useTranslation();
  const [workspace, setWorkspace] = useState(() => loadWorkspace(initialWorkspace));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState(() => loadUser(DEFAULT_USER));
  const [activeView, setActiveView] = useState("home");

  const gyms = workspace.gyms;
  const selectedGymId = workspace.selectedGymId ?? (gyms[0]?.id ?? null);
  const selectedGym = useMemo(
    () => gyms.find((gym) => gym.id === selectedGymId) ?? null,
    [gyms, selectedGymId]
  );

  const workspaceActions = useWorkspaceActions(setWorkspace, DEFAULT_TENANT_ID);
  const activeUserId = profile?.id ?? DEFAULT_USER.id;

  useLayoutEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  useLayoutEffect(() => {
    saveUser(profile);
  }, [profile]);

  useEffect(() => {
    if ((activeView === "gym" || activeView === "manage") && !selectedGym) {
      setActiveView("home");
    }
  }, [activeView, selectedGym]);

  const deviceSummary = selectedGym
    ? t("devices.summary", { count: selectedGym.devices.length })
    : t("devices.summary", { count: 0 });

  const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;
  const displayName = profile?.name?.trim() ? profile.name : t("profile.defaultName");
  const adoptableDevices = workspace.deviceLibrary;

  const {
    selectGym,
    addGym,
    renameGym,
    removeGym,
    createDevice,
    adoptDeviceFromLibrary,
    renameDevice,
    publishDevice,
    updateWeightStackCount,
    addSetting,
    renameSetting,
    removeSetting,
    addExercise,
    renameExercise,
    removeExercise,
    updateSettingValue
  } = workspaceActions;

  const handleToggleSettings = useCallback(() => {
    setIsSettingsOpen((state) => !state);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleLanguageChange = useCallback(
    (event) => {
      const { value } = event.target;

      if (!value) {
        return;
      }

      void i18n.changeLanguage(value);
    },
    [i18n]
  );

  const handleProfileSave = useCallback((name) => {
    const trimmed = name.trim();

    setProfile((current) => {
      const base = current ?? DEFAULT_USER;
      return { ...base, name: trimmed.length > 0 ? trimmed : "" };
    });
  }, []);

  const handleSelectGym = useCallback(
    (gymId) => {
      selectGym(gymId);
      setActiveView("gym");
    },
    [selectGym]
  );

  const handleAddGym = useCallback(
    (name) => {
      addGym(name);
      setActiveView("gym");
    },
    [addGym]
  );

  const handleOpenManagement = useCallback(() => {
    setActiveView("manage");
  }, []);

  const handleBackToOverview = useCallback(() => {
    setActiveView("gym");
  }, []);

  const handleBackToSelection = useCallback(() => {
    setActiveView("home");
  }, []);

  return (
    <div className={styles.appShell}>
      <AppHeader
        displayName={displayName}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={handleToggleSettings}
      />

      {isSettingsOpen ? (
        <SettingsPanel
          isOpen={isSettingsOpen}
          profile={profile}
          resolvedLanguage={resolvedLanguage}
          onClose={handleCloseSettings}
          onSaveProfile={handleProfileSave}
          onLanguageChange={handleLanguageChange}
        />
      ) : null}

      <main className={styles.content}>
        {activeView === "home" ? (
          <GymSelectionPanel
            gyms={gyms}
            selectedGymId={selectedGymId ?? undefined}
            onAddGym={handleAddGym}
            onSelectGym={handleSelectGym}
          />
        ) : null}

        {activeView === "gym" && selectedGym ? (
          <GymOverview
            gym={selectedGym}
            deviceSummary={deviceSummary}
            activeUserId={activeUserId}
            onOpenManagement={handleOpenManagement}
            onBackToSelection={handleBackToSelection}
            onUpdateSettingValue={updateSettingValue}
          />
        ) : null}

        {activeView === "manage" && selectedGym ? (
          <GymManagementPanel
            gym={selectedGym}
            deviceLibrary={adoptableDevices}
            deviceSummary={deviceSummary}
            activeUserId={activeUserId}
            onBack={handleBackToOverview}
            onRenameGym={renameGym}
            onRemoveGym={removeGym}
            onCreateDevice={createDevice}
            onAdoptDevice={adoptDeviceFromLibrary}
            onRenameDevice={renameDevice}
            onPublishDevice={publishDevice}
            onUpdateWeightStackCount={updateWeightStackCount}
            onAddSetting={addSetting}
            onRenameSetting={renameSetting}
            onRemoveSetting={removeSetting}
            onAddExercise={addExercise}
            onRenameExercise={renameExercise}
            onRemoveExercise={removeExercise}
            onUpdateSettingValue={updateSettingValue}
          />
        ) : null}
      </main>

      <footer className={styles.footer}>
        <small>{t("footer")}</small>
      </footer>
    </div>
  );
}
