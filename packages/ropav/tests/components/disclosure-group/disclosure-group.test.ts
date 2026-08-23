import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import DisclosureGroupFixture from "./fixtures.vue";

const triggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-slot='disclosure-trigger']"),
];
const contentsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-slot='disclosure-content']"),
];
const bareTriggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-testid^='bare-']"),
];

const pressKey = (element: HTMLElement, key: string) =>
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));

describe("DisclosureGroup", () => {
  describe("structure", () => {
    it("exposes its data-slot and BEM block", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);
      const group = container.querySelector("[data-slot='disclosure-group']");

      expect(group).not.toBeNull();
      expect(group).toHaveClass("disclosure-group");

      unmount();
    });

    it("renders a trigger for every disclosure", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);

      expect(triggersIn(container)).toHaveLength(3);
      expect(triggersIn(container).map((trigger) => trigger.textContent?.trim())).toEqual([
        "Trigger one",
        "Trigger two",
        "Trigger three",
      ]);

      unmount();
    });

    it("gives every disclosure a distinct trigger and panel id", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);
      const ids = [
        ...triggersIn(container).map((trigger) => trigger.id),
        ...contentsIn(container).map((content) => content.id),
      ];

      expect(new Set(ids).size).toBe(6);

      unmount();
    });
  });

  describe("expansion", () => {
    it("collapses the open disclosure when only one may be expanded", async () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);
      const [one, two] = triggersIn(container);

      one?.click();
      await nextTick();
      expect(one?.getAttribute("aria-expanded")).toBe("true");

      two?.click();
      await nextTick();
      expect(two?.getAttribute("aria-expanded")).toBe("true");
      expect(one?.getAttribute("aria-expanded")).toBe("false");

      unmount();
    });

    it("keeps disclosures open when several may be expanded", async () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { allowsMultipleExpanded: true },
      });
      const [one, two] = triggersIn(container);

      one?.click();
      await nextTick();
      two?.click();
      await nextTick();

      expect(one?.getAttribute("aria-expanded")).toBe("true");
      expect(two?.getAttribute("aria-expanded")).toBe("true");

      unmount();
    });

    it("starts from defaultExpandedKeys", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { defaultExpandedKeys: ["two"] },
      });

      expect(triggersIn(container).map((trigger) => trigger.getAttribute("aria-expanded"))).toEqual(
        ["false", "true", "false"],
      );

      unmount();
    });

    it("emits expandedChange with the disclosure ids", async () => {
      const onExpandedChange = vi.fn();
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { onExpandedChange },
      });

      triggersIn(container)[2]?.click();
      await nextTick();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["three"]));

      unmount();
    });

    it("honours controlled expandedKeys", async () => {
      const onExpandedChange = vi.fn();
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { expandedKeys: ["one"], onExpandedChange },
      });

      expect(triggersIn(container)[0]?.getAttribute("aria-expanded")).toBe("true");

      triggersIn(container)[1]?.click();
      await nextTick();

      // Single expansion replaces rather than adds, and the caller owns the value, so nothing
      // moves on its own.
      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["two"]));
      expect(triggersIn(container)[0]?.getAttribute("aria-expanded")).toBe("true");
      expect(triggersIn(container)[1]?.getAttribute("aria-expanded")).toBe("false");

      unmount();
    });

    it("reports the change on the disclosure that was pressed too", async () => {
      const onExpandedChange = vi.fn();
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { items: ["one"], onExpandedChange },
      });

      triggersIn(container)[0]?.click();
      await nextTick();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["one"]));

      unmount();
    });
  });

  describe("collapsed panels", () => {
    it("keeps every collapsed panel out of the tab order", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { defaultExpandedKeys: ["one"] },
      });

      expect(contentsIn(container).map((content) => content.getAttribute("hidden"))).toEqual([
        null,
        "until-found",
        "until-found",
      ]);

      unmount();
    });
  });

  describe("keyboard navigation", () => {
    it("moves focus to the next and previous trigger", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);
      const triggers = triggersIn(container);

      triggers[0]?.focus();
      pressKey(triggers[0]!, "ArrowDown");
      expect(document.activeElement).toBe(triggers[1]);

      pressKey(triggers[1]!, "ArrowUp");
      expect(document.activeElement).toBe(triggers[0]);

      unmount();
    });

    it("moves focus to the first and last trigger", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);
      const triggers = triggersIn(container);

      triggers[0]?.focus();
      pressKey(triggers[0]!, "End");
      expect(document.activeElement).toBe(triggers[2]);

      pressKey(triggers[2]!, "Home");
      expect(document.activeElement).toBe(triggers[0]);

      unmount();
    });

    it("stays put at the ends of the list", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);
      const triggers = triggersIn(container);

      triggers[0]?.focus();
      pressKey(triggers[0]!, "ArrowUp");
      expect(document.activeElement).toBe(triggers[0]);

      triggers[2]?.focus();
      pressKey(triggers[2]!, "ArrowDown");
      expect(document.activeElement).toBe(triggers[2]);

      unmount();
    });

    it("keeps every trigger tabbable rather than using a roving tab index", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture);

      expect(triggersIn(container).map((trigger) => trigger.getAttribute("tabindex"))).toEqual([
        "0",
        "0",
        "0",
      ]);

      unmount();
    });

    it("moves focus between bare button triggers too", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { bareTriggers: true },
      });
      const triggers = bareTriggersIn(container);

      expect(triggers).toHaveLength(3);

      triggers[0]?.focus();
      pressKey(triggers[0]!, "ArrowDown");

      expect(document.activeElement).toBe(triggers[1]);

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables every trigger when the group is disabled", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { isDisabled: true },
      });

      expect(triggersIn(container).map((trigger) => trigger.disabled)).toEqual([true, true, true]);

      unmount();
    });

    it("marks the group with data-disabled", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { isDisabled: true },
      });

      expect(container.querySelector("[data-slot='disclosure-group']")).toHaveAttribute(
        "data-disabled",
        "true",
      );

      unmount();
    });

    it("does not expand while the group is disabled", async () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { isDisabled: true },
      });

      triggersIn(container)[0]?.click();
      await nextTick();

      expect(triggersIn(container)[0]?.getAttribute("aria-expanded")).toBe("false");

      unmount();
    });

    it("disables a single disclosure without touching the others", async () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { disabledItem: "two" },
      });
      const triggers = triggersIn(container);

      expect(triggers.map((trigger) => trigger.disabled)).toEqual([false, true, false]);

      triggers[1]?.click();
      await nextTick();
      expect(triggers[1]?.getAttribute("aria-expanded")).toBe("false");

      triggers[0]?.click();
      await nextTick();
      expect(triggers[0]?.getAttribute("aria-expanded")).toBe("true");

      unmount();
    });

    it("skips a disabled trigger when moving focus", () => {
      const { container, unmount } = renderVapor(DisclosureGroupFixture, {
        props: { disabledItem: "two" },
      });
      const triggers = triggersIn(container);

      triggers[0]?.focus();
      pressKey(triggers[0]!, "ArrowDown");

      expect(document.activeElement).toBe(triggers[2]);

      unmount();
    });
  });
});
