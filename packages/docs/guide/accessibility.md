---
title: Accessibility
description: What the library guarantees, what it audits, and what stays yours.
---

# Accessibility

The behaviour layer is re-implemented from React Aria: focus management, press handling,
selection, typeahead, collections, dates. That is where the roles, the keyboard maps and the
announcements come from, rather than from a reading of the spec each time.

Two things are worth knowing because they change what you have to do.

## Reduced motion

Set `data-reduce-motion` on any ancestor to force animation off or on regardless of the operating
system:

```html
<html data-reduce-motion="true"></html>
```

`"true"` forces animation off, `"false"` forces it on, and with the attribute absent the
`prefers-reduced-motion` media query decides.

The attribute sets an inherited custom property, `--rp-motion`, and every declaration that
animates reads it — so the answer reaches a pseudo-element without anything restating it, and the
**nearest** ancestor is the one that decides. A panel that turns motion back on inside a page that
turned it off gets motion; one that turns it off inside a page that turned it on does not.

Your own rules can join in the same way, by leading with the property:

```css
.thing {
  transition: var(--rp-motion) opacity 200ms ease;
}
```

With motion allowed it substitutes nothing and the declaration reads as written. With motion off
it makes the declaration invalid, so the property falls back to its initial value — a duration of
zero, or no animation name — and there is nothing left to see.

## Forced Colors Mode

Windows High Contrast replaces author colours with the user's own palette **and strips
`box-shadow` outright**. The second half is what makes it more than a colour question: every focus
ring here is a `box-shadow`, sitting on top of `outline-none`. Left alone, a focused control would
have no indicator at all.

There is nothing to opt into. The focus utilities draw an outline back in `Highlight` under the
mode, so any component that takes focus is covered, and disabled controls pick up `GrayText` the
same way. Containers keep an inset outline so a card or an alert does not dissolve into loose
text once its fill and shadow are taken.

If you are writing components of your own against this stylesheet, the authoring rules are in
[Forced colors](/theming/forced-colors) — including the backplate trap that `getComputedStyle`
cannot see.

## What is checked, and how

Every story in the library's workbench is swept with axe, and then rendered twice — the mode off,
then on — with anything that painted something and stops painting it failing the run.

That second audit exists because asserting the stylesheet is not enough on its own: the colour
override runs after the cascade and the backplate is painted later still, so a component can
report every declared colour correctly while rendering as a blank block. Three bugs shipped that
way before the audit existed.

## What stays yours

**Contrast on a translucent surface.** Where both sides are known, the library holds the floor.
Once the background is a photograph or whatever the window is over, it cannot see it and does not
claim to — see [Translucent surfaces](/theming/tokens#translucent-surfaces).

**Labels.** A control whose whole content is an icon has no text to name it, so `aria-label` is
yours to write. The components will not invent one.
