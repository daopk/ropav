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
                v-bind="getButtonAttrs('bold')"
                @click="invokeAction('bold')"
            >
                <IconBold />
            </button>
            <button
                v-if="state.actions.italic.available"
                v-bind="getButtonAttrs('italic')"
                @click="invokeAction('italic')"
            >
                <IconItalic />
            </button>
            <button
                v-if="state.actions.underline.available"
                v-bind="getButtonAttrs('underline')"
                @click="invokeAction('underline')"
            >
                <IconUnderline />
            </button>
            <button
                v-if="state.actions.strike.available"
                v-bind="getButtonAttrs('strike')"
                @click="invokeAction('strike')"
            >
                <IconStrikethrough />
            </button>
            <button
                v-if="state.actions.code.available"
                v-bind="getButtonAttrs('code')"
                @click="invokeAction('code')"
            >
                <IconCode />
            </button>
        </span>

        <span v-if="hasListActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions['bullet-list'].available"
                v-bind="getButtonAttrs('bullet-list')"
                @click="invokeAction('bullet-list')"
            >
                <IconList />
            </button>
            <button
                v-if="state.actions['ordered-list'].available"
                v-bind="getButtonAttrs('ordered-list')"
                @click="invokeAction('ordered-list')"
            >
                <IconListOrdered />
            </button>
        </span>

        <span v-if="hasBlockActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions.blockquote.available"
                v-bind="getButtonAttrs('blockquote')"
                @click="invokeAction('blockquote')"
            >
                <IconQuote />
            </button>
            <button
                v-if="state.actions['code-block'].available"
                v-bind="getButtonAttrs('code-block')"
                @click="invokeAction('code-block')"
            >
                <IconSquareCode />
            </button>
            <button
                v-if="state.actions['horizontal-rule'].available"
                v-bind="getButtonAttrs('horizontal-rule')"
                @click="invokeAction('horizontal-rule')"
            >
                <IconMinus />
            </button>
        </span>

        <span v-if="hasHistoryActions" class="rp-editor-toolbar__group">
            <button
                v-if="state.actions.undo.available"
                v-bind="getButtonAttrs('undo')"
                @click="invokeAction('undo')"
            >
                <IconUndo />
            </button>
            <button
                v-if="state.actions.redo.available"
                v-bind="getButtonAttrs('redo')"
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

import {
    editorToolbarBlockOptions,
    getEditorToolbarActionPresentation,
    hasAvailableEditorToolbarActionsInGroup,
} from './editorFormattingModel';
import type { EditorToolbarAction, EditorToolbarBlock, EditorToolbarState } from './types';

defineOptions({ name: 'RpEditorToolbar' });

const props = defineProps<{
    state: EditorToolbarState;
    run: (action: EditorToolbarAction) => boolean;
}>();

const availableBlockOptions = computed(() =>
    editorToolbarBlockOptions.filter((option) => props.state.actions[option.action].available),
);
const blockSelectDisabled = computed(() =>
    availableBlockOptions.value.every((option) => props.state.actions[option.action].disabled),
);
const hasInlineActions = computed(() =>
    hasAvailableEditorToolbarActionsInGroup(props.state, 'inline'),
);
const hasListActions = computed(() => hasAvailableEditorToolbarActionsInGroup(props.state, 'list'));
const hasBlockActions = computed(() =>
    hasAvailableEditorToolbarActionsInGroup(props.state, 'block'),
);
const hasHistoryActions = computed(() =>
    hasAvailableEditorToolbarActionsInGroup(props.state, 'history'),
);

function getButtonAttrs(action: EditorToolbarAction) {
    const actionState = props.state.actions[action];
    const presentation = getEditorToolbarActionPresentation(action);
    return {
        type: 'button' as const,
        class: 'rp-editor-toolbar__button',
        title: presentation.label,
        'aria-label': presentation.label,
        'aria-pressed': presentation.toggle ? actionState.active : undefined,
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
