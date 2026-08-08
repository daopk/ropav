<script setup lang="ts" vapor>
import type {SearchFieldGroupProps, SearchFieldGroupSlotProps} from "./search-field.types";

import {computed} from "vue";

import {useFocusWithin, useInteractionStates} from "../../composables/use-interaction-states";
import {useTextFieldControlContext} from "../../composables/use-text-field";
import {dataAttr} from "../../utils/assertion";

import {useSearchFieldContext} from "./search-field.context";

const props = defineProps<SearchFieldGroupProps>();

defineSlots<{default?: (props: SearchFieldGroupSlotProps) => unknown}>();

const {slots} = useSearchFieldContext();
const control = useTextFieldControlContext();

const styles = computed(() => slots.value.group({class: props.class}));

const isDisabled = computed(() => control?.isDisabled.value ?? false);
const isInvalid = computed(() => control?.isInvalid.value ?? false);

// Hover is read off this one only; press has no meaning for a shell around a control. The
// stylesheet suppresses the hover fill while focus is inside, so the two have to be reported
// together or a group that is both hovered and focused keeps the hover fill.
const interaction = useInteractionStates({isDisabled});
const focusWithin = useFocusWithin();

// A real group, unlike the one inside a text field: the field hands this one no role, so it
// reports itself rather than staying presentational.
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(isInvalid)"
    data-slot="search-field-group"
    role="group"
    @focusin="focusWithin.onFocusin"
    @focusout="focusWithin.onFocusout"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot
      :is-disabled="isDisabled"
      :is-focus-visible="focusWithin.isFocusVisible.value"
      :is-focus-within="focusWithin.isFocusWithin.value"
      :is-hovered="interaction.isHovered.value"
      :is-invalid="isInvalid"
    />
  </div>
</template>
