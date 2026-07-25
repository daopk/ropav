import {
    computed,
    nextTick,
    ref,
    watchEffect,
    type ComputedRef,
    type Ref,
    type SelectHTMLAttributes,
} from 'vue';
import {
    useControllableValue,
    type UseControllableValueOptions,
} from '@/composables/useControllableValue';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import type { NativeChoiceAdapter } from '@/utils/dom/nativeChoice';
import { useFormControl } from './useFormControl';

interface NativeChoiceControlOptions<Value> {
    adapter: NativeChoiceAdapter<Value>;
    attributes?: () => SelectHTMLAttributes | undefined;
    className: string;
    focusVisible: () => void;
    syncOrder: 'before-value-change' | 'after-value-change';
    validationMessage?: () => string | undefined;
}

export interface NativeChoiceTransactionOptions<Value> {
    value: Readonly<UseControllableValueOptions<Value>>;
    native: NativeChoiceControlOptions<Value>;
    onFormReset?: () => void;
}

export interface NativeChoiceTransaction<Value> {
    isControlled: ComputedRef<boolean>;
    nativeSelectAttrs: ComputedRef<SelectHTMLAttributes>;
    nativeSelectRef: Ref<HTMLSelectElement | null>;
    requestValueUpdate: (value: Value) => void;
    value: ComputedRef<Value>;
}

function dispatchNativeSelectEvent(select: HTMLSelectElement, type: 'input' | 'change') {
    const EventConstructor = select.ownerDocument.defaultView?.Event ?? Event;
    select.dispatchEvent(new EventConstructor(type, { bubbles: true, cancelable: true }));
}

export function useNativeChoiceTransaction<Value>(
    options: Readonly<NativeChoiceTransactionOptions<Value>>,
): NativeChoiceTransaction<Value> {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const controllable = useControllableValue(options.value);
    let ignoreNativeInput = false;

    function syncNativeValue(value: Value) {
        const select = nativeSelectRef.value;
        if (select) options.native.adapter.sync(select, value, controllable.initialValue);
    }

    function restoreControlledValue() {
        if (!controllable.isControlled.value) return;
        queueMicrotask(() => syncNativeValue(controllable.value.value));
    }

    function onNativeInput(event: InputEvent) {
        if (ignoreNativeInput) return;
        controllable.setValue(
            options.native.adapter.read(event.currentTarget as HTMLSelectElement),
        );
        restoreControlledValue();
    }

    function onNativeInvalid(event: Event) {
        event.preventDefault();
        options.native.focusVisible();
    }

    const nativeSelectAttrs = computed<SelectHTMLAttributes>(() => {
        const compatibilityAttrs = options.native.attributes?.() ?? {};
        const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
            splitCompatibilityAttributes(compatibilityAttrs);

        return {
            ...forwardedAttributes,
            class: [options.native.className, compatibilityClass],
            style: compatibilityStyle,
            onInput: composeEventHandlers<InputEvent>(onNativeInput, compatibilityAttrs.onInput),
            onChange: compatibilityAttrs.onChange,
            onInvalid: composeEventHandlers<Event>(onNativeInvalid, compatibilityAttrs.onInvalid),
        };
    });

    function requestValueUpdate(value: Value) {
        const select = nativeSelectRef.value;
        if (!select) {
            controllable.setValue(value);
            return;
        }

        if (options.native.syncOrder === 'before-value-change') syncNativeValue(value);
        controllable.setValue(value);
        if (options.native.syncOrder === 'after-value-change') syncNativeValue(value);
        ignoreNativeInput = true;
        try {
            dispatchNativeSelectEvent(select, 'input');
            dispatchNativeSelectEvent(select, 'change');
        } finally {
            ignoreNativeInput = false;
        }
        restoreControlledValue();
    }

    useFormControl({
        elements: () => [nativeSelectRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: options.native.validationMessage,
        readResetValue([select]) {
            controllable.resetValue(
                options.native.adapter.resolveResetValue(
                    select as HTMLSelectElement,
                    controllable.initialValue,
                ),
            );
            syncNativeValue(controllable.value.value);
            options.onFormReset?.();
        },
        syncControlledValue() {
            syncNativeValue(controllable.value.value);
            options.onFormReset?.();
        },
    });

    watchEffect(
        () => {
            syncNativeValue(controllable.value.value);
            void nextTick(() => syncNativeValue(controllable.value.value));
        },
        { flush: 'post' },
    );

    return {
        isControlled: controllable.isControlled,
        nativeSelectAttrs,
        nativeSelectRef,
        requestValueUpdate,
        value: controllable.value,
    };
}
