import { Editor as TiptapEditor, type JSONContent } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { replaceEditorContent } from './editorContentModel';

let editor: TiptapEditor | undefined;

afterEach(() => {
    editor?.destroy();
    editor = undefined;
});

describe('editorContentModel', () => {
    it('does not replace semantically equal noncanonical HTML', () => {
        editor = createEditor('<p>A</p>');

        expect(replaceEditorContent(editor, '\n<p>A</p>\n')).toBe(false);
    });

    it('does not replace semantically equal JSON with reordered keys', () => {
        editor = createEditor('<p>A</p>');
        const reorderedContent = {
            content: [
                {
                    content: [{ text: 'A', type: 'text' }],
                    type: 'paragraph',
                },
            ],
            type: 'doc',
        } satisfies JSONContent;

        expect(replaceEditorContent(editor, reorderedContent)).toBe(false);
    });
});

function createEditor(content: string) {
    return new TiptapEditor({
        content,
        extensions: [StarterKit],
    });
}
