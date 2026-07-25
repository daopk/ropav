import { afterEach, describe, expect, it } from 'vitest';

import {
    createFileList,
    installDataTransferStub,
    makeInputFilesMutable,
    replaceDataTransferConstructor,
} from '../../../tests/utils/files';
import { haveSameFiles, normalizeSelectedFiles, replaceInputFiles } from './files';

let restoreDataTransfer: (() => void) | undefined;

afterEach(() => {
    restoreDataTransfer?.();
    restoreDataTransfer = undefined;
});

describe('DOM file utilities', () => {
    it('normalizes iterable selections to the multiple contract', () => {
        const first = new File(['first'], 'first.txt');
        const second = new File(['second'], 'second.txt');
        const files = new Set([first, second]);

        expect(normalizeSelectedFiles(files, true)).toEqual([first, second]);
        expect(normalizeSelectedFiles(files, false)).toEqual([first]);
    });

    it('compares native selections by file identity and order', () => {
        const first = new File(['first'], 'first.txt');
        const second = new File(['second'], 'second.txt');

        expect(haveSameFiles(createFileList([first, second]), [first, second])).toBe(true);
        expect(haveSameFiles(createFileList([second, first]), [first, second])).toBe(false);
        expect(haveSameFiles(null, [])).toBe(false);
    });

    it('replaces a native selection through the input owner window', () => {
        restoreDataTransfer = installDataTransferStub();
        const input = document.createElement('input');
        const file = new File(['resume'], 'resume.pdf');
        makeInputFilesMutable(input);

        expect(replaceInputFiles(input, [file])).toBe(true);
        expect(Array.from(input.files ?? [])).toEqual([file]);
        expect(replaceInputFiles(input, [file])).toBe(true);
    });

    it('clears empty selections and reports unsupported native replacement', () => {
        const input = document.createElement('input');
        input.type = 'file';

        expect(replaceInputFiles(input, [])).toBe(true);
        expect(input.value).toBe('');

        restoreDataTransfer = replaceDataTransferConstructor(undefined);
        expect(replaceInputFiles(input, [new File(['file'], 'file.txt')])).toBe(false);
    });

    it('reports a rejected native FileList assignment', () => {
        restoreDataTransfer = installDataTransferStub();
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', {
            configurable: true,
            get: () => createFileList([]),
            set: () => {
                throw new DOMException('Read only');
            },
        });

        expect(replaceInputFiles(input, [new File(['file'], 'file.txt')])).toBe(false);
    });
});
