import { watchEffect, type InjectionKey } from 'vue';

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

export const nestedFormControlOwnerKey = Symbol('nestedFormControlOwner') as InjectionKey<
    () => boolean
>;

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
                if (!(form instanceof HTMLFormElement)) return;

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
