import { Editor, editorParts, type EditorComponentExposed, type EditorProps } from '@ropav/editor';

const props: EditorProps = {
    modelValue: '<p>Consumer content</p>',
    editable: true,
};
const focus: EditorComponentExposed['focus'] = () => true;
const rootPart: 'root' = editorParts[0];

void [Editor, props, focus, rootPart];
