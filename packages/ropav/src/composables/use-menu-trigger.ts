import type { PressResponder } from "./press-responder";
import type { OverlayType } from "./use-overlay-trigger";
import type { FocusStrategy, MenuTriggerState } from "./use-overlay-trigger-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue } from "vue";

import { useId } from "./use-id";
import { useLongPress } from "./use-long-press";
import { useOverlayTrigger } from "./use-overlay-trigger";
import { usePress } from "./use-press";

/** How the menu is opened. */
export type MenuTriggerType = "press" | "longPress";

export interface UseMenuTriggerOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** @default "press" */
  trigger?: MaybeRefOrGetter<MenuTriggerType | undefined>;
  /**
   * What the trigger opens, which decides how `aria-haspopup` is announced.
   *
   * A select opens a listbox rather than a menu, and the two are announced differently — but the
   * gesture is the same one, which is why React Aria's `useSelect` reaches for this hook instead
   * of repeating it.
   *
   * @default "menu"
   */
  type?: OverlayType;
  /**
   * Told to assistive technology when the menu opens on a long press, which nothing on screen
   * conveys.
   *
   * @default "Long press or press Alt + ArrowDown to open menu"
   */
  longPressDescription?: MaybeRefOrGetter<string | undefined>;
}

export interface UseMenuTriggerReturn {
  /** Hand to `providePressResponder`, so the trigger element picks all of this up. */
  responder: PressResponder;
  /** The trigger's id, which the menu and its popover are labelled by. */
  triggerId: ComputedRef<string>;
  /** The overlay's id, which the menu carries. */
  overlayId: ComputedRef<string>;
  /** The trigger element, which the popover is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
  /** Where focus should land in the menu, given how it was opened. */
  autoFocus: ComputedRef<boolean | FocusStrategy>;
}

export const DEFAULT_LONG_PRESS_DESCRIPTION = "Long press or press Alt + ArrowDown to open menu";

/**
 * Turn any pressable into a menu trigger, ported from React Aria's `useMenuTrigger`.
 *
 * The interesting part is that a menu opens at different moments depending on how it was reached,
 * and each choice matches the platform. A mouse opens it on the way *down*, as every desktop menu
 * does. Touch opens it on release, because a menu appearing under a finger still on the glass
 * would land where the finger is about to lift. A keyboard opens it on the key that implies a
 * direction — ArrowUp opens the menu with its last item focused — and a screen reader, which
 * clicks with no pointer behind it, opens it focused on the first item, since there is no pointer
 * to carry on with.
 *
 * @example
 * ```ts
 * const state = useMenuTriggerState({isOpen: () => props.isOpen});
 * const trigger = useMenuTrigger({trigger: () => props.trigger}, state);
 *
 * providePressResponder(trigger.responder);
 * ```
 */
export const useMenuTrigger = (
  options: UseMenuTriggerOptions,
  state: MenuTriggerState,
): UseMenuTriggerReturn => {
  const triggerId = useId();
  const element = shallowRef<HTMLElement | null>(null);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const triggerType = computed(() => toValue(options.trigger) ?? "press");
  const isLongPress = computed(() => triggerType.value === "longPress");

  const { overlayId, triggerAttributes } = useOverlayTrigger(
    { type: options.type ?? "menu" },
    state,
  );

  /** Focus the trigger before opening, so focus has somewhere to come back to on close. */
  const focusTrigger = () => {
    element.value?.focus({ preventScroll: true });
  };

  const press = usePress({
    // Disabled wholesale in long-press mode, where the long-press detector drives the trigger.
    isDisabled: () => isDisabled.value || isLongPress.value,
    // The trigger looks pressed for as long as its menu is open.
    isPressed: () => state.isOpen.value,
    onPress: (event) => {
      if (event.pointerType !== "touch") return;

      focusTrigger();
      state.toggle();
    },
    onPressStart: (event) => {
      if (event.pointerType === "touch" || event.pointerType === "keyboard") return;

      focusTrigger();
      // A screen reader has no pointer to carry on with, so it lands on the first item; a real
      // pointer leaves focus on the menu, ready for the arrow keys.
      state.open(event.pointerType === "virtual" ? "first" : null);
    },
    // The menu takes focus itself; letting the browser focus the trigger first would show as a
    // flash of focus on the way past.
    preventFocusOnPress: true,
  });

  const longPress = useLongPress({
    accessibilityDescription: () =>
      toValue(options.longPressDescription) ?? DEFAULT_LONG_PRESS_DESCRIPTION,
    isDisabled: () => isDisabled.value || !isLongPress.value,
    onLongPress: () => state.open("first"),
    // Any menu already open belongs to the previous press, and it would sit over the new one.
    onLongPressStart: () => state.close(),
  });

  const open = (strategy: FocusStrategy) => {
    focusTrigger();
    state.toggle(strategy);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (isDisabled.value) return;

    // Typeahead in a menu below claims Space while a search is running, and an already-handled
    // key must not also open the menu.
    if (event.defaultPrevented && event.key !== "Enter" && event.key !== " ") return;

    // Alt+Arrow is the platform gesture for "show me the menu", and it is the only keyboard way
    // in when the menu is otherwise opened by holding the trigger.
    if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      event.stopPropagation();
      open(event.key === "ArrowDown" ? "first" : "last");

      return;
    }

    if (isLongPress.value) return;

    switch (event.key) {
      case " ":
      case "Enter":
      case "ArrowDown": {
        event.preventDefault();
        event.stopPropagation();
        open("first");

        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        event.stopPropagation();
        open("last");

        return;
      }
      default:
        return;
    }
  };

  const responder: PressResponder = {
    attrs: computed(() => ({
      ...triggerAttributes.value,
      "aria-describedby": longPress.describedBy.value,
      id: triggerId.value,
    })),
    handlers: computed(() => {
      const handlers = isLongPress.value ? longPress.handlers : press.handlers;

      return {
        ...handlers,
        onKeydown: (event: KeyboardEvent) => {
          handlers.onKeydown(event);
          onKeydown(event);
        },
      };
    }),
    isPressed: press.isPressed,
    registerElement: (next) => {
      element.value = next;
    },
  };

  return {
    // A menu opened by pointer leaves focus on the menu itself; one opened by keyboard or screen
    // reader carries a strategy that says which end to start from.
    autoFocus: computed(() => state.focusStrategy.value ?? true),
    overlayId,
    responder,
    triggerElement: computed(() => element.value),
    triggerId,
  };
};
