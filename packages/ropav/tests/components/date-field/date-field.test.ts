import {CalendarDate, CalendarDateTime} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const renderDateField = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props: {locale: "en-US", ...props}});
  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

  return {
    ...result,
    group: () => slot("date-input-group"),
    input: () => slot("date-input-group-input"),
    root: slot("date-field"),
    segment: (type: string) =>
      result.container.querySelector<HTMLElement>(`[data-type='${type}']`)!,
    segments: () => [
      ...result.container.querySelectorAll<HTMLElement>("[data-slot='date-input-group-segment']"),
    ],
    slot,
    /** The hidden input a form reads, which sits beside the segments inside the group. */
    submitted: () =>
      result.container.querySelector<HTMLInputElement>("[data-slot='date-input-group'] > input")!,
  };
};

describe("DateField", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {slot, unmount} = renderDateField({
        withDescription: true,
        withPrefix: true,
        withSuffix: true,
      });

      expect(slot("date-field")).not.toBeNull();
      expect(slot("label")).not.toBeNull();
      expect(slot("date-input-group")).not.toBeNull();
      expect(slot("date-input-group-prefix")).not.toBeNull();
      expect(slot("date-input-group-input")).not.toBeNull();
      expect(slot("date-input-group-segment")).not.toBeNull();
      expect(slot("date-input-group-suffix")).not.toBeNull();
      expect(slot("description")).not.toBeNull();
      unmount();
    });

    it("renders one segment per part of the date, in the locale's order", () => {
      const {segments, unmount} = renderDateField({locale: "en-GB"});

      expect(
        segments()
          .map((segment) => segment.dataset["type"])
          .filter((type) => type !== "literal"),
      ).toEqual(["day", "month", "year"]);
      unmount();
    });

    it("groups the segments and names the group after the label", () => {
      const {input, slot, unmount} = renderDateField();

      expect(input()).toHaveAttribute("role", "group");
      expect(input()).toHaveAttribute("aria-labelledby", slot("label").id);
      unmount();
    });

    it("carries the value on a hidden input under its name", () => {
      const {submitted, unmount} = renderDateField({
        defaultValue: new CalendarDate(2026, 6, 5),
        name: "born",
      });

      expect(submitted()).toHaveAttribute("name", "born");
      expect(submitted()).toHaveAttribute("hidden");
      expect(submitted().value).toBe("2026-06-05");
      unmount();
    });
  });

  describe("variants", () => {
    it("applies the group's visual variant", () => {
      expect(renderDateField().group()).toHaveClass("date-input-group--primary");
      expect(renderDateField({variant: "secondary"}).group()).toHaveClass(
        "date-input-group--secondary",
      );
    });

    it("stretches when full width is set as a bare attribute", () => {
      /*
       * The bare form is what a caller writes and the only form that catches a boolean prop with
       * no runtime type: `:full-width="true"` stays green while such a bug is alive.
       */
      const {group, root, unmount} = renderDateField({attributeForm: true});

      expect(root).toHaveClass("date-field--full-width");
      expect(group()).toHaveClass("date-input-group--full-width");
      unmount();
    });

    it("takes a class of its own", () => {
      const {root, unmount} = renderDateField({class: "w-64"});

      expect(root).toHaveClass("w-64");
      expect(root).toHaveClass("date-field");
      unmount();
    });
  });

  describe("state", () => {
    it("reports being disabled on the field and the segments", () => {
      const {input, root, segment, submitted, unmount} = renderDateField({isDisabled: true});

      expect(root).toHaveAttribute("data-disabled", "true");
      expect(input()).toHaveAttribute("aria-disabled", "true");
      // A disabled field is not reachable at all, so its segments leave the tab order.
      expect(segment("month")).not.toHaveAttribute("tabindex");
      expect(submitted()).toBeDisabled();
      unmount();
    });

    it("shows the field's state on the group around the segments", () => {
      /*
       * The group is styled from these, not from the field above it: `status-disabled` dims it and
       * takes it out of the pointer's reach, and the focus ring is drawn from the invalid state.
       */
      const disabled = renderDateField({isDisabled: true});

      expect(disabled.group()).toHaveAttribute("data-disabled", "true");
      expect(disabled.group()).toHaveAttribute("aria-disabled", "true");
      disabled.unmount();

      const invalid = renderDateField({isInvalid: true});

      expect(invalid.group()).toHaveAttribute("data-invalid", "true");
      invalid.unmount();
    });

    it("reports being read only without leaving the tab order", () => {
      const {root, segment, unmount} = renderDateField({isReadOnly: true});

      expect(root).toHaveAttribute("data-readonly", "true");
      expect(segment("month")).toHaveAttribute("aria-readonly", "true");
      // A read-only field can still be read, so its segments stay reachable.
      expect(segment("month")).toHaveAttribute("tabindex", "0");
      unmount();
    });

    it("marks itself required, which is what draws the asterisk", () => {
      // The stylesheet reaches the asterisk through `[data-required="true"] > .label`, so the
      // attribute has to sit on the field rather than on a control inside it.
      const {root, unmount} = renderDateField({isRequired: true});

      expect(root).toHaveAttribute("data-required", "true");
      unmount();
    });

    it("reports being invalid down to the segments", () => {
      const {root, segment, unmount} = renderDateField({isInvalid: true});

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(segment("month")).toHaveAttribute("aria-invalid", "true");
      unmount();
    });

    it("works out for itself that a value is out of range", () => {
      const {root, unmount} = renderDateField({
        defaultValue: new CalendarDate(2026, 1, 1),
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "aria",
      });

      expect(root).toHaveAttribute("data-invalid", "true");
      unmount();
    });
  });

  describe("granularity", () => {
    it("adds the time segments a finer granularity needs", () => {
      const {segments, unmount} = renderDateField({
        defaultValue: new CalendarDateTime(2026, 6, 5, 13, 45),
        granularity: "minute",
      });
      const types = segments().map((segment) => segment.dataset["type"]);

      expect(types).toContain("hour");
      expect(types).toContain("minute");
      expect(types).toContain("dayPeriod");
      unmount();
    });
  });

  describe("editing", () => {
    it("steps a segment with the arrow keys", async () => {
      const {segment, submitted, unmount} = renderDateField({
        defaultValue: new CalendarDate(2026, 6, 5),
        name: "born",
      });

      segment("day").dispatchEvent(
        new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "ArrowUp"}),
      );
      await nextTick();

      expect(submitted().value).toBe("2026-06-06");
      unmount();
    });

    it("types a whole date straight through, one segment at a time", async () => {
      const {segment, submitted, unmount} = renderDateField({name: "born"});
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

      await type("month", "6");
      await type("day", "5");
      await type("year", "2");
      await type("year", "0");
      await type("year", "2");
      await type("year", "6");

      expect(submitted().value).toBe("2026-06-05");
      unmount();
    });

    it("moves between segments with the arrow keys", () => {
      const {segment, unmount} = renderDateField();

      segment("month").focus();
      segment("month").dispatchEvent(
        new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "ArrowRight"}),
      );

      expect(document.activeElement).toBe(segment("day"));
      unmount();
    });
  });

  describe("labelling", () => {
    it("points the group at a visible label", () => {
      const {input, slot, unmount} = renderDateField();

      expect(input()).toHaveAttribute("aria-labelledby", slot("label").id);
      unmount();
    });

    it("takes a label of its own when there is none on screen", () => {
      const {input, unmount} = renderDateField({ariaLabel: "Birth date", withLabel: false});

      expect(input()).toHaveAttribute("aria-label", "Birth date");
      unmount();
    });

    it("moves focus into the field when the label is clicked", () => {
      // The label names a group, so it can point `for` at nothing and has to answer the click.
      const {segment, slot, unmount} = renderDateField();

      slot("label").click();

      expect(document.activeElement).toBe(segment("month"));
      unmount();
    });

    it("describes the value in words, and its own description too", async () => {
      const {input, slot, unmount} = renderDateField({
        defaultValue: new CalendarDate(2026, 6, 5),
        withDescription: true,
      });

      await nextTick();

      const ids = input().getAttribute("aria-describedby")!.split(" ");

      expect(document.getElementById(ids[0]!)?.textContent).toBe("Selected Date: June 5, 2026");
      expect(ids).toContain(slot("description").id);
      unmount();
    });
  });
});
