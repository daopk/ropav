import type {
    Editor as TiptapEditor,
    EditorOptions as TiptapEditorOptions,
    Extensions,
    JSONContent,
} from '@tiptap/core';
import type { StylesApiProps } from 'ropav';

import type { EditorToolbarAction, EditorToolbarState } from './editorFormattingModel';

export type {
    EditorToolbarAction,
    EditorToolbarActionState,
    EditorToolbarBlock,
    EditorToolbarState,
} from './editorFormattingModel';

export const editorParts = ['root', 'toolbar', 'content'] as const;
export type EditorPart = (typeof editorParts)[number];

export type EditorModelValue = string | JSONContent;

export type EditorOutput = 'html' | 'json';

export interface EditorToolbarSlotProps {
    readonly editor: TiptapEditor | null;
    readonly state: EditorToolbarState;
    run: (action: EditorToolbarAction) => boolean;
}

export interface EditorProps extends StylesApiProps<EditorPart> {
    modelValue?: EditorModelValue;
    defaultValue?: EditorModelValue;
    output?: EditorOutput;
    extensions?: Extensions;
    editable?: boolean;
    toolbar?: boolean;
    toolbarAriaLabel?: string;
    autofocus?: TiptapEditorOptions['autofocus'];
    editorProps?: TiptapEditorOptions['editorProps'];
    injectCSS?: boolean;
}

export interface EditorComponentExposed {
    readonly editor: TiptapEditor | null;
    readonly nativeElement: HTMLElement | null;
    focus: () => boolean;
}
