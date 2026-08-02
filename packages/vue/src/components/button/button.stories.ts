import type {Meta, StoryObj} from "@storybook/vue3";

import {Button} from "./index";

const components = {Button};

const meta: Meta = {
  argTypes: {
    size: {
      control: {type: "select"},
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
    },
  },
  component: Button,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/Button",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `<Button v-bind="args">Button</Button>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({
      variants: [
        {label: "Primary", variant: "primary"},
        {label: "Secondary", variant: "secondary"},
        {label: "Tertiary", variant: "tertiary"},
        {label: "Outline", variant: "outline"},
        {label: "Ghost", variant: "ghost"},
        {label: "Danger", variant: "danger"},
        {label: "Danger Soft", variant: "danger-soft"},
      ],
    }),
    template: `
      <div class="flex gap-3">
        <Button v-for="item in variants" :key="item.variant" :variant="item.variant">
          {{ item.label }}
        </Button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({sizes: ["sm", "md", "lg"]}),
    template: `
      <div class="flex items-center gap-3">
        <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-3">
        <Button>Default</Button>
        <Button is-disabled>Disabled</Button>
        <Button is-pending>Pending</Button>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-80">
        <Button full-width>Full width</Button>
      </div>
    `,
  }),
};
