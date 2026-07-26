import { isValidDate, normalizeDate, parseDateKey } from '@/utils/date';

export const defaultDatePickerFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
};

type DatePart = 'day' | 'month' | 'year';
type DatePartStyle = 'numeric' | '2-digit' | 'named';

interface DateField {
    part: DatePart;
    style: DatePartStyle;
}

interface DateTimeParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

const timeZonePartsFormatters = new Map<string, Intl.DateTimeFormat>();
const flexibleLiteralPattern = String.raw`(?:[\p{P}\p{Z}\s]+)`;

export function formatDatePickerValue(
    value: Date | null,
    locale?: string,
    format: Intl.DateTimeFormatOptions = defaultDatePickerFormat,
): string {
    if (!value || !isValidDate(value)) return '';
    return formatCivilDate(new Intl.DateTimeFormat(locale, format), value);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDigitMap(
    locale: string | undefined,
    numberingSystem: string,
): ReadonlyMap<string, string> {
    const formatter = new Intl.NumberFormat(locale, {
        numberingSystem,
        useGrouping: false,
    });

    return new Map(
        Array.from({ length: 10 }, (_, digit) => [
            formatter.format(digit).replace(/\p{Cf}/gu, ''),
            String(digit),
        ]),
    );
}

function normalizeLocalizedValue(value: string, digitMap: ReadonlyMap<string, string>): string {
    const normalized = value.normalize('NFKC').replace(/\p{Cf}/gu, '');
    return Array.from(normalized, (character) => digitMap.get(character) ?? character).join('');
}

function normalizeLocalizedText(
    value: string,
    digitMap: ReadonlyMap<string, string>,
    locale: string,
): string {
    return normalizeLocalizedValue(value, digitMap).toLocaleLowerCase(locale);
}

function getTimeZonePartsFormatter(timeZone: string): Intl.DateTimeFormat {
    const existing = timeZonePartsFormatters.get(timeZone);
    if (existing) return existing;

    const formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23',
    });
    timeZonePartsFormatters.set(timeZone, formatter);
    return formatter;
}

function getUtcTime(parts: DateTimeParts): number {
    const date = new Date(0);
    date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    return date.getTime();
}

function readDateTimeParts(formatter: Intl.DateTimeFormat, value: Date): DateTimeParts | null {
    const values = Object.fromEntries(
        formatter
            .formatToParts(value)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, Number(part.value)]),
    );
    const parts = {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute,
        second: values.second,
    };
    return Object.values(parts).every(Number.isInteger) ? parts : null;
}

function createCivilDateInstant(value: Date, timeZone: string): Date | null {
    const target: DateTimeParts = {
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate(),
        hour: 12,
        minute: 0,
        second: 0,
    };
    const targetTime = getUtcTime(target);
    const formatter = getTimeZonePartsFormatter(timeZone);
    let candidateTime = targetTime;

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const candidate = new Date(candidateTime);
        const parts = readDateTimeParts(formatter, candidate);
        if (!parts) return null;
        const difference = getUtcTime(parts) - targetTime;
        if (difference === 0) return candidate;
        candidateTime -= difference;
    }

    return null;
}

function getCivilDateParts(
    formatter: Intl.DateTimeFormat,
    value: Date,
): Intl.DateTimeFormatPart[] | null {
    const instant = createCivilDateInstant(value, formatter.resolvedOptions().timeZone);
    return instant ? formatter.formatToParts(instant) : null;
}

function formatCivilDate(formatter: Intl.DateTimeFormat, value: Date): string {
    const instant = createCivilDateInstant(value, formatter.resolvedOptions().timeZone);
    return instant ? formatter.format(instant) : '';
}

function getDatePartStyle(
    part: DatePart,
    partValue: string,
    options: Intl.ResolvedDateTimeFormatOptions,
): DatePartStyle | null {
    const configuredStyle = options[part];
    if (part === 'month' && configuredStyle && !['numeric', '2-digit'].includes(configuredStyle)) {
        return 'named';
    }
    if (configuredStyle === '2-digit') return '2-digit';
    if (configuredStyle === 'numeric') return 'numeric';
    if (!/^[0-9]+$/.test(partValue)) return part === 'month' ? 'named' : null;
    return part === 'year' && partValue.length === 2 ? '2-digit' : 'numeric';
}

function getDatePartPattern(field: DateField): string {
    if (field.style === 'named') return '(.+?)';
    if (field.part === 'day' || field.part === 'month' || field.style === '2-digit') {
        return '([0-9]{1,2})';
    }
    return '([0-9]+)';
}

function getLiteralPattern(
    value: string,
    digitMap: ReadonlyMap<string, string>,
    locale: string,
): string {
    const normalized = normalizeLocalizedText(value, digitMap, locale);
    if (!normalized) return '';
    return /^[\p{P}\p{Z}\s]+$/u.test(normalized)
        ? flexibleLiteralPattern
        : escapeRegExp(normalized);
}

