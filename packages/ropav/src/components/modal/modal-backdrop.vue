<script setup lang="ts" vapor>
import type {ModalBackdropProps} from "./modal.types";

import {modalVariants} from "@ropav/styles";
import {computed, shallowRef} from "vue";

import {provideFocusResponder} from "../../composables/focus-responder";
import {providePressResponder} from "../../composables/press-responder";
import {useModalOverlay} from "../../composables/use-modal-overlay";
import {useModalTransition} from "../../composables/use-modal-transition";
import {dataAttr} from "../../utils/assertion";

import {provideModalContext, provideModalOverlayContext, useModalContext} from "./modal.context";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as a deliberate `false`.
const props = withDefaults(defineProps<ModalBackdropProps>(), {
  isDismissable: undefined,
  isEntering: undefined,
  isExiting: undefined,
  isKeyboardDismissDisabled: undefined,
});

defineSlots<{default?: () => unknown}>();

const context = useModalContext();
const {state} = context;

const backdropElement = shallowRef<HTMLElement | null>(null);
const contentElement = shallowRef<HTMLElement | null>(null);

const isOpen = () => state.isOpen.value;

/**
 * Held in the DOM through the exit animation, which is otherwise a contradiction: the modal has to
 * be gone and has to still be there to animate.
 */
const transition = useModalTransition({
  backdropRef: backdropElement,
  contentRef: contentElement,
  isEntering: () => props.isEntering,
  isExiting: () => props.isExiting,
  isOpen,
});

/**
 * The machinery is owned here but acts on the **container**.
 *
 * A press on the backdrop beside the dialog is outside the modal and has to dismiss it, so the
 * container is the boundary. React Aria passes the same element for the same reason.
 */
const overlay = useModalOverlay({
  isDismissable: () => props.isDismissable ?? true,
  isKeyboardDismissDisabled: () => props.isKeyboardDismissDisabled,
  isOpen,
  modalRef: contentElement,
  onClose: state.close,
  shouldCloseOnInteractOutside: props.shouldCloseOnInteractOutside,
});

/**
 * Nothing inside the modal is the trigger.
 *
 * Both channels are cleared here because the boundary is here: everything the modal renders is
 * slot content of this component, and a `provide` made deeper would not reach content the caller
 * wrote. Without it every `Button` in the dialog or the footer would also toggle the modal, and
 * would claim the trigger's identity while doing it. React Aria clears the same two contexts at
 * the same boundary.
 */
providePressResponder(null);
provideFocusResponder(null);

const slots = computed(() => ({
  ...context.slots.value,
  ...modalVariants({variant: props.variant}),
}));

provideModalContext({...context, slots});

provideModalOverlayContext({
  close: state.close,
  isContentEntering: transition.isContentEntering,
  isDismissable: computed(() => props.isDismissable ?? true),
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
      data-slot="modal-backdrop"
      :style="[props.style, overlay.viewportStyle.value]"
    >
      <slot />
    </div>
  </Teleport>
</template>
