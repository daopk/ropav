import type { CollectionKey } from "../../composables/use-collection";
import type { SelectedValue } from "../../composables/use-select-state";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { computed, shallowRef } from "vue";
import IconChevronsExpandVertical from "~icons/gravity-ui/chevrons-expand-vertical";
import IconMapPin from "~icons/gravity-ui/map-pin";

import { useFilter } from "../../composables/use-filter";
import { avatarSrc } from "../../utils/story-assets";
import { ListLayout } from "../../utils/virtualizer-list-layout";
import { AvatarFallback, AvatarImage, AvatarRoot } from "../avatar";
import { ButtonRoot } from "../button";
import { DescriptionRoot } from "../description";
import { EmptyStateRoot } from "../empty-state";
import { FieldErrorRoot } from "../field-error";
import { FormRoot } from "../form";
import { HeaderRoot } from "../header";
import { LabelRoot } from "../label";
import { ListBoxRoot } from "../list-box";
import { ListBoxItemIndicator, ListBoxItemRoot } from "../list-box-item";
import { ListBoxSectionRoot } from "../list-box-section";
import {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon,
} from "../search-field";
import { SeparatorRoot } from "../separator";
import { SpinnerRoot } from "../spinner";
import { SurfaceRoot } from "../surface";
import { TagRoot } from "../tag";
import { TagGroupList, TagGroupRoot } from "../tag-group";
import { VirtualizerRoot } from "../virtualizer";

import AutocompleteClearButton from "./autocomplete-clear-button.vue";
import AutocompleteFilter from "./autocomplete-filter.vue";
import AutocompleteIndicator from "./autocomplete-indicator.vue";
import AutocompletePopover from "./autocomplete-popover.vue";
import AutocompleteRoot from "./autocomplete-root.vue";
import AutocompleteTrigger from "./autocomplete-trigger.vue";
import AutocompleteValue from "./autocomplete-value.vue";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "Autocomplete.Trigger".
const components = {
  Autocomplete: AutocompleteRoot,
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteTrigger,
  AutocompleteValue,
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Button: ButtonRoot,
  Description: DescriptionRoot,
  EmptyState: EmptyStateRoot,
  FieldError: FieldErrorRoot,
  Form: FormRoot,
  Header: HeaderRoot,
  IconChevronsExpandVertical,
  IconMapPin,
  Label: LabelRoot,
  ListBox: ListBoxRoot,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  ListBoxSection: ListBoxSectionRoot,
  SearchField: SearchFieldRoot,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
  Separator: SeparatorRoot,
  Spinner: SpinnerRoot,
  Surface: SurfaceRoot,
  Tag: TagRoot,
  TagGroup: TagGroupRoot,
  TagGroupList,
  Virtualizer: VirtualizerRoot,
};

