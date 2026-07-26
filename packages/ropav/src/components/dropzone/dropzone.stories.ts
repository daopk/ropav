import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import Field from '../field/field.vue';
import Dropzone from './dropzone.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

const meta = {
    title: 'Components/Forms/Dropzone',
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

export const ControlledInitialFiles: Story = {
    tags: ['test'],
    render: () => ({
        components: { Dropzone },
        setup() {
            const files = ref([new File(['initial'], 'initial.pdf', { type: 'application/pdf' })]);
            return { files };
        },
        template: `
            <form data-testid="form">
                <Dropzone
                    v-model="files"
                    name="attachments"
                    aria-label="Initial attachments"
                />
            </form>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const form = canvas.getByTestId('form') as HTMLFormElement;

        await waitFor(() =>
            expect((new FormData(form).get('attachments') as File).name).toBe('initial.pdf'),
        );
    },
};

export const DropCallbackUsesAcceptedFormFiles: Story = {
    tags: ['test'],
    render: () => ({
        components: { Dropzone },
        setup() {
            const files = ref<File[]>([]);
            const form = ref<HTMLFormElement | null>(null);
            const callbackFileNames = ref('');

            function captureFormFiles() {
                callbackFileNames.value = Array.from(
                    new FormData(form.value!).getAll('attachments'),
                    (value) => (value as File).name,
                ).join(',');
            }

            return { callbackFileNames, captureFormFiles, files, form };
        },
        template: `
            <form ref="form" data-testid="form">
                <Dropzone
                    v-model="files"
                    name="attachments"
                    aria-label="Callback attachments"
                    accept=".pdf"
                    multiple
                    @drop="captureFormFiles"
                />
                <output data-testid="callback-file-names">{{ callbackFileNames }}</output>
            </form>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText('Callback attachments') as HTMLInputElement;
        const root = input.closest('.rp-dropzone')!;
        const transfer = new DataTransfer();

        transfer.items.add(new File(['accepted'], 'accepted.pdf', { type: 'application/pdf' }));
        transfer.items.add(new File(['rejected'], 'rejected.txt', { type: 'text/plain' }));
        root.dispatchEvent(
            new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: transfer,
            }),
        );

        await waitFor(() =>
            expect(canvas.getByTestId('callback-file-names')).toHaveTextContent('accepted.pdf'),
        );
    },
};

export const RejectCallbackRestoresPreviousFormFiles: Story = {
    tags: ['test'],
    render: () => ({
        components: { Dropzone },
        setup() {
            const files = ref([
                new File(['previous'], 'previous.pdf', { type: 'application/pdf' }),
            ]);
            const form = ref<HTMLFormElement | null>(null);
            const callbackFileNames = ref('');

            function captureFormFiles() {
                callbackFileNames.value = Array.from(
                    new FormData(form.value!).getAll('attachments'),
                    (value) => (value as File).name,
                ).join(',');
            }

            return { callbackFileNames, captureFormFiles, files, form };
        },
        template: `
            <form ref="form">
                <Dropzone
                    v-model="files"
                    name="attachments"
                    aria-label="Rejected attachments"
                    accept=".pdf"
                    @reject="captureFormFiles"
                />
                <output data-testid="rejected-file-names">{{ callbackFileNames }}</output>
            </form>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText('Rejected attachments') as HTMLInputElement;
        const transfer = new DataTransfer();

        transfer.items.add(new File(['rejected'], 'rejected.txt', { type: 'text/plain' }));
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));

        await waitFor(() =>
            expect(canvas.getByTestId('rejected-file-names')).toHaveTextContent('previous.pdf'),
        );
    },
};

export const KeyboardActivationDisabled: Story = {
    tags: ['test'],
    render: () => ({
        components: { Dropzone },
        setup() {
            const clickCount = ref(0);
            const inputAttrs = {
                onClick(event: MouseEvent) {
                    event.preventDefault();
                    clickCount.value += 1;
                },
            };
            return { clickCount, inputAttrs };
        },
        template: `
            <div>
                <Dropzone
                    aria-label="Keyboard-disabled attachments"
                    :activate-on-keyboard="false"
                    :input-attrs="inputAttrs"
                />
                <output data-testid="click-count">{{ clickCount }}</output>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText('Keyboard-disabled attachments') as HTMLInputElement;

        input.focus();
        await userEvent.keyboard('{Enter} ');

        await expect(canvas.getByTestId('click-count')).toHaveTextContent('0');
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
