<script setup lang="ts" vapor>
import type { AlertProps } from "@/components/alert";

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
} from "@/components/alert";

defineProps<
  AlertProps & {
    contentClass?: string;
    customIndicator?: boolean;
    descriptionClass?: string;
    emptyIndicator?: boolean;
    indicatorClass?: string;
    titleClass?: string;
  }
>();
</script>

<template>
  <Alert :class="$props.class" data-testid="root" :status="$props.status">
    <AlertIndicator
      v-if="$props.customIndicator"
      :class="$props.indicatorClass"
      data-testid="indicator"
    >
      <span data-testid="custom-indicator">!</span>
    </AlertIndicator>
    <!-- A declared slot that renders nothing, which is the shape React answers with empty. -->
    <AlertIndicator
      v-else-if="$props.emptyIndicator"
      :class="$props.indicatorClass"
      data-testid="indicator"
    >
      <span v-if="false" data-testid="never-rendered" />
    </AlertIndicator>
    <AlertIndicator v-else :class="$props.indicatorClass" data-testid="indicator" />
    <AlertContent :class="$props.contentClass" data-testid="content">
      <AlertTitle :class="$props.titleClass" data-testid="title">Update available</AlertTitle>
      <AlertDescription :class="$props.descriptionClass" data-testid="description">
        Refresh to get the latest features.
      </AlertDescription>
    </AlertContent>
  </Alert>
</template>
