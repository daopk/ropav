<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";

import { computed, onScopeDispose, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { useSubmenuTriggerState } from "../../composables/use-overlay-trigger-state";
import { provideMenuItemPopupContext } from "../menu-item/menu-item.context";
import { useMenuContext } from "../menu/menu.context";

import { provideDropdownPopoverTarget, useDropdownContext } from "./dropdown.context";
import { useSafelyMouseToSubmenu } from "./use-safely-mouse-to-submenu";

/** How long the pointer has to rest on the trigger before the submenu opens. */
const HOVER_DELAY_MS = 200;

const props = withDefaults(defineProps<{ delay?: number; isDisabled?: boolean }>(), {
  delay: HOVER_DELAY_MS,
});

defineSlots<{ default?: () => unknown }>();

const parentMenu = useMenuContext();
const dropdown = useDropdownContext();

const overlayId = useId();

/**
 * The item that opens this submenu.
 *
 * Reported by the item rather than passed in, because the item and the submenu are siblings in the
 * markup: this component wraps both, but cannot read the item's `id` out of its own slot content.
 * Until the item has said so the submenu has no identity and stays closed.
 */
const triggerKey = shallowRef<CollectionKey | null>(null);
const triggerId = shallowRef<string>("");
const triggerElement = shallowRef<HTMLElement | null>(null);
const submenuElement = shallowRef<HTMLElement | null>(null);

/**
 * The submenu's open state, derived from the root's stack.
 *
 * The level is fixed when this trigger is created, which is what places it in the tree; the key
 * decides whether the submenu open at that level is this one.
 */
const state = useSubmenuTriggerState({ triggerKey }, dropdown.state);

const isDisabled = computed(() => Boolean(props.isDisabled));

let openTimeout: ReturnType<typeof setTimeout> | undefined;

const cancelOpenTimeout = () => {
  if (openTimeout !== undefined) clearTimeout(openTimeout);
  openTimeout = undefined;
};

onScopeDispose(() => cancelOpenTimeout(), true);

const openSubmenu = (strategy?: "first" | "last") => {
  cancelOpenTimeout();
  state.open(strategy ?? null);
};

const closeSubmenu = () => {
  cancelOpenTimeout();
  state.close();
};

const focusTrigger = () => {
  triggerElement.value?.focus({ preventScroll: true });
};

/**
 * Close the submenu when focus lands somewhere else in the menu that opened it.
 *
 * Hovering another item moves focus to it, and a submenu left open beside an unrelated item reads
 * as that item's submenu. Driven by the focus event rather than by watching the focused key,
 * because the key settles a tick later and by then it can no longer be told apart from focus that
 * moved into the submenu itself.
 */
watch(
  () => parentMenu.element.value,
  (menu, _previous, onCleanup) => {
    if (!menu) return;

    const onFocusin = (event: FocusEvent) => {
      if (!state.isOpen.value) return;

      const focused = event.target;

      if (!(focused instanceof Node) || !menu.contains(focused)) return;
      if (focused === triggerElement.value) return;

      closeSubmenu();
    };

    menu.addEventListener("focusin", onFocusin);
    onCleanup(() => menu.removeEventListener("focusin", onFocusin));
  },
  { flush: "post", immediate: true },
);

// Without this, the diagonal path from the trigger to the submenu crosses the items below it, each
// of which takes focus on hover and closes the submenu being aimed at.
useSafelyMouseToSubmenu({
  isDisabled,
  isOpen: () => state.isOpen.value,
  menuRef: () => parentMenu.element.value,
  submenuRef: () => submenuElement.value,
});

/** ArrowRight opens the submenu and steps into it; the mirror image in a right-to-left document. */
const onTriggerKeydown = (event: KeyboardEvent) => {
  if (isDisabled.value) return;

  const direction =
    triggerElement.value && getComputedStyle(triggerElement.value).direction === "rtl"
      ? "rtl"
      : "ltr";
  const forwards = direction === "ltr" ? "ArrowRight" : "ArrowLeft";
  const backwards = direction === "ltr" ? "ArrowLeft" : "ArrowRight";

  if (event.key === forwards) {
    event.preventDefault();
    event.stopPropagation();

    if (!state.isOpen.value) openSubmenu("first");
    // Already open: the key means "go in", so focus follows.
    else submenuElement.value?.focus({ preventScroll: true });

    return;
  }

  // Left on a closed trigger belongs to the menu above, which uses it to close itself.
  if (event.key === backwards && state.isOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    closeSubmenu();
    focusTrigger();
  }
};

/** Inside the submenu, the same key going the other way steps back out. */
const onSubmenuKeydown = (event: KeyboardEvent) => {
  const submenu = submenuElement.value;

  if (!submenu) return;

  const direction = getComputedStyle(submenu).direction === "rtl" ? "rtl" : "ltr";
  const backwards = direction === "ltr" ? "ArrowLeft" : "ArrowRight";

  if (event.key !== backwards) return;

  event.preventDefault();
  event.stopPropagation();
  closeSubmenu();
  focusTrigger();
};

provideMenuItemPopupContext({
  isOpen: state.isOpen,
  onActivate: (source) => {
    if (isDisabled.value) return;

    // A keyboard or screen reader activation has no pointer to carry on with, so it lands on the
    // first item; a pointer leaves focus where it is and lets the pointer keep going.
    openSubmenu(source === "keyboard" ? "first" : undefined);
  },
  onKeydown: onTriggerKeydown,
  onPointerenter: () => {
    if (isDisabled.value || state.isOpen.value || openTimeout !== undefined) return;

    // Delayed, so passing over the trigger on the way somewhere else does not open it.
    openTimeout = setTimeout(() => {
      openTimeout = undefined;
      state.open(null);
    }, props.delay);
  },
  onPointerleave: () => cancelOpenTimeout(),
  popupId: computed(() => (state.isOpen.value ? overlayId.value : undefined)),
  registerTrigger: ({ element, id, key }) => {
    triggerKey.value = key;
    triggerId.value = id;
    triggerElement.value = element();

    return () => {
      if (triggerKey.value !== key) return;

      triggerKey.value = null;
      triggerId.value = "";
      triggerElement.value = null;
    };
  },
});

provideDropdownPopoverTarget({
  autoFocus: computed(() => state.focusStrategy.value ?? true),
  // Choosing an item in a submenu dismisses the menu it was reached through, not just this one.
  closeAll: state.closeAll,
  // The menu that opened this one is behind it and has to keep working, so the page is not made
  // inert and its scroll is not held.
  isNonModal: true,
  labelledBy: computed(() => triggerId.value),
  onKeydown: onSubmenuKeydown,
  overlayId,
  placement: "end top",
  registerOverlayElement: (element) => {
    submenuElement.value = element;
  },
  // Pressing the trigger is a press outside the submenu, and dismissing on it would fight the
  // trigger's own toggle.
  shouldCloseOnInteractOutside: (element) => element !== triggerElement.value,
  state,
  trigger: "SubmenuTrigger",
  triggerElement: computed(() => triggerElement.value),
});
</script>

<template>
  <slot />
</template>
