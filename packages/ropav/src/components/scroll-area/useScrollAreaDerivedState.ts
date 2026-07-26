import { computed } from 'vue';
import {
    isScrollAreaAxisEnabled,
    isScrollAreaScrollbarActive,
    type ScrollAreaMetrics,
} from './scrollAreaModel';
import type { ScrollAreaProps } from './types';

export function useScrollAreaDerivedState(
    props: Readonly<ScrollAreaProps>,
    metrics: ScrollAreaMetrics,
) {
    const renderHorizontalScrollbar = computed(
        () => isScrollAreaAxisEnabled(props.scrollbars, 'x') && props.type !== 'never',
    );
    const renderVerticalScrollbar = computed(
        () => isScrollAreaAxisEnabled(props.scrollbars, 'y') && props.type !== 'never',
    );
    const horizontalScrollbarActive = computed(() =>
        isScrollAreaScrollbarActive(
            props.type ?? 'hover',
            isScrollAreaAxisEnabled(props.scrollbars, 'x'),
            metrics.overflowX,
        ),
    );
    const verticalScrollbarActive = computed(() =>
        isScrollAreaScrollbarActive(
            props.type ?? 'hover',
            isScrollAreaAxisEnabled(props.scrollbars, 'y'),
            metrics.overflowY,
        ),
    );

    return {
        horizontalScrollbarActive,
        renderHorizontalScrollbar,
        renderVerticalScrollbar,
        verticalScrollbarActive,
    };
}
