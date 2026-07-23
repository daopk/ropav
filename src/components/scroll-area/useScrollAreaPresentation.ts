import { computed, useId, type CSSProperties, type HTMLAttributes } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { getLengthValue, type ScrollAxis } from './scrollAreaModel';
import type { ScrollAreaController } from './useScrollArea';
import type {
    ScrollAreaOrientation,
    ScrollAreaPart,
    ScrollAreaProps,
    ScrollAreaSlotProps,
} from './types';

export function useScrollAreaPresentation(
    props: Readonly<ScrollAreaProps>,
    scrollArea: ScrollAreaController,
) {
    const generatedId = useId();
    const viewportId = computed(() => `${props.id || generatedId}-viewport`);
    const { getPartAttrs, getRootAttrs } = useStylesApi<ScrollAreaPart>(props, 'root');

    const rootAttrs = computed(() =>
        getRootAttrs({
            id: props.id,
            class: 'rp-scroll-area',
            style: getRootStyle(props.scrollbarSize),
            'data-type': props.type,
            'data-direction': scrollArea.metrics.direction,
            'data-scrollbars': props.scrollbars === false ? 'none' : props.scrollbars,
            'data-overflow-x': toPresenceAttribute(scrollArea.metrics.overflowX),
            'data-overflow-y': toPresenceAttribute(scrollArea.metrics.overflowY),
            'data-scrollbar-x-active': toPresenceAttribute(
                scrollArea.horizontalScrollbarActive.value,
            ),
            'data-scrollbar-y-active': toPresenceAttribute(
                scrollArea.verticalScrollbarActive.value,
            ),
            'data-scrollbar-x-visible': toPresenceAttribute(
                scrollArea.horizontalScrollbarVisible.value,
            ),
            'data-scrollbar-y-visible': toPresenceAttribute(
                scrollArea.verticalScrollbarVisible.value,
            ),
            onPointerenter: scrollArea.onPointerenter,
            onPointerleave: scrollArea.onPointerleave,
            onFocusin: scrollArea.onFocusin,
            onFocusout: scrollArea.onFocusout,
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
                scrollArea.onViewportScroll(event);
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
        'data-direction': scrollArea.metrics.direction,
        'data-visible': toPresenceAttribute(
            scrollArea.horizontalScrollbarActive.value && scrollArea.verticalScrollbarActive.value,
        ),
    }));
    const slotProps = computed<ScrollAreaSlotProps>(() => ({
        position: scrollArea.position.value,
        overflowX: scrollArea.metrics.overflowX,
        overflowY: scrollArea.metrics.overflowY,
        scrollTo: scrollArea.scrollTo,
        scrollBy: scrollArea.scrollBy,
        update: scrollArea.update,
    }));

    function getScrollbarAttrs(axis: ScrollAxis) {
        const vertical = axis === 'y';
        const active = vertical
            ? scrollArea.verticalScrollbarActive.value
            : scrollArea.horizontalScrollbarActive.value;
        const visible = vertical
            ? scrollArea.verticalScrollbarVisible.value
            : scrollArea.horizontalScrollbarVisible.value;

        return {
            ...getPartAttrs('scrollbar', {
                class: [
                    'rp-scroll-area__scrollbar',
                    `rp-scroll-area__scrollbar--${vertical ? 'vertical' : 'horizontal'}`,
                ],
            }),
            role: 'scrollbar',
            tabindex: !props.embedded && active ? 0 : -1,
            'aria-controls': scrollArea.viewportRef.value?.id || undefined,
            'aria-orientation': (vertical ? 'vertical' : 'horizontal') as ScrollAreaOrientation,
            'aria-valuemin': 0,
            'aria-valuemax': scrollArea.getMaxPosition(axis),
            'aria-valuenow': Math.round(scrollArea.getPosition(axis)),
            'aria-disabled': !scrollArea.getOverflow(axis) || undefined,
            'aria-hidden': props.embedded || !active || undefined,
            'data-orientation': vertical ? 'vertical' : 'horizontal',
            'data-direction': scrollArea.metrics.direction,
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
                    horizontal
                        ? scrollArea.metrics.horizontalThumbSize
                        : scrollArea.metrics.verticalThumbSize
                }%`,
                '--_rp-scroll-area-thumb-offset': `${
                    horizontal
                        ? scrollArea.metrics.horizontalThumbOffset
                        : scrollArea.metrics.verticalThumbOffset
                }%`,
            },
        });
    }

    return {
        rootAttrs,
        viewportAttrs,
        contentAttrs,
        horizontalScrollbarAttrs,
        verticalScrollbarAttrs,
        horizontalThumbAttrs,
        verticalThumbAttrs,
        cornerAttrs,
        slotProps,
    };
}

function getRootStyle(scrollbarSize: number | string | undefined): CSSProperties {
    const length = getLengthValue(scrollbarSize);
    return length ? { '--_rp-scroll-area-scrollbar-size': length } : {};
}

function hasAccessibleName(props: Readonly<ScrollAreaProps>, attrs: HTMLAttributes) {
    return Boolean(
        props.ariaLabel || props.ariaLabelledby || attrs['aria-label'] || attrs['aria-labelledby'],
    );
}
