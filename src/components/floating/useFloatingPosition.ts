import {
    arrow as floatingArrow,
    autoUpdate,
    computePosition,
    flip as floatingFlip,
    offset as floatingOffset,
    shift as floatingShift,
    type Middleware,
    type Placement,
} from '@floating-ui/dom';
import {
    computed,
    isRef,
    nextTick,
    onBeforeUnmount,
    onMounted,
    readonly,
    ref,
    shallowRef,
    toValue,
    watch,
    type CSSProperties,
    type Ref,
} from 'vue';
import type {
    FloatingAutoUpdateOptions,
    FloatingCollisionPadding,
    FloatingFlipFallbackStrategy,
    FloatingOffset,
    FloatingPlacement,
    FloatingReference,
    FloatingStrategy,
    FloatingTarget,
    UseFloatingPositionOptions,
    UseFloatingPositionReturn,
} from './types';

type Source<T> = () => T;

const DEFAULT_ARROW_PADDING = 4;
const DEFAULT_COLLISION_PADDING = 8;
const DEFAULT_OFFSET = 8;
const DEFAULT_PLACEMENT: FloatingPlacement = 'bottom';
const DEFAULT_STRATEGY: FloatingStrategy = 'absolute';

export function readFloatingTarget(target: FloatingTarget | null | undefined) {
    return isRef(target) ? target.value : target;
}

export function isVirtualReference(value: unknown): value is FloatingReference {
    if (value == null || typeof value !== 'object') return false;
    return 'getBoundingClientRect' in value && typeof value.getBoundingClientRect === 'function';
}

export function isElementReference(value: unknown): value is Element {
    return typeof Element !== 'undefined' && value instanceof Element;
}

export function resolveFloatingTarget(
    target: string | FloatingReference | null | undefined,
): FloatingReference | null {
    if (!target) return null;
    if (typeof target !== 'string') return isVirtualReference(target) ? target : null;
    if (typeof document === 'undefined') return null;

    try {
        return document.querySelector(target);
    } catch {
        return null;
    }
}

export function useFloatingTarget(
    getTarget: Source<FloatingTarget | null | undefined>,
    fallback: Readonly<Ref<Element | null>>,
) {
    const resolvedTarget = shallowRef<FloatingReference | null>(null);
    const isExplicitTarget = computed(() => {
        const target = readFloatingTarget(getTarget());
        return target != null && target !== '';
    });
    const reference = computed<FloatingReference | null>(() =>
        isExplicitTarget.value ? resolvedTarget.value : fallback.value,
    );

    function syncTarget() {
        resolvedTarget.value = isExplicitTarget.value
            ? resolveFloatingTarget(readFloatingTarget(getTarget()))
            : null;
    }

    watch(() => readFloatingTarget(getTarget()), syncTarget, { flush: 'post' });
    onMounted(syncTarget);

    return {
        isExplicitTarget,
        reference,
        resolvedTarget,
        syncTarget,
    };
}

