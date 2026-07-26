<template>
    <div class="rp-editor-toolbar">
        <select
            v-if="availableBlockOptions.length > 0"
            class="rp-editor-toolbar__select"
            aria-label="Text style"
            title="Text style"
            :value="state.block ?? ''"
            :disabled="blockSelectDisabled || undefined"
            @change="onBlockChange"
        >
            <option v-if="state.block === null" value="" disabled>Text style</option>
            <option
                v-for="option in availableBlockOptions"
                :key="option.action"
                :value="option.action"
                :disabled="state.actions[option.action].disabled || undefined"
            >
                {{ option.label }}
            </option>
        </select>

        <span v-if="hasInlineActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions.bold.available"
                v-bind="getButtonAttrs('bold', 'Bold', true)"
                @click="invokeAction('bold')"
            >
                <IconBold />
            </button>
            <button
                v-if="state.actions.italic.available"
                v-bind="getButtonAttrs('italic', 'Italic', true)"
                @click="invokeAction('italic')"
            >
                <IconItalic />
            </button>
            <button
                v-if="state.actions.underline.available"
                v-bind="getButtonAttrs('underline', 'Underline', true)"
                @click="invokeAction('underline')"
            >
                <IconUnderline />
            </button>
            <button
                v-if="state.actions.strike.available"
                v-bind="getButtonAttrs('strike', 'Strikethrough', true)"
                @click="invokeAction('strike')"
            >
                <IconStrikethrough />
            </button>
            <button
                v-if="state.actions.code.available"
                v-bind="getButtonAttrs('code', 'Inline code', true)"
                @click="invokeAction('code')"
            >
                <IconCode />
            </button>
        </span>

        <span v-if="hasListActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions['bullet-list'].available"
                v-bind="getButtonAttrs('bullet-list', 'Bullet list', true)"
                @click="invokeAction('bullet-list')"
            >
                <IconList />
            </button>
            <button
                v-if="state.actions['ordered-list'].available"
                v-bind="getButtonAttrs('ordered-list', 'Ordered list', true)"
                @click="invokeAction('ordered-list')"
            >
                <IconListOrdered />
            </button>
        </span>

        <span v-if="hasBlockActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions.blockquote.available"
                v-bind="getButtonAttrs('blockquote', 'Blockquote', true)"
                @click="invokeAction('blockquote')"
            >
                <IconQuote />
            </button>
            <button
                v-if="state.actions['code-block'].available"
                v-bind="getButtonAttrs('code-block', 'Code block', true)"
                @click="invokeAction('code-block')"
            >
                <IconSquareCode />
            </button>
            <button
                v-if="state.actions['horizontal-rule'].available"
                v-bind="getButtonAttrs('horizontal-rule', 'Horizontal rule')"
                @click="invokeAction('horizontal-rule')"
            >
                <IconMinus />
            </button>
        </span>

        <span v-if="hasHistoryActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions.undo.available"
                v-bind="getButtonAttrs('undo', 'Undo')"
                @click="invokeAction('undo')"
            >
                <IconUndo />
            </button>
            <button
                v-if="state.actions.redo.available"
                v-bind="getButtonAttrs('redo', 'Redo')"
                @click="invokeAction('redo')"
            >
                <IconRedo />
            </button>
        </span>
    </div>
</template>

<script setup lang="ts" vapor>
import { computed } from 'vue';
import IconBold from '~icons/lucide/bold';
import IconCode from '~icons/lucide/code';
import IconItalic from '~icons/lucide/italic';
import IconList from '~icons/lucide/list';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconMinus from '~icons/lucide/minus';
import IconQuote from '~icons/lucide/quote';
import IconRedo from '~icons/lucide/redo-2';
import IconSquareCode from '~icons/lucide/square-code';
import IconStrikethrough from '~icons/lucide/strikethrough';
import IconUnderline from '~icons/lucide/underline';
import IconUndo from '~icons/lucide/undo-2';

import type { EditorToolbarAction, EditorToolbarBlock, EditorToolbarState } from './types';

defineOptions({ name: 'RpEditorToolbar' });

const props = defineProps<{
    state: EditorToolbarState;
    run: (action: EditorToolbarAction) => boolean;
}>();

const blockOptions = [
    { action: 'paragraph', label: 'Paragraph' },
    { action: 'heading-1', label: 'Heading 1' },
    { action: 'heading-2', label: 'Heading 2' },
    { action: 'heading-3', label: 'Heading 3' },
    { action: 'heading-4', label: 'Heading 4' },
    { action: 'heading-5', label: 'Heading 5' },
    { action: 'heading-6', label: 'Heading 6' },
] as const satisfies readonly { action: EditorToolbarBlock; label: string }[];

const availableBlockOptions = computed(() =>
    blockOptions.filter((option) => props.state.actions[option.action].available),
);
const blockSelectDisabled = computed(() =>
    availableBlockOptions.value.every((option) => props.state.actions[option.action].disabled),
);
const hasInlineActions = computed(() =>
    hasAvailableAction(['bold', 'italic', 'underline', 'strike', 'code']),
);
const hasListActions = computed(() => hasAvailableAction(['bullet-list', 'ordered-list']));
const hasBlockActions = computed(() =>
    hasAvailableAction(['blockquote', 'code-block', 'horizontal-rule']),
);
const hasHistoryActions = computed(() => hasAvailableAction(['undo', 'redo']));

function hasAvailableAction(actions: EditorToolbarAction[]) {
    return actions.some((action) => props.state.actions[action].available);
}

function getButtonAttrs(action: EditorToolbarAction, label: string, toggle = false) {
    const actionState = props.state.actions[action];
    return {
        type: 'button' as const,
        class: 'rp-editor-toolbar__button',
        title: label,
        'aria-label': label,
        'aria-pressed': toggle ? actionState.active : undefined,
        disabled: actionState.disabled || undefined,
        onMousedown: preserveSelection,
    };
}

function preserveSelection(event: MouseEvent) {
    event.preventDefault();
}

function invokeAction(action: EditorToolbarAction) {
    props.run(action);
}

function onBlockChange(event: Event) {
    const action = (event.currentTarget as HTMLSelectElement).value as EditorToolbarBlock;
    props.run(action);
}
</script>

<style src="./editor-toolbar.css" scoped></style>
