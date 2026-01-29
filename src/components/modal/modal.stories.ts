import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Modal from './modal.vue';
import { ref } from 'vue';

const meta = {
    title: 'Components/Modal',
    component: Modal as any,
    tags: ['autodocs'],
    argTypes: {
        title: { control: 'text' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        closable: { control: 'boolean' },
        closeOnOverlay: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
    },
    args: {
        title: 'Modal Title',
        size: 'md',
        closable: true,
        closeOnOverlay: true,
        closeOnEscape: true,
    },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => ({
        components: { Modal },
        setup() {
            const open = ref(false);
            return { args, open };
        },
        template: `
            <button @click="open = true" style="padding: 8px 16px;">Open Modal</button>
            <Modal v-bind="args" v-model="open">
                <p>This is the modal body content. You can put anything here.</p>
            </Modal>
        `,
    }),
};

export const WithFooter: Story = {
    render: (args) => ({
        components: { Modal },
        setup() {
            const open = ref(false);
            return { args, open };
        },
        template: `
            <button @click="open = true" style="padding: 8px 16px;">Open Modal</button>
            <Modal v-bind="args" v-model="open" title="Confirm Action" show-footer>
                <p>Are you sure you want to proceed with this action?</p>
                <template #footer>
                    <button @click="open = false" style="padding: 6px 14px;">Cancel</button>
                    <button @click="open = false" style="padding: 6px 14px; background: #3b82f6; color: white; border: none; border-radius: 6px;">Confirm</button>
                </template>
            </Modal>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Modal },
        setup() {
            const sm = ref(false);
            const md = ref(false);
            const lg = ref(false);
            return { sm, md, lg };
        },
        template: `
            <div style="display: flex; gap: 8px;">
                <button @click="sm = true" style="padding: 8px 16px;">Small</button>
                <button @click="md = true" style="padding: 8px 16px;">Medium</button>
                <button @click="lg = true" style="padding: 8px 16px;">Large</button>
            </div>
            <Modal v-model="sm" title="Small Modal" size="sm">
                <p>A small modal dialog.</p>
            </Modal>
            <Modal v-model="md" title="Medium Modal" size="md">
                <p>A medium modal dialog.</p>
            </Modal>
            <Modal v-model="lg" title="Large Modal" size="lg">
                <p>A large modal dialog.</p>
            </Modal>
        `,
    }),
};
