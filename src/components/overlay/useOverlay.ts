import { computed, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import type { OverlayProps } from './types';

function getBlurValue(blur: OverlayProps['blur']) {
    if (blur == null || blur === '') return undefined;

    if (typeof blur === 'number') {
        if (!Number.isFinite(blur) || blur < 0) return undefined;

        return `${blur}px`;
    }

    return blur;
}

export function useOverlay(props: Readonly<OverlayProps>) {
    const isRendered = computed(() => !props.disabled);
    const hasGradient = computed(() => Boolean(props.gradient));

    const normalizedOpacity = computed(() => {
        const opacity = props.opacity;
        if (opacity === undefined || !Number.isFinite(opacity)) return 1;

        return Math.min(1, Math.max(0, opacity));
    });

    const blurValue = computed(() => getBlurValue(props.blur));
    const hasBlur = computed(() => Boolean(blurValue.value));

    const rootClass = computed(() =>
        bem('rp-overlay', {
            gradient: hasGradient.value,
            blurred: hasBlur.value,
            interactive: props.interactive,
        }),
    );

    const rootStyle = computed<CSSProperties>(() => {
        const style: CSSProperties = {
            '--_rp-overlay-z-index': props.zIndex,
        };

        if (blurValue.value) {
            style['--_rp-overlay-blur'] = blurValue.value;
        }

        if (hasGradient.value) {
            return {
                ...style,
                backgroundImage: props.gradient,
            };
        }

        return {
            ...style,
            '--_rp-overlay-color': props.color,
            '--_rp-overlay-opacity': normalizedOpacity.value,
        };
    });

    return {
        isRendered,
        rootClass,
        rootStyle,
    };
}
