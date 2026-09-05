import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
import IconBold from "~icons/gravity-ui/bold";
import IconItalic from "~icons/gravity-ui/italic";
import IconLayoutCellsLarge from "~icons/gravity-ui/layout-cells-large";
import IconLayoutColumns3 from "~icons/gravity-ui/layout-columns-3";
import IconListUl from "~icons/gravity-ui/list-ul";
import IconStrikethrough from "~icons/gravity-ui/strikethrough";
import IconTextAlignCenter from "~icons/gravity-ui/text-align-center";
import IconTextAlignLeft from "~icons/gravity-ui/text-align-left";
import IconTextAlignRight from "~icons/gravity-ui/text-align-right";
import IconUnderline from "~icons/gravity-ui/underline";

import { ToggleButton } from "../toggle-button";

import { ToggleButtonGroup, ToggleButtonGroupSeparator } from "./index";

// Dot notation does not resolve in a runtime-compiled template, so each part is
// registered on its own.
const components = {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupSeparator,
};

const meta: StoryMeta = {
  argTypes: {
    fullWidth: {
      control: { type: "boolean" },
    },
    isDetached: {
      control: { type: "boolean" },
    },
    isDisabled: {
      control: { type: "boolean" },
    },
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
    selectionMode: {
      control: { type: "select" },
      options: ["single", "multiple"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
  component: ToggleButtonGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/ToggleButtonGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The separator is absolutely positioned against the button it divides from the previous
 * one, so it belongs *inside* that button rather than between two of them.
 */
export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ToggleButtonGroup v-bind="args" selection-mode="multiple">
        <ToggleButton aria-label="Bold" id="bold" is-icon-only>
          <IconBold />
        </ToggleButton>
        <ToggleButton aria-label="Italic" id="italic" is-icon-only>
          <ToggleButtonGroupSeparator />
          <IconItalic />
        </ToggleButton>
        <ToggleButton aria-label="Underline" id="underline" is-icon-only>
          <ToggleButtonGroupSeparator />
          <IconUnderline />
        </ToggleButton>
        <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
          <ToggleButtonGroupSeparator />
          <IconStrikethrough />
        </ToggleButton>
      </ToggleButtonGroup>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({
      sizes: [
        { label: "Small", size: "sm" },
        { label: "Medium (default)", size: "md" },
        { label: "Large", size: "lg" },
      ],
    }),
    template: `
      <div class="flex flex-col gap-6">
        <div v-for="item in sizes" :key="item.size" class="flex flex-col gap-2">
          <p class="text-sm text-muted">{{ item.rp-label }}</p>
          <ToggleButtonGroup selection-mode="multiple" :size="item.size">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const Orientation: Story = {
  render: () => ({
    components,
    setup: () => ({ orientations: ["horizontal", "vertical"] }),
    template: `
      <div class="flex items-start gap-8">
        <div v-for="orientation in orientations" :key="orientation" class="flex flex-col gap-2">
          <p class="text-sm text-muted">{{ orientation }}</p>
          <ToggleButtonGroup :orientation="orientation" selection-mode="multiple">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const AttachedVsDetached: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Attached (default)</p>
          <ToggleButtonGroup selection-mode="multiple">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
            <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconStrikethrough />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Detached</p>
          <ToggleButtonGroup is-detached selection-mode="multiple">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <IconUnderline />
            </ToggleButton>
            <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
              <IconStrikethrough />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-3">
        <ToggleButtonGroup full-width selection-mode="multiple">
          <ToggleButton aria-label="Bold" id="bold" is-icon-only>
            <IconBold />
          </ToggleButton>
          <ToggleButton aria-label="Italic" id="italic" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconItalic />
          </ToggleButton>
          <ToggleButton aria-label="Underline" id="underline" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconUnderline />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    `,
  }),
};

export const SelectionMode: Story = {
  render: () => ({
    components: { ...components, IconTextAlignCenter, IconTextAlignLeft, IconTextAlignRight },
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Single selection</p>
          <ToggleButtonGroup :default-selected-keys="['center']" selection-mode="single">
            <ToggleButton id="left">
              <IconTextAlignLeft />
              Left
            </ToggleButton>
            <ToggleButton id="center">
              <ToggleButtonGroupSeparator />
              <IconTextAlignCenter />
              Center
            </ToggleButton>
            <ToggleButton id="right">
              <ToggleButtonGroupSeparator />
              <IconTextAlignRight />
              Right
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Multiple selection</p>
          <ToggleButtonGroup
            :default-selected-keys="['bold', 'underline']"
            selection-mode="multiple"
          >
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
            <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconStrikethrough />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const selectedKeys = shallowRef(new Set(["bold"]));

      return { selectedKeys };
    },
    template: `
      <div class="flex flex-col gap-4">
        <ToggleButtonGroup
          :selected-keys="selectedKeys"
          selection-mode="multiple"
          @selection-change="selectedKeys = $event"
        >
          <ToggleButton aria-label="Bold" id="bold" is-icon-only>
            <IconBold />
          </ToggleButton>
          <ToggleButton aria-label="Italic" id="italic" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconItalic />
          </ToggleButton>
          <ToggleButton aria-label="Underline" id="underline" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconUnderline />
          </ToggleButton>
          <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconStrikethrough />
          </ToggleButton>
        </ToggleButtonGroup>
        <p class="text-sm text-muted">
          Selected:
          <span class="font-medium">
            {{ selectedKeys.size > 0 ? [...selectedKeys].join(', ') : 'None' }}
          </span>
        </p>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">All buttons disabled</p>
          <ToggleButtonGroup is-disabled selection-mode="multiple">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Individual button disabled</p>
          <ToggleButtonGroup selection-mode="multiple">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-disabled is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const WithoutSeparator: Story = {
  render: () => ({
    components,
    template: `
      <ToggleButtonGroup selection-mode="multiple">
        <ToggleButton aria-label="Bold" id="bold" is-icon-only>
          <IconBold />
        </ToggleButton>
        <ToggleButton aria-label="Italic" id="italic" is-icon-only>
          <IconItalic />
        </ToggleButton>
        <ToggleButton aria-label="Underline" id="underline" is-icon-only>
          <IconUnderline />
        </ToggleButton>
        <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
          <IconStrikethrough />
        </ToggleButton>
      </ToggleButtonGroup>
    `,
  }),
};

export const WithLabels: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <ToggleButtonGroup :default-selected-keys="['italic']" selection-mode="multiple">
          <ToggleButton id="bold">
            <IconBold />
            Bold
          </ToggleButton>
          <ToggleButton id="italic">
            <ToggleButtonGroupSeparator />
            <IconItalic />
            Italic
          </ToggleButton>
          <ToggleButton id="underline">
            <ToggleButtonGroupSeparator />
            <IconUnderline />
            Underline
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    `,
  }),
};

export const Examples: Story = {
  render: () => ({
    components: {
      ...components,
      IconLayoutCellsLarge,
      IconLayoutColumns3,
      IconListUl,
      IconTextAlignCenter,
      IconTextAlignLeft,
      IconTextAlignRight,
    },
    setup: () => {
      const alignment = shallowRef(new Set(["left"]));
      const formatting = shallowRef(new Set(["bold", "underline"]));

      return { alignment, formatting };
    },
    template: `
      <div class="flex flex-col items-start gap-8">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Text formatting toolbar</p>
          <div class="flex gap-2">
            <ToggleButtonGroup
              :selected-keys="formatting"
              selection-mode="multiple"
              @selection-change="formatting = $event"
            >
              <ToggleButton aria-label="Bold" id="bold" is-icon-only>
                <IconBold />
              </ToggleButton>
              <ToggleButton aria-label="Italic" id="italic" is-icon-only>
                <ToggleButtonGroupSeparator />
                <IconItalic />
              </ToggleButton>
              <ToggleButton aria-label="Underline" id="underline" is-icon-only>
                <ToggleButtonGroupSeparator />
                <IconUnderline />
              </ToggleButton>
              <ToggleButton aria-label="Strikethrough" id="strikethrough" is-icon-only>
                <ToggleButtonGroupSeparator />
                <IconStrikethrough />
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              disallow-empty-selection
              :selected-keys="alignment"
              selection-mode="single"
              @selection-change="alignment = $event"
            >
              <ToggleButton aria-label="Align left" id="left" is-icon-only>
                <IconTextAlignLeft />
              </ToggleButton>
              <ToggleButton aria-label="Align center" id="center" is-icon-only>
                <ToggleButtonGroupSeparator />
                <IconTextAlignCenter />
              </ToggleButton>
              <ToggleButton aria-label="Align right" id="right" is-icon-only>
                <ToggleButtonGroupSeparator />
                <IconTextAlignRight />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">View mode switcher</p>
          <ToggleButtonGroup
            :default-selected-keys="['grid']"
            disallow-empty-selection
            selection-mode="single"
            size="sm"
          >
            <ToggleButton aria-label="Grid view" id="grid" is-icon-only>
              <IconLayoutCellsLarge />
            </ToggleButton>
            <ToggleButton aria-label="List view" id="list" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconListUl />
            </ToggleButton>
            <ToggleButton aria-label="Columns view" id="columns" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconLayoutColumns3 />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Vertical toolbar</p>
          <ToggleButtonGroup orientation="vertical" selection-mode="multiple">
            <ToggleButton aria-label="Bold" id="bold" is-icon-only>
              <IconBold />
            </ToggleButton>
            <ToggleButton aria-label="Italic" id="italic" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconItalic />
            </ToggleButton>
            <ToggleButton aria-label="Underline" id="underline" is-icon-only>
              <ToggleButtonGroupSeparator />
              <IconUnderline />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
    `,
  }),
};
