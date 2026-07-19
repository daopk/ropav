import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Accordion from './accordion.vue';
import AccordionItem from './accordion-item.vue';

const wrapperStyle = {
    boxSizing: 'border-box',
    display: 'grid',
    gap: '16px',
    width: 'min(640px, 100%)',
    padding: '24px',
};

const bodyStyle = {
    display: 'grid',
    gap: '8px',
};

const items = [
    {
        value: 'overview',
        title: 'Overview',
        body: 'A compact summary for the current section with the most useful next details.',
    },
    {
        value: 'activity',
        title: 'Activity',
        body: 'Recent changes, timestamps, and short notes fit well inside accordion panels.',
    },
    {
        value: 'access',
        title: 'Access',
        body: 'Use disabled items for sections that are visible but unavailable in the current state.',
    },
] as const;

const meta = {
    title: 'Components/Accordion',
    component: Accordion as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: false },
        defaultValue: { control: 'text' },
        multiple: { control: 'boolean' },
        collapsible: { control: 'boolean' },
        disabled: { control: 'boolean' },
        unmountOnExit: { control: 'boolean' },
    },
    args: {
        modelValue: undefined,
        defaultValue: 'overview',
        multiple: false,
        collapsible: true,
        disabled: false,
        unmountOnExit: false,
    },
    render: (args) => ({
        components: { Accordion, AccordionItem },
        setup() {
            return { args, bodyStyle, items, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Accordion v-bind="args">
                    <AccordionItem
                        v-for="item in items"
                        :key="item.value"
                        :value="item.value"
                        :title="item.title"
                    >
                        <div :style="bodyStyle">
                            <span>{{ item.body }}</span>
                        </div>
                    </AccordionItem>
                </Accordion>
            </div>
        `,
    }),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
    args: {
        defaultValue: ['overview', 'activity'],
        multiple: true,
    },
};

export const NonCollapsible: Story = {
    args: {
        collapsible: false,
        defaultValue: 'overview',
    },
};

export const WithDisabledItem: Story = {
    render: (args) => ({
        components: { Accordion, AccordionItem },
        setup() {
            return { args, bodyStyle, items, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Accordion v-bind="args">
                    <AccordionItem value="overview" title="Overview">
                        <div :style="bodyStyle">
                            <span>{{ items[0].body }}</span>
                        </div>
                    </AccordionItem>
                    <AccordionItem value="activity" title="Activity">
                        <div :style="bodyStyle">
                            <span>{{ items[1].body }}</span>
                        </div>
                    </AccordionItem>
                    <AccordionItem value="access" title="Access" disabled>
                        <div :style="bodyStyle">
                            <span>{{ items[2].body }}</span>
                        </div>
                    </AccordionItem>
                </Accordion>
            </div>
        `,
    }),
};

export const Controlled: Story = {
    render: () => ({
        components: { Accordion, AccordionItem },
        setup() {
            const value = ref('overview');
            return { bodyStyle, items, value, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Accordion v-model="value">
                    <AccordionItem
                        v-for="item in items"
                        :key="item.value"
                        :value="item.value"
                        :title="item.title"
                    >
                        <div :style="bodyStyle">
                            <span>{{ item.body }}</span>
                        </div>
                    </AccordionItem>
                </Accordion>
            </div>
        `,
    }),
};
