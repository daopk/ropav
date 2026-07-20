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
    'dist/aspect-ratio.css',
    'dist/avatar.css',
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
    'dist/number-input.css',
    'dist/overlay.css',
    'dist/pagination.css',
    'dist/popover.css',
    'dist/progress.css',
    'dist/radio.css',
    'dist/scroll-area.css',
    'dist/select.css',
    'dist/slider.css',
    'dist/switch.css',
    'dist/tabs.css',
    'dist/textarea.css',
    'dist/toast.css',
    'dist/tooltip.css',
    'dist/components/alert/index.js',
    'dist/components/accordion/index.js',
    'dist/components/aspect-ratio/index.js',
    'dist/components/avatar/index.js',
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
    'dist/components/dialog/index.js',
    'dist/components/field/index.js',
    'dist/components/focus-trap/index.js',
    'dist/components/floating/index.js',
    'dist/components/icon-button/index.js',
    'dist/components/input/index.js',
    'dist/components/modal/index.js',
    'dist/components/number-input/index.js',
    'dist/components/overlay/index.js',
    'dist/components/pagination/index.js',
    'dist/components/popover/index.js',
    'dist/components/progress/index.js',
    'dist/components/radio/index.js',
    'dist/components/scroll-area/index.js',
    'dist/components/select/index.js',
    'dist/components/slider/index.js',
    'dist/components/switch/index.js',
    'dist/components/tabs/index.js',
    'dist/components/teleport-provider/index.js',
    'dist/components/textarea/index.js',
    'dist/components/toast/index.js',
    'dist/components/tooltip/index.js',
    'dist/unplugin-icons.js',
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

