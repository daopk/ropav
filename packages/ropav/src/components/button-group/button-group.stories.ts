import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {Button} from "../button";
import {Chip, ChipLabel} from "../chip";
import {DescriptionRoot} from "../description";
import {DropdownMenu, DropdownPopover, DropdownRoot} from "../dropdown";
import {LabelRoot} from "../label";
import {MenuItemRoot} from "../menu-item";

import {ButtonGroup, ButtonGroupSeparator} from "./index";

import IconChevronDown from "~icons/gravity-ui/chevron-down";
import IconChevronLeft from "~icons/gravity-ui/chevron-left";
import IconChevronRight from "~icons/gravity-ui/chevron-right";
import IconCodeFork from "~icons/gravity-ui/code-fork";
import IconEllipsis from "~icons/gravity-ui/ellipsis";
import IconGlobe from "~icons/gravity-ui/globe";
import IconPicture from "~icons/gravity-ui/picture";
import IconPin from "~icons/gravity-ui/pin";
import IconPlus from "~icons/gravity-ui/plus";
import IconQrCode from "~icons/gravity-ui/qr-code";
import IconStar from "~icons/gravity-ui/star";
import IconTextAlignCenter from "~icons/gravity-ui/text-align-center";
import IconTextAlignJustify from "~icons/gravity-ui/text-align-justify";
import IconTextAlignLeft from "~icons/gravity-ui/text-align-left";
import IconTextAlignRight from "~icons/gravity-ui/text-align-right";
import IconThumbsDown from "~icons/gravity-ui/thumbs-down";
import IconThumbsUp from "~icons/gravity-ui/thumbs-up";
import IconTrashBin from "~icons/gravity-ui/trash-bin";
import IconVideo from "~icons/gravity-ui/video";

// Dot notation does not resolve in a runtime-compiled template, so each part is
// registered on its own.
const components = {Button, ButtonGroup, ButtonGroupSeparator};

