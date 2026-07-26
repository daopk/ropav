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

The toolbar is enabled by default and includes paragraph and heading styles, inline formatting,
lists, blockquote and code block controls, a horizontal rule action, and undo/redo. Hide it with
`:toolbar="false"`:

```vue
<Editor v-model="content" :toolbar="false" />
```

The toolbar is hidden automatically when `:editable="false"`. Use `toolbarAriaLabel` to customize
the accessible toolbar name.

Replace the built-in controls with the `toolbar` slot. The slot exposes the Tiptap instance,
reactive action state, and the same selection-preserving command runner used by the default
toolbar:

```vue
<Editor v-model="content">
  <template #toolbar="{ state, run }">
    <button
      type="button"
      :aria-pressed="state.actions.bold.active"
      :disabled="state.actions.bold.disabled"
      @mousedown.prevent
      @click="run('bold')"
    >
      Bold
    </button>
  </template>
</Editor>
```

Controls for extensions that are not installed are omitted from the default toolbar. The toolbar
slot can use the exposed Tiptap instance for extension-specific actions such as editing links.

The default schema uses Tiptap's `StarterKit`. Pass `extensions` to replace that schema:

```vue
<Editor v-model="content" :extensions="[StarterKit, Link]" />
```

Set `output="json"` to emit Tiptap JSON instead of HTML. The `ready` event and exposed `editor`
property provide the underlying `@tiptap/core` editor for commands and extension-specific behavior.
`extensions`, `autofocus`, and `injectCSS` are initialization options; remount the component to
change them.

ARIA attributes and `tabindex` passed to `Editor` target the editable textbox. `class`, `style`, and
other fallthrough attributes stay on the root element.

`@ropav/editor` mounts `@tiptap/core` directly into an element owned by a Vapor SFC. It does not use
`@tiptap/vue-3`, Vue render functions, or Vue node views.

The package stylesheet includes Tiptap's required ProseMirror base rules inside the
`ropav.components` cascade layer, so `injectCSS` defaults to `false`. Set `injectCSS` explicitly if
you need Tiptap to inject its upstream unlayered stylesheet instead.

## SSR

`Editor` is client-only because the Vue Vapor runtime is browser-only. Render it inside your
framework's client-only boundary. The package provides a Node-safe conditional entry so server
imports succeed; attempting to render `Editor` on the server throws a clear client-only error.
