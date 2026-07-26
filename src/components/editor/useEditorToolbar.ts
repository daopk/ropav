import { computed, shallowRef, watch, type ShallowRef } from 'vue';

import type {
    EditorToolbarAction,
    EditorToolbarActionState,
    EditorToolbarBlock,
    EditorToolbarState,
} from './types';
import type { Editor as TiptapEditor } from '@tiptap/core';

const toolbarActions = [
    'paragraph',
    'heading-1',
    'heading-2',
    'heading-3',
    'heading-4',
    'heading-5',
    'heading-6',
    'bold',
    'italic',
    'underline',
    'strike',
    'code',
    'bullet-list',
    'ordered-list',
    'blockquote',
    'code-block',
    'horizontal-rule',
    'undo',
    'redo',
] as const satisfies readonly EditorToolbarAction[];

const headingActions = [
    'heading-1',
    'heading-2',
    'heading-3',
    'heading-4',
    'heading-5',
    'heading-6',
] as const satisfies readonly EditorToolbarBlock[];

const actionExtensionNames: Record<EditorToolbarAction, string> = {
    paragraph: 'paragraph',
    'heading-1': 'heading',
    'heading-2': 'heading',
    'heading-3': 'heading',
    'heading-4': 'heading',
    'heading-5': 'heading',
    'heading-6': 'heading',
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strike: 'strike',
    code: 'code',
    'bullet-list': 'bulletList',
    'ordered-list': 'orderedList',
    blockquote: 'blockquote',
    'code-block': 'codeBlock',
    'horizontal-rule': 'horizontalRule',
    undo: 'undoRedo',
    redo: 'undoRedo',
};

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
        const instance = editor.value;
        const isEditable = editable();

        if (!instance || instance.isDestroyed) {
            return {
                block: null,
                actions: createEmptyActionStates(),
            };
        }

        const extensionNames = new Set(
            instance.extensionManager.extensions.map((extension) => extension.name),
        );
        const actions = Object.fromEntries(
            toolbarActions.map((action) => {
                const available = isActionAvailable(instance, extensionNames, action);
                const active = available && isActionActive(instance, action);
                const actionState: EditorToolbarActionState = {
                    available,
                    active,
                    disabled:
                        !isEditable || !available || (!active && !canRunAction(instance, action)),
                };
                return [action, actionState];
            }),
        ) as Record<EditorToolbarAction, EditorToolbarActionState>;

        return {
            block: resolveActiveBlock(instance, actions),
            actions,
        };
    });

    function run(action: EditorToolbarAction) {
        const instance = editor.value;
        if (
            !editable() ||
            !instance ||
            instance.isDestroyed ||
            state.value.actions[action].disabled
        ) {
            return false;
        }

        return runAction(instance, action);
    }

    return { state, run };
}

function createEmptyActionStates(): Record<EditorToolbarAction, EditorToolbarActionState> {
    return Object.fromEntries(
        toolbarActions.map((action) => [
            action,
            { available: false, active: false, disabled: true },
        ]),
    ) as Record<EditorToolbarAction, EditorToolbarActionState>;
}

function isActionAvailable(
    editor: TiptapEditor,
    extensionNames: ReadonlySet<string>,
    action: EditorToolbarAction,
) {
    if (!extensionNames.has(actionExtensionNames[action])) return false;
    const headingLevel = getHeadingLevel(action);
    if (!headingLevel) return true;

    const headingExtension = editor.extensionManager.extensions.find(
        (extension) => extension.name === 'heading',
    );
    const configuredLevels = headingExtension?.options.levels;
    return !Array.isArray(configuredLevels) || configuredLevels.includes(headingLevel);
}

function isActionActive(editor: TiptapEditor, action: EditorToolbarAction) {
    const headingLevel = getHeadingLevel(action);
    if (headingLevel) return editor.isActive('heading', { level: headingLevel });

    switch (action) {
        case 'paragraph':
            return editor.isActive('paragraph');
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strike':
        case 'code':
            return editor.isActive(action);
        case 'bullet-list':
            return editor.isActive('bulletList');
        case 'ordered-list':
            return editor.isActive('orderedList');
        case 'blockquote':
            return editor.isActive('blockquote');
        case 'code-block':
            return editor.isActive('codeBlock');
        case 'horizontal-rule':
        case 'undo':
        case 'redo':
            return false;
        default:
            return false;
    }
}

function resolveActiveBlock(
    editor: TiptapEditor,
    actions: Readonly<Record<EditorToolbarAction, EditorToolbarActionState>>,
): EditorToolbarBlock | null {
    for (const action of headingActions) {
        if (actions[action].active) return action;
    }
    return editor.isActive('paragraph') && actions.paragraph.available ? 'paragraph' : null;
}

function canRunAction(editor: TiptapEditor, action: EditorToolbarAction) {
    try {
        return executeAction(editor, action, true);
    } catch {
        return false;
    }
}

function runAction(editor: TiptapEditor, action: EditorToolbarAction) {
    try {
        return executeAction(editor, action, false);
    } catch {
        return false;
    }
}

function executeAction(editor: TiptapEditor, action: EditorToolbarAction, dryRun: boolean) {
    const focusOptions = { scrollIntoView: false };
    const chain = dryRun
        ? editor.can().chain().focus(undefined, focusOptions)
        : editor.chain().focus(undefined, focusOptions);
    const headingLevel = getHeadingLevel(action);
    if (headingLevel) return chain.setHeading({ level: headingLevel }).run();

    switch (action) {
        case 'paragraph':
            return chain.setParagraph().run();
        case 'bold':
            return chain.toggleBold().run();
        case 'italic':
            return chain.toggleItalic().run();
        case 'underline':
            return chain.toggleUnderline().run();
        case 'strike':
            return chain.toggleStrike().run();
        case 'code':
            return chain.toggleCode().run();
        case 'bullet-list':
            return chain.toggleBulletList().run();
        case 'ordered-list':
            return chain.toggleOrderedList().run();
        case 'blockquote':
            return chain.toggleBlockquote().run();
        case 'code-block':
            return chain.toggleCodeBlock().run();
        case 'horizontal-rule':
            return chain.setHorizontalRule().run();
        case 'undo':
            return chain.undo().run();
        case 'redo':
            return chain.redo().run();
        default:
            return false;
    }
}

function getHeadingLevel(action: EditorToolbarAction): 1 | 2 | 3 | 4 | 5 | 6 | null {
    switch (action) {
        case 'heading-1':
            return 1;
        case 'heading-2':
            return 2;
        case 'heading-3':
            return 3;
        case 'heading-4':
            return 4;
        case 'heading-5':
            return 5;
        case 'heading-6':
            return 6;
        default:
            return null;
    }
}
