<script setup lang="ts" vapor>
import type { PopoverRootProps } from "./popover.types";

import { popoverVariants } from "@ropav/styles";
import { computed } from "vue";

import { providePressResponder } from "../../composables/press-responder";
import { useDialogTrigger } from "../../composables/use-dialog-trigger";
import { useOverlayTriggerState } from "../../composables/use-overlay-trigger-state";
import { provideOverlayTargetContext } from "../overlay";

import { providePopoverContext } from "./popover.context";

// `isOpen` declares an explicit `undefined` default, which is what distinguishes an uncontrolled
// popover from one a caller is holding closed.
const props = withDefaults(defineProps<PopoverRootProps>(), { isOpen: undefined });

const emit = defineEmits<{
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{ default?: () => unknown }>();

const state = useOverlayTriggerState({
  defaultOpen: props.defaultOpen,
  isOpen: () => props.isOpen,
  onOpenChange: (isOpen) => {
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
});

const trigger = useDialogTrigger({}, state);

// The trigger is whatever pressable sits inside, which is why the behaviour is handed down rather
// than built into a trigger component: `<Popover><Button/></Popover>` is the common case, and
// `PopoverTrigger` exists for markup that is not pressable on its own.
providePressResponder(trigger.responder);

providePopoverContext({ slots: computed(() => popoverVariants()) });

provideOverlayTargetContext({
  // A dialog has no direction to carry into it, unlike a menu opened with an arrow key.
  autoFocus: computed(() => false),
  closeAll: state.close,
  // Both ids are the same one here: the dialog is the content, so there is nothing else to name.
  // A menu trigger differs — its menu owns `overlayId`, which is why the two are separate.
  dialogId: trigger.overlayId,
  isNonModal: false,
  labelledBy: trigger.triggerId,
  overlayId: trigger.overlayId,
  placement: "bottom",
  state,
  trigger: "DialogTrigger",
  triggerElement: trigger.triggerElement,
});
</script>

<template>
  <slot />
</template>
