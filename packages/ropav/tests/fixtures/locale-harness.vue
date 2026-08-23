<script setup lang="ts" vapor>
import type { LocaleHarnessProps } from "./locale.types";

import { provideLocale } from "@/composables/use-locale";

import LocaleHost from "./locale-host.vue";

// The context has to come from an ancestor, so the harness is a component of its own rather
// than something the test assembles — `inject` outside a component returns `undefined`.
const props = withDefaults(defineProps<LocaleHarnessProps>(), { withProvider: undefined });

if (props.withProvider !== false) provideLocale(() => props.locale);
</script>

<template>
  <LocaleHost :on-ready="props.onReady" />
</template>
