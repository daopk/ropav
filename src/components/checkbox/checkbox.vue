<template>
    <label
        :class="rootClass"
        :data-disabled="control.disabled || undefined"
        :data-state="indeterminate ? 'indeterminate' : modelValue ? 'checked' : 'unchecked'"
    >
        <input
            :id="control.id"
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
            @change="onChange"
        />
        <span class="rp-checkbox__box">
            <MinusIcon v-if="indeterminate" class="rp-checkbox__icon" />
            <CheckIcon v-else-if="modelValue" class="rp-checkbox__icon" />
        </span>
        <span v-if="$slots.default" class="rp-checkbox__label">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { CheckIcon, MinusIcon } from '@/components/_internal/icons';
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

const { control, rootClass, onChange } = useCheckbox(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./checkbox.scss" lang="scss" scoped></style>
