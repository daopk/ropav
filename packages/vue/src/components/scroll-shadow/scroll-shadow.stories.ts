import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";

import {Button} from "../button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "../card";

import {ScrollShadow} from "./index";

const components = {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ScrollShadow,
};

const paragraphs = Array.from(
  {length: 10},
  () =>
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus hendrerit venenatis.",
);

const meta: StoryMeta = {
  component: ScrollShadow,
  parameters: {layout: "centered"},
  title: "Components/Utilities/ScrollShadow",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args, paragraphs}),
    template: `
      <div class="w-full p-0 sm:max-w-sm">
        <ScrollShadow v-bind="args" class="max-h-[240px] p-4">
          <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
        </ScrollShadow>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({paragraphs}),
    template: `
      <div class="flex flex-col gap-8">
        <div v-for="label in ['Fade', 'Fade with compact content']" :key="label">
          <h4 class="mb-2 text-sm font-semibold">{{ label }}</h4>
          <ScrollShadow class="max-h-[200px] max-w-sm p-4">
            <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
          </ScrollShadow>
        </div>
      </div>
    `,
  }),
};

export const Orientation: Story = {
  render: () => ({
    components,
    setup: () => ({paragraphs}),
    template: `
      <div class="flex flex-col gap-8">
        <div>
          <h4 class="mb-2 text-sm font-semibold">Vertical</h4>
          <Card class="w-full p-0 sm:max-w-sm">
            <ScrollShadow class="max-h-[240px] p-4">
              <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
            </ScrollShadow>
          </Card>
        </div>
        <div>
          <h4 class="mb-2 text-sm font-semibold">Horizontal</h4>
          <Card class="w-[420px] p-0">
            <ScrollShadow class="p-4" orientation="horizontal">
              <div class="flex w-max gap-4">
                <Card v-for="index in 10" :key="index" class="min-w-[180px] p-4" variant="transparent">
                  <CardTitle class="text-sm">Bridging the Future</CardTitle>
                  <CardDescription class="text-xs">Today, 6:30 PM</CardDescription>
                </Card>
              </div>
            </ScrollShadow>
          </Card>
        </div>
      </div>
    `,
  }),
};

export const HideScrollBar: Story = {
  render: () => ({
    components,
    setup: () => ({paragraphs}),
    template: `
      <ScrollShadow hide-scroll-bar class="max-h-[240px] max-w-sm p-4">
        <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
      </ScrollShadow>
    `,
  }),
};

export const CustomSize: Story = {
  render: () => ({
    components,
    setup: () => ({paragraphs, sizes: [20, 40, 80]}),
    template: `
      <div class="flex flex-col gap-6">
        <div v-for="size in sizes" :key="size">
          <h4 class="mb-2 text-sm font-semibold">{{ size }}px shadow</h4>
          <ScrollShadow class="max-h-[160px] max-w-sm p-4" :size="size">
            <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
          </ScrollShadow>
        </div>
      </div>
    `,
  }),
};

export const VisibilityChange: Story = {
  render: () => ({
    components,
    setup: () => {
      const state = shallowRef("none");

      return {paragraphs, setState: (value: string) => (state.value = value), state};
    },
    template: `
      <div class="flex flex-col gap-4">
        <div class="rounded bg-default p-4 text-sm font-semibold">Vertical Shadow State: {{ state }}</div>
        <ScrollShadow
          class="max-h-[240px] max-w-sm p-4"
          :on-visibility-change="setState"
        >
          <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
        </ScrollShadow>
      </div>
    `,
  }),
};

export const WithCard: Story = {
  render: () => ({
    components,
    setup: () => ({paragraphs}),
    template: `
      <Card class="max-w-[400px]">
        <CardHeader><CardTitle>Terms and Conditions</CardTitle><CardDescription>Please review before proceeding</CardDescription></CardHeader>
        <CardContent class="p-0">
          <ScrollShadow class="h-[300px] px-4" :size="80">
            <div class="space-y-4"><p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p></div>
          </ScrollShadow>
        </CardContent>
        <CardFooter class="mt-4 flex flex-row gap-2"><Button class="w-full" variant="secondary">Cancel</Button><Button class="w-full">Accept</Button></CardFooter>
      </Card>
    `,
  }),
};
