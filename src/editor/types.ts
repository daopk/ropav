import type {
    Editor as TiptapEditor,
    EditorOptions as TiptapEditorOptions,
    Extensions,
    JSONContent,
} from '@tiptap/core';
import type { StylesApiProps } from 'ropav';

export const editorParts = ['root', 'content'] as const;
export type EditorPart = (typeof editorParts)[number];

export type EditorModelValue = string | JSONContent;

export type EditorOutput = 'html' | 'json';

export interface EditorProps extends StylesApiProps<EditorPart> {
    modelValue?: EditorModelValue;
    defaultValue?: EditorModelValue;
    output?: EditorOutput;
    extensions?: Extensions;
    editable?: boolean;
    autofocus?: TiptapEditorOptions['autofocus'];
    editorProps?: TiptapEditorOptions['editorProps'];
    injectCSS?: boolean;
}

export interface EditorComponentExposed {
    readonly editor: TiptapEditor | null;
    readonly nativeElement: HTMLElement | null;
    focus: () => boolean;
}
