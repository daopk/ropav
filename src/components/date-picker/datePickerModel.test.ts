import { describe, expect, it } from 'vitest';
import {
    defaultDatePickerFormat,
    formatDatePickerValue,
    normalizeDatePickerValue,
    parseDatePickerValue,
} from './datePickerModel';

describe('datePickerModel', () => {
    it('formats and parses locale-aware numeric dates', () => {
        const date = new Date(2026, 6, 14);

        expect(formatDatePickerValue(date, 'en-US')).toBe('07/14/2026');
        expect(parseDatePickerValue('07/14/2026', 'en-US')).toEqual(date);
        expect(formatDatePickerValue(date, 'en-GB')).toBe('14/07/2026');
        expect(parseDatePickerValue('14/07/2026', 'en-GB')).toEqual(date);
    });

    it('accepts ISO input and rejects impossible dates', () => {
        expect(parseDatePickerValue('2026-07-14', 'en-US')).toEqual(new Date(2026, 6, 14));
        expect(parseDatePickerValue('02/30/2026', 'en-US')).toBeNull();
        expect(parseDatePickerValue('not a date', 'en-US')).toBeNull();
    });

    it('accepts unpadded numeric input and alternate separators', () => {
        const date = new Date(2026, 6, 14);

        expect(parseDatePickerValue('7/14/2026', 'en-US')).toEqual(date);
        expect(parseDatePickerValue('07-14-2026', 'en-US')).toEqual(date);
    });

    it.each(['ar-EG', 'th-TH'])(
        'round-trips localized digits and calendar years for %s',
        (locale) => {
            const date = new Date(2026, 6, 14);
            const formatted = formatDatePickerValue(date, locale);

            expect(parseDatePickerValue(formatted, locale)).toEqual(date);
        },
    );

    it.each(['en-US', 'ar-EG', 'th-TH'])(
        'round-trips named months and two-digit years for %s',
        (locale) => {
            const date = new Date(2026, 6, 14);
            const format: Intl.DateTimeFormatOptions = {
                year: '2-digit',
                month: 'long',
                day: 'numeric',
            };
            const formatted = formatDatePickerValue(date, locale, format);

            expect(parseDatePickerValue(formatted, locale, format)).toEqual(date);
        },
    );

    it.each([
        { dateStyle: 'short' },
        { dateStyle: 'long' },
        {
            weekday: 'long',
            era: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        },
    ] satisfies Intl.DateTimeFormatOptions[])(
        'round-trips date styles and contextual parts for %#',
        (format) => {
            const date = new Date(2026, 6, 14);
            const formatted = formatDatePickerValue(date, 'en-US', format);

            expect(parseDatePickerValue(formatted, 'en-US', format)).toEqual(date);
        },
    );

    it('round-trips Buddhist formats that include an era', () => {
        const date = new Date(2026, 6, 14);
        const locale = 'en-US-u-ca-buddhist';
        const formatted = formatDatePickerValue(date, locale);

        expect(formatted).toContain('BE');
        expect(parseDatePickerValue(formatted, locale)).toEqual(date);
    });

    it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'])(
        'keeps civil dates stable in the %s time zone',
        (timeZone) => {
            const date = new Date(2026, 6, 14);
            const format = { ...defaultDatePickerFormat, timeZone };
            const formatted = formatDatePickerValue(date, 'en-US', format);

            expect(formatted).toBe('07/14/2026');
            expect(parseDatePickerValue(formatted, 'en-US', format)).toEqual(date);
        },
    );

    it('rejects unsupported or incomplete localized date formats without guessing', () => {
        const date = new Date(2026, 6, 14);
        const format: Intl.DateTimeFormatOptions = {
            calendar: 'islamic',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        expect(
            parseDatePickerValue(formatDatePickerValue(date, 'en-US', format), 'en-US', format),
        ).toBeNull();
        expect(
            parseDatePickerValue('July 2026', 'en-US', {
                year: 'numeric',
                month: 'long',
            }),
        ).toBeNull();
    });

    it('normalizes valid values without mutating the source', () => {
        const source = new Date(2026, 6, 14, 18, 30);
        const normalized = normalizeDatePickerValue(source);

        expect(normalized).toEqual(new Date(2026, 6, 14));
        expect(normalized).not.toBe(source);
        expect(normalizeDatePickerValue(new Date('invalid'))).toBeNull();
    });
});
