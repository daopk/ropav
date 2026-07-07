import { describe, expect, it } from 'vitest';
import * as Ropav from './index';

const publicComponents = [
    'Button',
    'ButtonGroup',
    'Card',
    'Checkbox',
    'Field',
    'IconButton',
    'Input',
    'Popover',
    'Radio',
    'RadioGroup',
    'Select',
    'Slider',
    'Switch',
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
});
