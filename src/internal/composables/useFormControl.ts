import { inject, provide, watchEffect, type ComputedRef, type InjectionKey } from 'vue';

export type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface FormControlOptions {
    elements: () => Array<NativeFormControl | null | undefined>;
    isControlled: () => boolean;
    initializeDefault?: (element: NativeFormControl, index: number) => void;
    validationMessage?: (
        element: NativeFormControl,
        index: number,
        elements: NativeFormControl[],
    ) => string | undefined;
    readResetValue: (elements: NativeFormControl[]) => void;
    syncControlledValue: (elements: NativeFormControl[]) => void;
}

interface FormControllableValue<T> {
    initialValue: T;
    isControlled: ComputedRef<boolean>;
    value: ComputedRef<T>;
    resetValue: (value?: T) => void;
}

const nestedFormControlOwnerKey = Symbol('nestedFormControlOwner') as InjectionKey<() => boolean>;

export function provideNestedFormControlOwner() {
    let claimed = false;
    provide(nestedFormControlOwnerKey, () => {
        if (claimed) return false;
        claimed = true;
        return true;
    });
}

export function claimNestedFormControlOwner() {
    return inject(nestedFormControlOwnerKey, undefined)?.() ?? false;
}

function getElements(options: FormControlOptions) {
    return options.elements().filter((element): element is NativeFormControl => Boolean(element));
}

export function useFormControl(options: FormControlOptions) {
    const initialized = new WeakSet<NativeFormControl>();

    watchEffect(
        () => {
            const elements = getElements(options);

            for (const [index, element] of elements.entries()) {
                if (!initialized.has(element)) {
                    options.initializeDefault?.(element, index);
                    initialized.add(element);
                }

                element.setCustomValidity(
                    options.validationMessage?.(element, index, elements) ?? '',
                );
            }
        },
        { flush: 'post' },
    );

    watchEffect(
        (onCleanup) => {
            const documents = new Set(getElements(options).map((element) => element.ownerDocument));
            if (documents.size === 0) return;

            function onReset(event: Event) {
                const form = event.target;
                const FormConstructor = (event.currentTarget as Document | null)?.defaultView
                    ?.HTMLFormElement;
                if (!FormConstructor || !(form instanceof FormConstructor)) return;

                const elements = getElements(options).filter((element) => element.form === form);
                if (elements.length === 0) return;

                queueMicrotask(() => {
                    if (options.isControlled()) options.syncControlledValue(elements);
                    else options.readResetValue(elements);
                });
            }

            for (const document of documents) document.addEventListener('reset', onReset, true);
            onCleanup(() => {
                for (const document of documents)
                    document.removeEventListener('reset', onReset, true);
            });
        },
        { flush: 'post' },
    );
}

export function useTextFormControl(
    element: () => HTMLInputElement | HTMLTextAreaElement | null | undefined,
    controllable: FormControllableValue<string>,
    validationMessage?: () => string | undefined,
) {
    useFormControl({
        elements: () => [element()],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(control) {
            (control as HTMLInputElement | HTMLTextAreaElement).defaultValue =
                controllable.initialValue;
        },
        validationMessage,
        readResetValue([control]) {
            controllable.resetValue((control as HTMLInputElement | HTMLTextAreaElement).value);
        },
        syncControlledValue([control]) {
            (control as HTMLInputElement | HTMLTextAreaElement).value = controllable.value.value;
        },
    });
}

export function useCheckedFormControl(
    element: () => HTMLInputElement | null | undefined,
    controllable: FormControllableValue<boolean>,
    validationMessage?: () => string | undefined,
) {
    useFormControl({
        elements: () => [element()],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(control) {
            (control as HTMLInputElement).defaultChecked = controllable.initialValue;
        },
        validationMessage,
        readResetValue([control]) {
            controllable.resetValue((control as HTMLInputElement).checked);
        },
        syncControlledValue([control]) {
            (control as HTMLInputElement).checked = controllable.value.value;
        },
    });
}
