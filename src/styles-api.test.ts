import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mountDom } from '../tests/utils/vue';
import { useStylesApi, type StylesApiProps } from './styles-api';

type TestPart = 'root' | 'label';

const ContractComponent = defineComponent({
    name: 'ContractComponent',
    inheritAttrs: false,
    props: {
        classNames: Object,
        styles: Object,
        internalClick: { type: Function, required: true },
    },
    setup(props) {
        const { getPartAttrs, getRootAttrs } = useStylesApi<TestPart>(
            props as StylesApiProps<TestPart>,
            'root',
        );
        return () =>
            h(
                'div',
                getRootAttrs(
                    {
                        class: 'internal',
                        style: { color: 'red', padding: '1px' },
                        role: 'button',
                        onClick: props.internalClick,
                    },
                    {
                        compatibilityClass: ['compatibility', { ready: true }],
                        compatibilityStyle: { color: 'orange', padding: '2px' },
                    },
                ),
                [
                    h(
                        'span',
                        getPartAttrs('label', {
                            class: 'internal-label',
                            style: { fontWeight: 400 },
                        }),
                        'Label',
                    ),
                ],
            );
    },
});

describe('Styles API core contract', () => {
    it('merges all stages, forwards attrs once, composes listeners, and reacts to updates', async () => {
        const order: string[] = [];
        const internalClick = vi.fn(() => order.push('internal'));
        const consumerClick = vi.fn(() => order.push('consumer'));
        const classNames = shallowRef<StylesApiProps<TestPart>['classNames']>({
            root: ['consumer', { active: true }],
            label: { 'consumer-label': true },
        });
        const styles = shallowRef<StylesApiProps<TestPart>['styles']>({
            root: [{ color: 'green' }, { margin: '3px' }],
            label: { fontWeight: 600 },
        });

        const container = mountDom(
            defineComponent({
                render() {
                    return h(ContractComponent, {
                        classNames: classNames.value,
                        styles: styles.value,
                        internalClick,
                        class: ['root-attr', { selected: true }],
                        style: [{ color: 'purple' }, { margin: '4px' }],
                        role: 'link',
                        title: 'forwarded once',
                        onClick: consumerClick,
                    });
                },
            }),
        );
        await nextTick();

        const root = container.firstElementChild as HTMLElement;
        const label = root.firstElementChild as HTMLElement;
        expect([...root.classList]).toEqual([
            'internal',
            'compatibility',
            'ready',
            'consumer',
            'active',
            'root-attr',
            'selected',
        ]);
        expect(root.style.color).toBe('purple');
        expect(root.style.padding).toBe('2px');
        expect(root.style.margin).toBe('4px');
        expect(root.getAttribute('role')).toBe('button');
        expect(root.getAttribute('title')).toBe('forwarded once');
        expect(label.hasAttribute('title')).toBe(false);
        expect(label.classList.contains('consumer-label')).toBe(true);
        expect(label.style.fontWeight).toBe('600');

        root.click();
        expect(order).toEqual(['internal', 'consumer']);

        classNames.value = { root: 'updated' };
        styles.value = { root: { color: 'teal' } };
        await nextTick();
        expect(root.classList.contains('updated')).toBe(true);
        expect(root.style.color).toBe('purple');
    });
});
