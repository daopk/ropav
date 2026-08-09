<script setup lang="ts" vapor>
import type {OverlayPopoverProps} from "./overlay.types";

import {computed, shallowRef, watch} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {useDismissable} from "../../composables/use-dismissable";
import {useEnterExit} from "../../composables/use-enter-exit";
import {useFocusScope} from "../../composables/use-focus-scope";
import {useOverlayPosition} from "../../composables/use-overlay-position";
import {usePreventScroll} from "../../composables/use-prevent-scroll";
import {ariaHideOutside, keepVisible} from "../../utils/aria-hide-outside";
import {dataAttr} from "../../utils/assertion";
import {provideSurfaceContext} from "../surface";

import OverlayDismissButton from "./overlay-dismiss-button.vue";
import {createOverlaySlotContexts} from "./overlay-slots";
import {
  provideOverlayArrowContext,
  provideOverlayGroupContext,
  provideOverlayScopeContext,
  useOverlayGroupContext,
  useOverlayTargetContext,
} from "./overlay.context";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as an explicit `false`.
const props = withDefaults(defineProps<OverlayPopoverProps>(), {
  isEntering: undefined,
  isExiting: undefined,
  isKeyboardDismissDisabled: undefined,
  isNonModal: undefined,
  shouldCloseOnInteractOutside: undefined,
  shouldFlip: undefined,
});

defineSlots<{default?: () => unknown}>();

const target = useOverlayTargetContext();
const group = useOverlayGroupContext();

/**
 * Modality belongs to the overlay, not to the thing that opened it.
 *
 * The trigger states what it opens by default — a menu is modal, a submenu is not — and the
 * overlay may say otherwise, which is how a popover renders non-modal without a second kind of
 * trigger having to exist for it.
 */
const isNonModal = computed(() => props.isNonModal ?? target.isNonModal);

const shouldCloseOnInteractOutside = (element: Element) =>
  (props.shouldCloseOnInteractOutside ?? target.shouldCloseOnInteractOutside)?.(element) ?? true;

const element = shallowRef<HTMLElement | null>(null);
const ownContainer = shallowRef<HTMLElement | null>(null);

// Owned here only when nothing above owns them, which is the overlay-on-its-own case.
const contexts = props.slotContexts ?? createOverlaySlotContexts();
const arrow = contexts.arrowElement;

/**
 * Whether this overlay opens a group of its own, or joins one already open.
 *
 * A submenu joins: it renders into the container its root popover made, so the whole open tree
 * stays a single subtree. Anything else starts a group, because nothing above it has one — which
 * is exactly what an absent group context means.
 */
const isSubOverlay = Boolean(group) && target.trigger === "SubmenuTrigger";
const groupContainer = isSubOverlay && group ? group.container : ownContainer;

provideOverlayGroupContext({container: groupContainer});

/**
 * Where the overlay element is rendered.
 *
 * A group's outermost overlay renders into its own container, which means waiting one flush for
 * that container to exist. Everything nested waits for the same one.
 */
const contentTarget = computed(() => groupContainer.value);

// The overlay is a surface in its own right, so anything inside it that picks its colours from the
// surface it sits on — a field, a chip — reads the overlay rather than the page behind it.
provideSurfaceContext({variant: computed(() => "default" as const)});

/**
 * Nothing inside the overlay is the trigger.
 *
 * The trigger hands its press down through this context, and a context reaches every descendant —
 * so without clearing it here every button inside the overlay would also toggle the overlay.
 * React Aria clears the same context at the same boundary for the same reason.
 */
providePressResponder(null);

const {arrowStyle, overlayStyle, placement} = useOverlayPosition({
  arrowBoundaryOffset: () => props.arrowBoundaryOffset,
  arrowRef: arrow,
  containerPadding: () => props.containerPadding,
  crossOffset: () => props.crossOffset,
  isOpen: () => target.state.isOpen.value,
  // The overlay is measured to be positioned, so it has to exist before it can be placed. It is
  // rendered while closed only when it is animating out, where the last position still holds.
  maxHeight: undefined,
  offset: () => props.offset ?? 8,
  onClose: target.state.close,
  overlayRef: element,
  placement: () => props.placement ?? target.placement,
  shouldFlip: () => props.shouldFlip,
  targetRef: target.triggerElement,
});

// Provided as well as published: the overlay's own dismiss buttons read the scope, and an
// overlay used without a wrapper has nobody else to provide for it.
provideOverlayArrowContext(contexts.arrow);
provideOverlayScopeContext(contexts.scope);

/**
 * Whether the overlay element is itself the dialog.
 *
 * Two elements with `role="dialog"`, one inside the other, is not something assistive technology
 * can make sense of — so an overlay whose content is already a dialog steps aside and lets the
 * inner one be it. A non-modal overlay is not a dialog at all, with the exception of a submenu:
 * the menu behind it stays live, but it is still a thing you are inside.
 */
const shouldBeDialog = computed(() => !isNonModal.value || target.trigger === "SubmenuTrigger");

const {focusContainRequests, registeredDialogs} = contexts;
const domHasDialog = shallowRef(false);
const isDialog = computed(
  () => shouldBeDialog.value && registeredDialogs.value === 0 && !domHasDialog.value,
);

// A dialog that is not one of ours — raw markup in the overlay's content — has nothing to register,
// so the DOM is asked as well.
watch(
  [element, shouldBeDialog],
  ([popover, shouldBe]) => {
    domHasDialog.value = Boolean(shouldBe && popover?.querySelector("[role=dialog]"));
  },
  {flush: "post", immediate: true},
);

