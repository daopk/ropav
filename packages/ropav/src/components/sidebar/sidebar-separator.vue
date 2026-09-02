<script setup lang="ts" vapor>
import type { SidebarSeparatorProps } from "./sidebar.types";

import { composeSlotClassName } from "../../utils/compose";
import SeparatorRoot from "../separator/separator-root.vue";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarSeparatorProps>();

const { slots } = useSidebarContext();
</script>

<template>
  <!-- The library's own rule, inset to the nav's gutter. `w-auto` beats the `w-full` the separator
    carries because the class goes through `tv()`, where tailwind-merge lets a caller override. -->
  <SeparatorRoot :class="composeSlotClassName(slots.separator, props.class)" />
</template>