export function useFloatingPosition(
    options: UseFloatingPositionOptions,
): UseFloatingPositionReturn {
    const actualPlacement = ref<FloatingPlacement>(getPlacement());
    const isPositioned = ref(false);
    const floatingStyle = ref<CSSProperties>(getHiddenStyle());
    const arrowStyle = ref<CSSProperties>();

    let cleanup: (() => void) | undefined;
    let generation = 0;
    let request = 0;

    function getReference() {
        return toValue(options.reference);
    }

    function getFloating() {
        return toValue(options.floating);
    }

    function getArrow() {
        return toValue(options.arrow);
    }

    function getOpen() {
        return toValue(options.open) !== false;
    }

    function getPlacement(): FloatingPlacement {
        return toValue(options.placement) ?? DEFAULT_PLACEMENT;
    }

    function getStrategy(): FloatingStrategy {
        return toValue(options.strategy) ?? DEFAULT_STRATEGY;
    }

    function getOffset(): FloatingOffset {
        return toValue(options.offset) ?? DEFAULT_OFFSET;
    }

    function getFlip() {
        return toValue(options.flip) !== false;
    }

    function getFlipFallbackStrategy(): FloatingFlipFallbackStrategy | undefined {
        return toValue(options.flipOptions)?.fallbackStrategy;
    }

    function getShift() {
        return toValue(options.shift) !== false;
    }

    function getCollisionPadding(): FloatingCollisionPadding {
        return toValue(options.collisionPadding) ?? DEFAULT_COLLISION_PADDING;
    }

    function getAutoUpdateAnimationFrame(): boolean | undefined {
        return toValue(options.autoUpdateOptions)?.animationFrame;
    }

    function getHiddenStyle(): CSSProperties {
        return {
            position: getStrategy(),
            top: '0',
            left: '0',
            visibility: 'hidden',
        };
    }

    function resetPosition() {
        actualPlacement.value = getPlacement();
        isPositioned.value = false;
        floatingStyle.value = getHiddenStyle();
        arrowStyle.value = undefined;
    }

    function stop() {
        cleanup?.();
        cleanup = undefined;
        generation += 1;
        request += 1;
    }

    function getMiddleware(): Middleware[] {
        const middleware: Middleware[] = [floatingOffset(getOffset())];
        const padding = getCollisionPadding();

        const fallbackStrategy = getFlipFallbackStrategy();
        if (getFlip()) {
            middleware.push(
                floatingFlip({
                    padding,
                    ...(fallbackStrategy == null ? {} : { fallbackStrategy }),
                }),
            );
        }
        if (getShift()) middleware.push(floatingShift({ padding }));
        const arrow = getArrow();
        if (arrow) {
            middleware.push(floatingArrow({ element: arrow, padding: DEFAULT_ARROW_PADDING }));
        }

        return middleware;
    }

    async function update() {
        const reference = getReference();
        const floating = getFloating();
        if (!reference || !floating || !getOpen()) return;

        const currentGeneration = generation;
        const currentRequest = ++request;
        const result = await computePosition(reference, floating, {
            placement: getPlacement() as Placement,
            strategy: getStrategy(),
            middleware: getMiddleware(),
        });

        if (currentGeneration !== generation || currentRequest !== request || !getOpen()) {
            return;
        }

        actualPlacement.value = result.placement as FloatingPlacement;
        floatingStyle.value = {
            position: result.strategy,
            top: `${result.y}px`,
            left: `${result.x}px`,
        };
        const arrowData = result.middlewareData.arrow;
        arrowStyle.value = arrowData
            ? {
                  left: arrowData.x == null ? undefined : `${arrowData.x}px`,
                  top: arrowData.y == null ? undefined : `${arrowData.y}px`,
              }
            : undefined;
        isPositioned.value = true;
    }

    function start() {
        stop();
        if (!getOpen()) return;
        resetPosition();

        const currentGeneration = generation;

        void nextTick(() => {
            const reference = getReference();
            const floating = getFloating();
            if (currentGeneration !== generation || !reference || !floating || !getOpen()) {
                return;
            }

            const updatePosition = () => void update();
            const animationFrame = getAutoUpdateAnimationFrame();
            cleanup =
                animationFrame == null
                    ? autoUpdate(reference, floating, updatePosition)
                    : autoUpdate(reference, floating, updatePosition, {
                          animationFrame,
                      } satisfies FloatingAutoUpdateOptions);
        });
    }

    watch(
        [
            getOpen,
            getReference,
            getFloating,
            getArrow,
            getPlacement,
            getStrategy,
            getOffset,
            getFlip,
            getFlipFallbackStrategy,
            getShift,
            getCollisionPadding,
            getAutoUpdateAnimationFrame,
            () => toValue(options.restartKey),
        ],
        start,
        { flush: 'post', immediate: true },
    );

    onBeforeUnmount(stop);

    return {
        actualPlacement: readonly(actualPlacement),
        arrowStyle: readonly(arrowStyle),
        floatingStyle: readonly(floatingStyle),
        isPositioned: readonly(isPositioned),
        update,
    };
}
