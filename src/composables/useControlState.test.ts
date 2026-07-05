import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { mountDom } from '../../tests/utils/vue';
import { useControlState, type ControlState } from './useControlState';

describe('useControlState', () => {
    it('uses option values and defaults', () => {
        let control!: ControlState;

        mountDom(defineComponent({
            setup() {
                control = useControlState({
                    id: 'control-id',
                    disabled: true,
                    describedby: 'local-help local-help',
                    labelledby: 'local-label',
                });
                return () => h('div');
            },
        }));

        expect(control.id).toBe('control-id');
        expect(control.disabled).toBe(true);
        expect(control.required).toBe(false);
        expect(control.invalid).toBe(false);
        expect(control.ariaDescribedby).toBe('local-help');
        expect(control.ariaLabelledby).toBe('local-label');
    });

    it('deduplicates ARIA ids and preserves explicit boolean values', () => {
        let control!: ControlState;

        mountDom(defineComponent({
            setup() {
                control = useControlState({
                    id: 'control-id',
                    disabled: false,
                    required: true,
                    invalid: true,
                    describedby: 'local-help shared-id local-help',
                    labelledby: 'custom-label label-id custom-label',
                });
                return () => h('div');
            },
        }));

        expect(control.id).toBe('control-id');
        expect(control.disabled).toBe(false);
        expect(control.required).toBe(true);
        expect(control.invalid).toBe(true);
        expect(control.ariaDescribedby).toBe('local-help shared-id');
        expect(control.ariaLabelledby).toBe('custom-label label-id');
    });
});
