import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "./index";

/**
 * Runtime-compiled story templates cannot resolve `AccordionItem` — dot notation is an SFC
 * compiler feature. The parts are registered individually instead.
 */
const components = {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
};

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

const meta: StoryMeta = {
  argTypes: {
    allowsMultipleExpanded: { control: { type: "boolean" } },
    hideSeparator: { control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
    variant: {
      control: { type: "select" },
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
      <AccordionItem v-for="item in items" :id="item.id" :key="item.id">
        <AccordionHeading>
          <AccordionTrigger>
            {{ item.title }}
            <AccordionIndicator />
          </AccordionTrigger>
        </AccordionHeading>
        <AccordionPanel>
          <AccordionBody>{{ item.content }}</AccordionBody>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  </div>
`;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: ITEMS }),
    template,
  }),
};

export const SurfaceVariant: Story = {
  args: { variant: "surface" },
  render: (args) => ({
    components,
    setup: () => ({ args, items: ITEMS }),
    template,
  }),
};

export const WithoutSeparator: Story = {
  args: { hideSeparator: true },
  render: (args) => ({
    components,
    setup: () => ({ args, items: ITEMS }),
    template,
  }),
};

export const SingleExpanded: Story = {
  args: { allowsMultipleExpanded: false },
  render: (args) => ({
    components,
    setup: () => ({ args, items: ITEMS }),
    template,
  }),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => ({
    components,
    setup: () => ({ args, items: ITEMS }),
    template,
  }),
};
