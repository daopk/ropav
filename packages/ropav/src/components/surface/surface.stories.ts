import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { Input } from "../input";
import { Label } from "../label";
import { TextField } from "../textfield";

import { Surface } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve dot notation through.
const components = { Input, Label, Surface, TextField };

const meta: StoryMeta = {
  argTypes: {},
  component: Surface,
  parameters: { layout: "centered" },
  title: "Components/Layout/Surface",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Transparent</p>
          <Surface
            class="flex min-w-[320px] flex-col gap-3 rounded-3xl border p-6"
            variant="transparent"
          >
            <h3 class="text-base font-semibold text-foreground">Surface Content</h3>
            <TextField is-required name="email" type="email">
              <Label>Email</Label>
              <Input class="w-[280px]" placeholder="john@example.com" />
            </TextField>
            <p class="text-sm text-muted">
              This is a default surface variant. It uses bg-surface styling.
            </p>
          </Surface>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Default</p>
          <Surface class="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6" variant="default">
            <h3 class="text-base font-semibold text-foreground">Surface Content</h3>
            <TextField is-required name="email" type="email" variant="secondary">
              <Label>Email</Label>
              <Input class="w-[280px] border border-border/20" placeholder="john@example.com" />
            </TextField>
            <p class="text-sm text-muted">
              This is a default surface variant. It uses bg-surface styling.
            </p>
          </Surface>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Secondary</p>
          <Surface class="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6" variant="secondary">
            <h3 class="text-base font-semibold text-foreground">Surface Content</h3>
            <TextField is-required name="email" type="email">
              <Label>Email</Label>
              <Input class="w-[280px]" placeholder="john@example.com" />
            </TextField>
            <p class="text-sm text-muted">
              This is a secondary surface variant. It uses bg-surface-secondary styling.
            </p>
          </Surface>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Tertiary</p>
          <Surface class="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6" variant="tertiary">
            <h3 class="text-base font-semibold text-foreground">Surface Content</h3>
            <TextField is-required name="email" type="email">
              <Label>Email</Label>
              <Input class="w-[280px]" placeholder="john@example.com" />
            </TextField>
            <p class="text-sm text-muted">
              This is a tertiary surface variant. It uses bg-surface-tertiary styling.
            </p>
          </Surface>
        </div>
      </div>
    `,
  }),
};
