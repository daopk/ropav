<script setup lang="ts">
import type { ControlSpec, ControlValue } from "../../playgrounds/types";

import BooleanControl from "./controls/boolean-control.vue";
import EnumControl from "./controls/enum-control.vue";
import NumberControl from "./controls/number-control.vue";
import StringControl from "./controls/string-control.vue";

/**
 * Keyed on kind rather than on a model name. The library names its model prop per component —
 * `is-selected` on a switch, `value` on a select — so each wrapper writes its own, where the
 * compiler can check it. A table of names would carry them past it as strings.
 */
const kinds = {
  boolean: BooleanControl,
  enum: EnumControl,
  number: NumberControl,
  string: StringControl,
};

defineProps<{ control: ControlSpec }>();

const model = defineModel<ControlValue>({ required: true });
</script>

<template>
  <component :is="kinds[control.kind]" v-model="model" :control />
</template>
