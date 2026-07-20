<template>
    <nav v-bind="rootAttrs">
        <ul v-bind="getPartAttrs('items', { class: 'rp-pagination__items' })">
            <li v-if="withEdges" class="rp-pagination__item">
                <button
                    v-bind="getControlAttrs('first', isFirstDisabled)"
                    type="button"
                    :aria-label="firstLabel"
                    :disabled="isFirstDisabled"
                    @click="selectPage(firstPage)"
                >
                    <slot name="first" :page="firstPage" :disabled="isFirstDisabled">
                        <IconChevronsLeft class="rp-pagination__control-icon" aria-hidden="true" />
                    </slot>
                </button>
            </li>

            <li v-if="withControls" class="rp-pagination__item">
                <button
                    v-bind="getControlAttrs('previous', isFirstDisabled)"
                    type="button"
                    :aria-label="previousLabel"
                    :disabled="isFirstDisabled"
                    @click="selectPage(previousPage)"
                >
                    <slot name="previous" :page="previousPage" :disabled="isFirstDisabled">
                        <IconChevronLeft class="rp-pagination__control-icon" aria-hidden="true" />
                    </slot>
                </button>
            </li>

            <li v-for="item in items" :key="item.key" class="rp-pagination__item">
                <button
                    v-if="item.type === 'page'"
                    v-bind="getPageAttrs(item.page)"
                    type="button"
                    :aria-label="getPageLabel(item.page)"
                    :aria-current="item.page === currentPage ? 'page' : undefined"
                    :disabled="disabled"
                    @click="selectPage(item.page)"
                >
                    <slot name="page" :page="item.page" :active="item.page === currentPage">
                        {{ item.page }}
                    </slot>
                </button>
                <span
                    v-else
                    v-bind="getPartAttrs('ellipsis', { class: 'rp-pagination__ellipsis' })"
                    aria-hidden="true"
                >
                    <slot name="ellipsis"><IconEllipsis /></slot>
                </span>
            </li>

            <li v-if="withControls" class="rp-pagination__item">
                <button
                    v-bind="getControlAttrs('next', isLastDisabled)"
                    type="button"
                    :aria-label="nextLabel"
                    :disabled="isLastDisabled"
                    @click="selectPage(nextPage)"
                >
                    <slot name="next" :page="nextPage" :disabled="isLastDisabled">
                        <IconChevronRight class="rp-pagination__control-icon" aria-hidden="true" />
                    </slot>
                </button>
            </li>

            <li v-if="withEdges" class="rp-pagination__item">
                <button
                    v-bind="getControlAttrs('last', isLastDisabled)"
                    type="button"
                    :aria-label="lastLabel"
                    :disabled="isLastDisabled"
                    @click="selectPage(lastPage)"
                >
                    <slot name="last" :page="lastPage" :disabled="isLastDisabled">
                        <IconChevronsRight class="rp-pagination__control-icon" aria-hidden="true" />
                    </slot>
                </button>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconChevronLeft from '~icons/lucide/chevron-left';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconChevronsLeft from '~icons/lucide/chevrons-left';
import IconChevronsRight from '~icons/lucide/chevrons-right';
import IconEllipsis from '~icons/lucide/ellipsis';
import { useControllableValue } from '@/composables/useControllableValue';
import { presence, useStylesApi } from '@/styles-api';
import type { PaginationControl, PaginationPart, PaginationProps } from './types';
import { usePagination } from './usePagination';

defineOptions({ name: 'RpPagination', inheritAttrs: false });

const props = withDefaults(defineProps<PaginationProps>(), {
    modelValue: undefined,
    defaultValue: 1,
    siblings: 1,
    boundaries: 1,
    withControls: true,
    withEdges: false,
    disabled: false,
    autoContrast: false,
    size: 'md',
    radius: 'sm',
    ariaLabel: 'Pagination',
    firstLabel: 'Go to first page',
    previousLabel: 'Go to previous page',
    nextLabel: 'Go to next page',
    lastLabel: 'Go to last page',
});

const emit = defineEmits<{
    'update:modelValue': [page: number];
    change: [page: number];
}>();

const controllable = useControllableValue<number>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange(page) {
        emit('update:modelValue', page);
        emit('change', page);
    },
});

const {
    totalPages,
    currentPage,
    items,
    rootClass,
    rootStyle,
    firstPage,
    previousPage,
    nextPage,
    lastPage,
    isFirstDisabled,
    isLastDisabled,
    selectPage,
} = usePagination(
    props,
    () => controllable.value.value,
    (page) => controllable.setValue(page),
);

const { getPartAttrs, getRootAttrs } = useStylesApi<PaginationPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: props.id,
        class: rootClass.value,
        style: rootStyle.value,
        'data-page': currentPage.value,
        'data-total': totalPages.value,
        'data-disabled': presence(props.disabled),
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': props.labelledby,
        'aria-describedby': props.describedby,
    }),
);

function getControlAttrs(control: PaginationControl, isDisabled: boolean) {
    return {
        ...getPartAttrs('control', {
            class: ['rp-pagination__control', `rp-pagination__control--${control}`],
        }),
        'data-control': control,
        'data-disabled': presence(isDisabled),
    };
}

function getPageAttrs(page: number) {
    const active = page === currentPage.value;

    return {
        ...getPartAttrs('page', {
            class: ['rp-pagination__page', { 'rp-pagination__page--active': active }],
        }),
        'data-page': page,
        'data-active': presence(active),
        'data-disabled': presence(props.disabled),
    };
}

function getPageLabel(page: number) {
    const active = page === currentPage.value;
    if (props.getPageAriaLabel) return props.getPageAriaLabel(page, active);

    return active ? `Page ${page}, current page` : `Go to page ${page}`;
}
</script>

<style src="./pagination.scss" lang="scss" scoped></style>
