import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { Surface } from "../surface";

import { Input } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve dot notation through.
const components = { Input, Surface };

const meta: StoryMeta = {
  argTypes: {},
  component: Input,
  parameters: { layout: "centered" },
  title: "Components/Forms/Input",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `<Input placeholder="Your name" />`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[240px] flex-col gap-2">
        <Input full-width placeholder="Primary input" variant="primary" />
        <Input full-width placeholder="Secondary input" variant="secondary" />
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-3">
        <Input full-width placeholder="Full width input" />
        <div class="flex h-[180px] items-center justify-center rounded-3xl bg-surface p-4">
          <Surface class="w-full">
            <Input full-width placeholder="Full width input on surface" variant="secondary" />
          </Surface>
        </div>
      </div>
    `,
  }),
};

export const OnSurfaces: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Default Surface</p>
          <Surface class="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6" variant="default">
            <Input class="w-full" placeholder="Your name" variant="primary" />
            <Input class="w-full" placeholder="Your name" variant="secondary" />
          </Surface>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Secondary Surface</p>
          <Surface class="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6" variant="secondary">
            <Input class="w-full" placeholder="Your name" variant="primary" />
            <Input class="w-full" placeholder="Your name" variant="secondary" />
          </Surface>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Tertiary Surface</p>
          <Surface class="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6" variant="tertiary">
            <Input class="w-full" placeholder="Your name" variant="primary" />
            <Input class="w-full" placeholder="Your name" variant="secondary" />
          </Surface>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Transparent Surface</p>
          <Surface
            class="flex min-w-[320px] flex-col gap-3 rounded-3xl border p-6"
            variant="transparent"
          >
            <Input class="w-full" placeholder="Your name" variant="primary" />
            <Input class="w-full" placeholder="Your name" variant="secondary" />
          </Surface>
        </div>
      </div>
    `,
  }),
};
