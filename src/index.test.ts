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
        expect(Ropav).toHaveProperty('useToast');
        expect(Ropav.useToast).toBeTypeOf('function');
        expect(Ropav).toHaveProperty('useToastState');
        expect(Ropav.useToastState).toBeTypeOf('function');
    });

    it('exposes popover placement options from src/index.ts', () => {
        expect(Ropav.popoverPlacements).toHaveLength(12);
        expect(Ropav.popoverPlacements).toContain('bottom-start');
    });

    it('exposes avatar variants from src/index.ts', () => {
        expect(Ropav.avatarVariants).toEqual(['solid', 'subtle', 'surface', 'outline']);
    });
});
