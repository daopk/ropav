<script setup lang="ts" vapor>
import type {FieldsetRootProps} from "./fieldset.types";

import {fieldsetVariants} from "@heroui/styles";
import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";

import {provideFieldsetContext} from "./fieldset.context";

const props = defineProps<FieldsetRootProps>();

const slots = computed(() => fieldsetVariants());

const isDisabled = computed(() => props.disabled === true);

provideFieldsetContext({isDisabled, slots});

const styles = computed(() => slots.value.base({class: props.class}));
</script>

<template>
  <fieldset
    :class="styles"
    :data-disabled="dataAttr(isDisabled)"
    data-slot="fieldset"
    :disabled="props.disabled || undefined"
  >
    <slot />
  </fieldset>
</template>
