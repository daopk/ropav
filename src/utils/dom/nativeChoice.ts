export interface NativeChoiceOption<Value> {
    value: Value;
}

export interface NativeChoiceAdapter<Value> {
    read: (select: HTMLSelectElement) => Value;
    resolveResetValue: (select: HTMLSelectElement, initialValue: Value) => Value;
    sync: (select: HTMLSelectElement, value: Value, defaultValue: Value) => void;
}

interface SingleNativeChoiceAdapterOptions<Value> {
    emptyValue: Value;
    options: () => readonly NativeChoiceOption<Value>[] | undefined;
}

export function createSingleNativeChoiceAdapter<Value>(
    options: SingleNativeChoiceAdapterOptions<Value>,
): NativeChoiceAdapter<Value> {
    const placeholderOffset = 1;

    function read(select: HTMLSelectElement) {
        const optionIndex = select.selectedIndex - placeholderOffset;
        if (optionIndex < 0) return options.emptyValue;
        return options.options()?.[optionIndex]?.value ?? options.emptyValue;
    }

    return {
        read,
        resolveResetValue: read,
        sync(select, value, defaultValue) {
            const choices = options.options();
            const selectedIndex = choices?.findIndex((choice) => choice.value === value) ?? -1;
            const defaultIndex =
                choices?.findIndex((choice) => choice.value === defaultValue) ?? -1;

            for (const [index, option] of [...select.options].entries()) {
                option.defaultSelected = index === defaultIndex + placeholderOffset;
            }
            select.selectedIndex = selectedIndex + placeholderOffset;
        },
    };
}

export function createMultipleNativeChoiceAdapter<Value>(
    options: () => readonly NativeChoiceOption<Value>[] | undefined,
): NativeChoiceAdapter<Value[]> {
    return {
        read(select) {
            const choices = options();
            return [...select.options].flatMap((nativeOption, index) => {
                const choice = choices?.[index];
                return nativeOption.selected && choice ? [choice.value] : [];
            });
        },
        resolveResetValue(_select, initialValue) {
            return initialValue;
        },
        sync(select, values, defaultValues) {
            const choices = options();
            for (const [index, nativeOption] of [...select.options].entries()) {
                const choice = choices?.[index];
                nativeOption.defaultSelected = Boolean(
                    choice && defaultValues.includes(choice.value),
                );
                nativeOption.selected = Boolean(choice && values.includes(choice.value));
            }
        },
    };
}

export function createStringListNativeChoiceAdapter(): NativeChoiceAdapter<string[]> {
    return {
        read(select) {
            return [...select.selectedOptions].map((option) => option.value);
        },
        resolveResetValue(_select, initialValue) {
            return initialValue;
        },
        sync(select, values, defaultValues) {
            const defaultCounts = new Map<string, number>();
            for (const value of defaultValues) {
                defaultCounts.set(value, (defaultCounts.get(value) ?? 0) + 1);
            }

            const options = values.map((value) => {
                const option = select.ownerDocument.createElement('option');
                const defaultCount = defaultCounts.get(value) ?? 0;

                option.value = value;
                option.textContent = value;
                option.defaultSelected = defaultCount > 0;
                option.selected = true;
                if (defaultCount > 0) defaultCounts.set(value, defaultCount - 1);
                return option;
            });

            select.replaceChildren(...options);
        },
    };
}
