---
title: Kbd
description: A keyboard shortcut, with the modifiers spelled out for a reader.
outline: [2, 3]
---

# Kbd

`Kbd` renders a keyboard shortcut. The reason it is three components rather than a styled `<kbd>`
is the modifiers: `⌘` and `⇧` are symbols with no pronunciation, so each one is rendered as an
`<abbr>` carrying the spelled-out name a screen reader can announce.

```ts
import { Kbd, KbdAbbr, KbdContent } from "ropav";
```

::: playground kbd
:::

`KbdAbbr` takes a `key-value` from a fixed set — `command`, `shift`, `ctrl`, `option`, `alt`,
`win`, `fn`, `enter`, `delete`, `escape`, `tab`, `capslock`, `space`, `help`, `up`, `right`,
`down`, `left`, `pageup`, `pagedown`, `home`, `end` — and looks up both the symbol and the name.
`KbdContent` is for everything else: the letter, the digit, whatever the shortcut ends on.

<Demo title="kbd-shortcuts.vue">
<DemoKbdShortcuts />

<template #code>

<<< @/.vitepress/theme/demos/kbd-shortcuts.vue

</template>
</Demo>

Several `KbdAbbr`s in one `Kbd` make a chord, in the order they are written.

## Accessibility

- The root is a real `<kbd>`, so a reader is told this is keyboard input rather than emphasis.
- Each modifier is an `<abbr title="Command">⌘</abbr>`. The symbol is shown, the name is what is
  announced and what a pointer reveals on hover.
- The glyphs are the Mac ones throughout, and nothing here is swapped per platform: `win` shows
  `⌘` and announces "Win", `alt` shows `⌥` and announces "Alt". Which key a shortcut uses on which
  platform is the application's to decide — it knows what it is describing and this component does
  not.

## API

<Api family="kbd" />
