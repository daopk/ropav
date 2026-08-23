import { afterEach, describe, expect, it } from "vitest";

import { announce } from "@/utils/live-announcer";

const regionFor = (politeness: string): HTMLElement | null =>
  document.querySelector(`[data-slot="live-announcer"][data-politeness="${politeness}"]`);

afterEach(() => {
  for (const region of document.querySelectorAll('[data-slot="live-announcer"]')) region.remove();
});

describe("announce", () => {
  it("writes the message into an assertive region by default", () => {
    announce("saved");

    expect(regionFor("assertive")).toHaveTextContent("saved");
  });

  it("reuses one region per politeness rather than stacking them up", () => {
    announce("first");
    announce("second");

    expect(document.querySelectorAll('[data-slot="live-announcer"]')).toHaveLength(1);
    expect(regionFor("assertive")).toHaveTextContent("second");
  });

  it("clears the region when given an empty string", () => {
    announce("pending");
    announce("");

    expect(regionFor("assertive")).toHaveTextContent("");
  });

  /**
   * Politeness needs its own region, not a rewritten attribute.
   *
   * A drag session announces "started dragging" assertively and then its first drop target
   * politely. With one shared region the polite message would overwrite the assertive one it is
   * supposed to wait for — the exact interruption politeness exists to prevent.
   */
  it("keeps polite messages in a separate region from assertive ones", () => {
    announce("started dragging");
    announce("first target", "polite");

    expect(regionFor("assertive")).toHaveTextContent("started dragging");
    expect(regionFor("polite")).toHaveTextContent("first target");
  });

  it("marks each region with the politeness it carries", () => {
    announce("polite message", "polite");

    expect(regionFor("polite")).toHaveAttribute("aria-live", "polite");
  });
});
