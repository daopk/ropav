import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSidebarLayout,
  readSidebarLayout,
  writeSidebarLayout,
} from "@/components/sidebar/sidebar.storage";

const KEY = "ropav:sidebar:app";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("round trip", () => {
  it("restores what it stored", () => {
    writeSidebarLayout("app", false, "20rem");

    expect(readSidebarLayout("app")).toEqual({ isExpanded: false, width: "20rem" });
  });

  it("leaves the width out when there is none to store", () => {
    writeSidebarLayout("app", true);

    expect(JSON.parse(localStorage.getItem(KEY)!)).not.toHaveProperty("w");
    expect(readSidebarLayout("app")).toEqual({ isExpanded: true, width: undefined });
  });

  it("reads nothing where nothing was stored", () => {
    expect(readSidebarLayout("app")).toBeNull();
  });

  it("clears what it stored", () => {
    writeSidebarLayout("app", false);
    clearSidebarLayout("app");

    expect(readSidebarLayout("app")).toBeNull();
  });
});

describe("a store that cannot be trusted", () => {
  it.each([
    ["not json at all", "{"],
    ["a version it does not know", JSON.stringify({ e: true, v: 99 })],
    ["no expanded flag", JSON.stringify({ v: 1 })],
    ["an expanded flag of the wrong type", JSON.stringify({ e: "yes", v: 1 })],
  ])("reads nothing from %s", (_label, raw) => {
    localStorage.setItem(KEY, raw);

    expect(readSidebarLayout("app")).toBeNull();
  });

  it("drops a width that is not a string", () => {
    localStorage.setItem(KEY, JSON.stringify({ e: true, v: 1, w: 240 }));

    expect(readSidebarLayout("app")).toEqual({ isExpanded: true, width: undefined });
  });

  /*
   * Safari's private mode raises on access rather than merely failing, so a guard that only
   * wrapped the write would still throw on the way in.
   */
  it("survives a store that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(() => writeSidebarLayout("app", true, "16rem")).not.toThrow();
    expect(readSidebarLayout("app")).toBeNull();
  });
});
