import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    useId,
    watch,
    type CSSProperties,
    type HTMLAttributes,
} from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { isNodeWithinElement } from '@/utils/dom/events';
import { getPointerId } from '@/utils/dom/pointer';
import {
    applyFallbackScrollPosition,
    getKeyboardScrollPosition,
    getLogicalHorizontalScrollPosition,
    getPointerAxisCoordinate,
    getRawHorizontalScrollPosition,
    getScrollDirection,
    getScrollThumbGeometry,
    getScrollThumbOffset,
    getWheelScrollDelta,
    type ScrollAxis,
    type ScrollDirection,
} from '@/utils/dom/scroll';
import { clamp } from '@/utils/number';
import { createRafScheduler } from '@/utils/rafScheduler';
import type {
    ScrollAreaOrientation,
    ScrollAreaPart,
    ScrollAreaPosition,
    ScrollAreaProps,
    ScrollAreaScrollbars,
    ScrollAreaSlotProps,
    ScrollAreaType,
} from './types';

type ScrollBoundary = 'top' | 'bottom' | 'left' | 'right';

interface ScrollAreaMetrics {
    direction: ScrollDirection;
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
    x: number;
    y: number;
    overflowX: boolean;
    overflowY: boolean;
    horizontalThumbSize: number;
    horizontalThumbOffset: number;
    verticalThumbSize: number;
    verticalThumbOffset: number;
}

interface DragSession {
    axis: ScrollAxis;
    pointerId: number | undefined;
    startCoordinate: number;
    startPosition: number;
    maxPosition: number;
    travel: number;
    coordinateDirection: 1 | -1;
    view: Window | null;
}

interface ScrollAreaEmit {
    (event: 'scroll', value: Event): void;
    (event: 'scrollPositionChange', value: ScrollAreaPosition): void;
    (event: 'reachTop', value: Event): void;
    (event: 'reachBottom', value: Event): void;
    (event: 'reachLeft', value: Event): void;
    (event: 'reachRight', value: Event): void;
}

const minimumThumbSize = 18;
const keyboardScrollStep = 40;

