<template>
    <div :class="rootClass">
        <input
            :id="control.id"
            :name="name"
            class="rp-input__native"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="control.disabled || undefined"
            :readonly="readonly || undefined"
            :required="control.required || undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
            @input="onInput"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { InputProps } from './types';

defineOptions({ name: 'RpInput' });

const props = withDefaults(defineProps<InputProps>(), {
    type: 'text',
    placeholder: '',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const control = useControlState(props);

const rootClass = computed(() =>
    bem('rp-input', {
        disabled: control.disabled,
        invalid: control.invalid,
        readonly: props.readonly,
    }),
);

function onInput(e: Event) {
    emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<style src="./input.scss" lang="scss" scoped></style>
