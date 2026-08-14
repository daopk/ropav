<script setup lang="ts" vapor>
import {computed, shallowRef, watch} from "vue";

import {useFormReset} from "../../composables/use-form-reset";
import {useFormValidation} from "../../composables/use-form-validation";
import {visuallyHiddenStyle} from "../../utils/visually-hidden";

import {useSelectContext} from "./select.context";

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

const {select, state} = useSelectContext();

/** Fixed rather than absolute, so the control cannot add scroll to the page. */
const style = {...visuallyHiddenStyle, left: 0, position: "fixed", top: 0} as const;

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

useFormReset(element, state.defaultValue, state.setValue);

useFormValidation(element, state, {
  // A failed submit lands on the trigger, which is the control a user can actually see.
  focus: () => select.triggerElement.value?.focus(),
});

/**
 * The chosen options are written onto the element by hand, every time either side moves.
 *
 * Binding `selected` per option is not enough: the browser owns the control's own state once it
 * exists, and a form reset restores it from **attributes** that a binding never wrote. Both paths
 * end here, so both end up agreeing with the state.
 */
watch(
  [element, value, keys],
  ([control]) => {
    if (!control) return;

    if (isMultiple.value) {
      const chosen = new Set(values.value);

      for (const option of control.options) option.selected = chosen.has(option.value);

      return;
    }

    control.value = values.value[0] ?? "";
  },
  {flush: "post", immediate: true},
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
