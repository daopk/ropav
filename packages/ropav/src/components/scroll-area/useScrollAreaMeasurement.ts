import { nextTick, onBeforeUnmount, onMounted, reactive, type Ref } from 'vue';
import {
    getLogicalHorizontalScrollPosition,
    getScrollDirection,
    getScrollThumbGeometry,
    getScrollThumbOffset,
    type ScrollAxis,
} from '@/utils/dom/scroll';
import { clamp } from '@/utils/number';
import { createRafScheduler } from '@/utils/rafScheduler';
import { createScrollAreaMetrics, getScrollAreaMaxPosition } from './scrollAreaModel';

interface ScrollAreaMeasurementElements {
    content: Ref<HTMLElement | null>;
    horizontalScrollbar: Ref<HTMLElement | null>;
    verticalScrollbar: Ref<HTMLElement | null>;
    viewport: Ref<HTMLElement | null>;
}

interface UseScrollAreaMeasurementOptions {
    elements: ScrollAreaMeasurementElements;
    isAxisEnabled: (axis: ScrollAxis) => boolean;
    minimumThumbSize: number;
}

export function useScrollAreaMeasurement({
    elements,
    isAxisEnabled,
    minimumThumbSize,
}: UseScrollAreaMeasurementOptions) {
    const metrics = reactive(createScrollAreaMetrics());
    let resizeObserver: ResizeObserver | undefined;
    let contentObserver: MutationObserver | undefined;
    let directionObserver: MutationObserver | undefined;
    let observerView: (Window & typeof globalThis) | null | undefined;
    let horizontalThumbSizeRatio = 1;
    let verticalThumbSizeRatio = 1;

    const updateScheduler = createRafScheduler(
        update,
        () => elements.viewport.value?.ownerDocument.defaultView,
    );
    const positionScheduler = createRafScheduler(
        updatePosition,
        () => elements.viewport.value?.ownerDocument.defaultView,
    );

    function update() {
        const viewport = elements.viewport.value;
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
        metrics.overflowX = isAxisEnabled('x') && viewport.scrollWidth > viewport.clientWidth + 1;
        metrics.overflowY = isAxisEnabled('y') && viewport.scrollHeight > viewport.clientHeight + 1;
    }

    function updateThumbGeometry(viewport: HTMLElement) {
        const horizontalGeometry = getScrollThumbGeometry(
            elements.horizontalScrollbar.value?.clientWidth ?? viewport.clientWidth,
            viewport.clientWidth,
            viewport.scrollWidth,
            minimumThumbSize,
        );
        const verticalGeometry = getScrollThumbGeometry(
            elements.verticalScrollbar.value?.clientHeight ?? viewport.clientHeight,
            viewport.clientHeight,
            viewport.scrollHeight,
            minimumThumbSize,
        );

        metrics.horizontalThumbSize = horizontalGeometry.size;
        horizontalThumbSizeRatio = horizontalGeometry.offsetRatio;
        metrics.verticalThumbSize = verticalGeometry.size;
        verticalThumbSizeRatio = verticalGeometry.offsetRatio;
    }

    function updatePosition(viewport = elements.viewport.value) {
        if (!viewport) return;

        metrics.direction = getScrollDirection(viewport);
        metrics.x = getLogicalHorizontalScrollPosition(
            viewport.scrollLeft,
            getScrollAreaMaxPosition(metrics, 'x'),
            metrics.direction,
        );
        metrics.y = clamp(viewport.scrollTop, 0, getScrollAreaMaxPosition(metrics, 'y'));
        metrics.horizontalThumbOffset = getScrollThumbOffset(
            metrics.x,
            getScrollAreaMaxPosition(metrics, 'x'),
            horizontalThumbSizeRatio,
        );
        metrics.verticalThumbOffset = getScrollThumbOffset(
            metrics.y,
            getScrollAreaMaxPosition(metrics, 'y'),
            verticalThumbSizeRatio,
        );
    }

    function attachObservers() {
        const viewport = elements.viewport.value;
        if (!viewport) return;

        observerView = viewport.ownerDocument.defaultView;
        const ResizeObserverConstructor = observerView?.ResizeObserver ?? globalThis.ResizeObserver;
        if (ResizeObserverConstructor) {
            const observer = new ResizeObserverConstructor(updateScheduler.schedule);
            observer.observe(viewport);
            if (elements.content.value) observer.observe(elements.content.value);
            resizeObserver = observer;
        } else {
            attachContentObserver(observerView);
        }
        attachDirectionObserver(observerView, viewport);
        observerView?.addEventListener('resize', updateScheduler.schedule);
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

    function attachContentObserver(view: Window | null) {
        const MutationObserverConstructor =
            (view as (Window & typeof globalThis) | null)?.MutationObserver ??
            globalThis.MutationObserver;
        const content = elements.content.value;
        if (!MutationObserverConstructor || !content) return;

        contentObserver = new MutationObserverConstructor(updateScheduler.schedule);
        contentObserver.observe(content, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    function detachObservers() {
        resizeObserver?.disconnect();
        contentObserver?.disconnect();
        directionObserver?.disconnect();
        resizeObserver = undefined;
        contentObserver = undefined;
        directionObserver = undefined;
        observerView?.removeEventListener('resize', updateScheduler.schedule);
        observerView = undefined;
    }

    onMounted(() => {
        attachObservers();
        void nextTick(updateScheduler.schedule);
    });
    onBeforeUnmount(() => {
        detachObservers();
        updateScheduler.cancel();
        positionScheduler.cancel();
    });

    return {
        metrics,
        schedulePositionUpdate: positionScheduler.schedule,
        scheduleUpdate: updateScheduler.schedule,
        update,
        updatePosition,
    };
}
