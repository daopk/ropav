import type { TagsInputValueValidator } from './types';

export interface AddTagsInputValuesOptions {
    allowDuplicates: boolean;
    maxTags?: number;
    validate?: TagsInputValueValidator;
}

export function normalizeTagsInputValue(value: string) {
    return value.trim();
}

export function addTagsInputValues(
    values: readonly string[],
    candidates: readonly string[],
    options: AddTagsInputValuesOptions,
) {
    const nextValues = [...values];
    const maxTags =
        options.maxTags === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.maxTags);

    for (const candidate of candidates) {
        const value = normalizeTagsInputValue(candidate);
        if (value === '' || nextValues.length >= maxTags) continue;
        if (!options.allowDuplicates && nextValues.includes(value)) continue;
        if (options.validate && !options.validate(value)) continue;
        nextValues.push(value);
    }

    return nextValues;
}

export function splitTagsInputValue(value: string, splitChars: readonly string[]) {
    const delimiters = new Set(splitChars);
    const tags: string[] = [];
    let remainder = '';
    let wasSplit = false;

    for (const character of Array.from(value)) {
        if (!delimiters.has(character)) {
            remainder += character;
            continue;
        }

        tags.push(remainder);
        remainder = '';
        wasSplit = true;
    }

    return { tags: wasSplit ? tags : [], remainder: wasSplit ? remainder : value };
}
