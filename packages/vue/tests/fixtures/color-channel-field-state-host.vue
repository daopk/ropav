<script setup lang="ts" vapor>
import type {ColorChannelFieldStateHostProps} from "./color-field.types";

import {useColorChannelFieldState} from "@/composables/use-color-channel-field-state";

const props = withDefaults(defineProps<ColorChannelFieldStateHostProps>(), {
  isDisabled: undefined,
  isReadOnly: undefined,
});

props.onReady(
  useColorChannelFieldState({
    channel: () => props.channel ?? "red",
    colorSpace: () => props.colorSpace,
    defaultValue: () => props.defaultValue,
    isDisabled: () => props.isDisabled,
    isReadOnly: () => props.isReadOnly,
    locale: () => props.locale ?? "en-US",
    onChange: props.onChange,
    validationBehavior: () => props.validationBehavior,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="color-channel-field-state-host" />
</template>
