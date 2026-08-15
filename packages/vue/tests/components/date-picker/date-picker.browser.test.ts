import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate} from "@internationalized/date";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const jun = (day: number) => new CalendarDate(2026, 6, day);

/**
 * Two rules react-aria's own build fails in exactly the same places, measured on both sides with
 * axe against the open popover.
 *
 * `color-contrast`: a selected calendar cell is near-white on `--accent`, which is about 3.7:1.
 * `landmark-banner-is-top-level`: `Calendar.Header` renders a `<header>`, which is a banner
 * landmark, and inside a popover it is not top level.
 *
 * Both live in `@heroui/styles` and in HeroUI's own component shape rather than in this port, so
 * they are excluded here and recorded as debt instead of being silently absorbed into a green gate.
 */
const SHARED_WITH_REACT = {
  rules: {"color-contrast": {enabled: false}, "landmark-banner-is-top-level": {enabled: false}},
};

const render = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, {props: {label: "Appointment", locale: "en-US", ...props}});

type RenderResult = ReturnType<typeof render>;

let mounted: RenderResult | null = null;

/** Mount and remember it, so a throwing assertion still gets torn down. */
const mount = (props: Record<string, unknown> = {}) => {
  mounted = render(props);

  return mounted;
};

/** Wait for the entry or exit animation to finish, so the popover is measured at its final size. */
const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const popoverOf = () => document.body.querySelector<HTMLElement>(".date-picker__popover");

const triggerOf = (result: RenderResult) =>
  result.container.querySelector<HTMLElement>("[data-slot='date-picker-trigger']")!;

const segmentOf = (result: RenderResult, type: string) =>
  [
    ...result.container.querySelectorAll<HTMLElement>("[data-slot='date-input-group-segment']"),
  ].find((element) => element.dataset["type"] === type)!;

const open = async (result: RenderResult) => {
  await userEvent.click(triggerOf(result));
  await nextTick();
  await nextTick();
  await nextTick();

  const popover = popoverOf()!;

  await settled(popover);

  return popover;
};

afterEach(async () => {
  /*
   * An open popover marks every sibling of its container `inert`, and Playwright will not click
   * through that — so a single failed assertion would read as every later test failing too. Closed
   * and unmounted here rather than at the end of each test, which a throw skips.
   */
  if (popoverOf()) {
    await userEvent.keyboard("{Escape}");
    await nextTick();
    await nextTick();
  }

  mounted?.unmount();
  mounted = null;
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
    if (child.getAttribute("style") === "display: contents;") child.remove();
  }
});

/**
 * What a date picker is cannot be read in jsdom: the popover is measured and positioned against the
 * group, it animates, it takes focus away from the page and has to give it back, and the calendar
 * inside it is driven by real arrow keys. All of that needs a real layout and a real pointer.
 */
