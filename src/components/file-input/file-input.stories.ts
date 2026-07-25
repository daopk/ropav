import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import Field from '../field/field.vue';
import FileInput from './file-input.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/FileInput',
    component: FileInput as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: false },
        accept: { control: 'text' },
        multiple: { control: 'boolean' },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        buttonLabel: { control: 'text' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
        inputAttrs: { control: false },
    },
    args: {
        name: 'attachment',
        accept: '',
        multiple: false,
        size: undefined,
        radius: undefined,
        buttonLabel: undefined,
        placeholder: undefined,
        disabled: false,
        required: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { Field, FileInput },
        setup() {
            const files = ref<File[]>([]);
            return { args, files };
        },
        template: `
            <form data-testid="form">
                <Field
                    id="file-input-default"
                    label="Attachment"
                    description="PDF or image, up to 10 MB."
                    v-slot="{ controlProps }"
                    style="max-width: 420px;"
                >
                    <FileInput v-bind="{ ...controlProps, ...args }" v-model="files" />
                </Field>
            </form>
        `,
    }),
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText('Attachment') as HTMLInputElement;
        const form = canvas.getByTestId('form') as HTMLFormElement;
        const file = new File(['report'], 'report.pdf', { type: 'application/pdf' });
        const transfer = new DataTransfer();

        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));

        await expect(input.files).toHaveLength(1);
        await waitFor(() => expect(canvas.getByText('report.pdf')).toBeInTheDocument());
        await expect((new FormData(form).get('attachment') as File).name).toBe('report.pdf');
    },
};

export const Multiple: Story = {
    args: {
        accept: 'image/*',
        multiple: true,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const ValidationStates: Story = {
    render: () => ({
        components: { FileInput },
        template: `
            <div style="display: grid; gap: 12px; max-width: 420px;">
                <FileInput aria-label="Valid file input" valid />
                <FileInput aria-label="Invalid file input" invalid />
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { FileInput },
        setup: () => ({ sizes }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 420px;">
                <FileInput
                    v-for="size in sizes"
                    :key="size"
                    :aria-label="'File input size ' + size"
                    :size="size"
                />
            </div>
        `,
    }),
};

export const CustomContent: Story = {
    render: () => ({
        components: { FileInput },
        setup() {
            const files = ref<File[]>([]);
            return { files };
        },
        template: `
            <FileInput v-model="files" aria-label="Custom attachment" style="max-width: 420px;">
                <template #trigger="{ files: selectedFiles }">
                    {{ selectedFiles.length ? 'Replace' : 'Browse' }}
                </template>
                <template #value="{ fileNames, hasFiles }">
                    {{ hasFiles ? fileNames.join(' · ') : 'Select an attachment' }}
                </template>
            </FileInput>
        `,
    }),
};
