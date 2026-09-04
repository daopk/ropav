<script setup lang="ts" vapor>
import type { KbdKey, KbdProps } from "@/components/kbd";

import { KbdAbbr, KbdContent, Kbd } from "@/components/kbd";

const props = defineProps<KbdProps & { keys?: KbdKey[]; text?: string }>();
</script>

<template>
  <Kbd :class="props.class" :variant="props.variant">
    <KbdAbbr v-for="key of props.keys ?? ['command']" :key="key" :key-value="key" />
    <KbdContent v-if="props.text">{{ props.text }}</KbdContent>
  </Kbd>
</template>
