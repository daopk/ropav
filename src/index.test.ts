import { describe, expect, it } from 'vitest';
import * as Ropav from './index';

const publicComponents = [
    'Badge',
    'Button',
    'ButtonGroup',
    'Card',
    'Checkbox',
    'Collapse',
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
] as const;

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
