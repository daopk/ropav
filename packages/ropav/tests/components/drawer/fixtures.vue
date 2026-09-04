<script setup lang="ts" vapor>
import type { DrawerFixtureProps } from "./fixtures.types";

import { computed, shallowRef } from "vue";

import { Button } from "@/components/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerClose,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerHeading,
  DrawerTrigger,
} from "@/components/drawer";

// Every three-state boolean declares an explicit `undefined` default: forwarding a `false` that Vue
// had cast would turn the drawer controlled, or read as a deliberate dismiss opt-out.
const props = withDefaults(defineProps<DrawerFixtureProps>(), {
  defaultOpen: undefined,
  isDismissable: undefined,
  isKeyboardDismissDisabled: undefined,
  isOpen: undefined,
  keepOpenFor: undefined,
  placement: undefined,
  portalContainer: undefined,
  variant: undefined,
  closeTriggerLabel: undefined,
  withCloseTrigger: undefined,
  withCloseWrapper: undefined,
  withHandle: undefined,
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

/** Set by the button inside `DrawerClose`, so a test can prove both handlers ran. */
const saved = shallowRef(false);

defineExpose({ saved });
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <span data-testid="saved">{{ saved ? "saved" : "not saved" }}</span>
    <Drawer
      :default-open="props.defaultOpen"
      :is-open="props.isOpen"
      @open-change="emit('openChange', $event)"
    >
      <DrawerTrigger>Open drawer</DrawerTrigger>
      <DrawerBackdrop
        :is-dismissable="props.isDismissable"
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :portal-container="props.portalContainer"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :variant="props.variant"
      >
        <DrawerContent :placement="props.placement">
          <DrawerDialog v-slot="{ close }">
            <DrawerHandle v-if="props.withHandle" />
            <DrawerCloseTrigger v-if="props.withCloseTrigger" v-bind="closeTriggerAttrs" />
            <DrawerHeader>
              <DrawerHeading v-if="!props.withoutHeading">Drawer heading</DrawerHeading>
            </DrawerHeader>
            <DrawerBody>
              <button data-testid="body-button" type="button">In the body</button>
            </DrawerBody>
            <DrawerFooter>
              <Button v-if="props.withInsideButton">Inside action</Button>
              <DrawerClose v-if="props.withCloseWrapper">
                <Button @click="saved = true">Confirm</Button>
              </DrawerClose>
              <button data-testid="close-from-slot" type="button" @click="close()">Done</button>
            </DrawerFooter>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </Drawer>
  </div>
</template>
