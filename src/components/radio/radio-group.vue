<template>
    <div
        :id="control.id"
        :class="rootClass"
        role="radiogroup"
        :data-disabled="control.disabled || undefined"
        :data-invalid="control.invalid || undefined"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="control.ariaLabelledby"
        :aria-describedby="control.ariaDescribedby"
        :aria-invalid="control.invalid || undefined"
        :aria-required="control.required || undefined"
    >
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { useRadioGroup } from './useRadio';
import type { RadioGroupProps } from './types';

defineOptions({ name: 'RpRadioGroup' });

const props = withDefaults(defineProps<RadioGroupProps>(), {
    variant: undefined,
    color: undefined,
    autoContrast: undefined,
    size: undefined,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | number | null];
}>();

const { control, rootClass } = useRadioGroup(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./radio-group.scss" lang="scss" scoped></style>
