<template>
    <div v-bind="rootAttrs">
        <Toolbar v-if="showToolbar" v-bind="toolbarAttrs" :aria-label="toolbarAriaLabel">
            <slot name="toolbar" v-bind="toolbarSlotProps">
                <EditorToolbar :state="toolbarState" :run="runToolbarAction" />
            </slot>
        </Toolbar>
        <div ref="host" v-bind="contentAttrs"></div>
    </div>
</template>

<script setup lang="ts" vapor>
import { StarterKit } from '@tiptap/starter-kit';
import { Toolbar } from 'ropav';
import { computed, shallowRef, useAttrs } from 'vue';

import EditorToolbar from './editor-toolbar.vue';
import { splitEditorFallthroughAttributes } from './editorAttributesModel';
import { useEditor } from './useEditor';
import { useEditorToolbar } from './useEditorToolbar';
import type { EditorModelValue, EditorPart, EditorProps, EditorToolbarSlotProps } from './types';
import type { Editor as TiptapEditor } from '@tiptap/core';

defineOptions({ name: 'RpEditor', inheritAttrs: false });

const props = withDefaults(defineProps<EditorProps>(), {
    modelValue: undefined,
    defaultValue: '',
    output: 'html',
    extensions: () => [StarterKit],
    editable: true,
    toolbar: true,
    toolbarAriaLabel: 'Text formatting',
    autofocus: false,
    editorProps: () => ({}),
    injectCSS: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: EditorModelValue];
    ready: [editor: TiptapEditor];
    destroy: [editor: TiptapEditor];
}>();

const slots = defineSlots<{
    toolbar?(props: EditorToolbarSlotProps): unknown;
}>();

const attrs = useAttrs();
const host = shallowRef<HTMLElement | null>(null);
const fallthroughAttributes = computed(() =>
    splitEditorFallthroughAttributes(attrs, props.editable),
);
const { editor, focus } = useEditor({
    host,
    modelValue: () => props.modelValue,
    initialContent: () => props.modelValue ?? props.defaultValue,
    output: () => props.output,
    extensions: () => props.extensions,
    editable: () => props.editable,
    autofocus: () => props.autofocus,
    editorProps: () => props.editorProps,
    controlAttributes: () => fallthroughAttributes.value.controlAttributes,
    injectCSS: () => props.injectCSS,
    onReady: (instance) => emit('ready', instance),
    onUpdate: (content) => emit('update:modelValue', content),
    onDestroy: (instance) => emit('destroy', instance),
});
const { state: toolbarState, run: runToolbarAction } = useEditorToolbar(
    editor,
    () => props.editable,
);

const rootAttrs = computed(() => ({
    ...fallthroughAttributes.value.rootAttributes,
    class: ['rp-editor', props.classNames?.root, attrs.class],
    style: [props.styles?.root, attrs.style],
    'data-readonly': props.editable ? undefined : '',
}));
const showToolbar = computed(
    () =>
        props.toolbar &&
        props.editable &&
        (Boolean(slots.toolbar) ||
            Object.values(toolbarState.value.actions).some((action) => action.available)),
);
const toolbarAttrs = computed(() => getPartAttrs('toolbar', 'rp-editor__toolbar'));
const contentAttrs = computed(() => getPartAttrs('content', 'rp-editor__content'));
const toolbarSlotProps = computed<EditorToolbarSlotProps>(() => ({
    editor: editor.value,
    state: toolbarState.value,
    run: runToolbarAction,
}));

function getPartAttrs(part: EditorPart, className: string) {
    return {
        class: [className, props.classNames?.[part]],
        style: props.styles?.[part],
    };
}

defineExpose({ editor, nativeElement: host, focus });
</script>

<style src="./editor.css" scoped></style>
