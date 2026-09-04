import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { ref } from "vue";

import { buttonVariants } from "../button";
import { ExternalLinkIcon } from "../icons";
import { RouterProvider } from "../router-provider";

import { Link, LinkIcon } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `LinkIcon` through, so dot notation cannot be used here.
const components = { ExternalLinkIcon, Link, LinkIcon, RouterProvider };

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
        <Link href="#">
          Call to action
          <LinkIcon />
        </Link>
        <Link is-disabled href="#">
          Call to action
          <LinkIcon />
        </Link>
        <Link
          :class="buttonClass"
          href="https://github.com/daopk/ropav"
          rel="noopener noreferrer"
          target="_blank"
        >
          Ropav
          <LinkIcon class="h-2 w-2" />
        </Link>
      </div>
    `,
  }),
};

export const CustomIcon: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-4">
        <Link href="#">
          External Link
          <LinkIcon>
            <ExternalLinkIcon class="h-3 w-3" />
          </LinkIcon>
        </Link>
        <Link href="#">
          <LinkIcon>
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
          </LinkIcon>
          Info Link
        </Link>
      </div>
    `,
  }),
};

export const IconPlacement: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <Link href="#">
          Icon at end (default)
          <LinkIcon />
        </Link>
        <Link href="#">
          <LinkIcon />
          Icon at start
        </Link>
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
          <Link href="#">
            Hover to see the underline
            <LinkIcon />
          </Link>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Always visible underline</p>
          <Link class="underline" href="#">
            Underline always visible
            <LinkIcon />
          </Link>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">No underline</p>
          <Link class="no-underline" href="#">
            Link without any underline
            <LinkIcon />
          </Link>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">Changing the underline offset</p>
          <div class="flex flex-col gap-3">
            <Link class="underline-offset-1" href="#">
              Offset 1 (1px space)
              <LinkIcon />
            </Link>
            <Link class="underline-offset-2" href="#">
              Offset 2 (2px space)
              <LinkIcon />
            </Link>
            <Link class="underline-offset-3" href="#">
              Offset 3 (3px space)
              <LinkIcon />
            </Link>
            <Link class="underline-offset-4" href="#">
              Offset 4 (4px space)
              <LinkIcon />
            </Link>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * A router stands in for the application's own, since Storybook runs without one. The three links
 * asking `aria-current="auto"` never reload the page: their clicks reach `navigate` instead, and
 * the route below follows. The two beneath them are the cases a router cannot serve, so the
 * browser keeps them.
 */
export const Routing: Story = {
  render: () => ({
    components,
    setup: () => {
      const path = ref("/inbox");

      return {
        isCurrent: (href: string) => href === path.value,
        navigate: (href: string) => {
          path.value = href;
        },
        path,
      };
    },
    template: `
      <RouterProvider :is-current="isCurrent" :navigate="navigate">
        <div class="flex flex-col gap-6">
          <nav class="flex items-center gap-4">
            <Link
              v-for="href in ['/inbox', '/drafts', '/sent']"
              :key="href"
              aria-current="auto"
              class="no-underline data-[current=true]:font-semibold data-[current=true]:underline"
              :href="href"
            >
              {{ href.slice(1) }}
            </Link>
          </nav>

          <p class="text-sm text-muted">
            Route: <code>{{ path }}</code> — no reload, and no vue-router in the library.
          </p>

          <div class="flex flex-col gap-2">
            <p class="text-sm text-muted">The browser keeps these:</p>
            <div class="flex items-center gap-4">
              <Link
                href="https://github.com/daopk/ropav"
                rel="noopener noreferrer"
                target="_blank"
              >
                Another origin
                <LinkIcon />
              </Link>
              <Link download="notes.txt" href="/notes.txt">A download</Link>
            </div>
          </div>
        </div>
      </RouterProvider>
    `,
  }),
};
