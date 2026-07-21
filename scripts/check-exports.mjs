import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
const dom = new JSDOM('<!doctype html><html><body></body></html>');

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.SVGElement = dom.window.SVGElement;

const expectedRuntimeExports = new Map([
    [
        '.',
        [
            'Accordion',
            'AccordionItem',
            'Alert',
            'AspectRatio',
            'Avatar',
            'Badge',
            'Button',
            'ButtonGroup',
            'ButtonLink',
            'Card',
            'Checkbox',
            'Collapse',
            'ColorInput',
            'ColorPicker',
            'ColorSwatch',
            'DialogClose',
            'DialogContent',
            'DialogDescription',
            'DialogOverlay',
            'DialogPortal',
            'DialogRoot',
            'DialogTitle',
            'DialogTrigger',
            'DropdownMenu',
            'DropdownMenuCheckboxItem',
            'DropdownMenuContent',
            'DropdownMenuContextTrigger',
            'DropdownMenuItem',
            'DropdownMenuItemIndicator',
            'DropdownMenuLabel',
            'DropdownMenuPortal',
            'DropdownMenuRadioGroup',
            'DropdownMenuRadioItem',
            'DropdownMenuRoot',
            'DropdownMenuSeparator',
            'DropdownMenuSub',
            'DropdownMenuSubContent',
            'DropdownMenuSubTrigger',
            'DropdownMenuTrigger',
            'Field',
            'FocusTrap',
            'IconButton',
            'Input',
            'Modal',
            'NumberInput',
            'Overlay',
            'OverlayLayerProvider',
            'Pagination',
            'Popover',
            'Progress',
            'Radio',
            'RadioGroup',
            'RangeSlider',
            'ScrollArea',
            'Select',
            'Slider',
            'Switch',
            'Tabs',
            'TabsContent',
            'TabsList',
            'TabsTrigger',
            'TeleportProvider',
            'Textarea',
            'Toast',
            'ToastProvider',
            'ToastViewport',
            'Tooltip',
            'accordionItemParts',
            'accordionParts',
            'alertColors',
            'alertParts',
            'alertRadiuses',
            'alertVariants',
            'aspectRatioParts',
            'avatarColors',
            'avatarParts',
            'avatarRadiuses',
            'avatarSizes',
            'avatarVariants',
            'badgeColors',
            'badgeParts',
            'badgeRadiuses',
            'badgeSizes',
            'badgeVariants',
            'buttonGroupParts',
            'buttonLinkParts',
            'buttonParts',
            'cardParts',
            'checkboxParts',
            'collapseParts',
            'colorInputParts',
            'colorPickerFormats',
            'colorPickerParts',
            'colorPickerSizes',
            'colorSwatchParts',
            'createToastStore',
            'dropdownMenuParts',
            'fieldParts',
            'focusTrapParts',
            'getPaginationItems',
            'iconButtonParts',
            'inputParts',
            'modalParts',
            'normalizePaginationPage',
            'normalizePaginationTotal',
            'numberInputParts',
            'overlayParts',
            'paginationColors',
            'paginationParts',
            'paginationRadiuses',
            'paginationSizes',
            'popoverParts',
            'popoverPlacements',
            'progressColors',
            'progressParts',
            'progressRadiuses',
            'progressSizes',
            'radioGroupParts',
            'radioParts',
            'rangeSliderParts',
            'scrollAreaParts',
            'scrollAreaScrollbars',
            'scrollAreaTypes',
            'selectParts',
            'sliderColors',
            'sliderOrientations',
            'sliderParts',
            'sliderSizes',
            'switchParts',
            'tabsContentParts',
            'tabsListParts',
            'tabsParts',
            'tabsTriggerParts',
            'textareaParts',
            'toastColors',
            'toastParts',
            'toastPositions',
            'toastRadiuses',
            'toastTypes',
            'toastVariants',
            'toastViewportParts',
            'tooltipParts',
            'useAccordion',
            'useAccordionItem',
            'useCollapse',
            'useControllableValue',
            'useDropdownMenu',
            'useFloatingPosition',
            'useFocusTrap',
            'useHoverDisclosure',
            'useOverlayZIndex',
            'usePagination',
            'useTabs',
            'useTabsContent',
            'useTabsList',
            'useTabsTrigger',
            'useTeleportTarget',
            'useToast',
            'useToastState',
        ],
    ],
    ['./composables', ['useControllableValue']],
    ['./unplugin-icons', ['vaporIconCompiler']],
]);

const packageTargets = new Set([
    packageJson.main,
    packageJson.module,
    packageJson.types,
    ...collectStringValues(packageJson.exports),
]);
for (const target of packageTargets) {
    assertPackageTargetExists(target);
}

