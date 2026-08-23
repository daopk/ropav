<script setup lang="ts" vapor>
import type {ColorFieldRootProps, ColorFieldRootSlotProps} from "./color-field.types";
import type {UseColorChannelFieldReturn} from "../../composables/use-color-channel-field";
import type {UseColorFieldReturn} from "../../composables/use-color-field";
import type {Color} from "../../utils/color-types";
import type {ColorInputGroupControlHandlers} from "../color-input-group";

import {colorFieldVariants} from "@ropav/styles";
import {computed} from "vue";

import {useColorChannelField} from "../../composables/use-color-channel-field";
import {useColorField} from "../../composables/use-color-field";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {dataAttr} from "../../utils/assertion";
import {provideColorInputGroupControlContext} from "../color-input-group";
import {useColorValueContext} from "../color-picker/color-picker.context";
import {provideFieldErrorContext} from "../field-error";

// Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
// `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
// particular it would pin the field valid and turn the whole validation layer into dead code.
const props = withDefaults(defineProps<ColorFieldRootProps>(), {
  autoFocus: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
});

const emit = defineEmits<{
  change: [value: Color | null];
  "update:value": [value: Color | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: ColorFieldRootSlotProps) => unknown}>();

/**
 * Which of the two fields this is, settled once.
 *
 * A hex field and a channel field share a class and a slot contract and nothing else: different
 * state, different keyboard, different DOM. React splits them into two components and lets a
 * changed `channel` remount; here they live in one, because the field is what hands its wiring
 * down to the control through `provide` — and a `provide` made one component deeper than the one
 * a caller's slot content was handed to does not reach that content when the caller is a VDOM
 * host. So the branch is chosen in the field's own setup, and a caller who really does need to
 * switch channel at runtime writes `:key="channel"` for the remount React does implicitly.
 */
const channel = props.channel;

/**
 * The colour a `ColorPicker` above is holding, when there is one.
 *
 * A prop still wins whenever it is present — including a deliberate `null`, which is why the
 * fallback below tests for `undefined` rather than using `??`. See `ColorValueContext`.
 */
const owner = useColorValueContext();

const shared = {
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  defaultValue: () => props.defaultValue,
  id: () => props.id,
  isDisabled: () => props.isDisabled,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  onChange: (value: Color | null) => {
    // Only a real colour goes back to the picker: an emptied field means the caller has
    // nothing to say about the colour, not that the picker should become black.
    if (value) owner?.setValue(value);
    emit("change", value);
    emit("update:value", value);
  },
  onFocusChange: (isFocused: boolean) => emit("focusChange", isFocused),
  validationBehavior: () => props.validationBehavior,
  value: () => (props.value !== undefined ? props.value : owner?.value.value),
};

// `isInvalid` and `validate` reach the hex branch only. React drops both on a channel field — its
// validation state is the number field's, built without either — and mirroring that keeps the DOM
// identical rather than growing a `data-invalid` React never has.
const branch:
  | {field: UseColorChannelFieldReturn; kind: "channel"}
  | {
      field: UseColorFieldReturn;
      kind: "hex";
    } = channel
  ? {
      field: useColorChannelField({
        ...shared,
        channel: () => channel,
        colorSpace: () => props.colorSpace,
      }),
      kind: "channel",
    }
  : {
      field: useColorField({
        ...shared,
        form: () => props.form,
        isInvalid: () => props.isInvalid,
        name: () => props.name,
        validate: () => props.validate,
      }),
      kind: "hex",
    };

const field = branch.field;

// Kept apart from the attributes, as everywhere else: Vapor re-applies every `on*` key arriving
// through `v-bind` on each render and drops the previous listener as the render effect cleans up.
const handlers: ColorInputGroupControlHandlers =
  branch.kind === "hex"
    ? branch.field.handlers
    : {
        onBlur: branch.field.onBlur,
        onFocus: branch.field.onFocus,
        onInput: branch.field.onInput,
        onKeydown: branch.field.onKeydown,
        onKeyup: branch.field.onKeyup,
        onPaste: branch.field.onPaste,
      };

provideFieldIdsContext(field.fieldIds);
provideColorInputGroupControlContext({
  attrs: field.attrs,
  handlers,
  isDisabled: field.isDisabled,
  isInvalid: field.isInvalid,
  registerElement: field.registerElement,
});
provideFieldErrorContext({validation: field.state.displayValidation});

const styles = computed(() => colorFieldVariants({class: props.class, fullWidth: props.fullWidth}));

// `data-required` has to sit on the field rather than on the control: the stylesheet reads the
// field for the label's asterisk, not the input.
const displayValidation = computed(() => field.state.displayValidation.value);

const colorValue = computed<Color | null>(() => field.state.colorValue.value);

/**
 * The number a channel field submits.
 *
 * A hidden input rather than the visible one, because the visible one carries formatted text — a
 * degree sign or a percent sign is not something a server wants to parse. React does the same,
 * which is why `name` and `form` are kept off the text input on this branch. The hex branch needs
 * none of it: the text the user sees *is* the value, so `name` lands on the input itself.
 *
 * It carries the number the *text* parses to, which for a percent channel is the 0–1 value rather
 * than the 0–100 one on screen. That is what React submits too.
 */
const submittedValue = computed(() => {
  if (branch.kind !== "channel") return "";

  const value = branch.field.state.numberValue.value;

  return Number.isNaN(value) ? "" : String(value);
});
</script>

<template>
  <div
    :class="styles"
    :data-channel="channel ?? 'hex'"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(field.isReadOnly.value)"
    :data-required="dataAttr(field.isRequired.value)"
    data-slot="color-field"
  >
    <slot
      :channel="channel ?? 'hex'"
      :color-value="colorValue"
      :is-disabled="field.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="field.isReadOnly.value"
      :is-required="field.isRequired.value"
      :validation-details="displayValidation.validationDetails"
      :validation-errors="displayValidation.validationErrors"
    />
    <input
      v-if="channel && props.name"
      :form="props.form"
      :name="props.name"
      type="hidden"
      :value="submittedValue"
    />
  </div>
</template>
