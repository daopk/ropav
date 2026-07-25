import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconColumns from '~icons/lucide/columns-3';
import IconGrid from '~icons/lucide/grid-2x2';
import IconList from '~icons/lucide/list';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import SegmentedControl from './segmented-control.vue';
import {
    segmentedControlColors,
    segmentedControlOrientations,
    segmentedControlRadiuses,
    segmentedControlSizes,
} from './types';

const options = [
    { label: 'List', value: 'list' },
    { label: 'Grid', value: 'grid' },
    { label: 'Board', value: 'board' },
];

const meta = {
    title: 'Components/SegmentedControl',
    component: SegmentedControl as any,
    tags: ['autodocs'],
    argTypes: {
        color: { control: 'select', options: segmentedControlColors },
        size: { control: 'select', options: segmentedControlSizes },
        radius: { control: 'select', options: segmentedControlRadiuses },
        orientation: { control: 'select', options: segmentedControlOrientations },
        fullWidth: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
    args: {
        options,
        defaultValue: 'list',
        color: 'blue',
        size: 'md',
        radius: 'sm',
        orientation: 'horizontal',
        fullWidth: false,
        disabled: false,
        ariaLabel: 'View mode',
    },
    render: (args) => ({
        components: { SegmentedControl },
        setup() {
            const value = ref(args.modelValue ?? args.defaultValue ?? null);
            return { args, value };
        },
        template: '<SegmentedControl v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('input')];
        await expect(inputs[0]).toBeChecked();
        inputs[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(inputs[1]).toBeChecked();
        await expect(inputs[1].closest('label')).toHaveAttribute('data-state', 'checked');
    },
};

export const FullWidth: Story = {
    tags: ['test'],
    args: { fullWidth: true },
    decorators: [
        () => ({
            template:
                '<div data-testid="full-width-stage" style="width: min(560px, 100%);"><story /></div>',
        }),
    ],
    play: ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const stage = canvas.getByTestId('full-width-stage');
        const group = canvas.getByRole('radiogroup', { name: 'View mode' });
        const controlWidths = [...group.querySelectorAll('label')].map(
            (control) => control.getBoundingClientRect().width,
        );

        expect(
            Math.abs(group.getBoundingClientRect().width - stage.getBoundingClientRect().width),
        ).toBeLessThan(1);
        expect(Math.max(...controlWidths) - Math.min(...controlWidths)).toBeLessThan(1);
    },
};

export const Vertical: Story = {
    tags: ['test'],
    args: {
        orientation: 'vertical',
        defaultValue: 'grid',
    },
    play: ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('radiogroup', { name: 'View mode' });
        const radios = canvas.getAllByRole('radio');
        const controlRects = radios.map((radio) => radio.closest('label')!.getBoundingClientRect());

        expect(group).toHaveAttribute('aria-orientation', 'vertical');
        expect(radios[1]).toBeChecked();
        expect(controlRects[1]!.top).toBeGreaterThanOrEqual(controlRects[0]!.bottom);
        expect(controlRects[2]!.top).toBeGreaterThanOrEqual(controlRects[1]!.bottom);
        expect(
            Math.max(...controlRects.map(({ left }) => left)) -
                Math.min(...controlRects.map(({ left }) => left)),
        ).toBeLessThan(1);
        expect(
            Math.max(...controlRects.map(({ width }) => width)) -
                Math.min(...controlRects.map(({ width }) => width)),
        ).toBeLessThan(1);
    },
};

export const Green: Story = {
    tags: ['test'],
    args: {
        color: 'green',
        classNames: { indicator: 'story-segment-indicator' },
    },
    play: ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const selected = canvas.getByRole('radio', { name: 'List' });
        const selectedControl = selected.closest('label')!;
        const indicator = selectedControl.querySelector<HTMLElement>('.story-segment-indicator')!;
        const colorProbe = document.createElement('span');

        colorProbe.style.backgroundColor = 'var(--rp-color-green-filled)';
        selectedControl.append(colorProbe);
        const expectedColor = getComputedStyle(colorProbe).backgroundColor;
        colorProbe.remove();

        expect(getComputedStyle(indicator).backgroundColor).toBe(expectedColor);
    },
};

export const WithDisabledOption: Story = {
    args: {
        options: [
            { label: 'List', value: 'list' },
            { label: 'Grid', value: 'grid', disabled: true },
            { label: 'Board', value: 'board' },
        ],
    },
};

export const WithIcons: Story = {
    render: (args) => ({
        components: { IconColumns, IconGrid, IconList, SegmentedControl },
        setup() {
            const value = ref('list');
            return { args, value };
        },
        template: `
            <SegmentedControl v-bind="args" v-model="value">
                <template #option="{ option }">
                    <IconList v-if="option.value === 'list'" />
                    <IconGrid v-else-if="option.value === 'grid'" />
                    <IconColumns v-else />
                    <span>{{ option.label }}</span>
                </template>
            </SegmentedControl>
        `,
    }),
};
