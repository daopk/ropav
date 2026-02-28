<template>
    <div :class="rootClass">
        <label v-if="label" class="rp-field__label">
            {{ label }}
            <span v-if="required" class="rp-field__required" aria-hidden="true">*</span>
        </label>
        <p v-if="description" class="rp-field__description">{{ description }}</p>
        <div class="rp-field__control">
            <slot />
        </div>
        <p v-if="error" class="rp-field__message rp-field__message--error" role="alert">
            {{ error }}
        </p>
        <p v-if="!error && success" class="rp-field__message rp-field__message--success">
            {{ success }}
        </p>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { FieldProps } from './types';

defineOptions({ name: 'RpField' });

const props = withDefaults(defineProps<FieldProps>(), {
    label: '',
    description: '',
    error: '',
    success: '',
    required: false,
    disabled: false,
    size: 'md',
});

const rootClass = computed(() =>
    bem('rp-field', props.size, {
        error: !!props.error,
        success: !props.error && !!props.success,
        disabled: props.disabled,
    }),
);
</script>

<style lang="scss" scoped>
.rp-field {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-family: var(--rp-font-family);

    &--disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    // ── Sizes ──
    &--sm {
        gap: var(--rp-spacing-1);
    }

    &--md {
        gap: var(--rp-spacing-1);
    }

    &--lg {
        gap: var(--rp-spacing-2);
    }

    // ── Label ──
    &__label {
        font-weight: var(--rp-font-weight-medium);
        color: var(--rp-color-text);
        line-height: 1.4;
    }

    &--sm &__label {
        font-size: var(--rp-font-size-sm);
    }

    &--md &__label {
        font-size: var(--rp-font-size-sm);
    }

    &--lg &__label {
        font-size: var(--rp-font-size-base);
    }

    // ── Required indicator ──
    &__required {
        color: var(--rp-color-danger);
        margin-left: 2px;
    }

    // ── Description ──
    &__description {
        margin: 0;
        color: var(--rp-color-text-secondary);
        line-height: 1.4;
    }

    &--sm &__description {
        font-size: var(--rp-font-size-xs);
    }

    &--md &__description {
        font-size: var(--rp-font-size-xs);
    }

    &--lg &__description {
        font-size: var(--rp-font-size-sm);
    }

    // ── Control wrapper ──
    &__control {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    // ── Validation message ──
    &__message {
        margin: 0;
        line-height: 1.4;

        &--error {
            color: var(--rp-color-danger);
        }

        &--success {
            color: var(--rp-color-success);
        }
    }

    &--sm &__message {
        font-size: var(--rp-font-size-xs);
    }

    &--md &__message {
        font-size: var(--rp-font-size-xs);
    }

    &--lg &__message {
        font-size: var(--rp-font-size-sm);
    }
}
</style>
