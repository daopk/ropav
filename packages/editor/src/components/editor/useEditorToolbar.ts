import { computed, shallowRef, watch, type ShallowRef } from 'vue';

import { getEditorToolbarState, runEditorToolbarAction } from './editorFormattingModel';
import type { EditorToolbarAction, EditorToolbarState } from './types';
import type { Editor as TiptapEditor } from '@tiptap/core';

export function useEditorToolbar(editor: ShallowRef<TiptapEditor | null>, editable: () => boolean) {
    const revision = shallowRef(0);

    watch(
        editor,
        (instance, _previous, onCleanup) => {
            revision.value += 1;
            if (!instance) return;

            const refresh = () => {
                revision.value += 1;
            };
            instance.on('transaction', refresh);
            onCleanup(() => instance.off('transaction', refresh));
        },
        { immediate: true },
    );

    const state = computed<EditorToolbarState>(() => {
        void revision.value;
        return getEditorToolbarState(editor.value, editable());
    });

    function run(action: EditorToolbarAction) {
        return runEditorToolbarAction(editor.value, editable(), action);
    }

    return { state, run };
}
