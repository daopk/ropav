import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, shallowReactive } from 'vue';

import { selectFiles } from '../../../tests/utils/files';
import { flush, mountDom } from '../../../tests/utils/vue';
import type { FileInputProps } from './types';
import { useFileInput } from './useFileInput';

function mountFileInputState(initialProps: FileInputProps = {}) {
    const props = shallowReactive<FileInputProps>(initialProps);
    const updates: File[][] = [];
    let fileInput!: ReturnType<typeof useFileInput>;

    const container = mountDom(
        defineComponent({
            setup() {
                fileInput = useFileInput(props, (files) => updates.push(files));
                return () =>
                    h('input', {
                        ref: fileInput.inputRef,
                        type: 'file',
                        onChange: fileInput.onChange,
                    });
            },
        }),
    );

    return {
        container,
        props,
        updates,
        get fileInput() {
            return fileInput;
        },
    };
}

describe('useFileInput', () => {
    it('derives observable selection, display, and visual state from reactive props', async () => {
        const first = new File(['first'], 'first.txt');
        const second = new File(['second'], 'second.txt');
        const mounted = mountFileInputState({
            modelValue: [first, second],
            size: 'lg',
            radius: 'xl',
            buttonLabel: 'Browse',
            placeholder: 'Attach a file',
            valid: true,
        });
        await flush();

        expect(mounted.fileInput.files.value).toEqual([first]);
        expect(mounted.fileInput.fileNames.value).toEqual(['first.txt']);
        expect(mounted.fileInput.hasFiles.value).toBe(true);
        expect(mounted.fileInput.buttonText.value).toBe('Browse');
        expect(mounted.fileInput.displayValue.value).toBe('first.txt');
        expect(mounted.fileInput.rootClass.value).toEqual(
            expect.arrayContaining([
                'rp-file-input',
                'rp-file-input--size-lg',
                'rp-file-input--radius-xl',
                'rp-file-input--valid',
                'rp-file-input--filled',
            ]),
        );

        mounted.props.modelValue = [];
        mounted.props.multiple = true;
        mounted.props.buttonLabel = undefined;
        mounted.props.placeholder = undefined;
        mounted.props.invalid = true;
        await flush();

        expect(mounted.fileInput.files.value).toEqual([]);
        expect(mounted.fileInput.fileNames.value).toEqual([]);
        expect(mounted.fileInput.hasFiles.value).toBe(false);
        expect(mounted.fileInput.buttonText.value).toBe('Choose files');
        expect(mounted.fileInput.displayValue.value).toBe('No files selected');
        expect(mounted.fileInput.rootClass.value).toEqual(
            expect.arrayContaining(['rp-file-input', 'rp-file-input--invalid']),
        );
        expect(mounted.fileInput.rootClass.value).not.toContain('rp-file-input--valid');
        expect(mounted.fileInput.rootClass.value).not.toContain('rp-file-input--filled');
    });

    it('handles native changes and exposes input commands through its interface', async () => {
        const mounted = mountFileInputState();
        await flush();

        const input = mounted.container.querySelector('input') as HTMLInputElement;
        const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);
        const first = new File(['first'], 'first.txt');
        const second = new File(['second'], 'second.txt');

        selectFiles(input, [first, second]);
        await flush();

        expect(mounted.updates).toEqual([[first]]);
        expect(mounted.fileInput.files.value).toEqual([first]);

        mounted.fileInput.focus();
        expect(document.activeElement).toBe(input);

        mounted.fileInput.open();
        expect(clickSpy).toHaveBeenCalledOnce();

        mounted.props.disabled = true;
        mounted.fileInput.open();
        expect(clickSpy).toHaveBeenCalledOnce();

        mounted.fileInput.clear();
        await flush();

        expect(mounted.updates).toEqual([[first], []]);
        expect(mounted.fileInput.files.value).toEqual([]);
    });
});
