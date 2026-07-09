import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { reactive, ref } from 'vue';
import IconVolume2 from '~icons/lucide/volume-2';
import Slider from './slider.vue';
import { sliderColors, sliderOrientations, sliderSizes } from './types';

const percentFormatter = (value: number) => `${value}%`;
const storyWrapperStyle = {
    boxSizing: 'border-box',
    width: 'min(360px, 100%)',
    padding: '40px 24px 28px',
};
const stackedStoryWrapperStyle = {
    ...storyWrapperStyle,
    display: 'grid',
    gap: '16px',
};
const verticalStoryWrapperStyle = {
    ...storyWrapperStyle,
    display: 'flex',
    alignItems: 'center',
    height: '280px',
    padding: '48px 80px 40px',
};

const meta = {
    title: 'Components/Slider',
    component: Slider as any,
    tags: ['autodocs'],
    argTypes: {
        color: {
            control: 'text',
        },
        size: {
            control: 'select',
            options: [undefined, ...sliderSizes],
        },
        orientation: {
            control: 'select',
            options: sliderOrientations,
        },
        min: { control: 'number' },
        max: { control: 'number' },
        step: { control: 'number' },
        marks: { control: 'object' },
        thumbStyle: { control: 'object' },
        tooltip: {
            control: 'object',
        },
        formatValue: { control: false },
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
    },
    args: {
        modelValue: 40,
        min: 0,
        max: 100,
        step: 1,
        marks: [],
        thumbStyle: undefined,
        tooltip: 'hover',
        formatValue: undefined,
        color: undefined,
        size: undefined,
        orientation: 'horizontal',
        disabled: false,
        required: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { Slider },
        setup() {
            const value = ref(args.modelValue ?? 0);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Slider v-bind="args" v-model="value" />
            </div>
        `,
    }),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Marks: Story = {
    args: {
        marks: [
            20,
            { value: 50, label: '50%', color: 'green' },
            { value: 80, label: '80%', color: 'var(--rp-color-red-filled)' },
            { value: 90, label: 'Hidden', hidden: true },
        ],
    },
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical',
        marks: [
            { value: 0, label: '0' },
            { value: 50, label: '50', color: 'green' },
            { value: 100, label: '100' },
        ],
        tooltip: 'always',
    },
    render: (args) => ({
        components: { Slider },
        setup() {
            const value = ref(args.modelValue ?? 0);
            return { args, value, verticalStoryWrapperStyle };
        },
        template: `
            <div :style="verticalStoryWrapperStyle">
                <Slider v-bind="args" v-model="value" />
            </div>
        `,
    }),
};

export const FormatValue: Story = {
    args: {
        formatValue: percentFormatter,
    },
    render: (args) => ({
        components: { Slider },
        setup() {
            const value = ref(args.modelValue ?? 0);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Slider v-bind="args" v-model="value" />
            </div>
        `,
    }),
};

export const CustomTooltip: Story = {
    args: {
        tooltip: {
            mode: 'always',
            placement: 'bottom',
            color: 'orange',
            offset: 12,
            arrow: true,
        },
    },
};

export const CustomThumb: Story = {
    args: {
        thumbStyle: {
            size: 28,
            border: '2px solid var(--rp-color-control-thumb-bg)',
            padding: 4,
        },
    },
    render: (args) => ({
        components: { IconVolume2, Slider },
        setup() {
            const value = ref(args.modelValue ?? 0);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Slider v-bind="args" v-model="value">
                    <template #thumb>
                        <IconVolume2 />
                    </template>
                </Slider>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Slider },
        setup() {
            const values = reactive(
                Object.fromEntries(sliderColors.map((color) => [color, 60])) as Record<
                    (typeof sliderColors)[number],
                    number
                >,
            );

            return { args, colors: sliderColors, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <Slider
                    v-for="color in colors"
                    :key="color"
                    v-bind="args"
                    v-model="values[color]"
                    :color="color"
                />
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Slider },
        setup() {
            const values = reactive(
                Object.fromEntries(sliderSizes.map((size) => [size, 60])) as Record<
                    (typeof sliderSizes)[number],
                    number
                >,
            );

            return { args, sizes: sliderSizes, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <Slider
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    v-model="values[size]"
                    :size="size"
                >
                    {{ size }}
                    <template #value="{ value }">{{ value }}</template>
                </Slider>
            </div>
        `,
    }),
};
