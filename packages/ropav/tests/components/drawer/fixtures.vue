<script setup lang="ts" vapor>
import type { DrawerFixtureProps } from "./fixtures.types";

import { computed, shallowRef } from "vue";

import { ButtonRoot } from "@/components/button";
import { Drawer } from "@/components/drawer";

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

/** Set by the button inside `Drawer.Close`, so a test can prove both handlers ran. */
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
      <Drawer.Trigger>Open drawer</Drawer.Trigger>
      <Drawer.Backdrop
        :is-dismissable="props.isDismissable"
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :portal-container="props.portalContainer"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :variant="props.variant"
      >
        <Drawer.Content :placement="props.placement">
          <Drawer.Dialog v-slot="{ close }">
            <Drawer.Handle v-if="props.withHandle" />
            <Drawer.CloseTrigger v-if="props.withCloseTrigger" v-bind="closeTriggerAttrs" />
            <Drawer.Header>
              <Drawer.Heading v-if="!props.withoutHeading">Drawer heading</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <button data-testid="body-button" type="button">In the body</button>
            </Drawer.Body>
            <Drawer.Footer>
              <ButtonRoot v-if="props.withInsideButton">Inside action</ButtonRoot>
              <Drawer.Close v-if="props.withCloseWrapper">
                <ButtonRoot @click="saved = true">Confirm</ButtonRoot>
              </Drawer.Close>
              <button data-testid="close-from-slot" type="button" @click="close()">Done</button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  </div>
</template>
