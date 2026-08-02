import { describe, expect, it } from 'vitest';
import { createDropzonePolicy } from './dropzoneModel';

describe('dropzoneModel', () => {
    it('matches exact MIME types, wildcards, and file extensions', () => {
        const image = new File(['image'], 'PHOTO.PNG', { type: 'image/png' });
        const document = new File(['document'], 'report.PDF', { type: '' });

        expect(
            createDropzonePolicy({ accept: 'image/*', multiple: true }).commit([image])
                .acceptedFiles,
        ).toEqual([image]);
        expect(
            createDropzonePolicy({ accept: 'image/png', multiple: true }).commit([image])
                .acceptedFiles,
        ).toEqual([image]);
        expect(
            createDropzonePolicy({ accept: '.pdf', multiple: true }).commit([document])
                .acceptedFiles,
        ).toEqual([document]);
        expect(
            createDropzonePolicy({ accept: 'image/*,.txt', multiple: true }).commit([document])
                .acceptedFiles,
        ).toEqual([]);
        expect(createDropzonePolicy({ multiple: true }).commit([document]).acceptedFiles).toEqual([
            document,
        ]);
    });

    it('collects type and size errors for rejected files', () => {
        const file = new File(['too large'], 'notes.txt', { type: 'text/plain' });
        const selection = createDropzonePolicy({
            accept: 'image/*',
            multiple: true,
            maxSize: 2,
        }).commit([file]);

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

        const multipleSelection = createDropzonePolicy({
            multiple: true,
            maxFiles: 2,
        }).commit(files);
        const singleSelection = createDropzonePolicy({
            multiple: false,
            maxFiles: 4,
        }).commit(files);

        expect(multipleSelection.acceptedFiles).toEqual(files.slice(0, 2));
        expect(multipleSelection.rejections[0]?.errors[0]?.code).toBe('too-many-files');
        expect(singleSelection.acceptedFiles).toEqual(files.slice(0, 1));
        expect(singleSelection.rejections).toHaveLength(2);
    });

    it('accepts a protected drag with a compatible MIME type', () => {
        expect(
            createDropzonePolicy({
                accept: 'image/*',
                multiple: true,
            }).preview([{ kind: 'file', type: 'image/png' }]),
        ).toBe('accept');
    });

    it('rejects a protected drag with a known incompatible MIME type', () => {
        expect(
            createDropzonePolicy({
                accept: 'image/*',
                multiple: true,
            }).preview([{ kind: 'file', type: 'text/plain' }]),
        ).toBe('reject');
    });

    it('keeps protected drags optimistic when type acceptance cannot be decided', () => {
        expect(
            createDropzonePolicy({
                accept: 'image/*',
                multiple: true,
            }).preview([{ kind: 'file', type: '' }]),
        ).toBe('accept');
        expect(
            createDropzonePolicy({ accept: 'image/*', multiple: true }).preview([
                { kind: 'file', type: 'application/octet-stream' },
            ]),
        ).toBe('accept');
        expect(
            createDropzonePolicy({
                accept: '.pdf',
                multiple: true,
            }).preview([{ kind: 'file', type: 'text/plain' }]),
        ).toBe('accept');
    });

    it('rejects protected drags that exceed the single or configured file limit', () => {
        const items = [
            { kind: 'file', type: 'image/png' },
            { kind: 'file', type: 'image/jpeg' },
        ];

        expect(createDropzonePolicy({ multiple: false, maxFiles: 4 }).preview(items)).toBe(
            'reject',
        );
        expect(createDropzonePolicy({ multiple: true, maxFiles: 1 }).preview(items)).toBe('reject');
    });
});
