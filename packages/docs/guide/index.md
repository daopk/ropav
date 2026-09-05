---
title: Introduction
description: What Ropav is, and what it is made of.
---

# Introduction

Ropav is a Vue 3 component library built on **Vapor Mode**. Every component compiles to direct
DOM operations rather than to a virtual DOM tree, and the behaviour layer — focus, press,
selection, collections, dates — is re-implemented from React Aria rather than reinvented.

It is a port of HeroUI v3 to Vue: the style layer is vendored from `@heroui/styles`, so the
visual language is theirs; the behaviour is a fresh implementation, because none of theirs could
carry across.

## What's in the box

| Package | What it is |
| --- | --- |
| `ropav` | The components. Depends on the one below and pulls it in for you. |
| `@ropav/styles` | Plain CSS for every component, the themes, and the `tv()` recipes that map props to class names. Framework-agnostic — not a line of Vue in it. |

You install `ropav`. `@ropav/styles` arrives with it, and you import its stylesheet once.

## What the split buys you

The style layer never imports Vue, so a component's appearance is readable without reading its
behaviour, and a design change is a CSS change. It also means the classes are yours to work with:
every component takes a `class` prop, every colour is a custom property, and a theme is a token
block rather than a build step. See [Theming](/theming/).

## Where to start

- [Installation](/guide/installation) — the two imports you need.
- [Vapor mode](/guide/vapor) — what it changes for you, and the one line a VDOM app needs.
- [Theming](/theming/) — two axes, and the palettes that ship.
- [Button](/components/button) — the component page every other one is shaped like.
