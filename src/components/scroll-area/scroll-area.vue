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
import type { ScrollAreaProps } from './types';
import { useScrollArea } from './useScrollArea';
import { useScrollAreaPresentation } from './useScrollAreaPresentation';

defineOptions({ name: 'RpScrollArea', inheritAttrs: false });

const props = withDefaults(defineProps<ScrollAreaProps>(), {
    embedded: false,
    type: 'hover',
    scrollbars: 'both',
    scrollbarSize: 10,
    scrollHideDelay: 600,
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
