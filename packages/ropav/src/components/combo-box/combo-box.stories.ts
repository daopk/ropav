import type {SelectedValue} from "../../composables/use-select-state";
import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";
import IconChevronsExpandVertical from "~icons/gravity-ui/chevrons-expand-vertical";

import {avatarSrc} from "../../utils/story-assets";
import {AvatarFallback, AvatarImage, AvatarRoot} from "../avatar";
import {ButtonRoot} from "../button";
import {ChipLabel, ChipRoot} from "../chip";
import {DescriptionRoot} from "../description";
import {EmptyStateRoot} from "../empty-state";
import {FieldErrorRoot} from "../field-error";
import {FormRoot} from "../form";
import {HeaderRoot} from "../header";
import {InputRoot} from "../input";
import {LabelRoot} from "../label";
import {ListBoxLoadMoreItem, ListBoxRoot} from "../list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {ListBoxSectionRoot} from "../list-box-section";
import {SeparatorRoot} from "../separator";
import {SpinnerRoot} from "../spinner";

import ComboBoxInputGroup from "./combo-box-input-group.vue";
import ComboBoxPopover from "./combo-box-popover.vue";
import ComboBoxRoot from "./combo-box-root.vue";
import ComboBoxTrigger from "./combo-box-trigger.vue";
import ComboBoxValue from "./combo-box-value.vue";

// Registered under flat names: a story template is compiled at runtime with no binding metadata, so
// a dotted tag would be looked up as a component literally named "ComboBox.Trigger".
const components = {
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Button: ButtonRoot,
  Chip: ChipRoot,
  ChipLabel,
  ComboBox: ComboBoxRoot,
  ComboBoxInputGroup,
  ComboBoxPopover,
  ComboBoxTrigger,
  ComboBoxValue,
  Description: DescriptionRoot,
  EmptyState: EmptyStateRoot,
  FieldError: FieldErrorRoot,
  Form: FormRoot,
  Header: HeaderRoot,
  IconChevronsExpandVertical,
  Input: InputRoot,
  Label: LabelRoot,
  ListBox: ListBoxRoot,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  ListBoxLoadMoreItem,
  ListBoxSection: ListBoxSectionRoot,
  Separator: SeparatorRoot,
  Spinner: SpinnerRoot,
};

const meta: StoryMeta = {
  component: ComboBoxRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Pickers/ComboBox",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The options are handed to the combo box as data as well as written as markup.
 *
 * The React build reads its collection out of a hidden render pass of its children and renders the
 * listbox from the *filtered* collection; vapor has no such pass, and the markup is what renders —
 * so the data is what a closed combo box answers from, and the matches come back through the root's
 * slot for the listbox to iterate.
 */
const ANIMALS = [
  {id: "aardvark", name: "Aardvark"},
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "kangaroo", name: "Kangaroo"},
  {id: "panda", name: "Panda"},
  {id: "snake", name: "Snake"},
];

const SHORT_ANIMALS = [
  {id: "aardvark", name: "Aardvark"},
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
];

const PET_ANIMALS = [
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "bird", name: "Bird"},
  {id: "fish", name: "Fish"},
  {id: "hamster", name: "Hamster"},
];

const ZOO_ANIMALS = [
  {id: "dog", name: "Dog"},
  {id: "cat", name: "Cat"},
  {id: "bird", name: "Bird"},
  {id: "kangaroo", name: "Kangaroo"},
  {id: "elephant", name: "Elephant"},
  {id: "tiger", name: "Tiger"},
];

const COUNTRIES = [
  {id: "usa", name: "United States", region: "North America"},
  {id: "canada", name: "Canada", region: "North America"},
  {id: "mexico", name: "Mexico", region: "North America"},
  {id: "uk", name: "United Kingdom", region: "Europe"},
  {id: "france", name: "France", region: "Europe"},
  {id: "germany", name: "Germany", region: "Europe"},
  {id: "spain", name: "Spain", region: "Europe"},
  {id: "italy", name: "Italy", region: "Europe"},
  {id: "japan", name: "Japan", region: "Asia"},
  {id: "china", name: "China", region: "Asia"},
  {id: "india", name: "India", region: "Asia"},
  {id: "south-korea", name: "South Korea", region: "Asia"},
];

const REGIONS = ["North America", "Europe", "Asia"];

