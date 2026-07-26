import { createDocument, type Editor as TiptapEditor } from '@tiptap/core';
import { history } from '@tiptap/pm/history';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Selection, TextSelection, type Transaction } from '@tiptap/pm/state';

import type { EditorModelValue, EditorOutput } from './types';

const editorHistoryPlugin = history();
const CONTENT_REPLACEMENT_META = 'ropavEditorContentReplacement';

export interface EditorSelectionSnapshot {
    anchor: number;
    head: number;
    json: unknown;
}

export interface EditorHistorySnapshot {
    state: unknown;
}

interface EditorContentReplacement {
    history?: EditorHistorySnapshot;
    selection?: EditorSelectionSnapshot;
}

export function readEditorContent(editor: TiptapEditor, output: EditorOutput): EditorModelValue {
    return output === 'json' ? editor.getJSON() : editor.getHTML();
}

export function isEditorModelValueEqual(
    editor: TiptapEditor,
    current: EditorModelValue,
    next: EditorModelValue,
): boolean {
    return createDocument(current, editor.schema).eq(createDocument(next, editor.schema));
}

export function isEditorContentEqual(editor: TiptapEditor, content: EditorModelValue): boolean {
    return editor.state.doc.eq(createDocument(content, editor.schema));
}

export function isEditorContentReplacement(transaction: Transaction): boolean {
    return transaction.getMeta(CONTENT_REPLACEMENT_META) === true;
}

export function readEditorHistory(editor: TiptapEditor): EditorHistorySnapshot | undefined {
    const state = editorHistoryPlugin.getState(editor.state);
    return state === undefined ? undefined : { state };
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
    replacement: EditorContentReplacement = {},
): boolean {
    if (isEditorContentEqual(editor, content)) return false;

    const chain = editor
        .chain()
        .setContent(content, { emitUpdate: false })
        .command(({ tr }) => {
            tr.setMeta('addToHistory', false).setMeta(CONTENT_REPLACEMENT_META, true);
            return true;
        });
    const selection = replacement.selection;
    if (selection) {
        chain.command(({ tr }) => {
            tr.setSelection(resolveEditorSelection(tr.doc, selection));
            return true;
        });
    }
    if (!chain.run()) return false;

    restoreEditorHistory(
        editor,
        replacement.history ?? createEmptyEditorHistory(editor, editor.state.doc),
    );
    return true;
}

export function restoreEditorHistory(
    editor: TiptapEditor,
    snapshot: EditorHistorySnapshot | undefined,
): boolean {
    if (!snapshot) return false;

    const transaction = editor.state.tr.setMeta('addToHistory', false);
    setEditorHistory(transaction, snapshot);
    editor.view.dispatch(transaction);
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

function createEmptyEditorHistory(
    editor: TiptapEditor,
    document: ProseMirrorNode,
): EditorHistorySnapshot | undefined {
    const stateField = editorHistoryPlugin.spec.state;
    if (!stateField || editorHistoryPlugin.getState(editor.state) === undefined) return undefined;

    return {
        state: stateField.init(
            {
                doc: document,
                plugins: editor.state.plugins,
                schema: editor.schema,
            },
            editor.state,
        ),
    };
}

function setEditorHistory(transaction: Transaction, snapshot: EditorHistorySnapshot | undefined) {
    if (snapshot) {
        transaction.setMeta(editorHistoryPlugin, { historyState: snapshot.state });
    }
}
