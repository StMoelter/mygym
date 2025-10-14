import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  DEFAULT_GYMS,
  GYM_STORAGE_KEY,
  readStoredGyms,
  usePersistentGyms
} from "./usePersistentGyms.js";

describe("usePersistentGyms", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
  });

  afterEach(() => {
    globalThis.localStorage?.clear();
  });

  it("returns the default gyms when storage is empty", () => {
    const { result } = renderHook(() => usePersistentGyms());

    expect(result.current.gyms).toEqual(DEFAULT_GYMS);
  });

  it("hydrates gyms from storage", () => {
    const storedGyms = [
      { id: "atlas", name: "Atlas Forge" },
      { id: "zenith", name: "Zenith Performance" }
    ];

    globalThis.localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(storedGyms));

    const { result } = renderHook(() => usePersistentGyms());

    expect(result.current.gyms).toEqual(storedGyms);
  });

  it("persists new gyms to storage", () => {
    const { result } = renderHook(() => usePersistentGyms());

    act(() => {
      result.current.addGym("Summit Strength Club");
    });

    const persisted = JSON.parse(globalThis.localStorage.getItem(GYM_STORAGE_KEY) ?? "[]");

    expect(persisted).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Summit Strength Club" })])
    );
  });

  it("renames gyms and persists the update", () => {
    const storedGyms = [
      { id: "storm", name: "Storm Force" }
    ];

    globalThis.localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(storedGyms));

    const { result } = renderHook(() => usePersistentGyms());

    act(() => {
      result.current.renameGym("storm", "Storm Forge");
    });

    const persisted = readStoredGyms();

    expect(persisted).toEqual([expect.objectContaining({ id: "storm", name: "Storm Forge" })]);
  });
});
