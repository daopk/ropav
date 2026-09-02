<script setup lang="ts" vapor>
import type { RouterProviderFixtureProps } from "./fixtures.types";

import { RouterProvider } from "@/components/router-provider";

import RouterHost from "../../fixtures/router-host.vue";

const props = defineProps<RouterProviderFixtureProps>();

/** The provider requires a `navigate`; most of these tests are not about what it does. */
const noop = () => {};
</script>

<template>
  <RouterProvider
    :is-current="props.isCurrent"
    :navigate="props.navigate ?? noop"
    :resolve-href="props.resolveHref"
  >
    <RouterProvider v-if="props.innerNavigate" :navigate="props.innerNavigate">
      <RouterHost :on-ready="props.onReady" />
    </RouterProvider>
    <RouterHost v-else :on-ready="props.onReady" />
  </RouterProvider>
</template>
