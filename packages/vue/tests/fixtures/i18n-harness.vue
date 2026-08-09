<script setup lang="ts" vapor>
import type {I18nHarnessProps} from "./i18n.types";

import {provideLocale} from "@/composables/use-locale";

import I18nHost from "./i18n-host.vue";

// The locale has to come from an ancestor, so the harness is a component of its own.
const props = defineProps<I18nHarnessProps>();

provideLocale(() => props.locale);
</script>

<template>
  <I18nHost
    :date-options="props.dateOptions"
    :filter-options="props.filterOptions"
    :on-ready="props.onReady"
  />
</template>
