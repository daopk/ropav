<script setup lang="ts" vapor>
import type {BadgeRootProps} from "@/components/badge";

import {Badge} from "@/components/badge";

defineProps<
  BadgeRootProps & {
    anchorClass?: string;
    content?: "text" | "number" | "explicit" | "icon" | "none";
    label?: string;
    labelClass?: string;
  }
>();
</script>

<template>
  <Badge.Anchor :class="$props.anchorClass" data-testid="anchor">
    <span data-testid="anchor-content">Anchor</span>
    <Badge
      :class="$props.class"
      :color="$props.color"
      data-testid="badge"
      :placement="$props.placement"
      :size="$props.size"
      :variant="$props.variant"
    >
      <template v-if="$props.content === 'explicit'">
        <Badge.Label :class="$props.labelClass" data-testid="label">Explicit label</Badge.Label>
      </template>
      <template v-else-if="$props.content === 'icon'">
        <svg data-testid="icon" />
      </template>
      <template v-else-if="$props.content === 'number'">24</template>
      <template v-else-if="$props.content !== 'none'">{{ $props.label ?? "5" }}</template>
    </Badge>
  </Badge.Anchor>
</template>
