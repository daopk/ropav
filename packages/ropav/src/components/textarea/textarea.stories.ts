import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { Surface } from "../surface";

import { TextArea } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve dot notation through.
const components = { Surface, TextArea };

// The title says `Textarea` while the component is `TextArea`, matching React so the two
// Storybook sidebars line up.
const meta: StoryMeta = {
  argTypes: {},
  component: TextArea,
  parameters: { layout: "centered" },
  title: "Components/Forms/Textarea",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `<TextArea placeholder="Describe your product" />`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-2">
        <TextArea full-width placeholder="Primary textarea" variant="primary" />
        <TextArea full-width placeholder="Secondary textarea" variant="secondary" />
      </div>
    `,
  }),
};

/** The same three sizes the rest of the fields take, scaling the padding and the type. */
export const Sizes: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-3">
        <TextArea full-width placeholder="Small" size="sm" />
        <TextArea full-width placeholder="Medium" size="md" />
        <TextArea full-width placeholder="Large" size="lg" />
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-3">
        <TextArea full-width placeholder="Full width textarea" />
        <Surface class="w-full rounded-[calc(var(--rp-radius)*3)] p-6">
          <TextArea full-width placeholder="Full width textarea on surface" variant="secondary" />
        </Surface>
      </div>
    `,
  }),
};

/** Grows with what is typed, until `maxRows` if one is set. */
export const Autosize: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-3">
        <TextArea
          autosize
          full-width
          :max-rows="6"
          :min-rows="2"
          placeholder="Grows from 2 to 6 rows"
        />
        <TextArea autosize full-width :min-rows="3" placeholder="Grows without a cap" />
      </div>
    `,
  }),
};

/** Off by default. `vertical` or `both` puts the drag handle back. */
export const Resize: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-[280px] flex-col gap-3">
        <TextArea full-width placeholder="Resize none (default)" :rows="3" />
        <TextArea full-width placeholder="Resize vertical" resize="vertical" :rows="3" />
        <TextArea full-width placeholder="Resize both" resize="both" :rows="3" />
      </div>
    `,
  }),
};
