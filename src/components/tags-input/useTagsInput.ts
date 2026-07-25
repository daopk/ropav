import {
    computed,
    nextTick,
    ref,
    type ComputedRef,
    type Ref,
    type SelectHTMLAttributes,
} from 'vue';
import { useControlState, type ControlState } from '@/internal/composables/useControlState';
import { useHiddenSelectChoiceTransaction } from '@/internal/composables/useHiddenSelectChoiceTransaction';
import { bem } from '@/utils/bem';
import { isNodeWithinElement } from '@/utils/dom/events';
import { isInteractiveElement } from '@/utils/dom/interactive';
import { createStringListNativeChoiceAdapter } from '@/utils/dom/nativeChoice';
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

function useTagsInputTransaction(
    props: Readonly<TagsInputProps>,
    emitUpdate: (value: string[]) => void,
    inputRef: Readonly<Ref<HTMLInputElement | null>>,
    onFormReset: () => void,
) {
    const transaction = useHiddenSelectChoiceTransaction<string[]>({
        value: {
            modelValue: () => props.modelValue,
            defaultValue: () => [...(props.defaultValue ?? [])],
            onChange: emitUpdate,
        },
        native: {
            adapter: createStringListNativeChoiceAdapter(),
            className: 'rp-tags-input__native',
            focusVisible: () => inputRef.value?.focus(),
            validationMessage: () => (props.readonly ? undefined : props.validationMessage),
        },
        onFormReset,
    });

    return {
        nativeSelectRef: transaction.nativeSelectRef,
        nativeSelectAttrs: transaction.nativeSelectAttrs,
        requestValueUpdate: transaction.requestValueUpdate,
        values: transaction.value,
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
