import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, onMounted, onUnmounted, shallowRef, useTemplateRef} from "vue";

import {Button} from "../button";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Form} from "../form";
import {Kbd, KbdAbbr, KbdContent} from "../kbd";
import {Label} from "../label";
import {Spinner} from "../spinner";

import {
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `SearchField.Group` through, so dot notation cannot be used here.
const components = {
  Button,
  Description,
  FieldError,
  Form,
  Kbd,
  KbdAbbr,
  KbdContent,
  Label,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon,
  Spinner,
};

const meta: StoryMeta = {
  component: SearchField,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/SearchField",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <SearchFieldRoot name="search">
        <Label>Search</Label>
        <SearchFieldGroup>
          <SearchFieldSearchIcon />
          <SearchFieldInput class="w-[280px]" placeholder="Search..." />
          <SearchFieldClearButton />
        </SearchFieldGroup>
      </SearchFieldRoot>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot name="primary-search" variant="primary">
          <Label>Primary variant</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
        </SearchFieldRoot>
        <SearchFieldRoot name="secondary-search" variant="secondary">
          <Label>Secondary variant</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <SearchFieldRoot full-width name="search">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot name="search">
          <Label>Search products</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search products..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <Description>Enter keywords to search for products</Description>
        </SearchFieldRoot>
        <SearchFieldRoot name="search-users">
          <Label>Search users</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search users..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <Description>Search by name, email, or username</Description>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot is-required name="search">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
        </SearchFieldRoot>
        <SearchFieldRoot is-required name="search-query">
          <Label>Search query</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Enter search query..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <Description>Minimum 3 characters required</Description>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot is-invalid is-required name="search" value="ab">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <FieldError>Search query must be at least 3 characters</FieldError>
        </SearchFieldRoot>
        <SearchFieldRoot is-invalid name="search-invalid">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." value="invalid@query" />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <FieldError>Invalid characters in search query</FieldError>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot is-disabled name="search" value="Disabled search">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <Description>This search field is disabled</Description>
        </SearchFieldRoot>
        <SearchFieldRoot is-disabled name="search-empty">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <Description>This search field is disabled</Description>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");

      return {value};
    },
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot v-model:value="value" name="search">
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <Description>Current value: {{ value || "(empty)" }}</Description>
        </SearchFieldRoot>
        <div class="flex gap-2">
          <Button variant="tertiary" @click="value = ''">Clear</Button>
          <Button variant="tertiary" @click="value = 'example query'">Set example</Button>
        </div>
      </div>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");
      const isInvalid = computed(() => value.value.length > 0 && value.value.length < 3);

      return {isInvalid, value};
    },
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot
          v-model:value="value"
          is-required
          :is-invalid="isInvalid"
          name="search"
        >
          <Label>Search</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <FieldError v-if="isInvalid">Search query must be at least 3 characters</FieldError>
          <Description v-else>Enter at least 3 characters to search</Description>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

