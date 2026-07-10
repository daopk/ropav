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

function getVisibleTooltipContents(canvasElement: HTMLElement) {
    const view = canvasElement.ownerDocument.defaultView!;

    return [...canvasElement.querySelectorAll<HTMLElement>('.rp-tooltip__content')].filter(
        (content) => {
            const tooltip = content.closest<HTMLElement>('.rp-range-slider__tooltip');
            const contentStyle = view.getComputedStyle(content);
            const tooltipStyle = tooltip ? view.getComputedStyle(tooltip) : contentStyle;

            return (
                contentStyle.display !== 'none' &&
                tooltipStyle.visibility !== 'hidden' &&
                Number.parseFloat(tooltipStyle.opacity) > 0
            );
        },
    );
}

function waitForAnimation(element: HTMLElement) {
    return new Promise<Animation>((resolve, reject) => {
        const view = element.ownerDocument.defaultView!;
        let frameId = 0;
        const timeoutId = view.setTimeout(() => {
            view.cancelAnimationFrame(frameId);
            reject(new Error('Expected tooltip animation to start'));
        }, 1000);

        function check() {
            const animation = element
                .getAnimations()
                .find(({ pending, playState }) => pending || playState === 'running');
            if (animation) {
                view.clearTimeout(timeoutId);
                view.cancelAnimationFrame(frameId);
                resolve(animation);
                return;
            }

            frameId = view.requestAnimationFrame(check);
        }

        check();
    });
}

function expectPositionAnimation(animation: Animation) {
    const effect = animation.effect as KeyframeEffect;
    const keyframes = effect.getKeyframes();
    const duration = Number(effect.getComputedTiming().duration);

    expect(duration).toBeGreaterThan(0);
    expect(keyframes.length).toBeGreaterThanOrEqual(2);
    expect(keyframes[0].transform).not.toBe(keyframes[keyframes.length - 1].transform);
    expect(keyframes.every(({ opacity }) => opacity == null)).toBe(true);

    return duration;
}

function getElementCenter(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

function getHorizontalCenter(element: HTMLElement) {
    return getElementCenter(element).x;
}

function setAnimationProgress(animation: Animation, duration: number, progress: number) {
    animation.pause();
    animation.currentTime = duration * progress;
}

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
        tooltip: {
            control: 'select',
            options: [false, 'hover', 'always'],
        },
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
        const sliders = canvas.getAllByRole('slider') as HTMLInputElement[];
        const root = canvasElement.querySelector<HTMLElement>('.rp-range-slider')!;
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

        track.dispatchEvent(pointer('pointerdown', 0.45));
        window.dispatchEvent(pointer('pointermove', 0.85));
        await waitFor(() => expect(sliders[0]).toHaveValue('75'));
        await expect(sliders[1]).toHaveValue('85');
        await expect(root).toHaveAttribute('data-active-thumb', 'upper');
        await expect(sliders[1]).toHaveFocus();

        window.dispatchEvent(pointer('pointermove', 0.9));
        await waitFor(() => expect(sliders[1]).toHaveValue('90'));

        window.dispatchEvent(pointer('pointermove', 0.65));
        await waitFor(() => expect(sliders[0]).toHaveValue('65'));
        await expect(sliders[1]).toHaveValue('75');
        await expect(root).toHaveAttribute('data-active-thumb', 'lower');
        await expect(sliders[0]).toHaveFocus();
        window.dispatchEvent(pointer('pointerup', 0.65));
    },
};

export const KeyboardCrossover: Story = {
    tags: ['test'],
    args: {
        modelValue: [20, 80],
        max: 95,
        step: 10,
        tooltip: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const sliders = canvas.getAllByRole('slider') as HTMLInputElement[];
        const root = canvasElement.querySelector<HTMLElement>('.rp-range-slider')!;

        await expect(sliders[0]).toHaveAttribute('min', '0');
        await expect(sliders[0]).toHaveAttribute('max', '95');
        await expect(sliders[1]).toHaveAttribute('min', '0');
        await expect(sliders[1]).toHaveAttribute('max', '95');
        await expect(sliders[0]).toHaveAttribute('step', 'any');

        sliders[0].focus();
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(sliders[0]).toHaveValue('80'));
        await expect(sliders[1]).toHaveValue('95');
        await expect(root).toHaveAttribute('data-active-thumb', 'upper');
        await expect(sliders[1]).toHaveFocus();

        await userEvent.keyboard('{Home}');
        await waitFor(() => expect(sliders[0]).toHaveValue('0'));
        await expect(sliders[1]).toHaveValue('80');
        await expect(root).toHaveAttribute('data-active-thumb', 'lower');
        await expect(sliders[0]).toHaveFocus();
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
        const endpointTooltips = [
            ...canvasElement.querySelectorAll<HTMLElement>(
                '.rp-range-slider__tooltip--lower, .rp-range-slider__tooltip--upper',
            ),
        ];
        const endpointContents = endpointTooltips.map(
            (tooltip) => tooltip.querySelector<HTMLElement>('.rp-tooltip__content')!,
        );

        await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );

        expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(false);
        expect(endpointTooltips).toHaveLength(2);
        expect(
            endpointTooltips.every((tooltip) => tooltip.classList.contains('rp-tooltip--open')),
        ).toBe(true);
        expect(getVisibleTooltipContents(canvasElement)).toEqual(endpointContents);
        expect(
            Math.abs(
                endpointContents[0].getBoundingClientRect().top -
                    endpointContents[1].getBoundingClientRect().top,
            ),
        ).toBeLessThan(1);
    },
};

