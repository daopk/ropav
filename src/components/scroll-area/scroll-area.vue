<template>
    <div :ref="templateRefs.root" v-bind="rootAttrs">
        <div :ref="templateRefs.viewport" v-bind="viewportAttrs">
            <div :ref="templateRefs.content" v-bind="contentAttrs">
                <slot v-bind="slotProps" />
            </div>
        </div>

        <div
            v-if="renderHorizontalScrollbar"
            :ref="templateRefs.horizontalScrollbar"
            v-bind="horizontalScrollbarAttrs"
            @keydown="onScrollbarKeydown('x', $event)"
            @pointerdown="onScrollbarPointerdown('x', $event)"
            @wheel="onScrollbarWheel('x', $event)"
        >
            <div v-bind="horizontalThumbAttrs" @pointerdown="onThumbPointerdown('x', $event)" />
        </div>

        <div
            v-if="renderVerticalScrollbar"
            :ref="templateRefs.verticalScrollbar"
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
    contentAttrs: Object as PropType<ScrollAreaProps['contentAttrs']>,
    classNames: Object as PropType<ScrollAreaProps['classNames']>,
    styles: Object as PropType<ScrollAreaProps['styles']>,
});

const emit = defineEmits<{
    scroll: [event: Event];
    scrollPositionChange: [position: { x: number; y: number }];
    reachTop: [event: Event];
    reachBottom: [event: Event];
    reachLeft: [event: Event];
    reachRight: [event: Event];
}>();

const {
    templateRefs,
    renderHorizontalScrollbar,
    renderVerticalScrollbar,
    rootAttrs,
    viewportAttrs,
    contentAttrs,
    horizontalScrollbarAttrs,
    verticalScrollbarAttrs,
    horizontalThumbAttrs,
    verticalThumbAttrs,
    cornerAttrs,
    slotProps,
    onScrollbarKeydown,
    onScrollbarWheel,
    onScrollbarPointerdown,
    onThumbPointerdown,
    scrollTo,
    scrollBy,
    update,
} = useScrollArea(props, emit);

defineExpose({
    viewport: templateRefs.viewport,
    scrollTo,
    scrollBy,
    update,
});
</script>

<style src="./scroll-area.scss" lang="scss" scoped></style>
