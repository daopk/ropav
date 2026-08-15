import type {Color, ColorChannel, ColorSpace} from "../../utils/color-types";
import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {computed, shallowRef} from "vue";

import {parseColor} from "../../utils/color";
import {ButtonRoot} from "../button";
import {ColorAreaRoot, ColorAreaThumb} from "../color-area";
import {ColorFieldRoot} from "../color-field";
import {
  ColorInputGroupInput,
  ColorInputGroupPrefix,
  ColorInputGroupRoot,
} from "../color-input-group";
import {
  ColorSliderOutput,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from "../color-slider";
import {ColorSwatchRoot} from "../color-swatch";
import {
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch,
} from "../color-swatch-picker";
import {LabelRoot} from "../label";
import {ListBoxRoot} from "../list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {SelectIndicator, SelectPopover, SelectRoot, SelectTrigger, SelectValue} from "../select";

import {ColorPickerPopover, ColorPickerRoot, ColorPickerTrigger} from "./index";

import IconShuffle from "~icons/gravity-ui/shuffle";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "ColorPicker.Trigger".
const components = {
  Button: ButtonRoot,
  ColorArea: ColorAreaRoot,
  ColorAreaThumb,
  ColorField: ColorFieldRoot,
  ColorFieldGroup: ColorInputGroupRoot,
  ColorFieldInput: ColorInputGroupInput,
  ColorFieldPrefix: ColorInputGroupPrefix,
  ColorPicker: ColorPickerRoot,
  ColorPickerPopover,
  ColorPickerTrigger,
  ColorSlider: ColorSliderRoot,
  ColorSliderOutput,
  ColorSliderThumb,
  ColorSliderTrack,
  ColorSwatch: ColorSwatchRoot,
  ColorSwatchPicker: ColorSwatchPickerRoot,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
  IconShuffle,
  Label: LabelRoot,
  ListBox: ListBoxRoot,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  Select: SelectRoot,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
};

const meta: StoryMeta = {
  component: ColorPickerRoot,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Components/Colors/ColorPicker",
};

export default meta;

type Story = StoryObj<typeof meta>;

const colorPresets = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
];

/** The saturation × brightness square every story opens with. */
const AREA = `
  <ColorArea
    aria-label="Color area"
    class="max-w-full"
    color-space="hsb"
    x-channel="saturation"
    y-channel="brightness"
  >
    <ColorAreaThumb />
  </ColorArea>
`;

const PRESETS = `
  <ColorSwatchPickerItem v-for="preset in colorPresets" :key="preset" :color="preset">
    <ColorSwatchPickerSwatch />
  </ColorSwatchPickerItem>
`;

const SPACE_OPTIONS = `
  <ListBoxItem v-for="space in spaces" :id="space" :key="space" :text-value="space">
    {{ space }}
    <ListBoxItemIndicator />
  </ListBoxItem>
`;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <ColorPicker default-value="#0485F7">
        <ColorPickerTrigger>
          <ColorSwatch size="lg" />
          <Label>Pick a color</Label>
        </ColorPickerTrigger>
        <ColorPickerPopover>
          ${AREA}
          <ColorSlider channel="hue" class="gap-1 px-1" color-space="hsb">
            <Label>Hue</Label>
            <ColorSliderOutput class="text-muted" />
            <ColorSliderTrack>
              <ColorSliderThumb />
            </ColorSliderTrack>
          </ColorSlider>
        </ColorPickerPopover>
      </ColorPicker>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color>(parseColor("#325578"));

      return {
        color,
        colorPresets,
        onChange: (next: Color) => (color.value = next),
        shuffleColor: () => {
          const hue = Math.floor(Math.random() * 360);
          const saturation = 50 + Math.floor(Math.random() * 50);
          const lightness = 40 + Math.floor(Math.random() * 30);

          color.value = parseColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        },
      };
    },
    template: `
      <div class="flex flex-col gap-4">
        <ColorPicker :value="color" @change="onChange">
          <ColorPickerTrigger>
            <ColorSwatch size="lg" />
            <Label>Pick a color</Label>
          </ColorPickerTrigger>
          <ColorPickerPopover class="gap-2">
            <ColorSwatchPicker class="justify-center pt-2" size="xs">${PRESETS}</ColorSwatchPicker>
            ${AREA}
            <div class="flex items-center gap-2 px-1">
              <ColorSlider aria-label="Hue slider" channel="hue" class="flex-1" color-space="hsb">
                <ColorSliderTrack>
                  <ColorSliderThumb />
                </ColorSliderTrack>
              </ColorSlider>
              <Button
                is-icon-only
                aria-label="Shuffle color"
                size="sm"
                variant="tertiary"
                @click="shuffleColor"
              >
                <IconShuffle class="size-4" />
              </Button>
            </div>
            <ColorField aria-label="Color field">
              <ColorFieldGroup variant="secondary">
                <ColorFieldPrefix>
                  <ColorSwatch size="xs" />
                </ColorFieldPrefix>
                <ColorFieldInput />
              </ColorFieldGroup>
            </ColorField>
          </ColorPickerPopover>
        </ColorPicker>
        <p class="w-60 text-sm text-muted">
          Selected: <span class="font-medium">{{ color.toString("hex") }}</span>
        </p>
      </div>
    `,
  }),
};

