import type { EditorOptions as TiptapEditorOptions } from '@tiptap/core';

type TiptapEditorProps = NonNullable<TiptapEditorOptions['editorProps']>;

const CONTROL_ATTRIBUTE_PATTERN = /^aria-/;
const protectedEditorProps = new Set([
    'dispatchTransaction',
    'markViews',
    'nodeViews',
    'state',
    'transformPastedHTML',
]);

export interface EditorFallthroughAttributes {
    controlAttributes: Record<string, string>;
    rootAttributes: Record<string, unknown>;
}

export interface ResolvedEditorProps {
    initial: TiptapEditorProps;
    reactive: TiptapEditorProps;
    transformPastedHTML: TiptapEditorProps['transformPastedHTML'];
}

export function splitEditorFallthroughAttributes(
    attributes: Readonly<Record<string, unknown>>,
): EditorFallthroughAttributes {
    const controlAttributes: Record<string, string> = {};
    const rootAttributes: Record<string, unknown> = {};

    for (const [name, value] of Object.entries(attributes)) {
        if (!isControlAttribute(name)) {
            rootAttributes[name] = value;
            continue;
        }
        if (value !== null && value !== undefined) controlAttributes[name] = String(value);
    }

    return { controlAttributes, rootAttributes };
}

export function resolveEditorProps(
    editorProps: TiptapEditorOptions['editorProps'],
    controlAttributes: Readonly<Record<string, string>>,
): ResolvedEditorProps {
    const configuredAttributes = editorProps?.attributes;
    const initialAttributes =
        typeof configuredAttributes === 'function' ? {} : configuredAttributes;
    const reactiveEditorProps = Object.fromEntries(
        Object.entries(editorProps ?? {}).filter(([name]) => !protectedEditorProps.has(name)),
    ) as TiptapEditorProps;

    return {
        initial: {
            ...editorProps,
            attributes: {
                ...initialAttributes,
                ...controlAttributes,
                role: 'textbox',
            },
        },
        transformPastedHTML: editorProps?.transformPastedHTML,
        reactive: {
            ...reactiveEditorProps,
            attributes: (state) => {
                const attributes =
                    typeof configuredAttributes === 'function'
                        ? configuredAttributes(state)
                        : configuredAttributes;

                return {
                    ...attributes,
                    ...controlAttributes,
                    class: ['tiptap', attributes?.class].filter(Boolean).join(' '),
                    role: 'textbox',
                };
            },
        },
    };
}

function isControlAttribute(name: string) {
    return name === 'tabindex' || CONTROL_ATTRIBUTE_PATTERN.test(name);
}
