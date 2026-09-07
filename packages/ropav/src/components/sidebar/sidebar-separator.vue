<script setup lang="ts" vapor>
import type { SidebarSeparatorProps } from "./sidebar.types";

import { normalizeClass } from "vue";

import SeparatorRoot from "../separator/separator-root.vue";

// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = defineProps<SidebarSeparatorProps>();

/*
 * The library's own rule, spaced for the nav. It keeps the separator's own full width, which
 *    is the box every item beside it already fills; `sidebar-content.vue` hands down the `div`
 *    element type so it takes part in the column rather than breaking out of it.
 */
</script>

<template>
  <SeparatorRoot :class="normalizeClass(['rp-sidebar__separator', props.class])" />
</template>