const meta: StoryMeta = {
  component: AutocompleteRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Pickers/Autocomplete",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The options are handed to the autocomplete as data as well as written as markup.
 *
 * The React build reads its collection out of a hidden render pass of its children; vapor has no
 * such pass, and the options only exist in the DOM while the popover is open — so the data is what
 * a closed autocomplete answers from, and what the filter narrows.
 */
const ANIMALS = [
  { id: "cat", name: "Cat" },
  { id: "dog", name: "Dog" },
  { id: "elephant", name: "Elephant" },
  { id: "lion", name: "Lion" },
  { id: "tiger", name: "Tiger" },
  { id: "giraffe", name: "Giraffe" },
];

const OPTIONS = [
  { id: "option1", name: "Option 1" },
  { id: "option2", name: "Option 2" },
  { id: "option3", name: "Option 3" },
  { id: "option4", name: "Option 4" },
];

const STATES = [
  { id: "florida", name: "Florida" },
  { id: "delaware", name: "Delaware" },
  { id: "california", name: "California" },
  { id: "texas", name: "Texas" },
  { id: "new-york", name: "New York" },
  { id: "washington", name: "Washington" },
];

const CONTROLLED_STATES = [
  { id: "california", name: "California" },
  { id: "texas", name: "Texas" },
  { id: "florida", name: "Florida" },
  { id: "new-york", name: "New York" },
  { id: "illinois", name: "Illinois" },
  { id: "pennsylvania", name: "Pennsylvania" },
];

const COUNTRIES = [
  { id: "usa", name: "United States" },
  { id: "canada", name: "Canada" },
  { id: "mexico", name: "Mexico" },
  { id: "uk", name: "United Kingdom" },
  { id: "france", name: "France" },
  { id: "germany", name: "Germany" },
];

const VISIT_COUNTRIES = [
  { id: "argentina", name: "Argentina" },
  { id: "venezuela", name: "Venezuela" },
  { id: "japan", name: "Japan" },
  { id: "france", name: "France" },
  { id: "italy", name: "Italy" },
  { id: "spain", name: "Spain" },
];

const COUNTRY_SECTIONS = [
  {
    id: "north-america",
    items: [
      { id: "usa", name: "United States" },
      { id: "canada", name: "Canada" },
      { id: "mexico", name: "Mexico" },
    ],
    title: "North America",
  },
  {
    id: "europe",
    items: [
      { id: "uk", name: "United Kingdom" },
      { id: "france", name: "France" },
      { id: "germany", name: "Germany" },
      { id: "spain", name: "Spain" },
      { id: "italy", name: "Italy" },
    ],
    title: "Europe",
  },
  {
    id: "asia",
    items: [
      { id: "japan", name: "Japan" },
      { id: "china", name: "China" },
      { id: "india", name: "India" },
      { id: "south-korea", name: "South Korea" },
    ],
    title: "Asia",
  },
];

const SECTIONED_COUNTRIES = COUNTRY_SECTIONS.flatMap((section) => section.items);

const DISABLED_ANIMALS = [
  { id: "dog", name: "Dog" },
  { id: "cat", name: "Cat" },
  { id: "bird", name: "Bird" },
  { id: "kangaroo", name: "Kangaroo" },
  { id: "elephant", name: "Elephant" },
  { id: "tiger", name: "Tiger" },
];

const TAGS = [
  { id: "react", name: "React" },
  { id: "typescript", name: "TypeScript" },
  { id: "javascript", name: "JavaScript" },
  { id: "nodejs", name: "Node.js" },
  { id: "python", name: "Python" },
  { id: "vue", name: "Vue" },
  { id: "angular", name: "Angular" },
  { id: "nextjs", name: "Next.js" },
];

const EMAILS = [
  { email: "alice@example.com", id: "alice@example.com", name: "Alice Johnson" },
  { email: "bob@example.com", id: "bob@example.com", name: "Bob Smith" },
  { email: "charlie@example.com", id: "charlie@example.com", name: "Charlie Brown" },
  { email: "diana@example.com", id: "diana@example.com", name: "Diana Prince" },
  { email: "eve@example.com", id: "eve@example.com", name: "Eve Wilson" },
];

const CITIES = [
  { country: "USA", id: "New York", name: "New York" },
  { country: "USA", id: "Los Angeles", name: "Los Angeles" },
  { country: "USA", id: "Chicago", name: "Chicago" },
  { country: "UK", id: "London", name: "London" },
  { country: "France", id: "Paris", name: "Paris" },
  { country: "Japan", id: "Tokyo", name: "Tokyo" },
  { country: "Australia", id: "Sydney", name: "Sydney" },
  { country: "Canada", id: "Toronto", name: "Toronto" },
  { country: "Germany", id: "Berlin", name: "Berlin" },
  { country: "Spain", id: "Madrid", name: "Madrid" },
];

const USERS = [
  { avatarUrl: avatarSrc("blue"), email: "bob@ropav.com", fallback: "B", id: "1", name: "Bob" },
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
  { avatarUrl: avatarSrc("red"), email: "john@ropav.com", fallback: "J", id: "4", name: "John" },
  {
    avatarUrl: avatarSrc("orange"),
    email: "jane@ropav.com",
    fallback: "J",
    id: "5",
    name: "Jane",
  },
];

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

const generateUsers = (count: number) =>
  Array.from({ length: count }, (_unused, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;

    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
      id: index + 1,
      name: `${firstName} ${lastName}`,
    };
  });

const byName = (item: { name: string }) => item.name;

/** The search field every story puts above its options, so the markup is written once. */
const searchTemplate = (placeholder: string) => `
  <SearchField auto-focus aria-label="Search" name="search" variant="secondary">
    <SearchFieldGroup>
      <SearchFieldSearchIcon />
      <SearchFieldInput placeholder="${placeholder}" />
      <SearchFieldClearButton />
    </SearchFieldGroup>
  </SearchField>
`;

