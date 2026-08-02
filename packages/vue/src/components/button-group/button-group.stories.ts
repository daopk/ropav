import type {Meta, StoryObj} from "@storybook/vue3";

import {Button} from "../button";

import {ButtonGroup, ButtonGroupSeparator} from "./index";

import IconBold from "~icons/gravity-ui/bold";
import IconItalic from "~icons/gravity-ui/italic";
import IconUnderline from "~icons/gravity-ui/underline";

// Dot notation does not resolve in a runtime-compiled template, so each part is
// registered on its own.
const components = {Button, ButtonGroup, ButtonGroupSeparator};

const meta: Meta = {
  argTypes: {
    isDisabled: {
      control: {type: "boolean"},
    },
    orientation: {
      control: {type: "select"},
      options: ["horizontal", "vertical"],
    },
    size: {
      control: {type: "select"},
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
    },
  },
  component: ButtonGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/ButtonGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {size: "md", variant: "secondary"},
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <ButtonGroup v-bind="args">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>
    `,
  }),
};

export const Orientations: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex items-start gap-8">
        <ButtonGroup variant="secondary">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical" variant="secondary">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    `,
  }),
};

export const WithSeparator: Story = {
  render: () => ({
    components,
    template: `
      <ButtonGroup variant="secondary">
        <Button>Day</Button>
        <ButtonGroupSeparator />
        <Button>Week</Button>
        <ButtonGroupSeparator />
        <Button>Month</Button>
      </ButtonGroup>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({variants: ["primary", "secondary", "tertiary", "outline"]}),
    template: `
      <div class="flex flex-col gap-3">
        <ButtonGroup v-for="variant in variants" :key="variant" :variant="variant">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({sizes: ["sm", "md", "lg"]}),
    template: `
      <div class="flex flex-col items-start gap-3">
        <ButtonGroup v-for="size in sizes" :key="size" :size="size" variant="secondary">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      </div>
    `,
  }),
};

export const IconOnly: Story = {
  render: () => ({
    components: {...components, IconBold, IconItalic, IconUnderline},
    template: `
      <ButtonGroup variant="secondary">
        <Button aria-label="Bold" is-icon-only>
          <IconBold />
        </Button>
        <Button aria-label="Italic" is-icon-only>
          <IconItalic />
        </Button>
        <Button aria-label="Underline" is-icon-only>
          <IconUnderline />
        </Button>
      </ButtonGroup>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <ButtonGroup is-disabled variant="secondary">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>
    `,
  }),
};

export const OverridingTheGroup: Story = {
  render: () => ({
    components,
    template: `
      <ButtonGroup size="sm" variant="secondary">
        <Button>Day</Button>
        <Button variant="primary">Week</Button>
        <Button>Month</Button>
      </ButtonGroup>
    `,
  }),
};
