<script setup lang="ts" vapor>
import type {DropdownRootProps} from "./dropdown.types";

import {dropdownVariants} from "@heroui/styles";
import {computed} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {useMenuTrigger} from "../../composables/use-menu-trigger";
import {useMenuTriggerState} from "../../composables/use-overlay-trigger-state";

import {provideDropdownContext, provideDropdownPopoverTarget} from "./dropdown.context";

// `isOpen` declares an explicit `undefined` default, which is what distinguishes an uncontrolled
// dropdown from one a caller is holding closed.
const props = withDefaults(defineProps<DropdownRootProps>(), {isOpen: undefined});

const emit = defineEmits<{
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{default?: () => unknown}>();

/**
 * The whole menu tree's open state lives here, on the root.
 *
 * A submenu does not hold its own: it asks the root whether its trigger is the one expanded at its
 * level. Keeping the stack in one place is what makes "only one path through the tree is open"
 * true by construction rather than by every submenu closing its siblings.
 */
const state = useMenuTriggerState({
  defaultOpen: props.defaultOpen,
  isOpen: () => props.isOpen,
  onOpenChange: (isOpen) => {
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
});

const trigger = useMenuTrigger(
  {isDisabled: () => props.isDisabled, trigger: () => props.trigger},
  state,
);

// The trigger is whatever pressable sits inside, which is why the behaviour is handed down rather
// than built into a trigger component: `<Dropdown><Button/></Dropdown>` is the common case.
providePressResponder(trigger.responder);

provideDropdownContext({
  slots: computed(() => dropdownVariants()),
  state,
});

provideDropdownPopoverTarget({
  autoFocus: trigger.autoFocus,
  closeAll: state.close,
  isNonModal: false,
  labelledBy: trigger.triggerId,
  overlayId: trigger.overlayId,
  placement: "bottom start",
  state,
  trigger: "MenuTrigger",
  triggerElement: trigger.triggerElement,
});
</script>

<template>
  <slot />
</template>
