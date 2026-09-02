<script setup lang="ts" vapor>
import type { RouterHostProps } from "./router.types";

import { useRouterContext } from "@/components/router-provider/router-provider.context";

const props = defineProps<RouterHostProps>();

props.onReady?.(useRouterContext());
</script>

<template>
  <span data-slot="router-host" />
</template>