/** The options of a plain story, rendered from whatever the filter narrowed to. */
const optionsTemplate = `
  <ListBoxItem v-for="item in items" :id="item.id" :key="item.id" :text-value="item.name">
    {{ item.name }}
    <ListBoxItemIndicator />
  </ListBoxItem>
`;

const emptyTemplate = (message = "No results found") => `
  <template #empty><EmptyState>${message}</EmptyState></template>
`;

/**
 * The whole popover of a plain story: a search field, the narrowed options, and something to say
 * when none of them match.
 */
const popoverTemplate = (placeholder: string, empty = "No results found") => `
  <AutocompletePopover>
    <AutocompleteFilter :filter="contains">
      <template #default="{items}">
        ${searchTemplate(placeholder)}
        <ListBox>
          ${emptyTemplate(empty)}
          ${optionsTemplate}
        </ListBox>
      </template>
    </AutocompleteFilter>
  </AutocompletePopover>
`;

export const Default: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({ byName, contains: filter.value.contains, items: ANIMALS }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select an animal"
          selection-mode="single"
        >
          <Label>Favorite Animal</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          ${popoverTemplate("Search animals...")}
        </Autocomplete>
      `,
    };
  },
};

export const WithClearButton: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({ byName, contains: filter.value.contains, items: ANIMALS }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select an animal"
          selection-mode="single"
        >
          <Label>Favorite Animal</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          ${popoverTemplate("Search animals...")}
        </Autocomplete>
      `,
    };
  },
};

export const WithOnClearCallback: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const value = shallowRef<SelectedValue>(null);
    const clearCount = shallowRef(0);

    const selectedName = computed(
      () => ANIMALS.find((animal) => animal.id === value.value)?.name ?? null,
    );

    return {
      components,
      setup: () => ({
        byName,
        clearCount,
        contains: filter.value.contains,
        items: ANIMALS,
        onClear: () => {
          clearCount.value += 1;
        },
        selectedName,
        value,
      }),
      template: `
        <div class="w-full space-y-4">
          <Autocomplete
            v-model:value="value"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            placeholder="Select an animal"
            selection-mode="single"
            @clear="onClear"
          >
            <Label>Favorite Animal</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            ${popoverTemplate("Search animals...")}
          </Autocomplete>
          <div class="space-y-2 rounded-xl border border-border p-4">
            <p class="text-sm font-medium">Clear event info:</p>
            <div class="space-y-1 text-sm text-muted">
              <p>Clear button clicked: {{ clearCount }} time(s)</p>
              <p v-if="selectedName" class="text-success">
                Currently selected: <strong>{{ selectedName }}</strong>
              </p>
              <p v-else>No selection (click clear to see the event)</p>
            </div>
          </div>
        </div>
      `,
    };
  },
};

export const Variants: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const single = shallowRef<SelectedValue>(null);
    const singleSecondary = shallowRef<SelectedValue>(null);
    const multiple = shallowRef<SelectedValue>([]);
    const multipleSecondary = shallowRef<SelectedValue>([]);

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        items: OPTIONS,
        multiple,
        multipleSecondary,
        single,
        singleSecondary,
      }),
      template: `
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-4">
            <h3 class="text-lg font-semibold">Single select variants</h3>
            <Autocomplete
              v-model:value="single"
              class="w-[256px]"
              :item-text-value="byName"
              :items="items"
              placeholder="Select one"
              selection-mode="single"
              variant="primary"
            >
              <Label>Primary variant</Label>
              <AutocompleteTrigger>
                <AutocompleteValue />
                <AutocompleteClearButton />
                <AutocompleteIndicator />
              </AutocompleteTrigger>
              ${popoverTemplate("Search...")}
            </Autocomplete>
            <Autocomplete
              v-model:value="singleSecondary"
              class="w-[256px]"
              :item-text-value="byName"
              :items="items"
              placeholder="Select one"
              selection-mode="single"
              variant="secondary"
            >
              <Label>Secondary variant</Label>
              <AutocompleteTrigger>
                <AutocompleteValue />
                <AutocompleteClearButton />
                <AutocompleteIndicator />
              </AutocompleteTrigger>
              ${popoverTemplate("Search...")}
            </Autocomplete>
          </div>
          <div class="flex flex-col gap-4">
            <h3 class="text-lg font-semibold">Multiple select variants</h3>
            <Autocomplete
              v-model:value="multiple"
              class="w-[256px]"
              :item-text-value="byName"
              :items="items"
              placeholder="Select several"
              selection-mode="multiple"
              variant="primary"
            >
              <Label>Primary variant</Label>
              <AutocompleteTrigger>
                <AutocompleteValue />
                <AutocompleteClearButton />
                <AutocompleteIndicator />
              </AutocompleteTrigger>
              ${popoverTemplate("Search...")}
            </Autocomplete>
            <Autocomplete
              v-model:value="multipleSecondary"
              class="w-[256px]"
              :item-text-value="byName"
              :items="items"
              placeholder="Select several"
              selection-mode="multiple"
              variant="secondary"
            >
              <Label>Secondary variant</Label>
              <AutocompleteTrigger>
                <AutocompleteValue />
                <AutocompleteClearButton />
                <AutocompleteIndicator />
              </AutocompleteTrigger>
              ${popoverTemplate("Search...")}
            </Autocomplete>
          </div>
        </div>
      `,
    };
  },
};