const baseCss = readFileSync(join(projectRoot, 'dist/base.css'), 'utf8');

for (const selector of ['.rp-spinner', '@keyframes rp-spinner-spin']) {
    if (!baseCss.includes(selector)) {
        throw new Error(`dist/base.css does not include ${selector}`);
    }
}

for (const layer of [
    '@layer ropav.tokens, ropav.components',
    '@layer ropav.tokens',
    '@layer ropav.components',
]) {
    if (!baseCss.includes(layer)) throw new Error(`dist/base.css does not include ${layer}`);
}

const server = await createServer({
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
    const runtimeEntries = Object.entries(packageJson.exports).filter(
        ([, descriptor]) =>
            typeof descriptor?.import === 'string' && descriptor.import.endsWith('.js'),
    );
    await Promise.all(
        runtimeEntries.map(async ([subpath, descriptor]) => {
            const buildPath = normalizePackageTarget(descriptor.import);
            const sourcePath = sourceEntryForBuild(buildPath);
            if (!existsSync(join(projectRoot, sourcePath))) {
                throw new Error(`${subpath} source entry does not exist: ${sourcePath}`);
            }

            const [sourceModule, buildModule] = await Promise.all([
                server.ssrLoadModule(`/${sourcePath}`),
                server.ssrLoadModule(`/${buildPath}`),
            ]);
            const expectedNames = expectedRuntimeExports.get(subpath);
            if (expectedNames) assertExpectedExports(sourceModule, expectedNames, subpath);
            assertSameExports(sourceModule, buildModule, subpath);
        }),
    );
} finally {
    await server.close();
}

function collectStringValues(value) {
    if (typeof value === 'string') return [value];
    if (!value || typeof value !== 'object') return [];

    return Object.values(value).flatMap(collectStringValues);
}

function assertPackageTargetExists(target) {
    if (typeof target !== 'string') return;

    const normalizedTarget = normalizePackageTarget(target);
    if (!normalizedTarget.includes('*')) {
        if (!existsSync(join(projectRoot, normalizedTarget))) {
            throw new Error(`Package target does not exist: ${target}`);
        }
        return;
    }

    const targetDirectory = dirname(normalizedTarget);
    const targetPattern = new RegExp(
        `^${escapeRegExp(basename(normalizedTarget)).replaceAll('\\*', '.+')}$`,
    );
    const absoluteDirectory = join(projectRoot, targetDirectory);
    if (
        !existsSync(absoluteDirectory) ||
        !readdirSync(absoluteDirectory).some((entry) => targetPattern.test(entry))
    ) {
        throw new Error(`Package target pattern has no matches: ${target}`);
    }
}

function normalizePackageTarget(target) {
    return target.replace(/^\.\//, '');
}

function sourceEntryForBuild(buildPath) {
    if (buildPath === 'dist/index.js') return 'src/index.ts';

    const indexEntry = buildPath.match(/^dist\/(.+)\/index\.js$/);
    if (indexEntry) return `src/${indexEntry[1]}/index.ts`;

    const rootEntry = buildPath.match(/^dist\/([^/]+)\.js$/);
    if (rootEntry) return `src/${rootEntry[1]}.ts`;

    throw new Error(`Cannot resolve source entry for ${buildPath}`);
}

function assertSameExports(sourceModule, buildModule, label) {
    const sourceNames = Object.keys(sourceModule).toSorted();
    const buildNames = Object.keys(buildModule).toSorted();
    const missing = sourceNames.filter((name) => !Object.hasOwn(buildModule, name));
    const unexpected = buildNames.filter((name) => !Object.hasOwn(sourceModule, name));

    if (missing.length === 0 && unexpected.length === 0) return;

    const details = [
        missing.length > 0 ? `missing ${missing.join(', ')}` : undefined,
        unexpected.length > 0 ? `unexpected ${unexpected.join(', ')}` : undefined,
    ].filter(Boolean);
    throw new Error(`${label} runtime exports differ from its source entry: ${details.join('; ')}`);
}

function assertExpectedExports(module, expectedNames, label) {
    const actualNames = Object.keys(module).toSorted();
    const expected = expectedNames.toSorted();
    const missing = expected.filter((name) => !Object.hasOwn(module, name));
    const unexpected = actualNames.filter((name) => !expected.includes(name));

    if (missing.length === 0 && unexpected.length === 0) return;

    const details = [
        missing.length > 0 ? `missing ${missing.join(', ')}` : undefined,
        unexpected.length > 0 ? `unexpected ${unexpected.join(', ')}` : undefined,
    ].filter(Boolean);
    throw new Error(`${label} public runtime contract changed: ${details.join('; ')}`);
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
