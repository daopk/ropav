import type {TableSortDescriptor} from "./table.types";
import type {CollectionSelection} from "../../composables/use-selection-manager";
import type {Meta, StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {AvatarFallback, AvatarImage, AvatarRoot} from "../avatar";
import {Button} from "../button";
import {Chip, ChipLabel} from "../chip";
import {EmptyState} from "../empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationSummary,
} from "../pagination";

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableFooter,
  TableHeader,
  TableRow,
  TableScrollContainer,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
} from "./index";

import IconCopy from "~icons/gravity-ui/copy";
import IconEye from "~icons/gravity-ui/eye";
import IconPencil from "~icons/gravity-ui/pencil";
import IconTrashBin from "~icons/gravity-ui/trash-bin";
import IconTray from "~icons/gravity-ui/tray";

// Dot notation does not resolve in a runtime-compiled template, so each part is
// registered on its own.
const components = {
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Button,
  Chip,
  ChipLabel,
  EmptyState,
  IconCopy,
  IconEye,
  IconPencil,
  IconTrashBin,
  IconTray,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationSummary,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableFooter,
  TableHeader,
  TableRow,
  TableScrollContainer,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
};

const meta: Meta = {
  argTypes: {
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary"],
    },
  },
  component: Table,
  parameters: {
    layout: "centered",
  },
  title: "Components/Data Display/Table",
};

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Sample Data
 * -----------------------------------------------------------------------------------------------*/
interface User {
  id: number;
  image_url: string;
  name: string;
  role: string;
  status: "Active" | "Inactive" | "On Leave";
  email: string;
}

const AVATARS = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars";

const users: User[] = [
  {
    email: "kate@acme.com",
    id: 4586932,
    image_url: `${AVATARS}/red.jpg`,
    name: "Kate Moore",
    role: "Chief Executive Officer",
    status: "Active",
  },
  {
    email: "john@acme.com",
    id: 5273849,
    image_url: `${AVATARS}/green.jpg`,
    name: "John Smith",
    role: "Chief Technology Officer",
    status: "Active",
  },
  {
    email: "sara@acme.com",
    id: 7492836,
    image_url: `${AVATARS}/blue.jpg`,
    name: "Sara Johnson",
    role: "Chief Marketing Officer",
    status: "On Leave",
  },
  {
    email: "michael@acme.com",
    id: 8293746,
    image_url: `${AVATARS}/purple.jpg`,
    name: "Michael Brown",
    role: "Chief Financial Officer",
    status: "Active",
  },
  {
    email: "emily@acme.com",
    id: 1234567,
    image_url: `${AVATARS}/orange.jpg`,
    name: "Emily Davis",
    role: "Product Manager",
    status: "Inactive",
  },
  {
    email: "davis@acme.com",
    id: 9876543,
    image_url: `${AVATARS}/black.jpg`,
    name: "Davis Wilson",
    role: "Lead Designer",
    status: "Active",
  },
  {
    email: "olivia@acme.com",
    id: 3456789,
    image_url: `${AVATARS}/red.jpg`,
    name: "Olivia Martinez",
    role: "Frontend Engineer",
    status: "Active",
  },
  {
    email: "james@acme.com",
    id: 4567890,
    image_url: `${AVATARS}/green.jpg`,
    name: "James Taylor",
    role: "Backend Engineer",
    status: "Active",
  },
  {
    email: "sophia@acme.com",
    id: 5678901,
    image_url: `${AVATARS}/blue.jpg`,
    name: "Sophia Anderson",
    role: "QA Engineer",
    status: "On Leave",
  },
  {
    email: "liam@acme.com",
    id: 6789012,
    image_url: `${AVATARS}/purple.jpg`,
    name: "Liam Thomas",
    role: "DevOps Engineer",
    status: "Active",
  },
  {
    email: "ava@acme.com",
    id: 7890123,
    image_url: `${AVATARS}/orange.jpg`,
    name: "Ava Jackson",
    role: "Data Analyst",
    status: "Inactive",
  },
  {
    email: "noah@acme.com",
    id: 8901234,
    image_url: `${AVATARS}/black.jpg`,
    name: "Noah White",
    role: "Security Engineer",
    status: "Active",
  },
];

const columns = [
  {id: "name", isRowHeader: true, name: "Name"},
  {id: "role", name: "Role"},
  {id: "status", name: "Status"},
  {id: "email", name: "Email"},
];

