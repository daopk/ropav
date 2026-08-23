import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { computed, shallowRef } from "vue";
import IconArrowLeft from "~icons/gravity-ui/arrow-left";
import IconArrowRight from "~icons/gravity-ui/arrow-right";

import { SeparatorRoot } from "../separator";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationSummary,
} from "./index";

// Dot notation does not resolve in a runtime-compiled template, so each part is
// registered on its own.
const components = {
  IconArrowLeft,
  IconArrowRight,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationSummary,
  Separator: SeparatorRoot,
};

const meta: StoryMeta = {
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
  component: Pagination,
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/Pagination",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Pagination :size="args.size">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious>
              <PaginationPreviousIcon />
              <span>Previous</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink is-active>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext>
              <span>Next</span>
              <PaginationNextIcon />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex flex-col gap-8">
        <template v-for="(size, index) of sizes" :key="size">
          <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-muted capitalize">{{ size }}</span>
            <Pagination :size="size">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious>
                    <PaginationPreviousIcon />
                    <span>Previous</span>
                  </PaginationPrevious>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink is-active>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext>
                    <span>Next</span>
                    <PaginationNextIcon />
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          <Separator v-if="index < sizes.length - 1" />
        </template>
      </div>
    `,
  }),
};

export const WithEllipsis: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Pagination :size="args.size">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious>
              <PaginationPreviousIcon />
              <span>Previous</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink is-active>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>10</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>11</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>12</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext>
              <span>Next</span>
              <PaginationNextIcon />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
};

export const SimplePrevNext: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Pagination :size="args.size">
        <PaginationSummary>1 to 5 of 10 invoices</PaginationSummary>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious>
              <PaginationPreviousIcon />
              <span>Prev</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext>
              <span>Next</span>
              <PaginationNextIcon />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
};

export const WithSummary: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="w-full min-w-[640px]">
        <Pagination :size="args.size">
          <PaginationSummary>Showing 1-10 of 120 results</PaginationSummary>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious>
                <PaginationPreviousIcon />
                <span>Previous</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink is-active>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>10</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>11</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>12</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext>
                <span>Next</span>
                <PaginationNextIcon />
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
};

export const CustomIcons: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Pagination :size="args.size">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious>
              <PaginationPreviousIcon>
                <IconArrowLeft />
              </PaginationPreviousIcon>
              <span>Back</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink is-active>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext>
              <span>Forward</span>
              <PaginationNextIcon>
                <IconArrowRight />
              </PaginationNextIcon>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
};

const TOTAL_PAGES = 12;
const ITEMS_PER_PAGE = 10;
const TOTAL_ITEMS = 120;

/** The window of page numbers around the current one, with gaps collapsed to an ellipsis. */
const pageWindow = (page: number) => {
  if (TOTAL_PAGES <= 7) {
    return Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1);
  }

  const pages: (number | "start-ellipsis" | "end-ellipsis")[] = [1];

  if (page > 3) pages.push("start-ellipsis");

  for (let i = Math.max(2, page - 1); i <= Math.min(TOTAL_PAGES - 1, page + 1); i++) {
    pages.push(i);
  }

  if (page < TOTAL_PAGES - 2) pages.push("end-ellipsis");

  pages.push(TOTAL_PAGES);

  return pages;
};

export const Controlled: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const page = shallowRef(1);

      return {
        args,
        endItem: computed(() => Math.min(page.value * ITEMS_PER_PAGE, TOTAL_ITEMS)),
        page,
        pages: computed(() => pageWindow(page.value)),
        startItem: computed(() => (page.value - 1) * ITEMS_PER_PAGE + 1),
        totalItems: TOTAL_ITEMS,
        totalPages: TOTAL_PAGES,
      };
    },
    template: `
      <div class="w-full min-w-[640px]">
        <Pagination :size="args.size">
          <PaginationSummary>
            Showing {{ startItem }}-{{ endItem }} of {{ totalItems }} results
          </PaginationSummary>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious :is-disabled="page === 1" @click="page -= 1">
                <PaginationPreviousIcon />
                <span>Previous</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem v-for="entry of pages" :key="entry">
              <PaginationEllipsis v-if="typeof entry === 'string'" />
              <PaginationLink v-else :is-active="entry === page" @click="page = entry">
                {{ entry }}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext :is-disabled="page === totalPages" @click="page += 1">
                <span>Next</span>
                <PaginationNextIcon />
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Pagination :size="args.size">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious is-disabled>
              <PaginationPreviousIcon />
              <span>Previous</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink is-active>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext>
              <span>Next</span>
              <PaginationNextIcon />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
};
