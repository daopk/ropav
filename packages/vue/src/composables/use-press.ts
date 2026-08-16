import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, shallowRef, toValue, watch} from "vue";

import {isMac} from "../utils/platform";

/**
 * How the press reached the element.
 *
 * `"virtual"` is a click with no pointer behind it — a screen reader activating the element,
 * or `element.click()` from script. It is worth distinguishing because a virtual click has no
 * pointerdown to open on, so a trigger has to react to the click itself.
 */
export type PointerType = "mouse" | "touch" | "pen" | "keyboard" | "virtual";

export interface PressEvent {
  type: "pressstart" | "pressend" | "pressup" | "press";
  pointerType: PointerType;
  target: Element;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  /** The key that produced a keyboard press, absent otherwise. */
  key?: string;
  /**
   * Keeps the event bubbling. A press handler stops propagation by default so a press does
   * not also register on an enclosing pressable, which is wrong for a wrapper that only
   * observes the press — a long-press detector, for one.
   */
  continuePropagation: () => void;
  /** @private Read after the handler has run. */
  shouldStopPropagation: boolean;
}

export interface UsePressOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Forces the pressed state on. A trigger uses this to stay pressed for as long as the
   * overlay it owns is open.
   */
  isPressed?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Keeps the browser from moving focus to the element on pointerdown, for a control that
   * hands focus somewhere else — a menu trigger gives it to the menu.
   */
  preventFocusOnPress?: MaybeRefOrGetter<boolean | undefined>;
  onPress?: (event: PressEvent) => void;
  onPressStart?: (event: PressEvent) => void;
  onPressEnd?: (event: PressEvent) => void;
  onPressUp?: (event: PressEvent) => void;
  onPressChange?: (isPressed: boolean) => void;
}

