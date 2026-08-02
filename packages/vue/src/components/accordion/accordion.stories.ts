import type {Meta, StoryObj} from "@storybook/vue3";

import {Accordion} from "./index";

const ITEMS = [
  {
    content:
      "Browse our products, add items to your cart, and proceed to checkout. You'll need to provide shipping and payment information to complete your purchase.",
    id: "order",
    title: "How do I place an order?",
  },
  {
    content:
      "Orders can be modified or cancelled within one hour of being placed. After that, the order is already on its way.",
    id: "modify",
    title: "Can I modify or cancel my order?",
  },
  {
    content: "We accept all major credit cards, PayPal, and Apple Pay.",
    id: "payment",
    title: "What payment methods do you accept?",
  },
];

const meta: Meta = {
  argTypes: {
    allowsMultipleExpanded: {control: {type: "boolean"}},
    hideSeparator: {control: {type: "boolean"}},
    isDisabled: {control: {type: "boolean"}},
    variant: {
      control: {type: "select"},
      options: ["default", "surface"],
    },
  },
  args: {
    allowsMultipleExpanded: true,
  },
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/Accordion",
};

export default meta;

type Story = StoryObj<typeof meta>;

const template = `
  <div class="w-full max-w-md">
    <Accordion v-bind="args">
      <Accordion.Item v-for="item in items" :id="item.id" :key="item.id">
        <Accordion.Heading>
          <Accordion.Trigger>
            {{ item.title }}
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>{{ item.content }}</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  </div>
`;

export const Default: Story = {
  render: (args) => ({
    components: {Accordion},
    setup: () => ({args, items: ITEMS}),
    template,
  }),
};

export const SurfaceVariant: Story = {
  args: {variant: "surface"},
  render: (args) => ({
    components: {Accordion},
    setup: () => ({args, items: ITEMS}),
    template,
  }),
};

export const WithoutSeparator: Story = {
  args: {hideSeparator: true},
  render: (args) => ({
    components: {Accordion},
    setup: () => ({args, items: ITEMS}),
    template,
  }),
};

export const SingleExpanded: Story = {
  args: {allowsMultipleExpanded: false},
  render: (args) => ({
    components: {Accordion},
    setup: () => ({args, items: ITEMS}),
    template,
  }),
};

export const Disabled: Story = {
  args: {isDisabled: true},
  render: (args) => ({
    components: {Accordion},
    setup: () => ({args, items: ITEMS}),
    template,
  }),
};
