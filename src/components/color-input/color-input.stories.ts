import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { computed, ref, watch } from 'vue';
import Field from '../field/field.vue';
import { popoverPlacements } from '../popover/types';
import Radio from '../radio/radio.vue';
import RadioGroup from '../radio/radio-group.vue';
import ColorInput from './color-input.vue';
import { formatColorPickerValue, parseColorPickerValue } from '../color-picker/color-picker-utils';
import {
    colorPickerFormats,
    type ColorPickerFormat,
    type ColorPickerValue,
} from '../color-picker/types';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const colorInputSwatches = [
    '#25262b',
    '#f8f9fa',
    '#fa5252',
    '#e64980',
    '#be4bdb',
    '#7950f2',
    '#4c6ef5',
    '#228be6',
    '#15aabf',
    '#12b886',
    '#40c057',
    '#82c91e',
    '#fab005',
    '#fd7e14',
];
const storyWrapperStyle = {
    display: 'inline-grid',
    gap: '8px',
};
const formatsStoryStyle = {
    display: 'inline-grid',
    gridTemplateColumns: '300px max-content',
    alignItems: 'start',
    gap: '24px',
};

function isColorPickerFormat(value: string): value is ColorPickerFormat {
    return colorPickerFormats.includes(value as ColorPickerFormat);
}

const meta = {
    title: 'Components/ColorInput',
    component: ColorInput as any,
    tags: ['autodocs'],
    argTypes: {
        format: { control: 'select', options: colorPickerFormats },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
        swatches: { control: 'object' },
        swatchesPerRow: { control: { type: 'number', min: 1, max: 15, step: 1 } },
        placement: { control: 'select', options: popoverPlacements },
    },
    args: {
        modelValue: '#4992d1',
        format: 'hex',
        radius: undefined,
        size: undefined,
        placeholder: '#000000',
        disabled: false,
        readonly: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { ColorInput },
        setup() {
            const value = ref(args.modelValue ?? '#4992d1');
            return { args, value };
        },
        template: '<ColorInput v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof ColorInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const input = canvasElement.querySelector<HTMLInputElement>('.rp-input__native')!;
        const inputControl = canvasElement.querySelector<HTMLElement>('.rp-input')!;
        const preview = canvasElement.querySelector<HTMLElement>('.rp-color-input__preview')!;
        const picker = canvasElement.querySelector<HTMLElement>('.rp-popover__content')!;
        const pickerSurface = canvasElement.querySelector<HTMLElement>(
            '.rp-color-picker__surface',
        )!;

        await userEvent.click(input);
        await waitFor(() => expect(picker).toBeVisible());

        const inputRect = inputControl.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        const pickerRect = picker.getBoundingClientRect();
        const pickerSurfaceRect = pickerSurface.getBoundingClientRect();

        expect(Math.abs(pickerRect.left - inputRect.left)).toBeLessThan(0.5);
        expect(Math.abs(pickerSurfaceRect.left - previewRect.left)).toBeLessThan(0.5);
    },
};

export const WithSwatches: Story = {
    args: {
        swatches: colorInputSwatches,
        swatchesPerRow: 7,
    },
};

export const WithOpacity: Story = {
    args: {
        modelValue: 'rgba(73, 146, 209, 0.55)',
        format: 'rgba',
    },
};

export const Invalid: Story = {
    args: { invalid: true },
};

export const Readonly: Story = {
    args: { readonly: true },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { ColorInput },
        setup() {
            return { args, sizes };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <ColorInput
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    :size="size"
                    :model-value="args.modelValue"
                />
            </div>
        `,
    }),
};

export const WithFormats: Story = {
    render: (args) => ({
        components: { ColorInput, Radio, RadioGroup },
        setup() {
            const value = ref<ColorPickerValue>(args.modelValue ?? '#4992d1');
            const format = ref<ColorPickerFormat>(args.format ?? 'hex');
            const currentValue = computed(() => value.value);

            watch(format, (nextFormat) => {
                const parsedColor = parseColorPickerValue(value.value);
                if (!parsedColor) return;

                value.value = formatColorPickerValue(parsedColor, nextFormat);
            });

            function updateFormat(nextValue: string | number | null) {
                if (typeof nextValue !== 'string' || !isColorPickerFormat(nextValue)) return;
                format.value = nextValue;
            }

            return {
                args,
                colorPickerFormats,
                currentValue,
                format,
                formatsStoryStyle,
                storyWrapperStyle,
                updateFormat,
                value,
            };
        },
        template: `
            <div :style="formatsStoryStyle">
                <div :style="storyWrapperStyle">
                    <ColorInput
                        v-bind="args"
                        :format="format"
                        v-model="value"
                    />
                    <span :title="currentValue">{{ currentValue }}</span>
                </div>
                <RadioGroup
                    aria-label="Color format"
                    size="sm"
                    :model-value="format"
                    @update:model-value="updateFormat"
                >
                    <Radio v-for="option in colorPickerFormats" :key="option" :value="option">
                        {{ option }}
                    </Radio>
                </RadioGroup>
            </div>
        `,
    }),
};

export const WithField: Story = {
    args: {
        swatches: colorInputSwatches,
        swatchesPerRow: 7,
    },
    render: (args) => ({
        components: { ColorInput, Field },
        setup() {
            const value = ref(args.modelValue ?? '#4992d1');
            return { args, value };
        },
        template: `
            <Field
                id="brand-color"
                label="Color"
                description="Choose a brand color."
                v-slot="{ controlProps }"
                style="max-width: 320px;"
            >
                <ColorInput v-bind="controlProps" v-bind="args" v-model="value" />
            </Field>
        `,
    }),
};
