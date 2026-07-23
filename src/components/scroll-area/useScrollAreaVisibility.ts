import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { isNodeWithinElement } from '@/utils/dom/events';
import type { ScrollAxis } from '@/utils/dom/scroll';
import { normalizeDelay } from '@/utils/number';
import { isScrollAreaScrollbarVisible } from './scrollAreaModel';
import type { ScrollAreaType } from './types';

interface UseScrollAreaVisibilityOptions {
    getHideDelay: () => number | undefined;
    getType: () => ScrollAreaType;
    isScrollbarActive: (axis: ScrollAxis) => boolean;
    root: Ref<HTMLElement | null>;
}

export function useScrollAreaVisibility(options: UseScrollAreaVisibilityOptions) {
    const hovered = ref(false);
    const focusWithin = ref(false);
    const scrolling = ref(false);
    const draggingAxis = ref<ScrollAxis | null>(null);
    let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

    const horizontalVisible = computed(() => isVisible('x'));
    const verticalVisible = computed(() => isVisible('y'));
    const rootHandlers = {
        onPointerenter() {
            hovered.value = true;
        },
        onPointerleave() {
            hovered.value = false;
        },
        onFocusin() {
            focusWithin.value = true;
        },
        onFocusout(event: FocusEvent) {
            if (isNodeWithinElement(event.relatedTarget, options.root.value)) return;
            focusWithin.value = false;
        },
    };

    function isVisible(axis: ScrollAxis) {
        return isScrollAreaScrollbarVisible({
            active: options.isScrollbarActive(axis),
            axis,
            draggingAxis: draggingAxis.value,
            focusWithin: focusWithin.value,
            hovered: hovered.value,
            scrolling: scrolling.value,
            type: options.getType(),
        });
    }

    function showDuringScroll() {
        scrolling.value = true;
        clearScrollEndTimer();
        scrollEndTimer = setTimeout(() => {
            scrolling.value = false;
            scrollEndTimer = undefined;
        }, normalizeDelay(options.getHideDelay()));
    }

    function clearScrollEndTimer() {
        if (scrollEndTimer === undefined) return;
        clearTimeout(scrollEndTimer);
        scrollEndTimer = undefined;
    }

    function setDraggingAxis(axis: ScrollAxis | null) {
        draggingAxis.value = axis;
    }

    watch(options.getHideDelay, () => {
        if (scrolling.value) showDuringScroll();
    });
    onBeforeUnmount(clearScrollEndTimer);

    return {
        horizontalVisible,
        rootHandlers,
        setDraggingAxis,
        showDuringScroll,
        verticalVisible,
    };
}
