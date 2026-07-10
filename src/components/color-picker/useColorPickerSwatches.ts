import { computed, ref, type CSSProperties } from 'vue';
import { parseColorPickerValue } from './color-picker-utils';
import type { ColorPickerProps } from './types';

const MAX_SWATCHES_PER_ROW = 15;

type ColorPickerSwatchesProps = Readonly<Pick<ColorPickerProps, 'swatches' | 'swatchesPerRow'>>;

interface UseColorPickerSwatchesOptions {
    isSelected: (swatch: string) => boolean;
    select: (swatch: string) => void;
}

export function useColorPickerSwatches(
    props: ColorPickerSwatchesProps,
    options: UseColorPickerSwatchesOptions,
) {
    const swatchesRef = ref<HTMLElement | null>(null);
    const focusedSwatchIndex = ref<number | null>(null);
    const normalizedSwatchesPerRow = computed(() => normalizeSwatchesPerRow(props.swatchesPerRow));
    const validSwatches = computed(() =>
        (props.swatches ?? []).filter((swatch) => Boolean(parseColorPickerValue(swatch))),
    );
    const swatchesStyle = computed(() => {
        const swatchesPerRow = normalizedSwatchesPerRow.value;
        if (!swatchesPerRow) return undefined;

        return {
            '--_rp-color-picker-swatches-per-row': String(swatchesPerRow),
        } as CSSProperties;
    });
    const swatchSize = computed(() =>
        normalizedSwatchesPerRow.value ? '100%' : 'var(--_rp-color-picker-swatch-size)',
    );
    const selectedSwatchIndex = computed(() =>
        validSwatches.value.findIndex((swatch) => options.isSelected(swatch)),
    );
    const tabbableSwatchIndex = computed(() => {
        const focusedIndex = focusedSwatchIndex.value;
        if (focusedIndex != null && focusedIndex < validSwatches.value.length) return focusedIndex;

        return selectedSwatchIndex.value >= 0 ? selectedSwatchIndex.value : 0;
    });

    function isSwatchSelected(index: number) {
        return selectedSwatchIndex.value === index;
    }

    function getSwatchTabindex(index: number) {
        return tabbableSwatchIndex.value === index ? 0 : -1;
    }

    function selectSwatch(swatch: string) {
        options.select(swatch);
    }

    function onSwatchFocus(index: number) {
        focusedSwatchIndex.value = index;
    }

    function onSwatchesFocusout(event: FocusEvent) {
        const group = event.currentTarget;
        const nextTarget = event.relatedTarget;

        if (
            group instanceof HTMLElement &&
            nextTarget instanceof Node &&
            group.contains(nextTarget)
        ) {
            return;
        }

        focusedSwatchIndex.value = null;
    }

    function onSwatchKeydown(event: KeyboardEvent, index: number) {
        const offset = getNavigationOffset(event.key);
        if (offset === undefined || validSwatches.value.length === 0) return;

        event.preventDefault();

        const nextIndex =
            (index + offset + validSwatches.value.length) % validSwatches.value.length;
        const nextSwatch = validSwatches.value[nextIndex];
        const nextButton = swatchesRef.value?.querySelectorAll<HTMLButtonElement>(
            '.rp-color-picker__swatch',
        )[nextIndex];

        nextButton?.focus({ preventScroll: true });
        if (nextSwatch) selectSwatch(nextSwatch);
    }

    return {
        swatchesRef,
        normalizedSwatchesPerRow,
        validSwatches,
        swatchesStyle,
        swatchSize,
        isSwatchSelected,
        getSwatchTabindex,
        selectSwatch,
        onSwatchFocus,
        onSwatchesFocusout,
        onSwatchKeydown,
    };
}

function normalizeSwatchesPerRow(value: number | undefined) {
    if (value === undefined || !Number.isFinite(value) || value < 1) return undefined;
    return Math.min(MAX_SWATCHES_PER_ROW, Math.floor(value));
}

function getNavigationOffset(key: string) {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
            return 1;
        case 'ArrowLeft':
        case 'ArrowUp':
            return -1;
        default:
            return undefined;
    }
}
