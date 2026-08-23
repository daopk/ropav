<script setup lang="ts" vapor>
import type { AlertRootProps } from "@/components/alert";

import { Alert } from "@/components/alert";

defineProps<
  AlertRootProps & {
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
    <Alert.Indicator
      v-if="$props.customIndicator"
      :class="$props.indicatorClass"
      data-testid="indicator"
    >
      <span data-testid="custom-indicator">!</span>
    </Alert.Indicator>
    <!-- A declared slot that renders nothing, which is the shape React answers with empty. -->
    <Alert.Indicator
      v-else-if="$props.emptyIndicator"
      :class="$props.indicatorClass"
      data-testid="indicator"
    >
      <span v-if="false" data-testid="never-rendered" />
    </Alert.Indicator>
    <Alert.Indicator v-else :class="$props.indicatorClass" data-testid="indicator" />
    <Alert.Content :class="$props.contentClass" data-testid="content">
      <Alert.Title :class="$props.titleClass" data-testid="title">Update available</Alert.Title>
      <Alert.Description :class="$props.descriptionClass" data-testid="description">
        Refresh to get the latest features.
      </Alert.Description>
    </Alert.Content>
  </Alert>
</template>
