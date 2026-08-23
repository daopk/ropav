<script setup lang="ts" vapor>
import type {CardVariants} from "@ropav/styles";

import {Card} from "@/components/card";

defineProps<{class?: string; variant?: CardVariants["variant"]}>();
</script>

<template>
  <Card :class="$props.class" :variant="$props.variant">
    <Card.Header>
      <Card.Title>Card title</Card.Title>
      <Card.Description>Card description</Card.Description>
    </Card.Header>
    <Card.Content>Card content</Card.Content>
    <Card.Footer>Card footer</Card.Footer>
  </Card>
</template>
