<script setup lang="ts" vapor>
import type {DropdownPopoverProps} from "./dropdown.types";

import {computed, shallowRef, watch} from "vue";

import {useDismissable} from "../../composables/use-dismissable";
import {useEnterExit} from "../../composables/use-enter-exit";
import {useFocusScope} from "../../composables/use-focus-scope";
import {useOverlayPosition} from "../../composables/use-overlay-position";
import {usePreventScroll} from "../../composables/use-prevent-scroll";
import {ariaHideOutside, keepVisible} from "../../utils/aria-hide-outside";
import {dataAttr} from "../../utils/assertion";

import DropdownDismissButton from "./dropdown-dismiss-button.vue";
import {useDropdownContext, useDropdownPopoverTarget} from "./dropdown.context";

// `isKeyboardDismissDisabled` and `shouldFlip` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<DropdownPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  shouldFlip: undefined,
});

defineSlots<{default?: () => unknown}>();

const {popoverContainer, slots} = useDropdownContext();
const target = useDropdownPopoverTarget();

const element = shallowRef<HTMLElement | null>(null);
const container = shallowRef<HTMLElement | null>(null);

const isRoot = computed(() => target.trigger === "MenuTrigger");

/**
 * Where the popover element is rendered.
 *
 * Every popover in the tree goes into the same container — the one the root popover puts in the
 * body — so the whole open tree is a single subtree. That is what lets it be described to assistive
 * technology as one thing while everything around it is hidden, and it is also why a submenu is not
 * rendered inside the menu that opened it: that menu scrolls, and it would clip the submenu.
 *
 * The root renders into its own container, which means waiting one flush for that container to
 * exist. A submenu waits for the root's.
 */
const contentTarget = computed(() => (isRoot.value ? container.value : popoverContainer.value));

const {overlayStyle, placement} = useOverlayPosition({
  containerPadding: () => props.containerPadding,
  crossOffset: () => props.crossOffset,
  isOpen: () => target.state.isOpen.value,
  // The popover is measured to be positioned, so it has to exist before it can be placed. It is
  // rendered while closed only when it is animating out, where the last position still holds.
  maxHeight: undefined,
  offset: () => props.offset ?? 8,
  onClose: target.state.close,
  overlayRef: element,
  placement: () => props.placement ?? target.placement,
  shouldFlip: () => props.shouldFlip,
  targetRef: target.triggerElement,
});

// Held in the DOM through the exit animation, which is otherwise a contradiction: the popover has
// to be gone and has to still be there to animate.
const {isEntering, isExiting, isPresent} = useEnterExit({
  elementRef: element,
  isOpen: () => target.state.isOpen.value,
  // Animating before the popover has been placed would slide it in from wherever it was first
  // laid out rather than from its trigger.
  isReady: () => placement.value !== null,
});

const dismissable = useDismissable({
  isDismissable: true,
  isKeyboardDismissDisabled: () => props.isKeyboardDismissDisabled,
  isOpen: () => target.state.isOpen.value,
  onClose: target.state.close,
  overlayRef: element,
  shouldCloseOnInteractOutside: target.shouldCloseOnInteractOutside,
});

// Whatever opened the popover gets the key first: a submenu closes on ArrowLeft, which dismissal
// knows nothing about.
const onKeydown = (event: KeyboardEvent) => {
  target.onKeydown?.(event);

  if (event.defaultPrevented) return;

  dismissable.onKeydown(event);
};

// Focus is contained and given back: the popover is rendered at the end of the document, so
// tabbing out of it would otherwise land on whatever happens to follow in the body, and closing it
// would drop a keyboard user at the top of the page.
useFocusScope({
  contain: true,
  isActive: () => target.state.isOpen.value,
  restoreFocus: true,
  scopeRef: element,
});

// A submenu is not modal — the menu behind it stays live — so only the root popover holds the page
// still.
usePreventScroll({isDisabled: () => target.isNonModal || !target.state.isOpen.value});

/**
 * Hide the rest of the page from assistive technology while the menu is open.
 *
 * The root popover hides everything outside its container. A submenu is inside that container
 * already, so it has nothing of its own to hide — but it is rendered after the hiding began, which
 * is why it asks to be exempted rather than assuming.
 */
watch(
  [() => target.state.isOpen.value, element, container],
  ([isOpen, popover, ownContainer], _previous, onCleanup) => {
    if (!isOpen || !popover) return;

    if (target.isNonModal) {
      onCleanup(keepVisible(popover) ?? (() => {}));

      return;
    }

    onCleanup(ariaHideOutside([ownContainer ?? popover], {shouldUseInert: true}));
  },
  {flush: "post", immediate: true},
);

// Published so submenus have somewhere to render. Only the root popover makes one; a submenu reuses
// it, which is what keeps the tree in a single subtree however deep it goes.
watch(container, (current) => {
  if (isRoot.value) popoverContainer.value = current;
});

/**
 * The writing direction the popover is placed in.
 *
 * Read from the trigger rather than inherited: the popover is rendered at the end of the document,
 * so it would otherwise pick up whatever direction the body has, and a logical `start` placement
 * would resolve to the wrong side of a trigger sitting in a right-to-left region.
 */
const direction = computed(() => {
  const trigger = target.triggerElement.value;

  if (!trigger) return "ltr";

  return getComputedStyle(trigger).direction === "rtl" ? "rtl" : "ltr";
});

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
  target.registerOverlayElement?.(element.value);
};

// `display: contents` on the container, so it never affects layout and never becomes the containing
// block the absolutely positioned popovers inside it would then be measured against.
const CONTAINER_STYLE = "display: contents";

const setContainer = (next: unknown) => {
  container.value = (next as HTMLElement | null) ?? null;
};

const styles = computed(() => slots.value.popover({class: props.class}));
</script>

<template>
  <Teleport v-if="isRoot && isPresent" to="body">
    <div :ref="setContainer" :style="CONTAINER_STYLE" />
  </Teleport>
  <Teleport v-if="contentTarget && isPresent" :to="contentTarget">
    <div
      :ref="setElement"
      :aria-labelledby="target.labelledBy.value"
      :class="styles"
      :data-entering="dataAttr(isEntering)"
      :data-exiting="dataAttr(isExiting)"
      :data-placement="placement ?? undefined"
      data-slot="dropdown-popover"
      :data-trigger="target.trigger"
      :dir="direction"
      role="dialog"
      :style="overlayStyle"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <DropdownDismissButton v-if="!target.isNonModal" />
      <slot />
      <DropdownDismissButton />
    </div>
  </Teleport>
</template>
