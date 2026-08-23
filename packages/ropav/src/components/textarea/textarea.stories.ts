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

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-3">
        <TextArea full-width placeholder="Full width textarea" />
        <Surface class="w-full rounded-3xl p-6">
          <TextArea full-width placeholder="Full width textarea on surface" variant="secondary" />
        </Surface>
      </div>
    `,
  }),
};
