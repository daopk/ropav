<script setup lang="ts" vapor>
import { DropZone, DropZoneTrigger } from "@/components/drop-zone";

const props = defineProps<{
  accept?: string;
  ariaDescribedby?: string;
  ariaLabel?: string;
  class?: string;
  isDisabled?: boolean;
  multiple?: boolean;
  onSelect?: (files: File[]) => void;
}>();
</script>

<template>
  <DropZone
    :accept="props.accept"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :class="props.class"
    data-foo="bar"
    :is-disabled="props.isDisabled"
    :multiple="props.multiple"
    @select="props.onSelect?.($event)"
  >
    <template #default="{ status }">
      <span data-testid="status">{{ status }}</span>
      <DropZoneTrigger>browse</DropZoneTrigger>
    </template>
  </DropZone>
</template>