const USERS = [
  {
    avatarUrl: avatarSrc("blue"),
    email: "bob@ropav.com",
    fallback: "B",
    id: "1",
    name: "Bob",
  },
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
  {
    avatarUrl: avatarSrc("red"),
    email: "john@ropav.com",
    fallback: "J",
    id: "4",
    name: "John",
  },
  {
    avatarUrl: avatarSrc("orange"),
    email: "jane@ropav.com",
    fallback: "J",
    id: "5",
    name: "Jane",
  },
];

const byName = (item: {name: string}) => item.name;

/** The field every story writes: a label above, and the input with the chevron beside it. */
const fieldTemplate = (label: string, placeholder = "Search animals...") => `
  <Label>${label}</Label>
  <ComboBoxInputGroup>
    <Input placeholder="${placeholder}" />
    <ComboBoxTrigger />
  </ComboBoxInputGroup>
`;

/** The options, rendered from whatever the filter narrowed to. */
const optionsTemplate = `
  <ListBoxItem v-for="item in matches" :id="item.id" :key="item.id" :text-value="item.name">
    {{ item.name }}
    <ListBoxItemIndicator />
  </ListBoxItem>
`;

const popoverTemplate = `
  <ComboBoxPopover>
    <ListBox>
      ${optionsTemplate}
    </ListBox>
  </ComboBoxPopover>
`;

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Favorite Animal")}
        ${popoverTemplate}
      </ComboBox>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    setup: () => ({byName, pair: SHORT_ANIMALS.slice(0, 2), short: SHORT_ANIMALS}),
    template: `
      <div class="w-[400px] space-y-4">
        <ComboBox
          v-slot="{items: matches}"
          full-width
          :item-text-value="byName"
          :items="short"
        >
          ${fieldTemplate("Favorite Animal")}
          ${popoverTemplate}
        </ComboBox>
        <ComboBox
          v-slot="{items: matches}"
          full-width
          is-required
          :item-text-value="byName"
          :items="pair"
        >
          ${fieldTemplate("Favorite Animal")}
          ${popoverTemplate}
          <FieldError />
        </ComboBox>
      </div>
    `,
  }),
};

export const DefaultValue: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        default-value="cat"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Favorite Animal")}
        ${popoverTemplate}
      </ComboBox>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Favorite Animal")}
        ${popoverTemplate}
        <Description>Search and select your favorite animal</Description>
      </ComboBox>
    `,
  }),
};

export const WithSections: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: COUNTRIES, regions: REGIONS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Country", "Search countries...")}
        <ComboBoxPopover>
          <ListBox>
            <template
              v-for="(region, index) in regions.filter((name) =>
                matches.some((item) => item.region === name),
              )"
              :key="region"
            >
              <Separator v-if="index > 0" />
              <ListBoxSection>
                <Header>{{ region }}</Header>
                <ListBoxItem
                  v-for="item in matches.filter((item) => item.region === region)"
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
        </ComboBoxPopover>
      </ComboBox>
    `,
  }),
};

