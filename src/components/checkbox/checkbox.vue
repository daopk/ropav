<template>
    <label v-bind="rootAttrs">
        <input
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="inputRef"
            :name="name"
            :form="control.form ?? nativeInputAttrs.form"
            type="checkbox"
            :value="value"
            :checked="controllable.value.value"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            :indeterminate="indeterminate"
            :aria-checked="indeterminate ? 'mixed' : controllable.value.value"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
            :data-disabled="toPresenceAttribute(control.disabled)"
            :data-invalid="toPresenceAttribute(control.invalid)"
            :data-state="state"
        />
        <span v-bind="getPartAttrs('indicator', { class: 'rp-checkbox__box' })">
            <Transition name="rp-checkbox-icon" mode="out-in">
                <MinusIcon v-if="indeterminate" key="minus" class="rp-checkbox__icon" />
                <CheckIcon
                    v-else-if="controllable.value.value"
                    key="check"
                    class="rp-checkbox__icon"
                />
            </Transition>
        </span>
        <span v-if="$slots.default" v-bind="getPartAttrs('label', { class: 'rp-checkbox__label' })">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import CheckIcon from '~icons/lucide/check';
import MinusIcon from '~icons/lucide/minus';
import { useControllableValue } from '@/composables/useControllableValue';
import { useCheckedFormControl } from '@/internal/composables/useFormControl';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { useCheckbox } from './useCheckbox';
import type { CheckboxPart, CheckboxProps } from './types';

defineOptions({ name: 'RpCheckbox', inheritAttrs: false });

const props = withDefaults(defineProps<CheckboxProps>(), {
    modelValue: undefined,
    defaultValue: false,
    value: 'on',
    autoContrast: true,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    indeterminate: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const controllable = useControllableValue({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const { inputRef, control, rootClass, rootStyle, onChange, focus } = useCheckbox(
    props,
    (value) => controllable.setValue(value),
    () => controllable.value.value,
);
const state = computed(() =>
    props.indeterminate ? 'indeterminate' : controllable.value.value ? 'checked' : 'unchecked',
);

useCheckedFormControl(
    () => inputRef.value,
    controllable,
    () => props.validationMessage,
);
const { getPartAttrs, getRootAttrs } = useStylesApi<CheckboxPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        'data-state': state.value,
    }),
);

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const {
        class: compatibilityClass,
        style: compatibilityStyle,
        onChange: compatibilityOnChange,
        ...attrs
    } = props.inputAttrs ?? {};

    return {
        ...attrs,
        ...getPartAttrs('input', {
            class: 'rp-checkbox__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        onChange(event) {
            onChange(event);
            compatibilityOnChange?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./checkbox.scss" lang="scss" scoped></style>
