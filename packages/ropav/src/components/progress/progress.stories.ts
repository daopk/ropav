import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import Progress from './progress.vue';
import { progressColors, progressRadiuses, progressSizes } from './types';

const percentFormatter = (_value: number, percent: number) => `${Math.round(percent)}%`;
const storyWrapperStyle = {
    boxSizing: 'border-box',
    width: 'min(420px, 100%)',
    padding: '24px',
};
const stackedStoryWrapperStyle = {
    ...storyWrapperStyle,
    display: 'grid',
    gap: '16px',
};

const meta = {
    title: 'Components/Progress',
    component: Progress as any,
    tags: ['autodocs'],
    argTypes: {
        value: { control: 'number' },
        min: { control: 'number' },
        max: { control: 'number' },
        color: {
            control: 'text',
        },
        size: {
            control: 'select',
            options: [undefined, ...progressSizes],
        },
        radius: {
            control: 'select',
            options: progressRadiuses,
        },
        indeterminate: { control: 'boolean' },
        showValue: { control: 'boolean' },
        ariaLabel: { control: 'text' },
        formatValue: { control: false },
    },
    args: {
        value: 40,
        min: 0,
        max: 100,
        color: undefined,
        size: undefined,
        radius: 'full',
        indeterminate: false,
        showValue: false,
        ariaLabel: 'Upload progress',
        formatValue: undefined,
    },
    render: (args) => ({
        components: { Progress },
        setup() {
            return { args, storyWrapperStyle };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Progress v-bind="args" />
            </div>
        `,
    }),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
    tags: ['test'],
    args: {
        ariaLabel: undefined,
        showValue: true,
        formatValue: percentFormatter,
    },
    render: (args) => ({
        components: { Progress },
        setup() {
            const value = ref(args.value ?? 0);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Progress v-bind="args" :value="value">Uploading</Progress>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('progressbar', { name: 'Uploading' })).toBeInTheDocument();
    },
};

export const Indeterminate: Story = {
    args: {
        indeterminate: true,
    },
};

export const Colors: Story = {
    args: {
        ariaLabel: undefined,
    },
    render: (args) => ({
        components: { Progress },
        setup() {
            const values = reactive(
                Object.fromEntries(
                    progressColors.map((color, index) => [color, 20 + index * 10]),
                ) as Record<(typeof progressColors)[number], number>,
            );

            return { args, colors: progressColors, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <Progress
                    v-for="color in colors"
                    :key="color"
                    v-bind="args"
                    :value="values[color]"
                    :color="color"
                    show-value
                >
                    {{ color }}
                </Progress>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
        value: 64,
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Progress },
        setup() {
            const values = reactive(
                Object.fromEntries(
                    progressSizes.map((size, index) => [size, 20 + index * 15]),
                ) as Record<(typeof progressSizes)[number], number>,
            );

            return { args, sizes: progressSizes, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <Progress
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    :value="values[size]"
                    :size="size"
                    :aria-label="size + ' progress'"
                />
            </div>
        `,
    }),
};

export const Radius: Story = {
    render: (args) => ({
        components: { Progress },
        setup() {
            const values = reactive(
                Object.fromEntries(
                    progressRadiuses.map((radius, index) => [radius, 18 + index * 12]),
                ) as Record<(typeof progressRadiuses)[number], number>,
            );

            return { args, radiuses: progressRadiuses, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <Progress
                    v-for="radius in radiuses"
                    :key="radius"
                    v-bind="args"
                    :value="values[radius]"
                    :radius="radius"
                    :aria-label="radius + ' radius progress'"
                />
            </div>
        `,
    }),
};