export interface UsePressHandlers {
  onClick: (event: MouseEvent) => void;
  onDragstart: (event: DragEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onMousedown: (event: MouseEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
  onPointerenter: (event: PointerEvent) => void;
  onPointerleave: (event: PointerEvent) => void;
  onPointerup: (event: PointerEvent) => void;
}

export interface UsePressReturn {
  isPressed: ComputedRef<boolean>;
  /**
   * Every listener the press machine needs. Attach each one statically with `@event`, never
   * through `v-bind`: a vapor render re-attaches every `on*` key that arrived that way, which
   * both reorders the listeners and drops one mid-dispatch. `composePressResponder` wraps these
   * for that, and is where the reason is written out.
   */
  handlers: UsePressHandlers;
}

/**
 * Whether a click came from something other than a pointer.
 *
 * Ported from React Aria's `isVirtualClick`. A screen reader and `element.click()` both
 * produce a click with no pointer data behind it, which is the only way to tell them apart
 * from a real one.
 */
export const isVirtualClick = (event: MouseEvent): boolean => {
  // Firefox with a screen reader reports an empty pointer type on a trusted event.
  if ((event as PointerEvent).pointerType === "" && event.isTrusted) return true;

  return event.detail === 0 && !(event as PointerEvent).pointerType;
};

/**
 * Whether a pointer event was synthesised by assistive technology.
 *
 * A screen reader activating an element reports a zero-sized pointer. Safari on iOS gives
 * such events the wrong coordinates and target, so they have to be left to the click handler.
 */
export const isVirtualPointerEvent = (event: PointerEvent): boolean =>
  event.width === 0 && event.height === 0;

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

const isHtmlAnchorLink = (target: Element): boolean =>
  target.tagName === "A" && target.hasAttribute("href");

const isValidInputKey = (target: HTMLInputElement, key: string): boolean =>
  target.type === "checkbox" || target.type === "radio"
    ? key === " "
    : NON_TEXT_INPUT_TYPES.has(target.type);

/**
 * Whether Enter or Space on this element means "press it".
 *
 * A text field needs both keys for itself, and a link is activated by Enter only — Space
 * scrolls the page there.
 */
const isValidKeyboardEvent = (event: KeyboardEvent, target: Element): boolean => {
  if (
    event.key !== "Enter" &&
    event.key !== " " &&
    event.key !== "Spacebar" &&
    event.code !== "Space"
  ) {
    return false;
  }

  const element = target as HTMLElement;

  if (element instanceof HTMLTextAreaElement || element.isContentEditable) return false;
  if (element instanceof HTMLInputElement && !isValidInputKey(element, event.key)) return false;

  const role = element.getAttribute("role");
  const isLink = role === "link" || (!role && isHtmlAnchorLink(element));

  return !(isLink && event.key !== "Enter");
};

/** Whether the release default belongs to the browser rather than the press abstraction. */
const shouldPreventDefaultUp = (target: Element): boolean => {
  if (target instanceof HTMLInputElement) return false;
  if (target instanceof HTMLButtonElement)
    return target.type !== "submit" && target.type !== "reset";
  if (isHtmlAnchorLink(target)) return false;

  return true;
};

/**
 * Match React Aria's keyboard-default carve-outs. Native links must retain their own activation
 * so modifier keys survive, while macOS Enter must remain available to the context-menu shortcut.
 */
const shouldPreventDefaultKeyboard = (target: Element, key: string): boolean => {
  if (isMac() && key === "Enter") return false;

  if (target instanceof HTMLInputElement) {
    // Enter submits a form around a checkbox/radio; it must not toggle the control.
    if (key === "Enter" && (target.type === "checkbox" || target.type === "radio")) return false;

    return !isValidInputKey(target, key);
  }

  return shouldPreventDefaultUp(target);
};

/** Whether an element in the tree from `root` down received the event. */
const contains = (root: EventTarget | null, target: EventTarget | null): boolean =>
  root instanceof Node && target instanceof Node && root.contains(target);

/**
 * Press interactions across mouse, touch, keyboard and assistive technology, ported from
 * React Aria's `usePress`.
 *
 * The reason a component cannot just use `click` is that a press is several distinct moments
 * and different controls act on different ones. A menu trigger opens on *pressstart* for a
 * mouse — matching the platform, where a menu appears on the way down — but on *press* for
 * touch, because opening under a finger that is still on the glass would put the menu where
 * the finger is about to lift. A long-press trigger needs the start and the end without the
 * press in between. And a press that begins on an element, drags away and releases elsewhere
 * must not activate, which `:active` and `click` both get wrong.
 *
 * Only the pointer-event path is ported. React Aria keeps a mouse/touch fallback for
 * environments without `PointerEvent`; every browser this package targets has it, and so does
 * jsdom, so the fallback would be untested code.
 *
 * @example
 * ```ts
 * const press = usePress({
 *   onPressStart: (event) => { if (event.pointerType !== "touch") state.open(); },
 *   onPress: (event) => { if (event.pointerType === "touch") state.toggle(); },
 * });
 * // <button :data-pressed="dataAttr(press.isPressed.value)"
 * //   @click="press.handlers.onClick" @pointerdown="press.handlers.onPointerdown">
 * ```
 */
export const usePress = (options: UsePressOptions = {}): UsePressReturn => {
  const pressed = shallowRef(false);
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));

  interface PressState {
    isPressed: boolean;
    didFirePressStart: boolean;
    /** Set while a handler is running, so the click it may synthesise is not handled twice. */
    isTriggeringEvent: boolean;
    activePointerId: number | null;
    target: Element | null;
    isOverTarget: boolean;
    pointerType: PointerType | null;
    disposables: (() => void)[];
  }

  const state: PressState = {
    activePointerId: null,
    didFirePressStart: false,
    disposables: [],
    isOverTarget: false,
    isPressed: false,
    isTriggeringEvent: false,
    pointerType: null,
    target: null,
  };

  const globalListeners: (() => void)[] = [];

