import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, input, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';
import { sliderColors, sliderSizes } from './types';

describe('Slider', () => {
    const colors = sliderColors;
    const sizes = sliderSizes;

    it('emits numeric model updates from native range input events', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 20,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '42');
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(42);
    });

    it('does not emit updates when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        disabled: true,
                        modelValue: 20,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '42');
        await flush();

        expect(native.disabled).toBe(true);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('applies range, state, and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        id: 'volume-control',
                        name: 'volume',
                        describedby: 'volume-help volume-error',
                        labelledby: 'volume-label',
                        modelValue: 35,
                        min: 10,
                        max: 90,
                        step: 5,
                        required: true,
                        invalid: true,
                        ariaValueText: '35 percent',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-slider--invalid')).toBe(true);
        expect(native.id).toBe('volume-control');
        expect(native.name).toBe('volume');
        expect(native.value).toBe('35');
        expect(native.min).toBe('10');
        expect(native.max).toBe('90');
        expect(native.step).toBe('5');
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-valuetext')).toBe('35 percent');
        expect(native.getAttribute('aria-labelledby')).toBe('volume-label');
        expect(native.getAttribute('aria-describedby')).toBe('volume-help volume-error');
    });

    it('renders label and value slots around the native input', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Slider,
                        {
                            modelValue: 64,
                        },
                        {
                            default: () => 'Volume',
                            value: ({ value }: { value: number }) =>
                                h('span', { class: 'value' }, `${value}%`),
                        },
                    );
                },
            }),
        );

        await flush();

        const header = container.querySelector('.rp-slider__header')!;
        const label = container.querySelector('.rp-slider__label')!;
        const value = container.querySelector('.rp-slider__value .value')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(header.contains(label)).toBe(true);
        expect(label.textContent).toBe('Volume');
        expect(value.parentElement?.getAttribute('aria-hidden')).toBe('true');
        expect(value.textContent).toBe('64%');
        expect(native.value).toBe('64');
    });

    it('sets custom properties for thumb and filled track positions', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        min: 0,
                        max: 200,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const bar = container.querySelector('.rp-slider__bar') as HTMLElement;

        expect(bar.getAttribute('aria-hidden')).toBe('true');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('25%');
        expect(root.style.getPropertyValue('--_rp-slider-ratio')).toBe('0.25');
    });

    it('adds native and ARIA orientation attributes for vertical sliders', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        orientation: 'vertical',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;
        const tooltip = container.querySelector('.rp-slider__tooltip') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-slider', 'rp-slider--vertical']);
        expect(native.getAttribute('orient')).toBe('vertical');
        expect(native.getAttribute('aria-orientation')).toBe('vertical');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('50%');
        expect(tooltip.classList.contains('rp-tooltip--placement-left')).toBe(true);
    });

    it('renders the current normalized value in the thumb tooltip', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        min: 0,
                        max: 100,
                        step: 25,
                    });
                },
            }),
        );

        await flush();

        const tooltip = container.querySelector('.rp-slider__tooltip') as HTMLElement;
        const tooltipContent = tooltip.querySelector('.rp-tooltip__content') as HTMLElement;

        expect(tooltip.classList.contains('rp-tooltip')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--placement-top')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--arrow')).toBe(true);
        expect(tooltipContent.getAttribute('role')).toBeNull();
        expect(tooltipContent.getAttribute('aria-hidden')).toBe('true');
        expect(tooltipContent.style.display).toBe('none');
        expect(tooltipContent.textContent).toBe('50');
    });

    it('supports formatting the thumb tooltip value', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        formatValue: (value: number) => `${value}%`,
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        const tooltipContent = container.querySelector('.rp-tooltip__content')!;

        expect(native.getAttribute('aria-valuetext')).toBe('44%');
        expect(tooltipContent.textContent).toBe('44%');
    });

    it('lets aria-valuetext override the display formatter', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        ariaValueText: (value: number) => `${value} percent selected`,
                        formatValue: (value: number) => `${value}%`,
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        const tooltipContent = container.querySelector('.rp-tooltip__content')!;

        expect(native.getAttribute('aria-valuetext')).toBe('44 percent selected');
        expect(tooltipContent.textContent).toBe('44%');
    });

    it('does not render the thumb tooltip when disabled by prop', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        tooltip: false,
                    });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-slider__tooltip')).toBeNull();
    });

    it('supports always showing the thumb tooltip', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        tooltip: 'always',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const tooltip = container.querySelector('.rp-slider__tooltip') as HTMLElement;
        const tooltipContent = tooltip.querySelector('.rp-tooltip__content')!;

        expect(root.classList.contains('rp-slider--tooltip-always-visible')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(tooltipContent.textContent).toBe('44');
    });

    it('sets custom thumb style properties from props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        thumbStyle: {
                            border: 2,
                            padding: 4,
                            size: 28,
                        },
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;

        expect(root.style.getPropertyValue('--_rp-slider-thumb-size')).toBe('28px');
        expect(root.style.getPropertyValue('--_rp-slider-thumb-border-style')).toBe(
            '2px solid var(--_rp-slider-thumb-border)',
        );
        expect(root.style.getPropertyValue('--_rp-slider-thumb-padding')).toBe('4px');
    });

    it('renders a custom thumb slot with value and percent slot props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Slider,
                        {
                            modelValue: 40,
                            formatValue: (value: number) => `${value}%`,
                            min: 0,
                            max: 200,
                        },
                        {
                            thumb: ({
                                formattedValue,
                                percent,
                            }: {
                                formattedValue: string;
                                percent: number;
                            }) =>
                                h(
                                    'span',
                                    { class: 'custom-thumb' },
                                    `${formattedValue}:${percent}`,
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const thumb = container.querySelector('.rp-slider__thumb')!;
        const content = container.querySelector('.rp-slider__thumb-content .custom-thumb')!;

        expect(root.classList.contains('rp-slider--custom-thumb')).toBe(true);
        expect(thumb.getAttribute('aria-hidden')).toBe('true');
        expect(content.textContent).toBe('40%:20');
    });

    it('snaps the visible value and filled track to the configured step', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        min: 0,
                        max: 100,
                        step: 25,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.value).toBe('50');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('50%');
    });

    it('keeps arbitrary values when step is any', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        min: 0,
                        max: 100,
                        step: 'any',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.value).toBe('44');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('44%');
    });

    it('normalizes inverted bounds and invalid steps before passing them to the native input', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 75,
                        min: 100,
                        max: 0,
                        step: 0,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.min).toBe('0');
        expect(native.max).toBe('100');
        expect(native.step).toBe('any');
        expect(native.value).toBe('75');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('75%');
    });

    it('renders slider marks from slider values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 40,
                        min: 10,
                        max: 90,
                        marks: [20, { value: 40, label: '40%' }, { value: 80, label: '80%' }],
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const marks = [...container.querySelectorAll('.rp-slider__mark')] as HTMLElement[];
        const labels = [...container.querySelectorAll('.rp-slider__mark-label')];

        expect(root.classList.contains('rp-slider--marked')).toBe(true);
        expect(root.classList.contains('rp-slider--marks-with-labels')).toBe(true);
        expect(marks).toHaveLength(3);
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-position')).toBe('12.5%');
        expect(marks[1].style.getPropertyValue('--_rp-slider-mark-position')).toBe('37.5%');
        expect(marks[2].style.getPropertyValue('--_rp-slider-mark-position')).toBe('87.5%');
        expect(marks[0].classList.contains('rp-slider__mark--filled')).toBe(true);
        expect(marks[1].classList.contains('rp-slider__mark--filled')).toBe(true);
        expect(marks[2].classList.contains('rp-slider__mark--filled')).toBe(false);
        expect(labels.map((label) => label.textContent?.trim())).toEqual(['40%', '80%']);
    });

    it('supports hidden and colored slider marks', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 60,
                        marks: [
                            { value: 20, label: 'Hidden', hidden: true },
                            { value: 40, label: 'Warning', color: 'warning' },
                            { value: 80, label: 'Custom', color: '#ff3366' },
                        ],
                    });
                },
            }),
        );

        await flush();

        const marks = [...container.querySelectorAll('.rp-slider__mark')] as HTMLElement[];
        const labels = [...container.querySelectorAll('.rp-slider__mark-label')];

        expect(marks).toHaveLength(2);
        expect(labels.map((label) => label.textContent?.trim())).toEqual(['Warning', 'Custom']);
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-position')).toBe('40%');
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-label-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-filled-label-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-ring-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[1].style.getPropertyValue('--_rp-slider-mark-position')).toBe('80%');
        expect(marks[1].style.getPropertyValue('--_rp-slider-mark-color')).toBe('#ff3366');
    });

    it('adds a color modifier for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) => h(Slider, { color, modelValue: 50 })),
                    );
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-slider')];

        expect(sliders).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect([...sliders[index].classList]).toEqual([
                'rp-slider',
                `rp-slider--color-${color}`,
            ]);
            expect(
                (sliders[index] as HTMLElement).style.getPropertyValue('--_rp-slider-custom-color'),
            ).toBe('');
        }
    });

    it('sets an inline custom color for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        color: '#ff3366',
                        modelValue: 50,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-slider']);
        expect(root.style.getPropertyValue('--_rp-slider-custom-color')).toBe('#ff3366');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('50%');
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) => h(Slider, { modelValue: 50, size })),
                    );
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-slider')];

        expect(sliders).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect([...sliders[index].classList]).toEqual(['rp-slider', `rp-slider--size-${size}`]);
        }
    });
});
