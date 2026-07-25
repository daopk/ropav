import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';
import {
    click,
    flush,
    input,
    keydown,
    mountDom,
    queryDom,
    waitForAssertion,
} from '../../../tests/utils/vue';
import DatePicker from './date-picker.vue';

describe('DatePicker', () => {
    it('opens an accessible calendar and selects an uncontrolled date', async () => {
        const onUpdate = vi.fn();
        const onChange = vi.fn();
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 10),
                        locale: 'en-US',
                        ariaLabel: 'Appointment date',
                        popoverId: 'appointment-calendar',
                        'onUpdate:modelValue': onUpdate,
                        'onUpdate:open': onOpen,
                        onChange,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        expect(native.value).toBe('07/10/2026');
        expect(native.readOnly).toBe(false);
        expect(native.getAttribute('aria-readonly')).toBe('true');
        expect(native.getAttribute('role')).toBe('combobox');
        expect(native.getAttribute('aria-controls')).toBe('appointment-calendar');
        expect(native.getAttribute('aria-expanded')).toBe('false');
        expect(queryDom(container, '.rp-date-picker__indicator')).toBeNull();

        click(native);
        await flush();

        const calendar = queryDom(container, '.rp-calendar') as HTMLElement;
        const day = queryDom(container, '[data-date="2026-07-14"]') as HTMLButtonElement;
        expect(calendar).toBeTruthy();
        expect(native.getAttribute('aria-expanded')).toBe('true');
        expect(onOpen).toHaveBeenLastCalledWith(true);

        click(day);
        await waitForAssertion(() => {
            expect(queryDom(container, '.rp-calendar')).toBeNull();
        });

        expect(native.value).toBe('07/14/2026');
        expect(onUpdate).toHaveBeenCalledWith(new Date(2026, 6, 14));
        expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 14));
        expect(onOpen).toHaveBeenLastCalledWith(false);
    });

    it('renders an indicator only when a calendar icon is provided', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DatePicker,
                        { toggleLabel: 'Show date choices' },
                        {
                            'calendar-icon': () =>
                                h('span', { class: 'custom-calendar-icon' }, 'Calendar'),
                        },
                    );
                },
            }),
        );

        await flush();

        const indicator = queryDom(container, '.rp-date-picker__indicator') as HTMLButtonElement;
        expect(indicator).toBeTruthy();
        expect(indicator.getAttribute('aria-label')).toBe('Show date choices');
        expect(queryDom(container, '.custom-calendar-icon')).toBeTruthy();

        click(indicator);
        await flush();

        expect(queryDom(container, '.rp-calendar')).toBeTruthy();
    });

    it('supports editable locale and ISO input with validation', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 10),
                        locale: 'en-GB',
                        allowInput: true,
                        min: new Date(2026, 6, 5),
                        max: new Date(2026, 6, 20),
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        expect(native.readOnly).toBe(false);
        expect(native.value).toBe('10/07/2026');

        input(native, '2026-07-14');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith(new Date(2026, 6, 14));
        expect(native.getAttribute('aria-invalid')).toBeNull();

        input(native, '31/02/2026');
        native.dispatchEvent(new FocusEvent('blur'));
        await flush();
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.validationMessage).toBe('Enter a valid date.');

        input(native, '21/07/2026');
        await flush();
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('does not invalidate unchanged text from an unsupported locale calendar', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 14),
                        locale: 'fa-IR',
                        allowInput: true,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        const formatted = native.value;
        native.focus();
        native.blur();
        await flush();

        expect(formatted).not.toBe('');
        expect(native.value).toBe(formatted);
        expect(native.getAttribute('aria-invalid')).toBeNull();
    });

    it('clears without opening and handles keyboard entry into the calendar', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 10),
                        locale: 'en-US',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        const clear = queryDom(container, '.rp-date-picker__clear') as HTMLButtonElement;
        click(clear);
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(null);
        expect(native.value).toBe('');
        expect(queryDom(container, '.rp-date-picker__clear')).toBe(clear);
        expect(clear.classList.contains('rp-date-picker__clear--hidden')).toBe(true);
        expect(clear.disabled).toBe(true);
        expect(clear.getAttribute('aria-hidden')).toBe('true');
        expect(queryDom(container, '.rp-calendar')).toBeNull();

        native.focus();
        keydown(native, 'ArrowDown');
        await flush();

        const focusedDay = queryDom(
            container,
            '.rp-calendar__day[tabindex="0"]',
        ) as HTMLButtonElement;
        expect(document.activeElement).toBe(focusedDay);

        keydown(focusedDay, 'Escape');
        await waitForAssertion(() => {
            expect(queryDom(container, '.rp-calendar')).toBeNull();
        });
        expect(document.activeElement).toBe(native);
    });

    it('focuses a calendar control when no day is selectable', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 10),
                        disabledDates: () => true,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        native.focus();
        keydown(native, 'ArrowDown');
        await flush();

        expect(document.activeElement?.classList.contains('rp-calendar__control')).toBe(true);
    });

    it('restores focus after keyboard selection and keyboard clearing', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 10),
                        locale: 'en-US',
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        native.focus();
        keydown(native, 'ArrowDown');
        await flush();

        const focusedDay = queryDom(
            container,
            '.rp-calendar__day[tabindex="0"]',
        ) as HTMLButtonElement;
        keydown(focusedDay, 'ArrowRight');
        await flush();

        const nextDay = document.activeElement as HTMLButtonElement;
        keydown(nextDay, 'Enter');
        await waitForAssertion(() => {
            expect(queryDom(container, '.rp-calendar')).toBeNull();
        });
        expect(document.activeElement).toBe(native);

        const clear = queryDom(container, '.rp-date-picker__clear') as HTMLButtonElement;
        clear.focus();
        click(clear);
        await flush();

        expect(document.activeElement).toBe(native);
        expect(queryDom(container, '.rp-calendar')).toBeNull();
    });

    it('keeps restored focus when a mounted calendar selects an outside-month day', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        defaultValue: new Date(2026, 6, 10),
                        locale: 'en-US',
                        keepMounted: true,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        native.focus();
        keydown(native, 'ArrowDown');
        await flush();

        const outsideDay = queryDom(container, '[data-date="2026-08-01"]') as HTMLButtonElement;
        outsideDay.focus();
        keydown(outsideDay, 'Enter');
        await flush();

        expect(native.getAttribute('aria-expanded')).toBe('false');
        expect(queryDom(container, '.rp-calendar')).toBeTruthy();
        expect(document.activeElement).toBe(native);
    });

    it('opens through the exposed method while its focused input is closed', async () => {
        const pickerRef = ref<{ open: () => void } | null>(null);
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        ref: pickerRef,
                        defaultValue: new Date(2026, 6, 10),
                        'onUpdate:open': onOpen,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        native.focus();
        await flush();
        keydown(native, 'Escape');
        await waitForAssertion(() => {
            expect(queryDom(container, '.rp-calendar')).toBeNull();
        });
        expect(document.activeElement).toBe(native);

        onOpen.mockClear();
        pickerRef.value?.open();
        await flush();

        expect(queryDom(container, '.rp-calendar')).toBeTruthy();
        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(onOpen).toHaveBeenCalledWith(true);
    });

    it('emits one controlled open request for a pointer click that focuses the input', async () => {
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        open: false,
                        'onUpdate:open': onOpen,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        native.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
        native.focus();
        click(native);
        await flush();

        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(onOpen).toHaveBeenCalledWith(true);
    });

    it('supports controlled values, controlled open state, and Styles API', async () => {
        const state = reactive({
            value: new Date(2026, 6, 10) as Date | null,
            open: false,
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        id: 'travel-date',
                        modelValue: state.value,
                        open: state.open,
                        locale: 'en-US',
                        size: 'lg',
                        radius: 'xl',
                        classNames: {
                            root: 'custom-root',
                            control: 'custom-control',
                            calendarDay: 'custom-day',
                        },
                        styles: { calendarDay: { fontWeight: 700 } },
                        'onUpdate:modelValue': (value: Date | null) => {
                            state.value = value;
                        },
                        'onUpdate:open': (open: boolean) => {
                            state.open = open;
                        },
                    });
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-date-picker') as HTMLElement;
        const native = queryDom(container, 'input') as HTMLInputElement;
        expect(root.classList.contains('custom-root')).toBe(true);
        expect(queryDom(container, '.rp-input')?.classList.contains('custom-control')).toBe(true);
        expect(native.id).toBe('travel-date');

        click(native);
        await flush();

        const day = queryDom(container, '[data-date="2026-07-14"]') as HTMLButtonElement;
        expect(day.classList.contains('custom-day')).toBe(true);
        expect(day.style.fontWeight).toBe('700');
        click(day);
        await flush();
        expect(state.value).toEqual(new Date(2026, 6, 14));
        expect(state.open).toBe(false);
        expect(native.value).toBe('07/14/2026');
    });

    it('restores the authoritative value when controlled updates are rejected', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(DatePicker, {
                            name: 'travel-date',
                            modelValue: new Date(2026, 6, 10),
                            locale: 'en-US',
                            allowInput: true,
                            'onUpdate:modelValue': onUpdate,
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const native = queryDom(container, 'input') as HTMLInputElement;
        click(native);
        await flush();
        click(queryDom(container, '[data-date="2026-07-14"]') as HTMLButtonElement);
        await flush();

        expect(native.value).toBe('07/10/2026');
        expect(new FormData(form).get('travel-date')).toBe('07/10/2026');

        click(queryDom(container, '.rp-date-picker__clear') as HTMLButtonElement);
        await flush();

        expect(native.value).toBe('07/10/2026');
        expect(new FormData(form).get('travel-date')).toBe('07/10/2026');

        input(native, '07/15/2026');
        await flush();

        expect(native.value).toBe('07/10/2026');
        expect(new FormData(form).get('travel-date')).toBe('07/10/2026');
        expect(onUpdate.mock.calls.map(([value]) => value)).toEqual([
            new Date(2026, 6, 14),
            null,
            new Date(2026, 6, 15),
        ]);
    });

    it('honors disabled, readonly, required, and form reset behavior', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', { id: 'booking-form' }, [
                        h(DatePicker, {
                            name: 'booking-date',
                            defaultValue: new Date(2026, 6, 10),
                            locale: 'en-US',
                            allowInput: true,
                            required: true,
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const native = queryDom(container, 'input') as HTMLInputElement;
        input(native, '07/14/2026');
        await flush();
        expect(native.value).toBe('07/14/2026');

        form.reset();
        await flush();
        expect(native.value).toBe('07/10/2026');
        expect(native.name).toBe('booking-date');
        expect(native.required).toBe(true);

        const requiredContainer = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(DatePicker, {
                            name: 'required-date',
                            required: true,
                        }),
                    ]);
                },
            }),
        );
        await flush();
        const requiredForm = requiredContainer.querySelector('form') as HTMLFormElement;
        const requiredInput = queryDom(requiredContainer, 'input') as HTMLInputElement;
        const beforeInput = new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            data: '1',
            inputType: 'insertText',
        });
        requiredInput.dispatchEvent(beforeInput);

        expect(requiredInput.readOnly).toBe(false);
        expect(requiredInput.inputMode).toBe('none');
        expect(requiredInput.willValidate).toBe(true);
        expect(requiredInput.validity.valueMissing).toBe(true);
        expect(requiredInput.checkValidity()).toBe(false);
        expect(requiredForm.checkValidity()).toBe(false);
        expect(beforeInput.defaultPrevented).toBe(true);

        input(requiredInput, 'typed value');
        await flush();
        expect(requiredInput.value).toBe('');

        const readonlyContainer = mountDom(
            defineComponent({
                render() {
                    return h(DatePicker, {
                        modelValue: new Date(2026, 6, 10),
                        readonly: true,
                    });
                },
            }),
        );
        await flush();
        const readonlyInput = queryDom(readonlyContainer, 'input') as HTMLInputElement;
        click(readonlyInput);
        expect(queryDom(readonlyContainer, '.rp-calendar')).toBeNull();
        expect(queryDom(readonlyContainer, '.rp-date-picker__indicator')).toBeNull();
    });
});
