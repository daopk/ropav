<script setup lang="ts" vapor>
import type {ButtonRootProps} from "./button.types";

import {buttonVariants} from "@heroui/styles";
import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";

const props = withDefaults(defineProps<ButtonRootProps>(), {type: "button"});

const emit = defineEmits<{click: [event: MouseEvent]}>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() =>
  buttonVariants({
    class: props.class,
    fullWidth: props.fullWidth,
    isIconOnly: props.isIconOnly,
    size: props.size,
    variant: props.variant,
  }),
);

const onClick = (event: MouseEvent) => {
  // A pending button stays focusable rather than `disabled`, so activation is blocked here.
  if (props.isPending) {
    event.preventDefault();

    return;
  }

  emit("click", event);
};
</script>

<template>
  <button
    :aria-disabled="props.isPending || undefined"
    :class="styles"
    :data-pending="dataAttr(props.isPending)"
    data-slot="button"
    :disabled="props.isDisabled || undefined"
    :type="props.type"
    @click="onClick"
  >
    <slot />
  </button>
</template>
