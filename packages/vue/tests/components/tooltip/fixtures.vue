<script setup lang="ts" vapor>
import type {TooltipFixtureProps} from "./fixtures.types";

import {ButtonRoot} from "@/components/button";
import {Tooltip} from "@/components/tooltip";

// Every three-state boolean declares an explicit `undefined` default: forwarding a `false` that
// Vue had cast would turn the tooltip controlled, or read as a deliberate opt-out of closing on
// press.
const props = withDefaults(defineProps<TooltipFixtureProps>(), {
  closeDelay: undefined,
  defaultOpen: undefined,
  delay: undefined,
  isDisabled: undefined,
  isOpen: undefined,
  placement: undefined,
  shouldCloseOnPress: undefined,
  shouldFlip: undefined,
  shouldSkipAnimation: undefined,
  showArrow: undefined,
  trigger: undefined,
  withArrow: undefined,
  withCustomArrow: undefined,
  withCustomTrigger: undefined,
});

const emit = defineEmits<{openChange: [isOpen: boolean]}>();
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <Tooltip
      :close-delay="props.closeDelay"
      :default-open="props.defaultOpen"
      :delay="props.delay"
      :is-disabled="props.isDisabled"
      :is-open="props.isOpen"
      :should-close-on-press="props.shouldCloseOnPress"
      :should-skip-animation="props.shouldSkipAnimation"
      :trigger="props.trigger"
      @open-change="emit('openChange', $event)"
    >
      <Tooltip.Trigger v-if="props.withCustomTrigger">Actions</Tooltip.Trigger>
      <ButtonRoot v-else>Open tooltip</ButtonRoot>
      <Tooltip.Content
        :placement="props.placement"
        :should-flip="props.shouldFlip"
        :show-arrow="props.showArrow"
      >
        <Tooltip.Arrow v-if="props.withArrow">
          <svg v-if="props.withCustomArrow" data-testid="custom-arrow" />
        </Tooltip.Arrow>
        Tooltip content
      </Tooltip.Content>
    </Tooltip>
  </div>
</template>
