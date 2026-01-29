<template>
    <span
        class="rp-tooltip"
        @mouseenter="onShow"
        @mouseleave="onHide"
        @focusin="onShow"
        @focusout="onHide"
    >
        <slot />
        <span v-if="isVisible && !disabled" :class="tipClass" role="tooltip">
            {{ content }}
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, ref, onBeforeUnmount } from 'vue';
import { bem } from '@/utils/bem';
import type { TooltipProps } from './types';

defineOptions({ name: 'RpTooltip' });

const props = withDefaults(defineProps<TooltipProps>(), {
    placement: 'top',
    delay: 200,
    disabled: false,
});

const isVisible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function onShow() {
    if (props.disabled) return;
    timer = setTimeout(() => { isVisible.value = true; }, props.delay);
}

function onHide() {
    if (timer) { clearTimeout(timer); timer = null; }
    isVisible.value = false;
}

onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
});

const tipClass = computed(() =>
    bem('rp-tooltip__tip', props.placement),
);
</script>

<style lang="scss" scoped>
.rp-tooltip {
    position: relative;
    display: inline-flex;

    &__tip {
        --_arrow: 5px;

        position: absolute;
        z-index: 1000;
        padding: var(--rp-spacing-1) var(--rp-spacing-2);
        font-family: var(--rp-font-family);
        font-size: var(--rp-font-size-xs);
        font-weight: var(--rp-font-weight-medium);
        line-height: 1.4;
        color: var(--rp-color-white);
        background-color: var(--rp-color-gray-800);
        border-radius: var(--rp-radius-md);
        white-space: nowrap;
        pointer-events: none;
        animation: rp-tooltip-fade 150ms ease;

        &::after {
            content: '';
            position: absolute;
            border: var(--_arrow) solid transparent;
        }

        // ── Placements ──
        &--top {
            bottom: calc(100% + var(--_arrow) + 2px);
            left: 50%;
            transform: translateX(-50%);

            &::after {
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: var(--rp-color-gray-800);
            }
        }

        &--bottom {
            top: calc(100% + var(--_arrow) + 2px);
            left: 50%;
            transform: translateX(-50%);

            &::after {
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-bottom-color: var(--rp-color-gray-800);
            }
        }

        &--left {
            right: calc(100% + var(--_arrow) + 2px);
            top: 50%;
            transform: translateY(-50%);

            &::after {
                left: 100%;
                top: 50%;
                transform: translateY(-50%);
                border-left-color: var(--rp-color-gray-800);
            }
        }

        &--right {
            left: calc(100% + var(--_arrow) + 2px);
            top: 50%;
            transform: translateY(-50%);

            &::after {
                right: 100%;
                top: 50%;
                transform: translateY(-50%);
                border-right-color: var(--rp-color-gray-800);
            }
        }
    }
}

@keyframes rp-tooltip-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
}
</style>
