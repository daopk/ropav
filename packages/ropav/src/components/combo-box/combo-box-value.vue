<script setup lang="ts" vapor>
import type {ComboBoxValueProps, ComboBoxValueSlotProps} from "./combo-box.types";

import {computed, useSlots} from "vue";

import {dataAttr} from "../../utils/assertion";

import {useComboBoxContext} from "./combo-box.context";

const props = defineProps<ComboBoxValueProps>();

/**
 * The slot is what rich content goes through — chips for several chosen options, most of the time.
 *
 * The React build renders each chosen option's own markup here a second time. A slot's content
 * belongs to whoever wrote it in vapor, so this cannot ask an option to render itself again: it
 * shows the options' text by default, and anything more is written here with the same values React
 * hands its render function.
 */
defineSlots<{default?: (props: ComboBoxValueSlotProps) => unknown}>();

const {selectedItems, selectedText, slots} = useComboBoxContext();

const callerSlots = useSlots();

/**
 * Whether the caller wrote a slot at all, read off its presence and never by running it.
 *
 * The default cannot be `<slot>` fallback content: a slot given content by a VDOM host drops the
 * *nested* components' own slots on the first render when a fallback is declared beside them — a
 * chip comes out empty. Branching on presence keeps both paths intact.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

const isPlaceholder = computed(() => selectedItems.value.length === 0);

const styles = computed(() => slots.value.value({class: props.class}));
</script>

<template>
  <div :class="styles" :data-placeholder="dataAttr(isPlaceholder)" data-slot="combo-box-value">
    <slot
      v-if="hasSlot"
      :is-placeholder="isPlaceholder"
      :placeholder="props.placeholder"
      :selected-items="selectedItems"
      :selected-text="selectedText"
    />
    <template v-else>{{ isPlaceholder ? (props.placeholder ?? "") : selectedText }}</template>
  </div>
</template>