export const MergedAlwaysTooltip: Story = {
    tags: ['test'],
    args: {
        modelValue: [4, 5],
        min: 0,
        max: 10,
        step: 0.1,
        tooltip: 'always',
    },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector<HTMLElement>('.rp-range-slider')!;
        const upperInput = canvasElement.querySelector<HTMLInputElement>(
            '.rp-range-slider__native--upper',
        )!;
        const endpointTooltips = [
            ...canvasElement.querySelectorAll<HTMLElement>(
                '.rp-range-slider__tooltip--lower, .rp-range-slider__tooltip--upper',
            ),
        ];
        const endpointContents = endpointTooltips.map(
            (tooltip) => tooltip.querySelector<HTMLElement>('.rp-tooltip__content')!,
        );
        const mergedTooltip = canvasElement.querySelector<HTMLElement>(
            '.rp-range-slider__tooltip--merged',
        )!;
        const mergedContent = mergedTooltip.querySelector<HTMLElement>('.rp-tooltip__content')!;
        const shouldAnimate =
            typeof mergedTooltip.animate === 'function' &&
            !canvasElement.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
                .matches;

        await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(false);
        expect(endpointTooltips).toHaveLength(2);
        expect(mergedTooltip.isConnected).toBe(true);
        expect(mergedContent.textContent).toBe('4–5');

        const separatedContents = getVisibleTooltipContents(canvasElement);
        expect(separatedContents.map((content) => content.textContent)).toEqual(['4', '5']);
        expect(
            separatedContents.every((content) => content.getBoundingClientRect().width < 32),
        ).toBe(true);

        const carrierCenterBeforeMerge = getHorizontalCenter(endpointContents[0]);
        const mergeAnimationStarted = shouldAnimate ? waitForAnimation(mergedTooltip) : undefined;
        upperInput.value = '4.5';
        upperInput.dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(true),
        );
        if (mergeAnimationStarted) {
            const animation = await mergeAnimationStarted;
            const duration = expectPositionAnimation(animation);

            setAnimationProgress(animation, duration, 0);
            const startCenter = getHorizontalCenter(mergedContent);
            setAnimationProgress(animation, duration, 0.5);
            const middleCenter = getHorizontalCenter(mergedContent);
            setAnimationProgress(animation, duration, 0.999);
            const endCenter = getHorizontalCenter(mergedContent);

            expect(Math.abs(startCenter - carrierCenterBeforeMerge)).toBeLessThan(0.5);
            expect(middleCenter).toBeGreaterThan(Math.min(startCenter, endCenter));
            expect(middleCenter).toBeLessThan(Math.max(startCenter, endCenter));
            expect(getComputedStyle(mergedTooltip).opacity).toBe('1');
            expect(endpointTooltips.map((tooltip) => getComputedStyle(tooltip).opacity)).toEqual([
                '0',
                '0',
            ]);
            animation.finish();
        }

        await waitFor(() => {
            expect(
                canvasElement.querySelector<HTMLElement>('.rp-range-slider__tooltip--merged'),
            ).toBe(mergedTooltip);
            expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);
            expect(mergedContent.textContent).toBe('4–4.5');
            expect(endpointTooltips.map((tooltip) => getComputedStyle(tooltip).opacity)).toEqual([
                '0',
                '0',
            ]);
            expect(getComputedStyle(mergedTooltip).opacity).toBe('1');
            expect(getVisibleTooltipContents(canvasElement)).toEqual([mergedContent]);
        });

        const thumbCenters = [
            ...canvasElement.querySelectorAll<HTMLElement>('.rp-range-slider__thumb-content'),
        ].map((thumb) => {
            const rect = thumb.getBoundingClientRect();
            return rect.left + rect.width / 2;
        });
        const mergedAnchor = canvasElement.querySelector<HTMLElement>(
            '.rp-range-slider__tooltip--merged .rp-range-slider__tooltip-anchor',
        )!;
        const mergedAnchorRect = mergedAnchor.getBoundingClientRect();
        const mergedCenter = mergedAnchorRect.left + mergedAnchorRect.width / 2;

        expect(Math.abs(mergedCenter - (thumbCenters[0] + thumbCenters[1]) / 2)).toBeLessThan(0.5);

        const carrierCenterAfterSplit = getHorizontalCenter(endpointContents[0]);
        const splitAnimationStarted = shouldAnimate ? waitForAnimation(mergedTooltip) : undefined;
        upperInput.value = '5';
        upperInput.dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(false),
        );
        if (splitAnimationStarted) {
            const animation = await splitAnimationStarted;
            const duration = expectPositionAnimation(animation);

            setAnimationProgress(animation, duration, 0);
            const splitThumbCenters = [
                ...canvasElement.querySelectorAll<HTMLElement>('.rp-range-slider__thumb-content'),
            ].map(getHorizontalCenter);
            expect(
                Math.abs(
                    getHorizontalCenter(mergedContent) -
                        (splitThumbCenters[0] + splitThumbCenters[1]) / 2,
                ),
            ).toBeLessThan(0.5);
            setAnimationProgress(animation, duration, 0.35);
            const centerWhileSplitting = getHorizontalCenter(mergedContent);
            expect(getComputedStyle(mergedTooltip).opacity).toBe('1');
            expect(endpointTooltips.map((tooltip) => getComputedStyle(tooltip).opacity)).toEqual([
                '0',
                '0',
            ]);

            upperInput.value = '8';
            upperInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            expect(
                Math.abs(getHorizontalCenter(mergedContent) - centerWhileSplitting),
            ).toBeLessThan(0.5);

            setAnimationProgress(animation, duration, 0.999);
            expect(
                Math.abs(getHorizontalCenter(mergedContent) - carrierCenterAfterSplit),
            ).toBeLessThan(0.5);
            animation.finish();
        }
        await waitFor(() => {
            expect(
                canvasElement.querySelector<HTMLElement>('.rp-range-slider__tooltip--merged'),
            ).toBe(mergedTooltip);
            expect(endpointTooltips.map((tooltip) => getComputedStyle(tooltip).opacity)).toEqual([
                '1',
                '1',
            ]);
            expect(getComputedStyle(mergedTooltip).opacity).toBe('0');
            expect(getVisibleTooltipContents(canvasElement)).toEqual(endpointContents);
            expect(mergedTooltip.style.left).toBe('');
            expect(mergedTooltip.style.top).toBe('');
            expect(mergedContent.style.width).toBe('');
            expect(mergedContent.style.height).toBe('');
            expect(
                [...endpointTooltips, mergedTooltip].every(({ style }) => style.opacity === ''),
            ).toBe(true);
        });

        upperInput.value = '4.5';
        upperInput.dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(true),
        );
        await waitFor(() => {
            expect(
                canvasElement.querySelector<HTMLElement>('.rp-range-slider__tooltip--merged'),
            ).toBe(mergedTooltip);
            expect(getComputedStyle(mergedTooltip).opacity).toBe('1');
            expect(getVisibleTooltipContents(canvasElement)).toEqual([mergedContent]);
        });
    },
};

