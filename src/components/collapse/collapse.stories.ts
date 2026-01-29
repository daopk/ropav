import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Collapse from './collapse.vue';
import CollapseItem from './collapse-item.vue';

const meta = {
    title: 'Components/Collapse',
    component: Collapse as any,
    tags: ['autodocs'],
    argTypes: {
        accordion: { control: 'boolean' },
    },
    args: {
        accordion: false,
    },
    render: (args) => ({
        components: { Collapse, CollapseItem },
        setup() {
            const active = ref(['intro']);
            return { args, active };
        },
        template: `
            <Collapse v-bind="args" v-model="active" style="max-width: 500px;">
                <CollapseItem name="intro" title="What is Ropav?">
                    Ropav is a modern Vue component library built with Vue Vapor mode,
                    featuring a clean design system with design tokens and BEM naming.
                </CollapseItem>
                <CollapseItem name="install" title="How to install?">
                    Install via your package manager of choice: pnpm add ropav, npm install ropav,
                    or yarn add ropav.
                </CollapseItem>
                <CollapseItem name="usage" title="How to use?">
                    Import components individually for tree-shaking support.
                    Each component comes with TypeScript types and Storybook documentation.
                </CollapseItem>
            </Collapse>
        `,
    }),
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Accordion: Story = {
    args: { accordion: true },
    render: (args) => ({
        components: { Collapse, CollapseItem },
        setup() {
            const active = ref(['faq1']);
            return { args, active };
        },
        template: `
            <Collapse v-bind="args" v-model="active" style="max-width: 500px;">
                <CollapseItem name="faq1" title="Can I use Ropav with Nuxt?">
                    Yes! Ropav works with any Vue 3 framework including Nuxt, Vite, and Webpack-based setups.
                </CollapseItem>
                <CollapseItem name="faq2" title="Is it accessible?">
                    We strive for WCAG compliance. All interactive components support keyboard navigation
                    and appropriate ARIA attributes.
                </CollapseItem>
                <CollapseItem name="faq3" title="Can I customize the theme?">
                    Absolutely. Override the CSS custom properties (design tokens) to match your brand colors,
                    typography, spacing, and more.
                </CollapseItem>
            </Collapse>
        `,
    }),
};

export const AllExpanded: Story = {
    render: (args) => ({
        components: { Collapse, CollapseItem },
        setup() {
            const active = ref(['a', 'b', 'c']);
            return { args, active };
        },
        template: `
            <Collapse v-bind="args" v-model="active" style="max-width: 500px;">
                <CollapseItem name="a" title="Section A">
                    Content for section A. All panels can be expanded at once in non-accordion mode.
                </CollapseItem>
                <CollapseItem name="b" title="Section B">
                    Content for section B.
                </CollapseItem>
                <CollapseItem name="c" title="Section C">
                    Content for section C.
                </CollapseItem>
            </Collapse>
        `,
    }),
};

export const DisabledItem: Story = {
    render: (args) => ({
        components: { Collapse, CollapseItem },
        setup() {
            const active = ref(['first']);
            return { args, active };
        },
        template: `
            <Collapse v-bind="args" v-model="active" style="max-width: 500px;">
                <CollapseItem name="first" title="Available section">
                    This section can be toggled normally.
                </CollapseItem>
                <CollapseItem name="second" title="Disabled section" disabled>
                    You should not be able to see this unless programmatically opened.
                </CollapseItem>
                <CollapseItem name="third" title="Another available section">
                    This section works as usual.
                </CollapseItem>
            </Collapse>
        `,
    }),
};

export const CustomTitle: Story = {
    render: (args) => ({
        components: { Collapse, CollapseItem },
        setup() {
            const active = ref(['custom']);
            return { args, active };
        },
        template: `
            <Collapse v-bind="args" v-model="active" style="max-width: 500px;">
                <CollapseItem name="custom">
                    <template #title>
                        <span style="color: var(--rp-color-primary); font-weight: 600;">Custom Title via Slot</span>
                    </template>
                    The title above is rendered using a named slot for custom styling.
                </CollapseItem>
                <CollapseItem name="normal" title="Normal title">
                    This one uses a regular string title prop.
                </CollapseItem>
            </Collapse>
        `,
    }),
};