export const WithSwatches: Story = {
  render: () => ({
    components,
    setup: () => ({colorPresets}),
    template: `
      <ColorPicker default-value="#F43F5E">
        <ColorPickerTrigger>
          <ColorSwatch size="lg" />
          <Label>Brand Color</Label>
        </ColorPickerTrigger>
        <ColorPickerPopover>
          ${AREA}
          <ColorSlider aria-label="Hue slider" channel="hue" class="gap-1 px-1" color-space="hsb">
            <Label>Hue</Label>
            <ColorSliderOutput class="text-muted" />
            <ColorSliderTrack>
              <ColorSliderThumb />
            </ColorSliderTrack>
          </ColorSlider>
          <ColorSwatchPicker class="justify-center px-1" size="xs">${PRESETS}</ColorSwatchPicker>
        </ColorPickerPopover>
      </ColorPicker>
    `,
  }),
};

const CHANNELS_BY_SPACE: Record<ColorSpace, ColorChannel[]> = {
  hsb: ["hue", "saturation", "brightness"],
  hsl: ["hue", "saturation", "lightness"],
  rgb: ["red", "green", "blue"],
};

export const WidthFields: Story = {
  render: () => ({
    components,
    setup: () => {
      const colorSpace = shallowRef<ColorSpace>("hsl");

      return {
        channels: computed(() => CHANNELS_BY_SPACE[colorSpace.value]),
        colorSpace,
        spaces: Object.keys(CHANNELS_BY_SPACE),
      };
    },
    template: `
      <ColorPicker default-value="hsla(220, 90%, 50%, 0.8)">
        <ColorPickerTrigger>
          <ColorSwatch size="lg" />
          <Label>Pick a color</Label>
        </ColorPickerTrigger>
        <ColorPickerPopover class="max-w-62 gap-2">
          ${AREA}
          <ColorSlider channel="hue" class="gap-1 px-1" color-space="hsb">
            <Label>Hue</Label>
            <ColorSliderOutput class="text-muted" />
            <ColorSliderTrack>
              <ColorSliderThumb />
            </ColorSliderTrack>
          </ColorSlider>
          <Select
            v-model:value="colorSpace"
            aria-label="Color space"
            :items="spaces"
            variant="secondary"
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectPopover>
              <ListBox>${SPACE_OPTIONS}</ListBox>
            </SelectPopover>
          </Select>
          <div class="grid w-full grid-cols-3 items-center gap-2">
            <ColorField
              v-for="channel in channels"
              :key="channel"
              :aria-label="channel"
              :channel="channel"
              :color-space="colorSpace"
            >
              <ColorFieldGroup variant="secondary">
                <ColorFieldInput />
              </ColorFieldGroup>
            </ColorField>
          </div>
        </ColorPickerPopover>
      </ColorPicker>
    `,
  }),
};

const SLIDER_CHANNELS_BY_SPACE: Record<ColorSpace, ColorChannel[]> = {
  hsb: ["hue", "saturation", "brightness", "alpha"],
  hsl: ["hue", "saturation", "lightness", "alpha"],
  rgb: ["red", "green", "blue", "alpha"],
};

export const WithSliders: Story = {
  render: () => ({
    components,
    setup: () => {
      const colorSpace = shallowRef<ColorSpace>("hsl");

      return {
        channels: computed(() => SLIDER_CHANNELS_BY_SPACE[colorSpace.value]),
        colorSpace,
        spaces: Object.keys(SLIDER_CHANNELS_BY_SPACE),
      };
    },
    template: `
      <ColorPicker default-value="hsl(219, 58%, 93%)">
        <ColorPickerTrigger>
          <ColorSwatch size="lg" />
          <Label>Pick a color</Label>
        </ColorPickerTrigger>
        <ColorPickerPopover class="max-w-62 gap-2 px-2 py-3">
          <Select
            v-model:value="colorSpace"
            aria-label="Color space"
            :items="spaces"
            variant="secondary"
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectPopover>
              <ListBox>${SPACE_OPTIONS}</ListBox>
            </SelectPopover>
          </Select>
          <div class="flex flex-col gap-2">
            <ColorSlider
              v-for="channel in channels"
              :key="channel"
              :aria-label="channel"
              :channel="channel"
              class="gap-1 px-1"
              :color-space="colorSpace"
            >
              <Label>{{ channel }}</Label>
              <ColorSliderOutput class="text-muted" />
              <ColorSliderTrack>
                <ColorSliderThumb />
              </ColorSliderTrack>
            </ColorSlider>
          </div>
        </ColorPickerPopover>
      </ColorPicker>
    `,
  }),
};
