import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref, type WatchSource } from 'vue';
import type { TooltipPlacement } from '../tooltip/types';
import type { RangeSliderValue, SliderOrientation } from './types';

const TOOLTIP_COLLISION_GAP = 4;

type TooltipRect = Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>;

export interface RangeSliderTooltipSize {
    width: number;
    height: number;
}

interface TooltipInterval {
    end: number;
    start: number;
}

export interface RangeSliderTooltipCollisionLayout {
    gap?: number;
    lowerPercent: number;
    lowerSize: RangeSliderTooltipSize;
    orientation: SliderOrientation;
    placement: TooltipPlacement;
    trackLength: number;
    upperPercent: number;
    upperSize: RangeSliderTooltipSize;
}

interface UseRangeSliderTooltipCollisionOptions {
    enabled: Ref<boolean>;
    lower: Ref<HTMLElement | null>;
    orientation: Ref<SliderOrientation>;
    placement: Ref<TooltipPlacement>;
    root: Ref<HTMLElement | null>;
    sizeDependencies?: readonly WatchSource[];
    upper: Ref<HTMLElement | null>;
    valuePercent: Ref<RangeSliderValue>;
}

function getAxisSize(size: RangeSliderTooltipSize, orientation: SliderOrientation) {
    return orientation === 'horizontal' ? size.width : size.height;
}

function getTooltipInterval(
    anchor: number,
    size: RangeSliderTooltipSize,
    orientation: SliderOrientation,
    placement: TooltipPlacement,
): TooltipInterval {
    const axisSize = getAxisSize(size, orientation);
    const centeredOnAnchor =
        orientation === 'horizontal'
            ? placement === 'top' || placement === 'bottom'
            : placement === 'left' || placement === 'right';

    if (centeredOnAnchor) {
        return {
            start: anchor - axisSize / 2,
            end: anchor + axisSize / 2,
        };
    }

    const growsBeforeAnchor =
        orientation === 'horizontal' ? placement === 'left' : placement === 'top';

    return growsBeforeAnchor
        ? { start: anchor - axisSize, end: anchor }
        : { start: anchor, end: anchor + axisSize };
}

function areTooltipIntervalsOverlapping(
    lower: TooltipInterval,
    upper: TooltipInterval,
    gap: number,
) {
    return lower.start < upper.end + gap && lower.end + gap > upper.start;
}

export function areRangeSliderTooltipRectsOverlapping(
    lower: TooltipRect,
    upper: TooltipRect,
    gap = TOOLTIP_COLLISION_GAP,
) {
    if (lower.width <= 0 || lower.height <= 0 || upper.width <= 0 || upper.height <= 0) {
        return false;
    }

    return (
        lower.left < upper.right + gap &&
        lower.right + gap > upper.left &&
        lower.top < upper.bottom + gap &&
        lower.bottom + gap > upper.top
    );
}

export function areRangeSliderTooltipLayoutsOverlapping({
    gap = TOOLTIP_COLLISION_GAP,
    lowerPercent,
    lowerSize,
    orientation,
    placement,
    trackLength,
    upperPercent,
    upperSize,
}: RangeSliderTooltipCollisionLayout) {
    if (
        trackLength <= 0 ||
        lowerSize.width <= 0 ||
        lowerSize.height <= 0 ||
        upperSize.width <= 0 ||
        upperSize.height <= 0
    ) {
        return false;
    }

    const getAnchor = (percent: number) => {
        const ratio = percent / 100;
        return orientation === 'vertical' ? trackLength * (1 - ratio) : trackLength * ratio;
    };
    const lowerInterval = getTooltipInterval(
        getAnchor(lowerPercent),
        lowerSize,
        orientation,
        placement,
    );
    const upperInterval = getTooltipInterval(
        getAnchor(upperPercent),
        upperSize,
        orientation,
        placement,
    );

    return areTooltipIntervalsOverlapping(lowerInterval, upperInterval, gap);
}

function getObservedSize(entry: ResizeObserverEntry): RangeSliderTooltipSize {
    const borderBoxSize = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;

    if (borderBoxSize) {
        return {
            width: borderBoxSize.inlineSize,
            height: borderBoxSize.blockSize,
        };
    }

    return {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
    };
}

function getElementSize(element: HTMLElement): RangeSliderTooltipSize {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}

