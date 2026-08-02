import type {Meta, StoryObj} from "@storybook/vue3";

import {Card} from "./index";

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
    components: {Card},
    setup: () => ({args}),
    template: `
      <Card class="w-[400px]" v-bind="args">
        <Card.Header>
          <Card.Title>Become an Acme Creator!</Card.Title>
          <Card.Description>
            Visit the Acme Creator Hub to sign up today and start earning credits from your fans
            and followers.
          </Card.Description>
        </Card.Header>
        <Card.Content>Anyone can join, no application needed.</Card.Content>
        <Card.Footer>Creator Hub</Card.Footer>
      </Card>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: {Card},
    setup: () => ({variants: ["transparent", "default", "secondary", "tertiary"]}),
    template: `
      <div class="flex flex-col gap-4">
        <Card v-for="variant in variants" :key="variant" class="w-[320px]" :variant="variant">
          <Card.Header>
            <Card.Title>{{ variant }}</Card.Title>
            <Card.Description>The {{ variant }} card variant</Card.Description>
          </Card.Header>
          <Card.Content>Card content sits here.</Card.Content>
        </Card>
      </div>
    `,
  }),
};
