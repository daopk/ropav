<script setup lang="ts" vapor>
import type { KbdAbbrProps } from "./kbd.types";

import { computed } from "vue";

import { kbdKeysLabelMap, kbdKeysMap } from "./kbd.constants";

const props = defineProps<KbdAbbrProps>();

// The symbol is what is shown; the spelled-out name is what a screen reader announces, which
// is the whole reason this is an `abbr` rather than plain text.
const symbol = computed(() => kbdKeysMap[props.keyValue]);
const label = computed(() => kbdKeysLabelMap[props.keyValue]);
</script>

<template>
  <abbr :class="['rp-kbd__abbr', props.class]" :title="label">{{ symbol }}</abbr>
</template>
