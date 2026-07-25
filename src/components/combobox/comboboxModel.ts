import type { ComboboxFilter, ComboboxOption } from './types';

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

export function defaultComboboxFilter(option: ComboboxOption, searchValue: string) {
    return option.label.toLocaleLowerCase().includes(searchValue.trim().toLocaleLowerCase());
}

export function filterComboboxOptions(
    options: readonly ComboboxOption[] | undefined,
    searchValue: string,
    filter: ComboboxFilter | false | undefined,
) {
    const availableOptions = options ?? [];
    if (filter === false || searchValue.trim() === '') return [...availableOptions];

    const predicate = filter ?? defaultComboboxFilter;
    return availableOptions.filter((option) => predicate(option, searchValue));
}

export function getComboboxActiveDescendantId(
    baseId: string,
    highlightedIndex: number,
    isOpen: boolean,
) {
    return !isOpen || highlightedIndex < 0 ? undefined : `${baseId}-option-${highlightedIndex}`;
}
