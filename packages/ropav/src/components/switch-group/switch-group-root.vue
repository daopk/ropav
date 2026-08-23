<script setup lang="ts" vapor>
import type { SwitchGroupRootProps } from "./switch-group.types";

import { switchGroupVariants } from "@ropav/styles";
import { computed } from "vue";

const props = defineProps<SwitchGroupRootProps>();

defineSlots<{ default?: () => unknown }>();

const styles = computed(() => switchGroupVariants({ orientation: props.orientation }));
</script>

<template>
  <div :class="styles.base({ class: props.class })" data-slot="switch-group">
    <div :class="styles.items()" data-slot="switch-group-items">
      <slot />
    </div>
  </div>
</template>
