import { describe, expect, it } from 'vitest';
import * as Ropav from './index';

const publicComponents = [
    'Button',
    'Card',
    'Checkbox',
    'Field',
    'IconButton',
    'Input',
    'Radio',
    'RadioGroup',
    'Select',
    'Switch',
    'Textarea',
] as const;

describe('public source exports', () => {
    it('exposes the primary component entrypoints from src/index.ts', () => {
        for (const component of publicComponents) {
            expect(Ropav).toHaveProperty(component);
            expect(Ropav[component]).toBeTruthy();
        }
    });
});