  const addGlobalListener = <K extends keyof DocumentEventMap>(
    target: Document | Window,
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
    capture = false,
  ) => {
    target.addEventListener(type, listener as EventListener, capture);
    globalListeners.push(() =>
      target.removeEventListener(type, listener as EventListener, capture),
    );
  };

  const removeAllGlobalListeners = () => {
    for (const remove of globalListeners.splice(0)) remove();
  };

  const runDisposables = () => {
    for (const dispose of state.disposables.splice(0)) dispose();
  };

  const createPressEvent = (
    type: PressEvent["type"],
    pointerType: PointerType,
    source: {
      target?: Element | null;
      altKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
      key?: string;
    },
  ): PressEvent => {
    const event: PressEvent = {
      altKey: Boolean(source.altKey),
      continuePropagation: () => {
        event.shouldStopPropagation = false;
      },
      ctrlKey: Boolean(source.ctrlKey),
      key: source.key,
      metaKey: Boolean(source.metaKey),
      pointerType,
      shiftKey: Boolean(source.shiftKey),
      shouldStopPropagation: true,
      target: (source.target ?? state.target) as Element,
      type,
    };

    return event;
  };

  const triggerPressStart = (
    source: Parameters<typeof createPressEvent>[2],
    pointerType: PointerType,
  ): boolean => {
    if (isDisabled.value || state.didFirePressStart) return false;

    let shouldStopPropagation = true;

    state.isTriggeringEvent = true;

    if (options.onPressStart) {
      const event = createPressEvent("pressstart", pointerType, source);

      options.onPressStart(event);
      shouldStopPropagation = event.shouldStopPropagation;
    }

    options.onPressChange?.(true);

    state.isTriggeringEvent = false;
    state.didFirePressStart = true;
    pressed.value = true;

    return shouldStopPropagation;
  };

  const triggerPressEnd = (
    source: Parameters<typeof createPressEvent>[2],
    pointerType: PointerType,
    wasPressed = true,
  ): boolean => {
    if (!state.didFirePressStart) return false;

    state.didFirePressStart = false;
    state.isTriggeringEvent = true;

    let shouldStopPropagation = true;

    if (options.onPressEnd) {
      const event = createPressEvent("pressend", pointerType, source);

      options.onPressEnd(event);
      shouldStopPropagation = event.shouldStopPropagation;
    }

    options.onPressChange?.(false);
    pressed.value = false;

    // `wasPressed` is what separates a completed press from an abandoned one: releasing away
    // from the element still ends the press, but must not activate it.
    if (options.onPress && wasPressed && !isDisabled.value) {
      const event = createPressEvent("press", pointerType, source);

      options.onPress(event);
      shouldStopPropagation = shouldStopPropagation && event.shouldStopPropagation;
    }

    state.isTriggeringEvent = false;

    return shouldStopPropagation;
  };

  const triggerPressUp = (
    source: Parameters<typeof createPressEvent>[2],
    pointerType: PointerType,
  ): boolean => {
    if (isDisabled.value) return false;

    if (options.onPressUp) {
      state.isTriggeringEvent = true;

      const event = createPressEvent("pressup", pointerType, source);

      options.onPressUp(event);
      state.isTriggeringEvent = false;

      return event.shouldStopPropagation;
    }

    return true;
  };

  const cancel = (source: Parameters<typeof createPressEvent>[2]) => {
    if (!state.isPressed || !state.target) return;

    if (state.didFirePressStart && state.pointerType !== null) {
      triggerPressEnd({...source, target: state.target}, state.pointerType, false);
    }

    state.isPressed = false;
    state.isOverTarget = false;
    state.activePointerId = null;
    state.pointerType = null;
    removeAllGlobalListeners();
    runDisposables();
  };

  // A control disabled mid-press would otherwise stay stuck pressed, with its pointerup
  // listeners still attached to the document.
  watch(isDisabled, (disabled) => {
    if (disabled && state.isPressed) cancel({target: state.target});
  });

