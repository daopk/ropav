import type { Editor as TiptapEditor, JSONContent } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Selection, TextSelection } from '@tiptap/pm/state';

import type { EditorModelValue, EditorOutput } from './types';

export interface EditorSelectionSnapshot {
    anchor: number;
    head: number;
    json: unknown;
}

export function readEditorContent(editor: TiptapEditor, output: EditorOutput): EditorModelValue {
    return output === 'json' ? editor.getJSON() : editor.getHTML();
}

export function isEditorModelValueEqual(
    current: EditorModelValue,
    next: EditorModelValue,
): boolean {
    if (typeof current === 'string' || typeof next === 'string') return current === next;
    return isJsonContentEqual(current, next);
}

export function isEditorContentEqual(editor: TiptapEditor, content: EditorModelValue): boolean {
    if (typeof content === 'string') return editor.getHTML() === content;
    return isJsonContentEqual(editor.getJSON(), content);
}

export function readEditorSelection(editor: TiptapEditor): EditorSelectionSnapshot {
    const { anchor, head } = editor.state.selection;
    return {
        anchor,
        head,
        json: editor.state.selection.toJSON(),
    };
}

export function replaceEditorContent(
    editor: TiptapEditor,
    content: EditorModelValue,
    selection?: EditorSelectionSnapshot,
): boolean {
    if (isEditorContentEqual(editor, content)) return false;

    const chain = editor.chain().setContent(content, { emitUpdate: false });
    if (selection) {
        chain.command(({ tr }) => {
            tr.setSelection(resolveEditorSelection(tr.doc, selection));
            return true;
        });
    }
    chain.run();
    return true;
}

function resolveEditorSelection(
    document: ProseMirrorNode,
    snapshot: EditorSelectionSnapshot,
): Selection {
    try {
        return Selection.fromJSON(document, snapshot.json);
    } catch {
        const anchor = clampPosition(snapshot.anchor, document.content.size);
        const head = clampPosition(snapshot.head, document.content.size);
        return TextSelection.between(document.resolve(anchor), document.resolve(head));
    }
}

function clampPosition(position: number, maximum: number) {
    return Math.min(Math.max(position, 0), maximum);
}

function isJsonContentEqual(current: JSONContent, next: JSONContent): boolean {
    return JSON.stringify(current) === JSON.stringify(next);
}
