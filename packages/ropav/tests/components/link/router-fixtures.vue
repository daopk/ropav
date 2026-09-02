<script setup lang="ts" vapor>
import type { LinkRouterFixtureProps } from "./fixtures.types";

import { RouterProvider } from "@/components/router-provider";

import LinkFixture from "./fixtures.vue";

// Every prop whose type includes `boolean` declares an explicit `undefined` default, for the
// reason `link-root.vue` writes out: Vue casts an absent one to `false`, and a fixture that
// forwards `download="false"` hands the link a download it never asked for.
const props = withDefaults(defineProps<LinkRouterFixtureProps>(), {
  ariaCurrent: undefined,
  download: undefined,
  isDisabled: undefined,
});
</script>

<template>
  <RouterProvider
    :is-current="props.isCurrent"
    :navigate="props.navigate"
    :resolve-href="props.resolveHref"
  >
    <LinkFixture
      :aria-current="props.ariaCurrent"
      :download="props.download"
      :href="props.href"
      :is-disabled="props.isDisabled"
      :on-click="props.onClick"
      :rel="props.rel"
      :router-options="props.routerOptions"
      :target="props.target"
    />
  </RouterProvider>
</template>