export const MergedHoverTooltip: Story = {
    tags: ['test'],
    args: {
        modelValue: [49, 51],
        tooltip: 'hover',
        formatValue: percentFormatter,
    },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('.rp-range-slider')!;
        const track = canvasElement.querySelector<HTMLElement>('.rp-range-slider__track')!;
        const lowerThumb = canvasElement.querySelector<HTMLElement>(
            '.rp-range-slider__thumb--lower',
        )!;
        const endpointTooltips = [
            ...canvasElement.querySelectorAll<HTMLElement>(
                '.rp-range-slider__tooltip--lower, .rp-range-slider__tooltip--upper',
            ),
        ];

        await userEvent.hover(track);
        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(true),
        );

        expect(root.classList.contains('rp-range-slider--tooltip-always-visible')).toBe(false);
        const mergedTooltip = canvasElement.querySelector<HTMLElement>(
            '.rp-range-slider__tooltip--merged',
        )!;
        const mergedContent = mergedTooltip.querySelector<HTMLElement>('.rp-tooltip__content')!;

        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(mergedContent.textContent).toBe('49%–51%');
        await waitFor(() =>
            expect(getVisibleTooltipContents(canvasElement)).toEqual([mergedContent]),
        );

        await userEvent.hover(lowerThumb);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        await userEvent.unhover(lowerThumb);
        await waitFor(() =>
            expect(
                endpointTooltips.every(
                    (tooltip) => !tooltip.classList.contains('rp-tooltip--open'),
                ),
            ).toBe(true),
        );
        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(false),
        );
        await waitFor(() => {
            expect(
                canvasElement.querySelector<HTMLElement>('.rp-range-slider__tooltip--merged'),
            ).toBe(mergedTooltip);
            expect(getVisibleTooltipContents(canvasElement)).toHaveLength(0);
        });
    },
};

