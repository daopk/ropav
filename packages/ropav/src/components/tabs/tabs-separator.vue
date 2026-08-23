<script setup lang="ts" vapor>
import type { TabsSeparatorProps } from "./tabs.types";

import { composeSlotClassName } from "../../utils/compose";

import { useTabsContext } from "./tabs.context";

const props = defineProps<TabsSeparatorProps>();

const { slots } = useTabsContext();
</script>

<template>
  <span
    aria-hidden="true"
    :class="composeSlotClassName(slots.separator, props.class)"
    data-slot="tabs-separator"
  />
</template>
