<script setup lang="ts" vapor>
import type { AutocompleteValueProps, AutocompleteValueSlotProps } from "./autocomplete.types";

import { computed, useSlots } from "vue";

import { dataAttr } from "../../utils/assertion";

import { useAutocompleteContext } from "./autocomplete.context";

const props = defineProps<AutocompleteValueProps>();

/**
 * The slot is what rich content in the trigger goes through.
 *
 * The React build renders the chosen option's own markup here a second time. A slot's content
 * belongs to whoever wrote it in vapor, so this cannot ask an option to render itself again — it
 * shows the option's text by default, and anything more is written here, with the same values
 * React hands its render function.
 */
defineSlots<{ default?: (props: AutocompleteValueSlotProps) => unknown }>();

const { placeholder, select, selectedItems, selectedText, slots } = useAutocompleteContext();

const callerSlots = useSlots();

/**
 * Whether the caller wrote a slot at all, read off its presence and never by running it.
 *
 * The default cannot be `<slot>` fallback content: a slot given content by a VDOM host drops the
 * *nested* components' own slots on the first render when a fallback is declared beside them — a
 * tag in the trigger comes out as an empty tag. Branching on presence keeps both paths intact.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

const isPlaceholder = computed(() => selectedItems.value.length === 0);

const styles = computed(() => slots.value.value({ class: props.class }));
</script>

<template>
  <span
    :id="select.valueId.value"
    :class="styles"
    :data-placeholder="dataAttr(isPlaceholder)"
    data-slot="autocomplete-value"
  >
    <slot
      v-if="hasSlot"
      :is-placeholder="isPlaceholder"
      :placeholder="placeholder"
      :selected-items="selectedItems"
      :selected-text="selectedText"
    />
    <template v-else>{{ isPlaceholder ? placeholder : selectedText }}</template>
  </span>
</template>
