import { computed, useId, type HTMLAttributes, type Ref } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import type { ScrollAxis } from '@/utils/dom/scroll';
import {
    getScrollAreaAxisPosition,
    getScrollAreaMaxPosition,
    getScrollAreaOverflow,
    getScrollAreaRootStyle,
    type ScrollAreaMetrics,
} from './scrollAreaModel';
import type { ScrollAreaOrientation, ScrollAreaPart, ScrollAreaProps } from './types';

interface ScrollAreaRootHandlers {
    onFocusin: () => void;
    onFocusout: (event: FocusEvent) => void;
    onPointerenter: () => void;
    onPointerleave: () => void;
}

interface ScrollAreaAttributeState {
    horizontalActive: Readonly<Ref<boolean>>;
    horizontalVisible: Readonly<Ref<boolean>>;
    verticalActive: Readonly<Ref<boolean>>;
    verticalVisible: Readonly<Ref<boolean>>;
}

interface UseScrollAreaAttributesOptions {
    metrics: ScrollAreaMetrics;
    onViewportScroll: (event: Event) => void;
    props: Readonly<ScrollAreaProps>;
    rootHandlers: ScrollAreaRootHandlers;
    state: ScrollAreaAttributeState;
    viewport: Ref<HTMLElement | null>;
}

export function useScrollAreaAttributes({
    metrics,
    onViewportScroll,
    props,
    rootHandlers,
    state,
    viewport,
}: UseScrollAreaAttributesOptions) {
    const generatedId = useId();
    const viewportId = computed(() => `${props.id || generatedId}-viewport`);
    const { getPartAttrs, getRootAttrs } = useStylesApi<ScrollAreaPart>(props, 'root');
    const rootAttrs = computed(() =>
        getRootAttrs({
            id: props.id,
            class: 'rp-scroll-area',
            style: getScrollAreaRootStyle(props.scrollbarSize),
            'data-type': props.type,
            'data-direction': metrics.direction,
            'data-scrollbars': props.scrollbars === false ? 'none' : props.scrollbars,
            'data-overflow-x': toPresenceAttribute(metrics.overflowX),
            'data-overflow-y': toPresenceAttribute(metrics.overflowY),
            'data-scrollbar-x-active': toPresenceAttribute(state.horizontalActive.value),
            'data-scrollbar-y-active': toPresenceAttribute(state.verticalActive.value),
            'data-scrollbar-x-visible': toPresenceAttribute(state.horizontalVisible.value),
            'data-scrollbar-y-visible': toPresenceAttribute(state.verticalVisible.value),
            ...rootHandlers,
        }),
    );
    const viewportAttrs = computed<HTMLAttributes>(() => {
        const compatibilityAttrs = props.viewportAttrs ?? {};
        const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
            splitCompatibilityAttributes(compatibilityAttrs);

        return {
            ...forwardedAttributes,
            ...getPartAttrs('viewport', {
                class: 'rp-scroll-area__viewport',
                compatibilityClass,
                compatibilityStyle,
            }),
            id: viewportId.value,
            role:
                forwardedAttributes.role ??
                (hasAccessibleName(props, forwardedAttributes) ? 'region' : undefined),
            tabindex: forwardedAttributes.tabindex ?? 0,
            'aria-label': props.ariaLabel || forwardedAttributes['aria-label'] || undefined,
            'aria-labelledby':
                props.ariaLabelledby || forwardedAttributes['aria-labelledby'] || undefined,
            'aria-describedby':
                props.ariaDescribedby || forwardedAttributes['aria-describedby'] || undefined,
            onScroll: composeEventHandlers(onViewportScroll, compatibilityAttrs.onScroll),
        };
    });
    const contentAttrs = computed<HTMLAttributes>(() => {
        const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
            splitCompatibilityAttributes(props.contentAttrs ?? {});

        return {
            ...forwardedAttributes,
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
            state.horizontalActive.value && state.verticalActive.value,
        ),
    }));

    function getScrollbarAttrs(axis: ScrollAxis) {
        const vertical = axis === 'y';
        const active = vertical ? state.verticalActive.value : state.horizontalActive.value;
        const visible = vertical ? state.verticalVisible.value : state.horizontalVisible.value;

        return {
            ...getPartAttrs('scrollbar', {
                class: [
                    'rp-scroll-area__scrollbar',
                    `rp-scroll-area__scrollbar--${vertical ? 'vertical' : 'horizontal'}`,
                ],
            }),
            role: 'scrollbar',
            tabindex: !props.embedded && active ? 0 : -1,
            'aria-controls': viewport.value?.id || undefined,
            'aria-orientation': (vertical ? 'vertical' : 'horizontal') as ScrollAreaOrientation,
            'aria-valuemin': 0,
            'aria-valuemax': getScrollAreaMaxPosition(metrics, axis),
            'aria-valuenow': Math.round(getScrollAreaAxisPosition(metrics, axis)),
            'aria-disabled': !getScrollAreaOverflow(metrics, axis) || undefined,
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

    return {
        contentAttrs,
        cornerAttrs,
        horizontalScrollbarAttrs,
        horizontalThumbAttrs,
        rootAttrs,
        verticalScrollbarAttrs,
        verticalThumbAttrs,
        viewportAttrs,
    };
}

function hasAccessibleName(props: Readonly<ScrollAreaProps>, attrs: HTMLAttributes) {
    return Boolean(
        props.ariaLabel || props.ariaLabelledby || attrs['aria-label'] || attrs['aria-labelledby'],
    );
}
