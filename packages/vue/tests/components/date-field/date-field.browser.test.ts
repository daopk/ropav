import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate} from "@internationalized/date";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import {pressRealReset} from "../../harness/real-reset";

import Fixture from "./fixtures.vue";

const jun = (day: number) => new CalendarDate(2026, 6, day);

/**
 * One rule react-aria's own build fails in exactly the same places, measured on both sides with axe
 * against the same markup: a label, and an invalid segment, sit below 4.5:1 against the field.
 *
 * It lives in `@heroui/styles` rather than in this port, so it is excluded here and recorded as debt
 * instead of being absorbed into a green gate.
 */
const SHARED_WITH_REACT = {rules: {"color-contrast": {enabled: false}}};

const render = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, {props: {locale: "en-US", withLabel: true, ...props}});

type RenderResult = ReturnType<typeof render>;

let mounted: RenderResult | null = null;

const mount = (props: Record<string, unknown> = {}) => {
  mounted = render(props);

  return mounted;
};

const groupOf = (result: RenderResult) =>
  result.container.querySelector<HTMLElement>("[data-slot='date-input-group']")!;

const segmentOf = (result: RenderResult, type: string) =>
  [
    ...result.container.querySelectorAll<HTMLElement>("[data-slot='date-input-group-segment']"),
  ].find((element) => element.dataset["type"] === type)!;

const textOf = (result: RenderResult, type: string) => segmentOf(result, type).textContent?.trim();

afterEach(() => {
  mounted?.unmount();
  mounted = null;
});

/**
 * A date field is the most event-dense thing in the package: every segment is a `contenteditable`
 * spin button that answers `beforeinput`, hides its own caret, and hands focus to the next segment
 * the moment it is full. jsdom has no caret, no selection inside `contenteditable`, and no real key
 * events — so what a user actually types can only be asserted here.
 */
