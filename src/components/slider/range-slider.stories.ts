import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import RangeSlider from './range-slider.vue';
import { sliderColors, sliderOrientations, sliderSizes } from './types';

const percentFormatter = (value: number) => `${value}%`;
const storyWrapperStyle = {
    boxSizing: 'border-box',
    width: 'min(420px, 100%)',
    padding: '48px 28px 32px',
};
const stackedStoryWrapperStyle = {
    ...storyWrapperStyle,
    display: 'grid',
    gap: '20px',
};
const verticalStoryWrapperStyle = {
    ...storyWrapperStyle,
    display: 'flex',
    alignItems: 'center',
    height: '320px',
    padding: '56px 96px 44px',
};

const meta = {
    title: 'Components/RangeSlider',
    component: RangeSlider as any,
    tags: ['autodocs'],
    argTypes: {
        color: { control: 'text' },
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
        minRange: { control: 'number' },
        marks: { control: 'object' },
        thumbStyle: { control: 'object' },
        tooltip: { control: 'object' },
        formatValue: { control: false },
        ariaValueText: { control: false },
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
    },
    args: {
        modelValue: [25, 75],
        min: 0,
        max: 100,
        step: 1,
        minRange: 0,
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
        components: { RangeSlider },
        setup() {
            const value = ref<[number, number]>([...(args.modelValue ?? [0, 100])]);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <RangeSlider v-bind="args" v-model="value">Selected range</RangeSlider>
            </div>
        `,
    }),
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const sliders = canvas.getAllByRole('slider') as HTMLInputElement[];

        expect(sliders).toHaveLength(2);
        await expect(sliders[0]).toHaveValue('25');
        await expect(sliders[1]).toHaveValue('75');

        sliders[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        sliders[0].stepUp();
        sliders[0].dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(() => expect(sliders[0]).toHaveValue('26'));
        await expect(sliders[1]).toHaveValue('75');

        sliders[1].focus();
        await userEvent.keyboard('{ArrowLeft}');
        sliders[1].stepDown();
        sliders[1].dispatchEvent(new Event('input', { bubbles: true }));
        await expect(sliders[0]).toHaveValue('26');
        await waitFor(() => expect(sliders[1]).toHaveValue('74'));
    },
};

export const TrackPointerInteraction: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const sliders = canvas.getAllByRole('slider');
        const track = canvasElement.querySelector<HTMLElement>('.rp-range-slider__track')!;
        const thumbs = canvasElement.querySelector<HTMLElement>('.rp-range-slider__thumbs')!;
        const rect = thumbs.getBoundingClientRect();
        const y = rect.top + rect.height / 2;
        const pointer = (type: 'pointerdown' | 'pointermove' | 'pointerup', ratio: number) =>
            new PointerEvent(type, {
                bubbles: true,
                button: 0,
                cancelable: true,
                clientX: rect.left + rect.width * ratio,
                clientY: y,
                isPrimary: true,
                pointerId: 1,
                pointerType: 'mouse',
            });

        track.dispatchEvent(pointer('pointerdown', 0.35));
        window.dispatchEvent(pointer('pointerup', 0.35));
        await waitFor(() => expect(sliders[0]).toHaveValue('35'));
        await expect(sliders[1]).toHaveValue('75');

        track.dispatchEvent(pointer('pointerdown', 0.35));
        window.dispatchEvent(pointer('pointermove', 0.45));
        window.dispatchEvent(pointer('pointerup', 0.45));
        await waitFor(() => expect(sliders[0]).toHaveValue('45'));
        await expect(sliders[1]).toHaveValue('75');
    },
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Marks: Story = {
    args: {
        modelValue: [20, 70],
        marks: [
            { value: 0, label: '0%' },
            { value: 20, label: '20%' },
            { value: 50, label: '50%', color: 'green' },
            { value: 70, label: '70%' },
            { value: 100, label: '100%' },
            { value: 90, label: 'Hidden', hidden: true },
        ],
    },
};

export const MinimumRange: Story = {
    tags: ['test'],
    args: {
        modelValue: [30, 55],
        minRange: 25,
        tooltip: 'always',
    },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('.rp-range-slider')!;
        const contents = [...canvasElement.querySelectorAll<HTMLElement>('.rp-tooltip__content')];

        await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );

        expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(false);
        expect(contents).toHaveLength(2);
        expect(
            Math.abs(
                contents[0].getBoundingClientRect().top - contents[1].getBoundingClientRect().top,
            ),
        ).toBeLessThan(1);
    },
};

export const CollapsedAlwaysTooltips: Story = {
    tags: ['test'],
    args: {
        modelValue: [50, 50],
        tooltip: 'always',
        formatValue: percentFormatter,
    },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('.rp-range-slider')!;
        const contents = [...canvasElement.querySelectorAll<HTMLElement>('.rp-tooltip__content')];

        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(true),
        );

        const [lowerRect, upperRect] = contents.map((content) => content.getBoundingClientRect());
        expect(lowerRect.bottom <= upperRect.top || upperRect.bottom <= lowerRect.top).toBe(true);
    },
};

export const BottomTooltipsWithLabeledMarks: Story = {
    args: {
        modelValue: [25, 75],
        marks: [
            { value: 0, label: 'Minimum' },
            { value: 25, label: 'Lower' },
            { value: 50, label: 'Middle', color: 'green' },
            { value: 75, label: 'Upper' },
            { value: 100, label: 'Maximum' },
        ],
        tooltip: {
            mode: 'always',
            placement: 'bottom',
            arrow: true,
        },
    },
};

export const Vertical: Story = {
    args: {
        modelValue: [20, 80],
        orientation: 'vertical',
        marks: [
            { value: 0, label: '0' },
            { value: 50, label: '50', color: 'green' },
            { value: 100, label: '100' },
        ],
        tooltip: 'always',
    },
    render: (args) => ({
        components: { RangeSlider },
        setup() {
            const value = ref<[number, number]>([...(args.modelValue ?? [0, 100])]);
            return { args, value, verticalStoryWrapperStyle };
        },
        template: `
            <div :style="verticalStoryWrapperStyle">
                <RangeSlider v-bind="args" v-model="value" />
            </div>
        `,
    }),
};

export const FormattedValue: Story = {
    args: {
        formatValue: percentFormatter,
        tooltip: 'always',
    },
    render: (args) => ({
        components: { RangeSlider },
        setup() {
            const value = ref<[number, number]>([...(args.modelValue ?? [0, 100])]);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <RangeSlider v-bind="args" v-model="value">
                    Discount
                    <template #value="{ formattedValue }">
                        {{ formattedValue[0] }}–{{ formattedValue[1] }}
                    </template>
                </RangeSlider>
            </div>
        `,
    }),
};