export function useRangeSliderTooltipCollision({
    enabled,
    lower,
    orientation,
    placement,
    root,
    sizeDependencies = [],
    upper,
    valuePercent,
}: UseRangeSliderTooltipCollisionOptions) {
    const tooltipsOverlapping = ref(false);
    const rootSize = ref<RangeSliderTooltipSize>({ width: 0, height: 0 });
    const lowerSize = ref<RangeSliderTooltipSize>({ width: 0, height: 0 });
    const upperSize = ref<RangeSliderTooltipSize>({ width: 0, height: 0 });

    let resizeObserver: ResizeObserver | undefined;
    let frameWindow: Window | undefined;
    let frameId: number | undefined;
    let destroyed = false;

    function setOverlapping(value: boolean) {
        if (tooltipsOverlapping.value !== value) tooltipsOverlapping.value = value;
    }

    function updateCollision() {
        if (!enabled.value) {
            setOverlapping(false);
            return;
        }

        const trackLength =
            orientation.value === 'horizontal' ? rootSize.value.width : rootSize.value.height;

        setOverlapping(
            areRangeSliderTooltipLayoutsOverlapping({
                gap: TOOLTIP_COLLISION_GAP,
                lowerPercent: valuePercent.value[0],
                lowerSize: lowerSize.value,
                orientation: orientation.value,
                placement: placement.value,
                trackLength,
                upperPercent: valuePercent.value[1],
                upperSize: upperSize.value,
            }),
        );
    }

    function measureSizes() {
        if (destroyed) return;

        rootSize.value = root.value ? getElementSize(root.value) : { width: 0, height: 0 };
        lowerSize.value = lower.value ? getElementSize(lower.value) : { width: 0, height: 0 };
        upperSize.value = upper.value ? getElementSize(upper.value) : { width: 0, height: 0 };
        updateCollision();
    }

    function scheduleMeasure() {
        if (destroyed || frameId != null) return;

        const view = root.value?.ownerDocument.defaultView;
        if (!view?.requestAnimationFrame) {
            measureSizes();
            return;
        }

        frameWindow = view;
        frameId = view.requestAnimationFrame(() => {
            frameId = undefined;
            frameWindow = undefined;
            measureSizes();
        });
    }

    function refreshObservedElements() {
        if (!resizeObserver) return;

        resizeObserver.disconnect();
        for (const element of [root.value, lower.value, upper.value]) {
            if (element) resizeObserver.observe(element);
        }
    }

    function onResize(entries: ResizeObserverEntry[]) {
        for (const entry of entries) {
            const size = getObservedSize(entry);
            if (entry.target === root.value) rootSize.value = size;
            else if (entry.target === lower.value) lowerSize.value = size;
            else if (entry.target === upper.value) upperSize.value = size;
        }

        updateCollision();
    }

    function onWindowResize() {
        scheduleMeasure();
    }

    onMounted(() => {
        const view = root.value?.ownerDocument.defaultView;
        if (view?.ResizeObserver) resizeObserver = new view.ResizeObserver(onResize);
        view?.addEventListener('resize', onWindowResize);
        refreshObservedElements();

        // ResizeObserver supplies cached sizes without forcing layout. The fallback measurement
        // runs only when no observer is available or an explicit size dependency changes.
        if (!resizeObserver) scheduleMeasure();
    });

    watch(
        [root, lower, upper],
        () => {
            refreshObservedElements();
            if (!resizeObserver) scheduleMeasure();
        },
        { flush: 'post' },
    );
    watch([valuePercent, orientation, placement, enabled], updateCollision, { flush: 'sync' });
    watch(
        sizeDependencies,
        () => {
            if (!resizeObserver) scheduleMeasure();
        },
        { flush: 'post' },
    );

    const arrowAlongTrackAxis = computed(() =>
        orientation.value === 'horizontal'
            ? placement.value === 'top' || placement.value === 'bottom'
            : placement.value === 'left' || placement.value === 'right',
    );
    const trackAxisLength = computed(() =>
        orientation.value === 'horizontal' ? rootSize.value.width : rootSize.value.height,
    );
    const thumbDistance = computed(() => {
        const [lowerPercent, upperPercent] = valuePercent.value;
        return (Math.abs(upperPercent - lowerPercent) / 100) * trackAxisLength.value;
    });

    const mergedArrowOffset = computed(() => {
        if (trackAxisLength.value <= 0 || !arrowAlongTrackAxis.value) return 0;
        return thumbDistance.value * 0.5;
    });

    // Widen the merged box as the thumbs separate so each arrow keeps at least the
    // distance-to-edge it had before merging. With the box centred on the midpoint,
    // arrow-to-edge resolves to max(lower, upper) / 2 — half the wider endpoint tooltip,
    // i.e. the pre-merge value used as the floor. A naturally wider box (short values)
    // keeps its larger margin. Only while merged: the hidden merged box must not inflate
    // to the full thumb span when the endpoint tooltips are the ones on screen.
    const mergedMinSize = computed(() => {
        if (!tooltipsOverlapping.value || trackAxisLength.value <= 0 || !arrowAlongTrackAxis.value)
            return 0;
        const maxEndpoint = Math.max(
            getAxisSize(lowerSize.value, orientation.value),
            getAxisSize(upperSize.value, orientation.value),
        );
        return thumbDistance.value + maxEndpoint;
    });

    onBeforeUnmount(() => {
        destroyed = true;
        const view = root.value?.ownerDocument.defaultView;
        view?.removeEventListener('resize', onWindowResize);
        resizeObserver?.disconnect();
        if (frameId != null) frameWindow?.cancelAnimationFrame(frameId);
    });

    return { tooltipsOverlapping, mergedArrowOffset, mergedMinSize };
}
