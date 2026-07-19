import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { isScrollbarActive, type ScrollAxis } from './scrollAreaCore';
import type { ScrollAreaProps } from './types';

interface UseScrollAreaVisibilityOptions {
    props: Readonly<ScrollAreaProps>;
    rootRef: Ref<HTMLElement | null>;
    horizontalEnabled: Readonly<Ref<boolean>>;
    verticalEnabled: Readonly<Ref<boolean>>;
    overflowX: () => boolean;
    overflowY: () => boolean;
}

export function useScrollAreaVisibility(options: UseScrollAreaVisibilityOptions) {
    const isHovered = ref(false);
    const hasFocusWithin = ref(false);
    const isScrolling = ref(false);
    const draggingAxis = ref<ScrollAxis | null>(null);

    let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

    const renderHorizontalScrollbar = computed(
        () => options.horizontalEnabled.value && options.props.type !== 'never',
    );
    const renderVerticalScrollbar = computed(
        () => options.verticalEnabled.value && options.props.type !== 'never',
    );
    const horizontalScrollbarActive = computed(() =>
        isScrollbarActive(
            options.props.type ?? 'hover',
            options.horizontalEnabled.value,
            options.overflowX(),
        ),
    );
    const verticalScrollbarActive = computed(() =>
        isScrollbarActive(
            options.props.type ?? 'hover',
            options.verticalEnabled.value,
            options.overflowY(),
        ),
    );
    const horizontalScrollbarVisible = computed(() =>
        isVisible(horizontalScrollbarActive.value, 'x'),
    );
    const verticalScrollbarVisible = computed(() => isVisible(verticalScrollbarActive.value, 'y'));

    function isVisible(active: boolean, axis: ScrollAxis) {
        if (!active) return false;

        switch (options.props.type) {
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
        }, normalizeDelay(options.props.scrollHideDelay));
    }

    function setDraggingAxis(axis: ScrollAxis | null) {
        draggingAxis.value = axis;
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
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && options.rootRef.value?.contains(nextTarget)) return;
        hasFocusWithin.value = false;
    }

    function resetScrollEndTimer() {
        if (scrollEndTimer !== undefined) clearTimeout(scrollEndTimer);
    }

    watch(
        () => options.props.scrollHideDelay,
        () => {
            if (isScrolling.value) showDuringScroll();
        },
    );

    onBeforeUnmount(resetScrollEndTimer);

    return {
        renderHorizontalScrollbar,
        renderVerticalScrollbar,
        horizontalScrollbarActive,
        verticalScrollbarActive,
        horizontalScrollbarVisible,
        verticalScrollbarVisible,
        showDuringScroll,
        setDraggingAxis,
        onPointerenter,
        onPointerleave,
        onFocusin,
        onFocusout,
    };
}

function normalizeDelay(delay: number | undefined) {
    return Number.isFinite(delay) ? Math.max(0, delay ?? 0) : 0;
}

export type ScrollAreaVisibilityController = ReturnType<typeof useScrollAreaVisibility>;
