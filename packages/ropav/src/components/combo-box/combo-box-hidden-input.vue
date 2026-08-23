<script setup lang="ts" vapor>
import { computed } from "vue";

import { useComboBoxContext } from "./combo-box.context";

/**
 * The chosen key(s), out of sight, so a form can submit them.
 *
 * The field itself carries the *text*, which is a different value — so when a form is meant to send
 * the key it is sent from here instead, one input per chosen option, exactly as the React build
 * renders it. Nothing here is reachable or announced: it is a value, not a control.
 *
 * No reset source is written by hand, unlike every other control in the package. Measured, both at
 * mount and after the value changed: vapor keeps the `value` *attribute* of a `type="hidden"` input
 * in step on its own, so `defaultValue` and `getAttribute("value")` already answer. The rule that
 * says otherwise is about controls a user types into, where the dirty-value flag makes the property
 * and the attribute diverge from the first keystroke — which cannot happen to an input nobody can
 * reach. Removing the write left every test green, so it was not there.
 */
const props = withDefaults(defineProps<{ name: string; form?: string }>(), { form: undefined });

const { state } = useComboBoxContext();

const values = computed(() => {
  const current = state.value.value;
  const keys = current == null ? [] : (Array.isArray(current) ? current : [current]).map(String);

  // One input carrying nothing rather than none at all, so the field always appears in the form
  // data — a name that vanishes when the value is cleared reads as "not part of this form".
  return keys.length > 0 ? keys : [""];
});
</script>

<template>
  <input
    v-for="(value, index) in values"
    :key="index"
    :form="props.form"
    :name="props.name"
    type="hidden"
    :value="value"
  />
</template>
