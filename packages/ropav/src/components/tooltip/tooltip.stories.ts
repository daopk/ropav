import type { Meta, StoryObj } from "@storybook/vue3-vite";

import IconCircleInfo from "~icons/gravity-ui/circle-info";
import IconPaperclip from "~icons/gravity-ui/paperclip";

import { ButtonRoot } from "../button";
import { CardContent, CardRoot } from "../card";

import TooltipArrow from "./tooltip-arrow.vue";
import TooltipContent from "./tooltip-content.vue";
import TooltipRoot from "./tooltip-root.vue";
import TooltipTrigger from "./tooltip-trigger.vue";

// Registered under flat names: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "Tooltip.Content".
const components = {
  Button: ButtonRoot,
  Card: CardRoot,
  CardContent,
  IconCircleInfo,
  IconPaperclip,
  Tooltip: TooltipRoot,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
};

const meta = {
  argTypes: {
    offset: { control: "number" },
    placement: {
      control: "select",
      options: [
        "bottom",
        "bottom left",
        "bottom right",
        "bottom start",
        "bottom end",
        "top",
        "top left",
        "top right",
        "top start",
        "top end",
        "left",
        "left top",
        "left bottom",
        "start",
        "start top",
        "start bottom",
        "right",
        "right top",
        "right bottom",
        "end",
        "end top",
        "end bottom",
      ],
    },
  },
  parameters: { layout: "centered" },
  title: "Components/Overlays/Tooltip",
} satisfies Meta;

export default meta;

// Args are spelled out rather than inferred: `meta` names no component, so there is
// nothing for `StoryObj` to read them from.
type Story = StoryObj<{ showArrow: boolean }>;

// The delay is what makes a tooltip readable in use and unusable in a story, so every story opens
// at once. `showArrow` only reserves the offset; the arrow itself is a part.
const args = { showArrow: true };

export const Default: Story = {
  args,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center justify-center gap-3">
        <Tooltip :delay="0">
          <Button aria-label="Tooltip trigger" is-icon-only variant="tertiary">
            <IconCircleInfo />
          </Button>
          <TooltipContent v-bind="args">
            <TooltipArrow />
            <p>Tooltip content</p>
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
};

export const WithTrigger: Story = {
  args,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <Tooltip :delay="0">
          <TooltipTrigger aria-label="Tooltip trigger">
            <div class="rounded-full bg-accent-soft p-2">
              <IconCircleInfo />
            </div>
          </TooltipTrigger>
          <TooltipContent v-bind="args">
            <TooltipArrow />
            <p>Tooltip content</p>
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
};

export const CardWithTooltip: Story = {
  args,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Card class="w-[200px]">
        <CardContent class="flex items-center justify-center p-6">
          <Tooltip :delay="0">
            <TooltipTrigger>
              <Button
                aria-label="Attach file"
                class="rounded-full"
                is-icon-only
                size="lg"
                variant="secondary"
              >
                <IconPaperclip />
              </Button>
            </TooltipTrigger>
            <TooltipContent v-bind="args">
              <TooltipArrow />
              <p>Attach a file</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    `,
  }),
};
