import type {UseCalendarReturn} from "@/composables/use-calendar";
import type {CalendarState} from "@/composables/use-calendar-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate} from "@internationalized/date";
import {describe, expect, it} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/calendar-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: {calendar: UseCalendarReturn; state: CalendarState};

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: {calendar: UseCalendarReturn; state: CalendarState}) => (ready = value),
  });

  const result = renderVapor(Host, {props});

  return {
    ...result,
    calendar: () => ready.calendar,
    root: () => result.container.querySelector<HTMLElement>("[data-slot='calendar-host']")!,
    state: () => ready.state,
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

/** The one live region a polite announcement lands in. */
const politeRegion = () =>
  document.querySelector<HTMLElement>("[data-slot='live-announcer'][data-politeness='polite']");

const assertiveRegion = () =>
  document.querySelector<HTMLElement>("[data-slot='live-announcer'][data-politeness='assertive']");

/**
 * Empty both live regions.
 *
 * They are shared module state, so a message left by an earlier test would otherwise read as one
 * this test caused.
 */
const clearRegions = () => {
  for (const region of [politeRegion(), assertiveRegion()]) {
    if (region) region.textContent = "";
  }
};

/** Intl inserts its own spaces around a range dash, which are not the ones a keyboard types. */
const normalizeSpaces = (value: string | null | undefined) =>
  value?.replace(/[\u00a0\u2009\u202f]/g, " ") ?? null;

describe("useCalendar", () => {
  describe("naming the calendar", () => {
    it("takes role application so a screen reader leaves the arrow keys alone", () => {
      // A grid role here would hand the arrows to the screen reader's own table navigation.
      expect(setup().root().getAttribute("role")).toBe("application");
    });

    it("names the calendar after what is on screen", () => {
      expect(
        setup({defaultFocusedValue: jun(15)})
          .root()
          .getAttribute("aria-label"),
      ).toBe("June 2026");
    });

    it("puts an explicit label in front of the visible range", () => {
      expect(
        setup({ariaLabel: "Event date", defaultFocusedValue: jun(15)})
          .root()
          .getAttribute("aria-label"),
      ).toBe("Event date, June 2026");
    });

    it("keeps its own id in the labelling list so the label still counts", () => {
      // `aria-labelledby` wins outright over `aria-label`, so the element's own id has to lead the
      // list or the visible range would never be announced.
      const calendar = setup({
        ariaLabel: "Event date",
        ariaLabelledby: "outside",
        defaultFocusedValue: jun(15),
      });
      const root = calendar.root();

      expect(root.getAttribute("aria-labelledby")).toBe(`${root.id} outside`);
    });

    it("passes a description and details through untouched", () => {
      const root = setup({ariaDescribedby: "hint", ariaDetails: "more"}).root();

      expect(root.getAttribute("aria-describedby")).toBe("hint");
      expect(root.getAttribute("aria-details")).toBe("more");
    });

    it("honours an explicit id", () => {
      expect(setup({id: "my-calendar"}).root().id).toBe("my-calendar");
    });

    it("names a multi-month range as a span of months", () => {
      expect(
        setup({defaultFocusedValue: jun(15), visibleDuration: {months: 2}})
          .root()
          .getAttribute("aria-label"),
      ).toBe("June to July 2026");
    });

    it("names a range that is not whole months by its two dates", () => {
      expect(
        setup({defaultFocusedValue: jun(15), visibleDuration: {weeks: 1}})
          .root()
          .getAttribute("aria-label"),
      ).toBe("June 14 to 20, 2026");
    });

    it("spells the era out for a Gregorian date before AD 1", () => {
      expect(
        setup({defaultFocusedValue: new CalendarDate("BC", 44, 3, 15)})
          .root()
          .getAttribute("aria-label"),
      ).toBe("March 44 BC");
    });

    it("follows the locale", () => {
      expect(
        setup({defaultFocusedValue: jun(15), locale: "de-DE"})
          .root()
          .getAttribute("aria-label"),
      ).toBe("Juni 2026");
    });
  });

  describe("the visible title", () => {
    it("reads the range with the browser's own separator rather than a word", () => {
      // The title is seen, not heard, so it keeps the en dash the accessible name spells out.
      const calendar = setup({defaultFocusedValue: jun(15), visibleDuration: {months: 2}});

      expect(normalizeSpaces(calendar.calendar().title.value)).toBe("June – July 2026");
      expect(calendar.root().getAttribute("aria-label")).toBe("June to July 2026");
    });

    it("follows the visible range as it moves", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      expect(calendar.calendar().title.value).toBe("June 2026");
      calendar.state().focusNextPage();
      expect(calendar.calendar().title.value).toBe("July 2026");
    });
  });

  describe("the previous and next buttons", () => {
    it("names them in the locale", () => {
      const calendar = setup();

      expect(calendar.calendar().prevButton.attrs.value["aria-label"]).toBe("Previous");
      expect(calendar.calendar().nextButton.attrs.value["aria-label"]).toBe("Next");

      const german = setup({locale: "de-DE"});

      expect(german.calendar().prevButton.attrs.value["aria-label"]).toBe("Zurück");
    });

    it("pages the calendar when pressed", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});
      const button = (slot: string) =>
        calendar.container.querySelector<HTMLElement>(`[data-slot='calendar-${slot}']`)!;

      button("next").click();
      expect(calendar.calendar().title.value).toBe("July 2026");

      button("previous").click();
      expect(calendar.calendar().title.value).toBe("June 2026");
    });

    it("disables the direction a bound closes off", () => {
      const calendar = setup({
        defaultFocusedValue: jun(15),
        maxValue: new CalendarDate(2026, 6, 30),
        minValue: jun(1),
      });

      expect(calendar.calendar().prevButton.isDisabled.value).toBe(true);
      expect(calendar.calendar().nextButton.isDisabled.value).toBe(true);
    });

    it("disables both while the calendar is disabled", () => {
      const calendar = setup({isDisabled: true});

      expect(calendar.calendar().prevButton.isDisabled.value).toBe(true);
      expect(calendar.calendar().nextButton.isDisabled.value).toBe(true);
    });

    it("moves focus into the calendar when the button it is on goes disabled", async () => {
      // Paging to the last available month disables the button under the user's finger; without
      // this the browser would drop focus to the document and keyboard navigation would be lost.
      const calendar = setup({
        defaultFocusedValue: jun(15),
        maxValue: new CalendarDate(2026, 7, 31),
      });
      const next = calendar.container.querySelector<HTMLElement>("[data-slot='calendar-next']")!;

      next.focus();
      await nextTick();
      expect(calendar.state().isFocused.value).toBe(false);

      calendar.state().focusNextPage();
      await nextTick();

      expect(calendar.calendar().nextButton.isDisabled.value).toBe(true);
      expect(calendar.state().isFocused.value).toBe(true);
    });
  });

  describe("announcing", () => {
    it("announces the new range when it moves with focus outside", async () => {
      clearRegions();
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().focusNextPage();
      await nextTick();

      expect(assertiveRegion()?.textContent).toBe("July 2026");
    });

    it("stays quiet when focus is inside, because the focused cell already says where it is", async () => {
      clearRegions();
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().setFocused(true);
      calendar.state().focusNextPage();
      await nextTick();

      expect(assertiveRegion()?.textContent).toBe("");
    });

    it("announces a new selection politely, so it waits its turn", async () => {
      clearRegions();
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().selectDate(jun(20));
      await nextTick();

      expect(politeRegion()?.textContent).toBe("Selected Date: Saturday, June 20, 2026");
    });

    it("lists every date of a multiple selection", async () => {
      const props = reactive({selectionMode: "multiple", value: [jun(3)] as unknown});
      const calendar = setup(props);

      props.value = [jun(3), jun(9), jun(21)];
      await nextTick();

      expect(calendar.calendar().shared.selectedDateDescription.value).toBe(
        "Selected Date: Wednesday, June 3, 2026, Tuesday, June 9, 2026, and Sunday, June 21, 2026",
      );
    });
  });

  describe("what it hands its grids and cells", () => {
    it("passes the calendar's own labelling down", () => {
      const calendar = setup({ariaLabel: "Event date", ariaLabelledby: "outside"});

      expect(calendar.calendar().shared.ariaLabel.value).toBe("Event date");
      expect(calendar.calendar().shared.ariaLabelledBy.value).toBe("outside");
    });

    it("withholds the error message id while nothing renders it", async () => {
      // A dangling `aria-describedby` reads as a broken control, so the id only exists once an
      // element actually claims it.
      const calendar = setup({isInvalid: true, value: jun(10)});

      await nextTick();
      expect(calendar.calendar().shared.errorMessageId.value).toBeUndefined();
    });

    it("hands out the error message id once an element claims it", async () => {
      const calendar = setup({hasErrorMessage: true, isInvalid: true, value: jun(10)});

      await nextTick();

      const id = calendar.calendar().shared.errorMessageId.value;

      expect(id).toBeDefined();
      expect(calendar.container.querySelector(`#${id}`)?.textContent).toBe("Out of range");
    });
  });
});