/**
 * The chosen options are shown as removable tags.
 *
 * The value's slot is what rich content in the trigger goes through: vapor cannot render an
 * option's own markup a second time, so the tags are written here from the keys and data the slot
 * hands over — the same values React's render function receives.
 */
export const MultipleSelect: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const value = shallowRef<CollectionKey[]>([]);

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        items: CONTROLLED_STATES,
        onRemove: (keys: Set<CollectionKey>) => {
          value.value = value.value.filter((key) => !keys.has(key));
        },
        value,
      }),
      template: `
        <Autocomplete
          v-model:value="value"
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select states"
          selection-mode="multiple"
        >
          <Label>States</Label>
          <AutocompleteTrigger>
            <AutocompleteValue>
              <template #default="{isPlaceholder, placeholder, selectedItems}">
                <template v-if="isPlaceholder">{{ placeholder }}</template>
                <TagGroup v-else :on-remove="onRemove" size="sm">
                  <TagGroupList>
                    <Tag v-for="item in selectedItems" :id="item.key" :key="item.key">
                      {{ item.textValue }}
                    </Tag>
                  </TagGroupList>
                </TagGroup>
              </template>
            </AutocompleteValue>
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          ${popoverTemplate("Search...")}
        </Autocomplete>
      `,
    };
  },
};

export const FullWidth: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({ byName, contains: filter.value.contains, items: STATES }),
      // `full-width` is written as a bare attribute on purpose: the `:full-width="true"` form
      // stays green even when the prop is declared in a way that never casts an empty attribute.
      template: `
        <Surface class="w-[380px] space-y-4 rounded-3xl p-6">
          <Autocomplete
            full-width
            :item-text-value="byName"
            :items="items"
            placeholder="Select one"
            selection-mode="single"
            variant="secondary"
          >
            <Label>State</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            ${popoverTemplate("Search states...")}
          </Autocomplete>
        </Surface>
      `,
    };
  },
};

export const WithDescription: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({ byName, contains: filter.value.contains, items: STATES }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select one"
          selection-mode="single"
        >
          <Label>State</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <Description>Where do you live?</Description>
          ${popoverTemplate("Search states...")}
        </Autocomplete>
      `,
    };
  },
};

/**
 * The options are grouped, and the groups are rebuilt from whatever the filter narrowed to.
 *
 * Only the sections that still hold a match are rendered, which is what keeps an empty heading
 * from being left behind as the list shrinks.
 */
export const WithSections: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        groupsOf: (items: Array<{ id: string; name: string }>) => {
          const keys = new Set(items.map((item) => item.id));

          return COUNTRY_SECTIONS.map((section) => ({
            ...section,
            items: section.items.filter((item) => keys.has(item.id)),
          })).filter((section) => section.items.length > 0);
        },
        items: SECTIONED_COUNTRIES,
      }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select a country"
          selection-mode="single"
        >
          <Label>Country</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter :filter="contains">
              <template #default="{items: matches}">
                ${searchTemplate("Search countries...")}
                <ListBox>
                  ${emptyTemplate()}
                  <template v-for="(section, index) in groupsOf(matches)" :key="section.id">
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
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};

export const WithDisabledOptions: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        disabledKeys: ["cat", "kangaroo"],
        items: DISABLED_ANIMALS,
      }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :disabled-keys="disabledKeys"
          :item-text-value="byName"
          :items="items"
          placeholder="Select an animal"
          selection-mode="single"
        >
          <Label>Animal</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          ${popoverTemplate("Search animals...")}
        </Autocomplete>
      `,
    };
  },
};

