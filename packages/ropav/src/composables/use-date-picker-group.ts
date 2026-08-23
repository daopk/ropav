import type {UsePressHandlers} from "./use-press";
import type {FocusManager} from "../utils/focus";
import type {MaybeRefOrGetter} from "vue";

import {toValue} from "vue";

import {createFocusManager, tabbableIn} from "../utils/focus";

import {useLocale} from "./use-locale";
import {usePress} from "./use-press";

export interface UseDatePickerGroupOptions {
  /** The element focus moves around inside. A getter, because it does not exist yet at setup. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /**
   * Opens the overlay this group belongs to.
   *
   * Absent on a plain field, which has no overlay, and then Alt with an arrow is left alone.
   */
  setOpen?: (open: boolean) => void;
  /**
   * Leaves the arrow keys alone, for a field nested inside a picker that steers them itself.
   */
  disableArrowNavigation?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseDatePickerGroupReturn {
  /** Moves focus between the group's segments. The segments themselves need it too. */
  focusManager: FocusManager;
  /** Wire on the group with `@keydown`. */
  onKeydown: (event: KeyboardEvent) => void;
  /** Press listeners for the group. Attach each one statically, never through `v-bind`. */
  handlers: UsePressHandlers;
}

/**
 * The segment nearest `fromX` on the given side, measured rather than counted.
 *
 * In a right-to-left locale the segments are laid out right to left while staying in date order in
 * the DOM, so "the next segment to the left" is a question about geometry, not about document
 * order.
 */
const findNextSegment = (
  group: HTMLElement,
  fromX: number,
  direction: 1 | -1,
): HTMLElement | null => {
  let closest: HTMLElement | null = null;
  let closestDistance = Infinity;

  for (const node of tabbableIn(group)) {
    const distance = node.getBoundingClientRect().left - fromX;
    const absolute = Math.abs(distance);

    if (Math.sign(distance) === direction && absolute < closestDistance) {
      closest = node;
      closestDistance = absolute;
    }
  }

  return closest;
};

/**
 * Keyboard and pointer behaviour for the group around a field's segments.
 *
 * Ported from React Aria's `packages/react-aria/src/datepicker/useDatePickerGroup.ts`
 * (react-aria 3.51.0).
 *
 * Clicking the empty part of a field is the interesting case: it puts the cursor on the last
 * segment before the click that still has nothing in it, so clicking a half-filled field carries
 * on where the typing left off rather than jumping to the end.
 */
export const useDatePickerGroup = (
  options: UseDatePickerGroupOptions,
): UseDatePickerGroupReturn => {
  const locale = useLocale();
  const getElement = () => toValue(options.element);
  const focusManager = createFocusManager(getElement);

  /** Focus the last segment before `target` that is still empty, or the last one of all. */
  const focusLast = (target: Element | null) => {
    const group = getElement();

    if (!group) return;

    const stops = tabbableIn(group);

    if (stops.length === 0) return;

    /*
     * The segment before wherever the press landed. React reads `window.event` for this; the press
     * event already carries its target, so nothing global is consulted here.
     */
    const preceding = target
      ? stops.filter((node) =>
          Boolean(target.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING),
        )
      : [];
    // Nothing before the press means the press was before everything, and the field's last
    // segment is the one to land on.
    let index =
      preceding.length > 0 ? stops.indexOf(preceding[preceding.length - 1]!) : stops.length - 1;

    // Then back up over a run of empty segments, so a field half filled in resumes where it was.
    while (
      index > 0 &&
      stops[index]?.hasAttribute("data-placeholder") &&
      stops[index - 1]?.hasAttribute("data-placeholder")
    ) {
      index -= 1;
    }

    stops[index]?.focus();
  };

  /**
   * Where the last press actually landed.
   *
   * A press event reports the group as its target, since that is what the listener is on, but
   * which segment to focus depends on where inside the group the pointer went down. React reaches
   * for `window.event` to recover that; recording it on the way through is the same information
   * without the global.
   */
  let pressTarget: Element | null = null;

  const {handlers: pressHandlers} = usePress({
    onPress: (event) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") focusLast(pressTarget);
    },
    onPressStart: (event) => {
      if (event.pointerType === "mouse") focusLast(pressTarget);
    },
    // The press only moves focus, so the browser must not also move it to the group itself.
    preventFocusOnPress: true,
  });

  const handlers: UsePressHandlers = {
    ...pressHandlers,
    onPointerdown: (event) => {
      pressTarget = event.target instanceof Element ? event.target : null;
      pressHandlers.onPointerdown(event);
    },
  };

  const onKeydown = (event: KeyboardEvent) => {
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      if (options.setOpen) {
        options.setOpen(true);
        handled();
      }

      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (toValue(options.disableArrowNavigation)) return;

    const forwards = event.key === "ArrowRight";

    if (locale.value.direction !== "rtl") {
      if (forwards) focusManager.focusNext();
      else focusManager.focusPrevious();
      handled();

      return;
    }

    const group = getElement();
    const target = event.target;

    if (!group || !(target instanceof HTMLElement)) return;

    const next = findNextSegment(group, target.getBoundingClientRect().left, forwards ? 1 : -1);

    if (next) {
      next.focus();
      handled();
    }
  };

  return {focusManager, handlers, onKeydown};
};
