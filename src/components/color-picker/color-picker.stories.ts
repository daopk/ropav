import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, ref, watch } from 'vue';
import Field from '../field/field.vue';
import Radio from '../radio/radio.vue';
import RadioGroup from '../radio/radio-group.vue';
import ColorPicker from './color-picker.vue';
import { formatColorPickerValue, parseColorPickerValue } from './color-picker-utils';
import {
    colorPickerFormats,
    type ColorPickerFormat,
    type ColorPickerProps,
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

function useColorPickerStoryValue(args: Partial<Pick<ColorPickerProps, 'hue' | 'modelValue'>>) {
    const value = ref<ColorPickerValue>(args.modelValue ?? '#4992d1');
    const hue = ref(args.hue ?? 210);
    const currentValue = computed(() =>
        typeof value.value === 'string' ? value.value : JSON.stringify(value.value),
    );

    return { currentValue, hue, value };
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
        hue: { control: { type: 'range', min: 0, max: 359, step: 1 } },
        readonly: { control: 'boolean' },
    },
    args: {
        modelValue: '#4992d1',
        format: 'hex',
        hue: 210,
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
                <ColorPicker v-bind="args" v-model="value" v-model:hue="hue" />
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

export const WithFormats: Story = {
    render: (args) => ({
        components: { ColorPicker, Radio, RadioGroup },
        setup() {
            const value = ref<ColorPickerValue>(args.modelValue ?? '#4992d1');
            const hue = ref(args.hue ?? 210);
            const format = ref<ColorPickerFormat>(args.format ?? 'hex');
            const currentValue = computed(() =>
                typeof value.value === 'string' ? value.value : JSON.stringify(value.value),
            );

            watch(format, (nextFormat) => {
                if (typeof value.value !== 'string') return;

                const parsedColor = parseColorPickerValue(value.value);
                if (!parsedColor) return;

                value.value = formatColorPickerValue(parsedColor, nextFormat);
                hue.value = parsedColor.hue;
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
                hue,
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
                        v-model:hue="hue"
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
                    description="Choose a color for the current hue."
                    v-slot="{ controlProps }"
                    style="max-width: 260px;"
                >
                    <ColorPicker v-bind="controlProps" v-bind="args" v-model="value" v-model:hue="hue" />
                </Field>
                <span :title="currentValue">{{ currentValue }}</span>
            </div>
        `,
    }),
};
