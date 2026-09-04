<script setup lang="ts" vapor>
import type { CardVariants } from "@ropav/styles";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card";

defineProps<{ class?: string; variant?: CardVariants["variant"] }>();
</script>

<template>
  <Card :class="$props.class" :variant="$props.variant">
    <CardHeader>
      <CardTitle>Card title</CardTitle>
      <CardDescription>Card description</CardDescription>
    </CardHeader>
    <CardContent>Card content</CardContent>
    <CardFooter>Card footer</CardFooter>
  </Card>
</template>
