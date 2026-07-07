import { computed, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import { getComponentCustomColor, isComponentPresetColor } from '@/utils/componentColors';
import type { ProgressProps } from './types';

type ProgressStateProps = Readonly<
    ProgressProps & {
        min: number;
        max: number;
        indeterminate: boolean;
        showValue: boolean;
    }
>;

export function normalizeProgressBounds(min: number, max: number) {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : 100;

    return safeMax >= safeMin ? { min: safeMin, max: safeMax } : { min: safeMax, max: safeMin };
}

export function normalizeProgressValue(value: number | null | undefined, min: number, max: number) {
    const safeValue = Number.isFinite(value) ? Number(value) : min;

    return Math.min(max, Math.max(min, safeValue));
}

export function getProgressValuePercent(value: number, min: number, max: number) {
    if (max <= min) return 0;

    const percent = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, percent));
}

function getFormattedProgressValue(
    value: number,
    percent: number,
    formatter: ProgressProps['formatValue'],
) {
    return formatter ? formatter(value, percent) : `${Math.round(percent)}%`;
}

function getProgressAriaValueText(
    value: number,
    percent: number,
    ariaValueText: ProgressProps['ariaValueText'],
    formatter: ProgressProps['formatValue'],
) {
    if (typeof ariaValueText === 'function') return String(ariaValueText(value, percent));
    if (ariaValueText != null && ariaValueText !== '') return String(ariaValueText);
    if (formatter) return String(formatter(value, percent));

    return undefined;
}

function setProgressStyleValue(
    style: CSSProperties,
    property: `--_rp-progress-${string}`,
    value: string | undefined,
) {
    if (value) {
        style[property] = value;
    }
}

export function useProgress(props: ProgressStateProps) {
    const control = useControlState(props);

    const bounds = computed(() => normalizeProgressBounds(props.min, props.max));
    const isIndeterminate = computed(() => props.indeterminate || props.value == null);
    const normalizedValue = computed(() =>
        normalizeProgressValue(props.value, bounds.value.min, bounds.value.max),
    );
    const valuePercent = computed(() =>
        getProgressValuePercent(normalizedValue.value, bounds.value.min, bounds.value.max),
    );
    const formattedValue = computed(() =>
        getFormattedProgressValue(normalizedValue.value, valuePercent.value, props.formatValue),
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
            [`color-${props.color}`]: isComponentPresetColor(props.color),
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

        setProgressStyleValue(
            style,
            '--_rp-progress-custom-color',
            getComponentCustomColor(props.color),
        );

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
