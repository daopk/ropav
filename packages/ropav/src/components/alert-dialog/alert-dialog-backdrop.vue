<script setup lang="ts" vapor>
import type { AlertDialogBackdropProps } from "./alert-dialog.types";

import { alertDialogVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { provideFocusResponder } from "../../composables/focus-responder";
import { providePressResponder } from "../../composables/press-responder";
import { useModalOverlay } from "../../composables/use-modal-overlay";
import { useModalTransition } from "../../composables/use-modal-transition";
import { dataAttr } from "../../utils/assertion";

import {
  provideAlertDialogContext,
  provideAlertDialogOverlayContext,
  useAlertDialogContext,
} from "./alert-dialog.context";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as a deliberate `false`.
const props = withDefaults(defineProps<AlertDialogBackdropProps>(), {
  isDismissable: undefined,
  isEntering: undefined,
  isExiting: undefined,
  isKeyboardDismissDisabled: undefined,
});

defineSlots<{ default?: () => unknown }>();

const context = useAlertDialogContext();
const { state } = context;

const backdropElement = shallowRef<HTMLElement | null>(null);
const contentElement = shallowRef<HTMLElement | null>(null);

const isOpen = () => state.isOpen.value;

/**
 * Held in the DOM through the exit animation, which is otherwise a contradiction: the dialog has to
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
 * Both defaults are the opposite of a modal's, because the dialog is asking a question.
 *
 * Neither clicking away nor pressing Escape answers it, so both routes are closed unless the caller
 * opens them.
 */
const isDismissable = computed(() => props.isDismissable ?? false);

/**
 * The machinery is owned here but acts on the **container**.
 *
 * A press on the backdrop beside the dialog is outside it, so the container is the boundary. React
 * Aria passes the same element for the same reason.
 */
const overlay = useModalOverlay({
  isDismissable: () => isDismissable.value,
  isKeyboardDismissDisabled: () => props.isKeyboardDismissDisabled ?? true,
  isOpen,
  modalRef: contentElement,
  onClose: state.close,
  shouldCloseOnInteractOutside: props.shouldCloseOnInteractOutside,
});

/**
 * Nothing inside the dialog is the trigger.
 *
 * Both channels are cleared here because the boundary is here: everything the dialog renders is slot
 * content of this component, and a `provide` made deeper would not reach content the caller wrote.
 * Without it every `Button` in the footer would also toggle the dialog, and would claim the
 * trigger's identity while doing it.
 */
providePressResponder(null);
provideFocusResponder(null);

const slots = computed(() => ({
  ...context.slots.value,
  ...alertDialogVariants({ variant: props.variant }),
}));

provideAlertDialogContext({ ...context, slots });

provideAlertDialogOverlayContext({
  close: state.close,
  isContentEntering: transition.isContentEntering,
  isDismissable,
  isExiting: transition.isExiting,
  onKeydown: overlay.onKeydown,
  registerContentElement: (element) => {
    contentElement.value = element;
  },
});

const styles = computed(() => slots.value.backdrop({ class: props.class }));

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
      data-slot="alert-dialog-backdrop"
      :style="[props.style, overlay.viewportStyle.value]"
    >
      <slot />
    </div>
  </Teleport>
</template>
