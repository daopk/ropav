import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {buttonVariants} from "../button";
import {ExternalLinkIcon} from "../icons";

import {Link, LinkIcon, LinkRoot} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `Link.Icon` through, so dot notation cannot be used here.
const components = {ExternalLinkIcon, LinkIcon, LinkRoot};

const meta: StoryMeta = {
  component: Link,
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/Link",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({
      buttonClass: buttonVariants({
        class: "gap-0 px-3 py-0.5 no-underline",
        size: "md",
        variant: "tertiary",
      }),
    }),
    template: `
      <div class="flex items-center gap-4">
        <LinkRoot href="#">
          Call to action
          <LinkIcon />
        </LinkRoot>
        <LinkRoot is-disabled href="#">
          Call to action
          <LinkIcon />
        </LinkRoot>
        <LinkRoot
          :class="buttonClass"
          href="https://heroui.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          HeroUI
          <LinkIcon class="h-2 w-2" />
        </LinkRoot>
      </div>
    `,
  }),
};

export const CustomIcon: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-4">
        <LinkRoot href="#">
          External Link
          <LinkIcon>
            <ExternalLinkIcon class="h-3 w-3" />
          </LinkIcon>
        </LinkRoot>
        <LinkRoot href="#">
          <LinkIcon>
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
          </LinkIcon>
          Info Link
        </LinkRoot>
      </div>
    `,
  }),
};

export const IconPlacement: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <LinkRoot href="#">
          Icon at end (default)
          <LinkIcon />
        </LinkRoot>
        <LinkRoot href="#">
          <LinkIcon />
          Icon at start
        </LinkRoot>
      </div>
    `,
  }),
};

export const UnderlineVariants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Default hover underline</p>
          <LinkRoot href="#">
            Hover to see the underline
            <LinkIcon />
          </LinkRoot>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Always visible underline</p>
          <LinkRoot class="underline" href="#">
            Underline always visible
            <LinkIcon />
          </LinkRoot>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">No underline</p>
          <LinkRoot class="no-underline" href="#">
            Link without any underline
            <LinkIcon />
          </LinkRoot>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Changing the underline offset</p>
          <div class="flex flex-col gap-3">
            <LinkRoot class="underline-offset-1" href="#">
              Offset 1 (1px space)
              <LinkIcon />
            </LinkRoot>
            <LinkRoot class="underline-offset-2" href="#">
              Offset 2 (2px space)
              <LinkIcon />
            </LinkRoot>
            <LinkRoot class="underline-offset-3" href="#">
              Offset 3 (3px space)
              <LinkIcon />
            </LinkRoot>
            <LinkRoot class="underline-offset-4" href="#">
              Offset 4 (4px space)
              <LinkIcon />
            </LinkRoot>
          </div>
        </div>
      </div>
    `,
  }),
};
