<script setup lang="ts" vapor>
import type {DrawerBackdropProps} from "./drawer.types";

import {drawerVariants} from "@ropav/styles";
import {computed, shallowRef} from "vue";

import {provideFocusResponder} from "../../composables/focus-responder";
import {providePressResponder} from "../../composables/press-responder";
import {useModalOverlay} from "../../composables/use-modal-overlay";
import {useModalTransition} from "../../composables/use-modal-transition";
import {dataAttr} from "../../utils/assertion";

import {
  provideDrawerContext,
  provideDrawerOverlayContext,
  useDrawerContext,
} from "./drawer.context";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as a deliberate `false`.
const props = withDefaults(defineProps<DrawerBackdropProps>(), {
  isDismissable: undefined,
  isEntering: undefined,
  isExiting: undefined,
  isKeyboardDismissDisabled: undefined,
});

defineSlots<{default?: () => unknown}>();

const context = useDrawerContext();
const {state} = context;

const backdropElement = shallowRef<HTMLElement | null>(null);
const contentElement = shallowRef<HTMLElement | null>(null);

const isOpen = () => state.isOpen.value;

/**
 * Held in the DOM through the exit animation, which is otherwise a contradiction: the drawer has to
 * be gone and has to still be there to slide away.
 *
 * The union across both elements matters more here than for a modal — see the note on
 * `DrawerOverlayContext.isExiting`.
 */
const transition = useModalTransition({
  backdropRef: backdropElement,
  contentRef: contentElement,
  isEntering: () => props.isEntering,
  isExiting: () => props.isExiting,
  isOpen,
});

const isDismissable = computed(() => props.isDismissable ?? true);

/**
 * The machinery is owned here but acts on the **content**.
 *
 * A press on the backdrop beside the panel is outside the drawer and has to dismiss it, so the
 * content is the boundary. React Aria passes the same element for the same reason.
 */
const overlay = useModalOverlay({
  isDismissable: () => isDismissable.value,
  isKeyboardDismissDisabled: () => props.isKeyboardDismissDisabled,
  isOpen,
  modalRef: contentElement,
  onClose: state.close,
  shouldCloseOnInteractOutside: props.shouldCloseOnInteractOutside,
});

/**
 * Nothing inside the drawer is the trigger.
 *
 * Both channels are cleared here because the boundary is here: everything the drawer renders is
 * slot content of this component, and a `provide` made deeper would not reach content the caller
 * wrote. Without it every `Button` in the body or the footer would also toggle the drawer, and
 * would claim the trigger's identity while doing it.
 */
providePressResponder(null);
provideFocusResponder(null);

const slots = computed(() => ({
  ...context.slots.value,
  ...drawerVariants({variant: props.variant}),
}));

provideDrawerContext({...context, slots});

provideDrawerOverlayContext({
  close: state.close,
  isContentEntering: transition.isContentEntering,
  isDismissable,
  isExiting: transition.isExiting,
  onKeydown: overlay.onKeydown,
  registerContentElement: (element) => {
    contentElement.value = element;
  },
});

const styles = computed(() => slots.value.backdrop({class: props.class}));

const target = computed(() => props.portalContainer ?? "body");

const setElement = (next: unknown) => {
  backdropElement.value = (next as HTMLElement | null) ?? null;
};
</script>

<template>
  <Teleport v-if="transition.isPresent.value" :to="target">
    <div
      :ref="setElement"
      :class="styles"
      :data-entering="dataAttr(transition.isBackdropEntering.value)"
      :data-exiting="dataAttr(transition.isExiting.value)"
      data-slot="drawer-backdrop"
      :style="[props.style, overlay.viewportStyle.value]"
    >
      <slot />
    </div>
  </Teleport>
</template>
