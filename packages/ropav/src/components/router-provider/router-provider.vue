<script setup lang="ts" vapor>
import type { RouterProviderRootProps } from "./router-provider.types";

import { provideRouterContext } from "./router-provider.context";

const props = defineProps<RouterProviderRootProps>();

defineSlots<{ default?: () => unknown }>();

// Renders no element of its own: every link below reads this through `useRouterContext`, so
// there is nothing for a wrapper to carry.
//
// Each function delegates to the prop rather than being captured from it, so a router that is
// rebound — created lazily, or swapped in a test — is followed by links already mounted. The two
// optional ones are defaulted here rather than at every call site, since "no predicate" and
// "the predicate said no" reach a link as the same answer anyway.
provideRouterContext({
  isCurrent: (href) => props.isCurrent?.(href) ?? false,
  navigate: (href, options) => props.navigate(href, options),
  resolveHref: (href) => props.resolveHref?.(href) ?? href,
});
</script>

<template>
  <slot />
</template>