export const CustomIndicator: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({ byName, contains: filter.value.contains, items: STATES }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select one"
          selection-mode="single"
        >
          <Label>State</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator class="size-3">
              <IconChevronsExpandVertical />
            </AutocompleteIndicator>
          </AutocompleteTrigger>
          ${popoverTemplate("Search states...")}
        </Autocomplete>
      `,
    };
  },
};

/**
 * Two required autocompletes in a form, validated by the browser.
 *
 * The hidden native control is what refuses the submit, and `FieldError` is what shows the
 * message it produced.
 */
export const Required: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        countries: COUNTRIES,
        onSubmit: (event: Event) => {
          event.preventDefault();
        },
        states: STATES,
      }),
      template: `
        <Form class="flex w-[256px] flex-col gap-4" @submit="onSubmit">
          <Autocomplete
            is-required
            class="w-full"
            :item-text-value="byName"
            :items="states"
            name="state"
            placeholder="Select one"
            selection-mode="single"
          >
            <Label>State</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            <AutocompletePopover>
              <AutocompleteFilter :filter="contains">
                <template #default="{items}">
                  ${searchTemplate("Search states...")}
                  <ListBox>
                    ${emptyTemplate()}
                    ${optionsTemplate}
                  </ListBox>
                </template>
              </AutocompleteFilter>
            </AutocompletePopover>
            <FieldError />
          </Autocomplete>
          <Autocomplete
            is-required
            class="w-full"
            :item-text-value="byName"
            :items="countries"
            name="country"
            placeholder="Select a country"
            selection-mode="single"
          >
            <Label>Country</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            <AutocompletePopover>
              <AutocompleteFilter :filter="contains">
                <template #default="{items}">
                  ${searchTemplate("Search countries...")}
                  <ListBox>
                    ${emptyTemplate()}
                    ${optionsTemplate}
                  </ListBox>
                </template>
              </AutocompleteFilter>
            </AutocompletePopover>
            <FieldError />
          </Autocomplete>
          <Button type="submit">Submit</Button>
        </Form>
      `,
    };
  },
};

export const Controlled: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const value = shallowRef<SelectedValue>("california");

    const selectedName = computed(
      () => CONTROLLED_STATES.find((state) => state.id === value.value)?.name ?? "None",
    );

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        items: CONTROLLED_STATES,
        selectedName,
        value,
      }),
      template: `
        <div class="space-y-2">
          <Autocomplete
            v-model:value="value"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            placeholder="Select a state"
            selection-mode="single"
          >
            <Label>State (controlled)</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            ${popoverTemplate("Search states...")}
          </Autocomplete>
          <p class="text-sm text-muted">Selected: {{ selectedName }}</p>
        </div>
      `,
    };
  },
};

export const ControlledOpenState: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const isOpen = shallowRef(false);

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        isOpen,
        items: STATES,
        toggle: () => {
          isOpen.value = !isOpen.value;
        },
      }),
      template: `
        <div class="space-y-4">
          <Autocomplete
            v-model:is-open="isOpen"
            class="w-[256px]"
            :item-text-value="byName"
            :items="items"
            placeholder="Select one"
            selection-mode="single"
          >
            <Label>State</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            ${popoverTemplate("Search states...")}
          </Autocomplete>
          <Button @click="toggle">{{ isOpen ? "Close" : "Open" }} Autocomplete</Button>
          <p class="text-sm text-muted">Autocomplete is {{ isOpen ? "open" : "closed" }}</p>
        </div>
      `,
    };
  },
};

/**
 * The narrowing happens on a server, so the filter is handed the options rather than a predicate.
 *
 * `items` on the filter takes the filtering over entirely, which is exactly what this needs: the
 * text goes out as a query and the answer comes back as the list to show. The load loop is written
 * out here rather than through a composable of its own, because one story is not a reason to port
 * `useAsyncList`.
 */
export const AsynchronousFiltering: Story = {
  render: () => {
    const items = shallowRef<Array<{ id: string; name: string }>>([]);
    const isLoading = shallowRef(false);
    const inputValue = shallowRef("");

    let pending: AbortController | null = null;

    const load = async (search: string) => {
      pending?.abort();
      pending = new AbortController();

      const controller = pending;

      isLoading.value = true;

      try {
        const response = await fetch(
          `https://swapi.py4e.com/api/people/?search=${encodeURIComponent(search)}`,
          { signal: controller.signal },
        );
        const page = (await response.json()) as { results: Array<{ name: string }> };

        items.value = page.results.map((result) => ({ id: result.name, name: result.name }));
      } catch {
        // An aborted request is the ordinary case here — every keystroke replaces the one before.
      } finally {
        if (pending === controller) isLoading.value = false;
      }
    };

    // The first page is fetched up front, the way `useAsyncList` does upstream: waiting for a
    // keystroke would leave the popover empty until somebody typed.
    void load("");

    return {
      components,
      setup: () => ({
        byName,
        inputValue,
        isLoading,
        items,
        onInputChange: (value: string) => {
          inputValue.value = value;
          void load(value);
        },
      }),
      template: `
        <Autocomplete
          allows-empty-collection
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Search..."
          selection-mode="single"
        >
          <Label>Search a Star Wars character</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter
              :input-value="inputValue"
              :items="items"
              @input-change="onInputChange"
            >
              <template #default="{items: matches}">
                <SearchField
                  auto-focus
                  aria-label="Search"
                  class="sticky top-0 z-10"
                  name="search"
                  variant="secondary"
                >
                  <SearchFieldGroup>
                    <SearchFieldSearchIcon />
                    <SearchFieldInput placeholder="Search characters..." />
                    <Spinner
                      class="absolute end-2 top-1/2 -translate-y-1/2"
                      :class="isLoading ? '' : 'pointer-events-none opacity-0'"
                      size="sm"
                    />
                    <SearchFieldClearButton
                      :class="isLoading ? 'pointer-events-none opacity-0' : ''"
                    />
                  </SearchFieldGroup>
                </SearchField>
                <ListBox class="max-h-[420px] overflow-y-auto">
                  ${emptyTemplate()}
                  <ListBoxItem
                    v-for="item in matches"
                    :id="item.id"
                    :key="item.id"
                    :text-value="item.name"
                  >
                    {{ item.name }}
                    <ListBoxItemIndicator />
                  </ListBoxItem>
                </ListBox>
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};

/**
 * A thousand options, of which only a screenful is ever in the DOM.
 *
 * The filter runs in controlled mode so the narrowed list can be handed to both the virtualizer
 * and the listbox: a windowed collection is built from data, not from what rendered, so the data
 * is what has to be narrowed.
 */
export const Virtualization: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const allUsers = generateUsers(1000);
    const search = shallowRef("");

    const filtered = computed(() => {
      const query = search.value;

      if (!query) return allUsers;

      const { contains } = filter.value;

      return allUsers.filter((user) => contains(user.name, query) || contains(user.email, query));
    });

    return {
      components,
      setup: () => ({
        byName,
        filtered,
        items: allUsers,
        layout: ListLayout,
        onInputChange: (value: string) => {
          search.value = value;
        },
        search,
      }),
      template: `
        <Autocomplete
          allows-empty-collection
          class="w-[300px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select a user"
          selection-mode="single"
        >
          <Label>User</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter
              :input-value="search"
              :items="filtered"
              @input-change="onInputChange"
            >
              <template #default="{items: matches}">
                <SearchField
                  auto-focus
                  aria-label="Search"
                  class="sticky top-0 z-10"
                  name="search"
                  variant="secondary"
                >
                  <SearchFieldGroup>
                    <SearchFieldSearchIcon />
                    <SearchFieldInput placeholder="Search users..." />
                    <SearchFieldClearButton />
                  </SearchFieldGroup>
                </SearchField>
                <Virtualizer :layout="layout" :layout-options="{rowHeight: 50}">
                  <ListBox
                    class="h-[400px] overflow-y-auto"
                    :item-text-value="byName"
                    :items="matches"
                  >
                    ${emptyTemplate()}
                    <template #default="{item}">
                      <ListBoxItem :id="item.id" :text-value="item.name">
                        <div class="flex flex-col">
                          <Label>{{ item.name }}</Label>
                          <Description>{{ item.email }}</Description>
                        </div>
                        <ListBoxItemIndicator />
                      </ListBoxItem>
                    </template>
                  </ListBox>
                </Virtualizer>
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};

