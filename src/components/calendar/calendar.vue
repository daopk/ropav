<template>
    <div v-bind="rootAttrs" ref="rootRef">
        <div v-bind="getPartAttrs('header', { class: 'rp-calendar__header' })">
            <button
                v-bind="
                    getPartAttrs('previousControl', {
                        class: 'rp-calendar__control rp-calendar__control--previous',
                    })
                "
                type="button"
                :aria-label="previousLabel"
                :disabled="previousDisabled"
                @click="navigateMonth(-1)"
            >
                <slot name="previous-icon">
                    <IconChevronLeft aria-hidden="true" />
                </slot>
            </button>
            <span
                :id="monthLabelId"
                v-bind="getPartAttrs('monthLabel', { class: 'rp-calendar__month-label' })"
                aria-live="polite"
            >
                {{ monthLabel }}
            </span>
            <button
                v-bind="
                    getPartAttrs('nextControl', {
                        class: 'rp-calendar__control rp-calendar__control--next',
                    })
                "
                type="button"
                :aria-label="nextLabel"
                :disabled="nextDisabled"
                @click="navigateMonth(1)"
            >
                <slot name="next-icon">
                    <IconChevronRight aria-hidden="true" />
                </slot>
            </button>
        </div>

        <table
            v-bind="getPartAttrs('grid', { class: 'rp-calendar__grid' })"
            role="grid"
            :aria-label="ariaLabel"
            :aria-labelledby="ariaLabel ? undefined : monthLabelId"
            :aria-readonly="readonly || undefined"
            :aria-disabled="disabled || undefined"
        >
            <thead v-bind="getPartAttrs('weekdays', { class: 'rp-calendar__weekdays' })">
                <tr>
                    <th
                        v-for="weekday in weekdays"
                        :key="weekday.key"
                        v-bind="getPartAttrs('weekday', { class: 'rp-calendar__weekday' })"
                        scope="col"
                        :aria-label="weekday.ariaLabel"
                    >
                        {{ weekday.label }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(week, weekIndex) in weeks"
                    :key="weekIndex"
                    v-bind="getPartAttrs('week', { class: 'rp-calendar__week' })"
                >
                    <td
                        v-for="day in week"
                        :key="day.key"
                        v-bind="getPartAttrs('dayCell', { class: 'rp-calendar__day-cell' })"
                        role="gridcell"
                        :aria-selected="day.hidden ? undefined : day.selected"
                    >
                        <button
                            v-if="!day.hidden"
                            v-bind="getDayAttrs(day)"
                            type="button"
                            :disabled="disabled || day.disabled"
                            :aria-label="getDayAriaLabel(day)"
                            :aria-current="day.today ? 'date' : undefined"
                            :tabindex="isFocusable(day) ? 0 : -1"
                            @click="selectDate(day)"
                            @focus="onDayFocus(day)"
                            @keydown="onDayKeydown($event, day)"
                        >
                            <slot name="day" v-bind="day" :select="() => selectDate(day)">
                                {{ day.label }}
                            </slot>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, useId } from 'vue';
import IconChevronLeft from '~icons/lucide/chevron-left';
import IconChevronRight from '~icons/lucide/chevron-right';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { isSameDate, toDateKey } from '@/utils/date';
import type { CalendarDay, CalendarDaySlotProps, CalendarPart, CalendarProps } from './types';
import { useCalendar } from './useCalendar';

defineOptions({ name: 'RpCalendar', inheritAttrs: false });

const props = withDefaults(defineProps<CalendarProps>(), {
    modelValue: undefined,
    defaultValue: null,
    month: undefined,
    defaultMonth: undefined,
    locale: undefined,
    firstDayOfWeek: 0,
    weekdayFormat: 'short',
    monthFormat: undefined,
    fixedWeeks: true,
    hideOutsideDates: false,
    disabled: false,
    readonly: false,
    size: 'md',
    radius: 'sm',
    ariaLabel: undefined,
    previousLabel: 'Previous month',
    nextLabel: 'Next month',
});

const emit = defineEmits<{
    'update:modelValue': [value: Date];
    'update:month': [month: Date];
    change: [value: Date];
}>();

defineSlots<{
    day?(props: CalendarDaySlotProps): unknown;
    'previous-icon'?(): unknown;
    'next-icon'?(): unknown;
}>();

const {
    rootRef,
    visibleMonth,
    weeks,
    weekdays,
    monthLabel,
    rootClass,
    previousDisabled,
    nextDisabled,
    focusableDate,
    selectDate,
    navigateMonth,
    onDayKeydown,
    onDayFocus,
    getDayAriaLabel,
} = useCalendar(props, {
    value: (value) => emit('update:modelValue', value),
    month: (month) => emit('update:month', month),
    change: (value) => emit('change', value),
});
const monthLabelId = `${useId()}-month`;
const { getPartAttrs, getRootAttrs } = useStylesApi<CalendarPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: props.id,
        class: rootClass.value,
        'data-month': toDateKey(visibleMonth.value),
        'data-disabled': toPresenceAttribute(props.disabled),
        'data-readonly': toPresenceAttribute(props.readonly),
    }),
);

function getDayAttrs(day: CalendarDay) {
    return {
        ...getPartAttrs('day', {
            class: [
                'rp-calendar__day',
                {
                    'rp-calendar__day--outside': day.outside,
                    'rp-calendar__day--selected': day.selected,
                    'rp-calendar__day--today': day.today,
                },
            ],
        }),
        'data-date': day.key,
        'data-outside': toPresenceAttribute(day.outside),
        'data-selected': toPresenceAttribute(day.selected),
        'data-today': toPresenceAttribute(day.today),
        'data-disabled': toPresenceAttribute(props.disabled || day.disabled),
    };
}

function isFocusable(day: CalendarDay) {
    return !props.disabled && !day.disabled && isSameDate(day.date, focusableDate.value);
}

defineExpose({
    nativeElement: rootRef,
    focus: () =>
        rootRef.value?.querySelector<HTMLButtonElement>('.rp-calendar__day[tabindex="0"]')?.focus(),
});
</script>

<style src="./calendar.scss" lang="scss" scoped></style>
