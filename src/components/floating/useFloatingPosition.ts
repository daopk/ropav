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
    ref,
    shallowRef,
    watch,
    type CSSProperties,
    type Ref,
} from 'vue';
import type {
    FloatingCollisionPadding,
    FloatingOffset,
    FloatingPlacement,
    FloatingReference,
    FloatingStrategy,
    FloatingTarget,
} from './types';

type Source<T> = () => T;

export interface UseFloatingPositionOptions<TPlacement extends FloatingPlacement> {
    reference: Readonly<Ref<FloatingReference | null>>;
    floating: Ref<HTMLElement | null>;
    arrow?: Ref<HTMLElement | null>;
    open: Readonly<Ref<boolean>>;
    placement: Source<TPlacement>;
    strategy: Source<FloatingStrategy>;
    offset: Source<FloatingOffset | undefined>;
    flip: Source<boolean>;
    shift: Source<boolean>;
    collisionPadding: Source<FloatingCollisionPadding>;
    arrowEnabled: Source<boolean>;
    restartKey?: Source<unknown>;
}

export interface UseFloatingPositionReturn<TPlacement extends FloatingPlacement> {
    actualPlacement: Ref<TPlacement>;
    arrowStyle: Ref<CSSProperties | undefined>;
    floatingStyle: Ref<CSSProperties>;
    isPositioned: Ref<boolean>;
    start: () => void;
    stop: () => void;
    update: () => Promise<void>;
}

const DEFAULT_ARROW_PADDING = 4;

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

export function useFloatingPosition<TPlacement extends FloatingPlacement>(
    options: UseFloatingPositionOptions<TPlacement>,
): UseFloatingPositionReturn<TPlacement> {
    const actualPlacement = ref<TPlacement>(options.placement()) as Ref<TPlacement>;
    const isPositioned = ref(false);
    const floatingStyle = ref<CSSProperties>(getHiddenStyle());
    const arrowStyle = ref<CSSProperties>();

    let cleanup: (() => void) | undefined;
    let generation = 0;
    let request = 0;

    function getHiddenStyle(): CSSProperties {
        return {
            position: options.strategy(),
            top: '0',
            left: '0',
            visibility: 'hidden',
        };
    }

    function resetPosition() {
        actualPlacement.value = options.placement();
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
        const middleware: Middleware[] = [floatingOffset(options.offset() ?? 8)];
        const padding = options.collisionPadding();

        if (options.flip()) middleware.push(floatingFlip({ padding }));
        if (options.shift()) middleware.push(floatingShift({ padding }));
        if (options.arrowEnabled() && options.arrow?.value) {
            middleware.push(
                floatingArrow({ element: options.arrow.value, padding: DEFAULT_ARROW_PADDING }),
            );
        }

        return middleware;
    }

    async function update() {
        const reference = options.reference.value;
        const floating = options.floating.value;
        if (!reference || !floating || !options.open.value) return;

        const currentGeneration = generation;
        const currentRequest = ++request;
        const result = await computePosition(reference, floating, {
            placement: options.placement() as Placement,
            strategy: options.strategy(),
            middleware: getMiddleware(),
        });

        if (currentGeneration !== generation || currentRequest !== request || !options.open.value) {
            return;
        }

        actualPlacement.value = result.placement as TPlacement;
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
        resetPosition();
        if (!options.open.value) return;

        void nextTick(() => {
            const reference = options.reference.value;
            const floating = options.floating.value;
            if (!reference || !floating || !options.open.value) return;

            cleanup = autoUpdate(reference, floating, () => void update());
        });
    }

    watch(
        [
            options.open,
            options.reference,
            options.floating,
            () => options.arrow?.value,
            options.placement,
            options.strategy,
            options.offset,
            options.flip,
            options.shift,
            options.collisionPadding,
            options.arrowEnabled,
            () => options.restartKey?.(),
        ],
        start,
        { flush: 'post', immediate: true },
    );

    onBeforeUnmount(stop);

    return {
        actualPlacement,
        arrowStyle,
        floatingStyle,
        isPositioned,
        start,
        stop,
        update,
    };
}