const ROWS_PER_PAGE = 4;

/** The slice of a list a page shows, plus the numbers the footer reports. */
const usePagination = <T>(items: () => T[], rowsPerPage = ROWS_PER_PAGE) => {
  const page = shallowRef(1);
  const totalPages = computed(() => Math.ceil(items().length / rowsPerPage));

  return {
    end: computed(() => Math.min(page.value * rowsPerPage, items().length)),
    page,
    pages: computed(() => Array.from({length: totalPages.value}, (_, index) => index + 1)),
    paginatedItems: computed(() =>
      items().slice((page.value - 1) * rowsPerPage, (page.value - 1) * rowsPerPage + rowsPerPage),
    ),
    start: computed(() => (page.value - 1) * rowsPerPage + 1),
    total: computed(() => items().length),
    totalPages,
  };
};

const PAGINATION_FOOTER = `
  <TableFooter>
    <Pagination size="sm">
      <PaginationSummary>{{ start }} to {{ end }} of {{ total }} results</PaginationSummary>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious :is-disabled="page === 1" @click="page -= 1">
            <PaginationPreviousIcon />
            Prev
          </PaginationPrevious>
        </PaginationItem>
        <PaginationItem v-for="entry of pages" :key="entry">
          <PaginationLink :is-active="entry === page" @click="page = entry">
            {{ entry }}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext :is-disabled="page === totalPages" @click="page += 1">
            Next
            <PaginationNextIcon />
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </TableFooter>
`;

const STATUS_COLOR: Record<string, "success" | "danger" | "warning"> = {
  Active: "success",
  Inactive: "danger",
  "On Leave": "warning",
};

/** The shared state behind `Default` and `SecondaryVariant`: sorted, then paginated. */
const useSortedUsers = () => {
  const sortDescriptor = shallowRef<TableSortDescriptor>({column: "name", direction: "ascending"});

  const sortedUsers = computed(() => {
    const {column, direction} = sortDescriptor.value;

    return [...users].sort((a, b) => {
      const comparison = String(a[column as keyof User]).localeCompare(
        String(b[column as keyof User]),
      );

      return direction === "descending" ? -comparison : comparison;
    });
  });

  return {sortDescriptor, ...usePagination(() => sortedUsers.value)};
};

const DEFAULT_TEMPLATE = `
  <div class="w-full max-w-4xl">
    <Table :variant="variant">
      <TableScrollContainer>
        <TableContent
          v-model:selected-keys="selectedKeys"
          v-model:sort-descriptor="sortDescriptor"
          aria-label="Custom cells"
          class="min-w-[800px]"
          selection-mode="multiple"
        >
          <TableHeader>
            <TableColumn class="pe-0">
              <TableSelectionCheckbox />
            </TableColumn>
            <TableColumn
              v-for="column of sortableColumns"
              :id="column.id"
              :key="column.id"
              v-slot="{sortDirection}"
              allows-sorting
              :class="column.class"
              :is-row-header="column.isRowHeader"
            >
              <TableSortableColumnHeader :sort-direction="sortDirection">
                {{ column.name }}
              </TableSortableColumnHeader>
            </TableColumn>
            <TableColumn class="text-end">Actions</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow v-for="user of paginatedItems" :id="user.id" :key="user.id">
              <TableCell class="pe-0">
                <TableSelectionCheckbox variant="secondary" />
              </TableCell>
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">#{{ user.id }}
                  <Button is-icon-only size="sm" variant="ghost">
                    <IconCopy class="size-4 text-muted" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarImage :src="user.image_url" />
                    <AvatarFallback>{{ initials(user.name) }}</AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col">
                    <span class="text-xs">{{ user.name }}</span>
                    <span class="text-xs text-muted">{{ user.email }}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell class="min-w-52">{{ user.role }}</TableCell>
              <TableCell class="min-w-25">
                <Chip :color="statusColor[user.status]" size="sm" variant="soft">
                  <ChipLabel>{{ user.status }}</ChipLabel>
                </Chip>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button is-icon-only size="sm" variant="tertiary">
                    <IconEye class="size-4" />
                  </Button>
                  <Button is-icon-only size="sm" variant="tertiary">
                    <IconPencil class="size-4" />
                  </Button>
                  <Button is-icon-only size="sm" variant="danger-soft">
                    <IconTrashBin class="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </TableScrollContainer>
      ${PAGINATION_FOOTER}
    </Table>
  </div>
`;

