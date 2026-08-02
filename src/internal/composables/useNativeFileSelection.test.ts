import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, shallowReactive } from 'vue';

import { installDataTransferStub, makeInputFilesMutable } from '../../../tests/utils/files';
import { flush, mountDom } from '../../../tests/utils/vue';
import { useNativeFileSelection, type NativeFileSelection } from './useNativeFileSelection';

interface SelectionTestProps {
    modelValue: File[] | undefined;
    multiple: boolean;
    disabled: boolean;
    validationMessage?: string;
}

function mountSelection(
    overrides: Partial<SelectionTestProps> = {},
    onChange?: (files: File[], selection: NativeFileSelection) => void,
) {
    const props = shallowReactive<SelectionTestProps>({
        modelValue: undefined,
        multiple: false,
        disabled: false,
        validationMessage: undefined,
        ...overrides,
    });
    const updates: File[][] = [];
    let selection!: NativeFileSelection;

    const container = mountDom(
        defineComponent({
            setup() {
                selection = useNativeFileSelection({
                    modelValue: () => props.modelValue,
                    multiple: () => props.multiple,
                    disabled: () => props.disabled,
                    validationMessage: () => props.validationMessage,
                    onChange: (files) => {
                        updates.push(files);
                        onChange?.(files, selection);
                    },
                });

                return () =>
                    h(
                        'form',
                        h('input', {
                            ref: selection.inputRef,
                            type: 'file',
                            name: 'attachments',
                        }),
                    );
            },
        }),
    );

    return {
        container,
        props,
        updates,
        get form() {
            return container.querySelector('form') as HTMLFormElement;
        },
        get input() {
            return container.querySelector('input') as HTMLInputElement;
        },
        get selection() {
            return selection;
        },
    };
}

let restoreDataTransfer: () => void;

beforeEach(() => {
    restoreDataTransfer = installDataTransferStub();
});

afterEach(() => {
    restoreDataTransfer();
});

describe('useNativeFileSelection', () => {
    it('settles accepted and rejected outcomes against a controlled native selection', async () => {
        const initial = new File(['initial'], 'initial.pdf');
        const proposal = new File(['proposal'], 'proposal.pdf');
        const rejected = new File(['rejected'], 'rejected.pdf');
        const nativeFilesAtUpdate: File[][] = [];
        const mounted = mountSelection(
            { modelValue: [initial], multiple: true },
            (_files, selection) => {
                nativeFilesAtUpdate.push(Array.from(selection.inputRef.value?.files ?? []));
            },
        );
        const mutableFiles = makeInputFilesMutable(mounted.input);
        await flush();

        mutableFiles.replace([rejected]);
        mounted.selection.settleSelection({ status: 'rejected' });

        expect(Array.from(mounted.input.files ?? [])).toEqual([initial]);
        expect(mounted.updates).toEqual([]);

        mounted.selection.settleSelection({ status: 'accepted', files: [proposal] });

        expect(mounted.updates).toEqual([[proposal]]);
        expect(nativeFilesAtUpdate).toEqual([[proposal]]);
        expect(mounted.selection.files.value).toEqual([initial]);

        await flush();
        expect(Array.from(mounted.input.files ?? [])).toEqual([initial]);

        mounted.props.modelValue = [proposal];
        await flush();
        expect(Array.from(mounted.input.files ?? [])).toEqual([proposal]);
    });

    it('normalizes uncontrolled updates and owns the native input commands', async () => {
        const mounted = mountSelection();
        makeInputFilesMutable(mounted.input);
        await flush();

        const clickSpy = vi.spyOn(mounted.input, 'click').mockImplementation(() => undefined);
        const first = new File(['first'], 'first.txt');
        const second = new File(['second'], 'second.txt');

        mounted.selection.settleSelection({ status: 'accepted', files: [first, second] });
        expect(mounted.selection.files.value).toEqual([first]);
        expect(mounted.updates).toEqual([[first]]);

        mounted.selection.focus();
        expect(document.activeElement).toBe(mounted.input);

        mounted.selection.open();
        expect(clickSpy).toHaveBeenCalledOnce();

        mounted.props.disabled = true;
        mounted.selection.open();
        expect(clickSpy).toHaveBeenCalledOnce();

        mounted.selection.clear();
        expect(mounted.selection.files.value).toEqual([]);
        expect(mounted.updates).toEqual([[first], []]);
    });

    it('reacts to custom validation message changes', async () => {
        const mounted = mountSelection({
            validationMessage: 'Attach a supported file.',
        });
        await flush();

        expect(mounted.input.validationMessage).toBe('Attach a supported file.');
        expect(mounted.input.checkValidity()).toBe(false);

        mounted.props.validationMessage = '';
        await flush();

        expect(mounted.input.validationMessage).toBe('');
        expect(mounted.input.checkValidity()).toBe(true);
    });

    it('resets an uncontrolled selection to empty without emitting an update', async () => {
        const mounted = mountSelection({ multiple: true });
        const mutableFiles = makeInputFilesMutable(mounted.input);
        const file = new File(['resume'], 'resume.pdf');
        await flush();

        mounted.selection.settleSelection({ status: 'accepted', files: [file] });
        expect(mounted.selection.files.value).toEqual([file]);
        expect(Array.from(mounted.input.files ?? [])).toEqual([file]);

        mounted.form.reset();
        mutableFiles.replace([]);
        await flush();

        expect(mounted.selection.files.value).toEqual([]);
        expect(Array.from(mounted.input.files ?? [])).toEqual([]);
        expect(mounted.updates).toEqual([[file]]);
    });

    it('restores a controlled native selection after form reset', async () => {
        const initial = new File(['initial'], 'initial.pdf');
        const mounted = mountSelection({
            modelValue: [initial],
            multiple: true,
        });
        const mutableFiles = makeInputFilesMutable(mounted.input);
        mounted.selection.settleSelection({ status: 'rejected' });
        await flush();

        expect(Array.from(mounted.input.files ?? [])).toEqual([initial]);

        mounted.form.reset();
        mutableFiles.replace([]);
        await flush();

        expect(mounted.selection.files.value).toEqual([initial]);
        expect(Array.from(mounted.input.files ?? [])).toEqual([initial]);
        expect(mounted.updates).toEqual([]);
    });
});
