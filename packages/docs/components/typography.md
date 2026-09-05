---
title: Typography
description: One scale for every piece of text, with the semantics kept separate from the size.
outline: [2, 3]
---

# Typography

`Typography` sets a piece of text on the library's scale. `Heading`, `Paragraph` and `Code` are
the same component with the `type` decided for you, which is what keeps the semantic element and
the visual size from drifting apart: a `Heading` at `level="3"` renders an `<h3>` whatever size
you then give it.

```ts
import { Heading, Paragraph, Typography } from "ropav";
```

::: playground typography
:::

## The scale

<Demo title="typography-scale.vue">
<DemoTypographyScale />

<template #code>

<<< @/.vitepress/theme/demos/typography-scale.vue

</template>
</Demo>

`Heading` takes `level`, `Paragraph` takes `size`. Reach for `Typography` directly when you want
a size that does not match the element you need — a page title that has to render as an `<h2>`
for the outline but read at `h1` size, say.

## Truncating

`truncate` holds the text to one line and ends it with an ellipsis. It needs a width to work
against: on its own the element is as wide as its content, and nothing overflows.

<Demo title="typography-truncate.vue">
<DemoTypographyTruncate />

<template #code>

<<< @/.vitepress/theme/demos/typography-truncate.vue

</template>
</Demo>

## Prose

`Prose` is for markup you did not write — rendered markdown, a CMS field, an email body. It
styles the plain elements inside it rather than taking a `type` of its own, so `<h2>`, `<p>`,
`<ul>` and `<code>` arrive on the scale without any of them being given a class.

## API

<Api family="typography" />
