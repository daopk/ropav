import {
    computed,
    inject,
    provide,
    toValue,
    type ComputedRef,
    type InjectionKey,
    type MaybeRefOrGetter,
} from 'vue';
import { useParentOverlayLayer } from '@/internal/composables/useOverlayLayer';
import type { UseOverlayZIndexOptions } from './types';

interface OverlayZIndexContext {
    baseZIndex: ComputedRef<number>;
}

const overlayZIndexKey = Symbol('overlay-z-index') as InjectionKey<OverlayZIndexContext>;

export function provideOverlayZIndex(baseZIndex: MaybeRefOrGetter<number>) {
    const resolvedBaseZIndex = computed(() => toValue(baseZIndex));
    provide(overlayZIndexKey, { baseZIndex: resolvedBaseZIndex });
    return resolvedBaseZIndex;
}

export function useOverlayZIndex(options: UseOverlayZIndexOptions = {}): ComputedRef<number> {
    const provided = inject(overlayZIndexKey, null);
    const parentLayer = useParentOverlayLayer();

    return computed(() => {
        const baseZIndex =
            toValue(options.baseZIndex) ??
            provided?.baseZIndex.value ??
            options.defaultBaseZIndex ??
            1000;
        const resolvedZIndex = baseZIndex + (toValue(options.offset) ?? 0);

        if (toValue(options.aboveParent) === false || !parentLayer) return resolvedZIndex;
        return Math.max(resolvedZIndex, parentLayer.zIndex.value + 1);
    });
}
