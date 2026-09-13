<script setup lang="ts" vapor>
import type { SearchFieldGroupProps, SearchFieldGroupSlotProps } from "./search-field.types";

import { computed, shallowRef } from "vue";

import { useFocusWithin, useInteractionStates } from "../../composables/use-interaction-states";
import { useTextFieldControlContext } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { isNestedControl } from "../../utils/focus";

import { useSearchFieldContext } from "./search-field.context";

const props = defineProps<SearchFieldGroupProps>();

defineSlots<{ default?: (props: SearchFieldGroupSlotProps) => unknown }>();

const { slots } = useSearchFieldContext();
const control = useTextFieldControlContext();

const element = shallowRef<HTMLDivElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLDivElement ? next : null;
};

const styles = computed(() => slots.value.group({ class: props.class }));

const isDisabled = computed(() => control?.isDisabled.value ?? false);
const isInvalid = computed(() => control?.isInvalid.value ?? false);

// Hover is read off this one only; press has no meaning for a shell around a control. The
// stylesheet suppresses the hover fill while focus is inside, so the two have to be reported
// together or a group that is both hovered and focused keeps the hover fill.
const interaction = useInteractionStates({ isDisabled });
const focusWithin = useFocusWithin();

/**
 * The clear button keeps its place in the layout while the field is empty — the stylesheet only
 * fades it out and takes it out of hit-testing — so a click aimed at it lands on the group, and
 * the caret would otherwise stay wherever it was. The search icon is unhittable for the same
 * reason, and so is the padding either side of the control.
 *
 * A click that did reach a control belongs to that control: the browser has already put the caret
 * in the input, and the clear button takes focus back on the way down by itself.
 */
const onClick = (event: MouseEvent) => {
  if (isNestedControl(event.target)) return;

  element.value?.querySelector("input")?.focus();
};

// A real group, unlike the one inside a text field: the field hands this one no role, so it
// reports itself rather than staying presentational.
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(isInvalid)"
    data-slot="search-field-group"
    role="group"
    @click="onClick"
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