const meta: StoryMeta = {
  argTypes: {
    fullWidth: {
      control: {type: "boolean"},
    },
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

/**
 * The separator is absolutely positioned against the button it divides from the previous
 * one, so it belongs *inside* that button rather than between two of them.
 */
export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <ButtonGroup v-bind="args">
        <Button>First</Button>
        <Button>
          <ButtonGroupSeparator />
          Second
        </Button>
        <Button>
          <ButtonGroupSeparator />
          Third
        </Button>
      </ButtonGroup>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({
      sizes: [
        {label: "Small", size: "sm"},
        {label: "Medium (default)", size: "md"},
        {label: "Large", size: "lg"},
      ],
    }),
    template: `
      <div class="flex flex-col gap-6">
        <div v-for="item in sizes" :key="item.size" class="flex flex-col gap-2">
          <p class="text-sm text-muted">{{ item.label }}</p>
          <ButtonGroup :size="item.size">
            <Button>First</Button>
            <Button>
              <ButtonGroupSeparator />
              Second
            </Button>
            <Button>
              <ButtonGroupSeparator />
              Third
            </Button>
          </ButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components: {
      ...components,
      IconTextAlignCenter,
      IconTextAlignLeft,
      IconTextAlignRight,
    },
    template: `
      <div class="w-[400px] space-y-3">
        <ButtonGroup full-width>
          <Button>First</Button>
          <Button>
            <ButtonGroupSeparator />
            Second
          </Button>
          <Button>
            <ButtonGroupSeparator />
            Third
          </Button>
        </ButtonGroup>
        <ButtonGroup full-width>
          <Button aria-label="Align left" is-icon-only>
            <IconTextAlignLeft />
          </Button>
          <Button aria-label="Align center" is-icon-only>
            <ButtonGroupSeparator />
            <IconTextAlignCenter />
          </Button>
          <Button aria-label="Align right" is-icon-only>
            <ButtonGroupSeparator />
            <IconTextAlignRight />
          </Button>
        </ButtonGroup>
      </div>
    `,
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
      ],
    }),
    template: `
      <div class="flex flex-col gap-6">
        <div v-for="item in variants" :key="item.variant" class="flex flex-col gap-2">
          <p class="text-sm text-muted">{{ item.label }}</p>
          <ButtonGroup :variant="item.variant">
            <Button>First</Button>
            <Button>
              <ButtonGroupSeparator />
              Second
            </Button>
            <Button>
              <ButtonGroupSeparator />
              Third
            </Button>
          </ButtonGroup>
        </div>
      </div>
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
          <Button>
            <ButtonGroupSeparator />
            Week
          </Button>
          <Button>
            <ButtonGroupSeparator />
            Month
          </Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical" variant="secondary">
          <Button>Day</Button>
          <Button>
            <ButtonGroupSeparator />
            Week
          </Button>
          <Button>
            <ButtonGroupSeparator />
            Month
          </Button>
        </ButtonGroup>
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
          <ButtonGroup is-disabled>
            <Button>First</Button>
            <Button>
              <ButtonGroupSeparator />
              Second
            </Button>
            <Button>
              <ButtonGroupSeparator />
              Third
            </Button>
          </ButtonGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Group disabled, but one button overrides</p>
          <ButtonGroup is-disabled>
            <Button>First</Button>
            <Button>
              <ButtonGroupSeparator />
              Second
            </Button>
            <Button :is-disabled="false">
              <ButtonGroupSeparator />
              Third (enabled)
            </Button>
          </ButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    components: {...components, IconGlobe, IconPlus, IconTrashBin},
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">With icons</p>
          <ButtonGroup variant="secondary">
            <Button>
              <IconGlobe />
              Search
            </Button>
            <Button>
              <ButtonGroupSeparator />
              <IconPlus />
              Add
            </Button>
            <Button>
              <ButtonGroupSeparator />
              <IconTrashBin />
              Delete
            </Button>
          </ButtonGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Icon only buttons</p>
          <ButtonGroup variant="tertiary">
            <Button aria-label="Search" is-icon-only>
              <IconGlobe />
            </Button>
            <Button aria-label="Add" is-icon-only>
              <ButtonGroupSeparator />
              <IconPlus />
            </Button>
            <Button aria-label="Delete" is-icon-only>
              <ButtonGroupSeparator />
              <IconTrashBin />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    `,
  }),
};

export const WithoutSeparator: Story = {
  render: () => ({
    components,
    template: `
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>
    `,
  }),
};

/** Mirrors the React `Examples` story. */
export const Examples: Story = {
  render: () => ({
    components: {
      ...components,
      Chip,
      ChipLabel,
      Description: DescriptionRoot,
      Dropdown: DropdownRoot,
      DropdownItem: MenuItemRoot,
      DropdownMenu,
      DropdownPopover,
      IconChevronDown,
      IconChevronLeft,
      IconChevronRight,
      IconCodeFork,
      IconEllipsis,
      IconPicture,
      IconPin,
      IconQrCode,
      IconStar,
      IconTextAlignCenter,
      IconTextAlignJustify,
      IconTextAlignLeft,
      IconTextAlignRight,
      IconThumbsDown,
      IconThumbsUp,
      IconVideo,
      Label: LabelRoot,
    },
    setup: () => ({
      mergeStrategies: [
        {
          description: "All commits from this branch will be added to the base branch",
          id: "merge",
          label: "Create a merge commit",
        },
        {
          description:
            "The 14 commits from this branch will be combined into one commit in the base branch",
          id: "squash-and-merge",
          label: "Squash and merge",
        },
        {
          description:
            "The 14 commits from this branch will be rebased and added to the base branch",
          id: "rebase-and-merge",
          label: "Rebase and merge",
        },
      ],
    }),
    // The dropdown's trigger is the grouped button itself, separator and all: the group styles the
    // button, and the dropdown hands it the press behaviour on top.
    template: `
      <div class="flex flex-col items-start gap-8">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Single button with dropdown</p>
          <ButtonGroup>
            <Button>Merge pull request</Button>
            <Dropdown>
              <Button aria-label="More options" is-icon-only>
                <ButtonGroupSeparator />
                <IconChevronDown />
              </Button>
              <DropdownPopover class="max-w-[290px]" placement="bottom end">
                <DropdownMenu>
                  <DropdownItem
                    v-for="strategy in mergeStrategies"
                    :id="strategy.id"
                    :key="strategy.id"
                    class="flex flex-col items-start gap-1"
                    :text-value="strategy.label"
                  >
                    <Label>{{ strategy.label }}</Label>
                    <Description>{{ strategy.description }}</Description>
                  </DropdownItem>
                </DropdownMenu>
              </DropdownPopover>
            </Dropdown>
          </ButtonGroup>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Individual buttons</p>
          <div class="flex gap-2">
            <ButtonGroup variant="tertiary">
              <Button>
                <IconCodeFork class="size-3.5" />
                Fork
                <Chip color="accent" size="sm" variant="soft"><ChipLabel>24</ChipLabel></Chip>
              </Button>
              <Button aria-label="More fork options" is-icon-only>
                <ButtonGroupSeparator />
                <IconChevronDown />
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="tertiary">
              <Button aria-label="Show QR code" is-icon-only>
                <IconQrCode />
              </Button>
              <Button>
                <ButtonGroupSeparator />
                Scan to pay
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="tertiary">
              <Button>
                <IconThumbsUp />
                <span class="text-xs font-semibold">2.4K</span>
              </Button>
              <Button aria-label="Dislike" is-icon-only>
                <ButtonGroupSeparator />
                <IconThumbsDown />
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="tertiary">
              <Button>
                <IconStar class="size-3.5" />
                Star
              </Button>
              <Button class="px-2">
                <ButtonGroupSeparator />
                <Chip color="accent" size="sm" variant="soft"><ChipLabel>104</ChipLabel></Chip>
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="tertiary">
              <Button>
                <IconPin />
                Pinned
              </Button>
              <Button aria-label="More pin options" is-icon-only>
                <ButtonGroupSeparator />
                <IconChevronDown />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Previous/Next navigation</p>
          <ButtonGroup variant="tertiary">
            <Button>
              <IconChevronLeft />
              Previous
            </Button>
            <Button>
              <ButtonGroupSeparator />
              Next
              <IconChevronRight />
            </Button>
          </ButtonGroup>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Content selection</p>
          <ButtonGroup variant="tertiary">
            <Button>
              <IconPicture />
              Photos
            </Button>
            <Button>
              <ButtonGroupSeparator />
              <IconVideo />
              Videos
            </Button>
            <Button aria-label="More options" is-icon-only>
              <ButtonGroupSeparator />
              <IconEllipsis />
            </Button>
          </ButtonGroup>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Text alignment</p>
          <ButtonGroup variant="tertiary">
            <Button>Left</Button>
            <Button>
              <ButtonGroupSeparator />
              Center
            </Button>
            <Button>
              <ButtonGroupSeparator />
              Right
            </Button>
          </ButtonGroup>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Icon-only alignment</p>
          <ButtonGroup variant="tertiary">
            <Button aria-label="Align left" is-icon-only>
              <IconTextAlignLeft />
            </Button>
            <Button aria-label="Align center" is-icon-only>
              <ButtonGroupSeparator />
              <IconTextAlignCenter />
            </Button>
            <Button aria-label="Align right" is-icon-only>
              <ButtonGroupSeparator />
              <IconTextAlignRight />
            </Button>
            <Button aria-label="Justify" is-icon-only>
              <ButtonGroupSeparator />
              <IconTextAlignJustify />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    `,
  }),
};
