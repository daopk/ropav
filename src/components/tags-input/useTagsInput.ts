import {
    computed,
    nextTick,
    ref,
    watchEffect,
    type ComputedRef,
    type Ref,
    type SelectHTMLAttributes,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState, type ControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { bem } from '@/utils/bem';
import { isNodeWithinElement } from '@/utils/dom/events';
import { isInteractiveElement } from '@/utils/dom/interactive';
import { addTagsInputValues, splitTagsInputValue } from './tagsInputModel';
import type { TagsInputProps } from './types';

export interface TagsInputControl {
    templateRefs: {
        root: Ref<HTMLElement | null>;
        input: Ref<HTMLInputElement | null>;
        native: Ref<HTMLSelectElement | null>;
    };
    nativeSelectAttrs: ComputedRef<SelectHTMLAttributes>;
    control: ControlState;
    rootClass: ComputedRef<string[]>;
    values: ComputedRef<string[]>;
    searchValue: Ref<string>;
    canClear: ComputedRef<boolean>;
    removeTag: (index: number) => void;
    clear: () => void;
    focusInput: (event?: MouseEvent) => void;
    onInput: (event: Event) => void;
    onInputBlur: (event: FocusEvent) => void;
    onInputKeydown: (event: KeyboardEvent) => void;
}

function readNativeValues(select: HTMLSelectElement) {
    return [...select.selectedOptions].map((option) => option.value);
}

function writeNativeValues(
    select: HTMLSelectElement,
    values: readonly string[],
    defaultValues: readonly string[],
) {
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
}

function useTagsInputTransaction(
    props: Readonly<TagsInputProps>,
    emitUpdate: (value: string[]) => void,
    inputRef: Readonly<Ref<HTMLInputElement | null>>,
    onFormReset: () => void,
) {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const controllable = useControllableValue<string[]>({
        modelValue: () => props.modelValue,
        defaultValue: () => [...(props.defaultValue ?? [])],
        onChange: emitUpdate,
    });
    let ignoreNativeInput = false;

    function syncNativeValues(values: readonly string[]) {
        const select = nativeSelectRef.value;
        if (select) writeNativeValues(select, values, controllable.initialValue);
    }

    function requestValueUpdate(values: string[]) {
        controllable.setValue(values);
        const select = nativeSelectRef.value;
        if (!select) return;

        syncNativeValues(values);
        ignoreNativeInput = true;
        try {
            select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        } finally {
            ignoreNativeInput = false;
        }

        if (controllable.isControlled.value) {
            queueMicrotask(() => syncNativeValues(controllable.value.value));
        }
    }

    const nativeSelectAttrs = computed<SelectHTMLAttributes>(() => ({
        class: 'rp-tags-input__native',
        onInput: (event: Event) => {
            if (ignoreNativeInput) return;

            controllable.setValue(readNativeValues(event.currentTarget as HTMLSelectElement));
            if (controllable.isControlled.value) {
                queueMicrotask(() => syncNativeValues(controllable.value.value));
            }
        },
        onInvalid: (event: Event) => {
            event.preventDefault();
            inputRef.value?.focus();
        },
    }));

    useFormControl({
        elements: () => [nativeSelectRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: () => (props.readonly ? undefined : props.validationMessage),
        readResetValue() {
            controllable.resetValue();
            syncNativeValues(controllable.value.value);
            onFormReset();
        },
        syncControlledValue() {
            syncNativeValues(controllable.value.value);
            onFormReset();
        },
    });

    watchEffect(() => syncNativeValues(controllable.value.value), { flush: 'post' });

    return {
        nativeSelectRef,
        nativeSelectAttrs,
        requestValueUpdate,
        values: controllable.value,
    };
}

function areTagValuesEqual(left: readonly string[], right: readonly string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function useTagsInput(
    props: Readonly<TagsInputProps>,
    emitUpdate: (value: string[]) => void,
): TagsInputControl {
    const rootRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    const searchValue = ref('');

    function updateSearch(value: string) {
        searchValue.value = value;
        if (inputRef.value && inputRef.value.value !== value) inputRef.value.value = value;
    }

    const transaction = useTagsInputTransaction(props, emitUpdate, inputRef, () =>
        updateSearch(''),
    );
    const values = transaction.values;
    const control = useControlState(props);
    const rootClass = computed(() =>
        bem('rp-tags-input', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            readonly: props.readonly,
            invalid: control.invalid,
        }),
    );
    const canClear = computed(() =>
        Boolean(props.clearable && values.value.length > 0 && !control.disabled && !props.readonly),
    );

    function addValues(candidates: readonly string[]) {
        if (control.disabled || props.readonly) return false;
        const nextValues = addTagsInputValues(values.value, candidates, {
            allowDuplicates: props.allowDuplicates ?? false,
            maxTags: props.maxTags,
            validate: props.validate,
        });
        if (areTagValuesEqual(nextValues, values.value)) return false;
        transaction.requestValueUpdate(nextValues);
        return true;
    }

    function commitSearch() {
        if (searchValue.value.trim() === '') return false;
        const wasAdded = addValues([searchValue.value]);
        if (wasAdded) updateSearch('');
        return wasAdded;
    }

    function removeTag(index: number) {
        if (control.disabled || props.readonly || index < 0 || index >= values.value.length) {
            return;
        }
        transaction.requestValueUpdate(
            values.value.filter((_, valueIndex) => valueIndex !== index),
        );
        void nextTick(() => inputRef.value?.focus());
    }

    function clear() {
        if (!canClear.value) return;
        transaction.requestValueUpdate([]);
        updateSearch('');
        void nextTick(() => inputRef.value?.focus());
    }

    function focusInput(event?: MouseEvent) {
        if (control.disabled) return;
        if (event && isInteractiveElement(event.target, '.rp-tags-input__input')) return;
        inputRef.value?.focus();
    }

    function onInput(event: Event) {
        if (control.disabled || props.readonly || (event as InputEvent).isComposing) return;
        const inputValue = (event.currentTarget as HTMLInputElement).value;
        const { tags, remainder } = splitTagsInputValue(inputValue, props.splitChars ?? [',']);
        if (tags.length > 0) addValues(tags);
        updateSearch(remainder);
    }

    function onInputBlur(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, rootRef.value)) return;
        if (props.acceptValueOnBlur) commitSearch();
    }

    function onInputKeydown(event: KeyboardEvent) {
        if (control.disabled || props.readonly || event.isComposing) return;

        if (event.key === 'Enter' && searchValue.value.trim() !== '') {
            event.preventDefault();
            commitSearch();
            return;
        }
        if (event.key === 'Backspace' && searchValue.value === '') {
            const lastIndex = values.value.length - 1;
            if (lastIndex >= 0) removeTag(lastIndex);
        }
    }

    return {
        templateRefs: {
            root: rootRef,
            input: inputRef,
            native: transaction.nativeSelectRef,
        },
        nativeSelectAttrs: transaction.nativeSelectAttrs,
        control,
        rootClass,
        values,
        searchValue,
        canClear,
        removeTag,
        clear,
        focusInput,
        onInput,
        onInputBlur,
        onInputKeydown,
    };
}
