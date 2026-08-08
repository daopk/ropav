import type {Meta, StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";

import {CheckboxGroup} from "../checkbox-group";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Label} from "../label";

import {Checkbox, CheckboxContent, CheckboxControl, CheckboxIndicator} from "./index";

import IconBell from "~icons/gravity-ui/bell";
import IconComment from "~icons/gravity-ui/comment";
import IconEnvelope from "~icons/gravity-ui/envelope";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `Checkbox.Content` through, so dot notation cannot be used here.
const components = {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxGroup,
  CheckboxIndicator,
  Description,
  FieldError,
  IconBell,
  IconComment,
  IconEnvelope,
  Label,
};

const meta: Meta = {
  argTypes: {
    isDisabled: {
      control: {type: "boolean"},
    },
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary"],
    },
  },
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/Checkbox",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Checkbox name="terms" :is-disabled="args.isDisabled" :variant="args.variant">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          Accept terms and conditions
        </CheckboxContent>
      </Checkbox>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4 px-4">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Primary variant</p>
          <Checkbox name="primary" variant="primary">
            <CheckboxContent>
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              Primary checkbox
            </CheckboxContent>
            <Description>Standard styling with default background</Description>
          </Checkbox>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Secondary variant</p>
          <Checkbox name="secondary" variant="secondary">
            <CheckboxContent>
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              Secondary checkbox
            </CheckboxContent>
            <Description>Lower emphasis variant for use in surfaces</Description>
          </Checkbox>
        </div>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <Checkbox name="terms">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          Accept terms and conditions
        </CheckboxContent>
        <Description>I agree to the terms and privacy policy</Description>
      </Checkbox>
    `,
  }),
};

export const WithCustomIndicator: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex gap-4 px-4">
        <Checkbox default-selected id="heart">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator>
                <template #default="{isSelected}">
                  <svg v-if="isSelected" viewBox="0 0 24 24">
                    <path
                      d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"
                      fill="currentColor"
                    />
                  </svg>
                </template>
              </CheckboxIndicator>
            </CheckboxControl>
            Heart
          </CheckboxContent>
        </Checkbox>
        <Checkbox default-selected id="plus">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator>
                <template #default="{isSelected}">
                  <svg v-if="isSelected" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M6 12H18"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                    />
                    <path
                      d="M12 18V6"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                    />
                  </svg>
                </template>
              </CheckboxIndicator>
            </CheckboxControl>
            Plus
          </CheckboxContent>
        </Checkbox>
      </div>
    `,
  }),
};

export const Indeterminate: Story = {
  render: () => ({
    components,
    template: `
      <Checkbox is-indeterminate id="select-all">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          Select all
        </CheckboxContent>
        <Description>Shows indeterminate state</Description>
      </Checkbox>
    `,
  }),
};

