import type { Color } from "../../utils/color-types";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";

import { parseColor } from "../../utils/color";
import { ButtonRoot } from "../button";
import {
  ColorInputGroupInput,
  ColorInputGroupPrefix,
  ColorInputGroupRoot,
  ColorInputGroupSuffix,
} from "../color-input-group";
import { ColorSwatchRoot } from "../color-swatch";
import { DescriptionRoot } from "../description";
import { FieldErrorRoot } from "../field-error";
import { FormRoot } from "../form";
import { LabelRoot } from "../label";

import { ColorFieldRoot } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `ColorField.Group` through, so dot notation cannot be used here.
const components = {
  Button: ButtonRoot,
  ColorField: ColorFieldRoot,
  ColorFieldGroup: ColorInputGroupRoot,
  ColorFieldInput: ColorInputGroupInput,
  ColorFieldPrefix: ColorInputGroupPrefix,
  ColorFieldSuffix: ColorInputGroupSuffix,
  ColorSwatch: ColorSwatchRoot,
  Description: DescriptionRoot,
  FieldError: FieldErrorRoot,
  Form: FormRoot,
  Label: LabelRoot,
};

const meta: StoryMeta = {
  component: ColorFieldRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorField",
};

export default meta;

type Story = StoryObj<typeof meta>;

const DEFAULT_COLOR = parseColor("#0485F7");

export const Default: Story = {
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color | null>(DEFAULT_COLOR);

      return { color, onChange: (value: Color | null) => (color.value = value) };
    },
    template: `
      <ColorField class="w-[280px]" name="color" :value="color" @change="onChange">
        <Label>Color</Label>
        <ColorFieldGroup>
          <ColorFieldPrefix>
            <ColorSwatch :color="color?.toString('css')" size="xs" />
          </ColorFieldPrefix>
          <ColorFieldInput />
        </ColorFieldGroup>
      </ColorField>
    `,
  }),
};

/** The three heights a button stands at, set on the group that draws the field. */
export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex flex-col gap-4">
        <ColorField
          v-for="size in sizes"
          :key="size"
          class="w-[280px]"
          default-value="#0485F7"
          :name="'size-' + size"
        >
          <Label>Size {{ size }}</Label>
          <ColorFieldGroup :size="size">
            <ColorFieldInput />
          </ColorFieldGroup>
        </ColorField>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <ColorField class="w-[280px]" default-value="#0485F7" name="primary-color">
          <Label>Primary variant</Label>
          <ColorFieldGroup variant="primary">
            <ColorFieldInput />
          </ColorFieldGroup>
        </ColorField>
        <ColorField class="w-[280px]" default-value="#F43F5E" name="secondary-color">
          <Label>Secondary variant</Label>
          <ColorFieldGroup variant="secondary">
            <ColorFieldInput />
          </ColorFieldGroup>
        </ColorField>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <ColorField full-width default-value="#10B981" name="color">
          <Label>Brand Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput />
          </ColorFieldGroup>
        </ColorField>
        <ColorField full-width default-value="#8B5CF6" name="color-with-suffix">
          <Label>Theme Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput />
          </ColorFieldGroup>
        </ColorField>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <ColorField class="w-[280px]" default-value="#3B82F6" name="color">
          <Label>Primary Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput />
          </ColorFieldGroup>
          <Description>Enter your brand's primary color</Description>
        </ColorField>
        <ColorField class="w-[280px]" default-value="#F59E0B" name="accent-color">
          <Label>Accent Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput />
          </ColorFieldGroup>
          <Description>Used for highlights and CTAs</Description>
        </ColorField>
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <ColorField is-required class="w-[280px]" name="color">
          <Label>Brand Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput placeholder="#000000" />
          </ColorFieldGroup>
        </ColorField>
        <ColorField is-required class="w-[280px]" name="theme-color">
          <Label>Theme Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput placeholder="#000000" />
          </ColorFieldGroup>
          <Description>Required field</Description>
        </ColorField>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <ColorField is-invalid is-required class="w-[280px]" name="color">
          <Label>Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput placeholder="#000000" />
          </ColorFieldGroup>
          <FieldError>Please enter a valid hex color</FieldError>
        </ColorField>
        <ColorField is-invalid class="w-[280px]" name="invalid-color">
          <Label>Background Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput />
          </ColorFieldGroup>
          <FieldError>Invalid color format. Use hex (e.g., #FF5733)</FieldError>
        </ColorField>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <ColorField is-disabled class="w-[280px]" default-value="#0485F7" name="color">
          <Label>Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput />
          </ColorFieldGroup>
          <Description>This color field is disabled</Description>
        </ColorField>
        <ColorField is-disabled class="w-[280px]" name="color-empty">
          <Label>Color</Label>
          <ColorFieldGroup>
            <ColorFieldInput placeholder="#000000" />
          </ColorFieldGroup>
          <Description>This color field is disabled</Description>
        </ColorField>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<Color | null>(parseColor("#0485F7"));

      return {
        onChange: (next: Color | null) => (value.value = next),
        setValue: (next: string | null) => (value.value = next ? parseColor(next) : null),
        value,
      };
    },
    template: `
      <div class="flex flex-col gap-4">
        <ColorField class="w-[280px]" name="color" :value="value" @change="onChange">
          <Label>Color</Label>
          <ColorFieldGroup>
            <ColorFieldPrefix>
              <ColorSwatch :color="value?.toString('css')" size="xs" />
            </ColorFieldPrefix>
            <ColorFieldInput />
          </ColorFieldGroup>
          <Description>Current value: {{ value ? value.toString("hex") : "(empty)" }}</Description>
        </ColorField>
        <div class="flex gap-2">
          <Button variant="tertiary" @click="setValue('#EF4444')">Set Red</Button>
          <Button variant="tertiary" @click="setValue('#10B981')">Set Green</Button>
          <Button variant="tertiary" @click="setValue(null)">Clear</Button>
        </div>
      </div>
    `,
  }),
};

