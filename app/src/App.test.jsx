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

  it("allows creating a new gym", async () => {
    renderApp();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/neuer standort/i);
    await user.clear(input);
    await user.type(input, "Coast Performance Hub");
    await user.click(screen.getByRole("button", { name: /standort hinzufügen/i }));

    expect(screen.getByRole("heading", { level: 4, name: /coast performance hub/i })).toBeVisible();
    expect(input).toHaveValue("");
  });

  it("supports renaming an existing gym", async () => {
    renderApp();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: /umbenennen/i })[0]);

    const renameInput = screen.getByLabelText(/standortnamen bearbeiten/i);
    await user.clear(renameInput);
    await user.type(renameInput, "Power District Arena");
    await user.click(screen.getByRole("button", { name: /speichern/i }));

    expect(screen.getByRole("heading", { level: 4, name: /power district arena/i })).toBeVisible();
  });

  it("removes a gym from the list", async () => {
    renderApp();
    const user = userEvent.setup();

    expect(screen.getByRole("heading", { level: 4, name: /pulse arena/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /entfernen/i })[0]);

    expect(screen.queryByRole("heading", { level: 4, name: /pulse arena/i })).not.toBeInTheDocument();
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

  it("persists gyms to local storage after modifications", async () => {
    renderApp();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: /entfernen/i })[0]);

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey()));
      expect(stored.version).toBe(storageVersion());
      expect(stored.workspace.gyms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Iron Haven" }),
          expect.objectContaining({ name: "Urban Move Loft" })
        ])
      );
      expect(stored.workspace.gyms).toHaveLength(2);
    });
  });

  it("allows creating a device with an initial exercise", async () => {
    renderApp();
    const user = userEvent.setup();

    const deviceNameInput = screen.getByLabelText(/gerätename/i);
    const exerciseInput = screen.getByLabelText(/erste übung/i);

    await user.type(deviceNameInput, "Lat Pulldown");
    await user.type(exerciseInput, "Wide grip pulldown");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    expect(screen.getByRole("heading", { level: 4, name: /lat pulldown/i })).toBeVisible();
    expect(screen.getByLabelText(/übung 1/i)).toHaveValue("Wide grip pulldown");
  });

  it("allows adopting a device from the library into another gym", async () => {
    renderApp();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/gerätename/i), "Chest Press");
    await user.type(screen.getByLabelText(/erste übung/i), "Bench press");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    await user.click(screen.getAllByRole("button", { name: /geräte verwalten/i })[1]);

    const select = screen.getByLabelText(/gerätebibliothek/i);
    await user.selectOptions(select, screen.getByRole("option", { name: /chest press/i }));
    await user.click(screen.getByRole("button", { name: /übernehmen/i }));

    expect(screen.getByRole("heading", { level: 4, name: /chest press/i })).toBeVisible();
  });

  it("locks device settings after values are recorded", async () => {
    renderApp();
    const user = userEvent.setup();

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
  });

  it("prevents removing the last exercise of a device", async () => {
    renderApp();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/gerätename/i), "Cable Tower");
    await user.type(screen.getByLabelText(/erste übung/i), "Face pull");
    await user.click(screen.getByRole("button", { name: /gerät hinzufügen/i }));

    const exerciseItem = screen.getByLabelText(/übung 1/i).closest("li");
    expect(exerciseItem).not.toBeNull();
    if (exerciseItem) {
      expect(within(exerciseItem).getByRole("button", { name: /entfernen/i })).toBeDisabled();
    }
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
    expect(screen.getByRole("heading", { level: 2, name: /gym overview/i })).toBeVisible();
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
