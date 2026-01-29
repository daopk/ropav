<template>
    <div :class="rootClass" role="separator" :aria-orientation="orientation">
        <span v-if="hasLabel" :class="labelClass">
            <slot>{{ label }}</slot>
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { DividerProps } from './types';

defineOptions({ name: 'RpDivider' });

const props = withDefaults(defineProps<DividerProps>(), {
    orientation: 'horizontal',
    labelPosition: 'center',
});

const hasLabel = computed(() => !!props.label);

const rootClass = computed(() =>
    bem('rp-divider', props.orientation, {
        'has-label': hasLabel.value,
        [`label-${props.labelPosition}`]: hasLabel.value,
    }),
);

const labelClass = computed(() => ['rp-divider__label']);
</script>

<style lang="scss" scoped>
.rp-divider {
    display: flex;
    align-items: center;
    font-family: var(--rp-font-family);
    color: var(--rp-color-text-secondary);
    font-size: var(--rp-font-size-sm);

    // ── Horizontal ──
    &--horizontal {
        width: 100%;
        flex-direction: row;

        &::before,
        &::after {
            content: '';
            flex: 1;
            border-top: 1px solid var(--rp-color-border);
        }
    }

    &--horizontal:not(.rp-divider--has-label) {
        &::after {
            display: none;
        }
    }

    // ── Vertical ──
    &--vertical {
        flex-direction: column;
        align-self: stretch;
        min-height: 1em;

        &::before,
        &::after {
            content: '';
            flex: 1;
            border-left: 1px solid var(--rp-color-border);
        }
    }

    &--vertical:not(.rp-divider--has-label) {
        &::after {
            display: none;
        }
    }

    // ── Label positions ──
    &--label-start::before {
        flex: 0 0 8%;
    }

    &--label-end::after {
        flex: 0 0 8%;
    }

    &__label {
        padding: 0 var(--rp-spacing-3);
        white-space: nowrap;
        line-height: 1;
    }

    &--vertical &__label {
        padding: var(--rp-spacing-3) 0;
    }
}
</style>
