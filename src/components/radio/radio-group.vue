<template>
    <div v-bind="rootAttrs">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { useRadioGroup } from './useRadio';
import type { RadioGroupPart, RadioGroupProps } from './types';

defineOptions({ name: 'RpRadioGroup', inheritAttrs: false });

const props = withDefaults(defineProps<RadioGroupProps>(), {
    modelValue: undefined,
    defaultValue: null,
    variant: undefined,
    color: undefined,
    autoContrast: undefined,
    size: undefined,
    orientation: 'vertical',
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
const { getRootAttrs } = useStylesApi<RadioGroupPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: control.id,
        class: rootClass.value,
        role: 'radiogroup',
        'data-orientation': props.orientation,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
        'aria-orientation': props.orientation,
    }),
);
</script>

<style src="./radio-group.scss" lang="scss" scoped></style>