export const CustomTooltip: Story = {
    args: {
        tooltip: {
            id: 'price-range-tooltip',
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
            size: 30,
            border: '2px solid var(--rp-color-control-thumb-bg)',
            padding: 3,
        },
        tooltip: false,
    },
    render: (args) => ({
        components: { RangeSlider },
        setup() {
            const value = ref<[number, number]>([...(args.modelValue ?? [0, 100])]);
            return { args, storyWrapperStyle, value };
        },
        template: `
            <div :style="storyWrapperStyle">
                <RangeSlider v-bind="args" v-model="value">
                    <template #thumb="{ thumb, formattedValue }">
                        <span style="font-size: 10px; font-weight: 700; line-height: 1;">
                            {{ thumb === 'lower' ? 'L' : 'U' }}{{ formattedValue }}
                        </span>
                    </template>
                </RangeSlider>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { RangeSlider },
        setup() {
            const values = reactive(
                Object.fromEntries(sliderColors.map((color) => [color, [20, 80]])) as Record<
                    (typeof sliderColors)[number],
                    [number, number]
                >,
            );

            return { args, colors: sliderColors, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <RangeSlider
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
    args: { color: '#ff3366' },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { RangeSlider },
        setup() {
            const values = reactive(
                Object.fromEntries(sliderSizes.map((size) => [size, [20, 80]])) as Record<
                    (typeof sliderSizes)[number],
                    [number, number]
                >,
            );

            return { args, sizes: sliderSizes, stackedStoryWrapperStyle, values };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <RangeSlider
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    v-model="values[size]"
                    :size="size"
                >
                    {{ size }}
                    <template #value="{ value }">{{ value[0] }}–{{ value[1] }}</template>
                </RangeSlider>
            </div>
        `,
    }),
};
