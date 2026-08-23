<script setup lang="ts" vapor>
import type { DatePickerFixtureProps } from "./fixtures.types";

import { provideLocale } from "@/composables/use-locale";

import DatePickerFixtureBody from "./fixtures-body.vue";

/*
 * The three-state booleans declare `default: undefined` here as well as in the body below. Vue casts
 * an absent Boolean prop to `false`, and `v-bind` would forward that `false` on as a present value —
 * which no default further down can undo.
 */
const props = withDefaults(defineProps<DatePickerFixtureProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldCloseOnSelect: undefined,
});

/*
 * The locale is provided here and read by the picker below rather than in the same component: Vue
 * resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <DatePickerFixtureBody v-bind="props" />
</template>
