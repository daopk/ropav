import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onMounted, shallowRef, toValue} from "vue";

import {focusableIn} from "../utils/focus";

export type ToolbarOrientation = "horizontal" | "vertical";

export interface UseToolbarProps {
  /** The toolbar element, read imperatively to move focus between its children. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Axis the controls are laid out along, which decides the arrow keys. */
  orientation?: MaybeRefOrGetter<ToolbarOrientation | undefined>;
}

export interface UseToolbarReturn {
  /** `"toolbar"`, or `"group"` when already inside one — toolbars do not nest. */
  role: ComputedRef<"toolbar" | "group">;
  /** Whether this is the outermost toolbar, and so the one owning the keyboard. */
  isOutermost: ComputedRef<boolean>;
  /** `keydown` handler. Attach on the capture phase so a nested group cannot claim it. */
  onKeydown: (event: KeyboardEvent) => void;
  /** `focusin` handler. Restores the last focused control when focus returns. */
  onFocusin: (event: FocusEvent) => void;
  /** `focusout` handler. Remembers where focus was when it leaves. */
  onFocusout: (event: FocusEvent) => void;
}

/**
 * Keyboard behaviour for the WAI-ARIA Toolbar pattern, the Vue counterpart of React
 * Aria's `useToolbar`.
 *
 * A toolbar is one tab stop's worth of *meaning* but not of markup: every control stays
 * tabbable, and the arrow keys move between them. Two details carry most of the value.
 * Tab moves focus to the far end of the toolbar first and then lets the browser continue,
 * so a keyboard user leaves the whole toolbar in one press instead of walking through
 * every button. And the control focus last sat on is restored when focus comes back from
 * outside, so returning to a toolbar does not reset the user to its first button.
 *
 * Only the outermost toolbar owns the keyboard. A nested one reports `role="group"` and
 * hands its keys upward, which is what keeps arrow keys from being consumed twice.
 *
 * @example
 * ```ts
 * const element = shallowRef<HTMLElement | null>(null);
 * const toolbar = useToolbar({element, orientation: () => props.orientation});
 * // <div :ref="element" :role="toolbar.role.value" @keydown.capture="toolbar.onKeydown">
 * ```
 */
export const useToolbar = (props: UseToolbarProps): UseToolbarReturn => {
  const isNested = shallowRef(false);

  onMounted(() => {
    const element = toValue(props.element);

    // Read from the parent up: the toolbar's own role must not match itself.
    isNested.value = Boolean(element?.parentElement?.closest('[role="toolbar"]'));
  });

  const orientation = computed(() => toValue(props.orientation) ?? "horizontal");
  const isOutermost = computed(() => !isNested.value);
  const role = computed<"toolbar" | "group">(() => (isNested.value ? "group" : "toolbar"));

  /** The control focus should return to, or `null` once it has been restored. */
  let lastFocused: HTMLElement | null = null;

  const moveFocus = (step: -1 | 1) => {
    const element = toValue(props.element);

    if (!element) return;

    const children = focusableIn(element);
    const index = children.findIndex((child) => child === document.activeElement);

    if (index === -1) return;

    // Clamped rather than wrapped, matching React Aria: the ends of a toolbar are a
    // boundary, not a loop.
    children[Math.min(Math.max(index + step, 0), children.length - 1)]?.focus();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!isOutermost.value) return;

    const element = toValue(props.element);
    const target = event.target;

    // A portalled control renders elsewhere in the DOM, so its keys are not ours.
    if (!element || !(target instanceof Node) || !element.contains(target)) return;

    // RTL mirrors the inline axis only; a vertical toolbar reads top to bottom either way.
    const isReversed =
      orientation.value === "horizontal" && getComputedStyle(element).direction === "rtl";
    const forward = orientation.value === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backward = orientation.value === "horizontal" ? "ArrowLeft" : "ArrowUp";

    if (event.key === forward) {
      moveFocus(isReversed ? -1 : 1);
    } else if (event.key === backward) {
      moveFocus(isReversed ? 1 : -1);
    } else if (event.key === "Tab") {
      // Park focus at the far end and let the browser take it from there, so one Tab
      // leaves the toolbar rather than stepping through the rest of its controls.
      const children = focusableIn(element);

      lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      (event.shiftKey ? children[0] : children[children.length - 1])?.focus();

      return;
    } else {
      return;
    }

    // Claimed: a nested group must not act on the same key, and the page must not scroll.
    event.stopPropagation();
    event.preventDefault();
  };

  const onFocusout = (event: FocusEvent) => {
    if (!isOutermost.value) return;

    const element = toValue(props.element);
    const next = event.relatedTarget;

    // Focus moving within the toolbar is not a departure, so nothing to remember.
    if (!element || (next instanceof Node && element.contains(next))) return;

    if (!lastFocused && event.target instanceof HTMLElement) lastFocused = event.target;
  };

  const onFocusin = (event: FocusEvent) => {
    if (!isOutermost.value || !lastFocused) return;

    const element = toValue(props.element);
    const previous = event.relatedTarget;

    // Only a return from outside restores; moving between controls inside must not fight
    // the focus the user just asked for.
    if (!element || (previous instanceof Node && element.contains(previous))) return;

    // The remembered control can have unmounted meanwhile, in which case whatever the
    // browser focused is already the right answer.
    if (lastFocused.isConnected) lastFocused.focus();

    lastFocused = null;
  };

  return {isOutermost, onFocusin, onFocusout, onKeydown, role};
};
