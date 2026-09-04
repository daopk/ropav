import { createCalendar } from "@internationalized/date";

/**
 * The factory that can build any calendar system, for an app serving a locale that uses one.
 *
 * The calendars, fields and pickers default to Gregorian instead. A factory that answers for any
 * identifier has to carry the arithmetic for every system behind it, none of which a Gregorian
 * locale ever reads, and nothing about a static default can be dropped by a build. Passing this
 * back opts into the lot:
 *
 * ```vue
 * <DatePicker :create-calendar="createCalendar" />
 * ```
 */
export { createCalendar };
