import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import IconArrowUturnCcwLeft from "~icons/gravity-ui/arrow-uturn-ccw-left";
import IconArrowUturnCwRight from "~icons/gravity-ui/arrow-uturn-cw-right";
import IconBold from "~icons/gravity-ui/bold";
import IconCopy from "~icons/gravity-ui/copy";
import IconItalic from "~icons/gravity-ui/italic";
import IconScissors from "~icons/gravity-ui/scissors";
import IconTextAlignCenter from "~icons/gravity-ui/text-align-center";
import IconTextAlignLeft from "~icons/gravity-ui/text-align-left";
import IconTextAlignRight from "~icons/gravity-ui/text-align-right";
import IconUnderline from "~icons/gravity-ui/underline";

import { Button } from "../button";
import { ButtonGroup, ButtonGroupSeparator } from "../button-group";
import { SeparatorRoot } from "../separator";
import { ToggleButton } from "../toggle-button";
import { ToggleButtonGroup, ToggleButtonGroupSeparator } from "../toggle-button-group";

import { Toolbar } from "./index";

// Dot notation does not resolve in a runtime-compiled template, so each part is
// registered on its own.
const components = {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  IconArrowUturnCcwLeft,
  IconArrowUturnCwRight,
  IconBold,
  IconCopy,
  IconItalic,
  IconScissors,
  IconTextAlignCenter,
  IconTextAlignLeft,
  IconTextAlignRight,
  IconUnderline,
  Separator: SeparatorRoot,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupSeparator,
  Toolbar,
};

const meta: StoryMeta = {
  argTypes: {
    isAttached: {
      control: { type: "boolean" },
    },
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
  component: Toolbar,
  parameters: {
    layout: "centered",
  },
  title: "Components/Layout/Toolbar",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The groups and separators inside a toolbar take their axis from it, so a plain
 * `<Separator />` runs across the row rather than along it.
 */
export const Default: Story = {
  render: () => ({
    components,
    template: `
      <Toolbar aria-label="Text formatting">
        <ToggleButtonGroup aria-label="Text style" selection-mode="multiple">
          <ToggleButton id="bold" aria-label="Bold" is-icon-only>
            <IconBold />
          </ToggleButton>
          <ToggleButton id="italic" aria-label="Italic" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconItalic />
          </ToggleButton>
          <ToggleButton id="underline" aria-label="Underline" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconUnderline />
          </ToggleButton>
        </ToggleButtonGroup>
        <Separator />
        <ButtonGroup>
          <Button aria-label="Copy" is-icon-only variant="secondary">
            <IconCopy />
          </Button>
          <Button aria-label="Cut" is-icon-only variant="secondary">
            <ButtonGroupSeparator />
            <IconScissors />
          </Button>
        </ButtonGroup>
      </Toolbar>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components,
    template: `
      <Toolbar aria-label="Tools" orientation="vertical">
        <ToggleButtonGroup aria-label="Text style" selection-mode="multiple">
          <ToggleButton id="bold" aria-label="Bold" is-icon-only>
            <IconBold />
          </ToggleButton>
          <ToggleButton id="italic" aria-label="Italic" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconItalic />
          </ToggleButton>
          <ToggleButton id="underline" aria-label="Underline" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconUnderline />
          </ToggleButton>
        </ToggleButtonGroup>
        <Separator />
        <ButtonGroup>
          <Button aria-label="Undo" is-icon-only variant="secondary">
            <IconArrowUturnCcwLeft />
          </Button>
          <Button aria-label="Redo" is-icon-only variant="secondary">
            <ButtonGroupSeparator />
            <IconArrowUturnCwRight />
          </Button>
        </ButtonGroup>
      </Toolbar>
    `,
  }),
};

export const WithButtonGroup: Story = {
  render: () => ({
    components,
    template: `
      <Toolbar aria-label="Editor toolbar">
        <ButtonGroup>
          <Button variant="secondary">
            <IconArrowUturnCcwLeft />
            Undo
          </Button>
          <Button variant="secondary">
            <ButtonGroupSeparator />
            <IconArrowUturnCwRight />
            Redo
          </Button>
        </ButtonGroup>
        <Separator />
        <ToggleButtonGroup aria-label="Text style" selection-mode="multiple">
          <ToggleButton id="bold" aria-label="Bold" is-icon-only>
            <IconBold />
          </ToggleButton>
          <ToggleButton id="italic" aria-label="Italic" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconItalic />
          </ToggleButton>
          <ToggleButton id="underline" aria-label="Underline" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconUnderline />
          </ToggleButton>
        </ToggleButtonGroup>
        <Separator />
        <ButtonGroup>
          <Button aria-label="Align left" is-icon-only variant="secondary">
            <IconTextAlignLeft />
          </Button>
          <Button aria-label="Align center" is-icon-only variant="secondary">
            <ButtonGroupSeparator />
            <IconTextAlignCenter />
          </Button>
          <Button aria-label="Align right" is-icon-only variant="secondary">
            <ButtonGroupSeparator />
            <IconTextAlignRight />
          </Button>
        </ButtonGroup>
      </Toolbar>
    `,
  }),
};

export const Attached: Story = {
  render: () => ({
    components,
    template: `
      <Toolbar aria-label="Attached toolbar" is-attached>
        <ToggleButtonGroup aria-label="Text style" selection-mode="multiple">
          <ToggleButton id="bold" aria-label="Bold" is-icon-only>
            <IconBold />
          </ToggleButton>
          <ToggleButton id="italic" aria-label="Italic" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconItalic />
          </ToggleButton>
          <ToggleButton id="underline" aria-label="Underline" is-icon-only>
            <ToggleButtonGroupSeparator />
            <IconUnderline />
          </ToggleButton>
        </ToggleButtonGroup>
        <Separator />
        <ButtonGroup>
          <Button aria-label="Copy" is-icon-only variant="secondary">
            <IconCopy />
          </Button>
          <Button aria-label="Cut" is-icon-only variant="secondary">
            <ButtonGroupSeparator />
            <IconScissors />
          </Button>
        </ButtonGroup>
      </Toolbar>
    `,
  }),
};
