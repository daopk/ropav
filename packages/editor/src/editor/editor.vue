<template>
    <div v-bind="rootAttrs">
        <div ref="host" v-bind="contentAttrs"></div>
    </div>
</template>

<script setup lang="ts" vapor>
import { StarterKit } from '@tiptap/starter-kit';
import { computed, shallowRef, useAttrs } from 'vue';

import { useEditor } from './useEditor';
import type { EditorModelValue, EditorPart, EditorProps } from './types';
import type { Editor as TiptapEditor } from '@tiptap/core';

defineOptions({ name: 'RpEditor', inheritAttrs: false });

const props = withDefaults(defineProps<EditorProps>(), {
    modelValue: undefined,
    defaultValue: '',
    output: 'html',
    extensions: () => [StarterKit],
    editable: true,
    autofocus: false,
    editorProps: () => ({}),
    injectCSS: true,
});

const emit = defineEmits<{
    'update:modelValue': [value: EditorModelValue];
    ready: [editor: TiptapEditor];
    destroy: [editor: TiptapEditor];
}>();

const attrs = useAttrs();
const host = shallowRef<HTMLElement | null>(null);
const { editor, focus } = useEditor({
    host,
    modelValue: () => props.modelValue,
    initialContent: () => props.modelValue ?? props.defaultValue,
    output: () => props.output,
    extensions: () => props.extensions,
    editable: () => props.editable,
    autofocus: () => props.autofocus,
    editorProps: () => props.editorProps,
    injectCSS: () => props.injectCSS,
    onReady: (instance) => emit('ready', instance),
    onUpdate: (content) => emit('update:modelValue', content),
    onDestroy: (instance) => emit('destroy', instance),
});

const rootAttrs = computed(() => ({
    ...attrs,
    class: ['rp-editor', props.classNames?.root, attrs.class],
    style: [props.styles?.root, attrs.style],
    'data-readonly': props.editable ? undefined : '',
}));
const contentAttrs = computed(() => getPartAttrs('content', 'rp-editor__content'));

function getPartAttrs(part: EditorPart, className: string) {
    return {
        class: [className, props.classNames?.[part]],
        style: props.styles?.[part],
    };
}

defineExpose({ editor, nativeElement: host, focus });
</script>

<style src="./editor.css" scoped></style>
