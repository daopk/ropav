<template>
    <Teleport to="body">
        <div v-if="modelValue" class="rp-modal">
            <div class="rp-modal__overlay" @click="onOverlayClick" />
            <div :class="panelClass" role="dialog" aria-modal="true" :aria-labelledby="titleId" ref="panelRef" tabindex="-1">
                <div v-if="title || closable" class="rp-modal__header">
                    <h2 class="rp-modal__title" :id="titleId">
                        <slot name="title">{{ title }}</slot>
                    </h2>
                    <button v-if="closable" class="rp-modal__close" @click="close">
                        <CloseIcon />
                    </button>
                </div>
                <div class="rp-modal__body">
                    <slot />
                </div>
                <div v-if="footer || showFooter" class="rp-modal__footer">
                    <slot name="footer">{{ footer }}</slot>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script lang="ts" setup vapor>
import { computed, ref, watch, nextTick, onBeforeUnmount, useId } from 'vue';
import { bem } from '@/utils/bem';
import { CloseIcon } from '@/components/_internal/icons';
import type { ModalProps } from './types';

defineOptions({ name: 'RpModal' });

const titleId = useId();
const panelRef = ref<HTMLElement | null>(null);
let previousActiveElement: HTMLElement | null = null;

const props = withDefaults(defineProps<ModalProps>(), {
    modelValue: false,
    size: 'md',
    closable: true,
    closeOnOverlay: true,
    closeOnEscape: true,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const panelClass = computed(() =>
    bem('rp-modal__panel', props.size),
);

function close() {
    emit('update:modelValue', false);
}

function onOverlayClick() {
    if (props.closeOnOverlay) close();
}

function onEscapeKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.closeOnEscape && props.modelValue) {
        close();
    }
}

function onFocusTrap(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const panel = panelRef.value;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

watch(() => props.modelValue, (open) => {
    if (open) {
        previousActiveElement = document.activeElement as HTMLElement;
        document.addEventListener('keydown', onEscapeKey);
        document.addEventListener('keydown', onFocusTrap);
        document.body.style.overflow = 'hidden';
        nextTick(() => { panelRef.value?.focus(); });
    } else {
        document.removeEventListener('keydown', onEscapeKey);
        document.removeEventListener('keydown', onFocusTrap);
        document.body.style.overflow = '';
        previousActiveElement?.focus();
        previousActiveElement = null;
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscapeKey);
    document.removeEventListener('keydown', onFocusTrap);
    document.body.style.overflow = '';
});
</script>

<style lang="scss" scoped>
.rp-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: rp-modal-fade-in 200ms ease;

    &__overlay {
        position: absolute;
        inset: 0;
        background-color: var(--rp-color-overlay);
    }

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 2 * var(--rp-spacing-8));
        background-color: var(--rp-color-surface);
        border-radius: var(--rp-radius-xl);
        box-shadow: var(--rp-shadow-lg);
        font-family: var(--rp-font-family);
        animation: rp-modal-scale-in 200ms ease;

        &--sm { width: 400px; }
        &--md { width: 540px; }
        &--lg { width: 720px; }
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--rp-spacing-4) var(--rp-spacing-5);
        border-bottom: 1px solid var(--rp-color-border);
        flex-shrink: 0;
    }

    &__title {
        margin: 0;
        font-size: var(--rp-font-size-lg);
        font-weight: var(--rp-font-weight-semibold);
        color: var(--rp-color-text);
        line-height: 1.4;
    }

    &__close {
        @include reset-button;
        @include flex-center;
        width: 28px;
        height: 28px;
        margin-left: var(--rp-spacing-3);
        color: var(--rp-color-text-secondary);
        border-radius: var(--rp-radius-md);
        transition: background-color var(--rp-transition-fast),
            color var(--rp-transition-fast);

        &:hover {
            background-color: var(--rp-color-gray-100);
            color: var(--rp-color-text);
        }

        &:focus-visible {
            outline: none;
            @include focus-ring;
        }

        svg {
            width: 16px;
            height: 16px;
        }
    }

    &__body {
        flex: 1;
        padding: var(--rp-spacing-5);
        overflow-y: auto;
        font-size: var(--rp-font-size-base);
        line-height: 1.6;
        color: var(--rp-color-text);
    }

    &__footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--rp-spacing-3);
        padding: var(--rp-spacing-4) var(--rp-spacing-5);
        border-top: 1px solid var(--rp-color-border);
        flex-shrink: 0;
    }
}

@keyframes rp-modal-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes rp-modal-scale-in {
    from { transform: scale(0.95); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
}
</style>
