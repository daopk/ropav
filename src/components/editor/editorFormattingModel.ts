import type { ChainedCommands, Editor as TiptapEditor } from '@tiptap/core';

type EditorToolbarActionGroup = 'text-style' | 'inline' | 'list' | 'block' | 'history';
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface EditorFormattingActionDefinition<
    Group extends EditorToolbarActionGroup = EditorToolbarActionGroup,
> {
    readonly extensionName: string;
    readonly group: Group;
    readonly label: string;
    readonly toggle: boolean;
    readonly isAvailable?: (editor: TiptapEditor) => boolean;
    readonly isActive?: (editor: TiptapEditor) => boolean;
    execute: (chain: ChainedCommands) => boolean;
}

function defineAction<const Group extends EditorToolbarActionGroup>(
    definition: EditorFormattingActionDefinition<Group>,
) {
    return definition;
}

function defineHeadingAction(level: HeadingLevel) {
    return defineAction({
        extensionName: 'heading',
        group: 'text-style',
        label: `Heading ${level}`,
        toggle: true,
        isAvailable: (editor) => {
            const headingExtension = editor.extensionManager.extensions.find(
                (extension) => extension.name === 'heading',
            );
            const configuredLevels = headingExtension?.options.levels;
            return !Array.isArray(configuredLevels) || configuredLevels.includes(level);
        },
        isActive: (editor) => editor.isActive('heading', { level }),
        execute: (chain) => chain.setHeading({ level }).run(),
    });
}

const editorFormattingActions = {
    paragraph: defineAction({
        extensionName: 'paragraph',
        group: 'text-style',
        label: 'Paragraph',
        toggle: true,
        isActive: (editor) => editor.isActive('paragraph'),
        execute: (chain) => chain.setParagraph().run(),
    }),
    'heading-1': defineHeadingAction(1),
    'heading-2': defineHeadingAction(2),
    'heading-3': defineHeadingAction(3),
    'heading-4': defineHeadingAction(4),
    'heading-5': defineHeadingAction(5),
    'heading-6': defineHeadingAction(6),
    bold: defineAction({
        extensionName: 'bold',
        group: 'inline',
        label: 'Bold',
        toggle: true,
        isActive: (editor) => editor.isActive('bold'),
        execute: (chain) => chain.toggleBold().run(),
    }),
    italic: defineAction({
        extensionName: 'italic',
        group: 'inline',
        label: 'Italic',
        toggle: true,
        isActive: (editor) => editor.isActive('italic'),
        execute: (chain) => chain.toggleItalic().run(),
    }),
    underline: defineAction({
        extensionName: 'underline',
        group: 'inline',
        label: 'Underline',
        toggle: true,
        isActive: (editor) => editor.isActive('underline'),
        execute: (chain) => chain.toggleUnderline().run(),
    }),
    strike: defineAction({
        extensionName: 'strike',
        group: 'inline',
        label: 'Strikethrough',
        toggle: true,
        isActive: (editor) => editor.isActive('strike'),
        execute: (chain) => chain.toggleStrike().run(),
    }),
    code: defineAction({
        extensionName: 'code',
        group: 'inline',
        label: 'Inline code',
        toggle: true,
        isActive: (editor) => editor.isActive('code'),
        execute: (chain) => chain.toggleCode().run(),
    }),
    'bullet-list': defineAction({
        extensionName: 'bulletList',
        group: 'list',
        label: 'Bullet list',
        toggle: true,
        isActive: (editor) => editor.isActive('bulletList'),
        execute: (chain) => chain.toggleBulletList().run(),
    }),
    'ordered-list': defineAction({
        extensionName: 'orderedList',
        group: 'list',
        label: 'Ordered list',
        toggle: true,
        isActive: (editor) => editor.isActive('orderedList'),
        execute: (chain) => chain.toggleOrderedList().run(),
    }),
    blockquote: defineAction({
        extensionName: 'blockquote',
        group: 'block',
        label: 'Blockquote',
        toggle: true,
        isActive: (editor) => editor.isActive('blockquote'),
        execute: (chain) => chain.toggleBlockquote().run(),
    }),
    'code-block': defineAction({
        extensionName: 'codeBlock',
        group: 'block',
        label: 'Code block',
        toggle: true,
        isActive: (editor) => editor.isActive('codeBlock'),
        execute: (chain) => chain.toggleCodeBlock().run(),
    }),
    'horizontal-rule': defineAction({
        extensionName: 'horizontalRule',
        group: 'block',
        label: 'Horizontal rule',
        toggle: false,
        execute: (chain) => chain.setHorizontalRule().run(),
    }),
    undo: defineAction({
        extensionName: 'undoRedo',
        group: 'history',
        label: 'Undo',
        toggle: false,
        execute: (chain) => chain.undo().run(),
    }),
    redo: defineAction({
        extensionName: 'undoRedo',
        group: 'history',
        label: 'Redo',
        toggle: false,
        execute: (chain) => chain.redo().run(),
    }),
} as const;

