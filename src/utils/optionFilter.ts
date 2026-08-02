export interface LabeledOption {
    label: string;
}

export type OptionFilter<Option> = (option: Option, searchValue: string) => boolean;

function defaultOptionFilter(option: LabeledOption, searchValue: string) {
    return option.label.toLocaleLowerCase().includes(searchValue.trim().toLocaleLowerCase());
}

export function filterOptions<Option extends LabeledOption>(
    options: readonly Option[] | undefined,
    searchValue: string,
    filter: OptionFilter<Option> | false | undefined,
) {
    const availableOptions = options ?? [];
    if (filter === false || searchValue.trim() === '') return [...availableOptions];

    const predicate = filter ?? defaultOptionFilter;
    return availableOptions.filter((option) => predicate(option, searchValue));
}
