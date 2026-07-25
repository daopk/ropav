import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import Field from '../field/field.vue';
import Dropzone from './dropzone.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

const meta = {
    title: 'Components/Dropzone',
    component: Dropzone as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: false },
        accept: { control: 'text' },
        capture: { control: 'select', options: [undefined, 'user', 'environment'] },
        multiple: { control: 'boolean' },
        maxFiles: { control: 'number' },
        maxSize: { control: 'number' },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        label: { control: 'text' },
        description: { control: 'text' },
        activateOnClick: { control: 'boolean' },
        activateOnKeyboard: { control: 'boolean' },
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
        inputAttrs: { control: false },
    },
    args: {
        name: 'attachments',
        accept: 'image/*,.pdf',
        multiple: true,
        maxFiles: 3,
        maxSize: 5_000_000,
        size: undefined,
        radius: undefined,
        label: undefined,
        description: 'Images or PDF files, up to 5 MB each.',
        activateOnClick: true,
        activateOnKeyboard: true,
        disabled: false,
        required: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { Dropzone, Field },
        setup() {
            const files = ref<File[]>([]);
            return { args, files };
        },
        template: `
            <form data-testid="form">
                <Field
                    id="dropzone-default"
                    label="Attachments"
                    description="Add supporting files."
                    v-slot="{ controlProps }"
                    style="max-width: 560px;"
                >
                    <Dropzone v-bind="{ ...controlProps, ...args }" v-model="files">
                        <template #default="{ files: selectedFiles, status }">
                            <strong>
                                {{ status === 'reject'
                                    ? 'Some files are not accepted'
                                    : status === 'accept'
                                      ? 'Drop files here'
                                      : 'Drag files here or click to browse' }}
                            </strong>
                            <span style="color: var(--rp-color-dimmed);">
                                {{ selectedFiles.length
                                    ? selectedFiles.map((file) => file.name).join(', ')
                                    : args.description }}
                            </span>
                        </template>
                    </Dropzone>
                </Field>
            </form>
        `,
    }),
} satisfies Meta<typeof Dropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText('Attachments') as HTMLInputElement;
        const root = input.closest('.rp-dropzone')!;
        const form = canvas.getByTestId('form') as HTMLFormElement;
        const file = new File(['report'], 'report.pdf', { type: 'application/pdf' });
        const transfer = new DataTransfer();

        transfer.items.add(file);
        root.dispatchEvent(
            new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: transfer,
            }),
        );

        await waitFor(() => expect(canvas.getByText('report.pdf')).toBeInTheDocument());
        await expect((new FormData(form).get('attachments') as File).name).toBe('report.pdf');
    },
};

export const SingleFile: Story = {
    args: {
        multiple: false,
        maxFiles: undefined,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const ValidationStates: Story = {
    render: () => ({
        components: { Dropzone },
        template: `
            <div style="display: grid; gap: 16px; max-width: 560px;">
                <Dropzone aria-label="Valid dropzone" valid />
                <Dropzone aria-label="Invalid dropzone" invalid />
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Dropzone },
        setup: () => ({ sizes }),
        template: `
            <div style="display: grid; gap: 16px; max-width: 560px;">
                <Dropzone
                    v-for="size in sizes"
                    :key="size"
                    :aria-label="'Dropzone size ' + size"
                    :size="size"
                />
            </div>
        `,
    }),
};
