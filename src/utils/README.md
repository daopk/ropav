# Utilities

This directory contains reusable runtime helpers that are independent of component state and
Vue lifecycle hooks. Utilities are internal implementation details unless they are explicitly
added to the Package Publication manifest.

Import utilities directly from their module (for example, `@/utils/aria`) rather than through a
barrel. Component-specific logic stays with its component, composables stay under `composables`,
and build or test helpers stay under `tooling`, `scripts`, or `tests`.

Use a focused concern name (`number`, `geometry`, `indexPath`) and put browser-specific helpers
under `dom/`. A pure helper that still encodes one component's contract should remain colocated in
a semantic module such as `sliderModel`; do not create catch-all `utils` or `core` files beside a
component.
