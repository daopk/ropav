import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const dom = new JSDOM('<!doctype html><html><body></body></html>');

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.SVGElement = dom.window.SVGElement;

const expectedFiles = [
    'dist/index.js',
    'dist/base.css',
    'dist/button.css',
    'dist/checkbox.css',
    'dist/field.css',
    'dist/icon-button.css',
    'dist/input.css',
    'dist/radio.css',
    'dist/select.css',
    'dist/switch.css',
    'dist/textarea.css',
    'dist/components/button/index.js',
    'dist/components/checkbox/index.js',
    'dist/components/field/index.js',
    'dist/components/icon-button/index.js',
    'dist/components/input/index.js',
    'dist/components/radio/index.js',
    'dist/components/select/index.js',
    'dist/components/switch/index.js',
    'dist/components/textarea/index.js',
];

for (const file of expectedFiles) {
    if (!existsSync(join(projectRoot, file))) {
        throw new Error(`Missing build output: ${file}`);
    }
}

const server = await createServer({
    configFile: false,
    root: projectRoot,
    logLevel: 'silent',
    resolve: {
        alias: {
            vue: resolve(
                projectRoot,
                'node_modules/vue/dist/vue.runtime-with-vapor.esm-browser.prod.js',
            ),
        },
    },
    server: { middlewareMode: true },
});

try {
    const root = await server.ssrLoadModule('/dist/index.js');
    assertExports(
        root,
        [
            'Button',
            'Checkbox',
            'Field',
            'IconButton',
            'Input',
            'Radio',
            'RadioGroup',
            'Select',
            'Switch',
            'Textarea',
        ],
        'dist/index.js',
    );

    const button = await server.ssrLoadModule('/dist/components/button/index.js');
    assertExports(button, ['Button'], 'dist/components/button/index.js');

    const field = await server.ssrLoadModule('/dist/components/field/index.js');
    assertExports(field, ['Field'], 'dist/components/field/index.js');

    const iconButton = await server.ssrLoadModule('/dist/components/icon-button/index.js');
    assertExports(iconButton, ['IconButton'], 'dist/components/icon-button/index.js');

    const select = await server.ssrLoadModule('/dist/components/select/index.js');
    assertExports(select, ['Select'], 'dist/components/select/index.js');

    const textarea = await server.ssrLoadModule('/dist/components/textarea/index.js');
    assertExports(textarea, ['Textarea'], 'dist/components/textarea/index.js');
} finally {
    await server.close();
}

function assertExports(module, names, label) {
    for (const name of names) {
        if (!module[name]) {
            throw new Error(`${label} does not export ${name}`);
        }
    }
}
