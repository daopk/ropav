<script setup lang="ts" vapor>
import type { ToastFixtureProps } from "./fixtures.types";

import { ToastProvider, ToastTitle } from "@/components/toast";

const props = defineProps<Pick<ToastFixtureProps, "queue">>();
</script>

<template>
  <ToastProvider :queue="props.queue">
    <ToastTitle>Orphan</ToastTitle>
  </ToastProvider>
</template>
