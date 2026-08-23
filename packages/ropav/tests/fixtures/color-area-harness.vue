<script setup lang="ts" vapor>
import type { ColorAreaHarnessProps } from "./color-area.types";

import { provideLocale } from "@/composables/use-locale";

import ColorAreaHost from "./color-area-host.vue";

// The locale has to come from an ancestor: `inject` reads the parent's provides, so a component
// cannot see one it provided itself.
const props = withDefaults(defineProps<ColorAreaHarnessProps>(), { isDisabled: undefined });

provideLocale(() => props.locale);
</script>

<template>
  <ColorAreaHost
    :id="props.id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :color-space="props.colorSpace"
    :default-value="props.defaultValue"
    :form="props.form"
    :is-disabled="props.isDisabled"
    :on-change="props.onChange"
    :on-change-end="props.onChangeEnd"
    :on-ready="props.onReady"
    :value="props.value"
    :x-channel="props.xChannel"
    :x-name="props.xName"
    :y-channel="props.yChannel"
    :y-name="props.yName"
  />
</template>
