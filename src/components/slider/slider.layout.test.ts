import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';
import type { SliderTrackSlotProps } from './types';

describe('Slider layout', () => {
    it('renders custom track layers around the selected range with normalized slot props', async () => {
        let underlayProps: SliderTrackSlotProps | undefined;
        let overlayProps: SliderTrackSlotProps | undefined;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Slider,
                        {
                            formatValue: (value: number) => `${value}s`,
                            max: 200,
                            min: 0,
                            modelValue: 140,
                        },
                        {
                            'track-underlay': (props: SliderTrackSlotProps) => {
                                underlayProps = props;
                                return h('span', {
                                    class: 'buffered-range',
                                    style: { width: `${props.getPercent(44.4)}%` },
                                });
                            },
                            'track-overlay': (props: SliderTrackSlotProps) => {
                                overlayProps = props;
                                return h('span', { class: 'waveform' });
                            },
                        },
                    );
                },
            }),
        );

        await flush();

        const rail = container.querySelector('.rp-slider__rail')!;
        const underlay = container.querySelector('.rp-slider__track-underlay')!;
        const bar = container.querySelector('.rp-slider__bar')!;
        const overlay = container.querySelector('.rp-slider__track-overlay')!;
        const input = container.querySelector('.rp-slider__native')!;
        const bufferedRange = container.querySelector('.buffered-range') as HTMLElement;

        expect(underlay.getAttribute('aria-hidden')).toBe('true');
        expect(overlay.getAttribute('aria-hidden')).toBe('true');
        expect(rail.compareDocumentPosition(underlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(underlay.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(bar.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(overlay.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(bufferedRange.style.width).toBe('22.2%');
        expect(underlayProps).toMatchObject({
            value: 140,
            formattedValue: '140s',
            percent: 70,
            min: 0,
            max: 200,
            orientation: 'horizontal',
        });
        expect(overlayProps).toMatchObject(underlayProps!);
        expect(underlayProps?.getPercent(-10)).toBe(0);
        expect(underlayProps?.getPercent(300)).toBe(100);
        expect(underlayProps?.getPercent(Number.NaN)).toBe(0);
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

    it('sets custom thumb style properties from props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        thumb: {
                            border: '2px solid red',
                            padding: 4,
                            size: 28,
                        },
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;

        expect(root.style.getPropertyValue('--rp-slider-thumb-size')).toBe('28px');
        expect(root.style.getPropertyValue('--_rp-slider-thumb-border-style')).toBe(
            '2px solid red',
        );
        expect(root.style.getPropertyValue('--rp-slider-thumb-padding')).toBe('4px');
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
});
