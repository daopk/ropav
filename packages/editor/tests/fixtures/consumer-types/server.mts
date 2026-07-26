import { Editor, editorParts } from '@ropav/editor';

const setup: () => never = Editor.setup;
const rootPart: 'root' = editorParts[0];

void [setup, rootPart];
