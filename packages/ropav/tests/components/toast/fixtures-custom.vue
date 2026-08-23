<script setup lang="ts" vapor>
import type { ToastFixtureProps } from "./fixtures.types";

import { ToastProvider } from "@/components/toast";

const props = defineProps<Pick<ToastFixtureProps, "queue">>();
</script>

<template>
  <ToastProvider v-slot="{ toast, isLoading }" :queue="props.queue">
    <div :data-loading="isLoading" data-testid="custom">{{ toast.content.title }}</div>
  </ToastProvider>
</template>
