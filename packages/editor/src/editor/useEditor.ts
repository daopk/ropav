import { Editor as TiptapEditor, type EditorOptions as TiptapEditorOptions } from '@tiptap/core';
import { onBeforeUnmount, onMounted, shallowRef, watch, type ShallowRef } from 'vue';

import { readEditorContent, replaceEditorContent } from './editorContentModel';
import type { EditorModelValue, EditorOutput } from './types';

interface UseEditorOptions {
    host: ShallowRef<HTMLElement | null>;
    modelValue: () => EditorModelValue | undefined;
    initialContent: () => EditorModelValue;
    output: () => EditorOutput;
    extensions: () => TiptapEditorOptions['extensions'];
    editable: () => boolean;
    autofocus: () => TiptapEditorOptions['autofocus'];
    editorProps: () => TiptapEditorOptions['editorProps'];
    injectCSS: () => boolean;
    onReady: (editor: TiptapEditor) => void;
    onUpdate: (content: EditorModelValue) => void;
    onDestroy: (editor: TiptapEditor) => void;
}

export function useEditor(options: UseEditorOptions) {
    const editor = shallowRef<TiptapEditor | null>(null);

    onMounted(() => {
        const host = options.host.value;
        if (!host) return;

        const instance = new TiptapEditor({
            element: host,
            content: options.initialContent(),
            extensions: options.extensions(),
            editable: options.editable(),
            autofocus: options.autofocus(),
            editorProps: options.editorProps(),
            injectCSS: options.injectCSS(),
            onUpdate: ({ editor: updatedEditor }) => {
                options.onUpdate(readEditorContent(updatedEditor, options.output()));
            },
        });

        editor.value = instance;
        options.onReady(instance);
    });

    watch(
        options.modelValue,
        (content) => {
            if (content === undefined || !editor.value) return;
            replaceEditorContent(editor.value, content);
        },
        { deep: true },
    );

    watch(options.editable, (editable) => {
        editor.value?.setEditable(editable, false);
    });

    watch(
        options.editorProps,
        (editorProps) => {
            editor.value?.setOptions({ editorProps });
        },
        { deep: true },
    );

    onBeforeUnmount(() => {
        const instance = editor.value;
        if (!instance) return;

        instance.destroy();
        editor.value = null;
        options.onDestroy(instance);
    });

    function focus() {
        return editor.value?.commands.focus() ?? false;
    }

    return { editor, focus };
}