export function useScrollArea(props: Readonly<ScrollAreaProps>, emit: ScrollAreaEmit) {
    const rootRef = ref<HTMLElement | null>(null);
    const viewportRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const horizontalScrollbarRef = ref<HTMLElement | null>(null);
    const verticalScrollbarRef = ref<HTMLElement | null>(null);
    const isHovered = ref(false);
    const hasFocusWithin = ref(false);
    const isScrolling = ref(false);
    const draggingAxis = ref<ScrollAxis | null>(null);
    const metrics = reactive<ScrollAreaMetrics>({
        direction: 'ltr',
        clientWidth: 0,
        clientHeight: 0,
        scrollWidth: 0,
        scrollHeight: 0,
        x: 0,
        y: 0,
        overflowX: false,
        overflowY: false,
        horizontalThumbSize: 100,
        horizontalThumbOffset: 0,
        verticalThumbSize: 100,
        verticalThumbOffset: 0,
    });

    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let directionObserver: MutationObserver | undefined;
    let horizontalThumbSizeRatio = 1;
    let verticalThumbSizeRatio = 1;
    let previousPosition: ScrollAreaPosition = { x: 0, y: 0 };
    let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;
    let dragSession: DragSession | undefined;

    const horizontalEnabled = computed(() => isAxisEnabled(props.scrollbars, 'x'));
    const verticalEnabled = computed(() => isAxisEnabled(props.scrollbars, 'y'));
    const renderHorizontalScrollbar = computed(
        () => horizontalEnabled.value && props.type !== 'never',
    );
    const renderVerticalScrollbar = computed(() => verticalEnabled.value && props.type !== 'never');
    const horizontalScrollbarActive = computed(() =>
        isScrollbarActive(props.type ?? 'hover', horizontalEnabled.value, metrics.overflowX),
    );
    const verticalScrollbarActive = computed(() =>
        isScrollbarActive(props.type ?? 'hover', verticalEnabled.value, metrics.overflowY),
    );
    const horizontalScrollbarVisible = computed(() =>
        isScrollbarVisible(horizontalScrollbarActive.value, 'x'),
    );
    const verticalScrollbarVisible = computed(() =>
        isScrollbarVisible(verticalScrollbarActive.value, 'y'),
    );

    const scheduler = createRafScheduler(
        update,
        () => viewportRef.value?.ownerDocument.defaultView,
    );
    const positionScheduler = createRafScheduler(
        updatePosition,
        () => viewportRef.value?.ownerDocument.defaultView,
    );

    const generatedId = useId();
    const viewportId = computed(() => `${props.id || generatedId}-viewport`);
    const { getPartAttrs, getRootAttrs } = useStylesApi<ScrollAreaPart>(props, 'root');
    const rootAttrs = computed(() =>
        getRootAttrs({
            id: props.id,
            class: 'rp-scroll-area',
            style: getRootStyle(props.scrollbarSize),
            'data-type': props.type,
            'data-direction': metrics.direction,
            'data-scrollbars': props.scrollbars === false ? 'none' : props.scrollbars,
            'data-overflow-x': toPresenceAttribute(metrics.overflowX),
            'data-overflow-y': toPresenceAttribute(metrics.overflowY),
            'data-scrollbar-x-active': toPresenceAttribute(horizontalScrollbarActive.value),
            'data-scrollbar-y-active': toPresenceAttribute(verticalScrollbarActive.value),
            'data-scrollbar-x-visible': toPresenceAttribute(horizontalScrollbarVisible.value),
            'data-scrollbar-y-visible': toPresenceAttribute(verticalScrollbarVisible.value),
            onPointerenter,
            onPointerleave,
            onFocusin,
            onFocusout,
        }),
    );
    const viewportAttrs = computed<HTMLAttributes>(() => {
        const {
            class: compatibilityClass,
            style: compatibilityStyle,
            onScroll: compatibilityOnScroll,
            ...attrs
        } = props.viewportAttrs ?? {};

        return {
            ...attrs,
            ...getPartAttrs('viewport', {
                class: 'rp-scroll-area__viewport',
                compatibilityClass,
                compatibilityStyle,
            }),
            id: viewportId.value,
            role: attrs.role ?? (hasAccessibleName(props, attrs) ? 'region' : undefined),
            tabindex: attrs.tabindex ?? 0,
            'aria-label': props.ariaLabel || attrs['aria-label'] || undefined,
            'aria-labelledby': props.ariaLabelledby || attrs['aria-labelledby'] || undefined,
            'aria-describedby': props.ariaDescribedby || attrs['aria-describedby'] || undefined,
            onScroll(event) {
                onViewportScroll(event);
                compatibilityOnScroll?.(event);
            },
        };
    });
    const contentAttrs = computed<HTMLAttributes>(() => {
        const {
            class: compatibilityClass,
            style: compatibilityStyle,
            ...attrs
        } = props.contentAttrs ?? {};

        return {
            ...attrs,
            ...getPartAttrs('content', {
                class: 'rp-scroll-area__content',
                compatibilityClass,
                compatibilityStyle,
            }),
        };
    });
    const horizontalScrollbarAttrs = computed(() => getScrollbarAttrs('x'));
    const verticalScrollbarAttrs = computed(() => getScrollbarAttrs('y'));
    const horizontalThumbAttrs = computed(() => getThumbAttrs('x'));
    const verticalThumbAttrs = computed(() => getThumbAttrs('y'));
    const cornerAttrs = computed(() => ({
        ...getPartAttrs('corner', { class: 'rp-scroll-area__corner' }),
        'aria-hidden': true,
        'data-direction': metrics.direction,
        'data-visible': toPresenceAttribute(
            horizontalScrollbarActive.value && verticalScrollbarActive.value,
        ),
    }));
    const slotProps = computed<ScrollAreaSlotProps>(() => ({
        position: { x: metrics.x, y: metrics.y },
        overflowX: metrics.overflowX,
        overflowY: metrics.overflowY,
        scrollTo,
        scrollBy,
        update,
    }));
    const templateRefs = {
        root: rootRef,
        viewport: viewportRef,
        content: contentRef,
        horizontalScrollbar: horizontalScrollbarRef,
        verticalScrollbar: verticalScrollbarRef,
    };

    function update() {
        const viewport = viewportRef.value;
        if (!viewport) return;

        readViewportGeometry(viewport);
        updateThumbGeometry(viewport);
        updatePosition(viewport);
    }

    function readViewportGeometry(viewport: HTMLElement) {
        metrics.clientWidth = viewport.clientWidth;
        metrics.clientHeight = viewport.clientHeight;
        metrics.scrollWidth = viewport.scrollWidth;
        metrics.scrollHeight = viewport.scrollHeight;
        metrics.overflowX =
            horizontalEnabled.value && viewport.scrollWidth > viewport.clientWidth + 1;
        metrics.overflowY =
            verticalEnabled.value && viewport.scrollHeight > viewport.clientHeight + 1;
    }

    function updateThumbGeometry(viewport: HTMLElement) {
        const horizontalGeometry = getScrollThumbGeometry(
            horizontalScrollbarRef.value?.clientWidth ?? viewport.clientWidth,
            viewport.clientWidth,
            viewport.scrollWidth,
            minimumThumbSize,
        );
        const verticalGeometry = getScrollThumbGeometry(
            verticalScrollbarRef.value?.clientHeight ?? viewport.clientHeight,
            viewport.clientHeight,
            viewport.scrollHeight,
            minimumThumbSize,
        );

        metrics.horizontalThumbSize = horizontalGeometry.size;
        horizontalThumbSizeRatio = horizontalGeometry.offsetRatio;
        metrics.verticalThumbSize = verticalGeometry.size;
        verticalThumbSizeRatio = verticalGeometry.offsetRatio;
    }

    function updatePosition(viewport = viewportRef.value) {
        if (!viewport) return;

        metrics.direction = getScrollDirection(viewport);
        metrics.x = getLogicalHorizontalScrollPosition(
            viewport.scrollLeft,
            getMaxPosition('x'),
            metrics.direction,
        );
        metrics.y = clamp(viewport.scrollTop, 0, getMaxPosition('y'));
        metrics.horizontalThumbOffset = getScrollThumbOffset(
            metrics.x,
            getMaxPosition('x'),
            horizontalThumbSizeRatio,
        );
        metrics.verticalThumbOffset = getScrollThumbOffset(
            metrics.y,
            getMaxPosition('y'),
            verticalThumbSizeRatio,
        );
    }

    function getPosition(axis: ScrollAxis) {
        return axis === 'x' ? metrics.x : metrics.y;
    }

    function getMaxPosition(axis: ScrollAxis) {
        return axis === 'x'
            ? Math.max(0, metrics.scrollWidth - metrics.clientWidth)
            : Math.max(0, metrics.scrollHeight - metrics.clientHeight);
    }

    function getOverflow(axis: ScrollAxis) {
        return axis === 'x' ? metrics.overflowX : metrics.overflowY;
    }

    function attachObservers() {
        const viewport = viewportRef.value;
        if (!viewport) return;

        const view = viewport.ownerDocument.defaultView;
        const ResizeObserverConstructor = view?.ResizeObserver ?? globalThis.ResizeObserver;
        if (ResizeObserverConstructor) {
            resizeObserver = new ResizeObserverConstructor(scheduler.schedule);
            resizeObserver.observe(viewport);
            if (contentRef.value) resizeObserver.observe(contentRef.value);
        } else {
            attachMutationObserver(view);
        }
        attachDirectionObserver(view, viewport);
        view?.addEventListener('resize', scheduler.schedule);
    }

    function attachDirectionObserver(view: Window | null, viewport: HTMLElement) {
        const MutationObserverConstructor =
            (view as (Window & typeof globalThis) | null)?.MutationObserver ??
            globalThis.MutationObserver;
        if (!MutationObserverConstructor) return;

        directionObserver = new MutationObserverConstructor(positionScheduler.schedule);
        let element: HTMLElement | null = viewport;
        while (element) {
            directionObserver.observe(element, {
                attributes: true,
                attributeFilter: ['class', 'dir', 'style'],
            });
            element = element.parentElement;
        }
    }

    function attachMutationObserver(view: Window | null) {
        const MutationObserverConstructor =
            (view as (Window & typeof globalThis) | null)?.MutationObserver ??
            globalThis.MutationObserver;
        const content = contentRef.value;
        if (!MutationObserverConstructor || !content) return;

        mutationObserver = new MutationObserverConstructor(scheduler.schedule);
        mutationObserver.observe(content, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    function detachObservers() {
        const view = viewportRef.value?.ownerDocument.defaultView;
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        directionObserver?.disconnect();
        resizeObserver = undefined;
        mutationObserver = undefined;
        directionObserver = undefined;
        view?.removeEventListener('resize', scheduler.schedule);
    }

    function isScrollbarVisible(active: boolean, axis: ScrollAxis) {
        if (!active) return false;

        switch (props.type) {
            case 'always':
            case 'auto':
                return true;
            case 'hover':
                return isHovered.value || hasFocusWithin.value || draggingAxis.value === axis;
            case 'scroll':
                return isScrolling.value || draggingAxis.value === axis;
            default:
                return false;
        }
    }

    function showDuringScroll() {
        isScrolling.value = true;
        resetScrollEndTimer();
        scrollEndTimer = setTimeout(() => {
            isScrolling.value = false;
            scrollEndTimer = undefined;
        }, normalizeDelay(props.scrollHideDelay));
    }

    function resetScrollEndTimer() {
        if (scrollEndTimer !== undefined) clearTimeout(scrollEndTimer);
    }

    function onPointerenter() {
        isHovered.value = true;
    }

    function onPointerleave() {
        isHovered.value = false;
    }

    function onFocusin() {
        hasFocusWithin.value = true;
    }

    function onFocusout(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, rootRef.value)) return;
        hasFocusWithin.value = false;
    }

    function onViewportScroll(event: Event) {
        updatePosition();
        showDuringScroll();

        const position = { x: getPosition('x'), y: getPosition('y') };
        const reachedBoundaries = getReachedBoundaries(position);
        previousPosition = position;

        emit('scroll', event);
        emit('scrollPositionChange', { x: metrics.x, y: metrics.y });
        for (const boundary of reachedBoundaries) emitReachedBoundary(boundary, event);
    }

    function getReachedBoundaries(position: ScrollAreaPosition) {
        const boundaries: ScrollBoundary[] = [];

        if (getOverflow('y')) {
            const maxPosition = getMaxPosition('y');
            if (position.y <= 1 && previousPosition.y > 1) boundaries.push('top');
            if (position.y >= maxPosition - 1 && previousPosition.y < maxPosition - 1) {
                boundaries.push('bottom');
            }
        }

        if (getOverflow('x')) {
            const maxPosition = getMaxPosition('x');
            const reachedStart = position.x <= 1 && previousPosition.x > 1;
            const reachedEnd =
                position.x >= maxPosition - 1 && previousPosition.x < maxPosition - 1;

            if (reachedStart || reachedEnd) {
                const rtl = metrics.direction === 'rtl';
                if (reachedStart) boundaries.push(rtl ? 'right' : 'left');
                if (reachedEnd) boundaries.push(rtl ? 'left' : 'right');
            }
        }

        return boundaries;
    }

    function emitReachedBoundary(boundary: ScrollBoundary, event: Event) {
        switch (boundary) {
            case 'top':
                emit('reachTop', event);
                break;
            case 'bottom':
                emit('reachBottom', event);
                break;
            case 'left':
                emit('reachLeft', event);
                break;
            case 'right':
                emit('reachRight', event);
                break;
        }
    }

    function writeAxisPosition(axis: ScrollAxis, value: number) {
        const viewport = viewportRef.value;
        if (!viewport) return;

        if (axis === 'x') {
            viewport.scrollLeft = getRawHorizontalScrollPosition(
                value,
                getMaxPosition('x'),
                metrics.direction,
            );
        } else {
            viewport.scrollTop = clamp(value, 0, getMaxPosition('y'));
        }

        updatePosition();
        showDuringScroll();
    }

    function onScrollbarKeydown(axis: ScrollAxis, event: KeyboardEvent) {
        const viewport = viewportRef.value;
        if (!viewport || !getOverflow(axis)) return;

        updatePosition(viewport);
        const current = getPosition(axis);
        const pageSize = axis === 'x' ? viewport.clientWidth : viewport.clientHeight;
        const nextPosition = getKeyboardScrollPosition({
            axis,
            key: event.key,
            current,
            pageSize,
            maxPosition: getMaxPosition(axis),
            direction: metrics.direction,
            lineStep: keyboardScrollStep,
        });
        if (nextPosition === undefined) return;

        event.preventDefault();
        writeAxisPosition(axis, nextPosition);
    }

    function onScrollbarWheel(axis: ScrollAxis, event: WheelEvent) {
        if (!getOverflow(axis)) return;

        updatePosition();
        const delta = getWheelScrollDelta(axis, event, metrics.direction);
        if (!delta) return;

        event.preventDefault();
        writeAxisPosition(axis, getPosition(axis) + delta);
    }

    function scrollTo(scrollOptions: ScrollToOptions) {
        const viewport = viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollTo === 'function') viewport.scrollTo(scrollOptions);
        else applyFallbackScrollPosition(viewport, scrollOptions, 'absolute');
        positionScheduler.schedule();
    }

    function scrollBy(scrollOptions: ScrollToOptions) {
        const viewport = viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollBy === 'function') viewport.scrollBy(scrollOptions);
        else applyFallbackScrollPosition(viewport, scrollOptions, 'relative');
        positionScheduler.schedule();
    }

    function onScrollbarPointerdown(axis: ScrollAxis, event: PointerEvent) {
        if (event.target !== event.currentTarget || event.button !== 0) return;
        if (!getOverflow(axis)) return;

        updatePosition();
        const scrollbar = event.currentTarget as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement | null;
        const trackRect = scrollbar.getBoundingClientRect();
        const thumbRect = thumb?.getBoundingClientRect();
        const trackStart = axis === 'x' ? trackRect.left : trackRect.top;
        const trackSize = axis === 'x' ? trackRect.width : trackRect.height;
        const thumbSize = thumbRect ? (axis === 'x' ? thumbRect.width : thumbRect.height) : 0;
        const coordinate = getPointerAxisCoordinate(axis, event);
        const travel = Math.max(0, trackSize - thumbSize);
        if (travel === 0) return;

        event.preventDefault();
        const physicalRatio = clamp((coordinate - trackStart - thumbSize / 2) / travel, 0, 1);
        const logicalRatio =
            axis === 'x' && metrics.direction === 'rtl' ? 1 - physicalRatio : physicalRatio;
        writeAxisPosition(axis, logicalRatio * getMaxPosition(axis));
    }

    function onThumbPointerdown(axis: ScrollAxis, event: PointerEvent) {
        if (event.button !== 0 || event.isPrimary === false) return;
        if (!getOverflow(axis)) return;

        updatePosition();
        const scrollbar = getScrollbar(axis);
        const thumb = event.currentTarget as HTMLElement;
        if (!scrollbar) return;

        const trackRect = scrollbar.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        const trackSize = axis === 'x' ? trackRect.width : trackRect.height;
        const thumbSize = axis === 'x' ? thumbRect.width : thumbRect.height;
        const travel = Math.max(0, trackSize - thumbSize);
        if (travel === 0) return;

        event.preventDefault();
        event.stopPropagation();
        stopDragging();
        if (!props.embedded) scrollbar.focus({ preventScroll: true });
        startDragging(axis, event, scrollbar, travel);
    }

    function startDragging(
        axis: ScrollAxis,
        event: PointerEvent,
        scrollbar: HTMLElement,
        travel: number,
    ) {
        const view = scrollbar.ownerDocument.defaultView;
        dragSession = {
            axis,
            pointerId: getPointerId(event),
            startCoordinate: getPointerAxisCoordinate(axis, event),
            startPosition: getPosition(axis),
            maxPosition: getMaxPosition(axis),
            travel,
            coordinateDirection: axis === 'x' && metrics.direction === 'rtl' ? -1 : 1,
            view,
        };
        draggingAxis.value = axis;
        view?.addEventListener('pointermove', onPointermove);
        view?.addEventListener('pointerup', onPointerend);
        view?.addEventListener('pointercancel', onPointerend);
    }

    function onPointermove(event: PointerEvent) {
        const session = dragSession;
        if (!session || !isCurrentPointer(event, session)) return;

        const delta = getPointerAxisCoordinate(session.axis, event) - session.startCoordinate;
        writeAxisPosition(
            session.axis,
            session.startPosition +
                (session.coordinateDirection * delta * session.maxPosition) / session.travel,
        );
    }

    function onPointerend(event: PointerEvent) {
        if (!dragSession || !isCurrentPointer(event, dragSession)) return;
        stopDragging();
    }

    function stopDragging() {
        const view = dragSession?.view;
        view?.removeEventListener('pointermove', onPointermove);
        view?.removeEventListener('pointerup', onPointerend);
        view?.removeEventListener('pointercancel', onPointerend);
        dragSession = undefined;
        draggingAxis.value = null;
    }

    function getScrollbar(axis: ScrollAxis) {
        return axis === 'x' ? horizontalScrollbarRef.value : verticalScrollbarRef.value;
    }

    function getScrollbarAttrs(axis: ScrollAxis) {
        const vertical = axis === 'y';
        const active = vertical ? verticalScrollbarActive.value : horizontalScrollbarActive.value;
        const visible = vertical
            ? verticalScrollbarVisible.value
            : horizontalScrollbarVisible.value;

        return {
            ...getPartAttrs('scrollbar', {
                class: [
                    'rp-scroll-area__scrollbar',
                    `rp-scroll-area__scrollbar--${vertical ? 'vertical' : 'horizontal'}`,
                ],
            }),
            role: 'scrollbar',
            tabindex: !props.embedded && active ? 0 : -1,
            'aria-controls': viewportRef.value?.id || undefined,
            'aria-orientation': (vertical ? 'vertical' : 'horizontal') as ScrollAreaOrientation,
            'aria-valuemin': 0,
            'aria-valuemax': getMaxPosition(axis),
            'aria-valuenow': Math.round(getPosition(axis)),
            'aria-disabled': !getOverflow(axis) || undefined,
            'aria-hidden': props.embedded || !active || undefined,
            'data-orientation': vertical ? 'vertical' : 'horizontal',
            'data-direction': metrics.direction,
            'data-active': toPresenceAttribute(active),
            'data-visible': toPresenceAttribute(visible),
        };
    }

    function getThumbAttrs(axis: ScrollAxis) {
        const horizontal = axis === 'x';
        return getPartAttrs('thumb', {
            class: 'rp-scroll-area__thumb',
            style: {
                '--_rp-scroll-area-thumb-size': `${
                    horizontal ? metrics.horizontalThumbSize : metrics.verticalThumbSize
                }%`,
                '--_rp-scroll-area-thumb-offset': `${
                    horizontal ? metrics.horizontalThumbOffset : metrics.verticalThumbOffset
                }%`,
            },
        });
    }

    watch(
        [
            horizontalScrollbarActive,
            verticalScrollbarActive,
            renderHorizontalScrollbar,
            renderVerticalScrollbar,
        ],
        () => void nextTick(scheduler.schedule),
    );
    watch(
        () => props.scrollHideDelay,
        () => {
            if (isScrolling.value) showDuringScroll();
        },
    );

    onMounted(() => {
        attachObservers();
        void nextTick(scheduler.schedule);
    });
    onBeforeUnmount(() => {
        detachObservers();
        scheduler.cancel();
        positionScheduler.cancel();
        resetScrollEndTimer();
        stopDragging();
    });

    return {
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
    };
}

