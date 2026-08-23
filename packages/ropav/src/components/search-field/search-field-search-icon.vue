<script setup lang="ts" vapor>
import type { SearchFieldSearchIconProps } from "./search-field.types";

import { computed } from "vue";

import { IconSearch } from "../icons";

import { useSearchFieldContext } from "./search-field.context";

const props = defineProps<SearchFieldSearchIconProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useSearchFieldContext();

const styles = computed(() => slots.value.searchIcon({ class: props.class }));
</script>

<template>
  <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
  <slot>
    <IconSearch :class="styles" data-slot="search-field-search-icon" />
  </slot>
</template>
