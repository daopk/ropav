import { computed, type CSSProperties } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import { getValuePercent } from '@/utils/number';
import {
    formatProgressValue,
    getProgressAriaValueText,
    normalizeProgressBounds,
    normalizeProgressValue,
} from './progressModel';
import type { ProgressProps } from './types';

type ProgressStateProps = Readonly<
    ProgressProps & {
        min: number;
        max: number;
        indeterminate: boolean;
        showValue: boolean;
    }
>;

export function useProgress(props: ProgressStateProps) {
    const control = useControlState(props);

    const bounds = computed(() => normalizeProgressBounds(props.min, props.max));
    const isIndeterminate = computed(() => props.indeterminate || props.value == null);
    const normalizedValue = computed(() =>
        normalizeProgressValue(props.value, bounds.value.min, bounds.value.max),
    );
    const valuePercent = computed(() =>
        getValuePercent(normalizedValue.value, bounds.value.min, bounds.value.max),
    );
    const formattedValue = computed(() =>
        formatProgressValue(normalizedValue.value, valuePercent.value, props.formatValue),
    );
    const ariaValueText = computed(() =>
        isIndeterminate.value
            ? undefined
            : getProgressAriaValueText(
                  normalizedValue.value,
                  valuePercent.value,
                  props.ariaValueText,
                  props.formatValue,
              ),
    );
    const rootClass = computed(() =>
        bem('rp-progress', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            indeterminate: isIndeterminate.value,
        }),
    );
    const rootStyle = computed<CSSProperties>(() => {
        const style: CSSProperties = {
            '--_rp-progress-value': `${valuePercent.value}%`,
            '--_rp-progress-ratio': `${valuePercent.value / 100}`,
        };

        const colorValue = getComponentColorValue(props.color);
        if (colorValue) {
            style['--_rp-progress-color'] = colorValue;
        }

        return style;
    });

    return {
        control,
        rootClass,
        rootStyle,
        isIndeterminate,
        normalizedValue,
        valuePercent,
        formattedValue,
        ariaValueText,
        ariaValueMin: computed(() => (isIndeterminate.value ? undefined : bounds.value.min)),
        ariaValueMax: computed(() => (isIndeterminate.value ? undefined : bounds.value.max)),
        ariaValueNow: computed(() => (isIndeterminate.value ? undefined : normalizedValue.value)),
    };
}