export const WithDisabledOptions: Story = {
  render: () => ({
    components,
    setup: () => ({byName, disabled: ["cat", "kangaroo"], items: ZOO_ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :disabled-keys="disabled"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Animal")}
        ${popoverTemplate}
      </ComboBox>
    `,
  }),
};

export const CustomIndicator: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
      >
        <Label>Favorite Animal</Label>
        <ComboBoxInputGroup>
          <Input placeholder="Search animals..." />
          <ComboBoxTrigger>
            <IconChevronsExpandVertical class="size-3" />
          </ComboBoxTrigger>
        </ComboBoxInputGroup>
        ${popoverTemplate}
      </ComboBox>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    setup: () => ({
      byName,
      items: ANIMALS,
      onSubmit: (event: Event) => {
        event.preventDefault();
        globalThis.alert("Form submitted successfully!");
      },
    }),
    template: `
      <Form class="flex w-[256px] flex-col gap-4" @submit="onSubmit">
        <ComboBox
          v-slot="{items: matches}"
          class="w-full"
          is-required
          :item-text-value="byName"
          :items="items"
          name="animal"
        >
          ${fieldTemplate("Favorite Animal")}
          ${popoverTemplate}
          <FieldError />
        </ComboBox>
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
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :item-text-value="byName"
        :items="users"
      >
        ${fieldTemplate("User", "Search users...")}
        <ComboBoxPopover>
          <ListBox>
            <ListBoxItem
              v-for="user in matches"
              :id="user.id"
              :key="user.id"
              :text-value="user.name"
            >
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
        </ComboBoxPopover>
      </ComboBox>
    `,
  }),
};

export const Controlled: Story = {
  render: () => {
    const value = shallowRef<SelectedValue>("cat");
    const selectedName = computed(
      () => PET_ANIMALS.find((animal) => animal.id === value.value)?.name ?? "None",
    );

    return {
      components,
      setup: () => ({
        byName,
        items: PET_ANIMALS,
        onChange: (next: SelectedValue) => (value.value = next),
        selectedName,
        value,
      }),
      template: `
        <div class="space-y-2">
          <ComboBox
            v-slot="{items: matches}"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            :value="value"
            @change="onChange"
          >
            ${fieldTemplate("Animal (controlled)")}
            ${popoverTemplate}
          </ComboBox>
          <p class="text-sm text-muted">Selected: {{ selectedName }}</p>
        </div>
      `,
    };
  },
};

export const ControlledInputValue: Story = {
  render: () => {
    const inputValue = shallowRef("");

    return {
      components,
      setup: () => ({
        byName,
        inputValue,
        items: ANIMALS,
        onInputChange: (next: string) => (inputValue.value = next),
      }),
      template: `
        <div class="space-y-2">
          <ComboBox
            v-slot="{items: matches}"
            class="w-[256px]"
            :input-value="inputValue"
            :item-text-value="byName"
            :items="items"
            @input-change="onInputChange"
          >
            ${fieldTemplate("Search (controlled input)", "Type to search...")}
            ${popoverTemplate}
          </ComboBox>
          <p class="text-sm text-muted">Input value: {{ inputValue || "(empty)" }}</p>
        </div>
      `,
    };
  },
};

export const AsynchronousLoading: Story = {
  render: () => {
    const items = shallowRef<Array<{id: string; name: string}>>([]);
    const inputValue = shallowRef("");
    const isLoading = shallowRef(false);
    const nextPage = shallowRef<string | null>(null);

    let pending: AbortController | null = null;

    const load = async (search: string, cursor: string | null) => {
      pending?.abort();
      pending = new AbortController();

      const controller = pending;

      isLoading.value = true;

      try {
        const url =
          cursor?.replace(/^http:\/\//i, "https://") ??
          `https://swapi.py4e.com/api/people/?search=${encodeURIComponent(search)}`;
        const response = await fetch(url, {signal: controller.signal});
        const page = (await response.json()) as {
          next: string | null;
          results: Array<{name: string}>;
        };
        const loaded = page.results.map((result) => ({id: result.name, name: result.name}));

        items.value = cursor ? [...items.value, ...loaded] : loaded;
        nextPage.value = page.next;
      } catch {
        // An aborted request is the ordinary case here — every keystroke replaces the one before.
      } finally {
        if (pending === controller) isLoading.value = false;
      }
    };

    // The first page is fetched up front, the way `useAsyncList` does upstream: waiting for a
    // keystroke would leave the popover empty until somebody typed.
    void load("", null);

    return {
      components,
      setup: () => ({
        byName,
        inputValue,
        isLoading,
        items,
        // The caller narrows the list itself, so nothing filters it a second time over stale text.
        noFilter: null,
        onInputChange: (value: string) => {
          inputValue.value = value;
          nextPage.value = null;
          void load(value, null);
        },
        onLoadMore: () => {
          if (nextPage.value) void load(inputValue.value, nextPage.value);
        },
      }),
      template: `
        <ComboBox
          v-slot="{items: matches}"
          allows-empty-collection
          class="w-[256px]"
          :default-filter="noFilter"
          :input-value="inputValue"
          :item-text-value="byName"
          :items="items"
          @input-change="onInputChange"
        >
          ${fieldTemplate("Pick a Character", "Star Wars characters...")}
          <ComboBoxPopover>
            <ListBox class="max-h-[320px] overflow-y-auto">
              <template #empty><EmptyState>No characters found</EmptyState></template>
              ${optionsTemplate}
              <ListBoxLoadMoreItem :is-loading="isLoading" @load-more="onLoadMore">
                <div class="flex items-center justify-center gap-2 py-2">
                  <Spinner size="sm" />
                  <span class="text-sm text-muted">Loading more...</span>
                </div>
              </ListBoxLoadMoreItem>
            </ListBox>
          </ComboBoxPopover>
        </ComboBox>
      `,
    };
  },
};

export const CustomFiltering: Story = {
  render: () => ({
    components,
    setup: () => ({
      byName,
      // Matches anywhere in the name, without a collator — the same rule the React story writes.
      filter: (text: string, inputValue: string) =>
        !inputValue || text.toLowerCase().includes(inputValue.toLowerCase()),
      items: PET_ANIMALS,
    }),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :default-filter="filter"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Animal (custom filter)")}
        ${popoverTemplate}
      </ComboBox>
    `,
  }),
};

export const AllowsCustomValue: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        allows-custom-value
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Favorite Animal", "Search or type an animal...")}
        ${popoverTemplate}
        <Description>You can type any animal name, even if it's not in the list</Description>
      </ComboBox>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        default-value="cat"
        is-disabled
        :item-text-value="byName"
        :items="items"
      >
        ${fieldTemplate("Favorite Animal")}
        ${popoverTemplate}
      </ComboBox>
    `,
  }),
};

export const MenuTrigger: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Focus (default)</p>
          <ComboBox
            v-slot="{items: matches}"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            menu-trigger="focus"
          >
            ${fieldTemplate("Favorite Animal")}
            ${popoverTemplate}
            <Description>Popover opens when the input is focused</Description>
          </ComboBox>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Input</p>
          <ComboBox
            v-slot="{items: matches}"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            menu-trigger="input"
          >
            ${fieldTemplate("Favorite Animal")}
            ${popoverTemplate}
            <Description>Popover opens when the user edits the input text</Description>
          </ComboBox>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Manual</p>
          <ComboBox
            v-slot="{items: matches}"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            menu-trigger="manual"
          >
            ${fieldTemplate("Favorite Animal")}
            ${popoverTemplate}
            <Description>
              Popover only opens when the trigger button is pressed or arrow keys are used
            </Description>
          </ComboBox>
        </div>
      </div>
    `,
  }),
};

export const MultipleSelection: Story = {
  render: () => ({
    components,
    setup: () => ({byName, items: ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :item-text-value="byName"
        :items="items"
        selection-mode="multiple"
      >
        ${fieldTemplate("Favorite Animals")}
        <ComboBoxValue placeholder="No animals selected" />
        <ComboBoxPopover>
          <ListBox selection-mode="multiple">
            ${optionsTemplate}
          </ListBox>
        </ComboBoxPopover>
      </ComboBox>
    `,
  }),
};

