<script setup lang="ts" vapor>
import {computed, shallowRef, watch} from "vue";

import {setFormValue} from "../../utils/form-value";

import {useComboBoxContext} from "./combo-box.context";

/**
 * The chosen key(s), out of sight, so a form can submit them.
 *
 * The field itself carries the *text*, which is a different value — so when a form is meant to send
 * the key it is sent from here instead, one input per chosen option, exactly as the React build
 * renders it. Nothing here is reachable or announced: it is a value, not a control.
 */
const props = withDefaults(defineProps<{name: string; form?: string}>(), {form: undefined});

const {state} = useComboBoxContext();

const values = computed(() => {
  const current = state.value.value;

  if (current == null) return [""];

  const keys = (Array.isArray(current) ? current : [current]).map(String);

  // One input carrying nothing rather than none at all, so the field always appears in the form
  // data — a name that vanishes when the value is cleared reads as "not part of this form".
  return keys.length > 0 ? keys : [""];
});

const elements = shallowRef<Array<HTMLInputElement | null>>([]);

const setElement = (index: number) => (element: unknown) => {
  elements.value[index] = element instanceof HTMLInputElement ? element : null;
  elements.value = [...elements.value];
};

/*
 * The value is written as both halves by hand.
 *
 * A vapor binding writes the `value` *property*, which leaves the element with no reset source at
 * all — the browser restores an input from its `value` attribute, so a reset would blank a field
 * the user can see is filled. The state is restored separately, from the field's own reset
 * listener; this keeps the markup honest in the moment before that lands.
 */
watch(
  [elements, values],
  ([controls, next]) => {
    controls.forEach((control, index) => setFormValue(control, next[index] ?? ""));
  },
  {flush: "post", immediate: true},
);
</script>

<template>
  <input
    v-for="(value, index) in values"
    :key="index"
    :ref="setElement(index)"
    :form="props.form"
    :name="props.name"
    type="hidden"
    :value="value"
  />
</template>
