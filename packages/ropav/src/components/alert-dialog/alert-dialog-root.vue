<script setup lang="ts" vapor>
import type {AlertDialogRootProps} from "./alert-dialog.types";

import {alertDialogVariants} from "@ropav/styles";
import {computed} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {useDialogTrigger} from "../../composables/use-dialog-trigger";
import {useOverlayTriggerState} from "../../composables/use-overlay-trigger-state";

import {provideAlertDialogContext} from "./alert-dialog.context";

// `isOpen` declares an explicit `undefined` default, which is what distinguishes an uncontrolled
// dialog from one a caller is holding closed.
const props = withDefaults(defineProps<AlertDialogRootProps>(), {isOpen: undefined});

const emit = defineEmits<{
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{default?: () => unknown}>();

/**
 * An externally held state wins over `isOpen`.
 *
 * It is the same thing said a different way — a caller with one state object driving several
 * overlays — so it resolves to a controlled dialog rather than a second source of truth.
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
// than built into a trigger component: `<AlertDialog><Button/></AlertDialog>` is the common case,
// and `AlertDialog.Trigger` exists for markup that is not pressable on its own.
providePressResponder(trigger.responder);

provideAlertDialogContext({
  dialogId: trigger.overlayId,
  labelledBy: trigger.triggerId,
  // Decided by the container, which is the only part that knows; the dialog reads it back.
  placement: computed(() => undefined),
  slots: computed(() => alertDialogVariants()),
  state,
});
</script>

<template>
  <slot />
</template>
