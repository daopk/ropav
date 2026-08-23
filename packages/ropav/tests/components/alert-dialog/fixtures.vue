<script setup lang="ts" vapor>
import type {AlertDialogFixtureProps} from "./fixtures.types";

import {computed, shallowRef} from "vue";

import {AlertDialog} from "@/components/alert-dialog";
import {ButtonRoot} from "@/components/button";

// Every three-state boolean declares an explicit `undefined` default: forwarding a `false` that Vue
// had cast would turn the dialog controlled, or read as a deliberate dismiss opt-in.
const props = withDefaults(defineProps<AlertDialogFixtureProps>(), {
  defaultOpen: undefined,
  isDismissable: undefined,
  isKeyboardDismissDisabled: undefined,
  isOpen: undefined,
  keepOpenFor: undefined,
  placement: undefined,
  portalContainer: undefined,
  size: undefined,
  variant: undefined,
  closeTriggerLabel: undefined,
  iconStatus: undefined,
  secondIconStatus: undefined,
  withCloseTrigger: undefined,
  withCloseWrapper: undefined,
  withCustomIcon: undefined,
  withCustomTrigger: undefined,
  withIcon: undefined,
  withInsideButton: undefined,
  withSecondIcon: undefined,
  withoutHeading: undefined,
});

const emit = defineEmits<{openChange: [isOpen: boolean]}>();

const shouldCloseOnInteractOutside = (element: Element) =>
  !props.keepOpenFor || !element.closest(`#${props.keepOpenFor}`);

/**
 * The label is omitted rather than bound as `undefined`.
 *
 * A bound attribute always reaches the child, and fallthrough merges it **over** the child's own
 * static one — so binding `undefined` erases the default name instead of leaving it alone.
 */
const closeTriggerAttrs = computed(() =>
  props.closeTriggerLabel === undefined ? {} : {"aria-label": props.closeTriggerLabel},
);

/** Set by the button inside `AlertDialog.Close`, so a test can prove both handlers ran. */
const removed = shallowRef(false);

defineExpose({removed});
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <span data-testid="removed">{{ removed ? "removed" : "kept" }}</span>
    <AlertDialog
      :default-open="props.defaultOpen"
      :is-open="props.isOpen"
      @open-change="emit('openChange', $event)"
    >
      <AlertDialog.Trigger v-if="props.withCustomTrigger">Actions</AlertDialog.Trigger>
      <ButtonRoot v-else>Delete account</ButtonRoot>
      <AlertDialog.Backdrop
        :is-dismissable="props.isDismissable"
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :portal-container="props.portalContainer"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :variant="props.variant"
      >
        <AlertDialog.Container :placement="props.placement" :size="props.size">
          <AlertDialog.Dialog v-slot="{close}">
            <AlertDialog.CloseTrigger v-if="props.withCloseTrigger" v-bind="closeTriggerAttrs" />
            <AlertDialog.Header>
              <AlertDialog.Icon v-if="props.withIcon" :status="props.iconStatus">
                <span v-if="props.withCustomIcon" data-testid="custom-icon">!</span>
              </AlertDialog.Icon>
              <AlertDialog.Icon v-if="props.withSecondIcon" :status="props.secondIconStatus" />
              <AlertDialog.Heading v-if="!props.withoutHeading">
                Delete account?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>This cannot be undone.</AlertDialog.Body>
            <AlertDialog.Footer>
              <ButtonRoot v-if="props.withInsideButton">Learn more</ButtonRoot>
              <AlertDialog.Close v-if="props.withCloseWrapper">
                <ButtonRoot @click="removed = true">Delete</ButtonRoot>
              </AlertDialog.Close>
              <button data-testid="close-from-slot" type="button" @click="close()">Cancel</button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  </div>
</template>
