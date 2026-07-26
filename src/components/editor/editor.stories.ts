import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { computed, ref } from 'vue';

import Editor from './editor.vue';
import type { EditorModelValue } from './types';

const initialContent = `
    <h2>Zero-VDOM rich text</h2>
    <p>Edit this content directly in Storybook.</p>
    <ul>
        <li>Vue Vapor rendering</li>
        <li>Tiptap editing</li>
        <li>Ropav design tokens</li>
    </ul>
`;

const meta = {
    title: 'Components/Forms/Editor',
    component: Editor as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        defaultValue: { control: 'text' },
        output: {
            control: 'radio',
            options: ['html', 'json'],
        },
        editable: { control: 'boolean' },
        autofocus: { control: 'boolean' },
        injectCSS: { control: 'boolean' },
        extensions: { control: false },
        editorProps: { control: false },
        classNames: { control: false },
        styles: { control: false },
    },
    args: {
        modelValue: initialContent,
        output: 'html',
        editable: true,
        autofocus: false,
        injectCSS: false,
    },
    render: (args) => ({
        components: { Editor },
        setup() {
            const value = ref<EditorModelValue>(args.modelValue ?? args.defaultValue ?? '');
            const serializedValue = computed(() =>
                typeof value.value === 'string'
                    ? value.value
                    : JSON.stringify(value.value, null, 2),
            );

            return { args, serializedValue, value };
        },
        template: `
            <section style="display: grid; gap: 16px; width: min(100%, 720px);">
                <Editor
                    v-bind="args"
                    v-model="value"
                    aria-label="Rich text editor"
                    aria-multiline="true"
                />
                <details>
                    <summary>v-model value</summary>
                    <pre
                        data-testid="editor-model-value"
                        style="overflow: auto; margin-block: 12px 0; padding: 12px; white-space: pre-wrap;"
                    >{{ serializedValue }}</pre>
                </details>
            </section>
        `,
    }),
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const textbox = await canvas.findByRole('textbox', { name: 'Rich text editor' });

        await expect(textbox).toHaveAttribute('contenteditable', 'true');
        await userEvent.click(textbox);
        await userEvent.type(textbox, ' Storybook');

        await waitFor(() => {
            expect(canvas.getByTestId('editor-model-value')).toHaveTextContent('Storybook');
        });
    },
};

export const Readonly: Story = {
    args: {
        editable: false,
        modelValue: `
            <h2>Published content</h2>
            <p>This editor is rendered in read-only mode.</p>
        `,
    },
};

export const JsonOutput: Story = {
    args: {
        modelValue: {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'The model emits Tiptap JSON.' }],
                },
            ],
        },
        output: 'json',
    },
};
