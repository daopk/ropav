<script setup lang="ts" vapor>
import type {ModalFixtureProps} from "./fixtures.types";

import {ButtonRoot} from "@/components/button";
import {Modal} from "@/components/modal";

// Every three-state boolean declares an explicit `undefined` default: forwarding a `false` that
// Vue had cast would turn the modal controlled, or read as a deliberate dismiss opt-out.
const props = withDefaults(defineProps<ModalFixtureProps>(), {
  defaultOpen: undefined,
  isDismissable: undefined,
  isKeyboardDismissDisabled: undefined,
  isOpen: undefined,
  keepOpenFor: undefined,
  placement: undefined,
  portalContainer: undefined,
  scroll: undefined,
  size: undefined,
  variant: undefined,
  withCustomTrigger: undefined,
  withInsideButton: undefined,
});

const emit = defineEmits<{openChange: [isOpen: boolean]}>();

const shouldCloseOnInteractOutside = (element: Element) =>
  !props.keepOpenFor || !element.closest(`#${props.keepOpenFor}`);
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <Modal
      :default-open="props.defaultOpen"
      :is-open="props.isOpen"
      @open-change="emit('openChange', $event)"
    >
      <Modal.Trigger v-if="props.withCustomTrigger">Actions</Modal.Trigger>
      <ButtonRoot v-else>Open modal</ButtonRoot>
      <Modal.Backdrop
        :is-dismissable="props.isDismissable"
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :portal-container="props.portalContainer"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :variant="props.variant"
      >
        <Modal.Container :placement="props.placement" :scroll="props.scroll" :size="props.size">
          <Modal.Dialog v-slot="{close}">
            <p>Modal body</p>
            <ButtonRoot v-if="props.withInsideButton">Inside action</ButtonRoot>
            <button data-testid="close-from-slot" type="button" @click="close()">Done</button>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  </div>
</template>
