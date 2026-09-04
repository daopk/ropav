import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { KbdAbbr, KbdContent, Kbd } from "./index";

// Registered under flat names: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "KbdAbbr".
const components = { Kbd: Kbd, KbdAbbr, KbdContent };

const meta: StoryMeta = {
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "light"],
    },
  },
  component: Kbd,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Components/Typography/Kbd",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <Kbd>
        <KbdAbbr key-value="command" />
        <KbdContent>K</KbdContent>
      </Kbd>
    `,
  }),
};

export const WithSingleKey: Story = {
  render: () => ({
    components,
    template: `
      <Kbd>
        <KbdAbbr key-value="command" />
        <KbdContent>K</KbdContent>
      </Kbd>
    `,
  }),
};

export const WithMultipleKeys: Story = {
  render: () => ({
    components,
    template: `
      <Kbd>
        <KbdAbbr key-value="command" />
        <KbdAbbr key-value="shift" />
        <KbdContent>K</KbdContent>
      </Kbd>
    `,
  }),
};

export const KeyCombinations: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span>Copy:</span>
          <Kbd><KbdAbbr key-value="command" /><KbdContent>C</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Paste:</span>
          <Kbd><KbdAbbr key-value="command" /><KbdContent>V</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Cut:</span>
          <Kbd><KbdAbbr key-value="command" /><KbdContent>X</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Undo:</span>
          <Kbd><KbdAbbr key-value="command" /><KbdContent>Z</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Redo:</span>
          <Kbd>
            <KbdAbbr key-value="command" />
            <KbdAbbr key-value="shift" />
            <KbdContent>Z</KbdContent>
          </Kbd>
        </div>
      </div>
    `,
  }),
};

export const LightVariant: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span>Copy:</span>
          <Kbd variant="light"><KbdAbbr key-value="command" /><KbdContent>C</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Paste:</span>
          <Kbd variant="light"><KbdAbbr key-value="command" /><KbdContent>V</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Cut:</span>
          <Kbd variant="light"><KbdAbbr key-value="command" /><KbdContent>X</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Undo:</span>
          <Kbd variant="light"><KbdAbbr key-value="command" /><KbdContent>Z</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Redo:</span>
          <Kbd variant="light">
            <KbdAbbr key-value="command" />
            <KbdAbbr key-value="shift" />
            <KbdContent>Z</KbdContent>
          </Kbd>
        </div>
      </div>
    `,
  }),
};

export const NavigationKeys: Story = {
  render: () => ({
    components,
    setup: () => ({ keys: ["up", "down", "left", "right"] }),
    template: `
      <div class="flex items-center gap-4">
        <Kbd v-for="key in keys" :key="key"><KbdAbbr :key-value="key" /></Kbd>
      </div>
    `,
  }),
};

export const SpecialKeys: Story = {
  render: () => ({
    components,
    setup: () => ({
      keys: [
        "enter",
        "delete",
        "escape",
        "tab",
        "capslock",
        "space",
        "pageup",
        "pagedown",
        "home",
        "end",
        "help",
        "fn",
      ],
    }),
    template: `
      <div class="grid grid-cols-4 gap-4">
        <Kbd v-for="key in keys" :key="key"><KbdAbbr :key-value="key" /></Kbd>
      </div>
    `,
  }),
};

export const ComplexShortcuts: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span>Open Spotlight:</span>
          <Kbd><KbdAbbr key-value="command" /><KbdAbbr key-value="space" /></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Force Quit:</span>
          <Kbd>
            <KbdAbbr key-value="command" />
            <KbdAbbr key-value="option" />
            <KbdAbbr key-value="escape" />
          </Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Screenshot:</span>
          <Kbd>
            <KbdAbbr key-value="command" />
            <KbdAbbr key-value="shift" />
            <KbdContent>3</KbdContent>
          </Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Switch Apps:</span>
          <Kbd><KbdAbbr key-value="command" /><KbdAbbr key-value="tab" /></Kbd>
        </div>
      </div>
    `,
  }),
};

export const InlineUsage: Story = {
  render: () => ({
    components,
    template: `
      <div class="space-y-2">
        <p class="text-sm">
          Press <Kbd><KbdContent>Esc</KbdContent></Kbd> to close the dialog.
        </p>
        <p class="text-sm">
          Use <Kbd><KbdAbbr key-value="command" /><KbdContent>K</KbdContent></Kbd> to open the
          command palette.
        </p>
        <p class="text-sm">
          Navigate with <Kbd><KbdAbbr key-value="up" /></Kbd> and
          <Kbd><KbdAbbr key-value="down" /></Kbd> arrow keys.
        </p>
      </div>
    `,
  }),
};

export const CustomContent: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span>Select word:</span>
          <Kbd><KbdAbbr key-value="option" /><KbdAbbr key-value="left" /></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Delete line:</span>
          <Kbd><KbdAbbr key-value="ctrl" /><KbdContent>K</KbdContent></Kbd>
        </div>
        <div class="flex items-center gap-2">
          <span>Multiple modifiers:</span>
          <Kbd>
            <KbdAbbr key-value="command" />
            <KbdAbbr key-value="option" />
            <KbdAbbr key-value="shift" />
            <KbdContent>4</KbdContent>
          </Kbd>
        </div>
      </div>
    `,
  }),
};