export type EditorToolbarAction = keyof typeof editorFormattingActions;

type EditorToolbarActionInGroup<Group extends EditorToolbarActionGroup> = {
    [Action in EditorToolbarAction]: (typeof editorFormattingActions)[Action]['group'] extends Group
        ? Action
        : never;
}[EditorToolbarAction];

export type EditorToolbarBlock = EditorToolbarActionInGroup<'text-style'>;

export interface EditorToolbarActionState {
    readonly available: boolean;
    readonly active: boolean;
    readonly disabled: boolean;
}

export interface EditorToolbarState {
    readonly block: EditorToolbarBlock | null;
    readonly actions: Readonly<Record<EditorToolbarAction, EditorToolbarActionState>>;
}

export interface EditorToolbarActionPresentation {
    readonly label: string;
    readonly toggle: boolean;
}

export interface EditorToolbarBlockOption {
    readonly action: EditorToolbarBlock;
    readonly label: string;
}

const editorToolbarActions = Object.keys(editorFormattingActions) as EditorToolbarAction[];

export const editorToolbarBlockOptions: readonly EditorToolbarBlockOption[] = editorToolbarActions
    .filter(isEditorToolbarBlock)
    .map((action) => ({
        action,
        label: editorFormattingActions[action].label,
    }));

export function getEditorToolbarState(
    editor: TiptapEditor | null,
    editable: boolean,
): EditorToolbarState {
    if (!editor || editor.isDestroyed) {
        return {
            block: null,
            actions: createEmptyActionStates(),
        };
    }

    const extensionNames = getExtensionNames(editor);
    const actions = Object.fromEntries(
        editorToolbarActions.map((action) => [
            action,
            getActionState(editor, extensionNames, editable, action),
        ]),
    ) as Record<EditorToolbarAction, EditorToolbarActionState>;

    return {
        block:
            editorToolbarBlockOptions.find((option) => actions[option.action].active)?.action ??
            null,
        actions,
    };
}

export function runEditorToolbarAction(
    editor: TiptapEditor | null,
    editable: boolean,
    action: EditorToolbarAction,
) {
    if (!editor || editor.isDestroyed) return false;

    const actionState = getActionState(editor, getExtensionNames(editor), editable, action);
    if (actionState.disabled) return false;

    return executeAction(editor, action, false);
}

export function getEditorToolbarActionPresentation(
    action: EditorToolbarAction,
): EditorToolbarActionPresentation {
    const definition = editorFormattingActions[action];
    return {
        label: definition.label,
        toggle: definition.toggle,
    };
}

export function hasAvailableEditorToolbarActionsInGroup(
    state: EditorToolbarState,
    group: Exclude<EditorToolbarActionGroup, 'text-style'>,
) {
    return editorToolbarActions.some(
        (action) =>
            editorFormattingActions[action].group === group && state.actions[action].available,
    );
}

function isEditorToolbarBlock(action: EditorToolbarAction): action is EditorToolbarBlock {
    return editorFormattingActions[action].group === 'text-style';
}

function createEmptyActionStates(): Record<EditorToolbarAction, EditorToolbarActionState> {
    return Object.fromEntries(
        editorToolbarActions.map((action) => [
            action,
            { available: false, active: false, disabled: true },
        ]),
    ) as Record<EditorToolbarAction, EditorToolbarActionState>;
}

function getExtensionNames(editor: TiptapEditor) {
    return new Set(editor.extensionManager.extensions.map((extension) => extension.name));
}

function getActionState(
    editor: TiptapEditor,
    extensionNames: ReadonlySet<string>,
    editable: boolean,
    action: EditorToolbarAction,
): EditorToolbarActionState {
    const definition = editorFormattingActions[action];
    const available =
        extensionNames.has(definition.extensionName) &&
        (!definition.isAvailable || definition.isAvailable(editor));
    const active = available && Boolean(definition.isActive?.(editor));

    return {
        available,
        active,
        disabled: !editable || !available || (!active && !executeAction(editor, action, true)),
    };
}

function executeAction(editor: TiptapEditor, action: EditorToolbarAction, dryRun: boolean) {
    try {
        const focusOptions = { scrollIntoView: false };
        const chain = dryRun
            ? editor.can().chain().focus(undefined, focusOptions)
            : editor.chain().focus(undefined, focusOptions);
        return editorFormattingActions[action].execute(chain);
    } catch {
        return false;
    }
}
