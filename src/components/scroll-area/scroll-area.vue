<template>
    <div ref="rootRef" v-bind="rootAttrs">
        <div ref="viewportRef" v-bind="viewportAttrs">
            <div ref="contentRef" v-bind="contentAttrs">
                <slot v-bind="slotProps" />
            </div>
        </div>

        <div
            v-if="renderHorizontalScrollbar"
            ref="horizontalScrollbarRef"
            v-bind="horizontalScrollbarAttrs"
            @keydown="onScrollbarKeydown('x', $event)"
            @pointerdown="onScrollbarPointerdown('x', $event)"
            @wheel="onScrollbarWheel('x', $event)"
        >
            <div v-bind="horizontalThumbAttrs" @pointerdown="onThumbPointerdown('x', $event)" />
        </div>

        <div
            v-if="renderVerticalScrollbar"
            ref="verticalScrollbarRef"
            v-bind="verticalScrollbarAttrs"
            @keydown="onScrollbarKeydown('y', $event)"
            @pointerdown="onScrollbarPointerdown('y', $event)"
            @wheel="onScrollbarWheel('y', $event)"
        >
            <div v-bind="verticalThumbAttrs" @pointerdown="onThumbPointerdown('y', $event)" />
        </div>

        <div v-if="renderHorizontalScrollbar && renderVerticalScrollbar" v-bind="cornerAttrs" />
    </div>
</template>

<script lang="ts" setup vapor>
import type { PropType } from 'vue';
import type { ScrollAreaProps, ScrollAreaScrollbars } from './types';
import { useScrollArea } from './useScrollArea';
import { useScrollAreaPresentation } from './useScrollAreaPresentation';

defineOptions({ name: 'RpScrollArea', inheritAttrs: false });

const props = defineProps({
    id: String,
    embedded: { type: Boolean, default: false },
    type: { type: String as PropType<ScrollAreaProps['type']>, default: 'hover' },
    scrollbars: {
        type: [String, Boolean] as PropType<ScrollAreaScrollbars | false>,
        default: 'both',
    },
    scrollbarSize: { type: [Number, String], default: 10 },
    scrollHideDelay: { type: Number, default: 600 },
    ariaLabel: String,
    ariaLabelledby: String,
    ariaDescribedby: String,
    viewportAttrs: Object as PropType<ScrollAreaProps['viewportAttrs']>,
    classNames: Object as PropType<ScrollAreaProps['classNames']>,
    styles: Object as PropType<ScrollAreaProps['styles']>,
});

const emit = defineEmits<{
    scroll: [event: Event];
    scrollPositionChange: [position: { x: number; y: number }];
}>();

const scrollArea = useScrollArea({
    props,
    emitScroll: (event) => emit('scroll', event),
    emitPositionChange: (position) => emit('scrollPositionChange', position),
});
const {
    rootRef,
    viewportRef,
    contentRef,
    horizontalScrollbarRef,
    verticalScrollbarRef,
    renderHorizontalScrollbar,
    renderVerticalScrollbar,
    onScrollbarKeydown,
    onScrollbarWheel,
    onScrollbarPointerdown,
    onThumbPointerdown,
    scrollTo,
    scrollBy,
    update,
} = scrollArea;
const {
    rootAttrs,
    viewportAttrs,
    contentAttrs,
    horizontalScrollbarAttrs,
    verticalScrollbarAttrs,
    horizontalThumbAttrs,
    verticalThumbAttrs,
    cornerAttrs,
    slotProps,
} = useScrollAreaPresentation(props, scrollArea);

void rootRef;
void contentRef;
void horizontalScrollbarRef;
void verticalScrollbarRef;

defineExpose({
    viewport: viewportRef,
    scrollTo,
    scrollBy,
    update,
});
</script>

<style src="./scroll-area.scss" lang="scss" scoped></style>
