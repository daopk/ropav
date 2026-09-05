---
title: State colors
description: Retuning one state without flattening the rest.
---

# State colors

The convention the whole style layer is built on:

> **A colour a state rule paints goes through a custom property — where more than one state paints
> that property.**

That is what makes one state retunable on its own.

## Why a class cannot do it

A colour written straight into a rule is not retunable. The resting value and the lit value are
the same property on the same element, so the one declaration you write to change either beats
every state rule at once. A utility beats them all whatever their specificity, `utilities` being a
later layer than `components`.

The only way left would be restating the whole state set behind `:not()`, which drifts silently
the day a state is added.

So you set the property instead, and the states that read the others are left standing:

```vue
<!-- No line at rest; it still flares on hover and while dragging. -->
<Sidebar class="[--sidebar-rail-line:transparent]" />
```

## Why the qualifier matters

The "more than one state" clause is what keeps this from becoming surface for its own sake.

Where exactly one state paints a property, you can name that state from the call site —
`hover:bg-*`, `focus-visible:outline-*` — and there is no other state for it to flatten, so no
property is minted. It is the *second* state painting the same thing that makes the call site
unable to tell them apart.

## Defaults chain

Retuning one state carries the ones below it unless they are set too.
`--sidebar-rail-line-dragging` follows `--sidebar-rail-line-hover`, the way `--button-bg-pressed`
follows `--button-bg-hover`. So a single override reaches the whole ladder, and you step in lower
only where you want a different answer.

```vue
<Button class="[--button-bg-hover:var(--success)]">Publish</Button>
```

## Two limits

**Scope.** The properties are per component and resolve to the theme tokens above, so a palette
change belongs in a [theme](/theming/custom-theme) rather than here.

**Forced Colors Mode is not covered.** Those blocks paint the system keywords, which are the only
colours exempt from the override and not a component's to retune.
`[--sidebar-rail-line:transparent]` leaves the line drawn under High Contrast, on purpose — see
[Forced colors](/theming/forced-colors).

## It is enforced

A test in the library reads every component file and fails on a state colour that does not go
through a property. Its ledger of exceptions is currently empty, so an entry appearing there is
debt to pay down rather than a licence to add more.