export const ChannelEditing: Story = {
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color | null>(parseColor("#7F007F"));

      return { color, onChange: (value: Color | null) => (color.value = value) };
    },
    template: `
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">Edit individual HSL channels:</p>
        <div class="flex gap-4">
          <ColorField
            channel="hue"
            class="w-[100px]"
            color-space="hsl"
            name="hue"
            :value="color"
            @change="onChange"
          >
            <Label>Hue</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
            </ColorFieldGroup>
          </ColorField>
          <ColorField
            channel="saturation"
            class="w-[100px]"
            color-space="hsl"
            name="saturation"
            :value="color"
            @change="onChange"
          >
            <Label>Saturation</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
              <ColorFieldSuffix>
                <span class="text-sm text-muted">%</span>
              </ColorFieldSuffix>
            </ColorFieldGroup>
          </ColorField>
          <ColorField
            channel="lightness"
            class="w-[100px]"
            color-space="hsl"
            name="lightness"
            :value="color"
            @change="onChange"
          >
            <Label>Lightness</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
              <ColorFieldSuffix>
                <span class="text-sm text-muted">%</span>
              </ColorFieldSuffix>
            </ColorFieldGroup>
          </ColorField>
        </div>
        <div class="flex items-center gap-2">
          <ColorSwatch class="size-8" :color="color?.toString('css')" size="xs" />
          <span class="text-sm">Current: {{ color ? color.toString("hex") : "(empty)" }}</span>
        </div>
      </div>
    `,
  }),
};

