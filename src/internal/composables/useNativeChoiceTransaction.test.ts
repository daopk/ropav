import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, shallowReactive, type Ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import {
    createSingleNativeChoiceAdapter,
    createStringListNativeChoiceAdapter,
} from '@/utils/dom/nativeChoice';
import {
    useNativeChoiceTransaction,
    type NativeChoiceTransaction,
} from './useNativeChoiceTransaction';

type SingleValue = string | number | null;

describe('useNativeChoiceTransaction', () => {
    it('dispatches a typed proposal in native event order and rolls controlled DOM back', async () => {
        const props = shallowReactive<{
            modelValue: SingleValue;
            options: Array<{ value: string | number }>;
        }>({
            modelValue: 'apple',
            options: [{ value: 'apple' }, { value: '2' }, { value: 2 }],
        });
        const updates: SingleValue[] = [];
        const nativeIndexesAtUpdate: number[] = [];
        const nativeValuesAtUpdate: Array<FormDataEntryValue | null> = [];
        const nativeEvents: string[] = [];
        let transaction!: NativeChoiceTransaction<SingleValue>;

        const container = mountDom(
            defineComponent({
                setup() {
                    transaction = useNativeChoiceTransaction<SingleValue>({
                        value: {
                            modelValue: () => props.modelValue,
                            defaultValue: () => null,
                            onChange: (value) => {
                                updates.push(value);
                                const select = transaction.nativeSelectRef.value;
                                nativeIndexesAtUpdate.push(select?.selectedIndex ?? -1);
                                nativeValuesAtUpdate.push(
                                    select?.form ? new FormData(select.form).get('fruit') : null,
                                );
                            },
                        },
                        native: {
                            adapter: createSingleNativeChoiceAdapter<SingleValue>({
                                emptyValue: null,
                                options: () => props.options,
                            }),
                            className: 'native-choice',
                            focusVisible: vi.fn(),
                            syncOrder: 'before-value-change',
                        },
                    });

                    return () =>
                        h('form', [
                            h(
                                'select',
                                {
                                    ...transaction.nativeSelectAttrs.value,
                                    ref: transaction.nativeSelectRef,
                                    name: 'fruit',
                                },
                                [
                                    h('option', { value: '' }),
                                    ...props.options.map((option) =>
                                        h('option', { value: String(option.value) }),
                                    ),
                                ],
                            ),
                        ]);
                },
            }),
        );
        await flush();

        const select = container.querySelector('select')!;
        select.addEventListener('input', () => nativeEvents.push('input'));
        select.addEventListener('change', () => nativeEvents.push('change'));

        transaction.requestValueUpdate(2);

        expect(updates).toEqual([2]);
        expect(nativeIndexesAtUpdate).toEqual([3]);
        expect(nativeValuesAtUpdate).toEqual(['2']);
        expect(nativeEvents).toEqual(['input', 'change']);
        expect(select.selectedIndex).toBe(3);

        await Promise.resolve();

        expect(transaction.value.value).toBe('apple');
        expect(select.selectedIndex).toBe(1);
    });

    it('restores an uncontrolled default on reset and redirects native invalid focus', async () => {
        const updates: string[][] = [];
        const nativeValuesAtUpdate: string[][] = [];
        const onFormReset = vi.fn();
        let transaction!: NativeChoiceTransaction<string[]>;
        let visibleRef!: Ref<HTMLButtonElement | null>;

        const container = mountDom(
            defineComponent({
                setup() {
                    visibleRef = ref<HTMLButtonElement | null>(null);
                    transaction = useNativeChoiceTransaction<string[]>({
                        value: {
                            modelValue: () => undefined,
                            defaultValue: () => ['Vue', 'Vue'],
                            onChange: (value) => {
                                updates.push(value);
                                const form = transaction.nativeSelectRef.value?.form;
                                nativeValuesAtUpdate.push(
                                    form
                                        ? (new FormData(form).getAll('technology') as string[])
                                        : [],
                                );
                            },
                        },
                        native: {
                            adapter: createStringListNativeChoiceAdapter(),
                            className: 'native-choice',
                            focusVisible: () => visibleRef.value?.focus(),
                            syncOrder: 'after-value-change',
                            validationMessage: () => 'Choose at least one technology',
                        },
                        onFormReset,
                    });

                    return () =>
                        h('form', [
                            h('select', {
                                ...transaction.nativeSelectAttrs.value,
                                ref: transaction.nativeSelectRef,
                                multiple: true,
                                name: 'technology',
                            }),
                            h('button', {
                                ref: (element) => {
                                    visibleRef.value = element as HTMLButtonElement | null;
                                },
                                type: 'button',
                            }),
                        ]);
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const select = container.querySelector('select')!;
        const visible = container.querySelector('button')!;

        transaction.requestValueUpdate(['Vue', 'Vue', 'Vapor']);
        expect(updates).toEqual([['Vue', 'Vue', 'Vapor']]);
        expect(nativeValuesAtUpdate).toEqual([['Vue', 'Vue']]);
        expect(new FormData(form).getAll('technology')).toEqual(['Vue', 'Vue', 'Vapor']);

        form.reset();
        await flush();

        expect(onFormReset).toHaveBeenCalledOnce();
        expect(transaction.value.value).toEqual(['Vue', 'Vue']);
        expect(new FormData(form).getAll('technology')).toEqual(['Vue', 'Vue']);
        expect(select.validationMessage).toBe('Choose at least one technology');

        select.dispatchEvent(new Event('invalid', { cancelable: true }));
        expect(document.activeElement).toBe(visible);
    });

    it('adopts the browser-reset value when a single-choice default is unavailable', async () => {
        const props = shallowReactive<{
            options: Array<{ value: string }>;
        }>({
            options: [{ value: 'apple' }, { value: 'banana' }],
        });
        let transaction!: NativeChoiceTransaction<SingleValue>;

        const container = mountDom(
            defineComponent({
                setup() {
                    transaction = useNativeChoiceTransaction<SingleValue>({
                        value: {
                            modelValue: () => undefined,
                            defaultValue: () => 'banana',
                            onChange: vi.fn(),
                        },
                        native: {
                            adapter: createSingleNativeChoiceAdapter<SingleValue>({
                                emptyValue: null,
                                options: () => props.options,
                            }),
                            className: 'native-choice',
                            focusVisible: vi.fn(),
                            syncOrder: 'before-value-change',
                        },
                    });

                    return () =>
                        h(
                            'form',
                            h(
                                'select',
                                {
                                    ...transaction.nativeSelectAttrs.value,
                                    ref: transaction.nativeSelectRef,
                                    name: 'fruit',
                                },
                                [
                                    h('option', { value: '' }),
                                    ...props.options.map((option) =>
                                        h('option', { value: option.value }),
                                    ),
                                ],
                            ),
                        );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const select = container.querySelector('select')!;
        transaction.requestValueUpdate('apple');
        props.options = [{ value: 'apple' }];
        await flush();

        form.reset();
        await flush();

        expect(transaction.value.value).toBeNull();
        expect(select.selectedIndex).toBe(0);
        expect(new FormData(form).get('fruit')).toBe('');

        props.options = [{ value: 'apple' }, { value: 'banana' }];
        await flush();

        expect(transaction.value.value).toBeNull();
        expect(select.selectedIndex).toBe(0);
        expect(new FormData(form).get('fruit')).toBe('');
    });
});
