<script setup lang="ts" vapor>
import type { PopoverFixtureProps } from "./fixtures.types";

import { Button } from "@/components/button";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverTrigger,
} from "@/components/popover";

// Every three-state boolean declares an explicit `undefined` default: forwarding a `false` that
// Vue had cast would turn the popover controlled, or read as a deliberate dismiss opt-out.
const props = withDefaults(defineProps<PopoverFixtureProps>(), {
  defaultOpen: undefined,
  headingLevel: undefined,
  isKeyboardDismissDisabled: undefined,
  isNonModal: undefined,
  isOpen: undefined,
  keepOpenFor: undefined,
  placement: undefined,
  shouldFlip: undefined,
  withArrow: undefined,
  withCloseFromSlot: undefined,
  withCustomArrow: undefined,
  withCustomTrigger: undefined,
  withoutDialog: undefined,
  withoutHeading: undefined,
});

const emit = defineEmits<{ openChange: [isOpen: boolean] }>();

const shouldCloseOnInteractOutside = (element: Element) =>
  !props.keepOpenFor || !element.closest(`#${props.keepOpenFor}`);
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <Popover
      :default-open="props.defaultOpen"
      :is-open="props.isOpen"
      @open-change="emit('openChange', $event)"
    >
      <PopoverTrigger v-if="props.withCustomTrigger">Actions</PopoverTrigger>
      <Button v-else>Open popover</Button>
      <PopoverContent
        :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
        :is-non-modal="props.isNonModal"
        :placement="props.placement"
        :should-close-on-interact-outside="
          props.keepOpenFor ? shouldCloseOnInteractOutside : undefined
        "
        :should-flip="props.shouldFlip"
      >
        <template v-if="props.withoutDialog">
          <p>Bare content</p>
          <!--
            Focusable, so the shape that does not contain focus can be driven by real focus moves:
            a non-modal popover with no dialog inside is the only one focus can leave.
          -->
          <button data-testid="bare-first" type="button">Bare one</button>
          <button data-testid="bare-second" type="button">Bare two</button>
        </template>
        <PopoverDialog v-else v-slot="{ close }">
          <PopoverArrow v-if="props.withArrow">
            <svg v-if="props.withCustomArrow" data-testid="custom-arrow" />
          </PopoverArrow>
          <PopoverHeading v-if="!props.withoutHeading" :level="props.headingLevel">
            Popover heading
          </PopoverHeading>
          <p>Popover body</p>
          <Button>Inside action</Button>
          <button
            v-if="props.withCloseFromSlot"
            data-testid="close-from-slot"
            type="button"
            @click="close()"
          >
            Done
          </button>
        </PopoverDialog>
      </PopoverContent>
    </Popover>
  </div>
</template>