function createDatePattern(
    formatter: Intl.DateTimeFormat,
    digitMap: ReadonlyMap<string, string>,
): { fields: DateField[]; pattern: RegExp } | null {
    const fields: DateField[] = [];
    const resolvedOptions = formatter.resolvedOptions();
    const parts = getCivilDateParts(formatter, new Date(2001, 10, 22));
    if (!parts) return null;
    const patternParts: string[] = [];

    for (const part of parts) {
        if (part.type === 'literal') {
            patternParts.push(getLiteralPattern(part.value, digitMap, resolvedOptions.locale));
            continue;
        }

        if (part.type === 'weekday' || part.type === 'era') {
            patternParts.push('(?:.+?)');
            continue;
        }
        if (part.type !== 'day' && part.type !== 'month' && part.type !== 'year') return null;
        if (fields.some((field) => field.part === part.type)) return null;

        const normalizedPart = normalizeLocalizedValue(part.value, digitMap);
        const style = getDatePartStyle(part.type, normalizedPart, resolvedOptions);
        if (!style) return null;
        const field = { part: part.type, style };
        fields.push(field);
        patternParts.push(getDatePartPattern(field));
    }

    if (
        !fields.some((field) => field.part === 'day') ||
        !fields.some((field) => field.part === 'month') ||
        !fields.some((field) => field.part === 'year')
    ) {
        return null;
    }

    return {
        fields,
        pattern: new RegExp(`^${patternParts.join('')}$`, 'u'),
    };
}

function getLocalizedMonthMap(
    formatter: Intl.DateTimeFormat,
    digitMap: ReadonlyMap<string, string>,
): ReadonlyMap<string, number | null> {
    const months = new Map<string, number | null>();
    const locale = formatter.resolvedOptions().locale;

    for (let month = 0; month < 12; month += 1) {
        const monthName = getCivilDateParts(formatter, new Date(2000, month, 15))?.find(
            (part) => part.type === 'month',
        )?.value;
        if (!monthName) continue;

        const normalized = normalizeLocalizedText(monthName, digitMap, locale);
        months.set(normalized, months.has(normalized) ? null : month + 1);
    }

    return months;
}

function getCalendarYearOffset(calendar: string): number | null {
    if (calendar === 'buddhist') return 543;
    if (calendar === 'gregory' || calendar === 'iso8601') return 0;
    return null;
}

function getGregorianYear(
    displayedYear: number,
    yearStyle: DatePartStyle,
    calendarYearOffset: number,
): number {
    if (yearStyle !== '2-digit') return displayedYear - calendarYearOffset;

    const gregorianYear = (displayedYear - (calendarYearOffset % 100) + 100) % 100;
    return 2000 + gregorianYear;
}

function getParsedDate(
    match: RegExpExecArray,
    fields: readonly DateField[],
    formatter: Intl.DateTimeFormat,
    digitMap: ReadonlyMap<string, string>,
): Date | null {
    const values = Object.fromEntries(fields.map((field, index) => [field.part, match[index + 1]]));
    const resolvedOptions = formatter.resolvedOptions();
    const calendarYearOffset = getCalendarYearOffset(resolvedOptions.calendar);
    if (calendarYearOffset === null) return null;

    const yearField = fields.find((field) => field.part === 'year');
    const monthField = fields.find((field) => field.part === 'month');
    if (!yearField || !monthField) return null;

    const displayedYear = Number(values.year);
    const day = Number(values.day);
    const month =
        monthField.style === 'named'
            ? (getLocalizedMonthMap(formatter, digitMap).get(values.month) ?? null)
            : Number(values.month);
    if (
        !Number.isInteger(displayedYear) ||
        !Number.isInteger(day) ||
        month === null ||
        !Number.isInteger(month)
    ) {
        return null;
    }

    const year = getGregorianYear(displayedYear, yearField.style, calendarYearOffset);
    const parsed = new Date(0);
    parsed.setHours(0, 0, 0, 0);
    parsed.setFullYear(year, month - 1, day);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

function normalizeComparableValue(
    value: string,
    digitMap: ReadonlyMap<string, string>,
    locale: string,
): string {
    return normalizeLocalizedText(value, digitMap, locale)
        .replace(/[0-9]+/g, (digits) => String(Number(digits)))
        .replace(/[\p{P}\p{Z}\s]+/gu, ' ')
        .trim();
}

/**
 * Parses ISO date keys or supported locale values produced by `formatDatePickerValue`.
 *
 * Locale parsing supports Gregorian, ISO 8601, and Buddhist date-only formats.
 * Two-digit years resolve to the corresponding Gregorian year from 2000 through 2099.
 */
export function parseDatePickerValue(
    value: string,
    locale?: string,
    format: Intl.DateTimeFormatOptions = defaultDatePickerFormat,
): Date | null {
    const normalized = value.trim();
    if (!normalized) return null;

    const isoDate = parseDateKey(normalized);
    if (isoDate) return isoDate;

    const formatter = new Intl.DateTimeFormat(locale, format);
    const resolvedOptions = formatter.resolvedOptions();
    if (getCalendarYearOffset(resolvedOptions.calendar) === null) return null;

    const digitMap = getDigitMap(locale, resolvedOptions.numberingSystem);
    const localizedValue = normalizeLocalizedText(normalized, digitMap, resolvedOptions.locale);
    const datePattern = createDatePattern(formatter, digitMap);
    if (!datePattern) return null;

    const match = datePattern.pattern.exec(localizedValue);
    if (!match) return null;

    const parsed = getParsedDate(match, datePattern.fields, formatter, digitMap);
    if (!parsed) return null;

    const formatted = formatCivilDate(formatter, parsed);
    return normalizeComparableValue(formatted, digitMap, resolvedOptions.locale) ===
        normalizeComparableValue(localizedValue, digitMap, resolvedOptions.locale)
        ? parsed
        : null;
}

export function normalizeDatePickerValue(value: Date | null | undefined): Date | null {
    return normalizeDate(value);
}
