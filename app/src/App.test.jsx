import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import i18n from "./i18n/config.js";
import { storageKey, storageVersion } from "./storage/gymStorage.js";

async function renderApp() {
  let view;

  await act(async () => {
    view = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    );
    await Promise.resolve();
  });

  return view;
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("loads gyms from persistent storage", async () => {
    const gyms = [
      { id: "saved-1", name: "Saved Strength Lab" },
      { id: "saved-2", name: "Downtown Powerhouse" }
    ];
    window.localStorage.setItem(
      storageKey(),
      JSON.stringify({ version: storageVersion(), gyms })
    );

    await renderApp();

    expect(screen.getByRole("heading", { level: 4, name: /saved strength lab/i })).toBeVisible();
    expect(screen.getByRole("heading", { level: 4, name: /downtown powerhouse/i })).toBeVisible();
  });

  it("persists gyms to local storage after modifications", async () => {
    await renderApp();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: /entfernen/i })[0]);

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey()));
      expect(stored.version).toBe(storageVersion());
      expect(stored.gyms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Iron Haven" }),
          expect.objectContaining({ name: "Urban Move Loft" })
        ])
      );
      expect(stored.gyms).toHaveLength(2);
    });
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
