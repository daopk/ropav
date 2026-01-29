<template>
    <div v-if="visible" :class="rootClass" role="alert">
        <span class="rp-alert__icon">
            <slot name="icon">
                <SuccessIcon v-if="color === 'success'" />
                <AlertIcon v-else-if="color === 'warning' || color === 'danger'" />
                <InfoIcon v-else />
            </slot>
        </span>
        <div class="rp-alert__content">
            <div v-if="title" class="rp-alert__title">
                <slot name="title">{{ title }}</slot>
            </div>
            <div class="rp-alert__description">
                <slot />
            </div>
        </div>
        <button v-if="closable" class="rp-alert__close" @click="onClose">
            <CloseIcon />
        </button>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import { bem } from '@/utils/bem';
import { CloseIcon, InfoIcon, AlertIcon, SuccessIcon } from '@/components/_internal/icons';
import type { AlertProps } from './types';

defineOptions({ name: 'RpAlert' });

const props = withDefaults(defineProps<AlertProps>(), {
    color: 'info',
    variant: 'subtle',
    closable: false,
});

const emit = defineEmits<{
    close: [];
}>();

const visible = ref(true);

const rootClass = computed(() =>
    bem('rp-alert', props.variant, props.color),
);

function onClose() {
    visible.value = false;
    emit('close');
}
</script>

<style lang="scss" scoped>
.rp-alert {
    display: flex;
    align-items: flex-start;
    gap: var(--rp-spacing-3);
    padding: var(--rp-spacing-3) var(--rp-spacing-4);
    border-radius: var(--rp-radius-lg);
    font-family: var(--rp-font-family);
    font-size: var(--rp-font-size-sm);
    line-height: 1.5;
    border: 1px solid transparent;

    &--info    { --_alert-color: var(--rp-color-info); }
    &--success { --_alert-color: var(--rp-color-success); }
    &--warning { --_alert-color: var(--rp-color-warning); }
    &--danger  { --_alert-color: var(--rp-color-danger); }

    // ── Subtle ──
    &--subtle {
        background-color: color-mix(in srgb, var(--_alert-color) 10%, transparent);
        color: var(--rp-color-text);
    }

    &--subtle &__icon {
        color: var(--_alert-color);
    }

    // ── Solid ──
    &--solid {
        background-color: var(--_alert-color);
        color: var(--rp-color-white);
    }

    // ── Outline ──
    &--outline {
        background-color: transparent;
        border-color: var(--_alert-color);
        color: var(--rp-color-text);
    }

    &--outline &__icon {
        color: var(--_alert-color);
    }

    &__icon {
        flex-shrink: 0;
        width: 1.25em;
        height: 1.25em;
        margin-top: 1px;

        svg {
            width: 100%;
            height: 100%;
        }
    }

    &__content {
        flex: 1;
        min-width: 0;
    }

    &__title {
        font-weight: var(--rp-font-weight-semibold);
        margin-bottom: var(--rp-spacing-1);
    }

    &__description {
        color: inherit;
        opacity: 0.9;
    }

    &__close {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25em;
        height: 1.25em;
        padding: 0;
        margin-top: 1px;
        background: none;
        border: none;
        color: inherit;
        opacity: 0.6;
        cursor: pointer;
        transition: opacity var(--rp-transition-fast);

        &:hover {
            opacity: 1;
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }
}
</style>
