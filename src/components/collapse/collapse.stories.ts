import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import IconChevronDown from '~icons/lucide/chevron-down';
import Button from '../button/button.vue';
import Collapse from './collapse.vue';
import { useCollapse } from './useCollapse';

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

const headlessPanelStyle = {
    display: 'grid',
    gap: '8px',
    marginTop: '12px',
    padding: '16px',
    color: 'var(--rp-color-text)',
    lineHeight: 'var(--rp-line-height-normal)',
    border: 'var(--rp-border-width-thin) solid var(--rp-color-border)',
    borderRadius: 'var(--rp-radius-sm)',
};

const meta = {
    title: 'Components/Collapse',
    component: Collapse as any,
    tags: ['autodocs'],
    argTypes: {
        open: { control: 'boolean' },
        disabled: { control: 'boolean' },
        unmountOnExit: { control: 'boolean' },
        role: {
            control: 'select',
            options: ['region', 'group'],
        },
    },
    args: {
        open: undefined,
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
    render: (args) => ({
        components: { Button, Collapse, IconChevronDown },
        setup() {
            const open = ref(true);
            return { args, open, panelStyle, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Collapse v-bind="args" :open="open" id="story-collapse-open" @update:open="open = $event">
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
};

export const UnmountOnExit: Story = {
    args: {
        unmountOnExit: true,
    },
};

export const Composable: Story = {
    render: () => ({
        components: { Button, IconChevronDown },
        setup() {
            const open = ref(false);
            const collapse = useCollapse({
                id: 'story-headless-collapse',
                open,
                ariaLabel: 'Additional details',
                onOpenChange(nextOpen) {
                    open.value = nextOpen;
                },
            });

            return {
                ...collapse,
                headlessPanelStyle,
                wrapperStyle,
            };
        },
        template: `
            <div :style="wrapperStyle">
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

                <section
                    v-if="shouldRenderContent"
                    v-bind="contentProps"
                    :style="{
                        ...headlessPanelStyle,
                        display: isOpen ? undefined : 'none',
                    }"
                >
                    <strong>Summary</strong>
                    <span>This story renders custom markup with the public composable.</span>
                </section>
            </div>
        `,
    }),
};
