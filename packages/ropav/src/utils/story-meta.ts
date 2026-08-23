import type { Meta } from "@storybook/vue3";

/**
 * A story's `meta`, with `component` loosened.
 *
 * `@storybook/vue3` types `component` as `Omit<ConcreteComponent, "props">` — an object
 * component. `vue-tsc` types a Vapor SFC as a function instead, so every `component: XRoot`
 * is rejected even though Storybook renders it. The value only feeds the autodocs page, and
 * `StoryObj<typeof meta>` takes its args from `render`, not from here.
 *
 * Story-only, so it is deliberately not re-exported from `utils/index.ts`.
 */
export type StoryMeta = Omit<Meta, "component"> & { component?: unknown };
