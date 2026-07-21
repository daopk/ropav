import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { mountDom } from '../../../tests/utils/vue';
import { useFormControl } from './useFormControl';

describe('useFormControl', () => {
    it('handles reset events from the native control owner document', async () => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        const frameDocument = iframe.contentDocument!;
        const frameWindow = iframe.contentWindow as Window & typeof globalThis;
        const form = frameDocument.createElement('form');
        const input = frameDocument.createElement('input');
        form.appendChild(input);
        frameDocument.body.appendChild(form);
        const readResetValue = vi.fn();

        mountDom(
            defineComponent({
                setup() {
                    useFormControl({
                        elements: () => [input],
                        isControlled: () => false,
                        readResetValue,
                        syncControlledValue: vi.fn(),
                    });
                    return () => h('div');
                },
            }),
        );
        await nextTick();

        form.dispatchEvent(new frameWindow.Event('reset', { bubbles: true, cancelable: true }));
        await Promise.resolve();

        expect(readResetValue).toHaveBeenCalledOnce();
        expect(readResetValue).toHaveBeenCalledWith([input]);
    });
});
