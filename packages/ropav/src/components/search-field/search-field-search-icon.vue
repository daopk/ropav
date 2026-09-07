<script setup lang="ts" vapor>
import type { SearchFieldSearchIconProps } from "./search-field.types";

import { normalizeClass } from "vue";

import { IconSearch } from "../icons";

// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = defineProps<SearchFieldSearchIconProps>();

defineSlots<{ default?: () => unknown }>();

/* eslint-disable-next-line vue/require-toggle-inside-transition */
</script>

<template>
  <slot>
    <IconSearch
      :class="normalizeClass(['rp-search-field__search-icon', props.class])"
      data-slot="search-field-search-icon"
    />
  </slot>
</template>
