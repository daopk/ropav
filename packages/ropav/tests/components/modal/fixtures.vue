<script setup lang="ts" vapor>
import type { ModalFixtureProps } from "./fixtures.types";

import { computed, shallowRef } from "vue";

import { Button } from "@/components/button";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  ModalTrigger,
} from "@/components/modal";

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
  closeTriggerLabel: undefined,
  withCloseTrigger: undefined,
  withCloseWrapper: undefined,
  withCustomTrigger: undefined,
  withIcon: undefined,
  withInsideButton: undefined,
  withoutHeading: undefined,
});

const emit = defineEmits<{ openChange: [isOpen: boolean] }>();

const shouldCloseOnInteractOutside = (element: Element) =>
  !props.keepOpenFor || !element.closest(`#${props.keepOpenFor}`);

/**
 * The label is omitted rather than bound as `undefined`.
 *
 * A bound attribute always reaches the child, and fallthrough merges it **over** the child's own
 * static one — so binding `undefined` erases the default name instead of leaving it alone.
 */
const closeTriggerAttrs = computed(() =>
  props.closeTriggerLabel === undefined ? {} : { "aria-label": props.closeTriggerLabel },
);

/** Set by the button inside `ModalClose`, so a test can prove both handlers ran. */
const saved = shallowRef(false);

defineExpose({ saved });
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <span data-testid="saved">{{ saved ? "saved" : "not saved" }}</span>
    <Modal
      :default-open="props.defaultOpen"
      :is-open="props.isOpen"
      @open-change="emit('openChange', $event)"
    >
      <ModalTrigger v-if="props.withCustomTrigger">Actions</ModalTrigger>
      <Button v-else>Open modal</Button>
      <ModalBackdrop
        :is-dismissable="props.isDismissable"
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :portal-container="props.portalContainer"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :variant="props.variant"
      >
        <ModalContainer :placement="props.placement" :scroll="props.scroll" :size="props.size">
          <ModalDialog v-slot="{ close }">
            <ModalCloseTrigger v-if="props.withCloseTrigger" v-bind="closeTriggerAttrs" />
            <ModalHeader>
              <ModalIcon v-if="props.withIcon">!</ModalIcon>
              <ModalHeading v-if="!props.withoutHeading">Modal heading</ModalHeading>
            </ModalHeader>
            <ModalBody>Modal body</ModalBody>
            <ModalFooter>
              <Button v-if="props.withInsideButton">Inside action</Button>
              <ModalClose v-if="props.withCloseWrapper">
                <Button @click="saved = true">Confirm</Button>
              </ModalClose>
              <button data-testid="close-from-slot" type="button" @click="close()">Done</button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  </div>
</template>
