import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent } from 'storybook/test';
import { ref } from 'vue';
import Calendar from './calendar.vue';

const meta = {
    title: 'Components/Forms/Calendar',
    component: Calendar as any,
    tags: ['autodocs'],
    argTypes: {
        getDayAriaLabel: { control: false },
        showHeader: { control: 'boolean' },
    },
    args: {
        defaultMonth: new Date(2026, 6, 1),
        locale: 'en-US',
        firstDayOfWeek: 0,
        fixedWeeks: true,
        hideOutsideDates: false,
        showHeader: true,
        disabled: false,
        readonly: false,
        size: 'md',
        radius: 'sm',
        ariaLabel: 'Choose a date',
    },
    render: (args) => ({
        components: { Calendar },
        setup() {
            const value = ref<Date | null>(args.modelValue ?? null);
            return { args, value };
        },
        template: '<Calendar v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const day = canvasElement.querySelector<HTMLButtonElement>('[data-date="2026-07-14"]')!;
        await userEvent.click(day);
        await expect(day).toHaveAttribute('data-selected');
        await expect(day.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    },
};

export const WithValue: Story = {
    args: { modelValue: new Date(2026, 6, 14) },
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const day = canvasElement.querySelector<HTMLButtonElement>('[data-date="2026-07-14"]')!;
        await expect(day).toHaveAttribute('data-selected');
        await expect(day.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    },
};

export const MondayFirst: Story = {
    args: { firstDayOfWeek: 1 },
};

export const DateConstraints: Story = {
    args: {
        min: new Date(2026, 6, 5),
        max: new Date(2026, 6, 25),
        disabledDates: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
    },
};

export const WithoutOutsideDates: Story = {
    args: { hideOutsideDates: true, fixedWeeks: false },
};

export const WithoutHeader: Story = {
    args: { showHeader: false },
};

export const Readonly: Story = {
    args: { modelValue: new Date(2026, 6, 14), readonly: true },
};

export const Disabled: Story = {
    args: { modelValue: new Date(2026, 6, 14), disabled: true },
};
