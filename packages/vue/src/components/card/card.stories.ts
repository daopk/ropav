import type {Meta, StoryObj} from "@storybook/vue3";

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "./index";

/**
 * Story templates are compiled at runtime, where Vue resolves a tag like `Card.Header`
 * as a component literally named "Card.Header" and fails. Dot notation only works in an
 * SFC, whose compiler resolves it against the setup scope. So the parts are registered
 * individually here — in application code `<Card.Header>` inside an SFC is fine.
 */
const components = {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle};

const meta: Meta = {
  argTypes: {
    variant: {
      control: {type: "select"},
      options: ["transparent", "default", "secondary", "tertiary"],
    },
  },
  component: Card,
  parameters: {
    layout: "centered",
  },
  title: "Components/Layout/Card",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Card class="w-[400px]" v-bind="args">
        <CardHeader>
          <CardTitle>Become an Acme Creator!</CardTitle>
          <CardDescription>
            Visit the Acme Creator Hub to sign up today and start earning credits from your fans
            and followers.
          </CardDescription>
        </CardHeader>
        <CardContent>Anyone can join, no application needed.</CardContent>
        <CardFooter>Creator Hub</CardFooter>
      </Card>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({variants: ["transparent", "default", "secondary", "tertiary"]}),
    template: `
      <div class="flex flex-col gap-4">
        <Card v-for="variant in variants" :key="variant" class="w-[320px]" :variant="variant">
          <CardHeader>
            <CardTitle>{{ variant }}</CardTitle>
            <CardDescription>The {{ variant }} card variant</CardDescription>
          </CardHeader>
          <CardContent>Card content sits here.</CardContent>
        </Card>
      </div>
    `,
  }),
};
