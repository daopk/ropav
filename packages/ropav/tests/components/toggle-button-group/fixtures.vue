<script setup lang="ts" vapor>
import type { ToggleButtonGroupRootProps } from "@/components/toggle-button-group";

import { ToggleButton } from "@/components/toggle-button";
import { ToggleButtonGroup } from "@/components/toggle-button-group";

const props = withDefaults(
  defineProps<
    ToggleButtonGroupRootProps & {
      /** Disables the first button only, leaving the group enabled. */
      childIsDisabled?: boolean;
      /** Renders every button as icon-only. */
      isIconOnly?: boolean;
      /** Renders a separator inside the second button, dividing it from the first. */
      withSeparator?: boolean;
    }
  >(),
  // Absent has to stay absent, or the fixture would pass `false` down and override the
  // group in every test that does not set it.
  {
    childIsDisabled: undefined,
    isDisabled: undefined,
    isIconOnly: undefined,
  },
);

defineEmits<{ selectionChange: [keys: Set<string | number>] }>();
</script>

<template>
  <ToggleButtonGroup
    :class="props.class"
    :default-selected-keys="props.defaultSelectedKeys"
    :disallow-empty-selection="props.disallowEmptySelection"
    :full-width="props.fullWidth"
    :is-detached="props.isDetached"
    :is-disabled="props.isDisabled"
    :orientation="props.orientation"
    :selected-keys="props.selectedKeys"
    :selection-mode="props.selectionMode"
    :size="props.size"
    @selection-change="$emit('selectionChange', $event)"
  >
    <ToggleButton id="bold" :is-disabled="props.childIsDisabled" :is-icon-only="props.isIconOnly">
      Bold
    </ToggleButton>
    <ToggleButton id="italic" :is-icon-only="props.isIconOnly">
      <ToggleButtonGroup.Separator v-if="props.withSeparator" />
      Italic
    </ToggleButton>
    <ToggleButton id="underline" :is-icon-only="props.isIconOnly">Underline</ToggleButton>
  </ToggleButtonGroup>
</template>
