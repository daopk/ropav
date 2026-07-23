# Code architecture

This guide defines the source structure expected from contributors. The goal is a predictable
codebase where UI files describe rendering, behavior is testable through small interfaces, and
shared logic has one obvious home.

## Module seams

A module should hide a meaningful amount of behavior behind a small interface. Extract code around
a responsibility, not merely to reduce a line count. A useful extraction makes callers simpler and
lets tests exercise the same interface that production code uses.

Use this dependency direction:

```text
Vue components and component-local modules
    -> internal composables
    -> public composables
    -> utilities
```

A higher layer may also import a lower layer directly. Lower layers must not import higher layers:

- `src/utils/` does not import components or composables.
- `src/composables/` does not import components or internal modules.
- `src/internal/` does not import components.
- Components may compose other components when the dependency remains acyclic.

## Where code belongs

| Location                                  | Responsibility                                                        |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `src/components/<name>/*.vue`             | Template, bindings, slots, and lightweight view-derived state         |
| `src/components/<name>/useX.ts`           | Component-specific reactive state, lifecycle, and event orchestration |
| `src/components/<name>/<concern>Model.ts` | Pure behavior that encodes only that component's contract             |
| `src/internal/composables/`               | Shared reactive behavior that is not part of the package interface    |
| `src/composables/`                        | Reusable public composables exported by the package                   |
| `src/utils/`                              | Reusable runtime helpers without component state or lifecycle         |
| `src/utils/dom/`                          | Reusable helpers that operate on browser and DOM primitives           |
| `tests/`, `tooling/`, `scripts/`          | Test, build, and repository automation helpers                        |

Do not add catch-all `utils`, `helpers`, or `core` modules beside a component. Keep a pure helper
local when it expresses one component's contract, and give it a semantic name such as
`sliderModel`. Move it to `src/utils/` once more than one feature needs the behavior.

## Component shape

Production SFCs use `<script setup lang="ts" vapor>` and remain zero-VDOM. Do not use `h`, `VNode`,
`defineComponent`, `createVNode`, or related VDOM block helpers in production source.

Keep SFC blocks in this order:

1. `<template>`
2. `<script setup lang="ts" vapor>`
3. `<style>`

Within the script block, use this order:

1. Imports
2. `defineOptions`, props defaults, emits, and slots
3. Composable state and template refs
4. View-derived computed attributes
5. Small event adapters and `defineExpose`

A short computed value used only to bind the template can stay in the SFC. Move state transitions,
timers, document listeners, multi-step event handling, and reusable calculations behind a
composable or pure model interface.

## Function design

Oxlint enforces a conservative baseline of cyclomatic complexity 20, nesting depth 4, at most 5
parameters, and at most 250 non-blank, non-comment lines per function. These are upper bounds, not
targets.

- Give each function one reason to change.
- Prefer guard clauses over deeply nested branches.
- Use an options object when several parameters describe one concept.
- Split orchestration into named steps, while keeping the external interface small.
- Accept dependencies or callbacks at the module seam instead of constructing hard-to-test global
  dependencies inside the implementation.
- Return observable results where practical; isolate side effects in lifecycle or event adapters.

Do not create shallow pass-through functions solely to satisfy a metric. A refactor should improve
the caller, the module interface, or the test surface.

## Imports and package interfaces

- Import utilities directly from their module, for example `@/utils/number`; do not add a utils
  barrel.
- Component `index.ts` files define package-facing exports. Internal code should not import from the
  root package barrel.
- Keep imports acyclic. If two modules need each other, move the shared behavior to the lowest
  layer that owns the concept.
- Use `import type` for type-only dependencies.

## Testing

Test through the interface of the extracted module:

- Pure models and utilities use deterministic unit tests.
- Composables test returned state and commands, using the smallest host needed for lifecycle
  behavior.
- Component tests cover DOM integration, events, accessibility, and public rendering contracts.
- Storybook tests cover visual and interaction scenarios that depend on real browser layout.

Tests should assert observable behavior rather than private implementation details. Refactoring a
module internally should not require rewriting its behavioral tests.

## Contributor checklist

Before opening a pull request:

- The SFC primarily adapts props, slots, and composable results to the template.
- New reusable helpers live in `src/utils/`; feature-only pure logic has a semantic local name.
- Dependency direction remains downward and acyclic.
- Functions stay below the enforced complexity, depth, length, and parameter limits.
- New behavior is tested at the module interface.
- `pnpm run verify` passes.
