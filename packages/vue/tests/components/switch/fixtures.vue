<script setup lang="ts" vapor>
import type {SwitchRootProps} from "@/components/switch";

import {Description} from "@/components/description";
import {Switch} from "@/components/switch";

// `isSelected` has to declare an explicit `undefined` default here too: forwarding a boolean
// prop that Vue cast to `false` would hand the switch a controlled value it never asked for.
withDefaults(
  defineProps<
    SwitchRootProps & {
      /** Renders help text as a sibling of the clickable content. */
      withDescription?: boolean;
      /** Renders a custom icon inside the thumb. */
      withIcon?: boolean;
    }
  >(),
  {isSelected: undefined},
);

defineEmits<{change: [isSelected: boolean]}>();
</script>

<template>
  <Switch
    :class="$props.class"
    :default-selected="$props.defaultSelected"
    :form="$props.form"
    :is-disabled="$props.isDisabled"
    :is-invalid="$props.isInvalid"
    :is-read-only="$props.isReadOnly"
    :is-required="$props.isRequired"
    :is-selected="$props.isSelected"
    :name="$props.name"
    :size="$props.size"
    :value="$props.value"
    @change="$emit('change', $event)"
  >
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb>
          <Switch.Icon v-if="$props.withIcon">
            <svg data-testid="thumb-icon" />
          </Switch.Icon>
        </Switch.Thumb>
      </Switch.Control>
      Enable notifications
    </Switch.Content>
    <Description v-if="$props.withDescription">Allow others to see your profile</Description>
  </Switch>
</template>