export const MultipleSelectionControlled: Story = {
  render: () => {
    const value = shallowRef<SelectedValue>(["cat", "dog"]);
    const summary = computed(() => {
      const keys = Array.isArray(value.value) ? value.value : [];

      return keys.length > 0 ? keys.join(", ") : "None";
    });

    return {
      components,
      setup: () => ({
        byName,
        items: PET_ANIMALS,
        onChange: (next: SelectedValue) => (value.value = next),
        summary,
        value,
      }),
      template: `
        <div class="space-y-2">
          <ComboBox
            v-slot="{items: matches}"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            selection-mode="multiple"
            :value="value"
            @change="onChange"
          >
            ${fieldTemplate("Animals (controlled)")}
            <ComboBoxValue placeholder="No animals selected" />
            <ComboBoxPopover>
              <ListBox selection-mode="multiple">
                ${optionsTemplate}
              </ListBox>
            </ComboBoxPopover>
          </ComboBox>
          <p class="text-sm text-muted">Selected: {{ summary }}</p>
        </div>
      `,
    };
  },
};

export const MultipleSelectionWithTags: Story = {
  render: () => ({
    components,
    setup: () => ({byName, initial: ["cat", "dog"], items: PET_ANIMALS}),
    template: `
      <ComboBox
        v-slot="{items: matches}"
        class="w-[256px]"
        :default-value="initial"
        :item-text-value="byName"
        :items="items"
        selection-mode="multiple"
      >
        ${fieldTemplate("Favorite Animals")}
        <ComboBoxValue class="flex flex-wrap gap-2">
          <template #default="{isPlaceholder, selectedItems}">
            <span v-if="isPlaceholder" class="text-sm text-muted">No animals selected</span>
            <Chip v-for="item in selectedItems" :key="item.key" variant="soft">
              <ChipLabel>{{ item.textValue }}</ChipLabel>
            </Chip>
          </template>
        </ComboBoxValue>
        <ComboBoxPopover>
          <ListBox selection-mode="multiple">
            ${optionsTemplate}
          </ListBox>
        </ComboBoxPopover>
      </ComboBox>
    `,
  }),
};
