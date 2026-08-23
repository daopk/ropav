import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import IconCaretRight from "~icons/gravity-ui/caret-right";

import { Breadcrumbs, BreadcrumbsItem } from "./index";

const components = { Breadcrumbs, BreadcrumbsItem };

const meta: StoryMeta = {
  component: Breadcrumbs,
  parameters: { layout: "centered" },
  title: "Components/Navigation/Breadcrumbs",
};

export default meta;

type Story = StoryObj<typeof meta>;

const render =
  (items: string[], extra = "") =>
  () => ({
    components,
    setup: () => ({ items }),
    template: `
    <Breadcrumbs ${extra}>
      <BreadcrumbsItem
        v-for="(item, index) in items"
        :key="item"
        :href="index < items.length - 1 ? '#' : undefined"
      >
        {{ item }}
      </BreadcrumbsItem>
    </Breadcrumbs>
  `,
  });

export const Default: Story = {
  render: render(["Home", "Products", "Electronics", "Laptop"]),
};

export const Level3: Story = {
  render: render(["Home", "Category", "Current Page"]),
};

export const Level2: Story = {
  render: render(["Home", "Current Page"]),
};

export const CustomSeparator: Story = {
  render: () => ({
    components: { ...components, IconCaretRight },
    setup: () => ({ IconCaretRight }),
    template: `
      <Breadcrumbs :separator="IconCaretRight">
        <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Electronics</BreadcrumbsItem>
        <BreadcrumbsItem>Laptop</BreadcrumbsItem>
      </Breadcrumbs>
    `,
  }),
};

export const Disabled: Story = {
  render: render(["Home", "Products", "Electronics", "Laptop"], "is-disabled"),
};
