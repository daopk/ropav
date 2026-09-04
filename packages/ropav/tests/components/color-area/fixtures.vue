<script setup lang="ts" vapor>
import type { ColorAreaProps } from "@/components/color-area";
import type { Color } from "@/utils/color-types";

import { ColorArea, ColorAreaThumb } from "@/components/color-area";

defineProps<
  ColorAreaProps & {
    /** Wraps the area in a form, so a reset has something to reset. */
    withForm?: boolean;
  }
>();

defineEmits<{
  change: [value: Color];
  changeEnd: [value: Color];
}>();
</script>

<template>
  <form v-if="$props.withForm" data-testid="form">
    <ColorArea
      :default-value="$props.defaultValue"
      :value="$props.value"
      :x-channel="$props.xChannel"
      :y-channel="$props.yChannel"
      @change="$emit('change', $event)"
    >
      <ColorAreaThumb />
    </ColorArea>
    <button data-testid="reset" type="reset">Reset</button>
  </form>
  <ColorArea
    v-else
    :id="$props.id"
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :class="$props.class"
    :color-space="$props.colorSpace"
    :default-value="$props.defaultValue"
    :form="$props.form"
    :is-disabled="$props.isDisabled"
    :show-dots="$props.showDots"
    :value="$props.value"
    :x-channel="$props.xChannel"
    :x-name="$props.xName"
    :y-channel="$props.yChannel"
    :y-name="$props.yName"
    @change="$emit('change', $event)"
    @change-end="$emit('changeEnd', $event)"
  >
    <ColorAreaThumb />
  </ColorArea>
</template>