contexts.publish({
  close: target.state.close,
  dialogId: computed(() => (isDialog.value ? undefined : target.dialogId?.value)),
  placement,
  style: arrowStyle,
});

// Held in the DOM through the exit animation, which is otherwise a contradiction: the overlay has
// to be gone and has to still be there to animate.
const enterExit = useEnterExit({
  elementRef: element,
  isOpen: () => target.state.isOpen.value,
  // Animating before the overlay has been placed would slide it in from wherever it was first
  // laid out rather than from its trigger.
  isReady: () => placement.value !== null,
});

const isEntering = computed(() => props.isEntering ?? enterExit.isEntering.value);
const isExiting = computed(() => props.isExiting ?? enterExit.isExiting.value);
const isPresent = computed(
  () => target.state.isOpen.value || enterExit.isExiting.value || props.isExiting === true,
);

const dismissable = useDismissable({
  // A submenu is dismissable too: the menu behind it stays live, but a click outside the whole
  // tree still has to close it.
  isDismissable: computed(() => !isNonModal.value || target.trigger === "SubmenuTrigger"),
  isKeyboardDismissDisabled: () => props.isKeyboardDismissDisabled,
  isOpen: () => target.state.isOpen.value,
  onClose: target.state.close,
  overlayRef: element,
  shouldCloseOnInteractOutside,
});

// Whatever opened the overlay gets the key first: a submenu closes on ArrowLeft, which dismissal
// knows nothing about.
const onKeydown = (event: KeyboardEvent) => {
  target.onKeydown?.(event);

  if (event.defaultPrevented) return;

  dismissable.onKeydown(event);
};

/**
 * Hide the rest of the page from assistive technology while the overlay is open.
 *
 * A group's outermost overlay hides everything outside its container. Anything nested is inside
 * that container already, so it has nothing of its own to hide — but it is rendered after the
 * hiding began, which is why it asks to be exempted rather than assuming.
 */
watch(
  [() => target.state.isOpen.value, element, ownContainer, isNonModal],
  ([isOpen, popover, container], _previous, onCleanup) => {
    if (!isOpen || !popover) return;

    if (isNonModal.value) {
      onCleanup(keepVisible(popover) ?? (() => {}));

      return;
    }

    onCleanup(ariaHideOutside([container ?? popover], {shouldUseInert: true}));
  },
  {flush: "post", immediate: true},
);

// Ordered after the hiding above on purpose: cleanups run in the order their watchers were made,
// and focus cannot be given back to a trigger that is still inert.
// Focus is contained and given back: the overlay is rendered at the end of the document, so
// tabbing out of it would otherwise land on whatever happens to follow in the body, and closing it
// would drop a keyboard user at the top of the page. An overlay that is not itself the dialog only
// contains focus when the dialog inside asks it to.
useFocusScope({
  contain: () => isDialog.value || focusContainRequests.value > 0,
  isActive: () => target.state.isOpen.value,
  restoreFocus: true,
  scopeRef: element,
});

// A non-modal overlay leaves the page live, so only a modal one holds it still.
usePreventScroll({isDisabled: () => isNonModal.value || !target.state.isOpen.value});

/**
 * Focus the overlay itself once it appears, when it is the dialog and nothing inside holds focus.
 *
 * Without this a keyboard user is left on the trigger with the overlay open beside them, and a
 * screen reader never enters it.
 *
 * Only for an overlay whose trigger handed it a dialog id, which is what distinguishes an overlay
 * that is itself the destination from one whose content manages focus for itself — a menu decides
 * which item to start on, and taking focus here would undo that choice. React Aria focuses in both
 * cases and lets the menu move focus afterwards; the narrower rule is a deliberate difference.
 */
watch(
  [element, isDialog],
  ([popover, dialog]) => {
    if (!popover || !dialog || target.dialogId === undefined) return;
    if (popover.contains(document.activeElement)) return;

    // Never scrolls: the overlay is positioned by measurement, and letting focus scroll the page
    // under it would leave it beside nothing.
    popover.focus({preventScroll: true});
  },
  {flush: "post", immediate: true},
);

/**
 * The writing direction the overlay is placed in.
 *
 * Read from the trigger rather than inherited: the overlay is rendered at the end of the document,
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
// block the absolutely positioned overlays inside it would then be measured against.
const CONTAINER_STYLE = "display: contents";

const setContainer = (next: unknown) => {
  ownContainer.value = (next as HTMLElement | null) ?? null;
};
</script>

<template>
  <Teleport v-if="!isSubOverlay && isPresent" to="body">
    <div :ref="setContainer" :style="CONTAINER_STYLE" />
  </Teleport>
  <Teleport v-if="contentTarget && isPresent" :to="contentTarget">
    <div
      :id="isDialog ? target.dialogId?.value : undefined"
      :ref="setElement"
      :aria-labelledby="target.labelledBy.value"
      :class="props.class"
      :data-entering="dataAttr(isEntering)"
      :data-exiting="dataAttr(isExiting)"
      :data-placement="placement ?? undefined"
      :data-slot="props.dataSlot"
      :data-trigger="target.trigger"
      :dir="direction"
      :role="isDialog ? 'dialog' : undefined"
      :style="overlayStyle"
      :tabindex="isDialog ? -1 : undefined"
      @keydown="onKeydown"
    >
      <OverlayDismissButton v-if="!isNonModal" />
      <slot />
      <OverlayDismissButton />
    </div>
  </Teleport>
</template>