describe("DatePicker (browser)", () => {
  describe("axe", () => {
    it("finds nothing to complain about while closed", async () => {
      const result = mount({value: jun(10)});

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about with the calendar open", async () => {
      const result = mount({value: jun(10)});
      const popover = await open(result);

      await expectNoA11yViolations(popover, SHARED_WITH_REACT);
    });

    it("names the overlay, which react-aria-components leaves unnamed", async () => {
      /*
       * `aria-dialog-name` is the one axe rule where the two sides differ: HeroUI's React
       * composition renders no `Dialog`, so its `dialogProps` reach nothing and the overlay is a
       * `role="dialog"` with no accessible name. Here the overlay takes them.
       */
      const result = mount({value: jun(10)});
      const popover = await open(result);

      expect(popover.getAttribute("role")).toBe("dialog");
      expect(popover.getAttribute("aria-labelledby")).toBeTruthy();
    });
  });

  describe("a real pointer", () => {
    /**
     * A synthetic pointer proves nothing about press. It arrives with no `pointerenter` ahead of it
     * and triggers no re-render mid-dispatch, which is the shape of the bug that once left a
     * dropdown unopenable by mouse while every test stayed green.
     */
    it("opens the calendar from the trigger", async () => {
      const result = mount();
      const popover = await open(result);

      expect(popover).toBeTruthy();
      expect(popover.querySelector("[data-slot='calendar']")).toBeTruthy();
    });

    it("closes on a press on the page behind it", async () => {
      const result = mount();
      const popover = await open(result);

      // The page itself, not an element on it: a modal overlay marks every sibling of its own
      // container `inert`, so there is nothing on the page left to press.
      await userEvent.click(document.documentElement);
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeNull();
    });

    it("picks a day and closes", async () => {
      const result = mount({placeholderValue: jun(15)});
      const popover = await open(result);
      const cell = [...popover.querySelectorAll<HTMLElement>("[data-slot='calendar-cell']")].find(
        (element) => element.textContent?.trim() === "20" && !element.dataset["outsideMonth"],
      )!;

      await userEvent.click(cell);
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeNull();
      expect(segmentOf(result, "day").textContent?.trim()).toBe("20");
    });

    it("hands focus back to the trigger after an outside press", async () => {
      /*
       * Not the picker's own doing: the overlay contains focus while it is open and restores it on
       * the way out. The picker's own rAF adds the same guarantee for a *key* pressed while open,
       * which is the one case where the overlay has already let go.
       */
      const result = mount();
      const popover = await open(result);

      await userEvent.click(document.documentElement);
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(document.activeElement).toBe(triggerOf(result));
    });
  });

  describe("a real keyboard", () => {
    it("opens the calendar with Alt and an arrow from a segment", async () => {
      /*
       * The key has to get past the segment, which is a spin button that steps on a bare arrow. It
       * only falls through because the whole combination is a different key from the bare arrow.
       */
      const result = mount();

      segmentOf(result, "month").focus();
      await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
      await nextTick();
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeTruthy();
    });

    it("takes focus into the calendar as it appears", async () => {
      const result = mount({value: jun(10)});
      const popover = await open(result);

      expect(popover.contains(document.activeElement)).toBe(true);
      expect((document.activeElement as HTMLElement).dataset["slot"]).toBe("calendar-cell");
    });

    it("moves through the grid with the arrow keys", async () => {
      const result = mount({value: jun(10)});

      await open(result);

      const labelled = () =>
        (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ?? "";

      expect(labelled()).toContain("June 10");

      await userEvent.keyboard("{ArrowRight}");
      await nextTick();

      expect(labelled()).toContain("June 11");

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      expect(labelled()).toContain("June 18");
    });

    it("hands focus back to the trigger after Escape", async () => {
      // A keyboard user has nowhere else to be, so the trigger is where focus belongs.
      const result = mount();
      const popover = await open(result);

      await userEvent.keyboard("{Escape}");
      await settled(popover);
      await nextTick();
      await nextTick();
      // The focus is restored in an animation frame, after the popover has gone.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(popoverOf()).toBeNull();
      expect(document.activeElement).toBe(triggerOf(result));
    });

    it("draws a visible focus ring on the trigger", async () => {
      /*
       * `status-focused` draws with a box shadow and sets `outline-style: none`, so the outline is
       * the wrong thing to read — and reading it is how a missing ring passes unnoticed.
       */
      const result = mount();

      triggerOf(result).focus();
      await nextTick();

      expect(getComputedStyle(triggerOf(result)).boxShadow).not.toBe("none");
    });

    it("reaches every segment and the trigger by Tab alone", async () => {
      /*
       * A field of segments is one tab stop per segment, and the button after them. Anything the
       * pointer can reach has to be reachable this way too.
       */
      const result = mount({value: jun(10)});

      segmentOf(result, "month").focus();
      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(segmentOf(result, "day"));

      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(segmentOf(result, "year"));

      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(triggerOf(result));
    });
  });
});
