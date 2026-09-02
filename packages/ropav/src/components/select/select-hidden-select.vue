<script setup lang="ts" vapor>
import { computed, shallowRef, watch } from "vue";

import { useFormReset } from "../../composables/use-form-reset";
import { useFormValidation } from "../../composables/use-form-validation";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";

import { useSelectContext } from "./select.context";

/**
 * A native `<select>`, out of sight, so a form can submit the value and the browser can autofill.
 *
 * Ported from React Aria's `HiddenSelect`. It is clipped rather than hidden: Safari refuses to
 * autofill a `display: none` control, and Firefox needs the `<label>` around it to identify what
 * it is. Hidden from assistive technology instead, and taken out of the tab order — the trigger
 * is what a user reaches.
 */
const props = withDefaults(
  defineProps<{
    name?: string;
    form?: string;
    autocomplete?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
  }>(),
  {
    autocomplete: undefined,
    form: undefined,
    isDisabled: undefined,
    isRequired: undefined,
    name: undefined,
  },
);

const { select, state } = useSelectContext();

/** Fixed rather than absolute, so the control cannot add scroll to the page. */
const style = { ...visuallyHiddenStyle, left: 0, position: "fixed", top: 0 } as const;

const element = shallowRef<HTMLSelectElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLSelectElement ? next : null;
};

const isMultiple = computed(() => state.selectionMode.value === "multiple");

const keys = computed(() => [...state.collection.orderedKeys()]);

const values = computed(() => {
  const current = state.value.value;

  if (current == null) return [];

  return (Array.isArray(current) ? current : [current]).map(String);
});

const value = computed(() => (isMultiple.value ? values.value : (values.value[0] ?? "")));

useFormReset(element, state.defaultValue, state.setValue, () => props.form);

useFormValidation(element, state, {
  // A failed submit lands on the trigger, which is the control a user can actually see.
  focus: () => select.triggerElement.value?.focus(),
});

const defaultValues = computed(() => {
  const initial = state.defaultValue.value;

  if (initial == null) return [];

  return (Array.isArray(initial) ? initial : [initial]).map(String);
});

/**
 * The chosen options are written onto the element by hand, every time either side moves.
 *
 * Two halves, and both are needed. `selected` is the live state, which a binding could carry —
 * except the browser owns the control once it exists, so it is written here alongside everything
 * else. `defaultSelected` is the `selected` **attribute**, and it is the half a form reset reads:
 * the browser restores each option's *default* selectedness, so without it a reset lands on the
 * blank leading option and the form would submit nothing while the trigger still showed a value.
 *
 * Re-asserting after the `reset` event does not stand in for it: a reset from a real click drains
 * microtasks *between* dispatching the event and restoring the controls, so a post-flush write is
 * overwritten — the exact shape that leaves a script-driven test green while the real thing is
 * broken.
 */
watch(
  [element, value, keys, defaultValues],
  ([control]) => {
    if (!control) return;

    const chosen = new Set(values.value);
    const initial = new Set(defaultValues.value);

    for (const option of control.options) {
      option.defaultSelected = initial.has(option.value);
      if (isMultiple.value) option.selected = chosen.has(option.value);
    }

    if (!isMultiple.value) control.value = values.value[0] ?? "";
  },
  { flush: "post", immediate: true },
);

const onChange = (event: Event) => {
  const control = event.target as HTMLSelectElement;

  if (control.multiple) {
    state.setValue([...control.selectedOptions].map((option) => option.value));

    return;
  }

  state.setValue(control.value === "" ? null : control.value);
};
</script>

<template>
  <div
    aria-hidden="true"
    data-a11y-ignore="aria-hidden-focus"
    data-react-aria-prevent-focus="true"
    :style="style"
  >
    <label>
      <select
        :ref="setElement"
        :autocomplete="props.autocomplete"
        :disabled="props.isDisabled || undefined"
        :form="props.form"
        :multiple="isMultiple || undefined"
        :name="props.name"
        :required="(state.validationBehavior.value === 'native' && props.isRequired) || undefined"
        tabindex="-1"
        @change="onChange"
      >
        <!-- A blank option so a single select can hold nothing, exactly as upstream renders it. -->
        <option label="&#160;" value="">&#160;</option>
        <option v-for="key in keys" :key="key" :value="String(key)">
          {{ state.collection.getItem(key)?.textValue() ?? "" }}
        </option>
      </select>
    </label>
  </div>
</template>
