export { tableParts } from './components/table/types';

const clientOnlyMessage =
    '@ropav/table is client-only. Render Table inside your framework client-only boundary.';

export const Table = {
    name: 'RpTable',
    setup(): never {
        throw new Error(clientOnlyMessage);
    },
};