function isAxisEnabled(scrollbars: ScrollAreaScrollbars | false | undefined, axis: ScrollAxis) {
    if (scrollbars === false) return false;
    if (axis === 'x') return scrollbars === 'x' || scrollbars === 'both';
    return scrollbars === 'y' || scrollbars === 'both';
}

function isScrollbarActive(type: ScrollAreaType, enabled: boolean, overflowing: boolean) {
    if (!enabled || type === 'never') return false;
    return type === 'always' || overflowing;
}

function isCurrentPointer(event: PointerEvent, session: DragSession) {
    return session.pointerId === undefined || event.pointerId === session.pointerId;
}

function normalizeDelay(delay: number | undefined) {
    return Number.isFinite(delay) ? Math.max(0, delay ?? 0) : 0;
}

function getRootStyle(scrollbarSize: number | string | undefined): CSSProperties {
    const length = getLengthValue(scrollbarSize);
    return length ? { '--_rp-scroll-area-scrollbar-size': length } : {};
}

function getLengthValue(value: number | string | undefined) {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? `${value}px` : '';
    return value?.trim() ?? '';
}

function hasAccessibleName(props: Readonly<ScrollAreaProps>, attrs: HTMLAttributes) {
    return Boolean(
        props.ariaLabel || props.ariaLabelledby || attrs['aria-label'] || attrs['aria-labelledby'],
    );
}
