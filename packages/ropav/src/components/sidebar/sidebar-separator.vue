<script setup lang="ts" vapor>
import type { SidebarSeparatorProps } from "./sidebar.types";

import { composeSlotClassName } from "../../utils/compose";
import SeparatorRoot from "../separator/separator-root.vue";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarSeparatorProps>();

const { slots } = useSidebarContext();
</script>

<template>
  <!-- The library's own rule, spaced for the nav. It keeps the separator's own full width, which
    is the box every item beside it already fills; `sidebar-content.vue` hands down the `div`
    element type so it takes part in the column rather than breaking out of it. -->
  <SeparatorRoot :class="composeSlotClassName(slots.separator, props.class)" />
</template>