describe("DateField (browser)", () => {
  describe("axe", () => {
    it("finds nothing to complain about", async () => {
      const result = mount({value: jun(10)});

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about while invalid", async () => {
      const result = mount({isInvalid: true, value: jun(10), withFieldError: true});

      await nextTick();
      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about while disabled", async () => {
      const result = mount({isDisabled: true, value: jun(10)});

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });
  });

  describe("real typing", () => {
    it("fills a segment and moves on to the next", async () => {
      /*
       * The whole reason a segment is `contenteditable`: what a user types arrives as `beforeinput`,
       * and the field decides both the value and where focus goes next.
       */
      const result = mount({defaultValue: jun(10)});

      segmentOf(result, "month").focus();
      await userEvent.keyboard("12");
      await nextTick();

      expect(textOf(result, "month")).toBe("12");
      // Two digits is as much as a month can hold, so focus moves on by itself.
      expect(document.activeElement).toBe(segmentOf(result, "day"));
    });

    it("builds a whole date by typing straight through", async () => {
      const result = mount();

      segmentOf(result, "month").focus();
      await userEvent.keyboard("06152027");
      await nextTick();

      expect(textOf(result, "month")).toBe("6");
      expect(textOf(result, "day")).toBe("15");
      expect(textOf(result, "year")).toBe("2027");
    });

    it("refuses a digit that cannot start a valid month", async () => {
      const result = mount();

      segmentOf(result, "month").focus();
      await userEvent.keyboard("9");
      await nextTick();

      // 9 cannot be the first of two digits, so the month is complete at once.
      expect(textOf(result, "month")).toBe("9");
      expect(document.activeElement).toBe(segmentOf(result, "day"));
    });

    it("takes a digit off at a time with Backspace", async () => {
      // A segment is deleted digit by digit, and only goes back to a placeholder once it is empty.
      const result = mount({defaultValue: jun(10)});

      segmentOf(result, "day").focus();
      await userEvent.keyboard("{Backspace}");
      await nextTick();

      expect(textOf(result, "day")).toBe("1");

      await userEvent.keyboard("{Backspace}");
      await nextTick();

      expect(segmentOf(result, "day").dataset["placeholder"]).toBe("true");
    });

    it("steps a segment with the arrow keys", async () => {
      const result = mount({defaultValue: jun(10)});

      segmentOf(result, "day").focus();
      await userEvent.keyboard("{ArrowUp}");
      await nextTick();

      expect(textOf(result, "day")).toBe("11");

      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      await nextTick();

      expect(textOf(result, "day")).toBe("9");
    });

    it("hides its own caret, since the segment is not a text box", async () => {
      /*
       * A `contenteditable` shows a caret, and a spin button must not: the value is replaced whole
       * rather than edited character by character.
       */
      const result = mount({value: jun(10)});

      expect(getComputedStyle(segmentOf(result, "day")).caretColor).toBe("rgba(0, 0, 0, 0)");
    });
  });

  describe("a real keyboard", () => {
    it("moves between segments with the arrow keys", async () => {
      const result = mount({value: jun(10)});

      segmentOf(result, "month").focus();
      await userEvent.keyboard("{ArrowRight}");
      await nextTick();

      expect(document.activeElement).toBe(segmentOf(result, "day"));

      await userEvent.keyboard("{ArrowLeft}");
      await nextTick();

      expect(document.activeElement).toBe(segmentOf(result, "month"));
    });

    it("reaches every segment by Tab alone", async () => {
      // Every editable segment is its own tab stop, which is what makes the field reachable.
      const result = mount({value: jun(10)});

      segmentOf(result, "month").focus();
      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(segmentOf(result, "day"));

      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(segmentOf(result, "year"));
    });

    it("draws a visible focus ring on the group around the segments", async () => {
      /*
       * `status-focused` draws with a box shadow and sets `outline-style: none`, so the outline is
       * the wrong thing to read — and reading it is how a missing ring passes unnoticed.
       */
      const result = mount({value: jun(10)});

      segmentOf(result, "month").focus();
      await nextTick();

      expect(getComputedStyle(groupOf(result)).boxShadow).not.toBe("none");
    });
  });

  describe("a real pointer", () => {
    it("puts the caret on the segment that was pressed", async () => {
      const result = mount({value: jun(10)});

      await userEvent.click(segmentOf(result, "year"));
      await nextTick();

      expect(document.activeElement).toBe(segmentOf(result, "year"));
    });

    it("resumes on the first empty segment when the space beside them is pressed", async () => {
      /*
       * Pressing the padding of a half-filled field carries on where the typing left off rather
       * than jumping to the end — and the decision is made by measuring where the press landed.
       */
      const result = mount();

      segmentOf(result, "month").focus();
      await userEvent.keyboard("06");
      await nextTick();
      await userEvent.click(groupOf(result), {position: {x: 4, y: 4}});
      await nextTick();

      expect(document.activeElement?.getAttribute("data-type")).toBe("day");
    });

    it("takes no focus at all while disabled", async () => {
      const result = mount({isDisabled: true, value: jun(10)});

      await userEvent.click(groupOf(result), {force: true});
      await nextTick();

      expect(groupOf(result).contains(document.activeElement)).toBe(false);
    });
  });

  describe("a reset the browser performs", () => {
    it("puts the hidden control back, and submits it", async () => {
      /*
       * Under native validation the control a form reads is a real one — `type="text"` plus the
       * `hidden` attribute, so that an empty required field can stop a submit — and a real control
       * is restored from a default the binding never wrote. Only a browser can show it: jsdom
       * restores inside the dispatch and lets the post-flush state mirror cover the gap.
       */
      const result = mount({
        defaultValue: jun(5),
        name: "born",
        validationBehavior: "native",
        withForm: true,
      });
      const hidden = result.container.querySelector<HTMLInputElement>("input[name='born']")!;

      await nextTick();
      await userEvent.click(segmentOf(result, "day"));
      await userEvent.keyboard("20");
      await nextTick();

      expect(hidden.value).toBe("2026-06-20");

      await pressRealReset(result.container);
      await nextTick();
      await nextTick();

      expect(hidden.value).toBe("2026-06-05");
      expect(new FormData(result.container.querySelector("form")!).get("born")).toBe("2026-06-05");
    });
  });
});
