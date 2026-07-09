import { describe, expect, it } from 'vitest';

const Ropav = await import('./index');

const publicComponents = [
    'Alert',
    'Badge',
    'Button',
    'ButtonLink',
    'ButtonGroup',
    'Card',
    'Checkbox',
    'Collapse',
    'ColorPicker',
    'DropdownMenu',
    'Field',
    'IconButton',
    'Input',
    'Modal',
    'Overlay',
    'Popover',
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
    });
});
