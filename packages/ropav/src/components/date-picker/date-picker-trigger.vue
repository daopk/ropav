<script setup lang="ts" vapor>
import type { DatePickerTriggerProps } from "./date-picker.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useDatePickerContext } from "./date-picker.context";

const props = defineProps<DatePickerTriggerProps>();

defineSlots<{ default?: () => unknown }>();

const picker = useDatePickerContext();

const styles = computed(() => picker.slots.value.trigger({ class: props.class }));

// The stylesheet keys hover and the focus ring on data attributes as well as on the pseudo-classes,
// so the states have to be reported from here too.
const interaction = useInteractionStates({ isDisabled: picker.isTriggerDisabled });

const setElement = (next: unknown) => {
  picker.setTriggerElement(next instanceof HTMLElement ? next : null);
};
</script>

<template>
  <button
    :ref="setElement"
    v-bind="picker.triggerAttrs.value"
    :class="styles"
    :data-disabled="dataAttr(picker.isTriggerDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-open="dataAttr(picker.isOpen.value)"
    :data-pressed="dataAttr(picker.isOpen.value || interaction.isPressed.value)"
    data-slot="date-picker-trigger"
    :disabled="picker.isTriggerDisabled.value || undefined"
    type="button"
    @blur="interaction.onBlur"
    @click="picker.onTriggerPress"
    @focus="interaction.onFocus"
    @pointercancel="interaction.onPointerleave"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot />
  </button>
</template>
