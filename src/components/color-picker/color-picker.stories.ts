import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { computed, reactive, ref, watch } from 'vue';
import Field from '../field/field.vue';
import Radio from '../radio/radio.vue';
import RadioGroup from '../radio/radio-group.vue';
import ColorPicker from './color-picker.vue';
import { formatColorPickerValue, parseColorPickerValue } from './color-picker-utils';
import {
    colorPickerFormats,
    colorPickerSizes,
    type ColorPickerFormat,
    type ColorPickerProps,
    type ColorPickerSize,
    type ColorPickerValue,
} from './types';

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
const formatsPickerCellStyle = {
    display: 'inline-grid',
    width: '300px',
    gap: '8px',
};
const sizesStoryStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '24px',
};
const colorPickerSwatches = [
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

function useColorPickerStoryValue(args: Partial<Pick<ColorPickerProps, 'modelValue'>>) {
    const value = ref<ColorPickerValue>(args.modelValue ?? '#4992d1');
    const currentValue = computed(() => value.value);

    return { currentValue, value };
}

function isColorPickerFormat(value: string): value is ColorPickerFormat {
    return colorPickerFormats.includes(value as ColorPickerFormat);
}

const meta = {
    title: 'Components/ColorPicker',
    component: ColorPicker as any,
    tags: ['autodocs'],
    argTypes: {
        format: { control: 'select', options: colorPickerFormats },
        size: { control: 'select', options: [undefined, ...colorPickerSizes] },
        readonly: { control: 'boolean' },
        swatches: { control: 'object' },
        swatchesPerRow: { control: { type: 'number', min: 1, max: 15, step: 1 } },
    },
    args: {
        modelValue: '#4992d1',
        format: 'hex',
        size: undefined,
        readonly: false,
    },
    render: (args) => ({
        components: { ColorPicker },
        setup() {
            const storyValue = useColorPickerStoryValue(args);
            return { args, storyWrapperStyle, ...storyValue };
        },
        template: `
            <div :style="storyWrapperStyle">
                <ColorPicker v-bind="args" v-model="value" />
                <span :title="currentValue">{{ currentValue }}</span>
            </div>
        `,
    }),
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Readonly: Story = {
    args: { readonly: true },
};

export const WithOpacity: Story = {
    args: {
        modelValue: 'rgba(73, 146, 209, 0.55)',
        format: 'rgba',
    },
};

export const WithSwatches: Story = {
    args: {
        swatches: colorPickerSwatches,
        swatchesPerRow: 7,
    },
};

export const Sizes: Story = {
    tags: ['test'],
    args: {
        format: 'rgba',
        modelValue: 'rgba(73, 146, 209, 0.55)',
        swatches: colorPickerSwatches,
        swatchesPerRow: 7,
    },
    render: (args) => ({
        components: { ColorPicker },
        setup() {
            const values = reactive<Record<ColorPickerSize, ColorPickerValue>>(
                Object.fromEntries(
                    colorPickerSizes.map((size) => [size, args.modelValue]),
                ) as Record<ColorPickerSize, ColorPickerValue>,
            );
            const pickerArgs = computed(() => {
                const { modelValue: _modelValue, size: _size, ...rest } = args;
                return rest;
            });

            return { colorPickerSizes, pickerArgs, sizesStoryStyle, values };
        },
        template: `
            <div :style="sizesStoryStyle">
                <ColorPicker
                    v-for="size in colorPickerSizes"
                    :key="size"
                    v-bind="pickerArgs"
                    v-model="values[size]"
                    :size="size"
                >
                    {{ size }}
                </ColorPicker>
            </div>
        `,
    }),
    play: ({ canvasElement }) => {
        const pickers = [...canvasElement.querySelectorAll<HTMLElement>('.rp-color-picker')];

        expect(pickers).toHaveLength(colorPickerSizes.length);

        for (const picker of pickers) {
            const grid = picker.querySelector<HTMLElement>('.rp-color-picker__swatches')!;
            const swatches = [...grid.querySelectorAll<HTMLElement>('.rp-color-picker__swatch')];
            const gridRect = grid.getBoundingClientRect();
            const pickerRect = picker.getBoundingClientRect();
            const firstRect = swatches[0].getBoundingClientRect();
            const seventhRect = swatches[6].getBoundingClientRect();
            const eighthRect = swatches[7].getBoundingClientRect();
            const lastRect = swatches[13].getBoundingClientRect();

            expect(grid).toHaveAttribute('data-fill', 'true');
            expect(swatches).toHaveLength(colorPickerSwatches.length);
            expect(Math.abs(gridRect.width - pickerRect.width)).toBeLessThan(0.5);
            expect(Math.abs(firstRect.left - gridRect.left)).toBeLessThan(0.5);
            expect(Math.abs(seventhRect.right - gridRect.right)).toBeLessThan(0.5);
            expect(Math.abs(seventhRect.top - firstRect.top)).toBeLessThan(0.5);
            expect(Math.abs(eighthRect.left - gridRect.left)).toBeLessThan(0.5);
            expect(eighthRect.top).toBeGreaterThan(firstRect.top);
            expect(Math.abs(lastRect.right - gridRect.right)).toBeLessThan(0.5);
        }
    },
};

export const WithFormats: Story = {
    render: (args) => ({
        components: { ColorPicker, Radio, RadioGroup },
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
                formatsPickerCellStyle,
                formatsStoryStyle,
                storyWrapperStyle,
                updateFormat,
                value,
            };
        },
        template: `
            <div :style="formatsStoryStyle">
                <div :style="formatsPickerCellStyle">
                    <ColorPicker
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
    render: (args) => ({
        components: { ColorPicker, Field },
        setup() {
            const storyValue = useColorPickerStoryValue(args);
            return { args, storyWrapperStyle, ...storyValue };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Field
                    id="brand-color"
                    label="Color"
                    description="Choose a color."
                    v-slot="{ controlProps }"
                    style="max-width: 260px;"
                >
                    <ColorPicker v-bind="controlProps" v-bind="args" v-model="value" />
                </Field>
                <span :title="currentValue">{{ currentValue }}</span>
            </div>
        `,
    }),
};
