<script setup lang="ts" vapor>
import type { ColorSliderHarnessProps } from "./color-slider.types";

import { provideLocale } from "@/composables/use-locale";

import ColorSliderHost from "./color-slider-host.vue";

// The locale has to come from an ancestor: `inject` reads the parent's provides, so a component
// cannot see one it provided itself.
const props = withDefaults(defineProps<ColorSliderHarnessProps>(), { isDisabled: undefined });

provideLocale(() => props.locale);
</script>

<template>
  <ColorSliderHost
    :id="props.id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :channel="props.channel"
    :color-space="props.colorSpace"
    :default-value="props.defaultValue"
    :form="props.form"
    :is-disabled="props.isDisabled"
    :label-id="props.labelId"
    :name="props.name"
    :on-change="props.onChange"
    :on-ready="props.onReady"
    :orientation="props.orientation"
    :value="props.value"
  />
</template>
