import { computed, nextTick, onBeforeUnmount, onMounted, reactive, type Ref } from 'vue';
import { createRafScheduler } from '@/utils/rafScheduler';
import {
    clamp,
    getThumbGeometry,
    getThumbOffset,
    type ScrollAreaMetrics,
    type ScrollAxis,
} from './scrollAreaCore';
import type { ScrollAreaPosition } from './types';

interface UseScrollAreaMetricsOptions {
    viewportRef: Ref<HTMLElement | null>;
    contentRef: Ref<HTMLElement | null>;
    horizontalScrollbarRef: Ref<HTMLElement | null>;
    verticalScrollbarRef: Ref<HTMLElement | null>;
    horizontalEnabled: Readonly<Ref<boolean>>;
    verticalEnabled: Readonly<Ref<boolean>>;
}

export function useScrollAreaMetrics(options: UseScrollAreaMetricsOptions) {
    const metrics = reactive<ScrollAreaMetrics>({
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
    const position = computed<ScrollAreaPosition>(() => ({ x: metrics.x, y: metrics.y }));

    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;

    const scheduler = createRafScheduler(
        update,
        () => options.viewportRef.value?.ownerDocument.defaultView,
    );

    function update() {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        readViewportMetrics(viewport);
        updateThumbMetrics(viewport);
    }

    function readViewportMetrics(viewport: HTMLElement) {
        metrics.clientWidth = viewport.clientWidth;
        metrics.clientHeight = viewport.clientHeight;
        metrics.scrollWidth = viewport.scrollWidth;
        metrics.scrollHeight = viewport.scrollHeight;
        metrics.x = viewport.scrollLeft;
        metrics.y = viewport.scrollTop;
        metrics.overflowX =
            options.horizontalEnabled.value && viewport.scrollWidth > viewport.clientWidth + 1;
        metrics.overflowY =
            options.verticalEnabled.value && viewport.scrollHeight > viewport.clientHeight + 1;
    }

    function updateThumbMetrics(viewport: HTMLElement) {
        const horizontalGeometry = getThumbGeometry(
            options.horizontalScrollbarRef.value?.clientWidth ?? viewport.clientWidth,
            viewport.clientWidth,
            viewport.scrollWidth,
        );
        const verticalGeometry = getThumbGeometry(
            options.verticalScrollbarRef.value?.clientHeight ?? viewport.clientHeight,
            viewport.clientHeight,
            viewport.scrollHeight,
        );

        metrics.horizontalThumbSize = horizontalGeometry.size;
        metrics.horizontalThumbOffset = getThumbOffset(
            clamp(Math.abs(viewport.scrollLeft), 0, getMaxPosition('x')),
            getMaxPosition('x'),
            horizontalGeometry.offsetRatio,
        );
        metrics.verticalThumbSize = verticalGeometry.size;
        metrics.verticalThumbOffset = getThumbOffset(
            clamp(viewport.scrollTop, 0, getMaxPosition('y')),
            getMaxPosition('y'),
            verticalGeometry.offsetRatio,
        );
    }

    function getPosition(axis: ScrollAxis) {
        return axis === 'x' ? Math.abs(metrics.x) : metrics.y;
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
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        const view = viewport.ownerDocument.defaultView;
        const ResizeObserverConstructor = view?.ResizeObserver ?? globalThis.ResizeObserver;
        if (ResizeObserverConstructor) {
            resizeObserver = new ResizeObserverConstructor(scheduler.schedule);
            resizeObserver.observe(viewport);
            if (options.contentRef.value) resizeObserver.observe(options.contentRef.value);
        } else {
            attachMutationObserver(view);
        }
        view?.addEventListener('resize', scheduler.schedule);
    }

    function attachMutationObserver(view: Window | null) {
        const MutationObserverConstructor =
            (view as (Window & typeof globalThis) | null)?.MutationObserver ??
            globalThis.MutationObserver;
        const content = options.contentRef.value;
        if (!MutationObserverConstructor || !content) return;

        const observer = new MutationObserverConstructor(scheduler.schedule);
        mutationObserver = observer;
        observer.observe(content, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    function detachObservers() {
        const view = options.viewportRef.value?.ownerDocument.defaultView;
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        resizeObserver = undefined;
        mutationObserver = undefined;
        view?.removeEventListener('resize', scheduler.schedule);
    }

    onMounted(() => {
        attachObservers();
        void nextTick(scheduler.schedule);
    });

    onBeforeUnmount(() => {
        detachObservers();
        scheduler.cancel();
    });

    return {
        metrics,
        position,
        update,
        scheduleUpdate: scheduler.schedule,
        getPosition,
        getMaxPosition,
        getOverflow,
    };
}

export type ScrollAreaMetricsController = ReturnType<typeof useScrollAreaMetrics>;
