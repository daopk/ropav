import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { StoryMeta } from "../../utils/story-meta";
import type { TableRootProps, TableSortDescriptor } from "./table.types";
import type { StoryObj } from "@storybook/vue3";
import type { SortingState, Updater } from "@tanstack/vue-table";

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { computed, shallowRef } from "vue";
import IconChevronRight from "~icons/gravity-ui/chevron-right";
import IconCopy from "~icons/gravity-ui/copy";
import IconEye from "~icons/gravity-ui/eye";
import IconGrip from "~icons/gravity-ui/grip";
import IconPencil from "~icons/gravity-ui/pencil";
import IconTrashBin from "~icons/gravity-ui/trash-bin";
import IconTray from "~icons/gravity-ui/tray";

import { useDragAndDrop } from "../../composables/use-drag-and-drop";
import { avatarSrc } from "../../utils/story-assets";
import { TableLayout } from "../../utils/virtualizer-table-layout";
import { AvatarFallback, AvatarImage, AvatarRoot } from "../avatar";
import { Button } from "../button";
import { Chip, ChipLabel } from "../chip";
import { EmptyState } from "../empty-state";
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
import { Spinner } from "../spinner";
import { VirtualizerRoot } from "../virtualizer";

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableColumnResizer,
  TableContent,
  TableDragHandle,
  TableDropIndicator,
  TableExpandTrigger,
  TableFooter,
  TableHeader,
  TableLoadMore,
  TableLoadMoreContent,
  TableResizableContainer,
  TableRow,
  TableScrollContainer,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
} from "./index";

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
  IconChevronRight,
  IconCopy,
  IconEye,
  IconGrip,
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
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableColumnResizer,
  TableContent,
  TableDragHandle,
  TableDropIndicator,
  TableExpandTrigger,
  TableFooter,
  TableHeader,
  TableLoadMore,
  TableLoadMoreContent,
  TableResizableContainer,
  TableRow,
  TableScrollContainer,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
  Virtualizer: VirtualizerRoot,
};

