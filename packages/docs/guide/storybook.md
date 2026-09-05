---
title: The rest of the components
description: Where to find what these pages do not cover yet.
---

# The rest of the components

These pages cover a slice of the library in prose. Everything else lives in the workbench, which
carries a story per state for each component and the same palette and appearance controls this
site has.

```bash
pnpm dev
```

It also runs the audits described in [Accessibility](/guide/accessibility) — every story swept
with axe, then rendered twice for Forced Colors Mode — so a story that renders there is a story
that passed both.

## Why both

A story shows a component in one state, chosen by whoever wrote it, and there are enough of them
to cover the awkward ones. A page here explains why a prop exists and what it costs, which a
story cannot do.
