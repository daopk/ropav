import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
import IconCircleXmark from "~icons/gravity-ui/circle-xmark";

import { CloseButton } from "./index";

const components = { CloseButton };

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {
      control: { type: "boolean" },
    },
    variant: {
      control: { type: "select" },
      options: ["default"],
    },
  },
  component: CloseButton,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/CloseButton",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = { isDisabled: false, variant: "default" };

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <CloseButton v-bind="args" />
      </div>
    `,
  }),
};

export const WithCustomIcon: Story = {
  args: defaultArgs,
  render: (args) => ({
    components: { ...components, IconCircleXmark },
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <CloseButton v-bind="args">
          <IconCircleXmark />
        </CloseButton>
      </div>
    `,
  }),
};

export const Interactive: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => {
      const count = shallowRef(0);

      return { args, count };
    },
    template: `
      <div class="flex flex-col items-center justify-center gap-4">
        <CloseButton
          v-bind="args"
          :aria-label="'Close (clicked ' + count + ' times)'"
          @click="count++"
        />
        <span class="text-sm">Clicked: {{ count }} times</span>
      </div>
    `,
  }),
};
