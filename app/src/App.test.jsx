import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import i18n from "./i18n/config.js";
import { storageKey, storageVersion } from "./storage/gymStorage.js";
import {
  storageKey as userStorageKey,
  storageVersion as userStorageVersion
} from "./storage/userStorage.js";

let consoleErrorSpy;
let consoleWarnSpy;

function renderApp() {
  let view;

  act(() => {
    view = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    );
  });

  return view;
}

async function openGym(user, gymName = "Pulse Arena") {
  const cardHeading = await screen.findByRole("heading", { level: 4, name: new RegExp(gymName, "i") });
  const card = cardHeading.closest("li");
  expect(card).not.toBeNull();

  if (card) {
    await user.click(within(card).getByRole("button", { name: /gym öffnen/i }));
  }
}

async function openManagement(user, gymName = "Pulse Arena") {
  await openGym(user, gymName);
  await user.click(screen.getByRole("button", { name: /gym verwalten/i }));
}

describe("App", () => {
  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(globalThis.console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(globalThis.console, "warn").mockImplementation(() => {});
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(async () => {
    await i18n.changeLanguage("de");
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("shows the gym selection and lets users create a new gym", async () => {
    renderApp();
    const user = userEvent.setup();

    expect(screen.getByRole("heading", { level: 2, name: /starte mit einem gym/i })).toBeVisible();

    const input = screen.getByLabelText(/neues gym/i);
    await user.clear(input);
    await user.type(input, "Coast Performance Hub");
    await user.click(screen.getByRole("button", { name: /gym hinzufügen/i }));

    expect(screen.getByRole("heading", { level: 2, name: /coast performance hub/i })).toBeVisible();
  });

  it("supports renaming an existing gym from the management view", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    const renameInput = screen.getByLabelText(/gym-name/i);
    await user.clear(renameInput);
    await user.type(renameInput, "Power District Arena");
    await user.click(screen.getByRole("button", { name: /name aktualisieren/i }));

    expect(screen.getByRole("heading", { level: 2, name: /verwalte power district arena/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));
    expect(screen.getByRole("heading", { level: 2, name: /power district arena/i })).toBeVisible();
  });

  it("blocks deleting gyms that still contain devices", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    await user.type(screen.getByLabelText(/gerätename/i), "Row Machine");
    await user.type(screen.getByLabelText(/erste übung/i), "Seated row");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    const deleteButton = screen.getByRole("button", { name: /gym endgültig löschen/i });
    expect(deleteButton).toBeDisabled();
  });

  it("allows deleting a gym without devices", async () => {
    renderApp();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/neues gym/i);
    await user.type(input, "Minimal Studio");
    await user.click(screen.getByRole("button", { name: /gym hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur standortauswahl/i }));
    await openManagement(user, "Minimal Studio");

    const deleteButton = screen.getByRole("button", { name: /gym endgültig löschen/i });
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);
    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));
    await user.click(screen.getByRole("button", { name: /zur standortauswahl/i }));

    expect(screen.queryByRole("heading", { level: 4, name: /minimal studio/i })).not.toBeInTheDocument();
  });

  it("loads gyms from persistent storage", async () => {
    const workspace = {
      gyms: [
        { id: "saved-1", name: "Saved Strength Lab", devices: [] },
        { id: "saved-2", name: "Downtown Powerhouse", devices: [] }
      ],
      deviceLibrary: [],
      selectedGymId: "saved-1"
    };
    window.localStorage.setItem(
      storageKey(),
      JSON.stringify({ version: storageVersion(), workspace })
    );

    renderApp();

    expect(screen.getByRole("heading", { level: 4, name: /saved strength lab/i })).toBeVisible();
    expect(screen.getByRole("heading", { level: 4, name: /downtown powerhouse/i })).toBeVisible();
  });

  it("persists gym changes to local storage", async () => {
    renderApp();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/neues gym/i);
    await user.type(input, "Transient Studio");
    await user.click(screen.getByRole("button", { name: /gym hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur standortauswahl/i }));
    await openManagement(user, "Transient Studio");
    await user.click(screen.getByRole("button", { name: /gym endgültig löschen/i }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey()));
      expect(stored.version).toBe(storageVersion());
      expect(stored.workspace.gyms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Pulse Arena" }),
          expect.objectContaining({ name: "Iron Haven" }),
          expect.objectContaining({ name: "Urban Move Loft" })
        ])
      );
    });
  });

  it("allows creating a device with an initial exercise", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    const deviceNameInput = screen.getByLabelText(/gerätename/i);
    const exerciseInput = screen.getByLabelText(/erste übung/i);

    await user.type(deviceNameInput, "Lat Pulldown");
    await user.type(exerciseInput, "Wide grip pulldown");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    expect(screen.getByRole("heading", { level: 4, name: /lat pulldown/i })).toBeVisible();
    expect(screen.getByLabelText(/übung 1/i)).toHaveValue("Wide grip pulldown");
  });

  it("records exercise sets for a device and prefills the last values", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    const deviceNameInput = screen.getByLabelText(/gerätename/i);
    const exerciseInput = screen.getByLabelText(/erste übung/i);

    await user.type(deviceNameInput, "Leg Press");
    await user.type(exerciseInput, "Single set");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));

    const weightInput = await screen.findByLabelText(/gewichtsblock 1/i);
    const unitSelect = screen.getByLabelText(/gewichtseinheit/i);
    const repetitionsInput = screen.getByLabelText(/wiederholungen/i);

    expect(unitSelect).toHaveValue("kg");

    await user.clear(weightInput);
    await user.type(weightInput, "50");
    await user.clear(repetitionsInput);
    await user.type(repetitionsInput, "12");
    await user.click(screen.getByRole("button", { name: /satz speichern/i }));

    expect(await screen.findByText(/letzter satz:/i)).toBeVisible();
    expect(screen.getAllByText(/zuletzt trainiert:/i).length).toBeGreaterThan(0);

    const historyEntry = await screen.findByText(/12 wdh\./i);
    expect(historyEntry).toHaveTextContent(/50/);
    expect(historyEntry).toHaveTextContent(/kg/i);

    expect(weightInput).toHaveValue(50);
    expect(repetitionsInput).toHaveValue(12);

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey()));
      expect(stored).not.toBeNull();

      const storedGym = stored.workspace.gyms.find((gym) => gym.name === "Pulse Arena");
      expect(storedGym).toBeTruthy();

      const storedDevice = storedGym.devices.find((device) => device.name === "Leg Press");
      expect(storedDevice).toBeTruthy();

      const storedExercise = storedDevice?.exercises[0];
      expect(storedExercise).toBeTruthy();

      const storedEntry =
        storedExercise?.trainingLog?.["tenant-default"]?.["primary-user"]?.[0];
      expect(storedEntry).toBeTruthy();
      expect(storedEntry.unit).toBe("kg");
    });
  });

  it("lets coaches switch the weight unit for exercise sets", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    const deviceNameInput = screen.getByLabelText(/gerätename/i);
    const exerciseInput = screen.getByLabelText(/erste übung/i);

    await user.type(deviceNameInput, "Cable Tower");
    await user.type(exerciseInput, "Face pull");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));

    const weightInput = await screen.findByLabelText(/gewichtsblock 1/i);
    const unitSelect = screen.getByLabelText(/gewichtseinheit/i);
    const repetitionsInput = screen.getByLabelText(/wiederholungen/i);

    await user.selectOptions(unitSelect, "lb");
    await user.clear(weightInput);
    await user.type(weightInput, "110");
    await user.clear(repetitionsInput);
    await user.type(repetitionsInput, "8");
    await user.click(screen.getByRole("button", { name: /satz speichern/i }));

    const historyEntry = await screen.findByText(/8 wdh\./i);
    expect(historyEntry).toHaveTextContent(/110/);
    expect(historyEntry).toHaveTextContent(/lb/i);

    expect(weightInput).toHaveValue(110);
    expect(repetitionsInput).toHaveValue(8);
    expect(unitSelect).toHaveValue("lb");

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey()));
      expect(stored).not.toBeNull();

      const storedGym = stored.workspace.gyms.find((gym) => gym.name === "Pulse Arena");
      expect(storedGym).toBeTruthy();

      const storedDevice = storedGym.devices.find((device) => device.name === "Cable Tower");
      expect(storedDevice).toBeTruthy();

      const storedExercise = storedDevice?.exercises[0];
      expect(storedExercise).toBeTruthy();

      const storedEntry =
        storedExercise?.trainingLog?.["tenant-default"]?.["primary-user"]?.[0];
      expect(storedEntry).toBeTruthy();
      expect(storedEntry.unit).toBe("lb");
    });
  });

  it("allows adopting a device from the library into another gym", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");
    await user.type(screen.getByLabelText(/gerätename/i), "Chest Press");
    await user.type(screen.getByLabelText(/erste übung/i), "Bench press");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));
    await user.click(screen.getByRole("button", { name: /zur standortauswahl/i }));
    await openManagement(user, "Iron Haven");

    const select = screen.getByLabelText(/gerätebibliothek/i);
    await user.selectOptions(select, screen.getByRole("option", { name: /chest press/i }));
    await user.click(screen.getByRole("button", { name: /übernehmen/i }));

    expect(screen.getByRole("heading", { level: 4, name: /chest press/i })).toBeVisible();
  });

  it("locks device settings after values are recorded", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    await user.type(screen.getByLabelText(/gerätename/i), "Row Machine");
    await user.type(screen.getByLabelText(/erste übung/i), "Seated row");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.type(screen.getByLabelText(/neue einstellung/i), "Sitzhöhe");
    await user.click(screen.getByRole("button", { name: /einstellung hinzufügen/i }));

    const valueInput = screen.getByLabelText(/sitzhöhe/i);
    await user.type(valueInput, "4");

    expect(screen.getByLabelText(/neue einstellung/i)).toBeDisabled();
    const settingsItem = screen.getByLabelText(/einstellung 1/i).closest("li");
    expect(settingsItem).not.toBeNull();
    if (settingsItem) {
      expect(within(settingsItem).getByRole("button", { name: /entfernen/i })).toBeDisabled();
    }

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey()));
      expect(stored).not.toBeNull();

      const storedGym = stored.workspace.gyms.find((gym) => gym.name === "Pulse Arena");
      expect(storedGym).toBeTruthy();

      const storedDevice = storedGym.devices.find((device) => device.name === "Row Machine");
      expect(storedDevice).toBeTruthy();

      const storedExercise = storedDevice.exercises[0];
      const tenantValues = storedExercise.settingsValues["tenant-default"];
      expect(tenantValues).toBeTruthy();

      const userValues = tenantValues["primary-user"];
      expect(userValues).toBeTruthy();
      expect(Object.values(userValues)).toContain("4");
    });
  });

  it("lets managers configure weight stacks per device", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    await user.type(screen.getByLabelText(/gerätename/i), "Dual Press");
    await user.type(screen.getByLabelText(/erste übung/i), "Dual-arm press");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    const weightSelect = screen.getAllByLabelText(/gewichtsblöcke/i)[0];
    expect(weightSelect).toHaveValue("1");

    await user.selectOptions(weightSelect, "2");

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));

    const deviceCard = await screen.findByRole("heading", { level: 4, name: /dual press/i });
    const card = deviceCard.closest("li");
    expect(card).not.toBeNull();
    if (card) {
      expect(within(card).getByText(/2 gewichtsblöcke/i)).toBeVisible();
    }
  });

  it("prevents removing the last exercise of a device", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    await user.type(screen.getByLabelText(/gerätename/i), "Cable Tower");
    await user.type(screen.getByLabelText(/erste übung/i), "Face pull");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    const exerciseItem = screen.getByLabelText(/übung 1/i).closest("li");
    expect(exerciseItem).not.toBeNull();
    if (exerciseItem) {
      expect(within(exerciseItem).getByRole("button", { name: /entfernen/i })).toBeDisabled();
    }
  });

  it("sorts gyms by the most recent recorded session", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Iron Haven");

    await user.type(screen.getByLabelText(/gerätename/i), "Leg Extension");
    await user.type(screen.getByLabelText(/erste übung/i), "Extensions");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));

    const weightInput = await screen.findByLabelText(/gewichtsblock 1/i);
    const repetitionsInput = screen.getByLabelText(/wiederholungen/i);

    await user.clear(weightInput);
    await user.type(weightInput, "45");
    await user.clear(repetitionsInput);
    await user.type(repetitionsInput, "10");
    await user.click(screen.getByRole("button", { name: /satz speichern/i }));

    await user.click(screen.getByRole("button", { name: /zur standortauswahl/i }));

    const gymHeadings = await screen.findAllByRole("heading", { level: 4 });
    expect(gymHeadings[0]).toHaveTextContent(/iron haven/i);
    expect(gymHeadings[1]).toHaveTextContent(/pulse arena/i);
  });

  it("provides a user exercise overview with filter and insights", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    await user.type(screen.getByLabelText(/gerätename/i), "Cable Row");
    await user.type(screen.getByLabelText(/erste übung/i), "Seated row");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));

    const weightInput = await screen.findByLabelText(/gewichtsblock 1/i);
    const repetitionsInput = screen.getByLabelText(/wiederholungen/i);

    await user.clear(weightInput);
    await user.type(weightInput, "52");
    await user.clear(repetitionsInput);
    await user.type(repetitionsInput, "12");
    await user.click(screen.getByRole("button", { name: /satz speichern/i }));

    await user.click(screen.getByRole("button", { name: /übungsübersicht/i }));

    expect(
      await screen.findByRole("heading", { level: 2, name: /deine dokumentierten übungen/i })
    ).toBeVisible();

    const filterInput = screen.getByLabelText(/einträge filtern/i);
    await user.type(filterInput, "row");

    const exerciseButton = await screen.findByRole("button", { name: /seated row/i });
    await user.click(exerciseButton);

    expect(await screen.findByText(/letzter satz am/i)).toBeVisible();
    expect(screen.getByText(/bestleistung: 52 kg/i)).toBeVisible();

    await user.clear(filterInput);
    await user.type(filterInput, "unbekannt");
    expect(await screen.findByText(/keine übungen passen/i)).toBeVisible();
  });

  it("opens the training overview from an exercise insight shortcut", async () => {
    renderApp();
    const user = userEvent.setup();

    await openManagement(user, "Pulse Arena");

    await user.type(screen.getByLabelText(/gerätename/i), "Dual Cable");
    await user.type(screen.getByLabelText(/erste übung/i), "Face pull");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getByRole("button", { name: /zur trainingsübersicht/i }));

    const weightInput = await screen.findByLabelText(/gewichtsblock 1/i);
    const repetitionsInput = screen.getByLabelText(/wiederholungen/i);

    await user.clear(weightInput);
    await user.type(weightInput, "18");
    await user.clear(repetitionsInput);
    await user.type(repetitionsInput, "15");
    await user.click(screen.getByRole("button", { name: /satz speichern/i }));

    const exerciseHeading = await screen.findByRole("heading", { level: 5, name: /face pull/i });
    const exerciseItem = exerciseHeading.closest("li");
    expect(exerciseItem).not.toBeNull();

    if (exerciseItem) {
      await user.click(within(exerciseItem).getByRole("button", { name: /details anzeigen/i }));
    }

    expect(
      await screen.findByRole("heading", { level: 2, name: /deine dokumentierten übungen/i })
    ).toBeVisible();
    expect(await screen.findByText(/letzter satz am/i)).toBeVisible();
  });

  it("only exposes German as a selectable language", async () => {
    renderApp();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /einstellungen/i }));

    const languageSelect = screen.getByLabelText(/app-sprache/i);
    const options = within(languageSelect).getAllByRole("option");

    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(/deutsch/i);
  });

  it("renders English copy when the locale switches", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });

    renderApp();

    expect(screen.getByRole("button", { name: /settings/i })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: /pick where to train/i })).toBeVisible();
  });

  it("shows the default profile name in the greeting", async () => {
    renderApp();

    expect(screen.getByText(/willkommen zurück, coach/i)).toBeVisible();
  });

  it("allows updating the profile name and persists it", async () => {
    renderApp();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /einstellungen/i }));

    const profileInput = screen.getByLabelText(/profilname/i);
    await user.clear(profileInput);
    await user.type(profileInput, "Alex");
    await user.click(screen.getByRole("button", { name: /name speichern/i }));

    expect(screen.getByText(/willkommen zurück, alex/i)).toBeVisible();

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(userStorageKey()));
      expect(stored.version).toBe(userStorageVersion());
      expect(stored.user).toEqual(
        expect.objectContaining({
          id: "primary-user",
          name: "Alex"
        })
      );
    });
  });
});
