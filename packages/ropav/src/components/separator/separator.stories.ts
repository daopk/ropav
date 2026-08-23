import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {iconSrc} from "../../utils/story-assets";

import {SeparatorRoot} from "./index";

// Registered under a flat name: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "Separator.Root".
const components = {Separator: SeparatorRoot};

const meta: StoryMeta = {
  argTypes: {
    orientation: {
      control: {type: "radio"},
      options: ["horizontal", "vertical"],
    },
  },
  component: SeparatorRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Layout/Separator",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <div class="max-w-md">
        <div class="space-y-1">
          <h4 class="text-medium font-medium">Ropav Components</h4>
          <p class="text-small text-default-400">Beautiful, fast and modern React UI library.</p>
        </div>
        <Separator class="my-4" />
        <div class="text-small flex h-5 items-center space-x-4">
          <div>Blog</div>
          <Separator orientation="vertical" />
          <div>Docs</div>
          <Separator orientation="vertical" />
          <div>Source</div>
        </div>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components,
    template: `
      <div class="text-small flex h-5 items-center space-x-4">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    `,
  }),
};

const items = [
  {
    iconUrl: iconSrc("tabler:bell"),
    subtitle: "Receive account activity updates",
    title: "Set Up Notifications",
  },
  {
    iconUrl: iconSrc("tabler:compass"),
    subtitle: "Connect your browser to your account",
    title: "Set up Browser Extension",
  },
  {
    iconUrl: iconSrc("tabler:diamond"),
    subtitle: "Create your first collectible",
    title: "Mint Collectible",
  },
];

export const WithContent: Story = {
  render: () => ({
    components,
    setup: () => ({items}),
    template: `
      <div class="max-w-md space-y-4 rounded-3xl bg-surface p-4 shadow-surface">
        <div v-for="(item, index) in items" :key="item.title">
          <div class="flex items-center gap-3">
            <img :alt="item.title" class="size-12" :src="item.iconUrl" />
            <div class="flex-1 space-y-0">
              <h4 class="text-small font-medium">{{ item.title }}</h4>
              <p class="text-sm text-muted">{{ item.subtitle }}</p>
            </div>
          </div>
          <Separator v-if="index < items.length - 1" class="my-4" />
        </div>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex max-w-md flex-col items-center gap-3">
        <div>Default Variant</div>
        <Separator variant="default" />
        <div>Secondary Variant</div>
        <Separator variant="secondary" />
        <div>Tertiary Variant</div>
        <Separator variant="tertiary" />
      </div>
    `,
  }),
};
