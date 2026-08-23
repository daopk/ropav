import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import IconCircleDashed from "~icons/gravity-ui/circle-dashed";
import IconCircleFill from "~icons/gravity-ui/circle-fill";

import { SeparatorRoot } from "../separator";

import { Chip, ChipLabel } from "./index";

/**
 * Runtime-compiled story templates cannot resolve `Chip.Label` — dot notation is an SFC
 * compiler feature. The parts are registered individually instead.
 *
 * They also write `Chip.Label` out explicitly rather than passing bare text. A story template is
 * compiled to virtual DOM, and a virtual-DOM slot only fills its nodes in once it is inserted,
 * so the chip has nothing to look at when it decides whether to wrap. In an SFC — which is
 * what application code is — `<Chip>Label</Chip>` wraps on its own.
 */
const components = {
  Chip,
  ChipLabel,
  IconCircleDashed,
  IconCircleFill,
  Separator: SeparatorRoot,
};

const meta: StoryMeta = {
  argTypes: {
    color: {
      control: { type: "select" },
      options: ["accent", "default", "success", "warning", "danger"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "tertiary", "soft"],
    },
  },
  component: Chip,
  parameters: {
    layout: "centered",
  },
  title: "Components/Data Display/Chip",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = {
  color: "accent",
  variant: "secondary",
};

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <Chip v-bind="args"><ChipLabel>Label</ChipLabel></Chip>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <Chip v-bind="args" size="sm"><ChipLabel>Small</ChipLabel></Chip>
        <Chip v-bind="args" size="md"><ChipLabel>Medium</ChipLabel></Chip>
        <Chip v-bind="args" size="lg"><ChipLabel>Large</ChipLabel></Chip>
      </div>
    `,
  }),
};

/**
 * A chip mixing icons with its label has to write `Chip.Label` out: automatic wrapping only
 * applies when the children are nothing but text.
 */
export const WithIcon: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <Chip v-bind="args">
          <IconCircleDashed />
          <ChipLabel>Label</ChipLabel>
          <IconCircleDashed />
        </Chip>
      </div>
    `,
  }),
};

/**
 * The status dot is sized with a class rather than `width`/`height`. Those two arrive as
 * fallthrough attributes, and the runtime writes them to the SVG DOM properties of the same
 * name, which are read-only — so they land nowhere. React sets them as attributes through
 * Iconify; the rendered 6px box is the same either way.
 */
export const Statuses: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({
      args,
      statuses: [
        { color: undefined, label: "Information" },
        { color: "success", label: "Completed" },
        { color: "warning", label: "Pending" },
        { color: "danger", label: "Failed" },
      ],
      variants: ["primary", "secondary", "tertiary", "soft"],
    }),
    template: `
      <div class="flex flex-col gap-4">
        <div v-for="variant in variants" :key="variant" class="flex items-center gap-3">
          <Chip
            v-for="status in statuses"
            :key="status.label"
            v-bind="args"
            :color="status.color ?? args.color"
            :variant="variant"
          >
            <IconCircleFill class="size-1.5" />
            <ChipLabel>{{ status.label }}</ChipLabel>
          </Chip>
        </div>
      </div>
    `,
  }),
};

/** Every colour against every variant, at each size — the grid the CSS is written for. */
export const Variants: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({
      args,
      colors: ["accent", "default", "success", "warning", "danger"],
      sizes: ["lg", "md", "sm"],
      variants: ["primary", "secondary", "tertiary", "soft"],
    }),
    template: `
      <div class="flex flex-col gap-8">
        <template v-for="(size, index) in sizes" :key="size">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-semibold text-muted capitalize">{{ size }}</h3>
            <div class="flex items-center gap-3">
              <div class="w-24 shrink-0" />
              <div
                v-for="color in colors"
                :key="color"
                class="flex shrink-0 items-center justify-center"
                style="width: 130px"
              >
                <span class="text-xs text-muted capitalize">{{ color }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <div v-for="variant in variants" :key="variant" class="flex items-center gap-3">
                <div class="w-24 shrink-0 text-sm text-muted capitalize">{{ variant }}</div>
                <div
                  v-for="color in colors"
                  :key="color"
                  class="flex shrink-0 items-center justify-center"
                  style="width: 130px"
                >
                  <Chip v-bind="args" :color="color" :size="size" :variant="variant">
                    <IconCircleDashed />
                    <ChipLabel>Label</ChipLabel>
                    <IconCircleDashed />
                  </Chip>
                </div>
              </div>
            </div>
          </div>
          <Separator v-if="index < sizes.length - 1" />
        </template>
      </div>
    `,
  }),
};
