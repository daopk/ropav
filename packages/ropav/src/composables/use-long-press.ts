import type { PointerType, PressEvent, UsePressHandlers } from "./use-press";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { onScopeDispose, toValue } from "vue";

import { useDescription } from "./use-description";
import { usePress } from "./use-press";

/** How long the press has to be held before it counts as a long press. */
export const LONG_PRESS_THRESHOLD_MS = 500;

export interface LongPressEvent extends Omit<PressEvent, "type"> {
  type: "longpressstart" | "longpressend" | "longpress";
}

export interface UseLongPressOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Restricts the gesture to one pointer type. Both mouse and touch count by default. */
  pointerType?: MaybeRefOrGetter<"mouse" | "touch" | undefined>;
  onLongPressStart?: (event: LongPressEvent) => void;
  onLongPressEnd?: (event: LongPressEvent) => void;
  onLongPress?: (event: LongPressEvent) => void;
  /** @default 500 */
  threshold?: MaybeRefOrGetter<number | undefined>;
  /**
   * Text telling assistive technology that the press has to be held, e.g. "Long press to open
   * menu". Nothing on screen conveys this, so without it the gesture is undiscoverable.
   */
  accessibilityDescription?: MaybeRefOrGetter<string | undefined>;
}

export interface UseLongPressReturn {
  handlers: UsePressHandlers;
  /** The id of the description node, to render as `aria-describedby`. */
  describedBy: ComputedRef<string | undefined>;
}

/**
 * Long-press interactions across mouse and touch, ported from React Aria's `useLongPress`.
 *
 * Built on top of {@link usePress} rather than on raw pointer events, so a long press is
 * cancelled by everything that cancels a press — releasing early, dragging off the element,
 * the browser taking the pointer for a scroll.
 *
 * Two details carry the behaviour. The press events keep bubbling, because this observes a
 * press rather than consuming it, and swallowing it would stop the element's own press
 * handling. And once the threshold is met the element is sent a `pointercancel`, which is how
 * the ordinary press on the same element is called off — otherwise releasing after a long
 * press would activate the element as well as having opened whatever the long press opened.
 *
 * @example
 * ```ts
 * const longPress = useLongPress({
 *   accessibilityDescription: "Long press to open menu",
 *   onLongPress: () => state.open("first"),
 *   onLongPressStart: () => state.close(),
 * });
 * ```
 */
export const useLongPress = (options: UseLongPressOptions = {}): UseLongPressReturn => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const globalListeners: (() => void)[] = [];

  const addGlobalListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
    listenerOptions?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, listener, listenerOptions);
    globalListeners.push(() => target.removeEventListener(type, listener, listenerOptions));
  };

  const removeAllGlobalListeners = () => {
    for (const remove of globalListeners.splice(0)) remove();
  };

  const clearThreshold = () => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = undefined;
  };

  onScopeDispose(() => {
    clearThreshold();
    removeAllGlobalListeners();
  }, true);

  const isAcceptedPointerType = (pointerType: PointerType) => {
    const only = toValue(options.pointerType);

    return only ? pointerType === only : pointerType === "mouse" || pointerType === "touch";
  };

  const toLongPressEvent = (event: PressEvent, type: LongPressEvent["type"]): LongPressEvent => ({
    ...event,
    type,
  });

  const { handlers } = usePress({
    isDisabled: () => toValue(options.isDisabled),
    onPressEnd: (event) => {
      clearThreshold();

      if (isAcceptedPointerType(event.pointerType)) {
        options.onLongPressEnd?.(toLongPressEvent(event, "longpressend"));
      }
    },
    onPressStart: (event) => {
      // A long press is watched for, not consumed: the element's own press handling has to
      // keep working, and so does any pressable further up.
      event.continuePropagation();

      if (!isAcceptedPointerType(event.pointerType)) return;

      options.onLongPressStart?.(toLongPressEvent(event, "longpressstart"));

      timeout = setTimeout(
        () => {
          // Calls off the ordinary press on the same element, so releasing after a long press
          // does not also activate it.
          event.target.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));

          // A long press is not a click, and the browser would otherwise follow a link or
          // submit a form when the finger lifts.
          addGlobalListener(event.target, "click", (click) => click.preventDefault(), {
            once: true,
          });

          // Touch devices move focus on release rather than on the way down, and the element is
          // about to hand focus to whatever it opened.
          if (
            event.target instanceof HTMLElement &&
            event.target.ownerDocument.activeElement !== event.target
          ) {
            event.target.focus({ preventScroll: true });
          }

          // The press-and-hold menu the platform offers would compete with the one being
          // opened here.
          if (event.pointerType === "touch") {
            addGlobalListener(event.target, "contextmenu", (menu) => menu.preventDefault(), {
              once: true,
            });
          }

          options.onLongPress?.(toLongPressEvent(event, "longpress"));
          timeout = undefined;
        },
        toValue(options.threshold) ?? LONG_PRESS_THRESHOLD_MS,
      );

      // The click and contextmenu guards above are one-shot, but neither is guaranteed to
      // fire. Dropped shortly after release so a later, ordinary interaction is not blocked.
      addGlobalListener(
        window,
        "pointerup",
        () => {
          setTimeout(() => removeAllGlobalListeners(), 100);
        },
        { once: true },
      );
    },
  });

  const { describedBy } = useDescription(() =>
    options.onLongPress && !toValue(options.isDisabled)
      ? toValue(options.accessibilityDescription)
      : undefined,
  );

  return { describedBy, handlers };
};
