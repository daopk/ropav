import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Alert from './alert.vue';

const meta = {
    title: 'Components/Alert',
    component: Alert as any,
    tags: ['autodocs'],
    argTypes: {
        color: {
            control: 'select',
            options: ['info', 'success', 'warning', 'danger'],
        },
        variant: {
            control: 'select',
            options: ['subtle', 'solid', 'outline'],
        },
        closable: { control: 'boolean' },
        title: { control: 'text' },
    },
    args: {
        color: 'info',
        variant: 'subtle',
        closable: false,
    },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args">This is an alert message.</Alert>',
    }),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Colors: Story = {
    render: () => ({
        components: { Alert },
        template: `
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
                <Alert color="info">This is an informational message.</Alert>
                <Alert color="success">Operation completed successfully.</Alert>
                <Alert color="warning">Please review before proceeding.</Alert>
                <Alert color="danger">An error has occurred.</Alert>
            </div>
        `,
    }),
};

export const Solid: Story = {
    render: () => ({
        components: { Alert },
        template: `
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
                <Alert variant="solid" color="info">Solid info alert.</Alert>
                <Alert variant="solid" color="success">Solid success alert.</Alert>
                <Alert variant="solid" color="warning">Solid warning alert.</Alert>
                <Alert variant="solid" color="danger">Solid danger alert.</Alert>
            </div>
        `,
    }),
};

export const Outline: Story = {
    render: () => ({
        components: { Alert },
        template: `
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
                <Alert variant="outline" color="info">Outline info alert.</Alert>
                <Alert variant="outline" color="success">Outline success alert.</Alert>
                <Alert variant="outline" color="warning">Outline warning alert.</Alert>
                <Alert variant="outline" color="danger">Outline danger alert.</Alert>
            </div>
        `,
    }),
};

export const WithTitle: Story = {
    args: {
        title: 'Heads up!',
        color: 'warning',
    },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args">You have unsaved changes that will be lost.</Alert>',
    }),
};

export const Closable: Story = {
    args: { closable: true, title: 'Dismissible' },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args">Click the close button to dismiss this alert.</Alert>',
    }),
};
