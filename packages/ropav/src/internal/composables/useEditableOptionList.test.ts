import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';
import { click, flush, input as inputValue, keydown, mountDom } from '../../../tests/utils/vue';
import {
    useEditableOptionList,
    type EditableOptionList,
    type EditableOptionListSelection,
} from './useEditableOptionList';

interface Item {
    disabled?: boolean;
    id: string;
    label: string;
}

const alpha = { id: 'alpha', label: 'Alpha' };
const beta = { id: 'beta', label: 'Beta' };

function mountOptionList(
    items: Ref<Item[]>,
    selection: EditableOptionListSelection<Item>,
    onSearch = vi.fn(),
) {
    const rootRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    let optionList!: EditableOptionList<Item>;

    const container = mountDom(
        defineComponent({
            setup() {
                optionList = useEditableOptionList({
                    baseId: 'fruit',
                    clearable: () => true,
                    disabled: () => false,
                    filter: () => undefined,
                    getKey: (item) => item.id,
                    inputRef,
                    isDisabled: (item) => Boolean(item.disabled),
                    items: () => items.value,
                    onSearch,
                    rootRef,
                    selection,
                });

                return () =>
                    h(
                        'div',
                        {
                            ref: rootRef,
                            onFocusout: optionList.handlers.onFocusout,
                            onMousedown: optionList.handlers.onRootMousedown,
                        },
                        [
                            h('input', {
                                ref: inputRef,
                                value: optionList.state.searchValue.value,
                                onClick: optionList.handlers.onInputClick,
                                onFocus: optionList.handlers.onInputFocus,
                                onInput: optionList.handlers.onInput,
                                onKeydown: optionList.handlers.onInputKeydown,
                            }),
                            h('button', { class: 'action', type: 'button' }, 'Action'),
                            ...optionList.state.renderedOptions.value.map((state) =>
                                h(
                                    'div',
                                    {
                                        id: state.id,
                                        'data-active': state.active || undefined,
                                    },
                                    state.option.label,
                                ),
                            ),
                        ],
                    );
            },
        }),
    );

    return {
        get input() {
            return inputRef.value!;
        },
        onSearch,
        optionList,
        container,
    };
}

describe('useEditableOptionList', () => {
    it('keeps an idle single list inactive but repairs async search results', async () => {
        const items = ref<Item[]>([]);
        const selectedId = ref<string | null>(null);
        const harness = mountOptionList(items, {
            kind: 'single',
            clear: () => {
                selectedId.value = null;
            },
            displayValue: () =>
                [alpha, beta].find((item) => item.id === selectedId.value)?.label ?? '',
            hasSelection: () => selectedId.value !== null,
            isSelected: (item) => item.id === selectedId.value,
            select: (item) => {
                selectedId.value = item.id;
            },
        });

        harness.input.focus();
        await flush();
        items.value = [alpha, beta];
        await flush();

        expect(harness.optionList.state.isOpen.value).toBe(true);
        expect(harness.optionList.state.renderedOptions.value.every((item) => !item.active)).toBe(
            true,
        );

        items.value = [];
        await flush();
        inputValue(harness.input, 'be');
        items.value = [beta];
        await flush();

        expect(harness.optionList.state.renderedOptions.value[0]).toMatchObject({
            active: true,
            option: beta,
        });

        keydown(harness.input, 'Enter');
        await flush();

        expect(selectedId.value).toBe('beta');
        expect(harness.optionList.state.isOpen.value).toBe(false);
        expect(harness.input.value).toBe('Beta');
    });

    it('restores a rejected controlled single selection behind the seam', async () => {
        const items = ref([alpha, beta]);
        const selectedId = ref<string | null>('alpha');
        const select = vi.fn();
        const harness = mountOptionList(items, {
            kind: 'single',
            clear: vi.fn(),
            displayValue: () =>
                items.value.find((item) => item.id === selectedId.value)?.label ?? '',
            hasSelection: () => selectedId.value !== null,
            isSelected: (item) => item.id === selectedId.value,
            select,
        });

        harness.input.focus();
        inputValue(harness.input, 'be');
        await flush();
        keydown(harness.input, 'Enter');
        await flush();

        expect(select).toHaveBeenCalledWith(beta);
        expect(harness.optionList.state.isOpen.value).toBe(false);
        expect(harness.input.value).toBe('Alpha');
    });

    it('keeps a multiple list open, resets its query, and owns dismissal and Backspace', async () => {
        const items = ref<Item[]>([]);
        const selectedIds = ref<string[]>([]);
        const removeLast = vi.fn(() => {
            selectedIds.value = selectedIds.value.slice(0, -1);
        });
        const onSearch = vi.fn();
        const harness = mountOptionList(
            items,
            {
                kind: 'multiple',
                clear: () => {
                    selectedIds.value = [];
                },
                hasSelection: () => selectedIds.value.length > 0,
                isSelected: (item) => selectedIds.value.includes(item.id),
                removeLast,
                select: (item) => {
                    selectedIds.value = selectedIds.value.includes(item.id)
                        ? selectedIds.value.filter((id) => id !== item.id)
                        : [...selectedIds.value, item.id];
                },
            },
            onSearch,
        );

        harness.input.focus();
        await flush();
        items.value = [alpha, beta];
        await flush();

        expect(harness.optionList.state.renderedOptions.value[0]?.active).toBe(true);

        inputValue(harness.input, 'be');
        await flush();
        keydown(harness.input, 'Enter');
        await flush();

        expect(selectedIds.value).toEqual(['beta']);
        expect(harness.optionList.state.isOpen.value).toBe(true);
        expect(harness.input.value).toBe('');
        expect(onSearch).toHaveBeenLastCalledWith('');

        keydown(harness.input, 'Backspace');
        expect(removeLast).toHaveBeenCalledOnce();
        expect(selectedIds.value).toEqual([]);

        click(document.body);
        await flush();
        expect(harness.optionList.state.isOpen.value).toBe(false);

        harness.container
            .querySelector('.action')!
            .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(harness.optionList.state.isOpen.value).toBe(false);
    });
});
