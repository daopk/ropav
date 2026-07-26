import { computed, ref, type ComputedRef, type Ref, type SelectHTMLAttributes } from 'vue';
import type { UseControllableValueOptions } from '@/composables/useControllableValue';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import type { NativeSelectChoiceAdapter } from '@/utils/dom/nativeChoice';
import { useNativeChoiceTransaction, type NativeChoiceAdapter } from './useNativeChoiceTransaction';

interface HiddenSelectChoiceControlOptions<Value> {
    adapter: NativeSelectChoiceAdapter<Value>;
    attributes?: () => SelectHTMLAttributes | undefined;
    className: string;
    focusVisible: () => void;
    validationMessage?: () => string | undefined;
}

export interface HiddenSelectChoiceTransactionOptions<Value> {
    value: Readonly<UseControllableValueOptions<Value>>;
    native: HiddenSelectChoiceControlOptions<Value>;
    onFormReset?: () => void;
}

export interface HiddenSelectChoiceTransaction<Value> {
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

export function useHiddenSelectChoiceTransaction<Value>(
    options: Readonly<HiddenSelectChoiceTransactionOptions<Value>>,
): HiddenSelectChoiceTransaction<Value> {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const initialValue = options.value.defaultValue();
    let handlingNativeInput = false;
    let ignoreNativeInput = false;

    function syncNativeValue(value: Value, defaultValue: Value) {
        const select = nativeSelectRef.value;
        if (select) options.native.adapter.sync(select, value, defaultValue);
    }

    const adapter: NativeChoiceAdapter<Value> = {
        commitValue(value, defaultValue, applyValue) {
            const select = nativeSelectRef.value;
            if (!select || handlingNativeInput) {
                applyValue();
                return;
            }

            options.native.adapter.commit(select, value, defaultValue, applyValue);
            ignoreNativeInput = true;
            try {
                dispatchNativeSelectEvent(select, 'input');
                dispatchNativeSelectEvent(select, 'change');
            } finally {
                ignoreNativeInput = false;
            }
        },
        controls: () => [nativeSelectRef.value],
        readResetValue([select], defaultValue) {
            return options.native.adapter.resolveResetValue(
                select as HTMLSelectElement,
                defaultValue,
            );
        },
        syncValue: syncNativeValue,
        validationMessage: options.native.validationMessage,
    };

    const transaction = useNativeChoiceTransaction({
        value: {
            ...options.value,
            defaultValue: () => initialValue,
        },
        adapter,
        onFormReset: options.onFormReset,
    });

    function onNativeInput(event: InputEvent) {
        if (ignoreNativeInput) return;
        handlingNativeInput = true;
        try {
            transaction.requestValueUpdate(
                options.native.adapter.read(event.currentTarget as HTMLSelectElement),
            );
        } finally {
            handlingNativeInput = false;
        }
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

    return {
        isControlled: transaction.isControlled,
        nativeSelectAttrs,
        nativeSelectRef,
        requestValueUpdate: transaction.requestValueUpdate,
        value: transaction.value,
    };
}
