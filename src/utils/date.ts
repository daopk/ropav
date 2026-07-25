export function isValidDate(value: unknown): value is Date {
    return value instanceof Date && Number.isFinite(value.getTime());
}

export function toLocalDate(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function toDateKey(value: Date): string {
    const year = String(value.getFullYear()).padStart(4, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date | null {
    const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const parsed = new Date(year, month, day);

    if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
        return null;
    }

    return parsed;
}

export function compareDates(left: Date, right: Date): number {
    return toLocalDate(left).getTime() - toLocalDate(right).getTime();
}

export function isSameDate(left: Date | null | undefined, right: Date | null | undefined) {
    return Boolean(left && right && compareDates(left, right) === 0);
}

export function isSameMonth(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function endOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

export function addCalendarDays(value: Date, amount: number): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount);
}

export function addCalendarMonths(value: Date, amount: number): Date {
    const day = value.getDate();
    const result = new Date(value.getFullYear(), value.getMonth() + amount, 1);
    result.setDate(Math.min(day, endOfMonth(result).getDate()));
    return result;
}

export function addCalendarYears(value: Date, amount: number): Date {
    const result = new Date(value.getFullYear() + amount, value.getMonth(), 1);
    result.setDate(Math.min(value.getDate(), endOfMonth(result).getDate()));
    return result;
}
