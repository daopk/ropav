import type { AccordionItemValue, AccordionModelValue } from './types';

type AccordionValueTransition =
    | { changed: false }
    | { changed: true; modelValue: AccordionModelValue };

interface AccordionValueTransitionOptions {
    multiple: boolean;
    collapsible: boolean;
}

export function readAccordionOpenValues(
    value: AccordionModelValue | undefined,
    multiple: boolean,
): AccordionItemValue[] {
    if (value == null) return [];

    const values = Array.isArray(value) ? value : [value];
    return multiple ? values : values.slice(0, 1);
}

function hasValue(values: readonly AccordionItemValue[], value: AccordionItemValue) {
    return values.some((itemValue) => itemValue === value);
}

export function transitionAccordionValue(
    currentValue: AccordionModelValue | undefined,
    itemValue: AccordionItemValue,
    open: boolean,
    options: AccordionValueTransitionOptions,
): AccordionValueTransition {
    const openValues = readAccordionOpenValues(currentValue, options.multiple);
    const itemIsOpen = hasValue(openValues, itemValue);

    if (itemIsOpen === open || (!open && !options.collapsible)) {
        return { changed: false };
    }

    if (!options.multiple) {
        return { changed: true, modelValue: open ? itemValue : null };
    }

    return {
        changed: true,
        modelValue: open
            ? [...openValues, itemValue]
            : openValues.filter((value) => value !== itemValue),
    };
}
