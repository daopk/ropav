export const publicApiManifest = {
    schemaVersion: 1,
    root: {
        source: 'src/index.ts',
        buildName: 'index',
        types: './dist/index.d.ts',
        import: './dist/index.js',
        typeReexports: [
            {
                source: './styles-api',
                names: ['StylesApiClassNames', 'StylesApiProps', 'StylesApiStyles'],
            },
        ],
    },
    components: [
        {
            name: 'accordion',
            runtimeExports: [
                'Accordion',
                'AccordionItem',
                'accordionItemParts',
                'accordionParts',
                'useAccordion',
                'useAccordionItem',
            ],
        },
        {
            name: 'alert',
            runtimeExports: [
                'Alert',
                'alertColors',
                'alertParts',
                'alertRadiuses',
                'alertVariants',
            ],
        },
        {
            name: 'aspect-ratio',
            runtimeExports: ['AspectRatio', 'aspectRatioParts'],
        },
        {
            name: 'avatar',
            runtimeExports: [
                'Avatar',
                'avatarColors',
                'avatarParts',
                'avatarRadiuses',
                'avatarSizes',
                'avatarVariants',
            ],
        },
        {
            name: 'badge',
            runtimeExports: [
                'Badge',
                'badgeColors',
                'badgeParts',
                'badgeRadiuses',
                'badgeSizes',
                'badgeVariants',
            ],
        },
        {
            name: 'button',
            runtimeExports: ['Button', 'buttonParts'],
        },
        {
            name: 'button-group',
            runtimeExports: ['ButtonGroup', 'buttonGroupParts'],
        },
        {
            name: 'button-link',
            runtimeExports: ['ButtonLink', 'buttonLinkParts'],
        },
        {
            name: 'card',
            runtimeExports: ['Card', 'cardParts'],
        },
        {
            name: 'checkbox',
            runtimeExports: ['Checkbox', 'checkboxParts'],
        },
        {
            name: 'collapse',
            runtimeExports: ['Collapse', 'collapseParts', 'useCollapse'],
        },
        {
            name: 'color-input',
            runtimeExports: ['ColorInput', 'colorInputParts'],
        },
        {
            name: 'color-picker',
            runtimeExports: [
                'ColorPicker',
                'colorPickerFormats',
                'colorPickerParts',
                'colorPickerSizes',
            ],
        },
        {
            name: 'color-swatch',
            runtimeExports: ['ColorSwatch', 'colorSwatchParts'],
        },
        {
            name: 'dialog',
            runtimeExports: [
                'DialogClose',
                'DialogContent',
                'DialogDescription',
                'DialogOverlay',
                'DialogPortal',
                'DialogRoot',
                'DialogTitle',
                'DialogTrigger',
            ],
        },
        {
            name: 'dropdown-menu',
            runtimeExports: [
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
        },
        {
            name: 'field',
            runtimeExports: ['Field', 'fieldParts'],
        },
        {
            name: 'floating',
            runtimeExports: ['useFloatingPosition', 'useHoverDisclosure'],
        },
        {
            name: 'focus-trap',
            runtimeExports: ['FocusTrap', 'focusTrapParts', 'useFocusTrap'],
        },
        {
            name: 'icon-button',
            runtimeExports: ['IconButton', 'iconButtonParts'],
        },
        {
            name: 'input',
            runtimeExports: ['Input', 'inputParts'],
        },
        {
            name: 'modal',
            runtimeExports: ['Modal', 'modalParts'],
        },
        {
            name: 'number-input',
            runtimeExports: ['NumberInput', 'numberInputParts'],
        },
        {
            name: 'overlay',
            runtimeExports: ['Overlay', 'OverlayLayerProvider', 'overlayParts', 'useOverlayZIndex'],
        },
        {
            name: 'pagination',
            runtimeExports: [
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
        },
        {
            name: 'popover',
            runtimeExports: ['Popover', 'popoverParts', 'popoverPlacements'],
        },
        {
            name: 'progress',
            runtimeExports: [
                'Progress',
                'progressColors',
                'progressParts',
                'progressRadiuses',
                'progressSizes',
            ],
        },
        {
            name: 'radio',
            runtimeExports: ['Radio', 'RadioGroup', 'radioGroupParts', 'radioParts'],
        },
        {
            name: 'scroll-area',
            runtimeExports: [
                'ScrollArea',
                'scrollAreaParts',
                'scrollAreaScrollbars',
                'scrollAreaTypes',
            ],
        },
        {
            name: 'select',
            runtimeExports: ['Select', 'selectParts'],
        },
        {
            name: 'slider',
            runtimeExports: [
                'RangeSlider',
                'Slider',
                'rangeSliderParts',
                'sliderColors',
                'sliderOrientations',
                'sliderParts',
                'sliderSizes',
            ],
        },
        {
            name: 'switch',
            runtimeExports: ['Switch', 'switchParts'],
        },
        {
            name: 'tabs',
            runtimeExports: [
                'Tabs',
                'TabsContent',
                'TabsList',
                'TabsTrigger',
                'tabsContentParts',
                'tabsListParts',
                'tabsParts',
                'tabsTriggerParts',
                'useTabs',
                'useTabsContent',
                'useTabsList',
                'useTabsTrigger',
            ],
        },
        {
            name: 'teleport-provider',
            runtimeExports: ['TeleportProvider', 'useTeleportTarget'],
        },
        {
            name: 'textarea',
            runtimeExports: ['Textarea', 'textareaParts'],
        },
        {
            name: 'toast',
            runtimeExports: [
                'Toast',
                'ToastProvider',
                'ToastViewport',
                'createToastStore',
                'toastColors',
                'toastParts',
                'toastPositions',
                'toastRadiuses',
                'toastTypes',
                'toastVariants',
                'toastViewportParts',
                'useToast',
                'useToastState',
            ],
        },
        {
            name: 'tooltip',
            runtimeExports: ['Tooltip', 'tooltipParts'],
        },
    ],
    specialEntries: [
        {
            subpath: './composables',
            source: 'src/composables/index.ts',
            rootSource: './composables',
            buildName: 'composables/index',
            types: './dist/composables/index.d.ts',
            import: './dist/composables/index.js',
            includeInRoot: true,
            runtimeExports: ['useControllableValue'],
        },
        {
            subpath: './unplugin-icons',
            source: 'src/unplugin-icons.ts',
            buildName: 'unplugin-icons',
            types: './dist/unplugin-icons.d.ts',
            import: './dist/unplugin-icons.js',
            includeInRoot: false,
            runtimeExports: ['vaporIconCompiler'],
        },
    ],
    assetEntries: [
        {
            subpath: './base.css',
            target: './dist/base.css',
            source: 'src/styles/base.scss',
            buildName: 'base',
        },
        {
            subpath: './styles-manifest',
            target: './src/styles/styles-manifest.json',
        },
        {
            subpath: './styles-manifest.json',
            target: './src/styles/styles-manifest.json',
        },
        {
            subpath: './scss/*.scss',
            target: './src/styles/*.scss',
        },
    ],
};
