<template>
    <label :class="rootClass" @mousedown="focusInput">
        <span v-if="$slots.left" class="rp-input__left">
            <slot name="left" />
        </span>
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
        <span v-if="$slots.right" class="rp-input__right">
            <slot name="right" />
        </span>
    </label>
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
    valid: undefined,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const control = useControlState(props);

const rootClass = computed(() =>
    bem('rp-input', {
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
        disabled: control.disabled,
        invalid: control.invalid,
        valid: control.valid && !control.invalid,
        readonly: props.readonly,
    }),
);

function onInput(e: Event) {
    emit('update:modelValue', (e.target as HTMLInputElement).value);
}

function focusInput(e: MouseEvent) {
    if (control.disabled) return;

    const target = e.target;
    if (target instanceof Element && isInteractiveElement(target)) return;

    (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('.rp-input__native')?.focus();
}

function isInteractiveElement(target: Element) {
    return Boolean(
        target.closest(
            [
                'button',
                'a[href]',
                'input:not(.rp-input__native)',
                'select',
                'textarea',
                '[contenteditable="true"]',
                '[tabindex]:not([tabindex="-1"])',
            ].join(','),
        ),
    );
}
</script>

<style src="./input.scss" lang="scss" scoped></style>
