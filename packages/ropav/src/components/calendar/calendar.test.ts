import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { click, flush, keydown, mountDom } from '../../../tests/utils/vue';
import Calendar from './calendar.vue';

describe('Calendar', () => {
    it('renders an accessible localized grid and selects an uncontrolled date', async () => {
        const onUpdate = vi.fn();
        const onChange = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Calendar, {
                        defaultMonth: new Date(2026, 6, 1),
                        locale: 'en-US',
                        firstDayOfWeek: 1,
                        ariaLabel: 'Appointment date',
                        'onUpdate:modelValue': onUpdate,
                        onChange,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-calendar') as HTMLElement;
        const grid = container.querySelector('[role="grid"]') as HTMLTableElement;
        const day = container.querySelector('[data-date="2026-07-14"]') as HTMLButtonElement;

        expect(root.dataset.month).toBe('2026-07-01');
        expect(grid.getAttribute('aria-label')).toBe('Appointment date');
        expect(
            [...container.querySelectorAll('.rp-calendar__weekday')].map((node) =>
                node.textContent?.trim(),
            ),
        ).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
        expect(container.querySelectorAll('.rp-calendar__day')).toHaveLength(42);

        click(day);
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate.mock.calls[0][0]).toEqual(new Date(2026, 6, 14));
        expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 14));
        expect(day.dataset.selected).toBe('');
        expect(day.closest('[role="gridcell"]')?.getAttribute('aria-selected')).toBe('true');
    });

    it('navigates months and supports roving keyboard focus', async () => {
        const onMonth = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Calendar, {
                        defaultValue: new Date(2026, 6, 31),
                        firstDayOfWeek: 1,
                        'onUpdate:month': onMonth,
                    });
                },
            }),
        );

        await flush();

        const selected = container.querySelector('[data-date="2026-07-31"]') as HTMLButtonElement;
        selected.focus();
        keydown(selected, 'ArrowRight');
        await flush();

        const augustFirst = container.querySelector(
            '[data-date="2026-08-01"]',
        ) as HTMLButtonElement;
        expect(container.querySelector('.rp-calendar')?.getAttribute('data-month')).toBe(
            '2026-08-01',
        );
        expect(document.activeElement).toBe(augustFirst);
        expect(augustFirst.tabIndex).toBe(0);
        expect(onMonth).toHaveBeenCalledWith(new Date(2026, 7, 1));

        keydown(augustFirst, 'PageDown');
        await flush();
        expect(container.querySelector('.rp-calendar')?.getAttribute('data-month')).toBe(
            '2026-09-01',
        );
        expect(document.activeElement).toBe(container.querySelector('[data-date="2026-09-01"]'));
    });

    it('enforces bounds, disabled dates, readonly selection, and hidden outside dates', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Calendar, {
                        defaultMonth: new Date(2026, 6, 1),
                        min: new Date(2026, 6, 10),
                        max: new Date(2026, 6, 20),
                        disabledDates: [new Date(2026, 6, 15)],
                        hideOutsideDates: true,
                        readonly: true,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const beforeMin = container.querySelector('[data-date="2026-07-09"]') as HTMLButtonElement;
        const disabled = container.querySelector('[data-date="2026-07-15"]') as HTMLButtonElement;
        const available = container.querySelector('[data-date="2026-07-16"]') as HTMLButtonElement;

        expect(beforeMin.disabled).toBe(true);
        expect(disabled.disabled).toBe(true);
        expect(container.querySelector('[data-date="2026-06-30"]')).toBeNull();
        expect(
            (container.querySelector('.rp-calendar__control--previous') as HTMLButtonElement)
                .disabled,
        ).toBe(true);
        expect(
            (container.querySelector('.rp-calendar__control--next') as HTMLButtonElement).disabled,
        ).toBe(true);

        click(available);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('supports controlled months, Styles API, and a custom day slot', async () => {
        const onMonth = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Calendar,
                        {
                            id: 'travel-calendar',
                            month: new Date(2026, 6, 1),
                            size: 'lg',
                            radius: 'full',
                            classNames: { root: 'custom-root', day: 'custom-day' },
                            styles: { day: { fontWeight: 700 } },
                            'onUpdate:month': onMonth,
                        },
                        {
                            day: ({ label, outside }: { label: number; outside: boolean }) =>
                                h('span', { class: 'day-slot' }, `${label}:${outside}`),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-calendar') as HTMLElement;
        const next = container.querySelector('.rp-calendar__control--next') as HTMLButtonElement;
        const day = container.querySelector('[data-date="2026-07-14"]') as HTMLButtonElement;

        expect(root.id).toBe('travel-calendar');
        expect(root.classList.contains('rp-calendar--size-lg')).toBe(true);
        expect(root.classList.contains('rp-calendar--radius-full')).toBe(true);
        expect(root.classList.contains('custom-root')).toBe(true);
        expect(day.classList.contains('custom-day')).toBe(true);
        expect(day.style.fontWeight).toBe('700');
        expect(day.querySelector('.day-slot')?.textContent).toBe('14:false');

        click(next);
        await flush();
        expect(onMonth).toHaveBeenCalledWith(new Date(2026, 7, 1));
        expect(root.dataset.month).toBe('2026-07-01');
    });
});
