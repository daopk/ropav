import { describe, expect, it } from 'vitest';
import { getDropzoneDragStatus, isFileAccepted, processDropzoneFiles } from './dropzoneModel';

describe('dropzoneModel', () => {
    it('matches exact MIME types, wildcards, and file extensions', () => {
        const image = new File(['image'], 'PHOTO.PNG', { type: 'image/png' });
        const document = new File(['document'], 'report.PDF', { type: '' });

        expect(isFileAccepted(image, 'image/*')).toBe(true);
        expect(isFileAccepted(image, 'image/png')).toBe(true);
        expect(isFileAccepted(document, '.pdf')).toBe(true);
        expect(isFileAccepted(document, 'image/*,.txt')).toBe(false);
        expect(isFileAccepted(document, undefined)).toBe(true);
    });

    it('collects type and size errors for rejected files', () => {
        const file = new File(['too large'], 'notes.txt', { type: 'text/plain' });
        const selection = processDropzoneFiles([file], {
            accept: 'image/*',
            multiple: true,
            maxSize: 2,
        });

        expect(selection.acceptedFiles).toEqual([]);
        expect(selection.rejections).toHaveLength(1);
        expect(selection.rejections[0]?.errors.map(({ code }) => code)).toEqual([
            'file-invalid-type',
            'file-too-large',
        ]);
    });

    it('accepts valid files up to the effective file limit', () => {
        const files = [
            new File(['one'], 'one.txt', { type: 'text/plain' }),
            new File(['two'], 'two.txt', { type: 'text/plain' }),
            new File(['three'], 'three.txt', { type: 'text/plain' }),
        ];

        const multipleSelection = processDropzoneFiles(files, {
            multiple: true,
            maxFiles: 2,
        });
        const singleSelection = processDropzoneFiles(files, { multiple: false });

        expect(multipleSelection.acceptedFiles).toEqual(files.slice(0, 2));
        expect(multipleSelection.rejections[0]?.errors[0]?.code).toBe('too-many-files');
        expect(singleSelection.acceptedFiles).toEqual(files.slice(0, 1));
        expect(singleSelection.rejections).toHaveLength(2);
    });

    it('accepts a protected drag with a compatible MIME type', () => {
        expect(
            getDropzoneDragStatus([{ kind: 'file', type: 'image/png' }], {
                accept: 'image/*',
                multiple: true,
            }),
        ).toBe('accept');
    });

    it('rejects a protected drag with a known incompatible MIME type', () => {
        expect(
            getDropzoneDragStatus([{ kind: 'file', type: 'text/plain' }], {
                accept: 'image/*',
                multiple: true,
            }),
        ).toBe('reject');
    });

    it('keeps protected drags optimistic when type acceptance cannot be decided', () => {
        expect(
            getDropzoneDragStatus([{ kind: 'file', type: '' }], {
                accept: 'image/*',
                multiple: true,
            }),
        ).toBe('accept');
        expect(
            getDropzoneDragStatus([{ kind: 'file', type: 'application/octet-stream' }], {
                accept: 'image/*',
                multiple: true,
            }),
        ).toBe('accept');
        expect(
            getDropzoneDragStatus([{ kind: 'file', type: 'text/plain' }], {
                accept: '.pdf',
                multiple: true,
            }),
        ).toBe('accept');
    });

    it('rejects protected drags that exceed the single or configured file limit', () => {
        const items = [
            { kind: 'file', type: 'image/png' },
            { kind: 'file', type: 'image/jpeg' },
        ];

        expect(getDropzoneDragStatus(items, { multiple: false })).toBe('reject');
        expect(getDropzoneDragStatus(items, { multiple: true, maxFiles: 1 })).toBe('reject');
    });
});
