<template>
    <nav :class="rootClass" aria-label="Pagination">
        <button
            class="rp-pagination__btn"
            :disabled="disabled || modelValue <= 1"
            @click="goTo(modelValue - 1)"
        >
            <ChevronLeftIcon />
        </button>

        <template v-for="item in pages" :key="item.key">
            <span v-if="item.type === 'ellipsis'" class="rp-pagination__ellipsis">
                <EllipsisIcon />
            </span>
            <button
                v-else
                :class="['rp-pagination__btn', { 'rp-pagination__btn--active': item.value === modelValue }]"
                :disabled="disabled"
                @click="goTo(item.value!)"
            >
                {{ item.value }}
            </button>
        </template>

        <button
            class="rp-pagination__btn"
            :disabled="disabled || modelValue >= totalPages"
            @click="goTo(modelValue + 1)"
        >
            <ChevronRightIcon />
        </button>
    </nav>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from '@/components/_internal/icons';
import type { PaginationProps } from './types';

defineOptions({ name: 'RpPagination' });

const props = withDefaults(defineProps<PaginationProps>(), {
    modelValue: 1,
    pageSize: 10,
    siblingCount: 1,
    size: 'md',
    disabled: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

interface PageItem {
    key: string;
    type: 'page' | 'ellipsis';
    value?: number;
}

const pages = computed<PageItem[]>(() => {
    const total = totalPages.value;
    const current = props.modelValue;
    const siblings = props.siblingCount;

    const rangeStart = Math.max(2, current - siblings);
    const rangeEnd = Math.min(total - 1, current + siblings);

    const items: PageItem[] = [];

    items.push({ key: 'first', type: 'page', value: 1 });

    if (rangeStart > 2) {
        items.push({ key: 'ellipsis-start', type: 'ellipsis' });
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
        items.push({ key: `page-${i}`, type: 'page', value: i });
    }

    if (rangeEnd < total - 1) {
        items.push({ key: 'ellipsis-end', type: 'ellipsis' });
    }

    if (total > 1) {
        items.push({ key: 'last', type: 'page', value: total });
    }

    return items;
});

const rootClass = computed(() =>
    bem('rp-pagination', props.size, { disabled: props.disabled }),
);

function goTo(page: number) {
    if (props.disabled || page < 1 || page > totalPages.value) return;
    emit('update:modelValue', page);
}
</script>

<style lang="scss" scoped>
.rp-pagination {
    display: inline-flex;
    align-items: center;
    gap: var(--rp-spacing-1);
    font-family: var(--rp-font-family);

    &--disabled {
        opacity: 0.5;
    }

    // ── Sizes ──
    &--sm { --_pg-size: 28px; --_pg-font: var(--rp-font-size-xs); }
    &--md { --_pg-size: 34px; --_pg-font: var(--rp-font-size-sm); }
    &--lg { --_pg-size: 40px; --_pg-font: var(--rp-font-size-base); }

    &__btn {
        @include flex-center;
        width: var(--_pg-size);
        height: var(--_pg-size);
        padding: 0;
        font: inherit;
        font-size: var(--_pg-font);
        color: var(--rp-color-text);
        background: none;
        border: 1px solid var(--rp-color-border);
        border-radius: var(--rp-radius-md);
        cursor: pointer;
        transition: background-color var(--rp-transition-fast),
            color var(--rp-transition-fast),
            border-color var(--rp-transition-fast);

        &:hover:not(:disabled) {
            background-color: var(--rp-color-gray-50);
        }

        &:focus-visible {
            outline: none;
            @include focus-ring;
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        &--active {
            background-color: var(--rp-color-primary);
            border-color: var(--rp-color-primary);
            color: var(--rp-color-white);

            &:hover:not(:disabled) {
                background-color: color-mix(in srgb, var(--rp-color-primary) 85%, black);
            }
        }

        svg {
            width: 1em;
            height: 1em;
        }
    }

    &__ellipsis {
        @include flex-center;
        width: var(--_pg-size);
        height: var(--_pg-size);
        color: var(--rp-color-text-secondary);

        svg {
            width: 1em;
            height: 1em;
        }
    }
}
</style>
