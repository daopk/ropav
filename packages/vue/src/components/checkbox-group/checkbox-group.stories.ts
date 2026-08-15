import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {Button} from "../button";
import {Checkbox, CheckboxContent, CheckboxControl, CheckboxIndicator} from "../checkbox";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Form} from "../form";
import {Label} from "../label";

import {CheckboxGroup} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `Checkbox.Content` through, so dot notation cannot be used here.
const components = {
  Button,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxGroup,
  CheckboxIndicator,
  Description,
  FieldError,
  Form,
  Label,
};

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {
      control: {type: "boolean"},
    },
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary"],
    },
  },
  component: CheckboxGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/CheckboxGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <CheckboxGroup name="interests" :is-disabled="args.isDisabled" :variant="args.variant">
        <Label>Select your interests</Label>
        <Description>Choose all that apply</Description>
        <Checkbox value="coding">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Coding
          </CheckboxContent>
          <Description>Love building software</Description>
        </Checkbox>
        <Checkbox value="design">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Design
          </CheckboxContent>
          <Description>Enjoy creating beautiful interfaces</Description>
        </Checkbox>
        <Checkbox value="writing">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Writing
          </CheckboxContent>
          <Description>Passionate about content creation</Description>
        </Checkbox>
      </CheckboxGroup>
    `,
  }),
};

export const WithCustomIndicator: Story = {
  render: () => ({
    components,
    template: `
      <CheckboxGroup name="features">
        <Label>Features</Label>
        <Description>Select the features you want</Description>
        <Checkbox value="notifications">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator>
                <template #default="{isSelected}">
                  <svg
                    v-if="isSelected"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </template>
              </CheckboxIndicator>
            </CheckboxControl>
            Email notifications
          </CheckboxContent>
          <Description>Receive updates via email</Description>
        </Checkbox>
        <Checkbox value="newsletter">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator>
                <template #default="{isSelected}">
                  <svg
                    v-if="isSelected"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </template>
              </CheckboxIndicator>
            </CheckboxControl>
            Newsletter
          </CheckboxContent>
          <Description>Get weekly newsletters</Description>
        </Checkbox>
      </CheckboxGroup>
    `,
  }),
};

export const Indeterminate: Story = {
  render: () => ({
    components,
    setup: () => {
      const allOptions = ["coding", "design", "writing"];
      const selected = shallowRef(["coding"]);

      return {
        allOptions,
        isAllSelected: computed(() => selected.value.length === allOptions.length),
        isSomeSelected: computed(
          () => selected.value.length > 0 && selected.value.length < allOptions.length,
        ),
        onSelectAll: (isSelected: boolean) => {
          selected.value = isSelected ? [...allOptions] : [];
        },
        selected,
      };
    },
    template: `
      <div>
        <Checkbox
          :is-indeterminate="isSomeSelected"
          :is-selected="isAllSelected"
          name="select-all"
          @change="onSelectAll"
        >
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Select all
          </CheckboxContent>
        </Checkbox>
        <div class="ms-6 flex flex-col gap-2">
          <CheckboxGroup v-model:value="selected">
            <Checkbox v-for="option in allOptions" :key="option" :value="option">
              <CheckboxContent>
                <CheckboxControl>
                  <CheckboxIndicator />
                </CheckboxControl>
                {{ option }}
              </CheckboxContent>
            </Checkbox>
          </CheckboxGroup>
        </div>
      </div>
    `,
  }),
};

export const Validation: Story = {
  render: () => ({
    components,
    setup: () => {
      // Printed on screen rather than announced with `alert`, which blocks the whole tab and
      // so cannot be read back when the story is verified from a script.
      const submitted = shallowRef<string | null>(null);

      return {
        onSubmit: (event: Event) => {
          event.preventDefault();

          const data = new FormData(event.currentTarget as HTMLFormElement);

          submitted.value = data.getAll("preferences").join(", ");
        },
        submitted,
      };
    },
    template: `
      <Form class="flex flex-col gap-4 px-4" @submit="onSubmit">
        <CheckboxGroup is-required name="preferences">
          <Label>Preferences</Label>
          <Description>Select at least one preference</Description>
          <Checkbox value="email">
            <CheckboxContent>
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              Email notifications
            </CheckboxContent>
          </Checkbox>
          <Checkbox value="sms">
            <CheckboxContent>
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              SMS notifications
            </CheckboxContent>
          </Checkbox>
          <Checkbox value="push">
            <CheckboxContent>
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              Push notifications
            </CheckboxContent>
          </Checkbox>
          <FieldError>Please select at least one notification method.</FieldError>
        </CheckboxGroup>
        <Button type="submit">Submit</Button>
        <p v-if="submitted !== null" class="text-sm text-muted" data-testid="submitted">
          Selected preferences: {{ submitted }}
        </p>
      </Form>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const selected = shallowRef(["coding", "design"]);

      return {selected};
    },
    template: `
      <CheckboxGroup class="min-w-[320px]" name="skills" v-model:value="selected">
        <Label>Your skills</Label>
        <Checkbox value="coding">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Coding
          </CheckboxContent>
        </Checkbox>
        <Checkbox value="design">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Design
          </CheckboxContent>
        </Checkbox>
        <Checkbox value="writing">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Writing
          </CheckboxContent>
        </Checkbox>
        <Label class="my-4 text-sm text-muted">Selected: {{ selected.join(", ") || "None" }}</Label>
      </CheckboxGroup>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <CheckboxGroup is-disabled name="disabled-features">
        <Label>Features</Label>
        <Description>Feature selection is temporarily disabled</Description>
        <Checkbox value="feature1">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Feature 1
          </CheckboxContent>
          <Description>This feature is coming soon</Description>
        </Checkbox>
        <Checkbox value="feature2">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Feature 2
          </CheckboxContent>
          <Description>This feature is coming soon</Description>
        </Checkbox>
      </CheckboxGroup>
    `,
  }),
};
