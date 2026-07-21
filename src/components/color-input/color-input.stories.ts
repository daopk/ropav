import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { computed, reactive, ref, watch } from 'vue';
import IconPipette from '~icons/lucide/pipette';
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
type ColorInputSize = (typeof sizes)[number];
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
        validateColor: { control: 'boolean' },
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
        disallowInput: { control: 'boolean' },
        swatchesOnly: { control: 'boolean' },
        withEyeDropper: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
        swatches: { control: 'object' },
        swatchesPerRow: { control: { type: 'number', min: 1, max: 15, step: 1 } },
        placement: { control: 'select', options: popoverPlacements },
    },
    args: {
        modelValue: '#4992d1',
        ariaLabel: 'Color',
        format: 'hex',
        radius: undefined,
        size: undefined,
        placeholder: '#000000',
        disabled: false,
        readonly: false,
        disallowInput: false,
        swatchesOnly: false,
        withEyeDropper: true,
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
        const storyDocument = canvasElement.ownerDocument;
        const input = canvasElement.querySelector<HTMLInputElement>('.rp-input__native')!;
        const inputControl = canvasElement.querySelector<HTMLElement>('.rp-input')!;
        const preview = canvasElement.querySelector<HTMLElement>('.rp-color-input__preview')!;
        const pickerId = input.getAttribute('aria-controls')!;

        await userEvent.click(input);
        await waitFor(() => expect(storyDocument.getElementById(pickerId)).toBeVisible());
        const picker = storyDocument.getElementById(pickerId)!;
        const pickerSurface = picker.querySelector<HTMLElement>('.rp-color-picker__surface')!;

        const inputRect = inputControl.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        const pickerRect = picker.getBoundingClientRect();
        const pickerSurfaceRect = pickerSurface.getBoundingClientRect();

        expect(picker).toHaveClass('rp-color-input__popover');
        expect(Number.parseFloat(getComputedStyle(picker).paddingLeft)).toBeLessThan(16);
        expect(pickerRect.left).toBeGreaterThanOrEqual(8);
        expect(Math.abs(pickerRect.left - inputRect.left)).toBeLessThanOrEqual(16);
        expect(Math.abs(pickerSurfaceRect.left - previewRect.left)).toBeLessThanOrEqual(16);
    },
};

export const CustomEyeDropperIcon: Story = {
    render: (args) => ({
        components: { ColorInput, IconPipette },
        setup() {
            const value = ref(args.modelValue ?? '#4992d1');
            return { args, value };
        },
        template: `
            <ColorInput v-bind="args" v-model="value">
                <template #eye-dropper-icon>
                    <IconPipette />
                </template>
            </ColorInput>
        `,
    }),
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

export const DisallowInput: Story = {
    args: { disallowInput: true },
};

export const SwatchesOnly: Story = {
    args: {
        swatchesOnly: true,
        swatches: colorInputSwatches,
        swatchesPerRow: 7,
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { ColorInput },
        setup() {
            const values = reactive<Record<ColorInputSize, ColorPickerValue>>(
                Object.fromEntries(
                    sizes.map((size) => [size, args.modelValue ?? '#4992d1']),
                ) as Record<ColorInputSize, ColorPickerValue>,
            );
            const inputArgs = computed(() => {
                const { modelValue: _modelValue, size: _size, ...rest } = args;
                return rest;
            });

            return { inputArgs, sizes, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <ColorInput
                    v-for="size in sizes"
                    :key="size"
                    v-bind="inputArgs"
                    v-model="values[size]"
                    :size="size"
                />
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('.rp-input__native')];

        expect(inputs).toHaveLength(sizes.length);

        await userEvent.clear(inputs[0]);
        await userEvent.type(inputs[0], '#ff0000');

        await expect(inputs[0]).toHaveValue('#ff0000');
        await expect(inputs[1]).toHaveValue('#4992d1');
    },
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
                <ColorInput v-bind="{ ...args, ...controlProps }" v-model="value" />
            </Field>
        `,
    }),
};
