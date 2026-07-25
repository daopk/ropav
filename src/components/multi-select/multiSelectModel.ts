import type { MultiSelectOption, MultiSelectValue } from './types';

export function getMultiSelectSelectedOptions(
    options: readonly MultiSelectOption[] | undefined,
    values: readonly MultiSelectValue[],
) {
    return values.flatMap((value) => {
        const option = options?.find((candidate) => candidate.value === value);
        return option ? [option] : [];
    });
}

export function toggleMultiSelectValue(
    values: readonly MultiSelectValue[],
    value: MultiSelectValue,
    maxValues?: number,
) {
    if (values.includes(value)) return values.filter((candidate) => candidate !== value);
    if (maxValues !== undefined && values.length >= Math.max(0, maxValues)) return [...values];
    return [...values, value];
}

export function getMultiSelectActiveDescendantId(
    baseId: string,
    highlightedIndex: number,
    isOpen: boolean,
) {
    return !isOpen || highlightedIndex < 0 ? undefined : `${baseId}-option-${highlightedIndex}`;
}
