# @ropav/editor

Zero-VDOM rich-text editor for Vue Vapor, backed by Tiptap.

## Install

```bash
pnpm add @ropav/editor ropav vue
```

## Use

```vue
<template>
  <Editor v-model="content" />
</template>

<script setup lang="ts" vapor>
import { ref } from 'vue';
import { Editor } from '@ropav/editor';
import 'ropav/base.css';
import '@ropav/editor/editor.css';

const content = ref('<p>Hello from Tiptap.</p>');
</script>
```

The default schema uses Tiptap's `StarterKit`. Pass `extensions` to replace that schema:

```vue
<Editor v-model="content" :extensions="[StarterKit, Link]" />
```

Set `output="json"` to emit Tiptap JSON instead of HTML. The `ready` event and exposed `editor`
property provide the underlying `@tiptap/core` editor for commands and extension-specific behavior.
`extensions`, `autofocus`, and `injectCSS` are initialization options; remount the component to
change them.

`@ropav/editor` mounts `@tiptap/core` directly into an element owned by a Vapor SFC. It does not use
`@tiptap/vue-3`, Vue render functions, or Vue node views.
