<script setup lang="ts" vapor>
import type {ButtonGroupRootProps} from "@/components/button-group";

import {Button} from "@/components/button";
import {ButtonGroup} from "@/components/button-group";

const props = withDefaults(
  defineProps<
    ButtonGroupRootProps & {
      /** Renders both buttons as icon-only, whose fixed width the group must not stretch. */
      isIconOnly?: boolean;
      /** Renders the second button one level deeper, outside the direct-child position. */
      nested?: boolean;
      /** Renders a separator inside the second button, dividing it from the first. */
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
    isIconOnly: undefined,
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
      :is-icon-only="props.isIconOnly"
      :size="props.childSize"
      :variant="props.childVariant"
      @click="$emit('click', $event)"
    >
      Save
    </Button>
    <div v-if="props.nested">
      <Button>Nested</Button>
    </div>
    <Button v-else :is-icon-only="props.isIconOnly">
      <ButtonGroup.Separator v-if="props.withSeparator" />
      Cancel
    </Button>
  </ButtonGroup>
</template>