export const Disabled: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        countries: VISIT_COUNTRIES,
        states: STATES,
        visited: ["argentina", "japan", "france"],
      }),
      template: `
        <div class="flex flex-col gap-4">
          <Autocomplete
            is-disabled
            class="w-[256px]"
            default-value="california"
            :item-text-value="byName"
            :items="states"
            placeholder="Select one"
            selection-mode="single"
          >
            <Label>State</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            <AutocompletePopover>
              <AutocompleteFilter :filter="contains">
                <template #default="{items}">
                  ${searchTemplate("Search states...")}
                  <ListBox>
                    ${emptyTemplate()}
                    ${optionsTemplate}
                  </ListBox>
                </template>
              </AutocompleteFilter>
            </AutocompletePopover>
          </Autocomplete>
          <Autocomplete
            is-disabled
            class="w-[256px]"
            :default-value="visited"
            :item-text-value="byName"
            :items="countries"
            placeholder="Select countries"
            selection-mode="multiple"
          >
            <Label>Countries to Visit</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            <AutocompletePopover>
              <AutocompleteFilter :filter="contains">
                <template #default="{items}">
                  ${searchTemplate("Search countries...")}
                  <ListBox>
                    ${emptyTemplate()}
                    ${optionsTemplate}
                  </ListBox>
                </template>
              </AutocompleteFilter>
            </AutocompletePopover>
          </Autocomplete>
        </div>
      `,
    };
  },
};

