import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconChevronDown from '~icons/lucide/chevron-down';
import Button from '../button/button.vue';
import Collapse from './collapse.vue';

const wrapperStyle = {
    boxSizing: 'border-box',
    display: 'grid',
    gap: '12px',
    width: 'min(520px, 100%)',
    padding: '24px',
};

const panelStyle = {
    display: 'grid',
    gap: '8px',
    padding: '16px 0 0',
};

const meta = {
    title: 'Components/Collapse',
    component: Collapse as any,
    tags: ['autodocs'],
    argTypes: {
        open: { control: 'boolean' },
        defaultOpen: { control: 'boolean' },
        disabled: { control: 'boolean' },
        unmountOnExit: { control: 'boolean' },
        role: {
            control: 'select',
            options: ['region', 'group'],
        },
    },
    args: {
        open: undefined,
        defaultOpen: false,
        disabled: false,
        unmountOnExit: false,
        role: 'region',
    },
    render: (args) => ({
        components: { Button, Collapse, IconChevronDown },
        setup() {
            return { args, panelStyle, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Collapse v-bind="args" id="story-collapse">
                    <template #trigger="{ triggerProps, isOpen }">
                        <Button v-bind="triggerProps" variant="outline">
                            Section details
                            <template #right>
                                <IconChevronDown
                                    aria-hidden="true"
                                    :style="{
                                        transition: 'transform var(--rp-transition-fast)',
                                        transform: isOpen ? 'rotate(180deg)' : undefined,
                                    }"
                                />
                            </template>
                        </Button>
                    </template>

                    <div :style="panelStyle">
                        <strong>Summary</strong>
                        <span>This area can hold supporting content for the current section.</span>
                        <span>Use it for details that are helpful but not always needed.</span>
                    </div>
                </Collapse>
            </div>
        `,
    }),
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InitiallyOpen: Story = {
    args: {
        defaultOpen: true,
    },
};

export const UnmountOnExit: Story = {
    args: {
        unmountOnExit: true,
    },
};
