import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";

import { Button } from "../button";

import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlSeparator,
} from "./index";

/**
 * Story templates are compiled at runtime, where Vue resolves a tag like `SegmentedControlItem`
 * as a component literally named "SegmentedControlItem" and fails. Dot notation only works in an
 * SFC, whose compiler resolves it against the setup scope. So the parts are registered
 * individually here — in application code `<SegmentedControlItem>` inside an SFC is fine.
 */
const components = {
  Button,
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlSeparator,
};

const meta: StoryMeta = {
  argTypes: {
    fullWidth: { control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
    size: { control: { type: "radio" }, options: ["sm", "md", "lg"] },
  },
  args: {
    fullWidth: false,
    isDisabled: false,
  },
  component: SegmentedControl,
  parameters: {
    layout: "centered",
  },
  title: "Components/Controls/SegmentedControl",
};

export default meta;

type Story = StoryObj<typeof meta>;

const RANGE_ITEMS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

/*
 * Every story names the control. A radio group with no accessible name is a WCAG 1.3.1 problem
 * even where axe stays quiet, and a segmented control rarely has a visible label beside it.
 */
export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: RANGE_ITEMS }),
    template: `
      <SegmentedControl
        aria-label="Reporting range"
        default-selected-key="weekly"
        :full-width="args.fullWidth"
        :is-disabled="args.isDisabled"
        :size="args.size"
      >
        <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
          {{ item.label }}
          <SegmentedControlIndicator />
        </SegmentedControlItem>
      </SegmentedControl>
    `,
  }),
};

/** Each size beside a button of the same size, which is the alignment the scale buys. */
export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ items: RANGE_ITEMS, sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex flex-col gap-6">
        <div v-for="size in sizes" :key="size" class="flex items-center gap-3">
          <SegmentedControl :aria-label="'Reporting range, ' + size" default-selected-key="weekly" :size="size">
            <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
              {{ item.label }}
              <SegmentedControlIndicator />
            </SegmentedControlItem>
          </SegmentedControl>
          <Button :size="size" variant="secondary">Export</Button>
        </div>
      </div>
    `,
  }),
};

/**
 * A hairline between adjacent segments, for a control that has to read as divided even where the
 * pill is not. Each divider steps aside as the pill reaches it, so nothing is drawn against the
 * pill's edge.
 */
export const WithSeparators: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: RANGE_ITEMS }),
    template: `
      <SegmentedControl
        aria-label="Reporting range"
        default-selected-key="daily"
        :full-width="args.fullWidth"
        :is-disabled="args.isDisabled"
        :size="args.size"
      >
        <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
          <SegmentedControlSeparator />
          {{ item.label }}
          <SegmentedControlIndicator />
        </SegmentedControlItem>
      </SegmentedControl>
    `,
  }),
};

/** Labels of unequal length, so the pill visibly resizes as it travels. */
export const FullWidth: Story = {
  render: () => ({
    components,
    setup: () => ({
      items: [
        { id: "all", label: "All" },
        { id: "unread", label: "Unread" },
        { id: "archived", label: "Archived and muted" },
      ],
    }),
    template: `
      <div class="w-[420px]">
        <SegmentedControl aria-label="Inbox filter" default-selected-key="all" full-width>
          <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
            {{ item.label }}
            <SegmentedControlIndicator />
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
    `,
  }),
};

const VIEW_ITEMS = [
  {
    id: "list",
    label: "List",
    path: "M3 5h14M3 10h14M3 15h14",
  },
  {
    id: "grid",
    label: "Grid",
    path: "M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z",
  },
  {
    id: "gallery",
    label: "Gallery",
    path: "M3 4h14v12H3zM3 13l4-4 3 3 3-3 4 4",
  },
];

export const WithIcons: Story = {
  render: () => ({
    components,
    setup: () => ({ items: VIEW_ITEMS }),
    template: `
      <SegmentedControl aria-label="Layout" default-selected-key="grid">
        <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
          <svg aria-hidden="true" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 20 20">
            <path :d="item.path" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ item.label }}
          <SegmentedControlIndicator />
        </SegmentedControlItem>
      </SegmentedControl>
    `,
  }),
};

/** With no text to read, each segment has to name itself. */
export const IconOnly: Story = {
  render: () => ({
    components,
    setup: () => ({ items: VIEW_ITEMS }),
    template: `
      <SegmentedControl aria-label="Layout" default-selected-key="grid">
        <SegmentedControlItem
          v-for="item in items"
          :id="item.id"
          :key="item.id"
          :aria-label="item.label"
          class="px-2.5"
        >
          <svg aria-hidden="true" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 20 20">
            <path :d="item.path" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <SegmentedControlIndicator />
        </SegmentedControlItem>
      </SegmentedControl>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const selectedKey = shallowRef("weekly");

      return { items: RANGE_ITEMS, selectedKey };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <SegmentedControl
          v-model:selected-key="selectedKey"
          aria-label="Reporting range"
        >
          <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
            {{ item.label }}
            <SegmentedControlIndicator />
          </SegmentedControlItem>
        </SegmentedControl>
        <p class="text-sm text-muted">Selected: {{ selectedKey }}</p>
      </div>
    `,
  }),
};

/** The arrow keys step over a disabled segment rather than stopping on it. */
export const DisabledSegment: Story = {
  render: () => ({
    components,
    setup: () => ({ items: RANGE_ITEMS }),
    template: `
      <SegmentedControl
        aria-label="Reporting range"
        default-selected-key="daily"
        :disabled-keys="['weekly']"
      >
        <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
          {{ item.label }}
          <SegmentedControlIndicator />
        </SegmentedControlItem>
      </SegmentedControl>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({ items: RANGE_ITEMS }),
    template: `
      <SegmentedControl aria-label="Reporting range" default-selected-key="weekly" is-disabled>
        <SegmentedControlItem v-for="item in items" :id="item.id" :key="item.id">
          {{ item.label }}
          <SegmentedControlIndicator />
        </SegmentedControlItem>
      </SegmentedControl>
    `,
  }),
};
