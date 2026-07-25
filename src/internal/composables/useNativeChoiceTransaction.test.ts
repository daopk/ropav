import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, shallowReactive } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import {
    useNativeChoiceTransaction,
    type NativeChoiceAdapter,
    type NativeChoiceTransaction,
} from './useNativeChoiceTransaction';

describe('useNativeChoiceTransaction', () => {
    it('rolls a rejected native proposal back through its adapter', async () => {
        const props = shallowReactive({ modelValue: 'list' });
        const updates: string[] = [];
        const inputRef = ref<HTMLInputElement | null>(null);
        let transaction!: NativeChoiceTransaction<string>;

        const adapter: NativeChoiceAdapter<string> = {
            controls: () => [inputRef.value],
            readResetValue([input]) {
                return (input as HTMLInputElement).value;
            },
            syncValue(value, defaultValue) {
                if (!inputRef.value) return;
                inputRef.value.value = value;
                inputRef.value.defaultValue = defaultValue;
            },
        };

        const container = mountDom(
            defineComponent({
                setup() {
                    transaction = useNativeChoiceTransaction({
                        value: {
                            modelValue: () => props.modelValue,
                            defaultValue: () => 'list',
                            onChange: (value) => updates.push(value),
                        },
                        adapter,
                    });

                    return () =>
                        h('input', {
                            ref: inputRef,
                            value: transaction.value.value,
                        });
                },
            }),
        );
        await flush();

        const input = container.querySelector('input')!;
        input.value = 'grid';
        transaction.requestValueUpdate('grid');

        expect(updates).toEqual(['grid']);
        expect(transaction.value.value).toBe('list');

        await Promise.resolve();

        expect(input.value).toBe('list');
    });

    it('coordinates value updates, uncontrolled reset, and validation', async () => {
        const inputRef = ref<HTMLInputElement | null>(null);
        const onFormReset = vi.fn();
        const updates: string[] = [];
        let transaction!: NativeChoiceTransaction<string>;

        function syncInput(value: string, defaultValue: string) {
            if (!inputRef.value) return;
            inputRef.value.value = value;
            inputRef.value.defaultValue = defaultValue;
        }

        const adapter: NativeChoiceAdapter<string> = {
            controls: () => [inputRef.value],
            readResetValue([input]) {
                return (input as HTMLInputElement).value;
            },
            syncValue: syncInput,
            validationMessage: () => 'Choose a view.',
        };

        const container = mountDom(
            defineComponent({
                setup() {
                    transaction = useNativeChoiceTransaction({
                        value: {
                            modelValue: () => undefined,
                            defaultValue: () => 'list',
                            onChange: (value) => updates.push(value),
                        },
                        adapter,
                        onFormReset,
                    });

                    return () => h('form', h('input', { ref: inputRef, name: 'view' }));
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const input = container.querySelector('input')!;
        transaction.requestValueUpdate('grid');
        syncInput('grid', 'list');

        expect(updates).toEqual(['grid']);
        expect(input.value).toBe('grid');
        expect(input.validationMessage).toBe('Choose a view.');

        await flush();
        form.reset();
        await Promise.resolve();
        await flush();

        expect(transaction.value.value).toBe('list');
        expect(input.value).toBe('list');
        expect(onFormReset).toHaveBeenCalledOnce();
    });
});
