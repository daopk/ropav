import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import IconVolume2 from '~icons/lucide/volume-2';
import Slider from './slider.vue';
import { sliderColors, sliderOrientations, sliderSizes, type SliderProps } from './types';

const percentFormatter = (value: number) => `${value}%`;
const timeFormatter = (value: number) => {
    const seconds = Math.max(0, Math.round(value));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
const bufferedRanges = [
    [0, 185],
    [210, 225],
] as const;
const chapterMarkers = [60, 120, 180];
const sliderHitSizes = {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
} as const;
const hitRegionDebugStyle = {
    background: 'color-mix(in srgb, var(--rp-color-blue-filled) 18%, transparent)',
    outline: '1px dashed var(--rp-color-blue-filled)',
    outlineOffset: '-1px',
};
const getTrackRangeStyle = (
    getPercent: (value: number) => number,
    range: readonly [number, number],
) => ({
    position: 'absolute' as const,
    insetBlock: 0,
    left: `${getPercent(range[0])}%`,
    width: `${getPercent(range[1]) - getPercent(range[0])}%`,
    background: 'color-mix(in srgb, var(--rp-color-control-selected-bg) 32%, transparent)',
    borderRadius: 'var(--rp-radius-full)',
});
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
        thumb: { control: 'object' },
        tooltip: {
            control: 'object',
        },
        formatValue: { control: false },
        disabled: { control: 'boolean' },
        ariaLabel: { control: 'text' },
        labelledby: { control: 'text' },
    },
    args: {
        modelValue: 40,
        min: 0,
        max: 100,
        step: 1,
        marks: [],
        thumb: 'always',
        tooltip: 'hover',
        formatValue: undefined,
        color: undefined,
        size: undefined,
        orientation: 'horizontal',
        disabled: false,
        ariaLabel: 'Volume',
        labelledby: undefined,
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
} satisfies Meta<SliderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
    },
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Marks: Story = {
    args: {
        marks: [
            20,
            { value: 50, label: '50%', color: 'green' },
            { value: 80, label: '80%', color: 'red' },
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
    play: async ({ canvasElement }) => {
        const input = canvasElement.querySelector<HTMLInputElement>('.rp-slider__native')!;
        const inputStyle = getComputedStyle(input);
        const nativeTrackStyle = getComputedStyle(input, '::-webkit-slider-runnable-track');

        expect(input.getBoundingClientRect().width).toBe(16);
        expect(nativeTrackStyle.width).toBe(inputStyle.width);
    },
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
    tags: ['test'],
    args: {
        tooltip: {
            mode: 'always',
            placement: 'bottom',
            color: 'orange',
            offset: 12,
            arrow: true,
        },
    },
    play: async ({ canvasElement }) => {
        const content = canvasElement.ownerDocument.querySelector<HTMLElement>(
            '.rp-slider__tooltip-content',
        )!;

        await waitFor(() => expect(content).toBeVisible());

        const contentStyle = getComputedStyle(content);

        expect(canvasElement.querySelector('.rp-slider__tooltip-content')).toBeNull();
        expect(contentStyle.minWidth).toBe('32px');
        expect(contentStyle.paddingTop).toBe('4px');
        expect(contentStyle.paddingRight).toBe('8px');
        expect(contentStyle.whiteSpace).toBe('nowrap');
        expect(contentStyle.fontVariantNumeric).toContain('tabular-nums');
    },
};

export const CustomThumb: Story = {
    args: {
        thumb: {
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

export const MediaSeek: Story = {
    tags: ['test'],
    args: {
        formatValue: timeFormatter,
        max: 240,
        min: 0,
        modelValue: 72,
        step: 1,
        thumb: 'interaction',
        tooltip: { anchor: 'pointer' },
    },
    render: (args) => ({
        components: { Slider },
        setup() {
            const currentTime = ref(args.modelValue ?? 0);
            return {
                args,
                bufferedRanges,
                chapterMarkers,
                currentTime,
                getTrackRangeStyle,
                storyWrapperStyle,
            };
        },
        template: `
            <div :style="storyWrapperStyle">
                <Slider
                    v-bind="args"
                    v-model="currentTime"
                    aria-label="Playback position"
                >
                    <template #track-underlay="{ getPercent }">
                        <span
                            v-for="range in bufferedRanges"
                            :key="range[0]"
                            class="media-buffered-range"
                            :style="getTrackRangeStyle(getPercent, range)"
                        />
                    </template>
                    <template #track-overlay="{ getPercent }">
                        <span
                            v-for="chapter in chapterMarkers"
                            :key="chapter"
                            class="media-chapter-marker"
                            :style="{
                                position: 'absolute',
                                top: '-2px',
                                bottom: '-2px',
                                left: getPercent(chapter) + '%',
                                width: '1px',
                                background: 'var(--rp-color-control-thumb-bg)',
                            }"
                        />
                    </template>
                    <template #tooltip-content="{ formattedValue }">
                        <strong>{{ formattedValue }}</strong>
                    </template>
                </Slider>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector<HTMLElement>('.rp-slider')!;
        const track = canvasElement.querySelector<HTMLElement>('.rp-slider__track')!;
        const input = canvasElement.querySelector<HTMLInputElement>('.rp-slider__native')!;
        const buffered = [...canvasElement.querySelectorAll<HTMLElement>('.media-buffered-range')];
        const chapters = canvasElement.querySelectorAll('.media-chapter-marker');
        const inputStyle = getComputedStyle(input);
        const nativeTrackStyle = getComputedStyle(input, '::-webkit-slider-runnable-track');
        const thumb = root.querySelector<HTMLElement>('.rp-slider__thumb-content')!;

        expect(root.dataset.thumbVisibility).toBe('interaction');
        expect(track.getBoundingClientRect().height).toBe(input.getBoundingClientRect().height);
        expect(input.getBoundingClientRect().height).toBe(16);
        expect(nativeTrackStyle.height).toBe(inputStyle.height);
        expect(buffered).toHaveLength(2);
        expect(Number.parseFloat(buffered[0].style.width)).toBeCloseTo((185 / 240) * 100);
        expect(buffered[1].style.left).toBe('87.5%');
        expect(chapters).toHaveLength(3);

        input.blur();
        track.dispatchEvent(new PointerEvent('pointerleave'));
        await waitFor(() => expect(root.hasAttribute('data-track-hovered')).toBe(false));
        expect(root.hasAttribute('data-dragging')).toBe(false);
        await waitFor(() => expect(getComputedStyle(thumb).opacity).toBe('0'));

        await userEvent.hover(track);
        await waitFor(() => expect(root.hasAttribute('data-track-hovered')).toBe(true));
        await waitFor(() => expect(getComputedStyle(thumb).opacity).toBe('1'));
        const trackRect = track.getBoundingClientRect();
        track.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                clientX: trackRect.right,
                clientY: trackRect.top + trackRect.height / 2,
            }),
        );
        const tooltipContent = canvasElement.ownerDocument.querySelector<HTMLElement>(
            '.rp-slider__tooltip-content',
        )!;
        await waitFor(() => expect(tooltipContent.textContent).toBe('4:00'));

        track.dispatchEvent(new PointerEvent('pointerleave'));
        await waitFor(() => expect(root.hasAttribute('data-track-hovered')).toBe(false));
        expect(tooltipContent.textContent).toBe('4:00');

        input.focus();
        expect(document.activeElement).toBe(input);
        await waitFor(() => expect(getComputedStyle(thumb).opacity).toBe('1'));
        input.blur();
        expect(document.activeElement).not.toBe(input);
        await waitFor(() => expect(getComputedStyle(thumb).opacity).toBe('0'));
    },
};

export const HiddenThumb: Story = {
    tags: ['test'],
    args: {
        modelValue: 100,
        thumb: false,
        tooltip: false,
    },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector<HTMLElement>('.rp-slider')!;
        const input = canvasElement.querySelector<HTMLInputElement>('.rp-slider__native')!;
        const thumb = canvasElement.querySelector<HTMLElement>('.rp-slider__thumb-content')!;
        const fillPosition = getComputedStyle(root).getPropertyValue('--_rp-slider-fill-position');

        expect(root.dataset.thumbVisibility).toBe('hidden');
        expect(fillPosition.replaceAll(' ', '')).toBe('calc(100%*1)');
        expect(getComputedStyle(thumb).opacity).toBe('0');

        input.focus();
        expect(document.activeElement).toBe(input);
        expect(getComputedStyle(input).boxShadow).not.toBe('none');
        expect(getComputedStyle(thumb).opacity).toBe('0');
    },
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
                    :aria-label="color + ' slider'"
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
                    :aria-label="size + ' slider'"
                >
                    {{ size }}
                    <template #value="{ value }">{{ value }}</template>
                </Slider>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('.rp-slider__native')];

        expect(inputs.map((input) => input.getBoundingClientRect().height)).toEqual([
            8, 12, 16, 20, 24,
        ]);
    },
};

export const HitRegions: Story = {
    args: {
        thumb: 'interaction',
    },
    render: (args) => ({
        components: { Slider },
        setup() {
            const values = reactive(
                Object.fromEntries(sliderSizes.map((size) => [size, 60])) as Record<
                    (typeof sliderSizes)[number],
                    number
                >,
            );

            return {
                args,
                hitRegionDebugStyle,
                hitSizes: sliderHitSizes,
                sizes: sliderSizes,
                stackedStoryWrapperStyle,
                values,
            };
        },
        template: `
            <div :style="stackedStoryWrapperStyle">
                <Slider
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    v-model="values[size]"
                    :size="size"
                    :aria-label="size + ' hit region slider'"
                    :styles="{ track: hitRegionDebugStyle }"
                >
                    {{ size }} · {{ hitSizes[size] }}px hit region
                </Slider>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const labels = [...canvasElement.querySelectorAll<HTMLElement>('.rp-slider__label')];
        const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('.rp-slider__native')];

        expect(labels.every((label) => getComputedStyle(label).cursor !== 'pointer')).toBe(true);
        expect(inputs.every((input) => getComputedStyle(input).cursor === 'pointer')).toBe(true);
    },
};
