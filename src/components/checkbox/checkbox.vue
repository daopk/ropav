<template>
    <label
        :class="rootClass"
        :style="rootStyle"
        :data-disabled="control.disabled || undefined"
        :data-state="indeterminate ? 'indeterminate' : modelValue ? 'checked' : 'unchecked'"
    >
        <input
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="inputRef"
            :name="name"
            type="checkbox"
            class="rp-checkbox__native"
            :checked="modelValue"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            :indeterminate="indeterminate"
            :aria-checked="indeterminate ? 'mixed' : modelValue"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
        />
        <span class="rp-checkbox__box">
            <Transition name="rp-checkbox-icon" mode="out-in">
                <MinusIcon v-if="indeterminate" key="minus" class="rp-checkbox__icon" />
                <CheckIcon v-else-if="modelValue" key="check" class="rp-checkbox__icon" />
            </Transition>
        </span>
        <span v-if="$slots.default" class="rp-checkbox__label">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import CheckIcon from '~icons/lucide/check';
import MinusIcon from '~icons/lucide/minus';
import { useCheckbox } from './useCheckbox';
import type { CheckboxProps } from './types';

defineOptions({ name: 'RpCheckbox' });

const props = withDefaults(defineProps<CheckboxProps>(), {
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    indeterminate: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const { inputRef, control, rootClass, rootStyle, onChange, focus } = useCheckbox(props, (value) => {
    emit('update:modelValue', value);
});

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};

    return {
        ...attrs,
        onChange(event) {
            onChange(event);
            attrs.onChange?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./checkbox.scss" lang="scss" scoped></style>
