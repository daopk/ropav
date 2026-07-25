import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { flush, mountDom } from '../../../tests/utils/vue';
import Calendar from './calendar.vue';

const calendarStyles = readFileSync(
    resolve(process.cwd(), 'src/components/calendar/calendar.scss'),
    'utf8',
);

describe('Calendar accessibility', () => {
    it('does not expose hidden outside dates as selected grid cells', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Calendar, {
                        defaultMonth: new Date(2026, 7, 1),
                        defaultValue: new Date(2026, 6, 31),
                        hideOutsideDates: true,
                    });
                },
            }),
        );

        await flush();

        const blankCells = [...container.querySelectorAll<HTMLElement>('[role="gridcell"]')].filter(
            (cell) => !cell.querySelector('.rp-calendar__day'),
        );

        expect(blankCells.length).toBeGreaterThan(0);
        expect(blankCells.every((cell) => !cell.hasAttribute('aria-selected'))).toBe(true);
        expect(container.querySelector('[role="gridcell"][aria-selected="true"]')).toBeNull();
    });

    it('provides a system-color focus outline in forced-colors mode', () => {
        expect(calendarStyles).toMatch(
            /@media \(forced-colors: active\) \{[\s\S]*?&__control:focus-visible,[\s\S]*?&__day:focus-visible \{[\s\S]*?outline: var\(--rp-border-width-medium\) solid Highlight;[\s\S]*?box-shadow: none;/,
        );
    });
});
