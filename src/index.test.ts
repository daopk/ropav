import { describe, expect, it } from 'vitest';

const Ropav = await import('./index');

const publicComponents = [
    'Alert',
    'AspectRatio',
    'Avatar',
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
    'FocusTrap',
    'IconButton',
    'Input',
    'Modal',
    'NumberInput',
    'Overlay',
    'Popover',
    'Radio',
    'RadioGroup',
    'RangeSlider',
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
] as const satisfies readonly (keyof typeof Ropav)[];

describe('public source exports', () => {
    it('exposes the primary component entrypoints from src/index.ts', () => {
        for (const component of publicComponents) {
            expect(Ropav).toHaveProperty(component);
            expect(Ropav[component]).toBeTruthy();
        }
    });

    it('exposes public composables from src/index.ts', () => {
        expect(Ropav).toHaveProperty('useCollapse');
        expect(Ropav.useCollapse).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('useFocusTrap');
        expect(Ropav.useFocusTrap).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('useFloatingPosition');
        expect(Ropav.useFloatingPosition).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('useTeleportTarget');
        expect(Ropav.useTeleportTarget).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('useToast');
        expect(Ropav.useToast).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('useToastState');
        expect(Ropav.useToastState).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('createToastStore');
        expect(Ropav.createToastStore).toBeTypeOf('function');
    });

    it('exposes popover placement options from src/index.ts', () => {
        expect(Ropav.popoverPlacements).toHaveLength(12);
        expect(Ropav.popoverPlacements).toContain('bottom-start');
    });

    it('exposes avatar variants from src/index.ts', () => {
        expect(Ropav.avatarVariants).toEqual(['solid', 'subtle', 'surface', 'outline']);
    });
});