  onScopeDispose(() => {
    removeAllGlobalListeners();
    runDisposables();
  }, true);

  const onKeyup = (event: KeyboardEvent) => {
    if (!state.isPressed || !state.target || !isValidKeyboardEvent(event, state.target)) return;

    const eventTarget = event.target instanceof Element ? event.target : state.target;

    if (shouldPreventDefaultKeyboard(eventTarget, event.key)) event.preventDefault();

    const wasPressed = contains(state.target, event.target);

    triggerPressEnd(
      {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        key: event.key,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        target: state.target,
      },
      "keyboard",
      wasPressed,
    );

    removeAllGlobalListeners();
    state.isPressed = false;
  };

  const onKeydown = (event: KeyboardEvent) => {
    const currentTarget = event.currentTarget as Element | null;

    if (!currentTarget) return;
    if (!isValidKeyboardEvent(event, currentTarget)) return;
    if (!contains(currentTarget, event.target)) return;

    const eventTarget = event.target instanceof Element ? event.target : currentTarget;

    if (shouldPreventDefaultKeyboard(eventTarget, event.key)) event.preventDefault();

    let shouldStopPropagation = true;

    // A held key repeats; only the first one starts a press, and a repeat may even arrive
    // after focus moved here from somewhere else.
    if (!state.isPressed && !event.repeat) {
      state.target = currentTarget;
      state.isPressed = true;
      state.pointerType = "keyboard";
      shouldStopPropagation = triggerPressStart(
        {
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          key: event.key,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          target: currentTarget,
        },
        "keyboard",
      );
    }

    // Focus can move before the key is released — opening a menu does exactly that — so the
    // keyup is listened for on the document rather than on this element.
    addGlobalListener(
      currentTarget.ownerDocument,
      "keyup",
      (keyup: KeyboardEvent) => {
        if (
          isValidKeyboardEvent(keyup, state.target ?? currentTarget) &&
          !keyup.repeat &&
          contains(currentTarget, keyup.target) &&
          state.target
        ) {
          triggerPressUp(
            {
              altKey: keyup.altKey,
              ctrlKey: keyup.ctrlKey,
              key: keyup.key,
              metaKey: keyup.metaKey,
              shiftKey: keyup.shiftKey,
              target: state.target,
            },
            "keyboard",
          );
        }

        onKeyup(keyup);
      },
      true,
    );

    if (shouldStopPropagation) event.stopPropagation();
  };

  const onClick = (event: MouseEvent) => {
    const currentTarget = event.currentTarget as Element | null;

    if (!currentTarget || !contains(currentTarget, event.target)) return;
    if (event.button !== 0 || state.isTriggeringEvent) return;

    let shouldStopPropagation = true;

    if (isDisabled.value) event.preventDefault();

    const source = {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      target: currentTarget,
    };

    if (!state.isPressed && (state.pointerType === "virtual" || isVirtualClick(event))) {
      // No pointer sequence happened, so the whole press is played out here.
      const stopStart = triggerPressStart(source, "virtual");
      const stopUp = triggerPressUp(source, "virtual");
      const stopEnd = triggerPressEnd(source, "virtual");

      shouldStopPropagation = stopStart && stopUp && stopEnd;
    } else if (state.isPressed && state.pointerType !== "keyboard") {
      const pointerType = state.pointerType ?? "virtual";
      const stopUp = triggerPressUp(source, pointerType);
      const stopEnd = triggerPressEnd(source, pointerType, true);

      shouldStopPropagation = stopUp && stopEnd;
      state.isOverTarget = false;
      cancel(source);
    }

    if (shouldStopPropagation) event.stopPropagation();
  };

