import type {CollectionKey} from "../../composables/use-collection";
import type {SelectedValue} from "../../composables/use-select-state";
import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {avatarSrc} from "../../utils/story-assets";
import {AvatarFallback, AvatarImage, AvatarRoot} from "../avatar";
import {ButtonRoot} from "../button";
import {ChipLabel, ChipRoot} from "../chip";
import {DescriptionRoot} from "../description";
import {FieldErrorRoot} from "../field-error";
import {FormRoot} from "../form";
import {HeaderRoot} from "../header";
import {LabelRoot} from "../label";
import {ListBoxLoadMoreItem, ListBoxRoot} from "../list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {ListBoxSectionRoot} from "../list-box-section";
import {SeparatorRoot} from "../separator";
import {SpinnerRoot} from "../spinner";

import SelectIndicator from "./select-indicator.vue";
import SelectPopover from "./select-popover.vue";
import SelectRoot from "./select-root.vue";
import SelectTrigger from "./select-trigger.vue";
import SelectValue from "./select-value.vue";

import IconChevronsExpandVertical from "~icons/gravity-ui/chevrons-expand-vertical";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "Select.Trigger".
const components = {
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Button: ButtonRoot,
  Chip: ChipRoot,
  ChipLabel,
  Description: DescriptionRoot,
  FieldError: FieldErrorRoot,
  Form: FormRoot,
  Header: HeaderRoot,
  IconChevronsExpandVertical,
  Label: LabelRoot,
  ListBox: ListBoxRoot,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  ListBoxLoadMoreItem,
  ListBoxSection: ListBoxSectionRoot,
  Select: SelectRoot,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Separator: SeparatorRoot,
  Spinner: SpinnerRoot,
};

