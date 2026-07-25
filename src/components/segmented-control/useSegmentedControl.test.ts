import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowReactive } from 'vue';

import { mountDom } from '../../../tests/utils/vue';
import type { SegmentedControlProps, SegmentedControlValue } from './types';
import { useSegmentedControl } from './useSegmentedControl';

function mountSegmentedControlState(props: SegmentedControlProps) {
    const reactiveProps = shallowReactive(props);
    const updates: SegmentedControlValue[] = [];
    let segmentedControl!: ReturnType<typeof useSegmentedControl>;

    mountDom(
        defineComponent({
            setup() {
                segmentedControl = useSegmentedControl(reactiveProps, (value) => {
                    updates.push(value);
                });
                return () => h('div');
            },
        }),
    );

    return {
        props: reactiveProps,
        updates,
        get segmentedControl() {
            return segmentedControl;
        },
    };
}

describe('useSegmentedControl', () => {
    it('preserves an explicit empty default across option metadata changes', async () => {
        const mounted = mountSegmentedControlState({
            defaultValue: null,
            options: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
            ],
        });

        expect(mounted.segmentedControl.selectedValue.value).toBeNull();

        mounted.props.options = [
            { label: 'List view', value: 'list' },
            { label: 'Grid', value: 'grid' },
        ];
        await nextTick();

        expect(mounted.segmentedControl.selectedValue.value).toBeNull();
        expect(mounted.updates).toEqual([]);
    });

    it('keeps a replacement input registered when stale cleanup runs', () => {
        const mounted = mountSegmentedControlState({
            options: [{ label: 'List', value: 'list' }],
        });
        const firstInput = document.createElement('input');
        const replacementInput = document.createElement('input');
        const firstRef = mounted.segmentedControl.createInputRef('list');
        const replacementRef = mounted.segmentedControl.createInputRef('list');

        firstRef(firstInput);
        replacementRef(replacementInput);
        firstRef(null);

        expect(mounted.segmentedControl.inputRefs.value).toEqual([replacementInput]);
    });
});
