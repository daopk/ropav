---
title: Card
description: A surface that groups related content, in four depths.
outline: [2, 3]
---

# Card

A card groups content that belongs together and gives it a surface of its own. It is also a
surface in the technical sense: anything inside it that picks its colours from what it sits on
reads the card rather than the page.

```ts
import { Card } from "ropav";
```

::: playground card
:::

## Composition

The parts are optional and unordered — a card is whatever you put in it. `CardHeader` groups a
title with its description; `CardFooter` is where actions go.

<Demo title="card-composition.vue">
<DemoCardComposition />

<template #code>

<<< @/.vitepress/theme/demos/card-composition.vue

</template>
</Demo>

## Variants

`default`, `secondary` and `tertiary` step back one surface at a time. Which one to use depends
on what the card is sitting on: a card on the page body wants `default`, a card inside another
card wants the next one along.

<Demo title="card-variants.vue">
<DemoCardVariants />

<template #code>

<<< @/.vitepress/theme/demos/card-variants.vue

</template>
</Demo>

`transparent` is the fourth, and it is different in kind: it paints no fill of its own, so it
shows whatever is behind it and passes that surface on to its descendants rather than claiming
one. Reach for it when the card is only there for its spacing.

::: tip
Anything sitting on a surface that may be see-through has to be built from tokens that hold
their contrast against an unknown fill — see [Translucent surfaces](/theming/tokens#translucent-surfaces).
:::

## API

<Api family="card" />
