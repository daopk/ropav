<script setup lang="ts" vapor>
import type { KbdKey, KbdRootProps } from "@/components/kbd";

import { KbdAbbr, KbdContent, KbdRoot } from "@/components/kbd";

const props = defineProps<KbdRootProps & { keys?: KbdKey[]; text?: string }>();
</script>

<template>
  <KbdRoot :class="props.class" :variant="props.variant">
    <KbdAbbr v-for="key of props.keys ?? ['command']" :key="key" :key-value="key" />
    <KbdContent v-if="props.text">{{ props.text }}</KbdContent>
  </KbdRoot>
</template>