for (const layer of [
    '@layer ropav.tokens, ropav.components',
    '@layer ropav.tokens',
    '@layer ropav.components',
]) {
    if (!baseCss.includes(layer)) throw new Error(`dist/base.css does not include ${layer}`);
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
            'accordionItemParts',
            'accordionParts',
            'Alert',
            'alertParts',
            'AspectRatio',
            'aspectRatioParts',
            'Avatar',
            'avatarParts',
            'avatarVariants',
            'Badge',
            'badgeParts',
            'Button',
            'buttonParts',
            'ButtonLink',
            'buttonLinkParts',
            'ButtonGroup',
            'buttonGroupParts',
            'Card',
            'cardParts',
            'Checkbox',
            'checkboxParts',
            'Collapse',
            'collapseParts',
            'ColorInput',
            'colorInputParts',
            'ColorPicker',
            'colorPickerParts',
            'ColorSwatch',
            'colorSwatchParts',
            'DropdownMenu',
            'dropdownMenuParts',
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
            'DialogClose',
            'DialogContent',
            'DialogDescription',
            'DialogOverlay',
            'DialogPortal',
            'DialogRoot',
            'DialogTitle',
            'DialogTrigger',
            'Field',
            'fieldParts',
            'FocusTrap',
            'focusTrapParts',
            'IconButton',
            'iconButtonParts',
            'Input',
            'inputParts',
            'Modal',
            'modalParts',
            'NumberInput',
            'numberInputParts',
            'Overlay',
            'OverlayLayerProvider',
            'overlayParts',
            'Pagination',
            'paginationParts',
            'Popover',
            'popoverParts',
            'popoverPlacements',
            'Progress',
            'progressParts',
            'Radio',
            'radioParts',
            'RadioGroup',
            'radioGroupParts',
            'ScrollArea',
            'scrollAreaParts',
            'scrollAreaScrollbars',
            'scrollAreaTypes',
            'RangeSlider',
            'rangeSliderParts',
            'Select',
            'selectParts',
            'Slider',
            'sliderParts',
            'Switch',
            'switchParts',
            'Tabs',
            'tabsParts',
            'TabsContent',
            'tabsContentParts',
            'TabsList',
            'tabsListParts',
            'TabsTrigger',
            'tabsTriggerParts',
            'TeleportProvider',
            'Textarea',
            'textareaParts',
            'Toast',
            'toastParts',
            'ToastProvider',
            'ToastViewport',
            'toastViewportParts',
            'toastColors',
            'toastPositions',
            'toastRadiuses',
            'toastTypes',
            'toastVariants',
            'createToastStore',
            'Tooltip',
            'tooltipParts',
            'useAccordion',
            'useAccordionItem',
            'useCollapse',
            'useFloatingPosition',
            'useHoverDisclosure',
            'useOverlayZIndex',
            'usePagination',
            'useFocusTrap',
            'useTabs',
            'useTabsContent',
            'useTabsList',
            'useTabsTrigger',
            'useToast',
            'useToastState',
            'useTeleportTarget',
        ],
        'dist/index.js',
    );

    const iconsCompiler = await server.ssrLoadModule('/dist/unplugin-icons.js');
    assertExports(iconsCompiler, ['vaporIconCompiler'], 'dist/unplugin-icons.js');

    const alert = await server.ssrLoadModule('/dist/components/alert/index.js');
    assertExports(alert, ['Alert', 'alertParts'], 'dist/components/alert/index.js');

    const accordion = await server.ssrLoadModule('/dist/components/accordion/index.js');
    assertExports(
        accordion,
        [
            'Accordion',
            'AccordionItem',
            'accordionParts',
            'accordionItemParts',
            'useAccordion',
            'useAccordionItem',
        ],
        'dist/components/accordion/index.js',
    );

    const aspectRatio = await server.ssrLoadModule('/dist/components/aspect-ratio/index.js');
    assertExports(
        aspectRatio,
        ['AspectRatio', 'aspectRatioParts'],
        'dist/components/aspect-ratio/index.js',
    );

    const avatar = await server.ssrLoadModule('/dist/components/avatar/index.js');
    assertExports(
        avatar,
        ['Avatar', 'avatarParts', 'avatarVariants'],
        'dist/components/avatar/index.js',
    );

    const badge = await server.ssrLoadModule('/dist/components/badge/index.js');
    assertExports(badge, ['Badge', 'badgeParts'], 'dist/components/badge/index.js');

    const button = await server.ssrLoadModule('/dist/components/button/index.js');
    assertExports(button, ['Button', 'buttonParts'], 'dist/components/button/index.js');

    const buttonLink = await server.ssrLoadModule('/dist/components/button-link/index.js');
    assertExports(
        buttonLink,
        ['ButtonLink', 'buttonLinkParts'],
        'dist/components/button-link/index.js',
    );

    const buttonGroup = await server.ssrLoadModule('/dist/components/button-group/index.js');
    assertExports(
        buttonGroup,
        ['ButtonGroup', 'buttonGroupParts'],
        'dist/components/button-group/index.js',
    );

    const card = await server.ssrLoadModule('/dist/components/card/index.js');
    assertExports(card, ['Card', 'cardParts'], 'dist/components/card/index.js');

    const checkbox = await server.ssrLoadModule('/dist/components/checkbox/index.js');
    assertExports(checkbox, ['Checkbox', 'checkboxParts'], 'dist/components/checkbox/index.js');

    const collapse = await server.ssrLoadModule('/dist/components/collapse/index.js');
    assertExports(
        collapse,
        ['Collapse', 'collapseParts', 'useCollapse'],
        'dist/components/collapse/index.js',
    );

    const colorInput = await server.ssrLoadModule('/dist/components/color-input/index.js');
    assertExports(
        colorInput,
        ['ColorInput', 'colorInputParts'],
        'dist/components/color-input/index.js',
    );

    const colorPicker = await server.ssrLoadModule('/dist/components/color-picker/index.js');
    assertExports(
        colorPicker,
        ['ColorPicker', 'colorPickerParts'],
        'dist/components/color-picker/index.js',
    );

    const colorSwatch = await server.ssrLoadModule('/dist/components/color-swatch/index.js');
    assertExports(
        colorSwatch,
        ['ColorSwatch', 'colorSwatchParts'],
        'dist/components/color-swatch/index.js',
    );

    const dropdownMenu = await server.ssrLoadModule('/dist/components/dropdown-menu/index.js');
    assertExports(
        dropdownMenu,
        [
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
            'dropdownMenuParts',
            'useDropdownMenu',
        ],
        'dist/components/dropdown-menu/index.js',
    );

    const dialog = await server.ssrLoadModule('/dist/components/dialog/index.js');
    assertExports(
        dialog,
        [
            'DialogClose',
            'DialogContent',
            'DialogDescription',
            'DialogOverlay',
            'DialogPortal',
            'DialogRoot',
            'DialogTitle',
            'DialogTrigger',
        ],
        'dist/components/dialog/index.js',
    );

    const field = await server.ssrLoadModule('/dist/components/field/index.js');
    assertExports(field, ['Field', 'fieldParts'], 'dist/components/field/index.js');

    const focusTrap = await server.ssrLoadModule('/dist/components/focus-trap/index.js');
    assertExports(
        focusTrap,
        ['FocusTrap', 'focusTrapParts', 'useFocusTrap'],
        'dist/components/focus-trap/index.js',
    );

    const floating = await server.ssrLoadModule('/dist/components/floating/index.js');
    assertExports(
        floating,
        ['useFloatingPosition', 'useHoverDisclosure'],
        'dist/components/floating/index.js',
    );

    const iconButton = await server.ssrLoadModule('/dist/components/icon-button/index.js');
    assertExports(
        iconButton,
        ['IconButton', 'iconButtonParts'],
        'dist/components/icon-button/index.js',
    );

    const input = await server.ssrLoadModule('/dist/components/input/index.js');
    assertExports(input, ['Input', 'inputParts'], 'dist/components/input/index.js');

    const modal = await server.ssrLoadModule('/dist/components/modal/index.js');
    assertExports(modal, ['Modal', 'modalParts'], 'dist/components/modal/index.js');

    const numberInput = await server.ssrLoadModule('/dist/components/number-input/index.js');
    assertExports(
        numberInput,
        ['NumberInput', 'numberInputParts'],
        'dist/components/number-input/index.js',
    );

    const overlay = await server.ssrLoadModule('/dist/components/overlay/index.js');
    assertExports(
        overlay,
        ['Overlay', 'OverlayLayerProvider', 'overlayParts', 'useOverlayZIndex'],
        'dist/components/overlay/index.js',
    );

    const pagination = await server.ssrLoadModule('/dist/components/pagination/index.js');
    assertExports(
        pagination,
        [
            'Pagination',
            'getPaginationItems',
            'normalizePaginationPage',
            'normalizePaginationTotal',
            'paginationColors',
            'paginationParts',
            'paginationRadiuses',
            'paginationSizes',
            'usePagination',
        ],
        'dist/components/pagination/index.js',
    );

    const select = await server.ssrLoadModule('/dist/components/select/index.js');
    assertExports(select, ['Select', 'selectParts'], 'dist/components/select/index.js');

    const popover = await server.ssrLoadModule('/dist/components/popover/index.js');
    assertExports(
        popover,
        ['Popover', 'popoverParts', 'popoverPlacements'],
        'dist/components/popover/index.js',
    );

    const progress = await server.ssrLoadModule('/dist/components/progress/index.js');
    assertExports(progress, ['Progress', 'progressParts'], 'dist/components/progress/index.js');

    const radio = await server.ssrLoadModule('/dist/components/radio/index.js');
    assertExports(
        radio,
        ['Radio', 'RadioGroup', 'radioParts', 'radioGroupParts'],
        'dist/components/radio/index.js',
    );

    const scrollArea = await server.ssrLoadModule('/dist/components/scroll-area/index.js');
    assertExports(
        scrollArea,
        ['ScrollArea', 'scrollAreaParts', 'scrollAreaScrollbars', 'scrollAreaTypes'],
        'dist/components/scroll-area/index.js',
    );

    const slider = await server.ssrLoadModule('/dist/components/slider/index.js');
    assertExports(
        slider,
        ['RangeSlider', 'Slider', 'rangeSliderParts', 'sliderParts'],
        'dist/components/slider/index.js',
    );

    const switchModule = await server.ssrLoadModule('/dist/components/switch/index.js');
    assertExports(switchModule, ['Switch', 'switchParts'], 'dist/components/switch/index.js');

    const tabs = await server.ssrLoadModule('/dist/components/tabs/index.js');
    assertExports(
        tabs,
        [
            'Tabs',
            'TabsContent',
            'TabsList',
            'TabsTrigger',
            'tabsParts',
            'tabsContentParts',
            'tabsListParts',
            'tabsTriggerParts',
            'useTabs',
            'useTabsContent',
            'useTabsList',
            'useTabsTrigger',
        ],
        'dist/components/tabs/index.js',
    );

    const textarea = await server.ssrLoadModule('/dist/components/textarea/index.js');
    assertExports(textarea, ['Textarea', 'textareaParts'], 'dist/components/textarea/index.js');

    const teleportProvider = await server.ssrLoadModule(
        '/dist/components/teleport-provider/index.js',
    );
    assertExports(
        teleportProvider,
        ['TeleportProvider', 'useTeleportTarget'],
        'dist/components/teleport-provider/index.js',
    );

    const toast = await server.ssrLoadModule('/dist/components/toast/index.js');
    assertExports(
        toast,
        [
            'Toast',
            'ToastProvider',
            'ToastViewport',
            'toastParts',
            'toastViewportParts',
            'toastColors',
            'toastPositions',
            'toastRadiuses',
            'toastTypes',
            'toastVariants',
            'createToastStore',
            'useToast',
            'useToastState',
        ],
        'dist/components/toast/index.js',
    );

    const tooltip = await server.ssrLoadModule('/dist/components/tooltip/index.js');
    assertExports(tooltip, ['Tooltip', 'tooltipParts'], 'dist/components/tooltip/index.js');
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