export const BottomTooltipsWithLabeledMarks: Story = {
    argTypes: {
        tooltip: { control: 'object' },
    },
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

export const MergedVerticalTooltip: Story = {
    tags: ['test'],
    args: {
        modelValue: [48, 52],
        orientation: 'vertical',
        tooltip: 'always',
        formatValue: percentFormatter,
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
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('.rp-range-slider')!;
        const upperInput = canvasElement.querySelector<HTMLInputElement>(
            '.rp-range-slider__native--upper',
        )!;
        const endpointTooltips = [
            ...canvasElement.querySelectorAll<HTMLElement>(
                '.rp-range-slider__tooltip--lower, .rp-range-slider__tooltip--upper',
            ),
        ];
        const endpointContents = endpointTooltips.map(
            (tooltip) => tooltip.querySelector<HTMLElement>('.rp-tooltip__content')!,
        );
        const mergedTooltip = canvasElement.querySelector<HTMLElement>(
            '.rp-range-slider__tooltip--merged',
        )!;
        const shouldAnimate =
            typeof mergedTooltip.animate === 'function' &&
            !canvasElement.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
                .matches;

        await waitFor(() =>
            expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(true),
        );

        const mergedContent = mergedTooltip.querySelector<HTMLElement>('.rp-tooltip__content')!;
        expect(mergedContent.textContent).toBe('48%–52%');
        await waitFor(() =>
            expect(getVisibleTooltipContents(canvasElement)).toEqual([mergedContent]),
        );
        if (shouldAnimate) {
            await waitFor(() => expect(mergedTooltip.getAnimations()).toHaveLength(0));
        }

        const thumbCenters = [
            ...canvasElement.querySelectorAll<HTMLElement>('.rp-range-slider__thumb-content'),
        ].map((thumb) => {
            const rect = thumb.getBoundingClientRect();
            return rect.top + rect.height / 2;
        });
        const mergedAnchor = canvasElement.querySelector<HTMLElement>(
            '.rp-range-slider__tooltip--merged .rp-range-slider__tooltip-anchor',
        )!;
        const mergedAnchorRect = mergedAnchor.getBoundingClientRect();
        const mergedCenter = mergedAnchorRect.top + mergedAnchorRect.height / 2;

        expect(Math.abs(mergedCenter - (thumbCenters[0] + thumbCenters[1]) / 2)).toBeLessThan(0.5);

        if (shouldAnimate) {
            const carrierCenter = getElementCenter(endpointContents[0]);
            const splitAnimationStarted = waitForAnimation(mergedTooltip);
            upperInput.value = '80';
            upperInput.dispatchEvent(new Event('input', { bubbles: true }));
            await waitFor(() =>
                expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(
                    false,
                ),
            );

            const animation = await splitAnimationStarted;
            const duration = expectPositionAnimation(animation);
            setAnimationProgress(animation, duration, 0.35);
            const centerWhileSplitting = getElementCenter(mergedContent);

            upperInput.value = '100';
            upperInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const centerAfterContentResize = getElementCenter(mergedContent);
            expect(Math.abs(centerAfterContentResize.x - centerWhileSplitting.x)).toBeLessThan(0.5);
            expect(Math.abs(centerAfterContentResize.y - centerWhileSplitting.y)).toBeLessThan(0.5);

            setAnimationProgress(animation, duration, 0.999);
            const splitEndCenter = getElementCenter(mergedContent);
            expect(Math.abs(splitEndCenter.x - carrierCenter.x)).toBeLessThan(0.5);
            expect(Math.abs(splitEndCenter.y - carrierCenter.y)).toBeLessThan(0.5);
            animation.finish();

            await waitFor(() => {
                expect(getVisibleTooltipContents(canvasElement)).toEqual(endpointContents);
                expect(mergedTooltip.style.left).toBe('');
                expect(mergedTooltip.style.top).toBe('');
                expect(mergedContent.style.width).toBe('');
                expect(mergedContent.style.height).toBe('');
                expect(
                    [...endpointTooltips, mergedTooltip].every(({ style }) => style.opacity === ''),
                ).toBe(true);
            });

            upperInput.value = '52';
            upperInput.dispatchEvent(new Event('input', { bubbles: true }));
            await waitFor(() =>
                expect(root.classList.contains('rp-range-slider--tooltips-overlapping')).toBe(true),
            );
            await waitFor(() =>
                expect(getVisibleTooltipContents(canvasElement)).toEqual([mergedContent]),
            );
        }
    },
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
    argTypes: {
        tooltip: { control: 'object' },
    },
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