const meta: StoryMeta = {
  component: SelectRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Pickers/Select",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The options are handed to the select as data as well as written as markup.
 *
 * The React build reads its collection out of a hidden render pass of its children; vapor has no
 * such pass, and the options only exist in the DOM while the popover is open — so the data is what
 * a closed select answers from.
 */
const STATES = [
  {id: "florida", name: "Florida"},
  {id: "delaware", name: "Delaware"},
  {id: "california", name: "California"},
  {id: "texas", name: "Texas"},
  {id: "new-york", name: "New York"},
  {id: "washington", name: "Washington"},
];

const SHORT_STATES = STATES.slice(0, 3);

const VISIT_COUNTRIES = [
  {id: "argentina", name: "Argentina"},
  {id: "venezuela", name: "Venezuela"},
  {id: "japan", name: "Japan"},
  {id: "france", name: "France"},
  {id: "italy", name: "Italy"},
  {id: "spain", name: "Spain"},
  {id: "thailand", name: "Thailand"},
  {id: "new-zealand", name: "New Zealand"},
  {id: "iceland", name: "Iceland"},
];

const COUNTRY_SECTIONS = [
  {
    id: "north-america",
    items: [
      {id: "usa", name: "United States"},
      {id: "canada", name: "Canada"},
      {id: "mexico", name: "Mexico"},
    ],
    title: "North America",
  },
  {
    id: "europe",
    items: [
      {id: "uk", name: "United Kingdom"},
      {id: "france", name: "France"},
      {id: "germany", name: "Germany"},
      {id: "spain", name: "Spain"},
      {id: "italy", name: "Italy"},
    ],
    title: "Europe",
  },
  {
    id: "asia",
    items: [
      {id: "japan", name: "Japan"},
      {id: "china", name: "China"},
      {id: "india", name: "India"},
      {id: "south-korea", name: "South Korea"},
    ],
    title: "Asia",
  },
];

const SECTIONED_COUNTRIES = COUNTRY_SECTIONS.flatMap((section) => section.items);

const ANIMALS = [
  {id: "dog", name: "Dog"},
  {id: "cat", name: "Cat"},
  {id: "bird", name: "Bird"},
  {id: "kangaroo", name: "Kangaroo"},
  {id: "elephant", name: "Elephant"},
  {id: "tiger", name: "Tiger"},
];

const FORM_COUNTRIES = [
  {id: "usa", name: "United States"},
  {id: "canada", name: "Canada"},
  {id: "mexico", name: "Mexico"},
  {id: "uk", name: "United Kingdom"},
  {id: "france", name: "France"},
  {id: "germany", name: "Germany"},
];

const USERS = [
  {avatarUrl: avatarSrc("blue"), email: "bob@ropav.com", fallback: "B", id: "1", name: "Bob"},
  {
    avatarUrl: avatarSrc("green"),
    email: "fred@ropav.com",
    fallback: "F",
    id: "2",
    name: "Fred",
  },
  {
    avatarUrl: avatarSrc("purple"),
    email: "martha@ropav.com",
    fallback: "M",
    id: "3",
    name: "Martha",
  },
  {avatarUrl: avatarSrc("red"), email: "john@ropav.com", fallback: "J", id: "4", name: "John"},
  {
    avatarUrl: avatarSrc("orange"),
    email: "jane@ropav.com",
    fallback: "J",
    id: "5",
    name: "Jane",
  },
];

const CONTROLLED_STATES = [
  {id: "california", name: "California"},
  {id: "texas", name: "Texas"},
  {id: "florida", name: "Florida"},
  {id: "new-york", name: "New York"},
  {id: "illinois", name: "Illinois"},
  {id: "pennsylvania", name: "Pennsylvania"},
];

/** The one shape every plain story renders, so the markup is written once. */
const optionsTemplate = `
  <ListBoxItem v-for="item in items" :id="item.id" :key="item.id" :text-value="item.name">
    {{ item.name }}
    <ListBoxItemIndicator />
  </ListBoxItem>
`;

const byName = (item: {name: string}) => item.name;

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: STATES}),
    template: `
      <Select
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
        placeholder="Select one"
      >
        <Label>State</Label>
        <SelectTrigger>
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>${optionsTemplate}</ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: STATES}),
    template: `
      <div class="flex flex-col gap-4">
        <Select
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select one"
          variant="primary"
        >
          <Label>Primary variant</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>${optionsTemplate}</ListBox>
          </SelectPopover>
        </Select>
        <Select
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select one"
          variant="secondary"
        >
          <Label>Secondary variant</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>${optionsTemplate}</ListBox>
          </SelectPopover>
        </Select>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: SHORT_STATES}),
    template: `
      <div class="w-[400px] space-y-4">
        <Select
          full-width
          :item-text-value="byName"
          :items="items"
          placeholder="Select one"
        >
          <Label>State</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>${optionsTemplate}</ListBox>
          </SelectPopover>
        </Select>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: STATES}),
    template: `
      <Select
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
        placeholder="Select one"
      >
        <Label>State</Label>
        <SelectTrigger>
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>${optionsTemplate}</ListBox>
        </SelectPopover>
        <Description>Select your state of residence</Description>
      </Select>
    `,
  }),
};

export const MultipleSelect: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: VISIT_COUNTRIES}),
    template: `
      <Select
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
        placeholder="Select countries"
        selection-mode="multiple"
      >
        <Label>Countries to Visit</Label>
        <SelectTrigger>
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox selection-mode="multiple">${optionsTemplate}</ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const WithSections: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: SECTIONED_COUNTRIES, sections: COUNTRY_SECTIONS}),
    template: `
      <Select
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
        placeholder="Select a country"
      >
        <Label>Country</Label>
        <SelectTrigger>
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>
            <template v-for="(section, index) in sections" :key="section.id">
              <Separator v-if="index > 0" />
              <ListBoxSection>
                <Header>{{ section.title }}</Header>
                <ListBoxItem
                  v-for="item in section.items"
                  :id="item.id"
                  :key="item.id"
                  :text-value="item.name"
                >
                  {{ item.name }}
                  <ListBoxItemIndicator />
                </ListBoxItem>
              </ListBoxSection>
            </template>
          </ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const WithDisabledOptions: Story = {
  render: () => ({
    components,
    setup: () => ({byName, disabledKeys: ["cat", "kangaroo"], items: ANIMALS}),
    template: `
      <Select
        class="w-[256px]"
        :disabled-keys="disabledKeys"
        :item-text-value="byName"
        :items="items"
        placeholder="Select an animal"
      >
        <Label>Animal</Label>
        <SelectTrigger>
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>${optionsTemplate}</ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const CustomIndicator: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: STATES}),
    template: `
      <Select
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
        placeholder="Select one"
      >
        <Label>State</Label>
        <SelectTrigger>
          <SelectValue />
          <SelectIndicator class="size-3">
            <IconChevronsExpandVertical class="size-3" />
          </SelectIndicator>
        </SelectTrigger>
        <SelectPopover>
          <ListBox>${optionsTemplate}</ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    setup: () => {
      const onSubmit = (event: Event) => {
        event.preventDefault();

        alert("Form submitted successfully!");
      };

      return {byName, countries: FORM_COUNTRIES, onSubmit, states: STATES};
    },
    template: `
      <Form class="flex w-[256px] flex-col gap-4" @submit="onSubmit">
        <Select
          is-required
          class="w-full"
          :item-text-value="byName"
          :items="states"
          name="state"
          placeholder="Select one"
        >
          <Label>State</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem
                v-for="item in states"
                :id="item.id"
                :key="item.id"
                :text-value="item.name"
              >
                {{ item.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
          <FieldError />
        </Select>
        <Select
          is-required
          class="w-full"
          :item-text-value="byName"
          :items="countries"
          name="country"
          placeholder="Select a country"
        >
          <Label>Country</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem
                v-for="item in countries"
                :id="item.id"
                :key="item.id"
                :text-value="item.name"
              >
                {{ item.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
          <FieldError />
        </Select>
        <Button type="submit">Submit</Button>
      </Form>
    `,
  }),
};

export const CustomValue: Story = {
  render: () => ({
    components,
    setup: () => ({byName, users: USERS}),
    template: `
      <Select
        class="w-[256px]"
        :item-text-value="byName"
        :items="users"
        placeholder="Select a user"
      >
        <Label>User</Label>
        <SelectTrigger>
          <SelectValue>
            <template #default="{isPlaceholder, placeholder, selectedItems}">
              <span v-if="isPlaceholder">{{ placeholder }}</span>
              <span v-else-if="selectedItems.length > 1">
                {{ selectedItems.length }} users selected
              </span>
              <div v-else class="flex items-center gap-2">
                <Avatar class="size-4" size="sm">
                  <AvatarImage :src="selectedItems[0].value.avatarUrl" />
                  <AvatarFallback>{{ selectedItems[0].value.fallback }}</AvatarFallback>
                </Avatar>
                <span>{{ selectedItems[0].value.name }}</span>
              </div>
            </template>
          </SelectValue>
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>
            <ListBoxItem v-for="user in users" :id="user.id" :key="user.id" :text-value="user.name">
              <Avatar size="sm">
                <AvatarImage :src="user.avatarUrl" />
                <AvatarFallback>{{ user.fallback }}</AvatarFallback>
              </Avatar>
              <div class="flex flex-col">
                <Label>{{ user.name }}</Label>
                <Description>{{ user.email }}</Description>
              </div>
              <ListBoxItemIndicator />
            </ListBoxItem>
          </ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const CustomValueMultiple: Story = {
  render: () => ({
    components,
    setup: () => ({byName, defaultValue: ["1", "2"], users: USERS}),
    template: `
      <Select
        class="w-[256px]"
        :default-value="defaultValue"
        :item-text-value="byName"
        :items="users"
        placeholder="Select your teammates"
        selection-mode="multiple"
      >
        <Label>Users</Label>
        <SelectTrigger>
          <SelectValue class="no-truncate flex flex-wrap gap-2">
            <template #default="{isPlaceholder, placeholder, selectedItems}">
              <span v-if="isPlaceholder">{{ placeholder }}</span>
              <Chip v-for="item in selectedItems" :key="item.key" variant="soft">
                <Avatar class="size-4" size="sm">
                  <AvatarImage :src="item.value.avatarUrl" />
                  <AvatarFallback>{{ item.value.fallback }}</AvatarFallback>
                </Avatar>
                <ChipLabel>{{ item.value.name }}</ChipLabel>
              </Chip>
            </template>
          </SelectValue>
          <SelectIndicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox selection-mode="multiple">
            <ListBoxItem v-for="user in users" :id="user.id" :key="user.id" :text-value="user.name">
              <Avatar size="sm">
                <AvatarImage :src="user.avatarUrl" />
                <AvatarFallback>{{ user.fallback }}</AvatarFallback>
              </Avatar>
              <div class="flex flex-col">
                <Label>{{ user.name }}</Label>
                <Description>{{ user.email }}</Description>
              </div>
              <ListBoxItemIndicator />
            </ListBoxItem>
          </ListBox>
        </SelectPopover>
      </Select>
    `,
  }),
};

export const Controlled: Story = {
  render: () => {
    const value = shallowRef<SelectedValue>("california");

    return {
      components,
      setup: () => ({
        byName,
        items: CONTROLLED_STATES,
        selectedName: computed(
          () => CONTROLLED_STATES.find((state) => state.id === value.value)?.name ?? "None",
        ),
        value,
      }),
      template: `
        <div class="space-y-2">
          <Select
            v-model:value="value"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            placeholder="Select a state"
          >
            <Label>State (controlled)</Label>
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectPopover>
              <ListBox>${optionsTemplate}</ListBox>
            </SelectPopover>
          </Select>
          <p class="text-sm text-muted">Selected: {{ selectedName }}</p>
        </div>
      `,
    };
  },
};

export const ControlledMultiple: Story = {
  render: () => {
    const value = shallowRef<SelectedValue>(["california", "texas"]);

    return {
      components,
      setup: () => ({
        byName,
        items: CONTROLLED_STATES,
        summary: computed(() => {
          const keys = (value.value ?? []) as CollectionKey[];

          return keys.length > 0 ? keys.join(", ") : "None";
        }),
        value,
      }),
      template: `
        <div class="space-y-4">
          <Select
            v-model:value="value"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            placeholder="Select states"
            selection-mode="multiple"
          >
            <Label>States (controlled)</Label>
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectPopover>
              <ListBox selection-mode="multiple">${optionsTemplate}</ListBox>
            </SelectPopover>
          </Select>
          <p class="text-sm text-muted">Selected: {{ summary }}</p>
        </div>
      `,
    };
  },
};

export const ControlledOpenState: Story = {
  render: () => {
    const isOpen = shallowRef(false);

    return {
      components,
      setup: () => ({
        byName,
        isOpen,
        items: STATES,
        toggle: () => {
          isOpen.value = !isOpen.value;
        },
      }),
      template: `
        <div class="space-y-4">
          <Select
            v-model:is-open="isOpen"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            placeholder="Select one"
          >
            <Label>State</Label>
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectPopover>
              <ListBox>${optionsTemplate}</ListBox>
            </SelectPopover>
          </Select>
          <Button @click="toggle">{{ isOpen ? "Close" : "Open" }} Select</Button>
          <p class="text-sm text-muted">Select is {{ isOpen ? "open" : "closed" }}</p>
        </div>
      `,
    };
  },
};

export const AsynchronousLoading: Story = {
  render: () => {
    const items = shallowRef<Array<{id: string; name: string}>>([]);
    const isLoading = shallowRef(false);
    let cursor: string | null = "https://pokeapi.co/api/v2/pokemon";

    const loadMore = async () => {
      if (isLoading.value || cursor == null) return;

      isLoading.value = true;

      try {
        const response = await fetch(cursor);
        const page = (await response.json()) as {
          next: string | null;
          results: Array<{name: string}>;
        };

        items.value = [
          ...items.value,
          ...page.results.map((result) => ({id: result.name, name: result.name})),
        ];
        cursor = page.next;
      } finally {
        isLoading.value = false;
      }
    };

    // The first page is fetched on mount, the way `useAsyncList` does it upstream: waiting for the
    // sentinel would leave the popover empty until something scrolled it into view.
    void loadMore();

    return {
      components,
      setup: () => ({byName, isLoading, items, loadMore}),
      template: `
        <Select
          allows-empty-collection
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select a Pokemon"
        >
          <Label>Pick a Pokemon</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              ${optionsTemplate}
              <ListBoxLoadMoreItem :is-loading="isLoading" @load-more="loadMore">
                <div class="flex items-center justify-center gap-2 py-2">
                  <Spinner size="sm" />
                  <span class="text-sm text-muted">Loading more...</span>
                </div>
              </ListBoxLoadMoreItem>
            </ListBox>
          </SelectPopover>
        </Select>
      `,
    };
  },
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({
      byName,
      countries: VISIT_COUNTRIES,
      countryValue: ["argentina", "japan", "france"],
      states: STATES,
    }),
    template: `
      <div class="flex flex-col gap-4">
        <Select
          is-disabled
          class="w-[256px]"
          default-value="california"
          :item-text-value="byName"
          :items="states"
          placeholder="Select one"
        >
          <Label>State</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem
                v-for="item in states"
                :id="item.id"
                :key="item.id"
                :text-value="item.name"
              >
                {{ item.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
        <Select
          is-disabled
          class="w-[256px]"
          :default-value="countryValue"
          :item-text-value="byName"
          :items="countries"
          placeholder="Select countries"
          selection-mode="multiple"
        >
          <Label>Countries to Visit</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox selection-mode="multiple">
              <ListBoxItem
                v-for="item in countries"
                :id="item.id"
                :key="item.id"
                :text-value="item.name"
              >
                {{ item.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
      </div>
    `,
  }),
};
