import type {Meta, StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";
import IconCircleInfo from "~icons/gravity-ui/circle-info";

import {avatarSrc} from "../../utils/story-assets";
import {AvatarFallback, AvatarImage, AvatarRoot} from "../avatar";
import {ButtonRoot} from "../button";
import {CardContent, CardDescription, CardHeader, CardRoot, CardTitle} from "../card";

import PopoverArrow from "./popover-arrow.vue";
import PopoverContent from "./popover-content.vue";
import PopoverDialog from "./popover-dialog.vue";
import PopoverHeading from "./popover-heading.vue";
import PopoverRoot from "./popover-root.vue";
import PopoverTrigger from "./popover-trigger.vue";

// Registered under flat names: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "Popover.Dialog".
const components = {
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Button: ButtonRoot,
  Card: CardRoot,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconCircleInfo,
  Popover: PopoverRoot,
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverTrigger,
};

const meta = {
  argTypes: {
    offset: {control: "number"},
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
  parameters: {layout: "centered"},
  title: "Components/Overlays/Popover",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const AVATAR_SRC = avatarSrc(5);

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <div class="flex items-center gap-3">
        <Popover>
          <Button aria-label="Popover trigger" is-icon-only variant="tertiary">
            <IconCircleInfo />
          </Button>
          <PopoverContent v-bind="args">
            <PopoverDialog>
              <PopoverHeading>Popover heading</PopoverHeading>
              <p>This is the popover content</p>
            </PopoverDialog>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
};

export const WithArrow: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <div class="flex items-center gap-3">
        <Popover>
          <Button aria-label="Popover trigger" is-icon-only variant="tertiary">
            <IconCircleInfo />
          </Button>
          <PopoverContent v-bind="args">
            <PopoverDialog>
              <PopoverArrow />
              <PopoverHeading>Popover heading</PopoverHeading>
              <p>This is the popover content</p>
            </PopoverDialog>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
};

export const WithCustomContent: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const isFollowing = shallowRef(false);

      return {AVATAR_SRC, args, isFollowing};
    },
    template: `
      <div class="flex items-center gap-3">
        <Popover>
          <PopoverTrigger aria-label="Popover trigger">
            <div class="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage alt="Zoe" :src="AVATAR_SRC" />
                <AvatarFallback>Z</AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-0">
                <p class="text-sm leading-5 font-medium">Zoe</p>
                <p class="text-xs leading-none text-muted">zoe@ropav.com</p>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent v-bind="args" class="w-[290px]">
            <PopoverDialog class="flex flex-col gap-3">
              <PopoverHeading>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Avatar size="md">
                      <AvatarImage alt="Zoe" :src="AVATAR_SRC" />
                      <AvatarFallback>Z</AvatarFallback>
                    </Avatar>
                    <div class="flex h-full flex-col items-start justify-center">
                      <span class="text-sm font-medium">Zoey Lang</span>
                      <span class="text-sm leading-4 font-normal tracking-tight text-muted">
                        @zoe
                      </span>
                    </div>
                  </div>
                  <Button
                    class="rounded-full text-xs font-normal"
                    size="sm"
                    :variant="isFollowing ? 'tertiary' : 'primary'"
                    @click="isFollowing = !isFollowing"
                  >
                    {{ isFollowing ? "Following" : "Follow" }}
                  </Button>
                </div>
              </PopoverHeading>
              <div>
                <p class="ps-px text-sm">
                  Design Engineer, @hero_ui lover she/her. SF Bay Area&nbsp;
                  <span aria-label="confetti" role="img">🎉</span>
                </p>
              </div>
              <div class="flex gap-3">
                <div class="flex gap-1">
                  <p class="text-sm font-semibold">4</p>
                  <p class="text-sm text-muted">Following</p>
                </div>
                <div class="flex gap-1">
                  <p class="text-sm font-semibold">97.1K</p>
                  <p class="text-sm text-muted">Followers</p>
                </div>
              </div>
            </PopoverDialog>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
};

export const SpringAnimation: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <div class="flex flex-col items-center gap-8 p-8">
        <h1 class="text-xl font-semibold">Popover with Spring Animation</h1>
        <p class="text-sm text-muted">
          The popover now uses a spring easing function for a more dynamic feel
        </p>

        <div class="flex items-center gap-8">
          <Popover>
            <Button>Click for Spring Animation</Button>
            <PopoverContent
              v-bind="args"
              class="data-[entering]:ease-spring data-[entering]:animate-in data-[entering]:duration-600 data-[entering]:fade-in-0 data-[entering]:zoom-in-90"
            >
              <PopoverDialog>
                <PopoverArrow />
                <PopoverHeading>Spring Animation 🎉</PopoverHeading>
                <p class="mt-2 text-sm text-muted">
                  Notice the subtle bounce effect when the popover appears and disappears.
                </p>
                <p class="mt-4 text-xs text-muted">Easing: cubic-bezier(0.36, 1.66, 0.04, 1)</p>
              </PopoverDialog>
            </PopoverContent>
          </Popover>
        </div>

        <div class="space-y-1 text-center text-xs text-muted">
          <p>Animation classes applied:</p>
          <code class="rounded bg-surface px-2 py-1 text-xs">
            data-[entering]:animate-in data-[entering]:zoom-in-90 data-[entering]:fade-in-0
            data-[entering]:ease-spring data-[entering]:duration-600
          </code>
        </div>
      </div>
    `,
  }),
};

export const CardWithHelptext: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Card class="w-[400px]">
        <CardHeader>
          <div class="flex items-center gap-2">
            <CardTitle>Card Title</CardTitle>
            <Popover>
              <PopoverTrigger aria-label="Help information">
                <Button aria-label="Help" is-icon-only size="sm" variant="ghost">
                  <IconCircleInfo class="text-muted" />
                </Button>
              </PopoverTrigger>
              <PopoverContent v-bind="args" class="max-w-[200px]" placement="right">
                <PopoverDialog>
                  <PopoverArrow />
                  <PopoverHeading>Help Information</PopoverHeading>
                  <p class="text-sm text-muted">
                    This is a helptext popover that appears on top of the card surface. It provides
                    additional context or information about the card title.
                  </p>
                </PopoverDialog>
              </PopoverContent>
            </Popover>
          </div>
          <CardDescription>
            This card demonstrates how a popover looks when displayed on top of a card surface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm">
            The popover help icon is positioned right after the title, allowing users to access
            additional information without cluttering the main content area.
          </p>
        </CardContent>
      </Card>
    `,
  }),
};
