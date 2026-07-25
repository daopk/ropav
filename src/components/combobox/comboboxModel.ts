import type { ComboboxOption } from './types';

export type ComboboxValue = string | number | null;

export function hasComboboxValue(value: ComboboxValue) {
    return value !== null;
}

export function getComboboxDisplayLabel(
    options: readonly ComboboxOption[] | undefined,
    value: ComboboxValue,
) {
    if (!hasComboboxValue(value)) return '';
    return options?.find((option) => option.value === value)?.label ?? '';
}

export function getComboboxActiveDescendantId(
    baseId: string,
    highlightedIndex: number,
    isOpen: boolean,
) {
    return !isOpen || highlightedIndex < 0 ? undefined : `${baseId}-option-${highlightedIndex}`;
}