const SORTABLE_COLUMNS = [
  {class: "after:hidden", id: "id", isRowHeader: true, name: "Worker ID"},
  {id: "name", name: "Member"},
  {id: "role", name: "Role"},
  {id: "status", name: "Status"},
];

const defaultSetup = (variant: "primary" | "secondary") => () => ({
  initials: (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join(""),
  selectedKeys: shallowRef<CollectionSelection>(new Set()),
  sortableColumns: SORTABLE_COLUMNS,
  statusColor: STATUS_COLOR,
  variant,
  ...useSortedUsers(),
});

/** Custom cells — avatars, chips, action buttons — over sortable columns. */
export const Default: Story = {
  args: {
    variant: "primary",
  },
  render: (args) => ({
    components,
    setup: defaultSetup((args["variant"] as "primary" | "secondary") ?? "primary"),
    template: DEFAULT_TEMPLATE,
  }),
};

/** The same content as `Default`, with the secondary styling. */
export const SecondaryVariant: Story = {
  render: () => ({
    components,
    setup: defaultSetup("secondary"),
    template: DEFAULT_TEMPLATE,
  }),
};

/**
 * Rows and cells come from a `v-for` over the caller's data — Vue's answer to React Aria's
 * dynamic collection, which needs a render function it can call while building a hidden tree.
 */
export const DynamicCollection: Story = {
  render: () => ({
    components,
    setup: () => ({columns, ...usePagination(() => users)}),
    template: `
      <div class="w-full max-w-4xl">
        <Table>
          <TableScrollContainer>
            <TableContent aria-label="Dynamic collection" class="min-w-[600px]">
              <TableHeader>
                <TableColumn
                  v-for="column of columns"
                  :id="column.id"
                  :key="column.id"
                  :is-row-header="column.isRowHeader"
                >
                  {{ column.name }}
                </TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow v-for="user of paginatedItems" :id="user.id" :key="user.id">
                  <TableCell v-for="column of columns" :key="column.id">
                    {{ user[column.id] }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
          ${PAGINATION_FOOTER}
        </Table>
      </div>
    `,
  }),
};

/**
 * The same dynamic shape with a selection column: a static checkbox cell in front of the cells
 * that come from the data.
 */
export const DynamicWithSelection: Story = {
  render: () => ({
    components,
    setup: () => ({
      columns,
      selectedKeys: shallowRef<CollectionSelection>(new Set()),
      ...usePagination(() => users),
    }),
    template: `
      <div class="w-full max-w-4xl">
        <Table>
          <TableScrollContainer>
            <TableContent
              v-model:selected-keys="selectedKeys"
              aria-label="Dynamic with selection"
              class="min-w-[650px]"
              selection-mode="multiple"
            >
              <TableHeader>
                <TableColumn>
                  <TableSelectionCheckbox />
                </TableColumn>
                <TableColumn
                  v-for="column of columns"
                  :id="column.id"
                  :key="column.id"
                  :is-row-header="column.isRowHeader"
                >
                  {{ column.name }}
                </TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow v-for="user of paginatedItems" :id="user.id" :key="user.id">
                  <TableCell>
                    <TableSelectionCheckbox variant="secondary" />
                  </TableCell>
                  <TableCell v-for="column of columns" :key="column.id">
                    {{ user[column.id] }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
          ${PAGINATION_FOOTER}
        </Table>
      </div>
    `,
  }),
};

/** Empty state through the `empty` slot of `Table.Body`. */
export const EmptyStateDemo: Story = {
  args: {
    variant: "primary",
  },
  render: (args) => ({
    components,
    setup: () => ({args, columns}),
    template: `
      <div class="w-full max-w-4xl">
        <Table class="min-h-[200px] min-w-[600px]" :variant="args.variant">
          <TableScrollContainer>
            <TableContent aria-label="Empty state" class="h-full">
              <TableHeader>
                <TableColumn
                  v-for="column of columns"
                  :id="column.id"
                  :key="column.id"
                  :is-row-header="column.isRowHeader"
                >
                  {{ column.name }}
                </TableColumn>
              </TableHeader>
              <TableBody>
                <template #empty>
                  <EmptyState
                    class="flex h-full w-full flex-col items-center justify-center gap-4 text-center"
                  >
                    <IconTray class="size-6 text-muted" />
                    <span class="text-sm text-muted">No results found</span>
                  </EmptyState>
                </template>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
        </Table>
      </div>
    `,
  }),
};
