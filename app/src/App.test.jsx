import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import userEvent from "@testing-library/user-event";
import App, { GYM_STORAGE_KEY } from "./App.jsx";
import i18n from "./i18n/config.js";

async function renderApp() {
  let view;

  await act(async () => {
    view = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    );
  });

  return view;
}

describe("App", () => {
  beforeEach(() => {
    if (globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
  });

  afterEach(async () => {
    await i18n.changeLanguage("de");
  });

  it("allows creating a new gym", async () => {
    await renderApp();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/neues gym/i);
    await user.clear(input);
    await user.type(input, "Coast Performance Hub");
    await user.click(screen.getByRole("button", { name: /gym hinzufügen/i }));

    expect(screen.getByRole("heading", { level: 4, name: /coast performance hub/i })).toBeVisible();
    expect(input).toHaveValue("");
  });

  it("supports renaming an existing gym", async () => {
    await renderApp();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: /umbenennen/i })[0]);

    const renameInput = screen.getByLabelText(/gym-namen bearbeiten/i);
    await user.clear(renameInput);
    await user.type(renameInput, "Power District Arena");
    await user.click(screen.getByRole("button", { name: /speichern/i }));

    expect(screen.getByRole("heading", { level: 4, name: /power district arena/i })).toBeVisible();
  });

  it("removes a gym from the list", async () => {
    await renderApp();
    const user = userEvent.setup();

    expect(screen.getByRole("heading", { level: 4, name: /pulse arena/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /entfernen/i })[0]);

    expect(screen.queryByRole("heading", { level: 4, name: /pulse arena/i })).not.toBeInTheDocument();
  });

  it("persists the gym roster to local storage", async () => {
    await renderApp();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/neues gym/i);
    await user.clear(input);
    await user.type(input, "Coast Performance Hub");
    await user.click(screen.getByRole("button", { name: /gym hinzufügen/i }));

    await waitFor(() => {
      const persisted = JSON.parse(globalThis.localStorage.getItem(GYM_STORAGE_KEY) ?? "[]");
      expect(persisted).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Coast Performance Hub" })])
      );
    });
  });

  it("hydrates gyms from previously stored data", async () => {
    const storedGyms = [
      { id: "storm-forge", name: "Storm Forge" },
      { id: "zen-strength", name: "Zen Strength Lab" }
    ];

    globalThis.localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(storedGyms));

    await renderApp();

    expect(screen.getByRole("heading", { level: 4, name: /storm forge/i })).toBeVisible();
    expect(screen.getByRole("heading", { level: 4, name: /zen strength lab/i })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 4, name: /pulse arena/i })).not.toBeInTheDocument();
  });

  it("only exposes German as a selectable language", async () => {
    await renderApp();
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

    await renderApp();

    expect(screen.getByRole("button", { name: /settings/i })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: /gym management/i })).toBeVisible();
  });
});