export const RGBChannels: Story = {
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color | null>(parseColor("#3B82F6"));

      return { color, onChange: (value: Color | null) => (color.value = value) };
    },
    template: `
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">Edit individual RGB channels:</p>
        <div class="flex gap-4">
          <ColorField
            channel="red"
            class="w-[80px]"
            color-space="rgb"
            name="red"
            :value="color"
            @change="onChange"
          >
            <Label>Red</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
            </ColorFieldGroup>
          </ColorField>
          <ColorField
            channel="green"
            class="w-[80px]"
            color-space="rgb"
            name="green"
            :value="color"
            @change="onChange"
          >
            <Label>Green</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
            </ColorFieldGroup>
          </ColorField>
          <ColorField
            channel="blue"
            class="w-[80px]"
            color-space="rgb"
            name="blue"
            :value="color"
            @change="onChange"
          >
            <Label>Blue</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
            </ColorFieldGroup>
          </ColorField>
        </div>
        <div class="flex items-center gap-2">
          <ColorSwatch class="size-8" :color="color?.toString('css')" size="xs" />
          <span class="text-sm">Current: {{ color?.toString("hex") }}</span>
        </div>
      </div>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<Color | null>(null);
      const isSubmitting = shallowRef(false);

      const onSubmit = (event: Event) => {
        event.preventDefault();

        if (!value.value) return;

        isSubmitting.value = true;

        // Stands in for a request.
        setTimeout(() => {
          value.value = null;
          isSubmitting.value = false;
        }, 1500);
      };

      return {
        isSubmitting,
        onChange: (next: Color | null) => (value.value = next),
        onSubmit,
        value,
      };
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-4" @submit="onSubmit">
        <ColorField
          full-width
          is-required
          class="w-full"
          name="brand-color"
          :value="value"
          @change="onChange"
        >
          <Label>Brand Color</Label>
          <ColorFieldGroup>
            <ColorFieldPrefix>
              <ColorSwatch :color="value?.toString('css')" size="xs" />
            </ColorFieldPrefix>
            <ColorFieldInput placeholder="#000000" />
          </ColorFieldGroup>
          <Description>Choose your brand's primary color</Description>
        </ColorField>
        <Button
          class="w-full"
          :is-disabled="!value"
          :is-pending="isSubmitting"
          type="submit"
          variant="primary"
        >
          {{ isSubmitting ? "Saving..." : "Save Color" }}
        </Button>
      </Form>
    `,
  }),
};

export const WithColorPresets: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<Color | null>(parseColor("#0485F7"));

      return {
        onChange: (next: Color | null) => (value.value = next),
        presets: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
        setValue: (next: string) => (value.value = parseColor(next)),
        value,
      };
    },
    template: `
      <div class="flex flex-col gap-4">
        <ColorField class="w-[280px]" name="color" :value="value" @change="onChange">
          <Label>Color</Label>
          <ColorFieldGroup>
            <ColorFieldPrefix>
              <ColorSwatch :color="value?.toString('hex') || '#E4E4E7'" size="xs" />
            </ColorFieldPrefix>
            <ColorFieldInput />
          </ColorFieldGroup>
          <Description>Select or enter a color</Description>
        </ColorField>
        <div class="flex gap-2">
          <ColorSwatch
            v-for="preset in presets"
            :key="preset"
            class="cursor-pointer"
            :color="preset"
            size="lg"
            @click="setValue(preset)"
          />
        </div>
      </div>
    `,
  }),
};

export const AllVariations: Story = {
  render: () => ({
    components,
    setup: () => {
      const color1 = shallowRef<Color | null>(parseColor("#0485F7"));
      const color2 = shallowRef<Color | null>(parseColor("#10B981"));
      const color3 = shallowRef<Color | null>(parseColor("#F43F5E"));

      return {
        color1,
        color2,
        color3,
        onChange1: (value: Color | null) => (color1.value = value),
        onChange2: (value: Color | null) => (color2.value = value),
        onChange3: (value: Color | null) => (color3.value = value),
      };
    },
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <ColorField
            is-required
            class="w-[280px]"
            name="color1"
            :value="color1"
            @change="onChange1"
          >
            <Label>With Prefix Icon</Label>
            <ColorFieldGroup>
              <ColorFieldPrefix>
                <ColorSwatch :color="color1?.toString('css')" size="xs" />
              </ColorFieldPrefix>
              <ColorFieldInput />
            </ColorFieldGroup>
            <Description>Enter a hex color</Description>
          </ColorField>

          <ColorField
            is-required
            class="w-[280px]"
            name="color2"
            :value="color2"
            @change="onChange2"
          >
            <Label>With Suffix</Label>
            <ColorFieldGroup>
              <ColorFieldInput />
              <ColorFieldSuffix>
                <ColorSwatch :color="color2?.toString('css')" size="xs" />
              </ColorFieldSuffix>
            </ColorFieldGroup>
            <Description>Enter a hex color</Description>
          </ColorField>

          <ColorField
            is-required
            class="w-[280px]"
            name="color3"
            :value="color3"
            @change="onChange3"
          >
            <Label>Secondary Variant</Label>
            <ColorFieldGroup variant="secondary">
              <ColorFieldPrefix>
                <ColorSwatch :color="color3?.toString('css')" size="xs" />
              </ColorFieldPrefix>
              <ColorFieldInput />
            </ColorFieldGroup>
            <Description>Enter a hex color</Description>
          </ColorField>
        </div>
      </div>
    `,
  }),
};
