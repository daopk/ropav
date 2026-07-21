import { describe, expect, it, vi } from 'vitest';
import { effectScope, isReadonly, nextTick, ref } from 'vue';

import { useControllableValue } from './useControllableValue';

describe('useControllableValue', () => {
    it('snapshots the default value and updates uncontrolled state', () => {
        const defaultValue = vi.fn(() => 'initial');
        const onChange = vi.fn();
        const controllable = useControllableValue({
            modelValue: () => undefined,
            defaultValue,
            onChange,
        });

        expect(controllable.initialValue).toBe('initial');
        expect(controllable.value.value).toBe('initial');
        expect(controllable.isControlled.value).toBe(false);
        expect(defaultValue).toHaveBeenCalledOnce();

        controllable.setValue('next');
        controllable.setValue('next');

        expect(controllable.value.value).toBe('next');
        expect(onChange).toHaveBeenNthCalledWith(1, 'next');
        expect(onChange).toHaveBeenNthCalledWith(2, 'next');
        expect(defaultValue).toHaveBeenCalledOnce();
    });

    it('does not mutate controlled state and preserves the last controlled value as fallback', async () => {
        const modelValue = ref<string>();
        const onChange = vi.fn();
        const scope = effectScope();
        const controllable = scope.run(() =>
            useControllableValue({
                modelValue: () => modelValue.value,
                defaultValue: () => 'initial',
                onChange,
            }),
        )!;

        modelValue.value = 'controlled';
        await nextTick();
        expect(controllable.isControlled.value).toBe(true);
        expect(controllable.value.value).toBe('controlled');

        controllable.setValue('requested');
        expect(controllable.value.value).toBe('controlled');
        expect(onChange).toHaveBeenCalledWith('requested');

        modelValue.value = 'external';
        await nextTick();
        controllable.resetValue('reset');
        expect(controllable.value.value).toBe('external');
        modelValue.value = undefined;
        await nextTick();

        expect(controllable.isControlled.value).toBe(false);
        expect(controllable.value.value).toBe('external');
        scope.stop();
    });

    it('resets only uncontrolled state without notifying', () => {
        const onChange = vi.fn();
        const controllable = useControllableValue({
            modelValue: () => undefined,
            defaultValue: () => 'initial',
            onChange,
        });

        controllable.setValue('changed');
        controllable.resetValue('explicit');
        expect(controllable.value.value).toBe('explicit');
        controllable.resetValue();

        expect(controllable.value.value).toBe('initial');
        expect(onChange).toHaveBeenCalledOnce();
    });

    it('returns readonly computed state', () => {
        const controllable = useControllableValue({
            modelValue: () => undefined,
            defaultValue: () => 1,
            onChange: vi.fn(),
        });

        expect(isReadonly(controllable.isControlled)).toBe(true);
        expect(isReadonly(controllable.value)).toBe(true);
    });
});
