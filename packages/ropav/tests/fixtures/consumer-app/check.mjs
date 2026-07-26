import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./src', import.meta.url));
// oxlint-disable-next-line eslint/no-useless-concat -- splitting these literals keeps the fixture checker from matching itself
const forbidden = ['.' + 'rp-', '--' + '_rp-'];

for (const file of collect(root)) {
    const contents = readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
        if (contents.includes(pattern)) throw new Error(`${file} contains forbidden ${pattern}`);
    }
}

function collect(path) {
    if (!statSync(path).isDirectory()) return [path];
    return readdirSync(path).flatMap((entry) => collect(join(path, entry)));
}