const meta: StoryMeta = {
  argTypes: {
    variant: {
      control: { type: "select" },
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

// Args are spelled out rather than inferred: `StoryMeta` hides `component`, which is
// where `StoryObj` would otherwise read them from.
type Story = StoryObj<{ variant: TableRootProps["variant"] }>;

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

const users: User[] = [
  {
    email: "kate@acme.com",
    id: 4586932,
    image_url: avatarSrc("red"),
    name: "Kate Moore",
    role: "Chief Executive Officer",
    status: "Active",
  },
  {
    email: "john@acme.com",
    id: 5273849,
    image_url: avatarSrc("green"),
    name: "John Smith",
    role: "Chief Technology Officer",
    status: "Active",
  },
  {
    email: "sara@acme.com",
    id: 7492836,
    image_url: avatarSrc("blue"),
    name: "Sara Johnson",
    role: "Chief Marketing Officer",
    status: "On Leave",
  },
  {
    email: "michael@acme.com",
    id: 8293746,
    image_url: avatarSrc("purple"),
    name: "Michael Brown",
    role: "Chief Financial Officer",
    status: "Active",
  },
  {
    email: "emily@acme.com",
    id: 1234567,
    image_url: avatarSrc("orange"),
    name: "Emily Davis",
    role: "Product Manager",
    status: "Inactive",
  },
  {
    email: "davis@acme.com",
    id: 9876543,
    image_url: avatarSrc("black"),
    name: "Davis Wilson",
    role: "Lead Designer",
    status: "Active",
  },
  {
    email: "olivia@acme.com",
    id: 3456789,
    image_url: avatarSrc("red"),
    name: "Olivia Martinez",
    role: "Frontend Engineer",
    status: "Active",
  },
  {
    email: "james@acme.com",
    id: 4567890,
    image_url: avatarSrc("green"),
    name: "James Taylor",
    role: "Backend Engineer",
    status: "Active",
  },
  {
    email: "sophia@acme.com",
    id: 5678901,
    image_url: avatarSrc("blue"),
    name: "Sophia Anderson",
    role: "QA Engineer",
    status: "On Leave",
  },
  {
    email: "liam@acme.com",
    id: 6789012,
    image_url: avatarSrc("purple"),
    name: "Liam Thomas",
    role: "DevOps Engineer",
    status: "Active",
  },
  {
    email: "ava@acme.com",
    id: 7890123,
    image_url: avatarSrc("orange"),
    name: "Ava Jackson",
    role: "Data Analyst",
    status: "Inactive",
  },
  {
    email: "noah@acme.com",
    id: 8901234,
    image_url: avatarSrc("black"),
    name: "Noah White",
    role: "Security Engineer",
    status: "Active",
  },
];

const columns = [
  { id: "name", isRowHeader: true, name: "Name" },
  { id: "role", name: "Role" },
  { id: "status", name: "Status" },
  { id: "email", name: "Email" },
];

const ROWS_PER_PAGE = 4;

/** The slice of a list a page shows, plus the numbers the footer reports. */
const usePagination = <T>(items: () => T[], rowsPerPage = ROWS_PER_PAGE) => {
  const page = shallowRef(1);
  const totalPages = computed(() => Math.ceil(items().length / rowsPerPage));

  return {
    end: computed(() => Math.min(page.value * rowsPerPage, items().length)),
    page,
    pages: computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1)),
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
  const sortDescriptor = shallowRef<TableSortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const sortedUsers = computed(() => {
    const { column, direction } = sortDescriptor.value;

    return [...users].sort((a, b) => {
      const comparison = String(a[column as keyof User]).localeCompare(
        String(b[column as keyof User]),
      );

      return direction === "descending" ? -comparison : comparison;
    });
  });

  return { sortDescriptor, ...usePagination(() => sortedUsers.value) };
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
  { class: "after:hidden", id: "id", isRowHeader: true, name: "Worker ID" },
  { id: "name", name: "Member" },
  { id: "role", name: "Role" },
  { id: "status", name: "Status" },
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
    setup: defaultSetup(args.variant ?? "primary"),
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
    setup: () => ({ columns, ...usePagination(() => users) }),
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

/** Drag the handle between two column headers, or press Enter on it and use the arrow keys. */
export const ColumnResizing: Story = {
  render: () => ({
    components,
    setup: () => ({ statusColor: STATUS_COLOR, users }),
    template: `
      <div class="w-full max-w-4xl">
        <Table>
          <TableResizableContainer>
            <TableContent aria-label="Column resizing" class="min-w-[700px]">
              <TableHeader>
                <TableColumn id="name" is-row-header default-width="1fr" :min-width="160">
                  Name
                  <TableColumnResizer />
                </TableColumn>
                <TableColumn id="role" default-width="1fr" :min-width="220">
                  Role
                  <TableColumnResizer />
                </TableColumn>
                <TableColumn id="status" default-width="1fr" :min-width="100">
                  Status
                  <TableColumnResizer />
                </TableColumn>
                <TableColumn id="email" default-width="1fr" :min-width="200">Email</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow v-for="user of users" :id="user.id" :key="user.id">
                  <TableCell>{{ user.name }}</TableCell>
                  <TableCell>{{ user.role }}</TableCell>
                  <TableCell>
                    <Chip :color="statusColor[user.status]" size="sm" variant="soft">
                      <ChipLabel>{{ user.status }}</ChipLabel>
                    </Chip>
                  </TableCell>
                  <TableCell>{{ user.email }}</TableCell>
                </TableRow>
              </TableBody>
            </TableContent>
          </TableResizableContainer>
        </Table>
      </div>
    `,
  }),
};

const ITEMS_PER_PAGE = 6;

/** Rows arriving a page at a time, with the next page fetched as the end comes into view. */
const useAsyncUsers = () => {
  const items = shallowRef(users.slice(0, ITEMS_PER_PAGE));
  const isLoading = shallowRef(false);

  return {
    hasMore: computed(() => items.value.length < users.length),
    isLoading,
    items,
    loadMore: () => {
      if (isLoading.value || items.value.length >= users.length) return;

      isLoading.value = true;
      // Stands in for a request, so the indicator row is on screen long enough to see.
      setTimeout(() => {
        items.value = users.slice(0, items.value.length + ITEMS_PER_PAGE);
        isLoading.value = false;
      }, 1500);
    },
  };
};

export const AsyncLoading: Story = {
  args: {
    variant: "primary",
  },
  render: (args) => ({
    components,
    setup: () => ({
      columns,
      statusColor: STATUS_COLOR,
      variant: args.variant ?? "primary",
      ...useAsyncUsers(),
    }),
    template: `
      <div class="w-full max-w-4xl">
        <Table :variant="variant">
          <TableScrollContainer class="h-[280px] overflow-y-auto">
            <TableContent aria-label="Async loading" class="min-w-[600px]">
              <TableHeader class="sticky top-0 z-10 bg-surface-secondary">
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
                <TableRow v-for="user of items" :id="user.id" :key="user.id">
                  <TableCell>{{ user.name }}</TableCell>
                  <TableCell>{{ user.role }}</TableCell>
                  <TableCell>
                    <Chip :color="statusColor[user.status]" size="sm" variant="soft">
                      <ChipLabel>{{ user.status }}</ChipLabel>
                    </Chip>
                  </TableCell>
                  <TableCell>{{ user.email }}</TableCell>
                </TableRow>
                <TableLoadMore
                  v-if="hasMore"
                  :is-loading="isLoading"
                  :scroll-offset="0"
                  @load-more="loadMore"
                >
                  <TableLoadMoreContent>
                    <Spinner size="md" />
                  </TableLoadMoreContent>
                </TableLoadMore>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
        </Table>
      </div>
    `,
  }),
};

interface FileNode {
  id: string;
  title: string;
  type: string;
  date: string;
  children: FileNode[];
}

const files: FileNode[] = [
  {
    children: [
      {
        children: [
          { children: [], date: "7/10/2025", id: "3", title: "Weekly Report", type: "File" },
          { children: [], date: "8/20/2025", id: "4", title: "Budget", type: "File" },
        ],
        date: "8/2/2025",
        id: "2",
        title: "Project",
        type: "Directory",
      },
    ],
    date: "10/20/2025",
    id: "1",
    title: "Documents",
    type: "Directory",
  },
  {
    children: [
      { children: [], date: "1/23/2026", id: "6", title: "Image 1", type: "File" },
      { children: [], date: "2/3/2026", id: "7", title: "Image 2", type: "File" },
    ],
    date: "2/3/2026",
    id: "5",
    title: "Photos",
    type: "Directory",
  },
];

interface FlatFileRow {
  node: FileNode;
  level: number;
  parentKey?: string;
}

/**
 * The rows a tree shows, flattened. A `<tr>` cannot nest inside another `<tr>`, so the caller says
 * how deep each row sits instead of nesting the markup — which is where React Aria's hidden
 * collection pass would have done it.
 */
const flattenFiles = (
  nodes: FileNode[],
  expanded: Set<string>,
  level = 0,
  parentKey?: string,
): FlatFileRow[] =>
  nodes.flatMap((node) => [
    { level, node, parentKey },
    ...(expanded.has(node.id) ? flattenFiles(node.children, expanded, level + 1, node.id) : []),
  ]);

/** Rows that nest, with the tree column carrying the chevron and the indentation. */
export const ExpandableRows: Story = {
  render: () => ({
    components,
    setup: () => {
      const expandedKeys = shallowRef(new Set(["1"]));

      return {
        expandedKeys,
        rows: computed(() => flattenFiles(files, expandedKeys.value)),
      };
    },
    template: `
      <div class="w-full max-w-4xl">
        <Table>
          <TableScrollContainer>
            <TableContent
              v-model:expanded-keys="expandedKeys"
              aria-label="Files"
              class="min-w-[520px]"
              tree-column="name"
            >
              <TableHeader>
                <TableColumn id="name" is-row-header>Name</TableColumn>
                <TableColumn id="type">Type</TableColumn>
                <TableColumn id="date">Date Modified</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="row of rows"
                  :id="row.node.id"
                  :key="row.node.id"
                  :has-child-rows="row.node.children.length > 0"
                  :level="row.level"
                  :parent-key="row.parentKey"
                  :text-value="row.node.title"
                >
                  <TableCell
                    v-slot="{hasChildRows, isExpanded, isTreeColumn}"
                    :text-value="row.node.title"
                  >
                    <span class="flex items-center gap-1">
                      <TableExpandTrigger v-if="hasChildRows && isTreeColumn">
                        <Button is-icon-only size="sm" variant="ghost">
                          <IconChevronRight
                            class="size-4 text-muted transition-transform duration-150"
                            :class="isExpanded ? 'rotate-90' : 'rtl:rotate-180'"
                          />
                        </Button>
                      </TableExpandTrigger>
                      <span>{{ row.node.title }}</span>
                    </span>
                  </TableCell>
                  <TableCell>{{ row.node.type }}</TableCell>
                  <TableCell>{{ row.node.date }}</TableCell>
                </TableRow>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
        </Table>
      </div>
    `,
  }),
};

/* -------------------------------------------------------------------------------------------------
 * TanStack Table
 * -----------------------------------------------------------------------------------------------*/
const TANSTACK_COLUMNS = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "email", header: "Email" },
];

/** TanStack's sorting state, as the table's own descriptor. */
const toSortDescriptor = (sorting: SortingState): TableSortDescriptor | undefined => {
  const first = sorting[0];

  if (!first) return undefined;

  return { column: first.id, direction: first.desc ? "descending" : "ascending" };
};

/** And back the other way, for what the header hands out when it is pressed. */
const toSortingState = (descriptor: TableSortDescriptor): SortingState => [
  { desc: descriptor.direction === "descending", id: String(descriptor.column) },
];

/**
 * Sorting, pagination and the row model come from `@tanstack/vue-table`; the grid semantics, the
 * keyboard and the styling come from here.
 *
 * `useVueTable` is state only — it renders nothing — so the two layers meet at data rather than at
 * markup. Cells are rendered with `v-for` rather than TanStack's `FlexRender`: that is a VDOM
 * component, and a VDOM component inside a Vapor component's slot is a live interop bug.
 */
export const TanStackTable: Story = {
  render: () => ({
    components,
    setup: () => {
      const sorting = shallowRef<SortingState>([]);

      const table = useVueTable({
        get columns() {
          return TANSTACK_COLUMNS;
        },
        get data() {
          return users;
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: ROWS_PER_PAGE } },
        onSortingChange: (updater: Updater<SortingState>) => {
          sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
        },
        state: {
          get sorting() {
            return sorting.value;
          },
        },
      });

      const pageIndex = computed(() => table.getState().pagination.pageIndex);

      return {
        end: computed(() => Math.min((pageIndex.value + 1) * ROWS_PER_PAGE, users.length)),
        headers: computed(() => table.getHeaderGroups()[0]!.headers),
        onSortChange: (descriptor: TableSortDescriptor) => {
          sorting.value = toSortingState(descriptor);
        },
        page: computed(() => pageIndex.value + 1),
        pages: computed(() =>
          Array.from({ length: table.getPageCount() }, (_, index) => index + 1),
        ),
        rows: computed(() => table.getRowModel().rows),
        sortDescriptor: computed(() => toSortDescriptor(sorting.value)),
        start: computed(() => pageIndex.value * ROWS_PER_PAGE + 1),
        statusColor: STATUS_COLOR,
        table,
        total: users.length,
      };
    },
    template: `
      <div class="w-full max-w-4xl">
        <Table>
          <TableScrollContainer>
            <TableContent
              aria-label="TanStack Table example"
              class="min-w-[600px]"
              :sort-descriptor="sortDescriptor"
              @sort-change="onSortChange"
            >
              <TableHeader>
                <TableColumn
                  v-for="header of headers"
                  :id="header.id"
                  :key="header.id"
                  v-slot="{sortDirection}"
                  :allows-sorting="header.column.getCanSort()"
                  :is-row-header="header.id === 'name'"
                >
                  <TableSortableColumnHeader :sort-direction="sortDirection">
                    {{ header.column.columnDef.header }}
                  </TableSortableColumnHeader>
                </TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row of rows" :id="row.id" :key="row.id">
                  <TableCell v-for="cell of row.getVisibleCells()" :key="cell.id">
                    <Chip
                      v-if="cell.column.id === 'status'"
                      :color="statusColor[cell.getValue()]"
                      size="sm"
                      variant="soft"
                    >
                      <ChipLabel>{{ cell.getValue() }}</ChipLabel>
                    </Chip>
                    <template v-else>{{ cell.getValue() }}</template>
                  </TableCell>
                </TableRow>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
          <TableFooter>
            <Pagination size="sm">
              <PaginationSummary>{{ start }} to {{ end }} of {{ total }} results</PaginationSummary>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    :is-disabled="!table.getCanPreviousPage()"
                    @click="table.previousPage()"
                  >
                    <PaginationPreviousIcon />
                    Prev
                  </PaginationPrevious>
                </PaginationItem>
                <PaginationItem v-for="entry of pages" :key="entry">
                  <PaginationLink
                    :is-active="entry === page"
                    @click="table.setPageIndex(entry - 1)"
                  >
                    {{ entry }}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext :is-disabled="!table.getCanNextPage()" @click="table.nextPage()">
                    Next
                    <PaginationNextIcon />
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TableFooter>
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
    setup: () => ({ args, columns }),
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

/* -------------------------------------------------------------------------------------------------
 * Virtualization
 * -----------------------------------------------------------------------------------------------*/
const ROLES = [
  "Software Engineer",
  "Senior Engineer",
  "Staff Engineer",
  "Product Manager",
  "Designer",
  "Data Analyst",
  "QA Engineer",
  "DevOps Engineer",
  "Marketing Manager",
  "Sales Representative",
];

const STATUSES: User["status"][] = ["Active", "Inactive", "On Leave"];

const FIRST_NAMES = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "James",
  "Sophia",
  "Oliver",
  "Isabella",
  "Lucas",
  "Mia",
  "Ethan",
  "Charlotte",
  "Mason",
  "Amelia",
  "Logan",
  "Harper",
  "Alexander",
  "Ella",
  "Benjamin",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
];

/** The same rows in the same order as the React story, so the two can be compared row by row. */
const generateUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;

    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
      id: index + 1,
      image_url: avatarSrc("red"),
      name: `${firstName} ${lastName}`,
      role: ROLES[index % ROLES.length]!,
      status: STATUSES[index % STATUSES.length]!,
    };
  });

/**
 * A thousand rows, of which only a screenful is ever in the DOM.
 *
 * Two things differ from the React story, both because there is no hidden render pass to read a
 * collection out of: the row carries the `id` its item is keyed by, and `itemTextValue` names a row
 * that typeahead has to reach before it has rendered.
 */
export const Virtualization: Story = {
  render: () => ({
    components,
    setup: () => ({ layout: TableLayout, users: generateUsers(1000) }),
    template: `
      <Virtualizer :layout="layout" :layout-options="{rowHeight: 42, headingHeight: 42}">
        <Table>
          <TableScrollContainer>
            <TableContent
              aria-label="Virtualized table with 1000 rows"
              class="h-[500px] min-w-[700px] scrollbar overflow-auto"
            >
              <TableHeader class="h-full w-full">
                <TableColumn id="name" is-row-header :min-width="160">Name</TableColumn>
                <TableColumn id="role" :min-width="220">Role</TableColumn>
                <TableColumn id="email" :min-width="240">Email</TableColumn>
              </TableHeader>
              <TableBody :item-text-value="(user) => user.name" :items="users">
                <template #default="{item}">
                  <TableRow :id="item.id">
                    <TableCell>{{ item.name }}</TableCell>
                    <TableCell>{{ item.role }}</TableCell>
                    <TableCell>{{ item.email }}</TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
        </Table>
      </Virtualizer>
    `,
  }),
};

/**
 * Reordering rows, by pointer and by keyboard.
 *
 * The whole configuration is `useDragAndDrop`: `getItems` says what a row *is* on the drag, and
 * `onReorder` is what makes the table droppable at all — a table with nothing to do with an
 * arriving row is not a drop target.
 *
 * Two things are the caller's here, deliberately:
 *
 * - **The drop indicator has no styling of its own.** `@ropav/styles` has no rule for one, and
 *   React Aria ships its own unstyled too, so the line is styled through the indicator's own
 *   `class` here rather than by adding a rule to the shared stylesheet. `data-drop-target` and
 *   the `table__drop-indicator` class are emitted either way, so a rule added there later would
 *   need no change to this story.
 * - **`Table.DragHandle` is not a hit target.** The row is what the browser drags; the handle
 *   exists so a keyboard or screen reader user has something to press. Tab to it and press Enter.
 */
export const DragAndDrop: Story = {
  render: () => ({
    components,
    setup: () => {
      const order = shallowRef(users.map((user) => String(user.id)));
      const byId = new Map(users.map((user) => [String(user.id), user]));

      const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys) =>
          [...keys].map((key) => ({ "text/plain": byId.get(String(key))?.name ?? "" })),
        onReorder(event) {
          const moving = [...event.keys].map(String);
          const rest = order.value.filter((key) => !moving.includes(key));
          const index = rest.indexOf(String(event.target.key));
          const at = event.target.dropPosition === "before" ? index : index + 1;

          order.value = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
        },
      });

      return {
        dragAndDropHooks,
        rows: computed(() => order.value.map((key) => byId.get(key)!)),
      };
    },
    template: `
      <div class="w-full max-w-4xl">
        <Table>
          <TableScrollContainer>
            <TableContent
              aria-label="Reorderable team"
              class="min-w-[600px]"
              :drag-and-drop-hooks="dragAndDropHooks"
              selection-mode="multiple"
            >
              <TableHeader>
                <TableColumn id="drag" :max-width="48" :min-width="48">
                  <span class="sr-only">Reorder</span>
                </TableColumn>
                <TableColumn id="name" is-row-header>Member</TableColumn>
                <TableColumn id="role">Role</TableColumn>
                <TableColumn id="status">Status</TableColumn>
              </TableHeader>
              <TableBody>
                <template v-for="user of rows" :key="user.id">
                  <TableDropIndicator
                    class="h-0.5 data-[drop-target=true]:bg-accent"
                    :target="{type: 'item', key: String(user.id), dropPosition: 'before'}"
                  />
                  <TableRow :id="String(user.id)" :text-value="user.name">
                    <TableCell>
                      <TableDragHandle>
                        <Button is-icon-only size="sm" variant="ghost">
                          <IconGrip />
                        </Button>
                      </TableDragHandle>
                    </TableCell>
                    <TableCell :text-value="user.name">{{ user.name }}</TableCell>
                    <TableCell>{{ user.role }}</TableCell>
                    <TableCell>{{ user.status }}</TableCell>
                  </TableRow>
                </template>
                <TableDropIndicator
                  class="h-0.5 data-[drop-target=true]:bg-accent"
                  :target="{type: 'item', key: rows[rows.length - 1].id + '', dropPosition: 'after'}"
                />
              </TableBody>
            </TableContent>
          </TableScrollContainer>
        </Table>
      </div>
    `,
  }),
};

/**
 * Reordering a thousand rows, of which only a screenful is ever in the DOM.
 *
 * Two things a plain table gets for free have to be arranged here:
 *
 * - **The pointer resolves against the layout, not the DOM.** The element-searching delegate
 *   would only ever find the rows that happen to be rendered; the layout knows where all thousand
 *   *would* be, so the drop target is right at any scroll position.
 * - **The indicators come from the body.** Every row is absolutely positioned, so an indicator
 *   has to be a sibling of the row wrappers to be measured from the same origin — which is a
 *   level the caller's row slot sits inside rather than beside.
 */
export const VirtualizedDragAndDrop: Story = {
  render: () => ({
    components,
    setup: () => {
      const all = generateUsers(1000);
      const order = shallowRef(all.map((user) => user.id));
      const byId = new Map(all.map((user) => [user.id, user]));

      const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys) => [...keys].map((key) => ({ "text/plain": byId.get(Number(key))!.name })),
        onReorder(event) {
          const moving = [...event.keys].map(Number);
          const rest = order.value.filter((key) => !moving.includes(key));
          const index = rest.indexOf(Number(event.target.key));
          const at = event.target.dropPosition === "before" ? index : index + 1;

          order.value = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
        },
      });

      return {
        dragAndDropHooks,
        layout: TableLayout,
        users: computed(() => order.value.map((id) => byId.get(id)!)),
      };
    },
    template: `
      <Virtualizer :layout="layout" :layout-options="{rowHeight: 42, headingHeight: 42}">
        <Table>
          <TableScrollContainer>
            <TableContent
              aria-label="Reorderable virtualized table"
              class="h-[500px] min-w-[700px] scrollbar overflow-auto"
              :drag-and-drop-hooks="dragAndDropHooks"
              selection-mode="multiple"
            >
              <TableHeader class="h-full w-full">
                <TableColumn id="drag" :max-width="48" :min-width="48">
                  <span class="sr-only">Reorder</span>
                </TableColumn>
                <TableColumn id="name" is-row-header :min-width="160">Name</TableColumn>
                <TableColumn id="role" :min-width="220">Role</TableColumn>
              </TableHeader>
              <TableBody :item-text-value="(user) => user.name" :items="users">
                <template #default="{item}">
                  <TableRow :id="item.id" :text-value="item.name">
                    <TableCell>
                      <TableDragHandle>
                        <Button is-icon-only size="sm" variant="ghost">
                          <IconGrip />
                        </Button>
                      </TableDragHandle>
                    </TableCell>
                    <TableCell :text-value="item.name">{{ item.name }}</TableCell>
                    <TableCell>{{ item.role }}</TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </TableContent>
          </TableScrollContainer>
        </Table>
      </Virtualizer>
    `,
  }),
};