export const UserSelection: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        items: USERS,
        userOf: (key: CollectionKey) => USERS.find((user) => user.id === key),
      }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select a user"
          selection-mode="single"
        >
          <Label>User</Label>
          <AutocompleteTrigger>
            <AutocompleteValue>
              <template #default="{isPlaceholder, placeholder, selectedItems}">
                <template v-if="isPlaceholder">{{ placeholder }}</template>
                <div v-else class="flex items-center gap-2">
                  <Avatar class="size-4" size="sm">
                    <AvatarImage :src="userOf(selectedItems[0].key).avatarUrl" />
                    <AvatarFallback>{{ userOf(selectedItems[0].key).fallback }}</AvatarFallback>
                  </Avatar>
                  <span>{{ selectedItems[0].textValue }}</span>
                </div>
              </template>
            </AutocompleteValue>
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter :filter="contains">
              <template #default="{items: matches}">
                ${searchTemplate("Search users...")}
                <ListBox>
                  ${emptyTemplate()}
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
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};

export const UserSelectionMultiple: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const value = shallowRef<CollectionKey[]>([]);

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        items: USERS,
        onRemove: (keys: Set<CollectionKey>) => {
          value.value = value.value.filter((key) => !keys.has(key));
        },
        value,
      }),
      template: `
        <Autocomplete
          v-model:value="value"
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Select users"
          selection-mode="multiple"
        >
          <Label>Users</Label>
          <AutocompleteTrigger>
            <AutocompleteValue>
              <template #default="{isPlaceholder, placeholder, selectedItems}">
                <template v-if="isPlaceholder">{{ placeholder }}</template>
                <TagGroup v-else :on-remove="onRemove" size="sm">
                  <TagGroupList>
                    <Tag v-for="item in selectedItems" :id="item.key" :key="item.key">
                      {{ item.textValue }}
                    </Tag>
                  </TagGroupList>
                </TagGroup>
              </template>
            </AutocompleteValue>
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter :filter="contains">
              <template #default="{items: matches}">
                ${searchTemplate("Search users...")}
                <ListBox>
                  ${emptyTemplate()}
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
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};

export const LocationSearch: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });

    return {
      components,
      setup: () => ({ byName, contains: filter.value.contains, items: CITIES }),
      template: `
        <Autocomplete
          class="w-[256px]"
          :item-text-value="byName"
          :items="items"
          placeholder="Search for a city"
          selection-mode="single"
        >
          <Label>City</Label>
          <AutocompleteTrigger>
            <AutocompleteValue />
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter :filter="contains">
              <template #default="{items: matches}">
                ${searchTemplate("Search cities...")}
                <ListBox>
                  ${emptyTemplate("No cities found")}
                  <ListBoxItem
                    v-for="city in matches"
                    :id="city.id"
                    :key="city.id"
                    :text-value="city.name"
                  >
                    <IconMapPin class="size-4 shrink-0 text-muted" />
                    <div class="flex flex-col">
                      <Label>{{ city.name }}</Label>
                      <Description>{{ city.country }}</Description>
                    </div>
                    <ListBoxItemIndicator />
                  </ListBoxItem>
                </ListBox>
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};

