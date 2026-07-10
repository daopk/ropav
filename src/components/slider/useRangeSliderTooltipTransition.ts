import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue';

const DEFAULT_TRANSITION_DURATION = 150;
const DEFAULT_TRANSITION_EASING = 'ease';
const TOOLTIP_CONTENT_SELECTOR = '.rp-tooltip__content';
const TRANSITION_EASING_PATTERN =
    /(?:cubic-bezier|linear|steps)\([^)]*\)|\b(?:ease-in-out|ease-in|ease-out|ease|linear|step-end|step-start)\b/;

type EndpointTooltipKind = 'lower' | 'upper';
type TooltipKind = EndpointTooltipKind | 'merged';

interface Point {
    x: number;
    y: number;
}

interface TooltipSnapshot {
    center: Point;
    opacity: number;
}

interface FrozenContentSize {
    element: HTMLElement;
    height: string;
    width: string;
}

interface HeldOpacity {
    element: HTMLElement;
    opacity: string;
}

function getTooltip(root: HTMLElement, kind: TooltipKind) {
    return root.querySelector<HTMLElement>(`.rp-range-slider__tooltip--${kind}`);
}

function getTooltipCenter(tooltip: HTMLElement): Point | undefined {
    const content = tooltip.querySelector<HTMLElement>(TOOLTIP_CONTENT_SELECTOR);
    if (!content) return;

    const rect = content.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

function getTooltipSnapshot(tooltip: HTMLElement): TooltipSnapshot | undefined {
    const center = getTooltipCenter(tooltip);
    if (!center) return;

    const opacity = Number.parseFloat(
        tooltip.ownerDocument.defaultView!.getComputedStyle(tooltip).opacity,
    );

    return {
        center,
        opacity: Number.isFinite(opacity) ? opacity : 0,
    };
}

function getCarrierKind(root: HTMLElement): EndpointTooltipKind {
    return root.dataset.activeThumb === 'lower' ? 'upper' : 'lower';
}

function getTransitionOptions(root: HTMLElement) {
    const transition = root.ownerDocument
        .defaultView!.getComputedStyle(root)
        .getPropertyValue('--rp-transition-fast')
        .trim();
    const durationMatch = transition.match(/([\d.]+)(ms|s)/);

    if (!durationMatch) {
        return {
            duration: DEFAULT_TRANSITION_DURATION,
            easing: DEFAULT_TRANSITION_EASING,
        };
    }

    const durationValue = Number.parseFloat(durationMatch[1]);
    const duration = durationMatch[2] === 's' ? durationValue * 1000 : durationValue;
    const easing = transition.match(TRANSITION_EASING_PATTERN)?.[0] ?? DEFAULT_TRANSITION_EASING;

    return { duration, easing };
}

function prefersReducedMotion(root: HTMLElement) {
    return root.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function getTranslate(from: Point, base: Point) {
    return `translate3d(${from.x - base.x}px, ${from.y - base.y}px, 0)`;
}

export function useRangeSliderTooltipTransition(
    root: Ref<HTMLElement | null>,
    tooltipsOverlapping: Ref<boolean>,
    value: Ref<readonly [number, number]>,
    activeThumb: Ref<EndpointTooltipKind | undefined>,
) {
    const animations = new Set<Animation>();
    let inferredCarrier: EndpointTooltipKind | undefined;
    let frozenMergedContent: FrozenContentSize | undefined;
    let frozenMergedTooltip: HTMLElement | undefined;
    let heldSplitOpacity: HeldOpacity[] = [];
    let transitionId = 0;

    watch(
        activeThumb,
        () => {
            inferredCarrier = undefined;
        },
        { flush: 'sync' },
    );

    watch(
        value,
        (next, previous) => {
            const lowerMoved = next[0] !== previous[0];
            const upperMoved = next[1] !== previous[1];

            if (lowerMoved !== upperMoved) inferredCarrier = lowerMoved ? 'upper' : 'lower';
            else inferredCarrier = undefined;
        },
        { flush: 'sync' },
    );

    function clearFrozenMergedPosition() {
        if (frozenMergedTooltip) {
            frozenMergedTooltip.style.removeProperty('left');
            frozenMergedTooltip.style.removeProperty('top');
        }
        if (frozenMergedContent) {
            const { element, height, width } = frozenMergedContent;
            if (width) element.style.width = width;
            else element.style.removeProperty('width');
            if (height) element.style.height = height;
            else element.style.removeProperty('height');
        }

        frozenMergedTooltip = undefined;
        frozenMergedContent = undefined;
    }

    function freezeMergedPosition(merged: HTMLElement) {
        // During a split the active thumb can keep moving, so pin the midpoint anchor while the
        // visible merged bubble returns to the stationary carrier. Its size is pinned as well so
        // left/right placements do not shift when the formatted value changes width mid-flight.
        const style = merged.ownerDocument.defaultView!.getComputedStyle(merged);
        const content = merged.querySelector<HTMLElement>(TOOLTIP_CONTENT_SELECTOR);
        merged.style.left = style.left;
        merged.style.top = style.top;
        frozenMergedTooltip = merged;

        if (content) {
            const rect = content.getBoundingClientRect();
            frozenMergedContent = {
                element: content,
                height: content.style.height,
                width: content.style.width,
            };
            content.style.width = `${rect.width}px`;
            content.style.height = `${rect.height}px`;
        }
    }

    function clearHeldSplitOpacity() {
        for (const { element, opacity } of heldSplitOpacity) {
            if (opacity) element.style.opacity = opacity;
            else element.style.removeProperty('opacity');
        }
        heldSplitOpacity = [];
    }

    function holdSplitOpacity(merged: HTMLElement, endpoints: HTMLElement[]) {
        const elements = [merged, ...endpoints];
        heldSplitOpacity = elements.map((element) => ({
            element,
            opacity: element.style.opacity,
        }));

        merged.style.opacity = '1';
        for (const endpoint of endpoints) endpoint.style.opacity = '0';
    }

    function cancelAnimations() {
        for (const animation of animations) animation.cancel();
        animations.clear();
    }

    function animate(
        element: HTMLElement,
        keyframes: Keyframe[],
        options: KeyframeAnimationOptions,
        onComplete?: () => void,
    ) {
        let animation: Animation;
        try {
            animation = element.animate(keyframes, options);
        } catch {
            try {
                animation = element.animate(keyframes, {
                    duration: DEFAULT_TRANSITION_DURATION,
                    easing: DEFAULT_TRANSITION_EASING,
                });
            } catch {
                onComplete?.();
                return;
            }
        }
        animations.add(animation);

        let completed = false;
        const removeAnimation = () => {
            if (completed) return;
            completed = true;
            animations.delete(animation);
            onComplete?.();
        };
        animation.addEventListener('cancel', removeAnimation, { once: true });
        animation.addEventListener('finish', removeAnimation, { once: true });
    }

    watch(
        tooltipsOverlapping,
        async (overlapping) => {
            const el = root.value;
            if (!el) return;

            const lower = getTooltip(el, 'lower');
            const upper = getTooltip(el, 'upper');
            const merged = getTooltip(el, 'merged');
            const carrier = getTooltip(el, inferredCarrier ?? getCarrierKind(el));
            inferredCarrier = undefined;
            if (!lower || !upper || !merged || !carrier) return;

            const snapshots = new Map<HTMLElement, TooltipSnapshot>();
            for (const tooltip of [lower, upper, merged]) {
                const snapshot = getTooltipSnapshot(tooltip);
                if (snapshot) snapshots.set(tooltip, snapshot);
            }

            const carrierSnapshot = snapshots.get(carrier);
            const mergedSnapshot = snapshots.get(merged);
            const currentTransitionId = ++transitionId;

            await nextTick();

            if (currentTransitionId !== transitionId || root.value !== el) return;

            cancelAnimations();
            clearFrozenMergedPosition();
            clearHeldSplitOpacity();

            if (typeof merged.animate !== 'function' || prefersReducedMotion(el)) {
                return;
            }

            const { duration, easing } = getTransitionOptions(el);
            if (duration <= 0) return;

            if (!overlapping) {
                freezeMergedPosition(merged);
                holdSplitOpacity(merged, [lower, upper]);
            }

            const mergedBaseCenter = getTooltipCenter(merged);
            const carrierCenter = getTooltipCenter(carrier);
            if (!mergedBaseCenter || !carrierCenter) {
                clearFrozenMergedPosition();
                clearHeldSplitOpacity();
                return;
            }

            const options: KeyframeAnimationOptions = { duration, easing };
            const releaseFrozenPosition = overlapping
                ? undefined
                : () => {
                      if (currentTransitionId !== transitionId) return;
                      clearFrozenMergedPosition();
                      clearHeldSplitOpacity();
                  };
            // Continue an interrupted handoff from its current visual position. A fresh merge
            // starts directly on the stationary endpoint so no bubble appears to teleport.
            const mergedStartCenter =
                mergedSnapshot && mergedSnapshot.opacity > 0
                    ? mergedSnapshot.center
                    : (carrierSnapshot?.center ?? carrierCenter);
            const mergedEndCenter = overlapping ? mergedBaseCenter : carrierCenter;

            animate(
                merged,
                [
                    {
                        transform: getTranslate(mergedStartCenter, mergedBaseCenter),
                    },
                    {
                        transform: getTranslate(mergedEndCenter, mergedBaseCenter),
                    },
                ],
                options,
                releaseFrozenPosition,
            );
        },
        { flush: 'pre' },
    );

    onBeforeUnmount(() => {
        transitionId += 1;
        cancelAnimations();
        clearFrozenMergedPosition();
        clearHeldSplitOpacity();
    });
}
