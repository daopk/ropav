<script setup lang="ts" vapor>
import type {DrawerRootProps} from "./drawer.types";

import {drawerVariants} from "@heroui/styles";
import {computed} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {useDialogTrigger} from "../../composables/use-dialog-trigger";
import {useOverlayTriggerState} from "../../composables/use-overlay-trigger-state";

import {provideDrawerContext} from "./drawer.context";

// `isOpen` declares an explicit `undefined` default, which is what distinguishes an uncontrolled
// drawer from one a caller is holding closed.
const props = withDefaults(defineProps<DrawerRootProps>(), {isOpen: undefined});

const emit = defineEmits<{
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{default?: () => unknown}>();

/**
 * An externally held state wins over `isOpen`.
 *
 * It is the same thing said a different way — a caller with one state object driving several
 * overlays — so it resolves to a controlled drawer rather than a second source of truth.
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
// than built into a trigger component: `<Drawer><Button/></Drawer>` is the common case, and
// `Drawer.Trigger` exists for a button that should carry the drawer's own trigger styling.
providePressResponder(trigger.responder);

provideDrawerContext({
  dialogId: trigger.overlayId,
  labelledBy: trigger.triggerId,
  // Decided by the content, which is the only part that knows; the dialog reads it back.
  placement: computed(() => undefined),
  slots: computed(() => drawerVariants()),
  state,
});
</script>

<template>
  <slot />
</template>
