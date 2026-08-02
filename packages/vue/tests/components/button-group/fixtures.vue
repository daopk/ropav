<script setup lang="ts" vapor>
import type {ButtonGroupRootProps} from "@/components/button-group";

import {Button} from "@/components/button";
import {ButtonGroup} from "@/components/button-group";

const props = withDefaults(
  defineProps<
    ButtonGroupRootProps & {
      /** Renders the second button one level deeper, outside the direct-child position. */
      nested?: boolean;
      /** Renders a separator between the two buttons. */
      withSeparator?: boolean;
      /** Overrides applied to the first button only. */
      childIsDisabled?: boolean;
      childSize?: ButtonGroupRootProps["size"];
      childVariant?: ButtonGroupRootProps["variant"];
    }
  >(),
  // Absent has to stay absent, or the fixture would pass `false` down and override the
  // group in every test that does not set it.
  {
    childIsDisabled: undefined,
    childSize: undefined,
    childVariant: undefined,
    isDisabled: undefined,
  },
);

defineEmits<{click: [event: MouseEvent]}>();
</script>

<template>
  <ButtonGroup
    :class="props.class"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :orientation="props.orientation"
    :size="props.size"
    :variant="props.variant"
  >
    <Button
      :is-disabled="props.childIsDisabled"
      :size="props.childSize"
      :variant="props.childVariant"
      @click="$emit('click', $event)"
    >
      Save
    </Button>
    <ButtonGroup.Separator v-if="props.withSeparator" />
    <div v-if="props.nested">
      <Button>Nested</Button>
    </div>
    <Button v-else>Cancel</Button>
  </ButtonGroup>
</template>
