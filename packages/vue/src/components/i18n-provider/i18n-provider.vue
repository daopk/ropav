<script setup lang="ts" vapor>
import type {I18nProviderRootProps} from "./i18n-provider.types";

import {provideLocale} from "../../composables/use-locale";

const props = defineProps<I18nProviderRootProps>();

defineSlots<{default?: () => unknown}>();

// Renders no element of its own: every locale-aware descendant reads this through `useLocale`,
// so there is nothing for a wrapper to carry.
provideLocale(() => props.locale);
</script>

<template>
  <slot />
</template>
