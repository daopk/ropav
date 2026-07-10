import { onBeforeUnmount, onMounted, onUpdated, ref, type Ref } from 'vue';

const TOOLTIP_COLLISION_GAP = 4;
const TOOLTIP_COLLISION_RELEASE_GAP = 8;
const TOOLTIP_CONTENT_SELECTOR = '.rp-tooltip__content';

type TooltipRect = Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>;

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

export function useRangeSliderTooltipCollision(root: Ref<HTMLElement | null>) {
    const tooltipsOverlapping = ref(false);
    const observedElements = new Set<Element>();
    let resizeObserver: ResizeObserver | undefined;
    let frameWindow: Window | undefined;
    let frameId: number | undefined;
    let microtaskQueued = false;
    let destroyed = false;

    function setOverlapping(value: boolean) {
        if (tooltipsOverlapping.value !== value) tooltipsOverlapping.value = value;
    }

    function getTooltipContents(el: HTMLElement) {
        return [
            el.querySelector<HTMLElement>(
                `.rp-range-slider__tooltip--lower ${TOOLTIP_CONTENT_SELECTOR}`,
            ),
            el.querySelector<HTMLElement>(
                `.rp-range-slider__tooltip--upper ${TOOLTIP_CONTENT_SELECTOR}`,
            ),
        ] as const;
    }

    function measure() {
        if (destroyed) return;

        const el = root.value;
        if (!el) {
            setOverlapping(false);
            return;
        }

        const [lower, upper] = getTooltipContents(el);
        if (!lower || !upper) {
            setOverlapping(false);
            return;
        }

        const view = el.ownerDocument.defaultView;
        if (
            !view ||
            view.getComputedStyle(lower).display === 'none' ||
            view.getComputedStyle(upper).display === 'none'
        ) {
            setOverlapping(false);
            return;
        }

        setOverlapping(
            areRangeSliderTooltipRectsOverlapping(
                lower.getBoundingClientRect(),
                upper.getBoundingClientRect(),
                tooltipsOverlapping.value ? TOOLTIP_COLLISION_RELEASE_GAP : TOOLTIP_COLLISION_GAP,
            ),
        );
    }

    function scheduleMeasure() {
        if (destroyed || frameId != null || microtaskQueued) return;

        const view = root.value?.ownerDocument.defaultView;
        if (view?.requestAnimationFrame) {
            frameWindow = view;
            frameId = view.requestAnimationFrame(() => {
                frameId = undefined;
                frameWindow = undefined;
                measure();
            });
            return;
        }

        microtaskQueued = true;
        queueMicrotask(() => {
            microtaskQueued = false;
            measure();
        });
    }

    function refreshObservedElements() {
        if (!resizeObserver) return;

        const el = root.value;
        const nextElements = new Set<Element>();
        if (el) {
            nextElements.add(el);
            for (const tooltip of getTooltipContents(el)) {
                if (tooltip) nextElements.add(tooltip);
            }
        }

        for (const observed of observedElements) {
            if (!nextElements.has(observed)) resizeObserver.unobserve(observed);
        }
        for (const next of nextElements) {
            if (!observedElements.has(next)) resizeObserver.observe(next);
        }

        observedElements.clear();
        for (const next of nextElements) observedElements.add(next);
    }

    function onWindowResize() {
        scheduleMeasure();
    }

    onMounted(() => {
        const view = root.value?.ownerDocument.defaultView;
        if (view?.ResizeObserver) resizeObserver = new view.ResizeObserver(scheduleMeasure);
        view?.addEventListener('resize', onWindowResize);
        refreshObservedElements();
        scheduleMeasure();
    });

    onUpdated(() => {
        refreshObservedElements();
        scheduleMeasure();
    });

    onBeforeUnmount(() => {
        destroyed = true;
        const view = root.value?.ownerDocument.defaultView;
        view?.removeEventListener('resize', onWindowResize);
        resizeObserver?.disconnect();
        observedElements.clear();
        if (frameId != null) frameWindow?.cancelAnimationFrame(frameId);
    });

    return { tooltipsOverlapping };
}
