import { onBeforeUnmount, type MaybeRefOrGetter, type Ref } from 'vue';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { useHoverDisclosureWithExternalDismissal } from '../floating/useHoverDisclosure';
import type { UseHoverDisclosureOptions } from '../floating/types';

interface HoverCardDisclosureLayerOptions {
    baseZIndex: MaybeRefOrGetter<number>;
    element: Ref<HTMLElement | null>;
    inside: MaybeRefOrGetter<readonly (Element | null | undefined)[]>;
}

export function useHoverCardDisclosure(
    options: Readonly<UseHoverDisclosureOptions>,
    layerOptions: HoverCardDisclosureLayerOptions,
) {
    const { disclosure, dismissalHandlers } = useHoverDisclosureWithExternalDismissal(options);
    const layer = useOverlayLayer({
        active: disclosure.isOpen,
        baseZIndex: layerOptions.baseZIndex,
        element: layerOptions.element,
    });
    const disconnect = layer.connectInteraction({
        inside: layerOptions.inside,
        escapeKeyDown: dismissalHandlers.escapeKeyDown,
        pointerDownOutside: dismissalHandlers.pointerDownOutside,
    });

    onBeforeUnmount(disconnect);
    return {
        ...disclosure,
        zIndex: layer.zIndex,
    };
}
