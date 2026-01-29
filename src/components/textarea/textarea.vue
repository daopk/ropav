<template>
    <div :class="rootClass">
        <textarea
            class="rp-textarea__native"
            :value="modelValue"
            :placeholder="placeholder"
            :rows="rows"
            :disabled="disabled"
            :readonly="readonly"
            :style="{ resize }"
            @input="onInput"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { TextareaProps } from './types';

defineOptions({ name: 'RpTextarea' });

const props = withDefaults(defineProps<TextareaProps>(), {
    modelValue: '',
    placeholder: '',
    rows: 3,
    size: 'md',
    disabled: false,
    readonly: false,
    resize: 'vertical',
    block: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const rootClass = computed(() =>
    bem('rp-textarea', props.size, {
        disabled: props.disabled,
        readonly: props.readonly,
        block: props.block,
    }),
);

function onInput(e: Event) {
    emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}
</script>

<style lang="scss" scoped>
.rp-textarea {
    display: inline-flex;
    font-family: var(--rp-font-family);
    font-weight: var(--rp-font-weight-normal);
    background-color: var(--rp-color-background);
    border: 1px solid var(--rp-color-border);
    transition:
        border-color var(--rp-transition-fast),
        box-shadow var(--rp-transition-fast);

    &:hover:not(.rp-textarea--disabled) {
        border-color: var(--rp-color-gray-400);
    }

    &:focus-within:not(.rp-textarea--disabled) {
        border-color: var(--rp-color-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--rp-color-primary) 25%, transparent);
    }

    // ── Sizes ──
    &--sm {
        padding: var(--rp-spacing-2) var(--rp-spacing-3);
        font-size: var(--rp-font-size-sm);
        border-radius: var(--rp-radius-md);
    }

    &--md {
        padding: var(--rp-spacing-3) var(--rp-spacing-4);
        font-size: var(--rp-font-size-base);
        border-radius: var(--rp-radius-lg);
    }

    &--lg {
        padding: var(--rp-spacing-4) var(--rp-spacing-6);
        font-size: var(--rp-font-size-lg);
        border-radius: var(--rp-radius-lg);
    }

    &--disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &--readonly {
        background-color: var(--rp-color-gray-50);
    }

    &--block {
        display: flex;
        width: 100%;
    }

    &__native {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        font: inherit;
        color: var(--rp-color-text);
        line-height: 1.5;

        &::placeholder {
            color: var(--rp-color-text-secondary);
        }

        &:disabled {
            cursor: not-allowed;
        }
    }
}
</style>
