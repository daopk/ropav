export { editorParts } from './components/editor/types';

const clientOnlyMessage =
    '@ropav/editor is client-only. Render Editor inside your framework client-only boundary.';

export const Editor = {
    name: 'RpEditor',
    setup(): never {
        throw new Error(clientOnlyMessage);
    },
};
