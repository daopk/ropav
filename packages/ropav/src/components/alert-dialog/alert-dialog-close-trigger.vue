<script setup lang="ts" vapor>
import type {AlertDialogCloseTriggerProps} from "./alert-dialog.types";

import {computed} from "vue";

import {CloseButtonRoot} from "../close-button";

import {useAlertDialogContext} from "./alert-dialog.context";

const props = defineProps<AlertDialogCloseTriggerProps>();

const {slots, state} = useAlertDialogContext();

const styles = computed(() => slots.value.closeTrigger({class: props.class}));

// A component's `click` is an emit rather than a DOM listener, so it is not subject to the rule that
// keeps handlers off `v-bind`.
const onClick = () => state.close();

/**
 * `aria-label` is deliberately **not** declared as a prop.
 *
 * `CloseButtonRoot` already names itself, and a declared prop would be bound on every render — as
 * `undefined` when the caller passed nothing, which fallthrough merges *over* the default and leaves
 * the button with no accessible name at all. Left to fallthrough, a caller's label still wins and
 * silence stays silent.
 */
</script>

<template>
  <CloseButtonRoot :class="styles" data-slot="alert-dialog-close-trigger" @click="onClick" />
</template>
