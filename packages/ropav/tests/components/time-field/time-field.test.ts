import { CalendarDateTime, Time } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderTimeField = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props: { locale: "en-US", ...props } });
  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

  return {
    ...result,
    group: () => slot("date-input-group"),
    input: () => slot("date-input-group-input"),
    root: slot("time-field"),
    segment: (type: string) =>
      result.container.querySelector<HTMLElement>(`[data-type='${type}']`)!,

    slot,

    /** The hidden input a form reads, which sits beside the segments inside the group. */
    submitted: () =>
      result.container.querySelector<HTMLInputElement>("[data-slot='date-input-group'] > input")!,
    /** Which parts of a time the field shows, punctuation and bidi marks dropped. */
    types: () =>
      [...result.container.querySelectorAll<HTMLElement>("[data-type]")]
        .map((segment) => segment.dataset["type"])
        .filter((type) => type !== "literal"),
  };
};

describe("TimeField", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const { slot, unmount } = renderTimeField({
        withDescription: true,
        withPrefix: true,
        withSuffix: true,
      });

      expect(slot("time-field")).not.toBeNull();
      expect(slot("label")).not.toBeNull();
      expect(slot("date-input-group")).not.toBeNull();
      expect(slot("date-input-group-prefix")).not.toBeNull();
      expect(slot("date-input-group-input")).not.toBeNull();
      expect(slot("date-input-group-segment")).not.toBeNull();
      expect(slot("date-input-group-suffix")).not.toBeNull();
      expect(slot("description")).not.toBeNull();
      unmount();
    });

    it("shows only the parts of a time", () => {
      // The date the segments are edited through never appears; that is the whole point.
      const { types, unmount } = renderTimeField();

      expect(types()).toEqual(["hour", "minute", "dayPeriod"]);
      unmount();
    });

    it("follows the granularity and the hour cycle", () => {
      expect(renderTimeField({ granularity: "second" }).types()).toEqual([
        "hour",
        "minute",
        "second",
        "dayPeriod",
      ]);
      expect(renderTimeField({ hourCycle: 24 }).types()).toEqual(["hour", "minute"]);
      expect(renderTimeField({ locale: "de-DE" }).types()).toEqual(["hour", "minute"]);
    });
  });

  describe("the value it submits", () => {
    it("submits the time, not the date it travelled as", () => {
      const { submitted, unmount } = renderTimeField({
        defaultValue: new Time(13, 45),
        name: "at",
      });

      expect(submitted()).toHaveAttribute("name", "at");
      expect(submitted().value).toBe("13:45:00");
      unmount();
    });

    it("drops the date from a value that came with one", () => {
      const { submitted, unmount } = renderTimeField({
        defaultValue: new CalendarDateTime(2026, 6, 5, 13, 45),
        name: "at",
      });

      expect(submitted().value).toBe("13:45:00");
      unmount();
    });

    it("submits nothing while it is empty", () => {
      const { submitted, unmount } = renderTimeField({ name: "at" });

      expect(submitted().value).toBe("");
      unmount();
    });
  });

  describe("variants", () => {
    it("applies the group's visual variant", () => {
      expect(renderTimeField().group()).toHaveClass("date-input-group--primary");
      expect(renderTimeField({ variant: "secondary" }).group()).toHaveClass(
        "date-input-group--secondary",
      );
    });

    it("stretches when full width is set as a bare attribute", () => {
      const { group, root, unmount } = renderTimeField({ attributeForm: true });

      expect(root).toHaveClass("time-field--full-width");
      expect(group()).toHaveClass("date-input-group--full-width");
      unmount();
    });
  });

  describe("state", () => {
    it("reports being disabled", () => {
      const { input, root, segment, submitted, unmount } = renderTimeField({ isDisabled: true });

      expect(root).toHaveAttribute("data-disabled", "true");
      expect(input()).toHaveAttribute("aria-disabled", "true");
      expect(segment("hour")).not.toHaveAttribute("tabindex");
      expect(submitted()).toBeDisabled();
      unmount();
    });

    it("reports being read only, required and invalid", () => {
      expect(renderTimeField({ isReadOnly: true }).root).toHaveAttribute("data-readonly", "true");
      expect(renderTimeField({ isRequired: true }).root).toHaveAttribute("data-required", "true");
      expect(renderTimeField({ isInvalid: true }).root).toHaveAttribute("data-invalid", "true");
    });

    it("works out for itself that a time is out of range", () => {
      const { root, unmount } = renderTimeField({
        defaultValue: new Time(3),
        minValue: new Time(9),
        validationBehavior: "aria",
      });

      expect(root).toHaveAttribute("data-invalid", "true");
      unmount();
    });
  });

  describe("editing", () => {
    it("steps the hour with the arrow keys", async () => {
      const { segment, submitted, unmount } = renderTimeField({
        defaultValue: new Time(13, 45),
        name: "at",
      });

      segment("hour").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowUp" }),
      );
      await nextTick();

      expect(submitted().value).toBe("14:45:00");
      unmount();
    });

    it("types a whole time straight through", async () => {
      const { segment, submitted, unmount } = renderTimeField({ name: "at" });
      const type = async (part: string, data: string) => {
        segment(part).dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            data,
            inputType: "insertText",
          }),
        );
        await nextTick();
      };

      await type("hour", "5");
      await type("minute", "3");
      await type("minute", "0");

      expect(submitted().value).toBe("05:30:00");
      unmount();
    });

    it("moves the time across noon by its period alone", async () => {
      const { segment, submitted, unmount } = renderTimeField({
        defaultValue: new Time(9, 30),
        name: "at",
      });

      segment("dayPeriod").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowUp" }),
      );
      await nextTick();

      expect(submitted().value).toBe("21:30:00");
      unmount();
    });
  });

  describe("labelling", () => {
    it("describes the time in words", async () => {
      const { input, unmount } = renderTimeField({ defaultValue: new Time(13, 45) });

      await nextTick();

      const id = input().getAttribute("aria-describedby")!.split(" ")[0]!;

      expect(document.getElementById(id)?.textContent).toBe("Selected Time: 1:45 PM");
      unmount();
    });

    it("moves focus into the field when the label is clicked", () => {
      const { segment, slot, unmount } = renderTimeField();

      slot("label").click();

      expect(document.activeElement).toBe(segment("hour"));
      unmount();
    });
  });
});
