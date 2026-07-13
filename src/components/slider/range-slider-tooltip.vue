<template>
    <span
        ref="tooltipLayerRef"
        :class="[
            'rp-range-slider__tooltips',
            `rp-range-slider__tooltips--placement-${placement}`,
            {
                'rp-range-slider__tooltips--overlapping': tooltipsOverlapping,
                'rp-range-slider__tooltips--vertical': orientation === 'vertical',
            },
        ]"
        aria-hidden="true"
        :style="layerStyle"
    >
        <span
            :class="[
                tooltipRootClass,
                'rp-range-slider__tooltip',
                'rp-range-slider__tooltip--lower',
            ]"
        >
            <span class="rp-range-slider__tooltip-anchor" />
            <span
                v-show="open"
                :id="resolvedIds[0]"
                ref="lowerContentRef"
                class="rp-tooltip__content"
                aria-hidden="true"
                :style="contentStyle"
            >
                {{ content[0] }}
            </span>
        </span>

        <span
            :class="[
                tooltipRootClass,
                'rp-range-slider__tooltip',
                'rp-range-slider__tooltip--upper',
            ]"
        >
            <span class="rp-range-slider__tooltip-anchor" />
            <span
                v-show="open"
                :id="resolvedIds[1]"
                ref="upperContentRef"
                class="rp-tooltip__content"
                aria-hidden="true"
                :style="contentStyle"
            >
                {{ content[1] }}
            </span>
        </span>

        <span
            :class="[
                tooltipRootClass,
                'rp-range-slider__tooltip',
                'rp-range-slider__tooltip--merged',
            ]"
        >
            <span class="rp-range-slider__tooltip-anchor" />
            <span
                v-show="open"
                :id="resolvedMergedId"
                class="rp-tooltip__content"
                aria-hidden="true"
                :style="contentStyle"
            >
                <template v-if="orientation === 'vertical' && content[0] !== content[1]">
                    <span class="rp-range-slider__tooltip-merged-value">{{ content[1] }}</span>
                    <span class="rp-range-slider__tooltip-merged-value">{{ content[0] }}</span>
                </template>
                <template v-else-if="content[0] !== content[1]">
                    <span class="rp-range-slider__tooltip-merged-value">{{ content[0] }}</span>
                    <span class="rp-range-slider__tooltip-merged-separator">–</span>
                    <span class="rp-range-slider__tooltip-merged-value">{{ content[1] }}</span>
                </template>
                <template v-else>{{ mergedContent }}</template>
            </span>
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, onBeforeUnmount, ref, toRef, useId, watch } from 'vue';
import { bem } from '@/utils/bem';
import {
    resolveTooltipColorStyleWithContrast,
    resolveTooltipOffsetStyle,
} from '../tooltip/useTooltip';
import type { TooltipColor, TooltipOffset, TooltipPlacement } from '../tooltip/types';
import type { RangeSliderValue, SliderOrientation } from './types';
import { useRangeSliderTooltipCollision } from './useRangeSliderTooltipCollision';

defineOptions({ name: 'RpRangeSliderTooltip' });

const props = withDefaults(
    defineProps<{
        arrow?: boolean;
        color?: TooltipColor;
        content: [string, string];
        ids: [string | undefined, string | undefined];
        mergedContent: string;
        mergedId?: string;
        offset?: TooltipOffset;
        open: boolean;
        orientation: SliderOrientation;
        placement: TooltipPlacement;
        valuePercent: RangeSliderValue;
    }>(),
    {
        arrow: false,
        color: undefined,
        mergedId: undefined,
        offset: undefined,
    },
);

const emit = defineEmits<{
    'update:overlapping': [value: boolean];
}>();

const generatedId = useId();
const tooltipLayerRef = ref<HTMLElement | null>(null);
const lowerContentRef = ref<HTMLElement | null>(null);
const upperContentRef = ref<HTMLElement | null>(null);

const resolvedIds = computed<[string, string]>(() => [
    props.ids[0] ?? `${generatedId}-lower-tooltip`,
    props.ids[1] ?? `${generatedId}-upper-tooltip`,
]);
const resolvedMergedId = computed(() => props.mergedId ?? `${generatedId}-merged-tooltip`);
const tooltipRootClass = computed(() =>
    bem('rp-tooltip', {
        [`placement-${props.placement}`]: true,
        arrow: props.arrow,
        open: props.open,
    }),
);
const contentStyle = computed(() => ({
    ...resolveTooltipOffsetStyle(props.offset),
    ...resolveTooltipColorStyleWithContrast(props.color, undefined),
}));

const { tooltipsOverlapping, mergedArrowOffset, mergedMinSize } = useRangeSliderTooltipCollision({
    enabled: toRef(props, 'open'),
    lower: lowerContentRef,
    orientation: toRef(props, 'orientation'),
    placement: toRef(props, 'placement'),
    root: tooltipLayerRef,
    sizeDependencies: [() => props.content],
    upper: upperContentRef,
    valuePercent: toRef(props, 'valuePercent'),
});

const layerStyle = computed(() => ({
    '--_rp-range-slider-tooltip-merged-arrow-offset': `${mergedArrowOffset.value}px`,
    '--_rp-range-slider-tooltip-merged-min-size': `${mergedMinSize.value}px`,
}));

watch(
    tooltipsOverlapping,
    (overlapping) => {
        emit('update:overlapping', overlapping);
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    emit('update:overlapping', false);
});
</script>

<style src="../tooltip/tooltip.scss" lang="scss" scoped></style>
<style src="./range-slider-tooltip.scss" lang="scss" scoped></style>
