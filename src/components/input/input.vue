<template>
    <div :class="rootClass">
        <span v-if="$slots.prefix" class="rp-input__prefix">
            <slot name="prefix" />
        </span>
        <input
            ref="inputRef"
            class="rp-input__native"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            @input="onInput"
        />
        <span
            v-if="clearable && hasValue"
            class="rp-input__clear"
            @click="clear"
        >
            <CloseIcon />
        </span>
        <span v-if="$slots.suffix" class="rp-input__suffix">
            <slot name="suffix" />
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import { bem } from '@/utils/bem';
import { CloseIcon } from '@/components/_internal/icons';
import type { InputProps } from './types';

defineOptions({ name: 'RpInput' });

const props = withDefaults(defineProps<InputProps>(), {
    modelValue: '',
    type: 'text',
    placeholder: '',
    size: 'md',
    disabled: false,
    readonly: false,
    clearable: false,
    block: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | number];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const rootClass = computed(() =>
    bem('rp-input', props.size, {
        disabled: props.disabled,
        readonly: props.readonly,
        block: props.block,
    }),
);

const hasValue = computed(() => props.modelValue != null && props.modelValue !== '');

function onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    emit('update:modelValue', props.type === 'number' ? Number(target.value) : target.value);
}

function clear() {
    emit('update:modelValue', '');
    inputRef.value?.focus();
}
</script>

<style lang="scss" scoped>
.rp-input {
    @include flex-center;
    gap: var(--rp-spacing-2);
    font-family: var(--rp-font-family);
    font-weight: var(--rp-font-weight-normal);
    background-color: var(--rp-color-background);
    border: 1px solid var(--rp-color-border);
    transition:
        border-color var(--rp-transition-fast),
        box-shadow var(--rp-transition-fast);

    &:hover:not(.rp-input--disabled) {
        border-color: var(--rp-color-gray-400);
    }

    &:focus-within:not(.rp-input--disabled) {
        @include focus-ring;
    }

    // ── Sizes ──
    &--sm {
        height: var(--rp-size-sm);
        padding: 0 var(--rp-spacing-3);
        font-size: var(--rp-font-size-sm);
        border-radius: var(--rp-radius-md);
    }

    &--md {
        height: var(--rp-size-md);
        padding: 0 var(--rp-spacing-4);
        font-size: var(--rp-font-size-base);
        border-radius: var(--rp-radius-lg);
    }

    &--lg {
        height: var(--rp-size-lg);
        padding: 0 var(--rp-spacing-6);
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
        line-height: 1;

        &::placeholder {
            color: var(--rp-color-text-secondary);
        }

        &:disabled {
            cursor: not-allowed;
        }
    }

    &__prefix,
    &__suffix {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        color: var(--rp-color-text-secondary);
    }

    &__clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        color: var(--rp-color-gray-400);
        cursor: pointer;
        transition: color var(--rp-transition-fast);

        &:hover {
            color: var(--rp-color-gray-700);
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }
}
</style>
