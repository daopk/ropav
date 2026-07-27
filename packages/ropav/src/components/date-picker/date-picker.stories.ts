import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ref } from 'vue';
import DatePicker from './date-picker.vue';

const meta = {
    title: 'Components/Forms/Date Picker',
    component: DatePicker as any,
    tags: ['autodocs'],
    argTypes: {
        getDayAriaLabel: { control: false },
    },
    args: {
        defaultValue: new Date(2026, 6, 14),
        locale: 'en-US',
        firstDayOfWeek: 0,
        placeholder: 'Select date',
        allowInput: false,
        clearable: true,
        closeOnSelect: true,
        disabled: false,
        readonly: false,
        ariaLabel: 'Date',
        calendarAriaLabel: 'Choose a date',
    },
    render: (args) => ({
        components: { DatePicker },
        setup() {
            const value = ref<Date | null>(args.defaultValue ?? null);
            return { args, value };
        },
        template: '<DatePicker v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const input = canvasElement.querySelector<HTMLInputElement>('input')!;
        await userEvent.click(input);

        const calendarId = input.getAttribute('aria-controls')!;
        const calendarDialog = input.ownerDocument.getElementById(calendarId)!;
        await waitFor(() => expect(calendarDialog).toBeVisible());

        const day = calendarDialog.querySelector<HTMLButtonElement>('[data-date="2026-07-20"]')!;
        await userEvent.click(day);
        await expect(input).toHaveValue('07/20/2026');
        await waitFor(() => expect(calendarDialog).not.toBeInTheDocument());
    },
};

export const Editable: Story = {
    args: { allowInput: true },
};

export const DateConstraints: Story = {
    args: {
        min: new Date(2026, 6, 5),
        max: new Date(2026, 6, 25),
        disabledDates: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
    },
};

export const WithoutValue: Story = {
    args: { defaultValue: null },
};

export const Readonly: Story = {
    args: { readonly: true },
};

export const Disabled: Story = {
    args: { disabled: true },
};
