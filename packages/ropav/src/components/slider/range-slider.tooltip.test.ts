import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

function getTooltips(container: Element) {
    return [...container.querySelectorAll<HTMLElement>('.rp-range-slider__tooltip')];
}

function getEndpointTooltips(container: Element) {
    return [
        container.querySelector<HTMLElement>('.rp-range-slider__tooltip--lower')!,
        container.querySelector<HTMLElement>('.rp-range-slider__tooltip--upper')!,
    ];
}

function getMergedTooltip(container: Element) {
    return container.querySelector<HTMLElement>('.rp-range-slider__tooltip--merged')!;
}

function getTooltipContents(container: Element) {
    return [...container.querySelectorAll<HTMLElement>('.rp-tooltip__content')];
}

function getTooltipContent(tooltip: Element) {
    return tooltip.querySelector<HTMLElement>('.rp-tooltip__content')!;
}

function getTooltipOpenStates(tooltips: HTMLElement[]) {
    return tooltips.map((tooltip) => tooltip.classList.contains('rp-tooltip--open'));
}

describe('RangeSlider tooltip', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders normalized endpoint and merged tooltip values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [44, 76],
                        step: 25,
                    });
                },
            }),
        );

        await flush();

        const endpointTooltips = getEndpointTooltips(container);
        const mergedTooltip = getMergedTooltip(container);
        const endpointContents = endpointTooltips.map(getTooltipContent);
        const mergedContent = getTooltipContent(mergedTooltip);

        expect(getTooltips(container)).toHaveLength(3);
        expect(endpointContents.map((content) => content.textContent)).toEqual(['50', '75']);
        expect(mergedContent.textContent).toBe('50–75');
        expect(
            [...mergedContent.querySelectorAll('.rp-range-slider__tooltip-merged-value')].map(
                (value) => value.textContent,
            ),
        ).toEqual(['50', '75']);
        expect(
            mergedContent.querySelector('.rp-range-slider__tooltip-merged-separator')?.textContent,
        ).toBe('–');
        expect(
            [...endpointContents, mergedContent].every(
                (content) => content.getAttribute('aria-hidden') === 'true',
            ),
        ).toBe(true);
        expect(
            [...endpointContents, mergedContent].every(
                (content) => content.style.display === 'none',
            ),
        ).toBe(true);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(false);
    });

    it('stacks the merged tooltip values (upper over lower) when vertical', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [55, 67],
                        orientation: 'vertical',
                        tooltip: 'always',
                    });
                },
            }),
        );

        await flush();

        const mergedContent = getTooltipContent(getMergedTooltip(container));
        const stacked = [
            ...mergedContent.querySelectorAll<HTMLElement>(
                '.rp-range-slider__tooltip-merged-value',
            ),
        ];

        expect(stacked.map((line) => line.textContent)).toEqual(['67', '55']);
        expect(
            mergedContent.querySelector('.rp-range-slider__tooltip-merged-separator'),
        ).toBeNull();
    });

    it('collapses the merged tooltip to a single value when both thumbs are equal', async () => {
        for (const orientation of ['horizontal', 'vertical'] as const) {
            const container = mountDom(
                defineComponent({
                    render() {
                        return h(RangeSlider, {
                            modelValue: [50, 50],
                            orientation,
                            tooltip: 'always',
                        });
                    },
                }),
            );

            await flush();

            const mergedContent = getTooltipContent(getMergedTooltip(container));

            expect(mergedContent.textContent?.trim()).toBe('50');
            expect(
                mergedContent.querySelectorAll('.rp-range-slider__tooltip-merged-value'),
            ).toHaveLength(0);
            expect(
                mergedContent.querySelector('.rp-range-slider__tooltip-merged-separator'),
            ).toBeNull();
        }
    });

    it('opens and dismisses both tooltips together when either thumb is focused', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, { modelValue: [20, 80] });
                },
            }),
        );

        await flush();

        const inputs = [...container.querySelectorAll<HTMLInputElement>('input')];
        const endpointTooltips = getEndpointTooltips(container);
        const mergedTooltip = getMergedTooltip(container);

        inputs[0].focus();
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        inputs[0].blur();
        inputs[1].focus();
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        keydown(inputs[1], 'Escape');
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([false, false]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(false);
        expect(getMergedTooltip(container)).toBe(mergedTooltip);

        keydown(inputs[1], 'ArrowRight');
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(getMergedTooltip(container)).toBe(mergedTooltip);
    });

    it('opens both tooltips while the track is hovered', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, { modelValue: [20, 80] });
                },
            }),
        );

        await flush();

        const lowerInput = container.querySelector<HTMLInputElement>(
            '.rp-range-slider__native--lower',
        )!;
        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track')!;
        const endpointTooltips = getEndpointTooltips(container);
        const mergedTooltip = getMergedTooltip(container);
        const mouse = (type: 'mouseenter' | 'mouseleave') =>
            track.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));

        lowerInput.focus();
        lowerInput.blur();
        mouse('mouseenter');
        await flush();
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([false, false]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(false);
        expect(getMergedTooltip(container)).toBe(mergedTooltip);

        lowerInput.focus();
        mouse('mouseenter');
        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);
    });

    it('keeps both tooltips open while either focus or hover is still active', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, { modelValue: [20, 80] });
                },
            }),
        );

        await flush();

        const lowerInput = container.querySelector<HTMLInputElement>(
            '.rp-range-slider__native--lower',
        )!;
        const track = container.querySelector('.rp-range-slider__track')!;
        const endpointTooltips = getEndpointTooltips(container);
        const mergedTooltip = getMergedTooltip(container);
        const mouse = (type: 'mouseenter' | 'mouseleave') =>
            track.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));

        lowerInput.focus();
        mouse('mouseenter');
        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        lowerInput.blur();
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([false, false]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(false);

        lowerInput.focus();
        mouse('mouseenter');
        lowerInput.blur();
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([false, false]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(false);
        expect(getMergedTooltip(container)).toBe(mergedTooltip);
    });

    it('derives tooltip IDs and applies shared custom tooltip options', async () => {
        vi.useFakeTimers();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        tooltip: {
                            id: 'price-tooltip',
                            placement: 'bottom',
                            color: 'orange',
                            offset: { mainAxis: 12, crossAxis: -4 },
                            openDelay: 100,
                            arrow: true,
                        },
                    });
                },
            }),
        );

        await flush();

        const lowerInput = container.querySelector<HTMLInputElement>(
            '.rp-range-slider__native--lower',
        )!;
        const track = container.querySelector('.rp-range-slider__track')!;
        const tooltips = getTooltips(container);
        const contents = getTooltipContents(container);

        expect(contents.map((content) => content.id)).toEqual([
            'price-tooltip-lower',
            'price-tooltip-upper',
            'price-tooltip-merged',
        ]);
        for (const [index, tooltip] of tooltips.entries()) {
            expect(tooltip.classList.contains('rp-tooltip--placement-bottom')).toBe(true);
            expect(tooltip.classList.contains('rp-tooltip--arrow')).toBe(true);
            expect(contents[index].style.getPropertyValue('--_rp-tooltip-bg')).toBe(
                'var(--rp-color-orange-filled)',
            );
            expect(contents[index].style.getPropertyValue('--_rp-tooltip-main-axis-offset')).toBe(
                '12px',
            );
            expect(contents[index].style.getPropertyValue('--_rp-tooltip-cross-axis-offset')).toBe(
                '-4px',
            );
        }

        track.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false, false]);

        vi.advanceTimersByTime(50);
        lowerInput.focus();
        vi.advanceTimersByTime(49);
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false, false]);

        vi.advanceTimersByTime(1);
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true, true]);
        expect(getTooltipContent(getMergedTooltip(container)).getAttribute('aria-hidden')).toBe(
            'true',
        );
    });

    it('keeps both tooltips open when the pointer moves from the bar to a thumb', async () => {
        vi.useFakeTimers();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        tooltip: { openDelay: 100 },
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track')!;
        const bar = container.querySelector('.rp-range-slider__bar')!;
        const lowerThumb = container.querySelector('.rp-range-slider__thumb--lower')!;
        const endpointTooltips = getEndpointTooltips(container);
        const mergedTooltip = getMergedTooltip(container);

        track.dispatchEvent(new MouseEvent('mouseenter', { cancelable: true }));
        vi.advanceTimersByTime(100);
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        bar.dispatchEvent(new MouseEvent('mouseleave', { cancelable: true }));
        lowerThumb.dispatchEvent(new MouseEvent('mouseenter', { cancelable: true }));
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);

        track.dispatchEvent(new MouseEvent('mouseleave', { cancelable: true }));
        await flush();
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([false, false]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(false);
        expect(getMergedTooltip(container)).toBe(mergedTooltip);
    });

    it('formats both visible tooltip values independently from aria-valuetext', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        formatValue: (value: number) => `$${value}`,
                        ariaValueText: [
                            (value: number) => `${value} minimum dollars`,
                            (value: number) => `${value} maximum dollars`,
                        ],
                    });
                },
            }),
        );

        await flush();

        const inputs = [...container.querySelectorAll<HTMLInputElement>('input')];
        const endpointContents = getEndpointTooltips(container).map(getTooltipContent);
        const mergedContent = getTooltipContent(getMergedTooltip(container));

        expect(endpointContents.map((content) => content.textContent)).toEqual(['$20', '$80']);
        expect(mergedContent.textContent).toBe('$20–$80');
        expect(inputs.map((input) => input.getAttribute('aria-valuetext'))).toEqual([
            '20 minimum dollars',
            '80 maximum dollars',
        ]);
    });

    it('does not render tooltips when disabled by prop', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        tooltip: false,
                    });
                },
            }),
        );

        await flush();

        expect(getTooltips(container)).toHaveLength(0);
    });

    it('supports always showing both thumb tooltips', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        tooltip: 'always',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const endpointTooltips = getEndpointTooltips(container);
        const mergedTooltip = getMergedTooltip(container);

        expect(root.classList.contains('rp-range-slider--tooltip-always-visible')).toBe(true);
        expect(getTooltipOpenStates(endpointTooltips)).toEqual([true, true]);
        expect(mergedTooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(getTooltipContent(mergedTooltip).getAttribute('aria-hidden')).toBe('true');
        expect(getMergedTooltip(container)).toBe(mergedTooltip);
    });
});