export const ControlOnly: Story = {
  render: () => ({
    components,
    template: `
      <Checkbox aria-label="Accept" name="control-only">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
        </CheckboxContent>
      </Checkbox>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <Checkbox is-disabled id="feature">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          Feature
        </CheckboxContent>
        <Description>This feature is coming soon</Description>
      </Checkbox>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const isSelected = shallowRef(true);

      return {isSelected};
    },
    template: `
      <div class="flex flex-col gap-3 px-4">
        <Checkbox id="notifications" v-model:is-selected="isSelected">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Email notifications
          </CheckboxContent>
        </Checkbox>
        <p class="mt-2 text-sm text-muted">
          Status: <span class="font-medium">{{ isSelected ? "Enabled" : "Disabled" }}</span>
        </p>
      </div>
    `,
  }),
};

export const SlotProps: Story = {
  render: () => ({
    components,
    template: `
      <Checkbox id="terms">
        <template #default="{isSelected}">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            {{ isSelected ? "Terms accepted" : "Accept terms" }}
          </CheckboxContent>
          <Description>
            {{ isSelected ? "Thank you for accepting" : "Please read and accept the terms" }}
          </Description>
        </template>
      </Checkbox>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <Checkbox is-invalid is-required name="agreement">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          I agree to the terms
        </CheckboxContent>
        <FieldError>You must accept the terms to continue</FieldError>
      </Checkbox>
    `,
  }),
};

export const Validation: Story = {
  render: () => ({
    components,
    setup: () => ({
      validate: (isSelected: boolean) => (isSelected ? true : "Please subscribe to continue"),
    }),
    template: `
      <Checkbox is-required name="newsletter" :validate="validate">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          Subscribe to newsletter
        </CheckboxContent>
        <FieldError />
      </Checkbox>
    `,
  }),
};

export const FullRounded: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6 px-4">
        <div class="flex flex-col gap-3">
          <Label class="text-muted">Rounded checkboxes</Label>
          <Checkbox
            class="[&_[data-slot='checkbox-default-indicator--checkmark']]:size-2"
            id="small-rounded"
          >
            <CheckboxContent>
              <CheckboxControl class="size-3 rounded-full before:rounded-full">
                <CheckboxIndicator />
              </CheckboxControl>
              Small size
            </CheckboxContent>
          </Checkbox>
        </div>
        <div class="flex flex-col gap-3">
          <Checkbox id="default-rounded">
            <CheckboxContent>
              <CheckboxControl class="size-4 rounded-full before:rounded-full">
                <CheckboxIndicator />
              </CheckboxControl>
              Default size
            </CheckboxContent>
          </Checkbox>
        </div>
        <div class="flex flex-col gap-3">
          <Checkbox id="large-rounded">
            <CheckboxContent>
              <CheckboxControl class="size-5 rounded-full before:rounded-full">
                <CheckboxIndicator />
              </CheckboxControl>
              Large size
            </CheckboxContent>
          </Checkbox>
        </div>
        <div class="flex flex-col gap-3">
          <Checkbox
            class="[&_[data-slot='checkbox-default-indicator--checkmark']]:size-4"
            id="xl-rounded"
          >
            <CheckboxContent>
              <CheckboxControl class="size-6 rounded-full before:rounded-full">
                <CheckboxIndicator />
              </CheckboxControl>
              Extra large size
            </CheckboxContent>
          </Checkbox>
        </div>
      </div>
    `,
  }),
};

export const FeaturesAndAddOnsExample: Story = {
  render: () => ({
    components,
    setup: () => ({
      addOns: [
        {
          description: "Receive updates via email",
          icon: "IconEnvelope",
          title: "Email Notifications",
          value: "email",
        },
        {
          description: "Get instant SMS notifications",
          icon: "IconComment",
          title: "SMS Alerts",
          value: "sms",
        },
        {
          description: "Browser and mobile push alerts",
          icon: "IconBell",
          title: "Push Notifications",
          value: "push",
        },
      ],
    }),
    template: `
      <div class="flex w-full flex-col items-center gap-10 px-4 py-8">
        <section class="flex w-full min-w-[320px] flex-col gap-4">
          <CheckboxGroup name="notification-preferences">
            <Label>Notification preferences</Label>
            <Description>Choose how you want to receive updates</Description>
            <div class="flex flex-col gap-2">
              <Checkbox v-for="addon in addOns" :key="addon.value" :id="addon.value" :value="addon.value">
                <CheckboxContent
                  class="group relative flex w-full flex-row items-start justify-start gap-4 rounded-3xl bg-surface-tertiary px-5 py-4 transition-all data-[selected=true]:bg-accent/10"
                >
                  <CheckboxControl class="absolute end-4 top-3 size-5 rounded-full before:rounded-full">
                    <CheckboxIndicator />
                  </CheckboxControl>
                  <component :is="addon.icon" class="size-5 text-accent" />
                  <div class="flex flex-col gap-1">
                    <span>{{ addon.title }}</span>
                    <Description>{{ addon.description }}</Description>
                  </div>
                </CheckboxContent>
              </Checkbox>
            </div>
          </CheckboxGroup>
        </section>
      </div>
    `,
  }),
};
