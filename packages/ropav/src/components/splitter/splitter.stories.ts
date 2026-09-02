import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { SplitterHandle, SplitterPanel, SplitterRoot } from "./index";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "Splitter.Panel".
const components = {
  Splitter: SplitterRoot,
  SplitterHandle,
  SplitterPanel,
};

/** Every panel gets the same padded box, so the stories differ only in the splitter itself. */
const pane = "flex h-full w-full items-center justify-center p-4 text-small text-muted";

const meta: StoryMeta = {
  argTypes: {
    isDisabled: { control: { type: "boolean" } },
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
  component: SplitterRoot,
  // A splitter fills whatever contains it, so without a sized box there is nothing to divide.
  decorators: [
    () => ({
      template: '<div class="h-72 w-[42rem] max-w-full rounded-lg border"><story /></div>',
    }),
  ],
  parameters: {
    layout: "centered",
  },
  title: "Components/Layout/Splitter",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { isDisabled: false, orientation: "horizontal" },
  render: (args) => ({
    components,
    setup: () => ({ args, pane }),
    template: `
      <Splitter aria-label="Editor layout" :is-disabled="args.isDisabled" :orientation="args.orientation">
        <SplitterPanel default-size="1fr">
          <div :class="pane">Sidebar</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel default-size="2fr">
          <div :class="pane">Editor</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Editor and console" orientation="vertical">
        <SplitterPanel default-size="2fr">
          <div :class="pane">Editor</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel default-size="1fr">
          <div :class="pane">Console</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

/** A pixel sidebar holds its width when the window resizes; the fraction beside it absorbs. */
export const FixedSidebar: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Fixed sidebar layout">
        <SplitterPanel default-size="240px" max-size="360px" min-size="160px">
          <div :class="pane">240px, 160–360</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel>
          <div :class="pane">1fr</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

export const MinAndMax: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Clamped layout">
        <SplitterPanel max-size="70%" min-size="20%">
          <div :class="pane">20% – 70%</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel min-size="20%">
          <div :class="pane">at least 20%</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

/** Drag the divider past the panel's minimum, or press Enter on the handle, to shut it. */
export const Collapsible: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Collapsible sidebar">
        <SplitterPanel :collapsed-size="0" default-size="240px" is-collapsible min-size="160px">
          <div :class="pane">Drag me shut</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel>
          <div :class="pane">Editor</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

/** A collapsed panel can keep a rail rather than disappearing outright. */
export const CollapsesToARail: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Rail sidebar">
        <SplitterPanel :collapsed-size="48" default-size="220px" is-collapsible min-size="180px">
          <div :class="pane">Rail at 48px</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel>
          <div :class="pane">Editor</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

export const ThreePanels: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Three panel layout">
        <SplitterPanel min-size="15%">
          <div :class="pane">Files</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel min-size="20%">
          <div :class="pane">Editor</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel min-size="15%">
          <div :class="pane">Preview</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

/** Each group answers to its own axis, so the inner divider runs the other way. */
export const Nested: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Workspace">
        <SplitterPanel default-size="220px" min-size="140px">
          <div :class="pane">Sidebar</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel>
          <Splitter aria-label="Editor and console" orientation="vertical">
            <SplitterPanel default-size="2fr">
              <div :class="pane">Editor</div>
            </SplitterPanel>
            <SplitterHandle />
            <SplitterPanel default-size="1fr">
              <div :class="pane">Console</div>
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

/**
 * Resize it, reload the page, and the layout comes back.
 *
 * The panels carry explicit ids on purpose: a stored layout is matched against the panels on
 * screen, and generated keys would stop matching the moment a panel was added or reordered.
 */
export const Persisted: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Remembered layout" auto-save-id="storybook-splitter">
        <SplitterPanel id="sidebar" default-size="240px" min-size="160px">
          <div :class="pane">Resize me, then reload</div>
        </SplitterPanel>
        <SplitterHandle id="sidebar-handle" />
        <SplitterPanel id="editor">
          <div :class="pane">Editor</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({ pane }),
    template: `
      <Splitter aria-label="Locked layout" is-disabled>
        <SplitterPanel>
          <div :class="pane">Locked</div>
        </SplitterPanel>
        <SplitterHandle />
        <SplitterPanel>
          <div :class="pane">Locked</div>
        </SplitterPanel>
      </Splitter>
    `,
  }),
};