export const TagGroupSelection: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const value = shallowRef<CollectionKey[]>([]);

    return {
      components,
      setup: () => ({
        byName,
        contains: filter.value.contains,
        items: TAGS,
        onRemove: (keys: Set<CollectionKey>) => {
          value.value = value.value.filter((key) => !keys.has(key));
        },
        value,
      }),
      template: `
        <div class="flex w-[256px] flex-col gap-3">
          <Autocomplete
            v-model:value="value"
            :item-text-value="byName"
            :items="items"
            placeholder="Select tags"
            selection-mode="multiple"
          >
            <Label>Tags</Label>
            <AutocompleteTrigger>
              <AutocompleteValue />
              <AutocompleteClearButton />
              <AutocompleteIndicator />
            </AutocompleteTrigger>
            ${popoverTemplate("Search tags...", "No tags found")}
          </Autocomplete>
          <TagGroup v-if="value.length > 0" :on-remove="onRemove" size="sm">
            <TagGroupList>
              <Tag v-for="key in value" :id="key" :key="key">
                {{ items.find((item) => item.id === key).name }}
              </Tag>
            </TagGroupList>
          </TagGroup>
        </div>
      `,
    };
  },
};

export const EmailRecipients: Story = {
  render: () => {
    const filter = useFilter({ sensitivity: "base" });
    const value = shallowRef<CollectionKey[]>([]);

    return {
      components,
      setup: () => ({
        // Matched on the address rather than the name, which is what somebody typing a recipient
        // reaches for first.
        byEmail: (item: { email: string }) => item.email,

        contains: filter.value.contains,

        items: EMAILS,

        onRemove: (keys: Set<CollectionKey>) => {
          value.value = value.value.filter((key) => !keys.has(key));
        },

        value,
      }),
      template: `
        <Autocomplete
          v-model:value="value"
          class="w-[320px]"
          :item-text-value="byEmail"
          :items="items"
          placeholder="Add recipients"
          selection-mode="multiple"
        >
          <Label>To</Label>
          <AutocompleteTrigger>
            <AutocompleteValue>
              <template #default="{isPlaceholder, placeholder, selectedItems}">
                <template v-if="isPlaceholder">{{ placeholder }}</template>
                <TagGroup v-else :on-remove="onRemove" size="sm">
                  <TagGroupList>
                    <Tag v-for="item in selectedItems" :id="item.key" :key="item.key">
                      {{ item.textValue }}
                    </Tag>
                  </TagGroupList>
                </TagGroup>
              </template>
            </AutocompleteValue>
            <AutocompleteClearButton />
            <AutocompleteIndicator />
          </AutocompleteTrigger>
          <AutocompletePopover>
            <AutocompleteFilter :filter="contains">
              <template #default="{items: matches}">
                ${searchTemplate("Search emails...")}
                <ListBox>
                  ${emptyTemplate("No recipients found")}
                  <ListBoxItem
                    v-for="item in matches"
                    :id="item.id"
                    :key="item.id"
                    :text-value="item.email"
                  >
                    <div class="flex flex-col">
                      <Label>{{ item.name }}</Label>
                      <Description>{{ item.email }}</Description>
                    </div>
                    <ListBoxItemIndicator />
                  </ListBoxItem>
                </ListBox>
              </template>
            </AutocompleteFilter>
          </AutocompletePopover>
        </Autocomplete>
      `,
    };
  },
};