  const onPointerup = (event: PointerEvent) => {
    if (event.pointerId !== state.activePointerId || !state.isPressed || event.button !== 0) return;
    if (!state.target) return;

    if (contains(state.target, event.target) && state.pointerType !== null) {
      // The press is completed by the click that follows, not here: the DOM may be rewritten
      // between pointerup and click, and deciding on the click keeps this consistent with
      // however the rest of the page reads the same interaction.
      //
      // iOS and Android do not always send that click — after a long press they send none at
      // all — so one is synthesised if it has not arrived shortly. The timeout has to clear
      // 32ms, below which Safari on iOS is still holding the real click back for its hover
      // emulation, and it is cancelled if the real one wins the race.
      let clicked = false;
      const timeout = setTimeout(() => {
        if (!state.isPressed || !(state.target instanceof HTMLElement)) return;

        if (clicked) cancel({target: state.target});
        else state.target.click();
      }, 80);

      addGlobalListener(
        (event.currentTarget as Document) ?? document,
        "click",
        () => {
          clicked = true;
        },
        true,
      );
      state.disposables.push(() => clearTimeout(timeout));

      return;
    }

    cancel({target: state.target});
    state.isOverTarget = false;
  };

  const onPointercancel = () => {
    cancel({target: state.target});
  };

  const handlers: UsePressHandlers = {
    onClick,
    onDragstart: (event) => {
      // Safari does not send pointercancel when a drag begins, so a dragged-away press would
      // stay open forever.
      if (contains(event.currentTarget, event.target)) cancel({target: state.target});
    },
    onKeydown,
    onMousedown: (event) => {
      if (event.button !== 0 || !contains(event.currentTarget, event.target)) return;

      if (toValue(options.preventFocusOnPress)) event.preventDefault();
    },
    onPointerdown: (event) => {
      if (event.button !== 0 || !contains(event.currentTarget, event.target)) return;

      // Safari on iOS reports screen-reader activations as pointer events with the wrong
      // target, so they are recognised here and answered by the click handler instead.
      if (isVirtualPointerEvent(event)) {
        state.pointerType = "virtual";

        return;
      }

      state.pointerType = event.pointerType as PointerType;

      let shouldStopPropagation = true;

      if (!state.isPressed) {
        state.isPressed = true;
        state.isOverTarget = true;
        state.activePointerId = event.pointerId;
        state.target = event.currentTarget as Element;

        shouldStopPropagation = triggerPressStart(
          {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            target: state.target,
          },
          state.pointerType,
        );

        // Touch captures the pointer to its first target, which would keep enter and leave
        // from ever firing again once the finger moves off.
        const target = event.target as Element;

        if ("releasePointerCapture" in target && typeof target.hasPointerCapture === "function") {
          if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
          }
        }

        const ownerDocument = (event.currentTarget as Element).ownerDocument;

        addGlobalListener(ownerDocument, "pointerup", onPointerup);
        addGlobalListener(ownerDocument, "pointercancel", onPointercancel);
      }

      if (shouldStopPropagation) event.stopPropagation();
    },
    onPointerenter: (event) => {
      if (
        event.pointerId === state.activePointerId &&
        state.target &&
        !state.isOverTarget &&
        state.pointerType !== null
      ) {
        state.isOverTarget = true;
        triggerPressStart({target: state.target}, state.pointerType);
      }
    },
    onPointerleave: (event) => {
      if (
        event.pointerId === state.activePointerId &&
        state.target &&
        state.isOverTarget &&
        state.pointerType !== null
      ) {
        state.isOverTarget = false;
        triggerPressEnd({target: state.target}, state.pointerType, false);
      }
    },
    onPointerup: (event) => {
      if (!contains(event.currentTarget, event.target) || state.pointerType === "virtual") return;

      // While a press is in flight the release is answered by the click, so only a stray
      // pointerup with no press behind it reports a press-up from here.
      if (event.button === 0 && !state.isPressed) {
        triggerPressUp(
          {target: event.currentTarget as Element},
          state.pointerType ?? (event.pointerType as PointerType),
        );
      }
    },
  };

  return {
    handlers,
    isPressed: computed(() => Boolean(toValue(options.isPressed)) || pressed.value),
  };
};
