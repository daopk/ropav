import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconSparkles from '~icons/lucide/sparkles';
import Button from '../button/button.vue';
import Alert from './alert.vue';
import { alertColors, alertRadiuses, alertVariants } from './types';

const meta = {
    title: 'Components/Alert',
    component: Alert as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: [undefined, ...alertVariants],
        },
        color: {
            control: 'text',
        },
        radius: {
            control: 'select',
            options: [undefined, ...alertRadiuses],
        },
        role: {
            control: 'select',
            options: ['alert', 'status', 'none'],
        },
        showIcon: { control: 'boolean' },
        closable: { control: 'boolean' },
        closeLabel: { control: 'text' },
        title: { control: 'text' },
        description: { control: 'text' },
    },
    args: {
        title: 'Deployment queued',
        description: 'The production rollout will start soon.',
        showIcon: true,
        closable: false,
    },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: `
            <Alert v-bind="args" style="max-width: 520px;">
                Review the release notes before approving the rollout.
            </Alert>
        `,
    }),
};

export const Variants: Story = {
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args, alertVariants }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 560px;">
                <Alert v-for="variant in alertVariants" :key="variant" v-bind="args" :variant="variant" title="Release status">
                    {{ variant }}
                </Alert>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args, alertColors }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 560px;">
                <Alert v-for="color in alertColors" :key="color" v-bind="args" variant="surface" :color="color" :title="color">
                    The alert adopts the selected color tokens.
                </Alert>
            </div>
        `,
    }),
};

export const Slots: Story = {
    render: (args) => ({
        components: { Alert, Button, IconSparkles },
        setup: () => ({ args }),
        template: `
            <Alert v-bind="args" color="secondary" variant="surface" style="max-width: 560px;">
                <template #icon>
                    <IconSparkles />
                </template>

                <template #title>
                    Upgrade available
                </template>

                A new version is ready to install.

                <template #action>
                    <Button type="button" size="sm" variant="outline" color="secondary">Install</Button>
                </template>
            </Alert>
        `,
    }),
};

export const Dismissible: Story = {
    args: {
        closable: true,
        color: 'warning',
        variant: 'surface',
        title: 'Unsaved changes',
        description: 'Save your work before leaving this page.',
    },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args" style="max-width: 520px;" />',
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args, alertRadiuses }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 560px;">
                <Alert v-for="radius in alertRadiuses" :key="radius" v-bind="args" :radius="radius" :title="radius">
                    Radius example
                </Alert>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
        variant: 'surface',
        title: 'Custom accent',
        description: 'The custom color is projected into alert CSS variables.',
    },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args" style="max-width: 520px;" />',
    }),
};
