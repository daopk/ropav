import type {DateSegmentReady} from "../fixtures/date-segment.types";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate, CalendarDateTime} from "@internationalized/date";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import Harness from "../fixtures/date-segment-harness.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: DateSegmentReady;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: DateSegmentReady) => (ready = value),
  });

  const result = renderVapor(Harness, {props});
  const root = result.container.querySelector<HTMLElement>("[data-slot='group']")!;

  /** The rendered segments, re-read each time because the field rebuilds them on every edit. */
  const all = () => [...root.querySelectorAll<HTMLElement>("[data-slot='segment']")];

  return {
    ...result,
    all,
    /** The element for one part of the date, e.g. `month`. */
    part: (name: string) => {
      const index = ready.state.segments.value.findIndex((segment) => segment.type === name);

      return all()[index]!;
    },
    ready: () => ready,
    root,
  };
};

const type = async (target: HTMLElement, data: string) => {
  target.dispatchEvent(
    new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      data,
      inputType: "insertText",
    }),
  );
  await nextTick();
};

const press = async (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init}),
  );
  await nextTick();
};

describe("useDateSegment", () => {
  describe("what a segment looks like", () => {
    it("is a spin button carrying its own range", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});
      const month = part("month");

      expect(month.getAttribute("role")).toBe("spinbutton");
      expect(month.getAttribute("aria-valuenow")).toBe("6");
      expect(month.getAttribute("aria-valuemin")).toBe("1");
      expect(month.getAttribute("aria-valuemax")).toBe("12");
      expect(month.getAttribute("tabindex")).toBe("0");
      expect(month.getAttribute("contenteditable")).toBe("true");
      unmount();
    });

    it("names the part of the date it is", () => {
      const {part, unmount} = setup({});

      expect(part("month").getAttribute("aria-label")).toBe("month");
      expect(part("year").getAttribute("aria-label")).toBe("year");
      unmount();
    });

    it("puts the field's own label after the part name", () => {
      // VoiceOver on iOS does not announce groups, so each segment has to carry the field's name.
      const {part, unmount} = setup({ariaLabel: "Birth date"});

      expect(part("day").getAttribute("aria-label")).toBe("day, Birth date");
      unmount();
    });

    it("reads a month out by name as well as by number", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});

      expect(part("month").getAttribute("aria-valuetext")).toBe("6 – June");
      unmount();
    });

    it("reads an hour the way the clock does", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDateTime(2026, 6, 5, 13, 45)});

      // The hour segment shows "1"; on its own that says nothing about which one.
      expect(part("hour").getAttribute("aria-valuetext")).toBe("1 PM");
      unmount();
    });

    it("says nothing for an empty segment beyond that it is empty", () => {
      const {part, unmount} = setup({});

      expect(part("month").getAttribute("data-placeholder")).toBe("true");
      expect(part("month").getAttribute("aria-valuenow")).toBeNull();
      expect(part("month").getAttribute("aria-valuetext")).toBe("Empty");
      unmount();
    });

    it("hides the punctuation between segments", () => {
      const {all, unmount} = setup({});
      const literal = all().find((segment) => segment.getAttribute("aria-hidden") === "true")!;

      // A slash is not a control and has nothing to announce.
      expect(literal).toBeDefined();
      expect(literal.getAttribute("role")).toBeNull();
      expect(literal.getAttribute("contenteditable")).toBeNull();
      unmount();
    });

    it("marks itself read only rather than editable", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5), isReadOnly: true});

      expect(part("month").getAttribute("aria-readonly")).toBe("true");
      expect(part("month").getAttribute("contenteditable")).toBeNull();
      // Still reachable: a read-only field can be read, so its segments stay in the tab order.
      expect(part("month").getAttribute("tabindex")).toBe("0");
      unmount();
    });

    it("leaves the tab order when the field is disabled", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5), isDisabled: true});

      expect(part("month").getAttribute("tabindex")).toBeNull();
      expect(part("month").getAttribute("inputmode")).toBeNull();
      unmount();
    });

    it("asks for a number pad only where a number is wanted", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDateTime(2026, 6, 5, 13, 45)});

      expect(part("month").getAttribute("inputmode")).toBe("numeric");
      // Neither of these is typed as a number, so a number pad would be the wrong keyboard.
      expect(part("dayPeriod").getAttribute("inputmode")).toBeNull();
      unmount();
    });

    it("describes only the first segment, until the field is invalid", () => {
      /*
       * Otherwise the field's description would be read again on every segment the user moves to.
       * An invalid field is the exception, because the reason has to reach whoever is fixing it.
       */
      const valid = setup({ariaDescribedBy: "hint"});

      expect(valid.part("month").getAttribute("aria-describedby")).toBe("hint");
      expect(valid.part("year").getAttribute("aria-describedby")).toBeNull();
      valid.unmount();

      const invalid = setup({
        ariaDescribedBy: "hint",
        defaultValue: new CalendarDate(2026, 1, 1),
        minValue: new CalendarDate(2026, 6, 1),
      });

      expect(invalid.part("year").getAttribute("aria-describedby")).toBe("hint");
      expect(invalid.part("year").getAttribute("aria-invalid")).toBe("true");
      invalid.unmount();
    });
  });

  describe("typing into a segment", () => {
    it("takes a digit at a time", async () => {
      const {part, ready, unmount} = setup({});

      await type(part("year"), "2");
      expect(ready().state.segments.value.find((s) => s.type === "year")?.text).toBe("2");

      await type(part("year"), "0");
      expect(ready().state.segments.value.find((s) => s.type === "year")?.text).toBe("20");
      unmount();
    });

    it("moves on as soon as no further digit could fit", async () => {
      const {part, unmount} = setup({});
      const month = part("month");

      month.focus();
      // A month can be 10, 11 or 12, so a leading 1 has to wait.
      await type(month, "1");
      expect(document.activeElement).toBe(month);

      await type(month, "2");
      expect(document.activeElement).toBe(part("day"));
      unmount();
    });

    it("moves on at once for a digit nothing could follow", async () => {
      const {part, unmount} = setup({});
      const month = part("month");

      month.focus();
      await type(month, "5");

      expect(document.activeElement).toBe(part("day"));
      unmount();
    });

    it("starts a new number when the typed one has overrun", async () => {
      const {part, ready, unmount} = setup({});
      const day = part("day");

      day.focus();
      await type(day, "3");
      await type(day, "5");

      // 35 is no day, so the 5 begins again rather than being appended.
      expect(ready().state.segments.value.find((s) => s.type === "day")?.text).toBe("5");
      unmount();
    });

    it("refuses anything that is not a number", async () => {
      const {part, ready, unmount} = setup({});

      await type(part("day"), "x");

      expect(ready().state.segments.value.find((s) => s.type === "day")?.isPlaceholder).toBe(true);
      unmount();
    });

    it("picks a day period by its first letter", async () => {
      const {part, ready, unmount} = setup({
        defaultValue: new CalendarDateTime(2026, 6, 5, 9, 30),
      });
      const period = () => ready().state.segments.value.find((s) => s.type === "dayPeriod")?.text;

      await type(part("dayPeriod"), "p");
      expect(period()).toBe("PM");

      await type(part("dayPeriod"), "a");
      expect(period()).toBe("AM");
      unmount();
    });

    it("picks an era by its first letter, and hands focus on", async () => {
      const {part, ready, unmount} = setup({defaultValue: new CalendarDate("BC", 44, 3, 15)});
      const era = part("era");

      era.focus();
      await type(era, "A");

      expect(ready().state.value.value?.era).toBe("AD");
      // The era only ever takes one character, so there is nothing left to type into it.
      expect(document.activeElement).not.toBe(era);
      unmount();
    });

    it("types nothing into a read-only field", async () => {
      const {part, ready, unmount} = setup({isReadOnly: true});

      await type(part("day"), "5");

      expect(ready().state.segments.value.find((s) => s.type === "day")?.isPlaceholder).toBe(true);
      unmount();
    });

    it("never lets the browser write the text itself", () => {
      // The state owns what a segment shows; an uncancelled input would put the DOM out of step.
      const {part, unmount} = setup({});
      const event = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        data: "5",
        inputType: "insertText",
      });

      part("day").dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      unmount();
    });
  });

  describe("clearing a segment", () => {
    it("drops the last digit typed", async () => {
      const {part, ready, unmount} = setup({});

      await type(part("year"), "2");
      await type(part("year"), "0");
      await press(part("year"), "Backspace");

      expect(ready().state.segments.value.find((s) => s.type === "year")?.text).toBe("2");
      unmount();
    });

    it("empties a segment down to its last digit", async () => {
      const {part, ready, unmount} = setup({});

      await type(part("day"), "5");
      await press(part("day"), "Backspace");

      expect(ready().state.segments.value.find((s) => s.type === "day")?.isPlaceholder).toBe(true);
      unmount();
    });

    it("empties a day period outright", async () => {
      const {part, ready, unmount} = setup({
        defaultValue: new CalendarDateTime(2026, 6, 5, 9, 30),
      });

      await press(part("dayPeriod"), "Delete");

      expect(ready().state.segments.value.find((s) => s.type === "dayPeriod")?.isPlaceholder).toBe(
        true,
      );
      unmount();
    });

    it("steps back off an empty segment", async () => {
      const {part, unmount} = setup({});
      const day = part("day");

      day.focus();
      await press(day, "Backspace");

      expect(document.activeElement).toBe(part("month"));
      unmount();
    });
  });

  describe("stepping a segment", () => {
    it("moves by one on an arrow", async () => {
      const {part, ready, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});

      await press(part("day"), "ArrowUp");
      expect(ready().state.value.value?.day).toBe(6);

      await press(part("day"), "ArrowDown");
      expect(ready().state.value.value?.day).toBe(5);
      unmount();
    });

    it("leaves an arrow held with a modifier alone", async () => {
      /*
       * A key held with a modifier is a different key, and none of the stepping shortcuts are bound
       * with one. Alt with an arrow has to fall through to whatever is listening above, which is how
       * a date picker's popover is opened from a segment.
       */
      const {part, ready, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});

      const event = new KeyboardEvent("keydown", {
        altKey: true,
        bubbles: true,
        cancelable: true,
        key: "ArrowDown",
      });

      part("day").dispatchEvent(event);
      await nextTick();

      expect(ready().state.value.value?.day).toBe(5);
      expect(event.cancelBubble).toBe(false);
      unmount();
    });

    it("pages the day by a week", async () => {
      const {part, ready, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});

      await press(part("day"), "PageUp");
      expect(ready().state.value.value?.day).toBe(12);

      await press(part("day"), "PageDown");
      expect(ready().state.value.value?.day).toBe(5);
      unmount();
    });

    it("takes the day to the ends of what a month can hold", async () => {
      const {part, ready, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});

      await press(part("day"), "Home");
      expect(ready().state.value.value?.day).toBe(1);

      await press(part("day"), "End");

      /*
       * A day segment runs to 31, which is the longest a month gets rather than the length of this
       * one. June has no 31st, so it stays on screen unresolved and nothing is committed — leaving
       * the field is what settles it.
       */
      expect(part("day").textContent).toBe("31");
      expect(ready().state.value.value?.day).toBe(1);
      unmount();
    });

    it("forgets a half-typed number when it is stepped", async () => {
      const {part, ready, unmount} = setup({});
      const year = part("year");

      await type(year, "2");
      await press(year, "ArrowUp");
      await type(year, "5");

      // The 5 starts afresh instead of landing beside the 2 that the arrow replaced.
      expect(ready().state.segments.value.find((s) => s.type === "year")?.text).toBe("5");
      unmount();
    });
  });

  describe("in a right-to-left locale", () => {
    it("pins each segment's own direction", () => {
      /*
       * A placeholder and a real value are laid out differently by the bidi algorithm, so without
       * this a segment would shift around as it is filled in and emptied again.
       */
      const {part, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5), locale: "he-IL"});

      expect(part("month").style.unicodeBidi).toBe("embed");
      expect(part("month").style.direction).toBe("ltr");
      unmount();
    });

    it("leaves a left-to-right locale alone", () => {
      const {part, unmount} = setup({defaultValue: new CalendarDate(2026, 6, 5)});

      expect(part("month").style.unicodeBidi).toBe("");
      unmount();
    });
  });
});