// The custom elements carry the class and the slot themselves. React clones them onto the
// caller's element; a vapor slot cannot be inspected, so the call site writes what the
// stylesheet needs — which lands the same DOM.
export const CustomIcons: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <SearchFieldRoot name="search-custom">
          <Label>Search (Custom Icons)</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon>
              <svg
                class="search-field__search-icon"
                data-slot="search-field-search-icon"
                height="16"
                viewBox="0 0 16 16"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  d="M12.5 4c0 .174-.071.513-.885.888S9.538 5.5 8 5.5s-2.799-.237-3.615-.612C3.57 4.513 3.5 4.174 3.5 4s.071-.513.885-.888S6.462 2.5 8 2.5s2.799.237 3.615.612c.814.375.885.714.885.888m-1.448 2.66C10.158 6.888 9.115 7 8 7s-2.158-.113-3.052-.34l1.98 2.905c.21.308.322.672.322 1.044v3.37q.088.02.25.021c.422 0 .749-.14.95-.316c.185-.162.3-.38.3-.684v-2.39c0-.373.112-.737.322-1.045zM8 1c3.314 0 6 1 6 3a3.24 3.24 0 0 1-.563 1.826l-3.125 4.584a.35.35 0 0 0-.062.2V13c0 1.5-1.25 2.5-2.75 2.5s-1.75-1-1.75-1v-3.89a.35.35 0 0 0-.061-.2L2.563 5.826A3.24 3.24 0 0 1 2 4c0-2 2.686-3 6-3m-.88 12.936q-.015-.008-.013-.01z"
                  fill="currentColor"
                  fill-rule="evenodd"
                />
              </svg>
            </SearchFieldSearchIcon>
            <SearchFieldInput class="w-[280px]" placeholder="Search..." />
            <SearchFieldClearButton>
              <svg
                height="16"
                viewBox="0 0 16 16"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14M6.53 5.47a.75.75 0 0 0-1.06 1.06L6.94 8L5.47 9.47a.75.75 0 1 0 1.06 1.06L8 9.06l1.47 1.47a.75.75 0 1 0 1.06-1.06L9.06 8l1.47-1.47a.75.75 0 1 0-1.06-1.06L8 6.94z"
                  fill="currentColor"
                  fill-rule="evenodd"
                />
              </svg>
            </SearchFieldClearButton>
          </SearchFieldGroup>
          <Description>Custom icon children</Description>
        </SearchFieldRoot>
      </div>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const MIN_LENGTH = 3;
      const value = shallowRef("");
      const isSubmitting = shallowRef(false);
      const submitted = shallowRef("");
      const isInvalid = computed(() => value.value.length > 0 && value.value.length < MIN_LENGTH);

      const onSubmit = (event: Event) => {
        event.preventDefault();

        if (value.value.length < MIN_LENGTH) return;

        isSubmitting.value = true;

        setTimeout(() => {
          submitted.value = value.value;
          value.value = "";
          isSubmitting.value = false;
        }, 1500);
      };

      return {MIN_LENGTH, isInvalid, isSubmitting, onSubmit, submitted, value};
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-4" @submit="onSubmit">
        <SearchFieldRoot
          v-model:value="value"
          is-required
          :is-invalid="isInvalid"
          name="search"
        >
          <Label>Search products</Label>
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput class="w-full" placeholder="Search products..." />
            <SearchFieldClearButton />
          </SearchFieldGroup>
          <FieldError v-if="isInvalid">
            Search query must be at least {{ MIN_LENGTH }} characters
          </FieldError>
          <Description v-else>Enter at least {{ MIN_LENGTH }} characters to search</Description>
        </SearchFieldRoot>
        <Button
          class="w-full"
          :is-disabled="value.length < MIN_LENGTH"
          :is-pending="isSubmitting"
          type="submit"
          variant="primary"
        >
          <template v-if="isSubmitting">
            <Spinner color="current" size="sm" />
            Searching...
          </template>
          <template v-else>Search</template>
        </Button>
        <p v-if="submitted" class="text-sm text-muted">Search submitted: {{ submitted }}</p>
      </Form>
    `,
  }),
};

export const WithKeyboardShortcut: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");
      // Scoped to the story's own wrapper so the shortcut cannot reach a field from another
      // story that happens to be mounted at the same time.
      const wrapper = useTemplateRef<HTMLElement>("wrapper");

      const findControl = () =>
        wrapper.value?.querySelector<HTMLInputElement>('[data-slot="search-field-input"]') ?? null;

      const onKeydown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          event.preventDefault();
          findControl()?.focus();
        }

        if (event.key === "Escape" && document.activeElement === findControl()) {
          findControl()?.blur();
        }
      };

      onMounted(() => window.addEventListener("keydown", onKeydown));
      onUnmounted(() => window.removeEventListener("keydown", onKeydown));

      return {value};
    },
    template: `
      <div ref="wrapper" class="flex flex-col gap-4">
        <div>
          <SearchFieldRoot v-model:value="value" name="search">
            <Label>Search</Label>
            <SearchFieldGroup>
              <SearchFieldSearchIcon />
              <SearchFieldInput class="w-[280px]" placeholder="Search..." />
              <SearchFieldClearButton />
            </SearchFieldGroup>
            <Description>Use keyboard shortcut to quickly focus this field</Description>
          </SearchFieldRoot>
        </div>
        <div class="text-default-500 flex items-center gap-2 text-sm">
          <span>Press</span>
          <Kbd>
            <KbdAbbr key-value="command" />
            <KbdContent>K</KbdContent>
          </Kbd>
          <span>to focus the search field</span>
        </div>
      </div>
    `,
  }),
};
