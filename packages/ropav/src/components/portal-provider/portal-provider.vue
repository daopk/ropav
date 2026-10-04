<script setup lang="ts" vapor>
import type { PortalProviderRootProps } from "./portal-provider.types";

import { providePortal } from "../../composables/use-portal";

const props = defineProps<PortalProviderRootProps>();

defineSlots<{ default?: () => unknown }>();

// Renders no element of its own, like `I18nProvider`: every overlay below reads this through
// `usePortal`, so there is nothing for a wrapper to carry.
providePortal({ container: () => props.container, root: () => props.root });
</script>

<template>
  <slot />
</template>
