import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

function getTooltips(container: Element) {
    return [...container.querySelectorAll<HTMLElement>('.rp-range-slider__tooltip')];
}

function getTooltipContents(container: Element) {
    return [...container.querySelectorAll<HTMLElement>('.rp-tooltip__content')];
}

function getTooltipOpenStates(tooltips: HTMLElement[]) {
    return tooltips.map((tooltip) => tooltip.classList.contains('rp-tooltip--open'));
}

describe('RangeSlider tooltip', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders both normalized values in endpoint tooltips', async () => {
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

        const tooltips = getTooltips(container);
        const contents = getTooltipContents(container);

        expect(tooltips).toHaveLength(2);
        expect(tooltips[0].classList.contains('rp-range-slider__tooltip--lower')).toBe(true);
        expect(tooltips[1].classList.contains('rp-range-slider__tooltip--upper')).toBe(true);
        expect(contents.map((content) => content.textContent)).toEqual(['50', '75']);
        expect(contents.every((content) => content.getAttribute('aria-hidden') === 'true')).toBe(
            true,
        );
        expect(contents.every((content) => content.style.display === 'none')).toBe(true);
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
        const tooltips = getTooltips(container);

        inputs[0].focus();
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        inputs[0].blur();
        inputs[1].focus();
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        keydown(inputs[1], 'Escape');
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);

        keydown(inputs[1], 'ArrowRight');
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);
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
        const tooltips = getTooltips(container);
        const mouse = (type: 'mouseenter' | 'mouseleave') =>
            track.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));

        lowerInput.focus();
        lowerInput.blur();
        mouse('mouseenter');
        await flush();
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);

        lowerInput.focus();
        mouse('mouseenter');
        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);
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
        const tooltips = getTooltips(container);
        const mouse = (type: 'mouseenter' | 'mouseleave') =>
            track.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));

        lowerInput.focus();
        mouse('mouseenter');
        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        lowerInput.blur();
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);

        lowerInput.focus();
        mouse('mouseenter');
        lowerInput.blur();
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        mouse('mouseleave');
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);
    });

    it('derives endpoint IDs and applies shared custom tooltip options', async () => {
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
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);

        vi.advanceTimersByTime(50);
        lowerInput.focus();
        vi.advanceTimersByTime(49);
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);

        vi.advanceTimersByTime(1);
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);
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
        const tooltips = getTooltips(container);

        track.dispatchEvent(new MouseEvent('mouseenter', { cancelable: true }));
        vi.advanceTimersByTime(100);
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        bar.dispatchEvent(new MouseEvent('mouseleave', { cancelable: true }));
        lowerThumb.dispatchEvent(new MouseEvent('mouseenter', { cancelable: true }));
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);

        track.dispatchEvent(new MouseEvent('mouseleave', { cancelable: true }));
        await flush();
        expect(getTooltipOpenStates(tooltips)).toEqual([false, false]);
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
        const contents = getTooltipContents(container);

        expect(contents.map((content) => content.textContent)).toEqual(['$20', '$80']);
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
        const tooltips = getTooltips(container);

        expect(root.classList.contains('rp-range-slider--tooltip-always-visible')).toBe(true);
        expect(getTooltipOpenStates(tooltips)).toEqual([true, true]);
    });
});
