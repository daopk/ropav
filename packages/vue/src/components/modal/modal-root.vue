<script setup lang="ts" vapor>
import type {ModalRootProps} from "./modal.types";

import {modalVariants} from "@heroui/styles";
import {computed} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {useDialogTrigger} from "../../composables/use-dialog-trigger";
import {useOverlayTriggerState} from "../../composables/use-overlay-trigger-state";

import {provideModalContext} from "./modal.context";

// `isOpen` declares an explicit `undefined` default, which is what distinguishes an uncontrolled
// modal from one a caller is holding closed.
const props = withDefaults(defineProps<ModalRootProps>(), {isOpen: undefined});

const emit = defineEmits<{
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{default?: () => unknown}>();

/**
 * An externally held state wins over `isOpen`, matching React.
 *
 * It is the same thing said a different way — a caller with one state object driving several
 * overlays — so it resolves to a controlled modal rather than a second source of truth.
 */
const state = useOverlayTriggerState({
  defaultOpen: props.defaultOpen,
  isOpen: () => (props.state ? props.state.isOpen.value : props.isOpen),
  onOpenChange: (isOpen) => {
    props.state?.setOpen(isOpen);
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
});

const trigger = useDialogTrigger({isDisabled: () => props.isDisabled}, state);

// The trigger is whatever pressable sits inside, which is why the behaviour is handed down rather
// than built into a trigger component: `<Modal><Button/></Modal>` is the common case, and
// `Modal.Trigger` exists for markup that is not pressable on its own.
providePressResponder(trigger.responder);

provideModalContext({
  dialogId: trigger.overlayId,
  labelledBy: trigger.triggerId,
  // Decided by the container, which is the only part that knows; the dialog reads it back.
  placement: computed(() => undefined),
  slots: computed(() => modalVariants()),
  state,
});
</script>

<template>
  <slot />
</template>
