<script setup lang="ts" vapor>
import type { AlertDialogFixtureProps } from "./fixtures.types";

import { computed, shallowRef } from "vue";

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogCloseTrigger,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  AlertDialogTrigger,
} from "@/components/alert-dialog";
import { Button } from "@/components/button";

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

/** Set by the button inside `AlertDialogClose`, so a test can prove both handlers ran. */
const removed = shallowRef(false);

defineExpose({ removed });
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
      <AlertDialogTrigger v-if="props.withCustomTrigger">Actions</AlertDialogTrigger>
      <Button v-else>Delete account</Button>
      <AlertDialogBackdrop
        :is-dismissable="props.isDismissable"
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :portal-container="props.portalContainer"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :variant="props.variant"
      >
        <AlertDialogContainer :placement="props.placement" :size="props.size">
          <AlertDialogDialog v-slot="{ close }">
            <AlertDialogCloseTrigger v-if="props.withCloseTrigger" v-bind="closeTriggerAttrs" />
            <AlertDialogHeader>
              <AlertDialogIcon v-if="props.withIcon" :status="props.iconStatus">
                <span v-if="props.withCustomIcon" data-testid="custom-icon">!</span>
              </AlertDialogIcon>
              <AlertDialogIcon v-if="props.withSecondIcon" :status="props.secondIconStatus" />
              <AlertDialogHeading v-if="!props.withoutHeading">
                Delete account?
              </AlertDialogHeading>
            </AlertDialogHeader>
            <AlertDialogBody>This cannot be undone.</AlertDialogBody>
            <AlertDialogFooter>
              <Button v-if="props.withInsideButton">Learn more</Button>
              <AlertDialogClose v-if="props.withCloseWrapper">
                <Button @click="removed = true">Delete</Button>
              </AlertDialogClose>
              <button data-testid="close-from-slot" type="button" @click="close()">Cancel</button>
            </AlertDialogFooter>
          </AlertDialogDialog>
        </AlertDialogContainer>
      </AlertDialogBackdrop>
    </AlertDialog>
  </div>
</template>
