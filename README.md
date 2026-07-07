# Ropav

Minimal UI components for Vue Vapor.

Ropav components require Vapor mode. Use `createVaporApp`, or install Vue's
Vapor interop plugin in a regular app.

```ts
import { createVaporApp } from 'vue';

createVaporApp(App).mount('#app');
```

or

```ts
import { createApp, vaporInteropPlugin } from 'vue';

createApp(App).use(vaporInteropPlugin).mount('#app');
```

## Install

```bash
pnpm add ropav
```

## Setup

```ts
import 'ropav/base.css';
```

Import the components you need:

```ts
import { Button } from 'ropav';
```
