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

## Styling contract

Use typed `classNames` and `styles`, documented state attributes, and variables listed in the packaged styles manifest. DOM nesting, internal selectors and undocumented variables are private implementation details.

See the [Public Styles API](./docs/public-styles-api.md) and [public token table](./docs/public-tokens.md). Layered consumers should declare `reset, ropav.tokens, ropav.components, app`; `ropav/legacy-unlayered.css` is the temporary compatibility import for unlayered resets.
