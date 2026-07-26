import type { Editor as TiptapEditor, JSONContent } from '@tiptap/core';

import type { EditorModelValue, EditorOutput } from './types';

export function readEditorContent(editor: TiptapEditor, output: EditorOutput): EditorModelValue {
    return output === 'json' ? editor.getJSON() : editor.getHTML();
}

export function isEditorContentEqual(editor: TiptapEditor, content: EditorModelValue): boolean {
    if (typeof content === 'string') return editor.getHTML() === content;
    return isJsonContentEqual(editor.getJSON(), content);
}

export function replaceEditorContent(editor: TiptapEditor, content: EditorModelValue): boolean {
    if (isEditorContentEqual(editor, content)) return false;

    editor.commands.setContent(content, { emitUpdate: false });
    return true;
}

function isJsonContentEqual(current: JSONContent, next: JSONContent): boolean {
    return JSON.stringify(current) === JSON.stringify(next);
}
