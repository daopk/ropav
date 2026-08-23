import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { computed, shallowRef } from "vue";

import { Description } from "../description";
import { FieldError } from "../field-error";
import { Input } from "../input";
import { Label } from "../label";
import { TextArea } from "../textarea";

import { TextField } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve dot notation through.
const components = { Description, FieldError, Input, Label, TextArea, TextField };

const meta: StoryMeta = {
  argTypes: {
    isDisabled: { control: { type: "boolean" } },
    variant: { control: { type: "select" }, options: ["primary", "secondary"] },
  },
  component: TextField,
  parameters: { layout: "centered" },
  title: "Components/Forms/TextField",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <TextField name="name" :is-disabled="args.isDisabled" :variant="args.variant">
        <Label>Your name</Label>
        <Input class="w-[280px]" placeholder="John" />
      </TextField>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <TextField full-width name="name">
          <Label>Your name</Label>
          <Input placeholder="John" />
        </TextField>
        <TextField full-width name="productDescription">
          <Label>Describe your product</Label>
          <TextArea placeholder="My product is..." />
        </TextField>
        <TextField full-width is-invalid is-required name="password" type="password">
          <Label>Password</Label>
          <Input />
          <FieldError>Password must be longer than 8 characters</FieldError>
        </TextField>
      </div>
    `,
  }),
};

export const WithTextArea: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField name="productDescription">
          <Label>Describe your product</Label>
          <TextArea class="w-[280px]" placeholder="My product is..." />
        </TextField>
        <TextField name="detailedDescription">
          <Label>Detailed description</Label>
          <TextArea class="w-[280px]" placeholder="Provide more details..." :rows="4" />
          <Description>Minimum 4 rows</Description>
        </TextField>
        <TextField name="review">
          <Label>Review</Label>
          <TextArea
            class="w-[280px]"
            placeholder="Share your experience..."
            :rows="6"
            style="resize: vertical"
          />
          <Description>Resizable vertically</Description>
        </TextField>
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField is-required name="email" type="email">
          <Label>Email</Label>
          <Input class="w-[280px]" placeholder="john@example.com" />
        </TextField>
        <TextField is-required name="address">
          <Label>Delivery address</Label>
          <TextArea class="w-[280px]" placeholder="123 Main St, Anytown, USA" />
          <Description>Make sure to include the zip code</Description>
        </TextField>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField name="name">
          <Label>Your name</Label>
          <Input class="w-[280px]" placeholder="John" />
          <Description>We'll never share this with anyone else</Description>
        </TextField>
        <TextField name="address">
          <Label>Delivery address</Label>
          <TextArea class="w-[280px]" placeholder="123 Main St, Anytown, USA" />
          <Description>Make sure to include the zip code</Description>
        </TextField>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField is-invalid is-required name="password" type="password">
          <Label>Your password</Label>
          <Input class="w-[280px]" />
          <FieldError>Password must be longer than 8 characters</FieldError>
        </TextField>
        <TextField is-invalid is-required name="address">
          <Label>Delivery address</Label>
          <TextArea class="w-[280px]" placeholder="123 Main St, Anytown, USA" />
          <FieldError>The address is invalid</FieldError>
        </TextField>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField is-disabled name="name">
          <Label>Your name</Label>
          <Input class="w-[280px]" placeholder="John" />
          <Description>We'll never share this with anyone else</Description>
        </TextField>
        <TextField is-disabled name="message">
          <Label>Your message</Label>
          <TextArea class="w-[280px]" placeholder="Tell us more about yourself..." />
          <Description>Min 50 characters</Description>
        </TextField>
      </div>
    `,
  }),
};

export const InputTypes: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex w-80 flex-col gap-4">
        <TextField name="age" type="number">
          <Label>Your age</Label>
          <Input class="w-[280px]" placeholder="18" />
        </TextField>

        <TextField name="password" type="password">
          <Label>Your password</Label>
          <Input class="w-[280px]" placeholder="••••••••" />
        </TextField>

        <TextField name="email" type="email">
          <Label>Your email</Label>
          <Input class="w-[280px]" placeholder="john@example.com" />
        </TextField>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const inputValue = shallowRef("");
      const textAreaValue = shallowRef("");

      return { inputValue, textAreaValue };
    },
    template: `
      <div class="flex flex-col gap-4">
        <TextField v-model:value="inputValue" name="name">
          <Label>Your name</Label>
          <Input class="w-[280px]" placeholder="John" />
          <Description>Character count: {{ inputValue.length }}</Description>
        </TextField>
        <TextField v-model:value="textAreaValue" name="bio">
          <Label>Your bio</Label>
          <TextArea class="w-[280px]" placeholder="Tell us about yourself..." />
          <Description>Character count: {{ textAreaValue.length }} / 500</Description>
        </TextField>
      </div>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const username = shallowRef("");
      const bio = shallowRef("");
      const isUsernameInvalid = computed(
        () => username.value.length > 0 && username.value.length < 3,
      );
      const isBioInvalid = computed(() => bio.value.length > 0 && bio.value.length < 20);

      return { bio, isBioInvalid, isUsernameInvalid, username };
    },
    template: `
      <div class="flex flex-col gap-4">
        <TextField
          v-model:value="username"
          is-required
          :is-invalid="isUsernameInvalid"
          name="username"
        >
          <Label>Username</Label>
          <Input class="w-[280px]" placeholder="john_doe" />
          <FieldError v-if="isUsernameInvalid">Username must be at least 3 characters</FieldError>
          <Description v-else>Choose a unique username</Description>
        </TextField>
        <TextField v-model:value="bio" is-required :is-invalid="isBioInvalid" name="bio">
          <Label>Bio</Label>
          <TextArea class="w-[280px]" placeholder="Tell us about yourself..." />
          <FieldError v-if="isBioInvalid">Bio must be at least 20 characters</FieldError>
          <Description v-else>Min 20 characters ({{ bio.length }}/20)</Description>
        </TextField>
      </div>
    `,
  }),
};
