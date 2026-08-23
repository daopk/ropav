import type {UseDatePickerGroupReturn} from "@/composables/use-date-picker-group";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";

import Harness from "../fixtures/date-picker-group-harness.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let group!: UseDatePickerGroupReturn;

  Object.assign(props, {onReady: (value: UseDatePickerGroupReturn) => (group = value)});

  const result = renderVapor(Harness, {props});
  const container = result.container;
  const root = container.querySelector<HTMLElement>("[data-slot='group']")!;
  const segments = [...root.querySelectorAll<HTMLElement>("[data-slot='segment']")];

  return {
    ...result,
    /** Which segment holds focus, by index, or null when none does. */
    focused: () => {
      const index = segments.indexOf(document.activeElement as HTMLElement);

      return index === -1 ? null : index;
    },
    group: () => group,
    root,
    segments,
  };
};

const keydown = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init});

  target.dispatchEvent(event);

  return event;
};

/** A left-button pointerdown, which is what starts a mouse press on the group. */
const pointerdown = (target: HTMLElement) =>
  target.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      cancelable: true,
      height: 1,
      pointerId: 1,
      pointerType: "mouse",
      width: 1,
    }),
  );

/**
 * Give the segments real horizontal positions.
 *
 * jsdom reports every rect as zero, and the right-to-left branch is entirely geometric — without
 * this it cannot be exercised at all.
 */
const layOut = (segments: HTMLElement[], lefts: number[]) => {
  segments.forEach((segment, index) => {
    segment.getBoundingClientRect = () => ({left: lefts[index]!}) as DOMRect;
  });
};

describe("useDatePickerGroup", () => {
  describe("moving between segments", () => {
    it("steps forward and back with the arrow keys", () => {
      const {focused, segments, unmount} = setup({locale: "en-US"});

      segments[0]!.focus();

      keydown(segments[0]!, "ArrowRight");
      expect(focused()).toBe(1);

      keydown(segments[1]!, "ArrowRight");
      expect(focused()).toBe(2);

      keydown(segments[2]!, "ArrowLeft");
      expect(focused()).toBe(1);
      unmount();
    });

    it("stops at the ends rather than wrapping", () => {
      // A field is a row, not a loop: running off the end has to leave focus where it was.
      const {focused, segments, unmount} = setup({locale: "en-US"});

      segments[2]!.focus();
      keydown(segments[2]!, "ArrowRight");
      expect(focused()).toBe(2);

      segments[0]!.focus();
      keydown(segments[0]!, "ArrowLeft");
      expect(focused()).toBe(0);
      unmount();
    });

    it("claims the key it acted on", () => {
      const {segments, unmount} = setup({locale: "en-US"});

      segments[0]!.focus();

      // The field owns its arrows; nothing above it should also scroll or move a cursor.
      expect(keydown(segments[0]!, "ArrowRight").defaultPrevented).toBe(true);
      unmount();
    });

    it("leaves other keys alone", () => {
      const {segments, unmount} = setup({locale: "en-US"});

      segments[0]!.focus();

      expect(keydown(segments[0]!, "ArrowUp").defaultPrevented).toBe(false);
      expect(keydown(segments[0]!, "a").defaultPrevented).toBe(false);
      unmount();
    });

    it("leaves the arrows alone when asked to", () => {
      // A field nested in a picker steers its own arrows, across both of its fields.
      const {focused, segments, unmount} = setup({
        disableArrowNavigation: true,
        locale: "en-US",
      });

      segments[0]!.focus();

      expect(keydown(segments[0]!, "ArrowRight").defaultPrevented).toBe(false);
      expect(focused()).toBe(0);
      unmount();
    });
  });

  describe("in a right-to-left locale", () => {
    it("follows the layout rather than the document order", () => {
      /*
       * The segments stay in date order in the DOM while being laid out right to left, so the
       * segment to the left of the first one is the second one.
       */
      const {focused, segments, unmount} = setup({locale: "he-IL"});

      layOut(segments, [200, 100, 0]);
      segments[0]!.focus();

      keydown(segments[0]!, "ArrowLeft");
      expect(focused()).toBe(1);

      keydown(segments[1]!, "ArrowRight");
      expect(focused()).toBe(0);
      unmount();
    });

    it("stops at the edge of the row", () => {
      const {focused, segments, unmount} = setup({locale: "he-IL"});

      layOut(segments, [200, 100, 0]);
      segments[2]!.focus();

      expect(keydown(segments[2]!, "ArrowLeft").defaultPrevented).toBe(false);
      expect(focused()).toBe(2);
      unmount();
    });
  });

  describe("opening an overlay", () => {
    it("opens on Alt with an arrow", () => {
      const setOpen = vi.fn();
      const {segments, unmount} = setup({locale: "en-US", setOpen});

      const down = keydown(segments[0]!, "ArrowDown", {altKey: true});

      expect(setOpen).toHaveBeenCalledWith(true);
      expect(down.defaultPrevented).toBe(true);

      keydown(segments[0]!, "ArrowUp", {altKey: true});
      expect(setOpen).toHaveBeenCalledTimes(2);
      unmount();
    });

    it("leaves the key alone when there is no overlay to open", () => {
      // A plain date field owns no popover, so Alt with an arrow is not its key to take.
      const {segments, unmount} = setup({locale: "en-US"});

      expect(keydown(segments[0]!, "ArrowDown", {altKey: true}).defaultPrevented).toBe(false);
      unmount();
    });
  });

  describe("pressing the field itself", () => {
    it("focuses the last segment when the press lands past them all", () => {
      const {focused, root, unmount} = setup({
        locale: "en-US",
        placeholders: [false, false, false],
      });

      pointerdown(root);

      expect(focused()).toBe(2);
      unmount();
    });

    it("focuses the segment before where the press landed", () => {
      const {focused, root, unmount} = setup({
        locale: "en-US",
        placeholders: [false, false, false],
      });
      const separator = root.querySelectorAll<HTMLElement>("[data-slot='separator']")[1]!;

      pointerdown(separator);

      expect(focused()).toBe(1);
      unmount();
    });

    it("backs up over a run of empty segments", () => {
      /*
       * This is the point of the whole gesture: clicking a half-filled field carries on where the
       * typing stopped instead of jumping to the end.
       */
      const {focused, root, unmount} = setup({locale: "en-US", placeholders: [false, true, true]});

      pointerdown(root);

      expect(focused()).toBe(1);
      unmount();
    });

    it("keeps a filled segment when the run before it is filled too", () => {
      const {focused, root, unmount} = setup({locale: "en-US", placeholders: [true, false, false]});

      pointerdown(root);

      expect(focused()).toBe(2);
      unmount();
    });
  });
});
