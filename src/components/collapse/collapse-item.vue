<template>
    <div :class="rootClass">
        <button
            class="rp-collapse-item__header"
            :disabled="disabled || undefined"
            @click="onToggle"
        >
            <span class="rp-collapse-item__title">
                <slot name="title">{{ title }}</slot>
            </span>
            <span class="rp-collapse-item__arrow" :class="{ 'rp-collapse-item__arrow--open': isActive }">
                <ChevronDownIcon />
            </span>
        </button>

        <div class="rp-collapse-item__wrapper" ref="wrapperRef">
            <div class="rp-collapse-item__content">
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, inject, ref, watch } from 'vue';
import { bem } from '@/utils/bem';
import { ChevronDownIcon } from '@/components/_internal/icons';
import { collapseKey } from './types';
import type { CollapseItemProps } from './types';

defineOptions({ name: 'RpCollapseItem' });

const props = withDefaults(defineProps<CollapseItemProps>(), {
    title: '',
    disabled: false,
});

const collapse = inject(collapseKey)!;
const wrapperRef = ref<HTMLElement | null>(null);

const isActive = computed(() => collapse.activeNames.includes(props.name));

const rootClass = computed(() =>
    bem('rp-collapse-item', {
        active: isActive.value,
        disabled: props.disabled,
    }),
);

watch(isActive, (active) => {
    const el = wrapperRef.value;
    if (!el) return;

    if (active) {
        el.style.height = '0px';
        el.offsetHeight; // force reflow
        el.style.height = `${el.scrollHeight}px`;
        const onEnd = () => {
            el.style.height = 'auto';
            el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
    } else {
        el.style.height = `${el.scrollHeight}px`;
        el.offsetHeight; // force reflow
        el.style.height = '0px';
    }
}, { flush: 'post' });

function onToggle() {
    if (props.disabled) return;
    collapse.toggle(props.name);
}
</script>

<style lang="scss" scoped>
.rp-collapse-item {
    &:not(:last-child) {
        border-bottom: 1px solid var(--rp-color-border);
    }

    &--disabled {
        opacity: 0.5;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: var(--rp-spacing-4);
        font: inherit;
        font-size: var(--rp-font-size-base);
        font-weight: var(--rp-font-weight-medium);
        color: var(--rp-color-text);
        background: none;
        border: none;
        cursor: pointer;
        transition: background-color var(--rp-transition-fast);
        text-align: left;

        &:hover:not(:disabled) {
            background-color: var(--rp-color-gray-50);
        }

        &:focus-visible {
            outline: none;
            @include focus-ring;
        }

        &:disabled {
            cursor: not-allowed;
        }
    }

    &__title {
        flex: 1;
        line-height: 1.4;
    }

    &__arrow {
        display: inline-flex;
        align-items: center;
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        color: var(--rp-color-gray-400);
        transition: transform var(--rp-transition-base);

        &--open {
            transform: rotate(180deg);
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }

    &__wrapper {
        overflow: hidden;
        transition: height var(--rp-transition-base);
    }

    &:not(.rp-collapse-item--active) &__wrapper {
        height: 0;
    }

    &__content {
        padding: 0 var(--rp-spacing-4) var(--rp-spacing-4);
        font-size: var(--rp-font-size-base);
        line-height: 1.6;
        color: var(--rp-color-text-secondary);
    }
}
</style>
