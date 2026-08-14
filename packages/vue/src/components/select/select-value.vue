<script setup lang="ts" vapor>
import type {SelectValueProps, SelectValueSlotProps} from "./select.types";

import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";

import {useSelectContext} from "./select.context";

const props = defineProps<SelectValueProps>();

/**
 * The slot is what rich content in the trigger goes through.
 *
 * The React build renders the chosen option's own markup here a second time. A slot's content
 * belongs to whoever wrote it in vapor, so `Select.Value` cannot ask an option to render itself
 * again — it shows the option's text by default, and anything more is written here, with the
 * same values React hands its render function.
 */
defineSlots<{default?: (props: SelectValueSlotProps) => unknown}>();

const {placeholder, select, selectedItems, selectedText, slots} = useSelectContext();

const isPlaceholder = computed(() => selectedItems.value.length === 0);

const styles = computed(() => slots.value.value({class: props.class}));
</script>

<template>
  <span
    :id="select.valueId.value"
    :class="styles"
    :data-placeholder="dataAttr(isPlaceholder)"
    data-slot="select-value"
  >
    <slot
      :is-placeholder="isPlaceholder"
      :placeholder="placeholder"
      :selected-items="selectedItems"
      :selected-text="selectedText"
    >
      {{ isPlaceholder ? placeholder : selectedText }}
    </slot>
  </span>
</template>
