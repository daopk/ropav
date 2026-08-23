<script setup lang="ts" vapor>
import type {LocaleHostProps} from "./locale.types";

import {useLocale} from "@/composables/use-locale";

const props = defineProps<LocaleHostProps>();

props.onReady?.(useLocale());
</script>

<template>
  <span data-slot="locale-host" />
</template>
