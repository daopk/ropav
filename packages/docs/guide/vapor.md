---
title: Vapor mode
description: What compiling without a virtual DOM changes for you, and the one line a VDOM app needs.
---

# Vapor mode

Every component in Ropav is compiled in Vapor Mode. Its template becomes direct DOM
operations — create this node, bind this attribute, update this text — with no virtual DOM tree
built, diffed or discarded in between.

You do not opt into this and cannot opt out of it: there is no VDOM build of the library to fall
back to. What it costs you is one line of setup if the rest of your app is not Vapor, and what it
buys you is that a component's updates touch only the nodes that changed.

## A VDOM app needs the bridge

An ordinary Vue app renders with a virtual DOM. Reaching a Vapor child from a VDOM parent goes
through Vue's interop plugin:

```ts
import { createApp, vaporInteropPlugin } from "vue";

import App from "./app.vue";

createApp(App).use(vaporInteropPlugin);
```

That is the direction the plugin is designed for and the one that is well supported. An app that
is Vapor throughout needs nothing.

## Server rendering works

A Vapor component server-renders. The compiler branches on `ssr` before it branches on `vapor`,
so the same source file is compiled twice: on the server into an ordinary component with an
inlined render, on the client into a real Vapor one. The markup arrives in the HTML and the Vapor
runtime takes over on hydration.

Nothing about this is configuration — it falls out of your bundler seeing the library's source or
its published build. This site is server-rendered, and every component on it is in the static
HTML before any JavaScript runs.

## Reading state from a component

Vapor changes nothing about the shape of a component's API. Slot props still arrive as slot
props, so content can follow the state of the thing that holds it:

```vue
<Button v-slot="{ isPressed, isPending }">
  {{ isPending ? "Saving…" : isPressed ? "Nearly" : "Save" }}
</Button>
```
