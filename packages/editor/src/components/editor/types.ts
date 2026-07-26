import type {
    Editor as TiptapEditor,
    EditorOptions as TiptapEditorOptions,
    Extensions,
    JSONContent,
} from '@tiptap/core';
import type { StylesApiProps } from 'ropav';

export const editorParts = ['root', 'toolbar', 'content'] as const;
export type EditorPart = (typeof editorParts)[number];

export type EditorModelValue = string | JSONContent;

export type EditorOutput = 'html' | 'json';

export type EditorToolbarAction =
    | 'paragraph'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'heading-4'
    | 'heading-5'
    | 'heading-6'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'bullet-list'
    | 'ordered-list'
    | 'blockquote'
    | 'code-block'
    | 'horizontal-rule'
    | 'undo'
    | 'redo';

export type EditorToolbarBlock =
    | 'paragraph'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'heading-4'
    | 'heading-5'
    | 'heading-6';

export interface EditorToolbarActionState {
    readonly available: boolean;
    readonly active: boolean;
    readonly disabled: boolean;
}

export interface EditorToolbarState {
    readonly block: EditorToolbarBlock | null;
    readonly actions: Readonly<Record<EditorToolbarAction, EditorToolbarActionState>>;
}

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
