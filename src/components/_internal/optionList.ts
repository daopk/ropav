export interface OptionListItem {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export type OptionListValue = string | number | null;

export function hasOptionListValue(value: OptionListValue) {
    return value != null && value !== '';
}

export function getOptionListDisplayLabel<T extends OptionListItem>(
    options: T[] | undefined,
    value: OptionListValue,
) {
    if (!hasOptionListValue(value)) return '';
    return options?.find((option) => option.value === value)?.label ?? '';
}

export function getOptionListActiveDescendantId(baseId: string, focusedIndex: number) {
    return focusedIndex < 0 ? undefined : `${baseId}-option-${focusedIndex}`;
}
