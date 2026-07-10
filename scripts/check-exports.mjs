import { existsSync, readFileSync } from 'node:fs';
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
    'dist/alert.css',
    'dist/accordion.css',
    'dist/badge.css',
    'dist/button.css',
    'dist/button-link.css',
    'dist/button-group.css',
    'dist/card.css',
    'dist/checkbox.css',
    'dist/collapse.css',
    'dist/color-input.css',
    'dist/color-picker.css',
    'dist/color-swatch.css',
    'dist/dropdown-menu.css',
    'dist/field.css',
    'dist/icon-button.css',
    'dist/input.css',
    'dist/modal.css',
    'dist/overlay.css',
    'dist/popover.css',
    'dist/progress.css',
    'dist/radio.css',
    'dist/select.css',
    'dist/slider.css',
    'dist/switch.css',
    'dist/tabs.css',
    'dist/textarea.css',
    'dist/tooltip.css',
    'dist/components/alert/index.js',
    'dist/components/accordion/index.js',
    'dist/components/badge/index.js',
    'dist/components/button/index.js',
    'dist/components/button-link/index.js',
    'dist/components/button-group/index.js',
    'dist/components/card/index.js',
    'dist/components/checkbox/index.js',
    'dist/components/collapse/index.js',
    'dist/components/color-input/index.js',
    'dist/components/color-picker/index.js',
    'dist/components/color-swatch/index.js',
    'dist/components/dropdown-menu/index.js',
    'dist/components/field/index.js',
    'dist/components/icon-button/index.js',
    'dist/components/input/index.js',
    'dist/components/modal/index.js',
    'dist/components/overlay/index.js',
    'dist/components/popover/index.js',
    'dist/components/progress/index.js',
    'dist/components/radio/index.js',
    'dist/components/select/index.js',
    'dist/components/slider/index.js',
    'dist/components/switch/index.js',
    'dist/components/tabs/index.js',
    'dist/components/textarea/index.js',
    'dist/components/tooltip/index.js',
];

for (const file of expectedFiles) {
    if (!existsSync(join(projectRoot, file))) {
        throw new Error(`Missing build output: ${file}`);
    }
}

const baseCss = readFileSync(join(projectRoot, 'dist/base.css'), 'utf8');

for (const selector of ['.rp-spinner', '@keyframes rp-spinner-spin']) {
    if (!baseCss.includes(selector)) {
        throw new Error(`dist/base.css does not include ${selector}`);
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
            'Accordion',
            'AccordionItem',
            'Alert',
            'Badge',
            'Button',
            'ButtonLink',
            'ButtonGroup',
            'Card',
            'Checkbox',
            'Collapse',
            'ColorInput',
            'ColorPicker',
            'ColorSwatch',
            'DropdownMenu',
            'Field',
            'IconButton',
            'Input',
            'Modal',
            'Overlay',
            'Popover',
            'popoverPlacements',
            'Progress',
            'Radio',
            'RadioGroup',
            'Select',
            'Slider',
            'Switch',
            'Tabs',
            'TabsContent',
            'TabsList',
            'TabsTrigger',
            'Textarea',
            'Tooltip',
            'useAccordion',
            'useAccordionItem',
            'useCollapse',
            'useTabs',
            'useTabsContent',
            'useTabsList',
            'useTabsTrigger',
        ],
        'dist/index.js',
    );

    const alert = await server.ssrLoadModule('/dist/components/alert/index.js');
    assertExports(alert, ['Alert'], 'dist/components/alert/index.js');

    const accordion = await server.ssrLoadModule('/dist/components/accordion/index.js');
    assertExports(
        accordion,
        ['Accordion', 'AccordionItem', 'useAccordion', 'useAccordionItem'],
        'dist/components/accordion/index.js',
    );

    const badge = await server.ssrLoadModule('/dist/components/badge/index.js');
    assertExports(badge, ['Badge'], 'dist/components/badge/index.js');

    const button = await server.ssrLoadModule('/dist/components/button/index.js');
    assertExports(button, ['Button'], 'dist/components/button/index.js');

    const buttonLink = await server.ssrLoadModule('/dist/components/button-link/index.js');
    assertExports(buttonLink, ['ButtonLink'], 'dist/components/button-link/index.js');

    const buttonGroup = await server.ssrLoadModule('/dist/components/button-group/index.js');
    assertExports(buttonGroup, ['ButtonGroup'], 'dist/components/button-group/index.js');

    const card = await server.ssrLoadModule('/dist/components/card/index.js');
    assertExports(card, ['Card'], 'dist/components/card/index.js');

    const collapse = await server.ssrLoadModule('/dist/components/collapse/index.js');
    assertExports(collapse, ['Collapse', 'useCollapse'], 'dist/components/collapse/index.js');

    const colorInput = await server.ssrLoadModule('/dist/components/color-input/index.js');
    assertExports(colorInput, ['ColorInput'], 'dist/components/color-input/index.js');

    const colorPicker = await server.ssrLoadModule('/dist/components/color-picker/index.js');
    assertExports(colorPicker, ['ColorPicker'], 'dist/components/color-picker/index.js');

    const colorSwatch = await server.ssrLoadModule('/dist/components/color-swatch/index.js');
    assertExports(colorSwatch, ['ColorSwatch'], 'dist/components/color-swatch/index.js');

    const dropdownMenu = await server.ssrLoadModule('/dist/components/dropdown-menu/index.js');
    assertExports(
        dropdownMenu,
        ['DropdownMenu', 'useDropdownMenu'],
        'dist/components/dropdown-menu/index.js',
    );

    const field = await server.ssrLoadModule('/dist/components/field/index.js');
    assertExports(field, ['Field'], 'dist/components/field/index.js');

    const iconButton = await server.ssrLoadModule('/dist/components/icon-button/index.js');
    assertExports(iconButton, ['IconButton'], 'dist/components/icon-button/index.js');

    const modal = await server.ssrLoadModule('/dist/components/modal/index.js');
    assertExports(modal, ['Modal'], 'dist/components/modal/index.js');

    const overlay = await server.ssrLoadModule('/dist/components/overlay/index.js');
    assertExports(overlay, ['Overlay'], 'dist/components/overlay/index.js');

    const select = await server.ssrLoadModule('/dist/components/select/index.js');
    assertExports(select, ['Select'], 'dist/components/select/index.js');

    const popover = await server.ssrLoadModule('/dist/components/popover/index.js');
    assertExports(popover, ['Popover', 'popoverPlacements'], 'dist/components/popover/index.js');

    const progress = await server.ssrLoadModule('/dist/components/progress/index.js');
    assertExports(progress, ['Progress'], 'dist/components/progress/index.js');

    const slider = await server.ssrLoadModule('/dist/components/slider/index.js');
    assertExports(slider, ['Slider'], 'dist/components/slider/index.js');

    const tabs = await server.ssrLoadModule('/dist/components/tabs/index.js');
    assertExports(
        tabs,
        [
            'Tabs',
            'TabsContent',
            'TabsList',
            'TabsTrigger',
            'useTabs',
            'useTabsContent',
            'useTabsList',
            'useTabsTrigger',
        ],
        'dist/components/tabs/index.js',
    );

    const textarea = await server.ssrLoadModule('/dist/components/textarea/index.js');
    assertExports(textarea, ['Textarea'], 'dist/components/textarea/index.js');

    const tooltip = await server.ssrLoadModule('/dist/components/tooltip/index.js');
    assertExports(tooltip, ['Tooltip'], 'dist/components/tooltip/index.js');
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
